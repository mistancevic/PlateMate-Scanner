// What Mealan says before any AI answer: the fixed response for each declared situation, or that the chat is off.
// Written once, never improvised; the model is told not to repeat it.
import { FIXED, SITUATIONS, type AiState, type Safety } from "../safety";

export function SafetyNote({ safety, ai }: { safety: Safety; ai: AiState }) {
  if (!ai.on) return <div className="safety-note off"><b>Mealan, chef only here.</b><p>{ai.why || FIXED.off}</p></div>;
  if (!safety.situations.length) return null;
  return (
    <div className="safety-note">
      <b>Mealan, chef only here.</b>
      {safety.situations.map((id) => <p key={id}><small>{SITUATIONS.find((x) => x.id === id)?.label}.</small> {FIXED[id]}</p>)}
    </div>
  );
}
