import { numLocale, w } from "../words";
import { optWord } from "../optWords";
import { Settings , Coffee } from "lucide-react";
import { SetupRow } from "../components/SetupRow";
import { setupMissing, stepMissing, type SetupStep } from "../setup";
import { fmt, pdText, pdVal, pdTag, pdRange } from "../ui";
import { density } from "../pilot";
import { COACH_NAME } from "../components/Mark";
import { WeighInLine } from "../components/Weight";
import { weighInsOff } from "../weight";
import { bandOf, goalName } from "../goal";
import type { ReactNode } from "react";
import { ChevronRight, User, Target, CalendarDays, ShoppingBasket, Users, KeyRound, ClipboardList, CalendarClock } from "lucide-react";
import type { MenuSection } from "./api";
import { TASTE_CHIPS, toggleChip } from "../tasteChips";
import { lifestyleOf, planOf } from "../personal";
import { HOURS, SLOTS, weekdaysOf, WEEKDAY_CHOICES } from "../plan";
import type { AppApi } from "./api";
import { TravelCard } from "../components/Travel";
import { placeName } from "../travel";

// Me: the person's own page. Their goal at a glance and their meals. Settings live in the menu.

// Me is the person's place: who I am and how I'm set up. Each row opens its panel; back comes here.
const ME_ROWS: { id: MenuSection; name: string; icon: ReactNode; hint: (p: AppApi) => string }[] = [
  { id: "profile", get name() { return w("me.rowProfile"); }, icon: <User size={18} />, hint: (p) => (p.safety.declaredAt ? w("me.yourBodyDataAndThe") : w("me.yourBodyDataAndA")) },
  { id: "goal", get name() { return w("me2.goal"); }, icon: <Target size={18} />, hint: (p) => (p.state.goals.calories ? w("me.goalHint", { kcal: Math.round(p.state.goals.calories).toLocaleString(numLocale()), protein: p.state.goals.protein ?? "?" }) : w("me.calculateItOrSetIt")) },
  { id: "life", get name() { return w("me2.lifestyle"); }, icon: <Coffee size={18} />, hint: (p) => lifeHint(p) },
  { id: "week", get name() { return w("me.trainingWeek"); }, icon: <CalendarDays size={18} />, hint: (p) => planHint(p) },
  // DT178 (0.3.21, board Stories126): Google Calendar, under Training week
  { id: "calendar", get name() { return w("me.googleCalendar"); }, icon: <CalendarClock size={18} />, hint: (p) => (p.personal.calendar?.on ? w("me.onYourPlanInThe") : w("me.offYourMealsCookingAnd")) },
  { id: "shop", get name() { return w("me.whereIShopAndCook"); }, icon: <ShoppingBasket size={18} />, hint: () => w("me.shopHint") },
  // DT167 (0.3.9, board Stories119): Your summary, where the steps end
  { id: "summary", get name() { return w("me.yourSummary"); }, icon: <ClipboardList size={18} />, hint: (p) => (p.profile.coachId ? w("me.summaryHintCoach", { coach: p.coachLabel }) : w("me.everythingYouToldChefMealan")) },
  // DT209 (0.3.50, board Stories156): My coach is its own row under Your summary, not a setup step; a coach account has none
  { id: "coach", get name() { return w("me.myCoach"); }, icon: <Users size={18} />, hint: (p) => (p.profile.coachId ? `${p.coachLabel} sees what you share` : w("me.joinWithACode")) },
  { id: "account", get name() { return w("me.rowAccount"); }, icon: <KeyRound size={18} />, hint: () => w("me.accountHint") },
];
// the two speeds: Lifestyle changes when life does, the Training week when the activity does
function lifeHint(p: AppApi): string {
  if (!p.personal.lifestyle) return w("me.lifeHint");
  const l = lifestyleOf(p.personal);
  // plain English (7 October 2026): "Work, fixed hours, 9 to 5"
  const wk = weekdaysOf(l);
  const first = WEEKDAY_CHOICES.find((x) => x.id === wk)!.name;
  const parts = wk === "work" || wk === "both" ? [first, (HOURS.find((h) => h.id === l.hours)?.name ?? "").toLowerCase(), l.hours === "fixed" && l.slot ? (l.slot === "my" ? (l.workFrom && l.workTo ? `${l.workFrom} to ${l.workTo}` : "") : SLOTS.find((s) => s.id === l.slot)!.name) : ""] : [first];
  return parts.filter(Boolean).join(", ");
}
function planHint(p: AppApi): string {
  const plan = planOf(p.personal);
  if (!plan) return w("me.weekHint");
  // the same words as Calculate for me (7 October 2026)
  const n = plan.filter((d) => d.kind !== "rest").length;
  return n === 0 ? w("me.noTrainingDaysYet") : `${n} training ${n === 1 ? "day" : "days"} and ${7 - n} without`;
}
export function MeScreen(p: AppApi) {
  const { state, goal, profile, clientName } = p;
  const coachName = profile.coachName || COACH_NAME;
  const bandName = goal?.band ? goalName(goal.band) : null;
  const setBy = goal?.setBy === "coach" ? (goal.coachName || coachName) : "you";
  const missing = setupMissing({ personal: p.personal, safety: p.safety, goal: p.goal, region: p.region });
  return (
    <>
      <section className="plan">
        <div className="plan-top"><span>{clientName ? `${clientName}'s goal` : w("me.myGoal")}{bandName ? `: ${bandName}` : ""}</span><span>{goal?.setBy === "coach" ? `set by ${setBy}` : ""}</span></div>
        {/* DT208 (0.3.49): the same row as on Today */}
        <SetupRow p={p} done={w("me.fullySet")} />
        <div className="plan-row">
          {/* the three numbers of the same day, the average one (11 October 2026: the PD was today's, the kcal and protein the average's) */}
          <div><b>{pdVal(density(state.goals.protein, state.goals.calories))}</b><small>{w("me.pdAverageDay", { pd: pdTag() })}</small></div>
          <div><b>{fmt(state.goals.calories, 0)}</b><small>{w("me.kcalAverageDay")}</small></div>
          <div><b>{fmt(state.goals.protein, 0)}</b><small>{w("me.gProtein")}</small></div>
        </div>
        <div className="button-row"><button className="pill pill-small" onClick={() => p.openMenu("goal")}><Settings size={14} /> {w("me.goalAndProfile")}</button></div>
        {/* weigh-ins (boards W1, Y1 column 17): moved here from Today on 10 October 2026; with consent for body data, never for someone who declared an eating situation */}
        {p.safety.consentBodyAt && !weighInsOff(p.safety) && (p.travel?.weighPaused
          ? <div className="weigh-line weigh-paused" role="note"><span><b>{w("me.weighIn")}</b><small>Paused while you travel in {placeName(p.travel.place)}. Your trend keeps your home mornings.</small></span></div>
          : <WeighInLine list={p.personal.weighIns} onSave={(wl) => p.setPersonal({ ...p.personal, weighIns: wl })} notify={p.notify} />)}
      </section>
      {/* DT176 (0.3.19, board Stories124): Travel mode, above the steps */}
      <TravelCard p={p} />
      <div className="menu-list me-rows">
        {ME_ROWS.filter((r) => !(r.id === "coach" && (p.profile.role === "coach" || p.isCoach))).map((r) => {
          // DT208: a step still to set says To do and what is missing; a step done shows its usual line, no tag
          const miss = stepMissing(missing, r.id as SetupStep);
          const hint = !miss.length ? r.hint(p) : r.id === "profile" ? `${miss.map((x) => x.label).join(", ").replace(/^./, (c) => c.toUpperCase())} missing` : w("me.notSetYet");
          return (
          <button key={r.id} className="menu-row" onClick={() => p.openMenu(r.id, "me" as any)}>
            <span className="menu-icon">{r.icon}</span><span className="menu-row-text"><b>{r.name}</b><small>{hint}</small></span>{miss.length > 0 && <span className="me-todo">{w("me.toDo")}</span>}<ChevronRight size={18} />
          </button>
        ); })}
      </div>
    </>
  );
}

