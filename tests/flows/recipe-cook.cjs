// JOURNEY INVARIANT (Milan, 8 October 2026, canvas boards RG0, RG1, RG3 and RG5): Cook is a permission, not a role. A
// client publishes only when their coach made them a cook, and what they send waits for their coach: the coach sees the
// page, then makes it live or sends it back with a note the cook sees. Changes to a cook's live recipe wait the same way,
// and the live page stays as it was until then. The cook can take their own recipe down. Never rewrite these lines to fit
// a change.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
const jpg = "data:image/jpeg;base64," + fs.readFileSync(path.resolve(__dirname, "front.jpg")).toString("base64");
const food = (id, name, calories, protein, carbs, fats, fiber) => ({ ...seed.foods[0], id, name, brand: "", calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined, icon: "🥣" });
const items = [[200, food("pf", "Protein flour", 357, 21, 59, 2.4, 5)], [500, food("pm", "Protein milk", 51, 7.5, 5, 0.1, 0)], [180, food("eg", "Eggs", 143, 12.6, 0.7, 9.5, 0)], [50, food("ms", "Mascarpone", 379, 3.4, 3.4, 39, 0)]].map(([g, f], i) => ({ id: "i" + i, grams: g, locked: false, food: f }));
seed.items = [];
seed.meals = [{ id: "m-crepes", title: "High protein crepes", items, portion: 930, savedAt: "2026-10-07T10:00:00Z" }];
seed.feedback = [{ id: "fb1", meal: seed.meals[0], status: "eaten", taste: "DaaM good", notes: "", createdAt: "2026-10-07T12:00:00Z", photo: jpg }];
const dl = process.argv[2] || null;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3192", GEMINI_API_KEY: "" }, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  await page.addInitScript((s) => { if (!sessionStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); sessionStorage.setItem("seeded", "1"); } localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); }, seed);
  try {
    await require("./adult.cjs")(page);
    const B = "http://127.0.0.1:3192";
    await page.goto(B + "/"); await page.waitForTimeout(900);
    const myRecipes = async () => { await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(500); };
    const api = (url, init = {}) => page.evaluate(async ([u, i]) => { const r = await fetch(u, i); let d = null; try { d = await r.json(); } catch {} return { status: r.status, d }; }, [url, init]);
    const asCoach = (url, body) => api(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    await myRecipes();
    ok(await page.getByRole("button", { name: "Publish", exact: true }).count() === 0, "a client who isn't a cook has no Publish");
    ok((await asCoach("/api/cooks", { uid: "local-client", on: true })).status === 200, "their coach makes them a cook");
    await page.reload(); await page.waitForTimeout(900); await myRecipes();
    await page.getByRole("button", { name: "Publish", exact: true }).click(); await page.waitForTimeout(400);
    const sheet = page.locator(".publish-sheet");
    await sheet.getByLabel("Two lines about it").fill("Thin and soft.");
    await sheet.locator(".makes input").first().fill("12"); await sheet.getByLabel("What one serving is called").fill("crepe");
    const send = sheet.getByRole("button", { name: /^Send to / });
    ok(await send.count() === 1, "a cook's button says Send to their coach: " + (await send.textContent()));
    await send.click(); await page.waitForTimeout(1200);
    ok(/Waiting for/.test(await sheet.locator(".pub-state").textContent()) && await sheet.getByRole("button", { name: /^Waiting for/ }).isDisabled(), "sent: Waiting for the coach, and it can't be sent again while it waits");
    ok((await api("/api/recipes/high-protein-crepes")).status === 404 && (await api("/api/recipes")).d.recipes.length === 0, "nothing is on the site while it waits");
    let w = await api("/api/waiting");
    ok(w.d.recipes.length === 1 && w.d.recipes[0].title === "High protein crepes" && w.d.recipes[0].photo, "it waits for the coach, with its photo to see the page");
    ok((await asCoach("/api/waiting/high-protein-crepes", { action: "back", note: "The photo is too dark. Try daylight." })).status === 200, "the coach sends it back with a note");
    await sheet.getByRole("button", { name: "Close" }).click(); await page.reload(); await page.waitForTimeout(900); await myRecipes();
    const row = page.locator(".recipe-tile").filter({ hasText: "High protein crepes" });
    ok(/Sent back/.test(await row.locator(".pub-state").textContent()) && /too dark/.test(await row.textContent()), "the cook sees Sent back, and the note");
    await row.getByRole("button", { name: "Continue" }).click(); await page.waitForTimeout(400);
    await sheet.getByRole("button", { name: /^Send to / }).click(); await page.waitForTimeout(1200);
    ok((await asCoach("/api/waiting/high-protein-crepes", { action: "live" })).status === 200 && (await api("/api/recipes/high-protein-crepes")).status === 200, "sent again; the coach makes it live");
    await sheet.getByRole("button", { name: "Close" }).click(); await page.reload(); await page.waitForTimeout(900); await myRecipes();
    ok(/Live/.test(await row.locator(".pub-state").textContent()), "My recipes: Live");
    // a change to a live recipe waits; the page stays as it was
    await row.getByRole("button", { name: "Change it" }).click(); await page.waitForTimeout(400);
    await sheet.getByLabel("Two lines about it").fill("Thin, soft, and they roll without breaking.");
    await sheet.getByRole("button", { name: /^Send to / }).click(); await page.waitForTimeout(1200);
    ok((await api("/api/recipes/high-protein-crepes")).d.recipe.lines === "Thin and soft.", "while the change waits, the live page stays as it was");
    w = await api("/api/waiting");
    ok(w.d.recipes.length === 1 && w.d.recipes[0].change && w.d.recipes[0].lines === "Thin, soft, and they roll without breaking.", "the coach sees the change");
    await asCoach("/api/waiting/high-protein-crepes", { action: "live" });
    ok((await api("/api/recipes/high-protein-crepes")).d.recipe.lines === "Thin, soft, and they roll without breaking.", "made live: the page has the change");
    // the cook takes it down
    await sheet.getByRole("button", { name: "Close" }).click(); await page.reload(); await page.waitForTimeout(900); await myRecipes();
    await row.getByRole("button", { name: "Change it" }).click(); await page.waitForTimeout(400);
    await sheet.getByRole("button", { name: /Unpublish/ }).click(); await page.waitForTimeout(800);
    ok((await api("/api/recipes/high-protein-crepes")).status === 410, "the cook can take their own recipe down");
    // no longer a cook
    await asCoach("/api/cooks", { uid: "local-client", on: false });
    const again = await page.evaluate(async () => (await fetch("/api/recipes", { method: "POST", headers: { "Content-Type": "application/json", "x-local-as": "client" }, body: JSON.stringify({ recipe: { title: "Oats", items: [{ name: "Oats", grams: 50 }], steps: [] } }) })).status);
    ok(again === 403, "once the coach switches Cook off, nothing more can be sent");
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
