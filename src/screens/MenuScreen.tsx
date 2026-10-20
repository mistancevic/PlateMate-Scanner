import { useState, useEffect, type ReactNode } from "react";
import { FlaskConical, ChevronRight, BookOpen, ChevronLeft, Download, Upload, SlidersHorizontal, RotateCcw, Target, User, CalendarDays, ShoppingBasket, Users, KeyRound, LifeBuoy, Info, Calculator, Coffee } from "lucide-react";
import { fmt, fixed, pdText, pdVal, pdTag, pdRange } from "../ui";
import { APP_NAME, COACH_NAME } from "../components/Mark";
import { exportLog, clearLog, readLog, log } from "../log";
import { BANDS, bandOf, goalLabel, SOURCE_LABEL, type GoalEntry } from "../goal";
import { sheetOf, guideOf } from "../goalGuide";
import { GoalSheet, GoalGuide } from "../components/GoalSheet";
import { WeightTrend } from "../components/Weight";
import { weighInsOff, withoutWeighIn } from "../weight";
import { ConfirmButton } from "../components/Confirm";
import { WeightField, HeightField } from "../components/UnitFields";
import { cleanUnits, asF, ftIn, kgToLb, wText, wIn, type Units } from "../units";
import { RHYTHMS, REGIONS } from "../moments";
import { LIFE, DAY_TYPES, calculate, canCalculate, suggestBand, formulaFor, dayModeOf, ownDayNumbers, weekOf, lifeOf, workOf, withWork, planOf, lifestyleOf, ageOf, isMinor, dayFor, KITCHENS, EQUIPMENT, equipmentOf, type Personal, type DayType } from "../personal";
import { CHEF_NAME } from "../components/Mark";
import { KITCHEN, tasteOf, another, anotherLeft, undo, type Taste } from "../kitchens";
import { slotsOf } from "../slots";
import { WEEKDAYS, WEEKDAY_NAMES, HOURS, SLOTS, MOVES, WHERE, DIETS, ALCOHOL, ALCOHOL_AGE, LOAD_NAME, planFromCounts, countsOf, loadOf, planShort, planLine, LOAD_DAY, isoWeek, datesOfWeek, WHERE_KID, SCHOOL_HOURS, COMMUTES, PE_WEEK, weekdayIndex, usualFrom, HOURS_SHOWN, STUDY_HOURS, WEEKDAY_CHOICES, weekdaysOf, dayKindOf, workHintOf, type Plan, type PlanDay, type Lifestyle } from "../plan";
import { DayEditor } from "../components/DayEditor";
import { ProteinCard } from "../components/ProteinCard";
import { DayTable } from "../components/DayTable";
import { periodsOf, periodLine } from "../goalHistory";
import { DAY_NAMES } from "../coachNotes";
import { FORMULA_NAME } from "../components/FormulaCard";
import { BurnCard } from "../components/Measured";
import { analyse, isOpen as openAt } from "../analysis";
import type { AppApi, MenuSection } from "./api";
import { openLine } from "../openStats";
import { SITUATIONS, SITUATION_FOR, EU_ALLERGENS, FIXED, type SituationId } from "../safety";
import { EvalsScreen } from "./EvalsScreen";
import { MetricsScreen } from "./MetricsScreen";
import { CostsScreen } from "./CostsScreen";
import { LineChart, Receipt } from "lucide-react";
import { dayLog } from "../today";
import { aggregate, uid } from "../pilot";
import { MeScreen } from "./MeScreen";

// the sections that belong to the person: they live under Me, and back from them goes to Me
const ME_SECTIONS: MenuSection[] = ["profile", "goal", "life", "week", "shop", "coach", "account"];
const ITEMS: { id: MenuSection; name: string; icon: ReactNode }[] = [
  { id: "profile", name: "Profile", icon: <User size={20} /> },
  { id: "goal", name: "Goal", icon: <Target size={20} /> },
  { id: "life", name: "Lifestyle", icon: <Coffee size={20} /> },
  { id: "week", name: "Training week", icon: <CalendarDays size={20} /> },
  { id: "shop", name: "Where I shop and cook", icon: <ShoppingBasket size={20} /> },
  { id: "coach", name: "Coach", icon: <Users size={20} /> },
  { id: "account", name: "Account", icon: <KeyRound size={20} /> },
  { id: "support", name: "Support", icon: <LifeBuoy size={20} /> },
  { id: "about", name: "About", icon: <Info size={20} /> },
  { id: "evals", name: "Evals", icon: <FlaskConical size={20} /> },
  { id: "metrics", name: "Metrics", icon: <LineChart size={20} /> },
  { id: "costs", name: "Running costs", icon: <Receipt size={20} /> },
];
// Metrics in the menu only for the account the server names (0.2.5+r17, board M, M1); kept so the row shows at once
const OWNER = "chefmealan-metrics-owner";
// (a component of its own: the menu list itself keeps no hooks)
function MetricsRow({ open }: { open: () => void }) {
  const owner = useMetricsOwner(true);
  return owner ? <button className="menu-row" onClick={open}><span className="menu-icon"><LineChart size={20} /></span><b>Metrics</b><ChevronRight size={18} /></button> : null;
}
// Running costs, next to Metrics, for the same account only (0.2.7+r1, board M, M6b)
function CostsRow({ open }: { open: () => void }) {
  const owner = useMetricsOwner(true);
  return owner ? <button className="menu-row" onClick={open}><span className="menu-icon"><Receipt size={20} /></span><b>Running costs</b><ChevronRight size={18} /></button> : null;
}
export function useMetricsOwner(on: boolean) {
  const [owner, setOwner] = useState(() => { try { return localStorage.getItem(OWNER) === "1"; } catch { return false; } });
  useEffect(() => {
    if (!on) return;
    fetch("/api/metrics/access").then((r) => (r.ok ? r.json() : { owner: false })).then((d) => { setOwner(Boolean(d.owner)); try { localStorage.setItem(OWNER, d.owner ? "1" : "0"); } catch { /* shows next time */ } }).catch(() => {});
  }, [on]);
  return owner;
}

