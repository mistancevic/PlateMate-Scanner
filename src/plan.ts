// The Weekly plan and Lifestyle, as approved on the canvas on 6 October 2026.
// Lifestyle is set once: work, recovery, nutrition. The Weekly plan is the usual week, Monday to Sunday, one activity a day.
// Today reads the plan; a change for one date is kept for that date only and never touches the plan.
import type { DayType } from "./personal";

export type Kind = "rest" | "strength" | "cardio" | "hiit" | "mobility" | "stretching" | "yoga" | "walk" | "team";
export type Intensity = "easy" | "moderate" | "hard";
export type When = "morning" | "day" | "evening" | "late";
export type PlanDay = { work: boolean; kind: Kind; intensity?: Intensity; when?: When; minutes?: number };
export type Plan = PlanDay[]; // seven days, Monday first

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const weekdayIndex = (d: Date) => (d.getDay() + 6) % 7;

// METs from the Compendium of Physical Activities (2024), at easy, moderate and hard. Only the part above rest is added.
export const KINDS: { id: Kind; name: string; hint: string; met: [number, number, number] }[] = [
  { id: "rest",       name: "Rest",       hint: "nothing planned",                  met: [1, 1, 1] },
  { id: "strength",   name: "Strength",   hint: "weights, machines, bodyweight",    met: [3.5, 5, 6] },
  { id: "cardio",     name: "Cardio",     hint: "running, cycling, swimming",       met: [5, 7, 9] },
  { id: "hiit",       name: "HIIT",       hint: "short hard intervals",             met: [6, 8, 9.5] },
  { id: "mobility",   name: "Mobility",   hint: "joints and range of motion",       met: [2.5, 3, 3.5] },
  { id: "stretching", name: "Stretching", hint: "slow and easy",                    met: [2.3, 2.5, 3] },
  { id: "yoga",       name: "Yoga",       hint: "any style",                        met: [2.5, 3, 4] },
  { id: "walk",       name: "Walk",       hint: "a real walk, not the way to work", met: [3.5, 4.3, 5] },
  { id: "team",       name: "Team sport", hint: "football, basketball, tennis",     met: [5, 7, 8] },
];
export const INTENSITIES: { id: Intensity; name: string }[] = [{ id: "easy", name: "Easy" }, { id: "moderate", name: "Moderate" }, { id: "hard", name: "Hard" }];
export const WHENS: { id: When; name: string }[] = [{ id: "morning", name: "Morning" }, { id: "day", name: "During the day" }, { id: "evening", name: "Evening" }, { id: "late", name: "Late night" }];
export const MINUTES = [30, 45, 60, 75, 90];
const I = (x?: Intensity) => (x === "hard" ? 2 : x === "moderate" ? 1 : 0);
export const kindOf = (k: Kind) => KINDS.find((x) => x.id === k) ?? KINDS[0];
export const metOf = (d: PlanDay) => (d.kind === "rest" ? 1 : kindOf(d.kind).met[I(d.intensity)]);
export const minutesOf = (d: PlanDay) => (d.kind === "rest" ? 0 : d.minutes ?? 60);
// How hard the day is decides the numbers row when the person types their own: Rest, Light, Moderate, Hard.
export const loadOf = (d: PlanDay): DayType => (d.kind === "rest" ? "passive" : d.intensity === "hard" ? "hard" : d.intensity === "moderate" ? "easy" : "active");
export const LOAD_NAME: Record<DayType, string> = { passive: "Rest", active: "Light", easy: "Moderate", hard: "Hard" };
export const LOAD_DAY: Record<DayType, string> = { passive: "A rest day.", active: "A light day.", easy: "A moderate day.", hard: "A hard day." };
const whenWords: Record<When, string> = { morning: "in the morning", day: "during the day", evening: "in the evening", late: "late at night" };
// "Strength, hard, in the evening"
export function planLine(d: PlanDay): string {
  if (d.kind === "rest") return "Rest";
  return `${kindOf(d.kind).name}, ${d.intensity ?? "easy"}${d.when ? `, ${whenWords[d.when]}` : ""}`;
}
export function planShort(d: PlanDay): string {
  if (d.kind === "rest") return "Rest";
  return `${kindOf(d.kind).name}, ${d.intensity ?? "easy"}${d.when ? ` · ${WHENS.find((w) => w.id === d.when)!.name.toLowerCase()}` : ""}`;
}

// A starting plan for someone who had the old My week counts: hard days first on Monday and Thursday, then the easy ones,
// the active rest on Saturday, rest where nothing is left. Work Monday to Friday. Everything stays editable.
export function planFromCounts(c: Record<DayType, number>, easyMin = 60, hardMin = 75): Plan {
  const order = [0, 3, 1, 4, 2, 5, 6];
  const slots: PlanDay[] = [];
  for (let i = 0; i < (c.hard || 0); i++) slots.push({ work: false, kind: "strength", intensity: "hard", when: "evening", minutes: hardMin });
  for (let i = 0; i < (c.easy || 0); i++) slots.push({ work: false, kind: "strength", intensity: "moderate", when: "evening", minutes: easyMin });
  for (let i = 0; i < (c.active || 0); i++) slots.push({ work: false, kind: "walk", intensity: "easy", when: "day", minutes: 45 });
  const plan: Plan = Array.from({ length: 7 }, (_, i) => ({ work: i < 5, kind: "rest" as Kind }));
  slots.slice(0, 7).forEach((s, n) => { const i = order[n]; plan[i] = { ...s, work: i < 5 }; });
  return plan;
}
export const isPlanDay = (x: any): x is PlanDay => !!x && typeof x === "object" && typeof x.kind === "string" && KINDS.some((k) => k.id === x.kind);
export const isPlan = (x: any): x is Plan => Array.isArray(x) && x.length === 7 && x.every(isPlanDay);
export const countsOf = (plan: Plan): Record<DayType, number> => {
  const c: Record<DayType, number> = { passive: 0, active: 0, easy: 0, hard: 0 };
  for (const d of plan) c[loadOf(d)]++;
  return c;
};

