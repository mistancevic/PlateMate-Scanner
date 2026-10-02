import test from "node:test";
import assert from "node:assert/strict";
import { jobOf, plainLine, todayLine } from "./foodjob";
const f = (name: string, calories: number, protein: number, fats: number, carbs: number, extra: any = {}) => ({ id: name, name, brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "", readyToEat: true, calories, protein, fats, carbs, fiber: 0, ...extra }) as any;
const nutella = f("Nutella", 539, 6.3, 30.9, 57.5), skyr = f("Skyr, natural", 63, 11, 0.2, 4), rice = f("Rice, cooked", 130, 2.7, 0.3, 28), oil = f("Olive oil", 884, 0, 100, 0), flips = f("Protein Flips Salt & Vinegar", 404, 23, 8.4, 56), cucumber = f("Cucumber", 15, 0.7, 0.1, 3);
test("Nutella is a flavour food, a spread", () => { const j = jobOf(nutella); assert.equal(j.job, "Flavour food"); assert.equal(j.note, "spread"); });
test("Skyr is a protein base, rice a carb base, oil a fat source, cucumber volume", () => {
  assert.equal(jobOf(skyr).job, "Protein base"); assert.equal(jobOf(rice).job, "Carb base"); assert.equal(jobOf(oil).job, "Fat source"); assert.equal(jobOf(cucumber).job, "Volume food");
});
test("a label the person set wins", () => { assert.equal(jobOf({ ...flips, job: "Carb base" }).job, "Carb base"); });
test("the plain line says PD against the target and a portion", () => { assert.match(plainLine(nutella, 5.5), /PD 1\.2, below your 5\.5\. It brings the taste.* 20 g is 108 kcal/); });
test("today depends on the day: rest day near the ceiling says not today", () => {
  assert.match(todayLine(nutella, 2600, 2550, "Rest day")!, /more than the 50 kcal left/);
  assert.match(todayLine(nutella, 3300, 1800, "Training day")!, /fits/);
});
