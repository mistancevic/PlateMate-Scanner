import test from "node:test";
import assert from "node:assert/strict";
import { analyse, addsUp, isOpen } from "./analysis";
import { calculate, ownDayNumbers } from "./personal";

const me: any = { sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, life: "desk", week: { passive: 2, active: 1, easy: 2, hard: 2 }, easyMin: 60, hardMin: 75 };

test("calculated numbers for Maintain raise nothing about energy", () => {
  const c = calculate(me, "maintain", null)!;
  const a = analyse({ days: c.days, avg: c, bandId: "maintain", personal: me, burn: calculate(me, "maintain", null)!.kcal });
  assert.equal(a.findings.filter((f) => f.id === "energy").length, 0);
  assert.ok(a.inRange.includes("energy fits the goal"));
});

test("own numbers 11 % over the burn on Maintain look like building; low carbs on an easy day are flagged under that day", () => {
  const p = { ...me, dayMode: "each", ownDays: { passive: { kcal: 2900, protein: 185, fats: 108, carbs: 297 }, active: { kcal: 3100, protein: 190 }, easy: { kcal: 3200, protein: 190, fats: 90, carbs: 400 } } };
  const o = ownDayNumbers(p, "maintain", null)!;
  const burn = calculate(me, "maintain", null)!.kcal;
  const a = analyse({ days: o.days, avg: o.avg, bandId: "maintain", personal: p, burn });
  const energy = a.findings.find((f) => f.id === "energy")!;
  assert.ok(energy && /more like building than maintain/.test(energy.title), energy?.title);
  const carbs = a.findings.find((f) => f.id === "carbs-easy")!;
  assert.equal(carbs.day, "easy"); assert.ok(/4\.2 g per kg/.test(carbs.body), carbs.body);
  assert.equal(addsUp({ kcal: 3200, protein: 190, fats: 90, carbs: 400 }), 3170);
  assert.equal(addsUp({ kcal: 2900, protein: 185, fats: 108, carbs: 297 }), null);
  // kept on purpose at this value: closed; a changed value asks again
  const kept = { ...p, kept: { "carbs-easy": { at: "2026-10-06", sig: carbs.sig } } };
  assert.equal(isOpen(carbs, kept), false);
  assert.equal(isOpen({ ...carbs, sig: "carbs-easy:3.9" }, kept), true);
});

test("without body data only the arithmetic and the shape of the week run", () => {
  const p: any = { dayMode: "each", ownDays: { passive: { kcal: 3000, protein: 150 }, easy: { kcal: 2400, protein: 150 } } };
  const o = ownDayNumbers(p, "maintain", null)!;
  const a = analyse({ days: o.days, avg: o.avg, bandId: "maintain", personal: p, burn: null });
  assert.deepEqual(a.findings.map((f) => f.id).filter((x) => ["energy", "protein", "carbs-easy", "carbs-hard"].includes(x)), []);
  assert.ok(a.findings.some((f) => f.id === "shape-rest"));
});
