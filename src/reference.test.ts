import test from "node:test";
import assert from "node:assert/strict";
import { REFERENCE, findReference, referenceFood, localName } from "./reference";

test("the table has the basics, each with four names and the carbohydrate convention", () => {
  assert.ok(REFERENCE.length >= 120, `${REFERENCE.length} foods`);
  for (const r of REFERENCE) {
    assert.ok(r.en && r.de && r.sr && r.cyr, r.id);
    assert.ok(r.kcal >= 0 && r.protein >= 0 && r.fats >= 0 && r.carbsTotal >= r.fiber, r.id);
    const atwater = r.protein * 4 + r.fats * 9 + (r.carbsTotal - r.fiber) * 4;
    assert.ok(Math.abs(atwater - r.kcal) <= Math.max(80, r.kcal * 0.35), `${r.id}: the four roughly add up (${atwater} vs ${r.kcal} kcal)`);
  }
});

test("tikvice finds the courgette, in Latin and Cyrillic, with or without the hooks", () => {
  assert.equal(findReference("tikvice")[0].id, "courgette");
  assert.equal(findReference("тиквице")[0].id, "courgette");
  assert.equal(findReference("Zucchini")[0].id, "courgette");
  assert.equal(findReference("sargarepa")[0].id, "carrot");   // no diacritics typed
  assert.equal(findReference("Šargarepa")[0].id, "carrot");
  assert.equal(findReference("jaje")[0].id, "egg");
  assert.equal(findReference("x").length, 0, "two characters minimum");
});

test("a reference food becomes a library food in the local name, carbohydrate without fibre, source named", () => {
  const r = REFERENCE.find((x) => x.id === "courgette")!;
  const f = referenceFood(r, "belgrade", () => "f1");
  assert.equal(f.name, "Tikvice, sveže");
  assert.equal(f.calories, 17); assert.equal(f.protein, 1.2); assert.equal(f.fiber, 1.0);
  assert.equal(f.carbs, 2.1, "3.1 total minus 1.0 fibre");
  assert.ok(/Reference table: USDA/.test(f.notes ?? ""));
  assert.equal(localName(r, "munich"), "Zucchini, roh");
  assert.equal(localName(r, null), "Courgette (zucchini), raw");
});

test("a reference food is a valid library food, and a stored state with one is readable", async () => {
  const { isFood, parseState, freshState } = await import("./pilot");
  const r = REFERENCE.find((x) => x.id === "courgette")!;
  const f = referenceFood(r, "belgrade", () => "f1");
  assert.equal(isFood(f), true, "basis, source, notes, reviewedAt, readyToEat all present");
  const st = { ...freshState(), foods: [f] };
  assert.equal(parseState(JSON.stringify(st)).foods.length, 1);
  // the state a phone wrote with v0.1.34, the food without its basis: repaired on read, never unreadable
  const broken = JSON.parse(JSON.stringify(st)); delete broken.foods[0].basis;
  assert.equal(parseState(JSON.stringify(broken)).foods[0].basis, "100g");
});

test("a food saved under its Munich name carries its other names, so Kupus finds Weißkohl", () => {
  const r = REFERENCE.find((x) => x.id === "cabbage")!;
  const f = referenceFood(r, "munich", () => "f2");
  assert.equal(f.name, "Weißkohl, roh");
  assert.ok(f.aliases!.includes("Kupus") && f.aliases!.includes("Купус") && f.aliases!.includes("Cabbage, raw"));
  assert.ok(/Also: .*Kupus/.test(f.notes), "older saves keep the names in the notes too");
});
