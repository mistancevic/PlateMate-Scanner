// 0.3.61 (Coach Milan 20:24): the opening's steps and their times, for the slow screen
import { test } from "node:test";
import assert from "node:assert/strict";
import { startMark, startWait, startLine, resetStartTimes } from "./startTimes";
test("0.3.61: each step of opening keeps its own time; a step still going counts on", () => {
  resetStartTimes();
  startMark("Signed in"); startWait("account");
  assert.match(startLine(), /^Signed in \d+\.\d s · account \d+\.\d s…$/);
  startMark("account");
  assert.match(startLine(), /^Signed in \d+\.\d s · account \d+\.\d s$/);
  startMark("account");
  assert.equal(startLine().split(" · ").length, 2, "a step is counted once");
});
