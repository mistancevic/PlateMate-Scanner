// Deleting a recipe (0.2.22, canvas board Parts02, IM22 to IM22c; Milan 17 October 2026, 14:28 and 14:34). Before anything
// goes, the card says what goes with the recipe, what others still see, and what stays. Rules the code keeps:
// - goes: the recipe (foods, grams, steps, parts, the original steps, the recipe's own numbers, its optional foods), its
//   photos and screenshots (from the phone and the account, at the next save), the drawn picture and the record of it;
// - seen by others: the Members share and the page on chefmealan.com, each with a tick, on by default; a version waiting
//   for the coach is withdrawn with the page; a page already down or sent back loses its content without a tick;
// - stays: the meals eaten with it (the eating record keeps its foods and grams), portions left, and every food it used:
//   a food holds nothing personal (Milan 14:34). The day's count of drawn pictures stays as it is.
import type { Feedback, Meal, PilotState } from "./pilot";
import { recipePhotosOf, sig } from "./photos";
import { w } from "./words";
import { unitWord, ONE } from "./recipeWords";

export type PageState = "live" | "waiting" | "live+waiting" | "down" | "back" | null;
export type DeletePlan = {
  title: string;
  recipe: string[];
  shots: number;
  photos: number;
  drawn: boolean;
  members: boolean;
  page: PageState;
  eaten: number;
  left: number;
  unit: string;
  foods: number;
};

// the cards that belong to the recipe: made from it, or with its name
export const cardsOf = (m: Pick<Meal, "id" | "title">, cards: Feedback[]) => cards.filter((f) => f.recipeId === m.id || f.meal?.id === m.id || f.meal?.title === m.title);

// DT243 part two: a unit the app saved (portions) through its count line; the recipe's own unit as before
export const countOf = (n: number, unit: string) => `${n} ${unitWord(unit, n, ONE.afterNotS)}`;

export function deletePlan(m: Meal, s: Pick<PilotState, "feedback" | "foods">, pub: { status?: string; waiting?: boolean } | null): DeletePlan {
  const recipe = [w("delrecipe.itsFoodsAndGrams")];
  if (m.steps?.length) recipe.push(w("delrecipe.partSteps"));
  if (m.items.some((i) => i.part)) recipe.push(w("delrecipe.partParts"));
  if (m.optional?.length) recipe.push(w("delrecipe.partOptional"));
  if (m.source?.steps?.length) recipe.push(w("delrecipe.partOriginalSteps"));
  if (m.stated) recipe.push(w("delrecipe.partOwnNumbers"));
  const shots = Array.isArray(m.shots) ? m.shots.length : m.source?.shotSigs?.length ?? 0;
  const sigs = Array.isArray(m.photoSigs) ? m.photoSigs : recipePhotosOf(m).map(sig);
  const drawn = Boolean(m.coverSig && sigs.includes(m.coverSig));
  const cards = cardsOf(m, s.feedback);
  const ids = new Set([...m.items.map((i) => i.food.id), ...(m.optional ?? []).map((o) => o.food.id)]);
  const st = pub?.status;
  const page: PageState = !pub ? null : st === "waiting" ? "waiting" : st === "down" ? "down" : st === "back" ? "back" : pub.waiting ? "live+waiting" : "live";
  return {
    title: m.title, recipe, shots, photos: sigs.filter((x) => x !== m.coverSig).length, drawn,
    members: Boolean(m.members), page,
    eaten: cards.filter((f) => f.status === "eaten").length,
    left: cards.filter((f) => f.status === "prepared").reduce((n, f) => n + Math.max(0, f.left ?? 0), 0),
    unit: m.makes?.unit || "portions",
    foods: s.foods.filter((f) => ids.has(f.id)).length,
  };
}

// The recipe leaves the state. The cards keep what was eaten (title, foods, grams); what was the recipe's own goes with it.
export function forgetRecipe<S extends PilotState>(s: S, m: Pick<Meal, "id" | "title">): S {
  const mine = new Set(cardsOf(m, s.feedback).map((f) => f.id));
  const lean = (x: Meal): Meal => {
    const { steps: _s, stepParts: _sp, stepMarks: _sm, stepsKitchen: _sk, shots: _sh, publish: _p, members: _mb, optional: _o, stated: _st, cover: _c, coverSig: _cs, aiSigs: _ai, tried: _t, photo: _ph, photos: _phs, photoSigs: _psg, photoCount: _pc, pagePhotoTaken: _pp, ...rest } = x;
    if (rest.source) rest.source = { name: rest.source.name, from: rest.source.from, at: rest.source.at };
    return rest as Meal;
  };
  return {
    ...s,
    meals: s.meals.filter((x) => x.id !== m.id),
    feedback: s.feedback.map((f) => (mine.has(f.id) && f.meal ? { ...f, meal: lean(f.meal) } : f)),
    ...(s.fromRecipe === m.id ? { fromRecipe: undefined } : {}),
    ...(s.openRecipe === m.id ? { openRecipe: undefined } : {}),
  };
}

// IM22c: the line on Recipes after, saying what was done
export function deletedLine(p: DeletePlan, did: { members: boolean; page: boolean }, approver: string): string {
  // DT243 part two: each whole sentence a line of its own (delrecipe.done*, delrecipe.leaves*)
  const down = did.page && (p.page === "live" || p.page === "live+waiting"), off = did.page && p.page === "waiting";
  const done = did.members ? (down ? w("delrecipe.doneMembersDown") : off ? w("delrecipe.doneMembersWithdrawn", { who: approver }) : w("delrecipe.doneMembers"))
    : down ? w("delrecipe.doneDown") : off ? w("delrecipe.doneWithdrawn", { who: approver }) : "";
  const pics = p.photos + (p.drawn ? 1 : 0);
  const files = p.shots ? (p.shots === 1 ? w("delrecipe.leavesShot") : w("delrecipe.leavesShots")) : pics ? (pics === 1 ? w("delrecipe.leavesPicture") : w("delrecipe.leavesPictures")) : "";
  return [done, files].filter(Boolean).join(" ");
}
