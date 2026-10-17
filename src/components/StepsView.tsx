import { tempsIn } from "../units";
import { headingOf } from "../stepsState";

// The original's steps as steps (0.2.25, canvas board RP, RP1 to RP1c): numbered, one a line, the page's headings in bold,
// temperatures in your unit. For you only, word for word.
export function OriginalSteps({ steps }: { steps: string[] }) {
  return (
    <ol className="rp-steps rp-orig">{steps.map((x, k) => {
      const t = tempsIn(x), h = headingOf(t);
      return <li key={k}><span>{k + 1}</span><div className="rp-step-text">{h ? <><b>{h.head}.</b> {h.rest}</> : t}</div></li>;
    })}</ol>
  );
}
// the line that says which case it is: the original works as it is (ok), or what differs (warn)
export const StepsHint = ({ tone, children }: { tone: "ok" | "warn"; children: React.ReactNode }) => <div className={`st-hint ${tone}`} role="note">{tone === "ok" ? "✓ " : ""}{children}</div>;
