import React, { useState } from 'react'
import TranscriptForm from './components/TranscriptForm'
import ResultCard from './components/ResultCard'
import { analyzeCall } from './api'

export default function App() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function handleAnalyze(transcript) {
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const res = await analyzeCall(transcript)
      setResult(res)
    } catch (err) {
      setError(err.message || 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">Conversational Insights</div>
        <div className="subtitle">Financial / Debt Collection · Demo</div>
        <div className="sidebar-footer">Predixion Assignment</div>
      </aside>

      <main className="content">
        <header className="topbar">
          <h1>Analyze Call Transcript</h1>
          <p className="top-sub">Paste a transcript and get structured insights</p>
        </header>

        <section className="grid">
          <div className="col form-col">
            <TranscriptForm onAnalyze={handleAnalyze} loading={loading} />
            {error && <div className="error">{error}</div>}
          </div>

          <div className="col results-col">
            <ResultCard record={result} />
            {!result && !loading && (
              <div className="placeholder">Results will appear here</div>
            )}
          </div>
        </section>

        <footer className="footer">
          <small>Built for evaluation — minimal, clean, and production-minded.</small>
        </footer>
      </main>
    </div>
  )
}
