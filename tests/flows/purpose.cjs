// What the plate is for (0.2.27, canvas boards PF to PF3): the line under the title opens What is it for?; a chip picks it and
// Done closes the section. Exploring sizes nothing, so a walkthrough that needs a meal's size picks the meal first.
module.exports = async (page, chip) => {
  const done = page.locator(".plan-line-done");
  if (!(await done.count())) { await page.locator(".plan-line").click(); await page.waitForTimeout(200); }
  await page.locator(".for-row").getByRole("button", { name: chip, exact: true }).click(); await page.waitForTimeout(250);
  await page.locator(".plan-line-done").click(); await page.waitForTimeout(250);
};
