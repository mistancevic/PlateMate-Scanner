import { useState } from "react";
import { Mark, APP_NAME } from "../components/Mark";
import { RequestForm } from "./LandingScreen";
import type { AppApi } from "./api";

// Signed in, but no coach yet: a code, or a request for one.
export function PilotGate(p: AppApi) {
  const [code, setCode] = useState("");
  return (
    <div className="goal-screen">
      <div className="hero"><Mark size={52} color="var(--brand)" /><h2>Almost there{p.user?.name ? `, ${p.user.name.split(" ")[0]}` : ""}</h2><p>{APP_NAME} is a closed pilot. You join with a code from your coach.</p></div>
      <section className="card">
        <b>I have a code</b>
        <div className="button-row" style={{ marginTop: 8 }}>
          <input className="code-input" value={code} placeholder="Coach code" onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={8} />
          <button className="pill pill-small pill-primary" disabled={code.trim().length < 4} onClick={() => p.joinCoach(code)}>Join</button>
        </div>
      </section>
      <section className="card">
        <b>I need a code</b>
        <p className="small">Leave a line and Milan gets back to you.</p>
        <RequestForm email={p.user?.email} name={p.user?.name} />
      </section>
      <button className="link" onClick={p.signOut}>Sign out</button>
    </div>
  );
}
