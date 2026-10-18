// The recipe page at the centre (0.2.25, canvas board RP, RP1 to RP5b; Milan 17 October 2026, 17:42 to 18:23). A recipe from
// a link: the original is the steps, numbered, headings in bold, the page's signs read as letters; a line says the original
// works with your foods; Chef Mealan's way on a tap, then a toggle. PD sits above the table, as on the Plate; each column
// says its weight. How to make it says what you make and what you eat. A changed dish: the line says what differs.
// Every recipe made ends on its page; a plate that is no recipe ends on Today. Today has no camera; Manual, then Scan.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
seed.goals = { ...seed.goals, calories: 2800, protein: 70, fats: 93, carbs: 300 };
const it = (name, written, grams, role, calories, protein, part) => ({ name, written, grams, how: "recipe", role, calories, protein, fats: 10, carbs: 20, optional: false, part });
const URL_ = "https://sallysbakingaddiction.com/no-bake-cheesecake/";
const read = { url: URL_, recipe: { title: "No-bake cheesecake", source: "Sally's Baking Addiction", servings: 12, servingsUnit: "slices", servingsHow: "recipe", stated: null,
  steps: ["Make the crust: Stir the crust ingredients together. If it&#8217;s helpful, use a measuring cup.", "Freeze for 10&#8211;20 minutes.", "Make the filling: Beat the cream cheese until smooth.", "Spread into the crust and chill 6 hours."],
  items: [it("Graham cracker crumbs", "240g", 240, "base", 430, 7, "Crust"), it("Butter", "113g", 113, "fat", 717, 0.9, "Crust"), it("Cream cheese", "678g", 678, "cheese", 342, 6, "Filling"), it("Granulated sugar", "100g", 100, "sweet", 387, 0, "Filling")] } };
const changed = { title: "No-bake cheesecake, more protein", notes: ["Chill it overnight."], items: [
  { name: "Graham cracker crumbs", grams: 240, calories: 430, protein: 7, fats: 10, carbs: 77, role: "base", change: "same", part: "Crust" }, { name: "Butter", grams: 113, calories: 717, protein: 0.9, fats: 81, carbs: 0, role: "fat", change: "same", part: "Crust" },
  { name: "Light cream cheese", grams: 678, calories: 200, protein: 9, fats: 15, carbs: 6, role: "cheese", change: "swap", was: "Cream cheese" }, { name: "Granulated sugar", grams: 100, calories: 387, protein: 0, fats: 0, carbs: 100, role: "sweet", change: "same", part: "Filling" },
  { name: "Vanilla whey protein powder", grams: 60, calories: 390, protein: 78, fats: 5, carbs: 8, role: "protein", change: "add", part: "Filling" }] };
