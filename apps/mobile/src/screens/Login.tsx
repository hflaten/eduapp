import React, { useState } from "react";
import { login, saveToken } from "@/lib";

export default function Login() {
  const [email, setEmail] = useState("second.user@example.com");
  const [password, setPassword] = useState("secret123");
  const [err, setErr] = useState("");

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    try {
      const { access_token } = await login(email, password);
      saveToken(access_token);
      location.href = "/"; // or your router nav
    } catch (e: any) {
      setErr(`Login failed: ${e?.message ?? String(e)}`);
    }
  };

  return (
    <form onSubmit={onLogin} style={{ maxWidth: 560, margin: "40px auto" }}>
      <h1>Welcome back</h1>
      <input
        value={email}
        onChange={(v) => setEmail((v.target as any).value)}
        placeholder="email"
        style={{ width: "100%", padding: 12, margin: "12px 0", background: "#f7ffbf" }}
      />
      <input
        type="password"
        value={password}
        onChange={(v) => setPassword((v.target as any).value)}
        placeholder="password"
        style={{ width: "100%", padding: 12, margin: "12px 0", background: "#f7ffbf" }}
      />
      <button type="submit" style={{ padding: 12, width: "100%" }}>LOG IN</button>
      {err && <div style={{ color: "crimson", marginTop: 12 }}>{err}</div>}
    </form>
  );
}
