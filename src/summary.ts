// DT167 (0.3.9, board Stories119 versions 1 and 2; Coach Milan 30 October 08:47 to 09:59): Your summary and what your coach sees.
// One settings map: every answer the person gives, which part of the summary it sits in, what it does, and whether Chef Mealan
// reads it. The summary is built from it, and the test (summary.test.ts) fails when a field of Personal, Lifestyle or Safety has
// no line here, so no setting is set with no influence and none is forgotten.
import { dec, w, wn, numText, dateV, type WordKey } from "./words";
import { getLang, inLang, locOf, type Lang } from "./lang";
import { optWord } from "./optWords";
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
  { id: "goal", get name() { return w("share.goal.name"); }, get why() { return w("share.goal.why"); }, on: true },
  { id: "day", get name() { return w("share.day.name"); }, get why() { return w("share.day.why"); }, on: true },
  { id: "eat", get name() { return w("share.eat.name"); }, get why() { return w("share.eat.why"); }, on: true },
  { id: "week", get name() { return w("share.week.name"); }, get why() { return w("share.week.why"); }, on: true },
  { id: "shop", get name() { return w("share.shop.name"); }, get why() { return w("share.shop.why"); }, on: true },
  { id: "diet", get name() { return w("share.diet.name"); }, get why() { return w("share.diet.why"); }, on: false },
  { id: "alcohol", get name() { return w("share.alcohol.name"); }, get why() { return w("share.alcohol.why"); }, on: false },
  { id: "words", get name() { return w("share.words.name"); }, get why() { return w("share.words.why"); }, on: false },
  { id: "health", get name() { return w("share.health.name"); }, get why() { return w("share.health.why"); }, on: true, health: true, fixed: true },
  { id: "allergies", get name() { return w("share.allergies.name"); }, get why() { return w("share.allergies.why"); }, on: false, health: true },
  { id: "body", get name() { return w("share.body.name"); }, get why() { return w("share.body.why"); }, on: false, health: true },
];
// what the person chose: a part's id with the date it was switched on; a part not in it follows its default
export type CoachShare = { on: Partial<Record<ShareId, string>>; off: ShareId[]; savedAt?: string };
export function sharedParts(s: CoachShare | undefined | null): ShareId[] {
  return SHARE_PARTS.filter((p) => p.fixed || (s?.on?.[p.id] ? true : s?.off?.includes(p.id) ? false : p.on)).map((p) => p.id);
}

