// The mix tip: a scanned food that doesn't fit the plate on its own, and what to mix it with.
// Pure code. The case comes from the number, the partners from the moment and the roles, the amounts from the solver.
// The model never picks a partner; it may only word the Pro tip below.
import { aggregate, density, solveIngredient, snapToServing, uid, type Food, type Ingredient } from "./pilot";
import { jobOf, PORTION, minPortionOf, type Job } from "./foodjob";
import { roleOf } from "./swaps";
import { playbookFor } from "./playbook";
import type { MomentId } from "./moments";
import type { DayType } from "./personal";
import { preTraining, proteinFloor } from "./fitness";
import { blockedByAllergy } from "./safety";

export type MixCase = "fits" | "under" | "over" | "unknown";
export type MixKind = "DaaM dessert" | "meal" | "snack";
export type Mix = { id: string; partners: Food[]; items: Ingredient[]; pd: number; kcal: number; protein: number; kind: MixKind; cooking: boolean; fromStarter: string[] };
export type MixTip = { case: MixCase; mixes: Mix[]; why: string };

export const SNACK_KCAL = 300; // under this line a mix is a snack, whatever is in it
const CAP_GRAMS = 300;        // a partner never gets more than this; the amount has to be a real portion

// What each moment asks for. Order matters: the first role is the one the solver moves.
type Ask = { under: Job[]; over: Job[]; cooking: boolean; partners: number; snack: boolean; lowFat: boolean };
const ASKS: Record<MomentId, Ask> = {
  regular:     { under: ["Protein base", "Carb base", "Volume food"], over: ["Carb base", "Volume food", "Fat source"], cooking: true,  partners: 3, snack: false, lowFat: false },
  before:      { under: ["Protein base"],                             over: ["Carb base", "Flavour food"],              cooking: false, partners: 2, snack: true,  lowFat: true },
  after:       { under: ["Protein base", "Carb base"],                over: ["Carb base"],                              cooking: true,  partners: 2, snack: false, lowFat: false },
  meeting:     { under: ["Protein base"],                             over: ["Flavour food", "Carb base"],              cooking: false, partners: 2, snack: true,  lowFat: false },
  travel:      { under: ["Protein base"],                             over: ["Flavour food", "Carb base"],              cooking: false, partners: 2, snack: true,  lowFat: false },
  celebration: { under: ["Protein base"],                             over: ["Flavour food", "Carb base"],              cooking: false, partners: 2, snack: true,  lowFat: false },
  afterwork:   { under: ["Protein base"],                             over: ["Flavour food", "Carb base"],              cooking: false, partners: 2, snack: true,  lowFat: false },
};

// The case: on its own, does the food fit this plate's target? Over means it is a protein base that is not a meal alone.
export function mixCase(food: Food, target: number | null): MixCase {
  const pd = density(food.protein, food.calories);
  if (pd === null || target === null) return "unknown";
  if (pd < target) return "under";
  if (pd >= target * 2 && pd >= 8) return "over";
  return "fits";
}

const fatShare = (f: Food) => (f.calories ? ((f.fats ?? 0) * 9) / f.calories : 0);
const sameName = (a: Food, b: Food) => a.id === b.id || a.name.trim().toLowerCase() === b.name.trim().toLowerCase();

function kindOf(scanned: Food, partners: Food[], kcal: number, snackMoment: boolean): MixKind {
  const all = [scanned, ...partners], jobs = all.map((f) => jobOf(f).job), cats = all.map(catOf);
  const sweet = cats.some((c) => c === "sweet" || c === "spread" || c === "fruit");
  const dairy = cats.some((c) => c === "dairy" || c === "cottage" || c === "supplement");
  if (sweet && dairy) return "DaaM dessert";
  if (kcal <= SNACK_KCAL || snackMoment) return "snack";
  const side = jobs.some((j) => j === "Carb base" || j === "Fat source" || j === "Mixed");
  return jobs.includes("Protein base") && side ? "meal" : "snack";
}
// A portion to start from. The job's typical portion, except a supplement, which is a scoop, not a plate.
const portionOf = (f: Food) => (f.serving ? f.serving.grams : roleOf(f.name) === "supplement" ? 30 : PORTION[jobOf(f).job]);


