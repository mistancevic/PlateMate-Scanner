import test from "node:test";
import assert from "node:assert/strict";
import { secondsIn, timerName, parseCommand, howMuch, leftLine, spoken, clock, minutesWords } from "./cook";
import type { Ingredient } from "./pilot";

const food = (id: string, name: string) => ({ id, name, brand: "", calories: 100, protein: 10, carbs: 10, fats: 1, fiber: 0 }) as any;
const items: Ingredient[] = [
  { id: "r", grams: 80, locked: false, food: food("r", "Basmati rice, dry") },
  { id: "c", grams: 160, locked: false, food: food("c", "Chicken breast, raw") },
  { id: "s", grams: 120, locked: false, food: food("s", "Spinach, fresh") },
] as any;
const steps = [
  "Rinse [[i:r|rice]] and bring it to the boil in 200 ml water. Cover and cook on low heat for 12 minutes.",
  "Cut [[i:c|chicken]] into strips.",
  "Fry the chicken 6 to 8 minutes, turning once.",
  "Add [[i:s|spinach]]. Stir 2 minutes.",
];

test("a step's timer comes from its own words", () => {
  assert.equal(secondsIn(steps[0]), 720);
  assert.equal(secondsIn(steps[2]), 360, "a range starts the timer at its first number, to check early");
  assert.equal(secondsIn("Bake for 1 hour."), 3600);
  assert.equal(secondsIn("Rest it for thirty seconds."), 30);
  assert.equal(secondsIn("Simmer for ten minutes."), 600);
  assert.equal(secondsIn(steps[1]), null);
  assert.equal(secondsIn("Add 2 eggs."), null);
});
test("a timer is named after the step's first food", () => {
  assert.equal(timerName(steps[0], 0), "Rice");
  assert.equal(timerName(steps[2], 2), "Step 3");
});
test("what is said becomes a command", () => {
  const k = (s: string) => parseCommand(s).kind;
  assert.equal(k("Next"), "next");
  assert.equal(k("next step please"), "next");
  assert.equal(k("go back"), "back");
  assert.equal(k("previous"), "back");
  assert.equal(k("Repeat"), "repeat");
  assert.equal(k("say that again"), "repeat");
  assert.equal(k("what's left"), "left");
  assert.equal(k("Stop."), "stop");
  assert.deepEqual(parseCommand("How much rice?"), { kind: "howMuch", food: "rice" });
  assert.deepEqual(parseCommand("how many eggs do I need"), { kind: "howMuch", food: "eggs" });
  assert.deepEqual(parseCommand("timer 5 minutes"), { kind: "timer", seconds: 300 });
  assert.deepEqual(parseCommand("set a timer for ten minutes"), { kind: "timer", seconds: 600 });
  assert.deepEqual(parseCommand("Chef, I only have 120 g chicken. What do I change?"), { kind: "ask", question: "i only have 120 g chicken what do i change" });
  assert.deepEqual(parseCommand("Hey Chef Mealan can I use frozen spinach"), { kind: "ask", question: "can i use frozen spinach" });
  assert.equal(k("chef"), "none", "Chef alone is not a question");
  assert.deepEqual(parseCommand("go to step 4"), { kind: "goto", step: 4 });
  assert.deepEqual(parseCommand("Step three"), { kind: "goto", step: 3 });
  assert.deepEqual(parseCommand("back to step 2"), { kind: "goto", step: 2 });
  assert.equal(k("next step"), "next");
  assert.equal(k("timer"), "none");
  assert.equal(k("the onions smell lovely"), "none");
});
test("how much comes from the amounts being cooked, with the step it is in", () => {
  assert.equal(howMuch("rice", steps, items), "80 g basmati rice. In step 1.");
  assert.equal(howMuch("the chicken", steps, items), "160 g chicken breast. In step 2.");
  assert.equal(howMuch("salmon", steps, items), "Salmon is not in this recipe.");
  const big = items.map((i) => ({ ...i, grams: i.grams * 3 }));
  assert.equal(howMuch("rice", steps, big), "240 g basmati rice. In step 1.", "a bigger batch says the bigger amount");
});
test("what is left, and the step as it is read aloud", () => {
  assert.equal(leftLine(3, steps, items), "This is the last step.");
  assert.match(leftLine(0, steps, items), /^3 steps after this one\. Next: Cut 160 g chicken into strips\.$/);
  assert.equal(spoken(steps[0], items), "Rinse 80 grams rice and bring it to the boil in 200 millilitres water. Cover and cook on low heat for 12 minutes.");
  assert.equal(clock(220), "3:40");
  assert.equal(minutesWords(360), "6 minutes");
});
