import { numLocale, w, wn, dec } from "../words";
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
// the resting burn's source, from the formula the calculation names (canvas board TW, F1)
const restSource = (line = "") => (/Schofield/.test(line) ? w("daytable.schofieldFaoWhoUnu") : /Katch/.test(line) ? w("daytable.katchAndMcardle") : w("daytable.mifflinEtAl"));
// From your data (0.2.7, board FT, FT5): the days' line about the measured burn names the 14 days as the source
const dataSource = (how: string[] = []) => { const m = how.join(" ").match(/measured burn, [\d,]+ kcal a day \((\d+ \w+) to (\d+ \w+)\)/); return m ? w("daytable.ownDays", { from: m[1], to: m[2] }) : null; };
const LABEL: Record<Field, string> = { get kcal() { return w("daytable.kcal"); }, get protein() { return w("daytable.proteinG"); }, get fats() { return w("daytable.fatG"); }, get carbs() { return w("daytable.carbsG"); } };

export function DayTable({ rows, avg, week, own, setOwn, analysis, open, keep, weekdays, note }: {
  note?: string;
  rows: Record<DayType, Row>;
  // calculated from a Training week: the seven days themselves, each with its own activity and numbers
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
  // plain English (7 October 2026): "Your week averages 2,950 kcal at PD 6.1, with 4 training days and 3 without."
  const trainingDays = 7 - (week.passive || 0);
  const avgV = { kcal: avg.kcal.toLocaleString(numLocale()), pd: dec(density(avg.protein, avg.kcal) ?? 0, 1) };
  const avgLine = <p className="dt-avg">{mix ? wn("daytable.avgWith", trainingDays, { ...avgV, rest: 7 - trainingDays }) : w("daytable.avg", avgV)}{note ? ` ${note}` : ""}</p>;
  const howBlock = (d: string, r: Row) => how === d && <div className="dt-how">{r.how.map((l, i) => <p key={i} className={i === r.how.length - 1 ? "dt-sum" : ""}>{l}</p>)}</div>;
  const howLink = (d: string) => <button type="button" className="link" aria-expanded={how === d} onClick={() => setHow(how === d ? null : d)}>{how === d ? w("daytable.hide") : w("daytable.how")}</button>;

  if (!setOwn && weekdays) {
    return (
      <div className="day-table" aria-label={w("daytable.yourDays")}>
        <div className="dt-head"><span>{w("daytable.day")}</span><span>{w("daytable.kcal")}</span><span>{w("daytable.protein")}</span><span>{w("daytable.fat")}</span><span>{w("daytable.carbs")}</span></div>
        {weekdays.map((wd) => (
          <div className="dt-row" key={wd.name}>
            <div className="dt-cells">
              {/* DT144 (0.3.38, board Stories146): each day's PD, the number Today shows on that day */}
              <span className="dt-day"><b><i className={`load-dot load-${loadOf(wd.day)}`} />{wd.name}</b><small>{planShort(wd.day)}</small><b className="dt-pd">{w("daytable.pd", { pd: dec(density(wd.protein, wd.kcal) ?? 0, 1) })}</b></span>
              <b className="dt-num">{wd.kcal.toLocaleString(numLocale())}</b>
              <span className="dt-num">{wd.protein}</span>
              <span className="dt-num muted">{wd.fats}</span>
              <span className="dt-num muted">{wd.carbs}</span>
            </div>
            <div className="dt-src">{howLink(wd.name)}</div>
            {howBlock(wd.name, wd)}
          </div>
        ))}
        {avgLine}
        <small className="muted">{w("daytable.sourcesWeek", { source: dataSource(weekdays[0]?.how) ?? restSource(weekdays[0]?.how[0]) })}</small>
      </div>
    );
  }
  if (!setOwn) {
    return (
      <div className="day-table" aria-label={w("daytable.yourDays")}>
        <div className="dt-head"><span>{w("daytable.day")}</span><span>{w("daytable.kcal")}</span><span>{w("daytable.protein")}</span><span>{w("daytable.fat")}</span><span>{w("daytable.carbs")}</span></div>
        {DAY_TYPES.map((d) => {
          const r = rows[d.id];
          return (
            <div className="dt-row" key={d.id}>
              <div className="dt-cells">
                <span className="dt-day"><b>{d.name}</b><small>{d.hint}</small></span>
                <b className="dt-num">{r.kcal.toLocaleString(numLocale())}</b>
                <span className="dt-num">{r.protein}</span>
                <span className="dt-num muted">{r.fats}</span>
                <span className="dt-num muted">{r.carbs}</span>
              </div>
              <div className="dt-src">{r.source === "you" ? <small>{w("daytable.setByYou")}</small> : howLink(d.id)}</div>
              {howBlock(d.id, r)}
            </div>
          );
        })}
        {avgLine}
        <small className="muted">{w("daytable.sourcesDays")}</small>
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
        <button type="button" className="pill pill-small" onClick={() => keep?.(f)}>{w("daytable.keepOnPurpose")}</button>
        <button type="button" className="pill pill-small pill-primary" onClick={() => focus(f)}>{w("daytable.changeIt")}</button>
      </div>
    </div>
  ) : <p className="finding-kept" key={f.id}>{w("daytable.keptOnPurpose", { title: f.title.toLowerCase() })}</p>;
  const input = (d: DayType, field: Field, shown: number, warn: boolean) => {
    const key = `${d}-${field}`, typed = own?.[d]?.[field];
    return (
      <label className="dt-field" key={field}>
        <input ref={(el) => { refs.current[key] = el; }} className={`dt-input ${typed ? "typed" : ""} ${warn ? "warn" : ""}`} inputMode="numeric"
          aria-label={`${DAY_TYPES.find((x) => x.id === d)!.name}, ${field === "kcal" ? w("daytable.kcal") : w("daytable.inGrams", { field: w(field === "fats" ? "daytable.fat" : field === "protein" ? "daytable.protein" : "daytable.carbs") })}`}
          placeholder={shown ? `≈${shown}` : w("daytable.enter")} value={draft[key] ?? (typed ? String(typed) : "")}
          onChange={(e) => setDraft((x) => ({ ...x, [key]: e.target.value }))}
          onBlur={(e) => { const n = Number(e.target.value); setOwn(d, { [field]: e.target.value.trim() === "" || !Number.isFinite(n) || n <= 0 ? undefined : Math.round(n) }); setDraft((x) => { const y = { ...x }; delete y[key]; return y; }); }}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} />
        <small>{LABEL[field]}</small>
      </label>
    );
  };
  return (
    <div className="day-blocks" aria-label={w("daytable.yourDays")}>
      {DAY_TYPES.map((d) => {
        const r = rows[d.id], o = own?.[d.id] ?? {};
        const typedAll = (["kcal", "protein", "fats", "carbs"] as Field[]).every((f) => (o[f] ?? 0) > 0);
        const sum = typedAll ? addsUp(r) : null;
        const fills = [!o.protein && w("daytable.fillProtein"), !o.fats && w("daytable.fillFat"), !o.carbs && w("daytable.fillCarbs")].filter(Boolean) as string[];
        const filled = o.kcal && fills.length ? (fills.length === 2 && !o.fats && !o.carbs ? w("daytable.fatAndCarbsFilledFat") : w("daytable.filled", { list: fills.join(", ") })) : null;
        const dayFindings = findings.filter((f) => f.day === d.id);
        const edge = dayFindings.some(isOpen) || sum !== null;
        return (
          <div className={`dt-block ${edge ? "edge" : ""}`} key={d.id}>
            <div className="dt-block-head"><b>{d.name}</b><small>{d.hint}</small></div>
            <div className="dt-fields">{(["kcal", "protein", "fats", "carbs"] as Field[]).map((f) => input(d.id, f, r[f], sum !== null))}</div>
            <div className="dt-src">
              {sum !== null ? <small className="warn">{w("daytable.comesTo", { sum: sum.toLocaleString(numLocale()), kcal: r.kcal.toLocaleString(numLocale()), apart: Math.abs(sum - r.kcal) })}</small>
                : o.kcal ? <small>{filled ?? w("daytable.setByYou")}</small>
                : <><small>{r.source === "calculated" ? w("daytable.calculatedNothingTyped") : w("daytable.nothingTypedTheAverageOf")}</small>{howLink(d.id)}</>}
            </div>
            {howBlock(d.id, r)}
            {dayFindings.map(card)}
          </div>
        );
      })}
      <div className="dt-week">
        {avgLine}
        {findings.filter((f) => f.day === null).map(card)}
        {analysis && analysis.inRange.length > 0 && <p className="in-range">{w("daytable.inRange", { list: analysis.inRange.join(" · ") })}</p>}
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
            <button type="button" className="pill pill-small" onClick={() => keep(f)}>{w("daytable.keepOnPurpose")}</button>
            <button type="button" className="pill pill-small pill-primary" onClick={() => { const el = document.getElementById(`own-${f.field}`) as HTMLInputElement | null; el?.focus(); el?.select(); }}>{w("daytable.changeIt")}</button>
          </div>
        </div>
      ) : <p className="finding-kept" key={f.id}>{w("daytable.keptOnPurpose", { title: f.title.toLowerCase() })}</p>)}
      {analysis.inRange.length > 0 && <p className="in-range">{w("daytable.inRange", { list: analysis.inRange.join(" · ") })}</p>}
    </div>
  );
}
