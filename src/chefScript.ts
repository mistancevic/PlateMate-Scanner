// DT213 (0.3.74, board Stories172; Coach Milan 2 November 12:03 to 12:17, Go 3 November 18:21): Chef Mealan's script. Every line
// he says, by name, in one place: the screen shows it in his bubble (ChefLine) and voice (VO1) will read the same words. The
// numbers and names are filled in by code. src/chefScript.test.ts checks that no ChefLine is written anywhere but here.
import { getLang, srCount, type Lang } from "./lang";
import deLines from "./i18n/de.json" with { type: "json" };
import { wIn, wnIn, mealV } from "./words";
import { whenWords, whenIn, agoWords, agoIn } from "./cooking";
import srLines from "./i18n/sr-Latn.json" with { type: "json" };
const n = (k: number, one: string, many = `${one}s`) => `${k} ${k === 1 ? one : many}`;
export const CHEF = {
  // ---- the Plate ----
  photoWhose: (from: string) => `${from.replace(/\.$/, "")}. Whose plate is it, and when?`,
  photoNoFoods: () => "I could not find foods on this photo. Take it again, from above with the whole plate in, or add the foods yourself.",
  oneDish: () => "A food here is cooked, so these foods are made together. Is this one dish? Grouped into parts, Fit keeps each part's proportions and the steps go part by part.",
  whatMoment: () => "What kind of moment?",
  // DT203 release 2 (0.3.77): the plate's time and foods come raw; each language makes its own words of them
  plateOldAte: (at: Date, plate: PlateIn) => `Your plate from ${whenWords(at)}. ${plate("en")}. Did you eat it?`,
  plateOldBeforeCook: (at: Date, plate: PlateIn) => `Before you cook: your plate from ${whenWords(at)}. ${plate("en")}. Did you eat it?`,
  plateSaveOrClear: (foods: number, since: Date | null, dish: string) => `Your plate has ${n(foods, "food")}, from ${since ? agoWords(since) : "now"}. ${dish} starts on its own plate. Shall I save yours for later, or clear it?`,
  plateAddOrNew: (foods: number, title: string, what: string, photo: boolean) => `Your plate already has ${n(foods, "food")}${title ? `: ${title}` : ""}. ${what} ${photo ? "Add them to yours, or start a new plate with them?" : "Start a new plate with it, or add it to yours?"}`,
  whereGoes: () => "Where does this go?",
  // ---- cooking ----
  scanWhileCooking: (dish: string, food: string) => `You are cooking ${dish}. Shall I use this ${food} in it, put it on the Plate, or keep it in your foods?`,
  useInCook: (food: string, dish: string) => `${food}: what does it replace in ${dish}, or does it add to it?`,
  handsFree: () => "Cook hands free?",
  whoMadePhoto: () => "Who made it?",
  howCooking: () => "How did the cooking go?",
  resume: (dish: string, done: string) => `You were cooking ${dish}${done ? `: ${done}` : ""}. Go on where you left off?`,
  // ---- eating ----
  howMuchAte: () => "Enjoy it. How much did you eat?",
  howManyAte: (made: string) => `You made ${made}. How many did you eat?`,
  howTaste: () => "And how did it taste?",
  didTryWork: (kind: "change" | "side") => (kind === "change" ? "Did the swap work?" : "Did the side work?"),
  remember: () => "Anything you want to remember about it?",
  carryLater: () => "About 30 minutes on: how did it carry you?",
  carryNow: (min: number) => `How did it carry you? Answer now, or in ${n(min, "minute")}, when I ask.`,
  // ---- the day ----
  whichMeal: () => "Which meal is it?",
  whatDay: () => "What kind of day is it?",
  busyMeal: (meal: string, time: string, block: string, day: string) => `${meal} at ${time} is in a busy block, ${block}. Move it for ${day}?`,
  busyLate: (until: string, meal: string, time: string, free: number, quick: string, aheadDay: string | null) => `Busy until ${until}. ${meal} at ${time} leaves ${free ? `${free} minutes` : "no time"} to cook. A quick ${quick}${aheadDay ? `, or cook on ${aheadDay} and warm it up` : ""}?`,
  busyCarry: (block: string, meal: string) => `Booked from ${block}. Take ${meal} along?`,
  busyTraining: (time: string, block: string, day: string) => `Training at ${time} is in a busy block, ${block}. Move it for ${day}?`,
  // ---- DT240 to DT247 (0.3.96, boards Stories182 and Stories183; Go 6 November 12:24) ----
  cookOpen: (cook: string, dish: string) => `You were cooking ${cook}. A new plate came in. Go on with ${dish}, or end it?`,
  photoLost: () => "The connection was lost. Your photo is kept.",
  plateFills: (meal: string, kcal: string) => `Your plate already fills this ${meal.toLowerCase()}: ${kcal} kcal, in its range.`,
  secondDish: (dish: string, minutes: number, prev: string, meal: string) => `${dish}, ${n(minutes, "minute")} after your ${prev}. Dessert to your ${meal.toLowerCase()}, or its own snack?`,
} as const;
export type ChefLineName = keyof typeof CHEF;
// DT203 (0.3.76): his lines in Srpski (latinica), in src/i18n/sr-Latn.json, written in Coach Milan's table. A line goes into the
// app only once he ticked it; until then it stays English. Slots in braces ({dish}) take the values below, in his order.
// A line whose slots are English words made elsewhere (a day name, "yesterday", a calendar block) waits for the screens.
type SrSlots = (...a: any[]) => Record<string, string | null>;
const local = (): Exclude<Lang, "en"> => { const l = getLang(); return l === "en" ? "sr-Latn" : l; };
// a plate in words, in a language: its name, or its foods; null while a word of it has no ticked Serbian
export type PlateIn = (l: Lang) => string | null;
export const SR_SLOTS: Partial<Record<ChefLineName, SrSlots>> = {
  scanWhileCooking: (dish: string, food: string) => ({ dish, food }),
  useInCook: (food: string, dish: string) => ({ food, dish }),
  carryNow: (min: number) => ({ minutes: getLang() === "de" ? `${min} ${min === 1 ? "Minute" : "Minuten"}` : srCount(min, "minut", "minuta", "minuta") }),
  didTryWork: (kind: "change" | "side") => ({ kind }),
  // DT238 (0.3.92): in the language on this phone, Srpski or Deutsch
  plateOldAte: (at: Date, plate: PlateIn) => ({ when: whenIn(local(), at), plate: plate(local()) }),
  plateOldBeforeCook: (at: Date, plate: PlateIn) => ({ when: whenIn(local(), at), plate: plate(local()) }),
  plateSaveOrClear: (foods: number, since: Date | null, dish: string) => ({ foods: wnIn(local(), "plate.foodsCount", foods), ago: since ? agoIn(local(), since) : wIn(local(), "ago.now"), dish }),
  // DT240 to DT247 (0.3.96): the meal's name and the minutes in the language on this phone
  cookOpen: (cook: string, dish: string) => ({ cook, dish }),
  plateFills: (meal: string, kcal: string) => ({ meal: (mealV(meal, true) as (l: Lang) => string | null)(local()) ?? meal, kcal }),
  secondDish: (dish: string, minutes: number, prev: string, meal: string) => ({ dish, minutes: getLang() === "de" ? `${minutes} ${minutes === 1 ? "Minute" : "Minuten"}` : srCount(minutes, "minut", "minuta", "minuta"), prev, meal: (mealV(meal, true) as (l: Lang) => string | null)(local()) ?? meal }),
};
// the slots each line takes, by name: the Serbian line names each of them once or more, and no other (the release check, the table)
export const SR_ALLOWED: Partial<Record<ChefLineName, string[]>> = {
  photoWhose: ["from"], plateOldAte: ["when", "plate"], plateOldBeforeCook: ["when", "plate"], plateSaveOrClear: ["foods", "ago", "dish"],
  plateAddOrNew: ["foods", "title", "what"], scanWhileCooking: ["dish", "food"], useInCook: ["food", "dish"], resume: ["dish", "done"],
  howManyAte: ["made"], carryNow: ["minutes"], busyMeal: ["meal", "time", "block", "day"], busyLate: ["until", "meal", "time", "free", "quick"],
  busyCarry: ["block", "meal"], busyTraining: ["time", "block", "day"],
  cookOpen: ["cook", "dish"], plateFills: ["meal", "kcal"], secondDish: ["dish", "minutes", "prev", "meal"],
};
export const slotsOf = (t: string) => [...new Set([...t.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort();
// a slot the line misses, or one it names that the app does not fill; empty when the line fits
export function slotProblems(k: string, t: string): string[] {
  const want = [...(SR_ALLOWED[k as ChefLineName] ?? [])].sort(), have = slotsOf(t);
  const parts = t.split("|");
  // didTryWork: the swap|the side. Any other line: one form, or he|she (Pojeo si|Pojela si), the profile's sex picks
  const two = k === "didTryWork" ? (parts.length !== 2 ? ["Two lines are needed, split by |"] : []) : parts.length > 2 ? ["At most two forms, he|she"] : [];
  const each = k === "didTryWork" || parts.length === 1 ? [t] : parts;
  const out: string[] = [...two];
  for (const p of each) { const h = slotsOf(p); for (const x of want) if (!h.includes(x)) out.push(`{${x}} is missing`); for (const x of h) if (!want.includes(x)) out.push(`{${x}} is not a slot here`); }
  if (k === "didTryWork" || parts.length === 1) { out.length = two.length; out.push(...want.filter((x) => !have.includes(x)).map((x) => `{${x}} is missing`), ...have.filter((x) => !want.includes(x)).map((x) => `{${x}} is not a slot here`)); }
  return [...new Set(out)];
}
// the lines that wait for the screens: their slots are English words made outside the script
export const SR_LATER: ChefLineName[] = ["photoWhose", "plateAddOrNew", "busyMeal", "busyLate", "busyCarry", "busyTraining", "resume", "howManyAte"];
type SrLine = { text: string; checked: boolean };
const SR = (srLines as unknown as { chef: Record<string, SrLine> }).chef;
const DE = (deLines as unknown as { chef: Record<string, SrLine> }).chef;
const isShe = () => { try { return JSON.parse(localStorage.getItem("chefmealan-personal") || "{}").sex === "female"; } catch { return false; } };
export function fill(t: string, v: Record<string, string>) { return t.replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m)); }
// a Serbian line, when it is ticked and every slot it names is filled; else null (the English one is used)
export function srLine(k: ChefLineName, a: unknown[]): string | null {
  const l = (getLang() === "de" ? DE : SR)[k];
  if (!l || !l.checked || SR_LATER.includes(k)) return null;
  const v0 = SR_SLOTS[k] ? SR_SLOTS[k]!(...a) : {};
  // a value with no ticked Serbian yet keeps the whole line English
  if (Object.values(v0).some((x) => x === null)) return null;
  const v = v0 as Record<string, string>;
  if (k === "didTryWork") return fill(l.text.split("|")[a[0] === "change" ? 0 : 1] ?? l.text, v);
  const forms = l.text.split("|");
  const out = fill(forms.length === 2 ? forms[isShe() ? 1 : 0] : l.text, v);
  return /\{\w+\}/.test(out) ? null : out;
}
// one of his lines, by name: say("howCooking"), say("carryNow", 12); in the language he speaks on this phone
export function say<K extends ChefLineName>(k: K, ...a: Parameters<(typeof CHEF)[K]>): string {
  if (getLang() !== "en") { const sr = srLine(k, a); if (sr) return sr; }
  return (CHEF[k] as (...x: unknown[]) => string)(...a);
}
