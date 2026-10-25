import { test } from "node:test";
import assert from "node:assert/strict";
import { identityOf, foodHit, englishName, namesOf, identityTwins } from "./foodId";
import { oneList } from "./oneList";
import { referenceFood, REFERENCE } from "./reference";
import type { Food } from "./pilot";
import type { MemberFood } from "./memberFoods";

const F = (id: string, name: string, extra: Partial<Food> = {}): Food => ({ id, name, brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "", readyToEat: true, calories: 190, protein: 25, fats: 10, carbs: 0, fiber: null, ...extra }) as Food;
let n = 0; const uid = () => "u" + ++n;

test("DT125: one identity per food: the barcode, the basic food, else name and brand", () => {
  assert.equal(identityOf(F("a", "Tuna in olive oil, drained", { barcode: "8004030044012" })), "b:8004030044012");
  assert.equal(identityOf(F("b", "Tunina v oljčnem olju / Tunjevina", { barcode: "8004030044012" })), "b:8004030044012");
  const basic = referenceFood(REFERENCE.find((r) => r.id === "tuna-canned")!, "munich", uid);
  assert.equal(identityOf(basic), "r:tuna-canned");
  assert.equal(identityOf(F("c", "Thunfisch in Wasser")), "r:tuna-canned", "a copy made before refId is known by its name");
  assert.equal(identityOf(F("d", "Peanut butter", { brand: "Rapunzel" })), "n:peanut butter|rapunzel");
});
test("DT125: the job comes from what the food is: Thunfisch in Wasser is tuna, not a drink", () => {
  assert.equal(englishName(F("c", "Thunfisch in Wasser")), "Tuna, canned in water, drained");
  assert.ok(namesOf(F("c", "Thunfisch in Wasser")).includes("Tunjevina u sopstvenom soku"));
});
test("DT125: any name in any language finds the food", () => {
  const sr = F("b", "Tunina v oljčnem olju / Tunjevina u maslinovom ulju", { brand: "Rio mare" });
  assert.equal(foodHit(sr, "tuna"), true);
  assert.equal(foodHit(sr, "thunfisch"), true);
  assert.equal(foodHit(F("a", "Tuna in olive oil, drained"), "tunjevina"), true);
  assert.equal(foodHit(F("a", "Tuna in olive oil, drained"), "sk"), false);
  assert.equal(foodHit(F("a", "Skyr, natural"), "sk"), true);
});
test("DT125: one list, one row per food, yours first, then members, then basic", () => {
  const mine = [F("a", "Tuna in olive oil, drained", { barcode: "8004030044012", brand: "Rio Mare" }), F("s", "Skyr, natural")];
  const members: MemberFood[] = [
    { key: "b:8004030044012", name: "Tunina v oljčnem olju", brand: "Rio mare", barcode: "8004030044012", calories: 402, protein: 17, fats: 36, carbs: 0, fiber: 0, source: "label", seenIn: ["limassol"], updatedAt: "2026-10-25T01:00:00Z" },
    { key: "b:3850102001234", name: "Tuna in brine, drained", brand: "Eva", barcode: "3850102001234", calories: 105, protein: 24, fats: 1, carbs: 0, fiber: 0, source: "label", seenIn: ["belgrade"], updatedAt: "2026-10-25T01:00:00Z" },
  ];
  const { rows, db } = oneList({ q: "tuna", mine, members, db: [{ code: "8004030044012", name: "Tonno", brand: "Rio Mare", quantity: "80 g", kcal: 190, protein: 25 }, { code: "4311501324103", name: "Thunfisch in eigenem Saft", brand: "Edeka", quantity: "195 g", kcal: 110, protein: 26 }], region: "munich", uid });
  assert.deepEqual(rows.map((r) => r.kind), ["mine", "member", "basic"]);
  assert.deepEqual(rows[0].names, ["Tuna in olive oil, drained", "Tunina v oljčnem olju"], "the Slovenian name hangs off your tin, not a second row");
  assert.equal(rows[1].food.name, "Tuna in brine, drained");
  assert.equal(rows[2].kind === "basic" && rows[2].ref.id, "tuna-canned");
  assert.equal(db.length, 1, "a database product with the barcode of a food in the list is not offered again");
});
test("DT125: two foods of yours with the same barcode are twins, the older first", () => {
  const twins = identityTwins([F("a", "Tuna", { barcode: "8004030044012" }), F("b", "Skyr"), F("c", "Tunjevina", { barcode: "8004030044012" })]);
  assert.equal(twins.length, 1); assert.equal(twins[0][0].id, "a"); assert.equal(twins[0][1].id, "c");
});

test("DT125: a starter copy with 'typical values' as its brand, or a name with the other language in brackets, is the basic food", () => {
  const starter = { id: "f-1", name: "Chicken breast, cooked", brand: "typical values, check your pack", basis: "100g", calories: 165, protein: 31 } as any;
  const bracket = { id: "x", name: "Cottage cheese (Hüttenkäse)", brand: "typical values, check your pack", basis: "100g", calories: 98, protein: 11 } as any;
  assert.match(identityOf(starter), /^r:/);
  assert.match(identityOf(bracket), /^r:/);
  assert.equal(identityOf({ name: "Cottage cheese", brand: "Milbona" }), "n:cottage cheese|milbona");
});
