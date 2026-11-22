// Board B157 (Coach Milan 22 November 2026, 21:11 to 21:12): after DT336 (0.3.174), a sweet tea named in Serbian (Čaj sa
// šećerom) or an Ice Tea, with no category and no values in the database, still counts as 0. Today on top, new below. One
// scratch build of main (/home/claude/work/b157, not committed); the flag board-new turns the new behaviour on. The product
// database's answer is given in place of it.
const ROOT = process.env.BOARD_ROOT || "/home/claude/work/b157";
const { chromium } = require(ROOT + "/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs"), path = require("node:path");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs157", PORT = "3698", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = []; seed.meals = []; seed.feedback = [];
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;position:relative;z-index:5`;
const none = { calories: null, protein: null, fats: null, carbs: null, fiber: null, table: [], noValues: true, categories: [], source: "Open Food Facts · 2026-11-22" };
const SR = { product_name: "Čaj sa šećerom", brand: "Bašta & Co", barcode: "8600000000011", ...none };
const ICE = { product_name: "Ice Tea Peach", brand: "Cool & Co", barcode: "4009300000021", ...none };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
  const open = async (isNew, product) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, permissions: ["camera"], timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.route("**/api/product/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(product) }));
    await p.route("**/api/offphoto**", (r) => r.fulfill({ status: 404, contentType: "application/json", body: "{}" }));
    await p.addInitScript(([s, isNew]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      if (isNew) localStorage.setItem("board-new", "1"); localStorage.setItem("seeded", "1"); }, [seed, isNew]);
    await require(path.join(ROOT, "tests/flows/adult.cjs"))(p);
    await p.goto(U + "/"); await p.waitForTimeout(900);
    await require(path.join(ROOT, "tests/flows/foods.cjs"))(p);
    await p.addStyleTag({ content: ".chat-fab { display: none !important }" });
    await p.getByRole("button", { name: "Add a food" }).click(); await p.waitForTimeout(200);
    await (await require(path.join(ROOT, "tests/flows/more.cjs"))(p, "scan")).click(); await p.waitForTimeout(1500);
    await p.getByRole("button", { name: /^Barcode$/ }).click(); await p.waitForTimeout(300);
    await p.locator('input[aria-label="Type the barcode"]').fill(product.barcode); await p.keyboard.press("Enter"); await p.waitForTimeout(500);
    return p;
  };
  const note = (p, sel, html, marks = [], where = "afterend") => p.evaluate(([sel, html, marks, MARK, NOTE, where]) => { for (const m of marks) { const e = document.querySelector(m); if (e) e.style.cssText += ";" + MARK; }
    const t = document.querySelector(sel); const n = document.createElement("div"); n.className = "board-note"; n.style.cssText = NOTE; n.innerHTML = html; (t ?? document.body).insertAdjacentElement(t ? where : "afterbegin", n); }, [sel, html, marks, MARK, NOTE, where]);
  const clean = (p) => p.evaluate(() => { document.querySelectorAll(".board-note").forEach((n) => n.remove()); document.querySelectorAll("[style*='outline: 3px']").forEach((e) => (e.style.outline = "")); });
  const at = (p, sel, off = 120) => p.evaluate(([sel, off]) => { const e = document.querySelector(sel); if (e) e.scrollIntoView({ block: "start" }); window.scrollBy(0, -off); document.querySelectorAll(".sheet, .sheet-body, [class*=sheet]").forEach((x) => { const r = e?.getBoundingClientRect(); if (r && x.scrollHeight > x.clientHeight) x.scrollTop += r.top - off; }); }, [sel, off]);
  const shot = async (p, name) => { await p.waitForTimeout(350); await p.screenshot({ path: `${R}/${name}.png` }); console.log(name); };
  const center = (p, sel) => p.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: "center" }), sel);
  try {
    // B157.1: today (0.3.174), Čaj sa šećerom counts as 0
    let p = await open(false, SR);
    await note(p, 'input[aria-label="Type the barcode"]', "Čaj sa šećerom, tea with sugar, its barcode typed. The database has its name, no category and no values. I tap Use the code only.", ['input[aria-label="Type the barcode"]']);
    await shot(p, "1a"); await clean(p);
    await p.getByRole("button", { name: "Use the code only" }).click(); await p.waitForTimeout(1800);
    await at(p, ".zero-line", 260); await note(p, ".zero-line", "The name says Čaj, and šećerom is not the word šećer, so nothing blocks the 0. A tea with sugar counts as 0.", [".zero-line"]);
    await shot(p, "1b"); await clean(p);
    await p.getByRole("button", { name: /Confirm & save food/ }).click(); await p.waitForTimeout(1300);
    await center(p, ".readout-none"); await note(p, ".readout-none", "Saved with 0 kcal and 0 protein, with no question. The sugar is never counted.", [".readout-none"]);
    await shot(p, "1c"); await clean(p); await p.context().close();
    // B157.2: new, the heads-up, then the values from the pack
    p = await open(true, SR);
    await note(p, 'input[aria-label="Type the barcode"]', "<b>No change:</b> Čaj sa šećerom, its barcode typed. I tap Use the code only.", ['input[aria-label="Type the barcode"]']);
    await shot(p, "2a"); await clean(p);
    await p.getByRole("button", { name: "Use the code only" }).click(); await p.waitForTimeout(1800);
    await at(p, ".none-line", 200); await note(p, ".none-line", "<b>New:</b> šećerom is a form of šećer, so the 0 is blocked. The amber heads-up of DT336 AC7: type the values from the pack.", [".none-line"]);
    await shot(p, "2b"); await clean(p);
    for (const [n, v] of [["Energy", "30"], ["Fat", "0"], ["Carbohydrate", "7.5"], ["Protein", "0"]]) await p.getByLabel(n, { exact: true }).fill(v);
    await p.getByLabel(/I checked the values/).check(); await p.waitForTimeout(200);
    await center(p, ".primary.wide"); await note(p, ".primary.wide", "<b>No change:</b> I type the values from the pack (30 kcal, 7.5 g carbohydrate), tick the box and tap Confirm & save, as for any product with no values.", [], "beforebegin");
    await shot(p, "2c"); await clean(p);
    await p.getByRole("button", { name: /Confirm & save food/ }).click(); await p.waitForTimeout(1300);
    await center(p, ".readout"); await note(p, ".readout", "<b>No change:</b> saved with its values from the pack. The sugar counts.", [".readout"]);
    await shot(p, "2d"); await clean(p); await p.context().close();
    // B157.3: Ice Tea, written without the d
    p = await open(true, ICE);
    await note(p, 'input[aria-label="Type the barcode"]', "<b>No change:</b> Ice Tea Peach, its barcode typed. No category and no values. I tap Use the code only.", ['input[aria-label="Type the barcode"]']);
    await shot(p, "3a"); await clean(p);
    await p.getByRole("button", { name: "Use the code only" }).click(); await p.waitForTimeout(1800);
    await at(p, ".none-line", 200); await note(p, ".none-line", "<b>New:</b> Ice Tea blocks the 0, as iced tea and Eistee do. Today it counts as 0.", [".none-line"]);
    await shot(p, "3b"); await clean(p); await p.context().close();
  } catch (e) { console.log("ERR", e.message); } finally { await b.close(); server.kill(); }
})();
