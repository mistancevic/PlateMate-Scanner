// DT168 (0.3.10, board Stories120): the record in two parts; the coach's part holds only what the coach needs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { splitSave, mergeLoad, coachFieldsOf, onPreviewHost, dropsOldCopy, PRIVATE_KEYS } from "./privateSplit";

const save = { state: { goals: { calories: 2500, protein: 160 }, foods: [{ id: "f1" }], preferences: "no coriander" },
  personal: { sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, bodyFatPct: 18, weighIns: [{ date: "2026-10-29", kg: 85 }], pdUnit: "pd", trainingAge: "3p" },
  safety: { situations: ["diabetes"], allergies: ["peanuts"], flags: [{ situation: "diabetes", at: "2026-10-20T16:00:00Z", source: "door" }], declarations: [{ at: "x", situations: [], allergies: ["peanuts"] }], consentBy: "self" },
  region: "de", goneFoods: ["f9"], goal: { band: "maintain" }, clientName: "Tester 1", days: {}, updatedAt: "2026-10-30T12:00:00Z" };

test("DT168: private fields leave the main record; the coach's part holds only what the coach needs", () => {
  const { priv, main, drop } = splitSave(save, false);
  assert.deepEqual(Object.keys(priv!).sort(), [...PRIVATE_KEYS, "updatedAt"].sort());
  assert.deepEqual(drop.sort(), [...PRIVATE_KEYS].sort());
  for (const k of PRIVATE_KEYS) assert.ok(!(k in main), `${k} is not in the main record`);
  const text = JSON.stringify(main);
  for (const secret of ["peanuts", "heightCm", "bodyFatPct", "birthYear", "no coriander", "declarations", "\"sex\"", "foods\":[{"]) assert.ok(!text.includes(secret), `the main record doesn't carry ${secret}`);
  assert.deepEqual((main.coachView as any).flags, [{ situation: "diabetes", at: "2026-10-20" }], "situations as which and when");
  assert.deepEqual((main.coachView as any).goalsNow, { calories: 2500, protein: 160 });
  assert.equal(main.clientName, "Tester 1"); assert.ok("goal" in main && "days" in main);
});
test("DT168: on the preview the old copy stays for the live app; nothing is dropped", () => {
  const { priv, main, drop } = splitSave(save, true);
  assert.ok(priv && drop.length === 0 && (main as any).safety && (main as any).personal);
  assert.ok(onPreviewHost("preview---chefmealan-abc-ey.a.run.app") && !onPreviewHost("chefmealan.com"));
  assert.deepEqual(["chefmealan.com", "www.chefmealan.com", "preview---chefmealan-abc-ey.a.run.app", "localhost:5173", "127.0.0.1:3197"].map(dropsOldCopy), [true, true, false, false, false], "only the live addresses move the old copy out");
});
test("DT168: a save with no private field writes nothing private and drops nothing", () => {
  const r = splitSave({ numbersReview: { status: "waiting" }, updatedAt: "t" }, false);
  assert.equal(r.priv, null); assert.deepEqual(r.drop, []);
});
test("DT168: the load takes the private part over an old copy; a coach's later goal brings its numbers", () => {
  const old = { state: { goals: { calories: 1 } }, safety: { allergies: [] }, goal: { band: "maintain" }, updatedAt: "2026-10-01" };
  const priv = { state: { goals: { calories: 2500, protein: 160 }, foods: [] }, safety: { allergies: ["peanuts"] }, updatedAt: "2026-10-30T12:00:00Z" };
  const m = mergeLoad(old, priv)!;
  assert.deepEqual(m.safety.allergies, ["peanuts"]); assert.equal(m.state.goals.calories, 2500); assert.equal(m.updatedAt, "2026-10-30T12:00:00Z");
  const coach = mergeLoad({ ...old, coachGoals: { calories: 2200, protein: 180, at: "2026-10-31T09:00:00Z" }, coachSetAt: "2026-10-31T09:00:00Z" }, priv)!;
  assert.deepEqual(coach.state.goals, { calories: 2200, protein: 180 });
  const later = mergeLoad({ ...old, coachGoals: { calories: 2200, protein: 180, at: "2026-10-29T09:00:00Z" }, coachSetAt: "2026-11-02T09:00:00Z" }, priv)!;
  assert.equal(later.state.goals.calories, 2500, "a later goal from a date doesn't bring back older numbers");
  const before = mergeLoad({ ...old, coachGoals: { calories: 2200, protein: 180, at: "2026-10-29T09:00:00Z" }, coachSetAt: "2026-10-29T09:00:00Z" }, priv)!;
  assert.equal(before.state.goals.calories, 2500, "a coach's goal older than the person's last save is already in it");
  assert.equal(mergeLoad(null, null), null);
  assert.equal(mergeLoad(old, null)!.state.goals.calories, 1, "an account not moved yet reads as before");
  // the live app saved to the main record after the private part's last save: its copy is the newer one and wins
  const liveNewer = mergeLoad({ state: { goals: { calories: 2600 }, foods: [{ id: "f2" }] }, safety: { allergies: ["sesame"] }, updatedAt: "2026-10-31T08:00:00Z" }, priv)!;
  assert.deepEqual([liveNewer.state.goals.calories, liveNewer.safety.allergies, liveNewer.updatedAt], [2600, ["sesame"], "2026-10-31T08:00:00Z"]);
  const liveEmpty = mergeLoad({ state: { goals: {}, foods: [] }, updatedAt: "2026-10-31T08:00:00Z" }, priv)!;
  assert.equal(liveEmpty.state.goals.calories, 2500, "an empty newer copy never replaces the private part's plates");
});
test("DT168: the coach's app reads coachView, and the old fields only for an account not moved yet", () => {
  const { main } = splitSave(save, false);
  const cf = coachFieldsOf(main);
  assert.deepEqual([cf.goalsNow, cf.pdUnit, cf.weightKg, cf.consentBy], [{ calories: 2500, protein: 160 }, "pd", 85, "self"]);
  assert.equal(coachFieldsOf({ personal: { weightKg: 70 }, safety: { flags: [] } }).weightKg, 70);
});
test("DT168: the rules: the private part is the person's only; a coach writes only coach fields", () => {
  const r = fs.readFileSync(new URL("../firestore.rules", import.meta.url), "utf8");
  assert.match(r, /match \/private\/\{pid\} \{\s*allow read, write: if request\.auth != null && request\.auth\.uid == uid;\s*\}/);
  assert.match(r, /isCoachOf\(\) && roleKept\(\) && coachKept\(\) && coachFieldsOnly\(\)/);
  const only = /hasOnly\(\[([^\]]+)\]\)/.exec(r)![1];
  for (const k of ["safety", "personal", "region", "goneFoods", "adultAt"]) assert.ok(!only.includes(`'${k}'`), `a coach can't write ${k}`);
});
test("DT169: the old photo copies are the owner's only", () => {
  const r = fs.readFileSync(new URL("../firestore.rules", import.meta.url), "utf8");
  const photos = /match \/photos\/\{pid\} \{([\s\S]*?)\}/.exec(r)![1];
  assert.match(photos, /allow read: if request\.auth != null && request\.auth\.uid == uid;/); assert.ok(!/coachOfParent/.test(photos));
});
test("DT169: join requests and sign-ups are the owner's only; delete and export reach everything", () => {
  const s = fs.readFileSync(new URL("../server.ts", import.meta.url), "utf8");
  for (const route of ['app.get("/api/access-requests"', 'app.post("/api/access-requests/:id"', 'app.get("/api/book-signups"']) {
    const i = s.indexOf(route); assert.ok(i >= 0 && /if \(!ownerOnly\(req\)\) return notOwner\(res\);/.test(s.slice(i, i + 300)), `${route} is owner-only`);
  }
  const del = s.slice(s.indexOf('app.post("/api/account/delete"'), s.indexOf("signin: async"));
  for (const x of ['"public_recipes", "public_recipes_preview"', 'collection("cooks").doc(uid).delete()', "toLowerCase() === email"]) assert.ok(del.includes(x), `delete reaches ${x}`);
  assert.match(s, /email = String\(b\.email \?\? ""\)\.trim\(\)\.toLowerCase\(\)/);
  const ex = s.slice(s.indexOf('app.post("/api/export"'), s.indexOf("// Delete my account, the whole of it"));
  for (const x of ["listCollections", "member_recipes", "public_recipes", "cooks", "accessRequests", "metrics_events", "photo_files", "sub.id !== \"photos\""]) assert.ok(ex.includes(x), `export has ${x}`);
});
