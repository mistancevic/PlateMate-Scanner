// DT178 (0.3.21, board Stories126, Coach Milan 31 October 00:08): Chef Mealan's own calendar in Google. Me > Google
// Calendar: what goes in, what an event says, Connect. On: where and how far ahead, Turn off with remove or keep. Plan says
// once that the plan is also there; a shopping list can get a day, Shop on. Buttons 44 px or more; labels 12 px or more.
import { useEffect, useRef, useState } from "react";
import type { AppApi } from "../screens/api";
import { calendarEvents, CAL_DAYS, CAL_KINDS, kindOn, dishOn, plusDays, type CalKind, type CalSettings, type CalEvent } from "../gcal";
import { askToken, heldToken, runSync, needsSync, setCalStatus, useCalStatus, dropCalendar, forgetSent, calStatus } from "../calendarSync";
import { lifestyleOf, dayFor, getDay } from "../personal";
import { slotsOn } from "../slots";
import { ymd } from "../plan";
import { weighInsOff } from "../weight";
import { nextCheckIn } from "../goalGuide";
import { getStore } from "../shopping";
import { log } from "../log";

const KIND_NAME: Record<CalKind, string> = { meals: "Meals", cooking: "Cooking", training: "Training", shopping: "Shopping", weigh: "Weigh in", checkin: "Check-in" };
const KIND_WHY: Partial<Record<CalKind, string>> = { weigh: "Off at first: a shared calendar would show it.", checkin: "Off at first, for the same reason." };
export const timeZoneHere = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch { return "UTC"; } };
const calOf = (p: AppApi): CalSettings => p.personal.calendar ?? { on: false };

// the events for the next 14 days, from what the app already knows
export function eventsFor(p: AppApi, now = new Date()): { events: CalEvent[]; from: string; to: string } {
  const c = calOf(p), from = ymd(now), days = Array.from({ length: CAL_DAYS }, (_, i) => plusDays(from, i));
  const l = lifestyleOf(p.personal);
  const ci = p.goal?.setAt ? ymd(nextCheckIn(p.goal.setAt, now)) : null;
  const events = calendarEvents({
    days,
    slotsOf: (d) => slotsOn(l, p.personal.timesOn, d),
    trainingOf: (d) => { const dt = new Date(`${d}T12:00:00`); return dayFor(p.personal, dt)?.day ?? getDay(p.personal, dt).plan ?? null; },
    planned: p.planned,
    cooked: (id) => Boolean(p.state.meals.find((m) => m.id === id)?.steps?.length),
    settings: c,
    weigh: Boolean(p.safety.consentBodyAt) && !weighInsOff(p.safety) && !p.travel?.weighPaused,
    noKitchen: () => p.travel?.kitchen === "hotel",
    checkIn: ci ? { date: ci, name: p.profile.coachId ? `Check-in with ${p.coachLabel}` : "Goal check-in" } : null,
    shopping: getStore().lists.filter((x) => !x.doneAt && x.shopOn).map((x) => ({ n: x.n, at: x.shopOn! })),
    origin: typeof location !== "undefined" ? location.origin : "https://chefmealan.com",
    timeZone: timeZoneHere(),
  });
  return { events, from, to: days[days.length - 1] };
}

