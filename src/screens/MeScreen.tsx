import { Download, Upload, SlidersHorizontal, RotateCcw, Target } from "lucide-react";
import { fmt, fixed } from "../ui";
import { APP_NAME, COACH_NAME } from "../components/Mark";
import { exportLog, clearLog, readLog } from "../log";
import { bandOf } from "../goal";
import { ConfirmButton } from "../components/Confirm";
import { CoachArea } from "./CoachScreen";
import { MOMENTS, RHYTHMS, REGIONS } from "../moments";
import { SendSheet } from "./CoachScreen";
import { useState } from "react";
import type { AppApi } from "./api";

export function MeScreen(p: AppApi) {
  const { state, services, exportData, importRef, setAccessOpen, setGoalsOpen, pdRef, coach, setCoach, setTab, clientName, setClientName, goal, openGoal, resetGoal, addStarter, importAirtable, user, cloudEnabled, cloudStatus, signOut, deleteAccount, profile, joinCoach, leaveCoach, notify } = p;
  const [code, setCode] = useState("");
  const [shareFor, setShareFor] = useState<string | null>(null);
  const [sendCard, setSendCard] = useState<any>(null);
  const [nameDraft, setNameDraft] = useState(clientName);
  const coachName = profile.coachName || COACH_NAME;
  const isCoach = profile.role === "coach";
  const n = readLog().length;
  const bandName = goal?.band ? bandOf(goal.band)?.name : null;
  const setBy = goal?.setBy === "coach" ? (goal.coachName || coachName) : "you";
  return (
    <>
      <p className="label">You</p>
      <section className="card person">
        <span className="avatar">{(clientName || "?").slice(0, 1).toUpperCase()}</span>
        <label className="name-field">
          <span>Your name</span>
          <div className="name-row">
            <input value={nameDraft} placeholder="Your name" onChange={(e) => setNameDraft(e.target.value)} enterKeyHint="done"
              onKeyDown={(e) => { if (e.key === "Enter") { setClientName(nameDraft.trim()); (e.target as HTMLInputElement).blur(); } }} />
            <button className="pill pill-small pill-primary" disabled={nameDraft.trim() === clientName} onClick={() => { setClientName(nameDraft.trim()); notify("Name saved."); }}>Save</button>
          </div>
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
        <div className="card-top"><span>Where do you shop?</span><small>decides your starter foods</small></div>
        <div className="moments">
          {REGIONS.map((r) => (
            <button key={r.id} className={`pill pill-small ${p.region === r.id ? "pill-primary" : ""}`} onClick={() => p.setRegion(r.id)}>{r.name}</button>
          ))}
        </div>
      </section>
      <section className="card">
        <div className="card-top"><span>My week</span><small>decides which moments come first</small></div>
        <div className="moments">
          {RHYTHMS.map((r) => (
            <button key={r.id} className={`pill pill-small ${p.usual.includes(r.id) ? "pill-primary" : ""}`} onClick={() => p.setUsual(p.usual.includes(r.id) ? p.usual.filter((x) => x !== r.id) : [...p.usual, r.id])}>{r.name}</button>
          ))}
        </div>
      </section>
      <section className="card">
        <div className="card-top"><span>Your meals</span><span>{state.feedback.length}</span></div>
        {state.feedback.length === 0 && <small>Nothing yet. It starts after your first DaaM.</small>}
        {state.feedback.slice(0, 8).map((f) => (
          <div className="fb" key={f.id}>
            {f.photo && <img className="fb-photo" src={f.photo} alt="" />}
            <b>{f.taste}</b>
            <small>{f.meal.title}{f.moment && f.moment !== "regular" ? ` · ${MOMENTS.find((m) => m.id === f.moment)?.name}` : ""} · {new Date(f.createdAt).toLocaleDateString()}{f.notes ? ` · ${f.notes}` : ""}</small>
            {profile.coachId && (f.shared
              ? <small className="shared-tag">Shared: {({ look: "look at this", ok: "was this OK?", help: "help me next time" } as const)[f.shared.reason]}</small>
              : shareFor === f.id
                ? <div className="reasons">
                    {([["look", "Look at this"], ["ok", "Was this OK?"], ["help", "Help me next time"]] as const).map(([k, l]) => (
                      <button key={k} className="pill pill-small" onClick={() => { p.shareCard(f.id, k); setShareFor(null); }}>{l}</button>
                    ))}
                    <button className="link" onClick={() => setShareFor(null)}>Cancel</button>
                  </div>
                : <button className="link" onClick={() => setShareFor(f.id)}>Share with {coachName}</button>)}
            {isCoach && <button className="link" onClick={() => setSendCard(f)}>Send to a client</button>}
          </div>
        ))}
        {sendCard && <SendSheet card={sendCard} close={() => setSendCard(null)} {...p} />}
      </section>

      {cloudEnabled && (
        <>
          <p className="label">Account</p>
          <section className="card person">
            {user?.photo ? <img className="avatar avatar-img" src={user.photo} alt="" /> : <span className="avatar">{(user?.name || "?").slice(0, 1)}</span>}
            <div><b>{user ? user.name || user.email : "This phone only"}</b><small>{user ? user.email : "no account, data stays here"}</small></div>
          </section>
          {user && cloudStatus.text && (
            <p className={`small sync ${cloudStatus.ok ? "" : "sync-bad"}`}>{cloudStatus.text}{cloudStatus.at ? `, ${new Date(cloudStatus.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}.</p>
          )}
          <div className="button-row">
            {user && <button className="pill pill-small" onClick={signOut}>Sign out</button>}
            {user && <ConfirmButton className="pill pill-small" label="Delete my account and data" confirmLabel="Tap again to delete everything" onConfirm={deleteAccount} />}
            {!user && <button className="pill pill-small" onClick={() => { localStorage.removeItem("chefmealan-local-only"); location.reload(); }}>Sign in</button>}
          </div>
        </>
      )}
      {!isCoach && <p className="label">Your coach</p>}
      {isCoach ? null : cloudEnabled && user ? (
        profile.coachId ? (
          <section className="card person">
            <span className="avatar avatar-coach">{coachName.slice(0, 1)}</span>
            <div><b>{coachName}</b><small>sets your target and sees how it went</small></div>
            <ConfirmButton className="link link-danger" label="Leave" confirmLabel="Tap again to leave" onConfirm={leaveCoach} />
          </section>
        ) : (
          <section className="card">
            <small>Got a code from your coach? Enter it once. From then on your coach sees your cards and can set your goal.</small>
            <div className="button-row" style={{ marginTop: 8 }}>
              <input className="code-input" value={code} placeholder="Coach code" onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={8} />
              <button className="pill pill-small pill-primary" disabled={code.trim().length < 4} onClick={() => joinCoach(code)}>Join</button>
            </div>
          </section>
        )
      ) : (
        <section className="card person">
          <span className="avatar avatar-coach">{COACH_NAME.slice(0, 1)}</span>
          <div><b>{COACH_NAME}</b><small>sets your target and sees how it went</small></div>
        </section>
      )}

      {cloudEnabled && user && isCoach && (
        <>
          <p className="label">Coach area{p.newShared > 0 ? ` · ${p.newShared} new` : ""}</p>
          <CoachArea {...p} />
        </>
      )}
      {(!cloudEnabled || isCoach) && <p className="label">{cloudEnabled ? "Tools" : "Coach area"}</p>}
      {(!cloudEnabled || isCoach) && <section className="card">
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
      </section>}
      <p className="small center">{APP_NAME}, pilot. Barcode data from Open Food Facts, check the package.</p>
    </>
  );
}
