import React, { useState } from "react";
import Papa from "papaparse";
import "./BatchUpload.css";
import { analyzeCall } from "../api";

export default function BatchUpload() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  function handleCSVUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (parsed) => {
        const rows = parsed.data;

        if (!rows.length || !rows[0].transcript) {
          alert("No valid rows with a 'transcript' column found in CSV.");
          return;
        }

        setLoading(true);
        const batchResults = [];

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const transcript = row.transcript;

          try {
            const res = await analyzeCall(transcript);
            batchResults.push({
              id: row.id || i + 1,
              transcript,
              ...res,
            });
          } catch (err) {
            batchResults.push({
              id: row.id || i + 1,
              transcript,
              error: err.message,
            });
          }
        }

        setResults(batchResults);
        setLoading(false);
      },
    });
  }

  return (
    <div className="batch-wrapper">
      <h2>Batch Results</h2>

      <input type="file" accept=".csv" onChange={handleCSVUpload} />

      {loading && <p>Processing transcripts... please wait.</p>}

      {!loading && results.length > 0 && (
        <table className="batch-table">
          <thead>
            <tr>
              <th className="id-col">ID</th>
              <th>Transcript</th>
              <th className="intent-col">Intent</th>
              <th className="sentiment-col">Sentiment</th>
              <th className="action-col">Action Req.</th>
              <th className="summary-col">Summary</th>
              <th className="details-col">Details</th>
            </tr>
          </thead>

          <tbody>
            {results.map((r, idx) => (
              <tr key={idx}>
                <td>{r.id}</td>

                <td>
                  <div className="transcript-text">
                    {r.transcript.slice(0, 120)}...
                  </div>
                </td>

                <td>{r.intent || "—"}</td>
                <td>{r.sentiment || "—"}</td>
                <td>{String(r.action_required)}</td>

                <td>
                  <div className="summary-text">
                    {r.summary ? r.summary.slice(0, 130) : "—"}...
                  </div>
                </td>

                <td className="details-col">
                  <span
                    className="details-btn"
                    onClick={() => setSelected(r)}
                  >
                    View
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Details for ID {selected.id}</h3>
            <p><strong>Transcript:</strong><br />{selected.transcript}</p>
            <p><strong>Intent:</strong> {selected.intent}</p>
            <p><strong>Sentiment:</strong> {selected.sentiment}</p>
            <p><strong>Action Required:</strong> {String(selected.action_required)}</p>
            <p><strong>Summary:</strong><br />{selected.summary}</p>

            <button onClick={() => setSelected(null)} className="close-btn">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
