// DT353 (0.3.195, board DT353, canvas Page 6; Coach Milan, Go 25 November 2026, 17:27). A member's recipe page is for
// deciding: it opens on the recipe as the member wrote it (the PD card for the whole recipe, Foods, the Nutrition table, the
// steps with the recipe's amounts), then What do you do with it?, a note first, then Plan it (my portion for the meal picked),
// Put it on the Plate (my portion for the meal ahead) and Save to My recipes. Plan it stays white, with ⌄ closed and ⌃ open,
// on my own recipe's page too. The members' list is served by a mock: one recipe shared by Sam, an invented name.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(__dirname, "seed.json"), "utf8")); seed.items = [];
const fd = (name, calories, protein, carbs, fats, fiber) => ({ name, brand: "", calories, protein, carbs, fats, fiber, readyToEat: false });
const items = [{ id: "a", grams: 250, part: "Filling", food: fd("Körniger Frischkäse Tworog 2,5% Fett", 100, 12, 3, 4.5, 0) }, { id: "d", grams: 122, part: "Filling", food: fd("Eggs", 143, 12.6, 0.7, 9.5, 0) },
  { id: "h", grams: 150, part: "Filling", food: fd("Feta Leicht", 180, 17, 1, 12, 0) }, { id: "b", grams: 375, part: "Base", food: fd("Frischer Blätterteig", 400, 6, 36, 25, 1.5) }];
const tok = (id, n) => `[[i:${id}|${n}]]`;
const shared = { id: "s-burek", title: "Lazy Burek", items, steps: [`Mix ${tok("a", "körniger frischkäse tworog")}, ${tok("d", "eggs")} and ${tok("h", "feta leicht")}.`, `Lay out ${tok("b", "frischer blätterteig")} and bake at 200 °C for 25 minutes.`],
  kitchen: "Balkan", name: "Sam", cover: null, coverKind: "drawn", sharedAt: "2026-11-24T18:00:00Z", updatedAt: "2026-11-24T18:00:00Z", made: 2 };