// ---- the settings map. chef: how Chef Mealan reads it ("eats": in every request that asks for food, src/eats.ts; "request":
// with the requests that need it; "numbers": only through the numbers it gives; null: it orders the app only).
export type SettingLine = { share: ShareId; chef: "eats" | "request" | "numbers" | null; does: string } | { internal: string };
const S = (share: ShareId, chef: "eats" | "request" | "numbers" | null, k: WordKey): SettingLine => ({ share, chef, get does() { return w(k); } });
const I = (internal: string): SettingLine => ({ internal });
export const LIFESTYLE_MAP: { [K in keyof Required<Lifestyle>]: SettingLine } = {
  weekdays: S("day", "numbers", "sumdo.life.weekdays"),
  hours: S("day", "request", "sumdo.life.hours"),
  slot: S("day", "request", "sumdo.life.slot"),
  move: S("day", "numbers", "sumdo.life.move"),
  workFrom: S("day", "request", "sumdo.life.workFrom"),
  workTo: S("day", "request", "sumdo.life.workTo"),
  travel: S("day", "eats", "sumdo.life.travel"),
  school: S("day", "numbers", "sumdo.life.school"),
  commute: S("day", "numbers", "sumdo.life.commute"),
  peWeek: S("week", "numbers", "sumdo.life.peWeek"),
  bed: S("day", "eats", "sumdo.life.bed"),
  wake: S("day", "eats", "sumdo.life.wake"),
  where: S("eat", "eats", "sumdo.life.where"),
  meals: S("eat", "request", "sumdo.life.meals"),
  window: S("eat", "request", "sumdo.life.window"),
  diet: S("diet", "eats", "sumdo.life.diet"),
  alcohol: S("alcohol", "eats", "sumdo.life.alcohol"),
  dietOther: S("words", "eats", "sumdo.life.dietOther"),
  slotTimes: S("eat", "request", "sumdo.life.slotTimes"),
};
export const PERSONAL_MAP: { [K in keyof Required<Personal>]: SettingLine } = {
  sex: S("body", "numbers", "sumdo.personal.sex"), birthYear: S("body", "numbers", "sumdo.personal.birthYear"),
  heightCm: S("body", "numbers", "sumdo.personal.heightCm"), weightKg: S("body", "numbers", "sumdo.personal.weightKg"),
  bodyFatPct: S("body", "numbers", "sumdo.personal.bodyFatPct"),
  pdUnit: I("How PD is shown: a display choice."),
  life: I("Older accounts' activity, before the Training week."), week: S("week", "numbers", "sumdo.personal.week"),
  easyMin: S("week", "numbers", "sumdo.personal.easyMin"), hardMin: S("week", "numbers", "sumdo.personal.hardMin"),
  steps: S("day", "numbers", "sumdo.personal.steps"),
  trainingAge: S("goal", "numbers", "sumdo.personal.trainingAge"),
  weighIns: S("body", "numbers", "sumdo.personal.weighIns"),
  kept: I("Findings kept on purpose: shown again when a number changes."),
  dayMode: S("week", "numbers", "sumdo.personal.dayMode"), ownDays: S("week", "numbers", "sumdo.personal.ownDays"),
  activity: I("Older accounts' activity answers."), dayKcal: I("Older accounts' day energy."),
  plan: S("week", "request", "sumdo.personal.plan"),
  lifestyle: I("The answers in Lifestyle: each is on the Lifestyle map."),
  dated: S("week", "request", "sumdo.personal.dated"),
  formula: S("goal", "numbers", "sumdo.personal.formula"),
  nextGoal: S("goal", "request", "sumdo.personal.nextGoal"),
  targets: I("Each day's own target, kept once the day has it."),
  measuredUse: S("goal", "numbers", "sumdo.personal.measuredUse"),
  timesOn: S("eat", "request", "sumdo.personal.timesOn"),
  kitchens: S("shop", "request", "sumdo.personal.kitchens"),
  carbsFat: S("goal", "eats", "sumdo.personal.carbsFat"),
  kitchenTaste: S("shop", "request", "sumdo.personal.kitchenTaste"),
  tasteChips: S("eat", "request", "sumdo.personal.tasteChips"),
  units: I("The units shown: a display choice."),
  equipment: S("shop", "request", "sumdo.personal.equipment"),
  coachShare: I("Which parts your coach sees: chosen on Your summary."),
  // DT176 (0.3.19, board Stories124)
  travel: S("day", "eats", "sumdo.personal.travel"),
  trips: S("day", null, "sumdo.personal.trips"),
  travelBack: I("Welcome back, once, after Travel mode."),
  // DT178 (0.3.21, board Stories126): a setting for Google, never for the coach or the chef
  calendar: I("Google Calendar: on or off, and the kinds that go in."),
};
export const SAFETY_MAP: { [K in keyof Required<Safety>]: SettingLine } = {
  consentBodyAt: S("body", null, "sumdo.safety.consentBodyAt"),
  consentBy: I("Older accounts: who agreed."),
  adultAt: S("health", null, "sumdo.safety.adultAt"),
  situations: S("health", "request", "sumdo.safety.situations"),
  flags: S("health", "request", "sumdo.safety.flags"),
  allergies: S("allergies", "request", "sumdo.safety.allergies"),
  declaredAt: S("health", null, "sumdo.safety.declaredAt"),
  none: S("health", "request", "sumdo.safety.none"),
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
// DT237 (0.3.88): every line of the summary in the language of the moment, so the coach's copy is made in English and in
// Srpski (inLang); a line whose Serbian is not ticked, or a value that has no Serbian yet, stays English as a whole.
const n0 = (x: number) => numText(x);
const dayV = (iso: string) => dateV(new Date(iso), { day: "numeric", month: "long" });
const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : w("sum.listAnd", { a: xs.slice(0, -1).join(", "), b: xs[xs.length - 1] }));
const chefOf = (l: SettingLine) => "chef" in l && l.chef !== null && l.chef !== "numbers";
const BED_WORDS: Record<string, WordKey> = { early: "sum.bed.early", mid: "sum.bed.mid", late: "sum.bed.late", varies: "sum.bed.varies" };
const WAKE_WORDS: Record<string, WordKey> = { early: "sum.wake.early", mid: "sum.wake.mid", late: "sum.wake.late", varies: "sum.wake.varies" };
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// a day of the usual week, Monday first: Mon · pon.
const dayShort = (i: number) => (getLang() !== "en" ? new Date(2026, 10, 2 + i).toLocaleDateString(locOf(getLang()), { weekday: "short" }) : DAYS[i]);
const placeOf = (r: string) => optWord(placeName(r as any)), kitchenOf = (k: string) => optWord(kitchenName(k as any));
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const decV = (x: number) => (getLang() !== "en" ? String(x).replace(".", ",") : String(x));

