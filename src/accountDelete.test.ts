import { test } from "node:test";
import assert from "node:assert/strict";
import { deleteAccount, type DeleteDeps, type DeleteStep } from "./accountDelete";

// fake Google: every step records itself; one can be made to fail
function fake(failAt?: DeleteStep | "unlock") {
  const calls: string[] = [];
  const step = (name: string) => async () => { calls.push(name); if (name === failAt) throw new Error(`${name} failed`); };
  const deps: DeleteDeps = { lock: step("lock"), unlock: step("unlock"), files: step("files"), record: step("record"), requests: step("requests"), signin: step("signin"), log: () => {} };
  return { deps, calls };
}

test("delete: all steps, in the safe order, the sign-in last", async () => {
  const { deps, calls } = fake();
  const r = await deleteAccount(deps);
  assert.equal(r.ok, true); assert.equal(r.dataGone, true);
  assert.deepEqual(calls, ["lock", "files", "record", "requests", "signin"]);
});
test("delete: the lock fails, nothing is deleted and the phone keeps everything", async () => {
  const { deps, calls } = fake("lock");
  const r = await deleteAccount(deps);
  assert.equal(r.ok, false); assert.equal(r.dataGone, false); assert.equal(r.failed, "lock");
  assert.deepEqual(calls, ["lock"]);
  assert.match(r.message, /Nothing was deleted/);
});
test("delete: the record fails, the sign-in is unlocked so the person can finish", async () => {
  const { deps, calls } = fake("record");
  const r = await deleteAccount(deps);
  assert.equal(r.failed, "record"); assert.equal(r.dataGone, false);
  assert.deepEqual(calls, ["lock", "files", "record", "unlock"]);
  assert.match(r.message, /stopped at your record/); assert.match(r.message, /Removed so far: your photo files/); assert.match(r.message, /sign in and tap Delete my account again/);
});
test("delete: the requests fail after the record is gone, the phone is cleared", async () => {
  const { deps } = fake("requests");
  const r = await deleteAccount(deps);
  assert.equal(r.failed, "requests"); assert.equal(r.dataGone, true);
});
test("delete: only the sign-in fails, the data is gone and the sign-in stays switched off", async () => {
  const { deps, calls } = fake("signin");
  const r = await deleteAccount(deps);
  assert.equal(r.failed, "signin"); assert.equal(r.dataGone, true);
  assert.ok(!calls.includes("unlock"), "a sign-in without data is not unlocked");
  assert.match(r.message, /Your data is deleted/);
});
test("while a delete runs the phone writes nothing to the account, and a paused write never counts as saved", async () => {
  const cloud = await import("./cloud");
  cloud.pauseAccountWrites(true);
  for (const write of [() => cloud.saveCloud("u", {} as any), () => cloud.saveCards("u", []), () => cloud.uploadPhoto("u", "food~a.jpg", "data:image/jpeg;base64,AA"), () => cloud.deletePhotoFile("u", "food~a.jpg"), () => cloud.markPhotosMoved("u"), () => cloud.dropOldPhotoCopies("u")])
    await assert.rejects(write, /paused while your account is deleted/);
  cloud.pauseAccountWrites(false);
});
