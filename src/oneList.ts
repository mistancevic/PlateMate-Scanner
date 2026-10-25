// One search across every source (0.2.104, board Stories71, DT125). Your foods, the members' catalogue, the basic foods
// table and the product database answer the same words and land in one list, one row per food, ranked: yours first, then
// members' (your market first), then basic, then the product database behind one line. A row says where it comes from and
// what the tap does. The same identity never makes two rows: yours wins, then a member's, then the basic food.
import type { Food } from "./pilot";
import { density } from "./pilot";
import { findReference, referenceFood, localName, type RefFood } from "./reference";
import { identityOf, foodHit, fold } from "./foodId";
import { asMine, seenLine, type MemberFood } from "./memberFoods";
import type { DbProduct } from "./screens/api";

export type Row =
  | { kind: "mine"; key: string; food: Food; names: string[] }
  | { kind: "member"; key: string; food: Food; names: string[]; member: MemberFood; seen: string }
  | { kind: "basic"; key: string; food: Food; names: string[]; ref: RefFood }
  | { kind: "db"; key: string; food: Food; names: string[]; product: DbProduct };

export type OneListIn = { q: string; mine: Food[]; members: MemberFood[]; db: DbProduct[]; region: string | null | undefined; uid: () => string; basics?: number };

export function oneList(x: OneListIn): { rows: Row[]; db: Row[] } {
  const q = x.q.trim();
  // every candidate first, grouped by identity; a group shows when any of its names answers the word, and the row is the best
  // source in it (yours, then a member's, then the basic food) with every name behind it
  const all: Row[] = [];
  for (const f of x.mine) all.push({ kind: "mine", key: identityOf(f), food: f, names: [f.name] });
  for (const m of x.members) { const food = asMine(m, x.uid); all.push({ kind: "member", key: identityOf(food), food, names: [m.name], member: m, seen: seenLine(m, x.region) }); }
  if (q.length >= 2 && !/^\d{8,14}$/.test(q)) for (const r of findReference(q, x.basics ?? 6, q.length < 3)) { const food = referenceFood(r, x.region, x.uid); all.push({ kind: "basic", key: identityOf(food), food, names: [localName(r, x.region)], ref: r }); }
  const seen = new Map<string, Row>();
  for (const r of all) { const had = seen.get(r.key); if (!had) { seen.set(r.key, { ...r, names: [...r.names] }); continue; } if (rank(r) < rank(had)) seen.set(r.key, { ...r, names: [...r.names, ...had.names.filter((n) => !r.names.includes(n))] }); else for (const n of r.names) if (!had.names.includes(n)) had.names.push(n); }
  for (const [k, r] of [...seen]) { const hit = r.kind === "basic" || foodHit({ ...r.food, aliases: [...(r.food.aliases ?? []), ...r.names] }, q); if (!hit) seen.delete(k); }
  const rows = [...seen.values()].sort((a, b) => rank(a) - rank(b));
  // the product database behind a line, never a food already in the list
  const dbRows: Row[] = x.db.filter((p) => !seen.has(`b:${p.code}`)).map((p) => {
    const food = { id: x.uid(), name: p.name, brand: p.brand, basis: "100g", source: "Product database", notes: "", reviewedAt: "", readyToEat: true, calories: p.kcal, protein: p.protein, fats: null, carbs: null, fiber: null, barcode: p.code } as Food;
    return { kind: "db", key: `b:${p.code}`, food, names: [p.name], product: p } as Row;
  });
  return { rows, db: dbRows };
}
const rank = (r: Row) => (r.kind === "mine" ? 0 : r.kind === "member" ? 1 : r.kind === "basic" ? 2 : 3);

// the line under a row: where it comes from and its numbers
export function rowLine(r: Row): string {
  const f = r.food, pd = density(f.protein, f.calories);
  const nums = `${f.calories === null ? "?" : Math.round(f.calories)} kcal · ${f.protein === null ? "?" : f.protein} g protein per 100 g`;
  if (r.kind === "mine") return [f.brand, nums, r.names.length > 1 ? `also ${r.names.slice(1).join(", ")}` : ""].filter(Boolean).join(" · ");
  if (r.kind === "member") return [f.brand || (f.barcode ? "" : "no barcode"), nums, `a member's, ${r.seen || "market not set"}`].filter(Boolean).join(" · ");
  if (r.kind === "basic") return ["basic food", nums, r.names.length > 1 ? r.names.slice(1).join(" · ") : ""].filter(Boolean).join(" · ");
  return [f.brand, r.product.quantity, nums].filter(Boolean).join(" · ");
}
export const pdOfRow = (r: Row) => density(r.food.protein, r.food.calories);
export const matchesWord = (r: Row, q: string) => r.names.some((n) => fold(n).includes(fold(q)));
