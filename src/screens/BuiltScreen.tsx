import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { hit } from "../metrics";
import { Mark, APP_NAME } from "../components/Mark";

// /built, How Chef Mealan is built (canvas board B, B1 to B7, 12 October 2026): the build story for hiring managers,
// linked from the home page and the footer. Public, signed in or not. The home page stays for people with a plan.

const VERSION = String(import.meta.env.VITE_VERSION ?? "");
const FIX_ROUNDS = Number(/\+r(\d+)$/.exec(VERSION)?.[1] ?? 0);
// walkthroughs: the files in tests/flows that run on their own (not the helpers, not the paths runner): node scripts/run-flows.cjs --count
export const BUILT_FACTS = { unitTests: 279, walkthroughs: 77 };

type Tag = "code" | "ai" | "data";
type Part = { x: number; y: number; w: number; t: string; s: string; tag: Tag; what: string; why: string; built: string };
const N: Record<string, Part> = {
  app: { x: 32, y: 52, w: 218, t: "The app", s: "Today, Plan, Plate, Recipes", tag: "code", what: "Everything the person touches: the day's plan, the plate, the recipes. The app keeps a copy on the phone, so the app opens fast and works on a bad connection.", why: "Four screens, one job each: Today eats and counts, Plan decides, Plate makes, Recipes keeps.", built: "React, installed as a web app" },
  calc: { x: 32, y: 196, w: 218, t: "The calculator", s: "Your numbers, PD, the grams", tag: "code", what: "Works out the day's energy and protein from published formulas, the PD of every food and plate, and the grams that make a plate fit the target. Also picks meals to fill an open day.", why: "Numbers never come from the AI. The same input always gives the same answer, and any number can be opened to see how the number was worked out.", built: "TypeScript on the phone, covered by unit tests" },
  server: { x: 282, y: 124, w: 170, t: "The server", s: "Sign-in, members, safety", tag: "code", what: "Checks who is asking and whether the person is a member, then passes questions to the AI and food lookups to the food databases.", why: "Safety sits before the AI: for signs of disordered eating the AI steps back, and only adults use Chef Mealan.", built: "Node on Google Cloud Run, Europe" },
  ai: { x: 486, y: 52, w: 228, t: "The AI", s: "Reads labels, talks in the chat", tag: "ai", what: "Reads a label, a barcode photo or a few products in one photo, answers in the chat with the screen in mind, and suggests what to add to a plate.", why: "The AI reads and talks; the calculator decides. A number the AI guesses from a photo is marked as an estimate until the person checks the label.", built: "Google Gemini, with a fallback model" },
  food: { x: 486, y: 168, w: 228, t: "Food data", s: "Barcodes and basic foods", tag: "data", what: "A barcode goes to Open Food Facts; vegetables and fruit without a label come from a reference table of about 125 basic foods.", why: "Typing a food should be the last resort: scan, look up, then check.", built: "Open Food Facts, USDA reference values" },
  account: { x: 486, y: 268, w: 228, t: "Your account", s: "Data in Frankfurt", tag: "data", what: "Keeps the plan, the foods, the recipes and the photos in the person's account, and copies them to every phone the person signs in on.", why: "The person owns the data: one tap downloads all of it, one tap deletes all of it.", built: "Firebase sign-in with Google, Firestore in Frankfurt" },
  coach: { x: 282, y: 268, w: 170, t: "The coach", s: "Clients, goals, shared cards", tag: "data", what: "The coach sees the clients, sets or approves the goal, and reads the meals a client chooses to share.", why: "The coach sees what the client shares, never more; a flag shows only the situation and the date, never the words.", built: "The Clients screen, same app" },
};
const Q = { t: "Checked before every release", what: `Every push carries a version; preview first, then production, with a one-line rollback. ${BUILT_FACTS.unitTests} unit tests check the rules, ${BUILT_FACTS.walkthroughs} walkthroughs click through the app like a person, and model evals score the AI's answers with a judge model and the coach's labels.`, why: "Design first: every screen is drawn and approved before code, with an ID on every screen.", built: "Node test runner, Playwright, an evals page in the app" };
const E: [string, string][] = [["app", "calc"], ["app", "server"], ["server", "ai"], ["server", "food"], ["app", "account"], ["server", "account"], ["coach", "account"]];
const STEPS: { t: string; n: string[]; e: [string, string][]; p: string }[] = [
  { t: "Scan on the Plate", n: ["app"], e: [], p: "At the shop, the person opens the Plate, taps Scan and points the phone at the label of a chocolate spread." },
  { t: "The AI reads the label", n: ["app", "server", "ai"], e: [["app", "server"], ["server", "ai"]], p: "The photo goes to the server, which checks the person is a member, then asks the AI to read the energy and the protein from the label." },
  { t: "The person checks the label", n: ["app"], e: [], p: "The values come back marked as read from a photo. The person compares them with the pack and saves the food. Nothing the AI read counts before this tap." },
  { t: "The calculator fits the plate", n: ["app", "calc"], e: [["app", "calc"]], p: "Chocolate spread alone is PD 1.2. The calculator works out how much skyr lifts the plate to the day's target: 165 g for 40 g of spread." },
  { t: "Save: the meal counts", n: ["app", "account"], e: [["app", "account"]], p: "Save puts the meal on Today, marked by the plan or off the plan, and the account keeps the meal on every phone." },
  { t: "The coach sees the week", n: ["account", "coach"], e: [["coach", "account"]], p: "If the person shares the meal, the coach sees the meal at the weekly check-in, next to the day's numbers." },
];
// two layouts: side by side on a desktop, stacked on a phone
const M: Record<string, [number, number, number]> = { app: [24, 50, 152], calc: [190, 50, 152], server: [24, 186, 152], coach: [190, 186, 152], ai: [24, 330, 318], food: [24, 436, 152], account: [190, 436, 152] };
const G = { d: [[16, 28, 250, 330], [470, 28, 260, 330]], m: [[12, 28, 342, 132], [12, 310, 342, 236]] };
const PHONE = 860;
const same = (a: string, b: string) => ([p, r]: [string, string]) => (p === a && r === b) || (p === b && r === a);

