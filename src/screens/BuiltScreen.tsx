import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { hit } from "../metrics";
import { Mark, APP_NAME } from "../components/Mark";
import { DayVideo } from "./LandingScreen";
import { VERSION_LINE } from "../version";
import FACTS from "../builtFacts.json";

// /built, How Chef Mealan is built. BP1 (0.3.51, board Stories160; Coach Milan 2 November 07:01 to 08:31, Go): the page for a
// hiring manager with two minutes. Facts first, the system, one path end to end, how a change is made, how we know it works,
// the loops folded, who builds. Every number comes from src/builtFacts.json, counted by scripts/built-facts.cjs, never typed.
// Public, signed in or not, linked from the home page and the footer.

export const BUILT_FACTS = FACTS;
const day = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
const dayMonth = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long" });

// the system graph (the System board): boxes and the lines between them. Drawn at one size and scaled down on a narrow
// screen; on a phone the same parts stand in a column, each line said in words between them.
type GNode = { k: string; x: number; y: number; w: number; h: number; c: string; t: string; lines: string[] };
const GW = 1040, GH = 480;
const GN: GNode[] = [
  { k: "people", x: 0, y: 105, w: 160, h: 140, c: "human", t: "People", lines: ["A person, a coach, the owner", "3 beta testers", "Claude builds and tests"] },
  { k: "phone", x: 200, y: 60, w: 240, h: 220, c: "brand", t: "The phone: chefmealan.com", lines: ["An app in the browser, no store", "Data on the phone first, works offline", "The calculator: code, no server", "Camera: labels, barcodes, meal photos", "Voice: the browser's own"] },
  { k: "server", x: 490, y: 60, w: 240, h: 220, c: "ink", t: "The server: Cloud Run, Belgium", lines: ["The coach's rules in code", "Every AI call, with checks and fallbacks", "Counts use and the AI bill", "Preview, then production; one-line rollback"] },
  { k: "gemini", x: 800, y: 40, w: 200, h: 120, c: "ai", t: "Gemini (Google AI)", lines: ["Reads photos and labels", "Talks in the chat, drafts steps"] },
  { k: "firebase", x: 800, y: 190, w: 200, h: 120, c: "fb", t: "Firebase (Google)", lines: ["Sign-in with Google", "The account's copy in Belgium", "photos in Frankfurt"] },
  { k: "other", x: 800, y: 370, w: 200, h: 100, c: "muted", t: "Open Food Facts, Google Calendar", lines: ["Barcodes; training and busy times"] },
  { k: "kitchen", x: 220, y: 370, w: 200, h: 90, c: "brand", t: "Kitchen screen", lines: ["A second phone on the counter"] },
  { k: "github", x: 500, y: 370, w: 220, h: 90, c: "muted", t: "GitHub", lines: ["Code, boards, rules, test runs"] },
];
// lines: the points, which ends get a head, the label and where it sits
const GL: { p: [number, number][]; ends: ("start" | "end")[]; t: string; at: [number, number]; a?: "start" | "middle" }[] = [
  { p: [[160, 175], [200, 175]], ends: ["end"], t: "uses", at: [180, 166] },
  { p: [[440, 170], [490, 170]], ends: ["start", "end"], t: "HTTPS", at: [465, 161] },
  { p: [[730, 100], [800, 100]], ends: ["start", "end"], t: "the key", at: [765, 91] },
  { p: [[730, 250], [800, 250]], ends: ["start", "end"], t: "admin SDK", at: [765, 241] },
  { p: [[700, 280], [700, 340], [760, 340], [760, 420], [800, 420]], ends: ["end"], t: "fetch", at: [708, 316], a: "start" },
  { p: [[320, 280], [320, 370]], ends: ["start", "end"], t: "every 2 s", at: [328, 330], a: "start" },
  { p: [[610, 280], [610, 370]], ends: ["end"], t: "deploy", at: [618, 330], a: "start" },
  { p: [[320, 60], [320, 22], [1025, 22], [1025, 250], [1000, 250]], ends: ["start", "end"], t: "sign in, the account's copy of the phone's data, photos", at: [660, 14] },
];
// on a phone: the chain from people to the server, then what the server talks to, each with the line's words
const PHONE_CHAIN: [string, string | null][] = [["people", "uses"], ["phone", "HTTPS"], ["server", null]];
const PHONE_SIDE: [string, string][] = [["kitchen", "with the phone, every 2 s"], ["gemini", "from the server, the key stays there"], ["firebase", "from the server; the phone signs in here too"], ["other", "from the server, fetch"], ["github", "the server is deployed from here"]];
function head([x1, y1]: [number, number], [x2, y2]: [number, number]) {
  const a = Math.atan2(y2 - y1, x2 - x1), l = 10, w = 5;
  const bx = x2 - l * Math.cos(a), by = y2 - l * Math.sin(a);
  return `${x2},${y2} ${bx + w * Math.sin(a)},${by - w * Math.cos(a)} ${bx - w * Math.sin(a)},${by + w * Math.cos(a)}`;
}
function Box({ n, style }: { n: GNode; style?: React.CSSProperties }) {
  return <div className={`bt-gnode bt-c-${n.c}`} style={style}><b>{n.t}</b>{n.lines.map((l) => <span key={l}>{l}</span>)}</div>;
}
function SystemGraph() {
  const boxRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(GW);
  useLayoutEffect(() => {
    const el = boxRef.current; if (!el) return;
    const fit = () => setW(el.clientWidth);
    fit();
    if (typeof ResizeObserver === "undefined") { window.addEventListener("resize", fit); return () => window.removeEventListener("resize", fit); }
    const ro = new ResizeObserver(fit); ro.observe(el); return () => ro.disconnect();
  }, []);
  const byK = Object.fromEntries(GN.map((n) => [n.k, n]));
  if (w < 680) return (
    <div ref={boxRef} className="bt-graph-col" aria-label="The system, part by part">
      {PHONE_CHAIN.map(([k, to]) => <div key={k}><Box n={byK[k]} />{to && <small className="bt-gwire">↕ {to}</small>}</div>)}
      <div className="bt-graph-side">{PHONE_SIDE.map(([k, how]) => <div key={k}><small className="bt-gwire">{how}</small><Box n={byK[k]} /></div>)}</div>
    </div>
  );
  const scale = Math.min(1, w / GW);
  return (
    <div ref={boxRef} className="bt-graph" style={{ height: Math.round(GH * scale) }}>
      <div className="bt-graph-in" style={{ width: GW, height: GH, transform: `scale(${scale})` }}>
        <svg width={GW} height={GH} viewBox={`0 0 ${GW} ${GH}`} aria-hidden="true">
          {GL.map((l, i) => {
            const pts = l.p;
            return (
              <g key={i}>
                <polyline points={pts.map((q) => q.join(",")).join(" ")} />
                {l.ends.includes("end") && <polygon points={head(pts[pts.length - 2], pts[pts.length - 1])} />}
                {l.ends.includes("start") && <polygon points={head(pts[1], pts[0])} />}
                <text x={l.at[0]} y={l.at[1]} textAnchor={l.a ?? "middle"}>{l.t}</text>
              </g>
            );
          })}
        </svg>
        {GN.map((n) => <Box key={n.k} n={n} style={{ left: n.x, top: n.y, width: n.w, height: n.h }} />)}
      </div>
    </div>
  );
}

