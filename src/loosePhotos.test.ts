// 0.3.67 (Coach Milan 3 November 07:55, Go): the plate's and the cook's photos are files; the account's copy names them
import { test } from "node:test";
import assert from "node:assert/strict";
import { looseOut, looseIn, loosePhotosOf, looseWanted, looseId, isOrphan, photosOf, photosWanted, withPhotos } from "./photos";
import { stripPhotos } from "./cloud";
import { shapeProblems } from "./saveShape";

const pic = (n: number) => "data:image/jpeg;base64," + String(n).repeat(4000);
const state = () => ({
  version: 1, goals: {}, foods: [{ id: "f1", name: "Egg", photo: pic(9) }], meals: [], feedback: [], items: [], title: "My meal", portion: null, preferences: "",
  photo: { image: pic(1), at: "2026-11-03T07:00:00Z", more: [pic(2), pic(3)] },
  cook: { ui: { stepPhotos: { "0": pic(4) }, final: pic(5) }, plate: { items: [{ food: { id: "f1", name: "Egg", photo: pic(9) } }] } },
  later: [{ id: "l1", cook: { ui: { final: pic(6) } } }],
});

test("the account's copy holds no photo as text; each loose photo is named once", () => {
  const out: any = stripPhotos(state());
  assert.deepEqual(shapeProblems(out), [], "no photo as text left");
  assert.equal(out.photo.image, "pf:" + looseId(pic(1)));
  assert.equal(out.photo.more[1], "pf:" + looseId(pic(3)));
  assert.equal(out.later[0].cook.ui.final, "pf:" + looseId(pic(6)));
  assert.ok(new TextEncoder().encode(JSON.stringify(out)).length < 2000, "small");
});

test("the files: every loose photo has a key, the library food's photo is not loose", () => {
  const ks = [...photosOf(state()).keys()].filter((k) => k.startsWith("loose:"));
  assert.equal(ks.length, 6);
  assert.ok(!ks.includes("loose:" + looseId(pic(9))), "a food's photo stays the food's");
});

test("back from the account: this phone's photos fill the names; the others are wanted, then filled", () => {
  const out: any = stripPhotos(state());
  const back: any = looseIn(out, loosePhotosOf(state()));
  assert.equal(back.photo.image, pic(1));
  assert.equal(back.cook.ui.stepPhotos["0"], pic(4));
  assert.equal(looseWanted(back).length, 0);
  assert.equal(looseIn(back, loosePhotosOf(state())), back, "nothing to fill: the same state");
  const want = photosWanted(out);
  assert.equal(want.get("loose:" + looseId(pic(5))), "#");
  const filled: any = withPhotos(out, new Map([["loose:" + looseId(pic(5)), pic(5)]]));
  assert.equal(filled.cook.ui.final, pic(5));
  assert.equal(filled.photo.image, out.photo.image, "the rest stay named until they arrive");
});

test("a loose photo's file goes only when nothing names it", () => {
  const st: any = state();
  assert.equal(isOrphan("loose:" + looseId(pic(2)), st), false);
  assert.equal(isOrphan("loose:" + looseId(pic(2)), stripPhotos(st)), false, "a name keeps it");
  st.photo = undefined;
  assert.equal(isOrphan("loose:" + looseId(pic(2)), { ...st }), true);
});
