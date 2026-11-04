// DT237 v2 (0.3.88, board Stories178; Coach Milan 4 November 19:15 Go): the coach's copy of Your summary in English and in
// Srpski; the coach reads it in the coach's own language; a switch of language is one line, never every row changed.
import { test } from "node:test";
import assert from "node:assert/strict";
import srLines from "./i18n/sr-Latn.json" with { type: "json" };
import { summaryOf, sharedRows, sharedParts, nextShared, type SummaryIn } from "./summary";
import { inLang } from "./lang";

const sr = (srLines as unknown as { screens: Record<string, { text: string; checked: boolean }> }).screens;
const IN: SummaryIn = {
  personal: { sex: "female", birthYear: 1990, heightCm: 168, weightKg: 64, lifestyle: { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3, where: ["Cook at home"], diet: "Everything" }, kitchens: ["Balkan"] } as any,
  safety: { situations: [], flags: [], allergies: [], none: true, declaredAt: "2026-10-20T16:00:00Z" }, tasteWords: "",
  goal: { band: "maintain", name: "Maintain", setBy: "you", at: "2026-10-30T08:00:00Z" }, avg: { kcal: 2200, protein: 180, fats: 61 },
  days: [], protein: null, pdRef: null, burn: null, home: "Germany", places: [], now: new Date("2026-11-04T10:00:00"),
};
const share = sharedParts(undefined);
const copy = (l: "en" | "sr-Latn") => inLang(l, () => sharedRows(summaryOf(IN), share));

test("DT237: the copy in Srpski takes the ticked lines; an unticked line stays English as a whole", () => {
  const keep = { ...sr["sum.goal"] }, keepAvg = { ...sr["sum.avgValue"] };
  try {
    sr["sum.goal"].checked = true; sr["sum.avgValue"].checked = false;
    const en = copy("en"), s = copy("sr-Latn"), get = (rows: typeof en, k: string) => rows.find((r) => r.key === k)!;
    assert.equal(get(en, "goal").label, "Goal");
    assert.equal(get(s, "goal").label, sr["sum.goal"].text);
    // not ticked: the English line, with the numbers in Srpski as on every screen (board Stories176, call 2)
    assert.equal(get(s, "avg").value, "2.200 kcal · 180 g protein · 61 g fat");
    sr["sum.avgValue"].checked = true;
    assert.equal(copy("sr-Latn").find((r) => r.key === "avg")!.value, "2.200 kcal · 180 g proteina · 61 g masti", "ticked: Serbian, with Serbian numbers");
    assert.equal(copy("en").find((r) => r.key === "avg")!.value, "2,200 kcal · 180 g protein · 61 g fat", "the English copy never changes");
  } finally { sr["sum.goal"] = keep; sr["sum.avgValue"] = keepAvg; }
});

test("DT237: a switch of language is one line, and no row shows as changed", () => {
  const t1 = new Date("2026-11-03T08:00:00Z"), t2 = new Date("2026-11-04T08:00:00Z");
  const first = nextShared(null, copy("en"), share, t1, { rowsSr: copy("sr-Latn"), lang: "en" })!;
  assert.equal(first.lang, "en");
  assert.equal(nextShared(first, copy("en"), share, t2, { rowsSr: copy("sr-Latn"), lang: "en" }), null, "nothing changed: nothing written");
  const second = nextShared(first, copy("en"), share, t2, { rowsSr: copy("sr-Latn"), lang: "sr-Latn" })!;
  assert.equal(second.lang, "sr-Latn");
  assert.deepEqual(second.changes.map((c) => [c.lang, c.share]), [["sr-Latn", "share"]], "one line: the language");
  // an older copy, written before 0.3.88, has no language: English is assumed, so an English phone adds no line
  const old = { ...first, lang: undefined, rowsSr: undefined };
  assert.deepEqual(nextShared(old, copy("en"), share, t2, { rowsSr: copy("sr-Latn"), lang: "en" })!.changes, []);
});

test("DT237: a newly ticked Serbian line rewrites the copy, with no change for the coach", () => {
  const keep = { ...sr["sum.goal"] };
  try {
    sr["sum.goal"].checked = false;
    const first = nextShared(null, copy("en"), share, new Date("2026-11-03T08:00:00Z"), { rowsSr: copy("sr-Latn"), lang: "sr-Latn" })!;
    sr["sum.goal"].checked = true;
    const next = nextShared(first, copy("en"), share, new Date("2026-11-04T08:00:00Z"), { rowsSr: copy("sr-Latn"), lang: "sr-Latn" })!;
    assert.ok(next, "written again");
    assert.equal(next.changes.length, 0);
    assert.equal(next.rowsSr!.find((r) => r.key === "goal")!.label, sr["sum.goal"].text);
  } finally { sr["sum.goal"] = keep; }
});
