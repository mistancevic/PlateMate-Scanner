// IM21, IM21b (0.2.21), RP2 (0.2.25): the Nutrition table, worked out by code from the foods and their grams. Shared by the
// recipe page and, since R6 (0.2.43, board RS14), the read card on the Plate and on Recipes.
import { aggregate } from "../pilot";
import { Letters, NumbersTable } from "./Letters";
import type { Ingredient, Meal } from "../pilot";
import { fmt } from "../ui";
import { nutritionOf, byPart } from "../nutrition";

// IM21, IM21b: Nutrition, worked out by code from the foods and their grams, in the EU label order; exact counts (All 2)
export function NutritionCard({ items, serves, one, all, stated, pdRef, fitPd, readoutOnly, tableOnly, rates }: { rates?: import("../letters").Rates | null; items: Ingredient[]; serves: number; one: string; all: string; stated: Meal["stated"] | null; pdRef: number | null; fitPd?: (pd: number | null) => string; readoutOnly?: boolean; tableOnly?: boolean }) {
  const n = nutritionOf(items, serves);
  if (!n) return null;
  const many = serves > 1;
  const v = (x: number | null, unit: string, d: number) => (x === null ? "?" : unit === "kcal" ? `${fmt(x, 0)} kcal` : `${fmt(x, d)} g`);
  const parts = byPart(items, serves);
  const energy = n.rows[0].serving;
  const pdS = stated && stated.kcal > 0 ? (100 * stated.protein) / stated.kcal : null;
  const diff = stated && energy ? Math.round(((energy - stated.kcal) / stated.kcal) * 100) : null;
  const missing = [...new Set(n.rows.flatMap((r) => r.missing))];
  // RP2 (0.2.25): what each column weighs, and PD above the table, as on the Plate
  const grams = items.filter((i) => i.grams > 0).reduce((k, i) => k + i.grams, 0);
  const prot = n.rows.find((r) => r.key === "protein");
  const pd1 = n.pd === null ? null : Math.round(n.pd * 10) / 10;
  const w = (g: number) => <span className="nt-w">{fmt(g, 0)} g</span>;
  return (<>
    {/* R6 (0.2.43): on the read card the table stands alone; the card has its own PD line */}
    {!tableOnly && <section className={`readout readout-fit-${fitPd ? fitPd(n.pd) : "plan"} rq-readout`} aria-label="Protein density">
      <div className="readout-top"><span>{many ? `One ${one}` : "All of it"}</span><span>PD</span></div>
      <div className="readout-mid">
        <b>{pd1 === null ? "?" : pd1.toFixed(1)}</b>
        <div><span>{pd1 === null || pdRef === null ? "no target set" : n.pd! >= pdRef ? "fits your plan" : `${(Math.round((pdRef - n.pd!) * 10) / 10).toFixed(1)} under your ${pdRef.toFixed(1)}`}</span>
          <small>{energy === null ? "?" : fmt(many ? energy : n.rows[0].all ?? 0, 0)} kcal · {fmt((many ? prot?.serving : prot?.all) ?? 0, 1)} g protein · {fmt(grams / (many ? serves : 1), 0)} g</small></div>
      </div>
      {/* DT113 (0.2.94): the four letters, the same for one portion or all of it (they are rates) */}
      {rates && (() => { const t = aggregate(items); return t.calories ? <Letters n={{ calories: t.calories, protein: t.protein, fats: t.fats, carbs: t.carbs, fiber: t.fiber }} rates={rates} who="this recipe" table={<NumbersTable n={{ calories: t.calories, protein: t.protein, fats: t.fats, carbs: t.carbs, fiber: t.fiber }} rates={rates} weight={t.weight ?? null} day={null} plan={null} />} /> : null; })()}
    </section>}
    {/* editing: the readout follows as you type; the table comes back with Save */}
    {!readoutOnly && <section className="card nt-card" aria-label="Nutrition">
      <b>Nutrition</b>
      <div className={`nt-row nt-th ${many ? "" : "nt-two"}`}><span />{many && <b>1 {one.toUpperCase()}{w(grams / serves)}</b>}<small>{many ? `ALL ${serves % 1 === 0 ? serves : fmt(serves, 1)}` : "ALL"}{w(grams)}</small><small>100 G</small></div>
      {n.rows.map((r) => (
        <div className={`nt-row ${r.sub ? "nt-sub" : ""} ${many ? "" : "nt-two"}`} key={r.key}>
          <span>{r.label}</span>
          {many && <b>{v(r.serving, r.unit, 1)}</b>}
          <small>{v(r.all, r.unit, 0)}</small>
          <small>{v(r.per100, r.unit, 1)}</small>
        </div>
      ))}
      {missing.length > 0 && <small className="muted">? : no value for {missing.join(", ")}. Add it on the food and the table follows.</small>}
      {parts.length > 1 && (
        <div className="nt-parts-box">
          <b>By part{many ? `, 1 ${one}` : ""}</b>
          <div className="nt-parts nt-th"><span /><b>KCAL</b><b>PROTEIN</b><b>PD</b></div>
          {parts.map((pt) => <div className="nt-parts" key={pt.part}><span>{pt.part}</span><b>{fmt(pt.kcal, 0)}</b><b>{fmt(pt.protein, 1)} g</b><b>{pt.pd === null ? "?" : (Math.round(pt.pd * 10) / 10).toFixed(1)}</b></div>)}
        </div>
      )}
      {stated && (
        <small className="nt-says">The recipe says, per {one}: {fmt(stated.kcal, 0)} kcal{stated.fats !== null ? ` · ${fmt(stated.fats, 1)} g fat` : ""}{stated.carbs !== null ? ` · ${fmt(stated.carbs, 1)} g carbohydrate` : ""} · {fmt(stated.protein, 1)} g protein{pdS !== null ? ` · PD ${fmt(pdS, 1)}` : ""}.{diff !== null && Math.abs(diff) > 15 ? ` Ours is ${Math.abs(diff)}% ${diff > 0 ? "higher" : "lower"} in energy: the recipe may use other products.` : " Ours agrees."}{n.rows.some((r) => r.key === "polyols") && stated.carbs !== null ? " Its carbohydrate may leave out the sweetener's polyols." : ""}</small>
      )}
      <small className="muted">From the foods and their grams; each value is the food's label or a typical value, marked estimate.{many ? " The plate rounds each food to the gram, so one serving there can read a little apart." : ""}</small>
    </section>}
  </>);
}
