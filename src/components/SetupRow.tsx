// DT208 (0.3.49, board Stories155 version 6): one row under the goal, on Today and on Me. Something missing: To set: height,
// goal, training week, by name, no count; a tap opens the first one. Nothing missing: Profile and plan fully set, quietly.
import { ChevronRight } from "lucide-react";
import type { AppApi } from "../screens/api";
import { setupMissing, toSetLine, askFocus } from "../setup";
export function SetupRow({ p, done }: { p: AppApi; done: string }) {
  const m = setupMissing({ personal: p.personal, safety: p.safety, goal: p.goal, region: p.region });
  if (!m.length) return <small className="setup-done">✓ {done}</small>;
  const go = () => { const f = m[0]; if (f.step === "goal") { p.openGoal(); return; } if (f.field) askFocus(f.field); p.openMenu(f.step); };
  return <button type="button" className="setup-line" onClick={go}><span>{toSetLine(m)}</span><ChevronRight size={18} aria-hidden="true" /></button>;
}
