// What the plate is for, first (0.2.27, canvas boards PF, PF2, PF3; Milan 17 October 2026, 21:22 to 23:11). The line under the
// Plate's title says it. It starts as Exploring: nothing is sized for a meal until a meal is picked. A meal of today's plan sizes
// the plate to that meal; Meal prep makes portions for later meals, each the plan's usual size for that meal, no dates; Plan it
// puts a recipe on a day and a meal in the Plan. It can change at any time: a look can turn into dinner.
import type { Slot } from "./slots";
import { toMin } from "./slots";

export type Purpose =
  | { kind: "exploring" }
  | { kind: "meal"; slotId: string }
  | { kind: "snack" }
  | { kind: "prep"; slotId: string; n: number; toPlan: boolean }
  | { kind: "plan" };
export const EXPLORING: Purpose = { kind: "exploring" };
export const PREP_MIN = 2, PREP_MAX = 8;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const plural = (w: string) => (/(ch|sh|s|x)$/i.test(w) ? `${w}es` : `${w}s`);
// the off-plan snack is offered only when the plan has no snack of its own
export const hasSnackSlot = (slots: Slot[]) => slots.some((s) => /snack/i.test(s.name));

// the chips, in this order: Exploring, the day's meals, a snack off the plan, Meal prep, Plan it
export type Choice = { key: string; label: string };
export function choicesOf(slots: Slot[]): Choice[] {
  return [
    { key: "exploring", label: "Exploring" },
    ...slots.map((s) => ({ key: `meal:${s.id}`, label: cap(s.name) })),
    ...(hasSnackSlot(slots) ? [] : [{ key: "snack", label: "Snack" }]),
    { key: "prep", label: "Meal prep" },
    { key: "plan", label: "Plan it" },
  ];
}
export const keyOf = (p: Purpose) => (p.kind === "meal" ? `meal:${p.slotId}` : p.kind);
// a tap on a chip: a meal keeps its slot; Meal prep starts from the meal the person had picked, or the next one, four portions
export function fromKey(key: string, current: Purpose, next: Slot | null, slots: Slot[]): Purpose {
  if (key.startsWith("meal:")) return { kind: "meal", slotId: key.slice(5) };
  if (key === "prep") {
    if (current.kind === "prep") return current;
    const from = current.kind === "meal" ? current.slotId : (next ?? slots.find((s) => /lunch/i.test(s.name)) ?? slots[0])?.id;
    return { kind: "prep", slotId: from ?? "lunch", n: 4, toPlan: true };
  }
  return key === "snack" ? { kind: "snack" } : key === "plan" ? { kind: "plan" } : EXPLORING;
}

// the meal picked first for a recipe made now: the next meal of the day by the time, never one whose time has passed
// (0.2.26 went back to breakfast at 20:06, the one meal not logged). After the last meal: none, so a snack off the plan.
export function nextMeal(slots: Slot[], closed: Set<string>, now: Date): Slot | null {
  const m = now.getHours() * 60 + now.getMinutes();
  return slots.find((s) => !closed.has(s.id) && toMin(s.time) + 90 >= m) ?? null;
}
export const nextPurpose = (slots: Slot[], closed: Set<string>, now: Date): Purpose => {
  const s = nextMeal(slots, closed, now);
  return s ? { kind: "meal", slotId: s.id } : hasSnackSlot(slots) ? EXPLORING : { kind: "snack" };
};

export type Nums = { kcal: number; protein: number };
const numsLine = (n: Nums, pd: string) => `${n.kcal.toLocaleString("en-US")} kcal · ${n.protein} g protein · ${pd}`;
// the line under the title (A1, A3, M1b); pd is the target as the app writes it ("PD 6.4")
export function lineOf(p: Purpose, slots: Slot[], share: Nums | null, pd: string): string {
  const slot = p.kind === "meal" || p.kind === "prep" ? slots.find((s) => s.id === p.slotId) : undefined;
  if (p.kind === "meal") return slot ? `${cap(slot.name)}, ${slot.time}${share ? ` · ${numsLine(share, pd)}` : ""}` : "A meal";
  if (p.kind === "prep") return `Meal prep · ${p.n} ${plural((slot?.name ?? "meal").toLowerCase())}${share ? ` · ${numsLine(share, pd)} each` : ""}`;
  if (p.kind === "snack") return "Snack · off the plan";
  if (p.kind === "plan") return "Plan it · a day and a meal in your Plan";
  return "Exploring · not sized for a meal";
}
// the line under the chips: what the picked one means
export function hintOf(p: Purpose, slots: Slot[], share: Nums | null, pd: string): string {
  const slot = p.kind === "meal" || p.kind === "prep" ? slots.find((s) => s.id === p.slotId) : undefined;
  if (p.kind === "meal") return `${slot ? `${cap(slot.name)}, ${slot.time}` : "This meal"}: ${share ? `${numsLine(share, pd)}, from your plan for today.` : "your plan has no numbers for it yet."}`;
  if (p.kind === "prep") return "Meal prep: portions for later meals.";
  if (p.kind === "snack") return "Snack: off the plan, not sized for a meal.";
  if (p.kind === "plan") return "Plan it: a day and a meal in your Plan, once the recipe is read.";
  return "Exploring: nothing is sized for a meal. Pick a meal to see what your plan has for it.";
}
// the title over the plate when it is empty
export function titleOf(p: Purpose, slots: Slot[], chef: string): { title: string; sub: string } {
  if (p.kind === "meal") { const s = slots.find((x) => x.id === p.slotId); return { title: `What are you craving for ${(s?.name ?? "your meal").toLowerCase()}?`, sub: `Add your foods. ${chef} sets the amounts.` }; }
  if (p.kind === "prep") return { title: "What are you prepping?", sub: `${chef} sizes the batch.` };
  if (p.kind === "snack") return { title: "What are you craving?", sub: `Add your foods. ${chef} sets the amounts.` };
  // one line under the title, as every plate has (0.2.16): the line below says Exploring
  return { title: "Add a recipe or foods", sub: "Say what it is for when you know." };
}

// Meal prep (PF3): the dates of the next open slots for that meal, from tomorrow, one portion each
export function prepDates(n: number, slotId: string, from: Date, has: (date: string) => { slot: boolean; taken: boolean }, ymd: (d: Date) => string, days = 21): string[] {
  const out: string[] = [];
  for (let k = 1; k <= days && out.length < n; k++) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + k, 12);
    const h = has(ymd(d));
    if (h.slot && !h.taken) out.push(ymd(d));
  }
  return out;
}
// "Mon 19, Tue 20 and Wed 21"
export function datesWord(dates: string[]): string {
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const w = dates.map((s) => { const d = new Date(`${s}T12:00:00`); return `${DAYS[d.getDay()]} ${d.getDate()}`; });
  return w.length <= 1 ? w.join("") : `${w.slice(0, -1).join(", ")} and ${w[w.length - 1]}`;
}
