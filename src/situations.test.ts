import test from "node:test";
import assert from "node:assert/strict";
import { sleepCase, eveningOf } from "./situations";
import { buildIndex, searchIndex, SLEEP_PAGE } from "./explorerBody";
import type { Personal } from "./personal";
import type { Feedback } from "./pilot";

const personal = { lifestyle: { meals: 3, wake: "early", bed: "mid", weekdays: "work", hours: "fixed", slot: "9-5" }, plan: [{ work: true, kind: "strength", intensity: "hard", at: "17:30" }, { work: true, kind: "rest" }, { work: true, kind: "rest" }, { work: true, kind: "rest" }, { work: true, kind: "rest" }, { work: false, kind: "rest" }, { work: false, kind: "rest" }] } as unknown as Personal;
const eaten = (date: string, time: string, title: string, which = "", foods: string[] = []): Feedback => ({ id: `${date}${time}`, status: "eaten", createdAt: `${date}T${time}:00`, which, taste: "", notes: "", meal: { id: "m", title, items: foods.map((n) => ({ id: n, grams: 100, locked: false, food: { id: n, name: n, calories: 100, protein: 5, carbs: 10, fats: 2 } as any })), portion: 100, savedAt: "" } as any });
const monday = new Date("2026-11-02T08:00:00");

test("DT180: the evening of a date from the record: late meals, the dinner's clock, coffee after 14:00, a drink", () => {
  const fb = [eaten("2026-11-01", "20:10", "Chicken rice bowl", "dinner"), eaten("2026-11-01", "22:40", "Chocolate"), eaten("2026-11-01", "16:30", "Coffee", "", ["Coffee, black"]), eaten("2026-11-01", "20:10", "Beer", "", ["Beer, lager"])];
  assert.deepEqual(eveningOf(fb, "2026-11-01"), { late: 1, dinner: "20:10", coffeeLate: true, drink: true });
  assert.deepEqual(eveningOf(fb, "2026-11-02"), { late: 0, dinner: null, coffeeLate: false, drink: false });
});

test("DT180: your case, five parts, from the settings and the week", () => {
  const fb = [eaten("2026-10-30", "20:00", "Bowl", "dinner"), eaten("2026-10-31", "20:30", "Bowl", "dinner"), eaten("2026-11-01", "21:40", "Bowl", "dinner"), eaten("2026-10-31", "22:30", "Chocolate"), eaten("2026-11-01", "22:30", "Chocolate")];
  const c = sleepCase(personal, fb, monday);
  assert.equal(c.parts.length, 5);
  assert.match(c.parts[0].body, /Bed 22:00 to midnight, up before 6:00/);
  assert.match(c.parts[0].body, /Training today: Strength, hard, at 17:30/);
  assert.match(c.parts[1].body, /Dinner eaten at 20:00, 20:30, 21:40/);
  assert.match(c.parts[1].body, /after 21:30 on 2 evenings/);
  assert.match(c.parts[2].body, /last night was short/);
  assert.match(c.parts[4].body, /Bed by 23:00/);
  // the trend: 50 minutes a day, carried on; the trajectory: bed by 23:00; the gap: dinner back at 20:00
  assert.match(c.trend!, /about 50 minutes later each day/);
  assert.match(c.trend!, /bed by 23:00/);
  assert.match(c.trend!, /dinner back at 20:00/);
  assert.deepEqual(c.taps.map((t) => t.id), ["protein", "snack", "easy"]);
  assert.match(c.taps[2].label, /easy, or a walk/);
  assert.equal(c.hasSnackSlot, false);
  assert.equal(c.weekQuestion, false);
});

test("DT180: three late nights make it a week question; an empty record says so", () => {
  const fb = ["2026-10-28", "2026-10-30", "2026-11-01"].map((d) => eaten(d, "22:45", "Snack"));
  assert.equal(sleepCase(personal, fb, monday).weekQuestion, true);
  const c = sleepCase(personal, [], monday);
  assert.match(c.parts[1].body, /Nothing in the record points at the evenings/);
  assert.equal(c.trend, null);
});

test("DT180: every line with a number names its paper; the wellness line is on the page", () => {
  for (const l of [...SLEEP_PAGE.effects, ...SLEEP_PAGE.causes]) if (/\d/.test(l.text)) assert.ok(l.src, l.title);
  assert.match(SLEEP_PAGE.line, /see your doctor/);
  assert.doesNotMatch(JSON.stringify(SLEEP_PAGE), /insomnia|depress|anxiety|diabet/i);
});

test("Explorer search: a food, a member, a situation, a line, a claim; the title first", () => {
  const index = buildIndex({ nutrients: [{ family: "protein", name: "Protein", hint: "Not all proteins are equal", members: ["Leucine"], foods: ["Chicken breast", "Lentils"] }] });
  assert.equal(searchIndex(index, "leuc")[0].title, "Leucine");
  assert.equal(searchIndex(index, "lentil")[0].kind, "food");
  assert.equal(searchIndex(index, "sleep")[0].title, "A bad night's sleep");
  assert.ok(searchIndex(index, "385").some((h) => h.title.includes("385 kcal")));
  assert.ok(searchIndex(index, "coffee").some((h) => h.title === "Coffee after 14:00"));
  assert.ok(searchIndex(index, "gut").some((h) => h.title === "The gut"));
  assert.equal(searchIndex(index, "x").length, 0);
  assert.ok(searchIndex(index, "a bad night").length <= 12);
});
