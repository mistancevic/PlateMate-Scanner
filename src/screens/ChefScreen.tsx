import { Camera, Plus, Utensils, LockKeyhole, Unlock, Trash2, Download, Upload, X, Sparkles, ArrowRight, ScanBarcode, SlidersHorizontal } from "lucide-react";
import { aggregate, candidateFood, category, density, uid } from "../pilot";
import { fmt } from "../ui";
import type { ScannerMode } from "../types";
import type { AppApi } from "./api";

export function ChefScreen(p: AppApi) {
  const { state, setState, setTab, adjustId, setAdjustId, limits, setLimits,
    mix, personalize, options, pdRef, busy, notify } = p;
  if (!state.items.length)
    return (
      <div className="empty screen-empty">
        <Sparkles size={34} />
        <h3>The Chef needs a meal first.</h3>
        <p>Add foods on the Meal screen, lock the amounts you want to keep, then come back.</p>
        <button className="primary" onClick={() => setTab("meal")}>
          Go to My meal
        </button>
      </div>
    );
  return (
                <section className="panel chef">
                  <span className="eyebrow">CHEF · KEEP THE FOOD YOU LOVE</span>
                  <h2>Find a protein-friendly mix.</h2>
                  <p>
                    Lock the amounts you want to keep. Choose one ready-to-eat
                    ingredient to adjust, or let the Chef compare your saved
                    alternatives.
                  </p>
                  <label>
                    Supporting ingredient
                    <select
                      aria-label="Supporting ingredient"
                      value={adjustId}
                      onChange={(e) => setAdjustId(e.target.value)}
                    >
                      <option value="">Select an unlocked ingredient</option>
                      {state.items
                        .filter((x) => !x.locked)
                        .map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.food.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <div className="form-grid three">
                    <label>
                      Whole recipe max (g)
                      <input
                        inputMode="decimal"
                        value={limits.maxWeight}
                        onChange={(e) =>
                          setLimits({ ...limits, maxWeight: e.target.value })
                        }
                        placeholder="Optional"
                      />
                    </label>
                    <label>
                      Whole recipe min protein (g)
                      <input
                        inputMode="decimal"
                        value={limits.minProtein}
                        onChange={(e) =>
                          setLimits({ ...limits, minProtein: e.target.value })
                        }
                        placeholder="Optional"
                      />
                    </label>
                    <label>
                      Whole recipe max kcal
                      <input
                        inputMode="decimal"
                        value={limits.maxKcal}
                        onChange={(e) =>
                          setLimits({ ...limits, maxKcal: e.target.value })
                        }
                        placeholder="Optional"
                      />
                    </label>
                  </div>
                  <button className="primary" onClick={mix}>
                    <Sparkles size={17} /> Find a mix at PD {fmt(pdRef, 2)}
                  </button>
                  <p className="small">
                    Calculated from your foods. No AI key required. Matching
                    density does not establish a complete meal or allergen
                    suitability.
                  </p>
                  {options.length > 0 && (
                    <div className="options">
                      {options.map((o) => {
                        const t = aggregate(o.items);
                        return (
                          <article key={o.food.id}>
                            <div>
                              <h3>
                                {fmt(o.grams, 0)} g {o.food.name}
                              </h3>
                              <p>
                                {fmt(t.calories, 0)} kcal · {fmt(t.protein)} g
                                protein · {fmt(t.weight)} g whole recipe
                              </p>
                              {o.explanation && <p>{o.explanation}</p>}
                            </div>
                            <button
                              className="subtle"
                              onClick={() => {
                                setState((s) => ({
                                  ...s,
                                  items: o.items,
                                  portion: null,
                                }));
                                notify(
                                  "Mix applied. Other ingredient quantities were preserved. Check whether the taste and portion work for you.",
                                );
                              }}
                            >
                              Use this mix
                            </button>
                          </article>
                        );
                      })}
                      <button
                        className="subtle"
                        onClick={personalize}
                        disabled={busy !== ""}
                      >
                        <Sparkles size={16} /> Personalize with AI
                      </button>
                      <p className="small">
                        Optional: sends these candidates and your saved taste
                        notes to the configured AI provider. AI ranks options;
                        calculations stay deterministic.
                      </p>
                    </div>
                  )}
                </section>
  );
}
