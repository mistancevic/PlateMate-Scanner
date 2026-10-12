import { useEffect, useRef, useState } from "react";
import { tabOfPath } from "../back";
import { RecipeCard } from "./RecipePages";
import type { PublicRecipe } from "../recipes";
import { Check } from "lucide-react";
import { WANTS, DEMO_GOAL, BIG_BOWL, lift, smaller, alone, havesFor, PAIR_NOTES } from "../landing";
import { Mark, APP_NAME } from "../components/Mark";
import { signIn } from "../cloud";

// The front door of chefmealan.com: what it is, how it works, request a code, or sign in with one.
export function LandingScreen() {
  const formRef = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  // signed out on an app address (chefmealan.com/foods): the home page sits at chefmealan.com
  useEffect(() => { if (tabOfPath(location.pathname, ["home", "journey", "meal", "chef", "recipes", "foods", "me"])) history.replaceState(null, "", "/"); }, []);
  const go = async () => { setBusy(true); setErr(""); try { await signIn(); } catch (e: any) { setErr(e.message || "Sign-in failed."); } finally { setBusy(false); } };
  const toForm = () => formRef.current?.scrollIntoView({ behavior: "smooth" });
  // HP10: the bar at the bottom shows while neither the button under the calculator nor the form is on screen
  const ctaRef = useRef<HTMLDivElement>(null);
  // positions on every scroll, so a fast fling past the button still shows the bar
  const [sticky, setSticky] = useState(false);
  useEffect(() => {
    const check = () => {
      const c = ctaRef.current?.getBoundingClientRect(), f = formRef.current?.getBoundingClientRect();
      const past = Boolean(c && c.bottom < 0), atForm = Boolean(f && f.top < window.innerHeight && f.bottom > 0);
      setSticky(past && !atForm);
    };
    check(); window.addEventListener("scroll", check, { passive: true }); window.addEventListener("resize", check);
    return () => { window.removeEventListener("scroll", check); window.removeEventListener("resize", check); };
  }, []);
  // from a recipe page's Ask for an invite: straight to the form
  useEffect(() => { if (location.hash === "#ask") setTimeout(toForm, 300); }, []);
  // the three newest public recipes (canvas board R7); the section stays hidden while there are none
  const [recipes, setRecipes] = useState<PublicRecipe[]>([]);
  useEffect(() => { fetch("/api/recipes?limit=3").then((r) => r.json()).then((d) => setRecipes(d.recipes ?? [])).catch(() => {}); }, []);
  return (
    <div className="landing">
      <header className="l-top">
        <div className="l-brand"><Mark size={30} color="var(--brand)" /><b>{APP_NAME}</b></div>
        <span className="l-topnav"><a className="l-recipes" href="/recipes">Recipes</a><button className="link l-signin" disabled={busy} onClick={go}>Sign in</button></span>
      </header>

      {/* the top (board HP, HP5, 12 October 2026): who it is for, the promise, the calculator already answered, then the
          one way in, Try Chef Mealan; whoever has a code uses Sign in in the top bar */}
      <section className="l-hero">
        <div className="l-hero-text">
          <span className="l-kicker">For people with a nutrition plan</span>
          <h1>Live your nutrition plan, day by day.</h1>
          <p>Chef Mealan plans your meals with you. When the day surprises you or a craving comes, Chef Mealan finds the meal that still fits your numbers. You don't need a food diary, and you don't need to feel guilty.</p>
          <p className="l-try-lead">Try the calculator: pick what you crave, and see which food makes the craving fit your plan.</p>
          {err && <p className="small" style={{ color: "var(--low)" }}>{err}</p>}
        </div>
        <div>
          <TryIt />
          <div className="l-cta-block" ref={ctaRef}>
            <b className="l-cta-head">Your foods, your goal, your day.</b>
            <p>The calculator above uses one goal and six foods. Chef Mealan works with your own goal, the foods in your kitchen, and the day you're actually having.</p>
            <button className="pill pill-primary l-cta-big" onClick={toForm}>Try Chef Mealan</button>
            <small>Chef Mealan is being tested by a small group. Leave your name and email, and Coach Milan will send you a personal code.</small>
          </div>
        </div>
      </section>

      <section className="l-steps">
        <span className="l-eyebrow">How it works</span>
        <h2>Plan the day, eat by it, and get help when it changes</h2>
        <div className="l-split">
          <ol className="l-numbered">
            <li><b>Plan your day</b><p>Pick a meal for each slot: breakfast, lunch, dinner. Your own recipes, your coach's, or Chef Mealan's starters. Or let Chef Mealan fill the open slots.</p></li>
            <li><b>Eat by the plan</b><p>Today shows the next meal. One tap opens the meal, Save counts the meal. At the end of the day you see how much of the day went by the plan.</p></li>
            <li><b>When the day changes</b><p>A lunch out, a craving, a food you didn't plan. Scan the food or ask Chef Mealan, and the plate or the next meal is fitted to your numbers.</p></li>
          </ol>
          <AppVideo />
        </div>
      </section>

      {recipes.length > 0 && (
        <section className="l-kitchen">
          <span className="l-eyebrow">From the kitchen</span>
          <h2>Recipes with the numbers worked out</h2>
          <p>Coach Milan cooks the recipes, weighs them, and puts the numbers next to the photo. In the app, Chef Mealan works out how much of each food fits your goal.</p>
          <div className="rp-grid">{recipes.map((r) => <RecipeCard key={r.slug} r={r} />)}</div>
          <a className="l-all" href="/recipes">All recipes →</a>
        </section>
      )}

      <section className="l-week">
        <span className="l-eyebrow">Your week</span>
        <h2>Plan your usual week once</h2>
        <div className="l-split">
          <p>Tell Chef Mealan what a normal week looks like: the days you train, what you do, and at what time. On training days you get more food, and on rest days less, without counting anything yourself. If one day turns out different, you change only that day.</p>
          <PhoneWeek />
        </div>
      </section>

      <section className="l-coach">
        <span className="l-eyebrow">With your coach</span>
        <h2>Your coach sees the same numbers as you</h2>
        <p>You set your goal together with your coach. If one of your numbers looks wrong, for example too little food on a training day, Chef Mealan shows a note to you and to your coach. Your coach can then approve the number or suggest a change.</p>
      </section>

      {/* who's behind Chef Mealan (board B, HP11, 12 October 2026): the product role first, so nobody reads Milan as a
          full-time coach; clients still know him as Coach Milan */}
      <section className="l-week l-behind">
        <span className="l-eyebrow">Who's behind Chef Mealan</span>
        <h2>Milan Stancevic</h2>
        <div className="l-split">
          <div>
            <p className="l-role">Product builder by day.<br />Fitness and nutrition coach after hours.</p>
            <p>Milan is a senior product manager with about 20 years in software and the founder of several startups. He designs and builds Chef Mealan with AI, from the first sketch to every release.</p>
            <p>After hours, Milan is a certified fitness and nutrition coach in Munich, known to his clients as Coach Milan. He cooks every day for himself and his family, and tries every recipe and every number on himself first.</p>
            <p>Author of <a href="/built#books">Worth Building</a>. Worth Eating comes next.</p>
            <p className="l-behind-links"><a href="/built">How Chef Mealan is built</a> · <a href="/about">More about Milan</a></p>
          </div>
          <figure className="l-hero-art">
            <img className="l-chef" src="/landing/chef.webp" alt="Milan Stancevic, the person behind Chef Mealan, in a chef's hat" />
          </figure>
        </div>
      </section>

      <section className="l-built">
        <span className="l-eyebrow">How the numbers work</span>
        <h2>Numbers you can check</h2>
        <div className="l-grid l-grid-3">
          <div><b>A calculator does the math</b><p>Your daily numbers and the grams on each plate come from published formulas. You can open any number and see how Chef Mealan got to it.</p></div>
          <div><b>AI reads, a calculator decides</b><p>Chef Mealan uses AI to read labels, menus and shop shelves, and to answer you in the chat. The numbers themselves come from a calculator, not from the AI. When the AI has to guess a number from a photo, the app marks that number as an estimate.</p></div>
          <div><b>Your data stays in the EU</b><p>Your data is stored in Frankfurt, in your account. You can download all of it, or delete all of it, at any time.</p></div>
        </div>
      </section>

      <section className="l-who">
        <span className="l-eyebrow">Who it's for</span>
        <h2>For adults with a nutrition plan</h2>
        <p>Chef Mealan is for adults. Chef Mealan is not a doctor. If a medical condition decides what you eat, if you're pregnant or have diabetes, or if eating is difficult for you, Chef Mealan doesn't give advice, and tells you who to talk to instead.</p>
      </section>

      <section className="l-request" ref={formRef}>
        <h2>Try Chef Mealan</h2>
        <p>Chef Mealan is being tested by a small group right now. Most people join with a code from their coach. If you don't have a code, leave your name and email, and Coach Milan will send you a personal code.</p>
        <RequestForm />
      </section>

      <div className={`l-sticky ${sticky ? "on" : ""}`} aria-hidden={!sticky}><button className="pill pill-primary" tabIndex={sticky ? 0 : -1} onClick={toForm}>Try Chef Mealan</button></div>
      <footer className="l-foot">
        <span><a href="/about">Who's behind it</a> · <a href="/built">How Chef Mealan is built</a> · <a href="/impressum">Impressum</a> · <a href="/privacy">Privacy</a> · <a href="/disclaimer">Disclaimer</a></span>
        <span><a href="mailto:hello@chefmealan.com">hello@chefmealan.com</a> · © 2026 Milan Stancevic</span>
      </footer>
    </div>
  );
}

