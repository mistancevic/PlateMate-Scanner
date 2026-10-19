import { test } from "node:test";
import assert from "node:assert/strict";
import { carryOf, carriedLists, momentOf, momentText, recipeSig } from "./carry";
import { fillDay } from "./planned";

const food = (name: string) => ({ id: name, name, calories: 150, protein: 10, fats: 5, carbs: 15, fiber: 0 }) as any;
const recipe = (id: string, title: string, grams = 100) => ({ id, title, items: [{ id: "a", food: food("Eggs"), grams, locked: true }, { id: "b", food: food("Oats"), grams: 50, locked: true }], portion: 150, savedAt: "2026-10-01T00:00:00Z" }) as any;
const card = (m: any, at: string, how?: "light" | "fine" | "heavy", sig?: string) => ({ id: `${m.id}-${at}`, meal: m, status: "eaten", recipeId: m.id, taste: "", notes: "", createdAt: at, ...(how ? { carry: { how, at, ...(sig ? { sig } : {}) } } : {}) }) as any;

test("R20: two answers that agree, and more than the other way, make the read; one is not enough; Fine is neither", () => {
  const m = recipe("m1", "Sarma");
  assert.equal(carryOf(m, [card(m, "2026-10-15T18:00:00Z", "heavy")]).read, null, "one answer is noise");
  assert.equal(carryOf(m, [card(m, "2026-10-15T18:00:00Z", "heavy"), card(m, "2026-10-17T18:00:00Z", "heavy")]).read, "heavy");
  assert.equal(carryOf(m, [card(m, "2026-10-13T18:00:00Z", "heavy"), card(m, "2026-10-15T18:00:00Z", "heavy"), card(m, "2026-10-16T18:00:00Z", "light"), card(m, "2026-10-17T18:00:00Z", "light")]).read, null, "a tie reads nothing");
  const f = carryOf(m, [card(m, "2026-10-15T18:00:00Z", "fine"), card(m, "2026-10-16T18:00:00Z", "fine"), card(m, "2026-10-17T18:00:00Z", "light")]);
  assert.equal(f.read, null); assert.equal(f.fine, 2);
  const c = carryOf(m, [card(m, "2026-10-17T18:00:00Z"), card(m, "2026-10-16T18:00:00Z", "light")]);
  assert.equal(c.eaten, 2); assert.equal(c.rows[0].how, null, "not answered yet is listed, newest first");
});

test("R20: only the last 5 count; an answer from before the foods changed is shown and stops counting", () => {
  const m = recipe("m1", "Crêpes");
  const old = [1, 2, 3].map((d) => card(m, `2026-10-0${d}T07:00:00Z`, "heavy"));
  const late = [4, 5, 6, 7, 8].map((d) => card(m, `2026-10-0${d}T07:00:00Z`, d % 2 ? "light" : "fine"));
  const r = carryOf(m, [...old, ...late]);
  assert.equal(r.heavy, 0, "the three heavy ones are older than the last 5");
  assert.equal(r.light, 2); assert.equal(r.fine, 3); assert.equal(r.read, "light");
  const before = recipeSig(recipe("m1", "Crêpes", 80));
  assert.notEqual(before, recipeSig(m), "a changed amount gives another signature");
  const b = carryOf(m, [card(m, "2026-10-10T07:00:00Z", "heavy", before), card(m, "2026-10-11T07:00:00Z", "heavy", before), card(m, "2026-10-12T07:00:00Z", "light", recipeSig(m))]);
  assert.equal(b.read, null); assert.equal(b.rows.filter((x) => x.before).length, 2);
});

test("R20: the moment: before or after training by the clock, a rest day, or only a training day", () => {
  const at = new Date(2026, 9, 15, 19, 30);
  assert.deepEqual(momentOf("Dinner", at, { kind: "strength", time: "17:30" }), { meal: "Dinner", day: "training", training: "after" });
  assert.deepEqual(momentOf("Dinner", at, { kind: "strength", time: "20:30" }), { meal: "Dinner", day: "training", training: "before" });
  assert.deepEqual(momentOf("Dinner", at, { kind: "rest" }), { meal: "Dinner", day: "rest" });
  assert.deepEqual(momentOf("Dinner", at, { kind: "strength", time: null }), { meal: "Dinner", day: "training" });
  assert.deepEqual(momentOf("Dinner", at, null), { meal: "Dinner" });
  const now = new Date(2026, 9, 19, 13, 0);
  assert.equal(momentText(at.toISOString(), { meal: "Dinner", day: "training", training: "after" }, "Dinner", now), "Thursday's dinner, after training");
  assert.equal(momentText(new Date(2026, 9, 19, 12, 30).toISOString(), undefined, "Lunch", now), "Today's lunch");
  assert.equal(momentText(new Date(2026, 9, 8, 12, 30).toISOString(), { meal: "Lunch", day: "rest" }, "Lunch", now), "8 October, lunch, rest day");
  assert.equal(momentText(new Date(2026, 9, 19, 12, 30).toISOString(), undefined, "", now), "Today, 12:30", "a meal not named says its time");
});

test("R20: Fill the day puts a heavy meal second when another fits about as well, and says so; the lists for ideas", () => {
  const slot = { id: "lunch", name: "Lunch", time: "12:30" } as any;
  const heavy = { title: "Sarma", kcal: 600, protein: 40, source: "mine", mealId: "m3" } as any;
  const other = { title: "Chicken bowl", kcal: 640, protein: 42, source: "mine", mealId: "m4" } as any;
  const reads = (m: any) => (m.mealId === "m3" ? { read: "heavy" as const, heavy: 2 } : null);
  const plain = fillDay([slot], {}, [heavy, other], { kcal: 600, protein: 40 }, null);
  assert.equal(plain[0].meal.title, "Sarma", "without answers Sarma fits best");
  const rows = fillDay([slot], {}, [heavy, other], { kcal: 600, protein: 40 }, null, reads);
  assert.equal(rows[0].meal.title, "Chicken bowl");
  assert.equal(rows[0].alternatives[0].title, "Sarma", "Change brings it");
  assert.match(rows[0].why!, /Sarma fits lunch as well, though it left you heavy, tired twice/);
  const far = { ...other, kcal: 1400 };
  assert.equal(fillDay([slot], {}, [heavy, far], { kcal: 600, protein: 40 }, null, reads)[0].meal.title, "Sarma", "a heavy meal still wins when nothing fits as well");
  const m3 = recipe("m3", "Sarma"), m1 = recipe("m1", "Crêpes");
  const cards = [card(m3, "2026-10-15T18:00:00Z", "heavy"), card(m3, "2026-10-17T18:00:00Z", "heavy"), card(m1, "2026-10-17T07:00:00Z", "light"), card(m1, "2026-10-18T07:00:00Z", "light")];
  assert.deepEqual(carriedLists([m1, m3], cards), { light: ["Crêpes"], heavy: ["Sarma"] });
});
