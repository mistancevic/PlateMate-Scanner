import { useState } from "react";
import { KCAL_PER_KG, NEED_FULL, NEED_WEIGH, SKIP_DAYS, WINDOW, gapOf, kgText, longDate, shortDate, spanOf, type Measured, type MeasuredFixed } from "../measured";

// The first two weeks and the measured burn on screen (0.2.7, canvas board FT): Today (FT1, FT2), Me, Goal (FT3, FT4) and the
// coach (FT6, FT7). One card for the person and the coach; only the words for who it is about change.
const n = (x: number) => Math.round(x).toLocaleString("en");

export function Squares({ m, ends = true }: { m: Measured; ends?: boolean }) {
  if (!m.squares.length) return null;
  return (
    <>
      <div className="ft-squares" role="img" aria-label={`${m.fullDays} full days and ${m.squares.filter((s) => s.weighed).length} weigh-ins in the first two weeks`}>
        {m.squares.map((s) => <span key={s.date} className={`ft-sq ${s.state} ${s.weighed ? "weighed" : ""}`}><span /><i /></span>)}
      </div>
      {ends && <div className="ft-ends"><span>{shortDate(m.squares[0].date)}</span><span>{shortDate(m.squares[WINDOW - 1].date)}</span></div>}
    </>
  );
}
const Legend = () => <small className="ft-legend"><i className="k-full" />a full day <i className="k-part" />not fully logged <i className="k-w" />weigh-in</small>;

// FT1: Today, days 1 to 14 (and past day 14 while it is not ready)
export function KnowCard({ m, openGoal }: { m: Measured; openGoal: () => void }) {
  const weighed = m.squares.filter((s) => s.weighed).length;
  return (
    <section className="card ft-card ft-know">
      <small className="ft-caps">GETTING TO KNOW YOU · DAY {m.day} OF {WINDOW}</small>
      <b className="ft-ask">Log every meal, and weigh in most mornings.</b>
      <Squares m={m} />
      <Legend />
      <small className="ft-text">{m.day! < WINDOW
        ? `On day 14, Chef Mealan works out what your body really burns, from what you ate and how your weight moved. ${m.fullDays} full ${m.fullDays === 1 ? "day" : "days"} and ${weighed} ${weighed === 1 ? "weigh-in" : "weigh-ins"} so far.`
        : `Not enough data yet: ${m.fullDays} of ${NEED_FULL} full days and ${m.weighIns} of ${NEED_WEIGH} weigh-ins in the last 14 days. It goes on until it is ready.`}</small>
      <button className="link" style={{ alignSelf: "flex-start" }} onClick={openGoal}>How it works ›</button>
    </section>
  );
}

// FT2: Today, the day it is ready, once
export function ReadyCard({ m, formulaKcal, seeGoal, gotIt }: { m: Measured; formulaKcal: number | null; seeGoal: () => void; gotIt: () => void }) {
  return (
    <section className="card ft-card ft-ready">
      <small className="ft-caps ft-ok">✓ YOUR BURN IS MEASURED</small>
      <div className="ft-big"><b>{n(m.kcal!)}</b><b>kcal a day</b></div>
      <small className="ft-text">Give or take {n(m.hi! - m.kcal!)}. From your 14 days: {m.fullDays} full days and {m.weighIns} weigh-ins.{formulaKcal ? ` The formula said ${n(formulaKcal)}.` : ""} Your numbers stay as they are until you choose.</small>
      <div className="button-row" style={{ marginTop: 4 }}><button className="pill pill-small pill-primary" onClick={seeGoal}>See it on Goal</button><button className="pill pill-small" onClick={gotIt}>Got it</button></div>
    </section>
  );
}

function Scale({ lo, kcal, hi, formula }: { lo: number; kcal: number; hi: number; formula: number | null }) {
  // at least 100 kcal of room on each side, and 500 across; an end label gives way to a marker that sits on it
  let a = Math.floor((Math.min(lo, formula ?? lo) - 100) / 100) * 100, b = Math.ceil((Math.max(hi, formula ?? hi) + 100) / 100) * 100;
  while (b - a < 500) { if ((b - a) % 200 === 0) b += 100; else a -= 100; }
  const x = (k: number) => `${((k - a) / (b - a)) * 100}%`;
  const near = (end: number) => formula !== null && Math.abs(formula - end) / (b - a) < 0.16;
  return (
    <div className="ft-scale" aria-hidden="true">
      <span className="s-track" />
      <span className="s-range" style={{ left: x(lo), width: `calc(${x(hi)} - ${x(lo)})` }} />
      <span className="s-dot" style={{ left: x(kcal) }} />
      <span className="s-lab" style={{ left: x(kcal), top: -4, color: "var(--brand-text)" }}>YOUR DATA</span>
      {formula !== null && <><span className="s-tick" style={{ left: x(formula) }} /><span className="s-lab" style={{ left: x(formula), top: 30, color: "var(--ink)" }}>FORMULA</span></>}
      {!near(a) && <span className="s-end" style={{ left: 0 }}>{n(a)}</span>}{!near(b) && <span className="s-end" style={{ right: 0 }}>{n(b)}</span>}
    </div>
  );
}
const Bar = ({ label, have, need }: { label: string; have: number; need: number }) => (
  <div className="ft-bar"><div><span>{label}</span><span>{have} of {need} needed</span></div><i><em style={{ width: `${Math.min(100, (have / need) * 100)}%` }} /></i></div>
);

