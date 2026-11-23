// DT340 (0.3.182, board Stories282; Go 23 November 2026, 13:15): the client's card shows activity. The example coach on
// Thursday 26 November, 13:30: four levels a day (AC1), today filling in (AC2), Last active (AC3), a client quiet for 3 days
// in Waiting for you (AC4, chefmealan-coach-demo-quiet). The client: a meal with nothing planned skipped on purpose on Plan
// (AC5), the privacy notice (AC7), and the phone marks the day opened, then active. AC6, the full-day rule: src/activity.test.ts.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8")); seed.items = []; seed.feedback = []; seed.meals = [];
const PORT = "3607", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (quiet) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1000 }, timezoneId: "Europe/Berlin" }); const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.setFixedTime(new Date("2026-11-26T13:30:00+01:00"));
    await page.addInitScript(([s, quiet]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      if (quiet) localStorage.setItem("chefmealan-coach-demo-quiet", "1"); localStorage.setItem("seeded", "1"); }, [seed, quiet]);
    await require("./adult.cjs")(page);
    return page;
  };
  const cards = (page) => page.evaluate(() => [...document.querySelectorAll("div.client-row:not(.cw-today)")].map((c) => ({ name: c.querySelector(".client-head b").textContent.trim(), last: c.querySelector(".last-active")?.textContent.trim() ?? "",
    lv: [...c.querySelectorAll(".db-cell")].map((x) => x.dataset.level + (x.classList.contains("is-today") ? "*" : "")), key: c.querySelector(".db-key").textContent.trim() })));
  try {
    // the coach
    let page = await open(true);
    await page.goto(U + "/today?coachdemo"); await page.waitForTimeout(1500);
    await page.locator(".bottom-nav button").last().click(); await page.waitForTimeout(1200);
    const c = await cards(page), nina = c.find((x) => x.name === "Nina"), lena = c.find((x) => x.name === "Lena"), sara = c.find((x) => x.name === "Sara");
    ok(nina && nina.lv.join(" ") === "full full active active* todo todo todo", "DT340 AC1: Nina's week: full, full, active, today active, days to come dashed: " + nina?.lv.join(" "));
    ok(sara && sara.lv.slice(0, 4).join(" ") === "empty empty empty empty*", "DT340 AC1: Sara's days, the app not opened: " + sara?.lv.join(" "));
    ok(lena && lena.lv.includes("opened*"), "DT340 AC2: Lena opened the app today and logged nothing: today grey, outlined: " + lena?.lv.join(" "));
    ok(/Amber: active/.test(lena.key) && /Grey: opened only/.test(lena.key) && /Dashed: still to come/.test(lena.key) && /Empty: not opened/.test(sara.key) && !/Grey/.test(sara.key), "DT340 AC1: the key line names only what shows: " + lena.key + " / " + sara.key);
    ok(nina.last === "Last active: today 11:40" && lena.last === "Last active: yesterday 20:15" && sara.last === "Last active: 5 days ago, Saturday", `DT340 AC3: ${nina.last} / ${lena.last} / ${sara.last}`);
    const first = page.locator(".waiting .menu-row").first();
    ok(/^Sara · Quiet for 3 days/.test((await first.innerText()).trim()) && /last opened the app Sunday 22 November/.test(await first.innerText()), "DT340 AC4: Waiting for you, first: Sara · Quiet for 3 days, last opened the app Sunday 22 November");
    ok(await page.locator(".waiting .menu-row").filter({ hasText: /Nina · Quiet|Lena · Quiet/ }).count() === 0, "DT340 AC4: Nina and Lena opened the app: not quiet");
    await first.click(); await page.waitForTimeout(800);
    ok(/Sara/.test(await page.locator("main").first().innerText()), "DT340 AC4: a tap opens Sara");
    await page.context().close();
    // without the third client, the example coach is as before: two clients, nobody quiet
    page = await open(false);
    await page.goto(U + "/today?coachdemo"); await page.waitForTimeout(1500);
    await page.locator(".bottom-nav button").last().click(); await page.waitForTimeout(1200);
    ok((await cards(page)).length === 2 && await page.locator(".waiting .menu-row").filter({ hasText: "Quiet for" }).count() === 0, "the example coach without Sara: two clients, nobody quiet");
    await page.context().close();
    // the client
    page = await open(false);
    await page.goto(U + "/"); await page.waitForTimeout(1000);
    let act = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-activity") || "{}"));
    ok(act.days?.["2026-11-26"] === "opened" && /^2026-11-26T12:30/.test(act.lastOpenAt ?? ""), "DT340: opening the app marks today opened: " + JSON.stringify(act));
    await page.locator("nav button").filter({ hasText: "Plan" }).click(); await page.waitForTimeout(900);
    await page.getByRole("tab").filter({ hasText: /25/ }).first().click(); await page.waitForTimeout(700);
    const skip = page.locator(".past-add .skip-unplanned");
    ok(await skip.count() === 3, "DT340 AC5: a day gone by, nothing planned: each meal has I skipped it: " + await skip.count());
    await skip.first().click(); await page.waitForTimeout(600);
    const row = page.locator(".past-add .past-plate").first();
    ok(/Skipped/.test(await row.innerText()) && await row.getByRole("button", { name: "Undo" }).count() === 1, "DT340 AC5: breakfast shows Skipped with Undo");
    let planned = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-planned") || "{}"));
    const bk = Object.values(planned["2026-11-25"] ?? {})[0];
    ok(bk && bk.skipped === true, "DT340 AC5: kept as a skip on purpose: " + JSON.stringify(planned["2026-11-25"] ?? null));
    act = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-activity") || "{}"));
    ok(act.days?.["2026-11-26"] === "active" && !!act.lastActiveAt, "DT340: changing the plan marks today active");
    await row.getByRole("button", { name: "Undo" }).click(); await page.waitForTimeout(500);
    planned = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-planned") || "{}"));
    ok(Object.keys(planned["2026-11-25"] ?? {}).length === 0 && await page.locator(".past-add .skip-unplanned").count() === 3, "DT340 AC5: Undo removes the skip, nothing left planned");
    // AC7: the privacy notice
    await page.goto(U + "/privacy"); await page.waitForTimeout(1000);
    ok(/Your coach sees on which days you opened the app, and when you last did something in it/.test(await page.locator("body").innerText()), "DT340 AC7: the privacy notice says so");
    await page.context().close();
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
