import { test } from "node:test";
import assert from "node:assert/strict";
import { linkCheck, isPrivateIp, recipeFromLd, pageText, gramsWritten, cleanRead, scaleTo, onePortion, sideAmount, pdOf, checkChange, isYours, realPortions, roundGrams, sizedFits, statedDiffers, kcalOfItems } from "./recipeIn";
import { cleanShared, sharedOf } from "./members";
import { photosOf, photosWanted, withPhotos, withoutStored, isOrphan, sig } from "./photos";

const F = (name: string, calories: number, protein: number) => ({ name, calories, protein });
const it = (grams: number, food: { name: string; calories: number; protein: number }) => ({ grams, food });
// the Margherita on board IM: makes 2 pizzas, 2,242 kcal, PD 4.1
const pizza = [it(500, F("Pizza dough", 260, 8)), it(200, F("Tomato passata", 32, 1.4)), it(250, F("Mozzarella", 280, 20)), it(20, F("Olive oil", 884, 0)), it(5, F("Basil", 23, 3.2))];

test("IM2b: the link: public https only; Instagram and TikTok need a screenshot; never an address inside our network", () => {
  assert.equal(linkCheck("https://example.com/recipes/pizza").ok, true);
  assert.deepEqual(linkCheck("https://www.instagram.com/p/abc/"), { ok: false, error: "login" });
  assert.deepEqual(linkCheck("https://vm.tiktok.com/x"), { ok: false, error: "login" });
  for (const bad of ["http://example.com/x", "https://localhost/x", "https://127.0.0.1/x", "https://[::1]/x", "https://metadata.google.internal/x", "https://user:pw@example.com/", "https://example.com:8443/x", "ftp://example.com", "not a link"])
    assert.equal(linkCheck(bad).ok, false, bad);
  for (const ip of ["10.0.0.1", "127.0.0.1", "169.254.169.254", "172.16.5.4", "192.168.1.1", "100.64.0.1", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:10.0.0.1"]) assert.equal(isPrivateIp(ip), true, ip);
  for (const ip of ["93.184.216.34", "142.250.185.78", "2a00:1450:4001:80b::200e"]) assert.equal(isPrivateIp(ip), false, ip);
});

test("IM2b: a page's own recipe data is read first, in a @graph too; else the page as plain text", () => {
  const html = `<html><head><meta property="og:site_name" content="Good Food"><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebPage"},{"@type":["Recipe"],"name":"Chicken shawarma bowl","recipeYield":["4","4 bowls"],"author":{"@type":"Person","name":"Ana"},"recipeIngredient":["500 g chicken thighs","2 tbsp olive oil"]}]}</script></head><body><script>var x=1</script><p>Hello &amp; welcome</p></body></html>`;
  assert.deepEqual(recipeFromLd(html), { name: "Chicken shawarma bowl", ingredients: ["500 g chicken thighs", "2 tbsp olive oil"], yield: "4", author: "Ana", steps: [] });
  assert.equal(recipeFromLd("<p>no recipe</p>"), null);
  assert.equal(pageText(html), "Hello & welcome");
});

test("IM3: grams written on the recipe win; other units are converted, no amount is guessed; values out of range are dropped", () => {
  assert.equal(gramsWritten("500 g"), 500); assert.equal(gramsWritten("0,5 kg"), 500); assert.equal(gramsWritten("2 tbsp"), null);
  const r = cleanRead({ title: "Margherita pizza", source: "@account_name on Instagram", servings: 2, servings_unit: "pizzas", servings_how: "recipe", items: [
    { name: "Pizza dough", written: "500 g", grams: 480, how: "converted", role: "base", calories: 260, protein: 8 },
    { name: "Mozzarella", written: "2 balls", grams: 250, how: "recipe", role: "melting cheese", calories: 280, protein: 20 },
    { name: "Basil", written: "", grams: 5, how: "recipe", role: "herb or spice", calories: 23, protein: 3.2 },
    { name: "Mystery", written: "1", grams: 50, how: "guessed", role: "other", calories: 4000, protein: 1 },
  ] })!;
  assert.deepEqual(r.items.map((i) => [i.name, i.grams, i.how]), [["Pizza dough", 500, "recipe"], ["Mozzarella", 250, "converted"], ["Basil", 5, "guessed"]]);
  assert.equal(r.servings, 2); assert.equal(r.servingsHow, "recipe");
  assert.equal(cleanRead({ title: "x", servings: 0, items: [{ name: "Egg", written: "", grams: 60, how: "guessed", role: "protein", calories: 143, protein: 13 }] })!.servingsHow, "guessed");
  assert.equal(cleanRead({ items: [] }), null);
});

test("IM4: your portion: sized for a 933 kcal dinner, 84% of one pizza; or the recipe's own, 1 of 2; under 100 g to the gram", () => {
  const sized = scaleTo(pizza, 933);
  assert.deepEqual(sized.map((i) => i.grams), [210, 83, 105, 8, 2]);
  assert.equal(Math.round(pdOf(sized)! * 10) / 10, 4.2);
  assert.deepEqual(onePortion(pizza, 2).map((i) => i.grams), [250, 100, 125, 10, 3]);
  assert.deepEqual([0.3, 4.4, 22.5, 99.4, 102].map(roundGrams), [1, 4, 23, 99, 100]);
});
test("0.2.17: sized for the meal only between half and one and a half of the recipe's portion; the cookie at 22:58 starts as one cookie", () => {
  assert.equal(sizedFits(933, 1121), true);
  assert.equal(sizedFits(130, 300), false);
  assert.equal(sizedFits(null, 300), false);
  assert.equal(sizedFits(600, 300), false);
});
test("0.2.17: optional ingredients, the recipe's own numbers per serving, names with a capital", () => {
  const r = cleanRead({ title: "Low Calorie, High Protein Choc Chip Cookie", source: "@christopherkaiyu on Instagram", servings: 2, servings_unit: "servings", servings_how: "recipe",
    stated: { calories: 234, protein: 15.5, fats: 6.75, carbs: 29.5, per: "serving" }, items: [
    { name: "light butter", written: "35g (2 tbsp)", grams: 35, how: "recipe", role: "fat", calories: 360, protein: 1, optional: false },
    { name: "extra chocolate chips", written: "15g (1 tbsp)", grams: 15, how: "recipe", role: "sweet", calories: 500, protein: 6, optional: true },
    { name: "chocolate chunks", written: "to taste", grams: 10, how: "guessed", role: "sweet", calories: 530, protein: 7, optional: true },
  ] })!;
  assert.deepEqual(r.items.map((i) => [i.name, i.optional]), [["Light butter", false], ["Extra chocolate chips", true], ["Chocolate chunks", true]]);
  assert.deepEqual(r.stated, { kcal: 234, protein: 15.5, fats: 6.75, carbs: 29.5 });
  assert.equal(cleanRead({ title: "x", servings: 2, stated: { calories: 468, protein: 31, per: "recipe" }, items: [{ name: "Egg", written: "", grams: 60, how: "guessed", role: "protein", calories: 143, protein: 13 }] })!.stated!.kcal, 234);
  assert.equal(statedDiffers({ kcal: 234, protein: 15.5, fats: null, carbs: null }, 295), true);
  assert.equal(statedDiffers({ kcal: 234, protein: 15.5, fats: null, carbs: null }, 250), false);
});

test("IM5b: add on the side: 64% of one pizza and 305 g Greek yogurt reach PD 6.4 at about 933 kcal; a side that can't is left out", () => {
  const s = sideAmount(pizza, F("Greek yogurt 2%", 73, 10), 933, 180 / 28)!;
  assert.equal(s.grams, 305);
  assert.deepEqual(s.dish.map((i) => i.grams), [160, 63, 79, 6, 2]);
  assert.equal(Math.round(kcalOfItems([...s.dish, it(305, F("Greek yogurt 2%", 73, 10))])), 934);
  assert.ok(pdOf([...s.dish, it(305, F("Greek yogurt 2%", 73, 10))])! >= 6.42);
  assert.equal(sideAmount(pizza, F("Chips", 536, 7), 933, 6.43), null);
  assert.ok(realPortions([...s.dish, { grams: s.grams }]));
});

test("IM5: a swap keeps the food's role; a melting cheese is replaced only by one that melts; every food stays", () => {
  const orig = [{ name: "Pizza dough", role: "base" as const }, { name: "Mozzarella", role: "melting cheese" as const }];
  const ok = [{ name: "Pizza dough", grams: 400, calories: 260, protein: 8, fats: null, carbs: null, role: "base" as const, was: null, change: "less" as const },
    { name: "Mozzarella, light", grams: 250, calories: 165, protein: 19, fats: null, carbs: null, role: "melting cheese" as const, was: "Mozzarella", change: "swap" as const },
    { name: "Chicken breast, cooked", grams: 150, calories: 165, protein: 31, fats: null, carbs: null, role: "protein" as const, was: null, change: "add" as const }];
  assert.equal(checkChange(orig, ok), null);
  assert.match(checkChange(orig, [ok[0], { ...ok[1], name: "Cottage cheese" }])!, /doesn't melt/);
  assert.match(checkChange(orig, [ok[0], { ...ok[1], role: "protein" }])!, /doesn't do the job/);
  assert.match(checkChange(orig, [ok[0]])!, /Mozzarella is missing/);
});

test("IM5b: your way: a side you have had with your meals before", () => {
  assert.equal(isYours("Greek yogurt", ["Greek yogurt 2%", "Chicken breast, cooked"]), true);
  assert.equal(isYours("Skyr", ["Greek yogurt 2%"]), false);
});

test("IM6: members and public pages get Adapted from as text; the screenshots never travel", () => {
  const meal: any = { id: "m1", title: "Margherita pizza", items: [{ id: "a", grams: 500, locked: true, food: { id: "f", name: "Pizza dough", brand: "estimate", calories: 260, protein: 8, fats: 2.5, carbs: 52, fiber: null, readyToEat: true } }], portion: 488, savedAt: "", source: { name: "@account_name on Instagram", from: "screenshot", at: "" }, shots: ["data:image/jpeg;base64,AAAA"] };
  const shared = sharedOf(meal, null);
  assert.equal((shared as any).source, "@account_name on Instagram"); assert.equal(JSON.stringify(shared).includes("base64"), false);
  assert.equal(cleanShared({ ...shared, shots: ["data:x"] })!.source, "@account_name on Instagram");
  assert.equal((cleanShared({ ...shared, shots: ["data:x"] }) as any).shots, undefined);
});

test("IM6: the screenshots are files (src:<recipe>:<n>), named by fingerprint in the saved data, and come back whole", () => {
  const a = "data:image/jpeg;base64,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA1", b = "data:image/jpeg;base64,BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB2";
  const st: any = { foods: [], feedback: [], items: [], meals: [{ id: "m1", title: "Pizza", items: [], source: { name: "x", from: "screenshot", at: "" }, shots: [a, b] }] };
  const ph = photosOf(st);
  assert.equal(ph.get("src:m1:1"), a); assert.equal(ph.get("src:m1:2"), b); assert.equal(ph.has("meal:m1"), false);
  const lean: any = withoutStored(st, new Set(["src:m1:1", "src:m1:2"]));
  assert.equal(lean.meals[0].shots, undefined); assert.deepEqual(lean.meals[0].source.shotSigs, [sig(a), sig(b)]);
  assert.deepEqual([...photosWanted(lean).keys()], ["src:m1:1", "src:m1:2"]);
  assert.equal(isOrphan("src:m1:1", lean), false); assert.equal(isOrphan("src:m2:1", lean), true);
  assert.deepEqual((withPhotos(lean, new Map([["src:m1:1", a]])) as any).meals[0].shots, undefined);
  assert.deepEqual((withPhotos(lean, new Map([["src:m1:1", a], ["src:m1:2", b]])) as any).meals[0].shots, [a, b]);
});

test("IM23: what a changed dish changed, for the step draft (0.2.23)", async () => {
  const { changesOf } = await import("./recipeIn");
  const f = (name: string, grams: number) => ({ grams, food: { name } });
  assert.deepEqual(changesOf([f("Butter", 113), f("Cream cheese", 678), f("Sugar", 100)], [f("Butter", 113), f("Light cream cheese", 678), f("Sugar", 60), f("Whey", 60)], ["Chill it overnight."]),
    ["Light cream cheese: new", "Sugar: 60 g instead of 100 g", "Whey: new", "Cream cheese: not in it any more", "cooking note: Chill it overnight."]);
});

test("R1 (0.2.29): the read's names read as letters, never as the page's codes", () => {
  const r = cleanRead({ title: "Mom&#8217;s apple fritters", source: "Sally McKenney, Sally&#039;s Baking Addiction", servings: 12, servings_unit: "fritters", servings_how: "recipe", items: [
    { name: "Confectioners&#039; sugar", written: "3 cups (360g)", grams: 360, how: "recipe", role: "sweet", calories: 389, protein: 0, part: "For the glaze &amp; topping" },
    { name: "Whole milk", written: "1 cup", grams: 240, how: "converted", role: "dairy", calories: 61, protein: 3.2, part: "Dough" }] })!;
  assert.equal(r.source, "Sally McKenney, Sally's Baking Addiction");
  assert.equal(r.title, "Mom’s apple fritters");
  assert.equal(r.items[0].name, "Confectioners' sugar");
  assert.equal(r.items[0].part, "Glaze & topping");
});
