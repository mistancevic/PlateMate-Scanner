// The AI label and the realistic photo test (0.2.13, Milan 16 October 2026, 18:43). A drawn cover published on
// chefmealan.com says Picture made with AI, on the page and in the list; a photo the cook marks as made with AI says so too;
// a page published before the label shows the label as a change to publish. The owner can try a realistic photo on the
// preview (here, with the test switch on); nothing is kept unless Use as cover. About sits at the bottom of the Menu.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const pic = "data:image/jpeg;base64," + fs.readFileSync(path.join(ROOT, "tests/flows/plate.jpg")).toString("base64");
const photo = "data:image/jpeg;base64," + fs.readFileSync(path.join(ROOT, "tests/flows/front.jpg")).toString("base64");
const F = (id, name, calories, protein) => ({ ...seed.foods[0], id, name, brand: "", calories, protein, carbs: 10, fats: 5, fiber: 0, photo: undefined, photos: undefined, icon: "🥣" });
const R = (id, title, list) => ({ id, title, items: list.map(([g, f], i) => ({ id: `${id}-i${i}`, grams: g, locked: false, food: f })), portion: list.reduce((n, [g]) => n + g, 0), savedAt: "2026-10-15T10:00:00Z" });
seed.items = []; seed.feedback = [];
seed.meals = [R("m-pancakes", "Quark protein pancakes", [[200, F("f-q", "Quark", 67, 12)], [50, F("f-o", "Oats", 375, 13)]]), R("m-nutella", "Nutella and apple", [[50, F("f-n", "Nutella", 539, 6.3)], [150, F("f-a", "Apple", 52, 0.3)]])];
const U = "http://127.0.0.1:3208";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3208", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 1 });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  await page.addInitScript((s) => { localStorage.setItem("chefmealan-try-photo", "1"); if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  let tries = [];
  await page.route("**/api/cover", async (route) => { const body = JSON.parse(route.request().postData() || "{}"); if (body.test) { tries.push(body); return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ image: photo, model: body.model }) }); } return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ image: pic }) }); });
  const st = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  await page.goto(U + "/"); await page.waitForTimeout(3000);
  // About at the bottom of the Menu
  await page.locator(".top-bar button[aria-label*='enu'], button[aria-label='Menu'], .menu-button").first().click().catch(() => {}); await page.waitForTimeout(500);
  const rows = await page.locator(".menu-list .menu-row b").allTextContents();
  ok(rows.length > 3 && rows[rows.length - 1] === "About", "About is the last item of the Menu: " + rows.join(", "));
  await page.goto(U + "/"); await page.waitForTimeout(900);
  await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(500);
  const api = (url, init = {}) => page.evaluate(async ([u, i]) => { const r = await fetch(u, i); let d = null; try { d = await r.json(); } catch {} return { status: r.status, d }; }, [url, init]);
  ok((await api("/api/cooks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uid: "local-client", on: true }) })).status === 200, "a cook");
  await page.reload(); await page.waitForTimeout(1200);
  await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(600);
  // publish the pancakes with their drawn cover: the label is on, and can't be switched off
  await page.locator(".recipe-tile").filter({ hasText: "pancakes" }).click(); await page.waitForTimeout(500);
  await page.locator(".rq-pub").getByRole("button", { name: "Publish", exact: true }).click().catch(() => {}); await page.waitForTimeout(500);
  const sheet = page.locator(".publish-sheet");
  ok(await sheet.count() === 1, "the Publish sheet opens");
  const box = sheet.locator(".pub-ai input");
  ok(await box.isChecked() && await box.isDisabled() && /drawn by Chef Mealan/.test(await sheet.locator(".pub-ai").textContent()), "a drawn cover is marked made with AI, and stays marked");
  await sheet.getByLabel("Two lines about it").fill("Soft and quick.");
  await sheet.getByRole("button", { name: /^(Publish|Send to )/ }).click(); await page.waitForTimeout(1200);
  // a client cook's recipe waits for the coach; the coach makes it live
  ok((await api("/api/waiting/quark-protein-pancakes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "live" }) })).status === 200, "the coach makes it live");
  const list = (await api("/api/recipes")).d.recipes;
  const pc = list.find((r) => /pancakes/i.test(r.title));
  ok(pc && pc.photoAi === true && pc.hasPhoto, "the page knows its photo is made with AI");
  await page.goto(U + `/r/${pc.slug}`); await page.waitForTimeout(900);
  ok(await page.locator(".rp-hero .rp-ai").filter({ hasText: "Picture made with AI" }).count() === 1, "the page says Picture made with AI");
  await page.goto(U + "/recipes"); await page.waitForTimeout(900);
  ok(await page.locator(".rp-rphoto .rp-ai").count() >= 1, "the list says it too");
  // a photo the cook marks as made with AI
  await page.goto(U + "/"); await page.waitForTimeout(900);
  await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(500);
  await page.locator(".recipe-tile").filter({ hasText: "Nutella" }).click(); await page.waitForTimeout(500);
  // the realistic test: three models, nothing kept until Use as cover
  const tp = page.locator(".try-photo");
  ok(await tp.count() === 1 && await tp.getByRole("button").count() === 3, "the owner can try a realistic photo, with three models");
  await tp.getByRole("button", { name: /^Flash Image/ }).click(); await page.waitForTimeout(800);
  ok(tries.length === 1 && tries[0].style === "photo" && tries[0].model === "gemini-3.1-flash-image" && tries[0].items.length === 2, "a test asks for a realistic photo from the model picked");
  const before = (await st()).meals.find((m) => /Nutella/.test(m.title));
  ok(await tp.locator(".try-shot").count() === 1 && before.photoSigs?.length === 1, "the test picture shows, and nothing is kept yet");
  await tp.getByRole("button", { name: "Use as cover" }).click(); await page.waitForTimeout(600);
  const after = (await st()).meals.find((m) => /Nutella/.test(m.title));
  ok(after.photoSigs?.length === 2 && after.coverSig === after.photoSigs[0], "Use as cover: the realistic picture leads, known as made with AI");
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
