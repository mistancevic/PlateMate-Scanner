// The mix tip: a scanned food that doesn't fit the plate on its own, and what to mix it with.
// Pure code. The case comes from the number, the partners from the moment and the roles, the amounts from the solver.
// The model never picks a partner; it may only word the Pro tip below.
import { aggregate, density, solveIngredient, uid, type Food, type Ingredient } from "./pilot";
import { jobOf, PORTION, type Job } from "./foodjob";
import { roleOf } from "./swaps";
import { playbookFor } from "./playbook";
import type { MomentId } from "./moments";

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
  const all = [scanned, ...partners], jobs = all.map((f) => jobOf(f).job);
  const sweet = all.some((f) => jobOf(f).taste === "sweet" || jobOf(f).job === "Flavour food");
  if (sweet && jobs.includes("Protein base")) return "DaaM dessert";
  if (kcal <= SNACK_KCAL || snackMoment) return "snack";
  const side = jobs.some((j) => j === "Carb base" || j === "Fat source" || j === "Mixed");
  return jobs.includes("Protein base") && side ? "meal" : "snack";
}
// A portion to start from. The job's typical portion, except a supplement, which is a scoop, not a plate.
const portionOf = (f: Food) => (roleOf(f.name) === "supplement" ? 30 : PORTION[jobOf(f).job]);
// Which neutral grain goes with what: oats and bread with sweet, rice and pasta with savoury. A nudge in the order, nothing more.
const grainFit = (scanned: Food, p: Food) => {
  if (roleOf(p.name) !== "grain") return 0;
  const sweet = jobOf(scanned).taste === "sweet" || jobOf(scanned).job === "Flavour food";
  const breakfast = /oat|hafer|müsli|muesli|granola|bread|brot|toast/i.test(p.name);
  return sweet === breakfast ? -1 : 1;
};

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
    if (!r.ok || r.grams < 10 || r.grams > CAP_GRAMS) return null;
    result = r.items; pd = r.actualPD;
  } else {
    const t = aggregate(items); pd = density(t.protein, t.calories);
    if (pd === null || pd < target) return null;
  }
  const t = aggregate(result);
  if (cap !== null && (t.calories ?? 0) > cap) return null;
  return { partners, items: result, pd, kcal: Math.round(t.calories ?? 0), protein: Math.round(t.protein ?? 0) };
}

// Sweet goes with sweet or neutral, savoury with savoury or neutral. A partner that clashes is out.
const clash = (scanned: Food, p: Food) => { const a = jobOf(scanned).taste, b = jobOf(p).taste; return a !== null && b !== null && a !== b; };

// Candidates for a role, best first: a real portion for the role, library before starter set, favourites first.
function candidates(role: Job, scanned: Food, library: Food[], starter: Food[], ask: Ask, moment: MomentId): Food[] {
  const pool = [...library, ...starter.filter((s) => !library.some((l) => sameName(l, s)))].filter((f) => !sameName(f, scanned));
  return pool
    .filter((f) => jobOf(f).job === role && f.calories !== null && f.protein !== null)
    .filter((f) => ask.cooking || f.readyToEat)
    .filter((f) => !ask.lowFat || fatShare(f) < 0.3)
    .filter((f) => moment !== "before" || playbookFor(f).beforeTraining.ok)
    .filter((f) => moment !== "after" || playbookFor(f).afterTraining.ok)
    .filter((f) => !clash(scanned, f))
    .sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)) || Number(library.includes(b)) - Number(library.includes(a)) || grainFit(scanned, a) - grainFit(scanned, b));
}

// The tip for a scanned food, this moment and this plate's target. kcalCap is the moment's share of the day, if known.
export function mixTip(food: Food, moment: MomentId, target: number | null, library: Food[], starter: Food[], kcalCap: number | null): MixTip {
  const c = mixCase(food, target);
  if (c === "fits") return { case: c, mixes: [], why: "fits this plate as it stands" };
  if (c === "unknown" || target === null) return { case: c, mixes: [], why: "no target or no protein value" };
  const ask = ASKS[moment] ?? ASKS.regular;
  const roles = c === "under" ? ask.under : ask.over;
  const cap = ask.snack ? Math.min(SNACK_KCAL, kcalCap ?? SNACK_KCAL) : kcalCap;
  const firsts = candidates(roles[0], food, library, starter, ask, moment);
  const mixes: Mix[] = [];
  const push = (partners: Food[]) => {
    if (mixes.length >= ask.partners || mixes.some((m) => m.partners.length === partners.length && m.partners.every((p, i) => sameName(p, partners[i])))) return;
    const b = build(food, partners, target, cap, c);
    if (!b) return;
    mixes.push({ ...b, id: uid(), kind: kindOf(food, partners, b.kcal, ask.snack), cooking: partners.some((p) => !p.readyToEat) || !food.readyToEat, fromStarter: partners.filter((p) => !library.includes(p)).map((p) => p.name) });
  };
  // the first mix is one partner; then, where the moment allows, the same partner with a second and a third role on the plate
  for (const f of firsts) { push([f]); if (mixes.length) break; }
  if (mixes.length && roles.length > 1) {
    const second = candidates(roles[1], food, library, starter, ask, moment)[0];
    if (second) {
      push([mixes[0].partners[0], second]);
      const third = roles[2] ? candidates(roles[2], food, library, starter, ask, moment)[0] : null;
      if (third && mixes.length === 2) push([mixes[0].partners[0], second, third]);
    }
  }
  // fill the remaining slots with other single partners, so the person sees an alternative
  for (const f of firsts.slice(1)) { if (mixes.length >= ask.partners) break; push([f]); }
  const why = c === "under" ? `PD ${density(food.protein, food.calories)!.toFixed(1)} is under your ${target.toFixed(1)}: it needs a protein base` : `PD ${density(food.protein, food.calories)!.toFixed(1)} is far over your ${target.toFixed(1)}: alone it is not a meal`;
  return { case: c, mixes, why };
}

export const mixLabel = (m: Mix) => `with ${m.partners.map((p) => p.name).join(" + ")}`;
