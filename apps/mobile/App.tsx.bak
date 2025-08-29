import React, { useEffect, useState } from "react";
import { SafeAreaView, View, Text, Button, ActivityIndicator, TextInput } from "react-native";
import { login, signup, getMe, saveToken, loadToken, clearToken, API_URL, type Me } from "./src/api";

export default function App() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "signup" | "none">("none");

  // Sign-up form state
  const [suEmail, setSuEmail] = useState("");
  const [suName, setSuName] = useState("");
  const [suPassword, setSuPassword] = useState("");

  async function refreshWithStoredToken() {
    setError(null);
    const token = await loadToken();
    if (!token) { setLoading(false); return; }
    try {
      const profile = await getMe(token);
      setMe(profile);
    } catch (e: any) {
      setError(e?.message || "Failed to load /me");
      await clearToken();
    } finally {
      setLoading(false);
    }
  }

  async function quickLogin() {
    setLoading(true); setError(null);
    try {
      const token = await login("second.user@example.com", "secret123");
      await saveToken(token);
      const profile = await getMe(token);
      setMe(profile);
    } catch (e: any) {
      setError(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function doSignup() {
    setLoading(true); setError(null);
    try {
      await signup(suEmail.trim(), suName.trim() || null, suPassword);
      const token = await login(suEmail.trim(), suPassword); // auto-login
      await saveToken(token);
      const profile = await getMe(token);
      setMe(profile);
      setMode("none");
      setSuEmail(""); setSuName(""); setSuPassword("");
    } catch (e: any) {
      setError(e?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);
    await clearToken();
    setMe(null);
    setLoading(false);
  }

  useEffect(() => { refreshWithStoredToken(); }, []);

  return (
    <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}>
      <View style={{ gap: 12, alignItems: "center", maxWidth: 500, width: "100%" }}>
        <Text style={{ fontSize: 24, fontWeight: "700" }}>EduApp mobile ✅</Text>
        <Text style={{ opacity: 0.7, fontSize: 12 }}>API: {API_URL || "(unset)"}</Text>

        {loading && <ActivityIndicator />}

        {!loading && !me && mode === "none" && (
          <>
            <Text>Not logged in.</Text>
            <Button title="Quick login (test user)" onPress={quickLogin} />
            <Button title="Create new account" onPress={() => setMode("signup")} />
          </>
        )}

        {!loading && !me && mode === "signup" && (
          <View style={{ width: "100%", gap: 8 }}>
            <Text style={{ fontWeight: "600", fontSize: 16, textAlign: "center" }}>Sign Up</Text>
            <TextInput
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={suEmail}
              onChangeText={setSuEmail}
              style={{ borderWidth: 1, padding: 8, borderRadius: 8 }}
            />
            <TextInput
              placeholder="Name (optional)"
              value={suName}
              onChangeText={setSuName}
              style={{ borderWidth: 1, padding: 8, borderRadius: 8 }}
            />
            <TextInput
              placeholder="Password"
              secureTextEntry
              value={suPassword}
              onChangeText={setSuPassword}
              style={{ borderWidth: 1, padding: 8, borderRadius: 8 }}
            />
            <Button title="Create account" onPress={doSignup} />
            <Button title="Cancel" onPress={() => setMode("none")} />
          </View>
        )}

        {!loading && me && (
          <>
            <Text>Logged in as: {me.email}</Text>
            <Text style={{ opacity: 0.7 }}>{me.name ?? "No name set"}</Text>
            <Button title="Log out" onPress={logout} />
          </>
        )}

        {error && <Text style={{ marginTop: 8, color: "crimson", textAlign: "center" }}>{error}</Text>}
      </View>
    </SafeAreaView>
  );
}
