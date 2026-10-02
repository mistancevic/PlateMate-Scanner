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

// ---- Culinary rules, version 1 (3 October 2026): one test per rule, with the real starter foods
import { catOf, goesWith, plateOk } from "./mixtip";
const mk = (name: string, calories: number, protein: number, fats: number, carbs: number, extra: Partial<typeof nutella> = {}) =>
  ({ ...nutella, id: name, name, brand: "", calories, protein, fats, carbs, fiber: null, table: [], photo: undefined, ...extra });
const snackBalls = mk("Snack balls, date and hazelnut", 353, 4.6, 10, 51.8);
const noodles = mk("Instant noodles", 461, 9.8, 20, 59);
const soja = mk("Soja Schnetzel", 340, 50, 1, 6);
const cola = mk("Cola", 42, 0, 0, 10.6, { basis: "100ml" as any });
const unnamedSweet = mk("Riegel XY", 450, 5, 15, 60, { table: [{ key: "sugars", name: "Zucker", amount: 40, unit: "g", sub: true }] as any });
const lib = [...STARTER_FOODS, soja, cola];
const partnersOf = (t: ReturnType<typeof mixTip>) => t.mixes.flatMap((m) => m.partners.map((p) => p.name));

test("categories read the real foods", () => {
  assert.equal(catOf(snackBalls), "sweet");
  assert.equal(catOf(unnamedSweet), "sweet");      // no sweet word in the name, but 40 g sugars per 100 g
  assert.equal(catOf(noodles), "mgrain");
  assert.equal(catOf(soja), "meat");
  assert.equal(catOf(cola), "drink");
  assert.equal(catOf(byName("Milk 1.5%")), "dairy");
  assert.equal(catOf(byName("Oats")), "bgrain");
  assert.equal(catOf(byName("Whey protein powder")), "supplement");
  assert.equal(catOf(byName("Cottage cheese (Hüttenkäse)")), "cottage");
});

test("rule 1: sweet goes with dairy, never with meat, fish, eggs or soya", () => {
  const t = mixTip(snackBalls, "regular", 5.5, lib, [], 1200);
  assert.ok(t.mixes.length >= 1);
  for (const n of partnersOf(t)) assert.ok(!/soja|chicken|salmon|eggs/i.test(n), `no ${n} with snack balls`);
  assert.ok(["Skyr, natural", "Quark, low fat (Magerquark)", "Greek yogurt 2%", "Cottage cheese (Hüttenkäse)", "Whey protein powder"].includes(t.mixes[0].partners[0].name));
  assert.equal(goesWith(snackBalls, soja), false);
  assert.equal(goesWith(snackBalls, byName("Skyr, natural")), true);
});

test("rule 2: savoury goes with meal grains, never oats or muesli", () => {
  const t = mixTip(chicken, "regular", 6.3, lib, [], 1200);
  assert.equal(t.mixes[0].partners[0].name, "Rice, cooked");
  for (const n of partnersOf(t)) assert.ok(!/oats|muesli|müsli/i.test(n), `no ${n} with chicken`);
  assert.equal(goesWith(chicken, byName("Oats")), false);
  assert.equal(goesWith(chicken, byName("Wholegrain bread")), false); // bread is a breakfast grain in v1
});

test("rule 3: dairy goes both ways, cottage cheese also savoury", () => {
  assert.equal(goesWith(skyr, byName("Oats")), true);
  assert.equal(goesWith(skyr, banana), true);
  assert.equal(goesWith(skyr, rice), false);
  assert.equal(goesWith(skyr, chicken), false);
  assert.equal(goesWith(byName("Cottage cheese (Hüttenkäse)"), chicken), true);
  assert.equal(goesWith(byName("Cottage cheese (Hüttenkäse)"), rice), true);
});

test("rule 4: a spread needs a carrier, never fruit alone", () => {
  assert.equal(plateOk([nutella, banana]), false);
  assert.equal(plateOk([nutella, banana, skyr]), true);
  assert.equal(plateOk([nutella, byName("Oats")]), true);
  const t = mixTip(banana, "regular", 6.3, [], STARTER_FOODS, 900);
  for (const m of t.mixes) assert.ok(!(m.partners.length === 1 && /nutella|peanut butter|honey/i.test(m.partners[0].name)), "a spread alone is not offered to a fruit");
});

test("rule 5: the volume food follows the taste of the plate", () => {
  const sweetPlate = mixTip(nutella, "regular", 6.3, lib, [], 1200);
  const three = sweetPlate.mixes.find((m) => m.partners.length === 3);
  if (three) assert.equal(catOf(three.partners[2]), "fruit");
  assert.equal(goesWith(byName("Apple"), chicken), false);
});

test("rule 6: whey is a dessert ingredient, never with meat or rice", () => {
  const whey = byName("Whey protein powder");
  const t = mixTip(whey, "regular", 6.3, lib, [], 1200);
  for (const n of partnersOf(t)) assert.ok(!/rice|chicken|soja|salmon/i.test(n), `no ${n} with whey`);
  assert.equal(goesWith(whey, rice), false);
  assert.equal(goesWith(whey, byName("Oats")), true);
  assert.equal(goesWith(whey, byName("Milk 1.5%")), true);
});

test("rule 7: drinks are never partners, milk counts as dairy", () => {
  const t = mixTip(nutella, "regular", 6.3, lib, [], 1200);
  assert.ok(!partnersOf(t).includes("Cola"));
  assert.equal(GOES_EMPTY(cola), true);
  assert.equal(goesWith(nutella, byName("Milk 1.5%")), true);
});
function GOES_EMPTY(f: typeof cola) { return goesWith(f, skyr) === false && goesWith(f, nutella) === false; }

test("rule 9: the kind, plain", () => {
  const dessert = mixTip(snackBalls, "regular", 5.5, lib, [], 1200).mixes[0];
  assert.equal(dessert.kind, "DaaM dessert");
  const meal = mixTip(chicken, "regular", 6.3, lib, [], 1200).mixes[0];
  assert.equal(meal.kind, "meal");
  const noodleMix = mixTip(noodles, "regular", 6.3, lib, [], 1200);
  assert.ok(noodleMix.mixes.length >= 1, "noodles get a mix");
  for (const n of partnersOf(noodleMix)) assert.ok(!/skyr|quark|yogurt|whey/i.test(n), `no ${n} with noodles`);
  assert.equal(noodleMix.mixes[0].kind, "meal");                       // a mixed food plus a protein base is a meal
  const snack = mixTip(byName("Vanilla ice cream"), "travel", 6.3, lib, [], 900).mixes[0];
  assert.ok(snack.kcal <= SNACK_KCAL);
});
