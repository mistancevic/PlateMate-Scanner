// DT165 (Coach Milan 29 October 23:24): the five minerals, each its own page; six new foods in the shared table
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = process.env.ROOT || "/home/claude/pm165";   // the drawn build, not merged
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const PORT = "3345", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ args: ["--lang=en-GB"] });
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB" })).newPage();
  await page.clock.setFixedTime(new Date("2026-10-29T10:10:00"));
  await page.addInitScript(([s]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-20T16:00:00Z", source: "profile" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "each", week: { passive: 3, active: 1, easy: 2, hard: 1 }, sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, lifestyle: { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-20T16:00:00Z", consentBodyAt: "2026-10-20T16:00:00Z", declaredAt: "2026-10-20T16:00:00Z", aiConfirmedAt: "2026-10-20T16:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, [seed]);
  await require(path.join(ROOT, "tests/flows/adult.cjs"))(page);
  const R = "/home/claude/boards/rs";
  const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742";
  const shot = async (name, keep) => { await page.waitForTimeout(400); await page.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue; if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } window.scrollTo(0, 0); document.querySelector(".toast")?.remove(); }); await page.waitForTimeout(200); await page.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log("shot " + name); };
  const openEx = async (fam) => { await page.goto(U + "/"); await page.waitForTimeout(1000); await page.getByRole("button", { name: "Menu" }).first().click(); await page.waitForTimeout(300);
    await page.getByRole("button", { name: /^Explorer/ }).click(); await page.waitForTimeout(600); if (fam !== "Protein") { await page.locator(".ex-families").getByRole("radio", { name: fam }).click(); await page.waitForTimeout(300); } };
  // the note, above the calculation line; marks: elements whose text starts with one of `marks`
  const dress = (note, marks = [], sel = "small, b, .ex-row, .ex-combine, .menu-row, .ex-range, .ex-members") => page.evaluate(({ note, NOTE, mark, marks, sel }) => {
    for (const t of marks) { const el = [...document.querySelectorAll(t.sel ?? sel)].find((e) => (t.has ? e.textContent.includes(t.text) : e.textContent.trim().startsWith(t.text ?? t))); if (el) el.style.cssText += ";" + mark; else console.log("no mark " + (t.text ?? t)); }
    const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = note; document.querySelector(".ex-calc").before(d); window.scrollTo(0, 0);
  }, { note, NOTE, mark, marks, sel });
  page.on("console", (m) => { if (m.text().startsWith("no mark")) console.log(m.text()); });
  const member = async (name) => { await openEx("Micros"); await page.locator("button.ex-member", { hasText: name }).click(); await page.waitForTimeout(400); };
  await openEx("Micros");
  await page.evaluate((mark) => { document.querySelectorAll(".ex-members")[2].style.cssText += ";" + mark; }, mark);
  await dress("New: the five minerals open, like the vitamins. Every member of the family now has its own page, with your day next to it.");
  await shot("r165a");
  await member("Calcium");
  await dress("New: Calcium. Your day, 950 mg, is EFSA's from 25; at 18 to 24 it is 1000 mg, from the year of birth in your profile. Where to find it: the ten foods on our table with the most in one portion. Tofu set with calcium and sardines with their bones are new.",
    [{ sel: ".ex-range", text: "Your range" }, { sel: ".ex-row", text: "Tofu" }, { sel: ".ex-row", text: "Sardines" }, { sel: ".ex-combine", text: "Vitamin D" }]);
  await shot("r165b");
  await member("Iron");
  await dress("New: Iron. 11 mg for a man, 16 mg for a woman before menopause, 11 mg after. No upper limit: EFSA set a safe level of intake instead, 40 mg a day. Two ways to combine it, both EU claims.",
    [{ sel: ".ex-range", text: "Your range" }, { sel: ".ex-row", text: "Beef liver" }, { sel: ".ex-row", text: "Chickpeas" }, { sel: ".ex-combine", text: "Vitamin C" }, { sel: ".ex-combine", text: "Vitamin A" }]);
  await shot("r165c");
  await member("Magnesium");
  await dress("New: Magnesium. EFSA's upper limit, 250 mg, is for supplements, water and added magnesium only, and it sits below your day. So the range shows no upper limit for food, and says why.",
    [{ sel: ".ex-range", text: "Your range" }, { sel: ".ex-row", text: "Pumpkin seeds" }]);
  await shot("r165d");
  await member("Zinc");
  await dress("New: Zinc. EFSA's value rises with the phytate you eat, from whole grains, legumes and seeds: 9.4 to 16.3 mg for a man. Your day is the lowest, and the page says so. Eighteen EU claims, word for word.",
    [{ sel: ".ex-range", text: "Your range" }, { sel: ".ex-combine", text: "Less phytate" }]);
  await shot("r165e");
  await openEx("Foods");
  await dress("New: six foods in the shared table, read in full, so they are in Foods too: 30 foods. Chickpeas, sardines, pumpkin seeds, tofu, kale and beef liver.",
    ["Chickpeas", "Sardines", "Pumpkin seeds", "Tofu", "Kale", "Beef liver"].map((t) => ({ sel: ".ex-food", text: t, has: true })), ".ex-food");
  await shot("r165f");
  await openEx("Foods"); await page.locator(".ex-food", { hasText: "Pumpkin seeds" }).click(); await page.waitForTimeout(400);
  await dress("New: Pumpkin seeds opened. One row, every lens: the minerals it brings most of lead its Vitamins and minerals.", [{ sel: ".ex-head", text: "Vitamins and minerals" }], ".ex-head");
  await shot("r165g");
  await b.close(); server.kill();
})();
