// Plan it on a recipe's page (DT349, 0.3.193; one component since DT353, 0.3.195, board DT353, canvas Page 6). A white button
// with an arrow, ⌄ closed and ⌃ open (Coach Milan 25 November 2026, 17:11 to 17:12): it opens the Plate's day and meal block
// in place; a meal picked shows my portion for that meal on that day (nutrition rules N11 and N17), and Put it in the plan puts
// it there; a meal that holds something already is asked about first (14:42). The one filled button is Put it in the plan.
import { useState } from "react";
import { w, dec, dateText, mealV } from "../words";
import { fmt, pdVal } from "../ui";
import { aggregate, density, type Ingredient } from "../pilot";
import { plateCal, type CalInfo } from "../screens/PlateCalendar";
import { portionShare, portionsInWhole } from "../servings";
import { mealSizeOn } from "./Members";
import { slotsOn } from "../slots";
import { lifestyleOf } from "../personal";
import { ymd } from "../plan";
import type { AppApi } from "../screens/api";

export type PlanApi = { today: string; infoOf: (date: string) => CalInfo; kcalFor: (date: string, slotId: string) => number | null; put: (date: string, slotId: string, share: number) => void };

// what Plan it needs from the app, for one recipe: none on a day with no numbers. A recipe of mine goes in with its id; a
// member's recipe goes in as a meal of its own, its foods at my share.
export function planFor(p: AppApi, title: string, items: Ingredient[], mealId?: string): PlanApi | null {
  if (!p.numbersFor(new Date())) return null;
  return {
    today: ymd(new Date()),
    infoOf: (date) => { const eaten: Record<string, string[]> = {}; for (const f of p.state.feedback) if (f.status === "eaten" && f.slot?.date === date) (eaten[f.slot.slotId] ??= []).push(f.meal.title); return { slots: slotsOn(lifestyleOf(p.personal), p.personal.timesOn, date), eaten, planned: p.planned[date] }; },
    kcalFor: (date, slotId) => mealSizeOn(p, date, slotId),
    put: (date, slotId, share) => { const its = items.map((i) => ({ ...i, grams: i.grams * share })), t = aggregate(its); p.fill(date, slotId, { title, kcal: Math.round(t.calories ?? 0), protein: Math.round(t.protein ?? 0), source: "mine", ...(mealId ? { mealId } : {}), items: its, portion: Math.round(t.weight ?? 0) }); },
  };
}

export function PlanIt({ items, plan }: { items: Ingredient[]; plan: PlanApi }) {
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const [pick, setPick] = useState<{ date: string; id: string; name: string; kcal: number } | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const whole = aggregate(items.filter((i) => i.grams > 0));
  return (<>
    <button className="pill pill-wide plan-it" aria-expanded={open} onClick={() => { setOpen(!open); setPick(null); setDone(null); }}>{w("recipe.planIt")}<span className="pi-go" aria-hidden="true">{open ? " ⌃" : " ⌄"}</span></button>
    {open && !done && plateCal({ mode: "plan", day: day ?? plan.today, setDay: (d) => { setDay(d); setPick(null); }, more, setMore, now: new Date(), today: plan.today, infoOf: plan.infoOf, title: w("recipe.planWhich"),
      marked: pick ? { date: pick.date, id: pick.id } : null,
      onPick: (date, r) => { if (!r.id) return; const k = plan.kcalFor(date, r.id); const sl = plan.infoOf(date).slots.find((x) => x.id === r.id); if (k && sl) setPick({ date, id: r.id, name: sl.name, kcal: k }); } })}
    {open && pick && !done && (() => {
      const share = portionShare(pick.kcal, whole.calories), held = plan.infoOf(pick.date).planned?.[pick.id], holds = held && !held.skipped ? held.title : null, dayW = dateText(new Date(`${pick.date}T12:00:00`), { weekday: "long" });
      return (<>
        <p className="rq-choice-line"><b>{w("recipe.planPortion", { meal: mealV(pick.name, true), day: dayW, grams: fmt((whole.weight ?? 0) * share, 0), kcal: fmt((whole.calories ?? 0) * share, 0), protein: fmt((whole.protein ?? 0) * share, 0), pd: pdVal(density(whole.protein, whole.calories)) })}</b></p>
        <small className="muted">{w("recipe.planWhy", { meal: mealV(pick.name, true), size: fmt(pick.kcal, 0), x: dec(portionsInWhole(share), 1) })}</small>
        {holds && <p className="rq-plan-holds">{w("recipe.planHolds", { day: dayW, meal: mealV(pick.name, true), title: holds })}</p>}
        <button className="pill pill-wide pill-primary" onClick={() => { plan.put(pick.date, pick.id, share); setDone(w("recipe.inPlan", { day: dayW, meal: mealV(pick.name, true), grams: fmt((whole.weight ?? 0) * share, 0) })); }}>{holds ? w("recipe.replaceInPlan") : w("recipe.putInPlan")}</button>
      </>);
    })()}
    {done && <p className="rq-choice-line"><b>✓ {done}</b></p>}
  </>);
}
