import { BOOK_PAGES, BOOK_SOURCES, bookHit } from "./bookPages";
// The Metrics page's numbers (0.2.5+r17, canvas board M, M2; the metrics doc "Chef Mealan: metrics and KPIs"). Pure
// functions over the counted events, so the server and the tests read the same rules. A member is a number, never an
// email. Days are calendar days in Munich; a week runs Monday to Sunday.
export type Ev = { m: string; e: string; day: string; d?: Record<string, unknown> };
export type Extra = {
  hp: Record<string, number>;              // home page counts in the week: hp_visit, hp_calc, hp_try, built_visit
  asked: number;                           // access requests in the week
  joined: number;                          // members who joined with a code in the week
  flags: { total: number; answered: number }; // safety flags in the week, and those a coach answered within 24 hours
  bills?: { ai: number; cloud: number } | null; // this month's two bills, typed by Milan, in euros
  monthActive?: number;                    // members active this month
};
export const addDays = (day: string, n: number) => { const t = new Date(`${day}T12:00:00Z`); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
export const mondayOf = (day: string) => { const t = new Date(`${day}T12:00:00Z`); const w = (t.getUTCDay() + 6) % 7; return addDays(day, -w); };
const inRange = (day: string, from: string, to: string) => day >= from && day <= to;
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
export type Ratio = { n: number; of: number };
export type WeekStats = {
  week: { from: string; to: string };
  // covers and Members (0.2.15): drawn covers, drawn covers replaced by a real photo, and what members did with Members
  covers: { drawn: number; real: number };
  members: { open: number; make: number; keep: number; share: number };
  active: number;                          // members who opened Today in the week
  northStar: number | null;                // days lived by the plan, per active member
  lived: number;
  plannedPerActive: number | null;
  mealsByPlan: number | null;              // share of eaten meals that were by the plan, 0 to 100
  daysSaved: number;                       // a slot changed and the day still ended on target
  fitted: number;                          // plates fitted with Fit to my target
  weeklyActive: number;                    // members who opened Today on 3 or more days
  retention: Ratio;                        // the cohort that started four weeks ago, still active this week
  firstPlanned: Ratio;                     // new members with a planned day within their first 7 days
  labelKept: Ratio;                        // AI label reads saved without a change
  flags: Ratio;
  wayIn: { visits: number; qr: number; ig: number; books: { name: string; n: number; by: { name: string; n: number }[] }[]; calc: number; tried: number; asked: number; joined: number; active: number };
  cost: { perActive: number | null; total: number | null };
};
export function weekStats(all: Ev[], from: string, x: Extra): WeekStats {
  const to = addDays(from, 6);
  const week = all.filter((v) => inRange(v.day, from, to));
  const opens = all.filter((v) => v.e === "app_open");
  const first = new Map<string, string>();
  for (const o of opens) if (!first.has(o.m) || o.day < first.get(o.m)!) first.set(o.m, o.day);
  const activeDays = new Map<string, Set<string>>();
  for (const o of week.filter((v) => v.e === "app_open")) { if (!activeDays.has(o.m)) activeDays.set(o.m, new Set()); activeDays.get(o.m)!.add(o.day); }
  const active = activeDays.size;
  // one closed day per member and date: the last one sent counts
  const closed = new Map<string, Ev>();
  for (const c of week.filter((v) => v.e === "day_closed")) closed.set(`${c.m}|${c.day}`, c);
  const days = [...closed.values()];
  const lived = days.filter((c) => c.d?.lived === true).length;
  const planned = days.filter((c) => num(c.d?.planned) > 0).length;
  const byPlan = days.reduce((s, c) => s + num(c.d?.byPlan), 0), extras = days.reduce((s, c) => s + num(c.d?.extras), 0);
  const per = (n: number) => (active ? Math.round((n / active) * 10) / 10 : null);
  // the cohort that started three weeks before this week, and who of them came back this week
  const cohort = [...first].filter(([, d]) => inRange(d, addDays(from, -21), addDays(from, -15))).map(([m]) => m);
  // new members whose first 7 days are over: a planned day within those 7 days
  const fresh = [...first].filter(([, d]) => inRange(d, addDays(from, -28), addDays(to, -7)));
  const allClosed = all.filter((v) => v.e === "day_closed" && num(v.d?.planned) > 0);
  const firstPlanned = fresh.filter(([m, d]) => allClosed.some((c) => c.m === m && inRange(c.day, d, addDays(d, 6)))).length;
  const labels = week.filter((v) => v.e === "label_read");
  const total = x.bills ? Math.round((x.bills.ai + x.bills.cloud) * 100) / 100 : null;
  return {
    week: { from, to }, active, northStar: per(lived), lived, plannedPerActive: per(planned),
    mealsByPlan: byPlan + extras ? Math.round((byPlan / (byPlan + extras)) * 100) : null,
    daysSaved: days.filter((c) => c.d?.lived === true && num(c.d?.swapped) > 0).length,
    fitted: week.filter((v) => v.e === "fit_used").length,
    covers: { drawn: week.filter((v) => v.e === "cover" && v.d?.how === "drawn").length, real: week.filter((v) => v.e === "cover" && v.d?.how === "real").length },
    members: Object.fromEntries(["open", "make", "keep", "share"].map((h) => [h, week.filter((v) => v.e === "members" && v.d?.how === h).length])) as WeekStats["members"],
    weeklyActive: [...activeDays.values()].filter((s) => s.size >= 3).length,
    retention: { n: cohort.filter((m) => activeDays.has(m)).length, of: cohort.length },
    firstPlanned: { n: firstPlanned, of: fresh.length },
    labelKept: { n: labels.filter((v) => v.d?.kept === true).length, of: labels.length },
    flags: { n: x.flags.answered, of: x.flags.total },
    wayIn: { visits: x.hp.hp_visit ?? 0, qr: x.hp.hp_qr ?? 0, ig: x.hp.hp_ig ?? 0, books: Object.entries(BOOK_PAGES).map(([slug, name]) => ({ name, n: x.hp[bookHit(slug)] ?? 0, by: Object.entries(BOOK_SOURCES).map(([s, label]) => ({ name: label, n: x.hp[bookHit(slug, s)] ?? 0 })).filter((y) => y.n > 0) })), calc: x.hp.hp_calc ?? 0, tried: x.hp.hp_try ?? 0, asked: x.asked, joined: x.joined, active },
    cost: { total, perActive: total !== null && x.monthActive ? Math.round((total / x.monthActive) * 100) / 100 : null },
  };
}
// A day lived by the plan (Milan, 13 October 2026): every planned meal closed (eaten, swapped or skipped on purpose)
// and the day ends on target: protein at least 90 % of the day's target, energy within 10 % of it.
export function livedByPlan(r: { planned: number; open: number; kcal: number; protein: number }, target: { kcal: number; protein: number } | null) {
  const proteinPct = target?.protein ? Math.round((r.protein / target.protein) * 100) : null;
  const energyPct = target?.kcal ? Math.round((r.kcal / target.kcal) * 100) : null;
  const lived = r.planned > 0 && r.open === 0 && proteinPct !== null && energyPct !== null && proteinPct >= 90 && energyPct >= 90 && energyPct <= 110;
  return { lived, proteinPct, energyPct };
}
