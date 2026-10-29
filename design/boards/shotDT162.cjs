// DT162 (Coach Milan 29 October 21:21): Micros, Vitamin A, E and K pages; every vitamin with both its names
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const PORT = "3342", U = `http://127.0.0.1:${PORT}`;
const AEK = require("/home/claude/boards/aek162.cjs"); const FOODS = require("/home/claude/boards/foods162.json");
const FAT_SHARE = Number(/FAT_SHARE = ([\d.]+)/.exec(fs.readFileSync(path.join(ROOT, "src/personal.ts"), "utf8"))[1]);
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ args: ["--lang=en-GB"] });
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB" })).newPage();
  await page.clock.setFixedTime(new Date("2026-10-29T10:10:00"));
  await page.addInitScript(([s]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-20T16:00:00Z", source: "profile" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "each", week: { passive: 3, active: 1, easy: 2, hard: 1 }, sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, lifestyle: { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-20T16:00:00Z", consentBodyAt: "2026-10-20T16:00:00Z", declaredAt: "2026-10-20T16:00:00Z", aiConfirmedAt: "2026-10-20T16:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, [seed]);
  await require(path.join(ROOT, "tests/flows/adult.cjs"))(page);
  const R = "/home/claude/boards/rs";
  const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742";
  const shot = async (name) => { await page.waitForTimeout(400); await page.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue; if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } window.scrollTo(0, 0); document.querySelector(".toast")?.remove(); }); await page.waitForTimeout(200); await page.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log("shot " + name); };
  const openMicros = async () => { await page.goto(U + "/"); await page.waitForTimeout(1000); await page.getByRole("button", { name: "Menu" }).first().click(); await page.waitForTimeout(300);
    await page.getByRole("button", { name: /^Explorer/ }).click(); await page.waitForTimeout(600); await page.locator(".ex-families").getByRole("radio", { name: "Micros" }).click(); await page.waitForTimeout(300); };
  const fmt = (v) => (v < 10 ? v.toFixed(1) : String(Math.round(v)));
  const FOR = '<span class="ex-for">for you</span>';
  // a member page in the app's own classes, from the data
  const pageHtml = (x, foods, part) => {
    const day = x.efsa.men, low = x.name.replace("Vitamin", "vitamin");
    const H = (t, g, first, extra = "") => `<div class="ex-head${first ? " ex-head-first" : ""}" ${extra}><b>${t}</b><small>${g}</small></div>`;
    const sc = (x.ul ? x.ul.v : day * 2) * 1.3, L = (100 * day) / sc, W = x.ul ? (100 * (x.ul.v - day)) / sc : 100 - L;
    const range = `<div class="ex-range"><div class="ex-range-top"><b>Your range</b><small>${x.ul ? `${day} to ${x.ul.v} ${x.unit}` : `from ${day} ${x.unit}, no upper limit`}</small></div><span class="ex-range-bar"><i style="left:${L}%;width:${W}%"></i></span><small class="ex-range-why">From ${day} ${x.unit}, ${x.efsa.src.replace("EFSA, ", "EFSA's ")}${x.efsa.men !== x.efsa.women ? ` for men (${x.efsa.women} ${x.unit} for women)` : ""}, ${x.ul ? `up to ${x.ul.v} ${x.unit}, ${x.ul.note}.` : `with no upper limit: ${x.ulNone}.`}</small></div>`;
    const rows = foods.map((f) => { const v = (f.per100 * f.grams) / 100, p = Math.round((100 * v) / day); const over = x.ul && f.preformed != null && (f.preformed * f.grams) / 100 > x.ul.v;
      return `<div class="ex-row${p >= 100 ? " ex-ok" : ""}${over ? " ex-over" : ""}"${over ? ` style="${mark};outline-offset:2px"` : ""}><small class="ex-name">${f.name}<span class="ex-sub">${f.portion}${f.form ? `, ${f.form}` : ""}</span></small><span class="ex-bar"><i style="width:${Math.max(Math.min(p / 150, 1) * 100, 1.5)}%"></i><i class="ex-need"></i></span><small class="ex-val">${fmt(v)} ${x.unit} · ${p} %</small></div>`; }).join("");
    const overLine = x.ul && foods.some((f) => f.preformed != null && (f.preformed * f.grams) / 100 > x.ul.v) ? `<small class="ex-warn" style="${mark};outline-offset:2px">${foods.filter((f) => f.preformed != null && (f.preformed * f.grams) / 100 > x.ul.v).map((f) => f.name).join(", ")}: one portion brings more retinol than the upper limit, ${x.ul.v} ${x.unit}. Once in a while, not every day.</small>` : "";
    const top = H("What it is", x.is, true) + H("What it does", `What the EU allows a label to say, word for word. ${x.name} ...`) + x.does.map((d) => `<small class="ex-quote">${d}</small>`).join("") + `<small class="ex-src ex-dnote">Regulation (EU) No 432/2012, Annex. A food may say these only when it is at least a source of ${low}.</small>` +
      `<div class="ex-head"><b>How much a day${FOR}</b><small>From your day up to the upper limit. Your day comes from EFSA${x.efsa.men !== x.efsa.women ? ", for a man" : " for an adult"}; the label's reference is the same for everyone.</small></div>` + range +
      `<div class="ex-row ex-pair ex-kv"><small class="ex-name">On labels<span class="ex-sub">EU reference intake, Regulation (EU) No 1169/2011</span></small><small class="ex-val">${x.label} ${x.unit}</small></div>`;
    const bottom = H("Where to find it", `One normal portion against your day, ${day} ${x.unit}. The line is the whole day; green when one portion covers it.`) + rows + overLine + `<small class="ex-src ex-dnote">${FOODS[x.key + "Src"]}</small>` +
      H("Combine it with", "What helps your body use it, and why.") + x.combine.map((c) => `<div class="ex-combine"><b>${c.with}</b><small>${c.why}</small></div>`).join("") + H("Too much", x.much) + `<small class="ex-src ex-card-src">Sources. ${x.sources} Educational, not medical advice.</small>`;
    return part === 1 ? top : part === 2 ? bottom : top + bottom;
  };
  const showPage = async (key, part, note) => {
    await openMicros(); await page.getByRole("radio", { name: "By member" }).click(); await page.locator("button.ex-member", { hasText: "Vitamin D" }).click(); await page.waitForTimeout(400);
    const x = { ...AEK[key], key };
    await page.evaluate(({ html, x, note, NOTE, mark, also }) => {
      document.querySelector(".ex-h").innerHTML = `${x.name}<small style="display:block;font-size:15px;font-weight:700;color:#5b6b8a;margin-top:2px;${mark};outline-offset:2px">${also}</small>`;
      const sec = document.querySelector(".ex-member-page"); sec.setAttribute("aria-label", x.name); sec.innerHTML = html;
      const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = note; document.querySelector(".ex-calc").before(d);
      window.scrollTo(0, 0);
    }, { html: pageHtml(x, FOODS[key], part), x, note, NOTE, mark, also: x.also });
  };
  // a, the family members with both names
  await openMicros(); await page.getByRole("radio", { name: "By member" }).click(); await page.waitForTimeout(300);
  await page.evaluate(({ names, note, NOTE, mark, days }) => {
    for (const r of document.querySelectorAll(".ex-member")) {
      const b = r.querySelector("b"), id = Object.keys(names).find((k) => names[k].name === b.textContent.trim() || (k === "fol" && b.textContent.trim() === "Folate"));
      if (!id) continue;
      b.innerHTML = `${names[id].name}<span class="ex-sub" style="font-weight:600;font-size:12px">${names[id].also}</span>`; b.style.cssText = mark + ";outline-offset:2px";
      if (days[id]) { const s = r.querySelector("small"); s.textContent = `your day ${days[id]}`; if (r.tagName !== "BUTTON") { r.classList.remove("ex-member-next"); r.insertAdjacentHTML("beforeend", '<span aria-hidden="true">›</span>'); } }
    }
    const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = note; document.querySelector(".ex-calc").before(d); window.scrollTo(0, 0);
  }, { names: AEK.names, note: "New: every vitamin with both its names, here, on the food cards and on its page: Vitamin A, retinol; Vitamin K, K1 phylloquinone, K2 menaquinone; Folate becomes Vitamin B9, folate. A, E and K now open their own page.", NOTE, mark, days: { a: "750 µg", d: "15 µg", e: "13 mg", k: "70 µg", c: "110 mg" } });
  await shot("r162a");
  await showPage("a", 1, "New: the Vitamin A page. Retinol from animal foods, beta-carotene from plants. Six EU claims. Your range runs from 750 µg up to 3000 µg, the upper limit, which counts retinol only.");
  await shot("r162b");
  await showPage("a", 2, "New: where to find it, counted the EFSA way, beta-carotene at 6 to 1. Liver brings more retinol in one portion than the upper limit, and the page says so. Fat with the carrots: a small trial.");
  await shot("r162c");
  await showPage("e", 3, "New: the Vitamin E page, the same sections. One EU claim. 13 mg your day, 300 mg the upper limit; food alone never comes near it. Vitamin C helps renew it, an EU claim.");
  await shot("r162d");
  await showPage("k", 3, "New: the Vitamin K page. K1 from green leaves, K2 from fermented and animal foods; EFSA's value is for K1. Two EU claims. No upper limit. Some fat helps K1 out of the leaf: a small study.");
  await shot("r162e");
  await b.close(); server.kill();
})();
