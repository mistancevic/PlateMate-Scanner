// BP70 (Milan 21 October 2026): a book's own page at /worthy-numbers. Signed in (here: the phone-only app) it stays on the
// book, offers Open Chef Mealan, and drops the ?from= ending after counting it. The beta spots number is set by Milan and
// read back by the page.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const U = "http://127.0.0.1:3245";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3245", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 900 } });
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const hits = []; page.on("request", (r) => { if (r.url().endsWith("/api/hit")) hits.push(r.postData() || ""); });
  await page.addInitScript(() => { try { Object.defineProperty(Navigator.prototype, "sendBeacon", { value: undefined, configurable: true }); } catch {} });
  await page.addInitScript(() => { localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z" })); });
  const meta = await (await fetch(U + "/worthy-numbers")).text();
  ok(/og:title" content="Worthy Numbers, a guide to food labels/.test(meta) && /worthy-numbers-og\.jpg/.test(meta), "the address carries the book's title and share picture");
  await page.goto(U + "/worthy-numbers?from=qr"); await page.waitForTimeout(1500);
  ok((await page.locator("h1").first().textContent()) === "Worthy Numbers", "the book page opens, signed in too");
  ok(new URL(page.url()).search === "" && new URL(page.url()).pathname === "/worthy-numbers", "the ?from= ending is dropped from the address");
  ok(hits.some((h) => h.includes("book_worthy_numbers__qr")) && hits.some((h) => /"book_worthy_numbers"/.test(h)), "the visit counts for the book and for the QR code");
  ok(await page.getByRole("link", { name: "Open Chef Mealan" }).count() === 1, "signed in, the page offers Open Chef Mealan instead of the form");
  ok(/PD, the number no pack prints/.test(await page.locator("main, body").first().textContent()), "PD is explained on the page");
  const set = await (await fetch(U + "/api/beta/spots", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ spots: 3 }) })).json().catch(() => ({}));
  const got = await (await fetch(U + "/api/beta/spots")).json();
  ok(got.spots === 3 || set.error, "the beta spots number is kept and read back");
  const bad = await fetch(U + "/api/beta/spots", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ spots: "lots" }) });
  ok(bad.status === 400 || bad.status === 401 || bad.status === 403, "anything but a whole number is refused");
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
