// DT339 (0.3.180, board Stories280; Go 23 November 2026, 11:53, option A): a nutrition table printed in several languages
// shows the app's own names. A pack printed in Czech, Croatian, Bulgarian and Greek: each line the app knows says its own
// name with the printed name small under it (AC1), each line once (AC2), Review the label the same (AC3), in Srpski and
// Deutsch (AC4), a line it does not know keeps its printed name (AC5), a pack saved before reads the same (AC6).
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.meals = []; seed.feedback = []; seed.items = [];
const PORT = "3605", U = `http://127.0.0.1:${PORT}`;
const T = [["Energetická hodnota/Energetska vrijednost/Енергийна стойност/Ενέργεια", 520, "kcal"], ["Tuky/Masti/Мазнини/Λιπαρά", 28, "g"],
  ["z toho nasycené mastné kyseliny/od kojih zasićene masne kiseline/от които наситени мастни киселини/εκ των οποίων κορεσμένα", 9.5, "g", true],
  ["Sacharidy/Ugljikohidrati/Въглехидрати/Υδατάνθρακες", 58, "g"], ["z toho cukry/od kojih šećeri/от които захари/εκ των οποίων σάκχαρα", 35, "g", true],
  ["Vláknina/Vlakna/Влакнини/Φυτικές ίνες", 3, "g"], ["Bílkoviny/Bjelančevine/Белтъчини/Πρωτεΐνες", 7, "g"], ["Sůl/Sol/Сол/Αλάτι", 0.3, "g"],
  ["Vápník/Kalcij/Калций/Ασβέστιο", 120, "mg"], ["Taurin", 0.4, "g"]];
const table = (keys) => T.map(([name, amount, unit, sub]) => ({ ...(keys ? { key: "other:" + name.toLowerCase().slice(0, 40) } : {}), name, amount, unit, sub: !!sub, source: "label" }));
const wafer = (id, name, keys) => ({ ...seed.foods[0], id, name, brand: "Lumi", source: "Label photo · review required", calories: 520, protein: 7, fats: 28, carbs: 58, fiber: 3, table: table(keys) });
seed.foods = [wafer("f-wafer", "Hazelnut wafers", false), wafer("f-old", "Old wafers", true), ...seed.foods];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (lang) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1500 } }); const p = await ctx.newPage(); p.on("pageerror", (e) => errs.push(e.message));
    await p.addInitScript(([s, lang]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      if (lang) localStorage.setItem("chefmealan-lang", lang); localStorage.setItem("seeded", "1"); }, [seed, lang]);
    await require("./adult.cjs")(p);
    return p;
  };
  const card = async (p, food, menu = "Menu", foods = "Foods") => {
    await p.goto(U + "/"); await p.waitForTimeout(900);
    const row = () => p.locator(".menu-row").filter({ hasText: new RegExp(`^${foods}$`) }).first();
    for (let i = 0; i < 3 && (await row().count()) === 0; i++) { await p.getByRole("button", { name: menu }).first().click(); await p.waitForTimeout(250); }
    await row().click(); await p.waitForTimeout(400);
    await p.getByText(food, { exact: true }).first().click(); await p.waitForTimeout(700);
  };
  const lines = (p, sel) => p.locator(sel + " .lt-row").evaluateAll((rs) => rs.map((r) => {
    const n = r.querySelector(".lt-name"), pr = n.querySelector(".lt-printed");
    return { name: [...n.childNodes].filter((c) => c.nodeType === 3).map((c) => c.textContent).join("").trim(), printed: pr ? pr.textContent.trim() : null };
  }));
  try {
    let p = await open(null);
    await card(p, "Hazelnut wafers");
    let L = await lines(p, ".label-table-read");
    const names = L.map((x) => x.name);
    ok(names.join("|") === "Energy|Fat|of which saturates|Carbohydrate|of which sugars|Fibre|Protein|Salt|Calcium|Taurin", "DT339 AC1: the app's own names: " + names.join(", "));
    ok(L.find((x) => x.name === "Fat")?.printed === "Tuky/Masti/Мазнини/Λιπαρά", "DT339 AC1: Tuky/Masti/Мазнини/Λιπαρά small under Fat");
    ok(L.slice(0, 9).every((x) => x.printed && x.printed.includes("/")), "DT339 AC1: every known line shows its printed name under it");
    for (const n of ["Fat", "Carbohydrate", "Protein"]) ok(names.filter((x) => x === n).length === 1, `DT339 AC2: ${n} shows once`);
    const vals = await p.locator(".label-table-read .lt-row").evaluateAll((rs) => rs.map((r) => r.querySelector(".lt-val").textContent.trim()));
    ok(vals[1] === "28" && vals[3] === "58" && vals[6] === "7", "DT339 AC2: the printed amounts 28 g, 58 g and 7 g: " + vals.join(", "));
    ok(L[9].name === "Taurin" && L[9].printed === null, "DT339 AC5: a line it does not know keeps its printed name, nothing under it");
    ok(await p.locator(".label-table-read .lt-printed").first().evaluate((e) => parseFloat(getComputedStyle(e).fontSize) < parseFloat(getComputedStyle(e.parentElement).fontSize)), "DT339 AC1: the printed name is smaller than the app's name");
    // AC3: Review the label
    await p.getByRole("button", { name: /^Review the label/ }).first().click(); await p.waitForTimeout(900);
    L = await lines(p, ".label-table:not(.label-table-read)");
    ok(L.map((x) => x.name).slice(0, 4).join("|") === "Energy|Fat|of which saturates|Carbohydrate" && L.filter((x) => x.name === "Fat").length === 1, "DT339 AC3: Review the label shows the same names, once: " + L.map((x) => x.name).join(", "));
    ok(L.find((x) => x.name === "Fat")?.printed === "Tuky/Masti/Мазнини/Λιπαρά", "DT339 AC3: and the printed name under each");
    const fat = p.getByLabel("Fat", { exact: true });
    ok(await fat.inputValue() === "28", "DT339 AC3: the field is named Fat and holds 28");
    await fat.fill("27"); ok(await fat.inputValue() === "27", "DT339 AC3: the value changes as before");
    await p.context().close();
    // AC6: a pack saved before, its lines stored as not known
    p = await open(null); await card(p, "Old wafers");
    L = await lines(p, ".label-table-read");
    ok(L.filter((x) => x.name === "Fat").length === 1 && L.some((x) => x.name === "Calcium") && L.filter((x) => x.name === "Protein").length === 1, "DT339 AC6: a pack saved before shows the new names, each once: " + L.map((x) => x.name).join(", "));
    await p.context().close();
    // AC4: Srpski and Deutsch
    p = await open("sr-Latn"); await card(p, "Hazelnut wafers", "Meni", "Namirnice");
    L = await lines(p, ".label-table-read");
    ok(["Energija", "Masti", "Ugljeni hidrati", "Vlakna", "Proteini", "So", "Kalcijum"].every((n) => L.some((x) => x.name === n)), "DT339 AC4: in Srpski: " + L.map((x) => x.name).join(", "));
    await p.context().close();
    p = await open("de"); await card(p, "Hazelnut wafers", "Menü", "Lebensmittel");
    L = await lines(p, ".label-table-read");
    ok(["Fett", "Kohlenhydrate", "Calcium"].every((n) => L.some((x) => x.name === n)) && L.some((x) => /^Energie/.test(x.name)), "DT339 AC4: in Deutsch: " + L.map((x) => x.name).join(", "));
    await p.context().close();
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
