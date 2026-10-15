import { useEffect, useRef, useState, type ReactElement } from "react";
import { ChevronRight, ChefHat, Pencil } from "lucide-react";
import type { AppApi, Filling } from "./api";
import { dayFor, getDay, lifestyleOf, isMinor } from "../personal";
import { planLine, isoWeek, ymd, weekdaysOf, workHintOf, type PlanDay } from "../plan";
import { rowsOf, slotsOf, trainingWhen, type Slot } from "../slots";
import { fmt, pdVal, pdTag, pdText } from "../ui";
import { density, aggregate, uid } from "../pilot";
import { STARTERS, fitOf, fromMeal, needOf, sumOf, type PlannedMeal } from "../planned";
import { CHEF_NAME } from "../components/Mark";
import { DayEditor } from "../components/DayEditor";
import { dayLog } from "../today";
import { dayRecord } from "../record";
import { livedByPlan } from "../metricsCalc";

// Plan decides (0.2, canvas S "Plan purpose one" and H): the calendar of the day, slot by slot. The slots come from Lifestyle
// (meals a day, the eating window, the times), the training row from the Training week. 0.2.1 shows the day with its empty
// slots and its numbers; 0.2.2 fills a slot by hand: tap it, pick from My recipes, Coach's recipes or the starters, each with
// its PD mark, or make a new meal on the Plate. The day as planned adds up what the slots hold.
// 0.2.5+r19 (canvas board TW, TW3 to TW5, Milan 13 October 2026): Plan is the one calendar with dates. The training row opens
// that date's training (this date only; the Training week stays), and the arrows go back a week at a time: a past date
// shows what was eaten, with Cook again, and whether the day was lived by the plan.
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); x.setHours(12, 0, 0, 0); return x; };
const SOURCE: Record<PlannedMeal["source"], string> = { mine: "my recipe", coach: "coach's recipe", starter: "starter", plate: "made on the Plate" };

// the day looked at last, kept while the app is open, so a trip to the Plate comes back to the same day
let remembered: string | null = null;
// the day Plan shows, for the chef's context (0.2.4)
export const planDateShown = () => remembered ?? ymd(new Date());

