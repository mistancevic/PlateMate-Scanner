// DT318 (0.3.160, board DT318): the link Wrong foods? Help Chef Mealan read it is gone. The form Help Chef Mealan read it
// opens with one more photo of the same plate: ＋ Photo, then One more photo of this plate. A walkthrough opens it here.
const path = require("node:path");
module.exports = async (page) => {
  if (!(await page.locator(".mp-add-photo").count())) { await page.locator(".mp-line").click(); await page.waitForTimeout(300); }
  await page.locator(".mp-add-photo").click(); await page.waitForTimeout(300);
  await page.locator(".mp-plus-same input").setInputFiles(path.resolve(__dirname, "plate.jpg")); await page.waitForTimeout(1000);
};
