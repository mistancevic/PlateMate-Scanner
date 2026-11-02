// DT218 and DT219 (0.3.58, board Stories164; Coach Milan 2 November 17:53, Go 18:19). After eating, the strip has a ✕ that ends
// the cook without the last answer; the meal's card keeps everything. A photo read that finds no foods leaves the Plate as it
// was, the photo not kept: Chef Mealan says so, with Take it again and Add the foods myself. Empty plate shows whenever the
// Plate has foods or a photo. The read is a stand-in (no AI here).
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
const PORT = "3391", U = `http://127.0.0.1:${PORT}`;
const skyr = seed.foods.find((f) => f.id === "f-skyr");
const card = { id: "fb-1", meal: { id: "m-x", title: "Vanilla protein crepes", items: [{ id: "i1", grams: 150, locked: false, food: skyr }], portion: 150, savedAt: "2026-11-02T11:58:00" }, status: "eaten", taste: "", notes: "", createdAt: "2026-11-02T11:58:00" };
const cook = { id: "c-1", startedAt: "2026-11-02T11:20:00", title: "Vanilla protein crepes", stage: "carry", cardId: "fb-1", eatenAt: "2026-11-02T11:58:00", plate: {}, ui: {}, inView: false, steps: 4 };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (s, at = "/") => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 1, permissions: ["camera"] });
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.install({ time: new Date("2026-11-02T12:00:00") });
    await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan", "Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3, window: { from: "07:00", to: "21:00" } } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
    }, s);
    await require("./adult.cjs")(page);
    await page.route("**/api/plate-photo", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ dish: "", foods: [], unsure: null }) }));
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await page.route("**/api/members/foods**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, foods: [] }) }));
    await page.goto(U + at); await page.waitForTimeout(1300);
    return { ctx, page };
  };
  const store = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  try {
    // ---- DT218: the ✕ ends the cook without the last answer ----
    let { ctx, page } = await open({ ...seed, feedback: [card], cook });
    ok(/Eaten 11:58 · Vanilla protein crepes/.test(await page.locator(".cook-strip").textContent()) && await page.locator(".cook-strip .cs-end").count() === 1, "after eating: the strip with its ✕");
    await page.locator(".cook-strip .cs-end").click(); await page.waitForTimeout(500);
    let st = await store(page);
    ok(!st.cook && st.feedback.length === 1 && st.feedback[0].id === "fb-1" && !st.feedback[0].carry && await page.locator(".cook-strip").count() === 0, "✕: the cook ends without the last answer; the meal's card stays");
    await ctx.close();
    // ---- DT219: a read with no foods leaves the Plate as it was ----
    ({ ctx, page } = await open({ ...seed, items: [{ id: "i-s", grams: 150, locked: false, food: skyr }] }, "/plate"));
    await page.locator(".mp-button").click(); await page.waitForTimeout(1500);
    await page.locator("#camera-shutter-button").click(); await page.waitForTimeout(2200);
    st = await store(page);
    const none = page.locator(".mp-none");
    ok(await page.locator(".camera-ui").count() === 0 && st.items.length === 1 && st.items[0].id === "i-s" && !st.photo, "no foods read: the Plate stays as it was; the photo is not kept");
    ok(/I could not find foods on this photo\. Take it again, from above with the whole plate in, or add the foods yourself\./.test(await none.textContent()) && /Your plate stays as it was; the photo is not kept\./.test(await none.textContent()), "Chef Mealan says so in one line");
    await none.getByRole("button", { name: "Take it again" }).click(); await page.waitForTimeout(1200);
    ok(await page.locator(".camera-ui").count() === 1 && await page.locator(".mp-none").count() === 0, "Take it again opens the meal camera");
    await page.locator("#camera-shutter-button").click(); await page.waitForTimeout(2200);
    await page.locator(".mp-none").getByRole("button", { name: "Add the foods myself" }).click(); await page.waitForTimeout(600);
    ok(await page.locator(".mp-none").count() === 0 && await page.evaluate(() => document.activeElement?.getAttribute("aria-label")) === "Search all my foods", "Add the foods myself: the line goes, the food search is ready");
    await ctx.close();
    // ---- DT219: Empty plate whenever the Plate has a photo ----
    ({ ctx, page } = await open({ ...seed, items: [], photo: { image: "data:image/jpeg;base64,/9j/4AAQ", at: "2026-11-02T11:50:00" } }, "/plate"));
    ok(await page.locator(".plate-empty-link").count() === 1, "a photo and no foods: Empty plate is there");
    await page.locator(".plate-empty-link").click(); await page.locator(".plate-empty-link").click(); await page.waitForTimeout(500);
    st = await store(page);
    ok(!st.photo && await page.locator(".mp-line").count() === 0, "Empty plate takes the photo away");
    await ctx.close();
    ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.join(" | ") : ""}`);
  } catch (e) { ok(false, "walkthrough crashed: " + (e && e.message)); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} failed` : "all ok");
  process.exit(fail ? 1 : 0);
})();
