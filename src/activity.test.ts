// DT340 (0.3.182, board Stories282; Go 23 November 2026, 13:15): the client's activity on the coach's card.
import { test } from "node:test";
import assert from "node:assert/strict";

const store = new Map<string, string>();
(globalThis as any).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, String(v)), removeItem: (k: string) => void store.delete(k) };

test("DT340 AC1, AC2: the level of a day", async () => {
  const { levelOf } = await import("./dayBars");
  assert.equal(levelOf({ when: "past", full: true, did: true }), "full");
  assert.equal(levelOf({ when: "past", full: false, did: true }), "active");
  assert.equal(levelOf({ when: "past", full: false, did: false, activity: "active" }), "active", "the plan changed, nothing logged");
  assert.equal(levelOf({ when: "past", full: false, did: false, activity: "opened" }), "opened");
  assert.equal(levelOf({ when: "past", full: false, did: false }), "empty");
  assert.equal(levelOf({ when: "today", full: false, did: false, activity: "opened" }), "opened", "today fills in: opened");
  assert.equal(levelOf({ when: "today", full: false, did: true, activity: "opened" }), "active", "then active once she logs a meal");
  assert.equal(levelOf({ when: "today", full: true, did: true }), "active", "today is never full until it is over");
  assert.equal(levelOf({ when: "future", full: false, did: false, activity: "opened" }), "todo");
});

test("DT340 AC1: the key line names only what shows, today outlined", async () => {
  const { levelCell, levelKeys } = await import("./dayBars");
  const today = "2026-11-26";
  const cells = [levelCell("2026-11-23", today, { full: true, did: true }, []), levelCell("2026-11-24", today, { full: false, did: true }, ["2026-11-24"]),
    levelCell("2026-11-25", today, { full: false, did: false, activity: "opened" }, []), levelCell("2026-11-26", today, { full: false, did: false }, []), levelCell("2026-11-27", today, { full: false, did: false }, [])];
  assert.deepEqual(cells.map((c) => c.level), ["full", "active", "opened", "empty", "todo"]);
  assert.equal(cells[3].today, true);
  assert.deepEqual(levelKeys(cells), ["full", "active", "opened", "empty", "today", "todo", "dot"]);
});

test("DT340 AC6: a full day, with or without a plan", async () => {
  const { fullOf } = await import("./measured");
  const line = (o: Partial<import("./dayLines").DayLine>) => ({ date: "2026-11-25", when: "past", planned: 0, byPlan: 0, swapped: 0, skipped: 0, missed: 0, open: 0, kcal: 1800, protein: 120, target: null, lived: false, slots: [], extras: [], training: null, slotCount: 3, ...o }) as import("./dayLines").DayLine;
  assert.equal(fullOf(line({ planned: 0, byPlan: 3 })), true, "no plan, three meals logged");
  assert.equal(fullOf(line({ planned: 0, byPlan: 2, skipped: 1 })), true, "no plan, two logged, one skipped on purpose");
  assert.equal(fullOf(line({ planned: 0, byPlan: 2 })), false, "a meal not accounted for");
  assert.equal(fullOf(line({ planned: 3, byPlan: 2, missed: 1 })), false, "a planned meal left unanswered");
  assert.equal(fullOf(line({ planned: 0, byPlan: 2, extras: [{ title: "Apple", kcal: 80, protein: 0 }] })), true, "an extra counts for a meal");
  assert.equal(fullOf(line({ planned: 0, skipped: 3 })), false, "nothing eaten is not a full day");
  assert.equal(fullOf(line({ when: "today", byPlan: 3 })), false, "today is not over");
  assert.equal(fullOf(line({ slotCount: undefined, planned: 2, byPlan: 2 })), true, "a line from before 0.2.7: planned and closed");
});

