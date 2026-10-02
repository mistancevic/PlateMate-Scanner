import test from "node:test";
import assert from "node:assert/strict";
import { mixCase, mixTip, SNACK_KCAL } from "./mixtip";
import { STARTER_FOODS } from "./starter";
import { aggregate, density } from "./pilot";

const byName = (n: string) => STARTER_FOODS.find((f) => f.name === n)!;
const nutella = byName("Nutella"), skyr = byName("Skyr, natural"), chicken = byName("Chicken breast, cooked"), rice = byName("Rice, cooked"), banana = byName("Banana");

test("the case comes from the number: under, fits, over", () => {
  assert.equal(mixCase(nutella, 6.3), "under");
  assert.equal(mixCase(skyr, 6.3), "over");            // 17.5, twice the target: a protein base, not a meal alone
  assert.equal(mixCase(byName("Eggs"), 6.3), "fits");  // 8.4
  assert.equal(mixCase(nutella, null), "unknown");
});

test("a food that fits gets no mix", () => {
  const t = mixTip(byName("Eggs"), "regular", 6.3, [], STARTER_FOODS, null);
  assert.equal(t.case, "fits"); assert.equal(t.mixes.length, 0);
});

test("under target, regular meal: a protein base first, then a plate of up to three, every mix on target", () => {
  const t = mixTip(nutella, "regular", 6.3, [], STARTER_FOODS, 1200);
  assert.equal(t.case, "under");
  assert.ok(t.mixes.length >= 2 && t.mixes.length <= 3, "two or three mixes");
  for (const m of t.mixes) {
    assert.ok(Math.abs(m.pd - 6.3) <= 0.05, `on target: ${m.pd}`);
    assert.equal(m.items[0].food.name, "Nutella");
    assert.ok(m.items.every((i) => i.grams >= 10 && i.grams <= 300), "real portions");
    const a = aggregate(m.items); assert.equal(m.kcal, Math.round(a.calories!));
  }
  assert.equal(t.mixes[0].partners.length, 1);
  assert.equal(t.mixes[0].kind, "DaaM dessert");        // sweet plus a protein base
  assert.ok(t.mixes.some((m) => m.partners.length >= 2), "a fuller plate is offered");
  assert.ok(t.mixes[0].fromStarter.length === 1, "the partner came from the starter set and says so");
});

test("the library comes before the starter set, favourites first", () => {
  const mine = { ...byName("Quark, low fat (Magerquark)"), id: "mine-quark", favorite: true };
  const t = mixTip(nutella, "regular", 6.3, [mine, byName("Greek yogurt 2%")], STARTER_FOODS, null);
  assert.equal(t.mixes[0].partners[0].id, "mine-quark");
  assert.equal(t.mixes[0].fromStarter.length, 0);
});

test("before training: light, nothing to cook, low fat, snack-sized", () => {
  const t = mixTip(nutella, "before", 3, [], STARTER_FOODS, null);
  assert.equal(t.case, "under");
  assert.ok(t.mixes.length >= 1);
  for (const m of t.mixes) {
    assert.ok(m.kcal <= SNACK_KCAL, `snack-sized: ${m.kcal}`);
    assert.equal(m.cooking, false);
    assert.ok(m.partners.every((p) => ((p.fats ?? 0) * 9) / p.calories! < 0.3), "low fat partners");
  }
});

test("over target: a carb base makes a protein base a meal; before training it is a carb or a flavour food", () => {
  const t = mixTip(chicken, "regular", 6.3, [], STARTER_FOODS, 1200);
  assert.equal(t.case, "over");
  assert.ok(t.mixes.length >= 1);
  assert.equal(t.mixes[0].partners[0].name, "Rice, cooked");
  assert.equal(t.mixes[0].kind, "meal");
  const b = mixTip(chicken, "before", 3, [], STARTER_FOODS, null);
  assert.ok(b.mixes.every((m) => m.partners.every((p) => ["Carb base", "Flavour food"].includes(p.job ?? "") || p.name === "Rice, cooked" || p.name === "Banana" || p.name === "Honey" || p.name === "Apple" || p.name === "Oats" || p.name === "Wholegrain bread")), "no protein partner before training");
});

test("the snack moments stay under the snack line and offer at most two", () => {
  for (const moment of ["meeting", "travel", "celebration", "afterwork"] as const) {
    const t = mixTip(nutella, moment, 4.3, [], STARTER_FOODS, 900);
    assert.ok(t.mixes.length >= 1 && t.mixes.length <= 2, `${moment}: ${t.mixes.length}`);
    assert.ok(t.mixes.every((m) => m.kcal <= SNACK_KCAL), `${moment} under the snack line`);
  }
});

test("a partner that cannot reach the target is not offered", () => {
  // banana alone can never lift Nutella to 6.3
  const t = mixTip(nutella, "regular", 6.3, [], [banana, rice], null);
  assert.equal(t.mixes.length, 0);
  assert.ok(density(banana.protein, banana.calories)! < 6.3);
});