export function MenuScreen(p: AppApi & { section: MenuSection; setSection: (s: MenuSection, up?: boolean) => void; close: () => void; from: MenuSection | null; under?: MenuSection | null }) {
  const { section, setSection, close } = p;
  // the back link goes to the page walked before this one; a page opened straight goes to its parent (M6)
  const from = (p.under ?? p.from) as MenuSection | null;
  if (section === "list")
    return (
      <>
        <div className="menu-head"><h2>Menu</h2><button className="link" onClick={close}>Close</button></div>
        <div className="menu-list">
          <button className="menu-row" onClick={() => setSection("me")}><span className="menu-icon"><User size={20} /></span><b>Me</b><ChevronRight size={18} /></button>
          {/* Foods lives here from 0.2.0 (X0): the library, reached day to day from the Plate's search and Quick picks */}
          <button className="menu-row" onClick={() => p.setTab("foods")}><span className="menu-icon"><BookOpen size={20} /></span><b>Foods</b><ChevronRight size={18} /></button>
          {[{ id: "support" as MenuSection, name: "Support", icon: <LifeBuoy size={20} /> }, ...(p.profile.role === "coach" || !p.cloudEnabled ? [{ id: "evals" as MenuSection, name: "Evals", icon: <FlaskConical size={20} /> }] : [])].map((it) => (
            <button key={it.id} className="menu-row" onClick={() => setSection(it.id)}>
              <span className="menu-icon">{it.icon}</span><b>{it.name}</b><ChevronRight size={18} />
            </button>
          ))}
          <MetricsRow open={() => setSection("metrics")} />
          <CostsRow open={() => setSection("costs")} />
          {/* About at the bottom of the list (Milan, 16 October 2026, 18:43) */}
          <button className="menu-row" onClick={() => setSection("about")}><span className="menu-icon"><Info size={20} /></span><b>About</b><ChevronRight size={18} /></button>
        </div>
        <p className="small"><a href="/about">Who's behind it</a> · <a href="/impressum">Impressum</a> · <a href="/privacy">Privacy notice</a> · <a href="/disclaimer">Disclaimer</a></p>
        {p.user && <div className="button-row" style={{ marginTop: 12 }}><button className="pill pill-small" onClick={p.signOut}>Sign out</button></div>}
      </>
    );
  const title = ITEMS.find((i) => i.id === section)?.name ?? "";
  // a section opens at its top, whatever the scroll of the one before
  useEffect(() => { try { window.scrollTo({ top: 0 }); document.querySelector("main")?.scrollTo?.({ top: 0 }); } catch {} }, [section]);
  return (
    <>
      <div className="menu-head"><button className="link" onClick={() => ((from as string) === "me" || ME_SECTIONS.includes(section) && !from ? setSection("me", true) : setSection(from ?? "list", true))}><ChevronLeft size={16} /> {(from as string) === "me" ? "Me" : from ? (ITEMS.find((i) => i.id === from)?.name ?? "Menu") : ME_SECTIONS.includes(section) ? "Me" : "Menu"}</button><button className="link" onClick={close}>Close</button></div>
      <h2 className="menu-title">{section === "me" ? "Me" : title}</h2>
      {section === "me" && <MeScreen {...p} />}
      {section === "profile" && <ProfilePanel {...p} />}
      {section === "goal" && <GoalPanel {...p} />}
      {section === "life" && <LifestylePanel {...p} />}
      {section === "week" && <PlanPanel {...p} />}
      {section === "shop" && <ShopPanel {...p} />}
      {section === "coach" && <CoachPanel {...p} />}
      {section === "account" && <AccountPanel {...p} />}
      {section === "support" && <SupportPanel {...p} />}
      {section === "about" && <AboutPanel />}
      {section === "evals" && <EvalsScreen {...p} />}
      {section === "metrics" && <MetricsScreen />}
      {section === "costs" && <CostsScreen />}
    </>
  );
}

