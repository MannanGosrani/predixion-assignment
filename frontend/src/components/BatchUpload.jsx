import React, { useState, useRef } from "react";
import { analyzeCall } from "../api";
import BatchResults from "./BatchResults";
import { parseCsvRows } from "../utils/csv";

/**
 * BatchUpload
 * - Expects CSV with header containing "id" and "transcript" (case-insensitive)
 * - Will call analyzeCall(transcript) for each row, with concurrency control
 * - Shows progress bar and result table, and allows CSV export
 */
export default function BatchUpload() {
  const [rows, setRows] = useState([]); // [{ id, transcript }]
  const [results, setResults] = useState([]); // [{ id, transcript, status, insights, error }]
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const fileRef = useRef(null);

  async function handleFile(file) {
    setResults([]);
    setRows([]);
    setProgress({ done: 0, total: 0 });
    setRunning(false);

    if (!file) return;
    const text = await file.text();
    const parsed = parseCsvRows(text); // returns array of objects
    // filter rows that have at least transcript
    const normalized = parsed
      .map((r, i) => ({
        id: r.id ?? r.ID ?? r.Id ?? String(i + 1),
        transcript: (r.transcript ?? r.Transcript ?? r.TRANSCRIPT ?? "").trim(),
      }))
      .filter((r) => r.transcript.length > 0);

    if (normalized.length === 0) {
      alert("No valid rows with a 'transcript' column found in CSV.");
      return;
    }

    setRows(normalized);
    setResults(normalized.map((r) => ({ ...r, status: "pending" })));
  }

  // concurrency-limited runner
  async function runBatch(concurrency = 3) {
    setRunning(true);
    setProgress({ done: 0, total: rows.length });

    const out = results.slice(); // copy
    let idx = 0;

    async function worker() {
      while (true) {
        let current;
        // grab next index atomically
        if (idx >= rows.length) break;
        current = idx;
        idx++;

        const row = rows[current];
        try {
          // call existing analyzeCall API which returns JSON
          const res = await analyzeCall(row.transcript);
          out[current] = {
            ...row,
            status: "done",
            insights: res.insights ?? res, // depends on your API response format
            raw: res,
            error: null,
          };
        } catch (err) {
          out[current] = {
            ...row,
            status: "error",
            insights: null,
            raw: null,
            error: err?.message ?? String(err),
          };
        }
        // update progress
        setResults([...out]);
        setProgress((p) => ({ ...p, done: p.done + 1 }));
      }
    }

    // start workers
    const workers = Array.from({ length: Math.min(concurrency, rows.length) }, () =>
      worker()
    );
    await Promise.all(workers);
    setRunning(false);
    setResults([...out]);
  }

  function handleUploadClick(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    handleFile(f);
    // reset input so same file can be re-uploaded later
    fileRef.current.value = "";
  }

  function handleStart() {
    if (!rows || rows.length === 0) {
      alert("Upload a CSV first with columns id, transcript");
      return;
    }
    // run with concurrency 3 (you can change)
    runBatch(3);
  }

  function handleClear() {
    setRows([]);
    setResults([]);
    setProgress({ done: 0, total: 0 });
    setRunning(false);
  }

  return (
    <div className="batch-upload-card" style={{ padding: 16, borderRadius: 8 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleUploadClick}
          disabled={running}
        />
        <button onClick={handleStart} disabled={running || rows.length === 0}>
          Start Batch
        </button>
        <button onClick={handleClear} disabled={running && rows.length === 0}>
          Clear
        </button>
        <div style={{ marginLeft: "auto", fontSize: 13, color: "#666" }}>
          Rows: {rows.length} • Done: {progress.done}/{progress.total}
        </div>
      </div>

      {/* progress bar */}
      <div style={{ height: 10, background: "#eee", borderRadius: 6, overflow: "hidden", marginBottom: 12 }}>
        <div
          style={{
            width: progress.total ? `${(progress.done / progress.total) * 100}%` : "0%",
            height: "100%",
            transition: "width 200ms",
            background: "#2b7cff",
          }}
        />
      </div>

      {/* results table */}
      <BatchResults rows={results} running={running} />
    </div>
  );
}
