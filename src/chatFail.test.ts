import { test } from "node:test";
import assert from "node:assert/strict";
import { failWhy, plateQuestion } from "./chatFail";

test("DT152: the reason in one line", () => {
  assert.equal(failWhy(new Error("Chef Mealan took too long and stopped. Try again in a moment.")), "I took too long and stopped.");
  assert.equal(failWhy(new TypeError("Failed to fetch")), "I couldn't be reached just now. Check the connection.");
  assert.equal(failWhy(new Error("AI quota exceeded. Retry later or use manual entry.")), "AI quota exceeded. Retry later or use manual entry.");
  assert.equal(failWhy(new Error("Chef Mealan could not answer.")), "Something went wrong on my side.");
});

test("DT152: the question from the Plate fits the server's 1,000 characters", () => {
  const head = "What should I change on my plate so it makes a lunch?";
  assert.equal(plateQuestion(head, ["50 g Bar", "7 g Yeast"]), `${head} 50 g Bar, 7 g Yeast.`);
  const many = Array.from({ length: 40 }, (_, i) => `${100 + i} g A food with a rather long name from the shop, number ${i}`);
  const q = plateQuestion(head, many);
  assert.ok(q.length <= 990, String(q.length));
  assert.match(q, /^What should I change on my plate so it makes a lunch\? 100 g .*, and \d+ more\.$/);
});
