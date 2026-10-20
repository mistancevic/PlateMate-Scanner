import { useEffect, useRef, useState } from "react";
import { tabOfPath } from "../back";
import { RecipeCard } from "./RecipePages";
import type { PublicRecipe } from "../recipes";
import { Check } from "lucide-react";
import { WANTS, DEMO_GOAL, BIG_BOWL, lift, smaller, alone, havesFor, PAIR_NOTES, startAmounts, describe, type Amounts } from "../landing";
import { Mark, APP_NAME } from "../components/Mark";
import { signIn } from "../cloud";
import { hit } from "../metrics";

// The front door of chefmealan.com: what it is, how it works, request a code, or sign in with one.
export function LandingScreen() {
  const formRef = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  // signed out on an app address (chefmealan.com/foods): the home page sits at chefmealan.com
  useEffect(() => { if (tabOfPath(location.pathname, ["home", "journey", "meal", "chef", "recipes", "foods", "me"])) history.replaceState(null, "", "/"); }, []);
  const go = async () => { setBusy(true); setErr(""); try { await signIn(); } catch (e: any) { setErr(e.message || "Sign-in failed."); } finally { setBusy(false); } };
  // home page counts (0.2.5+r17, board M): a visit, a Try tap; no cookie, no visitor id
  useEffect(() => { hit("hp_visit"); }, []);
  const toForm = () => { hit("hp_try"); formRef.current?.scrollIntoView({ behavior: "smooth" }); };
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
  // from a recipe page's Try Chef Mealan: straight to the form
  useEffect(() => { if (location.hash === "#ask") setTimeout(toForm, 300); }, []);
  // the three newest public recipes (canvas board R7); the section stays hidden while there are none
  const [recipes, setRecipes] = useState<PublicRecipe[]>([]);
  useEffect(() => { fetch("/api/recipes?limit=3").then((r) => r.json()).then((d) => setRecipes(d.recipes ?? [])).catch(() => {}); }, []);
  return (
    <div className="landing">
      <header className="l-top">
        <div className="l-brand"><Mark size={30} color="var(--brand)" /><b>{APP_NAME}</b></div>
        <span className="l-topnav"><a className="l-recipes" href="/recipes">Recipes</a><button className="pill pill-small l-signin" disabled={busy} onClick={go}>Sign in</button></span>
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

      {/* R23 (0.2.51, board RS22): what Chef Mealan does for you, five moments of the day, each with a short clip of the real
          app recorded on test data; all five joined on top. In place of How it works and Your week. */}
      <section className="l-steps l-moments">
        <span className="l-eyebrow">In your day</span>
        <h2>What Chef Mealan does for you</h2>
        <DayVideo src="/landing/day-all.mp4" poster="/landing/day-all.webp" big label="All five, a minute and a half: Today, Plan, a craving, a recipe from a link, and how a meal carried you" />
        {MOMENTS.map((m, k) => (
          <div className="l-moment" key={m.title}>
            <span className="l-eyebrow">{m.when}</span>
            <h3>{m.title}</h3>
            <p>{m.line}</p>
            <DayVideo src={`/landing/day-${k + 1}.mp4`} poster={`/landing/day-${k + 1}.webp`} label={`${m.title}: ${m.line}`} />
          </div>
        ))}
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
            <p className="l-behind-links"><a href="/built">How Chef Mealan is built ›</a><a href="/about">More about Milan ›</a></p>
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

// R23 (0.2.51, board RS22): the moments and their clips, recorded by a script on a seeded day (recordClips.cjs in the design
// scratchpad, board RS23). Silent, loops, plays only while on screen; a still frame until then.
const MOMENTS = [
  { when: "Every day", title: "Eat by your plan today", line: "Today shows the next meal. One tap logs it as planned, and the day counts against the plan." },
  { when: "Sunday evening", title: "Plan your week in minutes", line: "Chef Mealan fills the open slots with your meals. Swipe one to swap it, or to skip it." },
  { when: "When a craving hits", title: "Make what you crave fit", line: "Type chocolate PD 7+. Your DaaM, Dessert as a Meal, comes up, fitted to your target." },
  { when: "When you find a recipe", title: "Bring it in", line: "Paste a link or a screenshot. The foods, one portion's numbers and the PD are worked out." },
  { when: "After a meal", title: "Learn what works for you", line: "Thirty minutes after a meal: how did it carry you? Two answers that agree, and Chef Mealan picks with them." },
];
export function DayVideo({ src, poster, label, big }: { src: string; poster: string; label: string; big?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current; if (!v || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }, { threshold: 0.3 });
    io.observe(v); return () => io.disconnect();
  }, []);
  return (
    <figure className={`l-video ${big ? "l-video-all" : "l-video-one"}`}>
      <video ref={ref} poster={poster} muted loop playsInline preload="metadata" aria-label={label}>
        {/* MP4 first for Safari; WebM for a browser without H.264 */}
        <source src={src} type="video/mp4" />
        <source src={src.replace(/\.mp4$/, ".webm")} type="video/webm" />
      </video>
    </figure>
  );
}
function TryIt() {
  // the calculator used: counted once per visit, at the first pick or step
  const counted = useRef(false);
  const used = () => { if (!counted.current) { counted.current = true; hit("hp_calc"); } };
  const [want, setWantState] = useState(WANTS[0].id);
  const w = WANTS.find((x) => x.id === want)!;
  const offered = havesFor(w);
  const [have, setHave] = useState(offered[0].id);
  // HP68: the grams of the craving, and the milk with granola, each with a stepper; a new craving starts from its usual amount
  const [amt, setAmt] = useState<Amounts>(startAmounts(WANTS[0]));
  const setWant = (id: string) => { setWantState(id); const nw = WANTS.find((x) => x.id === id)!; setAmt(startAmounts(nw)); if (!havesFor(nw).some((h) => h.id === have)) setHave(havesFor(nw)[0].id); };
  const h = offered.find((x) => x.id === have) ?? offered[0];
  const r = lift(w, h, DEMO_GOAL.pd, amt), a = alone(w, amt);
  const big = r.grams > BIG_BOWL ? smaller(w, h, DEMO_GOAL.pd, amt) : null;
  const hn = h.name.toLowerCase(), what = w.of ?? w.name.toLowerCase();
  const Pick = ({ items, on, set }: { items: { id: string; name: string }[]; on: string; set: (v: string) => void }) => (
    <div className="chip-row">{items.map((x) => <button key={x.id} type="button" className={`choice ${on === x.id ? "on" : ""}`} aria-pressed={on === x.id} onClick={() => { used(); set(x.id); }}>{x.name}</button>)}</div>
  );
  const Step = ({ name, value, unit, step, min, max, set }: { name: string; value: number; unit: string; step: number; min: number; max: number; set: (v: number) => void }) => (
    <div className="l-amount">
      <span>{name}</span>
      <span className="rp-step">
        <button type="button" aria-label={`${step} ${unit} less ${name.toLowerCase()}`} disabled={value - step < min} onClick={() => { used(); set(value - step); }}>−</button>
        <b>{value} {unit}</b>
        <button type="button" aria-label={`${step} ${unit} more ${name.toLowerCase()}`} disabled={value + step > max} onClick={() => { used(); set(value + step); }}>+</button>
      </span>
    </div>
  );
  return (
    <div className="l-try-box">
      <div className="setting">
        <small className="setting-name">You crave</small><Pick items={WANTS} on={want} set={setWant} />
        <Step name={what[0].toUpperCase() + what.slice(1)} value={amt.grams} unit="g" step={w.step ?? 10} min={w.min ?? 10} max={w.max ?? 200} set={(g) => setAmt({ ...amt, grams: g })} />
        {w.milk && <Step name={w.milk.name[0].toUpperCase() + w.milk.name.slice(1)} value={amt.ml} unit="ml" step={w.milk.step} min={0} max={w.milk.max} set={(ml) => setAmt({ ...amt, ml })} />}
      </div>
      <div className="setting"><small className="setting-name">You have at home</small><Pick items={offered} on={h.id} set={setHave} /></div>
      {/* HP68: what PD is, before the first PD number a cold reader meets */}
      <div className="l-pd">
        <b>PD means protein density</b>
        <p>PD is grams of protein in 100 kcal. {DEMO_GOAL.name} aims for about PD {DEMO_GOAL.pd} at every meal. Below that, the meal is mostly energy.</p>
      </div>
      <div className="l-try-result" aria-live="polite">
        <b>{r.grams > 0 ? `Add ${r.grams} g of ${hn}` : "This already fits"}</b>
        <div className="l-jump">
          <div className="l-jump-from"><small>{describe(w, amt)}</small><b>PD {a.pd.toFixed(1)}</b><small>{a.kcal} kcal, {a.protein} g protein</small></div>
          <b className="l-jump-arrow" aria-hidden="true">→</b>
          <div className="l-jump-to"><small>With the {hn}</small><b>PD {r.pd.toFixed(1)}</b><small>{r.kcal} kcal, {Math.round(r.protein)} g protein</small></div>
        </div>
        <span>{w.note} {PAIR_NOTES[`${w.id}|${h.id}`] ?? ""} The {hn} adds the protein, so the plate fits.</span>
        {big && <small>{r.total} g is a very big bowl. With {big.grams} g of {what} instead, {big.partner} g of {hn} is enough.</small>}
      </div>
      <small className="l-try-small">A simplified version of Chef Mealan: one goal, six cravings and typical values from food labels. Nothing you pick here is saved.</small>
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