function ProfilePanel(p: AppApi) {
  const [name, setName] = useState(p.clientName);
  const [d, setD] = useState<Personal>(p.personal);
  const num = (v: string) => (v.trim() === "" ? undefined : Number(v.replace(",", ".")) || undefined);
  const dirty = name.trim() !== p.clientName || JSON.stringify(d) !== JSON.stringify(p.personal);
  const consented = Boolean(p.safety.consentBodyAt);
  // the door: situations Chef Mealan steps back from, and what to keep off every suggestion
  const [sits, setSits] = useState<SituationId[]>(p.safety.situations);
  const [none, setNone] = useState<boolean>(Boolean(p.safety.none));
  const keys = new Set(EU_ALLERGENS.map((a) => a.key));
  const [chips, setChips] = useState<string[]>(p.safety.allergies.filter((a) => keys.has(a)));
  const [freeText, setFreeText] = useState(p.safety.allergies.filter((a) => !keys.has(a)).join(", "));
  const joined = (c: string[], t: string) => [...c, ...t.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean)].join(", ");
  const allergyText = joined(chips, freeText);
  const chipOn = (k: string) => chips.includes(k);
  // a tick is the answer: it saves the moment it is made, no Save button to find below the fold
  const commit = (nextSits: SituationId[], nextNone: boolean, text: string) => {
    const allergies = text.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
    const withAllergies = allergies.length && !nextSits.includes("allergies") ? [...nextSits, "allergies" as SituationId] : nextSits;
    const isNone = nextNone && withAllergies.length === 0;
    const answered = isNone || withAllergies.length > 0;
    setSits(withAllergies); setNone(isNone);
    if (!answered) { p.declareSafety({ situations: [], allergies: [], none: false, declaredAt: undefined }, false); return; }
    p.declareSafety({ situations: withAllergies, allergies, none: isNone, declaredAt: new Date().toISOString() }, true);
    p.notify(isNone ? "Noted: none applies. Chef Mealan cooks." : "Noted. Chef Mealan keeps to it.");
  };
  const tick = (id: SituationId, on: boolean) => { if (id === "allergies" && !on) { setChips([]); setFreeText(""); } commit(on ? [...sits, id] : sits.filter((y) => y !== id), on ? false : none, id === "allergies" && !on ? "" : allergyText); };
  const tickNone = (on: boolean) => { if (on) { setChips([]); setFreeText(""); } commit(on ? [] : sits, on, on ? "" : allergyText); };
  const toggleChip = (k: string, on: boolean) => { const next = on ? [...chips, k] : chips.filter((x) => x !== k); setChips(next); commit(sits.includes("allergies") ? sits : [...sits, "allergies"], false, joined(next, freeText)); };
  const answered = none || sits.length > 0;
  return (
    <>
      <p className="small">All of this is optional. It's used only to calculate your numbers, and kept on this phone and in your account, nowhere else.</p>
      {consented && (
        <p className="small consent-line">You agreed to the body data on {fmtDay(p.safety.consentBodyAt!)}. It is in your export, and goes with everything else when you delete the account.</p>
      )}
      {!consented && (
        <section className="card consent" aria-label="Before your numbers">
          <b>Before your numbers</b>
          <p className="small">To calculate your day, Chef Mealan asks a few things about your body: female or male, your birth year, height, weight, and your body fat if you know it. Later, also the weigh-ins you add. Here is what happens with them.</p>
          <ul className="small">
            <li><b>Kept:</b> only those values, and the numbers they give.</li>
            <li><b>Where:</b> on this phone and in your account. Nowhere else: never sold, and never shared beyond your coach.</li>
            <li><b>How long:</b> while the account exists.</li>
            <li><b>Yours:</b> export it or delete it, with everything else, from Menu, Account.</li>
          </ul>
          <p className="small">Nothing about your body is stored until you agree. The full <a href="/privacy">privacy notice</a>.</p>
          <div className="button-row">
            <button className="pill pill-small pill-primary" onClick={() => p.declareSafety({ consentBodyAt: new Date().toISOString(), consentBy: "self" })}>I agree</button>
          </div>
        </section>
      )}
      <section className={`card form ${consented ? "" : "shut"}`} aria-disabled={!consented}>
        <label className="field"><span>Name</span><input value={name} placeholder="Your name" onChange={(e) => setName(e.target.value)} /></label>
        <div className="field"><span>Your body</span>
          <div className="moments">
            {(["female", "male"] as const).map((s) => <button key={s} className={`choice ${d.sex === s ? "on" : ""}`} onClick={() => setD({ ...d, sex: d.sex === s ? undefined : s })}>{s === "female" ? "Female" : "Male"}</button>)}
          </div>
        </div>
        <div className="field-row">
          <label className="field"><span>Birth year</span><input inputMode="numeric" value={d.birthYear ?? ""} placeholder="1985" onChange={(e) => setD({ ...d, birthYear: num(e.target.value) })} /></label>
          <HeightField cm={d.heightCm} unit={cleanUnits(d.units).height} onCm={(v) => setD((x) => ({ ...x, heightCm: v }))} />
          <WeightField kg={d.weightKg} unit={cleanUnits(d.units).weight} onKg={(v) => setD((x) => ({ ...x, weightKg: v }))} />
        </div>
        <label className="field"><span>Body fat %, if you know it</span><input inputMode="decimal" value={d.bodyFatPct ?? ""} placeholder="from a scale or a scan" onChange={(e) => setD({ ...d, bodyFatPct: num(e.target.value) })} /></label>
        <div className="field"><span>Your work</span>
          <div className="activity-list">
            {LIFE.map((l) => (
              <button key={l.id} className={`activity ${workOf(d) === l.id ? "on" : ""}`} onClick={() => setD(withWork(d, l.id))}>
                <b>{l.name}</b><small>{l.hint}</small>
              </button>
            ))}
          </div>
          <small className="muted">Your training goes in the Training week.</small>
        </div>
        {/* Units (0.2.18, canvas board UN, UN1 and UN2): shown in these, kept in kg, cm and °C */}
        {(() => {
          const u = cleanUnits(d.units), set = (k: keyof Units, v: string) => setD((x) => ({ ...x, units: { ...cleanUnits(x.units), [k]: v } }));
          const chip = (k: keyof Units, v: string, label: string) => <button type="button" key={v} className={`choice ${u[k] === v ? "on" : ""}`} aria-pressed={u[k] === v} onClick={() => set(k, v)}>{label}</button>;
          const h = d.heightCm ? ftIn(d.heightCm) : null;
          return (
            <div className="field units-box" role="group" aria-label="Units"><span>Units</span>
              <b>Temperature</b>
              <div className="moments">{chip("temp", "c", "°C")}{chip("temp", "f", "°F")}</div>
              <small className="muted">{u.temp === "c" ? `Oven heat in the steps: 175 °C. A recipe in °F is converted for you: 350 °F is ${175} °C.` : `Oven heat in the steps: ${asF(175)} °F. A recipe in °C is converted for you.`}</small>
              <b>Body weight</b>
              <div className="moments">{chip("weight", "kg", "kg")}{chip("weight", "lb", "lb")}</div>
              <small className="muted">{u.weight === "kg" ? "Weigh-ins, your goal and the trend." : d.weightKg ? `${Math.round(d.weightKg * 10) / 10} kg is ${(Math.round(kgToLb(d.weightKg) * 10) / 10).toFixed(1)} lb, on weigh-ins and your goal.` : "Weigh-ins, your goal and the trend, in lb."}</small>
              <b>Height</b>
              <div className="moments">{chip("height", "cm", "cm")}{chip("height", "ftin", "ft and in")}</div>
              {u.height === "ftin" && h && <small className="muted">{Math.round(d.heightCm!)} cm is {h.ft} ft {h.inch} in.</small>}
              <small className="muted">Food amounts stay in grams: labels and the numbers per 100 g are in grams. Energy stays in kcal.</small>
            </div>
          );
        })()}
        {/* M3 (0.2.5+r4, Milan's layout, 11 October 2026): each chip with its definition beside it, then the day in both forms */}
        <div className="field pd-unit"><span>Show protein density as</span>
          <div className="pd-unit-row"><button type="button" className={`choice ${(d.pdUnit ?? "pd") === "pd" ? "on" : ""}`} aria-pressed={(d.pdUnit ?? "pd") === "pd"} onClick={() => setD({ ...d, pdUnit: "pd" })}>PD</button><span>g protein per 100 kcal</span></div>
          <div className="pd-unit-row"><button type="button" className={`choice ${d.pdUnit === "pct" ? "on" : ""}`} aria-pressed={d.pdUnit === "pct"} onClick={() => setD({ ...d, pdUnit: "pct" })}>%</button><span>% of calories from protein</span></div>
          {(() => {
            const kcal = p.todayMacros?.kcal ?? p.state.goals.calories, pro = p.todayMacros?.protein ?? p.state.goals.protein;
            if (!kcal || !pro) return <small className="pd-unit-day">For example: 5 g of protein in 100 kcal is PD 5, or 20 % (20 of 100 kcal).</small>;
            const pd = (100 * pro) / kcal;
            return <small className="pd-unit-day">Your day: {Math.round(pro)} g of protein in {Math.round(kcal).toLocaleString("en")} kcal. That is PD {pd.toFixed(1)}, or {Math.round(pd * 4)} % ({Math.round(pro * 4).toLocaleString("en")} of {Math.round(kcal).toLocaleString("en")} kcal).</small>;
          })()}
        </div>
        <button className="pill pill-primary pill-wide" disabled={!dirty || !consented} onClick={() => { p.setClientName(name.trim()); p.setPersonal(d); if (d.pdUnit !== p.personal.pdUnit) log("pd_unit", { unit: d.pdUnit ?? "pd" }); p.notify("Profile saved."); }}>Save</button>
      </section>
      <section className="card form door" aria-label="Is any of this true for you">
        <b>Is any of this true for you?</b>
        <p className="small">Chef Mealan is an AI chef. It reads labels and suggests plates, and it can be wrong: check a number against the pack, and check anything about your health with a professional. If one of these is true for you, Chef Mealan steps back from that topic, tells you who to talk to, and still helps with the plate. Your coach sees that you ticked one and when, never what you wrote.</p>
        {SITUATIONS.filter((x) => SITUATION_FOR[x.id] === "all" || d.sex !== "male").map((x) => (
          <div key={x.id}>
            <label className="check">
              <input type="checkbox" checked={sits.includes(x.id)} onChange={(e) => tick(x.id, e.target.checked)} />
              <span><b>{x.label}</b>{x.detail ? <small> {x.detail}</small> : null}</span>
            </label>
            {x.id === "allergies" && sits.includes("allergies") && (
              <div className="allergy-pick">
                <small className="muted">The fourteen every pack in the EU declares. Tap what applies.</small>
                <div className="chips">
                  {EU_ALLERGENS.map((a) => { const on = chipOn(a.key); return <button key={a.key} className={`choice ${on ? "on" : ""}`} onClick={() => toggleChip(a.key, !on)}>{a.label}</button>; })}
                </div>
                <label className="field"><span>Anything else</span><input value={freeText} placeholder="e.g. kiwi, histamine" onChange={(e) => setFreeText(e.target.value)} onBlur={() => commit(sits, none, joined(chips, freeText))} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} /></label>
                <small className="muted">Nothing containing these is ever suggested. Chef Mealan checks the name and the label lines of every food.</small>
              </div>
            )}
          </div>
        ))}
        <label className="check none">
          <input type="checkbox" checked={none} onChange={(e) => tickNone(e.target.checked)} />
          <span><b>None of these applies to me</b><small> If you leave it open, Chef Mealan doesn't take it as a no. It asks again once a year.</small></span>
        </label>
        <p className={`small ${answered ? "muted" : "notice"}`}>{answered ? `Answered${p.safety.declaredAt ? " on " + fmtDay(p.safety.declaredAt) : ""}. Each tick is saved straight away, and you can change it any time.` : "Tick one, or none. A tick saves by itself."}</p>
        {p.safety.situations.length > 0 && (
          <div className="fixed-lines">
            {p.safety.situations.map((id) => <p className="small" key={id}><b>{SITUATIONS.find((x) => x.id === id)?.label}:</b> {FIXED[id]}</p>)}
          </div>
        )}
        {!p.ai.on && <p className="small notice">{p.ai.why}</p>}
        {(p.safety.declarations?.length ?? 0) > 0 && (
          <div className="door-log">
            <small className="muted">What you declared, and when it changed</small>
            {[...(p.safety.declarations ?? [])].reverse().map((dcl, i) => (
              <p className="small" key={dcl.at}>
                <b>{fmtDay(dcl.at)}{i === 0 ? ", current" : ""}:</b> {dcl.situations.length ? dcl.situations.map((id) => SITUATIONS.find((x) => x.id === id)?.label ?? id).join("; ") : dcl.none ? "none applies" : "nothing ticked"}{dcl.allergies.length ? `. Avoids: ${dcl.allergies.join(", ")}` : ""}
              </p>
            ))}
          </div>
        )}
      </section>
      <div className="menu-list" style={{ marginTop: 12 }}>
        <button className="menu-row" onClick={() => { if (dirty) { p.setClientName(name.trim()); p.setPersonal(d); p.notify("Profile saved."); } p.openMenu("goal", "profile"); }}>
          <span className="menu-icon"><Calculator size={20} /></span>
          <span className="menu-row-text"><b>{dirty ? "Save and go to Goal" : "Goal"}</b><small>{canCalculate(d) ? "Calculate your daily numbers from this profile" : "Your goal and daily numbers"}</small></span>
          <ChevronRight size={18} />
        </button>
      </div>
    </>
  );
}

