// The Plate's plan line (0.2.0, canvas S): the kind and the moment sit behind its pencil. Open them before tapping a moment.
module.exports = async (page) => {
  const pen = page.getByRole("button", { name: "Change what this plate is" });
  if ((await pen.count()) && (await pen.getAttribute("aria-expanded")) !== "true") { await pen.click(); await page.waitForTimeout(200); }
};
