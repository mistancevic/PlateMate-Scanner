import test from "node:test";
import assert from "node:assert/strict";
import { blocksOn, asksOn, askKey, dayBefore, pruneCal } from "./busy";

const ms = (date: string, t: string) => new Date(`${date}T${t}:00`).getTime();
const slots = [{ id: "breakfast", name: "Breakfast", time: "06:30" }, { id: "lunch", name: "Lunch", time: "13:15" }, { id: "dinner", name: "Dinner", time: "20:00" }];
const D = "2026-11-02";

test("DT179: busy blocks of a date, merged and clipped to the day", () => {
  const b = blocksOn(D, [{ s: ms(D, "13:00"), e: ms(D, "14:00") }, { s: ms(D, "13:30"), e: ms(D, "14:30") }, { s: ms("2026-11-01", "23:00"), e: ms(D, "01:00") }, { s: ms("2026-11-03", "09:00"), e: ms("2026-11-03", "10:00") }]);
  assert.deepEqual(b, [{ from: 0, to: 60 }, { from: 780, to: 870 }]);
});

test("DT179: a meal in a meeting asks before or after; never into another block or onto another meal", () => {
  const a = asksOn(D, slots, null, [{ from: 780, to: 870 }]);
  assert.equal(a.length, 1);
  assert.deepEqual({ ...a[0], block: undefined }, { kind: "meal", slotId: "lunch", name: "Lunch", time: "13:15", block: undefined, before: "12:30", after: "14:30" });
  // the hour before is busy too: only after
  const b = asksOn(D, slots, null, [{ from: 700, to: 760 }, { from: 780, to: 870 }]);
  assert.equal((b[0] as any).before, null); assert.equal((b[0] as any).after, "14:30");
});

test("DT179: a late evening before dinner, a full day, training in a busy block", () => {
  const late = asksOn(D, slots, null, [{ from: 17 * 60, to: 19 * 60 + 30 }]);
  assert.equal(late[0].kind, "late"); assert.equal((late[0] as any).free, 30);
  const full = asksOn(D, slots, null, [{ from: 8 * 60, to: 20 * 60 - 30 }]);
  assert.equal(full[0].kind, "carry"); assert.equal((full[0] as any).slotId, "lunch");
  const tr = asksOn(D, slots, { work: true, kind: "strength", at: "17:30", minutes: 60 } as any, [{ from: 17 * 60, to: 18 * 60 + 30 }]);
  const t = tr.find((x) => x.kind === "training") as any;
  assert.equal(t.move, "18:30");
});

test("DT179: Keep it keeps it: the same question is not asked again for that date", () => {
  const blocks = [{ from: 780, to: 870 }];
  const a = asksOn(D, slots, null, blocks);
  assert.equal(asksOn(D, slots, null, blocks, [askKey(D, a[0])]).length, 0);
  assert.equal(asksOn("2026-11-03", slots, null, blocks, [askKey(D, a[0])]).length, 1);
});

test("DT179: the day before; kept and moved for dates gone by drop off", () => {
  assert.equal(dayBefore("2026-11-01"), "2026-10-31");
  const c = pruneCal({ kept: ["2026-10-30|meal|lunch", "2026-11-02|meal|lunch"], moved: { "2026-10-29|dinner": "20:00", "2026-11-06|dinner": "20:00" }, ahead: {} }, "2026-10-31");
  assert.deepEqual(c.kept, ["2026-11-02|meal|lunch"]); assert.deepEqual(Object.keys(c.moved!), ["2026-11-06|dinner"]);
});
