// A shopping list from the plan (0.2.60, board SL1; Milan 15:48 to 15:50: as simple as possible, to try it). The planned
// meals of seven days from today, one portion each as the plan counts it, every food added up by name. A meal with no
// foods saved (a starter) can't be counted, so the list names it instead of leaving it out quietly.
import { plannedPortion, type Planned } from "./planned";

// SL4 (0.2.62): each food knows the meals it is for, so the list can say what it is for and show itself meal by meal
export type ShopUse = { date: string; slot: string; title: string; grams: number };
export type ShopLine = { key: string; name: string; brand: string; grams: number; meals: number; uses?: ShopUse[]; added?: boolean };
export type ShopList = { days: string[]; meals: number; lines: ShopLine[]; without: { date: string; title: string }[] };

// grams as a shop reads them: under 50 g to the gram, else to 10 g
export const shopGrams = (g: number) => (g < 50 ? Math.max(1, Math.round(g)) : Math.round(g / 10) * 10);

export function shoppingList(planned: Planned, days: string[]): ShopList {
  const by = new Map<string, ShopLine & { seen: Set<string> }>();
  const without: ShopList["without"] = [];
  let meals = 0;
  for (const d of days) {
    for (const [slot, m] of Object.entries(planned[d] ?? {})) {
      if (m.skipped) continue;
      meals++;
      const portion = plannedPortion(m, "shop", "");
      if (!portion) { without.push({ date: d, title: m.title }); continue; }
      for (const i of portion.items) {
        if (!(i.grams > 0) || !i.food?.name) continue;
        const key = `${i.food.name}|${i.food.brand ?? ""}`.toLowerCase();
        const line = by.get(key) ?? { key, name: i.food.name, brand: i.food.brand ?? "", grams: 0, meals: 0, uses: [] as ShopUse[], seen: new Set<string>() };
        line.grams += i.grams;
        const use = line.uses!.find((u) => u.date === d && u.slot === slot);
        if (use) use.grams += i.grams; else line.uses!.push({ date: d, slot, title: m.title, grams: i.grams });
        if (!line.seen.has(d + slot)) { line.seen.add(d + slot); line.meals++; }
        by.set(key, line);
      }
    }
  }
  const lines = [...by.values()].map(({ seen, ...l }) => ({ ...l, grams: shopGrams(l.grams), uses: (l.uses ?? []).map((u) => ({ ...u, grams: shopGrams(u.grams) })) })).sort((a, b) => a.name.localeCompare(b.name));
  return { days, meals, lines, without };
}

// the list as text, to paste in a message or a note
export function shoppingText(list: ShopList, span: string, ticked: Set<string>): string {
  const left = list.lines.filter((l) => !ticked.has(l.key));
  return [`Shopping list, ${span}`, "", ...left.map((l) => `${l.name}${l.brand && !/typical values|generic|check your/i.test(l.brand) ? ` (${l.brand})` : ""}: ${l.grams.toLocaleString("en")} g`)].join("\n");
}

