import { dec, w, wn, dateText } from "../words";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { avg7, isWeight, trendOf, verdictNote, withWeighIn, withoutWeighIn, VERDICT_WORDS, fmtKg, type WeighIn , fmtPct } from "../weight";
import { goalName } from "../goal";
import { ConfirmButton } from "./Confirm";
import { wText, wIn, wFrom, wUnit } from "../units";

const dayName = (ymd: string) => dateText(new Date(`${ymd}T12:00:00`), { weekday: "long" });
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

// Today: a quiet line under the plan (canvas board W1). Tap, type the weight, save. Never a judgement on one morning.
export function WeighInLine({ list, onSave, notify }: { list: WeighIn[] | undefined; onSave: (next: WeighIn[]) => void; notify: (m: string) => void }) {
  const [open, setOpen] = useState(false);
  const last = list?.length ? list[list.length - 1] : null;
  const avg = avg7(list);
  const [v, setV] = useState("");
  const save = () => {
    const kg = wFrom(Number(v.replace(",", ".")));
    if (!isWeight(kg)) return;
    const next = withWeighIn(list, kg, new Date(), wUnit() === "lb");
    onSave(next); setOpen(false); setV("");
    notify(w("weight.savedAvg", { avg: wText(avg7(next)!) }));
  };
  if (!open) return (
    <button className="weigh-line" onClick={() => { setV(last ? wIn(last.kg).toFixed(1) : ""); setOpen(true); }}>
      <span><b>{w("weight.weighIn")}</b><small>{last ? `${w("weight.last", { kg: wText(last.kg), day: last.date === today() ? w("weight.today") : dayName(last.date) })}${avg ? ` · ${w("weight.avg7Value", { kg: wText(avg) })}` : ""}` : w("weight.anyMorningBeforeBreakfast")}</small></span>
      <Plus size={20} />
    </button>
  );
  return (
    <div className="weigh-entry" role="group" aria-label={w("weight.weighIn")}>
      <div className="weigh-entry-top"><b>{w("weight.weighIn")}</b><button className="link" onClick={() => setOpen(false)}>{w("weight.cancel")}</button></div>
      <label className="weigh-input"><input inputMode="decimal" autoFocus aria-label={w("weight.yourWeightUnit", { unit: wUnit() })} value={v} placeholder={wUnit() === "lb" ? "165.0" : "75.0"} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} /><span>{wUnit()}</span></label>
      <small>{w("weight.todayDate", { date: dateText(new Date(), { weekday: "long", day: "numeric", month: "long" }) })}</small>
      <button className="pill pill-primary pill-wide" disabled={!isWeight(wFrom(Number(v.replace(",", "."))))} onClick={save}>{w("weight.save")}</button>
    </div>
  );
}

// The 4-week chart: weigh-ins as dots, the 7-day average as a line, what the goal expects as a band from the first average.
function Chart({ t, unit = "" }: { t: ReturnType<typeof trendOf>; unit?: string }) {
  const W = 320, H = 150, pad = 28;
  const all = [...t.points.map((p) => p.kg), ...t.averages.map((a) => a.kg)];
  if (!all.length) return null;
  const a0 = t.averages[0]?.kg ?? t.points[0].kg;
  const band = [a0 + t.expected[0], a0 + t.expected[1]];
  const lo = Math.floor(Math.min(...all, ...band) - 0.3), hi = Math.ceil(Math.max(...all, ...band) + 0.3);
  const x = (d: number) => pad + (d * (W - pad - 8)) / 27;
  const y = (v: number) => 8 + ((hi - v) * (H - 30)) / (hi - lo || 1);
  const ticks = [lo, (lo + hi) / 2, hi].map((v) => Math.round(v * 10) / 10);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={w("weight.yourWeightOverTheLast")}>
      {ticks.map((v) => <g key={v}><line x1={pad} x2={W - 8} y1={y(v)} y2={y(v)} stroke="var(--line)" /><text x={2} y={y(v) + 4} fontSize={10} fill="var(--muted)">{v}{unit}</text></g>)}
      {t.averages.length > 0 && <polygon points={`${x(6)},${y(a0)} ${x(27)},${y(band[1])} ${x(27)},${y(band[0])}`} fill="var(--brand)" opacity={0.16} />}
      {t.points.map((p) => <circle key={p.day} cx={x(p.day)} cy={y(p.kg)} r={2.6} fill="var(--muted)" />)}
      {t.averages.length > 1 && <polyline fill="none" stroke="var(--brand)" strokeWidth={2.5} points={t.averages.map((a) => `${x(a.day)},${y(a.kg)}`).join(" ")} />}
      <text x={pad} y={H - 6} fontSize={10} fill="var(--muted)">{w("weight.weeksAgo4")}</text>
      <text x={W - 8} y={H - 6} fontSize={10} fill="var(--muted)" textAnchor="end">{w("weight.today")}</text>
    </svg>
  );
}

