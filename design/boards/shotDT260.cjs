// Board DT260 (Coach Milan 8 November 08:53 and 08:59): How to, situations and their happy path; a task list for beta testers.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = process.env.ROOT || "/home/claude/platemate-scanner", PORT = "3486", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.feedback = []; seed.items = []; seed.meals = [];
const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 12px;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
const F = "font-family:Nunito,system-ui,sans-serif;color:#172742";
const pill = (t, cls = "") => `<button class="pill pill-small ${cls}" style="min-height:44px">${t}</button>`;
const SITS = [
  ["Every day", [["🍽️", "What should I eat now?", "Tell Chef Mealan what you crave; he fits it to your day.", true, false], ["📷", "I ate something: log it with a photo", "One photo, he reads the foods; say whose and when.", true, false], ["🍲", "I cooked a big batch", "Say how many you made and ate; the rest waits for later.", false, false]]],
  ["Recipes and cooking", [["🖼️", "A recipe from a screenshot", "Instagram, a book, ChatGPT: a photo becomes your recipe.", true, false], ["🎯", "Make a recipe fit my target", "Fit swaps or trims foods, the dish stays the same.", false, false], ["🗣️", "Cook hands free", "Get it ready, then say next, back, timer 5 minutes.", false, true], ["🌍", "A recipe in another language", "Show it, or cook it, in your language.", false, true]]],
  ["Your week", [["📅", "A busy day", "Connect Google Calendar: he moves a meal, or packs it along.", false, false]]],
];
const card = ([ic, t, l, tried, isNew]) => `<button style="display:flex;gap:12px;align-items:flex-start;text-align:left;width:100%;min-height:64px;padding:12px;background:#fff;border:1.5px solid #d1dcf0;border-radius:14px;${F}"><span style="font-size:24px">${ic}</span><span style="flex:1"><b style="font-size:16px">${t}</b>${isNew ? ' <span style="background:#2a72d9;color:#fff;border-radius:999px;padding:1px 8px;font-size:12px;font-weight:800">New</span>' : ""}<br><small style="font-size:14px;color:#53627f;line-height:1.4">${l}</small></span>${tried ? '<span style="color:#0f7d5b;font-weight:800;font-size:14px">✓ Tried</span>' : ""}</button>`;
const LIST = `<div style="${mark};margin:12px;padding:14px;background:#f6f9ff;display:flex;flex-direction:column;gap:10px;${F}">
  <b style="font-size:22px">How to</b><span style="font-size:15px;line-height:1.45">Situations from your days, and how Chef Mealan helps. Each takes a minute.</span>
  <div style="background:#fff;border:1.5px solid #d1dcf0;border-radius:14px;padding:10px 12px"><b style="font-size:15px">Beta: 3 of 8 tried</b><div style="height:8px;background:#e3eaf6;border-radius:4px;margin-top:6px"><div style="width:37%;height:8px;background:#0f7d5b;border-radius:4px"></div></div><small style="font-size:13px;color:#53627f">Try each once. Tap Didn't work when it doesn't. Coach Milan sees what you tried, and your notes.</small></div>
  ${SITS.map(([g, xs]) => `<small style="font-size:13px;font-weight:800;letter-spacing:.05em;color:#53627f;margin-top:4px">${g.toUpperCase()}</small>${xs.map(card).join("")}`).join("")}</div>`;
