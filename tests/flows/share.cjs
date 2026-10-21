// Share Chef Mealan (SH73, canvas board SH73, Milan 21 October 2026, 21:10 to 23:42). From the menu, for Milan only for now
// (here, without accounts, the local one): Show the link draws a QR code for chefmealan.com or the book, both counted as QR;
// Invite now makes a personal code for one Google email and shows it as a QR code to chefmealan.com/?code=, and says the
// beta spots left; a code that arrives in the address is kept for the tab and leaves the address.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3198" }, stdio: ["ignore", "pipe", "pipe"] });
  for (let i = 0; i < 60; i++) { try { await fetch("http://127.0.0.1:3198/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  await page.addInitScript((s) => { if (!localStorage.getItem("seeded")) {
    localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 80, plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { meals: 3, window: { from: "08:00", to: "19:00" } } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); } }, seed);
  // the invite the server would make: this local build has no accounts
  let sent = null;
  await page.route("**/api/invites", (r) => { if (r.request().method() !== "POST") return r.fulfill({ json: { invites: [] } }); sent = JSON.parse(r.request().postData() || "{}"); return r.fulfill({ json: { code: "K7Q2MX", email: sent.email, name: sent.name, coachName: "Milan", spots: 2 } }); });
  // a code in the address is kept for this tab and leaves the address
  await page.goto("http://127.0.0.1:3198/today?code=k7q2-mx"); await page.waitForTimeout(1500);
  ok(!/code=/.test(page.url()) && (await page.evaluate(() => sessionStorage.getItem("chefmealan-code"))) === "K7Q2MX", "a code in the address is kept, cleaned, and leaves the address: " + page.url());
  await page.getByRole("button", { name: "Menu" }).click(); await page.waitForTimeout(700);
  const row = page.locator(".menu-row", { hasText: "Share Chef Mealan" });
  ok(await row.count() === 1, "Share Chef Mealan in the menu for the account the server names");
  await row.click(); await page.waitForTimeout(700);
  const qr = () => page.locator("svg.qr").getAttribute("data-text");
  ok((await qr()) === "https://chefmealan.com/?from=qr" && await page.getByRole("button", { name: "Share the link" }).count() === 1 && await page.getByRole("button", { name: "Copy" }).count() === 1, "Show the link: a QR code for chefmealan.com, counted as QR, with Share and Copy");
  await page.getByRole("radio", { name: "Worthy Numbers" }).click(); await page.waitForTimeout(200);
  ok((await qr()) === "https://chefmealan.com/worthy-numbers?from=qr", "the book chip turns it into the book page's QR code");
  await page.getByRole("tab", { name: "Invite now" }).click(); await page.waitForTimeout(300);
  const make = page.getByRole("button", { name: "Make a code" });
  ok(await make.isDisabled(), "no code without an email");
  await page.getByLabel("Name").fill("Anna"); await page.getByLabel("Their Google email").fill("anna@example.com");
  await make.click(); await page.waitForTimeout(600);
  const t = (await page.locator(".sh").innerText()).replace(/\s+/g, " ");
  ok(sent && sent.email === "anna@example.com" && sent.name === "Anna", "Make a code sends the email and the name: " + JSON.stringify(sent));
  ok((await qr()) === "https://chefmealan.com/?code=K7Q2MX" && /K7Q2MX/.test(t) && /For Anna, anna@example\.com/.test(t), "the code shows as a QR code to chefmealan.com/?code=, with the code and who it is for");
  ok(/Beta spots left: 2/.test(t), "it says the beta spots left after this code");
  await page.getByRole("button", { name: "Make another" }).click(); await page.waitForTimeout(300);
  ok(await page.getByLabel("Their Google email").inputValue() === "", "Make another starts empty");
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
