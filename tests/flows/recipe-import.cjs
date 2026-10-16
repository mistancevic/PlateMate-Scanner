// A recipe from a screenshot or a link (0.2.16, canvas board IM, IM1 to IM7; Milan 16 October 2026, 20:28 to 22:17).
// Milan's day: 2,800 kcal, 180 g protein (PD 6.4), dinner at 18:30 about 933 kcal. A Margherita from two screenshots,
// read by Chef Mealan (faked here: no AI key), saved in Mine with where it came from, sized for dinner, then fitted:
// Change the dish (the first try fails the checks and goes back once), Add on the side (your way first, a side that
// can't reach the target left out), Did it work? after cooking. A link from Instagram is refused with the next step.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const greek = seed.foods.find((f) => /Greek yogurt/.test(f.name)), ch = seed.foods.find((f) => /Chicken breast/.test(f.name));
seed.items = []; seed.meals = [];
seed.goals = { ...seed.goals, calories: 2800, protein: 180, fats: 93, carbs: 300 };
// two days ago: Greek yogurt with a meal, so it is "your way"
seed.feedback = [{ id: "fb-old", meal: { id: "m-old", title: "Chicken with yogurt", portion: 400, savedAt: "2026-10-14T19:00:00Z", items: [{ id: "a", grams: 200, locked: false, food: ch }, { id: "b", grams: 200, locked: false, food: greek }] }, status: "eaten", taste: "Good", notes: "", createdAt: "2026-10-14T19:30:00" }];
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const read = { recipe: { title: "Margherita pizza", source: "@account_name on Instagram", servings: 2, servingsUnit: "pizzas", servingsHow: "recipe", stated: { kcal: 1100, protein: 46, fats: null, carbs: null }, items: [
  { name: "Pizza dough", written: "500 g", grams: 500, how: "recipe", role: "base", calories: 260, protein: 8, fats: 2.5, carbs: 52 },
  { name: "Tomato passata", written: "200 g", grams: 200, how: "recipe", role: "sauce", calories: 32, protein: 1.4, fats: 0.2, carbs: 5.5 },
  { name: "Mozzarella", written: "2 balls", grams: 250, how: "converted", role: "melting cheese", calories: 280, protein: 20, fats: 21, carbs: 2 },
  { name: "Olive oil", written: "2 tbsp", grams: 20, how: "converted", role: "fat", calories: 884, protein: 0, fats: 100, carbs: 0 },
  { name: "Basil", written: "", grams: 5, how: "guessed", role: "herb or spice", calories: 23, protein: 3.2, fats: 0.6, carbs: 2.7 },
  { name: "Chili oil", written: "to taste", grams: 10, how: "guessed", role: "fat", calories: 884, protein: 0, fats: 100, carbs: 0, optional: true }] } };
const changed = { title: "Margherita pizza, more protein", notes: ["Light mozzarella browns faster: take the pizza out 2 minutes earlier.", "Add the chicken, cooked and sliced, for the last 3 minutes."], items: [
  { name: "Pizza dough", grams: 400, calories: 260, protein: 8, fats: 2.5, carbs: 52, role: "base", change: "less" },
  { name: "Tomato passata", grams: 200, calories: 32, protein: 1.4, fats: 0.2, carbs: 5.5, role: "sauce", change: "same" },
  { name: "Mozzarella, light", grams: 250, calories: 165, protein: 19, fats: 9, carbs: 2, role: "melting cheese", was: "Mozzarella", change: "swap" },
  { name: "Chicken breast, cooked", grams: 150, calories: 165, protein: 31, fats: 3.6, carbs: 0, role: "protein", change: "add" },
  { name: "Olive oil", grams: 10, calories: 884, protein: 0, fats: 100, carbs: 0, role: "fat", change: "less" },
  { name: "Basil", grams: 5, calories: 23, protein: 3.2, fats: 0.6, carbs: 2.7, role: "herb or spice", change: "same" }] };
