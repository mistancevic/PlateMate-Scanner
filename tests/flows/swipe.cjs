// A swipe on a row, as a finger does it (R19, 0.2.47): "left" swaps, "right" skips (Today) or empties (Plan). Helper, not a walkthrough.
module.exports = async (page, row, dir) => {
  await row.scrollIntoViewIfNeeded();
  const b = await row.boundingBox();
  const y = b.y + b.height / 2, x0 = b.x + b.width / 2;
  await page.mouse.move(x0, y); await page.mouse.down();
  for (let s = 1; s <= 10; s++) await page.mouse.move(x0 + (dir === "left" ? -s : s) * 14, y);
  await page.mouse.up(); await page.waitForTimeout(500);
};
