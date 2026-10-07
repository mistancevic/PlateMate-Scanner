import { useRef, useState } from "react";
import { Check } from "lucide-react";
import { WANTS, HAVES, DEMO_GOAL, BIG_BOWL, lift, smaller } from "../landing";
import { Mark, APP_NAME } from "../components/Mark";
import { signIn } from "../cloud";

// The front door of chefmealan.com: what it is, how it works, request a code, or sign in with one.
export function LandingScreen() {
  const formRef = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const go = async () => { setBusy(true); setErr(""); try { await signIn(); } catch (e: any) { setErr(e.message || "Sign-in failed."); } finally { setBusy(false); } };
  const toForm = () => formRef.current?.scrollIntoView({ behavior: "smooth" });
  return (
    <div className="landing">
      <header className="l-top">
        <div className="l-brand"><Mark size={30} color="var(--brand)" /><b>{APP_NAME}</b></div>
        <button className="link l-signin" disabled={busy} onClick={go}>Sign in</button>
      </header>

      <section className="l-hero">
        <div className="l-hero-text">
          <span className="l-kicker">Closed pilot</span>
          <h1>Eat what you crave. Chef Mealan tells you how much.</h1>
          <p>Say you want chocolate spread, and you have skyr at home. Chef Mealan tells you how many grams of each to eat, so the plate fits your goal. You don't need a food diary, and you don't need to feel guilty.</p>
          <div className="l-cta">
            <button className="pill pill-primary" disabled={busy} onClick={go}>I have a code</button>
            <button className="pill" onClick={toForm}>Ask for an invite</button>
          </div>
          {err && <p className="small" style={{ color: "var(--low)" }}>{err}</p>}
        </div>
        <figure className="l-hero-art">
          <img className="l-chef" src="/landing/chef.webp" alt="Coach Milan, the person behind Chef Mealan, in a chef's hat" />
          <figcaption>Coach Milan, the person behind Chef Mealan</figcaption>
        </figure>
      </section>

      <section className="l-steps">
        <span className="l-eyebrow">How it works</span>
        <h2>Three steps, while you decide what to eat</h2>
        <div className="l-split">
          <ol className="l-numbered">
            <li><b>Tell Chef Mealan what you want to eat</b><p>Scan the barcode, take a photo of the label, or type the name. The foods you add stay in your list for next time.</p></li>
            <li><b>Chef Mealan fits the plate to your day</b><p>Chef Mealan knows whether today is a training day or a rest day, and works out the grams so the plate matches your numbers for the day. A calculator does the math, so nothing is guessed.</p></li>
            <li><b>Eat, then say how the plate was</b><p>One tap: great, good, or not really. Only you see your answers, unless you share them with your coach.</p></li>
          </ol>
          <PhoneToday />
        </div>
      </section>

      <section className="l-week">
        <span className="l-eyebrow">Your week</span>
        <h2>Plan your usual week once</h2>
        <div className="l-split">
          <p>Tell Chef Mealan what a normal week looks like: the days you train, what you do, and at what time. On training days you get more food, and on rest days less, without counting anything yourself. If one day turns out different, you change only that day.</p>
          <PhoneWeek />
        </div>
      </section>

      <TryIt />

      <section className="l-coach">
        <span className="l-eyebrow">With your coach</span>
        <h2>Your coach sees the same numbers as you</h2>
        <p>You set your goal together with your coach. If one of your numbers looks wrong, for example too little food on a training day, Chef Mealan shows a note to you and to your coach. Your coach can then approve the number or suggest a change.</p>
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
        <h2>For people with a goal who choose their own food</h2>
        <p>Chef Mealan is for adults. Chef Mealan is not a doctor. If a medical condition decides what you eat, if you're pregnant or have diabetes, or if eating is difficult for you, Chef Mealan doesn't give advice, and tells you who to talk to instead.</p>
      </section>

      <section className="l-request" ref={formRef}>
        <h2>Ask for an invite</h2>
        <p>Chef Mealan is a closed pilot. Most people join with a code from their coach. If you don't have a code, leave your name and email, and Coach Milan will get back to you.</p>
        <RequestForm />
      </section>

      <footer className="l-foot">
        <span><a href="/about">Who's behind it</a> · <a href="/impressum">Impressum</a> · <a href="/privacy">Privacy</a> · <a href="/disclaimer">Disclaimer</a></span>
        <span><a href="mailto:hello@chefmealan.com">hello@chefmealan.com</a> · © 2026 Milan Stancevic</span>
      </footer>
    </div>
  );
}

