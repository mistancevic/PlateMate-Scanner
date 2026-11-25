// B168 and DT349 (0.3.193, board B168 and DT349, canvas Page 6; Coach Milan, Go 25 November 2026, 14:38 and 14:42; nutrition
// rule N17, design rule D14). The recipe page is for reading and deciding. On top, fixed, the recipe as written: the PD card
// is the Plate's card (PdCard) for the whole recipe, its numbers open under it, and the Nutrition table keeps one serving, all
// and 100 g. Servings is the one choice: chips 1 to 5, one tap each, and − and + always under them, grey until used; the line
// and Foods follow it, saved with the recipe. At the end, What do you do with it?: Plan it opens the Plate's day and meal
// block, shows my portion for the meal picked, and puts it in the plan, asking first when that meal holds something already;
// Put it on the Plate was Change it first. A serving is the recipe's equal share; a portion is mine.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(__dirname, "seed.json"), "utf8")); seed.items = [];
const food = (id, name, calories, protein, carbs, fats, fiber, extra = {}) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined, ...extra });
const Q = food("q", "Körniger Frischkäse Tworog 2,5% Fett", 100, 12, 3, 4.5, 0, { barcode: "4056489000001" }), P = food("p", "Frischer Blätterteig", 400, 6, 36, 25, 1.5, { barcode: "4056489000002" }),
  E = food("e", "Eggs", 143, 12.6, 0.7, 9.5, 0, { source: "Reference table", refId: "egg" }), F = food("f", "Feta Leicht", 180, 17, 1, 12, 0, { barcode: "4056489000003" }),
  S = food("s", "Skyr", 63, 11, 4, 0.2, 0, { source: "Reference table" });
