// DT214 v2 (0.3.53, board Stories162): while a cook runs, a strip on every tab, never above the page's title: Cooking now, the
// dish, the step, Go on. After eating it says when Chef Mealan asks how it carried you.
import { w as wd, wn as wdn, dateText } from "../words";
import { useEffect, useState } from "react";
import type { AppApi } from "../screens/api";
import { stripWords, staleCook, stepAt } from "../cooking";
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
  // DT273 (0.3.123, board Stories202): a cook left open for more than a day is asked about once, in place of the strip
  const stale = staleCook(c);
  if (stale) { const at = stepAt(c); return (
    <section className="card cook-stale" role="group" aria-label={wd("strip.staleAria", { title: c.title })}>
      <b>{at ? wd("strip.staleAt", { title: c.title, day: dateText(new Date(stale.since), { day: "numeric", month: "long" }), k: at.k, n: at.n }) : wd("strip.staleNoStep", { title: c.title, day: dateText(new Date(stale.since), { day: "numeric", month: "long" }) })}</b>
      <small>{wdn("strip.staleDays", stale.days)}</small>
      <div className="cook-stale-go">
        <button type="button" className="pill pill-small pill-primary cs-stale-end" onClick={() => p.endCook()}>{wd("strip.endIt")}</button>
        <button type="button" className="pill pill-small cs-stale-go" onClick={() => { p.cookAsked(); p.goOnCook(); }}>{wd("strip.goOnWithIt")}</button>
      </div>
      <small className="cook-stale-help">{wd("strip.staleHelp")}</small>
    </section>
  ); }
  if (ask && cooking) return (
    <div className="cook-strip cook-strip-ask" role="group" aria-label={wd("strip.stopCooking", { title: c.title })}>
      <span className="cs-words"><b>{c.title}</b></span>
      {ask === "choose"
        ? <><button type="button" className="pill pill-small" onClick={() => { setAsk(null); p.saveCookForLater(); }}>{wd("strip.saveForLater")}</button><button type="button" className="pill pill-small cs-end-it" onClick={() => setAsk("end")}>{wd("strip.endIt")}</button></>
        : <button type="button" className="pill pill-small cs-end-it" onClick={() => { setAsk(null); p.endCook(); }}>{wd("strip.tapAgainToEnd")}</button>}
      <button type="button" className="link cs-keep" onClick={() => setAsk(null)}>{wd("strip.keep")}</button>
    </div>
  );
  return (
    <div className="cook-strip">
      <button type="button" className="cs-main" onClick={() => p.goOnCook()} aria-label={wd("strip.goOnAria", { lead: w.lead, rest: w.rest })}>
        <Mark size={16} color="var(--brand)" />
        <span className="cs-words"><b>{w.lead}</b> · {w.rest}</span>
        <b className="cs-go">{wd("strip.goOn")}</b>
      </button>
      <button type="button" className="cs-end" aria-label={cooking ? wd("strip.stopCooking", { title: c.title }) : wd("strip.endTheCook")} onClick={() => (cooking ? setAsk("choose") : p.endCook())}>✕</button>
    </div>
  );
}
