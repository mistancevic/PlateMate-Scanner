// What Mealan says before any AI answer: the fixed response for each declared situation, or that the chat is off.
// Written once, never improvised; the model is told not to repeat it.
import { FIXED, SITUATIONS, DOOR_WHY, type AiState, type Safety } from "../safety";

export function SafetyNote({ safety, ai, onAnswer }: { safety: Safety; ai: AiState; onAnswer?: () => void }) {
  // DT141 (0.2.126): when the chat waits for the question, the line says so and Answer it now opens it, here
  if (!ai.on && ai.why === DOOR_WHY) return <div className="safety-note off"><p>{DOOR_WHY}</p>{onAnswer && <button type="button" className="pill pill-small pill-primary" onClick={onAnswer}>Answer it now</button>}</div>;
  if (!ai.on) return <div className="safety-note off"><b>Chef Mealan, as a chef only.</b><p>{ai.why || FIXED.off}</p></div>;
  if (!safety.situations.length) return null;
  return (
    <div className="safety-note">
      <b>Chef Mealan, as a chef only.</b>
      {safety.situations.map((id) => <p key={id}><small>{SITUATIONS.find((x) => x.id === id)?.label}.</small> {FIXED[id]}</p>)}
    </div>
  );
}
