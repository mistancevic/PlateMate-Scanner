// DT268 step 1 (0.3.118, board Stories201; Coach Milan 9 November 21:46 to 23:21, Go): Served. A plate scanned to explore
// (a friend's meal at a restaurant, your own starter, main and dessert) is kept on its own: cooked in another kitchen, read
// from a photo, not weighed. Chef Mealan fills its name and which dish it is; you add whose. Plates scanned at one sitting are
// a visit: the same day, within a couple of hours. A visit's title is your note, or the day and the meal. The path is Served,
// On paper, From the kitchen; a Served plate never says Cooked and weighed.
// Pure functions here; the screens are components/Served.tsx, the Plate's block is in JourneyScreen.
import type { Ingredient } from "./pilot";

export const DISHES = ["starter", "main", "side", "dessert", "drink"] as const;
export type Dish = (typeof DISHES)[number];
export const dishOf = (x: unknown): Dish => (DISHES as readonly string[]).includes(String(x)) ? (x as Dish) : "main";

export type Served = {
  id: string; name: string; dish: Dish;
  // yours, or someone else's at the table: the one thing a photo cannot tell
  mine: boolean;
  // when the photo was taken, and the visit it belongs to
  at: string; visit: string;
  // the visit's note (Café Jadran, Ana's birthday), the same on every plate of the visit
  note?: string;
  items: Ingredient[];
  photo: string; more?: string[];
  // I ate this: when it went to a day
  eatenAt?: string;
  // step 3: the line of the visit's menu this plate was matched to; was: its foods before the menu's weight was taken
  menu?: MenuLine & { was?: Ingredient[] };
};
// what the Plate carries about the plate it is exploring
// byHand: the plate became Exploring by the pencil, so its dish is not the read's guess
export type OnPlate = { id: string; mine: boolean; visit: string; dish: Dish; name?: string; byHand?: boolean };

// plates of one sitting: the same calendar day, within this many hours of another plate of the visit
export const VISIT_HOURS = 2.5;
const sameDay = (a: string, b: string) => new Date(a).toDateString() === new Date(b).toDateString();
// the visit a plate taken at `at` joins: the latest visit with a plate of that day close enough in time; else none
export function visitFor(list: Served[], at: string): string | null {
  const t = new Date(at).getTime();
  const near = list.filter((s) => sameDay(s.at, at) && Math.abs(new Date(s.at).getTime() - t) <= VISIT_HOURS * 3600_000)
    .sort((a, b) => (a.at < b.at ? 1 : -1));
  return near[0]?.visit ?? null;
}
// the plate as it stands on the Plate goes into the list: a new one first, a known one in its place; the same list when
// nothing changed, so an effect that calls this on every change settles
export function upsertServed(list: Served[], next: Served): Served[] {
  const i = list.findIndex((s) => s.id === next.id);
  if (i < 0) return [next, ...list];
  // a plate matched to the menu keeps its match, and the foods the menu's weight gave it
  if (list[i].menu) return list;
  const kept = { ...next, ...(list[i].eatenAt ? { eatenAt: list[i].eatenAt } : {}), note: list[i].note ?? next.note };
  return JSON.stringify(list[i]) === JSON.stringify(kept) ? list : list.map((s, k) => (k === i ? kept : s));
}
export type Visit = { id: string; note: string; at: string; mine: Served[]; others: Served[] };
const ORDER: Record<Dish, number> = { starter: 0, main: 1, side: 2, dessert: 3, drink: 4 };
// the visits, the latest first; in each your dishes in the order of a meal, then the others in the order scanned
export function visitsOf(list: Served[]): Visit[] {
  const by = new Map<string, Served[]>();
  for (const s of list) by.set(s.visit, [...(by.get(s.visit) ?? []), s]);
  return [...by.entries()].map(([id, xs]) => {
    const sorted = [...xs].sort((a, b) => (a.at < b.at ? -1 : 1));
    return { id, note: sorted.find((s) => s.note)?.note ?? "", at: sorted[0].at,
      mine: sorted.filter((s) => s.mine).sort((a, b) => ORDER[a.dish] - ORDER[b.dish]), others: sorted.filter((s) => !s.mine) };
  }).sort((a, b) => (a.at < b.at ? 1 : -1));
}
// a visit's note on every plate of it; an empty note takes it off
export const withNote = (list: Served[], visit: string, note: string): Served[] => {
  const n = note.replace(/\s+/g, " ").trim().slice(0, 60);
  return list.map((s) => (s.visit === visit ? { ...s, note: n || undefined } : s));
};
// your dishes of a visit as one meal: every food of every dish, in the order of the meal
export const mealItems = (plates: Served[]): Ingredient[] => plates.flatMap((s) => s.items.map((i) => ({ ...i, id: `${s.id}-${i.id}`, est: undefined })));
// the one meal's name: the main dish, or the first dish
export const mealTitle = (plates: Served[]): string => (plates.find((s) => s.dish === "main") ?? plates[0])?.name ?? "";

