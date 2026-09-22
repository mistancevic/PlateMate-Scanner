import { Camera, Plus, Utensils, LockKeyhole, Unlock, Trash2, Download, Upload, X, Sparkles, ArrowRight, ScanBarcode, SlidersHorizontal } from "lucide-react";
import { aggregate, candidateFood, category, density, uid } from "../pilot";
import { fmt } from "../ui";
import type { ScannerMode } from "../types";
import type { AppApi } from "./api";

export function MealScreen(p: AppApi) {
  const { state, setState, setTab, setCamera, setMode, blank, updateItem, saveMeal,
    setAdjustId, totals, matched, notify, mealanCard } = p;
  return (
          <div className="workspace">
            <div className="main-column">
              <section className="panel">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">BUILD YOUR BOWL</span>
                    <h2>Your ingredients</h2>
                  </div>
                  <button className="subtle" onClick={() => setTab("foods")}>
                    <Plus size={16} /> Add food
                  </button>
                </div>
                <label>
                  Meal name
                  <input
                    value={state.title}
                    onChange={(e) =>
                      setState({ ...state, title: e.target.value })
                    }
                  />
                </label>
                {!state.items.length ? (
                  <div className="empty">
                    <Utensils size={34} />
                    <h3>What are you craving?</h3>
                    <p>
                      Scan or enter a food, check its label, then add the amount
                      you want.
                    </p>
                    <button
                      className="primary"
                      onClick={() => {
                        setMode("label");
                        setCamera(true);
                      }}
                    >
                      <Camera size={17} /> Scan a label
                    </button>
                    <button className="subtle" onClick={() => blank()}>
                      Enter a food manually
                    </button>
                  </div>
                ) : (
                  <div className="ingredient-list">
                    {state.items.map((item) => (
                      <article className="ingredient" key={item.id}>
                        <div className="ingredient-name">
                          <b>{item.food.name}</b>
                          <small>
                            {item.food.brand} · PD{" "}
                            {fmt(
                              density(item.food.protein, item.food.calories),
                              2,
                            )}
                          </small>
                        </div>
                        <label className="quantity">
                          Amount
                          <input
                            aria-label={`Grams of ${item.food.name}`}
                            type="number"
                            min="0"
                            step="1"
                            value={item.grams}
                            onChange={(e) =>
                              updateItem(item.id, {
                                grams: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                          />
                          <span>g</span>
                        </label>
                        <button
                          className={`icon ${item.locked ? "locked" : ""}`}
                          aria-label={`${item.locked ? "Unlock" : "Lock"} ${item.food.name}`}
                          title={
                            item.locked
                              ? "Amount locked"
                              : "Available for adjustment"
                          }
                          onClick={() => {
                            updateItem(item.id, { locked: !item.locked });
                            if (item.locked) setAdjustId(item.id);
                          }}
                        >
                          {item.locked ? (
                            <LockKeyhole size={17} />
                          ) : (
                            <Unlock size={17} />
                          )}
                        </button>
                        <button
                          className="icon"
                          aria-label={`Remove ${item.food.name}`}
                          onClick={() =>
                            setState((s) => ({
                              ...s,
                              items: s.items.filter((x) => x.id !== item.id),
                              portion: null,
                            }))
                          }
                        >
                          <Trash2 size={17} />
                        </button>
                      </article>
                    ))}
                  </div>
                )}
                <div className="button-row">
                  <button
                    className="subtle"
                    onClick={() => {
                      setMode("label");
                      setCamera(true);
                    }}
                  >
                    <Camera size={16} /> Scan another
                  </button>
                  <button className="subtle" onClick={() => blank()}>
                    <Plus size={16} /> Manual entry
                  </button>
                </div>
                {state.items.length > 0 && (
                  <button className="primary wide" onClick={() => setTab("chef")}>
                    <Sparkles size={17} /> Ask the Chef for a mix
                  </button>
                )}
              </section>
            </div>
            <aside>
              {state.items.length > 0 ? (
                <>
                  {mealanCard}
                  <section className="panel">
                    <h3>How much will you eat?</h3>
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={state.portion === null}
                        onChange={(e) =>
                          setState((s) => ({
                            ...s,
                            portion: e.target.checked ? null : totals.weight,
                          }))
                        }
                      />{" "}
                      Whole recipe ({fmt(totals.weight)} g)
                    </label>
                    {state.portion !== null && (
                      <label>
                        Selected portion (g)
                        <input
                          type="number"
                          min="1"
                          max={totals.weight}
                          value={state.portion}
                          onChange={(e) =>
                            setState((s) => ({
                              ...s,
                              portion: Math.max(1, Number(e.target.value) || 1),
                            }))
                          }
                        />
                      </label>
                    )}
                    <p className="small">
                      {matched
                        ? "This portion is near your daily protein density. Check its actual grams and calories against your meal needs."
                        : "Density and portion size answer different questions. Your daily reference is not a prescribed meal size."}
                    </p>
                    <button className="primary wide" onClick={saveMeal}>
                      Save recipe
                    </button>
                  </section>
                </>
              ) : (
                <section className="panel how">
                  <span className="eyebrow">A QUICK EXAMPLE</span>
                  <h2>
                    Keep the Nutella.
                    <br />
                    Rethink the mix.
                  </h2>
                  <p>
                    A concentrated protein source can support a favourite
                    flavour. The amount still matters.
                  </p>
                  <ol>
                    <li>Confirm each ingredient's label.</li>
                    <li>Keep the amount you enjoy.</li>
                    <li>Calculate a feasible combination.</li>
                    <li>Try it, then tell the Chef what worked.</li>
                  </ol>
                  <button
                    className="subtle"
                    onClick={() => {
                      const n = candidateFood(
                        {
                          product_name: "Nutella — UK example",
                          calories: 539,
                          protein: 6.3,
                          fats: 30.9,
                          carbs: 57.5,
                          fiber: null,
                        },
                        "PRD worked example — verify your actual label",
                      );
                      const y = candidateFood(
                        {
                          product_name:
                            "Illustrative yogurt — NOT a real product",
                          calories: 60,
                          protein: 7.2,
                          fats: 0.8,
                          carbs: 6,
                          fiber: 0,
                        },
                        "Invented PRD test data, not a product recommendation",
                      );
                      n.readyToEat = y.readyToEat = true;
                      n.reviewedAt = y.reviewedAt = new Date().toISOString();
                      const id = uid();
                      setState((s) => ({
                        ...s,
                        title: "Example Nutella–Yogurt Dessert",
                        goals: s.goals.calories
                          ? s.goals
                          : {
                              calories: 2500,
                              protein: 150,
                              fats: 80,
                              carbs: 280,
                              fiber: 30,
                            },
                        items: [
                          { id: uid(), food: n, grams: 50, locked: true },
                          { id, food: y, grams: 100, locked: false },
                        ],
                        portion: null,
                      }));
                      setAdjustId(id);
                      notify(
                        "Illustrative example loaded. Yogurt data is invented. Replace it with real label data before eating or advising a client.",
                      );
                    }}
                  >
                    Try the worked example <ArrowRight size={16} />
                  </button>
                </section>
              )}
            </aside>
          </div>
  );
}
