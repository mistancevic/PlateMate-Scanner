import { ChefHat, ScanBarcode, ArrowRight } from "lucide-react";
import { aggregate, density } from "../pilot";
import { fmt, fixed } from "../ui";
import { Mark, APP_NAME, COACH_NAME } from "../components/Mark";
import type { AppApi } from "./api";

export function HomeScreen(p: AppApi) {
  const { state, setTab, setStep, pdRef } = p;
  const last = state.meals[0];
  const lastT = last ? aggregate(last.items) : null;
  return (
    <>
      <section className="hero">
        <Mark size={72} color="var(--brand)" />
        <h2>{APP_NAME}</h2>
        <p>Your chef for one number. Keep the food you want, stay on plan.</p>
      </section>
      <section className="plan">
        <div className="plan-top"><span>Your plan</span><span>set by {COACH_NAME}</span></div>
        <div className="plan-row">
          <div><b>{fixed(pdRef)}</b><small>PD target</small></div>
          <div><b>{fmt(state.goals.calories, 0)}</b><small>kcal a day</small></div>
          <div><b>{fmt(state.goals.protein, 0)}</b><small>g protein</small></div>
        </div>
      </section>
      <button className="pill pill-primary pill-tall" onClick={() => { setStep("in"); setTab("journey"); }}>
        <ChefHat size={20} /> I'm craving something
      </button>
      <button className="pill pill-tall" onClick={() => setTab("foods")}>
        <ScanBarcode size={19} /> Just check a food
      </button>
      {last && lastT && (
        <section className="card">
          <div className="card-top"><span>Last time</span><span>{new Date(last.savedAt).toLocaleDateString()}</span></div>
          <b>{last.title}</b>
          <small>{last.items.map((i) => `${i.food.name} ${fmt(i.grams, 0)} g`).join(" · ")} · PD {fixed(density(lastT.protein, lastT.calories))}</small>
          <button className="link" onClick={() => { p.setState((s) => ({ ...s, items: structuredClone(last.items), title: last.title, portion: null })); setStep("lock"); setTab("journey"); }}>
            Make it again <ArrowRight size={14} />
          </button>
        </section>
      )}
    </>
  );
}
