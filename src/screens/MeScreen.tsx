import { Download, Upload, SlidersHorizontal, RotateCcw, Target } from "lucide-react";
import { fmt, fixed } from "../ui";
import { APP_NAME, COACH_NAME } from "../components/Mark";
import { exportLog, clearLog, readLog } from "../log";
import { bandOf } from "../goal";
import { ConfirmButton } from "../components/Confirm";
import type { AppApi } from "./api";

export function MeScreen(p: AppApi) {
  const { state, services, exportData, importRef, setAccessOpen, setGoalsOpen, pdRef, coach, setCoach, setTab, clientName, setClientName, goal, openGoal, resetGoal, addStarter, importAirtable, user, cloudEnabled, cloudStatus, signOut, deleteAccount } = p;
  const n = readLog().length;
  const bandName = goal?.band ? bandOf(goal.band)?.name : null;
  const setBy = goal?.setBy === "coach" ? COACH_NAME : "you";
  return (
    <>
      <p className="label">You</p>
      <section className="card person">
        <span className="avatar">{(clientName || "?").slice(0, 1).toUpperCase()}</span>
        <label className="name-field">
          <span>Your name</span>
          <input value={clientName} placeholder="Your name" onChange={(e) => setClientName(e.target.value)} />
        </label>
      </section>
      <section className="plan">
        <div className="plan-top"><span>Your goal{bandName ? `: ${bandName}` : ""}</span><span>set by {setBy}</span></div>
        <div className="plan-row">
          <div><b>{fixed(pdRef)}</b><small>PD target</small></div>
          <div><b>{fmt(state.goals.calories, 0)}</b><small>kcal a day</small></div>
          <div><b>{fmt(state.goals.protein, 0)}</b><small>g protein</small></div>
        </div>
        <div className="button-row">
          <button className="pill pill-small" onClick={openGoal}><Target size={14} /> Change goal</button>
          <button className="pill pill-small" onClick={() => setGoalsOpen(true)}><SlidersHorizontal size={14} /> Exact numbers</button>
          <ConfirmButton className="pill pill-small" label={<><RotateCcw size={14} /> Reset</>} confirmLabel="Tap again to reset" onConfirm={resetGoal} />
        </div>
      </section>
      <section className="card">
        <div className="card-top"><span>What you told {COACH_NAME}</span><span>{state.feedback.length}</span></div>
        {state.feedback.length === 0 && <small>Nothing yet. It starts after your first DaaM.</small>}
        {state.feedback.slice(0, 5).map((f) => (
          <div className="fb" key={f.id}>
            {f.photo && <img className="fb-photo" src={f.photo} alt="" />}
            <b>{f.taste}</b>
            <small>{f.meal.title} · {new Date(f.createdAt).toLocaleDateString()}{f.notes ? ` · ${f.notes}` : ""}</small>
          </div>
        ))}
      </section>

      {cloudEnabled && (
        <>
          <p className="label">Account</p>
          <section className="card person">
            {user?.photo ? <img className="avatar avatar-img" src={user.photo} alt="" /> : <span className="avatar">{(user?.name || "?").slice(0, 1)}</span>}
            <div><b>{user ? user.name || user.email : "This phone only"}</b><small>{user ? user.email : "no account, data stays here"}</small></div>
          </section>
          {user && cloudStatus.text && (
            <p className={`small sync ${cloudStatus.ok ? "" : "sync-bad"}`}>{cloudStatus.text}{cloudStatus.at ? `, ${new Date(cloudStatus.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}. Photos stay on this phone for now.</p>
          )}
          <div className="button-row">
            {user && <button className="pill pill-small" onClick={signOut}>Sign out</button>}
            {user && <ConfirmButton className="pill pill-small" label="Delete my account and data" confirmLabel="Tap again to delete everything" onConfirm={deleteAccount} />}
            {!user && <button className="pill pill-small" onClick={() => { localStorage.removeItem("chefmealan-local-only"); location.reload(); }}>Sign in</button>}
          </div>
        </>
      )}
      <p className="label">Your coach</p>
      <section className="card person">
        <span className="avatar avatar-coach">{COACH_NAME.slice(0, 1)}</span>
        <div><b>{COACH_NAME}</b><small>sets your target and sees how it went</small></div>
      </section>

      <p className="label">Coach area</p>
      <section className="card">
        <label className="check"><input type="checkbox" checked={coach} onChange={(e) => setCoach(e.target.checked)} /> I am the coach</label>
        {coach && (
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
      <p className="small center">{APP_NAME}, pilot. Barcode data from Open Food Facts, check the package.</p>
    </>
  );
}
