// DT142 (0.2.127): the first setup ends on 4. Where you shop and cook; a walkthrough about something else picks Munich and
// goes on with Done: to Today
module.exports = async (page, place = "Munich") => {
  const step = page.locator(".shop-step");
  await page.waitForTimeout(300);
  if (!(await step.count())) return;
  await step.getByRole("group", { name: "Where do you live and shop?" }).getByRole("button", { name: place, exact: true }).click(); await page.waitForTimeout(300);
  await step.getByRole("button", { name: "Done: to Today" }).click(); await page.waitForTimeout(500);
};
