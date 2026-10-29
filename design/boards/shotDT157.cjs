// DT156 (Coach Milan 29 October 16:16 and 16:17): Explorer, what a label could claim by EU rules, on every card of the three families
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";
// Li, Andrews, Pehrsson 2002 (USDA), J Food Comp Anal 15:715, Table 1, g per 100 g as eaten, AOAC 991.43: soluble and insoluble
const LI = { "White rice, boiled": { row: "White rice, long grain, cooked", sol: 0, ins: 0.34, nd: true }, "Potatoes, boiled": { row: "Potato, white, boiled, w/o skin", sol: 0.99, ins: 1.06 },
  "Wholewheat bread": { row: "Bread, whole wheat, soft", sol: 1.26, ins: 4.76 }, "Pasta, cooked": { row: "Spaghetti, cooked", sol: 0.54, ins: 1.33 },
  "Lentils, boiled": { row: "Lentils, dry, cooked, drained", sol: 0.44, ins: 5.42 }, "Banana": { row: "Bananas, raw, ripe", sol: 0.58, ins: 1.21 }, "Apple": { row: "Apple (Red delicious), raw, ripe w/skin", sol: 0.67, ins: 1.54 } };
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = []; seed.meals = []; seed.feedback = [];
const PORT = "3335", U = `http://127.0.0.1:${PORT}`;
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
  const draw = (keep, note) => page.evaluate(({ keep, LI, mark, NOTE, note }) => {
    for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (["fixed", "sticky"].includes(cs.position) && el.getBoundingClientRect().top > 100) el.style.display = "none"; }
    document.querySelector(".toast")?.remove();
    for (const c of document.querySelectorAll(".ex-card")) if (!keep.includes(c.getAttribute("aria-label"))) c.remove();
    const row = (name, val, frac, cls = "") => `<div class="ex-row ex-under ${cls}" style="${mark};outline-offset:1px"><small class="ex-name">${name}</small><span class="ex-bar" aria-hidden="true"><i style="width:${Math.max(Math.min(frac, 1) * 100, 1.5)}%"></i></span><small class="ex-val">${val}</small></div>`;
    for (const c of document.querySelectorAll(".ex-card")) {
      const name = c.getAttribute("aria-label"), li = LI[name];
      const fibreRow = [...c.querySelectorAll(".ex-row")].filter((r) => /^Fibre/.test(r.textContent.trim()) && /g$/.test(r.textContent.trim()) && !/of/.test(r.querySelector(".ex-val").textContent)).pop();
      const fibre = Number(fibreRow.querySelector(".ex-val").textContent.replace(" g", ""));
      const famHead = [...c.querySelectorAll(".ex-head")].find((h) => /The family members/i.test(h.textContent)); const famGoal = famHead.querySelector("small"); famGoal.dataset.orig = famGoal.textContent; famHead.style.cssText = mark + ";outline-offset:2px";
      const extra = document.createElement("small"); extra.style.cssText = "display:block;" + mark + ";padding:2px 4px;margin-top:4px;color:#5b6b8a;line-height:1.35";
      if (li) {
        const share = li.sol / (li.sol + li.ins), sol = fibre * share, ins = fibre - sol;
        fibreRow.insertAdjacentHTML("afterend", row("of it, soluble", `${sol.toFixed(2)} g`, sol / 60) + row("of it, insoluble", `${ins.toFixed(2)} g`, ins / 60));
        extra.textContent = `Fibre comes in two kinds. Soluble fibre forms a gel and slows digestion, so the sugar comes later; insoluble fibre adds bulk and keeps digestion moving. ${li.nd ? "This one: no soluble fibre found, all of it insoluble." : `This one: ${Math.round(share * 100)} % of its fibre is soluble.`}`;
      } else {
        fibreRow.insertAdjacentHTML("afterend", `<div class="ex-row ex-under" style="${mark};outline-offset:1px"><small class="ex-name" style="width:auto;flex:1;white-space:normal">of it, soluble and insoluble: no measure we can use for dry oats</small></div>`);
        extra.textContent = "Fibre comes in two kinds. Soluble fibre forms a gel and slows digestion, so the sugar comes later; insoluble fibre adds bulk and keeps digestion moving. Oats are known for beta-glucan, a soluble fibre; the split for dry oats isn't measured the way the others are.";
        const label = [...c.querySelectorAll(".ex-claim")].pop();
        label.insertAdjacentHTML("afterend", `<div class="ex-claim" style="${mark};outline-offset:1px"><div><b>Beta-glucan and cholesterol</b><b class="ex-claim-yes">Not on our table</b></div><small>A health claim: oat beta-glucan contributes to normal blood cholesterol. Needs at least 1 g of beta-glucan from oats per portion, and the label must say the effect comes with 3 g a day. Our food table has no beta-glucan figure for oats.</small></div>`);
      }
      famGoal.textContent = extra.textContent.replace("Fibre comes in two kinds.", `Starch, sugars and fibre, and fibre comes in two kinds.`) + ` This portion is mostly ${/mostly sugars/.test(famGoal.dataset.orig ?? famGoal.textContent) ? "sugars" : "starch"}. Grams, on the same scale for every food.`;
      const src = c.querySelector(".ex-card-src");
      if (li) src.insertAdjacentHTML("beforeend", `<br><span style="${mark};outline-offset:1px">Soluble and insoluble: the share measured by Li, Andrews and Pehrsson 2002 (USDA), Table 1, ${li.row}.</span>`);
      else src.insertAdjacentHTML("beforeend", `<br><span style="${mark};outline-offset:1px">Beta-glucan claim: Regulation (EU) No 432/2012, Annex, authorised health claims.</span>`);
    }
    const head = document.querySelector(".ex-h"); const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = note; head.before(d);
    window.scrollTo(0, 0);
  }, { keep, LI, mark, NOTE, note });
  await open("Carbs");
  await draw(["Lentils, boiled", "Apple"], "New: under Fibre, its two kinds, soluble and insoluble, the way omega-3 sits under polyunsaturated. Lentils: almost all insoluble. Apple: about a third soluble.");
  await page.screenshot({ path: `${R}/r157a.png`, fullPage: true }); console.log("shot r157a");
  await open("Carbs");
  await draw(["Oats, dry", "Potatoes, boiled"], "New: dry oats have no split measured the same way, so the card says so. Its EU health claim for beta-glucan goes under What a label could say, with what it needs. Potatoes: about half soluble.");
  await page.screenshot({ path: `${R}/r157b.png`, fullPage: true }); console.log("shot r157b");
  await b.close(); server.kill();
})();