const fmtDay = (iso: string) => new Date(iso).toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" });
function NextLink({ p, to, from, text, hint }: { p: AppApi; to: MenuSection; from: MenuSection; text: string; hint: string }) {
  return (
    <div className="menu-list" style={{ marginTop: 12 }}>
      <button className="menu-row" onClick={() => p.openMenu(to, from)}>
        <span className="menu-icon">{ITEMS.find((i) => i.id === to)?.icon}</span>
        <span className="menu-row-text"><b>Next: {text}</b><small>{hint}</small></span>
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
function GoalPanel(p: AppApi) {
  const { state, goal, openGoal, resetGoal } = p;
  const band = goal?.band ? bandOf(goal.band) : null;
  const setBy = goal?.setBy === "coach" ? `Coach ${(goal.coachName || p.profile.coachName || COACH_NAME).split(" ")[0]}` : "you";
  const mode = dayModeOf(p.personal);
  const ownWay = goal?.source === "exact" || goal?.source === "coach";
  const c = calculate(p.personal, band?.id ?? "maintain", p.formula);
  const o = ownWay ? ownDayNumbers(p.personal, band?.id ?? "maintain", p.formula) : null;
  // the goal sheet (canvas board K2): what you and your coach agree on
  const approved = p.review?.status === "approved" ? { approvedBy: p.review.by || p.coachLabel, approvedAt: p.review.at } : {};
  const sheet = sheetOf(goal, { weightKg: p.personal.weightKg, trainingAge: p.personal.trainingAge, coachLabel: p.coachLabel, ...approved });
  const [about, setAbout] = useState(false);
  return (
    <>
      <section className="plan goal-head">
        <div className="plan-top"><small className="eyebrow-line">Your goal</small><span className="goal-src">{ownWay ? (goal?.setBy === "coach" ? `set by ${setBy}` : "your own numbers") : "calculated for you"}</span></div>
        <b className="goal-name">{band ? goalLabel(band.id) : "Not set yet"}</b>
        {band && <span className="goal-who">{band.who}</span>}
        {p.review && p.review.status !== "closed" && ownWay && (
          <span className={`review-state ${p.review.status}`}>
            {p.review.status === "waiting" ? `Waiting for ${p.coachLabel}: ${p.review.kept?.length ?? 0} kept on purpose` : p.review.status === "approved" ? `Approved by ${p.review.by || p.coachLabel}, ${new Date(p.review.at).toLocaleDateString("en", { day: "numeric", month: "long" })}` : `${p.review.by || p.coachLabel} asks you to change ${p.review.kept?.length === 1 ? "one number" : "your numbers"}`}
          </span>
        )}
        {mode === "same" || (!c && !o) ? (
          <>
            <div className="plan-row">
              <div><b>{pdVal(p.dayPd)}</b><small>{pdTag()} target</small></div>
              <div><b>{fmt(state.goals.calories, 0)}</b><small>kcal a day</small></div>
              <div><b>{fmt(state.goals.protein, 0)}</b><small>g protein</small></div>
            </div>
            {state.goals.fats != null && state.goals.carbs != null && <p className="macro-line">{fmt(state.goals.fats, 0)} g fat · {fmt(state.goals.carbs, 0)} g carbs · every day the same</p>}
          </>
        ) : null}
      </section>
      {p.personal.nextGoal && (() => {
        // a goal applied from a later date waits here (canvas board FX, G2)
        const ng = p.personal.nextGoal, day = new Date(`${ng.from}T12:00:00`);
        return (
          <section className="card next-goal" aria-label="Next goal">
            <small className="next-goal-when">NEXT, FROM {day.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }).toUpperCase().replace(",", "")}</small>
            <b>{goalLabel(ng.band)}</b>
            <small>{ng.setBy === "coach" ? `Set by ${p.coachLabel}. ` : ""}{ng.kcal.toLocaleString("en")} kcal and {ng.protein} g protein a day on average. Plan already uses it from {day.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}.</small>
            {/* a goal from the coach (canvas board CW, CW9): Reply instead of Change the date and Cancel */}
            {ng.setBy === "coach"
              ? <div className="button-row"><button className="pill pill-small" onClick={() => { const r = window.prompt(`Reply to ${p.coachLabel}`); if (r && r.trim()) { p.replyToCoach(r.trim()); p.notify(`Sent to ${p.coachLabel}.`); } }}>Reply to {p.coachLabel}</button></div>
              : <div className="button-row"><button className="pill pill-small" onClick={openGoal}>Change the date</button><button className="link link-danger" onClick={() => { p.cancelNextGoal(); p.notify("The next goal is cancelled."); }}>Cancel</button></div>}
          </section>
        );
      })()}
      {sheet && <GoalSheet sheet={sheet} />}
      {band && p.safety.consentBodyAt && !weighInsOff(p.safety) && (
        <WeightTrend list={p.personal.weighIns} band={band.id} weightKg={p.personal.weightKg} trainingAge={p.personal.trainingAge}
          onUpdateWeight={(kg) => { p.setPersonal({ ...p.personal, weightKg: kg }); p.notify(`Your numbers now use ${wText(kg, 0)}.`); }}
          onRemove={(date) => p.setPersonal({ ...p.personal, weighIns: withoutWeighIn(p.personal.weighIns, date) })} />
      )}
      {band && guideOf(band.id) && (
        <>
          <button className="link about-goal" aria-expanded={about} onClick={() => setAbout((v) => !v)}>{about ? "Close About your goal" : "About your goal ›"}</button>
          {about && <GoalGuide id={band.id} />}
        </>
      )}
      {!ownWay && c && <ProteinCard c={c} />}
      {p.review?.status === "change" && ownWay && (
        <section className="coach-note">
          <small>{p.review.by || p.coachLabel}, {new Date(p.review.at).toLocaleDateString("en", { day: "numeric", month: "long" })}</small>
          <b>{p.review.note || "Please look at your numbers again."}</b>
          {p.review.kept?.length ? <small>About: {p.review.kept.map((k) => k.title.toLowerCase()).join("; ")}</small> : null}
          <div className="button-row">
            <button className="pill pill-small pill-primary" onClick={openGoal}>Change my numbers</button>
            <button className="pill pill-small" onClick={() => { const r = window.prompt(`Reply to ${p.review?.by || p.coachLabel}`); if (r && r.trim()) void p.sendReview(p.review?.kept ?? [], p.review?.summary ?? "", r.trim()); }}>Reply to {p.review.by || p.coachLabel}</button>
          </div>
        </section>
      )}
      {mode === "each" && (o || c) && (
        <>
          <p className="label">Your days, each its own</p>
          {o ? <DayTable rows={o.days} avg={o.avg} week={weekOf(p.personal)} /> : <DayTable rows={c!.days} avg={{ kcal: c!.kcal, protein: c!.protein }} week={c!.week} weekdays={c!.weekdays} />}
        </>
      )}
      {ownWay && (() => {
        const burn = canCalculate(p.personal) ? calculate(p.personal, "maintain", p.formula)?.kcal ?? null : null;
        const src = o ?? (state.goals.calories && state.goals.protein ? { days: Object.fromEntries(DAY_TYPES.map((x) => [x.id, { kcal: state.goals.calories!, protein: state.goals.protein!, fats: state.goals.fats ?? 0, carbs: state.goals.carbs ?? 0, how: [] }])) as any, avg: { kcal: state.goals.calories!, protein: state.goals.protein!, fats: state.goals.fats ?? 0 } } : null);
        if (!src) return null;
        const a = analyse({ days: src.days, avg: src.avg, bandId: band?.id ?? "maintain", personal: p.personal, burn });
        const kept = a.findings.filter((f) => !openAt(f, p.personal)).length, open = a.findings.length - kept;
        return (
          <button className="menu-row analysis-row" onClick={openGoal}>
            <span className="menu-row-text"><b>Target analysis</b><small>{a.findings.length ? `${a.findings.length} finding${a.findings.length === 1 ? "" : "s"}${kept ? `, ${kept} kept on purpose` : ""}${open ? `, ${open} open` : ""}` : "Everything in range"}</small></span><ChevronRight size={18} />
          </button>
        );
      })()}
      <div className="button-row" style={{ marginTop: 12 }}>
        <button className="pill pill-small pill-primary" onClick={openGoal}><Calculator size={14} /> Change the goal</button>
        <ConfirmButton className="pill pill-small" label={<><RotateCcw size={14} /> Reset</>} confirmLabel="Tap again to reset" onConfirm={resetGoal} />
      </div>
      <p className="label">How your numbers work</p>
      {/* the formula is picked in the calculator (canvas board FX, G1a); here one line says which one is in use */}
      {canCalculate(p.personal) && !isMinor(p.personal) && (
        <section className="card you-card formula-line">
          <span><b>Formula</b><small>{p.formula ? `${FORMULA_NAME[p.formula]}, set by ${p.coachLabel}` : p.personal.formula ? FORMULA_NAME[p.personal.formula] : `Automatic: ${p.personal.bodyFatPct ? "Katch McArdle" : "Mifflin St Jeor"} now`}{(p.formula ?? p.personal.formula) === "data" && p.personal.measuredUse ? ` · ${p.personal.measuredUse.kcal.toLocaleString("en")} kcal a day to stay the same` : p.formulaKcal ? ` · ${p.formulaKcal.toLocaleString("en")} kcal a day to stay the same` : ""}</small></span>
          <button className="link" onClick={openGoal}>Change</button>
        </section>
      )}
      {/* the measured burn, next to the formula (0.2.7, board FT, FT3 and FT4) */}
      {p.measured && canCalculate(p.personal) && !isMinor(p.personal) && (
        <BurnCard m={p.measured} formulaKcal={p.formulaKcal} inUse={(p.formula ?? p.personal.formula) === "data" ? p.personal.measuredUse ?? null : null} onUse={p.formula ? undefined : p.useMyData} />
      )}
      <section className="card explain">
        <p><b>At rest.</b> What your body burns doing nothing, from the formula you picked above: Mifflin St Jeor, Katch McArdle or Schofield.</p>
        <p><b>Your everyday.</b> That times how your work goes: 1.3 sitting, 1.55 on your feet, 1.75 in physical work. Then your steps, on every day: only what's above what your work already covers, about 10 minutes of walking per 1,000 steps at 3.5 METs.</p>
        <p><b>Your training.</b> Each training day adds what it costs: light about 3.5 METs, moderate 5, hard 8, or the activity's own value from your Training week, times your weight and the minutes (the middle of the range), less what you burn at rest anyway.</p>
        <p><b>Your goal.</b> Minus 20 % to lose fat, minus 10 % for recomposition, plus 5 % to build muscle steadily, plus 10 % to build it faster, plus 5 % for performance.</p>
        <p><b>Protein.</b> 1.6 to 2.2 g per kg if you train twice a week or more, else 1.2 to 1.6. The same every day; the energy moves with the training.</p>
        <small>Sources: Mifflin et al. 1990; Katch and McArdle; Schofield 1985 (FAO/WHO/UNU); FAO/WHO/UNU 2004 activity levels; Compendium of Physical Activities 2024; US Dietary Guidelines 2025–2030; ISSN position stand 2017; Morton et al. 2018.</small>
      </section>
      <GoalHistory log={p.goalLog} />
      <NextLink p={p} to="life" from="goal" text="Lifestyle" hint="How you eat, work and sleep. Set once." />
    </>
  );
}

