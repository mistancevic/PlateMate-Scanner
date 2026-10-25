// Members' foods (0.2.97, board Stories68, DT115): one catalogue of every reviewed scan, shared by all members. The client
// side: the shape, the market names, which of your foods travel, and the one-line "also seen by members" under a food of yours.
import type { Food } from "./pilot";
import { REGIONS } from "./moments";
import { sameFood, stem } from "./swaps";
import { cookName } from "./cookWords";

export type MemberFood = { key: string; name: string; brand: string; barcode?: string; calories: number | null; protein: number | null; fats: number | null; carbs: number | null; fiber: number | null; serving?: { grams: number; name: string } | null; readyToEat?: boolean; source: string; seenIn: string[]; updatedAt: string };

export const marketName = (id: string) => REGIONS.find((r) => r.id === id)?.name.replace(/, elsewhere$/, "") ?? id;
export const seenLine = (m: Pick<MemberFood, "seenIn">, mine: string | null | undefined) => {
  const ids = m.seenIn ?? [];
  if (!ids.length) return "";
  if (mine && ids.includes(mine)) return `seen in ${marketName(mine)}`;
  return `seen in ${ids.slice(0, 2).map(marketName).join(" and ")}`;
};
// which of your foods travel: reviewed, with numbers, not the basic foods table (shared already), not a photo (never)
export const travels = (f: Food) => Boolean(f.reviewedAt && f.name && f.calories !== null && f.protein !== null && !/reference table/i.test(f.source ?? "") && f.source !== "estimate" && f.source !== "Members' foods" && !/^f-/.test(f.id) && !/typical values/i.test(f.brand ?? ""));
export const toShare = (f: Food) => ({ name: f.name, brand: f.brand ?? "", barcode: f.barcode, calories: f.calories, protein: f.protein, fats: f.fats, carbs: f.carbs, fiber: f.fiber, serving: f.serving ?? null, readyToEat: f.readyToEat !== false, source: f.source ?? "label" });
// a member's food as a food of yours: a copy with the values, the source saying where it came from
export const asMine = (m: MemberFood, uid: () => string): Food => ({
  id: uid(), name: m.name, brand: m.brand, basis: "100g", source: "Members' foods", notes: `Members' foods, checked by a member on ${m.updatedAt.slice(0, 10)}${m.seenIn?.length ? `; ${seenLine(m, null)}` : ""}.`,
  reviewedAt: new Date().toISOString(), readyToEat: m.readyToEat !== false, calories: m.calories, protein: m.protein, fats: m.fats, carbs: m.carbs, fiber: m.fiber,
  ...(m.barcode ? { barcode: m.barcode } : {}), ...(m.serving ? { serving: m.serving } : {}),
} as Food);
// the same food in another state, from the catalogue, for the line under a food of yours: tuna in water under tuna in olive oil
export function alsoSeen(mine: Food, catalogue: MemberFood[]): MemberFood | null {
  const short = cookName(mine.name).short;
  return catalogue.find((m) => m.name.toLowerCase() !== mine.name.toLowerCase() && (sameFood(m.name, short) || sameFood(short, m.name)) && (!mine.barcode || m.barcode !== mine.barcode)) ?? null;
}
export const stemOf = (name: string) => stem(cookName(name).short);
