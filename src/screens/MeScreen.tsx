import { Download, Upload, SlidersHorizontal } from "lucide-react";
import { fmt, fixed } from "../ui";
import { APP_NAME, COACH_NAME } from "../components/Mark";
import { exportLog, clearLog, readLog } from "../log";
import { bandOf } from "../goal";
import type { AppApi } from "./api";

export function MeScreen(p: AppApi) {
  const { state, services, exportData, importRef, setAccessOpen, setGoalsOpen, pdRef, coach, setCoach, setTab, clientName, setClientName, goal, openGoal } = p;
  const bandName = goal?.band ? bandOf(goal.band)?.name : null;
  const setBy = goal?.setBy === "coach" ? COACH_NAME : "you";
  const n = readLog().length;
  return (
    <>
      <section className="card person">
        <span className="avatar">{(clientName || "?").slice(0, 1).toUpperCase()}</span>
        <label className="name-field">
          <span>Your name</span>
          <input value={clientName} placeholder="Your name" onChange={(e) => setClientName(e.target.value)} />
        </label>
      </section>
      <section className="card person">
        <span className="avatar avatar-coach">{COACH_NAME.slice(0, 1)}</span>
        <div><b>{COACH_NAME}</b><small>your coach</small></div>
      </section>
      <section className="plan">
        <div className="plan-top"><span>Your goal{bandName ? `: ${bandName}` : ""}</span><span>set by {setBy}</span></div>
        <div className="plan-row">
          <div><b>{fixed(pdRef)}</b><small>PD target</small></div>
          <div><b>{fmt(state.goals.calories, 0)}</b><small>kcal a day</small></div>
          <div><b>{fmt(state.goals.protein, 0)}</b><small>g protein</small></div>
        </div>
        <button className="link" onClick={openGoal}><SlidersHorizontal size={14} /> Change my goal</button>
        {coach && <button className="link" onClick={() => setGoalsOpen(true)}>Edit the numbers</button>}
      </section>
      <section className="card">
        <div className="card-top"><span>What you told {COACH_NAME}</span><span>{state.feedback.length}</span></div>
        {state.feedback.length === 0 && <small>Nothing yet. It starts after your first DaaM.</small>}
        {state.feedback.slice(0, 5).map((f) => (
          <div className="fb" key={f.id}>
            <b>{f.taste}</b>
            <small>{f.meal.title} · {new Date(f.createdAt).toLocaleDateString()}{f.notes ? ` · ${f.notes}` : ""}</small>
          </div>
        ))}
      </section>
      <section className="card">
        <label className="check"><input type="checkbox" checked={coach} onChange={(e) => setCoach(e.target.checked)} /> I am the coach</label>
        {coach && (
          <div className="coach-tools">
            <small>Pilot log: {n} {n === 1 ? "event" : "events"} on this device.</small>
            <div className="button-row">
              <button className="subtle" onClick={exportLog}><Download size={15} /> Export log</button>
              <button className="subtle danger" onClick={() => { if (confirm("Clear the pilot log on this device?")) clearLog(); }}>Clear</button>
            </div>
            <div className="button-row">
              <button className="subtle" onClick={exportData}><Download size={15} /> Backup</button>
              <button className="subtle" onClick={() => importRef.current?.click()}><Upload size={15} /> Restore</button>
              <button className="subtle" onClick={() => setTab("notes")}>Recipes</button>
              <button className="subtle" onClick={() => setAccessOpen(true)}>Server</button>
            </div>
            <small>AI label reading: {services?.ai ? "on" : "off"} · Airtable: {services?.airtable ? "on" : "off"}</small>
          </div>
        )}
      </section>
      <p className="small center">{APP_NAME}, pilot. Barcode data from Open Food Facts, check the package.</p>
    </>
  );
}
