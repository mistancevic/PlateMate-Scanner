// DT167 (0.3.9, board Stories119 versions 1 and 2; Coach Milan 30 October 08:47 to 09:59): Your summary and what your coach sees.
// One settings map: every answer the person gives, which part of the summary it sits in, what it does, and whether Chef Mealan
// reads it. The summary is built from it, and the test (summary.test.ts) fails when a field of Personal, Lifestyle or Safety has
// no line here, so no setting is set with no influence and none is forgotten.
import { placeName, kitchenName } from "./travel";
import type { Personal } from "./personal";
import { lifestyleOf, planOf, splitOf, splitName, lowCarbsOf, STEPS, equipmentOf, EQUIPMENT } from "./personal";
import type { Safety } from "./safety";
import { SITUATIONS } from "./safety";
import { HOURS, SLOTS, weekdaysOf, WEEKDAY_CHOICES, MOVES, KINDS, type Lifestyle } from "./plan";
import { slotsOf, startTimes, sleepWindow, workHoursOf } from "./slots";
import { TRAINING_AGES } from "./goal";

// ---- the parts the person shares with a coach, chosen once, part by part (version 2)
export type ShareId = "goal" | "day" | "eat" | "diet" | "words" | "alcohol" | "week" | "shop" | "health" | "allergies" | "body";
export const SHARE_PARTS: { id: ShareId; name: string; why: string; on: boolean; health?: boolean; fixed?: boolean }[] = [
  { id: "goal", name: "Goal and numbers", why: "Your goal and your daily numbers. Your coach already sees these.", on: true },
  { id: "day", name: "Your day", why: "Work, wake-up and bedtime, meal times.", on: true },
  { id: "eat", name: "How you eat", why: "Meals a day, where you eat, your taste chips.", on: true },
  { id: "week", name: "Training week", why: "Your usual week.", on: true },
  { id: "shop", name: "Where you shop and cook", why: "Places, kitchens, what you cook with.", on: true },
  { id: "diet", name: "What you eat", why: "Your diet. A diet can say something about your beliefs or your health: off until you switch it on.", on: false },
  { id: "alcohol", name: "Alcohol", why: "How often you drink. Off until you switch it on.", on: false },
  { id: "words", name: "In your own words", why: "What you wrote about your diet or your taste. Off until you switch it on.", on: false },
  { id: "health", name: "Health questions", why: "Which you ticked, and when. Your coach already sees this, never your words.", on: true, health: true, fixed: true },
  { id: "allergies", name: "Allergies and intolerances", why: "Share them if you want your coach to plan around them.", on: false, health: true },
  { id: "body", name: "Your body data", why: "Sex, birth year, height, weight and body fat, and your weigh-ins in kilograms. Off, your coach sees your weigh-ins only as a trend in percent. Switching this on is your consent, dated, and you can take it back.", on: false, health: true },
];
// what the person chose: a part's id with the date it was switched on; a part not in it follows its default
export type CoachShare = { on: Partial<Record<ShareId, string>>; off: ShareId[]; savedAt?: string };
export function sharedParts(s: CoachShare | undefined | null): ShareId[] {
  return SHARE_PARTS.filter((p) => p.fixed || (s?.on?.[p.id] ? true : s?.off?.includes(p.id) ? false : p.on)).map((p) => p.id);
}

