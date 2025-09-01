// --- injected: session helpers for web ---
const API_BASE =
  (typeof process !== 'undefined' && (process.env?.EXPO_PUBLIC_API_URL as string | undefined))
  || 'https://eduapp-backend-83ot.onrender.com'; // direct to Render (CORS is configured)

function authHeaders(): Record<string, string> {
  try {
    const t =
      (typeof window !== 'undefined' &&
        (localStorage.getItem('access_token') || localStorage.getItem('token'))) || '';
    return t ? { Authorization: `Bearer ${t}` } : {};
  } catch { return {}; }
}

export async function startSession(is_pomodoro: boolean = true, note: string | null = null) {
  const res = await fetch(`${API_BASE}/sessions/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ is_pomodoro, note }),
  });
  if (!res.ok) throw new Error(`startSession failed: ${res.status}`);
  return res.json();
}

export async function finishSession(session_id: number) {
  const res = await fetch(`${API_BASE}/sessions/finish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ session_id }),
  });
  if (!res.ok) throw new Error(`finishSession failed: ${res.status}`);
  return res.json();
}
// --- end injected ---