// ---- step 3 (0.3.120, board Stories201, DT268g; Coach Milan 9 November 23:12 to 23:44, Go): a photo of the menu ----
// One photo of the menu for a visit. The read gives the menu's lines as printed, in the menu's own language: the name, the
// weight where the menu prints it, the course from its section, and what the menu says is in the dish. Each plate is matched to
// a line; where two lines fit, that is the one question for that plate. A menu weight is what the kitchen says, often before
// cooking: it sets the plate's total and tightens the range to MENU_BAND either way; the plate stays Served, not weighed.
export type MenuLine = { name: string; grams?: number; unit?: "g" | "ml"; course?: Dish; about?: string };
export type MenuAsk = { plate: string; options: number[] };
export type VisitMenu = { visit: string; photo: string; at: string; lines: MenuLine[]; asks: MenuAsk[] };
export type MenuRead = { lines: MenuLine[]; matches: { plate: string; line: number }[]; asks: MenuAsk[] };
export const MENU_BAND = 0.15;

// what the server returns, checked: at most 40 lines with a name; a weight in sense; matches and questions that name a
// plate of the visit and lines that exist; a plate is matched or asked about, never both
export function cleanMenu(d: any, plateIds: string[]): MenuRead | null {
  if (!d || !Array.isArray(d.lines)) return null;
  const txt = (x: unknown, n: number) => (typeof x === "string" ? x.replace(/\s+/g, " ").trim().slice(0, n) : "");
  const lines: MenuLine[] = d.lines.slice(0, 40).map((l: any) => {
    const name = txt(l?.name, 80), g = typeof l?.grams === "number" && Number.isFinite(l.grams) && l.grams >= 10 && l.grams <= 3000 ? Math.round(l.grams) : undefined;
    const about = txt(l?.about, 140), course = (DISHES as readonly string[]).includes(String(l?.course)) ? (l.course as Dish) : undefined;
    return { name, ...(g ? { grams: g, unit: l?.unit === "ml" ? "ml" as const : "g" as const } : {}), ...(course ? { course } : {}), ...(about ? { about } : {}) };
  });
  if (!lines.some((l) => l.name)) return null;
  const okLine = (i: unknown): i is number => typeof i === "number" && Number.isInteger(i) && i >= 0 && i < lines.length && !!lines[i].name;
  const seen = new Set<string>(), matches: MenuRead["matches"] = [], asks: MenuAsk[] = [];
  for (const m of Array.isArray(d.matches) ? d.matches : []) {
    const plate = String(m?.plate ?? "");
    if (!plateIds.includes(plate) || seen.has(plate)) continue;
    const options = [...new Set((Array.isArray(m?.options) ? m.options : []).filter(okLine))].slice(0, 4) as number[];
    if (m?.sure === false && options.length >= 2) { asks.push({ plate, options }); seen.add(plate); }
    else if (okLine(m?.line)) { matches.push({ plate, line: m.line }); seen.add(plate); }
  }
  return { lines, matches, asks };
}
// a plate takes its line: the dish from the menu's section, and with a printed weight the plate's total becomes that weight,
// every food in proportion, each with the menu's band as its range
export function withMenuLine(s: Served, line: MenuLine): Served {
  const was = s.menu?.was ?? s.items;
  const total = was.reduce((n, i) => n + i.grams, 0);
  const items = line.grams && total > 0
    ? was.map((i) => { const g = Math.max(1, Math.round((i.grams * line.grams!) / total)); return { ...i, grams: g, est: { low: Math.round(g * (1 - MENU_BAND)), high: Math.round(g * (1 + MENU_BAND)) } }; })
    : was;
  return { ...s, items, ...(line.course ? { dish: line.course } : {}), menu: { ...line, ...(line.grams ? { was } : {}) } };
}
// Not this: the match comes off and the plate's foods are as the photo read them
export function withoutMenuLine(s: Served): Served {
  if (!s.menu) return s;
  const { menu, ...rest } = s;
  return { ...rest, items: menu.was ?? s.items };
}
// the read applied to the visit's plates
export function applyMenu(list: Served[], visit: string, read: MenuRead): Served[] {
  const by = new Map(read.matches.map((m) => [m.plate, read.lines[m.line]]));
  return list.map((s) => (s.visit === visit && by.has(s.id) ? withMenuLine(withoutMenuLine(s), by.get(s.id)!) : s));
}
