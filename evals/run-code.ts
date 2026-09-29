// Code carrier: the swap ranking on ten golden plates. Deterministic; runs on every push.
import fs from "node:fs";
import path from "node:path";
import { rankSwaps, sameFood } from "../src/swaps";
import { uid, type Food, type Ingredient } from "../src/pilot";
const dir = path.dirname(new URL(import.meta.url).pathname);
const lib: Food[] = JSON.parse(fs.readFileSync(path.join(dir, "library.json"), "utf8")).foods;
const { cases } = JSON.parse(fs.readFileSync(path.join(dir, "swap-golden.json"), "utf8"));
const byId = (id: string) => lib.find((f) => f.id === id)!;
let feasible = 0, clean = 0, picked = 0, pickable = 0;
for (const c of cases) {
  const items: Ingredient[] = c.plate.map((p: any) => ({ id: uid(), food: { ...byId(p.food), readyToEat: true }, grams: p.grams, locked: true }));
  const slot = items.find((i) => i.food.id === c.missing)!;
  const ranked = rankSwaps(items, slot.id, lib, c.target, 300, slot.food.name);
  const top = ranked[0];
  const ok1 = !!top && top.fits;
  const ok2 = ranked.every((r) => !sameFood(r.f.name, slot.food.name) && r.f.id !== c.missing);
  feasible += ok1 ? 1 : 0; clean += ok2 ? 1 : 0;
  let pick = "";
  if (c.coach_top3?.length) { pickable++; const top3 = ranked.slice(0, 3).map((r) => r.f.id); const hit = c.coach_top3.some((id: string) => top3.includes(id)); picked += hit ? 1 : 0; pick = hit ? " coach pick in top 3" : " coach pick MISSED"; }
  console.log(`${ok1 && ok2 ? "ok  " : "FAIL"} ${c.id} without ${slot.food.name}: ${ranked.slice(0, 3).map((r) => `${r.f.name} ${r.grams ?? "-"} g${r.fits ? "" : " (no fit)"}`).join(", ")}${pick}`);
}
console.log(`\nfeasible top pick ${feasible}/${cases.length} · never the missing food ${clean}/${cases.length}${pickable ? ` · coach pick in top 3 ${picked}/${pickable}` : " · coach picks not filled in yet"}`);
if (feasible < cases.length || clean < cases.length || (pickable && picked / pickable < 0.8)) process.exitCode = 1;
