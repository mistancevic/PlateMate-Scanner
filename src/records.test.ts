import { test } from "node:test";
import assert from "node:assert/strict";
import { changes, merge, sigOf, type Known, type Remote, type Up, type Del } from "./records";

// an account in memory: what saveRecords writes and loadRecords reads
function account() {
  const db: Record<string, Map<string, any>> = { foods: new Map(), recipes: new Map(), cards: new Map() };
  return {
    write(ups: Up[], dels: Del[]) { for (const u of ups) db[u.kind].set(u.id, { id: u.id, data: u.data, at: u.at }); for (const d of dels) db[d.kind].set(d.id, { id: d.id, data: null, at: d.at, deletedAt: d.at }); },
    read(): Remote { return { foods: [...db.foods.values()], recipes: [...db.recipes.values()], cards: [...db.cards.values()] }; },
  };
}
const food = (id: string, name: string, extra: any = {}) => ({ id, name, calories: 100, protein: 10, ...extra });
const st = (foods: any[], meals: any[] = [], feedback: any[] = []) => ({ foods, meals, feedback, items: [] });
// a phone: its copy, what it knows, and a sync that reads then sends, as the app does
function phone(acc: ReturnType<typeof account>, s: any) {
  const p = { s, known: {} as Known, last: "" };
  return Object.assign(p, {
    sync(now: string, pulled = true) {
      const m = merge(p.s, acc.read(), p.known, p.last || now); p.s = m.state; p.known = m.known;
      const c = changes(p.s, p.known, now, pulled); acc.write(c.ups, c.dels); p.known = c.next;
      return c;
    },
    edit(now: string, f: (s: any) => any) { p.s = f(p.s); p.last = now; },
  });
}

test("two phones add a different food each: both are kept", () => {
  const acc = account();
  const a = phone(acc, st([food("f1", "Oats")]));
  a.sync("10:00");
  const b = phone(acc, st([])); b.sync("10:00:30");
  assert.deepEqual(b.s.foods.map((f: any) => f.name), ["Oats"], "the laptop gets the phone's food");
  a.edit("10:01", (s) => st([...s.foods, food("f2", "Skyr")]));
  b.edit("10:02", (s) => st([...s.foods, food("f3", "Quark")]));
  a.sync("10:01"); b.sync("10:02"); a.sync("10:03");
  assert.deepEqual(a.s.foods.map((f: any) => f.name).sort(), ["Oats", "Quark", "Skyr"]);
  assert.deepEqual(b.s.foods.map((f: any) => f.name).sort(), ["Oats", "Quark", "Skyr"]);
});
test("a food deleted on one phone goes on the other too, and doesn't come back", () => {
  const acc = account();
  const a = phone(acc, st([food("f1", "Oats"), food("f2", "Skyr")])); a.sync("10:00");
  const b = phone(acc, st([])); b.sync("10:00:30");
  b.edit("10:01", (s) => st(s.foods.filter((f: any) => f.id !== "f2"))); b.sync("10:01");
  a.sync("10:02");
  assert.deepEqual(a.s.foods.map((f: any) => f.name), ["Oats"], "gone on the phone");
  a.sync("10:03"); b.sync("10:04");
  assert.deepEqual(b.s.foods.map((f: any) => f.name), ["Oats"], "and it doesn't come back");
});
test("the same food changed on both: the later change wins, nothing else is touched", () => {
  const acc = account();
  const a = phone(acc, st([food("f1", "Oats"), food("f2", "Skyr")])); a.sync("10:00");
  const b = phone(acc, st([])); b.sync("10:00:30");
  a.edit("10:01", (s) => st(s.foods.map((f: any) => (f.id === "f1" ? { ...f, protein: 12 } : f)))); a.sync("10:01");
  b.edit("10:02", (s) => st(s.foods.map((f: any) => (f.id === "f1" ? { ...f, protein: 13 } : f)))); b.sync("10:02");
  a.sync("10:03");
  assert.equal(a.s.foods.find((f: any) => f.id === "f1").protein, 13, "the later change");
  assert.equal(a.s.foods.find((f: any) => f.id === "f2").name, "Skyr");
});
test("photos stay with the phone's copy; a phone that hasn't read the account never deletes", () => {
  const acc = account();
  const a = phone(acc, st([food("f1", "Oats", { photo: "data:image/jpeg;base64,AA", photos: ["data:image/jpeg;base64,BB"] })])); a.sync("10:00");
  assert.equal(acc.read().foods[0].data.photo, undefined, "no photo in the account record");
  assert.equal(acc.read().foods[0].data.photoCount, 1);
  const b = phone(acc, st([])); b.sync("10:00:30");
  b.edit("10:01", (s) => st(s.foods.map((f: any) => ({ ...f, protein: 11 })))); b.sync("10:01");
  a.sync("10:02");
  assert.equal(a.s.foods[0].protein, 11); assert.equal(a.s.foods[0].photo, "data:image/jpeg;base64,AA", "the photo stays");
  // a fresh phone that has not read the account: an empty copy sends no deleted notes
  const c = phone(acc, st([])); c.known = { "foods/f1": { sig: sigOf("foods", a.s.foods[0]), at: "10:01" } };
  const out = changes(c.s, c.known, "10:05", false);
  assert.equal(out.dels.length, 0);
});
test("recipes and cards are records too; cards stay newest first", () => {
  const acc = account();
  const card = (id: string, at: string) => ({ id, createdAt: at, status: "eaten", taste: "Good", notes: "", meal: { id: "m", title: "Bowl", items: [], portion: 1, savedAt: "" } });
  const a = phone(acc, st([], [{ id: "r1", title: "Bowl", items: [] }], [card("c1", "2026-10-06")])); a.sync("10:00");
  const b = phone(acc, st([], [], [card("c2", "2026-10-07")])); b.sync("10:01");
  assert.deepEqual(b.s.meals.map((m: any) => m.id), ["r1"]);
  assert.deepEqual(b.s.feedback.map((c: any) => c.id), ["c2", "c1"]);
});
test("a copy that lost most of its foods sends no deleted notes: a wrong copy is not a person deleting", () => {
  const foods = Array.from({ length: 10 }, (_, i) => food(`f${i}`, `Food ${i}`));
  const known: Known = Object.fromEntries(foods.map((f) => [`foods/${f.id}`, { sig: sigOf("foods", f), at: "10:00" }]));
  assert.equal(changes(st(foods.slice(0, 2)), known, "10:05", true).dels.length, 0, "8 of 10 gone: nothing deleted");
  assert.equal(changes(st(foods.slice(0, 9)), known, "10:05", true).dels.length, 1, "one gone: one deleted note");
});

