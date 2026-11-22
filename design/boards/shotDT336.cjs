// Board DT336 (Coach Milan 22 November 2026, 16:22 to 17:35; Draw 19:23): a tea scanned by its barcode, read right, with no
// values in the database, could not be saved. Today on top, new below. One scratch build of main (/home/claude/work/b151, not
// committed); the flag board-new turns the new behaviour on. The product database's answer is given in place of it.
const { chromium } = require("/home/claude/work/b151/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/work/b151", R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs336", PORT = "3697", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = []; seed.meals = []; seed.feedback = [];
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;position:relative;z-index:5`;
const TEA = { product_name: "Peppermint tea", brand: "Herbal & Co", barcode: "4009300000001", calories: null, protein: null, fats: null, carbs: null, fiber: null, table: [] };
const BISCUIT = { product_name: "Oat biscuits", brand: "Bake & Co", barcode: "4009300000002", calories: null, protein: null, fats: null, carbs: null, fiber: null, table: [] };
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
  try {
    for (const flow of ["1", "2", "3"]) {
      const N = flow === "2", prod = flow === "3" ? BISCUIT : TEA;
      const p = await open(N, prod);
      await note(p, 'input[aria-label="Type the barcode"]', flow === "3" ? "<b>No change:</b> a biscuit, its barcode typed. I tap Use the code only." : `${N ? "<b>No change:</b> " : ""}A tea, its barcode typed. I tap Use the code only.`, ['input[aria-label="Type the barcode"]']);
      await shot(p, `${flow}a`); await clean(p);
      await p.getByRole("button", { name: "Use the code only" }).click(); await p.waitForTimeout(1800);
      if (N) { await at(p, ".zero-line", 260); await note(p, ".zero-line", "<b>New:</b> the name says tea and the database has no values. One line says it counts as 0. No question.", [".zero-line"]); }
      else { await at(p, ".label-table", 200); await note(p, ".label-table", flow === "3" ? "<b>No change:</b> the name is read, and every value is empty. I type them from the pack, or scan the table." : "The name and brand are read right. Every value is empty: the pack has no table.", [".label-table"], "beforebegin"); }
      await shot(p, `${flow}b`); await clean(p);
      if (flow === "3") { await p.context().close(); continue; }
      await at(p, ".primary.wide", 420);
      if (!N) { await p.getByRole("button", { name: /Confirm & save food/ }).click(); await p.waitForTimeout(600); await at(p, ".notice", 260); await note(p, ".primary.wide", "I tap Confirm & save. It stops: energy and protein are required, and I am asked to tick that I checked the values. There is nothing to check.", [".notice"]); await shot(p, "1c"); await clean(p); await p.context().close(); continue; }
      await note(p, ".primary.wide", "<b>New:</b> the values are 0, and there is no box to tick. I tap Confirm & save.", [".primary.wide"], "afterend");
      await p.evaluate(() => { const b = document.querySelector(".primary.wide"); b.scrollIntoView({ block: "center" }); });
      await shot(p, "2c"); await clean(p);
      await p.getByRole("button", { name: /Confirm & save food/ }).click(); await p.waitForTimeout(1300);
      const card = p.locator(".sheet").first();
      console.log("CARD", (await card.innerText().catch(() => "none")).replace(/\s+/g, " ").slice(0, 400));
      await p.evaluate(() => { const r = document.querySelector(".readout-none"); r && r.scrollIntoView({ block: "center" }); });
      await note(p, ".readout-none", "<b>New:</b> saved, 0 kcal and 0 protein, with No values on the pack in its notes. No PD, said in words, never a question mark or On plan.", [".readout-none"]);
      await shot(p, "2d"); await clean(p);
      // 2e: on the Plate, next to skyr, oats and a banana
      await p.keyboard.press("Escape"); await p.waitForTimeout(300); const close = p.getByRole("button", { name: "Close" }).first(); if (await close.count()) { await close.click(); await p.waitForTimeout(300); }
      await p.locator("nav button").filter({ hasText: "Plate" }).click(); await p.waitForTimeout(900);
      for (const n of ["Skyr", "Oats", "Banana", "Peppermint tea"]) { await (await require(path.join(ROOT, "tests/flows/more.cjs"))(p)).fill(n); await p.waitForTimeout(400); await p.locator(".row-food").filter({ hasText: n }).first().getByRole("button", { name: /Add/ }).click(); await p.waitForTimeout(700); }
      const x = p.locator(".add-more-top button").first(); if (await x.count()) { await x.click(); await p.waitForTimeout(300); }
      console.log("PLATE", (await p.locator(".readout").first().innerText()).replace(/\s+/g, " "));
      await p.evaluate(() => { const r = [...document.querySelectorAll(".row-food, .row, .rows > *")].find((e) => /Peppermint tea/.test(e.textContent || "")); if (r) { r.id = "tea-row"; r.scrollIntoView({ block: "center" }); } });
      await note(p, "#tea-row", "<b>New:</b> the tea sits on the plate next to skyr, oats and a banana. The plate's energy and protein stay as they were.", ["#tea-row"]);
      await shot(p, "2e"); await clean(p);
      const stored = await p.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).foods.find((x) => x.name === "Peppermint tea"));
      console.log("STORED", JSON.stringify({ c: stored?.calories, p: stored?.protein, f: stored?.fats, n: stored?.notes }));
      await p.context().close();
    }
  } catch (e) { console.log("ERR", e.message); } finally { await b.close(); server.kill(); }
})();