// a change the app's state does not carry (a shopping list's day) asks the calendar to look again
export const calendarNudge = () => { try { window.dispatchEvent(new Event("cm-calendar")); } catch {} };
// mounted once in the app: while the calendar is on and a token is held, every change goes across within seconds
export function CalendarSync({ p }: { p: AppApi }) {
  const c = calOf(p);
  const [, setTick] = useState(0);
  useEffect(() => { const f = () => setTick((n) => n + 1); window.addEventListener("cm-calendar", f); return () => window.removeEventListener("cm-calendar", f); }, []);
  // nothing is worked out while the calendar is off
  const { events, from, to } = c.on ? eventsFor(p) : { events: [] as CalEvent[], from: "", to: "" };
  const sig = events.map((e) => `${e.id}.${e.h}`).join(",");
  const latest = useRef({ p, events, from, to }); latest.current = { p, events, from, to };
  useEffect(() => {
    if (!c.on) { if (calStatus().state !== "off") setCalStatus({ state: "off" }); return; }
    if (!needsSync(c.id, events)) { if (calStatus().state === "off" || calStatus().state === "tap") setCalStatus({ state: "done" }); return; }
    const token = heldToken();
    if (!token) { setCalStatus({ state: "tap" }); return; }
    const t = setTimeout(async () => {
      const { p: q, events: ev, from: f, to: tt } = latest.current;
      const id = await runSync(token, calOf(q).id, ev, f, tt, timeZoneHere());
      if (id && id !== calOf(q).id) q.setPersonal({ ...q.personal, calendar: { ...calOf(q), id } });
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.on, c.id, sig]);
  return null;
}

// the one tap that brings the calendar up to date when the hour is over
export async function updateNow(p: AppApi): Promise<boolean> {
  let token: string | null = null;
  try { token = await askToken(); } catch { token = null; }
  if (!token) { p.notify("Google Calendar was not updated. Try again."); return false; }
  const { events, from, to } = eventsFor(p);
  const id = await runSync(token, calOf(p).id, events, from, to, timeZoneHere());
  if (!id) return false;
  if (id !== calOf(p).id) p.setPersonal({ ...p.personal, calendar: { ...calOf(p), id } });
  return true;
}

const Switch = ({ on }: { on: boolean }) => <span className={`cal-switch ${on ? "on" : ""}`} aria-hidden="true"><span /></span>;

export function CalendarPage({ p }: { p: AppApi }) {
  const c = calOf(p);
  const st = useCalStatus();
  const [busy, setBusy] = useState(false);
  const [ending, setEnding] = useState(false);
  const set = (next: Partial<CalSettings>) => p.setPersonal({ ...p.personal, calendar: { ...c, ...next } });
  const canConnect = p.cloudEnabled ? Boolean(p.user) : typeof location !== "undefined" && /^(127\.0\.0\.1|localhost)$/.test(location.hostname);
  const kinds = CAL_KINDS.map((k) => {
    const on = kindOn(c, k);
    const ex = k === "meals" ? "Breakfast, lunch, dinner at your times" : k === "cooking" ? "Cook dinner, 30 minutes before, when the planned meal has steps"
      : k === "training" ? "Your training days, at their time" : k === "shopping" ? "A shopping list, on the day you pick with Shop on"
      : k === "weigh" ? "Weigh in, before breakfast" : p.profile.coachId ? `Check-in with ${p.coachLabel}, every 4 weeks` : "Goal check-in, every 4 weeks";
    return (
      <button key={k} type="button" role="switch" aria-checked={on} className="cal-kind" onClick={() => set({ kinds: { ...c.kinds, [k]: !on } })}>
        <span><b>{k === "checkin" && p.profile.coachId ? `Check-in with ${p.coachLabel}` : KIND_NAME[k]}</b><small>{ex}</small>{KIND_WHY[k] && <small className="cal-why">{KIND_WHY[k]}</small>}</span><Switch on={on} />
      </button>
    );
  });
  const connect = async () => {
    setBusy(true);
    try {
      let token: string | null = null;
      try { token = await askToken(); } catch { token = null; }
      if (!token) { p.notify("Google Calendar was not connected."); return; }
      const { events, from, to } = eventsFor({ ...p, personal: { ...p.personal, calendar: { ...c, on: true } } });
      const id = await runSync(token, c.id, events, from, to, timeZoneHere());
      if (!id) return;
      p.setPersonal({ ...p.personal, calendar: { ...c, on: true, id, since: new Date().toISOString() } });
      log("calendar_on", { events: events.length });
      p.notify("Your plan is in Google Calendar, in the calendar Chef Mealan.");
    } finally { setBusy(false); }
  };
  const turnOff = async (remove: boolean) => {
    setBusy(true);
    try {
      if (remove && c.id) {
        let token: string | null = null;
        try { token = await askToken(); } catch { token = null; }
        if (!token) { p.notify("The calendar stays in Google. Try again, or remove it in Google Calendar."); return; }
        try { await dropCalendar(token, c.id); } catch (e: any) { p.notify(`Google Calendar answered: ${e?.message || "no"}. Remove it in Google Calendar.`); return; }
        p.setPersonal({ ...p.personal, calendar: { ...c, on: false, id: undefined } });
      } else p.setPersonal({ ...p.personal, calendar: { ...c, on: false } });
      forgetSent(); setCalStatus({ state: "off" }); setEnding(false);
      log("calendar_off", { removed: remove });
      p.notify(remove ? "Chef Mealan stopped writing, and the calendar is removed from Google." : "Chef Mealan stopped writing. The calendar stays in Google as it is.");
    } finally { setBusy(false); }
  };
  return (
    <>
      <p className="small muted page-why">Chef Mealan writes your plan into a calendar of its own, called Chef Mealan, in your Google Calendar. It never reads or changes your other events.</p>
      {c.on && (
        <section className="card cal-on" aria-label="Google Calendar is on">
          <span aria-hidden="true">📅</span>
          <div><b>On</b><small>The Chef Mealan calendar in your Google account{p.user?.email ? `, ${p.user.email}` : ""}. The next {CAL_DAYS} days are in it.{st.state === "done" && st.at ? ` Updated ${st.at}.` : ""}</small></div>
        </section>
      )}
      {c.on && <CalendarState p={p} />}
      {c.on && <p className="small muted">When you change a time, a slot or a meal here, it changes in Google Calendar within seconds. Google lets the app write for about an hour after a tap; after that, one tap on Update Google Calendar brings the next {CAL_DAYS} days up to date.</p>}
      <section className="card cal-kinds" aria-label="What goes in">
        <b>What goes in</b>
        <small className="muted">Each kind is on or off. Change it any time.</small>
        {kinds}
        <button type="button" role="switch" aria-checked={dishOn(c)} className="cal-kind" onClick={() => set({ dish: !dishOn(c) })}>
          <span><b>The dish's name</b><small>Lunch · Chicken rice bowl, or just Lunch</small></span><Switch on={dishOn(c)} />
        </button>
      </section>
      <section className="card">
        <b>What an event says</b>
        <small className="cal-say">The name, the time, and a link that opens that day on Plan. Never kcal, protein, your goal or anything about your health. Calendars get shared with family and colleagues, so the numbers stay in the app.</small>
      </section>
      {!c.on && (<>
        <button type="button" className="pill pill-wide pill-primary cal-connect" disabled={busy || !canConnect} onClick={connect}>{busy ? "Connecting…" : "Connect Google Calendar"}</button>
        {!canConnect && <small className="muted">Sign in with Google first.</small>}
        <small className="muted cal-under">Google asks you once for one right: to create the Chef Mealan calendar and manage the events in it. Nothing else. You can take it back in your Google account at any time.</small>
        {st.state === "error" && <p className="small cal-error" role="alert">{st.message}</p>}
      </>)}
      {c.on && (
        <section className="card cal-off" aria-label="Turn off">
          <b>Turn off</b>
          {!ending ? <button type="button" className="pill pill-wide" disabled={busy} onClick={() => setEnding(true)}>Turn off</button> : (<>
            <small className="muted">Chef Mealan stops writing. What about the calendar?</small>
            <button type="button" className="pill pill-wide" disabled={busy} onClick={() => turnOff(true)}>Remove the Chef Mealan calendar</button>
            <button type="button" className="pill pill-wide" disabled={busy} onClick={() => turnOff(false)}>Keep it as it is</button>
            <button type="button" className="link cal-cancel" onClick={() => setEnding(false)}>Cancel</button>
          </>)}
          <small className="muted">Deleting your account also removes the Chef Mealan calendar.</small>
        </section>
      )}
    </>
  );
}

// the state line with its one button, on the Calendar page and on Plan
export function CalendarState({ p, plan }: { p: AppApi; plan?: boolean }) {
  const st = useCalStatus();
  const [busy, setBusy] = useState(false);
  if (!p.personal.calendar?.on) return null;
  const tap = st.state === "tap" || st.state === "error";
  return (
    <div className={`cal-line ${tap ? "cal-line-tap" : ""}`} role="status" aria-label="Google Calendar">
      <span aria-hidden="true">📅</span>
      <small>{st.state === "busy" ? "Bringing Google Calendar up to date…" : st.state === "error" ? `Google Calendar: ${st.message}` : tap ? `Google Calendar is waiting for your plan. One tap brings the next ${CAL_DAYS} days up to date.`
        : plan ? `Also in your Google Calendar, ${CAL_DAYS} days ahead. A time you change here changes there.` : `Up to date${st.at ? `, ${st.at}` : ""}.`}</small>
      {tap && <button type="button" className="pill pill-small" disabled={busy} onClick={async () => { setBusy(true); try { await updateNow(p); } finally { setBusy(false); } }}>Update Google Calendar</button>}
    </div>
  );
}

// a kept shopping list gets a day, only while the calendar is on and Shopping goes in
export function ShopOn({ p, n, value, onChange }: { p: AppApi; n: number; value?: string; onChange: (v: string | undefined) => void }) {
  const c = p.personal.calendar;
  if (!c?.on || !kindOn(c, "shopping")) return null;
  return (
    <label className="cal-shop-on">
      <span><b>Shop on</b><small>Optional. Puts Shopping list {n} in your calendar.</small></span>
      <input type="datetime-local" aria-label={`Shop on, shopping list ${n}`} value={value ?? ""} onChange={(e) => onChange(e.target.value ? e.target.value.slice(0, 16) : undefined)} />
    </label>
  );
}
