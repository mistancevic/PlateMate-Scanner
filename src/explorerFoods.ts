// DT164 (0.3.6, canvas Page 2, board Stories116; Coach Milan 29 October 21:37 to 22:35 Go): Foods, the fifth chip. Every food the
// Explorer knows, once, through every lens: its protein, its fats, its carbs, its vitamins and minerals, and what one portion does
// for the person's goal, from the numbers. Each food is one row of the shared food table (src/foodTable.ts), the same row every
// family page uses; the lenses run the families' own calculations on it.
import { FOOD_TABLE, type FoodRow } from "./foodTable";
import { cardOf, EAA_MEAL, LEUCINE_MEAL, type ExplorerFood } from "./explorer";
import { fatCardOf, EPA_DHA_DAY, SAT_SHARE, type FatFood } from "./explorerFats";
import { FIBRE_DAY, GI_LOW, GI_HIGH, CARB_FOODS } from "./explorerCarbs";
import { microCardOf, MICRO_MEMBERS, lowerName, type MicroFood, type MicroId } from "./explorerMicros";
import { proteinClaims, fatClaims, carbClaims } from "./euClaims";
import { microClaims } from "./explorerMicros";

export type Meal = { protein: number; fat: number; kcal: number; carb: number; share: number };   // the meal's share of the day
const r1 = (x: number) => Math.round(x * 10) / 10;
const asProtein = (f: FoodRow): ExplorerFood | null => (f.aa ? { id: f.id, icon: f.icon, name: f.name, kcal: f.kcal, protein: f.protein, portion: f.portion, aa: f.aa, pdcaas: null, diaas: null, src: f.src, best: "", pair: "" } : null);
const asFat = (f: FoodRow): FatFood | null => (f.fat === null || f.sfa === null ? null : { id: f.id, icon: f.icon, name: f.name, kcal: f.kcal, protein: f.protein, fat: f.fat, sfa: f.sfa, mufa: f.mufa ?? 0, pufa: f.pufa ?? 0, trans: f.trans, omega6: f.la ?? 0, ala: f.ala ?? 0, epa: f.epa ?? 0, dpa: f.dpa ?? 0, dha: f.dha ?? 0, portion: f.portion, src: f.src, best: "", pair: "" });
const asMicro = (f: FoodRow): MicroFood | null => (f.micro ? { id: f.id, icon: f.icon, name: f.name, kcal: f.kcal, protein: f.protein, portion: f.portion, drink: f.drink, v: f.micro, src: f.src, best: "", pair: "" } : null);

export type Lenses = {
  food: FoodRow; pd: number;
  protein: { g: number; closes: number; eaa: number | null; leucine: number | null; lowest: string | null };
  fats: { g: number; closes: number; sat: number; satMeal: number; mostly: string; epaDha: number } | null;
  carbs: { g: number; closes: number; fibre: number; fibreMeal: number; sugar: number; gi: number | null; band: "low" | "high" | "in between" | null } | null;
  micros: { id: MicroId; name: string; also?: string; amount: number; unit: string; share: number }[] | null;   // the three it brings most of
  claims: string[];
};
export function lensesOf(f: FoodRow, meal: Meal): Lenses {
  const k = f.portion.grams / 100, pd = r1((100 * f.protein) / f.kcal);
  const ef = asProtein(f), pc = ef ? cardOf(ef, meal.protein) : null;
  const protein = { g: r1(f.protein * k), closes: Math.round((100 * f.protein * k) / meal.protein), eaa: pc ? pc.eaa : null, leucine: pc ? pc.leucine : null, lowest: pc?.lowest ? pc.lowest.name : null };
  const ff = asFat(f), fc = ff ? fatCardOf(ff, meal.fat, meal.kcal) : null;
  const fats = fc ? { g: fc.fat, closes: fc.closes, sat: fc.sat, satMeal: fc.satMeal, mostly: fc.mostly, epaDha: fc.epaDha } : null;
  const gi = CARB_FOODS.find((c) => c.id === f.id);
  const carbs = f.carb === null ? null : { g: r1(f.carb * k), closes: Math.round((100 * f.carb * k) / meal.carb), fibre: r1((f.fibre ?? 0) * k), fibreMeal: r1(FIBRE_DAY * meal.share), sugar: r1((f.sugar ?? 0) * k), gi: gi ? gi.gi : null, band: gi ? (gi.gi <= GI_LOW ? "low" : gi.gi >= GI_HIGH ? "high" : "in between") : null } as Lenses["carbs"];
  const mf = asMicro(f), mc = mf ? microCardOf(mf) : null;
  const micros = mc ? MICRO_MEMBERS.filter((m) => (mc.share[m.id] ?? 0) > 0).sort((a, b) => mc.share[b.id]! - mc.share[a.id]!).slice(0, 3).map((m) => ({ id: m.id, name: m.name, also: m.also, amount: mc.amount[m.id]!, unit: m.unit, share: mc.share[m.id]! })) : null;
  const claims = [
    ...proteinClaims(f).filter((c) => c.ok).map((c) => c.claim),
    ...(ff ? fatClaims(ff).filter((c) => c.ok).map((c) => c.claim) : []),
    ...(f.carb !== null && f.fibre !== null && f.sugar !== null ? carbClaims({ kcal: f.kcal, fibre: f.fibre, sugar: f.sugar }).filter((c) => c.ok).map((c) => c.claim) : []),
    ...(mf ? microClaims(mf).map((x) => (x.high ? "High in " : "Source of ") + lowerName(x.name)) : []),
  ];
  return { food: f, pd, protein, fats, carbs, micros, claims };
}

