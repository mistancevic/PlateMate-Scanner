// DT208 (0.3.49): the strip Set your goal is gone; the goal calculator opens from My goal, then Change the goal
module.exports = async (page) => {
  await page.locator(".plan-goal-name").first().click(); await page.waitForTimeout(500);
  await page.getByRole("button", { name: /Change the goal/ }).first().click(); await page.waitForTimeout(500);
};