// ---- the settings map. chef: how Chef Mealan reads it ("eats": in every request that asks for food, src/eats.ts; "request":
// with the requests that need it; "numbers": only through the numbers it gives; null: it orders the app only).
export type SettingLine = { share: ShareId; chef: "eats" | "request" | "numbers" | null; does: string } | { internal: string };
const S = (share: ShareId, chef: "eats" | "request" | "numbers" | null, does: string): SettingLine => ({ share, chef, does });
const I = (internal: string): SettingLine => ({ internal });
export const LIFESTYLE_MAP: { [K in keyof Required<Lifestyle>]: SettingLine } = {
  weekdays: S("day", "numbers", "How much your weekdays move you, before any training."),
  hours: S("day", "request", "With fixed hours, Monday to Friday are work days; meal times fit around work."),
  slot: S("day", "request", "Your work hours: meal times fit around them, and Chef Mealan plans around work."),
  move: S("day", "numbers", "How much a day without training burns."),
  workFrom: S("day", "request", "My hours: meal times fit around them."),
  workTo: S("day", "request", "My hours: meal times fit around them."),
  travel: S("day", "eats", "Chef Mealan knows some of your days are away from home."),
  school: S("day", "numbers", "Study hours: how much your weekdays move you."),
  commute: S("day", "numbers", "Walking or cycling there and back counts as light activity."),
  peWeek: S("week", "numbers", "Sport in your studies, on the days in your Training week."),
  bed: S("day", "eats", "Sets your last meal, two hours before bed."),
  wake: S("day", "eats", "Sets your first meal, an hour and a half after you wake."),
  where: S("eat", "eats", "Chef Mealan knows where your meals happen: a canteen lunch, meal prep, eating out."),
  meals: S("eat", "request", "Your slots on Plan and Today."),
  window: S("eat", "request", "An eating window set before: where the meal times start."),
  diet: S("diet", "eats", "Chef Mealan never offers a food your diet leaves out; the kitchens' dishes follow it."),
  alcohol: S("alcohol", "eats", "When you mention a drink, it counts as energy and leaves room in the day."),
  dietOther: S("words", "eats", "With Other, how you eat in your words."),
  slotTimes: S("eat", "request", "The meal times you set yourself."),
};
export const PERSONAL_MAP: { [K in keyof Required<Personal>]: SettingLine } = {
  sex: S("body", "numbers", "Your resting burn: the formulas differ."), birthYear: S("body", "numbers", "Your resting burn, and that you're 18 or older."),
  heightCm: S("body", "numbers", "Your resting burn."), weightKg: S("body", "numbers", "Your resting burn and your protein range."),
  bodyFatPct: S("body", "numbers", "With body fat, the formula that counts lean mass."),
  pdUnit: I("How PD is shown: a display choice."),
  life: I("Older accounts' activity, before the Training week."), week: S("week", "numbers", "How many days of each kind your week holds."),
  easyMin: S("week", "numbers", "How long an easy session lasts."), hardMin: S("week", "numbers", "How long a hard session lasts."),
  steps: S("day", "numbers", "Your steps on a usual day, counted on every day."),
  trainingAge: S("goal", "numbers", "How long you've trained: the pace of Build muscle and what weight trend to expect."),
  weighIns: S("body", "numbers", "Your trend against what your goal expects."),
  kept: I("Findings kept on purpose: shown again when a number changes."),
  dayMode: S("week", "numbers", "Each day its own numbers, or every day the same."), ownDays: S("week", "numbers", "A day type's numbers set by hand."),
  activity: I("Older accounts' activity answers."), dayKcal: I("Older accounts' day energy."),
  plan: S("week", "request", "Your usual week: each day's training, its numbers, the training row on Plan."),
  lifestyle: I("The answers in Lifestyle: each is on the Lifestyle map."),
  dated: S("week", "request", "A change for one date; the usual week stays."),
  formula: S("goal", "numbers", "The resting burn formula you picked."),
  nextGoal: S("goal", "request", "A goal from a later date."),
  targets: I("Each day's own target, kept once the day has it."),
  measuredUse: S("goal", "numbers", "Your measured burn, in use with From your data."),
  timesOn: S("eat", "request", "A meal moved for one date."),
  kitchens: S("shop", "request", "Chef Mealan cooks in these kitchens first."),
  carbsFat: S("goal", "eats", "How your day splits between carbs and fat."),
  kitchenTaste: S("shop", "request", "Per kitchen, the dishes Chef Mealan cooks toward and the ones left out."),
  tasteChips: S("eat", "request", "Ideas lean your way. Never changes your numbers."),
  units: I("The units shown: a display choice."),
  equipment: S("shop", "request", "Steps are written for what you cook with."),
  coachShare: I("Which parts your coach sees: chosen on Your summary."),
  // DT176 (0.3.19, board Stories124)
  travel: S("day", "eats", "Travel mode: search and scan read the shelves where you are; Chef Mealan suggests what fits the kitchen you have there; weigh-in can pause."),
  trips: S("day", null, "The days you were travelling, marked as travel."),
  travelBack: I("Welcome back, once, after Travel mode."),
  // DT178 (0.3.21, board Stories126): a setting for Google, never for the coach or the chef
  calendar: I("Google Calendar: on or off, and the kinds that go in."),
};
export const SAFETY_MAP: { [K in keyof Required<Safety>]: SettingLine } = {
  consentBodyAt: S("body", null, "Your consent before anything about your body is stored."),
  consentBy: I("Older accounts: who agreed."),
  adultAt: S("health", null, "That you're 18 or older: Chef Mealan's AI is for adults."),
  situations: S("health", "request", "Chef Mealan steps back where it should, and names who to talk to."),
  flags: S("health", "request", "Every situation flagged, with its date; your coach sees which and when."),
  allergies: S("allergies", "request", "A food you name is never suggested."),
  declaredAt: S("health", null, "When you last answered: asked again once a year."),
  none: S("health", "request", "None of these, ticked on purpose."),
  declarations: I("Every save of the health question, dated, visible to you."),
  aiConfirmedAt: I("Written by the coach."), aiConfirmedBy: I("Written by the coach."),
};

