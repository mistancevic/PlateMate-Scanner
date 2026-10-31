// DT196 (0.3.37, tracker f16): a phone that has not opened the app for 30 days signs out
import test from "node:test";
import assert from "node:assert/strict";
import { daysSince, idleOut, IDLE_DAYS, IDLE_LINE } from "./idle";

const now = new Date("2026-11-05T12:00:00Z");
test("days since the last open", () => {
  assert.equal(daysSince(null, now), null);
  assert.equal(daysSince("not a date", now), null);
  assert.equal(daysSince("2026-11-05T09:00:00Z", now), 0);
  assert.equal(daysSince("2026-10-06T12:00:00Z", now), 30);
});
test("the phone signs out at 30 days, never before, never without a date", () => {
  assert.equal(IDLE_DAYS, 30);
  assert.equal(idleOut(null, now), false);
  assert.equal(idleOut("2026-10-07T12:00:01Z", now), false);   // 29 days
  assert.equal(idleOut("2026-10-06T12:00:00Z", now), true);    // 30 days
  assert.equal(idleOut("2025-01-01T00:00:00Z", now), true);
});
test("the sign-in page's line says the days and that nothing is lost", () => {
  assert.match(IDLE_LINE, /30 days/); assert.match(IDLE_LINE, /Your data is in your account/);
});
