// DT348 (0.3.197, board DT348, canvas Page 6; Coach Milan, Go 26 November 2026, 08:03). One button to add a step: + Add a step,
// the app's outlined button (14 px corners, D9), 44 px high (D10), under each step with 8 px above and below, between steps and
// after the last; + Step here is gone. Its screen reader label says where. The publish sheet writes steps with the same editor.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(__dirname, "seed.json"), "utf8")); seed.items = [];
const F = (id) => seed.foods.find((f) => f.id === id); const it = (id, f, g) => ({ id, food: f, grams: g, locked: false });
const I = { o: it("a", F("f-oats"), 60), m: it("b", F("f-milk"), 200), b: it("c", F("f-banana"), 100) }; const tok = (x, n) => `[[i:${x.id}|${n}]]`;
const recipe = { id: "m-oats", title: "Banana porridge", items: Object.values(I), portion: 360, savedAt: "2026-11-25T12:00:00Z", steps: [`Bring ${tok(I.m, "milk")} to a simmer.`, `Stir in ${tok(I.o, "oats")} and cook for 5 minutes.`] };
const PORT = "3620", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (lang) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage(); p.on("pageerror", (e) => errs.push(e.message));
    await p.clock.setFixedTime(new Date("2026-11-26T08:30:00+01:00"));
    await p.addInitScript(([s, lang]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-coach", "1");
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      if (lang) localStorage.setItem("chefmealan-lang", lang); localStorage.setItem("seeded", "1"); }, [{ ...seed, meals: [recipe], feedback: [] }, lang]);
    await require("./adult.cjs")(p);
    await p.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.goto(U + "/my-recipes/m-oats"); await p.waitForTimeout(1500);
    return p;
  };
  // the buttons and steps of an editor, top to bottom: words, label, height, corners, and the space to the next
  const layout = (p, sel) => p.evaluate((sel) => { const st = document.querySelector(sel); const els = [...st.querySelectorAll(".st-row, button.st-step, button.st-between")].filter((e, i, a) => a.indexOf(e) === i).sort((x, y) => x.getBoundingClientRect().top - y.getBoundingClientRect().top);
    return els.map((e, i) => { const r = e.getBoundingClientRect(), n = els[i + 1]; return { step: e.classList.contains("st-row"), text: e.textContent.trim(), label: e.getAttribute("aria-label") || "", h: Math.round(r.height), corner: getComputedStyle(e).borderTopLeftRadius, gap: n ? Math.round(n.getBoundingClientRect().top - r.bottom) : null }; }); }, sel);
  try {
    let p = await open(null);
    await p.getByRole("button", { name: "Edit recipe", exact: true }).click(); await p.waitForTimeout(900);
    let L = await layout(p, "section.rq-steps .st"); const btns = L.filter((x) => !x.step);
    ok(btns.length === 2 && btns.every((x) => x.text === "+ Add a step" && x.h >= 44 && x.corner === "14px") && !/Step here/.test(await p.locator("section.rq-steps").innerText()), "DT348 AC1: + Add a step under step 1 and step 2, the same outlined button, 44 px, 14 px corners; no + Step here: " + JSON.stringify(btns.map((x) => [x.text, x.h, x.corner])));
    ok(L.slice(0, -1).every((x) => x.gap === 8), "DT348 AC1: 8 px above and below each button: " + L.map((x) => x.gap).join(", "));
    ok(JSON.stringify(btns.map((x) => x.label)) === JSON.stringify(["Add a step between step 1 and step 2", "Add a step after step 2"]), "DT348 AC3: the labels say where: " + btns.map((x) => x.label).join(" | "));
    await p.getByRole("button", { name: "Add a step after step 2" }).click(); await p.waitForTimeout(400);
    const focus = await p.evaluate(() => document.activeElement?.getAttribute("aria-label"));
    L = await layout(p, "section.rq-steps .st");
    ok(focus === "Step 3" && L.filter((x) => x.step).length === 3 && JSON.stringify(L.filter((x) => !x.step).map((x) => x.label)) === JSON.stringify(["Add a step between step 1 and step 2", "Add a step between step 2 and step 3", "Add a step after step 3"]), "DT348 AC2: step 3 opens with the cursor in it; + Add a step between 2 and 3 and under 3: " + focus);
    await p.context().close();
    // AC4: the publish sheet, the same editor
    p = await open(null);
    await p.locator(".rq-pub").getByRole("button", { name: /^(Publish|Continue)$/ }).click(); await p.waitForTimeout(900);
    L = await layout(p, ".publish-sheet .st"); const sb = L.filter((x) => !x.step);
    ok(sb.length === 2 && sb.every((x) => x.text === "+ Add a step" && x.h >= 44) && !/Step here/.test(await p.locator(".publish-sheet").innerText()), "DT348 AC4: the publish sheet: + Add a step between and after, no + Step here");
    await p.context().close();
    // AC5: Srpski and German
    for (const [lang, edit] of [["sr-Latn", "Uredi recept"], ["de", "Rezept bearbeiten"]]) {
      p = await open(lang);
      await p.getByRole("button", { name: edit, exact: true }).click(); await p.waitForTimeout(900);
      L = await layout(p, "section.rq-steps .st"); const lb = L.filter((x) => !x.step);
      ok(lb.length === 2 && lb[0].text === lb[1].text && lb[0].text.startsWith("+ ") && !/Add a step/.test(lb.map((x) => x.label).join(" ")) && /2/.test(lb[1].label), `DT348 AC5 ${lang}: the same words on both buttons, labels in ${lang}: ${lb[0].text} | ${lb.map((x) => x.label).join(" | ")}`);
      await p.context().close();
    }
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  } catch (e) { ok(false, "ran to the end: " + e.message.split("\n")[0]); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} failed` : "all passed"); process.exit(fail ? 1 : 0);
})();
