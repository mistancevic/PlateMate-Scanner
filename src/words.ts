// DT203 release 2 (0.3.77; board Stories176, Coach Milan 4 November 00:04 Go, 04:38 in phases): the screens' words, out of the
// code. English in src/i18n/en.json, one line per key; Srpski (latinica) in src/i18n/sr-Latn.json under "screens", written and
// ticked in Coach Milan's table. A Serbian line shows only when it is ticked and fits; else the English one. Area by area.
// A line in braces takes a value: {food}. Serbian keeps the slots, anywhere in the sentence. Two kinds of lines:
//   he | she   Serbian past tense, "Pojeo sam|Pojela sam": the profile's sex picks (she: the second).
//   counts     English {"one", "other"}; Serbian "one|few|many" (1 namirnica, 2 namirnice, 5 namirnica).
import enLines from "./i18n/en.json" with { type: "json" };
import srLines from "./i18n/sr-Latn.json" with { type: "json" };
import { getLang, type Lang } from "./lang";

type EnLine = string | { text: string; gender: true } | { one: string; other: string };
const EN = enLines as unknown as Record<string, EnLine>;
export type WordKey = keyof typeof enLines;
type SrLine = { text: string; checked: boolean };
const SR = ((srLines as unknown as { screens?: Record<string, SrLine> }).screens ?? {});

