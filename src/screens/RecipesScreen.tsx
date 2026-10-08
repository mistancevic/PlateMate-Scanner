import { Camera, Plus, Utensils, LockKeyhole, Unlock, Trash2, Download, Upload, X, Sparkles, ArrowRight, ScanBarcode, SlidersHorizontal } from "lucide-react";
import { aggregate, candidateFood, category, density, uid } from "../pilot";
import { fmt } from "../ui";
import type { ScannerMode } from "../types";
import type { AppApi } from "./api";
import { ConfirmButton } from "../components/Confirm";
import { useEffect, useState } from "react";
import { PublishSheet, type Published } from "../components/PublishSheet";
import { localAs } from "../recipes";

export function RecipesScreen(p: AppApi) {
  const { state, setState, setTab, setFeedback, setReviewMeal } = p;
  // coaches publish recipes (canvas board R5); what is published already, by the recipe it came from
  // Cook (boards RG0 to RG5): a coach is a cook and publishes; a client is a cook when their coach switched it on, and sends
  // the recipe to their coach. Without accounts, coach mode on this phone is the coach and otherwise their client.
  const client = !p.user && !p.coach;
  const [cook, setCook] = useState<{ cook: boolean; direct: boolean }>({ cook: false, direct: false });
  const isCoach = cook.cook;
  const approver = String(p.profile?.coachName ?? "").trim().split(/\s+/)[0] || "your coach";
  // the cook's own recipes on the site, where each one is, by the recipe they came from (board RG3)
  const [published, setPublished] = useState<Record<string, Published>>({});
  const [publishing, setPublishing] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/my-recipes", { headers: localAs(client) }).then((r) => (r.ok ? r.json() : { recipes: [] })).then((d) => {
      setCook({ cook: Boolean(d.cook), direct: Boolean(d.direct) });
      setPublished(Object.fromEntries((d.recipes ?? []).filter((r: Published) => r.mealId).map((r: Published) => [r.mealId!, r])));
    }).catch(() => {});
  }, [p.user?.uid, client]);
  const first = (n?: string | null) => String(n ?? "").trim().split(/\s+/)[0] || "";
  // the byline: From Milan's kitchen (RF4 Q9)
  const author = first(p.user?.name);
  const pubState = (id: string, draft: boolean) => { const x = published[id]; return x ? (x.status === "waiting" || x.waiting ? "waiting" : x.status === "down" ? "down" : x.status === "back" ? "back" : "live") : draft ? "draft" : null; };
  const pubMeal = state.meals.find((m) => m.id === publishing);
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
                      {(m.steps?.length ?? 0) > 0 && (
                        <details className="recipe-steps"><summary>Steps ({m.steps!.length})</summary><ol>{m.steps!.map((x, k) => <li key={k}>{x}</li>)}</ol></details>
                      )}
                      {isCoach && (() => {
                        const st = pubState(m.id, Boolean(m.publish)); if (!st) return null;
                        const pub = published[m.id];
                        return (
                          <div className="recipe-pub">
                            <span className={`pub-state ${st}`}>{st === "live" ? "Live" : st === "down" ? "Taken down" : st === "waiting" ? `Waiting for ${approver}` : st === "back" ? "Sent back" : "Draft"}</span>
                            {pub && (!pub.status || pub.status === "live") && <a className="link" href={`/r/${pub.slug}`} target="_blank" rel="noreferrer">See the page</a>}
                            <button className="link" onClick={() => setPublishing(m.id)}>{st === "waiting" ? "Open it" : st === "live" ? "Change it" : st === "down" ? (cook.direct ? "Publish again" : `Send to ${approver} again`) : "Continue"}</button>
                            {pub?.note && st !== "waiting" && <small className="pub-note">{approver.charAt(0).toUpperCase() + approver.slice(1)}: “{pub.note}”</small>}
                          </div>
                        );
                      })()}
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
                      {isCoach && !pubState(m.id, Boolean(m.publish)) && <button className="subtle" onClick={() => setPublishing(m.id)}>Publish</button>}
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
          {pubMeal && <PublishSheet meal={pubMeal} cards={state.feedback} author={author} published={published[pubMeal.id] ?? null} close={() => setPublishing(null)}
            onDone={(r) => setPublished((x) => { const y = { ...x }; if (r) y[pubMeal.id] = r; else delete y[pubMeal.id]; return y; })}
            onMeal={(patch) => setState((s) => ({ ...s, meals: s.meals.map((x) => (x.id === pubMeal.id ? { ...x, ...patch } : x)) }))}
            direct={cook.direct} approver={approver} client={client} />}
          </div>
  );
}
