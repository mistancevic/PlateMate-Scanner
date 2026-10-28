import { ClearField } from "../components/ClearField";
import { alsoSeen, seenLine, asMine, type MemberFood } from "../memberFoods";
import type { Food } from "../pilot";
import { oneList, rowLine } from "../oneList";
import { identityOf, identityTwins } from "../foodId";
import { cookName } from "../cookWords";
import { Camera, X, Pencil, Plus } from "lucide-react";
import { density, candidateFood, uid } from "../pilot";
import { findReference, referenceFood, localName, otherNames as refOtherNames, synonymsOf } from "../reference";
import { inPlaces, placeName } from "../places";
import { BAND_LABEL, BAND_LINE_IDLE, bandHint } from "../goal";

import { duplicatePairs } from "../dedupe";
import { jobOf } from "../foodjob";
import { fmt, fixed, pdText, pdVal, pdTag, pdRange } from "../ui";
import type { ScannerMode } from "../types";
import type { AppApi, DbProduct } from "./api";
import { ConfirmButton } from "../components/Confirm";
import { iconFor } from "../icons";
import { FoodCard } from "../components/FoodCard";
import { momentOf } from "../moments";
import type { Mix } from "../mixtip";
import { useEffect, useState } from "react";
const fold = (x: string) => x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");

type Band = "high" | "mid" | "low";
function band(pd: number | null): Band {
  return pd === null || pd < 3 ? "low" : pd < 5 ? "mid" : "high";
}

