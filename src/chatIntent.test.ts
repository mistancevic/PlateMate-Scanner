import { test } from "node:test";
import assert from "node:assert/strict";
import { intentOf, wantOf, plateAnswer, planAnswer, leftAnswer, moveOf, swapOk, swapFallback, swapLead } from "./chatIntent";
import { slotsOf } from "./slots";

const slots = slotsOf({ meals: 3, window: null }); // breakfast 07:30, lunch 13:45, dinner 20:00

test("CH6: each message is sorted before the AI is asked", () => {
  assert.deepEqual(intentOf("What is on my plate?", slots), { kind: "plate" });
  assert.deepEqual(intentOf("what's on the plate", slots), { kind: "plate" });
  assert.deepEqual(intentOf("What goes with this plate?", slots), { kind: "ideas" });
  assert.deepEqual(intentOf("Swap lunch for something lighter", slots), { kind: "swap", slotId: "lunch", want: "Swap lunch for something lighter" });
  assert.deepEqual(intentOf("Move dinner to after training", slots), { kind: "move", slotId: "dinner", to: "after" });
  assert.deepEqual(intentOf("move breakfast before my workout", slots), { kind: "move", slotId: "breakfast", to: "before" });
  assert.deepEqual(intentOf("Move lunch to 12:30", slots), { kind: "move", slotId: "lunch", to: "12:30" });
  assert.deepEqual(intentOf("What's left today?", slots), { kind: "day", ask: "left" });
  assert.deepEqual(intentOf("How much protein do I still need", slots), { kind: "day", ask: "left" });
  assert.deepEqual(intentOf("What is planned for lunch?", slots), { kind: "day", ask: "plan" });
  assert.deepEqual(intentOf("I'm out, what do I take?", slots), { kind: "ideas" });
  assert.deepEqual(intentOf("Add a dessert that fits", slots), { kind: "ideas" });
  assert.deepEqual(intentOf("Leftover rice ideas", slots), { kind: "ideas" });
  assert.deepEqual(intentOf("Swap the snack", slots), { kind: "ideas" }); // three meals: no snack slot
});

test("what the person asked for in a swap", () => {
  assert.equal(wantOf("Swap lunch for something lighter"), "lighter");
  assert.equal(wantOf("change dinner, I'm hungry"), "heavier");
  assert.equal(wantOf("swap breakfast for more protein"), "protein");
  assert.equal(wantOf("swap lunch"), "other");
});

test("CH6, 1: the plate, the day and what is left, from the app's data", () => {
  assert.equal(plateAnswer([{ name: "Chicken breast, cooked", grams: 200 }, { name: "Cottage cheese", grams: 150 }], { kcal: 477, protein: 80, pd: "PD 16.8" }, "6.4"),
    "Chicken breast, cooked, 200 g and cottage cheese, 150 g. 477 kcal and 80 g protein: PD 16.8, against your 6.4.");
  assert.match(plateAnswer([], { kcal: 0, protein: 0, pd: null }, null), /empty/);
  assert.equal(planAnswer([{ name: "Breakfast", time: "07:30", meal: "Oats, skyr and banana", kcal: 472, state: "eaten" }, { name: "Lunch", time: "13:45", meal: "Sarma with skyr", kcal: 702, state: "planned" }, { name: "Dinner", time: "20:00", meal: null, kcal: null, state: "empty" }], { kcal: 2800, protein: 180 }, { kcal: 1174, protein: 88 }),
    "Today: breakfast at 07:30, oats, skyr and banana (eaten); lunch at 13:45, sarma with skyr; dinner at 20:00, nothing yet. 1,174 kcal and 88 g protein planned of 2,800 and 180.");
  assert.equal(leftAnswer({ kcal: 2800, protein: 180 }, { kcal: 850, protein: 60 }), "You have eaten 850 kcal and 60 g protein today. Left: 1,950 kcal and 120 g protein.");
  assert.match(leftAnswer({ kcal: 2000, protein: 150 }, { kcal: 2200, protein: 120 }), /200 kcal over the day's 2,000, with 30 g protein still to go/);
});

test("CH6, 3: a meal moved around the day's training, for today only", () => {
  const dinner = slots[2], lunch = slots[1];
  const t = { start: "19:00", minutes: 60, what: "strength session" };
  assert.deepEqual(moveOf(dinner, "after", t, slots), { ok: true, from: "20:00", to: "20:30", text: "Your strength session is 19:00 to 20:00. Dinner moves from 20:00 to 20:30. The meal stays the same." });
  assert.equal(moveOf(dinner, "after", { ...t, start: "17:00" }, slots).ok, false); // 20:00 is already after 18:00
  const before = moveOf(lunch, "before", { start: "14:00", minutes: 60, what: "run" }, slots);
  assert.equal(before.ok && before.to, "12:30");
  assert.match(moveOf(dinner, "after", null, slots).text, /no training with a time today, so dinner stays at 20:00/);
  assert.equal(moveOf(lunch, "12:30", null, slots).ok, true);
});

test("CH6, 2: a swap is checked by the app; the app's own picks when the ideas fail", () => {
  const now = { title: "Sarma with skyr", kcal: 702, protein: 52 };
  assert.equal(swapOk({ title: "Tuna salad with wholegrain bread", kcal: 460, protein: 38 }, now, "lighter", 6.4), null);
  assert.match(swapOk({ title: "Pizza slice", kcal: 650, protein: 20 }, now, "lighter", 6.4)!, /under the target|not lighter/);
  assert.match(swapOk({ title: "Big bowl", kcal: 690, protein: 60 }, now, "lighter", 6.4)!, /not lighter/);
  assert.match(swapOk({ title: "sarma with skyr", kcal: 500, protein: 40 }, now, "lighter", 6.4)!, /the same meal/);
  const c = [{ title: "Skyr bowl with berries", kcal: 420, protein: 46 }, { title: "Chicken, rice and greens", kcal: 640, protein: 52 }, { title: "Sarma", kcal: 410, protein: 21 }, { title: "Tuna salad wrap", kcal: 480, protein: 36 }];
  assert.deepEqual(swapFallback(c, now, "lighter", 6.4).map((x) => x.title), ["Tuna salad wrap", "Skyr bowl with berries"]);
  assert.equal(swapLead("Lunch", now, "lighter", 2), "Your lunch is sarma with skyr, 702 kcal. Two lighter lunches that keep your protein:");
  assert.equal(swapLead("Dinner", now, "lighter", 1), "Your dinner is sarma with skyr, 702 kcal. One lighter dinner that keeps your protein:");
  assert.match(swapLead("Lunch", now, "lighter", 0), /I found no lighter lunch that fits your target/);
});
