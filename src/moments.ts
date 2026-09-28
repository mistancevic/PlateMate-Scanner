// What a meal is for. The day's band stays; the moment moves the plate's target.
export type MomentId = "regular" | "before" | "after" | "meeting" | "celebration" | "afterwork";
export type Moment = { id: MomentId; name: string; planned: boolean; hint: string };
export const MOMENTS: Moment[] = [
  { id: "regular",     name: "Regular meal",        planned: true,  hint: "Fits your day." },
  { id: "before",      name: "Before training",     planned: true,  hint: "Energy that's easy to take in. Keep fat and fibre low." },
  { id: "after",       name: "After training",      planned: true,  hint: "Protein first." },
  { id: "meeting",     name: "Meeting day",         planned: true,  hint: "Steady energy, no dip. Keep the plate small." },
  { id: "celebration", name: "Celebration at work", planned: false, hint: "Just happened. Enjoy it, keep it small; the next meal leans protein." },
  { id: "afterwork",   name: "Afterwork event",     planned: false, hint: "Just happened. Enjoy it, keep it small; the next meal leans protein." },
];
export const momentOf = (id?: MomentId | null) => MOMENTS.find((m) => m.id === id) ?? MOMENTS[0];
// The plate's target for a moment, from the day's target. dayKcal for the meeting cap.
export function momentTarget(id: MomentId, dayPd: number | null): number | null {
  if (dayPd === null) return null;
  switch (id) {
    case "before": return 3;
    case "after": return Math.max(7, dayPd);
    case "celebration":
    case "afterwork": return Math.max(1, dayPd - 2);
    default: return dayPd;
  }
}
export const momentKcalShare = (id: MomentId) => (id === "meeting" ? 0.3 : 0.5);
const KEY = "chefmealan-usual-moments";
export const getUsual = (): MomentId[] => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } };
export const setUsual = (ids: MomentId[]) => { try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch {} };
