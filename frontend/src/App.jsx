import React, { useState } from 'react';
import TranscriptForm from './components/TranscriptForm';
import ResultCard from './components/ResultCard';
import BatchUpload from './components/BatchUpload';
import { analyzeCall } from './api';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleAnalyze(transcript) {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await analyzeCall(transcript);
      setResult(res);
    } catch (err) {
      setError(err.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="shell">
        <aside className="sidebar">
          <div className="brand">Conversational Insights</div>
          <div className="subtitle">Financial / Debt Collection · Demo</div>
          <div className="sidebar-footer">Predixion Assignment</div>
        </aside>

        <main className="content">
          <header className="topbar">
            <h1>Analyze Call Transcript</h1>
            <p className="top-sub">Paste a transcript or upload a CSV file for batch analysis</p>
          </header>

          <section className="analysis-grid">
            <div className="left-panel">
              <TranscriptForm onAnalyze={handleAnalyze} loading={loading} />
              {error && <div className="error">{error}</div>}
            </div>

            <div className="right-panel">
              <ResultCard record={result} />
              {!result && !loading && (
                <div className="placeholder">Insights will appear here</div>
              )}
            </div>
          </section>

          <div style={{ marginTop: "40px" }}>
            <h2 style={{ marginBottom: "12px" }}>Batch Upload</h2>
            <BatchUpload />
          </div>

          <footer className="footer">
            <small>Built for evaluation — minimal, clean, and production-minded.</small>
          </footer>
        </main>
      </div>

      <Analytics />
      <SpeedInsights />
    </>
  );
}
