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
};
// what the Plate carries about the plate it is exploring
export type OnPlate = { id: string; mine: boolean; visit: string; dish: Dish; name?: string };

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
