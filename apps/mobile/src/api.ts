const RAW_API =
  (typeof process !== "undefined" && (process as any).env?.EXPO_PUBLIC_API_URL) ||
  (typeof window !== "undefined" && (window as any).EXPO_PUBLIC_API_URL) ||
  "/api";

const API = RAW_API.replace(/\/$/, ""); // no trailing slash

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// ---- token helpers (web) ----
export function saveToken(token: string) {
  if (typeof localStorage !== "undefined") localStorage.setItem("token", token);
}
export function loadToken(): string | null {
  return typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
}
export function clearToken() {
  if (typeof localStorage !== "undefined") localStorage.removeItem("token");
}

// ---- auth ----
export async function login(email: string, password: string) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return asJson<{ access_token: string; token_type: string }>(res);
}
export async function signup(email: string, name: string, password: string) {
  const res = await fetch(`${API}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name, password }),
  });
  return asJson<{ id: number; email: string; name: string }>(res);
}
export async function getMe(token: string) {
  const res = await fetch(`${API}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return asJson<{ id: number; email: string; name: string }>(res);
}

// ---- sessions ----
export async function startSession(
  token: string,
  isPomodoro = true,
  note?: string | null
) {
  const res = await fetch(`${API}/sessions/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ is_pomodoro: isPomodoro, note: note ?? null }),
  });
  return asJson<{ id: number; started_at: string; is_pomodoro: boolean; note: string | null }>(res);
}

export async function finishSession(token: string, session_id: number) {
  const res = await fetch(`${API}/sessions/finish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ session_id }),
  });
  return asJson<{ id: number; ended_at: string; duration_sec: number | null }>(res);
}

export async function mySessions(token: string, limit = 5) {
  const res = await fetch(`${API}/sessions/my?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return asJson<any[]>(res);
}

// Provide BOTH named and default exports so existing imports keep working
const api = {
  saveToken,
  loadToken,
  clearToken,
  login,
  signup,
  getMe,
  startSession,
  finishSession,
  mySessions,
};
export default api;
