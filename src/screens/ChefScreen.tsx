import { Sparkles } from "lucide-react";
import { aggregate } from "../pilot";
import { fmt, fixed } from "../ui";
import type { AppApi } from "./api";

export function ChefScreen(p: AppApi) {
  const { state, setState, setTab, adjustId, setAdjustId, limits, setLimits,
    mix, personalize, options, pdRef, busy, notify } = p;
  const lockedItems = state.items.filter((i) => i.locked);
  const free = state.items.filter((i) => !i.locked);
  const adjusting = state.items.find((i) => i.id === adjustId);
  if (!state.items.length)
    return (
      <>
        <section className="readout readout-empty">
          <div className="readout-mid"><b>{fixed(pdRef)}</b><div><span>your target</span><small>g protein per 100 kcal</small></div></div>
        </section>
        <div className="strip">The Chef needs a meal first. Add foods, lock what you want to keep, then come back.</div>
        <button className="pill pill-primary pill-wide" onClick={() => setTab("meal")}>Go to Meal</button>
      </>
    );
  return (
    <>
      <section className="readout">
        <div className="readout-top"><span>Target</span><span>PD</span></div>
        <div className="readout-mid">
          <b>{fixed(pdRef)}</b>
          <div>
            <span>fixed: {lockedItems.length ? lockedItems.map((i) => `${i.food.name} ${fmt(i.grams, 0)} g`).join(", ") : "nothing yet"}</span>
            <small>adjusting: {adjusting ? adjusting.food.name : "pick below"}</small>
          </div>
        </div>
      </section>
      <label className="field">
        <span>Ingredient the Chef may change</span>
        <select value={adjustId} onChange={(e) => setAdjustId(e.target.value)}>
          <option value="">Choose an unlocked food</option>
          {free.map((i) => <option key={i.id} value={i.id}>{i.food.name}</option>)}
        </select>
      </label>
      <div className="fields three">
        <label className="field"><span>max g</span><input inputMode="decimal" placeholder="–" value={limits.maxWeight} onChange={(e) => setLimits({ ...limits, maxWeight: e.target.value })} /></label>
        <label className="field"><span>min protein g</span><input inputMode="decimal" placeholder="–" value={limits.minProtein} onChange={(e) => setLimits({ ...limits, minProtein: e.target.value })} /></label>
        <label className="field"><span>max kcal</span><input inputMode="decimal" placeholder="–" value={limits.maxKcal} onChange={(e) => setLimits({ ...limits, maxKcal: e.target.value })} /></label>
      </div>
      <button className="pill pill-primary pill-wide" onClick={mix}>Find a mix at PD {fixed(pdRef)}</button>
      {options.length > 0 && (
        <>
          <p className="label">{options.length} {options.length === 1 ? "mix reaches" : "mixes reach"} {fixed(pdRef)}</p>
          <div className="rows">
            {options.map((o) => {
              const t = aggregate(o.items);
              return (
                <div className="row" key={o.food.id}>
                  <b className="row-lead">{fmt(o.grams, 0)} g</b>
                  <div className="row-text">
                    <b>{o.food.name}</b>
                    <small>{fmt(t.calories, 0)} kcal · {fmt(t.protein)} g · {fmt(t.weight, 0)} g whole{o.explanation ? ` · ${o.explanation}` : ""}</small>
                  </div>
                  <button className="pill pill-small" onClick={() => {
                    setState((s) => ({ ...s, items: o.items, portion: null }));
                    notify("Mix applied.");
                    setTab("meal");
                  }}>Use</button>
                </div>
              );
            })}
          </div>
          <button className="pill pill-wide" onClick={personalize} disabled={busy !== ""}>
            <Sparkles size={15} /> Rank by my taste notes
          </button>
        </>
      )}
    </>
  );
}
