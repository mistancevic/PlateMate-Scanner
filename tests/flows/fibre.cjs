// JOURNEY INVARIANT (DT342, 0.3.185, board Stories285; Coach Milan, Go 23 November 2026, 16:21): fibre, 0 where it is a fact.
// Olive oil from a pack with no fibre value counts as 0 (none by nature): the plate has a real fibre letter, the numbers say
// fibre in grams and one line names the oil; the oil's own row reads fi-, and its own values stay as on its pack. With a food
// that has no fibre value and is not on the list (a muesli bar), the plate counts what is known: fibre 6* g, a * line says at
// least 6 g and names the food, and the letter has a * (fi*, never fi-*). The muesli bar's card says to add the fibre from the
// pack in Review the label. No guessed number.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const PORT = 3610, U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(path.join(__dirname, "seed.json"), "utf8"));
const food = (id, name, brand, calories, protein, carbs, fats, fiber, icon, source = "label") => ({ ...seed.foods[0], id, name, brand, source, calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined, icon });
const it = (g, f) => ({ id: f.id + "i", grams: g, locked: false, food: f });
const oil = food("ol", "Olive oil", "Bertolli", 828, 0, 0, 92, null, "🫒");
const bar = food("mb", "Muesli bar", "Corny", 400, 6, 62, 13, null, "🍫");
const base = [it(150, food("ch", "Chicken breast, cooked", "", 165, 31, 0, 3.6, 0, "🍗", "basic")), it(150, food("rc", "Rice, cooked", "", 130, 2.7, 28, 0.3, 0.4, "🍚", "basic")), it(200, food("br", "Broccoli, steamed", "", 35, 2.4, 4.4, 0.4, 2.6, "🥦", "basic")), it(10, oil)];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: String(PORT), GEMINI_API_KEY: "" }, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const errs = [];
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const txt = async (l) => ((await l.textContent()) || "").replace(/\s+/g, " ").trim();
  const open = async (items) => {
    const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
    p.on("pageerror", (e) => errs.push(e.message));
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "female", birthYear: 1985, heightCm: 168, weightKg: 62, lifestyle: { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, { ...seed, foods: [...seed.foods, oil, bar], meals: [], items });
    await require("./adult.cjs")(p);
    await p.goto(U + "/"); await p.waitForTimeout(900); await p.locator("nav button").filter({ hasText: /^(Plate)$/ }).click(); await p.waitForTimeout(900);
    return p;
  };
  const fibreLetter = async (p) => (await p.locator(".readout-letters .letters").allTextContents())[2];
  const fibreCell = async (p) => txt(p.locator(".nt-in.nt-row").filter({ hasText: /^Fibre/ }).locator("span").nth(1));
  try {
    // AC1, AC3, AC7: olive oil counts as 0
    let p = await open(base);
    ok(await fibreLetter(p) === "fi", "AC1: the plate has a real fibre letter, fi: " + await fibreLetter(p));
    const oilRow = await txt(p.locator(".row").filter({ hasText: /Olive oil/ }).locator(".letters"));
    ok(/fi-/.test(oilRow) && !/fi\?/.test(oilRow), "AC7: the oil's row reads fi-: " + oilRow);
    await p.locator(".letters-row").first().click(); await p.waitForTimeout(400);
    ok(await fibreCell(p) === "6", "AC1: the numbers say fibre 6 g: " + await fibreCell(p));
    ok(/Olive oil counts as 0 fibre: none by nature\./.test(await txt(p.locator(".nt-fibre"))), "AC3: one line names the oil: " + await txt(p.locator(".nt-fibre")));
    const kept = await p.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).foods.find((f) => f.id === "ol").fiber);
    ok(kept === null, "AC1: the oil's own values stay as on its pack, fibre empty");
    await p.context().close();
    // AC4, AC5, AC6: a muesli bar with no fibre value
    p = await open([...base, it(45, bar)]);
    ok(await fibreLetter(p) === "fi*", "AC5: the letter has a *, fi*, never fi-*: " + await fibreLetter(p));
    await p.locator(".letters-row").first().click(); await p.waitForTimeout(400);
    ok(await fibreCell(p) === "6*", "AC4: the numbers say fibre 6*: " + await fibreCell(p));
    const line = await txt(p.locator(".nt-fibre"));
    ok(/^\* Fibre: at least 6 g\. 1 food without a value: Muesli bar\./.test(line) && /Olive oil counts as 0/.test(line), "AC4: the * line: " + line);
    await p.locator(".name-link").filter({ hasText: /Muesli bar/ }).click(); await p.waitForTimeout(600);
    const card = await txt(p.locator(".fibre-line"));
    ok(/No fibre on this food's values\. If the pack gives it, add it in Review the label/.test(card), "AC6: the muesli bar's card says where to add it: " + card);
    await p.context().close();
    // AC6: a food on the list says it counts as 0
    p = await open(base);
    await p.locator(".name-link").filter({ hasText: /Olive oil/ }).click(); await p.waitForTimeout(600);
    ok(/Olive oil has none by nature, so it counts as 0 on your plate/.test(await txt(p.locator(".fibre-line"))), "AC6: the oil's card says it counts as 0");
    await p.context().close();
    // AC5: only a food without a value: fi? stays
    p = await open([it(45, bar)]);
    ok(await fibreLetter(p) === "fi?", "AC5: no food with a fibre value: fi?: " + await fibreLetter(p));
    await p.context().close();
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
