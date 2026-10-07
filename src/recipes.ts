// Recipes you can share (canvas boards R0 to R7, approved by Milan on 7 October 2026). A recipe from the app gets its own
// page on chefmealan.com/r/<slug> and a set of Instagram images. Everyone sees the recipe; members also see their amounts.
// Every number comes from the recipe and the labels of its foods, weighed; never guessed from a photo.
import type { Meal } from "./pilot";
import { BANDS } from "./goal";

export type PublicItem = { name: string; grams: number; amount: string; per100?: { kcal: number | null; protein: number | null; fat: number | null; carbs: number | null; fibre: number | null } };
export type PublicNutrition = { kcal: number; protein: number; carbs: number; fat: number; fibre: number | null };
export type PublicRecipe = {
  slug: string; title: string; lines: string; makes: number; servingName: string; minutes: number | null;
  items: PublicItem[]; steps: string[]; rating: "daam" | "good" | null; who: "everyone" | "members";
  per100: PublicNutrition & { grams: number }; perServing: PublicNutrition; all: PublicNutrition;
  pd: number; proteinShare: number; fits: { name: string; range: string; how: "fits" | "just above" | "just below" }[];
  hasPhoto: boolean; author: string; publishedAt: string; updatedAt: string; mealId?: string;
};

// the address: words of the title, small letters, dashes between, no more than 60 characters
export function slugOf(title: string): string {
  return title.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60).replace(/-+$/, "") || "recipe";
}

const r1 = (x: number) => Math.round(x * 10) / 10;
// the recipe's numbers from its foods and grams: per 100 g, for all of it, and per serving
export function numbersOf(meal: Pick<Meal, "items">, makes: number): { per100: PublicRecipe["per100"]; all: PublicNutrition; perServing: PublicNutrition; pd: number; proteinShare: number } | null {
  const items = meal.items.filter((i) => i.grams > 0);
  if (!items.length || makes < 1) return null;
  const sum = (k: "calories" | "protein" | "carbs" | "fats" | "fiber") => { let any = false, s = 0; for (const i of items) { const v = i.food[k]; if (v === null || v === undefined) { if (k !== "fiber") return null; continue; } any = true; s += (v * i.grams) / 100; } return any ? s : null; };
  const kcal = sum("calories"), protein = sum("protein"), carbs = sum("carbs"), fat = sum("fats"), fibre = sum("fiber");
  if (kcal === null || protein === null || carbs === null || fat === null || kcal <= 0) return null;
  const grams = items.reduce((s, i) => s + i.grams, 0);
  const all = { kcal: Math.round(kcal), protein: r1(protein), carbs: r1(carbs), fat: r1(fat), fibre: fibre === null ? null : r1(fibre) };
  const per = (x: number) => x / makes;
  const perServing = { kcal: Math.round(per(kcal)), protein: r1(per(protein)), carbs: r1(per(carbs)), fat: r1(per(fat)), fibre: fibre === null ? null : r1(per(fibre)) };
  const h = (x: number) => (x * 100) / grams;
  const per100 = { grams, kcal: Math.round(h(kcal)), protein: r1(h(protein)), carbs: r1(h(carbs)), fat: r1(h(fat)), fibre: fibre === null ? null : r1(h(fibre)) };
  return { per100, all, perServing, pd: r1((100 * protein) / kcal), proteinShare: Math.round((400 * protein) / kcal) };
}

// The goals whose PD range the recipe sits in, or just next to (within 0.3). Any goal can have it; the amount changes.
export function fitsOf(pd: number): PublicRecipe["fits"] {
  const out: PublicRecipe["fits"] = [];
  for (const b of BANDS) {
    const m = b.range.match(/([\d.]+)\s*to\s*([\d.]+)/); if (!m) continue;
    const lo = Number(m[1]), hi = Number(m[2]);
    const how = pd >= lo && pd <= hi ? "fits" : pd > hi && pd - hi <= 0.3 ? "just above" : pd < lo && lo - pd <= 0.3 ? "just below" : null;
    if (how) out.push({ name: b.name, range: b.range, how });
  }
  return out.sort((a, b) => (a.how === "fits" ? 0 : 1) - (b.how === "fits" ? 0 : 1));
}

// The words high protein only when at least 20 % of the energy is protein (EU Regulation 1924/2006, Annex)
export const saysHighProtein = (s: string) => /high[- ]?protein|protein[- ]?rich|viel protein|eiwei(ß|ss)reich|proteinreich/i.test(s);
export function claimProblem(title: string, lines: string, share: number): string | null {
  return (saysHighProtein(title) || saysHighProtein(lines)) && share < 20
    ? `The words high protein need at least 20 % of the energy from protein; this recipe has ${share} %. Change the name or the two lines.`
    : null;
}

// grams as a reader cooks them: whole grams, or a kilo and more in kilos
export const amountOf = (g: number) => (g >= 1000 ? `${r1(g / 1000)} kg` : `${Math.round(g)} g`);

// What a visitor sees of a members-only recipe: the photo, the name, the numbers; the foods and the steps stay for members
export function forVisitor(r: PublicRecipe): PublicRecipe & { locked?: boolean } {
  return r.who === "members" ? { ...r, items: [], steps: [], locked: true } : r;
}
