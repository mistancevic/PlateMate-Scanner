// DT214 v2 (0.3.53, board Stories162): while a cook runs, a strip on every tab, never above the page's title: Cooking now, the
// dish, the step, Go on. After eating it says when Chef Mealan asks how it carried you.
import { useEffect, useState } from "react";
import type { AppApi } from "../screens/api";
import { stripWords } from "../cooking";
import { Mark } from "./Mark";
export function CookStrip({ p }: { p: AppApi }) {
  const c = p.state.cook;
  const [, tick] = useState(0);
  // the minutes count down while it waits for the last question
  useEffect(() => { if (c?.stage !== "carry") return; const t = setInterval(() => tick((n) => n + 1), 30000); return () => clearInterval(t); }, [c?.stage]);
  if (!c || c.inView) return null;
  const w = stripWords(c);
  if (!w) return null;
  // DT218 (0.3.58, board Stories164; Coach Milan 2 November 17:53): after eating, Go on asks on the meal's card, and a ✕ ends
  // the cook without the last answer; the card keeps everything else
  return (
    <div className="cook-strip">
      <button type="button" className="cs-main" onClick={() => p.goOnCook()} aria-label={`${w.lead}: ${w.rest}. Go on`}>
        <Mark size={16} color="var(--brand)" />
        <span className="cs-words"><b>{w.lead}</b> · {w.rest}</span>
        <b className="cs-go">Go on ›</b>
      </button>
      {c.stage === "carry" && <button type="button" className="cs-end" aria-label="End the cook" onClick={() => p.endCook()}>✕</button>}
    </div>
  );
}