export function summaryOf(x: SummaryIn): SummaryPart[] {
  const p = x.personal, l = lifestyleOf(p), parts: SummaryPart[] = [];
  const row = (key: string, map: SettingLine, label: string, value: string, does?: string, chef?: boolean): SummaryRow | null =>
    "internal" in map ? null : { key, label, value, does: does ?? map.does, chef: chef ?? chefOf(map), share: map.share, ...(["body", "health", "allergies"].includes(map.share) ? { health: true } : {}) };
  const push = (id: SummaryPart["id"], title: string, from: string, rows: (SummaryRow | null)[]) => { const r = rows.filter(Boolean) as SummaryRow[]; if (r.length) parts.push({ id, title, from, rows: r }); };
  // You
  const age = p.birthYear ? (x.now ?? new Date()).getFullYear() - p.birthYear : null;
  const body = [p.sex === "male" ? w("sum.male") : p.sex === "female" ? w("sum.female") : p.sex ? cap(p.sex) : "", p.birthYear ? w("sum.born", { year: p.birthYear }) : "", p.heightCm ? `${p.heightCm} cm` : "", p.weightKg ? `${p.weightKg} kg` : "", p.bodyFatPct ? w("sum.bodyFat", { n: p.bodyFatPct }) : ""].filter(Boolean).join(", ");
  push("you", w("sum.you"), w("me.rowProfile"), [body ? row("body", PERSONAL_MAP.weightKg, w("sum.body"), body, x.burn ? w("sum.bodyDoesBurn", { kcal: n0(Math.round(x.burn / 10) * 10) }) : w("sum.bodyDoes"), false) : null,
    p.weighIns?.length ? row("weighIns", PERSONAL_MAP.weighIns, w("sum.weighIns"), w("sum.weighInsValue", { n: p.weighIns.length, date: dayV(p.weighIns[p.weighIns.length - 1].date + "T12:00:00") })) : null]);
  void age;
  // Goal and numbers
  const kc = x.days.map((d) => d.kcal).filter((v) => v > 0), cb = x.days.map((d) => d.carbs).filter((v) => v > 0);
  const split = splitOf(p, x.goal?.band ?? ""), low = lowCarbsOf(p, x.goal?.band ?? "");
  const goalValue = (g: NonNullable<SummaryIn["goal"]>) => (g.setBy === "you"
    ? (g.at ? w("sum.goalByYouOn", { goal: g.name, date: dayV(g.at) }) : w("sum.goalByYou", { goal: g.name }))
    : (g.at ? w("sum.goalByOn", { goal: g.name, who: g.setBy, date: dayV(g.at) }) : w("sum.goalBy", { goal: g.name, who: g.setBy })));
  push("goal", w("summary.goalAndNumbers"), w("me2.goal"), [
    x.goal ? { key: "goal", label: w("sum.goal"), value: goalValue(x.goal), does: w("sum.goalDoes"), chef: true, share: "goal" } : null,
    x.avg ? { key: "avg", label: w("sum.avg"), value: w("sum.avgValue", { kcal: n0(x.avg.kcal), protein: n0(x.avg.protein), fat: n0(x.avg.fats) }), does: [kc.length ? w("sum.kcalByDay", { lo: n0(Math.min(...kc)), hi: n0(Math.max(...kc)) }) : "", x.protein ? w("sum.proteinRange", { min: x.protein.min, max: x.protein.max, lo: decV(x.protein.lo), hi: decV(x.protein.hi) }) : ""].filter(Boolean).join(" "), chef: true, share: "goal" } : null,
    x.goal ? row("carbsFat", PERSONAL_MAP.carbsFat, w("sum.carbsFat"), low !== null ? w("sum.lowCarbs", { split: optWord(splitName(split)), g: low }) : optWord(splitName(split)), cb.length ? w("sum.carbsMove", { lo: n0(Math.min(...cb)), hi: n0(Math.max(...cb)) }) : undefined) : null,
    x.avg && x.avg.kcal > 0 ? { key: "pd", label: w("sum.pd"), value: w("sum.pdValue", { pd: dec(Math.round((1000 * x.avg.protein) / x.avg.kcal) / 10, 1) }), does: w("sum.pdDoes"), chef: true, share: "goal" } : null,
    p.trainingAge ? row("trainingAge", PERSONAL_MAP.trainingAge, w("sum.trainingFor"), optWord((TRAINING_AGES.find((t) => t.id === p.trainingAge)?.name ?? String(p.trainingAge)).replace("–", " to "))) : null,
  ]);
  // Your day
  const wk = weekdaysOf(l), work = workHoursOf(l), hours = HOURS.find((h) => h.id === l.hours)?.name.toLowerCase();
  const weekdays = [WEEKDAY_CHOICES.find((c) => c.id === wk)?.name, wk === "work" || wk === "both" ? hours : "", work ? w("sum.fromTo", { from: work.from, to: work.to }) : l.slot && l.slot !== "my" ? SLOTS.find((s) => s.id === l.slot)?.name : "", wk !== "home" ? MOVES.find((m) => m.id === (l.move ?? "sitting"))?.name.toLowerCase() : ""].filter(Boolean).join(", ");
  const slots = slotsOf(l), times = list(slots.map((s) => s.time)), from = startTimes(Math.min(5, Math.max(1, l.meals ?? 3)), l).from, sw = sleepWindow(l);
  push("day", w("summary.yourDay"), w("me2.lifestyle"), [
    row("weekdays", LIFESTYLE_MAP.weekdays, w("sum.weekdays"), weekdays || w("menu.notSetYet"), work ? w("sum.weekdaysWorkDoes") : undefined),
    // DT176 (0.3.19): Travel mode on, and the trips it kept
    p.travel ? row("travelNow", PERSONAL_MAP.travel, w("sum.travelMode"), w("sum.travelOn", { date: dayV(p.travel.since), place: placeOf(p.travel.place), kitchen: kitchenOf(p.travel.kitchen) })) : null,
    p.trips?.length ? row("trips", PERSONAL_MAP.trips, w("sum.trips"), p.trips.slice(-3).map((t) => w("sum.trip", { place: placeOf(t.place), from: dayV(t.from + "T12:00:00"), to: dayV(t.to + "T12:00:00") })).join(" · ")) : null,
    l.travel ? row("travel", LIFESTYLE_MAP.travel, w("sum.workTravel"), optWord(({ none: "None", sometimes: "Occasionally", often: "A lot" } as Record<string, string>)[l.travel] ?? l.travel)) : null,
    l.wake || l.bed ? row("sleep", LIFESTYLE_MAP.wake, w("sum.sleep"), `${cap(WAKE_WORDS[l.wake ?? ""] ? w(WAKE_WORDS[l.wake ?? ""]) : w("sum.wake.none"))} · ${BED_WORDS[l.bed ?? ""] ? w(BED_WORDS[l.bed ?? ""]) : w("sum.bed.none")}`, sw && from === "sleep" ? w("sum.mealsAt", { times }) : from === "work" ? w("sum.mealsAroundWork", { times }) : w("sum.sleepDoes")) : null,
    p.steps ? row("steps", PERSONAL_MAP.steps, w("sum.steps"), optWord(STEPS.find((s) => s.id === p.steps)?.name ?? String(p.steps))) : null,
  ]);
  // How you eat
  const own = Object.values(l.slotTimes ?? {}).length;
  const low1 = (t: string) => optWord(t).toLowerCase();
  const tc = p.tasteChips, taste = [tc?.like?.length ? w("sum.iLike", { what: tc.like.map(low1).join(", ") }) : "", tc?.not?.length ? w("sum.ratherNot", { what: tc.not.map(low1).join(", ") }) : "", tc?.how?.length ? tc.how.map(low1).join(", ") : ""].filter(Boolean).join(" · ");
  push("eat", w("summary.howYouEat"), w("me2.lifestyle"), [
    row("meals", LIFESTYLE_MAP.meals, w("sum.meals"), w("sum.mealsValue", { n: l.meals ?? 3, times }), own ? wn("sum.slotsOwn", own) : undefined),
    l.where?.length ? row("where", LIFESTYLE_MAP.where, w("sum.where"), l.where.map(optWord).join(" · ")) : null,
    row("diet", LIFESTYLE_MAP.diet, w("sum.diet"), optWord(l.diet ?? "Everything"), (l.diet ?? "Everything") === "Everything" ? w("sum.dietEverything") : undefined),
    l.diet === "Other" && l.dietOther?.trim() ? row("dietOther", LIFESTYLE_MAP.dietOther, w("sum.inYourWords"), l.dietOther.trim()) : null,
    l.alcohol ? row("alcohol", LIFESTYLE_MAP.alcohol, w("sum.alcohol"), optWord(l.alcohol), l.alcohol === "None" ? w("sum.alcoholNone") : undefined) : null,
    taste ? row("taste", PERSONAL_MAP.tasteChips, w("sum.taste"), cap(taste)) : null,
    x.tasteWords.trim() ? { key: "tasteWords", label: w("sum.tasteWords"), value: x.tasteWords.trim().slice(0, 200), does: w("sum.tasteWordsDoes"), chef: true, share: "words" } : null,
  ]);
  // Training week
  const plan = planOf(p);
  const intW = (id: string) => (getLang() !== "en" && ["easy", "moderate", "hard"].includes(id) ? w(`plan.intLow.${id}` as WordKey) : id);
  const kindOf = (d: any) => [KINDS.find((k) => k.id === d.kind)?.name ?? cap(String(d.kind ?? "")), d.intensity ? `(${intW(d.intensity)})` : ""].filter(Boolean).join(" ");
  const trainDays = plan ? plan.map((d: any, i: number) => (d.kind && d.kind !== "rest" ? `${kindOf(d)} ${dayShort(i)}` : "")).filter(Boolean) : [];
  push("week", w("summary.trainingWeek"), w("me.trainingWeek"), [plan ? row("plan", PERSONAL_MAP.plan, w("sum.usualWeek"), trainDays.length ? trainDays.join(" · ") : w("sum.noTrainingYet"), wn("sum.trainDays", trainDays.length, { m: 7 - trainDays.length })) : null]);
  // Where you shop and cook
  const tools = equipmentOf(p).map((id) => optWord(EQUIPMENT.find(([e]) => e === id)?.[1] ?? id));
  push("shop", w("summary.whereYouShopAndCook"), w("me.whereIShopAndCook"), [
    x.home ? { key: "places", label: w("sum.whereShop"), value: [x.home, ...x.places].map(optWord).join(" · "), does: w("sum.whereShopDoes"), chef: true, share: "shop" } : null,
    p.kitchens?.length ? row("kitchens", PERSONAL_MAP.kitchens, w("sum.kitchens"), p.kitchens.map(optWord).join(" · ")) : null,
    row("equipment", PERSONAL_MAP.equipment, w("sum.equipment"), tools.join(" · ")),
  ]);
  // Health questions
  const s = x.safety, sit = s.situations.map((id) => optWord(SITUATIONS.find((t) => t.id === id)?.label ?? id));
  push("health", w("summary.healthQuestions"), w("me.rowProfile"), [
    row("situations", SAFETY_MAP.situations, w("sum.situations"), s.declaredAt ? w("sum.answered", { what: sit.length ? list(sit) : s.none ? w("sum.noneOfThese") : w("sum.notAnswered"), date: dayV(s.declaredAt) }) : w("sum.notAnsweredYet"), s.declaredAt ? (sit.length ? w("sumdo.safety.situations") : w("sum.helpsWithAll")) : w("sum.askedBeforeChat")),
    row("allergies", SAFETY_MAP.allergies, w("sum.allergies"), s.allergies.length ? s.allergies.join(", ") : optWord("None")),
  ]);
  return parts;
}

