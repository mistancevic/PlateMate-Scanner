import { Camera, Plus, Trash2 } from "lucide-react";
import { portionTotals, contribution, density } from "../pilot";
import { fmt, fixed } from "../ui";
import type { AppApi } from "./api";

export function MealScreen(p: AppApi) {
  const { state, setState, setTab, setCamera, setMode, blank, updateItem, saveMeal,
    setAdjustId, totals, pdRef, mealanCard } = p;
  const sel = portionTotals(state.items, state.portion);
  const pd = density(sel.protein, sel.calories);
  const delta = pd !== null && pdRef !== null ? pd - pdRef : null;
  const has = state.items.length > 0;
  return (
    <>
      <input
        className="meal-name"
        aria-label="Meal name"
        placeholder="Name this meal"
        value={state.title}
        onChange={(e) => setState({ ...state, title: e.target.value })}
      />
      {has ? (
        <section className="readout">
          <div className="readout-top"><span>This meal</span><span>PD</span></div>
          <div className="readout-mid">
            <b>{fixed(pd)}</b>
            <div>
              <span>
                {delta === null ? "set a daily reference" : delta >= 0
                  ? `${fixed(delta)} over your ${fixed(pdRef)}`
                  : `${fixed(-delta)} under your ${fixed(pdRef)}`}
              </span>
              <small>g protein per 100 kcal</small>
            </div>
          </div>
          <div className="readout-row">
            <span><b>{fmt(sel.calories, 0)}</b> kcal</span>
            <span><b>{fmt(sel.protein)}</b> g protein</span>
            <span><b>{fmt(sel.weight)}</b> g</span>
            <span><b>{fmt(contribution(sel.calories, state.goals.calories), 0)}%</b> of day</span>
          </div>
        </section>
      ) : (
        <section className="readout readout-empty">
          <div className="readout-mid"><b>–</b><div><span>Nothing on the plate yet</span><small>add a food to see the number</small></div></div>
        </section>
      )}
      <div className="pills">
        <button className="pill" disabled={!has} onClick={() => setState((s) => ({ ...s, items: s.items.map((i) => ({ ...i, locked: true })) }))}>Lock all</button>
        <button className="pill pill-primary" disabled={!has} onClick={() => setTab("chef")}>Find a mix</button>
        <button className="pill" disabled={!has} onClick={saveMeal}>Save</button>
      </div>
      <div className="rows">
        {state.items.map((item) => (
          <div className="row" key={item.id}>
            <button
              className={`dot ${item.locked ? "dot-locked" : "dot-free"}`}
              aria-label={`${item.locked ? "Unlock" : "Lock"} ${item.food.name}`}
              onClick={() => {
                updateItem(item.id, { locked: !item.locked });
                if (item.locked) setAdjustId(item.id);
              }}
            />
            <div className="row-text">
              <b>{item.food.name}</b>
              <small>{item.food.brand ? `${item.food.brand} · ` : ""}{fmt(item.food.calories, 0)} kcal · {fmt(item.food.protein)} g per 100 g</small>
            </div>
            <label className="grams">
              <input
                aria-label={`Grams of ${item.food.name}`}
                type="number" min="0" step="1" inputMode="decimal"
                value={item.grams}
                onChange={(e) => updateItem(item.id, { grams: Math.max(0, Number(e.target.value) || 0) })}
              />
              <span>g</span>
            </label>
            <button className="icon" aria-label={`Remove ${item.food.name}`}
              onClick={() => setState((s) => ({ ...s, items: s.items.filter((x) => x.id !== item.id), portion: null }))}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <div className="row row-add">
          <span className="dot dot-add" />
          <button className="link" onClick={() => setTab("foods")}>Add a food</button>
          <span className="row-actions">
            <button className="icon" aria-label="Scan a label" onClick={() => { setMode("label"); setCamera(true); }}><Camera size={16} /></button>
            <button className="icon" aria-label="Enter a food manually" onClick={() => blank()}><Plus size={16} /></button>
          </span>
        </div>
      </div>
      {has && (
        <section className="portion">
          <label className="check">
            <input type="checkbox" checked={state.portion === null}
              onChange={(e) => setState((s) => ({ ...s, portion: e.target.checked ? null : totals.weight }))} />
            Whole recipe ({fmt(totals.weight)} g)
          </label>
          {state.portion !== null && (
            <label className="grams grams-wide">
              <input type="number" min="1" max={totals.weight} inputMode="decimal" value={state.portion}
                onChange={(e) => setState((s) => ({ ...s, portion: Math.max(1, Number(e.target.value) || 1) }))} />
              <span>g of it</span>
            </label>
          )}
          <details className="more"><summary>Fat, carbs and fibre</summary>{mealanCard}</details>
        </section>
      )}
      <div className="strip">Coral dot: amount stays fixed. Grey ring: the Chef may change it.</div>
    </>
  );
}
