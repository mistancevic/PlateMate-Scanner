import test from "node:test";
import assert from "node:assert/strict";
import { daysAway, sinceWords, endTravel, travelOn, awayWords, AWAY_KITCHENS, type Travel } from "./travel";

const t: Travel = { place: "belgrade", kitchen: "hotel", since: "2026-10-29T08:00:00Z", weighPaused: true };
test("days away count the first day and today", () => {
  assert.equal(daysAway(t.since, new Date("2026-10-29T20:00:00")), 1);
  assert.equal(daysAway(t.since, new Date("2026-11-01T09:00:00")), 4);
  assert.equal(sinceWords(t.since, new Date("2026-10-29T20:00:00")), "since today");
  assert.equal(sinceWords(t.since, new Date("2026-10-31T09:00:00")), "since Thursday");
  assert.equal(sinceWords(t.since, new Date("2026-11-12T09:00:00")), "since 29 October");
});
test("turning off keeps the trip; a day is marked travel by it, or by the travel on now", () => {
  const trips = endTravel(t, [], new Date("2026-11-01T18:00:00"));
  assert.deepEqual(trips, [{ place: "belgrade", kitchen: "hotel", from: "2026-10-29", to: "2026-11-01" }]);
  assert.equal(travelOn("2026-10-30", trips, null)?.place, "belgrade");
  assert.equal(travelOn("2026-11-02", trips, null), null);
  assert.equal(travelOn("2026-11-05", trips, { ...t, since: "2026-11-04T07:00:00Z" })?.kitchen, "hotel");
  assert.equal(endTravel(t, Array.from({ length: 25 }, () => trips[0])).length, 20);
});
test("Chef Mealan is told the kitchen and the place in fixed words", () => {
  assert.equal(awayWords(t), "a hotel with no kitchen, in Belgrade");
  assert.equal(awayWords(null), null);
  assert.ok(AWAY_KITCHENS.every((k) => awayWords({ ...t, kitchen: (["hotel", "flat", "family"] as const)[AWAY_KITCHENS.indexOf(k)] })!.startsWith(k)));
});
