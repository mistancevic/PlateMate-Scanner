// Release A (7 October 2026): Chef Mealan is for adults, and every journey starts after the welcome tap, "I'm 18 or older".
// Walkthroughs that are about something else start there: this keeps the tap on the phone, as if given the day before.
// Added after each walkthrough's own seed, so a seed that writes the safety record keeps it and gains the tap.
module.exports = (page) => page.addInitScript(() => {
  try {
    const k = "chefmealan-safety";
    const s = JSON.parse(localStorage.getItem(k) || "{}") || {};
    if (!s.adultAt) localStorage.setItem(k, JSON.stringify({ situations: [], flags: [], allergies: [], ...s, adultAt: "2026-10-06T09:00:00Z" }));
  } catch {}
});