const U = "http://127.0.0.1:3217";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3217", GEMINI_API_KEY: "" }, stdio: "ignore" });
  process.on("exit", () => { try { server.kill(); } catch {} });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 1600 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
  await page.clock.setFixedTime(new Date("2026-10-17T18:30:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  await page.route("**/api/recipe/read", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(read) }));
  await page.route("**/api/recipe/fit", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(changed) }));
  const asks = [];
  await page.route("**/api/steps", (r) => { asks.push(JSON.parse(r.request().postData() || "{}")); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ steps: ["Mix {1} and {2}; press into a tin.", "Beat {3} with {4} until smooth.", "Spread on the crust and chill 6 hours."], marks: [{ kind: "same", why: "" }, { kind: "same", why: "" }, { kind: "same", why: "" }] }) }); });
  const text = (sel) => page.locator(sel).first().textContent().then((t) => t.replace(/\s+/g, " "));
  const shot = async (name, sel) => { if (!process.env.SHOTS) return; await page.evaluate(() => document.querySelectorAll(".chat-fab, .bottom-nav, .toast").forEach((x) => (x.style.display = "none"))); await page.locator(sel).first().screenshot({ path: path.join(process.env.SHOTS, `${name}.png`) }); await page.evaluate(() => document.querySelectorAll(".chat-fab, .bottom-nav").forEach((x) => (x.style.display = ""))); };
  const nav = async (name) => { await page.locator("nav button").filter({ hasText: name }).click(); await page.waitForTimeout(700); };

  // RP5: Today has no camera; the Plate: Manual, then Scan
  await page.goto(U + "/"); await page.waitForTimeout(1500);
  ok(await page.getByRole("button", { name: /Scan food/ }).count() === 0 && !/Does it fit my numbers\?/.test(await text("main")), "RP5: Today has no Scan food");
  await nav("Plate");
  const ways = (await page.locator(".plate-card .ways button").allTextContents()).map((x) => x.trim());
  ok(ways[0] === "Manual" && ways[1] === "Scan", `RP5b: Manual on the left, Scan on the right (${ways.join(" | ")})`);
  await shot("rp5b", ".plate-card");

  // RP1: the original is the steps
  await page.locator(".plate-card").getByRole("button", { name: "Link" }).click(); await page.waitForTimeout(300);
  await page.getByLabel("Link to a recipe").fill(URL_);
  await page.getByRole("button", { name: "Read it" }).click(); await page.waitForTimeout(900);
  // RP1 (Milan 19:43): the steps show with the foods, right after the read
  ok(/As the page writes them, for the whole recipe/.test(await text(".in-card .in-steps")) && await page.locator(".in-card .in-steps .rp-orig li").count() === 4 && /it’s helpful/.test(await text(".in-card .in-steps")), "RP1: the read card shows the steps with the foods");
  await shot("rp1-read", ".in-card");
  await page.getByRole("button", { name: "Put it on my plate" }).click(); await page.waitForTimeout(1300);
  ok(await page.locator(".in-steps-plate .rp-orig li").count() === 4, "RP1: the Plate shows the recipe's steps to review before Make it");
  await shot("rp1-plate", ".in-steps-plate");
  await nav("Recipes");
  await page.getByText("No-bake cheesecake", { exact: true }).last().click(); await page.waitForTimeout(900);
  let t = await text(".rq-steps");
  ok(/As Sally's Baking Addiction writes them/.test(t) && await page.locator(".rq-steps .rp-orig li").count() === 4, "RP1: the original is the steps, numbered");
  ok(/it’s helpful/.test(t) && /10 to 20 minutes/.test(t) && !/&#/.test(t), "RP1b: the page's signs read as letters; a range reads 10 to 20");
  ok(await page.locator(".rq-steps .rp-orig li b").first().textContent() === "Make the crust.", "RP1: the page's heading in bold");
  ok(/The original works with your foods as they are/.test(t) && await page.getByRole("button", { name: "Chef Mealan's way" }).count() === 1, "RP1: a line says the original works; Chef Mealan's way on a tap");
  await shot("rp1", ".rq-steps");
  // RP2: PD above the table; each column says its weight; no tiles
  ok(await page.locator(".rp-stats").count() === 0, "RP2: the three tiles gave way");
  const ro = await text(".rq-readout");
  ok(/One slice/.test(ro) && /PD/.test(ro) && / g$/.test(ro.trim()), `RP2: the readout above the table, one slice (${ro})`);
  const th = await text(".nt-card .nt-th");
  ok(/1 SLICE\s*\d+ g/.test(th) && /ALL 12\s*1,131 g/.test(th), `RP2: each column says its weight (${th})`);
  ok(await page.locator(".nt-card .nt-pd").count() === 0, "RP2: PD is no row of the table");
  await shot("rp2", ".rq-readout");
  // RP1c: Chef Mealan's way, then the toggle
  await page.getByRole("button", { name: "Chef Mealan's way" }).click(); await page.waitForTimeout(900);
  await page.getByRole("button", { name: "Keep these steps" }).click(); await page.waitForTimeout(500);
  ok(await page.getByRole("tab", { name: "Chef Mealan's" }).count() === 1 && await page.getByRole("tab", { name: "Original" }).count() === 1, "RP1c: Chef Mealan's steps and the original, one tap apart");
  await page.getByRole("tab", { name: "Original" }).click(); await page.waitForTimeout(200);
  ok(await page.locator(".rq-steps .rp-orig li").count() === 4, "RP1c: the original is one tap away");
  await shot("rp1c", ".rq-steps");

  // RP3, RP1b: Make it, Change the dish, How to make it
  await page.getByRole("button", { name: /^Make it( as it is)?$/ }).click(); await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Change the recipe" }).click(); await page.waitForTimeout(1200);
  await page.getByRole("button", { name: /^Make it( as it is)?$/ }).click(); await page.waitForTimeout(800);
  t = await text("main");
  ok(/Your dish has light cream cheese and vanilla whey protein powder\. The original has cream cheese\./.test(t) && await page.getByRole("button", { name: "Write the steps for my dish" }).count() === 1 && /The original, for the original foods/.test(t), `RP1b: your dish differs: the line says how; the original for the original foods (${t.slice(0, 200)})`);
  ok(/You make all 12 slices\s*[\d,]+ g · [\d,]+ kcal/.test(t) && /You eat your plate\s*\d+ g · [\d,]+ kcal · PD/.test(t), "RP3: You make, You eat, each with weight and energy");
  await shot("rp3", ".mk-card");
  await page.getByRole("button", { name: "I'm making it" }).click(); await page.waitForTimeout(500);
  await page.getByRole("button", { name: /On to How was it\?/ }).click(); await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Good", exact: true }).first().click();
  const w = page.getByRole("button", { name: "It worked" }); if (await w.count()) await w.click();
  await page.getByRole("button", { name: "Save", exact: true }).click(); await page.waitForTimeout(1200);
  ok(/Saved in Mine/.test(await text(".rq-landed")) && /No-bake cheesecake, more protein/.test(await text(".rq")), "RP4: the changed dish, saved, opens on its page");
  // the original, made again: it ends on its page too
  await page.locator(".rq-back").click(); await page.waitForTimeout(500);
  await page.getByText("No-bake cheesecake", { exact: true }).last().click(); await page.waitForTimeout(800);
  await page.getByRole("button", { name: /^Make it( as it is)?$/ }).click(); await page.waitForTimeout(1200);
  await page.getByRole("button", { name: /^Make it( as it is)?$/ }).click(); await page.waitForTimeout(800);
  await page.getByRole("button", { name: "I'm making it" }).click(); await page.waitForTimeout(500);
  await page.getByRole("button", { name: /On to How was it\?/ }).click(); await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Good", exact: true }).first().click();
  await page.getByRole("button", { name: "Save", exact: true }).click(); await page.waitForTimeout(1200);
  ok(/Made today/.test(await text(".rq-landed")) && /No-bake cheesecake/.test(await text(".rq")), "RP4: a recipe made again ends on its page");
  await shot("rp4", ".rq-landed");

  // a plate that is no recipe, not kept: it ends on Today
  const yog = seed.foods.find((f) => /Skyr/.test(f.name)), nut = seed.foods.find((f) => /Nutella/.test(f.name));
  await page.evaluate(([y, n]) => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); localStorage.setItem("platemate-pilot-v1", JSON.stringify({ ...s, items: [{ id: "y", grams: 200, locked: false, food: y }, { id: "n", grams: 15, locked: false, food: n }], title: "", fromRecipe: undefined })); }, [yog, nut]);
  await page.goto(U + "/plate"); await page.waitForTimeout(1300);
  await page.getByRole("button", { name: "Keep it as it is" }).click(); await page.waitForTimeout(800);
  await page.locator(".way").first().click(); await page.waitForTimeout(200);
  await page.getByRole("button", { name: /I'm making it this way/ }).click(); await page.waitForTimeout(500);
  await page.getByRole("button", { name: /On to How was it\?/ }).click(); await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Good", exact: true }).first().click();
  await page.getByRole("button", { name: "Not this one" }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click(); await page.waitForTimeout(1000);
  const where = await page.evaluate(() => location.pathname);
  ok(where !== "/plate" && await page.locator(".rq").count() === 0 && !/What are you craving\?/.test(await text("main")), `RP4: a plate that is no recipe ends on Today (${where})`);
  ok(errs.length === 0, `No page errors${errs.length ? `: ${errs.join(" | ")}` : ""}`);
  await b.close(); server.kill();
  if (fails.length) { console.log(`\n${fails.length} failed`); process.exit(1); }
  console.log("\nall passed");
})().catch((e) => { console.error(e); process.exit(1); });
