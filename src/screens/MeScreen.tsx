import { Settings , Coffee } from "lucide-react";
import { fmt, pdText, pdVal, pdTag, pdRange } from "../ui";
import { density } from "../pilot";
import { COACH_NAME } from "../components/Mark";
import { WeighInLine } from "../components/Weight";
import { weighInsOff } from "../weight";
import { bandOf, goalLabel } from "../goal";
import type { ReactNode } from "react";
import { ChevronRight, User, Target, CalendarDays, ShoppingBasket, Users, KeyRound } from "lucide-react";
import type { MenuSection } from "./api";
import { TASTE_CHIPS, toggleChip } from "../tasteChips";
import { lifestyleOf, planOf } from "../personal";
import { HOURS, SLOTS, weekdaysOf, WEEKDAY_CHOICES } from "../plan";
import type { AppApi } from "./api";

// Me: the person's own page. Their goal at a glance and their meals. Settings live in the menu.

// Me is the person's place: who I am and how I'm set up. Each row opens its panel; back comes here.
const ME_ROWS: { id: MenuSection; name: string; icon: ReactNode; hint: (p: AppApi) => string }[] = [
  { id: "profile", name: "Profile", icon: <User size={18} />, hint: (p) => (p.safety.declaredAt ? "Your body data, and the health questions you answered" : "Your body data, and a few health questions") },
  { id: "goal", name: "Goal", icon: <Target size={18} />, hint: (p) => (p.state.goals.calories ? `${Math.round(p.state.goals.calories).toLocaleString("en")} kcal and ${p.state.goals.protein ?? "?"} g protein a day` : "Calculate it, or set it") },
  { id: "life", name: "Lifestyle", icon: <Coffee size={18} />, hint: (p) => lifeHint(p) },
  { id: "week", name: "Training week", icon: <CalendarDays size={18} />, hint: (p) => planHint(p) },
  { id: "shop", name: "Where I shop and cook", icon: <ShoppingBasket size={18} />, hint: () => "Your shops, the kitchens you cook, and what you cook with" },
  { id: "coach", name: "My coach", icon: <Users size={18} />, hint: (p) => (p.profile.coachId ? `${p.coachLabel} sees what you share` : "Join with a code") },
  { id: "account", name: "Account", icon: <KeyRound size={18} />, hint: () => "Export my data, delete my account" },
];
// the two speeds: Lifestyle changes when life does, the Training week when the activity does
function lifeHint(p: AppApi): string {
  if (!p.personal.lifestyle) return "How you eat, work and sleep. Set once.";
  const l = lifestyleOf(p.personal);
  // plain English (7 October 2026): "Work, fixed hours, 9 to 5"
  const wk = weekdaysOf(l);
  const first = WEEKDAY_CHOICES.find((x) => x.id === wk)!.name;
  const parts = wk === "work" || wk === "both" ? [first, (HOURS.find((h) => h.id === l.hours)?.name ?? "").toLowerCase(), l.hours === "fixed" && l.slot ? (l.slot === "my" ? (l.workFrom && l.workTo ? `${l.workFrom} to ${l.workTo}` : "") : SLOTS.find((s) => s.id === l.slot)!.name) : ""] : [first];
  return parts.filter(Boolean).join(", ");
}
function planHint(p: AppApi): string {
  const plan = planOf(p.personal);
  if (!plan) return "What each day of your usual week holds";
  // the same words as Calculate for me (7 October 2026)
  const n = plan.filter((d) => d.kind !== "rest").length;
  return n === 0 ? "No training days yet" : `${n} training ${n === 1 ? "day" : "days"} and ${7 - n} without`;
}
export function MeScreen(p: AppApi) {
  const { state, goal, profile, clientName } = p;
  const coachName = profile.coachName || COACH_NAME;
  const bandName = goal?.band ? goalLabel(goal.band) : null;
  const setBy = goal?.setBy === "coach" ? (goal.coachName || coachName) : "you";
  return (
    <>
      <section className="plan">
        <div className="plan-top"><span>{clientName ? `${clientName}'s goal` : "My goal"}{bandName ? `: ${bandName}` : ""}</span><span>{goal?.setBy === "coach" ? `set by ${setBy}` : ""}</span></div>
        <div className="plan-row">
          {/* the three numbers of the same day, the average one (11 October 2026: the PD was today's, the kcal and protein the average's) */}
          <div><b>{pdVal(density(state.goals.protein, state.goals.calories))}</b><small>{pdTag()}, average day</small></div>
          <div><b>{fmt(state.goals.calories, 0)}</b><small>kcal, average day</small></div>
          <div><b>{fmt(state.goals.protein, 0)}</b><small>g protein</small></div>
        </div>
        <div className="button-row"><button className="pill pill-small" onClick={() => p.openMenu("goal")}><Settings size={14} /> Goal and profile</button></div>
        {/* weigh-ins (boards W1, Y1 column 17): moved here from Today on 10 October 2026; with consent for body data, never for someone who declared an eating situation */}
        {p.safety.consentBodyAt && !weighInsOff(p.safety) && <WeighInLine list={p.personal.weighIns} onSave={(w) => p.setPersonal({ ...p.personal, weighIns: w })} notify={p.notify} />}
      </section>
      <div className="menu-list me-rows">
        {ME_ROWS.map((r) => (
          <button key={r.id} className="menu-row" onClick={() => p.openMenu(r.id, "me" as any)}>
            <span className="menu-icon">{r.icon}</span><span className="menu-row-text"><b>{r.name}</b><small>{r.hint(p)}</small></span><ChevronRight size={18} />
          </button>
        ))}
      </div>
      {/* R22 (0.2.50, board RS21): chips first, each one fixed meaning; your own words for what no chip says */}
      <section className="card taste-card" aria-label="Taste is part of the plan">
        <div className="card-top"><span>Taste is part of the plan</span></div>
        <small>Tap what is true for you. Chef Mealan reads it with every idea, every answer about a plate and every set of steps. It never changes your numbers.</small>
        {([["like", "I like"], ["not", "Rather not"], ["how", "How I eat"]] as const).map(([g, title]) => (
          <div key={g} className="taste-group">
            <p className="label">{title}</p>
            <div className="moments" role="group" aria-label={title}>
              {TASTE_CHIPS[g].map((c) => { const on = (p.personal.tasteChips?.[g] ?? []).includes(c); return (
                <button key={c} type="button" className={`choice ${on ? "on" : ""}`} aria-pressed={on} onClick={() => p.setPersonal({ ...p.personal, tasteChips: toggleChip(p.personal.tasteChips, g, c) })}>{c}</button>
              ); })}
            </div>
          </div>
        ))}
        <p className="label">In your own words</p>
        <textarea className="taste-words" aria-label="Your taste in your own words" placeholder="Anything the chips don't say" value={state.preferences} onChange={(e) => p.setState((s) => ({ ...s, preferences: e.target.value }))} />
      </section>
    </>
  );
}
