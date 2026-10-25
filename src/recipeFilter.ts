// Recipes: one search, drop-downs, filters that stack, a sort (0.2.105, board Stories72, DT126; Milan 25 October 13:48 to
// 14:26). Members and Mine read the same bar. Nothing here renders: a list of rows goes in, the rows to show come out, and
// the lines for the Kitchen and Member drop-downs with their counts. The allergy filter is not here: Members applies it
// before, silent and always on (membersFor).
import { fold } from "./foodId";
import { synonymsOf } from "./reference";

// what the bar needs of a recipe, the same for a recipe of yours and a member's
export type RecipeRow = {
  id: string; title: string; foods: string[]; steps: string[]; kitchen: string | null;
  cook: string;          // the cook's first name, "" when shared without a name
  mine: boolean;         // yours (on Members: shared by you)
  at: string;            // when it came: sharedAt or savedAt
  made: number;          // how many times made
  kcal: number | null;   // one portion
  pd: number | null;     // protein density of the recipe
  shared: "members" | "none";
};
export type Moment = "breakfast" | "lunch" | "snack";
export type Filters = { q: string; kitchen: string | null; member: string | null; shared: RecipeRow["shared"] | null; moment: Moment | null; day: boolean; nocook: boolean; withMine: boolean };
export type Sort = "fit" | "new" | "made" | "pd" | "quick" | "az";
export const EMPTY: Filters = { q: "", kitchen: null, member: null, shared: null, moment: null, day: false, nocook: false, withMine: false };
// "fit" keeps the order the list came in: on Members, at or above your PD target first, then your kitchens (membersFor)
export const SORTS: { id: Sort; label: string }[] = [{ id: "fit", label: "For your day" }, { id: "new", label: "Newest" }, { id: "made", label: "Most made" }, { id: "pd", label: "Highest PD" }, { id: "quick", label: "Quickest" }, { id: "az", label: "A to Z" }];
export const MOMENTS: { id: Moment; label: string }[] = [{ id: "breakfast", label: "Breakfast" }, { id: "lunch", label: "Lunch or dinner" }, { id: "snack", label: "Snack" }];
// the Member drop-down's lines: "you" for your own, "none" for the ones shared without a name, else the cook's name
export const YOU = "you", NONE = "none";

export type Context = { target: number | null; dayKcal: number | null; myFoods: string[]; needsCooking: (name: string) => boolean };

// does the typed word find the recipe: the title, a food in it (in any of the pilot's languages), the cook's name
export function recipeHit(r: RecipeRow, q: string): boolean {
  const w = fold(q); if (!w) return true;
  const hay = fold([r.title, ...r.foods, r.cook, r.kitchen ?? ""].join(" "));
  if (hay.includes(w)) return true;
  return synonymsOf(w).some((s) => hay.includes(fold(s)));
}
// the moment a recipe's portion fits, by its share of the day: under a fifth a snack, a fifth to a third breakfast, from
// three tenths lunch or dinner (breakfast and lunch overlap on purpose: a 30 percent plate is both)
export function momentsOf(kcal: number | null, dayKcal: number | null): Moment[] {
  if (kcal === null || !dayKcal) return ["breakfast", "lunch", "snack"];
  const s = kcal / dayKcal, out: Moment[] = [];
  if (s < 0.2) out.push("snack");
  if (s >= 0.2 && s <= 0.35) out.push("breakfast");
  if (s >= 0.3) out.push("lunch");
  return out;
}
const foodIn = (mine: string[], name: string) => { const n = fold(name).split(",")[0].trim(); return mine.some((m) => { const f = fold(m); return f === fold(name) || f.split(",")[0].trim() === n; }); };

