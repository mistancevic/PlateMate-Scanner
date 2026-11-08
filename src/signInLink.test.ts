// DT259 (0.3.113, board Stories194; Coach Milan Go 8 November 09:12): sign in by an email link, and Delete my account only
// right after the check that it is you.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { waitLeft, WAIT_AGAIN_S } from "./cloud";
import { signedInRecently, RECENT_S } from "./accountDelete";

test("Send it again waits a minute", () => {
  assert.equal(WAIT_AGAIN_S, 60);
  assert.equal(waitLeft(null, 1000), 0, "nothing sent yet: it may go now");
  assert.equal(waitLeft(0, 0), 60);
  assert.equal(waitLeft(0, 8_200), 52);
  assert.equal(waitLeft(0, 60_000), 0);
});

test("the server deletes only within 15 minutes of a sign-in", () => {
  assert.equal(RECENT_S, 900);
  const now = 1_800_000_000;
  assert.equal(signedInRecently(now - 60, now), true, "a minute ago");
  assert.equal(signedInRecently(now - 900, now), true, "15 minutes ago");
  assert.equal(signedInRecently(now - 901, now), false, "older");
  assert.equal(signedInRecently(0, now), false, "no sign-in time");
  assert.equal(signedInRecently(now + 3600, now), false, "a time in the future");
});

test("the server checks the sign-in time before anything is deleted, and a used invite can never be removed", () => {
  const s = fs.readFileSync("server.ts", "utf8");
  const del = s.slice(s.indexOf('app.post("/api/account/delete"'), s.indexOf("async function deleteAccountOf"));
  assert.ok(del.indexOf("signedInRecently") > 0 && del.indexOf("signedInRecently") < del.indexOf("deleteAccountOf("), "the check comes first");
  const rm = s.slice(s.indexOf('app.delete("/api/invites/:code"'), s.indexOf('app.post("/api/join"'));
  assert.match(rm, /x\.status !== "revoked" && !expired/);
});

test("Delete my account is never a second tap on the same button any more", () => {
  for (const f of ["src/screens/MenuScreen.tsx", "src/components/Welcome.tsx"]) assert.doesNotMatch(fs.readFileSync(f, "utf8"), /tapAgainToDeleteEverything/, f);
});

// 0.3.115 (Coach Milan's test, 8 November 12:13): the link came back and the home page showed. Firebase reads a "link" in the
// address as a link of its own; the real check, not a stand-in, must see the sign-in for both kinds of link
test("Firebase's own check sees the sign-in in the address the link comes back to", async () => {
  const { initializeApp } = await import("firebase/app");
  const { getAuth, isSignInWithEmailLink } = await import("firebase/auth");
  const { continueUrl, LINK_MARK } = await import("./cloud");
  const a = getAuth(initializeApp({ apiKey: "k", projectId: "p", appId: "a", authDomain: "d.firebaseapp.com" }, "linktest"));
  const back = (u: string) => `${u}&apiKey=k&oobCode=abc&mode=signIn&lang=en`;   // what Firebase's page adds
  assert.notEqual(LINK_MARK, "link");
  for (const p of ["signin", "delete"] as const) assert.equal(isSignInWithEmailLink(a, back(continueUrl("https://chefmealan.com", p))), true, p);
  assert.equal(isSignInWithEmailLink(a, back("https://chefmealan.com/?link=signin")), false, "the 0.3.113 marker: not seen");
});
