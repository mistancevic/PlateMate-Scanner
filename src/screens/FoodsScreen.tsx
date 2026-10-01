import { Camera, Plus, X, ScanBarcode } from "lucide-react";
import { density, candidateFood } from "../pilot";
import { duplicatePairs } from "../dedupe";
import { fmt, fixed, pdText, pdVal, pdTag, pdRange } from "../ui";
import type { ScannerMode } from "../types";
import type { AppApi } from "./api";
import { ConfirmButton } from "../components/Confirm";
import { iconFor } from "../icons";
import { FoodCard } from "../components/FoodCard";
import { useEffect, useState } from "react";

type Band = "high" | "mid" | "low";
function band(pd: number | null): Band {
  return pd === null || pd < 3 ? "low" : pd < 5 ? "mid" : "high";
}

export function FoodsScreen(p: AppApi) {
  const { state, setState, blank, setCamera, setMode, barcode, setBarcode, lookup,
    pending, setPending, query, setQuery, add, setImage, setEdit, api,
    setBusy, setError, notify, setFilter, filter, coach, pdRef } = p;
  const inMeal = new Set(state.items.map((i) => i.food.id));
  const [cardId, setCardId] = useState<string | null>(null);
  // a barcode that's already in the library opens its card here
  useEffect(() => { if (p.openFoodId) { setCardId(p.openFoodId); p.clearOpenFood(); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [p.openFoodId]);
  const [dupOpen, setDupOpen] = useState(false);
  const [notSame, setNotSame] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem("chefmealan-not-same") || "[]"); } catch { return []; } });
  const pairKey = (a: string, b: string) => [a, b].sort().join("|");
  const pairs = duplicatePairs(state.foods).filter(([a, b]) => !notSame.includes(pairKey(a.id, b.id)));
  const cardFood = state.foods.find((x) => x.id === cardId);
  const foods = state.foods.map((f) => ({ f, pd: density(f.protein, f.calories) })).map((x) => ({ ...x, b: p.fitPd(x.pd) }));
  const counts = { high: foods.filter((x) => x.b === "high").length, mid: foods.filter((x) => x.b === "mid").length, low: foods.filter((x) => x.b === "low").length };
  const shown = foods.filter(({ f, b }) =>
    (f.name + " " + f.brand).toLowerCase().includes(query.toLowerCase()) &&
    (filter === "all" || (filter === "inmeal" ? inMeal.has(f.id) : b === filter)));
  return (
    <>
      <section className="band">
        <div>
          <small>Your library</small>
          <b>{state.foods.length} {state.foods.length === 1 ? "food" : "foods"}</b>
          <span className="counts">
            <i className="dot dot-high" />{counts.high}
            <i className="dot dot-mid" />{counts.mid}
            <i className="dot dot-low" />{counts.low}
          </span>
        </div>
        <div className="band-actions">
          <button className="pill pill-primary pill-small" onClick={() => { setMode("label"); setCamera(true); }}><Camera size={14} /> Scan</button>
          <button className="pill pill-small" onClick={() => blank()}><Plus size={14} /> Add</button>
          <button className="pill pill-small" onClick={p.addStarter}>Starter foods</button>
        </div>
      </section>
      <div className="scan-modes">
        {(["barcode", "group"] as ScannerMode[]).map((m) => (
          <button key={m} className="pill pill-small" onClick={() => { setMode(m); setCamera(true); }}>
            {m === "group" ? <><Camera size={14} /> Several products</> : <><ScanBarcode size={14} /> Barcode</>}
          </button>
        ))}
        <input aria-label="Barcode number" placeholder="or type a barcode" inputMode="numeric" value={barcode}
          onChange={(e) => setBarcode(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") lookup(); }} />
      </div>
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
      <input className="search" aria-label="Search saved foods" placeholder="Search your foods" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="chips">
        {([["high", "Fits my goal"], ["mid", "Close"], ["low", "Below"], ["inmeal", "In meal"]] as const).map(([k, l]) => (
          <button key={k} className={`chip chip-${k} ${filter === k ? "on" : ""}`} onClick={() => setFilter(filter === k ? "all" : k)}>{l}</button>
        ))}
      </div>
      <div className="rows">
        {shown.map(({ f, pd, b }) => (
          <div className="row" key={f.id}>
            <span className="thumb">{f.photo ? <img src={f.photo} alt="" /> : (f.icon || iconFor(f.name))}</span>
            <div className="row-text">
              <button className="name-link" onClick={() => setCardId(f.id)}>{f.name}</button>
              <small>{f.brand ? `${f.brand} · ` : ""}{fmt(f.calories, 0)} kcal · {fmt(f.protein)} g per 100 g</small>
              <span className="row-links">
                <button className="link" onClick={() => add(f)}>Add to meal</button>
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
      {state.foods.length === 0 && (
        <div className="strip">No foods yet. Scan a label, add one by hand, or <button className="link" onClick={p.addStarter}>add twenty starter foods</button>.</div>
      )}
      {cardFood && <FoodCard food={p.state.foods.find((x) => x.id === cardFood.id) ?? cardFood} addPhoto={(d) => p.addFoodPhoto(cardFood.id, d)} target={pdRef} fit={p.fitPd(density(cardFood.protein, cardFood.calories))} close={() => setCardId(null)} review={() => { setImage(""); setEdit(cardFood); }} />}
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
