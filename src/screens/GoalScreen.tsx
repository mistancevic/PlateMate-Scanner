import { underAge, ADULT_ONLY } from "../safety";
import { useState } from "react";
import { BANDS, saveGoal } from "../goal";
import { density } from "../pilot";
import { pdText, pdVal, pdTag } from "../ui";
import { Mark, APP_NAME } from "../components/Mark";
import { LIFE, DAY_TYPES, calculate, canCalculate, macroSplit, suggestBand, dayModeOf, ownDayNumbers, weekOf, lifeOf, type Personal, type DayType, type DayMode, type Week } from "../personal";
import { DayTable, FindingList } from "../components/DayTable";
import { analyse, isOpen as openAt, type Finding } from "../analysis";
import type { AppApi } from "./api";
import { ProteinCard } from "../components/ProteinCard";

// Your goal, as approved on 6 October 2026. Two ways in: Calculate for me, or My own numbers. Five goals. Life is set
// once; training is chosen per day. Every day the same, or each day its own, with the four days as one table.
// A way out: Not now on the first open, back to Me and Close from Me. Nothing is saved until Set my day.
type Way = "calc" | "own";
const num = (v: string) => (v.trim() === "" ? undefined : Number(v));

export function GoalScreen(p: AppApi & { onDone: () => void; onLater: () => void; fromMe?: boolean }) {
  const { state, setState, onDone, onLater, fromMe, coach } = p;
  const consented = Boolean(p.safety.consentBodyAt);
  const [way, setWay] = useState<Way>(p.goal?.source === "exact" || p.goal?.source === "coach" ? "own" : "calc");
  const [d, setD] = useState<Personal>(p.personal);
  const [editing, setEditing] = useState<boolean>(!canCalculate(p.personal));
  const [band, setBand] = useState<string>(suggestBand(p.personal, p.goal?.band).id);
  const [own, setOwn] = useState({ kcal: state.goals.calories ? String(state.goals.calories) : "", protein: state.goals.protein ? String(state.goals.protein) : "", fats: state.goals.fats ? String(state.goals.fats) : "", carbs: state.goals.carbs ? String(state.goals.carbs) : "" });
  const mode: DayMode = dayModeOf(d);
  // Release A: a birth year under 18 is not saved from the goal setup; the setup says why, and the person corrects it in place
  const under = underAge(d.birthYear);
  const save = (next: Personal) => p.setPersonal(underAge(next.birthYear) ? { ...next, birthYear: p.personal.birthYear } : next);
  const setPersonalNow = (next: Personal) => { setD(next); save(next); };
  const setMode = (m: DayMode) => setPersonalNow({ ...d, dayMode: m });
  const c = under ? null : calculate(d, band, p.formula);
  const by = coach ? "coach" : "you";
  const done = () => { p.notify("Your day is set. This is Today."); onDone(); };
  const goalNow = BANDS.find((b) => b.id === band)!;

  // own numbers, every day the same
  const ownKcal = Number(own.kcal) || null, ownProtein = Number(own.protein) || null;
  const ownFats = own.fats.trim() === "" ? (ownKcal && ownProtein ? macroSplit(ownKcal, ownProtein).fats : null) : Number(own.fats);
  const ownCarbs = own.carbs.trim() === "" ? (ownKcal && ownProtein && ownFats !== null ? macroSplit(ownKcal, ownProtein, ownFats).carbs : null) : Number(own.carbs);
  // own numbers, each day its own
  const o = ownDayNumbers(d, band, p.formula);
  const setOwnDay = (day: DayType, patch: { kcal?: number; protein?: number; fats?: number; carbs?: number }) => {
    const prev = d.ownDays?.[day] ?? {};
    const next = { ...prev, ...patch };
    (Object.keys(next) as (keyof typeof next)[]).forEach((k) => next[k] === undefined && delete next[k]);
    setPersonalNow({ ...d, ownDays: { ...(d.ownDays ?? {}), [day]: next } });
  };
  const emptyRows = Object.fromEntries(DAY_TYPES.map((x) => [x.id, { kcal: 0, protein: 0, fats: 0, carbs: 0, how: ["Type the calories for this day, or fill your profile to calculate it."], source: "average" as const }])) as Record<DayType, { kcal: number; protein: number; fats: number; carbs: number; how: string[]; source: "average" }>;
  const ownRows = o ? o.days : c ? Object.fromEntries(DAY_TYPES.map((x) => [x.id, { ...c.days[x.id], source: "calculated" as const }])) as Record<DayType, typeof c.days.passive & { source: "calculated" }> : emptyRows;
  const ownAvg = o ? o.avg : c ? { kcal: c.kcal, protein: c.protein } : { kcal: 0, protein: 0 };
  // Target analysis: against what this body burns at maintenance, when there is body data to tell
  const burn = !under && canCalculate(d) ? calculate(d, "maintain", p.formula)?.kcal ?? null : null;
  const sameRow = ownKcal && ownProtein ? { kcal: ownKcal, protein: ownProtein, fats: ownFats ?? 0, carbs: ownCarbs ?? 0, how: [] as string[] } : null;
  const analysisEach = o ? analyse({ days: o.days, avg: o.avg, bandId: band, personal: d, burn }) : null;
  const analysisSame = sameRow ? analyse({ days: Object.fromEntries(DAY_TYPES.map((x) => [x.id, sameRow])) as Record<DayType, typeof sameRow>, avg: sameRow, bandId: band, personal: d, burn }) : null;
  // a day finding means nothing when every day is the same: those read as the week's
  if (analysisSame) analysisSame.findings = analysisSame.findings.filter((f) => !f.id.startsWith("shape")).map((f) => ({ ...f, day: null }));
  const isOpen = (f: Finding) => openAt(f, d);
  const keep = (f: Finding) => setPersonalNow({ ...d, kept: { ...(d.kept ?? {}), [f.id]: { at: new Date().toISOString(), sig: f.sig } } });
  const saveLabel = (a: ReturnType<typeof analyse> | null) => { const n = a ? a.findings.filter(isOpen).length : 0; return n ? `Save, ${n} kept as ${n === 1 ? "it is" : "they are"}` : "Set my day"; };
  // on save: open findings count as kept on purpose; what is kept goes to the coach; nothing kept closes a request
  const settle = (a: ReturnType<typeof analyse> | null, summary: string) => {
    const now = new Date().toISOString();
    const kept = { ...(d.kept ?? {}) };
    (a?.findings ?? []).forEach((f) => { if (isOpen(f)) kept[f.id] = { at: now, sig: f.sig }; });
    setPersonalNow({ ...d, kept });
    const list = (a?.findings ?? []).map((f) => ({ id: f.id, title: f.title, body: f.body, source: f.source, day: f.day }));
    if (!coach) void p.sendReview(list, summary);
  };

  const Four = ({ kcal, protein, fats, carbs }: { kcal: number; protein: number; fats: number; carbs: number }) => (
    <div className="four" aria-label="Your day">
      <div><b>{pdVal(density(protein, kcal))}</b><small>{pdTag()}</small></div>
      <div><b>{kcal.toLocaleString("en")}</b><small>kcal</small></div>
      <div><b>{protein}</b><small>g protein</small></div>
      <div><b>{fats}</b><small>g fat</small></div>
      <div><b>{carbs}</b><small>g carbs</small></div>
    </div>
  );
  const Days = () => (
    <div className="days-choice">
      <b className="section-title">Your days</b>
      <div className="two-way">
        <button className={`choice ${mode === "same" ? "on" : ""}`} onClick={() => setMode("same")}>Every day the same</button>
        <button className={`choice ${mode === "each" ? "on" : ""}`} onClick={() => setMode("each")}>Each day its own</button>
      </div>
    </div>
  );
  const Steps = ({ week }: { week: Week }) => {
    const total = DAY_TYPES.reduce((a, x) => a + (week[x.id] || 0), 0);
    const set = (k: DayType, v: number) => setPersonalNow({ ...d, week: { ...week, [k]: Math.max(0, Math.min(7, v)) } });
    return (
      <div className="week-steps">
        {DAY_TYPES.map((x) => (
          <div className="week-step" key={x.id}>
            <span><b>{x.name}</b><small>{x.hint}</small></span>
            <span className="stepper"><button type="button" aria-label={`Fewer ${x.name}`} onClick={() => set(x.id, (week[x.id] || 0) - 1)}>−</button><b>{week[x.id] || 0}</b><button type="button" aria-label={`More ${x.name}`} disabled={total >= 7} onClick={() => set(x.id, (week[x.id] || 0) + 1)}>+</button></span>
          </div>
        ))}
        <small className={total === 7 ? "muted" : "notice"}>{total} of 7 days</small>
      </div>
    );
  };

  return (
    <div className="goal-screen">
      <div className="goal-top">
        {fromMe ? <button className="link" onClick={onLater}>← Me</button> : <span />}
        <button className="link" onClick={onLater}>{fromMe ? "Close" : "Not now"}</button>
      </div>
      <div className="hero"><Mark size={52} color="var(--brand)" /><h2>{APP_NAME}</h2><p>Your day in four numbers. Every plate is measured against them.</p></div>
      <div className="ways">
        <button className={`choice ${way === "calc" ? "on" : ""}`} onClick={() => setWay("calc")}>Calculate for me</button>
        <button className={`choice ${way === "own" ? "on" : ""}`} onClick={() => setWay("own")}>My own numbers</button>
      </div>

      {way === "calc" && (
        <div className="calc-way">
          {!consented && (
            <section className="card consent" aria-label="Before your numbers">
              <b>Before your numbers</b>
              <p className="small">To calculate your day, Mealan asks about your body: sex, birth year, height, weight, body fat if you know it. Kept only as those values and the numbers they give; on this phone and in your account in Frankfurt, EU; while the account exists; yours to export or delete. Nothing is stored until you agree. The full <a href="/privacy">privacy notice</a>.</p>
              <div className="button-row">
                <button className="pill pill-small pill-primary" onClick={() => p.declareSafety({ consentBodyAt: new Date().toISOString(), consentBy: "self" })}>I agree</button>
              </div>
            </section>
          )}
          {consented && !editing && canCalculate(d) ? (
            <section className="card you-card">
              <span><b>You</b><small>{[d.sex === "male" ? "Male" : d.sex === "female" ? "Female" : null, d.birthYear, d.heightCm ? `${d.heightCm} cm` : null, d.weightKg ? `${d.weightKg} kg` : null, LIFE.find((l) => l.id === lifeOf(d))!.name].filter(Boolean).join(" · ")}</small></span>
              <button className="link" onClick={() => setEditing(true)}>Edit</button>
            </section>
          ) : (
            <section className={`card form ${consented ? "" : "shut"}`} aria-disabled={!consented}>
              <div className="field"><span>Sex</span>
                <div className="moments">{(["female", "male"] as const).map((s) => <button key={s} className={`choice ${d.sex === s ? "on" : ""}`} onClick={() => setPersonalNow({ ...d, sex: d.sex === s ? undefined : s })}>{s === "female" ? "Female" : "Male"}</button>)}</div>
              </div>
              <div className="field-row">
                <label className="field"><span>Birth year</span><input inputMode="numeric" value={d.birthYear ?? ""} placeholder="1985" onChange={(e) => setD({ ...d, birthYear: num(e.target.value) })} onBlur={() => save(d)} /></label>
                <label className="field"><span>Height, cm</span><input inputMode="numeric" value={d.heightCm ?? ""} placeholder="175" onChange={(e) => setD({ ...d, heightCm: num(e.target.value) })} onBlur={() => save(d)} /></label>
                <label className="field"><span>Weight, kg</span><input inputMode="decimal" value={d.weightKg ?? ""} placeholder="75" onChange={(e) => setD({ ...d, weightKg: num(e.target.value) })} onBlur={() => save(d)} /></label>
              </div>
              {under && <p className="small adult-line" role="alert"><b>Chef Mealan is for adults.</b> {ADULT_ONLY} This birth year means you're under 18, so you can't use Chef Mealan yet. If you typed it wrong, correct it here.</p>}
              <div className="field"><span>Your life, without training</span>
                <div className="activity-list">{LIFE.map((l) => <button key={l.id} className={`activity ${lifeOf(d) === l.id ? "on" : ""}`} onClick={() => setPersonalNow({ ...d, life: l.id })}><b>{l.name}</b><small>{l.hint}</small></button>)}</div>
              </div>
              <div className="field"><span>Your training week</span><Steps week={weekOf(d)} /></div>
              <div className="field-row">
                <label className="field"><span>Easy session, min</span><input inputMode="numeric" value={d.easyMin ?? ""} placeholder="60" onChange={(e) => setD({ ...d, easyMin: num(e.target.value) })} onBlur={() => save(d)} /></label>
                <label className="field"><span>Hard session, min</span><input inputMode="numeric" value={d.hardMin ?? ""} placeholder="75" onChange={(e) => setD({ ...d, hardMin: num(e.target.value) })} onBlur={() => save(d)} /></label>
              </div>
              <label className="field"><span>Body fat %, if you know it</span><input inputMode="decimal" value={d.bodyFatPct ?? ""} placeholder="from a scale or a scan" onChange={(e) => setD({ ...d, bodyFatPct: num(e.target.value) })} onBlur={() => save(d)} /></label>
              {canCalculate(d) && <button className="pill pill-small" onClick={() => { save(d); setEditing(false); }}>Done</button>}
            </section>
          )}
          <b className="section-title">What are you after?</b>
          <p className="small muted">Each goal says what happens to your weight, how much you eat, and what you need to do. You can change it at any time.</p>
          <div className="goal-cards">{BANDS.map((b) => (
            <button key={b.id} type="button" className={`goal-pick ${band === b.id ? "on" : ""}`} aria-pressed={band === b.id} onClick={() => setBand(b.id)}>
              <span className="goal-pick-head"><b>{b.name}</b>{b.popular && <small>Most people pick this</small>}</span>
              <ul>{b.points.map((x) => <li key={x}>{x}</li>)}</ul>
            </button>
          ))}</div>
          {c && <ProteinCard c={c} />}
          {c ? (
            <>
              <Days />
              {mode === "same" ? (
                <section className="card proposal"><Four kcal={c.kcal} protein={c.protein} fats={c.fats} carbs={c.carbs} /><p className="math">{c.math}</p><small>{c.method}.</small></section>
              ) : (
                <DayTable rows={c.days} avg={{ kcal: c.kcal, protein: c.protein }} week={c.week} weekdays={c.weekdays} />
              )}
              {c.note && <small className="notice">{c.note}</small>}
              <button className="pill pill-primary pill-wide" onClick={() => { p.applyNumbers(band, c.kcal, c.protein, c.method, c.fats, c.carbs); done(); }}>Set my day</button>
            </>
          ) : (
            <p className="small muted">{consented ? "Sex, birth year, height and weight, and your numbers appear here." : "Agree above, then fill in your body data."}</p>
          )}
        </div>
      )}

      {way === "own" && (
        <div className="own-goal">
          <p className="small muted">From a coach, a dietitian or your own plan. Pick how the numbers come:</p>
          <Days />
          {mode === "same" ? (
            <>
              <div className="field-row">
                <label className="field"><span>kcal a day</span><input id="own-kcal" inputMode="numeric" value={own.kcal} onChange={(e) => setOwn({ ...own, kcal: e.target.value })} placeholder="2200" /></label>
                <label className="field"><span>protein, g</span><input id="own-protein" inputMode="numeric" value={own.protein} onChange={(e) => setOwn({ ...own, protein: e.target.value })} placeholder="140" /></label>
              </div>
              <div className="field-row">
                <label className="field"><span>fat, g</span><input id="own-fats" inputMode="numeric" value={own.fats} onChange={(e) => setOwn({ ...own, fats: e.target.value })} placeholder={ownFats !== null ? String(ownFats) : "fills in"} /></label>
                <label className="field"><span>carbs, g</span><input id="own-carbs" inputMode="numeric" value={own.carbs} onChange={(e) => setOwn({ ...own, carbs: e.target.value })} placeholder={ownCarbs !== null ? String(ownCarbs) : "the rest"} /></label>
              </div>
              <p className="small">One number for every day. That is {pdText(density(ownProtein, ownKcal))}{ownFats !== null && ownCarbs !== null ? `, ${ownFats} g fat and ${ownCarbs} g carbs` : ""}.</p>
              {analysisSame && <FindingList analysis={analysisSame} open={isOpen} keep={keep} />}
              <button className="pill pill-primary pill-wide" disabled={!density(ownProtein, ownKcal)} onClick={() => {
                setState((s) => ({ ...s, goals: { ...s.goals, calories: ownKcal, protein: ownProtein, fats: ownFats, carbs: ownCarbs } }));
                saveGoal({ band, setBy: by, setAt: new Date().toISOString(), source: "exact" });
                settle(analysisSame, `${goalNow.name} · every day the same · ${ownKcal?.toLocaleString("en")} kcal`);
                done();
              }}>{saveLabel(analysisSame)}</button>
              {p.profile.coachId && !coach && <p className="small muted">Anything kept on purpose goes to {p.coachLabel} to approve.</p>}
            </>
          ) : (
            <>
              <DayTable rows={ownRows} avg={ownAvg} week={weekOf(d)} own={d.ownDays ?? {}} setOwn={setOwnDay} analysis={analysisEach ?? undefined} open={isOpen} keep={keep} />
              <p className="small muted">Type any of the four. A blank one fills in and says so. Protein and carbs count 4 kcal a gram, fat 9. Chef Mealan checks a day when you leave its fields.</p>
              <button className="pill pill-primary pill-wide" disabled={!o} onClick={() => {
                const a = o!.avg;
                setState((s) => ({ ...s, goals: { ...s.goals, calories: a.kcal, protein: a.protein, fats: a.fats, carbs: a.carbs } }));
                saveGoal({ band, setBy: by, setAt: new Date().toISOString(), source: "exact" });
                settle(analysisEach, `${goalNow.name} · each day its own · week average ${a.kcal.toLocaleString("en")} kcal`);
                done();
              }}>{saveLabel(analysisEach)}</button>
              {p.profile.coachId && !coach && <p className="small muted">Anything kept on purpose goes to {p.coachLabel} to approve.</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