export function PlanScreen(p: AppApi) {
  const today = new Date();
  const [picked, setPickedState] = useState<string>(remembered ?? ymd(today));
  const setPicked = (d: string) => { remembered = d; setPickedState(d); };
  const [open, setOpen] = useState<Slot | null>(null);
  const [editing, setEditing] = useState<PlanDay | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  // the picked day stays in view
  useEffect(() => { try { stripRef.current?.querySelector<HTMLElement>(".choice.on")?.scrollIntoView({ inline: "center", block: "nearest" }); } catch {} }, [picked]);
  // two weeks, Monday first: this week and the next, or earlier weeks with the arrows
  const thisMonday = isoWeek(today).monday;
  const [offset, setOffsetState] = useState(() => { const m = isoWeek(new Date(`${picked}T12:00:00`)).monday; const n = Math.round((m.getTime() - thisMonday.getTime()) / (7 * 864e5)); return n === 1 ? 0 : n; });
  const monday = addDays(thisMonday, offset * 7);
  const strip = Array.from({ length: 14 }, (_, i) => addDays(monday, i));
  // the arrows go both ways with no limit (canvas board FX, PW1); This week comes back
  const goWeek = (n: number) => { const next = n === 0 ? 0 : offset + n; setOffsetState(next); setPicked(next === 0 ? ymd(today) : ymd(addDays(thisMonday, next * 7))); };
  const date = strip.find((d) => ymd(d) === picked) ?? strip[0];
  const key = ymd(date);
  const lifestyle = lifestyleOf(p.personal);
  const slots = slotsOf(lifestyle);
  const training = dayFor(p.personal, date)?.day ?? getDay(p.personal, date).plan ?? null;
  const rows = rowsOf(slots, training);
  const numbers = p.numbersFor(date);
  const tWhen = trainingWhen(training);
  const isToday = key === ymd(today);
  const isPast = key < ymd(today);
  const minor = isMinor(p.personal);
  const changed = !!dayFor(p.personal, date)?.changed;
  const wk = isoWeek(monday), sunday = addDays(monday, 6);
  const weekSpan = `Week ${wk.week}, ${monday.getDate()}${monday.getMonth() === sunday.getMonth() ? "" : ` ${MONTHS[monday.getMonth()]}`} to ${sunday.getDate()} ${MONTHS[sunday.getMonth()]}`;
  const dayName = isToday ? "today" : WEEKDAY[(date.getDay() + 6) % 7];
  const line = [
    numbers ? `${fmt(numbers.kcal, 0)} kcal · ${numbers.protein} g protein` : "No numbers yet",
    tWhen ? tWhen.phrase : training ? "rest day" : null,
  ].filter(Boolean).join(" · ");
  const target = numbers ? density(numbers.protein, numbers.kcal) : null;
  const unit = p.personal.pdUnit === "pct" ? "pct" : "pd";
  const held = p.planned[key] ?? {};
  const sum = sumOf(held);
  const openCount = slots.filter((s) => !held[s.id]).length;
  const fillingOf = (s: Slot): Filling => ({ date: key, slotId: s.id, name: s.name, time: s.time, dayName });
  const put = (s: Slot, m: PlannedMeal) => { p.fill(key, s.id, m); setOpen(null); p.notify(`${m.title} is ${dayName === "today" ? "today's" : `${dayName}'s`} ${s.name.toLowerCase()}.`); };
  return (
    <>
      <div className="week-arrows">
        <button type="button" className="week-arrow" aria-label="Week before" onClick={() => goWeek(-1)}>‹</button>
        <span className="week-arrows-mid">{weekSpan}{offset !== 0 && <button type="button" className="link week-back" onClick={() => goWeek(0)}>This week</button>}</span>
        <button type="button" className="week-arrow" aria-label="Week after" onClick={() => goWeek(1)}>›</button>
      </div>
      <div className="day-strip" role="tablist" aria-label="Pick a day" ref={stripRef}>
        {strip.map((d) => {
          const on = ymd(d) === key;
          const n = Object.keys(p.planned[ymd(d)] ?? {}).length;
          return <button key={ymd(d)} type="button" role="tab" className={`choice ${on ? "on" : ""} ${n ? "has" : ""}`} aria-selected={on} onClick={() => setPicked(ymd(d))}>{DAYS[(d.getDay() + 6) % 7]} {d.getDate()}</button>;
        })}
      </div>
      {isPast ? <PastDay p={p} date={date} dayKey={key} line={line} slots={slots} numbers={numbers} /> : (<>
      <section className="card plan-day">
        <div className="plan-day-head">
          <b>{isToday ? "Today, " : ""}{WEEKDAY[(date.getDay() + 6) % 7]}, {date.getDate()} {MONTHS[date.getMonth()]}
            {/* a day without training has no training row: the pencil sits by the date, as on Today */}
            {!rows.some((r) => r.kind === "training") && <button type="button" className="icon today-pencil plan-pencil" aria-label="Change the training for this date" onClick={() => setEditing(training ?? { work: true, kind: "rest" })}><Pencil size={15} /></button>}
          </b>
          <small>{line}</small>
        </div>
        {rows.map((r) => {
          if (r.kind === "training") return (
            <button type="button" key="training" className="menu-row plan-training" aria-label={`Training at ${r.time}, ${planLine(r.day)}. Change it for this date`} onClick={() => setEditing(r.day)}>
              <span className={`plan-time${r.exact ? "" : " plan-time-word"}`}>{r.exact ? r.label : r.label === "No time set" ? <>No time<br />set</> : r.label}</span>
              <div className="menu-row-text"><small>{changed ? "Changed for this date" : "From my Training week"}</small><b>{planLine({ ...r.day, when: undefined })}{r.day.minutes ? `, ${r.day.minutes} min` : ""}</b>{!r.exact && r.label === "No time set" && <span className="link plan-set-time">Set a time</span>}</div>
              <Pencil size={18} />
            </button>
          );
          const m = held[r.slot.id];
          const fit = m ? fitOf(m, target, unit) : null;
          return (
            <div key={r.slot.id} className={`plan-slot-wrap ${fit?.state === "under" ? "plan-slot-under" : ""}`}>
              <button type="button" className={`menu-row plan-slot ${m ? "plan-slot-set" : ""}`} aria-label={m ? `${r.slot.name} at ${r.slot.time}, ${m.title}` : `${r.slot.name} at ${r.slot.time}, pick a meal`} onClick={() => setOpen(r.slot)}>
                <span className="plan-time">{r.slot.time}</span>
                <div className="menu-row-text">
                  <small>{r.slot.name}</small>
                  {m ? <b>{m.title}</b> : <b className="plan-pick">Pick a meal</b>}
                  {m?.skipped && <small className="plan-slot-sub skipped-mark">Skipped on purpose</small>}
                  {m && fit && !m.skipped && <small className="plan-slot-sub">{SOURCE[m.source]} · {fmt(m.kcal, 0)} kcal · {fmt(m.protein, 0)} g · {pdText(fit.pd)}{fit.state === "fits" ? <span className="fit-ok"> · fits</span> : fit.state === "under" ? <span className="fit-under"> · {fit.text}</span> : null}</small>}
                </div>
                <ChevronRight size={18} />
              </button>
              {m && fit?.state === "under" && (
                <div className="button-row plan-slot-fix">
                  <button type="button" className="pill pill-small pill-primary" onClick={() => p.fillOnPlate({ ...fillingOf(r.slot), mealId: m.mealId }, m.items ? { id: m.mealId ?? "", title: m.title, items: m.items, portion: m.portion ?? 0, savedAt: "" } : null, m.title)}>Fit it on the Plate</button>
                  <button type="button" className="pill pill-small" onClick={() => p.openOut()}>Ask {CHEF_NAME}</button>
                </div>
              )}
            </div>
          );
        })}
      </section>
      <section className="plan">
        <div className="plan-top"><span>The day as planned</span><span>{openCount ? `${openCount} ${openCount === 1 ? "slot" : "slots"} open` : "all slots set"}</span></div>
        <div className="plan-row">
          <div><b>{sum.n ? pdVal(sum.pd) : "—"}</b><small>{target !== null ? `of ${pdVal(target)} ${pdTag()}` : pdTag()}</small></div>
          <div><b>{fmt(sum.kcal, 0)}</b><small>{numbers ? `of ${fmt(numbers.kcal, 0)} kcal` : "kcal"}</small></div>
          <div><b>{fmt(sum.protein, 0)}</b><small>{numbers ? `of ${numbers.protein} g protein` : "g protein"}</small></div>
        </div>
      </section>
      {openCount > 0 && <button type="button" className="pill pill-tall pill-primary plan-fill" onClick={() => p.openOut("fill")}><ChefHat size={18} /> Fill the open slots with {CHEF_NAME}</button>}
      </>)}
      <div className="button-row plan-links">
        <button type="button" className="pill pill-small" onClick={() => p.openMenu("life")}>Slots and times</button>
        <button type="button" className="pill pill-small" onClick={() => p.openMenu("week")}>Training week</button>
      </div>
      {editing && (
        <div className="sheet-backdrop" onClick={() => setEditing(null)}>
          <div className="sheet date-sheet" role="dialog" aria-label={`${WEEKDAY[(date.getDay() + 6) % 7]}, ${date.getDate()} ${MONTHS[date.getMonth()]}: training`} onClick={(e) => e.stopPropagation()}>
            <div className="card-top"><span>{WEEKDAY[(date.getDay() + 6) % 7]}, {date.getDate()} {MONTHS[date.getMonth()]}: training</span><button type="button" className="link" onClick={() => setEditing(null)}>Close</button></div>
            <p className="small date-sheet-why">This date only. Your Training week stays the same.</p>
            <section className="card seg">
              <DayEditor minor={minor} weekdays={weekdaysOf(lifestyle)} peOn={!!lifestyle.peWeek && lifestyle.peWeek !== "none"} value={editing} onChange={setEditing} workHint={workHintOf(lifestyle, minor)} />
            </section>
            <div className="actions date-sheet-actions">
              <button type="button" className="pill pill-primary action-main" onClick={() => { p.setDated(date, editing); setEditing(null); p.notify(`Changed for ${dayName === "today" ? "today" : `${dayName}, ${date.getDate()} ${MONTHS[date.getMonth()]}`} only.`); }}>Save for this date</button>
              {changed && <button type="button" className="link action-cancel" onClick={() => { p.setDated(date, null); setEditing(null); }}>Back to the usual {WEEKDAY[(date.getDay() + 6) % 7]}</button>}
            </div>
          </div>
        </div>
      )}
      {open && <PickSheet p={p} slot={open} slots={slots} day={numbers} target={target} unit={unit} held={held[open.id]} close={() => setOpen(null)} put={(m) => put(open, m)} onPlate={(meal) => { setOpen(null); p.fillOnPlate(fillingOf(open), meal); }} clear={() => { p.fill(key, open.id, null); setOpen(null); }} />}
    </>
  );
}

// A past date (canvas board TW, TW5): the day's numbers against its target, what was eaten with Cook again, and whether the
// day was lived by the plan (every planned meal closed, protein at least 90 %, energy within 10 %).
function PastDay({ p, date, dayKey, line, slots, numbers }: { p: AppApi; date: Date; dayKey: string; line: string; slots: Slot[]; numbers: { kcal: number; protein: number } | null }) {
  const log = dayLog(p.state.feedback, date);
  const rec = dayRecord(slots, p.planned[dayKey], log.logged, dayKey);
  const lived = livedByPlan({ planned: rec.planned, open: rec.open.length, kcal: rec.kcal, protein: rec.protein }, numbers).lived;
  const slotName = (id?: string) => slots.find((s) => s.id === id)?.name;
  return (
    <section className="card plan-day plan-past">
      <div className="plan-day-head">
        <b>{WEEKDAY[(date.getDay() + 6) % 7]}, {date.getDate()} {MONTHS[date.getMonth()]}</b>
        <small>{line}</small>
      </div>
      {log.logged.length ? (
        <>
          <div className="past-nums">
            <span><b>{Math.round(log.kcal).toLocaleString("en")}</b><small>{numbers ? `of ${numbers.kcal.toLocaleString("en")} kcal` : "kcal"}</small></span>
            <span><b>{Math.round(log.protein)}</b><small>{numbers ? `of ${numbers.protein} g protein` : "g protein"}</small></span>
            <span><b>{log.kcal ? (Math.round((log.protein / log.kcal) * 1000) / 10).toFixed(1) : "–"}</b><small>PD that day</small></span>
          </div>
          <small className="setting-name past-label">What you ate</small>
          {log.logged.map((f) => {
            const a = aggregate(f.meal.items);
            const name = slotName(f.slot?.slotId);
            return (
              <div className="past-plate" key={f.id}>
                <span><b>{f.meal.title}</b><small>{name ? `${name}, ` : ""}{new Date(f.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} · {Math.round(a.calories ?? 0)} kcal · {Math.round(a.protein ?? 0)} g protein</small></span>
                <button type="button" className="pill pill-small" onClick={() => { p.setState((s) => ({ ...s, items: f.meal.items.map((it) => ({ ...it, id: uid() })) })); p.setTab("journey"); }}>Cook again</button>
              </div>
            );
          })}
          {lived && <small className="past-lived">✓ A day lived by the plan</small>}
        </>
      ) : <small className="setting-hint past-none">Nothing was logged on this day.</small>}
    </section>
  );
}

// the sheet for a slot: what it needs, then My recipes, Coach's recipes and the starters, each with its PD mark on the right
function PickSheet({ p, slot, slots, day, target, unit, held, close, put, onPlate, clear }: { p: AppApi; slot: Slot; slots: Slot[]; day: { kcal: number; protein: number } | null; target: number | null; unit: "pd" | "pct"; held?: PlannedMeal; close: () => void; put: (m: PlannedMeal) => void; onPlate: (meal: import("../pilot").Meal | null) => void; clear: () => void }) {
  const need = needOf(slots, slot, day);
  const mine = p.state.meals.filter((m) => m.from !== "coach").map((m) => ({ meal: m, planned: fromMeal(m, "mine") }));
  const coach = p.state.meals.filter((m) => m.from === "coach").map((m) => ({ meal: m, planned: fromMeal(m, "coach") }));
  const row = (m: PlannedMeal, k: string, pick: () => void) => {
    const fit = fitOf(m, target, unit);
    return (
      <button key={k} type="button" className="menu-row pick-row" onClick={pick}>
        <div className="menu-row-text"><b>{m.title}</b><small>{fmt(m.kcal, 0)} kcal · {fmt(m.protein, 0)} g protein</small></div>
        <div className={`pick-pd ${fit.state}`}><b>{pdVal(fit.pd)}</b><small>{fit.text}</small></div>
      </button>
    );
  };
  const group = (title: string, rows: ReactElement[]) => rows.length ? <><small className="pick-group">{title}</small><div className="menu-list pick-list">{rows}</div></> : null;
  return (
    <div className="sheet-backdrop" onClick={close}>
      <div className="sheet pick-sheet" role="dialog" aria-label={`${slot.name}, ${slot.time}`} onClick={(e) => e.stopPropagation()}>
        <div className="card-top"><span>{slot.name}, {slot.time}</span><button type="button" className="link" onClick={close}>Close</button></div>
        <p className="small pick-why">{held ? `${held.title} is in this slot. Tap another meal to swap it.` : "Tap a meal to put it in this slot."}{need ? ` It needs about ${fmt(need.kcal, 0)} kcal and ${need.protein} g of protein${target !== null ? `, ${pdText(target)}` : ""}.` : ""}</p>
        {group("My recipes", mine.map((x) => row(x.planned, x.meal.id, () => put(x.planned))))}
        {group("Coach's recipes", coach.map((x) => row(x.planned, x.meal.id, () => put(x.planned))))}
        {group(`${CHEF_NAME}'s starters`, STARTERS.map((m) => row(m, m.title, () => put(m))))}
        <button type="button" className="pill pill-wide pick-plate" onClick={() => onPlate(null)}><ChefHat size={18} /> Create a new meal on the Plate</button>
        {held && <button type="button" className="pill pill-wide" onClick={clear}>Empty this slot</button>}
      </div>
    </div>
  );
}
