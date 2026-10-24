// A cook's words for a food (DT88, board Stories58; Milan 24 October 12:12). The food's name keeps its state after a comma,
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
  return state === "uncooked" ? "weigh it raw" : state === "drained" ? "weigh it drained" : `weigh it ${state}`;
}
// the food as a cook says it, with its amount: 135 g dry penne, 150 g cooked chicken breast, 80 g chickpeas, drained
export function cookPhrase(name: string, grams: number): string {
  const { short, state } = cookName(name);
  const g = `${Math.round(grams)} g`, low = lowerName(short);
  if (!state) return `${g} ${low}`;
  if (state === "drained") return `${g} ${low}, drained`;
  return `${g} ${state === "uncooked" ? "raw" : state} ${low}`;
}
// lower case for the running text, as the chips always were, except names of places and words in capitals (Greek, PD)
function lowerName(s: string): string {
  return s.split(/\s+/).map((w) => (/^(Greek|Icelandic|Dijon|Parma|Mozzarella di)$/.test(w) || /^[A-Z0-9%]{2,}$/.test(w) ? w : w.toLowerCase())).join(" ");
}
// the food the plate is built around, for the head and the lines: "chicken breast"; more than one food: "foods"
export function aroundWord(names: string[]): string {
  if (names.length !== 1) return "foods";
  return lowerName(cookName(names[0]).short);
}

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

// DT91, rule 4: a cooked food on the plate, said as what you would weigh before cooking. Meat, poultry and fish lose about a
// quarter of their weight (cooked is 75 % of raw); pasta takes up water to about 2.4 times its dry weight, rice and grains
// about 2.5 times. Rounded to 5 g. Only for these: for anything else no line is shown.
export function rawHint(name: string, grams: number): string | null {
  const { short, state } = cookName(name);
  if (state !== "cooked" && state !== "boiled" || !(grams > 0)) return null;
  const r5 = (g: number) => Math.round(g / 5) * 5;
  if (MEAT.test(short)) return `about ${r5(grams / 0.75)} g raw`;
  if (PASTA.test(short)) return `about ${r5(grams / 2.4)} g dry`;
  if (GRAIN.test(short)) return `about ${r5(grams / 2.5)} g dry`;
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