// Today's plan for one date: kept apart from the Weekly plan, under a dated key, so a new day starts from the plan again.
const dateKey = (d = new Date()) => `chefmealan-today-${d.toISOString().slice(0, 10)}`;
export function getTodayChange(d = new Date()): PlanDay | null {
  try { const v = JSON.parse(localStorage.getItem(dateKey(d)) || "null"); return isPlanDay(v) ? v : null; } catch { return null; }
}
export function setTodayChange(day: PlanDay | null, d = new Date()) {
  try { if (day) localStorage.setItem(dateKey(d), JSON.stringify(day)); else localStorage.removeItem(dateKey(d)); } catch { /* nothing */ }
}
// a load picked on Today by someone with no Weekly plan yet becomes a plain day of that load
export const dayOfLoad = (t: DayType): PlanDay =>
  t === "passive" ? { work: false, kind: "rest" } : { work: false, kind: t === "active" ? "walk" : "strength", intensity: t === "hard" ? "hard" : t === "easy" ? "moderate" : "easy", minutes: t === "active" ? 45 : 60 };

// Lifestyle. Work sets the day's baseline; the rest is kept and shown now and used by the numbers in a next release.
export type Hours = "fixed" | "flexible" | "shifts" | "none";
export type Slot = "9-5" | "8-4" | "7-3";
export type Move = "sitting" | "feet" | "physical";
export type Lifestyle = {
  hours?: Hours; slot?: Slot; move?: Move; travel?: "none" | "sometimes" | "often";
  bed?: "early" | "mid" | "late" | "varies"; wake?: "early" | "mid" | "late" | "varies";
  where?: string[]; meals?: number; window?: { from: string; to: string } | null; diet?: string; alcohol?: string;
};
// Life without planned activity, as a multiple of resting burn: physical activity levels after FAO/WHO/UNU 2004, at the low
// end of each band, because planned activity is counted per day. A day off from a job on your feet counts as a sitting day.
export const MOVES: { id: Move; name: string; hint: string; factor: number }[] = [
  { id: "sitting",  name: "Mostly sitting", hint: "desk, driving",              factor: 1.3 },
  { id: "feet",     name: "On your feet",   hint: "shop, care, teaching",       factor: 1.55 },
  { id: "physical", name: "Physical",       hint: "building, farming, carrying", factor: 1.75 },
];
export const HOURS: { id: Hours; name: string; hint: string }[] = [
  { id: "fixed", name: "Fixed hours", hint: "same times every day" },
  { id: "flexible", name: "Flexible hours", hint: "you choose when" },
  { id: "shifts", name: "Shifts", hint: "early, late, night or rotating" },
  { id: "none", name: "No fixed work", hint: "home, studies, retired" },
];
export const SLOTS: { id: Slot; name: string }[] = [{ id: "9-5", name: "9 to 5" }, { id: "8-4", name: "8 to 4" }, { id: "7-3", name: "7 to 3" }];
export const WHERE = ["Cook at home", "Meal prep for days", "Canteen at work", "Restaurants", "Takeaway", "Family dinners"];
export const DIETS = ["Everything", "Vegetarian", "Vegan", "Pescatarian", "No pork"];
export const ALCOHOL = ["None", "Occasionally", "On weekends", "A few times a week", "Most days"];
// Alcohol is asked only from 18, in every country; the age comes from the profile.
export const ALCOHOL_AGE = 18;
export const moveOf = (l: Lifestyle) => MOVES.find((m) => m.id === (l.move ?? "sitting")) ?? MOVES[0];
export const baseFactor = (l: Lifestyle, workDay: boolean) => (workDay ? moveOf(l).factor : MOVES[0].factor);
// the old one-choice life, before 6 October 2026, moves over the first time it is read
export function lifestyleFromOld(life?: string): Lifestyle {
  if (life === "shift") return { hours: "shifts", move: "sitting" };
  if (life === "feet") return { hours: "fixed", move: "feet" };
  if (life === "physical") return { hours: "fixed", move: "physical" };
  return { hours: "fixed", slot: "9-5", move: "sitting" };
}

// Which moments come first when you cook, from the Lifestyle and the Weekly plan (it was a set of chips before).
import type { RhythmId } from "./moments";
export function usualFrom(l: Lifestyle, plan: Plan | null): RhythmId[] {
  const out = new Set<RhythmId>();
  if (l.hours === "fixed" && (l.move ?? "sitting") === "sitting") out.add("desk");
  if (l.hours === "shifts") out.add("shifts");
  for (const [i, d] of (plan ?? []).entries()) {
    if (d.kind === "rest") continue;
    if (d.when === "morning") out.add("morning-training");
    if (d.when === "evening" || d.when === "late") out.add("evening-training");
    if (i >= 5) out.add("weekend-training");
  }
  if (l.bed === "late") out.add("late-nights");
  if ((l.where ?? []).some((w) => w === "Restaurants" || w === "Takeaway")) out.add("eats-out");
  if (l.travel === "often") out.add("travels");
  if ((l.where ?? []).includes("Family dinners")) out.add("family-dinners");
  return [...out];
}
