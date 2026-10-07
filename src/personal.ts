// Who the person is, for calculating their numbers. Every field optional; stored on the phone and in their account only.
import { BANDS, type Band } from "./goal";
import { ymd, isPlanDay, PE, COMMUTE, isPlan, planFromCounts, countsOf, metOf, minutesOf, lifestyleFromOld, baseFactor, moveOf, MOVES, weekdaysOf, dayKindOf, WEEKDAY_NAMES, planLine, planShort, loadOf, weekdayIndex, getTodayChange, setTodayChange, dayOfLoad, type Plan, type PlanDay, type Lifestyle } from "./plan";
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
  // Target analysis answers: a finding kept on purpose, with the value it was kept at, so a changed number asks again
  kept?: Record<string, { at: string; sig: string }>;
  dayMode?: DayMode | "follow"; ownDays?: Partial<Record<DayType, OwnDay>>;
  activity?: Activity; dayKcal?: unknown;
  // from 6 October 2026: the usual week, Monday first, and the lifestyle set once
  plan?: Plan; lifestyle?: Lifestyle;
  // from 7 October 2026: a change for one date, by local date (YYYY-MM-DD); it never touches the usual week
  dated?: Record<string, PlanDay>;
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
// The four loads a day can have. The Weekly plan says what each day holds; its load decides which row of own numbers applies.
// The METs and minutes here are only for someone with no Weekly plan yet: a walk about 3.5, most training about 5, hard about 8.
export const DAY_TYPES: { id: DayType; name: string; hint: string; met: number; minutes: (p: Personal) => number }[] = [
  { id: "passive", name: "Rest",     hint: "no activity",                 met: 1,   minutes: () => 0 },
  { id: "active",  name: "Light",    hint: "walk, yoga, mobility",        met: 3.5, minutes: () => 45 },
  { id: "easy",    name: "Moderate", hint: "most training",               met: 5,   minutes: (p) => p.easyMin ?? 60 },
  { id: "hard",    name: "Hard",     hint: "you couldn't talk through it", met: 8,   minutes: (p) => p.hardMin ?? 75 },
];
export const dayModeOf = (p: Personal): DayMode => (p.dayMode === "each" || p.dayMode === "follow" ? "each" : "same");
// an old profile: its one activity is split into a life and a week the first time it is read
const OLD_WEEK: Record<Activity, Week> = {
  sedentary: { passive: 5, active: 2, easy: 0, hard: 0 }, light: { passive: 3, active: 2, easy: 2, hard: 0 },
  moderate: { passive: 2, active: 1, easy: 2, hard: 2 }, very: { passive: 1, active: 1, easy: 3, hard: 2 }, athlete: { passive: 0, active: 1, easy: 3, hard: 3 },
};
export const lifeOf = (p: Personal): Life => p.life ?? "desk";
const oldWeekOf = (p: Personal): Week => p.week ?? OLD_WEEK[p.activity ?? "moderate"] ?? OLD_WEEK.moderate;
// The Weekly plan: the one set on the Weekly plan page; else, for someone who had the old My week, a starting plan from it;
// else none yet, and Today asks what kind of day it is.
export const hasPlan = (p: Personal) => isPlan(p.plan) || !!p.week || !!p.activity;
export const planOf = (p: Personal): Plan | null => (isPlan(p.plan) ? p.plan : (p.week || p.activity) ? planFromCounts(oldWeekOf(p), p.easyMin, p.hardMin) : null);
export const lifestyleOf = (p: Personal): Lifestyle => p.lifestyle ?? lifestyleFromOld(p.life);
// how many days of each load the week holds: from the plan, else the old counts
export const weekOf = (p: Personal): Week => { const pl = planOf(p); return pl ? countsOf(pl) : oldWeekOf(p); };
// someone trains when two or more days a week are moderate or hard
export const trainsOf = (p: Personal): boolean => { const w = weekOf(p); return w.easy + w.hard >= 2; };
const dayKey = () => `chefmealan-day-${new Date().toISOString().slice(0, 10)}`;
// The day has one source, in this order: a plan says it, else the person tapped it, else nothing: the week's average counts.
// The key is dated, so every new day starts unset. Changing today never touches a plan.
const isDayType = (x: unknown): x is DayType => x === "passive" || x === "active" || x === "easy" || x === "hard";
export type DaySource = "today" | "plan" | "you" | "assumed";
export type Day = { type: DayType | null; source: DaySource; plan?: PlanDay | null };
// Today's day, in this order: a change for this date only; else the Weekly plan for this weekday; else an old tapped day;
// else nothing, and the week's average counts until the person says.
// The day for any date: its own change if it has one, else the usual week's weekday. Null when there is no plan yet.
export function dayFor(p: Personal, date: Date): { day: PlanDay; changed: boolean } | null {
  const own = p.dated?.[ymd(date)];
  if (own && isPlanDay(own)) return { day: own, changed: true };
  const pl = planOf(p);
  return pl ? { day: pl[weekdayIndex(date)], changed: false } : null;
}
// a change for one date, kept in the settings; null removes it, so the date follows the usual week again
export function withDated(p: Personal, date: Date, day: PlanDay | null): Personal {
  const dated = { ...(p.dated ?? {}) };
  if (day) dated[ymd(date)] = day; else delete dated[ymd(date)];
  // keep a year and a half of changes at most
  const keys = Object.keys(dated).sort(); while (keys.length > 550) delete dated[keys.shift()!];
  return { ...p, dated };
}
// Since Release A (7 October 2026) accounts are 18 and over; the under-18 paths stay, switched off, for family profiles later.
export const isMinor = (p: Personal) => { const a = ageOf(p); return a !== null && a < 18; };
export function getDay(p: Personal = getPersonal(), date = new Date()): Day {
  const own = p.dated?.[ymd(date)];
  const change = own && isPlanDay(own) ? own : getTodayChange(date);
  if (change) return { type: loadOf(change), source: "today", plan: change };
  const pl = planOf(p);
  if (pl) { const d = pl[weekdayIndex(date)]; return { type: loadOf(d), source: "plan", plan: d }; }
  try { const tapped = localStorage.getItem(dayKey()); if (isDayType(tapped)) return { type: tapped, source: "you", plan: dayOfLoad(tapped) }; } catch {}
  return { type: null, source: "assumed", plan: null };
}
export const getDayType = (): DayType | null => getDay().type;
// a load picked on Today by someone with no Weekly plan: kept for this date only
export const setDayType = (d: DayType | null) => setTodayChange(d ? dayOfLoad(d) : null);
export const dayName = (t: DayType | null) => (t ? DAY_TYPES.find((x) => x.id === t)!.name : "Average day");
// a day stored before 6 October 2026 keeps a readable name in the last days
const OLD_DAY_NAME: Record<string, string> = { rest: "Rest", normal: "Average day", training: "Moderate", very: "Hard" };
export const dayNameAny = (x: string | null | undefined) => (!x ? "" : DAY_TYPES.find((d) => d.id === x)?.name ?? OLD_DAY_NAME[x] ?? x);
export const dayLine = (d: Day): string => d.source === "plan" ? `${dayName(d.type)}, as planned` : d.source === "today" || d.source === "you" ? `${dayName(d.type)}, changed for today` : "Your week's average, until you pick the day";
const KEY = "chefmealan-personal";
export const getPersonal = (): Personal => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } };
export const setPersonal = (p: Personal) => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {} };
export const ageOf = (p: Personal) => (p.birthYear ? new Date().getFullYear() - p.birthYear : null);
export const canCalculate = (p: Personal) => Boolean(p.birthYear && p.heightCm && p.weightKg);

