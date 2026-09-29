// Who the person is, for calculating their numbers. Every field optional; stored on the phone and in their account only.
import { BANDS, type Band } from "./goal";
export type Sex = "female" | "male";
export type Activity = "sedentary" | "light" | "moderate" | "very" | "athlete";
export type Formula = "mifflin" | "katch";
export type Personal = { sex?: Sex; birthYear?: number; heightCm?: number; weightKg?: number; activity?: Activity; bodyFatPct?: number };
export const ACTIVITIES: { id: Activity; name: string; hint: string; factor: number }[] = [
  { id: "sedentary", name: "Mostly sitting",   hint: "desk job, little movement",          factor: 1.3 },
  { id: "light",     name: "Lightly active",   hint: "walking, 1 to 2 sessions a week",    factor: 1.45 },
  { id: "moderate",  name: "Active",           hint: "3 to 4 sessions a week",             factor: 1.6 },
  { id: "very",      name: "Very active",      hint: "5 or more sessions, or a physical job", factor: 1.75 },
  { id: "athlete",   name: "Training hard",    hint: "twice a day, or endurance volume",   factor: 1.9 },
];
const KEY = "chefmealan-personal";
export const getPersonal = (): Personal => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } };
export const setPersonal = (p: Personal) => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {} };
export const ageOf = (p: Personal) => (p.birthYear ? new Date().getFullYear() - p.birthYear : null);
export const canCalculate = (p: Personal) => Boolean(p.birthYear && p.heightCm && p.weightKg && p.activity);

// Energy: Mifflin–St Jeor (or Katch–McArdle with body fat) × activity, then the goal.
// Protein: grams per kg of real body weight, as a range; lean-mass based when body fat is known.
const ADJ: Record<string, number> = { fatloss: -0.2, recomp: -0.1, longevity: 0, maintain: 0, gain: 0.1, energy: 0 };
const PROTEIN_RANGE: Record<string, [number, number]> = { fatloss: [1.8, 2.4], recomp: [1.6, 2.2], longevity: [1.2, 1.6], maintain: [1.2, 1.6], gain: [1.6, 2.2], energy: [1.4, 1.8] };
export function suggestBand(p: Personal, current?: string): Band {
  if (current) { const b = BANDS.find((x) => x.id === current); if (b) return b; }
  const age = ageOf(p);
  if (age !== null && age >= 60) return BANDS.find((b) => b.id === "longevity")!;
  return BANDS.find((b) => b.id === "maintain")!;
}
// Mifflin–St Jeor by default; Katch–McArdle when a body fat figure exists, unless the coach pinned a formula.
export function formulaFor(p: Personal, pinned?: Formula | null): Formula { return pinned ?? (p.bodyFatPct ? "katch" : "mifflin"); }
export type Calc = { kcal: number; protein: number; proteinMin: number; proteinMax: number; note: string; method: string; math: string };
export function calculate(p: Personal, bandId: string, pinned?: Formula | null): Calc | null {
  if (!canCalculate(p)) return null;
  const age = ageOf(p)!;
  const w = p.weightKg!, h = p.heightCm!;
  const sexTerm = p.sex === "male" ? 5 : p.sex === "female" ? -161 : -78;
  const f = formulaFor(p, pinned) === "katch" && p.bodyFatPct ? "katch" : "mifflin";
  const lean = p.bodyFatPct ? w * (1 - p.bodyFatPct / 100) : null;
  const bmr = f === "katch" && lean ? 370 + 21.6 * lean : 10 * w + 6.25 * h - 5 * age + sexTerm;
  const act = ACTIVITIES.find((a) => a.id === p.activity)!;
  let adj = ADJ[bandId] ?? 0;
  const notes: string[] = [];
  if (age < 18 && adj < 0) { adj = 0; notes.push("Under 18: no deficit, energy stays at maintenance."); }
  const tdee = bmr * act.factor;
  const kcal = Math.round((tdee * (1 + adj)) / 50) * 50;
  // protein reference: real weight; lean-based when body fat is known and high; a gentle cap only for BMI over 30 without body fat
  const hm = h / 100, bmi = w / (hm * hm);
  let ref = w, refWhy = `${w} kg`;
  if (lean && p.bodyFatPct) {
    const healthy = p.sex === "female" ? 0.25 : 0.15;
    const target = lean / (1 - healthy);
    if (target < w) { ref = target; refWhy = `${Math.round(target)} kg (lean mass at a healthy body fat)`; notes.push("Protein counted on your lean mass, from your body fat."); }
  } else if (bmi > 30) {
    ref = 27 * hm * hm; refWhy = `${Math.round(ref)} kg (adjusted, BMI over 30)`; notes.push("BMI over 30 without a body fat figure: protein on an adjusted weight. Add body fat for a sharper number.");
  }
  // people who train get at least the training range, whatever the goal
  const trains = p.activity === "moderate" || p.activity === "very" || p.activity === "athlete";
  let [lo, hi] = PROTEIN_RANGE[bandId] ?? [1.2, 1.6];
  if (trains) { lo = Math.max(lo, 1.6); hi = Math.max(hi, 2.0); }
  const proteinMin = Math.round((lo * ref) / 5) * 5, proteinMax = Math.round((hi * ref) / 5) * 5;
  const protein = Math.round(((lo + hi) / 2 * ref) / 5) * 5;
  const pct = Math.round(adj * 100);
  const method = `${f === "katch" ? "Katch–McArdle" : "Mifflin–St Jeor"}, ${act.name.toLowerCase()} ×${act.factor}${pct ? `, ${pct > 0 ? "+" : ""}${pct} %` : ""}`;
  const fmtK = (x: number) => (Number.isInteger(x) ? `${x}.0` : `${x}`);
  const math = `Energy: ${Math.round(bmr).toLocaleString()} at rest × ${act.factor} = ${Math.round(tdee).toLocaleString()}${pct ? `, ${pct > 0 ? "+" : "−"}${Math.abs(pct)} % = ${kcal.toLocaleString()}` : ` ≈ ${kcal.toLocaleString()}`} kcal. Protein: ${fmtK(lo)}–${fmtK(hi)} g per kg × ${refWhy} = ${proteinMin}–${proteinMax} g, target ${protein} g.`;
  return { kcal, protein, proteinMin, proteinMax, note: notes.join(" "), method, math };
}
