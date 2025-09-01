import React, { useEffect, useState } from "react";
import { me, startSession, mySessions } from "@/lib";

export default function Home() {
  const [name, setName] = useState<string>("");
  const [last, setLast] = useState<any>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    me().then(u => setName(u?.name ?? ""))
       .catch(e => setErr(String(e)));
    mySessions(1).then(xs => setLast(xs?.[0] ?? null))
       .catch(() => {});
  }, []);

  const onStart = async () => {
    setErr("");
    try {
      const s = await startSession(true, "Web Pomodoro");
      setLast(s);
    } catch (e: any) {
      setErr(`Start failed: ${e?.message ?? String(e)}`);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "40px auto" }}>
      <h2>Hi, {name || "there"}</h2>
      <h1>Ready to focus?</h1>
      <button onClick={onStart} style={{ padding: 12 }}>START POMODORO (25:00)</button>
      {err && <div style={{ color: "crimson", marginTop: 12 }}>{err}</div>}

      <div style={{ marginTop: 24, border: "1px solid #000", padding: 16 }}>
        <b>Last session</b>
        <div>{last ? `ID: ${last.id}, Started: ${last.started_at}` : "No sessions yet"}</div>
      </div>
    </div>
  );
}