// FT3 and FT4 on Me, Goal; FT7 on the coach's page of a client (name given)
export function BurnCard({ m, formulaKcal, name, inUse, onUse }: { m: Measured; formulaKcal: number | null; name?: string; inUse?: MeasuredFixed | null; onUse?: () => void }) {
  const [how, setHow] = useState(false);
  const coach = !!name;
  const whose = coach ? `${name!.toUpperCase()}'S` : "YOUR";
  const fromStart = !!m.start && m.from === m.start;
  if (!m.ready) {
    return (
      <section className="card ft-card ft-burn ft-wait">
        <small className="ft-caps">{whose} BURN, MEASURED{m.day ? ` · DAY ${m.day} OF ${WINDOW}` : ""}</small>
        <b style={{ fontSize: 16 }}>Not enough data yet</b>
        <Squares m={m} />
        <Bar label="Full days" have={m.fullDays} need={NEED_FULL} />
        <Bar label={fromStart ? `Weigh-ins from day ${SKIP_DAYS + 1}` : "Weigh-ins"} have={m.weighIns} need={NEED_WEIGH} />
        <small className="ft-text">A full day: every planned meal eaten, swapped or skipped on purpose, and anything extra logged. Weigh in in the morning, before breakfast.{fromStart ? ` The first ${SKIP_DAYS} days' weigh-ins don't count: early changes are mostly water.` : ""}</small>
        <small className="ft-strong">{m.readyOn ? `Ready on ${longDate(m.readyOn)} at the earliest.` : "It goes on with the last 14 days until it is ready."}</small>
      </section>
    );
  }
  const change = m.changeKg ?? 0, perDay = Math.round(Math.abs(change) * KCAL_PER_KG / WINDOW / 10) * 10;
  const gap = gapOf(m, formulaKcal);
  const weight = change === 0 ? "the same over 14 days" : `${change < 0 ? "down" : "up"} ${kgText(change)} in 14 days`;
  return (
    <section className="card ft-card ft-burn">
      <small className="ft-caps">{whose} BURN, MEASURED · {coach ? "LAST 14 DAYS" : spanOf(m.from, m.to).toUpperCase()}</small>
      <div className="ft-big"><b>{n(m.kcal!)}</b><b>kcal a day</b></div>
      <small className="ft-text">Somewhere between {n(m.lo!)} and {n(m.hi!)}.{formulaKcal ? ` The formula says ${n(formulaKcal)}.` : ""}</small>
      {!coach && <Scale lo={m.lo!} kcal={m.kcal!} hi={m.hi!} formula={formulaKcal} />}
      <div className="ft-row"><small>{coach ? `${name} ate` : "You ate"}</small><b>{n(m.ate!)} kcal a day on average, on {m.fullDays} full days</b></div>
      <div className="ft-row"><small>{coach ? "The weight" : "Your weight"}</small><b>{coach ? `${weight}, ${m.weighIns} weigh-ins` : `${weight}, from the line through ${m.weighIns} weigh-ins`}</b></div>
      <div className="ft-row"><small>{coach ? "So the burn" : "So you burned"}</small><b>{change === 0 ? `about what ${coach ? "was" : "you"} ate` : `${coach ? "" : `${kgText(change)} × 7,700 kcal ÷ 14 days = `}about ${perDay} kcal a day ${change < 0 ? "more" : "less"} than ${coach ? "eaten" : "you ate"}`}</b></div>
      {gap?.line && <small className="ft-gap">{n(Math.abs(gap.kcal))} kcal {gap.kcal > 0 ? "more" : "less"} than the formula, {Math.abs(gap.pct)} %. {gap.line}</small>}
      {coach ? <small className="ft-text">To use it, pick From {name}'s data under Formula, or set a new goal from a date.</small> : (
        <>
          <div className="button-row" style={{ marginTop: 6 }}>{onUse && <button className="pill pill-small pill-primary" onClick={onUse}>Use my data</button>}<button className="link" aria-expanded={how} onClick={() => setHow((v) => !v)}>{how ? "Close How it's worked out" : "How it's worked out ›"}</button></div>
          {how && (
            <div className="ft-how">
              <p><b>What you ate.</b> The average of your full days: every planned meal eaten, swapped or skipped on purpose, and anything extra logged. Days with a meal missing don't count.</p>
              <p><b>What your weight did.</b> A straight line through your weigh-ins, not the first and the last morning. In your first two weeks, weigh-ins count from day {SKIP_DAYS + 1}: early changes are mostly water.</p>
              <p><b>The burn.</b> What you ate, plus 7,700 kcal for each kg the line went down, or minus for each kg it went up, spread over the 14 days.</p>
              <p><b>The range.</b> The more your weigh-ins sit off the line, the wider it is. It needs {NEED_FULL} full days and {NEED_WEIGH} weigh-ins in 14 days.</p>
            </div>
          )}
          <small className="ft-text">{inUse ? `In use since ${longDate(inUse.at.slice(0, 10))}: ${n(inUse.kcal)} kcal a day, from ${spanOf(inUse.from, inUse.to)}. A newer number is used only when you apply it again.` : "Your numbers stay as they are until you choose. This card keeps updating from your last 14 days."}</small>
        </>
      )}
    </section>
  );
}
