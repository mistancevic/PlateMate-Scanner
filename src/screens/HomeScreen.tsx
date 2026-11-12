import { ChefLine } from "../components/ChefLine";
import { HowToToday } from "../components/HowTo";
import { w, wn, mealV, mealName, dateText, dateV, enOnly, phoneLoc, numLocale } from "../words";
import { locOf } from "../lang";
import { say } from "../chefScript";
import { CookStrip } from "../components/CookStrip";
import { travelOn, placeName as placeNameOf } from "../travel";
import { SetupRow } from "../components/SetupRow";
import { Fragment, useEffect, useState } from "react";
import { Camera, ChevronRight, Check, Pencil, Plus, Utensils } from "lucide-react";
import { aggregate, density } from "../pilot";
import { fmt, fixed, pdText, pdVal, pdTag, pdRange } from "../ui";
import { COACH_NAME } from "../components/Mark";
import { bandOf, goalName } from "../goal";
import { DAY_TYPES, dayModeOf, dayNameAny, hasPlan, isMinor, lifestyleOf } from "../personal";
import { planLine, schoolLine, studyLine, loadOf, LOAD_DAY, weekdaysOf, dayKindOf, type PlanDay } from "../plan";
import { DayEditor } from "../components/DayEditor";
import { dayLog, loggedLine, daysAgo, dayLabel } from "../today";
import { X } from "lucide-react";
import { unreadNote, REASONS, suggestTitle, waitingWords, cardWhen } from "../coachNotes";
import { needOf } from "../planned";
import { withTimeOn } from "../slots";
import type { AppApi, Filling } from "./api";
import { Picture, pictureOfRecipe } from "../components/MealPicture";
import { PlanRow } from "../components/PlanRow";
import { showPlanOn } from "./PlanScreen";
import { KnowCard, ReadyCard } from "../components/Measured";
import { slotsOf, slotsOn, rowsOf, trainingWhen, trainingShown, toMin, workHoursOf } from "../slots";
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
import { PastMeal } from "../components/PastMeal";
import { CARRY_WORDS, momentOf } from "../carry";
import { resizeImageBase64 } from "../utils/image";
import type { Feedback, Meal } from "../pilot";

