const BASE =
  (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim()) ||
  "http://127.0.0.1:8000";

/**
 * Analyze single transcript
 * @param {string} transcript
 */
export async function analyzeCall(transcript) {
  const API_URL = (import.meta.env.VITE_API_URL || BASE).replace(/\/+$/, "") + "/analyze_call";

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(`Server error ${res.status}: ${text || res.statusText}`);
  }

  return await res.json();
}

/**
 * Upload CSV file for batch processing
 * @param {File} file
 */
export async function analyzeCSV(file) {
  if (!file) throw new Error("No file provided");

  const API_URL = (import.meta.env.VITE_API_URL || BASE).replace(/\/+$/, "") + "/analyze_csv";

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(API_URL, {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(`Server error ${res.status}: ${text || res.statusText}`);
  }

  return await res.json();
}
