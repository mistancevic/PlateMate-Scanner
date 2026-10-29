// DT151 (0.2.133, board Stories103 version 11; Coach Milan 29 October 09:41 to 12:04): Explorer, Not all proteins are equal.
// DT154 (0.2.135, board Stories106; Milan 14:47 to 15:04): Fats, the same template; family chips at the top.
// DT155 (0.2.136, board Stories107; Milan 15:30 and 15:41): Carbs, the same template.
// DT156 (0.3.0, board Stories108; Milan 16:16 to 16:27): a seventh section on every card, What a label could say, by EU rules.
// DT158 and DT159 (0.3.2, boards Stories110 and Stories111; Milan 16:16 to 18:22): Micros, against the day; By food or By member,
// and a member's own page, Vitamin D and Vitamin C first. The numbers and their sources: src/explorerMicros.ts.
// Every card tells the same story in six sections: a heading, the goal of the section and what this portion does against
// it, then the details; every measure in one pattern, the name, the bar, the grams. The numbers and their sources: src/explorer.ts.
import { useMemo, useState } from "react";
import type { AppApi } from "./api";
import { EXPLORER_FOODS, NINE, EAA_MEAL, LEUCINE_MEAL, SCALE_G, cardOf, type ExplorerCard } from "../explorer";
import { FAT_FOODS, FAT_MEMBERS, FAT_SCALE_G, EPA_DHA_DAY, SAT_SHARE, fatCardOf, type FatCard } from "../explorerFats";
import { proteinClaims, fatClaims, carbClaims, CLAIMS_SOURCE, type Claim } from "../euClaims";
import { CARB_FOODS, CARB_MEMBERS, CARB_SCALE_G, FIBRE_DAY, GI_LOW, GI_HIGH, carbCardOf, type CarbCard } from "../explorerCarbs";
import { MICRO_FOODS, MICRO_MEMBERS, MICRO_GROUPS, MICRO_SCALE, EFSA_D, MEMBER_PAGES, CLAIMS_HEALTH_SOURCE, microCardOf, memberDay, memberRows, lowerName, fmtAmount, type MicroCard, type MicroId, type MemberPage } from "../explorerMicros";
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
// over: a limit gone over (saturated fat), red; under: a member of a member, indented
// sub: a second line under the name (DT159: the portion and the form)
function Row({ name, value, frac, need, ok, strong, low, over, under, sub }: { name: string; value: string; frac: number; need?: boolean; ok?: boolean; strong?: boolean; low?: boolean; over?: boolean; under?: boolean; sub?: string }) {
  return (
    <div className={`ex-row${strong ? " ex-strong" : ""}${low ? " ex-low" : ""}${ok ? " ex-ok" : ""}${over ? " ex-over" : ""}${under ? " ex-under" : ""}`}>
      <small className="ex-name">{name}{sub && <span className="ex-sub">{sub}</span>}</small>
      <span className="ex-bar" aria-hidden="true"><i style={{ width: `${Math.max(Math.min(frac, 1) * 100, 1.5)}%` }} />{need && <i className="ex-need" />}</span>
      <small className="ex-val">{value}</small>
    </div>
  );
}
function Pair({ name, value }: { name: string; value: string }) {
  return <div className="ex-row ex-pair"><small className="ex-name">{name}</small><small className="ex-val">{value}</small></div>;
}
const g = (v: number) => v.toFixed(2);
// DT156: what a pack of this food could claim, by EU rules: the claims it meets, then each with Yes or No, the rule and its number
function Claims({ claims }: { claims: Claim[] }) {
  const yes = claims.filter((c) => c.ok).map((c) => c.claim);
  const health = claims.some((c) => c.health);
  return (
    <>
      <Head title="What a label could say" goal={`By EU rules, a food may only claim these when it meets them per 100 g. ${yes.length ? `This one could say: ${yes.join(", ")}.` : "This one could claim none of them."}`} />
      {claims.map((c) => (
        <div key={c.claim} className={`ex-claim${c.ok ? " ex-claim-ok" : ""}`}>
          <div><b>{c.claim}</b><b className="ex-claim-yes">{c.status ?? (c.ok ? "✓ Yes" : "No")}</b></div>
          <small>{c.health ? "A health claim: oat beta-glucan contributes to normal blood cholesterol. " : ""}Needs {c.rule}. This food: {c.is}.</small>
        </div>
      ))}
      <small className="ex-src ex-claim-src">{CLAIMS_SOURCE}{health ? " Health claim: Regulation (EU) No 432/2012." : ""}</small>
    </>
  );
}
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
      <Head title="The family members: nine essential amino acids" goal={`Nine members of the protein family your body can't make, so food must bring them. ${!c.lowest ? "This portion brings all nine, each with room to spare." : c.lowest.cover < 1 ? `This portion brings all nine, but its lowest, ${c.lowest.name.toLowerCase()}, falls just short of the need per gram: that is what a partner tops up.` : `This portion brings all nine, its lowest only just: ${c.lowest.name.toLowerCase()}.`} Grams, on the same scale for every food.`} />
      {NINE.map(({ id, name }) => { const low = c.lowest?.id === id; return <Row key={id} name={`${name}${low ? " · its lowest" : ""}`} value={`${g(c.family[id])} g`} frac={c.family[id] / SCALE_G} strong={id === "leu"} low={low} />; })}
      <Head title="Quality" goal="Two scores for how well a protein covers the nine, once digested. 1.00 or more means complete. Scores vary by study: whey from 0.85 to 1.09 in the papers we read, so we take them from one." />
      {([["PDCAAS", f.pdcaas, "The older score, on many labels. It stops at 1.00."], ["DIAAS", f.diaas, "The newer score, digestion counted. As published."]] as const).map(([n, s, what]) => (
        <div key={n} className="ex-score"><b className="ex-score-name">{n}</b><b className="ex-score-val">{s ? s.value.toFixed(2) : "none yet"}</b><small>{what}<br /><span className="ex-src">{s ? s.src : "No score we could check in a paper yet."}</span></small></div>
      ))}
      <Claims claims={proteinClaims(f)} />
      <Head title="How to use it" goal="When and how this food serves you best." />
      <p className="ex-best"><b>Best use:</b> {f.best}</p>
      <p className="ex-line"><b>Completes it:</b> {f.pair}</p>
      <small className="ex-src ex-card-src">Source: {f.src}.</small>
    </section>
  );
}

