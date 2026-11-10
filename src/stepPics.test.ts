import test from "node:test";
import assert from "node:assert/strict";
import { photosOf, photosWanted, withPhotos, withoutStored, isOrphan, stepPicOf, stepPicsOf, addStepPic, removeStepPic, firstStepPic, setStepPic, alignStepPics, allStepPics, stepPicSigsOf, sig } from "./photos";
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

// DT276 step 2 (0.3.129): two or more pictures on a step
test("a step can have two or more pictures; the first is the one shown", () => {
  const C = "data:image/jpeg;base64,CCCC";
  let m: any = { ...meal(), ...setStepPic(meal(), 0, { src: A, by: "me" }) };
  m = { ...m, ...addStepPic(m, 0, { src: B, by: "me" }) };
  m = { ...m, ...addStepPic(m, 0, { src: C, by: "ai" }) };
  const steps = m.steps as string[];
  assert.deepEqual(stepPicsOf(m, steps[0]).map((x) => x.src), [A, B, C], "three pictures, in the order added");
  assert.equal(stepPicOf(m, steps[0])!.src, A, "the first is the step's picture");
  assert.equal(m.stepPics.length, steps.length + 2, "the others sit after the steps");
  assert.deepEqual(addStepPic(m, 0, { src: B, by: "me" }), {}, "the same picture twice is once");
  // a step without a picture: the added one is its first, at its own place
  const one = { ...m, ...addStepPic(m, 1, { src: B, by: "me" }) };
  assert.equal(one.stepPics[1], B); assert.equal(stepPicsOf(one, steps[1]).length, 1);
  // setting the first again keeps the others
  const again = { ...m, ...setStepPic(m, 0, { src: C, by: "me" }) };
  assert.deepEqual(stepPicsOf(again, steps[0]).map((x) => x.src), [C, B, C]);
  // make it first
  const first = { ...m, ...firstStepPic(m, 0, C) };
  assert.deepEqual(stepPicsOf(first, steps[0]).map((x) => x.src), [C, B, A], "C is first, A took its place");
  assert.equal(stepPicOf(first, steps[0])!.by, "ai", "who made it moves with it");
  // remove one of the others, then the first: the next one is the first
  const less = { ...m, ...removeStepPic(m, 0, B) };
  assert.deepEqual(stepPicsOf(less, steps[0]).map((x) => x.src), [A, C]);
  const noFirst = { ...less, ...removeStepPic(less, 0, A) };
  assert.deepEqual(stepPicsOf(noFirst, steps[0]).map((x) => x.src), [C], "the next one took the first place");
  assert.equal(noFirst.stepPics[0], C); assert.equal(noFirst.stepPics.length, steps.length, "no empty places left after the steps");
  const none = { ...noFirst, ...removeStepPic(noFirst, 0, C) };
  assert.equal(stepPicsOf(none, steps[0]).length, 0);
  // the files and the fingerprints see every picture, by its place
  assert.equal([...photosOf({ meals: [m] } as any).keys()].filter((k) => k.startsWith("step:")).length, 3);
  assert.equal(stepPicSigsOf(m)!.filter(Boolean).length, 3);
  // the steps moved: every picture follows its words; a step rewritten loses all of its pictures
  const moved = [steps[1], steps[0], ...steps.slice(2)];
  const al = { ...m, steps: moved, ...alignStepPics(m, moved) } as any;
  assert.deepEqual(stepPicsOf(al, steps[0]).map((x) => x.src), [A, B, C]); assert.equal(al.stepPics[1], A, "the first at the step's new place");
  const re = alignStepPics(m, ["new words", ...steps.slice(1)]) as any;
  assert.equal(re.stepPics.filter(Boolean).length, 0, "a step rewritten loses its pictures");
});