export function applyFilters(rows: RecipeRow[], f: Filters, c: Context): RecipeRow[] {
  return rows.filter((r) => {
    if (!recipeHit(r, f.q)) return false;
    if (f.kitchen && r.kitchen !== f.kitchen) return false;
    if (f.member === YOU && !r.mine) return false;
    if (f.member === NONE && (r.cook || r.mine)) return false;
    if (f.member && f.member !== YOU && f.member !== NONE && (r.mine || fold(r.cook) !== fold(f.member))) return false;
    if (f.shared && r.shared !== f.shared) return false;
    if (f.moment && !momentsOf(r.kcal, c.dayKcal).includes(f.moment)) return false;
    if (f.day && c.target !== null && (r.pd === null || r.pd < c.target - 0.05)) return false;
    if (f.nocook && (r.foods.some((n) => c.needsCooking(n)) || r.steps.some((s) => /\b(fry|boil|bake|roast|grill|simmer|cook|saut|sear|steam|oven|pan|pot)/i.test(s)))) return false;
    if (f.withMine && !r.foods.every((n) => foodIn(c.myFoods, n))) return false;
    return true;
  });
}
export function sortRows(rows: RecipeRow[], s: Sort): RecipeRow[] {
  const out = [...rows];
  if (s === "new") out.sort((a, b) => (b.at > a.at ? 1 : b.at < a.at ? -1 : 0));
  if (s === "made") out.sort((a, b) => b.made - a.made || (b.at > a.at ? 1 : -1));
  if (s === "pd") out.sort((a, b) => (b.pd ?? -1) - (a.pd ?? -1));
  if (s === "quick") out.sort((a, b) => a.steps.length - b.steps.length || a.foods.length - b.foods.length);
  if (s === "az") out.sort((a, b) => a.title.localeCompare(b.title));
  return out;
}
export const activeCount = (f: Filters) => [f.kitchen, f.member, f.shared, f.moment].filter(Boolean).length + [f.day, f.nocook, f.withMine].filter(Boolean).length;

// the drop-downs' lines, with counts over the rows the other filters leave (so a line never promises an empty list)
export type Line = { key: string; label: string; count: string };
export function kitchenLines(rows: RecipeRow[]): Line[] {
  const n = new Map<string, number>(); for (const r of rows) if (r.kitchen) n.set(r.kitchen, (n.get(r.kitchen) ?? 0) + 1);
  return [...n.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([k, c]) => ({ key: k, label: k, count: String(c) }));
}
// Member: You first (all of yours, with the unnamed ones counted), then the cooks by name, most recipes first, then the
// recipes shared without a name
export function memberLines(rows: RecipeRow[]): Line[] {
  const out: Line[] = [];
  const mine = rows.filter((r) => r.mine), unnamedMine = mine.filter((r) => !r.cook).length;
  if (mine.length) out.push({ key: YOU, label: "You", count: unnamedMine ? `${mine.length}, ${unnamedMine === 1 ? "one" : unnamedMine} without your name` : String(mine.length) });
  const n = new Map<string, number>(); for (const r of rows) if (r.cook && !r.mine) n.set(r.cook, (n.get(r.cook) ?? 0) + 1);
  for (const [k, c] of [...n.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) out.push({ key: k, label: k, count: String(c) });
  const none = rows.filter((r) => !r.cook && !r.mine).length; if (none) out.push({ key: NONE, label: "Without a name", count: String(none) });
  return out;
}
export const memberLabel = (key: string | null) => (key === YOU ? "you" : key === NONE ? "without a name" : key ?? "");
// the line under the bar: 2 of 5 recipes · Kitchen: Balkan · No cooking
export function countLine(shown: number, total: number, f: Filters, sharedWord: (s: RecipeRow["shared"]) => string): string {
  const parts = [`${shown} of ${total} ${total === 1 ? "recipe" : "recipes"}`];
  if (f.kitchen) parts.push(`Kitchen: ${f.kitchen}`);
  if (f.member) parts.push(`Member: ${memberLabel(f.member)}`);
  if (f.shared) parts.push(sharedWord(f.shared));
  if (f.moment) parts.push(MOMENTS.find((m) => m.id === f.moment)!.label);
  if (f.day) parts.push("Fits my day");
  if (f.nocook) parts.push("No cooking");
  if (f.withMine) parts.push("With my foods");
  return parts.join(" · ");
}