const sides = { sides: [
  { name: "Skyr", kind: "after", calories: 63, protein: 11, fats: 0.2, carbs: 4, note: "A small bowl after the pizza." },
  { name: "Greek yogurt", kind: "side", calories: 73, protein: 10, fats: 2, carbs: 4, note: "A bowl next to it, with herbs." },
  { name: "Potato chips", kind: "side", calories: 536, protein: 7, fats: 35, carbs: 50, note: "Crunch on the side." }] };
const U = "http://127.0.0.1:3209";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3209", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 1 });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  await page.clock.setFixedTime(new Date("2026-10-16T18:30:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Italian", "Balkan"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  const sent = []; let fitCalls = 0;
  await page.route("**/api/recipe/read", (r) => { sent.push(JSON.parse(r.request().postData() || "{}")); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(read) }); });
  await page.route("**/api/recipe/fit", (r) => {
    const body = JSON.parse(r.request().postData() || "{}"); sent.push(body); fitCalls++;
    if (body.way === "side") return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(sides) });
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body.failed ? changed : { failed: "Cottage cheese doesn't melt like Mozzarella." }) });
  });
  const card = () => page.locator("main section.card").first().textContent().then((t) => t.replace(/\s+/g, " "));
  const grams = () => page.locator('.plate-card .rows input[aria-label^="Grams of"]').evaluateAll((l) => l.map((x) => Number(x.value)));
  const st = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));

  // IM1: an empty plate: two rows, by job
  await page.goto(U + "/plate"); await page.waitForTimeout(1300);
  let t = await card();
  ok(/Add a food/.test(t) && /Start from a recipe/.test(t) && await page.locator(".plate-card").getByText("Screenshot").count() === 1 && await page.locator(".plate-card").getByRole("button", { name: "Link" }).count() === 1, "IM1: an empty plate: Add a food (Scan, Type) and Start from a recipe (Screenshot, Link)");
  ok(!/Empty plate/.test(t), "IM1: no Empty plate on an empty plate");

  // IM2: two screenshots, read in order
  await page.locator(".plate-card label").filter({ hasText: "Screenshot" }).locator("input").setInputFiles([{ name: "a.png", mimeType: "image/png", buffer: PNG }, { name: "b.png", mimeType: "image/png", buffer: PNG }]);
  await page.waitForTimeout(800);
  t = await card();
  ok(/A recipe from screenshots/.test(t) && /2 pictures, read in this order/.test(t) && await page.locator(".in-thumb img").count() === 2, "IM2: the two pictures, in order, with Read them");
  await page.getByRole("button", { name: "Read them" }).click(); await page.waitForTimeout(800);
  ok(sent[0] && Array.isArray(sent[0].images) && sent[0].images.length === 2 && !sent[0].url, "IM2: both pictures go to Chef Mealan, nothing else");

  // IM3: what Chef Mealan read
  t = await card();
  ok(/Margherita pizza/.test(t) && /From @account_name on Instagram, read from your 2 screenshots/.test(t), "IM3: the dish, and where it came from, read from the screenshots");
  ok(/Makes\s*−?\s*2\s*\+?\s*pizzas/.test(t) && /on the recipe/.test(t) && /One pizza: 1,121 kcal · 46 g protein · PD 4\.1/.test(t), "IM3: makes 2 pizzas, one pizza 1,121 kcal, PD 4.1");
  ok(/The recipe says: 1,100 kcal · 46 g protein · PD 4\.2 per pizza\. Our estimate agrees\./.test(t), "0.2.17: the recipe's own numbers next to ours");
  ok(/Chili oil/.test(t) && /optional/.test(t) && /Left out: 1 optional, as the recipe's numbers do/.test(t) && /The whole recipe: 2,242 kcal/.test(t), "0.2.17: an optional ingredient is marked and left out of the numbers");
  await page.getByRole("button", { name: "Add it" }).click(); await page.waitForTimeout(200);
  ok(/The whole recipe: 2,330 kcal/.test(await card()), "0.2.17: Add it puts it into the numbers");
  await page.getByRole("button", { name: "Leave it out" }).click(); await page.waitForTimeout(200);
  ok(/2 balls on the recipe · converted/.test(t) && /no amount on the recipe · guessed/.test(t) && /500 g on the recipe/.test(t), "IM3: every line says where its amount came from");
  await page.getByRole("button", { name: "Put it on my plate" }).click(); await page.waitForTimeout(900);

  // IM4: your portion, sized for dinner
  t = await page.locator(".plate-card").textContent().then((x) => x.replace(/\s+/g, " "));
  ok(await page.locator(".title-input").inputValue() === "Margherita pizza", "IM4: the plate is the Margherita");
  ok(JSON.stringify(await grams()) === JSON.stringify([210, 83, 105, 8, 2]), `IM4: sized for dinner: every food scaled the same way (${await grams()})`);
  ok(/Sized for your dinner/.test(t) && /1 of 2 pizzas/.test(t) && /One pizza is 1,121 kcal\. Your dinner is about 933\. Sized for it: 84% of one pizza\./.test(t), "IM4: two portions to pick from, with what each is");
  ok(/4\.2/.test(await page.locator(".plate-card .readout").textContent()), "IM4: PD 4.2, said in the readout (4.1 for the whole recipe; the amounts to the gram)");
  ok(/Empty plate/.test(await page.locator(".plate-card .card-top").textContent()) && await page.locator(".plate-card .ways .ways-empty").count() === 0, "IM1b: Empty plate sits at the top of the card, out of the row that adds foods");
  ok(/Under your PD 6\.4: two ways to fit it/.test(t), "IM4: under the target: two ways to fit it");
  let s = await st();
  const m = s.meals[0];
  ok(m.title === "Margherita pizza" && m.source.name === "@account_name on Instagram" && m.source.from === "screenshot" && m.makes.n === 2 && (Array.isArray(m.shots) ? m.shots.length === 2 : m.source.shotSigs.length === 2), "IM6: saved in Mine with where it came from, how many it makes and the two screenshots");
  ok(!m.photo && !(m.photos ?? []).length, "IM6: a screenshot is never the recipe's photo or cover");
  await page.getByRole("button", { name: "1 of 2 pizzas" }).click(); await page.waitForTimeout(400);
  ok(JSON.stringify(await grams()) === JSON.stringify([250, 100, 125, 10, 3]), "IM4: 1 of 2 pizzas: the recipe's own portion");
  await page.getByRole("button", { name: "Sized for your dinner" }).click(); await page.waitForTimeout(400);

  // IM5: change the dish: the first try fails the checks and goes back once, with the reason
  await page.getByRole("button", { name: "Change the dish" }).click(); await page.waitForTimeout(1200);
  ok(fitCalls === 2 && sent.filter((x) => x.way === "change").pop().failed === "Cottage cheese doesn't melt like Mozzarella.", "IM5: a change that fails the checks goes back once, with why");
  ok(await page.locator(".title-input").inputValue() === "Margherita pizza, more protein", "IM5: the changed dish has its own name");
  t = await page.locator(".plate-card").textContent().then((x) => x.replace(/\s+/g, " "));
  ok(/Light mozzarella browns faster/.test(t) && /Not cooked yet/.test(t) && /Back to the original/.test(t), "IM5: a cooking note per swap, Not cooked yet, Back to the original");
  ok(/fits your plan/.test(await page.locator(".plate-card .readout").textContent()), "IM5: at the target now");
  await page.getByRole("button", { name: "Back to the original" }).click(); await page.waitForTimeout(400);
  ok(JSON.stringify(await grams()) === JSON.stringify([210, 83, 105, 8, 2]) && await page.locator(".title-input").inputValue() === "Margherita pizza", "IM5: Back to the original undoes it");

  // IM5b: add on the side: your way first; a side that can't reach the target is left out
  await page.getByRole("button", { name: "Add on the side" }).click(); await page.waitForTimeout(900);
  t = await page.locator(".plate-card").textContent().then((x) => x.replace(/\s+/g, " "));
  const chips = await page.locator(".in-way .choice").allTextContents();
  ok(/Greek yogurt on the side, 305 g · your way/.test(chips[0] ?? "") && chips.some((c) => /Skyr after/.test(c)) && !chips.some((c) => /chips/i.test(c)), `IM5b: Greek yogurt first, your way, 305 g; potato chips left out (${chips.join(" | ")})`);
  ok(JSON.stringify(await grams()) === JSON.stringify([160, 63, 79, 6, 2, 305]), `IM5b: the pizza a little smaller, the side brings the protein (${await grams()})`);
  ok(/fits your plan/.test(await page.locator(".plate-card .readout").textContent()) && /The pizza is not changed/.test(await page.locator(".step-head").textContent()), "IM5b: at the target, the pizza as the recipe makes it");

  // Make it, then Did it work?
  await page.getByRole("button", { name: "Make it", exact: true }).click(); await page.waitForTimeout(600);
  if (await page.locator(".way").count()) await page.locator(".way").first().click();
  await page.getByRole("button", { name: /I'm making it this way|Continue/ }).click(); await page.waitForTimeout(400);
  await page.getByRole("button", { name: "On to How was it?" }).click(); await page.waitForTimeout(400);
  t = await page.locator("main").textContent().then((x) => x.replace(/\s+/g, " "));
  ok(/Did the side work\?/.test(t) && /Greek yogurt on the side/.test(t) && /Margherita pizza is in My recipes already/.test(t), "After: Did the side work?, and the card points at the recipe, no second copy");
  await page.getByRole("button", { name: "It worked" }).click();
  await page.getByRole("button", { name: "DaaM good" }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click(); await page.waitForTimeout(600);
  s = await st();
  ok(s.feedback[0].tried && s.feedback[0].tried.result === "yes" && s.feedback[0].recipeId === m.id, "After: the card keeps that the side worked, and points at the recipe");
  ok(s.meals.filter((x) => x.title === "Margherita pizza").length === 1 && s.meals[0].tried?.[0]?.what === "Greek yogurt on the side" && !s.fromRecipe, "After: the recipe remembers it, once");

  // IM6: the recipe page says where it came from
  await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(600);
  await page.getByText("Margherita pizza").first().click(); await page.waitForTimeout(700);
  t = await page.locator(".rq-source").textContent().then((x) => x.replace(/\s+/g, " "));
  ok(/Where it came from/.test(t) && /Adapted from @account_name on Instagram/.test(t) && /\+ Add the link/.test(t) && /Makes 2 pizzas, as the recipe says/.test(t), "IM6: Where it came from, Adapted from, Add the link, makes 2");
  ok(/Your screenshots, for you only\. Never the cover, never shared with members, never published\./.test(t) && await page.locator(".rq-source .in-thumb img").count() === 2, "IM6: the two screenshots, for you only");
  await page.getByRole("button", { name: "+ Add the link" }).click();
  await page.locator(".rq-source input").fill("https://example.com/recipes/margherita"); await page.locator(".rq-source input").press("Enter"); await page.waitForTimeout(300);
  ok((await st()).meals[0].source.url === "https://example.com/recipes/margherita", "IM6: the link added later stays with the recipe");

  // IM7: an Instagram link: the real server refuses it, with the next step
  await page.unroute("**/api/recipe/read");
  await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(600);
  await page.locator(".plate-card").getByRole("button", { name: "Link" }).click();
  await page.locator(".in-card input").fill("https://www.instagram.com/p/abc123/");
  await page.getByRole("button", { name: "Read it" }).click(); await page.waitForTimeout(800);
  t = await card();
  ok(/This link didn't open for us\./.test(t) && /Instagram, TikTok and some sites need a login/.test(t) && await page.getByRole("button", { name: "Use Screenshot" }).count() === 1, "IM7: an Instagram link: didn't open, use Screenshot");
  await page.getByRole("button", { name: "Use Screenshot" }).click(); await page.waitForTimeout(300);
  ok(/A recipe from screenshots/.test(await card()), "IM7: Use Screenshot goes to the pictures");
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
