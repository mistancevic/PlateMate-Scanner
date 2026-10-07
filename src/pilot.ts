import { rowsFromRaw } from "./labeltable";
/** Versioned pilot contract: numbers are unrounded; null means unknown. */
export type Nutrient = "calories" | "protein" | "fats" | "carbs" | "fiber";
// the order printed on European labels, so checking against the pack goes line by line
export const KEYS: Nutrient[] = [
  "calories",
  "fats",
  "carbs",
  "fiber",
  "protein",
];
export const MACROS = ["fats", "carbs", "fiber", "protein"] as const; // label order, wherever all of them are shown
// A value printed as a less-than ("Eiweiß <0,5 g") is a declared value: at most that much. The model leaves the field null
// and keeps the printed text in the notes; the label check fills the field with the bound so the number can be calculated.
const LESS_THAN_NAMES: Record<string, RegExp> = {
  protein: /(eiweiß|eiweiss|protein|proteine|proteínas|proteini|belančevine)/i,
  fats: /(fett|fat|grasas|lipides|masti)(?!säuren|acids)/i,
  carbs: /(kohlenhydrate|carbohydrate|carbs|hidratos|glucides|ugljeni)/i,
  fiber: /(ballaststoffe|fibre|fiber|fibra|vlakna)/i,
  calories: /(energie|energy|kcal)/i,
};
export function lessThanFromNotes(notes: string): Partial<Record<string, number>> {
  const out: Partial<Record<string, number>> = {};
  if (!notes) return out;
  // "Fett <0,5g", "Eiweiß < 0.5 g", "protein: <0,5 g"
  for (const m of notes.matchAll(/([A-Za-zÀ-ž ]{3,40}?)\s*[:=]?\s*<\s*([\d]+(?:[.,]\d+)?)\s*(g|kcal)?/g)) {
    const name = m[1].trim(), n = Number(m[2].replace(",", "."));
    if (!Number.isFinite(n)) continue;
    for (const [k, re] of Object.entries(LESS_THAN_NAMES)) if (re.test(name) && !(k in out)) out[k] = n;
  }
  return out;
}
export const LABELS = {
  calories: "Energy",
  protein: "Protein",
  fats: "Fat",
  carbs: "Carbohydrate",
  fiber: "Fibre",
};
export const SYMBOLS = { protein: "P", fats: "F", carbs: "C", fiber: "Fi" };
export const DENSITIES = {
  protein: "PD",
  fats: "FD",
  carbs: "CD",
  fiber: "FiD",
};
export type Nutrition = Record<Nutrient, number | null>;
export type Food = Nutrition & {
  id: string;
  name: string;
  brand: string;
  barcode?: string;
  // other names the same food goes by (a food without a label carries English, German and Serbian in both scripts); search reads them
  aliases?: string[];
  // a counted food: the pack prints a serving (1 bar 45 g, 1 piece 30 g); what Mealan moves then snaps to whole servings
  serving?: { grams: number; name: string };
  basis: "100g";
  source: string;
  notes: string;
  reviewedAt: string;
  readyToEat: boolean;
  photo?: string;
  photos?: string[];
  // fingerprints of the photos that came from Open Food Facts, shown with their credit (canvas board C8)
  creditPhotos?: string[];
  table?: import("./labeltable").LabelRow[];
  favorite?: boolean;
  job?: string;
  tip?: { text: string; pairs: string[]; goalKey: string; at: string };
  icon?: string;
};
export type Ingredient = {
  keep?: boolean;
  id: string;
  food: Food;
  grams: number;
  locked: boolean;
};
export type Goals = Nutrition;
export type Meal = {
  id: string;
  title: string;
  items: Ingredient[];
  portion: number;
  savedAt: string;
};
export type Feedback = {
  id: string;
  meal: Meal;
  status: "prepared" | "eaten" | "not-used";
  taste: string;
  notes: string;
  createdAt: string;
  photo?: string;
  shared?: { reason: "look" | "ok" | "help"; at: string };
  moment?: string;
  dayType?: string;
};
export type PilotState = {
  version: 1;
  goals: Goals;
  foods: Food[];
  meals: Meal[];
  feedback: Feedback[];
  preferences: string;
  items: Ingredient[];
  title: string;
  portion: number | null;
};
export const EMPTY: Nutrition = {
  calories: null,
  protein: null,
  fats: null,
  carbs: null,
  fiber: null,
};
export const freshState = (): PilotState => ({
  version: 1,
  goals: { ...EMPTY },
  foods: [],
  meals: [],
  feedback: [],
  preferences: "",
  items: [],
  title: "My meal",
  portion: null,
});
export const uid = () => crypto.randomUUID();
export function numberInput(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "number" && typeof value !== "string") return null;
  const text = String(value).trim().replace(",", ".");
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) return null;
  const n = Number(text);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
