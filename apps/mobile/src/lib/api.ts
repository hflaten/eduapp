const API_BASE =
  (typeof process !== "undefined" && (process as any).env?.EXPO_PUBLIC_API_URL) ||
  (globalThis as any).EXPO_PUBLIC_API_URL ||
  "";

const TOKEN_KEY = "token";

export function saveToken(t: string) {
  try { localStorage.setItem(TOKEN_KEY, t); } catch {}
}
export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch {}
}

function authHeader() {
  const raw = getToken() || "";
  const val = raw.startsWith("Bearer ") ? raw : (raw ? `Bearer ${raw}` : "");
  return val ? { Authorization: val } : {};
}

export async function login(email: string, password: string) {
  const r = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) throw await r.json().catch(() => ({ status: r.status }));
  const data = await r.json();
  if (data?.access_token) saveToken(data.access_token);
  return data;
}

export async function me() {
  const r = await fetch(`${API_BASE}/me`, { headers: { ...authHeader() } });
  if (!r.ok) throw await r.json().catch(() => ({ status: r.status }));
  return r.json();
}

export async function startSession(isPomodoro = true, note = "") {
  const r = await fetch(`${API_BASE}/sessions/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ is_pomodoro: isPomodoro, note }),
  });
  if (!r.ok) throw await r.json().catch(() => ({ status: r.status }));
  return r.json();
}
