const BASE =
  (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim()) ||
  'http://127.0.0.1:8000';

export async function analyzeCall(transcript) {
  const url = `${BASE}/analyze_call`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(`Server error ${res.status}: ${text || res.statusText}`);
  }

  return await res.json();
}
