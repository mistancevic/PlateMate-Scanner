// Board B139 (Coach Milan 12 November 14:02 and 14:06: draw first, to agree on the look): I ate it shows a ✓ before it is done.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = process.env.ROOT || "/home/claude/pm284v5", PORT = "3489", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.feedback = []; seed.items = [];
const F = (n) => seed.foods.find((x) => x.name === n);
const PH = "/landing/hero/quesadilla-m.webp";
seed.meals = [{ id: "sarma", title: "Sarma with skyr", savedAt: "2026-10-01T08:00:00Z", portion: 400, photo: PH, items: [["Rice, cooked", 150], ["Chicken breast, cooked", 150], ["Skyr, natural", 100]].map(([n, g], i) => ({ id: "s" + i, food: F(n), grams: g, locked: true })) },
  { id: "oats", title: "Oats with skyr", savedAt: "2026-10-01T08:00:00Z", portion: 300, items: [["Oats", 60], ["Skyr, natural", 200]].map(([n, g], i) => ({ id: "o" + i, food: F(n), grams: g, locked: true })) }];
seed.meals[1].portion = 260;
const planned = { "2026-11-12": { lunch: { title: "Sarma with skyr", kcal: 610, protein: 52, source: "mine", mealId: "sarma", items: seed.meals[0].items }, dinner: { title: "Oats with skyr", kcal: 420, protein: 34, source: "mine", mealId: "oats", items: seed.meals[1].items } } };
const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 12px;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async () => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-11-12T12:40:00+01:00"));
    await p.addInitScript(({ s, planned }) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-planned", JSON.stringify(planned));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, { s: seed, planned });
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.goto(U + "/today"); await p.waitForTimeout(1500);
    await p.evaluate(() => { const f = document.querySelector(".chat-fab"); if (f) f.style.visibility = "hidden"; });
    return p;
  };
  const note = (p, t, el) => p.evaluate(({ t, NOTE, el }) => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; el.insertAdjacentElement("beforebegin", d); }, { t, NOTE, el: null }).catch(() => {});
  const noteAt = (p, t, sel) => p.evaluate(({ t, NOTE, sel }) => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; const e = document.querySelector(sel); (e.closest("section") || e).insertAdjacentElement("beforebegin", d); }, { t, NOTE, sel });
  const btns = (p) => p.evaluate(() => [...document.querySelectorAll("button")].filter((x) => /I ate it/.test(x.textContent)).forEach((x, i) => (x.id = "ate" + i)));
  const markIt = (p, sel) => p.evaluate(({ sel, mark }) => { for (const e of document.querySelectorAll(sel)) e.style.cssText += ";" + mark; }, { sel, mark });
  const noCheck = (p) => p.evaluate(() => [...document.querySelectorAll("button")].filter((x) => /I ate it/.test(x.textContent)).forEach((x) => x.querySelector("svg")?.remove()));
  const shot = async (p, name, sel, off = 120) => { await p.evaluate(({ sel, off }) => { const e = sel && document.querySelector(sel); window.scrollTo(0, e ? e.getBoundingClientRect().top + window.scrollY - off : 0); }, { sel, off }); await p.waitForTimeout(300); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); await p.context().close(); };
  let p = await open(); await btns(p);
  console.log(await p.evaluate(() => [...document.querySelectorAll("button")].filter((x) => /I ate it|Change it/.test(x.textContent)).map((x) => x.id + ":" + x.textContent).join(" | ")));
  await markIt(p, "#ate0"); await noteAt(p, "Now (0.3.140): the blue I ate it has a ✓, so it reads as done, though it is the button to tap.", "#ate0");
  await shot(p, "rb139a", "#ate0", 520);
  p = await open(); await btns(p); await noCheck(p);
  await p.evaluate(() => { const a = document.querySelector("#ate0"); a.parentElement.appendChild(a); });
  await markIt(p, "#ate0");
  await noteAt(p, "New: Change it on the left, I ate it on the right, where the thumb is. No ✓ on a button still to tap: the blue fill says it is the main thing.", "#ate0");
  await shot(p, "rb139b", "#ate0", 520);
  // after the tap: Undo in the message; the ✓ on what is done; the meal opens to be changed
  p = await open(); await btns(p); await p.locator("#ate0").click(); await p.waitForTimeout(1200);
  await p.evaluate(({ mark }) => { const t = [...document.querySelectorAll("main *")].find((e) => e.children.length === 0 && e.textContent.trim() === "By the plan");
    t.textContent = "✓ Eaten, by the plan"; t.id = "done0"; t.style.cssText += ";" + mark;
    const row = t.closest(".log-card"); row.style.cssText += ";" + mark; row.insertAdjacentHTML("beforeend", '<small style="display:block;margin-top:6px;font-size:14px;color:#1f5fc7;font-weight:800">Tap to change or delete it ›</small>');
    const all = [...document.querySelectorAll("body *")].filter((e) => /^Logged, as planned/.test((e.textContent || "").trim()));
    const toast = all[all.length - 1]; console.log("toast", toast && toast.outerHTML.slice(0, 200));
    if (toast) { toast.textContent = "Logged, as planned. "; toast.insertAdjacentHTML("beforeend", '<button class="pill pill-small" style="min-height:44px;margin-left:10px;background:#fff;border:1.5px solid #2a72d9;color:#1f5fc7;font-weight:800;padding:0 16px">Undo</button>'); toast.style.cssText += ";" + mark + ";display:flex;align-items:center"; } }, { mark });
  await noteAt(p, "New, after the tap: the message at the top says Logged, as planned, with an Undo button, for a wrong tap. Below, in Today's meals, the ✓ shows on what is done, and the meal opens to change or delete it.", "#done0");
  await p.evaluate(() => window.scrollTo(0, document.querySelector("#done0").getBoundingClientRect().top + window.scrollY - 470)); await p.waitForTimeout(300);
  await p.screenshot({ path: `${R}/rb139c.png` }); console.log("shot rb139c");
  // the meal it opens: the same screen as DT284, with Change it and Delete this meal
  await p.goto(U + "/my-recipes/sarma"); await p.waitForTimeout(1500);
  await p.evaluate(() => { const f = document.querySelector(".chat-fab"); if (f) f.style.visibility = "hidden"; });
  await p.locator(".rq-eats .re-open").first().click(); await p.waitForTimeout(800);
  await p.evaluate(({ mark }) => { const b = document.querySelector(".past-meal .pm-back"); if (b) b.textContent = "‹ Today";
    const h = document.querySelector("header h1"); if (h) h.textContent = "Today";
    const nb = [...document.querySelectorAll(".bottom-nav button")]; const on = nb.find((x) => x.classList.contains("on") || x.getAttribute("aria-current")); const td = nb.find((x) => /Today/.test(x.textContent));
    if (on && td && on !== td) { for (const a of ["class", "aria-current"]) { const v1 = on.getAttribute(a), v2 = td.getAttribute(a); if (v2 === null) on.removeAttribute(a); else on.setAttribute(a, v2); if (v1 === null) td.removeAttribute(a); else td.setAttribute(a, v1); } } const e = document.querySelector(".past-meal .pm-edit"); if (e) e.style.cssText += ";" + mark + ";padding:6px";
    const d = document.querySelector(".past-meal .pm-delete"); if (d) { d.className = "pill pill-wide"; d.style.cssText = "min-height:48px;background:#fff;border:1.5px solid #b3261e;color:#b3261e;font-weight:800;margin-top:10px"; } }, { mark });
  await noteAt(p, "New: the eaten meal, opened from Today: the same screen as from the recipe (DT284). Change it, the main button. Delete this meal is a button too, white with a red border; Sure? first. Back goes to Today.", ".past-meal");
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300);
  await p.screenshot({ path: `${R}/rb139d.png` }); console.log("shot rb139d"); await p.context().close();
  await b.close(); server.kill();
})();
