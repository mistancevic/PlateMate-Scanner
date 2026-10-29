// DT156 (0.3.0, canvas Page 2, board Stories108; Coach Milan 29 October 16:16 to 16:27): what a label could say, by EU rules,
// on every Explorer card. A food may carry a nutrition claim only when it meets the condition per 100 g (or per 100 kcal where
// the rule says so). Conditions quoted from the European Commission's list of nutrition claims, Regulation (EC) No 1924/2006,
// Annex, lastly amended by Regulation (EU) No 1047/2012, read on food.ec.europa.eu on 29 October 2026:
//   SOURCE OF PROTEIN "at least 12% of the energy value of the food is provided by protein"; HIGH PROTEIN "at least 20%".
//   SOURCE OF FIBRE "at least 3 g of fibre per 100 g or at least 1,5 g of fibre per 100 kcal"; HIGH FIBRE "at least 6 g ... or
//   at least 3 g ... per 100 kcal". LOW SUGARS "no more than 5 g of sugars per 100 g for solids".
//   LOW SATURATED FAT "does not exceed 1,5 g per 100 g for solids" and "must not provide more than 10% of energy", both on the sum
//   of saturated and trans fatty acids. HIGH UNSATURATED FAT "at least 70% of the fatty acids present in the product derive from
//   unsaturated fat" and "unsaturated fat provides more than 20% of energy of the product".
//   SOURCE OF OMEGA-3 "at least 0,3 g alpha-linolenic acid per 100g and per 100kcal" or "at least 40mg of the sum of
//   eicosapentaenoic acid and docosahexaenoic acid per 100g and per 100kcal"; HIGH OMEGA-3 0,6 g or 80 mg.
// Energy: protein 4 kcal and fat 9 kcal per g (Regulation (EU) No 1169/2011, Annex XIV), so 12 % and 20 % of energy from protein
// are PD 3 and PD 5. ALA is USDA's 18:3 (the Fats page's note); trans counts as 0 where the row doesn't report it.
import type { ExplorerFood } from "./explorer";
import type { FatFood } from "./explorerFats";
import type { CarbFood } from "./explorerCarbs";

// status: shown instead of Yes or No (DT157: the oat beta-glucan health claim, Not on our table)
export type Claim = { claim: string; rule: string; ok: boolean; is: string; status?: string; health?: boolean };
export const CLAIMS_SOURCE = "Regulation (EC) No 1924/2006, Annex, as the European Commission lists it.";
const r1 = (x: number) => Math.round(x * 10) / 10;

export function proteinClaims(f: Pick<ExplorerFood, "protein" | "kcal">): Claim[] {
  const pd = (100 * f.protein) / f.kcal;
  return [
    { claim: "Source of protein", rule: "at least 12 % of the energy from protein, that is PD 3", ok: pd >= 3, is: `PD ${r1(pd)}` },
    { claim: "High protein", rule: "at least 20 % of the energy from protein, that is PD 5", ok: pd >= 5, is: `PD ${r1(pd)}` },
  ];
}

export function fatClaims(f: Pick<FatFood, "kcal" | "sfa" | "mufa" | "pufa" | "trans" | "ala" | "epa" | "dha">): Claim[] {
  const fa = f.sfa + f.mufa + f.pufa, satT = f.sfa + (f.trans ?? 0), epaDha = (f.epa + f.dha) * 1000, unsat = f.mufa + f.pufa;
  const n3 = (ala: number, ed: number) => (f.ala >= ala && (f.ala * 100) / f.kcal >= ala) || (epaDha >= ed && (epaDha * 100) / f.kcal >= ed);
  const n3is = epaDha > 0 ? `${Math.round(epaDha)} mg EPA and DHA` : `${r1(f.ala)} g ALA`;
  return [
    { claim: "Low saturated fat", rule: "saturated and trans at most 1.5 g per 100 g, and at most 10 % of the energy", ok: satT <= 1.5 && (satT * 9) / f.kcal <= 0.1, is: `${r1(satT)} g, ${Math.round((satT * 900) / f.kcal)} %` },
    { claim: "High unsaturated fat", rule: "at least 70 % of the fatty acids unsaturated, and more than 20 % of the energy", ok: fa > 0 && unsat / fa >= 0.7 && (unsat * 9) / f.kcal > 0.2, is: `${fa > 0 ? Math.round((100 * unsat) / fa) : 0} %, ${Math.round((unsat * 900) / f.kcal)} %` },
    { claim: "Source of omega-3", rule: "0.3 g ALA, or 40 mg EPA and DHA, per 100 g and per 100 kcal", ok: n3(0.3, 40), is: n3is },
    { claim: "High omega-3", rule: "0.6 g ALA, or 80 mg EPA and DHA, per 100 g and per 100 kcal", ok: n3(0.6, 80), is: n3is },
  ];
}

// DT157 (0.3.1): the EU health claim for oat beta-glucan, as the European Commission's EU Register lists it (Regulation (EU) No
// 432/2012): "Beta-glucans contribute to the maintenance of normal blood cholesterol levels"; "at least 1 g of beta-glucans from
// oats ... per quantified portion", and "information shall be given ... that the beneficial effect is obtained with a daily
// intake of 3 g". Our food table has no beta-glucan figure, so it can't be checked: Not on our table.
export const BETA_GLUCAN: Claim = { claim: "Beta-glucan and cholesterol", rule: "at least 1 g of beta-glucan from oats per portion, and the label must say the effect comes with 3 g a day", ok: false, is: "no beta-glucan figure on our food table", status: "Not on our table", health: true };

export function carbClaims(f: Pick<CarbFood, "kcal" | "fibre" | "sugar"> & { betaGlucan?: boolean }): Claim[] {
  const per100kcal = (f.fibre * 100) / f.kcal, fib = `${r1(f.fibre)} g, ${r1(per100kcal)} g per 100 kcal`;
  return [
    { claim: "Source of fibre", rule: "at least 3 g per 100 g, or 1.5 g per 100 kcal", ok: f.fibre >= 3 || per100kcal >= 1.5, is: fib },
    { claim: "High fibre", rule: "at least 6 g per 100 g, or 3 g per 100 kcal", ok: f.fibre >= 6 || per100kcal >= 3, is: fib },
    { claim: "Low sugars", rule: "at most 5 g of sugars per 100 g", ok: f.sugar <= 5, is: `${r1(f.sugar)} g` },
    ...(f.betaGlucan ? [BETA_GLUCAN] : []),
  ];
}
