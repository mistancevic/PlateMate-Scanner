// Me lives in the top menu (X0, 10 October 2026): Menu, then Me. The bar holds Today, Plate, Recipes, Foods.
// The menu button toggles: from inside a section it closes the menu first, so a second tap opens the list.
module.exports = async (page) => {
  const row = () => page.locator(".menu-row").filter({ hasText: /^Me$/ }).first();
  for (let i = 0; i < 3 && (await row().count()) === 0; i++) { await page.getByRole("button", { name: "Menu" }).first().click(); await page.waitForTimeout(250); }
  await row().click(); await page.waitForTimeout(350);
};
