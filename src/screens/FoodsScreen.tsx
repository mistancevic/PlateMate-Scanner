import { Camera, Plus, X } from "lucide-react";
import { density } from "../pilot";
import { fmt, fixed } from "../ui";
import type { ScannerMode } from "../types";
import type { AppApi } from "./api";

type Band = "high" | "mid" | "low";
function band(pd: number | null): Band {
  return pd === null || pd < 3 ? "low" : pd < 5 ? "mid" : "high";
}

export function FoodsScreen(p: AppApi) {
  const { state, setState, blank, setCamera, setMode, barcode, setBarcode, lookup,
    pending, setPending, query, setQuery, add, setImage, setEdit, api,
    setBusy, setError, notify, setFilter, filter } = p;
  const inMeal = new Set(state.items.map((i) => i.food.id));
  const foods = state.foods.map((f) => ({ f, pd: density(f.protein, f.calories) })).map((x) => ({ ...x, b: band(x.pd) }));
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
        </div>
      </section>
      <div className="scan-modes">
        {(["barcode", "group"] as ScannerMode[]).map((m) => (
          <button key={m} className="link" onClick={() => { setMode(m); setCamera(true); }}>
            {m === "group" ? "Photo of several products" : "Scan a barcode"}
          </button>
        ))}
        <input aria-label="Barcode number" placeholder="or type a barcode" inputMode="numeric" value={barcode}
          onChange={(e) => setBarcode(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") lookup(); }} />
      </div>
      {pending.length > 0 && (
        <section className="pending">
          <p className="label">Products seen. Enter each label to add it.</p>
          {pending.map((q, i) => (
            <div className="row" key={i}>
              <div className="row-text"><b>{q.name}</b><small>{q.brand}</small></div>
              <button className="pill pill-small" onClick={() => blank(q.name, q.brand)}>Enter label</button>
              <button className="icon" aria-label={`Dismiss ${q.name}`} onClick={() => setPending((v) => v.filter((_, j) => j !== i))}><X size={16} /></button>
            </div>
          ))}
        </section>
      )}
      <input className="search" aria-label="Search saved foods" placeholder="Search your foods" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="chips">
        {([["high", "High PD"], ["mid", "Mid"], ["low", "Low"], ["inmeal", "In meal"]] as const).map(([k, l]) => (
          <button key={k} className={`chip chip-${k} ${filter === k ? "on" : ""}`} onClick={() => setFilter(filter === k ? "all" : k)}>{l}</button>
        ))}
      </div>
      <div className="rows">
        {shown.map(({ f, pd, b }) => (
          <div className="row" key={f.id}>
            <span className={`dot ${inMeal.has(f.id) ? "dot-locked" : "dot-none"}`} />
            <div className="row-text">
              <b>{f.name}</b>
              <small>{f.brand ? `${f.brand} · ` : ""}{fmt(f.calories, 0)} kcal · {fmt(f.protein)} g per 100 g</small>
              <span className="row-links">
                <button className="link" onClick={() => add(f)}>Add to meal</button>
                <button className="link" onClick={() => { setImage(""); setEdit(f); }}>Review</button>
                <button className="link" onClick={async () => {
                  setBusy("Saving to Airtable");
                  try { await api("/api/save", { food: f }); notify("Saved to Airtable."); }
                  catch (e: any) { setError(e.message); } finally { setBusy(""); }
                }}>Airtable</button>
                <button className="link link-danger" onClick={() => {
                  if (confirm("Remove this food from your library?"))
                    setState((s) => ({ ...s, foods: s.foods.filter((x) => x.id !== f.id) }));
                }}>Remove</button>
              </span>
            </div>
            <span className={`pdpill pdpill-${b}`}>{fixed(pd)}<small>PD</small></span>
          </div>
        ))}
      </div>
      {state.foods.length === 0 && <div className="strip">No foods yet. Scan a label or add one by hand.</div>}
    </>
  );
}
