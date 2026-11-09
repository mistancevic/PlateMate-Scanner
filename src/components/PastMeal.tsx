// DT267 (0.3.117, board Stories200; Coach Milan 9 November 21:31 to 21:51, Go; from Tester 2: "I can't find the picture, the
// sandwich's values stayed"): a meal eaten on a past day, opened from Plan. The photo large, the meal's other photos under it,
// the numbers, the foods with their grams as they were logged. Put it on the Plate again, or Save in My recipes.
import { useState } from "react";
import { aggregate, density, uid, type Feedback, type Meal } from "../pilot";
import { w, mealName } from "../words";
import { pdText } from "../ui";
import { Picture, pictureOfRecipe } from "./MealPicture";
import type { AppApi } from "../screens/api";

// the recipe a logged meal came from, as Today finds it
export const recipeOfEaten = (f: Feedback, meals: Meal[]) => meals.find((m) => m.id === f.recipeId) ?? meals.find((m) => m.id === f.meal?.id || (!!f.meal?.title && m.title === f.meal.title)) ?? null;
const isPic = (x: unknown): x is string => typeof x === "string" && /^(data:image\/|https:\/\/|blob:|\/)/.test(x);

export function PastMeal({ p, f, day, slot, back }: { p: AppApi; f: Feedback; day: string; slot?: string; back: () => void }) {
  const r = recipeOfEaten(f, p.state.meals);
  const all = [...new Set([f.photo, ...(f.photos ?? [])].filter(isPic))];
  const cover = all[0] ?? pictureOfRecipe(r);
  const [at, setAt] = useState(0);
  const big = all[at] ?? cover;
  const a = aggregate(f.meal.items);
  const again = () => { p.setState((s) => ({ ...s, items: f.meal.items.map((it) => ({ ...it, id: uid() })) })); p.setTab("journey"); };
  return (
    <section className="card plan-day past-meal">
      <button type="button" className="link pm-back" onClick={back}>‹ {day}</button>
      <h3>{f.meal.title}</h3>
      <small className="pm-when">{slot ? `${mealName(slot)}, ` : ""}{new Date(f.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</small>
      {big ? <img className="pm-photo" src={big} alt={w("plan.photoOf", { title: f.meal.title })} /> : <div className="pm-nophoto"><Picture src={null} /><small>{w("plan.noPhoto")}</small></div>}
      {all.length > 1 && <div className="pm-more">{all.map((src, i) => (
        <button type="button" key={i} className={`pm-thumb${i === at ? " on" : ""}`} aria-label={w("plan.photoN", { n: i + 1 })} aria-pressed={i === at} onClick={() => setAt(i)}><img src={src} alt="" /></button>
      ))}</div>}
      <div className="pm-nums">
        <span><b>{Math.round(a.calories ?? 0).toLocaleString()}</b> kcal</span>
        <span><b>{Math.round(a.protein ?? 0)} g</b> {w("plan.protein")}</span>
        <span><b>{pdText(density(a.protein ?? 0, a.calories ?? 0))}</b></span>
      </div>
      <div className="pm-foods">{f.meal.items.map((it) => <div key={it.id} className="pm-food"><span>{it.food.name}</span><b>{Math.round(it.grams)} g</b></div>)}</div>
      <div className="button-row pm-actions">
        <button type="button" className="pill pill-small pill-primary pm-again" onClick={again}>{r ? w("plan.cookAgain") : w("plan.onThePlateAgain")}</button>
        {!r && <button type="button" className="pill pill-small pm-save" onClick={() => { p.saveCardAsRecipe(f.id); }}>{w("today.saveInMyRecipes")}</button>}
      </div>
    </section>
  );
}
