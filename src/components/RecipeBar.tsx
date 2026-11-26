// The recipes bar (0.2.105, board Stories72, DT126; 0.2.106, board Stories74, DT126c; Milan 25 October 13:49 to 15:12): one
// search, Made by and Kitchen as drop-downs (tens of members and ten kitchens are a wall of chips, so one line each with
// counts), Moment, three chips that stack, a sort, and a line that says what is shown of what. No tabs: Recipes is one list
// under this bar, and who made a recipe is a filter like any other.
import { w, wn } from "../words";
import { optWord } from "../optWords";
import { useState } from "react";
import { ClearField } from "./ClearField";
import { pdTag, pdVal } from "../ui";
import { EMPTY, MOMENTS, PDS, pdRangeLabel, pdRangeOf, SORTS, countLine, isIdle, madeByLabel, type Filters, type Line, type Sort } from "../recipeFilter";

// DT347 (0.3.199): the sort and Made by, then the filters in one row; each drop-down opens its choices under its row
type Open = "madeBy" | "sort" | "filters" | null;

export function RecipeBar({ f, set, sort, setSort, kitchens, madeBy, shown, total, coachLabel, served, target }:
  { target?: number | null; f: Filters; set: (f: Filters) => void; sort: Sort; setSort: (s: Sort) => void; kitchens: Line[]; madeBy: Line[]; shown: number; total: number; coachLabel: string;
    // DT268 (0.3.118): the Served chip, when there are plates scanned to explore
    served?: { n: number; on: boolean; toggle: () => void } }) {
  const [open, setOpen] = useState<Open>(null);
  const toggle = (o: Open) => setOpen(open === o ? null : o);
  const drop = (id: Exclude<Open, null>, label: string, lit: string | null, lines: Line[], value: string | null) => (
    <button type="button" className={`choice rb-drop ${value ? "on" : ""}`} aria-expanded={open === id} aria-controls={`rb-${id}`} onClick={() => toggle(id)} disabled={!lines.length && !value}>{value ? `${label}: ${lit}` : label} ▾</button>
  );
  const sheet = (id: Exclude<Open, null>, title: string, lines: Line[], value: string | null, pick: (k: string | null) => void, allLabel: string, allCount: string) => open === id && (
    <div className="rb-sheet" id={`rb-${id}`} role="group" aria-label={title}>
      <small className="rb-sheet-title">{title}</small>
      <button type="button" className={`rb-line ${value === null ? "on" : ""}`} onClick={() => { pick(null); setOpen(null); }}><span>{allLabel}</span><small>{allCount}</small></button>
      {lines.map((l) => <button type="button" key={l.key} className={`rb-line ${value === l.key ? "on" : ""}`} onClick={() => { pick(value === l.key ? null : l.key); setOpen(null); }}><span>{l.label}</span><small>{l.count}</small></button>)}
    </div>
  );
  const chip = (on: boolean, label: string, flip: () => void) => <button type="button" className={`choice ${on ? "on" : ""}`} aria-pressed={on} onClick={flip}>{label}</button>;
  const momentLabel = f.moment ? MOMENTS.find((m) => m.id === f.moment)!.label : null;
  const momentLines = MOMENTS.map((m) => ({ key: m.id, label: m.label, count: "" }));
  // DT347: how many filters inside Filters are set (the sort, Made by and the search stay outside)
  const nSet = [f.kitchen, f.moment, f.pd, f.day, f.nocook, f.withMine, served?.on].filter(Boolean).length;
  return (
    <section className="card rb" aria-label={w("recipebar.findARecipe")}>
      <ClearField value={f.q} onClear={() => set({ ...f, q: "" })} label={w("recipebar.clearTheSearch")}>
        <input className="search rb-search" aria-label={w("recipebar.searchRecipes")} placeholder={w("recipebar.searchRecipesTheFoodsIn")} value={f.q} onChange={(e) => set({ ...f, q: e.target.value })} />
      </ClearField>
      {/* DT347 (0.3.199, Coach Milan 26 November 11:46 to 12:16): one row, the sort first (Newest), then Made by, each showing its
          choice, then Filters, the one place to pick several: it opens a panel downwards with every filter, Show N recipes at the end */}
      <div className="rb-chips" role="group" aria-label={w("recipebar.filters")}>
        <button type="button" className="choice rb-drop rb-sort-chip on" aria-expanded={open === "sort"} aria-controls="rb-sort" aria-label={w("recipebar.sortIs", { sort: SORTS.find((x) => x.id === sort)!.label })} onClick={() => toggle("sort")}>{SORTS.find((x) => x.id === sort)!.label} ▾</button>
        <button type="button" className="choice rb-drop on" aria-expanded={open === "madeBy"} aria-controls="rb-madeBy" onClick={() => toggle("madeBy")} disabled={!madeBy.length && !f.madeBy}>{w("recipebar.madeBy")}: {f.madeBy ? madeByLabel(f.madeBy, coachLabel) : w("rb.all")} ▾</button>
        <button type="button" className={`choice rb-drop rb-filters-chip ${nSet ? "on" : ""}`} aria-expanded={open === "filters"} aria-controls="rb-filters" onClick={() => toggle("filters")}>{nSet ? w("recipebar.filtersN", { n: nSet }) : w("recipebar.filters")} ▾</button>
      </div>
      {open === "sort" && (
        <div className="rb-sheet" id="rb-sort" role="group" aria-label={w("recipebar.sort")}>
          <small className="rb-sheet-title">{w("recipebar.sort")}</small>
          <div className="rb-chips">{SORTS.map((s) => <button type="button" key={s.id} className={`choice ${sort === s.id ? "on" : ""}`} aria-pressed={sort === s.id} onClick={() => { setSort(s.id); setOpen(null); }}>{s.label}</button>)}</div>
        </div>
      )}
      {sheet("madeBy", w("recipebar.madeBy"), madeBy, f.madeBy, (k) => set({ ...f, madeBy: k }), w("rb.all"), String(total))}
      {open === "filters" && (
        <div className="rb-sheet rb-panel" id="rb-filters" role="group" aria-label={w("recipebar.filters")}>
          <small className="rb-sheet-title">{w("rb.kitchen")}</small>
          {[{ key: null as string | null, label: w("recipebar.allKitchens"), count: String(total) }, ...kitchens].map((l) => <button type="button" key={l.key ?? "all"} className={`rb-line ${f.kitchen === l.key ? "on" : ""}`} onClick={() => set({ ...f, kitchen: f.kitchen === l.key ? null : l.key })}><span>{l.label}</span><small>{l.count}</small></button>)}
          <small className="rb-sheet-title">{w("rb.moment")}</small>
          {[{ key: null as string | null, label: w("recipebar.anyMoment"), count: "" }, ...momentLines].map((l) => <button type="button" key={l.key ?? "any"} className={`rb-line ${f.moment === l.key ? "on" : ""}`} onClick={() => set({ ...f, moment: (f.moment === l.key ? null : l.key) as Filters["moment"] })}><span>{l.label}</span><small>{l.count}</small></button>)}
          {/* DT347 (Coach Milan 12:41): PD by ranges; the range that holds my target says so */}
          <small className="rb-sheet-title">{w("rf.pdTitle", { tag: pdTag() })}</small>
          {[{ key: null as string | null, label: w("rf.pdAny", { tag: pdTag() }), count: "" }, ...PDS.map((r) => ({ key: r.id as string | null, label: pdRangeLabel(r.id), count: target != null && pdRangeOf(target) === r.id ? w("rf.pd.yours", { v: pdVal(target) }) : "" }))].map((l) => <button type="button" key={l.key ?? "any"} className={`rb-line ${f.pd === l.key ? "on" : ""}`} onClick={() => set({ ...f, pd: (f.pd === l.key ? null : l.key) as Filters["pd"] })}><span>{l.label}</span><small>{l.count}</small></button>)}
          <small className="rb-sheet-title">{w("recipebar.more")}</small>
          {/* DT347 (Coach Milan 12:29): the same rows as Kitchen and Moment; each one on or off, so several can be on */}
          {[{ on: f.day, label: w("recipebar.fitsMyDay"), flip: () => set({ ...f, day: !f.day }) }, { on: f.nocook, label: w("recipebar.noCooking"), flip: () => set({ ...f, nocook: !f.nocook }) },
            { on: f.withMine, label: w("recipebar.withMyFoods"), flip: () => set({ ...f, withMine: !f.withMine }) },
            ...(served && served.n > 0 ? [{ on: served.on, label: w("served.chip", { n: served.n }), flip: served.toggle }] : [])].map((x) =>
            <button type="button" key={x.label} className={`rb-line ${x.on ? "on" : ""}`} aria-pressed={x.on} onClick={x.flip}><span>{x.label}</span><small /></button>)}
          <div className="rb-panel-actions">
            <button type="button" className="pill pill-danger-line" disabled={!nSet} onClick={() => set({ ...EMPTY, q: f.q, madeBy: f.madeBy })}>{w("recipebar.clearAll")}</button>
            <button type="button" className="pill pill-primary" onClick={() => setOpen(null)}>{wn("recipebar.showN", shown)}</button>
          </div>
        </div>
      )}
      {/* DT347: while Filters is open, its own Clear all and Show N recipes stand in for the line */}
      {open !== "filters" && <small className="muted rb-count">{countLine(shown, total, f, coachLabel)}{!isIdle(f) ? <> · <button type="button" className="pill pill-small pill-danger-line" onClick={() => set(EMPTY)}>{w("recipebar.clearAll")}</button></> : null}</small>}
    </section>
  );
}
