// B150 (0.3.160): a photo read with no meal selected, or with a meal, is taken out of the day with Don't count it. From the
// read it is one tap on Continue on the Plate first; the plate then has the button Don't count it. The plate is kept as Served.
// A photo soon after a meal of today asks first (DT247); its Don't count it does the same. A plate already kept needs nothing.
// Changed by story DT306 (0.3.163, board DT306; Coach Milan, Go 19 November 11:36): Don't count it is an answer to Did you eat
// it? on Chef Mealan's card, then Done; with no meal selected his card has no buttons, so a meal of today is set first, in the
// meal line, the way a person does: the pencil, today, a meal, the X. A plate of several portions keeps its own button (DT133).
// Changed by story DT307 (0.3.163): Continue on the Plate is tapped by its own name.
module.exports = async (page) => {
  if (await page.locator(".sv-plate").count()) return;
  const ask = page.locator(".dish-not-counted");
  if (await ask.count()) { await ask.click(); await page.waitForTimeout(600); return; }
  const go = page.locator(".rv-change .rv-continue");
  if (await go.count()) { await go.click(); await page.waitForTimeout(500); }
  // a plate from an earlier day asks Did you eat it? first; Keep working on it opens the plate
  const keep = page.getByRole("button", { name: "Keep working on it" });
  if (await keep.count()) { await keep.click(); await page.waitForTimeout(500); }
  const old = page.locator(".mp-not-counted");
  if (await old.count()) { await old.first().click(); await page.waitForTimeout(600); return; }
  if (!(await page.locator(".mp-eat").count())) {
    // a meal of today: edit mode opens on the photo's day, and a meal of another day is logged there with no card to ask
    await page.locator(".meal-line .plan-line-pen").click(); await page.waitForTimeout(300);
    const today = page.locator(".meal-line-open .pcal-day").filter({ hasText: "today" });
    if (await today.count() && !(await today.first().getAttribute("class")).includes(" on")) { await today.first().click(); await page.waitForTimeout(300); }
    await page.locator(".meal-line-open .pcal-row:not(.pcal-looking):not([disabled])").first().click(); await page.waitForTimeout(400);
    await page.locator(".meal-line .plan-line-close").click(); await page.waitForTimeout(400);
  }
  await page.locator(".mp-eat .pa-opt").filter({ hasText: "Don't count it" }).click(); await page.waitForTimeout(200);
  await page.locator(".mp-done").click(); await page.waitForTimeout(600);
};
