// DT174 (0.3.16, board Stories121): cook mode, full screen over Make. One big step at a time, read aloud by the phone's own
// voice, steered by Back, Repeat, Next or by voice (the browser's own speech recognition). The screen stays on. Each step you
// finish is ticked on Make; closing keeps the ticks. No AI, nothing sent by us: free to run.
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Ingredient } from "../pilot";
import { stepParts, stepText } from "../steps";
import { tempsIn } from "../units";
import { secondsIn, timerName, parseCommand, howMuch, leftLine, spoken, clock, minutesWords, voiceChoice, setVoiceChoice, type VoiceChoice } from "../cook";

type Timer = { id: number; name: string; ends: number; total: number; rang: boolean };
const Speech = () => (typeof window === "undefined" ? null : (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null);
const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

// DT177 (0.3.20, board Stories125): a second screen in the same session. remoteStep is a step set on the other screen (applied
// once per rev); onStep tells the other screen; top is the line that says the kitchen screen is on; pair opens it; look is
// Chef, look on the kitchen screen: one photo with the step.
export type CookLink = { remoteStep?: { k: number; rev: number } | null; onStep?: (k: number) => void; top?: ReactNode; pair?: ReactNode; look?: ((k: number) => Promise<string>) | null; closeLabel?: string; doneLabel?: string };
export function CookMode({ title, steps, items, ticks, onTick, onClose, ask = null, pics = [], link = {} }: {
  title: string; steps: string[]; items: Ingredient[]; ticks: Set<number>;
  onTick: (k: number) => void; onClose: () => void;
  // DT175 (0.3.17): a question to Chef Mealan about this step; null when the AI is off
  ask?: ((question: string, step: number, history: { role: "cook" | "chef"; text: string }[]) => Promise<string>) | null;
  // DT175a (0.3.18): the step pictures, one per step or null; the label sits under the picture, never on it
  pics?: ({ src: string; by: "me" | "ai" } | null)[];
  link?: CookLink;
}) {
  const first = Math.max(0, steps.findIndex((_, k) => !ticks.has(k)));
  const [k, setK] = useState(ticks.size >= steps.length ? 0 : first);
  const [done, setDone] = useState(false);
  // DT175a: the steps already finished, to show the ticks on the step buttons (only Next ticks)
  const [doneSet, setDoneSet] = useState<Set<number>>(() => new Set(ticks));
  const [voice, setVoice] = useState<VoiceChoice>(voiceChoice());
  const [heard, setHeard] = useState<{ said: string; answer: string; chef?: boolean; step?: number; working?: boolean } | null>(null);
  const [typed, setTyped] = useState("");
  const asked = useRef<{ role: "cook" | "chef"; text: string }[]>([]);
  const [timers, setTimers] = useState<Timer[]>([]);
  const [now, setNow] = useState(Date.now());
  const [listenNote, setListenNote] = useState("");
  const hasEars = !!Speech();
  const on = voice === "on";
  // the newest values, for the speech callbacks
  const live = useRef({ k, done, on, steps, items }); live.current = { k, done, on, steps, items };

  const say = (text: string) => {
    if (!live.current.on || !canSpeak()) return;
    try { const u = new SpeechSynthesisUtterance(text); u.lang = "en-GB"; u.rate = 0.95; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch { /* the phone has no voice: the screen says it */ }
  };
  // the screen stays on while cooking; asked again when the page comes back
  useEffect(() => {
    let lock: any = null, gone = false;
    const ask = async () => { try { if ((navigator as any).wakeLock && document.visibilityState === "visible") lock = await (navigator as any).wakeLock.request("screen"); } catch { /* not offered: the screen may sleep */ } };
    const back = () => { if (!gone && document.visibilityState === "visible") void ask(); };
    void ask(); document.addEventListener("visibilitychange", back);
    return () => { gone = true; document.removeEventListener("visibilitychange", back); try { lock?.release?.(); } catch { /* already gone */ } };
  }, []);
  // DT177: the other screen moved: this one follows, once per change, without sending it back
  const fromOther = useRef(false);
  useEffect(() => { const r = link.remoteStep; if (!r) return; if (r.k !== live.current.k || live.current.done) { fromOther.current = true; setDone(false); setK(Math.max(0, Math.min(steps.length - 1, r.k))); } }, [link.remoteStep?.rev]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (fromOther.current) { fromOther.current = false; return; } link.onStep?.(k); }, [k]); // eslint-disable-line react-hooks/exhaustive-deps
  // ticks from the other screen join this one's
  useEffect(() => { setDoneSet((d) => { let ch = false; const n = new Set(d); ticks.forEach((t) => { if (!n.has(t)) { n.add(t); ch = true; } }); return ch ? n : d; }); }, [ticks]);
  // a step is read aloud when it shows
  useEffect(() => { if (!done) say(`Step ${k + 1}. ${spoken(steps[k], items)}`); }, [k, done, voice]); // eslint-disable-line react-hooks/exhaustive-deps
  // the timers count down; one that ends rings, buzzes and says which
  useEffect(() => { if (!timers.length) return; const t = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(t); }, [timers.length]);
  useEffect(() => {
    const due = timers.filter((t) => !t.rang && t.ends <= now);
    if (!due.length) return;
    setTimers((ts) => ts.map((t) => (due.some((d) => d.id === t.id) ? { ...t, rang: true } : t)));
    for (const t of due) { ring(); say(`The ${t.name.toLowerCase()} timer is done.`); }
  }, [now]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (to: number) => { setHeard(null); setK(Math.max(0, Math.min(steps.length - 1, to))); };
  const next = () => { onTick(live.current.k); setDoneSet((d) => new Set(d).add(live.current.k)); if (live.current.k >= steps.length - 1) { setDone(true); say("Done. Enjoy your meal."); } else go(live.current.k + 1); };
  const back = () => { if (live.current.done) { setDone(false); return; } go(live.current.k - 1); };
  const repeat = () => { setHeard(null); say(`Step ${live.current.k + 1}. ${spoken(steps[live.current.k], items)}`); };
  const startTimer = (seconds: number, name: string) => {
    setTimers((ts) => [...ts, { id: Date.now() + Math.random(), name, ends: Date.now() + seconds * 1000, total: seconds, rang: false }]);
    setNow(Date.now());
    return `${name} timer, ${minutesWords(seconds)}.`;
  };
  // DT175: a question to Chef Mealan, with the recipe, this step and the amounts cooked; advice only, read aloud
  const askChef = async (question: string) => {
    const at = live.current.k;
    // DT177: Chef, look, on the kitchen screen: one photo of the pan with this step
    if (link.look && /^(?:have a |take a )?look(?: at (?:this|it|the pan|the pot|that))?(?: please)?$/.test(question.trim().toLowerCase())) return lookNow();
    if (!ask) { const a = "Chef Mealan can't answer right now. The steps, the commands and the timers still work."; setHeard({ said: question, answer: a, chef: true, step: at }); say(a); return; }
    setHeard({ said: question, answer: "", chef: true, step: at, working: true });
    try {
      const a = await ask(question, at, asked.current.slice(-4));
      asked.current = [...asked.current, { role: "cook" as const, text: question }, { role: "chef" as const, text: a }].slice(-8);
      setHeard({ said: question, answer: a, chef: true, step: at }); say(a);
    } catch (e: any) {
      const a = e?.message || "Chef Mealan could not answer. Ask again.";
      setHeard({ said: question, answer: a, chef: true, step: at }); say(a);
    }
  };
  const lookNow = async () => {
    if (!link.look) return;
    const at = live.current.k;
    setHeard({ said: "Chef, look", answer: "", chef: true, step: at, working: true });
    try { const a = await link.look(at); setHeard({ said: "Chef, look", answer: a, chef: true, step: at }); say(a); }
    catch (e: any) { const a = e?.message || "Chef Mealan couldn't look. Try again."; setHeard({ said: "Chef, look", answer: a, chef: true, step: at }); say(a); }
  };
  // what was said
  const hear = (said: string) => {
    const c = parseCommand(said), { k: at } = live.current;
    if (c.kind === "next") return next();
    if (c.kind === "back") return back();
    if (c.kind === "repeat") return repeat();
    if (c.kind === "stop") return close();
    if (c.kind === "ask") return void askChef(c.question);
    if (c.kind === "goto") { if (c.step > steps.length) { const a = `This recipe has ${steps.length} steps.`; setHeard({ said, answer: a }); say(a); return; } setDone(false); return go(c.step - 1); }
    const answer = c.kind === "left" ? leftLine(at, steps, items)
      : c.kind === "howMuch" ? howMuch(c.food, steps, items)
      : c.kind === "timer" ? startTimer(c.seconds, timerName(steps[at], at))
      : "I heard you, but that isn't something I can do yet. Say next, back, repeat, how much, timer, what's left or stop. Start with Chef to ask about the dish.";
    setHeard({ said, answer }); say(answer);
  };
  const hearRef = useRef(hear); hearRef.current = hear;
  // listening: the browser's own speech recognition, started again after each silence while voice is on
  useEffect(() => {
    const S = Speech();
    if (!on || !S || done) return;
    let stopped = false, r: any = null;
    const start = () => {
      if (stopped) return;
      try {
        r = new S(); r.lang = "en-GB"; r.continuous = true; r.interimResults = false;
        r.onresult = (e: any) => { const last = e.results[e.results.length - 1]; if (last?.isFinal !== false) hearRef.current(String(last[0].transcript || "")); };
        r.onerror = (e: any) => { if (e?.error === "not-allowed" || e?.error === "service-not-allowed") { stopped = true; setListenNote("The microphone is blocked for this site. Allow it in the browser's settings, or use the buttons."); } };
        r.onend = () => { if (!stopped) setTimeout(start, 300); };
        r.start(); setListenNote("");
      } catch { setTimeout(start, 1000); }
    };
    start();
    return () => { stopped = true; try { r?.stop(); } catch { /* already stopped */ } };
  }, [on, done]);
  const close = () => { try { window.speechSynthesis?.cancel(); } catch { /* nothing to stop */ } onClose(); };
  const choose = (v: "on" | "off") => { setVoiceChoice(v); setVoice(v); };

  const sec = done ? null : secondsIn(steps[k]);
  const name = done ? "" : timerName(steps[k], k);
  const running = timers.some((t) => !t.rang && t.name === name);
  return (
    <div className="cook-mode" role="dialog" aria-label={`Cooking ${title}`}>
      <div className="cook-top">
        <button className="pill pill-small" style={{ minHeight: 44 }} onClick={close}>{link.closeLabel ?? "✕ Close"}</button>
        <b className="cook-title">{title}</b>
        <small className="cook-count">{done ? "done" : `${k + 1} of ${steps.length}`}</small>
      </div>
      {/* DT175a (0.3.18, board Stories123 v2): the bar is the steps, each a button 44 px high: tap to jump, a tick when done */}
      <div className="cook-steps" role="tablist" aria-label="Steps">{steps.map((_, j) => { const cur = !done && j === k, d = doneSet.has(j); return (
        <button key={j} role="tab" aria-selected={cur} aria-label={`Step ${j + 1}${d ? ", done" : ""}`} className={`cook-step-btn${cur ? " on" : ""}${d ? " done" : ""}`} onClick={() => { setDone(false); go(j); }}>{j + 1}{d && !cur ? " ✓" : ""}</button>); })}</div>
      {link.top}
      {timers.length > 0 && (
        <div className="cook-timers" aria-label="Timers">
          {timers.map((t) => { const left = (t.ends - now) / 1000; return (
            <button key={t.id} className={`cook-timer ${t.rang ? "rang" : ""}`} aria-label={t.rang ? `${t.name} timer done. Tap to clear.` : `${t.name} timer, ${clock(left)} left. Tap to stop.`} onClick={() => setTimers((ts) => ts.filter((x) => x.id !== t.id))}>
              ⏱ {t.name} {t.rang ? "0:00 · done" : clock(left)}
            </button>); })}
        </div>
      )}
      {voice === null && hasEars && !done && (
        <section className="cook-card cook-ask">
          <b>Cook hands free?</b>
          <small>Your phone listens while you cook, so you can say next, back, repeat or how much. Your browser turns your voice into words: Google does it in Chrome, Apple in Safari. Chef Mealan keeps no recordings and sends nothing to its own AI.</small>
          <div className="button-row"><button className="pill pill-primary" onClick={() => choose("on")}>Turn voice on</button><button className="pill" onClick={() => choose("off")}>Buttons only</button></div>
        </section>
      )}
      {done ? (
        <>
          <section className="cook-card cook-done">
            <div aria-hidden="true">🍽️</div>
            <b>Done. Enjoy your meal.</b>
            <small>All {steps.length} steps are ticked. The screen goes back to normal now.</small>
          </section>
          <button className="pill pill-wide pill-primary" onClick={close}>{link.doneLabel ?? "Back to Make"}</button>
          <small className="muted cook-under">On Make: a photo while it is on the counter, how it went, how much you ate, then Rate it.</small>
          <button className="link" onClick={back}>Back to the last step</button>
        </>
      ) : (
        <>
          <section className={`cook-card cook-step${pics[k] ? " has-pic" : ""}`} aria-live="polite">
            {pics[k] && <><img className="cook-pic" src={pics[k]!.src} alt={`Step ${k + 1}`} /><small className="cook-pic-label">{pics[k]!.by === "ai" ? "Picture drawn by AI, Beta" : "Your photo"}</small></>}
            <small>STEP {k + 1}</small>
            <div className="cook-text">{stepParts(tempsIn(steps[k]), items).map((p, j) => ("text" in p ? p.text : <b key={j} className="st-amt">{p.label}</b>))}</div>
            {(sec && !running) || link.look ? <div className="cook-step-actions">
              {sec && !running && <button className="pill cook-timer-start" onClick={() => { const a = startTimer(sec, name); say(a); }}>⏱ Start {minutesWords(sec).replace(" minutes", " min").replace(" minute", " min")} timer</button>}
              {link.look && <button className="pill cook-look" disabled={!!heard?.working} onClick={() => void lookNow()}>📷 Chef, look</button>}
            </div> : null}
          </section>
          <div className="cook-buttons">
            <button className="pill" disabled={k === 0} onClick={back}>‹ Back</button>
            <button className="pill" onClick={repeat}>↻ Repeat</button>
            <button className="pill pill-primary" onClick={next}>{k === steps.length - 1 ? "Done ✓" : "Next ›"}</button>
          </div>
          {heard && (
            <section className="cook-card cook-heard" aria-live="polite">
              <small>{heard.chef ? "YOU ASKED" : "YOU SAID"}</small><b>{heard.said}</b>
              <small>{heard.chef ? `CHEF MEALAN, ABOUT STEP ${(heard.step ?? k) + 1}` : "CHEF MEALAN"}</small>
              <b>{heard.working ? "Chef Mealan is thinking." : heard.answer}</b>
              {heard.chef && !heard.working && <small className="muted">Read aloud. Nothing on your plate changes.</small>}
            </section>
          )}
          {ask && <form className="cook-card cook-ask-form" onSubmit={(e) => { e.preventDefault(); const q = typed.trim(); if (!q) return; setTyped(""); void askChef(q); }}>
            <label htmlFor="cook-ask-field"><b>Ask Chef Mealan about this step</b></label>
            <div className="cook-ask-row">
              <input id="cook-ask-field" className="search" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={on ? "Or say: Chef, can I use frozen spinach?" : "Can I use frozen spinach?"} maxLength={400} />
              <button type="submit" className="pill pill-primary" disabled={!typed.trim() || !!heard?.working}>Ask</button>
            </div>
          </form>}
          {hasEars ? (
            <div className="cook-card cook-listen">
              <span className={`cook-dot ${on ? "on" : ""}`} aria-hidden="true" />
              <small>{listenNote || (on ? <>Listening. Say <b>next</b>, <b>back</b>, <b>repeat</b>, <b>how much</b>, <b>timer</b>, <b>what's left</b>, <b>stop</b>. Or ask: start with <b>Chef</b>.</> : "Voice off. The buttons work the same.")}</small>
              <button className="pill pill-small" onClick={() => choose(on ? "off" : "on")}>{on ? "Voice off" : "Voice on"}</button>
            </div>
          ) : (
            <small className="muted cook-under">This browser can't listen, so the buttons steer. {canSpeak() ? "Each step can still be read aloud: " : ""}{canSpeak() && <button className="link" onClick={() => choose(on ? "off" : "on")}>{on ? "stop reading aloud" : "read steps aloud"}</button>}</small>
          )}
          <small className="muted cook-under">The screen stays on while you cook.{on ? " Each step is read aloud." : ""}</small>
          {link.pair}
          <details className="cook-card cook-foods">
            <summary>What's in it</summary>
            <ul>{items.filter((i) => i.grams > 0).map((i) => <li key={i.id}>{stepText(`[[i:${i.id}|${i.food.name.split(",")[0].trim().toLowerCase()}]]`, items)}</li>)}</ul>
          </details>
        </>
      )}
    </div>
  );
}

// a short ring when a timer ends; a buzz where the phone can
function ring() {
  try { (navigator as any).vibrate?.([300, 150, 300]); } catch { /* no buzz */ }
  try {
    const A = (window as any).AudioContext || (window as any).webkitAudioContext; if (!A) return;
    const ctx = new A(), t0 = ctx.currentTime;
    for (const [at, f] of [[0, 880], [0.25, 660], [0.5, 880]] as const) {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, t0 + at); g.gain.exponentialRampToValueAtTime(0.3, t0 + at + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + 0.22);
      o.start(t0 + at); o.stop(t0 + at + 0.24);
    }
    setTimeout(() => { try { ctx.close(); } catch { /* closed */ } }, 1200);
  } catch { /* no sound */ }
}