// ---- the summary, as the person reads it and as the coach reads the parts shared
export type SummaryRow = { key: string; label: string; value: string; does: string; chef: boolean; share: ShareId; health?: boolean };
export type SummaryPart = { id: "you" | "goal" | "day" | "eat" | "week" | "shop" | "health"; title: string; from: string; rows: SummaryRow[] };
export type SummaryIn = {
  personal: Personal; safety: Safety; tasteWords: string;
  goal: { band: string; name: string; setBy: string; at: string | null } | null;
  avg: { kcal: number; protein: number; fats: number } | null;
  days: { kcal: number; carbs: number }[];        // the usual week's seven days, Monday first
  protein: { min: number; max: number; lo: number; hi: number } | null;
  pdRef: number | null; burn: number | null;     // the resting burn, kcal
  home: string | null; places: string[];          // where you live, shop and cook; other places switched on
  now?: Date;
};
const n0 = (x: number) => Math.round(x).toLocaleString("en");
const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const chefOf = (l: SettingLine) => "chef" in l && l.chef !== null && l.chef !== "numbers";
const BED_WORDS: Record<string, string> = { early: "before 22:00", mid: "22:00 to midnight", late: "after midnight", varies: "varies with shifts" };
const WAKE_WORDS: Record<string, string> = { early: "before 6:00", mid: "6:00 to 8:00", late: "after 8:00", varies: "varies with shifts" };
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const placeOf = (r: string) => placeName(r as any), kitchenOf = (k: string) => kitchenName(k as any);
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export function summaryOf(x: SummaryIn): SummaryPart[] {
  const p = x.personal, l = lifestyleOf(p), parts: SummaryPart[] = [];
  const row = (key: string, map: SettingLine, label: string, value: string, does?: string, chef?: boolean): SummaryRow | null =>
    "internal" in map ? null : { key, label, value, does: does ?? map.does, chef: chef ?? chefOf(map), share: map.share, ...(["body", "health", "allergies"].includes(map.share) ? { health: true } : {}) };
  const push = (id: SummaryPart["id"], title: string, from: string, rows: (SummaryRow | null)[]) => { const r = rows.filter(Boolean) as SummaryRow[]; if (r.length) parts.push({ id, title, from, rows: r }); };
  // You
  const age = p.birthYear ? (x.now ?? new Date()).getFullYear() - p.birthYear : null;
  const body = [p.sex ? cap(p.sex) : "", p.birthYear ? `born ${p.birthYear}` : "", p.heightCm ? `${p.heightCm} cm` : "", p.weightKg ? `${p.weightKg} kg` : "", p.bodyFatPct ? `${p.bodyFatPct} % body fat` : ""].filter(Boolean).join(", ");
  push("you", "You", "Profile", [body ? row("body", PERSONAL_MAP.weightKg, "Body", body, x.burn ? `Your resting burn, about ${n0(Math.round(x.burn / 10) * 10)} kcal, and your protein range.` : "Your resting burn and your protein range.", false) : null,
    p.weighIns?.length ? row("weighIns", PERSONAL_MAP.weighIns, "Weigh-ins", `${p.weighIns.length}, the last on ${day(p.weighIns[p.weighIns.length - 1].date + "T12:00:00")}`) : null]);
  void age;
  // Goal and numbers
  const kc = x.days.map((d) => d.kcal).filter((v) => v > 0), cb = x.days.map((d) => d.carbs).filter((v) => v > 0);
  const split = splitOf(p, x.goal?.band ?? ""), low = lowCarbsOf(p, x.goal?.band ?? "");
  push("goal", "Goal and numbers", "Goal", [
    x.goal ? { key: "goal", label: "Goal", value: `${x.goal.name}, set by ${x.goal.setBy}${x.goal.at ? ` on ${day(x.goal.at)}` : ""}`, does: "Your numbers on Today, Plan and Plate follow it.", chef: true, share: "goal" } : null,
    x.avg ? { key: "avg", label: "An average day", value: `${n0(x.avg.kcal)} kcal · ${n0(x.avg.protein)} g protein · ${n0(x.avg.fats)} g fat`, does: [kc.length ? `${n0(Math.min(...kc))} to ${n0(Math.max(...kc))} kcal by day.` : "", x.protein ? `Protein ${x.protein.min} to ${x.protein.max} g: ${x.protein.lo} to ${x.protein.hi} g a kg.` : ""].filter(Boolean).join(" "), chef: true, share: "goal" } : null,
    x.goal ? row("carbsFat", PERSONAL_MAP.carbsFat, "Carbs and fat", low !== null ? `${splitName(split)}, ${low} g of carbs a day` : splitName(split), cb.length ? `Carbs move with your training: ${n0(Math.min(...cb))} to ${n0(Math.max(...cb))} g.` : undefined) : null,
    x.avg && x.avg.kcal > 0 ? { key: "pd", label: "PD target", value: `${(Math.round((1000 * x.avg.protein) / x.avg.kcal) / 10).toFixed(1)} on an average day`, does: "Every plate and food is marked against the day's own target.", chef: true, share: "goal" } : null,
    p.trainingAge ? row("trainingAge", PERSONAL_MAP.trainingAge, "Training for", (TRAINING_AGES.find((t) => t.id === p.trainingAge)?.name ?? String(p.trainingAge)).replace("–", " to ")) : null,
  ]);
  // Your day
  const wk = weekdaysOf(l), work = workHoursOf(l), hours = HOURS.find((h) => h.id === l.hours)?.name.toLowerCase();
  const weekdays = [WEEKDAY_CHOICES.find((c) => c.id === wk)?.name, wk === "work" || wk === "both" ? hours : "", work ? `${work.from} to ${work.to}` : l.slot && l.slot !== "my" ? SLOTS.find((s) => s.id === l.slot)?.name : "", wk !== "home" ? MOVES.find((m) => m.id === (l.move ?? "sitting"))?.name.toLowerCase() : ""].filter(Boolean).join(", ");
  const slots = slotsOf(l), times = list(slots.map((s) => s.time)), from = startTimes(Math.min(5, Math.max(1, l.meals ?? 3)), l).from, sw = sleepWindow(l);
  push("day", "Your day", "Lifestyle", [
    row("weekdays", LIFESTYLE_MAP.weekdays, "Weekdays", weekdays || "Not set yet", work ? "How much a day without training burns; meal times fit around work." : undefined),
    // DT176 (0.3.19): Travel mode on, and the trips it kept
    p.travel ? row("travelNow", PERSONAL_MAP.travel, "Travel mode", `On since ${day(p.travel.since)} · ${placeOf(p.travel.place)} · ${kitchenOf(p.travel.kitchen)}`) : null,
    p.trips?.length ? row("trips", PERSONAL_MAP.trips, "Trips", p.trips.slice(-3).map((t) => `${placeOf(t.place)}, ${day(t.from + "T12:00:00")} to ${day(t.to + "T12:00:00")}`).join(" · ")) : null,
    l.travel ? row("travel", LIFESTYLE_MAP.travel, "Work travel", ({ none: "None", sometimes: "Occasionally", often: "A lot" } as Record<string, string>)[l.travel] ?? l.travel) : null,
    l.wake || l.bed ? row("sleep", LIFESTYLE_MAP.wake, "Wake-up and bedtime", `${cap(WAKE_WORDS[l.wake ?? ""] ?? "wake-up not set")} · ${BED_WORDS[l.bed ?? ""] ?? "bedtime not set"}`, sw && from === "sleep" ? `Your meals at ${times}.` : from === "work" ? `Your meals fit around work: ${times}.` : "Chef Mealan reads them for when to eat.") : null,
    p.steps ? row("steps", PERSONAL_MAP.steps, "Steps on a usual day", STEPS.find((s) => s.id === p.steps)?.name ?? String(p.steps)) : null,
  ]);
  // How you eat
  const own = Object.values(l.slotTimes ?? {}).length;
  const tc = p.tasteChips, taste = [tc?.like?.length ? `I like ${tc.like.map((t) => t.toLowerCase()).join(", ")}` : "", tc?.not?.length ? `rather not ${tc.not.map((t) => t.toLowerCase()).join(", ")}` : "", tc?.how?.length ? tc.how.map((t) => t.toLowerCase()).join(", ") : ""].filter(Boolean).join(" · ");
  push("eat", "How you eat", "Lifestyle", [
    row("meals", LIFESTYLE_MAP.meals, "Meals", `${l.meals ?? 3} a day, ${times}`, own ? `Your slots on Plan and Today; ${own === 1 ? "one time" : `${own} times`} set by you.` : undefined),
    l.where?.length ? row("where", LIFESTYLE_MAP.where, "Where you eat", l.where.join(" · ")) : null,
    row("diet", LIFESTYLE_MAP.diet, "What you eat", l.diet ?? "Everything", (l.diet ?? "Everything") === "Everything" ? "Every food and dish can be suggested." : undefined),
    l.diet === "Other" && l.dietOther?.trim() ? row("dietOther", LIFESTYLE_MAP.dietOther, "In your words", l.dietOther.trim()) : null,
    l.alcohol ? row("alcohol", LIFESTYLE_MAP.alcohol, "Alcohol", l.alcohol, l.alcohol === "None" ? "Chef Mealan never suggests drinking." : undefined) : null,
    taste ? row("taste", PERSONAL_MAP.tasteChips, "Taste", cap(taste)) : null,
    x.tasteWords.trim() ? { key: "tasteWords", label: "Taste, in your own words", value: x.tasteWords.trim().slice(0, 200), does: "Read as extra, never over a chip, your allergies or your numbers.", chef: true, share: "words" } : null,
  ]);
  // Training week
  const plan = planOf(p);
  const kindOf = (d: any) => [KINDS.find((k) => k.id === d.kind)?.name ?? cap(String(d.kind ?? "")), d.intensity ? `(${d.intensity})` : ""].filter(Boolean).join(" ");
  const trainDays = plan ? plan.map((d: any, i: number) => (d.kind && d.kind !== "rest" ? `${kindOf(d)} ${DAYS[i]}` : "")).filter(Boolean) : [];
  push("week", "Training week", "Training week", [plan ? row("plan", PERSONAL_MAP.plan, "Your usual week", trainDays.length ? trainDays.join(" · ") : "No training days yet", `${trainDays.length} training ${trainDays.length === 1 ? "day" : "days"} and ${7 - trainDays.length} without. Carbs go up and down with them.`) : null]);
  // Where you shop and cook
  const tools = equipmentOf(p).map((id) => EQUIPMENT.find(([e]) => e === id)?.[1] ?? id);
  push("shop", "Where you shop and cook", "Where I shop and cook", [
    x.home ? { key: "places", label: "Where you shop", value: [x.home, ...x.places].join(" · "), does: "The foods in your search, and what Chef Mealan suggests you buy.", chef: true, share: "shop" } : null,
    p.kitchens?.length ? row("kitchens", PERSONAL_MAP.kitchens, "Kitchens", p.kitchens.join(" · ")) : null,
    row("equipment", PERSONAL_MAP.equipment, "What you cook with", tools.join(" · ")),
  ]);
  // Health questions
  const s = x.safety, sit = s.situations.map((id) => SITUATIONS.find((t) => t.id === id)?.label ?? id);
  push("health", "Health questions", "Profile", [
    row("situations", SAFETY_MAP.situations, "Is any of this true for you?", s.declaredAt ? `${sit.length ? list(sit) : s.none ? "None of these" : "Not answered"}, answered ${day(s.declaredAt)}` : "Not answered yet", s.declaredAt ? (sit.length ? "Chef Mealan steps back where it should, and names who to talk to." : "Chef Mealan helps with everything. Asked again once a year.") : "Asked before Chef Mealan's chat opens."),
    row("allergies", SAFETY_MAP.allergies, "Allergies and intolerances", s.allergies.length ? s.allergies.join(", ") : "None"),
  ]);
  return parts;
}

