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

// what was ticked, kept for the same seven days only
const KEY = "chefmealan-shopping";
export const getTicked = (from: string): Set<string> => { try { const s = JSON.parse(localStorage.getItem(KEY) || "{}"); return new Set(s.from === from ? s.ticked ?? [] : []); } catch { return new Set(); } };
export const storeTicked = (from: string, t: Set<string>) => { try { localStorage.setItem(KEY, JSON.stringify({ from, ticked: [...t] })); } catch {} };