// SL3 (0.2.61, Milan 16:46 to 16:50): a list is saved, named and dated: Shopping list 1, made on a day, for the days picked.
// What is on it is what it is; a later change to the plan does not touch it. One list is open at a time. The next list starts
// the day after the last one ends, so nothing is bought twice. Finishing asks about the foods not ticked: carry them to the
// next list, or leave them. On this phone only; another phone makes its own.
// missing: the foods marked Not this time (SL4, named 20:14); they stay on the list and count as not bought
export type SavedList = { n: number; madeAt: string; from: string; to: string; meals: number; lines: ShopLine[]; without: ShopList["without"]; carried: ShopLine[]; carriedFrom: number | null; ticked: string[]; missing?: string[]; changes?: { date: string; slot: string; from: string; to: string; because?: string[] }[]; doneAt?: string };
export type ShopStore = { lists: SavedList[]; carry: { from: number; lines: ShopLine[] } | null };
const LKEY = "chefmealan-shopping-lists";
export const getStore = (): ShopStore => { try { const s = JSON.parse(localStorage.getItem(LKEY) || "{}"); return { lists: Array.isArray(s.lists) ? s.lists : [], carry: s.carry ?? null }; } catch { return { lists: [], carry: null }; } };
export const putStore = (s: ShopStore) => { try { localStorage.setItem(LKEY, JSON.stringify(s)); } catch {} };
export const openList = (s: ShopStore) => s.lists.find((l) => !l.doneAt) ?? null;
const plusDay = (d: string, n: number) => { const x = new Date(`${d}T12:00:00`); x.setDate(x.getDate() + n); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; };
// the next list starts where the last one ended, never before today
export function nextStart(s: ShopStore, today: string): string {
  const ends = s.lists.map((l) => l.to).sort();
  const after = ends.length ? plusDay(ends[ends.length - 1], 1) : today;
  return after > today ? after : today;
}
export const daysFrom = (from: string, n: number) => Array.from({ length: n }, (_, i) => plusDay(from, i));
export function makeList(s: ShopStore, planned: Planned, days: string[], madeAt: string): ShopStore {
  const l = shoppingList(planned, days);
  const n = s.lists.reduce((m, x) => Math.max(m, x.n), 0) + 1;
  const list: SavedList = { n, madeAt, from: days[0], to: days[days.length - 1], meals: l.meals, lines: l.lines, without: l.without, carried: (s.carry?.lines ?? []).map((x) => ({ ...x, key: `c:${x.key.replace(/^c:/, "")}` })), carriedFrom: s.carry?.from ?? null, ticked: [] };
  return { lists: [list, ...s.lists], carry: null };
}
// a tap moves a food on: to buy, then in the basket, then not this time, then back to buy (SL4)
export const stateOf = (l: SavedList, key: string): "buy" | "got" | "missing" => (l.ticked.includes(key) ? "got" : (l.missing ?? []).includes(key) ? "missing" : "buy");
export const tickIn = (s: ShopStore, n: number, key: string): ShopStore => ({ ...s, lists: s.lists.map((l) => {
  if (l.n !== n) return l;
  const st = stateOf(l, key), missing = (l.missing ?? []).filter((k) => k !== key), ticked = l.ticked.filter((k) => k !== key);
  return st === "buy" ? { ...l, ticked: [...ticked, key], missing } : st === "got" ? { ...l, ticked, missing: [...missing, key] } : { ...l, ticked, missing };
}) });
// the meals a food marked Not this time leaves short, in the order of the days
export function shortMeals(l: SavedList): { date: string; slot: string; title: string; foods: string[] }[] {
  const out: { date: string; slot: string; title: string; foods: string[] }[] = [];
  for (const x of [...l.carried, ...l.lines]) {
    if (!(l.missing ?? []).includes(x.key)) continue;
    for (const u of x.uses ?? []) { const m = out.find((o) => o.date === u.date && o.slot === u.slot); if (m) m.foods.push(x.name); else out.push({ date: u.date, slot: u.slot, title: u.title, foods: [x.name] }); }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}
// the list as meals: each day's planned meals with what each needs (SL4, By meal); the carried foods are not of these days
export function byMeal(l: SavedList): { date: string; slot: string; title: string; foods: { line: ShopLine; grams: number }[] }[] {
  const out: { date: string; slot: string; title: string; foods: { line: ShopLine; grams: number }[] }[] = [];
  for (const x of l.lines) for (const u of x.uses ?? []) { const m = out.find((o) => o.date === u.date && o.slot === u.slot); if (m) m.foods.push({ line: x, grams: u.grams }); else out.push({ date: u.date, slot: u.slot, title: u.title, foods: [{ line: x, grams: u.grams }] }); }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}
export const notTicked = (l: SavedList) => [...l.carried, ...l.lines].filter((x) => !l.ticked.includes(x.key));
export function finishList(s: ShopStore, n: number, carry: boolean, at: string): ShopStore {
  const l = s.lists.find((x) => x.n === n);
  if (!l) return s;
  const left = notTicked(l);
  return { lists: s.lists.map((x) => (x.n === n ? { ...x, doneAt: at } : x)), carry: carry && left.length ? { from: n, lines: left } : s.carry };
}
export function listText(l: SavedList, span: string): string {
  const shown = (x: ShopLine) => `${x.name}${x.brand && !/typical values|generic|check your/i.test(x.brand) ? ` (${x.brand})` : ""}: ${x.grams.toLocaleString("en")} g`;
  return [`Shopping list ${l.n}, ${span}`, "", ...notTicked(l).map((x) => shown(x) + ((l.missing ?? []).includes(x.key) ? " (not bought last time)" : ""))].join("\n");
}

// SL5 (0.2.63): a short meal changed with Chef Mealan's help. The plan's meal for that slot is new, and the open list
// follows it: the old meal's foods leave that meal, the new meal's foods join, marked as added. A food already in the
// basket stays on the list even when no meal needs it now; a food marked Not this time that no meal needs now leaves the list.
export type NewFood = { name: string; brand: string; grams: number };
export function replanMeal(s: ShopStore, n: number, date: string, slot: string, title: string, foods: NewFood[], from = "", because: string[] = []): ShopStore {
  return { ...s, lists: s.lists.map((l) => {
    if (l.n !== n) return l;
    // the old meal's foods leave that meal: in the foods for these days and in the foods carried from the last list
    const drop = (x: ShopLine) => {
      const uses = (x.uses ?? []).filter((u) => !(u.date === date && u.slot === slot));
      return uses.length === (x.uses ?? []).length ? x : { ...x, uses, grams: shopGrams(uses.reduce((g, u) => g + u.grams, 0)), meals: uses.length };
    };
    let lines = l.lines.map(drop), carried = l.carried.map(drop);
    for (const f of foods) {
      if (!(f.grams > 0)) continue;
      const key = `${f.name}|${f.brand ?? ""}`.toLowerCase();
      const at = lines.findIndex((x) => x.key === key), use = { date, slot, title, grams: shopGrams(f.grams) };
      if (at >= 0) { const x = lines[at]; const uses = [...(x.uses ?? []), use]; lines[at] = { ...x, uses, grams: shopGrams(uses.reduce((g, u) => g + u.grams, 0)), meals: uses.length }; }
      else lines.push({ key, name: f.name, brand: f.brand ?? "", grams: use.grams, meals: 1, uses: [use], added: true });
    }
    // a food no meal needs now leaves, unless it is in the basket; the new meal's foods were matched first, so a food it
    // shares with the old meal stays as it was, not as added
    const keep = (x: ShopLine) => (x.uses ?? []).length > 0 || l.ticked.includes(x.key) || !x.uses;
    lines = lines.filter(keep); carried = carried.filter(keep);
    const needed = (k: string) => [...lines, ...carried].some((x) => x.key === k && (x.uses ?? []).length > 0);
    const missing = (l.missing ?? []).filter(needed);
    const changes = [...(l.changes ?? []).filter((c) => !(c.date === date && c.slot === slot)), { date, slot, from: (l.changes ?? []).find((c) => c.date === date && c.slot === slot)?.from ?? from, to: title, because: (l.changes ?? []).find((c) => c.date === date && c.slot === slot)?.because ?? because }];
    return { ...l, lines: lines.sort((a, b) => a.name.localeCompare(b.name)), carried, missing, changes };
  }) };
}
