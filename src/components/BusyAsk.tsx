// DT179 (0.3.23, board Stories127, Coach Milan 31 October 09:07 Go): busy times on Plan. A busy block shows as Busy, nothing
// more. Where it meets the plan, Plan asks once, under the meal or the training: one tap changes this date only; Keep it
// leaves it and the question goes. A meal at its own time for a date says so, with Back to the usual time; one moved in
// Google Calendar says that too. Buttons 44 px or more; labels 12 px or more.
import { w, mealV, dateV, type Val } from "../words";
import type { Lang } from "../lang";
import { ChefLine } from "./ChefLine";
import { say } from "../chefScript";
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
// DT243: the weekday in a line's own language (WD stays for Chef Mealan's lines); Cap starts a sentence with it
const WDV = (date: string): Val => dateV(new Date(`${date}T12:00:00`), { weekday: "long" }, "en-GB");
const Cap = (v: Val): Val => (l) => { const t = (v as (x: Lang) => string | null)(l); return t && t.charAt(0).toUpperCase() + t.slice(1); };
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
    <div className="busy-row" role="note" aria-label={w("busy.busyInYourCalendarAt", { block: blockWords(b) })}>
      <small className="busy-time">{clock(b.from)}<br />{w("busy.toTime", { time: clock(b.to) })}</small><small>{w("busy.busyInYourCalendar")}</small>
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
    p.notify(w(to === usual ? "busy.isAtOn" : "busy.isAtOnBack", { meal: mealV(name), time: to, day: WDV(date), usual }));
  };
  const btn = (label: string, run: () => void, primary = false) => <button key={label} type="button" className={`pill pill-small ${primary ? "pill-primary" : ""}`} onClick={run}>{label}</button>;
  let text = "", buttons: ReactNode[] = [];
  if (a.kind === "meal") {
    text = say("busyMeal", a.name, a.time, blockWords(a.block), WD(date));
    buttons = [a.before && btn(a.before, () => moveTo(a.slotId, a.before!, a.name), true), a.after && btn(a.after, () => moveTo(a.slotId, a.after!, a.name), !a.before), btn(w("busy.keepTime", { time: a.time }), keep)].filter(Boolean) as ReactNode[];
  } else if (a.kind === "late") {
    const prev = dayBefore(date);
    text = cooked ? say("busyLateAhead", clock(a.block.to), a.name, a.time, a.free ?? 0, lower(a.name), WD(prev)) : say("busyLate", clock(a.block.to), a.name, a.time, a.free ?? 0, lower(a.name));
    buttons = [
      btn(w("busy.quickIdeas", { meal: mealV(a.name, true) }), () => p.openOut({ q: w("busy.quickQuestion", { meal: mealV(a.name, true), day: WDV(date), until: clock(a.block.to), time: a.time, free: String(a.free) }) }), true),
      cooked && btn(w("busy.cookAheadOn", { day: WDV(prev) }), () => { const now = getPersonal(); p.setPersonal({ ...now, calendar: { ...(now.calendar ?? c), ahead: { ...(now.calendar?.ahead ?? {}), [`${date}|${a.slotId}`]: prev }, kept: [...(now.calendar?.kept ?? []), askKey(date, a)] } }); calendarNudge(); p.notify(w("busy.isCookedOn", { title: title ?? a.name, ahead: WDV(prev), day: WDV(date) })); }),
      btn(w("busy.keepIt"), keep),
    ].filter(Boolean) as ReactNode[];
  } else if (a.kind === "carry") {
    text = say("busyCarry", blockWords(a.block), lower(a.name));
    buttons = [btn(w("busy.toCarry", { meal: mealV(a.name) }), () => p.openOut({ q: w("busy.carryQuestion", { meal: mealV(a.name, true), day: WDV(date), block: blockWords(a.block) }) }), true), btn(w("busy.keepIt"), keep)];
  } else {
    text = say("busyTraining", a.time, blockWords(a.block), WD(date));
    const d = new Date(`${date}T12:00:00`);
    buttons = [
      a.move && btn(w("busy.moveTo", { time: a.move }), () => { if (training) { p.setDated(d, { ...training, at: a.move! }); p.notify(w("busy.trainingIsAt", { time: a.move!, day: WDV(date) })); } }, true),
      btn(w("busy.restDay"), () => { if (training) { p.setDated(d, { work: training.work, study: training.study, kind: "rest" }); p.notify(w("busy.isARestDay", { day: Cap(WDV(date)) })); } }, !a.move),
      btn(w("busy.keepIt"), keep),
    ].filter(Boolean) as ReactNode[];
  }
  return (
    <div className="busy-ask" role="group" aria-label={w("busy.fromYourCalendar")}>
      {/* DT213 (0.3.74): the calendar's questions are Chef Mealan's */}
      <ChefLine text={text} />
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
      {own && usual && own !== usual && <div><small>{from ? w("busy.movedInGoogle", { time: from }) : w("busy.atOnThisDate", { time: own })}</small><button type="button" className="link" onClick={back}>{w("busy.backTo", { time: usual })}</button></div>}
      {ahead && <div><small>{w("busy.cookedAheadOn", { day: WDV(ahead) })}</small><button type="button" className="link" onClick={notAhead}>{w("busy.cookItOnTheDay")}</button></div>}
    </div>
  );
}
