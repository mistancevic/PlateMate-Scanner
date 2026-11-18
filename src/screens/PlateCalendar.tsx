// The Plate's calendar (0.3.157, DT308.1, DT308.4 to DT308.6, DT308.9 and DT308.11; boards Stories236, 237, 241 to 243;
// Go 18 November 11:14): the days on top, that day's meals under them with their time and state. One tap on a meal picks
// the meal and the day together. It opens behind the meal line's pencil, under Plan it and Ate it, and under Save on Eat.
// A plain function the Plate screen calls while it draws, as the meal line is: the day shown and everything else stay in
// the Plate screen and are handed in, so nothing here can reset.
import { Fragment, type ReactNode } from "react";
import { w, mealName } from "../words";
import { getLang, locOf } from "../lang";
import { calDays, calRows, type CalMode, type CalRow } from "../plateCal";
import type { Slot } from "../slots";

export type CalInfo = { slots: Slot[]; eaten: Record<string, string[]>; planned: Record<string, { title: string; skipped?: boolean }> | undefined };
export type PlateCalIn = {
  mode: CalMode;
  day: string; setDay: (d: string) => void;
  more: boolean; setMore: (b: boolean) => void;
  now: Date; today: string;
  infoOf: (date: string) => CalInfo;
  // the guess, marked: only when you say Ate it
  marked?: { date: string; id: string | null } | null;
  photoAt?: Date | null;
  title?: string;
  // only this day can be picked (Save on Eat: the meal you just cooked is eaten today)
  only?: string;
  onPick: (date: string, row: CalRow) => void;
  // one question under a row (a meal that already holds something)
  under?: { id: string | null; node: ReactNode } | null;
  // behind the pencil only (board DT308, frames DT308.1 b and c; Coach Milan 18 November): the last row, Just looking,
  // nothing is counted. It does what Just looking did in 0.3.156: nothing is sized or counted, a photo's plate is kept as Served
  looking?: { on: boolean; tap: () => void };
};
const dayLabel = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(locOf(getLang()), { weekday: "short", day: "numeric" }).replace(",", "");
export const calStateText = (r: CalRow): string => {
  const word = r.state === "eaten" ? w("cal.eaten") : r.state === "notEaten" ? w("cal.notEaten") : r.state === "next" ? w("cal.next") : r.state === "now" ? w("cal.now")
    : r.state === "planned" ? w("cal.planned", { title: r.holds ?? "" }) : r.state === "free" ? w("cal.free") : r.state === "at" ? w("cal.at", { time: r.time }) : "";
  return r.state === "at" || !r.time ? word : word ? `${r.time} · ${word}` : r.time;
};

export function plateCal(given: PlateCalIn) {
  const { mode, day, setDay, more, setMore, now, today, infoOf, marked, photoAt, title, only, onPick, under, looking } = given;
  const days = calDays(today, day), info = infoOf(day);
  const rows = calRows({ date: day, now, slots: info.slots, eaten: info.eaten, planned: info.planned, mode, photoAt });
  const dayOff = (d: string) => (only ? d !== only : mode === "ate" ? d > today : mode === "plan" ? d < today : false);
  return (
    <div className={`pcal pcal-${mode}`}>
      {title && <b className="pcal-q">{title}</b>}
      <div className="pcal-days" role="tablist" aria-label={w("cal.days")}>
        {days.map((d) => <button key={d} type="button" role="tab" className={`pcal-day${d === day ? " on" : ""}`} aria-selected={d === day} disabled={dayOff(d)} onClick={() => { setDay(d); setMore(false); }}>{d === today ? w("cal.dayToday", { day: dayLabel(d) }) : dayLabel(d)}</button>)}
        <button type="button" className={`pcal-day pcal-more${more ? " on" : ""}`} aria-pressed={more} disabled={!!only} onClick={() => setMore(!more)}>{w("cal.more")}</button>
      </div>
      {more && <input className="search pcal-date" type="date" aria-label={w("make.anotherDay")} value={days.slice(0, 4).includes(day) ? "" : day} min={mode === "plan" ? today : undefined} max={mode === "ate" ? today : undefined}
        onChange={(e) => { const v = e.target.value; if (/^\d{4}-\d{2}-\d{2}$/.test(v) && !dayOff(v)) setDay(v); }} />}
      <div className="pcal-rows" role="group" aria-label={w("cal.meals")}>
        {rows.map((r) => { const on = !!marked && marked.date === day && marked.id === r.id; return (
          <Fragment key={r.id ?? "snack-off"}>
            <button type="button" className={`pcal-row${on ? " on" : ""}${r.state === "eaten" ? " done" : ""}`} aria-pressed={on} disabled={r.off} onClick={() => onPick(day, r)}>
              <b>{on && <span aria-hidden="true">✓ </span>}{mealName(r.name)}</b><span>{calStateText(r)}</span>
            </button>
            {under && under.id === r.id && under.node}
          </Fragment>); })}
        {looking && <button type="button" className={`pcal-row pcal-looking${looking.on ? " on" : ""}`} aria-pressed={looking.on} onClick={looking.tap}><b>{looking.on && <span aria-hidden="true">✓ </span>}{w("plate.exploring")}</b><span>{w("cal.nothingCounted")}</span></button>}
      </div>
    </div>
  );
}