// One mix: the scanned food at its portion, the partners at theirs. Under target the first partner is solved up to the
// target. Over target nothing is solved: a protein base stays a protein base, the partners make it a meal at their
// portions, and the plate only has to stay on or above the target.
function build(scanned: Food, partners: Food[], target: number, cap: number | null, c: MixCase): Omit<Mix, "id" | "kind" | "cooking" | "fromStarter"> | null {
  const items: Ingredient[] = [
    { id: uid(), food: scanned, grams: portionOf(scanned), locked: true } as Ingredient,
    ...partners.map((p, i) => ({ id: uid(), food: p, grams: portionOf(p), locked: c === "over" || i !== 0 } as Ingredient)),
  ];
  let result = items, pd: number | null;
  if (c === "under") {
    const r = solveIngredient(items, items[1].id, target, null);
    if (!r.ok || r.grams > CAP_GRAMS) return null;
    // a real portion: the moved partner never goes under its minimum; the plate then lands above the target, which still fits
    const floor = minPortionOf(partners[0]);
    if (r.grams < floor) { result = r.items.map((x) => (x.id === items[1].id ? { ...x, grams: floor } : x)); const t = aggregate(result); pd = density(t.protein, t.calories); if (pd === null) return null; }
    else { result = r.items; pd = r.actualPD; }
  } else {
    const t = aggregate(items); pd = density(t.protein, t.calories);
    if (pd === null || pd < target) return null;
  }
  const t = aggregate(result);
  if (cap !== null && (t.calories ?? 0) > cap) return null;
  return { partners, items: result, pd, kcal: Math.round(t.calories ?? 0), protein: Math.round(t.protein ?? 0) };
}

