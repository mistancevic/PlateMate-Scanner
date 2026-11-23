// Board B167 (Coach Milan 23 November 2026, 22:26 to 22:36): a dinner eaten at 18:28 is on Today but not in Plan; the cook
// of the edited recipe logged it a second time at 22:24; after the delete the strip still said Eaten 22:24. Main on top
// (0.3.190), new below. One scratch build of main (/home/claude/work/b167, not committed); board-new shows the new.
// The clock is Monday 23 November 2026, 22:20; Dinner is at 18:00; Lazy Burek was eaten at 18:28.
const fs = require("node:fs"), path = require("node:path");
const start = require("./plate157.cjs");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs167";
fs.mkdirSync(R, { recursive: true });
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;position:relative;z-index:5`;
const base = JSON.parse(fs.readFileSync(path.join(__dirname, "seed.json"), "utf8"));
const food = (id, name, brand, calories, protein, carbs, fats, fiber, icon) => ({ ...base.foods[0], id, name, brand, source: "label", calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined, icon });
const Q = food("q", "Körniger Frischkäse Tworog 2,5% Fett", "Milbona", 100, 12, 3, 4.5, 0, "🧀"), P = food("p", "Frischer Blätterteig", "Henglein", 400, 6, 36, 25, 1.5, "🥐"),
  T = food("t", "Feta leicht", "Salakis", 200, 17, 1, 14, 0, "🧀"), E = food("e", "Eggs", "", 143, 12.6, 0.7, 9.5, 0, "🥚");
const it = (id, f, g) => ({ id, food: f, grams: g, locked: false });
const items = [it("a", Q, 250), it("b", P, 375), it("c", T, 150), it("d", E, 120)];
const recipe = { id: "m-burek", title: "Lazy Burek", items, portion: 895, steps: ["Mix the cheeses and eggs.", "Spread on the pastry, roll and bake at 200 °C for 30 minutes."], savedAt: "2026-11-23T16:00:00Z" };
const DINNER = { date: "2026-11-23", slotId: "dinner", name: "Dinner", time: "18:00" };
const ate = { id: "c1", meal: { ...recipe }, recipeId: "m-burek", status: "eaten", taste: "DaaM good", notes: "", createdAt: "2026-11-23T17:28:00.000Z", slot: DINNER, moment: "dinner" };
const planned = { "2026-11-23": { dinner: { title: "Lazy Burek", kcal: 2318, protein: 113, source: "mine", mealId: "m-burek", items, portion: 895 } } };
(async () => {
  const h = await start("3717");
  const open = async (isNew, withPlan, plate) => {
    const p = await h.open({ time: "2026-11-23T22:24:00+01:00", foods: [], planned: withPlan ? planned : undefined, seed: (s) => {
      s.foods = [...s.foods, Q, P, T, E]; s.meals = [recipe]; s.feedback = [ate];
      if (plate) { s.items = items.map((x, i) => ({ ...x, id: "pl" + i })); s.title = "Lazy Burek"; }
    } });
    await p.evaluate((isNew) => { const pe = JSON.parse(localStorage.getItem("chefmealan-personal")); pe.lifestyle = { ...pe.lifestyle, slotTimes: { dinner: "18:00" } }; localStorage.setItem("chefmealan-personal", JSON.stringify(pe)); if (isNew) localStorage.setItem("board-new", "1"); }, isNew);
    await p.reload(); await p.waitForTimeout(1500);
    await p.evaluate(() => { document.querySelectorAll(".chat-fab").forEach((e) => (e.style.display = "none")); const st = document.createElement("style"); st.textContent = "header, .topbar, .bottom-nav, nav { position: static !important; } .chat-fab { display: none !important; }"; document.head.append(st); });
    return p;
  };
  const note = (p, sel, html, marks = [], where = "afterend") => p.evaluate(([sel, html, marks, MARK, NOTE, where]) => { for (const m of marks) { const all = [...document.querySelectorAll(m.replace(/^LAST:/, ""))]; (m.startsWith("LAST:") ? all.slice(-1) : all).forEach((e) => (e.style.cssText += ";" + MARK)); }
    const t = document.querySelector(sel); if (!t) return "missing " + sel; const n = document.createElement("div"); n.className = "board-note"; n.style.cssText = NOTE; n.innerHTML = html; t.insertAdjacentElement(where, n); return "ok"; }, [sel, html, marks, MARK, NOTE, where]);
  const clean = (p) => p.evaluate(() => { document.querySelectorAll(".board-note").forEach((n) => n.remove()); });
  const shot = async (p, name, from, to, cap = 2200) => { await p.waitForTimeout(400);
    const r = await p.evaluate(([from, to]) => { const a = document.querySelector(from).getBoundingClientRect(); const notes = [...document.querySelectorAll(".board-note")].map((n) => n.getBoundingClientRect().bottom);
      const e = document.querySelector(to)?.getBoundingClientRect(); return { y: a.top + scrollY - 10, h: Math.max(e ? e.bottom : 0, ...notes, a.bottom) - a.top + 24 }; }, [from, to]);
    await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y: Math.max(0, r.y), width: 390, height: Math.min(r.h, cap) } }); console.log(name, Math.round(r.h)); };
  const toEat = async (p) => {
    await p.locator(".plate-end .prepare-it").click(); await p.waitForTimeout(1200);
    if (process.env.DBG) { await p.screenshot({ path: "/tmp/dbg167.png", fullPage: true }); console.log((await h.main(p)).slice(0, 600)); }
    const lock = p.getByRole("button", { name: /Lock it and cook/ });
    if (await lock.count()) { await lock.first().click(); await p.waitForTimeout(900); } else { await p.locator(".way").first().click(); await p.getByRole("button", { name: "Make it this way ›" }).click(); await p.waitForTimeout(900); }
    if (process.env.DBG) console.log((await h.main(p)).slice(0, 500));
    await p.getByRole("button", { name: /^Cooked\. Next: Eat/ }).click(); await p.waitForTimeout(800);
    await p.getByRole("button", { name: "DaaM good" }).click(); await p.waitForTimeout(300);
    await p.locator(".eat-save").click(); await p.waitForTimeout(500);
  };
  const dinnerRow = (p) => ({ click: async () => { await p.locator(".eat-cal .pcal-row").filter({ hasText: /Dinner/ }).first().click(); await p.waitForTimeout(600);
    const big = p.getByRole("button", { name: "Yes, I ate it", exact: true }); if (await big.count()) { await big.first().click(); await p.waitForTimeout(600); } } });
  const errs = [];
  try {
    // ---- B167.1 in main ----
    let p;
    if (process.env.ONLY !== "cook") { p = await open(false, true, false);
    await h.tab(p, "Plan"); await p.waitForTimeout(600);
    console.log(await note(p, ".plan-day", "Dinner was eaten at 18:28, Today says so. Here Lazy Burek still waits to be eaten, with Swap and Empty.", [".plan-day .plan-slot-set"]));
    await shot(p, "1a", ".plan-day", ".board-note"); await clean(p); await p.context().close();
    p = await open(false, false, false);
    await h.tab(p, "Plan"); await p.waitForTimeout(600);
    console.log(await note(p, ".plan-day", "With the dinner emptied here, Plan says Pick a meal, and Today still holds the dinner, by the plan.", ["LAST:.plan-day .plan-slot"]));
    await shot(p, "1b", ".plan-day", ".board-note"); await clean(p); await p.context().close(); }
    p = await open(false, true, true);
    await toEat(p);
    console.log(await note(p, ".eat-cal", "22:24, the cook of the edited recipe. Save asks which meal; Dinner says Eaten. I tap it.", [".eat-cal .pcal-row.done"]));
    await shot(p, "1c", ".eat-save", ".board-note"); await clean(p);
    await dinnerRow(p).click(); await p.waitForTimeout(1200);
    if (process.env.DBG) { const st = await h.st(p); console.log(JSON.stringify(st.feedback.map((f) => [f.id, f.status, f.createdAt, f.slot && f.slot.slotId, f.meal.items.map((i) => i.grams).join("/")])), JSON.stringify(st.cook && { stage: st.cook.stage, cardId: st.cook.cardId })); console.log((await h.main(p)).slice(0, 400)); }
    await h.tab(p, "Today"); await p.waitForTimeout(600);
    console.log(await note(p, ".meals-card .card-head", "Nothing asked: Dinner now holds Lazy Burek twice, 18:28 and 22:24.", [".meals-card .log-card"]));
    await shot(p, "1d", ".meals-card", ".meals-card"); await clean(p);
    const second = (await h.st(p)).feedback.find((f) => f.id !== "c1");
    await p.locator(".meals-card .log-card").filter({ hasText: /10:2\d PM|22:2\d/ }).first().getByRole("button", { name: /Change or delete/ }).click(); await p.waitForTimeout(700);
    await p.locator(".pm-delete").click(); await p.waitForTimeout(400); await p.locator(".pm-sure").click(); await p.waitForTimeout(900);
    const left = (await h.st(p)).feedback; console.log("left", left.length, second && left.some((f) => f.id === second.id));
    await p.evaluate(() => scrollTo(0, 0));
    console.log(await note(p, ".cook-strip", "The 22:24 meal is deleted. The strip still says Eaten 22:24 and that Chef Mealan asks how it carried me.", [".cook-strip"]));
    await shot(p, "1e", ".cook-strip", ".board-note"); await clean(p); await p.context().close();
    // ---- B167.2 new ----
    p = await open(true, true, false);
    await h.tab(p, "Plan"); await p.waitForTimeout(600);
    console.log(await note(p, ".plan-day", "<b>New:</b> today's Dinner shows what was eaten: Lazy Burek, eaten 18:28, as a past day does. A tap opens the meal; no Swap, no Empty. The day's numbers count it.", [".b167-eaten"]));
    await shot(p, "2a", ".plan-head, .plan-day", ".board-note"); await clean(p); await p.context().close();
    p = await open(true, false, false);
    await h.tab(p, "Plan"); await p.waitForTimeout(600);
    console.log(await note(p, ".plan-day", "<b>New:</b> the plan's Dinner emptied, and Dinner still shows Lazy Burek, eaten. Plan and Today say the same.", [".b167-eaten"]));
    await shot(p, "2b", ".plan-day", ".board-note"); await clean(p); await p.context().close();
    p = await open(true, true, true);
    await toEat(p); await dinnerRow(p).click(); await p.waitForTimeout(800);
    console.log(await note(p, ".same-ask", "<b>New:</b> Dinner was already eaten, so Save asks first, as for the same photo. Update that meal: the 18:28 dinner takes this plate. Keep both: two meals, if I ate it twice.", [".same-ask"]));
    await shot(p, "2c", ".same-ask", ".board-note"); await clean(p);
    await p.locator(".same-ask").getByRole("button", { name: "Update that meal" }).click(); await p.waitForTimeout(1200);
    await h.tab(p, "Today"); await p.waitForTimeout(600);
    console.log(await note(p, ".meals-card .card-head", "Update that meal: one dinner, at 18:28, with the plate of 22:24.", [".meals-card .log-card"]));
    await shot(p, "2d", ".meals-card", ".meals-card"); await clean(p); await p.context().close();
    p = await open(true, true, true);
    await toEat(p); await dinnerRow(p).click(); await p.waitForTimeout(800);
    await p.locator(".same-ask").getByRole("button", { name: "Keep both" }).click(); await p.waitForTimeout(1200);
    await h.tab(p, "Today"); await p.waitForTimeout(600);
    console.log(await note(p, ".meals-card .card-head", "<b>New:</b> Keep both: two dishes in Dinner, and Today counts the meal once: 1 of 1 by the plan, both in the kcal.", [".meals-card .logged-line"], "afterend"));
    await shot(p, "2e", ".meals-card", ".meals-card .log-card"); await clean(p);
    await p.locator(".meals-card .log-card").filter({ hasText: /10:2\d PM|22:2\d/ }).first().getByRole("button", { name: /Change or delete/ }).click(); await p.waitForTimeout(700);
    await p.locator(".pm-delete").click(); await p.waitForTimeout(400); await p.locator(".pm-sure").click(); await p.waitForTimeout(900);
    await p.evaluate(() => scrollTo(0, 0));
    console.log("strip", await p.locator(".cook-strip").count());
    console.log(await note(p, "main", "<b>New:</b> Keep both, then the 22:24 meal deleted: the strip goes with it. Today opens with no Eaten 22:24 line; nothing asks how a deleted meal carried me.", [], "afterbegin"));
    await p.evaluate(() => { const n = document.querySelector(".board-note"); n.nextElementSibling && (n.nextElementSibling.id = "after-note"); });
    await shot(p, "2f", "main", ".board-note", 420); await clean(p); await p.context().close();
  } catch (e) { console.log("ERR", e.message.slice(0, 400)); }
  h.kill(); process.exit(0);
})();
