// DT251 (0.3.104): cook mode opens on Get it ready when a cook starts at the beginning; walkthroughs about the steps skip it
// with Step 1 ›, as a cook can at any time (get-it-ready.cjs walks Get it ready itself)
module.exports = async (page) => { const b = page.locator(".cook-mode .cook-ready-skip"); if (await b.count()) { await b.click(); await page.waitForTimeout(400); } };
