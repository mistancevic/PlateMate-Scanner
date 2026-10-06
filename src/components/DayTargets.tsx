import { useEffect, useState } from "react";
import { DAY_TYPES, dayTargets, type DayType, type Personal } from "../personal";

// The four day targets when the day is followed: the usual day is the goal's calories; the others come from the rule
// and each can be set by hand. Protein and fat stay the same every day; carbs take the difference.
export function DayTargets({ avgKcal, personal, setPersonal }: { avgKcal: number | null; personal: Personal; setPersonal: (p: Personal) => void }) {
  const t = avgKcal ? dayTargets(avgKcal, personal) : null;
  const [draft, setDraft] = useState<Partial<Record<DayType, string>>>({});
  useEffect(() => { setDraft({}); }, [avgKcal]);
  if (!t) return <p className="small muted">Set the calories first; the four days follow from them.</p>;
  const save = (d: DayType, v: string) => {
    const n = Number(v);
    const next = { ...(personal.dayKcal ?? {}) };
    if (v.trim() === "" || !Number.isFinite(n) || n <= 0) delete next[d]; else next[d] = Math.round(n);
    setPersonal({ ...personal, dayKcal: next });
    setDraft((x) => ({ ...x, [d]: undefined }));
  };
  const anyOwn = DAY_TYPES.some((d) => d.id !== "normal" && t[d.id].own);
  return (
    <div className="day-targets" aria-label="Calories by day">
      {DAY_TYPES.map((d) => (
        <label key={d.id} className="day-target">
          <span>{d.name}{d.id === "normal" ? <small> · your goal</small> : t[d.id].own ? <small> · set by you</small> : <small> · by rule</small>}</span>
          {d.id === "normal"
            ? <b>{t.normal.kcal.toLocaleString("en")} kcal</b>
            : <span className="day-input"><input inputMode="numeric" aria-label={`${d.name}, kcal`} value={draft[d.id] ?? String(t[d.id].kcal)} onChange={(e) => setDraft((x) => ({ ...x, [d.id]: e.target.value }))} onBlur={(e) => save(d.id, e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} /> kcal</span>}
        </label>
      ))}
      <small className="muted">Protein and fat stay the same every day; carbs take the difference.{anyOwn ? " " : ""}{anyOwn && <button type="button" className="link" onClick={() => setPersonal({ ...personal, dayKcal: {} })}>Back to the rule</button>}</small>
    </div>
  );
}
