// DT141 (0.2.126): right after I agree, setup asks the safety question; a walkthrough that is about something else answers
// None of these applies to me and goes on with Next
module.exports = async (page) => {
  const q = page.locator("#safety-question");
  if (!(await q.count()) || !(await q.getByRole("button", { name: /^(Next|Tick one)/ }).count())) return;
  await q.getByText("None of these applies to me", { exact: true }).click(); await page.waitForTimeout(200);
  await q.getByRole("button", { name: /^Next/ }).click(); await page.waitForTimeout(300);
};
