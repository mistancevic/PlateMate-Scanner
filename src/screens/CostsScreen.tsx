import { useEffect, useState } from "react";

// Running costs (0.2.7+r1, canvas board M, M6b; Milan 15 October 2026: "this is not a metric, it is the cost of running the
// app"). For Milan only, from the menu, next to Metrics. AI use as counted on our server; cost per active member from that
// count at the two prices typed once (what one more member costs, automatic); the month's two bills as fixed cost, a total,
// not divided, with a check of the count against the AI bill. Later: the bills from Google's billing export.
type Use = { calls: number; in: number; out: number; pictures?: number; byModel: Record<string, number> };
type Data = { ai?: { today: Use; month: Use }; aiSince?: string | null; prices?: { in: number; out: number; at?: string } | null; monthActive?: number; month: string; bills: { ai: number; cloud: number } | null; picture?: { usd: number; eur: number; at: string } };
const eur = (n: number | null) => (n === null ? "–" : `€${n.toFixed(2)}`);
const DAY = (d: string) => new Date(`${d.slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });
export const COST_TARGET = 1; // euros per active member a month (the metrics doc)

export function CostsScreen() {
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  const [bills, setBills] = useState({ ai: "", cloud: "" });
  const [prices, setPrices] = useState({ in: "", out: "" });
  // Saved shows once, under the row that was saved (M6b)
  const [said, setSaid] = useState<{ where: "prices" | "bills"; text: string } | null>(null);
  const load = async (): Promise<Data> => {
    const r = await fetch("/api/metrics");
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || "The numbers didn't load. Try again.");
    return d as Data;
  };
  useEffect(() => {
    load().then((d) => { setData(d); if (d.bills) setBills({ ai: String(d.bills.ai), cloud: String(d.bills.cloud) }); if (d.prices) setPrices({ in: String(d.prices.in), out: String(d.prices.out) }); }).catch((e) => setErr(e.message));
  }, []);
  if (err) return <p className="small" style={{ color: "var(--low)" }}>{err}</p>;
  if (!data) return <p className="small muted">Counting…</p>;
  const num = (s: string) => Number(s.replace(",", "."));
  const post = async (url: string, body: unknown, where: "prices" | "bills", bad: string) => {
    setSaid(null);
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (r.ok) { setSaid({ where, text: "Saved." }); const d = await load().catch(() => null); if (d) setData(d); } else setSaid({ where, text: bad });
  };
  const monthName = new Date(`${data.month}-15T12:00:00Z`).toLocaleDateString("en-GB", { month: "long", timeZone: "UTC" });
  const p = data.prices && (data.prices.in || data.prices.out) ? data.prices : null;
  // pictures are priced per picture, not per token (0.2.11, board CO): Google's price, checked on the day in the line below
  const pic = data.picture?.eur ?? 0;
  const est = (u: Use) => (p ? (u.in / 1e6) * p.in + (u.out / 1e6) * p.out + (u.pictures ?? 0) * pic : null);
  const n = (x: number) => x.toLocaleString("en");
  const ai = data.ai, active = data.monthActive ?? 0;
  const aiMonth = ai ? est(ai.month) : null;
  const perActive = aiMonth !== null && active ? Math.round((aiMonth / active) * 100) / 100 : null;
  const top = ai ? Object.entries(ai.month.byModel).sort((a, b) => b[1] - a[1])[0]?.[0]?.replace(/_/g, ".") : undefined;
  const fixed = data.bills ? data.bills.ai + data.bills.cloud : null;
  const say = (where: "prices" | "bills") => (said?.where === where ? <small className="muted">{said.text}</small> : null);
  return (
    <div className="mt">
      {ai && (
        <section className="card mt-card">
          <b className="mt-h">AI use, {monthName}</b>
          <small className="muted">Counted on our server from every answer Gemini gives: calls and tokens, no words, no user.</small>
          <div className="mt-grid3"><span /><small>TODAY</small><small>MONTH</small>
            <span>Calls</span><b>{n(ai.today.calls)}</b><b className="muted">{n(ai.month.calls)}</b>
            <span>Tokens in</span><b>{n(ai.today.in)}</b><b className="muted">{n(ai.month.in)}</b>
            <span>Tokens out</span><b>{n(ai.today.out)}</b><b className="muted">{n(ai.month.out)}</b>
            <span>Pictures drawn</span><b>{n(ai.today.pictures ?? 0)}</b><b className="muted">{n(ai.month.pictures ?? 0)}</b>
            <span>At your prices</span><b>{p ? eur(est(ai.today)) : "–"}</b><b className="muted">{p ? eur(aiMonth) : "–"}</b>
          </div>
          <small className="muted">{Object.keys(ai.month.byModel).length ? `By model this month: ${Object.entries(ai.month.byModel).sort((a, b) => b[1] - a[1]).map(([k, c]) => `${k.replace(/_/g, ".")} ${c} ${c === 1 ? "call" : "calls"}`).join(", ")}.` : "No AI calls yet this month."}{data.aiSince ? ` Counting since ${DAY(data.aiSince)}.` : ""}{data.picture ? ` Pictures at €${data.picture.eur.toFixed(2)} each ($${data.picture.usd}, Google's price on ${DAY(data.picture.at)}), in the line above.` : ""}</small>
        </section>
      )}
      <section className="card mt-card">
        <b className="mt-h">Cost per active member, {monthName}</b>
        <div className="mt-big"><b>{eur(perActive)}</b><span>each</span><span className={`mt-st ${perActive === null ? "none" : perActive < COST_TARGET ? "ok" : "low"}`}>target under €{COST_TARGET}</span></div>
        <small className="muted">{!p ? "Type the two prices from Google's price page; the cost then counts itself from the calls above."
          : `AI calls at your prices: ${eur(aiMonth)} this month, for ${active} ${active === 1 ? "member" : "members"} active this month. Automatic from the count above. What one more member costs.`}</small>
        <div className="mt-bills">
          <label className="field-label">Price in, € per million tokens<input inputMode="decimal" value={prices.in} onChange={(e) => setPrices({ ...prices, in: e.target.value })} placeholder="from the price page" /></label>
          <label className="field-label">Price out, € per million<input inputMode="decimal" value={prices.out} onChange={(e) => setPrices({ ...prices, out: e.target.value })} placeholder="from the price page" /></label>
          <button className="pill pill-small" onClick={() => post("/api/metrics/prices", { in: num(prices.in), out: num(prices.out) }, "prices", "Type the two prices in euros per million tokens.")}>Save</button>
        </div>
        <small className="muted">From Google's price page for {top ?? "the model most calls use"}{top ? ", the model most calls use" : ""}.{p?.at ? ` Set on ${DAY(p.at)}.` : ""} Change them only when Google does.</small>
        {say("prices")}
      </section>
      <section className="card mt-card">
        <b className="mt-h">Fixed cost, {monthName}</b>
        <small className="muted">The two bills from Google, typed once a month. A total, not divided: most of it is there with 0 members or 50.</small>
        <div className="mt-bills">
          <label className="field-label">AI bill, €<input inputMode="decimal" value={bills.ai} onChange={(e) => setBills({ ...bills, ai: e.target.value })} placeholder="the monthly bill" /></label>
          <label className="field-label">Cloud bill, €<input inputMode="decimal" value={bills.cloud} onChange={(e) => setBills({ ...bills, cloud: e.target.value })} placeholder="the monthly bill" /></label>
          <button className="pill pill-small" onClick={() => post("/api/metrics/bills", { month: data.month, ai: num(bills.ai), cloud: num(bills.cloud) }, "bills", "Type the two bills in euros.")}>Save</button>
        </div>
        {fixed !== null && <div className="mt-big"><b>{eur(fixed)}</b><span>this month</span></div>}
        {data.bills && aiMonth !== null && <small className="ft-gap">The AI bill is {eur(data.bills.ai)}; the count at your prices is {eur(aiMonth)}. The bill also covers the preview, your tests and the days before counting started. A gap that stays big next month means the prices or the count are wrong.</small>}
        {say("bills")}
      </section>
    </div>
  );
}
