// The chat in three kinds (0.2.8, canvas board CH, CH6; Milan 15 October 2026: "Chef Mealan is horrible"). Each message is
// sorted before anything is asked of the AI:
//   1. a question the app can answer from its own data (the plate, the day's plan, what is left): answered here, no AI;
//   2. a change to the plan (move a meal around training, swap a meal): the app proposes, the person confirms;
//   3. anything else: ideas, from Chef Mealan.
// Pure code: the words of kinds 1 and 2 come from the numbers, so they are never wrong.
import type { Slot } from "./slots";
import { toMin, toTime } from "./slots";

export type Intent =
  | { kind: "plate" }
  | { kind: "day"; ask: "plan" | "left" }
  | { kind: "move"; slotId: string; to: "after" | "before" | string }
  | { kind: "swap"; slotId: string; want: string }
  | { kind: "ideas" };

const SLOT_WORD = /\b(breakfast|lunch|dinner|supper|snack|brunch)\b/i;
// the slot a word names: by its name; supper is dinner, brunch the first meal; a snack is the first snack
export function slotOfWord(word: string, slots: Slot[]): Slot | null {
  const w = word.toLowerCase(), want = w === "supper" ? "dinner" : w === "brunch" ? slots[0]?.name.toLowerCase() : w;
  return slots.find((s) => s.name.toLowerCase() === want) ?? null;
}

