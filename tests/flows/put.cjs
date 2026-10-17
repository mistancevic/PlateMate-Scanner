// Put a read recipe on the plate (0.2.27, board PF2): the read ends with Put it on my plate when a meal is picked; Exploring
// ends with Save in Mine, Plan it and Make it now, and Make it now picks the next meal, as the plate did before 0.2.27.
module.exports = async (page) => {
  const put = page.getByRole("button", { name: "Put it on my plate" });
  if (!(await put.count())) { await page.getByRole("button", { name: "Make it now" }).click(); await page.waitForTimeout(250); }
  await put.first().click();
};
