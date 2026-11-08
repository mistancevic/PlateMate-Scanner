// DT260 (0.3.114, board Stories195; Coach Milan Go 8 November 09:22): How to. Every situation has its words, its steps and a
// walkthrough that follows it; New, the card on Today and the count work as drawn.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import en from "./i18n/en.json" with { type: "json" };
import { SITUATIONS, GROUPS, isNew, newToTry, showOnToday, triedCount, untried } from "./howTo";

const E = en as Record<string, unknown>;
test("every situation has a title, a line, what it solves and 3 to 5 steps, all in English", () => {
  for (const s of SITUATIONS) {
    for (const k of ["title", "line", "what"]) assert.equal(typeof E[`howto.${s.id}.${k}`], "string", `${s.id}.${k}`);
    assert.ok(s.steps >= 3 && s.steps <= 5, `${s.id}: ${s.steps} steps`);
    for (let i = 1; i <= s.steps; i++) assert.equal(typeof E[`howto.${s.id}.s${i}`], "string", `${s.id}.s${i}`);
    assert.equal(E[`howto.${s.id}.s${s.steps + 1}`], undefined, `${s.id}: no step beyond ${s.steps}`);
    assert.ok(GROUPS.includes(s.group));
    assert.ok(s.go.tab || s.go.menu, `${s.id}: Try it opens somewhere`);
  }
  assert.equal(new Set(SITUATIONS.map((s) => s.id)).size, SITUATIONS.length);
});

test("each situation follows a walkthrough that names it", () => {
  for (const s of SITUATIONS) {
    const f = `tests/flows/${s.flow}`;
    assert.ok(fs.existsSync(f), f);
    assert.match(fs.readFileSync(f, "utf8"), new RegExp(`HOWTO: ${s.id}\\b`), `${f} names ${s.id}`);
  }
});

test("New, the count, and the card on Today", () => {
  const hands = SITUATIONS.find((s) => s.id === "handsFree")!, eat = SITUATIONS.find((s) => s.id === "eatNow")!;
  assert.equal(isNew(hands, "0.3.114"), true);
  assert.equal(isNew(eat, "0.3.114"), false);
  assert.equal(isNew(hands, "0.3.140"), false, "it ages out");
  const marks = { eatNow: { s: "tried" as const, at: "2026-11-08" }, photoLog: { s: "didnt" as const, at: "2026-11-08", note: "x" } };
  assert.equal(triedCount(marks), 1, "Didn't work is not counted as tried");
  assert.deepEqual(newToTry({}, "0.3.114").map((s) => s.id), ["handsFree", "otherLang"]);
  assert.equal(showOnToday({}, "0.3.114", null), true);
  assert.equal(showOnToday({}, "0.3.114", "0.3.114"), false, "Not now: until the next release");
  assert.equal(showOnToday({}, "0.3.115", "0.3.114"), true, "the next release shows it again");
  assert.equal(showOnToday({ handsFree: { s: "tried", at: "" }, otherLang: { s: "tried", at: "" } }, "0.3.114", null), false, "all new ones tried");
  assert.equal(untried([{ items: { eatNow: { s: "tried", at: "" } } }])?.id, "photoLog");
});
