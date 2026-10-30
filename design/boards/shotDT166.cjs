// DT166 (Coach Milan 30 October 08:09): wake-up and bedtime set the first and last meal
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOTS = { now: "/home/claude/pm165", new: "/home/claude/pm166" };   // now: 0.3.7 as merged; new: the drawn build, not merged
const seed = JSON.parse(fs.readFileSync(path.join(ROOTS.new, "tests/flows/seed.json"), "utf8")); seed.items = [];
let PORT = 3350, U;
const R = "/home/claude/boards/rs";
const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742";
const LIFE = { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3 };
async function run(which, life, steps) {
  const ROOT = ROOTS[which], port = String(PORT++); U = `http://127.0.0.1:${port}`;
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: port, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ args: ["--lang=en-GB"] });
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB" })).newPage();
  await page.clock.setFixedTime(new Date("2026-10-30T10:10:00"));
  await page.addInitScript(([s, life]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-20T16:00:00Z", source: "profile" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "each", week: { passive: 3, active: 1, easy: 2, hard: 1 }, sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, lifestyle: life }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-20T16:00:00Z", consentBodyAt: "2026-10-20T16:00:00Z", declaredAt: "2026-10-20T16:00:00Z", aiConfirmedAt: "2026-10-20T16:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, [seed, life]);
  await require(path.join(ROOT, "tests/flows/adult.cjs"))(page);
  const shot = async (name) => { await page.waitForTimeout(400); await page.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue; if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } window.scrollTo(0, 0); document.querySelector(".toast")?.remove(); }); await page.waitForTimeout(200); await page.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log("shot " + name); };
  // the note on top of the page; marks by selector and text
  const dress = (note, marks = []) => page.evaluate(({ note, NOTE, mark, marks }) => {
    for (const t of marks) { const el = [...document.querySelectorAll(t.sel)].find((e) => e.textContent.includes(t.text ?? "")); if (el) el.style.cssText += ";" + mark; else console.log("no mark " + t.sel + " " + (t.text ?? "")); }
    const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = note; const at = document.querySelector("main h1, main h2, .page-why"); (at ?? document.querySelector("main").firstElementChild).before(d); window.scrollTo(0, 0);
  }, { note, NOTE, mark, marks });
  page.on("console", (m) => { if (m.text().startsWith("no mark")) console.log(m.text()); });
  const toPlan = async () => { await page.goto(U + "/"); await page.waitForTimeout(1000); await page.getByRole("button", { name: "Plan", exact: true }).first().click(); await page.waitForTimeout(600); };
  const toLife = async () => { await toPlan(); await page.getByRole("button", { name: "Slots and times" }).click(); await page.waitForTimeout(600); };
  await steps({ page, shot, dress, toPlan, toLife });
  await b.close(); server.kill();
}
(async () => {
  const early = { ...LIFE, wake: "early", bed: "early" };
  await run("now", early, async ({ shot, dress, toLife }) => { await toLife();
    await dress("Now, 0.3.7: wake-up before 6:00 and bedtime before 22:00 are set under Recovery, but the meals stay at 07:30, 13:45 and 20:00: dinner at 20:00 for someone in bed before 22:00.", [{ sel: ".setting", text: "Meal times" }, { sel: ".setting", text: "Wake-up" }, { sel: ".setting", text: "Bedtime" }]);
    await shot("r166a"); });
  await run("new", early, async ({ shot, dress, toLife, toPlan }) => { await toLife();
    await dress("New: Lifestyle in the order a day runs. Work and study first, then Recovery, wake-up before bedtime, then Meals, then Nutrition. Wake-up before 6:00 and bed before 22:00 set the meals below them: 06:30, 12:45 and 19:00.", [{ sel: ".seg-head", text: "Recovery" }, { sel: ".seg-head", text: "Meals" }, { sel: ".setting", text: "Meal times" }, { sel: ".setting", text: "Wake-up" }, { sel: ".setting", text: "Bedtime" }]);
    await shot("r166b");
    await toPlan();
    await dress("New: Plan and Today follow: 06:30, 12:45 and 19:00. Slots and times opens Lifestyle at Meals.", [{ sel: ".plan-slot, .slot-row, .plan-row", text: "06:30" }]);
    await shot("r166c"); });
  await run("new", { ...LIFE, hours: "flexible", slot: undefined, wake: "late", bed: "late" }, async ({ shot, dress, toLife }) => { await toLife();
    await dress("New: a late riser with flexible hours. Wake-up after 8:00 and bed after midnight: breakfast 09:30, lunch 15:45, the last meal 22:00.", [{ sel: ".setting", text: "Meal times" }]);
    await shot("r166d"); });
  await run("new", { ...LIFE, wake: "late", bed: "late" }, async ({ shot, dress, toLife }) => { await toLife();
    await dress("New: the same late riser working 9 to 5. Fixed work hours still come first, as since 0.2.128: lunch at the halfway break, dinner after work. What changes: breakfast is never set before you wake, so 09:00 as work starts, not 08:00.", [{ sel: ".setting", text: "Meal times" }]);
    await shot("r166f"); });
  await run("new", { ...early, slotTimes: { breakfast: "07:00" } }, async ({ shot, dress, toLife }) => { await toLife();
    await dress("New: a time you set yourself stays. Breakfast at 07:00 by hand; lunch and the last meal still follow wake-up and bedtime. One tap takes breakfast back to 06:30.", [{ sel: ".setting", text: "Meal times" }, { sel: ".own-time", text: "own time" }]);
    await shot("r166e"); });
})();
