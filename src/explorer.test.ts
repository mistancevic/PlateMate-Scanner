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

test("DT151: every food names its source; salmon has no quality score yet", () => {
  for (const f of EXPLORER_FOODS) assert.ok(f.src.length > 5, f.id);
  assert.equal(F("salmon").pdcaas, null);
  assert.equal(F("lentils").pdcaas?.value, 0.8);
});
