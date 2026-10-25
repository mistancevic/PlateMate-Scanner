// The recipes bar (0.2.105, board Stories72, DT126; Milan 25 October 13:49 and 14:22): one search, Kitchen and Member as
// drop-downs (tens of members and ten kitchens are a wall of chips, so one line each with counts), four chips that stack,
// a sort, and a line that says what is shown of what. Members and Mine share it; Mine's Member reads Shared.
import { useState } from "react";
import { ClearField } from "./ClearField";
import { EMPTY, MOMENTS, SORTS, countLine, memberLabel, type Filters, type Line, type RecipeRow, type Sort } from "../recipeFilter";

type Open = "kitchen" | "member" | "shared" | "moment" | null;
// a recipe is shared with members or not; a plate goes to the coach, not a recipe, so no third line
export const SHARED_LINES: Line[] = [{ key: "members", label: "With members", count: "" }, { key: "none", label: "Not shared", count: "" }];
export const sharedWord = (s: RecipeRow["shared"]) => (s === "members" ? "Shared with members" : "Not shared");

export function RecipeBar({ f, set, sort, setSort, kitchens, members, shown, total, kind, placeholder }:
  { f: Filters; set: (f: Filters) => void; sort: Sort; setSort: (s: Sort) => void; kitchens: Line[]; members: Line[]; shown: number; total: number; kind: "mine" | "members"; placeholder?: string }) {
  const [open, setOpen] = useState<Open>(null);
  const toggle = (o: Open) => setOpen(open === o ? null : o);
  const drop = (id: Exclude<Open, null>, label: string, lit: string | null, lines: Line[], value: string | null) => (
    <button type="button" className={`choice rb-drop ${value ? "on" : ""}`} aria-expanded={open === id} aria-controls={`rb-${id}`} onClick={() => toggle(id)} disabled={!lines.length && !value}>{value ? `${label}: ${lit}` : label} ▾</button>
  );
  const sheet = (id: Exclude<Open, null>, title: string, lines: Line[], value: string | null, pick: (k: string | null) => void, allLabel: string) => open === id && (
    <div className="rb-sheet" id={`rb-${id}`} role="group" aria-label={title}>
      <small className="rb-sheet-title">{title}</small>
      <button type="button" className={`rb-line ${value === null ? "on" : ""}`} onClick={() => { pick(null); setOpen(null); }}><span>{allLabel}</span><small>{total}</small></button>
      {lines.map((l) => <button type="button" key={l.key} className={`rb-line ${value === l.key ? "on" : ""}`} onClick={() => { pick(value === l.key ? null : l.key); setOpen(null); }}><span>{l.label}</span><small>{l.count}</small></button>)}
    </div>
  );
  const chip = (on: boolean, label: string, flip: () => void) => <button type="button" className={`choice ${on ? "on" : ""}`} aria-pressed={on} onClick={flip}>{label}</button>;
  const momentLabel = f.moment ? MOMENTS.find((m) => m.id === f.moment)!.label : null;
  return (
    <section className="card rb" aria-label="Find a recipe">
      <ClearField value={f.q} onClear={() => set({ ...f, q: "" })} label="Clear the search">
        <input className="search rb-search" aria-label="Search recipes" placeholder={placeholder ?? (kind === "members" ? "Search recipes, foods in them, cooks" : "Search recipes and the foods in them")} value={f.q} onChange={(e) => set({ ...f, q: e.target.value })} />
      </ClearField>
      <div className="rb-chips" role="group" aria-label="Filters">
        {drop("kitchen", "Kitchen", f.kitchen, kitchens, f.kitchen)}
        {kind === "members"
          ? drop("member", "Member", memberLabel(f.member), members, f.member)
          : drop("shared", "Shared", f.shared ? SHARED_LINES.find((l) => l.key === f.shared)!.label.toLowerCase() : null, SHARED_LINES, f.shared)}
        {drop("moment", "Moment", momentLabel, MOMENTS.map((m) => ({ key: m.id, label: m.label, count: "" })), f.moment)}
        {chip(f.day, "Fits my day", () => set({ ...f, day: !f.day }))}
        {chip(f.nocook, "No cooking", () => set({ ...f, nocook: !f.nocook }))}
        {chip(f.withMine, "With my foods", () => set({ ...f, withMine: !f.withMine }))}
      </div>
      {sheet("kitchen", "Kitchen", kitchens, f.kitchen, (k) => set({ ...f, kitchen: k }), "All kitchens")}
      {kind === "members" && sheet("member", "Member", members, f.member, (k) => set({ ...f, member: k }), "All members")}
      {kind === "mine" && sheet("shared", "Shared", SHARED_LINES, f.shared, (k) => set({ ...f, shared: k as Filters["shared"] }), "All")}
      {sheet("moment", "Moment", MOMENTS.map((m) => ({ key: m.id, label: m.label, count: "" })), f.moment, (k) => set({ ...f, moment: k as Filters["moment"] }), "Any moment")}
      <div className="rb-sort" role="group" aria-label="Sort">
        <b>Sort</b>
        {SORTS.filter((s) => s.id !== "fit" || kind === "members").map((s) => <button type="button" key={s.id} className={`link rb-sort-link ${sort === s.id ? "on" : ""}`} aria-pressed={sort === s.id} onClick={() => setSort(s.id)}>{s.label}</button>)}
      </div>
      <small className="muted rb-count">{countLine(shown, total, f, sharedWord)}{f !== EMPTY && (f.q || f.kitchen || f.member || f.shared || f.moment || f.day || f.nocook || f.withMine) ? <> · <button type="button" className="link" onClick={() => set(EMPTY)}>Clear all</button></> : null}</small>
    </section>
  );
}
