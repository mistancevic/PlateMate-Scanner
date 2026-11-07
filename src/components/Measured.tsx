import { numLocale, w, wnIn } from "../words";
import { useState } from "react";
import { KCAL_PER_KG, NEED_FULL, NEED_WEIGH, SKIP_DAYS, WINDOW, gapOf, kgText, longDate, shortDate, spanOf, type Measured, type MeasuredFixed } from "../measured";

// The first two weeks and the measured burn on screen (0.2.7, canvas board FT): Today (FT1, FT2), Me, Goal (FT3, FT4) and the
// coach (FT6, FT7). One card for the person and the coach; only the words for who it is about change.
const n = (x: number) => Math.round(x).toLocaleString(numLocale());

export function Squares({ m, ends = true }: { m: Measured; ends?: boolean }) {
  if (!m.squares.length) return null;
  return (
    <>
      <div className="ft-squares" role="img" aria-label={w("measured.squaresAria", { full: m.fullDays, weighed: m.squares.filter((s) => s.weighed).length })}>
        {m.squares.map((s) => <span key={s.date} className={`ft-sq ${s.state} ${s.weighed ? "weighed" : ""}`}><span /><i /></span>)}
      </div>
      {ends && <div className="ft-ends"><span>{shortDate(m.squares[0].date)}</span><span>{shortDate(m.squares[WINDOW - 1].date)}</span></div>}
    </>
  );
}
const Legend = () => <small className="ft-legend"><i className="k-full" />{w("measured.aFullDay")} <i className="k-part" />{w("measured.notFullyLogged")} <i className="k-w" />{w("measured.weighIn")}</small>;

// FT1: Today, days 1 to 14 (and past day 14 while it is not ready)
export function KnowCard({ m, openGoal }: { m: Measured; openGoal: () => void }) {
  const weighed = m.squares.filter((s) => s.weighed).length;
  return (
    <section className="card ft-card ft-know">
      {/* R21 (0.2.49, board RS20): past day 14 the count is over the last 14 days, and the card says so */}
      <small className="ft-caps">{m.day! > WINDOW ? w("measured.knowLast14") : w("measured.knowDay", { day: m.day!, of: WINDOW })}</small>
      <b className="ft-ask">{w("measured.logEveryMealAndWeigh")}</b>
      <Squares m={m} />
      <Legend />
      <small className="ft-text">{m.day! < WINDOW
        ? w("measured.onDay14", { full: (l) => wnIn(l, "measured.fullDaysN", m.fullDays), weighed: (l) => wnIn(l, "measured.weighInsN", weighed) })
        : w("measured.notEnough", { full: m.fullDays, needFull: NEED_FULL, weighed: m.weighIns, needWeigh: NEED_WEIGH })}</small>
      <button className="link" style={{ alignSelf: "flex-start" }} onClick={openGoal}>{w("measured.howItWorks")}</button>
    </section>
  );
}

// FT2: Today, the day it is ready, once
export function ReadyCard({ m, formulaKcal, seeGoal, gotIt }: { m: Measured; formulaKcal: number | null; seeGoal: () => void; gotIt: () => void }) {
  return (
    <section className="card ft-card ft-ready">
      <small className="ft-caps ft-ok">✓ {w("measured.burnIsMeasured")}</small>
      <div className="ft-big"><b>{n(m.kcal!)}</b><b>{w("measured.kcalADay")}</b></div>
      <small className="ft-text">{w("measured.readyGive", { range: n(m.hi! - m.kcal!), full: m.fullDays, weighed: m.weighIns })}{formulaKcal ? ` ${w("measured.formulaSaid", { kcal: n(formulaKcal) })}` : ""} {w("measured.readyStay")}</small>
      <div className="button-row" style={{ marginTop: 4 }}><button className="pill pill-small pill-primary" onClick={seeGoal}>{w("measured.seeItOnGoal")}</button><button className="pill pill-small" onClick={gotIt}>{w("measured.gotIt")}</button></div>
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
      <span className="s-lab" style={{ left: x(kcal), top: -4, color: "var(--brand-text)" }}>{w("measured.yourData")}</span>
      {formula !== null && <><span className="s-tick" style={{ left: x(formula) }} /><span className="s-lab" style={{ left: x(formula), top: 30, color: "var(--ink)" }}>{w("measured.formula")}</span></>}
      {!near(a) && <span className="s-end" style={{ left: 0 }}>{n(a)}</span>}{!near(b) && <span className="s-end" style={{ right: 0 }}>{n(b)}</span>}
    </div>
  );
}
const Bar = ({ label, have, need }: { label: string; have: number; need: number }) => (
  <div className="ft-bar"><div><span>{label}</span><span>{w("measured.ofNeeded", { have, need })}</span></div><i><em style={{ width: `${Math.min(100, (have / need) * 100)}%` }} /></i></div>
);

