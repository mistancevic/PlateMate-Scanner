// Board DT339 (Coach Milan 22 November 2026, 18:43 to 18:46; Draw 23 November 11:17): a nutrition table printed in several
// languages shows the app's own names. Main on top (0.3.179), new below. One scratch build of main
// (/home/claude/work/dt339, not committed); the flag board-new turns the new names on.
const ROOT = process.env.BOARD_ROOT || "/home/claude/work/dt339";
const { chromium } = require(ROOT + "/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs"), path = require("node:path");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs339", PORT = "3703", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.meals = []; seed.feedback = []; seed.items = [];
// a pack sold in Czechia, Croatia, Bulgaria and Greece: every line printed in four languages, joined with slashes
const T = [["Energetická hodnota/Energetska vrijednost/Енергийна стойност/Ενέργεια", 520, "kcal"], ["Tuky/Masti/Мазнини/Λιπαρά", 28, "g"],
  ["z toho nasycené mastné kyseliny/od kojih zasićene masne kiseline/от които наситени мастни киселини/εκ των οποίων κορεσμένα", 9.5, "g", true],
  ["Sacharidy/Ugljikohidrati/Въглехидрати/Υδατάνθρακες", 58, "g"], ["z toho cukry/od kojih šećeri/от които захари/εκ των οποίων σάκχαρα", 35, "g", true],
  ["Vláknina/Vlakna/Влакнини/Φυτικές ίνες", 3, "g"], ["Bílkoviny/Bjelančevine/Белтъчини/Πρωτεΐνες", 7, "g"], ["Sůl/Sol/Сол/Αλάτι", 0.3, "g"],
  ["Vápník/Kalcij/Калций/Ασβέστιο", 120, "mg"]];
const food = { ...seed.foods[0], id: "f-wafer", name: "Hazelnut wafers", brand: "Lumi", source: "Label photo · review required", calories: 520, protein: 7, fats: 28, carbs: 58, fiber: 3, icon: "🧇",
  table: T.map(([name, amount, unit, sub]) => ({ name, amount, unit, sub: !!sub, source: "label" })) };
