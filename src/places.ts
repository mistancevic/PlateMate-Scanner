// DT136 (0.2.120, board Stories93, version 3; Milan 27 October 18:23 to 28 October 14:59, "DT136. Can go"; Tester 3 in
// Limassol saw Belgrade's foods). Every food knows where it is sold: a list of places, or none for a food sold everywhere
// (eggs, oats, the basic foods). Home is always on; any other place is on when you switch it on, or while a trip there is on.
// A food shows in your search when it is sold everywhere or in a place that is on. Nothing here deletes a food.
import type { Food } from "./pilot";
import { REGIONS, type RegionId } from "./moments";
import { REFERENCE, localName, namesOf, marketFoods, type RefFood } from "./reference";

export type Trip = { place: RegionId; from: string; to: string; on?: boolean | null };

// a trip is on from its first day to its last; its switch can turn it on earlier or off any time
export const tripOn = (t: Trip | null | undefined, today: string): boolean => (t ? (typeof t.on === "boolean" ? t.on : today >= t.from && today <= t.to) : false);
// a trip is over the day after its last day, unless its switch keeps it on
export const tripOver = (t: Trip | null | undefined, today: string): boolean => Boolean(t && today > t.to && t.on !== true);

// the places that are on: home, the ones switched on, and a trip's place while its trip is on
export function activePlaces(home: string | null | undefined, on: string[], trip: Trip | null | undefined, today: string): Set<string> {
  const s = new Set<string>(on);
  if (home) s.add(home);
  if (tripOn(trip, today)) s.add(trip!.place);
  return s;
}

// two places sell the same when they share a market: Belgrade and Serbia, elsewhere; Munich and Germany, elsewhere
const marketTags = (id: string): string[] => (REGIONS.find((r) => r.id === id)?.tags ?? [id]).filter((t) => t !== "*");
export const samePlace = (a: string, b: string): boolean => a === b || marketTags(a).some((t) => marketTags(b).includes(t));
export const inPlaces = (places: string[] | undefined, active: Set<string>): boolean => !places || places.length === 0 || places.some((p) => [...active].some((a) => samePlace(p, a)));
export const inPlace = (f: Pick<Food, "places">, active: Set<string>): boolean => inPlaces(f.places, active);

export const placeName = (id: string): string => (REGIONS.find((r) => r.id === id)?.name ?? id).replace(/, elsewhere$/, "");
const byName = (n: string): RegionId | null => (REGIONS.find((r) => r.name.replace(/, elsewhere$/, "").toLowerCase() === n.trim().toLowerCase())?.id as RegionId) ?? null;

// a food already in a library, before foods had places: read from its name. A basic food named in Serbian came from Belgrade,
// in German from Munich; a Cypriot basic food is Limassol's; a member's copy says where it was seen. No clue: everywhere.
export function inferPlaces(f: Food): string[] {
  const ref = f.refId ? REFERENCE.find((r) => r.id === f.refId) : null;
  if (ref) {
    if (ref.id.startsWith("cy-")) return ["limassol"];
    const n = f.name.trim().toLowerCase();
    if (n === ref.en.toLowerCase()) return [];
    if (n === ref.sr.toLowerCase() || n === ref.cyr.toLowerCase()) return n === ref.en.toLowerCase() ? [] : ["belgrade"];
    if (n === ref.de.toLowerCase()) return n === ref.en.toLowerCase() ? [] : ["munich"];
    return [];
  }
  if (f.source === "Members' foods") {
    const seen = /seen in ([^;.]+)/.exec(f.notes ?? "")?.[1];
    if (seen) return seen.split(/ and /).map(byName).filter((x): x is RegionId => Boolean(x)).slice(0, 2);
  }
  return [];
}

// a food added now: the place you are in (your trip's while it is on, else home). A basic food and a common starter food are
// sold everywhere; a Cypriot basic food is Limassol's wherever you add it.
export function placesOfNew(f: Food, here: string | null | undefined): string[] {
  if (f.refId?.startsWith("cy-")) return ["limassol"];
  if (/reference table/i.test(f.source ?? "") || /^typical values/i.test(f.brand ?? "")) return [];
  return here ? [here] : [];
}

// a basic food takes the name of where you are now; the name it came with stays as another name
export function renameForPlace(f: Food, region: string | null | undefined): Food {
  const ref = f.refId ? REFERENCE.find((r) => r.id === f.refId) : null;
  if (!ref) return f;
  const names = namesOf(ref);
  if (!names.includes(f.name)) return f; // a name you changed yourself stays
  const want = localName(ref, region);
  if (want === f.name) return f;
  return { ...f, name: want, aliases: [...new Set([...(f.aliases ?? []), f.name])].filter((x) => x !== want) };
}

// the foods you used: on a plate, in a recipe, planned, logged, a favourite. Delete unused never touches these.
export function usedIds(x: { items: { food: { id: string } }[]; meals: { items: { food: { id: string } }[] }[]; feedback: any[]; foods: Food[] }, planned: unknown): Set<string> {
  const s = new Set<string>();
  x.items.forEach((i) => s.add(i.food.id));
  x.meals.forEach((m) => m.items.forEach((i) => s.add(i.food.id)));
  x.foods.forEach((f) => f.favorite && s.add(f.id));
  // logged meals and the plan carry copies of the foods: their ids and names, read from the stored data as text
  const text = JSON.stringify([x.feedback, planned ?? null]);
  x.foods.forEach((f) => { if (text.includes(`"${f.id}"`)) s.add(f.id); });
  return s;
}

// how many of your foods each place holds
export function countByPlace(foods: Food[]): Map<string, number> {
  const m = new Map<string, number>();
  foods.forEach((f) => (f.places ?? []).forEach((p) => m.set(p, (m.get(p) ?? 0) + 1)));
  return m;
}

const ONKEY = "chefmealan-places-on", TRIPKEY = "chefmealan-trip", STARTKEY = "chefmealan-places-started";
const read = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } };
const write = (k: string, v: unknown) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch {} };
export const getPlacesOn = (): string[] => read<string[]>(ONKEY, []);
export const setPlacesOn = (v: string[]) => write(ONKEY, v);
export const getTrip = (): Trip | null => read<Trip | null>(TRIPKEY, null);
export const setTrip = (t: Trip | null) => write(TRIPKEY, t);
// the places whose starter foods were added once, so switching one on again adds nothing twice
export const getStarted = (): string[] => read<string[]>(STARTKEY, []);
export const setStarted = (v: string[]) => write(STARTKEY, v);
export const MIGRATED = "chefmealan-places-v1";

// DT148 (0.2.129): the basic foods sold where you are: the table's foods sold everywhere, and each place's own (Cyprus has
// fifty), with the place they belong to
export function basicsHere(active: Set<string>): { ref: RefFood; place: string | null }[] {
  const out: { ref: RefFood; place: string | null }[] = REFERENCE.filter((r) => !r.id.startsWith("cy-")).map((ref) => ({ ref, place: null }));
  const seen = new Set<string>();
  for (const a of active) for (const ref of marketFoods(REGIONS.find((r) => r.id === a)?.tags ?? [])) if (!seen.has(ref.id)) { seen.add(ref.id); out.push({ ref, place: a }); }
  return out;
}