export function intentOf(raw: string, slots: Slot[]): Intent {
  const m = raw.trim().replace(/\s+/g, " ").replace(/[?!.]+$/, "");
  const slotIn = () => { const w = m.match(SLOT_WORD); return w ? slotOfWord(w[1], slots) : null; };
  // 2. a change to the plan: move a meal around training, or to a time; swap a meal
  const mv = m.match(/\bmove\b/i);
  if (mv) {
    const s = slotIn();
    const when = m.match(/\b(after|before)\b.*\b(training|workout|gym|session|practice|run)\b/i);
    const at = m.match(/\b(?:to|at)\s+([01]?\d|2[0-3])[:.]([0-5]\d)\b/);
    if (s && when) return { kind: "move", slotId: s.id, to: when[1].toLowerCase() as "after" | "before" };
    if (s && at) return { kind: "move", slotId: s.id, to: `${at[1].padStart(2, "0")}:${at[2]}` };
  }
  if (/\b(swap|change|replace)\b/i.test(m)) {
    const s = slotIn();
    if (s) return { kind: "swap", slotId: s.id, want: m };
  }
  // 1. what the app knows: the plate, the day's plan, what is left
  if (/\bplate\b/i.test(m) && /^(what|what's|whats|show|list|tell me)\b/i.test(m) && !/\b(add|goes|go with|better|improve|instead|swap|missing|need)\b/i.test(m)) return { kind: "plate" };
  if (/\b(left|remaining|to go)\b/i.test(m) && !/\bleftover/i.test(m)) return { kind: "day", ask: "left" };
  if (/\bhow much (protein|kcal|calories|energy)\b/i.test(m)) return { kind: "day", ask: "left" };
  if (/^(what|what's|whats)\b.*\b(planned|on the plan|my plan|for (breakfast|lunch|dinner|today|tonight)|today's meals|do i (eat|have))\b/i.test(m)) return { kind: "day", ask: "plan" };
  return { kind: "ideas" };
}

// a lighter, heavier or more protein swap: what the person asked for, in a word the app can check
export type Want = "lighter" | "heavier" | "protein" | "other";
export function wantOf(text: string): Want {
  if (/\b(light|lighter|smaller|less|fewer calories|low(er)? (cal|kcal))\b/i.test(text)) return "lighter";
  if (/\b(bigger|heavier|more filling|more food|larger|hungr)/i.test(text)) return "heavier";
  if (/\b(more protein|higher protein|protein)\b/i.test(text)) return "protein";
  return "other";
}

const n0 = (x: number) => Math.round(x).toLocaleString("en");
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const join = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

// 1. the plate: the foods with their grams, then the numbers against the target
export function plateAnswer(items: { name: string; grams: number }[], t: { kcal: number; protein: number; pd: string | null }, target: string | null): string {
  if (!items.length) return "Your plate is empty. Add a food on Plate, or ask me for an idea.";
  const foods = items.map((i, k) => `${k === 0 ? i.name : lower(i.name)}, ${n0(i.grams)} g`);
  return `${join(foods)}. ${n0(t.kcal)} kcal and ${n0(t.protein)} g protein${t.pd ? `: ${t.pd}` : ""}${target ? `, against your ${target}` : ""}.`;
}

// 1. the day's plan: each slot with its meal, eaten or skipped, and the sum against the day
export type DaySlot = { name: string; time: string; meal: string | null; kcal: number | null; state: "eaten" | "skipped" | "planned" | "empty" };
export function planAnswer(rows: DaySlot[], day: { kcal: number; protein: number } | null, sum: { kcal: number; protein: number }): string {
  if (!rows.some((r) => r.meal)) return `Nothing is planned for today yet.${day ? ` The day is ${n0(day.kcal)} kcal and ${n0(day.protein)} g protein.` : ""} Plan fills it, or ask me to.`;
  const parts = rows.map((r) => `${lower(r.name)} at ${r.time}, ${r.meal ? `${lower(r.meal)}${r.state === "eaten" ? " (eaten)" : r.state === "skipped" ? " (skipped)" : ""}` : "nothing yet"}`);
  return `Today: ${parts.join("; ")}. ${n0(sum.kcal)} kcal and ${n0(sum.protein)} g protein planned${day ? ` of ${n0(day.kcal)} and ${n0(day.protein)}` : ""}.`;
}

// 1. what is left of the day: the day's numbers less what was eaten
export function leftAnswer(day: { kcal: number; protein: number } | null, eaten: { kcal: number; protein: number }): string {
  if (!day) return "Your day has no numbers yet. Set a goal, and I can tell you what is left.";
  const k = day.kcal - eaten.kcal, p = day.protein - eaten.protein;
  const lead = eaten.kcal > 0 ? `You have eaten ${n0(eaten.kcal)} kcal and ${n0(eaten.protein)} g protein today.` : "Nothing eaten yet today.";
  const left = k >= 0 ? `Left: ${n0(k)} kcal and ${n0(Math.max(0, p))} g protein.` : `That is ${n0(-k)} kcal over the day's ${n0(day.kcal)}${p > 0 ? `, with ${n0(p)} g protein still to go` : ""}.`;
  return `${lead} ${left}`;
}

// 2. moving a meal around the day's training: 30 minutes after it ends, or 90 minutes before it starts, to the next 5
export type Move = { ok: true; from: string; to: string; text: string } | { ok: false; text: string };
export function moveOf(slot: Slot, to: "after" | "before" | string, training: { start: string; minutes: number; what: string } | null, others: Slot[]): Move {
  const name = slot.name, low = lower(slot.name);
  let at: string;
  if (to === "after" || to === "before") {
    if (!training) return { ok: false, text: `There is no training with a time today, so ${low} stays at ${slot.time}. Set a time for the training on Plan, and I can place ${low} around it.` };
    const s = toMin(training.start), e = s + training.minutes;
    const span = `${training.start} to ${toTime(e)}`;
    if (to === "after") {
      if (toMin(slot.time) >= e + 30) return { ok: false, text: `${name} at ${slot.time} is already after your ${training.what}, ${span}.` };
      at = toTime(Math.ceil((e + 30) / 5) * 5);
    } else {
      if (toMin(slot.time) <= s - 60) return { ok: false, text: `${name} at ${slot.time} is already before your ${training.what}, ${span}.` };
      at = toTime(Math.floor((s - 90) / 5) * 5);
    }
    const clash = others.find((o) => o.id !== slot.id && Math.abs(toMin(o.time) - toMin(at)) < 60);
    return { ok: true, from: slot.time, to: at, text: `Your ${training.what} is ${span}. ${name} moves from ${slot.time} to ${at}${clash ? `, close to ${lower(clash.name)} at ${clash.time}` : ""}. The meal stays the same.` };
  }
  at = to;
  if (at === slot.time) return { ok: false, text: `${name} is at ${slot.time} already.` };
  return { ok: true, from: slot.time, to: at, text: `${name} moves from ${slot.time} to ${at} today. The meal stays the same.` };
}

// 2. a swap: Chef Mealan picks, the app checks. An option must be a real meal with numbers, fit the day's target (PD within a
// point, as Plan marks it) and do what was asked: lighter is at least 15 % less energy, heavier 15 % more, protein a higher PD.
export type SwapMeal = { title: string; kcal: number; protein: number };
const pdOf = (m: SwapMeal) => (m.kcal > 0 ? (100 * m.protein) / m.kcal : 0);
export function swapOk(o: SwapMeal, now: SwapMeal | null, want: Want, targetPd: number | null): string | null {
  if (!o.title.trim() || !(o.kcal >= 80) || !(o.protein >= 0)) return "not a meal with numbers";
  if (now && o.title.trim().toLowerCase() === now.title.trim().toLowerCase()) return "the same meal";
  if (targetPd !== null && pdOf(o) < targetPd - 1) return `PD ${pdOf(o).toFixed(1)} is under the target ${targetPd.toFixed(1)}`;
  if (now && want === "lighter" && o.kcal > now.kcal * 0.85) return `${Math.round(o.kcal)} kcal is not lighter than ${Math.round(now.kcal)}`;
  if (now && want === "heavier" && o.kcal < now.kcal * 1.15) return `${Math.round(o.kcal)} kcal is not more than ${Math.round(now.kcal)}`;
  if (now && want === "protein" && pdOf(o) <= pdOf(now)) return "no more protein than now";
  return null;
}
// the app's own picks, when Chef Mealan cannot answer or its ideas fail the checks: the meals that pass, the best first
export function swapFallback<T extends SwapMeal>(candidates: T[], now: SwapMeal | null, want: Want, targetPd: number | null, n = 2): T[] {
  const ok = candidates.filter((c) => swapOk(c, now, want, targetPd) === null);
  // lighter aims at about 70 % of the meal now, bigger at about 140 %: still a meal for that time, not a snack or a feast
  const key = (c: T) => (want === "lighter" && now ? Math.abs(c.kcal - now.kcal * 0.7) : want === "heavier" && now ? Math.abs(c.kcal - now.kcal * 1.4) : -pdOf(c));
  return ok.sort((a, b) => key(a) - key(b)).slice(0, n);
}
// the line above the options: what the slot holds now, and what comes
export function swapLead(slotName: string, now: SwapMeal | null, want: Want, n: number): string {
  const low = lower(slotName), what = want === "lighter" ? "lighter" : want === "heavier" ? "bigger" : want === "protein" ? "higher protein" : "other";
  const head = now ? `Your ${low} is ${lower(now.title)}, ${n0(now.kcal)} kcal.` : `Nothing is planned for ${low} yet.`;
  if (!n) return `${head} I found no ${what} ${low} that fits your target. Try another word, or Plan has all your recipes.`;
  const many = /(ch|sh|s|x)$/.test(low) ? `${low}es` : `${low}s`;
  return `${head} ${n === 1 ? "One" : "Two"} ${what} ${n === 1 ? low : many} that keep${n === 1 ? "s" : ""} your protein:`;
}
