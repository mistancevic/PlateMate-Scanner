import { useEffect, useRef, useState, type ReactElement } from "react";
import { ChevronRight, Dumbbell, ChefHat } from "lucide-react";
import type { AppApi, Filling } from "./api";
import { dayFor, getDay, lifestyleOf } from "../personal";
import { planLine, isoWeek, ymd } from "../plan";
import { rowsOf, slotsOf, trainingTime, type Slot } from "../slots";
import { fmt, pdVal, pdTag, pdText } from "../ui";
import { density } from "../pilot";
import { STARTERS, fitOf, fromMeal, needOf, sumOf, type PlannedMeal } from "../planned";
import { CHEF_NAME } from "../components/Mark";

// Plan decides (0.2, canvas S "Plan purpose one" and H): the calendar of the day, slot by slot. The slots come from Lifestyle
// (meals a day, the eating window, the times), the training row from the Weekly plan. 0.2.1 shows the day with its empty
// slots and its numbers; 0.2.2 fills a slot by hand: tap it, pick from My recipes, Coach's recipes or the starters, each with
// its PD mark, or make a new meal on the Plate. The day as planned adds up what the slots hold.
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); x.setHours(12, 0, 0, 0); return x; };
const SOURCE: Record<PlannedMeal["source"], string> = { mine: "my recipe", coach: "coach's recipe", starter: "starter", plate: "made on the Plate" };

// the day looked at last, kept while the app is open, so a trip to the Plate comes back to the same day
let remembered: string | null = null;

export function PlanScreen(p: AppApi) {
  const today = new Date();
  const [picked, setPickedState] = useState<string>(remembered ?? ymd(today));
  const setPicked = (d: string) => { remembered = d; setPickedState(d); };
  const [open, setOpen] = useState<Slot | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  // the picked day stays in view
  useEffect(() => { try { stripRef.current?.querySelector<HTMLElement>(".choice.on")?.scrollIntoView({ inline: "center", block: "nearest" }); } catch {} }, [picked]);
  // this week and the next, Monday first
  const monday = isoWeek(today).monday;
  const strip = Array.from({ length: 14 }, (_, i) => addDays(monday, i));
  const date = strip.find((d) => ymd(d) === picked) ?? today;
  const key = ymd(date);
  const lifestyle = lifestyleOf(p.personal);
  const slots = slotsOf(lifestyle);
  const training = dayFor(p.personal, date)?.day ?? getDay(p.personal, date).plan ?? null;
  const rows = rowsOf(slots, training);
  const numbers = p.numbersFor(date);
  const tTime = trainingTime(training);
  const isToday = key === ymd(today);
  const dayName = isToday ? "today" : WEEKDAY[(date.getDay() + 6) % 7];
  const line = [
    numbers ? `${fmt(numbers.kcal, 0)} kcal · ${numbers.protein} g protein` : "No numbers yet",
    tTime ? `training at ${tTime}` : training ? "rest day" : null,
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
      <div className="day-strip" role="tablist" aria-label="Pick a day" ref={stripRef}>
        {strip.map((d) => {
          const on = ymd(d) === key;
          const n = Object.keys(p.planned[ymd(d)] ?? {}).length;
          return <button key={ymd(d)} type="button" role="tab" className={`choice ${on ? "on" : ""} ${n ? "has" : ""}`} aria-selected={on} onClick={() => setPicked(ymd(d))}>{DAYS[(d.getDay() + 6) % 7]} {d.getDate()}</button>;
        })}
      </div>
      <section className="card plan-day">
        <div className="plan-day-head">
          <b>{isToday ? "Today, " : ""}{WEEKDAY[(date.getDay() + 6) % 7]}, {date.getDate()} {MONTHS[date.getMonth()]}</b>
          <small>{line}</small>
        </div>
        {rows.map((r) => {
          if (r.kind === "training") return (
            <div key="training" className="menu-row plan-training">
              <span className="plan-time">{r.time}</span>
              <div className="menu-row-text"><small>From my Weekly plan</small><b>{planLine({ ...r.day, when: undefined })}{r.day.minutes ? `, ${r.day.minutes} min` : ""}</b></div>
              <Dumbbell size={18} />
            </div>
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
                  {m && fit && <small className="plan-slot-sub">{SOURCE[m.source]} · {fmt(m.kcal, 0)} kcal · {fmt(m.protein, 0)} g · {pdText(fit.pd)}{fit.state === "fits" ? <span className="fit-ok"> · fits</span> : fit.state === "under" ? <span className="fit-under"> · {fit.text}</span> : null}</small>}
                </div>
                <ChevronRight size={18} />
              </button>
              {m && fit?.state === "under" && (
                <div className="button-row plan-slot-fix">
                  <button type="button" className="pill pill-small pill-primary" onClick={() => p.fillOnPlate(fillingOf(r.slot), m.items ? { id: m.mealId ?? "", title: m.title, items: m.items, portion: m.portion ?? 0, savedAt: "" } : null, m.title)}>Fit it on the Plate</button>
                  <button type="button" className="pill pill-small" onClick={() => p.openOut()}>Ask Chef {CHEF_NAME}</button>
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
      <div className="button-row plan-links">
        <button type="button" className="pill pill-small" onClick={() => p.openMenu("life")}>Slots and times</button>
        <button type="button" className="pill pill-small" onClick={() => p.openMenu("week")}>Weekly plan</button>
      </div>
      {open && <PickSheet p={p} slot={open} slots={slots} day={numbers} target={target} unit={unit} held={held[open.id]} close={() => setOpen(null)} put={(m) => put(open, m)} onPlate={(meal) => { setOpen(null); p.fillOnPlate(fillingOf(open), meal); }} clear={() => { p.fill(key, open.id, null); setOpen(null); }} />}
    </>
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
        {group(`Chef ${CHEF_NAME}'s starters`, STARTERS.map((m) => row(m, m.title, () => put(m))))}
        <button type="button" className="pill pill-wide pick-plate" onClick={() => onPlate(null)}><ChefHat size={18} /> Create a new meal on the Plate</button>
        {held && <button type="button" className="pill pill-wide" onClick={clear}>Empty this slot</button>}
      </div>
    </div>
  );
}