const OPEN = `<div style="${mark};margin:12px;padding:16px;background:#fff;display:flex;flex-direction:column;gap:12px;${F}">
  <button class="link" style="min-height:44px;text-align:left">‹ How to</button>
  <span style="font-size:30px">🖼️</span><b style="font-size:22px">A recipe from a screenshot</b>
  <span style="font-size:16px;line-height:1.5">You saw a dish on Instagram, in a book, or asked ChatGPT. Chef Mealan turns the picture into your recipe, with your amounts.</span>
  <div style="display:flex;flex-direction:column;gap:8px;font-size:16px;line-height:1.45"><div style="display:flex;gap:10px"><b style="flex:none;width:26px;height:26px;border-radius:13px;background:#e6f0ff;color:#1f5fc7;display:flex;align-items:center;justify-content:center;font-size:14px">1</b><span>Recipes, then <b>Add a recipe</b>.</span></div><div style="display:flex;gap:10px"><b style="flex:none;width:26px;height:26px;border-radius:13px;background:#e6f0ff;color:#1f5fc7;display:flex;align-items:center;justify-content:center;font-size:14px">2</b><span>Pick the screenshot from Gallery.</span></div><div style="display:flex;gap:10px"><b style="flex:none;width:26px;height:26px;border-radius:13px;background:#e6f0ff;color:#1f5fc7;display:flex;align-items:center;justify-content:center;font-size:14px">3</b><span>Check the foods he read; fix one with a tap.</span></div><div style="display:flex;gap:10px"><b style="flex:none;width:26px;height:26px;border-radius:13px;background:#e6f0ff;color:#1f5fc7;display:flex;align-items:center;justify-content:center;font-size:14px">4</b><span><b>Fit to my target</b>, then <b>Start cooking</b>.</span></div></div>
  <button class="pill pill-primary pill-wide" style="min-height:48px">Try it ›</button>
  <div style="display:flex;gap:8px">${pill("✓ Tried it")}${pill("Didn't work")}</div>
  <small style="font-size:14px;color:#53627f">About 2 minutes.</small></div>`;
const NOTE_SHEET = `<div style="${mark};margin:12px;padding:16px;background:#fff;display:flex;flex-direction:column;gap:10px;${F}">
  <b style="font-size:20px">What happened?</b><span style="font-size:15px;line-height:1.45">A recipe from a screenshot. Coach Milan reads this and gets back to you.</span>
  <textarea style="min-height:96px;font-size:16px;padding:10px;border:1.5px solid #c5d2e8;border-radius:12px;${F}">Step 2: the Gallery did not open on my Android.</textarea>
  <button class="pill pill-primary pill-wide" style="min-height:48px">Send</button><button class="link" style="min-height:44px">Cancel</button></div>`;
