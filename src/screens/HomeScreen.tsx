import { ChefHat, Camera, BookOpen, ArrowRight, MessageCircle } from "lucide-react";
import { aggregate, density } from "../pilot";
import { fmt, fixed, pdText, pdVal, pdTag, pdRange } from "../ui";
import { COACH_NAME } from "../components/Mark";
import { bandOf } from "../goal";
import { DAY_TYPES } from "../personal";
import type { AppApi } from "./api";

export function HomeScreen(p: AppApi) {
  const { state, setTab, setStep, pdRef, setCamera, setMode, clientName, goal } = p;
  const bandName = goal?.band ? bandOf(goal.band)?.name : null;
  const setBy = goal?.setBy === "coach" ? (goal.coachName || p.profile.coachName || COACH_NAME) : "you";
  const last = state.meals[0];
  const lastT = last ? aggregate(last.items) : null;
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
      <button className="pill pill-primary pill-tall" onClick={() => { p.closeOut(); setStep("in"); setTab("journey"); }}>
        <ChefHat size={20} /> I'm craving something
      </button>
      <button className="pill pill-tall" onClick={() => { setStep("in"); setTab("journey"); setMode("group"); setCamera(true); }}>
        <Camera size={20} /> Scan
      </button>
      <button className="pill pill-tall" onClick={() => { setTab("journey"); p.openOut(); }}>
        <MessageCircle size={20} /> Chat with Mealan
      </button>
      <button className="pill pill-tall" onClick={() => setTab("foods")}>
        <BookOpen size={20} /> My foods
      </button>
      {last && lastT && (
        <section className="card">
          <div className="card-top"><span>Last time</span><span>{new Date(last.savedAt).toLocaleDateString()}</span></div>
          <b>{last.title}</b>
          <small>{last.items.map((i) => `${i.food.name} ${fmt(i.grams, 0)} g`).join(" · ")} · {pdText(density(lastT.protein, lastT.calories))}</small>
          <button className="link" onClick={() => { p.setState((s) => ({ ...s, items: structuredClone(last.items), title: last.title, portion: null })); setStep("in"); setTab("journey"); }}>
            Make it again <ArrowRight size={14} />
          </button>
        </section>
      )}
    </>
  );
}
