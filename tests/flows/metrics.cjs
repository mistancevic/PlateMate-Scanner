// The counter and the Metrics page (0.2.5+r17, canvas board M, M1 to M4, Milan 13 October 2026). Today opened sends
// app_open once a day; the days before today are closed against the plan (planned, by the plan, swapped, lived by the
// plan) and reach the server stripped; home page counts are one number per day; Metrics shows in the menu for the
// account the server names (here, without accounts, the local one) with the North Star, the KPIs and the way in; the
// privacy notice carries the two lines.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
const skyr = seed.foods.find((f) => /skyr/i.test(f.name)), oats = seed.foods.find((f) => /^oats/i.test(f.name)), chicken = seed.foods.find((f) => /chicken/i.test(f.name));
seed.meals = [
  { id: "m1", title: "Morning skyr", items: [{ id: "i1", food: skyr, grams: 300, locked: true }, { id: "i2", food: oats, grams: 50, locked: true }], portion: 350, savedAt: "2026-10-01T08:00:00Z" },
  { id: "m2", title: "Chicken bowl", items: [{ id: "i3", food: chicken, grams: 200, locked: true }], portion: 200, savedAt: "2026-10-01T08:00:00Z" },
  { id: "m3", title: "Chicken and oats", items: [{ id: "i4", food: chicken, grams: 150, locked: true }, { id: "i5", food: oats, grams: 40, locked: true }], portion: 190, savedAt: "2026-10-01T08:00:00Z" },
];
seed.items = [];
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const ago = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
const monday = (d) => { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return ymd(x); };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3197" }, stdio: ["ignore", "pipe", "pipe"] });
  for (let i = 0; i < 60; i++) { try { await fetch("http://127.0.0.1:3197/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 1 });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  process.on("unhandledRejection", (e) => { console.log("FAIL " + (e && e.message ? e.message : e)); server.kill(); process.exit(1); });
  const y = ymd(ago(1)), first = ymd(ago(3));
  // yesterday: lunch and dinner planned; lunch eaten as planned, dinner swapped for another recipe
  const at = (h) => { const d = ago(1); d.setHours(h, 0, 0, 0); return d.toISOString(); };
  seed.feedback = [
    { id: "c1", meal: seed.meals[0], status: "eaten", taste: "Good", notes: "", createdAt: at(12), slot: { date: y, slotId: "lunch", name: "Lunch", time: "12:30" } },
    { id: "c2", meal: seed.meals[2], status: "eaten", taste: "Good", notes: "", createdAt: at(19), slot: { date: y, slotId: "dinner", name: "Dinner", time: "19:00" } },
  ];
  seed.goals = { ...(seed.goals || {}), calories: 2200, protein: 180 };
  await page.addInitScript(([s, y, first]) => { if (!localStorage.getItem("seeded")) {
    localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { meals: 2, window: { from: "08:00", to: "19:00" } } }));
    localStorage.setItem("chefmealan-planned", JSON.stringify({ [y]: { lunch: { title: "Morning skyr", kcal: 376, protein: 40, source: "mine", mealId: "m1", items: s.meals[0].items, portion: 350 }, dinner: { title: "Chicken bowl", kcal: 330, protein: 62, source: "mine", mealId: "m2", items: s.meals[1].items, portion: 200 } } }));
    // Today was first opened three days ago on this phone
    localStorage.setItem("chefmealan-first-day", JSON.stringify(first));
    localStorage.setItem("seeded", "1"); } }, [seed, y, first]);
  await require("./adult.cjs")(page);
  await page.goto("http://127.0.0.1:3197/today"); await page.waitForTimeout(5500);
  const box = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-outbox") || "[]"));
  const log = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-log") || "[]"));
  const closed = log.filter((e) => e.event === "day_closed");
  ok(log.filter((e) => e.event === "app_open").length === 1, "Today opened: app_open once a day");
  ok(closed.map((e) => e.date).join(",") === [ymd(ago(3)), ymd(ago(2)), y].join(","), "the days since Today was first opened are closed, each once: " + closed.map((e) => e.date).join(", "));
  const yc = closed.find((e) => e.date === y) || {};
  ok(yc.planned === 2 && yc.byPlan === 2 && yc.extras === 0 && yc.swapped === 1, `yesterday: 2 planned, 2 by the plan, 1 swapped (${JSON.stringify(yc)})`);
  ok(yc.lived === (yc.proteinPct >= 90 && yc.energyPct >= 90 && yc.energyPct <= 110), `lived by the plan follows the rule: protein ${yc.proteinPct} %, energy ${yc.energyPct} %, lived ${yc.lived}`);
  ok(box.length === 0, "sent within seconds: the outbox is empty (" + box.length + ")");
  // home page counts: one number per day and kind, no cookie
  await page.evaluate(async () => { for (const k of ["hp_visit", "hp_visit", "hp_calc", "hp_try", "nonsense", "book_worthy_numbers", "book_worthy_numbers__qr", "hp_qr", "hp_ig"]) await fetch("/api/hit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ k }) }); });
  await page.goto("http://127.0.0.1:3197/built"); await page.waitForTimeout(1200);
  ok((await page.context().cookies()).length === 0, "no cookie is set by the counts");
  const api = (w) => page.evaluate(async (w) => (await fetch(`/api/metrics${w ? `?week=${w}` : ""}`)).json(), w);
  const now = await api();
  ok(now.stats.wayIn.visits === 2 && now.stats.wayIn.calc === 1 && now.stats.wayIn.tried === 1, `the way in counts visits 2, calculator 1, Try 1: ${JSON.stringify(now.stats.wayIn)}`);
  ok(now.stats.active === 1, "one active member this week");
  const wy = await api(monday(ago(1)));
  ok(wy.stats.mealsByPlan === 100, `meals by the plan in yesterday's week: ${wy.stats.mealsByPlan} %`);
  // a question with words never reaches the server, even sent by hand
  const r = await page.evaluate(async () => (await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ v: "x", events: [{ e: "plate_question", t: new Date().toISOString(), d: { q: "secret" } }] }) })).status);
  ok(r === 400, "an event the counter doesn't take is refused (" + r + ")");
  // M1, M2/M3: Metrics in the menu, and the page
  await page.goto("http://127.0.0.1:3197/today"); await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Menu" }).click(); await page.waitForTimeout(800);
  ok(await page.locator(".menu-row", { hasText: "Metrics" }).count() === 1, "M1: Metrics in the menu for the account the server names");
  await page.locator(".menu-row", { hasText: "Metrics" }).click(); await page.waitForTimeout(1200);
  if (!(await page.locator(".mt").count())) { await page.screenshot({ path: "/tmp/claude-0/-home-claude/eb1a4d76-58dd-5eb0-821a-03f8b6297cd5/scratchpad/shots/_mt.png" }); console.log("DEBUG " + errs.join(" | ") + " :: " + (await page.locator("body").textContent()).slice(0, 300)); }
  const txt = await page.locator(".mt").textContent();
  if (process.env.SHOTS) await page.locator(".mt").screenshot({ path: `${process.env.SHOTS}/mt-m3.png` });
  const t1 = (await page.locator(".mt").innerText()).replace(/\s+/g, " ");
  ok(/Days lived by the plan/.test(t1) && /The five KPIs/.test(t1) && /The way in/.test(t1), "MT71: the whole page shows from the first day of counting: " + t1.slice(0, 80));
  // 23 October 2026: counting began three days ago; from Thursday on that is after Monday, and the line says counted from it
  ok(/This week \d+ \w+ to today( \(counted from \d+ \w+\))?\./.test(t1) && /Compared with \d+ to \d+ \w+/.test(t1) && /Counting began on \d+ \w+\. Today is \d+ \w+\./.test(t1), "MT71: the time frame on top, and since when it counts");
  ok((await page.locator(".mt-when").count()) === 4, "MT71: each card says which days it counts");
  ok(/Home page visits\s*2/.test(t1), "MT71: the way in shows this week's visits so far, 2");
  ok(/Home page visits 2 QR 1 · Instagram 1/.test(t1), "SH73, 0.2.115: a visit from the QR code counts as QR, one from Instagram as Instagram, under Home page visits");
  ok(/From Worthy Numbers 1 QR 1/.test(t1), "MT71: the book's visit and its QR code show this week, before a full week is counted");
  ok(/TODAY/.test(t1) && /SINCE \d+ [A-Z]{3}/.test(t1), "M5: next to today, the count since the first day");
  await page.getByRole("tab", { name: "Last week" }).click(); await page.waitForTimeout(1500);
  const t2 = (await page.locator(".mt").innerText()).replace(/\s+/g, " ");
  ok(/Last week \d+ to \d+ \w+/.test(t2) && !/to today/.test(t2), "MT71: Last week names its own days");
  await page.getByRole("tab", { name: "4 weeks" }).click(); await page.waitForTimeout(1500);
  const t3 = (await page.locator(".mt").innerText()).replace(/\s+/g, " ");
  ok(/The last 4 weeks \d+ \w+ to \d+ \w+, one row per week/.test(t3) && /not counted yet/.test(t3), "MT71: 4 weeks says its days, and a week before the first day says not counted yet");
  await page.getByRole("tab", { name: "This week" }).click(); await page.waitForTimeout(800);
  ok(!/AI use|Cost to serve|Cost per active member/.test(txt), "M6: Metrics holds product measures only, no costs");
  // M6b: Running costs, its own page next to Metrics: AI use, cost per active member from the count, the bills as fixed cost
  await page.goto("http://127.0.0.1:3197/today"); await page.waitForTimeout(1000); await page.getByRole("button", { name: "Menu" }).click(); await page.waitForTimeout(600);
  ok(await page.locator(".menu-row", { hasText: "Running costs" }).count() === 1, "M6b: Running costs in the menu, next to Metrics");
  await page.locator(".menu-row", { hasText: "Running costs" }).click(); await page.waitForTimeout(1200);
  const ct = (await page.locator(".mt").textContent()).replace(/\s+/g, " ");
  ok(/AI use, \w+/.test(ct) && /Tokens in/.test(ct) && /Cost per active member, \w+/.test(ct) && /Fixed cost, \w+/.test(ct) && /target under €1/.test(ct), "M6b: AI use, cost per active member and fixed cost");
  await page.getByLabel("Price in, € per million tokens").fill("0.3"); await page.getByLabel("Price out, € per million").fill("2.5");
  await page.getByRole("button", { name: "Save", exact: true }).first().click(); await page.waitForTimeout(800);
  ok((await api()).prices?.out === 2.5 && /AI calls at your prices: €0\.\d\d this month, for 1 member active this month/.test((await page.locator(".mt").textContent()).replace(/\s+/g, " ")), "M6b: the prices are kept; the cost per member counts itself");
  ok(await page.locator(".mt").getByText("Saved.", { exact: true }).count() === 1, "M6b: Saved shows once");
  await page.getByLabel("AI bill, €").fill("0.41"); await page.getByLabel("Cloud bill, €").fill("0.83");
  await page.getByRole("button", { name: "Save", exact: true }).nth(1).click(); await page.waitForTimeout(800);
  const ct2 = (await page.locator(".mt").textContent()).replace(/\s+/g, " ");
  ok(/€1\.24\s*this month/.test(ct2) && /The AI bill is €0\.41; the count at your prices is €0\.\d\d/.test(ct2), "M6b: the bills as one fixed total, not divided, with the check against the count: " + ct2.slice(-420));
  ok(await page.locator(".mt").getByText("Saved.", { exact: true }).count() === 1, "M6b: Saved still once, under the row saved");
  // M2: once a full week is counted, the North Star, the six KPIs and the way in (a closed day 10 days ago, sent by hand)
  await page.evaluate(async (date) => fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ v: "x", events: [{ e: "day_closed", t: new Date().toISOString(), d: { date, planned: 2, byPlan: 2, extras: 0, lived: true } }] }) }), ymd(ago(10)));
  const m2 = await api();
  if (m2.since && m2.since <= m2.last.week.from) {
    await page.goto("http://127.0.0.1:3197/today"); await page.waitForTimeout(1000);
    await page.getByRole("button", { name: "Menu" }).click(); await page.waitForTimeout(600);
    await page.locator(".menu-row", { hasText: "Metrics" }).click(); await page.waitForTimeout(1200);
    if (process.env.SHOTS) await page.locator(".menu, .mt").last().screenshot({ path: `${process.env.SHOTS}/mt-m2.png` });
    const t2 = (await page.locator(".mt").innerText()).replace(/\s+/g, " ");
    ok(/Days lived by the plan/.test(t2) && /The five KPIs/.test(t2) && /The way in/.test(t2) && /This week in the app/.test(t2) && !/Cost per active member/.test(t2), "M2: a full week: the North Star, the five KPIs, the way in, this week in the app; no cost");
    await page.getByRole("tab", { name: "4 weeks" }).click(); await page.waitForTimeout(1200);
    ok(/The last 4 weeks/.test(await page.locator(".mt").textContent()) && /Week by week/.test(await page.locator(".mt").textContent()), "M2: 4 weeks shows the North Star week by week");
  } else console.log("ok   M2: (the hand-sent day is not in a full past week on this weekday; M3 above stands)");
  // M4: the privacy notice
  await page.goto("http://127.0.0.1:3197/privacy"); await page.waitForTimeout(900);
  const priv = await page.locator("body").textContent();
  ok(/Cookies, storage and counting/.test(priv) && /We set no cookie, and we store no IP address or visitor ID/.test(priv) && /We keep it for 12 months/.test(priv), "M4: the privacy notice says how visits are counted and how the pilot log is kept");
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await b.close(); server.kill();
  console.log(fail ? `\n${fail} FAILED` : "\nall passed");
  process.exit(fail ? 1 : 0);
})();
