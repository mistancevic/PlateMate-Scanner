import { useState, useEffect, type ReactNode } from "react";
import { FlaskConical, ChevronRight, BookOpen, ArrowLeft, Download, Upload, SlidersHorizontal, RotateCcw, Target, User, CalendarDays, ShoppingBasket, Users, KeyRound, LifeBuoy, Info, Calculator, Coffee } from "lucide-react";
import { fmt, fixed, pdText, pdVal, pdTag, pdRange } from "../ui";
import { APP_NAME, COACH_NAME } from "../components/Mark";
import { exportLog, clearLog, readLog, log } from "../log";
import { BANDS, bandOf, SOURCE_LABEL, type GoalEntry } from "../goal";
import { ConfirmButton } from "../components/Confirm";
import { RHYTHMS, REGIONS } from "../moments";
import { LIFE, DAY_TYPES, calculate, canCalculate, suggestBand, formulaFor, dayModeOf, ownDayNumbers, weekOf, lifeOf, planOf, lifestyleOf, ageOf, isMinor, dayFor, type Personal, type DayType } from "../personal";
import { WEEKDAYS, WEEKDAY_NAMES, HOURS, SLOTS, MOVES, WHERE, DIETS, ALCOHOL, ALCOHOL_AGE, LOAD_NAME, planFromCounts, countsOf, loadOf, planShort, planLine, LOAD_DAY, isoWeek, datesOfWeek, WHERE_KID, SCHOOL_HOURS, COMMUTES, PE_WEEK, weekdayIndex, usualFrom, type Plan, type PlanDay, type Lifestyle } from "../plan";
import { DayEditor } from "../components/DayEditor";
import { ProteinCard } from "../components/ProteinCard";
import { DayTable } from "../components/DayTable";
import { analyse, isOpen as openAt } from "../analysis";
import type { AppApi, MenuSection } from "./api";
import { SITUATIONS, SITUATION_FOR, EU_ALLERGENS, FIXED, type SituationId } from "../safety";
import { EvalsScreen } from "./EvalsScreen";
import { dayLog } from "../today";
import { aggregate, uid } from "../pilot";

// the sections that belong to the person: they live under Me, and back from them goes to Me
const ME_SECTIONS: MenuSection[] = ["profile", "goal", "life", "week", "shop", "coach", "account"];
const ITEMS: { id: MenuSection; name: string; icon: ReactNode }[] = [
  { id: "profile", name: "Profile", icon: <User size={20} /> },
  { id: "goal", name: "Goal", icon: <Target size={20} /> },
  { id: "life", name: "Lifestyle", icon: <Coffee size={20} /> },
  { id: "week", name: "Weekly plan", icon: <CalendarDays size={20} /> },
  { id: "shop", name: "Where I shop", icon: <ShoppingBasket size={20} /> },
  { id: "coach", name: "Coach", icon: <Users size={20} /> },
  { id: "account", name: "Account", icon: <KeyRound size={20} /> },
  { id: "support", name: "Support", icon: <LifeBuoy size={20} /> },
  { id: "about", name: "About", icon: <Info size={20} /> },
  { id: "evals", name: "Evals", icon: <FlaskConical size={20} /> },
];

export function MenuScreen(p: AppApi & { section: MenuSection; setSection: (s: MenuSection) => void; close: () => void; from: MenuSection | null }) {
  const { section, setSection, close, from } = p;
  if (section === "list")
    return (
      <>
        <div className="menu-head"><h2>Menu</h2><button className="link" onClick={close}>Close</button></div>
        <p className="small muted">Who you are and how you're set up is under Me. This is housekeeping.</p>
        <div className="menu-list">
          {[{ id: "support" as MenuSection, name: "Support", icon: <LifeBuoy size={20} /> }, { id: "about" as MenuSection, name: "About", icon: <Info size={20} /> }, ...(p.profile.role === "coach" || !p.cloudEnabled ? [{ id: "evals" as MenuSection, name: "Evals", icon: <FlaskConical size={20} /> }] : [])].map((it) => (
            <button key={it.id} className="menu-row" onClick={() => setSection(it.id)}>
              <span className="menu-icon">{it.icon}</span><b>{it.name}</b><ChevronRight size={18} />
            </button>
          ))}
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
      <div className="menu-head"><button className="link" onClick={() => ((from as string) === "me" || ME_SECTIONS.includes(section) && !from ? close() : setSection(from ?? "list"))}><ArrowLeft size={16} /> {(from as string) === "me" ? "Me" : from ? ITEMS.find((i) => i.id === from)?.name : ME_SECTIONS.includes(section) ? "Me" : "Menu"}</button><button className="link" onClick={close}>Close</button></div>
      <h2 className="menu-title">{title}</h2>
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
    </>
  );
}

