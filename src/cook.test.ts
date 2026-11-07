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

// 0.3.54 (Coach Milan 2 November 14:20): the phone heard its own voice and talked to itself in a circle
import { isEcho as echo } from "./cook";
test("0.3.54: the phone's own words heard back are not a command; the cook's are", () => {
  const help = "I heard you, but that isn't something I can do yet. Say next, back, repeat, how much, timer, what's left or stop. Start with Chef to ask about the dish.";
  assert.equal(echo("repeat how much timer once left or stop start with Chef to ask about the dish", help), true);
  assert.equal(echo("recipe", "Timer once left or stop start with chef to ask about the dish is not in this recipe."), true);
  assert.equal(echo("how much rice", "Step 2. Cut 160 grams chicken into strips."), false);
  assert.equal(echo("timer 6 minutes", "Step 4. Heat 8 grams olive oil in a pan. Fry the chicken 6 minutes."), false);
  assert.equal(echo("next", "Step 1. Put 25 grams vanilla whey protein powder in a bowl."), false);
  assert.equal(echo("next", help), false, "next right after the help line is the cook's");
});

// 0.3.55 (Coach Milan 14:47): a command cuts in while the phone reads
import { cutsIn } from "./cook";
test("0.3.55: next, back, stop cut in while a step is read; the phone's own help line does not", () => {
  const step = "Step 1. Put 25 grams vanilla whey protein powder in a bowl.";
  const help = "I heard you, but that isn't something I can do yet. Say next, back, repeat, how much, timer, what's left or stop. Start with Chef to ask about the dish.";
  assert.equal(cutsIn("next", step), true);
  assert.equal(cutsIn("go back", step), true);
  assert.equal(cutsIn("stop", step), true);
  assert.equal(cutsIn("go to step 2", step), true);
  assert.equal(cutsIn("next", help), false);
  assert.equal(cutsIn("whey protein powder", step), false);
  assert.equal(cutsIn("how much whey", step), false);
});

// DT217 v2 (0.3.56): moves
import { movesFor, movesFromDraft } from "./cook";
test("DT217: a step with several foods is read one food at a time, then its action", () => {
  assert.deepEqual(movesFor("Add 104 g Eggs and 100 g Milk 1.5% and 35 g Wheat flour, white and 15 g chocolate chips and stir until it's one colour."),
    ["Add 104 g Eggs.", "Add 100 g Milk 1.5%.", "Add 35 g Wheat flour, white.", "Add 15 g chocolate chips.", "Stir until it's one colour."]);
  assert.deepEqual(movesFor("Whisk [[i:a|oat flour]], [[i:b|whey]] and [[i:c|baking powder]] in a bowl."),
    ["Add [[i:a|oat flour]].", "Add [[i:b|whey]].", "Add [[i:c|baking powder]].", "Whisk them in a bowl."]);
  assert.deepEqual(movesFor("Add [[i:a|the egg]], [[i:b|egg whites]] and [[i:c|milk]]. Whisk to a thick batter. Rest it 5 minutes."),
    ["Add [[i:a|the egg]].", "Add [[i:b|egg whites]].", "Add [[i:c|milk]].", "Whisk to a thick batter.", "Rest it 5 minutes."]);
  assert.deepEqual(movesFor("Heat a pan on medium heat. Pour in [[i:a|batter]]."), ["Heat a pan on medium heat. Pour in [[i:a|batter]]."]);
  assert.deepEqual(movesFor("Fry [[i:c|chicken]], then add [[i:s|spinach]] and stir 2 minutes."), ["Fry [[i:c|chicken]], then add [[i:s|spinach]] and stir 2 minutes."], "two foods, no list: one action");
  assert.deepEqual(movesFor("Whisk 104 g eggs and 100 g milk and 35 g flour until smooth."), ["Add 104 g eggs.", "Add 100 g milk.", "Add 35 g flour.", "Whisk them until smooth."]);
  assert.deepEqual(movesFor("Anything", ["One.", "Two."]), ["One.", "Two."]);
});
test("DT217: Chef Mealan's moves are checked; a step that fails gets them in code", () => {
  const items = [{ id: "a", food: { name: "Eggs" } }, { id: "b", food: { name: "Milk" } }] as any;
  const tok = (i: any) => `[[i:${i.id}|${i.food.name.toLowerCase()}]]`;
  const r = movesFromDraft([["Crack {1} into a bowl.", "Pour in {2}.", "Whisk until smooth."], ["Heat a pan."]], ["Whisk {1} and {2} in a bowl.", "Heat a pan."], items, tok);
  assert.deepEqual(r, [{ m: ["Crack [[i:a|eggs]] into a bowl.", "Pour in [[i:b|milk]].", "Whisk until smooth."] }, { m: ["Heat a pan."] }]);
  assert.deepEqual(movesFromDraft([["Add {1} and {2}."]], ["Whisk {1} and {2}."], items, tok), undefined, "two foods in one move");
  assert.deepEqual(movesFromDraft([["Add {1}."]], ["Whisk {1} and {2}."], items, tok), undefined, "a food left out");
  assert.deepEqual(movesFromDraft([["Add 100 g {1}.", "Add {2}."]], ["Whisk {1} and {2}."], items, tok), undefined, "an amount typed");
});

