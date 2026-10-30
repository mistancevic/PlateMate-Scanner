// DT175 (0.3.17, board Stories122): Say what you have. On an empty Plate, the person says the foods they have, in any order,
// with amounts if they know them; the browser's own speech recognition shows the words as they come. Done sends the words
// to Chef Mealan (plateFromWords), which lands them on the Plate as estimates. Typing works the same where there are no ears.
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
        const r = new S(); rec.current = r; r.lang = "en-GB"; r.continuous = true; r.interimResults = false;
        r.onresult = (e: any) => { const parts: string[] = []; for (let i = 0; i < e.results.length; i++) { const x = e.results[i]; if (x.isFinal !== false) parts.push(String(x[0].transcript || "").trim()); } if (parts.length) setSaid((s) => [s, ...parts.filter((p) => p && !s.includes(p))].filter(Boolean).join(", ")); };
        r.onerror = (e: any) => { if (e?.error === "not-allowed" || e?.error === "service-not-allowed") { stopped = true; setListening(false); setNote("The microphone is blocked for this site. Type the foods instead."); } };
        r.onend = () => { if (!stopped) setTimeout(start, 300); };
        r.start(); setListening(true);
      } catch { setListening(false); }
    };
    start();
    return () => { stopped = true; try { rec.current?.stop(); } catch { /* already stopped */ } };
  }, []);
  const text = [said, typed].filter((x) => x.trim()).join(", ");
  return (
    <section className="card say-have" aria-label="Say what you have">
      <div className="say-head"><span className={`cook-dot ${listening ? "on" : ""}`} aria-hidden="true" /><b>{listening ? "Listening" : hasEars ? "Not listening" : "Type what you have"}</b></div>
      {said && <b className="say-words" aria-live="polite">{said}</b>}
      {note && <small className="muted">{note}</small>}
      <small className="muted">{hasEars ? "Say the foods you have, in any order. Amounts if you know them: two eggs, half an onion. Tap Done when you are done." : "The foods you have, in any order, with amounts if you know them."}</small>
      <input id="say-have-typed" className="search" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={hasEars ? "Or type here" : "eggs, spinach, feta, half an onion"} maxLength={400} />
      <div className="button-row say-buttons">
        <button type="button" className="pill pill-primary" disabled={busy || text.trim().length < 3} onClick={() => { try { rec.current?.stop(); } catch { /* fine */ } onDone(text); }}>Done</button>
        <button type="button" className="pill" disabled={busy} onClick={onCancel}>Cancel</button>
      </div>
      <small className="muted">What you say goes to Chef Mealan as words, to name the foods and their typical values. Nothing is recorded.</small>
    </section>
  );
}
