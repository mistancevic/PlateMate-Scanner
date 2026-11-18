// Story DT311 (0.3.157, board Stories246; Coach Milan 18 November 10:05, Go 11:14; the ticket's five parts, 12:10).
// When I open my plate, I read what is on it and its result before anything else, and find the buttons for the foods next
// to the foods: I do not meet a delete button first and do not look in two places. The top of the card says On your plate
// and the result comes right under it. One row stands right above the foods: Empty plate on its left, Group into parts on
// its right, its words on one line and clear of the button's border. With nothing to group, Empty plate stands alone in
// the same place. Already works and does not change: Empty plate asks once (Tap again to empty), Group into parts groups.
// The checks name the ticket's criteria (DT311 AC1 to AC4).
const start = require("./plate157.cjs");
const PORT = "3566";
(async () => { const h = await start(PORT); const { ok } = h; try {
  let p = await h.open();
  const card = p.locator(".plate-card").first();
  // ---- AC1
  ok((await card.locator(".card-top").innerText()).trim() === "On your plate" && await card.locator(".card-top button").count() === 0, "DT311 AC1: skyr, oats and a banana: the top of the card says On your plate, and holds no button");
  ok(await p.evaluate(() => { const t = document.querySelector(".plate-card .card-top"); let e = t.nextElementSibling; while (e && !e.offsetParent) e = e.nextElementSibling; return !!e && e.matches(".readout"); }), "DT311 AC1: the result comes right under it, with no button in between");
  // ---- AC2
  const acts = card.locator(".plate-acts");
  ok(await acts.count() === 1 && await p.evaluate(() => { const a = document.querySelector(".plate-acts"); let e = a.nextElementSibling; while (e && !e.offsetParent) e = e.nextElementSibling; return !!e && e.matches(".rows") && !!e.querySelector(".swipe, .row"); }), "DT311 AC2: one row stands right above the foods");
  const box = (sel) => p.locator(sel).evaluate((e) => { const r = e.getBoundingClientRect(), a = e.closest(".plate-acts").getBoundingClientRect(); return { l: r.left - a.left, r: a.right - r.right, h: r.height, w: r.width }; });
  const eb = await box(".plate-acts .plate-empty-link");
  ok(/Empty plate/.test(await acts.locator(".plate-empty-link").innerText()) && eb.l < 8, "DT311 AC2: Empty plate stands on its left");
  // ---- AC3
  const gb = await box(".plate-acts .pt-open");
  ok(/^Group into parts$/.test((await acts.locator(".pt-open").innerText()).trim()) && gb.r < 2, "DT311 AC3: Group into parts stands on its right");
  const pad = await p.locator(".plate-acts .pt-open").evaluate((e) => { const c = getComputedStyle(e); const rng = document.createRange(); rng.selectNodeContents(e); const t = rng.getBoundingClientRect(), r = e.getBoundingClientRect(); return { left: t.left - r.left, right: r.right - t.right, lines: Math.round(t.height / parseFloat(c.lineHeight || "20")) || 1, th: t.height, fs: parseFloat(c.fontSize) }; });
  ok(pad.th < pad.fs * 1.8, "DT311 AC3: its words are on one line");
  ok(pad.left >= 16 && pad.right >= 16, `DT311 AC3: clear of the button's border: ${Math.round(pad.left)} px and ${Math.round(pad.right)} px (Stories246: at least 16)`);
  ok(eb.h >= 44 && gb.h >= 44, `DT311 AC3: both buttons are at least 44 high (Stories246): ${Math.round(eb.h)} and ${Math.round(gb.h)}`);
  // already works: Group into parts groups as before
  await acts.locator(".pt-open").click(); await p.waitForTimeout(300);
  ok(/Tap a food/.test(await card.innerText()) && await card.locator(".plate-acts .plate-empty-link").count() === 1, "Already works: Group into parts opens the parts as before; Empty plate keeps its place");
  await card.getByRole("button", { name: "Done" }).click(); await p.waitForTimeout(300);
  // already works: Empty plate asks once
  await acts.locator(".plate-empty-link").click(); await p.waitForTimeout(200);
  ok(/Tap again to empty/.test(await acts.locator(".plate-empty-link").innerText()) && (await h.st(p)).items.length === 3, "Already works: the first tap says Tap again to empty and empties nothing");
  await acts.locator(".plate-empty-link").click(); await p.waitForTimeout(500);
  ok((await h.st(p)).items.length === 0 && await p.locator(".plate-acts").count() === 0, "Already works: the second tap empties the plate");
  await p.context().close();
  // ---- AC4
  p = await h.open({ foods: ["Skyr"] });
  const one = p.locator(".plate-card .plate-acts");
  const eb1 = await p.locator(".plate-acts .plate-empty-link").evaluate((e) => { const r = e.getBoundingClientRect(), a = e.closest(".plate-acts").getBoundingClientRect(); return { l: r.left - a.left, h: r.height }; });
  ok(await one.count() === 1 && await one.locator("button").count() === 1 && await one.locator(".pt-open").count() === 0, "DT311 AC4: only skyr: no Group into parts; Empty plate stands alone in the row");
  ok(Math.abs(eb1.l - eb.l) < 1 && eb1.h >= 44, "DT311 AC4: in the same place, on the left above the food");
  ok((await p.locator(".plate-card .card-top").innerText()).trim() === "On your plate", "DT311 AC1: with one food the top of the card says only On your plate too");
} catch (e) { ok(false, "walkthrough error: " + (e && e.message)); } finally { await h.end(); } })();
