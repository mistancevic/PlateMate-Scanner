import { test } from "node:test";
import assert from "node:assert/strict";
import { synonymsOf } from "./reference";
test("0.2.100: a word in any of the pilot's languages", () => {
  const t = synonymsOf("tuna");
  assert.ok(t.includes("tunjevina") && t.includes("thunfisch") && t.includes("туњевина") && t.includes("τόνος"), t.join(", "));
  assert.ok(synonymsOf("τόνος").includes("tuna"));
  assert.ok(synonymsOf("tunjevina").includes("tuna"));
  assert.ok(synonymsOf("thunfisch").includes("tuna"));
  assert.equal(synonymsOf("xyzzy").length, 0);
});
