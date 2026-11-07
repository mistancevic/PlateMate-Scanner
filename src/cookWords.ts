// A cook's words for a food (DT88, board Stories58; Milan 24 October 12:12). The food's name keeps its state after a comma,
import { w, wIn, type Val, type WordKey } from "./words";
// as the database writes it: "Penne, dry", "Chicken breast, cooked". A cook says "135 g dry penne" and weighs it dry, so the
// screens show the short name and how to weigh it. The food and its numbers do not change; only the words on the screen.
// DT91 (0.2.88): what a cook does with it: a food that goes in the pot raw or dry is cooked by the steps; a food sold cooked is
// weighed cooked, and for meat, fish, pasta and grains the screen says about how much that is raw or dry.

export type CookState = "dry" | "raw" | "cooked" | "boiled" | "drained" | "uncooked";
const STATE_RE = /^(.*?),\s*(dry|raw|cooked|boiled|drained|uncooked)\s*$/i;

// "Penne, dry" -> { short: "Penne", state: "dry" }; a name without a state stays as it is
export function cookName(name: string): { short: string; state: CookState | null } {
  const m = String(name ?? "").trim().match(STATE_RE);
  return m ? { short: m[1].trim(), state: m[2].toLowerCase() as CookState } : { short: String(name ?? "").trim(), state: null };
}
// how to weigh it, under the short name on the plate: weigh it dry
export function weighLine(name: string): string | null {
  const { state } = cookName(name);
  if (!state) return null;
  return state === "uncooked" || state === "raw" ? w("cook.weighRaw") : state === "drained" ? w("cook.weighDrained") : state === "dry" ? w("cook.weighDry") : state === "cooked" ? w("cook.weighCooked") : w("cook.weighBoiled");
}
// the food as a cook says it, with its amount: 135 g dry penne, 150 g cooked chicken breast, 80 g chickpeas, drained
const PHRASE: Record<CookState, WordKey> = { dry: "cook.phraseDry", raw: "cook.phraseRaw", uncooked: "cook.phraseRaw", cooked: "cook.phraseCooked", boiled: "cook.phraseBoiled", drained: "cook.phraseDrained" };
export function cookPhrase(name: string, grams: number): string {
  const { short, state } = cookName(name);
  return w(state ? PHRASE[state] : "cook.phrase", { grams: Math.round(grams), food: lowerName(short) });
}
// lower case for the running text, as the chips always were, except names of places and words in capitals (Greek, PD)
function lowerName(s: string): string {
  return s.split(/\s+/).map((w) => (/^(Greek|Icelandic|Dijon|Parma|Mozzarella di)$/.test(w) || /^[A-Z0-9%]{2,}$/.test(w) ? w : w.toLowerCase())).join(" ");
}
// the food the plate is built around, for the head and the lines: "chicken breast"; more than one food: "foods"
// DT243 part two: in the app's language, as it fills a slot of another line
export function aroundWord(names: string[]): string {
  if (names.length !== 1) return w("cook.aroundFoods");
  return lowerName(cookName(names[0]).short);
}
// as a recipe saves it (Chef Mealan's dinner, byChef.around): "foods" stays the saved word; aroundV puts it in a line
export function aroundSaved(names: string[]): string {
  return names.length !== 1 ? "foods" : aroundWord(names);
}
export const aroundV = (saved: string): Val => (l) => (saved === "foods" ? wIn(l, "cook.aroundFoods") : saved);

const MEAT = /\b(chicken|turkey|beef|pork|lamb|veal|steak|mince|minced|salmon|tuna|cod|fish|trout|duck|breast|thigh)\b/i;
const PASTA = /\b(pasta|penne|spaghetti|fusilli|macaroni|noodles?|tagliatelle|linguine|rigatoni)\b/i;
const GRAIN = /\b(rice|bulgur|couscous|quinoa|barley|buckwheat|millet|oats?)\b/i;
// DT89: a plate with a food you cook gets steps, never the bowl ways. Raw, dry or uncooked is cooked by the steps.
// Only foods that are cooked before eating: raw almonds or dry fruit stay a ready food.
export function needsCooking(name: string): boolean {
  const n = String(name ?? "");
  if (!/\b(raw|dry|uncooked)\b/i.test(n)) return false;
  const short = cookName(n).short;
  if (/\boats?\b/i.test(short)) return false; // oats are eaten as they are too: muesli, overnight oats
  return MEAT.test(short) || PASTA.test(short) || GRAIN.test(short) || /\b(potato(es)?|eggs?|lentils?|beans?|chickpeas?)\b/i.test(short);
}