const it = (id, f, g, part) => ({ id, food: f, grams: g, locked: false, ...(part ? { part } : {}) });
const burek = { id: "m-burek", title: "Lazy Burek", items: [it("a", Q, 250, "Filling"), it("b", P, 375, "Base"), it("d", E, 122, "Filling"), it("h", F, 150, "Filling")], makes: { n: 4, unit: "portions" }, portion: 224, savedAt: "2026-11-23T16:00:00Z", steps: ["Mix, lay out, bake at 200 °C for 25 minutes."] };
const skyr = { id: "m-skyr", title: "Skyr cup", items: [it("x", S, 250)], portion: 250, savedAt: "2026-11-23T16:00:00Z", steps: ["Spoon it into a bowl."] };
const PORT = "3618", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (url) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, timezoneId: "Europe/Berlin" }); const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.setFixedTime(new Date("2026-11-24T08:00:00+01:00"));
    await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, { ...seed, foods: [...seed.foods, Q, P, E, F, S], meals: [burek, skyr], feedback: [] });
    await require("./adult.cjs")(page);
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await page.goto(U + url); await page.waitForTimeout(1500);
    return page;
  };
  const txt = async (loc) => ((await loc.count()) ? (await loc.first().textContent()).replace(/\s+/g, " ").trim() : "");
  const grams = (p) => p.locator("section.rq-foods .rq-food").evaluateAll((rs) => rs.map((r) => r.lastElementChild.textContent.replace(/\s+/g, " ").trim()));
  try {
    let p = await open("/my-recipes/m-burek");
    const card = p.locator(".rq-readout").first(), HOW = p.locator("section.rq-howmuch"), ACT = p.locator("section.rq-actions");
    // ---- B168: the top is the recipe as written ----
    const top = await txt(card.locator(".readout-top")), rows = await txt(card.locator(".rd-rows"));
    ok(/The whole recipe/.test(top) && /Energy\s*2,194\s*kcal/.test(rows) && /Weight\s*897\s*g/.test(rows) && /Protein\s*93\s*g/.test(rows), `B168 AC1: the PD card says The whole recipe, 2,194 kcal, 897 g, 93 g: ${top} | ${rows}`);
    await card.locator(".letters-row").click(); await p.waitForTimeout(400);
    const total = await txt(p.locator(".rq-readout + .nt .nt-total"));
    ok(/897/.test(total) && /2,194/.test(total), "B168 AC2: the numbers say Total 897 g and 2,194 kcal: " + total);
    ok(await card.locator(".nt").count() === 0 && await p.locator(".rq-readout + .nt").count() === 1, "DT349 AC2: the numbers open under the card, not inside it");
    await card.locator(".letters-row").click(); await p.waitForTimeout(300);
    const head = await txt(p.locator("section.nt-card .nt-row.nt-th"));
    ok(/1 SERVING/.test(head) && /ALL 4/.test(head) && /100/.test(head), "B168 AC3, AC6: the Nutrition table shows 1 SERVING, ALL 4 and 100 g: " + head);
    ok(/The whole recipe makes 4 servings · one serving 549 kcal/.test(await txt(p.locator("main"))), "B168 AC6: The whole recipe makes 4 servings · one serving 549 kcal");
    // ---- DT349: the Plate's card, the scale, the placeholder photo ----
    ok(await card.evaluate((x) => x.classList.contains("pd-card")) && /Energy.*Weight.*Protein/.test(rows), "DT349 AC1: the Plate's card, Energy, Weight and Protein as rows");
    await card.locator(".pd-tap").click(); await p.waitForTimeout(300);
    ok(await card.locator(".pd-scale-box").count() === 1, "DT349 AC3: a tap on PD opens the PD scale in the card");
    await card.locator(".pd-tap").click(); await p.waitForTimeout(300);
    const ph = p.locator(".rq-nopic-ph");
    ok(await ph.count() === 1 && await ph.locator("svg.rq-ph-art").count() === 1 && /No photo yet/.test(await txt(ph)) && await ph.getByRole("button").count() === 2, "DT349 AC4: a placeholder picture of a meal with No photo yet and its two buttons on it");
    // ---- DT349: Servings ----
    const chips = await HOW.locator(".rq-chips .choice").allTextContents();
    ok(JSON.stringify(chips.map((t) => t.trim())) === JSON.stringify(["1", "2", "3", "4", "5"]), "DT349 AC5: chips 1 to 5, only numbers: " + chips.join(","));
    ok(/^4$/.test((await txt(HOW.locator(".choice.on")))) && await HOW.locator(".rq-cook-row.idle").count() === 1 && /4 servings/.test(await txt(HOW.locator(".rq-cook-row"))), "DT349 AC5: 4 chosen, − 4 servings + under the chips in grey");
    ok((await txt(HOW.locator(".rq-choice-line"))) === "4 servings: 2,194 kcal · 897 g · 93 g protein · PD 4.3", "DT349 AC5: the line: " + (await txt(HOW.locator(".rq-choice-line"))));
    ok(await p.locator("section.rq-cook").count() === 0 && !(await HOW.getByRole("button", { name: "Other" }).count()), "DT349 AC5: no Cook it card, no Other chip");
    await HOW.locator(".rq-chips .choice").filter({ hasText: /^2$/ }).click(); await p.waitForTimeout(500);
    const g2 = await grams(p);
    ok(/^2 servings: 1,097 kcal · 449 g/.test(await txt(HOW.locator(".rq-choice-line"))) && /Foods for 2 servings/.test(await txt(p.locator("section.rq-foods > b"))), "DT349 AC6: 2 servings: 1,097 kcal · 449 g, Foods for 2 servings: " + (await txt(HOW.locator(".rq-choice-line"))));
    ok(JSON.stringify(g2.map((x) => x.replace(/(eggs?)\s*[SML] · \d+ g$/, "$1"))) === JSON.stringify(["125 g", "1 egg", "75 g", "188 g"]), "DT349 AC6: the foods for 2: " + g2.join(", "));
    // B168 AC4: the top stays the recipe as written
    ok(/2,194 kcal/.test(await txt(card.locator(".rd-rows"))) && /549 kcal/.test(await txt(p.locator("section.nt-card"))), "B168 AC4: at 2 servings the card still says 2,194 kcal and the table 1 serving 549 kcal");
    await p.reload(); await p.waitForTimeout(1500);
    ok(/^2$/.test(await txt(p.locator("section.rq-howmuch .choice.on"))), "DT349 AC6: opened again, 2 is still chosen");
    // AC8: + until 10
    for (let i = 0; i < 8; i++) { await p.locator("section.rq-howmuch .rq-cook-row").getByRole("button").last().click(); await p.waitForTimeout(150); }
    const g10 = await grams(p);
    ok(await p.locator("section.rq-howmuch .rq-cook-row.idle").count() === 0 && await p.locator("section.rq-howmuch .choice.on").count() === 0 && /10 servings/.test(await txt(p.locator("section.rq-howmuch .rq-cook-row"))), "DT349 AC8: + until 10: − and + in use, no chip chosen, 10 servings");
    ok(JSON.stringify(g10.map((x) => x.replace(/(eggs?)\s*[SML] · \d+ g$/, "$1"))) === JSON.stringify(["625 g", "6 eggs", "375 g", "938 g"]), "DT349 AC8: the foods for 10: " + g10.join(", "));
    await p.locator("section.rq-howmuch .rq-chips .choice").filter({ hasText: /^4$/ }).click(); await p.waitForTimeout(400);
    ok(await p.locator("section.rq-howmuch .rq-cook-row.idle").count() === 1, "DT349 AC8: a tap on a chip greys − and + again");
    // ---- DT349: What do you do with it? ----
    const act = p.locator("section.rq-actions");
    const acts = (await act.getByRole("button").allTextContents()).map((t) => t.trim());
    ok(/What do you do with it\?/.test(await txt(act)) && JSON.stringify(acts) === JSON.stringify(["Plan it", "Put it on the Plate"]) && !(await p.getByRole("button", { name: "Change it first" }).count()), "DT349 AC9: What do you do with it? Plan it, Put it on the Plate; no Change it first: " + acts.join(", "));
    await act.getByRole("button", { name: "Plan it" }).click(); await p.waitForTimeout(500);
    const days = await act.locator(".pcal-day:not(.pcal-more)").evaluateAll((ds) => ds.map((d) => [d.textContent.trim(), d.disabled]));
    ok(await act.locator(".pcal").count() === 1 && days.some(([t, off]) => /Mon 23/.test(t) && off) && days.some(([t, off]) => /today/.test(t) && !off), "DT349 AC10: the days and the meals show in place; no day before today: " + JSON.stringify(days));
    await act.locator(".pcal-rows").getByText("Dinner").first().click(); await p.waitForTimeout(500);
    const portion = await txt(act.locator(".rq-choice-line"));
    ok(portion === "Your dinner portion on Tuesday: 300 g · 733 kcal · 31 g protein · PD 4.3" && /The whole recipe is 3\.0 of these portions/.test(await txt(act)), "DT349 AC11: my dinner portion: " + portion);
    await act.getByRole("button", { name: "Put it in the plan" }).click(); await p.waitForTimeout(500);
    const planned = await p.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-planned") || "{}")["2026-11-24"] || {});
    const din = Object.values(planned).find((m) => m && m.title === "Lazy Burek");
    ok(/In the plan: Tuesday, dinner, 300 g/.test(await txt(act)) && din && din.kcal === 733, "DT349 AC12: in the plan, Tuesday's dinner, 733 kcal: " + JSON.stringify(din && { title: din.title, kcal: din.kcal }));
    ok(/^4$/.test(await txt(p.locator("section.rq-howmuch .choice.on"))) && /^4 servings: 2,194 kcal/.test(await txt(p.locator("section.rq-howmuch .rq-choice-line"))), "DT349 AC12: the recipe's servings and foods are as they were");
    // a meal that holds something already is asked about first (Coach Milan 25 November 14:42)
    await act.getByRole("button", { name: "Plan it" }).click(); await p.waitForTimeout(300);
    if (!(await act.locator(".pcal").count())) { await act.getByRole("button", { name: "Plan it" }).click(); await p.waitForTimeout(300); }
    await act.locator(".pcal-rows").getByText("Dinner").first().click(); await p.waitForTimeout(500);
    ok(/Tuesday's dinner already holds Lazy Burek\./.test(await txt(act)) && await act.getByRole("button", { name: "Put it in its place" }).count() === 1 && !(await act.getByRole("button", { name: "Put it in the plan" }).count()), "DT349: a planned meal is asked about first: Put it in its place");
    await p.context().close();
    // ---- B168 AC5: a recipe of one serving ----
    p = await open("/my-recipes/m-skyr");
    ok(/The whole recipe/.test(await txt(p.locator(".rq-readout .readout-top"))) && await p.locator("section.rq-howmuch").count() === 0, "B168 AC5: a recipe of one serving: the card says The whole recipe, no Servings");
    // ---- DT349 AC13: the card's columns on the Plate, a long line under both ----
    await p.getByRole("button", { name: "Put it on the Plate", exact: true }).click(); await p.waitForTimeout(1500);
    const pc = p.locator("main .readout.pd-card").first();
    if (await pc.count()) {
      const n = await pc.locator(".pd-num > b").boundingBox(), r = await pc.locator(".rd-rows").boundingBox(), line = pc.locator(".pd-line, .pd-short").first();
      const lb = await line.boundingBox(), cb = await pc.boundingBox(), long = await pc.locator(".pd-line").count();
      ok(n && r && n.x < r.x, "DT349 AC13: on the Plate, PD on the left, Energy, Weight and Protein on the right");
      ok(long ? lb.y > Math.max(n.y + n.height, r.y + r.height) - 2 && lb.width > cb.width * 0.6 : lb.y > n.y + n.height - 2 && lb.x < r.x, `DT349 AC13: the words against the target (${await txt(line)}) stand ${long ? "under both columns, the full width" : "under the PD"}`);
    } else ok(false, "DT349 AC13: the Plate shows its PD card");
    await p.context().close();
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  } catch (e) { ok(false, "ran to the end: " + e.message.split("\n")[0]); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} failed` : "all passed"); process.exit(fail ? 1 : 0);
})();
