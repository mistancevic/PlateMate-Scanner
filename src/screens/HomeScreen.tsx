import { useEffect, useState } from "react";
import { ChefHat, Camera, ChevronRight, Check, Pencil } from "lucide-react";
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
import { KnowCard, ReadyCard } from "../components/Measured";
import { slotsOf, slotsOn, rowsOf, trainingWhen, toMin } from "../slots";
import { closedSlots, WINDOW } from "../makeMeal";
import { answersFor } from "../unlogged";
import { dayFor, getDay } from "../personal";
import { ymd } from "../plan";
import { fitOf, type PlannedMeal } from "../planned";
import { dayRecord, planLine as planDayLine, recordLine } from "../record";
import { log } from "../log";
import { closeDays, openedToday } from "../metrics";
import { coverIsDrawn, ownPhotosOf } from "../covers";
import { recipePhotosOf } from "../photos";
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
  const eatenAs = (() => { const w = [...today.logged].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)).map((f) => (whichOf(f) === "Snack" ? "a snack" : whichOf(f).toLowerCase())); const t = w.length <= 1 ? w.join("") : `${w.slice(0, -1).join(", ")} and ${w[w.length - 1]}`; return t.charAt(0).toUpperCase() + t.slice(1); })();
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
  // tomorrow, for the line once today is done
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const tTraining = dayFor(p.personal, tomorrow)?.day ?? getDay(p.personal, tomorrow).plan ?? null;
  const tWhen = trainingWhen(tTraining); void rowsOf;
  const tHeld = Object.keys(p.planned[ymd(tomorrow)] ?? {}).length;
  const past = [1, 2].map((n) => dayLog(state.feedback, daysAgo(n)));
  const follow = dayModeOf(p.personal) === "each";
  // The day pills show while the day is still assumed, and again after Change, until a pill is tapped.
  const [changing, setChanging] = useState(false);
  const [draft, setDraft] = useState<PlanDay | null>(null);
  // with a Training week Today reads it; without one, Today asks what kind of day it is
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
            <div><b>{dayT.gap ? "at least " : ""}{fmt(dayT.fats, 0)}</b><small>of {p.todayMacros.fats} g fat</small></div>
            <div><b>{dayT.gap ? "at least " : ""}{fmt(dayT.carbs, 0)}</b><small>of {p.todayMacros.carbs} g carbs</small></div>
            <div />
          </div>
        )}
        {p.review?.status === "change" && <button className="strip strip-button review-ask" onClick={() => p.openMenu("goal")}>{p.review.by || p.coachLabel} asks you to change {p.review.kept?.length === 1 ? "one number" : "your numbers"} ›</button>}
        {p.profile.coachId && !byCoach && <button className="plan-source coach-line" onClick={() => p.openMenu("coach")} aria-label="Open your coach">{p.coachLabel} <ChevronRight size={12} /></button>}
        {follow && planned && p.day.plan && !changing && (
          <div className="today-plan">
            <b className="today-date">{dateLine}<button className="icon today-pencil" aria-label="Change today's plan" onClick={() => { setDraft(p.day.plan!); setChanging(true); }}><Pencil size={16} /></button></b>
            <span className="today-what">{p.day.plan.kind === "rest" && !p.day.plan.pe ? "No training today." : `${todayLine(p.day.plan)}. ${LOAD_DAY[loadOf(p.day.plan)]}`}</span>
            <small>{p.day.source === "today" ? "Changed for today only. Your Training week stays the same." : "If today goes differently, tap the pencil. The numbers follow, the Training week stays."}</small>
            {p.day.source === "today" && <button className="link" onClick={() => p.setTodayPlan(null)}>Back to the Training week</button>}
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
            <button className="link" onClick={() => p.openMenu("week")}>Set your Training week, and Chef Mealan won't need to ask ›</button>
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
      {/* R5: what comes next, the one main action; then the batch as a way to eat it */}
      <p className="label">{next ? `Next: ${next.name.toLowerCase()}, ${next.time}` : "Next: tomorrow"}</p>
      <section className="next-meal">
        {next
          ? <button className="pill pill-primary pill-wide" onClick={makeNext}>Make your {next.name.toLowerCase()}</button>
          : <button className="pill pill-primary pill-wide" onClick={() => setTab("plan")}>Plan tomorrow</button>}
        <small className="muted next-line">{next
          ? (left > 150 ? `${next.name}, ${next.time} by the clock: about ${fmt(left, 0)} kcal and ${fmt(pLeft, 0)} g protein left today.` : `You are at your day's kcal. A light ${next.name.toLowerCase()} keeps you there.`)
          : today.logged.length ? `${eatenAs} ${today.logged.length === 1 ? "is" : "are"} logged: ${left >= 0 ? `${fmt(left, 0)} kcal left today` : `${fmt(-left, 0)} kcal over today`}.` : "Nothing logged today."}</small>
        <button className="link next-log" onClick={logMeal}>Log a meal</button>
      </section>
      {today.prepared.length > 0 && (
        <>
          <p className="label">{next ? "Or one from your batch" : "For tomorrow, from your batch"}</p>
          {today.prepared.map((f) => {
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
        <div className="card-top cooking-top"><span><ChefHat size={18} /> What's in the plan</span></div>
        {!hasPlanToday && (
          <button className="menu-row plan-row-link" onClick={() => setTab("plan")}>
            <div className="menu-row-text"><small>Nothing planned so far</small><b>Go to Plan</b><small>Set the day's meals, and they wait here</small></div><ChevronRight size={18} />
          </button>
        )}
        {hasPlanToday && rec.done && (
          <button className="menu-row plan-row-link" onClick={() => setTab("plan")}>
            <div className="menu-row-text"><small>{rec.skipped.length ? `${rec.byPlan} eaten, ${rec.skipped.length} skipped on purpose` : `All ${rec.planned === 1 ? "one slot" : `${rec.planned} slots`} eaten`}</small><b>Today went {rec.extras.length ? "mostly " : ""}by the plan</b><small>{tHeld ? `Tomorrow is set: ${tHeld} ${tHeld === 1 ? "slot" : "slots"}${tWhen ? `, ${tWhen.phrase}` : ""}` : "Tomorrow is open. Set it on Plan."}</small></div><ChevronRight size={18} />
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
          return (
            <div key={sl.id} className="menu-row plan-row-link plan-slot-row" onClick={() => eatFrom(sl.id)}>
              <button type="button" className="plan-slot-main" aria-label={`${sl.name} at ${sl.time}, ${m.title}`} onClick={(e) => { e.stopPropagation(); eatFrom(sl.id); }}>
                <span className="menu-row-text"><small>{sl.name}, {sl.time}</small><b>{m.title}</b><small>{SOURCE[m.source]}{fit.state === "fits" ? <span className="fit-ok"> · fits</span> : fit.state === "under" ? <span className="fit-under"> · {fit.text}</span> : null}</small></span>
              </button>
              <button type="button" className="link plan-skip" aria-label={`Skip ${sl.name.toLowerCase()} on purpose`} onClick={(e) => { e.stopPropagation(); p.fill(key, sl.id, { ...m, skipped: true }); }}>Skip</button>
              <ChevronRight size={18} />
            </div>
          );
        })}
        {hasPlanToday && !rec.done && rec.empty.length > 0 && (
          <button className="menu-row plan-row-link" onClick={() => setTab("plan")}>
            <div className="menu-row-text"><small>{rec.empty.map((x) => x.name).join(", ")}</small><b>Pick a meal</b><small>{rec.empty.length === 1 ? "One slot open" : `${rec.empty.length} slots open`} · Go to Plan</small></div><ChevronRight size={18} />
          </button>
        )}
      </section>
      {/* RP5 (0.2.25, Milan 17:42): Today keeps the day; scanning lives on the Plate, at the top */}
      {/* the day's record (0.2.3, H14): once every planned slot is eaten, one line a day; the coach sees it on Friday */}
      {rec.done && (
        <section className="plan day-record">
          <div className="plan-top"><span>{new Date().toLocaleDateString("en", { weekday: "long" })}, the record</span><span>{rec.extras.length ? `${rec.extras.length} extra` : "by the plan"}</span></div>
          <div className="plan-row">
            <div><b>{pdVal(rec.pd)}</b><small>{pdTag()}{p.dayPd !== null ? `, target ${pdVal(p.dayPd)}` : ""}</small></div>
            <div><b>{fmt(rec.kcal, 0)}</b><small>{p.todayKcal ? `of ${fmt(p.todayKcal, 0)} kcal` : "kcal"}</small></div>
            <div><b>{fmt(rec.protein, 0)}</b><small>{p.todayMacros?.protein ? `of ${fmt(p.todayMacros.protein, 0)} g protein` : "g protein"}</small></div>
          </div>
          <small className="record-line">{recordLine(rec)}{p.profile.coachId ? " Your coach sees this line on Friday." : ""}</small>
        </section>
      )}
      <p className="label">Today's meals</p>
      <p className="small logged-line">{hasPlanToday ? planDayLine(rec, p.todayKcal) : loggedLine(today, true)}</p>
      {newest.map((f) => {
        const a = sumOf(f.meal.items), r = recipeOfCard(f, state.meals);
        return [
          <section className={`card log-card ${f.photo ? "with-photo" : ""}`} key={f.id}>
            {f.photo && <img className="log-photo" src={f.photo} alt="" />}
            <div className="card-top"><span>{f.meal.title}</span><small>{new Date(f.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></div>
            <small className="meal-which"><b>{whichOf(f)}</b>{r && <> · <button className="link in-inline" onClick={() => p.openRecipePage(r.id)}>Open the recipe ›</button></>}</small>
            <small className="log-nums">{fmt(a.kcal, 0)} kcal · {fmt(a.protein, 0)} g protein{a.gap ? "" : ` · ${fmt(a.fats, 0)} g fat · ${fmt(a.carbs, 0)} g carbs`} · {pdText(density(a.protein, a.kcal))}</small>
            {hasPlanToday && (f.slot
              ? <small className="plan-mark fit-ok">By the plan</small>
              : <small className="plan-mark fit-under">Off the plan{rec.open.length && f.id === today.logged[today.logged.length - 1]?.id ? " · the next meal leans protein" : ""}</small>)}
            {(!r || p.profile.coachId) && (
              <div className="button-row log-actions">
                {!r && <button className="pill pill-small pill-primary" onClick={() => p.saveCardAsRecipe(f.id)}>Save in My recipes</button>}
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
          </section>,
          carryDue(f) && (
            <section className="card log-card carry-card" key={`carry-${f.id}`}>
              <div className="card-top"><span>How did it carry you?</span><small>30 min after {f.meal.title}</small></div>
              <div className="button-row" style={{ marginTop: 8 }}>
                {([["light", "Light and awake"], ["fine", "Fine"], ["heavy", "Heavy, tired"]] as const).map(([k, l]) => (
                  <button key={k} className="pill pill-small" onClick={() => p.setCarry(f.id, k)}>{l}</button>
                ))}
              </div>
            </section>
          ),
        ];
      })}
      <p className="label">The last few days</p>
      <section className="card days">
        {past.map((d) => (
          <div className="history-row" key={d.day.toISOString()}>
            <div><b>{dayLabel(d.day)}</b><small>{d.dayType ? dayNameAny(d.dayType) : "No kind of day was set"}</small></div>
            <div className="history-num"><small>{loggedLine(d, false)}</small></div>
          </div>
        ))}
      </section>
      {/* R5: Getting to know you is about logging, not today's target: below the last days */}
      {p.measured?.phase && <KnowCard m={p.measured} openGoal={toBurn} />}
    </>
  );
}
// R5: a list's numbers; fat and carbs count what is known, and gap says a food has no value for them
function sumOf(items: Feedback["meal"]["items"]) {
  const t = { kcal: 0, protein: 0, fats: 0, carbs: 0, gap: false };
  for (const i of items) { if (!(i.grams > 0)) continue; const k = i.grams / 100; t.kcal += k * (i.food.calories ?? 0); t.protein += k * (i.food.protein ?? 0); if (i.food.fats == null || i.food.carbs == null) t.gap = true; t.fats += k * (i.food.fats ?? 0); t.carbs += k * (i.food.carbs ?? 0); }
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
