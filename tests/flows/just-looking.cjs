// 0.3.157 (DT308.1): Just looking was the last row of the calendar behind the meal line's pencil.
// Changed by B150 (0.3.160, board B150; Coach Milan 19 November 01:00, Go): Just looking and the X are gone. The last row of
// the calendar says No meal selected and takes the meal off. A walkthrough taps it here the way a person does: the pencil,
// the row No meal selected, then the X that closes edit mode. A photo read with no meal selected is not kept as Served by
// this; Don't count it does that after the read (not-counted.cjs).
module.exports = async (page) => {
  if (!(await page.locator(".meal-line-open").count())) { await page.locator(".meal-line .plan-line-pen").click(); await page.waitForTimeout(300); }
  if (!(await page.locator(".meal-line-open .pcal-looking.on").count())) { await page.locator(".meal-line-open .pcal-looking").click(); await page.waitForTimeout(400); }
  await page.locator(".meal-line .plan-line-close").click(); await page.waitForTimeout(300);
};
