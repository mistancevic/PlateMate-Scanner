// DT176 (0.3.19, board Stories124; Coach Milan 30 October 20:51 Go): Travel mode, a manual switch on Me. On asks where and
// what kitchen; a banner on every tab with Turn off; weigh-in pauses; the Plate says where it serves you; a hotel hides Start
// cooking; Chef Mealan is told the kitchen and the place with every food request; Your summary says so; days away are marked;
// off keeps the trip and says welcome back once. Nothing in the profile changes.
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
const PORT = "3197", B = `http://127.0.0.1:${PORT}`;
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
      if (!sessionStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-region", "munich"); localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-05T08:00:00Z", consentBodyAt: "2026-10-05T08:00:00Z", declaredAt: "2026-10-05T08:00:00Z" })); localStorage.setItem("chefmealan-personal", JSON.stringify({ sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, weighIns: [{ date: "2026-10-28", kg: 85.2 }], lifestyle: { kitchens: ["Balkan"] } })); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); sessionStorage.setItem("seeded", "1"); }
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
    const { page } = await open(true);
    const me = async () => { await page.goto(B + "/"); await page.waitForTimeout(900); await page.getByRole("button", { name: "Menu" }).first().click(); await page.waitForTimeout(300); await page.getByRole("button", { name: /^Me\b/ }).first().click(); await page.waitForTimeout(500); };
    const personal = () => page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-personal") || "{}"));
    await me();
    const tc = page.locator(".travel-card");
    ok(await tc.count() === 1 && /Travel mode/.test(await tc.textContent()) && await tc.getByRole("button", { name: "Turn on" }).count() === 1, "Me: Travel mode, off, with Turn on");
    ok(/Weigh in/.test(await page.locator(".weigh-line").first().textContent()) && await page.locator(".weigh-paused").count() === 0, "weigh-in as usual");
    await tc.getByRole("button", { name: "Turn on" }).click(); await page.waitForTimeout(300);
    ok(await page.getByRole("radio", { name: "Munich" }).count() === 0 && await page.getByRole("radio", { name: "Belgrade" }).count() === 1, "where: every place but home");
    ok(await page.getByRole("button", { name: "Turn travel mode on" }).isDisabled(), "Turn on waits for what you have there");
    await page.getByRole("radio", { name: "Belgrade" }).click(); await page.getByRole("radio", { name: /Hotel, no kitchen/ }).click();
    const hs = await page.locator(".travel-setup .choice, .travel-setup .pill").evaluateAll((bs) => bs.map((b) => Math.round(b.getBoundingClientRect().height)));
    ok(hs.every((h) => h >= 44), "every button 44 px or more: " + hs.join(","));
    await page.getByRole("button", { name: "Turn travel mode on" }).click(); await page.waitForTimeout(500);
    const p1 = await personal();
    ok(p1.travel && p1.travel.place === "belgrade" && p1.travel.kitchen === "hotel" && p1.travel.weighPaused === true && p1.weightKg === 85 && p1.lifestyle.kitchens[0] === "Balkan", "on: Belgrade, hotel, weigh-in paused; the profile unchanged");
    ok(/Travel mode · Belgrade/.test(await page.locator(".travel-card").textContent()) && /since today/.test(await page.locator(".travel-card").textContent()), "Me says it is on, since today");
    ok(await page.locator(".weigh-paused").count() === 1 && /Paused while you travel in Belgrade/.test(await page.locator(".weigh-paused").textContent()), "weigh-in paused");
    ok((await page.evaluate(() => localStorage.getItem("chefmealan-region"))) === "munich", "home stays Munich");
    // every tab: the banner
    for (const t of ["Today", "Plan", "Plate", "Recipes"]) { await page.locator("nav button").filter({ hasText: t }).click(); await page.waitForTimeout(500); ok(await page.locator(".travel-banner").count() === 1 && /Travel mode · Belgrade/.test(await page.locator(".travel-banner").textContent()) && /Hotel, no kitchen · since today/.test(await page.locator(".travel-banner").textContent()), `${t}: the travel banner`); }
    // the Plate says where it serves you; Chef Mealan is told with every food request
    await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(500);
    ok(/Belgrade, hotel, no kitchen: Chef Mealan suggests what you can buy and eat as it is/.test(await page.locator(".travel-plate-note").first().textContent()), "the Plate says where it serves you and what the kitchen allows");
    let sent = null;
    await page.route("**/api/swap", (r) => { sent = JSON.parse(r.request().postData() || "{}"); r.fulfill({ status: 200, contentType: "application/json", body: "{\"options\":[]}" }); });
    await page.evaluate(() => fetch("/api/swap", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ask: "x" }) }));
    await page.waitForTimeout(300);
    ok(sent && sent.eats && sent.eats.away === "a hotel with no kitchen, in Belgrade", "Chef Mealan is told: a hotel with no kitchen, in Belgrade");
    // a hotel: no Start cooking on Make
    await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(500); await page.locator(".recipe-tile").filter({ hasText: "Chicken rice bowl" }).click(); await page.waitForTimeout(500);
    await page.getByRole("button", { name: "Cook it as written", exact: true }).click(); await page.waitForTimeout(1200);
    if (await page.getByRole("button", { name: "Start a new plate" }).count()) { await page.getByRole("button", { name: "Start a new plate" }).click(); await page.waitForTimeout(1200); }
    ok(await page.getByRole("button", { name: "Start cooking", exact: true }).count() === 0 && /Start cooking is off/.test(await page.textContent("body")) && await page.locator(".mk-check").count() === 6, "a hotel: Start cooking is off; the steps stay to tick");
    // three days on: since Wednesday, yesterday marked travelling
    await page.evaluate(() => { const p = JSON.parse(localStorage.getItem("chefmealan-personal")); p.travel.since = "2026-10-27T08:00:00.000Z"; localStorage.setItem("chefmealan-personal", JSON.stringify(p)); });
    await page.goto(B + "/"); await page.waitForTimeout(1000);
    ok(/since Tuesday/.test(await page.locator(".travel-banner").textContent()), "the banner says since Tuesday");
    ok(/Travelling · Belgrade/.test(await page.locator(".day-card").first().textContent()), "an earlier day says Travelling · Belgrade");
    // Your summary says so
    await me(); await page.locator(".menu-row").filter({ hasText: "Your summary" }).click(); await page.waitForTimeout(500);
    ok(/Travel mode/.test(await page.textContent("body")) && /Belgrade · Hotel, no kitchen/.test(await page.textContent("body")), "Your summary shows Travel mode");
    // off: everything back, the trip kept, welcome back once
    await page.goto(B + "/"); await page.waitForTimeout(900);
    await page.locator(".travel-banner").getByRole("button", { name: "Turn off" }).click(); await page.waitForTimeout(500);
    ok(await page.locator(".travel-banner").count() === 0, "Turn off: the banner goes");
    const p2 = await personal();
    ok(!p2.travel && p2.trips.length === 1 && p2.trips[0].place === "belgrade" && p2.trips[0].from === "2026-10-27" && p2.trips[0].to === "2026-10-30" && p2.travelBack.days === 4, "the trip is kept: Belgrade, 27 to 30 October, 4 days");
    await me();
    ok(/Welcome back/.test(await page.locator(".travel-card").textContent()) && /4 days, Belgrade/.test(await page.locator(".travel-card").textContent()), "Me: welcome back, 4 days, Belgrade");
    ok(await page.locator(".weigh-paused").count() === 0, "weigh-in is back");
    await page.locator(".travel-card").getByRole("button", { name: "OK" }).click(); await page.waitForTimeout(300);
    ok(await page.getByRole("button", { name: "Turn on" }).count() === 1, "OK: the card is back to Turn on");
    await page.goto(B + "/"); await page.waitForTimeout(900);
    ok(/Travelling · Belgrade/.test(await page.locator(".day-card").first().textContent()), "the trip's days stay marked");
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  } catch (e) { console.log("FAIL " + e.message); fail++; }
  await b.close(); server.kill();
  console.log(fail ? `${fail} failed` : "all ok"); process.exit(fail ? 1 : 0);
})();