type Family = "protein" | "fats" | "carbs" | "micros";
// the meal: the person's slots, the next one by the clock; its share of the day
function useMeal(p: AppApi) {
  const slots = useMemo(() => slotsOf(lifestyleOf(p.personal)), [p.personal]);
  const [slotId, setSlotId] = useState<string>(() => nextSlot(slots)?.id ?? slots[0]?.id ?? "");
  const day = p.numbersFor(new Date());
  const slot = slots.find((s) => s.id === slotId) ?? slots[0];
  const need = slot ? needOf(slots, slot, day ? { kcal: day.kcal, protein: day.protein } : null) : null;
  const share = need && day && day.kcal > 0 ? need.kcal / day.kcal : null;
  const meal = (slot?.name ?? "meal").toLowerCase();
  const chips = slots.length > 0 && <div className="moments ex-chips" role="radiogroup" aria-label="Which meal">{slots.map((s) => <button key={s.id} role="radio" aria-checked={s.id === slot?.id} className={`choice ${s.id === slot?.id ? "on" : ""}`} onClick={() => setSlotId(s.id)}>{s.name}</button>)}</div>;
  return { day, need, share, meal, chips };
}
function Book({ line }: { line: string }) {
  return (
    <section className="card ex-book">
      <img src="/books/worthy-numbers-cover.webp" alt="Worthy Numbers, the cover" />
      <div><b>The why behind these numbers</b><small>{line}</small>
        <a className="pill pill-small pill-primary" href="/worthy-numbers?from=ex">Read the book</a></div>
    </section>
  );
}