// Milan's test, 7 October 2026: a bar scanned with two photos on the phone showed on the laptop without its photos; a photo
// added on the laptop never reached the phone. The record now says which photos the food has, and the other phone fetches them.
import { photosWanted, withPhotos, photosOf, sig } from "./photos";
const J = (x: string) => `data:image/jpeg;base64,${x.repeat(30)}`;
// what fetching the files gives: the photos the first phone sent, by key
const fetchFor = (s: any, from: any) => { const all = photosOf(from), got = new Map<string, string>(); for (const k of photosWanted(s).keys()) if (all.has(k)) got.set(k, all.get(k)!); return got; };

test("photos added on one phone reach the other, whole, and nothing is sent back", () => {
  const acc = account();
  const phoneA = phone(acc, st([food("bar", "Protein bar", { photo: J("T"), photos: [J("A"), J("B")] })])); phoneA.sync("10:00");
  const laptop = phone(acc, st([])); laptop.sync("10:01");
  assert.equal(laptop.s.foods[0].photos, undefined, "the record carries no photos");
  assert.deepEqual([...photosWanted(laptop.s).keys()].sort(), ["food:bar", "food:bar:1", "food:bar:2"]);
  const got = fetchFor(laptop.s, phoneA.s);
  laptop.s = withPhotos(laptop.s, got, new Set(got.keys()));
  assert.deepEqual(laptop.s.foods[0].photos, [J("A"), J("B")]); assert.equal(laptop.s.foods[0].photo, J("T"));
  assert.equal(laptop.sync("10:02").ups.length, 0, "the laptop sends nothing back");
  assert.equal(photosWanted(laptop.s).size, 0);
});

test("a photo added on the laptop replaces the phone's set; the phone never sends its older set back", () => {
  const acc = account();
  const p = phone(acc, st([food("pam", "PAM bar", { photos: [] })])); p.sync("10:00");
  const laptop = phone(acc, st([])); laptop.sync("10:01");
  laptop.edit("10:02", (s) => st(s.foods.map((f: any) => ({ ...f, photo: J("t"), photos: [J("shot")] })))); laptop.sync("10:02");
  const c = p.sync("10:03");
  assert.equal(c.ups.length, 0, "the phone doesn't send its empty set back");
  assert.equal(p.s.foods[0].photos, undefined, "its old set is let go, to be fetched");
  const got = fetchFor(p.s, laptop.s);
  p.s = withPhotos(p.s, got, new Set(got.keys()));
  assert.deepEqual(p.s.foods[0].photos, [J("shot")]);
  assert.equal(p.sync("10:04").ups.length, 0);
});

test("half a set is never taken: a photo still on its way leaves the food waiting", () => {
  const acc = account();
  const a = phone(acc, st([food("f", "Skyr", { photo: J("t"), photos: [J("1"), J("2")] })])); a.sync("10:00");
  const b = phone(acc, st([])); b.sync("10:01");
  const got = fetchFor(b.s, a.s); got.delete("food:f:2");
  b.s = withPhotos(b.s, got, new Set(got.keys()));
  assert.equal(b.s.foods[0].photos, undefined);
  assert.equal(b.sync("10:02").ups.length, 0, "nothing sent while waiting");
  // the phone's own store fills a set only with photos whose fingerprint matches
  const wrong = new Map([["food:f", J("t")], ["food:f:1", J("1")], ["food:f:2", J("old")]]);
  assert.equal(withPhotos(b.s, wrong).foods[0].photos, undefined);
  assert.equal(sig(J("2")) === sig(J("old")), false);
});

test("a photo removed on one phone goes on the other, from its own store", () => {
  const acc = account();
  const a = phone(acc, st([food("f", "Skyr", { photo: J("t"), photos: [J("1"), J("2")] })])); a.sync("10:00");
  const b = phone(acc, st([])); b.sync("10:01");
  const all = photosOf(a.s); b.s = withPhotos(b.s, all, new Set(all.keys())); b.sync("10:01:30");
  a.edit("10:02", (s) => st(s.foods.map((f: any) => ({ ...f, photos: [J("1")] })))); a.sync("10:02");
  b.sync("10:03");
  b.s = withPhotos(b.s, all); // the store still holds all three; only the matching ones are taken
  assert.deepEqual(b.s.foods[0].photos, [J("1")]);
  assert.equal(b.sync("10:04").ups.length, 0);
});
