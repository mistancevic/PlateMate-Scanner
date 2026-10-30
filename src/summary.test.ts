// DT167 (0.3.9, board Stories119): the settings map covers every setting; Your summary; what the coach sees and what changed
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { LIFESTYLE_MAP, PERSONAL_MAP, SAFETY_MAP, SHARE_PARTS, summaryOf, sharedParts, sharedRows, nextShared, changesSince, type SummaryIn } from "./summary";
import { eatsForReq } from "./eats";
import type { Personal } from "./personal";

// the keys of a type as written in its file: every field, so a new one without a line on the map fails here
function keysOf(file: string, type: string): string[] {
  const src = fs.readFileSync(new URL(file, import.meta.url), "utf8");
  const start = src.indexOf(`export type ${type} = {`); assert.ok(start >= 0, `${type} in ${file}`);
  let depth = 0, i = src.indexOf("{", start), body = "";
  for (; i < src.length; i++) { const c = src[i]; if (c === "{") depth++; if (c === "}") { depth--; if (depth === 0) break; } if (depth === 1 && c !== "{") body += c; else if (depth > 1) body += " "; }
  return [...body.replace(/\/\/.*$/gm, "").matchAll(/(?:^|[;\n,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\??\s*:/g)].map((m) => m[1]);
}
test("DT167: every field of Lifestyle, Personal and Safety has a line on the settings map", () => {
  for (const [file, type, map] of [["./plan.ts", "Lifestyle", LIFESTYLE_MAP], ["./personal.ts", "Personal", PERSONAL_MAP], ["./safety.ts", "Safety", SAFETY_MAP]] as const) {
    const keys = keysOf(file, type); assert.ok(keys.length > 8, `${type}: ${keys.join(",")}`);
    const missing = keys.filter((k) => !(k in map)); assert.deepEqual(missing, [], `${type} fields with no line on the map`);
  }
});
test("DT167: every setting marked eats reaches Chef Mealan with every request for food", () => {
  const l = { weekdays: "work", hours: "fixed", slot: "9-5", travel: "often", bed: "early", wake: "early", where: ["Canteen at work"], diet: "Other", dietOther: "Mediterranean", alcohol: "Occasionally" } as const;
  const e = eatsForReq({ lifestyle: l as any } as Personal, "maintain") as Record<string, unknown>;
  const reads: Record<string, string> = { travel: "work_travel", bed: "bed", wake: "wake", where: "where_they_eat", diet: "what_they_eat", dietOther: "in_their_words", alcohol: "how_often_they_drink" };
  for (const [k, line] of Object.entries(LIFESTYLE_MAP)) if ("chef" in line && line.chef === "eats") assert.ok(reads[k] && e[reads[k]] !== undefined, `${k} is marked eats but isn't sent`);
  assert.deepEqual([e.where_they_eat, e.work_travel], [["Canteen at work"], "a lot"]);
  assert.ok("chef" in PERSONAL_MAP.carbsFat && PERSONAL_MAP.carbsFat.chef === "eats" && typeof e.carbs_and_fat === "string");
});

const P: Personal = { sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, week: { passive: 3, active: 1, easy: 2, hard: 1 } as any,
  lifestyle: { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3, wake: "early", bed: "mid", where: ["Cook at home", "Canteen at work"], diet: "Everything", alcohol: "Occasionally", travel: "sometimes" },
  tasteChips: { like: ["Creamy", "Spicy"], not: ["Sour"], how: [] }, kitchens: ["Balkan"] };
const IN: SummaryIn = { personal: P, safety: { situations: [], flags: [], allergies: [], none: true, declaredAt: "2026-10-20T16:00:00Z" }, tasteWords: "no coriander",
  goal: { band: "maintain", name: "Maintain", setBy: "you", at: "2026-10-30T08:00:00Z" }, avg: { kcal: 2500, protein: 160, fats: 83 },
  days: [2850, 2600, 2300, 2600, 2400, 2300, 2300].map((kcal, i) => ({ kcal, carbs: [366, 303, 228, 303, 253, 228, 228][i] })),
  protein: { min: 135, max: 185, lo: 1.6, hi: 2.2 }, pdRef: 6.4, burn: 1768, home: "Germany", places: [], now: new Date("2026-10-30T10:00:00") };
test("DT167: Your summary, every answer once, what it does, whether Chef Mealan reads it", () => {
  const parts = summaryOf(IN), get = (k: string) => parts.flatMap((p) => p.rows).find((r) => r.key === k)!;
  assert.deepEqual(parts.map((p) => p.title), ["You", "Goal and numbers", "Your day", "How you eat", "Training week", "Where you shop and cook", "Health questions"]);
  assert.equal(get("body").value, "Male, born 1981, 182 cm, 85 kg"); assert.equal(get("body").chef, false); assert.equal(get("body").health, true);
  assert.match(get("body").does, /about 1,770 kcal/);
  assert.equal(get("avg").value, "2,500 kcal · 160 g protein · 83 g fat"); assert.match(get("avg").does, /^2,300 to 2,850 kcal by day\. Protein 135 to 185 g: 1\.6 to 2\.2 g a kg\.$/);
  assert.equal(get("sleep").value, "Before 6:00 · 22:00 to midnight"); assert.equal(get("sleep").does, "Your meals at 06:30, 13:15 and 20:00.");
  assert.equal(get("where").value, "Cook at home · Canteen at work"); assert.equal(get("where").chef, true);
  assert.equal(get("travel").value, "Occasionally"); assert.equal(get("travel").chef, true);
  assert.equal(get("taste").value, "I like creamy, spicy · rather not sour"); assert.equal(get("tasteWords").share, "words");
  assert.equal(get("situations").value, "None of these, answered 20 October"); assert.equal(get("allergies").share, "allergies");
});
test("DT167: what the coach sees by default; health data, diet, alcohol and your words off until switched on", () => {
  assert.deepEqual(sharedParts(undefined), ["goal", "day", "eat", "week", "shop", "health"]);
  assert.deepEqual(sharedParts({ on: { body: "2026-10-30T09:00:00Z" }, off: ["shop"] }), ["goal", "day", "eat", "week", "health", "body"]);
  assert.ok(sharedParts({ on: {}, off: ["health"] }).includes("health"), "the health questions stay as today: which and when");
  const rows = sharedRows(summaryOf(IN), sharedParts(undefined)).map((r) => r.key);
  for (const k of ["body", "diet", "alcohol", "tasteWords", "allergies"]) assert.ok(!rows.includes(k), `${k} is not shared by default`);
  assert.ok(SHARE_PARTS.filter((p) => p.health && !p.fixed).every((p) => !p.on));
});
test("DT167 version 2: kept up to date, with what changed, dated; a private part's change never shows", () => {
  const t1 = new Date("2026-10-30T10:00:00Z"), t2 = new Date("2026-11-02T08:00:00Z");
  const share = sharedParts(undefined);
  const first = nextShared(null, sharedRows(summaryOf(IN), share), share, t1)!;
  assert.equal(first.changes.length, 0, "the first copy is the initial summary");
  assert.equal(nextShared(first, sharedRows(summaryOf(IN), share), share, t2), null, "nothing changed: nothing written");
  const moved = { ...IN, personal: { ...P, lifestyle: { ...P.lifestyle!, wake: "mid" as const, alcohol: "Most days" } } };
  const second = nextShared(first, sharedRows(summaryOf(moved), share), share, t2)!;
  assert.deepEqual(second.changes.map((c) => c.text), ["Wake-up and bedtime: Before 6:00 · 22:00 to midnight → 6:00 to 8:00 · 22:00 to midnight.", "Meals: 3 a day, 06:30, 13:15 and 20:00 → 3 a day, 07:30, 13:45 and 20:00."], "alcohol is private: its change never shows");
  assert.equal(changesSince(second, t1.toISOString()).length, 2); assert.equal(changesSince(second, t2.toISOString()).length, 0);
  const less = share.filter((x) => x !== "day");
  const third = nextShared(second, sharedRows(summaryOf(moved), less), less, new Date("2026-11-03T08:00:00Z"))!;
  assert.deepEqual(third.changes.map((c) => c.text), ["Meals: 3 a day, 06:30, 13:15 and 20:00 → 3 a day, 07:30, 13:45 and 20:00.", "Stopped sharing: Your day."], "switched off: its past changes go (wake-up), only that it stopped stays; How you eat is still shared");
  assert.ok(!third.rows.some((r) => r.share === "day"));
});
