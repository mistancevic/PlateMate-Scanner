// DT179 (0.3.23, board Stories127, Coach Milan 31 October 09:07 Go): from your calendar to the app. Busy and free times only,
// never titles. Plan shows a busy block as Busy, and asks once where a busy block meets the plan: a meal inside a meeting
// (before, after, or keep), a late evening before dinner (a quick dinner, or cook the day before), a full day (a meal to
// carry), training inside a busy block (move it, a rest day, or keep). It suggests; times change only on a tap.
import type { Slot } from "./slots";
import { toMin, toTime } from "./slots";
import type { PlanDay } from "./plan";

export type Block = { from: number; to: number }; // minutes past the date's midnight
const pad = (n: number) => String(n).padStart(2, "0");
const ymdOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// a clock time past midnight shows as 24:00, not 00:00
export const clock = (min: number) => (min >= 1440 ? "24:00" : toTime(min));

// the busy blocks of one date, merged, in that date's minutes
export function blocksOn(date: string, busy: { s: number; e: number }[]): Block[] {
  const start = new Date(`${date}T00:00:00`).getTime(), end = start + 864e5;
  const raw = busy.filter((b) => b.e > start && b.s < end)
    .map((b) => ({ from: Math.max(0, Math.round((b.s - start) / 6e4)), to: Math.min(1440, Math.round((b.e - start) / 6e4)) }))
    .sort((a, b) => a.from - b.from);
  const out: Block[] = [];
  for (const b of raw) { const last = out[out.length - 1]; if (last && b.from <= last.to) last.to = Math.max(last.to, b.to); else out.push({ ...b }); }
  return out;
}
export const blockWords = (b: Block) => `${clock(b.from)} to ${clock(b.to)}`;

export type Ask =
  | { kind: "meal"; slotId: string; name: string; time: string; block: Block; before: string | null; after: string | null }
  | { kind: "late"; slotId: string; name: string; time: string; block: Block; free: number }
  | { kind: "carry"; slotId: string; name: string; time: string; block: Block }
  | { kind: "training"; time: string; minutes: number; block: Block; move: string | null };
export const askKey = (date: string, a: Ask) => `${date}|${a.kind}|${a.kind === "training" ? "training" : a.slotId}`;

export const MEAL_MIN = 30, FULL_DAY = 6 * 60, LATE_FREE = 45;
const inBlock = (blocks: Block[], from: number, to: number) => blocks.find((b) => b.from < to && b.to > from) ?? null;

export function asksOn(date: string, slots: Slot[], training: PlanDay | null, blocks: Block[], kept: string[] = []): Ask[] {
  if (!blocks.length) return [];
  const out: Ask[] = [];
  const times = slots.map((s) => toMin(s.time));
  slots.forEach((s, i) => {
    const t = times[i], b = inBlock(blocks, t, t + MEAL_MIN);
    if (b) {
      if (b.to - b.from >= FULL_DAY) { out.push({ kind: "carry", slotId: s.id, name: s.name, time: s.time, block: b }); return; }
      // before the block, or right after it: never inside another block, and an hour clear of the meals either side
      const prev = i > 0 ? times[i - 1] : -Infinity, next = i < slots.length - 1 ? times[i + 1] : Infinity;
      const fits = (m: number) => m >= 0 && m + MEAL_MIN <= 1440 && !inBlock(blocks, m, m + MEAL_MIN) && m - prev >= 60 && next - m >= 60;
      const bf = b.from - MEAL_MIN, af = b.to;
      const before = fits(bf) ? clock(bf) : null, after = fits(af) ? clock(af) : null;
      if (before || after) out.push({ kind: "meal", slotId: s.id, name: s.name, time: s.time, block: b, before, after });
      return;
    }
    // the last meal of the day: a busy block that ends less than 45 minutes before it leaves little time to cook
    if (i === slots.length - 1) {
      const late = blocks.filter((x) => x.to <= t && t - x.to < LATE_FREE).pop();
      if (late) out.push({ kind: "late", slotId: s.id, name: s.name, time: s.time, block: late, free: t - late.to });
    }
  });
  const at = training && training.kind !== "rest" && training.at && /^\d\d:\d\d$/.test(training.at) ? toMin(training.at) : null;
  if (at !== null) {
    const min = training!.minutes || 60, b = inBlock(blocks, at, at + min);
    if (b) { const m = b.to; out.push({ kind: "training", time: training!.at!, minutes: min, block: b, move: m + min <= 23 * 60 && !inBlock(blocks, m, m + min) ? clock(m) : null }); }
  }
  return out.filter((a) => !kept.includes(askKey(date, a)));
}
// the day before, as YYYY-MM-DD
export const dayBefore = (date: string) => { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() - 1); return ymdOf(d); };
// kept suggestions and moves for dates gone by drop off
export function pruneCal<T extends { kept?: string[]; moved?: Record<string, string>; ahead?: Record<string, string> }>(c: T, today: string): T {
  return { ...c, kept: (c.kept ?? []).filter((k) => k.slice(0, 10) >= today), moved: Object.fromEntries(Object.entries(c.moved ?? {}).filter(([k]) => k.slice(0, 10) >= today)),
    ahead: Object.fromEntries(Object.entries(c.ahead ?? {}).filter(([k]) => k.slice(0, 10) >= today)) };
}