// History as periods (canvas board FX, G3): only goals that were applied, each with the days it held, newest first
export function GoalHistory({ log }: { log: GoalEntry[] }) {
  const periods = periodsOf(log);
  if (!periods.length) return null;
  return (
    <>
      <p className="label">History</p>
      <section className="card history">
        {periods.slice(0, 20).map(({ entry: e, ...pr }) => (
          <div className="history-row" key={e.at}>
            <div><b>{e.band ? goalLabel(e.band) : "Custom"}{pr.now && <span className="now-tag">NOW</span>}</b><small>{periodLine({ entry: e, ...pr })}{SOURCE_LABEL[e.source] ? `, ${SOURCE_LABEL[e.source].charAt(0).toLowerCase()}${SOURCE_LABEL[e.source].slice(1)}` : ""}{e.weightKg ? `, at ${wText(e.weightKg, Number.isInteger(wIn(e.weightKg)) ? 0 : 1)}` : ""}</small></div>
            <div className="history-num"><b>{e.kcal !== null ? e.kcal.toLocaleString("en") : "?"}</b><small>kcal, {e.protein ?? "?"} g protein</small></div>
          </div>
        ))}
      </section>
    </>
  );
}

function Seg({ title, why, children }: { title: string; why: string; children: ReactNode }) {
  return (
    <>
      <div className="seg-head"><b>{title}</b><small>{why}</small></div>
      <section className="card seg">{children}</section>
    </>
  );
}
function Setting({ name, hint, children }: { name: string; hint?: string; children: ReactNode }) {
  return <div className="setting"><small className="setting-name">{name}</small>{children}{hint && <small className="setting-hint">{hint}</small>}</div>;
}
function Chips<T extends string | number>({ items, on, pick, multi }: { items: { id: T; name: string }[]; on: T | T[] | undefined; pick: (v: T) => void; multi?: boolean }) {
  const isOn = (v: T) => (multi ? ((on as T[] | undefined) ?? []).includes(v) : on === v);
  return <div className="chip-row">{items.map((x) => <button type="button" key={String(x.id)} className={`choice ${isOn(x.id) ? "on" : ""}`} aria-pressed={isOn(x.id)} onClick={() => pick(x.id)}>{x.name}</button>)}</div>;
}
function Options<T extends string>({ items, on, pick }: { items: { id: T; name: string; hint: string }[]; on: T | undefined; pick: (v: T) => void }) {
  return <div className="opt-grid">{items.map((x) => <button type="button" key={x.id} className={`opt ${on === x.id ? "on" : ""}`} aria-pressed={on === x.id} onClick={() => pick(x.id)}><b>{x.name}</b><small>{x.hint}</small></button>)}</div>;
}

