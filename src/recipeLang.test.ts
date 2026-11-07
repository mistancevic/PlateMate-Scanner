// DT250 (0.3.99, board Stories185; Coach Milan 7 November, Go 08:05): a recipe in your language.
import { test } from "node:test";
import assert from "node:assert/strict";
import type { Meal } from "./pilot";
import { TR_V, recipeLangOf, shownMeal, offerFrom, trProblems, patchShown, showsTranslation } from "./recipeLang";

const food = (id: string, name: string, refId?: string) => ({ id, name, brand: "", basis: "100g", source: "test", calories: 100, protein: 5, ...(refId ? { refId } : {}) }) as any;
const meal = (x: Partial<Meal> = {}): Meal => ({ id: "m", title: "Prebranac", savedAt: "2026-11-07T08:00:00Z", portion: 370, items: [{ id: "a", food: food("f1", "Pasulj"), grams: 250, locked: false }, { id: "b", food: food("f2", "Onion", "onion"), grams: 120, locked: false }],
  steps: ["Iseci [[i:b|luk]] i propržite ga 10 minuta.", "Dodaj [[i:a|pasulj]] i peci 40 minuta na 200 °C."], ...x } as Meal);
const tr = { lang: "en" as const, from: "sr-Latn" as const, title: "Prebranac (baked beans)", steps: ["Slice the [[i:b|onion]] and fry it for 10 minutes.", "Add the [[i:a|beans]] and bake for 40 minutes at 200 °C."], foods: { a: "Beans", b: "Onion, raw" }, at: "2026-11-07T08:10:00Z", v: 2 };

test("the recipe's language, from its words", () => {
  assert.equal(recipeLangOf(meal()), "sr-Latn");
  assert.equal(recipeLangOf(meal({ title: "Baked beans", steps: ["Slice the onion and fry it for 10 minutes."] })), "en");
});

test("an offer only when the recipe is in another language, not translated, and not kept as it is", () => {
  assert.equal(offerFrom(meal(), "en"), "sr-Latn");
  assert.equal(offerFrom(meal(), "sr-Latn"), null, "already in the app's language");
  assert.equal(offerFrom(meal({ tr }), "en"), null, "translated already");
  assert.equal(offerFrom(meal({ trNo: ["en"] }), "en"), null, "Keep it in Srpski");
  assert.equal(offerFrom(meal({ trNo: ["en"] }), "de"), "sr-Latn", "kept for English only");
  assert.equal(offerFrom(meal({ steps: [] }), "en"), null, "no steps, nothing to offer");
});

test("the translation shows, foods of the food table keep their own names, the original a tap away", () => {
  const m = meal({ tr });
  const s = shownMeal(m, "en");
  assert.equal(s.title, "Prebranac (baked beans)"); assert.equal(s.steps![1], tr.steps[1]);
  assert.equal(s.items[0].food.name, "Beans"); assert.equal(s.items[1].food.name, "Onion", "a food of the food table shows by the table");
  assert.equal(shownMeal({ ...m, trShow: "orig" }, "en").steps![0], m.steps![0]);
  assert.equal(shownMeal(m, "de"), m, "in another app language, the recipe as written");
  assert.equal(showsTranslation(m, "en"), true);
});

test("a translation keeps every step, every food's link and every number", () => {
  assert.deepEqual(trProblems(meal().steps!, tr.steps), []);
  assert.deepEqual(trProblems(meal().steps!, [tr.steps[0]]), ["1 steps for 2"]);
  assert.deepEqual(trProblems(meal().steps!, [tr.steps[0], "Add the beans and bake for 40 minutes at 200 °C."]), ["step 2: a food's link changed"]);
  assert.deepEqual(trProblems(meal().steps!, [tr.steps[0], "Add the [[i:a|beans]] and bake for 45 minutes at 200 °C."]), ["step 2: a number changed"]);
});

test("a change while the translation shows goes into the translation; the original stays", () => {
  const m = meal({ tr });
  const p = patchShown(m, "en", { steps: ["One.", "Two."], title: "Beans" });
  assert.equal((p as any).steps, undefined); assert.deepEqual(p.tr!.steps, ["One.", "Two."]); assert.equal(p.tr!.title, "Beans");
  assert.deepEqual(patchShown({ ...m, trShow: "orig" }, "en", { steps: ["x"] }), { steps: ["x"] });
});

test("0.3.100: a translation made before version 2 is offered again; renamed foods are no changed foods; token names may change", () => {
  const old = { ...tr, v: undefined };
  assert.equal(offerFrom(meal({ tr: old }), "en"), "sr-Latn"); assert.equal(shownMeal(meal({ tr: old }), "en").steps![0], meal().steps![0]); assert.equal(TR_V, 2);
  const s = shownMeal(meal({ tr, stepsFor: ["Pasulj", "Onion"] }), "en");
  assert.deepEqual(s.stepsFor, ["Beans", "Onion"], "the foods the steps were written for, by the shown names");
  assert.deepEqual(trProblems(["Iseci [[i:b|luk]] 10 minuta."], ["Slice the [[i:b|onion]] for 10 minutes."]), [], "the name in a token is the new language's");
});
