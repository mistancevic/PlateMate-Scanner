// DT141 (Anna's DT119, brought up to 0.2.125): the safety question asked in setup, not found later
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const PORT = "3311", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  await page.clock.setFixedTime(new Date("2026-10-28T18:30:00"));
  const R = "/home/claude/boards/rs";
  const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742";
  const flat = () => page.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue; if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } window.scrollTo(0, 0); });
  const shot = async (name, h) => { await page.waitForTimeout(400); await flat(); await page.waitForTimeout(200); await page.screenshot({ path: `${R}/${name}.png`, fullPage: !h, ...(h ? { clip: { x: 0, y: 0, width: 390, height: h } } : {}) }); console.log("shot " + name); };
  const note = (sel, text, where = "after") => page.evaluate(({ sel, text, NOTE, where }) => { const el = document.querySelector(sel); if (!el) return; const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = text; el[where](d); }, { sel, text, NOTE, where });
  const fresh = async (consent) => { await page.goto(U + "/"); await page.evaluate(([s, consent]) => { localStorage.clear(); localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "female", birthYear: 1990, heightCm: 170, weightKg: 66, plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], adultAt: "2026-10-28T16:00:00Z", ...(consent ? { consentBodyAt: "2026-10-28T16:00:00Z" } : {}) }));
    localStorage.setItem("seeded", "1"); }, [seed, consent]); };
  await require(path.join(ROOT, "tests/flows/adult.cjs"))(page);
  // the question as it is on Profile, kept to place it in setup
  await fresh(true); { await page.evaluate(() => localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-28T16:00:00Z", source: "profile" }))); }
  await page.goto(U + "/me/profile"); await page.waitForTimeout(1300);
  const door = await page.locator(".door").first().evaluate((e) => e.outerHTML);
  // DT141a, now: the chat waits, with no way to the question
  await page.goto(U + "/"); await page.waitForTimeout(1300);
  await page.locator(".chat-fab").click(); await page.waitForTimeout(1200);
  await page.evaluate((mark) => { for (const el of document.querySelectorAll(".talk-overlay *")) if (/Answer the question on your profile first/.test(el.textContent || "") && el.children.length < 3) { el.style.cssText += ";" + mark; break; } }, mark);
  await note(".talk-overlay", "Now (0.2.125): Anna opens the chat. It waits on a question she has never seen, at the bottom of Profile, after the form and its Save button. No link takes her there.", "prepend");
  await shot("r141a", 1500);
  // DT141b, new: in setup, right after I agree
  await fresh(false); await page.goto(U + "/"); await page.waitForTimeout(1300);
  await page.getByRole("button", { name: /^I agree$/ }).click(); await page.waitForTimeout(500);
  await page.evaluate(({ door, mark }) => { const anchor = [...document.querySelectorAll(".calc-step")].find((x) => /You$/.test(x.textContent)); if (!anchor) return; const w = document.createElement("div"); w.innerHTML = door; const card = w.firstElementChild; card.style.cssText += ";margin:10px 0;" + mark; anchor.before(card); }, { door, mark });
  await note(".door", "New: right after I agree, the same question, the same answers: the situations, or None of these applies to me. One tap if none applies. Then 1. You. The chat never waits on it.", "before");
  await shot("r141b");
  // DT141c, new: an older account the chat still waits for: the line is a link to the question
  await fresh(true); await page.evaluate(() => localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-28T16:00:00Z", source: "profile" })));
  await page.goto(U + "/"); await page.waitForTimeout(1300);
  await page.locator(".chat-fab").click(); await page.waitForTimeout(1200);
  await page.evaluate((mark) => { for (const el of document.querySelectorAll(".talk-overlay *")) if (/Answer the question on your profile first/.test(el.textContent || "") && el.children.length < 3) { el.textContent = "One question first, once a year: is any of this true for you? One tap if none applies."; const bt = document.createElement("button"); bt.className = "pill pill-small pill-primary"; bt.style.cssText = "display:block;margin-top:8px"; bt.textContent = "Answer it now"; el.appendChild(bt); el.style.cssText += ";" + mark; break; } }, mark);
  await note(".talk-overlay", "New, for an account that has not answered yet (or a year later): the line says what it waits for, and Answer it now opens the question. The answer brings you back to the chat.", "prepend");
  await shot("r141c", 1500);
  await b.close(); server.kill();
})();
