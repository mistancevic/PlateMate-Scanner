// DT151 (0.2.133, board Stories103 version 11; Coach Milan 29 October 09:41 to 12:04): Explorer, Not all proteins are equal.
// Every card tells the same story in six sections: a heading, the goal of the section and what this portion does against
// it, then the details; every measure in one pattern, the name, the bar, the grams. The numbers and their sources: src/explorer.ts.
import { useMemo, useState } from "react";
import type { AppApi } from "./api";
import { EXPLORER_FOODS, NINE, EAA_MEAL, LEUCINE_MEAL, SCALE_G, cardOf, type ExplorerCard } from "../explorer";
import { lifestyleOf } from "../personal";
import { slotsOf } from "../slots";
import { needOf } from "../planned";
import { pdVal } from "../ui";

const FALLBACK_MEAL = 30;
// the slot of the next meal by the clock, as the chat picks it
function nextSlot<T extends { time: string }>(slots: T[]): T | undefined {
  const m = new Date().getHours() * 60 + new Date().getMinutes();
  return slots.find((x) => { const [h, mi] = x.time.split(":").map(Number); return h * 60 + mi + 90 >= m; }) ?? slots[slots.length - 1];
}

function Head({ title, goal }: { title: string; goal: string }) {
  return <div className="ex-head"><b>{title}</b><small>{goal}</small></div>;
}
// one pattern for every measure: the name, the bar, the grams; a line where the meal has a need, green when the portion covers it
function Row({ name, value, frac, need, ok, strong, low }: { name: string; value: string; frac: number; need?: boolean; ok?: boolean; strong?: boolean; low?: boolean }) {
  return (
    <div className={`ex-row${strong ? " ex-strong" : ""}${low ? " ex-low" : ""}${ok ? " ex-ok" : ""}`}>
      <small className="ex-name">{name}</small>
      <span className="ex-bar" aria-hidden="true"><i style={{ width: `${Math.max(Math.min(frac, 1) * 100, 1.5)}%` }} />{need && <i className="ex-need" />}</span>
      <small className="ex-val">{value}</small>
    </div>
  );
}
function Pair({ name, value }: { name: string; value: string }) {
  return <div className="ex-row ex-pair"><small className="ex-name">{name}</small><small className="ex-val">{value}</small></div>;
}
const g = (v: number) => v.toFixed(2);
const NEED_AT = 1.5; // the bars of a need run to 150 %, the line sits at 100 %

function Card({ c, meal, mealP, target }: { c: ExplorerCard; meal: string; mealP: number; target: number | null }) {
  const f = c.food, above = target !== null && c.pd >= target;
  const both = c.eaa >= EAA_MEAL && c.leucine >= LEUCINE_MEAL;
  return (
    <section className="card ex-card" aria-label={f.name}>
      <div className="ex-title"><span className="ex-icon" aria-hidden="true">{f.icon}</span><b>{f.name}</b><span className={`pdpill pdpill-${above || target === null ? "high" : "low"}`}>PD {c.pd.toFixed(1)}</span></div>
      <Head title="One portion" goal={`Every number below is for one normal portion. PD, protein per 100 kcal, is ${c.pd.toFixed(1)}${target === null ? "." : above ? `: above your ${pdVal(target)}, so one portion lifts a plate.` : `: below your ${pdVal(target)}, so it needs a partner richer in protein.`}`} />
      <Pair name="Portion" value={f.portion.label} />
      <Pair name="Per 100 g" value={`${f.protein} g protein, ${f.kcal} kcal`} />
      <Head title={`Protein for your ${meal}`} goal={`Your ${meal} needs about ${mealP} g of protein. This portion closes ${c.closes} % of it.`} />
      <Row name="Protein" value={`${c.protein} of ${mealP} g`} frac={c.closes / 100 / NEED_AT} need ok={c.closes >= 100} />
      <Head title="Muscle building and repair" goal={`A meal switches on muscle protein synthesis, how the body builds and repairs muscle, with about ${EAA_MEAL} g of essential amino acids, ${LEUCINE_MEAL} g of them leucine. ${both ? "This portion brings both." : c.eaa >= EAA_MEAL ? `This portion brings the ${EAA_MEAL} g, not yet the leucine.` : "This portion brings part of it."}`} />
      <Row name="Essential amino acids" value={`${c.eaa.toFixed(1)} of ${EAA_MEAL} g`} frac={c.eaa / EAA_MEAL / NEED_AT} need ok={c.eaa >= EAA_MEAL} />
      <Row name="of them, leucine" value={`${c.leucine.toFixed(1)} of ${LEUCINE_MEAL} g`} frac={c.leucine / LEUCINE_MEAL / NEED_AT} need ok={c.leucine >= LEUCINE_MEAL} strong />
      <Head title="The family: nine essential amino acids" goal={`Nine amino acids your body can't make, so food must bring them. ${c.lowest ? `This portion brings all nine, its lowest only just: ${c.lowest.name.toLowerCase()}.` : "This portion brings all nine, each with room to spare."} Grams, on the same scale for every food.`} />
      {NINE.map(({ id, name }) => { const low = c.lowest?.id === id; return <Row key={id} name={`${name}${low ? " · its lowest" : ""}`} value={`${g(c.family[id])} g`} frac={c.family[id] / SCALE_G} strong={id === "leu"} low={low} />; })}
      <Head title="Quality" goal="Two scores for how well a protein covers the nine, once digested. 1.00 or more means complete." />
      {([["PDCAAS", f.pdcaas, "The older score, on many labels. It stops at 1.00."], ["DIAAS", f.diaas, "The newer score, digestion counted. As published."]] as const).map(([n, s, what]) => (
        <div key={n} className="ex-score"><b className="ex-score-name">{n}</b><b className="ex-score-val">{s ? s.value.toFixed(2) : "none yet"}</b><small>{what}<br /><span className="ex-src">{s ? s.src : "No published figure in our sources."}</span></small></div>
      ))}
      <Head title="How to use it" goal="When and how this food serves you best." />
      <p className="ex-best"><b>Best use:</b> {f.best}</p>
      <p className="ex-line"><b>Completes it:</b> {f.pair}</p>
      <small className="ex-src ex-card-src">Source: {f.src}.</small>
    </section>
  );
}

