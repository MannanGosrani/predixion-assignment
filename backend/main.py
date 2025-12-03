import os
import json
import logging
import time
from typing import Optional

from dotenv import load_dotenv
from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import asyncpg

# Create app FIRST
app = FastAPI(title="Conversational Insights Generator")

# Then enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],    
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load env vars
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY missing")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL missing")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("conversational-insights")

from google import genai
client = genai.Client(api_key=GEMINI_API_KEY)

class CallInsight(BaseModel):
    customer_intent: str
    sentiment: str
    action_required: bool
    summary: str

class TranscriptInput(BaseModel):
    transcript: str = Field(..., min_length=1)

app.state.db: Optional[asyncpg.pool.Pool] = None

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

@app.on_event("startup")
async def startup():
    logger.info("Creating DB pool...")
    app.state.db = await asyncpg.create_pool(DATABASE_URL)
    async with app.state.db.acquire() as conn:
        await conn.execute(CREATE_TABLE_SQL)
    logger.info("Startup complete.")

@app.on_event("shutdown")
async def shutdown():
    if app.state.db:
        await app.state.db.close()

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
            break
        except Exception as e:
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                time.sleep(2 * (attempt + 1))
                continue
            raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")

    if not response:
        raise HTTPException(status_code=500, detail="Gemini unreachable after retries")

    text = response.text.strip()

    if text.startswith("```"):
        text = text.replace("```json", "").replace("```", "").strip()

    start = text.find("{")
    end = text.rfind("}") + 1

    try:
        data = json.loads(text[start:end])
        return CallInsight(**data)
    except:
        raise HTTPException(status_code=500, detail="AI did not return valid JSON")

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
