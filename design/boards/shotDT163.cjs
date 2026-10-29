// DT163 (Coach Milan 29 October 21:21 and 21:34): the whole B group, all eight with both names
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const PORT = "3343", U = `http://127.0.0.1:${PORT}`;
const B = require("/home/claude/boards/b163.cjs"); const BC = require("/home/claude/boards/bcard163.json");
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
  const shot = async (name, keep) => { await page.waitForTimeout(400); await page.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue; if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } window.scrollTo(0, 0); document.querySelector(".toast")?.remove(); }); await page.waitForTimeout(200); await page.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log("shot " + name); };
  const openMicros = async () => { await page.goto(U + "/"); await page.waitForTimeout(1000); await page.getByRole("button", { name: "Menu" }).first().click(); await page.waitForTimeout(300);
    await page.getByRole("button", { name: /^Explorer/ }).click(); await page.waitForTimeout(600); await page.locator(".ex-families").getByRole("radio", { name: "Micros" }).click(); await page.waitForTimeout(300); };
  const fmt = (v) => (v < 10 ? v.toFixed(1) : String(Math.round(v)));
  const FOR = '<span class="ex-for">for you</span>';
  // a member page in the app's own classes, from the data
  const pageHtml = (x) => {
    const day = x.perMJ ? Math.round(x.perMJ * B.MJ * 10) / 10 : x.efsa, low = x.claimName;
    const H = (t, g, first, extra = "") => `<div class="ex-head${first ? " ex-head-first" : ""}" ${extra}><b>${t}</b><small>${g}</small></div>`;
    const sc = (x.ul ? x.ul.v : day * 2) * 1.3, L = (100 * day) / sc, W = x.ul ? (100 * (x.ul.v - day)) / sc : 100 - L;
    const range = `<div class="ex-range"${x.perMJ ? ` style="${mark};outline-offset:4px"` : ""}><div class="ex-range-top"><b>Your range</b><small>${x.ul ? `${day} to ${x.ul.v} ${x.unit}` : `from ${day} ${x.unit}${x.ulNone ? ", no upper limit" : ""}`}</small></div><span class="ex-range-bar"><i style="left:${L}%;width:${W}%"></i></span><small class="ex-range-why">From ${day} ${x.unit}, ${x.efsaSrc}${x.perMJ ? `: for today's ${B.day.kcal.toLocaleString("en")} kcal, ${(B.MJ).toFixed(1)} MJ` : ""}${x.ul ? `, up to ${x.ul.v} ${x.unit}, ${x.ul.note}` : x.ulNone ? `, with no upper limit: ${x.ulNone}` : `. ${x.much.replace(/\.$/, "")}`}.</small></div>`;
    const rows = x.foods.map((f) => { const v = (f.per100 * f.grams) / 100, p = Math.round((100 * v) / day);
      return `<div class="ex-row${p >= 100 ? " ex-ok" : ""}"><small class="ex-name">${f.name}<span class="ex-sub">${f.portion}</span></small><span class="ex-bar"><i style="width:${Math.max(Math.min(p / 150, 1) * 100, 1.5)}%"></i><i class="ex-need"></i></span><small class="ex-val">${v < 10 ? v.toFixed(1) : Math.round(v)} ${x.unit.replace(" DFE", "").replace(" NE", "")} · ${p} %</small></div>`; }).join("");
    return H("What it is", x.is, true) + H("What it does", `What the EU allows a label to say, word for word. ${x.claimName[0].toUpperCase() + x.claimName.slice(1)} ...`) + x.does.map((d) => `<small class="ex-quote">${d}</small>`).join("") + `<small class="ex-src ex-dnote">Regulation (EU) No 432/2012, Annex. A food may say these only when it is at least a source of ${low}.</small>` +
      `<div class="ex-head"><b>How much a day${FOR}</b><small>${x.perMJ ? "Set by how much you eat: EFSA gives it per megajoule, so your day follows today's energy." : "From your day up to the upper limit. Your day comes from EFSA for an adult"}${x.perMJ ? "" : "; the label's reference is the same for everyone."}</small></div>` + range +
      `<div class="ex-row ex-pair ex-kv"><small class="ex-name">On labels<span class="ex-sub">EU reference intake, Regulation (EU) No 1169/2011</span></small><small class="ex-val">${x.label} ${x.unit.replace(" DFE", "").replace(" NE", "")}</small></div>` +
      H("Where to find it", x.foods.length ? `One normal portion against your day, ${day} ${x.unit}. The line is the whole day; green when one portion covers it.` : "Not on our food table yet.") + (x.gap ? `<small class="ex-warn" style="${mark};outline-offset:2px">${x.gap}</small>` : rows + `<small class="ex-src ex-dnote">Source: USDA FoodData Central, ${x.foods.map((f) => f.src).join("; ")}.${x.unit === "mg NE" ? " Niacin equivalents: the niacin plus the tryptophan divided by 60, from the same rows." : ""}</small>`) +
      (x.combine.length ? H("Combine it with", "What helps your body use it, and why.") + x.combine.map((c) => `<div class="ex-combine"><b>${c.with}</b><small>${c.why}</small></div>`).join("") : "") + H("Too much", x.much) + `<small class="ex-src ex-card-src">Sources. EU claims: Regulation (EU) No 432/2012. EFSA's dietary reference values, as the Health Council of the Netherlands tabulated them (2018), and EFSA's overview of upper limits. Foods: USDA FoodData Central. Educational, not medical advice.</small>`;
  };
  const showPage = async (key, note) => {
    await openMicros(); await page.getByRole("radio", { name: "By member" }).click(); await page.locator("button.ex-member", { hasText: "Vitamin C" }).click(); await page.waitForTimeout(400);
    const x = B[key];
    await page.evaluate(({ html, x, note, NOTE, mark }) => {
      document.querySelector(".ex-h").innerHTML = `${x.name}<small class="ex-also" style="${mark};outline-offset:2px">${x.also}</small>`;
      const sec = document.querySelector(".ex-member-page"); sec.setAttribute("aria-label", x.name); sec.innerHTML = html;
      const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = note; document.querySelector(".ex-calc").before(d);
      window.scrollTo(0, 0);
    }, { html: pageHtml(x), x, note, NOTE, mark });
  };
  const NRV = { b1: 1.1, b2: 1.4, b3: 16, b5: 6, b6: 1.4, b7: 50 };
  const DAYS = { b1: `${(0.1 * B.MJ).toFixed(1)} mg`, b2: "1.6 mg", b3: `${(1.6 * B.MJ).toFixed(1)} mg NE`, b5: "5 mg", b6: "1.7 mg", b7: "40 µg", fol: "330 µg", b12: "4 µg" };
  // a, the family members: the B group in the water-soluble group, both names
  await openMicros(); await page.getByRole("radio", { name: "By member" }).click(); await page.waitForTimeout(300);
  await page.evaluate(({ names, DAYS, note, NOTE, mark }) => {
    const b12 = [...document.querySelectorAll(".ex-member")].find((r) => /^Vitamin B12/.test(r.querySelector("b").textContent));
    const b9 = [...document.querySelectorAll(".ex-member")].find((r) => /^Vitamin B9/.test(r.querySelector("b").textContent));
    const row = (id, n) => `<div class="menu-row ex-member" style="${mark};outline-offset:1px"><b>${n[0]}<span class="ex-sub">${n[1]}</span></b><small>your day ${DAYS[id]}</small><span aria-hidden="true">›</span></div>`;
    b12.insertAdjacentHTML("beforebegin", ["b1", "b2", "b3", "b5", "b6", "b7"].map((id) => row(id, names[id])).join(""));
    b9.after(b12);
    for (const [r, id] of [[b9, "fol"], [b12, "b12"]]) { r.classList.remove("ex-member-next"); r.style.cssText = mark + ";outline-offset:1px"; r.querySelector("small").textContent = `your day ${DAYS[id]}`; if (!r.querySelector("span[aria-hidden]")) r.insertAdjacentHTML("beforeend", '<span aria-hidden="true">›</span>'); }
    const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = note; document.querySelector(".ex-calc").before(d); window.scrollTo(0, 0);
  }, { names: B.names, DAYS, note: "New: the whole B group in the water-soluble vitamins, in order, each with both names: B1 thiamine to B12 cobalamin. Each opens its own page.", NOTE, mark });
  await shot("r163a");
  // b, a food card: the eight B rows among the members
  await openMicros(); await page.waitForTimeout(300);
  await page.evaluate(({ BC, NRV, names, note, NOTE, mark }) => {
    for (const c of [...document.querySelectorAll(".ex-card")]) if (c.getAttribute("aria-label") !== "Lentils, boiled") c.remove();
    const c = document.querySelector(".ex-card"); const f = BC.lentils, k = 2;
    const cRow = [...c.querySelectorAll(".ex-row")].filter((r) => /^Vitamin C/.test(r.textContent)).pop();
    const row = (id) => { const v = f[id]; const p = v == null ? null : Math.round((100 * v * k) / NRV[id]); const unit = id === "b7" ? "µg" : "mg";
      return `<div class="ex-row${p !== null && p >= 100 ? " ex-ok" : ""}" style="${mark};outline-offset:1px"><small class="ex-name">${names[id][0]}<span class="ex-sub">${names[id][1]}</span></small><span class="ex-bar"><i style="width:${Math.max(Math.min((p ?? 0) / 150, 1) * 100, 1.5)}%"></i><i class="ex-need"></i></span><small class="ex-val">${p === null ? "not reported" : `${(v * k).toFixed(v * k < 10 ? 2 : 0)} ${unit} · ${p} %`}</small></div>`; };
    cRow.insertAdjacentHTML("afterend", ["b1", "b2", "b3", "b5", "b6", "b7"].map(row).join(""));
    const rB9 = [...c.querySelectorAll(".ex-row")].find((x) => /^Vitamin B9/.test(x.textContent)), rB12 = [...c.querySelectorAll(".ex-row")].find((x) => /^Vitamin B12/.test(x.textContent));
    if (rB9 && rB12) rB12.before(rB9);
    const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = note; document.querySelector(".ex-calc").before(d); window.scrollTo(0, 0);
  }, { BC, NRV, names: B.names, note: "New: on every food card, the B group joins the water-soluble rows, against the label's reference. Lentils: almost two days of folate, almost a third of B1. Biotin says not reported: USDA's rows don't have it.", NOTE, mark });
  await shot("r163b", true);
  await showPage("b1", "New: Vitamin B1, thiamine. EFSA sets it by how much you eat, 0.1 mg per megajoule, so your day follows today's energy: 1.1 mg for 2,600 kcal. Marked for you. Pork brings more than a day.");
  await shot("r163c");
  await showPage("b3", "New: Vitamin B3, niacin, counted the EFSA way: niacin equivalents, the niacin plus the tryptophan from protein divided by 60. Also set by your energy: 17.4 mg NE today. Chicken brings 170 %.");
  await shot("r163d");
  await showPage("b9", "New: Vitamin B9, folate. Eight EU claims. The upper limit, 1000 µg, is for folic acid added to foods and supplements only: folate in food has none. Lentils and chickpeas each cover the day.");
  await shot("r163e");
  await showPage("b12", "New: Vitamin B12, cobalamin. Only animal foods bring it among these: clams and liver more than twenty days in a portion. No upper limit: EFSA found no defined adverse effects.");
  await shot("r163f");
  await showPage("b7", "New: Vitamin B7, biotin. Seven EU claims and EFSA's 40 µg, but USDA's rows don't report it for any food here, so Where to find it says so instead of guessing.");
  await shot("r163g");
  await b.close(); server.kill();
})();
