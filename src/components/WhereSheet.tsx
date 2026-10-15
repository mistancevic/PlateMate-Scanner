import { ChefHat, ChevronRight } from "lucide-react";
import { aggregate, density, uid, type Food, type Ingredient } from "../pilot";
import { fmt, pdVal, pdText } from "../ui";
import { CHEF_NAME } from "../components/Mark";
import { slotsOn } from "../slots";
import { lifestyleOf } from "../personal";
import { ymd } from "../plan";
import { fitOf, type PlannedMeal } from "../planned";
import type { AppApi, Filling } from "../screens/api";

// Where does this go? (0.2.5, canvas S "Plan decides, purpose two: the store", H12): after a scan from Today the food is in
// My foods, and one question is asked. On the plate now; into a planned meal, with what the food does to its PD; a new meal
// with it, in an empty slot; or just keep it. Ask Chef Mealan what to make of it at the bottom.
export function WhereSheet(p: AppApi & { food: Food; close: () => void }) {
  const { food, close } = p;
  const key = ymd(new Date());
  const slots = slotsOn(lifestyleOf(p.personal), p.personal.timesOn, key);
  const held = p.planned[key] ?? {};
  const unit = p.personal.pdUnit === "pct" ? "pct" : "pd";
  const portion = food.serving?.grams ?? ((density(food.protein, food.calories) ?? 0) < 3 ? 50 : 100);
  const eatenIds = new Set(p.state.feedback.filter((f) => f.status === "eaten" && f.slot?.date === key).map((f) => f.slot!.slotId));
  const withMeal = slots.filter((s) => held[s.id] && !eatenIds.has(s.id));
  const empty = slots.filter((s) => !held[s.id] && !eatenIds.has(s.id));
  const foodPd = density(food.protein, food.calories);
  // the planned meal with the food added, at its portion
  const after = (m: PlannedMeal) => {
    const kcal = m.kcal + ((food.calories ?? 0) * portion) / 100, protein = m.protein + ((food.protein ?? 0) * portion) / 100;
    return { kcal, protein, pd: density(protein, kcal) };
  };
  const intoMeal = (slotId: string) => {
    const m = held[slotId]; const a = after(m);
    const item: Ingredient = { id: uid(), food: { ...food, readyToEat: true }, grams: portion, locked: true };
    const items = m.items ? [...m.items, item] : undefined;
    const t = items ? aggregate(items) : null;
    p.fill(key, slotId, { ...m, kcal: t ? Math.round(t.calories ?? a.kcal) : Math.round(a.kcal), protein: t ? Math.round(t.protein ?? a.protein) : Math.round(a.protein), items, title: m.title });
    p.notify(`${food.name} is in ${slots.find((s) => s.id === slotId)!.name.toLowerCase()}, ${m.title}.`);
    close();
  };
  const newMeal = (slotId: string) => {
    const s = slots.find((x) => x.id === slotId)!;
    const f: Filling = { date: key, slotId, name: s.name, time: s.time, dayName: "today", mode: "plan" };
    close();
    p.fillOnPlate(f, null, "");
    setTimeout(() => p.add(food), 0);
  };
  return (
    <div className="sheet-backdrop" onClick={close}>
      <div className="sheet where-sheet" role="dialog" aria-label="Where does this go?" onClick={(e) => e.stopPropagation()}>
        <div className="where-food"><b>{food.name}{food.brand ? `, ${food.brand}` : ""}</b><small>{pdText(foodPd)} · {fmt(food.calories, 0)} kcal and {fmt(food.protein)} g protein per 100 g · saved in My foods</small></div>
        <div className="card-top"><span>Where does this go?</span><button type="button" className="link" onClick={close}>Close</button></div>
        <div className="menu-list where-list">
          <button type="button" className="menu-row where-row" onClick={() => { close(); p.add(food); }}>
            <div className="menu-row-text"><b>On the plate now</b><small>I eat it now</small></div><ChevronRight size={18} />
          </button>
          {withMeal.map((s) => {
            const m = held[s.id]; const a = after(m); const fit = fitOf({ kcal: a.kcal, protein: a.protein }, p.dayPd, unit);
            return (
              <button key={s.id} type="button" className="menu-row where-row" onClick={() => intoMeal(s.id)}>
                <div className="menu-row-text"><small>{s.name}, {s.time}</small><b>{m.title}</b><small>add {portion} g to this meal</small></div>
                <div className={`pick-pd ${fit.state}`}><b>{pdVal(a.pd)}</b><small>{fit.text || "with it"}</small></div>
              </button>
            );
          })}
          {empty.map((s) => (
            <button key={s.id} type="button" className="menu-row where-row" onClick={() => newMeal(s.id)}>
              <div className="menu-row-text"><small>{s.name}, {s.time}</small><b>A new meal with it</b><small>the slot is empty; build it on the Plate</small></div><ChevronRight size={18} />
            </button>
          ))}
          <button type="button" className="menu-row where-row" onClick={close}>
            <div className="menu-row-text"><b>Just keep it in My foods</b><small>nothing planned yet</small></div><ChevronRight size={18} />
          </button>
        </div>
        <button type="button" className="pill pill-wide" onClick={() => { close(); p.openOut(); }}><ChefHat size={18} /> Ask {CHEF_NAME} what to make of it</button>
      </div>
    </div>
  );
}
