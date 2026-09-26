import { useState } from "react";
import { Mark, APP_NAME } from "../components/Mark";
import { signIn } from "../cloud";

export function SignInScreen({ onLocal }: { onLocal: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <div className="goal-screen">
      <div className="hero"><Mark size={56} color="var(--brand)" /><h2>{APP_NAME}</h2><p>Sign in once, and your goal, foods and meals follow you to any phone.</p></div>
      <button className="pill pill-primary pill-wide" disabled={busy} onClick={async () => { setBusy(true); setErr(""); try { await signIn(); } catch (e: any) { setErr(e.message || "Sign-in failed."); } finally { setBusy(false); } }}>
        Continue with Google
      </button>
      {err && <p className="small" style={{ color: "var(--low)" }}>{err}</p>}
      <p className="small center">What's stored: your goal, your foods, your meals and what you told your coach. In the EU, under your account only. Delete it any time from Me.</p>
      <button className="link" onClick={onLocal}>Use on this phone only, without an account</button>
    </div>
  );
}