const TAGS = [["code", "Code"], ["rules", "Rules"], ["ai", "LLM"], ["human", "Human"]] as const;
const P5: [typeof TAGS[number][0], string][] = [
  ["human", "the person takes the photo"], ["ai", "foods read, grams estimated"], ["code", "names in one language, the numbers"],
  ["rules", "the coach's checks on the plate"], ["human", "checks the read: corrects an amount, or reads it again"], ["human", "Ate it"], ["code", "saved to the day"],
];
const TAG_NAME = Object.fromEntries(TAGS) as Record<string, string>;


// Books by Milan: one email when Worth Eating or Worth Living is out, nothing else
// How the work runs (0.2.5+r12, canvas board B, B8, Milan 12 October 2026): three loops through Worth Building's six
// decisions. Loop 1 PlateMate, the Product Faculty capstone (the course runs four of the six); loop 2 Chef Mealan in full;
// loop 3 now. Plain English: the question, the record, the decision, the verdict, what was carried forward.
const WB_LOOP1: [string, string, string][] = [
  ["Direction", "Not in course", "The course starts at Discovery. Direction is Milan's own addition."],
  ["Discovery", "Proceed", "Coached clients who follow a nutrition plan. A journey map with evidence from five channels. The deepest pain: the day the plan breaks, and the overeating that often follows."],
  ["Design", "Proceed", "An AI agent for that day. After an off-plan snack or a surprise dinner, the agent re-plans the rest of the day into 2 or 3 options, with the math shown. A person decides. The code does the math. The AI writes the words. A safety check runs first."],
  ["Develop", "Ready", "Built in Claude Code as one file. Six eval cases, each judged by a person against the expected result, plus a safety test with new phrasing. All data is invented."],
  ["Deploy", "Limit", "A live demo with invented clients. It runs only the prepared cases, and each visitor brings their own AI key. Good for the course, not for real users."],
  ["Delta", "Not in course", "Milan's own review: the idea holds, but a demo is not a product. Next: a real app for real users, through all six decisions."],
];
const WB_LOOP2: { n: string; when: string; q: string; d: string; r: string; v: string; vt: string; c: string }[] = [
  { n: "Direction", when: "late August", q: "Who is the app for, and what should change for them?",
    d: "Turn PlateMate's evidence into a real app for real users. The first focus: in the shop or at home, is this food really high in protein, or is the label only marketing? Help people decide in that moment.",
    r: "Direction v1", v: "Set", vt: "clear enough to test.",
    c: "One question to test: does one honest number, at the moment of choice, change what people buy and eat?" },
  { n: "Discovery", when: "late August to early September", q: "Is the problem real, and for whom? This step looks for evidence. It does not pick a solution yet.",
    d: "Yes, for people who already follow a plan. The evidence: intro and discovery calls about healthy meals and fake high protein meals, PlateMate's journey map, Milan's coaching, and a scan of other apps.",
    r: "call notes and the evidence list", v: "Proceed", vt: "build a food scanner as the test tool.",
    c: "The number to show: protein density, the grams of protein in 100 calories. A log records what people do." },
  { n: "Design", when: "September", q: "What will the app do, and who does each part: a person, the code, or AI?",
    d: "Scan a barcode or a label, or type the numbers in. The app shows the protein density and how the food fits the person's numbers. Accounts link a person to a coach, who sets the goal. The code does the math. AI reads the labels.",
    r: "screen designs on the canvas", v: "Proceed", vt: "start building.",
    c: "The screens, and a clear owner for each part." },
  { n: "Develop", when: "September", q: "How do we build the app safely? The safety rules live in the code, not only in the AI's instructions.",
    d: "Google sign in. Adults only. If someone mentions a health risk, the chat gives a fixed, safe answer.",
    r: "the changelog, one version per release", v: "Ready", vt: "for friends and family.",
    c: "A working app with accounts and the safety rules in the code." },
  { n: "Deploy", when: "30 September", q: "Who can use the app, what may the app do for them, who is responsible, and what do we watch?",
    d: "Live on chefmealan.com. A closed pilot: people sign in and need a code from a coach. Three testers. Changes went straight to live, which was fine while the users were friends and family.",
    r: "the live app and the pilot log", v: "Limit", vt: "a closed pilot, by invite only.",
    c: "Real use, and notes from three testers." },
  { n: "Delta", when: "early October", q: "What really changed for the users? We only claim what the numbers show.",
    d: "Testing showed a gap. The customers train, and their focus is protein. To be fully useful, the app needs their training plan. The scanner and the calculations held up: they measure a food fast and show the best fit.",
    r: "notes from the testers", v: "Mixed", vt: "the scanner and the numbers are a strong base. Without the training plan, the app is not complete.",
    c: "Back to Direction. Direction v2: build on the scanner and the numbers, and add the training plan. This started loop 3." },
];
const WB_LOOP3: [string, string, string][] = [
  ["Direction", "Set", "Direction v2: people who train and focus on protein. Chef Mealan joins their training plan, so they can support their gym plan and thrive at work. The scanner and the numbers from loop 2 are the base."],
  ["Discovery", "Proceed", "The gap from loop 2 testing: without the training plan, the app is not complete."],
  ["Design", "Proceed", "Four screens with one job each: Today, Plan, Plate, Recipes. Training days set the numbers. More foods for cooking at home. The code handles the plan. AI helps when the day breaks."],
  ["Develop", "Proceed", "Version 0.2, releases 0.2.0 to 0.2.131."],
  ["Deploy", "Proceed", "Each release goes to a preview first, like staging in a product team. Then the release goes live. One command undoes a release."],
  ["Delta", "Next", "A counter for the days people follow their plan. No claim before the numbers exist. Carried into loop 4."],
];
function LoopStrip({ title, sub, rows, live }: { title: string; sub: React.ReactNode; rows: [string, string, string][]; live?: boolean }) {
  return (
    <section className={`bt-loop${live ? " live" : ""}`}>
      <h3>{title}</h3>
      <small>{sub}</small>
      {rows.map(([n, v, t]) => (
        <div key={n}>
          <div className="bt-loop-row"><b>{n}</b><span className={`bt-v${v === "Now" ? " now" : v === "Next" || v === "Not in course" ? " off" : ""}`}>{v}</span><span>{t}</span></div>
          {live && n === "Deploy" && <div className="bt-pipe" aria-label="Build, preview, live, roll back"><i>Build</i><i className="on">Preview</i><i>Live</i><i className="back">↩ Roll back</i></div>}
        </div>
      ))}
    </section>
  );
}

