// DT259e (0.3.113, board Stories194; Coach Milan 8 November 08:46 to 08:47, Go 09:12): Delete my account on its own screen.
// What goes, in words; Export my data first; then the check that it is you: a link for an email account, Google once more
// for a Google one. Nothing is deleted before that check; the server also refuses a delete without a fresh sign-in.
import { useEffect, useState } from "react";
import { w } from "../words";
import { sendSignInLink, signInKind, confirmWithGoogle, linkInUrl, linkEmail, finishLink, waitLeft } from "../cloud";

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function DeleteCheck({ email, run, exportData, cancel }: { email: string; run: () => Promise<void>; exportData?: () => void; cancel: () => void }) {
  const kind = signInKind() ?? "google";
  const [stage, setStage] = useState<"ask" | "sent" | "busy">(() => (linkInUrl() === "delete" ? "busy" : "ask"));
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [err, setErr] = useState("");
  useEffect(() => { if (stage !== "sent") return; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [stage]);
  // the link came back: it is you, and the delete goes on
  useEffect(() => {
    if (linkInUrl() !== "delete") return;
    void (async () => {
      try { await finishLink(linkEmail() ?? email); }
      catch { setErr(w("delete.linkFailed")); setStage("ask"); return; }
      await go();
    })();
  }, []);
  async function go() { setStage("busy"); setErr(""); try { await run(); } catch (e: any) { setErr(e?.message || w("delete.again")); setStage("ask"); } }
  async function check() {
    setErr("");
    if (kind === "google") {
      try { await confirmWithGoogle(); } catch (e: any) { if (!String(e?.code ?? "").includes("popup-closed")) setErr(e?.message || w("delete.again")); return; }
      await go();
      return;
    }
    try { await sendSignInLink(email, "delete"); setSentAt(Date.now()); setNow(Date.now()); setStage("sent"); }
    catch (e: any) { setErr(e?.message || w("delete.again")); }
  }
  const left = waitLeft(sentAt, now);
  return (
    <section className="card delete-check" aria-label={w("delete.title")}>
      <h2>{w("delete.title")}</h2>
      {stage === "busy" ? <p className="dc-busy">{w("delete.deleting")}</p> : <>
        <p>{w("delete.removes")}</p>
        {exportData && <button className="pill pill-wide dc-export" onClick={exportData}>{w("delete.exportFirst")}</button>}
        {stage === "ask" && <>
          <p>{kind === "email" ? w("delete.checkEmail", { email }) : w("delete.checkGoogle")}</p>
          <button className="pill pill-wide pill-danger dc-check" onClick={check}>{kind === "email" ? w("delete.sendLink") : w("delete.continueGoogle")}</button>
        </>}
        {stage === "sent" && <>
          <p className="dc-sent">{w("delete.sent", { email })}</p>
          <small className="si-line">{w("signin.spam")}</small>
          <button className="pill pill-wide dc-again" disabled={left > 0} onClick={check}>{left > 0 ? w("signin.sendAgainIn", { time: mmss(left) }) : w("signin.sendAgain")}</button>
        </>}
        <button className="link dc-cancel" onClick={cancel}>{w("delete.cancel")}</button>
      </>}
      {err && <p className="small si-err" role="alert">{err}</p>}
    </section>
  );
}
