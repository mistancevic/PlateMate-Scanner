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

// B155 (0.3.173, board B155): a request from a person already invited or already a client is not a new request
import { inviteOf, withInvites, isOpen, askedAgain, signInMail } from "./applications";
const NOW = "2026-11-22T09:38:00.000Z";
const inv = (o: object) => ({ email: "nina@example.com", status: "open", code: "ABC123", coachName: "Milan", createdAt: "2026-11-20T10:00:00.000Z", expiresAt: "2026-12-20T10:00:00.000Z", ...o });
const rq = (id: string, at: string, status = "new") => ({ id, name: "Nina", email: "nina@example.com", createdAt: at, status });
test("B155: no invite for the email: nothing is said, the request waits", () => {
  assert.equal(inviteOf("nina@example.com", [inv({ email: "other@example.com" })], NOW), null);
  assert.equal(openOf(withInvites([rq("r1", "2026-11-20T09:10:00.000Z")], [], NOW)).length, 1);
});
test("B155 AC1: she joined with a code: her second form is not a new request", () => {
  const list = withInvites([rq("r2", "2026-11-21T18:30:00.000Z"), rq("r1", "2026-11-20T09:10:00.000Z", "handled")], [inv({ status: "used" })], NOW);
  assert.equal(list[0].invite?.status, "used");
  assert.equal(openOf(list).length, 0);
  assert.equal(peopleOf(list)[0].count, 2);
});
test("B155 AC2: a code is out and not used: her second form is not a new request, and the code is known", () => {
  const list = withInvites([rq("r2", "2026-11-21T18:30:00.000Z")], [inv({})], NOW);
  assert.deepEqual(list[0].invite, { status: "open", at: "2026-11-20T10:00:00.000Z", code: "ABC123", coachName: "Milan" });
  assert.equal(openOf(list).length, 0);
});
test("B155: used wins over a newer open code; the email is matched whatever its capitals", () => {
  assert.equal(inviteOf("Nina@Example.com", [inv({ createdAt: "2026-11-21T10:00:00.000Z" }), inv({ status: "used" })], NOW)?.status, "used");
});
test("B155: a revoked or an expired code says nothing, so a request after it is new again", () => {
  assert.equal(inviteOf("nina@example.com", [inv({ status: "revoked" })], NOW), null);
  assert.equal(inviteOf("nina@example.com", [inv({ expiresAt: "2026-11-21T10:00:00.000Z" })], NOW), null);
  assert.equal(openOf(withInvites([rq("r2", "2026-11-21T18:30:00.000Z")], [inv({ status: "revoked" })], NOW)).length, 1);
});
test("B155 AC4, AC5: only a request that came after the invite is answered by mail", () => {
  const [after, before] = withInvites([rq("r2", "2026-11-21T18:30:00.000Z"), rq("r1", "2026-11-20T09:10:00.000Z")], [inv({})], NOW);
  assert.equal(askedAgain(after), true); assert.equal(askedAgain(before), false);
  assert.equal(askedAgain(rq("r3", "2026-11-21T18:30:00.000Z")), false);
});
test("B155 AC7: an invite made by hand closes the request that was waiting", () => {
  const list = withInvites([rq("r1", "2026-11-20T09:10:00.000Z")], [inv({})], NOW);
  assert.equal(isOpen(list[0]), false); assert.equal(askedAgain(list[0]), false);
});
test("B155 AC5: the mail for a person who is already a client names her address and asks for no code", () => {
  const m = decodeURIComponent(signInMail({ email: "nina@example.com", name: "Nina" }, "Milan"));
  assert.ok(m.startsWith("mailto:nina@example.com?subject=You already have access to Chef Mealan"));
  assert.ok(/Sign in with Google using this email address: nina@example\.com/.test(m) && /No code is needed again\./.test(m) && !/ABC123/.test(m));
});