function Notify() {
  const started = useRef(Date.now());
  const [books, setBooks] = useState<string[]>(["worth-eating"]);
  const [email, setEmail] = useState("");
  const [trap, setTrap] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [err, setErr] = useState("");
  const flip = (b: string) => setBooks((x) => (x.includes(b) ? x.filter((y) => y !== b) : [...x, b]));
  async function send() {
    setErr(""); setState("sending");
    try {
      const r = await fetch("/api/book-notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, books, website: trap, elapsed: Date.now() - started.current }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Couldn't send. Please write to hello@chefmealan.com.");
      setState("sent");
    } catch (e: any) { setErr(e.message); setState("idle"); }
  }
  if (state === "sent") return <div className="bt-notify bt-sent"><Check size={20} /> Thanks. One email goes to {email} when a book you picked is out.</div>;
  return (
    <div className="bt-notify"><b>Tell me when the books are out</b>
      <div className="bt-chips">{([["worth-eating", "Worth Eating"], ["worth-living", "Worth Living"]] as const).map(([k, l]) => (
        <button key={k} type="button" className={`bt-chip ${books.includes(k) ? "on" : ""}`} aria-pressed={books.includes(k)} onClick={() => flip(k)}>{books.includes(k) ? "✓ " : ""}{l}</button>
      ))}</div>
      <div className="bt-row">
        <input placeholder="Email" aria-label="Email" type="email" autoComplete="email" maxLength={200} value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="bt-btn" disabled={state === "sending" || !email.includes("@") || books.length === 0} onClick={send}>{state === "sending" ? "Sending…" : "Notify me"}</button>
      </div>
      {/* only bots fill this */}
      <input className="l-trap" tabIndex={-1} autoComplete="off" aria-hidden="true" value={trap} onChange={(e) => setTrap(e.target.value)} name="website" />
      {err && <small className="bt-err">{err}</small>}
      <small>One email when a book is out. Nothing else.</small>
    </div>
  );
}

