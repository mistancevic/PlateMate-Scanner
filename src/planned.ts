// What is in the slots (0.2.2, canvas S "Plan purpose one" and H7): a meal per slot per date, with its numbers, so the day
// adds up before anything is cooked. A meal comes from My recipes, Coach's recipes, Chef Mealan's starters, or the Plate.
import { aggregate, density, servingsOf, type Ingredient, type Meal } from "./pilot";
import type { Slot } from "./slots";

export type Source = "mine" | "coach" | "starter" | "plate";
export type PlannedMeal = { title: string; kcal: number; protein: number; source: Source; mealId?: string; items?: Ingredient[]; portion?: number; servings?: number;
  // 0.2.6 (canvas board CW, CW7): skipped on purpose; the meal counts as closed for a day lived by the plan
  skipped?: boolean;
  // SL6 (0.2.64): how a meal changed for this day only came to be (at the shop, with Chef Mealan); shown when it is opened
  note?: string };
export type Planned = Record<string, Record<string, PlannedMeal>>; // by date (ymd), then by slot id

const KEY = "chefmealan-planned";
export const getPlanned = (): Planned => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } };
export const storePlanned = (p: Planned) => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {} };
// R21 (0.2.49, board RS20): a recipe planned before 0.2.49 kept the numbers of the portion saved in grams (649 kcal for a
// fritter the recipe counts at 650); read again, it counts one of what the recipe makes, as every screen now does
export function refreshPlanned(p: Planned, meals: Meal[]): Planned {
  const byId = new Map(meals.map((m) => [m.id, m]));
  let changed = false;
  const next: Planned = {};
  for (const [date, day] of Object.entries(p)) {
    next[date] = {};
    for (const [slot, m] of Object.entries(day)) {
      const r = m.mealId && !m.servings ? byId.get(m.mealId) : undefined;
      if (r && servingsOf(r) > 1) { const f = fromMeal(r, m.source); next[date][slot] = { ...m, kcal: f.kcal, protein: f.protein, servings: f.servings }; changed = true; }
      else next[date][slot] = m;
    }
  }
  return changed ? next : p;
}
// put a meal in a slot, or empty it with null; a date with nothing left disappears
export function withPlanned(p: Planned, date: string, slotId: string, meal: PlannedMeal | null): Planned {
  const day = { ...(p[date] ?? {}) };
  if (meal) day[slotId] = meal; else delete day[slotId];
  const next = { ...p };
  if (Object.keys(day).length) next[date] = day; else delete next[date];
  return next;
}

// R16 (0.2.44, board RS15): I ate it on Today logs the planned meal as it is in the plan: one portion of the recipe, its
// foods scaled as the plan counts them (fromMeal). A meal without foods (a starter) has nothing to log; the Plate makes it.
export function plannedPortion(m: PlannedMeal, id: string, savedAt: string): Meal | null {
  if (!m.items?.length) return null;
  const weight = m.items.reduce((n, i) => n + (i.grams > 0 ? i.grams : 0), 0);
  const ratio = m.servings && m.servings > 1 ? 1 / m.servings : m.portion && weight > 0 ? Math.min(1, m.portion / weight) : 1;
  const items = m.items.map((i) => ({ ...i, grams: i.grams * ratio }));
  // the portion is the foods' own weight, never rounded past it: a stored meal heavier than its foods is not read back
  return { id, title: m.title, items, portion: items.reduce((n, i) => n + i.grams, 0), savedAt };
}

// a recipe as a planned meal: its numbers at the portion saved
// R21 (0.2.49): a recipe that makes several counts one of them, the recipe divided by what it makes, as the Plate does
export function fromMeal(m: Meal, source: Source): PlannedMeal {
  const t = aggregate(m.items);
  const n = servingsOf(m);
  const ratio = n > 1 ? 1 / n : m.portion && t.weight > 0 ? Math.min(1, m.portion / t.weight) : 1;
  return { title: m.title, kcal: Math.round((t.calories ?? 0) * ratio), protein: Math.round((t.protein ?? 0) * ratio), source, mealId: m.id, items: m.items, portion: m.portion, ...(n > 1 ? { servings: n } : {}) };
}

// Chef Mealan's starters: a few meals so a plan can start before any recipe exists. Removable later; seeded per market later.
export const STARTERS: PlannedMeal[] = [
  { title: "Skyr bowl with berries", kcal: 420, protein: 46, source: "starter" },
  { title: "Oats, skyr and banana", kcal: 520, protein: 38, source: "starter" },
  { title: "Omelette with bread", kcal: 450, protein: 34, source: "starter" },
  { title: "Chicken, rice and greens", kcal: 640, protein: 52, source: "starter" },
  { title: "Tuna salad wrap", kcal: 480, protein: 36, source: "starter" },
  { title: "Protein pancakes", kcal: 520, protein: 44, source: "starter" },
  { title: "Sarma", kcal: 410, protein: 21, source: "starter" },
  { title: "Cottage cheese and fruit", kcal: 260, protein: 28, source: "starter" },
];

