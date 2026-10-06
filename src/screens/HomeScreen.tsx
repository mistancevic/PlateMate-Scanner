import { useState } from "react";
import { ChefHat, Camera, BookOpen, ChevronRight, Check } from "lucide-react";
import { aggregate, density } from "../pilot";
import { fmt, fixed, pdText, pdVal, pdTag, pdRange } from "../ui";
import { COACH_NAME } from "../components/Mark";
import { bandOf } from "../goal";
import { DAY_TYPES, dayLine, dayModeOf, dayNameAny } from "../personal";
import { dayLog, loggedLine, daysAgo, dayLabel } from "../today";
import { X } from "lucide-react";
import type { AppApi } from "./api";

export function HomeScreen(p: AppApi) {
  const { state, setTab, setStep, pdRef, setCamera, setMode, clientName, goal } = p;
  const bandName = goal?.band ? bandOf(goal.band)?.name : null;
  const byCoach = goal?.setBy === "coach";
  const setBy = byCoach ? `coach ${goal?.coachName || p.profile.coachName || COACH_NAME}` : "you";
  const today = dayLog(state.feedback, new Date());
  const past = [1, 2].map((n) => dayLog(state.feedback, daysAgo(n)));
  const follow = dayModeOf(p.personal) === "each";
  // The day pills show while the day is still assumed, and again after Change, until a pill is tapped.
  const [changing, setChanging] = useState(false);
  const pillsOpen = follow && (p.day.source === "assumed" || changing);
  const dateLine = new Date().toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });
  const inbox = p.inbox.map((it) => (
    <section className="card inbox" key={it.id}>
      <div className="card-top"><span>{p.profile.coachName || "Your coach"} sent you a recipe</span><button className="link" onClick={() => p.dismissRecipe(it)}>Dismiss</button></div>
      <b>{it.meal?.title || "Recipe"}</b>
      <small>{(it.meal?.items ?? []).map((i: any) => `${Math.round(i.grams)} g ${i.food?.name}`).join(" · ")}</small>
      {it.note && <p className="client-note">“{it.note}”</p>}
      <div className="button-row" style={{ marginTop: 10 }}>
        <button className="pill pill-small pill-primary" onClick={() => p.takeRecipe(it, "make")}>Make it</button>
        <button className="pill pill-small" onClick={() => p.takeRecipe(it, "keep")}>Keep it</button>
      </div>
    </section>
  ));
  return (
    <>
      <section className="plan">
        <div className="plan-top">
          <span>{clientName ? `${clientName}'s goal` : "Your goal"}{bandName ? `: ${bandName}` : ""}</span>
          <button className="plan-source" onClick={() => p.openMenu(byCoach ? "coach" : "goal")} aria-label={byCoach ? "Open your coach" : "Open your goal"}>set by {setBy} <ChevronRight size={12} /></button>
        </div>
        <div className="plan-row">
          <div><b>{pdVal(pdRef)}</b><small>{pdTag()} target</small></div>
          <div><b>{fmt(p.todayKcal ?? state.goals.calories, 0)}</b><small>{!follow ? "kcal a day" : p.day.source === "assumed" ? "kcal, week's average" : "kcal today"}</small></div>
          <div><b>{fmt(p.todayMacros?.protein ?? state.goals.protein, 0)}</b><small>g protein</small></div>
        </div>
        {!p.goal && <button className="strip strip-button" onClick={p.openGoal}>Set your goal: your day in four numbers, every plate measured against them.</button>}
        {p.todayMacros && <p className="macro-line">{p.todayMacros.fats} g fat · {p.todayMacros.carbs} g carbs</p>}
        {p.profile.coachId && !byCoach && <button className="plan-source coach-line" onClick={() => p.openMenu("coach")} aria-label="Open your coach">Your coach: {p.profile.coachName || COACH_NAME} <ChevronRight size={12} /></button>}
        <div className="day-line">
          <div>
            <b>{dateLine}</b>
            {pillsOpen ? <small>What kind of day is it?</small> : <small className="day-state"><Check size={14} /> {follow ? dayLine(p.day) : "Every day the same"}</small>}
          </div>
          {!pillsOpen && <button className="pill pill-small" onClick={() => (follow ? setChanging(true) : p.openMenu("goal"))}>Change</button>}
        </div>
        {pillsOpen && (
          <div className="day-row">
            {DAY_TYPES.map((d) => <button key={d.id} className={`pill pill-small ${p.day.source !== "assumed" && p.day.type === d.id ? "pill-primary" : ""}`} onClick={() => { p.setDayType(d.id); setChanging(false); }}>{d.name}</button>)}
          </div>
        )}
      </section>
      {p.profile.role === "coach" && p.newShared > 0 && (
        <button className="strip strip-button" onClick={() => setTab("clients")}>{p.newShared} new {p.newShared === 1 ? "card" : "cards"} shared with you. Open Clients.</button>
      )}
      <button className="pill pill-primary pill-tall" onClick={() => { setStep("in"); setTab("journey"); }}>
        <ChefHat size={20} /> I'm craving something
      </button>
      <button className="pill pill-tall" onClick={() => { setStep("in"); setTab("journey"); setMode("label"); setCamera(true); }}>
        <Camera size={20} /> Scan
      </button>
      <button className="pill pill-tall" onClick={() => setTab("foods")}>
        <BookOpen size={20} /> My foods
      </button>
      {state.meals.length > 0 && (
        <button className="pill pill-tall" onClick={() => { p.setFoodsView("recipes"); setTab("foods"); }}>
          <BookOpen size={20} /> My recipes ({state.meals.length})
        </button>
      )}
      {inbox}
      <p className="label">Logged so far</p>
      <p className="small logged-line">{loggedLine(today, true)} What went through Mealan, nothing more.</p>
      {today.logged.map((f) => (
        <section className="card log-card" key={f.id}>
          <div className="card-top"><span>{f.meal.title}</span><small>{new Date(f.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></div>
          <small>{f.meal.items.map((i) => `${fmt(i.grams, 0)} g ${i.food.name}`).join(" · ")}</small>
          {(() => { const a = aggregate(f.meal.items); return <small className="log-nums">{fmt(a.calories, 0)} kcal · {fmt(a.protein, 0)} g protein · {pdText(density(a.protein, a.calories))}</small>; })()}
        </section>
      ))}
      {today.prepared.length > 0 && (
        <>
          <p className="label">Prepared for later</p>
          {today.prepared.map((f) => (
            <section className="card log-card" key={f.id}>
              <div className="card-top"><span>{f.meal.title}</span></div>
              <small>{f.meal.items.map((i) => `${fmt(i.grams, 0)} g ${i.food.name}`).join(" · ")}</small>
              <div className="button-row" style={{ marginTop: 8 }}>
                <button className="pill pill-small pill-primary" onClick={() => p.settleCard(f.id, "eaten")}><Check size={14} /> I ate it</button>
                <button className="pill pill-small" onClick={() => p.settleCard(f.id, "not-used")}><X size={14} /> Not today</button>
              </div>
            </section>
          ))}
        </>
      )}
      <p className="label">The last days</p>
      <section className="card days">
        {past.map((d) => (
          <div className="history-row" key={d.day.toISOString()}>
            <div><b>{dayLabel(d.day)}</b><small>{d.dayType ? dayNameAny(d.dayType) : "day type not set"}</small></div>
            <div className="history-num"><small>{loggedLine(d, false)}</small></div>
          </div>
        ))}
      </section>
    </>
  );
}
