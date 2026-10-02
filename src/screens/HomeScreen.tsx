import { ChefHat, Camera, BookOpen, ArrowRight } from "lucide-react";
import { aggregate, density } from "../pilot";
import { fmt, fixed, pdText, pdVal, pdTag, pdRange } from "../ui";
import { COACH_NAME } from "../components/Mark";
import { bandOf } from "../goal";
import { DAY_TYPES } from "../personal";
import { dayLog, loggedLine, daysAgo, dayLabel } from "../today";
import { Dumbbell, Check, X } from "lucide-react";
import type { AppApi } from "./api";

export function HomeScreen(p: AppApi) {
  const { state, setTab, setStep, pdRef, setCamera, setMode, clientName, goal } = p;
  const bandName = goal?.band ? bandOf(goal.band)?.name : null;
  const setBy = goal?.setBy === "coach" ? (goal.coachName || p.profile.coachName || COACH_NAME) : "you";
  const today = dayLog(state.feedback, new Date());
  const past = [1, 2].map((n) => dayLog(state.feedback, daysAgo(n)));
  const trained = p.dayType === "training" || p.dayType === "very";
  return (
    <>
      <section className="plan">
        <div className="plan-top"><span>{clientName ? `${clientName}'s goal` : "Your goal"}{bandName ? `: ${bandName}` : ""}</span><span>set by {setBy}</span></div>
        <div className="plan-row">
          <div><b>{pdVal(pdRef)}</b><small>{pdTag()} target</small></div>
          <div><b>{fmt(p.todayKcal ?? state.goals.calories, 0)}</b><small>{p.personal.dayMode === "follow" ? "kcal today" : "kcal a day"}</small></div>
          <div><b>{fmt(state.goals.protein, 0)}</b><small>g protein</small></div>
        </div>
        {p.personal.dayMode === "follow" && (
          <div className="day-row">
            <small>Today is</small>
            {DAY_TYPES.map((d) => <button key={d.id} className={`pill pill-small ${p.dayType === d.id ? "pill-primary" : ""}`} onClick={() => p.setDayType(d.id)}>{d.name}</button>)}
          </div>
        )}
        {p.personal.dayMode === "follow" && (
          <button className={`pill pill-small trained ${trained ? "pill-primary" : ""}`} onClick={p.trainedToday} aria-pressed={trained}><Dumbbell size={14} /> {trained ? "Trained today" : "Trained today?"}</button>
        )}
      </section>
      {p.inbox.map((it) => (
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
      ))}
      {p.profile.role === "coach" && p.newShared > 0 && (
        <button className="strip strip-button" onClick={() => setTab("clients")}>{p.newShared} new {p.newShared === 1 ? "card" : "cards"} shared with you. Open Clients.</button>
      )}
      <button className="pill pill-primary pill-tall" onClick={() => { setStep("in"); setTab("journey"); }}>
        <ChefHat size={20} /> I'm craving something
      </button>
      <button className="pill pill-tall" onClick={() => { setStep("in"); setTab("journey"); setMode("group"); setCamera(true); }}>
        <Camera size={20} /> Scan
      </button>
      <button className="pill pill-tall" onClick={() => setTab("foods")}>
        <BookOpen size={20} /> My foods
      </button>
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
            <div><b>{dayLabel(d.day)}</b><small>{d.dayType ? DAY_TYPES.find((x) => x.id === d.dayType)?.name ?? d.dayType : "day type not set"}</small></div>
            <div className="history-num"><small>{loggedLine(d, false)}</small></div>
          </div>
        ))}
      </section>
    </>
  );
}
