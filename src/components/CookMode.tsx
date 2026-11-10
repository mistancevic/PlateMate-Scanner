// DT174 (0.3.16, board Stories121): cook mode, full screen over Make. One big step at a time, read aloud by the phone's own
// voice, steered by Back, Repeat, Next or by voice (the browser's own speech recognition). The screen stays on. Each step you
// finish is ticked on Make; closing keeps the ticks. No AI, nothing sent by us: free to run.
import { w, wn, wIn, wnIn } from "../words";
import { getLang, speechLang, textLang, langScore, type Lang } from "../lang";
import { ChefLine } from "./ChefLine";
import { PhotoPick } from "./PhotoPick";
import { say as chefSay } from "../chefScript";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Ingredient } from "../pilot";
import { stepParts, stepText, tokenOf, TOKEN } from "../steps";
import { tempsIn } from "../units";
import { utterance, voiceSettings } from "../voiceSettings";
import { VoiceSettingsPanel } from "./VoiceSettings";
import { secondsIn, timerName, parseCommand, howMuch, shownName, leftSay, spoken, sayAgain, timeSaid, clock, voiceChoice, setVoiceChoice, isEcho, cutsIn, movesFor, SAY_AGAIN, canSayLine, type VoiceChoice } from "../cook";

// DT222: how many steps and, when the cook's start is known, how long it took
export function tookLine(n: number, since?: string, now = Date.now()): string {
  const min = since ? Math.round((now - Date.parse(since)) / 60000) : NaN;
  const steps = (l: Lang) => wnIn(l, "cookmode.nSteps", n);
  return Number.isFinite(min) && min >= 1 && min <= 600 ? wn("cookmode.tookMin", min, { steps }) : w("cookmode.took", { steps });
}
// DT243: the Start timer button: whole minutes as min, under a minute in seconds, else both (as minutesWords made it before)
const startLabel = (sec: number) => (sec % 60 === 0 ? w("cookmode.startTimerMin", { n: sec / 60 }) : sec < 60 ? wn("cookmode.startTimerSec", sec) : w("cookmode.startTimerMinSec", { m: Math.floor(sec / 60), s: sec % 60 }));
type Timer = { id: number; name: string; ends: number; total: number; rang: boolean };
const Speech = () => (typeof window === "undefined" ? null : (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null);
const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

// DT177 (0.3.20, board Stories125): a second screen in the same session. remoteStep is a step set on the other screen (applied
// once per rev); onStep tells the other screen; top is the line that says the kitchen screen is on; pair opens it; look is
// Chef, look on the kitchen screen: one photo with the step.
export type CookLink = { remoteStep?: { k: number; rev: number } | null; onStep?: (k: number) => void; top?: ReactNode; pair?: ReactNode; look?: ((k: number) => Promise<string>) | null; closeLabel?: string; doneLabel?: string;
  // DT222 (0.3.60, board Stories165): done leads to Eat: the meal's photo, then Cooked. Next: Eat; since is when the cook began
  eat?: () => void; mealPhoto?: { src: string; take: (file: File) => void }; since?: string;
  // DT223 (0.3.60): a photo of this step while cooking; kept says it goes with the recipe
  stepPhoto?: { take: (k: number, file: File) => void; kept: boolean } };
export function CookMode({ title, steps, items, ticks, onTick, onClose, ask = null, pics = [], allPics = [], link = {}, moves }: {
  title: string; steps: string[]; items: Ingredient[]; ticks: Set<number>;
  // DT217 (0.3.56): the moves of each step as Chef Mealan drafted them; a step without them gets them in code (movesFor)
  moves?: import("../pilot").StepMoves;
  onTick: (k: number) => void; onClose: () => void;
  // DT175 (0.3.17): a question to Chef Mealan about this step; null when the AI is off
  ask?: ((question: string, step: number, history: { role: "cook" | "chef"; text: string }[]) => Promise<string>) | null;
  // DT175a (0.3.18): the step pictures, one per step or null; the label sits under the picture, never on it
  pics?: ({ src: string; by: "me" | "ai" } | null)[];
  // DT276 step 2 (0.3.129): every picture of each step, the first first; a step with two or more shows them one after another
  allPics?: { src: string; by: "me" | "ai" }[][];
  link?: CookLink;
}) {
  const first = Math.max(0, steps.findIndex((_, k) => !ticks.has(k)));
  const [k, setK] = useState(ticks.size >= steps.length ? 0 : first);
  // DT276 step 2: which of the step's pictures shows; a new step starts at its first
  const [picN, setPicN] = useState(0);
  useEffect(() => { setPicN(0); }, [k]);
  const [done, setDone] = useState(false);
  // DT251 (0.3.104, board Stories186; Coach Milan 7 November 08:07 to 12:28, Go): Get it ready. A cook that starts at the
  // beginning opens on the foods first: each with its amount, read aloud one at a time; next ticks it and goes on, repeat says
  // it again, a tap ticks one too. All ticked: All ready, then step 1. Step 1 › skips it at any time.
  const readyFoods = items.filter((i) => i.grams > 0);
  const [prep, setPrep] = useState(ticks.size === 0 && readyFoods.length > 0);
  const [put, setPut] = useState<Set<string>>(() => new Set());
  const [pAt, setPAt] = useState(0);
  // DT217 v2 (0.3.56, board Stories163): the move in this step being read; the whole step stays on screen above the moves
  const [m, setM] = useState(0);
  const movesOf = (j: number) => movesFor(steps[j] ?? "", moves?.[j]?.m);
  // DT175a: the steps already finished, to show the ticks on the step buttons (only Next ticks)
  const [doneSet, setDoneSet] = useState<Set<number>>(() => new Set(ticks));
  const [voice, setVoice] = useState<VoiceChoice>(voiceChoice());
  const [voicePage, setVoicePage] = useState(false);
  const [heard, setHeard] = useState<{ said: string; answer: string; chef?: boolean; step?: number; working?: boolean; hint?: string } | null>(null);
  const [typed, setTyped] = useState("");
  const asked = useRef<{ role: "cook" | "chef"; text: string }[]>([]);
  const [timers, setTimers] = useState<Timer[]>([]);
  const [now, setNow] = useState(Date.now());
  const [listenNote, setListenNote] = useState("");
  const hasEars = !!Speech();
  const on = voice === "on";
  // the newest values, for the speech callbacks
  const live = useRef({ k, m, done, on, steps, items, prep, put, pAt }); live.current = { k, m, done, on, steps, items, prep, put, pAt };

  // 0.3.54: what the phone is saying, so the microphone does not take its own voice for the cook's (see isEcho in cook.ts)
  const voiceOut = useRef<{ speaking: boolean; tail: boolean; text: string; timers: number[] }>({ speaking: false, tail: false, text: "", timers: [] });
  const endSpeak = (u?: unknown) => {
    const v = voiceOut.current; if (u && (u as any) !== (voiceOut as any).lastU) return;
    v.speaking = false; v.tail = true;
    v.timers.forEach((t) => clearTimeout(t)); v.timers = [window.setTimeout(() => { v.tail = false; }, 2500)];
  };
  // DT248 (0.3.98, board Stories184; Coach Milan 7 November, Go 06:14): everything said aloud is in the app's language, in a
  // voice of that language; the recipe's own words (a step, the next step) in the recipe's language. Parts are spoken in turn.
  const appVoice = () => speechLang(getLang());
  const recipeVoice = () => speechLang(textLang(steps.join(" ")));
  const sayParts = (parts: { text: string; lang: string }[]) => {
    // parts in the same language go as one, so the voice reads them in one breath
    type Part = { text: string; lang: string };
    const ps = parts.filter((x) => !!x.text.trim()).reduce((out: Part[], x) => { const l = out[out.length - 1]; if (l && l.lang === x.lang) l.text = `${l.text} ${x.text}`; else out.push({ ...x }); return out; }, []);
    if (!live.current.on || !canSpeak() || !ps.length) return;
    try {
      // DT215 v3 (0.3.66): the voice and the speed from Settings, Voice while cooking
      const us = ps.map((x) => utterance(x.text, undefined, x.lang)), last = us[us.length - 1], text = ps.map((x) => x.text).join(" ");
      const v = voiceOut.current; v.speaking = true; v.tail = false; v.text = text; (voiceOut as any).lastU = last;
      v.timers.forEach((t) => clearTimeout(t));
      // a phone that never says it finished: the words' own length, then the tail
      v.timers = [window.setTimeout(() => endSpeak(last), 1500 + text.split(/\s+/).length * 450)];
      for (const u of us) { u.onerror = () => endSpeak(u); }
      last.onend = () => endSpeak(last);
      window.speechSynthesis.cancel(); for (const u of us) window.speechSynthesis.speak(u);
    } catch { /* the phone has no voice: the screen says it */ }
  };
  // a line in the app's language takes its voice; a line still in English (its translation not confirmed yet) an English one
  const voiceFor = (text: string) => { if (getLang() === "en") return appVoice(); const en = langScore(text, "en"); return en > 0 && en > langScore(text, getLang()) ? speechLang("en") : appVoice(); };
  const say = (text: string, lang?: string) => sayParts([{ text, lang: lang ?? voiceFor(text) }]);
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
  useEffect(() => { const r = link.remoteStep; if (!r) return; if (r.k !== live.current.k || live.current.done || live.current.prep) { fromOther.current = true; setDone(false); setPrep(false); setK(Math.max(0, Math.min(steps.length - 1, r.k))); setM(0); } }, [link.remoteStep?.rev]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (fromOther.current) { fromOther.current = false; return; } link.onStep?.(k); }, [k]); // eslint-disable-line react-hooks/exhaustive-deps
  // ticks from the other screen join this one's
  useEffect(() => { setDoneSet((d) => { let ch = false; const n = new Set(d); ticks.forEach((t) => { if (!n.has(t)) { n.add(t); ch = true; } }); return ch ? n : d; }); }, [ticks]);
  // a step is read aloud when it shows; with moves, one move at a time, the first with the step's number (DT217)
  const sayMove = (j: number, mi: number) => { const mv = movesOf(j); const head = mi === 0 ? w("cookmode.sayStep", { n: j + 1 }) : ""; sayParts([{ text: head, lang: head === wIn("en", "cookmode.sayStep", { n: j + 1 }) ? speechLang("en") : appVoice() }, { text: spoken(mv[Math.min(mi, mv.length - 1)], items), lang: recipeVoice() }]); };
  useEffect(() => { if (!done && !prep) sayMove(k, m); }, [k, m, done, voice, prep]); // eslint-disable-line react-hooks/exhaustive-deps
  // DT251: a food of Get it ready as it reads ("150 g basmati rice"), and as it is said ("150 grams basmati rice")
  const sayFood = (j: number, first = false) => {
    const i = readyFoods[j]; if (!i) return;
    sayParts([{ text: first ? w("cookmode.readySay") : "", lang: voiceFor(w("cookmode.readySay")) }, { text: spoken(readyToken(i), items), lang: recipeVoice() }]);
  };
  // DT251 fix (0.3.106; Coach Milan 13:51 Go): a food is named as the steps on screen name it (a translated recipe: Bohnen, not
  // pasulj); a food no step names keeps its own short name
  const stepName = new Map<string, string>(); for (const s of steps) for (const mt of s.matchAll(TOKEN)) if (!stepName.has(mt[1])) stepName.set(mt[1], mt[2]);
  // DT255: a step's word in another case (na ulju) is the same food: its own name is shown (ulje)
  const readyToken = (i: Ingredient) => (stepName.has(i.id) ? `[[i:${i.id}|${shownName(i, stepName.get(i.id))}]]` : tokenOf(i));
  const sayAllReady = () => say(`${w("cookmode.allReady")} ${w("cookmode.step1Next")}`);
  useEffect(() => { if (prep && pAt >= 0) sayFood(pAt, pAt === 0 && put.size === 0); }, [pAt, prep, voice]); // eslint-disable-line react-hooks/exhaustive-deps
  const nextUnput = (from: number, s: Set<string>) => { for (let j = 0; j < readyFoods.length; j++) { const x = (from + j) % readyFoods.length; if (!s.has(readyFoods[x].id)) return x; } return -1; };
  const putFood = (j: number) => {
    const s = new Set(live.current.put); s.add(readyFoods[j].id); setPut(s); setHeard(null);
    const n = nextUnput(j + 1, s); setPAt(n); if (n < 0) sayAllReady();
  };
  const tapFood = (j: number) => {
    const s = new Set(live.current.put);
    if (s.has(readyFoods[j].id)) { s.delete(readyFoods[j].id); setPut(s); if (live.current.pAt < 0) setPAt(j); return; }
    if (j === live.current.pAt) return putFood(j);
    s.add(readyFoods[j].id); setPut(s); if (nextUnput(0, s) < 0) { setPAt(-1); sayAllReady(); }
  };
  const toSteps = () => { setHeard(null); setPrep(false); };
  // the timers count down; one that ends rings, buzzes and says which
  useEffect(() => { if (!timers.length) return; const t = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(t); }, [timers.length]);
  useEffect(() => {
    const due = timers.filter((t) => !t.rang && t.ends <= now);
    if (!due.length) return;
    setTimers((ts) => ts.map((t) => (due.some((d) => d.id === t.id) ? { ...t, rang: true } : t)));
    for (const t of due) { ring(); say(w("cookmode.sayTimerDone", { name: t.name.toLowerCase() })); }
  }, [now]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (to: number, mi = 0) => { setHeard(null); const j = Math.max(0, Math.min(steps.length - 1, to)); setK(j); setM(Math.max(0, Math.min(movesOf(j).length - 1, mi))); };
  // DT217: Next and Back go move by move; Next on a step's last move ticks the step, as before
  const next = () => {
    if (live.current.prep) { const j = live.current.pAt; return j < 0 ? toSteps() : putFood(j); }
    const { k: at, m: mi } = live.current;
    if (mi < movesOf(at).length - 1) { setHeard(null); setM(mi + 1); return; }
    onTick(at); setDoneSet((d) => new Set(d).add(at)); if (at >= steps.length - 1) { setDone(true); say(w("cookmode.doneEnjoyYourMeal")); } else go(at + 1);
  };
  const back = () => { if (live.current.prep) { const j = live.current.pAt; setHeard(null); setPAt(j < 0 ? readyFoods.length - 1 : Math.max(0, j - 1)); return; } const { k: at, m: mi } = live.current; if (live.current.done) { setDone(false); return; } if (mi > 0) { setHeard(null); setM(mi - 1); return; } if (at > 0) go(at - 1, movesOf(at - 1).length - 1); };
  const repeat = () => { setHeard(null); if (live.current.prep) { if (live.current.pAt < 0) sayAllReady(); else sayFood(live.current.pAt); return; } sayMove(live.current.k, live.current.m); };
  const startTimer = (seconds: number, name: string) => {
    setTimers((ts) => [...ts, { id: Date.now() + Math.random(), name, ends: Date.now() + seconds * 1000, total: seconds, rang: false }]);
    setNow(Date.now());
    return w("cookmode.timerSet", { name, time: timeSaid(seconds) });
  };
  // DT175: a question to Chef Mealan, with the recipe, this step and the amounts cooked; advice only, read aloud
  const askChef = async (question: string) => {
    const at = live.current.k;
    // DT177: Chef, look, on the kitchen screen: one photo of the pan with this step
    if (link.look && /^(?:have a |take a )?look(?: at (?:this|it|the pan|the pot|that))?(?: please)?$/.test(question.trim().toLowerCase())) return lookNow();
    if (!ask) { const a = w("cookmode.chefCantAnswer"); setHeard({ said: question, answer: a, chef: true, step: at }); say(a); return; }
    setHeard({ said: question, answer: "", chef: true, step: at, working: true });
    try {
      const a = await ask(question, at, asked.current.slice(-4));
      asked.current = [...asked.current, { role: "cook" as const, text: question }, { role: "chef" as const, text: a }].slice(-8);
      setHeard({ said: question, answer: a, chef: true, step: at }); say(a);
    } catch (e: any) {
      const a = e?.message || w("cookmode.chefMealanCouldNotAnswer");
      setHeard({ said: question, answer: a, chef: true, step: at }); say(a);
    }
  };
  const lookNow = async () => {
    if (!link.look) return;
    const at = live.current.k;
    setHeard({ said: w("cookmode.chefLook"), answer: "", chef: true, step: at, working: true });
    try { const a = await link.look(at); setHeard({ said: w("cookmode.chefLook"), answer: a, chef: true, step: at }); say(a); }
    catch (e: any) { const a = e?.message || w("cookmode.chefMealanCouldnTLook"); setHeard({ said: w("cookmode.chefLook"), answer: a, chef: true, step: at }); say(a); }
  };
  // what was said
  const hear = (said: string) => {
    const c = parseCommand(said), { k: at } = live.current;
    if (c.kind === "next") return next();
    if (c.kind === "back") return back();
    if (c.kind === "repeat") return repeat();
    if (c.kind === "stop") return close();
    if (c.kind === "ask") return void askChef(c.question);
    if (c.kind === "goto") { if (c.step > steps.length) { const a = wn("cookmode.recipeSteps", steps.length); setHeard({ said, answer: a }); say(a); return; } setDone(false); setPrep(false); return go(c.step - 1); }
    // the next step in the recipe's own language
    if (c.kind === "left") { const l = leftSay(at, steps, items); setHeard({ said, answer: l.next ? `${l.head} ${l.next}` : l.head }); sayParts([{ text: l.head, lang: voiceFor(l.head) }, { text: l.next ? spoken(l.next, items) : "", lang: recipeVoice() }]); return; }
    const answer = c.kind === "howMuch" ? howMuch(c.food, steps, items)
      : c.kind === "timer" ? startTimer(c.seconds, timerName(steps[at], at))
      : null;
    // DT221 (0.3.58): not caught: the phone says one short line; what can be said stays on the screen, not read aloud
    if (answer === null) { setHeard({ said, answer: sayAgain(), hint: canSayLine(steps[at] ?? "", items) }); say(sayAgain()); return; }
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
        r = new S(); r.lang = speechLang(getLang()); r.continuous = true; r.interimResults = false;
        r.onresult = (e: any) => {
          const last = e.results[e.results.length - 1]; if (last?.isFinal === false) return;
          const said = String(last[0].transcript || ""), v = voiceOut.current;
          // 0.3.54: nothing while the phone speaks; just after, its own words are not the cook's
          // 0.3.55: a command of the cook's cuts in while the phone reads: the reading stops, the command is done
          // DT215 v3: Cut in off in Settings: the phone finishes the sentence first
          if (v.speaking) { if (!voiceSettings().cutIn || !cutsIn(said, v.text)) return; try { window.speechSynthesis.cancel(); } catch { /* nothing to stop */ } v.speaking = false; v.tail = true; hearRef.current(said); return; }
          if (v.tail && isEcho(said, v.text)) return;
          hearRef.current(said);
        };
        r.onerror = (e: any) => { if (e?.error === "not-allowed" || e?.error === "service-not-allowed") { stopped = true; setListenNote(w("cookmode.micBlocked")); } };
        r.onend = () => { if (!stopped) setTimeout(start, 300); };
        r.start(); setListenNote("");
      } catch { setTimeout(start, 1000); }
    };
    start();
    return () => { stopped = true; try { r?.stop(); } catch { /* already stopped */ } };
  }, [on, done]);
  const close = () => { try { window.speechSynthesis?.cancel(); } catch { /* nothing to stop */ } onClose(); };
  const choose = (v: "on" | "off") => { setVoiceChoice(v); setVoice(v); };

  const mvs = done ? [] : movesOf(k), mvNow = mvs[Math.min(m, mvs.length - 1)] ?? steps[k];
  const sec = done ? null : secondsIn(mvs.length > 1 ? mvNow : steps[k]);
  const name = done ? "" : timerName(steps[k], k);
  const running = timers.some((t) => !t.rang && t.name === name);
  if (voicePage) return (
    <div className="cook-mode" role="dialog" aria-label={w("cookmode.voiceWhileCooking")}>
      <div className="cook-top"><button className="pill pill-small" style={{ minHeight: 44 }} onClick={() => setVoicePage(false)}>{w("cookmode.backToCooking")}</button><b className="cook-title">{w("cookmode.voiceWhileCooking")}</b><small className="cook-count">{w("cookmode.nOf", { k: k + 1, n: steps.length })}</small></div>
      <VoiceSettingsPanel onChange={(o) => setVoice(o ? "on" : "off")} />
    </div>
  );
  return (
    <div className="cook-mode" role="dialog" aria-label={w("cookmode.cookingTitle", { title })}>
      <div className="cook-top">
        <button className="pill pill-small" style={{ minHeight: 44 }} onClick={close}>{link.closeLabel ?? w("cookmode.close")}</button>
        <b className="cook-title">{title}</b>
        <small className="cook-count">{done ? w("cookmode.doneLow") : prep ? w("cookmode.readyCount") : w("cookmode.nOf", { k: k + 1, n: steps.length })}</small>
      </div>
      {/* DT175a (0.3.18, board Stories123 v2): the bar is the steps, each a button 44 px high: tap to jump, a tick when done */}
      <div className="cook-steps" role="tablist" aria-label={w("cookmode.steps")}>{steps.map((_, j) => { const cur = !done && !prep && j === k, d = doneSet.has(j); return (
        <button key={j} role="tab" aria-selected={cur} aria-label={d ? w("cookmode.stepNDone", { n: j + 1 }) : w("cookmode.stepN", { n: j + 1 })} className={`cook-step-btn${cur ? " on" : ""}${d ? " done" : ""}`} onClick={() => { setDone(false); setPrep(false); go(j); }}>{j + 1}{d && !cur ? " ✓" : ""}</button>); })}</div>
      {link.top}
      {timers.length > 0 && (
        <div className="cook-timers" aria-label={w("cookmode.timers")}>
          {timers.map((t) => { const left = (t.ends - now) / 1000; return (
            <button key={t.id} className={`cook-timer ${t.rang ? "rang" : ""}`} aria-label={t.rang ? w("cookmode.timerDoneAria", { name: t.name }) : w("cookmode.timerLeftAria", { name: t.name, time: clock(left) })} onClick={() => setTimers((ts) => ts.filter((x) => x.id !== t.id))}>
              ⏱ {t.name} {t.rang ? w("cookmode.timerRang") : clock(left)}
            </button>); })}
        </div>
      )}
      {voice === null && hasEars && !done && (
        <section className="cook-card cook-ask">
          <ChefLine text={chefSay("handsFree")} />
          <small>{w("cookmode.yourPhoneListensWhileYou")}</small>
          <div className="button-row"><button className="pill pill-primary" onClick={() => choose("on")}>{w("cookmode.turnVoiceOn")}</button><button className="pill" onClick={() => choose("off")}>{w("cookmode.buttonsOnly")}</button></div>
        </section>
      )}
      {done ? (
        <>
          <section className="cook-card cook-done">
            <div aria-hidden="true">🍽️</div>
            <b>{w("cookmode.doneEnjoyYourMeal")}</b>
            {link.eat
              ? <small>{tookLine(steps.length, link.since)} {w("cookmode.nowAPhotoOfYourPlate")}</small>
              : <small>{wn("cookmode.allStepsTicked", steps.length)}</small>}
          </section>
          {link.eat ? (<>
            {/* DT222 (0.3.60, board Stories165): the next step is the meal's photo, then Eat; Make is a small link */}
            {link.mealPhoto && (link.mealPhoto.src
              ? <div className="cook-meal-shot"><img src={link.mealPhoto.src} alt={w("cookmode.yourMeal")} />
                  <PhotoPick onFile={(f) => link.mealPhoto!.take(f)}>{({ toggle, open }) => <button type="button" className="link cook-meal-again" aria-expanded={open} onClick={toggle}>{w("cookmode.takeItAgain")}</button>}</PhotoPick></div>
              : <PhotoPick onFile={(f) => link.mealPhoto!.take(f)}>{({ toggle, open }) => <button type="button" className="pill pill-wide cook-meal-take" aria-expanded={open} onClick={toggle}><span aria-hidden="true">📷</span>{w("cookmode.photoOfYourMeal")}<small>{w("cookmode.itGoesOnTheMeal")}</small></button>}</PhotoPick>)}
            <button className="pill pill-wide pill-primary cook-to-eat" onClick={() => link.eat!()}>{w("cookmode.cookedNextEat")}</button>
            <div className="cook-done-links"><button className="link" onClick={back}>{w("cookmode.lastStepBack")}</button><button className="link" onClick={close}>{w("cookmode.makeStepPhotosAndNotes")}</button></div>
          </>) : (<>
            <button className="pill pill-wide pill-primary" onClick={close}>{link.doneLabel ?? w("cookmode.backToMake")}</button>
            <button className="link" onClick={back}>{w("cookmode.backToTheLastStep")}</button>
          </>)}
        </>
      ) : (
        <>
          {prep ? (
          <section className="cook-card cook-ready" aria-live="polite">
            <div className="cook-ready-top"><small>{w("cookmode.readyHead", { k: Math.min(put.size + 1, readyFoods.length), n: readyFoods.length })}</small>
              {pAt >= 0 && <button type="button" className="pill pill-small cook-ready-skip" onClick={toSteps}>{w("cookmode.toStep1")}</button>}</div>
            <b className="cook-ready-title">{w("cookmode.readyTitle")}</b>
            <div className="cook-ready-list" role="group" aria-label={w("cookmode.readyTitle")}>
              {readyFoods.map((i, j) => { const isPut = put.has(i.id), cur = j === pAt; return (
                <button type="button" key={i.id} className={`cook-ready-food${isPut ? " put" : ""}${cur ? " on" : ""}`} aria-pressed={isPut} aria-current={cur ? "step" : undefined} onClick={() => tapFood(j)}>
                  <span className="cook-ready-box" aria-hidden="true">{isPut ? "✓" : ""}</span>
                  <span className="cook-ready-name">{stepParts(readyToken(i), items).map((p, x) => ("text" in p ? p.text : <b key={x}>{p.label}</b>))}</span>
                  {cur && on && <span className="cook-ready-say" aria-hidden="true">🔊</span>}
                </button>); })}
            </div>
            {pAt < 0 && <><p className="cook-ready-done"><b>{w("cookmode.allReady")}</b> {w("cookmode.step1Next")}</p>
              <button type="button" className="pill pill-primary pill-wide" onClick={toSteps}>{w("cookmode.toStep1")}</button></>}
          </section>
          ) : (
          <section className={`cook-card cook-step${pics[k] ? " has-pic" : ""}`} aria-live="polite">
            {pics[k] && (() => { const list = allPics[k]?.length ? allPics[k] : [pics[k]!], n = Math.min(picN, list.length - 1), pic = list[n]; return <>
              <div className="cook-pic-box"><img className="cook-pic" src={pic.src} alt={w("cookmode.stepN", { n: k + 1 })} />
                {list.length > 1 && <button type="button" className="cook-pic-next" aria-label={w("cookmode.nextPhoto")} onClick={() => setPicN((n + 1) % list.length)}>{w("cookmode.picNOf", { k: n + 1, n: list.length })} ›</button>}</div>
              <small className="cook-pic-label">{pic.by === "ai" ? w("cookmode.pictureDrawnByAiBeta") : link.stepPhoto?.kept ? w("cookmode.yourPhotoKeptWithThe") : w("cookmode.yourPhoto")}
              {/* DT276 step 2: one more photo of the step; nothing is replaced */}
              {link.stepPhoto && <PhotoPick key={`again-${k}`} onFile={(f) => link.stepPhoto!.take(k, f)}>{({ toggle, open }) => <button type="button" className="link cook-pic-again" aria-expanded={open} onClick={toggle}>{w("cookmode.addAnotherPhoto")}</button>}</PhotoPick>}</small></>; })()}
            <small>{w("cookmode.stepCaps", { n: k + 1 })}</small>
            <div className={`cook-text${mvs.length > 1 ? " cook-text-whole" : ""}`}>{stepParts(tempsIn(steps[k]), items).map((p, j) => ("text" in p ? p.text : <b key={j} className="st-amt">{p.label}</b>))}</div>
            {/* DT223 (0.3.60, board Stories165): a step without a picture: a small button to add your photo of it */}
            {!pics[k] && link.stepPhoto && <PhotoPick key={`add-${k}`} onFile={(f) => link.stepPhoto!.take(k, f)}>{({ toggle, open }) => <button type="button" className="pill pill-small cook-add-pic" aria-expanded={open} onClick={toggle}>{w("cookmode.addAPhotoOfThisStep")}</button>}</PhotoPick>}
            {/* DT217 v2: under the whole step, its moves, read aloud one at a time: done ones ticked, this one large */}
            {mvs.length > 1 && (
              <div className="cook-moves" aria-label={w("cookmode.moveOf", { k: m + 1, n: mvs.length })}>
                <small className="cook-moves-head">{w("cookmode.readAloudOneAtATime", { k: m + 1, n: mvs.length })}</small>
                {mvs.map((x, j) => (
                  <div key={j} className={`cook-move${j < m ? " done" : j === m ? " on" : ""}`} aria-current={j === m ? "step" : undefined}>
                    <span aria-hidden="true">{j < m ? "✓" : j === m ? "▶" : ""}</span>
                    <span>{stepParts(tempsIn(x), items).map((p, i) => ("text" in p ? p.text : <b key={i} className="st-amt">{p.label}</b>))}</span>
                  </div>))}
              </div>
            )}
            {(sec && !running) || link.look ? <div className="cook-step-actions">
              {sec && !running && <button className="pill cook-timer-start" onClick={() => { const a = startTimer(sec, name); say(a); }}>{startLabel(sec)}</button>}
              {link.look && <button className="pill cook-look" disabled={!!heard?.working} onClick={() => void lookNow()}>{w("cookmode.chefLookButton")}</button>}
            </div> : null}
          </section>
          )}
          <div className="cook-buttons">
            <button className="pill" disabled={prep ? pAt === 0 : k === 0 && m === 0} onClick={back}>{w("cookmode.back")}</button>
            <button className="pill" onClick={repeat}>{w("cookmode.repeat")}</button>
            <button className="pill pill-primary" onClick={next}>{prep ? (pAt < 0 ? w("cookmode.toStep1") : w("cookmode.next2")) : k === steps.length - 1 && m >= mvs.length - 1 ? w("cookmode.done") : w("cookmode.next2")}</button>
          </div>
          {heard && (
            <section className="cook-card cook-heard" aria-live="polite">
              <small>{heard.chef ? w("cookmode.youAsked") : w("cookmode.youSaid")}</small><b>{heard.said}</b>
              <small>{heard.chef ? w("cookmode.chefAboutStep", { n: (heard.step ?? k) + 1 }) : w("cookmode.chefCaps")}</small>
              <b>{heard.working ? w("cookmode.chefMealanIsThinking") : heard.answer}</b>
              {heard.chef && !heard.working && <small className="muted">{w("cookmode.readAloudNothingOnYour")}</small>}
              {heard.hint && <small className="muted cook-can-say">{heard.hint}</small>}
            </section>
          )}
          {ask && <form className="cook-card cook-ask-form" onSubmit={(e) => { e.preventDefault(); const q = typed.trim(); if (!q) return; setTyped(""); void askChef(q); }}>
            <label htmlFor="cook-ask-field"><b>{w("cookmode.askChefMealanAboutThis")}</b></label>
            <div className="cook-ask-row">
              <input id="cook-ask-field" className="search" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={on ? w("cookmode.orSayChefCanIUse") : w("cookmode.canIUseFrozenSpinach")} maxLength={400} />
              <button type="submit" className="pill pill-primary" disabled={!typed.trim() || !!heard?.working}>{w("cookmode.ask")}</button>
            </div>
          </form>}
          {hasEars ? (
            <div className="cook-card cook-listen">
              <span className={`cook-dot ${on ? "on" : ""}`} aria-hidden="true" />
              <small>{listenNote || (on ? <>{w("cookmode.listeningSay")} <b>{w("cookmode.cmdNext")}</b>, <b>{w("cookmode.cmdBack")}</b>, <b>{w("cookmode.cmdRepeat")}</b>, <b>{w("cookmode.cmdHowMuch")}</b>, <b>{w("cookmode.cmdTimer")}</b>, <b>{w("cookmode.cmdWhatsLeft")}</b>, <b>{w("cookmode.cmdStop")}</b>. {w("cookmode.orAskStartWith")} <b>{w("cookmode.cmdChef")}</b>.</> : w("cookmode.voiceOffTheButtonsWork"))}</small>
              <button className="pill pill-small" onClick={() => choose(on ? "off" : "on")}>{on ? w("cookmode.voiceOff") : w("cookmode.voiceOn")}</button>
              {/* DT215 v3 (0.3.66, board Stories162b): Voice › opens Voice while cooking; cooking waits where it was */}
              <button className="link cook-voice-link" onClick={() => setVoicePage(true)}>{w("cookmode.voice")}</button>
            </div>
          ) : (
            <><small className="muted cook-under">{w("cookmode.thisBrowserCanTListen")} {canSpeak() ? w("cookmode.eachStepCanStillBe") : ""}{canSpeak() && <button className="link" onClick={() => choose(on ? "off" : "on")}>{on ? w("cookmode.stopReadingAloud") : w("cookmode.readStepsAloud")}</button>}</small>{canSpeak() && <button className="link cook-voice-link" onClick={() => setVoicePage(true)}>{w("cookmode.voice")}</button>}</>
          )}
          <small className="muted cook-under">{w("cookmode.theScreenStaysOn")}{on ? ` ${w("cookmode.eachStepIsReadAloud")}` : ""}</small>
          {link.pair}
          <details className="cook-card cook-foods">
            <summary>{w("cookmode.whatSInIt")}</summary>
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
