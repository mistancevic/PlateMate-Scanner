// DT161 (0.3.3, canvas Page 2, board Stories113; Coach Milan 29 October 19:11 to 19:30 Go): Carbs and fat, a step in the goal
// setup after the protein card. How the person likes to eat moves the energy left after protein between carbs and fat; we ask
// a preference, never a belief. The card shows the fat in the 20 to 35 % range like the protein card shows protein, what the
// carbs get, and names the days carbs fall below 45 %; Very low carb says where it sits against both and never asks to change.
import { useState } from "react";
import { dayList } from "../explorerDay";
import { SPLITS, FAT_RANGE, CARB_RANGE, DAY_TYPES, splitOf, lowCarbsOf, type Calc, type CarbsFat, type Personal, type DayNumbers } from "../personal";

const pct = (part: number, kcal: number) => (kcal > 0 ? Math.round((part * 100) / kcal) : 0);
// the person's week as days with a name: the Training week's weekdays, else each kind of day the week holds
export function weekDaysOf(c: Calc): (DayNumbers & { name: string })[] {
  if (c.weekdays?.length) return c.weekdays.map((w) => ({ ...w, name: w.name }));
  const held = DAY_TYPES.filter((t) => (c.week[t.id] ?? 0) > 0);
  return (held.length ? held : DAY_TYPES.slice(0, 1)).map((t) => ({ ...c.days[t.id], name: `${t.name} days` }));
}
// the days whose carbs fall below 45 % of the day's energy, as one phrase; "" when none
export function lowCarbDays(days: (DayNumbers & { name: string })[]): string {
  const low = days.filter((d) => d.kcal > 0 && (d.carbs * 4) / d.kcal < CARB_RANGE.lo);
  if (!low.length) return "";
  if (low.length === days.length) return days.length === 1 ? "Your carbs are" : "On every day your carbs are";
  const names = [...new Set(low.map((d) => d.name))];
  return `On ${dayList(names, days.length, days.map((d) => d.name))} your carbs are`;
}

export function CarbsFatStep({ c, d, band, n, set }: { c: Calc; d: Personal; band: string; n: number; set: (cf: CarbsFat) => void }) {
  const split = splitOf(d, band), low = lowCarbsOf(d, band);
  const [typed, setTyped] = useState(d.carbsFat?.carbs ? String(d.carbsFat.carbs) : "");
  const days = weekDaysOf(c);
  const lo = Math.round((c.kcal * FAT_RANGE.lo) / 9), hi = Math.round((c.kcal * FAT_RANGE.hi) / 9);
  const carbs = days.map((x) => x.carbs), fats = days.map((x) => x.fats);
  const below = lowCarbDays(days);
  return (
    <div className="carbs-fat">
      <b className="section-title">{n}. Carbs and fat</b>
      <p className="small muted">How you like to eat. Protein stays set by your goal; this moves the rest between carbs and fat. You can change it at any time.</p>
      <div className="activity-list" role="group" aria-label="Carbs and fat">
        {SPLITS.map((x) => <button type="button" key={x.id} className={`activity ${split === x.id ? "on" : ""}`} aria-pressed={split === x.id} onClick={() => set({ split: x.id, ...(x.id === "low" && Number(typed) > 0 ? { carbs: Number(typed) } : {}) })}><b>{x.name}</b><small>{x.hint}</small></button>)}
      </div>
      {split === "low" ? (
        <section className="card protein-card fat-card">
          <label className="field"><span>Your carbs a day, g</span>
            <input id="low-carbs" inputMode="numeric" value={typed} placeholder="type your carbs" onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, "").slice(0, 3); setTyped(v); set({ split: "low", ...(Number(v) > 0 ? { carbs: Number(v) } : {}) }); }} />
          </label>
          {low === null ? <p className="protein-line">Type the carbs you keep to; fat takes the rest of each day. Until then your days stay Balanced.</p> : (
            <>
              <div className="protein-top"><b>{Math.min(...fats) === Math.max(...fats) ? `${fats[0]} g` : `${Math.min(...fats)} to ${Math.max(...fats)} g`}</b><span>of fat a day</span></div>
              <p className="protein-line">Your carbs stay at {low} g every day; fat takes the rest{Math.min(...fats) === Math.max(...fats) ? "" : " and goes up and down with your training"}. That is {(() => { const s = days.map((x) => pct(x.fats * 9, x.kcal)); const a = Math.min(...s), b = Math.max(...s); return a === b ? `${a} %` : `${a} to ${b} %`; })()} of your energy from fat, {days.some((x) => (x.fats * 9) / x.kcal > FAT_RANGE.hi) ? "above" : "inside"} the 20 to 35 % range, and carbs {days.some((x) => (x.carbs * 4) / x.kcal < CARB_RANGE.lo) ? "below" : "inside"} the 45 to 60 % range (EFSA). Your choice: the Explorer shows where you are against both.</p>
            </>
          )}
        </section>
      ) : (
        <section className="card protein-card fat-card">
          <div className="protein-top"><b>{c.fats} g</b><span>of fat a day</span></div>
          <div className="protein-bar" aria-hidden="true"><span className="protein-mark" style={{ left: `${Math.min(100, Math.max(0, ((c.fats - lo) / Math.max(1, hi - lo)) * 100))}%` }} /></div>
          <div className="protein-ends"><span>{lo} g</span><span>{hi} g</span></div>
          <p className="protein-line">The range is 20 to 35 % of your energy (EFSA), {lo} to {hi} g on your week's {c.kcal.toLocaleString("en")} kcal. Yours is {pct(c.fats * 9, c.kcal)} %: {SPLITS.find((x) => x.id === split)!.name}. Carbs take the rest, {Math.min(...carbs) === Math.max(...carbs) ? `${carbs[0]} g` : `${Math.min(...carbs)} to ${Math.max(...carbs)} g, up and down with your training`}.{below ? ` ${below} below 45 % of the energy, the bottom of EFSA's range.` : ""}</p>
        </section>
      )}
    </div>
  );
}
