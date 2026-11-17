// Chef Mealan's card for a meal: its protein density against the day's reference, and what each food brings.
// 0.3.156: moved out of App.tsx as it was.
import { DENSITIES, Goals, Ingredient, MACROS, aggregate, contribution, density, portionTotals, symbol } from "../pilot";
import { fmt } from "../ui";
import { w } from "../words";
import { wx } from "../wx";
import { NUTRIENT_WORD } from "./nutrientFields";

export function Mealan({
  items,
  portion,
  goals,
  title,
}: {
  items: Ingredient[];
  portion: number | null;
  goals: Goals;
  title: string;
}) {
  const data = portionTotals(items, portion),
    pd = density(data.protein, data.calories),
    total = aggregate(items),
    valid = data.weight > 0;
  return (
    <section className="mealan-card">
      <div className="eyebrow">{w("app.mealanSelected")}</div>
      <h2>{title || w("app.myMeal")}</h2>
      <div className="headline-metrics">
        <span>
          <b>{fmt(pd, 2)}</b> PD
        </span>
        <span>{fmt(data.weight)} g</span>
        <span>{fmt(data.calories, 0)} kcal</span>
      </div>
      <p className="calorie-share">
        {wx("app.calShare", { pct: <strong>{fmt(contribution(data.calories, goals.calories))}%</strong> })}
      </p>
      <div className="macro-grid">
        {MACROS.map((k) => (
          <div key={k}>
            <strong>{symbol(k, data, goals)}</strong>
            <span>{fmt(contribution(data[k], goals[k]))}%</span>
            <small>
              {w("app.gNutrient", { g: fmt(data[k]), what: w(NUTRIENT_WORD[k]).toLowerCase() })}
            </small>
          </div>
        ))}
      </div>
      {!valid && (
        <p className="notice">
          {w("app.chooseAPortionGreaterThan")}
        </p>
      )}
      <p className="small">
        {portion === null
          ? w("app.wholeRecipeSelected")
          : w("app.wholeRecipeG", { g: fmt(total.weight) })}{" "}
        {w("app.missingShownAs")}
      </p>
      <details>
        <summary>{w("app.howToReadThis")}</summary>
        <p>
          {w("app.pdExplain", { pd: fmt(pd, 2) })}
        </p>
        <div className="density-list">
          {MACROS.map((k) => (
            <span key={k}>
              {DENSITIES[k]} {fmt(density(data[k], data.calories), 2)}
            </span>
          ))}
        </div>
        <p className="small">
          {w("app.dsExplain")}
        </p>
      </details>
    </section>
  );
}
