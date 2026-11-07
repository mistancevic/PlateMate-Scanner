// DT161 (0.3.3, canvas Page 2, board Stories113; Coach Milan 29 October 19:11 to 19:30 Go): Carbs and fat, a step in the goal
// setup after the protein card. How the person likes to eat moves the energy left after protein between carbs and fat; we ask
// a preference, never a belief. The card shows the fat in the 20 to 35 % range like the protein card shows protein, what the
// carbs get, and names the days carbs fall below 45 %; Very low carb says where it sits against both and never asks to change.
import { numLocale, w } from "../words";
import { useState } from "react";
import { dayList } from "../explorerDay";
import { optWord } from "../optWords";
import { SPLITS, FAT_RANGE, CARB_RANGE, DAY_TYPES, splitOf, lowCarbsOf, type Calc, type CarbsFat, type Personal, type DayNumbers } from "../personal";

const pct = (part: number, kcal: number) => (kcal > 0 ? Math.round((part * 100) / kcal) : 0);
// the person's week as days with a name: the Training week's weekdays, else each kind of day the week holds
export function weekDaysOf(c: Calc): (DayNumbers & { name: string })[] {
  if (c.weekdays?.length) return c.weekdays.map((wd) => ({ ...wd, name: wd.name }));
  const held = DAY_TYPES.filter((t) => (c.week[t.id] ?? 0) > 0);
  return (held.length ? held : DAY_TYPES.slice(0, 1)).map((t) => ({ ...c.days[t.id], name: w("carbsfat.kindDays", { name: t.name }) }));
}
// the days whose carbs fall below 45 % of the day's energy, as one phrase; "" when none
export function lowCarbDays(days: (DayNumbers & { name: string })[]): string {
  const low = days.filter((d) => d.kcal > 0 && (d.carbs * 4) / d.kcal < CARB_RANGE.lo);
  if (!low.length) return "";
  if (low.length === days.length) return days.length === 1 ? w("carbsfat.yourCarbsAre") : w("carbsfat.onEveryDayYourCarbs");
  const names = [...new Set(low.map((d) => d.name))];
  return w("carbsfat.onDaysCarbsAre", { days: dayList(names, days.length, days.map((d) => d.name)) });
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
      <b className="section-title">{w("carbsfat.stepTitle", { n })}</b>
      <p className="small muted">{w("carbsfat.howYouLikeToEat")}</p>
      <div className="activity-list" role="group" aria-label={w("carbsfat.carbsAndFat")}>
        {SPLITS.map((x) => <button type="button" key={x.id} className={`activity ${split === x.id ? "on" : ""}`} aria-pressed={split === x.id} onClick={() => set({ split: x.id, ...(x.id === "low" && Number(typed) > 0 ? { carbs: Number(typed) } : {}) })}><b>{optWord(x.name)}</b><small>{x.hint}</small></button>)}
      </div>
      {split === "low" ? (
        <section className="card protein-card fat-card">
          <label className="field"><span>{w("carbsfat.yourCarbsADayG")}</span>
            <input id="low-carbs" inputMode="numeric" value={typed} placeholder={w("carbsfat.typeYourCarbs")} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, "").slice(0, 3); setTyped(v); set({ split: "low", ...(Number(v) > 0 ? { carbs: Number(v) } : {}) }); }} />
          </label>
          {low === null ? <p className="protein-line">{w("carbsfat.typeTheCarbsYouKeep")}</p> : (
            <>
              <div className="protein-top"><b>{Math.min(...fats) === Math.max(...fats) ? `${fats[0]} g` : w("carbsfat.gRange", { a: Math.min(...fats), b: Math.max(...fats) })}</b><span>{w("carbsfat.ofFatADay")}</span></div>
              <p className="protein-line">{w(Math.min(...fats) === Math.max(...fats) ? "carbsfat.lowStay" : "carbsfat.lowStayMoves", { low })} {w("carbsfat.lowThatIs", { pct: (() => { const s = days.map((x) => pct(x.fats * 9, x.kcal)); const a = Math.min(...s), b = Math.max(...s); return a === b ? `${a} %` : w("carbsfat.pctRange", { a, b }); })(), fat: w(days.some((x) => (x.fats * 9) / x.kcal > FAT_RANGE.hi) ? "carbsfat.above" : "carbsfat.inside"), carbs: w(days.some((x) => (x.carbs * 4) / x.kcal < CARB_RANGE.lo) ? "carbsfat.below" : "carbsfat.inside") })}</p>
            </>
          )}
        </section>
      ) : (
        <section className="card protein-card fat-card">
          <div className="protein-top"><b>{c.fats} g</b><span>{w("carbsfat.ofFatADay")}</span></div>
          <div className="protein-bar" aria-hidden="true"><span className="protein-mark" style={{ left: `${Math.min(100, Math.max(0, ((c.fats - lo) / Math.max(1, hi - lo)) * 100))}%` }} /></div>
          <div className="protein-ends"><span>{lo} g</span><span>{hi} g</span></div>
          <p className="protein-line">{w("carbsfat.fatRangeLine", { lo, hi, kcal: c.kcal.toLocaleString(numLocale()), pct: pct(c.fats * 9, c.kcal), split: optWord(SPLITS.find((x) => x.id === split)!.name), carbs: Math.min(...carbs) === Math.max(...carbs) ? `${carbs[0]} g` : w("carbsfat.carbsMove", { a: Math.min(...carbs), b: Math.max(...carbs) }) })}{below ? ` ${w("carbsfat.belowBottom", { days: below })}` : ""}</p>
        </section>
      )}
    </div>
  );
}
