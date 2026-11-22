// Board B158 (Coach Milan 22 November 2026, 21:46 to 21:48): the heads-up of DT336 AC7 says what to do in one line: the barcode
// has no values, close this, then scan the nutrition table with the camera on Label. Today on top, new below. One scratch
// build of main (/home/claude/work/b157, shared with B157, not committed); the flag board-new turns the new words on. The
// product database's answer and the label read are given in place of them.
const ROOT = process.env.BOARD_ROOT || "/home/claude/work/b157";
const { chromium } = require(ROOT + "/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs"), path = require("node:path");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs158", PORT = "3699", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = []; seed.meals = []; seed.feedback = [];
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;position:relative;z-index:5`;
const BISCUIT = { product_name: "Oat biscuits", brand: "Bake & Co", barcode: "4009300000002", calories: null, protein: null, fats: null, carbs: null, fiber: null, table: [], noValues: true, categories: [], source: "Open Food Facts · 2026-11-22" };
const READ = { success: true, product_name: "Oat biscuits", brand: "Bake & Co", basis: "100g", calories: 452, protein: 7.1, fats: 18, carbs: 62, fiber: 6.5, notes: "", error_reason: "", front_image: 0, table: [] };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
  const open = async (isNew) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, permissions: ["camera"], timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.route("**/api/product/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(BISCUIT) }));
    await p.route("**/api/offphoto**", (r) => r.fulfill({ status: 404, contentType: "application/json", body: "{}" }));
    await p.route("**/api/scan", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(READ) }));
    await p.addInitScript(([s, isNew]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      if (isNew) localStorage.setItem("board-new", "1"); localStorage.setItem("seeded", "1"); }, [seed, isNew]);
    await require(path.join(ROOT, "tests/flows/adult.cjs"))(p);
    await p.goto(U + "/"); await p.waitForTimeout(900);
    await require(path.join(ROOT, "tests/flows/foods.cjs"))(p);
    await p.addStyleTag({ content: ".chat-fab { display: none !important }" });
    await p.getByRole("button", { name: "Add a food" }).click(); await p.waitForTimeout(200);
    await (await require(path.join(ROOT, "tests/flows/more.cjs"))(p, "scan")).click(); await p.waitForTimeout(1500);
    await p.getByRole("button", { name: /^Barcode$/ }).click(); await p.waitForTimeout(300);
    await p.locator('input[aria-label="Type the barcode"]').fill(BISCUIT.barcode); await p.keyboard.press("Enter"); await p.waitForTimeout(500);
    return p;
  };
  const note = (p, sel, html, marks = [], where = "afterend") => p.evaluate(([sel, html, marks, MARK, NOTE, where]) => { for (const m of marks) { const e = document.querySelector(m); if (e) e.style.cssText += ";" + MARK; }
    const t = document.querySelector(sel); const n = document.createElement("div"); n.className = "board-note"; n.style.cssText = NOTE; n.innerHTML = html; (t ?? document.body).insertAdjacentElement(t ? where : "afterbegin", n); }, [sel, html, marks, MARK, NOTE, where]);
  const clean = (p) => p.evaluate(() => { document.querySelectorAll(".board-note").forEach((n) => n.remove()); document.querySelectorAll("[style*='outline: 3px']").forEach((e) => (e.style.outline = "")); });
  const at = (p, sel, off = 120) => p.evaluate(([sel, off]) => { const e = document.querySelector(sel); if (e) e.scrollIntoView({ block: "start" }); window.scrollBy(0, -off); document.querySelectorAll(".sheet, .sheet-body, [class*=sheet]").forEach((x) => { const r = e?.getBoundingClientRect(); if (r && x.scrollHeight > x.clientHeight) x.scrollTop += r.top - off; }); }, [sel, off]);
  const shot = async (p, name) => { await p.waitForTimeout(350); await p.screenshot({ path: `${R}/${name}.png` }); console.log(name); };
  try {
    for (const flow of ["1", "2"]) {
      const N = flow === "2"; const p = await open(N);
      await note(p, 'input[aria-label="Type the barcode"]', `${N ? "<b>No change:</b> " : ""}Oat biscuits, the barcode typed. The database has the name and no values. I tap Use the code only.`, ['input[aria-label="Type the barcode"]']);
      await shot(p, `${flow}a`); await clean(p);
      await p.getByRole("button", { name: "Use the code only" }).click(); await p.waitForTimeout(1800);
      await at(p, ".none-line", 200);
      await note(p, ".none-line", N ? "<b>New words:</b> what happened and what to do, in one line: close this, then the camera on Label." : "The heads-up of 0.3.174: type the values from the pack.", [".none-line"]);
      await shot(p, `${flow}b`); await clean(p);
      if (!N) { await p.context().close(); continue; }
      // the rest of the new flow is the app as it is: close, the camera on Label, the read
      await p.getByRole("button", { name: "Close" }).first().click(); await p.waitForTimeout(600);
      await note(p, ".chips, [class*=chips]", "<b>No change:</b> Close brings me back to Foods. I tap + Add, then Photo or scan.", [], "afterend"); await shot(p, "2c"); await clean(p);
      if (await p.locator("#camera-shutter-button").count() === 0) { const add = p.getByRole("button", { name: "Add a food" }); if (await add.count()) { await add.first().click(); await p.waitForTimeout(300); } }
      if (await p.locator("#camera-shutter-button").count() === 0) await (await require(path.join(ROOT, "tests/flows/more.cjs"))(p, "scan")).click();
      await p.waitForTimeout(1500);
      await p.getByRole("button", { name: /^Label$/ }).click(); await p.waitForTimeout(500);
      await note(p, ".cam-panel", "<b>No change:</b> I picked Label. I take a photo of the nutrition table.", [], "afterbegin");
      await shot(p, "2d"); await clean(p);
      await p.locator("#camera-shutter-button").click(); await p.waitForTimeout(600);
      const an = p.getByRole("button", { name: /Analyze/ }); if (await an.count()) await an.first().click();
      await p.waitForTimeout(1800);
      await at(p, ".label-table", 200); await note(p, ".label-table", "<b>No change:</b> the values are read from the photo. I check them against the pack and save.", [".label-table"], "beforebegin");
      await shot(p, "2e"); await clean(p); await p.context().close();
    }
  } catch (e) { console.log("ERR", e.message); } finally { await b.close(); server.kill(); }
})();
