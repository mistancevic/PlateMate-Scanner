// DT179 (0.3.23, board Stories127, Coach Milan 31 October 09:07 Go): busy times on Plan. A busy block shows as Busy, nothing
// more. Where it meets the plan, Plan asks once, under the meal or the training: one tap changes this date only; Keep it
// leaves it and the question goes. A meal at its own time for a date says so, with Back to the usual time; one moved in
// Google Calendar says that too. Buttons 44 px or more; labels 12 px or more.
import type { ReactNode } from "react";
import type { AppApi } from "../screens/api";
import type { Slot, DayRow } from "../slots";
import { toMin, slotsOf, withTimeOn } from "../slots";
import type { PlanDay } from "../plan";
import { blocksOn, asksOn, askKey, blockWords, clock, dayBefore, type Ask, type Block } from "../busy";
import { useBusy } from "../calendarSync";
import { lifestyleOf, getPersonal } from "../personal";
import { calendarNudge } from "./Calendar";

const WD = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long" });
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const rowMin = (r: DayRow) => toMin(r.kind === "slot" ? r.slot.time : r.time);

export function useDayBusy(p: AppApi, date: string, slots: Slot[], training: PlanDay | null, past: boolean) {
  const b = useBusy();
  const c = p.personal.calendar;
  const on = Boolean(c?.on && c.busy && !past && b);
  const blocks = on ? blocksOn(date, b!.list) : [];
  const asks = on ? asksOn(date, slots, training, blocks, c?.kept ?? []) : [];
  return { blocks, asks };
}

export function BusyRow({ b }: { b: Block }) {
  return (
    <div className="busy-row" role="note" aria-label={`Busy in your calendar, ${blockWords(b)}`}>
      <small className="busy-time">{clock(b.from)}<br />to {clock(b.to)}</small><small>Busy in your calendar</small>
    </div>
  );
}

// the busy rows that come before row i, and the ones after the last row
export function busyBefore(rows: DayRow[], blocks: Block[], i: number): ReactNode {
  const t = rowMin(rows[i]), prev = i > 0 ? rowMin(rows[i - 1]) : -1;
  return blocks.filter((b) => b.from <= t && b.from > prev).map((b) => <BusyRow key={`busy${b.from}`} b={b} />);
}
export const busyAfter = (rows: DayRow[], blocks: Block[]): ReactNode => {
  const last = rows.length ? rowMin(rows[rows.length - 1]) : -1;
  return blocks.filter((b) => b.from > last).map((b) => <BusyRow key={`busy${b.from}`} b={b} />);
};

