// DT287 (0.3.142, board Stories215; Coach Milan 12 November 13:28 and 13:32; brainstorm 15:00 to 15:35): Fill the open slots,
// on the goal and a different week. A meal's protein is the food that brings most of it, in one of a few kinds; what you ate in
// the last days and what is planned around the day count, so the same dish does not come twice in three days and the kinds rotate.
import type { Feedback } from "./pilot";
import type { FillChoice, FillMode, FillRow, Planned, PlannedMeal } from "./planned";
import { density, type Feedback as Fb } from "./pilot";
import { w, dec } from "./words";

export type ProteinKind = "poultry" | "fish" | "eggs" | "dairy" | "legumes" | "meat";
const KINDS: [ProteinKind, RegExp][] = [
  ["fish", /salmon|tuna|fish|cod|hake|trout|shrimp|prawn|sardine|mackerel|seafood|losos|tunjevin|riba|oslić|pastrmk|škamp|lachs|thunfisch|fisch|garnele|forelle/i],
  ["poultry", /chicken|turkey|poultry|piletin|pileć|ćuretin|ćureć|curetin|hähnchen|huhn|pute|geflügel/i],
  ["eggs", /\begg|\bjaj|\beier?\b|omelet|omlet/i],
  ["legumes", /bean|lentil|chickpea|pea protein|tofu|tempeh|edamame|hummus|pasulj|grah|sočiv|leblebij|naut|bohne|linse|kichererbse/i],
  ["meat", /beef|pork|veal|lamb|mince|ham|steak|sausage|bacon|govedin|svinjet|teletin|jagnjet|mleveno|šunk|kobasic|rind|schwein|kalb|lamm|hack|schinken|wurst/i],
  ["dairy", /skyr|quark|yog(h)?urt|cottage|cheese|milk|feta|mozzarella|ricotta|kefir|whey|sir\b|sira\b|jogurt|mleko|kajmak|käse|joghurt|milch|topfen|hüttenkäse/i],
];
export function kindOfName(name: string): ProteinKind | null { for (const [k, re] of KINDS) if (re.test(name)) return k; return null; }
// the food that brings the most protein to the meal; by its title when the meal has no foods
export function proteinOf(m: Pick<PlannedMeal, "title" | "items">): ProteinKind | null {
  const items = m.items ?? [];
  const top = [...items].sort((a, b) => ((b.food.protein ?? 0) * b.grams) - ((a.food.protein ?? 0) * a.grams))[0];
  const byFood = top ? kindOfName(top.food.name) : null;
  return byFood ?? kindOfName(m.title);
}
export type Week = { days: Map<string, number>; kinds: Record<ProteinKind, number> };
const dayMs = 864e5, ymdOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
// the week around the day: meals eaten in the 6 days before it and planned within 3 days either side (not the slots being filled)
export function weekAround(date: string, feedback: Feedback[], planned: Planned, skip: string[] = []): Week {
  const at = new Date(`${date}T12:00:00`).getTime();
  const days = new Map<string, number>(), kinds = { poultry: 0, fish: 0, eggs: 0, dairy: 0, legumes: 0, meat: 0 } as Record<ProteinKind, number>;
  const add = (title: string, k: ProteinKind | null, ago: number) => { const t = title.trim().toLowerCase(); days.set(t, Math.min(days.get(t) ?? 99, Math.abs(ago))); if (k) kinds[k] += 1; };
  for (const f of feedback) {
    if (f.status !== "eaten") continue;
    const ago = Math.round((at - new Date(f.createdAt).getTime()) / dayMs);
    if (ago < 0 || ago > 6) continue;
    add(f.meal.title, proteinOf({ title: f.meal.title, items: f.meal.items }), ago);
  }
  for (let d = -3; d <= 3; d++) {
    const key = ymdOf(new Date(at + d * dayMs)); const day = planned[key]; if (!day) continue;
    for (const [slot, m] of Object.entries(day)) { if (m.skipped || (d === 0 && skip.includes(slot))) continue; if (d < 0 && feedback.some((f) => f.slot?.date === key && f.slot.slotId === slot)) continue; add(m.title, proteinOf(m), d); }
  }
  return { days, kinds };
}
// how a meal sits in the week: a dish within 3 days is far back; a kind already twice comes after a new one
export function weekPenalty(m: PlannedMeal, week: Week | undefined, today: ProteinKind[] = []): number {
  if (!week) return 0;
  const near = week.days.get(m.title.trim().toLowerCase());
  const k = proteinOf(m);
  return (near !== undefined && near <= 3 ? 5 : 0) + (k ? Math.max(0, week.kinds[k] - 1) * 0.3 + (week.kinds[k] === 0 ? -0.1 : 0) + (today.includes(k) ? 0.3 : 0) : 0);
}

// DT287: the choices of a slot for a direction: on the goal, another protein, lighter, or something you liked
const KIND_WORD: Record<ProteinKind, Parameters<typeof w>[0]> = { poultry: "out.kindPoultry", fish: "out.kindFish", eggs: "out.kindEggs", dairy: "out.kindDairy", legumes: "out.kindLegumes", meat: "out.kindMeat" };
export function likedCount(feedback: Fb[], m: PlannedMeal): number {
  return feedback.filter((f) => f.status === "eaten" && f.taste === "DaaM good" && ((m.mealId && (f.recipeId === m.mealId || f.meal.id === m.mealId)) || f.meal.title.trim().toLowerCase() === m.title.trim().toLowerCase())).length;
}
export function slotChoices(row: FillRow, mode: FillMode, week: Week | undefined, liked: (m: PlannedMeal) => number, shownKinds: ProteinKind[] = []): FillChoice[] {
  const all = row.ranked?.length ? row.ranked : [row.meal, ...row.alternatives];
  let list: PlannedMeal[];
  if (mode === "lighter") list = all.filter((m) => m.kcal <= row.meal.kcal * 0.85);
  else if (mode === "crave") list = [...all].sort((a, b) => liked(b) - liked(a));
  else if (mode === "protein") list = all.filter((m) => { const k = proteinOf(m); return !k || !shownKinds.includes(k); });
  else list = all;
  // a different protein in each choice where the list allows
  const out: PlannedMeal[] = [], seen = new Set<string>();
  for (const m of list) { const k = proteinOf(m) ?? m.title; if (out.length < 3 && !seen.has(k)) { out.push(m); seen.add(k); } }
  for (const m of list) if (out.length < 2 && !out.includes(m)) out.push(m);
  return out.slice(0, 3).map((m) => ({ meal: m, why: whyOf(m, mode, week, liked(m)) }));
}
export function whyOf(m: PlannedMeal, mode: FillMode, week: Week | undefined, likedN: number): string {
  if (mode === "crave" && likedN > 0) return w("out.whyLiked");
  if (mode === "lighter") return w("out.whyLighter", { kcal: String(Math.round(m.kcal)) });
  const k = proteinOf(m);
  if (k && week) { const n = week.kinds[k]; if (n === 0) return w("out.whyNew", { kind: w(KIND_WORD[k]) }); if (n === 1) return w("out.whyOnce", { kind: w(KIND_WORD[k]) }); }
  const pd = density(m.protein, m.kcal);
  return w("out.whyGoal", { pd: pd === null ? "?" : dec(pd, 1) });
}
