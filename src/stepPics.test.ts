import test from "node:test";
import assert from "node:assert/strict";
import { photosOf, photosWanted, withPhotos, withoutStored, isOrphan, stepPicOf, setStepPic, alignStepPics, allStepPics, stepPicSigsOf, sig } from "./photos";
import { clean } from "./records";
import { stripPhotos } from "./cloud";

const A = "data:image/jpeg;base64,AAAA", B = "data:image/jpeg;base64,BBBBBB";
const steps = ["Rinse [[i:r|rice]].", "Cut [[i:c|chicken]].", "Fry it."];
const meal = () => ({ id: "m1", title: "Bowl", items: [], portion: 1, savedAt: "", steps: [...steps] }) as any;

test("a picture is set for a step, belongs to its words, and is found by them", () => {
  const m = { ...meal(), ...setStepPic(meal(), 1, { src: A, by: "ai" }) };
  assert.deepEqual(m.stepPics, [null, A, null]);
  assert.deepEqual(m.stepPicMeta, [null, { by: "ai", step: steps[1] }, null]);
  assert.deepEqual(stepPicOf(m, steps[1]), { src: A, by: "ai" });
  assert.equal(stepPicOf(m, steps[0]), null);
  assert.equal(allStepPics(m, steps), false);
  const all = [0, 2].reduce((x, k) => ({ ...x, ...setStepPic(x, k, { src: B, by: "me" }) }), m);
  assert.equal(allStepPics(all, steps), true);
  const gone = { ...m, ...setStepPic(m, 1, null) };
  assert.equal(stepPicOf(gone, steps[1]), null);
});
test("steps reordered: pictures follow their words; a rewritten step loses its picture", () => {
  const m = { ...meal(), ...setStepPic(meal(), 0, { src: A, by: "me" }), };
  const m2 = { ...m, ...setStepPic(m, 1, { src: B, by: "ai" }) };
  const next = [steps[1], "Rinse the rice well.", steps[2]];
  const a = alignStepPics(m2, next) as any;
  assert.deepEqual(a.stepPics, [B, null, null]);
  assert.deepEqual(a.stepPicMeta, [{ by: "ai", step: steps[1] }, null, null]);
  assert.deepEqual(alignStepPics({ stepPicMeta: [{ by: "me", step: "x" }], stepPicSigs: ["1:a"] }, ["x"]), {}, "not on this phone yet: left as they are");
});
test("step pictures are files: out of the saved data, the record and the account's block; back as a whole set", () => {
  const m = { ...meal(), stepPics: [A, null, B], stepPicMeta: [{ by: "me", step: steps[0] }, null, { by: "ai", step: steps[2] }] };
  const state = { foods: [], feedback: [], items: [], meals: [m] };
  const ph = photosOf(state);
  assert.equal(ph.get("step:m1:1"), A); assert.equal(ph.get("step:m1:3"), B); assert.equal(ph.has("step:m1:2"), false);
  const half = withoutStored(state, new Set(["step:m1:1"])) as any;
  assert.ok(Array.isArray(half.meals[0].stepPics), "kept in the saved data until every picture is in the store");
  const saved = withoutStored(state, new Set(["step:m1:1", "step:m1:3"])) as any;
  assert.equal(saved.meals[0].stepPics, undefined);
  assert.deepEqual(saved.meals[0].stepPicSigs, [sig(A), "", sig(B)]);
  assert.deepEqual(saved.meals[0].stepPicMeta, m.stepPicMeta, "who made each, and its step, stay in the data");
  const rec = clean("recipes", m);
  assert.equal(rec.stepPics, undefined); assert.deepEqual(rec.stepPicSigs, stepPicSigsOf(m));
  const block = stripPhotos(state) as any;
  assert.equal(block.meals[0].stepPics, undefined); assert.deepEqual(block.meals[0].stepPicSigs, stepPicSigsOf(m));
  assert.deepEqual([...photosWanted(saved).keys()].sort(), ["step:m1:1", "step:m1:3"]);
  const back = withPhotos(saved, ph) as any;
  assert.deepEqual(back.meals[0].stepPics, [A, null, B]);
  const short = withPhotos(saved, new Map([["step:m1:1", A]])) as any;
  assert.equal(short.meals[0].stepPics, undefined, "never half a set");
});
test("a step picture leaves the phone and the account when its place is emptied or the recipe goes", () => {
  const m = { ...meal(), stepPics: [A, null, B], stepPicMeta: [{ by: "me", step: steps[0] }, null, { by: "ai", step: steps[2] }] };
  const st = { meals: [m] };
  assert.equal(isOrphan("step:m1:1", st), false);
  assert.equal(isOrphan("step:m1:2", st), true);
  assert.equal(isOrphan("step:m1:4", st), true);
  assert.equal(isOrphan("step:m1:1", { meals: [] }), true);
  assert.equal(isOrphan("step:m1:3", { meals: [{ id: "m1", stepPicSigs: ["x", "", "y"] }] }), false, "not loaded on this phone: kept");
});