export function AskCard({ p, date, a, training, cooked, title }: { p: AppApi; date: string; a: Ask; training: PlanDay | null; cooked: boolean; title?: string }) {
  const c = p.personal.calendar ?? { on: true };
  const keep = () => { const now = getPersonal(); p.setPersonal({ ...now, calendar: { ...(now.calendar ?? c), kept: [...(now.calendar?.kept ?? []), askKey(date, a)] } }); };
  const moveTo = (slotId: string, to: string, name: string) => {
    const now = getPersonal(), usual = slotsOf(lifestyleOf(now)).find((s) => s.id === slotId)?.time ?? to;
    p.setPersonal({ ...now, timesOn: withTimeOn(now.timesOn, date, slotId, to, usual) });
    p.notify(`${name} is at ${to} on ${WD(date)}. ${to === usual ? "" : `Back to ${usual} is under it on Plan.`}`.trim());
  };
  const btn = (label: string, run: () => void, primary = false) => <button key={label} type="button" className={`pill pill-small ${primary ? "pill-primary" : ""}`} onClick={run}>{label}</button>;
  let text = "", buttons: ReactNode[] = [];
  if (a.kind === "meal") {
    text = `${a.name} at ${a.time} is in a busy block, ${blockWords(a.block)}. Move it for ${WD(date)}?`;
    buttons = [a.before && btn(a.before, () => moveTo(a.slotId, a.before!, a.name), true), a.after && btn(a.after, () => moveTo(a.slotId, a.after!, a.name), !a.before), btn(`Keep ${a.time}`, keep)].filter(Boolean) as ReactNode[];
  } else if (a.kind === "late") {
    const prev = dayBefore(date);
    text = `Busy until ${clock(a.block.to)}. ${a.name} at ${a.time} leaves ${a.free ? `${a.free} minutes` : "no time"} to cook. A quick ${lower(a.name)}${cooked ? `, or cook on ${WD(prev)} and warm it up` : ""}?`;
    buttons = [
      btn(`Quick ${lower(a.name)} ideas`, () => p.openOut({ q: `A quick ${lower(a.name)} for ${WD(date)}: I am busy until ${clock(a.block.to)} and eat at ${a.time}, so I have about ${a.free} minutes to cook.` }), true),
      cooked && btn(`Cook ahead on ${WD(prev)}`, () => { const now = getPersonal(); p.setPersonal({ ...now, calendar: { ...(now.calendar ?? c), ahead: { ...(now.calendar?.ahead ?? {}), [`${date}|${a.slotId}`]: prev }, kept: [...(now.calendar?.kept ?? []), askKey(date, a)] } }); calendarNudge(); p.notify(`${title ?? a.name} is cooked on ${WD(prev)}, for ${WD(date)}.`); }),
      btn("Keep it", keep),
    ].filter(Boolean) as ReactNode[];
  } else if (a.kind === "carry") {
    text = `Booked from ${blockWords(a.block)}. Take ${lower(a.name)} along?`;
    buttons = [btn(`${a.name} to carry`, () => p.openOut({ q: `A ${lower(a.name)} to take along on ${WD(date)}: I am out from ${blockWords(a.block)}. Something I can make the evening before and carry.` }), true), btn("Keep it", keep)];
  } else {
    text = `Training at ${a.time} is in a busy block, ${blockWords(a.block)}. Move it for ${WD(date)}?`;
    const d = new Date(`${date}T12:00:00`);
    buttons = [
      a.move && btn(`Move to ${a.move}`, () => { if (training) { p.setDated(d, { ...training, at: a.move! }); p.notify(`Training is at ${a.move} on ${WD(date)}, this date only.`); } }, true),
      btn("Rest day", () => { if (training) { p.setDated(d, { work: training.work, study: training.study, kind: "rest" }); p.notify(`${WD(date)} is a rest day, this date only.`); } }, !a.move),
      btn("Keep it", keep),
    ].filter(Boolean) as ReactNode[];
  }
  return (
    <div className="busy-ask" role="group" aria-label="From your calendar">
      <small>{text}</small>
      <div className="busy-ask-buttons">{buttons}</div>
    </div>
  );
}

// a meal at its own time for this date: Back to the usual time; moved in Google Calendar says so; cooked ahead says so
export function SlotNotes({ p, date, slot }: { p: AppApi; date: string; slot: Slot }) {
  const c = p.personal.calendar;
  const own = p.personal.timesOn?.[date]?.[slot.id];
  const usual = slotsOf(lifestyleOf(p.personal)).find((s) => s.id === slot.id)?.time;
  const from = c?.moved?.[`${date}|${slot.id}`];
  const ahead = c?.ahead?.[`${date}|${slot.id}`];
  if (!(own && usual && own !== usual) && !ahead) return null;
  const back = () => { const now = getPersonal(); const moved = { ...(now.calendar?.moved ?? {}) }; delete moved[`${date}|${slot.id}`];
    p.setPersonal({ ...now, timesOn: withTimeOn(now.timesOn, date, slot.id, null, usual!), ...(now.calendar ? { calendar: { ...now.calendar, moved } } : {}) }); };
  const notAhead = () => { const now = getPersonal(); const ah = { ...(now.calendar?.ahead ?? {}) }; delete ah[`${date}|${slot.id}`]; p.setPersonal({ ...now, calendar: { ...(now.calendar ?? { on: true }), ahead: ah } }); calendarNudge(); };
  return (
    <div className="slot-notes">
      {own && usual && own !== usual && <div><small>{from ? `Moved in Google Calendar, from ${from}` : `At ${own} on this date only`}</small><button type="button" className="link" onClick={back}>Back to {usual}</button></div>}
      {ahead && <div><small>Cooked ahead on {WD(ahead)}</small><button type="button" className="link" onClick={notAhead}>Cook it on the day</button></div>}
    </div>
  );
}
