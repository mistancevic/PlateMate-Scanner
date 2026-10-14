// Goal History as periods (canvas board FX, G0 and G3, Milan 14 October 2026). A goal holds from the day it was applied
// until the next one starts. Two applied on one day: the second replaces the first, so trying leaves no trace. The same
// goal with new numbers (a weigh-in, a new formula) stays one period with the newest numbers.
import type { GoalEntry } from "./goal";

const localDay = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const sameGoal = (a: GoalEntry, b: GoalEntry) => a.band === b.band && a.source === b.source;

export function collapseLog(log: GoalEntry[]): GoalEntry[] {
  const out: GoalEntry[] = [];
  for (const e of [...log].sort((x, y) => (x.at < y.at ? -1 : 1))) {
    const last = out[out.length - 1];
    if (last && sameGoal(last, e)) out[out.length - 1] = { ...e, at: last.at };
    else if (last && localDay(last.at) === localDay(e.at)) {
      out[out.length - 1] = e;
      // the replaced day may now repeat the goal before it: one period again
      const prev = out[out.length - 2];
      if (prev && sameGoal(prev, e)) { out.pop(); out[out.length - 1] = { ...e, at: prev.at }; }
    } else out.push(e);
  }
  return out;
}

export type Period = { entry: GoalEntry; from: string; to: string | null; days: number | null; now: boolean };
const DAY = 864e5;
const noon = (ymd: string) => new Date(`${ymd}T12:00:00`).getTime();
const prevDay = (ymd: string) => localDay(new Date(noon(ymd) - DAY).toISOString());
// newest first; the newest is the one in use now
export function periodsOf(log: GoalEntry[]): Period[] {
  const c = collapseLog(log);
  return c.map((e, i) => {
    const from = localDay(e.at), next = c[i + 1];
    const to = next ? prevDay(localDay(next.at)) : null;
    const days = to ? Math.round((noon(to) - noon(from)) / DAY) + 1 : null;
    return { entry: e, from, to, days, now: !next };
  }).filter((p) => p.days === null || p.days > 0).reverse();
}
const D = (ymd: string, month = true) => new Date(`${ymd}T12:00:00`).toLocaleDateString("en-GB", month ? { day: "numeric", month: "long" } : { day: "numeric" });
// "Since 12 October" or "9 to 11 October, 3 days"
export function periodLine(p: Period): string {
  if (!p.to) return `Since ${D(p.from)}`;
  const sameMonth = p.from.slice(0, 7) === p.to.slice(0, 7);
  const span = p.from === p.to ? D(p.from) : `${D(p.from, !sameMonth)} to ${D(p.to)}`;
  return `${span}, ${p.days} ${p.days === 1 ? "day" : "days"}`;
}
