// Recognising the same product, however it was added. Pure code, so it can be tested.
import type { Food, Ingredient } from "./pilot";
const STOP = new Set(["flavour", "flavor", "geschmack", "with", "and", "mit", "und", "the", "der", "die", "das", "natural", "natur"]);
const tokens = (s: string) => new Set(s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/&/g, " ").replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w)));
export function nameSimilarity(a: string, b: string) {
  const A = tokens(a), B = tokens(b); if (!A.size || !B.size) return 0;
  let both = 0; A.forEach((w) => { if (B.has(w)) both++; });
  return both / Math.min(A.size, B.size);
}
const near = (x: number | null | undefined, y: number | null | undefined, abs: number, rel = 0) =>
  x != null && y != null && Math.abs(x - y) <= Math.max(abs, rel * Math.max(x, y));
export function valuesMatch(a: Food, b: Food) {
  return near(a.calories, b.calories, 3, 0.02) && near(a.protein, b.protein, 0.5) && (a.fats == null || b.fats == null || near(a.fats, b.fats, 0.5)) && (a.carbs == null || b.carbs == null || near(a.carbs, b.carbs, 0.8));
}
const sameBrand = (a: Food, b: Food) => !!a.brand && !!b.brand && a.brand.trim().toLowerCase() === b.brand.trim().toLowerCase();
export type Match = { food: Food; reason: "barcode" | "values" };
export function findMatch(f: Food, library: Food[]): Match | null {
  const others = library.filter((x) => x.id !== f.id);
  if (f.barcode) { const hit = others.find((x) => x.barcode && x.barcode === f.barcode); if (hit) return { food: hit, reason: "barcode" }; }
  const hit = others.find((x) => valuesMatch(f, x) && (nameSimilarity(f.name, x.name) >= 0.5 || sameBrand(f, x)) && !(f.barcode && x.barcode && f.barcode !== x.barcode));
  return hit ? { food: hit, reason: "values" } : null;
}
export function duplicatePairs(library: Food[]): [Food, Food][] {
  const pairs: [Food, Food][] = [];
  library.forEach((a, i) => library.slice(i + 1).forEach((b) => {
    const m = findMatch(a, [b]); if (m) pairs.push([a, b]);
  }));
  return pairs;
}
// keep wins on anything it has; the other fills gaps; photos of both end up together
export function mergeFoods(keep: Food, other: Food, name?: string): Food {
  const pick = <K extends keyof Food>(k: K) => (keep[k] ?? other[k]) as Food[K];
  const photos = [...(keep.photos ?? (keep.photo ? [keep.photo] : [])), ...(other.photos ?? (other.photo ? [other.photo] : []))].filter((x, i, arr) => x && arr.indexOf(x) === i).slice(0, 6);
  return {
    ...keep, name: name || keep.name, brand: keep.brand || other.brand, barcode: keep.barcode || other.barcode,
    calories: pick("calories"), protein: pick("protein"), fats: pick("fats"), carbs: pick("carbs"), fiber: pick("fiber"),
    notes: [keep.notes, other.notes].filter(Boolean).join(" · ").slice(0, 500),
    photo: keep.photo || other.photo, photos: photos.length ? photos : undefined,
    // the fuller table wins; lines only the other one has are added
    table: (() => {
      const a = keep.table ?? [], b = other.table ?? [];
      const base = a.length >= b.length ? a : b, rest = a.length >= b.length ? b : a;
      const merged = [...base, ...rest.filter((r) => !base.some((x) => x.key === r.key))];
      return merged.length ? merged : undefined;
    })(),
  };
}
// a plate that used the merged-away food now points at the kept one
export const repoint = (items: Ingredient[], fromId: string, to: Food) => items.map((i) => (i.food.id === fromId ? { ...i, food: { ...to } } : i));
