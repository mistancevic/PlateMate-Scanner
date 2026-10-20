import { Fragment, useEffect, useState } from "react";
import { Camera, ChevronRight, Check, Pencil, Plus, Utensils } from "lucide-react";
import { aggregate, density } from "../pilot";
import { fmt, fixed, pdText, pdVal, pdTag, pdRange } from "../ui";
import { COACH_NAME } from "../components/Mark";
import { bandOf, goalLabel } from "../goal";
import { DAY_TYPES, dayModeOf, dayNameAny, hasPlan, isMinor, lifestyleOf } from "../personal";
import { planLine, schoolLine, studyLine, loadOf, LOAD_DAY, weekdaysOf, dayKindOf, type PlanDay } from "../plan";
import { DayEditor } from "../components/DayEditor";
import { dayLog, loggedLine, daysAgo, dayLabel } from "../today";
import { X } from "lucide-react";
import { unreadNote } from "../coachNotes";
import type { AppApi, Filling } from "./api";
import { Picture, pictureOfRecipe } from "../components/MealPicture";
import { PlanRow } from "../components/PlanRow";
import { showPlanOn } from "./PlanScreen";
import { KnowCard, ReadyCard } from "../components/Measured";
import { slotsOf, slotsOn, rowsOf, trainingWhen, toMin } from "../slots";
import { closedSlots, WINDOW } from "../makeMeal";
import { answersFor } from "../unlogged";
import { dayFor, getDay } from "../personal";
import { ymd } from "../plan";
import { fitOf, type PlannedMeal } from "../planned";
import { dayRecord, planLine as planDayLine } from "../record";
import { log } from "../log";
import { closeDays, openedToday } from "../metrics";
import { coverIsDrawn, ownPhotosOf } from "../covers";
import { recipePhotosOf } from "../photos";
import { CARRY_WORDS, momentOf } from "../carry";
import { resizeImageBase64 } from "../utils/image";
import { CHEF_NAME } from "../components/Mark";
import type { Feedback, Meal } from "../pilot";