// ---- what a coach reads: only the rows of the parts shared, never a private part's row or that it changed
export type SharedProfile = { rows: SummaryRow[]; parts: ShareId[]; changes: ProfileChange[]; updatedAt: string };
export type ProfileChange = { at: string; text: string; share: ShareId | "share" };
export const CHANGES_KEPT = 60;
export function sharedRows(parts: SummaryPart[], shared: ShareId[]): SummaryRow[] {
  return parts.flatMap((p) => p.rows).filter((r) => shared.includes(r.share));
}
// the next copy for the coach: the shared rows now, with what changed against the last copy, dated
export function nextShared(prev: SharedProfile | null, rows: SummaryRow[], shared: ShareId[], now = new Date()): SharedProfile | null {
  const at = now.toISOString(), changes: ProfileChange[] = [];
  const before = new Map((prev?.rows ?? []).map((r) => [r.key, r]));
  const stopped = (prev?.parts ?? []).filter((id) => !shared.includes(id));
  if (prev) {
    for (const r of rows) { const b = before.get(r.key); if (!b) { if ((prev.parts ?? []).includes(r.share)) changes.push({ at, text: `${r.label}: ${r.value}.`, share: r.share }); } else if (b.value !== r.value) changes.push({ at, text: `${r.label}: ${b.value} → ${r.value}.`, share: r.share }); }
    for (const id of shared.filter((x) => !(prev.parts ?? []).includes(x))) changes.push({ at, text: `Started sharing: ${SHARE_PARTS.find((p) => p.id === id)!.name}.`, share: "share" });
    for (const id of stopped) changes.push({ at, text: `Stopped sharing: ${SHARE_PARTS.find((p) => p.id === id)!.name}.`, share: "share" });
  }
  const same = prev && !changes.length && prev.rows.length === rows.length && rows.every((r) => before.get(r.key)?.value === r.value && before.get(r.key)?.does === r.does);
  if (same) return null;
  // a part switched off takes its past changes with it
  const kept = (prev?.changes ?? []).filter((c) => c.share === "share" || shared.includes(c.share as ShareId));
  return { rows, parts: shared, changes: [...kept, ...changes].slice(-CHANGES_KEPT), updatedAt: at };
}
export const changesSince = (sp: SharedProfile | null | undefined, seen: string | null): ProfileChange[] => (sp?.changes ?? []).filter((c) => !seen || c.at > seen);