// ---- Culinary rules, version 1 (3 October 2026). Code, not the model. What a cook takes for granted; cuisines, heat and allergies wait for the session.
export type Cat = "sweet" | "fruit" | "spread" | "dairy" | "cottage" | "supplement" | "meat" | "bgrain" | "mgrain" | "nut" | "veg" | "fat" | "drink" | "sauce" | "other";
const SAUCE = /sauce|sugo|passata|ketchup|pesto|dressing|salsa|mayo|senf|mustard|soße|sosse|curry paste|tomatensauce|tomato sauce/i;
const SPREAD = /nutella|spread|aufstrich|creme|crème|peanut ?butter|erdnussmus|nussmus|honig|honey|jam|marmelade|konfit/i;
const BREAKFAST = /oat|hafer|müsli|muesli|granola|bread|brot|toast|knäcke|cracker/i;
const MILK = /milk|milch|kefir|buttermilk/i;
export function catOf(f: Food): Cat {
  const { job, taste } = jobOf(f), role = roleOf(f.name), n = f.name;
  if (job === "Drink" && !MILK.test(n)) return "drink";
  if (role === "supplement") return "supplement";
  if (SAUCE.test(n)) return "sauce";
  if (SPREAD.test(n)) return "spread";
  if (/cottage|hüttenk|ricotta/i.test(n)) return "cottage";
  if (role === "dairy" || MILK.test(n)) return "dairy";
  if (role === "savoury") return "meat";
  if (role === "grain") return BREAKFAST.test(n) ? "bgrain" : "mgrain";
  if (role === "sweet") return "sweet";
  if (role === "fruit") return "fruit";
  if (role === "nut") return "nut";
  if (job === "Fat source") return "fat";
  if (job === "Volume food") return "veg";
  if (taste === "sweet") return "sweet";
  return "other";
}
// Who goes with whom. Sweet with dairy, savoury with meal grains, dairy both ways, cottage cheese also savoury, whey a dessert ingredient, drinks never.
const GOES: Record<Cat, Cat[]> = {
  sweet:      ["dairy", "cottage", "supplement", "bgrain", "fruit", "nut", "spread", "sweet"],
  fruit:      ["dairy", "cottage", "supplement", "bgrain", "nut", "sweet", "spread", "fruit"],
  spread:     ["dairy", "cottage", "supplement", "bgrain", "sweet", "fruit", "nut"],
  dairy:      ["sweet", "fruit", "spread", "bgrain", "nut", "supplement", "dairy", "cottage"],
  cottage:    ["sweet", "fruit", "spread", "bgrain", "nut", "supplement", "dairy", "cottage", "meat", "mgrain", "veg", "other"],
  supplement: ["dairy", "cottage", "bgrain", "fruit", "sweet", "nut", "spread"],
  meat:       ["mgrain", "veg", "cottage", "fat", "meat", "other", "sauce"],
  bgrain:     ["dairy", "cottage", "supplement", "sweet", "fruit", "spread", "nut"],
  mgrain:     ["meat", "cottage", "veg", "fat", "other", "mgrain", "sauce"],
  nut:        ["sweet", "fruit", "dairy", "cottage", "supplement", "bgrain", "spread"],
  veg:        ["meat", "mgrain", "cottage", "fat", "other", "sauce"],
  fat:        ["meat", "mgrain", "veg", "other", "sauce"],
  other:      ["meat", "mgrain", "veg", "fat", "cottage", "other", "sauce"],
  // a sauce is savoury and goes on a meal: with meat, a meal grain, vegetables; never alone with dairy or sweet
  sauce:      ["meat", "mgrain", "veg", "fat", "other"],
  drink:      [],
};
export const goesWith = (a: Food, b: Food) => GOES[catOf(a)].includes(catOf(b)) && GOES[catOf(b)].includes(catOf(a));
// A spread needs a carrier: bread, oats or dairy. Fruit alone is not a carrier.
const spreadWithoutCarrier = (all: Food[]) => all.some((f) => catOf(f) === "spread") && !all.some((f) => ["bgrain", "dairy", "cottage", "supplement"].includes(catOf(f)));
// Every food on the plate must go with every other, and a spread must have its carrier.
export function plateOk(all: Food[]): boolean {
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) if (!goesWith(all[i], all[j])) return false;
  return !spreadWithoutCarrier(all);
}

// Candidates for a role, best first: a real portion for the role, library before starter set, favourites first.
function candidates(role: Job, scanned: Food, library: Food[], starter: Food[], ask: Ask, moment: MomentId, allergies: string[] = []): Food[] {
  // a declared allergy or intolerance: the food is never a partner, whatever else says
  const pool = [...library, ...starter.filter((s) => !library.some((l) => sameName(l, s)))].filter((f) => !sameName(f, scanned)).filter((f) => !blockedByAllergy(f, allergies));
  return pool
    .filter((f) => jobOf(f).job === role && f.calories !== null && f.protein !== null)
    .filter((f) => ask.cooking || f.readyToEat)
    .filter((f) => !ask.lowFat || fatShare(f) < 0.3)
    .filter((f) => moment !== "before" || playbookFor(f).beforeTraining.ok)
    .filter((f) => moment !== "after" || playbookFor(f).afterTraining.ok)
    .filter((f) => catOf(f) !== "drink")
    .filter((f) => goesWith(scanned, f))
    .sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)) || Number(library.includes(b)) - Number(library.includes(a)));
}

