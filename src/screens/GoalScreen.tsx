import { useState } from "react";
import { BANDS, saveGoal, goalsForBand } from "../goal";
import { density } from "../pilot";
import { pdText, pdVal, pdTag, pdRange } from "../ui";
import { Mark, APP_NAME } from "../components/Mark";
import { ACTIVITIES, calculate, canCalculate, macroSplit, suggestBand, MACRO_SOURCE, type Personal } from "../personal";
import type { AppApi } from "./api";
import { DayTargets } from "../components/DayTargets";

// The first screen after sign-in, and the Goal screen's heart: one place, three ways in, the calculated one first.
// 1. Work it out for me: body data here, consent first, the band underneath, four numbers as you type.
// 2. A rough goal: the band's middle, marked rough.
// 3. My own numbers: four fields, carbs filled as the remainder when left blank.
type Way = "calc" | "rough" | "own";
const num = (v: string) => (v.trim() === "" ? undefined : Number(v));

export function GoalScreen(p: AppApi & { onDone: () => void }) {
  const { state, setState, onDone, coach } = p;
  const consented = Boolean(p.safety.consentBodyAt);
  const [way, setWay] = useState<Way>("calc");
  const [d, setD] = useState<Personal>(p.personal);
  const [band, setBand] = useState<string>(suggestBand(p.personal, p.goal?.band).id);
  const [own, setOwn] = useState({ kcal: state.goals.calories ? String(state.goals.calories) : "", protein: state.goals.protein ? String(state.goals.protein) : "", fats: state.goals.fats ? String(state.goals.fats) : "", carbs: state.goals.carbs ? String(state.goals.carbs) : "" });
  const result = canCalculate(d) ? calculate(d, band, p.formula) : null;
  const ownKcal = Number(own.kcal) || null, ownProtein = Number(own.protein) || null;
  const ownFats = own.fats.trim() === "" ? (ownKcal && ownProtein ? macroSplit(ownKcal, ownProtein).fats : null) : Number(own.fats);
  const ownCarbs = own.carbs.trim() === "" ? (ownKcal && ownProtein && ownFats !== null ? macroSplit(ownKcal, ownProtein, ownFats).carbs : null) : Number(own.carbs);
  const ownPd = density(ownProtein, ownKcal);
  const by = coach ? "coach" : "you";
  const setPersonalNow = (next: Personal) => { setD(next); p.setPersonal(next); };

  const dayMode = p.personal.dayMode === "follow" ? "follow" : "same";
  const setDayMode = (m: "same" | "follow") => p.setPersonal({ ...p.personal, dayMode: m });
  const Days = ({ avg }: { avg: number | null }) => (
    <div className="days-choice">
      <span className="small">Your days</span>
      <div className="moments">
        <button className={`pill pill-small ${dayMode === "same" ? "pill-primary" : ""}`} onClick={() => setDayMode("same")}>Every day the same</button>
        <button className={`pill pill-small ${dayMode === "follow" ? "pill-primary" : ""}`} onClick={() => setDayMode("follow")}>Follow my day</button>
      </div>
      <small className="muted">{dayMode === "follow" ? "On Today you say what kind of day it is; calories and carbs move with it, protein and fat stay." : "One number for every day; over the week it evens out."}</small>
      {dayMode === "follow" && <DayTargets avgKcal={avg} personal={p.personal} setPersonal={p.setPersonal} />}
    </div>
  );
  const done = () => { p.notify("Your day is set. This is Today."); onDone(); };
  const Four = ({ kcal, protein, fats, carbs }: { kcal: number; protein: number; fats: number; carbs: number }) => (
    <div className="four" aria-label="Your day">
      <div><b>{pdVal(density(protein, kcal))}</b><small>{pdTag()}</small></div>
      <div><b>{kcal.toLocaleString("en")}</b><small>kcal</small></div>
      <div><b>{protein}</b><small>g protein</small></div>
      <div><b>{fats}</b><small>g fat</small></div>
      <div><b>{carbs}</b><small>g carbs</small></div>
    </div>
  );

  return (
    <div className="goal-screen">
      <div className="hero"><Mark size={56} color="var(--brand)" /><h2>{APP_NAME}</h2><p>Your day in four numbers. Every plate is measured against them.</p></div>
      <div className="ways three">
        <button className={`pill pill-small ${way === "calc" ? "pill-primary" : ""}`} onClick={() => setWay("calc")}>Work it out for me</button>
        {!canCalculate(d) && <button className={`pill pill-small ${way === "rough" ? "pill-primary" : ""}`} onClick={() => setWay("rough")}>A rough goal</button>}
        <button className={`pill pill-small ${way === "own" ? "pill-primary" : ""}`} onClick={() => setWay("own")}>My own numbers</button>
      </div>

      {way === "calc" && (
        <div className="calc-way">
          {!consented && (
            <section className="card consent" aria-label="Before your numbers">
              <b>Before your numbers</b>
              <p className="small">To work out your day, Mealan asks about your body: sex, birth year, height, weight, body fat if you know it. Kept only as those values and the numbers they give; on this phone and in your account in Frankfurt, EU; while the account exists; yours to export or delete. Nothing is stored until you agree. Under 16, a parent agrees. The full <a href="/privacy">privacy notice</a>.</p>
              <div className="button-row">
                <button className="pill pill-small pill-primary" onClick={() => p.declareSafety({ consentBodyAt: new Date().toISOString(), consentBy: "self" })}>I agree</button>
                <button className="pill pill-small" onClick={() => p.declareSafety({ consentBodyAt: new Date().toISOString(), consentBy: "parent" })}>A parent agrees for me</button>
              </div>
            </section>
          )}
          <section className={`card form ${consented ? "" : "shut"}`} aria-disabled={!consented}>
            <div className="field"><span>Sex</span>
              <div className="moments">
                {(["female", "male"] as const).map((s) => <button key={s} className={`pill pill-small ${d.sex === s ? "pill-primary" : ""}`} onClick={() => setPersonalNow({ ...d, sex: d.sex === s ? undefined : s })}>{s === "female" ? "Female" : "Male"}</button>)}
              </div>
            </div>
            <div className="field-row">
              <label className="field"><span>Birth year</span><input inputMode="numeric" value={d.birthYear ?? ""} placeholder="1985" onChange={(e) => setD({ ...d, birthYear: num(e.target.value) })} onBlur={() => p.setPersonal(d)} /></label>
              <label className="field"><span>Height, cm</span><input inputMode="numeric" value={d.heightCm ?? ""} placeholder="175" onChange={(e) => setD({ ...d, heightCm: num(e.target.value) })} onBlur={() => p.setPersonal(d)} /></label>
              <label className="field"><span>Weight, kg</span><input inputMode="decimal" value={d.weightKg ?? ""} placeholder="75" onChange={(e) => setD({ ...d, weightKg: num(e.target.value) })} onBlur={() => p.setPersonal(d)} /></label>
            </div>
            <div className="field"><span>Activity</span>
              <div className="activity-list">
                {ACTIVITIES.map((a) => (
                  <button key={a.id} className={`activity ${d.activity === a.id ? "on" : ""}`} onClick={() => setPersonalNow({ ...d, activity: d.activity === a.id ? undefined : a.id })}>
                    <b>{a.name}</b><small>{a.hint}</small>
                  </button>
                ))}
              </div>
            </div>
            <label className="field"><span>Body fat %, if you know it</span><input inputMode="decimal" value={d.bodyFatPct ?? ""} placeholder="from a scale or a scan" onChange={(e) => setD({ ...d, bodyFatPct: num(e.target.value) })} onBlur={() => p.setPersonal(d)} /></label>
          </section>
          <h3>What are you after?</h3>
          <div className="moments">
            {BANDS.map((b) => <button key={b.id} className={`pill pill-small ${band === b.id ? "pill-primary" : ""}`} onClick={() => setBand(b.id)}>{b.name}</button>)}
          </div>
          {result ? (
            <section className="card proposal">
              <Four kcal={result.kcal} protein={result.protein} fats={result.fats} carbs={result.carbs} />
              <p className="math">{result.math}</p>
              <small>{result.method}. {MACRO_SOURCE}</small>
              {result.note && <small>{result.note}</small>}
              <Days avg={result.kcal} />
              <button className="pill pill-primary pill-wide" onClick={() => { p.applyNumbers(band, result.kcal, result.protein, result.method); done(); }}>Set my day</button>
            </section>
          ) : (
            <p className="small muted">{consented ? "Sex, birth year, height, weight and activity, and the four numbers appear here." : "Agree above, then fill in your body data."}</p>
          )}
        </div>
      )}

      {way === "rough" && (
        <div className="bands">
          <p className="small muted">The middle of each range, the same for everyone, and it never follows your weight. Rough; work it out for exact, and it follows your profile from then on.</p>
          <Days avg={null} />
          {BANDS.map((b) => (
            <button key={b.id} className="band-card" onClick={() => {
              const g = goalsForBand(b);
              setState((s) => ({ ...s, goals: { ...s.goals, calories: g.calories, protein: g.protein, fats: g.fats, carbs: g.carbs } }));
              saveGoal({ band: b.id, setBy: by, setAt: new Date().toISOString(), source: "quick" });
              done();
            }}>
              <b>{b.name}</b><small>{b.who}</small>
              <em>{b.kcal[0].toLocaleString()} to {b.kcal[1].toLocaleString()} kcal · {b.protein[0]} to {b.protein[1]} g protein</em>
              <span>{pdRange(b.range)}</span>
            </button>
          ))}
        </div>
      )}

      {way === "own" && (
        <div className="own-goal">
          <p className="small muted">From a coach, a dietitian or your own plan. Leave fat or carbs blank and they fill in by rule.</p>
          <div className="field-row">
            <label className="field"><span>kcal a day</span><input inputMode="numeric" value={own.kcal} onChange={(e) => setOwn({ ...own, kcal: e.target.value })} placeholder="2200" /></label>
            <label className="field"><span>protein, g</span><input inputMode="numeric" value={own.protein} onChange={(e) => setOwn({ ...own, protein: e.target.value })} placeholder="140" /></label>
          </div>
          <div className="field-row">
            <label className="field"><span>fat, g</span><input inputMode="numeric" value={own.fats} onChange={(e) => setOwn({ ...own, fats: e.target.value })} placeholder={ownFats !== null ? String(ownFats) : "by rule"} /></label>
            <label className="field"><span>carbs, g</span><input inputMode="numeric" value={own.carbs} onChange={(e) => setOwn({ ...own, carbs: e.target.value })} placeholder={ownCarbs !== null ? String(ownCarbs) : "the rest"} /></label>
          </div>
          <p className="small">That is {pdText(ownPd)}{ownFats !== null && ownCarbs !== null ? `, ${ownFats} g fat and ${ownCarbs} g carbs` : ""}.</p>
          <Days avg={ownKcal} />
          <button className="pill pill-primary pill-wide" disabled={!ownPd} onClick={() => {
            setState((s) => ({ ...s, goals: { ...s.goals, calories: ownKcal, protein: ownProtein, fats: ownFats, carbs: ownCarbs } }));
            saveGoal({ setBy: by, setAt: new Date().toISOString(), source: "exact" });
            done();
          }}>Set my day</button>
        </div>
      )}
    </div>
  );
}
