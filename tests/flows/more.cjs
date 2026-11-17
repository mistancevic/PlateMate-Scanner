// DT308 Release 2 (0.3.155, board Stories238, DT308.7): with foods on the plate, the search, Photo or scan and Add manually
// live under + Add more to your plate. A walkthrough that is about something else opens it here, when it is there, and gets
// the control it wants: the search of all foods, the camera's tile, or Add manually.
module.exports = async (page, what) => {
  const open = page.locator(".add-more-open");
  if (await open.count() && await open.first().isVisible()) { await open.first().click(); await page.waitForTimeout(250); }
  if (what === "scan") return page.getByRole("button", { name: /^(Scan( food)?|Photo or scan)$/ }).first();
  if (what === "mp") return page.locator(".mp-button").first();
  if (what === "manual") return page.getByRole("button", { name: /^(Manual|Add manually)$/ }).first();
  return page.getByLabel(/^Search all (my )?foods$/);
};
