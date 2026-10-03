// Who the person is, for calculating their numbers. Every field optional; stored on the phone and in their account only.
import { BANDS, type Band } from "./goal";
export type Sex = "female" | "male";
export type Activity = "sedentary" | "light" | "moderate" | "very" | "athlete";
export type Formula = "mifflin" | "katch";
export type DayMode = "same" | "follow";
export type DayType = "rest" | "normal" | "training" | "very";
export type Personal = { sex?: Sex; birthYear?: number; heightCm?: number; weightKg?: number; activity?: Activity; bodyFatPct?: number; dayMode?: DayMode; pdUnit?: "pd" | "pct" };
export const DAY_TYPES: { id: DayType; name: string }[] = [
  { id: "rest", name: "Rest day" }, { id: "normal", name: "Usual day" }, { id: "training", name: "Training day" }, { id: "very", name: "Very active day" },
];
// The goal's calories are the average day. A given day moves them by its multiplier against the usual one; protein stays.
export function dayFactor(day: DayType, p: Personal): { base: number; today: number } {
  const base = ACTIVITIES.find((a) => a.id === p.activity)?.factor ?? 1.55;
  const today = day === "rest" ? 1.2 : day === "training" ? Math.min(1.9, base + 0.175) : day === "very" ? Math.min(1.9, base + 0.35) : base;
  return { base, today };
}
const dayKey = () => `chefmealan-day-${new Date().toISOString().slice(0, 10)}`;
// The day has one source, in this order: a plan says it, else the person tapped it, else the usual day is assumed.
// The key is dated, so every new day starts unset. Changing today never touches a plan.
export type DaySource = "plan" | "you" | "assumed";
export type Day = { type: DayType; source: DaySource };
// Plans are not built yet; when they are, this returns the planned day type for the date, or null.
export const plannedDayFor = (_date: Date): DayType | null => null;
export function getDay(): Day {
  const planned = plannedDayFor(new Date());
  if (planned) return { type: planned, source: "plan" };
  try { const tapped = localStorage.getItem(dayKey()) as DayType | null; if (tapped) return { type: tapped, source: "you" }; } catch {}
  return { type: "normal", source: "assumed" };
}
export const getDayType = (): DayType => getDay().type;
export const setDayType = (d: DayType) => { try { localStorage.setItem(dayKey(), d); } catch {} };
export const dayLine = (d: Day): string => {
  const name = DAY_TYPES.find((x) => x.id === d.type)?.name ?? d.type;
  return d.source === "plan" ? `${name}, as planned` : d.source === "you" ? `${name}, set by you` : name;
};
export const ACTIVITIES: { id: Activity; name: string; hint: string; factor: number }[] = [
  { id: "sedentary", name: "Mostly sitting",   hint: "desk job, little movement",             factor: 1.2 },
  { id: "light",     name: "Lightly active",   hint: "walking, 1 to 3 sessions a week",       factor: 1.375 },
  { id: "moderate",  name: "Active",           hint: "3 to 5 sessions a week",                factor: 1.55 },
  { id: "very",      name: "Very active",      hint: "6 to 7 sessions, or a physical job",    factor: 1.725 },
  { id: "athlete",   name: "Training hard",    hint: "twice a day, or endurance volume",      factor: 1.9 },
];
const KEY = "chefmealan-personal";
export const getPersonal = (): Personal => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } };
export const setPersonal = (p: Personal) => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {} };
export const ageOf = (p: Personal) => (p.birthYear ? new Date().getFullYear() - p.birthYear : null);
export const canCalculate = (p: Personal) => Boolean(p.birthYear && p.heightCm && p.weightKg && p.activity);

// Energy: Mifflin–St Jeor (or Katch–McArdle with body fat) × activity, then the goal.
// Protein: grams per kg of real body weight, as a range; lean-mass based when body fat is known.
const ADJ: Record<string, number> = { fatloss: -0.2, recomp: -0.1, longevity: 0, maintain: 0, gain: 0.1, energy: 0 };
// Protein ranges as published: 1.2–1.6 g/kg for adults (US Dietary Guidelines 2025–2030); 1.6–2.2 g/kg when building, cutting or training (ISSN 2017; Morton et al. 2018).
const PROTEIN_RANGE: Record<string, [number, number]> = { fatloss: [1.6, 2.2], recomp: [1.6, 2.2], longevity: [1.2, 1.6], maintain: [1.2, 1.6], gain: [1.6, 2.2], energy: [1.6, 2.2] };
export function suggestBand(p: Personal, current?: string): Band {
  if (current) { const b = BANDS.find((x) => x.id === current); if (b) return b; }
  const age = ageOf(p);
  if (age !== null && age >= 60) return BANDS.find((b) => b.id === "longevity")!;
  return BANDS.find((b) => b.id === "maintain")!;
}
// Mifflin–St Jeor by default; Katch–McArdle when a body fat figure exists, unless the coach pinned a formula.
export function formulaFor(p: Personal, pinned?: Formula | null): Formula { return pinned ?? (p.bodyFatPct ? "katch" : "mifflin"); }
export type Calc = { kcal: number; protein: number; proteinMin: number; proteinMax: number; note: string; method: string; math: string; bmr: number; tdee: number };
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
  }
  void bmi;
  // people who train get at least the training range, whatever the goal
  const trains = p.activity === "moderate" || p.activity === "very" || p.activity === "athlete";
  let [lo, hi] = PROTEIN_RANGE[bandId] ?? [1.2, 1.6];
  if (trains) { lo = Math.max(lo, 1.6); hi = Math.max(hi, 2.2); }
  const proteinMin = Math.round((lo * ref) / 5) * 5, proteinMax = Math.round((hi * ref) / 5) * 5;
  const protein = Math.round(((lo + hi) / 2 * ref) / 5) * 5;
  const pct = Math.round(adj * 100);
  const method = `${f === "katch" ? "Katch–McArdle" : "Mifflin–St Jeor"}, ${act.name.toLowerCase()} ×${act.factor}${pct ? `, ${pct > 0 ? "+" : ""}${pct} %` : ""}`;
  const fmtK = (x: number) => (Number.isInteger(x) ? `${x}.0` : `${x}`);
  const math = `Energy: ${Math.round(bmr).toLocaleString()} at rest × ${act.factor} = ${Math.round(tdee).toLocaleString()}${pct ? `, ${pct > 0 ? "+" : "−"}${Math.abs(pct)} % = ${kcal.toLocaleString()}` : ` ≈ ${kcal.toLocaleString()}`} kcal. Protein: ${fmtK(lo)}–${fmtK(hi)} g per kg × ${refWhy} = ${proteinMin}–${proteinMax} g, target ${protein} g.`;
  return { kcal, protein, proteinMin, proteinMax, note: notes.join(" "), method, math, bmr: Math.round(bmr), tdee: Math.round(tdee) };
}