seed.foods = [food, ...seed.foods.filter((f) => f.id !== "f-wafer")];
const NOTES = {
  "1": { a: "The card shows every line as printed, in four languages. Fat, carbohydrate and protein show twice: Fat 28 g, and Tuky/Masti/Мазнини/Λιπαρά 28 g. The app did not know Tuky, so it added its own Fat line.",
    b: "Review the label: the same, with long names that wrap into tall rows, and the doubled lines." },
  "2": { a: "<b>New:</b> each line the app knows shows its own name, in the app's language. The printed name stays, small under it. Each line once: the app reads every part between the slashes.",
    b: "<b>New:</b> Review the label shows the same names. A line the app does not know keeps its printed name, as today." },
  "4": { a: "<b>Option B:</b> only the app's names. A line above the table says: Tap a line to see its name as printed on the pack. A small › marks the lines that have one. I tap Fat.",
    b: "<b>Option B:</b> under Fat, its name as printed: Tuky/Masti/Мазнини/Λιπαρά. A second tap closes it." },
  "3": { a: "<b>New:</b> in Srpski the same pack reads Energija, Masti, Ugljeni hidrati, Proteini; the printed name stays under each.", b: "" } };
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;position:relative;z-index:5`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async (isNew, lang, tap) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: +(process.env.VH || 1500) }, deviceScaleFactor: 1, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-11-23T11:00:00+01:00"));
    await p.addInitScript(([s, isNew, lang, tap]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      if (lang) localStorage.setItem("chefmealan-lang", lang);
      if (isNew) localStorage.setItem("board-new", "1"); if (tap) localStorage.setItem("board-tap", "1"); localStorage.setItem("seeded", "1"); }, [seed, isNew, lang, tap]);
    await require(path.join(ROOT, "tests/flows/adult.cjs"))(p);
    return p;
  };
  const note = (p, sel, html, marks = [], where = "afterend") => p.evaluate(([sel, html, marks, MARK, NOTE, where]) => { for (const m of marks) document.querySelectorAll(m).forEach((e) => (e.style.cssText += ";" + MARK));
    const t = document.querySelector(sel); const n = document.createElement("div"); n.className = "board-note"; n.style.cssText = NOTE; n.innerHTML = html; (t ?? document.body).insertAdjacentElement(t ? where : "afterbegin", n); }, [sel, html, marks, MARK, NOTE, where]);
  const top = (p, sel, off = 80) => p.evaluate(([sel, off]) => { const e = document.querySelector(sel); if (!e) return; e.scrollIntoView({ block: "start" }); window.scrollBy(0, -off); }, [sel, off]);
  // a sheet that scrolls becomes one tall picture: its scroll boxes open up, and the shot runs from the sheet's top to the note
  const unroll = (p, sel) => p.evaluate((sel) => { let e = document.querySelector(sel); const boxes = [];
    while (e && e !== document.body) { const cs = getComputedStyle(e); if (/(auto|scroll)/.test(cs.overflowY) || cs.position === "fixed" || cs.maxHeight !== "none") boxes.push(e); e = e.parentElement; }
    const at = boxes.map((x) => x.getBoundingClientRect());
    boxes.forEach((x, i) => { x.dataset.w = at[i].width; x.dataset.l = at[i].left; });
    for (const x of boxes) { x.style.maxHeight = "none"; x.style.height = "auto"; x.style.overflow = "visible"; if (getComputedStyle(x).position === "fixed") { x.style.position = "absolute"; x.style.bottom = "auto"; x.style.left = x.dataset.l + "px"; x.style.right = "auto"; } x.style.width = x.dataset.w + "px"; x.style.boxSizing = "border-box"; }
    window.scrollTo(0, 0); }, sel);
  const tall = async (p, name, sel, from) => { await p.waitForTimeout(400);
    const r = await p.evaluate(([sel, from]) => { const a = (from === "dialog" ? document.querySelector(sel).closest('[role="dialog"], .modal, .sheet') ?? document.querySelector(sel) : document.querySelector(from)).getBoundingClientRect(), n = [...document.querySelectorAll(".board-note")].pop() ?? document.querySelector(sel); const z = n.getBoundingClientRect(); return { y: a.top + scrollY - 8, h: z.bottom - a.top + 24 }; }, [sel, from]);
    await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y: Math.max(0, r.y), width: 390, height: r.h } }); console.log(name, Math.round(r.h)); };
  const shot = async (p, name, h) => { await p.waitForTimeout(400); if (h) await p.setViewportSize({ width: 390, height: h }); await p.waitForTimeout(200); await p.screenshot({ path: `${R}/${name}.png` }); console.log(name); };
  try {
    for (const flow of (process.env.FLOWS || "1,2").split(",")) {
      const N = flow !== "1"; const p = await open(N, flow === "3" ? "sr-Latn" : null, flow === "4");
      await p.goto(U + "/"); await p.waitForTimeout(900);
      if (flow === "3") { for (let i = 0; i < 3 && (await p.locator(".menu-row").filter({ hasText: /^Namirnice$/ }).count()) === 0; i++) { await p.getByRole("button", { name: "Meni" }).first().click(); await p.waitForTimeout(250); }
        await p.locator(".menu-row").filter({ hasText: /^Namirnice$/ }).first().click(); await p.waitForTimeout(400); }
      else await require(path.join(ROOT, "tests/flows/foods.cjs"))(p);
      await p.getByText("Hazelnut wafers", { exact: true }).first().click(); await p.waitForTimeout(700);
      await unroll(p, ".label-table-read");
      await note(p, ".label-table-read", NOTES[flow].a, [flow === "4" ? ".lt-hint" : ".label-table-read", ".label-table-read"], "afterend");
      await tall(p, `${flow}a`, ".label-table-read", ".foodcard-head");
      await p.evaluate(() => document.querySelectorAll(".board-note").forEach((n) => n.remove()));
      if (flow === "4") { // option B: the printed name behind a tap on the line
        await p.locator(".label-table-read .lt-row").filter({ hasText: /^Fat/ }).first().click(); await p.waitForTimeout(300);
        await note(p, ".label-table-read", NOTES["4"].b, [".label-table-read .lt-row.open"], "afterend");
        await tall(p, "4b", ".label-table-read", ".foodcard-head");
        await p.context().close(); continue; }
      if (flow === "3") { await p.context().close(); continue; }
      await p.getByRole("button", { name: /^Review the label/ }).first().click(); await p.waitForTimeout(900);
      await unroll(p, ".label-table");
      await note(p, ".label-table", NOTES[flow].b, [".label-table"], "afterend");
      await tall(p, `${flow}b`, ".label-table", "dialog");
      await p.context().close();
    }
  } catch (e) { console.log("ERR", e.message); } finally { await b.close(); server.kill(); }
})();
