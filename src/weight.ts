// Weigh-ins and the trend (canvas boards W0 to W2, approved 7 October 2026). One weigh-in per date; one morning is noise,
// so the app only ever reads the 7-day average. The last 4 weeks compare the first week's average with the last week's,
// against what the goal expects for the same time. Numbers change only when the person says so.
import type { Safety } from "./safety";

export type WeighIn = { date: string; kg: number }; // date as the local YYYY-MM-DD
const DAY = 864e5;
const ymdOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dayNo = (ymd: string) => Math.round(new Date(`${ymd}T12:00:00`).getTime() / DAY);

export const isWeight = (kg: number) => Number.isFinite(kg) && kg >= 30 && kg <= 300;
// the newest weigh-in of a date replaces the one before; kept sorted, a year and a half at most
export function withWeighIn(list: WeighIn[] | undefined, kg: number, date = new Date()): WeighIn[] {
  const d = ymdOf(date);
  const next = [...(list ?? []).filter((w) => w.date !== d), { date: d, kg: Math.round(kg * 10) / 10 }].sort((a, b) => (a.date < b.date ? -1 : 1));
  return next.slice(-550);
}
export const withoutWeighIn = (list: WeighIn[] | undefined, date: string) => (list ?? []).filter((w) => w.date !== date);

// the average of the weigh-ins in the 7 days ending on a date
export function avg7(list: WeighIn[] | undefined, end = new Date()): number | null {
  const e = dayNo(ymdOf(end));
  const w = (list ?? []).filter((x) => { const n = dayNo(x.date); return n <= e && n > e - 7; });
  return w.length ? Math.round((w.reduce((a, x) => a + x.kg, 0) / w.length) * 10) / 10 : null;
}

// Someone who declared a difficult relationship with eating sees no weigh-ins and no trend; neither does their coach.
export const weighInsOff = (s: Pick<Safety, "situations"> | null | undefined) => Boolean(s?.situations?.includes("eating"));

export type Verdict = "on track" | "faster" | "slower" | "up" | "down" | "too few";
export type Trend = {
  first: number | null; last: number | null; change: number | null; weeks: number; count: number;
  expected: [number, number]; verdict: Verdict; points: { day: number; kg: number }[]; averages: { day: number; kg: number }[];
};
// what the goal expects over a number of weeks, in kg (negative is down)
export function expectedChange(band: string, weightKg: number, weeks: number, trainingAge?: string): [number, number] {
  const pct = (lo: number, hi: number) => [(weightKg * lo) / 100, (weightKg * hi) / 100] as [number, number];
  const month = weeks / (30.4 / 7);
  if (band === "fatloss") { const [a, b] = pct(0.5, 1); return [-b * weeks, -a * weeks]; }
  if (band === "gain") { const [a, b] = pct(0.25, 0.5); return [a * weeks, b * weeks]; }
  if (band === "gainsteady") { const [a, b] = trainingAge === "3p" ? pct(0.25, 0.5) : pct(0.5, 1); return [a * month, b * month]; }
  return [-0.5, 0.5]; // maintain, recomposition, performance: about the same
}
// The last 4 weeks: needs 3 weigh-ins in the first week and 3 in the last.
export function trendOf(list: WeighIn[] | undefined, band: string, weightKg: number, trainingAge?: string, now = new Date()): Trend {
  const end = dayNo(ymdOf(now)), start = end - 27;
  const inWin = (list ?? []).filter((w) => { const n = dayNo(w.date); return n >= start && n <= end; });
  const points = inWin.map((w) => ({ day: dayNo(w.date) - start, kg: w.kg }));
  const firstWeek = points.filter((p) => p.day <= 6), lastWeek = points.filter((p) => p.day >= 21);
  const mean = (xs: { kg: number }[]) => (xs.length ? xs.reduce((a, x) => a + x.kg, 0) / xs.length : null);
  const averages: { day: number; kg: number }[] = [];
  for (let d = 6; d <= 27; d++) { const w = points.filter((p) => p.day <= d && p.day > d - 7); if (w.length) averages.push({ day: d, kg: Math.round(mean(w)! * 100) / 100 }); }
  const weeks = 3;
  const expected = expectedChange(band, weightKg, weeks, trainingAge).map((x) => Math.round(x * 10) / 10) as [number, number];
  const first = mean(firstWeek), last = mean(lastWeek);
  if (firstWeek.length < 3 || lastWeek.length < 3 || first === null || last === null)
    return { first: first === null ? null : Math.round(first * 10) / 10, last: last === null ? null : Math.round(last * 10) / 10, change: null, weeks, count: points.length, expected, verdict: "too few", points, averages };
  const change = Math.round((last - first) * 10) / 10;
  const [lo, hi] = expected, slack = 0.1;
  const flat = band !== "fatloss" && band !== "gain" && band !== "gainsteady";
  let verdict: Verdict = "on track";
  if (change < lo - slack) verdict = flat ? "down" : band === "fatloss" ? "faster" : "slower";
  else if (change > hi + slack) verdict = flat ? "up" : band === "fatloss" ? "slower" : "faster";
  return { first: Math.round(first * 10) / 10, last: Math.round(last * 10) / 10, change, weeks, count: points.length, expected, verdict, points, averages };
}
export const VERDICT_WORDS: Record<Verdict, string> = { "on track": "On track", faster: "Faster than expected", slower: "Slower than expected", up: "Going up", down: "Going down", "too few": "Not enough weigh-ins yet" };
// what it usually means, and what to try: advice to read, never a change to the numbers
export function verdictNote(band: string, v: Verdict): string | null {
  if (v === "on track") return null;
  if (v === "too few") return "The trend needs 3 weigh-ins in the first week and 3 in the last. Most coaches ask for 3 to 7 mornings a week, same time, before breakfast.";
  const n: Record<string, Partial<Record<Verdict, string>>> = {
    gainsteady: { faster: "For Steady, faster usually means more of it is fat. Take about 100 kcal off, mostly carbs on days without training, and look again in 2 weeks.", slower: "If your lifts are going up, this is fine. If they're stuck too, add about 100 kcal, mostly carbs around training, and look again in 2 weeks." },
    gain: { faster: "Faster than 0.5 % a week is mostly fat. Take about 150 kcal off and look again in 2 weeks.", slower: "Add about 150 kcal, mostly carbs around training, and look again in 2 weeks." },
    fatloss: { faster: "Losing faster risks muscle and energy. Add about 100 to 150 kcal, keep protein and lifting as they are.", slower: "Look at the weekends first. Then take about 100 kcal off, or add steps, and look again in 2 weeks." },
  };
  return n[band]?.[v] ?? "More change than this goal expects. Small changes in food or steps bring it back; talk to your coach if it goes on.";
}
// the trend in a sentence of numbers, for the coach's list
export const fmtKg = (x: number) => `${x > 0 ? "+" : x < 0 ? "−" : "±"}${Math.abs(x).toFixed(1)} kg`;
