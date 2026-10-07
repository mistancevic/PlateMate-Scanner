// The full nutrition table: add lines in the review, see them on the card in order.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3189" }, stdio: ["ignore", "pipe", "pipe"] });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 1300 }, deviceScaleFactor: 2 });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  await page.addInitScript((s) => { if (!localStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); localStorage.setItem("seeded", "1"); } }, seed);
  await require("./adult.cjs")(page);
  await page.goto("http://127.0.0.1:3189/"); await page.waitForTimeout(800);
  await page.locator("nav button").filter({ hasText: "Foods" }).click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Add a food", exact: true }).click(); await page.waitForTimeout(150); await page.locator(".add-strip").getByRole("button", { name: /^Type/ }).click(); await page.waitForTimeout(400);
  await page.getByLabel("Product name").fill("Test Riegel"); 
  const order = await page.locator(".label-table .lt-name").allTextContents();
  ok(order.join("|") === "Energy|Fat|Carbohydrate|Fibre|Protein", "a new food starts with the five lines in label order: " + order.join(", "));
  for (const [n, v] of [["Energy", "380"], ["Fat", "12"], ["Carbohydrate", "30"], ["Fibre", "6"], ["Protein", "33"]]) await page.getByLabel(n, { exact: true }).fill(v);
  const addLine = async (key, amount, name) => {
    await page.getByRole("button", { name: /Add a line/ }).click();
    await page.getByLabel("Which line").selectOption(key);
    if (name) await page.getByPlaceholder("Name, as printed").fill(name);
    await page.getByPlaceholder("Amount").fill(amount);
    await page.locator(".lt-add").getByRole("button", { name: "Add", exact: true }).click(); await page.waitForTimeout(150);
  };
  await addLine("saturates", "4.1"); await addLine("polyols", "9"); await addLine("salt", "0.3"); await addLine("other", "0.4", "Taurin");
  const after = await page.locator(".label-table .lt-name").allTextContents();
  ok(after.findIndex((x) => /saturates/.test(x)) === after.findIndex((x) => /^Fat/.test(x)) + 1, "saturates sits right under fat");
  ok(after.findIndex((x) => /polyols/.test(x)) > after.findIndex((x) => /^Carbohydrate/.test(x)) && after.findIndex((x) => /polyols/.test(x)) < after.findIndex((x) => /^Fibre/.test(x)), "polyols under carbohydrate, before fibre");
  ok(after.some((x) => /Taurin.*added by you/.test(x)), "an extra line is marked as added by you");
  await page.getByLabel(/I checked the values/).check();
  await page.getByRole("button", { name: /Confirm & save food/ }).click(); await page.waitForTimeout(500);
  // since 0.1.83 (Milan, 7 October 2026) a new food saved from Foods opens its own card, so there is nothing to tap here
  ok(await page.locator(".foodcard-head b").filter({ hasText: "Test Riegel" }).count() === 1, "the new food's card opens by itself");
  const card = await page.locator(".label-table .lt-name").allTextContents();
  ok(card.length === 9, "the card shows all nine lines: " + card.join(", "));
  ok(/saturates/.test(card[2] || ""), "same order on the card");
  console.log(errs.length ? "FAIL page errors: " + errs.join("; ") : "ok   no page errors"); if (errs.length) fail++;
  await page.screenshot({ path: "/tmp/table-card.png" });
  await b.close(); server.kill(); process.exitCode = fail ? 1 : 0;
})();
