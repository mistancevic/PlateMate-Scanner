import { test } from "node:test";
import assert from "node:assert/strict";
import { cookName, weighLine, cookPhrase, aroundWord, needsCooking, rawHint, baseRange, cookTitle } from "./cookWords";

test("DT88: the short name and the state, as a cook says it", () => {
  assert.deepEqual(cookName("Penne, dry"), { short: "Penne", state: "dry" });
  assert.deepEqual(cookName("Chicken breast, cooked"), { short: "Chicken breast", state: "cooked" });
  assert.deepEqual(cookName("Passata"), { short: "Passata", state: null });
  assert.equal(weighLine("Penne, dry"), "weigh it dry");
  assert.equal(weighLine("Chickpeas, drained"), "weigh it drained");
  assert.equal(weighLine("Passata"), null);
  assert.equal(cookPhrase("Penne, dry", 135), "135 g dry penne");
  assert.equal(cookPhrase("Chicken breast, cooked", 150), "150 g cooked chicken breast");
  assert.equal(cookPhrase("Chickpeas, drained", 80), "80 g chickpeas, drained");
  assert.equal(cookPhrase("Greek yogurt 2%", 150), "150 g Greek yogurt 2%");
  assert.equal(aroundWord(["Chicken breast, cooked"]), "chicken breast");
  assert.equal(aroundWord(["Skyr", "Banana"]), "foods");
});

test("DT89: a food you cook gets steps", () => {
  assert.equal(needsCooking("Penne, dry"), true);
  assert.equal(needsCooking("Chicken breast, raw"), true);
  assert.equal(needsCooking("Chicken breast, cooked"), false);
  assert.equal(needsCooking("Skyr, natural"), false);
  assert.equal(needsCooking("Almonds, raw"), false);
  assert.equal(needsCooking("Oats, dry"), false);
  assert.equal(needsCooking("Rice, white, raw"), true);
});

test("DT91: about how much raw or dry, for meat, pasta and grains only", () => {
  assert.equal(rawHint("Chicken breast, cooked", 150), "about 200 g raw");
  assert.equal(rawHint("Rice, cooked", 200), "about 80 g dry");
  assert.equal(rawHint("Pasta, cooked", 240), "about 100 g dry");
  assert.equal(rawHint("Penne, dry", 100), null);
  assert.equal(rawHint("Carrots, cooked", 100), null);
});

test("DT91: a normal base portion, by food and how it is weighed", () => {
  assert.deepEqual(baseRange("Penne, dry", 40), [70, 110]);
  assert.deepEqual(baseRange("Potatoes, raw", 100), [200, 400]);
  assert.deepEqual(baseRange("Bulgur, dry", 40), [60, 100]);
  assert.deepEqual(baseRange("Rice, cooked", 100), [150, 250]);
  assert.deepEqual(baseRange("Wholegrain bread", 30), [50, 150]);
  assert.deepEqual(baseRange("Lentils, cooked", 80), [80, 300]);
});

test("DT100 (0.2.90): a title as a cook says it", () => {
  assert.equal(cookTitle("Balkan Low-Fat Quark Toast Plate"), "Balkan quark toast");
  assert.equal(cookTitle("Pollo alla pizzaiola with penne"), "Pollo alla pizzaiola with penne");
  assert.equal(cookTitle("Chicken With Ajvar, Potatoes And Šopska Salad"), "Chicken with ajvar, potatoes and šopska salad");
  assert.equal(cookTitle("High-Protein Chicken Bulgur Bowl"), "Chicken bulgur bowl");
  assert.equal(cookTitle("Bowl of Greek yogurt with honey"), "Greek yogurt with honey");
  assert.equal(cookTitle("protein crepes"), "Protein crepes");
});
