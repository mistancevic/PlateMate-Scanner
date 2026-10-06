// Target analysis: the person's own numbers checked against their goal and body, by code, never by the model.
// Every finding has a number and a source, and belongs either to one day (shown under that day's row) or to the week
// (shown under the week's line). Nothing is blocked; a finding kept on purpose is remembered with the value it was kept at.
import { ADJ, DAY_TYPES, type DayNumbers, type DayType, type Personal } from "./personal";
import { BANDS } from "./goal";

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
  const goal = BANDS.find((b) => b.id === bandId)?.name ?? "your goal";
  const out: Finding[] = [], ok: string[] = [];
  // energy against the goal: the week's average against what the body burns, the goal's own step allowed, 5 points either way
  if (burn && avg.kcal > 0) {
    const want = ADJ[bandId] ?? 0, got = avg.kcal / burn - 1, off = got - want;
    if (Math.abs(off) > 0.05) {
      const under = off < 0;
      const looks = under ? (want <= -0.1 ? "a deeper cut than" : "losing fat more than") : (want >= 0.1 ? "a bigger surplus than" : "building more than");
      const goalAs: Record<string, string> = { fatloss: "losing fat", recomp: "recomposition", maintain: "maintaining", gain: "building muscle", performance: "performance" };
      out.push({ id: "energy", day: null, field: "kcal", title: `This looks like ${looks} ${goalAs[bandId] ?? goal.toLowerCase()}`,
        body: `Your average is ${avg.kcal.toLocaleString("en")}; what you burn, calculated, is ${burn.toLocaleString("en")}: ${Math.abs(pct(got))} % ${got < 0 ? "under" : "over"}. ${goal} expects ${want === 0 ? "within 5 %" : `about ${Math.abs(pct(want))} % ${want < 0 ? "under" : "over"}, give or take 5`}.`,
        source: "Mifflin–St Jeor; Compendium of Physical Activities 2024; your My week", sig: `energy:${Math.round(got * 100)}` });
    } else ok.push("energy fits the goal");
  }
  // protein per kg, the week's average
  if (kg && avg.protein > 0) {
    const g = avg.protein / kg;
    if (g < 1.2 || g > 2.5) out.push({ id: "protein", day: null, field: "protein", title: g < 1.2 ? "Protein is low for keeping muscle" : "Protein is higher than any guideline needs",
      body: `${g.toFixed(1)} g per kg on average. ${g < 1.2 ? "Adults usually need 1.2 to 1.6, and 1.6 to 2.2 when they train." : "Above 2.2 g per kg there is no added benefit in the studies."}`,
      source: "ISSN position stand, 2017; Morton et al. 2018", sig: `protein:${g.toFixed(1)}` });
    else ok.push(`protein ${g.toFixed(1)} g per kg`);
  }
  // fat share of energy, the week's average
  if (avg.kcal > 0 && avg.fats > 0) {
    const share = (avg.fats * 9) / avg.kcal;
    if (share < 0.2 || share > 0.4) out.push({ id: "fat", day: null, field: "fats", title: share < 0.2 ? "Fat is low" : "Fat is high",
      body: `${pct(share)} % of your energy. The published range is 20 to 35 %.`, source: AND, sig: `fat:${pct(share)}` });
    else ok.push(`fat ${pct(share)} % of energy`);
  }
  // carbs on training days, per kg
  if (kg) {
    const easyNeeds = (personal.easyMin ?? 60) >= 60 ? 5 : 3;
    const checks: [DayType, number, string][] = [["easy", easyNeeds, easyNeeds === 5 ? "An hour of training a day usually needs 5 to 7." : "Light training usually needs 3 to 5."], ["hard", 6, "Heavy or long training usually needs 6 to 10."]];
    for (const [d, need, why] of checks) {
      // only a day the person typed: a calculated day is not their choice to question
      const src = (days[d] as DayNumbers & { source?: string }).source;
      if (src && src !== "you") continue;
      const g = days[d].carbs / kg;
      if (g < need) out.push({ id: `carbs-${d}`, day: d, field: "carbs", title: "Carbs are low for a training day", body: `${g.toFixed(1)} g per kg here. ${why}`, source: AND, sig: `carbs-${d}:${g.toFixed(1)}` });
    }
  }
  // the shape of the week: a rest day above a training day; days far apart
  const k = (d: DayType) => days[d].kcal;
  if (k("passive") > k("easy") || k("passive") > k("hard") || k("active") > k("hard")) out.push({ id: "shape-rest", day: "passive", field: "kcal", title: "A rest day is above a training day",
    body: `Rest, passive ${k("passive").toLocaleString("en")}; Training, easy ${k("easy").toLocaleString("en")}; Training, hard ${k("hard").toLocaleString("en")}. Usually the training days carry more.`, source: "Compendium of Physical Activities 2024", sig: `shape-rest:${k("passive")}-${k("easy")}-${k("hard")}` });
  else ok.push("rest below training");
  const ks = DAY_TYPES.map((d) => k(d.id)).filter((x) => x > 0), lo = Math.min(...ks), hi = Math.max(...ks);
  if (lo > 0 && hi / lo > 1.4) out.push({ id: "shape-swing", day: "hard", field: "kcal", title: "Your days are far apart",
    body: `From ${lo.toLocaleString("en")} to ${hi.toLocaleString("en")} kcal, ${pct(hi / lo - 1)} % apart. Training rarely costs more than a third of a day.`, source: "Compendium of Physical Activities 2024", sig: `shape-swing:${lo}-${hi}` });
  return { findings: out, inRange: ok };
}
// the four numbers of a row add up within 20 kcal, rounding; else what they come to
export function addsUp(r: { kcal: number; protein: number; fats: number; carbs: number }): number | null {
  const sum = r.protein * 4 + r.fats * 9 + r.carbs * 4;
  return Math.abs(sum - r.kcal) > 20 ? Math.round(sum / 10) * 10 : null;
}
// open = not kept, or kept at a different value
export const isOpen = (f: Finding, p: Personal) => p.kept?.[f.id]?.sig !== f.sig;