// For your goal: what this portion does for the meal and the day, from the numbers. ok: covers the need; part: brings part of
// it; note: worth knowing. Strongest first; the goal decides which family leads among equals.
export type GoalLine = { mark: "ok" | "part" | "note"; family: "protein" | "fats" | "carbs" | "micros"; text: string };
const times = (r: number) => (r >= 2 ? `${r >= 2.95 ? `${Math.round(r)} times` : "more than twice"}` : r >= 1.5 ? "almost twice" : "more than");
const cap = (x: string) => x[0].toUpperCase() + x.slice(1);
export function goalLines(l: Lenses, meal: string, need: Meal, pdTarget: number | null, band: string): GoalLine[] {
  const out: GoalLine[] = [], p = l.protein, f = l.fats, c = l.carbs, m = l.micros;
  if (p.eaa !== null && p.leucine !== null && p.eaa >= EAA_MEAL && p.leucine >= LEUCINE_MEAL) out.push({ mark: "ok", family: "protein", text: `Muscle building: ${p.eaa} g essential amino acids and ${p.leucine} g leucine, enough for one meal.` });
  if (p.closes >= 25 || (pdTarget !== null && l.pd >= pdTarget && p.g >= 5)) {
    const pdLine = pdTarget === null ? "" : l.pd >= pdTarget ? ` PD ${l.pd}, above your ${pdTarget}: it lifts a plate.` : ` PD ${l.pd}, below your ${pdTarget}: it needs a partner richer in protein.`;
    out.push({ mark: p.closes >= 100 ? "ok" : "part", family: "protein", text: `Protein: ${p.g} g, ${p.closes} % of your ${meal}'s ${need.protein} g.${pdLine}` });
  } else if (p.g < 1) out.push({ mark: "note", family: "protein", text: `Protein: almost none, ${p.g} g.` });
  if (f && f.epaDha >= EPA_DHA_DAY) out.push({ mark: "ok", family: "fats", text: `Omega-3: ${f.epaDha} mg EPA and DHA, about ${Math.round(f.epaDha / EPA_DHA_DAY)} days of EFSA's ${EPA_DHA_DAY} mg.` });
  if (c && c.fibreMeal > 0 && c.fibre >= c.fibreMeal) out.push({ mark: "ok", family: "carbs", text: `Fibre: ${c.fibre} g, ${times(c.fibre / c.fibreMeal)} your ${meal}'s ${c.fibreMeal} g.` });
  else if (c && c.fibreMeal > 0 && c.fibre >= c.fibreMeal / 3) out.push({ mark: "part", family: "carbs", text: `Fibre: ${c.fibre} g, ${Math.round((100 * c.fibre) / c.fibreMeal)} % of your ${meal}'s ${c.fibreMeal} g.` });
  if (m && m.length && m[0].share >= 33) out.push({ mark: m[0].share >= 100 ? "ok" : "part", family: "micros", text: `${m.map((x, i) => `${i === 0 ? cap(lowerName(x.name)) : lowerName(x.name)} ${x.share} %`).join(", ")} of the day's reference.` });
  if (c && c.g >= 0.5 && c.closes >= 25) out.push({ mark: c.closes >= 100 ? "ok" : "part", family: "carbs", text: `Carbs: ${c.g} g, ${c.closes} % of your ${meal}'s ${need.carb} g${c.band === "low" ? `, and slow: GI ${c.gi}` : c.band === "high" ? `, and fast: GI ${c.gi}` : c.gi !== null ? `, GI ${c.gi}` : ""}.` });
  else if (c && c.g < 0.5) out.push({ mark: "note", family: "carbs", text: "Carbs: none." });
  if (f && f.g >= 1 && f.closes >= 25) out.push({ mark: f.sat > f.satMeal ? "note" : "part", family: "fats", text: `Fats: ${f.g} g, ${f.closes} % of your ${meal}'s ${need.fat} g; ${f.sat} g saturated, ${Math.round((100 * f.sat) / f.satMeal)} % of its limit${f.sat > f.satMeal ? ": over it" : ""}.` });
  else if (f && f.g < 1) out.push({ mark: "note", family: "fats", text: `Fats: almost none, ${f.g} g.` });
  // the goal decides which family leads among lines of the same strength
  const lead: Record<string, string[]> = { gain: ["protein", "carbs"], gainsteady: ["protein", "carbs"], performance: ["carbs", "protein"], fatloss: ["protein", "micros"], recomp: ["protein", "micros"] };
  const order = lead[band] ?? [];
  const rank = (g: GoalLine) => ({ ok: 0, part: 1, note: 2 })[g.mark] * 10 + (order.includes(g.family) ? order.indexOf(g.family) : 5);
  return out.sort((a, b) => rank(a) - rank(b));
}
export const satOfMeal = (mealKcal: number) => r1((mealKcal * SAT_SHARE) / 9);
export const FOODS_SORTED = () => [...FOOD_TABLE].sort((a, b) => a.name.localeCompare(b.name));