export function HomeScreen(p: AppApi) {
  // to the measured burn's card on Me, Goal (FT3, FT4)
  const toBurn = () => { p.openMenu("goal"); setTimeout(() => document.querySelector(".ft-burn")?.scrollIntoView({ block: "center" }), 350); };
  const [shareFor, setShareFor] = useState<string | null>(null);
  // B139 (0.3.141, board Stories214): a meal logged here keeps Undo while you stay on Today; Change or delete opens the meal
  const [justLogged, setJustLogged] = useState<string[]>([]);
  const logged = (id: string | null | void) => { if (id) setJustLogged((xs) => [...xs, id]); };
  const [mealOpen, setMealOpen] = useState<string | null>(null);
  // the 30 minute check (Y1 column 13): the card shows once Today is open 30 minutes or more after the meal
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(t); }, []);
  const carryDue = (f: { createdAt: string; carry?: unknown; status: string }) => f.status === "eaten" && !f.carry && now - new Date(f.createdAt).getTime() >= 30 * 60_000;
  const carryLeft = (f: { createdAt: string }) => Math.max(1, Math.ceil((new Date(f.createdAt).getTime() + 30 * 60_000 - now) / 60_000));
  // DT218 (0.3.58): Go on scrolls to the meal's card with the question
  useEffect(() => {
    if (!p.carryNow) return;
    const t = window.setTimeout(() => document.querySelector(`[data-carry="${p.carryNow!.id}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
    return () => clearTimeout(t);
  }, [p.carryNow]);
  const { state, setTab, setStep, pdRef, setCamera, setMode, clientName, goal } = p;
  const bandName = goal?.band ? goalName(goal.band) : null;
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
  const SOURCE: Record<PlannedMeal["source"], string> = { mine: w("today.srcMine"), coach: w("today.srcCoach"), starter: w("today.srcStarter"), plate: w("today.srcPlate") };
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
  const longDate = (d: Date) => dateText(d, { weekday: "long", month: "long", day: "numeric" }, "en");
  const tWeekday = dateV(tomorrow, { weekday: "long" }, "en");
  // the day went by the plan only when no slot of today is still to come (still open, as Next counts it)
  const emptyAhead = rec.empty.filter((s) => openSlots.includes(s));
  const dayDone = rec.done && emptyAhead.length === 0;
  // DT143 (0.3.38, board Stories146; Anna's blind runs): Earlier starts on the person's first day: the welcome tap, the
  // first goal, the first meal logged or the first day planned, whichever came first; nothing before it
  const firstDay = [p.safety.adultAt, p.goal?.setAt, ...p.goalLog.map((g) => g.at)].filter((x): x is string => !!x).map((x) => ymd(new Date(x)))
    .concat(state.feedback.map((f) => ymd(new Date(f.createdAt))), Object.keys(p.planned)).sort()[0] ?? null;
  const past = [1, 2].map((n) => dayLog(state.feedback, daysAgo(n))).filter((d) => !firstDay || ymd(d.day) >= firstDay);
  // DT143: while today is empty (nothing planned, nothing eaten, nothing kept), one card with its three ways
  const emptyDay = !!next && !hasPlanToday && today.logged.length === 0 && kept.length === 0;
  const isFirstDay = !!firstDay && firstDay >= key;
  // 0.2.57 (board DS6, L): what is left, inside the Next card; once the day is done, tomorrow's first planned meal
  const leftLine = next
    ? (left > 150 ? w("today.left", { kcal: fmt(left, 0), protein: fmt(pLeft, 0) }) : w("today.atKcal", { meal: mealV(next.name, true) }))
    : today.logged.length ? (left >= 0 ? w("today.kcalLeftSnack", { kcal: fmt(left, 0) }) : w("today.kcalOver", { kcal: fmt(-left, 0) })) : w("today.nothingLoggedToday");
  const tFirst = (() => { for (const sl of tSlots) { const m = tPlan[sl.id]; if (m && !m.skipped) return { sl, m }; } return null; })();
  const follow = dayModeOf(p.personal) === "each";
  // The day pills show while the day is still assumed, and again after Change, until a pill is tapped.
  const [changing, setChanging] = useState(false);
  const [draft, setDraft] = useState<PlanDay | null>(null);
  // with a Training week Today reads it; without one, Today asks what kind of day it is
  const planned = hasPlan(p.personal);
  const inbox = p.inbox.map((it) => (
    <section className="card inbox" key={it.id}>
      <div className="card-top"><span>{w("today.sentRecipe", { coach: p.coachLabel })}</span><button className="link" onClick={() => p.dismissRecipe(it)}>{w("today.dismiss")}</button></div>
      <b>{it.meal?.title || w("today.recipe")}</b>
      <small>{(it.meal?.items ?? []).map((i: any) => `${Math.round(i.grams)} g ${i.food?.name}`).join(" · ")}</small>
      {it.note && <p className="client-note">“{it.note}”</p>}
      <div className="button-row" style={{ marginTop: 10 }}>
        <button className="pill pill-small pill-primary" onClick={() => p.takeRecipe(it, "make")}>{w("today.makeIt")}</button>
        <button className="pill pill-small" onClick={() => p.takeRecipe(it, "keep")}>{w("today.keepIt")}</button>
      </div>
    </section>
  ));
  const minor = isMinor(p.personal);
  // Release B: a study day says so; the editor offers the kinds of day Lifestyle allows
  const ls = lifestyleOf(p.personal), wkd = weekdaysOf(ls), peOn = !!ls.peWeek && ls.peWeek !== "none";
  const todayLine = (d: PlanDay) => (minor ? schoolLine(d) : dayKindOf(d, ls) === "study" ? studyLine({ ...d, study: true }) : planLine(d));
  const openedMeal = mealOpen ? p.state.feedback.find((f) => f.id === mealOpen) ?? null : null;
  if (openedMeal) {
    return <PastMeal p={p} f={openedMeal} day={w("tab.today")} slot={openedMeal.slot?.name ? mealName(openedMeal.slot.name) : undefined} back={() => setMealOpen(null)}
      onChange={(ch) => p.changeCard(openedMeal.id, ch)} onDelete={() => { p.deleteCard(openedMeal.id); setMealOpen(null); }} />;
  }
  return (
    <>
      {/* R24 (0.2.51, board RS24): the day stays in sight while you scroll: Today, Tomorrow, Earlier */}
      <DayBand day={w("today.headToday")} date={longDate(new Date(now))} />
      <section className="plan">
        {/* the goal is the headline and the way in; whose and who set it is one small line above it */}
        <div className="plan-goal">
          <small>{clientName ? w("today.clientGoal", { name: clientName }) : w("today.myGoal")}{byCoach ? w("today.setByCoach", { coach: (goal?.coachName || p.profile.coachName || COACH_NAME).split(" ")[0] }) : ""}</small>
          <button className="plan-goal-name" onClick={() => p.openMenu("goal")} aria-label={w("today.openMyGoal")}>{bandName || w("today.myGoal")} <ChevronRight size={22} /></button>
        </div>
        {/* DT208 (0.3.49): one row under the goal, in place of Today so far, against your goal */}
        <SetupRow p={p} done={w("today.fullySetTarget")} />
        <div className="plan-row">
          <div><b>{dayT.kcal > 0 ? pdVal(density(dayT.protein, dayT.kcal)) : "0"}</b><small>{pdTag() === "PD" ? w("today.ofPd", { pd: pdVal(p.dayPd) }) : w("today.ofTag", { v: pdVal(p.dayPd), tag: pdTag() })}</small></div>
          <div><b>{fmt(dayT.kcal, 0)}</b><small>{!follow ? w("today.ofKcal", { kcal: fmt(kT, 0) }) : p.day.source === "assumed" ? w("today.ofKcalWeek", { kcal: fmt(kT, 0) }) : w("today.ofKcalToday", { kcal: fmt(kT, 0) })}</small></div>
          <div><b>{fmt(dayT.protein, 0)}</b><small>{w("today.ofProtein", { g: fmt(pT, 0) })}</small></div>
        </div>
        {p.todayMacros && (
          <div className="plan-macros">
            <div><b>{fmt(dayT.fats, 0)}{dayT.gap ? "+" : ""}</b><small>{w("today.ofFat", { g: p.todayMacros.fats })}</small></div>
            <div><b>{fmt(dayT.carbs, 0)}{dayT.gap ? "+" : ""}</b><small>{w("today.ofCarbs", { g: p.todayMacros.carbs })}</small></div>
            <div />
          </div>
        )}
        {/* 0.2.56 (board DS4, F, Milan 08:49 to 08:58): not "at least" in the number; a plus, and one note of value under the
            numbers: why they are not complete and which food; the name of a food in your foods opens it there, to add the values;
            a food that lives only in a recipe is named, not linked, since nothing can add its values yet */}
        {p.todayMacros && dayT.missing.length > 0 && (
          <small className="macro-gap">{w("today.whyPlus")} {dayT.missing.map((m, k) => <span key={m.id}>{k ? (k === dayT.missing.length - 1 ? ` ${w("today.andSep")} ` : ", ") : ""}{state.foods.some((x) => x.id === m.id) ? <button type="button" className="link in-inline" onClick={() => p.openFood(m.id)}>{m.name}</button> : m.name}</span>)} {(() => { const one = dayT.missing.length === 1, same = dayT.missing.every((m) => m.what === dayT.missing[0].what) && dayT.missing[0].what !== "fat or carbs"; const what = same ? (dayT.missing[0].what === "fat" ? w("today.whatFat") : w("today.whatCarbs")) : ""; return same ? w(one ? "today.plusOne" : "today.plusMany", { what }) : w(one ? "today.plusOneBoth" : "today.plusManyBoth"); })()}</small>
        )}
        {p.review?.status === "change" && <button className="strip strip-button review-ask" onClick={() => p.openMenu("goal")}>{p.review.kept?.length === 1 ? w("today.asksOne", { coach: p.review.by || p.coachLabel }) : w("today.asksAll", { coach: p.review.by || p.coachLabel })} ›</button>}
        {p.profile.coachId && !byCoach && <button className="plan-source coach-line" onClick={() => p.openMenu("coach")} aria-label={w("today.openYourCoach")}>{p.coachLabel} <ChevronRight size={12} /></button>}
        {follow && planned && p.day.plan && !changing && (
          <div className="today-plan">
            <b className="today-date">{w("today.kindOfDay")}<button className="icon today-pencil" aria-label={w("today.changeTodaySPlan")} onClick={() => { setDraft(p.day.plan!); setChanging(true); }}><Pencil size={16} /></button></b>
            <span className="today-what">{p.day.plan.kind === "rest" && !p.day.plan.pe ? w("today.noTrainingToday") : `${todayLine(p.day.plan)}. ${LOAD_DAY[loadOf(p.day.plan)]}`}</span>
            <small>{p.day.source === "today" ? w("today.changedForTodayOnlyYour") : w("today.ifTodayGoesDifferentlyTap")}</small>
            {p.day.source === "today" && <button className="link" onClick={() => p.setTodayPlan(null)}>{w("today.backToTheTrainingWeek")}</button>}
          </div>
        )}
        {follow && changing && draft && (
          <div className="today-plan">
            <b>{w("today.kindOfDayTodayOnly")}</b>
            <DayEditor minor={minor} weekdays={wkd} peOn={peOn} value={draft} onChange={setDraft} work={workHoursOf(ls)} />
            <div className="actions">
              <button className="pill pill-primary action-main" onClick={() => { p.setTodayPlan(draft); setChanging(false); }}>{w("today.saveForToday")}</button>
              <button className="link action-cancel" onClick={() => setChanging(false)}>{w("today.cancel")}</button>
            </div>
          </div>
        )}
        {follow && !planned && (
          <div className="today-plan">
            <ChefLine text={say("whatDay")} />
            <div className="day-row">
              {DAY_TYPES.map((d) => <button key={d.id} className={`choice ${p.day.type === d.id ? "on" : ""}`} onClick={() => p.setDayType(d.id)}>{d.name}</button>)}
            </div>
            <button className="link" onClick={() => p.openMenu("week")}>{w("today.setYourTrainingWeekAnd")}</button>
          </div>
        )}
        {/* 0.2.57 (board DS6, I, Milan 10:21 to 10:46): no day part. The day header has the date; Maintain › opens Goal; one set
            of numbers every day has nothing to say here. Where training and rest days differ, the kind of day stays, without the date. */}
      </section>
      {/* DT260 (board Stories195; Coach Milan 09:16): new ways, below the title and below the goal */}
      {!clientName && <HowToToday open={() => p.openMenu("howto")} />}
      {/* DT214 v2 (0.3.53, board Stories162): while a cook runs, the strip under the My goal block */}
      <CookStrip p={p} />
      {/* DT189 (0.3.31): the strip in words instead of a number on an icon; it opens Clients on the list */}
      {p.isCoach && p.waiting.length > 0 && (
        <button className="strip strip-button" onClick={() => setTab("clients")}>{waitingWords(p.waiting)}</button>
      )}
      {/* the coach's note, once (0.2.6, canvas board CW, CW5): Got it keeps it in My coach; Change the numbers opens Goal */}
      {(() => {
        const n = unreadNote(p.coachNotes);
        if (!n) return null;
        const who = n.name ? w("today.coachName", { name: n.name }) : p.coachLabel;
        const at = new Date(n.at);
        if (n.suggest && (n.suggest.kind === "snack" || n.suggest.kind === "page")) return <SuggestCard key={n.at} p={p} n={n} who={who} />;
        const answer = n.suggest?.kind === "answer" ? n.suggest.card : null;
        return (
          <section className="coach-note coach-week-note" aria-label={w("today.noteFrom", { who })}>
            <small>{who}, {dateText(at, { weekday: "long", day: "numeric", month: "long" }).replace(",", "")}, {at.toLocaleTimeString(numLocale(), { hour: "2-digit", minute: "2-digit" })}</small>
            <b>{answer ? w("today.onYour", { title: answer.title, when: cardWhen(answer.at) }) : n.verdict === "change" ? w("today.asksAll", { coach: who }) : w("today.yourWeekApproved")}</b>
            {n.text && <span className="coach-note-text">{n.text}</span>}
            <div className="button-row">
              {n.verdict === "change"
                ? <button className="pill pill-small pill-primary" onClick={() => { p.gotNote(n.at); p.openMenu("goal"); }}>{w("today.lookAtMyNumbers")}</button>
                : <button className="pill pill-small pill-primary" onClick={() => p.gotNote(n.at)}>{w("today.gotIt")}</button>}
              <button className="pill pill-small" onClick={() => { const r = window.prompt(w("today.replyTo", { who })); if (r && r.trim()) { p.replyToCoach(r.trim(), n.at); p.notify(w("today.sentTo", { who })); } }}>{w("today.replyTo", { who })}</button>
            </div>
          </section>
        );
      })()}
      {/* What's in the plan (0.2.0, canvas S and H): the day's meals as rows once the Plan holds them (0.2.2); until then one row, Go to Plan. Then Scan, blue, the camera for what the plan is not. */}
      {/* The first two weeks (0.2.7, board FT): FT1 while the burn is being measured, FT2 once on the day it is ready */}
      {p.measured?.ready && p.measured.start && !p.measuredSeen && <ReadyCard m={p.measured} formulaKcal={p.formulaKcal} seeGoal={() => { p.seeMeasured(); toBurn(); }} gotIt={p.seeMeasured} />}
      {/* R5: what comes next, the one main action; 0.2.57 (board DS6, L, Milan 10:53 to 11:02): Next is always one card, its
          heading inside, the line inside; before a meal, the meal; nothing planned, its two ways; the day done, tomorrow's first meal */}
      {/* DT127 (0.2.108, board Stories75): at the table, one tap: a photo of the meal, read onto the Plate with the three gates;
          DT130 (0.2.110): the tap opens the meal camera, with Your photos */}
      {/* DT138 (0.2.122; Milan 28 October 16:02 and 16:09): Today is about the day and its reports, so the Photo of my meal card
          is gone from here. Foods are added on the Plate (Photo of my meal is there) and on Foods. */}
      <section className="next-meal">
        {next && nextHeld
          ? <div className="card next-planned" role="button" tabIndex={0} aria-label={w("today.seeMeal", { title: nextHeld.title })}
              onClick={(e) => { if ((e.target as HTMLElement).closest(".button-row")) return; openSlotMeal(key, next, nextHeld, makeNext); }}
              onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) { e.preventDefault(); openSlotMeal(key, next, nextHeld, makeNext); } }}>
              <p className="label next-head">{w("today.nextHead", { meal: mealV(next.name, true), time: next.time })}</p>
              <Picture src={pictureOfRecipe(nextRecipe)} />
              <div className="next-planned-text"><b>{nextHeld.title}</b><small>{w("today.asPlanned", { kcal: fmt(nextHeld.kcal, 0), protein: fmt(nextHeld.protein, 0), pd: pdText(density(nextHeld.protein, nextHeld.kcal)) })}</small></div>
              <ChevronRight size={20} className="next-planned-go" />
              <small className="next-line">{leftLine}</small>
              <div className="button-row next-planned-acts">
                {nextHeld.items?.length
                  ? <>{/* B139 (0.3.141, board Stories214): Change it on the left, I ate it on the right; no ✓ on a button still to tap */}
                    <button type="button" className="pill pill-small" onClick={() => eatFrom(next.id)}>{w("today.changeIt")}</button>
                    <button type="button" className="pill pill-small pill-primary" onClick={() => logged(p.logPlanned(nextHeld, { date: key, slotId: next.id, name: next.name, time: next.time }))}>{w("today.iAteIt")}</button></>
                  : <button type="button" className="pill pill-small pill-primary" onClick={makeNext}>{w("today.makeItOnThePlate")}</button>}
              </div>
            </div>
          : next && emptyDay
            ? <div className="card next-planned next-open next-empty">
                <p className="label next-head">{isFirstDay ? w("today.yourFirstDay") : w("today.headToday")}</p>
                <div className="next-planned-text"><b>{w("today.nothingPlannedOrEatenYet")}</b><small>{w("today.nextAt", { meal: mealV(next.name), time: next.time, kcal: fmt(left, 0), protein: fmt(pLeft, 0) })}</small></div>
                <div className="button-row next-planned-acts">
                  <button type="button" className="pill pill-small pill-primary" onClick={() => swapOn(key, next.id)}>{w("today.pickFor", { meal: mealV(next.name, true) })}</button>
                  <button type="button" className="pill pill-small" onClick={() => { showPlanOn(key); setTab("plan"); }}>{w("today.planTheDay")}</button>
                  <button type="button" className="pill pill-small" onClick={logMeal}>{w("today.logWhatYouAte")}</button>
                </div>
              </div>
          : next
            // 0.2.54, design system rule D (board DS2): Today has no wide button. A next meal with nothing planned is a card, with its two ways
            ? <div className="card next-planned next-open">
                <p className="label next-head">{w("today.nextHead", { meal: mealV(next.name, true), time: next.time })}</p>
                <div className="next-planned-text"><b>{w("today.nothingPlannedYet")}</b><small>{w("today.pickOneOfYourMeals")}</small></div>
                <small className="next-line">{leftLine}</small>
                <div className="button-row next-planned-acts">
                  <button type="button" className="pill pill-small pill-primary" onClick={() => swapOn(key, next.id)}>{w("today.pickAMeal")}</button>
                  <button type="button" className="pill pill-small" onClick={makeNext}>{w("today.makeItOnThePlate")}</button>
                </div>
              </div>
            : <div className="card next-planned next-open next-done">
                <p className="label next-head">{w("today.nextTomorrow")}</p>
                {tFirst
                  ? <PlanRow className="plan-row-link plan-slot-row" label={`${mealName(tFirst.sl.name)}, ${tFirst.sl.time}`} title={tFirst.m.title} photo={pictureOfRecipe(recipeOf(tFirst.m))}
                      ariaLabel={w("today.slotTomorrow", { meal: mealV(tFirst.sl.name), title: tFirst.m.title })} sub={<>{SOURCE[tFirst.m.source]}</>}
                      onOpen={() => openSlotMeal(tKey, tFirst.sl, tFirst.m, toTomorrow)} onSwap={() => swapOn(tKey, tFirst.sl.id)} onRight={() => p.fill(tKey, tFirst.sl.id, { ...tFirst.m, skipped: true })} rightLabel={w("today.skip")} swapName={w("today.swapTomorrow", { meal: mealV(tFirst.sl.name, true) })} rightName={w("today.skipTomorrow", { meal: mealV(tFirst.sl.name, true) })} />
                  : <div className="next-planned-text"><b>{w("today.nothingPlannedForTomorrowYet")}</b><small>{w("today.setMealsWait", { day: tWeekday })}</small></div>}
                <small className="next-line">{leftLine}</small>
                <div className="button-row next-planned-acts">
                  <button type="button" className="pill pill-small pill-primary" onClick={toTomorrow}>{tHeld ? w("today.checkTomorrow") : w("today.planTomorrow")}</button>
                </div>
              </div>}
      </section>
      {/* R16 (0.2.44, Milan 21:56): what is left of a batch is not Today's: it may go to the family or to work. A batch reaches
          a day through the plan. A meal kept for later today still waits here. */}
      {kept.length > 0 && (
        <>
          <p className="label">{next ? w("today.orOneFromYourBatch") : w("today.forTomorrowFromYourBatch")}</p>
          {kept.map((f) => {
            const a = sumOf(f.meal.items), r = recipeOfCard(f, state.meals), many = (f.left ?? 0) > 0;
            return (
              <section className="card log-card" key={f.id}>
                <div className="card-top"><span>{f.meal.title}</span>{many && <small className="left-tag">{w("today.nLeft", { n: f.left ?? 0 })}</small>}</div>
                <small>{many ? w("today.eachOne", { what: f.leftOf ?? w("today.portion") }) : ""}{w("today.kcalProtein", { kcal: fmt(a.kcal, 0), protein: fmt(a.protein, 0) })}{r && <> · <button className="link in-inline" onClick={() => p.openMeal(r.id, { tab: "home" })}>{w("today.openTheRecipe")}</button></>}</small>
                {asking === f.id && (
                  <div className="which-meal">
                    <ChefLine text={say("whichMeal")} />
                    <div className="moments" role="radiogroup" aria-label={w("today.whichMealIsIt")}>
                      {openSlots.map((sl) => <button key={sl.id} className={`choice ${asWhich === sl.id ? "on" : ""}`} aria-pressed={asWhich === sl.id} onClick={() => setAsWhich(sl.id)}>{mealName(sl.name)}, {sl.time}</button>)}
                      <button className={`choice ${asWhich === "snack" ? "on" : ""}`} aria-pressed={asWhich === "snack"} onClick={() => setAsWhich("snack")}>{mealName("Snack")}</button>
                    </div>
                    <small className="muted">{asSlot ? w("today.countsAs", { meal: mealV(asSlot.name, true) }) : w("today.itCountsAsASnack")}</small>
                  </div>
                )}
                <div className="button-row" style={{ marginTop: 8 }}>
                  {asking === f.id
                    ? <button className="pill pill-small pill-primary" onClick={() => { p.settleCard(f.id, "eaten", asSlot ? { slot: { date: key, slotId: asSlot.id, name: asSlot.name, time: asSlot.time } } : { which: "Snack" }); setAsking(null); }}>{w("today.logIt")}</button>
                    : <button className="pill pill-small pill-primary" onClick={() => askFor(f.id)}>{many ? w("today.iAteOne") : w("today.iAteIt")}</button>}
                  <button className="pill pill-small" onClick={() => { setAsking(null); p.settleCard(f.id, "not-used"); }}><X size={14} /> {many ? w("today.remove") : w("today.notToday")}</button>
                </div>
              </section>
            );
          })}
        </>
      )}
      {inbox}
      {!emptyDay && <section className="card cooking">
        <p className="card-head">{w("today.whatSInThePlan")}</p>
        {!hasPlanToday && (
          <button className="menu-row plan-row-link" onClick={() => setTab("plan")}>
            <div className="menu-row-text"><small>{w("today.nothingPlannedSoFar")}</small><b>{w("today.goToPlan")}</b><small>{w("today.setTheDaySMeals")}</small></div><ChevronRight size={18} />
          </button>
        )}
        {hasPlanToday && rec.done && !dayDone && <small className="muted plan-eaten">{w("today.eatenByPlan", { meals: rec.eaten.map((f) => mealName(f.slot!.name)).join(", ") })}</small>}
        {dayDone && (
          <button className="menu-row plan-row-link" onClick={() => setTab("plan")}>
            <div className="menu-row-text"><small>{rec.skipped.length ? w("today.eatenSkipped", { eaten: rec.byPlan, skipped: rec.skipped.length }) : wn("today.allEaten", rec.planned)}</small><b>{rec.extras.length ? w("today.wentMostly") : w("today.wentByPlan")}</b></div><ChevronRight size={18} />
          </button>
        )}
        {/* 0.2.6 (canvas board CW, CW7): each planned meal can be skipped on purpose; a skipped one stays with Undo until midnight */}
        {hasPlanToday && slots.filter((sl) => (!rec.done && rec.open.includes(sl)) || rec.skipped.includes(sl)).map((sl) => {
          const m = held[sl.id];
          if (m.skipped) return (
            <div key={sl.id} className="menu-row plan-row-link plan-slot-row plan-slot-skipped">
              <div className="menu-row-text"><small>{sl.name}, {sl.time}</small><b>{m.title}</b><small className="skipped-mark">{w("today.skippedOnPurpose")}</small></div>
              <button type="button" className="pill pill-small pill-action plan-skip on" onClick={() => p.fill(key, sl.id, { ...m, skipped: undefined })}>{w("today.undo")}</button>
            </div>
          );
          const fit = fitOf(m, p.dayPd, unit);
          // R24 (0.2.51, board RS24): a planned meal whose time has passed asks, under its row, the card's full width
          const missed = sl.id !== next?.id && toMin(sl.time) <= nowMin;
          return (
            <Fragment key={sl.id}>
            <PlanRow className="plan-row-link plan-slot-row" label={`${mealName(sl.name)}, ${sl.time}`} title={m.title} photo={pictureOfRecipe(recipeOf(m))}
              ariaLabel={w("today.slotAt", { meal: mealV(sl.name), time: sl.time, title: m.title })}
              sub={<>{SOURCE[m.source]}{fit.state === "fits" ? <span className="fit-ok"> · {w("today.fits")}</span> : fit.state === "close" ? <span className="fit-close"> · {fit.text}</span> : fit.state === "under" ? <span className="fit-under"> · {fit.text}</span> : null}</>}
              onOpen={() => openSlotMeal(key, sl, m, () => eatFrom(sl.id))} onSwap={() => swapOn(key, sl.id)} onRight={() => p.fill(key, sl.id, { ...m, skipped: true })} rightLabel={w("today.skip")} swapName={w("today.swapMeal", { meal: mealV(sl.name, true) })} rightName={w("today.skipOnPurpose", { meal: mealV(sl.name, true) })} />
            {missed && (
              <div className="missed-ask" role="group" aria-label={w("today.didYouHaveIt", { meal: mealV(sl.name), time: sl.time })}>
                <small>{w("today.timePassed", { time: sl.time })}</small>
                <div className="button-row">
                  {m.items?.length
                    ? <button type="button" className="pill pill-small pill-primary" onClick={() => logged(p.logPlanned(m, { date: key, slotId: sl.id, name: sl.name, time: sl.time }))}>{w("today.iAteIt")}</button>
                    : null}
                  <button type="button" className="pill pill-small" onClick={() => eatFrom(sl.id)}>{m.items?.length ? w("today.changeIt") : w("today.makeItOnThePlate")}</button>
                  <button type="button" className="pill pill-small" onClick={() => p.fill(key, sl.id, { ...m, skipped: true })}>{w("today.skippedIt")}</button>
                </div>
              </div>
            )}
            </Fragment>
          );
        })}
        {hasPlanToday && !dayDone && rec.empty.length > 0 && (
          <button className="menu-row plan-row-link" onClick={() => setTab("plan")}>
            <div className="menu-row-text"><small>{rec.empty.map((x) => mealName(x.name)).join(", ")}</small><b>{w("today.pickAMeal")}</b><small>{wn("today.slotsOpen", rec.empty.length)} · {w("today.goToPlan")}</small></div><ChevronRight size={18} />
          </button>
        )}
      </section>}
      {/* 0.2.57 (board DS6, K): no record box; the plan card's row says how the day went, Today's meals says the extras */}
      {!emptyDay && <section className="card meals-card" aria-label={w("today.todaySMeals")}>
      <p className="card-head">{w("today.todaySMeals")}</p>
      <p className="small logged-line">{hasPlanToday ? planDayLine({ ...rec, done: dayDone }, p.todayKcal) : loggedLine(today, true)}</p>
      {newest.map((f) => {
        const a = sumOf(f.meal.items), r = recipeOfCard(f, state.meals);
        return [
          <div className="log-card meal-row with-photo log-card-open" key={f.id} onClick={(e) => { if ((e.target as HTMLElement).closest("button,input,a,label,textarea")) return; setMealOpen(f.id); }}>
            <Picture src={f.photo ?? pictureOfRecipe(r)} />
            <div className="card-top"><span>{f.meal.title}</span><small>{new Date(f.createdAt).toLocaleTimeString(phoneLoc(), { hour: "2-digit", minute: "2-digit" })}</small></div>
            <small className="meal-which"><b>{mealName(whichOf(f))}</b>{r && <> · <button className="link in-inline" onClick={() => p.openMeal(r.id, { tab: "home" })}>{w("today.openTheRecipe")}</button></>}</small>
            <small className="log-nums">{w("today.kcalProtein", { kcal: fmt(a.kcal, 0), protein: fmt(a.protein, 0) })}{a.gap ? "" : w("today.fatCarbs", { fat: fmt(a.fats, 0), carbs: fmt(a.carbs, 0) })} · {pdText(density(a.protein, a.kcal))}</small>
            {hasPlanToday && (f.slot
              ? <small className="plan-mark fit-ok">{w("today.eatenByThePlan")}</small>
              : <small className="plan-mark fit-under">{rec.open.length && f.id === today.logged[today.logged.length - 1]?.id ? w("today.offPlanLean") : w("today.offPlan")}</small>)}
            <div className="button-row meal-row-acts">
              {justLogged.includes(f.id) && <button type="button" className="pill pill-small meal-undo" onClick={() => { p.deleteCard(f.id); setJustLogged((xs) => xs.filter((x) => x !== f.id)); p.notify(w("today.undone", { title: f.meal.title })); }}>{w("today.undo")}</button>}
              <button type="button" className="pill pill-small meal-change" onClick={() => setMealOpen(f.id)}>{w("today.changeOrDelete")}</button>
            </div>
            {(!r || p.profile.coachId) && (
              <div className="button-row log-actions">
                {!r && <button className="pill pill-small" onClick={() => p.saveCardAsRecipe(f.id)}>{w("today.saveInMyRecipes")}</button>}
            {p.profile.coachId && (f.shared
                  ? <span className="pill pill-small pill-done"><Check size={14} /> {w("today.shared")}</span>
                  : shareFor === f.id
                    ? <>{([["look", w("today.lookAtThis")], ["ok", w("today.wasThisOk")], ["help", w("today.helpMeNextTime")]] as const).map(([k, l]) => (
                        <button key={k} className="pill pill-small" onClick={() => { p.shareCard(f.id, k); setShareFor(null); }}>{l}</button>
                      ))}<button className="link" onClick={() => setShareFor(null)}>{w("today.cancel")}</button></>
                    : <button className="pill pill-small" onClick={() => setShareFor(f.id)}>{w("today.shareWith", { coach: p.coachLabel })}</button>)}
              </div>
            )}
            <CoverAsk f={f} recipe={r} p={p} />
            {/* R20 (0.2.48, board RS19): the question on the meal's own card, full width under the photo and the numbers; the
                answer stays on it, with Change for a wrong tap */}
            {(carryDue(f) || changingCarry === f.id || (p.carryNow?.id === f.id && !f.carry))
              ? <div className="carry-in" data-carry={f.id} aria-label={w("today.howCarry", { title: f.meal.title })}>
                  {/* DT211 v8 (0.3.53): the last question of the conversation, as Chef Mealan's line */}
                  {/* DT218 (0.3.58): opened early by Go on, it says when he would have asked */}
                  <ChefLine className="carry-q" text={carryDue(f) || f.carry ? say("carryLater") : say("carryNow", carryLeft(f))} />
                  <div className="carry-acts">
                    {(["light", "fine", "heavy"] as const).map((k) => (
                      <button key={k} type="button" className={`choice${f.carry?.how === k ? " on" : ""}`} onClick={() => { p.setCarry(f.id, k, carryMoment(f)); setChangingCarry(null); }}>{CARRY_WORDS[k]}</button>
                    ))}
                  </div>
                  {p.state.cook?.cardId === f.id && <small className="muted carry-closes">{w("today.yourAnswerClosesTheCook")}</small>}
                </div>
              : f.carry && <small className="carry-in carry-done">{w("today.carriedYou")} <b>{CARRY_WORDS[f.carry.how]}</b> · <button type="button" className="link in-inline" onClick={() => setChangingCarry(f.id)}>{w("today.change")}</button></small>}
          </div>,
        ];
      })}
      <div className="button-row meals-acts"><button type="button" className="pill pill-small" onClick={logMeal}><Plus size={14} /> {w("today.logAMeal")}</button></div>
      </section>}
      {/* R5: Getting to know you is about logging; R24: it stays with today */}
      {p.measured?.phase && <KnowCard m={p.measured} openGoal={toBurn} />}
      {/* R18: tomorrow, the same card; its rows and its button open Plan on tomorrow; R24: under its own band */}
      <DayBand day={w("today.headTomorrow")} date={longDate(tomorrow)} />
      <section className="card tomorrow-plan" aria-label={w("today.tomorrowSPlan")}>
        <p className="card-head">{w("today.whatSInThePlan")}</p>
        {tWhen && (() => { const t = trainingShown(tTraining) ?? tWhen.phrase; return <small className="muted plan-when">{t.charAt(0).toUpperCase() + t.slice(1)}</small>; })()}
        {tHeld > 0 && tSlots.map((sl) => {
          const m = tPlan[sl.id];
          const fit = m ? fitOf(m, p.dayPd, unit) : null;
          if (m && !m.skipped) return (
            <PlanRow key={sl.id} className="plan-row-link plan-slot-row" label={`${mealName(sl.name)}, ${sl.time}`} title={m.title} photo={pictureOfRecipe(recipeOf(m))}
              ariaLabel={w("today.slotTomorrow", { meal: mealV(sl.name), title: m.title })}
              sub={<>{SOURCE[m.source]}{fit?.state === "fits" ? <span className="fit-ok"> · {w("today.fits")}</span> : fit?.state === "close" ? <span className="fit-close"> · {fit.text}</span> : fit?.state === "under" ? <span className="fit-under"> · {fit.text}</span> : null}</>}
              onOpen={() => openSlotMeal(tKey, sl, m, toTomorrow)} onSwap={() => swapOn(tKey, sl.id)} onRight={() => p.fill(tKey, sl.id, { ...m, skipped: true })} rightLabel={w("today.skip")} swapName={w("today.swapTomorrow", { meal: mealV(sl.name, true) })} rightName={w("today.skipTomorrow", { meal: mealV(sl.name, true) })} />
          );
          return (
            <button key={sl.id} type="button" className="menu-row plan-row-link plan-slot-row" aria-label={w("today.slotTomorrow", { meal: mealV(sl.name), title: m ? m.title : w("today.pickAMealLow") })} onClick={() => (m ? toTomorrow() : swapOn(tKey, sl.id))}>
              <div className="menu-row-text"><small>{sl.name}, {sl.time}</small>{m ? <b>{m.title}</b> : <b className="plan-pick">{w("today.pickAMeal")}</b>}
                <small>{!m ? w("today.oneSlotOpen") : w("today.skippedOnPurpose")}</small></div>
              <ChevronRight size={18} />
            </button>
          );
        })}
        <button type="button" className="menu-row plan-row-link" onClick={toTomorrow}>
          <div className="menu-row-text"><b>{tHeld ? w("today.checkTomorrow") : w("today.planTomorrow")}</b><small>{tHeld ? w("today.plannedOf", { n: Math.min(tHeld, tSlots.length), of: tSlots.length, day: tWeekday }) : w("today.nothingSoFar", { day: tWeekday })}</small></div><ChevronRight size={18} />
        </button>
      </section>
      {/* 0.2.57 (board DS7, N, Milan 11:26): Earlier keeps its name; two day cards, the same component, each with its exact day;
          the row opens that day in Plan, its meals against its plan; older days are in Plan */}
      {past.length > 0 && <>
      <DayBand day={w("today.headEarlier")} date={past.length === 1 ? w("today.yesterdayLow") : w("today.lastTwoDays")} />
      <div className="days" aria-label={w("today.theLastTwoDays")}>
        {past.map((d) => {
          const dk = ymd(d.day), dHeld = p.planned[dk];
          const dRec = dHeld && Object.keys(dHeld).length ? dayRecord(slotsOn(lifestyleOf(p.personal), p.personal.timesOn, dk), dHeld, d.logged, dk) : null;
          const head = w(dayLabel(d.day) === "Yesterday" ? "today.yesterdayDate" : "today.date", { date: (l) => d.day.toLocaleDateString(locOf(l), { weekday: "long", day: "numeric", month: "long" }) });
          return (
            <section className="card day-card" key={dk} aria-label={head}>
              <p className="card-head">{head}</p>
              {/* DT176 (0.3.19): a day spent travelling says so */}
              {(() => { const tr = travelOn(dk, p.personal.trips, p.travel); return tr ? <small className="travel-day">🧳 {w("today.travelling", { place: placeNameOf(tr.place) })}</small> : null; })()}
              <button type="button" className="menu-row plan-row-link" onClick={() => { showPlanOn(dk); setTab("plan"); }}>
                <div className="menu-row-text"><small>{d.dayType ? dayNameAny(d.dayType) : w("today.noKindOfDayWas")}</small><b>{dRec ? planDayLine({ ...dRec, done: true }, p.numbersFor(d.day)?.kcal ?? null) : loggedLine(d, false)}</b><small>{w("today.seeTheDayAgainstIts")}</small></div><ChevronRight size={18} />
              </button>
            </section>
          );
        })}
        <p className="older-link"><button type="button" className="link" onClick={() => setTab("plan")}>{w("today.olderDaysAreInPlan")}</button></p>
      </div></>}
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
      <small className="cover-ask-q">{w("today.useAsCoverOf", { title: recipe.title })}</small>
      <div className="button-row">
        <button className="pill pill-small pill-primary" onClick={() => p.useCardAsCover(f.id, recipe.id)}>{w("today.useAsCover")}</button>
        <button className="pill pill-small" onClick={() => p.setCoverAsk(f.id, "kept")}>{w("today.keepItJustForMe")}</button>
      </div>
      <small className="muted">{w("today.justForYouItStays")}</small>
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
      <div className="cover-ask-row"><img src={recipePhotosOf(recipe)[0]} alt="" /><small className="cover-ask-q">{w("today.coverByChef")}</small></div>
      <div className="button-row">
        <label className={`pill pill-small pill-primary${busy ? " disabled" : ""}`}>{w("today.takeAPhoto")}<input type="file" accept="image/*" capture="environment" hidden onChange={(e) => { const x = e.target.files?.[0]; e.target.value = ""; void take(x); }} /></label>
        <button className="link" onClick={() => p.setCoverAsk(f.id, "later")}>{w("today.notNow")}</button>
      </div>
    </div>
  );
}

// DT188 (0.3.30, board Stories137, Milan 16:26): a coach's suggestion is a card with Accept and Not now. Accept does only what
// the client could have done alone: a planned snack on Plan for this week (the Lifestyle default stays the client's own), or
// an Explorer page opened. Not now carries a reason, cheap to give: one of four chips, or a line; a plain Not now goes too.
function SuggestCard({ p, n, who }: { p: AppApi; n: import("../coachNotes").CoachNote; who: string }) {
  const [later, setLater] = useState(false);
  const [line, setLine] = useState("");
  const s = n.suggest!;
  const slots = slotsOf(lifestyleOf(p.personal));
  const snackSlot = slots.find((x) => /snack/i.test(x.name)) ?? null;
  const accept = () => {
    if (s.kind === "page" && s.page) { p.answerSuggest(n.at, "accept"); p.goExplorer({ part: s.page.part, id: s.page.id, member: s.page.member }); return; }
    if (s.kind === "snack") {
      if (!snackSlot) { p.notify(w("today.addSnackFirst")); p.openMenu("life"); return; }
      const today = ymd(new Date());
      let timesOn = p.personal.timesOn;
      for (let i = 0; i < 7; i++) {
        const d = new Date(`${today}T12:00:00`); d.setDate(d.getDate() + i); const key = ymd(d);
        if (p.planned[key]?.[snackSlot.id] && !p.planned[key][snackSlot.id].skipped) continue;
        const need = needOf(slots, snackSlot, p.numbersFor(d));
        p.fill(key, snackSlot.id, { title: n.text, kcal: need?.kcal ?? 200, protein: need?.protein ?? 15, source: "coach" });
        if (s.time && s.time !== snackSlot.time) timesOn = withTimeOn(timesOn, key, snackSlot.id, s.time, snackSlot.time);
      }
      if (timesOn !== p.personal.timesOn) p.setPersonal({ ...p.personal, timesOn });
      p.answerSuggest(n.at, "accept"); p.notify(s.time ? w("today.onPlanAt", { what: n.text, time: s.time }) : w("today.onPlan", { what: n.text }));
    }
  };
  const notNow = (reason?: string) => { p.answerSuggest(n.at, "later", reason); p.notify(reason ? w("today.toldReason", { who, reason: reason.charAt(0).toLowerCase() + reason.slice(1) }) : w("today.toldNotNow", { who })); };
  return (
    <section className="coach-note coach-week-note suggest-card" aria-label={w("today.suggestionFrom", { who })}>
      <small>{w("today.whoSuggests", { who })}</small>
      <b>{suggestTitle(s, n.text)}</b>
      <span className="coach-note-text">{s.kind === "snack" ? (s.time ? w("today.landsAt", { time: s.time }) : w("today.lands")) : w("today.opensThePageInExplorer")}</span>
      {!later ? (
        <div className="button-row">
          <button className="pill pill-small pill-primary" onClick={accept}>{s.kind === "page" ? w("today.open") : w("today.accept")}</button>
          <button className="pill pill-small" onClick={() => setLater(true)}>{w("today.notNow")}</button>
        </div>
      ) : (
        <div>
          <small>{w("today.whyOneTapIsEnough")}</small>
          <div className="suggest-reasons">{REASONS.map((r) => <button key={r} type="button" className="choice" onClick={() => notNow(r)}>{r}</button>)}</div>
          <div className="button-row" style={{ marginTop: 8 }}>
            <input className="search" aria-label={w("today.aLineForYourCoach")} placeholder={w("today.orALine")} value={line} onChange={(e) => setLine(e.target.value)} />
            <button className="pill pill-small" onClick={() => notNow(line.trim() || undefined)}>{w("today.send")}</button>
          </div>
        </div>
      )}
    </section>
  );
}
