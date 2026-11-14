import { test } from "node:test";
import assert from "node:assert/strict";
import { clientIdentity, fromLine, keepName } from "./clientName";

const j = { uid: "u1", name: "Ana", email: "ana.k@example.com", via: { kind: "form" as const, from: "", src: "qr", at: "2026-11-13T18:00:00.000Z" } };
test("B141: the Profile name wins", () => { const x = clientIdentity("Ana Maria", j); assert.equal(x.name, "Ana Maria"); assert.equal(x.email, "ana.k@example.com"); assert.equal(x.named, true); });
test("B141: no Profile name: the name from the form or the invite", () => { assert.equal(clientIdentity("", j).name, "Ana"); assert.equal(clientIdentity(undefined, j).name, "Ana"); });
test("B141: no name anywhere: the invite's email, never unnamed", () => { const x = clientIdentity("  ", { ...j, name: "" }); assert.equal(x.name, "ana.k@example.com"); assert.equal(x.named, false); });
test("B141: nothing known at all still is not unnamed", () => { assert.doesNotMatch(clientIdentity(null, null).name, /unnamed/i); });
test("B141: where they came from", () => {
  assert.equal(fromLine(j.via), "From the home page form · QR · 13 November");
  assert.equal(fromLine({ kind: "form", from: "worthy-numbers", src: "qr", at: "2026-11-13T18:00:00.000Z" }), "From Worthy Numbers · QR · 13 November");
  assert.equal(fromLine({ kind: "invite", at: "2026-11-14T10:00:00.000Z" }), "From your invite · 14 November");
  assert.equal(fromLine({ kind: "waitlist", at: "2026-11-02T10:00:00.000Z" }), "From the waiting list · 2 November");
  assert.equal(fromLine(null), "");
});
test("B141: an empty Profile name is not saved over a name", () => {
  assert.equal("clientName" in keepName({ clientName: "", goal: 1 }), false);
  assert.equal("clientName" in keepName({ clientName: "   ", goal: 1 }), false);
  assert.deepEqual(keepName({ clientName: "Ana", goal: 1 }), { clientName: "Ana", goal: 1 });
});
