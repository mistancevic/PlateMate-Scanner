// Quick picks for the plate: favourites first, then what this person has actually used lately.
import type { Food, Feedback } from "./pilot";
export const QUICK_MAX = 8;
const WINDOW_DAYS = 42;
export function usageCounts(feedback: Feedback[], now = Date.now()): Map<string, number> {
  const counts = new Map<string, number>();
  for (const f of feedback) {
    if (now - Date.parse(f.createdAt) > WINDOW_DAYS * 86_400_000) continue;
    for (const i of f.meal.items) counts.set(i.food.id, (counts.get(i.food.id) ?? 0) + 1);
  }
  return counts;
}
export function quickPicks(foods: Food[], feedback: Feedback[], now = Date.now()): { picks: Food[]; why: Map<string, "favourite" | "often" | "new"> } {
  const used = usageCounts(feedback, now);
  const why = new Map<string, "favourite" | "often" | "new">();
  const favs = foods.filter((f) => f.favorite).sort((a, b) => (used.get(b.id) ?? 0) - (used.get(a.id) ?? 0) || a.name.localeCompare(b.name));
  favs.forEach((f) => why.set(f.id, "favourite"));
  const often = foods.filter((f) => !f.favorite && (used.get(f.id) ?? 0) > 0).sort((a, b) => (used.get(b.id) ?? 0) - (used.get(a.id) ?? 0));
  often.forEach((f) => why.set(f.id, "often"));
  // before there's any history: the library's own order, newest first, so the starter foods or the latest scans show
  const rest = foods.filter((f) => !why.has(f.id));
  rest.forEach((f) => why.set(f.id, "new"));
  return { picks: [...favs, ...often, ...rest].slice(0, QUICK_MAX), why };
}
