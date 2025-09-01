const API = (typeof process !== "undefined" && (process as any).env?.EXPO_PUBLIC_API_URL)
  || (globalThis as any).EXPO_PUBLIC_API_URL
  || "";

if (!API) console.warn("EXPO_PUBLIC_API_URL is empty; set it on Vercel to the Render URL.");

async function request(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  if (!res.ok) {
    // Make error messages readable, not “[object Object]”
    let msg = `${res.status}`;
    try {
      const j = await res.json();
      msg += " " + (j?.detail ?? JSON.stringify(j));
    } catch {
      try { msg += " " + (await res.text()); } catch {}
    }
    throw new Error(msg);
  }
  return res.json();
}

/** --------- Auth --------- */
export async function login(email: string, password: string):
  Promise<{ access_token: string; token_type: string; }> {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function saveToken(t: string) {
  try { localStorage.setItem("jwt", t); } catch {}
}
export function getToken(): string | null {
  try { return localStorage.getItem("jwt"); } catch { return null; }
}
export function clearToken() {
  try { localStorage.removeItem("jwt"); } catch {}
}

/** --------- Me --------- */
export async function me() {
  const token = getToken();
  return request("/me", {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

/** --------- Sessions --------- */
export async function startSession(is_pomodoro: boolean, note?: string | null) {
  const token = getToken();
  return request("/sessions/start", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: JSON.stringify({ is_pomodoro, note: note ?? null }),
  });
}
export async function finishSession(session_id: number) {
  const token = getToken();
  return request("/sessions/finish", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: JSON.stringify({ session_id }),
  });
}
export async function mySessions(limit = 5) {
  const token = getToken();
  return request(`/sessions/my?limit=${limit}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}
