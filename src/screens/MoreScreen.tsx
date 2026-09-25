import { Download, Upload, SlidersHorizontal } from "lucide-react";
import { fmt, fixed } from "../ui";
import { APP_NAME, COACH_NAME } from "../components/Mark";
import { exportLog, clearLog, readLog } from "../log";
import type { AppApi } from "./api";
import { ConfirmButton } from "../components/Confirm";

export function MoreScreen(p: AppApi) {
  const { state, services, exportData, importRef, setAccessOpen, setGoalsOpen, pdRef, coach, setCoach } = p;
  const n = readLog().length;
  return (
    <div className="more-screen">
      <section className="panel">
        <h2>Daily reference</h2>
        <p>{fmt(state.goals.calories, 0)} kcal · {fmt(state.goals.protein)} g protein · PD {fixed(pdRef)}</p>
        <p className="small">Set by {COACH_NAME}.</p>
        {coach && (
          <button className="primary" onClick={() => setGoalsOpen(true)}>
            <SlidersHorizontal size={16} /> Edit reference
          </button>
        )}
      </section>
      <section className="panel">
        <h2>Coach tools</h2>
        <label className="check">
          <input type="checkbox" checked={coach} onChange={(e) => setCoach(e.target.checked)} />
          I am the coach
        </label>
        {coach && (
          <>
            <p className="small">Pilot log: {n} {n === 1 ? "event" : "events"} on this device.</p>
            <div className="button-row">
              <button className="subtle" onClick={exportLog}><Download size={15} /> Export pilot log</button>
              <ConfirmButton className="subtle danger" label="Clear log" confirmLabel="Tap again to clear" onConfirm={clearLog} />
            </div>
            <div className="button-row">
              <button className="subtle" onClick={exportData}><Download size={15} /> Export backup</button>
              <button className="subtle" onClick={() => importRef.current?.click()}><Upload size={15} /> Import backup</button>
            </div>
            <p className="small">
              AI label reading: {services?.ai ? "on" : "off"} · Airtable: {services?.airtable ? "on" : "off"}
            </p>
            <button className="subtle" onClick={() => setAccessOpen(true)}>Server access</button>
          </>
        )}
      </section>
      <section className="panel">
        <h2>About</h2>
        <p className="small">
          {APP_NAME}, pilot. Barcode data from{" "}
          <a href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer">Open Food Facts</a>, check the package.
        </p>
      </section>
    </div>
  );
}
