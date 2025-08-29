import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView, View, Text, Button, ActivityIndicator, TextInput } from "react-native";
import {
  API_URL,
  type Me,
  login,
  signup,
  getMe,
  saveToken,
  loadToken,
  clearToken,
  startSession,
  finishSession,
  mySessions,
  saveActiveSession,
  loadActiveSession,
  clearActiveSession,
  type Session,
} from "./src/api";

const POMO_MINUTES = 25;
const POMO_MS = POMO_MINUTES * 60 * 1000;

export default function App() {
  // auth
  const [me, setMe] = useState<Me | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // login/signup
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  // pomodoro
  const [active, setActive] = useState<{ id: number; startedAt: Date } | null>(null);
  const [last, setLast] = useState<Session | null>(null);
  const [tick, setTick] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // bootstrap
  useEffect(() => {
    (async () => {
      try {
        const t = await loadToken();
        if (!t) { setLoading(false); return; }
        setToken(t);
        const m = await getMe(t);
        setMe(m);

        const persisted = await loadActiveSession();
        if (persisted) {
          setActive({ id: persisted.id, startedAt: new Date(persisted.started_at) });
        } else {
          const arr = await mySessions(t, 1);
          setLast(arr[0] ?? null);
        }
      } catch (e: any) {
        setError(String(e?.message ?? e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ticker
  useEffect(() => {
    if (!active) { if (intervalRef.current) clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => setTick((x) => x + 1), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [active]);

  const msLeft = active ? Math.max(0, POMO_MS - (Date.now() - active.startedAt.getTime())) : 0;
  const mm = String(Math.floor(msLeft / 60000)).padStart(2, "0");
  const ss = String(Math.floor((msLeft % 60000) / 1000)).padStart(2, "0");

  // auto-finish
  useEffect(() => {
    if (active && msLeft === 0) handleFinish().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, msLeft, active?.id]);

  async function handleLogin() {
    setError(null);
    try {
      const t = await login(email.trim(), password);
      await saveToken(t);
      setToken(t);
      const m = await getMe(t);
      setMe(m);
      const arr = await mySessions(t, 1);
      setLast(arr[0] ?? null);
    } catch (e: any) {
      setError(`Login failed: ${String(e?.message ?? e)}`);
    }
  }

  async function handleSignup() {
    setError(null);
    try {
      await signup(email.trim(), name || null, password);
      await handleLogin();
    } catch (e: any) {
      setError(`Signup failed: ${String(e?.message ?? e)}`);
    }
  }

  async function handleLogout() {
    await clearToken();
    await clearActiveSession();
    setMe(null); setToken(null); setActive(null); setLast(null);
  }

  async function handleStart() {
    if (!token) return;
    setError(null);
    try {
      const s = await startSession(token, true, null);
      const startedAt = new Date(s.started_at);
      setActive({ id: s.id, startedAt });
      await saveActiveSession({ id: s.id, started_at: s.started_at });
    } catch (e: any) {
      setError(`Start failed: ${String(e?.message ?? e)}`);
    }
  }

  async function handleFinish() {
    if (!token || !active) return;
    try {
      const s = await finishSession(token, active.id);
      setActive(null);
      await clearActiveSession();
      setLast(s);
    } catch (e: any) {
      setError(`Finish failed: ${String(e?.message ?? e)}`);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
        <Text>Connecting to {API_URL}</Text>
      </SafeAreaView>
    );
  }

  if (!me || !token) {
    return (
      <SafeAreaView style={{ flex: 1, padding: 24, gap: 16 }}>
        <Text style={{ fontSize: 32, fontWeight: "700" }}>{mode === "login" ? "Welcome back" : "Create account"}</Text>
        <TextInput style={boxStyle} placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail}/>
        {mode === "signup" && (
          <TextInput style={boxStyle} placeholder="Your name" autoCapitalize="words" value={name} onChangeText={setName}/>
        )}
        <TextInput style={boxStyle} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword}/>
        <Button title={mode === "login" ? "Log in" : "Create account"} onPress={mode === "login" ? handleLogin : handleSignup}/>
        <Button title={mode === "login" ? "Need an account? Sign up" : "Have an account? Log in"} onPress={() => setMode(mode === "login" ? "signup" : "login")} />
        {!!error && <Text style={{ color: "crimson" }}>{error}</Text>}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, padding: 24, gap: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 28, fontWeight: "700" }}>Hi, {me.name ?? me.email.split("@")[0]}</Text>
        <Button title="Log out" onPress={handleLogout} />
      </View>

      <View style={{ alignItems: "center", marginTop: 24 }}>
        <Text style={{ fontSize: 36, fontWeight: "700", marginBottom: 16 }}>
          {active ? "Stay focused" : "Ready to focus?"}
        </Text>

        {!active ? (
          <Button title="Start Pomodoro (25:00)" onPress={handleStart} />
        ) : (
          <>
            <Text style={{ fontSize: 64, fontVariant: ["tabular-nums"], marginVertical: 16 }}>
              {mm}:{ss}
            </Text>
            <Button title="Finish early" onPress={handleFinish} />
            <Text style={{ marginTop: 8, color: "#666" }}>Auto-finishes at 00:00</Text>
          </>
        )}
        {!!error && <Text style={{ marginTop: 8, color: "crimson" }}>{error}</Text>}
      </View>

      <View style={{ marginTop: 24, padding: 16, borderWidth: 2, borderRadius: 12 }}>
        <Text style={{ fontWeight: "700", fontSize: 18, marginBottom: 8 }}>Last session</Text>
        {last ? (
          <>
            <Text>ID: {last.id}</Text>
            <Text>Duration: {last.duration_sec ?? 0}s</Text>
            <Text>Ended: {last.ended_at ?? "—"}</Text>
          </>
        ) : (
          <Text>No sessions yet</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const boxStyle = {
  padding: 14,
  borderWidth: 2,
  borderRadius: 12,
  backgroundColor: "#f6ffc2",
} as const;
