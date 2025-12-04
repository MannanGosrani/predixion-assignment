Here is your **README.md** in perfect Markdown format — **you can directly paste this entire content into the GitHub editor** you showed in the screenshot.

---

# 🎧 Conversational Insights — Debt Collection Call Analysis

A full-stack application that analyzes call transcripts (single or batch CSV) and returns structured insights such as customer intent, sentiment, action required, and a concise summary.

---

## Overview

This project was built as part of the Predixion assignment to demonstrate the ability to design a production-minded system capable of analyzing financial/debt-collection conversations.
It processes both **single call transcripts** and **batch CSV uploads**, generating AI-powered insights with clean UI visualization.

---

## Features

### **1. Single Transcript Analysis**

Paste any call transcript (Hindi, English, or Hinglish) and receive:

* Customer intent
* Sentiment score
* Whether action is required
* Summary of the conversation

### **2. Batch CSV Upload (Multiple Transcripts)**

Upload a CSV containing:

```
id, transcript
```

The app processes each transcript sequentially and displays:

* Status (processing / done)
* Intent
* Sentiment
* Action required
* Summary
* Full transcript view
* Exportable CSV output

### **3. Clean, Responsive UI**

Includes:

* Sidebar navigation
* Insights panel
* Batch upload section
* Scrollable results table

### **4. Backend AI Processing**

* Built with **FastAPI**
* Uses **OpenAI GPT model** for insights extraction
* Provides two API endpoints:

  * `/analyze` — single transcript
  * `/analyze_csv` — batch CSV

### **5. Deployment**

* **Frontend deployed on Vercel**
* **Backend deployed on Railway**

---

## Tech Stack

### **Frontend**

* React (Vite)
* Tailwind / custom CSS
* Fetch API for backend communication
* Vercel analytics support

### **Backend**

* FastAPI
* Python
* python-multipart (file handling)
* OpenAI SDK

### **DevOps**

* GitHub for version control
* Vercel for frontend hosting
* Railway for backend hosting

---

## Project Structure

```
predixion-assignment/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TranscriptForm.jsx
│   │   │   ├── ResultCard.jsx
│   │   │   ├── BatchUpload.jsx
│   │   ├── App.jsx
│   │   ├── api.js
│   └── ...
│
└── backend/
    ├── main.py
    ├── requirements.txt
    └── ...
```

---

## API Endpoints

### **POST /analyze**

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

---

### **POST /analyze_csv**

* Accepts a CSV file
* Returns an array of structured results

---

## Running Locally

### **1. Backend**

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### **2. Frontend**

```bash
cd frontend
npm install
npm run dev
```

---

## How It Works

1. User uploads/pastes transcript(s)
2. Frontend sends request to backend
3. Backend feeds transcript into GPT model
4. GPT extracts:

   * Intent
   * Sentiment
   * Summary
   * Action requirement
5. Results are sent back to frontend
6. UI renders clean insight cards and batch tables

---

## Batch Processing Flow

* CSV is parsed in the browser (PapaParse)
* Each transcript is sent to backend
* UI dynamically updates each row
* Full results become available for export

---

## Troubleshooting

If batch upload fails:

* Ensure CSV includes a **transcript** column
* Remove extra commas or missing quotes
* Check that backend URL is correct inside `api.js`

---

## Future Improvements

* Authentication
* Advanced sentiment scoring
* Multi-language speech-to-text integration
* Dashboard analytics

---

## Author

**Mannan Gosrani**
BTech Computer Engineering — NMIMS MPSTME
Skilled in Python, JavaScript, ML, Web Development, NLP

---

## If you like this project…

Feel free to star the repository or share feedback!

---

Let me know if you want your README enriched with images, architecture diagrams, badges, or GIF demos.
