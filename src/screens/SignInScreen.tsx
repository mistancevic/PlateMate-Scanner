import { useState } from "react";
import { w } from "../words";
import { Mark, APP_NAME } from "../components/Mark";
import { signIn } from "../cloud";

export function SignInScreen({ onLocal }: { onLocal: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <div className="goal-screen">
      <div className="hero"><Mark size={56} color="var(--brand)" /><h2>{APP_NAME}</h2><p>{w("signin.signInOnceAndYour")}</p></div>
      <button className="pill pill-primary pill-wide" disabled={busy} onClick={async () => { setBusy(true); setErr(""); try { await signIn(); } catch (e: any) { setErr(e.message || w("signin.signInFailed")); } finally { setBusy(false); } }}>
        {w("signin.continueWithGoogle")}
      </button>
      {err && <p className="small" style={{ color: "var(--low)" }}>{err}</p>}
      <p className="small center">{w("signin.whatSStoredYourGoal")}</p>
    </div>
  );
}
