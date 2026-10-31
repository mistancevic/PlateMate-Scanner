// DT188 (0.3.30, board Stories137; Coach Milan 31 October 12:56 to 13:00, 16:08, 16:26 Go): roles and navigation. Explorer is
// the fifth tab for everyone and leaves the menu. The coach is one account with two views, My day and My clients, switched at
// the top of Today; in My clients the bar keeps its order and Plate becomes Clients; Today, Plan and Recipes show the chosen
// client's, read-only, under the title My clients with the name below. The coach suggests a planned snack or an Explorer page;
// the client gets a card on Today with Accept and Not now (a reason as a chip or a line). The superadmin has Admin in the menu.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = [];
const PORT = "3340", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  page.on("pageerror", (e) => errs.push(e.message));
  const text = async (loc) => ((await loc.textContent()) ?? "").replace(/\s+/g, " ").trim();
  const bar = async () => (await page.locator(".bottom-nav button > span:last-child").allTextContents()).join(",");
  const at = new Date(); at.setHours(at.getHours() - 1);
  // the client: four meals a day (a snack slot), a coach, and two suggestions waiting on the account's thread
  await page.addInitScript(([s, at]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-20T16:00:00Z", source: "profile" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "female", birthYear: 1985, heightCm: 168, weightKg: 68, lifestyle: { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 4, wake: "early", bed: "mid" }, plan: Array(7).fill({ work: true, kind: "rest" }) }));
    localStorage.setItem("chefmealan-coach", JSON.stringify({ checkinDay: 4, notes: [
      { at, by: "coach", name: "Milan", text: "Skyr and a fruit", suggest: { kind: "snack", time: "16:00" } },
      { at: new Date(new Date(at).getTime() + 60000).toISOString(), by: "coach", name: "Milan", text: "The body: The gut", suggest: { kind: "page", page: { part: "body", id: "gut", member: "gut", name: "The body: The gut" } } },
    ] }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, [seed, at.toISOString()]);
  await require("./adult.cjs")(page);
  // 1. the bar for everyone: five tabs, Explorer fifth; the menu without Explorer
  await page.goto(U + "/"); await page.waitForTimeout(1200);
  ok(await bar() === "Today,Plan,Plate,Recipes,Explorer", "the client's bar: Today, Plan, Plate, Recipes, Explorer: " + await bar());
  const hs = await page.locator(".bottom-nav button").evaluateAll((xs) => xs.map((x) => Math.round(x.getBoundingClientRect().height)));
  ok(hs.length === 5 && hs.every((h) => h >= 44), "five tabs, 44 px or more: " + hs.join(","));
  await page.getByRole("button", { name: "Menu" }).first().click(); await page.waitForTimeout(400);
  const rows = (await page.locator(".menu-list .menu-row").allTextContents()).map((t) => t.replace(/\s+/g, " ").trim());
  ok(rows.some((r) => /^Foods/.test(r)) && rows.some((r) => /^Me/.test(r)) && !rows.some((r) => /^Explorer/.test(r)) && !rows.some((r) => /^Admin/.test(r)), "the menu: Foods and Me stay, Explorer left, no Admin for a client");
  await page.getByRole("button", { name: "Close" }).first().click(); await page.waitForTimeout(300);
  // 2. the client's Today: the newest suggestion first (the page), Not now with a reason
  const card = page.locator(".suggest-card");
  ok(await card.count() === 1 && /A page: The body: The gut/.test(await text(card)) && /Milan suggests/.test(await text(card)), "a suggestion is a card on Today, newest first: " + (await text(card)).slice(0, 80));
  ok(await page.locator(".bottom-nav .badge").first().textContent() === "2", "the badge on Today counts the two suggestions");
  await card.getByRole("button", { name: "Not now" }).click(); await page.waitForTimeout(300);
  const chips = await page.locator(".suggest-reasons .choice").allTextContents();
  ok(chips.join("|") === "Not this week|Don't like it|Too much for me|Ask me at the check-in", "Not now: four reasons as chips, and a line");
  await page.locator(".suggest-reasons .choice").filter({ hasText: "Ask me at the check-in" }).click(); await page.waitForTimeout(400);
  let thread = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-coach")).notes);
  ok(thread[1].answer?.choice === "later" && thread[1].answer?.reason === "Ask me at the check-in" && thread[1].readAt, "the answer is on the thread: not now, ask me at the check-in");
  // 3. the snack suggestion: Accept lands it on Plan at 16:00 for this week; the Lifestyle default stays
  ok(/A planned snack at 16:00: Skyr and a fruit/.test(await text(card)), "the next suggestion: the snack");
  await card.getByRole("button", { name: "Accept" }).click(); await page.waitForTimeout(600);
  const planned = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-planned") || "{}"));
  const days = Object.keys(planned).filter((d) => planned[d].snack?.title === "Skyr and a fruit");
  ok(days.length === 7 && Object.values(planned).every((d) => !d.snack || d.snack.source === "coach"), "Accept: the snack is on Plan for seven days, source coach: " + days.length);
  const personal = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-personal")));
  ok(personal.lifestyle.meals === 4 && Object.values(personal.timesOn ?? {}).every((d) => d.snack === "16:00"), "the time is on each date; the Lifestyle default is untouched");
  thread = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-coach")).notes);
  ok(thread[0].answer?.choice === "accept" && await page.locator(".suggest-card").count() === 0, "accepted: the card goes; the answer is on the thread");
  // 4. the coach: the switch at the top of Today; My clients swaps the centre of the bar; the chosen client's Today with Suggest
  await page.goto(U + "/today?coachdemo"); await page.waitForTimeout(1200);
  const sw = page.getByRole("radiogroup", { name: "Which view" });
  ok(await sw.count() === 1 && (await sw.getByRole("radio", { name: "My day" }).getAttribute("aria-checked")) === "true" && await bar() === "Today,Plan,Plate,Recipes,Explorer", "the coach: My day, the same bar as everyone");
  await sw.getByRole("radio", { name: "My clients" }).click(); await page.waitForTimeout(800);
  ok(await bar() === "Today,Plan,Clients,Recipes,Explorer" && await text(page.locator("header h1")) === "My clients", "My clients: Plate becomes Clients; the title is My clients");
  await page.locator(".cw-row").first().click(); await page.waitForTimeout(600);
  const clientName = await text(page.locator(".cw-person b"));
  await page.locator(".bottom-nav button").filter({ hasText: "Today" }).click(); await page.waitForTimeout(600);
  ok(await text(page.locator("header h1")) === "My clients" && await text(page.locator(".cv-name")) === clientName && /Today, read-only/.test(await text(page.locator(".cv-head"))), "the client's Today: title My clients, the name under it, read-only");
  ok(await page.locator(".cv-suggest").count() === 1 && /A planned snack/.test(await text(page.locator(".cv-suggest"))) && /A page from Explorer/.test(await text(page.locator(".cv-suggest"))), "Suggest: a planned snack, a page from Explorer");
  await page.getByLabel("The snack").fill("Cottage cheese and a pear"); await page.getByRole("button", { name: "Suggest the snack" }).click(); await page.waitForTimeout(500);
  ok(/Cottage cheese and a pear/.test(await text(page.locator("main"))) && /waiting/.test(await text(page.locator("main"))), "the suggestion is listed as waiting");
  await page.locator(".bottom-nav button").filter({ hasText: "Plan" }).click(); await page.waitForTimeout(500);
  ok(/Plan, read-only/.test(await text(page.locator(".cv-head"))) && /never on the plan itself/.test(await text(page.locator("main"))), "the client's Plan, read-only");
  await page.locator(".bottom-nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(500);
  ok(/Recipes, read-only/.test(await text(page.locator(".cv-head"))), "the client's Recipes, read-only");
  // back to My day: Plate is back, Today is the coach's own
  await page.locator(".bottom-nav button").filter({ hasText: "Today" }).click(); await page.waitForTimeout(400);
  await sw.getByRole("radio", { name: "My day" }).click(); await page.waitForTimeout(600);
  ok(await bar() === "Today,Plan,Plate,Recipes,Explorer" && await page.locator(".cv-head").count() === 0 && await text(page.locator("header h1")) === "Today", "My day again: Plate is back, the coach's own Today");
  // 5. the superadmin: Admin in the menu (the example coach is one)
  await page.getByRole("button", { name: "Menu" }).first().click(); await page.waitForTimeout(400);
  await page.getByRole("button", { name: /^Admin/ }).click(); await page.waitForTimeout(400);
  ok(/People and roles/.test(await text(page.locator("main"))) && /The privacy tracker/.test(await text(page.locator("main"))), "Admin: people and roles, the privacy tracker, the walkthroughs");
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} failed` : "all ok"); process.exit(fails.length ? 1 : 0);
})();
