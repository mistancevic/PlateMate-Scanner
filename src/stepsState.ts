// Steps: the original, or Chef Mealan's on demand (0.2.25, canvas board RP, RP1 to RP1c; Milan 17 October 2026, 17:42 to 18:23).
// The read brings the original's steps with the foods, in one call. When your foods are the recipe's, the original is the
// steps; Chef Mealan writes his only when you ask, and a line says which case it is: your foods as they are, or the foods
// that differ. Once written, his steps stay with the recipe beside the original; foods changed after: write them again.
const norm = (s: string) => s.trim().toLowerCase();
export const foodNames = (items: { grams: number; food: { name: string } }[]) => items.filter((i) => i.grams > 0).map((i) => i.food.name);
export type FoodDiff = { added: string[]; gone: string[] };
// how the foods now differ from the foods the steps were written for; null when they are the same
export function diffFoods(now: string[], then: string[] | null | undefined): FoodDiff | null {
  if (!then || !then.length) return null;
  const a = new Set(now.map(norm)), b = new Set(then.map(norm));
  const added = now.filter((x, k) => !b.has(norm(x)) && now.findIndex((y) => norm(y) === norm(x)) === k);
  const gone = then.filter((x, k) => !a.has(norm(x)) && then.findIndex((y) => norm(y) === norm(x)) === k);
  return added.length || gone.length ? { added, gone } : null;
}
const list = (xs: string[]) => { const l = xs.map((x) => x.toLowerCase()); return l.length <= 1 ? l.join("") : `${l.slice(0, -1).join(", ")} and ${l[l.length - 1]}`; };
// the line over the original when your dish differs (RP1b)
export function diffLine(d: FoodDiff): string {
  if (d.added.length && d.gone.length) return `Your dish has ${list(d.added)}. The original has ${list(d.gone)}.`;
  if (d.added.length) return `Your dish adds ${list(d.added)}.`;
  return `Your dish leaves out ${list(d.gone)}.`;
}
// the foods the original steps were written for: kept at the read; for a changed dish, its original's
export function originalFoodsOf(m: { source?: { foods?: string[] }; basedOn?: { id: string } }, meals: { id: string; items: { grams: number; food: { name: string } }[]; source?: { foods?: string[] } }[] = []): string[] | null {
  if (m.source?.foods?.length) return m.source.foods;
  const o = m.basedOn ? meals.find((x) => x.id === m.basedOn!.id) : undefined;
  return o ? (o.source?.foods?.length ? o.source.foods : foodNames(o.items)) : null;
}
// a heading the page puts in front of a step ("Make the crust: Stir ...") is shown in bold
export function headingOf(step: string): { head: string; rest: string } | null {
  const m = step.match(/^([A-Z][^.:!?\n]{2,40}):\s+([\s\S]+)$/);
  return m ? { head: m[1], rest: m[2] } : null;
}