// How it works (board B, V1, 12 October 2026): 28 seconds of the real app, recorded by a script on a seeded day
// (scripts in the design scratchpad, recVideo.cjs). Silent, loops, plays only while on screen.
function AppVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current; if (!v || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }, { threshold: 0.3 });
    io.observe(v); return () => io.disconnect();
  }, []);
  return (
    <figure className="l-video">
      {/* MP4 first for Safari; WebM for a browser without H.264 */}
      <video ref={ref} poster="/landing/chef-mealan-app.webp" muted loop playsInline preload="metadata"
        aria-label="Chef Mealan on a phone: Today, Plan, a breakfast fitted to the target on the Plate, saved, and counted on Today">
        <source src="/landing/chef-mealan-app.mp4" type="video/mp4" />
        <source src="/landing/chef-mealan-app.webm" type="video/webm" />
      </video>
    </figure>
  );
}
// The weekly plan stays a drawing of the screen, so the drawing stays right when the app's text changes.
function PhoneWeek() {
  const rows: [string, string, string][] = [["Mon", "Strength, hard · evening", "var(--top)"], ["Tue", "Rest", "#c9d3e6"], ["Wed", "Cardio, moderate · morning", "var(--high)"], ["Thu", "Yoga, light · evening", "var(--mid)"], ["Fri", "Strength, moderate · morning", "var(--high)"], ["Sat", "Mobility, light · during the day", "var(--mid)"], ["Sun", "Rest", "#c9d3e6"]];
  return (
    <div className="l-phone-draw" aria-label="Drawing of the Weekly plan">
      <b className="l-ph-title">Weekly plan</b>
      {rows.map(([d, t, c]) => <div key={d} className="l-ph-row"><span style={{ background: c }} /><b>{d}</b><small>{t}</small></div>)}
    </div>
  );
}
// The calculator (board HP, HP5 and HP6, 12 October 2026): the app's own lift for a few fixed foods, Recomposition only,
// already answered with granola and skyr; the foods offered follow the craving, sweet or savoury; nothing is saved
function TryIt() {
  const [want, setWantState] = useState(WANTS[0].id);
  const w = WANTS.find((x) => x.id === want)!;
  const offered = havesFor(w);
  const [have, setHave] = useState(offered[0].id);
  const setWant = (id: string) => { setWantState(id); const nw = WANTS.find((x) => x.id === id)!; if (!havesFor(nw).some((h) => h.id === have)) setHave(havesFor(nw)[0].id); };
  const h = offered.find((x) => x.id === have) ?? offered[0];
  const r = lift(w, h, DEMO_GOAL.pd), a = alone(w);
  const big = r.grams > BIG_BOWL ? smaller(w, h, DEMO_GOAL.pd) : null;
  const hn = h.name.toLowerCase();
  const Pick = ({ items, on, set }: { items: { id: string; name: string }[]; on: string; set: (v: string) => void }) => (
    <div className="chip-row">{items.map((x) => <button key={x.id} type="button" className={`choice ${on === x.id ? "on" : ""}`} aria-pressed={on === x.id} onClick={() => set(x.id)}>{x.name}</button>)}</div>
  );
  return (
    <div className="l-try-box">
      <div className="setting"><small className="setting-name">You crave</small><Pick items={WANTS} on={want} set={setWant} /></div>
      <div className="setting"><small className="setting-name">You have at home</small><Pick items={offered} on={h.id} set={setHave} /></div>
      <div className="l-try-result" aria-live="polite">
        <b>Add {r.grams} g of {hn}</b>
        <div className="l-jump">
          <div className="l-jump-from"><small>{w.alone} alone</small><b>PD {a.pd.toFixed(1)}</b><small>{a.kcal} kcal, {a.protein} g protein</small></div>
          <b className="l-jump-arrow" aria-hidden="true">→</b>
          <div className="l-jump-to"><small>With the {hn}</small><b>PD {r.pd.toFixed(1)}</b><small>{r.kcal} kcal, {Math.round(r.protein)} g protein</small></div>
        </div>
        <span>{w.note} {PAIR_NOTES[`${w.id}|${h.id}`] ?? ""} The {hn} adds the protein, so the plate fits.</span>
        {big && <small>{r.total} g is a very big bowl. With {big.grams} g of {w.name.toLowerCase()} instead, {big.partner} g of {hn} is enough, {big.grams + big.partner} g in all.</small>}
      </div>
      <small className="l-try-small">Worked out for {DEMO_GOAL.name}, the goal most people pick. PD is grams of protein in 100 kcal. Nothing you pick here is saved.</small>
    </div>
  );
}