const own = { id: "m-own", title: "Skyr cup", items: [{ id: "x", food: { ...seed.foods.find((f) => f.id === "f-skyr") }, grams: 250, locked: false }], portion: 250, savedAt: "2026-11-23T16:00:00Z", steps: ["Spoon it into a bowl."] };
const PORT = "3619", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage(); p.on("pageerror", (e) => errs.push(e.message));
  await p.clock.setFixedTime(new Date("2026-11-25T16:30:00+01:00"));
  await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, { ...seed, meals: [own], feedback: [] });
  await require("./adult.cjs")(p);
  await p.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  await p.route("**/api/members**", (r) => r.request().method() === "GET" ? r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ recipes: [shared] }) }) : r.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  const txt = async (loc) => ((await loc.count()) ? (await loc.first().innerText()).replace(/\s+/g, " ").trim() : "");
  const openShared = async () => { await p.goto(U + "/"); await p.waitForTimeout(1500); await p.locator("nav button").filter({ hasText: "Recipes" }).click(); await p.waitForTimeout(1500);
    await p.locator(".recipe-tile").filter({ hasText: "Lazy Burek" }).first().click(); await p.waitForTimeout(900); };
  try {
    await openShared();
    const card = p.locator(".rq-readout").first();
    const rows = await txt(card.locator(".rd-rows"));
    ok(/The whole recipe/.test(await txt(card.locator(".readout-top"))) && /2,194/.test(rows) && /897/.test(rows) && /93/.test(rows) && /4\.3/.test(await txt(card.locator(".pd-num > b"))), "DT353 AC1: the PD card is the whole recipe: " + rows);
    const g = await p.locator("section.rq-foods .rq-food b").allTextContents();
    ok(JSON.stringify(g.map((x) => x.trim())) === JSON.stringify(["250 g", "122 g", "150 g", "375 g"]) && await p.locator(".mb-yours, .rp-stats").count() === 0, "DT353 AC1: Foods as written, no Your dinner line, no three tiles: " + g.join(", "));
    await card.locator(".letters-row").click(); await p.waitForTimeout(400);
    const total = await txt(p.locator(".rq-readout + .nt .nt-total"));
    ok(await card.locator(".nt").count() === 0 && /897/.test(total) && /2,194/.test(total), "DT353 AC2: the numbers open under the card: " + total);
    await card.locator(".letters-row").click(); await p.waitForTimeout(300);
    const head = await txt(p.locator("section.nt-card .nt-row.nt-th"));
    ok(/ALL/.test(head) && /897 g/.test(head) && /100 G/i.test(head), "DT353 AC3: the Nutrition table shows ALL 897 g and 100 g: " + head);
    const s1 = await txt(p.locator(".rp-steps li").first());
    ok(/250 g/.test(s1) && /2 eggs/.test(s1) && /150 g/.test(s1), "DT353 AC4: step 1 with the recipe's amounts: " + s1);
    const act = p.locator("section.rq-actions");
    const btns = (await act.getByRole("button").allTextContents()).map((t) => t.replace(/[⌄⌃]/g, "").trim());
    ok(/^Sam's recipe, as written\. Plan it as it is/.test(await txt(act.locator(".mb-decide"))) && JSON.stringify(btns) === JSON.stringify(["Plan it", "Put it on the Plate", "Save to My recipes"]) && !(await p.getByRole("button", { name: /^(Make it|Keep in mine)$/ }).count()), "DT353 AC5: a note, then Plan it, Put it on the Plate, Save to My recipes: " + btns.join(", "));
    // AC10: Plan it stays white, with its arrow
    const pi = act.locator("button.plan-it");
    const white = await pi.evaluate((x) => !x.classList.contains("pill-primary"));
    ok(white && /⌄/.test(await pi.innerText()), "DT353 AC10: Plan it is white, with ⌄ when closed");
    await pi.click(); await p.waitForTimeout(500);
    ok(/⌃/.test(await pi.innerText()) && await pi.evaluate((x) => !x.classList.contains("pill-primary")) && await act.locator(".pcal").count() === 1, "DT353 AC10: open, it says Plan it ⌃, stays white, the days and meals under it");
    await act.locator(".pcal-rows").getByText("Dinner").first().click(); await p.waitForTimeout(500);
    const line = await txt(act.locator(".rq-choice-line"));
    ok(line === "Your dinner portion on Wednesday: 300 g · 733 kcal · 31 g protein · PD 4.3" && /The whole recipe is 3\.0 of these portions/.test(await txt(act)), "DT353 AC6: my dinner portion: " + line);
    ok(await act.locator("button.pill-primary").count() === 1 && /Put it in the plan/.test(await txt(act.locator("button.pill-primary"))), "DT353 AC10: the one filled button is Put it in the plan");
    await act.getByRole("button", { name: "Put it in the plan" }).click(); await p.waitForTimeout(500);
    const din = Object.values(await p.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-planned") || "{}")["2026-11-25"] || {})).find((m) => m && m.title === "Lazy Burek");
    ok(din && din.kcal === 733 && /In the plan: Wednesday, dinner, 300 g/.test(await txt(act)), "DT353 AC7: in Wednesday's dinner at 733 kcal: " + JSON.stringify(din && { kcal: din.kcal }));
    await pi.click(); await p.waitForTimeout(300); if (!(await act.locator(".pcal").count())) { await pi.click(); await p.waitForTimeout(300); }
    await act.locator(".pcal-rows").getByText("Dinner").first().click(); await p.waitForTimeout(500);
    ok(/Wednesday's dinner already holds Lazy Burek\./.test(await txt(act)) && await act.getByRole("button", { name: "Put it in its place" }).count() === 1, "DT353 AC7: a dinner that holds something is asked about first");
    await pi.click(); await p.waitForTimeout(300);
    ok(/⌄/.test(await pi.innerText()) && await act.locator(".pcal").count() === 0, "DT353 AC10: a second tap closes it: Plan it ⌄");
    // AC8: Put it on the Plate, my portion for the meal ahead
    await act.getByRole("button", { name: "Put it on the Plate" }).click(); await p.waitForTimeout(1500);
    const plateG = await p.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).items.reduce((s, i) => s + i.grams, 0));
    ok(Math.abs(plateG - 300) <= 10, `DT353 AC8: my portion for the meal ahead is on the Plate: ${Math.round(plateG)} g`);
    // AC9: Save to My recipes
    await openShared();
    await p.locator("section.rq-actions").getByRole("button", { name: "Save to My recipes" }).click(); await p.waitForTimeout(1200);
    const mine = await p.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).meals.map((m) => m.title));
    ok(mine.includes("Lazy Burek"), "DT353 AC9: a copy is in Mine: " + mine.join(", "));
    // AC10 on my own recipe's page
    await p.goto(U + "/my-recipes/m-own"); await p.waitForTimeout(1500);
    const own1 = p.locator("section.rq-actions button.plan-it");
    ok(await own1.count() === 1 && /⌄/.test(await own1.innerText()) && await own1.evaluate((x) => !x.classList.contains("pill-primary")), "DT353 AC10: my own recipe's Plan it, white, with ⌄");
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  } catch (e) { ok(false, "ran to the end: " + e.message.split("\n")[0]); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} failed` : "all passed"); process.exit(fail ? 1 : 0);
})();
