// 0.3.157 (DT308.1, board DT308 on Page 5, frames DT308.1 b and c; Coach Milan 18 November): Just looking is the last row
// of the calendar behind the meal line's pencil, in place of the chip under What is it for. A walkthrough taps it here the
// way a person does: with a meal set, X first (it clears the meal); then the pencil; then Just looking.
module.exports = async (page) => {
  const x = page.locator(".meal-line .plan-line-x");
  if (await x.count()) { await x.click(); await page.waitForTimeout(300); }
  if (!(await page.locator(".meal-line-open").count())) { await page.locator(".meal-line .plan-line-pen").click(); await page.waitForTimeout(300); }
  const row = page.locator(".meal-line-open .pcal-looking");
  if (await page.locator(".meal-line-open .pcal-looking.on").count()) { await page.locator(".meal-line .plan-line-pen").click(); await page.waitForTimeout(200); return; }
  await row.click(); await page.waitForTimeout(400);
};