test("DT340: the phone marks the day opened once, active when she does something", async () => {
  store.clear();
  const { markOpened, markActive, getActivity } = await import("./activity");
  const mon = new Date("2026-11-23T08:00:00");
  assert.equal(markOpened(mon), true); assert.equal(markOpened(new Date("2026-11-23T12:00:00")), false, "once a day");
  assert.equal(getActivity().days["2026-11-23"], "opened");
  assert.equal(markActive(new Date("2026-11-23T13:05:00")), true);
  assert.equal(getActivity().days["2026-11-23"], "active");
  assert.equal(getActivity().lastActiveAt, new Date("2026-11-23T13:05:00").toISOString());
  assert.equal(markOpened(new Date("2026-11-24T07:00:00")), true, "a new day");
  assert.equal(getActivity().days["2026-11-23"], "active", "yesterday stays active");
  markOpened(new Date("2026-12-30T07:00:00"));
  const a = getActivity(); assert.ok(Object.keys(a.days).every((k) => k >= "2026-12-02"), "the last 28 days only: " + Object.keys(a.days).join(","));
});

test("DT340 AC4: quiet for 3 days, counted from the coach's today, today left out", async () => {
  const { quietDays } = await import("./activity");
  const a = (open: string) => ({ days: {}, lastActiveAt: null, lastOpenAt: new Date(open).toISOString() });
  assert.equal(quietDays(a("2026-11-22T09:10:00"), "2026-11-26"), 3, "Sunday, then Monday to Wednesday not opened");
  assert.equal(quietDays(a("2026-11-25T09:10:00"), "2026-11-26"), 0);
  assert.equal(quietDays(a("2026-11-26T09:10:00"), "2026-11-26"), 0, "she opened it today: not quiet");
  assert.equal(quietDays({ days: {}, lastActiveAt: null, lastOpenAt: null }, "2026-11-26"), 0, "nothing known: not quiet");
});

test("DT340 AC3: Last active, in words", async () => {
  const { lastActiveText } = await import("./activityWords");
  const now = new Date("2026-11-26T13:30:00");
  const a = (at: string) => ({ days: {}, lastOpenAt: null, lastActiveAt: new Date(at).toISOString() });
  assert.equal(lastActiveText(a("2026-11-26T11:40:00"), now), "Last active: today 11:40");
  assert.equal(lastActiveText(a("2026-11-25T20:15:00"), now), "Last active: yesterday 20:15");
  assert.equal(lastActiveText(a("2026-11-21T19:00:00"), now), "Last active: 5 days ago, Saturday");
  assert.equal(lastActiveText({ days: {}, lastOpenAt: null, lastActiveAt: null }, now), "");
});

test("B159: a day before the phone recorded is not known; a logged day keeps its colour", async () => {
  const { levelOf } = await import("./dayBars");
  assert.equal(levelOf({ when: "past", full: false, did: false, unknown: true }), "unknown");
  assert.equal(levelOf({ when: "past", full: false, did: true, unknown: true }), "active", "AC2: something logged");
  assert.equal(levelOf({ when: "past", full: true, did: true, unknown: true }), "full", "AC2: a full day");
  assert.equal(levelOf({ when: "future", full: false, did: false, unknown: true }), "todo");
  assert.equal(levelOf({ when: "past", full: false, did: false }), "empty", "after the first recorded day: not opened");
});
test("B159 AC4, AC5: the first day recorded is kept beyond the 28 days; none recorded, none known", async () => {
  const { sinceOf, markOpened, activityOut } = await import("./activity");
  assert.equal(sinceOf(null), null); assert.equal(sinceOf({ days: {}, lastActiveAt: null, lastOpenAt: null }), null, "AC5");
  assert.equal(sinceOf({ days: { "2026-11-21": "opened", "2026-11-20": "active" }, lastActiveAt: null, lastOpenAt: null }), "2026-11-20", "a phone from before 0.3.186: its earliest day");
  const store: Record<string, string> = {}; (globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; } };
  markOpened(new Date("2026-11-20T09:00:00"));
  markOpened(new Date("2026-12-30T09:00:00"));
  const a = activityOut();
  assert.equal(a.since, "2026-11-20"); assert.equal(a.days["2026-11-20"], undefined, "the day itself dropped out after 28 days"); assert.equal(sinceOf(a), "2026-11-20");
});
