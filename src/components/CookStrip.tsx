// DT214 v2 (0.3.53, board Stories162): while a cook runs, a strip on every tab, never above the page's title: Cooking now, the
// dish, the step, Go on. After eating it says when Chef Mealan asks how it carried you.
import { useEffect, useState } from "react";
import type { AppApi } from "../screens/api";
import { stripWords } from "../cooking";
import { Mark } from "./Mark";
export function CookStrip({ p }: { p: AppApi }) {
  const c = p.state.cook;
  const [, tick] = useState(0);
  // 0.3.64 (Coach Milan 22:39, Go): a ✕ at every stage; while cooking it asks: Save for later, or End it (one more tap)
  const [ask, setAsk] = useState<null | "choose" | "end">(null);
  // the minutes count down while it waits for the last question
  useEffect(() => { if (c?.stage !== "carry") return; const t = setInterval(() => tick((n) => n + 1), 30000); return () => clearInterval(t); }, [c?.stage]);
  if (!c || c.inView) return null;
  const w = stripWords(c);
  if (!w) return null;
  // DT218 (0.3.58, board Stories164; Coach Milan 2 November 17:53): after eating, Go on asks on the meal's card, and a ✕ ends
  // the cook without the last answer; the card keeps everything else
  const cooking = c.stage === "make" || c.stage === "eat";
  if (ask && cooking) return (
    <div className="cook-strip cook-strip-ask" role="group" aria-label={`Stop cooking ${c.title}`}>
      <span className="cs-words"><b>{c.title}</b></span>
      {ask === "choose"
        ? <><button type="button" className="pill pill-small" onClick={() => { setAsk(null); p.saveCookForLater(); }}>Save for later</button><button type="button" className="pill pill-small cs-end-it" onClick={() => setAsk("end")}>End it</button></>
        : <button type="button" className="pill pill-small cs-end-it" onClick={() => { setAsk(null); p.endCook(); }}>Tap again to end</button>}
      <button type="button" className="link cs-keep" onClick={() => setAsk(null)}>Keep</button>
    </div>
  );
  return (
    <div className="cook-strip">
      <button type="button" className="cs-main" onClick={() => p.goOnCook()} aria-label={`${w.lead}: ${w.rest}. Go on`}>
        <Mark size={16} color="var(--brand)" />
        <span className="cs-words"><b>{w.lead}</b> · {w.rest}</span>
        <b className="cs-go">Go on ›</b>
      </button>
      <button type="button" className="cs-end" aria-label={cooking ? `Stop cooking ${c.title}` : "End the cook"} onClick={() => (cooking ? setAsk("choose") : p.endCook())}>✕</button>
    </div>
  );
}