export function HomeScreen(p: AppApi) {
  // to the measured burn's card on Me, Goal (FT3, FT4)
  const toBurn = () => { p.openMenu("goal"); setTimeout(() => document.querySelector(".ft-burn")?.scrollIntoView({ block: "center" }), 350); };
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
  // the day against the plan (0.2.3): today's slots, what they hold, what is eaten, what came from outside
  const key = ymd(new Date());
  const slots = slotsOn(lifestyleOf(p.personal), p.personal.timesOn, ymd(new Date()));
  const held = p.planned[key] ?? {};
  const rec = dayRecord(slots, held, today.logged, key);
  // the counter (0.2.5+r17, board M): Today opened once a day, and the days before closed against the plan
  useEffect(() => {
    openedToday(key, (e) => log(e));
    closeDays({ today: new Date(), ymd, slots, planned: p.planned, logged: (d) => dayLog(state.feedback, d).logged, target: (d) => p.numbersFor(d), log: (e, data) => log(e, data) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const hasPlanToday = Object.keys(held).length > 0 || rec.eaten.length > 0;
  // R5 (0.2.42, Milan 17:23 to 19:00, board RS13): Today is the day against the plan. On top, today against the goal; under it,
  // by time and importance: what comes next, the batch, the plan, today's meals newest first, the last two days.
  const dayT = sumOf(today.logged.flatMap((f) => f.meal.items));
  const kT = p.todayKcal ?? state.goals.calories, pT = p.todayMacros?.protein ?? state.goals.protein;
  const closedNow = closedSlots(slots, rec, answersFor(key));
  const nowMin = new Date(now).getHours() * 60 + new Date(now).getMinutes();
  const openSlots = slots.filter((s) => !closedNow.has(s.id) && toMin(s.time) + WINDOW.after >= nowMin);
  const next = openSlots[0] ?? null;
  const left = Math.round(kT - dayT.kcal), pLeft = Math.max(0, Math.round(pT - dayT.protein));
  // which meal a meal was: its slot, the meal it was logged as (a snack, or the meal the plate was sized for), else the meal
  // nearest its time within two hours, else a snack
  const whichOf = (f: Feedback) => {
    if (f.slot?.name) return f.slot.name;
    if (f.which) return f.which;
    const d = new Date(f.createdAt), t = d.getHours() * 60 + d.getMinutes();
    return slots.filter((s) => Math.abs(t - toMin(s.time)) <= 120).sort((x, y) => Math.abs(t - toMin(x.time)) - Math.abs(t - toMin(y.time)))[0]?.name ?? "Snack";
  };
  const newest = [...today.logged].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  // R20: the moment a meal was eaten in, kept with the answer: the meal, a training or rest day, before or after training
  const [changingCarry, setChangingCarry] = useState<string | null>(null);
  const todayPlan = dayFor(p.personal, new Date())?.day ?? getDay(p.personal, new Date()).plan ?? null;
  const carryMoment = (f: Feedback) => { const w = trainingWhen(todayPlan); return momentOf(whichOf(f), new Date(f.createdAt), todayPlan ? { kind: todayPlan.kind, time: w && w.sort !== "23:59" ? w.sort : null } : null); };
  const makeNext = () => { if (!next) return; if (held[next.id] && !held[next.id].skipped) { eatFrom(next.id); return; } p.setPick(`meal:${next.id}`); setStep("in"); setTab("journey"); };
  const logMeal = () => { p.setPick(null); setStep("in"); setTab("journey"); };
  // I ate one asks which meal it is (Q2): the meals still to come, and a snack; the meal by the clock is picked
  const [asking, setAsking] = useState<string | null>(null);
  const [asWhich, setAsWhich] = useState<string>("snack");
  const askFor = (id: string) => { setAsking(id); setAsWhich(next && nowMin >= toMin(next.time) - WINDOW.before ? next.id : "snack"); };
  const asSlot = openSlots.find((s) => s.id === asWhich);
  const unit = p.personal.pdUnit === "pct" ? "pct" : "pd";
  const SOURCE: Record<PlannedMeal["source"], string> = { mine: "my recipe", coach: "the coach's recipe", starter: "starter", plate: "made on the Plate" };
  const eatFrom = (slotId: string) => {
    const slot = slots.find((x) => x.id === slotId)!, m = held[slotId];
    const f: Filling = { date: key, slotId, name: slot.name, time: slot.time, dayName: "today", mealId: m.mealId, mode: "eat" };
    p.fillOnPlate(f, m.items ? { id: m.mealId ?? "", title: m.title, items: m.items, portion: m.portion ?? 0, savedAt: "" } : null, m.title);
  };
  // R16: the next slot's planned meal, and a meal kept for later today (a batch's rest is not Today's)
  const nextHeld = next && held[next.id] && !held[next.id].skipped ? held[next.id] : null;
  const nextRecipe = nextHeld?.mealId ? state.meals.find((m) => m.id === nextHeld.mealId) ?? null : null;
  const kept = today.prepared.filter((f) => !((f.left ?? 0) > 0));
  // R19 (0.2.47, board RS18): one rule for meals. A tap shows the meal (its page, with the slot on top); actions are buttons
  // and swipes. A planned meal without a recipe (a starter) opens the Plate, where Chef Mealan makes it.
  const recipeOf = (m: PlannedMeal | undefined) => (m?.mealId ? state.meals.find((x) => x.id === m.mealId) ?? null : null);
  const openSlotMeal = (date: string, sl: { id: string; name: string; time: string }, m: PlannedMeal, orElse: () => void) => {
    const r = recipeOf(m); if (r) p.openMeal(r.id, { tab: "home", slot: { date, slotId: sl.id, name: sl.name, time: sl.time } }); else orElse();
  };
  const swapOn = (date: string, slotId: string) => { showPlanOn(date, slotId); setTab("plan"); };
  // tomorrow, for the line once today is done
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const tTraining = dayFor(p.personal, tomorrow)?.day ?? getDay(p.personal, tomorrow).plan ?? null;
  const tWhen = trainingWhen(tTraining); void rowsOf;
  const tHeld = Object.keys(p.planned[ymd(tomorrow)] ?? {}).length;
  // R18 (0.2.46, Milan 23:22, board RS17): the plan card says which day it is; tomorrow has the same card, under today's
  // meals; when tomorrow is planned you are asked to check it, not to plan it; both open Plan on tomorrow
  const tKey = ymd(tomorrow), tPlan = p.planned[tKey] ?? {};
  const tSlots = slotsOn(lifestyleOf(p.personal), p.personal.timesOn, tKey);
  const toTomorrow = () => { showPlanOn(tKey); setTab("plan"); };
  const longDate = (d: Date) => d.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" });
  const tWeekday = tomorrow.toLocaleDateString("en", { weekday: "long" });
  // the day went by the plan only when no slot of today is still to come (still open, as Next counts it)
  const emptyAhead = rec.empty.filter((s) => openSlots.includes(s));
  const dayDone = rec.done && emptyAhead.length === 0;
  const past = [1, 2].map((n) => dayLog(state.feedback, daysAgo(n)));
  // 0.2.57 (board DS6, L): what is left, inside the Next card; once the day is done, tomorrow's first planned meal
  const leftLine = next
    ? (left > 150 ? `About ${fmt(left, 0)} kcal and ${fmt(pLeft, 0)} g protein left for today.` : `You are at your day's kcal. A light ${next.name.toLowerCase()} keeps you there.`)
    : today.logged.length ? (left >= 0 ? `${fmt(left, 0)} kcal left today, if you want a snack.` : `${fmt(-left, 0)} kcal over today.`) : "Nothing logged today.";
  const tFirst = (() => { for (const sl of tSlots) { const m = tPlan[sl.id]; if (m && !m.skipped) return { sl, m }; } return null; })();
  const follow = dayModeOf(p.personal) === "each";
  // The day pills show while the day is still assumed, and again after Change, until a pill is tapped.
  const [changing, setChanging] = useState(false);
  const [draft, setDraft] = useState<PlanDay | null>(null);
  // with a Training week Today reads it; without one, Today asks what kind of day it is
  const planned = hasPlan(p.personal);
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
      {/* R24 (0.2.51, board RS24): the day stays in sight while you scroll: Today, Tomorrow, Earlier */}
      <DayBand day="Today" date={longDate(new Date(now))} />
      <section className="plan">
        {/* the goal is the headline and the way in; whose and who set it is one small line above it */}
        <div className="plan-goal">
          <small>{clientName ? `${clientName}'s goal` : "My goal"}{byCoach ? `, set by ${setBy}` : ""}</small>
          <button className="plan-goal-name" onClick={() => p.openMenu("goal")} aria-label="Open my goal">{bandName || "My goal"} <ChevronRight size={22} /></button>
        </div>
        <small className="day-against"><b>Today so far, against your goal</b></small>
        <div className="plan-row">
          <div><b>{dayT.kcal > 0 ? pdVal(density(dayT.protein, dayT.kcal)) : "0"}</b><small>{pdTag()} today, target {pdVal(p.dayPd)}</small></div>
          <div><b>{fmt(dayT.kcal, 0)}</b><small>of {fmt(kT, 0)} kcal{!follow ? "" : p.day.source === "assumed" ? ", week's average" : " today"}</small></div>
          <div><b>{fmt(dayT.protein, 0)}</b><small>of {fmt(pT, 0)} g protein</small></div>
        </div>
        {!p.goal && <button className="strip strip-button" onClick={p.openGoal}>Set your goal: your day in four numbers, every plate measured against them.</button>}
        {p.todayMacros && (
          <div className="plan-macros">
            <div><b>{fmt(dayT.fats, 0)}{dayT.gap ? "+" : ""}</b><small>of {p.todayMacros.fats} g fat</small></div>
            <div><b>{fmt(dayT.carbs, 0)}{dayT.gap ? "+" : ""}</b><small>of {p.todayMacros.carbs} g carbs</small></div>
            <div />
          </div>
        )}
        {/* 0.2.56 (board DS4, F, Milan 08:49 to 08:58): not "at least" in the number; a plus, and one note of value under the
            numbers: why they are not complete and which food; the name of a food in your foods opens it there, to add the values;
            a food that lives only in a recipe is named, not linked, since nothing can add its values yet */}
        {p.todayMacros && dayT.missing.length > 0 && (
          <small className="macro-gap">Why the +: {dayT.missing.map((m, k) => <span key={m.id}>{k ? (k === dayT.missing.length - 1 ? " and " : ", ") : ""}{state.foods.some((x) => x.id === m.id) ? <button type="button" className="link in-inline" onClick={() => p.openFood(m.id)}>{m.name}</button> : m.name}</span>)} {dayT.missing.length === 1 ? "has" : "have"} no {dayT.missing.every((m) => m.what === dayT.missing[0].what) ? dayT.missing[0].what : "fat or carbs"} value, so {dayT.missing.every((m) => m.what === dayT.missing[0].what) && dayT.missing[0].what !== "fat or carbs" ? dayT.missing[0].what : "fat and carbs"} {dayT.missing.every((m) => m.what === dayT.missing[0].what) && dayT.missing[0].what !== "fat or carbs" ? "is" : "are"} counted without {dayT.missing.length === 1 ? "it" : "them"}. The real numbers are higher.</small>
        )}
        {p.review?.status === "change" && <button className="strip strip-button review-ask" onClick={() => p.openMenu("goal")}>{p.review.by || p.coachLabel} asks you to change {p.review.kept?.length === 1 ? "one number" : "your numbers"} ›</button>}
        {p.profile.coachId && !byCoach && <button className="plan-source coach-line" onClick={() => p.openMenu("coach")} aria-label="Open your coach">{p.coachLabel} <ChevronRight size={12} /></button>}
        {follow && planned && p.day.plan && !changing && (
          <div className="today-plan">
            <b className="today-date">Kind of day<button className="icon today-pencil" aria-label="Change today's plan" onClick={() => { setDraft(p.day.plan!); setChanging(true); }}><Pencil size={16} /></button></b>
            <span className="today-what">{p.day.plan.kind === "rest" && !p.day.plan.pe ? "No training today." : `${todayLine(p.day.plan)}. ${LOAD_DAY[loadOf(p.day.plan)]}`}</span>
            <small>{p.day.source === "today" ? "Changed for today only. Your Training week stays the same." : "If today goes differently, tap the pencil. The numbers follow, the Training week stays."}</small>
            {p.day.source === "today" && <button className="link" onClick={() => p.setTodayPlan(null)}>Back to the Training week</button>}
          </div>
        )}
        {follow && changing && draft && (
          <div className="today-plan">
            <b>Kind of day, today only</b>
            <DayEditor minor={minor} weekdays={wkd} peOn={peOn} value={draft} onChange={setDraft} />
            <div className="actions">
              <button className="pill pill-primary action-main" onClick={() => { p.setTodayPlan(draft); setChanging(false); }}>Save for today</button>
              <button className="link action-cancel" onClick={() => setChanging(false)}>Cancel</button>
            </div>
          </div>
        )}
        {follow && !planned && (
          <div className="today-plan">
            <b>What kind of day is it?</b>
            <div className="day-row">
              {DAY_TYPES.map((d) => <button key={d.id} className={`choice ${p.day.type === d.id ? "on" : ""}`} onClick={() => p.setDayType(d.id)}>{d.name}</button>)}
            </div>
            <button className="link" onClick={() => p.openMenu("week")}>Set your Training week, and Chef Mealan won't need to ask ›</button>
          </div>
        )}
        {/* 0.2.57 (board DS6, I, Milan 10:21 to 10:46): no day part. The day header has the date; Maintain › opens Goal; one set
            of numbers every day has nothing to say here. Where training and rest days differ, the kind of day stays, without the date. */}
      </section>
      {p.profile.role === "coach" && p.newShared > 0 && (
        <button className="strip strip-button" onClick={() => setTab("clients")}>{p.newShared} new {p.newShared === 1 ? "card" : "cards"} shared with you. Open Clients.</button>
      )}
      {/* the coach's note, once (0.2.6, canvas board CW, CW5): Got it keeps it in My coach; Change the numbers opens Goal */}
      {(() => {
        const n = unreadNote(p.coachNotes);
        if (!n) return null;
        const who = n.name ? `Coach ${n.name}` : p.coachLabel;
        const at = new Date(n.at);
        return (
          <section className="coach-note coach-week-note" aria-label={`A note from ${who}`}>
            <small>{who}, {at.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }).replace(",", "")}, {at.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</small>
            <b>{n.verdict === "change" ? `${who} asks you to change your numbers` : "Your week: approved ✓"}</b>
            {n.text && <span className="coach-note-text">{n.text}</span>}
            <div className="button-row">
              {n.verdict === "change"
                ? <button className="pill pill-small pill-primary" onClick={() => { p.gotNote(n.at); p.openMenu("goal"); }}>Look at my numbers</button>
                : <button className="pill pill-small pill-primary" onClick={() => p.gotNote(n.at)}>Got it</button>}
              <button className="pill pill-small" onClick={() => { const r = window.prompt(`Reply to ${who}`); if (r && r.trim()) { p.replyToCoach(r.trim(), n.at); p.notify(`Sent to ${who}.`); } }}>Reply to {who}</button>
            </div>
          </section>
        );
      })()}
      {/* What's in the plan (0.2.0, canvas S and H): the day's meals as rows once the Plan holds them (0.2.2); until then one row, Go to Plan. Then Scan, blue, the camera for what the plan is not. */}
      {/* The first two weeks (0.2.7, board FT): FT1 while the burn is being measured, FT2 once on the day it is ready */}
      {p.measured?.ready && p.measured.start && !p.measuredSeen && <ReadyCard m={p.measured} formulaKcal={p.formulaKcal} seeGoal={() => { p.seeMeasured(); toBurn(); }} gotIt={p.seeMeasured} />}
      {/* R5: what comes next, the one main action; 0.2.57 (board DS6, L, Milan 10:53 to 11:02): Next is always one card, its
          heading inside, the line inside; before a meal, the meal; nothing planned, its two ways; the day done, tomorrow's first meal */}
      <section className="next-meal">
        {next && nextHeld
          ? <div className="card next-planned" role="button" tabIndex={0} aria-label={`${nextHeld.title}: see the meal`}
              onClick={(e) => { if ((e.target as HTMLElement).closest(".button-row")) return; openSlotMeal(key, next, nextHeld, makeNext); }}
              onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) { e.preventDefault(); openSlotMeal(key, next, nextHeld, makeNext); } }}>
              <p className="label next-head">Next: {next.name.toLowerCase()}, {next.time}</p>
              <Picture src={pictureOfRecipe(nextRecipe)} />
              <div className="next-planned-text"><b>{nextHeld.title}</b><small>As planned · {fmt(nextHeld.kcal, 0)} kcal · {fmt(nextHeld.protein, 0)} g protein · {pdText(density(nextHeld.protein, nextHeld.kcal))}</small></div>
              <ChevronRight size={20} className="next-planned-go" />
              <small className="next-line">{leftLine}</small>
              <div className="button-row next-planned-acts">
                {nextHeld.items?.length
                  ? <><button type="button" className="pill pill-small pill-primary" onClick={() => p.logPlanned(nextHeld, { date: key, slotId: next.id, name: next.name, time: next.time })}><Check size={14} /> I ate it</button>
                    <button type="button" className="pill pill-small" onClick={() => eatFrom(next.id)}>Change it</button></>
                  : <button type="button" className="pill pill-small pill-primary" onClick={makeNext}>Make it on the Plate</button>}
              </div>
            </div>
          : next
            // 0.2.54, design system rule D (board DS2): Today has no wide button. A next meal with nothing planned is a card, with its two ways
            ? <div className="card next-planned next-open">
                <p className="label next-head">Next: {next.name.toLowerCase()}, {next.time}</p>
                <div className="next-planned-text"><b>Nothing planned yet</b><small>Pick one of your meals, or make one on the Plate.</small></div>
                <small className="next-line">{leftLine}</small>
                <div className="button-row next-planned-acts">
                  <button type="button" className="pill pill-small pill-primary" onClick={() => swapOn(key, next.id)}>Pick a meal</button>
                  <button type="button" className="pill pill-small" onClick={makeNext}>Make it on the Plate</button>
                </div>
              </div>
            : <div className="card next-planned next-open next-done">
                <p className="label next-head">Next: tomorrow</p>
                {tFirst
                  ? <PlanRow className="plan-row-link plan-slot-row" label={`${tFirst.sl.name}, ${tFirst.sl.time}`} title={tFirst.m.title} photo={pictureOfRecipe(recipeOf(tFirst.m))}
                      ariaLabel={`${tFirst.sl.name} tomorrow, ${tFirst.m.title}`} sub={<>{SOURCE[tFirst.m.source]}</>}
                      onOpen={() => openSlotMeal(tKey, tFirst.sl, tFirst.m, toTomorrow)} onSwap={() => swapOn(tKey, tFirst.sl.id)} onRight={() => p.fill(tKey, tFirst.sl.id, { ...tFirst.m, skipped: true })} rightLabel="Skip" swapName={`Swap ${tFirst.sl.name.toLowerCase()} tomorrow`} rightName={`Skip ${tFirst.sl.name.toLowerCase()} tomorrow`} />
                  : <div className="next-planned-text"><b>Nothing planned for tomorrow yet</b><small>Set {tWeekday}'s meals, and they wait here.</small></div>}
                <small className="next-line">{leftLine}</small>
                <div className="button-row next-planned-acts">
                  <button type="button" className="pill pill-small pill-primary" onClick={toTomorrow}>{tHeld ? "Check tomorrow" : "Plan tomorrow"}</button>
                </div>
              </div>}
      </section>
      {/* R16 (0.2.44, Milan 21:56): what is left of a batch is not Today's: it may go to the family or to work. A batch reaches
          a day through the plan. A meal kept for later today still waits here. */}
      {kept.length > 0 && (
        <>
          <p className="label">{next ? "Or one from your batch" : "For tomorrow, from your batch"}</p>
          {kept.map((f) => {
            const a = sumOf(f.meal.items), r = recipeOfCard(f, state.meals), many = (f.left ?? 0) > 0;
            return (
              <section className="card log-card" key={f.id}>
                <div className="card-top"><span>{f.meal.title}</span>{many && <small className="left-tag">{f.left} left</small>}</div>
                <small>{many ? `Each one ${f.leftOf ?? "portion"}: ` : ""}{fmt(a.kcal, 0)} kcal · {fmt(a.protein, 0)} g protein{r && <> · <button className="link in-inline" onClick={() => p.openRecipePage(r.id)}>Open the recipe ›</button></>}</small>
                {asking === f.id && (
                  <div className="which-meal">
                    <small className="muted"><b>Which meal is it?</b></small>
                    <div className="moments" role="radiogroup" aria-label="Which meal is it?">
                      {openSlots.map((sl) => <button key={sl.id} className={`choice ${asWhich === sl.id ? "on" : ""}`} aria-pressed={asWhich === sl.id} onClick={() => setAsWhich(sl.id)}>{sl.name}, {sl.time}</button>)}
                      <button className={`choice ${asWhich === "snack" ? "on" : ""}`} aria-pressed={asWhich === "snack"} onClick={() => setAsWhich("snack")}>Snack</button>
                    </div>
                    <small className="muted">{asSlot ? `It counts as your ${asSlot.name.toLowerCase()}.` : "It counts as a snack."}</small>
                  </div>
                )}
                <div className="button-row" style={{ marginTop: 8 }}>
                  {asking === f.id
                    ? <button className="pill pill-small pill-primary" onClick={() => { p.settleCard(f.id, "eaten", asSlot ? { slot: { date: key, slotId: asSlot.id, name: asSlot.name, time: asSlot.time } } : { which: "Snack" }); setAsking(null); }}><Check size={14} /> Log it</button>
                    : <button className="pill pill-small pill-primary" onClick={() => askFor(f.id)}><Check size={14} /> {many ? "I ate one" : "I ate it"}</button>}
                  <button className="pill pill-small" onClick={() => { setAsking(null); p.settleCard(f.id, "not-used"); }}><X size={14} /> {many ? "Remove" : "Not today"}</button>
                </div>
              </section>
            );
          })}
        </>
      )}
      {inbox}
      <section className="card cooking">
        <p className="card-head">What's in the plan</p>
        {!hasPlanToday && (
          <button className="menu-row plan-row-link" onClick={() => setTab("plan")}>
            <div className="menu-row-text"><small>Nothing planned so far</small><b>Go to Plan</b><small>Set the day's meals, and they wait here</small></div><ChevronRight size={18} />
          </button>
        )}
        {hasPlanToday && rec.done && !dayDone && <small className="muted plan-eaten">{rec.eaten.map((f) => f.slot!.name).join(", ")} eaten, by the plan.</small>}
        {dayDone && (
          <button className="menu-row plan-row-link" onClick={() => setTab("plan")}>
            <div className="menu-row-text"><small>{rec.skipped.length ? `${rec.byPlan} eaten, ${rec.skipped.length} skipped on purpose` : `All ${rec.planned === 1 ? "one slot" : `${rec.planned} slots`} eaten`}</small><b>Today went {rec.extras.length ? "mostly " : ""}by the plan</b></div><ChevronRight size={18} />
          </button>
        )}
        {/* 0.2.6 (canvas board CW, CW7): each planned meal can be skipped on purpose; a skipped one stays with Undo until midnight */}
        {hasPlanToday && slots.filter((sl) => (!rec.done && rec.open.includes(sl)) || rec.skipped.includes(sl)).map((sl) => {
          const m = held[sl.id];
          if (m.skipped) return (
            <div key={sl.id} className="menu-row plan-row-link plan-slot-row plan-slot-skipped">
              <div className="menu-row-text"><small>{sl.name}, {sl.time}</small><b>{m.title}</b><small className="skipped-mark">Skipped on purpose</small></div>
              <button type="button" className="link plan-skip on" onClick={() => p.fill(key, sl.id, { ...m, skipped: undefined })}>Undo</button>
            </div>
          );
          const fit = fitOf(m, p.dayPd, unit);
          // R24 (0.2.51, board RS24): a planned meal whose time has passed asks, under its row, the card's full width
          const missed = sl.id !== next?.id && toMin(sl.time) <= nowMin;
          return (
            <Fragment key={sl.id}>
            <PlanRow className="plan-row-link plan-slot-row" label={`${sl.name}, ${sl.time}`} title={m.title} photo={pictureOfRecipe(recipeOf(m))}
              ariaLabel={`${sl.name} at ${sl.time}, ${m.title}`}
              sub={<>{SOURCE[m.source]}{fit.state === "fits" ? <span className="fit-ok"> · fits</span> : fit.state === "under" ? <span className="fit-under"> · {fit.text}</span> : null}</>}
              onOpen={() => openSlotMeal(key, sl, m, () => eatFrom(sl.id))} onSwap={() => swapOn(key, sl.id)} onRight={() => p.fill(key, sl.id, { ...m, skipped: true })} rightLabel="Skip" swapName={`Swap ${sl.name.toLowerCase()}`} rightName={`Skip ${sl.name.toLowerCase()} on purpose`} />
            {missed && (
              <div className="missed-ask" role="group" aria-label={`${sl.name}, ${sl.time}: did you have it?`}>
                <small>{sl.time} has passed. Did you have it?</small>
                <div className="button-row">
                  {m.items?.length
                    ? <button type="button" className="pill pill-small pill-primary" onClick={() => p.logPlanned(m, { date: key, slotId: sl.id, name: sl.name, time: sl.time })}><Check size={14} /> I ate it</button>
                    : null}
                  <button type="button" className="pill pill-small" onClick={() => eatFrom(sl.id)}>{m.items?.length ? "Change it" : "Make it on the Plate"}</button>
                  <button type="button" className="pill pill-small" onClick={() => p.fill(key, sl.id, { ...m, skipped: true })}>Skipped it</button>
                </div>
              </div>
            )}
            </Fragment>
          );
        })}
        {hasPlanToday && !dayDone && rec.empty.length > 0 && (
          <button className="menu-row plan-row-link" onClick={() => setTab("plan")}>
            <div className="menu-row-text"><small>{rec.empty.map((x) => x.name).join(", ")}</small><b>Pick a meal</b><small>{rec.empty.length === 1 ? "One slot open" : `${rec.empty.length} slots open`} · Go to Plan</small></div><ChevronRight size={18} />
          </button>
        )}
      </section>
      {/* 0.2.57 (board DS6, K): no record box; the plan card's row says how the day went, Today's meals says the extras */}
      <section className="card meals-card" aria-label="Today's meals">
      <p className="card-head">Today's meals</p>
      <p className="small logged-line">{hasPlanToday ? planDayLine({ ...rec, done: dayDone }, p.todayKcal) : loggedLine(today, true)}</p>
      {newest.map((f) => {
        const a = sumOf(f.meal.items), r = recipeOfCard(f, state.meals);
        return [
          <div className={`log-card meal-row with-photo ${r ? "log-card-open" : ""}`} key={f.id} onClick={(e) => { if (!r || (e.target as HTMLElement).closest("button,input,a,label,textarea")) return; p.openMeal(r.id, { tab: "home" }); }}>
            <Picture src={f.photo ?? pictureOfRecipe(r)} />
            <div className="card-top"><span>{f.meal.title}</span><small>{new Date(f.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></div>
            <small className="meal-which"><b>{whichOf(f)}</b>{r && <> · <button className="link in-inline" onClick={() => p.openRecipePage(r.id)}>Open the recipe ›</button></>}</small>
            <small className="log-nums">{fmt(a.kcal, 0)} kcal · {fmt(a.protein, 0)} g protein{a.gap ? "" : ` · ${fmt(a.fats, 0)} g fat · ${fmt(a.carbs, 0)} g carbs`} · {pdText(density(a.protein, a.kcal))}</small>
            {hasPlanToday && (f.slot
              ? <small className="plan-mark fit-ok">By the plan</small>
              : <small className="plan-mark fit-under">Off the plan{rec.open.length && f.id === today.logged[today.logged.length - 1]?.id ? " · the next meal leans protein" : ""}</small>)}
            {(!r || p.profile.coachId) && (
              <div className="button-row log-actions">
                {!r && <button className="pill pill-small" onClick={() => p.saveCardAsRecipe(f.id)}>Save in My recipes</button>}
            {p.profile.coachId && (f.shared
                  ? <span className="pill pill-small pill-done"><Check size={14} /> Shared</span>
                  : shareFor === f.id
                    ? <>{([["look", "Look at this"], ["ok", "Was this OK?"], ["help", "Help me next time"]] as const).map(([k, l]) => (
                        <button key={k} className="pill pill-small" onClick={() => { p.shareCard(f.id, k); setShareFor(null); }}>{l}</button>
                      ))}<button className="link" onClick={() => setShareFor(null)}>Cancel</button></>
                    : <button className="pill pill-small" onClick={() => setShareFor(f.id)}>Share with Coach</button>)}
              </div>
            )}
            <CoverAsk f={f} recipe={r} p={p} />
            {/* R20 (0.2.48, board RS19): the question on the meal's own card, full width under the photo and the numbers; the
                answer stays on it, with Change for a wrong tap */}
            {(carryDue(f) || changingCarry === f.id)
              ? <div className="carry-in" aria-label={`How did ${f.meal.title} carry you?`}>
                  <small className="carry-q">How did it carry you?</small>
                  <div className="carry-acts">
                    {(["light", "fine", "heavy"] as const).map((k) => (
                      <button key={k} type="button" className={`choice${f.carry?.how === k ? " on" : ""}`} onClick={() => { p.setCarry(f.id, k, carryMoment(f)); setChangingCarry(null); }}>{CARRY_WORDS[k]}</button>
                    ))}
                  </div>
                </div>
              : f.carry && <small className="carry-in carry-done">Carried you: <b>{CARRY_WORDS[f.carry.how]}</b> · <button type="button" className="link in-inline" onClick={() => setChangingCarry(f.id)}>Change</button></small>}
          </div>,
        ];
      })}
      <div className="button-row meals-acts"><button type="button" className="pill pill-small" onClick={logMeal}><Plus size={14} /> Log a meal</button></div>
      </section>
      {/* R5: Getting to know you is about logging; R24: it stays with today */}
      {p.measured?.phase && <KnowCard m={p.measured} openGoal={toBurn} />}
      {/* R18: tomorrow, the same card; its rows and its button open Plan on tomorrow; R24: under its own band */}
      <DayBand day="Tomorrow" date={longDate(tomorrow)} />
      <section className="card tomorrow-plan" aria-label="Tomorrow's plan">
        <p className="card-head">What's in the plan</p>
        {tWhen && <small className="muted plan-when">{tWhen.phrase.charAt(0).toUpperCase() + tWhen.phrase.slice(1)}</small>}
        {tHeld > 0 && tSlots.map((sl) => {
          const m = tPlan[sl.id];
          const fit = m ? fitOf(m, p.dayPd, unit) : null;
          if (m && !m.skipped) return (
            <PlanRow key={sl.id} className="plan-row-link plan-slot-row" label={`${sl.name}, ${sl.time}`} title={m.title} photo={pictureOfRecipe(recipeOf(m))}
              ariaLabel={`${sl.name} tomorrow, ${m.title}`}
              sub={<>{SOURCE[m.source]}{fit?.state === "fits" ? <span className="fit-ok"> · fits</span> : fit?.state === "under" ? <span className="fit-under"> · {fit.text}</span> : null}</>}
              onOpen={() => openSlotMeal(tKey, sl, m, toTomorrow)} onSwap={() => swapOn(tKey, sl.id)} onRight={() => p.fill(tKey, sl.id, { ...m, skipped: true })} rightLabel="Skip" swapName={`Swap ${sl.name.toLowerCase()} tomorrow`} rightName={`Skip ${sl.name.toLowerCase()} tomorrow`} />
          );
          return (
            <button key={sl.id} type="button" className="menu-row plan-row-link plan-slot-row" aria-label={`${sl.name} tomorrow, ${m ? m.title : "pick a meal"}`} onClick={() => (m ? toTomorrow() : swapOn(tKey, sl.id))}>
              <div className="menu-row-text"><small>{sl.name}, {sl.time}</small>{m ? <b>{m.title}</b> : <b className="plan-pick">Pick a meal</b>}
                <small>{!m ? "One slot open" : "Skipped on purpose"}</small></div>
              <ChevronRight size={18} />
            </button>
          );
        })}
        <button type="button" className="menu-row plan-row-link" onClick={toTomorrow}>
          <div className="menu-row-text"><b>{tHeld ? "Check tomorrow" : "Plan tomorrow"}</b><small>{tHeld ? `${Math.min(tHeld, tSlots.length)} of ${tSlots.length} planned · Plan, ${tWeekday}` : `Nothing planned so far · Set ${tWeekday}'s meals`}</small></div><ChevronRight size={18} />
        </button>
      </section>
      {/* 0.2.57 (board DS7, N, Milan 11:26): Earlier keeps its name; two day cards, the same component, each with its exact day;
          the row opens that day in Plan, its meals against its plan; older days are in Plan */}
      <DayBand day="Earlier" date="the last two days" />
      <div className="days" aria-label="The last two days">
        {past.map((d) => {
          const dk = ymd(d.day), dHeld = p.planned[dk];
          const dRec = dHeld && Object.keys(dHeld).length ? dayRecord(slotsOn(lifestyleOf(p.personal), p.personal.timesOn, dk), dHeld, d.logged, dk) : null;
          const head = `${dayLabel(d.day) === "Yesterday" ? "Yesterday, " : ""}${d.day.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}`;
          return (
            <section className="card day-card" key={dk} aria-label={head}>
              <p className="card-head">{head}</p>
              <button type="button" className="menu-row plan-row-link" onClick={() => { showPlanOn(dk); setTab("plan"); }}>
                <div className="menu-row-text"><small>{d.dayType ? dayNameAny(d.dayType) : "No kind of day was set"}</small><b>{dRec ? planDayLine({ ...dRec, done: true }, p.numbersFor(d.day)?.kcal ?? null) : loggedLine(d, false)}</b><small>See the day against its plan</small></div><ChevronRight size={18} />
              </button>
            </section>
          );
        })}
        <p className="older-link"><button type="button" className="link" onClick={() => setTab("plan")}>Older days are in Plan ›</button></p>
      </div>
    </>
  );
}
// R24 (0.2.51, board RS24): a dark band with the day and its date, on top while you scroll through that day
function DayBand({ day, date }: { day: string; date: string }) {
  return <div className="day-band" role="heading" aria-level={2}><b>{day}</b><span>{date}</span></div>;
}
// R5: a list's numbers; fat and carbs count what is known, and gap says a food has no value for them;
// 0.2.56 (board DS4, F): missing names those foods, once each, so the note under the numbers can say which
function sumOf(items: Feedback["meal"]["items"]) {
  const t = { kcal: 0, protein: 0, fats: 0, carbs: 0, gap: false, missing: [] as { id: string; name: string; what: string }[] };
  for (const i of items) { if (!(i.grams > 0)) continue; const k = i.grams / 100; t.kcal += k * (i.food.calories ?? 0); t.protein += k * (i.food.protein ?? 0); if (i.food.fats == null || i.food.carbs == null) { t.gap = true; if (!t.missing.some((x) => x.id === i.food.id)) t.missing.push({ id: i.food.id, name: i.food.name, what: i.food.fats == null && i.food.carbs == null ? "fat or carbs" : i.food.fats == null ? "fat" : "carbs" }); } t.fats += k * (i.food.fats ?? 0); t.carbs += k * (i.food.carbs ?? 0); }
  return t;
}

// The recipe a meal card is of: saved from the card, or the same recipe made again
const recipeOfCard = (f: Feedback, meals: Meal[]) => meals.find((m) => m.id === f.recipeId) ?? meals.find((m) => m.id === f.meal?.id || (!!f.meal?.title && m.title === f.meal.title)) ?? null;
// The photo ask (0.2.11, canvas board CO, CO1b and CO1c): you eat a recipe whose cover is drawn, and the card asks once, while
// the plate is in front of you. Not now ends it for this meal. With a photo: Use as cover, or Keep it just for me; a plate
// photo becomes the cover only when you say so.
function CoverAsk({ f, recipe, p }: { f: Feedback; recipe: Meal | null; p: AppApi }) {
  const [busy, setBusy] = useState(false);
  if (!recipe || f.status !== "eaten" || f.coverAsk || !coverIsDrawn(recipe) || ownPhotosOf(recipe).length) return null;
  if (f.photo) return (
    <div className="cover-ask">
      <small className="cover-ask-q">Use this photo as the cover of {recipe.title}?</small>
      <div className="button-row">
        <button className="pill pill-small pill-primary" onClick={() => p.useCardAsCover(f.id, recipe.id)}>Use as cover</button>
        <button className="pill pill-small" onClick={() => p.setCoverAsk(f.id, "kept")}>Keep it just for me</button>
      </div>
      <small className="muted">Just for you: it stays on this card and with the recipe's photos. Members never see it unless you pick it when sharing.</small>
    </div>
  );
  const take = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const raw = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsDataURL(file); });
      p.setCardPhoto(f.id, await resizeImageBase64(raw, 1080, 1080).catch(() => raw));
    } finally { setBusy(false); }
  };
  return (
    <div className="cover-ask">
      <div className="cover-ask-row"><img src={recipePhotosOf(recipe)[0]} alt="" /><small className="cover-ask-q">The cover of this recipe is a picture by {CHEF_NAME}. Take a photo of your plate? It can become the cover.</small></div>
      <div className="button-row">
        <label className={`pill pill-small pill-primary${busy ? " disabled" : ""}`}>Take a photo<input type="file" accept="image/*" capture="environment" hidden onChange={(e) => { const x = e.target.files?.[0]; e.target.value = ""; void take(x); }} /></label>
        <button className="link" onClick={() => p.setCoverAsk(f.id, "later")}>Not now</button>
      </div>
    </div>
  );
}