// Lifestyle, as approved on 6 October 2026: how life runs most weeks, set once. Nutrition first, then Work, then Recovery.
function LifestylePanel(p: AppApi) {
  const l = lifestyleOf(p.personal);
  const save = (patch: Partial<Lifestyle>) => {
    const next = { ...l, ...patch };
    p.setPersonal({ ...p.personal, lifestyle: next });
    p.setUsual(usualFrom(next, planOf(p.personal)));
  };
  const age = ageOf(p.personal);
  // under 18: school instead of work, no eating window, no alcohol question; the age comes from the profile
  const minor = isMinor(p.personal);
  const wk = weekdaysOf(l);
  const toggle = (v: string) => save({ where: (l.where ?? []).includes(v) ? (l.where ?? []).filter((x) => x !== v) : [...(l.where ?? []), v] });
  const asItems = (xs: string[]) => xs.map((x) => ({ id: x, name: x }));
  return (
    <>
      <p className="small muted page-why">{minor ? "How your life runs in a normal school week. Set it once, and change it when something changes, like a new school year." : "How your life runs most weeks. Set it once; change it when life changes."}</p>
      <Seg title="Nutrition" why={minor ? "How you usually eat. Chef Mealan suggests from here first." : "How you usually eat and drink. Chef Mealan plans and suggests from here first."}>
        <Setting name="Where you eat" hint="Pick all that apply."><Chips items={asItems(minor ? WHERE_KID : WHERE)} on={l.where} pick={toggle} multi /></Setting>
        <Setting name="Meals a day" hint={minor ? "Snacks count as a meal here." : undefined}><Chips items={[2, 3, 4, 5].map((n) => ({ id: n, name: n === 5 ? "5 or more" : String(n) }))} on={l.meals} pick={(n) => save({ meals: n })} /></Setting>
        {/* 0.2.1: the slots Plan shows, with their times. M8 (11 October 2026): the times are what I set; the eating window
            follows from them, first meal to last, and is no longer set by hand. A window set before is where the times start. */}
        <Setting name="Meal times" hint="When you eat each meal. Your eating window follows from them.">
          <div className="field-row slot-times">
            {slotsOf(l).map((s) => <label key={s.id} className="field field-on"><span>{s.name}</span><input type="time" value={s.time} aria-label={`${s.name} time`} onChange={(e) => e.target.value && save({ slotTimes: { ...(l.slotTimes ?? {}), [s.id]: e.target.value } })} /></label>)}
          </div>
        </Setting>
        {!minor && (() => { const t = slotsOf(l).map((x) => x.time).sort(); return <p className="window-line">Eating window: {t[0]} to {t[t.length - 1]}. From your first and last meal.</p>; })()}
        <Setting name="How you eat"><Chips items={asItems(DIETS)} on={l.diet ?? "Everything"} pick={(v) => save({ diet: v })} /></Setting>
        {age !== null && age >= ALCOHOL_AGE && (
          <Setting name="Alcohol" hint="Alcohol counts as energy, 7 kcal a gram, and slows recovery. Chef Mealan will leave room for it on those days instead of pretending it isn't there.">
            <Chips items={asItems(ALCOHOL)} on={l.alcohol} pick={(v) => save({ alcohol: v })} />
          </Setting>
        )}
      </Seg>
      <small className="muted page-why">Allergies stay in Profile, with the safety questions.</small>
      {minor ? (
        <Seg title="School" why="How much school moves you on a normal day, before any sport.">
          <Setting name="School hours"><Options items={SCHOOL_HOURS} on={l.school} pick={(v) => save({ school: v })} /></Setting>
          <Setting name="How you get to school" hint="Walking or cycling there and back counts as light activity on every school day."><Chips items={COMMUTES} on={l.commute} pick={(v) => save({ commute: v })} /></Setting>
          <Setting name="Sport at school" hint="You pick the days in your Training week."><Chips items={PE_WEEK} on={l.peWeek} pick={(v) => save({ peWeek: v })} /></Setting>
        </Seg>
      ) : (
        // Release B (7 October 2026, canvas B1 and B3): what fills the weekdays first; the questions after it follow the answer
        <Seg title="Work and study" why="How much your weekdays move you, before any training.">
          <Setting name="Your weekdays"><Options items={WEEKDAY_CHOICES} on={wk} pick={(v) => save({ weekdays: v, ...(v !== "home" && l.hours === "none" ? { hours: undefined } : {}) })} /></Setting>
          {(wk === "work" || wk === "both") && (
            <>
              <Setting name="Working hours" hint={l.hours === "fixed" ? "With fixed hours, Monday to Friday are work days in your Training week. You can change any day there." : undefined}>
                <Options items={HOURS_SHOWN} on={l.hours === "none" ? undefined : l.hours} pick={(v) => save({ hours: v })} />
                {l.hours === "fixed" && <Chips items={SLOTS} on={l.slot} pick={(v) => save({ slot: v })} />}
              </Setting>
              <Setting name="At work you are"><Options items={MOVES} on={l.move ?? "sitting"} pick={(v) => save({ move: v })} /></Setting>
              <Setting name="Work travel"><Chips items={[{ id: "none", name: "None" }, { id: "sometimes", name: "Occasionally" }, { id: "often", name: "A lot" }]} on={l.travel} pick={(v) => save({ travel: v as Lifestyle["travel"] })} /></Setting>
            </>
          )}
          {(wk === "study" || wk === "both") && (
            <>
              <Setting name="Study hours"><Options items={STUDY_HOURS} on={l.school === "none" ? undefined : l.school} pick={(v) => save({ school: v })} /></Setting>
              <Setting name="How you get there" hint="Walking or cycling there and back counts as light activity on every study day."><Chips items={COMMUTES} on={l.commute} pick={(v) => save({ commute: v })} /></Setting>
              <Setting name="Sport as part of your studies" hint="For courses with sport, like a sports class at school. You pick the days in your Training week."><Chips items={PE_WEEK} on={l.peWeek} pick={(v) => save({ peWeek: v })} /></Setting>
            </>
          )}
          {wk === "home" && <p className="small muted">Your days are spent at home. Chef Mealan counts every day as a day at home, and your training goes in the Training week.</p>}
        </Seg>
      )}
      <Seg title="Recovery" why={minor ? "Sleep is when your body grows and turns sport into progress. Most teenagers need 8 to 10 hours." : "Sleep is where training turns into progress. It also decides when a late meal makes sense."}>
        <Setting name="Bedtime"><Chips items={[{ id: "early", name: "Before 22:00" }, { id: "mid", name: "22:00 to midnight" }, { id: "late", name: "After midnight" }, ...(minor ? [] : [{ id: "varies", name: "Varies with shifts" }])]} on={l.bed} pick={(v) => save({ bed: v as Lifestyle["bed"] })} /></Setting>
        <Setting name="Wake-up"><Chips items={minor ? [{ id: "early", name: "Before 6" }, { id: "mid", name: "6 to 7" }, { id: "late", name: "After 7" }] : [{ id: "early", name: "Before 6:00" }, { id: "mid", name: "6:00 to 8:00" }, { id: "late", name: "After 8:00" }, { id: "varies", name: "Varies with shifts" }]} on={l.wake} pick={(v) => save({ wake: v as Lifestyle["wake"] })} /></Setting>
      </Seg>
      <NextLink p={p} to="week" from="life" text="Training week" hint={minor ? "What each day of your school week holds" : "What each day of your usual week holds"} />
    </>
  );
}

