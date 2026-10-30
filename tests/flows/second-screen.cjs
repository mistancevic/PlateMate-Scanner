// DT177 (0.3.20, board Stories125; Coach Milan 30 October 22:16 Go): a second phone on the counter. Use another screen in cook
// mode opens a session with a 4-letter code and a QR code; another phone joins at /cook with no sign-in, once; both screens
// move together (step, ticks); the kitchen screen sees the recipe and the steps only; Chef, look sends one photo with the step;
// End on the cooking phone closes the kitchen screen, which keeps nothing.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
const food = (id, name, calories, protein, carbs, fats, fiber) => ({ ...seed.foods[0], id, name, brand: "", calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined, icon: "🍽️" });
const items = [[160, food("c", "Chicken breast, raw", 120, 22.5, 0, 2.6, 0)], [80, food("r", "Basmati rice, dry", 356, 8.5, 78, 0.9, 1.3)], [120, food("s", "Spinach, fresh", 23, 2.9, 3.6, 0.4, 2.2)], [8, food("o", "Olive oil", 884, 0, 0, 100, 0)], [6, food("g", "Garlic", 149, 6.4, 33, 0.5, 2.1)]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, food: f }));
const STEPS = [
  "Rinse [[i:r|rice]] and bring it to the boil in 200 ml water. Cover and cook on low heat for 12 minutes.",
  "Cut [[i:c|chicken]] into strips. Season with salt and pepper.",
  "Slice [[i:g|garlic]] thin.",
  "Heat [[i:o|olive oil]] in a pan on medium high heat. Fry the chicken 6 minutes, turning once, until no pink is left inside.",
  "Add [[i:s|spinach]] and the garlic. Stir 2 minutes, until the spinach wilts.",
  "Put the rice in a bowl and the chicken and spinach on top.",
];
seed.items = []; seed.feedback = [];
const lent = [[300, food("l", "Red lentils, dry", 352, 24.6, 63, 1.1, 10.7)], [1000, food("w", "Vegetable stock", 5, 0.2, 0.7, 0.1, 0)]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, food: f }));
seed.meals = [{ id: "m-soup", title: "Lentil soup for four", items: lent, portion: 1300, makes: { n: 4, unit: "portions" }, steps: ["Rinse [[i:l|lentils]].", "Simmer them in [[i:w|stock]] for 25 minutes."], stepsFor: lent.map((i) => i.food.name), savedAt: "2026-10-27T10:00:00Z" }, { id: "m-bowl", title: "Chicken rice bowl", items, portion: 374, steps: STEPS, stepsFor: items.map((i) => i.food.name), savedAt: "2026-10-28T10:00:00Z" }];
const PORT = "3198", B = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(B + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (ears) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.install({ time: new Date("2026-10-30T18:40:00") });
    await page.addInitScript(([s, ears]) => {
      if (!sessionStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); sessionStorage.setItem("seeded", "1"); }
      // the stand-in voice: what is read aloud is kept
      window.__spoken = [];
      const synth = { speak: (u) => window.__spoken.push(u.text), cancel: () => {}, getVoices: () => [] };
      Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true });
      window.SpeechSynthesisUtterance = function (t) { this.text = t; };
      // the stand-in screen lock
      window.__locks = 0;
      Object.defineProperty(navigator, "wakeLock", { value: { request: async () => { window.__locks++; return { release: async () => {} }; } }, configurable: true });
      // the stand-in ears: the walkthrough says something with __say
      if (ears) {
        window.__recs = [];
        window.SpeechRecognition = function () { const me = this; window.__recs.push(me); me.start = () => { me.on = true; }; me.stop = () => { me.on = false; }; };
        window.__say = (text) => { const r = window.__recs.filter((x) => x.on).at(-1); if (!r) return false; const res = [{ 0: { transcript: text }, isFinal: true, length: 1 }]; r.onresult({ results: res }); return true; };
      } else { delete window.SpeechRecognition; delete window.webkitSpeechRecognition; }
    }, [seed, ears]);
    await require("./adult.cjs")(page);
    return { ctx, page };
  };
  try {
    const A = await open(true), K = await open(true), C = await open(true);
    const page = A.page, kp = K.page;
    await page.goto(B + "/"); await page.waitForTimeout(900); await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(500); await page.locator(".recipe-tile").filter({ hasText: "Chicken rice bowl" }).click(); await page.waitForTimeout(500);
    await page.getByRole("button", { name: "Cook it as written", exact: true }).click(); await page.waitForTimeout(1200);
    await page.getByRole("button", { name: "Start cooking", exact: true }).click(); await page.waitForTimeout(400);
    const cm = page.locator(".cook-mode");
    await cm.getByRole("button", { name: "Buttons only" }).click().catch(() => {});
    ok(await cm.getByRole("button", { name: /Use another screen/ }).count() === 1, "cook mode offers Use another screen");
    await cm.getByRole("button", { name: /Use another screen/ }).click(); await page.waitForTimeout(600);
    const code = (await cm.locator(".pair-code").textContent()).trim();
    ok(/^[A-Z2-9]{4}$/.test(code), "a 4-letter code: " + code);
    ok(await cm.locator(".cook-pair svg.qr").count() === 1 && (await cm.locator(".cook-pair svg.qr").getAttribute("data-text")).endsWith(`/cook?c=${code}`), "and a QR code for /cook with the code");
    ok(/works once and ends after 10 minutes/.test(await cm.locator(".cook-pair").textContent()), "it says the code works once, for 10 minutes");
    // the kitchen screen joins, no sign-in
    await kp.goto(B + "/cook"); await kp.waitForTimeout(800);
    ok(/Kitchen screen/.test(await kp.textContent("body")) && await kp.locator("#kitchen-code").count() === 1, "/cook asks for the code, no sign-in");
    await kp.locator("#kitchen-code").fill(code.toLowerCase()); await kp.getByRole("button", { name: "Join" }).click(); await kp.waitForTimeout(800);
    const kc = kp.locator(".cook-mode");
    ok(await kc.count() === 1 && /Chicken rice bowl/.test(await kc.locator(".cook-title").textContent()) && /1 of 6/.test(await kc.locator(".cook-count").textContent()), "joined: the recipe on step 1 of 6");
    ok(/Rinse 80 g rice/.test(await kc.locator(".cook-text").textContent()), "with the amounts cooked");
    const body = await kp.textContent("body");
    ok(!/kcal|\bPD\b|g protein|Maintain|your goal/i.test(body), "nothing about the person: no kcal, protein, PD or goal: " + (body.match(/kcal|\bPD\b|g protein|Maintain|your goal/i) || [""])[0]);
    await page.waitForTimeout(2600);
    ok(/Also on the kitchen screen · step 1 of 6/.test(await cm.locator(".cook-link").textContent()), "the cooking phone says the kitchen screen is on");
    // the code works once
    await C.page.goto(B + "/cook"); await C.page.waitForTimeout(600); await C.page.locator("#kitchen-code").fill(code); await C.page.getByRole("button", { name: "Join" }).click(); await C.page.waitForTimeout(600);
    ok(/already used/.test(await C.page.textContent("body")), "a second join with the same code: already used");
    // both move together
    await kc.getByRole("button", { name: "Next ›" }).click(); await kp.waitForTimeout(300);
    await page.waitForTimeout(2600);
    ok(/2 of 6/.test(await cm.locator(".cook-count").textContent()) && await cm.getByRole("tab", { name: "Step 1, done" }).count() === 1, "Next on the kitchen screen: the phone follows to step 2, step 1 ticked");
    await cm.getByRole("tab", { name: "Step 4" }).click(); await page.waitForTimeout(400);
    await kp.waitForTimeout(2600);
    ok(/4 of 6/.test(await kc.locator(".cook-count").textContent()), "a step tapped on the phone: the kitchen screen follows to step 4");
    ok(/step 4 of 6/.test(await cm.locator(".cook-link").textContent()), "the line says step 4");
    // Chef, look: one photo with the step
    let looked = null;
    await kp.route("**/api/cook/look", (r) => { looked = JSON.parse(r.request().postData() || "{}"); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ reply: "The strips on the left are golden; turn the three at the back, about two more minutes." }) }); });
    const [chooser] = await Promise.all([kp.waitForEvent("filechooser"), kc.getByRole("button", { name: /Chef, look/ }).click()]);
    await chooser.setFiles(path.resolve(__dirname, "front.jpg")); await kp.waitForTimeout(900);
    ok(looked && looked.code === code && looked.step === 3 && /^data:image\/jpeg;base64,/.test(looked.image) && typeof looked.token === "string", "Chef, look sends one photo with step 4 and the session's token");
    ok(/YOU ASKED/.test(await kc.locator(".cook-heard").textContent()) && /Chef, look/.test(await kc.locator(".cook-heard").textContent()) && /turn the three at the back/.test(await kc.locator(".cook-heard").textContent()), "the answer shows under the step");
    ok(await cm.getByRole("button", { name: /Chef, look/ }).count() === 0, "Chef, look is on the kitchen screen only");
    // a stranger can't read the session
    const peek = await C.page.evaluate(async (c) => (await fetch(`/api/cook/state?code=${c}&token=nope-nope-nope-nope-nope-nope`)).status, code);
    ok(peek === 403, "without the token, the session can't be read: " + peek);
    // End on the phone closes the kitchen screen
    await cm.locator(".cook-link").getByRole("button", { name: "End" }).click(); await page.waitForTimeout(400);
    ok(await cm.locator(".cook-link").count() === 0 && await cm.getByRole("button", { name: /Use another screen/ }).count() === 1, "End: the line goes, Use another screen is back");
    await kp.waitForTimeout(2600);
    ok(/The session ended\. This screen kept nothing\./.test(await kp.textContent("body")) && await kp.locator(".cook-mode").count() === 0, "the kitchen screen: the session ended, nothing kept");
    // a fresh code, then closing cook mode ends it too
    await cm.getByRole("button", { name: /Use another screen/ }).click(); await page.waitForTimeout(600);
    const code2 = (await cm.locator(".pair-code").textContent()).trim();
    ok(code2 !== code, "a new code each time");
    await cm.getByRole("button", { name: "✕ Close" }).click(); await page.waitForTimeout(600);
    const after = await page.evaluate(async (c) => { const r = await fetch(`/api/cook/state?code=${c}`); const d = await r.json().catch(() => ({})); return r.status === 404 || Boolean(d.session && d.session.ended); }, code2);
    ok(after, "closing cook mode ends the session");
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  } catch (e) { console.log("FAIL " + e.message); fail++; }
  await b.close(); server.kill();
  console.log(fail ? `${fail} failed` : "all ok"); process.exit(fail ? 1 : 0);
})();
