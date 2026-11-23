// B156 (0.3.181, board Stories281; Go 23 November 2026, 12:43): Clients keeps the names it knew when the invites do not load.
import { test } from "node:test";
import assert from "node:assert/strict";

const store = new Map<string, string>();
(globalThis as any).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, String(v)), removeItem: (k: string) => void store.delete(k) };
const SARA = { uid: "c3", name: "Sara Novak", email: "sara.novak@example.com", via: { kind: "invite" as const, at: "2026-11-20T10:00:00Z" } };
const ok = (joined: unknown[]) => async () => new Response(JSON.stringify({ invites: [], joined }), { status: 200 });
const down = async () => new Response("", { status: 503 });
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

test("B156 AC3: No name yet stays whole; any other name gives its first word", async () => {
  const { firstOf } = await import("./clientName");
  assert.equal(firstOf("No name yet"), "No name yet");
  assert.equal(firstOf("Sara Novak"), "Sara");
  assert.equal(firstOf("sara.novak@example.com"), "sara.novak@example.com");
});

test("B156 AC1: the last good answer is kept and used when the request fails", async () => {
  store.clear();
  const { joinedNames } = await import("./clientName");
  const first = await joinedNames("coach1", undefined, ok([SARA]));
  assert.equal(first.fresh, true); assert.equal(first.joined.get("c3")?.name, "Sara Novak");
  const failed = await joinedNames("coach1", undefined, down);
  assert.equal(failed.fresh, false); assert.equal(failed.joined.get("c3")?.email, "sara.novak@example.com");
  const other = await joinedNames("coach2", undefined, down);
  assert.equal(other.joined.size, 0, "kept per coach");
});

test("B156 AC4: a new answer replaces the kept one", async () => {
  store.clear();
  const { joinedNames } = await import("./clientName");
  await joinedNames("coach1", undefined, ok([SARA]));
  await joinedNames("coach1", undefined, ok([{ ...SARA, name: "Sara Horvat" }]));
  assert.equal((await joinedNames("coach1", undefined, down)).joined.get("c3")?.name, "Sara Horvat");
});

test("B156 AC2: a failed request is asked once more a moment later, and onLate runs when the answer comes", async (t) => {
  store.clear();
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { joinedNames, RETRY_MS } = await import("./clientName");
  let calls = 0, late = 0;
  const get = async () => (++calls === 1 ? down() : ok([SARA])());
  let got: unknown = null;
  const r = await joinedNames("coach1", (list) => { late++; got = list; }, get);
  assert.equal(r.fresh, false); assert.equal(r.joined.size, 0, "never seen: nothing kept yet");
  t.mock.timers.tick(RETRY_MS);
  t.mock.timers.reset();
  await wait(20);
  assert.equal(calls, 2, "asked once more"); assert.equal(late, 1, "onLate ran");
  assert.equal((got as any[])[0].name, "Sara Novak", "onLate gets the answer");
  const again = await joinedNames("coach1", undefined, async () => { calls++; return down(); }, got as any);
  assert.equal(calls, 2, "drawn again with that answer, not asked a third time"); assert.equal(again.joined.get("c3")?.name, "Sara Novak");
  assert.equal((await joinedNames("coach1", undefined, down)).joined.get("c3")?.name, "Sara Novak", "the late answer is kept");
});

test("B156 AC2: one more try, not more", async (t) => {
  store.clear();
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { joinedNames, RETRY_MS } = await import("./clientName");
  let calls = 0, late = 0;
  await joinedNames("coach1", () => { late++; }, async () => { calls++; return down(); });
  t.mock.timers.tick(RETRY_MS * 5);
  t.mock.timers.reset();
  await wait(20);
  assert.equal(calls, 2); assert.equal(late, 0);
});
