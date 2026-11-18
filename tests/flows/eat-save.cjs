// 0.3.157 (DT308.11, board Stories243; Coach Milan, Go 18 November 11:14): with no meal set, Save on Eat asks for the meal:
// the calendar opens under Save, on today, with the guess from the clock marked. A walkthrough that is about something else
// taps Save and then the marked meal (or the one named), as a person does. With a meal set nothing is asked, and this is
// the one tap on Save it was before. Returns the meal tapped, or null when nothing was asked.
module.exports = async (page, name) => {
  await page.locator(".eat-save").click(); await page.waitForTimeout(400);
  const cal = page.locator(".eat-cal");
  if (!(await cal.count())) return null;
  const row = name ? cal.locator(".pcal-row").filter({ hasText: new RegExp("^\\s*(✓\\s*)?" + name, "i") }).first() : (await cal.locator(".pcal-row.on").count()) ? cal.locator(".pcal-row.on").first() : cal.locator(".pcal-row").first();
  const said = ((await row.innerText()) || "").replace(/\s+/g, " ").trim();
  await row.click(); await page.waitForTimeout(400);
  return said;
};
