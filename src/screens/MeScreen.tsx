import { Settings } from "lucide-react";
import { fmt, pdText, pdVal, pdTag, pdRange } from "../ui";
import { COACH_NAME } from "../components/Mark";
import { bandOf } from "../goal";
import { MOMENTS } from "../moments";
import { SendSheet } from "./CoachScreen";
import { useState, type ReactNode } from "react";
import { ChevronRight, User, Target, CalendarDays, ShoppingBasket, Users, KeyRound } from "lucide-react";
import type { MenuSection } from "./api";
import type { AppApi } from "./api";

// Me: the person's own page. Their goal at a glance and their meals. Settings live in the menu.

// Me is the person's place: who I am and how I'm set up. Each row opens its panel; back comes here.
const ME_ROWS: { id: MenuSection; name: string; icon: ReactNode; hint: (p: AppApi) => string }[] = [
  { id: "profile", name: "Profile", icon: <User size={18} />, hint: (p) => (p.safety.declaredAt ? "Body data and the door, answered" : "Body data and the door") },
  { id: "goal", name: "Goal", icon: <Target size={18} />, hint: (p) => (p.state.goals.calories ? `${Math.round(p.state.goals.calories).toLocaleString("en")} kcal · ${p.state.goals.protein ?? "?"} g protein` : "Work it out, or set it") },
  { id: "week", name: "My days", icon: <CalendarDays size={18} />, hint: (p) => (p.personal.dayMode === "follow" ? "Follow my day" : "Every day the same") },
  { id: "shop", name: "Where I shop", icon: <ShoppingBasket size={18} />, hint: () => "The starter foods for your shops" },
  { id: "coach", name: "My coach", icon: <Users size={18} />, hint: (p) => (p.profile.coachId ? `${p.coachLabel} sees what you share` : "Join with a code") },
  { id: "account", name: "Account", icon: <KeyRound size={18} />, hint: () => "Export my data, delete my account" },
];
export function MeScreen(p: AppApi) {
  const { state, goal, profile, clientName } = p;
  const [shareFor, setShareFor] = useState<string | null>(null);
  const [sendCard, setSendCard] = useState<any>(null);
  const coachName = profile.coachName || COACH_NAME;
  const isCoach = profile.role === "coach";
  const bandName = goal?.band ? bandOf(goal.band)?.name : null;
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
        <div className="card-top"><span>Your meals</span><span>{state.feedback.length}</span></div>
        {state.feedback.length === 0 && <small>Nothing yet. It starts after your first DaaM.</small>}
        {state.feedback.slice(0, 12).map((f) => (
          <div className="fb" key={f.id}>
            {f.photo && <img className="fb-photo" src={f.photo} alt="" />}
            <b>{f.taste}</b>
            <small>{f.meal.title}{f.moment && f.moment !== "regular" ? ` · ${MOMENTS.find((m) => m.id === f.moment)?.name}` : ""} · {new Date(f.createdAt).toLocaleDateString()}{f.notes ? ` · ${f.notes}` : ""}</small>
            {profile.coachId && (f.shared
              ? <small className="shared-tag">Shared: {({ look: "look at this", ok: "was this OK?", help: "help me next time" } as const)[f.shared.reason]}</small>
              : shareFor === f.id
                ? <div className="reasons">
                    {([["look", "Look at this"], ["ok", "Was this OK?"], ["help", "Help me next time"]] as const).map(([k, l]) => (
                      <button key={k} className="pill pill-small" onClick={() => { p.shareCard(f.id, k); setShareFor(null); }}>{l}</button>
                    ))}
                    <button className="link" onClick={() => setShareFor(null)}>Cancel</button>
                  </div>
                : <button className="link" onClick={() => setShareFor(f.id)}>Share with {coachName}</button>)}
            {isCoach && <button className="link" onClick={() => setSendCard(f)}>Send to a client</button>}
          </div>
        ))}
        {sendCard && <SendSheet card={sendCard} close={() => setSendCard(null)} {...p} />}
      </section>
    </>
  );
}
