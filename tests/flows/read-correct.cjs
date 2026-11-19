// Story DT318 (0.3.160, board DT318; Coach Milan, Go 19 November 01:00): correcting what Chef Mealan read from a photo, in
// three ways, each with one job. His own checks stand on the read, under the chips: how much, what it is, and new, which
// one, with real foods of that kind, your own first. Under them one field, Tell Chef Mealan what to check: a tap on a chip
// makes the words about that food, with no chip marked the field takes a missing food; Send to Chef Mealan makes him look
// again, and what you set stays. By hand: Continue on the Plate opens the Plate's food list as it is. A chip shows the
// food's full name. The link Wrong foods? Help Chef Mealan read it is gone from the Plate's screen.
// The checks name the acceptance criteria of the board (DT318 AC1 to AC14).
// Changed by story DT307 (0.3.163, board DT307; Coach Milan, Go 19 November 11:36): + Add more stands left of Continue on the Plate, so Continue on the Plate is tapped by its own name (.rv-continue)
const start = require("./plate157.cjs");
const fs = require("node:fs"), path = require("node:path");
const PORT = "3572";
const f = (name, grams, kcal, pr, fa, ca, fi) => ({ name, grams, low: Math.round(grams * 0.75), high: Math.round(grams * 1.3), calories: kcal, protein: pr, fats: fa, carbs: ca, fiber: fi, confidence: "medium" });
const WHICH = { name: "Yogurt, 10% fat", question: "the white sauce: is it yogurt, sour cream or skyr?", options: [{ name: "Yogurt, 10% fat", calories: 120, protein: 3.5, fats: 10, carbs: 4, fiber: 0 }, { name: "Sour cream", calories: 190, protein: 2.5, fats: 19, carbs: 3, fiber: 0 }, { name: "Skyr, natural", calories: 63, protein: 11, fats: 0.2, carbs: 4, fiber: 0 }] };
const READ1 = { dish: "Chicken and fries", foods: [f("Chicken breast, grilled", 250, 165, 31, 3.6, 0, 0), f("Sweet potato fries, baked", 180, 150, 2, 5, 24, 3.5), f("Yogurt, 10% fat", 80, 120, 3.5, 10, 4, 0)], unsure: { name: "Chicken breast, grilled", options: [200, 350] }, which: WHICH, course: "main", vessel: "plate", serves: 1 };
// the second look: the read's own version of every food again (the chicken at 250 g, asked again), and the mayonnaise
const READ2 = { ...READ1, foods: [...READ1.foods, f("Mayonnaise", 20, 680, 1, 75, 1, 0)], unsure: { name: "Chicken breast, grilled", options: [220, 350] }, which: null };
const hilde = (sd) => { const g = sd.foods.find((x) => x.name.startsWith("Greek")); sd.foods.unshift({ ...g, id: "f-hilde", name: "Hildebrand yogurt, 0.2% fat", brand: "Hildebrand", calories: 38, protein: 4.3, fats: 0.2, carbs: 5, fiber: 0 }); };
(async () => { const h = await start(PORT); const { ok } = h; try {
  const tags = async (p) => (await p.locator(".read-view .mp-tags .mp-tag").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  const checks = async (p, scope = ".read-view") => (await p.locator(scope + " .mp-ask").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  const fresh = async (seed) => { const p = await h.open({ foods: [], seed }); const sent = []; let n = 0;
    await p.route("**/api/plate-photo", async (r) => { sent.push(r.request().postDataJSON()); await r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(n++ ? READ2 : READ1) }); });
    await h.toPhoto(p, false); await h.readIt(p); return { p, sent }; };
  let { p, sent } = await fresh(hilde);
  // ---- AC1: a chip shows the full name
  ok((await tags(p)).join(" | ") === "Chicken breast, grilled ~250 g | Sweet potato fries, baked ~180 g | Yogurt, 10% fat ~80 g", "DT318 AC1: each chip shows the food's full name and grams: Yogurt, 10% fat ~80 g");
  ok(/Your photo, 18:00\. 3 foods read, amounts estimated \(~\)\.$/.test((await p.locator(".read-view .mp-big-say").innerText()).trim()), "the line under the chips no longer says Tap an amount to correct it");
  // ---- AC2: his checks stand on the read
  let c = await checks(p);
  ok(c.length === 2 && /^One thing I cannot tell from the photo: is the chicken breast about 200 g or 350 g\? ~200 g ~350 g Skip$/.test(c[0]), "DT318 AC2: the check about an amount stands under the chips, with ~200 g, ~350 g and Skip");
  ok(/^One thing I cannot tell from the photo: the white sauce: is it yogurt, sour cream or skyr\? /.test(c[1]) && /Skip/.test(c[1]), "DT318 AC2: the check about what a food is stands under it, with its answers and Skip");
  const order = await p.evaluate(() => { const y = (s) => { const e = document.querySelector(s); return e ? e.getBoundingClientRect().top : -1; }; return [y(".read-view .mp-tags"), y(".read-view .mp-ask"), y(".read-view .rv-tell"), y(".read-view .rv-change")]; });
  ok(order.every((v) => v >= 0) && order[0] < order[1] && order[1] < order[2] && order[2] < order[3], "on the read, top to bottom: the chips, his checks, the field for Chef Mealan, Continue on the Plate");
  // ---- AC12: by hand, on the Plate; and AC2: a check I do not answer goes along
  ok((await p.locator(".read-view .rv-change .rv-continue").innerText()).trim() === "Continue on the Plate" && await p.getByRole("button", { name: "Change the foods" }).count() === 0, "DT318 AC12: the button says Continue on the Plate, and there is no Change the foods");
  await p.locator(".read-view .rv-change .rv-continue").click(); await p.waitForTimeout(800);
  ok(await p.locator(".read-view").count() === 0 && (await p.locator(".name-link").allInnerTexts()).join(" | ") === "Chicken breast, grilled | Sweet potato fries, baked | Yogurt, 10% fat" && /Swipe a food left to swap it, right to remove it\./.test(await h.main(p)) && await p.locator(".add-more-open").count() === 1, "DT318 AC12: the Plate opens with its food list as it is: the foods, the swipe, + Add more to your plate");
  c = await checks(p, "main");
  ok(c.length === 2 && /is the chicken breast about 200 g or 350 g\?/.test(c[0]) && /is it yogurt, sour cream or skyr\?/.test(c[1]), "DT318 AC2: the two checks I did not answer still stand on the Plate");
  // ---- AC13: one place for words
  ok(await p.locator(".mp-again-link").count() === 0 && !/Wrong foods\? Help Chef Mealan read it/.test(await h.main(p)), "DT318 AC13: the Plate with a photo has no link Wrong foods? Help Chef Mealan read it");
  ok(await p.locator(".mp-retake").count() === 1 && await p.locator(".mp-add-photo").count() === 1, "must not change: Retake and + Photo are on the Plate");
  // ---- AC3: a check about an amount
  ({ p, sent } = await fresh(hilde));
  await p.locator(".read-view .mp-ask button.choice").filter({ hasText: "~200 g" }).click(); await p.waitForTimeout(500);
  ok((await tags(p))[0] === "Chicken breast, grilled 200 g" && (await checks(p)).length === 1 && !/chicken/.test((await checks(p))[0]), "DT318 AC3: a tap on ~200 g: the chip says 200 g without the ~, and the question is gone");
  // ---- AC7: an answer that would be a guess says estimate
  const opts = async () => (await p.locator(".read-view .mp-which button.choice").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  ok((await opts()).join(" | ") === "Yogurt · estimate | Sour cream · estimate | Skyr", "DT318 AC7: in the check about what it is, an answer that is in no list says estimate; Skyr is a food of the app");
  // ---- AC4: a check about what it is, then which one
  await p.locator(".read-view .mp-which button.choice").filter({ hasText: /^Yogurt/ }).click(); await p.waitForTimeout(900);
  c = await checks(p);
  ok(c.length === 1 && /^One thing I cannot tell from the photo: which yogurt is it\? /.test(c[0]), "DT318 AC4: a tap on Yogurt settles the type, and he asks next: which yogurt is it?");
  // ---- AC6: the answers are real foods, mine first
  const ones = (await p.locator(".read-view .mp-which-one button.choice").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  ok(ones[0] === "Hildebrand yogurt, 0.2% fat · yours" && ones[1] === "Greek yogurt 2% · yours" && ones.slice(2).join(" | ") === "Yogurt, plain, whole | Greek yogurt, 2 %" && /Skip$/.test(c[0]), "DT318 AC6: each answer is a food by its full name: my own two first, marked yours, then two of the app's foods that differ; and Skip");
  // ---- AC5: a check about which one
  await p.locator(".read-view .mp-which-one button.choice").first().click(); await p.waitForTimeout(600);
  ok((await tags(p))[2] === "Hildebrand yogurt, 0.2% fat ~80 g" && (await checks(p)).length === 0, "DT318 AC5: a tap on my yogurt: the chip says Hildebrand yogurt, 0.2% fat, and the question is gone");
  let st = await h.st(p), yo = st.items.find((i) => i.food.name.startsWith("Hildebrand"));
  ok(!!yo && yo.food.id === "f-hilde" && yo.food.brand === "Hildebrand" && yo.food.calories === 38 && yo.food.fats === 0.2 && yo.grams === 80, "DT318 AC6: on the plate it is that food of my list, with its label's values, at the same grams");
  // ---- AC9: my words, a missing food; AC11: what I set stays
  const tell = p.locator(".read-view .rv-tell");
  ok((await tell.locator("b").first().innerText()).trim() === "Tell Chef Mealan what to check" && /Tap a food above, or write what is missing\./.test(await tell.innerText()) && await tell.locator(".rv-tell-send").isDisabled(), "the field says Tell Chef Mealan what to check; with nothing written, Send to Chef Mealan waits");
  await tell.locator(".rv-tell-words").fill("There was mayo too, under the chicken."); await tell.locator(".rv-tell-send").click(); await p.waitForTimeout(3000);
  ok(sent.length === 2 && sent[1].note === "There was mayo too, under the chicken." && JSON.stringify(sent[1].keep) === JSON.stringify([{ name: "Chicken breast, grilled", grams: 200 }, { name: "Hildebrand yogurt, 0.2% fat", grams: 80 }]), "Send to Chef Mealan sends my words, and what I set: the chicken at 200 g and my yogurt");
  ok((await tags(p)).join(" | ") === "Chicken breast, grilled 200 g | Sweet potato fries, baked ~180 g | Hildebrand yogurt, 0.2% fat ~80 g | Mayonnaise ~20 g new", "DT318 AC9: a chip Mayonnaise is there, marked as new");
  ok((await tags(p))[0] === "Chicken breast, grilled 200 g" && (await tags(p))[2] === "Hildebrand yogurt, 0.2% fat ~80 g" && (await checks(p)).length === 0, "DT318 AC11: the chicken is still 200 g and the yogurt is still mine, and he does not ask about the chicken again");
  ok(/^Chef Mealan: I added mayonnaise\. What you set stays as you set it\.$/.test((await p.locator(".read-view .rv-did").innerText()).replace(/\s+/g, " ").trim()) && await p.locator(".read-view").count() === 1, "DT318 AC8: one line from Chef Mealan says what he did, and I am still on the read");
  // ---- AC8: my words, about a food
  await p.locator(".read-view .mp-tags .mp-tag").nth(1).click(); await p.waitForTimeout(300);
  ok(/^✓ Sweet potato fries, baked/.test((await tags(p))[1]) && (await tell.locator(".rv-tell-about").innerText()).trim() === "About: Sweet potato fries, baked" && await p.locator(".read-view .rv-amount").count() === 0 && !/new$/.test((await tags(p))[3]), "DT318 AC8: a tap on a chip marks it, the field says About: Sweet potato fries, baked, the chip does not turn into a number, and the mark new is gone");
  await tell.locator(".rv-tell-words").fill("They were fried in oil."); await tell.locator(".rv-tell-send").click(); await p.waitForTimeout(3000);
  ok(sent.length === 3 && /Sweet potato fries, baked: They were fried in oil\.$/.test(sent[2].note), "DT318 AC8: my words go to Chef Mealan with the food they are about");
  ok(/^Chef Mealan: /.test((await p.locator(".read-view .rv-did").innerText()).trim()), "DT318 AC8: and one line from him says what he did");
  // ---- AC10: said, not typed
  await p.evaluate(() => { window.__recs = []; });
  const said = await h.open({ foods: [] });
  await said.addInitScript(() => { window.SpeechRecognition = function () { const me = this; me.start = () => { setTimeout(() => { me.onresult && me.onresult({ results: [[{ transcript: "there was mayo too" }]] }); me.onend && me.onend(); }, 50); }; me.stop = () => {}; }; });
  await said.route("**/api/plate-photo", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(READ1) }));
  await said.goto(h.U + "/plate"); await said.waitForTimeout(1500); await h.toPhoto(said, false); await h.readIt(said);
  ok(await said.locator(".read-view .rv-tell-field .rv-tell-mic").count() === 1, "DT318 AC10: the microphone is inside the field");
  await said.locator(".read-view .rv-tell-mic").click(); await said.waitForTimeout(500);
  ok(await said.locator(".read-view .rv-tell-words").inputValue() === "there was mayo too", "DT318 AC10: what I say stands in the field as if typed");
  // ---- AC7: the chip of an estimate says so
  await said.locator(".read-view .mp-which button.choice").filter({ hasText: /^Sour cream/ }).click(); await said.waitForTimeout(700);
  ok(/^Sour cream ~80 g estimate$/.test((await tags(said))[2]) && (await checks(said)).length === 1, "DT318 AC7: Sour cream is in no list: its chip says estimate, and no question which one follows");
  // ---- AC11: an amount typed on the Plate stays
  await said.locator(".read-view .rv-change .rv-continue").click(); await said.waitForTimeout(800);
  const g = said.locator("input[type=number]").nth(1); await g.fill("150"); await g.blur(); await said.waitForTimeout(500);
  st = await h.st(said);
  ok(st.items[1].grams === 150 && st.items[1].amountSet === true, "DT318 AC11: an amount typed on the Plate, 150 g of fries, is kept as mine");
  const sent2 = []; await said.route("**/api/plate-photo", async (r) => { sent2.push(r.request().postDataJSON()); await r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(READ2) }); });
  await said.evaluate(() => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.photo.view = "read"; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); });
  await said.goto(h.U + "/plate"); await said.waitForTimeout(1500);
  await said.locator(".read-view .rv-tell-words").fill("There was mayo too."); await said.locator(".read-view .rv-tell-send").click(); await said.waitForTimeout(3000);
  ok(sent2.length === 1 && sent2[0].keep.some((k) => k.name === "Sweet potato fries, baked" && k.grams === 150) && (await tags(said)).some((t) => /^Sweet potato fries, baked ~?150 g$/.test(t)), "DT318 AC11: when Chef Mealan answers my words, the fries are still 150 g");
  // ---- AC14: three languages
  const en = JSON.parse(fs.readFileSync(path.join(__dirname, "../../src/i18n/en.json"), "utf8"));
  const sr = JSON.parse(fs.readFileSync(path.join(__dirname, "../../src/i18n/sr-Latn.json"), "utf8")).screens, de = JSON.parse(fs.readFileSync(path.join(__dirname, "../../src/i18n/de.json"), "utf8")).screens;
  const keys = ["plate.tellChefCheck", "plate.tellAbout", "plate.sendToChef", "plate.changeTheFoods", "plate.didAdded", "plate.didChanged", "plate.didKept", "plate.whichOneIs", "plate.estimate"];
  ok(keys.every((k) => sr[k] && sr[k].text && sr[k].text !== en[k]) && sr["plate.sendToChef"].text === "Pošalji Chef Mealanu" && sr["plate.changeTheFoods"].text === "Nastavi na Tanjiru", "DT318 AC14: Tell Chef Mealan what to check, About, Send to Chef Mealan, Continue on the Plate and Chef Mealan's line are in Serbian");
  ok(keys.every((k) => de[k] && de[k].text && de[k].text !== en[k]) && de["plate.sendToChef"].text === "An Chef Mealan senden" && de["plate.changeTheFoods"].text === "Weiter auf dem Teller", "DT318 AC14: and in German");
} catch (e) { ok(false, "walkthrough error: " + (e && e.message)); } finally { await h.end(); } })();
