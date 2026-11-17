// JOURNEY (DT308 Release 1, 0.3.154, boards Stories236; Coach Milan 16 November 21:40 to 17 November 14:50, Go 14:50): the empty
// Plate. On top, the grey words Meal title with a pencil; no meal's name is guessed. One card: a small empty plate with Nothing
// on your plate yet; the title Add to your plate; three tiles in one row, icon above the word: Recipe photo, Recipe link, and
// Photo or scan on the right, where the thumb is. Then From the list: Search all foods, three of your foods each for Protein,
// Carbs and Fat, then See all foods and Add manually. Gone from the empty Plate: What are you craving?, Chef Mealan's field,
// the tiles Manual, Scan, Photo of my meal and Say what you have, and Fit to my target. Recipe link opens the box for the
// link, and its line names the tile by its words. With a food on the plate, the plate keeps its 0.3.152 look.
// Replaces the walkthrough of DT301 (0.3.149, board Stories223), whose four tiles and second heading are gone.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = []; seed.feedback = [];
const PORT = "3523", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  try {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1600 }, timezoneId: "Europe/Berlin" }); const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, seed);
    await require("./adult.cjs")(page);
    await page.goto(U + "/plate"); await page.waitForTimeout(1500);
    const card = page.locator(".plate-card").first();
    const main = async () => ((await page.locator("main").innerText()) ?? "").replace(/\s+/g, " ");
    // the top: Meal title, grey, with a pencil
    const title = page.locator(".title-row .title-input"), pen = page.locator(".title-row .title-pen");
    const pb = await pen.boundingBox();
    ok(await title.count() === 1 && await title.inputValue() === "" && await title.getAttribute("placeholder") === "Meal title" && await pen.getAttribute("aria-label") === "Edit the title" && pb.width >= 44 && pb.height >= 44, "the top says Meal title in grey, with a pencil of at least 44 px; no name is guessed");
    await pen.click(); await page.waitForTimeout(200);
    ok(await title.evaluate((x) => document.activeElement === x), "the pencil opens the title to type");
    // the card
    ok(await card.locator(".plate-empty-pic svg").count() === 1 && (await card.locator(".plate-empty-pic").innerText()).trim() === "Nothing on your plate yet." && (await card.locator(".plate-empty-pic svg").boundingBox()).width <= 90, "a small empty plate is drawn, with Nothing on your plate yet.");
    const heads = await card.locator(".ways-head").allInnerTexts();
    ok(heads.join(" | ") === "Add to your plate | From the list", "two parts, each under its heading: " + heads.join(" | "));
    const tiles = card.locator(".ways.ways-three > *");
    const words = (await tiles.allInnerTexts()).map((x) => x.trim());
    ok(words.join("|") === "Recipe photo|Recipe link|Photo or scan", "Add to your plate: three tiles, Photo or scan on the right: " + words.join(", "));
    const boxes = await tiles.evaluateAll((xs) => xs.map((x) => { const r = x.getBoundingClientRect(), i = x.querySelector("svg").getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), h: Math.round(r.height), iconAbove: i.top < r.top + r.height / 2 }; }));
    ok(boxes[0].y === boxes[1].y && boxes[1].y === boxes[2].y && boxes[0].x < boxes[1].x && boxes[1].x < boxes[2].x, "one row of three");
    ok(boxes.every((x) => x.h >= 76 && x.iconAbove), "each tile 76 px or more, the icon above the word");
    const m = await main();
    ok(!/What are you craving|Find ideas|Fit to my target|Empty plate|Quick picks/.test(m) && await page.getByRole("button", { name: /^(Manual|Scan|Photo of my meal|Say what you have)$/ }).count() === 0 && await page.locator(".crave").count() === 0, "gone from the empty Plate: What are you craving?, his field, Manual, Scan, Photo of my meal, Say what you have, Fit to my target");
    // From the list
    const list = card.locator(".from-list");
    ok(await list.getByLabel("Search all foods").count() === 1 && await list.locator("input.plate-search").getAttribute("placeholder") === "Search all foods", "From the list: Search all foods");
    const groups = await list.locator(".macro-group").allInnerTexts();
    const per = await list.evaluate((x) => { const out = []; for (const e of x.querySelectorAll(".rows > *")) { if (e.classList.contains("macro-group")) out.push(0); else if (e.classList.contains("row-food") && out.length) out[out.length - 1]++; } return out; });
    ok(groups.join(" | ") === "Protein | Carbs | Fat" && per.every((n) => n >= 1 && n <= 3), "three of your foods each for Protein, Carbs and Fat: " + groups.join(" | ") + " (" + per.join(", ") + ")");
    const ends = (await list.locator(".list-ends button").allInnerTexts()).map((x) => x.trim());
    ok(ends.join(" | ") === "See all foods | Add manually" && await list.locator(".list-ends button").evaluateAll((xs) => xs.every((x) => x.getBoundingClientRect().height >= 44)), "then See all foods and Add manually, each at least 44 px: " + ends.join(" | "));
    const order = await card.evaluate((x) => [".plate-empty-pic", ".ways-three", ".from-list"].map((s) => x.querySelector(s).getBoundingClientRect().top));
    ok(order[0] < order[1] && order[1] < order[2], "the order: the empty plate, Add to your plate, From the list");
    // Add manually opens the sheet for a food the list does not have
    await list.getByRole("button", { name: "Add manually" }).click(); await page.waitForTimeout(500);
    ok(await page.locator(".sheet-backdrop h2, [role=dialog] h2").filter({ hasText: "Manual" }).count() === 1, "Add manually opens the sheet for a food of your own");
    await page.keyboard.press("Escape"); await page.waitForTimeout(200);
    if (await page.locator(".sheet-backdrop").count()) { await page.locator(".sheet-backdrop").first().click({ position: { x: 10, y: 10 } }); await page.waitForTimeout(300); }
    // See all foods opens Foods
    await page.goto(U + "/plate"); await page.waitForTimeout(1200);
    await page.locator(".from-list").getByRole("button", { name: "See all foods" }).click(); await page.waitForTimeout(600);
    ok(/\/foods$/.test(page.url()) || /My foods|Foods/.test(await page.locator(".topbar, header").first().innerText()), "See all foods opens Foods");
    await page.goto(U + "/plate"); await page.waitForTimeout(1200);
    // Recipe link opens the box for the link
    await page.locator(".plate-card").first().getByRole("button", { name: "Recipe link" }).click(); await page.waitForTimeout(500);
    ok(await page.getByLabel("Link to a recipe").count() === 1 && /tap Recipe photo there/.test(await main()), "Recipe link opens the box for the link; its line names the tile by its words");
    await page.getByRole("button", { name: "Cancel" }).first().click(); await page.waitForTimeout(400);
    // Photo or scan opens the camera
    await page.locator(".plate-card").first().getByRole("button", { name: "Photo or scan" }).click(); await page.waitForTimeout(1500);
    ok(await page.locator(".camera-modal").count() === 1 && (await page.locator(".cam-modes button[aria-pressed=true]").textContent()) === "Meal", "Photo or scan opens the camera, in Meal mode");
    await page.locator(".cam-round").first().click(); await page.waitForTimeout(500);
    // a food from the list: on the plate, and the plate keeps its look with foods
    await page.locator(".from-list .row-food").first().getByRole("button", { name: /Add/ }).click(); await page.waitForTimeout(700);
    const st = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
    ok(st.items.length === 1 && await page.locator(".plate-empty-pic, .ways-three, .from-list").count() === 0 && /Empty plate/.test(await main()) && await page.getByRole("button", { name: "Fit to my target" }).count() >= 1, "+ Add on a food puts it on the plate; with a food the plate keeps its look, with Fit to my target");
    // in Serbian and German
    for (const [lang, a1, a2, a3] of [["sr-Latn", "Naziv obroka", "Dodaj na svoj tanjir | Sa liste", "Slika recepta | Link recepta | Slika ili skeniranje"], ["de", "Titel der Mahlzeit", "Auf deinen Teller legen | Aus der Liste", "Rezeptfoto | Rezeptlink | Foto oder Scan"]]) {
      await page.evaluate((l) => { localStorage.setItem("chefmealan-lang", l); const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.items = []; s.title = ""; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); }, lang);
      await page.goto(U + "/plate"); await page.waitForTimeout(1300);
      const c2 = page.locator(".plate-card").first();
      const got = [await page.locator(".title-row .title-input").getAttribute("placeholder"), (await c2.locator(".ways-head").allInnerTexts()).join(" | "), (await c2.locator(".ways.ways-three > *").allInnerTexts()).map((x) => x.trim()).join(" | ")];
      ok(got[0] === a1 && got[1] === a2 && got[2] === a3, `the empty Plate in ${lang}: ${got.join("; ")}`);
    }
    await ctx.close();
  } catch (e) { ok(false, "walkthrough crashed: " + (e && e.message)); }
  ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.join(" | ") : ""}`);
  await b.close(); server.kill();
  console.log(fail ? `\n${fail} FAILED` : "\nall passed"); process.exit(fail ? 1 : 0);
})();
