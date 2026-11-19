// Story DT329 (0.3.166, board DT329; Coach Milan 19 November 17:31 to 18:51, Go 18:55): How to. Line icons from the bar's
// set, Watch it with the home page's videos, a ninth situation Scan a pack from any screen (the long press on Plate, its own
// video), New at the top right of the card, the words of doing, and I did it asks How did it go? with five faces, filled
// like an emoji, and a line of your own; Coach Milan's list keeps both.
// The checks name the acceptance criteria of the board (DT329 AC1 to AC15).
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = []; seed.meals = []; seed.feedback = [];
const PORT = "3585", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (lang) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.setFixedTime(new Date("2026-11-19T19:00:00"));
    await page.addInitScript(([s, lang]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      if (lang) localStorage.setItem("chefmealan-lang", lang);
      localStorage.setItem("seeded", "1"); }, [seed, lang || null]);
    await require("./adult.cjs")(page);
    await page.goto(U + "/today"); await page.waitForTimeout(1200);
    await page.locator("header .menu-button").click(); await page.waitForTimeout(500); await page.locator(".howto-row").click(); await page.waitForTimeout(600);
    return page;
  };
  const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
  try {
    const page = await open();
    const text = async (sel) => clean(await page.locator(sel).first().innerText());
    const vids = []; page.on("request", (r) => { if (/\/landing\/way-.*\.mp4/.test(r.url())) vids.push(r.url().split("/").pop()); });
    // AC1: line icons, no emoji
    const icons = await page.locator(".ht-sit .ht-icon").evaluateAll((xs) => xs.map((x) => ({ svg: !!x.querySelector("svg"), text: x.textContent.trim(), bg: getComputedStyle(x).backgroundColor })));
    ok(icons.length === 9 && icons.every((i) => i.svg && i.text === "" && i.bg !== "rgba(0, 0, 0, 0)"), "DT329 AC1: each of the nine has a line icon on a tint, no emoji");
    // AC8 and AC11: nine, and the words of doing
    ok(/^Beta: 0 of 9 done/.test(await text(".ht-beta")), "DT329 AC8 and AC11: Beta: 0 of 9 done");
    // AC2: Video on the rows that have one
    const withVideo = await page.locator(".ht-sit").evaluateAll((xs) => xs.filter((x) => x.querySelector(".ht-vid")).map((x) => [...x.classList].find((c) => c.startsWith("ht-") && c !== "ht-sit").slice(3)));
    ok(withVideo.join("|") === "scanAnywhere|photoLog|handsFree|otherLang", "DT329 AC2: Video on the rows that have one: " + withVideo.join(", "));
    // AC10: New at the top right of its card
    const nb = await page.locator(".ht-scanAnywhere").evaluate((c) => { const r = c.getBoundingClientRect(), n = c.querySelector(".ht-new").getBoundingClientRect(); return { right: Math.round(r.right - n.right), top: Math.round(n.top - r.top) }; });
    ok(nb.right <= 20 && nb.top <= 20, `DT329 AC10: New at the top right of the card (${nb.right} px from the right, ${nb.top} from the top)`);
    // AC3, AC4, AC5: Watch it plays the home page's video, nothing before the tap
    for (const [id, file, cap] of [["photoLog", "way-meal.mp4", "The video shows steps 1 to 3."], ["handsFree", "way-cook.mp4", null], ["otherLang", "way-languages.mp4", null]]) {
      await page.locator(`.ht-${id}`).click(); await page.waitForTimeout(600);
      const before = vids.length;
      ok(await page.locator(".howto-one video").count() === 0 && before === vids.filter((v) => v !== file).length, `DT329 AC3: ${id}, nothing of the video before Watch it`);
      await page.locator(".ht-watch").click(); await page.waitForTimeout(1200);
      const v = await page.locator(".howto-one video").evaluate((x) => ({ src: x.getAttribute("src"), controls: x.controls }));
      const served = await fetch(U + v.src, { method: "HEAD" });
      ok(v.src === `/landing/${file}` && v.controls && served.ok, `DT329 AC3 and AC5: ${id} plays the home page's ${file}, with its controls`);
      if (cap) ok(clean(await page.locator(".ht-video figcaption").innerText()) === cap, "DT329 AC4: " + cap);
      await page.locator(".ht-back").click(); await page.waitForTimeout(400);
    }
    // AC6: Scan a pack from any screen
    await page.locator(".ht-scanAnywhere").click(); await page.waitForTimeout(500);
    ok(await text(".howto-one h3") === "Scan a pack from any screen" && await page.locator(".ht-steps li").count() === 4 && /Hold Plate in the bar/.test(await text(".ht-steps li")), "DT329 AC6: Scan a pack from any screen, four steps");
    await page.locator(".ht-watch").click(); await page.waitForTimeout(800);
    ok(await page.locator(".howto-one video").getAttribute("src") === "/landing/way-hold.mp4", "DT329 AC6: Watch it plays the long press");
    // AC12: I did it asks How did it go?
    const posted = []; page.on("request", (r) => { if (r.url().endsWith("/api/howto") && r.method() === "POST") posted.push(JSON.parse(r.postData() || "{}")); });
    ok(await text(".ht-tried") === "✓ I did it" && await text(".ht-try") === "Do it now ›", "DT329 AC11: Do it now, I did it");
    await page.locator(".ht-tried").click(); await page.waitForTimeout(400);
    const faces = await page.locator(".ht-r").evaluateAll((xs) => xs.map((x) => ({ label: x.getAttribute("aria-label"), fill: getComputedStyle(x.querySelector("svg circle")).fill })));
    ok(await text(".howto-ask h3") === "How did it go?" && faces.length === 5 && faces[0].label === "1 of 5, hard" && faces[4].label === "5 of 5, easy", "DT329 AC12: How did it go?, five faces with their names: " + faces.map((f) => f.label).join(", "));
    ok(new Set(faces.map((f) => f.fill)).size === 5 && faces.every((f) => f.fill !== "none"), "DT329 AC15: each face filled with its own colour: " + faces.map((f) => f.fill).join(" "));
    ok(await page.locator(".ht-send").isDisabled(), "DT329 AC12: Send waits for a face");
    await page.locator(".ht-r").nth(3).click(); await page.waitForTimeout(200);
    const chosen = await page.locator(".ht-r").nth(3).evaluate((x) => ({ on: x.getAttribute("aria-checked"), border: getComputedStyle(x).borderTopColor, width: getComputedStyle(x).borderTopWidth }));
    ok(chosen.on === "true" && parseFloat(chosen.width) >= 2, "DT329 AC15: the chosen face has a border in its colour: " + chosen.border);
    await page.locator(".ht-rate .ht-note").fill("Held Plate in the shop, the code read at once.");
    await page.locator(".ht-send").click(); await page.waitForTimeout(600);
    ok(posted.length === 1 && posted[0].id === "scanAnywhere" && posted[0].s === "tried" && posted[0].r === 4 && posted[0].note === "Held Plate in the shop, the code read at once.", "DT329 AC12: the face and the line go to Coach Milan: " + JSON.stringify(posted[0] || {}));
    // AC13: what I said
    ok(await page.locator(".ht-tried").getAttribute("aria-pressed") === "true" && /You said 4 of 5/.test(await text(".ht-yournote")) && /code read at once/.test(await text(".ht-yournote")) && await page.locator(".ht-yournote .ht-face svg").count() === 1, "DT329 AC13: I did it on, the face, You said 4 of 5 and the line");
    // AC14: Coach Milan's list keeps the face and the line
    const all = await (await fetch(U + "/api/howto")).json(); const me = (all.testers ?? [])[0]?.items ?? {};
    ok(me.scanAnywhere?.s === "tried" && me.scanAnywhere?.r === 4 && /code read at once/.test(me.scanAnywhere?.note || ""), "DT329 AC14: the coach's list holds the face and the line: " + JSON.stringify(me.scanAnywhere || {}));
    // AC10 and AC11: Done under New
    await page.locator(".ht-back").click(); await page.waitForTimeout(400);
    const side = await page.locator(".ht-scanAnywhere .ht-side").evaluate((s) => { const n = s.querySelector(".ht-new").getBoundingClientRect(), d = s.querySelector(".ht-done").getBoundingClientRect(); return d.top >= n.bottom - 1; });
    ok(side && /^Beta: 1 of 9 done/.test(await text(".ht-beta")) && await text(".ht-scanAnywhere .ht-done") === "✓ Done", "DT329 AC10 and AC11: Done under New, Beta: 1 of 9 done");
    // AC13: a tap on I did it takes the mark off
    await page.locator(".ht-scanAnywhere").click(); await page.waitForTimeout(400); await page.locator(".ht-tried").click(); await page.waitForTimeout(400);
    ok(await page.locator(".ht-tried").getAttribute("aria-pressed") === "false" && posted.length === 2 && posted[1].s === null, "DT329 AC13: a tap on I did it takes the mark off");
    // AC6: Do it now opens the camera's modes, as holding Plate does
    await page.locator(".ht-try").click(); await page.waitForTimeout(800);
    ok(await page.locator(".plate-cam-menu").isVisible(), "DT329 AC6: Do it now opens the small menu of the camera's modes");
    // AC7: its video under the rules, not on the home page
    const clips = JSON.parse(fs.readFileSync(path.join(ROOT, "public/landing/clips.json"), "utf8"));
    const home = await (await b.newPage()).goto(U + "/?home").then(async (r) => (await r.text()));
    const hp = await b.newPage(); await hp.goto(U + "/?home"); await hp.waitForTimeout(1200);
    const homeVids = await hp.locator("video source").evaluateAll((xs) => xs.map((x) => x.getAttribute("src")));
    ok(clips.clips.includes("hold") && !homeVids.includes("/landing/way-hold.mp4") && home.length > 0, "DT329 AC7: the long press video was recorded under the rules and is not on the home page");
    // AC9: Serbian and German
    for (const [lang, title, watch] of [["sr-Latn", "Skeniraj pakovanje sa bilo kog ekrana", "Pogledaj"], ["de", "Eine Packung von jedem Bildschirm aus scannen", "Ansehen"]]) {
      const p = await open(lang); await p.locator(".ht-scanAnywhere").click(); await p.waitForTimeout(400);
      ok(clean(await p.locator(".howto-one h3").innerText()) === title && clean(await p.locator(".ht-watch").innerText()) === watch, `DT329 AC9: ${lang}: ${title}, ${watch}`);
    }
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough stopped: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `\n${fail} failed` : "\nall passed"); process.exit(fail ? 1 : 0);
})();
