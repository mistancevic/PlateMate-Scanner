// DT338 (0.3.179, board Stories279; Go 23 November 2026, 10:42): what the PD colours mean, one scale in the person's own
// numbers. The ranges follow the target (AC1, AC5); the mark sits where the plate is (AC2).
import { test } from "node:test";
import assert from "node:assert/strict";

const pd = (protein: number, kcal: number) => (protein / kcal) * 100;

test("DT338 AC1: the five ranges for target 5.3", async () => {
  const { bandRange, SCALE_BANDS } = await import("./goal");
  assert.deepEqual(SCALE_BANDS.map((b) => bandRange(b, pd(106, 2000))), ["under 3.2", "3.2 to 4.8", "4.8 to 8.0", "8.0 to 13.3", "13.3 and up"]);
});

test("DT338 AC5: the ranges follow the goal, Recomposition and Build muscle, Steady", async () => {
  const { bandRange, fit, SCALE_BANDS } = await import("./goal");
  const recomp = pd(145, 2300), gain = pd(130, 2600);
  assert.deepEqual(SCALE_BANDS.map((b) => bandRange(b, recomp)), ["under 3.8", "3.8 to 5.7", "5.7 to 9.5", "9.5 to 15.8", "15.8 and up"]);
  assert.deepEqual(SCALE_BANDS.map((b) => bandRange(b, gain)), ["under 3.0", "3.0 to 4.5", "4.5 to 7.5", "7.5 to 12.5", "12.5 and up"]);
  assert.equal(fit(8.4, recomp), "plan", "one egg at PD 8.4 is On plan for Recomposition");
  assert.equal(fit(8.4, gain), "high", "the same egg is High for Build muscle");
});

test("DT338 AC2: the mark sits in the plate's band, each band a fifth of the bar", async () => {
  const { scaleAt, fit, SCALE_BANDS } = await import("./goal");
  const t = 5.3;
  for (const x of [0, 1, 3.5, 5, 8.4, 14, 30]) {
    const at = scaleAt(x, t)!;
    assert.ok(at >= 0 && at <= 100, `in the bar: ${x} at ${at}`);
    assert.equal(SCALE_BANDS[Math.min(4, Math.floor(at / 20))], fit(x, t), `PD ${x} at ${at}`);
  }
  assert.equal(scaleAt(t * 0.9, t), 40, "On plan starts at 40 %");
  assert.equal(scaleAt(100, t), 100, "far above stays at the end");
  assert.equal(scaleAt(null, t), null);
  assert.equal(scaleAt(8, null), null);
  assert.equal(scaleAt(8, 0), null);
});
