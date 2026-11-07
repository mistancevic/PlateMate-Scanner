// Target analysis: the person's own numbers checked against their goal and body, by code, never by the model.
// Every finding has a number and a source, and belongs either to one day (shown under that day's row) or to the week
// (shown under the week's line). Nothing is blocked; a finding kept on purpose is remembered with the value it was kept at.
import { ADJ, DAY_TYPES, type DayNumbers, type DayType, type Personal } from "./personal";
import { goalName } from "./goal";
import { w, dec, numText } from "./words";
import { lengthOf } from "./plan";

export type Finding = { id: string; day: DayType | null; field: "kcal" | "protein" | "fats" | "carbs"; title: string; body: string; source: string; sig: string };
export type Analysis = { findings: Finding[]; inRange: string[] };
const pct = (x: number) => Math.round(x * 100);
const AND = "AND, DC and ACSM joint position, 2016";

export function analyse(args: {
  days: Record<DayType, DayNumbers>;
  avg: { kcal: number; protein: number; fats: number };
  bandId: string;
  personal: Personal;
  burn: number | null; // the calculated average burn at maintenance, when there is body data
}): Analysis {
  const { days, avg, bandId, personal, burn } = args;
  const kg = personal.weightKg ?? null;
  const goal = goalName(bandId) || w("analysis.yourGoal");
  const out: Finding[] = [], ok: string[] = [];
  // energy against the goal: the week's average against what the body burns, the goal's own step allowed, 5 points either way
  if (burn && avg.kcal > 0) {
    const want = ADJ[bandId] ?? 0, got = avg.kcal / burn - 1, off = got - want;
    if (Math.abs(off) > 0.05) {
      const under = off < 0;
      // plain English: "This looks more like building than maintaining"
      const looks = w(under ? (want <= -0.1 ? "analysis.looksDeeperCut" : "analysis.looksFatLoss") : (want >= 0.1 ? "analysis.looksBiggerSurplus" : "analysis.looksBuilding"));
      const goalAs: Record<string, "analysis.asFatloss" | "analysis.asRecomp" | "analysis.asMaintain" | "analysis.asGain" | "analysis.asGainsteady" | "analysis.asPerformance"> = { fatloss: "analysis.asFatloss", recomp: "analysis.asRecomp", maintain: "analysis.asMaintain", gain: "analysis.asGain", gainsteady: "analysis.asGainsteady", performance: "analysis.asPerformance" };
      const avgLine = w(got < 0 ? "analysis.energyUnder" : "analysis.energyOver", { avg: numText(avg.kcal), burn: numText(burn), pct: Math.abs(pct(got)) });
      const expects = want === 0 ? w("analysis.expectsWithin", { goal }) : w(want < 0 ? "analysis.expectsUnder" : "analysis.expectsOver", { goal, pct: Math.abs(pct(want)) });
      out.push({ id: "energy", day: null, field: "kcal", title: w("analysis.looksMoreLike", { looks, goal: goalAs[bandId] ? w(goalAs[bandId]) : goal.toLowerCase() }),
        body: `${avgLine} ${expects}`,
        source: "Mifflin–St Jeor; Compendium of Physical Activities 2024; your My week", sig: `energy:${Math.round(got * 100)}` });
    } else ok.push(w("analysis.energyFits"));
  }
  // protein per kg, the week's average
  if (kg && avg.protein > 0) {
    const g = avg.protein / kg;
    if (g < 1.2 || g > 2.5) out.push({ id: "protein", day: null, field: "protein", title: w(g < 1.2 ? "analysis.proteinLow" : "analysis.proteinHigh"),
      body: w(g < 1.2 ? "analysis.proteinLowBody" : "analysis.proteinHighBody", { g: dec(g, 1) }),
      source: "ISSN position stand, 2017; Morton et al. 2018", sig: `protein:${g.toFixed(1)}` });
    else ok.push(w("analysis.proteinOk", { g: dec(g, 1) }));
  }
  // fat share of energy, the week's average
  if (avg.kcal > 0 && avg.fats > 0) {
    const share = (avg.fats * 9) / avg.kcal;
    if (share < 0.2 || share > 0.4) out.push({ id: "fat", day: null, field: "fats", title: w(share < 0.2 ? "analysis.fatLow" : "analysis.fatHigh"),
      body: w("analysis.fatBody", { pct: pct(share) }), source: AND, sig: `fat:${pct(share)}` });
    else ok.push(w("analysis.fatOk", { pct: pct(share) }));
  }
  // carbs on training days, per kg
  if (kg) {
    // about an hour: a moderate day whose range reaches 60 minutes (45–60 or longer)
    const easyNeeds = lengthOf(DAY_TYPES.find((x) => x.id === "easy")!.minutes(personal)).max >= 60 ? 5 : 3;
    const checks: [DayType, number, string][] = [["easy", easyNeeds, w(easyNeeds === 5 ? "analysis.carbsHour" : "analysis.carbsLight")], ["hard", 6, w("analysis.carbsHeavy")]];
    for (const [d, need, why] of checks) {
      // only a day the person typed: a calculated day is not their choice to question
      const src = (days[d] as DayNumbers & { source?: string }).source;
      if (src && src !== "you") continue;
      const g = days[d].carbs / kg;
      if (g < need) out.push({ id: `carbs-${d}`, day: d, field: "carbs", title: w("analysis.carbsLow"), body: w("analysis.carbsBody", { g: dec(g, 1), why }), source: AND, sig: `carbs-${d}:${g.toFixed(1)}` });
    }
  }
  // the shape of the week: a rest day above a training day; days far apart
  const k = (d: DayType) => days[d].kcal;
  if (k("passive") > k("easy") || k("passive") > k("hard") || k("active") > k("hard")) out.push({ id: "shape-rest", day: "passive", field: "kcal", title: w("analysis.restAbove"),
    body: w("analysis.restAboveBody", { rest: numText(k("passive")), easy: numText(k("easy")), hard: numText(k("hard")) }), source: "Compendium of Physical Activities 2024", sig: `shape-rest:${k("passive")}-${k("easy")}-${k("hard")}` });
  else ok.push(w("analysis.restBelow"));
  const ks = DAY_TYPES.map((d) => k(d.id)).filter((x) => x > 0), lo = Math.min(...ks), hi = Math.max(...ks);
  if (lo > 0 && hi / lo > 1.4) out.push({ id: "shape-swing", day: "hard", field: "kcal", title: w("analysis.farApart"),
    body: w("analysis.farApartBody", { lo: numText(lo), hi: numText(hi), pct: pct(hi / lo - 1) }), source: "Compendium of Physical Activities 2024", sig: `shape-swing:${lo}-${hi}` });
  return { findings: out, inRange: ok };
}
// the four numbers of a row add up within 20 kcal, rounding; else what they come to
export function addsUp(r: { kcal: number; protein: number; fats: number; carbs: number }): number | null {
  const sum = r.protein * 4 + r.fats * 9 + r.carbs * 4;
  return Math.abs(sum - r.kcal) > 20 ? Math.round(sum / 10) * 10 : null;
}
// open = not kept, or kept at a different value
export const isOpen = (f: Finding, p: Personal) => p.kept?.[f.id]?.sig !== f.sig;