export function density(grams: number | null, kcal: number | null) {
  return grams !== null && kcal !== null && kcal > 0
    ? (100 * grams) / kcal
    : null;
}
export function aggregate(items: Ingredient[]): Nutrition & { weight: number } {
  const active = items.filter((x) => x.grams > 0);
  const result = { ...EMPTY, weight: active.reduce((s, x) => s + x.grams, 0) };
  for (const k of KEYS)
    result[k] =
      active.length && active.every((x) => x.food[k] !== null)
        ? active.reduce((s, x) => s + (x.food[k]! * x.grams) / 100, 0)
        : null;
  return result;
}
export function portionTotals(items: Ingredient[], grams: number | null) {
  const t = aggregate(items);
  const q = grams === null ? t.weight : grams;
  const ratio = t.weight > 0 && q > 0 && q <= t.weight ? q / t.weight : null;
  const result = { ...EMPTY, weight: ratio === null ? 0 : q };
  for (const k of KEYS)
    result[k] = ratio !== null && t[k] !== null ? t[k]! * ratio : null;
  return result;
}
export function contribution(n: number | null, target: number | null) {
  return n !== null && target !== null && target > 0
    ? (100 * n) / target
    : null;
}
export function symbol(
  k: (typeof MACROS)[number],
  data: Nutrition,
  goals: Goals,
) {
  const d = density(data[k], data.calories),
    r = density(goals[k], goals.calories),
    s = SYMBOLS[k];
  if (d === null || r === null || r <= 0) return `${s} ?`;
  const ratio = d / r;
  return ratio > 1.1 + 1e-12
    ? s + "+"
    : ratio >= 0.9 - 1e-12
      ? s
      : s.toLowerCase();
}
export function category(pd: number | null) {
  return pd === null
    ? "Protein density unavailable"
    : pd < 3
      ? "Lower protein density"
      : pd < 5
        ? "Intermediate protein density"
        : pd < 10
          ? "Concentrated protein"
          : "Very concentrated protein";
}
export type Solution =
  | {
      ok: true;
      grams: number;
      items: Ingredient[];
      actualPD: number;
      exactGrams: number;
    }
  | { ok: false; reason: string };
