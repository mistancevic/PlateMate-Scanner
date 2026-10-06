import { KINDS, INTENSITIES, WHENS, MINUTES, type PlanDay, type Kind } from "../plan";

// One day's settings, the same on the Weekly plan and on Change today's plan: work or off, one activity, how hard, when,
// how long. A rest day folds the last three away.
export function DayEditor({ value, onChange, workHint }: { value: PlanDay; onChange: (d: PlanDay) => void; workHint?: string }) {
  const set = (patch: Partial<PlanDay>) => onChange({ ...value, ...patch });
  const pickKind = (k: Kind) => set(k === "rest" ? { kind: k, intensity: undefined, when: undefined, minutes: undefined } : { kind: k, intensity: value.intensity ?? "moderate", minutes: value.minutes ?? 60 });
  const kind = KINDS.find((k) => k.id === value.kind)!;
  return (
    <div className="day-editor">
      <div className="setting">
        <small className="setting-name">Work</small>
        <div className="chip-row">
          <button type="button" className={`pill pill-small ${value.work ? "pill-primary" : ""}`} aria-pressed={value.work} onClick={() => set({ work: true })}>Work day</button>
          <button type="button" className={`pill pill-small ${!value.work ? "pill-primary" : ""}`} aria-pressed={!value.work} onClick={() => set({ work: false })}>Off</button>
        </div>
        {workHint && <small className="setting-hint">{workHint}</small>}
      </div>
      <div className="setting">
        <small className="setting-name">Activity</small>
        <div className="chip-row">
          {KINDS.map((k) => <button type="button" key={k.id} className={`pill pill-small ${value.kind === k.id ? "pill-primary" : ""}`} aria-pressed={value.kind === k.id} onClick={() => pickKind(k.id)}>{k.name}</button>)}
        </div>
        <small className="setting-hint">{value.kind === "rest" ? "Nothing planned. A walk or yoga is an activity; pick it instead." : `${kind.name}: ${kind.hint}.`}</small>
      </div>
      {value.kind !== "rest" && (
        <>
          <div className="setting">
            <small className="setting-name">How hard</small>
            <div className="chip-row">
              {INTENSITIES.map((x) => <button type="button" key={x.id} className={`pill pill-small ${value.intensity === x.id ? "pill-primary" : ""}`} aria-pressed={value.intensity === x.id} onClick={() => set({ intensity: x.id })}>{x.name}</button>)}
            </div>
            <small className="setting-hint">Easy: you could talk through it. Hard: you couldn't.</small>
          </div>
          <div className="setting">
            <small className="setting-name">When</small>
            <div className="chip-row">
              {WHENS.map((x) => <button type="button" key={x.id} className={`pill pill-small ${value.when === x.id ? "pill-primary" : ""}`} aria-pressed={value.when === x.id} onClick={() => set({ when: value.when === x.id ? undefined : x.id })}>{x.name}</button>)}
            </div>
          </div>
          <div className="setting">
            <small className="setting-name">How long</small>
            <div className="chip-row">
              {MINUTES.map((m) => <button type="button" key={m} className={`pill pill-small ${(value.minutes ?? 60) === m ? "pill-primary" : ""}`} aria-pressed={(value.minutes ?? 60) === m} onClick={() => set({ minutes: m })}>{m === 90 ? "90 min+" : `${m} min`}</button>)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
