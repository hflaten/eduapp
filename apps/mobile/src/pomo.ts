import { API_URL } from "./api";

export type Session = {
  id: number;
  started_at: string;
  ended_at: string | null;
  duration_sec: number | null;
  is_pomodoro: boolean;
  note: string | null;
};

export async function startSession(token: string, note?: string, isPomodoro = true): Promise<Session> {
  const res = await fetch(`${API_URL}/sessions/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ is_pomodoro: isPomodoro, note: note ?? null }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`start failed (${res.status}): ${text}`);
  }
  return (await res.json()) as Session;
}

export async function finishSession(token: string, sessionId: number): Promise<Session> {
  const res = await fetch(`${API_URL}/sessions/finish`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`finish failed (${res.status}): ${text}`);
  }
  return (await res.json()) as Session;
}
