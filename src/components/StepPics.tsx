// DT175a (0.3.18, board Stories123 v2; Coach Milan 30 October 20:16 Go): pictures for each step, Beta. A picture comes from
// the camera or the gallery (a photo while cooking, or one made in ChatGPT or Gemini with the Step Picture Checks prompts);
// who made it is asked, and the checks show before it is kept. Watch the steps plays them, made on the phone from the
// pictures: no video file. Labels sit under a picture, never on it; nothing under 12 px; every button 44 px or more.
import { useEffect, useRef, useState } from "react";
import type { Ingredient } from "../pilot";
import { stepParts } from "../steps";
import { tempsIn } from "../units";
import { resizeImageBase64 } from "../utils/image";
import { secondsIn, clock } from "../cook";
import type { StepPic } from "../photos";

const readFile = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsDataURL(f); });
const words = (step: string, items: Ingredient[]) => stepParts(tempsIn(step), items).map((p, j) => ("text" in p ? p.text : <b key={j} className="st-amt">{p.label}</b>));
export const picLabel = (p: StepPic) => (p.by === "ai" ? "Picture drawn by AI, Beta" : "Your photo");

// the picture beside a step on the recipe, or the place to add one
export function StepPicSlot({ pic, k, onOpen }: { pic: StepPic | null; k: number; onOpen: () => void }) {
  return (
    <div className="rq-step-pic">
      <button type="button" onClick={onOpen} aria-label={pic ? `Change the picture of step ${k + 1}` : `Add a picture to step ${k + 1}`}>
        {pic ? <img src={pic.src} alt="" /> : <span className="add">＋ Picture</span>}
      </button>
      {pic && <small>{pic.by === "ai" ? "AI · Beta" : "Yours"}</small>}
    </div>
  );
}

// adding or changing a step's picture: camera or gallery, who made it, the checks, then Keep it
export function StepPicSheet({ k, step, items, pic, onKeep, onRemove, onClose }: {
  k: number; step: string; items: Ingredient[]; pic: StepPic | null;
  onKeep: (p: StepPic) => void; onRemove: () => void; onClose: () => void;
}) {
  const [src, setSrc] = useState<string | null>(pic?.src ?? null);
  const [by, setBy] = useState<"me" | "ai" | null>(pic?.by ?? null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const cam = useRef<HTMLInputElement>(null), gal = useRef<HTMLInputElement>(null);
  const take = async (f?: File) => {
    if (!f) return; setBusy(true); setErr("");
    try { const raw = await readFile(f); const small = await resizeImageBase64(raw, 960, 960).catch(() => raw); setSrc(small); if (!pic) setBy(null); }
    catch { setErr("That picture didn't open. Try another one."); } finally { setBusy(false); }
  };
  return (
    <div className="sp-sheet" role="dialog" aria-label={`Picture for step ${k + 1}`}>
      <div className="cook-top"><button className="pill pill-small" style={{ height: 44 }} onClick={onClose}>✕ Close</button><b className="cook-title">Picture for step {k + 1}</b><span /></div>
      <small className="sp-step" style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.45 }}>{words(step, items)}</small>
      <div className="sp-grid">
        <button className="pill" disabled={busy} onClick={() => cam.current?.click()}>Take a photo</button>
        <button className={`pill ${src ? "" : "pill-primary"}`} disabled={busy} onClick={() => gal.current?.click()}>From my gallery</button>
      </div>
      <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; void take(f); }} />
      <input ref={gal} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; void take(f); }} />
      {err && <small className="error">{err}</small>}
      {src && <>
        <img className="sp-preview" src={src} alt={`The picture for step ${k + 1}`} />
        <b>Who made it?</b>
        <div className="sp-grid">
          <button className={`choice ${by === "me" ? "on" : ""}`} aria-pressed={by === "me"} onClick={() => setBy("me")}>My photo</button>
          <button className={`choice ${by === "ai" ? "on" : ""}`} aria-pressed={by === "ai"} onClick={() => setBy("ai")}>Drawn by AI</button>
        </div>
        <div className="sp-checks">
          <b>Before you keep it</b>
          <ul>
            <li>It shows this step, and only this step</li>
            <li>Every food is from the recipe, and where it should be by now</li>
            <li>Meat raw before cooking, cooked through after it</li>
            <li>The amounts look like the grams</li>
            <li>A real cook would do it this way</li>
          </ul>
        </div>
        <div className="sp-grid">
          <button className="pill pill-primary" disabled={!by || busy} onClick={() => by && onKeep({ src, by })}>Keep it</button>
          <button className="pill" disabled={busy} onClick={() => gal.current?.click()}>Choose another</button>
        </div>
        {!by && <small className="muted">Say who made it first.</small>}
        <small className="muted">Drawn by AI says so under the picture, in cook mode and in Watch the steps. The step's words and amounts stay what counts.</small>
      </>}
      {pic && <button className="link" style={{ alignSelf: "flex-start", minHeight: 44 }} onClick={onRemove}>Remove this picture</button>}
      <small className="muted">Your pictures stay with your recipe, only you can open them. Not shared with members in Beta.</small>
    </div>
  );
}

