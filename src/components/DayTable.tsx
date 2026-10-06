import { useRef, useState } from "react";
import { DAY_TYPES, type DayNumbers, type DayType, type OwnDay, type Week } from "../personal";
import { density } from "../pilot";
import { addsUp, type Analysis, type Finding } from "../analysis";
import { loadOf, planShort, type PlanDay } from "../plan";

// The four days, the same wherever they appear. Read-only: one table, kcal, protein, fat, carbs, How under each
// calculated row. Own numbers: each day a block with four fields; what was filled says so; a row that does not add up
// says what it comes to; Target analysis findings sit under the day they are about, week findings under the week's line.
type Row = DayNumbers & { source?: "you" | "calculated" | "average" };
type Field = "kcal" | "protein" | "fats" | "carbs";
const LABEL: Record<Field, string> = { kcal: "kcal", protein: "protein g", fats: "fat g", carbs: "carbs g" };

export function DayTable({ rows, avg, week, own, setOwn, analysis, open, keep, weekdays }: {
  rows: Record<DayType, Row>;
  // calculated from a Weekly plan: the seven days themselves, each with its own activity and numbers
  weekdays?: ({ name: string; day: PlanDay } & DayNumbers)[] | null;
  avg: { kcal: number; protein: number };
  week: Week;
  own?: Partial<Record<DayType, OwnDay>>;
  setOwn?: (d: DayType, patch: OwnDay) => void;
  analysis?: Analysis;
  open?: (f: Finding) => boolean; // a finding not yet kept on purpose at this value
  keep?: (f: Finding) => void;
}) {
  const [how, setHow] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const refs = useRef<Record<string, HTMLInputElement | null>>({});
  const mix = DAY_TYPES.filter((d) => week[d.id]).map((d) => `${week[d.id]} ${d.name.toLowerCase().replace("training, ", "").replace("rest, ", "")}`).join(", ");
  const avgLine = <p className="dt-avg">Your week averages {avg.kcal.toLocaleString("en")} kcal · PD {(density(avg.protein, avg.kcal) ?? 0).toFixed(1)}{mix ? ` · ${mix}` : ""}</p>;
  const howBlock = (d: string, r: Row) => how === d && <div className="dt-how">{r.how.map((l, i) => <p key={i} className={i === r.how.length - 1 ? "dt-sum" : ""}>{l}</p>)}</div>;
  const howLink = (d: string) => <button type="button" className="link" aria-expanded={how === d} onClick={() => setHow(how === d ? null : d)}>{how === d ? "Hide" : "How ›"}</button>;

  if (!setOwn && weekdays) {
    return (
      <div className="day-table" aria-label="Your days">
        <div className="dt-head"><span>Day</span><span>kcal</span><span>protein</span><span>fat</span><span>carbs</span></div>
        {weekdays.map((w) => (
          <div className="dt-row" key={w.name}>
            <div className="dt-cells">
              <span className="dt-day"><b><i className={`load-dot load-${loadOf(w.day)}`} />{w.name}</b><small>{planShort(w.day)}</small></span>
              <b className="dt-num">{w.kcal.toLocaleString("en")}</b>
              <span className="dt-num">{w.protein}</span>
              <span className="dt-num muted">{w.fats}</span>
              <span className="dt-num muted">{w.carbs}</span>
            </div>
            <div className="dt-src">{howLink(w.name)}</div>
            {howBlock(w.name, w)}
          </div>
        ))}
        {avgLine}
        <small className="muted">Protein and fat stay the same every day; carbs carry the difference. The days come from your Weekly plan. Sources: Mifflin et al. 1990; Compendium of Physical Activities 2024; FAO/WHO/UNU 2004.</small>
      </div>
    );
  }
  if (!setOwn) {
    return (
      <div className="day-table" aria-label="Your days">
        <div className="dt-head"><span>Day</span><span>kcal</span><span>protein</span><span>fat</span><span>carbs</span></div>
        {DAY_TYPES.map((d) => {
          const r = rows[d.id];
          return (
            <div className="dt-row" key={d.id}>
              <div className="dt-cells">
                <span className="dt-day"><b>{d.name}</b><small>{d.hint}</small></span>
                <b className="dt-num">{r.kcal.toLocaleString("en")}</b>
                <span className="dt-num">{r.protein}</span>
                <span className="dt-num muted">{r.fats}</span>
                <span className="dt-num muted">{r.carbs}</span>
              </div>
              <div className="dt-src">{r.source === "you" ? <small>Set by you</small> : howLink(d.id)}</div>
              {howBlock(d.id, r)}
            </div>
          );
        })}
        {avgLine}
        <small className="muted">Protein and fat stay the same every day; carbs carry the difference. Sources: Mifflin et al. 1990; Compendium of Physical Activities 2024; FAO/WHO/UNU 2004.</small>
      </div>
    );
  }

  const findings = analysis?.findings ?? [];
  const isOpen = (f: Finding) => (open ? open(f) : true);
  const focus = (f: Finding) => { const day = f.day ?? "passive"; const el = refs.current[`${day}-${f.field}`]; el?.focus(); el?.select(); };
  const card = (f: Finding) => isOpen(f) ? (
    <div className="finding" key={f.id} role="note">
      <b>{f.title}</b>
      <span>{f.body}</span>
      <small>{f.source}</small>
      <div className="finding-acts">
        <button type="button" className="pill pill-small" onClick={() => keep?.(f)}>Keep, on purpose</button>
        <button type="button" className="pill pill-small pill-primary" onClick={() => focus(f)}>Change it</button>
      </div>
    </div>
  ) : <p className="finding-kept" key={f.id}>Kept on purpose: {f.title.toLowerCase()}</p>;
  const input = (d: DayType, field: Field, shown: number, warn: boolean) => {
    const key = `${d}-${field}`, typed = own?.[d]?.[field];
    return (
      <label className="dt-field" key={field}>
        <input ref={(el) => { refs.current[key] = el; }} className={`dt-input ${typed ? "typed" : ""} ${warn ? "warn" : ""}`} inputMode="numeric"
          aria-label={`${DAY_TYPES.find((x) => x.id === d)!.name}, ${field === "kcal" ? "kcal" : `${field === "fats" ? "fat" : field} in grams`}`}
          placeholder={shown ? String(shown) : ""} value={draft[key] ?? (typed ? String(typed) : "")}
          onChange={(e) => setDraft((x) => ({ ...x, [key]: e.target.value }))}
          onBlur={(e) => { const n = Number(e.target.value); setOwn(d, { [field]: e.target.value.trim() === "" || !Number.isFinite(n) || n <= 0 ? undefined : Math.round(n) }); setDraft((x) => { const y = { ...x }; delete y[key]; return y; }); }}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} />
        <small>{LABEL[field]}</small>
      </label>
    );
  };
  return (
    <div className="day-blocks" aria-label="Your days">
      {DAY_TYPES.map((d) => {
        const r = rows[d.id], o = own?.[d.id] ?? {};
        const typedAll = (["kcal", "protein", "fats", "carbs"] as Field[]).every((f) => (o[f] ?? 0) > 0);
        const sum = typedAll ? addsUp(r) : null;
        const fills = [!o.protein && "protein from your other days", !o.fats && "fat 30 % of the average day", !o.carbs && "carbs the rest"].filter(Boolean) as string[];
        const filled = o.kcal && fills.length ? (fills.length === 2 && !o.fats && !o.carbs ? "Fat and carbs filled: fat 30 % of the average day, carbs the rest" : `Filled: ${fills.join(", ")}`) : null;
        const dayFindings = findings.filter((f) => f.day === d.id);
        const edge = dayFindings.some(isOpen) || sum !== null;
        return (
          <div className={`dt-block ${edge ? "edge" : ""}`} key={d.id}>
            <div className="dt-block-head"><b>{d.name}</b><small>{d.hint}</small></div>
            <div className="dt-fields">{(["kcal", "protein", "fats", "carbs"] as Field[]).map((f) => input(d.id, f, r[f], sum !== null))}</div>
            <div className="dt-src">
              {sum !== null ? <small className="warn">These come to {sum.toLocaleString("en")}, not {r.kcal.toLocaleString("en")}: {Math.abs(sum - r.kcal)} kcal apart</small>
                : o.kcal ? <small>{filled ?? "Set by you"}</small>
                : <><small>{r.source === "calculated" ? "Calculated, nothing typed" : "Nothing typed: the average of the days you typed"}</small>{howLink(d.id)}</>}
            </div>
            {howBlock(d.id, r)}
            {dayFindings.map(card)}
          </div>
        );
      })}
      <div className="dt-week">
        {avgLine}
        {findings.filter((f) => f.day === null).map(card)}
        {analysis && analysis.inRange.length > 0 && <p className="in-range">In range: {analysis.inRange.join(" · ")}</p>}
      </div>
    </div>
  );
}

// The same findings for Every day the same: under the four fields; Change it puts the cursor in the field it's about.
export function FindingList({ analysis, open, keep }: { analysis: Analysis; open: (f: Finding) => boolean; keep: (f: Finding) => void }) {
  return (
    <div className="dt-week">
      {analysis.findings.map((f) => open(f) ? (
        <div className="finding" key={f.id} role="note">
          <b>{f.title}</b><span>{f.body}</span><small>{f.source}</small>
          <div className="finding-acts">
            <button type="button" className="pill pill-small" onClick={() => keep(f)}>Keep, on purpose</button>
            <button type="button" className="pill pill-small pill-primary" onClick={() => { const el = document.getElementById(`own-${f.field}`) as HTMLInputElement | null; el?.focus(); el?.select(); }}>Change it</button>
          </div>
        </div>
      ) : <p className="finding-kept" key={f.id}>Kept on purpose: {f.title.toLowerCase()}</p>)}
      {analysis.inRange.length > 0 && <p className="in-range">In range: {analysis.inRange.join(" · ")}</p>}
    </div>
  );
}