// added today, on this phone's calendar
const isToday = (iso?: string) => { if (!iso) return false; const d = new Date(iso), n = new Date(); return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate(); };
export function FoodsScreen(p: AppApi) {
  const { state, setState, blank, setCamera, setMode, barcode, setBarcode, lookup,
    pending, setPending, query, setQuery, add, setImage, setEdit, api,
    setBusy, setError, notify, setFilter, filter, coach, pdRef } = p;
  const [cardId, setCardId] = useState<string | null>(null);
  const isDigits = /^\d{8,14}$/.test(query.trim());
  const [addOpen, setAddOpen] = useState(false);
  // a barcode that's already in the library opens its card here
  useEffect(() => { if (p.openFoodId) { setCardId(p.openFoodId); p.clearOpenFood(); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [p.openFoodId]);
  const [dupOpen, setDupOpen] = useState(false);
  const [notSame, setNotSame] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem("chefmealan-not-same") || "[]"); } catch { return []; } });
  const pairKey = (a: string, b: string) => [a, b].sort().join("|");
  const pairs = duplicatePairs(state.foods).filter(([a, b]) => !notSame.includes(pairKey(a.id, b.id)));
  const cardFood = state.foods.find((x) => x.id === cardId);
  // DT136 (0.2.120, board Stories93): your place's foods and foods sold everywhere; another place's wait behind its chip
  const [allPlaces, setAllPlaces] = useState(false);
  const shownHere = (f: Food) => allPlaces || p.inPlace(f);
  const foods = state.foods.filter(shownHere).map((f) => ({ f, pd: density(f.protein, f.calories) })).map((x) => ({ ...x, b: p.fitDay(x.pd) }));
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
    if (q.length < 3 ? hay.split(/[\s,()/-]+/).some((w) => w.startsWith(qf)) : hay.includes(qf)) return true;
    // 0.2.103: the other languages' words for what was typed (tuna: tunjevina, Thunfisch, τόνος)
    return q.length >= 3 && synonymsOf(q.toLowerCase()).some((w) => hay.includes(fold(w)));
  };
  const shown = foods.filter(({ f, b }) => nameHit(f) && (filter === "all" || b === filter));
  // a chip must never hide a match in silence: say how many, and where
  const hiddenByChip = q && filter !== "all" ? foods.filter(({ f, b }) => nameHit(f) && b !== filter) : [];
  const have = new Set(state.foods.flatMap((f) => [f.name, ...(f.aliases ?? []), ...((/Also: ([^\n]*)/.exec(f.notes ?? "")?.[1] ?? "").split("·"))]).map((x) => x.trim().replace(/\.$/, "").toLowerCase()).filter(Boolean));
  const noLabel = !isCode && q.length >= 2 ? findReference(q, 6, q.length < 3).filter((r) => ![r.en, r.de, r.sr, r.cyr, r.el ?? ""].some((n) => n && have.has(n.toLowerCase()))) : [];
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
  // DT115 (0.2.97): the members' catalogue, searched with the same words; your own market first
  const [mf, setMf] = useState<{ q: string; foods: MemberFood[] }>({ q: "", foods: [] });
  useEffect(() => {
    if (isCode || q.trim().length < 2) { setMf({ q: "", foods: [] }); return; }
    const t = setTimeout(async () => { const foods = await p.memberFoods(q.trim()); setMf({ q, foods }); }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);
  const [mfCard, setMfCard] = useState<Food | null>(null); // 0.2.103: a member's food opens its card before you take it
  const mfRows = (mf.q === q ? mf.foods : []).filter((m) => !state.foods.some((f) => (m.barcode && f.barcode === m.barcode) || (f.name.toLowerCase() === m.name.toLowerCase() && (f.brand ?? "").toLowerCase() === m.brand.toLowerCase())));
  // a food of yours in the list, as it always was: the card, Add to meal, the favourite, Review, Remove, the PD chip
  const mineRow = (f: Food, names: string[]) => { const pd = density(f.protein, f.calories), b = p.fitDay(pd); return (
          <div className="row" key={f.id}>
            <span className="thumb">{f.photo ? <img src={f.photo} alt="" /> : (f.icon || iconFor(f.name))}</span>
            <div className="row-text">
              <span className="name-line"><button className="name-link" onClick={() => setCardId(f.id)}>{f.favorite && <span className="fav-mark">★ </span>}{f.name}</button>{isToday((f as any).addedAt) && <span className="new-mark">New</span>}</span>
              <small>{jobOf(f).job}{f.brand ? ` by ${f.brand}` : ""}. Per 100 g: {fmt(f.calories, 0)} kcal and {fmt(f.protein)} g protein.{names.length > 1 ? ` Also ${names.slice(1).join(", ")}.` : ""}</small>
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
  ); };
  // DT125: the one list. With nothing typed, your foods (the band chips still filter them); with a word, every source.
  const mineFiltered = foods.filter(({ b }) => filter === "all" || b === filter).map(({ f }) => f);
  const memberHere = (m: MemberFood) => allPlaces || inPlaces(m.seenIn, p.placesActive);
  const list = oneList({ q, mine: mineFiltered, members: q ? (mf.q === q ? mf.foods : []).filter(memberHere) : [], db: q ? dbRows : [], region: p.region, uid });
  // what waits behind another place's chip, for this search: your foods there and members' foods seen only there
  const away = new Map<string, number>();
  if (!allPlaces) {
    const count = (places: string[] | undefined) => { const pl = (places ?? []).find((x) => !inPlaces([x], p.placesActive)); if (pl) away.set(pl, (away.get(pl) ?? 0) + 1); };
    state.foods.filter((f) => !p.inPlace(f) && (!q || nameHit(f))).forEach((f) => count(f.places));
    if (q) (mf.q === q ? mf.foods : []).filter((m) => !memberHere(m)).forEach((m) => count(m.seenIn));
  }
  const otherOn = p.placesOn.filter((x) => x !== p.region);
  const placeChips = [...new Set([...otherOn, ...away.keys(), ...(p.trip ? [p.trip.place] : [])])].filter((x) => x !== p.region);
  const [dbOpen, setDbOpen] = useState(false);
  useEffect(() => { setDbOpen(false); }, [q]);
  // Take it: a member's food or a basic food becomes a copy of yours, with its identity; already yours, nothing twice
  const take = (r: { kind: string; food: Food; member?: MemberFood }) => {
    if (r.kind === "member" && r.member) { p.addMemberFood(r.member); return; }
    const have = state.foods.find((f) => identityOf(f) === identityOf(r.food));
    if (have) { notify(`${have.name} is in your foods already.`); return; }
    setState((st) => ({ ...st, foods: [{ ...r.food, id: uid(), reviewedAt: new Date().toISOString() }, ...st.foods] }));
    notify(`${r.food.name} is in your foods.`);
  };
  const nothing = q.length >= 1 && list.rows.length === 0 && list.db.length === 0 && !db.busy;
  return (
    <>
      <>
      <section className="find">
        <div className="find-head">
          <div className="find-title"><b>Find a food</b><small>{state.foods.length} in your foods</small></div>
          <button className={`pill pill-small add-toggle ${addOpen ? "pill-primary" : ""}`} aria-expanded={addOpen} aria-label="Add a food" onClick={() => setAddOpen(!addOpen)}><Plus size={15} /> Add</button>
        </div>
        {addOpen && (
          <div className="add-strip" aria-label="Add a food: Type or Scan">
            <div className="ways">
              <button className="pill pill-small" onClick={() => { setAddOpen(false); blank(isDigits ? "" : query.trim(), "", query.trim(), isDigits ? query.trim() : ""); }}><Pencil size={15} /> Type</button>
              <button className="pill pill-small pill-primary" onClick={() => { setAddOpen(false); setMode("label"); setCamera(true); }}><Camera size={15} /> Scan</button>
            </div>
          </div>
        )}
        <ClearField value={query} onClear={() => setQuery("")} label="Clear the search"><input className="search" aria-label="Find a food" placeholder="A name, or a barcode you saved" value={query} onChange={(e) => setQuery(e.target.value)} /></ClearField>
      </section>
      {(placeChips.length > 0 || allPlaces) && (
        <div className="place-chips" role="group" aria-label="Foods from">
          <small>Foods from</small>
          {p.region && <button type="button" className="choice on" aria-pressed="true" disabled>{placeName(p.region)}</button>}
          {placeChips.map((x) => { const on = p.placesActive.has(x); return <button type="button" key={x} className={`choice ${on ? "on" : ""}`} aria-pressed={on} onClick={() => p.setPlaceOn(x, !on, false)}>{placeName(x)}{!on && away.get(x) ? ` · ${away.get(x)}` : ""}</button>; })}
          <button type="button" className={`choice ${allPlaces ? "on" : ""}`} aria-pressed={allPlaces} onClick={() => setAllPlaces(!allPlaces)}>All places</button>
        </div>
      )}
      {q && away.size > 0 && <small className="place-away">{[...away].map(([x, n]) => `${n} more in ${placeName(x)}`).join(", ")}. Tap {[...away.keys()].map(placeName).join(" or ")} to see them.</small>}
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
      <div className={`chips ${filter !== "all" ? "filtering" : ""}`}>
        {(["below", "close", "plan", "high", "top"] as const).map((k) => (
          <button key={k} className={`chip chip-${k} ${filter === k ? "on" : ""}`} aria-pressed={filter === k} onClick={() => setFilter(filter === k ? "all" : k)}>{BAND_LABEL[k]}</button>
        ))}
      </div>
      <p className="band-line" aria-live="polite">{filter === "all" ? BAND_LINE_IDLE : bandHint(filter, p.dayPd)}</p>
      {hiddenByChip.length > 0 && <p className="small hidden-by-chip">{hiddenByChip.length} more in your foods under {[...new Set(hiddenByChip.map((x) => BAND_LABEL[x.b]))].join(", ")}. <button className="link" onClick={() => setFilter("all")}>Show all</button></p>}
      {/* DT125 (0.2.104): one list for one word. Your foods first, then members', then the basic foods; the product database
          behind a line. One row per food, whatever anyone called it. With nothing typed, your foods as before. */}
      {q.length >= 1 && (list.rows.length > 0 || list.db.length > 0) && <p className="label group-label">{q.length >= 1 ? `${q} · ${list.rows.length} ${list.rows.length === 1 ? "food" : "foods"}` : "Your foods"}{db.busy && q.length >= 3 ? <small> · looking in the product database…</small> : null}</p>}
      <div className="rows">
        {list.rows.map((r) => r.kind === "mine" ? mineRow(r.food, r.names) : (
          <div className={`row outside-row row-${r.kind}`} key={r.key}>
            <span className="thumb">{r.food.photo ? <img src={r.food.photo} alt="" loading="lazy" /> : (r.kind === "basic" ? "📘" : iconFor(r.food.name))}</span>
            <div className="row-text">
              <button className="name-link" onClick={() => setMfCard(r.food)}>{r.names[0]}</button>
              <small>{rowLine(r)}</small>
            </div>
            <button className="pill pill-small" onClick={() => take(r)}><Plus size={14} /> Add</button>
          </div>
        ))}
        {state.foods.length === 0 && !q && <small>No saved foods yet. Scan or type one above.</small>}
      </div>
      {list.db.length > 0 && !dbOpen && <button className="link all-foods" onClick={() => setDbOpen(true)}>More from the product database ›</button>}
      {list.db.length > 0 && dbOpen && (
        <section className="outside" aria-label="In the product database">
          <p className="label group-label">In the product database</p>
          {list.db.map((r) => r.kind === "db" && (
            <div className="row outside-row" key={r.key}>
              <span className="thumb">{iconFor(r.food.name)}</span>
              <div className="row-text"><b className="name-plain">{r.food.name}</b><small>{rowLine(r)}</small></div>
              <button className="pill pill-small" onClick={() => p.addFromDatabase(r.product.code)}>Add to my foods</button>
            </div>
          ))}
        </section>
      )}
      {q.length >= 2 && !db.busy && (
        <section className="end-add" aria-label="Add it yourself">
          <b>{nothing ? `Nothing found for "${q}".` : "Can't find what you want?"}</b>
          <span>Add it yourself{isDigits ? ", the number comes with you." : `, "${q}" comes with you.`}</span>
          <div className="ways">
            <button className="pill pill-small" onClick={() => blank(isDigits ? "" : q, "", q, isDigits ? q : "")}><Pencil size={15} /> Type</button>
            <button className="pill pill-small pill-primary" onClick={() => { setMode("label"); setCamera(true); }}><Camera size={15} /> Scan</button>
          </div>
        </section>
      )}
      {state.foods.length === 0 && (
        <div className="strip">No foods yet. Scan, type a name, or <button className="link" onClick={p.addStarter}>add twenty starter foods</button>.</div>
      )}
      </>
      {mfCard && <FoodCard rates={p.rates} food={mfCard} target={p.dayPd} fit={p.fitDay(density(mfCard.protein, mfCard.calories))} close={() => setMfCard(null)} />}
      {cardFood && <FoodCard rates={p.rates} food={p.state.foods.find((x) => x.id === cardFood.id) ?? cardFood} places={{ set: (x) => p.setFoodPlaces(cardFood.id, x), home: p.region }} addPhoto={(d) => p.addFoodPhoto(cardFood.id, d)} removePhoto={(i) => p.removeFoodPhoto(cardFood.id, i)} setMain={(i) => p.setMainPhoto(cardFood.id, i)} toggleFavorite={() => p.toggleFavorite(cardFood.id)} insight={{ dayKcal: p.todayKcal, eaten: p.eatenTodayKcal, dayName: p.dayName, goalKey: p.tipGoalKey, requestTip: () => p.requestTip(cardFood.id), setJob: (j) => p.setFoodJob(cardFood.id, j) }} target={p.dayPd} fit={p.fitDay(density(cardFood.protein, cardFood.calories))} close={() => setCardId(null)} review={() => { setImage(""); setEdit(cardFood); }} mix={(() => { const f = p.state.foods.find((x) => x.id === cardFood.id) ?? cardFood; const tip = p.mixFor(f); return { tip, momentName: momentOf(p.moment).name, take: (m: Mix) => { setCardId(null); p.takeMix(f, m); }, ask: () => { setCardId(null); p.askAboutMix(f, tip); } }; })()} />}
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

