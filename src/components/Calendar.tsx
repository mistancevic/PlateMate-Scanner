// DT178 (0.3.21, board Stories126, Coach Milan 31 October 00:08): Chef Mealan's own calendar in Google. Me > Google
// Calendar: what goes in, what an event says, Connect. On: where and how far ahead, Turn off with remove or keep. Plan says
// once that the plan is also there; a shopping list can get a day, Shop on. Buttons 44 px or more; labels 12 px or more.
import { useEffect, useRef, useState } from "react";
import type { AppApi } from "../screens/api";
import { calendarEvents, CAL_DAYS, CAL_KINDS, CAL_SCOPE, BUSY_SCOPE, kindOn, dishOn, plusDays, type CalKind, type CalSettings, type CalEvent, type CalMove } from "../gcal";
import { askToken, heldToken, runSync, needsSync, setCalStatus, useCalStatus, dropCalendar, forgetSent, calStatus, lookDue, onMoves, readBusy, busyStale, forgetBusy, useBusy } from "../calendarSync";
import { lifestyleOf, dayFor, getDay, getPersonal } from "../personal";
import { slotsOn, slotsOf, withTimeOn } from "../slots";
import { pruneCal } from "../busy";
import { ymd } from "../plan";
import { weighInsOff } from "../weight";
import { nextCheckIn } from "../goalGuide";
import { getStore } from "../shopping";
import { log } from "../log";

