// Story DT307 points 1 to 4 (0.3.163, board DT307; Coach Milan 16 November, Go 18 November 19:13 and 19 November 11:36): the
// read of a photo, point by point. 1: a way back: Back to the camera on the photo screen, Back to the photo on the read, at the
// top and once more at its end, as one light row. 2: one box, the result's; the photo as wide as the column. 3: + Add more left
// of Continue on the Plate opens the Plate with + Add more to your plate open. 4: with a meal set, Save in My recipes is a tick
// in a row of its own, then Cancel on the left and Done on the right; Cancel logs nothing and takes the meal off.
// Point 5, the pot, is in pot-photo.cjs. The checks name the acceptance criteria of the board (DT307 1 AC1 to 4 AC4).
const start = require("./plate157.cjs");
const PORT = "3578";
(async () => { const h = await start(PORT); const { ok } = h; try {
  const sent = [];
  const open = async () => { const p = await h.open({ foods: [] }); await p.unroute("**/api/plate-photo"); await p.route("**/api/plate-photo", (r) => { sent.push(r.request().postDataJSON()); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ dish: "Grilled chicken with rice", foods: [{ name: "Chicken breast, grilled", grams: 180, low: 140, high: 240, calories: 165, protein: 31, fats: 3.6, carbs: 0, fiber: 0, confidence: "medium" }, { name: "Rice, cooked", grams: 150, low: 120, high: 200, calories: 130, protein: 2.7, fats: 0.3, carbs: 28, fiber: 0.4, confidence: "medium" }], unsure: null, which: null, course: "main", vessel: "plate", serves: 1 }) }); }); return p; };
  const box = (p, sel) => p.evaluate((sel) => { const e = document.querySelector(sel); if (!e) return null; const s = getComputedStyle(e); return { b: parseFloat(s.borderTopWidth) + parseFloat(s.borderLeftWidth), bg: s.backgroundColor, shadow: s.boxShadow }; }, sel);
  const plain = (x) => !!x && x.b === 0 && (x.bg === "rgba(0, 0, 0, 0)" || x.bg === "transparent") && x.shadow === "none";
  // ---- point 1, AC1 and AC4 on the photo screen
  let p = await open(); await h.toPhoto(p, false);
  const back = p.locator(".step-head .pa-back");
  ok(await back.count() === 1 && (await back.innerText()).trim() === "Back to the camera", "the photo screen: Back to the camera");
  ok(await p.evaluate(() => { const b = document.querySelector(".step-head .pa-back"), t = document.querySelector(".step-head .title-input"), ph = document.querySelector(".pa-photo"), card = document.querySelector(".photo-screen"); const r = b.getBoundingClientRect(); return r.height >= 44 && r.bottom <= t.getBoundingClientRect().top + 1 && ![...card.querySelectorAll("button")].some((x) => x.getBoundingClientRect().bottom <= ph.getBoundingClientRect().top); }), "DT307 1 AC4: the Back row is one light line above the title, 44 high, and no button stands above the photo");
  await back.click(); await p.waitForTimeout(1200);
  ok(await p.locator("#camera-shutter-button").count() === 1 && await p.locator(".pa-screen").count() === 0, "DT307 1 AC1: Back to the camera: the camera is open again for another shot");
  await p.locator("#camera-shutter-button").click(); await p.waitForTimeout(700); await p.locator(".cam-analyze").click(); await p.waitForTimeout(1500);
  ok(await p.locator(".pa-screen").count() === 1 && !(await h.st(p)).photo, "DT307 1 AC1: and the first photo is not kept: the new shot waits on the photo screen");
  // ---- point 1, AC2 to AC4 on the read
  await p.locator("textarea.pa-words").first().fill("chicken thighs, not breast"); await h.readIt(p);
  const top = p.locator(".step-head .rv-back-top"), end = p.locator(".read-view .rv-back-end");
  ok(await top.count() === 1 && (await top.innerText()).trim() === "Back to the photo" && (await top.boundingBox()).height >= 44, "the read: Back to the photo at the top, 44 high");
  ok(await p.evaluate(() => { const s = document.querySelector(".read-view"), e = s.querySelector(".rv-back-end"); return e === s.lastElementChild && e.getBoundingClientRect().top > s.querySelector(".plate-end").getBoundingClientRect().bottom; }) && (await end.innerText()).trim() === "Back to the photo", "DT307 1 AC3: at the end of the read, Back to the photo stands there too");
  ok(await p.evaluate(() => { const ph = document.querySelector(".read-view .mp-big-img"); return ![...document.querySelectorAll("main button")].some((x) => x.closest(".read-view") && x.getBoundingClientRect().bottom <= ph.getBoundingClientRect().top); }), "DT307 1 AC4: on the read no button stands above the photo");
  await end.click(); await p.waitForTimeout(800);
  ok(await p.locator(".pa-screen").count() === 1 && await p.locator("textarea.pa-words").first().inputValue() === "chicken thighs, not breast" && !(await h.st(p)).items.length, "DT307 1 AC3 and AC2: Back to the photo: the photo screen with the same photo and the words I gave; the read's foods left the Plate");
  await h.readIt(p);
  ok(sent.length === 2 && sent[1].note === "chicken thighs, not breast" && await p.locator(".read-view").count() === 1, "DT307 1 AC2: Read the plate reads it again, with my words");
  await p.locator(".step-head .rv-back-top").click(); await p.waitForTimeout(800);
  ok(await p.locator(".pa-screen").count() === 1, "DT307 1 AC2: Back to the photo at the top does the same");
  await h.readIt(p);
  // ---- point 2
  const card = await box(p, "section.read-view"), big = await box(p, ".read-view .mp-big"), tell = await box(p, ".read-view .rv-tell"), chef = await box(p, ".read-view .rv-chef"), end2 = await box(p, ".read-view .plate-end");
  ok(plain(card) && plain(big) && plain(tell) && plain(chef) && plain(end2), "DT307 2 AC1: no box around the read, the photo with its foods, the field's block, Chef Mealan's word and What do you do with it?: " + JSON.stringify([card, big, tell, chef, end2].map((x) => x && x.b)));
  ok(!plain(await box(p, ".read-view .readout")) && (await box(p, ".read-view textarea.rv-tell-words")).b > 0, "DT307 2 AC1: the result keeps its box, and the field keeps its own edge");
  const pw = await p.evaluate(() => Math.round(document.querySelector(".read-view .mp-big-img img").getBoundingClientRect().width));
  ok(pw === 354, "DT307 2 AC2: on a phone 390 wide the photo is 354 wide: " + pw);
  // ---- point 3
  const row = (await p.locator(".rv-change button").allInnerTexts()).map((x) => x.trim());
  ok(row.join("|") === "+ Add more|Continue on the Plate", "+ Add more stands left of Continue on the Plate: " + row.join("|"));
  await p.locator(".rv-change .rv-add-more").click(); await p.waitForTimeout(800);
  ok(await p.locator(".read-view").count() === 0 && (await h.st(p)).items.length === 2 && await p.locator(".add-more-top").count() === 1, "DT307 3 AC1: + Add more: the Plate with the photo's foods on it and + Add more to your plate already open");
  await p.getByLabel(/^Search all (my )?foods$/).fill("Banana"); await p.waitForTimeout(500); await p.locator(".row-food").filter({ hasText: "Banana" }).first().getByRole("button", { name: /Add/ }).click(); await p.waitForTimeout(700);
  const its = (await h.st(p)).items, ban = its.find((i) => /Banana/.test(i.food.name));
  ok(its.length === 3 && !!ban && !ban.est && its.filter((i) => i.est).length === 2, "DT307 3 AC2: the food joins the photo's foods, without the ~ of an estimate");
  await p.context().close();
  // ---- point 4
  const toEat = async () => { const q = await open(); await h.toPhoto(q, false); await h.readIt(q); await q.locator(".plate-end .pe-ate").click(); await q.waitForTimeout(500); await h.row(q, "Dinner", ".plate-end").click(); await q.waitForTimeout(900); return q; };
  p = await toEat();
  ok(await p.evaluate(() => { const q = document.querySelector(".rv-eat"), k = document.querySelector(".rv-keep"), go = document.querySelector(".rv-go"); return !!q && !!k && !!go && !!(q.compareDocumentPosition(k) & 4) && !!(k.compareDocumentPosition(go) & 4) && !k.contains(go); }) && !(await p.locator(".rv-keep input").isChecked()) && /^Save in My recipes$/.test((await p.locator(".rv-keep").innerText()).trim()), "DT307 4 AC1: under the answers, Save in My recipes is a tick with its label in a row of its own, off");
  const bb = await p.evaluate(() => [...document.querySelectorAll(".rv-go .pill")].map((x) => ({ t: x.textContent.trim(), l: x.getBoundingClientRect().left, top: Math.round(x.getBoundingClientRect().top) })));
  ok(bb.length === 2 && bb[0].t === "Cancel" && bb[1].t === "Done" && bb[0].l < bb[1].l && bb[0].top === bb[1].top, "DT307 4 AC1: under it Cancel on the left and Done on the right");
  await p.locator(".rv-eat .pa-opt").filter({ hasText: "All of it" }).click(); await p.locator(".rv-keep input").check(); await p.locator(".rv-done").click(); await p.waitForTimeout(900);
  let s = await h.st(p);
  ok(s.feedback.filter((f) => f.status === "eaten").length === 1 && s.meals.length === 1 && s.meals[0].title === "Grilled chicken with rice", "DT307 4 AC2: ticked, All of it, Done: the meal is logged and the plate is in My recipes");
  await p.context().close();
  p = await toEat(); await p.locator(".rv-eat .pa-opt").filter({ hasText: "All of it" }).click(); await p.locator(".rv-done").click(); await p.waitForTimeout(900);
  s = await h.st(p);
  ok(s.feedback.filter((f) => f.status === "eaten").length === 1 && s.meals.length === 0, "DT307 4 AC3: the tick off, All of it, Done: the meal is logged and nothing is added to My recipes");
  await p.context().close();
  p = await toEat(); await p.locator(".rv-eat .pa-opt").filter({ hasText: "All of it" }).click(); await p.locator(".rv-cancel").click(); await p.waitForTimeout(700);
  s = await h.st(p);
  ok(s.feedback.length === 0 && /^No meal selected/.test(await h.line(p)) && await p.locator(".read-view .plate-end").count() === 1 && await p.locator(".rv-eat").count() === 0 && s.items.length === 2, "DT307 4 AC4: Cancel: nothing is logged, the meal is off the meal line, and the read ends with What do you do with it? again");
} catch (e) { ok(false, "walkthrough error: " + (e && e.message)); } finally { await h.end(); } })();
