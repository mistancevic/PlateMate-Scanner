// The chef in context, 0.2.4 (canvas S "Chef Mealan, about this screen", H5, H6, H11): the chat opens knowing the screen,
// with chips written for it; Fill a day from Plan fills the open slots from My recipes and the starters and Put them in
// the plan acts; the question above Scan on Today; the mic when the browser has one.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
const skyr = seed.foods.find((f) => /skyr/i.test(f.name));
seed.meals = [{ id: "m1", title: "Skyr bowl", items: [{ id: "i1", food: skyr, grams: 300, locked: true }], portion: 300, savedAt: "2026-10-01T08:00:00Z" }];
seed.items = [];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3195" }, stdio: ["ignore", "pipe", "pipe"] });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 1500 }, deviceScaleFactor: 2 });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const key = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })();
  await page.addInitScript(([s, key]) => { if (!localStorage.getItem("seeded")) {
    localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "each", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, plan: Array(7).fill({ work: true, kind: "strength", intensity: "hard", when: "evening", minutes: 60 }), lifestyle: { meals: 3, window: { from: "07:30", to: "20:00" } } }));
    localStorage.setItem("chefmealan-planned", JSON.stringify({ [key]: { breakfast: { title: "Skyr bowl", kcal: 189, protein: 33, source: "mine", mealId: "m1", items: s.meals[0].items, portion: 300 } } }));
    localStorage.setItem("seeded", "1"); } }, [seed, key]);
  await require("./adult.cjs")(page);
  await page.goto("http://127.0.0.1:3195/"); await page.waitForTimeout(900);
  // Today: the question above Scan
  ok(/Does it fit my numbers\?/.test(await page.locator(".scan-why").textContent()), "Scan has its question above it");
  // the chat from Today knows the day
  await page.getByRole("button", { name: "Chef Mealan", exact: true }).click(); await page.waitForTimeout(500);
  const head = await page.locator(".chat-screen .head p").first().textContent();
  ok(/1 of 1 slot to come/.test(head), "from Today the chat says what is to come: " + head);
  const chipsToday = await page.locator(".chips-start .pill").allTextContents();
  // 0.2.8 (board CH, CH6): a chip only offers what the chat can do: swap the next planned meal, what is left, ideas
  ok(/^Swap \w+ for something lighter$/.test(chipsToday[0]) && chipsToday.includes("What's left today?") && chipsToday.includes("I'm out, what do I take?"), "Today's chips: " + chipsToday.join(" | "));
  ok(await page.getByRole("button", { name: /Say it|Listening/ }).count() === (await page.evaluate(() => Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)) ? 1 : 0), "the mic shows when the browser can listen");
  await page.getByRole("button", { name: "Close" }).click(); await page.waitForTimeout(300);
  // Plan: two slots open, the Fill button and the chat about the day
  await page.getByRole("button", { name: /^Plan$/ }).first().click(); await page.waitForTimeout(500);
  ok(await page.getByRole("button", { name: /Fill the open slots with Chef Mealan/ }).count() === 1, "Plan offers Fill the open slots");
  await page.getByRole("button", { name: "Chef Mealan", exact: true }).click(); await page.waitForTimeout(500);
  const headPlan = await page.locator(".chat-screen .head p").first().textContent();
  ok(/About today: 2 slots open, training in the evening/.test(headPlan), "from Plan the chat says what the day needs: " + headPlan);
  ok((await page.locator(".chips-start .pill").allTextContents()).includes("Fill today"), "the first chip fills the day");
  await page.getByRole("button", { name: "Fill today", exact: true }).click(); await page.waitForTimeout(600);
  const fill = page.locator(".fill-rows");
  ok(await fill.count() === 1 && await fill.locator(".fill-row").count() === 2, "two slots filled, one meal each");
  const names = await fill.locator(".fill-text b").allTextContents();
  ok(new Set(names).size === 2 && !names.includes("Skyr bowl"), "two different meals, not the one already in the plan: " + names.join(", "));
  const firstBefore = names[0];
  await fill.getByRole("button", { name: "Change" }).first().click(); await page.waitForTimeout(300);
  const firstAfter = (await fill.locator(".fill-text b").allTextContents())[0];
  ok(firstAfter !== firstBefore, `Change swaps the meal: ${firstBefore} to ${firstAfter}`);
  await page.getByRole("button", { name: "Put them in the plan" }).click(); await page.waitForTimeout(500);
  ok(/In the plan/.test(await fill.textContent()), "the button acted and says so");
  await page.getByRole("button", { name: "Close" }).click(); await page.waitForTimeout(400);
  ok(/all slots set/.test(await page.locator(".plan-top").textContent()), "Plan shows every slot set");
  ok(await page.getByRole("button", { name: /Fill the open slots/ }).count() === 0, "and no Fill button when nothing is open");
  // the Fill button opens the chat with the day filled at once
  await page.evaluate(() => { const pl = JSON.parse(localStorage.getItem("chefmealan-planned")); const k = Object.keys(pl)[0]; delete pl[k].dinner; localStorage.setItem("chefmealan-planned", JSON.stringify(pl)); });
  await page.reload(); await page.waitForTimeout(900);
  await page.getByRole("button", { name: /^Plan$/ }).first().click(); await page.waitForTimeout(500);
  await page.getByRole("button", { name: /Fill the open slots with Chef Mealan/ }).click(); await page.waitForTimeout(700);
  ok(await page.locator(".fill-rows .fill-row").count() === 1, "the button on Plan opens the chat with the open slot filled");
  ok(errs.length === 0, errs.length ? "page errors: " + errs.join(" | ") : "no page errors");
  await b.close(); server.kill();
  process.exit(fail ? 1 : 0);
})();
