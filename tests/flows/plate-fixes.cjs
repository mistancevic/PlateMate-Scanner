// DT240 to DT246 (0.3.96, board Stories182; Coach Milan 6 November 10:14 to 10:39, Go 12:24): his test of the Plate.
// DT240: a cook still open asks once when a new plate comes in: Go on with it, or End it; the strip waits for the answer.
// DT241: a finished dish read from a photo is never cooked: no Prepare it.
// DT242: an answer lost on the way is read again once by itself; then one card, the photo kept, Try again. Never Failed to fetch.
// DT244: in Srpski the foods the AI reads are named in Srpski; the English stays as the food's other name.
// DT245: Fit on a plate that already fills its meal says so first; Ideas anyway asks for small additions; an idea that does
// not fit gets Put it on the plate.
// DT246: a plate already recorded says where it went, and a change on the Plate goes to that meal too.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../.."), PORT = "3401", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(path.join(__dirname, "seed.json"), "utf8")); seed.feedback = []; seed.meals = []; seed.items = [];
seed.goals = { ...seed.goals, calories: 2750, protein: 180, fats: 90, carbs: 300 };
const F = (id, name, calories, protein, fats, carbs) => ({ ...seed.foods[0], id, name, brand: "", source: "estimate", calories, protein, fats, carbs, fiber: 0, photo: undefined, photos: undefined, icon: undefined, barcode: undefined });
const TAVA = [[180, "Chicken breast, cooked", 165, 31, 3.6, 0], [160, "Cream sauce, savory", 150, 2.5, 13, 6], [60, "Mushrooms and vegetables, braised", 45, 2, 2.5, 4], [25, "Roasted red pepper", 30, 1, 0.3, 6], [35, "Sour cream", 193, 2.4, 19, 3.6]];
const READ = { dish: "Balkan Baked Tava", foods: TAVA.map(([g, name, calories, protein, fats, carbs]) => ({ name, grams: g, low: Math.round(g * 0.8), high: Math.round(g * 1.25), calories, protein, fats, carbs, fiber: 0, confidence: "medium" })), unsure: null };
const READ_SR = { ...READ, dishLocal: "Balkanska tava", foods: READ.foods.map((f, k) => ({ ...f, local: ["Pileća prsa, kuvana", "Krem sos", "Pečurke i povrće, dinstano", "Pečena crvena paprika", "Kisela pavlaka"][k] })) };
const MEAL = { options: [
  { kitchen: "Balkan", title: "Creamy chicken with roasted potatoes", why: "Potatoes next to it.", for_cooking: [], adds: [{ name: "Potatoes, raw", grams: 300, calories: 77, protein: 2, fats: 0.1, carbs: 17, base: true }] },
  { kitchen: "Italian", title: "Chicken penne with peas", why: "Penne through the sauce.", for_cooking: [], adds: [{ name: "Penne, dry", grams: 120, calories: 359, protein: 12.5, fats: 1.5, carbs: 71, base: true }] },
] };
const day = (h, m) => new Date(2026, 10, 6, h, m).toISOString();
const PHOTO = "data:image/jpeg;base64," + fs.readFileSync(path.join(__dirname, "plate.jpg")).toString("base64");
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"], ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}) });
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (state, { lang = null, clock = day(18, 10), read = READ } = {}) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: "en-GB", timezoneId: "Europe/Berlin", permissions: ["camera"] });
    const p = await ctx.newPage(); p.on("pageerror", (e) => errs.push(e.message)); await p.clock.setFixedTime(new Date(clock));
    await p.addInitScript(({ s, lang }) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
      if (lang) localStorage.setItem("chefmealan-lang", lang);
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan", "Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, { s: state, lang });
    await require("./adult.cjs")(p);
    for (const r of ["cover", "dish", "members/foods**"]) await p.route(`**/api/${r}`, (x) => x.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    p.mealAsked = [];
    await p.route("**/api/meal", (r) => { p.mealAsked.push(JSON.parse(r.request().postData() || "{}")); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MEAL) }); });
    p.reads = 0; p.lose = 0;
    await p.route("**/api/plate-photo", (r) => { p.reads++; if (p.lose > 0) { p.lose--; return r.abort("failed"); } r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(read) }); });
    await p.goto(U + "/plate"); await p.waitForTimeout(1600);
    if (/could not be read/.test(await p.locator("body").innerText())) throw new Error("the seed is not a valid state");
    return p;
  };
  const photo = async (p) => { await p.locator(".mp-button").first().click(); await p.waitForTimeout(1500); await p.locator("#camera-shutter-button").click(); await p.waitForTimeout(400); if (await p.locator(".cam-analyze").count()) await p.locator(".cam-analyze").click(); await p.waitForTimeout(2500); };
  const saved = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1") || "{}"));
  const main = (p) => p.locator("main").innerText();
  try {
    // DT242: the answer lost twice: the card, the photo kept; Try again reads it
    let p = await open(seed); p.lose = 2; await photo(p);
    ok(p.reads === 2, `the photo was read again once by itself (${p.reads} reads)`);
    ok(await p.getByText("The connection was lost. Your photo is kept.").count() === 1, "one card: the connection was lost, the photo is kept");
    ok(!/failed to fetch/i.test(await p.locator("body").innerText()), "never Failed to fetch");
    await p.getByRole("button", { name: "Try again" }).click(); await p.waitForTimeout(2500);
    ok(/Chicken breast/.test(await main(p)) && await p.locator(".mp-lost").count() === 0, "Try again: the foods are on the Plate, the card is gone");
    // DT241: a finished dish from a photo: no Prepare it, Fit stays
    const ways = await p.locator(".ways-out button").allInnerTexts();
    ok(!ways.some((t) => /Prepare/.test(t)) && ways.some((t) => /Fit to my target/.test(t)), "a finished dish from a photo has no Prepare it: " + ways.join(" · "));
    await p.context().close();

    // DT240: a cook still open asks once when the photo's plate comes in
    const cook = { id: "ck1", startedAt: day(16, 0), title: "Test", stage: "make", plate: { items: [], title: "Test" }, ui: { ticks: ["s0"] }, steps: 2 };
    p = await open({ ...seed, cook }); await photo(p);
    ok(await p.locator(".cook-open-ask").count() === 1 && /You were cooking Test, step 2 of 2\. A new plate came in\. Go on with Test, or end it\?/.test(await p.locator(".cook-open-ask").innerText()), "Chef Mealan asks once: Go on with Test, or end it");
    ok(await p.locator(".cook-strip").count() === 0, "the strip waits for the answer");
    await p.locator(".cook-open-ask").getByRole("button", { name: "End it" }).click(); await p.waitForTimeout(800);
    ok(await p.locator(".cook-open-ask").count() === 0 && await p.locator(".cook-strip").count() === 0 && !(await saved(p)).cook, "End it: the cook ends, no strip");
    ok(/Chicken breast/.test(await main(p)), "the new plate stays as it is");
    await p.context().close();

    // 0.3.121 (Coach Milan 10 November): the same photo read again is no new plate. With a cook still open it does not ask
    // about the cook again, and an Exploring plate that was on the Plate before Served came is not kept as Served by it
    const old = { ...seed, cook, items: TAVA.slice(0, 2).map(([g, name, calories, protein, fats, carbs], k) => ({ id: "o" + k, grams: g, locked: false, fromPhoto: true, est: { low: Math.round(g * 0.8), high: Math.round(g * 1.25) }, food: F("of" + k, name, calories, protein, fats, carbs) })),
      title: "Sweet egg white pancake", photo: { image: PHOTO, at: day(18, 5), who: "idea", unsure: null, which: null }, pick: "exploring", plateAt: day(18, 5) };
    p = await open(old);
    await p.goto(U + "/plate"); await p.waitForTimeout(1200);
    ok(await p.locator(".cook-open-ask").count() === 0 && await p.locator(".cook-strip").count() === 1 && await p.locator(".sv-plate").count() === 0, "an Exploring plate from before, a cook open: the strip shows, no question, no Served block");
    await p.locator(".mp-again-link").click(); await p.waitForTimeout(300);
    await p.locator(".mp-help").getByLabel("Tell Chef Mealan what it is").fill("egg whites with hazelnut cream and cocoa");
    await p.locator(".mp-help .pill-primary").click(); await p.waitForTimeout(2000);
    const reread = await saved(p);
    ok(/Chicken breast/.test(await main(p)) && reread.items.length === 5, "Read it again replaces the foods with the new read");
    ok(await p.locator(".cook-open-ask").count() === 0 && await p.locator(".cook-strip").count() === 1 && !!reread.cook, "reading the same photo again does not ask about the open cook; the strip stays");
    ok(!(reread.served || []).length && !reread.photo?.served && await p.locator(".sv-plate").count() === 0, "and it is not kept as Served: it was on the Plate before Served came");
    await p.context().close();
    p = await open({ ...seed, cook }); await photo(p);
    await p.locator(".cook-open-ask").getByRole("button", { name: "Go on with Test" }).click(); await p.waitForTimeout(800);
    ok(await p.locator(".cook-open-ask").count() === 0 && (await saved(p)).cook?.inView === true, "Go on with Test opens the cook");
    await p.context().close();

    // DT245: breakfast and lunch eaten, so the dinner is about 680 kcal (612 to 748) and the tava (639) already fills it
    const ate = (id, at, slot, kcal) => ({ id, meal: { id: "m" + id, title: slot.name, items: [{ id: "i" + id, food: F("f" + id, "Meal " + id, 100, 8, 3, 10), grams: kcal, locked: false }], portion: kcal, savedAt: at }, status: "eaten", taste: "", notes: "", createdAt: at, slot });
    const fed = [ate("b", day(8, 0), { date: "2026-11-06", slotId: "breakfast", name: "Breakfast", time: "07:30" }, 1035), ate("l", day(13, 0), { date: "2026-11-06", slotId: "lunch", name: "Lunch", time: "13:45" }, 1035)];
    p = await open({ ...seed, feedback: fed }); await photo(p);
    await p.locator(".ways-out button").filter({ hasText: "Fit to my target" }).click(); await p.waitForTimeout(800);
    const fills = p.locator(".fills-ask");
    ok(await fills.count() === 1 && /Your plate already fills this dinner: 639 kcal, in its range\./.test(await fills.innerText()), "Fit says first that the plate fills the dinner: " + (await fills.count() ? (await fills.innerText()).replace(/\s+/g, " ") : "none"));
    ok(await fills.getByRole("button", { name: "Ate it" }).count() === 1 && await fills.getByRole("button", { name: "Save for later" }).count() === 1 && await fills.getByRole("button", { name: "Ideas anyway ›" }).count() === 1, "I ate it, Save for later, Ideas anyway");
    ok(p.mealAsked.length === 0, "no ideas asked for yet");
    await fills.getByRole("button", { name: "Ideas anyway ›" }).click(); await p.waitForTimeout(2500);
    ok(p.mealAsked.length >= 1 && p.mealAsked.every((x) => x.small === true), "Ideas anyway asks for small additions");
    ok(await p.getByText("You asked for ideas anyway. Chef Mealan looked for small additions, a salad or vegetables.").count() === 1, "the ideas say so");
    const miss = p.locator(".mm-fail");
    ok(await miss.count() >= 1 && await miss.first().getByRole("button", { name: "Put it on the plate" }).count() === 1, `an idea that does not fit gets Put it on the plate (${await miss.count()})`);
    await miss.first().getByRole("button", { name: "Put it on the plate" }).click(); await p.waitForTimeout(1200);
    ok(/Potatoes|Penne/.test(await main(p)), "you decide: it is on the plate");
    await p.context().close();

    // DT246: the plate back on the Plate with the photo it was recorded with: the line, and a change goes there too
    const rows = READ.foods.map((f, k) => ({ id: "r" + k, food: F("t" + k, f.name, f.calories, f.protein, f.fats, f.carbs), grams: f.grams, locked: false }));
    const card = { id: "card1", meal: { id: "mt", title: "Balkan Baked Tava", items: rows, portion: 460, savedAt: day(17, 20) }, status: "eaten", taste: "", notes: "", createdAt: day(17, 20), slot: { date: "2026-11-06", slotId: "dinner", name: "Dinner", time: "20:00" }, photo: PHOTO, photos: [PHOTO] };
    p = await open({ ...seed, feedback: [card], items: rows.map((r) => ({ ...r, est: { low: r.grams * 0.8, high: r.grams * 1.25 }, fromPhoto: true })), title: "Balkan Baked Tava", photo: { image: PHOTO, at: day(17, 20), who: "ate" }, plateAt: day(17, 20) }, { clock: day(18, 30) });
    const line = p.locator(".recorded-line");
    ok(await line.count() === 1 && /Recorded: today, dinner, 17:20\. Your changes here go there too\./i.test(await line.innerText()), "the line says where it went: " + (await line.count() ? await line.innerText() : "none"));
    ok(await p.locator(".mp-say").count() === 0, "no second Ate it for a plate already recorded");
    await p.locator(".grams input").first().fill("250"); await p.locator(".grams input").first().press("Enter"); await p.waitForTimeout(1200);
    const after = (await saved(p)).feedback.find((f) => f.id === "card1");
    ok(after && after.meal.items.find((i) => i.id === "r0")?.grams === 250, "the change is in the dinner too: " + (after ? after.meal.items.map((i) => i.grams).join(", ") : "no card"));
    ok((await saved(p)).feedback.length === 1, "still one meal, not two");
    await p.context().close();

    // DT244: in Srpski the foods are named in Srpski, the English kept as each food's other name
    p = await open(seed, { lang: "sr-Latn", read: READ_SR }); await photo(p);
    const s = await saved(p);
    ok(/Krem sos/.test(await main(p)) && !/Cream sauce/.test(await main(p)), "the foods on the Plate are in Srpski");
    const cs = s.items.find((i) => i.food.name === "Krem sos");
    ok(cs && (cs.food.aliases || []).includes("Cream sauce, savory"), "the English stays as its other name");
    ok(s.title === "Balkanska tava", "the dish's name in Srpski: " + s.title);
    await p.context().close();
  } finally { await b.close(); server.kill(); }
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  if (fail) { console.log(`${fail} failed`); process.exit(1); }
  console.log("all passed");
})();
