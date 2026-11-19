// Story DT315 (0.3.161, board DT315; Coach Milan, Go 18 November 19:13): How to, I ate something: log it with a photo. Its
// steps say what the app does since 0.3.157: step 4 is Check the foods he read, tap Ate it and the meal; step 5, new, is
// Did you eat it? with All of it, Half or Part of it, then Done. Followed here on a photo with no meal set: each step names
// a button that is on the screen at that step. Words only; in English, Serbian and German.
// The check names the acceptance criterion of the board (DT315 AC1).
const start = require("./plate157.cjs");
const fs = require("node:fs"), path = require("node:path");
const PORT = "3575";
(async () => { const h = await start(PORT); const { ok } = h; try {
  const p = await h.open({ foods: [] });
  await p.locator("header .menu-button").click(); await p.waitForTimeout(500); await p.locator(".howto-row").click(); await p.waitForTimeout(500);
  await p.locator(".ht-photoLog").click(); await p.waitForTimeout(400);
  const steps = (await p.locator(".ht-steps li").allInnerTexts()).map((x) => x.replace(/\s+/g, " ").trim());
  ok((await p.locator(".howto-one h3").innerText()).trim() === "I ate something: log it with a photo" && steps.length === 5, "the page opens with five steps: " + steps.length);
  ok(/Check the foods he read\. Tap Ate it and the meal\.$/.test(steps[3] || ""), "DT315 AC1: step 4 says: Check the foods he read. Tap Ate it and the meal. Got: " + steps[3]);
  ok(/Under Did you eat it\? choose All of it, Half or Part of it, then Done\.$/.test(steps[4] || ""), "DT315 AC1: step 5 says: Under Did you eat it? choose All of it, Half or Part of it, then Done. Got: " + steps[4]);
  // follow the steps on a photo with no meal set
  await p.reload(); await p.waitForTimeout(1200); await h.tab(p, "Plate");
  const has = async (name) => (await p.getByRole("button", { name, exact: true }).count()) > 0;
  ok(/tap Photo or scan/.test(steps[0]) && (await p.getByRole("button", { name: /Photo or scan/ }).count()) > 0, "DT315 AC1, step 1: Photo or scan is on the Plate");
  await h.toCam(p); await p.locator("#camera-shutter-button").click(); await p.waitForTimeout(700);
  ok(/Use this photo/.test(steps[1]) && await has("Use this photo"), "DT315 AC1, step 2: Use this photo is on the camera after the photo is taken");
  await p.locator(".cam-analyze").click(); await p.waitForTimeout(1500);
  ok(/Read the plate/.test(steps[2]) && await has("Read the plate"), "DT315 AC1, step 3: Read the plate is on the photo screen");
  await h.readIt(p);
  ok(await has("Ate it") && !(await p.locator(".rv-eat").count()), "DT315 AC1, step 4: Ate it is on the read, and Did you eat it? is not there yet");
  await p.getByRole("button", { name: "Ate it", exact: true }).click(); await p.waitForTimeout(500);
  const dinner = p.locator(".pcal-row").filter({ hasText: "Dinner" }).first();
  ok(await dinner.count() > 0, "DT315 AC1, step 4: Ate it shows the meals");
  await dinner.click(); await p.waitForTimeout(600);
  const m = await h.main(p);
  ok(/Did you eat it\?/.test(m) && (await p.locator(".rv-eat .pa-opt").allInnerTexts()).map((x) => x.trim()).join("|") === "All of it|Half|Part of it" && await has("Done"), "DT315 AC1, step 5: Did you eat it? with All of it, Half, Part of it, and Done");
  // the two lines in Serbian and German
  const en = JSON.parse(fs.readFileSync(path.join(__dirname, "../../src/i18n/en.json"), "utf8"));
  for (const [lang, file] of [["Serbian", "sr-Latn"], ["German", "de"]]) { const t = JSON.parse(fs.readFileSync(path.join(__dirname, `../../src/i18n/${file}.json`), "utf8")).screens;
    ok(["howto.photoLog.s4", "howto.photoLog.s5"].every((k) => t[k] && t[k].text && t[k].text !== en[k]), `steps 4 and 5 are in ${lang}`); }
} catch (e) { ok(false, "walkthrough error: " + (e && e.message)); } finally { await h.end(); } })();
