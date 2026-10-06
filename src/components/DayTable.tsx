import { useState } from "react";
import { DAY_TYPES, type DayNumbers, type DayType, type OwnDay, type Week } from "../personal";
import { density } from "../pilot";

// The four days as one table, the same wherever it appears: kcal, protein, fat, carbs per day; under each row where its
// numbers come from, How opens the arithmetic; under the table the week's average. Own numbers make kcal and protein typeable.
type Row = DayNumbers & { source?: "you" | "calculated" | "average" };
export function DayTable({ rows, avg, week, own, setOwn }: {
  rows: Record<DayType, Row>;
  avg: { kcal: number; protein: number };
  week: Week;
  own?: Partial<Record<DayType, OwnDay>>;
  setOwn?: (d: DayType, patch: OwnDay) => void;
}) {
  const [open, setOpen] = useState<DayType | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const mix = DAY_TYPES.filter((d) => week[d.id]).map((d) => `${week[d.id]} ${d.name.toLowerCase().replace("training, ", "").replace("rest, ", "")}`).join(", ");
  const cell = (d: DayType, field: "kcal" | "protein", value: number, width: number) => {
    const key = `${d}-${field}`, typed = own?.[d]?.[field];
    return (
      <input className="dt-input" style={{ width }} inputMode="numeric" aria-label={`${DAY_TYPES.find((x) => x.id === d)!.name}, ${field === "kcal" ? "kcal" : "protein in grams"}`}
        placeholder={String(value)} value={draft[key] ?? (typed ? String(typed) : "")}
        onChange={(e) => setDraft((x) => ({ ...x, [key]: e.target.value }))}
        onBlur={(e) => { const n = Number(e.target.value); setOwn!(d, { [field]: e.target.value.trim() === "" || !Number.isFinite(n) || n <= 0 ? undefined : Math.round(n) }); setDraft((x) => { const y = { ...x }; delete y[key]; return y; }); }}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} />
    );
  };
  return (
    <div className="day-table" aria-label="Your days">
      <div className="dt-head"><span>Day</span><span>kcal</span><span>protein</span><span>fat</span><span>carbs</span></div>
      {DAY_TYPES.map((d) => {
        const r = rows[d.id];
        const src = r.source === "you" ? "Set by you" : r.source === "average" ? "The average of the days you typed" : r.source === "calculated" && setOwn ? "Calculated, nothing typed" : null;
        return (
          <div className="dt-row" key={d.id}>
            <div className="dt-cells">
              <span className="dt-day"><b>{d.name}</b><small>{d.hint}</small></span>
              {setOwn ? cell(d.id, "kcal", r.kcal, 64) : <b className="dt-num">{r.kcal.toLocaleString("en")}</b>}
              {setOwn ? cell(d.id, "protein", r.protein, 46) : <span className="dt-num">{r.protein}</span>}
              <span className="dt-num muted">{r.fats}</span>
              <span className="dt-num muted">{r.carbs}</span>
            </div>
            <div className="dt-src">
              {src && <small>{src}</small>}
              {r.source !== "you" && <button type="button" className="link" aria-expanded={open === d.id} onClick={() => setOpen(open === d.id ? null : d.id)}>{open === d.id ? "Hide" : "How ›"}</button>}
            </div>
            {open === d.id && <div className="dt-how">{r.how.map((l, i) => <p key={i} className={i === r.how.length - 1 ? "dt-sum" : ""}>{l}</p>)}</div>}
          </div>
        );
      })}
      <p className="dt-avg">Your week averages {avg.kcal.toLocaleString("en")} kcal · PD {(density(avg.protein, avg.kcal) ?? 0).toFixed(1)}{mix ? ` · from My week: ${mix}` : ""}</p>
      <small className="muted">Protein and fat stay the same every day; carbs carry the difference. Sources: Mifflin et al. 1990; Compendium of Physical Activities 2024; FAO/WHO/UNU 2004.</small>
    </div>
  );
}
