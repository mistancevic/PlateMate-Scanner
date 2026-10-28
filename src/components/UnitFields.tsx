import { useEffect, useState } from "react";
import { kgToLb, lbToKg, ftIn, parseFtIn, METRIC, type Units } from "../units";

// Body weight and height asked in the units chosen (0.2.18, board UN, UN2); the account keeps kg and cm.
const num = (v: string) => (v.trim() === "" ? undefined : Number(v.replace(",", ".")) || undefined);
const kgShown = (kg: number | undefined, unit: Units["weight"]) => (kg === undefined ? "" : unit === "lb" ? String(Math.round(kgToLb(kg) * 10) / 10) : String(kg));
const cmShown = (cm: number | undefined, unit: Units["height"]) => { if (cm === undefined) return ""; if (unit === "cm") return String(cm); const h = ftIn(cm); return `${h.ft} ft ${h.inch} in`; };

export function WeightField({ kg, unit = METRIC.weight, onKg, onDone, label = "Weight", placeholder }: { kg: number | undefined; unit?: Units["weight"]; onKg: (kg: number | undefined) => void; onDone?: () => void; label?: string; placeholder?: string }) {
  const [t, setT] = useState(kgShown(kg, unit));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setT(kgShown(kg, unit)), [unit]);
  return (
    <label className="field"><span>{label}, {unit}</span>
      <input inputMode="decimal" value={t} placeholder={placeholder ?? (unit === "lb" ? "enter lb" : "enter kg")} onChange={(e) => {
        setT(e.target.value); const v = num(e.target.value);
        onKg(v === undefined ? undefined : unit === "lb" ? Math.round(lbToKg(v) * 100) / 100 : v);
      }} onBlur={onDone} />
    </label>
  );
}

export function HeightField({ cm, unit = METRIC.height, onCm, onDone }: { cm: number | undefined; unit?: Units["height"]; onCm: (cm: number | undefined) => void; onDone?: () => void }) {
  const [t, setT] = useState(cmShown(cm, unit));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setT(cmShown(cm, unit)), [unit]);
  if (unit === "cm") return <label className="field"><span>Height, cm</span><input inputMode="numeric" value={t} placeholder="enter cm" onChange={(e) => { setT(e.target.value); onCm(num(e.target.value)); }} onBlur={onDone} /></label>;
  return (
    <label className="field"><span>Height, ft and in</span>
      <input value={t} placeholder="enter ft and in" onChange={(e) => {
        setT(e.target.value);
        if (!e.target.value.trim()) return onCm(undefined);
        const v = parseFtIn(e.target.value); if (v !== null) onCm(v);
      }} onBlur={() => { setT(cmShown(cm, unit)); onDone?.(); }} />
    </label>
  );
}
