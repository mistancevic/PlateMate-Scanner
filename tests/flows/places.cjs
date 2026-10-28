// JOURNEY (0.2.120, board Stories93 version 3, DT136; Milan 27 October 18:23 to 28 October 14:59, "DT136. Can go"; Tester 3):
// foods by place. Marko shops in Limassol; Belgrade's foods and members' foods seen in Belgrade wait behind their chip; a
// basic food takes Limassol's name. Where I shop is one list of places: home always on, another place's switch, its starter
// foods the first time, Delete unused keeps what was used. A trip on Plan puts its place on and tags the foods added then.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
const base = { ...seed.foods[0], photo: undefined, photos: undefined, table: undefined, barcode: undefined, icon: undefined, favorite: false };
const BG1 = { ...base, id: "bg1", name: "Pileća prsa, sirova", brand: "", source: "Reference table", refId: "chicken-breast-raw", aliases: ["Chicken breast, raw"], calories: 120, protein: 22.5, fats: 2.6, carbs: 0, fiber: 0, notes: "Reference table.", favorite: true };
const BG2 = { ...base, id: "bg2", name: "Pileći file", brand: "Farma Avala", source: "Members' foods", calories: 110, protein: 23, fats: 2, carbs: 0, fiber: 0, notes: "Members' foods, checked by a member on 2026-10-20; seen in Belgrade." };
seed.foods = [...seed.foods.map((f) => ({ ...f })), BG1, BG2];
const M = (name, brand, seen) => ({ key: name + brand, name, brand, calories: 150, protein: 20, fats: 3, carbs: 1, fiber: 0, readyToEat: false, source: "label", updatedAt: "2026-10-20T10:00:00Z", seenIn: seen });
const MEMBERS = [M("Chicken souvlaki, raw", "Kypros Farm", ["limassol"]), M("Pileća pašteta", "Sava", ["belgrade"]), M("Pileće viršle", "Avala", ["belgrade"])];
const PORT = "3302", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 1500 } });
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("chefmealan-region", "limassol");
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  await page.route("**/api/members/foods**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ foods: MEMBERS }) }));
  await page.route("**/api/search**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ products: [] }) }));
  const st = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  const main = async () => ((await page.locator("main").textContent()) || "").replace(/\s+/g, " ");
  const search = async (w) => { await page.goto(U + "/foods"); await page.waitForTimeout(1200); await page.getByLabel("Find a food").fill(w); await page.waitForTimeout(1300); };
  await search("chicken");
  const foods = (await st()).foods;
  ok(foods.find((f) => f.id === "bg1").places.join() === "belgrade" && foods.find((f) => f.id === "bg2").places.join() === "belgrade" && foods.every((f) => Array.isArray(f.places)), "every food got its place: Belgrade's from their names");
  ok(foods.find((f) => f.id === "bg1").name === "Chicken breast, raw" && foods.find((f) => f.id === "bg1").aliases.includes("Pileća prsa, sirova"), "a basic food takes Limassol's name; the Serbian stays as another name");
  let t = await main();
  ok(!/Pileći file|Pileća pašteta|Pileće viršle/.test(t) && /Chicken souvlaki/.test(t), "Limassol's search: nothing from Belgrade, Limassol's members' food shows");
  ok(/4 more in Belgrade\. Tap Belgrade to see them\./.test(t) && await page.locator(".place-chips").getByRole("button", { name: /^Belgrade · 4$/ }).count() === 1, "a line and a chip say what waits in Belgrade: " + (t.match(/\d+ more in [^.]*\./) || [""])[0]);
  await page.locator(".place-chips").getByRole("button", { name: /^Belgrade/ }).click(); await page.waitForTimeout(1300);
  t = await main();
  ok(/Pileći file/.test(t) && /Pileća pašteta/.test(t) && /Chicken breast, raw/.test(t), "Belgrade on: its foods show");
  ok((await st()).foods.length === foods.length, "the search chip adds no starter foods");
  // Where I shop
  await page.goto(U + "/me/shop"); await page.waitForTimeout(1200);
  t = ((await page.locator(".place-rows").innerText()) || "").replace(/\s+/g, " ");
  ok(/Limassol Home · \d+ foods/.test(t) && /always on/.test(t), "home is Limassol, always on");
  await page.getByRole("button", { name: "Belgrade: on" }).click(); await page.waitForTimeout(500);
  t = ((await page.locator(".place-rows").innerText()) || "").replace(/\s+/g, " ");
  ok(/Belgrade 2 foods, kept/.test(t), "Belgrade off: its 2 foods kept: " + t.slice(0, 260));
  ok(await page.getByRole("button", { name: "Delete 1 unused" }).count() === 1, "Delete unused counts only the one never used (the favourite stays)");
  await page.getByRole("button", { name: "Delete 1 unused" }).click(); await page.waitForTimeout(500);
  const left = (await st()).foods;
  ok(!left.some((f) => f.id === "bg2") && left.some((f) => f.id === "bg1"), "the unused Belgrade food is deleted; the used one stays");
  await page.getByRole("button", { name: "Show" }).click(); await page.waitForTimeout(300);
  const n0 = left.length;
  await page.getByRole("button", { name: "Munich: off" }).click(); await page.waitForTimeout(600);
  const started = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-places-started") || "[]"));
  ok(started.includes("munich") && await page.getByRole("button", { name: "Munich: on" }).count() === 1, `Munich on, the first time: its starter foods are added (${(await st()).foods.length - n0} new; the rest were in the library)`);
  // a trip on Plan
  await page.goto(U + "/plan"); await page.waitForTimeout(1300);
  await page.getByRole("button", { name: /Plan a trip/ }).click(); await page.waitForTimeout(300);
  await page.locator(".trip-card").getByRole("button", { name: "Belgrade", exact: true }).click();
  const d = new Date(); const ymd = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; const end = new Date(d); end.setDate(d.getDate() + 3);
  await page.getByLabel("Trip to").fill(ymd(end));
  await page.getByRole("button", { name: "Save the trip" }).click(); await page.waitForTimeout(500);
  ok(/Trip to Belgrade/.test(await page.locator(".trip-card").textContent()) && await page.getByRole("button", { name: /Belgrade's foods in my search: on/ }).count() === 1, "the trip is on Plan, its switch on for its days");
  await page.evaluate((base) => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.foods.push({ ...base, id: "kaj", name: "Kajmak", brand: "Mlekara Sava", source: "label", calories: 330, protein: 6, fats: 33, carbs: 2, fiber: 0, notes: "" }); localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); const o = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k === "platemate-pilot-v1") return; return o.call(this, k, v); }; }, base);
  await page.reload(); await page.waitForTimeout(1500);
  ok(((await st()).foods.find((f) => f.id === "kaj") || {}).places?.join() === "belgrade", "a food added on the trip is tagged Belgrade");
  await page.getByRole("button", { name: /Belgrade's foods in my search: on/ }).click(); await page.waitForTimeout(300);
  ok(await page.getByRole("button", { name: /Belgrade's foods in my search: off/ }).count() === 1, "the trip's switch turns its foods off");
  // the card says where it is sold
  await search("kajmak");
  ok(!/Mlekara Sava/.test(((await page.locator(".rows").textContent().catch(() => "")) || "")), "trip off: Kajmak waits with Belgrade");
  await page.locator(".place-chips").getByRole("button", { name: "All places" }).click(); await page.waitForTimeout(400);
  await page.locator(".rows .row").filter({ hasText: "Mlekara Sava" }).first().locator(".name-link").click(); await page.waitForTimeout(500);
  ok(/Sold in Belgrade ✕/.test(((await page.locator(".sold-in").innerText()) || "").replace(/\s+/g, " ")), "the card says Sold in Belgrade");
  await page.locator(".sold-in").getByRole("button", { name: "+ A place" }).click();
  await page.locator(".sold-in").getByRole("button", { name: "Limassol", exact: true }).click(); await page.waitForTimeout(300);
  ok(((await st()).foods.find((f) => f.id === "kaj") || {}).places?.join() === "belgrade,limassol", "+ A place adds Limassol");
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
