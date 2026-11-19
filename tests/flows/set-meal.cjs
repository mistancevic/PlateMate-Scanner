// 0.3.157 (DT308.1, board Stories236; Coach Milan, Go 18 November 11:14): no meal is guessed any more. A plate says Meal
// and day not set until you set one, and is sized for no meal until then. A walkthrough that is about something a meal
// decides (its size, Chef Mealan's checks, the plan's numbers) sets the meal first, the way a person does: the pencil of
// the meal line, then the meal in the calendar. With no name it taps the meal the clock is in: the first meal of today
// still to come and not eaten, or after the last, the last one not eaten (what the Plate guessed until 0.3.156).
// A day other than today: the chip's words, as "Mon 16". Returns the row's words, or null when a meal is already set.
// Changed by B150 (0.3.160, board B150): the pencil is always there and edit mode stays open after a tap on a meal, so this
// helper reads whether a meal is set from the line itself, skips the row No meal selected, and closes edit mode with the X.
module.exports = async (page, name, day) => {
  const line = page.locator(".meal-line").first();
  if (!(await line.count()) || !(await line.isVisible())) return null;
  if (/\bis-set\b/.test((await line.getAttribute("class")) || "")) return null;
  if (!(await page.locator(".meal-line-open").count())) { await page.locator(".meal-line .plan-line-pen").first().click(); await page.waitForTimeout(250); }
  if (day) { await page.locator(".meal-line-open .pcal-day").filter({ hasText: day }).first().click(); await page.waitForTimeout(250); }
  const rows = page.locator(".meal-line-open .pcal-row");
  const words = (await rows.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  const none = /^(✓ )?No meal selected/;
  let k = name ? words.findIndex((t) => new RegExp("^" + name + "\\b", "i").test(t)) : words.findIndex((t) => !/· (eaten|not eaten)$/.test(t) && !/^Snack( now)?$/.test(t) && !none.test(t));
  if (k < 0 && !name) { k = words.map((t) => / · not eaten$/.test(t)).lastIndexOf(true); if (k < 0) k = Math.max(0, words.filter((t) => !/^Snack( now)?$/.test(t) && !none.test(t)).length - 1); }
  if (k < 0) throw new Error(`set-meal: no meal ${name} in the calendar: ${words.join(" | ")}`);
  await rows.nth(k).click(); await page.waitForTimeout(400);
  const x = page.locator(".meal-line .plan-line-close").first();
  if (await x.count()) { await x.click(); await page.waitForTimeout(250); }
  return words[k];
};
