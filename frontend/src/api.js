const BASE =
  (import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL.trim()) ||
  'http://127.0.0.1:8000'

export async function analyzeCall(transcript) {
  const url = `${BASE}/analyze_call`
  const body = { transcript }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const text = await res.text().catch(() => null)
    throw new Error(`Server error ${res.status}: ${text || res.statusText}`)
  }

  const data = await res.json()
  return data
}
