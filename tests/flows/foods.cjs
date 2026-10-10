// Foods lives in the top menu from 0.2.0 (canvas X0): Menu, then Foods. The bar holds Today, Plan, Plate, Recipes.
module.exports = async (page) => {
  const row = () => page.locator(".menu-row").filter({ hasText: /^Foods$/ }).first();
  for (let i = 0; i < 3 && (await row().count()) === 0; i++) { await page.getByRole("button", { name: "Menu" }).first().click(); await page.waitForTimeout(250); }
  await row().click(); await page.waitForTimeout(400);
};
