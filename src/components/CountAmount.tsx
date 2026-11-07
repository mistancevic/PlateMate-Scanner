import { useState } from "react";
import { w } from "../words";
import type { Ingredient } from "../pilot";
import { servingLabel } from "../pilot";
import { countLabel, countOf, resize, sizesOf, stepCount, weighed, KINDS, type Count } from "../counted";

// Counted foods on a plate (0.2.24, canvas board CT, CT3 to CT5): the count large, the size and the grams small. On your
// own plate − and + move whole ones; the size opens under the row; a banana can be weighed, and typed grams win.
// A pack that prints a piece (1 bar 45 g) shows the count first too.
export const isCounted = (i: Ingredient) => Boolean(countOf(i) || i.food.serving);
export function CountAmount({ item, editable, open, onToggle, onGrams, whole }: { item: Ingredient; editable: boolean; open?: boolean; onToggle?: () => void; onGrams: (grams: number, count?: Count) => void; whole?: boolean }) {
  const c = countOf(item);
  if (!c) {
    // a pack's piece: the count first, the grams small
    const s = item.food.serving!;
    const label = servingLabel(item.food, item.grams) ?? "";
    const by = (d: 1 | -1) => onGrams(Math.max(0, (d > 0 ? Math.floor(item.grams / s.grams + 1e-6) + 1 : Math.ceil(item.grams / s.grams - 1e-6) - 1) * s.grams));
    return (
      <span className="ct-num">
        {editable ? <span className="ct-step"><button type="button" aria-label={w("count.oneLess", { piece: s.name })} onClick={() => by(-1)}>−</button><b>{label}</b><button type="button" aria-label={w("count.oneMore", { piece: s.name })} onClick={() => by(1)}>+</button></span> : <b>{label}</b>}
        <small>{Math.round(item.grams)} g</small>
      </span>
    );
  }
  const l = countLabel(c, item.grams, whole), k = KINDS[c.kind];
  return (
    <span className="ct-num">
      {editable
        ? <span className="ct-step"><button type="button" aria-label={w("count.oneLess", { piece: k.one })} onClick={() => onGrams(stepCount(c, item.grams, -1), { ...c, weighed: false })}>−</button><b>{l.main}</b><button type="button" aria-label={w("count.oneMore", { piece: k.one })} onClick={() => onGrams(stepCount(c, item.grams, 1), { ...c, weighed: false })}>+</button></span>
        : <b>{l.main}</b>}
      {onToggle ? <button type="button" className="ct-small" aria-expanded={Boolean(open)} aria-label={w("count.sizeOfIs", { food: item.food.name, size: l.small })} onClick={onToggle}>{l.small}</button> : <small>{l.small}</small>}
    </span>
  );
}
// the sizes, each with its grams; a banana can be weighed
export function SizePicker({ item, onGrams }: { item: Ingredient; onGrams: (grams: number, count: Count) => void }) {
  const c = countOf(item)!;
  const k = KINDS[c.kind];
  const [typed, setTyped] = useState("");
  const weigh = () => { const g = Math.round(Number(typed.replace(",", "."))); if (g > 0 && g < 2000) { onGrams(g, weighed(c, g)); setTyped(""); } };
  return (
    <div className="ct-pick" role="group" aria-label={w("count.sizeOf", { food: item.food.name })}>
      <b>{w("count.size")}</b>
      <div className="ct-sizes">{sizesOf(c.kind).map(([s, g]) => (
        <button key={s} type="button" className={c.size === s ? "on" : ""} aria-pressed={c.size === s} onClick={() => { const r = resize(c, item.grams, s); onGrams(r.grams, r.count); }}>{s}<small>{g} g</small></button>
      ))}</div>
      <small>{c.kind === "egg" ? w("count.eachEggWithoutTheShell") : c.kind === "apple" ? w("count.wholeApple") : w("count.peeledBananasVaryMoreThan")}</small>
      {c.kind !== "egg" && (
        <span className="ct-weigh">{w("count.weighedIt")} <input inputMode="numeric" aria-label={w("count.gramsWeighed", { piece: k.one })} placeholder="134" value={typed} onChange={(e) => setTyped(e.target.value.replace(/[^\d.,]/g, ""))} onBlur={weigh} onKeyDown={(e) => { if (e.key === "Enter") weigh(); }} /> g {k.note}</span>
      )}
    </div>
  );
}
