# Conversational Insights — Debt Collection Call Analysis

A full-stack application that analyzes customer–agent call transcripts (single or batch CSV) and returns structured insights including intent, sentiment, action required, and a concise summary.
Built as part of the Predixion AI Internship Technical Assignment.

---

## Overview

This project demonstrates an end-to-end AI pipeline for analyzing financial and debt-collection conversations. It supports both single transcript analysis and batch CSV processing, with a clean, responsive UI and fully deployed backend and frontend.

The backend performs LLM-based structured extraction using Google Gemini Flash 2.0, while the frontend presents insights in an intuitive format.

---

## Features

### 1. Single Transcript Analysis

Paste any call transcript (English, Hindi, or Hinglish) and receive:

* Customer intent
* Sentiment
* Action required
* Conversation summary

### 2. Batch CSV Upload (Multiple Transcripts)

Upload a CSV with:

```
id, transcript
```

The system processes each transcript and displays:

* Processing status
* Intent
* Sentiment
* Action required
* Summary
* Full transcript viewer
* Downloadable CSV output

### 3. Clean, Responsive UI

Includes:

* Sidebar navigation
* Single-analysis panel
* Batch upload workflow
* Scrollable results table
* Modal for detailed summary or transcript view

### 4. Backend AI Processing

* Built with FastAPI
* Uses Google Gemini LLM for structured outputs
* Provides two main endpoints:

  * `/analyze` for single transcript
  * `/analyze_csv` for batch CSV processing

---

## Deployment

* Frontend (Vercel): [https://predixion-assignment.vercel.app/](https://predixion-assignment.vercel.app/)
* Backend API (Swagger UI on Railway): [https://predixion-assignment-production.up.railway.app/docs](https://predixion-assignment-production.up.railway.app/docs)

---

## Tech Stack

### Frontend

* React (Vite)
* Tailwind / custom CSS
* Fetch API
* Vercel deployment

### Backend

* FastAPI
* Python
* asyncpg (PostgreSQL)
* python-multipart for file handling
* Google Gemini Flash 2.0
* Railway deployment

### Other

* GitHub for version control
* Railway PostgreSQL for persistence

---

## Project Structure

```
predixion-assignment/
│
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── TranscriptForm.jsx
│       │   ├── ResultCard.jsx
│       │   ├── BatchUpload.jsx
│       ├── App.jsx
│       ├── api.js
│       └── ...
│
└── backend/
    ├── main.py
    ├── models.py
    ├── database.py
    ├── requirements.txt
    └── ...
```

---

## API Endpoints

### POST /analyze

Request:

```json
{
  "transcript": "Agent: Hello..."
}
```

Response:

```json
{
  "intent": "...",
  "sentiment": "...",
  "action_required": false,
  "summary": "..."
}
```

### POST /analyze_csv

* Accepts a CSV file
* Returns an array of structured outputs
* Individual row failures do not break the entire batch

---

## Running Locally

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## How It Works

1. The user submits transcripts through the frontend.
2. The frontend sends requests to FastAPI endpoints.
3. The backend sends transcripts to Gemini using a structured-output prompt.
4. The LLM returns intent, sentiment, action requirement, and summary.
5. The backend returns structured JSON to the UI.
6. The UI displays insights and tables for batch results.
7. Data is stored in PostgreSQL for persistence.

---

## Batch Processing Flow

* CSV is parsed in the browser using PapaParse.
* Each transcript is sent individually to the backend.
* The table updates dynamically as each result is processed.
* Final results can be downloaded as a CSV.

---

## Troubleshooting

If batch upload fails:

* Ensure the CSV includes a transcript column
* Remove invalid commas or unmatched quotes
* Verify the backend URL in `api.js`

---

## Future Improvements

* Authentication and user accounts
* Multi-level sentiment scoring
* Speech-to-text integration
* Analytics dashboard for processed calls

---

## Author

**Mannan Gosrani**
BTech Computer Engineering, NMIMS MPSTME
Skills: Python, JavaScript, NLP, Web Development, Data Engineering

