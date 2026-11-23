// DT334 (0.3.178, board Stories278; Go 23 November 2026, 08:43): up to 3 kitchens you cook, in setup's step 5 and in Me, Where
// I shop and cook. The line says Pick up to 3; with 3 picked a fourth tap picks nothing and says Up to 3. Tap one off first.;
// one off, then another; a profile from before with more keeps its list (that Chef Mealan is sent the first 3 is a unit test,
// src/kitchens.test.ts).
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = []; seed.foods = [];
const PORT = "3603", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (personal, goal) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1500 } }); const p = await ctx.newPage(); p.on("pageerror", (e) => errs.push(e.message));
    await p.addInitScript(([s, personal, goal]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "female", birthYear: 1990, heightCm: 170, weightKg: 66, plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 }, ...personal }));
      if (goal) localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-28T16:00:00Z", consentBodyAt: "2026-10-28T16:00:00Z", declaredAt: "2026-10-28T16:00:00Z", aiConfirmedAt: "2026-10-28T16:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, [seed, personal, goal]);
    await require("./adult.cjs")(p);
    return p;
  };
  const kitchens = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-personal")).kitchens || []);
  try {
    // setup's step 5
    let p = await open({}, false);
    await p.goto(U + "/"); await p.waitForTimeout(1300);
    await p.getByRole("button", { name: /^Maintain/ }).first().click(); await p.waitForTimeout(300);
    await p.getByRole("button", { name: /^Apply from today/ }).click(); await p.waitForTimeout(800);
    const step = p.locator(".shop-step"), group = step.getByRole("group", { name: "The kitchens you cook" });
    ok(/Pick up to 3\.$/.test((await step.locator(".kitchens > small").first().innerText()).trim()), "DT334 AC1: setup's step 5 says Pick up to 3");
    for (const k of ["Balkan", "Italian", "Greek"]) { await group.getByRole("button", { name: k, exact: true }).click(); await p.waitForTimeout(120); }
    await group.getByRole("button", { name: "Indian", exact: true }).click(); await p.waitForTimeout(250);
    ok((await kitchens(p)).join() === "Balkan,Italian,Greek", "DT334 AC2: a fourth tap picks nothing: " + (await kitchens(p)).join(", "));
    ok((await step.locator(".kitchens-full").innerText()).trim() === "Up to 3. Tap one off first.", "DT334 AC2: one line says Up to 3. Tap one off first.");
    await group.getByRole("button", { name: /Greek$/ }).click(); await p.waitForTimeout(150);
    await group.getByRole("button", { name: "Indian", exact: true }).click(); await p.waitForTimeout(250);
    ok((await kitchens(p)).join() === "Balkan,Italian,Indian" && await step.locator(".kitchens-full").count() === 0, "DT334 AC3: Greek off, then Indian: Balkan, Italian, Indian, and the line is gone");
    await p.context().close();
    // Me, Where I shop and cook: the same, and a profile from before with 10 keeps its list
    const ten = ["Balkan", "Italian", "Mediterranean", "German", "French", "Spanish", "Greek", "Turkish", "Middle Eastern", "Indian"];
    p = await open({ kitchens: ten }, true);
    await p.goto(U + "/me/shop"); await p.waitForTimeout(1200);
    ok(/Pick up to 3\.$/.test((await p.locator(".kitchens > small").first().innerText()).trim()), "DT334 AC1: Me, Where I shop and cook says Pick up to 3");
    ok((await kitchens(p)).length === 10, "DT334 AC4: a profile from before keeps its 10 kitchens");
    await p.getByRole("group", { name: "The kitchens you cook" }).getByRole("button", { name: "Thai", exact: true }).click(); await p.waitForTimeout(250);
    ok((await kitchens(p)).length === 10 && await p.locator(".kitchens-full").count() === 1, "DT334 AC4: with 10 from before, a new one is not picked and the line says so");
    await p.context().close();
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
