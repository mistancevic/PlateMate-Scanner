// The three gates (0.2.98, boards G3 and Stories69, DT116; Milan 25 October 01:24 to 10:52): culinary, nutrition, your day.
// Something can be right as a dish, wrong against the numbers, and fit or not fit the day as the person lives it; each gate
// answers for itself, in its own words, so the reason stays. The intersection is the sweet spot, DaaM Good before eating.
// This file holds the two gates that are arithmetic: nutrition (rules N27 to N29) and your day (version 1). The culinary gate
// is Chef Mealan's read of the plate (C30) with the code lines in front of it (C6, C31). None of this asks the AI.
import { aggregate, type Ingredient } from "./pilot";
import { catOf } from "./mixtip";
import { toMin } from "./slots";
import type { MomentId } from "./moments";

export type GateWay = "protein" | "carb" | "snack" | "keep" | "nocook" | "window";
export type GateLine = { ok: true } | { ok: false; why: string; ways: GateWay[] };

export type NutritionIn = { items: Ingredient[]; kind: "meal" | "snack" | "dessert" | string; beforeTraining: boolean; mealWord: string };
// N27: fat over half the meal's energy (a meal, not a snack or a dessert). N28: more than half the protein from a supplement.
// N29: carbs under 10 percent of the energy, for the meal before training only. Fibre waits for values (0.2.98).
export function nutritionGate(x: NutritionIn): GateLine {
  const t = aggregate(x.items), kcal = t.calories ?? 0;
  if (!x.items.length || kcal < 150) return { ok: true };
  const fatShare = t.fats !== null && t.fats !== undefined ? (t.fats * 9) / kcal : 0;
  const carbShare = t.carbs !== null && t.carbs !== undefined ? (t.carbs * 4) / kcal : null;
  const protein = t.protein ?? 0;
  const supp = x.items.filter((i) => catOf(i.food) === "supplement").reduce((k, i) => k + ((i.food.protein ?? 0) * i.grams) / 100, 0);
  if (x.kind === "meal" && fatShare > 0.5) return { ok: false, why: `More than half of this ${x.mealWord}'s energy is fat: ${Math.round(fatShare * 100)} percent, ${Math.round(t.fats ?? 0)} g.`, ways: ["protein", "snack", "keep"] };
  if (protein >= 15 && supp > protein / 2) {
    const names = x.items.filter((i) => catOf(i.food) === "supplement").map((i) => i.food.name.toLowerCase().includes("powder") || /whey|protein/i.test(i.food.name) ? "the powder" : i.food.name.toLowerCase());
    return { ok: false, why: `Most of this ${x.mealWord}'s protein comes from ${[...new Set(names)].join(" and ")}: ${Math.round(supp)} of ${Math.round(protein)} g.`, ways: ["protein", "snack", "keep"] };
  }
  if (x.beforeTraining && carbShare !== null && carbShare < 0.1) return { ok: false, why: `Before training the plate wants carbs, and this one has almost none: ${Math.round(carbShare * 100)} percent of its energy.`, ways: ["carb", "keep"] };
  return { ok: true };
}

export type DayIn = { items: Ingredient[]; moment: MomentId; now: Date; window: { from: string; to: string } | null | undefined; kind: string; mealWord: string; needsCooking: (name: string) => boolean };
// Your day, version 1: the moment and the time of day, from data the app has. Before training, a plate with almost no carbs
// is the nutrition gate's case (N29); here the moment asks for nothing to cook and nothing heavy. After training, protein
// first: a plate with under 15 g protein does not do the job. A meeting or travel wants nothing to cook. A full meal outside
// the eating window sits on tomorrow. The week, budget and where you eat wait for version 2.
export function dayGate(x: DayIn): GateLine {
  const t = aggregate(x.items), kcal = t.calories ?? 0;
  if (!x.items.length || kcal < 100) return { ok: true };
  const cooks = x.items.filter((i) => x.needsCooking(i.food.name)).map((i) => i.food.name.toLowerCase());
  if ((x.moment === "before" || x.moment === "meeting" || x.moment === "travel") && cooks.length)
    return { ok: false, why: `${x.moment === "before" ? "Before training" : x.moment === "meeting" ? "A meeting" : "Travel"} wants nothing to cook, and ${cooks.join(" and ")} ${cooks.length === 1 ? "needs" : "need"} a pot.`, ways: ["nocook", "keep"] };
  if (x.moment === "before" && kcal > 600) return { ok: false, why: `Before training ${Math.round(kcal)} kcal is a lot to carry; a smaller plate sits better.`, ways: ["snack", "keep"] };
  if (x.moment === "after" && (t.protein ?? 0) < 15) return { ok: false, why: `After training protein comes first, and this plate has ${Math.round(t.protein ?? 0)} g.`, ways: ["protein", "keep"] };
  if (x.window?.from && x.window?.to && x.kind !== "dessert") {
    const m = x.now.getHours() * 60 + x.now.getMinutes(), from = toMin(x.window.from), to = toMin(x.window.to);
    const outside = from <= to ? m < from || m > to : m > to && m < from;
    if (outside && kcal >= 300) return { ok: false, why: `${String(x.now.getHours()).padStart(2, "0")}:${String(x.now.getMinutes()).padStart(2, "0")}, and your eating window is ${x.window.from} to ${x.window.to}. A full plate now sits on tomorrow.`, ways: ["snack", "window", "keep"] };
  }
  return { ok: true };
}

// the grams line under the letters: 22 g fat · 21 g carbs · 9 g fibre (fibre ? when a food lacks the value)
export function gramsLine(t: { fats: number | null; carbs: number | null; fiber: number | null }): string {
  const g = (v: number | null) => (v === null ? "?" : `${Math.round(v)} g`);
  return `${g(t.fats)} fat · ${g(t.carbs)} carbs · ${t.fiber === null ? "fibre ?" : `${Math.round(t.fiber)} g fibre`}`;
}
