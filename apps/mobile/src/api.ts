import * as SecureStore from "expo-secure-store";

/** Read API base URL from Expo env (EXPO_PUBLIC_API_URL). */
const ENV_URL =
  (typeof process !== "undefined" && (process as any).env?.EXPO_PUBLIC_API_URL) ||
  (typeof window !== "undefined" && (window as any).EXPO_PUBLIC_API_URL) ||
  "";

export const API_URL = ENV_URL;

export type Me = { id: number; email: string; name: string | null };

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Login failed (${res.status}): ${text}`);
  }
  const json = await res.json();
  const token = json?.access_token as string | undefined;
  if (!token) throw new Error("No access_token in response");
  return token;
}

export async function signup(email: string, name: string | null, password: string): Promise<void> {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name, password }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Signup failed (${res.status}): ${text}`);
  }
}

export async function getMe(token: string): Promise<Me> {
  const res = await fetch(`${API_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET /me failed (${res.status}): ${text}`);
  }
  return (await res.json()) as Me;
}

/* Token storage with web fallback */
const KEY = "auth_token";
const isWeb = typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export async function saveToken(token: string) {
  if (isWeb) { window.localStorage.setItem(KEY, token); return; }
  await SecureStore.setItemAsync(KEY, token);
}

export async function loadToken(): Promise<string | null> {
  if (isWeb) return window.localStorage.getItem(KEY);
  try { return await SecureStore.getItemAsync(KEY); } catch { return null; }
}

export async function clearToken() {
  if (isWeb) { window.localStorage.removeItem(KEY); return; }
  await SecureStore.deleteItemAsync(KEY);
}

/* ----- Focus sessions API ----- */
export type Session = {
  id: number;
  started_at: string;          // ISO
  ended_at: string | null;     // ISO | null
  duration_sec: number | null;
  is_pomodoro: boolean;
  note: string | null;
};

export async function startSession(
  token: string,
  is_pomodoro: boolean,
  note?: string | null
): Promise<Session> {
  const res = await fetch(`${API_URL}/sessions/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ is_pomodoro, note: note ?? null }),
  });
  if (!res.ok) throw new Error(`startSession failed (${res.status})`);
  return (await res.json()) as Session;
}

export async function finishSession(
  token: string,
  session_id: number
): Promise<Session> {
  const res = await fetch(`${API_URL}/sessions/finish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ session_id }),
  });
  if (!res.ok) throw new Error(`finishSession failed (${res.status})`);
  return (await res.json()) as Session;
}

export async function mySessions(token: string, limit = 5): Promise<Session[]> {
  const res = await fetch(`${API_URL}/sessions/my?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`mySessions failed (${res.status})`);
  return (await res.json()) as Session[];
}

/* Persist active session so timer survives refresh */
const ACTIVE_KEY = "active_session";
export type ActiveSessionPersist = { id: number; started_at: string };

export async function saveActiveSession(s: ActiveSessionPersist) {
  if (isWeb) {
    window.localStorage.setItem(ACTIVE_KEY, JSON.stringify(s));
  } else {
    await SecureStore.setItemAsync(ACTIVE_KEY, JSON.stringify(s));
  }
}

export async function loadActiveSession(): Promise<ActiveSessionPersist | null> {
  try {
    const raw = isWeb
      ? window.localStorage.getItem(ACTIVE_KEY)
      : await SecureStore.getItemAsync(ACTIVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export async function clearActiveSession() {
  if (isWeb) {
    window.localStorage.removeItem(ACTIVE_KEY);
  } else {
    await SecureStore.deleteItemAsync(ACTIVE_KEY);
  }
}
