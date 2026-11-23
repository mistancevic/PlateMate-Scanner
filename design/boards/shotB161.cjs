// Board B161 (Coach Milan 23 November 2026, 19:03 to 21:34): typing a space at the end of a step drops the cursor, with Samsung
// Keyboard. Not reproduced in the browser here; the change is not visible, so both pictures are the same screen of main
// (0.3.189), Edit recipe's steps with the cursor at the end of step 2, each with its own note.
const ROOT = "/home/claude/platemate-scanner";
const { chromium } = require(ROOT + "/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs"), path = require("node:path");
const R = "/home/claude/boards/rs161", PORT = "3713", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const food = (id, name, extra = {}) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories: 400, protein: 6, carbs: 36, fats: 25, fiber: 1, photo: undefined, photos: undefined, ...extra });
const P = food("p", "Frischer Blätterteig", { barcode: "1" }); const it = { id: "b", food: P, grams: 375, locked: false };
const recipe = { id: "m-burek", title: "Lazy Burek", items: [it], portion: 375, savedAt: "2026-11-23T16:00:00Z", steps: ["Preheat your oven to 200 °C.", "Put baking paper and lay out [[i:b|frischer blätterteig]]", "Bake at 200 °C for 25 minutes."] };
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;position:relative;z-index:5`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  for (const [name, html] of [["1a", "With Samsung Keyboard, a space typed at the end of step 2 drops the cursor out of the field; typing works only right after the last word (Coach Milan, 19:03). The field saves on every key and the page is drawn again while the keyboard still builds the word."],
    ["2a", "<b>New:</b> nothing changes on screen. While the keyboard builds a word, the field waits; it saves once the word is in. Only the ticks on the food buttons are drawn again. A space at the end of a step keeps the cursor there."]]) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 1, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, { ...seed, foods: [...seed.foods, P], meals: [recipe], feedback: [] });
    await require(path.join(ROOT, "tests/flows/adult.cjs"))(p);
    await p.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.goto(U + "/my-recipes/m-burek"); await p.waitForTimeout(1500);
    await p.evaluate(() => { document.querySelectorAll(".chat-fab").forEach((e) => (e.style.display = "none")); const st = document.createElement("style"); st.textContent = "header, .topbar, .bottom-nav { position: static !important; } .bottom-nav { display: none !important; }"; document.head.appendChild(st); });
    await p.getByRole("button", { name: "Edit recipe" }).click(); await p.waitForTimeout(500);
    const f = p.getByRole("textbox", { name: "Step 2" }); await f.click();
    await p.evaluate(() => { const el = document.querySelector('[aria-label="Step 2"]'); const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); });
    await p.keyboard.type(" "); await p.waitForTimeout(200);
    await p.evaluate(([html, MARK, NOTE]) => { const el = document.querySelector('[aria-label="Step 2"]'); el.style.cssText += ";" + MARK; const n = document.createElement("div"); n.className = "board-note"; n.style.cssText = NOTE; n.innerHTML = html; el.closest(".st-row").insertAdjacentElement("afterend", n); }, [html, MARK, NOTE]);
    await p.waitForTimeout(300);
    const r = await p.evaluate(() => { const c = [...document.querySelectorAll("section.card")].find((x) => (x.querySelector("b")?.textContent || "").trim() === "Steps"); const a = c.getBoundingClientRect(); const z = c.querySelector(".st-add").getBoundingClientRect(); return { y: a.top + scrollY - 10, h: z.bottom - a.top + 30 }; });
    await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y: r.y, width: 390, height: r.h } }); console.log(name);
    await ctx.close();
  }
  await b.close(); server.kill();
})();
