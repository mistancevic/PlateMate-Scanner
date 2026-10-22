// The Walkthroughs page (Milan, 22 October 2026: "I would like to have these walkthroughs visible somewhere"). Reads
// tests/flows-report.json, written by every full run of scripts/run-flows.cjs, and writes one self-contained HTML page:
// each walkthrough, what it covers, every check with ok or failed, the version and the time of the run.
//   node scripts/flows-page.cjs <out.html>        (reads docs/qa: every run kept, and every blind walkthrough)
// With a second argument the page gets a second tab, Blind walkthroughs: a reviewer who has never seen the app plays a new
// member, step by step with screenshots (thumbs/<name>.jpg next to the json), and lists every place they hesitated.
const fs = require("node:fs"), path = require("node:path");
// the runs kept in the repo (docs/qa/runs, one per version) and the blind walkthroughs (docs/qa/blind/<date>-<name>)
const QA = path.resolve(__dirname, "../docs/qa");
const ver = (v) => v.split(".").map(Number).reduce((n, x) => n * 1000 + x, 0);
const runs = fs.readdirSync(path.join(QA, "runs")).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(fs.readFileSync(path.join(QA, "runs", f), "utf8"))).sort((a, b) => ver(b.version) - ver(a.version));
const r = runs[0];
const history = runs.map((x) => ({ version: x.version, at: new Date(x.at).toLocaleDateString("en-GB", { timeZone: "Europe/Berlin", day: "numeric", month: "short", year: "numeric" }), passed: x.flows.filter((f) => f.pass).length, total: x.flows.length, checks: x.flows.reduce((n, f) => n + f.checks.length, 0) }));
const blindDirs = fs.existsSync(path.join(QA, "blind")) ? fs.readdirSync(path.join(QA, "blind")).filter((d) => fs.existsSync(path.join(QA, "blind", d, "findings.json"))).sort().reverse() : [];
const out = process.argv[2] || path.resolve(__dirname, "../tests/walkthroughs.html");
const name = (f) => { const s = f.replace(/\.cjs$/, "").replace(/[-_]+/g, " "); return s.charAt(0).toUpperCase() + s.slice(1); };
const flows = r.flows.map((f) => ({ id: f.file.replace(/\.cjs$/, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase(), name: name(f.file), file: f.file, about: f.about, pass: f.pass, seconds: f.seconds, checks: f.checks }));
const passed = flows.filter((f) => f.pass).length, checks = flows.reduce((n, f) => n + f.checks.length, 0);
const when = new Date(r.at).toLocaleString("en-GB", { timeZone: "Europe/Berlin", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
let blindHtml = "";
for (const d of blindDirs) {
  const dir = path.join(QA, "blind", d), b = JSON.parse(fs.readFileSync(path.join(dir, "findings.json"), "utf8"));
  const img = (n, alt) => { const p = path.join(dir, "thumbs", n + ".jpg"); return fs.existsSync(p) ? `<img src="data:image/jpeg;base64,${fs.readFileSync(p).toString("base64")}" alt="${esc(alt)}" width="150" loading="lazy">` : ""; };
  const sev = { Blocker: "bad", Friction: "warn", Polish: "soft" };
  blindHtml += `<article class="blind-one">
    <div class="persona"><div class="eyebrow">Blind walkthrough</div><h2>${esc(b.who.split(",")[0])}, first run</h2><p>${esc(b.who)}</p><p class="fix">Build: ${esc(b.build)}</p><p><b>Goal:</b> ${esc(b.goal)}</p><p class="result"><b>Result:</b> ${esc(b.result)}</p></div>
    <h3>Her path</h3>
    <ol class="steps">${b.steps.map(([n, t], i) => `<li>${img(n, "Step " + (i + 1))}<span><b>${i + 1}.</b> ${esc(t)}</span></li>`).join("")}</ol>
    <h3>What slowed her down, most important first</h3>
    <ol class="finds">${b.findings.map(([s, title, what, fix, n]) => `<li><div class="fhead"><span class="pill ${sev[s] || "soft"}">${esc(s)}</span><b>${esc(title)}</b></div><div class="fbody">${img(n, title)}<div><p>${esc(what)}</p><p class="fix"><b>Fix:</b> ${esc(fix)}</p></div></div></li>`).join("")}</ol>
    <h3>Good moments</h3><p>${esc(b.good)}</p>
    <h3>Not tried here: needs the AI</h3><ul>${b.ai.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>
    <p class="fix">Kept in the repo: docs/qa/blind/${esc(d)}</p>
  </article>`;
}
if (blindHtml) blindHtml = `<section class="blind" id="blind-tab" hidden>${blindHtml}</section>`;
const histHtml = history.length > 1 ? `<h2 class="sec">Every release run</h2><div class="hist"><table><thead><tr><th>Version</th><th>Run</th><th>Passed</th><th>Checks</th></tr></thead><tbody>${history.map((h) => `<tr><td>${esc(h.version)}</td><td>${esc(h.at)}</td><td class="${h.passed === h.total ? "okc" : "badc"}">${h.passed} of ${h.total}</td><td>${h.checks.toLocaleString("en")}</td></tr>`).join("")}</tbody></table></div>` : "";
const data = JSON.stringify({ version: r.version, commit: r.commit, when, minutes: r.minutes, passed, total: flows.length, checks, flows }).replace(/</g, "\\u003c");
const html = `<title>Chef Mealan Walkthroughs</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap">
<style>
/* a release checklist: summary first, then one row per journey that opens to its checks */
:root {
  --bg: #eef3fb; --card: #ffffff; --ink: #172742; --muted: #5b6b8a; --line: #d1dcf0;
  --brand: #1f5fc7; --brand-soft: #dae6fb; --ok: #13804f; --ok-soft: #dcf3e8; --bad: #b3261e; --bad-soft: #fbe3e1; --warn: #8a5a00; --warn-soft: #fdf0d5;
  --font: "Nunito", ui-rounded, system-ui, -apple-system, "Segoe UI", sans-serif;
  --mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --bg: #0d1626; --card: #15223a; --ink: #e7eefb; --muted: #9fb0cc; --line: #2a3a57;
  --brand: #8db6ff; --brand-soft: #1e3358; --ok: #6fd6a2; --ok-soft: #133528; --bad: #ff8a80; --bad-soft: #3d1a1a; --warn: #f3c565; --warn-soft: #3a2c10; color-scheme: dark } }
:root[data-theme="dark"] {
  --bg: #0d1626; --card: #15223a; --ink: #e7eefb; --muted: #9fb0cc; --line: #2a3a57;
  --brand: #8db6ff; --brand-soft: #1e3358; --ok: #6fd6a2; --ok-soft: #133528; --bad: #ff8a80; --bad-soft: #3d1a1a; --warn: #f3c565; --warn-soft: #3a2c10; color-scheme: dark }
* { box-sizing: border-box } [hidden] { display: none !important; }
body { background: var(--bg); color: var(--ink); font-family: var(--font); font-size: 15px; line-height: 1.5; }
.wrap { max-width: 860px; margin: 0 auto; padding-block: 28px 56px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); display: flex; flex-direction: column; gap: 18px; }
.eyebrow { font-size: 12px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; color: var(--brand); }
h1 { margin: 2px 0 0; font-size: clamp(28px, 6vw, 38px); line-height: 1.1; font-weight: 900; letter-spacing: -.01em; text-wrap: balance; }
.lead { margin: 0; color: var(--muted); max-width: 62ch; }
.summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
.stat { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 12px 14px; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.stat b { font-size: 24px; font-weight: 900; font-variant-numeric: tabular-nums; }
.stat span { font-size: 13px; color: var(--muted); font-weight: 700; }
.stat.good b { color: var(--ok); } .stat.bad b { color: var(--bad); }
.tools { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.tools input { flex: 1 1 220px; min-width: 0; font: inherit; padding: 10px 14px; border-radius: 999px; border: 1.5px solid var(--line); background: var(--card); color: var(--ink); }
.tools input:focus-visible, button:focus-visible, summary:focus-visible { outline: 3px solid var(--brand); outline-offset: 2px; }
.chip { font: inherit; font-weight: 800; font-size: 14px; padding: 8px 14px; border-radius: 999px; border: 1.5px solid var(--line); background: var(--card); color: var(--ink); cursor: pointer; }
.chip[aria-pressed="true"] { background: var(--brand); border-color: var(--brand); color: var(--card); }
.count { font-size: 13px; color: var(--muted); font-weight: 700; }
.list { display: flex; flex-direction: column; background: var(--card); border: 1px solid var(--line); border-radius: 16px; overflow: hidden; }
details { border-top: 1px solid var(--line); } details:first-child { border-top: 0; }
summary { list-style: none; cursor: pointer; display: grid; grid-template-columns: 1fr auto auto; gap: 10px; align-items: center; padding: 12px 16px; }
summary::-webkit-details-marker { display: none }
summary .nm { font-weight: 800; min-width: 0; overflow-wrap: anywhere; }
summary .meta { font-size: 13px; color: var(--muted); font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; }
.pill { font-size: 12px; font-weight: 900; letter-spacing: .04em; text-transform: uppercase; padding: 3px 10px; border-radius: 999px; }
.pill.ok { background: var(--ok-soft); color: var(--ok); } .pill.bad { background: var(--bad-soft); color: var(--bad); }
.body { padding: 0 16px 16px; display: flex; flex-direction: column; gap: 10px; }
.about { margin: 0; color: var(--muted); max-width: 70ch; }
.file { font-family: var(--mono); font-size: 12px; color: var(--muted); }
ol.checks { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 6px; }
ol.checks li { display: grid; grid-template-columns: 22px 1fr; gap: 6px; font-size: 14px; min-width: 0; }
ol.checks li span { overflow-wrap: anywhere; min-width: 0; }
ol.checks li i { font-style: normal; font-weight: 900; color: var(--ok); } ol.checks li.bad i { color: var(--bad); } ol.checks li.bad span { color: var(--bad); font-weight: 700; }
.empty { padding: 18px 16px; color: var(--muted); }
footer { font-size: 13px; color: var(--muted); }
.sec { margin: 8px 0 0; font-size: 20px; font-weight: 900; }
.hist { overflow-x: auto; background: var(--card); border: 1px solid var(--line); border-radius: 14px; }
.hist table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
.hist th, .hist td { text-align: left; padding: 8px 14px; border-top: 1px solid var(--line); font-size: 14px; }
.hist th { border-top: 0; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); }
.okc { color: var(--ok); font-weight: 800; } .badc { color: var(--bad); font-weight: 800; }
.blind-one { display: flex; flex-direction: column; gap: 14px; padding-bottom: 18px; }
.blind-one + .blind-one { border-top: 2px solid var(--line); padding-top: 18px; }
.tabs { display: flex; gap: 8px; flex-wrap: wrap; }
.tabpanel { display: flex; flex-direction: column; gap: 18px; }
.blind { display: flex; flex-direction: column; gap: 14px; }
.blind h2 { margin: 2px 0 6px; font-size: 26px; font-weight: 900; }
.blind h3 { margin: 10px 0 0; font-size: 18px; font-weight: 900; }
.blind p { margin: 0 0 6px; max-width: 70ch; }
.persona { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 16px; }
.persona .result { background: var(--brand-soft); border-radius: 10px; padding: 10px 12px; margin-top: 8px; }
ol.steps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
ol.steps li { display: flex; flex-direction: column; gap: 6px; font-size: 13px; min-width: 0; }
.blind img { width: 150px; max-width: 100%; height: auto; border-radius: 10px; border: 1px solid var(--line); display: block; }
ol.finds { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
ol.finds li { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; }
.fhead { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.fbody { display: grid; grid-template-columns: 110px 1fr; gap: 12px; align-items: start; }
.fbody img { width: 110px; }
.fbody > div { min-width: 0; }
.fix { color: var(--muted); }
.pill.warn { background: var(--warn-soft); color: var(--warn); } .pill.soft { background: var(--brand-soft); color: var(--brand); }
@media (max-width: 520px) { .fbody { grid-template-columns: 1fr; } }
@media (max-width: 520px) { summary { grid-template-columns: 1fr auto; } summary .meta { grid-column: 1 / -1; } }
</style>
<div class="wrap">
  <header>
    <div class="eyebrow">Chef Mealan · release checks</div>
    <h1>Walkthroughs</h1>
  </header>
  ${blindHtml ? '<nav class="tabs" role="tablist" aria-label="Kinds of walkthrough"><button class="chip" role="tab" id="t-checks" aria-pressed="true">Release checks</button><button class="chip" role="tab" id="t-blind" aria-pressed="false">Blind walkthroughs</button></nav>' : ""}
  <div id="checks-tab" class="tabpanel">
  <p class="lead">Every journey the app is checked on before a release. A script opens the app in a real browser on a phone-sized screen, taps through it the way a person would, and checks what it sees. Open a walkthrough to see what it covers and every check it made.</p>
  <section class="summary" id="summary" aria-label="The last run"></section>
  <div class="tools">
    <label for="q" class="count" style="position:absolute;left:-9999px">Search walkthroughs</label>
    <input id="q" type="search" placeholder="Search a journey or a check, e.g. book, Metrics, invite">
    <button class="chip" id="all" aria-pressed="true">All</button>
    <button class="chip" id="failed" aria-pressed="false">Failed only</button>
    <span class="count" id="count"></span>
  </div>
  <div class="list" id="list"></div>
  ${histHtml}
  <footer id="foot"></footer>
  </div>
  ${blindHtml}
</div>
<script>
const D = ${data};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
document.getElementById("summary").innerHTML =
  '<div class="stat ' + (D.passed === D.total ? "good" : "bad") + '"><b>' + D.passed + " of " + D.total + '</b><span>walkthroughs passed</span></div>' +
  '<div class="stat"><b>' + D.checks.toLocaleString("en") + '</b><span>checks made</span></div>' +
  '<div class="stat"><b>' + esc(D.version) + '</b><span>version, commit ' + esc(D.commit) + '</span></div>' +
  '<div class="stat"><b>' + D.minutes + ' min</b><span>' + esc(D.when) + '</span></div>';
document.getElementById("foot").textContent = "This page is made from the last full run, " + D.when + ", Berlin time. It is updated after every release run.";
let onlyFailed = false;
const render = () => {
  const q = document.getElementById("q").value.trim().toLowerCase();
  const rows = D.flows.filter((f) => (!onlyFailed || !f.pass) && (!q || (f.name + " " + f.about + " " + f.checks.map((c) => c.text).join(" ")).toLowerCase().includes(q)));
  document.getElementById("count").textContent = rows.length + " of " + D.total;
  document.getElementById("list").innerHTML = rows.length ? rows.map((f) =>
    '<details id="' + f.id + '"' + (location.hash === "#" + f.id ? " open" : "") + '><summary><span class="nm">' + esc(f.name) + '</span><span class="pill ' + (f.pass ? "ok" : "bad") + '">' + (f.pass ? "Passed" : "Failed") + '</span><span class="meta">' + f.checks.length + " checks · " + f.seconds + ' s</span></summary>' +
    '<div class="body">' + (f.about ? '<p class="about">' + esc(f.about) + "</p>" : "") + '<span class="file">tests/flows/' + esc(f.file) + '</span>' +
    '<ol class="checks">' + f.checks.map((c) => '<li class="' + (c.ok ? "" : "bad") + '"><i aria-label="' + (c.ok ? "passed" : "failed") + '">' + (c.ok ? "✓" : "✗") + "</i><span>" + esc(c.text) + "</span></li>").join("") + "</ol></div></details>").join("")
    : '<div class="empty">No walkthrough matches. Clear the search to see all ' + D.total + ".</div>";
};
document.getElementById("q").addEventListener("input", render);
const setF = (v) => { onlyFailed = v; document.getElementById("all").setAttribute("aria-pressed", String(!v)); document.getElementById("failed").setAttribute("aria-pressed", String(v)); render(); };
document.getElementById("all").addEventListener("click", () => setF(false));
document.getElementById("failed").addEventListener("click", () => setF(true));
render();
const tab = (t) => { const b = t === "blind"; document.getElementById("checks-tab").hidden = b; const bl = document.getElementById("blind-tab"); if (bl) bl.hidden = !b;
  document.getElementById("t-checks")?.setAttribute("aria-pressed", String(!b)); document.getElementById("t-blind")?.setAttribute("aria-pressed", String(b)); };
document.getElementById("t-checks")?.addEventListener("click", () => tab("checks"));
document.getElementById("t-blind")?.addEventListener("click", () => tab("blind"));
if (location.hash === "#blind") tab("blind");
if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
</script>
`;
fs.writeFileSync(out, html);
console.log(`${out}: ${passed} of ${flows.length} passed, ${checks} checks`);
