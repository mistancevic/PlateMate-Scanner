// What a meal is for. The day's band stays; the moment moves the plate's target.
import { w, wIn, type Val, type WordKey } from "./words";
export type MomentId = "regular" | "before" | "after" | "meeting" | "travel" | "celebration" | "afterwork";
export type Moment = { id: MomentId; name: string; planned: boolean; hint: string };
// DT243: a moment's name and hint on the screen, in the language chosen; the id is what is kept
const moment = (id: MomentId, planned: boolean): Moment => ({ id, planned, get name() { return w(`moment.${id}` as WordKey); }, get hint() { return w(`moment.hint.${id}` as WordKey); } });
export const MOMENTS: Moment[] = [
  moment("regular", true), moment("before", true), moment("after", true), moment("meeting", true), moment("travel", true),
  moment("celebration", false), moment("afterwork", false),
];
export const momentOf = (id?: MomentId | null) => MOMENTS.find((m) => m.id === id) ?? MOMENTS[0];
// The plate's target for a moment, from the day's target. dayKcal for the meeting cap.
export function momentTarget(id: MomentId, dayPd: number | null): number | null {
  if (dayPd === null) return null;
  switch (id) {
    case "before": return 3;
    case "after": return Math.max(7, dayPd);
    case "travel": return Math.max(1, dayPd - 1);
    case "celebration":
    case "afterwork": return Math.max(1, dayPd - 2);
    default: return dayPd;
  }
}
export const momentKcalShare = (id: MomentId) => (id === "meeting" ? 0.3 : 0.5);
// The shape of a person's week. Not a moment; it decides which moments come first, and later the day-part targets.
export type RhythmId = "desk" | "shifts" | "morning-training" | "evening-training" | "weekend-training" | "late-nights" | "eats-out" | "travels" | "family-dinners";
export const RHYTHMS: { id: RhythmId; name: string; first: MomentId[] }[] = [
  { id: "desk",             name: "9 to 5 desk",       first: ["meeting"] },
  { id: "shifts",           name: "Shift work",        first: ["regular"] },
  { id: "morning-training", name: "Morning training",  first: ["before", "after"] },
  { id: "evening-training", name: "Evening training",  first: ["after", "before"] },
  { id: "weekend-training", name: "Weekend training",  first: ["before", "after"] },
  { id: "late-nights",      name: "Sleep after midnight", first: ["afterwork"] },
  { id: "eats-out",         name: "Eats out often",    first: ["afterwork", "celebration"] },
  { id: "travels",          name: "Travels often",     first: ["travel"] },
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

// Where the person shops. Decides the starter foods and tells Mealan which shelves are real.
export type RegionId = "munich" | "germany" | "austria" | "switzerland" | "belgrade" | "serbia" | "madrid" | "spain" | "limassol" | "cyprus" | "elsewhere";
export const REGIONS: { id: RegionId; name: string; tags: string[] }[] = [
  { id: "munich",      name: "Munich",             tags: ["*", "de", "munich"] },
  { id: "germany",     name: "Germany, elsewhere", tags: ["*", "de"] },
  { id: "austria",     name: "Austria",            tags: ["*", "at", "de"] },
  { id: "switzerland", name: "Switzerland",        tags: ["*", "ch", "de"] },
  { id: "belgrade",    name: "Belgrade",           tags: ["*", "rs", "belgrade"] },
  { id: "serbia",      name: "Serbia, elsewhere",  tags: ["*", "rs"] },
  { id: "madrid",      name: "Madrid",             tags: ["*", "es", "madrid"] },
  { id: "spain",       name: "Spain, elsewhere",   tags: ["*", "es"] },
  { id: "limassol",    name: "Limassol",           tags: ["*", "cy", "limassol"] },
  { id: "cyprus",      name: "Cyprus, elsewhere",  tags: ["*", "cy"] },
  { id: "elsewhere",   name: "Elsewhere",          tags: ["*"] },
];
// DT243: a place's name on the screen, in the language chosen (the English name above stays for matching): "Germany, elsewhere"
const REGION_WORD: Record<RegionId, WordKey> = { munich: "opt.w.munich", germany: "opt.w.germanyElsewhere", austria: "opt.w.austria", switzerland: "opt.w.switzerland", belgrade: "opt.w.belgrade", serbia: "opt.w.serbiaElsewhere", madrid: "opt.w.madrid", spain: "opt.w.spainElsewhere", limassol: "opt.w.limassol", cyprus: "opt.w.cyprusElsewhere", elsewhere: "opt.w.elsewhere" };
// and short, without ", elsewhere": "Germany"
const REGION_SHORT: Partial<Record<RegionId, WordKey>> = { germany: "place.germany", serbia: "place.serbia", spain: "place.spain", cyprus: "place.cyprus" };
export const regionV = (id: string, short = false): Val => (l) => { const k = (short && REGION_SHORT[id as RegionId]) || REGION_WORD[id as RegionId]; return k ? wIn(l, k) : id; };
export const regionName = (id: string): string => { const k = REGION_WORD[id as RegionId]; return k ? w(k) : id; };
export const regionShort = (id: string): string => { const k = REGION_SHORT[id as RegionId] ?? REGION_WORD[id as RegionId]; return k ? w(k) : id; };
// Where a trip goes. Chosen on the craving screen when the moment is Travel; Mealan plans with that place's shelves.
const TKEY = "chefmealan-travel-to";
export const getTravelTo = (): RegionId | null => { try { return (localStorage.getItem(TKEY) as RegionId) || null; } catch { return null; } };
export const setTravelTo = (r: RegionId | null) => { try { if (r) localStorage.setItem(TKEY, r); else localStorage.removeItem(TKEY); } catch {} };
const RKEY = "chefmealan-region";
export const getRegion = (): RegionId | null => { try { return (localStorage.getItem(RKEY) as RegionId) || null; } catch { return null; } };
export const setRegion = (r: RegionId) => { try { localStorage.setItem(RKEY, r); } catch {} };
