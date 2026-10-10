import { useEffect, useState } from "react";
import { ChefHat, Camera, ChevronRight, Check, Pencil, Salad, IceCreamCone } from "lucide-react";
import { aggregate, density } from "../pilot";
import { fmt, fixed, pdText, pdVal, pdTag, pdRange } from "../ui";
import { COACH_NAME } from "../components/Mark";
import { bandOf, goalLabel } from "../goal";
import { DAY_TYPES, dayModeOf, dayNameAny, hasPlan, isMinor, lifestyleOf } from "../personal";
import { planLine, schoolLine, studyLine, loadOf, LOAD_DAY, weekdaysOf, dayKindOf, type PlanDay } from "../plan";
import { DayEditor } from "../components/DayEditor";
import { dayLog, loggedLine, daysAgo, dayLabel } from "../today";
import { X } from "lucide-react";
import type { AppApi } from "./api";

export function HomeScreen(p: AppApi) {
  const [shareFor, setShareFor] = useState<string | null>(null);
  // the 30 minute check (Y1 column 13): the card shows once Today is open 30 minutes or more after the meal
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(t); }, []);
  const carryDue = (f: { createdAt: string; carry?: unknown; status: string }) => f.status === "eaten" && !f.carry && now - new Date(f.createdAt).getTime() >= 30 * 60_000;
  const { state, setTab, setStep, pdRef, setCamera, setMode, clientName, goal } = p;
  const bandName = goal?.band ? goalLabel(goal.band) : null;
  const byCoach = goal?.setBy === "coach";
  const setBy = byCoach ? `Coach ${(goal?.coachName || p.profile.coachName || COACH_NAME).split(" ")[0]}` : "you";
  const today = dayLog(state.feedback, new Date());
  const past = [1, 2].map((n) => dayLog(state.feedback, daysAgo(n)));
  const follow = dayModeOf(p.personal) === "each";
  // The day pills show while the day is still assumed, and again after Change, until a pill is tapped.
  const [changing, setChanging] = useState(false);
  const [draft, setDraft] = useState<PlanDay | null>(null);
  // with a Weekly plan Today reads it; without one, Today asks what kind of day it is
  const planned = hasPlan(p.personal);
  const dateLine = new Date().toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });
  const inbox = p.inbox.map((it) => (
    <section className="card inbox" key={it.id}>
      <div className="card-top"><span>{p.coachLabel} sent you a recipe</span><button className="link" onClick={() => p.dismissRecipe(it)}>Dismiss</button></div>
      <b>{it.meal?.title || "Recipe"}</b>
      <small>{(it.meal?.items ?? []).map((i: any) => `${Math.round(i.grams)} g ${i.food?.name}`).join(" · ")}</small>
      {it.note && <p className="client-note">“{it.note}”</p>}
      <div className="button-row" style={{ marginTop: 10 }}>
        <button className="pill pill-small pill-primary" onClick={() => p.takeRecipe(it, "make")}>Make it</button>
        <button className="pill pill-small" onClick={() => p.takeRecipe(it, "keep")}>Keep it</button>
      </div>
    </section>
  ));
  const minor = isMinor(p.personal);
  // Release B: a study day says so; the editor offers the kinds of day Lifestyle allows
  const ls = lifestyleOf(p.personal), wkd = weekdaysOf(ls), peOn = !!ls.peWeek && ls.peWeek !== "none";
  const todayLine = (d: PlanDay) => (minor ? schoolLine(d) : dayKindOf(d, ls) === "study" ? studyLine({ ...d, study: true }) : planLine(d));
  return (
    <>
      <section className="plan">
        {/* the goal is the headline and the way in; whose and who set it is one small line above it */}
        <div className="plan-goal">
          <small>Your goal, set by {byCoach ? setBy : "you"}</small>
          <button className="plan-goal-name" onClick={() => p.openMenu("goal")} aria-label="Open your goal">{bandName || "Your goal"} <ChevronRight size={22} /></button>
        </div>
        <div className="plan-row">
          <div><b>{pdVal(p.dayPd)}</b><small>{pdTag()} target{follow && p.day.source !== "assumed" ? " today" : ""}</small></div>
          <div><b>{fmt(p.todayKcal ?? state.goals.calories, 0)}</b><small>{!follow ? "kcal a day" : p.day.source === "assumed" ? "kcal, week's average" : "kcal today"}</small></div>
          <div><b>{fmt(p.todayMacros?.protein ?? state.goals.protein, 0)}</b><small>g protein</small></div>
        </div>
        {!p.goal && <button className="strip strip-button" onClick={p.openGoal}>Set your goal: your day in four numbers, every plate measured against them.</button>}
        {p.todayMacros && (
          <div className="plan-macros">
            <div><b>{p.todayMacros.fats}</b><small>g fat</small></div>
            <div><b>{p.todayMacros.carbs}</b><small>g carbs</small></div>
            <div />
          </div>
        )}
        {p.review?.status === "change" && <button className="strip strip-button review-ask" onClick={() => p.openMenu("goal")}>{p.review.by || p.coachLabel} asks you to change {p.review.kept?.length === 1 ? "one number" : "your numbers"} ›</button>}
        {p.profile.coachId && !byCoach && <button className="plan-source coach-line" onClick={() => p.openMenu("coach")} aria-label="Open your coach">{p.coachLabel} <ChevronRight size={12} /></button>}
        {follow && planned && p.day.plan && !changing && (
          <div className="today-plan">
            <b className="today-date">{dateLine}<button className="icon today-pencil" aria-label="Change today's plan" onClick={() => { setDraft(p.day.plan!); setChanging(true); }}><Pencil size={16} /></button></b>
            <span className="today-what">{p.day.plan.kind === "rest" && !p.day.plan.pe ? "No training today." : `${todayLine(p.day.plan)}. ${LOAD_DAY[loadOf(p.day.plan)]}`}</span>
            <small>{p.day.source === "today" ? "Changed for today only. Your Weekly plan stays the same." : "If today goes differently, tap the pencil. The numbers follow, the Weekly plan stays."}</small>
            {p.day.source === "today" && <button className="link" onClick={() => p.setTodayPlan(null)}>Back to the Weekly plan</button>}
          </div>
        )}
        {follow && changing && draft && (
          <div className="today-plan">
            <b>{dateLine}, today only</b>
            <DayEditor minor={minor} weekdays={wkd} peOn={peOn} value={draft} onChange={setDraft} />
            <div className="actions">
              <button className="pill pill-primary action-main" onClick={() => { p.setTodayPlan(draft); setChanging(false); }}>Save for today</button>
              <button className="link action-cancel" onClick={() => setChanging(false)}>Cancel</button>
            </div>
          </div>
        )}
        {follow && !planned && (
          <div className="today-plan">
            <b>{dateLine}</b>
            <small>What kind of day is it?</small>
            <div className="day-row">
              {DAY_TYPES.map((d) => <button key={d.id} className={`choice ${p.day.type === d.id ? "on" : ""}`} onClick={() => p.setDayType(d.id)}>{d.name}</button>)}
            </div>
            <button className="link" onClick={() => p.openMenu("week")}>Set your Weekly plan, and Chef Mealan won't need to ask ›</button>
          </div>
        )}
        {!follow && (
          <div className="today-plan">
            <b>{dateLine}</b>
            <small>Every day the same, one set of numbers. <button className="link" onClick={() => p.openMenu("goal")}>Change in Goal ›</button></small>
          </div>
        )}
      </section>
      {p.profile.role === "coach" && p.newShared > 0 && (
        <button className="strip strip-button" onClick={() => setTab("clients")}>{p.newShared} new {p.newShared === 1 ? "card" : "cards"} shared with you. Open Clients.</button>
      )}
      {/* What's cooking? (Y1 column 1, 10 October 2026): the kind of plate as a choice, then Scan. Recipes and Foods live on the bar. */}
      <section className="card cooking">
        <div className="card-top cooking-top"><span><ChefHat size={18} /> What's cooking?</span></div>
        <div className="cooking-kinds">
          <button className="choice" onClick={() => { p.setKind("meal"); setStep("in"); setTab("journey"); }}><Salad size={18} /> Meal</button>
          <button className="choice" onClick={() => { p.setKind("dessert"); setStep("in"); setTab("journey"); }}><IceCreamCone size={18} /> Dessert</button>
        </div>
        <button className="pill pill-tall" onClick={() => { p.setKind("meal"); setStep("in"); setTab("journey"); setMode("label"); setCamera(true); }}>
          <Camera size={20} /> Scan
        </button>
      </section>
      {inbox}
      <p className="label">Today's meals</p>
      <p className="small logged-line">{loggedLine(today, true)}</p>
      {today.logged.map((f) => (
        <section className={`card log-card ${f.photo ? "with-photo" : ""}`} key={f.id}>
          {f.photo && <img className="log-photo" src={f.photo} alt="" />}
          <div className="card-top"><span>{f.meal.title}</span><small>{new Date(f.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></div>
          <small>{f.meal.items.map((i) => `${fmt(i.grams, 0)} g ${i.food.name}`).join(" · ")}</small>
          {(() => { const a = aggregate(f.meal.items); return <small className="log-nums">{fmt(a.calories, 0)} kcal · {fmt(a.protein, 0)} g protein · {pdText(density(a.protein, a.calories))}{f.taste ? ` · ${f.taste}` : ""}{f.carry ? ` · ${({ light: "light and awake", fine: "fine after", heavy: "heavy, tired" } as const)[f.carry.how]}` : ""}</small>; })()}
          <div className="button-row log-actions">
            {f.recipeId
              ? <span className="pill pill-small pill-done"><Check size={14} /> In My recipes</span>
              : <button className="pill pill-small pill-primary" onClick={() => p.saveCardAsRecipe(f.id)}>Save in My recipes</button>}
            {p.profile.coachId && (f.shared
              ? <span className="pill pill-small pill-done"><Check size={14} /> Shared</span>
              : shareFor === f.id
                ? <>{([["look", "Look at this"], ["ok", "Was this OK?"], ["help", "Help me next time"]] as const).map(([k, l]) => (
                    <button key={k} className="pill pill-small" onClick={() => { p.shareCard(f.id, k); setShareFor(null); }}>{l}</button>
                  ))}<button className="link" onClick={() => setShareFor(null)}>Cancel</button></>
                : <button className="pill pill-small" onClick={() => setShareFor(f.id)}>Share with Coach</button>)}
          </div>
        </section>
      ))}
      {today.logged.filter(carryDue).map((f) => (
        <section className="card log-card carry-card" key={`carry-${f.id}`}>
          <div className="card-top"><span>How did it carry you?</span><small>30 min after {f.meal.title}</small></div>
          <div className="button-row" style={{ marginTop: 8 }}>
            {([["light", "Light and awake"], ["fine", "Fine"], ["heavy", "Heavy, tired"]] as const).map(([k, l]) => (
              <button key={k} className="pill pill-small" onClick={() => p.setCarry(f.id, k)}>{l}</button>
            ))}
          </div>
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
      <p className="label">The last few days</p>
      <section className="card days">
        {past.map((d) => (
          <div className="history-row" key={d.day.toISOString()}>
            <div><b>{dayLabel(d.day)}</b><small>{d.dayType ? dayNameAny(d.dayType) : "No kind of day was set"}</small></div>
            <div className="history-num"><small>{loggedLine(d, false)}</small></div>
          </div>
        ))}
      </section>
    </>
  );
}
