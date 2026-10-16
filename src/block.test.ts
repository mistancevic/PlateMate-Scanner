import { test } from "node:test";
import assert from "node:assert/strict";
import { stripPhotos } from "./cloud";

test("the account's block carries no photos: not a food's, not a recipe's own, not a card's (0.2.14)", () => {
  const big = "data:image/jpeg;base64," + "x".repeat(200_000);
  const food = { id: "f", name: "Apple", photo: big, photos: [big] };
  const st: any = { foods: [food], items: [{ food }], feedback: [{ id: "c", photo: big }],
    meals: Array.from({ length: 8 }, (_, k) => ({ id: `m${k}`, title: "Recipe", photo: big, photos: [big], coverSig: "1:x", items: [{ food }] })) };
  const out: any = stripPhotos(st);
  assert.ok(JSON.stringify(out).length < 20_000, `block is ${JSON.stringify(out).length} characters`);
  assert.equal(out.meals[0].photo, undefined); assert.equal(out.meals[0].photos, undefined); assert.equal(out.meals[0].coverSig, "1:x"); assert.equal(out.meals[0].photoSigs.length, 2, "the fingerprints say which photos it has");
  assert.equal(st.meals[0].photo, big, "the state itself keeps its photos");
});