const TESTERS = `<div style="${mark};margin:12px;padding:14px;background:#f6f9ff;display:flex;flex-direction:column;gap:10px;${F}">
  <b style="font-size:20px">How to: your testers</b>
  ${[["Mia", 6, "", ""], ["Marko", 3, "1 didn't work", "A recipe from a screenshot: Step 2: the Gallery did not open on my Android."], ["Tester 2", 1, "", ""], ["Dajana", 0, "", ""]].map(([n, k, d, q]) => `<div style="background:#fff;border:1.5px solid #d1dcf0;border-radius:14px;padding:10px 12px"><div style="display:flex;justify-content:space-between"><b style="font-size:16px">${n}</b><span style="font-size:14px;font-weight:800;color:${k ? "#0f7d5b" : "#53627f"}">${k} of 8 tried</span></div>${d ? `<small style="display:block;margin-top:6px;font-size:14px;color:#b3261e;font-weight:700">${d}</small><small style="display:block;font-size:14px;line-height:1.4">${q}</small>` : ""}</div>`).join("")}
  <small style="font-size:14px;color:#53627f;line-height:1.45">Which situation no one tried yet: A busy day. A good one for the next 1:1.</small></div>`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async (path = "/today") => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, seed);
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.goto(U + path); await p.waitForTimeout(1500); return p;
  };
  const note = (p, t, sel, where = "beforebegin") => p.evaluate(({ t, NOTE, sel, where }) => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; document.querySelector(sel).insertAdjacentElement(where, d); }, { t, NOTE, sel, where });
  const shot = async (p, name) => { await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); await p.context().close(); };
  const menu = async (p) => { await p.locator("header .menu-button").click(); await p.waitForTimeout(600); };
  const screen = (p, html) => p.evaluate((html) => { const m = [...document.querySelectorAll("main")].pop(); m.innerHTML = `<div>${html}</div>`; }, html);
  // row 1: where it lives
  let p = await open(); await menu(p);
  await note(p, "Now (0.3.112): the Menu. Nothing shows what Chef Mealan can do, or what came new.", "main > *", "afterbegin");
  await shot(p, "r260a");
  p = await open(); await menu(p);
  await p.evaluate((mark) => { const r = document.querySelector(".howto-row"); if (r) r.style.cssText += ";" + mark; }, mark);
  await note(p, "New: How to, the second row of the Menu, under Me (Coach Milan 17:11: Me is the starting point and stays on top). Under it: how many you tried, and how many are new.", ".howto-row", "beforebegin");
  await shot(p, "r260b");
  p = await open();
  await p.evaluate(({ mark, F }) => { const g = document.querySelector("section.plan"); const d = document.createElement("div"); d.className = "howto-new"; d.style.cssText = `${mark};margin:12px;padding:14px;background:#fff;${F}`; d.innerHTML = `<b style="font-size:17px">2 new ways to use Chef Mealan</b><div style="font-size:15px;line-height:1.45;margin-top:4px">Cook hands free in your language. A recipe in another language.</div><div style="display:flex;gap:8px;margin-top:10px;align-items:center"><button class="pill pill-small pill-primary" style="min-height:44px">See how ›</button><button class="link" style="min-height:44px">Not now</button></div>`; g.after(d); }, { mark, F });
  await note(p, "New: after a release with new ways, one card on Today, below the title and below your goal. Not now closes it until the next release.", ".howto-new", "beforebegin");
  await p.evaluate(() => { const g = document.querySelector("section.plan"); window.scrollTo(0, g.getBoundingClientRect().top + window.scrollY - 140); });
  await p.screenshot({ path: `${R}/r260c.png` }); console.log("shot r260c"); await p.context().close();
  // row 2: the list and a card
  p = await open(); await menu(p); await screen(p, LIST);
  await note(p, "New: How to. Situations by part of the day, each one line. A beta tester sees the count on top; a member after the beta does not.", "main > div");
  await p.evaluate(() => { document.querySelectorAll(".bottom-nav").forEach((x) => (x.style.display = "none")); });
  await p.screenshot({ path: `${R}/r260d.png`, fullPage: true }); console.log("shot r260d"); await p.context().close();
  p = await open(); await menu(p); await screen(p, OPEN);
  await note(p, "New: a situation opened. The happy path in 3 to 5 steps, Try it opens the first screen, then Tried it or Didn't work.", "main > div");
  await shot(p, "r260e");
  p = await open(); await menu(p); await screen(p, NOTE_SHEET);
  await note(p, "New: Didn't work asks what happened, in a line. It goes to you, with the situation, the step and the version.", "main > div");
  await shot(p, "r260f");
  // row 3: the coach's view
  p = await open(); await menu(p); await screen(p, TESTERS);
  await note(p, "New, for you: who tried what, and every Didn't work with its note. In Clients, How to.", "main > div");
  await shot(p, "r260g");
  // DT260h (Coach Milan 09:16): what one tester ticked
  const SITN = SITS.flatMap(([, xs]) => xs.map((x) => x[1]));
  const MARKO = { "What should I eat now?": ["tried", "6 Nov"], "I ate something: log it with a photo": ["tried", "6 Nov"], "A recipe from a screenshot": ["didnt", "7 Nov", "Step 2: the Gallery did not open on my Android."], "Cook hands free": ["tried", "7 Nov"] };
  const ONE = `<div style="${mark};margin:12px;padding:14px;background:#f6f9ff;display:flex;flex-direction:column;gap:8px;${F}">
    <button class="link" style="min-height:44px;text-align:left">‹ Your testers</button><b style="font-size:20px">Marko: 3 of 8 tried</b>
    ${SITN.map((t) => { const m = MARKO[t]; const st = !m ? '<span style="color:#53627f;font-weight:700">Not yet</span>' : m[0] === "tried" ? `<span style="color:#0f7d5b;font-weight:800">✓ Tried, ${m[1]}</span>` : `<span style="color:#b3261e;font-weight:800">Didn't work, ${m[1]}</span>`;
      return `<div style="background:#fff;border:1.5px solid #d1dcf0;border-radius:14px;padding:10px 12px"><b style="font-size:15px">${t}</b><div style="font-size:14px;margin-top:2px">${st}</div>${m && m[2] ? `<div style="font-size:14px;line-height:1.4;margin-top:4px">“${m[2]}”</div>` : ""}</div>`; }).join("")}</div>`;
  p = await open(); await menu(p); await screen(p, ONE);
  await note(p, "New: tap a tester. Each situation: Tried with the day, Didn't work with the note, or Not yet.", "main > div");
  await p.evaluate(() => { document.querySelectorAll(".bottom-nav").forEach((x) => (x.style.display = "none")); });
  await p.screenshot({ path: `${R}/r260h.png`, fullPage: true }); console.log("shot r260h"); await p.context().close();
  await b.close(); server.kill();
})();
