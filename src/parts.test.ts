import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanPart, partsOf, optAt, optToItem, itemToOpt, canLeaveOut, checkPart, leanFood } from "./parts";
import { cleanRead } from "./recipeIn";
import { cleanShared, sharedOf } from "./members";

const food = (name: string, calories: number, protein: number) => ({ id: name, name, brand: "estimate", basis: "100g", source: "estimate", notes: "", reviewedAt: "", readyToEat: true, calories, protein, fats: null, carbs: null, fiber: null } as any);

test("IM15: parts come from the recipe's own groups, as short names; one group is one list", () => {
  assert.equal(cleanPart("For the filling:"), "Filling"); assert.equal(cleanPart("  topping "), "Topping"); assert.equal(cleanPart(""), "");
  const it = (name: string, part: string) => ({ name, written: "100g", grams: 100, how: "recipe", role: "other", calories: 100, protein: 5, part });
  const r = cleanRead({ title: "Cheesecake", servings: 8, items: [it("Digestive biscuits", "For the base"), it("Quark", "For the filling"), it("Raspberries", "")] })!;
  assert.deepEqual(r.items.map((i) => i.part), ["Base", "Filling", "Other"]);
  const one = cleanRead({ title: "Bowl", servings: 1, items: [it("Rice", "Bowl"), it("Chicken", "Bowl")] })!;
  assert.deepEqual(one.items.map((i) => i.part), [undefined, undefined]);
});

test("IM12, IM15: the parts in the order they come; the optional foods at the plate's share", () => {
  assert.deepEqual(partsOf([{ part: "Base" }, { part: "Filling" }, { part: "Base" }, {}], [{ part: "Topping" }], [{ part: "Glaze" }]), ["Base", "Filling", "Topping", "Glaze"]);
  let n = 0; const id = () => `o${++n}`;
  const o = optAt([{ name: "Extra chocolate chips", written: "15g", note: "for max gooeyness", grams: 15, food: food("Chocolate chips", 500, 6) }, { name: "Dark chocolate", grams: 20, food: food("Dark chocolate", 550, 7), part: "Topping" }], 1 / 8, id);
  assert.deepEqual(o.map((x) => [x.grams, x.part]), [[2, undefined], [3, "Topping"]]);
  const it = optToItem(o[1]);
  assert.equal(it.part, "Topping"); assert.ok(it.optional); assert.equal(it.grams, 3);
  assert.deepEqual(itemToOpt(it), { id: "o2", name: "Dark chocolate", grams: 3, food: o[1].food, part: "Topping" });
});

test("IM16b: Leave it out on any part but the last one on the plate", () => {
  const items = [{ part: "Base" }, { part: "Filling" }, { part: "Filling" }];
  assert.equal(canLeaveOut(items, "Base"), true);
  assert.equal(canLeaveOut([{ part: "Filling" }], "Filling"), false);
  assert.equal(canLeaveOut(items, "Topping"), false);
});

test("IM16: Change on one part: every food outside it stays as it was; inside, the swaps keep their jobs", () => {
  const orig = [{ name: "Digestive biscuits", grams: 15, part: "Base", role: "base" }, { name: "Cream cheese", grams: 25, part: "Filling", role: "cheese" }, { name: "Quark", grams: 63, part: "Filling", role: "dairy" }];
  const c = (name: string, grams: number, change: any, extra: any = {}) => ({ name, grams, calories: 100, protein: 5, fats: null, carbs: null, role: "other", was: null, change, ...extra });
  const ok = [c("Digestive biscuits", 15, "same", { role: "base" }), c("Cream cheese, light", 25, "swap", { was: "Cream cheese", role: "cheese" }), c("Quark", 63, "same", { role: "dairy" })];
  assert.equal(checkPart(orig, ok as any, "Filling"), null);
  assert.match(checkPart(orig, [c("Digestive biscuits", 10, "less", { role: "base" }), ok[1], ok[2]] as any, "Filling")!, /not in the filling/);
  assert.match(checkPart(orig, [ok[0], c("Cream cheese, light", 25, "swap", { was: "Cream cheese", role: "dairy" }), ok[2]] as any, "Filling")!, /doesn't do the job/);
});

test("IM15 to IM18: members get the parts as headings; a food kept with a recipe carries no photo", () => {
  const meal: any = { id: "m", title: "Cheesecake", items: [{ id: "a", grams: 120, locked: false, part: "Base", food: food("Digestive biscuits", 480, 7) }], portion: 120, savedAt: "" };
  const sh = sharedOf(meal, null);
  assert.equal((sh.items[0] as any).part, "Base");
  assert.equal(cleanShared({ ...sh, items: [{ ...sh.items[0], part: "  for the base " }] })!.items[0].part, "Base");
  assert.equal((leanFood({ ...food("X", 1, 1), photo: "data:image/jpeg;base64,AAA", photos: ["data:x"] }) as any).photo, undefined);
});

test("0.2.20: a plate with parts, optional foods, a part left out and a card with portions left is stored data that reads back", async () => {
  const { parseState, freshState } = await import("./pilot");
  const f = food("Digestive biscuits", 480, 7);
  const it = { id: "a", grams: 15, locked: false, food: f, part: "Base" };
  const st: any = { ...freshState(), items: [it], optional: [{ id: "o", name: "Dark chocolate", grams: 3, food: food("Dark chocolate", 550, 7), part: "Topping" }], leftOut: [{ part: "Filling", items: [{ ...it, id: "b" }], at: 1 }],
    feedback: [{ id: "k", meal: { id: "m", title: "Protein cheesecake", items: [it], portion: 15, savedAt: "2026-10-17T10:00:00Z" }, status: "prepared", left: 7, taste: "", notes: "", createdAt: "2026-10-17T10:00:00Z" }] };
  const back = parseState(JSON.stringify(st));
  assert.equal(back.feedback[0].left, 7); assert.equal(back.items[0].part, "Base"); assert.equal(back.optional![0].part, "Topping");
});
