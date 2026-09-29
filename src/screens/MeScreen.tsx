import { Settings } from "lucide-react";
import { fmt } from "../ui";
import { COACH_NAME } from "../components/Mark";
import { bandOf } from "../goal";
import { MOMENTS } from "../moments";
import { SendSheet } from "./CoachScreen";
import { useState } from "react";
import type { AppApi } from "./api";

// Me: the person's own page. Their goal at a glance and their meals. Settings live in the menu.
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
          <div><b>{p.dayPd !== null ? p.dayPd.toFixed(1) : "?"}</b><small>PD target</small></div>
          <div><b>{fmt(state.goals.calories, 0)}</b><small>kcal a day</small></div>
          <div><b>{fmt(state.goals.protein, 0)}</b><small>g protein</small></div>
        </div>
        <div className="button-row"><button className="pill pill-small" onClick={() => p.openMenu("goal")}><Settings size={14} /> Goal and profile</button></div>
      </section>
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