// Training week (canvas board TW, TW2, Milan 13 October 2026): the usual week of training only, as an agenda, then the
// picked day's settings. No dates: a change for one date, and the days gone by, live on Plan, the one calendar with dates.
function PlanPanel(p: AppApi) {
  // no plan yet: a week without training, as in Calculate for me (7 October 2026)
  const plan = planOf(p.personal) ?? planFromCounts({ passive: 7, active: 0, easy: 0, hard: 0 });
  const minor = isMinor(p.personal);
  const todayD = new Date(); todayD.setHours(0, 0, 0, 0);
  const [sel, setSel] = useState(weekdayIndex(todayD));
  const [copying, setCopying] = useState<number[] | null>(null);
  const l = lifestyleOf(p.personal);
  const save = (next: Plan) => { p.setPersonal({ ...p.personal, plan: next }); p.setUsual(usualFrom(l, next)); };
  const setDay = (i: number, d: PlanDay) => save(plan.map((x, n) => (n === i ? d : x)));
  const c = p.goal ? calculate(p.personal, p.goal.band ?? "maintain", p.formula) : null;
  // Release B: the word on the right says Work, Study, or nothing on a day off; the bar keeps its colors
  const wkd = weekdaysOf(l), peOn = !!l.peWeek && l.peWeek !== "none";
  const dayWord = (d: PlanDay) => { if (minor) return d.work ? "School" : "No school"; const k = dayKindOf(d, l); return k === "work" ? "Work" : k === "study" ? "Study" : ""; };
  const workHint = workHintOf(l, minor);
  const counts = countsOf(plan);
  const avg = c ? Math.round(plan.reduce((t, d) => t + c.numbersOf(d).kcal, 0) / 7 / 50) * 50 : null;
  return (
    <>
      <p className="small muted page-why">Your usual week of training. It repeats every week. To change one date, open that day on Plan.</p>
      <section className="week-card" aria-label="Your training week">
        <div className="week-card-head"><b>Your usual training week</b>{avg !== null && <small>average {avg.toLocaleString("en")} kcal</small>}</div>
        {plan.map((d, i) => (
          <button type="button" key={i} className={`agenda-row ${sel === i ? "on" : ""}`} aria-pressed={sel === i} onClick={() => { setSel(i); setCopying(null); }}>
            <span className={`load-bar load-${loadOf(d)}`} />
            <b>{WEEKDAYS[i]}</b>
            <span className="agenda-what">{planShort(d)}</span>
            <small className={dayWord(d) ? "work" : ""}>{dayWord(d)}</small>
          </button>
        ))}
        <div className="load-key">{(["hard", "easy", "active", "passive"] as DayType[]).filter((t) => counts[t]).map((t) => <span key={t}><i className={`load-${t}`} />{LOAD_NAME[t]} {counts[t]}</span>)}</div>
        <small className="week-card-foot">The bar shows how hard the day is{minor ? ", sport at school and after school together" : ""}. Tap a day to set it.</small>
      </section>
      <Seg title={WEEKDAY_NAMES[sel]} why={`Every ${WEEKDAY_NAMES[sel]}. To change one date, open that day on Plan.`}>
        <DayEditor minor={minor} weekdays={wkd} peOn={peOn} value={plan[sel]} onChange={(d) => setDay(sel, d)} workHint={workHint} />
        {copying === null ? (
          <button type="button" className="pill pill-wide" onClick={() => setCopying([])}>Copy {WEEKDAY_NAMES[sel]} to other days</button>
        ) : (
          <div className="setting">
            <small className="setting-name">Copy {WEEKDAY_NAMES[sel]} to</small>
            <div className="chip-row">{WEEKDAYS.map((w, i) => i === sel ? null : <button type="button" key={w} className={`choice ${copying.includes(i) ? "on" : ""}`} aria-pressed={copying.includes(i)} onClick={() => setCopying(copying.includes(i) ? copying.filter((x) => x !== i) : [...copying, i])}>{w}</button>)}</div>
            <div className="actions">
              <button type="button" className="pill pill-primary action-main" disabled={!copying.length} onClick={() => { save(plan.map((x, n) => (copying.includes(n) ? { ...plan[sel], work: x.work, study: x.study, pe: x.work && x.study === plan[sel].study ? plan[sel].pe : false } : x))); setCopying(null); }}>Copy to {copying.length} {copying.length === 1 ? "day" : "days"}</button>
              <button type="button" className="link action-cancel" onClick={() => setCopying(null)}>Cancel</button>
            </div>
            <small className="setting-hint">Copies the activity; each day keeps its {minor ? "school day or no school" : "work day, study day or day off"}.</small>
          </div>
        )}
      </Seg>
      <NextLink p={p} to="shop" from="week" text="Where I shop and cook" hint="Your shops, the kitchens you cook, and what you cook with" />
    </>
  );
}

function ShopPanel(p: AppApi) {
  return (
    <>
    <section className="card">
      <small>This picks your starter foods, and tells Chef Mealan which shops you can really buy from.</small>
      <div className="moments" style={{ marginTop: 8 }}>
        {REGIONS.map((r) => <button key={r.id} className={`choice ${p.region === r.id ? "on" : ""}`} onClick={() => p.setRegion(r.id)}>{r.name}</button>)}
      </div>
      <p className="label" style={{ marginTop: 16 }}>Starter foods</p>
      <small>About twenty common foods from your shops, with checked values, so the plate works from day one{(REGIONS.find((r) => r.id === p.region)?.tags ?? []).includes("cy") ? ", and fifty Cypriot foods with their Greek names" : ""}. Foods you already have are skipped, so you can tap again after changing where you shop.</small>
      <div className="button-row" style={{ marginTop: 8 }}>
        <button className="pill pill-small" onClick={p.addStarter}>Add starter foods for {REGIONS.find((r) => r.id === p.region)?.name ?? "my region"}</button>
      </div>
    </section>
    {/* The kitchens you cook (0.2.9, canvas board CH, CH4): the shops say what you can buy, the kitchens what you like to cook */}
    <p className="label" style={{ marginTop: 14 }}>The kitchens you cook</p>
    <section className="card kitchens" style={{ gap: 8 }}>
      <small>{CHEF_NAME} cooks in these first: the tastes, the herbs, how a meal is put together. Pick one or more.</small>
      <div className="moments" role="group" aria-label="The kitchens you cook">
        {KITCHENS.map((k) => { const on = (p.personal.kitchens ?? []).includes(k); return <button key={k} className={`choice ${on ? "on" : ""}`} aria-pressed={on} onClick={() => p.setPersonal({ ...p.personal, kitchens: on ? (p.personal.kitchens ?? []).filter((x) => x !== k) : [...(p.personal.kitchens ?? []), k] })}>{k}</button>; })}
      </div>
      {/* What a kitchen means (0.2.10, board CH, CH7): a line, three dishes Chef Mealan would cook you, Another and Undo */}
      {(p.personal.kitchens ?? []).filter((k) => KITCHEN[k]).map((k) => {
        const t = tasteOf(p.personal, k), set = (next: Taste) => p.setPersonal({ ...p.personal, kitchenTaste: { ...(p.personal.kitchenTaste ?? {}), [k]: next } });
        const last = t.out[t.out.length - 1], more = anotherLeft(t, k);
        return (
          <div className="kt" key={k}>
            <small className="kt-name">{k.toUpperCase()}</small>
            <small className="kt-what">{KITCHEN[k].what}</small>
            <small className="kt-lead">Three dishes {CHEF_NAME} would cook you:</small>
            {t.shown.map((d, i) => (
              <div className={`kt-dish ${last?.with === d ? "kt-new" : ""}`} key={d}><b>{d}</b>{more && <button className="link" aria-label={`Another instead of ${d}`} onClick={() => set(another(t, k, i))}>Another</button>}</div>
            ))}
            {t.out.length > 0 && <small className="kt-out">Not for you: {t.out.map((o) => o.dish.toLowerCase()).join(", ")}. <button className="link" onClick={() => set(undo(t))}>Undo</button></small>}
            {!more && <small className="kt-out">That's every dish we have for this kitchen. Tell {CHEF_NAME} in the chat what you cook.</small>}
          </div>
        );
      })}
      <small className="setting-hint">A plate that already has a kitchen keeps it: sarma stays Balkan, a curry stays Indian. Everything else comes from these.</small>
    </section>
    {/* What you cook with (0.2.18, canvas board IM, IM10): the steps are written for these */}
    <p className="label" style={{ marginTop: 14 }}>What you cook with</p>
    <section className="card cook-with" style={{ gap: 8 }}>
      <small>{CHEF_NAME} writes the steps for what you have. A recipe that needs something you don't have says how to make it without, or that it can't.</small>
      <div className="moments" role="group" aria-label="What you cook with">
        {EQUIPMENT.map(([id, name]) => { const has = equipmentOf(p.personal), on = has.includes(id); return <button key={id} className={`choice ${on ? "on" : ""}`} aria-pressed={on} onClick={() => p.setPersonal({ ...p.personal, equipment: on ? has.filter((x) => x !== id) : [...has, id] })}>{name}</button>; })}
      </div>
    </section>
      <NextLink p={p} to="coach" from="shop" text="Coach" hint="Join a coach with a code, or see yours" />
    </>
  );
}

function CoachPanel(p: AppApi) {
  const { profile, cloudEnabled, user, joinCoach, leaveCoach } = p;
  const [code, setCode] = useState("");
  const coachName = profile.coachName || COACH_NAME;
  if (profile.role === "coach")
    return <section className="card"><small>You're a coach. Your code, your clients and what they shared are in the Clients tab.</small><div className="button-row" style={{ marginTop: 8 }}><button className="pill pill-small pill-primary" onClick={() => { p.setTab("clients"); }}>Open Clients</button></div></section>;
  if (!cloudEnabled || !user)
    return <section className="card person"><span className="avatar avatar-coach">{COACH_NAME.slice(0, 1)}</span><div><b>{COACH_NAME}</b><small>sets your target and sees how it went</small></div></section>;
  return profile.coachId ? (
    <>
      <section className="card person">
        {profile.coachPhoto ? <img className="avatar avatar-coach" src={profile.coachPhoto} alt="" referrerPolicy="no-referrer" /> : <span className="avatar avatar-coach">{coachName.slice(0, 1)}</span>}
        <div>
          <b>{coachName}</b>
          {profile.coachEmail && <small><a href={`mailto:${profile.coachEmail}`}>{profile.coachEmail}</a></small>}
          <small>Your coach{profile.joinedAt ? ` since ${fmtDay(profile.joinedAt)}` : ""}.</small>
        </div>
      </section>
      {/* 0.2.6 (canvas board CW, CW6): the check-in day, what the coach sees with the week first, and the notes */}
      <section className="card coach-checkin"><span><b>Check-in: {DAY_NAMES[p.checkinDay]}</b><small>{p.coachLabel} looks at your week and sends a note.</small></span></section>
      <section className="card">
        <b>What your coach sees</b>
        <ul className="small">
          <li>Your week: each day, the meals planned against the meals eaten, with their names, PD and kcal. From the day you joined.</li>
          <li>Your goal and today's numbers, and may set them for you.</li>
          <li>Your weigh-ins.</li>
          <li>The cards you share, with the reason and the photo.</li>
          <li>Which situations you ticked on your profile and when. Never your words.</li>
        </ul>
        <b>What your coach never sees</b>
        <ul className="small">
          <li>Your photos and notes on cards you don't share, your library, your chats with Chef Mealan.</li>
          <li>Your body data. Only the numbers it gives.</li>
        </ul>
        <ConfirmButton className="link link-danger" label="Leave this coach" confirmLabel="Tap again to leave" onConfirm={leaveCoach} />
      </section>
      {p.coachNotes.length > 0 && (
        <>
          <p className="label">Notes from {p.coachLabel}</p>
          <section className="card days">{[...p.coachNotes].reverse().slice(0, 20).map((n) => (
            <div className="history-row" key={n.at}><div><b>{new Date(n.at).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }).replace(",", "")}</b><small>{n.by === "client" ? "Your reply" : n.verdict === "change" ? "Asked you to change your numbers" : "Approved your week"}</small></div><div className="history-num"><small>“{n.text}”</small></div></div>
          ))}</section>
        </>
      )}
    </>
  ) : (
    <section className="card">
      <small>Got an invite from your coach? Enter its code. It works with the email it was sent to.</small>
      <div className="button-row" style={{ marginTop: 8 }}>
        <input className="code-input" value={code} placeholder="Coach code" onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={8} />
        <button className="pill pill-small pill-primary" disabled={code.trim().length < 4} onClick={() => joinCoach(code)}>Join</button>
      </div>
    </section>
  );
}

