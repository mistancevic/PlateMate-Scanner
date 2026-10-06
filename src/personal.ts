// Who the person is, for calculating their numbers. Every field optional; stored on the phone and in their account only.
import { BANDS, type Band } from "./goal";
export type Sex = "female" | "male";
export type Activity = "sedentary" | "light" | "moderate" | "very" | "athlete"; // before 6 October 2026; read only to move old profiles over
export type Formula = "mifflin" | "katch";
export type DayMode = "same" | "each";
// Life is set once: how the day goes without planned training. Training is chosen per day.
export type Life = "desk" | "shift" | "feet" | "physical";
export type DayType = "passive" | "active" | "easy" | "hard";
export type Week = Record<DayType, number>;
export type OwnDay = { kcal?: number; protein?: number; fats?: number; carbs?: number };
export type Personal = {
  sex?: Sex; birthYear?: number; heightCm?: number; weightKg?: number; bodyFatPct?: number; pdUnit?: "pd" | "pct";
  life?: Life; week?: Week; easyMin?: number; hardMin?: number;
  dayMode?: DayMode | "follow"; ownDays?: Partial<Record<DayType, OwnDay>>;
  activity?: Activity; dayKcal?: unknown;
};
// Life without planned training, as a multiple of resting burn. Physical activity levels after FAO/WHO/UNU 2004,
// taken at the low end of each band because planned training is counted separately, per day.
export const LIFE: { id: Life; name: string; hint: string; factor: number }[] = [
  { id: "desk",     name: "9 to 5 at a desk", hint: "sitting most of the day",           factor: 1.3 },
  { id: "shift",    name: "Shift work",       hint: "some standing and walking",         factor: 1.4 },
  { id: "feet",     name: "On my feet",       hint: "shop, care, teaching, most of the day", factor: 1.55 },
  { id: "physical", name: "Physical work",    hint: "building, farming, carrying",       factor: 1.75 },
];
// The four days, all about training. METs from the Compendium of Physical Activities (2024): a walk or mobility about 3.5,
// a session you could talk through about 5, a hard or heavy session about 8. Only the part above rest is added.
export const DAY_TYPES: { id: DayType; name: string; hint: string; met: number; minutes: (p: Personal) => number }[] = [
  { id: "passive", name: "Rest, passive",  hint: "nothing planned",       met: 1,   minutes: () => 0 },
  { id: "active",  name: "Rest, active",   hint: "walk, mobility",        met: 3.5, minutes: () => 45 },
  { id: "easy",    name: "Training, easy", hint: "one session",           met: 5,   minutes: (p) => p.easyMin ?? 60 },
  { id: "hard",    name: "Training, hard", hint: "heavy, long or two",    met: 8,   minutes: (p) => p.hardMin ?? 75 },
];
export const dayModeOf = (p: Personal): DayMode => (p.dayMode === "each" || p.dayMode === "follow" ? "each" : "same");
// an old profile: its one activity is split into a life and a week the first time it is read
const OLD_WEEK: Record<Activity, Week> = {
  sedentary: { passive: 5, active: 2, easy: 0, hard: 0 }, light: { passive: 3, active: 2, easy: 2, hard: 0 },
  moderate: { passive: 2, active: 1, easy: 2, hard: 2 }, very: { passive: 1, active: 1, easy: 3, hard: 2 }, athlete: { passive: 0, active: 1, easy: 3, hard: 3 },
};
export const lifeOf = (p: Personal): Life => p.life ?? "desk";
export const weekOf = (p: Personal): Week => p.week ?? OLD_WEEK[p.activity ?? "moderate"] ?? OLD_WEEK.moderate;
export const trainsOf = (p: Personal): boolean => { const w = weekOf(p); return w.easy + w.hard >= 2; };
const dayKey = () => `chefmealan-day-${new Date().toISOString().slice(0, 10)}`;
// The day has one source, in this order: a plan says it, else the person tapped it, else nothing: the week's average counts.
// The key is dated, so every new day starts unset. Changing today never touches a plan.
export type DaySource = "plan" | "you" | "assumed";
export type Day = { type: DayType | null; source: DaySource };
// Plans are not built yet; when they are, this returns the planned day type for the date, or null.
export const plannedDayFor = (_date: Date): DayType | null => null;
const isDayType = (x: unknown): x is DayType => x === "passive" || x === "active" || x === "easy" || x === "hard";
export function getDay(): Day {
  const planned = plannedDayFor(new Date());
  if (planned) return { type: planned, source: "plan" };
  try { const tapped = localStorage.getItem(dayKey()); if (isDayType(tapped)) return { type: tapped, source: "you" }; } catch {}
  return { type: null, source: "assumed" };
}
export const getDayType = (): DayType | null => getDay().type;
export const setDayType = (d: DayType | null) => { try { if (d) localStorage.setItem(dayKey(), d); else localStorage.removeItem(dayKey()); } catch {} };
export const dayName = (t: DayType | null) => (t ? DAY_TYPES.find((x) => x.id === t)!.name : "Average day");
// a day stored before 6 October 2026 keeps a readable name in the last days
const OLD_DAY_NAME: Record<string, string> = { rest: "Rest, passive", normal: "Average day", training: "Training, easy", very: "Training, hard" };
export const dayNameAny = (x: string | null | undefined) => (!x ? "" : DAY_TYPES.find((d) => d.id === x)?.name ?? OLD_DAY_NAME[x] ?? x);
export const dayLine = (d: Day): string => d.source === "plan" ? `${dayName(d.type)}, as planned` : d.source === "you" ? `${dayName(d.type)}, set by you` : "Your week's average, until you pick the day";
const KEY = "chefmealan-personal";
export const getPersonal = (): Personal => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } };
export const setPersonal = (p: Personal) => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {} };
export const ageOf = (p: Personal) => (p.birthYear ? new Date().getFullYear() - p.birthYear : null);
export const canCalculate = (p: Personal) => Boolean(p.birthYear && p.heightCm && p.weightKg);

