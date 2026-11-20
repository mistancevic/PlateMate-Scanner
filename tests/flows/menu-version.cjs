// DT331 (0.3.168, board DT331): the app's version at the bottom of the Menu, between the links line and Sign out, the same line as
// About shows. AC1 the line is in the Menu under the links; AC2 it stands between the links and Sign out (a local run has no
// sign-in, so the order against Sign out is read from the Menu's code); AC3 it is this release's number and commit, the same as About.
// Unchanged: About keeps its line, the links and every Menu row stay.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
seed.items = []; seed.meals = [];
process.on("unhandledRejection", (e) => { console.log("FAIL " + (e && e.message ? e.message : e)); process.exit(1); });
(async () => {
  const PORT = "3231", U = "http://127.0.0.1:" + PORT;
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: ["ignore", "pipe", "pipe"] });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
  const errs = [];
  try {
    const version = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).version;
    for (const [w, h, tag] of [[390, 844, "phone"], [360, 780, "small phone"]]) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: "en-GB" }); const p = await ctx.newPage();
      p.on("pageerror", (e) => errs.push(e.message));
      await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
        localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
        localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
        localStorage.setItem("seeded", "1"); }, seed);
      await require("./adult.cjs")(p);
      await p.goto(U + "/today"); await p.waitForTimeout(1200);
      await p.locator("header .menu-button").click(); await p.waitForTimeout(600);
      // AC1: the line is in the Menu, right under the links line
      const line = p.locator(".menu-version");
      ok(await line.count() === 1, `${tag}: DT331 AC1, the Menu has one version line`);
      const text = clean(await line.innerText());
      const prevHasLinks = await line.evaluate((el) => { const prev = el.previousElementSibling; return !!prev && !!prev.querySelector('a[href="/about"]') && !!prev.querySelector('a[href="/disclaimer"]'); });
      ok(prevHasLinks, `${tag}: DT331 AC1, the version line comes right under the links line`);
      const box = await line.boundingBox(); const links = await line.evaluate((el) => { const r = el.previousElementSibling.getBoundingClientRect(); return { bottom: r.bottom }; });
      ok(box && box.y >= links.bottom - 1 && box.x >= 0 && box.x + box.width <= w + 1, `${tag}: DT331 AC1, the line sits below the links and inside the screen`);
      // small and grey, as the links
      const look = await line.evaluate((el) => { const s = getComputedStyle(el), l = getComputedStyle(el.previousElementSibling); return { fs: s.fontSize, lfs: l.fontSize }; });
      ok(look.fs === look.lfs, `${tag}: DT331, the line is the links' size (${look.fs})`);
      // AC3: this release's number and commit, the same as About
      ok(new RegExp(`^Version ${version.replace(/\./g, "\\.")} · \\S+$`).test(text), `${tag}: DT331 AC3, the line reads Version ${version} and the commit: ${text}`);
      // Unchanged: every Menu row is there, About keeps its line, and both say the same
      const rows = (await p.locator(".menu-row").allInnerTexts()).map(clean);
      ok(rows.some((r) => r.startsWith("About")) && rows.length >= 4, `${tag}: DT331 unchanged, the Menu rows are there (${rows.length})`);
      await p.locator(".menu-row").filter({ hasText: "About" }).click(); await p.waitForTimeout(500);
      const about = (await p.locator("section.card p.small").allInnerTexts()).map(clean).find((t) => t.startsWith("Version "));
      ok(about === text, `${tag}: DT331 AC3 and unchanged, About keeps its line and the Menu says the same: ${about}`);
      await ctx.close();
    }
    // AC2: in the Menu's code the line stands after the links and before Sign out
    const src = fs.readFileSync(path.join(ROOT, "src/screens/MenuScreen.tsx"), "utf8");
    const iv = src.indexOf('className="small muted menu-version"'), iL = src.lastIndexOf('{w("menu.disclaimer")}</a></p>', iv), iS = src.indexOf("{p.user && <SignOut p={p} />}", iv);
    ok(iv > 0 && iL > 0 && iS > iv && iv - iL < 400 && iS - iv < 400, "DT331 AC2, signed in, the line stands between the links and Sign out");
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough stopped: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `\n${fail} failed` : "\nall passed"); process.exit(fail ? 1 : 0);
})();
