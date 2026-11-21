import { test } from "node:test";
import assert from "node:assert/strict";
import { liveStatus } from "./plateLive";

// B151: Sunday 15 November 2026, 18:00 on the phone; Lunch was at 13:45, Dinner is at 20:00
const today = "2026-11-15", now = 18 * 60;
test("B151: no meal set, nothing is decided", () => assert.equal(liveStatus(null, today, now), null));
test("B151 AC1: a meal of today in the past counts", () => assert.equal(liveStatus({ date: today, time: "13:45" }, today, now), "eaten"));
test("B151 AC2: a meal of today still ahead is a plan", () => assert.equal(liveStatus({ date: today, time: "20:00" }, today, now), "planned"));
test("B151 AC4: a meal at this very minute counts", () => assert.equal(liveStatus({ date: today, time: "18:00" }, today, now), "eaten"));
test("B151: one minute ahead is a plan, there is no window around now", () => assert.equal(liveStatus({ date: today, time: "18:01" }, today, now), "planned"));
test("B151 AC5: a coming day is a plan, whatever the time", () => assert.equal(liveStatus({ date: "2026-11-16", time: "08:00" }, today, now), "planned"));
test("B151 AC6: a past day counts, whatever the time", () => assert.equal(liveStatus({ date: "2026-11-14", time: "20:00" }, today, now), "eaten"));
test("B151: a snack has no time, so it counts as now", () => assert.equal(liveStatus({ date: today, time: null }, today, now), "eaten"));