// The tip for a scanned food, this moment and this plate's target. kcalCap is the moment's share of the day, if known.
export type MixOpts = { weightKg?: number | null; dayType?: DayType; allergies?: string[] };
export function mixTip(food: Food, moment: MomentId, target: number | null, library: Food[], starter: Food[], kcalCap: number | null, opts: MixOpts = {}): MixTip {
  // fitness rule: before training the job is energy; a carb food the playbook clears fits as it is, whatever its PD
  if (moment === "before") {
    const pre = preTraining(food, playbookFor(food), opts.weightKg, opts.dayType ?? "passive");
    if (pre.fits) return { case: "fits", mixes: [], why: pre.reason };
  }
  const c = mixCase(food, target);
  if (c === "fits") return { case: c, mixes: [], why: "fits this plate as it stands" };
  if (c === "unknown" || target === null) return { case: c, mixes: [], why: "no target or no protein value" };
  const ask = ASKS[moment] ?? ASKS.regular;
  const roles = c === "under" ? ask.under : ask.over;
  const cap = ask.snack ? Math.min(SNACK_KCAL, kcalCap ?? SNACK_KCAL) : kcalCap;
  const firsts = candidates(roles[0], food, library, starter, ask, moment, opts.allergies ?? []);
  const mixes: Mix[] = [];
  const floor = moment === "after" ? proteinFloor(opts.weightKg) : null;
  const push = (partners: Food[]) => {
    if (mixes.length >= ask.partners || mixes.some((m) => m.partners.length === partners.length && m.partners.every((p, i) => sameName(p, partners[i])))) return;
    if (!plateOk([food, ...partners])) return;
    let b = build(food, partners, target, cap, c);
    if (!b) return;
    // fitness rule: after training the plate reaches the protein floor; the protein base grows to get there, within a real portion
    if (floor !== null && b.protein < floor) {
      const base = b.items.find((i) => jobOf(i.food).job === "Protein base" && (i.food.protein ?? 0) > 0);
      if (!base) return;
      const need = floor - b.protein, extra = Math.ceil((need / (base.food.protein as number)) * 100 / 5) * 5;
      const grown = snapToServing(base.food, base.grams + extra);
      if (grown > 400) return;
      const items = b.items.map((i) => (i.id === base.id ? { ...i, grams: grown } : i));
      const t = aggregate(items), pd = density(t.protein, t.calories);
      if (pd === null || (cap !== null && (t.calories ?? 0) > cap)) return;
      b = { ...b, items, pd, kcal: Math.round(t.calories ?? 0), protein: Math.round(t.protein ?? 0) };
    }
    mixes.push({ ...b, id: uid(), kind: kindOf(food, partners, b.kcal, ask.snack), cooking: partners.some((p) => !p.readyToEat) || !food.readyToEat, fromStarter: partners.filter((p) => !library.includes(p)).map((p) => p.name) });
  };
  // the first mix is one partner; then, where the moment allows, the same partner with a second and a third role on the plate
  for (const f of firsts) { push([f]); if (mixes.length) break; }
  if (mixes.length && roles.length > 1) {
    const first = mixes[0].partners[0];
    const second = candidates(roles[1], food, library, starter, ask, moment, opts.allergies ?? []).find((f) => plateOk([food, first, f]));
    if (second) {
      push([first, second]);
      const third = roles[2] ? candidates(roles[2], food, library, starter, ask, moment, opts.allergies ?? []).find((f) => plateOk([food, first, second, f])) : null;
      if (third && mixes.length === 2) push([first, second, third]);
    }
  }
  // fill the remaining slots with other single partners, so the person sees an alternative
  for (const f of firsts.slice(1)) { if (mixes.length >= ask.partners) break; push([f]); }
  const why = c === "under" ? `PD ${density(food.protein, food.calories)!.toFixed(1)} is under your ${target.toFixed(1)}: it needs a protein base` : `PD ${density(food.protein, food.calories)!.toFixed(1)} is far over your ${target.toFixed(1)}: alone it is not a meal`;
  return { case: c, mixes, why };
}

export const mixLabel = (m: Mix) => { const first = m.items[0]; const n = first?.food.serving ? `${Math.round(first.grams / first.food.serving.grams)} ${first.food.serving.name}${Math.round(first.grams / first.food.serving.grams) === 1 ? "" : "s"} ` : ""; return `${n}with ${m.partners.map((p) => p.name).join(" + ")}`; };
