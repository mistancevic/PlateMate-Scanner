// Stories DT324 and DT325 (0.3.162, boards DT324 and DT325; Coach Milan 19 November 09:08, Go 09:48): two lines of words.
// DT324: after a read, Continue on the Plate opens the Plate's screen of the photo, and the line under its title says what
// the read says, Chef Mealan named it from your photo, while the plate has his name; a name of my own has no line.
// DT325: a plate from an earlier day, with a photo and without: the help line under Chef Mealan's question says Ate it asks
// which meal, and saves it there, and names no time. The record stays as DT314 and B150 set it.
// The checks name the acceptance criteria of the boards (DT324 AC1 to AC3, DT325 AC1 to AC3).
const start = require("./plate157.cjs");
const fs = require("node:fs"), path = require("node:path");
const PORT = "3577";
const F = (sd, n) => sd.foods.find((f) => f.name.startsWith(n));
const IMG = "data:image/jpeg;base64," + fs.readFileSync(path.join(__dirname, "plate.jpg")).toString("base64");
(async () => { const h = await start(PORT); const { ok } = h; try {
  const sub = (p) => p.evaluate(() => { const h = document.querySelector("main .step-head"); const s = h && h.querySelector("p, small, .step-sub"); return s ? s.textContent.trim() : ""; });
  // DT324 AC1
  let p = await h.open({ foods: [] }); await h.toPhoto(p, false); await h.readIt(p);
  const onRead = await sub(p);
  ok(onRead === "Chef Mealan named it from your photo.", "the read: Chef Mealan named it from your photo. Got: " + onRead);
  await p.locator(".rv-change button").click(); await p.waitForTimeout(800);
  let m = await h.main(p);
  ok(/Grilled chicken with rice/.test(await p.locator(".title-input").first().inputValue().catch(() => "")) && (await sub(p)) === "Chef Mealan named it from your photo.", "DT324 AC1: after Continue on the Plate the line under the title says Chef Mealan named it from your photo. Got: " + (await sub(p)));
  ok(!/Read from your photo\. Correct an amount/.test(m), "DT324 AC1: the old line is not on the screen");
  // DT324 AC2
  const t = p.locator(".title-input").first(); await t.fill("My Sunday chicken"); await t.press("Tab"); await p.waitForTimeout(400);
  m = await h.main(p);
  ok(!/Chef Mealan named it from your photo/.test(m) && !/Read from your photo/.test(m), "DT324 AC2: a name of my own: no line under the title");
  await p.context().close();
  // DT324 AC3
  for (const f of ["en", "sr-Latn", "de"]) { const j = JSON.parse(fs.readFileSync(path.join(__dirname, `../../src/i18n/${f}.json`), "utf8")); const has = f === "en" ? "plate.readFromPhoto" in j : "plate.readFromPhoto" in j.screens;
    ok(!has && !JSON.stringify(j).includes("Correct an amount if you know better"), `DT324 AC3: the old line is not in ${f}.json`); }
  // DT325
  const old = (withPhoto) => h.open({ foods: [], seed: (sd) => { sd.items = [{ id: "o1", food: F(sd, "Skyr"), grams: 250, locked: false }, { id: "o2", food: F(sd, "Oats"), grams: 80, locked: false }]; sd.plateAt = "2026-11-14T19:10:00+01:00"; if (withPhoto) sd.photo = { image: IMG, at: "2026-11-14T18:10:00.000Z", who: "now" }; } });
  const help = async (q) => (await q.locator(".chef-ask > small").last().innerText()).replace(/\s+/g, " ").trim();
  const REST = "Save for later keeps it to finish another time, and the Plate is free. Keep working on it opens it as it is, and this plate is not asked about again. Clear it empties the plate.";
  for (const [ac, withPhoto, name] of [["AC1", true, "with a photo"], ["AC2", false, "without a photo"]]) {
    p = await old(withPhoto); const l = await help(p);
    ok(/^Ate it asks which meal, and saves it there\. /.test(l) && !/photo's time|time it was started|\d\d:\d\d/.test(l), `DT325 ${ac}: a plate ${name} from Saturday: the help line starts with Ate it asks which meal, and saves it there. and names no time: ${l}`);
    ok(l.endsWith(REST), `DT325 AC3: ${name}, the sentences about Save for later, Keep working on it and Clear it are as today`);
    await p.context().close();
  }
  for (const f of ["sr-Latn", "de"]) { const j = JSON.parse(fs.readFileSync(path.join(__dirname, `../../src/i18n/${f}.json`), "utf8")).screens;
    ok(["plate.oldHelp", "plate.oldHelpPhoto"].every((k) => j[k] && j[k].text && j[k].text.split(". ")[0].length < 60), `DT325: the two help lines are in ${f}, first sentence with no time`); }
} catch (e) { ok(false, "walkthrough error: " + (e && e.message)); } finally { await h.end(); } })();
