// DT164 (0.3.6): the shared food table, one row per food everywhere, and the Foods lenses
import { test } from "node:test";
import assert from "node:assert/strict";
import { FOOD_TABLE, rowOf } from "./foodTable";
import { EXPLORER_FOODS } from "./explorer";
import { FAT_FOODS } from "./explorerFats";
import { CARB_FOODS } from "./explorerCarbs";
import { MICRO_FOODS, MEMBER_PAGES } from "./explorerMicros";
import { lensesOf, goalLines } from "./explorerFoods";

const lunch = { protein: 53, fat: 28, kcal: 867, carb: 101, share: 1 / 3 };

test("24 foods, each once; every family takes its numbers from the same row", () => {
  assert.equal(FOOD_TABLE.length, 24); assert.equal(new Set(FOOD_TABLE.map((f) => f.id)).size, 24);
  for (const f of [...EXPLORER_FOODS, ...FAT_FOODS, ...CARB_FOODS, ...MICRO_FOODS]) {
    const r = rowOf(f.id);
    assert.equal(f.kcal, r.kcal, f.id); assert.equal(f.protein, r.protein, f.id); assert.equal(f.src, r.src, f.id); assert.deepEqual(f.portion, r.portion, f.id);
  }
});

test("the vitamin pages' foods that are on the table carry the same number as the table", () => {
  const key: Record<string, keyof NonNullable<(typeof FOOD_TABLE)[number]["micro"]>> = { a: "a", d: "d", e: "e", k: "k", c: "c", b1: "b1", b2: "b2", b5: "b5", b6: "b6", fol: "fol", b12: "b12" };
  let checked = 0;
  for (const m of MEMBER_PAGES) for (const f of m.foods) {
    const fdc = /FDC (\d+)/.exec(f.src)?.[1]; const r = FOOD_TABLE.find((x) => x.src.includes(`FDC ${fdc},`));
    if (!r || !key[m.id] || !r.micro) continue;
    const v = r.micro[key[m.id]]; if (v === null) continue;
    assert.ok(Math.abs(v - f.per100) <= Math.max(0.051, 0.01 * v), `${m.id} ${f.name}: page ${f.per100}, table ${v}`); checked++;
  }
  assert.ok(checked >= 20, `checked ${checked}`);
});

test("salmon and chicken as eaten", () => {
  assert.match(rowOf("salmon").src, /FDC 175168/); assert.equal(rowOf("salmon").portion.label, "150 g, cooked");
  assert.match(rowOf("chicken").src, /FDC 171477/);
});

test("lentils: every lens, and the goal lines from the numbers, strongest first", () => {
  const l = lensesOf(rowOf("lentils"), lunch);
  assert.deepEqual([l.protein.g, l.protein.closes, l.protein.eaa, l.carbs!.fibre, l.carbs!.gi, l.fats!.g], [18, 34, 6.6, 15.8, 32, 0.8]);
  assert.deepEqual(l.micros!.map((x) => [x.id, x.share]), [["fol", 181], ["fe", 48], ["k_", 37]]);
  const g = goalLines(l, "lunch", lunch, 6.2, "maintain");
  assert.deepEqual(g.map((x) => x.mark), ["ok", "ok", "part", "part", "note"]);
  assert.equal(g[0].text, "Fibre: 15.8 g, almost twice your lunch's 8.3 g.");
  assert.ok(l.claims.includes("Low saturated fat") && l.claims.includes("High in folate"));
});

test("whey: the gaps are gaps, not zeros", () => {
  const l = lensesOf(rowOf("whey"), lunch);
  assert.equal(l.fats, null); assert.equal(l.carbs, null); assert.equal(l.micros, null);
  assert.equal(goalLines(l, "lunch", lunch, 6.2, "maintain")[0].text, "Muscle building: 14.3 g essential amino acids and 3.3 g leucine, enough for one meal.");
});

test("a row without amino acids says so: bread, milk", () => {
  assert.equal(lensesOf(rowOf("bread"), lunch).protein.eaa, null);
  assert.equal(lensesOf(rowOf("milk"), lunch).protein.eaa, null);
});