function Blueprint() {
  const [mode, setMode] = useState<"parts" | "follow">("parts");
  const [sel, setSel] = useState("calc");
  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState(() => typeof window !== "undefined" && window.innerWidth < PHONE);
  useEffect(() => { const f = () => setPhone(window.innerWidth < PHONE); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  // the diagram is drawn at one size and scaled to the box, so no part sticks out on a narrow phone (0.2.5+r10)
  const [baseW, baseH] = phone ? [366, 690] : [746, 470];
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = boxRef.current; if (!el) return;
    const fit = () => setScale(Math.min(1, el.clientWidth / baseW));
    fit();
    if (typeof ResizeObserver === "undefined") { window.addEventListener("resize", fit); return () => window.removeEventListener("resize", fit); }
    const ro = new ResizeObserver(fit); ro.observe(el); return () => ro.disconnect();
  }, [baseW]);
  const [paths, setPaths] = useState<{ d: string; lit: boolean }[]>([]);
  const lit: [string, string][] = mode === "follow" ? STEPS[step].e : phone ? E.filter(([a, b]) => a === sel || b === sel) : [];
  // the lines follow the boxes as the boxes are laid out; on a phone only the lit lines show
  useLayoutEffect(() => {
    const box = (k: string) => { const e = refs.current[k]!; const x = e.offsetLeft, y = e.offsetTop, w = e.offsetWidth, h = e.offsetHeight; return { x: x + w / 2, y: y + h / 2, l: x, r: x + w, t: y, b: y + h }; };
    setPaths(E.filter(([a, b]) => !phone || lit.some(same(a, b))).map(([a, b]) => {
      const A = box(a), B = box(b); let x1, y1, x2, y2;
      if (Math.abs(A.x - B.x) > Math.abs(A.y - B.y)) { x1 = A.x < B.x ? A.r : A.l; y1 = A.y; x2 = A.x < B.x ? B.l : B.r; y2 = B.y; } else { x1 = A.x; y1 = A.y < B.y ? A.b : A.t; x2 = B.x; y2 = A.y < B.y ? B.t : B.b; }
      const mx = (x1 + x2) / 2;
      return { d: `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`, lit: lit.some(same(a, b)) };
    }));
  }, [mode, sel, step, phone]);
  const part = sel === "quality" ? Q : N[sel];
  const s = STEPS[step];
  return (
    <>
      <div className="bt-modes" role="tablist">
        {(["parts", "follow"] as const).map((m) => <button key={m} role="tab" aria-selected={mode === m} className={mode === m ? "on" : ""} onClick={() => { setMode(m); if (m === "follow") setStep(0); }}>{m === "parts" ? "The parts" : "Follow a craving"}</button>)}
      </div>
      <div className="bt-board">
        <div ref={boxRef} className={`bt-diagram ${mode === "follow" ? "follow" : ""}`} style={{ height: Math.round(baseH * scale) }}>
         <div className="bt-canvas" style={{ width: baseW, height: baseH, transform: scale < 1 ? `scale(${scale})` : undefined }}>
          <svg aria-hidden="true"><g>{paths.map((p, i) => <path key={i} className={`bt-edge ${p.lit ? "lit" : ""}`} d={p.d} />)}</g></svg>
          {(phone ? G.m : G.d).map(([x, y, w, h], i) => <div key={i} className="bt-group" style={{ left: x, top: y, width: w, height: h }}><small>{i === 0 ? "Your phone" : "Outside services"}</small></div>)}
          {Object.entries(N).map(([k, n]) => {
            const [x, y, w] = phone ? M[k] : [n.x, n.y, n.w];
            return (
              <button key={k} ref={(e) => { refs.current[k] = e; }} className={`bt-node ${mode === "parts" && sel === k ? "sel" : ""} ${mode === "follow" && s.n.includes(k) ? "lit" : ""}`}
                style={{ left: x, top: y, width: w }} onClick={() => { setMode("parts"); setSel(k); }} aria-pressed={mode === "parts" && sel === k}>
                <b>{n.t}</b><small>{n.s}</small><span className={`bt-tag bt-${n.tag}`}>{n.tag.toUpperCase()}</span>
              </button>
            );
          })}
          <button className="bt-quality" onClick={() => { setMode("parts"); setSel("quality"); }}><b>{Q.t}</b><span>{BUILT_FACTS.unitTests} unit tests · {BUILT_FACTS.walkthroughs} walkthroughs · model evals · preview, then production</span></button>
         </div>
        </div>
        <div className="bt-panel" aria-live="polite">
          {mode === "parts" ? (
            <>
              <span className="k">The part</span><h3>{part.t}</h3><p>{part.what}</p>
              <div className="bt-decision"><b>The decision</b><p>{part.why}</p></div>
              <span className="bt-builtwith"><b>Built with:</b> {part.built}</span>
              <span className="bt-hint">Tap another part, or follow a craving.</span>
            </>
          ) : (
            <>
              <span className="k">Follow a craving, step {step + 1} of {STEPS.length}</span>
              <div className="bt-steps">{STEPS.map((_, i) => <i key={i} className={i <= step ? "on" : ""} />)}</div>
              <h3>{s.t}</h3><p>{s.p}</p>
              <div className="bt-nav"><button disabled={step === 0} onClick={() => setStep(Math.max(0, step - 1))}>Back</button><button className="primary" onClick={() => setStep(step === STEPS.length - 1 ? 0 : step + 1)}>{step === STEPS.length - 1 ? "Start again" : "Next step"}</button></div>
            </>
          )}
        </div>
      </div>
      <div className="bt-legend"><span><span className="bt-tag bt-code">CODE</span>decides, the same way every time</span><span><span className="bt-tag bt-ai">AI</span>reads and talks</span><span><span className="bt-tag bt-data">DATA</span>kept and shared</span></div>
    </>
  );
}

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
  ["Develop", "Now", `Version 0.2, releases 0.2.0 to 0.2.5. Every release runs ${BUILT_FACTS.unitTests} unit tests and ${BUILT_FACTS.walkthroughs} walkthroughs.`],
  ["Deploy", "Now", "Each release goes to a preview first, like staging in a product team. Then the release goes live. One command undoes a release."],
  ["Delta", "Next", "A counter for the days people follow their plan. No claim before the numbers exist."],
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
  useEffect(() => { hit("built_visit"); }, []);
  useEffect(() => { document.title = "How Chef Mealan is built"; if (location.hash === "#books") setTimeout(() => document.getElementById("books")?.scrollIntoView(), 200); }, []);
  return (
    <div className="bt">
      <header className="l-top">
        <a className="l-brand" href="/" style={{ textDecoration: "none", color: "inherit" }}><Mark size={30} color="var(--brand)" /><b>{APP_NAME}</b></a>
        <a className="bt-home" href="/">Home</a>
      </header>
      <span className="bt-eyebrow">How Chef Mealan is built</span>
      <h1>A product built with AI, one release at a time</h1>
      <p className="bt-lead">Chef Mealan helps people live their nutrition plan. Milan Stancevic, a senior product manager and founder with about 20 years in software, designs and builds Chef Mealan with AI: the product decisions, the design, the code reviews and the tests. After hours, Milan is a certified fitness and nutrition coach.</p>
      <div className="bt-facts">
        <span>Live since<small>30 September 2026</small></span>
        <span>Version 0.2<small>6 releases and {FIX_ROUNDS} fix rounds since 11 October</small></span>
        <span>{BUILT_FACTS.unitTests} unit tests<small>and {BUILT_FACTS.walkthroughs} walkthroughs</small></span>
        <span>Model evals<small>judge model and coach labels</small></span>
      </div>

      <h2>The blueprint</h2>
      <p className="bt-sub">Tap a part to see what the part does and the decision behind the part. Or follow one craving through the whole system.</p>
      <Blueprint />

      <h2>Why Chef Mealan exists</h2>
      <p className="bt-sub">A nutrition plan works on paper and breaks on a real day: a lunch out, a craving at 9 pm, the same breakfast for the tenth time. Chef Mealan helps in five moments: living the plan, saving a day that surprises, a craving that still fits, boredom with the same food, and a food given up and missed. Versions 0.1 and 0.2 cover the first three.</p>

      <h2>Principles behind the product</h2>
      <div className="bt-cards">
        <div><b>Code decides, AI reads</b><p>The numbers come from published formulas and a calculator. The AI reads labels and talks. A guessed number is marked as an estimate.</p></div>
        <div><b>The plan is the spine</b><p>Meals are planned first, then eaten by the plan. Surprises are solved in the moment, and only surprises need the AI.</p></div>
        <div><b>Safety before features</b><p>Adults only. Consent before body data. For signs of disordered eating the AI steps back and points to help.</p></div>
        <div><b>The person owns the data</b><p>Data in Frankfurt. One tap exports all of it, one tap deletes all of it.</p></div>
      </div>

      <h2>How the work runs: the Worth Building playbook</h2>
      <p className="bt-sub">Chef Mealan is built with <a href="#books">Worth Building</a>, Milan's product playbook. The playbook has six decisions. They are not fixed stages: the evidence decides which decision comes next, even when that means going back. Each decision answers one question and keeps a record. The verdict rules are set before anyone looks at the evidence. Chef Mealan has three loops so far. Loop 1 was PlateMate, a course project that ran four of the six decisions. Loop 2 ran all six and made a real app. Loop 3 runs now. Below: loop 1 in short, loop 2 in full, and where loop 3 stands.</p>
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
      <LoopStrip live title="Loop 3: training and the plan, version 0.2, since October" sub="Now. The same six decisions, run again on what loop 2 taught." rows={WB_LOOP3} />

      <h2 id="books">Books by Milan</h2>
      <p className="bt-sub">The Worth series: how to decide what is worth the effort, in products, in food and in life.</p>
      <div className="bt-book">
        <img src="/landing/worth-building.webp" alt="Worth Building by Milan Stancevic, the cover" width={986} height={596} loading="lazy" />
        <div><span className="bt-pub">Published · Version 2.0</span><b>Worth Building</b><p>A product playbook: from "Is this worth building?" to a better product decision. Six product decisions, from Direction to Delta, with humans, code and AI each doing the part they do best. 44 pages, free PDF on GitHub.</p><a className="bt-btn" href="https://github.com/mistancevic/worth-building/blob/main/Worth-Building-v2-Milan-Stancevic.pdf" target="_blank" rel="noreferrer">Read Worth Building</a></div>
      </div>
      <div className="bt-cards">
        <div><span className="bt-soon">Coming soon</span><b>Worth Eating</b><p>Learn up front how a food serves you, and let one number do the math. The thinking behind Chef Mealan.</p></div>
        <div><span className="bt-soon">Coming soon</span><b>Worth Living</b><p>The third book of the Worth series.</p></div>
      </div>
      <Notify />

      <h2>Who builds Chef Mealan</h2>
      <p className="bt-sub"><b className="bt-role">Product builder by day. Fitness and nutrition coach after hours.</b> Milan Stancevic, based in Munich.</p>
      <div className="bt-cards bt-roles">
        <div><small>Product</small><b>Senior product manager</b><p>About 20 years in B2B and B2B2C software. Designs and builds Chef Mealan with AI, from the first sketch to every release.</p></div>
        <div><small>Founder</small><b>Startups and agencies</b><p>Founded several startups and agencies. One of the startups, an event planner app, was acquired.</p></div>
        <div><small>Coach, after hours</small><b>Fitness and nutrition</b><p>Certified fitness and nutrition coach. Cooks every day and tries every recipe and every number on himself first.</p></div>
        <div><small>Author</small><b>The Worth series</b><p>Worth Building is out. Worth Eating and Worth Living come next.</p></div>
      </div>
      <a className="bt-btn" href="https://www.linkedin.com/in/milanstancevic" target="_blank" rel="noreferrer">Milan on LinkedIn</a>

      <footer className="l-foot">
        <span><a href="/">Home</a> · <a href="/about">Who's behind it</a> · <a href="/impressum">Impressum</a> · <a href="/privacy">Privacy</a> · <a href="/disclaimer">Disclaimer</a></span>
        <span><a href="mailto:hello@chefmealan.com">hello@chefmealan.com</a> · © 2026 Milan Stancevic</span>
      </footer>
    </div>
  );
}
