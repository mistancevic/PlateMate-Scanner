// DT108 (0.2.92, board Stories65; Milan 24 October 20:48 and 22:11): four letters read a food, a plate or a recipe against
// the person's day, no number needed. The first version of 21 September had it (XP, XF, XC, XFi and a string under the scan,
// [ P | f | C | fi ], capital High, small Moderate, a dash Low, fixed thresholds per profile). Back, in the EU label order:
// F fat, C carbohydrate, Fi fibre, P protein. Each letter reads the macro's grams per 100 kcal against the day's rate:
//   F+  more than the day's rate (the PD bands High and High+, from 1.5 times the rate)
//   F   as the day needs (On plan, 0.9 to 1.5 times)
//   f   under (Low, 0.6 to 0.9 times)
//   f-  close to none (Low−, under 0.6 times)
//   f?  no value for it (a label without fibre)
// The same five bands PD has (goal.ts BAND_EDGES), so protein's letter never disagrees with its PD band. The rates come
// from the plan, no new setting: protein from the PD target; fat and carbs from the day's numbers (fat 30 percent of
// energy, carbs the rest); fibre 14 g per 1,000 kcal (Dietary Guidelines for Americans, 2020) until the plan has its own.
// A letter says the level, never good or bad: F+ on a nut is the nut.
import { BAND_EDGES, fit, type PdBand } from "./goal";
import { w, wordV, dec, type WordKey } from "./words";

export type Rates = { fats: number; carbs: number; fiber: number; protein: number }; // grams per 100 kcal
export const FIBRE_PER_1000_KCAL = 14;
export type Numbers = { calories: number | null; protein: number | null; fats: number | null; carbs: number | null; fiber?: number | null };

// the day's rates: from its numbers, the PD target first for protein
export function ratesOf(day: { kcal: number; protein: number; fats: number; carbs: number } | null, pdRef: number | null): Rates | null {
  const kcal = day?.kcal ?? 0;
  const protein = pdRef ?? (day && kcal > 0 ? (day.protein / kcal) * 100 : null);
  if (protein === null || !(protein > 0)) return null;
  const fats = day && kcal > 0 ? (day.fats / kcal) * 100 : 3.3, carbs = day && kcal > 0 ? (day.carbs / kcal) * 100 : 10.9;
  return { protein, fats: Math.max(0.1, fats), carbs: Math.max(0.1, carbs), fiber: FIBRE_PER_1000_KCAL / 10 };
}

export const per100kcal = (grams: number | null | undefined, kcal: number | null | undefined): number | null =>
  grams === null || grams === undefined || !kcal || kcal <= 0 ? null : (grams / kcal) * 100;

const CAP = { fats: "F", carbs: "C", fiber: "Fi", protein: "P" } as const;
export type Macro = keyof typeof CAP;
export const LETTER_ORDER: Macro[] = ["fats", "carbs", "fiber", "protein"]; // the EU label order

export function letterOf(macro: Macro, value: number | null, rate: number): string {
  const cap = CAP[macro], low = cap.toLowerCase();
  if (value === null) return `${low}?`;
  const band: PdBand = fit(value, rate);
  return band === "top" || band === "high" ? `${cap}+` : band === "plan" ? cap : band === "close" ? low : `${low}-`;
}
export function lettersOf(n: Numbers, rates: Rates): string[] {
  return LETTER_ORDER.map((m) => letterOf(m, per100kcal(n[m], n.calories), rates[m]));
}
export const lettersText = (n: Numbers, rates: Rates | null): string | null => (rates ? lettersOf(n, rates).join(" ") : null);

// one sentence per letter, for the tap: F+ fat, 12.5 g per 100 kcal, more than your day's 3.3
// DT243 part two: the words in src/i18n/en.json (letters.*); the numbers with the language's decimal mark, written as before
const WORD: Record<Macro, WordKey> = { fats: "letters.word.fat", carbs: "letters.word.carbs", fiber: "letters.word.fibre", protein: "letters.word.protein" };
const plain = (x: number) => dec(x, (String(x).split(".")[1] ?? "").length);
export function letterLine(macro: Macro, value: number | null, rate: number): string {
  const l = letterOf(macro, value, rate), m = wordV(WORD[macro]);
  if (value === null) return w("letters.lineNoValue", { letter: l, macro: m });
  const v = plain(Math.round(value * 10) / 10), r = plain(Math.round(rate * 10) / 10);
  const k: WordKey = l.endsWith("+") ? "letters.lineMore" : l === CAP[macro] ? "letters.lineAs" : l.endsWith("-") ? "letters.lineCloseToNone" : "letters.lineUnder";
  return w(k, { letter: l, macro: m, v, rate: r });
}
// the word under a letter's grams in the readout cells (DT128, 0.2.107): fat, high · carbs, under · fibre, no value
export function letterWord(macro: Macro, value: number | null, rate: number): string {
  const l = letterOf(macro, value, rate), m = wordV(WORD[macro]);
  if (value === null) return w("letters.wordNoValue", { macro: m });
  return w(l.endsWith("+") ? "letters.wordHigh" : l === CAP[macro] ? "letters.wordAs" : l.endsWith("-") ? "letters.wordCloseToNone" : "letters.wordUnder", { macro: m });
}
// DT132 (0.2.113, board Stories88; Milan 14:21: not sure how to solve that; the suggestion taken): the quick line of four
// letters stays clean. Where the numbers are read (Per 100 kcal), a letter within 5 percent of a band edge says so; the letter
// itself never changes.
const EDGE_LINE: Record<"close" | "plan" | "high", WordKey> = { close: "letters.edgeClose", plan: "letters.edgePlan", high: "letters.edgeHigh" };
export function letterEdge(value: number | null, rate: number): string | null {
  if (value === null || !(rate > 0)) return null;
  const ratio = value / rate;
  for (const [k, e] of [["close", BAND_EDGES.close], ["plan", BAND_EDGES.plan], ["high", BAND_EDGES.high]] as const)
    if (Math.abs(ratio - e) / e < 0.05) return w(EDGE_LINE[k], { ratio: dec(ratio, 2), edge: plain(e) });
  return null;
}
export const bandsNote = () => w("letters.bandsNote", { high: plain(BAND_EDGES.high), plan: plain(BAND_EDGES.plan), close: plain(BAND_EDGES.close) });
