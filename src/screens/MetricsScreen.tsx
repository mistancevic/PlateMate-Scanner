import { Fragment, useEffect, useState } from "react";
import type { WeekStats, Ratio } from "../metricsCalc";

// The Metrics page (0.2.5+r17, canvas board M, M2 and M3): for Milan only, from the menu. This week, last week, or the
// last 4 weeks: the North Star, the five KPIs against their targets, the way in, this week in the app. Product measures
// only: what running the app costs is on its own page, Running costs (0.2.7+r1, M6b; CostsScreen).
// The numbers come from our own counter; until a full week is counted the page says since when it counts.
type Data = { stats: WeekStats; last: WeekStats; since: string | null; today: { day: string; visits: number; opened: number; eaten: number }; sinceTotals?: { visits: number; opened: number; eaten: number }; month: string };
type View = "week" | "last" | "four";
const DAY = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });
const range = (w: { from: string; to: string }) => `${DAY(w.from).split(" ")[0]} to ${DAY(w.to)}`;
const pct = (r: Ratio) => (r.of ? Math.round((r.n / r.of) * 100) : null);
const ratio = (r: Ratio) => (r.of ? `${r.n} of ${r.of}` : "–");
type Kpi = { name: string; now: string; last: string; target: string; state: "ok" | "low" | "none" };
function kpisOf(s: WeekStats, l: WeekStats): Kpi[] {
  const st = (v: number | null, ok: (v: number) => boolean): Kpi["state"] => (v === null ? "none" : ok(v) ? "ok" : "low");
  return [
    { name: "Days lived by the plan", now: s.northStar === null ? "–" : String(s.northStar), last: l.northStar === null ? "–" : String(l.northStar), target: "4 of 7", state: st(s.northStar, (v) => v >= 4) },
    { name: "Week-4 retention", now: ratio(s.retention), last: ratio(l.retention), target: "50 %", state: st(pct(s.retention), (v) => v >= 50) },
    { name: "First planned day in 7 days", now: ratio(s.firstPlanned), last: ratio(l.firstPlanned), target: "70 %", state: st(pct(s.firstPlanned), (v) => v >= 70) },
    { name: "Label reads kept", now: pct(s.labelKept) === null ? "–" : `${pct(s.labelKept)} %`, last: pct(l.labelKept) === null ? "–" : `${pct(l.labelKept)} %`, target: "85 %", state: st(pct(s.labelKept), (v) => v >= 85) },
    { name: "Safety flags answered in 24 h", now: ratio(s.flags), last: ratio(l.flags), target: "100 %", state: st(pct(s.flags), (v) => v >= 100) },
  ];
}
export function MetricsScreen() {
  const [view, setView] = useState<View>("week");
  const [data, setData] = useState<Data | null>(null);
  const [older, setOlder] = useState<WeekStats[]>([]);
  const [err, setErr] = useState("");
  const load = async (week?: string): Promise<Data | null> => {
    const r = await fetch(`/api/metrics${week ? `?week=${week}` : ""}`);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || "The numbers didn't load. Try again.");
    return d as Data;
  };
  useEffect(() => {
    load().then((d) => setData(d)).catch((e) => setErr(e.message));
  }, []);
  // 4 weeks: two more calls for the two weeks before last
  useEffect(() => {
    if (view !== "four" || !data || older.length) return;
    const w2 = new Date(`${data.last.week.from}T12:00:00Z`); w2.setUTCDate(w2.getUTCDate() - 7);
    const day = w2.toISOString().slice(0, 10);
    load(day).then((d) => (d ? setOlder([d.stats, d.last]) : null)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, data]);
  if (err) return <p className="small" style={{ color: "var(--low)" }}>{err}</p>;
  if (!data) return <p className="small muted">Counting…</p>;
  const s = view === "last" ? data.last : data.stats, l = view === "last" ? (older[0] ?? data.last) : data.last;
  const started = data.since;
  const fullWeek = started !== null && started <= data.last.week.from;
  const nextMonday = (() => { const t = new Date(`${data.stats.week.to}T12:00:00Z`); t.setUTCDate(t.getUTCDate() + 1); return t.toISOString().slice(0, 10); })();
  const tabs = (
    <div className="mt-tabs" role="tablist" aria-label="Which weeks">
      {([["week", "This week"], ["last", "Last week"], ["four", "4 weeks"]] as const).map(([k, t]) => <button key={k} role="tab" aria-selected={view === k} className={`pill pill-small${view === k ? " pill-primary" : ""}`} onClick={() => setView(k)}>{t}</button>)}
    </div>
  );
  // M3: until a full week is counted, since when, and today so far
  if (!fullWeek) return (
    <div className="mt">
      {tabs}
      <section className="card mt-card">
        <b className="mt-h">{started ? `Counting since ${DAY(started)}` : "Counting starts today"}</b>
        <small className="muted">The first full week shows on Monday, {DAY(nextMonday)}.</small>
        {/* next to today, the count since the first day (board M, M5) */}
        <div className="mt-grid3"><span /><small>TODAY</small><small>{started ? `SINCE ${DAY(started).toUpperCase().replace(/ (\w{3})\w*$/, " $1")}` : "SINCE"}</small>
          <span>Home page visits</span><b>{data.today.visits}</b><b className="muted">{data.sinceTotals?.visits ?? data.today.visits}</b>
          <span>Members who opened Today</span><b>{data.today.opened}</b><b className="muted">{data.sinceTotals?.opened ?? data.today.opened}</b>
          <span>Meals eaten and saved</span><b>{data.today.eaten}</b><b className="muted">{data.sinceTotals?.eaten ?? data.today.eaten}</b>
        </div>
      </section>
    </div>
  );
  const k = kpisOf(s, l);
  const w = s.wayIn, max = Math.max(1, w.visits);
  const bar = (label: string, n: number) => <div className="mt-way"><span>{label}</span><i><em style={{ width: `${Math.max(n ? 2 : 0, Math.round((n / max) * 100))}%` }} /></i><b>{n}</b></div>;
  return (
    <div className="mt">
      {tabs}
      {view === "four" ? (
        <section className="card mt-card">
          <b className="mt-h">The last 4 weeks</b>
          <div className="mt-four"><span /><small>DAYS LIVED</small><small>ACTIVE</small>
            {[data.stats, data.last, ...older].map((x) => <Fragment key={x.week.from}><span>{range(x.week)}</span><b>{x.northStar ?? "–"}</b><b>{x.active}</b></Fragment>)}
          </div>
          {older.length < 2 && <small className="muted">Loading the two weeks before…</small>}
        </section>
      ) : (<>
        <section className="card mt-card">
          <small className="mt-k">North Star</small>
          <b className="mt-h">Days lived by the plan</b>
          <div className="mt-big"><b>{s.northStar ?? "–"}</b><span>of 7</span><span className={`mt-st ${k[0].state}`}>target 4 of 7</span></div>
          <small className="muted">Per active member, {range(s.week)}. {view === "week" ? `Last week ${data.last.northStar ?? "–"}.` : ""} Active: {s.active}.</small>
          <details className="mt-how"><summary>How a day counts</summary><p>Every planned meal is closed: eaten, swapped or skipped on purpose. And the day ends on target: protein at least 90 % of the day's target, energy within 10 % of it. A lunch out fitted on the Plate counts.</p></details>
        </section>
        <section className="card mt-card">
          <b className="mt-h">The five KPIs</b>
          <div className="mt-kpi mt-kpi-head"><span /><span>NOW</span><span>{view === "last" ? "BEFORE" : "LAST"}</span><span>TARGET</span></div>
          {k.map((x) => <div className="mt-kpi" key={x.name}><span>{x.name}</span><b>{x.now}</b><small>{x.last}</small><span className={`mt-st ${x.state}`}>{x.target}</span></div>)}
          <small className="muted">Green: on target. Amber: below. Grey: nothing to count yet.</small>
        </section>
        <section className="card mt-card">
          <b className="mt-h">The way in</b>
          <small className="muted">Home page counts have no cookie and no visitor id; one visit is one page open.</small>
          {bar("Home page visits", w.visits)}{w.books.map((b) => <Fragment key={b.name}>{bar(`From ${b.name}`, b.n)}{b.by.length > 0 && <small className="muted mt-way-by">{b.by.map((y) => `${y.name} ${y.n}`).join(" · ")}</small>}</Fragment>)}{bar("Calculator used", w.calc)}{bar("Try Chef Mealan", w.tried)}{bar("Asked for access", w.asked)}{bar("Joined with a code", w.joined)}{bar("Active this week", w.active)}
        </section>
        <section className="card mt-card">
          <b className="mt-h">{view === "last" ? "That week in the app" : "This week in the app"}</b>
          {[["Planned days, per active member", s.plannedPerActive ?? "–", l.plannedPerActive ?? "–"], ["Meals by the plan", s.mealsByPlan === null ? "–" : `${s.mealsByPlan} %`, l.mealsByPlan === null ? "–" : `${l.mealsByPlan} %`],
            ["Days saved (a meal changed, day on target)", s.daysSaved, l.daysSaved], ["Plates fitted with Fit to my target", s.fitted, l.fitted], ["Weekly active members (Today on 3 or more days)", s.weeklyActive, l.weeklyActive]]
            .map(([a, n, m]) => <div className="mt-row" key={String(a)}><span>{a}</span><b>{n}</b><small>{m}</small></div>)}
        </section>
        <section className="card mt-card">
          <b className="mt-h">Covers and Members</b>
          <small className="muted">Real photos are the goal: how many drawn covers get a real photo decides drawn or realistic, later. Counts, no pictures, no recipe names.</small>
          {[["Covers drawn by Chef Mealan", s.covers?.drawn ?? 0, l.covers?.drawn ?? 0], ["Drawn covers replaced by a real photo", s.covers?.real ?? 0, l.covers?.real ?? 0],
            ["Members recipes opened", s.members?.open ?? 0, l.members?.open ?? 0], ["Made from Members", s.members?.make ?? 0, l.members?.make ?? 0],
            ["Kept in Mine from Members", s.members?.keep ?? 0, l.members?.keep ?? 0], ["Shared with members", s.members?.share ?? 0, l.members?.share ?? 0]]
            .map(([a, n, m]) => <div className="mt-row" key={String(a)}><span>{a}</span><b>{n}</b><small>{m}</small></div>)}
        </section>
      </>)}
    </div>
  );
}
