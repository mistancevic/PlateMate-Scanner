// Story DT313 (0.3.159, board Stories250; Coach Milan, Go 18 November 15:56): whatever arrives on a plate that has foods
// gets the question a photo gets. A recipe from Recipes, a meal from the Plan, Chef Mealan's idea from the chat and one food
// onto a plate from an earlier meal ask on one screen: Your plate is not empty, the plate by its name, what arrives, then
// Add to my plate and Start a new plate. Back takes the place of Keep my plate: nothing lands, and I am where I came from.
// Start a new plate keeps the old plate in My recipes, and one line on top says so, with Open it in My recipes and Undo.
// A plate of now takes one food with no question, and an empty plate is never asked.
// The checks name the acceptance criteria of the board (DT313 AC1 to AC10). AC8, foods said in words onto a plate that has
// foods, has no check: in the app foods are said only on an empty Plate, so the case cannot be reached by hand.
// changed by DT349 (0.3.193, AC9): Change it first is Put it on the Plate, in What do you do with it?
const start = require("./plate157.cjs");
const PORT = "3568";
const F = (sd, n) => sd.foods.find((f) => f.name.startsWith(n));
const bowlItems = (sd) => [{ id: "r1a", food: F(sd, "Rice"), grams: 200, locked: false }, { id: "r1b", food: F(sd, "Chicken"), grams: 190, locked: false }];
const seedRec = (sd) => { sd.meals = [{ id: "r1", title: "Chicken and rice bowl", items: bowlItems(sd), portion: 390, savedAt: "2026-11-10T10:00:00Z" }]; };
const names = (s) => s.items.map((i) => i.food.name.split(",")[0]).join(", ");
(async () => { const h = await start(PORT); const { ok } = h; try {
  const toRecipe = async (p) => { await h.tab(p, "Recipes"); await p.locator(".recipe-tile").first().click(); await p.waitForTimeout(800); };
  const change = async (p) => { await p.getByRole("button", { name: "Put it on the Plate" }).click(); await p.waitForTimeout(1000); };
  const asked = async (p) => ({ m: await h.main(p), go: (await p.locator(".pa-go .pill").allInnerTexts()).map((t) => t.trim()).join(" | "), back: await p.locator(".ask-back").count() ? (await p.locator(".ask-back").innerText()).trim() : "" });
  // ---- AC1 to AC3: a recipe from Recipes
  let p = await h.open({ seed: seedRec });
  await toRecipe(p); await change(p);
  let q = await asked(p);
  ok(/Your plate is not empty It already has Skyr, Oats & Banana, and the recipe brings its own foods/.test(q.m) && /The recipe is Chicken and rice bowl, from My recipes: 2 foods\./.test(q.m) && /Add it to your plate, or start a new plate\?/.test(q.m) && await p.locator(".plate-ask-photo").count() === 1 && await p.locator(".plate-ask-head .warn-title").count() === 1, "DT313 AC1: Put it on the Plate on a recipe: Your plate is not empty, my plate by name, and the recipe with where it comes from");
  ok(q.go === "Add to my plate | Start a new plate" && !/Keep my plate/.test(q.m) && /Skyr, Oats & Banana is saved in My recipes, so nothing is lost\.$/.test(q.m.trim()) && (await h.st(p)).items.length === 3, "DT313 AC1: Add to my plate, then Start a new plate; no Keep my plate; nothing has landed yet");
  ok(q.back === "Back to the recipe", "DT313 AC2: with Back to the recipe");
  await p.locator(".ask-back").click(); await p.waitForTimeout(700);
  ok(/Chicken and rice bowl/.test(await h.main(p)) && await p.getByRole("button", { name: "Put it on the Plate" }).count() === 1 && names(await h.st(p)) === "Skyr, Oats, Banana", "DT313 AC2: Back: I am on the recipe's page and my plate holds what it held");
  await change(p);
  await p.getByRole("button", { name: "Add to my plate" }).click(); await p.waitForTimeout(800);
  let s = await h.st(p);
  ok(s.items.length === 5 && s.items.slice(3).every((i) => i.dish && i.dish.title === "Chicken and rice bowl") && !s.items.slice(0, 3).some((i) => i.dish) && !s.oldPlate && !s.title, "DT313 AC3: Add to my plate: the recipe joins my foods as one dish, and the plate keeps its name");
  await p.context().close();
  // ---- AC4, AC5: Start a new plate keeps the old one; Undo
  p = await h.open({ seed: seedRec });
  await toRecipe(p); await change(p);
  await p.getByRole("button", { name: "Start a new plate" }).click(); await p.waitForTimeout(1000);
  s = await h.st(p);
  const line = (await p.locator(".old-plate").innerText()).replace(/\s+/g, " ");
  ok(names(s) === "Rice, Chicken breast" && s.meals.some((m) => m.title === "Skyr, Oats & Banana" && m.items.length === 3), "DT313 AC4: Start a new plate: only the recipe is on the plate, and Skyr, Oats & Banana is in My recipes");
  ok(/Skyr, Oats & Banana is saved in My recipes\. This plate holds only the recipe\./.test(line) && /Open it in My recipes/.test(line) && await p.locator(".old-plate-undo").count() === 1, "DT313 AC4: one line on top says so, with Open it in My recipes and Undo: " + line);
  await p.locator(".old-plate-undo").click(); await p.waitForTimeout(800);
  s = await h.st(p);
  ok(names(s) === "Skyr, Oats, Banana" && !s.meals.some((m) => m.title === "Skyr, Oats & Banana") && !s.oldPlate && await p.locator(".old-plate").count() === 0, "DT313 AC5: Undo: my plate holds skyr, oats and a banana again, the recipe is off it, and the copy is gone");
  await toRecipe(p); await change(p);
  ok(await p.locator(".plate-ask-photo").count() === 1, "DT313 AC5: after Undo the recipe asks again when it comes");
  await p.context().close();
  // ---- AC6: a meal from the Plan
  const sd0 = JSON.parse(require("node:fs").readFileSync(require("node:path").join(__dirname, "seed.json"), "utf8"));
  const planned = { "2026-11-15": { dinner: { title: "Chicken and rice bowl", kcal: 574, protein: 64, source: "plate", items: bowlItems(sd0), portion: 390 } } };
  p = await h.open({ planned });
  await h.tab(p, "Plan"); await p.getByText("Chicken and rice bowl").first().click(); await p.waitForTimeout(700);
  await p.locator(".meal-view-make").click(); await p.waitForTimeout(1000);
  q = await asked(p);
  ok(/Your plate is not empty It already has Skyr, Oats & Banana/.test(q.m) && /The meal is Chicken and rice bowl, from your plan: 2 foods\./.test(q.m) && q.go === "Add to my plate | Start a new plate" && q.back === "Back to the plan" && await p.locator(".plate-ask-photo").count() === 1, "DT313 AC6: a meal from the Plan: the same screen, with Back to the plan");
  await p.locator(".ask-back").click(); await p.waitForTimeout(700);
  ok(/Dinner, 20:00/.test(await h.main(p)) && names(await h.st(p)) === "Skyr, Oats, Banana", "DT313 AC6: Back: I am on the Plan and my plate holds what it held");
  await p.getByText("Chicken and rice bowl").first().click(); await p.waitForTimeout(700); await p.locator(".meal-view-make").click(); await p.waitForTimeout(1000);
  await p.getByRole("button", { name: "Start a new plate" }).click(); await p.waitForTimeout(1000);
  s = await h.st(p);
  ok(names(s) === "Rice, Chicken breast" && s.meals.some((m) => m.title === "Skyr, Oats & Banana") && await p.locator(".old-plate").count() === 1 && /Dinner/.test(await h.line(p)), "DT313 AC6: Start a new plate: the meal is on the plate as today's dinner, and the old plate is kept: " + await h.line(p));
  await p.locator(".old-plate-undo").click(); await p.waitForTimeout(800);
  ok(names(await h.st(p)) === "Skyr, Oats, Banana" && /No meal selected/.test(await h.line(p)), "DT313 AC6: Undo: my plate is back, with no meal set");
  await p.context().close();
  // ---- AC7: Chef Mealan's idea from the chat
  p = await h.open({});
  await p.route("**/api/out", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ reply: "A rice bowl with chicken fits your day.", recognised: [{ name: "Rice, cooked", calories: 130, protein: 2.7, fats: 0.3, carbs: 28, fiber: 0.4 }, { name: "Chicken breast, grilled", calories: 165, protein: 31, fats: 3.6, carbs: 0, fiber: 0 }], picks: [{ name: "Rice, cooked", grams: 150 }, { name: "Chicken breast, grilled", grams: 180 }], skip: [], named: [] }) }));
  await h.tab(p, "Today"); await p.locator(".chat-fab").click(); await p.waitForTimeout(1000);
  { const inp = p.locator(".talk-overlay textarea, .talk-overlay input").first(); await inp.fill("a dinner with rice and chicken"); await inp.press("Enter"); await p.waitForTimeout(2500); }
  await p.getByRole("button", { name: "Work on it with Chef Mealan" }).last().click(); await p.waitForTimeout(1000);
  q = await asked(p);
  ok(/Your plate is not empty It already has Skyr, Oats & Banana, and new foods arrive/.test(q.m) && /The idea from the chat has 2 foods\./.test(q.m) && q.go === "Add to my plate | Start a new plate" && q.back === "Back to the chat" && (await h.st(p)).items.length === 3, "DT313 AC7: the idea from the chat: the same screen, with Back to the chat; nothing has landed");
  await p.locator(".ask-back").click(); await p.waitForTimeout(700);
  ok(await p.locator(".talk-overlay").count() === 1 && (await h.st(p)).items.length === 3, "DT313 AC7: Back: the chat is open again and my plate holds what it held");
  await p.getByRole("button", { name: "Work on it with Chef Mealan" }).last().click(); await p.waitForTimeout(1000);
  await p.getByRole("button", { name: "Start a new plate" }).click(); await p.waitForTimeout(1000);
  s = await h.st(p);
  ok(s.items.length === 2 && s.meals.some((m) => m.title === "Skyr, Oats & Banana") && /This plate holds only the new foods\./.test((await p.locator(".old-plate").innerText()).replace(/\s+/g, " ")), "DT313 AC7: Start a new plate: only the idea's foods, the old plate kept, and the line says This plate holds only the new foods");
  await p.context().close();
  // ---- AC9: one food onto a plate from an earlier meal
  const oldSeed = (sd) => { sd.items = [{ id: "o1", food: F(sd, "Skyr"), grams: 250, locked: false }, { id: "o2", food: F(sd, "Oats"), grams: 80, locked: false }]; sd.plateAt = "2026-11-14T19:10:00+01:00"; };
  const addBanana = async (p) => { await require("./foods.cjs")(p); await p.evaluate(() => { const bs = [...document.querySelectorAll("button")].filter((b) => /^Add to meal$/.test(b.textContent.trim())); let best = null, len = 1e9; for (const b of bs) { let e = b.parentElement; for (let i = 0; i < 5 && e; i++, e = e.parentElement) if (/Banana/.test(e.textContent)) { if (e.textContent.length < len) { len = e.textContent.length; best = b; } break; } } best && best.click(); }); await p.waitForTimeout(1200); };
  p = await h.open({ foods: [], seed: oldSeed });
  await addBanana(p);
  q = await asked(p);
  ok(/Your plate is not empty It already has Skyr & Oats, from Saturday 19:10\. A new food cannot land on it by itself/.test(q.m) && /The food is Banana\./.test(q.m) && q.go === "Add to my plate | Start a new plate" && q.back === "Back to the plate" && await p.locator(".plate-ask-photo").count() === 1 && !/Keep my plate/.test(q.m), "DT313 AC9: a banana onto Saturday's plate: the same screen, the plate with its day and time, the banana as what arrives");
  await p.getByRole("button", { name: "Start a new plate" }).click(); await p.waitForTimeout(1200);
  s = await h.st(p);
  ok(names(s) === "Banana" && s.meals.some((m) => m.title === "Skyr & Oats" && m.items.length === 2) && /Skyr & Oats is saved in My recipes\. This plate holds only the new foods\./.test((await p.locator(".old-plate").innerText()).replace(/\s+/g, " ")), "DT313 AC9: Start a new plate: only the banana, and Skyr & Oats is kept in My recipes, with the line and Undo");
  await p.locator(".old-plate-undo").click(); await p.waitForTimeout(800);
  ok(names(await h.st(p)) === "Skyr, Oats", "DT313 AC9: Undo: Saturday's plate is back");
  await p.context().close();
  // ---- AC10 and what must not change: an empty plate, and one food onto a plate of now
  p = await h.open({ foods: [], seed: seedRec });
  await toRecipe(p); await change(p);
  ok(await p.locator(".plate-ask").count() === 0 && names(await h.st(p)) === "Rice, Chicken breast" && !(await h.st(p)).oldPlate, "DT313 AC10: an empty plate: the recipe lands with no question");
  await p.context().close();
  p = await h.open({});
  await addBanana(p);
  ok(await p.locator(".plate-ask").count() === 0 && (await h.st(p)).items.length === 4, "must not change: one food onto a plate of now joins with no question");
} catch (e) { ok(false, "walkthrough error: " + (e && e.message)); } finally { await h.end(); } })();
