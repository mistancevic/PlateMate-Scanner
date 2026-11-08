// DT259 (0.3.113, board Stories194; Coach Milan Go 8 November 09:12): Sign in with Google, or with any email by a link.
// Check your inbox names spam, and Send it again waits a minute (no one can use Chef Mealan to fill someone's inbox).
// A link opened on another phone or browser asks for the email once more, as Firebase needs.
import { useEffect, useState } from "react";
import { w } from "../words";
import { signIn, sendSignInLink, linkInUrl, linkEmail, finishLink, waitLeft } from "../cloud";

type Stage = "choose" | "sent" | "which" | "busy";
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i;
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function SignInPanel({ close }: { close: () => void }) {
  const [stage, setStage] = useState<Stage>(() => (linkInUrl() === "signin" ? (linkEmail() ? "busy" : "which") : "choose"));
  const [email, setEmail] = useState(() => linkEmail() ?? "");
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [err, setErr] = useState("");
  const [sending, setSending] = useState(false);
  useEffect(() => { if (stage !== "sent") return; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [stage]);
  // the link came back to this phone: one tap was enough
  useEffect(() => { if (stage === "busy" && email) void finish(email); }, []);
  async function finish(e: string) {
    setErr(""); setStage("busy");
    try { await finishLink(e); }
    catch { setErr(w("signin.linkFailed")); setStage("choose"); }
  }
  async function send() {
    if (!EMAIL.test(email.trim())) { setErr(w("signin.checkEmail")); return; }
    setErr(""); setSending(true);
    try { await sendSignInLink(email, "signin"); setSentAt(Date.now()); setNow(Date.now()); setStage("sent"); }
    catch (e: any) { setErr(e?.message || w("home.signInFailed")); }
    finally { setSending(false); }
  }
  const google = async () => { setErr(""); try { await signIn(); } catch (e: any) { setErr(e?.message || w("home.signInFailed")); } };
  const left = waitLeft(sentAt, now);
  return (
    <section className="card signin-panel" aria-label={w("signin.title")}>
      {stage === "choose" && <>
        <h2>{w("signin.title")}</h2>
        <button className="pill pill-primary pill-wide si-google" onClick={google}>{w("signin.continueWithGoogle")}</button>
        <small className="si-or">{w("signin.orEmail")}</small>
        <input className="si-email" type="email" inputMode="email" autoComplete="email" placeholder={w("signin.yourEmail")} aria-label={w("signin.yourEmail")} value={email} maxLength={200} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void send(); }} />
        <button className="pill pill-wide si-send" disabled={sending || !email.includes("@")} onClick={send}>{w("signin.sendLink")}</button>
        <small className="si-line">{w("signin.linkLine")}</small>
        <button className="link si-cancel" onClick={close}>{w("signin.cancel")}</button>
      </>}
      {stage === "sent" && <>
        <h2>{w("signin.checkInbox")}</h2>
        <p className="si-sent">{w("signin.sentTo", { email: email.trim().toLowerCase() })}</p>
        <small className="si-line">{w("signin.spam")}</small>
        <button className="pill pill-wide si-again" disabled={left > 0 || sending} onClick={send}>{left > 0 ? w("signin.sendAgainIn", { time: mmss(left) }) : w("signin.sendAgain")}</button>
        <button className="link si-other" onClick={() => { setStage("choose"); setSentAt(null); setErr(""); }}>{w("signin.otherEmail")}</button>
      </>}
      {stage === "which" && <>
        <h2>{w("signin.whichEmail")}</h2>
        <p>{w("signin.whichEmailLine")}</p>
        <input className="si-email" type="email" inputMode="email" autoComplete="email" placeholder={w("signin.yourEmail")} aria-label={w("signin.yourEmail")} value={email} maxLength={200} onChange={(e) => setEmail(e.target.value)} />
        <button className="pill pill-primary pill-wide si-finish" disabled={!EMAIL.test(email.trim())} onClick={() => finish(email)}>{w("signin.signIn")}</button>
      </>}
      {stage === "busy" && <p className="si-busy">{w("signin.signingIn")}</p>}
      {err && <p className="small si-err" role="alert">{err}</p>}
    </section>
  );
}
