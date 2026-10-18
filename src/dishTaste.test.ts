import { test } from "node:test";
import assert from "node:assert/strict";
import { tasteOf, dishTaste, goesInDish, heldBackLine } from "./dishTaste";

const fritters = ["Whole milk", "Active dry yeast", "Granulated sugar", "Unsalted butter", "Eggs", "Vanilla extract", "Salt", "All-purpose flour", "Apples, peeled and diced", "Brown sugar", "Ground cinnamon", "Nutmeg", "Cornstarch", "Water", "Vegetable oil", "Confectioners' sugar", "Milk"];
const tacos = ["Chicken breast, raw", "Olive oil", "Tomatoes", "Red onion", "Corn tortillas"];
test("R9: a dish is sweet or savoury by the foods that define it; basics decide nothing", () => {
  assert.equal(dishTaste(fritters), "sweet");
  assert.equal(dishTaste(tacos), "savoury");
  assert.equal(dishTaste(["Glaze: Confectioners' sugar", "Milk", "Vanilla extract"]), "sweet");
  assert.equal(dishTaste(["All-purpose flour", "Eggs", "Milk", "Salt"]), null, "basics alone: no taste, nothing held back");
  assert.equal(dishTaste(["Chicken breast", "Honey"]), null, "sweet and savoury together: nothing held back");
  for (const b of ["All-purpose flour", "Unsalted butter", "Olive oil", "Eggs", "Whole milk", "Heavy cream", "Skyr, natural", "Salt", "Active dry yeast", "Baking powder", "Vanilla extract", "Ground cinnamon", "Almonds"]) assert.equal(tasteOf(b), "basic", b);
});
test("R9: the dessert holds back chicken, ham, tuna, onion, ketchup; the savoury dish holds back jam, chocolate, icing sugar", () => {
  for (const n of ["Chicken breast, cooked", "Ham", "Tuna in water", "Red onion", "Ketchup", "Salmon, cooked"]) assert.equal(goesInDish("sweet", n), false, n);
  for (const n of ["Strawberry jam", "Dark chocolate", "Icing sugar", "Nutella", "Leibniz Butterkeks", "Whey protein powder"]) assert.equal(goesInDish("savoury", n), false, n);
  for (const n of ["Eggs", "Unsalted butter", "Skyr, natural", "Whey protein powder", "Apple", "Carrots"]) assert.equal(goesInDish("sweet", n), true, n);
  for (const n of ["Eggs", "Olive oil", "Cottage cheese (Hüttenkäse)", "Apple", "Lime", "Chicken breast, cooked"]) assert.equal(goesInDish("savoury", n), true, n);
  assert.equal(goesInDish(null, "Chicken breast, cooked"), true);
  assert.equal(goesInDish("sweet", "Something new"), true, "a food the rules can't place is let through");
});
test("R9: the line says what was held back and why", () => {
  assert.equal(heldBackLine("sweet", ["Chicken breast, cooked"]), "Chicken breast, cooked is in your foods, but it doesn't go with this dessert.");
  assert.equal(heldBackLine("savoury", ["Nutella", "Strawberry jam"]), "Nutella and Strawberry jam are in your foods, but they don't go with this dish.");
});