// ---- what a coach reads: only the rows of the parts shared, never a private part's row or that it changed
// DT237 (0.3.88, board Stories178 v2; Coach Milan 4 November 19:15 Go): the copy is made in English and in Srpski; the coach's
// app shows the coach's own language, and the client's with a button. What changed is read from the English rows, so a
// switch of language changes no row: it is one line, the language the client switched to.
// DT238 (0.3.92): rowsDe, textDe: the same copy in Deutsch, for a coach whose app is in Deutsch
export type SharedProfile = { rows: SummaryRow[]; rowsSr?: SummaryRow[]; rowsDe?: SummaryRow[]; lang?: Lang; parts: ShareId[]; changes: ProfileChange[]; updatedAt: string };
export type ProfileChange = { at: string; text: string; textSr?: string; textDe?: string; share: ShareId | "share"; lang?: Lang };
export const CHANGES_KEPT = 60;
export function sharedRows(parts: SummaryPart[], shared: ShareId[]): SummaryRow[] {
  return parts.flatMap((p) => p.rows).filter((r) => shared.includes(r.share));
}
const partName = (l: Lang, id: ShareId) => inLang(l, () => SHARE_PARTS.find((p) => p.id === id)!.name);
// the next copy for the coach: the shared rows now, with what changed against the last copy, dated
export function nextShared(prev: SharedProfile | null, rows: SummaryRow[], shared: ShareId[], now = new Date(), more: { rowsSr?: SummaryRow[]; rowsDe?: SummaryRow[]; lang?: Lang } = {}): SharedProfile | null {
  const at = now.toISOString(), changes: ProfileChange[] = [];
  const before = new Map((prev?.rows ?? []).map((r) => [r.key, r]));
  const beforeSr = new Map((prev?.rowsSr ?? prev?.rows ?? []).map((r) => [r.key, r]));
  const sr = new Map((more.rowsSr ?? rows).map((r) => [r.key, r]));
  const beforeDe = new Map((prev?.rowsDe ?? prev?.rows ?? []).map((r) => [r.key, r]));
  const de = new Map((more.rowsDe ?? rows).map((r) => [r.key, r]));
  const stopped = (prev?.parts ?? []).filter((id) => !shared.includes(id));
  if (prev) {
    for (const r of rows) {
      const b = before.get(r.key), s = sr.get(r.key) ?? r, bs = beforeSr.get(r.key) ?? b, g = de.get(r.key) ?? r, bg = beforeDe.get(r.key) ?? b;
      if (!b) { if ((prev.parts ?? []).includes(r.share)) changes.push({ at, text: `${r.label}: ${r.value}.`, textSr: `${s.label}: ${s.value}.`, ...(more.rowsDe ? { textDe: `${g.label}: ${g.value}.` } : {}), share: r.share }); }
      else if (b.value !== r.value) changes.push({ at, text: `${r.label}: ${b.value} → ${r.value}.`, textSr: `${s.label}: ${bs!.value} → ${s.value}.`, ...(more.rowsDe ? { textDe: `${g.label}: ${bg!.value} → ${g.value}.` } : {}), share: r.share });
    }
    for (const id of shared.filter((x) => !(prev.parts ?? []).includes(x))) changes.push({ at, text: inLang("en", () => w("summary.startedSharing", { part: partName("en", id) })), textSr: inLang("sr-Latn", () => w("summary.startedSharing", { part: partName("sr-Latn", id) })), ...(more.rowsDe ? { textDe: inLang("de", () => w("summary.startedSharing", { part: partName("de", id) })) } : {}), share: "share" });
    for (const id of stopped) changes.push({ at, text: inLang("en", () => w("summary.stoppedSharing", { part: partName("en", id) })), textSr: inLang("sr-Latn", () => w("summary.stoppedSharing", { part: partName("sr-Latn", id) })), ...(more.rowsDe ? { textDe: inLang("de", () => w("summary.stoppedSharing", { part: partName("de", id) })) } : {}), share: "share" });
    if (more.lang && more.lang !== (prev.lang ?? "en")) changes.push({ at, text: "", share: "share", lang: more.lang });
  }
  const same = prev && !changes.length && prev.rows.length === rows.length && rows.every((r) => before.get(r.key)?.value === r.value && before.get(r.key)?.does === r.does)
    && JSON.stringify(prev.rowsSr ?? null) === JSON.stringify(more.rowsSr ?? null) && JSON.stringify(prev.rowsDe ?? null) === JSON.stringify(more.rowsDe ?? null) && (prev.lang ?? "en") === (more.lang ?? prev.lang ?? "en");
  if (same) return null;
  // a part switched off takes its past changes with it
  const kept = (prev?.changes ?? []).filter((c) => c.share === "share" || shared.includes(c.share as ShareId));
  return { rows, ...(more.rowsSr ? { rowsSr: more.rowsSr } : {}), ...(more.rowsDe ? { rowsDe: more.rowsDe } : {}), ...(more.lang ? { lang: more.lang } : prev?.lang ? { lang: prev.lang } : {}), parts: shared, changes: [...kept, ...changes].slice(-CHANGES_KEPT), updatedAt: at };
}
export const changesSince = (sp: SharedProfile | null | undefined, seen: string | null): ProfileChange[] => (sp?.changes ?? []).filter((c) => !seen || c.at > seen);
