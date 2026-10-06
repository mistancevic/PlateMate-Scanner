import test from "node:test";
import assert from "node:assert/strict";
import { proteinFloor, preCarbGrams, preTraining, afterTraining, isCarbFood, SOURCES } from "./fitness";
import { playbookFor } from "./playbook";
import { mixTip } from "./mixtip";
import { STARTER_FOODS } from "./starter";

const byName = (n: string) => STARTER_FOODS.find((f) => f.name === n)!;
const honey = byName("Honey"), banana = byName("Banana"), oats = byName("Oats"), chicken = byName("Chicken breast, cooked"), whey = byName("Whey protein powder"), nutella = byName("Nutella"), skyr = byName("Skyr, natural");

test("the numbers follow the sources and stay inside their ranges", () => {
  assert.equal(proteinFloor(95), 29);      // 0.3 g/kg
  assert.equal(proteinFloor(55), 20);      // never under 20
  assert.equal(proteinFloor(150), 40);     // never over 40
  assert.equal(proteinFloor(null), 30);    // no weight on the profile
  assert.equal(preCarbGrams(95, "passive"), 48);
  assert.equal(preCarbGrams(95, "easy"), 95);
  assert.equal(preCarbGrams(95, "hard"), 120); // capped
  assert.equal(preCarbGrams(null, "easy"), 60);
  assert.ok(/ISSN/.test(SOURCES.proteinDose) && /2016/.test(SOURCES.preCarb));
});

test("before training: honey and a banana fit as they are; oats wait for the fibre rule; Nutella does not; chicken is not the energy", () => {
  for (const f of [honey, banana]) {
    const r = preTraining(f, playbookFor(f), 95, "easy");
    assert.equal(r.fits, true, `${f.name} fits before training`);
    assert.ok(r.grams! > 0 && /nothing to add/.test(r.reason), `${f.name}: ${r.reason}`);
  }
  assert.equal(preTraining(nutella, playbookFor(nutella), 95, "easy").fits, false, "Nutella: 31 g fat");
  assert.equal(preTraining(oats, playbookFor(oats), 95, "easy").fits, false, "oats: 10 g fibre, the playbook's before-training rule stands");
  const c = preTraining(chicken, playbookFor(chicken), 95, "easy");
  assert.equal(c.fits, false); assert.ok(/carb food/.test(c.reason));
  assert.equal(isCarbFood(honey), true); assert.equal(isCarbFood(skyr), false);
});

test("before training: the portion follows the day's load", () => {
  const usual = preTraining(honey, playbookFor(honey), 95, "passive").grams!;
  const training = preTraining(honey, playbookFor(honey), 95, "easy").grams!;
  const very = preTraining(honey, playbookFor(honey), 95, "hard").grams!;
  assert.ok(usual < training && training < very, `${usual} < ${training} < ${very}`);
});

test("before training, Mix it: honey fits on its own, no mix offered; Nutella still gets a dairy partner", () => {
  const h = mixTip(honey, "before", 3, [], STARTER_FOODS, 300, { weightKg: 95, dayType: "easy" });
  assert.equal(h.case, "fits"); assert.equal(h.mixes.length, 0); assert.ok(/nothing to add/.test(h.why));
  const n = mixTip(nutella, "before", 3, [], STARTER_FOODS, 300, { weightKg: 95, dayType: "easy" });
  assert.ok(n.mixes.length >= 1);
});

test("after training: a protein base says the grams that reach the floor; a carb food says what the plate wants", () => {
  const c = afterTraining(chicken, playbookFor(chicken), 95);
  assert.equal(c.fits, true); assert.equal(c.floor, 29); assert.ok(c.grams! >= 90 && c.grams! <= 100, `${c.grams} g chicken for 29 g`);
  const w = afterTraining(whey, playbookFor(whey), 95);
  assert.ok(w.grams! >= 35 && w.grams! <= 40, `${w.grams} g whey`);
  const o = afterTraining(oats, playbookFor(oats), 95);
  assert.equal(o.fits, true); assert.equal(o.grams, null); assert.ok(/29 g protein/.test(o.reason));
});

test("after training, Mix it: the plate reaches the protein floor", () => {
  const t = mixTip(nutella, "after", 6.3, [], STARTER_FOODS, 1200, { weightKg: 95, dayType: "easy" });
  assert.ok(t.mixes.length >= 1);
  for (const m of t.mixes) assert.ok(m.protein >= 29, `${m.partners.map((p) => p.name).join("+")}: ${m.protein} g protein`);
});

test("fat and carbs by rule: fat 30 percent of energy, carbs the rest; the day's extra calories go to carbs", async () => {
  const { macroSplit, calculate } = await import("./personal");
  const a = macroSplit(2400, 160);
  assert.equal(a.fats, 80);                 // 2400 * 0.30 / 9
  assert.equal(a.carbs, 260);               // (2400 - 640 - 720) / 4
  const b = macroSplit(2800, 160, a.fats);  // a training day: same protein, same fat, carbs take the difference
  assert.equal(b.fats, 80); assert.equal(b.carbs, 360);
  const r = calculate({ sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, activity: "moderate" } as any, "recomp", null)!;
  assert.ok(r.fats > 0 && r.carbs > 0 && Math.abs(r.protein * 4 + r.fats * 9 + r.carbs * 4 - r.kcal) <= 8, "the four add up to the day");
});
