// 0.3.157 (DT308.1, DT308.4 to DT308.6, DT308.11): the Plate's calendar, its rows and the guess marked at Ate it.
import test from "node:test";
import assert from "node:assert/strict";
import { calDays, calRows, calGuess } from "./plateCal";

const slots = [{ id: "breakfast", name: "Breakfast", time: "07:30" }, { id: "lunch", name: "Lunch", time: "13:45" }, { id: "dinner", name: "Dinner", time: "20:00" }];
const now = new Date(2026, 10, 15, 18, 0); // Sunday 15 November 2026, 18:00
const st = (rows: ReturnType<typeof calRows>) => rows.map((r) => `${r.name}:${r.state}${r.off ? ":off" : ""}`).join(" ");

test("A3: the days are yesterday, today, tomorrow and the day after; a day picked outside them joins in order", () => {
  assert.deepEqual(calDays("2026-11-15", "2026-11-15"), ["2026-11-14", "2026-11-15", "2026-11-16", "2026-11-17"]);
  assert.deepEqual(calDays("2026-11-15", "2026-11-10"), ["2026-11-10", "2026-11-14", "2026-11-15", "2026-11-16", "2026-11-17"]);
});
test("A3: today's meals say their state: not eaten, next, and a snack off the plan now", () => {
  const rows = calRows({ date: "2026-11-15", now, slots, eaten: {}, planned: undefined, mode: "line" });
  assert.equal(st(rows), "Breakfast:notEaten Lunch:notEaten Dinner:next Snack:now");
  assert.equal(rows[3].id, null);
});
test("A3: a meal eaten says so; a planned meal to come says what it holds", () => {
  const rows = calRows({ date: "2026-11-15", now, slots, eaten: { lunch: ["Rice & Chicken breast"] }, planned: { dinner: { title: "Sarma" } }, mode: "line" });
  assert.equal(st(rows), "Breakfast:notEaten Lunch:eaten Dinner:planned Snack:now");
  assert.equal(rows[2].holds, "Sarma");
});
test("D2, D3: a coming day says nothing planned or what is planned; no snack row on a day with no snack among its meals", () => {
  const rows = calRows({ date: "2026-11-16", now, slots, eaten: {}, planned: { lunch: { title: "Rice & Chicken breast" } }, mode: "plan" });
  assert.equal(st(rows), "Breakfast:free Lunch:planned Dinner:free");
  const four = calRows({ date: "2026-11-16", now, slots: [...slots, { id: "snack", name: "Snack", time: "16:00" }], eaten: {}, planned: undefined, mode: "plan" });
  assert.ok(four.some((r) => r.id === "snack" && r.state === "free"));
});
test("C5, D2: Plan it cannot pick a meal gone by; Ate it cannot pick a coming day", () => {
  assert.equal(st(calRows({ date: "2026-11-15", now, slots, eaten: {}, planned: undefined, mode: "plan" })), "Breakfast:notEaten:off Lunch:notEaten:off Dinner:next");
  assert.ok(calRows({ date: "2026-11-16", now, slots, eaten: {}, planned: undefined, mode: "ate" }).every((r) => r.off));
});
test("C3: a day gone by, at Ate it: eaten or not eaten, and the snack at the photo's time", () => {
  const rows = calRows({ date: "2026-11-14", now, slots, eaten: { breakfast: ["Oats"], dinner: ["Sarma"] }, planned: undefined, mode: "ate", photoAt: new Date(2026, 10, 14, 15, 57) });
  assert.equal(st(rows), "Breakfast:eaten Lunch:notEaten Dinner:eaten Snack:at");
  assert.equal(rows[3].time, "15:57");
  assert.equal(calRows({ date: "2026-11-14", now, slots, eaten: {}, planned: undefined, mode: "line" }).length, 3, "the pencil sets a meal of the day: no snack off the plan on a day gone by");
});
test("C2, D8: the guess from the clock: at 18:00 dinner", () => {
  assert.equal(calGuess(slots, {}, now), "dinner");
});
test("C3: the guess from an older photo: Saturday 15:57, lunch not eaten, so lunch; with lunch eaten, a snack", () => {
  const at = new Date(2026, 10, 14, 15, 57);
  assert.equal(calGuess(slots, {}, at), "lunch");
  assert.equal(calGuess(slots, { lunch: ["Rice"] }, at), null);
  assert.equal(calGuess([...slots, { id: "snack", name: "Snack", time: "16:00" }], { lunch: ["Rice"] }, new Date(2026, 10, 14, 14, 0)), "snack", "a day with a snack among its meals: that snack");
  assert.equal(calGuess([], {}, at), undefined);
});
