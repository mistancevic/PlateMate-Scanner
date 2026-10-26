// npm run eval:photo: Eval 2 and 3 for Photo of my meal, against a running server with the AI key set (as eval:model).
// Each plate in photo-cases.json was weighed food by food before its photo (evals/photos/). The read is scored by code
// (photoMatch.ts): foods found, foods invented, weighed grams inside the read's range, plate kcal within 20 percent, time.
// Then a second model grades the names 1 to 5 (Eval 3). The CSV has an empty coach_label column: label a sample pass or
// fail, then npm run eval:align says how often the judge agrees with you.
import fs from "node:fs";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";
import { scorePlate, type ReadFood } from "./photoMatch";

const dir = path.dirname(new URL(import.meta.url).pathname);
const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const { cases } = JSON.parse(fs.readFileSync(path.join(dir, "photo-cases.json"), "utf8"));
const judge = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;
const esc = (s: unknown) => `"${String(s ?? "").replace(/"/g, '""')}"`;
const rows = ["id,by,meal,foods,found,invented,in_range,matched,kcal_true,kcal_read,kcal_ok,ms,judge_score,judge_reason,coach_label,coach_reason,truth,read"];
const ready = cases.filter((c: any) => fs.existsSync(path.join(dir, "photos", c.file)));
if (!ready.length) { console.log("No photos yet. Put the weighed plates in evals/photos and list them in evals/photo-cases.json (see evals/photos/README.md)."); process.exit(0); }
let foods = 0, found = 0, invented = 0, matched = 0, inRange = 0, kcalN = 0, kcalOk = 0; const times: number[] = [], scores: number[] = [];
for (const c of ready) {
  const file = path.join(dir, "photos", c.file);
  const mime = /\.png$/i.test(file) ? "image/png" : /\.webp$/i.test(file) ? "image/webp" : "image/jpeg";
  const image = `data:${mime};base64,${fs.readFileSync(file).toString("base64")}`;
  const t0 = Date.now(); let data: any = {}, err = "";
  try { const r = await fetch(`${BASE}/api/plate-photo`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image, region: c.region ?? null, library: [] }) }); data = await r.json(); if (!r.ok) err = data.error; } catch (e: any) { err = e.message; }
  const ms = Date.now() - t0; times.push(ms);
  const read: ReadFood[] = (data.foods ?? []).map((f: any) => ({ name: String(f.name ?? ""), grams: Number(f.grams) || 0, low: Number(f.low) || Number(f.grams) || 0, high: Number(f.high) || Number(f.grams) || 0, calories: typeof f.calories === "number" ? f.calories : null }));
  const s = scorePlate(c.foods, read);
  foods += s.foods; found += s.found; invented += s.invented; matched += s.matched; inRange += s.inRange;
  if (s.kcalOk !== null) { kcalN++; kcalOk += s.kcalOk ? 1 : 0; }
  let score = "", reason = "";
  if (judge && !err) {
    try {
      const j = await judge.models.generateContent({ model: process.env.JUDGE_MODEL || "gemini-flash-latest", contents: `You grade a food reader. On the plate, weighed: ${c.foods.map((f: any) => `${f.name} ${f.grams} g`).join("; ")}. The reader said: ${read.map((r) => `${r.name} ${r.grams} g`).join("; ") || "nothing"}. Score 1 to 5 how well the reader named the foods on this plate (5 = every food named so a cook would agree, nothing invented; 3 = one food missed or wrongly named; 1 = mostly wrong). Names differ in wording and language; judge the food, not the words. Ignore grams. Reply as JSON {"score": n, "reason": "one short sentence"}.`, config: { responseMimeType: "application/json" } });
      const g = JSON.parse(j.text || "{}"); score = String(g.score ?? ""); reason = g.reason ?? ""; if (score) scores.push(Number(score));
    } catch { /* the judge is optional */ }
  }
  console.log(`${err ? "ERR " : "    "}${c.id} ${s.found}/${s.foods} found, ${s.invented} invented, ${s.inRange}/${s.matched} in range, ${s.kcalTrue === null ? "kcal ?" : `${s.kcalRead} of ${s.kcalTrue} kcal${s.kcalOk ? "" : " OFF"}`}, ${ms} ms${score ? `, judge ${score}` : ""}${err ? ` error: ${err}` : ""}`);
  for (const p of s.pairs) if (!p.read || !p.inRange) console.log(`       ${p.truth} ${p.grams} g: ${p.read ? `read as ${p.read} ${p.readGrams} g, range missed` : "MISSED"}`);
  if (s.extra.length) console.log(`       invented: ${s.extra.join(", ")}`);
  rows.push([c.id, esc(c.by), c.meal ?? "", s.foods, s.found, s.invented, s.inRange, s.matched, s.kcalTrue ?? "", s.kcalRead, s.kcalOk ?? "", ms, score, esc(reason), "", "", esc(c.foods.map((f: any) => `${f.name} ${f.grams} g`).join("; ")), esc(read.map((r) => `${r.name} ${r.grams} g (${r.low} to ${r.high})`).join("; "))].join(","));
}
times.sort((a, b) => a - b);
const p50 = times[Math.floor(times.length / 2)];
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
const per10 = ready.length ? Math.round((invented / ready.length) * 100) / 10 : 0;
const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : "n/a";
console.log(`\n${ready.length} plates · foods found ${found}/${foods} (${pct(found, foods)} %, bar 90) · invented ${invented} (${per10} per 10 plates, bar 1) · weighed grams in the read's range ${inRange}/${matched} (${pct(inRange, matched)} %, bar 80) · plate kcal within 20 % ${kcalOk}/${kcalN} (bar 80 %) · p50 ${p50} ms (bar 8000) · judge average ${avg}`);
fs.mkdirSync(path.join(dir, "results"), { recursive: true });
const out = path.join(dir, "results", `photo-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}.csv`);
fs.writeFileSync(out, rows.join("\n") + "\n");
console.log(`results: ${out}  (fill coach_label with pass or fail, then npm run eval:align -- ${path.basename(out)})`);
if (pct(found, foods) < 90 || per10 > 1 || pct(inRange, matched) < 80 || (kcalN && pct(kcalOk, kcalN) < 80) || p50 > 8000) process.exitCode = 1;
