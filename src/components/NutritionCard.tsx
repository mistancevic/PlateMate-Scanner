import { numbersOfTotals } from "../letters";
// IM21, IM21b (0.2.21), RP2 (0.2.25): the Nutrition table, worked out by code from the foods and their grams. Shared by the
// recipe page and, since R6 (0.2.43, board RS14), the read card on the Plate and on Recipes.
import { dec, w, wIn, wordV, type Val, type WordKey } from "../words";
import { aggregate } from "../pilot";
import { Letters, NumbersTable } from "./Letters";
import type { Ingredient, Meal } from "../pilot";
import { fmt, pdVal } from "../ui";
import { useState } from "react";
import { PdCard } from "./PdCard";
import { nutritionOf, byPart } from "../nutrition";
import { partName } from "../recipeWords";
// a line of its own as a value in another line, in that line's language (or null, and the whole line stays English)
const lineV = (k: WordKey, v?: Record<string, Val>): Val => (l) => wIn(l, k, v);

// IM21, IM21b: Nutrition, worked out by code from the foods and their grams, in the EU label order; exact counts (All 2)
export function NutritionCard({ items, serves, one, all, stated, pdRef, fitPd, readoutOnly, tableOnly, rates }: { rates?: import("../letters").Rates | null; items: Ingredient[]; serves: number; one: string; all: string; stated: Meal["stated"] | null; pdRef: number | null; fitPd?: (pd: number | null) => string; readoutOnly?: boolean; tableOnly?: boolean }) {
  const n = nutritionOf(items, serves);
  const [numbersOpen, setNumbersOpen] = useState(false);
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
  const gw = (g: number) => <span className="nt-w">{fmt(g, 0)} g</span>;
  return (<>
    {/* R6 (0.2.43): on the read card the table stands alone; the card has its own PD line */}
    {/* B168 and DT349 (board B168 and DT349, canvas Page 6): the card is the whole meal, as the recipe makes it, and it is the
        Plate's card, PdCard; the numbers open under it (design rule D14). One serving and 100 g stay in the table below. */}
    {!tableOnly && (() => { const t = aggregate(items); return (<>
      <PdCard className="rq-readout" label={w("nutrition.proteinDensity")} fit={fitPd ? fitPd(n.pd) : "plan"} pd={pd1}
        title={w("nutrition.wholeRecipe")}
        line={pd1 === null || pdRef === null ? w("nutrition.noTargetSet") : n.pd! >= pdRef ? w("nutrition.fitsYourPlan") : w("nutrition.underYour", { under: dec(Math.round((pdRef - n.pd!) * 10) / 10, 1), target: dec(pdRef, 1) })}
        kcal={n.rows[0].all} grams={grams} protein={prot?.all ?? null}
        scale={pdRef !== null && pd1 !== null ? { target: pdRef, title: w("plate.pdScaleTitle", { t: pdVal(pdRef), pd: pdVal(pd1) }) } : null}
        /* DT113 (0.2.94): the four letters, rates, the same for a serving or the whole meal */
        letters={rates && t.calories ? <Letters n={numbersOfTotals(t)} rates={rates} who={w("letters.thisRecipe")} open={numbersOpen} setOpen={setNumbersOpen} /> : null} />
      {rates && t.calories && numbersOpen ? <NumbersTable n={numbersOfTotals(t)} rates={rates} weight={t.weight ?? null} day={null} plan={null} /> : null}
    </>); })()}
    {/* editing: the readout follows as you type; the table comes back with Save */}
    {!readoutOnly && <section className="card nt-card" aria-label={w("nutrition.nutrition")}>
      <b>{w("nutrition.nutrition")}</b>
      <div className={`nt-row nt-th ${many ? "" : "nt-two"}`}><span />{many && <b>1 {one.toUpperCase()}{gw(grams / serves)}</b>}<small>{many ? w("nutrition.allN", { n: serves % 1 === 0 ? serves : fmt(serves, 1) }) : w("nutrition.all")}{gw(grams)}</small><small>{w("nutrition.per100Head")}</small></div>
      {n.rows.map((r) => (
        <div className={`nt-row ${r.sub ? "nt-sub" : ""} ${many ? "" : "nt-two"}`} key={r.key}>
          <span>{r.label}</span>
          {many && <b>{v(r.serving, r.unit, 1)}</b>}
          <small>{v(r.all, r.unit, 0)}</small>
          <small>{v(r.per100, r.unit, 1)}</small>
        </div>
      ))}
      {missing.length > 0 && <small className="muted">{w("nutrition.noValueFor", { list: missing.join(", ") })}</small>}
      {parts.length > 1 && (
        <div className="nt-parts-box">
          <b>{many ? w("nutrition.byPartOne", { one }) : w("nutrition.byPart")}</b>
          <div className="nt-parts nt-th"><span /><b>{w("nutrition.kcalHead")}</b><b>{w("nutrition.proteinHead")}</b><b>{w("nutrition.pd")}</b></div>
          {parts.map((pt) => <div className="nt-parts" key={pt.part}><span>{partName(pt.part)}</span><b>{fmt(pt.kcal, 0)}</b><b>{fmt(pt.protein, 1)} g</b><b>{pt.pd === null ? "?" : dec(Math.round(pt.pd * 10) / 10, 1)}</b></div>)}
        </div>
      )}
      {stated && (
        <small className="nt-says">{w("nutrition.recipeSays", { one, kcal: fmt(stated.kcal, 0), fat: stated.fats !== null ? lineV("nutrition.saysFat", { g: fmt(stated.fats, 1) }) : "", carbs: stated.carbs !== null ? lineV("nutrition.saysCarbs", { g: fmt(stated.carbs, 1) }) : "", protein: fmt(stated.protein, 1), pd: pdS !== null ? lineV("nutrition.saysPd", { pd: fmt(pdS, 1) }) : "" })}{` ${diff !== null && Math.abs(diff) > 15 ? w("nutrition.oursIsApart", { n: Math.abs(diff), way: wordV(diff > 0 ? "nutrition.higher" : "nutrition.lower") }) : w("nutrition.oursAgrees")}`}{n.rows.some((r) => r.key === "polyols") && stated.carbs !== null ? ` ${w("nutrition.polyols")}` : ""}</small>
      )}
      <small className="muted">{w("nutrition.fromTheFoods")}{many ? ` ${w("nutrition.plateRounds")}` : ""}</small>
    </section>}
  </>);
}