/** Adjust only one explicitly unlocked ingredient. Preserve all other quantities. */
export function solveIngredient(
  items: Ingredient[],
  id: string,
  target: number,
  maxWeight: number | null,
): Solution {
  if (!Number.isFinite(target) || target <= 0)
    return {
      ok: false,
      reason: "Set a positive protein-density reference first.",
    };
  const selected = items.find((x) => x.id === id);
  if (!selected || selected.locked)
    return { ok: false, reason: "Choose an unlocked ingredient to adjust." };
  if (items.some((x) => x.food.calories === null || x.food.protein === null))
    return {
      ok: false,
      reason: "Confirm energy and protein for every ingredient first.",
    };
  const f = selected.food,
    others = items.filter((x) => x.id !== id),
    t = aggregate(others);
  const E = t.calories ?? 0,
    P = t.protein ?? 0;
  const denominator = (100 * f.protein!) / 100 - (target * f.calories!) / 100;
  const numerator = target * E - 100 * P;
  if (Math.abs(denominator) < 1e-10)
    return {
      ok: false,
      reason:
        Math.abs(numerator) < 1e-10
          ? "The combination already matches this density. Choose quantity by appetite and meal needs."
          : "This ingredient cannot bring the combination to the selected density.",
    };
  const exactGrams = numerator / denominator;
  if (!Number.isFinite(exactGrams) || exactGrams < 0)
    return {
      ok: false,
      reason:
        "No non-negative amount of this ingredient meets the reference. Try a different supporting food.",
    };
  // a counted food lands on whole servings: more of it when it lifts the plate, fewer when it lowers it, never under one
  const lifts = (f.protein! / f.calories!) * 100 >= target;
  const grams = f.serving ? (lifts ? snapToServing(f, exactGrams) : Math.max(1, Math.floor(exactGrams / f.serving.grams + 1e-9)) * f.serving.grams) : Math.round(exactGrams);
  if (
    maxWeight !== null &&
    (t.weight + exactGrams > maxWeight + 1e-8 || t.weight + grams > maxWeight)
  )
    return {
      ok: false,
      reason: `This combination needs about ${Math.ceil(t.weight + exactGrams)} g in total, above your ${maxWeight} g limit. Change the supporting food or choose a different limit.`,
    };
  const result = items.map((x) => (x.id === id ? { ...x, grams } : x)),
    total = aggregate(result),
    actualPD = density(total.protein, total.calories);
  // a counted food lands on whole servings, so it may overshoot the target; a food in grams must land within 0.05
  const overshootOk = Boolean(f.serving) && actualPD !== null && actualPD >= target;
  if (actualPD === null || (Math.abs(actualPD - target) > 0.05 && !overshootOk))
    return {
      ok: false,
      reason:
        "Whole-gram rounding cannot meet this density within 0.05. Adjust manually using the displayed totals.",
    };
  return { ok: true, grams, items: result, actualPD, exactGrams };
}
export function validateFood(food: Food): string[] {
  const errors: string[] = [];
  if (!food.name.trim()) errors.push("Add a product name.");
  if (food.calories === null || food.protein === null)
    errors.push("Energy and protein are required to calculate PD.");
  for (const k of KEYS)
    if (food[k] !== null && (!Number.isFinite(food[k]) || food[k]! < 0))
      errors.push(`${LABELS[k]} must be a non-negative number.`);
  for (const k of MACROS)
    if (food[k] !== null && food[k]! > 100)
      errors.push(`${LABELS[k]} cannot exceed 100 g per 100 g.`);
  if (
    MACROS.every((k) => food[k] !== null) &&
    MACROS.reduce((s, k) => s + food[k]!, 0) > 101
  )
    errors.push(
      "Macro grams exceed the food weight. Check serving basis and carbohydrate/fibre convention.",
    );
  if (food.calories === 0 && MACROS.some((k) => (food[k] ?? 0) > 0))
    errors.push(
      "Zero energy conflicts with nutrient amounts. Check the label.",
    );
  return errors;
}
export function isFood(f: any): f is Food {
  return (
    !!f &&
    typeof f.id === "string" &&
    typeof f.name === "string" &&
    typeof f.brand === "string" &&
    f.basis === "100g" &&
    typeof f.source === "string" &&
    typeof f.notes === "string" &&
    typeof f.reviewedAt === "string" &&
    typeof f.readyToEat === "boolean" &&
    KEYS.every(
      (k) =>
        f[k] === null ||
        (typeof f[k] === "number" && Number.isFinite(f[k]) && f[k] >= 0),
    ) &&
    !validateFood(f).length
  );
}
function isItem(x: any): x is Ingredient {
  return (
    !!x &&
    typeof x.id === "string" &&
    isFood(x.food) &&
    typeof x.grams === "number" &&
    Number.isFinite(x.grams) &&
    x.grams >= 0 &&
    typeof x.locked === "boolean"
  );
}
function isMeal(m: any): m is Meal {
  return (
    !!m &&
    typeof m.id === "string" &&
    typeof m.title === "string" &&
    typeof m.savedAt === "string" &&
    Array.isArray(m.items) &&
    m.items.every(isItem) &&
    typeof m.portion === "number" &&
    Number.isFinite(m.portion) &&
    m.portion > 0 &&
    m.portion <= aggregate(m.items).weight
  );
}
// Known gaps from older builds are filled before the state is judged. A food without a basis was written by v0.1.34
// (the reference table); it is per 100 g by construction. One missing field must never make a person's whole record unreadable.
export const TYPICAL = "typical values, check your pack";
export function repairState(v: any): any {
  if (!v || typeof v !== "object") return v;
  // plain English pass (7 October 2026): the starter foods' brand line, also in foods saved before
  const fixFood = (f: any) => { if (f && f.brand === "generic, check your package") f.brand = TYPICAL; if (f && typeof f === "object" && f.basis === undefined) f.basis = "100g"; if (f && typeof f.source !== "string") f.source = f?.source ?? "Manual entry"; return f; };
  const fixItems = (items: any) => { if (Array.isArray(items)) for (const i of items) if (i && i.food) fixFood(i.food); };
  if (Array.isArray(v.foods)) v.foods.forEach(fixFood);
  fixItems(v.items);
  if (Array.isArray(v.meals)) for (const m of v.meals) fixItems(m?.items);
  if (Array.isArray(v.feedback)) for (const f of v.feedback) fixItems(f?.meal?.items);
  return v;
}
export function parseState(raw: string): PilotState {
  const v = repairState(JSON.parse(raw));
  if (
    v?.version !== 1 ||
    !v.goals ||
    !KEYS.every(
      (k) =>
        v.goals[k] === null ||
        (typeof v.goals[k] === "number" &&
          Number.isFinite(v.goals[k]) &&
          v.goals[k] >= 0),
    ) ||
    !Array.isArray(v.foods) ||
    !v.foods.every(isFood) ||
    !Array.isArray(v.items) ||
    !v.items.every(isItem) ||
    !Array.isArray(v.meals) ||
    !v.meals.every(isMeal) ||
    !Array.isArray(v.feedback) ||
    !v.feedback.every(
      (f: any) =>
        f &&
        typeof f.id === "string" &&
        isMeal(f.meal) &&
        ["prepared", "eaten", "not-used"].includes(f.status) &&
        typeof f.taste === "string" &&
        typeof f.notes === "string" &&
        typeof f.createdAt === "string",
    ) ||
    typeof v.preferences !== "string" ||
    typeof v.title !== "string" ||
    !(
      v.portion === null ||
      (typeof v.portion === "number" &&
        Number.isFinite(v.portion) &&
        v.portion > 0)
    )
  )
    throw new Error(
      "This isn't a Chef Mealan backup. Nothing was changed.",
    );
  return v;
}
// A serving as the label read returns it: grams between 5 and 500 and a short unit name, or nothing
export function servingOf(x: any): { grams: number; name: string } | undefined {
  if (!x || typeof x !== "object") return undefined;
  const grams = Number(x.grams), name = typeof x.name === "string" ? x.name.trim().slice(0, 20) : "";
  if (!Number.isFinite(grams) || grams < 5 || grams > 500) return undefined;
  return { grams: Math.round(grams), name: name || "serving" };
}
// Whole servings of a counted food that reach at least the grams asked for, never under one
export const servingsFor = (f: Food, grams: number) => (f.serving ? Math.max(1, Math.ceil(grams / f.serving.grams - 1e-9)) : null);
export const snapToServing = (f: Food, grams: number) => (f.serving ? servingsFor(f, grams)! * f.serving.grams : grams);
export const servingLabel = (f: Food, grams: number) => { if (!f.serving) return null; const n = Math.round((grams / f.serving.grams) * 10) / 10; const whole = Number.isInteger(n); return `${whole ? n : n.toFixed(1)} ${f.serving.name}${n === 1 ? "" : "s"}`; };
export function candidateFood(input: any, source: string): Food {
  return {
    id: uid(),
    name: typeof input.product_name === "string" ? input.product_name : "",
    brand: typeof input.brand === "string" && !/^\s*(unknown|n\/?a|none|-)?\s*$/i.test(input.brand) ? input.brand : "",
    barcode: typeof input.barcode === "string" ? input.barcode : undefined,
    serving: servingOf(input.serving),
    basis: "100g",
    source,
    notes: typeof input.notes === "string" ? input.notes : "",
    reviewedAt: "",
    readyToEat: false,
    ...Object.fromEntries(KEYS.map((k) => [k, numberInput(input[k])])),
    table: Array.isArray(input.table) && input.table.length ? rowsFromRaw(input.table, /Open Food Facts/i.test(source) ? "database" : "label") : undefined,
  } as Food;
}
