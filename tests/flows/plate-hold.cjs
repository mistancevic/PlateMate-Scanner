// Story DT309 (0.3.153, board Stories239; Coach Milan 17 November 2026, 09:25 to 14:06, Go 14:12): a long press on Plate in the
// bottom bar opens a small menu above the icon, not the camera: Group, Barcode, Label, Meal, from left to right, and an X.
// A tap on a mode opens the camera in that mode, as the Plate's camera. The X, or a tap outside, closes the menu and nothing
// else happens. A short tap on Plate still opens the Plate. The camera's own row of modes has the same order. The Plate icon
// is a plate that is also a shutter, between a fork and a knife. Closing the camera without a photo brings you back to
// where you held the button.
// HOWTO: scanAnywhere. DT329 (0.3.166, board DT329): How to's Scan a pack from any screen teaches this long press.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
seed.goals = { ...seed.goals, calories: 2750, protein: 180, fats: 90, carbs: 300 };
const PORT = "3534", U = `http://127.0.0.1:${PORT}`;
const PLATE = fs.readFileSync(path.join(ROOT, "tests/flows/plate.jpg"));
// the plate photo with an EXIF block: DateTimeOriginal, as a phone's camera writes it
const withExif = (when) => {
  const le = (n, b) => { const x = Buffer.alloc(b); b === 2 ? x.writeUInt16LE(n) : x.writeUInt32LE(n); return x; };
  const tiff = Buffer.concat([Buffer.from("II"), le(42, 2), le(8, 4), le(1, 2), le(0x8769, 2), le(4, 2), le(1, 4), le(26, 4), le(0, 4),
    le(1, 2), le(0x9003, 2), le(2, 2), le(20, 4), le(44, 4), le(0, 4), Buffer.from(when + "\0", "ascii")]);
  const app1 = Buffer.concat([Buffer.from("Exif\0\0", "binary"), tiff]);
  const head = Buffer.from([0xff, 0xe1, (app1.length + 2) >> 8, (app1.length + 2) & 255]);
  return Buffer.concat([PLATE.subarray(0, 2), head, app1, PLATE.subarray(2)]);
};
const READ = { dish: "Grilled chicken with rice and salad", foods: [
  { name: "Chicken breast, grilled", grams: 180, low: 140, high: 240, calories: 165, protein: 31, fats: 3.6, carbs: 0, fiber: 0, confidence: "medium" },
  { name: "Rice, cooked", grams: 150, low: 120, high: 200, calories: 130, protein: 2.7, fats: 0.3, carbs: 28, fiber: 0.4, confidence: "medium" },
  { name: "Mixed salad, dressed", grams: 90, low: 60, high: 120, calories: 60, protein: 1.2, fats: 4.5, carbs: 3.5, fiber: 1.5, confidence: "medium" },
], unsure: null };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 1, permissions: ["camera"] });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errs.push(e.message));
  await page.clock.setFixedTime(new Date("2026-10-25T13:05:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan", "Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3, window: { from: "07:00", to: "21:00" } } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  const sent = [];
  await page.route("**/api/plate-photo", async (r) => { sent.push(r.request().postDataJSON()); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(READ) }); });
  await page.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "A plain lunch plate.", around: "", better_as: "" }) }));
  await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  await page.route("**/api/members/foods**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, foods: [] }) }));
  const text = async (sel = "main") => ((await page.locator(sel).first().textContent()) ?? "").replace(/\s+/g, " ");
  const st = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  const pick = async (when) => { await page.locator(".camera-ui input[type=file]").setInputFiles({ name: "plate.jpg", mimeType: "image/jpeg", buffer: withExif(when) }); await page.waitForTimeout(1200); };
  const toPlate = async () => { await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(600); };
  const chips = async () => (await page.locator(".pa-chip").allTextContents()).map((s) => s.replace(/\s+/g, " ").trim());

  const plateBtn = () => page.locator("nav.bottom-nav button").filter({ hasText: "Plate" });
  const hold = async (ms) => { const bx = await plateBtn().boundingBox(); await page.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await page.mouse.down(); await page.waitForTimeout(ms); await page.mouse.up(); await page.waitForTimeout(400); };
  const onToday = async () => await page.locator("nav.bottom-nav button.active").textContent();
  await page.goto(U + "/"); await page.waitForTimeout(1500);
  await page.locator("nav.bottom-nav button").filter({ hasText: "Today" }).click(); await page.waitForTimeout(600);

  // the icon
  ok(await plateBtn().locator("svg.plate-icon").count() === 1 && await plateBtn().locator("svg.plate-icon circle").count() === 3 && await plateBtn().locator("svg.plate-icon path").count() === 3 && (await plateBtn().textContent()).trim() === "Plate", "DT309: the Plate icon is a plate with a shutter, a fork and a knife; the word stays Plate");

  // a long press opens the menu, and nothing else
  await hold(700);
  const menu = page.locator(".plate-cam-menu");
  ok(await menu.count() === 1 && /Today/.test(await onToday()) && await page.locator(".camera-modal").count() === 0, "DT309: a long press on Plate opens the menu; the Plate and the camera stay closed");
  const names = (await menu.locator(".plate-cam-mode").allTextContents()).map((s) => s.trim());
  ok(names.join() === "Group,Barcode,Label,Meal" && (await menu.locator(".plate-cam-top b").textContent()) === "Open the camera" && await menu.locator(".plate-cam-mode svg").count() === 4, "DT309: Open the camera, with Group, Barcode, Label, Meal from left to right, each with its icon: " + names.join());
  const xb = await menu.locator(".plate-cam-x").boundingBox(), sizes = await menu.locator(".plate-cam-mode").evaluateAll((xs) => xs.map((x) => x.getBoundingClientRect().height));
  ok(xb.width >= 44 && xb.height >= 44 && sizes.every((h) => h >= 44) && await menu.locator(".plate-cam-x").getAttribute("aria-label") === "Close", "DT309: the X and the modes are at least 44 px; the X says Close");
  const mb = await menu.boundingBox(), pb = await plateBtn().boundingBox();
  ok(mb.y + mb.height <= pb.y + 12 && Math.abs((mb.x + mb.width / 2) - (pb.x + pb.width / 2)) < 30, "DT309: the menu sits above the Plate icon");

  // 0.3.155 (Coach Milan 17 November 20:30: the long press selected the word Open on his phone): nothing in the menu can be selected
  ok(await page.locator(".plate-cam-back").evaluate((x) => getComputedStyle(x).userSelect) === "none" && await page.locator(".plate-cam-top b").evaluate((x) => getComputedStyle(x).userSelect) === "none", "0.3.155: the menu and the layer behind it cannot be selected by the press");
  // the X closes it; so does a tap outside
  await menu.locator(".plate-cam-x").click(); await page.waitForTimeout(300);
  ok(await page.locator(".plate-cam-menu").count() === 0 && /Today/.test(await onToday()) && await page.locator(".camera-modal").count() === 0, "DT309: the X closes the menu and nothing else happens");
  await hold(700);
  await page.mouse.click(30, 200); await page.waitForTimeout(300);
  ok(await page.locator(".plate-cam-menu").count() === 0 && /Today/.test(await onToday()), "DT309: a tap outside the menu closes it too");

  // a short tap still opens the Plate
  await hold(120);
  ok(await page.locator(".plate-cam-menu").count() === 0 && /Plate/.test(await onToday()), "DT309: a short tap on Plate opens the Plate, as always");
  await page.locator("nav.bottom-nav button").filter({ hasText: "Today" }).click(); await page.waitForTimeout(500);

  // a mode opens the camera in that mode, in the same order as the menu
  await hold(700);
  await page.locator(".plate-cam-menu .plate-cam-mode").filter({ hasText: "Meal" }).click(); await page.waitForTimeout(1500);
  const modes = (await page.locator(".cam-modes button").allTextContents()).map((s) => s.trim());
  ok(await page.locator(".camera-modal").count() === 1 && await page.locator(".cam-modes button[aria-pressed=true]").textContent() === "Meal", "DT309: Meal opens the camera in Meal mode");
  ok(modes.join() === "Group,Barcode,Label,Meal", "DT309: the camera's own row of modes has the same order: " + modes.join());
  // closing the camera without a photo: back where you held the button
  await page.locator(".cam-round").first().click(); await page.waitForTimeout(500);
  ok(await page.locator(".camera-modal").count() === 0 && /Today/.test(await onToday()), "DT309: closing the camera without a photo brings you back to Today");

  // another mode, and a photo: it waits on the Plate's photo screen
  await hold(700);
  await page.locator(".plate-cam-menu .plate-cam-mode").filter({ hasText: "Barcode" }).click(); await page.waitForTimeout(1500);
  ok(await page.locator(".cam-modes button[aria-pressed=true]").textContent() === "Barcode", "DT309: Barcode opens the camera in Barcode mode");
  await page.locator(".cam-round").first().click(); await page.waitForTimeout(500);
  await hold(700);
  await page.locator(".plate-cam-menu .plate-cam-mode").filter({ hasText: "Meal" }).click(); await page.waitForTimeout(1500);
  await page.locator("#camera-shutter-button").click(); await page.waitForTimeout(700);
  await page.locator(".cam-analyze").click(); await page.waitForTimeout(1500);
  ok(await page.locator(".pa-screen").count() === 1 && /Plate/.test(await onToday()) && sent.length === 0, "DT309: a photo taken this way waits on the Plate's photo screen, as from Photo of my meal");

  // in Serbian and German
  for (const [lang, title, list] of [["sr-Latn", "Otvori kameru", "Grupa,Bar kod,Deklaracija,Obrok"], ["de", "Kamera öffnen", "Gruppe,Barcode,Etikett,Mahlzeit"]]) {
    await page.evaluate((l) => localStorage.setItem("chefmealan-lang", l), lang); await page.goto(U + "/"); await page.waitForTimeout(1500);
    const pb2 = await page.locator("nav.bottom-nav button").nth(2).boundingBox(); await page.mouse.move(pb2.x + pb2.width / 2, pb2.y + pb2.height / 2); await page.mouse.down(); await page.waitForTimeout(700); await page.mouse.up(); await page.waitForTimeout(400);
    const got = (await page.locator(".plate-cam-menu .plate-cam-mode").allTextContents()).map((s) => s.trim()).join();
    ok((await page.locator(".plate-cam-top b").textContent().catch(() => "")) === title && got === list, `DT309: the menu in ${lang}: ${title}; ${got}`);
  }
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
