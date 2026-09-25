import { ChefHat, Camera, BookOpen, ArrowRight } from "lucide-react";
import { aggregate, density } from "../pilot";
import { fmt, fixed } from "../ui";
import { COACH_NAME } from "../components/Mark";
import { bandOf } from "../goal";
import type { AppApi } from "./api";

export function HomeScreen(p: AppApi) {
  const { state, setTab, setStep, pdRef, setCamera, setMode, clientName, goal } = p;
  const bandName = goal?.band ? bandOf(goal.band)?.name : null;
  const setBy = goal?.setBy === "coach" ? COACH_NAME : "you";
  const last = state.meals[0];
  const lastT = last ? aggregate(last.items) : null;
  return (
    <>
      <section className="plan">
        <div className="plan-top"><span>{clientName ? `${clientName}'s goal` : "Your goal"}{bandName ? `: ${bandName}` : ""}</span><span>set by {setBy}</span></div>
        <div className="plan-row">
          <div><b>{fixed(pdRef)}</b><small>PD target</small></div>
          <div><b>{fmt(state.goals.calories, 0)}</b><small>kcal a day</small></div>
          <div><b>{fmt(state.goals.protein, 0)}</b><small>g protein</small></div>
        </div>
      </section>
      <button className="pill pill-primary pill-tall" onClick={() => { setStep("in"); setTab("journey"); }}>
        <ChefHat size={20} /> I'm craving something
      </button>
      <button className="pill pill-tall" onClick={() => { setStep("in"); setTab("journey"); setMode("group"); setCamera(true); }}>
        <Camera size={20} /> Scan
      </button>
      <button className="pill pill-tall" onClick={() => setTab("foods")}>
        <BookOpen size={20} /> My foods
      </button>
      {last && lastT && (
        <section className="card">
          <div className="card-top"><span>Last time</span><span>{new Date(last.savedAt).toLocaleDateString()}</span></div>
          <b>{last.title}</b>
          <small>{last.items.map((i) => `${i.food.name} ${fmt(i.grams, 0)} g`).join(" · ")} · PD {fixed(density(lastT.protein, lastT.calories))}</small>
          <button className="link" onClick={() => { p.setState((s) => ({ ...s, items: structuredClone(last.items), title: last.title, portion: null })); setStep("in"); setTab("journey"); }}>
            Make it again <ArrowRight size={14} />
          </button>
        </section>
      )}
    </>
  );
}
