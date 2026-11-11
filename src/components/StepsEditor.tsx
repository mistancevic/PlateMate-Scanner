import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { w, wn } from "../words";
import type { Ingredient } from "../pilot";
import { amountOf } from "../recipes";
import { amountFor, missingFoods, stepParts, tokenOf, usedIds } from "../steps";
import { countOf } from "../counted";

// The steps, one field each, and the foods as chips (0.2.5+r16, canvas board S4, R13a and R13b). A tap on a food puts
// the food and its amount into the step where the cursor is, as a blue chip; the amount is read from the recipe, so a
// changed weight changes the step by itself. Enter starts the next step. A food that no step names is said, once any
// step names a food. Steps written before this release stay plain text.
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const chipHtml = (id: string, name: string, label: string, gone: boolean) =>
  `<span class="st-food${gone ? " gone" : ""}" contenteditable="false" data-item="${esc(id)}" data-name="${esc(name)}">${esc(label)}</span>`;
const toHtml = (step: string, items: Ingredient[]) =>
  stepParts(step, items).map((p) => ("text" in p ? esc(p.text) : chipHtml(p.id, p.name, p.label, p.gone))).join("");
// the field back to a step: words as typed, chips as tokens
function serialize(el: HTMLElement): string {
  let out = "";
  el.childNodes.forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) out += n.textContent ?? "";
    else if (n instanceof HTMLElement && n.dataset.item) out += `[[i:${n.dataset.item}|${n.dataset.name ?? ""}]]`;
    else if (n instanceof HTMLElement && n.tagName !== "BR") out += serialize(n);
  });
  return out.replace(/ /g, " ");
}
let rowSeq = 0;
const newRow = () => `r${++rowSeq}`;

