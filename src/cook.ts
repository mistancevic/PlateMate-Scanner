// DT174 (0.3.16, board Stories121; Coach Milan 30 October 16:39 Go): cook mode. One big step at a time, read aloud, steered by
// voice or by tap. Everything here runs on the phone: the browser's own speech recognition and the phone's own voice. Nothing
// goes to Gemini. This file is the part without a screen: what a step's timer is, what was said, how much of a food.
import type { Ingredient, StepMoves } from "./pilot";
import { TOKEN, stepText, shortName } from "./steps";

// a timer from the step's own words: "for 12 minutes", "6 to 8 minutes" (the first, to check early), "1 hour", "30 seconds"
const WORDS: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, forty: 40, "forty-five": 45, sixty: 60 };
const NUM = "(\\d+(?:[.,]\\d+)?|½|a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty-five|forty|sixty)";
const num = (s: string) => (s === "½" ? 0.5 : WORDS[s.toLowerCase()] ?? Number(s.replace(",", ".")));
const UNIT = "(hours?|hrs?|h|minutes?|mins?|seconds?|secs?)\\b";
const unitSec = (u: string) => (/^h/i.test(u) ? 3600 : /^m/i.test(u) ? 60 : 1);
export function secondsIn(text: string): number | null {
  const t = text.replace(TOKEN, (_, __, name: string) => name);
  const m = new RegExp(`\\b${NUM}(?:\\s*(?:-|to|or|–)\\s*${NUM})?\\s*${UNIT}`, "i").exec(t);
  if (!m) return null;
  const s = Math.round(num(m[1]) * unitSec(m[3]));
  return s >= 10 && s <= 6 * 3600 ? s : null;
}
// a timer is named after the first food of its step, else the step's number
export function timerName(step: string, k: number): string {
  const m = new RegExp(TOKEN.source).exec(step);
  const name = m ? m[2].trim() : "";
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : `Step ${k + 1}`;
}
export const clock = (sec: number) => { const s = Math.max(0, Math.round(sec)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60; return h ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}` : `${m}:${String(r).padStart(2, "0")}`; };
export const minutesWords = (sec: number) => (sec % 60 === 0 ? `${sec / 60} ${sec === 60 ? "minute" : "minutes"}` : sec < 60 ? `${sec} seconds` : `${Math.floor(sec / 60)} minutes ${sec % 60} seconds`);

// what was said: a command, or nothing we know (then the screen says what it heard and what it can do)
export type Command =
  | { kind: "next" } | { kind: "back" } | { kind: "repeat" } | { kind: "stop" } | { kind: "left" }
  | { kind: "howMuch"; food: string } | { kind: "timer"; seconds: number } | { kind: "none"; said: string }
  // DT175 (0.3.17): a question for Chef Mealan starts with Chef; everything else stays on the phone
  | { kind: "ask"; question: string }
  // DT175a (0.3.18): go to step 4
  | { kind: "goto"; step: number };
export function parseCommand(said: string): Command {
  const s = said.toLowerCase().replace(/[.,!?]/g, " ").replace(/\s+/g, " ").trim();
  if (!s) return { kind: "none", said };
  const chef = /^(?:hey |ok |okay )?chef(?: mealan| milan)?[,:]?\s*(.*)$/.exec(s);
  if (chef) { const q = chef[1].trim(); return q.length >= 3 ? { kind: "ask", question: q } : { kind: "none", said }; }
  const much = /\bhow (?:much|many)(?: of)?(?: the)? (.+)$/.exec(s);
  if (much) return { kind: "howMuch", food: much[1].replace(/\b(do i need|is it|is there|again|please)\b/g, "").trim() };
  const go = /^(?:(?:go|jump|back|skip) to )?step (\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)$|\b(?:go|jump|back|skip) to step (\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/.exec(s);
  if (go) { const n = num(go[1] ?? go[2]); if (Number.isFinite(n) && n >= 1) return { kind: "goto", step: Math.round(n) }; }
  if (/\btimer\b|\bset (?:a )?timer\b/.test(s)) {
    const sec = secondsIn(s);
    return sec ? { kind: "timer", seconds: sec } : { kind: "none", said };
  }
  if (/\b(what'?s|what is|how much is|how many steps are) left\b|\bwhat'?s next after\b/.test(s)) return { kind: "left" };
  if (/\b(stop|close|exit|finish cooking|end)\b/.test(s)) return { kind: "stop" };
  if (/\b(repeat|again|say that|read it|one more time|pardon|what was that)\b/.test(s)) return { kind: "repeat" };
  if (/\b(back|previous|go back|last step|before)\b/.test(s)) return { kind: "back" };
  if (/\b(next|done|ok next|continue|go on|forward|finished)\b/.test(s)) return { kind: "next" };
  return { kind: "none", said };
}

// how much of a food: from the amounts being cooked, and the step it first comes in
const plain = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const stem = (w: string) => w.replace(/(ies)$/, "y").replace(/(es|s)$/, "");
export function howMuch(food: string, steps: string[], items: Ingredient[]): string {
  const want = plain(food).split(" ").filter((w) => w.length > 2 && !["the", "and", "some"].includes(w)).map(stem);
  if (!want.length) return "Say the food too: how much rice, for example.";
  const score = (i: Ingredient) => { const words = plain(`${i.food.name} ${i.food.brand ?? ""}`).split(" ").map(stem); return want.filter((w) => words.some((x) => x === w || (w.length > 3 && x.startsWith(w)))).length; };
  const best = items.filter((i) => i.grams > 0).map((i) => ({ i, s: score(i) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s)[0];
  if (!best) return `${food.charAt(0).toUpperCase() + food.slice(1)} is not in this recipe.`;
  const tok = `[[i:${best.i.id}|${shortName(best.i.food)}]]`;
  const amount = stepText(tok, items);
  const at = steps.findIndex((x) => new RegExp(`\\[\\[i:${best.i.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\|`).test(x));
  return `${amount.charAt(0).toUpperCase() + amount.slice(1)}${at >= 0 ? `. In step ${at + 1}.` : "."}`;
}
// what is left, said aloud
export function leftLine(k: number, steps: string[], items: Ingredient[]): string {
  const left = steps.length - k - 1;
  if (left <= 0) return "This is the last step.";
  return `${left} ${left === 1 ? "step" : "steps"} after this one. Next: ${stepText(steps[k + 1], items)}`;
}
// the step as it is read aloud: amounts in words the voice reads well
export const spoken = (step: string, items: Ingredient[]) => stepText(step, items).replace(/(\d+(?:[.,]\d+)?) g\b/g, "$1 grams").replace(/(\d+) ml\b/g, "$1 millilitres").replace(/°C\b/g, " degrees");

export const VOICE_KEY = "chefmealan-cook-voice";
export type VoiceChoice = "on" | "off" | null;
export function voiceChoice(): VoiceChoice { try { const v = localStorage.getItem(VOICE_KEY); return v === "on" || v === "off" ? v : null; } catch { return null; } }
export function setVoiceChoice(v: "on" | "off") { try { localStorage.setItem(VOICE_KEY, v); } catch { /* private mode: asked again next time */ } }

// 0.3.54 (Coach Milan 2 November 14:20, on the preview): the microphone heard the phone's own voice. It read its answer aloud,
// heard part of it ("recipe", "repeat how much timer ... about the dish") as a command, answered that, and went round in a
// circle while his own words were lost. While the phone speaks nothing is taken; just after, words that are the phone's own
// line are dropped. A short command of the cook's (next, back) stays a command.
const wordsOf = (t: string) => t.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
// the heard words are mostly words of what the phone just said
function ownWords(heard: string, spoken: string): boolean {
  const h = wordsOf(heard), s = new Set(wordsOf(spoken));
  if (!h.length || !s.size) return false;
  return h.filter((w) => s.has(w)).length / h.length >= 0.7;
}
// 0.3.55 (Coach Milan 14:47, cut in): while the phone reads, a command of the cook's stops it: next, back, repeat, stop, what's
// left, go to step N. Taken only when its words are not the sentence being read (the help line says next and back itself).
export function cutsIn(heard: string, spoken: string): boolean {
  const k = parseCommand(heard).kind;
  if (!(k === "next" || k === "back" || k === "repeat" || k === "stop" || k === "left" || k === "goto")) return false;
  return !ownWords(heard, spoken);
}
export function isEcho(heard: string, spoken: string): boolean {
  const h = wordsOf(heard), s = new Set(wordsOf(spoken));
  if (!h.length || !s.size) return false;
  // one or two words that are a plain command (next, back, repeat, stop, what's left) are the cook's, even right after the help line
  const k = parseCommand(heard).kind;
  if (h.length <= 2 && (k === "next" || k === "back" || k === "repeat" || k === "stop" || k === "left")) return false;
  const inIt = h.filter((w) => s.has(w)).length;
  return inIt / h.length >= 0.7;
}

// DT217 v2 (0.3.56, board Stories163; Coach Milan 2 November 16:09 to 16:38, Go): cook mode reads a step one move at a time,
// one food or one action, while the whole step stays on screen. Moves Chef Mealan drafted with the steps are used as they
// are; a step without them gets them here, in code: each food the step names becomes Add, then the step's own action. A step
// with one food or none is one move, the step itself.
const T = () => new RegExp(TOKEN.source, "g");
const sentences = (s: string) => s.split(/(?<=[.!?])\s+(?=[A-Z])/).map((x) => x.trim()).filter(Boolean);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const end = (s: string) => (/[.!?]$/.test(s) ? s : `${s}.`);
export function movesFor(step: string, drafted?: string[] | null): string[] {
  if (drafted && drafted.length) return drafted;
  // foods written as a list (a, b and c) are added one at a time; the sentence then says what to do with "them"
  const LIST = new RegExp(`${TOKEN.source}(?:\\s*(?:,\\s*and|,|and)\\s*${TOKEN.source})+`, "g");
  if ([...step.matchAll(T())].length >= 2) {
    const out: string[] = [];
    let split = false;
    for (const sen of sentences(step)) {
      const lists = [...sen.matchAll(LIST)];
      if (!lists.length) { out.push(sen); continue; }
      split = true;
      for (const l of lists) for (const t of l[0].matchAll(T())) out.push(`Add ${t[0]}.`);
      const rest = sen.replace(LIST, "them").trim();
      if (!/^(add|put|place|tip)\s+them\s*[.!]?$/i.test(rest)) out.push(end(cap(rest.replace(/^(add|put|place|tip)\s+them\s+and\s+/i, ""))));
    }
    return split ? out : [step];
  }
  // a step written in words with its amounts (the bowl steps kept before 0.3.56): Add 104 g Eggs and 100 g Milk ... and stir
  const AMT = /(?:^|,\s*|\s+and\s+)(?=\d+(?:[.,]\d+)?\s?(?:g|ml|kg)\b)/;
  const TAIL = /^(.*?)(?:\s+and\s+(?=[a-z])|\s+(?=(?:until|in a|in the|into|on top|over|with|for|then)\b))(.*)$/;
  const out: string[] = [];
  let split = false;
  for (const sen of sentences(step)) {
    const head = sen.match(/^(.*?)(\d+(?:[.,]\d+)?\s?(?:g|ml|kg)\b.*)$/);
    const parts = head ? head[2].split(AMT).map((x) => x.trim()).filter(Boolean) : [];
    if (parts.length < 2) { out.push(sen); continue; }
    split = true;
    const verb = head![1].trim() || "Add", adds = /^(add|put|place|tip)$/i.test(verb);
    const last = parts[parts.length - 1].replace(/[.!]$/, "");
    const t = last.match(TAIL), andTail = !!t && /\s+and\s+$/.test(last.slice(0, last.length - t[2].length));
    const items = [...parts.slice(0, -1), t ? t[1] : last];
    items.forEach((it, k) => out.push(end(adds && k === 0 ? `${cap(verb)} ${it}` : `Add ${it}`)));
    if (!adds) out.push(end(`${cap(verb)} them${t && !andTail ? ` ${t[2]}` : ""}`));
    if (t && (andTail || adds)) out.push(end(cap(t[2])));
  }
  return split ? out : [step];
}
// the moves Chef Mealan drafted, checked: one food at most in a move, every food of the step in one of its moves, no other
// food, no amount typed; {n} become the recipe's food chips. A step that fails gets its moves in code (null).
export function movesFromDraft(moves: unknown, draftSteps: string[], items: Ingredient[], token: (i: Ingredient) => string): StepMoves | undefined {
  if (!Array.isArray(moves)) return undefined;
  const out = draftSteps.map((st, k) => {
    const mv = moves[k];
    if (!Array.isArray(mv) || !mv.length || mv.length > 12) return null;
    const ms = mv.map((x) => String(x ?? "").replace(/\s+/g, " ").trim()).filter(Boolean);
    const want = new Set([...st.matchAll(/\{(\d+)\}/g)].map((m) => m[1]));
    const got: string[] = [];
    for (const m of ms) { const ns = [...m.matchAll(/\{(\d+)\}/g)].map((x) => x[1]); if (ns.length > 1) return null; got.push(...ns); if (/\b\d+\s?(g|grams?|kg|ml)\b/i.test(m.replace(/\{\d+\}/g, " "))) return null; }
    if (got.some((n) => !want.has(n)) || [...want].some((n) => !got.includes(n))) return null;
    return ms.map((m) => m.replace(/\{(\d+)\}/g, (_, n: string) => token(items[Number(n) - 1])));
  });
  // 0.3.57: kept as { m } per step, an empty m where the step gets its moves in code (no list inside a list)
  return out.some(Boolean) ? out.map((x) => ({ m: x ?? [] })) : undefined;
}

// DT221 (0.3.58, board Stories164; Coach Milan 2 November 17:58): when cook mode doesn't catch what was said, the phone says
// only this. The words the cook can say stay on the screen, small, never read aloud (canSayLine).
export const SAY_AGAIN = "Sorry, say that again?";
export function canSayLine(step: string, items: Ingredient[]): string {
  const low = (s: string) => s.toLowerCase();
  const word = (i: Ingredient) => low(i.food.name.split(/[ ,(]/)[0] ?? "");
  const food = /\[\[i:[^|\]]+\|([^\]]+)\]\]/.exec(step)?.[1]
    ?? items.map(word).find((w) => w.length > 2 && low(step).includes(w))
    ?? (items[0] ? word(items[0]) : "");
  return `You can say: next, back, repeat, ${food ? `how much ${low(food)}` : "how much and a food"}, timer 5 minutes, what's left, stop. Start with Chef to ask about the dish.`;
}
