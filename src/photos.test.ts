import test from "node:test";
import assert from "node:assert/strict";
import { photosOf, withPhotos, withoutStored, isOrphan, fileOf, keyOf, isPreview, sig } from "./photos";

// Storage release 1 (7 October 2026): photos are files; the saved data carries none once they are safely stored.
const P = (n: number) => `data:image/jpeg;base64,${"A".repeat(40 + n)}`;
const state = () => ({
  foods: [{ id: "f1", name: "Skyr", photo: P(1), photos: [P(2), P(3)] }, { id: "f2", name: "Oats" }],
  feedback: [{ id: "c1", photo: P(4) }, { id: "c2" }],
  items: [{ id: "i1", food: { id: "f1", name: "Skyr", photo: P(1) } }],
  meals: [],
});

test("every photo by key: the preview, the larger copies, a plate's photo", () => {
  const m = photosOf(state());
  assert.deepEqual([...m.keys()].sort(), ["fb:c1", "food:f1", "food:f1:1", "food:f1:2"]);
});

test("the saved data drops a food's photos only when all of them are stored, and says how many there were", () => {
  const half = withoutStored(state(), new Set(["food:f1", "food:f1:1"])) as any;
  assert.ok(half.foods[0].photo && half.foods[0].photos.length === 2, "one copy not yet stored: the food keeps all its photos");
  const all = withoutStored(state(), new Set(["food:f1", "food:f1:1", "food:f1:2", "fb:c1"])) as any;
  assert.equal(all.foods[0].photo, undefined); assert.equal(all.foods[0].photoCount, 2);
  assert.equal(all.feedback[0].photo, undefined); assert.equal(all.items[0].food.photo, undefined);
  assert.ok(JSON.stringify(all).length < JSON.stringify(state()).length);
});

test("photos come back where they belong, and never replace what the state holds", () => {
  const bare = withoutStored(state(), new Set(["food:f1", "food:f1:1", "food:f1:2", "fb:c1"]));
  const back = withPhotos(bare, photosOf(state())) as any;
  assert.equal(back.foods[0].photo, P(1)); assert.deepEqual(back.foods[0].photos, [P(2), P(3)]); assert.equal(back.feedback[0].photo, P(4));
  const s = state();
  assert.equal(withPhotos(s, new Map([["food:f1", P(9)]])), s, "nothing missing: the same state comes back");
});

test("a photo is removed only when what it belonged to is gone", () => {
  const s = state();
  assert.equal(isOrphan("food:f1", s), false);
  assert.equal(isOrphan("food:f2", s), false, "a food whose photos have not loaded keeps them");
  assert.equal(isOrphan("food:f9", s), true, "the food is gone");
  assert.equal(isOrphan("food:f1:3", s), true, "the list of photos got shorter");
  assert.equal(isOrphan("food:f1:2", s), false);
  assert.equal(isOrphan("fb:c1", s), false); assert.equal(isOrphan("fb:c9", s), true);
});

test("file names round-trip, previews first, fingerprints change with the picture", () => {
  for (const k of ["food:7d1c-2a", "food:7d1c-2a:3", "fb:9e-1"]) assert.equal(keyOf(fileOf(k)), k);
  assert.equal(fileOf("food:a:2"), "food~a~2.jpg");
  assert.ok(isPreview("food:a") && isPreview("fb:c") && !isPreview("food:a:1"));
  assert.notEqual(sig(P(1)), sig(P(2)));
});

// The three fixes after the first deploy (7 October 2026)
test("a plate on a card carries no photos of a library food in the saved data; they come back from the library", () => {
  const s: any = { ...state(), feedback: [{ id: "c1", photo: P(4), meal: { items: [{ food: { id: "f1", name: "Skyr", photo: P(7), photos: [P(8)] } }] } }] };
  const saved = withoutStored(s, new Set(["food:f1", "food:f1:1", "food:f1:2", "fb:c1"])) as any;
  assert.equal(saved.feedback[0].meal.items[0].food.photo, undefined); assert.equal(saved.feedback[0].meal.items[0].food.photos, undefined);
  const back = withPhotos(saved, photosOf(state())) as any;
  assert.equal(back.feedback[0].meal.items[0].food.photo, P(1), "the library's preview, not the card's older copy");
});

test("an older copy never speaks for a library food; a food that left the library keeps its photos through its copies", () => {
  const s: any = { foods: [{ id: "f1", name: "Skyr" }], feedback: [], meals: [], items: [{ food: { id: "f1", photo: P(7), photos: [P(8)] } }, { food: { id: "gone", photo: P(5), photos: [P(6)] } }] };
  const m = photosOf(s);
  assert.equal(m.has("food:f1"), false, "the library food has no photos loaded: the copy's are not taken as its own");
  assert.equal(m.get("food:gone"), P(5));
  assert.equal(isOrphan("food:f1:3", s), false, "photos not loaded yet: nothing is removed, whatever an older copy holds");
  assert.equal(isOrphan("food:gone:1", s), false);
});

test("removing every photo removes the files too; an empty list stays empty", () => {
  const s: any = { foods: [{ id: "f1", name: "Skyr", photos: [] }], feedback: [], items: [], meals: [] };
  assert.equal(isOrphan("food:f1", s), true); assert.equal(isOrphan("food:f1:1", s), true);
  assert.equal((withPhotos(s, new Map([["food:f1:1", P(2)]])) as any).foods[0].photos.length, 0);
});
