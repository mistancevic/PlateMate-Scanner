import { test } from "node:test";
import assert from "node:assert/strict";
import { EXPLORER_FOODS, cardOf } from "./explorer";

const F = (id: string) => EXPLORER_FOODS.find((f) => f.id === id)!;

test("DT151: one portion against one meal: protein, muscle protein synthesis, the family", () => {
  const whey = cardOf(F("whey"), 40);
  assert.deepEqual([whey.protein, whey.closes, whey.leucine, whey.eaa, whey.pd], [27, 68, 3.3, 14.3, 24.3]);
  const ch = cardOf(F("chicken"), 40);
  assert.deepEqual([ch.protein, ch.closes, ch.leucine, ch.eaa], [33.5, 84, 2.8, 14.7]);
  assert.equal(cardOf(F("egg"), 40).closes, 31);
  assert.equal(ch.family.leu, 2.76);
});

test("DT151: for an adult every food covers the nine per gram; its lowest is named only when it is close", () => {
  for (const f of EXPLORER_FOODS) assert.ok(Object.values(cardOf(f, 40).perGram).every((v) => v >= 1), f.id);
  assert.deepEqual(cardOf(F("lentils"), 40).lowest, { id: "saa", name: "Methionine + cysteine", cover: 1.01 });
  assert.equal(cardOf(F("oats"), 40).lowest?.id, "lys");
  assert.equal(cardOf(F("soy"), 40).lowest, null);
  assert.equal(cardOf(F("whey"), 40).lowest, null);
});

test("DT151: every food names its source; the scores come from one paper read in full, the rest say none yet", () => {
  for (const f of EXPLORER_FOODS) assert.ok(f.src.length > 5, f.id);
  for (const id of ["salmon", "egg", "chicken"]) assert.deepEqual([F(id).pdcaas, F(id).diaas], [null, null], id);
  for (const f of EXPLORER_FOODS) for (const s of [f.pdcaas, f.diaas]) if (s) assert.match(s.src, /^Hertzler 2020/, f.id);
  assert.deepEqual([F("whey").diaas?.value, F("yogurt").diaas?.value, F("soy").diaas?.value, F("lentils").pdcaas?.value, F("oats").diaas?.value], [0.9, 1.08, 0.92, 0.8, 0.44]);
});