function ProfilePanel(p: AppApi) {
  const [name, setName] = useState(p.clientName);
  const [d, setD] = useState<Personal>(p.personal);
  const num = (v: string) => (v.trim() === "" ? undefined : Number(v.replace(",", ".")) || undefined);
  const dirty = name.trim() !== p.clientName || JSON.stringify(d) !== JSON.stringify(p.personal);
  const consented = Boolean(p.safety.consentBodyAt);
  // the door: situations Mealan steps back from, and what to keep off every suggestion
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
    p.notify(isNone ? "Noted: none applies. Mealan cooks." : "Noted. Mealan keeps to it.");
  };
  const tick = (id: SituationId, on: boolean) => { if (id === "allergies" && !on) { setChips([]); setFreeText(""); } commit(on ? [...sits, id] : sits.filter((y) => y !== id), on ? false : none, id === "allergies" && !on ? "" : allergyText); };
  const tickNone = (on: boolean) => { if (on) { setChips([]); setFreeText(""); } commit(on ? [] : sits, on, on ? "" : allergyText); };
  const toggleChip = (k: string, on: boolean) => { const next = on ? [...chips, k] : chips.filter((x) => x !== k); setChips(next); commit(sits.includes("allergies") ? sits : [...sits, "allergies"], false, joined(next, freeText)); };
  const answered = none || sits.length > 0;
  return (
    <>
      <p className="small">Optional. Used only to calculate your numbers. Stored on this phone and in your account, nowhere else.</p>
      {consented && (
        <p className="small consent-line">You agreed to the body data on {fmtDay(p.safety.consentBodyAt!)}. It is in your export, and goes with everything else when you delete the account.</p>
      )}
      {!consented && (
        <section className="card consent" aria-label="Before your numbers">
          <b>Before your numbers</b>
          <p className="small">To calculate your day, Mealan asks about your body: sex, birth year, height, weight, body fat if you know it. Here is what happens with it.</p>
          <ul className="small">
            <li><b>Kept:</b> only those values, and the numbers they give.</li>
            <li><b>Where:</b> on this phone, and in your account in Frankfurt, EU. Nowhere else; never sold, never shared beyond your coach.</li>
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
        <div className="field"><span>Sex</span>
          <div className="moments">
            {(["female", "male"] as const).map((s) => <button key={s} className={`choice ${d.sex === s ? "on" : ""}`} onClick={() => setD({ ...d, sex: d.sex === s ? undefined : s })}>{s === "female" ? "Female" : "Male"}</button>)}
          </div>
        </div>
        <div className="field-row">
          <label className="field"><span>Birth year</span><input inputMode="numeric" value={d.birthYear ?? ""} placeholder="1985" onChange={(e) => setD({ ...d, birthYear: num(e.target.value) })} /></label>
          <label className="field"><span>Height, cm</span><input inputMode="numeric" value={d.heightCm ?? ""} placeholder="175" onChange={(e) => setD({ ...d, heightCm: num(e.target.value) })} /></label>
          <label className="field"><span>Weight, kg</span><input inputMode="decimal" value={d.weightKg ?? ""} placeholder="75" onChange={(e) => setD({ ...d, weightKg: num(e.target.value) })} /></label>
        </div>
        <label className="field"><span>Body fat %, if you know it</span><input inputMode="decimal" value={d.bodyFatPct ?? ""} placeholder="from a scale or a scan" onChange={(e) => setD({ ...d, bodyFatPct: num(e.target.value) })} /></label>
        <div className="field"><span>Your life, without training</span>
          <div className="activity-list">
            {LIFE.map((l) => (
              <button key={l.id} className={`activity ${lifeOf(d) === l.id ? "on" : ""}`} onClick={() => setD({ ...d, life: l.id })}>
                <b>{l.name}</b><small>{l.hint}</small>
              </button>
            ))}
          </div>
          <small className="muted">What each day holds is in your Weekly plan.</small>
        </div>
        <div className="field"><span>Show protein density as</span>
          <div className="moments">
            <button className={`choice ${(d.pdUnit ?? "pd") === "pd" ? "on" : ""}`} onClick={() => setD({ ...d, pdUnit: "pd" })}>PD, grams per 100 kcal</button>
            <button className={`choice ${d.pdUnit === "pct" ? "on" : ""}`} onClick={() => setD({ ...d, pdUnit: "pct" })}>% of energy from protein</button>
          </div>
          <small>Same thing, two ways to read it: PD 5 is 20 % of the energy from protein.</small>
        </div>
        <button className="pill pill-primary pill-wide" disabled={!dirty || !consented} onClick={() => { p.setClientName(name.trim()); p.setPersonal(d); if (d.pdUnit !== p.personal.pdUnit) log("pd_unit", { unit: d.pdUnit ?? "pd" }); p.notify("Profile saved."); }}>Save</button>
      </section>
      <section className="card form door" aria-label="Is any of this true for you">
        <b>Is any of this true for you?</b>
        <p className="small">Mealan is an AI chef. It reads labels and suggests plates, and it can be wrong: check a number against the pack, and check anything about your health with a professional. For the situations below it steps back, names who to talk to, and keeps the plate working. Your coach sees that you ticked one and when, never your words.</p>
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
                <small className="muted">Nothing containing these is ever suggested. Mealan checks the name and the label lines of every food.</small>
              </div>
            )}
          </div>
        ))}
        <label className="check none">
          <input type="checkbox" checked={none} onChange={(e) => tickNone(e.target.checked)} />
          <span><b>None of these applies to me</b><small> an unanswered question is not a no; Mealan asks again once a year</small></span>
        </label>
        <p className={`small ${answered ? "muted" : "notice"}`}>{answered ? `Answered${p.safety.declaredAt ? " on " + fmtDay(p.safety.declaredAt) : ""}. A tick saves by itself; change it any time.` : "Tick one, or none. A tick saves by itself."}</p>
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
  return (
    <>
      <section className="plan goal-head">
        <div className="plan-top"><small className="eyebrow-line">Your goal</small><span className="goal-src">{ownWay ? (goal?.setBy === "coach" ? `set by ${setBy}` : "your own numbers") : "calculated for you"}</span></div>
        <b className="goal-name">{band ? band.name : "Not set yet"}</b>
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
      <section className="card explain">
        <p><b>At rest.</b> What your body burns doing nothing: Mifflin–St Jeor from sex, age, height and weight, or Katch–McArdle from your lean mass when you know your body fat.</p>
        <p><b>Your life.</b> That times how your day goes without training: 1.3 at a desk, 1.4 on shifts, 1.55 on your feet, 1.75 in physical work.</p>
        <p><b>Your training.</b> Each day adds what its training costs: a walk 3.5 METs, an easy session 5, a hard one 8, times your weight and the minutes, less what you burn at rest anyway.</p>
        <p><b>Your goal.</b> Minus 20 % to lose fat, minus 10 % for recomposition, plus 10 % to build muscle, plus 5 % for performance.</p>
        <p><b>Protein.</b> 1.6 to 2.2 g per kg if you train twice a week or more, else 1.2 to 1.6. The same every day; the energy moves with the training.</p>
        <small>Sources: Mifflin et al. 1990; Katch and McArdle; FAO/WHO/UNU 2004 activity levels; Compendium of Physical Activities 2024; US Dietary Guidelines 2025–2030; ISSN position stand 2017; Morton et al. 2018.</small>
      </section>
      <GoalHistory log={p.goalLog} />
      <NextLink p={p} to="life" from="goal" text="Lifestyle" hint="Nutrition, work and recovery, set once" />
    </>
  );
}

