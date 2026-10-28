// DT142 (Anna's DT123, brought up to 0.2.126 and DT136's one list of places): where you shop and cook, in setup
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = []; seed.foods = [];
const PORT = "3313", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  await page.clock.setFixedTime(new Date("2026-10-28T19:05:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "female", birthYear: 1990, heightCm: 170, weightKg: 66, plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-28T16:00:00Z", consentBodyAt: "2026-10-28T16:00:00Z", declaredAt: "2026-10-28T16:00:00Z", aiConfirmedAt: "2026-10-28T16:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require(path.join(ROOT, "tests/flows/adult.cjs"))(page);
  const R = "/home/claude/boards/rs";
  const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742";
  const flat = () => page.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue; if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } window.scrollTo(0, 0); });
  const shot = async (name) => { await page.waitForTimeout(400); await flat(); await page.waitForTimeout(200); await page.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log("shot " + name); };
  const note = (sel, text, where = "before") => page.evaluate(({ sel, text, NOTE, where }) => { const el = document.querySelector(sel); if (!el) return; const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = text; el[where](d); }, { sel, text, NOTE, where });
  // DT142a, now: Apply ends setup on Today
  await page.goto(U + "/"); await page.waitForTimeout(1300);
  await page.getByRole("button", { name: /^Maintain/ }).first().click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: /^Apply from today/ }).click(); await page.waitForTimeout(900);
  await page.evaluate((mark) => { const t = document.querySelector(".toast"); if (t) { t.style.cssText += ";position:static;" + mark; document.querySelector("main")?.prepend(t); } }, mark);
  await note("main > *:first-child", "Now (0.2.126): Apply ends setup on Today. Setup never asked where she lives, which kitchens she cooks or what she cooks with; she found Where I shop and cook by chance in Me, and the starter foods it added had no list and no link.");
  await shot("r142a");
  // DT142b, new: one more step after Apply, the same list as Me, Where I shop and cook
  await page.goto(U + "/me/shop"); await page.waitForTimeout(1300);
  await page.evaluate(({ mark }) => {
    const h = document.querySelector("main h2, main .page-title, main h1"); const first = document.querySelector("section.card.place-rows");
    const top = document.createElement("div"); top.innerHTML = '<p class="label calc-step" style="font-size:16px">4. Where you shop and cook</p><p class="small muted">Home brings its starter foods. The kitchens and what you cook with tell Chef Mealan what to suggest. You can change all of it in Me later.</p>'; top.style.cssText = mark + ";padding:6px 8px;margin-bottom:8px"; first?.before(top);
    const names = [...document.querySelectorAll(".place-row b")].map((x) => x.textContent);
    first.innerHTML = '<b>Where do you live and shop?</b><small style="display:block;margin:4px 0 8px;color:#5b6478">Home: its starter foods come with it, and Chef Mealan knows which shops you can really buy from.</small><div class="moments">' + names.map((n) => '<button class="choice">' + n + '</button>').join("") + '</div>';
    const main = document.querySelector("main"); const kids = [...main.querySelectorAll(":scope > *")]; const last = kids.filter((k) => !/menu-list|next/.test(k.className)).pop();
    for (const k of main.querySelectorAll(".menu-list")) k.style.display = "none";
    const cta = document.createElement("div"); cta.style.cssText = "margin:14px 0;" + mark + ";padding:8px";
    cta.innerHTML = '<button class="pill pill-primary pill-wide">Done: to Today</button><small style="display:block;margin-top:6px;color:#5b6478">Pick home first; the button says so until you do.</small>';
    main.appendChild(cta);
  }, { mark });
  await note("section.card.place-rows", "New: after Apply, on the first setup, one more step. Where do you live and shop? One tap picks home; its starter foods come with it. The kitchens and what you cook with follow, as in Me. It ends on Done: to Today. Other places and trips stay in Me and on Plan.");
  await shot("r142b");
  // DT142c, new: home picked; the starter foods say how many and link to Foods
  await page.goto(U + "/me/shop"); await page.waitForTimeout(1200);
  await page.locator(".place-row").filter({ hasText: /^Limassol/ }).getByRole("button", { name: "Make it home" }).click(); await page.waitForTimeout(800);
  await page.evaluate(({ mark }) => {
    const rows = document.querySelector("section.card.place-rows");
    const n = JSON.parse(localStorage.getItem("platemate-pilot-v1")).foods.length;
    const names = ["Munich", "Germany, elsewhere", "Austria", "Switzerland", "Belgrade", "Serbia, elsewhere", "Madrid", "Spain, elsewhere", "Limassol", "Cyprus, elsewhere", "Elsewhere"];
    rows.innerHTML = '<b>Where do you live and shop?</b><div class="moments" style="margin-top:8px">' + names.map((x) => '<button class="choice ' + (x === "Limassol" ? "on" : "") + '">' + x + '</button>').join("") + '</div>';
    const s = document.createElement("div"); s.style.cssText = "margin:10px 0;padding:8px;" + mark; s.innerHTML = '<b>' + n + ' starter foods for Limassol</b><small style="display:block">The common ones and fifty Cypriot, with their Greek names. <a class="link">See them in Foods ›</a></small>';
    rows.appendChild(s);
    for (const k of document.querySelectorAll("main .menu-list")) k.style.display = "none";
    const cta = document.createElement("div"); cta.style.cssText = "margin:14px 0;" + mark + ";padding:8px"; cta.innerHTML = '<button class="pill pill-primary pill-wide">Done: to Today</button>'; document.querySelector("main").appendChild(cta);
  }, { mark });
  await note("section.card.place-rows", "New: Limassol picked as home. The starter foods say how many came, and See them in Foods opens the list. Done: to Today ends setup.");
  await shot("r142c");
  await b.close(); server.kill();
})();