const KIND_NAME: Record<CalKind, string> = { meals: "Meals", cooking: "Cooking", training: "Training", shopping: "Shopping", weigh: "Weigh in", checkin: "Check-in" };
const KIND_WHY: Partial<Record<CalKind, string>> = { weigh: "Off at first: a shared calendar would show it.", checkin: "Off at first, for the same reason." };
export const timeZoneHere = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch { return "UTC"; } };
const calOf = (p: AppApi): CalSettings => p.personal.calendar ?? { on: false };
// 0.3.22: a calendar Google just made is kept at once, on the freshest settings, so leaving the page never loses it
// DT179: the rights a token needs: busy times too when Read when I'm busy is on
export const scopesOf = (c: CalSettings | null | undefined) => (c?.busy ? [CAL_SCOPE, BUSY_SCOPE] : [CAL_SCOPE]);
// DT179: a meal moved in Google Calendar on the same date takes that time here, as a time set for that date
export function applyMoves(p: AppApi, moves: CalMove[]) {
  const now = getPersonal(), l = lifestyleOf(now), usual = slotsOf(l);
  let timesOn = now.timesOn, moved = { ...(now.calendar?.moved ?? {}) };
  const words: string[] = [];
  for (const m of moves) {
    const s = usual.find((x) => x.id === m.slotId); if (!s) continue;
    timesOn = withTimeOn(timesOn, m.date, m.slotId, m.to, s.time);
    const k = `${m.date}|${m.slotId}`;
    if (m.to === s.time) delete moved[k]; else moved[k] = moved[k] ?? m.from;
    words.push(`${s.name} on ${new Date(`${m.date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long" })} at ${m.to}`);
  }
  if (!words.length) return;
  p.setPersonal({ ...now, timesOn, calendar: { ...(now.calendar ?? { on: true }), moved } });
  p.notify(`From Google Calendar: ${words.join(", ")}.`);
}
const keepId = (p: AppApi, extra: Partial<CalSettings> = {}) => (id: string) => { const now = getPersonal(); p.setPersonal({ ...now, calendar: { ...(now.calendar ?? { on: false }), ...extra, id } }); };

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
    // 0.3.22 (Coach Milan 01:17: the events linked to the preview): the link is always chefmealan.com; only this computer's
    // walkthroughs keep their own address
    origin: typeof location !== "undefined" && /^(127\.0\.0\.1|localhost)$/.test(location.hostname) ? location.origin : "https://chefmealan.com",
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
  // DT179: moves read in Google come here; the clock ticks once a minute so the calendar is looked at again
  useEffect(() => { onMoves((m) => applyMoves(latest.current.p, m)); const i = setInterval(() => setTick((n) => n + 1), 60 * 1000); return () => clearInterval(i); }, []);
  const due = c.on && lookDue();
  // DT179: busy times, read while a token with that right is held; kept and moved for gone dates drop off
  useEffect(() => {
    if (!c.on || !c.busy) return;
    const token = heldToken(scopesOf(c));
    if (token && busyStale(from, to)) void readBusy(token, from, to, timeZoneHere());
  });
  useEffect(() => {
    if (!c.on) return;
    const today = ymd(new Date()), pr = pruneCal(c, today);
    if ((pr.kept?.length ?? 0) !== (c.kept?.length ?? 0) || Object.keys(pr.moved ?? {}).length !== Object.keys(c.moved ?? {}).length || Object.keys(pr.ahead ?? {}).length !== Object.keys(c.ahead ?? {}).length)
      p.setPersonal({ ...getPersonal(), calendar: { ...(getPersonal().calendar ?? c), kept: pr.kept, moved: pr.moved, ahead: pr.ahead } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.on, from]);
  useEffect(() => {
    if (!c.on) { if (calStatus().state !== "off") setCalStatus({ state: "off" }); return; }
    const token = heldToken();
    if (!needsSync(c.id, events) && !(token && due)) { if (calStatus().state === "off" || calStatus().state === "tap") setCalStatus({ state: "done" }); return; }
    if (!token) { setCalStatus({ state: "tap" }); return; }
    const t = setTimeout(async () => {
      const { p: q, events: ev, from: f, to: tt } = latest.current;
      const id = await runSync(token, calOf(q).id, ev, f, tt, timeZoneHere(), keepId(q));
      if (id && id !== getPersonal().calendar?.id) keepId(q)(id);
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.on, c.id, sig, due]);
  return null;
}

// the one tap that brings the calendar up to date when the hour is over
export async function updateNow(p: AppApi): Promise<boolean> {
  let token: string | null = null;
  try { token = await askToken(scopesOf(calOf(p))); } catch { token = null; }
  if (!token) { p.notify("Google Calendar was not updated. Try again."); return false; }
  const { events, from, to } = eventsFor(p);
  if (calOf(p).busy) void readBusy(token, from, to, timeZoneHere());
  const id = await runSync(token, calOf(p).id, events, from, to, timeZoneHere(), keepId(p));
  if (!id) return false;
  if (id !== getPersonal().calendar?.id) keepId(p)(id);
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
    const row = (
      <button key={k} type="button" role="switch" aria-checked={on} className={`cal-kind ${k === "meals" && on ? "cal-kind-open" : ""}`} onClick={() => set({ kinds: { ...c.kinds, [k]: !on } })}>
        <span><b>{k === "checkin" && p.profile.coachId ? `Check-in with ${p.coachLabel}` : KIND_NAME[k]}</b><small>{ex}</small>{KIND_WHY[k] && <small className="cal-why">{KIND_WHY[k]}</small>}</span><Switch on={on} />
      </button>
    );
    // DT179a (0.3.23, board Stories128): which meals go in, every slot or only the planned ones
    if (k !== "meals" || !on) return row;
    const only = c.meals === "planned";
    return (
      <div key={k}>
        {row}
        <div className="cal-which">
          <small className="setting-name">Which meals</small>
          <div className="moments" role="radiogroup" aria-label="Which meals">
            <button type="button" role="radio" aria-checked={!only} className={`choice ${!only ? "on" : ""}`} onClick={() => set({ meals: "all" })}>Every meal slot</button>
            <button type="button" role="radio" aria-checked={only} className={`choice ${only ? "on" : ""}`} onClick={() => set({ meals: "planned" })}>Only meals I planned</button>
          </div>
          {only && <small className="muted">A slot with a meal on Plan goes in; an open slot stays out. Plan a meal, and it shows within seconds.</small>}
        </div>
      </div>
    );
  });
  const connect = async () => {
    setBusy(true);
    try {
      let token: string | null = null;
      try { token = await askToken(); } catch { token = null; }
      if (!token) { p.notify("Google Calendar was not connected."); return; }
      const { events, from, to } = eventsFor({ ...p, personal: { ...p.personal, calendar: { ...c, on: true } } });
      const id = await runSync(token, c.id, events, from, to, timeZoneHere(), keepId(p, { on: true, since: new Date().toISOString() }));
      if (!id) return;
      keepId(p, { on: true, since: getPersonal().calendar?.since ?? new Date().toISOString() })(id);
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
      {c.on && <BusyCard p={p} />}
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
        <button type="button" className="pill pill-wide pill-primary cal-connect" disabled={busy || !canConnect} onClick={connect}>{busy ? (st.state === "busy" && st.total ? `Writing ${st.done ?? 0} of ${st.total}…` : "Connecting…") : "Connect Google Calendar"}</button>
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

// DT179 (0.3.23, board Stories127): from your calendar to the app, Read when I'm busy
function BusyCard({ p }: { p: AppApi }) {
  const c = calOf(p);
  const b = useBusy();
  const [asking, setAsking] = useState(false);
  const toggle = async () => {
    if (c.busy) { p.setPersonal({ ...getPersonal(), calendar: { ...(getPersonal().calendar ?? c), busy: false } }); forgetBusy(); log("calendar_busy", { on: false }); return; }
    setAsking(true);
    try {
      let token: string | null = null;
      try { token = await askToken([CAL_SCOPE, BUSY_SCOPE]); } catch { token = null; }
      if (!token) { p.notify("Google did not give the busy times. Nothing changed."); return; }
      p.setPersonal({ ...getPersonal(), calendar: { ...(getPersonal().calendar ?? c), busy: true } });
      const from = ymd(new Date()), to = plusDays(from, CAL_DAYS - 1);
      await readBusy(token, from, to, timeZoneHere());
      log("calendar_busy", { on: true });
      p.notify("Plan now shows when you are busy, and asks where a busy time meets a meal or training.");
    } finally { setAsking(false); }
  };
  return (
    <section className="card cal-busy" aria-label="From your calendar to the app">
      <b>From your calendar to the app</b>
      <button type="button" role="switch" aria-checked={Boolean(c.busy)} className="cal-kind" disabled={asking} onClick={toggle}>
        <span><b>Read when I'm busy</b><small>Busy and free times only. Never the titles, the people or the places of your events.</small></span><Switch on={Boolean(c.busy)} />
      </button>
      <small className="cal-say">With it, Plan suggests: a meal moved out of a meeting, a quick dinner after a late evening, a meal to carry on a full day, and asks when training sits in a busy block. It suggests; your times change only when you tap.</small>
      <small className="muted cal-under">{c.busy ? "On. " : ""}Turning it on asks Google once more, for one more right: see when you are busy. Busy times stay on your phone: not on our server, not with your coach, not with Chef Mealan's AI.</small>
      {c.busy && b?.error && <p className="small cal-error" role="alert">{b.error}</p>}
      <small className="muted cal-under">A Chef Mealan meal you move in Google Calendar, on the same day, takes that time here too.</small>
    </section>
  );
}

// the state line with its one button, on the Calendar page and on Plan
export function CalendarState({ p, plan }: { p: AppApi; plan?: boolean }) {
  const st = useCalStatus();
  const [busy, setBusy] = useState(false);
  if (!p.personal.calendar?.on) return null;
  const tap = st.state === "tap" || st.state === "error";
  // 0.3.23 (Coach Milan 09:00): on the Calendar page the On card says the time once; this line only speaks when there is more
  if (!plan && !tap && st.state !== "busy") return null;
  return (
    <div className={`cal-line ${tap ? "cal-line-tap" : ""}`} role="status" aria-label="Google Calendar">
      <span aria-hidden="true">📅</span>
      <small>{st.state === "busy" ? (st.total ? `Writing to Google Calendar: ${st.done ?? 0} of ${st.total}.` : "Bringing Google Calendar up to date…") : st.state === "error" ? `Google Calendar: ${st.message}` : tap ? `Google Calendar is waiting for your plan. One tap brings the next ${CAL_DAYS} days up to date.`
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
