// The recipe's nutrition table (0.2.21, canvas board IM, IM21; Milan 17 October 2026, 13:44 and 14:02). Worked out by code from
// the foods and their grams, never by the model, in the EU label order (Regulation 1169/2011, Annex XV): energy, fat, of which
// saturates, carbohydrate, of which sugars, of which polyols, fibre, protein, salt. Exact counts: one serving, all of them
// (All 2, never Both), per 100 g. A food without a value leaves that row open and says which food; the other rows stay.
// Sugar alcohols: a sweetener with no energy and carbohydrate (erythritol) is a real food, counted as polyols (Milan 14:02).
import type { Food, Ingredient } from "./pilot";
import { lineTotal } from "./labeltable";

export type NutRow = { key: string; label: string; unit: "kcal" | "g"; sub: boolean; serving: number | null; all: number | null; per100: number | null; missing: string[] };
export type Nutrition = { rows: NutRow[]; servings: number; grams: number; pd: number | null; share: number | null };
const CORE: [keyof Food, string, string][] = [["calories", "energy", "Energy"], ["fats", "fat", "Fat"], ["carbs", "carbs", "Carbohydrate"], ["fiber", "fibre", "Fibre"], ["protein", "protein", "Protein"]];
// polyols in a food: its label's line, or all of its carbohydrate when it brings no energy (a sweetener such as erythritol)
export const polyolsOf = (f: Pick<Food, "calories" | "carbs"> & { table?: { key: string; amount: number | null; unit: string }[] }): number | null => {
  const row = f.table?.find((r) => r.key === "polyols" && r.amount != null && r.unit === "g");
  if (row) return row.amount;
  return f.calories === 0 && (f.carbs ?? 0) > 0 ? f.carbs : null;
};
export function nutritionOf(list: Pick<Ingredient, "grams" | "food">[], servings: number): Nutrition | null {
  const items = list.filter((i) => i.grams > 0);
  if (!items.length || !(servings > 0)) return null;
  const grams = items.reduce((n, i) => n + i.grams, 0);
  const row = (key: string, label: string, unit: "kcal" | "g", sub: boolean, total: number | null, missing: string[]): NutRow => ({
    key, label, unit, sub, missing, all: missing.length || total === null ? null : total, serving: missing.length || total === null ? null : total / servings, per100: missing.length || total === null ? null : (total * 100) / grams });
  const sumOf = (k: keyof Food) => { let s = 0; const miss: string[] = []; for (const i of items) { const v = i.food[k] as number | null | undefined; if (v === null || v === undefined) miss.push(i.food.name); else s += (v * i.grams) / 100; } return { s, miss }; };
  const core = Object.fromEntries(CORE.map(([k, key]) => [key, sumOf(k)])) as Record<string, { s: number; miss: string[] }>;
  // the extra lines only when every food has them from its label
  const extra = (key: string) => (items.every((i) => i.food.table?.some((r) => r.key === key && r.amount != null)) ? lineTotal(items, key) : null);
  const poly = items.reduce((n, i) => n + ((polyolsOf(i.food) ?? 0) * i.grams) / 100, 0);
  const rows: NutRow[] = [];
  rows.push(row("energy", "Energy", "kcal", false, core.energy.s, core.energy.miss));
  rows.push(row("fat", "Fat", "g", false, core.fat.s, core.fat.miss));
  const sat = extra("saturates"); if (sat !== null) rows.push(row("saturates", "of which saturates", "g", true, sat, []));
  rows.push(row("carbs", "Carbohydrate", "g", false, core.carbs.s, core.carbs.miss));
  const sug = extra("sugars"); if (sug !== null) rows.push(row("sugars", "of which sugars", "g", true, sug, []));
  if (poly > 0) rows.push(row("polyols", "of which polyols", "g", true, poly, []));
  // fibre is voluntary on a label: a row only when every food has a value (a recipe read from a picture has none)
  if (!core.fibre.miss.length) rows.push(row("fibre", "Fibre", "g", false, core.fibre.s, []));
  rows.push(row("protein", "Protein", "g", false, core.protein.s, core.protein.miss));
  const salt = extra("salt"); if (salt !== null) rows.push(row("salt", "Salt", "g", false, salt, []));
  const kcal = core.energy.miss.length ? 0 : core.energy.s, prot = core.protein.miss.length ? null : core.protein.s;
  return { rows, servings, grams, pd: kcal > 0 && prot !== null ? (100 * prot) / kcal : null, share: kcal > 0 && prot !== null ? Math.round((400 * prot) / kcal) : null };
}
// one serving's kcal, protein and PD for each part (IM21, By part)
export function byPart(list: Pick<Ingredient, "grams" | "food" | "part">[], servings: number): { part: string; kcal: number; protein: number; pd: number | null }[] {
  const out: { part: string; kcal: number; protein: number; pd: number | null }[] = [];
  for (const i of list) {
    if (!i.part || !(i.grams > 0)) continue;
    let r = out.find((x) => x.part === i.part); if (!r) { r = { part: i.part, kcal: 0, protein: 0, pd: null }; out.push(r); }
    r.kcal += ((i.food.calories ?? 0) * i.grams) / 100 / servings; r.protein += ((i.food.protein ?? 0) * i.grams) / 100 / servings;
  }
  for (const r of out) r.pd = r.kcal > 0 ? (100 * r.protein) / r.kcal : null;
  return out;
}
