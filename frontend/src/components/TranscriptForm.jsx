import React, { useState } from 'react'

export default function TranscriptForm({ onAnalyze, loading }) {
  const [transcript, setTranscript] = useState('')

  return (
    <div className="form-shell">
      <label className="label">Transcript</label>
      <textarea
        className="textarea"
        placeholder="Paste the call transcript here..."
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        rows={10}
      />
      <div className="actions">
        <button
          className="btn primary"
          disabled={loading || !transcript.trim()}
          onClick={() => onAnalyze(transcript.trim())}
        >
          {loading ? 'Analyzing…' : 'Analyze Call'}
        </button>
        <button
          className="btn ghost"
          onClick={() => setTranscript('')}
          disabled={loading}
        >
          Clear
        </button>
      </div>
      <p className="hint">Tip: For best results use the full transcript. Hinglish is supported.</p>
    </div>
  )
}
