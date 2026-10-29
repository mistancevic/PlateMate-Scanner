import { CarbsFatStep } from "../components/CarbsFatStep";
import { KitchensAndTools } from "./MenuScreen";
import { REGIONS } from "../moments";
import { SafetyQuestion } from "../components/SafetyQuestion";
import { doorAnswered } from "../safety";
import { underAge, ADULT_ONLY } from "../safety";
import { WeightField, HeightField } from "../components/UnitFields";
import { units, hText, wText, wIn } from "../units";
import { useState } from "react";
import { BANDS, PACES, TRAINING_AGES, isBuild, paceForAge, bandOf, goalLabel } from "../goal";
import { density } from "../pilot";
import { pdText, pdVal, pdTag } from "../ui";
import { Mark, APP_NAME, CHEF_NAME } from "../components/Mark";
import { FormulaCard, fixedOf } from "../components/FormulaCard";
import { LIFE, DAY_TYPES, STEPS, calculate, canCalculate, macroSplit, suggestBand, dayModeOf, ownDayNumbers, weekOf, workOf, withWork, planOf, lifestyleOf, type Personal, type DayType, type DayMode, type Formula } from "../personal";
import { workHoursOf, whenAtWork, WORK_WHEN } from "../slots";
import { INTENSITIES, LENGTHS, lengthOf, planFromCounts, weekdaysOf, usualFrom, WEEKDAY_CHOICES, ymd, withDay, lengthName, isTraining, WEEKDAYS, WEEKDAY_NAMES, WHENS, type Intensity, type Plan } from "../plan";
import { DayTable, FindingList } from "../components/DayTable";
import { analyse, isOpen as openAt, type Finding } from "../analysis";
import type { AppApi } from "./api";
import { ProteinCard } from "../components/ProteinCard";
import { Zones } from "../components/Zones";

// Your goal, as approved on 6 October 2026. Two ways in: Calculate for me, or My own numbers. Five goals. Life is set
// once; training is chosen per day. Every day the same, or each day its own, with the four days as one table.
// A way out: Not now on the first open, back to Me and Close from Me.
// 0.2.5+r20 (canvas board FX, G1a and G1b, Milan 14 October 2026): a calculator. 1 You (body data, saved at once: they are
// facts), 2 the formula, 3 the goal, 4 the days; the formula and the goal stay a draft until Apply from a date.
type Way = "calc" | "own";
const num = (v: string) => (v.trim() === "" ? undefined : Number(v));

