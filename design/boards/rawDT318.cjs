// DT318, a raw replay of Coach Milan's steps of 18 November 19:26 on the app as built in 0.3.159: plain screenshots, to see the screens.
const ROOT = process.env.ROOT || "/home/claude/pm159";
const start = require(ROOT + "/tests/flows/plate157.cjs");
const R = "/home/claude/boards/rs318";
const f = (name, grams, kcal, pr, fa, ca, fi) => ({ name, grams, low: Math.round(grams * 0.75), high: Math.round(grams * 1.3), calories: kcal, protein: pr, fats: fa, carbs: ca, fiber: fi, confidence: "medium" });
const READ1 = { dish: "Chicken and sweet potato fries", foods: [f("Chicken breast, grilled", 250, 165, 31, 3.6, 0, 0), f("Sweet potato fries, baked", 180, 150, 2, 5, 24, 3.5), f("Yogurt, 10% fat", 80, 120, 3.5, 10, 4, 0)], unsure: { name: "Chicken breast, grilled", options: [200, 350] }, which: null, course: "main", vessel: "plate", serves: 1 };
const READ2 = { dish: "Chicken and sweet potato fries", foods: [f("Chicken breast, grilled", 250, 165, 31, 3.6, 0, 0), f("Sweet potato fries, baked", 180, 150, 2, 5, 24, 3.5), f("Yogurt, 0.2% fat", 80, 40, 4.3, 0.2, 5, 0), f("Mayonnaise", 20, 680, 1, 75, 1, 0)], unsure: { name: "Chicken breast, grilled", options: [220, 350] }, which: null, course: "main", vessel: "plate", serves: 1 };
(async () => { const h = await start("3710"); try {
  const p = await h.open({ foods: [] }); let n = 0;
  await p.route("**/api/plate-photo", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(n++ ? READ2 : READ1) }));
  const shot = async (name) => { await p.waitForTimeout(400); await p.screenshot({ path: `${R}/raw_${name}.png`, fullPage: true }); console.log("shot", name); };
  await h.toPhoto(p, true); await h.readIt(p); await shot("1_read");
  const btn = (t) => p.locator("button").filter({ hasText: t }).first();
  if (await btn("~200 g").count()) { await btn("~200 g").click(); await shot("2_after200"); } else console.log("no unsure on this view");
  await p.locator(".rv-change button").click(); await p.waitForTimeout(800); await shot("3_change");
  await btn("~200 g").click(); await p.waitForTimeout(500); await shot("4_after200");
  const row = p.locator(".name-link").filter({ hasText: "Yogurt" }).first(); await row.scrollIntoViewIfNeeded(); const bx = await row.boundingBox();
  await p.mouse.move(bx.x + 120, bx.y + 34); await p.mouse.down(); for (let k = 1; k <= 14; k++) { await p.mouse.move(bx.x + 120 - k * 16, bx.y + 34); await p.waitForTimeout(20); } await p.mouse.up(); await p.waitForTimeout(1200); await p.screenshot({ path: `${R}/raw_5_swap.png` }); console.log("shot swap");
  console.log("SWAP:", (await p.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 700));
  console.log(await p.evaluate(() => [...document.querySelectorAll("button")].filter((b) => b.offsetParent).slice(0, 30).map((b) => (b.className + "|" + (b.getAttribute("aria-label") || b.textContent)).slice(0, 60)).join("\n")));
} finally { h.kill(); await h.b.close(); } })().catch((e) => { console.log("ERR", e.message.slice(0, 600)); process.exit(1); });