const fill = (t: string, v: Record<string, string | number> = {}) => t.replace(/\{(\w+)\}/g, (m, k) => (k in v ? String(v[k]) : m));
export const slotsIn = (t: string) => [...new Set([...t.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort();
export const enText = (k: string): string => { const l = EN[k]; return typeof l === "string" ? l : "one" in l ? `${l.one}|${l.other}` : l.text; };
export const kindOf = (k: string): "plain" | "gender" | "count" => { const l = EN[k]; return typeof l === "string" ? "plain" : "one" in l ? "count" : "gender"; };
// the slots a key takes: those of its English line (both forms for a count)
export const slotsOf = (k: string) => slotsIn(enText(k).replace(/\|/g, " "));

// what is wrong with a Serbian line for a key; empty when it fits
export function screenProblems(k: string, t: string): string[] {
  if (!(k in EN)) return ["not a line of the app"];
  if (!t.trim()) return ["The line is empty"];
  const kind = kindOf(k), parts = t.split("|");
  const out: string[] = [];
  if (kind === "plain" && parts.length > 1) out.push("No | in this line");
  if (kind === "gender" && parts.length !== 2) out.push("Two forms are needed, he|she");
  if (kind === "count" && parts.length !== 3) out.push("Three forms are needed: 1|2 to 4|5 and on");
  const want = slotsOf(k);
  for (const p of kind === "plain" ? [t] : parts) {
    const have = slotsIn(p);
    for (const s of want) if (!have.includes(s)) out.push(`{${s}} is missing`);
    for (const s of have) if (!want.includes(s)) out.push(`{${s}} is not a slot here`);
  }
  return [...new Set(out)];
}

const she = () => { try { return JSON.parse(localStorage.getItem("chefmealan-personal") || "{}").sex === "female"; } catch { return false; } };
const srOf = (k: string): string[] | null => { const l = SR[k]; return l && l.checked && !screenProblems(k, l.text).length ? l.text.split("|") : null; };
const srCountForm = (n: number) => { const a = Math.abs(n) % 100, b = a % 10; return a >= 11 && a <= 14 ? 2 : b === 1 ? 0 : b >= 2 && b <= 4 ? 1 : 2; };

// A value for a slot is plain, or made in the line's own language: (l) => the day, the meal, a food's name in l. A value that
// has no Serbian yet (its own line is not ticked) answers null, and the whole line stays English: never two languages in one line.
export type Val = string | number | ((l: Lang) => string | null);
const vals = (l: Lang, v: Record<string, Val> = {}): Record<string, string | number> | null => {
  const out: Record<string, string | number> = {};
  for (const [k, x] of Object.entries(v)) { const y = typeof x === "function" ? x(l) : x; if (y === null) return null; out[k] = y; }
  return out;
};
// a line in a given language: Serbian only when ticked, fitting, and every value has its Serbian; else null
export function wIn(l: Lang, k: WordKey, v?: Record<string, Val>): string | null {
  const e = EN[k];
  if (l === "sr-Latn") { const s = srOf(k), x = s && vals(l, v); return s && x ? fill(kindOf(k) === "gender" ? s[she() ? 1 : 0] : s[0], x) : null; }
  return fill(typeof e === "string" ? e : "one" in e ? e.other : e.text, vals("en", v) ?? {});
}
// a screen's words: w("plate.craving"), w("plate.ateIt"), w("plate.underPortion", { grams: 35, food: foodV(f), min: 40, max: 250 })
export function w(k: WordKey, v?: Record<string, Val>): string {
  if (getLang() === "sr-Latn") { const s = wIn("sr-Latn", k, v); if (s !== null) return s; }
  return wIn("en", k, v)!;
}
// a count in a given language: wnIn("sr-Latn", "ago.hours", 3) → "pre 3 sata"; null as wIn
export function wnIn(l: Lang, k: WordKey, n: number, v: Record<string, Val> = {}): string | null {
  const e = EN[k] as { one: string; other: string };
  if (l === "sr-Latn") { const s = srOf(k), x = s && vals(l, { n: numIn(l, n), ...v }); return s && x ? fill(s[srCountForm(n)], x) : null; }
  return fill(n === 1 ? e.one : e.other, vals("en", { n: numIn("en", n), ...v }) ?? {});
}
// a count: wn("plate.seeAll", 20) → "See all 20 foods" · "Pogledaj svih 20 namirnica"
export function wn(k: WordKey, n: number, v: Record<string, Val> = {}): string {
  if (getLang() === "sr-Latn") { const s = wnIn("sr-Latn", k, n, v); if (s !== null) return s; }
  return wnIn("en", k, n, v)!;
}
// a word of its own as a value in another line: the line's language, or null
export const wordV = (k: WordKey): Val => (l) => wIn(l, k);
// the meals by their English names (Breakfast, Lunch, Snack, Dinner): their own words; another name stays as it is
const MEALS: Record<string, WordKey> = { breakfast: "meal.breakfast", lunch: "meal.lunch", snack: "meal.snack", dinner: "meal.dinner", meal: "meal.meal" };
export const mealV = (name: string, lower = false): Val => (l) => { const k = MEALS[name.toLowerCase()]; const t = k ? wIn(l, k) : name; return t === null ? null : lower ? t.toLowerCase() : t.charAt(0).toUpperCase() + t.slice(1); };
export const mealName = (name: string, lower = false): string => { const f = mealV(name, lower) as (l: Lang) => string | null; return (getLang() === "sr-Latn" ? f("sr-Latn") : null) ?? f("en")!; };

// ---- numbers (board Stories176, your call 2): in Srpski a decimal comma and a thousands point, on every screen at once ----
export const numLocale = () => (getLang() === "sr-Latn" ? "sr-Latn-RS" : "en-GB");
const sep = () => (getLang() === "sr-Latn" ? "," : ".");
// as toFixed, with the language's decimal mark: dec(5.53, 1) → "5.5" · "5,5"
export const dec = (n: number, d = 1) => { const s = n.toFixed(d); return sep() === "." ? s : s.replace(".", ","); };
// a whole number with the thousands mark: 2,450 · 2.450
export const numText = (n: number) => n.toLocaleString(numLocale(), { maximumFractionDigits: 0 });
const numIn = (l: Lang, n: number) => n.toLocaleString(l === "sr-Latn" ? "sr-Latn-RS" : "en-GB", { maximumFractionDigits: 0 });

// ---- dates (DT203 phase 9, 0.3.86): in the line's language. The phone's calendar (Intl) writes the day and month names, so a
// date needs no tick: sreda, 4. novembar · Wednesday, November 4. English keeps the form a screen already used (en or en-GB).
export const dateIn = (l: Lang, d: Date, o: Intl.DateTimeFormatOptions, en: string | string[] = "en-GB") => d.toLocaleDateString(l === "sr-Latn" ? "sr-Latn-RS" : en, o);
export const dateV = (d: Date, o: Intl.DateTimeFormatOptions, en: string | string[] = "en-GB"): Val => (l) => dateIn(l, d, o, en);
export const dateText = (d: Date, o: Intl.DateTimeFormatOptions, en: string | string[] = "en-GB") => dateIn(getLang(), d, o, en);
// a value that has words only in English (a coach's title, a day name made in code): Serbian gets its own, or the line stays English
export const enOnly = (t: string): Val => (l) => (l === "en" ? t : null);
// where a screen used the phone's own locale ([]): English keeps it, Srpski is Latin Serbian (the phone's sr-RS would be Cyrillic)
export const phoneLoc = (): string | string[] => (getLang() === "sr-Latn" ? "sr-Latn-RS" : []);
