import { KINDS, INTENSITIES, WHENS, WHENS_KID, MINUTES, MINUTES_KID, ADULT_KINDS, KID_KINDS, SPORTS, PE, type PlanDay, type Kind } from "../plan";

// One day's settings, the same on the Weekly plan, a dated week and Change today's plan.
// Adults: work or off, one activity, how hard, when, how long. School kids (under 18): school or no school, sport at school,
// then one activity after school; a club training or a match asks which sport. A rest day folds the last ones away.
export function DayEditor({ value, onChange, workHint, minor = false }: { value: PlanDay; onChange: (d: PlanDay) => void; workHint?: string; minor?: boolean }) {
  const set = (patch: Partial<PlanDay>) => onChange({ ...value, ...patch });
  const pickKind = (k: Kind) => set(k === "rest"
    ? { kind: k, intensity: undefined, when: undefined, minutes: undefined, sport: undefined }
    : { kind: k, intensity: value.intensity ?? (k === "match" ? "hard" : "moderate"), minutes: value.minutes ?? (minor ? 90 : 60), sport: k === "club" || k === "match" ? value.sport ?? "football" : undefined });
  const kind = KINDS.find((k) => k.id === value.kind)!;
  const kinds = (minor ? KID_KINDS : ADULT_KINDS).map((id) => KINDS.find((k) => k.id === id)!);
  const whens = minor ? WHENS_KID : WHENS, minutes = minor ? MINUTES_KID : MINUTES;
  const Chip = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button type="button" className={`choice ${on ? "on" : ""}`} aria-pressed={on} onClick={onClick}>{children}</button>
  );
  return (
    <div className="day-editor">
      <div className="setting">
        <small className="setting-name">{minor ? "School" : "Work"}</small>
        <div className="chip-row">
          <Chip on={value.work} onClick={() => set({ work: true })}>{minor ? "School day" : "Work day"}</Chip>
          <Chip on={!value.work} onClick={() => set({ work: false, pe: false })}>{minor ? "No school" : "Off"}</Chip>
        </div>
        {workHint && <small className="setting-hint">{workHint}</small>}
      </div>
      {minor && value.work && (
        <div className="setting">
          <small className="setting-name">Sport at school</small>
          <div className="chip-row">
            <Chip on={!!value.pe} onClick={() => set({ pe: true })}>Yes</Chip>
            <Chip on={!value.pe} onClick={() => set({ pe: false })}>No</Chip>
          </div>
          <small className="setting-hint">Counted as {PE.minutes} minutes of moderate activity.</small>
        </div>
      )}
      <div className="setting">
        <small className="setting-name">{minor ? "After school" : "Activity"}</small>
        <div className="chip-row">
          {kinds.map((k) => <Chip key={k.id} on={value.kind === k.id} onClick={() => pickKind(k.id)}>{k.name}</Chip>)}
        </div>
        <small className="setting-hint">{value.kind === "rest" ? "Nothing planned. A walk or yoga is an activity; pick it instead." : `${kind.name}: ${kind.hint}.`}</small>
      </div>
      {value.kind !== "rest" && (
        <>
          {(value.kind === "club" || value.kind === "match") && (
            <div className="setting">
              <small className="setting-name">Which sport</small>
              <div className="chip-row">
                {SPORTS.map((x) => <Chip key={x.id} on={(value.sport ?? "football") === x.id} onClick={() => set({ sport: x.id })}>{x.name}</Chip>)}
              </div>
            </div>
          )}
          <div className="setting">
            <small className="setting-name">How hard</small>
            <div className="chip-row">
              {INTENSITIES.map((x) => <Chip key={x.id} on={value.intensity === x.id} onClick={() => set({ intensity: x.id })}>{x.name}</Chip>)}
            </div>
            <small className="setting-hint">Easy means you could chat while doing it. Hard means you couldn't.</small>
          </div>
          <div className="setting">
            <small className="setting-name">When</small>
            <div className="chip-row">
              {whens.map((x) => <Chip key={x.id} on={value.when === x.id} onClick={() => set({ when: value.when === x.id ? undefined : x.id })}>{x.name}</Chip>)}
            </div>
          </div>
          <div className="setting">
            <small className="setting-name">How long</small>
            <div className="chip-row">
              {minutes.map((m) => <Chip key={m} on={(value.minutes ?? (minor ? 90 : 60)) === m} onClick={() => set({ minutes: m })}>{m} min</Chip>)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