export function ExplorerScreen(p: AppApi) {
  const [family, setFamily] = useState<Family>("protein");
  return (
    <div className="explorer">
      {/* DT154, DT155: the families, Protein first */}
      <div className="moments ex-chips ex-families" role="radiogroup" aria-label="Which family">
        <button role="radio" aria-checked={family === "protein"} className={`choice ${family === "protein" ? "on" : ""}`} onClick={() => setFamily("protein")}>Protein</button>
        <button role="radio" aria-checked={family === "fats"} className={`choice ${family === "fats" ? "on" : ""}`} onClick={() => setFamily("fats")}>Fats</button>
        <button role="radio" aria-checked={family === "carbs"} className={`choice ${family === "carbs" ? "on" : ""}`} onClick={() => setFamily("carbs")}>Carbs</button>
        <button role="radio" aria-checked={family === "micros"} className={`choice ${family === "micros" ? "on" : ""}`} onClick={() => setFamily("micros")}>Micros</button>
      </div>
      {family === "protein" ? <ProteinPage {...p} /> : family === "fats" ? <FatsPage {...p} /> : family === "carbs" ? <CarbsPage {...p} /> : <MicrosPage {...p} />}
    </div>
  );
}

function ProteinPage(p: AppApi) {
  const { day, need, meal, chips } = useMeal(p);
  const [sort, setSort] = useState<"pd" | "meal">("pd");
  const mealP = need?.protein && need.protein > 0 ? need.protein : FALLBACK_MEAL;
  const cards = EXPLORER_FOODS.map((f) => cardOf(f, mealP)).sort((a, b) => (sort === "pd" ? b.pd - a.pd : b.protein - a.protein));
  return (
    <>
      <h2 className="ex-h">Not all proteins are equal</h2>
      <p className="ex-intro">Protein is the family. Its members are the amino acids: leucine, lysine, methionine and six more your body can't make. Each food brings them in its own mix. Nobody eats one food all day, so each food here is one portion against one meal: how much of the meal it closes, and which members it brings.</p>
      {chips}
      <small className="ex-meal">{need ? `Your ${meal}: about ${mealP} g of protein, from your ${day!.protein} g a day.` : `Set your goal under Me to see your own meals. Until then, a meal of ${FALLBACK_MEAL} g of protein.`}</small>
      <div className="moments ex-chips" role="radiogroup" aria-label="Order">
        <button role="radio" aria-checked={sort === "pd"} className={`choice ${sort === "pd" ? "on" : ""}`} onClick={() => setSort("pd")}>By PD</button>
        <button role="radio" aria-checked={sort === "meal"} className={`choice ${sort === "meal" ? "on" : ""}`} onClick={() => setSort("meal")}>Most of the meal</button>
      </div>
      {cards.map((c) => <Card key={c.food.id} c={c} meal={meal} mealP={mealP} target={p.pdRef} />)}
      <Book line="Worthy Numbers, the free book: PD, protein quality and the label, in eleven short pages." />
      <p className="ex-sources">Sources. Amino acids, protein and energy: USDA FoodData Central, the row named on each card; whey from a typical label, with Hamarsland 2017 (BMC Nutrition) for cysteine and tyrosine. Need per gram of protein: WHO, FAO and UNU 2007, adults. {LEUCINE_MEAL} g of leucine and about {EAA_MEAL} g of essential amino acids a meal: the amounts research most often cites for muscle protein synthesis. PDCAAS (adult pattern) and DIAAS (as published, a young child's needs, so plant foods score lower than they would for an adult): Hertzler 2020 (Nutrients 12:3704, Table 2). DIAAS varies by study: whey 0.85 in Herreman 2020, 0.90 in Hertzler 2020, 1.09 in Phillips 2017. Egg, chicken and salmon: no score we could check in a paper yet. Educational, approximate, not medical advice.</p>
    </>
  );
}

function FatCardView({ c, meal, mealFat, target }: { c: FatCard; meal: string; mealFat: number; target: number | null }) {
  const f = c.food, over = c.sat > c.satMeal, covers = c.epaDha >= EPA_DHA_DAY;
  return (
    <section className="card ex-card" aria-label={f.name}>
      <div className="ex-title"><span className="ex-icon" aria-hidden="true">{f.icon}</span><b>{f.name}</b><span className={`pdpill pdpill-${target === null || c.pd >= target ? "high" : "low"}`}>PD {c.pd.toFixed(1)}</span></div>
      <Head title="One portion" goal={`Every number below is for one normal portion. ${f.fat} g of every 100 g is fat.`} />
      <Pair name="Portion" value={f.portion.label} />
      <Pair name="Per 100 g" value={`${f.fat} g fat, ${f.kcal} kcal`} />
      <Head title={`Fat for your ${meal}`} goal={`Your ${meal} has room for about ${mealFat} g of fat. This portion brings ${c.closes} % of it.`} />
      <Row name="Fat" value={`${c.fat} of ${mealFat} g`} frac={c.closes / 100 / NEED_AT} need />
      <Head title="Heart health" goal={`Two numbers matter most: saturated fat, under ${SAT_SHARE * 100} % of your energy, so about ${c.satMeal} g a ${meal}; and the omega-3 fats EPA and DHA, about ${EPA_DHA_DAY} mg a day. ${over ? "This portion goes over the saturated share." : covers ? "This portion stays under the saturated share and covers the omega-3." : "This portion stays under the saturated share."}`} />
      <Row name="Saturated fat" value={`${c.sat} of ${c.satMeal} g`} frac={c.sat / c.satMeal / NEED_AT} need over={over} />
      <Row name="Omega-3, EPA + DHA" value={`${c.epaDha.toLocaleString("en-GB")} of ${EPA_DHA_DAY} mg`} frac={c.epaDha / EPA_DHA_DAY / NEED_AT} need ok={covers} />
      <Head title="The family members" goal={`Three kinds of fat, and among the polyunsaturated the omega-6 and omega-3 your body can't make. This portion is mostly ${c.mostly}. Grams, on the same scale for every food.`} />
      {FAT_MEMBERS.map(({ id, name, under }) => { const v = c.members[id]; return <Row key={id} name={name} value={v === null ? "not reported" : `${g(v)} g`} frac={(v ?? 0) / FAT_SCALE_G} strong={id === "omega3"} under={under} />; })}
      <Head title="Quality" goal="Two ratios people use to judge a fat, calculated from the food table. Unsaturated to saturated: the higher, the better. Omega-6 to omega-3: the lower, the more omega-3 it brings." />
      <div className="ex-score"><b className="ex-ratio-name">Unsaturated : saturated</b><b className="ex-score-val">{c.unsatToSat} : 1</b></div>
      <div className="ex-score"><b className="ex-ratio-name">Omega-6 : omega-3</b><b className="ex-score-val">{c.omega6To3 === null ? "almost no omega-3" : `${c.omega6To3} : 1`}</b></div>
      <Claims claims={fatClaims(f)} />
      <Head title="How to use it" goal="When and how this food serves you best." />
      <p className="ex-best"><b>Best use:</b> {f.best}</p>
      <p className="ex-line"><b>Pairs with:</b> {f.pair}</p>
      <small className="ex-src ex-card-src">Source: {f.src}.</small>
    </section>
  );
}

function FatsPage(p: AppApi) {
  const { day, share, meal, chips } = useMeal(p);
  const [sort, setSort] = useState<"quality" | "meal">("quality");
  // the meal's share of the day's fat and energy, as the plan shares them; without a goal, a meal of 25 g and 700 kcal
  const mealFat = day && share ? Math.round(day.fats * share) : 25, mealKcal = day && share ? Math.round(day.kcal * share) : 700;
  const cards = FAT_FOODS.map((f) => fatCardOf(f, mealFat, mealKcal)).sort((a, b) => (sort === "quality" ? b.unsatToSat - a.unsatToSat : b.fat - a.fat));
  return (
    <>
      <h2 className="ex-h">Not all fats are equal</h2>
      <p className="ex-intro">Fat is the family. Its members are saturated, monounsaturated and polyunsaturated fats, and among the polyunsaturated the omega-6 and omega-3 your body can't make. Each food brings them in its own mix. Each food here is one portion against one meal: how much of the meal's fat it brings, and which members.</p>
      {chips}
      <small className="ex-meal">{day && share ? `Your ${meal}: about ${mealFat} g of fat and ${mealKcal.toLocaleString("en-GB")} kcal, from your ${day.fats} g and ${day.kcal.toLocaleString("en-GB")} kcal a day.` : `Set your goal under Me to see your own meals. Until then, a meal of ${mealFat} g of fat and ${mealKcal} kcal.`}</small>
      <div className="moments ex-chips" role="radiogroup" aria-label="Order">
        <button role="radio" aria-checked={sort === "quality"} className={`choice ${sort === "quality" ? "on" : ""}`} onClick={() => setSort("quality")}>Best fat quality</button>
        <button role="radio" aria-checked={sort === "meal"} className={`choice ${sort === "meal" ? "on" : ""}`} onClick={() => setSort("meal")}>Most of the meal</button>
      </div>
      {cards.map((c) => <FatCardView key={c.food.id} c={c} meal={meal} mealFat={mealFat} target={p.pdRef} />)}
      <Book line="Worthy Numbers, the free book: the numbers on food labels, and which ones help you decide, in eleven short pages." />
      <p className="ex-sources">Sources. Fats per 100 g: USDA FoodData Central, SR Legacy, the row named on each card. Omega-3 is 18:3 as USDA reports it, plus EPA, DPA and DHA; omega-6 is linoleic acid. Saturated fat under {SAT_SHARE * 100} % of energy: WHO 2023, Saturated fatty acid and trans-fatty acid intake for adults and children. EPA and DHA, {EPA_DHA_DAY} mg a day for adults: EFSA, Dietary Reference Values, summary report 2017. Educational, approximate, not medical advice.</p>
    </>
  );
}

function CarbCardView({ c, meal, mealCarb, target }: { c: CarbCard; meal: string; mealCarb: number; target: number | null }) {
  const f = c.food, fibreOk = c.fibre >= c.fibreMeal;
  return (
    <section className="card ex-card" aria-label={f.name}>
      <div className="ex-title"><span className="ex-icon" aria-hidden="true">{f.icon}</span><b>{f.name}</b><span className={`pdpill pdpill-${target === null || c.pd >= target ? "high" : "low"}`}>PD {c.pd.toFixed(1)}</span></div>
      <Head title="One portion" goal={`Every number below is for one normal portion. ${f.carb} g of every 100 g is carbohydrate.`} />
      <Pair name="Portion" value={f.portion.label} />
      <Pair name="Per 100 g" value={`${f.carb} g carbs, ${f.kcal} kcal`} />
      <Head title={`Carbs for your ${meal}`} goal={`Your ${meal} has room for about ${mealCarb} g of carbs. This portion brings ${c.closes} % of it.`} />
      <Row name="Carbs" value={`${c.carb} of ${mealCarb} g`} frac={c.closes / 100 / NEED_AT} need />
      <Head title="Fibre and sugar" goal={`A day needs at least ${FIBRE_DAY} g of fibre, so about ${c.fibreMeal} g a ${meal}; free sugars stay under 10 % of your energy, and the sugar inside whole fruit doesn't count as free. ${fibreOk ? "This portion covers the fibre." : "This portion brings part of the fibre."}`} />
      <Row name="Fibre" value={`${c.fibre} of ${c.fibreMeal} g`} frac={c.fibre / c.fibreMeal / NEED_AT} need ok={fibreOk} />
      <Row name="Sugars" value={`${c.sugar} g`} frac={c.sugar / CARB_SCALE_G} />
      <Head title="The family members" goal={`Starch, sugars and fibre, and fibre comes in two kinds. Soluble fibre forms a gel and slows digestion, so the sugar comes later; insoluble fibre adds bulk and keeps digestion moving. ${!f.split ? "Oats are known for beta-glucan, a soluble fibre; the split for dry oats isn't measured the way the others are." : f.split.noneFound ? "This one: no soluble fibre found, all of it insoluble." : `This one: ${Math.round((c.solubleShare ?? 0) * 100)} % of its fibre is soluble.`} This portion is mostly ${c.mostly}. Grams, on the same scale for every food.`} />
      {CARB_MEMBERS.map(({ id, name, under }) => { const v = c.members[id]; if (v === null) return id === "soluble" ? <div key={id} className="ex-row ex-under ex-note"><small className="ex-name">of it, soluble and insoluble: no measure we can use for dry oats</small></div> : null; return <Row key={id} name={name} value={`${g(v)} g`} frac={v / CARB_SCALE_G} strong={id === "fibre"} under={under} />; })}
      <Head title="Quality" goal={`How fast the carbs reach your blood. GI: ${GI_LOW} or less is low, ${GI_HIGH} or more is high. GL counts the portion: GI times its carbs without fibre, divided by 100.`} />
      <div className="ex-score"><b className="ex-score-name">GI</b><b className="ex-score-val">{f.gi}, {c.band}</b><small>Atkinson 2008, Table 1: {f.giRow}</small></div>
      <div className="ex-score"><b className="ex-score-name">GL</b><b className="ex-score-val">{c.gl}</b><small>For this portion, calculated by the same paper's method</small></div>
      <Claims claims={carbClaims(f)} />
      <Head title="How to use it" goal="When and how this food serves you best." />
      <p className="ex-best"><b>Best use:</b> {f.best}</p>
      <p className="ex-line"><b>Pairs with:</b> {f.pair}</p>
      <small className="ex-src ex-card-src">Source: {f.src}.{f.split && <><br />Soluble and insoluble: the share measured by Li, Andrews and Pehrsson 2002 (USDA), Table 1, {f.split.row}.</>}</small>
    </section>
  );
}

function CarbsPage(p: AppApi) {
  const { day, share, meal, chips } = useMeal(p);
  const [sort, setSort] = useState<"gi" | "meal">("gi");
  // the meal's share of the day's carbs, as the plan shares the day; without a goal, a meal of 80 g and a third of the day
  const mealCarb = day && share ? Math.round(day.carbs * share) : 80;
  const cards = CARB_FOODS.map((f) => carbCardOf(f, mealCarb, share ?? 1 / 3)).sort((a, b) => (sort === "gi" ? a.food.gi - b.food.gi : b.carb - a.carb));
  return (
    <>
      <h2 className="ex-h">Not all carbs are equal</h2>
      <p className="ex-intro">Carbohydrate is the family. Its members are starch, sugars and fibre. Each food brings them in its own mix, and they reach your blood at different speeds. Each food here is one portion against one meal: how much of the meal's carbs it brings, and which members.</p>
      {chips}
      <small className="ex-meal">{day && share ? `Your ${meal}: about ${mealCarb} g of carbs, from your ${day.carbs} g a day.` : `Set your goal under Me to see your own meals. Until then, a meal of ${mealCarb} g of carbs.`}</small>
      <div className="moments ex-chips" role="radiogroup" aria-label="Order">
        <button role="radio" aria-checked={sort === "gi"} className={`choice ${sort === "gi" ? "on" : ""}`} onClick={() => setSort("gi")}>Lowest GI</button>
        <button role="radio" aria-checked={sort === "meal"} className={`choice ${sort === "meal" ? "on" : ""}`} onClick={() => setSort("meal")}>Most of the meal</button>
      </div>
      {cards.map((c) => <CarbCardView key={c.food.id} c={c} meal={meal} mealCarb={mealCarb} target={p.pdRef} />)}
      <Book line="Worthy Numbers, the free book: GI and GL, PD and the label, in eleven short pages." />
      <p className="ex-sources">Sources. Carbs, fibre and sugars per 100 g: USDA FoodData Central, SR Legacy, the row named on each card; starch and other carbs is what remains, calculated. GI: Atkinson, Foster-Powell and Brand-Miller 2008, International Tables of Glycemic Index and Glycemic Load Values, Diabetes Care, Table 1, the mean of several studies; GL calculated by its method. Fibre, at least {FIBRE_DAY} g a day for adults: WHO 2023 carbohydrate guideline and EFSA. Free sugars under 10 % of energy: WHO 2015 sugars guideline. Educational, approximate, not medical advice.</p>
    </>
  );
}

// DT158: one portion against the day; every member against the label's reference intake, the line at the whole day
function MicroCardView({ c, target }: { c: MicroCard; target: number | null }) {
  const f = c.food, above = target !== null && c.pd >= target;
  const rowOf = (id: MicroId) => { const m = MICRO_MEMBERS.find((x) => x.id === id)!, s = c.share[id], a = c.amount[id];
    return <Row key={id} name={m.name} value={s === null || a === null ? "not reported" : `${fmtAmount(a, m.unit)} · ${s} %`} frac={(s ?? 0) / 100 / MICRO_SCALE} need ok={s !== null && s >= 100} />; };
  const says = c.claims.map((x) => (x.high ? "High in " : "Source of ") + lowerName(x.name));
  return (
    <section className="card ex-card" aria-label={f.name}>
      <div className="ex-title"><span className="ex-icon" aria-hidden="true">{f.icon}</span><b>{f.name}</b><span className={`pdpill pdpill-${above || target === null ? "high" : "low"}`}>PD {c.pd.toFixed(1)}</span></div>
      <Head title="One portion" goal="Every number below is for one normal portion." />
      <Pair name="Portion" value={f.portion.label} />
      <Pair name={f.drink ? "Per 100 ml" : "Per 100 g"} value={`${f.kcal} kcal, ${f.protein} g protein`} />
      <Head title="For your day" goal={`Vitamins and minerals count per day, not per meal. ${c.top.length ? `This portion brings at least a third of the day's ${c.top.map((id) => lowerName(MICRO_MEMBERS.find((m) => m.id === id)!.name)).join(", ")}.` : "This portion brings less than a third of the day of each."}`} />
      {c.top.map(rowOf)}
      <Head title="The family members" goal="Vitamins and minerals. Fat-soluble vitamins are stored and need some fat in the meal; water-soluble ones aren't stored, so you need them more often. Each bar is this portion against the EU reference intake on labels; the line is the whole day." />
      {MICRO_GROUPS.map((g) => <div key={g.id}><small className="ex-group">{g.name}</small>{MICRO_MEMBERS.filter((m) => m.group === g.id).map((m) => rowOf(m.id))}</div>)}
      {c.dEfsa !== null && c.dEfsa > 0 && <small className="ex-src ex-dnote">Vitamin D: the label's reference is 5 µg a day; EFSA sets {EFSA_D} µg for adults. Against EFSA, this portion brings {c.dEfsa} %.</small>}
      <Head title="What a label could say" goal={`By EU rules, a food may say it is a source of a vitamin or mineral with 15 % of the reference per 100 g${f.drink ? " (7.5 % per 100 ml for a drink)" : ""}, and high in it with twice that. ${says.length ? `This one could say: ${says.join(", ")}.` : "This one could claim none of them."}`} />
      <Head title="How to use it" goal="When and how this food serves you best." />
      <p className="ex-best"><b>Best use:</b> {f.best}</p>
      <p className="ex-line"><b>Pairs with:</b> {f.pair}</p>
      <small className="ex-src ex-card-src">Source: {f.src}.</small>
    </section>
  );
}

function MicrosPage(p: AppApi) {
  const [view, setView] = useState<"food" | "member">("food");
  const [open, setOpen] = useState<MicroId | null>(null);
  const page = MEMBER_PAGES.find((m) => m.id === open);
  const sex = p.personal?.sex ?? null;
  const viewChips = (
    <div className="moments ex-chips" role="radiogroup" aria-label="Start from">
      <button role="radio" aria-checked={view === "food"} className={`choice ${view === "food" ? "on" : ""}`} onClick={() => { setView("food"); setOpen(null); }}>By food</button>
      <button role="radio" aria-checked={view === "member"} className={`choice ${view === "member" ? "on" : ""}`} onClick={() => setView("member")}>By member</button>
    </div>
  );
  if (view === "member" && page) return <>{viewChips}<MemberView m={page} sex={sex} back={() => { setOpen(null); window.scrollTo(0, 0); }} /></>;
  if (view === "member") return (
    <>
      {viewChips}
      <h2 className="ex-h">The family members</h2>
      <p className="ex-intro">Start from a vitamin or mineral: what it is, what it does, how much a day, where to find it, and what to combine it with.</p>
      {MICRO_GROUPS.map((g) => (
        <div key={g.id} className="ex-members">
          <small className="ex-group">{g.name}</small>
          {MICRO_MEMBERS.filter((m) => m.group === g.id).map((m) => { const mp = MEMBER_PAGES.find((x) => x.id === m.id);
            return mp ? <button key={m.id} className="menu-row ex-member" onClick={() => { setOpen(m.id); window.scrollTo(0, 0); }}><b>{m.name}</b><small>your day {memberDay(mp, sex).v} {mp.unit}</small><span aria-hidden="true">›</span></button>
              : <div key={m.id} className="menu-row ex-member ex-member-next"><b>{m.name}</b><small>next</small></div>; })}
        </div>
      ))}
    </>
  );
  const cards = MICRO_FOODS.map(microCardOf).sort((a, b) => b.top.length - a.top.length);
  return (
    <>
      {viewChips}
      <h2 className="ex-h">Not all micros are equal</h2>
      <p className="ex-intro">Micronutrients are the family. Its members are the vitamins, fat-soluble and water-soluble, and the minerals. You need them in milligrams and micrograms, every day. Each food here is one portion against your day: which members it brings, and how much.</p>
      <small className="ex-meal">Against the EU reference intakes on labels, the same for every adult.</small>
      {cards.map((c) => <MicroCardView key={c.food.id} c={c} target={p.pdRef} />)}
      <p className="ex-sources">Sources. Vitamins and minerals per 100 g: USDA FoodData Central, the row named on each card. Reference intakes: Regulation (EU) No 1169/2011, Annex XIII, Part A. Source of and high in: 15 % of the reference per 100 g, 7.5 % per 100 ml for a drink, and twice that, Regulation (EC) No 1924/2006. Vitamin D for adults, {EFSA_D} µg: EFSA. Educational, approximate, not medical advice.</p>
    </>
  );
}

// DT159: a member's own page, the same sections as a card: a heading, what it is for, the details
function MemberView({ m, sex, back }: { m: MemberPage; sex: string | null; back: () => void }) {
  const day = memberDay(m, sex), rows = memberRows(m, day.v);
  const low = m.name.replace("Vitamin", "vitamin");
  return (
    <>
      <button className="ex-back" onClick={back}>‹ The family members</button>
      <h2 className="ex-h">{m.name}</h2>
      <section className="card ex-card ex-member-page" aria-label={m.name}>
        <div className="ex-head ex-head-first"><b>What it is</b><small>{m.is}</small></div>
        <Head title="What it does" goal={`What the EU allows a label to say, word for word. ${m.name} ...`} />
        {m.does.map((d) => <small key={d} className="ex-quote">{d}</small>)}
        <small className="ex-src ex-dnote">{CLAIMS_HEALTH_SOURCE} A food may say these only when it is at least a source of {low}.</small>
        {m.doesMore && <small className="ex-more"><b>More claims, in short.</b> {m.doesMore}</small>}
        <Head title="How much a day" goal={`Your day comes from EFSA${day.who === "adults" ? "" : `, for ${day.who === "men" ? "a man" : "a woman"}`}; the label's reference is the same for everyone. ${m.ul ? `Above ${m.ul.v} ${m.unit} a day is too much.` : "No upper limit is set."}`} />
        <div className="ex-row ex-pair ex-kv"><small className="ex-name">Your day<span className="ex-sub">{m.efsa.src}{day.who === "adults" ? "" : day.who === "men" ? `, men (${m.efsa.women} ${m.unit} for women)` : `, women (${m.efsa.men} ${m.unit} for men)`}</span></small><small className="ex-val">{day.v} {m.unit}</small></div>
        <div className="ex-row ex-pair ex-kv"><small className="ex-name">On labels<span className="ex-sub">EU reference intake, Regulation (EU) No 1169/2011</span></small><small className="ex-val">{m.label} {m.unit}</small></div>
        <div className="ex-row ex-pair ex-kv"><small className="ex-name">Upper limit<span className="ex-sub">{m.ul ? m.ul.note : m.ulNone}</span></small><small className="ex-val">{m.ul ? `${m.ul.v} ${m.unit}` : "none set"}</small></div>
        <Head title="Where to find it" goal={`One normal portion against your day, ${day.v} ${m.unit}. The line is the whole day; green when one portion covers it.`} />
        {rows.map(({ food, amount, share }) => <Row key={food.name} name={food.name} sub={`${food.portion}${food.form ? `, ${food.form}` : ""}`} value={`${fmtAmount(amount, m.unit)} · ${share} %`} frac={share / 100 / MICRO_SCALE} need ok={share >= 100} />)}
        <small className="ex-src ex-dnote">Source: USDA FoodData Central, {m.foods.map((f) => f.src).join("; ")}.</small>
        <Head title="Combine it with" goal="What helps your body use it, and why." />
        {m.combine.map((c) => <div key={c.with} className="ex-combine"><b>{c.with}</b><small>{c.why}</small></div>)}
        <Head title="Too much" goal={m.much} />
        <small className="ex-src ex-card-src">Sources. {m.sources} Educational, not medical advice.</small>
      </section>
    </>
  );
}