export function GoalHistory({ log }: { log: GoalEntry[] }) {
  if (!log.length) return null;
  return (
    <>
      <p className="label">History</p>
      <section className="card history">
        {[...log].reverse().slice(0, 20).map((e) => (
          <div className="history-row" key={e.at}>
            <div><b>{e.band ? bandOf(e.band)?.name : "Custom"}</b><small>{new Date(e.at).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })} · {SOURCE_LABEL[e.source]}{e.weightKg ? ` · ${e.weightKg} kg` : ""}</small></div>
            <div className="history-num"><b>{e.kcal !== null ? e.kcal.toLocaleString() : "?"}</b><small>kcal · {e.protein ?? "?"} g{e.kcal && e.protein ? ` · ${pdText(e.protein / (e.kcal / 100))}` : ""}</small></div>
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
  const toggle = (v: string) => save({ where: (l.where ?? []).includes(v) ? (l.where ?? []).filter((x) => x !== v) : [...(l.where ?? []), v] });
  const asItems = (xs: string[]) => xs.map((x) => ({ id: x, name: x }));
  return (
    <>
      <p className="small muted page-why">{minor ? "How your life runs in a normal school week. Set it once, and change it when something changes, like a new school year." : "How your life runs most weeks. Set it once; change it when life changes."}</p>
      <Seg title="Nutrition" why={minor ? "How you usually eat. Chef Mealan suggests from here first." : "How you usually eat and drink. Chef Mealan plans and suggests from here first."}>
        <Setting name="Where you eat" hint="Pick all that apply."><Chips items={asItems(minor ? WHERE_KID : WHERE)} on={l.where} pick={toggle} multi /></Setting>
        <Setting name="Meals a day" hint={minor ? "Snacks count as a meal here." : undefined}><Chips items={[2, 3, 4, 5].map((n) => ({ id: n, name: n === 5 ? "5 or more" : String(n) }))} on={l.meals} pick={(n) => save({ meals: n })} /></Setting>
        {!minor && (
          <Setting name="Eating window" hint="For people who eat within set hours.">
            <Chips items={[{ id: "none", name: "None" }, { id: "set", name: "Set my window" }]} on={l.window ? "set" : "none"} pick={(v) => save({ window: v === "set" ? (l.window ?? { from: "10:00", to: "18:00" }) : null })} />
            {l.window && (
              <div className="field-row">
                <label className="field"><span>From</span><input type="time" value={l.window.from} onChange={(e) => save({ window: { ...l.window!, from: e.target.value } })} /></label>
                <label className="field"><span>To</span><input type="time" value={l.window.to} onChange={(e) => save({ window: { ...l.window!, to: e.target.value } })} /></label>
              </div>
            )}
          </Setting>
        )}
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
          <Setting name="Sport at school" hint="You pick the days in your Weekly plan."><Chips items={PE_WEEK} on={l.peWeek} pick={(v) => save({ peWeek: v })} /></Setting>
        </Seg>
      ) : (
        <Seg title="Work" why="How much your job moves you on an ordinary day, before any activity.">
          <Setting name="Working hours" hint={l.hours === "fixed" ? "Fixed hours make Monday to Friday work days in your Weekly plan; you can change any day there." : undefined}>
            <Options items={HOURS} on={l.hours} pick={(v) => save({ hours: v })} />
            {l.hours === "fixed" && <Chips items={SLOTS} on={l.slot} pick={(v) => save({ slot: v })} />}
          </Setting>
          <Setting name="At work you are"><Options items={MOVES} on={l.move ?? "sitting"} pick={(v) => save({ move: v })} /></Setting>
          <Setting name="Work travel"><Chips items={[{ id: "none", name: "None" }, { id: "sometimes", name: "Occasionally" }, { id: "often", name: "A lot" }]} on={l.travel} pick={(v) => save({ travel: v as Lifestyle["travel"] })} /></Setting>
        </Seg>
      )}
      <Seg title="Recovery" why={minor ? "Sleep is when your body grows and turns sport into progress. Most teenagers need 8 to 10 hours." : "Sleep is where training turns into progress; it also decides when late meals make sense."}>
        <Setting name="Bedtime"><Chips items={[{ id: "early", name: "Before 22" }, { id: "mid", name: "22 to midnight" }, { id: "late", name: "After midnight" }, ...(minor ? [] : [{ id: "varies", name: "Varies with shifts" }])]} on={l.bed} pick={(v) => save({ bed: v as Lifestyle["bed"] })} /></Setting>
        <Setting name="Wake-up"><Chips items={minor ? [{ id: "early", name: "Before 6" }, { id: "mid", name: "6 to 7" }, { id: "late", name: "After 7" }] : [{ id: "early", name: "Before 6" }, { id: "mid", name: "6 to 8" }, { id: "late", name: "After 8" }, { id: "varies", name: "Varies with shifts" }]} on={l.wake} pick={(v) => save({ wake: v as Lifestyle["wake"] })} /></Setting>
      </Seg>
      <NextLink p={p} to="week" from="life" text="Weekly plan" hint={minor ? "What each day of your school week holds" : "What each day of your usual week holds"} />
    </>
  );
}

