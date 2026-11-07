// DT176 (0.3.19, board Stories124; Coach Milan 30 October 19:27 to 19:31, Go 20:51): Travel mode, a manual switch. For as long
// as it is on, the app serves the place you are in: search and scan read that country's shelves, Chef Mealan suggests what fits
// the kitchen you have there, weigh-in pauses. Nothing in the profile changes: travel sits on top of it, and Turn off puts
// everything back. Kept with the profile (owner-only), so it is on every phone of yours.
import type { RegionId } from "./moments";
import { REGIONS, regionName } from "./moments";
import { w, dateText, type WordKey } from "./words";

export type TravelKitchen = "hotel" | "flat" | "family";
export type Travel = { place: RegionId; kitchen: TravelKitchen; since: string; weighPaused: boolean };
export type Trip = { place: RegionId; kitchen: TravelKitchen; from: string; to: string };

// DT243: the name and hint on the screen in the language chosen; chef is what Chef Mealan is told, in fixed English words
const kitchen = (id: TravelKitchen, chef: string) => ({ id, chef, get name() { return w(`travel.kitchen.${id}` as WordKey); }, get hint() { return w(`travel.kitchenHint.${id}` as WordKey); } });
export const KITCHENS: { id: TravelKitchen; name: string; hint: string; chef: string }[] = [
  kitchen("hotel", "a hotel with no kitchen"),
  kitchen("flat", "a flat with a basic kitchen"),
  kitchen("family", "with family or friends, a full kitchen"),
];
export const placeName = (r: RegionId | null | undefined) => (REGIONS.some((x) => x.id === r) ? regionName(r!) : w("travel.away"));
export const kitchenName = (k: TravelKitchen) => KITCHENS.find((x) => x.id === k)?.name ?? "";
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
// days away, counting the first and today: on Thursday, off on Sunday, 4 days
export function daysAway(since: string, now = new Date()): number {
  const a = new Date(`${since.slice(0, 10)}T12:00:00`), b = new Date(`${ymd(now)}T12:00:00`);
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 864e5) + 1);
}
// "since Thursday", "since today", "since 2 November"
export function sinceWords(since: string, now = new Date()): string {
  const d = daysAway(since, now), at = new Date(`${since.slice(0, 10)}T12:00:00`);
  if (d === 1) return w("travel.sinceToday");
  if (d < 7) return w("travel.since", { day: dateText(at, { weekday: "long" }) });
  return w("travel.since", { day: dateText(at, { day: "numeric", month: "long" }) });
}
// the trip as it is kept when travel mode goes off; at most 20, newest last
export function endTravel(t: Travel, trips: Trip[] | undefined, now = new Date()): Trip[] {
  return [...(trips ?? []), { place: t.place, kitchen: t.kitchen, from: t.since.slice(0, 10), to: ymd(now) }].slice(-20);
}
// whether a day was spent travelling: a trip kept, or the travel on now
export function travelOn(day: string, trips: Trip[] | undefined, now: Travel | null | undefined): Trip | null {
  if (now && day >= now.since.slice(0, 10)) return { place: now.place, kitchen: now.kitchen, from: now.since.slice(0, 10), to: "" };
  return (trips ?? []).find((x) => day >= x.from && day <= x.to) ?? null;
}
// what Chef Mealan is told, in fixed words (server: EATS_AWAY)
export const awayWords = (t: Travel | null | undefined) => (t ? `${KITCHENS.find((k) => k.id === t.kitchen)!.chef}, in ${REGIONS.find((x) => x.id === t.place)?.name ?? "away"}` : null);
export const AWAY_KITCHENS = KITCHENS.map((k) => k.chef);
