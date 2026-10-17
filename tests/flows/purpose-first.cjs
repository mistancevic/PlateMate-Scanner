// What the plate is for, first (0.2.27, canvas boards PF, PF2, PF3, PF4; Milan 17 October 2026, 21:22 to 23:25). The Plate starts
// Exploring, sized for no meal; a tap anywhere on the line opens What is it for?, Done closes it; a meal shows the plan's
// numbers. The read ends by what it is for: Put it on my plate for a meal; Save in Mine, Plan it, Make it now when exploring.
// Recipes has Add a recipe; the recipe page's Make it asks first. The two ways work at any PD by the portion: the side by the
// mix tip's rule, the change sized like a plate. Meal prep: for which meal, how many portions, Keep for later and the Plan.
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

const sides = { sides: [{ name: "Skyr, natural", kind: "side", calories: 63, protein: 11, fats: 0.2, carbs: 4, note: "A bowl of skyr next to the slice." }] };
const C = (name, grams, calories, protein, role, change, was, part) => ({ name, grams, calories, protein, fats: 5, carbs: 10, role, change, was, part });
const changeGood = { title: "Skyr cheesecake", notes: ["Chill it overnight."], items: [C("Graham cracker crumbs", 100, 430, 7, "base", "less", null, "Crust"), C("Butter", 45, 717, 0.9, "fat", "less", null, "Crust"),
  C("Cream cheese", 200, 342, 6, "cheese", "less", null, "Filling"), C("Granulated sugar", 50, 387, 0, "sweet", "less", null, "Filling"), C("Skyr, natural", 900, 63, 11, "cheese", "add", null, "Filling"), C("Vanilla whey protein powder", 100, 380, 75, "protein", "add", null, "Filling")] };
