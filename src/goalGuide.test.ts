import { test } from "node:test";
import assert from "node:assert/strict";
import { sheetOf, weightToExpect, nextCheckIn, GUIDES, guideForChat } from "./goalGuide";
import { ALL_BANDS, goalLabel, paceForAge, bandOf, BANDS } from "./goal";
import { calculate } from "./personal";

test("Build muscle has a pace: Steady about 5 % more food, Faster about 10 %; still five goal cards", () => {
  assert.deepEqual(BANDS.map((b) => b.name), ["Recomposition", "Lose fat", "Maintain", "Build muscle", "Performance"]);
  assert.equal(goalLabel("gainsteady"), "Build muscle · Steady"); assert.equal(goalLabel("gain"), "Build muscle · Faster"); assert.equal(goalLabel("maintain"), "Maintain");
  const me: any = { sex: "male", birthYear: 1981, heightCm: 182, weightKg: 96, lifestyle: { move: "sitting" } };
  const m = calculate(me, "maintain")!.kcal, s = calculate(me, "gainsteady")!.kcal, f = calculate(me, "gain")!.kcal;
  assert.ok(Math.abs(s / m - 1.05) < 0.02 && Math.abs(f / m - 1.1) < 0.02, `maintain ${m}, steady ${s}, faster ${f}`);
  assert.ok(calculate(me, "gainsteady")!.days.hard.how.some((l) => /\+ 5 % for Build muscle · Steady/.test(l)));
});
test("training age sets the starting pace: under 1 year Faster, longer Steady", () => {
  assert.equal(paceForAge("u1"), "faster"); assert.equal(paceForAge("1to3"), "steady"); assert.equal(paceForAge("3p"), "steady");
});
test("the weight to expect, in the person's kilos: Steady by training age (Aragon), Faster per week (Iraki et al. 2019)", () => {
  assert.equal(weightToExpect("gainsteady", 96, "3p"), "up 0.25–0.5 kg a month");
  assert.equal(weightToExpect("gainsteady", 96, "1to3"), "up 0.5–1 kg a month");
  assert.equal(weightToExpect("gain", 96), "up 0.25–0.5 kg a week");
  assert.equal(weightToExpect("fatloss", 96), "down 0.5–1 kg a week");
  assert.equal(weightToExpect("gain"), "up 0.25–0.5 % of your weight a week");
});
test("the goal sheet: who set it, what to expect, the next check-in every 4 weeks", () => {
  const now = new Date("2026-10-07T12:00:00Z");
  const sh = sheetOf({ band: "gainsteady", setBy: "you", setAt: "2026-10-07T08:00:00Z" }, { weightKg: 96, trainingAge: "3p", now })!;
  assert.equal(sh.title, "Build muscle · Steady"); assert.match(sh.byLine, /^Set by you on 7 October/);
  assert.equal(sh.food, "about 5 % more than you burn"); assert.equal(sh.progress, "heavier lifts, waist about the same");
  assert.match(sh.checkIn, /^4 November, every 4 weeks/);
  assert.equal(nextCheckIn("2026-08-01T08:00:00Z", now).toISOString().slice(0, 10), "2026-10-24");
  const agreed = sheetOf({ band: "gainsteady", setBy: "you", setAt: "2026-10-07T08:00:00Z" }, { approvedBy: "Coach Milan", approvedAt: "2026-10-08T08:00:00Z", now })!;
  assert.match(agreed.byLine, /^Agreed with Coach Milan on 8 October/);
});
test("every goal has its page, and the chat gets the same food and what to watch", () => {
  for (const b of ALL_BANDS) assert.ok(GUIDES[b.id], `a page for ${b.id}`);
  const g = guideForChat("gainsteady")!;
  assert.equal(g.goal, "Build muscle · Steady"); assert.match(g.food, /0\.4–0\.55 g per kg/);
  assert.equal(bandOf("gainsteady")!.name, "Build muscle");
});