// DT216 (0.3.56, board Stories163, rule C40): a food that makes the plate a cooked dish: one that needs cooking by its name
// (raw, dry, uncooked), flour (a batter or a dough: flour with egg or milk is that too), or a raw egg. Coach Milan's crêpes of
// 2 November (eggs, milk, wheat flour, whey, quark, banana) got the bowl steps because none of their names said raw.
export function cookedFood(name: string): boolean {
  if (needsCooking(name)) return true;
  const n = String(name ?? "").toLowerCase();
  if (/\b(flour|mehl|brašno|брашно)\b/.test(n)) return true;
  if (/\b(eggs?|egg whites?|egg yolks?|jaja|jaje|eier|ei)\b/.test(n) && !/\b(boiled|hard|soft|scrambled|fried|poached|omelett?e?|cooked|powder|pasta|noodles?|salad|mayo|mayonnaise)\b/.test(n)) return true;
  return false;
}

// DT91, rule 4: a cooked food on the plate, said as what you would weigh before cooking. Meat, poultry and fish lose about a
// quarter of their weight (cooked is 75 % of raw); pasta takes up water to about 2.4 times its dry weight, rice and grains
// about 2.5 times. Rounded to 5 g. Only for these: for anything else no line is shown.
export function rawHint(name: string, grams: number): string | null {
  const { short, state } = cookName(name);
  if (state !== "cooked" && state !== "boiled" || !(grams > 0)) return null;
  const r5 = (g: number) => Math.round(g / 5) * 5;
  if (MEAT.test(short)) return w("cook.aboutRaw", { grams: r5(grams / 0.75) });
  if (PASTA.test(short)) return w("cook.aboutDry", { grams: r5(grams / 2.4) });
  if (GRAIN.test(short)) return w("cook.aboutDry", { grams: r5(grams / 2.5) });
  return null;
}

// DT91, rule 2: the base of a meal stays a normal portion, by the kind of food and how it is weighed. Code holds these, not
// the AI. Other bases: from the food's own smallest portion to 300 g.
export function baseRange(name: string, min: number): [number, number] {
  const { short, state } = cookName(name), n = short.toLowerCase();
  const cooked = state === "cooked" || state === "boiled";
  if (PASTA.test(n)) return cooked ? [170, 260] : [70, 110];
  if (/\bpotato/.test(n)) return [200, 400];
  if (GRAIN.test(n)) return cooked ? [150, 250] : [60, 100];
  if (/\b(bread|roll|tortilla|wrap|pita|baguette)\b/.test(n)) return [50, 150];
  return [Math.max(30, min), 300];
}

// DT100 (0.2.90, board Stories62; Milan 24 October 18:55): a title as a cook says it. The model gives Balkan Low-Fat Quark Toast
// Plate; code makes it Quark toast with apple: sentence case, Plate dropped at the end, Bowl of and Plate of at the start, and
// label words (Low-Fat, High-Protein, Protein) at the start. Names of places and kitchens keep their capital. A name the
// person typed is never touched: this runs only on titles Chef Mealan gives.
const PROPER = /^(balkan|italian|mediterranean|german|french|spanish|greek|turkish|indian|thai|chinese|japanese|korean|mexican|american|asian|serbian|croatian|bosnian|bavarian|parmigiano|parmesan|dijon|daam)$/i;
export function cookTitle(raw: string): string {
  let t = String(raw ?? "").replace(/\s+/g, " ").trim();
  if (!t) return t;
  t = t.replace(/^(a |the )?(bowl|plate|dish) of /i, "").replace(/\s+(plate|dish)$/i, "");
  t = t.replace(/^((low|high|reduced)[- ](fat|protein|carb|sugar|calorie)|healthy|quick|easy)\s+/i, "");
  t = t.replace(/\b(low|high)-(fat|protein|carb)\b\s*/gi, "");
  const words = t.split(" ").filter(Boolean).map((w, k) => {
    const core = w.replace(/[^\p{L}\p{N}'-]/gu, "");
    if (PROPER.test(core)) return core.charAt(0).toUpperCase() + core.slice(1).toLowerCase() + w.slice(core.length);
    if (/^[A-Z0-9]{2,}$/.test(core)) return w; // PD, DaaM style words stay
    const low = w.toLowerCase();
    return k === 0 ? low.charAt(0).toUpperCase() + low.slice(1) : low;
  });
  return words.join(" ").trim();
}
