import { Camera, X, Pencil } from "lucide-react";
import { density, candidateFood, uid } from "../pilot";
import { findReference, referenceFood, localName } from "../reference";
import { BAND_LABEL, BAND_LINE_IDLE, bandHint } from "../goal";

import { duplicatePairs } from "../dedupe";
import { jobOf } from "../foodjob";
import { fmt, fixed, pdText, pdVal, pdTag, pdRange } from "../ui";
import type { ScannerMode } from "../types";
import type { AppApi, DbProduct } from "./api";
import { ConfirmButton } from "../components/Confirm";
import { iconFor } from "../icons";
import { FoodCard } from "../components/FoodCard";
import { RecipesScreen } from "./RecipesScreen";
import { momentOf } from "../moments";
import type { Mix } from "../mixtip";
import { useEffect, useState } from "react";
const fold = (x: string) => x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");

type Band = "high" | "mid" | "low";
function band(pd: number | null): Band {
  return pd === null || pd < 3 ? "low" : pd < 5 ? "mid" : "high";
}

export function FoodsScreen(p: AppApi) {
  const { state, setState, blank, setCamera, setMode, barcode, setBarcode, lookup,
    pending, setPending, query, setQuery, add, setImage, setEdit, api,
    setBusy, setError, notify, setFilter, filter, coach, pdRef } = p;
  const [cardId, setCardId] = useState<string | null>(null);
  const isDigits = /^\d{8,14}$/.test(query.trim());
  // a barcode that's already in the library opens its card here
  useEffect(() => { if (p.openFoodId) { setCardId(p.openFoodId); p.clearOpenFood(); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [p.openFoodId]);
  const [dupOpen, setDupOpen] = useState(false);
  const [notSame, setNotSame] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem("chefmealan-not-same") || "[]"); } catch { return []; } });
  const pairKey = (a: string, b: string) => [a, b].sort().join("|");
  const pairs = duplicatePairs(state.foods).filter(([a, b]) => !notSame.includes(pairKey(a.id, b.id)));
  const cardFood = state.foods.find((x) => x.id === cardId);
  const foods = state.foods.map((f) => ({ f, pd: density(f.protein, f.calories) })).map((x) => ({ ...x, b: p.fitPd(x.pd) }));
  // What the box lists, by what was typed: one or two letters match the start of a word, three or more any part of the name,
  // eight to fourteen digits a saved barcode. Your foods first; then foods without a label (two letters on); then the product
  // database (three letters on, or a barcode not in your foods).
  const q = query.trim();
  const qf = fold(q);
  const isCode = /^\d{8,14}$/.test(q);
  // a food's other names count: the aliases a food without a label carries, or, for one saved before aliases, the "Also:" line of its notes
  const otherNames = (f: { aliases?: string[]; notes?: string }) => (f.aliases?.length ? f.aliases.join(" ") : (/Also: ([^\n]*)/.exec(f.notes ?? "")?.[1] ?? "").replace(/·/g, " "));
  const nameHit = (f: { name: string; brand: string; barcode?: string; aliases?: string[]; notes?: string }) => {
    if (!q) return true;
    if (isCode) return (f.barcode ?? "") === q;
    const hay = fold(`${f.name} ${f.brand} ${otherNames(f)}`);
    return q.length < 3 ? hay.split(/[\s,()/-]+/).some((w) => w.startsWith(qf)) : hay.includes(qf);
  };
  const shown = foods.filter(({ f, b }) => nameHit(f) && (filter === "all" || b === filter));
  // a chip must never hide a match in silence: say how many, and where
  const hiddenByChip = q && filter !== "all" ? foods.filter(({ f, b }) => nameHit(f) && b !== filter) : [];
  const have = new Set(state.foods.flatMap((f) => [f.name, ...(f.aliases ?? []), ...((/Also: ([^\n]*)/.exec(f.notes ?? "")?.[1] ?? "").split("·"))]).map((x) => x.trim().replace(/\.$/, "").toLowerCase()).filter(Boolean));
  const noLabel = !isCode && q.length >= 2 ? findReference(q, 6, q.length < 3).filter((r) => ![r.en, r.de, r.sr, r.cyr].some((n) => have.has(n.toLowerCase()))) : [];
  const [db, setDb] = useState<{ q: string; products: DbProduct[]; busy: boolean }>({ q: "", products: [], busy: false });
  useEffect(() => {
    const wantsDb = isCode ? !state.foods.some((f) => f.barcode === q) : q.length >= 3;
    if (!wantsDb) { setDb({ q: "", products: [], busy: false }); return; }
    setDb((d) => ({ ...d, busy: true }));
    const t = setTimeout(async () => {
      const products = isCode ? [await p.peekBarcode(q)].filter(Boolean) as DbProduct[] : await p.searchDatabase(q);
      const saved = new Set(state.foods.map((f) => f.barcode).filter(Boolean));
      setDb({ q, products: products.filter((x) => !saved.has(x.code)), busy: false });
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);
  const dbRows = db.q === q ? db.products : [];
  const nothing = q.length >= 1 && shown.length === 0 && noLabel.length === 0 && dbRows.length === 0 && !db.busy;
  return (
    <>
      <div className="segments" role="tablist" aria-label="Foods">
        <button role="tab" aria-selected={p.foodsView === "foods"} className={`seg ${p.foodsView === "foods" ? "on" : ""}`} onClick={() => p.setFoodsView("foods")}>My foods</button>
        <button role="tab" aria-selected={p.foodsView === "recipes"} className={`seg ${p.foodsView === "recipes" ? "on" : ""}`} onClick={() => p.setFoodsView("recipes")}>My recipes{state.meals.length ? ` (${state.meals.length})` : ""}</button>
      </div>
      {p.foodsView === "recipes" && <RecipesScreen {...p} />}
      {p.foodsView === "foods" && <>
      <section className="find">
        <div className="find-head"><b>Find a food</b><small>{state.foods.length} in your foods</small></div>
        <input className="search" aria-label="Find a food" placeholder="A name, or a barcode you saved" value={query} onChange={(e) => setQuery(e.target.value)} />
      </section>
      <section className="add-strip" aria-label="Add a food">
        <b>Add a food</b>
        <div className="ways">
          <button className="pill pill-small" onClick={() => blank(isDigits ? "" : query.trim(), "", query.trim(), isDigits ? query.trim() : "")}><Pencil size={15} /> Type</button>
          <button className="pill pill-small pill-primary" onClick={() => { setMode("label"); setCamera(true); }}><Camera size={15} /> Scan</button>
        </div>
      </section>
      {nothing && q.length >= 2 && (
        <p className="small muted not-found"><b>Not found</b> in your foods, the foods without a label or the product database. Type or Scan above; Type keeps {isDigits ? "the number" : `"${q}"`}.</p>
      )}
      {pairs.length > 0 && (
        <button className="strip strip-button" onClick={() => setDupOpen(true)}>{pairs.length} possible {pairs.length === 1 ? "duplicate" : "duplicates"} in your foods. Check and merge.</button>
      )}
      {dupOpen && <DuplicatesSheet pairs={pairs} close={() => setDupOpen(false)} merge={p.mergeInLibrary} notSame={(a, b) => { const k = [...notSame, pairKey(a, b)]; setNotSame(k); try { localStorage.setItem("chefmealan-not-same", JSON.stringify(k)); } catch {} }} />}
      {pending.length > 0 && (
        <section className="pending">
          <p className="label">Products seen. Review or enter each one.</p>
          {pending.map((q, i) => (
            <div className="row" key={i}>
              <div className="row-text"><b>{q.name}</b><small>{q.brand}{q.values ? " · values read from the label" : ""}</small></div>
              {q.values
                ? <button className="pill pill-small pill-primary" onClick={() => { setEdit(candidateFood(q.values, "Photos · review required")); setPending((v: any[]) => v.filter((_, j) => j !== i)); }}>Review</button>
                : <button className="pill pill-small" onClick={() => blank(q.name, q.brand)}>Enter label</button>}
              <button className="icon" aria-label={`Dismiss ${q.name}`} onClick={() => setPending((v) => v.filter((_, j) => j !== i))}><X size={16} /></button>
            </div>
          ))}
        </section>
      )}
      <div className="chips">
        {(["below", "close", "plan", "high", "top"] as const).map((k) => (
          <button key={k} className={`chip chip-${k} ${filter === k ? "on" : ""}`} aria-pressed={filter === k} onClick={() => setFilter(filter === k ? "all" : k)}>{BAND_LABEL[k]}</button>
        ))}
      </div>
      <p className="band-line" aria-live="polite">{filter === "all" ? BAND_LINE_IDLE : bandHint(filter, p.pdRef)}</p>
      {hiddenByChip.length > 0 && <p className="small hidden-by-chip">{hiddenByChip.length} more in your foods under {[...new Set(hiddenByChip.map((x) => BAND_LABEL[x.b]))].join(", ")}. <button className="link" onClick={() => setFilter("all")}>Show all</button></p>}
      {q.length >= 1 && shown.length > 0 && (noLabel.length > 0 || dbRows.length > 0) && <p className="label group-label">In your foods</p>}
      <div className="rows">
        {shown.map(({ f, pd, b }) => (
          <div className="row" key={f.id}>
            <span className="thumb">{f.photo ? <img src={f.photo} alt="" /> : (f.icon || iconFor(f.name))}</span>
            <div className="row-text">
              <button className="name-link" onClick={() => setCardId(f.id)}>{f.favorite && <span className="fav-mark">★ </span>}{f.name}</button>
              <small>{jobOf(f).job} · {f.brand ? `${f.brand} · ` : ""}{fmt(f.calories, 0)} kcal · {fmt(f.protein)} g per 100 g</small>
              <span className="row-links">
                <button className="link" onClick={() => add(f)}>Add to meal</button>
                <button className="link" onClick={() => p.toggleFavorite(f.id)}>{f.favorite ? "★ Favourite" : "☆ Favourite"}</button>
                <button className="link" onClick={() => { setImage(""); setEdit(f); }}>Review</button>
                {coach && <button className="link" onClick={async () => {
                  setBusy("Saving to Airtable");
                  try { await api("/api/save", { food: f }); notify("Saved to Airtable."); }
                  catch (e: any) { setError(e.message); } finally { setBusy(""); }
                }}>Airtable</button>}
                <ConfirmButton label="Remove" confirmLabel="Tap again to remove" onConfirm={() => setState((s) => ({ ...s, foods: s.foods.filter((x) => x.id !== f.id) }))} />
              </span>
            </div>
            <span className={`pdpill pdpill-${b}`}>{pdVal(pd)}<small>{pdTag()}</small></span>
          </div>
        ))}
      </div>
      {noLabel.length > 0 && (
        <section className="outside" aria-label="Without a label">
          <p className="label group-label">Without a label <small>reference values per 100 g</small></p>
          {noLabel.map((r) => (
            <div className="row outside-row" key={r.id}>
              <span className="thumb">{iconFor(localName(r, p.region))}</span>
              <div className="row-text">
                <b className="name-plain">{localName(r, p.region)}</b>
                <small>{[r.en, r.sr, r.de].filter((x) => x !== localName(r, p.region)).slice(0, 2).join(" · ")} · {r.kcal} kcal · {r.protein} g protein{r.ready ? "" : " · needs cooking"}</small>
              </div>
              <button className="pill pill-small pill-primary" onClick={() => { p.saveFood(referenceFood(r, p.region, uid)); p.notify(`${localName(r, p.region)} is in your foods.`); }}>Add to my foods</button>
            </div>
          ))}
        </section>
      )}
      {(dbRows.length > 0 || (db.busy && (isCode || q.length >= 3))) && (
        <section className="outside" aria-label="In the product database">
          <p className="label group-label">In the product database {db.busy && <small>looking…</small>}</p>
          {dbRows.map((x) => (
            <div className="row outside-row" key={x.code}>
              <span className="thumb">{iconFor(x.name)}</span>
              <div className="row-text">
                <b className="name-plain">{x.name}</b>
                <small>{[x.brand, x.quantity].filter(Boolean).join(" · ")}{x.kcal !== null ? ` · ${Math.round(x.kcal)} kcal` : ""}{x.protein !== null ? ` · ${x.protein} g protein` : ""} per 100 g</small>
              </div>
              <button className="pill pill-small pill-primary" onClick={() => p.addFromDatabase(x.code)}>Add to my foods</button>
            </div>
          ))}
        </section>
      )}
      {state.foods.length === 0 && (
        <div className="strip">No foods yet. Scan, type a name, or <button className="link" onClick={p.addStarter}>add twenty starter foods</button>.</div>
      )}
      </>}
      {cardFood && <FoodCard food={p.state.foods.find((x) => x.id === cardFood.id) ?? cardFood} addPhoto={(d) => p.addFoodPhoto(cardFood.id, d)} removePhoto={(i) => p.removeFoodPhoto(cardFood.id, i)} toggleFavorite={() => p.toggleFavorite(cardFood.id)} insight={{ dayKcal: p.todayKcal, eaten: p.eatenTodayKcal, dayName: p.dayName, goalKey: p.tipGoalKey, requestTip: () => p.requestTip(cardFood.id), setJob: (j) => p.setFoodJob(cardFood.id, j) }} target={pdRef} fit={p.fitPd(density(cardFood.protein, cardFood.calories))} close={() => setCardId(null)} review={() => { setImage(""); setEdit(cardFood); }} mix={(() => { const f = p.state.foods.find((x) => x.id === cardFood.id) ?? cardFood; const tip = p.mixFor(f); return { tip, momentName: momentOf(p.moment).name, take: (m: Mix) => { setCardId(null); p.takeMix(f, m); }, ask: () => { setCardId(null); p.askAboutMix(f, tip); } }; })()} />}
    </>
  );
}

// Each likely pair side by side: pick the name to keep, merge; or say they're not the same.
function DuplicatesSheet({ pairs, close, merge, notSame }: { pairs: [any, any][]; close: () => void; merge: (keepId: string, otherId: string, name: string) => void; notSame: (a: string, b: string) => void }) {
  const [names, setNames] = useState<Record<number, 0 | 1>>({});
  if (!pairs.length) return null;
  return (
    <div className="sheet-backdrop" onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="card-top"><span>Possible duplicates</span><button className="link" onClick={close}>Close</button></div>
        <p className="small">Same barcode, or the same values per 100 g with a similar name. Pick the name to keep; the photos of both stay.</p>
        {pairs.map(([a, b], i) => {
          const keep = names[i] ?? (a.barcode && !b.barcode ? 0 : b.barcode && !a.barcode ? 1 : 0);
          const pair = [a, b];
          return (
            <section className="card dup" key={a.id + b.id}>
              {pair.map((x, k) => (
                <button key={x.id} className={`dup-row ${keep === k ? "on" : ""}`} onClick={() => setNames({ ...names, [i]: k as 0 | 1 })}>
                  <span className="thumb thumb-sm">{x.photo ? <img src={x.photo} alt="" /> : "🍽️"}</span>
                  <span className="dup-text"><b>{x.name}</b><small>{x.brand || "no brand"}{x.barcode ? ` · ${x.barcode}` : ""} · {Math.round(x.calories ?? 0)} kcal · {x.protein ?? "?"} g protein</small></span>
                  <span className="dup-pick">{keep === k ? "Keep this name" : ""}</span>
                </button>
              ))}
              <div className="button-row" style={{ marginTop: 8 }}>
                <button className="pill pill-small pill-primary" onClick={() => { const k = pair[keep], o = pair[1 - keep]; merge(k.id, o.id, k.name); }}>Merge</button>
                <button className="link" onClick={() => notSame(a.id, b.id)}>Not the same</button>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

