import { Settings , Coffee } from "lucide-react";
import { fmt, pdText, pdVal, pdTag, pdRange } from "../ui";
import { COACH_NAME } from "../components/Mark";
import { bandOf, goalLabel } from "../goal";
import type { ReactNode } from "react";
import { ChevronRight, User, Target, CalendarDays, ShoppingBasket, Users, KeyRound } from "lucide-react";
import type { MenuSection } from "./api";
import { lifestyleOf, planOf } from "../personal";
import { HOURS, SLOTS, weekdaysOf, WEEKDAY_CHOICES } from "../plan";
import type { AppApi } from "./api";

// Me: the person's own page. Their goal at a glance and their meals. Settings live in the menu.

// Me is the person's place: who I am and how I'm set up. Each row opens its panel; back comes here.
const ME_ROWS: { id: MenuSection; name: string; icon: ReactNode; hint: (p: AppApi) => string }[] = [
  { id: "profile", name: "Profile", icon: <User size={18} />, hint: (p) => (p.safety.declaredAt ? "Your body data, and the health questions you answered" : "Your body data, and a few health questions") },
  { id: "goal", name: "Goal", icon: <Target size={18} />, hint: (p) => (p.state.goals.calories ? `${Math.round(p.state.goals.calories).toLocaleString("en")} kcal and ${p.state.goals.protein ?? "?"} g protein a day` : "Work it out, or set it") },
  { id: "life", name: "Lifestyle", icon: <Coffee size={18} />, hint: (p) => lifeHint(p) },
  { id: "week", name: "Weekly plan", icon: <CalendarDays size={18} />, hint: (p) => planHint(p) },
  { id: "shop", name: "Where I shop", icon: <ShoppingBasket size={18} />, hint: () => "Pick your shops; the starter foods follow" },
  { id: "coach", name: "My coach", icon: <Users size={18} />, hint: (p) => (p.profile.coachId ? `${p.coachLabel} sees what you share` : "Join with a code") },
  { id: "account", name: "Account", icon: <KeyRound size={18} />, hint: () => "Export my data, delete my account" },
];
// the two speeds: Lifestyle changes when life does, the Weekly plan when the activity does
function lifeHint(p: AppApi): string {
  if (!p.personal.lifestyle) return "How you eat, work and sleep. Set once.";
  const l = lifestyleOf(p.personal);
  // plain English (7 October 2026): "Work, fixed hours, 9 to 5"
  const wk = weekdaysOf(l);
  const first = WEEKDAY_CHOICES.find((x) => x.id === wk)!.name;
  const parts = wk === "work" || wk === "both" ? [first, (HOURS.find((h) => h.id === l.hours)?.name ?? "").toLowerCase(), l.hours === "fixed" && l.slot ? SLOTS.find((s) => s.id === l.slot)!.name : ""] : [first];
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
        <div className="plan-top"><span>{clientName ? `${clientName}'s goal` : "Your goal"}{bandName ? `: ${bandName}` : ""}</span><span>set by {setBy}</span></div>
        <div className="plan-row">
          <div><b>{pdVal(p.dayPd)}</b><small>{pdTag()} target</small></div>
          <div><b>{fmt(state.goals.calories, 0)}</b><small>kcal a day</small></div>
          <div><b>{fmt(state.goals.protein, 0)}</b><small>g protein</small></div>
        </div>
        <div className="button-row"><button className="pill pill-small" onClick={() => p.openMenu("goal")}><Settings size={14} /> Goal and profile</button></div>
      </section>
      <div className="menu-list me-rows">
        {ME_ROWS.map((r) => (
          <button key={r.id} className="menu-row" onClick={() => p.openMenu(r.id, "me" as any)}>
            <span className="menu-icon">{r.icon}</span><span className="menu-row-text"><b>{r.name}</b><small>{r.hint(p)}</small></span><ChevronRight size={18} />
          </button>
        ))}
      </div>
      <section className="card">
        <div className="card-top"><span>Taste is part of the plan</span></div>
        <small>What makes food work for you: creamy rather than sour, keep the chocolate flavour, small portions, quick preparation. Chef Mealan reads it; it never changes your numbers.</small>
        <textarea placeholder="Your taste and practical preferences" value={state.preferences} onChange={(e) => p.setState((s) => ({ ...s, preferences: e.target.value }))} />
      </section>
    </>
  );
}
