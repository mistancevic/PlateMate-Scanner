// Board B170 (Coach Milan 25 November 2026, 19:37 to 19:44: A, then draw). A shared recipe keeps each food's source, barcode and
// basic food. Before: main, 0.3.195 (BEFORE_ROOT, this repo, built). New: one scratch build of main with the change
// (/home/claude/work/b170, not committed). Two phones: Sam (an invented name) shares Lazy Burek; I open it in Members.
// What members get is what each build's own sharedOf and cleanShared make of Sam's recipe, served by a mock.
const path = require("node:path"), fs = require("node:fs"), { spawn, execFileSync } = require("node:child_process");
const NEW_ROOT = process.env.BOARD_ROOT || "/home/claude/work/b170", OLD_ROOT = process.env.BEFORE_ROOT || path.resolve(__dirname, "../..");
const { chromium } = require(NEW_ROOT + "/node_modules/playwright");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs170"; fs.mkdirSync(R, { recursive: true });
const seed = JSON.parse(fs.readFileSync(path.join(OLD_ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const fd = (id, name, calories, protein, carbs, fats, fiber, barcode) => ({ id, name, brand: "", calories, protein, carbs, fats, fiber, basis: "100g", source: "label", notes: "", reviewedAt: "2026-11-20T10:00:00Z", readyToEat: false, ...(barcode ? { barcode } : {}) });
const tworog = fd("s-tw", "Körniger Frischkäse Tworog 2,5% Fett", 100, 12, 3, 4.5, 0, "4000000000011");
const feta = fd("s-fe", "Feta Leicht", 180, 17, 1, 12, 0, "4000000000028");
const teig = fd("s-te", "Frischer Blätterteig", 400, 6, 36, 25, 1.5, "4000000000035");
const eggs = { ...fd("s-eg", "Eggs", 143, 12.6, 0.7, 9.5, 0), source: "Reference table", refId: "egg-whole" };
const tok = (id, n) => `[[i:${id}|${n}]]`;
const burek = { id: "m-burek", title: "Lazy Burek", kitchen: "Balkan", portion: 897, savedAt: "2026-11-24T17:00:00Z",
  items: [{ id: "a", grams: 250, part: "Filling", locked: false, food: tworog }, { id: "d", grams: 122, part: "Filling", locked: false, food: eggs }, { id: "h", grams: 150, part: "Filling", locked: false, food: feta }, { id: "b", grams: 375, part: "Base", locked: false, food: teig }],
  steps: [`Mix ${tok("a", "Körniger Frischkäse Tworog 2,5% Fett")}, ${tok("d", "eggs")} and ${tok("h", "Feta Leicht")}.`, `Lay out ${tok("b", "Frischer Blätterteig")}, pour the filling in and bake at 200 °C for 25 minutes.`] };
// my own pack with the same name, another barcode and other values (another size of the same dough)
const mine = { ...fd("f-teig", "Frischer Blätterteig", 330, 5, 32, 19, 1.5, "4000000000042"), icon: "🥐" };
// what members get from each build
const sharedBy = (root) => JSON.parse(execFileSync(process.execPath, ["--import", "tsx", "-e", `const m=require("./src/members.ts");process.stdout.write(JSON.stringify(m.cleanShared(m.sharedOf(${JSON.stringify(burek)},"Balkan"))))`], { cwd: root }).toString());
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;position:relative;z-index:5;white-space:normal`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const serve = async (root, port) => { const s = spawn(process.execPath, ["dist/server.cjs"], { cwd: root, env: { ...process.env, NODE_ENV: "production", PORT: port, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(`http://127.0.0.1:${port}/`); break; } catch { await sleep(500); } } return s; };
(async () => {
  const b = await chromium.launch();
  const open = async (port, state, shared, url) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-11-25T19:30:00+01:00"));
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, state);
    await require(path.join(OLD_ROOT, "tests/flows/adult.cjs"))(p);
    await p.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.route("**/api/members**", (r) => r.request().method() === "GET" ? r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ recipes: shared ? [shared] : [] }) }) : r.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
    await p.goto(`http://127.0.0.1:${port}${url}`); await sleep(1600);
    if (url === "/") { await p.locator("nav button").filter({ hasText: "Recipes" }).click(); await sleep(1500); }
    await p.evaluate(() => { const st = document.createElement("style"); st.textContent = "header, .topbar, .bottom-nav, nav { position: static !important; } .bottom-nav, .chat-fab { display: none !important; } section.nt-card, section.rq-howmuch { display: none !important; }"; document.head.append(st); });
    return p;
  };
  const note = (p, sel, html, marks = []) => p.evaluate(([sel, html, marks, MARK, NOTE]) => { const q = (s) => (s.startsWith("JS:") ? [eval(s.slice(3))].flat().filter(Boolean) : [...document.querySelectorAll(s)]);
    for (const m of marks) q(m).forEach((e) => { e.dataset.bm = "1"; e.style.cssText += ";" + MARK; });
    const t = q(sel)[0]; if (!t) return "missing " + sel; const n = document.createElement("div"); n.className = "board-note"; n.style.cssText = NOTE; n.innerHTML = html; t.insertAdjacentElement("afterend", n); return "ok"; }, [sel, html, marks, MARK, NOTE]);
  const clean = (p) => p.evaluate(() => { document.querySelectorAll(".board-note").forEach((n) => n.remove()); document.querySelectorAll("[data-bm]").forEach((e) => { e.style.outline = ""; delete e.dataset.bm; }); });
  const shot = async (p, name, from, to) => { await p.mouse.move(2, 2); await sleep(400);
    const r = await p.evaluate(([from, to]) => { const q = (s) => (s.startsWith("JS:") ? eval(s.slice(3)) : document.querySelector(s)); const a = q(from).getBoundingClientRect(), e = to ? q(to)?.getBoundingClientRect() : null; const notes = [...document.querySelectorAll(".board-note")].map((n) => n.getBoundingClientRect().bottom);
      return { y: a.top + scrollY - 12, h: Math.max(e ? e.bottom : a.bottom, ...notes) - a.top + 26 }; }, [from, to]);
    await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y: Math.max(0, r.y), width: 390, height: r.h } }); console.log(name, Math.round(r.h)); };
  const STEPS = "section.rq-steps", CARD = ".rq-readout";
  const runs = [["1", OLD_ROOT, "3725", "main, 0.3.195"], ["2", NEW_ROOT, "3726", "new"]];
  for (const [row, root, port, label] of runs) {
    const isNew = row === "2", shared = sharedBy(root); let s;
    console.log(label, "teig as members get it:", JSON.stringify(shared.items[3].food));
    try {
      s = await serve(root, port);
      // Sam's phone: Sam's own recipe
      let p = await open(port, { ...seed, foods: [...seed.foods, tworog, feta, teig, eggs], meals: [burek], feedback: [] }, null, "/my-recipes/m-burek");
      console.log(await note(p, STEPS, isNew ? "<b>No change:</b> on Sam's phone the packs keep their names as printed. Sam shares Lazy Burek with members."
        : "On <b>Sam's phone</b>: Sam's own Lazy Burek. The packs were scanned, so their names stay as printed: Körniger Frischkäse Tworog, Feta Leicht, Frischer Blätterteig. Sam shares it with members.", [STEPS]));
      await shot(p, `70-${row}a`, CARD, STEPS); await p.context().close();
      // my phone: Members, then the copy
      p = await open(port, { ...seed, foods: [...seed.foods, mine], meals: [], feedback: [] }, { ...shared, id: "s-burek", name: "Sam", cover: null, coverKind: "drawn", sharedAt: "2026-11-24T18:00:00Z", updatedAt: "2026-11-24T18:00:00Z", made: 2 }, "/");
      await p.locator(".recipe-tile").filter({ hasText: "Lazy Burek" }).first().click(); await sleep(900);
      console.log(await note(p, STEPS, isNew ? "<b>New:</b> sharing keeps each food's source and barcode, so on <b>my phone</b> the steps name the packs as Sam's do. The numbers: 2,194 kcal, as before."
        : "On <b>my phone</b>, in Members: the same recipe. Sharing dropped each food's source and barcode, so the steps write the packs in small letters: körniger frischkäse tworog. The numbers are Sam's: 2,194 kcal. I tap Save to My recipes.", [STEPS, CARD]));
      await shot(p, `70-${row}b`, CARD, STEPS); await clean(p);
      await p.locator("section.rq-actions").getByRole("button", { name: "Save to My recipes" }).click(); await sleep(1200);
      const id = await p.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).meals.find((m) => m.title === "Lazy Burek").id);
      await p.goto(`http://127.0.0.1:${port}/my-recipes/${id}`); await sleep(1500);
      await p.evaluate(() => { const st = document.createElement("style"); st.textContent = "header, .topbar, .bottom-nav, nav { position: static !important; } .bottom-nav, .chat-fab { display: none !important; } section.nt-card, section.rq-howmuch { display: none !important; }"; document.head.append(st); });
      const kcal = await p.locator(CARD + " .rd-rows").first().innerText();
      console.log("copy", label, kcal.replace(/\s+/g, " "));
      console.log(await note(p, STEPS, isNew ? "<b>New:</b> my copy matches foods by barcode first. My own Frischer Blätterteig has another barcode, so it is another pack: the copy keeps Sam's, and its numbers stay Sam's, 2,194 kcal. The steps name the packs as printed. Sam's pack joins my foods next to mine."
        : "<b>My copy</b> in My recipes. I already had a pack called Frischer Blätterteig (another size, 330 kcal). Foods match by name only, so the copy took <b>mine</b>: the recipe now says 1,932 kcal, not Sam's 2,194. That one pack shows as printed because it is mine; Sam's other packs stay in small letters.", [STEPS, CARD]));
      await shot(p, `70-${row}c`, CARD, STEPS); await p.context().close();
    } catch (e) { console.log("ERR", e.message.slice(0, 300)); } finally { s?.kill(); }
  }
  await b.close();
})();
