// Board B169 (Coach Milan 25 November 2026, 15:55 to 15:59, option A): the app's first starter foods (typical values, check
// your pack) were saved as read from a label, so since B163 a step keeps their capital: Chicken breast. They are basic foods:
// small letters, as B163 wants for basic foods. Before: main, 0.3.193 (BEFORE_ROOT, this repo, built). New: one scratch build
// of main with the change (/home/claude/work/b169, not committed). The recipe holds two starter foods and one pack.
const path = require("node:path"), fs = require("node:fs"), { spawn } = require("node:child_process");
const NEW_ROOT = process.env.BOARD_ROOT || "/home/claude/work/b169", OLD_ROOT = process.env.BEFORE_ROOT || path.resolve(__dirname, "../..");
const { chromium } = require(NEW_ROOT + "/node_modules/playwright");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs169"; fs.mkdirSync(R, { recursive: true });
const seed = JSON.parse(fs.readFileSync(path.join(OLD_ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const F = (id) => seed.foods.find((f) => f.id === id);
const P = { ...F("f-skyr"), id: "p", name: "Frischer Blätterteig", brand: "", source: "label", barcode: "4056489000002", calories: 400, protein: 6, carbs: 36, fats: 25, fiber: 1.5 };
const it = (id, f, g) => ({ id, food: f, grams: g, locked: false });
const I = { e: it("a", F("f-egg"), 120), c: it("b", F("f-chicken"), 100), p: it("c", P, 125) };
const tok = (x, n) => `[[i:${x.id}|${n}]]`;
const recipe = { id: "m-pie", title: "Chicken pie", items: Object.values(I), portion: 345, savedAt: "2026-11-25T12:00:00Z",
  steps: [`Whisk ${tok(I.e, "eggs")}.`, `Fold in ${tok(I.c, "chicken breast")} and cook slowly.`, `Lay out ${tok(I.p, "Frischer Blätterteig")}, fill it and bake at 200 °C for 25 minutes.`] };
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;position:relative;z-index:5;white-space:normal`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const serve = async (root, port) => { const s = spawn(process.execPath, ["dist/server.cjs"], { cwd: root, env: { ...process.env, NODE_ENV: "production", PORT: port, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(`http://127.0.0.1:${port}/`); break; } catch { await sleep(500); } } return s; };
(async () => {
  const b = await chromium.launch();
  const open = async (port) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-11-25T16:00:00+01:00"));
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, { ...seed, foods: [...seed.foods, P], meals: [recipe], feedback: [] });
    await require(path.join(OLD_ROOT, "tests/flows/adult.cjs"))(p);
    await p.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.goto(`http://127.0.0.1:${port}/my-recipes/m-pie`); await sleep(1500);
    await p.evaluate(() => { const st = document.createElement("style"); st.textContent = "header, .topbar, .bottom-nav, nav { position: static !important; } .bottom-nav, .chat-fab { display: none !important; }"; document.head.append(st); });
    return p;
  };
  const STEPS = "JS:[...document.querySelectorAll('section.card')].find((x) => (x.querySelector('b')?.textContent || '').trim() === 'Steps')";
  const EDIT = "JS:document.querySelector('.st-field')?.closest('section') || document.querySelector('.st-field')?.parentElement";
  const pick = (q) => `(${q.slice(3)})`;
  const note = (p, sel, html) => p.evaluate(([sel, html, MARK, NOTE]) => { const t = eval(sel); if (!t) return "missing"; t.style.cssText += ";" + MARK;
    const n = document.createElement("div"); n.className = "board-note"; n.style.cssText = NOTE; n.innerHTML = html; t.insertAdjacentElement("afterend", n); return "ok"; }, [pick(sel), html, MARK, NOTE]);
  const shot = async (p, name, sel) => { await p.mouse.move(2, 2); await sleep(400);
    const r = await p.evaluate((sel) => { const a = eval(sel).getBoundingClientRect(), z = document.querySelector(".board-note").getBoundingClientRect(); return { y: a.top + scrollY - 12, h: z.bottom - a.top + 26 }; }, pick(sel));
    await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y: Math.max(0, r.y), width: 390, height: r.h } }); console.log(name, Math.round(r.h)); };
  const edit = async (p) => { await p.getByRole("button", { name: "Edit recipe", exact: true }).click(); await sleep(900); };
  let s1, s2;
  try {
    s1 = await serve(OLD_ROOT, "3721");
    let p = await open("3721");
    console.log(await note(p, STEPS, "Step 2 says <b>Chicken breast</b> with a capital: it is one of the app's first starter foods, saved as read from a label. <b>Frischer Blätterteig</b> is a pack, as printed. Eggs are counted, so they read 2 eggs (L) either way. I tap Edit recipe."));
    await shot(p, "69-1a", STEPS); await p.evaluate(() => document.querySelectorAll(".board-note").forEach((n) => n.remove())); await edit(p);
    console.log(await note(p, EDIT, "Edit recipe's steps say the same: <b>Chicken breast</b>. The list under the steps names each food as saved, as before."));
    await shot(p, "69-1b", EDIT); await p.context().close(); s1.kill();
    s2 = await serve(NEW_ROOT, "3722");
    p = await open("3722");
    console.log(await note(p, STEPS, "<b>New:</b> the starter food is a basic food, in small letters: <b>chicken breast</b>. The pack stays as printed: <b>Frischer Blätterteig</b>. Nothing saved changes; the name comes from the food each time."));
    await shot(p, "69-2a", STEPS); await p.evaluate(() => document.querySelectorAll(".board-note").forEach((n) => n.remove())); await edit(p);
    console.log(await note(p, EDIT, "<b>New:</b> Edit recipe's steps say the same: <b>chicken breast</b>. The list under the steps is as before."));
    await shot(p, "69-2b", EDIT); await p.context().close();
  } catch (e) { console.log("ERR", e.message.slice(0, 300)); } finally { await b.close(); s1?.kill(); s2?.kill(); }
})();
