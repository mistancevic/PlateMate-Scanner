// What is in the slots (0.2.2, canvas S "Plan purpose one" and H7): a meal per slot per date, with its numbers, so the day
// adds up before anything is cooked. A meal comes from My recipes, Coach's recipes, Chef Mealan's starters, or the Plate.
import { aggregate, density, servingsOf, type Ingredient, type Meal } from "./pilot";
import type { Slot } from "./slots";
import { REFERENCE, referenceFood } from "./reference";
import { kindOf } from "./counted";

export type Source = "mine" | "coach" | "starter" | "plate";
export type PlannedMeal = { title: string; kcal: number; protein: number; source: Source; mealId?: string; items?: Ingredient[]; portion?: number; servings?: number;
  // 0.2.6 (canvas board CW, CW7): skipped on purpose; the meal counts as closed for a day lived by the plan
  skipped?: boolean;
  // SL6 (0.2.64): how a meal changed for this day only came to be (from a shopping list, picked from Chef Mealan's ideas); shown when it is opened
  note?: string;
  // DT74 (0.2.74): how much of the meal, when the day's portions were fitted (1.3 is a third more); kcal and protein are counted at it
  amount?: number };
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
      if (r && servingsOf(r) > 1) { const f = fromMeal(r, m.source); const a = m.amount ?? 1; next[date][slot] = { ...m, kcal: Math.round(f.kcal * a), protein: Math.round(f.protein * a), servings: f.servings }; changed = true; }
      else if (!m.mealId && m.items?.length && twice(m.items)) { next[date][slot] = withoutTwice(m); changed = true; }
      // DT76: a starter planned before 0.2.76 had no foods; it takes them, its numbers from the foods, at its amount
      else if (m.source === "starter" && !m.items?.length && STARTERS.some((x) => x.title === m.title)) {
        const st = STARTERS.find((x) => x.title === m.title)!, a = m.amount ?? 1;
        next[date][slot] = { ...m, items: st.items, portion: st.portion, kcal: Math.round(st.kcal * a), protein: Math.round(st.protein * a) }; changed = true;
      }
      else next[date][slot] = m;
    }
  }
  return changed ? next : p;
}
// 0.2.65 (Milan 20:46): before 0.2.64, a second Use this on a meal already changed added Chef Mealan's food again (spelt
// flakes twice). A meal changed for one day that holds the same estimated food twice, same grams and part, keeps it once.
const sameItem = (a: Ingredient, b: Ingredient) => a.food.source === "estimate" && b.food.source === "estimate" && a.food.name.toLowerCase() === b.food.name.toLowerCase() && Math.round(a.grams) === Math.round(b.grams) && (a.part ?? "") === (b.part ?? "");
const twice = (items: Ingredient[]) => items.some((x, i) => items.slice(0, i).some((y) => sameItem(x, y)));
function withoutTwice(m: PlannedMeal): PlannedMeal {
  const items = m.items!.filter((x, i) => !m.items!.slice(0, i).some((y) => sameItem(x, y)));
  const t = aggregate(items);
  return { ...m, items, kcal: Math.round(t.calories ?? 0), protein: Math.round(t.protein ?? 0), portion: Math.round(items.reduce((n, i) => n + i.grams, 0)) };
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
// foods scaled as the plan counts them (fromMeal). A meal without foods has nothing to log; the Plate makes it. DT76: starters have foods.
export function plannedPortion(m: PlannedMeal, id: string, savedAt: string): Meal | null {
  if (!m.items?.length) return null;
  const weight = m.items.reduce((n, i) => n + (i.grams > 0 ? i.grams : 0), 0);
  const ratio = (m.servings && m.servings > 1 ? 1 / m.servings : m.portion && weight > 0 ? Math.min(1, m.portion / weight) : 1) * (m.amount ?? 1);
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
// DT76 (0.2.76, board DT76, Anna's second run): each starter is its foods in grams, from the reference table, so a portion
// says what to weigh (1½ portions: the grams times 1½), I ate it logs the foods, and the shopping list has them. Eggs and
// bananas are counted, size M. The numbers come from the foods, close to what the starters said before.
const STARTER_FOODS: [string, [string, number][]][] = [
  ["Skyr bowl with berries", [["skyr", 350], ["blueberries", 100], ["oats", 30], ["honey", 10]]],
  ["Oats, skyr and banana", [["oats", 60], ["skyr", 200], ["banana", 118], ["milk-15", 100]]],
  ["Omelette with bread", [["egg", 156], ["egg-white", 100], ["bread-wholegrain", 60], ["tomato", 100], ["olive-oil", 3]]],
  ["Chicken, rice and greens", [["chicken-breast", 150], ["rice-white-cooked", 200], ["broccoli", 150], ["olive-oil", 10]]],
  ["Tuna salad wrap", [["tortilla", 70], ["tuna-canned", 100], ["yogurt-greek", 50], ["lettuce", 40], ["tomato", 80], ["cucumber", 60], ["olive-oil", 8]]],
  ["Protein pancakes", [["oats", 60], ["egg", 104], ["quark-lowfat", 150], ["blueberries", 80], ["milk-15", 50]]],
  ["Sarma", [["cabbage", 150], ["beef-mince", 90], ["rice-white-raw", 25], ["onion", 30], ["tomato-passata", 80], ["olive-oil", 5]]],
  ["Cottage cheese and fruit", [["cottage", 250], ["strawberries", 100]]],
];
function starterOf(title: string, foods: [string, number][], k: number): PlannedMeal {
  const items: Ingredient[] = foods.map(([id, grams], j) => {
    const r = REFERENCE.find((x) => x.id === id);
    if (!r) throw new Error(`starter food ${id} is not in the reference table`);
    const food = referenceFood(r, null, () => `starter-${k}-${j}`);
    const kind = kindOf(food.name);
    return { id: `starter-${k}-${j}`, food, grams, locked: true, ...(kind ? { count: { kind, size: "M" as const } } : {}) };
  });
  const t = aggregate(items);
  return { title, kcal: Math.round(t.calories ?? 0), protein: Math.round(t.protein ?? 0), source: "starter", items, portion: Math.round(items.reduce((n, i) => n + i.grams, 0)) };
}
export const STARTERS: PlannedMeal[] = STARTER_FOODS.map(([t, f], k) => starterOf(t, f, k));

// what a slot needs: the day's numbers shared out by slot, a snack half of a meal
export const weightOf = (s: Slot) => (/snack/i.test(s.name) ? 0.5 : 1);
export function needOf(slots: Slot[], slot: Slot, day: { kcal: number; protein: number } | null): { kcal: number; protein: number } | null {
  if (!day) return null;
  const total = slots.reduce((n, s) => n + weightOf(s), 0) || 1;
  const share = weightOf(slot) / total;
  return { kcal: Math.round(day.kcal * share), protein: Math.round(day.protein * share) };
}

// DT74 (0.2.74, board DT74, Anna's first run): what a slot has left. The day's numbers less what the other slots already
// hold, shared among the slots still open and this one, a snack half of a meal. With nothing planned it is needOf.
export function leftOf(slots: Slot[], slot: Slot, day: { kcal: number; protein: number } | null, held: Record<string, PlannedMeal> | undefined): { kcal: number; protein: number } | null {
  if (!day) return null;
  const others = slots.filter((s) => s.id !== slot.id && held?.[s.id]);
  const used = others.reduce((n, s) => { const m = held![s.id]; return m.skipped ? n : { kcal: n.kcal + m.kcal, protein: n.protein + m.protein }; }, { kcal: 0, protein: 0 });
  const sharing = slots.filter((s) => s.id === slot.id || !held?.[s.id]);
  const total = sharing.reduce((n, s) => n + weightOf(s), 0) || 1;
  const share = weightOf(slot) / total;
  return { kcal: Math.max(0, Math.round((day.kcal - used.kcal) * share)), protein: Math.max(0, Math.round((day.protein - used.protein) * share)) };
}

// the mark next to a meal. DT74: "fits" only when it does. Its PD at the target (a tenth or two under is the same number on
// screen) fits; within a point under is "close", landing around the target as Milan wants; further under says how far.
// DT75 (board DT75, Anna's second run): no size mark; the size of the day is the range's to say (dayOff, fitPortions).
export type Fit = { pd: number | null; state: "fits" | "close" | "under" | "none"; gap: number | null; text: string };
export function fitOf(meal: { kcal: number; protein: number }, target: number | null, unit: "pd" | "pct" = "pd"): Fit {
  const pd = density(meal.protein, meal.kcal);
  if (pd === null || target === null) return { pd, state: "none", gap: null, text: "" };
  const gap = target - pd;
  if (gap <= 0.2) return { pd, state: "fits", gap: 0, text: "fits" };
  if (gap <= 1) return { pd, state: "close", gap, text: "close" };
  const g = unit === "pct" ? `${Math.round(gap * 4)} %` : gap.toFixed(1);
  return { pd, state: "under", gap, text: `${g} under` };
}

// DT75 (Milan 22 October 23:54 to 23:58): a day's kcal is a range, not a number. Labels may be off by a fifth, absorption
// varies, and the best formula for the burn misses by around a tenth; the two together by about 14 %. So the day aims at
// its target give or take a tenth, rounded to 50 kcal (2,100: 1,900 to 2,300). Precision comes from the week: weigh-ins.
export const BAND = 0.1;
export const bandOf = (kcal: number) => ({ lo: Math.round((kcal * (1 - BAND)) / 50) * 50, hi: Math.round((kcal * (1 + BAND)) / 50) * 50 });
// the planned day against its range: off when every slot is set and the kcal fall outside it; by how far from its edge
export function dayOff(sum: { kcal: number; n: number }, day: { kcal: number } | null, open: number): { by: number; short: boolean; lo: number; hi: number } | null {
  if (!day || open > 0 || !sum.n || sum.kcal <= 0) return null;
  const { lo, hi } = bandOf(day.kcal);
  return sum.kcal < lo ? { by: lo - sum.kcal, short: true, lo, hi } : sum.kcal > hi ? { by: sum.kcal - hi, short: false, lo, hi } : null;
}
// protein against the person's range (from g per kg), once every slot is set
export function proteinOff(sum: { protein: number; n: number }, range: { min: number; max: number } | null, open: number): { by: number; above: boolean } | null {
  if (!range || open > 0 || !sum.n) return null;
  return sum.protein > range.max ? { by: sum.protein - range.max, above: true } : sum.protein < range.min ? { by: range.min - sum.protein, above: false } : null;
}
// Fit the portions: amounts people cook, in quarters from a half to two. It aims at the target, and the range takes up what
// quarters can't hit: inside the range first, then within a twentieth of the target (an edge of the range eaten every day
// is a tenth off every day), then the smallest largest change, so it spreads over the meals, then the least change in all,
// then nearest the target. If no amounts reach the range, the nearest they get.
export const QUARTERS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
export function fitPortions(held: Record<string, PlannedMeal>, day: { kcal: number }): Record<string, PlannedMeal> {
  const ids = Object.keys(held).filter((id) => !held[id].skipped);
  if (!ids.length) return held;
  const base = ids.map((id) => { const m = held[id], a = m.amount ?? 1; return { kcal: m.kcal / a, protein: m.protein / a }; });
  const { lo, hi } = bandOf(day.kcal);
  let best: { qs: number[]; key: number[] } | null = null;
  const less = (a: number[], b: number[]) => { for (let j = 0; j < a.length; j++) if (Math.abs(a[j] - b[j]) > 1e-9) return a[j] < b[j]; return false; };
  const qs = ids.map(() => 1);
  const walk = (i: number) => {
    if (i === ids.length) {
      const kcal = qs.reduce((n, q, j) => n + q * base[j].kcal, 0);
      const out = kcal < lo ? lo - kcal : kcal > hi ? kcal - hi : 0;
      const key = [out, Math.abs(kcal - day.kcal) <= day.kcal * 0.05 ? 0 : 1, Math.max(...qs.map((q) => Math.abs(q - 1))), qs.reduce((n, q) => n + Math.abs(q - 1), 0), Math.abs(kcal - day.kcal)];
      if (!best || less(key, best.key)) best = { qs: [...qs], key };
      return;
    }
    for (const q of QUARTERS) { qs[i] = q; walk(i + 1); }
  };
  if (ids.length <= 6) walk(0);
  const found = best as { qs: number[]; key: number[] } | null;
  const out: Record<string, PlannedMeal> = { ...held };
  ids.forEach((id, j) => {
    const q = found ? found.qs[j] : 1, m = held[id];
    if (q === 1) { const { amount: _a, ...rest } = m; void _a; out[id] = { ...rest, kcal: Math.round(base[j].kcal), protein: Math.round(base[j].protein) }; }
    else out[id] = { ...m, amount: q, kcal: Math.round(base[j].kcal * q), protein: Math.round(base[j].protein * q) };
  });
  return out;
}
// back to the portions as saved
export function usualPortions(held: Record<string, PlannedMeal>): Record<string, PlannedMeal> {
  const out: Record<string, PlannedMeal> = {};
  for (const [id, m] of Object.entries(held)) {
    const a = m.amount ?? 1;
    out[id] = a === 1 ? m : (({ amount: _a, ...rest }) => ({ ...rest, kcal: Math.round(m.kcal / a), protein: Math.round(m.protein / a) }))(m);
  }
  return out;
}
// DT75: in quarters, as people cook: ½ portion, 1¼ portions
const FRACTION: Record<number, string> = { 0: "", 0.25: "¼", 0.5: "½", 0.75: "¾" };
export const amountText = (m: PlannedMeal) => {
  if (!m.amount || m.amount === 1) return null;
  const whole = Math.floor(m.amount), part = FRACTION[Math.round((m.amount - whole) * 4) / 4];
  if (part === undefined) return `${m.amount.toFixed(2).replace(/0$/, "")} portions`;
  return `${whole || ""}${part} ${m.amount <= 1 ? "portion" : "portions"}`;
};

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
