import { useState } from "react";
import { Plus, X } from "lucide-react";
import { avg7, isWeight, trendOf, verdictNote, withWeighIn, withoutWeighIn, VERDICT_WORDS, fmtKg, type WeighIn } from "../weight";
import { goalLabel } from "../goal";
import { ConfirmButton } from "./Confirm";

const dayName = (ymd: string) => new Date(`${ymd}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long" });
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

// Today: a quiet line under the plan (canvas board W1). Tap, type the weight, save. Never a judgement on one morning.
export function WeighInLine({ list, onSave, notify }: { list: WeighIn[] | undefined; onSave: (next: WeighIn[]) => void; notify: (m: string) => void }) {
  const [open, setOpen] = useState(false);
  const last = list?.length ? list[list.length - 1] : null;
  const avg = avg7(list);
  const [v, setV] = useState("");
  const save = () => {
    const kg = Number(v.replace(",", "."));
    if (!isWeight(kg)) return;
    const next = withWeighIn(list, kg);
    onSave(next); setOpen(false); setV("");
    notify(`Saved. Your 7-day average is ${avg7(next)!.toFixed(1)} kg.`);
  };
  if (!open) return (
    <button className="weigh-line" onClick={() => { setV(last ? String(last.kg) : ""); setOpen(true); }}>
      <span><b>Weigh in</b><small>{last ? `last: ${last.kg.toFixed(1)} kg, ${last.date === today() ? "today" : dayName(last.date)}${avg ? ` · 7-day average ${avg.toFixed(1)} kg` : ""}` : "any morning, before breakfast"}</small></span>
      <Plus size={20} />
    </button>
  );
  return (
    <div className="weigh-entry" role="group" aria-label="Weigh in">
      <div className="weigh-entry-top"><b>Weigh in</b><button className="link" onClick={() => setOpen(false)}>Cancel</button></div>
      <label className="weigh-input"><input inputMode="decimal" autoFocus aria-label="Your weight, kg" value={v} placeholder="75.0" onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} /><span>kg</span></label>
      <small>Today, {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</small>
      <button className="pill pill-primary pill-wide" disabled={!isWeight(Number(v.replace(",", ".")))} onClick={save}>Save</button>
    </div>
  );
}

// The 4-week chart: weigh-ins as dots, the 7-day average as a line, what the goal expects as a band from the first average.
function Chart({ t }: { t: ReturnType<typeof trendOf> }) {
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
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Your weight over the last 4 weeks">
      {ticks.map((v) => <g key={v}><line x1={pad} x2={W - 8} y1={y(v)} y2={y(v)} stroke="var(--line)" /><text x={2} y={y(v) + 4} fontSize={10} fill="var(--muted)">{v}</text></g>)}
      {t.averages.length > 0 && <polygon points={`${x(6)},${y(a0)} ${x(27)},${y(band[1])} ${x(27)},${y(band[0])}`} fill="var(--brand)" opacity={0.16} />}
      {t.points.map((p) => <circle key={p.day} cx={x(p.day)} cy={y(p.kg)} r={2.6} fill="var(--muted)" />)}
      {t.averages.length > 1 && <polyline fill="none" stroke="var(--brand)" strokeWidth={2.5} points={t.averages.map((a) => `${x(a.day)},${y(a.kg)}`).join(" ")} />}
      <text x={pad} y={H - 6} fontSize={10} fill="var(--muted)">4 weeks ago</text>
      <text x={W - 8} y={H - 6} fontSize={10} fill="var(--muted)" textAnchor="end">today</text>
    </svg>
  );
}

// Me › Goal and the coach's client page: the last 4 weeks (canvas board W2)
export function WeightTrend({ list, band, weightKg, trainingAge, onUpdateWeight, onRemove, coach = false }: { list: WeighIn[] | undefined; band: string; weightKg?: number; trainingAge?: string; onUpdateWeight?: (kg: number) => void; onRemove?: (date: string) => void; coach?: boolean }) {
  const [showAll, setShowAll] = useState(false);
  if (!list?.length) return coach ? null : <section className="card weight-trend"><b>The last 4 weeks</b><small className="muted">Weigh in on Today a few mornings a week, and the trend shows here: your 7-day average against what {goalLabel(band) || "your goal"} expects.</small></section>;
  const t = trendOf(list, band, weightKg ?? list[list.length - 1].kg, trainingAge);
  const note = verdictNote(band, t.verdict);
  const avg = avg7(list);
  const tone = t.verdict === "on track" ? "ok" : t.verdict === "too few" ? "quiet" : "warn";
  return (
    <section className="card weight-trend" aria-label="The last 4 weeks">
      <b>The last 4 weeks</b>
      <Chart t={t} />
      <div className="trend-legend"><span><i className="sw-dot" />{coach ? "weigh-ins" : "your weigh-ins"}</span><span><i className="sw-line" />7-day average</span><span><i className="sw-band" />expected for {goalLabel(band)}</span></div>
      {t.first !== null && t.last !== null && <div className="sheet-row"><small>7-day average</small><b>{t.first.toFixed(1)} → {t.last.toFixed(1)} kg</b></div>}
      {t.change !== null && <div className="sheet-row"><small>Change</small><b>{fmtKg(t.change)} in 3 weeks</b></div>}
      <div className="sheet-row"><small>Expected</small><b>{fmtKg(t.expected[0]).replace(" kg", "")} to {fmtKg(t.expected[1])}</b></div>
      <span className={`trend-chip ${tone}`}>{VERDICT_WORDS[t.verdict]}</span>
      <small className="muted">{t.count} weigh-in{t.count === 1 ? "" : "s"} in 4 weeks.</small>
      {note && <p className="trend-note">{note}{coach ? "" : " Your coach sees the same."}</p>}
      {!coach && onUpdateWeight && avg !== null && weightKg && Math.abs(avg - weightKg) >= 2 && (
        <button className="pill pill-small" onClick={() => onUpdateWeight(Math.round(avg))}>Update my numbers to {Math.round(avg)} kg</button>
      )}
      {!coach && onRemove && (
        <>
          <button className="link" aria-expanded={showAll} onClick={() => setShowAll((s) => !s)}>{showAll ? "Hide weigh-ins" : "Your weigh-ins"}</button>
          {showAll && <ul className="weigh-list">{[...list].reverse().slice(0, 28).map((w) => <li key={w.date}><span>{new Date(`${w.date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</span><b>{w.kg.toFixed(1)} kg</b><ConfirmButton className="link" label={<X size={14} />} ariaLabel={`Remove the weigh-in of ${w.date}`} confirmLabel="Remove" onConfirm={() => onRemove(w.date)} /></li>)}</ul>}
        </>
      )}
    </section>
  );
}
export { withoutWeighIn };
