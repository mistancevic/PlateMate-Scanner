import { useEffect, useRef, useState } from "react";
import { ChevronRight, Dumbbell } from "lucide-react";
import type { AppApi } from "./api";
import { dayFor, getDay, lifestyleOf } from "../personal";
import { planLine, isoWeek, ymd } from "../plan";
import { rowsOf, slotsOf, trainingTime } from "../slots";
import { fmt, pdVal, pdTag } from "../ui";
import { density } from "../pilot";

// Plan decides (0.2, canvas S "Plan purpose one" and H): the calendar of the day, slot by slot. The slots come from Lifestyle
// (meals a day, the eating window, the times), the training row from the Weekly plan. 0.2.1 shows the day with its empty
// slots and its numbers; filling a slot comes in 0.2.2.
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); x.setHours(12, 0, 0, 0); return x; };

export function PlanScreen(p: AppApi) {
  const today = new Date();
  const [picked, setPicked] = useState<string>(ymd(today));
  const stripRef = useRef<HTMLDivElement>(null);
  // the picked day stays in view
  useEffect(() => { try { stripRef.current?.querySelector<HTMLElement>(".choice.on")?.scrollIntoView({ inline: "center", block: "nearest" }); } catch {} }, [picked]);
  // this week and the next, Monday first
  const monday = isoWeek(today).monday;
  const strip = Array.from({ length: 14 }, (_, i) => addDays(monday, i));
  const date = strip.find((d) => ymd(d) === picked) ?? today;
  const lifestyle = lifestyleOf(p.personal);
  const slots = slotsOf(lifestyle);
  const training = dayFor(p.personal, date)?.day ?? getDay(p.personal, date).plan ?? null;
  const rows = rowsOf(slots, training);
  const numbers = p.numbersFor(date);
  const tTime = trainingTime(training);
  const isToday = ymd(date) === ymd(today);
  const line = [
    numbers ? `${fmt(numbers.kcal, 0)} kcal · ${numbers.protein} g protein` : "No numbers yet",
    tTime ? `training at ${tTime}` : training ? "rest day" : null,
  ].filter(Boolean).join(" · ");
  const target = numbers ? density(numbers.protein, numbers.kcal) : null;
  return (
    <>
      <div className="day-strip" role="tablist" aria-label="Pick a day" ref={stripRef}>
        {strip.map((d) => {
          const on = ymd(d) === ymd(date);
          return <button key={ymd(d)} type="button" role="tab" className={`choice ${on ? "on" : ""}`} aria-selected={on} onClick={() => setPicked(ymd(d))}>{DAYS[(d.getDay() + 6) % 7]} {d.getDate()}</button>;
        })}
      </div>
      <section className="card plan-day">
        <div className="plan-day-head">
          <b>{isToday ? "Today, " : ""}{WEEKDAY[(date.getDay() + 6) % 7]}, {date.getDate()} {MONTHS[date.getMonth()]}</b>
          <small>{line}</small>
        </div>
        {rows.map((r) => r.kind === "slot" ? (
          <button key={r.slot.id} type="button" className="menu-row plan-slot" aria-label={`${r.slot.name} at ${r.slot.time}, pick a meal`} onClick={() => p.notify("Picking a meal for a slot comes in the next release.")}>
            <span className="plan-time">{r.slot.time}</span>
            <div className="menu-row-text"><small>{r.slot.name}</small><b className="plan-pick">Pick a meal</b></div>
            <ChevronRight size={18} />
          </button>
        ) : (
          <div key="training" className="menu-row plan-training">
            <span className="plan-time">{r.time}</span>
            <div className="menu-row-text"><small>From my Weekly plan</small><b>{planLine({ ...r.day, when: undefined })}{r.day.minutes ? `, ${r.day.minutes} min` : ""}</b></div>
            <Dumbbell size={18} />
          </div>
        ))}
      </section>
      <section className="plan">
        <div className="plan-top"><span>The day as planned</span><span>{slots.length} {slots.length === 1 ? "slot" : "slots"} open</span></div>
        <div className="plan-row">
          <div><b>—</b><small>{target !== null ? `of ${pdVal(target)} ${pdTag()}` : pdTag()}</small></div>
          <div><b>0</b><small>{numbers ? `of ${fmt(numbers.kcal, 0)} kcal` : "kcal"}</small></div>
          <div><b>0</b><small>{numbers ? `of ${numbers.protein} g protein` : "g protein"}</small></div>
        </div>
      </section>
      <div className="button-row plan-links">
        <button type="button" className="pill pill-small" onClick={() => p.openMenu("life")}>Slots and times</button>
        <button type="button" className="pill pill-small" onClick={() => p.openMenu("week")}>Weekly plan</button>
      </div>
    </>
  );
}
