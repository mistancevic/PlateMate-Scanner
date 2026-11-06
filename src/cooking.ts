// DT214 (0.3.53, board Stories162, Coach Milan 2 November 12:17 to 12:54): the cook, one cooking from Start cooking to how it
// carried you. The Plate is what you eat now and is always free; a cook is one time you make something, with its own plate,
// kept on the phone and in the account from its first tap. One cook runs at a time; another waits in Saved for later.
// DT212 v4 (board Stories159): a plate can be saved for later too; both wait in the same block on the Plate for 7 days.
// Pure functions here, so the walkthroughs and the unit tests read the same rules.
import { wIn, wnIn, w, wn } from "./words";
import { foodNameIn } from "./reference";
import { locOf, type Lang } from "./lang";
import { say } from "./chefScript";
import type { PilotState } from "./pilot";

// what the Plate holds: the foods and everything that belongs to them
export const PLATE_KEYS = ["items", "pick", "title", "portion", "fromRecipe", "optional", "leftOut", "emptyParts", "cooking", "cookingFor", "recipeFoods", "openRecipe", "plateAt", "photo", "plateAsked", "recorded", "course"] as const;
export type PlateSnap = Partial<Pick<PilotState, (typeof PLATE_KEYS)[number]>>;
export const EMPTY_PLATE: PlateSnap = { items: [], title: "", portion: null };

// what Make and Eat collected so far: ticks, photos and answers; Journey's own words for them
export type CookUi = {
  step?: "in" | "recipe" | "make" | "made" | "after";
  ticks?: string[];
  // the photo of each step, by the step's place
  stepPhotos?: Record<string, string>;
  // The meal, the final look
  final?: string;
  went?: "as" | "not";
  different?: string;
  ate?: "all" | "portion" | "later" | "not";
  eatN?: number;
  madeN?: number | null;
  keepMade?: boolean;
  good?: "daam" | "good" | "no" | null;
  note?: string;
  title?: string;
  method?: string | null;
  pmode?: "whole" | "sized" | "recipe";
  makeAll?: boolean | null;
  way?: unknown;
  plateSteps?: unknown;
  madeBy?: unknown;
  tried?: "yes" | "ok" | "no" | null;
};
export type Cook = {
  id: string;
  startedAt: string;
  title: string;
  recipeId?: string;
  // make: Make; eat: Eat; later: made, eaten later today (its card waits on Today); carry: eaten, How did it carry you is next
  stage: "make" | "eat" | "later" | "carry";
  // the cook's plate while you are elsewhere; the free Plate while you are in the cook
  plate: PlateSnap;
  free?: PlateSnap;
  inView?: boolean;
  ui: CookUi;
  steps?: number;
  cardId?: string;
  eatenAt?: string;
};
export type Later = { id: string; at: string; kind: "plate" | "cook"; plate?: PlateSnap; cook?: Cook };
export const LATER_DAYS = 7;

