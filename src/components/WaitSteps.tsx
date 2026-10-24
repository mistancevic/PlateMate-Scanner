// DT111 (0.2.94, board Stories67; Milan 25 October 00:36 and 00:51): the wait on Chef Mealan shows its real steps, the way a
// thinking block does: collapsed, only the step under way is visible, with a > at the end; a tap opens all of them, ticked as
// they pass. The steps are the code's own stages, so the lines are true, never decoration.
import { useState } from "react";
export type WaitStep = { key: string; text: string };
export function WaitSteps({ steps, at, done = [] }: { steps: WaitStep[]; at: string; done?: string[] }) {
  const [open, setOpen] = useState(false);
  const now = steps.find((s) => s.key === at) ?? steps[0];
  if (!now) return null;
  const state = (k: string) => (done.includes(k) ? "done" : k === at ? "now" : "next");
  return (
    <div className={`wait-steps ${open ? "open" : ""}`} aria-live="polite">
      <button type="button" className="wait-head" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="wait-dots" aria-hidden="true"><span /><span /><span /></span>
        <span className="wait-now">{now.text}</span>
        <span className="wait-chev" aria-hidden="true">{open ? "⌄" : "›"}</span>
      </button>
      {open && (
        <ol className="wait-list">
          {steps.map((s) => <li key={s.key} className={`wait-${state(s.key)}`}><span className="wait-mark" aria-hidden="true">{state(s.key) === "done" ? "✓" : state(s.key) === "now" ? "●" : "○"}</span>{s.text}</li>)}
        </ol>
      )}
    </div>
  );
}
