import React, { useState } from "react";
import Papa from "papaparse";

export default function BatchUpload() {
  const [rows, setRows] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async function (results) {
        const data = results.data;

        if (!data.length || !data[0].transcript) {
          alert("CSV must contain a 'transcript' column.");
          return;
        }

        const enriched = data.map((row, idx) => ({
          id: row.id || idx + 1,
          transcript: row.transcript,
          status: "pending", // pending → processing → done
          result: null
        }));

        setRows(enriched);

        // Processing each transcript sequentially
        for (let i = 0; i < enriched.length; i++) {
          enriched[i].status = "processing";
          setRows([...enriched]);

          try {
            const res = await fetch("https://predixion-assignment-production.up.railway.app/analyze_call", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ transcript: enriched[i].transcript })
            });

            const json = await res.json();
            enriched[i].result = json.insights;
            enriched[i].status = "done";
          } catch (err) {
            enriched[i].status = "failed";
          }

          setRows([...enriched]);
        }
      }
    });
  };

  const openRowDetails = (row) => setSelectedRow(row);
  const closeModal = () => setSelectedRow(null);

  const getStatusDot = (status) => {
    switch (status) {
      case "pending":
        return <span style={dotStyle("#999")} />;
      case "processing":
        return <span style={dotStyle("#e0a800")} />;
      case "done":
        return <span style={dotStyle("#28a745")} />;
      case "failed":
        return <span style={dotStyle("#dc3545")} />;
      default:
        return <span style={dotStyle("#999")} />;
    }
  };

  const dotStyle = (color) => ({
    display: "inline-block",
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    backgroundColor: color
  });

  return (
    <div style={{ width: "100%", marginTop: "2rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <input type="file" accept=".csv" onChange={handleCSVUpload} />
      </div>

      <h2 style={{ marginBottom: "1rem" }}>Batch Results</h2>

      <div style={{ width: "100%", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
          <thead>
            <tr>
              <th style={th}>ID</th>
              <th style={th}>Transcript</th>
              <th style={th}>Status</th>
              <th style={th}>Intent</th>
              <th style={th}>Sentiment</th>
              <th style={th}>Action Req.</th>
              <th style={th}>Summary</th>
              <th style={th}>Details</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td style={td}>{row.id}</td>

                <td style={td}>
                  <div style={{ maxWidth: "260px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {row.transcript}
                  </div>
                </td>

                <td style={{ ...td, textAlign: "center" }}>{getStatusDot(row.status)}</td>

                <td style={td}>{row.result?.customer_intent || "—"}</td>
                <td style={td}>{row.result?.sentiment || "—"}</td>
                <td style={td}>{String(row.result?.action_required) || "—"}</td>

                <td style={td}>
                  <div style={{ maxWidth: "260px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {row.result?.summary || "—"}
                  </div>
                </td>

                <td style={td}>
                  <button
                    onClick={() => openRowDetails(row)}
                    style={{
                      background: "none",
                      color: "#007bff",
                      border: "none",
                      cursor: "pointer",
                      textDecoration: "underline"
                    }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedRow && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3>Transcript Details</h3>
            <p><strong>ID:</strong> {selectedRow.id}</p>
            <p><strong>Status:</strong> {selectedRow.status}</p>

            {selectedRow.result && (
              <>
                <p><strong>Intent:</strong> {selectedRow.result.customer_intent}</p>
                <p><strong>Sentiment:</strong> {selectedRow.result.sentiment}</p>
                <p><strong>Action Required:</strong> {String(selectedRow.result.action_required)}</p>
                <p><strong>Summary:</strong> {selectedRow.result.summary}</p>
              </>
            )}

            <p><strong>Transcript:</strong><br />{selectedRow.transcript}</p>

            <button onClick={closeModal} style={modalClose}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const th = {
  padding: "10px",
  borderBottom: "2px solid #ccc",
  textAlign: "left",
  background: "#f7f7f7"
};

const td = {
  padding: "10px",
  borderBottom: "1px solid #ddd",
  verticalAlign: "top"
};

const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000
};

const modalBox = {
  width: "450px",
  background: "#fff",
  padding: "20px",
  borderRadius: "8px",
  boxShadow: "0 0 10px rgba(0,0,0,0.3)"
};

const modalClose = {
  marginTop: "1rem",
  padding: "8px 16px",
  backgroundColor: "#333",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer"
};