// Weekly plan, as approved on 6 October 2026: the usual week as an agenda, then the picked day's settings.
function PlanPanel(p: AppApi) {
  const plan = planOf(p.personal) ?? planFromCounts({ passive: 2, active: 2, easy: 2, hard: 1 });
  const minor = isMinor(p.personal);
  const [tab, setTab] = useState<"date" | "usual">("date");
  const [offset, setOffset] = useState(0);
  const todayD = new Date(); todayD.setHours(0, 0, 0, 0);
  const [sel, setSel] = useState(weekdayIndex(todayD));
  const [copying, setCopying] = useState<number[] | null>(null);
  const [editPast, setEditPast] = useState(false);
  const l = lifestyleOf(p.personal);
  const save = (next: Plan) => { p.setPersonal({ ...p.personal, plan: next }); p.setUsual(usualFrom(l, next)); };
  const setDay = (i: number, d: PlanDay) => save(plan.map((x, n) => (n === i ? d : x)));
  const c = p.goal ? calculate(p.personal, p.goal.band ?? "maintain", p.profile.formula ?? null) : null;
  const dayWord = (d: PlanDay) => (minor ? (d.work ? "School" : "No school") : d.work ? "Work" : "Off");
  const workHint = minor ? "Monday to Friday start as school days. Mark a holiday as no school." : l.hours === "fixed" ? `From Lifestyle: fixed hours${l.slot ? `, ${SLOTS.find((s) => s.id === l.slot)!.name}` : ""}.` : undefined;
  // the dated week: Monday of this week, moved by the arrows
  const base = isoWeek(todayD).monday;
  const monday = new Date(base); monday.setDate(base.getDate() + offset * 7);
  const wk = isoWeek(monday);
  const dates = datesOfWeek(monday);
  const days = dates.map((d) => dayFor({ ...p.personal, plan }, d)!);
  const span = (() => { const a = dates[0], z = dates[6]; const m = (d: Date) => d.toLocaleDateString("en-GB", { month: "long" }); return a.getMonth() === z.getMonth() ? `${a.getDate()} to ${z.getDate()} ${m(z)} ${z.getFullYear()}` : `${a.getDate()} ${m(a)} to ${z.getDate()} ${m(z)} ${z.getFullYear()}`; })();
  const shown = tab === "date" ? days.map((x) => x.day) : plan;
  const counts = countsOf(shown);
  const avg = c ? Math.round(shown.reduce((t, d) => t + c.numbersOf(d).kcal, 0) / 7 / 50) * 50 : null;
  const selDate = dates[sel], isPast = tab === "date" && selDate < todayD;
  const log = isPast ? dayLog(p.state.feedback, selDate) : null;
  const target = isPast && c ? c.numbersOf(days[sel].day) : null;
  const longDate = (d: Date) => `${WEEKDAY_NAMES[weekdayIndex(d)]}, ${d.getDate()} ${d.toLocaleDateString("en-GB", { month: "long" })}`;
  return (
    <>
      <p className="small muted page-why">What each day holds. Your usual week repeats by itself; change any date when that week is different.</p>
      <div className="seg-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "date"} className={tab === "date" ? "on" : ""} onClick={() => { setTab("date"); setSel(offset === 0 ? weekdayIndex(todayD) : 0); }}>By date</button>
        <button type="button" role="tab" aria-selected={tab === "usual"} className={tab === "usual" ? "on" : ""} onClick={() => { setTab("usual"); setCopying(null); }}>Usual week</button>
      </div>
      <section className="week-card" aria-label="Your week">
        {tab === "date" ? (
          <div className="week-nav">
            <button type="button" className="round" aria-label="Week before" onClick={() => { setOffset(offset - 1); setSel(0); setEditPast(false); }}>‹</button>
            <span><b>Week {wk.week}</b><small>{span}{offset === 0 ? " · this week" : ""}</small></span>
            <button type="button" className="round" aria-label="Week after" onClick={() => { setOffset(offset + 1); setSel(0); setEditPast(false); }}>›</button>
          </div>
        ) : (
          <div className="week-card-head"><b>Your usual week</b>{avg !== null && <small>average {avg.toLocaleString("en")} kcal</small>}</div>
        )}
        {shown.map((d, i) => {
          const isToday = tab === "date" && dates[i].getTime() === todayD.getTime();
          const sub = tab === "date" ? (isToday ? "Today" : days[i].changed ? "Changed for this date" : "") : "";
          return (
            <button type="button" key={i} className={`agenda-row ${sel === i ? "on" : ""}`} aria-pressed={sel === i} onClick={() => { setSel(i); setCopying(null); setEditPast(false); }}>
              <span className={`load-bar load-${loadOf(d)}`} />
              <b>{WEEKDAYS[i]}{tab === "date" ? ` ${dates[i].getDate()}` : ""}</b>
              <span className="agenda-what">{planShort(d)}{sub && <small className="agenda-sub">{sub}</small>}</span>
              <small className={d.work ? "work" : ""}>{dayWord(d)}</small>
            </button>
          );
        })}
        <div className="load-key">{(["hard", "easy", "active", "passive"] as DayType[]).filter((t) => counts[t]).map((t) => <span key={t}><i className={`load-${t}`} />{LOAD_NAME[t]} {counts[t]}</span>)}</div>
        <small className="week-card-foot">{tab === "date" && avg !== null ? `Average ${avg.toLocaleString("en")} kcal this week. ` : ""}The bar shows how hard the day is{minor ? ", sport at school and after school together" : ""}. Tap a day to {tab === "date" ? "change it for that date" : "set it"}.</small>
      </section>
      {tab === "date" ? (
        isPast && !editPast ? (
          <Seg title={longDate(selDate)} why={`${planLine(days[sel].day)}. ${LOAD_DAY[loadOf(days[sel].day)]}`}>
            {log && log.logged.length ? (
              <>
                <div className="past-nums">
                  <span><b>{Math.round(log.kcal).toLocaleString("en")}</b><small>{target ? `of ${target.kcal.toLocaleString("en")} kcal` : "kcal"}</small></span>
                  <span><b>{Math.round(log.protein)}</b><small>{target ? `of ${target.protein} g protein` : "g protein"}</small></span>
                  <span><b>{log.kcal ? (Math.round((log.protein / log.kcal) * 1000) / 10).toFixed(1) : "–"}</b><small>PD that day</small></span>
                </div>
                <small className="setting-name">What you ate</small>
                {log.logged.map((f) => {
                  const a = aggregate(f.meal.items);
                  return (
                    <div className="past-plate" key={f.id}>
                      <span><b>{f.meal.title}</b><small>{new Date(f.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {Math.round(a.calories ?? 0)} kcal · {Math.round(a.protein ?? 0)} g protein</small></span>
                      <button type="button" className="pill pill-small" onClick={() => { p.setState((s) => ({ ...s, items: f.meal.items.map((it) => ({ ...it, id: uid() })) })); p.setTab("journey"); }}>Cook again</button>
                    </div>
                  );
                })}
              </>
            ) : <small className="setting-hint">Nothing was logged on this day.</small>}
            <button type="button" className="pill pill-wide" onClick={() => setEditPast(true)}>Change what was planned</button>
            <small className="setting-hint">Search and filters by date come later. For now you browse back week by week.</small>
          </Seg>
        ) : (
          <Seg title={longDate(selDate)} why={`This date only. To change every ${WEEKDAY_NAMES[sel]}, use Usual week above.`}>
            <DayEditor minor={minor} value={days[sel].day} onChange={(d) => p.setDated(selDate, d)} workHint={workHint} />
            {days[sel].changed && <button type="button" className="pill pill-wide" onClick={() => p.setDated(selDate, null)}>Back to the usual {WEEKDAY_NAMES[sel]}</button>}
          </Seg>
        )
      ) : (
        <Seg title={WEEKDAY_NAMES[sel]} why={`Every ${WEEKDAY_NAMES[sel]}, unless you change a date. The week above follows.`}>
          <DayEditor minor={minor} value={plan[sel]} onChange={(d) => setDay(sel, d)} workHint={workHint} />
          {copying === null ? (
            <button type="button" className="pill pill-wide" onClick={() => setCopying([])}>Copy {WEEKDAY_NAMES[sel]} to other days</button>
          ) : (
            <div className="setting">
              <small className="setting-name">Copy {WEEKDAY_NAMES[sel]} to</small>
              <div className="chip-row">{WEEKDAYS.map((w, i) => i === sel ? null : <button type="button" key={w} className={`choice ${copying.includes(i) ? "on" : ""}`} aria-pressed={copying.includes(i)} onClick={() => setCopying(copying.includes(i) ? copying.filter((x) => x !== i) : [...copying, i])}>{w}</button>)}</div>
              <div className="actions">
                <button type="button" className="pill pill-primary action-main" disabled={!copying.length} onClick={() => { save(plan.map((x, n) => (copying.includes(n) ? { ...plan[sel], work: x.work, pe: x.work ? plan[sel].pe : false } : x))); setCopying(null); }}>Copy to {copying.length} {copying.length === 1 ? "day" : "days"}</button>
                <button type="button" className="link action-cancel" onClick={() => setCopying(null)}>Cancel</button>
              </div>
              <small className="setting-hint">Copies the activity; each day keeps its {minor ? "school day or no school" : "work day or off"}.</small>
            </div>
          )}
        </Seg>
      )}
      <NextLink p={p} to="shop" from="week" text="Where I shop" hint="The starter foods for your shops" />
    </>
  );
}

function ShopPanel(p: AppApi) {
  return (
    <>
    <section className="card">
      <small>Decides your starter foods, and tells Mealan which shelves are real.</small>
      <div className="moments" style={{ marginTop: 8 }}>
        {REGIONS.map((r) => <button key={r.id} className={`choice ${p.region === r.id ? "on" : ""}`} onClick={() => p.setRegion(r.id)}>{r.name}</button>)}
      </div>
      <p className="label" style={{ marginTop: 16 }}>Starter foods</p>
      <small>About twenty common foods from your shelves, with reviewed values, so the plate works from day one. Foods you already have are skipped, so it's safe to tap again after changing where you shop.</small>
      <div className="button-row" style={{ marginTop: 8 }}>
        <button className="pill pill-small" onClick={p.addStarter}>Add starter foods for {REGIONS.find((r) => r.id === p.region)?.name ?? "my region"}</button>
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
      <section className="card">
        <b>What your coach sees</b>
        <ul className="small">
          <li>Your goal and today's numbers, and may set them for you.</li>
          <li>The cards you share, with the reason and the photo, and the days they add up to.</li>
          <li>Which situations you ticked on your profile and when. Never your words.</li>
          <li>Recipes they send you land on Today.</li>
        </ul>
        <b>What your coach never sees</b>
        <ul className="small">
          <li>Cards you keep private, your library, your photos, your chats with Mealan.</li>
          <li>Your body data. Only the numbers it gives.</li>
        </ul>
        <ConfirmButton className="link link-danger" label="Leave this coach" confirmLabel="Tap again to leave" onConfirm={leaveCoach} />
      </section>
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
        <p className="small">Everything Mealan holds about you on this phone: profile, goal and its history, foods with photos, cards. One file, yours.</p>
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
        <p className="small">Everything Mealan holds about you: profile, goal and its history, foods with photos, cards, recipes from your coach, and what the account stores. One file, yours.</p>
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
                  <button className="pill pill-small" onClick={() => { p.setFoodsView("recipes"); setTab("foods"); }}>Recipes</button>
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
      <p className="small">Mealan fits the food you want to the goal you have. The numbers come from code; the model reads labels, menus and shelves; you and your coach decide.</p>
      <p className="small">Pilot. Barcode data from Open Food Facts; label values are estimates, check the package. Your data sits in the EU, under your account.</p>
      <p className="small">hello@chefmealan.com</p>
      <p className="small"><a href="/about">Who's behind it</a> · <a href="/impressum">Impressum</a> · <a href="/privacy">Privacy notice</a> · <a href="/disclaimer">Disclaimer</a></p>
      <p className="small">Version {(import.meta.env.VITE_VERSION as string | undefined) || "0"} · {(import.meta.env.VITE_COMMIT as string | undefined) || "preview"}</p>
    </section>
  );
}