const U = "http://127.0.0.1:3218";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3218", GEMINI_API_KEY: "" }, stdio: "ignore" });
  process.on("exit", () => { try { server.kill(); } catch {} });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const fresh = async () => {
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
    await page.route("**/api/recipe/fit", (r) => { const bd = JSON.parse(r.request().postData() || "{}"); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(bd.way === "side" ? sides : changeGood) }); });
    return { page, ctx };
  };
  const text = (page, sel) => page.locator(sel).first().textContent().then((t) => (t || "").replace(/\s+/g, " "));
  const nav = async (page, name) => { await page.locator("nav button").filter({ hasText: name }).click(); await page.waitForTimeout(700); };
  const readLink = async (page) => { await page.locator(".plate-card").getByRole("button", { name: "Link" }).click(); await page.waitForTimeout(300); await page.getByLabel("Link to a recipe").fill(URL_); await page.getByRole("button", { name: "Read it" }).click(); await page.waitForTimeout(900); };

  // PF A1 to A7: Exploring, then Dinner, Done; the read for dinner; the plate sized for dinner; How to make it with the foods
  { const { page, ctx } = await fresh();
    await page.goto(U + "/plate"); await page.waitForTimeout(1300);
    ok(/Exploring · not sized for a meal/.test(await text(page, ".plan-line")), "A1: the line starts Exploring");
    ok(/Add a recipe or foods/.test(await text(page, "main")), "A1: the title for Exploring");
    ok(await page.getByRole("button", { name: /Fit to my target/ }).count() === 1, "A1: Exploring sizes no meal: Fit to my target");
    await page.locator(".plan-line span").first().click(); await page.waitForTimeout(250);
    ok(await page.locator(".for-row").count() === 1 && await page.locator(".plan-line-done").count() === 1, "A2: a tap on the line opens What is it for?; Done where the pencil was");
    const chips = (await page.locator(".for-row button").allTextContents()).map((x) => x.trim());
    ok(chips.join("|") === "Exploring|Breakfast|Lunch|Dinner|Snack|Meal prep|Plan it", `A2: the chips (${chips.join(" | ")})`);
    await page.locator(".for-row").getByRole("button", { name: "Dinner", exact: true }).click(); await page.waitForTimeout(250);
    ok(/Dinner, 20:00 · 933 kcal · 23 g protein · PD 2\.5/.test(await text(page, ".plan-line")), `A2b: the line says dinner with the plan's numbers at once (${await text(page, ".plan-line")})`);
    ok(/What are you craving for dinner\?/.test(await text(page, "main")), "A2b: the title says dinner");
    await page.locator(".plan-line-done").click(); await page.waitForTimeout(250);
    ok(await page.locator(".for-row").count() === 0 && /Dinner, 20:00/.test(await text(page, ".plan-line")), "A3: Done closes it; the line keeps Dinner");
    await readLink(page);
    ok(/For your dinner: 933 kcal/.test(await text(page, ".in-card")) && await page.getByRole("button", { name: "Put it on my plate" }).count() === 1, "A5: the read says what it is for; Put it on my plate");
    ok(!/perfectly s$/.test(await text(page, ".in-steps")), "A5: no step is cut");
    await page.getByRole("button", { name: "Put it on my plate" }).click(); await page.waitForTimeout(1300);
    ok(/Sized for your dinner/.test(await text(page, ".plate-card")), "A6: the recipe is sized for the meal picked");
    const make = page.locator(".ways-out .pill-primary");
    ok((await make.textContent()).trim() === "Make it as it is" && await make.locator("svg").count() === 0, "A6: Make it as it is, no chef hat");
    ok(await page.getByRole("button", { name: "Change the recipe" }).locator("svg").count() === 1 && await page.getByRole("button", { name: "Add on the side" }).locator("svg").count() === 1, "A6: Change the recipe and Add on the side carry the chef hat");
    ok(/whatever the PD of the recipe/.test(await text(page, ".in-ways")), "A6: a line says what each way does");
    // PF4 rule 1: the side by the mix tip's rule
    await page.getByRole("button", { name: "Add on the side" }).click(); await page.waitForTimeout(1200);
    const sub = await text(page, ".step-head p");
    ok(/as it is, [^,]+, and Skyr, natural on the side/.test(sub), `rule 1: a piece with the side (${sub})`);
    const pdNow = Number((await text(page, ".plate-card .readout-mid b")).trim());
    ok(pdNow >= 2.5, `rule 1: the plate reaches the target (${pdNow})`);
    const skyr = Number(await page.locator(".plate-card .row").filter({ hasText: "Skyr, natural" }).locator("input").inputValue());
    ok(skyr > 0 && skyr <= 300, `rule 1: the side stays a real portion (${skyr} g)`);
    await page.getByRole("button", { name: "Back to the original" }).click(); await page.waitForTimeout(600);
    // PF4 rule 2: the change sized like a plate
    await page.getByRole("button", { name: "Change the recipe" }).click(); await page.waitForTimeout(1500);
    ok(/Your No-bake cheesecake, changed\./.test(await text(page, ".step-head p")), `rule 2: the change is shown (${await text(page, ".step-head p")})`);
    await page.getByRole("button", { name: "Back to the original" }).click(); await page.waitForTimeout(600);
    await page.getByRole("button", { name: "Make it as it is" }).click(); await page.waitForTimeout(900);
    ok(/No-bake cheesecake, as it is, for your dinner\./.test(await text(page, ".step-head p")), "A7: the line says what you make and what for");
    ok(await page.locator(".mk-foods").count() === 1 && /Foods for/.test(await text(page, ".mk-foods")) && await page.locator(".mk-foods .rq-food").count() === 4, "A7: the recipe page's Foods card, before the steps");
    await ctx.close(); }

  // PF2: Recipes, Add a recipe; the read when exploring: Save in Mine, Plan it, Make it now
  { const { page, ctx } = await fresh();
    await page.goto(U + "/"); await page.waitForTimeout(1200);
    await nav(page, "Recipes");
    await page.getByRole("button", { name: "Add a recipe" }).click(); await page.waitForTimeout(800);
    ok(/Exploring/.test(await text(page, ".plan-line")), "B0 → B1: Add a recipe opens the Plate, Exploring");
    await readLink(page);
    ok(await page.getByRole("button", { name: "Save in Mine" }).count() === 1 && await page.getByRole("button", { name: "Plan it" }).count() === 1 && await page.getByRole("button", { name: "Make it now" }).count() === 1 && await page.getByRole("button", { name: "Put it on my plate" }).count() === 0, "B3: Save in Mine, Plan it, Make it now");
    await page.getByRole("button", { name: "Make it now" }).click(); await page.waitForTimeout(300);
    ok(/Dinner is next, so it is picked/.test(await text(page, ".in-card")), "D1: Make it now picks the next meal");
    await page.getByRole("button", { name: "Save in Mine" }).click(); await page.waitForTimeout(1300);
    ok(/Saved in Mine/.test(await text(page, ".rq-landed")) && /Not made yet/.test(await text(page, ".rq-landed")), "B4: you land on the recipe page, saved, not made");
    await page.getByRole("button", { name: "Make it", exact: true }).click(); await page.waitForTimeout(1300);
    ok(await page.locator(".for-row").count() === 1 && /Dinner/.test(await text(page, ".plan-line")), "B4: Make it opens the Plate asking what it is for, the next meal picked");
    await ctx.close(); }
  { const { page, ctx } = await fresh();
    await page.goto(U + "/plate"); await page.waitForTimeout(1300);
    await readLink(page);
    await page.getByRole("button", { name: "Plan it" }).click(); await page.waitForTimeout(300);
    await page.locator(".in-panel").getByRole("button", { name: "Lunch", exact: true }).click();
    const day = (await page.locator(".in-panel .moments").first().locator("button").nth(1).textContent()).trim();
    await page.locator(".in-panel .moments").first().locator("button").nth(1).click();
    await page.getByRole("button", { name: "Add to the Plan" }).click(); await page.waitForTimeout(1300);
    ok(/No-bake cheesecake/.test(await text(page, "main")) && /Plan/.test(await text(page, "header")), `C1 → C2: Plan it puts it in ${day}'s lunch and opens Plan on that day`);
    await ctx.close(); }

  // PF3: meal prep, four lunches, into Keep for later and the Plan
  { const { page, ctx } = await fresh();
    await page.goto(U + "/plate"); await page.waitForTimeout(1300);
    await page.locator(".plan-line").click(); await page.waitForTimeout(200);
    await page.locator(".for-row").getByRole("button", { name: "Meal prep" }).click(); await page.waitForTimeout(200);
    await page.locator(".for-prep").getByRole("button", { name: "Lunch" }).click(); await page.waitForTimeout(200);
    ok(/Each portion is your usual lunch: 933 kcal/.test(await text(page, ".for-prep")), "M1: each portion is the usual lunch");
    await page.locator(".plan-line-done").click(); await page.waitForTimeout(200);
    ok(/Meal prep · 4 lunches/.test(await text(page, ".plan-line")), "M1b: the line keeps Meal prep, 4 lunches");
    await readLink(page);
    ok(/Meal prep: 4 lunches of 933 kcal/.test(await text(page, ".in-card")), "M2: the read says meal prep");
    await page.getByRole("button", { name: "Put it on my plate" }).click(); await page.waitForTimeout(1300);
    ok(/Sized for 4 lunches/.test(await text(page, ".plate-card")) && /One lunch/.test(await text(page, ".plate-card .readout")), "M3: the plate shows one lunch");
    await page.getByRole("button", { name: /Make 4 lunches/ }).click(); await page.waitForTimeout(900);
    ok(/You make 4 lunches/.test(await text(page, "[aria-label='What you make']")) && /You eat now nothing/.test(await text(page, "[aria-label='What you make']")), "M4: you make 4 lunches, you eat nothing now");
    ok(/Foods for 4 lunches/.test(await text(page, ".mk-foods")), "M4: the Foods card for the batch");
    await page.getByRole("button", { name: /I.m making it/ }).click(); await page.waitForTimeout(700);
    await page.getByRole("button", { name: /Keep the 4 lunches/ }).click(); await page.waitForTimeout(1300);
    ok(/You made 4 lunches/.test(await text(page, ".rq-landed")), "M5: you land on the recipe, 4 lunches kept");
    const st = await page.evaluate(() => ({ fb: JSON.parse(localStorage.getItem("platemate-pilot-v1")).feedback, plan: JSON.parse(localStorage.getItem("chefmealan-planned") || "{}") }));
    ok(st.fb.some((f) => f.status === "prepared" && f.left === 4), "M5: one card in Keep for later with 4 left");
    ok(Object.values(st.plan).filter((d) => d.lunch).length === 4, "M5: four lunches in the Plan");
    await ctx.close(); }

  ok(errs.length === 0, `no page errors${errs.length ? `: ${errs.join(" | ")}` : ""}`);
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
