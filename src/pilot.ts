import { countOf, gramsOfOne, KINDS } from "./counted";
import { cleanMealNames, cleanCardNames, cleanFoodNames, cleanText1 } from "./entities";
import { rowsFromRaw } from "./labeltable";
import { packOf } from "./canned";
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
  // DT125 (0.2.104): the basic food this is a copy of, its identity in the basic foods table
  refId?: string;
  // a counted food: the pack prints a serving (1 bar 45 g, 1 piece 30 g); what Mealan moves then snaps to whole servings
  serving?: { grams: number; name: string };
  // DT82: a food packed in a liquid (tuna in olive oil): net and drained weight, the liquid, and what the values are per
  pack?: import("./canned").Pack;
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
  // a dish on the plate as one row (0.2.5, canvas S "A dish from the plan"): the recipe's items, n of "of" portions, base grams
  // for one portion; the recipe is never moved by the solver, the portion and a side are the levers
  dish?: { id: string; title: string; of: number; n: number; base: number };
  // what the food does in the dish, as read from a recipe (0.2.16, board IM): a swap keeps it
  role?: string;
  // the dish's part it belongs to (0.2.19, boards IM15 to IM18): Base, Filling, Topping; none when the dish is one list
  part?: string;
  // a counted food (0.2.24, board CT): eggs and bananas by size; the grams stay the truth for the numbers
  count?: import("./counted").Count;
  // an optional food added to the plate (0.2.19, IM12b): Leave it out sends it back to the optional list
  optional?: { written?: string; note?: string };
  // oil a recipe fries in (0.2.38, R3): the grams are what the food takes up, an estimate; pot is the recipe's whole amount
  fry?: { pot: number; written?: string; plate?: boolean };
  // DT82: the oil poured from a can, held with the can's row (its id); it goes when the can goes, and Fit never moves it
  from?: string;
};
// an optional food on the plate, out of the numbers until added (0.2.19, IM12): grams for this plate's portion
export type PlateOpt = { id: string; name: string; written?: string; note?: string; grams: number; food: Food; part?: string };
// a recipe as a dish on the plate: one portion of a batch recipe (two or more foods, a portion well under the batch)
// how many portions the recipe's foods make, as the plate divides them
export function portionsIn(m: Meal): number {
  const total = m.items.reduce((n, i) => n + i.grams, 0);
  return m.portion && total > m.portion * 1.5 ? Math.max(2, Math.round(total / m.portion)) : 1;
}
// R21 (0.2.49, board RS20): how many the recipe makes, as it says (12 fritters), else as the plate divides it; one portion is
// the recipe divided by it, from the exact grams, on the Plate, Plan, the tile, the recipe page and Today alike
export const servingsOf = (m: Pick<Meal, "items" | "portion" | "makes">): number => (m.makes?.n && m.makes.n >= 1 ? m.makes.n : portionsIn(m as Meal));
// DT81: the foods of a recipe sized for n of what it makes (10 sarmas of 8: every food times 10/8)
export const sizedFor = (m: Pick<Meal, "items" | "makes">, n: number): Ingredient[] => (m.makes && m.makes.n > 0 && n !== m.makes.n ? m.items.map((i) => ({ ...i, grams: (i.grams * n) / m.makes!.n })) : m.items);
export function asDish(m: Meal): Ingredient[] {
  const of = servingsOf(m);
  if (m.items.length < 2 || of < 2) return structuredClone(m.items);
  return m.items.map((i) => ({ ...structuredClone(i), locked: true, grams: i.grams / of, dish: { id: m.id, title: m.title, of, n: 1, base: i.grams / of } }));
}
// one portion's numbers, for a tile or a line: One fritter · 650 kcal · 8 g protein · PD 1.2
export function portionOf(m: Meal): { n: number; word: string; kcal: number; protein: number; pd: number | null } | null {
  const t = aggregate(m.items);
  if (t.calories === null || t.protein === null || t.calories <= 0) return null;
  const n = servingsOf(m);
  const word = m.makes?.unit && n > 1 ? m.makes.unit.replace(/ies$/, "y").replace(/(?<!s)s$/, "") : "portion";
  return { n, word, kcal: t.calories / n, protein: t.protein / n, pd: (100 * t.protein) / t.calories };
}
export type Goals = Nutrition;
// What the Publish sheet keeps while a recipe is being made ready for its page (board RG1): a draft, never public
// sent: what the live page holds, kept at Publish (0.2.5+r13, board S4, R12), so the sheet knows what changed since
export type PubContent = { title: string; lines: string; makes: number; servingName: string; minutes: number | null; names: string[]; steps: string[]; grams: number[]; photo?: string | null; photoAi?: boolean };
export type PublishDraft = { title?: string; lines?: string; makes?: string; servingName?: string; minutes?: string; names?: string[]; nameIds?: string[]; photoAt?: number; savedAt?: string; sent?: PubContent; sentAt?: string };
export type PlateKind = "meal" | "dessert";
export type StepMark = { kind: "same" | "adapted" | "added"; why: string };
export type Meal = {
  id: string;
  title: string;
  items: Ingredient[];
  portion: number;
  savedAt: string;
  // the steps live with the recipe, so they are there while cooking and the page takes them from here (RF4 Q1)
  steps?: string[];
  publish?: PublishDraft;
  // Coach's recipes on the Recipes tab (X0, 10 October 2026); a member's recipe kept in Mine (0.2.11, board CO, CO3)
  from?: "coach" | "members";
  memberOf?: string;
  // the cover Chef Mealan drew (0.2.11, board CO, CO1): tried or drawn once, and the drawn picture's fingerprint
  cover?: { state: "drawn" | "tomorrow" | "failed"; day: string };
  coverSig?: string;
  // shared with members (0.2.11, board CO, CO4): where, since when, with which cover and name, in which kitchen
  members?: { id: string; at: string; named: boolean; coverSig: string | null; kitchen: string | null; sent: string };
  kitchen?: string;
  // photos the cook marked as made with AI, by fingerprint (0.2.13): their page says Picture made with AI
  aiSigs?: string[];
  // the recipe's own photos (0.2.5+r10, board S3, R4 to R6): the cover, then up to 5 more; as files in the store and the
  // account, like a food's (photoSigs and photoCount say which, when the photos themselves are not loaded)
  photo?: string;
  photos?: string[];
  photoSigs?: string[];
  photoCount?: number;
  // the published page's photo was taken in once as the cover, so a removed cover never comes back from the page
  pagePhotoTaken?: boolean;
  // what kind of plate this is (Today, 10 October 2026): a meal, or a dessert sized at about a tenth of the day
  kind?: PlateKind;
  // R17 (0.2.45, board RS16): Chef Mealan's idea for a craving, kept until it is made once or removed
  idea?: { at: string; craving?: string };
  // where it came from (0.2.16, board IM, IM6): the account or site as text, the link, when; members and public pages get
  // the text only. The screenshots are the cook's own reference (shots, as files src:<id>:<n>), never a cover, never shared.
  // steps: the original method as read (0.2.18, board IM, IM9b): for the person only, never shared or published
  // photo (0.2.44, R16): the page's own photo of the dish, an https address, for the person only, like the screenshots
  source?: { name: string; url?: string; from: "screenshot" | "link"; at: string; shotSigs?: string[]; steps?: string[]; foods?: string[]; photo?: string };
  // the foods Chef Mealan's steps were written for (0.2.25, RP1c): changed foods since, and a line says so
  stepsFor?: string[];
  // 0.2.96: the bowl way the steps came from (All in one, Topped, Protein first), when they did
  way?: string;
  // optional ingredients the recipe names (0.2.18, IM8): kept out of the numbers, whole-recipe grams, added when cooking
  optional?: { name: string; written: string; note?: string; grams: number; food: Food; part?: string }[];
  // the part of each step, aligned with steps (0.2.19, IM17); none when the recipe is one list
  stepParts?: string[];
  // a dish changed on the plate and kept as its own recipe (0.2.23, IM23b): the recipe it was adapted from
  basedOn?: { id: string; title: string };
  // DT90 (0.2.87, board Stories58): Chef Mealan's dinner, made around your food: the recipe page says so
  byChef?: { kitchen: string; meal: string; around: string; at: string };
  // DT91 (0.2.88, board Stories59): for cooking, not counted: dried oregano, salt and pepper
  cooking?: string[];
  // the recipe's own numbers per serving, as it gives them (0.2.21, IM21b): shown under ours on the recipe page
  stated?: { kcal: number; protein: number; fats: number | null; carbs: number | null };
  // how each of Chef Mealan's steps relates to the original (0.2.18, IM9, IM10b); cleared when the steps are edited
  stepMarks?: StepMark[];
  stepsKitchen?: string;
  shots?: string[];
  // how many the whole recipe makes, as read or guessed (IM3)
  makes?: { n: number; unit: string };
  // DT81 (Milan 23 October 13:26 and 15:11): one recipe, a batch each time you cook it. cook: how many you will make next
  // time (10 sarmas of a recipe that makes 8: every food times 10/8). batch: the last batch, sized for cooked and counted
  // after: it made 11, so one sarma of it is a 11th of what was cooked
  cook?: { n: number };
  batch?: { cooked: number; made: number; at: string };
  // a swap or a side cooked and judged (IM5, IM5b): Did it work?
  tried?: { kind: "change" | "side"; what: string; result: "yes" | "ok" | "no"; at: string }[];
};
export type Feedback = {
  id: string;
  meal: Meal;
  status: "prepared" | "eaten" | "not-used";
  // portions left of a whole recipe made (0.2.20, board IM19): the card stays on Today, day after day, until eaten or removed
  left?: number;
  // R12 (0.2.38): what one of the portions left is, in your words: lunch, or the recipe's fritter
  leftOf?: string;
  // R5 (0.2.42): a meal eaten as a snack off the plan says so; a meal of the day keeps its slot
  which?: string;
  taste: string;
  notes: string;
  createdAt: string;
  photo?: string;
  shared?: { reason: "look" | "ok" | "help"; at: string };
  moment?: string;
  dayType?: string;
  // Save in My recipes from the card (Y1, 10 October 2026)
  recipeId?: string;
  // the photo ask on the card when the recipe's cover is drawn (0.2.11, board CO, CO1b, CO1c)
  coverAsk?: "later" | "kept" | "used";
  // the swap or side this meal was cooked with, and whether it worked (0.2.16, board IM)
  tried?: { kind: "change" | "side"; what: string; result: "yes" | "ok" | "no" };
  // the meal's photos and how making it went (M1 activity 6, 10 October 2026)
  photos?: string[];
  prep?: { went: "as" | "not"; different?: string };
  ate?: "all" | "portion";
  // how the meal carried the person, asked on Today 30 minutes after (M1 activity 8, 10 October 2026)
  // R20 (0.2.48, board RS19): the moment it was eaten in, and the recipe's foods as they were (recipeSig), so an answer from
  // before a change stops counting
  carry?: { how: "light" | "fine" | "heavy"; at: string; moment?: { meal: string; day?: "training" | "rest"; training?: "before" | "after" }; sig?: string };
  // eaten for a slot of the plan (0.2.3, canvas S Today through the day): by the plan; a card without a slot is extra
  slot?: { date: string; slotId: string; name: string; time: string };
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
  // the recipe the plate came from, when it came in from a screenshot or a link (0.2.16, board IM): How was it points at it
  fromRecipe?: string;
  // 0.2.19 (IM12, IM16b): the plate's optional foods, and the parts left out with their foods (Put it back restores them)
  optional?: PlateOpt[];
  leftOut?: { part: string; items: Ingredient[]; at?: number }[];
  // R2 (0.2.32): a part whose last food was taken off stays, empty, where it was, until a food goes back in or the plate changes
  emptyParts?: { part: string; at: number }[];
  // DT91 (0.2.88): the herbs and spices Chef Mealan's dinner on the plate uses, not counted
  cooking?: string[];
  // DT102 (0.2.91): the foods the cooking list was written for; the chips live only while all of them are on the plate
  cookingFor?: string[];
  // DT109 (0.2.93): the recipe's foods as they stand on the plate (a swap keeps the link, the new food takes the old one's
  // place here); the link to the recipe (fromRecipe) lives only while at least half of them are on the plate
  recipeFoods?: string[];
  // a recipe that came in, opened from Recipes (0.2.19, IM13): the plate puts it on as the first time, then clears this
  openRecipe?: string;
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
  // a counted food (0.2.24, board CT): an egg or a banana lands on whole ones, as a pack's piece does
  const cnt = countOf(selected);
  const f = cnt && !selected.food.serving ? { ...selected.food, serving: { grams: gramsOfOne(cnt), name: KINDS[cnt.kind].one } } : selected.food,
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
  let grams = f.serving ? (lifts ? snapToServing(f, exactGrams) : Math.max(1, Math.floor(exactGrams / f.serving.grams + 1e-9)) * f.serving.grams) : Math.round(exactGrams);
  // a dense food (a protein powder) moves the plate more than 0.05 a gram: the whole gram that lands at or just above the
  // target stands, never the plate left as it was (12 October 2026: Fit kept 100 g of whey, PD 13 against 6.9)
  if (!f.serving) {
    const pdAt = (g: number) => { const r = aggregate(items.map((x) => (x.id === id ? { ...x, grams: g } : x))); return density(r.protein, r.calories); };
    const near = pdAt(grams);
    if (near === null || Math.abs(near - target) > 0.05) { const up = lifts ? Math.ceil(exactGrams) : Math.floor(exactGrams); if ((pdAt(up) ?? -1) >= target) grams = up; }
  }
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
  // a counted food lands on whole servings, and a dense one on the gram just above, so either may overshoot the target;
  // otherwise a food in grams lands within 0.05
  const overshootOk = actualPD !== null && actualPD >= target && (Boolean(f.serving) || Math.abs(grams - exactGrams) < 1);
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
  // a sweetener such as erythritol has no energy and carbohydrate (polyols): a real food, as labels show it (0.2.21,
  // Milan 17 October 2026, 14:02); protein or fat with no energy still can't be right
  if (food.calories === 0 && ((food.protein ?? 0) > 0.5 || (food.fats ?? 0) > 0.5))
    errors.push(
      "Zero energy conflicts with protein or fat. Check the label.",
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
  // R1 (0.2.29): a recipe read before kept the page's codes in its names (Sally&#039;s Baking); they read as letters now
  if (Array.isArray(v.meals)) v.meals = v.meals.map(cleanMealNames);
  if (Array.isArray(v.feedback)) v.feedback = v.feedback.map(cleanCardNames);
  if (Array.isArray(v.foods)) v.foods = v.foods.map(cleanFoodNames);
  v.title = cleanText1(v.title);
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
    ...(packOf(input.pack) ? { pack: packOf(input.pack) } : {}),
    basis: "100g",
    source,
    notes: typeof input.notes === "string" ? input.notes : "",
    reviewedAt: "",
    readyToEat: false,
    ...Object.fromEntries(KEYS.map((k) => [k, numberInput(input[k])])),
    table: Array.isArray(input.table) && input.table.length ? rowsFromRaw(input.table, /Open Food Facts/i.test(source) ? "database" : "label") : undefined,
  } as Food;
}
