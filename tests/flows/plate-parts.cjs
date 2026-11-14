// JOURNEY (DT301, 0.3.149, board Stories223; Coach Milan 14 November 17:25 to 21:08, Go): an empty plate shows a plate drawn,
// with Nothing on the plate yet. Then two parts, each under its heading. Add a food: four tiles in two rows, icon above the word
// (Manual, Scan, Photo of my meal, Say what you have), each 88 px or more. After a line, Have a recipe? Start from it: Use a
// screenshot and Paste a link. Paste a link opens the box for the link, and its line names the button by its new words. With
// foods on the plate, the ways stay a row of buttons, as before.
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
    ok(await card.locator(".plate-empty-pic svg").count() === 1 && /Nothing on the plate yet/.test(await card.locator(".plate-empty-pic").innerText()), "an empty plate is drawn, with Nothing on the plate yet");
    const heads = await card.locator(".ways-head").allInnerTexts();
    ok(heads.length === 2 && heads[0] === "Add a food" && heads[1] === "Have a recipe? Start from it", "two parts, each under its heading: " + heads.join(" | "));
    const tiles = card.locator(".ways.ways-tiles > button");
    const words = (await tiles.allInnerTexts()).map((x) => x.trim());
    ok(words.join("|") === "Manual|Scan|Photo of my meal|Say what you have", "Add a food: the four tiles: " + words.join(", "));
    const boxes = await tiles.evaluateAll((xs) => xs.map((x) => { const r = x.getBoundingClientRect(), i = x.querySelector("svg").getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), h: Math.round(r.height), iconAbove: i.top < r.top + r.height / 2 }; }));
    ok(boxes[0].y === boxes[1].y && boxes[2].y === boxes[3].y && boxes[2].y > boxes[0].y && boxes[0].x === boxes[2].x, "two rows of two");
    ok(boxes.every((x) => x.h >= 88 && x.iconAbove), "each tile 88 px or more, the icon above the word");
    ok(await card.locator(".ways-head-second").evaluate((e) => getComputedStyle(e).borderTopStyle === "solid"), "a line before the second part");
    const rec = (await card.locator(".start-ways button, .start-ways label, .ways-head-second + * button, .ways-head-second + * label").allInnerTexts()).map((x) => x.trim()).filter(Boolean);
    ok(rec.includes("Use a screenshot") && rec.includes("Paste a link"), "Use a screenshot and Paste a link: " + rec.join(", "));
    await card.getByRole("button", { name: "Paste a link" }).click(); await page.waitForTimeout(500);
    ok(/tap Use a screenshot there/.test(await page.locator("main").innerText()), "the link box names the button by its new words");
    await ctx.close();
  } catch (e) { ok(false, "walkthrough crashed: " + (e && e.message)); }
  ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.join(" | ") : ""}`);
  await b.close(); server.kill();
  console.log(fail ? `\n${fail} FAILED` : "\nall passed"); process.exit(fail ? 1 : 0);
})();
