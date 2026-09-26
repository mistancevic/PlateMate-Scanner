import { Camera, Plus, Utensils, LockKeyhole, Unlock, Trash2, Download, Upload, X, Sparkles, ArrowRight, ScanBarcode, SlidersHorizontal } from "lucide-react";
import { aggregate, candidateFood, category, density, uid } from "../pilot";
import { fmt } from "../ui";
import type { ScannerMode } from "../types";
import type { AppApi } from "./api";
import { ConfirmButton } from "../components/Confirm";

export function RecipesScreen(p: AppApi) {
  const { state, setState, setTab, setFeedback, setReviewMeal } = p;
  return (
          <div className="workspace">
            <div>
              <section className="panel">
                <span className="eyebrow">TASTE IS PART OF THE PLAN</span>
                <h2>What makes food work for you?</h2>
                <label>
                  Taste & practical preferences
                  <textarea
                    placeholder="E.g. creamy rather than sour; keep the chocolate flavour; small portions; quick preparation."
                    value={state.preferences}
                    onChange={(e) =>
                      setState((s) => ({ ...s, preferences: e.target.value }))
                    }
                  />
                </label>
                <p className="small">
                  Editable notes for future suggestions. The Chef does not infer
                  allergies or change your nutrition targets.
                </p>
              </section>
              <section className="panel">
                <h2>Saved recipes</h2>
                {!state.meals.length && (
                  <p>
                    Save a recipe from My meal. Saving does not log it as eaten.
                  </p>
                )}
                {state.meals.map((m) => (
                  <article className="recipe-row" key={m.id}>
                    <div>
                      <h3>{m.title}</h3>
                      <p>
                        {fmt(m.portion)} g portion ·{" "}
                        {new Date(m.savedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="button-row">
                      <button
                        className="subtle"
                        onClick={() => {
                          setState((s) => ({
                            ...s,
                            title: m.title,
                            items: structuredClone(m.items),
                            portion: m.portion,
                          }));
                          setTab("meal");
                        }}
                      >
                        Open
                      </button>
                      <button
                        className="subtle"
                        onClick={() => {
                          setFeedback({
                            status: "prepared",
                            taste: "",
                            notes: "",
                          });
                          setReviewMeal(m);
                        }}
                      >
                        Record feedback
                      </button>
                      <ConfirmButton className="icon" ariaLabel={`Delete recipe ${m.title}`} label={<Trash2 size={16} />} confirmLabel="Sure?"
                        onConfirm={() => setState((s) => ({ ...s, meals: s.meals.filter((x) => x.id !== m.id) }))} />
                    </div>
                  </article>
                ))}
              </section>
            </div>
            <aside>
              <section className="panel">
                <h2>Your feedback</h2>
                {!state.feedback.length && (
                  <p>
                    After trying a recipe, record taste, portion size and
                    whether you prepared or ate it.
                  </p>
                )}
                {state.feedback.map((f) => (
                  <article className="feedback" key={f.id}>
                    <b>{f.meal.title}</b>
                    <small>
                      {f.status} · {new Date(f.createdAt).toLocaleDateString()}
                    </small>
                    <p>{f.taste}</p>
                    <p>{f.notes}</p>
                    <button
                      className="subtle"
                      onClick={() =>
                        setState((s) => ({
                          ...s,
                          feedback: s.feedback.filter((x) => x.id !== f.id),
                        }))
                      }
                    >
                      Forget this feedback
                    </button>
                  </article>
                ))}
              </section>
            </aside>
          </div>
  );
}
