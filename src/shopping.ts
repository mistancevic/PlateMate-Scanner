// A shopping list from the plan (0.2.60, board SL1; Milan 15:48 to 15:50: as simple as possible, to try it). The planned
// meals of seven days from today, one portion each as the plan counts it, every food added up by name. A meal with no
// foods saved (a starter) can't be counted, so the list names it instead of leaving it out quietly.
import { plannedPortion, type Planned } from "./planned";

export type ShopLine = { key: string; name: string; brand: string; grams: number; meals: number };
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
        const line = by.get(key) ?? { key, name: i.food.name, brand: i.food.brand ?? "", grams: 0, meals: 0, seen: new Set<string>() };
        line.grams += i.grams;
        if (!line.seen.has(d + slot)) { line.seen.add(d + slot); line.meals++; }
        by.set(key, line);
      }
    }
  }
  const lines = [...by.values()].map(({ seen, ...l }) => ({ ...l, grams: shopGrams(l.grams) })).sort((a, b) => a.name.localeCompare(b.name));
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
export type SavedList = { n: number; madeAt: string; from: string; to: string; meals: number; lines: ShopLine[]; without: ShopList["without"]; carried: ShopLine[]; carriedFrom: number | null; ticked: string[]; doneAt?: string };
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
export const tickIn = (s: ShopStore, n: number, key: string): ShopStore => ({ ...s, lists: s.lists.map((l) => (l.n !== n ? l : { ...l, ticked: l.ticked.includes(key) ? l.ticked.filter((k) => k !== key) : [...l.ticked, key] })) });
export const notTicked = (l: SavedList) => [...l.carried, ...l.lines].filter((x) => !l.ticked.includes(x.key));
export function finishList(s: ShopStore, n: number, carry: boolean, at: string): ShopStore {
  const l = s.lists.find((x) => x.n === n);
  if (!l) return s;
  const left = notTicked(l);
  return { lists: s.lists.map((x) => (x.n === n ? { ...x, doneAt: at } : x)), carry: carry && left.length ? { from: n, lines: left } : s.carry };
}
export function listText(l: SavedList, span: string): string {
  const shown = (x: ShopLine) => `${x.name}${x.brand && !/typical values|generic|check your/i.test(x.brand) ? ` (${x.brand})` : ""}: ${x.grams.toLocaleString("en")} g`;
  return [`Shopping list ${l.n}, ${span}`, "", ...notTicked(l).map(shown)].join("\n");
}