// DT167 (0.3.9, board Stories119; Coach Milan 09:53: "the taste block is sitting alone here"): Taste moved from the bottom of Me into
// Lifestyle, under Nutrition, after What you eat, as it was
export function TasteSetting(p: AppApi) {
  const { state } = p;
  return (
    <>
      {/* R22 (0.2.50, board RS21): chips first, each one fixed meaning; your own words for what no chip says */}
      <div className="setting taste-card" aria-label={w("me.tasteIsPartOfThe")}>
        <small className="setting-name">{w("me.taste")}</small>
        <small>{w("me.tapWhatIsTrueFor")}</small>
        {([["like", w("me.iLike")], ["not", w("me.ratherNot")], ["how", w("me.howIEat")]] as const).map(([g, title]) => (
          <div key={g} className="taste-group">
            <p className="label">{title}</p>
            <div className="moments" role="group" aria-label={title}>
              {TASTE_CHIPS[g].map((c) => { const on = (p.personal.tasteChips?.[g] ?? []).includes(c); return (
                <button key={c} type="button" className={`choice ${on ? "on" : ""}`} aria-pressed={on} onClick={() => p.setPersonal({ ...p.personal, tasteChips: toggleChip(p.personal.tasteChips, g, c) })}>{optWord(c)}</button>
              ); })}
            </div>
          </div>
        ))}
        <p className="label">{w("me.inYourOwnWords")}</p>
        <textarea className="taste-words" aria-label={w("me.yourTasteInYourOwn")} placeholder={w("me.anythingTheChipsDonT")} value={state.preferences} onChange={(e) => p.setState((s) => ({ ...s, preferences: e.target.value }))} />
      </div>
    </>
  );
}
