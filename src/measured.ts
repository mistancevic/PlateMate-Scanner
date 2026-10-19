// The first two weeks and the measured burn (0.2.7, canvas board FT, Milan 15 October 2026). The first 14 days after the
import { wIn, wUnit } from "./units";
// first goal are for getting to know the person. The burn is then measured: what was eaten on average on full days, plus what
// the weight did, 1 kg counting as 7,700 kcal. A range, never by itself: it changes no number until the person or the coach
// applies it, and then it stays fixed until applied again. Off for anyone who declared a hard relationship with eating.
import type { WeighIn } from "./weight";
import type { DayLine } from "./dayLines";

export const KCAL_PER_KG = 7700, WINDOW = 14, NEED_FULL = 10, NEED_WEIGH = 7, SKIP_DAYS = 3, MIN_HALF = 75, GAP = 0.15, PHASE_MAX = 28;
const DAY = 864e5;
const dayNo = (ymd: string) => Math.round(new Date(`${ymd}T12:00:00`).getTime() / DAY);
const ymdOf = (n: number) => { const d = new Date(n * DAY); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`; };
export const addDays = (ymd: string, k: number) => ymdOf(dayNo(ymd) + k);
const r10 = (x: number) => Math.round(x / 10) * 10;

export type DayIn = { kcal: number; full: boolean; logged: boolean };
export type Square = { date: string; state: "full" | "part" | "today" | "todo"; weighed: boolean };
export type Measured = {
  start: string | null;        // the first goal's date, when it is recent enough for the first two weeks
  day: number | null;          // day of the first two weeks, 1 on the start date; null when there is no start
  phase: boolean;              // in the first two weeks (or past day 14, still not ready, up to day 28)
  from: string; to: string;    // the 14 days measured
  fullDays: number; weighIns: number;
  ate: number | null;          // kcal a day on average, full days only
  changeKg: number | null;     // what the weight line did over the 14 days
  kcal: number | null; lo: number | null; hi: number | null;
  ready: boolean;
  readyOn: string | null;      // the earliest date it can be ready, in the first 14 days
  squares: Square[];           // the 14 days of the first two weeks, for Today and the coach's list
};
export type MeasuredFixed = { kcal: number; from: string; to: string; at: string };

// A full day: every planned meal closed (eaten, swapped or skipped on purpose), and every meal slot of the day accounted
// for, by a meal in it, a skip, or an extra logged instead. Lines from before 0.2.7 carry no slot count: planned and closed.
export function fullOf(l: DayLine): boolean {
  if (l.when !== "past" || l.planned === 0 || l.open > 0 || l.missed > 0) return false;
  if (typeof l.slotCount !== "number") return true;
  return l.byPlan + l.swapped + l.skipped + l.extras.length >= l.slotCount;
}
export const daysFromLines = (lines: Record<string, DayLine> | undefined): Record<string, DayIn> =>
  Object.fromEntries(Object.entries(lines ?? {}).map(([k, l]) => [k, { kcal: l.kcal, full: typeof l.full === "boolean" ? l.full : fullOf(l), logged: l.byPlan + l.swapped + l.extras.length > 0 }]));

// the start of the first two weeks: the first goal's date (the goal history and the goal itself), if any
export function startOf(goal: { setAt?: string } | null | undefined, goalLog: { at?: string }[] | null | undefined): string | null {
  const dates = [...(goalLog ?? []).map((g) => g.at), goal?.setAt].filter((x): x is string => typeof x === "string" && x.length >= 10).map((x) => localYmd(x));
  return dates.length ? dates.sort()[0] : null;
}
const localYmd = (iso: string) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? iso.slice(0, 10) : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

// a straight line through the weigh-ins: kg per day, and how far the weigh-ins sit off it
function line(pts: { x: number; y: number }[]): { slope: number; se: number } | null {
  if (pts.length < 2) return null;
  const n = pts.length, mx = pts.reduce((a, p) => a + p.x, 0) / n, my = pts.reduce((a, p) => a + p.y, 0) / n;
  const sxx = pts.reduce((a, p) => a + (p.x - mx) ** 2, 0);
  if (sxx === 0) return null;
  const slope = pts.reduce((a, p) => a + (p.x - mx) * (p.y - my), 0) / sxx;
  const sse = pts.reduce((a, p) => a + (p.y - (my + slope * (p.x - mx))) ** 2, 0);
  const se = n > 2 ? Math.sqrt(sse / (n - 2) / sxx) : Infinity;
  return { slope, se };
}

export function measure(o: { days: Record<string, DayIn>; weighIns: WeighIn[] | undefined; today: string; start: string | null }): Measured {
  const t = dayNo(o.today);
  const s = o.start && t - dayNo(o.start) >= 0 && t - dayNo(o.start) < PHASE_MAX ? o.start : null;
  const day = s ? t - dayNo(s) + 1 : null;
  // the 14 days: from the start while in the first 14, else the last 14 up to today
  const from = s && day! <= WINDOW ? s : addDays(o.today, -(WINDOW - 1));
  const to = addDays(from, WINDOW - 1);
  const f = dayNo(from), lastDone = Math.min(dayNo(to), t - 1);
  // weigh-ins count from day 4 of the first two weeks: early changes are mostly water
  const wFrom = s ? Math.max(f, dayNo(s) + SKIP_DAYS) : f;
  const eaten: number[] = [];
  for (let n = f; n <= lastDone; n++) { const d = o.days[ymdOf(n)]; if (d?.full) eaten.push(d.kcal); }
  const pts = (o.weighIns ?? []).map((w) => ({ x: dayNo(w.date), y: w.kg })).filter((p) => p.x >= wFrom && p.x <= Math.min(dayNo(to), t));
  const ate = eaten.length ? eaten.reduce((a, x) => a + x, 0) / eaten.length : null;
  const ln = line(pts);
  const enough = eaten.length >= NEED_FULL && pts.length >= NEED_WEIGH && !!ln && (!s || day! >= WINDOW);
  const kcal = ate !== null && ln ? r10(ate - ln.slope * KCAL_PER_KG) : null;
  const half = ln && Number.isFinite(ln.se) ? Math.max(MIN_HALF, r10(ln.se * KCAL_PER_KG)) : MIN_HALF;
  const ready = enough && kcal !== null;
  // R21 (0.2.49, board RS20): the squares are the days counted: the first 14 from the start, after day 14 the last 14, today last
  const sq0 = s && day! <= WINDOW ? dayNo(s) : f;
  const squares: Square[] = s ? Array.from({ length: WINDOW }, (_, i) => {
    const n = sq0 + i, k = ymdOf(n), d = o.days[k];
    return { date: k, state: n === t ? "today" : n > t ? "todo" : d?.full ? "full" : "part", weighed: (o.weighIns ?? []).some((w) => w.date === k) };
  }) : [];
  return {
    start: s, day, phase: !!s && !ready, from, to, fullDays: eaten.length, weighIns: pts.length,
    ate: ate === null ? null : r10(ate), changeKg: ln ? Math.round(ln.slope * WINDOW * 100) / 100 : null,
    kcal: ready ? kcal : null, lo: ready ? kcal! - half : null, hi: ready ? kcal! + half : null, ready,
    readyOn: s && day! < WINDOW ? addDays(s, WINDOW - 1) : null, squares,
  };
}

// the gap from the formula, and the line that goes with it when it is big
export function gapOf(m: Measured, formulaKcal: number | null): { kcal: number; pct: number; line: string | null } | null {
  if (!m.ready || m.kcal === null || !formulaKcal) return null;
  const kcal = m.kcal - formulaKcal, pct = Math.round((kcal / formulaKcal) * 100);
  const big = Math.abs(kcal / formulaKcal) > GAP;
  return { kcal, pct, line: !big ? null : kcal < 0 ? "Most often some meals go unlogged. Check the days before using it." : "Check before using it: is the everyday busier than the profile says? Is the weigh-in the same each morning?" };
}

// the date in words: "Friday 23 October"
const WD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MO = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const longDate = (ymd: string) => { const d = new Date(`${ymd}T12:00:00`); return `${WD[d.getDay()]} ${d.getDate()} ${MO[d.getMonth()]}`; };
export const shortDate = (ymd: string) => { const d = new Date(`${ymd}T12:00:00`); return `${WD[d.getDay()].slice(0, 3)} ${d.getDate()} ${MO[d.getMonth()].slice(0, 3)}`; };
export const spanOf = (from: string, to: string) => { const a = new Date(`${from}T12:00:00`), b = new Date(`${to}T12:00:00`); return a.getMonth() === b.getMonth() ? `${a.getDate()} to ${b.getDate()} ${MO[b.getMonth()]}` : `${a.getDate()} ${MO[a.getMonth()]} to ${b.getDate()} ${MO[b.getMonth()]}`; };
export const kgText = (x: number) => `${Math.abs(wIn(x)).toFixed(2).replace(/0$/, "").replace(/\.0$/, "")} ${wUnit()}`;
