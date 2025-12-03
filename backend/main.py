import os
import json
import logging
import time
import asyncio
import csv
from typing import Optional, List, Dict, Any

from dotenv import load_dotenv
from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException, UploadFile, File, status
from fastapi.middleware.cors import CORSMiddleware
import asyncpg

# Load env vars
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY missing")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL missing")

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("conversational-insights")

# Google GenAI - new SDK
from google import genai
client = genai.Client(api_key=GEMINI_API_KEY)  # <-- fixed unmatched paren

# --------- FastAPI ----------
app = FastAPI(title="Conversational Insights Generator")

# CORS middleware: allow your frontend origin(s)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Consider restricting this to your Vercel URL in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.db: Optional[asyncpg.pool.Pool] = None

# --------- Pydantic Models ----------
class CallInsight(BaseModel):
    customer_intent: str
    sentiment: str
    action_required: bool
    summary: str

class TranscriptInput(BaseModel):
    transcript: str = Field(..., min_length=1)

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS call_records (
    id SERIAL PRIMARY KEY,
    transcript TEXT NOT NULL,
    intent TEXT NOT NULL,
    sentiment TEXT NOT NULL,
    summary TEXT NOT NULL,
    action_required BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
"""

# --------- Startup / Shutdown ----------
@app.on_event("startup")
async def startup():
    logger.info("Creating DB pool...")
    app.state.db = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=5)
    async with app.state.db.acquire() as conn:
        await conn.execute(CREATE_TABLE_SQL)
    logger.info("Startup complete.")

@app.on_event("shutdown")
async def shutdown():
    if app.state.db:
        await app.state.db.close()

# --------- LLM Logic ----------
async def generate_insights(transcript: str) -> CallInsight:
    prompt = f"""
You are an expert financial debt collection analyst.

Return ONLY a JSON object with EXACT keys:

{{
  "customer_intent": "string",
  "sentiment": "Negative | Neutral | Positive",
  "action_required": true or false,
  "summary": "string"
}}

Transcript:
{transcript}
"""
    response = None
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
            )
            break  # success
        except Exception as e:
            # handle rate limit or transient errors
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                wait_time = 2 * (attempt + 1)
                logger.warning(f"Rate limit hit. Retrying in {wait_time}s...")
                await asyncio.sleep(wait_time)
                continue
            logger.exception("Gemini API error")
            raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")

    if not response:
        raise HTTPException(status_code=500, detail="Gemini unreachable after retries")

    text = response.text.strip()

    # Remove markdown fences if present
    if text.startswith("```"):
        text = text.replace("```json", "").replace("```", "").strip()

    # extract JSON substring
    start = text.find("{")
    end = text.rfind("}") + 1
    if start == -1 or end == -1:
        logger.error("AI did not return JSON", text)
        raise HTTPException(status_code=500, detail="AI did not return valid JSON")

    json_str = text[start:end]
    try:
        data = json.loads(json_str)
        return CallInsight(**data)
    except Exception as e:
        logger.error("Invalid AI output: %s", text)
        raise HTTPException(status_code=500, detail="AI did not return valid JSON")

# --------- API Routes ----------
@app.post("/analyze_call")
async def analyze_call(payload: TranscriptInput):
    insights = await generate_insights(payload.transcript)

    insert_sql = """
    INSERT INTO call_records (transcript, intent, sentiment, summary, action_required)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id;
    """

    async with app.state.db.acquire() as conn:
        rec_id = await conn.fetchval(
            insert_sql,
            payload.transcript,
            insights.customer_intent,
            insights.sentiment,
            insights.summary,
            insights.action_required,
        )

    return {"record_id": rec_id, "insights": insights.dict()}

@app.get("/health")
async def health():
    return {"status": "ok"}

# --------- New: CSV batch endpoint ----------
async def _process_row(semaphore: asyncio.Semaphore, row_id: Optional[str], transcript: str, conn) -> Dict[str, Any]:
    """Process single row: generate insights and insert into DB. Returns dict result."""
    async with semaphore:
        insights = await generate_insights(transcript)

        insert_sql = """
        INSERT INTO call_records (transcript, intent, sentiment, summary, action_required)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id;
        """

        rec_id = await conn.fetchval(
            insert_sql,
            transcript,
            insights.customer_intent,
            insights.sentiment,
            insights.summary,
            insights.action_required,
        )

        return {
            "uploaded_id": row_id,
            "db_record_id": rec_id,
            "insights": insights.dict()
        }

@app.post("/analyze_csv")
async def analyze_csv(file: UploadFile = File(...)):
    """
    Accepts a CSV with columns: id,transcript
    Returns list of results for each row.
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only CSV files are allowed")

    # read file
    contents = await file.read()
    try:
        text = contents.decode("utf-8")
    except UnicodeDecodeError:
        # try latin-1 fallback
        text = contents.decode("latin-1")

    lines = text.splitlines()
    reader = csv.DictReader(lines)

    # use bounded concurrency to avoid rate-limit bursts
    concurrency = int(os.getenv("CSV_CONCURRENCY", "3"))
    semaphore = asyncio.Semaphore(concurrency)

    tasks = []
    results = []
    async with app.state.db.acquire() as conn:
        for row in reader:
            row_id = row.get("id") or row.get("ID") or row.get("Idx")
            transcript = row.get("transcript") or row.get("Transcript") or row.get("text")
            if not transcript:
                logger.warning("Skipping row with no transcript: %s", row)
                continue
            task = asyncio.create_task(_process_row(semaphore, row_id, transcript, conn))
            tasks.append(task)

        # gather results (will run concurrently up to concurrency limit)
        if tasks:
            for coro in asyncio.as_completed(tasks):
                try:
                    r = await coro
                    results.append(r)
                except Exception as e:
                    logger.exception("Error processing row: %s", e)
                    # include failure placeholder for visibility
                    results.append({"error": str(e)})

    return {"results": results}
