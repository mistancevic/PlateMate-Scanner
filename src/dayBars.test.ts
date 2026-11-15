import test from "node:test";
import assert from "node:assert/strict";
import { weekCells, phaseCells, rowsOf, keysOf } from "./dayBars";

test("DT302: a week is one row, Monday to Sunday, the weekend shaded; lived is good, a past planned day not lived is worth a look", () => {
  const keys = ["2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13", "2026-11-14", "2026-11-15"];
  const days = keys.map((key, i) => ({ key, today: i === 5, past: i < 5, lived: i === 1 || i === 3, planned: i < 6 }));
  const c = weekCells(days, ["2026-11-10", "2026-11-14"]);
  assert.deepEqual(c.map((x) => x.state), ["look", "good", "look", "good", "look", "today", "none"]);
  assert.deepEqual(c.map((x) => x.weekend), [false, false, false, false, false, true, true]);
  assert.deepEqual(c.map((x) => x.weighed), [false, true, false, false, false, true, false]);
  assert.equal(rowsOf(c).length, 1);
  assert.deepEqual(keysOf(c), ["good", "look", "today", "dot", "weekend"]);
});

test("DT302: the first two weeks are two rows of seven from the first day; the weekend falls where the dates put it", () => {
  // started on Friday 13 November: Saturday and Sunday are the second and third bar of both rows
  const sq = Array.from({ length: 14 }, (_, i) => { const d = new Date("2026-11-13T12:00:00"); d.setDate(d.getDate() + i); return { date: d.toISOString().slice(0, 10), state: (i === 0 ? "part" : i === 1 ? "today" : "todo") as "part" | "today" | "todo", weighed: false }; });
  const rows = rowsOf(phaseCells(sq));
  assert.equal(rows.length, 2); assert.equal(rows[0].length, 7); assert.equal(rows[1].length, 7);
  assert.deepEqual(rows[0].map((x) => x.weekend), [false, true, true, false, false, false, false]);
  assert.deepEqual(rows[1].map((x) => x.weekend), [false, true, true, false, false, false, false]);
  assert.deepEqual(rows[0].slice(0, 3).map((x) => x.state), ["look", "today", "none"]);
  assert.deepEqual(keysOf(rows.flat()), ["look", "today", "weekend"], "no green and no dot yet: the key does not name them");
});
