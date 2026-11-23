// Board B160 (Coach Milan 23 November 2026, 19:03 to 19:35): a recipe changed after a meal was logged from it. Main on top
// (0.3.186), new below. One scratch build of main (/home/claude/work/b160, not committed); board-new asks. The clock is
// Monday 23 November 2026, 19:00; the cheese pie was eaten tonight at 18:00 for dinner (B160.2), or on Friday (B160.3).
const ROOT = process.env.BOARD_ROOT || "/home/claude/work/b160";
const { chromium } = require(ROOT + "/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs"), path = require("node:path");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs160", PORT = "3709", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const food = (id, name, brand, calories, protein, carbs, fats, fiber, icon) => ({ ...seed.foods[0], id, name, brand, source: "label", calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined, icon });
const Q = food("q", "Grainy cream cheese", "Milbona", 100, 12, 3, 4.5, 0, "🧀"), P = food("p", "Puff pastry", "Henglein", 400, 6, 36, 25, 1.5, "🥐"), S = food("s", "Salt", "Alpen", 0, 0, 0, 0, 0, "🧂"), E = food("e", "Eggs", "", 143, 12.6, 0.7, 9.5, 0, "🥚");
const it = (id, f, g) => ({ id, food: f, grams: g, locked: false });
const recipe = { id: "m-pie", title: "Cheese pie", items: [it("a", Q, 500), it("b", P, 375), it("c", S, 3), it("d", E, 122)], makes: { n: 4, unit: "portions" }, portion: 250, steps: ["Mix the cheese, salt and eggs.", "Pour onto the pastry and bake at 200 °C for 25 minutes."], savedAt: "2026-11-23T16:00:00Z" };
const eaten = (when, slot) => ({ id: "c1", meal: { ...recipe, items: [it("a1", Q, 125), it("b1", P, 94), it("c1", S, 1), it("d1", E, 31)], portion: 251 }, recipeId: "m-pie", status: "eaten", taste: "", notes: "", createdAt: when, ...(slot ? { slot } : {}) });
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;position:relative;z-index:5`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async (isNew, card) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 1, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-11-23T19:00:00+01:00"));
    await p.addInitScript(([s, isNew]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      if (isNew) localStorage.setItem("board-new", "1"); localStorage.setItem("seeded", "1"); }, [{ ...seed, foods: [...seed.foods, Q, P, S, E], meals: [recipe], feedback: [card] }, isNew]);
    await require(path.join(ROOT, "tests/flows/adult.cjs"))(p);
    await p.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.goto(U + "/my-recipes/m-pie"); await p.waitForTimeout(1500);
    await p.evaluate(() => { document.querySelectorAll(".chat-fab").forEach((e) => (e.style.display = "none")); const st = document.createElement("style"); st.textContent = "header, .topbar, .bottom-nav { position: static !important; } .bottom-nav { display: none !important; }"; document.head.appendChild(st); });
    return p;
  };
  const note = (p, sel, html, marks = [], where = "afterend") => p.evaluate(([sel, html, marks, MARK, NOTE, where]) => { for (const m of marks) document.querySelectorAll(m).forEach((e) => (e.style.cssText += ";" + MARK));
    const t = document.querySelector(sel); if (!t) return; const n = document.createElement("div"); n.className = "board-note"; n.style.cssText = NOTE; n.innerHTML = html; t.insertAdjacentElement(where, n); }, [sel, html, marks, MARK, NOTE, where]);
  const clean = (p) => p.evaluate(() => document.querySelectorAll(".board-note").forEach((n) => n.remove()));
  const tall = async (p, name, from, to) => { await p.waitForTimeout(400);
    const r = await p.evaluate(([from, to]) => { const pick = (q) => q.startsWith("card:") ? [...document.querySelectorAll("section.card")].find((x) => (x.querySelector("b, h2, h3")?.textContent || "").trim() === q.slice(5)) : document.querySelector(q);
      const a = pick(from).getBoundingClientRect(); const z = ([...document.querySelectorAll(".board-note")].pop() ?? document.querySelector(to)).getBoundingClientRect(); const e = document.querySelector(to)?.getBoundingClientRect() ?? z; return { y: a.top + scrollY - 10, h: Math.max(z.bottom, e.bottom) - a.top + 30 }; }, [from, to]);
    await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y: Math.max(0, r.y), width: 390, height: Math.min(r.h, 2400) } }); console.log(name); };
  const edit = async (p) => { await p.getByRole("button", { name: "Edit recipe" }).click(); await p.waitForTimeout(400);
    const g = p.getByLabel("Grams of Grainy cream cheese", { exact: true }); await g.fill("250"); await g.blur(); await p.waitForTimeout(300); };
  const meal = async (p) => { await p.locator(".rq-eats .re-open").first().click(); await p.waitForTimeout(700); };
  const TONIGHT = eaten("2026-11-23T17:00:00.000Z", { date: "2026-11-23", slotId: "dinner", name: "Dinner", time: "18:00" });
  const FRIDAY = eaten("2026-11-20T17:00:00.000Z", { date: "2026-11-20", slotId: "dinner", name: "Dinner", time: "18:00" });
  try {
    // B160.1 in main: change, save; the meal eaten tonight keeps the first foods, without a word
    let p = await open(false, TONIGHT);
    await edit(p);
    await note(p, ".b160-save", "I ate it tonight at 18:00, then fix the recipe: 250 g of the cream cheese, not 500. I tap Save changes.", [".b160-save"], "beforebegin");
    await tall(p, "1a", "card:Foods", ".b160-save"); await clean(p);
    await p.getByRole("button", { name: "Save changes" }).click(); await p.waitForTimeout(600);
    await meal(p);
    await note(p, ".past-meal .pm-when", "Tonight's dinner still holds the first foods: 125 g cream cheese, the old numbers. Nothing asked, nothing said.", [".past-meal"]);
    await tall(p, "1b", ".past-meal", ".past-meal"); await p.context().close();
    // B160.2 new: asked once about tonight's dinner
    p = await open(true, TONIGHT);
    await edit(p);
    await p.getByRole("button", { name: "Save changes" }).click(); await p.waitForTimeout(500);
    await note(p, ".b160-ask", "<b>New:</b> a meal from this recipe was logged today, so Save changes asks once. Update it: the meal takes the new foods, the same share I ate. I tap Update it.", [".b160-ask"]);
    await tall(p, "2a", "card:Steps", ".board-note"); await clean(p);
    await p.locator(".b160-update").click(); await p.waitForTimeout(600);
    await note(p, ".b160-saved", "<b>New:</b> one line says tonight's dinner follows the change.", [".b160-saved"]);
    await tall(p, "2b", ".readout", ".board-note"); await clean(p);
    await meal(p);
    await note(p, ".past-meal .pm-when", "<b>New:</b> tonight's dinner now holds 63 g of the cream cheese, a quarter of the new recipe, with its new numbers.", [".past-meal"]);
    await tall(p, "2c", ".past-meal", ".past-meal"); await p.context().close();
    // B160.3 new: a meal from Friday is not asked about
    p = await open(true, FRIDAY);
    await edit(p);
    await note(p, ".b160-new", "<b>New:</b> Save as a new recipe, beside Save changes, for a change that makes a different dish: this recipe stays as it is.", [".b160-new"]);
    await tall(p, "3a", "card:Steps", ".board-note"); await clean(p);
    await p.getByRole("button", { name: "Save changes" }).click(); await p.waitForTimeout(600);
    await note(p, ".b160-saved", "<b>New:</b> Friday's meal is older than yesterday: not asked. One line says it keeps its foods.", [".b160-saved"]);
    await tall(p, "3b", ".readout", ".board-note"); await p.context().close();
  } catch (e) { console.log("ERR", e.message); } finally { await b.close(); server.kill(); }
})();
