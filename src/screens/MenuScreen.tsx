import { useState, type ReactNode } from "react";
import { FlaskConical, ChevronRight, ArrowLeft, Download, Upload, SlidersHorizontal, RotateCcw, Target, User, CalendarDays, ShoppingBasket, Users, KeyRound, LifeBuoy, Info, Calculator } from "lucide-react";
import { fmt, fixed, pdText, pdVal, pdTag, pdRange } from "../ui";
import { APP_NAME, COACH_NAME } from "../components/Mark";
import { exportLog, clearLog, readLog, log } from "../log";
import { BANDS, bandOf, SOURCE_LABEL, type GoalEntry } from "../goal";
import { ConfirmButton } from "../components/Confirm";
import { RHYTHMS, REGIONS } from "../moments";
import { ACTIVITIES, calculate, canCalculate, suggestBand, formulaFor, type Personal } from "../personal";
import type { AppApi, MenuSection } from "./api";
import { SITUATIONS, FIXED, type SituationId } from "../safety";
import { EvalsScreen } from "./EvalsScreen";

const ITEMS: { id: MenuSection; name: string; icon: ReactNode }[] = [
  { id: "profile", name: "Profile", icon: <User size={20} /> },
  { id: "goal", name: "Goal", icon: <Target size={20} /> },
  { id: "week", name: "My week", icon: <CalendarDays size={20} /> },
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
        <div className="menu-head"><h2>Settings</h2><button className="link" onClick={close}>Close</button></div>
        <div className="menu-list">
          {ITEMS.filter((it) => it.id !== "evals" || p.profile.role === "coach" || !p.cloudEnabled).map((it) => (
            <button key={it.id} className="menu-row" onClick={() => setSection(it.id)}>
              <span className="menu-icon">{it.icon}</span><b>{it.name}</b><ChevronRight size={18} />
            </button>
          ))}
        </div>
      </>
    );
  const title = ITEMS.find((i) => i.id === section)?.name ?? "";
  return (
    <>
      <div className="menu-head"><button className="link" onClick={() => setSection(from ?? "list")}><ArrowLeft size={16} /> {from ? ITEMS.find((i) => i.id === from)?.name : "Settings"}</button><button className="link" onClick={close}>Close</button></div>
      <h2 className="menu-title">{title}</h2>
      {section === "profile" && <ProfilePanel {...p} />}
      {section === "goal" && <GoalPanel {...p} />}
      {section === "week" && <WeekPanel {...p} />}
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
  const [allergyText, setAllergyText] = useState(p.safety.allergies.join(", "));
  const doorDirty = JSON.stringify(sits) !== JSON.stringify(p.safety.situations) || allergyText.trim() !== p.safety.allergies.join(", ");
  const saveDoor = () => {
    const allergies = allergyText.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
    const next = allergies.length && !sits.includes("allergies") ? [...sits, "allergies" as SituationId] : sits;
    p.declareSafety({ situations: next, allergies, declaredAt: new Date().toISOString() });
    setSits(next);
    p.notify("Noted. Mealan keeps to it.");
  };
  return (
    <>
      <p className="small">Optional. Used only to calculate your numbers. Stored on this phone and in your account, nowhere else.</p>
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
          <p className="small">Nothing about your body is stored until you agree. Under 16, a parent agrees.</p>
          <div className="button-row">
            <button className="pill pill-small pill-primary" onClick={() => p.declareSafety({ consentBodyAt: new Date().toISOString(), consentBy: "self" })}>I agree</button>
            <button className="pill pill-small" onClick={() => p.declareSafety({ consentBodyAt: new Date().toISOString(), consentBy: "parent" })}>A parent agrees for me</button>
          </div>
        </section>
      )}
      <section className={`card form ${consented ? "" : "shut"}`} aria-disabled={!consented}>
        <label className="field"><span>Name</span><input value={name} placeholder="Your name" onChange={(e) => setName(e.target.value)} /></label>
        <div className="field"><span>Sex</span>
          <div className="moments">
            {(["female", "male"] as const).map((s) => <button key={s} className={`pill pill-small ${d.sex === s ? "pill-primary" : ""}`} onClick={() => setD({ ...d, sex: d.sex === s ? undefined : s })}>{s === "female" ? "Female" : "Male"}</button>)}
          </div>
        </div>
        <div className="field-row">
          <label className="field"><span>Birth year</span><input inputMode="numeric" value={d.birthYear ?? ""} placeholder="1985" onChange={(e) => setD({ ...d, birthYear: num(e.target.value) })} /></label>
          <label className="field"><span>Height, cm</span><input inputMode="numeric" value={d.heightCm ?? ""} placeholder="175" onChange={(e) => setD({ ...d, heightCm: num(e.target.value) })} /></label>
          <label className="field"><span>Weight, kg</span><input inputMode="decimal" value={d.weightKg ?? ""} placeholder="75" onChange={(e) => setD({ ...d, weightKg: num(e.target.value) })} /></label>
        </div>
        <label className="field"><span>Body fat %, if you know it</span><input inputMode="decimal" value={d.bodyFatPct ?? ""} placeholder="from a scale or a scan" onChange={(e) => setD({ ...d, bodyFatPct: num(e.target.value) })} /></label>
        <div className="field"><span>Activity</span>
          <div className="activity-list">
            {ACTIVITIES.map((a) => (
              <button key={a.id} className={`activity ${d.activity === a.id ? "on" : ""}`} onClick={() => setD({ ...d, activity: d.activity === a.id ? undefined : a.id })}>
                <b>{a.name}</b><small>{a.hint}</small>
              </button>
            ))}
          </div>
        </div>
        <div className="field"><span>Show protein density as</span>
          <div className="moments">
            <button className={`pill pill-small ${(d.pdUnit ?? "pd") === "pd" ? "pill-primary" : ""}`} onClick={() => setD({ ...d, pdUnit: "pd" })}>PD, grams per 100 kcal</button>
            <button className={`pill pill-small ${d.pdUnit === "pct" ? "pill-primary" : ""}`} onClick={() => setD({ ...d, pdUnit: "pct" })}>% of energy from protein</button>
          </div>
          <small>Same thing, two ways to read it: PD 5 is 20 % of the energy from protein.</small>
        </div>
        <button className="pill pill-primary pill-wide" disabled={!dirty || !consented} onClick={() => { p.setClientName(name.trim()); p.setPersonal(d); if (d.pdUnit !== p.personal.pdUnit) log("pd_unit", { unit: d.pdUnit ?? "pd" }); p.notify("Profile saved."); }}>Save</button>
      </section>
      <section className="card form door" aria-label="Is any of this true for you">
        <b>Is any of this true for you?</b>
        <p className="small">Mealan is a chef. For these, it steps back, names who to talk to, and keeps the plate working. Your coach sees that you ticked one and when, never your words.</p>
        {SITUATIONS.map((x) => (
          <label className="check" key={x.id}>
            <input type="checkbox" checked={sits.includes(x.id)} onChange={(e) => setSits(e.target.checked ? [...sits, x.id] : sits.filter((y) => y !== x.id))} />
            <span><b>{x.label}</b>{x.detail ? <small> {x.detail}</small> : null}</span>
          </label>
        ))}
        <label className="field"><span>Allergies and intolerances, which ones</span><input value={allergyText} placeholder="milk, peanuts, gluten" onChange={(e) => setAllergyText(e.target.value)} /></label>
        <small className="muted">Nothing containing these is ever suggested. Mealan checks the name and the label lines of every food.</small>
        {p.ai.needsParent && <small className="muted">Under 16: a parent agrees on the profile, and your coach confirms before Mealan's chat is on.</small>}
        <button className="pill pill-primary pill-wide" disabled={!doorDirty} onClick={saveDoor}>Save</button>
        {p.safety.situations.length > 0 && (
          <div className="fixed-lines">
            {p.safety.situations.map((id) => <p className="small" key={id}><b>{SITUATIONS.find((x) => x.id === id)?.label}:</b> {FIXED[id]}</p>)}
          </div>
        )}
        {!p.ai.on && <p className="small notice">{p.ai.why}</p>}
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

function GoalPanel(p: AppApi) {
  const { state, goal, pdRef, openGoal, setGoalsOpen, resetGoal } = p;
  const bandName = goal?.band ? bandOf(goal.band)?.name : null;
  const setBy = goal?.setBy === "coach" ? (goal.coachName || p.profile.coachName || COACH_NAME) : "you";
  const [band, setBand] = useState<string>(suggestBand(p.personal, goal?.band).id);
  const result = calculate(p.personal, band, p.formula);
  return (
    <>
      <section className="plan">
        <div className="plan-top"><span>Your goal{bandName ? `: ${bandName}` : ""}</span><span>set by {setBy}</span></div>
        <div className="plan-row">
          <div><b>{pdVal(p.dayPd)}</b><small>{pdTag()} target</small></div>
          <div><b>{fmt(state.goals.calories, 0)}</b><small>kcal a day</small></div>
          <div><b>{fmt(state.goals.protein, 0)}</b><small>g protein</small></div>
        </div>
        <p className="source-line">{goal?.source ? SOURCE_LABEL[goal.source] : goal?.setBy === "coach" ? SOURCE_LABEL.coach : "Quick goal"}{goal?.method ? `: ${goal.method}` : ""}{goal?.source === "profile" ? ". Follows your profile." : ""}</p>
        <div className="button-row">
          <button className="pill pill-small" onClick={openGoal}><Target size={14} /> Quick goal</button>
          <button className="pill pill-small" onClick={() => setGoalsOpen(true)}><SlidersHorizontal size={14} /> Exact numbers</button>
          <ConfirmButton className="pill pill-small" label={<><RotateCcw size={14} /> Reset</>} confirmLabel="Tap again to reset" onConfirm={resetGoal} />
        </div>
      </section>
      <p className="label">Your days</p>
      <section className="card">
        <div className="moments">
          <button className={`pill pill-small ${p.personal.dayMode !== "follow" ? "pill-primary" : ""}`} onClick={() => p.setPersonal({ ...p.personal, dayMode: "same" })}>Every day the same</button>
          <button className={`pill pill-small ${p.personal.dayMode === "follow" ? "pill-primary" : ""}`} onClick={() => p.setPersonal({ ...p.personal, dayMode: "follow" })}>Follow my day</button>
        </div>
        <small>{p.personal.dayMode === "follow" ? "On Today you say what kind of day it is: rest, usual, training or very active. Calories move with the day; protein stays. Until you say, the usual day is assumed." : "One number for every day. Some days you'll use more, some less; over the week it evens out."}</small>
      </section>
      <p className="label">Calculate my numbers</p>
      {!canCalculate(p.personal) ? (
        <>
        <section className="card">
          <small>Add your birth year, height, weight and activity in Profile, and Mealan calculates your daily calories and protein for the goal you pick.</small>
        </section>
        <div className="menu-list" style={{ marginTop: 8 }}>
          <button className="menu-row" onClick={() => p.openMenu("profile", "goal")}>
            <span className="menu-icon"><User size={20} /></span>
            <span className="menu-row-text"><b>Profile</b><small>Add what the calculation needs</small></span>
            <ChevronRight size={18} />
          </button>
        </div>
        </>
      ) : (
        <section className="card">
          <small>Pick what you're after. The numbers come from your profile.</small>
          <div className="moments" style={{ marginTop: 8 }}>
            {BANDS.map((b) => <button key={b.id} className={`pill pill-small ${band === b.id ? "pill-primary" : ""}`} onClick={() => setBand(b.id)}>{b.name}</button>)}
          </div>
          {result && (
            <div className="proposal">
              <div className="plan-row">
                <div><b>{pdVal(result.protein / (result.kcal / 100))}</b><small>{pdTag()}</small></div>
                <div><b>{fmt(result.kcal, 0)}</b><small>kcal a day</small></div>
                <div><b>{result.protein}</b><small>g protein, {result.proteinMin}–{result.proteinMax}</small></div>
              </div>
              <p className="math">{result.math}</p>
              <small>{result.method}{p.formula ? " (chosen by your coach)" : formulaFor(p.personal) === "katch" ? " (from your body fat)" : ""}.</small>
              {result.note && <small>{result.note}</small>}
              <button className="pill pill-primary pill-wide" onClick={() => { p.applyNumbers(band, result.kcal, result.protein, result.method); p.notify("Your goal is set. It follows your profile from now on."); }}>Use these numbers</button>
            </div>
          )}
          {pdRef === null && null}
        </section>
      )}
      <p className="label">How your numbers work</p>
      <section className="card explain">
        <p><b>At rest.</b> What your body burns doing nothing: Mifflin–St Jeor from sex, age, height and weight, or Katch–McArdle from your lean mass when you know your body fat.</p>
        <p><b>Your day.</b> That times how much you move: 1.2 for a day on the sofa, 1.375 light, 1.55 active, 1.725 very active, 1.9 training twice. A lazy Sunday and a training day can be 1,000 kcal apart.</p>
        <p><b>Your goal.</b> Minus 20 % to lose fat, minus 10 % for recomposition, plus 10 % to build.</p>
        <p><b>Protein.</b> Per kg of your weight: 1.2 to 1.6 g for adults, 1.6 to 2.2 g if you train, build or cut. It stays the same on rest days; the energy moves.</p>
        <small>Sources: Mifflin et al. 1990; Katch and McArdle; standard activity multipliers; US Dietary Guidelines 2025–2030; ISSN position stand 2017; Morton et al. 2018.</small>
      </section>
      <p className="label">How Mealan judges a food</p>
      <section className="card explain">
        <p><b>Before decides after.</b> Code works out what a food suits before Mealan writes a word, and Mealan has to follow it. A tip that breaks a rule is sent back; if it breaks again, the rule writes the tip itself.</p>
        <p><b>Before training.</b> Only foods with at most 10 g fat and 6 g fibre per 100 g: they digest fast enough not to sit in the stomach while you lift.</p>
        <p><b>After training.</b> A protein base, with or without carbs next to it.</p>
        <p><b>Flavour foods and fat sources.</b> A small part of a plate a protein base carries. Never on their own, never "for energy".</p>
        <p><b>Caveats.</b> Only from fixed values per 100 g: fat above 17.5 g, saturates above 5 g, sugars above 22.5 g, salt above 1.5 g. Said as a fact, never as a judgement.</p>
        <small>Sources: UK Food Standards Agency front-of-pack values; ISSN position stand on nutrient timing, 2017.</small>
      </section>
      <GoalHistory log={p.goalLog} />
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

function WeekPanel(p: AppApi) {
  return (
    <section className="card">
      <small>The shape of your week. It decides which moments come first when you cook.</small>
      <div className="moments" style={{ marginTop: 8 }}>
        {RHYTHMS.map((r) => (
          <button key={r.id} className={`pill pill-small ${p.usual.includes(r.id) ? "pill-primary" : ""}`} onClick={() => p.setUsual(p.usual.includes(r.id) ? p.usual.filter((x) => x !== r.id) : [...p.usual, r.id])}>{r.name}</button>
        ))}
      </div>
    </section>
  );
}

function ShopPanel(p: AppApi) {
  return (
    <section className="card">
      <small>Decides your starter foods, and tells Mealan which shelves are real.</small>
      <div className="moments" style={{ marginTop: 8 }}>
        {REGIONS.map((r) => <button key={r.id} className={`pill pill-small ${p.region === r.id ? "pill-primary" : ""}`} onClick={() => p.setRegion(r.id)}>{r.name}</button>)}
      </div>
      <p className="label" style={{ marginTop: 16 }}>Starter foods</p>
      <small>About twenty common foods from your shelves, with reviewed values, so the plate works from day one. Foods you already have are skipped, so it's safe to tap again after changing where you shop.</small>
      <div className="button-row" style={{ marginTop: 8 }}>
        <button className="pill pill-small" onClick={p.addStarter}>Add starter foods for {REGIONS.find((r) => r.id === p.region)?.name ?? "my region"}</button>
      </div>
    </section>
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
    <section className="card person">
      <span className="avatar avatar-coach">{coachName.slice(0, 1)}</span>
      <div><b>{coachName}</b><small>sets your target and sees how it went</small></div>
      <ConfirmButton className="link link-danger" label="Leave" confirmLabel="Tap again to leave" onConfirm={leaveCoach} />
    </section>
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
                  <button className="pill pill-small" onClick={() => setTab("notes")}>Recipes</button>
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
      <p className="small">Version {(import.meta.env.VITE_COMMIT as string | undefined) || "preview"}</p>
    </section>
  );
}
