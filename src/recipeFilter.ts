// Recipes: one search, drop-downs, filters that stack, a sort (0.2.105, board Stories72, DT126; 0.2.106, board Stories74,
// DT126c; Milan 25 October 13:48 to 15:12). No tabs: Recipes is one list under one bar, and Made by is a field of the one
// filter set (me, the coach, each member, a member without a name). Nothing here renders: rows go in, the rows to show come
// out, grouped by who made them, with the lines for the Made by and Kitchen drop-downs and their counts. The allergy filter
// is not here: the members' rows pass it before, silent and always on (membersFor).
import { fold } from "./foodId";
import { synonymsOf } from "./reference";

// what the bar needs of a recipe, the same for a recipe of yours and a member's
export type Source = "me" | "coach" | "member";
export type RecipeRow = {
  id: string; title: string; foods: string[]; steps: string[]; kitchen: string | null;
  source: Source;        // who made it: you, your coach, a member
  cook: string;          // a member's first name, "" when shared without a name (and for me and the coach)
  unnamed?: boolean;     // yours, shared with members without your name
  at: string;            // when it came: sharedAt or savedAt
  made: number;          // how many times made
  kcal: number | null;   // one portion
  pd: number | null;     // protein density of the recipe
};
export type Moment = "breakfast" | "lunch" | "snack";
// madeBy: ME, COACH, MEMBERS (all of them), a member's name, or NONE (shared without a name)
export type Filters = { q: string; kitchen: string | null; madeBy: string | null; moment: Moment | null; day: boolean; nocook: boolean; withMine: boolean };
export type Sort = "fit" | "new" | "made" | "pd" | "quick" | "az";
export const EMPTY: Filters = { q: "", kitchen: null, madeBy: null, moment: null, day: false, nocook: false, withMine: false };
// "fit" keeps the order each source has today: yours with Chef Mealan's ideas first, members' at or above your PD target
// first, then your kitchens (membersFor). The default.
export const SORTS: { id: Sort; label: string }[] = [{ id: "fit", label: "For your day" }, { id: "new", label: "Newest" }, { id: "made", label: "Most made" }, { id: "pd", label: "Highest PD" }, { id: "quick", label: "Quickest" }, { id: "az", label: "A to Z" }];
export const MOMENTS: { id: Moment; label: string }[] = [{ id: "breakfast", label: "Breakfast" }, { id: "lunch", label: "Lunch or dinner" }, { id: "snack", label: "Snack" }];
// the Made by drop-down's keys: me, the coach, all members, a member's name, or the ones shared without a name
export const ME = "me", COACH = "coach", MEMBERS = "members", NONE = "none";

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
    if (f.madeBy === ME && r.source !== "me") return false;
    if (f.madeBy === COACH && r.source !== "coach") return false;
    if (f.madeBy === MEMBERS && r.source !== "member") return false;
    if (f.madeBy === NONE && (r.source !== "member" || r.cook)) return false;
    if (f.madeBy && ![ME, COACH, MEMBERS, NONE].includes(f.madeBy) && (r.source !== "member" || fold(r.cook) !== fold(f.madeBy))) return false;
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
export const activeCount = (f: Filters) => [f.kitchen, f.madeBy, f.moment].filter(Boolean).length + [f.day, f.nocook, f.withMine].filter(Boolean).length;
export const isIdle = (f: Filters) => !f.q.trim() && activeCount(f) === 0;

// the drop-downs' lines, with counts over the rows the other filters leave (so a line never promises an empty list)
export type Line = { key: string; label: string; count: string };
export function kitchenLines(rows: RecipeRow[]): Line[] {
  const n = new Map<string, number>(); for (const r of rows) if (r.kitchen) n.set(r.kitchen, (n.get(r.kitchen) ?? 0) + 1);
  return [...n.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([k, c]) => ({ key: k, label: k, count: String(c) }));
}
// Made by: Me, the coach, all members, then each member by name, most recipes first, then the recipes shared without a name
export function madeByLines(rows: RecipeRow[], coachLabel: string): Line[] {
  const out: Line[] = [];
  const me = rows.filter((r) => r.source === "me"), unnamed = me.filter((r) => r.unnamed).length;
  if (me.length) out.push({ key: ME, label: "Me", count: unnamed ? `${me.length}, ${unnamed === 1 ? "one" : unnamed} shared without your name` : String(me.length) });
  const coach = rows.filter((r) => r.source === "coach").length; if (coach) out.push({ key: COACH, label: coachLabel, count: String(coach) });
  const members = rows.filter((r) => r.source === "member").length; if (members) out.push({ key: MEMBERS, label: "All members", count: String(members) });
  const n = new Map<string, number>(); for (const r of rows) if (r.source === "member" && r.cook) n.set(r.cook, (n.get(r.cook) ?? 0) + 1);
  for (const [k, c] of [...n.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) out.push({ key: k, label: k, count: String(c) });
  const none = rows.filter((r) => r.source === "member" && !r.cook).length; if (none) out.push({ key: NONE, label: "A member without a name", count: String(none) });
  return out;
}
// "Your coach" inside a sentence reads "your coach"
const inLine = (label: string) => label.replace(/^Your /, "your ");
export const madeByLabel = (key: string | null, coachLabel: string) => (key === ME ? "me" : key === COACH ? inLine(coachLabel) : key === MEMBERS ? "members" : key === NONE ? "a member without a name" : key ?? "");
// the groups of the one list: me, the coach, the members, in that order, each with its count
export type Group = { key: Source; title: string; rows: RecipeRow[] };
export function groupRows(rows: RecipeRow[], coachLabel: string): Group[] {
  const g: Group[] = [{ key: "me", title: "Made by me", rows: [] }, { key: "coach", title: `Made by ${inLine(coachLabel)}`, rows: [] }, { key: "member", title: "Made by members", rows: [] }];
  for (const r of rows) g.find((x) => x.key === r.source)!.rows.push(r);
  return g.filter((x) => x.rows.length > 0);
}
// the line under the bar: 10 recipes; or 2 of 10 recipes · Made by: Marko · No cooking
export function countLine(shown: number, total: number, f: Filters, coachLabel: string): string {
  const parts = [isIdle(f) ? `${total} ${total === 1 ? "recipe" : "recipes"}` : `${shown} of ${total} ${total === 1 ? "recipe" : "recipes"}`];
  if (f.madeBy) parts.push(`Made by: ${madeByLabel(f.madeBy, coachLabel)}`);
  if (f.kitchen) parts.push(`Kitchen: ${f.kitchen}`);
  if (f.moment) parts.push(MOMENTS.find((m) => m.id === f.moment)!.label);
  if (f.day) parts.push("Fits my day");
  if (f.nocook) parts.push("No cooking");
  if (f.withMine) parts.push("With my foods");
  return parts.join(" · ");
}
