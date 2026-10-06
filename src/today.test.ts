import test from "node:test";
import assert from "node:assert/strict";
import { dayLog, loggedLine, daysAgo, dayLabel } from "./today";
const food = { id: "s", name: "Skyr", brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "", readyToEat: true, calories: 63, protein: 11, fats: 0.2, carbs: 4, fiber: 0 } as any;
const card = (status: string, day: Date, grams = 300, dayType?: string) => ({ id: Math.random() + "", meal: { id: "m", title: "Bowl", items: [{ id: "i", food, grams, locked: false }], portion: grams, savedAt: "" }, status, taste: "", notes: "", createdAt: new Date(day).toISOString(), dayType }) as any;
test("a day sums only what was eaten and keeps prepared cards apart", () => {
  const today = new Date();
  const log = dayLog([card("eaten", today), card("prepared", today), card("not-used", today), card("eaten", daysAgo(1))], today);
  assert.equal(log.logged.length, 1); assert.equal(log.prepared.length, 1); assert.equal(Math.round(log.kcal), 189); assert.equal(Math.round(log.protein), 33);
});
test("the line is information, never a verdict", () => {
  const today = new Date();
  assert.equal(loggedLine(dayLog([card("eaten", today, 300)], today), true), "1 meal logged, 189 kcal and 33 g protein so far.");
  assert.equal(loggedLine(dayLog([], daysAgo(2)), false), "Nothing logged.");
});
test("day labels", () => { assert.equal(dayLabel(daysAgo(0)), "Today"); assert.equal(dayLabel(daysAgo(1)), "Yesterday"); });
test("the day type comes from the cards of that day", () => { const d = daysAgo(1); assert.equal(dayLog([card("eaten", d, 300, "training")], d).dayType, "training"); });

test("five bands, every edge a multiple of the target: a bit under is on plan", async () => {
  const { fit, bandRange } = await import("./goal");
  const T = 5.5;
  assert.equal(fit(1.6, T), "below");   // Leibniz
  assert.equal(fit(3.5, T), "close");   // oats, 0.64 T
  assert.equal(fit(5.0, T), "plan");    // 0.91 T, a bit under: on plan
  assert.equal(fit(8.0, T), "plan");
  assert.equal(fit(12.0, T), "high");   // cottage cheese
  assert.equal(fit(17.5, T), "top");    // skyr
  assert.equal(fit(12.0, 7), "high");   // the same cottage cheese on a lose-fat target
  assert.equal(fit(12.0, 3.5), "top");   // 3.4 T on a high-energy target
  assert.equal(bandRange("plan", T), "5.0 to 8.3");
});

test("the line under the chips says the range and the partner, for the current target", async () => {
  const { bandHint, BAND_LABEL, BAND_LINE_IDLE } = await import("./goal");
  assert.equal(BAND_LABEL.below, "Low\u2212"); assert.equal(BAND_LABEL.close, "Low");
  assert.equal(bandHint("below", 5.3), "Low\u2212: PD under 3.2 \u00b7 your target 5.3");
  assert.equal(bandHint("plan", 5.3), "On plan: PD 4.8 to 8.0 \u00b7 your target 5.3");
  assert.equal(bandHint("top", 5.3), "High+: PD 13.3 and up \u00b7 your target 5.3");
  assert.equal(bandHint("plan", null), BAND_LINE_IDLE);
});

test("each day its own: life once, training per day, the average over the week", async () => {
  const { calculate, ownDayNumbers } = await import("./personal");
  const me: any = { sex: "male", birthYear: new Date().getFullYear() - 45, heightCm: 182, weightKg: 95, life: "desk", week: { passive: 2, active: 1, easy: 2, hard: 2 } };
  const c = calculate(me, "maintain", null)!;
  assert.equal(c.days.passive.kcal, 2450);   // 1,868 at rest × 1.3 for a desk
  assert.equal(c.days.active.kcal, 2600);    // + a 45-minute walk at 3.5 METs
  assert.equal(c.days.easy.kcal, 2800);      // + 60 minutes at 5 METs
  assert.equal(c.days.hard.kcal, 3250);      // + 75 minutes at 8 METs
  // from 6 October 2026 the average comes from the Weekly plan; old counts become a starting plan (strength for the
  // training days, a walk for the active one), so the average moves a little from 2,800
  assert.equal(c.kcal, 2750, "the week's average, from the starting plan");
  assert.equal(c.protein, 180, "1.6 to 2.2 g per kg because he trains");
  assert.ok(c.days.hard.carbs > c.days.passive.carbs && c.days.hard.fats === c.days.passive.fats && c.days.hard.protein === c.days.passive.protein, "carbs carry the difference");
  assert.ok(c.days.hard.how.some((l) => /8 METs/.test(l)) && /Mifflin/.test(c.days.hard.how[0]), "each day says how");
  const notTraining = calculate({ ...me, week: { passive: 5, active: 2, easy: 0, hard: 0 } }, "maintain", null)!;
  assert.equal(notTraining.protein, 135, "1.2 to 1.6 g per kg without training");
  // the goals differ: performance more calories and a lower fat share, build muscle more calories, maintain neither
  const perf = calculate(me, "performance", null)!, gain = calculate(me, "gain", null)!;
  assert.ok(perf.kcal > c.kcal && gain.kcal > perf.kcal && perf.fats / perf.kcal < c.fats / c.kcal);
  // own numbers, each day its own: typed rows win, an empty one is calculated
  const own = ownDayNumbers({ ...me, ownDays: { passive: { kcal: 2300, protein: 170 }, hard: { kcal: 3400, protein: 190 } } }, "maintain", null)!;
  assert.equal(own.days.passive.kcal, 2300); assert.equal(own.days.passive.source, "you");
  assert.equal(own.days.easy.source, "calculated"); assert.equal(own.days.easy.kcal, 2800);
  assert.equal(ownDayNumbers({ ...me, ownDays: {} }, "maintain", null), null, "nothing typed, nothing to save");
});

test("old profiles and goals move over", async () => {
  const { weekOf, lifeOf, dayModeOf } = await import("./personal");
  const { bandOf, BANDS } = await import("./goal");
  assert.deepEqual(weekOf({ activity: "moderate" } as any), { passive: 2, active: 1, easy: 2, hard: 2 });
  assert.equal(lifeOf({} as any), "desk");
  assert.equal(dayModeOf({ dayMode: "follow" } as any), "each");
  assert.equal(bandOf("longevity")!.id, "maintain"); assert.equal(bandOf("energy")!.id, "performance");
  assert.deepEqual(BANDS.map((b) => b.name), ["Lose fat", "Recomposition", "Maintain", "Build muscle", "Performance"]);
});

test("the home page's Try it uses the app's lift: 40 g chocolate spread needs 125 g skyr for PD 5.5", async () => {
  const { lift, WANTS, HAVES } = await import("./landing");
  const r = lift(WANTS[0], HAVES[0], 5.5);
  assert.equal(r.grams, 125); assert.equal(r.kcal, 294); assert.equal(Math.round(r.protein), 16); assert.equal(r.pd, 5.5);
});