// what a slot needs: the day's numbers shared out by slot, a snack half of a meal
export const weightOf = (s: Slot) => (/snack/i.test(s.name) ? 0.5 : 1);
export function needOf(slots: Slot[], slot: Slot, day: { kcal: number; protein: number } | null): { kcal: number; protein: number } | null {
  if (!day) return null;
  const total = slots.reduce((n, s) => n + weightOf(s), 0) || 1;
  const share = weightOf(slot) / total;
  return { kcal: Math.round(day.kcal * share), protein: Math.round(day.protein * share) };
}

// the mark next to a meal: fits when its PD reaches the day's target, within a point; else how far under
export type Fit = { pd: number | null; state: "fits" | "under" | "none"; gap: number | null; text: string };
export function fitOf(meal: { kcal: number; protein: number }, target: number | null, unit: "pd" | "pct" = "pd"): Fit {
  const pd = density(meal.protein, meal.kcal);
  if (pd === null || target === null) return { pd, state: "none", gap: null, text: "" };
  const gap = target - pd;
  if (gap <= 1) return { pd, state: "fits", gap: 0, text: "fits" };
  const g = unit === "pct" ? `${Math.round(gap * 4)} %` : gap.toFixed(1);
  return { pd, state: "under", gap, text: `${g} under` };
}

// the day as planned: what the slots hold, added up
export function sumOf(day: Record<string, PlannedMeal> | undefined): { kcal: number; protein: number; pd: number | null; n: number } {
  const meals = Object.values(day ?? {});
  const kcal = meals.reduce((n, m) => n + m.kcal, 0), protein = meals.reduce((n, m) => n + m.protein, 0);
  return { kcal, protein, pd: density(protein, kcal), n: meals.length };
}

// Fill a day (0.2.4, canvas S "Chef Mealan, about this screen", H5 and H6): the open slots filled from My recipes and the
// starters, each with the meal that fits the slot best. The same way of picking as the tip: closest to the day's PD target
// first, then closest to the slot's share of the day. No AI call; the chat only wraps it in words. A meal is used once a day.
export type FillRow = { slot: Slot; meal: PlannedMeal; alternatives: PlannedMeal[]; why?: string };
// R20 (0.2.48, board RS19, R20e): how a meal carries you. Among meals that fit about as well, a light one comes first and a
// heavy one second; one sentence says so when it changed the pick. A heavy meal is never left out.
export type FillRead = (m: PlannedMeal) => { read: "light" | "heavy" | null; heavy: number } | null | undefined;
export const CARRY_NUDGE = { light: -0.1, heavy: 0.25 };
export function fillDay(slots: Slot[], held: Record<string, PlannedMeal> | undefined, choices: PlannedMeal[], day: { kcal: number; protein: number } | null, target: number | null, read?: FillRead): FillRow[] {
  const open = slots.filter((s) => !held?.[s.id]);
  const used = new Set(Object.values(held ?? {}).map((m) => m.title));
  const rows: FillRow[] = [];
  for (const slot of open) {
    const need = needOf(slots, slot, day);
    const score = (m: PlannedMeal) => {
      const pd = density(m.protein, m.kcal) ?? 0;
      const pdGap = target === null ? 0 : Math.max(0, target - pd) * 2 + Math.max(0, pd - target - 3) * 0.5;
      const kcalGap = need ? Math.abs(m.kcal - need.kcal) / need.kcal : 0;
      return pdGap + kcalGap;
    };
    const nudge = (m: PlannedMeal) => { const r = read?.(m)?.read; return r ? CARRY_NUDGE[r] : 0; };
    const free = choices.filter((m) => !used.has(m.title));
    const plain = [...free].sort((a, b) => score(a) - score(b));
    let ranked = [...free].sort((a, b) => score(a) + nudge(a) - (score(b) + nudge(b)));
    if (!ranked.length) continue;
    let why: string | undefined;
    if (ranked[0] !== plain[0]) {
      const passed = plain[0], r = read?.(passed);
      if (r?.read === "heavy") {
        why = `${passed.title} fits ${slot.name.toLowerCase()} as well, though it left you heavy, tired ${r.heavy === 1 ? "once" : r.heavy === 2 ? "twice" : `${r.heavy} times`}, so it comes second: Change brings it.`;
        ranked = [ranked[0], passed, ...ranked.slice(1).filter((m) => m !== passed)];
      } else if (read?.(ranked[0])?.read === "light") why = `${ranked[0].title} keeps you light, so it comes first for ${slot.name.toLowerCase()}.`;
    }
    used.add(ranked[0].title);
    rows.push({ slot, meal: ranked[0], alternatives: ranked.slice(1, 4), ...(why ? { why } : {}) });
  }
  return rows;
}