// Me › Goal and the coach's client page: the last 4 weeks (canvas board W2)
export function WeightTrend({ list, band, weightKg, trainingAge, onUpdateWeight, onRemove, coach = false }: { list: WeighIn[] | undefined; band: string; weightKg?: number; trainingAge?: string; onUpdateWeight?: (kg: number) => void; onRemove?: (date: string) => void; coach?: boolean }) {
  const [showAll, setShowAll] = useState(false);
  if (!list?.length) return coach ? null : <section className="card weight-trend"><b>{w("weight.theLastWeeks")}</b><small className="muted">{goalName(band) ? w("weight.weighHint", { goal: goalName(band) }) : w("weight.weighHintNoGoal")}</small></section>;
  const t = trendOf(list, band, weightKg ?? list[list.length - 1].kg, trainingAge);
  const note = verdictNote(band, t.verdict);
  const avg = avg7(list);
  const tone = t.verdict === "on track" ? "ok" : t.verdict === "too few" ? "quiet" : "warn";
  return (
    <section className="card weight-trend" aria-label={w("weight.theLastWeeks")}>
      <b>{w("weight.theLastWeeks")}</b>
      <Chart t={t} />
      <div className="trend-legend"><span><i className="sw-dot" />{coach ? w("weight.weighIns") : w("weight.yourWeighInsLow")}</span><span><i className="sw-line" />{w("weight.avg7")}</span><span><i className="sw-band" />{w("weight.expectedFor", { goal: goalName(band) })}</span></div>
      {t.first !== null && t.last !== null && <div className="sheet-row"><small>{w("weight.avg7")}</small><b>{dec(wIn(t.first), 1)} → {wText(t.last)}</b></div>}
      {t.change !== null && <div className="sheet-row"><small>{w("weight.change")}</small><b>{w("weight.in3Weeks", { change: fmtKg(t.change) })}</b></div>}
      <div className="sheet-row"><small>{w("weight.expected")}</small><b>{w("weight.rangeTo", { a: fmtKg(t.expected[0]).replace(` ${wUnit()}`, ""), b: fmtKg(t.expected[1]) })}</b></div>
      <span className={`trend-chip ${tone}`}>{VERDICT_WORDS[t.verdict]}</span>
      <small className="muted">{wn("weight.countIn4Weeks", t.count)}</small>
      {note && <p className="trend-note">{note}{coach ? "" : ` ${w("weight.coachSeesSame")}`}</p>}
      {!coach && onUpdateWeight && avg !== null && weightKg && Math.abs(avg - weightKg) >= 2 && (
        <button className="pill pill-small" onClick={() => onUpdateWeight(wFrom(Math.round(wIn(avg))))}>{w("weight.updateTo", { n: Math.round(wIn(avg)), unit: wUnit() })}</button>
      )}
      {!coach && onRemove && (
        <>
          <button className="link" aria-expanded={showAll} onClick={() => setShowAll((s) => !s)}>{showAll ? w("weight.hideWeighIns") : w("weight.yourWeighIns")}</button>
          {showAll && <ul className="weigh-list">{[...list].reverse().slice(0, 28).map((wi) => <li key={wi.date}><span>{dateText(new Date(`${wi.date}T12:00:00`), { weekday: "short", day: "numeric", month: "short" })}</span><b>{wText(wi.kg)}</b><ConfirmButton className="link" label={<X size={14} />} ariaLabel={w("weight.removeOf", { date: wi.date })} confirmLabel={w("weight.remove")} onConfirm={() => onRemove(wi.date)} /></li>)}</ul>}
        </>
      )}
    </section>
  );
}
// DT172 (0.3.14, privacy finding 14, option a): the coach's view when the person shares no body data: the same 4 weeks and
// verdict, as change against their weight in percent, worked out on their own phone; no kilogram
export function WeightTrendPct({ t, band, at }: { t: ReturnType<typeof trendOf>; band: string; at: string | null }) {
  const note = verdictNote(band, t.verdict);
  const tone = t.verdict === "on track" ? "ok" : t.verdict === "too few" ? "quiet" : "warn";
  return (
    <section className="card weight-trend" aria-label={w("weight.theLastWeeks")}>
      <b>{w("weight.theLastWeeks")}</b>
      <Chart t={t} unit=" %" />
      <div className="trend-legend"><span><i className="sw-dot" />{w("weight.weighIns")}</span><span><i className="sw-line" />{w("weight.avg7")}</span><span><i className="sw-band" />{w("weight.expectedFor", { goal: goalName(band) })}</span></div>
      {t.change !== null && <div className="sheet-row"><small>{w("weight.change")}</small><b>{w("weight.in3Weeks", { change: fmtPct(t.change) })}</b></div>}
      <div className="sheet-row"><small>{w("weight.expected")}</small><b>{w("weight.rangeTo", { a: fmtPct(t.expected[0]).replace(" %", ""), b: fmtPct(t.expected[1]) })}</b></div>
      <span className={`trend-chip ${tone}`}>{VERDICT_WORDS[t.verdict]}</span>
      <small className="muted">{at ? wn("weight.countPctAsOf", t.count, { date: dateText(new Date(`${at}T12:00:00`), { day: "numeric", month: "short" }) }) : wn("weight.countPct", t.count)}</small>
      {note && <p className="trend-note">{note}</p>}
    </section>
  );
}
export { withoutWeighIn };