// Watch the steps: the step pictures one after another, about 5 seconds each, the words and the timer under the picture
export function StepPlayer({ title, steps, items, pics, onClose, onCook }: {
  title: string; steps: string[]; items: Ingredient[]; pics: StepPic[];
  onClose: () => void; onCook: (() => void) | null;
}) {
  const [k, setK] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [t, setT] = useState(0);
  const PER = 5;
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setT((x) => x + 0.25), 250);
    return () => clearInterval(id);
  }, [playing]);
  useEffect(() => {
    if (t < PER) return;
    if (k >= steps.length - 1) { setPlaying(false); setT(PER); return; }
    setK(k + 1); setT(0);
  }, [t]); // eslint-disable-line react-hooks/exhaustive-deps
  const go = (j: number) => { setK(Math.max(0, Math.min(steps.length - 1, j))); setT(0); };
  const sec = secondsIn(steps[k]);
  const elapsed = Math.round(k * PER + Math.min(t, PER));
  return (
    <div className="cook-mode sp-player" role="dialog" aria-label={`Watch the steps of ${title}`}>
      <div className="cook-top">
        <button className="pill pill-small" style={{ height: 44 }} onClick={onClose}>✕ Close</button>
        <b className="cook-title">{title}</b>
        <small className="cook-count">{clock(elapsed)}</small>
      </div>
      <div className="cook-steps" role="tablist" aria-label="Steps">{steps.map((_, j) => (
        <button key={j} role="tab" aria-selected={j === k} aria-label={`Step ${j + 1}`} className={`cook-step-btn${j === k ? " on" : ""}`} onClick={() => go(j)}>{j + 1}</button>))}</div>
      <section className="cook-card sp-frame" aria-live="polite">
        <img src={pics[k].src} alt={`Step ${k + 1}`} />
        <div className="sp-words">
          <small style={{ fontWeight: 800, color: "var(--muted)", letterSpacing: ".04em" }}>STEP {k + 1} OF {steps.length}{sec ? ` · TIMER ${clock(sec)}` : ""}</small>
          <div className="cook-text">{words(steps[k], items)}</div>
          <small className="muted" style={{ fontSize: 13, fontWeight: 700 }}>{picLabel(pics[k])}</small>
        </div>
      </section>
      <div className="sp-controls">
        <button className="pill" disabled={k === 0} onClick={() => go(k - 1)}>‹ Step {Math.max(1, k)}</button>
        <button className="pill pill-primary" onClick={() => { if (!playing && k >= steps.length - 1 && t >= PER) { go(0); setPlaying(true); } else setPlaying(!playing); }}>{playing ? "❚❚ Pause" : k >= steps.length - 1 && t >= PER ? "↻ Again" : "▶ Play"}</button>
        <button className="pill" disabled={k >= steps.length - 1} onClick={() => go(k + 1)}>Step {Math.min(steps.length, k + 2)} ›</button>
      </div>
      {onCook && <button className="pill pill-wide" style={{ height: 52 }} onClick={onCook}>Cook it as written</button>}
      <small className="muted cook-under">Made on your phone from the step pictures: no video file.</small>
    </div>
  );
}