// DT216 (0.3.56, rule C40): a food you cook
import { cookedFood } from "./cookWords";
test("DT216: flour and a raw egg make a plate cooked; ready foods do not", () => {
  for (const n of ["Eggs", "Egg whites", "Wheat flour, white", "Oat flour", "Chicken breast, raw", "Basmati rice, dry"]) assert.equal(cookedFood(n), true, n);
  for (const n of ["Skyr, natural", "Banana", "Quark, low fat (Magerquark)", "Eggs, hard boiled", "Egg pasta", "Oats", "vanilla whey protein powder", "chocolate chips"]) assert.equal(cookedFood(n), false, n);
});

// DT221 (0.3.58, board Stories164; Coach Milan 17:58): not caught, the phone says one short line; the words stay on screen
import { canSayLine, SAY_AGAIN } from "./cook";
test("DT221: Sorry, say that again?; the words you can say name a food of this step", () => {
  const food = (id: string, name: string) => ({ id, grams: 100, locked: false, food: { id, name } }) as any;
  const items = [food("r", "Basmati rice, dry"), food("c", "Chicken breast, raw")];
  assert.equal(SAY_AGAIN, "Sorry, say that again?");
  assert.equal(canSayLine("Fry [[i:c|chicken]] 6 minutes.", items), "You can say: next, back, repeat, how much chicken, timer 5 minutes, what's left, stop. Start with Chef to ask about the dish.");
  assert.match(canSayLine("Cook the basmati 12 minutes.", items), /how much basmati,/);
  assert.match(canSayLine("Serve.", []), /how much and a food,/);
});

// DT255 (0.3.110, board Stories190; Coach Milan 7 November 22:25 Go): the commands in Srpski and German
test("DT255: a step's minutes in Srpski and German get their timer", () => {
  assert.equal(secondsIn("Iseci luk i propržite ga 10 minuta, dok ne omekša."), 600);
  assert.equal(secondsIn("peci 40 minuta na 200 °C"), 2400);
  assert.equal(secondsIn("kuvaj pola sata"), 1800);
  assert.equal(secondsIn("Brate sie 10 Minuten im Öl."), 600);
  assert.equal(secondsIn("Backe es eine halbe Stunde."), 1800);
  assert.equal(secondsIn("6 bis 8 Minuten"), 360);
  assert.equal(secondsIn("kuvaj 1 sat"), 3600);
  assert.equal(secondsIn("Cook the rice for 12 minutes."), 720, "English as before");
});
test("DT255: a timer, what is left and a step, by voice in Srpski and German", () => {
  assert.deepEqual(parseCommand("tajmer 5 minuta"), { kind: "timer", seconds: 300 });
  assert.deepEqual(parseCommand("podesi tajmer na 10 minuta"), { kind: "timer", seconds: 600 });
  assert.deepEqual(parseCommand("tajmer pet minuta"), { kind: "timer", seconds: 300 });
  assert.deepEqual(parseCommand("Timer 5 Minuten"), { kind: "timer", seconds: 300 });
  assert.deepEqual(parseCommand("Timer auf zehn Minuten"), { kind: "timer", seconds: 600 });
  assert.equal(parseCommand("šta je ostalo").kind, "left");
  assert.equal(parseCommand("šta je još ostalo").kind, "left");
  assert.equal(parseCommand("koliko je ostalo").kind, "left");
  assert.equal(parseCommand("was fehlt noch").kind, "left");
  assert.equal(parseCommand("was kommt noch").kind, "left");
  assert.deepEqual(parseCommand("korak 2"), { kind: "goto", step: 2 });
  assert.deepEqual(parseCommand("idi na korak dva"), { kind: "goto", step: 2 });
  assert.deepEqual(parseCommand("zu Schritt 3"), { kind: "goto", step: 3 });
  assert.deepEqual(parseCommand("Schritt zwei"), { kind: "goto", step: 2 });
  assert.equal(parseCommand("dalje").kind, "next", "the rest as before");
  assert.equal(parseCommand("koliko pasulja").kind, "howMuch");
});
test("DT255: a food by voice whatever its ending", () => {
  const f = (id: string, name: string, grams: number) => ({ id, grams, locked: false, food: { id, name, brand: "", basis: "100g", source: "test", calories: 100, protein: 5 } }) as any;
  const items = [f("i0", "Pasulj, kuvan", 250), f("i1", "Crni luk", 120), f("i2", "Suncokretovo ulje", 15), f("z", "Zwiebel", 80)];
  const steps = ["Iseci [[i:i1|crni luk]] na [[i:i2|ulju]].", "Dodaj [[i:i0|pasulj]]."];
  assert.match(howMuch("pasulja", steps, items), /^250 g pasulj\. .*2/);
  assert.match(howMuch("luka", steps, items), /^120 g crni luk/);
  assert.match(howMuch("ulja", steps, items), /^15 g suncokretovo ulje/);
  assert.match(howMuch("Zwiebeln", steps, items), /^80 g zwiebel/);
});
