// DT236 v3 (0.3.93, boards Stories177 and Stories180; Coach Milan 5 November 11:36, Go): the home page in English, Srpski and
// Deutsch (Beta). chefmealan.com stays English; /sr and /de carry their own language, title and search line; the switch in the
// header shows the language that is on and opens all three; a phone in Serbian or German sees the box once; the choice is the
// app's too. The header fits on a phone in every language. The clips stay English (Coach Milan 11:26).
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const PORT = "3400", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const de = JSON.parse(fs.readFileSync(path.join(__dirname, "../../src/i18n/de.json"), "utf8")).screens;
  const open = async (locale, width = 390) => { const ctx = await b.newContext({ viewport: { width, height: 844 }, locale }); const p = await ctx.newPage(); p.on("pageerror", (e) => errs.push(e.message)); return p; };
  const headFits = (p) => p.evaluate(() => { const h = document.querySelector(".l-top"); return [...h.querySelectorAll("a,button")].filter((e) => e.getBoundingClientRect().width).every((e) => e.getBoundingClientRect().right <= window.innerWidth - 4 && e.scrollWidth <= e.clientWidth + 1); });
  try {
    // the addresses: their own language and title for search engines and shared links
    const sr = await (await fetch(U + "/sr")).text(), dePage = await (await fetch(U + "/de")).text(), en = await (await fetch(U + "/")).text();
    ok(/<html lang="de">/.test(dePage) && dePage.includes(`<title>${de["home.metaTitle"].text}</title>`), "/de says lang=de, with its German title");
    ok(/<html lang="sr-Latn">/.test(sr), "/sr says lang=sr-Latn");
    ok(/<html lang="en">/.test(en) && /hreflang="de" href="https:\/\/chefmealan\.com\/de"/.test(en), "chefmealan.com stays English and names the three addresses");
    // an English phone: no box; the switch shows EN and opens all three
    let p = await open("en-GB"); await p.goto(U + "/?home"); await p.waitForTimeout(1500);
    ok(await p.locator(".lang-ask").count() === 0, "an English phone sees no box");
    const sw = p.locator(".lang-switch-btn");
    ok(await sw.count() === 1 && (await sw.textContent()).trim() === "EN", "the switch shows EN");
    const box = await sw.boundingBox(); ok(box && box.width >= 44 && box.height >= 44, "the switch is 44 px");
    await sw.click(); await p.waitForTimeout(300);
    const items = await p.locator(".lang-switch-menu button").allTextContents();
    ok(items.length === 3 && /English/.test(items[0]) && /Srpski/.test(items[1]) && /Deutsch \(Beta\)/.test(items[2]), "it opens English, Srpski (latinica), Deutsch (Beta): " + items.join(" · "));
    await p.locator(".lang-switch-menu button").filter({ hasText: "Deutsch" }).click(); await p.waitForTimeout(600);
    ok(new URL(p.url()).pathname === "/de", "Deutsch goes to chefmealan.com/de");
    ok((await p.locator("h1").first().textContent()).trim() === de["home.h1"].text, "the page is in German: " + (await p.locator("h1").first().textContent()));
    ok(await p.evaluate(() => localStorage.getItem("chefmealan-lang")) === "de", "the app takes the same choice");
    ok(await headFits(p), "in German the header fits a 390 px phone");
    const clips = await p.locator("video source").evaluateAll((es) => es.map((e) => e.getAttribute("src")));
    ok(clips.length > 0 && clips.every((s) => /^\/landing\/way-/.test(s)), "the clips stay as they are");
    // DT253: the languages block names each language in its own words, on every page
    ok((await p.locator(".l-langs li").allTextContents()).join("|") === "English|Srpski|Deutsch · Beta", "in German the languages block still names English, Srpski, Deutsch · Beta");
    await p.context().close();
    // a German phone: the box once, Auf Deutsch
    p = await open("de-DE"); await p.goto(U + "/?home"); await p.waitForTimeout(1500);
    ok(await p.locator(".lang-ask").filter({ hasText: "Chef Mealan gibt es auch auf Deutsch." }).count() === 1, "a German phone sees the box above the English page");
    await p.getByRole("button", { name: "Auf Deutsch" }).click(); await p.waitForTimeout(600);
    ok(new URL(p.url()).pathname === "/de" && await p.locator(".lang-ask").count() === 0, "Auf Deutsch opens /de, the box goes");
    await p.goto(U + "/?home"); await p.waitForTimeout(1200);
    ok(new URL(p.url()).pathname === "/de", "chefmealan.com opens the German page for this phone from now on");
    await p.context().close();
    // a Serbian phone: Continue in English keeps English, and the box does not come back
    p = await open("sr-RS"); await p.goto(U + "/?home"); await p.waitForTimeout(1500);
    ok(await p.locator(".lang-ask").filter({ hasText: "Chef Mealan je i na srpskom." }).count() === 1, "a Serbian phone sees the box in Srpski");
    await p.getByRole("button", { name: "Continue in English" }).click(); await p.waitForTimeout(400);
    await p.reload(); await p.waitForTimeout(1200);
    ok(await p.locator(".lang-ask").count() === 0 && new URL(p.url()).pathname === "/" && await p.evaluate(() => !localStorage.getItem("chefmealan-lang")), "Continue in English: English stays, the box does not come back");
    await p.context().close();
    // a smaller phone: the header fits in all three
    for (const [pathName, name] of [["/?home", "English"], ["/sr?home", "Srpski"], ["/de?home", "German"]]) {
      p = await open("en-GB", 360); await p.goto(U + pathName); await p.waitForTimeout(1300);
      ok(await headFits(p), `${name}: the header fits a 360 px phone`);
      ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${name}: nothing scrolls sideways`);
      await p.context().close();
    }
  } finally { await b.close(); server.kill(); }
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  if (fail) { console.log(`${fail} failed`); process.exit(1); }
  console.log("all passed");
})();
