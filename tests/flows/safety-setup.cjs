// JOURNEY (0.2.126, board Stories97, DT141; Anna's DT119; Milan 28 October 18:33 Go): the safety question is asked in setup,
// right after I agree, and the step ends on its button, Next: 1. You. A chat that waits for it says so in one line, and
// Answer it now opens the question right there, ending on Back to the chat.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const PORT = "3312", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const open = async (withGoal) => {
    const page = await b.newPage({ viewport: { width: 390, height: 1400 } }); page.on("pageerror", (e) => errs.push(e.message));
    await page.addInitScript(([s, withGoal]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "female", birthYear: 1990, heightCm: 170, weightKg: 66, plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], adultAt: "2026-10-28T16:00:00Z", ...(withGoal ? { consentBodyAt: "2026-10-28T16:00:00Z" } : {}) }));
      if (withGoal) localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-28T16:00:00Z", source: "profile" }));
      localStorage.setItem("seeded", "1"); }, [seed, withGoal]);
    await require("./adult.cjs")(page);
    return page;
  };
  const safety = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-safety")));
  // setup
  let page = await open(false);
  await page.goto(U + "/"); await page.waitForTimeout(1300);
  await page.getByRole("button", { name: /^I agree$/ }).click(); await page.waitForTimeout(400);
  const q = page.locator("#safety-question");
  ok(await q.count() === 1 && await page.locator(".calc-step").count() === 0, "right after I agree: the question, and nothing else of setup yet");
  const btn = q.getByRole("button", { name: /^(Next|Tick one)/ });
  ok(await btn.isDisabled() && /Tick one, or None of these applies to me/.test(await btn.textContent()), "the step ends on its button, waiting for a tick");
  await q.getByText("None of these applies to me", { exact: true }).click(); await page.waitForTimeout(300);
  ok(await btn.isEnabled() && (await btn.textContent()).trim() === "Next: 1. You", "a tick: Next: 1. You");
  ok((await safety(page)).none === true && (await safety(page)).declaredAt, "the answer is kept straight away");
  await btn.click(); await page.waitForTimeout(400);
  ok(await q.count() === 0 && (await page.locator(".calc-step").first().textContent()).trim() === "1. You", "Next: the question is done, 1. You follows");
  await page.close();
  // the chat
  page = await open(true);
  await page.goto(U + "/"); await page.waitForTimeout(1300);
  await page.locator(".chat-fab").click(); await page.waitForTimeout(900);
  const note = page.locator(".safety-note");
  ok(/One question first, once a year: is any of this true for you\? One tap if none applies\./.test(await note.textContent()) && await note.getByRole("button", { name: "Answer it now" }).count() === 1, "the chat says what it waits for, with Answer it now");
  await note.getByRole("button", { name: "Answer it now" }).click(); await page.waitForTimeout(400);
  const q2 = page.locator("#safety-question");
  ok(await q2.count() === 1 && await q2.getByRole("button", { name: /^Tick one/ }).isDisabled(), "the question opens in the chat");
  await q2.getByText("None of these applies to me", { exact: true }).click(); await page.waitForTimeout(300);
  await q2.getByRole("button", { name: "Back to the chat" }).click(); await page.waitForTimeout(400);
  ok(await q2.count() === 0 && await page.locator(".safety-note").count() === 0, "Back to the chat: the chat no longer waits");
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
