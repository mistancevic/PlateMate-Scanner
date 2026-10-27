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
export type GateLine = { ok: true; edge?: string; hint?: string } | { ok: false; why: string; ways: GateWay[] };

// DT132 (0.2.113, board Stories88; Milan 27 October 13:52, 14:12 and 14:37), rule N54: on the edge. Labels can be off by a fifth and a
// photo's grams by more, so a value within 2 points of a rule's line is not a verdict: it passes, with an amber note saying
// the number and the line, and one hint to be clear of it. A fail anywhere wins over an edge. The sweet spot waits for a
// clear pass. The edges: N27 fat 48 to 52 percent; N28 supplement protein 48 to 52 percent; N29 carbs before training 8 to
// 12 percent; before training 570 to 630 kcal; after training 13 to 17 g protein; C31 the plate's size 1.3 to 1.5 portions.
export const EDGE = { fat: [0.48, 0.52], supplement: [0.48, 0.52], carbsBefore: [0.08, 0.12], kcalBefore: [570, 630], proteinAfter: [13, 17], size: [1.3, 1.5] } as const;
const within = (v: number, [lo, hi]: readonly [number, number]) => v >= lo && v <= hi;
const pct = (x: number) => Math.round(x * 100);
// C31, the plate's size against its meal: over 1.5 portions it is not that meal yet (two or more); 1.3 to 1.5 is on the edge
export function sizeOf(kcal: number, mealKcal: number | null | undefined): { portions: number; big: boolean; edge: boolean } {
  if (!mealKcal || mealKcal < 150) return { portions: 0, big: false, edge: false };
  const portions = kcal / mealKcal;
  return { portions, big: portions > EDGE.size[1], edge: within(portions, EDGE.size) };
}

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
  let edge: GateLine | null = null;
  // N27, fat over half the energy of a meal; the edge names the fattiest food for the hint
  if (x.kind === "meal" && fatShare > EDGE.fat[1]) return { ok: false, why: `More than half of this ${x.mealWord}'s energy is fat: ${pct(fatShare)} percent, ${Math.round(t.fats ?? 0)} g.`, ways: ["protein", "snack", "keep"] };
  if (x.kind === "meal" && within(fatShare, EDGE.fat)) {
    const fattest = [...x.items].sort((a, b) => ((b.food.fats ?? 0) * b.grams) - ((a.food.fats ?? 0) * a.grams))[0];
    edge = { ok: true, edge: `Fat is about half of this ${x.mealWord}'s energy: ${pct(fatShare)} percent, and the line is 50.`, hint: `To be clear of it: a little less ${fattest.food.name.split(",")[0].toLowerCase()}, or a protein side.` };
  }
  // N28, more than half the protein from a supplement
  if (protein >= 15 && supp / protein > EDGE.supplement[1]) {
    const names = x.items.filter((i) => catOf(i.food) === "supplement").map((i) => i.food.name.toLowerCase().includes("powder") || /whey|protein/i.test(i.food.name) ? "the powder" : i.food.name.toLowerCase());
    return { ok: false, why: `Most of this ${x.mealWord}'s protein comes from ${[...new Set(names)].join(" and ")}: ${Math.round(supp)} of ${Math.round(protein)} g.`, ways: ["protein", "snack", "keep"] };
  }
  if (!edge && protein >= 15 && supp > 0 && within(supp / protein, EDGE.supplement)) edge = { ok: true, edge: `About half of this ${x.mealWord}'s protein comes from a supplement: ${Math.round(supp)} of ${Math.round(protein)} g, and the line is half.`, hint: "To be clear of it: a protein food next to it." };
  // N29, carbs before training
  if (x.beforeTraining && carbShare !== null && carbShare < EDGE.carbsBefore[0]) return { ok: false, why: `Before training the plate wants carbs, and this one has almost none: ${pct(carbShare)} percent of its energy.`, ways: ["carb", "keep"] };
  if (!edge && x.beforeTraining && carbShare !== null && within(carbShare, EDGE.carbsBefore)) edge = { ok: true, edge: `Before training, carbs are ${pct(carbShare)} percent of this plate's energy, and the line is 10.`, hint: "To be clear of it: a piece of fruit or bread." };
  if (edge) return edge;
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
  if (x.moment === "before" && kcal > EDGE.kcalBefore[1]) return { ok: false, why: `Before training ${Math.round(kcal)} kcal is a lot to carry; a smaller plate sits better.`, ways: ["snack", "keep"] };
  if (x.moment === "after" && (t.protein ?? 0) < EDGE.proteinAfter[0]) return { ok: false, why: `After training protein comes first, and this plate has ${Math.round(t.protein ?? 0)} g.`, ways: ["protein", "keep"] };
  let edge: GateLine | null = null;
  if (x.moment === "before" && within(kcal, EDGE.kcalBefore)) edge = { ok: true, edge: `Before training ${Math.round(kcal)} kcal, and the line is 600.`, hint: "To be clear of it: a smaller portion." };
  if (x.moment === "after" && within(t.protein ?? 0, EDGE.proteinAfter)) edge = { ok: true, edge: `After training this plate has ${Math.round(t.protein ?? 0)} g protein, and the line is 15.`, hint: "To be clear of it: a protein food next to it." };
  if (x.window?.from && x.window?.to && x.kind !== "dessert") {
    const m = x.now.getHours() * 60 + x.now.getMinutes(), from = toMin(x.window.from), to = toMin(x.window.to);
    const outside = from <= to ? m < from || m > to : m > to && m < from;
    if (outside && kcal >= 300) return { ok: false, why: `${String(x.now.getHours()).padStart(2, "0")}:${String(x.now.getMinutes()).padStart(2, "0")}, and your eating window is ${x.window.from} to ${x.window.to}. A full plate now sits on tomorrow.`, ways: ["snack", "window", "keep"] };
  }
  return edge ?? { ok: true };
}

// the grams line under the letters: 22 g fat · 21 g carbs · 9 g fibre (fibre ? when a food lacks the value)
export function gramsLine(t: { fats: number | null; carbs: number | null; fiber: number | null }): string {
  const g = (v: number | null) => (v === null ? "?" : `${Math.round(v)} g`);
  return `${g(t.fats)} fat · ${g(t.carbs)} carbs · ${t.fiber === null ? "fibre ?" : `${Math.round(t.fiber)} g fibre`}`;
}
