// 0.3.133 (Coach Milan 11 November 20:17 to 20:29, Go): a photo named on the phone but not saved here (in his data: the plate
// from 13:11, five photos in all). Every such image shows a plain picture that says Not saved, never a broken image. The
// Plate says "This photo was not saved. Retake it, or drop it." with both buttons, and does not offer to read it again.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
const PORT = "3495", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (lang = "en") => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1300 }, timezoneId: "Europe/Berlin" });
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.install({ time: new Date("2026-11-11T20:17:00+01:00") });
    const s = { ...seed, title: "", photo: { image: "pf:8z1abcde2fgh3ijk", more: ["pf:9y2bcdef3ghi4jkl"], at: "2026-11-11T13:11:00+01:00", who: "idea", unsure: null, which: null }, pick: "exploring", plateAt: "2026-11-11T13:11:00+01:00" };
    await page.addInitScript(({ s, lang }) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      if (lang !== "en") localStorage.setItem("chefmealan-lang", lang); localStorage.setItem("seeded", "1"); }, { s, lang });
    await require("./adult.cjs")(page);
    await page.goto(U + "/plate"); await page.waitForTimeout(1500);
    return { ctx, page };
  };
  try {
    let { ctx, page } = await open();
    const card = page.locator(".mp-not-saved");
    ok(await card.count() === 1 && /^This photo was not saved\. Retake it, or drop it\./.test((await card.textContent()).trim()), "the Plate says: This photo was not saved. Retake it, or drop it.");
    ok(await card.getByRole("button", { name: "📷 Retake" }).count() === 1 && await card.getByRole("button", { name: "Drop the photo" }).count() === 1 && await card.locator("button").evaluateAll((a) => a.every((x) => x.getBoundingClientRect().height >= 44)), "Retake and Drop the photo, 44 px or more");
    ok(await page.getByRole("button", { name: /Help Chef Mealan read it/ }).count() === 0, "no offer to read a photo that is not there");
    // never a broken image: every picture of a photo not saved says Not saved
    await page.locator(".mp-line").click().catch(() => {}); await page.waitForTimeout(800);
    const imgs = await page.evaluate(() => [...document.querySelectorAll("img")].map((i) => ({ src: i.getAttribute("src") || "", ok: i.complete && i.naturalWidth > 0 })));
    const named = imgs.filter((x) => x.src.startsWith("pf:")), shown = imgs.filter((x) => x.src.startsWith("data:image/svg+xml") && decodeURIComponent(x.src).includes("Not saved"));
    ok(named.length === 0 && shown.length >= 2 && shown.every((x) => x.ok), `no broken image: ${shown.length} pictures say Not saved, none points at the missing file`);
    await card.getByRole("button", { name: "Drop the photo" }).click(); await page.waitForTimeout(500);
    const st = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
    ok(!st.photo && await page.locator(".mp-not-saved").count() === 0, "Drop the photo: the plate has no photo, the line goes");
    await ctx.close();
    for (const l of ["sr-Latn", "de"]) {
      ({ ctx, page } = await open(l));
      await page.locator(".mp-line").click().catch(() => {}); await page.waitForTimeout(800);
      const t = (await page.locator(".mp-not-saved").textContent()).trim(), svg = await page.evaluate(() => decodeURIComponent([...document.querySelectorAll("img")].map((i) => i.getAttribute("src") || "").find((s) => s.startsWith("data:image/svg+xml")) || ""));
      ok(!/was not saved|Retake|Drop the photo/.test(t) && !/>Not saved</.test(svg) && svg.length > 0, `${l}: the line and the picture in the language: ` + t.slice(0, 60));
      await ctx.close();
    }
  } catch (e) { ok(false, "walkthrough crashed: " + (e && e.message)); }
  ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.join(" | ") : ""}`);
  await b.close(); server.kill();
  console.log(fail ? `\n${fail} FAILED` : "\nall passed"); process.exit(fail ? 1 : 0);
})();
