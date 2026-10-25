// The recipes bar (0.2.105, board Stories72, DT126; 0.2.106, board Stories74, DT126c; Milan 25 October 13:49 to 15:12): one
// search, Made by and Kitchen as drop-downs (tens of members and ten kitchens are a wall of chips, so one line each with
// counts), Moment, three chips that stack, a sort, and a line that says what is shown of what. No tabs: Recipes is one list
// under this bar, and who made a recipe is a filter like any other.
import { useState } from "react";
import { ClearField } from "./ClearField";
import { EMPTY, MOMENTS, SORTS, countLine, isIdle, madeByLabel, type Filters, type Line, type Sort } from "../recipeFilter";

type Open = "madeBy" | "kitchen" | "moment" | null;

export function RecipeBar({ f, set, sort, setSort, kitchens, madeBy, shown, total, coachLabel }:
  { f: Filters; set: (f: Filters) => void; sort: Sort; setSort: (s: Sort) => void; kitchens: Line[]; madeBy: Line[]; shown: number; total: number; coachLabel: string }) {
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
  return (
    <section className="card rb" aria-label="Find a recipe">
      <ClearField value={f.q} onClear={() => set({ ...f, q: "" })} label="Clear the search">
        <input className="search rb-search" aria-label="Search recipes" placeholder="Search recipes, the foods in them, who made them" value={f.q} onChange={(e) => set({ ...f, q: e.target.value })} />
      </ClearField>
      <div className="rb-chips" role="group" aria-label="Filters">
        {drop("madeBy", "Made by", madeByLabel(f.madeBy, coachLabel), madeBy, f.madeBy)}
        {drop("kitchen", "Kitchen", f.kitchen, kitchens, f.kitchen)}
        {drop("moment", "Moment", momentLabel, momentLines, f.moment)}
        {chip(f.day, "Fits my day", () => set({ ...f, day: !f.day }))}
        {chip(f.nocook, "No cooking", () => set({ ...f, nocook: !f.nocook }))}
        {chip(f.withMine, "With my foods", () => set({ ...f, withMine: !f.withMine }))}
      </div>
      {sheet("madeBy", "Made by", madeBy, f.madeBy, (k) => set({ ...f, madeBy: k }), "All", String(total))}
      {sheet("kitchen", "Kitchen", kitchens, f.kitchen, (k) => set({ ...f, kitchen: k }), "All kitchens", String(total))}
      {sheet("moment", "Moment", momentLines, f.moment, (k) => set({ ...f, moment: k as Filters["moment"] }), "Any moment", "")}
      <div className="rb-sort" role="group" aria-label="Sort">
        <b>Sort</b>
        {SORTS.map((s) => <button type="button" key={s.id} className={`link rb-sort-link ${sort === s.id ? "on" : ""}`} aria-pressed={sort === s.id} onClick={() => setSort(s.id)}>{s.label}</button>)}
      </div>
      <small className="muted rb-count">{countLine(shown, total, f, coachLabel)}{!isIdle(f) ? <> · <button type="button" className="link" onClick={() => set(EMPTY)}>Clear all</button></> : null}</small>
    </section>
  );
}
