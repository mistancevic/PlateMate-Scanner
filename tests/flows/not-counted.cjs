// B150 (0.3.160): a photo read with no meal selected, or with a meal, is taken out of the day with Don't count it. From the
// read it is one tap on Continue on the Plate first; the plate then has the button Don't count it. The plate is kept as Served.
// A photo soon after a meal of today asks first (DT247); its Don't count it does the same. A plate already kept needs nothing.
module.exports = async (page) => {
  if (await page.locator(".sv-plate").count()) return;
  const ask = page.locator(".dish-not-counted");
  if (await ask.count()) { await ask.click(); await page.waitForTimeout(600); return; }
  const go = page.locator(".rv-change");
  if (await go.count()) { await go.click(); await page.waitForTimeout(500); }
  // a plate from an earlier day asks Did you eat it? first; Keep working on it opens the plate
  const keep = page.getByRole("button", { name: "Keep working on it" });
  if (await keep.count()) { await keep.click(); await page.waitForTimeout(500); }
  await page.locator(".mp-not-counted").first().click(); await page.waitForTimeout(600);
};
