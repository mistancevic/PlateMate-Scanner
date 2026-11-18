// Board B150, first row (Coach Milan, 18 November 2026, 19:58: "Which step is this screen? I was talking about the Plate and
// after the reading what happened. That is missing."): the steps he took, in order, on the app as built in 0.3.159.
// The board's days: the photo is from Saturday 15:57 (his Tuesday 19:56), today is Sunday (his Wednesday).
const ROOT = process.env.ROOT || "/home/claude/pm159";
const start = require(ROOT + "/tests/flows/plate157.cjs"); const fs = require("node:fs");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs150";
const RED = "outline:3px solid #d13a3a;outline-offset:2px;border-radius:12px", TAP = "outline:4px solid #f0a81c;outline-offset:2px";
const RNOTE = `${RED};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left`;
(async () => { const h = await start("3700"); try {
  const sd0 = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); const F = (n) => sd0.foods.find((f) => f.name.startsWith(n));
  const bowl = { title: "Chicken rice bowl", kcal: 574, protein: 64, source: "plate", items: [{ id: "a", food: F("Rice"), grams: 200, locked: false }, { id: "b", food: F("Chicken"), grams: 190, locked: false }], portion: 390 };
  const p = await h.open({ foods: [], planned: { "2026-11-14": { dinner: bowl }, "2026-11-15": { dinner: bowl } } });
  await p.addStyleTag({ content: ".chat-fab { display: none !important } nav { visibility: hidden }" });
  const css = () => p.addStyleTag({ content: ".chat-fab { display: none !important } nav { visibility: hidden }" });
  const shot = async (name, hh = 820) => { await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300); const full = await p.evaluate(() => document.documentElement.scrollHeight); await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y: 0, width: 390, height: Math.min(hh, full) } }); console.log("shot", name); };
  const note = (sel, html, tapSel) => p.evaluate(({ sel, html, tapSel, RNOTE, TAP }) => { document.querySelectorAll("[data-n]").forEach((e) => e.remove()); document.querySelectorAll("[data-t]").forEach((e) => { e.style.outline = ""; e.style.boxShadow = ""; e.removeAttribute("data-t"); });
    if (tapSel) { const t = typeof tapSel === "string" ? document.querySelector(tapSel) : null; if (t) { t.style.cssText += ";" + TAP; t.setAttribute("data-t", "1"); } }
    const n = document.createElement("div"); n.setAttribute("data-n", "1"); n.style.cssText = RNOTE.replace(/#d13a3a/g, "#5b6b8a"); n.innerHTML = html; document.querySelector(sel).insertAdjacentElement("afterend", n); }, { sel, html, tapSel, RNOTE, TAP });
  await h.toPhoto(p, true); await css();
  await note(".plan-line", "<b>Step 1.</b> On the Plate I pick a photo from Your photos. It is from yesterday. I tap Read the plate.");
  await shot("f_1");
  await h.readIt(p); await css();
  await note(".plan-line", "<b>Step 2. The read.</b> Chef Mealan read the photo. No meal is set. This is the step the bug starts on.", ".plate-end .pe-ate");
  await shot("f_2", 1400);
  await p.locator(".plate-end .pe-ate").click(); await p.waitForTimeout(500); await p.locator(".plate-end .pcal-day").filter({ hasText: "Sun 15" }).click(); await p.waitForTimeout(400); await h.row(p, "Lunch", ".plate-end").click(); await p.waitForTimeout(800); await css();
  await note(".plan-line", "<b>Step 3. A first try.</b> Ate it, then today, then Lunch. The line says Lunch, today. Then I see the photo's own time and want the right meal. The X takes the lunch off.", ".plan-line-x");
  await shot("f_3");
  await p.locator(".plan-line-x").click(); await p.waitForTimeout(500); await p.locator(".plan-line-pen").click(); await p.waitForTimeout(500); await h.row(p, "Dinner", ".meal-line-open").click(); await p.waitForTimeout(900); await css();
  await p.evaluate(({ RED }) => { document.querySelector(".meal-line-day").style.cssText += ";" + RED; }, { RED });
  await note(".plan-line", "<b>Step 5. Dinner is set, and it is today's.</b> The line says Sunday, today, at Dinner's time from the settings. The photo is from Saturday. There is no way to change the time, and no pencil any more.");
  await shot("f_5");
} finally { h.kill(); await h.b.close(); } })().catch((e) => { console.log("ERR", e.message.slice(0, 500)); process.exit(1); });
