// DT137 (0.2.122, board Stories94; Milan 28 October 15:32, 16:01, Go at 16:09; Tester 2's breakfast): what changed between a
// recipe and the plate made from it, in one plain line, and a name for a new recipe that is never the old one's.
import type { Ingredient } from "./pilot";

const short = (n: string) => n.split(",")[0].trim();
// the same foods and grams, in any order; a dish row (the recipe at its portions) is the recipe itself
export function sameFoods(a: Ingredient[], b: Ingredient[]): boolean {
  const key = (x: Ingredient[]) => x.filter((i) => !i.optional).map((i) => `${i.food.id}:${Math.round(i.grams)}`).sort().join("|");
  return key(a) === key(b);
}
// Egg whites out, Gouda cheese 30 g in, Oats 40 to 50 g
export function diffLine(before: Ingredient[], after: Ingredient[]): string {
  const b = new Map(before.filter((i) => !i.optional).map((i) => [i.food.id, i])), a = new Map(after.filter((i) => !i.optional).map((i) => [i.food.id, i]));
  const out = [...b.values()].filter((i) => !a.has(i.food.id)).map((i) => `${short(i.food.name)} out`);
  const inn = [...a.values()].filter((i) => !b.has(i.food.id)).map((i) => `${short(i.food.name)} ${Math.round(i.grams)} g in`);
  const moved = [...a.values()].filter((i) => b.has(i.food.id) && Math.round(b.get(i.food.id)!.grams) !== Math.round(i.grams)).map((i) => `${short(i.food.name)} ${Math.round(b.get(i.food.id)!.grams)} to ${Math.round(i.grams)} g`);
  const parts = [...out, ...inn, ...moved];
  if (!parts.length) return "";
  const s = parts.join(", ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}
// Skyr breakfast with cheese; without the food taken out; or changed. Never a name already taken.
export function newNameFor(title: string, before: Ingredient[], after: Ingredient[], taken: string[]): string {
  const b = new Set(before.map((i) => i.food.id)), a = new Set(after.map((i) => i.food.id));
  const added = after.find((i) => !b.has(i.food.id)), gone = before.find((i) => !a.has(i.food.id));
  const word = (n: string) => short(n).toLowerCase().replace(/^(gouda|edamer|emmentaler|cheddar)\s+/, "");
  const base = added ? `${title} with ${word(added.food.name)}` : gone ? `${title} without ${word(gone.food.name)}` : `${title}, changed`;
  const used = new Set(taken.map((t) => t.toLowerCase()));
  if (!used.has(base.toLowerCase())) return base;
  for (let n = 2; n < 50; n++) if (!used.has(`${base} ${n}`.toLowerCase())) return `${base} ${n}`;
  return `${base} ${Date.now() % 1000}`;
}

// DT137 (0.2.123; Milan 28 October 16:39): two recipes with the same name, made before 0.2.122, are told apart by the day they
// were saved: Skyr breakfast · 26 October. A name used once stays as it is. Two saved the same day add the time.
export function recipeName(m: { id: string; title: string; savedAt?: string }, meals: { id: string; title: string; savedAt?: string }[]): string {
  const same = meals.filter((x) => x.id !== m.id && x.title.trim().toLowerCase() === m.title.trim().toLowerCase());
  if (!same.length || !m.savedAt) return m.title;
  const d = new Date(m.savedAt); if (isNaN(d.getTime())) return m.title;
  const day = d.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
  const sameDay = same.some((x) => x.savedAt && new Date(x.savedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" }) === day);
  return `${m.title} · ${day}${sameDay ? `, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` : ""}`;
}
// a planned meal by its recipe, when it has one
export const plannedName = (m: { title: string; mealId?: string }, meals: { id: string; title: string; savedAt?: string }[]): string => {
  const r = m.mealId ? meals.find((x) => x.id === m.mealId) : undefined;
  return r && r.title === m.title ? recipeName(r, meals) : m.title;
};
