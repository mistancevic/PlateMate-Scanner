import { test } from "node:test";
import assert from "node:assert/strict";
import { peopleOf, openOf, handledAt } from "./applications";
const R = (id: string, email: string, createdAt: string, status = "new") => ({ id, name: id, email, createdAt, status });
test("DT279: one per person, the latest request, with how many came before", () => {
  const p = peopleOf([R("a", "Ana@x.com", "2026-11-10T10:00:00Z"), R("b", "ana@x.com", "2026-11-12T10:00:00Z"), R("c", "bo@x.com", "2026-11-11T10:00:00Z", "handled")]);
  assert.deepEqual(p.map((x) => [x.id, x.count]), [["b", 2], ["c", 1]]);
});
test("DT279: open ones only, newest first", () => {
  assert.deepEqual(openOf([R("c", "bo@x.com", "2026-11-11T10:00:00Z", "handled"), R("a", "a@x.com", "2026-11-10T10:00:00Z"), R("d", "d@x.com", "2026-11-12T10:00:00Z")]).map((x) => x.id), ["d", "a"]);
  assert.deepEqual(openOf(null), []);
});
test("DT279: handledAt from a timestamp or a string", () => {
  assert.equal(handledAt({ handledAt: { _seconds: 1794487200 } })?.toISOString(), "2026-11-12T12:40:00.000Z");
  assert.equal(handledAt({ handledAt: "2026-11-12T12:40:00.000Z" })?.toISOString(), "2026-11-12T12:40:00.000Z");
  assert.equal(handledAt({}), null);
});