export function RequestForm({ email: presetEmail, name: presetName }: { email?: string; name?: string }) {
  const started = useRef(Date.now());
  const [name, setName] = useState(presetName ?? "");
  const [email, setEmail] = useState(presetEmail ?? "");
  const [note, setNote] = useState("");
  const [phone, setPhone] = useState("");
  const [who, setWho] = useState<"client" | "coach" | "self" | "">("");
  const [trap, setTrap] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [err, setErr] = useState("");
  async function send() {
    setErr(""); setState("sending");
    try {
      const r = await fetch("/api/access-request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, phone, note, who, coach: who === "coach", website: trap, elapsed: Date.now() - started.current }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Couldn't send. Please write to hello@chefmealan.com.");
      setState("sent");
    } catch (e: any) { setErr(e.message); setState("idle"); }
  }
  if (state === "sent") return <div className="l-sent"><Check size={22} /> Thanks, {name.split(" ")[0] || "you're on the list"}. Coach Milan will get back to you at {email}.</div>;
  return (
    <div className="l-form">
      <input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" />
      <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} autoComplete="email" />
      {/* HP12: optional, for a WhatsApp message or a text about joining */}
      <label className="l-mobile">
        <input placeholder="Mobile number, optional" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} autoComplete="tel" />
        <small>Coach Milan may message you on WhatsApp or by text about joining. The number is used for nothing else.</small>
      </label>
      <textarea placeholder="What are you after? (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={600} />
      <div className="setting"><small className="setting-name">Which fits you?</small>
        <div className="chip-row">{([["client", "I have a coach"], ["coach", "I am a coach"], ["self", "I train on my own"]] as const).map(([k, l]) => <button key={k} type="button" className={`choice ${who === k ? "on" : ""}`} aria-pressed={who === k} onClick={() => setWho(k)}>{l}</button>)}</div>
      </div>
      {/* only bots fill this */}
      <input className="l-trap" tabIndex={-1} autoComplete="off" aria-hidden="true" value={trap} onChange={(e) => setTrap(e.target.value)} name="website" />
      <button className="pill pill-primary pill-wide" disabled={state === "sending" || !name.trim() || !email.includes("@")} onClick={send}>{state === "sending" ? "Sending…" : "Send"}</button>
      {err && <p className="small" style={{ color: "var(--low)" }}>{err}</p>}
    </div>
  );
}