export function StepsEditor({ steps, items, onChange }: { steps: string[]; items: Ingredient[]; onChange: (steps: string[]) => void }) {
  const [rows, setRows] = useState<string[]>(() => (steps.length ? steps : [""]).map(newRow));
  const values = useRef<string[]>(steps.length ? [...steps] : [""]);
  const els = useRef(new Map<string, HTMLDivElement>());
  const lastFocus = useRef<string | null>(null);
  const [, bump] = useState(0);
  const shown = items.filter((i) => i.grams > 0);
  const emit = () => { onChange([...values.current]); bump((n) => n + 1); };
  // a new field gets its text once; after that the field is the person's
  // (React calls the ref again on every render; only a field that has never been filled is filled)
  const fill = (key: string, el: HTMLDivElement | null) => {
    if (!el) return;
    els.current.set(key, el);
    if (el.dataset.filled) return;
    el.dataset.filled = "1";
    el.innerHTML = toHtml(values.current[rows.indexOf(key)] ?? "", items);
  };
  // the amounts follow the foods: a weight changed in Foods shows in every chip at once
  const sig = items.map((i) => `${i.id}:${i.grams}`).join(",");
  useLayoutEffect(() => {
    els.current.forEach((el) => el.querySelectorAll<HTMLElement>("[data-item]").forEach((c) => {
      const it = items.find((i) => i.id === c.dataset.item && i.grams > 0);
      c.textContent = it ? amountFor(it.id, c.dataset.name ?? "", [it]) : (c.dataset.name ?? "");
      c.classList.toggle("gone", !it);
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);
  const read = (key: string) => { const el = els.current.get(key); const k = rows.indexOf(key); if (el && k >= 0) { values.current[k] = serialize(el); emit(); } };
  const focusEnd = (key: string) => requestAnimationFrame(() => {
    const el = els.current.get(key); if (!el) return;
    el.focus(); const r = document.createRange(); r.selectNodeContents(el); r.collapse(false);
    const s = window.getSelection(); s?.removeAllRanges(); s?.addRange(r);
  });
  const addRow = (after: number) => {
    const key = newRow();
    values.current.splice(after + 1, 0, "");
    setRows((rs) => { const n = [...rs]; n.splice(after + 1, 0, key); return n; });
    emit(); lastFocus.current = key; focusEnd(key);
  };
  // a tap on a food: into the step where the cursor is, else at the end of the last step used
  const put = (item: Ingredient) => {
    const sel = window.getSelection();
    let key = lastFocus.current && rows.includes(lastFocus.current) ? lastFocus.current : rows[rows.length - 1];
    let el = els.current.get(key)!;
    let range: Range | null = null;
    if (sel && sel.rangeCount) {
      const r = sel.getRangeAt(0);
      const host = [...els.current.entries()].find(([, e]) => e.contains(r.startContainer));
      if (host) { key = host[0]; el = host[1]; range = r; }
    }
    if (!range) { range = document.createRange(); range.selectNodeContents(el); range.collapse(false); }
    const holder = document.createElement("span");
    const parts = stepParts(tokenOf(item), items)[0] as { id: string; name: string; label: string; gone: boolean };
    holder.innerHTML = chipHtml(parts.id, parts.name, parts.label, parts.gone);
    const chip = holder.firstChild!;
    range.deleteContents();
    const before = range.startContainer.nodeType === Node.TEXT_NODE ? (range.startContainer.textContent ?? "").slice(0, range.startOffset) : "";
    if (before && !/\s$/.test(before)) range.insertNode(document.createTextNode(" "));
    range.collapse(false);
    range.insertNode(chip);
    const space = document.createTextNode(" ");
    chip.parentNode!.insertBefore(space, chip.nextSibling);
    const after = document.createRange(); after.setStartAfter(space); after.collapse(true);
    sel?.removeAllRanges(); sel?.addRange(after);
    el.focus();
    lastFocus.current = key;
    read(key);
  };
  // 0.3.134 (Coach Milan 11 November 20:55; a tester put bread in a step by mistake and the phone's keyboard could not take
  // it out): a tap on a food that is in a step takes it out again, from the step where the cursor is, else the last one with it
  const takeOut = (item: Ingredient) => {
    const has = (key: string) => !!els.current.get(key)?.querySelector(`[data-item="${CSS.escape(item.id)}"]`);
    const key = lastFocus.current && rows.includes(lastFocus.current) && has(lastFocus.current) ? lastFocus.current : [...rows].reverse().find(has);
    const el = key ? els.current.get(key) : null; if (!key || !el) return;
    const chips = el.querySelectorAll(`[data-item="${CSS.escape(item.id)}"]`), chip = chips[chips.length - 1] as HTMLElement;
    const next = chip.nextSibling; if (next && next.nodeType === Node.TEXT_NODE && /^ /.test(next.textContent ?? "")) next.textContent = (next.textContent ?? "").slice(1);
    chip.remove();
    lastFocus.current = key;
    read(key);
  };
  useEffect(() => () => { els.current.clear(); }, []);
  const used = usedIds(values.current);
  const missing = missingFoods(values.current, items);
  // DT83 fix (Milan 21:56): a food taken out of the recipe and still named in a step is said, so the steps don't keep it
  const gone = [...new Set(values.current.flatMap((x) => stepParts(x, items).filter((p): p is Extract<typeof p, { gone: boolean }> => "gone" in p && p.gone).map((p) => p.name)))];
  return (
    <div className="st">
      {rows.map((key, k) => (
        <div className="st-row" key={key}>
          <span className="st-n">{k + 1}</span>
          <div className="st-field" role="textbox" aria-label={w("steps.stepN", { n: k + 1 })} aria-multiline="false" contentEditable suppressContentEditableWarning
            ref={(el) => fill(key, el)} onFocus={() => { lastFocus.current = key; }} onInput={() => read(key)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRow(k); } }}
            onPaste={(e) => { e.preventDefault(); document.execCommand("insertText", false, e.clipboardData.getData("text/plain").replace(/\s*\n\s*/g, " ")); }}
            data-placeholder={k === 0 ? w("steps.whiskTheEggsWithThe") : ""} />
        </div>
      ))}
      <button type="button" className="link st-add" onClick={() => addRow(rows.length - 1)}>{w("steps.addAStep")}</button>
      {shown.length > 0 && (
        <div className="st-foods">
          <small>{w("steps.tapAFoodToPut")}</small>
          <div className="st-chips">
            {shown.map((i) => (
              <button type="button" key={i.id} className={`st-chip${used.has(i.id) ? " used" : ""}`} onMouseDown={(e) => e.preventDefault()} onClick={() => (used.has(i.id) ? takeOut(i) : put(i))}
                aria-label={used.has(i.id) ? w("steps.takeOutAria", { food: i.food.name }) : w("steps.putAria", { amount: amountOf(i.grams), food: i.food.name })}>{used.has(i.id) ? "✓" : "+"} {/* 0.3.134 (Coach Milan 11 November 20:53): counted foods as the step writes them */}{countOf(i) ? amountFor(i.id, i.food.name, [i]) : `${amountOf(i.grams)} ${i.food.name}`}</button>
            ))}
          </div>
        </div>
      )}
      {gone.length > 0 && <p className="st-note warn">{wn("steps.goneInStep", gone.length, { foods: gone.join(", ") })}</p>}
      {missing.length > 0
        ? <p className="st-note warn">{wn("steps.notInAnyStep", missing.length, { foods: missing.map((i) => i.food.name).join(", ") })}</p>
        : used.size > 0 && gone.length === 0 && <p className="st-note ok">{w("steps.everyFoodInStep")}</p>}
    </div>
  );
}