// Energy per day: resting burn (Mifflin–St Jeor, or Katch–McArdle with body fat) × life, plus that day's training, then the goal.
// Protein follows whether you train, not the goal: 1.6 to 2.2 g per kg with two or more sessions a week (ISSN 2017; Morton et al. 2018),
// else 1.2 to 1.6 (US Dietary Guidelines 2025–2030). Fat 30 % of the average day, 25 % for Performance (more carbs); carbs the rest.
export const ADJ: Record<string, number> = { fatloss: -0.2, recomp: -0.1, maintain: 0, gain: 0.1, performance: 0.05 };
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
export type Calc = { kcal: number; protein: number; fats: number; carbs: number; proteinMin: number; proteinMax: number; proteinLo: number; proteinHi: number; proteinPerKg: number; proteinWhy: string[]; perMeal: number; trains: boolean; note: string; method: string; math: string; bmr: number; tdee: number; days: Record<DayType, DayNumbers>; week: Week; weekdays: ({ name: string; day: PlanDay } & DayNumbers)[] | null; numbersOf: (d: PlanDay) => DayNumbers };
const r50 = (x: number) => Math.round(x / 50) * 50;
export function calculate(p: Personal, bandId: string, pinned?: Formula | null): Calc | null {
  if (!canCalculate(p)) return null;
  const age = ageOf(p)!;
  const w = p.weightKg!, h = p.heightCm!;
  const sexTerm = p.sex === "male" ? 5 : p.sex === "female" ? -161 : -78;
  const f = formulaFor(p, pinned) === "katch" && p.bodyFatPct ? "katch" : "mifflin";
  const lean = p.bodyFatPct ? w * (1 - p.bodyFatPct / 100) : null;
  // Under 18: the Schofield equations for 10 to 18 years (FAO/WHO/UNU), made for children and teenagers; the adult formulas are not.
  const minor = age < 18;
  const schofield = p.sex === "male" ? 17.686 * w + 658.2 : p.sex === "female" ? 13.384 * w + 692.6 : (17.686 * w + 658.2 + 13.384 * w + 692.6) / 2;
  const bmr = minor ? schofield : f === "katch" && lean ? 370 + 21.6 * lean : 10 * w + 6.25 * h - 5 * age + sexTerm;
  const ls = lifestyleOf(p), move = moveOf(ls);
  // what fills the weekdays (Release B): work counts how you move at work; study and at home count as mostly sitting
  const wk = weekdaysOf(ls);
  const life = minor ? { factor: 1.3, name: "a school day, mostly sitting" } : wk === "study" ? { factor: 1.3, name: "a study day, mostly sitting" } : wk === "home" ? { factor: 1.3, name: "a day at home" } : { factor: move.factor, name: `${move.name.toLowerCase()} at work` };
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
  // Where in the range (approved 6 October 2026, canvas board G2): the middle, unless losing fat (Helms et al. 2014),
  // eating mostly plant protein (used a little less well), or being over 60 (PROT-AGE 2013) moves it to the top.
  const diet = (lifestyleOf(p).diet ?? "").toLowerCase();
  const proteinWhy: string[] = [];
  if (bandId === "fatloss" && !minor) proteinWhy.push("You're losing fat: eating less than you burn, more protein helps you keep your muscle.");
  if (diet === "vegan" || diet === "vegetarian") proteinWhy.push("You eat mostly plant protein, which the body uses a little less well.");
  if (age >= 60) proteinWhy.push("You're over 60: muscles respond less to protein with age.");
  const perKg = proteinWhy.length ? hi : (lo + hi) / 2;
  const protein = Math.round((perKg * ref) / 5) * 5;
  const perMeal = Math.round((0.4 * ref) / 5) * 5;
  const week = weekOf(p);
  const kcalOf = {} as Record<DayType, number>;
  const how = {} as Record<DayType, string[]>;
  for (const d of DAY_TYPES) {
    const min = d.minutes(p);
    const extra = d.met > 1 ? (d.met - 1) * w * (min / 60) : 0;
    kcalOf[d.id] = r50((base + extra) * (1 + adj));
    how[d.id] = [
      `${Math.round(bmr).toLocaleString("en")} at rest (${f === "katch" ? "Katch–McArdle, from lean mass" : "Mifflin–St Jeor: sex, age, height, weight"})`,
      `× ${life.factor} for ${life.name} = ${Math.round(base).toLocaleString("en")}`,
      extra ? `+ ${Math.round(extra)} for ${min} min ${d.id === "active" ? "walking or mobility" : d.id === "easy" ? "easy training" : "hard training"} (${d.met} METs × ${w} kg × ${Math.round((min / 60) * 100) / 100} h, less what you burn at rest)` : "+ 0, no training",
      `${pct === 0 ? "± 0" : pct > 0 ? `+ ${pct}` : `− ${Math.abs(pct)}`} % for ${goalName}`,
      `= ${kcalOf[d.id].toLocaleString("en")} kcal`,
    ];
  }
  // a planned day: resting burn × the day's baseline (work day or off), plus its activity, then the goal
  const plan = planOf(p);
  const pctLine = `${pct === 0 ? "± 0" : pct > 0 ? `+ ${pct}` : `− ${Math.abs(pct)}`} % for ${goalName}`;
  const restLine = `${Math.round(bmr).toLocaleString("en")} at rest (${minor ? "Schofield, for 10 to 18 years: sex and weight" : f === "katch" ? "Katch–McArdle, from lean mass" : "Mifflin–St Jeor: sex, age, height, weight"})`;
  const part = (met: number, min: number) => (met - 1) * w * (min / 60);
  const dayKcalHow = (d: PlanDay): { kcal: number; how: string[] } => {
    const kind = dayKindOf(d, ls, minor);
    const fac = kind === "work" ? baseFactor(ls, true) : MOVES[0].factor, b = bmr * fac;
    const min = minutesOf(d), met = metOf(d);
    const extra = met > 1 ? part(met, min) : 0;
    // a study day (a school day under 18) can also hold sport in class and the way there and back
    const pe = kind === "study" && d.pe ? part(PE.met, PE.minutes) : 0;
    const way = kind === "study" ? COMMUTE[ls.commute ?? ""] : undefined;
    const commute = way ? part(way.met, way.minutes) : 0;
    const kcal = r50((b + extra + pe + commute) * (1 + adj));
    const what = d.kind === "club" || d.kind === "match" ? planShort({ ...d, pe: false, when: undefined }).toLowerCase() : planLine({ ...d, pe: false }).toLowerCase().replace(/, (in|during|late|right).*$/, "");
    return { kcal, how: [
      restLine,
      `× ${fac} for ${minor ? (d.work ? "a school day, mostly sitting" : "a day without school") : kind === "work" ? `${move.name.toLowerCase()} at work` : kind === "study" ? "a study day, mostly sitting" : wk === "home" ? "a day at home" : "a day off"} = ${Math.round(b).toLocaleString("en")}`,
      ...(commute ? [`+ ${Math.round(commute)} for ${way!.name} (${way!.met} METs, ${way!.minutes} min)`] : []),
      ...(pe ? [`+ ${Math.round(pe)} for ${minor ? "sport at school" : "sport in class"} (${PE.met} METs, ${PE.minutes} min)`] : []),
      extra ? `+ ${Math.round(extra)} for ${min} min ${what} (${met} METs × ${w} kg × ${Math.round((min / 60) * 100) / 100} h, less what you burn at rest; Compendium 2024)` : pe || commute ? (minor ? "+ 0 after school" : "+ 0 after classes") : "+ 0, no activity",
      pctLine,
      `= ${kcal.toLocaleString("en")} kcal`,
    ] };
  };
  const weekdayKcal = plan ? plan.map(dayKcalHow) : null;
  const nDays = DAY_TYPES.reduce((a, d) => a + (week[d.id] || 0), 0) || 1;
  const avg = weekdayKcal ? r50(weekdayKcal.reduce((a, x) => a + x.kcal, 0) / 7) : r50(DAY_TYPES.reduce((a, d) => a + kcalOf[d.id] * (week[d.id] || 0), 0) / nDays);
  const fats = Math.round((avg * (FAT_OF[bandId] ?? FAT_SHARE)) / 9);
  const carbsOf = (k: number) => Math.max(0, Math.round((k - protein * 4 - fats * 9) / 4));
  const days = {} as Record<DayType, DayNumbers>;
  for (const d of DAY_TYPES) days[d.id] = { kcal: kcalOf[d.id], protein, fats, carbs: carbsOf(kcalOf[d.id]), how: how[d.id] };
  const numbersOf = (d: PlanDay): DayNumbers => { const x = dayKcalHow(d); return { kcal: x.kcal, protein, fats, carbs: carbsOf(x.kcal), how: x.how }; };
  const weekdays = plan ? plan.map((d, i) => ({ name: WEEKDAY_NAMES[i], day: d, ...numbersOf(d) })) : null;
  const method = `${minor ? "Schofield (10 to 18 years)" : f === "katch" ? "Katch–McArdle" : "Mifflin–St Jeor"}, ${life.name} ×${life.factor}, activity per day from the Compendium of Physical Activities${pct ? `, ${pct > 0 ? "+" : ""}${pct} %` : ""}`;
  const math = `Average over your week: ${avg.toLocaleString("en")} kcal. Protein ${lo}–${hi} g per kg${trains ? ", because you train" : ""} × ${Math.round(ref)} kg = ${proteinMin}–${proteinMax} g, target ${protein} g.`;
  return { kcal: avg, protein, fats, carbs: carbsOf(avg), proteinMin, proteinMax, proteinLo: lo, proteinHi: hi, proteinPerKg: perKg, proteinWhy, perMeal, trains, note: notes.join(" "), method, math, bmr: Math.round(bmr), tdee: Math.round(base), days, week, weekdays, numbersOf };
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
