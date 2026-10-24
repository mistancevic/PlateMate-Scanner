// JOURNEY (0.2.61, board MB; Milan 16:46 to 17:11): one name per cook in Members, checked by the server; a cook's kitchen;
// the Recipes tab and the cook in the address, so a reload keeps them; sharing with your name asks for it once.
const { chromium } = require("playwright");
const path = require("node:path"); const S = { MAIN: path.resolve(__dirname, "../..") };
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(S.MAIN + "/tests/flows/seed.json", "utf8"));
const F = (re) => seed.foods.find((f) => re.test(f.name));
const meal = (id, title, parts, n, from) => { const items = parts.map(([f, g], k) => ({ id: `${id}${k}`, food: F(f), grams: g, locked: true })); const w = items.reduce((s, i) => s + i.grams, 0); return { id, title, items, portion: Math.round(w / n), savedAt: "2026-10-12T10:00:00Z", ...(from ? { from } : {}) }; };
const crepes = meal("m1", "DaaM good protein crêpes", [[/^Eggs/, 240], [/^Milk/, 500], [/^Oats/, 120], [/^Whey/, 60]], 4);
const pudding = meal("m2", "Chocolate quark pudding", [[/^Quark/, 250], [/^Whey/, 25], [/^Nutella/, 15], [/^Milk/, 50]], 1, "coach");
const sarma = meal("m3", "Sarma", [[/chicken/i, 800], [/^Rice/, 1200], [/^Oats/, 200]], 8);
seed.items = []; seed.meals = [crepes, sarma, pudding]; seed.feedback = [];
seed.goals = { ...seed.goals, calories: 2800, protein: 180, fats: 93, carbs: 300 };
const planned = (m, source) => { const w = m.items.reduce((s, i) => s + i.grams, 0), r = Math.min(1, m.portion / w); const k = m.items.reduce((s, i) => s + (i.food.calories * i.grams) / 100, 0) * r, p = m.items.reduce((s, i) => s + (i.food.protein * i.grams) / 100, 0) * r; return { title: m.title, kcal: Math.round(k), protein: Math.round(p), source, mealId: m.id, items: m.items, portion: m.portion }; };
const starter = { title: "Chicken, rice and greens", kcal: 640, protein: 52, source: "starter" };
const PLAN = {};
["20", "21", "22", "23", "24", "25", "26"].forEach((d, i) => { PLAN[`2026-10-${d}`] = { breakfast: planned(crepes, "mine"), lunch: i % 2 ? planned(sarma, "mine") : planned(pudding, "coach"), ...(i === 1 ? { dinner: starter } : {}) }; });
const PORT = 3246, U = `http://127.0.0.1:${PORT}`;
const it = (name, grams, calories, protein, fats, carbs) => ({ id: name.slice(0, 6) + grams, grams, food: { name, brand: "", calories, protein, fats, carbs, fiber: 0, readyToEat: true } });
const R = {
  souvla: { title: "Chicken souvlaki with talattouri", kitchen: "Mediterranean", steps: ["Grill the chicken.", "Serve with talattouri and pitta."], items: [it("Chicken breast, raw", 600, 120, 22.5, 2.6, 0), it("Talattouri", 300, 90, 4, 6, 4.7), it("Pitta bread", 240, 275, 9.1, 1.2, 53.5)] },
  koupepia: { title: "Koupepia, Tester3's mother's way", kitchen: "Mediterranean", steps: ["Roll the vine leaves.", "Simmer 45 minutes."], items: [it("Beef mince, raw", 500, 215, 18.6, 15, 0), it("Rice, raw", 200, 360, 6.6, 0.6, 79), it("Vine leaves", 150, 93, 5.6, 2.1, 6.3)] },
  stir: { title: "Davorka's chicken stir fry", kitchen: "Asian", steps: ["Fry hot and fast."], items: [it("Chicken breast, raw", 400, 120, 22.5, 2.6, 0), it("Rice, cooked", 400, 130, 2.7, 0.3, 28)] },
  oats: { title: "Overnight oats with skyr", kitchen: null, steps: ["Mix and leave overnight."], items: [it("Oats", 60, 372, 13.5, 7, 58.7), it("Skyr, natural", 200, 63, 11, 0.2, 4)] },
};
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: S.MAIN, env: { ...process.env, NODE_ENV: "production", PORT: String(PORT), GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const page = await b.newPage({ viewport: { width: 390, height: 1400 } });
  await page.clock.setFixedTime(new Date("2026-10-20T14:00:00Z"));
  await page.addInitScript(([s, plan]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-12T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Mediterranean", "Asian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-05T08:00:00Z", consentBodyAt: "2026-10-05T08:00:00Z", declaredAt: "2026-10-05T08:00:00Z" }));
    localStorage.setItem("chefmealan-planned", JSON.stringify(plan));
    localStorage.setItem("seeded", "1"); }, [seed, PLAN]);
  await require("./adult.cjs")(page);
  await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  await page.goto(U + "/my-recipes"); await page.waitForTimeout(1200);
  // the server allows 30 calls a minute from one address; this walkthrough makes more, so a 429 waits and asks again
  const call = async (path, who, body) => { for (let i = 0; i < 20; i++) { const r = await page.evaluate(async ([path, who, body]) => { const r = await fetch(path, { method: body ? "POST" : "GET", headers: { "Content-Type": "application/json", ...(who ? { "x-local-as": who } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }); return [r.status, await r.json()]; }, [path, who, body]); if (r[0] !== 429) return r; await new Promise((z) => setTimeout(z, 4000)); } return [429, {}]; };
  // MB: one name per cook, checked by the server
  ok((await call("/api/members/name", "testerthree", { name: "Tester3" }))[0] === 200, "MB: Tester3 takes his name");
  const [, taken] = await call("/api/members/name?check=tester3");
  ok(taken.ok === false && /taken/.test(taken.why), "MB: tester3 is taken, whatever the capitals");
  ok((await call("/api/members/name?check=Mi"))[1].ok === false && (await call("/api/members/name", null, { name: "Mi lan" }))[0] === 400, "MB: too short or with a space is refused");
  await call("/api/members", "testerthree", { recipe: R.souvla, cover: null, coverKind: "drawn", named: true });
  await call("/api/members", "testerthree", { recipe: R.koupepia, cover: null, coverKind: "drawn", named: true });
  await call("/api/members", "davorka", { recipe: R.stir, cover: null, coverKind: "drawn", named: true, name: "Davorka Bokic" });
  await call("/api/members", "member", { recipe: R.oats, cover: null, coverKind: "drawn", named: false });
  const list = (await call("/api/members"))[1].recipes;
  ok(list.find((r) => r.title === R.stir.title).name === "Davorka" && list.find((r) => r.title === R.oats.title).name === "" && !JSON.stringify(list).includes("local-"), "MB: an earlier first name share gets that name; no name stays no name; who holds it never leaves the server");
  // the tab and the cook in the address
  await page.getByRole("tab", { name: "Members" }).click(); await page.waitForTimeout(900);
  ok(/\/my-recipes\?view=members$/.test(page.url()), "MB: Members is in the address: " + page.url());
  await page.reload(); await page.waitForTimeout(1500);
  ok(await page.getByRole("tab", { name: "Members" }).getAttribute("aria-selected") === "true", "MB: a reload stays on Members");
  // Changed by story MB5 (0.2.67, Milan 22:14): Cook is the publishing permission on Clients, so Members says member
  const cooks = await page.getByRole("group", { name: "Members" }).getByRole("button").allTextContents();
  ok(cooks.join(",") === "All members,Tester3,Davorka", "MB: the members who shared with their name, most recipes first: " + cooks.join(","));
  await page.getByRole("group", { name: "Members" }).getByRole("button", { name: "Tester3" }).click(); await page.waitForTimeout(500);
  ok(/view=members&member=Tester3$/.test(page.url()) && /Tester3's recipes · 2/.test(await page.locator(".mb-shelf").textContent()) && await page.locator(".recipe-tile").count() === 2, "MB: Tester3's recipes, his two");
  await page.reload(); await page.waitForTimeout(1500);
  ok(await page.locator(".recipe-tile").count() === 2 && await page.locator(".mb-shelf").count() === 1, "MB: a reload keeps Tester3's recipes");
  await page.getByRole("group", { name: "Members" }).getByRole("button", { name: "All members" }).click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: `Open ${R.koupepia.title}` }).click(); await page.waitForTimeout(700);
  await page.getByRole("button", { name: "All of Tester3's recipes ›" }).click(); await page.waitForTimeout(600);
  ok(await page.locator(".recipe-tile").count() === 2 && /member=Tester3/.test(page.url()), "MB: All of Tester3's recipes › opens his recipes");
  // sharing with my name: asked once, checked
  await page.getByRole("tab", { name: /^Mine/ }).click(); await page.waitForTimeout(400);
  await page.locator(".recipe-tile").first().click(); await page.waitForTimeout(900);
  await page.locator(".mb-share .mb-switch").click(); await page.waitForTimeout(300);
  await page.getByLabel("Your name in Members").fill("tester3"); await page.waitForTimeout(900);
  ok(/tester3 is taken/.test(await page.locator(".mb-share").textContent()) && await page.getByRole("button", { name: "Share with members" }).isDisabled(), "MB: a taken name says so, and Share waits");
  await page.getByLabel("Your name in Members").fill("Milan"); await page.waitForTimeout(900);
  ok(/Milan is free/.test(await page.locator(".mb-share").textContent()), "MB: Milan is free");
  await page.getByRole("button", { name: "Share with members" }).click(); await page.waitForTimeout(900);
  let mine = (await call("/api/members"))[1].recipes.filter((r) => r.mine);
  ok(mine.length === 1 && mine[0].name === "Milan" && (await call("/api/members/name"))[1].name === "Milan", "MB: shared as Milan; the name is mine");
  ok(/Members see it since .* as Milan/.test(await page.locator(".mb-share").textContent()), "MB: For members says the name");
  // a new name reaches every named recipe; the old one is free again; nobody takes mine
  await call("/api/members/name", null, { name: "Milan.S" });
  mine = (await call("/api/members"))[1].recipes.filter((r) => r.mine);
  ok(mine[0].name === "Milan.S" && (await call("/api/members/name?check=Milan", "testerthree"))[1].ok === true && (await call("/api/members/name", "testerthree", { name: "milan.s" }))[0] === 409, "MB: a new name reaches my recipe; Milan is free again; Tester3 can't take Milan.S");
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