function AccountPanel(p: AppApi) {
  const { cloudEnabled, user, cloudStatus, signOut, deleteAccount } = p;
  // the export is the person's whatever the sign-in: on this phone only, the file holds what the phone holds
  if (!cloudEnabled) return (
    <>
      <section className="card"><small>This phone only. Your data stays here.</small></section>
      <section className="card">
        <b>Your data</b>
        <p className="small">Everything Chef Mealan keeps about you on this phone, in one file: your profile, your goal and its history, your foods with their photos, and your cards.</p>
        <div className="button-row"><button className="pill pill-small" onClick={p.exportMyData}><Download size={14} /> Export my data</button></div>
      </section>
    </>
  );
  return (
    <>
      <section className="card person">
        {user?.photo ? <img className="avatar avatar-img" src={user.photo} alt="" /> : <span className="avatar">{(user?.name || "?").slice(0, 1)}</span>}
        <div><b>{user ? user.name || user.email : "This phone only"}</b><small>{user ? user.email : "no account, data stays here"}</small></div>
      </section>
      {user && cloudStatus.text && <p className={`small sync ${cloudStatus.ok ? "" : "sync-bad"}`}>{cloudStatus.text}{cloudStatus.at ? `, ${new Date(cloudStatus.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}.</p>}
      <section className="card">
        <b>Your data</b>
        <p className="small">Everything Chef Mealan keeps about you, in one file: your profile, your goal and its history, your foods with their photos, your cards, recipes from your coach, and what your account stores.</p>
        <div className="button-row">
          <button className="pill pill-small" onClick={p.exportMyData}><Download size={14} /> Export my data</button>
        </div>
        {user && <p className="small">Delete removes all of it, photos, cards and recipes included, and the sign-in. Not undoable.{p.deleteSteps ? ` ${p.deleteSteps}…` : ""}</p>}
      </section>
      <div className="button-row">
        {user && <button className="pill pill-small" onClick={signOut}>Sign out</button>}
        {user && <ConfirmButton className="pill pill-small danger" label="Delete my account" confirmLabel="Tap again to delete everything" onConfirm={deleteAccount} />}
        {!user && <button className="pill pill-small" onClick={() => { localStorage.removeItem("chefmealan-local-only"); location.reload(); }}>Sign in</button>}
      </div>
    </>
  );
}

function SupportPanel(p: AppApi) {
  const { cloudEnabled, coach, setCoach, services, exportData, importRef, setAccessOpen, addStarter, importAirtable, setTab } = p;
  const isCoach = p.profile.role === "coach";
  const n = readLog().length;
  return (
    <>
      <section className="card">
        <small>Questions, something broken, or an idea: write to us.</small>
        <div className="button-row" style={{ marginTop: 8 }}><a className="pill pill-small pill-primary" href="mailto:hello@chefmealan.com?subject=Chef%20Mealan">hello@chefmealan.com</a></div>
      </section>
      {(!cloudEnabled || isCoach) && (
        <>
          <p className="label">Tools</p>
          <section className="card">
            {!cloudEnabled && <label className="check"><input type="checkbox" checked={coach} onChange={(e) => setCoach(e.target.checked)} /> I am the coach</label>}
            {(coach || isCoach) && (
              <div className="coach-tools">
                <small>Pilot log: {n} {n === 1 ? "event" : "events"} on this device.</small>
                <div className="button-row">
                  <button className="pill pill-small" onClick={exportLog}><Download size={14} /> Export log</button>
                  <ConfirmButton className="pill pill-small" label="Clear log" confirmLabel="Tap again to clear" onConfirm={clearLog} />
                </div>
                <div className="button-row">
                  <button className="pill pill-small" onClick={addStarter}>Add starter foods</button>
                  <button className="pill pill-small" onClick={importAirtable} disabled={!services?.airtable}>Import from Airtable</button>
                </div>
                <div className="button-row">
                  <button className="pill pill-small" onClick={exportData}><Download size={14} /> Backup</button>
                  <button className="pill pill-small" onClick={() => importRef.current?.click()}><Upload size={14} /> Restore</button>
                  <button className="pill pill-small" onClick={() => setTab("recipes")}>Recipes</button>
                </div>
                <small>AI label reading: {services?.ai ? "on" : "off"} · Airtable: {services?.airtable ? "on" : "off"}</small>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}

function AboutPanel() {
  return (
    <section className="card">
      <b>{APP_NAME}</b>
      <p className="small">Chef Mealan fits the food you want to the goal you have. The numbers come from code; the model reads labels, menus and shelves; you and your coach decide.</p>
      <p className="small">Pilot. Barcode data from Open Food Facts; label values are estimates, check the package. Your data sits in the EU, under your account.</p>
      <p className="small">hello@chefmealan.com</p>
      <p className="small"><a href="/about">Who's behind it</a> · <a href="/impressum">Impressum</a> · <a href="/privacy">Privacy notice</a> · <a href="/disclaimer">Disclaimer</a></p>
      <p className="small">Version {(import.meta.env.VITE_VERSION as string | undefined) || "0"} · {(import.meta.env.VITE_COMMIT as string | undefined) || "preview"}</p>
      <p className="small open-line">{openLine()}</p>
      <small className="muted">Measured on this phone, each time the app opens.</small>
    </section>
  );
}