// FT3 and FT4 on Me, Goal; FT7 on the coach's page of a client (name given)
export function BurnCard({ m, formulaKcal, name, inUse, onUse }: { m: Measured; formulaKcal: number | null; name?: string; inUse?: MeasuredFixed | null; onUse?: () => void }) {
  const [how, setHow] = useState(false);
  const coach = !!name;
  const whose = coach ? name!.toUpperCase() : "";
  const fromStart = !!m.start && m.from === m.start;
  if (!m.ready) {
    return (
      <section className="card ft-card ft-burn ft-wait">
        <small className="ft-caps">{coach ? w("measured.burnOf", { who: whose }) : w("measured.burnYour")}{m.day ? (m.day > WINDOW ? w("measured.capsLast14") : w("measured.capsDay", { day: m.day, of: WINDOW })) : ""}</small>
        <b style={{ fontSize: 16 }}>{w("measured.notEnoughDataYet")}</b>
        <Squares m={m} />
        <Bar label={w("measured.fullDays")} have={m.fullDays} need={NEED_FULL} />
        <Bar label={fromStart ? w("measured.weighFrom", { day: SKIP_DAYS + 1 }) : w("measured.weighIns")} have={m.weighIns} need={NEED_WEIGH} />
        <small className="ft-text">{w("measured.fullDayIs")}{fromStart ? w("measured.firstDaysWater", { n: SKIP_DAYS }) : ""}</small>
        <small className="ft-strong">{m.readyOn ? w("measured.readyOn", { date: longDate(m.readyOn) }) : w("measured.itGoesOnWithThe")}</small>
      </section>
    );
  }
  const change = m.changeKg ?? 0, perDay = Math.round(Math.abs(change) * KCAL_PER_KG / WINDOW / 10) * 10;
  const gap = gapOf(m, formulaKcal);
  const weight = change === 0 ? w("measured.weightSame") : w(change < 0 ? "measured.weightDown" : "measured.weightUp", { kg: kgText(change) });
  return (
    <section className="card ft-card ft-burn">
      <small className="ft-caps">{coach ? w("measured.burnOf", { who: whose }) : w("measured.burnYour")} · {coach ? w("measured.last14Caps") : spanOf(m.from, m.to).toUpperCase()}</small>
      <div className="ft-big"><b>{n(m.kcal!)}</b><b>{w("measured.kcalADay")}</b></div>
      <small className="ft-text">{w("measured.between", { lo: n(m.lo!), hi: n(m.hi!) })}{formulaKcal ? ` ${w("measured.formulaSays", { kcal: n(formulaKcal) })}` : ""}</small>
      {!coach && <Scale lo={m.lo!} kcal={m.kcal!} hi={m.hi!} formula={formulaKcal} />}
      <div className="ft-row"><small>{coach ? w("measured.nameAte", { name: name! }) : w("measured.youAte")}</small><b>{w("measured.ateAvg", { ate: n(m.ate!), full: m.fullDays })}</b></div>
      <div className="ft-row"><small>{coach ? w("measured.theWeight") : w("measured.yourWeight")}</small><b>{w(coach ? "measured.weightCoach" : "measured.weightYou", { weight, n: m.weighIns })}</b></div>
      <div className="ft-row"><small>{coach ? w("measured.soTheBurn") : w("measured.soYouBurned")}</small><b>{change === 0 ? w(coach ? "measured.aboutSameCoach" : "measured.aboutSameYou") : w(coach ? (change < 0 ? "measured.burnMoreCoach" : "measured.burnLessCoach") : change < 0 ? "measured.burnMoreYou" : "measured.burnLessYou", { kg: kgText(change), perDay })}</b></div>
      {gap?.line && <small className="ft-gap">{w(gap.kcal > 0 ? "measured.gapMore" : "measured.gapLess", { kcal: n(Math.abs(gap.kcal)), pct: Math.abs(gap.pct) })} {gap.line}</small>}
      {coach ? <small className="ft-text">{w("measured.toUseIt", { name: name! })}</small> : (
        <>
          <div className="button-row" style={{ marginTop: 6 }}>{onUse && <button className="pill pill-small pill-primary" onClick={onUse}>{w("measured.useMyData")}</button>}<button className="link" aria-expanded={how} onClick={() => setHow((v) => !v)}>{how ? w("measured.closeHowItSCalculated") : w("measured.howItSCalculated")}</button></div>
          {how && (
            <div className="ft-how">
              <p><b>{w("measured.whatYouAte")}</b> {w("measured.theAverageOfYourFull")}</p>
              <p><b>{w("measured.whatYourWeightDid")}</b> {w("measured.lineHow", { day: SKIP_DAYS + 1 })}</p>
              <p><b>{w("measured.theBurn")}</b> {w("measured.whatYouAtePlusKcal")}</p>
              <p><b>{w("measured.theRange")}</b> {w("measured.rangeHow", { full: NEED_FULL, weighed: NEED_WEIGH })}</p>
            </div>
          )}
          <small className="ft-text">{inUse ? w("measured.inUseSince", { date: longDate(inUse.at.slice(0, 10)), kcal: n(inUse.kcal), span: spanOf(inUse.from, inUse.to) }) : w("measured.yourNumbersStayAsThey")}</small>
        </>
      )}
    </section>
  );
}
