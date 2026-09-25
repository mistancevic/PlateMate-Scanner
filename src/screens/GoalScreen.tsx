import { useState } from "react";
import { BANDS, saveGoal, goalsForBand } from "../goal";
import { density } from "../pilot";
import { fixed } from "../ui";
import { Mark, APP_NAME } from "../components/Mark";
import type { AppApi } from "./api";

export function GoalScreen(p: AppApi & { onDone: () => void }) {
  const { state, setState, onDone, coach } = p;
  const [own, setOwn] = useState(false);
  const [kcal, setKcal] = useState(state.goals.calories ? String(state.goals.calories) : "");
  const [protein, setProtein] = useState(state.goals.protein ? String(state.goals.protein) : "");
  const ownPd = density(Number(protein) || null, Number(kcal) || null);
  return (
    <div className="goal-screen">
      <div className="hero"><Mark size={56} color="var(--brand)" /><h2>{APP_NAME}</h2><p>One question, then every number you see is against your target.</p></div>
      <h3>What are you after?</h3>
      {!own && (
        <div className="bands">
          {BANDS.map((b) => (
            <button key={b.id} className="band-card" onClick={() => {
              const g = goalsForBand(b);
              setState((s) => ({ ...s, goals: { ...s.goals, calories: g.calories, protein: g.protein } }));
              saveGoal({ band: b.id, setBy: coach ? "coach" : "you", setAt: new Date().toISOString() });
              onDone();
            }}>
              <b>{b.name}</b><small>{b.who}</small>
              <em>{b.kcal[0].toLocaleString()} to {b.kcal[1].toLocaleString()} kcal · {b.protein[0]} to {b.protein[1]} g protein</em>
              <span>{b.range}</span>
            </button>
          ))}
          <button className="link" onClick={() => setOwn(true)}>I know my calories and protein</button>
        </div>
      )}
      {own && (
        <div className="own-goal">
          <label className="field"><span>calories a day</span><input inputMode="numeric" value={kcal} onChange={(e) => setKcal(e.target.value)} placeholder="2200" /></label>
          <label className="field"><span>protein a day, g</span><input inputMode="numeric" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="140" /></label>
          <p className="small">That is PD {fixed(ownPd)}, protein per 100 kcal.</p>
          <button className="pill pill-primary pill-wide" disabled={!ownPd} onClick={() => {
            setState((s) => ({ ...s, goals: { ...s.goals, calories: Number(kcal), protein: Number(protein) } }));
            saveGoal({ setBy: coach ? "coach" : "you", setAt: new Date().toISOString() });
            onDone();
          }}>Set my goal</button>
          <button className="link" onClick={() => setOwn(false)}>Back to the goals</button>
        </div>
      )}
    </div>
  );
}
