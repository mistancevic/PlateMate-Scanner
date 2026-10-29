import { test } from "node:test";
import assert from "node:assert/strict";
import { proteinClaims, fatClaims, carbClaims } from "./euClaims";
import { EXPLORER_FOODS } from "./explorer";
import { FAT_FOODS } from "./explorerFats";
import { CARB_FOODS } from "./explorerCarbs";

const yes = (cs: { claim: string; ok: boolean }[]) => cs.filter((c) => c.ok).map((c) => c.claim);
const by = <T extends { id: string }>(xs: T[], id: string) => xs.find((x) => x.id === id)!;

test("DT156: High protein is PD 5, Source of protein PD 3 (20 % and 12 % of the energy at 4 kcal a gram)", () => {
  assert.deepEqual(yes(proteinClaims({ protein: 5, kcal: 100 })), ["Source of protein", "High protein"]);
  assert.deepEqual(yes(proteinClaims({ protein: 4.9, kcal: 100 })), ["Source of protein"]);
  assert.deepEqual(yes(proteinClaims({ protein: 2.9, kcal: 100 })), []);
  for (const f of EXPLORER_FOODS) assert.equal(proteinClaims(f)[1].ok, f.id !== "oats", f.id);
});

test("DT156: the fat claims for the Explorer's fats", () => {
  assert.deepEqual(yes(fatClaims(by(FAT_FOODS, "walnuts"))), ["High unsaturated fat", "Source of omega-3", "High omega-3"]);
  assert.deepEqual(yes(fatClaims(by(FAT_FOODS, "salmon"))), ["High unsaturated fat", "Source of omega-3", "High omega-3"]);
  assert.deepEqual(yes(fatClaims(by(FAT_FOODS, "olive"))), ["High unsaturated fat"]);
  assert.deepEqual(yes(fatClaims(by(FAT_FOODS, "butter"))), []);
  assert.deepEqual(yes(fatClaims(by(FAT_FOODS, "cheddar"))), []);
  // low saturated fat needs both: at most 1.5 g per 100 g and at most 10 % of the energy
  assert.equal(fatClaims({ kcal: 200, sfa: 1.5, mufa: 1, pufa: 1, trans: 0, ala: 0, epa: 0, dha: 0 })[0].ok, true);
  assert.equal(fatClaims({ kcal: 100, sfa: 1.5, mufa: 1, pufa: 1, trans: 0, ala: 0, epa: 0, dha: 0 })[0].ok, false, "1.5 g is 13.5 % of 100 kcal");
  assert.equal(fatClaims({ kcal: 200, sfa: 1.2, mufa: 1, pufa: 1, trans: 0.4, ala: 0, epa: 0, dha: 0 })[0].ok, false, "trans counts");
});

test("DT156: fibre per 100 g or per 100 kcal; low sugars per 100 g", () => {
  assert.deepEqual(yes(carbClaims(by(CARB_FOODS, "apple"))), ["Source of fibre", "High fibre"]);
  assert.deepEqual(yes(carbClaims(by(CARB_FOODS, "lentils"))), ["Source of fibre", "High fibre", "Low sugars"]);
  assert.deepEqual(yes(carbClaims(by(CARB_FOODS, "pasta"))), ["Low sugars"]);
  assert.deepEqual(yes(carbClaims(by(CARB_FOODS, "banana"))), ["Source of fibre"]);
});

test("DT157: oats carry the EU health claim for beta-glucan as Not on our table; no other food does", () => {
  const oats = carbClaims(by(CARB_FOODS, "oats"));
  const bg = oats.find((c) => c.claim === "Beta-glucan and cholesterol")!;
  assert.deepEqual([bg.status, bg.ok, bg.health], ["Not on our table", false, true]);
  for (const f of CARB_FOODS.filter((x) => x.id !== "oats")) assert.ok(!carbClaims(f).some((c) => c.health), f.id);
  assert.deepEqual(yes(oats), ["Source of fibre", "High fibre", "Low sugars"]);
});