export function BuiltScreen() {
  const [video, setVideo] = useState(false);
  useEffect(() => { hit("built_visit"); }, []);
  useEffect(() => { document.title = "How Chef Mealan is built"; if (location.hash === "#books") setTimeout(() => document.getElementById("books")?.scrollIntoView(), 200); }, []);
  const F = BUILT_FACTS;
  return (
    <div className="bt">
      <header className="l-top">
        <a className="l-brand" href="/" style={{ textDecoration: "none", color: "inherit" }}><Mark size={30} color="var(--brand)" /><b>{APP_NAME}</b></a>
        <a className="bt-home" href="/">Home</a>
      </header>
      <span className="bt-eyebrow">How Chef Mealan is built</span>
      <h1>One product manager, one AI, three beta testers</h1>
      <p className="bt-lead">Chef Mealan helps people live their nutrition plan: at the shelf, at home, with a coach. Milan Stancevic, a senior product manager with 20 years in B2B software and a certified coach, builds it with Claude as the engineer and tests it with three beta testers, one of them a coach. Every decision is drawn before it is coded, every release is tested before it is promoted, and nothing the AI reads counts before a person checks it.</p>
      <div className="bt-facts">
        <span>Live<small>since {day(F.liveSince)}, version {F.version} today</small></span>
        <span>{F.releases} releases<small>since {dayMonth(F.numberedSince)}, about {F.perDay} a day</small></span>
        <span>{F.unitTests} · {F.walkthroughs}<small>unit tests · browser walkthroughs</small></span>
        <span>{F.evalCases} eval cases<small>{F.evalSets} sets, human labels and a judge</small></span>
        <span>3 beta testers<small>one of them a coach; more are joining</small></span>
      </div>
      <div className="bt-actions">
        <a className="bt-btn" href="/#try">Try it: the calculator on the home page</a>
        <button type="button" className="bt-btn bt-btn-line" aria-expanded={video} onClick={() => setVideo((v) => !v)}>{video ? "Close the video" : "See it work"}</button>
      </div>
      {/* BP1 v5 rows 7 and 8 (0.3.52): seven home page clips recorded again on the app as it is, joined by
          scripts/record-built-video.cjs: the Plate, Recipes, Cook mode, a coach's clients, Explorer, Scan a label, Photo of my meal */}
      {video && <div className="l-moments bt-video"><DayVideo src="/built/see-it-work.mp4" poster="/built/see-it-work.webp" big label="The app at work: the Plate, recipes, cook mode, a coach's clients, Explorer, a label scanned and a photo of a meal" /></div>}

      <h2>The system</h2>
      <p className="bt-sub">What runs where. The phone does the arithmetic and keeps the data; the server holds the rules and the key; the model reads and talks; a human checks.</p>
      <SystemGraph />
      <div className="bt-tags">{TAGS.map(([k, t]) => <span key={k} className={`bt-tagpill bt-c-${k}`}>{t}</span>)}</div>
      <p className="bt-note">Code is deterministic and tested. Rules are the coach's rules written as code. LLM is a Gemini call, checked by evals. Human is a person or the coach: acting, or checking what the machine produced.</p>

      <h2>One path, end to end: Photo of my meal</h2>
      <p className="bt-sub">Eighteen such paths are drawn, eleven for a person and seven for a coach. This is the one with the most AI in it.</p>
      <div className="bt-path">
        {P5.map(([k, t], i) => <span key={i} className={`bt-step bt-c-${k}`}><b>{TAG_NAME[k]}</b> {t}</span>)}
        <p>Nothing the model read counts before the person's tap. The read is measured: foods found, grams within range, kcal within 20 %, on weighed plates. A wrong read becomes a new eval case.</p>
      </div>

      <h2>How a change is made</h2>
      <p className="bt-sub">The same five steps for every change, big or small. No code before the drawing is approved.</p>
      <div className="bt-flow"><span>Brainstorm</span><i>→</i><span>Draw: a board, now and new</span><i>→</i><span>Go: code on a branch</span><i>→</i><span>{F.unitTests} tests, {F.walkthroughs} walkthroughs</span><i>→</i><span>Preview, then promote to production</span></div>
      <div className="bt-thumbs">
        <figure><img src="/built/board-cooking.webp" alt="A design board: cooking you can find, now and new" width={760} height={637} loading="lazy" /><figcaption><b>A board.</b> Cooking by voice existed and nobody found it. Now and new, screen by screen, drawn before a line of code.</figcaption></figure>
        <figure><img src="/built/board-clients.webp" alt="A design board: Clients, the coach's sixth tab" width={760} height={637} loading="lazy" /><figcaption><b>Another.</b> A coach's clients became a tab of their own, and each client's page holds everything about them.</figcaption></figure>
        <figure><img src="/built/kanban.webp" alt="The Kanban: To do (Now, Next, Later), In progress, Done" width={760} height={561} loading="lazy" /><figcaption><b>The Kanban.</b> Now, Next, Later; a card moves right only when its step is done. Done is the last seven versions.</figcaption></figure>
      </div>

      <h2>How we know it works</h2>
      <div className="bt-two">
        <div className="bt-checks">
          <table>
            <thead><tr><th>Check</th><th>What</th><th>When</th></tr></thead>
            <tbody>
              <tr><td><b>Unit tests</b> {F.unitTests}</td><td>the calculator, the rules, the names</td><td>every push</td></tr>
              <tr><td><b>Walkthroughs</b> {F.walkthroughs}</td><td>a real browser drives every story</td><td>every release, kept</td></tr>
              <tr><td><b>Foundations</b></td><td>colours, sizes, 44 px targets</td><td>every release</td></tr>
              <tr><td><b>Evals</b> {F.evalCases}</td><td>numbers, swaps, photo advice, chat, plate questions, the photo read</td><td>the code ones every push; the model ones before a release</td></tr>
              <tr><td><b>The judge</b></td><td>a second model grades the first; trusted where it agrees with the coach 8 of 10</td><td>per run</td></tr>
            </tbody>
          </table>
        </div>
        <div className="bt-cards bt-loopcard"><div><b>The loop</b><p>A fail gets a name. The prompt or the code is fixed. The fail becomes a case. The run goes again. The method is Product Faculty's AI Build Labs, applied per carrier: the numbers are code and get no judge; the model's words get a human label and a judge.</p><p><b className="bt-small">Open today:</b> model evals on every push, and a trace per AI call to read when a case fails.</p></div></div>
      </div>

      <h2>The decisions, in loops</h2>
      <p className="bt-sub">Chef Mealan is built with <a href="#books">Worth Building</a>, Milan's product playbook: six decisions, Direction to Delta, run again whenever the evidence says so. Loop 1, July: the capstone, a prototype. Loop 2, August to October: a real app for real users. Loop 3, October: version 0.2, training and the plan. <b>Loop 4, now:</b> version 0.3, the home page, recipes and cooking, the coach's clients, setup that never locks.</p>
      <details className="bt-loops">
        <summary>Loops 1 to 3, in full: what was decided and what carried forward</summary>
        <LoopStrip title="Loop 1: PlateMate, July to early August" rows={WB_LOOP1}
          sub={<>Done. Milan's capstone for Product Faculty's AI product management certification, built in Claude Code. The course runs four of the six decisions: Discovery, Design, Develop, Deploy. <a href="https://mistancevic.github.io/platemate/" target="_blank" rel="noreferrer">Open PlateMate</a></>} />
        <h3 className="bt-loop-h">Loop 2: Chef Mealan, all six decisions, a real app for real users, late August to early October</h3>
        <ol className="bt-wb">
          {WB_LOOP2.map((c, i) => (
            <li key={c.n}>
              <small>Loop 2 · Decision {i + 1} · {c.when}</small><b>{c.n}</b>
              <p><i className="bt-lab">The question</i><span className="bt-q">{c.q}</span></p>
              <em>Record: {c.r}</em>
              <p><i className="bt-lab">Decision</i>{c.d}</p>
              <p><i className="bt-lab">Verdict</i><strong className="bt-v">{c.v}:</strong> {c.vt}</p>
              <p className="bt-carry"><i className="bt-lab">Carried forward</i>{c.c}</p>
            </li>
          ))}
        </ol>
        <LoopStrip title="Loop 3: training and the plan, version 0.2, October" sub="The same six decisions, run again on what loop 2 taught." rows={WB_LOOP3} />
      </details>

      <h2 id="books">Books by Milan</h2>
      <p className="bt-sub">The Worth series: how to decide what is worth the effort, in products, in food and in life.</p>
      <div className="bt-book">
        <img src="/landing/worth-building.webp" alt="Worth Building by Milan Stancevic, the cover" width={986} height={596} loading="lazy" />
        <div><span className="bt-pub">Published · Version 2.0</span><b>Worth Building</b><p>A product playbook: from "Is this worth building?" to a better product decision. Six product decisions, from Direction to Delta, with humans, code and AI each doing the part they do best. 44 pages, free PDF on GitHub.</p><a className="bt-btn bt-btn-line" href="https://github.com/mistancevic/worth-building/blob/main/Worth-Building-v2-Milan-Stancevic.pdf" target="_blank" rel="noreferrer">Read Worth Building</a></div>
      </div>
      <div className="bt-cards">
        <div><span className="bt-soon">Coming soon</span><b>Worth Eating</b><p>Learn up front how a food serves you, and let one number do the math. The thinking behind Chef Mealan.</p></div>
        <div><span className="bt-soon">Coming soon</span><b>Worth Living</b><p>The third book of the Worth series.</p></div>
      </div>
      <Notify />

      <h2>Who builds Chef Mealan</h2>
      <div className="bt-cards bt-roles">
        <div><small>Product</small><b>Senior product manager</b><p>20 years of B2B and B2B2C software. Designs and builds Chef Mealan with AI, from the first sketch to every release.</p></div>
        <div><small>Coach</small><b>Fitness and nutrition</b><p>Certified fitness and nutrition coach. Every rule in the app is one he gives his clients.</p></div>
        <div><small>Author</small><b>The Worth series</b><p>Worth Building is out. Worth Eating and Worth Living come next.</p></div>
      </div>
      <div className="bt-actions">
        <a className="bt-btn" href="mailto:hello@chefmealan.com?subject=About%20Chef%20Mealan%20and%20building%20with%20AI">Email Milan</a>
        <a className="bt-btn bt-btn-line" href="https://www.linkedin.com/in/milanstancevic" target="_blank" rel="noreferrer">Connect on LinkedIn</a>
      </div>
      <p className="bt-note">The code, the boards and the test runs are shown on request.</p>

      <footer className="l-foot">
        <span><a href="/">Home</a> · <a href="/about">Who's behind it</a> · <a href="/impressum">Impressum</a> · <a href="/privacy">Privacy</a> · <a href="/disclaimer">Disclaimer</a></span>
        <span><a href="mailto:hello@chefmealan.com">hello@chefmealan.com</a> · © 2026 Milan Stancevic · {VERSION_LINE}</span>
      </footer>
    </div>
  );
}
