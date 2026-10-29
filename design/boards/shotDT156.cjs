// DT156 (Coach Milan 29 October 16:16 and 16:17): Explorer, what a label could claim by EU rules, on every card of the three families
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";
const CLAIMS = require("/home/claude/boards/claims156.cjs");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = []; seed.meals = []; seed.feedback = [];
const PORT = "3334", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ args: ["--lang=en-GB"] });
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB" })).newPage();
  await page.clock.setFixedTime(new Date("2026-10-29T11:00:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-28T16:00:00Z", source: "profile" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, lifestyle: { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require(path.join(ROOT, "tests/flows/adult.cjs"))(page);
  const R = "/home/claude/boards/rs";
  const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742";
  const open = async (fam) => { await page.goto(U + "/"); await page.waitForTimeout(1000); await page.getByRole("button", { name: "Menu" }).first().click(); await page.waitForTimeout(300);
    await page.getByRole("button", { name: /^Explorer/ }).click(); await page.waitForTimeout(500); if (fam !== "Protein") { await page.locator(".ex-families").getByRole("radio", { name: fam }).click(); await page.waitForTimeout(300); } };
  const draw = (keep, claims, note, focus) => page.evaluate(({ keep, claims, mark, NOTE, note, focus }) => {
    for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (["fixed", "sticky"].includes(cs.position) && el.getBoundingClientRect().top > 100) el.style.display = "none"; }
    document.querySelector(".toast")?.remove();
    for (const c of document.querySelectorAll(".ex-card")) if (!keep.includes(c.getAttribute("aria-label"))) c.remove();
    for (const c of document.querySelectorAll(".ex-card")) {
      const cs = claims[c.getAttribute("aria-label")]; const yes = cs.filter((x) => x.ok).map((x) => x.claim);
      const howTo = [...c.querySelectorAll(".ex-head")].find((h) => /How to use it/i.test(h.textContent));
      const sec = document.createElement("div"); sec.style.cssText = mark;
      sec.innerHTML = `<div class="ex-head"><b>What a label could say</b><small>By EU rules, a food may only claim these when it meets them per 100 g. ${yes.length ? `This one could say: ${yes.join(", ")}.` : "This one could claim none of them."}</small></div>` +
        cs.map((x, i) => `<div style="padding:6px 0;${i ? "border-top:1px solid #eef2f9" : ""}"><div style="display:flex;justify-content:space-between;gap:8px"><b style="font-size:12.5px">${x.claim}</b><b style="font-size:12.5px;color:${x.ok ? "#13916a" : "#5b6b8a"}">${x.ok ? "✓ Yes" : "No"}</b></div><small style="display:block;color:#5b6b8a;font-size:11px;line-height:1.35">Needs ${x.rule}. This food: ${x.is}.</small></div>`).join("") +
        `<small class="ex-src" style="display:block;margin-top:4px;font-size:11px">Regulation (EC) No 1924/2006, Annex, as the European Commission lists it.</small>`;
      howTo.before(sec);
    }
    const head = document.querySelector(".ex-h"); const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = note; head.before(d);
    const f = [...document.querySelectorAll(".ex-card")].find((c) => c.getAttribute("aria-label") === focus);
    window.scrollTo(0, 0);
  }, { keep, claims, mark, NOTE, note, focus });
  await open("Protein");
  await draw(["Chicken breast", "Oats, dry"], CLAIMS.protein, "New: a seventh section on every card, What a label could say, by EU rules. High protein means at least 20 % of the energy from protein: that is PD 5. Source of protein, 12 %: PD 3.");
  await page.screenshot({ path: `${R}/r156a.png`, fullPage: true }); console.log("shot r156a");
  await open("Fats");
  await draw(["Walnuts", "Butter"], CLAIMS.fats, "New: fats. Walnuts could say High omega-3 and High unsaturated fat; butter could claim none of them.");
  await page.screenshot({ path: `${R}/r156b.png`, fullPage: true }); console.log("shot r156b");
  await open("Carbs");
  await draw(["Apple", "Pasta, cooked"], CLAIMS.carbs, "New: carbs. An apple could say High fibre: 2.4 g per 100 g is little, but per 100 kcal it is 4.6 g, and the rule allows either. Pasta could only say Low sugars.");
  await page.screenshot({ path: `${R}/r156c.png`, fullPage: true }); console.log("shot r156c");
  await b.close(); server.kill();
})();
