// Numbers evals (7 October 2026). The Product Faculty method, adapted for a calculator inside a real app:
// dimensions name the people (evals/dimensions.md), one case per combination that matters (evals/number-cases.json),
// code checks on every push, the coach labels each case by hand on Menu, Evals. There is no judge model: the numbers
// are deterministic, so the coach's pass is the reference, and the numbers of a passed case are kept as a check.
import { calculate, ADJ, type Personal } from "./personal";
import { goalLabel } from "./goal";

export type NumberCase = { id: string; title: string; dimensions: Record<string, string>; band: string; look: string; personal: Personal; coach?: { label: "pass" | "fail"; reason?: string; kcal?: number; protein?: number; at: string } };
export type NumberOutput = {
  kcal: number; protein: number; fats: number; carbs: number; proteinMin: number; proteinMax: number; perKg: number; lo: number; hi: number;
  maintenance: number; bmr: number; days: { name: string; what: string; kcal: number; carbs: number }[]; why: string[]; method: string;
};
export type Snapshot = Record<string, { kcal: number; protein: number; fats: number; carbs: number; days: number[] }>;

export function numbersOf(c: NumberCase): NumberOutput | null {
  const r = calculate(c.personal, c.band);
  const m = calculate(c.personal, "maintain");
  if (!r || !m) return null;
  const days = r.weekdays
    ? r.weekdays.map((d) => ({ name: d.name.slice(0, 3), what: d.how.find((l) => /^\+ \d+ for \d+ min/.test(l))?.replace(/ \(.*$/, "").replace(/^\+ \d+ for /, "") ?? (d.day.kind === "rest" ? "no training" : d.day.kind), kcal: d.kcal, carbs: d.carbs }))
    : [];
  return { kcal: r.kcal, protein: r.protein, fats: r.fats, carbs: r.carbs, proteinMin: r.proteinMin, proteinMax: r.proteinMax, perKg: r.proteinPerKg, lo: r.proteinLo, hi: r.proteinHi, maintenance: m.kcal, bmr: r.bmr, days, why: r.proteinWhy, method: r.method };
}

// What every answer must hold, whoever the person is.
export function numberChecks(c: NumberCase, o: NumberOutput, recorded?: Snapshot[string]): Record<string, boolean> {
  const p = c.personal;
  const trains = (p.plan ?? []).filter((d) => d.kind !== "rest" && (d.intensity === "moderate" || d.intensity === "hard")).length >= 2;
  const age = p.birthYear ? new Date().getFullYear() - p.birthYear : 0;
  const diet = String(p.lifestyle?.diet ?? "").toLowerCase();
  const top = c.band === "fatloss" || age >= 60 || diet === "vegan" || diet === "vegetarian";
  const adj = ADJ[c.band] ?? 0;
  const ratio = o.kcal / o.maintenance - 1;
  const add = (k: number, pr: number, f: number, cb: number) => Math.abs(pr * 4 + f * 9 + cb * 4 - k) <= 25;
  const fatShare = (o.fats * 9) / o.kcal;
  const checks: Record<string, boolean> = {
    "macros add up to the calories": add(o.kcal, o.protein, o.fats, o.carbs) && o.days.every((d) => add(d.kcal, o.protein, o.fats, d.carbs)),
    "fat 20–35 % of energy": fatShare >= 0.2 && fatShare <= 0.35,
    "protein inside its range": o.protein >= o.proteinMin && o.protein <= o.proteinMax,
    [`protein range for ${trains ? "someone who trains (1.6–2.2)" : "someone who doesn't train (1.2–1.6)"}`]: trains ? o.lo === 1.6 && o.hi === 2.2 : o.lo === 1.2 && o.hi === 1.6,
    [top ? "protein at the top of the range" : "protein in the middle of the range"]: Math.abs(o.perKg - (top ? (trains ? 2.2 : 1.6) : trains ? 1.9 : 1.4)) < 0.01,
    [`${goalLabel(c.band)}: ${adj === 0 ? "as much as maintenance" : `${adj > 0 ? "+" : "−"}${Math.round(Math.abs(adj) * 100)} % of maintenance`}`]: Math.abs(ratio - adj) <= 0.03,
    "never under resting burn": o.kcal >= o.bmr && o.days.every((d) => d.kcal >= o.bmr),
    "carbs left on every day": o.carbs > 0 && o.days.every((d) => d.carbs > 0),
  };
  if (o.days.length && (p.plan ?? []).some((d) => d.intensity === "hard")) {
    const hard = Math.max(...o.days.filter((_, i) => p.plan![i].intensity === "hard").map((d) => d.kcal));
    const rest = Math.min(...o.days.filter((_, i) => p.plan![i].kind === "rest").map((d) => d.kcal));
    checks["a hard day gets more than a day without training"] = hard > rest;
  }
  if (recorded) checks["same numbers as recorded"] = recorded.kcal === o.kcal && recorded.protein === o.protein && recorded.fats === o.fats && recorded.carbs === o.carbs && recorded.days.join() === o.days.map((d) => d.kcal).join();
  if (c.coach?.label === "pass" && c.coach.kcal) checks["within 5 % of the coach's calories"] = Math.abs(o.kcal / c.coach.kcal - 1) <= 0.05;
  if (c.coach?.label === "pass" && c.coach.protein) checks["within 10 g of the coach's protein"] = Math.abs(o.protein - c.coach.protein) <= 10;
  return checks;
}
export const snapshotOf = (o: NumberOutput): Snapshot[string] => ({ kcal: o.kcal, protein: o.protein, fats: o.fats, carbs: o.carbs, days: o.days.map((d) => d.kcal) });
