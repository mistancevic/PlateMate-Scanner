import { Camera, Plus, Utensils, LockKeyhole, Unlock, Trash2, Download, Upload, X, Sparkles, ArrowRight, ScanBarcode, SlidersHorizontal } from "lucide-react";
import { aggregate, candidateFood, category, density, uid } from "../pilot";
import { fmt } from "../ui";
import type { ScannerMode } from "../types";
import type { AppApi } from "./api";

export function FoodsScreen(p: AppApi) {
  const { state, setState, blank, setCamera, setMode, barcode, setBarcode, lookup,
    pending, setPending, query, setQuery, add, setImage, setEdit, api,
    setBusy, setError, notify } = p;
  return (
    <>
            <section className="panel">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">YOUR INGREDIENT LIBRARY</span>
                  <h2>Start with real labels.</h2>
                </div>
                <button className="primary" onClick={() => blank()}>
                  <Plus size={16} /> Add manually
                </button>
              </div>
              <div className="button-row">
                {(["label", "barcode", "group"] as ScannerMode[]).map((m) => (
                  <button
                    className="subtle"
                    key={m}
                    onClick={() => {
                      setMode(m);
                      setCamera(true);
                    }}
                  >
                    <Camera size={16} />
                    {m === "group"
                      ? "Group photos"
                      : m === "barcode"
                        ? "Scan barcode"
                        : "Scan label"}
                  </button>
                ))}
              </div>
              <div className="barcode-entry">
                <input
                  aria-label="Barcode number"
                  placeholder="Or type barcode"
                  inputMode="numeric"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                />
                <button className="subtle" onClick={() => lookup()}>
                  <ScanBarcode size={17} /> Look up
                </button>
              </div>
              <p className="small">
                Saved on this device. Product matches and OCR always require
                review before saving. No photo can confirm how much you will
                eat.
              </p>
            </section>
            {pending.length > 0 && (
              <section className="panel">
                <h3>Products identified — confirm individually</h3>
                <p>
                  No nutrition or quantities have been assumed. Resolve each
                  product using its label or your saved foods. Repeated views
                  are not extra portions.
                </p>
                {pending.map((p, i) => (
                  <div className="pending" key={i}>
                    <span>
                      {p.brand} {p.name}
                    </span>
                    <button
                      className="subtle"
                      onClick={() => blank(p.name, p.brand)}
                    >
                      Enter label
                    </button>
                    <button
                      className="icon"
                      aria-label={`Dismiss ${p.name}`}
                      onClick={() =>
                        setPending((v) => v.filter((_, j) => j !== i))
                      }
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </section>
            )}
            <input
              className="search"
              aria-label="Search saved foods"
              placeholder="Search your saved foods…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="food-grid">
              {state.foods
                .filter((f) =>
                  (f.name + " " + f.brand)
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .map((f) => (
                  <article className="panel food" key={f.id}>
                    <small>{f.brand || "YOUR FOOD"}</small>
                    <h3>{f.name}</h3>
                    <div className="food-density">
                      <b>{fmt(density(f.protein, f.calories), 2)}</b>
                      <span>
                        PD<small>g protein / 100 kcal</small>
                      </span>
                    </div>
                    <p>{category(density(f.protein, f.calories))}</p>
                    <p className="small">
                      Per 100 g: {fmt(f.calories, 0)} kcal · {fmt(f.protein)} g
                      protein
                    </p>
                    <div className="button-row">
                      <button className="primary" onClick={() => add(f)}>
                        <Plus size={16} /> Add to meal
                      </button>
                      <button
                        className="subtle"
                        onClick={() => {
                          setImage("");
                          setEdit(f);
                        }}
                      >
                        Review
                      </button>
                    </div>
                    <details>
                      <summary>Source & storage</summary>
                      <p>{f.source}</p>
                      <p>{f.notes || "No label notes."}</p>
                      <p>
                        Reviewed {new Date(f.reviewedAt).toLocaleDateString()}.{" "}
                        {f.readyToEat
                          ? "Ready for cold mixing."
                          : "Preparation not confirmed for cold mixing."}
                      </p>
                      <button
                        className="subtle"
                        onClick={async () => {
                          setBusy("Saving reviewed food to Airtable…");
                          try {
                            await api("/api/save", { food: f });
                            notify(
                              "Reviewed food saved to the configured Airtable base. No client targets or taste notes were sent.",
                            );
                          } catch (e: any) {
                            setError(e.message);
                          } finally {
                            setBusy("");
                          }
                        }}
                      >
                        Save food to Airtable
                      </button>
                      <button
                        className="subtle danger"
                        onClick={() => {
                          if (
                            confirm(
                              "Remove this saved food? Existing recipes retain their snapshots.",
                            )
                          )
                            setState((s) => ({
                              ...s,
                              foods: s.foods.filter((x) => x.id !== f.id),
                            }));
                        }}
                      >
                        Remove saved food
                      </button>
                    </details>
                  </article>
                ))}
            </div>
            {state.foods.length === 0 && (
              <p className="empty-text">
                No saved foods yet. Scan a label or add one manually.
              </p>
            )}
    </>
  );
}
