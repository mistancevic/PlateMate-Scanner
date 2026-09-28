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
// The shape of a person's week. Not a moment; it decides which moments come first, and later the day-part targets.
export type RhythmId = "desk" | "shifts" | "morning-training" | "evening-training" | "weekend-training" | "late-nights" | "eats-out" | "family-dinners";
export const RHYTHMS: { id: RhythmId; name: string; first: MomentId[] }[] = [
  { id: "desk",             name: "9 to 5 desk",       first: ["meeting"] },
  { id: "shifts",           name: "Shift work",        first: ["regular"] },
  { id: "morning-training", name: "Morning training",  first: ["before", "after"] },
  { id: "evening-training", name: "Evening training",  first: ["after", "before"] },
  { id: "weekend-training", name: "Weekend training",  first: ["before", "after"] },
  { id: "late-nights",      name: "Sleep after midnight", first: ["afterwork"] },
  { id: "eats-out",         name: "Eats out often",    first: ["afterwork", "celebration"] },
  { id: "family-dinners",   name: "Family dinners",    first: ["regular"] },
];
const KEY = "chefmealan-rhythm";
export const getUsual = (): RhythmId[] => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } };
export const setUsual = (ids: RhythmId[]) => { try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch {} };
// Moments ordered by the week: the ones the rhythm points at first, regular always present.
export function orderMoments(rhythm: RhythmId[]): Moment[] {
  const firsts = rhythm.flatMap((r) => RHYTHMS.find((x) => x.id === r)?.first ?? []);
  const rank = (m: Moment) => { const i = firsts.indexOf(m.id); return i === -1 ? 99 : i; };
  return [...MOMENTS].sort((a, b) => (a.id === "regular" ? -1 : b.id === "regular" ? 1 : rank(a) - rank(b)));
}
