import { KINDS, INTENSITIES, WHENS, WHENS_KID, MINUTES_KID, LENGTHS, lengthOf, START_MIN, ADULT_KINDS, KID_KINDS, SPORTS, PE, type PlanDay, type Kind, type Weekdays } from "../plan";
import { Zones } from "./Zones";

// One day's settings, the same on the Weekly plan, a dated week and Change today's plan.
// Adults: the kind of day as Lifestyle allows it (Release B: Work day, Study day, Day off; nothing to pick when At home),
// sport in class on a study day when the studies have it, then one activity, how hard, when, how long. School kids (under 18): school or no school, sport at school,
// then one activity after school; a club training or a match asks which sport. A rest day folds the last ones away.
// Since 7 October 2026 (canvas board T3), for adults: Rest reads No training, Walk is gone (walking is in the steps),
// How hard is Light, Moderate or Hard with its zones, and How long is a range from 15 minutes.
export function DayEditor({ value, onChange, workHint, minor = false, weekdays = "work", peOn = false }: { value: PlanDay; onChange: (d: PlanDay) => void; workHint?: string; minor?: boolean; weekdays?: Weekdays; peOn?: boolean }) {
  const set = (patch: Partial<PlanDay>) => onChange({ ...value, ...patch });
  const pickKind = (k: Kind) => set(k === "rest"
    ? { kind: k, intensity: undefined, when: undefined, minutes: undefined, sport: undefined }
    : { kind: k, intensity: value.intensity ?? (k === "match" ? "hard" : "moderate"), minutes: value.minutes ?? (minor ? 90 : START_MIN.moderate), sport: k === "club" || k === "match" ? value.sport ?? "football" : undefined });
  const kind = KINDS.find((k) => k.id === value.kind)!;
  // a Walk day saved before still shows, so it can be changed
  const ids = minor ? KID_KINDS : ADULT_KINDS.includes(value.kind) ? ADULT_KINDS : [...ADULT_KINDS, value.kind];
  const kinds = ids.map((id) => KINDS.find((k) => k.id === id)!);
  const kindName = (k: Kind) => (k === "rest" && !minor ? "No training" : KINDS.find((x) => x.id === k)!.name);
  const whens = minor ? WHENS_KID : WHENS;
  const Chip = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button type="button" className={`choice ${on ? "on" : ""}`} aria-pressed={on} onClick={onClick}>{children}</button>
  );
  return (
    <div className="day-editor">
      {minor ? (
        <div className="setting">
          <small className="setting-name">School</small>
          <div className="chip-row">
            <Chip on={value.work} onClick={() => set({ work: true })}>School day</Chip>
            <Chip on={!value.work} onClick={() => set({ work: false, pe: false })}>No school</Chip>
          </div>
          {workHint && <small className="setting-hint">{workHint}</small>}
        </div>
      ) : weekdays !== "home" && (
        <div className="setting">
          <small className="setting-name">Your day</small>
          <div className="chip-row">
            {weekdays !== "study" && <Chip on={value.work && (weekdays === "work" || !value.study)} onClick={() => set({ work: true, study: false, pe: false })}>Work day</Chip>}
            {weekdays !== "work" && <Chip on={value.work && (weekdays === "study" || !!value.study)} onClick={() => set({ work: true, study: true })}>Study day</Chip>}
            <Chip on={!value.work} onClick={() => set({ work: false, study: false, pe: false })}>Day off</Chip>
          </div>
          {workHint && <small className="setting-hint">{workHint}</small>}
        </div>
      )}
      {!minor && peOn && value.work && (weekdays === "study" || (weekdays === "both" && value.study)) && (
        <div className="setting">
          <small className="setting-name">Sport in class</small>
          <div className="chip-row">
            <Chip on={!!value.pe} onClick={() => set({ pe: true, study: true })}>Yes</Chip>
            <Chip on={!value.pe} onClick={() => set({ pe: false })}>No</Chip>
          </div>
          <small className="setting-hint">Counted as {PE.minutes} minutes of moderate activity.</small>
        </div>
      )}
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
          {kinds.map((k) => <Chip key={k.id} on={value.kind === k.id} onClick={() => pickKind(k.id)}>{kindName(k.id)}</Chip>)}
        </div>
        <small className="setting-hint">{minor ? (value.kind === "rest" ? "Nothing planned. A walk or yoga is an activity; pick it instead." : `${kind.name}: ${kind.hint}.`) : value.kind === "rest" ? "No training. Your work and your steps still count." : `${kind.name}: ${kind.hint}. Walking isn't here: it's in your steps, on every day.`}</small>
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
            {minor ? (
              <>
                <div className="chip-row">
                  {INTENSITIES.map((x) => <Chip key={x.id} on={value.intensity === x.id} onClick={() => set({ intensity: x.id })}>{x.name}</Chip>)}
                </div>
                <small className="setting-hint">Light means you could chat while doing it. Hard means you couldn't.</small>
              </>
            ) : (
              <div className="activity-list" role="group" aria-label="How hard">
                {INTENSITIES.map((x) => <button type="button" key={x.id} className={`activity hard-pick ${(value.intensity ?? "easy") === x.id ? "on" : ""}`} aria-pressed={(value.intensity ?? "easy") === x.id} onClick={() => set({ intensity: x.id })}><b>{x.name}</b><Zones level={x.id} /></button>)}
              </div>
            )}
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
              {minor
                ? MINUTES_KID.map((m) => <Chip key={m} on={(value.minutes ?? 90) === m} onClick={() => set({ minutes: m })}>{m} min</Chip>)
                : LENGTHS.map((r) => <Chip key={r.id} on={lengthOf(value.minutes ?? START_MIN.moderate).id === r.id} onClick={() => set({ minutes: r.mid })}>{r.name}</Chip>)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