// Energy per day: resting burn (Mifflin–St Jeor, or Katch–McArdle with body fat) × life, plus that day's training, then the goal.
// Protein follows whether you train, not the goal: 1.6 to 2.2 g per kg with two or more sessions a week (ISSN 2017; Morton et al. 2018),
// else 1.2 to 1.6 (US Dietary Guidelines 2025–2030). Fat 30 % of the average day, 25 % for Performance (more carbs); carbs the rest.
const ADJ: Record<string, number> = { fatloss: -0.2, recomp: -0.1, maintain: 0, gain: 0.1, performance: 0.05 };
const FAT_OF: Record<string, number> = { performance: 0.25 };
export function suggestBand(p: Personal, current?: string): Band {
  if (current) { const b = BANDS.find((x) => x.id === current); if (b) return b; }
  const age = ageOf(p);
  return BANDS.find((b) => b.id === "maintain")!;
}
// Mifflin–St Jeor by default; Katch–McArdle when a body fat figure exists, unless the coach pinned a formula.
export function formulaFor(p: Personal, pinned?: Formula | null): Formula { return pinned ?? (p.bodyFatPct ? "katch" : "mifflin"); }
// Fat and carbs by rule: fat 30 percent of the day's energy (20 to 35 percent; Academy of Nutrition and Dietetics, Dietitians of
// Canada and ACSM joint position, 2016), carbs whatever is left after protein and fat. On a day with more or fewer calories,
// protein and fat stay and the carbs take the difference.
export const FAT_SHARE = 0.30;
export const MACRO_SOURCE = "Fat 20 to 35 percent of energy: AND, DC and ACSM joint position, 2016. Protein per kg: ISSN position stand, 2017.";
export function macroSplit(kcal: number, protein: number, fatsFixed?: number | null): { fats: number; carbs: number } {
  const fats = fatsFixed ?? Math.round((kcal * FAT_SHARE) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fats * 9) / 4));
  return { fats, carbs };
}
export type DayNumbers = { kcal: number; protein: number; fats: number; carbs: number; how: string[] };
export type Calc = { kcal: number; protein: number; fats: number; carbs: number; proteinMin: number; proteinMax: number; note: string; method: string; math: string; bmr: number; tdee: number; days: Record<DayType, DayNumbers>; week: Week };
const r50 = (x: number) => Math.round(x / 50) * 50;
export function calculate(p: Personal, bandId: string, pinned?: Formula | null): Calc | null {
  if (!canCalculate(p)) return null;
  const age = ageOf(p)!;
  const w = p.weightKg!, h = p.heightCm!;
  const sexTerm = p.sex === "male" ? 5 : p.sex === "female" ? -161 : -78;
  const f = formulaFor(p, pinned) === "katch" && p.bodyFatPct ? "katch" : "mifflin";
  const lean = p.bodyFatPct ? w * (1 - p.bodyFatPct / 100) : null;
  const bmr = f === "katch" && lean ? 370 + 21.6 * lean : 10 * w + 6.25 * h - 5 * age + sexTerm;
  const life = LIFE.find((l) => l.id === lifeOf(p))!;
  let adj = ADJ[bandId] ?? 0;
  const notes: string[] = [];
  if (age < 18 && adj < 0) { adj = 0; notes.push("Under 18: no deficit, energy stays at maintenance."); }
  const base = bmr * life.factor;
  const pct = Math.round(adj * 100);
  const goalName = BANDS.find((b) => b.id === bandId)?.name ?? "your goal";
  // protein reference: real weight, or lean-based when body fat is known and high
  let ref = w;
  if (lean && p.bodyFatPct) {
    const healthy = p.sex === "female" ? 0.25 : 0.15;
    const target = lean / (1 - healthy);
    if (target < w) { ref = target; notes.push("Protein counted on your lean mass, from your body fat."); }
  }
  const trains = trainsOf(p);
  const [lo, hi] = trains ? [1.6, 2.2] : [1.2, 1.6];
  const proteinMin = Math.round((lo * ref) / 5) * 5, proteinMax = Math.round((hi * ref) / 5) * 5;
  const protein = Math.round(((lo + hi) / 2 * ref) / 5) * 5;
  const week = weekOf(p);
  const kcalOf = {} as Record<DayType, number>;
  const how = {} as Record<DayType, string[]>;
  for (const d of DAY_TYPES) {
    const min = d.minutes(p);
    const extra = d.met > 1 ? (d.met - 1) * w * (min / 60) : 0;
    kcalOf[d.id] = r50((base + extra) * (1 + adj));
    how[d.id] = [
      `${Math.round(bmr).toLocaleString("en")} at rest (${f === "katch" ? "Katch–McArdle, from lean mass" : "Mifflin–St Jeor: sex, age, height, weight"})`,
      `× ${life.factor} for ${life.name.toLowerCase()} = ${Math.round(base).toLocaleString("en")}`,
      extra ? `+ ${Math.round(extra)} for ${min} min ${d.id === "active" ? "walking or mobility" : d.id === "easy" ? "easy training" : "hard training"} (${d.met} METs × ${w} kg × ${Math.round((min / 60) * 100) / 100} h, less what you burn at rest)` : "+ 0, no training",
      `${pct === 0 ? "± 0" : pct > 0 ? `+ ${pct}` : `− ${Math.abs(pct)}`} % for ${goalName}`,
      `= ${kcalOf[d.id].toLocaleString("en")} kcal`,
    ];
  }
  const nDays = DAY_TYPES.reduce((a, d) => a + (week[d.id] || 0), 0) || 1;
  const avg = r50(DAY_TYPES.reduce((a, d) => a + kcalOf[d.id] * (week[d.id] || 0), 0) / nDays);
  const fats = Math.round((avg * (FAT_OF[bandId] ?? FAT_SHARE)) / 9);
  const carbsOf = (k: number) => Math.max(0, Math.round((k - protein * 4 - fats * 9) / 4));
  const days = {} as Record<DayType, DayNumbers>;
  for (const d of DAY_TYPES) days[d.id] = { kcal: kcalOf[d.id], protein, fats, carbs: carbsOf(kcalOf[d.id]), how: how[d.id] };
  const method = `${f === "katch" ? "Katch–McArdle" : "Mifflin–St Jeor"}, ${life.name.toLowerCase()} ×${life.factor}, training per day from the Compendium of Physical Activities${pct ? `, ${pct > 0 ? "+" : ""}${pct} %` : ""}`;
  const math = `Average over your week: ${avg.toLocaleString("en")} kcal. Protein ${lo}–${hi} g per kg${trains ? ", because you train" : ""} × ${Math.round(ref)} kg = ${proteinMin}–${proteinMax} g, target ${protein} g.`;
  return { kcal: avg, protein, fats, carbs: carbsOf(avg), proteinMin, proteinMax, note: notes.join(" "), method, math, bmr: Math.round(bmr), tdee: Math.round(base), days, week };
}
// Own numbers, day by day: a typed row wins; an empty row is calculated when the profile allows, else it takes the average
// of the typed ones. Fat stays one number for every day unless typed; carbs carry the difference.
export function ownDayNumbers(p: Personal, bandId: string, pinned?: Formula | null): { days: Record<DayType, DayNumbers & { source: "you" | "calculated" | "average" }>; avg: { kcal: number; protein: number; fats: number; carbs: number } } | null {
  const own = p.ownDays ?? {};
  const typed = DAY_TYPES.filter((d) => (own[d.id]?.kcal ?? 0) > 0);
  if (!typed.length) return null;
  const c = calculate(p, bandId, pinned);
  const meanK = typed.reduce((a, d) => a + own[d.id]!.kcal!, 0) / typed.length;
  const meanP = typed.filter((d) => own[d.id]?.protein).reduce((a, d, _, arr) => a + own[d.id]!.protein! / arr.length, 0) || (c?.protein ?? Math.round(meanK * 0.055 / 4 * 4));
  const week = weekOf(p);
  const kcalOf = (d: DayType) => own[d]?.kcal && own[d]!.kcal! > 0 ? own[d]!.kcal! : c ? c.days[d].kcal : Math.round(meanK);
  const nDays = DAY_TYPES.reduce((a, d) => a + (week[d.id] || 0), 0) || 1;
  const avgK = r50(DAY_TYPES.reduce((a, d) => a + kcalOf(d.id) * (week[d.id] || 0), 0) / nDays);
  const fatsAll = Math.round((avgK * (FAT_OF[bandId] ?? FAT_SHARE)) / 9);
  const days = {} as Record<DayType, DayNumbers & { source: "you" | "calculated" | "average" }>;
  for (const d of DAY_TYPES) {
    const o = own[d.id] ?? {};
    const kcal = kcalOf(d.id), protein = o.protein && o.protein > 0 ? o.protein : Math.round(meanP), fats = o.fats && o.fats > 0 ? o.fats : fatsAll;
    const carbs = o.carbs && o.carbs > 0 ? o.carbs : Math.max(0, Math.round((kcal - protein * 4 - fats * 9) / 4));
    const source = o.kcal && o.kcal > 0 ? "you" : c ? "calculated" : "average";
    days[d.id] = { kcal, protein, fats, carbs, source, how: source === "you" ? ["Set by you."] : source === "calculated" ? c!.days[d.id].how : ["Nothing typed and no profile to calculate from: the average of the days you typed."] };
  }
  const avgP = Math.round(DAY_TYPES.reduce((a, d) => a + days[d.id].protein * (week[d.id] || 0), 0) / nDays);
  return { days, avg: { kcal: avgK, protein: avgP, fats: fatsAll, carbs: Math.max(0, Math.round((avgK - avgP * 4 - fatsAll * 9) / 4)) } };
}