const uid = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`);

export function snapOf(s: PilotState): PlateSnap {
  const out: any = {};
  for (const k of PLATE_KEYS) if ((s as any)[k] !== undefined) out[k] = structuredClone((s as any)[k]);
  return out;
}
export function withSnap(s: PilotState, snap: PlateSnap | undefined): PilotState {
  const n: any = { ...s };
  for (const k of PLATE_KEYS) n[k] = undefined;
  Object.assign(n, EMPTY_PLATE, structuredClone(snap ?? {}));
  if (!Array.isArray(n.items)) n.items = [];
  if (typeof n.title !== "string") n.title = "";
  if (n.portion === undefined) n.portion = null;
  return n;
}
export const plateEmpty = (x: PlateSnap | undefined) => !x?.items?.length;

// leaving the cook (another tab): its plate goes with it, the free Plate comes back
export function swapOut(s: PilotState): PilotState {
  const c = s.cook;
  if (!c || !c.inView) return s;
  return { ...withSnap(s, c.free), cook: { ...c, plate: snapOf(s), free: undefined, inView: false } };
}
// Go on: back into the cook, the free Plate waits
export function swapIn(s: PilotState): PilotState {
  const c = s.cook;
  if (!c || c.inView) return s;
  return { ...withSnap(s, c.plate), cook: { ...c, free: snapOf(s), inView: true } };
}
// the cook as it stands, with its plate filled in when you are in it
export function cookNow(s: PilotState): Cook | undefined {
  const c = s.cook;
  if (!c) return undefined;
  return c.inView ? { ...c, plate: snapOf(s), free: undefined, inView: false } : c;
}

// A cook that is not done yet waits in Saved for later; one already eaten closes (its card keeps everything)
function putAway(s: PilotState, now: string): PilotState {
  const c = cookNow(s);
  if (!c) return s;
  const base = s.cook?.inView ? withSnap(s, s.cook.free) : s;
  if (c.stage === "make" || c.stage === "eat") return { ...base, cook: undefined, later: [{ id: uid(), at: now, kind: "cook" as const, cook: { ...c, free: undefined, inView: false } }, ...(s.later ?? [])].slice(0, 8) };
  return { ...base, cook: undefined };
}

// Start a cook from the plate as it is now: the plate becomes the cook's, the free Plate is empty
export function startCook(s: PilotState, x: { title: string; recipeId?: string; stage?: "make" | "eat"; steps?: number; now?: string }): PilotState {
  const now = x.now ?? new Date().toISOString();
  const dish = snapOf(s);
  const s1 = s.cook ? putAway(withSnap(s, dish), now) : s;
  // a running cook in view had the dish as its plate: put it away first, then the dish is this cook's
  const s2 = withSnap(s1, dish);
  return { ...s2, cook: { id: uid(), startedAt: now, title: x.title, ...(x.recipeId ? { recipeId: x.recipeId } : {}), stage: x.stage ?? "make", plate: {}, free: EMPTY_PLATE, inView: true, ui: {}, ...(x.steps ? { steps: x.steps } : {}) } };
}

export function closeCook(s: PilotState): PilotState {
  if (!s.cook) return s;
  return s.cook.inView ? { ...withSnap(s, s.cook.free), cook: undefined } : { ...s, cook: undefined };
}

// DT212: Save for later keeps the plate as it is; the Plate is free
export function savePlate(s: PilotState, now = new Date().toISOString()): PilotState {
  if (plateEmpty(snapOf(s))) return s;
  return { ...withSnap(s, EMPTY_PLATE), later: [{ id: uid(), at: now, kind: "plate" as const, plate: snapOf(s) }, ...(s.later ?? [])].slice(0, 8) };
}
export function saveCookForLater(s: PilotState, now = new Date().toISOString()): PilotState { return putAway(s, now); }

// Continue: a saved plate goes back on the Plate (the Plate is empty by then); a saved cook runs again, in view
export function continueLater(s: PilotState, id: string, now = new Date().toISOString()): PilotState {
  const it = (s.later ?? []).find((x) => x.id === id);
  if (!it) return s;
  const rest = (s.later ?? []).filter((x) => x.id !== id);
  if (it.kind === "plate") return { ...withSnap({ ...s, later: rest }, it.plate), later: rest };
  const s1 = s.cook ? putAway({ ...s, later: rest }, now) : { ...s, later: rest };
  const free = snapOf(s1);
  return { ...withSnap(s1, it.cook!.plate), cook: { ...it.cook!, free, inView: true } };
}
export const removeLater = (s: PilotState, id: string): PilotState => ({ ...s, later: (s.later ?? []).filter((x) => x.id !== id) });

// Kept 7 days; a cook eaten on an earlier day whose last question was never answered closes at the end of its day
export function tidyCooks(s: PilotState, now = new Date()): PilotState {
  const keep = (s.later ?? []).filter((x) => now.getTime() - Date.parse(x.at) < LATER_DAYS * 86_400_000);
  let n: PilotState = keep.length !== (s.later ?? []).length ? { ...s, later: keep } : s;
  const c = n.cook;
  if (c && (c.stage === "carry" || c.stage === "later")) {
    const at = new Date(c.eatenAt ?? c.startedAt);
    if (at.toDateString() !== now.toDateString()) n = closeCook(n);
  }
  return n;
}

// the step the strip names: the first one not ticked
export function stepAt(c: Cook): { k: number; n: number } | null {
  const n = c.steps ?? 0;
  if (!n) return null;
  const t = new Set(c.ui.ticks ?? []);
  let k = 0;
  while (k < n && t.has(`s${k}`)) k++;
  return { k: Math.min(n, k + 1), n };
}
export const CARRY_AFTER_MIN = 30;
export function carryIn(c: Cook, now = new Date()): number | null {
  if (c.stage !== "carry" || !c.eatenAt) return null;
  return Math.max(0, Math.ceil(CARRY_AFTER_MIN - (now.getTime() - Date.parse(c.eatenAt)) / 60000));
}
const hhmm = (iso: string) => { const d = new Date(iso); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
// the strip's words: Cooking now · Protein Pancake · step 3 of 5; after eating, when Chef Mealan asks
export function stripWords(c: Cook, now = new Date()): { lead: string; rest: string } | null {
  if (c.stage === "make" || c.stage === "eat") {
    const at = stepAt(c);
    return { lead: w("cook.cookingNow"), rest: [c.title, c.stage === "eat" ? w("cook.stageEat") : at ? w("cook.stepOf", { k: at.k, n: at.n }) : ""].filter(Boolean).join(" · ") };
  }
  if (c.stage === "carry" && c.eatenAt) {
    const m = carryIn(c, now) ?? 0;
    return { lead: w("cook.eatenAt", { time: hhmm(c.eatenAt) }), rest: `${c.title} · ${m > 0 ? w("cook.asksIn", { m }) : w("cook.asks")}` };
  }
  return null;
}
// DT227 (0.3.61): how many of the cook's steps are ticked
export const stepsTicked = (c: Cook) => { const n = c.steps ?? 0; return (c.ui.ticks ?? []).filter((x) => /^s\d+$/.test(x) && Number(x.slice(1)) < n).length; };
// Coming back in the middle: You were cooking Protein Pancake: 3 of 5 steps ticked, 2 photos. Go on where you left off?
export function resumeLine(c: Cook): string {
  const n = c.steps ?? 0, t = (c.ui.ticks ?? []).filter((x) => /^s\d+$/.test(x) && Number(x.slice(1)) < n).length;
  const ph = Object.keys(c.ui.stepPhotos ?? {}).length + (c.ui.final ? 1 : 0);
  const parts = [n ? w("cook.stepsTicked", { t, n }) : "", ph ? wn("cook.photosN", ph) : ""].filter(Boolean);
  return say("resume", c.title, parts.join(", "));
}
// something to resume: a tick, a photo or an answer
export const cookStarted = (c: Cook | undefined) => !!c && ((c.ui.ticks?.length ?? 0) > 0 || Object.keys(c.ui.stepPhotos ?? {}).length > 0 || !!c.ui.final || c.ui.went === "not" || c.stage === "eat");
// the row in Saved for later: its name, when, how many foods
export function laterRow(x: Later): { title: string; photo?: string; foods: number } {
  const p = x.kind === "cook" ? x.cook!.plate : x.plate!;
  const title = x.kind === "cook" ? x.cook!.title : p.title && p.title !== "DaaM" ? p.title : foodsLine(p.items ?? []);
  const photo = x.kind === "cook" ? x.cook!.ui.final ?? Object.values(x.cook!.ui.stepPhotos ?? {})[0] ?? p.photo?.image : p.photo?.image;
  return { title: title || "A plate", photo, foods: (p.items ?? []).length };
}

// DT206 and DT212: when the plate started (its first food, or its photo); over 3 hours, or another day, is a plate from an earlier
// meal. Keep working on it marks it, and that plate is not asked about again.
export function plateSince(s: Pick<PilotState, "plateAt" | "photo">): Date | null {
  const t = [s.plateAt, s.photo?.at].filter(Boolean).map((x) => Date.parse(x!)).filter((x) => !Number.isNaN(x));
  return t.length ? new Date(Math.min(...t)) : null;
}
export function plateOldOf(s: Pick<PilotState, "plateAt" | "photo" | "items" | "plateAsked">, now = new Date()): boolean {
  const at = plateSince(s);
  if (!at || !s.items?.length) return false;
  if (s.plateAsked && s.plateAsked === at.toISOString()) return false;
  return now.getTime() - at.getTime() > 3 * 3600000 || now.toDateString() !== at.toDateString();
}
const hm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
// yesterday, 13:11 · today, 09:40 · Friday, 13:11 · 24 October, 13:11
// DT203 release 2 (0.3.77): each in a given language; null when a word of it has no ticked Serbian yet (the line stays English).
// Day and month names come from the phone's calendar (Intl), in the language's own form.
export function dayIn(l: Lang, d: Date, now = new Date()): string | null {
  const a = new Date(d); a.setHours(12, 0, 0, 0); const b = new Date(now); b.setHours(12, 0, 0, 0);
  const n = Math.round((b.getTime() - a.getTime()) / 86400000), loc = locOf(l);
  return n === 0 ? wIn(l, "day.today") : n === 1 ? wIn(l, "day.yesterday") : n > 1 && n < 7 ? d.toLocaleDateString(loc, { weekday: "long" }) : d.toLocaleDateString(loc, { day: "numeric", month: "long" });
}
export const dayWord = (d: Date, now = new Date()): string => dayIn("en", d, now)!;
export const whenIn = (l: Lang, d: Date, now = new Date()): string | null => { const x = dayIn(l, d, now); return x === null ? null : `${x}, ${hm(d)}`; };
export const whenWords = (d: Date, now = new Date()) => whenIn("en", d, now)!;
// 20 minutes ago · an hour ago · 2 hours ago
export function agoIn(l: Lang, d: Date, now = new Date()): string | null {
  const m = Math.max(0, Math.round((now.getTime() - d.getTime()) / 60000));
  if (m < 2) return wIn(l, "ago.minute");
  if (m < 60) return wnIn(l, "ago.minutes", m);
  const h = Math.round(m / 60);
  return h === 1 ? wIn(l, "ago.hour") : wnIn(l, "ago.hours", h);
}
export const agoWords = (d: Date, now = new Date()): string => agoIn("en", d, now)!;
// Chicken breast, peas and rice: the first name as it is, the others in small letters, each without what follows its comma
export function foodsLineIn(l: Lang, items: { food: { name: string; refId?: string } }[]): string | null {
  const n = items.map((i, k) => { const x = foodNameIn(l, i.food).split(",")[0].trim(); return k === 0 ? x : x.charAt(0).toLowerCase() + x.slice(1); });
  return n.length > 1 ? wIn(l, "list.and", { rest: n.slice(0, -1).join(", "), last: n[n.length - 1] }) : n[0] ?? "";
}
export const foodsLine = (items: { food: { name: string; refId?: string } }[]): string => foodsLineIn("en", items)!;
