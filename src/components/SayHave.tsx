// DT175 (0.3.17, board Stories122): Say what you have. On an empty Plate, the person says the foods they have, in any order,
// with amounts if they know them; the browser's own speech recognition shows the words as they come. Done sends the words
// to Chef Mealan (plateFromWords), which lands them on the Plate as estimates. Typing works the same where there are no ears.
import { getLang, speechLang } from "../lang";
import { w } from "../words";
import { useEffect, useRef, useState } from "react";

const Speech = () => (typeof window === "undefined" ? null : (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null);

export function SayHave({ onDone, onCancel, busy }: { onDone: (text: string) => void; onCancel: () => void; busy: boolean }) {
  const hasEars = !!Speech();
  const [said, setSaid] = useState("");
  const [typed, setTyped] = useState("");
  const [listening, setListening] = useState(false);
  const [note, setNote] = useState("");
  const rec = useRef<any>(null);
  useEffect(() => {
    const S = Speech(); if (!S) return;
    let stopped = false;
    const start = () => {
      if (stopped) return;
      try {
        const r = new S(); rec.current = r; r.lang = speechLang(getLang()); // DT248 (0.3.98): in the app's language
        r.continuous = true; r.interimResults = false;
        r.onresult = (e: any) => { const parts: string[] = []; for (let i = 0; i < e.results.length; i++) { const x = e.results[i]; if (x.isFinal !== false) parts.push(String(x[0].transcript || "").trim()); } if (parts.length) setSaid((s) => [s, ...parts.filter((p) => p && !s.includes(p))].filter(Boolean).join(", ")); };
        r.onerror = (e: any) => { if (e?.error === "not-allowed" || e?.error === "service-not-allowed") { stopped = true; setListening(false); setNote(w("sayhave.micBlocked")); } };
        r.onend = () => { if (!stopped) setTimeout(start, 300); };
        r.start(); setListening(true);
      } catch { setListening(false); }
    };
    start();
    return () => { stopped = true; try { rec.current?.stop(); } catch { /* already stopped */ } };
  }, []);
  const text = [said, typed].filter((x) => x.trim()).join(", ");
  return (
    <section className="card say-have" aria-label={w("sayhave.sayWhatYouHave")}>
      <div className="say-head"><span className={`cook-dot ${listening ? "on" : ""}`} aria-hidden="true" /><b>{listening ? "Listening" : hasEars ? w("sayhave.notListening") : w("sayhave.typeWhatYouHave")}</b></div>
      {said && <b className="say-words" aria-live="polite">{said}</b>}
      {note && <small className="muted">{note}</small>}
      <small className="muted">{hasEars ? w("sayhave.sayTheFoodsYouHave") : w("sayhave.theFoodsYouHaveIn")}</small>
      <input id="say-have-typed" className="search" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={hasEars ? w("sayhave.orTypeHere") : "eggs, spinach, feta, half an onion"} maxLength={400} />
      <div className="button-row say-buttons">
        <button type="button" className="pill pill-primary" disabled={busy || text.trim().length < 3} onClick={() => { try { rec.current?.stop(); } catch { /* fine */ } onDone(text); }}>{w("sayhave.done")}</button>
        <button type="button" className="pill" disabled={busy} onClick={onCancel}>{w("sayhave.cancel")}</button>
      </div>
      <small className="muted">{w("sayhave.whatYouSayGoesTo")}</small>
    </section>
  );
}
