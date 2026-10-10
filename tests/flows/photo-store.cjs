// JOURNEY INVARIANT (Milan, 7 October 2026, approved on the canvas, boards P0 to P2): photos are files.
// The phone keeps photos in its own photo store, never inside the saved data, so a library full of photos still saves.
// On the first open after the release the photos in the saved data move into the store; on the next open every preview shows.
// Menu, About says how long the app took to open, how big the saved data is, and how many photos the store holds.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3174", GEMINI_API_KEY: "" }, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  // the saved data as it was before the release: 60 foods, each with a preview and two larger copies inside it
  const pic = (n, size) => "data:image/jpeg;base64," + Buffer.from(`photo-${n}-`.repeat(Math.ceil(size / 10))).toString("base64").slice(0, size);
  const base = seed.foods.find((f) => f.basis === "100g");
  const foods = Array.from({ length: 60 }, (_, i) => ({ ...base, id: `ph-${i}`, name: `Pack ${i}`, brand: "", photo: pic(i, 3000), photos: [pic(i + 100, 20000), pic(i + 200, 20000)] }));
  const old = { ...seed, foods: [...seed.foods, ...foods] };
  const before = JSON.stringify(old).length;
  await page.addInitScript((s) => {
    if (localStorage.getItem("seeded")) return; localStorage.setItem("seeded", "1");
    localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
  }, old);
  await require("./adult.cjs")(page);
  await page.goto("http://127.0.0.1:3174/"); await page.waitForTimeout(2500);
  const after = await page.evaluate(() => (localStorage.getItem("platemate-pilot-v1") || "").length);
  ok(after < before / 10, `the saved data no longer carries the photos: ${Math.round(before / 1024)} KB before, ${Math.round(after / 1024)} KB after`);
  const stored = await page.evaluate(() => new Promise((res) => { const r = indexedDB.open("chefmealan-photos"); r.onsuccess = () => { const t = r.result.transaction("photos").objectStore("photos").count(); t.onsuccess = () => res(t.result); }; r.onerror = () => res(-1); }));
  ok(stored >= 180, `the photos are in the phone's photo store: ${stored}`);
  // the next open: every preview shows, from the photo store
  await page.reload(); await page.waitForTimeout(2000);
  await require("./foods.cjs")(page); await page.waitForTimeout(400);
  const back = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).foods.filter((f) => f.id.startsWith("ph-") && typeof f.photoCount === "number").length);
  ok(back === 60, "every food remembers it has photos: " + back);
  const shown = await page.evaluate(() => [...document.querySelectorAll("img")].filter((i) => (i.getAttribute("src") || "").includes("cGhvdG8t")).length);
  ok(shown > 0, `previews show from the photo store: ${shown} on screen`);
  // a photo removed with its food leaves the store too
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.foods = s.foods.filter((f) => f.id !== "ph-0"); localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); });
  await page.reload(); await page.waitForTimeout(2000);
  const left = await page.evaluate(() => new Promise((res) => { const r = indexedDB.open("chefmealan-photos"); r.onsuccess = () => { const t = r.result.transaction("photos").objectStore("photos").get("food:ph-0"); t.onsuccess = () => res(t.result === undefined); }; }));
  ok(left, "a food that is gone takes its photos out of the store");
  // Menu, About: the number to compare
  await page.locator(".menu-button").click(); await page.waitForTimeout(300);
  await page.getByText("About", { exact: true }).first().click(); await page.waitForTimeout(300);
  const line = await page.locator(".open-line").textContent();
  ok(/Opened in \d+\.\d s · saved data \d+ KB · \d+ photos/.test(line), "About: " + line);
  console.log(errs.length ? "FAIL page errors: " + errs.join("; ") : "ok   no page errors"); if (errs.length) fail++;
  await b.close(); server.kill(); process.exitCode = fail ? 1 : 0;
})();
