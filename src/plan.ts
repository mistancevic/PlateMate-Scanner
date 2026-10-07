// The Weekly plan and Lifestyle, as approved on the canvas on 6 October 2026.
// Lifestyle is set once: work, recovery, nutrition. The Weekly plan is the usual week, Monday to Sunday, one activity a day.
// Today reads the plan; a change for one date is kept for that date only and never touches the plan.
import type { DayType } from "./personal";

export type Kind = "rest" | "strength" | "cardio" | "hiit" | "mobility" | "stretching" | "yoga" | "walk" | "team" | "club" | "match" | "dance";
export type Intensity = "easy" | "moderate" | "hard";
export type When = "morning" | "day" | "evening" | "late" | "afterschool" | "lateafternoon";
export type Sport = "football" | "basketball" | "swimming" | "handball" | "volleyball" | "tennis" | "other";
// work: a weekday with work or study (a school day for anyone under 18); false is a day off.
// study: on such a day, a study day rather than a work day (Release B, for anyone who works and studies).
// pe: sport at school, or sport in class, that day. sport: for club training or a match.
export type PlanDay = { work: boolean; study?: boolean; kind: Kind; intensity?: Intensity; when?: When; minutes?: number; pe?: boolean; sport?: Sport };
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
  // for school kids: training with a club, a match, dance; club and match take their METs from the sport
  { id: "club",       name: "Club training", hint: "training with your club",       met: [5, 7, 9] },
  { id: "match",      name: "Match",      hint: "a game with your club",            met: [6, 8, 9.5] },
  { id: "dance",      name: "Dance",      hint: "any style",                        met: [4, 5.5, 7.8] },
];
// Which activities each person sees: adults one list, school kids another (after school).
export const ADULT_KINDS: Kind[] = ["rest", "strength", "cardio", "hiit", "mobility", "stretching", "yoga", "walk", "team"];
export const KID_KINDS: Kind[] = ["rest", "club", "match", "strength", "cardio", "dance", "walk", "yoga"];
// METs by sport at easy, moderate and hard, Compendium of Physical Activities 2024 (youth values where they exist).
export const SPORTS: { id: Sport; name: string; met: [number, number, number] }[] = [
  { id: "football",   name: "Football",   met: [5, 7, 9.5] },
  { id: "basketball", name: "Basketball", met: [4.5, 6.5, 8] },
  { id: "swimming",   name: "Swimming",   met: [5.8, 8, 9.8] },
  { id: "handball",   name: "Handball",   met: [6, 8, 10] },
  { id: "volleyball", name: "Volleyball", met: [3, 4, 6] },
  { id: "tennis",     name: "Tennis",     met: [5, 7.3, 8] },
  { id: "other",      name: "Other",      met: [4, 6, 8] },
];
export const sportOf = (s?: Sport) => SPORTS.find((x) => x.id === s) ?? SPORTS[0];
// Sport at school counts as 45 minutes at about 4 METs (Compendium 2024, youth physical education).
export const PE = { met: 4, minutes: 45 };
// The way to school or to classes and back, on a study day: about 30 minutes in all. Walking about 3.5 METs, cycling about 4.
export const COMMUTE: Record<string, { met: number; minutes: number; name: string }> = {
  walk: { met: 3.5, minutes: 30, name: "walking there and back" },
  bike: { met: 4, minutes: 30, name: "cycling there and back" },
};
export const INTENSITIES: { id: Intensity; name: string }[] = [{ id: "easy", name: "Easy" }, { id: "moderate", name: "Moderate" }, { id: "hard", name: "Hard" }];
export const WHENS: { id: When; name: string }[] = [{ id: "morning", name: "Morning" }, { id: "day", name: "During the day" }, { id: "evening", name: "Evening" }, { id: "late", name: "Late night" }];
export const WHENS_KID: { id: When; name: string }[] = [{ id: "afterschool", name: "Right after school" }, { id: "lateafternoon", name: "Late afternoon" }, { id: "evening", name: "Evening" }];
export const MINUTES = [30, 45, 60, 75, 90];
export const MINUTES_KID = [60, 75, 90, 120];
const I = (x?: Intensity) => (x === "hard" ? 2 : x === "moderate" ? 1 : 0);
export const kindOf = (k: Kind) => KINDS.find((x) => x.id === k) ?? KINDS[0];
export const metOf = (d: PlanDay) => (d.kind === "rest" ? 1 : d.kind === "club" || d.kind === "match" ? sportOf(d.sport).met[I(d.intensity ?? (d.kind === "match" ? "hard" : "moderate"))] : kindOf(d.kind).met[I(d.intensity)]);
export const minutesOf = (d: PlanDay) => (d.kind === "rest" ? 0 : d.minutes ?? 60);
// How hard the day is decides the numbers row when the person types their own: Rest, Light, Moderate, Hard.
export const loadOf = (d: PlanDay): DayType => (d.kind === "rest" ? (d.pe ? "active" : "passive") : d.intensity === "hard" ? "hard" : d.intensity === "moderate" ? "easy" : "active");
export const LOAD_NAME: Record<DayType, string> = { passive: "Rest", active: "Light", easy: "Moderate", hard: "Hard" };
export const LOAD_DAY: Record<DayType, string> = { passive: "A rest day.", active: "A light day.", easy: "A moderate day.", hard: "A hard day." };
const whenWords: Record<When, string> = { morning: "in the morning", day: "during the day", evening: "in the evening", late: "late at night", afterschool: "right after school", lateafternoon: "in the late afternoon" };
const whenShort = (w: When) => [...WHENS, ...WHENS_KID].find((x) => x.id === w)!.name.toLowerCase();
// the activity's own name: "Strength", or for a club "Football training", "Football match"
export const activityName = (d: PlanDay) => d.kind === "club" ? `${sportOf(d.sport).name} training` : d.kind === "match" ? `${sportOf(d.sport).name} match` : kindOf(d.kind).name;
// "Strength, hard, in the evening"
export function planLine(d: PlanDay): string {
  const act = d.kind === "rest" ? "" : `${activityName(d)}, ${d.intensity ?? "easy"}${d.when ? `, ${whenWords[d.when]}` : ""}`;
  if (d.pe) return act ? `${peName(d)}, then ${act.charAt(0).toLowerCase() + act.slice(1)}` : peName(d);
  return act || "Rest";
}
const peName = (d: PlanDay) => (d.study ? "Sport in class" : "Sport at school");
// the agenda line: "Strength, hard · evening", "Sport at school, then football training, hard · late afternoon"
export function planShort(d: PlanDay): string {
  const act = d.kind === "rest" ? "" : `${activityName(d)}, ${d.intensity ?? "easy"}${d.when ? ` · ${whenShort(d.when)}` : ""}`;
  if (d.pe) return act ? `${peName(d)}, then ${act.charAt(0).toLowerCase() + act.slice(1)}` : peName(d);
  return act || "Rest";
}
// Today's sentence on a study day (Release B): "Study day, then team sport in the evening."
export function studyLine(d: PlanDay): string {
  const act = d.kind === "rest" ? "" : `${activityName(d).charAt(0).toLowerCase() + activityName(d).slice(1)}${d.when ? ` ${whenWords[d.when]}` : ""}`;
  return `Study day${d.pe ? " with sport in class" : ""}${act ? `, then ${act}` : ""}`;
}
// Today's sentence for a school kid: "School with sport at school, then football training in the late afternoon."
export function schoolLine(d: PlanDay): string {
  const act = d.kind === "rest" ? "" : `${activityName(d).charAt(0).toLowerCase() + activityName(d).slice(1)}${d.when ? ` ${whenWords[d.when]}` : ""}`;
  if (!d.work) return act ? `No school. ${activityName(d)}${d.when ? ` ${whenWords[d.when]}` : ""}` : "No school, and nothing planned";
  return `School${d.pe ? " with sport at school" : ""}${act ? `, then ${act}` : ""}`;
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

// A change for one date is kept in the person's settings under that date (so it reaches the account) and never touches the plan.
// The date is the local calendar date, not UTC, so a change made late in the evening stays on the right day.
export const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
// ISO week: Monday first; week 1 holds the year's first Thursday.
export function isoWeek(d: Date): { week: number; year: number; monday: Date } {
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const wd = (day.getDay() + 6) % 7;
  const monday = new Date(day); monday.setDate(day.getDate() - wd);
  const thursday = new Date(monday); thursday.setDate(monday.getDate() + 3);
  const firstThu = new Date(thursday.getFullYear(), 0, 4);
  const firstMon = new Date(firstThu); firstMon.setDate(firstThu.getDate() - ((firstThu.getDay() + 6) % 7));
  const week = 1 + Math.round((monday.getTime() - firstMon.getTime()) / (7 * 864e5));
  return { week, year: thursday.getFullYear(), monday };
}
export const datesOfWeek = (monday: Date) => Array.from({ length: 7 }, (_, i) => { const x = new Date(monday); x.setDate(monday.getDate() + i); return x; });
// before 7 October 2026 a change for today was kept on the phone only, under a UTC date key
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
export type SchoolHours = "mornings" | "full" | "alternating" | "none";
export type Commute = "walk" | "bike" | "bus" | "car";
// Release B (7 October 2026): what fills the weekdays. The questions after it follow the answer.
export type Weekdays = "work" | "study" | "both" | "home";
export type Lifestyle = {
  weekdays?: Weekdays;
  hours?: Hours; slot?: Slot; move?: Move; travel?: "none" | "sometimes" | "often";
  // study (any adult; school for anyone under 18): hours, the way there, sport as part of the studies
  school?: SchoolHours; commute?: Commute; peWeek?: "1" | "2" | "3" | "none";
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
// Working hours as asked since Release B: No fixed work is now At home, under Your weekdays.
export const HOURS_SHOWN = HOURS.filter((h) => h.id !== "none");
export const WEEKDAY_CHOICES: { id: Weekdays; name: string; hint: string }[] = [
  { id: "work", name: "Work", hint: "a job, on site or remote work" },
  { id: "study", name: "Study", hint: "university, school, a course" },
  { id: "both", name: "Work and study", hint: "an apprenticeship, a job next to studies" },
  { id: "home", name: "At home", hint: "home and family, retired, between jobs" },
];
// older lifestyles had No fixed work under Working hours: that is At home now
export const weekdaysOf = (l: Lifestyle): Weekdays => l.weekdays ?? (l.hours === "none" ? "home" : "work");
export const STUDY_HOURS: { id: SchoolHours; name: string; hint: string }[] = [
  { id: "mornings", name: "Mornings", hint: "done around lunch" },
  { id: "full", name: "Full day", hint: "until the afternoon" },
  { id: "alternating", name: "Changes every week", hint: "mornings, then afternoons" },
];
// What a day is: work, study or off. Under 18 a weekday is a school day; At home, every day is a day at home.
export type DayKind = "work" | "study" | "off";
export function dayKindOf(d: PlanDay, l: Lifestyle, minor = false): DayKind {
  if (!d.work) return "off";
  if (minor) return "study";
  const w = weekdaysOf(l);
  return w === "home" ? "off" : w === "study" ? "study" : w === "work" ? "work" : d.study ? "study" : "work";
}
export const SLOTS: { id: Slot; name: string }[] = [{ id: "9-5", name: "9 to 5" }, { id: "8-4", name: "8 to 4" }, { id: "7-3", name: "7 to 3" }];
export const WHERE = ["Cook at home", "Meal prep for days", "Canteen at work", "Restaurants", "Takeaway", "Family dinners"];
export const WHERE_KID = ["At home", "School lunch", "Lunch packed from home", "Bakery or shop near school", "Takeaway", "Family dinners"];
export const SCHOOL_HOURS: { id: SchoolHours; name: string; hint: string }[] = [
  { id: "mornings", name: "Mornings", hint: "school ends around lunch" },
  { id: "full", name: "Full day", hint: "school until the afternoon" },
  { id: "alternating", name: "Changes every week", hint: "mornings one week, afternoons the next" },
  { id: "none", name: "Not in school", hint: "holidays, a gap year, home schooling" },
];
export const COMMUTES: { id: Commute; name: string }[] = [{ id: "walk", name: "Walk" }, { id: "bike", name: "Bike" }, { id: "bus", name: "Bus or train" }, { id: "car", name: "Car" }];
export const PE_WEEK: { id: "1" | "2" | "3" | "none"; name: string }[] = [{ id: "1", name: "Once a week" }, { id: "2", name: "Twice a week" }, { id: "3", name: "Three times or more" }, { id: "none", name: "None" }];
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
