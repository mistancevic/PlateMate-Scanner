// Boards DT345 and B162 (Coach Milan 23 November 2026, 19:03 and 20:23, from his recipe Lazy Burek): a step between two steps,
// and one part shown once. Main on top (0.3.187), new below. One scratch build of main (/home/claude/work/steps, not
// committed); board-new turns both on. The clock is Monday 23 November 2026, 20:30.
const ROOT = process.env.BOARD_ROOT || "/home/claude/work/steps";
const { chromium } = require(ROOT + "/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs"), path = require("node:path");
const PORT = "3710", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const food = (id, name, calories, protein, carbs, fats, fiber) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined });
const Q = food("q", "Grainy cream cheese", 100, 12, 3, 4.5, 0), P = food("p", "Puff pastry", 400, 6, 36, 25, 1.5), S = food("s", "Salt", 0, 0, 0, 0, 0), E = food("e", "Eggs", 143, 12.6, 0.7, 9.5, 0),
  SE = food("se", "Sesame seeds", 573, 18, 12, 50, 12), F = food("f", "Feta, light", 180, 17, 1, 12, 0), O = food("o", "Avocado oil", 884, 0, 0, 100, 0);
const it = (id, f, g, part) => ({ id, food: f, grams: g, locked: false, ...(part ? { part } : {}) });
const tok = (x) => `[[i:${x.id}|${x.food.name}]]`;
const I = { q: it("a", Q, 250, "Filling"), p: it("b", P, 375, "Base"), s: it("c", S, 3, "Filling"), e: it("d", E, 122, "Filling"), se: it("g", SE, 15), f: it("h", F, 150, "Filling"), o: it("i", O, 10, "Filling") };
const recipe = { id: "m-burek", title: "Lazy burek", items: [I.q, I.p, I.s, I.e, I.se, I.f, I.o], makes: { n: 4, unit: "portions" }, portion: 231,
  steps: [`Preheat the oven to 200 °C. Mix ${tok(I.q)}, ${tok(I.s)}, ${tok(I.e)} and ${tok(I.f)} in a bowl.`, `Lay out ${tok(I.p)} on baking paper.`, `Pour the filling onto the pastry.`, `Bake at 200 °C for 25 minutes until golden.`, `Rest for 5 minutes before slicing.`], savedAt: "2026-11-23T16:00:00Z" };
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;position:relative;z-index:5`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async (isNew) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 1, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-11-23T20:30:00+01:00"));
    await p.addInitScript(([s, isNew]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      if (isNew) localStorage.setItem("board-new", "1"); localStorage.setItem("seeded", "1"); }, [{ ...seed, foods: [...seed.foods, Q, P, S, E, SE, F, O], meals: [recipe], feedback: [] }, isNew]);
    await require(path.join(ROOT, "tests/flows/adult.cjs"))(p);
    await p.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.goto(U + "/my-recipes/m-burek"); await p.waitForTimeout(1500);
    await p.evaluate(() => { document.querySelectorAll(".chat-fab").forEach((e) => (e.style.display = "none")); const st = document.createElement("style"); st.textContent = "header, .topbar, .bottom-nav { position: static !important; } .bottom-nav { display: none !important; }"; document.head.appendChild(st); });
    return p;
  };
  const note = (p, sel, html, marks = [], where = "afterend") => p.evaluate(([sel, html, marks, MARK, NOTE, where]) => { for (const m of marks) document.querySelectorAll(m).forEach((e) => (e.style.cssText += ";" + MARK));
    const t = sel.startsWith("card:") ? [...document.querySelectorAll("section.card")].find((x) => (x.querySelector("b, h2, h3")?.textContent || "").trim() === sel.slice(5)) : document.querySelector(sel); if (!t) return; const n = document.createElement("div"); n.className = "board-note"; n.style.cssText = NOTE; n.innerHTML = html; t.insertAdjacentElement(where, n); }, [sel, html, marks, MARK, NOTE, where]);
  const clean = (p) => p.evaluate(() => document.querySelectorAll(".board-note").forEach((n) => n.remove()));
  const tall = async (p, R, name, from, to) => { await p.waitForTimeout(400);
    const r = await p.evaluate(([from, to]) => { const pick = (q) => q.startsWith("card:") ? [...document.querySelectorAll("section.card")].find((x) => (x.querySelector("b, h2, h3")?.textContent || "").trim() === q.slice(5)) : document.querySelector(q);
      const a = pick(from).getBoundingClientRect(); const z = ([...document.querySelectorAll(".board-note")].pop() ?? pick(to)).getBoundingClientRect(); const e = pick(to)?.getBoundingClientRect() ?? z; return { y: a.top + scrollY - 10, h: Math.max(z.bottom, e.bottom) - a.top + 30 }; }, [from, to]);
    await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y: Math.max(0, r.y), width: 390, height: Math.min(r.h, 2400) } }); console.log(R.slice(-3) + " " + name); };
  const R5 = "/home/claude/boards/rs345", R2 = "/home/claude/boards/rs162";
  try {
    // B162: the Foods
    let p = await open(false);
    await note(p, "card:Foods", "Filling three times: Filling, Base, Filling, then the sesame with no part, then Filling again. The parts are tagged right; they show in the order the foods were added.", [".rq-part"]);
    await tall(p, R2, "1a", "card:Foods", ".board-note"); await clean(p);
    // DT345 before: Edit recipe, the steps
    await p.getByRole("button", { name: "Edit recipe" }).click(); await p.waitForTimeout(500);
    await note(p, ".st-add", "A step can only be added at the end. I need one between step 3 and step 4: spray the oil, sprinkle the sesame. I tap + Add a step.", [".st-add"]);
    await tall(p, R5, "1a", "card:Steps", ".board-note"); await clean(p);
    await p.locator(".st-add").click(); await p.waitForTimeout(400);
    await p.keyboard.type("Spray the oil over the filling and sprinkle the sesame.");
    await note(p, ".st-add", "It is step 6, after the oven and the resting. The steps cannot be moved, so it stays in the wrong place.", []);
    await p.evaluate(() => { const r = [...document.querySelectorAll(".st-row")].pop(); if (r) r.style.cssText += ";outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px"; });
    await tall(p, R5, "1b", "card:Steps", ".board-note"); await p.context().close();
    // new
    p = await open(true);
    await note(p, "card:Foods", "<b>New:</b> one part, one group: all the Filling together, then the Base, in the order the parts first come. The sesame has no part: it comes last, under Other.", [".rq-part"]);
    await tall(p, R2, "2a", "card:Foods", ".board-note"); await clean(p);
    await p.getByRole("button", { name: "Edit recipe" }).click(); await p.waitForTimeout(500);
    await note(p, ".st", "<b>New:</b> between two steps, + Step here. I tap the one between step 3 and step 4.", [".st-between"], "afterend");
    await tall(p, R5, "2a", "card:Steps", ".board-note"); await clean(p);
    await p.getByRole("button", { name: "Add a step between step 3 and step 4" }).click(); await p.waitForTimeout(400);
    await p.keyboard.type("Spray the oil over the filling and sprinkle the sesame.");
    await note(p, ".st", "<b>New:</b> the new step is step 4, the cursor in it; bake and rest are now 5 and 6. I write it and tap Save changes.", [], "afterend");
    await p.evaluate(() => { const r = document.querySelectorAll(".st-row")[3]; if (r) r.style.cssText += ";outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px"; });
    await tall(p, R5, "2b", "card:Steps", ".board-note"); await clean(p);
    await p.getByRole("button", { name: "Save changes" }).click(); await p.waitForTimeout(700);
    await note(p, "card:Steps", "<b>New:</b> the recipe's steps, in the right order.", [], "afterend");
    await tall(p, R5, "2c", "card:Steps", ".board-note"); await p.context().close();
  } catch (e) { console.log("ERR", e.message); } finally { await b.close(); server.kill(); }
})();
