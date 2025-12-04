import React, { useMemo } from "react";
import { downloadCsv } from "../utils/csv";

export default function BatchResults({ rows = [], running }) {
  const ready = rows && rows.length > 0;

  // prepare CSV export content
  const exportRows = useMemo(() => {
    return rows.map((r) => ({
      id: r.id,
      transcript: r.transcript,
      status: r.status,
      customer_intent: r.insights?.customer_intent ?? "",
      sentiment: r.insights?.sentiment ?? "",
      action_required: r.insights?.action_required ?? "",
      summary: r.insights?.summary ?? "",
      error: r.error ?? "",
    }));
  }, [rows]);

  return (
    <div className="batch-results" style={{ marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>Batch Results</h3>
        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={() => downloadCsv(exportRows, "batch_results.csv")}
            disabled={!ready || rows.length === 0}
          >
            Export CSV
          </button>
        </div>
      </div>

      {!ready && <div style={{ color: "#666" }}>No results yet — upload a CSV and press Start.</div>}

      {ready && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #e6e6e6" }}>
                <th style={{ padding: "8px 6px" }}>ID</th>
                <th>Transcript (truncated)</th>
                <th>Status</th>
                <th>Intent</th>
                <th>Sentiment</th>
                <th>Action Req.</th>
                <th>Summary (truncated)</th>
                <th style={{ width: 120 }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ix) => (
                <tr key={ix} style={{ borderBottom: "1px solid #f3f3f3" }}>
                  <td style={{ padding: "8px 6px", verticalAlign: "top" }}>{r.id}</td>
                  <td style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.transcript}
                  </td>
                  <td style={{ padding: 8 }}>{r.status}</td>
                  <td style={{ padding: 8 }}>{r.insights?.customer_intent ?? "-"}</td>
                  <td style={{ padding: 8 }}>{r.insights?.sentiment ?? "-"}</td>
                  <td style={{ padding: 8 }}>{String(r.insights?.action_required ?? "-")}</td>
                  <td style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.insights?.summary ?? "-"}
                  </td>
                  <td style={{ padding: 8 }}>
                    <details>
                      <summary style={{ cursor: "pointer" }}>View</summary>
                      <div style={{ marginTop: 6 }}>
                        <strong>Transcript:</strong>
                        <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{r.transcript}</pre>
                        <hr />
                        <strong>Insights / Raw:</strong>
                        <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
                          {r.raw ? JSON.stringify(r.raw, null, 2) : r.error ?? "No details"}
                        </pre>
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {running && (
        <div style={{ marginTop: 8, color: "#666", fontSize: 13 }}>
          Processing... This may take a while depending on the number of rows and API rate limits.
        </div>
      )}
    </div>
  );
}
