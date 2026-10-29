// DT156 (Milan 29 October 16:17): what a label could claim, by EU rules. Conditions quoted from the European Commission's list of
// permitted nutrition claims (Regulation (EC) No 1924/2006, Annex, lastly amended by Regulation (EU) No 1047/2012), read on
// food.ec.europa.eu on 29 October 2026. Energy from protein, fat: 4 and 9 kcal per g (Regulation (EU) No 1169/2011, Annex XIV).
require("tsx/cjs");
const ROOT = "/home/claude/platemate-scanner";
const { EXPLORER_FOODS } = require(ROOT + "/src/explorer.ts");
const { FAT_FOODS } = require(ROOT + "/src/explorerFats.ts");
const { CARB_FOODS } = require(ROOT + "/src/explorerCarbs.ts");
const r1 = (x) => Math.round(x * 10) / 10;
const protein = (f) => { const pd = 100 * f.protein / f.kcal; return [
  { claim: "Source of protein", rule: "at least 12 % of the energy from protein: PD 3", ok: pd >= 3, is: `PD ${r1(pd)}` },
  { claim: "High protein", rule: "at least 20 % of the energy from protein: PD 5", ok: pd >= 5, is: `PD ${r1(pd)}` }]; };
const fats = (f) => { const fa = f.sfa + f.mufa + f.pufa, satT = f.sfa + (f.trans ?? 0), epadha = (f.epa + f.dha) * 1000;
  const n3 = (ala, ed) => (f.ala >= ala && f.ala * 100 / f.kcal >= ala) || (epadha >= ed && epadha * 100 / f.kcal >= ed);
  return [
  { claim: "Low saturated fat", rule: "saturated and trans at most 1.5 g per 100 g, and at most 10 % of the energy", ok: satT <= 1.5 && satT * 9 / f.kcal <= 0.10, is: `${r1(satT)} g, ${Math.round(satT * 900 / f.kcal)} %` },
  { claim: "High unsaturated fat", rule: "at least 70 % of the fatty acids unsaturated, and more than 20 % of the energy", ok: (f.mufa + f.pufa) / fa >= 0.70 && (f.mufa + f.pufa) * 9 / f.kcal > 0.20, is: `${Math.round(100 * (f.mufa + f.pufa) / fa)} %, ${Math.round((f.mufa + f.pufa) * 900 / f.kcal)} %` },
  { claim: "Source of omega-3", rule: "0.3 g ALA, or 40 mg EPA and DHA, per 100 g and per 100 kcal", ok: n3(0.3, 40), is: epadha > 0 ? `${Math.round(epadha)} mg EPA and DHA` : `${r1(f.ala)} g ALA` },
  { claim: "High omega-3", rule: "0.6 g ALA, or 80 mg EPA and DHA, per 100 g and per 100 kcal", ok: n3(0.6, 80), is: epadha > 0 ? `${Math.round(epadha)} mg EPA and DHA` : `${r1(f.ala)} g ALA` }]; };
const carbs = (f) => { const per100kcal = f.fibre * 100 / f.kcal; return [
  { claim: "Source of fibre", rule: "at least 3 g per 100 g, or 1.5 g per 100 kcal", ok: f.fibre >= 3 || per100kcal >= 1.5, is: `${r1(f.fibre)} g, ${r1(per100kcal)} g per 100 kcal` },
  { claim: "High fibre", rule: "at least 6 g per 100 g, or 3 g per 100 kcal", ok: f.fibre >= 6 || per100kcal >= 3, is: `${r1(f.fibre)} g, ${r1(per100kcal)} g per 100 kcal` },
  { claim: "Low sugars", rule: "at most 5 g of sugars per 100 g", ok: f.sugar <= 5, is: `${r1(f.sugar)} g` }]; };
module.exports = { protein: Object.fromEntries(EXPLORER_FOODS.map((f) => [f.name, protein(f)])), fats: Object.fromEntries(FAT_FOODS.map((f) => [f.name, fats(f)])), carbs: Object.fromEntries(CARB_FOODS.map((f) => [f.name, carbs(f)])) };
if (require.main === module) for (const [fam, m] of Object.entries(module.exports)) for (const [n, cs] of Object.entries(m)) console.log(fam.padEnd(7), n.padEnd(22), cs.filter((c) => c.ok).map((c) => c.claim).join(", ") || "none");