export function ExplorerScreen(p: AppApi) {
  const slots = useMemo(() => slotsOf(lifestyleOf(p.personal)), [p.personal]);
  const [slotId, setSlotId] = useState<string>(() => nextSlot(slots)?.id ?? slots[0]?.id ?? "");
  const [sort, setSort] = useState<"pd" | "meal">("pd");
  const day = p.numbersFor(new Date());
  const slot = slots.find((s) => s.id === slotId) ?? slots[0];
  const need = slot ? needOf(slots, slot, day ? { kcal: day.kcal, protein: day.protein } : null) : null;
  const mealP = need?.protein && need.protein > 0 ? need.protein : FALLBACK_MEAL;
  const meal = (slot?.name ?? "meal").toLowerCase();
  const cards = EXPLORER_FOODS.map((f) => cardOf(f, mealP)).sort((a, b) => (sort === "pd" ? b.pd - a.pd : b.protein - a.protein));
  return (
    <div className="explorer">
      <h2 className="ex-h">Not all proteins are equal</h2>
      <p className="ex-intro">Protein is the surname. Its first names are the amino acids: leucine, lysine, methionine and six more your body can't make. Each food brings the family in its own mix. Nobody eats one food all day, so each food here is one portion against one meal: how much of the meal it closes, and which of the family it brings.</p>
      {slots.length > 0 && <div className="moments ex-chips" role="radiogroup" aria-label="Which meal">{slots.map((s) => <button key={s.id} role="radio" aria-checked={s.id === slot?.id} className={`choice ${s.id === slot?.id ? "on" : ""}`} onClick={() => setSlotId(s.id)}>{s.name}</button>)}</div>}
      <small className="ex-meal">{need ? `Your ${meal}: about ${mealP} g of protein, from your ${day!.protein} g a day.` : `Set your goal under Me to see your own meals. Until then, a meal of ${FALLBACK_MEAL} g of protein.`}</small>
      <div className="moments ex-chips" role="radiogroup" aria-label="Order">
        <button role="radio" aria-checked={sort === "pd"} className={`choice ${sort === "pd" ? "on" : ""}`} onClick={() => setSort("pd")}>By PD</button>
        <button role="radio" aria-checked={sort === "meal"} className={`choice ${sort === "meal" ? "on" : ""}`} onClick={() => setSort("meal")}>Most of the meal</button>
      </div>
      {cards.map((c) => <Card key={c.food.id} c={c} meal={meal} mealP={mealP} target={p.pdRef} />)}
      <section className="card ex-book">
        <img src="/books/worthy-numbers-cover.webp" alt="Worthy Numbers, the cover" />
        <div><b>The why behind these numbers</b><small>Worthy Numbers, the free book: PD, protein quality and the label, in eleven short pages.</small>
          <a className="pill pill-small pill-primary" href="/worthy-numbers?from=ex">Read the book</a></div>
      </section>
      <p className="ex-sources">Sources. Amino acids, protein and energy: USDA FoodData Central, the row named on each card; whey from a typical label, with Hamarsland 2017 (BMC Nutrition) for cysteine and tyrosine. Need per gram of protein: WHO, FAO and UNU 2007, adults. {LEUCINE_MEAL} g of leucine and about {EAA_MEAL} g of essential amino acids a meal: the amounts research most often cites for muscle protein synthesis. PDCAAS: Hertzler 2020 (Nutrients 12:3704, Table 2, adult pattern) and Boye 2012 (British Journal of Nutrition). DIAAS as published: Phillips 2017, Rutherfurd 2015, Ertl 2016, Hertzler 2020; these use a young child's needs, so plant foods score lower than they would for an adult. Educational, approximate, not medical advice. Carbs and Fats come next.</p>
    </div>
  );
}
