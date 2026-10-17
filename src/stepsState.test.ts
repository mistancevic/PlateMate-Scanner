import { test } from "node:test";
import assert from "node:assert/strict";
import { diffFoods, diffLine, originalFoodsOf, headingOf, foodNames } from "./stepsState";
import { cleanSteps, decodeEntities, sameWords, recipeFromLd } from "./recipeIn";

test("RP1b: the page's signs read as letters; a dash range reads as words; the page's own lines stay steps", () => {
  assert.equal(decodeEntities("it&#8217;s &amp; 10&#x2013;20 &rsquo;"), "it’s & 10–20 ’");
  assert.deepEqual(cleanSteps(["If it&#8217;s helpful, freeze 10&#8211;20 minutes."]), ["If it’s helpful, freeze 10 to 20 minutes."]);
  assert.equal(cleanSteps(["Use a 9-inch pan."])[0], "Use a 9-inch pan.", "a hyphen in a word stays");
  const html = '<script type="application/ld+json">{"@type":"Recipe","name":"X","recipeIngredient":["1 egg"],"recipeInstructions":"<ol><li>Mix it.</li><li>Bake it.</li></ol>"}</script>';
  assert.deepEqual(recipeFromLd(html)!.steps, ["Mix it.", "Bake it."]);
  assert.equal(sameWords("Make the crust: Stir it. Freeze 10&#8211;20 minutes.", ["Make the crust: Stir it.", "Freeze 10 to 20 minutes."]), true);
  assert.equal(sameWords("Stir it. Freeze it.", ["Stir it well.", "Freeze it."]), false, "a word added fails the check");
  assert.deepEqual(headingOf("Make the crust: Stir it."), { head: "Make the crust", rest: "Stir it." });
  assert.equal(headingOf("stir it: well"), null, "a lower case start is no heading");
});

test("RP1, RP1b, RP1c: the foods the steps were written for, and what differs", () => {
  const now = ["Graham cracker crumbs", "Light cream cheese", "Vanilla whey protein powder"];
  const d = diffFoods(now, ["Graham cracker crumbs", "Cream cheese"])!;
  assert.deepEqual(d, { added: ["Light cream cheese", "Vanilla whey protein powder"], gone: ["Cream cheese"] });
  assert.equal(diffLine(d), "Your dish has light cream cheese and vanilla whey protein powder. The original has cream cheese.");
  assert.equal(diffLine({ added: [], gone: ["Butter"] }), "Your dish leaves out butter.");
  assert.equal(diffLine({ added: ["Whey"], gone: [] }), "Your dish adds whey.");
  assert.equal(diffFoods(["Eggs", "Flour"], ["flour", "eggs"]), null, "same foods, any case: the original works");
  assert.equal(diffFoods(["Eggs"], undefined), null, "unknown: no line");
  const orig = { id: "o", items: [{ grams: 100, food: { name: "Cream cheese" } }], source: { foods: ["Cream cheese", "Butter"] } };
  assert.deepEqual(originalFoodsOf({ basedOn: { id: "o" } }, [orig]), ["Cream cheese", "Butter"]);
  assert.deepEqual(originalFoodsOf({ source: { foods: ["Eggs"] } }), ["Eggs"]);
  assert.deepEqual(foodNames([{ grams: 0, food: { name: "Salt" } }, { grams: 5, food: { name: "Oil" } }]), ["Oil"]);
});
