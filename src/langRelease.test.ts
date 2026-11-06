// DT239 (0.3.95, board Stories181; Go 6 November 12:24): the release check for languages. Every release ships in all three
// languages: a line of the app with no Srpski or no German stops it, and so does a line whose English changed without going
// through scripts/lang-release.ts (Srpski back to To confirm, a new German draft, both in the tables' "New in" group).
import { test } from "node:test";
import assert from "node:assert/strict";
import srFile from "./i18n/sr-Latn.json" with { type: "json" };
import deFile from "./i18n/de.json" with { type: "json" };
import madeFile from "./i18n/made-for.json" with { type: "json" };
import { englishRows, releaseLines, areaOf, type MadeFor } from "./langRelease";

type Part = Record<string, { text: string; checked: boolean }>;
const partOf = (f: any, kind: string): Part => (kind === "safety" ? f.safety : kind === "chef" ? f.chef : f.screens);
const made = (madeFile as any).lines as MadeFor;

test("every line of the app has its Srpski and its German", () => {
  const missing: string[] = [];
  for (const r of englishRows()) {
    if (!partOf(srFile, r.kind)[r.key]?.text?.trim()) missing.push(`${r.id}: no Srpski`);
    if (!partOf(deFile, r.kind)[r.key]?.text?.trim()) missing.push(`${r.id}: no German`);
  }
  assert.deepEqual(missing, [], "Draft them with npx tsx scripts/lang-release.ts");
});

test("every translation was made for the English the app shows now", () => {
  const todo = releaseLines(made).map(({ row, enBefore }) => `${row.id}: ${enBefore === undefined ? "new" : "the English changed"}`);
  assert.deepEqual(todo, [], "Run npx tsx scripts/lang-release.ts, draft the lines, then apply");
});

test("no translation is kept for a line the app no longer has", () => {
  const live = new Set(englishRows().map((r) => r.id));
  assert.deepEqual(Object.keys(made).filter((id) => !live.has(id)), []);
});

test("a changed English line is found, and a new line gets an area", () => {
  const one = englishRows().find((r) => r.id === "screen.tab.plate")!;
  const changed: MadeFor = { ...made, [one.id]: { ...made[one.id], en: "Your plate" } };
  const got = releaseLines(changed);
  assert.equal(got.length, 1); assert.equal(got[0].enBefore, "Your plate");
  const { [one.id]: _gone, ...without } = made;
  assert.equal(releaseLines(without)[0].enBefore, undefined, "a new line has no English before");
  assert.equal(areaOf({ ...one, id: "screen.plan.newThing", key: "plan.newThing" }, made).area, "Plan");
  assert.equal(areaOf(one, made).area, made[one.id].area, "a known line keeps its area");
});
