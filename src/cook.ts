// DT174 (0.3.16, board Stories121; Coach Milan 30 October 16:39 Go): cook mode. One big step at a time, read aloud, steered by
// voice or by tap. Everything here runs on the phone: the browser's own speech recognition and the phone's own voice. Nothing
// goes to Gemini. This file is the part without a screen: what a step's timer is, what was said, how much of a food.
import type { Ingredient } from "./pilot";
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
  | { kind: "howMuch"; food: string } | { kind: "timer"; seconds: number } | { kind: "none"; said: string };
export function parseCommand(said: string): Command {
  const s = said.toLowerCase().replace(/[.,!?]/g, " ").replace(/\s+/g, " ").trim();
  if (!s) return { kind: "none", said };
  const much = /\bhow (?:much|many)(?: of)?(?: the)? (.+)$/.exec(s);
  if (much) return { kind: "howMuch", food: much[1].replace(/\b(do i need|is it|is there|again|please)\b/g, "").trim() };
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
