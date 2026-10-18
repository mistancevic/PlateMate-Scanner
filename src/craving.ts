// R17 (0.2.45, Milan 23:04 to 23:34, board RS16): find what you crave. The words are matched by code, at once and for free:
// the dish's name, its foods and parts, and its taste (sweet or savoury). PD 7+ is read as a filter. Chef Mealan is asked only
// on a tap, when nothing of yours fits. A dish under the filter is named, not hidden.
import type { Food, Meal } from "./pilot";
import { density } from "./pilot";
import { dishTaste } from "./dishTaste";

export type Craving = { words: string[]; minPd: number | null; text: string };

// letters without their accents, lower case: crêpes reads crepes
export const norm = (t: string) => String(t ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const STOP = new Set(["something", "some", "with", "a", "an", "the", "i", "im", "crave", "craving", "want", "for", "and", "or", "of", "to", "me", "like", "my", "any", "dish", "food"]);
// PD 7+, PD 7 or more, PD over 7, PD at least 7, PD >= 7, PD7+
const PD_RE = /\bpd\s*(?:of\s*)?(?:>=|≥|>|over|above|at least)?\s*(\d{1,2}(?:[.,]\d)?)\s*(?:\+|or more|and up|or higher|plus)?/i;

export function parseCraving(q: string): Craving {
  let s = norm(q);
  let minPd: number | null = null;
  const m = s.match(PD_RE);
  if (m) { const v = Number(m[1].replace(",", ".")); if (Number.isFinite(v) && v > 0 && v <= 40) minPd = v; s = s.replace(m[0], " "); }
  const words = s.split(/[^a-z0-9]+/).filter((w) => w.length >= 2 && !STOP.has(w));
  return { words, minPd, text: words.join(" ") };
}

// one word finds its plural, and the plural its word
const stem = (w: string) => (w.length > 4 && w.endsWith("es") ? w.slice(0, -2) : w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w);
// a few words that name a taste more than a food
const ALSO: Record<string, string[]> = {
  chocolate: ["chocolate", "cocoa", "cacao", "nutella", "schoko", "kakao"],
  choco: ["chocolate", "cocoa", "cacao", "nutella", "schoko", "kakao"],
  vanilla: ["vanilla", "vanille"],
};

export type Haystack = { title: string; foods: string[]; parts?: string[] };
// every word must be found: in the name, a food or a part; sweet and savoury are the dish's taste
export function matchesCraving(words: string[], h: Haystack): boolean {
  if (!words.length) return true;
  const text = norm([h.title, ...h.foods, ...(h.parts ?? [])].join(" "));
  let taste: ReturnType<typeof dishTaste> | undefined;
  return words.every((w) => {
    if (w === "sweet" || w === "savoury" || w === "savory") { taste ??= dishTaste(h.foods); return taste === (w === "sweet" ? "sweet" : "savoury"); }
    const alts = ALSO[w] ?? ALSO[stem(w)] ?? [stem(w)];
    return alts.some((a) => text.includes(a));
  });
}

export type Row<T> = { key: string; title: string; kcal: number; protein: number; pd: number | null; ref: T };
// at or above the filter is shown; under it is named; the rows that fit the target come first, then the higher PD
export function splitByPd<T>(rows: Row<T>[], minPd: number | null, target: number | null): { shown: Row<T>[]; under: Row<T>[] } {
  const fits = (r: Row<T>) => target !== null && r.pd !== null && target - r.pd <= 1;
  const sorted = [...rows].sort((a, b) => Number(fits(b)) - Number(fits(a)) || (b.pd ?? -1) - (a.pd ?? -1));
  if (minPd === null) return { shown: sorted, under: [] };
  return { shown: sorted.filter((r) => r.pd !== null && r.pd >= minPd - 0.05), under: sorted.filter((r) => r.pd === null || r.pd < minPd - 0.05) };
}

export const recipeHay = (m: Pick<Meal, "title" | "items">): Haystack => ({ title: m.title, foods: m.items.map((i) => i.food.name), parts: [...new Set(m.items.map((i) => i.part).filter(Boolean) as string[])] });
export const foodPd = (f: Pick<Food, "protein" | "calories">) => density(f.protein, f.calories);

// Chef Mealan's idea, made safe to keep: a food's values within what a label can say, so the stored record always reads back
export function safeIdeaItem(i: { name?: unknown; grams?: unknown; calories?: unknown; protein?: unknown; fats?: unknown; carbs?: unknown }) {
  const n = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : Number(x));
  const name = String(i?.name ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
  const grams = Math.round(n(i?.grams));
  const calories = n(i?.calories), protein = n(i?.protein);
  let fats: number | null = n(i?.fats), carbs: number | null = n(i?.carbs);
  if (!name || !(grams > 0 && grams <= 2000) || !(calories >= 0 && calories <= 950) || !(protein >= 0 && protein <= 100)) return null;
  if (!(fats >= 0 && fats <= 100)) fats = null;
  if (!(carbs >= 0 && carbs <= 100)) carbs = null;
  if (fats !== null && carbs !== null && protein + fats + carbs > 101) carbs = null;
  if (fats !== null && protein + fats > 101) return null;
  if (calories === 0 && (protein > 0.5 || (fats ?? 0) > 0.5)) return null;
  return { name: name.charAt(0).toUpperCase() + name.slice(1), grams, calories, protein, fats, carbs };
}
