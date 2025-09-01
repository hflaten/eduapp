/* Web-safe API client & token helpers */

type Json = Record<string, any>;

const DEFAULT_API = "https://eduapp-backend-83ot.onrender.com";
const API_BASE: string =
  (typeof process !== "undefined" &&
    (process.env as any)?.EXPO_PUBLIC_API_URL) ||
  (typeof (globalThis as any).EXPO_PUBLIC_API_URL === "string"
    ? (globalThis as any).EXPO_PUBLIC_API_URL
    : DEFAULT_API);

const TOKEN_KEY = "access_token";

/** Save JWT token (web = localStorage; native = AsyncStorage if present) */
export async function saveToken(token: string): Promise<void> {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const AsyncStorage = require("@react-native-async-storage/async-storage")
      .default;
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore if not available */
  }
}

/** Load JWT token */
export async function loadToken(): Promise<string | null> {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage.getItem(TOKEN_KEY);
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const AsyncStorage = require("@react-native-async-storage/async-storage")
      .default;
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Clear JWT token */
export async function clearToken(): Promise<void> {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.removeItem(TOKEN_KEY);
    return;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const AsyncStorage = require("@react-native-async-storage/async-storage")
      .default;
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

async function http<T = any>(
  path: string,
  opts: RequestInit = {},
  auth = false
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> | undefined),
  };

  if (auth) {
    const t = await loadToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as T) : ({} as T);

  if (!res.ok) {
    const msg =
      (data as any)?.detail ||
      (data as any)?.message ||
      `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return data;
}

/* ---------- Auth ---------- */
export async function signup(payload: {
  email: string;
  name: string;
  password: string;
}) {
  return http<Json>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function login(payload: { email: string; password: string }) {
  // Returns { access_token, token_type }
  return http<Json>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function me() {
  return http<Json>("/me", { method: "GET" }, true);
}

/* ---------- Sessions ---------- */
export async function startSession(payload: {
  is_pomodoro?: boolean;
  note?: string | null;
}) {
  return http<Json>(
    "/sessions/start",
    { method: "POST", body: JSON.stringify(payload ?? {}) },
    true
  );
}

export async function finishSession(payload: { session_id: number }) {
  return http<Json>(
    "/sessions/finish",
    { method: "POST", body: JSON.stringify(payload) },
    true
  );
}

export async function mySessions(limit = 5) {
  return http<Json>(`/sessions/my?limit=${limit}`, { method: "GET" }, true);
}

/* Convenience re-exports */
export const API_URL = API_BASE;
