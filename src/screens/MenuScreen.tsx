import { useState, type ReactNode } from "react";
import { ChevronRight, ArrowLeft, Download, Upload, SlidersHorizontal, RotateCcw, Target, User, CalendarDays, ShoppingBasket, Users, KeyRound, LifeBuoy, Info, Calculator } from "lucide-react";
import { fmt, fixed } from "../ui";
import { APP_NAME, COACH_NAME } from "../components/Mark";
import { exportLog, clearLog, readLog } from "../log";
import { BANDS, bandOf, SOURCE_LABEL, type GoalEntry } from "../goal";
import { ConfirmButton } from "../components/Confirm";
import { RHYTHMS, REGIONS } from "../moments";
import { ACTIVITIES, calculate, canCalculate, suggestBand, formulaFor, type Personal } from "../personal";
import type { AppApi, MenuSection } from "./api";

const ITEMS: { id: MenuSection; name: string; icon: ReactNode }[] = [
  { id: "profile", name: "Profile", icon: <User size={20} /> },
  { id: "goal", name: "Goal", icon: <Target size={20} /> },
  { id: "week", name: "My week", icon: <CalendarDays size={20} /> },
  { id: "shop", name: "Where I shop", icon: <ShoppingBasket size={20} /> },
  { id: "coach", name: "Coach", icon: <Users size={20} /> },
  { id: "account", name: "Account", icon: <KeyRound size={20} /> },
  { id: "support", name: "Support", icon: <LifeBuoy size={20} /> },
  { id: "about", name: "About", icon: <Info size={20} /> },
];

export function MenuScreen(p: AppApi & { section: MenuSection; setSection: (s: MenuSection) => void; close: () => void }) {
  const { section, setSection, close } = p;
  if (section === "list")
    return (
      <>
        <div className="menu-head"><h2>Settings</h2><button className="link" onClick={close}>Close</button></div>
        <div className="menu-list">
          {ITEMS.map((it) => (
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
      <div className="menu-head"><button className="link" onClick={() => setSection("list")}><ArrowLeft size={16} /> Settings</button><button className="link" onClick={close}>Close</button></div>
      <h2 className="menu-title">{title}</h2>
      {section === "profile" && <ProfilePanel {...p} />}
      {section === "goal" && <GoalPanel {...p} />}
      {section === "week" && <WeekPanel {...p} />}
      {section === "shop" && <ShopPanel {...p} />}
      {section === "coach" && <CoachPanel {...p} />}
      {section === "account" && <AccountPanel {...p} />}
      {section === "support" && <SupportPanel {...p} />}
      {section === "about" && <AboutPanel />}
    </>
  );
}

function ProfilePanel(p: AppApi) {
  const [name, setName] = useState(p.clientName);
  const [d, setD] = useState<Personal>(p.personal);
  const num = (v: string) => (v.trim() === "" ? undefined : Number(v.replace(",", ".")) || undefined);
  const dirty = name.trim() !== p.clientName || JSON.stringify(d) !== JSON.stringify(p.personal);
  return (
    <>
      <p className="small">Optional. Used only to calculate your numbers. Stored on this phone and in your account, nowhere else.</p>
      <section className="card form">
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
        <button className="pill pill-primary pill-wide" disabled={!dirty} onClick={() => { p.setClientName(name.trim()); p.setPersonal(d); p.notify("Profile saved."); }}>Save</button>
      </section>
      {canCalculate(d) && <button className="pill pill-wide" onClick={() => p.openMenu("goal")}><Calculator size={16} /> Calculate my numbers</button>}
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
          <div><b>{fixed(p.dayPd)}</b><small>PD target</small></div>
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
      <p className="label">Calculate my numbers</p>
      {!canCalculate(p.personal) ? (
        <section className="card">
          <small>Add your birth year, height, weight and activity in Profile, and Mealan calculates your daily calories and protein for the goal you pick.</small>
          <div className="button-row" style={{ marginTop: 8 }}><button className="pill pill-small pill-primary" onClick={() => p.openMenu("profile")}>Open Profile</button></div>
        </section>
      ) : (
        <section className="card">
          <small>Pick what you're after. The numbers come from your profile.</small>
          <div className="moments" style={{ marginTop: 8 }}>
            {BANDS.map((b) => <button key={b.id} className={`pill pill-small ${band === b.id ? "pill-primary" : ""}`} onClick={() => setBand(b.id)}>{b.name}</button>)}
          </div>
          {result && (
            <div className="proposal">
              <div className="plan-row">
                <div><b>{fixed(result.protein / (result.kcal / 100))}</b><small>PD</small></div>
                <div><b>{fmt(result.kcal, 0)}</b><small>kcal a day</small></div>
                <div><b>{result.protein}</b><small>g protein</small></div>
              </div>
              <small>{result.method}{p.formula ? " (chosen by your coach)" : formulaFor(p.personal) === "katch" ? " (from your body fat)" : ""}.</small>
              {result.note && <small>{result.note}</small>}
              <button className="pill pill-primary pill-wide" onClick={() => { p.applyNumbers(band, result.kcal, result.protein, result.method); p.notify("Your goal is set. It follows your profile from now on."); }}>Use these numbers</button>
            </div>
          )}
          {pdRef === null && null}
        </section>
      )}
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
            <div className="history-num"><b>{e.kcal !== null ? e.kcal.toLocaleString() : "?"}</b><small>kcal · {e.protein ?? "?"} g{e.kcal && e.protein ? ` · PD ${(e.protein / (e.kcal / 100)).toFixed(1)}` : ""}</small></div>
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
      <small>Got a code from your coach? Enter it once. From then on your coach sees what you share and can set your goal.</small>
      <div className="button-row" style={{ marginTop: 8 }}>
        <input className="code-input" value={code} placeholder="Coach code" onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={8} />
        <button className="pill pill-small pill-primary" disabled={code.trim().length < 4} onClick={() => joinCoach(code)}>Join</button>
      </div>
    </section>
  );
}

function AccountPanel(p: AppApi) {
  const { cloudEnabled, user, cloudStatus, signOut, deleteAccount } = p;
  if (!cloudEnabled) return <section className="card"><small>This phone only. Your data stays here.</small></section>;
  return (
    <>
      <section className="card person">
        {user?.photo ? <img className="avatar avatar-img" src={user.photo} alt="" /> : <span className="avatar">{(user?.name || "?").slice(0, 1)}</span>}
        <div><b>{user ? user.name || user.email : "This phone only"}</b><small>{user ? user.email : "no account, data stays here"}</small></div>
      </section>
      {user && cloudStatus.text && <p className={`small sync ${cloudStatus.ok ? "" : "sync-bad"}`}>{cloudStatus.text}{cloudStatus.at ? `, ${new Date(cloudStatus.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}.</p>}
      <div className="button-row">
        {user && <button className="pill pill-small" onClick={signOut}>Sign out</button>}
        {user && <ConfirmButton className="pill pill-small" label="Delete my account and data" confirmLabel="Tap again to delete everything" onConfirm={deleteAccount} />}
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
                  <button className="pill pill-small" onClick={() => setAccessOpen(true)}>Server</button>
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
    </section>
  );
}
