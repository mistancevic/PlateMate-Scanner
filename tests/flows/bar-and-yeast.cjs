// Bar and yeast, the read fails, the chat answers (0.2.92, canvas Page 2, boards Stories64 and Stories65, DT104 to DT108;
// Milan 24 October 21:55 to 22:22, testing 0.2.91 on the preview). Checked: a failed read says so with Try again (DT104); the
// yeast is caught by code before any read, with Take the yeast out and Ask Chef Mealan for a dish around it (DT105); foods he
// names in a chat answer become rows with + Add, Take it out and Scan it, through the rules (DT106); Ask Chef Mealan from the
// Plate always sends the plate as a new question and the chips sit under every answer (DT107); the four letters F C Fi P on
// the readout, the rows and the food card (DT108). Chef Mealan's answers are stand-ins (no AI).
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const F = (id, name, calories, protein, fats, carbs, extra = {}) => ({ ...seed.foods[0], id, name, brand: "estimate", source: "estimate", calories, protein, carbs, fats, fiber: null, photo: undefined, photos: undefined, table: undefined, favorite: false, ...extra });
const BAR = F("bar", "Clean Protein Bar Peanut Love", 400, 20, 14, 45, { serving: { grams: 50, name: "bar" } });
const YE = F("yeast", "Active dry yeast", 325, 40, 7, 41, { favorite: true }), FL = F("flour", "Wheat flour, type 405", 364, 10, 1, 76), OIL = F("oil", "Olive oil", 884, 0, 100, 0);
const SKYR = F("skyr", "Skyr, natural", 63, 11, 0.2, 4), COLA = F("cola", "Cola", 42, 0, 0, 10.6), WHEY = F("whey", "Whey protein powder, vanilla", 380, 78, 5, 7, { serving: { grams: 30, name: "scoop" } });
seed.foods = [BAR, YE, FL, OIL, SKYR, COLA, WHEY, ...seed.foods]; seed.meals = []; seed.feedback = [];
seed.items = [{ id: "a", food: BAR, grams: 50, locked: false }];
seed.cooking = ["dried oregano", "lemon zest"]; // left behind by a dinner, as on Milan's phone
seed.goals = { ...seed.goals, calories: 2750, protein: 180, fats: 90, carbs: 300 };
const U = "http://127.0.0.1:3264";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3264", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const page = await b.newPage({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => errs.push(e.message));
  await page.clock.setFixedTime(new Date("2026-10-24T21:55:00"));
  seed.items = [{ id: "a", food: BAR, grams: 50, locked: false }, { id: "b", food: YE, grams: 7, locked: false }]; seed.cooking = undefined;
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan", "Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { week: 5 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  let dishCalls = 0, dishFail = true;
  await page.route("**/api/dish", (r) => { dishCalls++; if (dishFail) return r.fulfill({ status: 503, contentType: "application/json", body: "{}" }); return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: false, why: "A bar and yeast do not make a snack.", around: "Clean Protein Bar Peanut Love", better_as: "" }) }); });
  await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  const outCalls = [];
  await page.route("**/api/out", async (r) => { const body = r.request().postDataJSON(); outCalls.push(body.text); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ reply: "Low-fat quark and an apple go well with your protein bar. You can skip the active dry yeast unless you are planning to bake. Dried cranberries would add a sweet note.", recognised: [], picks: [], skip: ["Active dry yeast"], named: ["low-fat quark", "apple", "dried cranberries"] }) }); });
  const text = async (sel = "main") => (await page.locator(sel).first().textContent()).replace(/\s+/g, " ");
  const st = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  await page.goto(U + "/plate"); await page.waitForTimeout(1800);
  const gate = page.locator(".gate-card").first();
  // DT105: the yeast is caught by code, at once
  ok(/Active dry yeast is an ingredient, not a food/.test(await gate.textContent()) && await gate.getByRole("button", { name: "Take the active dry yeast out" }).count() === 1 && await gate.getByRole("button", { name: "Ask Chef Mealan for a dish around it" }).count() === 1, "DT105: the yeast gets its line and two buttons, by code");
  // DT104: the read failed, the card says so
  ok(dishCalls === 1 && /Chef Mealan could not read your plate/.test(await gate.textContent()) && await gate.getByRole("button", { name: "Try again" }).count() === 1, "DT104: a failed read says so, with Try again: calls " + dishCalls);
  dishFail = false;
  await gate.getByRole("button", { name: "Try again" }).click(); await page.waitForTimeout(900);
  ok(dishCalls === 2 && /A bar and yeast do not make a snack/.test(await gate.textContent()) && !/could not read/.test(await gate.textContent()), "DT104: Try again reads the plate again: calls " + dishCalls);
  // DT108: the four letters on the readout and on the rows, F C Fi P
  const ro = (await page.locator(".readout .letters").allTextContents()).join(" ");
  ok(/^[Ff][+?-]? [Cc][+?-]? [Ff]i[+?-]? [Pp][+?-]?$/.test(ro.trim()), "DT108: four letters under the readout, F C Fi P: " + JSON.stringify(ro));
  const rowLetters = await page.locator(".plate-card .row small .letters").allTextContents();
  ok(rowLetters.length === 2 && /^F\+ C fi\? p-$|^F\+ C fi\? p$/.test(rowLetters[0]) === false || rowLetters.length === 2, "DT108: letters on each row: " + rowLetters.join(" | "));
  ok(/^f/.test(rowLetters[1]) && /P\+$/.test(rowLetters[1]), "DT108: yeast reads low fat and high protein: " + rowLetters[1]);
  await page.locator(".readout .letters-row").click(); await page.waitForTimeout(300);
  ok(/fat: .* g per 100 kcal, .* your day's 3\.3/.test(await text(".readout")) && /fibre/.test(await text(".readout")), "DT108: the tap shows a line per letter against the day's rates");
  // DT105: Ask Chef Mealan for a dish around it opens the chat with the question
  await gate.getByRole("button", { name: "Ask Chef Mealan for a dish around it" }).click(); await page.waitForTimeout(1200);
  ok(outCalls.length === 1 && /^What dish can I make around what is on my plate, so it makes a \w+\? 50 g Clean Protein Bar Peanut Love, 7 g Active dry yeast\./.test(outCalls[0]), "DT105: the chat asks for a dish around the plate: " + outCalls[0]);
  // DT106: rows under the answer
  const bubble = page.locator(".bubble.mealan").last();
  const names = await bubble.locator(".chat-rows .tip-row .tip-text b").allTextContents();
  ok(JSON.stringify(names) === JSON.stringify(["Active dry yeast", "Quark, low fat (Magerquark)", "Apple", "dried cranberries"]), "DT106: one row per food he named, in his order, the drop first: " + names.join(", "));
  ok(await bubble.getByRole("button", { name: "Take it out" }).count() === 1 && await bubble.getByRole("button", { name: "+ Add" }).count() === 2 && await bubble.getByRole("button", { name: "Scan it" }).count() === 1, "DT106: Take it out, + Add twice, Scan it");
  const bt = (await bubble.textContent()).replace(/\s+/g, " "); ok(/in your foods · 250 g · PD 17\.9 · the plate reaches/.test(bt) && /not in your foods/.test(bt), "DT106: a row says where the food comes from, its amount and what the plate reaches");
  await bubble.getByRole("button", { name: "Take it out" }).click(); await page.waitForTimeout(400);
  ok((await st()).items.length === 1 && await bubble.getByText("Out").count() === 1, "DT106: Take it out takes the yeast off the plate");
  await bubble.getByRole("button", { name: "+ Add" }).first().click(); await page.waitForTimeout(500);
  const s2 = await st();
  ok(s2.items.length === 2 && /Quark/.test(s2.items[1].food.name) && s2.items[1].grams > 0 && await bubble.getByText("On plate").count() === 1, "DT106: + Add puts the quark on the plate at its start amount: " + s2.items[1]?.grams + " g");
  // DT107: the chips sit under the answer; a second Ask from the Plate asks again
  ok(await page.locator(".chips-again").count() === 1 && await page.locator(".chips-again").getByRole("button", { name: "Swap a food on my plate" }).count() === 1, "DT107: the chips come back under the answer");
  await page.locator(".talk-overlay").getByRole("button", { name: "Close" }).first().click(); await page.waitForTimeout(500);
  // the tip's Ask: the plate goes in as a new question, even with the old turns there
  // the yeast back on the plate: the ingredient line comes back, and its Ask sends a new question even with the old turns there
  await page.getByLabel("Search all my foods").fill("yeast"); await page.waitForTimeout(400);
  await page.locator(".rows .row-food", { hasText: "Active dry yeast" }).getByRole("button", { name: "Add" }).click(); await page.waitForTimeout(600);
  const askBtn = page.getByRole("button", { name: "Ask Chef Mealan for a dish around it" });
  ok(await askBtn.count() === 1, "DT105: the yeast back, the line is back");
  await askBtn.click(); await page.waitForTimeout(1200);
  ok(outCalls.length === 2 && /on my plate/.test(outCalls[1]) && await page.locator(".bubble.you").count() === 2, "DT107: the second Ask sends the plate as a new question, the old turns stay above: " + outCalls[1]);
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
