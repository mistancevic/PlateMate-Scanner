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

// Same method as the goal bands (G0): Mifflin–St Jeor, times activity, then the goal; protein per kg of a reference weight.
const ADJ: Record<string, number> = { fatloss: -0.2, recomp: -0.1, longevity: 0, maintain: 0, gain: 0.1, energy: 0 };
const PROTEIN_PER_KG: Record<string, number> = { fatloss: 1.8, recomp: 2.0, longevity: 1.35, maintain: 1.4, gain: 1.8, energy: 1.6 };
export function suggestBand(p: Personal, current?: string): Band {
  if (current) { const b = BANDS.find((x) => x.id === current); if (b) return b; }
  const age = ageOf(p);
  if (age !== null && age >= 60) return BANDS.find((b) => b.id === "longevity")!;
  return BANDS.find((b) => b.id === "maintain")!;
}
// Mifflin–St Jeor by default; Katch–McArdle when a body fat figure exists, unless the coach pinned a formula.
export function formulaFor(p: Personal, pinned?: Formula | null): Formula { return pinned ?? (p.bodyFatPct ? "katch" : "mifflin"); }
export function calculate(p: Personal, bandId: string, pinned?: Formula | null): { kcal: number; protein: number; note: string; method: string } | null {
  if (!canCalculate(p)) return null;
  const age = ageOf(p)!;
  const w = p.weightKg!, h = p.heightCm!;
  const sexTerm = p.sex === "male" ? 5 : p.sex === "female" ? -161 : -78;
  const f = formulaFor(p, pinned) === "katch" && p.bodyFatPct ? "katch" : "mifflin";
  const bmr = f === "katch" ? 370 + 21.6 * w * (1 - p.bodyFatPct! / 100) : 10 * w + 6.25 * h - 5 * age + sexTerm;
  const act = ACTIVITIES.find((a) => a.id === p.activity)!;
  const factor = act.factor;
  let adj = ADJ[bandId] ?? 0;
  let note = "";
  if (age < 18 && adj < 0) { adj = 0; note = "Under 18: no deficit, energy stays at maintenance."; }
  const kcal = Math.round((bmr * factor * (1 + adj)) / 50) * 50;
  const hm = h / 100, bmi = w / (hm * hm);
  const refWeight = bmi > 25 ? 25 * hm * hm : w;
  const protein = Math.round(((PROTEIN_PER_KG[bandId] ?? 1.4) * refWeight) / 5) * 5;
  if (!note && bmi > 25) note = "Protein counted on a reference weight, not the current one.";
  const pct = Math.round(adj * 100);
  const method = `${f === "katch" ? "Katch–McArdle" : "Mifflin–St Jeor"}, ${act.name.toLowerCase()} ×${factor}${pct ? `, ${pct > 0 ? "+" : ""}${pct} %` : ""}`;
  return { kcal, protein, note, method };
}