// The phones are drawings of the screens, not screenshots, so they stay right when the app's text changes.
function PhoneToday() {
  return (
    <div className="l-phone-draw" aria-label="Drawing of the Today screen">
      <b className="l-ph-title">Today</b>
      <div className="l-ph-card">
        <small>YOUR GOAL · SET BY COACH MILAN</small>
        <b className="l-ph-goal">Maintain ›</b>
        <div className="l-ph-nums"><span><b>6.2</b><small>PD target</small></span><span><b>2,900</b><small>kcal today</small></span><span><b>180</b><small>g protein</small></span></div>
        <small className="l-ph-day">Monday: strength, hard, in the evening.</small>
      </div>
      <span className="l-ph-btn primary">I'm craving something</span>
      <span className="l-ph-btn">Scan</span>
    </div>
  );
}
function PhoneWeek() {
  const rows: [string, string, string][] = [["Mon", "Strength, hard · evening", "var(--top)"], ["Tue", "Rest", "#c9d3e6"], ["Wed", "Cardio, moderate · morning", "var(--high)"], ["Thu", "Yoga, light · evening", "var(--mid)"], ["Fri", "Strength, moderate · morning", "var(--high)"], ["Sat", "Mobility, light · during the day", "var(--mid)"], ["Sun", "Rest", "#c9d3e6"]];
  return (
    <div className="l-phone-draw" aria-label="Drawing of the Weekly plan">
      <b className="l-ph-title">Weekly plan</b>
      {rows.map(([d, t, c]) => <div key={d} className="l-ph-row"><span style={{ background: c }} /><b>{d}</b><small>{t}</small></div>)}
    </div>
  );
}
// Try it: the app's own lift for a few fixed foods, for Recomposition only; nothing is saved
function TryIt() {
  const [want, setWant] = useState(WANTS[0].id), [have, setHave] = useState(HAVES[0].id);
  const w = WANTS.find((x) => x.id === want)!, h = HAVES.find((x) => x.id === have)!;
  const r = lift(w, h, DEMO_GOAL.pd);
  const big = r.grams > BIG_BOWL ? smaller(w, h, DEMO_GOAL.pd) : null;
  const wn = w.name.toLowerCase(), hn = h.name.toLowerCase();
  const Pick = ({ items, on, set }: { items: { id: string; name: string; grams?: number }[]; on: string; set: (v: string) => void }) => (
    <div className="chip-row">{items.map((x) => <button key={x.id} type="button" className={`choice ${on === x.id ? "on" : ""}`} aria-pressed={on === x.id} onClick={() => set(x.id)}>{x.name}{x.grams ? `, ${x.grams} g` : ""}</button>)}</div>
  );
  return (
    <section className="l-try">
      <span className="l-eyebrow">Try it</span>
      <h2>You crave {w.amount}. How much {hn} makes the plate fit?</h2>
      <p>The answer is worked out for Recomposition, the goal most people pick: lose fat and build muscle at the same time. The page uses the same math as the app, and nothing you pick here is saved.</p>
      <div className="l-try-box">
        <div className="setting"><small className="setting-name">You crave</small><Pick items={WANTS} on={want} set={setWant} /></div>
        <div className="setting"><small className="setting-name">You have at home</small><Pick items={HAVES} on={have} set={setHave} /></div>
        <div className="l-try-result" aria-live="polite">
          <b>Add {r.grams} g of {hn}</b>
          <span>That's {r.total} g on the plate in all: {w.amount} and {r.grams} g of {hn}. Together it's {r.kcal} kcal and {Math.round(r.protein)} g of protein, a PD of {r.pd}, a typical target for Recomposition.</span>
          {big ? <small>That's a very big bowl. With {big.grams} g of {wn} instead, {big.partner} g of {hn} is enough, {big.grams + big.partner} g in all.</small>
               : <small>On its own, {w.alone} very little protein. The {hn} adds the protein, so the whole plate fits.</small>}
        </div>
        <div className="l-pd">
          <b>What is PD?</b>
          <p>PD stands for protein density: how many grams of protein a food or a plate gives you for every 100 kcal. The higher the PD, the more protein you get for the same calories. Chef Mealan gives you a PD target for each day, and fits every plate to it.</p>
        </div>
      </div>
    </section>
  );
}

export function RequestForm({ email: presetEmail, name: presetName }: { email?: string; name?: string }) {
  const started = useRef(Date.now());
  const [name, setName] = useState(presetName ?? "");
  const [email, setEmail] = useState(presetEmail ?? "");
  const [note, setNote] = useState("");
  const [who, setWho] = useState<"client" | "coach" | "self" | "">("");
  const [trap, setTrap] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [err, setErr] = useState("");
  async function send() {
    setErr(""); setState("sending");
    try {
      const r = await fetch("/api/access-request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, note, who, coach: who === "coach", website: trap, elapsed: Date.now() - started.current }) });
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
