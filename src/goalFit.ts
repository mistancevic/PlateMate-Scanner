// DT335 (0.3.184, board Stories284; Go 23 November 2026, 14:13): which goals fit a body, and a target body weight.
// The list of goals stays whole; a goal that does not fit is greyed, and a tap says why. Only what the data says for sure:
// - Too light: a weight under the WHO underweight line for the height (BMI under 18.5). The EU uses the same lines (Eurostat;
//   European Commission, Knowledge for Policy). Recomposition and Lose fat are greyed: both mean eating less. No BMI number is
//   ever shown.
// - Too much body fat, only when body fat % is given: over the top of the healthy range by sex and age, from Gallagher et al.
//   2000 (Am J Clin Nutr 72:694), which links body fat to the WHO BMI lines. Gain healthy weight and Build muscle are greyed:
//   both mean eating more. Without body fat given, nothing on the heavy side is greyed (BMI fails for muscular men).
// A target body weight, for Gain healthy weight and Lose fat: a weight, never a change. A gain goes up to the top of the
// healthy weight for the height (BMI under 25); a loss goes down to the underweight line, with no top limit.
import { w } from "./words";
import { wWhole, hText } from "./units";
export type FitBody = { sex?: "female" | "male"; birthYear?: number; heightCm?: number; weightKg?: number; bodyFatPct?: number };
export type Unfit = { ids: string[]; why: "light" | "fat" } | null;
export const UNDERWEIGHT_BMI = 18.5, OVERWEIGHT_BMI = 25;
// the top of the healthy body fat range, by age: 20 to 39, 40 to 59, 60 to 79 (Gallagher et al. 2000, Table 4)
export const FAT_TOP: Record<"female" | "male", [number, number, number]> = { female: [33, 34, 36], male: [20, 22, 25] };
export const fatTop = (sex: "female" | "male", age: number) => FAT_TOP[sex][age < 40 ? 0 : age < 60 ? 1 : 2];
export const ageAt = (b: FitBody, now = new Date()) => (b.birthYear ? now.getFullYear() - b.birthYear : null);
// the healthy weight for a height, in whole kilos, inside the lines
export function healthyKg(heightCm: number): { low: number; high: number } {
  const m2 = (heightCm / 100) ** 2;
  return { low: Math.ceil(UNDERWEIGHT_BMI * m2), high: Math.ceil(OVERWEIGHT_BMI * m2) - 1 };
}
export const EAT_LESS = ["recomp", "fatloss"], EAT_MORE = ["healthy", "gain", "gainsteady"];
export function unfitOf(b: FitBody, now = new Date()): Unfit {
  if (b.heightCm && b.weightKg && b.weightKg < UNDERWEIGHT_BMI * (b.heightCm / 100) ** 2) return { ids: EAT_LESS, why: "light" };
  const age = ageAt(b, now);
  if (typeof b.bodyFatPct === "number" && b.sex && age !== null && b.bodyFatPct > fatTop(b.sex, age)) return { ids: EAT_MORE, why: "fat" };
  return null;
}
// a target weight checked against today's weight and the healthy weight for the height, with its pace
export type TargetKind = "healthy" | "fatloss";
export type TargetCheck =
  | { ok: true; kind: TargetKind; diff: number; months: [number, number] }
  | { ok: false; reason: "notAbove" | "notBelow" | "tooHigh" | "tooLow"; limit: number };
export function targetCheck(kind: TargetKind, target: number, b: FitBody): TargetCheck | null {
  if (!b.weightKg || !b.heightCm || !Number.isFinite(target) || target <= 0) return null;
  const { low, high } = healthyKg(b.heightCm), now = b.weightKg;
  if (kind === "healthy") {
    if (target <= now) return { ok: false, reason: "notAbove", limit: now };
    if (target > high) return { ok: false, reason: "tooHigh", limit: high };
    const diff = Math.round((target - now) * 10) / 10, m = Math.max(1, Math.ceil(diff - 0.05)); // roughly 1 kg a month
    return { ok: true, kind, diff, months: [m, m] };
  }
  if (target >= now) return { ok: false, reason: "notBelow", limit: now };
  if (target < low) return { ok: false, reason: "tooLow", limit: low };
  const diff = Math.round((now - target) * 10) / 10, perMonth = (pct: number) => now * pct * (30.4 / 7);
  return { ok: true, kind, diff, months: [Math.max(1, Math.ceil(diff / perMonth(0.01))), Math.max(1, Math.ceil(diff / perMonth(0.005)))] }; // 0.5 to 1 % a week
}
// how far she has come: from the first weigh-in after the target was set, or today's weight
export function targetProgress(target: number, start: number, now: number): { done: number; all: number } {
  const all = Math.round(Math.abs(target - start) * 10) / 10;
  const moved = target >= start ? now - start : start - now;
  return { done: Math.max(0, Math.min(all, Math.round(moved * 10) / 10)), all };
}
// DT335 AC2 to AC4: the reason a greyed goal shows, from her own numbers and never a BMI number; then, with a coach, to talk to
// the coach, who can set any goal; without one, where the numbers come from, to correct them in Profile and to ask a doctor
export function whyLines(u: NonNullable<Unfit>, b: FitBody, coach: string | null, now = new Date()): { why: string; next: string } {
  const why = u.why === "light" ? w("goal.whyLight", { weight: wWhole(b.weightKg ?? 0), height: hText(b.heightCm ?? 0) })
    : w(b.sex === "female" ? "goal.whyFatWoman" : "goal.whyFatMan", { pct: b.bodyFatPct ?? 0, age: ageAt(b, now) ?? 0 });
  return { why, next: coach ? w("goal.whyCoach", { coach }) : w(u.why === "light" ? "goal.whyNoCoachLight" : "goal.whyNoCoachFat") };
}
