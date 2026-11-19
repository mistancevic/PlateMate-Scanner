// Story B145 (0.3.161, board B145; Coach Milan 15 November 20:57, Go 18 November 19:13): the read does not invent ways of
// cooking. For cooking, not counted shows only foods my own words named. With no words from me there is no line, whatever
// the photo's read returns, and a way of cooking (simmered, pureed) is never shown. The read is a stand-in (no AI here).
// The checks name the acceptance criteria of the board (B145 AC1 to AC3).
// Changed by story DT307 (0.3.163, board DT307; Coach Milan, Go 19 November 11:36): + Add more stands left of Continue on the Plate, so Continue on the Plate is tapped by its own name (.rv-continue)
const start = require("./plate157.cjs");
const PORT = "3574";
const f = (name, grams, kcal, pr, fa, ca, fi) => ({ name, grams, low: Math.round(grams * 0.75), high: Math.round(grams * 1.3), calories: kcal, protein: pr, fats: fa, carbs: ca, fiber: fi, confidence: "medium" });
const SOUP = (cooking) => ({ dish: "Pumpkin soup", foods: [f("Pumpkin, cooked", 300, 26, 1, 0.1, 6.5, 0.5), f("Potato, boiled", 120, 87, 1.9, 0.1, 20, 1.8)], unsure: null, which: null, course: "main", vessel: "bowl", serves: 1, cooking });
(async () => { const h = await start(PORT); const { ok } = h; try {
  const photo = async (read, words) => { const p = await h.open({ foods: [] }); await p.unroute("**/api/plate-photo"); let sent = null;
    await p.route("**/api/plate-photo", (r) => { sent = r.request().postDataJSON(); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(read) }); });
    await h.toPhoto(p, false); if (words) { await p.locator("textarea.pa-words").first().fill(words); await p.waitForTimeout(200); }
    await h.readIt(p); return { p, sent: () => sent }; };
  // AC1: no words, and the read comes back with cooking foods and ways of cooking
  let x = await photo(SOUP(["simmered", "pureed", "olive oil"]), "");
  let m = await h.main(x.p);
  ok(/Pumpkin, cooked/.test(m) && !(await x.p.locator(".pt-cook").count()) && !/For cooking/i.test(m), "B145 AC1: no words from me: the read has no For cooking, not counted line");
  ok(!/simmered|pureed/i.test(m), "B145 AC3: simmered and pureed stand nowhere on the read");
  ok(!(await h.st(x.p)).cooking, "B145 AC1: and nothing is kept as a cooking food");
  await x.p.locator(".rv-change .rv-continue").click(); await x.p.waitForTimeout(700); m = await h.main(x.p);
  ok(!/For cooking/i.test(m) && !/simmered|pureed/i.test(m), "B145 AC1: nor on the Plate's screen, after Continue on the Plate");
  await x.p.context().close();
  // AC2: my words name olive oil
  x = await photo(SOUP(["olive oil"]), "fried in olive oil");
  ok(/fried in olive oil/.test((x.sent() || {}).note || ""), "my words go to Chef Mealan with the photo");
  const line = (await x.p.locator(".pt-cook").first().innerText().catch(() => "")).replace(/\s+/g, " ");
  ok(/olive oil/.test(line) && /For cooking/i.test(line), "B145 AC2: my words say fried in olive oil: For cooking, not counted names olive oil: " + line);
  await x.p.context().close();
  // AC3: with words, a way of cooking in the read's answer is still never shown
  x = await photo(SOUP(["simmered", "pureed", "chives"]), "pumpkin soup with chives");
  m = await h.main(x.p);
  const line3 = (await x.p.locator(".pt-cook").first().innerText().catch(() => "")).replace(/\s+/g, " ");
  ok(/chives/.test(line3) && !/simmered|pureed/i.test(m), "B145 AC3: the read comes back with simmered and pureed: neither stands on it, chives does: " + line3);
  ok(JSON.stringify((await h.st(x.p)).cooking) === JSON.stringify(["chives"]), "B145 AC3: only chives is kept as a cooking food");
  await x.p.context().close();
} catch (e) { ok(false, "walkthrough error: " + (e && e.message)); } finally { await h.end(); } })();
