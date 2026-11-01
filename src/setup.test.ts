// DT208 (0.3.49): what the numbers and the plan still need, by name
import { test } from "node:test";
import assert from "node:assert/strict";
import { setupMissing, toSetLine, stepMissing } from "./setup";
const full = { sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, lifestyle: { weekdays: "work" }, plan: Array(7).fill({ work: true, kind: "rest" }) } as any;
test("DT208: a person with everything set has nothing to set", () => {
  assert.deepEqual(setupMissing({ personal: full, safety: { declaredAt: "x" } as any, goal: { band: "maintain" }, region: "munich" }), []);
});
test("DT208: the missing ones by name, in the order a person sets them", () => {
  const m = setupMissing({ personal: { ...full, heightCm: undefined, plan: undefined }, safety: { declaredAt: "x" } as any, goal: null, region: "munich" });
  assert.equal(toSetLine(m), "To set: height, goal, training week");
  assert.equal(m[0].field, "height");
  assert.deepEqual(stepMissing(m, "profile").map((x) => x.label), ["height"]);
  assert.equal(stepMissing(m, "life").length, 0);
});
test("DT208: name, body fat, the coach and Google Calendar are never asked for", () => {
  const m = setupMissing({ personal: { ...full, bodyFatPct: undefined, calendar: undefined }, safety: { declaredAt: "x" } as any, goal: { band: "maintain" }, region: "munich" });
  assert.equal(m.length, 0);
});