// what Calculate for me still needs, in plain words
const missingOf = (d: Personal): string[] => [!d.birthYear && "your birth year", !d.heightCm && "your height", !d.weightKg && "your weight"].filter(Boolean) as string[];
export function GoalScreen(p: AppApi & { onDone: () => void; onLater: () => void; fromMe?: boolean }) {
  const { state, setState, onDone, onLater, fromMe, coach } = p;
  const consented = Boolean(p.safety.consentBodyAt);
  const [way, setWay] = useState<Way>(p.goal?.source === "exact" || p.goal?.source === "coach" ? "own" : "calc");
  const [d, setD] = useState<Personal>(p.personal);
  const [editing, setEditing] = useState<boolean>(!canCalculate(p.personal));
  // DT139 (0.2.124, board Stories95; Anna's DT118; Milan 28 October 17:05 Go): on the first setup no goal is picked for you; the
  // numbers and Apply appear once you pick. My own numbers and the analysis still read a goal: the one you had, else Maintain
  const [picked, setBand] = useState<string>(p.goal?.band ? suggestBand(p.personal, p.goal.band).id : "");
  const band = picked || suggestBand(p.personal, undefined).id;
  const [askDoor, setAskDoor] = useState(() => !doorAnswered(p.safety));
  // DT142 (0.2.127, board Stories98; Anna's DT123; Milan 28 October 20:46 Go): the first setup (no goal yet) ends on one more
  // step after Apply: where you live and shop (home, its starter foods), the kitchens you cook and what you cook with
  const [firstRun] = useState(() => !p.goal);
  const [shopStep, setShopStep] = useState(false);
  const [howOpen, setHowOpen] = useState(p.goalFocus === "formula" || Boolean(p.calcFormula));
  // the sections are numbered as they show: 1. You only once you agreed
  const nYou = 1, nGoal = consented ? 2 : 1;
  const [own, setOwn] = useState({ kcal: state.goals.calories ? String(state.goals.calories) : "", protein: state.goals.protein ? String(state.goals.protein) : "", fats: state.goals.fats ? String(state.goals.fats) : "", carbs: state.goals.carbs ? String(state.goals.carbs) : "" });
  const mode: DayMode = dayModeOf(d);
  // Release A: a birth year under 18 is not saved from the goal setup; the setup says why, and the person corrects it in place
  const under = underAge(d.birthYear);
  const save = (next: Personal) => p.setPersonal(underAge(next.birthYear) ? { ...next, birthYear: p.personal.birthYear } : next);
  const setPersonalNow = (next: Personal) => { setD(next); save(next); };
  const setMode = (m: DayMode) => setPersonalNow({ ...d, dayMode: m });
  // the formula picked here is part of the draft (board FX, G1a)
  const [formula, setFormula] = useState<Formula | "auto">(p.calcFormula && (p.calcFormula !== "data" || fixedOf(p.measured)) ? p.calcFormula : p.personal.formula ?? "auto");
  // From your data (0.2.7, board FT, FT5): the measured burn of today, or the one already in use, fixed with Apply from
  const dataFixed = formula === "data" ? (p.personal.formula === "data" && p.personal.measuredUse && !p.calcFormula ? p.personal.measuredUse : fixedOf(p.measured) ?? p.personal.measuredUse ?? null) : null;
  const dF: Personal = (() => { const { formula: _, measuredUse: _m, ...r } = d; void _; void _m; return formula === "auto" ? r : formula === "data" ? (dataFixed ? { ...r, formula, measuredUse: dataFixed } : r) : { ...r, formula }; })();
  const c = under || !picked ? null : calculate(dF, band, p.formula);
  // FT5: with From your data, how far the week moves from the formula's
  const dataNote = (() => {
    if (!c || formula !== "data" || !dataFixed) return undefined;
    const { formula: _f, measuredUse: _m, ...r } = d; void _f; void _m;
    const base = calculate(r, band, null); if (!base) return undefined;
    const k = c.kcal - base.kcal;
    return k === 0 ? "From your data: the same as with the formula." : `From your data: ${Math.abs(k).toLocaleString("en")} kcal ${k < 0 ? "less" : "more"} than with the formula.`;
  })();
  const by = coach ? "coach" : "you";
  const done = () => { p.notify("Your day is set. This is Today."); onDone(); };
  const goalNow = bandOf(band)!;

  // own numbers, every day the same
  const ownKcal = Number(own.kcal) || null, ownProtein = Number(own.protein) || null;
  const ownFats = own.fats.trim() === "" ? (ownKcal && ownProtein ? macroSplit(ownKcal, ownProtein).fats : null) : Number(own.fats);
  const ownCarbs = own.carbs.trim() === "" ? (ownKcal && ownProtein && ownFats !== null ? macroSplit(ownKcal, ownProtein, ownFats).carbs : null) : Number(own.carbs);
  // own numbers, each day its own
  const o = ownDayNumbers(dF, band, p.formula);
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
  const burn = !under && canCalculate(d) ? calculate(dF, "maintain", p.formula)?.kcal ?? null : null;
  const sameRow = ownKcal && ownProtein ? { kcal: ownKcal, protein: ownProtein, fats: ownFats ?? 0, carbs: ownCarbs ?? 0, how: [] as string[] } : null;
  const analysisEach = o ? analyse({ days: o.days, avg: o.avg, bandId: band, personal: d, burn }) : null;
  const analysisSame = sameRow ? analyse({ days: Object.fromEntries(DAY_TYPES.map((x) => [x.id, sameRow])) as Record<DayType, typeof sameRow>, avg: sameRow, bandId: band, personal: d, burn }) : null;
  // a day finding means nothing when every day is the same: those read as the week's
  if (analysisSame) analysisSame.findings = analysisSame.findings.filter((f) => !f.id.startsWith("shape")).map((f) => ({ ...f, day: null }));
  const isOpen = (f: Finding) => openAt(f, d);
  const keep = (f: Finding) => setPersonalNow({ ...d, kept: { ...(d.kept ?? {}), [f.id]: { at: new Date().toISOString(), sig: f.sig } } });
  // Apply from (board FX, G1b): today, tomorrow, next Monday or a date picked; never a past date
  const todayKey = ymd(new Date());
  const dayFrom = (n: number) => { const x = new Date(); x.setDate(x.getDate() + n); return ymd(x); };
  const tomorrow = dayFrom(1);
  const nextMonday = (() => { const n = (8 - new Date().getDay()) % 7 || 7; const k = dayFrom(n); return k === tomorrow ? dayFrom(n + 7) : k; })();
  const [from, setFrom] = useState(todayKey);
  const [picking, setPicking] = useState(false);
  const longDay = (k: string) => new Date(`${k}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }).replace(",", "");
  const fromName = from === todayKey ? "today" : from === tomorrow ? "tomorrow" : longDay(from);
  const saveLabel = (a: ReturnType<typeof analyse> | null) => { const n = a ? a.findings.filter(isOpen).length : 0; return `Apply from ${fromName}${n ? `, ${n} kept as ${n === 1 ? "it is" : "they are"}` : ""}`; };
  const ApplyFrom = () => (
    <div className="apply-from" role="group" aria-label="Apply from">
      <small className="setting-name">Apply from</small>
      <div className="chip-row">
        {[[todayKey, "Today"], [tomorrow, "Tomorrow"], [nextMonday, longDay(nextMonday)]].map(([k, l]) => <button type="button" key={k} className={`choice ${from === k && !picking ? "on" : ""}`} aria-pressed={from === k && !picking} onClick={() => { setPicking(false); setFrom(k); }}>{l}</button>)}
        <button type="button" className={`choice ${picking ? "on" : ""}`} aria-pressed={picking} onClick={() => setPicking(true)}>Pick a date</button>
      </div>
      {picking && <input type="date" aria-label="Start date" min={tomorrow} value={from > todayKey ? from : ""} onChange={(e) => e.target.value && e.target.value > todayKey && setFrom(e.target.value)} />}
      <small className="setting-hint">Days before then keep the goal they had.</small>
    </div>
  );
  // the one way a goal is saved: now, or waiting for its date on Me, Goal
  const apply = (x: { source: "profile" | "exact"; kcal: number; protein: number; fats: number; carbs: number; method?: string }) => {
    p.applyGoal({ band, setBy: by, formula: formula === "auto" ? null : formula, ...(formula === "data" ? { measured: dataFixed } : {}), ...x }, from);
    // DT142 (0.2.127): the first setup goes on to 4. Where you shop and cook
    if (firstRun) { setShopStep(true); window.scrollTo(0, 0); return; }
    finish();
  };
  const finish = () => { if (from <= todayKey) done(); else { p.notify(`${goalLabel(band)} starts on ${longDay(from)}.`); onLater(); } };
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
  const Days = ({ title = "Your days" }: { title?: string }) => (
    <div className="days-choice">
      <b className="section-title">{title}</b>
      <div className="two-way">
        <button className={`choice ${mode === "same" ? "on" : ""}`} onClick={() => setMode("same")}>Every day the same</button>
        <button className={`choice ${mode === "each" ? "on" : ""}`} onClick={() => setMode("each")}>Each day its own</button>
      </div>
    </div>
  );
  // Calculate for me, as approved on 7 October 2026 (canvas board T1): your everyday first, then your training.
  // The training days are the Training week's: a + or − here changes the plan itself, so the two never disagree.
  const planNow: Plan = planOf(d) ?? planFromCounts({ passive: 7, active: 0, easy: 0, hard: 0 });
  const setPlan = (plan: Plan) => { setPersonalNow({ ...d, plan }); p.setUsual(usualFrom(lifestyleOf(d), plan)); };
  // DT140 (0.2.125, board Stories96 version 2; Anna's DT117; Milan 28 October 17:43 Go): the week is the source. Tap a day, say
  // how hard, how long and when; nothing is guessed and the count follows from the days. The same week as Me, Training week
  // DT147 (0.2.128, board Stories99 version 2; Coach Milan 28 October 22:39): a day stays open until it is tapped again;
  // opening another day closes nothing. A new training day is suggested outside the work hours; every part stays open.
  const [openDays, setOpenDays] = useState<number[]>([]);
  const toggleDay = (i: number) => setOpenDays((o) => (o.includes(i) ? o.filter((x) => x !== i) : [...o, i]));
  const wh = workHoursOf(lifestyleOf(d));
  const [zonesOpen, setZonesOpen] = useState(false);
  const whenName = (w?: string) => (WHENS.find((x) => x.id === w)?.name ?? "").toLowerCase();
  const TrainWeek = () => {
    const n = planNow.filter(isTraining).length, names = planNow.map((x, i) => (isTraining(x) ? WEEKDAYS[i] : null)).filter(Boolean) as string[];
    return (
      <div className="train-week week-setup">
        <small className="muted">Tap the days you train. Each one says how hard, how long and when.</small>
        {planNow.map((x, i) => {
          const on = isTraining(x), lvl = (x.intensity ?? "easy") as Intensity;
          return (
            <div key={i} className={`wk-day ${on ? "on" : ""}`}>
              <button type="button" className="wk-head" aria-expanded={openDays.includes(i)} aria-label={`${WEEKDAY_NAMES[i]}: ${on ? `${INTENSITIES.find((y) => y.id === lvl)!.name}, ${lengthName(x.minutes)}, ${whenName(x.when)}` : "no training"}`} onClick={() => toggleDay(i)}>
                <b>{WEEKDAYS[i]}</b><span>{on ? `${INTENSITIES.find((y) => y.id === lvl)!.name} · ${lengthName(x.minutes)} · ${whenName(x.when)}` : "No training"}</span>
              </button>
              {openDays.includes(i) && (
                <div className="wk-edit">
                  <small className="setting-name">How hard</small>
                  <div className="chip-row" role="group" aria-label={`${WEEKDAY_NAMES[i]}, how hard`}>
                    <button type="button" className={`choice ${!on ? "on" : ""}`} aria-pressed={!on} onClick={() => setPlan(withDay(planNow, i, { level: null }))}>No training</button>
                    {INTENSITIES.map((y) => <button type="button" key={y.id} className={`choice ${on && lvl === y.id ? "on" : ""}`} aria-pressed={on && lvl === y.id} onClick={() => setPlan(withDay(planNow, i, { level: y.id }, wh))}>{y.name}</button>)}
                  </div>
                  {on && <>
                    <small className="setting-name">How long</small>
                    <div className="chip-row" role="group" aria-label={`${WEEKDAY_NAMES[i]}, how long`}>{LENGTHS.map((r) => { const sel = lengthOf(x.minutes ?? 60).id === r.id; return <button type="button" key={r.id} className={`choice ${sel ? "on" : ""}`} aria-pressed={sel} onClick={() => setPlan(withDay(planNow, i, { level: lvl, minutes: r.mid }))}>{r.name.replace("–", " to ")}</button>; })}</div>
                    <small className="setting-name">When</small>
                    <div className="chip-row" role="group" aria-label={`${WEEKDAY_NAMES[i]}, when`}>{WHENS.filter((w) => ["morning", "day", "evening"].includes(w.id)).map((w) => <button type="button" key={w.id} className={`choice ${x.when === w.id ? "on" : ""}`} aria-pressed={x.when === w.id} onClick={() => setPlan(withDay(planNow, i, { level: lvl, when: w.id }))}>{w.name}{whenAtWork(w.id, wh) && <small className="at-work"> · in work hours</small>}</button>)}</div>
                    {wh && <small className="setting-hint">{WORK_WHEN(wh)}</small>}
                  </>}
                </div>
              )}
            </div>
          );
        })}
        <div className="train-tally"><b>{n} training {n === 1 ? "day" : "days"}</b><small>{names.length ? `${names.join(", ")} · ` : ""}{7 - n} without</small></div>
        <button type="button" className="link" aria-expanded={zonesOpen} onClick={() => setZonesOpen(!zonesOpen)}>What light, moderate and hard mean ›</button>
        {zonesOpen && INTENSITIES.map((y) => <div key={y.id} className="train-name"><b>{y.name}</b><Zones level={y.id} walkNote={y.id === "easy"} /></div>)}
      </div>
    );
  };
  const wk = weekdaysOf(lifestyleOf(d));

  if (shopStep) {
    const home = REGIONS.find((r) => r.id === p.region);
    const homeN = p.state.foods.filter(p.inPlace).length;
    return (
      <div className="goal-screen shop-step">
        <p className="label calc-step">{nGoal + 3}. Where you shop and cook</p>
        <p className="small muted">Home brings its starter foods. The kitchens and what you cook with tell {CHEF_NAME} what to suggest. You can change all of it in Me later.</p>
        <section className="card place-pick">
          <b>Where do you live and shop?</b>
          <div className="moments" role="group" aria-label="Where do you live and shop?">
            {REGIONS.map((r) => <button type="button" key={r.id} className={`choice ${p.region === r.id ? "on" : ""}`} aria-pressed={p.region === r.id} onClick={() => p.makeHome(r.id)}>{r.name}</button>)}
          </div>
          {home && <div className="starter-line"><b>{homeN} foods for {home.name.replace(/, elsewhere$/, "")}</b><small>With its starter foods, ready to search. <button type="button" className="link" onClick={() => { finish(); p.setTab("foods"); }}>See them in Foods ›</button></small></div>}
        </section>
        <KitchensAndTools {...p} />
        <button type="button" className="pill pill-primary pill-wide shop-done" disabled={!p.region} onClick={finish}>{p.region ? "Done: to Today" : "Pick home first"}</button>
      </div>
    );
  }
  return (
    <div className="goal-screen">
      <div className="goal-top">
        {fromMe ? <button className="link" onClick={onLater}>← Me</button> : <span />}
        <button className="link" onClick={onLater}>{fromMe ? "Close" : "Not now"}</button>
      </div>
      <div className="hero"><Mark size={52} color="var(--brand)" /><h2>{APP_NAME}</h2><p>Your day in five numbers. Every plate is measured against them.</p></div>
      <div className="ways">
        <button className={`choice ${way === "calc" ? "on" : ""}`} onClick={() => setWay("calc")}>Calculate for me</button>
        <button className={`choice ${way === "own" ? "on" : ""}`} onClick={() => setWay("own")}>My own numbers</button>
      </div>

      {way === "calc" && (
        <div className="calc-way">
          {!consented && (
            <section className="card consent" aria-label="Before your numbers">
              <b>Before your numbers</b>
              <p className="small">To calculate your day, Chef Mealan asks a few things about your body: female or male, your birth year, height, weight, and your body fat if you know it. Later, also the weigh-ins you add. Chef Mealan keeps only these and the numbers they give, on this phone and in your account, for as long as you have the account. You can export or delete them any time. Nothing is kept until you agree. More in the <a href="/privacy">privacy notice</a>.</p>
              <div className="button-row">
                <button className="pill pill-small pill-primary" onClick={() => p.declareSafety({ consentBodyAt: new Date().toISOString(), consentBy: "self" })}>I agree</button>
              </div>
            </section>
          )}
          {/* DT141 (0.2.126, board Stories97; Anna's DT119; Milan 28 October 18:33 Go): right after I agree, the safety question;
              the step ends on Next: 1. You, and the rest of setup follows */}
          {consented && askDoor && <SafetyQuestion p={p} doneLabel={`Next: ${nYou}. You`} onDone={() => { setAskDoor(false); window.setTimeout(() => document.querySelector(".calc-step")?.scrollIntoView({ block: "start" }), 50); }} />}
          {!(consented && askDoor) && <>
          {consented && <p className="label calc-step">{nYou}. You</p>}
          {consented && !editing && canCalculate(d) ? (
            <section className="card you-card">
              <span><b>You</b><small>{[d.sex === "male" ? "Male" : d.sex === "female" ? "Female" : null, d.birthYear, d.heightCm ? hText(d.heightCm) : null, d.weightKg ? wText(d.weightKg, Number.isInteger(wIn(d.weightKg)) ? 0 : 1) : null, LIFE.find((l) => l.id === workOf(d))!.name, STEPS.find((x) => x.id === d.steps)?.name.concat(" steps")].filter(Boolean).join(" · ")}<br />Body fat: {d.bodyFatPct ? `${d.bodyFatPct} %` : "not given"}</small></span>
              <button className="link" onClick={() => setEditing(true)}>Edit</button>
            </section>
          ) : (
            <section className={`card form ${consented ? "" : "shut"}`} aria-disabled={!consented}>
              <div className="field"><span>Your body</span>
                <div className="moments">{(["female", "male"] as const).map((s) => <button key={s} className={`choice ${d.sex === s ? "on" : ""}`} onClick={() => setPersonalNow({ ...d, sex: d.sex === s ? undefined : s })}>{s === "female" ? "Female" : "Male"}</button>)}</div>
              </div>
              <div className="field-row">
                <label className="field"><span>Birth year</span><input inputMode="numeric" value={d.birthYear ?? ""} placeholder="enter year" onChange={(e) => setD({ ...d, birthYear: num(e.target.value) })} onBlur={() => save(d)} /></label>
                <HeightField cm={d.heightCm} unit={units().height} onCm={(v) => setD({ ...d, heightCm: v })} onDone={() => save(d)} />
                <WeightField kg={d.weightKg} unit={units().weight} onKg={(v) => setD({ ...d, weightKg: v })} onDone={() => save(d)} />
              </div>
              {under && <p className="small adult-line" role="alert"><b>Chef Mealan is for adults.</b> {ADULT_ONLY} This birth year means you're under 18, so you can't use Chef Mealan yet. If you typed it wrong, correct it here.</p>}
              <div className="calc-part"><b>Lifestyle</b><small>Every day, with or without training.</small></div>
              {wk === "work" || wk === "both" ? (
                <div className="field"><span>Your work</span>
                  <div className="activity-list">{LIFE.map((l) => <button key={l.id} className={`activity ${workOf(d) === l.id ? "on" : ""}`} onClick={() => setPersonalNow(withWork(d, l.id))}><b>{l.name}</b><small>{l.hint}</small></button>)}</div>
                </div>
              ) : (
                <p className="small muted">Your weekdays: {WEEKDAY_CHOICES.find((x) => x.id === wk)!.name}, counted as mostly sitting. You can change it in Lifestyle.</p>
              )}
              <div className="field"><span>Steps on a usual day</span>
                <div className="chip-row" role="group" aria-label="Steps on a usual day">{STEPS.map((x) => <button type="button" key={x.id} className={`choice ${d.steps === x.id ? "on" : ""}`} aria-pressed={d.steps === x.id} onClick={() => setPersonalNow({ ...d, steps: d.steps === x.id ? undefined : x.id })}>{x.name}</button>)}</div>
                <small className="muted">All your walking goes here: to work, shopping, the dog, a walk in the park. Your phone or watch counts them.</small>
              </div>
              <div className="calc-part"><b>Your training</b><small>Your week: only the days you train.</small></div>
              <TrainWeek />
              <label className="field"><span>Body fat %, if you know it</span><input inputMode="decimal" value={d.bodyFatPct ?? ""} placeholder="from a scale or a scan" onChange={(e) => setD({ ...d, bodyFatPct: num(e.target.value) })} onBlur={() => save(d)} /></label>
              {canCalculate(d) && <button className="pill pill-small" onClick={() => { save(d); setEditing(false); }}>Done</button>}
            </section>
          )}
          {consented && canCalculate(d) && !under && (
            <>
              {/* DT139: the formula is automatic; its names and the choice sit behind one line */}
              <button type="button" className="link how-calc" aria-expanded={howOpen} onClick={() => setHowOpen(!howOpen)}>How we calculate ›</button>
              {!howOpen && <small className="muted how-calc-line">{formula === "auto" ? "Automatic, from your body and your week." : "Your pick, behind this line."}</small>}
              {howOpen && <FormulaCard personal={formula === "data" && dataFixed ? { ...d, measuredUse: dataFixed } : d} pinned={p.formula ?? null} coachLabel={p.coachLabel} value={formula} onPick={setFormula} measured={p.measured} />}
            </>
          )}
          <b className="section-title">{nGoal}. What are you after?</b>
          <p className="small muted">Each goal says what happens to your weight, how much you eat, and what you need to do. You can change it at any time.</p>
          <div className="goal-cards">{BANDS.map((b) => {
            // Build muscle has a pace (canvas board K1): Steady or Faster, started by how long the person has trained
            const on = picked === b.id || (b.id === "gain" && isBuild(picked));
            const pick = () => setBand(b.id !== "gain" ? b.id : isBuild(picked) ? picked : PACES.find((x) => x.id === (d.trainingAge ? paceForAge(d.trainingAge) : "steady"))!.band);
            return (
              <div key={b.id} className={`goal-pick-wrap ${on ? "on" : ""}`}>
                <button type="button" className={`goal-pick ${on ? "on" : ""}`} aria-pressed={on} onClick={pick}>
                  <span className="goal-pick-head"><b>{b.name}</b>{b.popular && <small>Most people pick this</small>}</span>
                  <ul>{b.points.map((x) => <li key={x}>{x}</li>)}</ul>
                </button>
                {on && b.id === "gain" && (
                  <div className="pace">
                    <small className="setting-name">Your pace</small>
                    <div className="activity-list" role="group" aria-label="Your pace">
                      {PACES.map((x) => <button type="button" key={x.id} className={`activity ${band === x.band ? "on" : ""}`} aria-pressed={band === x.band} onClick={() => setBand(x.band)}><b>{x.name}</b><small>{x.hint}</small></button>)}
                    </div>
                    <small className="setting-name">How long have you trained regularly?</small>
                    <div className="chip-row" role="group" aria-label="How long have you trained regularly?">
                      {TRAINING_AGES.map((x) => <button type="button" key={x.id} className={`choice ${d.trainingAge === x.id ? "on" : ""}`} aria-pressed={d.trainingAge === x.id} onClick={() => { setPersonalNow({ ...d, trainingAge: x.id }); setBand(PACES.find((q) => q.id === paceForAge(x.id))!.band); }}>{x.name}</button>)}
                    </div>
                    <small className="setting-hint">Sets the starting pace: the longer you've trained, the slower muscle comes. You can pick either pace.</small>
                  </div>
                )}
              </div>
            );
          })}</div>
          {c && <ProteinCard c={c} />}
          {/* DT161 (0.3.3, board Stories113): how the person likes the rest split between carbs and fat */}
          {c && <CarbsFatStep c={c} d={d} band={band} n={nGoal + 1} set={(cf) => setPersonalNow({ ...d, carbsFat: cf })} />}
          {c ? (
            <>
              <Days title={`${nGoal + 2}. Your days`} />
              {mode === "same" ? (
                <section className="card proposal"><Four kcal={c.kcal} protein={c.protein} fats={c.fats} carbs={c.carbs} /><p className="math">{c.math}</p><small>{c.method}.</small></section>
              ) : (
                <DayTable rows={c.days} avg={{ kcal: c.kcal, protein: c.protein }} week={c.week} weekdays={c.weekdays} note={dataNote} />
              )}
              <small className="pd-said">PD: grams of protein per 100 kcal, the number that tells a food from a marketing claim.</small>
              {c.note && <small className="notice">{c.note}</small>}
              <ApplyFrom />
              <button className="pill pill-primary pill-wide" onClick={() => apply({ source: "profile", kcal: c.kcal, protein: c.protein, fats: c.fats, carbs: c.carbs, method: c.method })}>{saveLabel(null)}</button>
              {!p.profile.coachId && !coach && <small className="muted coach-later">A coach can adjust these numbers later.</small>}
            </>
          ) : (
            // 0.2.119 (Tester 2, Milan 28 October 14:59): no Apply and no word why read as a dead end; say what is missing
            <p className="small goal-missing" role="status">{consented && canCalculate(d) && !under && !picked ? "Pick what you are after, and your numbers appear." : !consented ? "To calculate your numbers, tap I agree above, then fill in your body." : under ? "Chef Mealan is for adults: check the birth year above." : `To calculate your numbers, fill in ${missingOf(d).join(", ")} above. Or use My own numbers.`}</p>
          )}
          </>}
        </div>
      )}

      {way === "own" && (
        <div className="own-goal">
          <p className="small muted">From a coach, a dietitian or your own plan. Pick how the numbers come:</p>
          <Days />
          {mode === "same" ? (
            <>
              <div className="field-row">
                <label className="field"><span>kcal a day</span><input id="own-kcal" inputMode="numeric" value={own.kcal} onChange={(e) => setOwn({ ...own, kcal: e.target.value })} placeholder="enter kcal" /></label>
                <label className="field"><span>protein, g</span><input id="own-protein" inputMode="numeric" value={own.protein} onChange={(e) => setOwn({ ...own, protein: e.target.value })} placeholder="enter protein" /></label>
              </div>
              <div className="field-row">
                <label className="field"><span>fat, g</span><input id="own-fats" inputMode="numeric" value={own.fats} onChange={(e) => setOwn({ ...own, fats: e.target.value })} placeholder={ownFats !== null ? `fills in: ${ownFats}` : "fills in"} /></label>
                <label className="field"><span>carbs, g</span><input id="own-carbs" inputMode="numeric" value={own.carbs} onChange={(e) => setOwn({ ...own, carbs: e.target.value })} placeholder={ownCarbs !== null ? `the rest: ${ownCarbs}` : "the rest"} /></label>
              </div>
              <p className="small">One number for every day. That is {pdText(density(ownProtein, ownKcal))}{ownFats !== null && ownCarbs !== null ? `, ${ownFats} g fat and ${ownCarbs} g carbs` : ""}.</p>
              {analysisSame && <FindingList analysis={analysisSame} open={isOpen} keep={keep} />}
              <ApplyFrom />
              <button className="pill pill-primary pill-wide" disabled={!density(ownProtein, ownKcal)} onClick={() => {
                settle(analysisSame, `${goalNow.name} · every day the same · ${ownKcal?.toLocaleString("en")} kcal`);
                apply({ source: "exact", kcal: ownKcal!, protein: ownProtein!, fats: ownFats ?? 0, carbs: ownCarbs ?? 0 });
              }}>{saveLabel(analysisSame)}</button>
              {!density(ownProtein, ownKcal) && <p className="small goal-missing" role="status">Type kcal and protein above to apply.</p>}
              {p.profile.coachId && !coach && <p className="small muted">Anything kept on purpose goes to {p.coachLabel} to approve.</p>}
            </>
          ) : (
            <>
              <DayTable rows={ownRows} avg={ownAvg} week={weekOf(d)} own={d.ownDays ?? {}} setOwn={setOwnDay} analysis={analysisEach ?? undefined} open={isOpen} keep={keep} />
              <p className="small muted">Type any of the four. A blank one fills in and says so. Protein and carbs count 4 kcal a gram, fat 9. Chef Mealan checks a day when you leave its fields.</p>
              <ApplyFrom />
              <button className="pill pill-primary pill-wide" disabled={!o && !c} onClick={() => {
                // 0.2.119 (Tester 2): the table showed numbers and Apply stayed grey until a day was typed. Nothing typed: the
                // calculated rows are applied as your own, so what you saw is what you get
                if (!o && c) {
                  const ownDays = Object.fromEntries(DAY_TYPES.map((x) => [x.id, { kcal: c.days[x.id].kcal, protein: c.days[x.id].protein, fats: c.days[x.id].fats, carbs: c.days[x.id].carbs }])) as Personal["ownDays"];
                  setPersonalNow({ ...d, ownDays });
                  apply({ source: "exact", kcal: c.kcal, protein: c.protein, fats: c.fats, carbs: c.carbs });
                  return;
                }
                const a = o!.avg;
                settle(analysisEach, `${goalNow.name} · each day its own · week average ${a.kcal.toLocaleString("en")} kcal`);
                apply({ source: "exact", kcal: a.kcal, protein: a.protein, fats: a.fats, carbs: a.carbs });
              }}>{saveLabel(analysisEach)}</button>
              {!o && !c && <p className="small goal-missing" role="status">Type the kcal for at least one day to apply. Or fill in your body under Calculate for me, and the days fill in.</p>}
              {p.profile.coachId && !coach && <p className="small muted">Anything kept on purpose goes to {p.coachLabel} to approve.</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
