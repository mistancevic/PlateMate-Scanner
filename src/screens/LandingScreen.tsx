import { useRef, useState } from "react";
import { ChefHat, ScanLine, Scale, MessageCircle, Lock, Check } from "lucide-react";
import { Mark, APP_NAME } from "../components/Mark";
import { signIn } from "../cloud";

// The front door of chefmealan.com: what it is, how it works, request a code, or sign in with one.
export function LandingScreen() {
  const formRef = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const go = async () => { setBusy(true); setErr(""); try { await signIn(); } catch (e: any) { setErr(e.message || "Sign-in failed."); } finally { setBusy(false); } };
  return (
    <div className="landing">
      <header className="l-top">
        <div className="l-brand"><Mark size={30} color="var(--brand)" /><b>{APP_NAME}</b></div>
        <button className="pill pill-small" disabled={busy} onClick={go}>I have a code · Sign in</button>
      </header>

      <section className="l-hero">
        <div className="l-hero-text">
          <span className="l-kicker">Closed pilot · Munich and Belgrade</span>
          <h1>An AI chef that fits your <em>craving</em> to your plan.</h1>
          <p>You want Nutella. You have skyr and biscuits. Mealan works out how much of each, in grams, so the plate fits your goal. No log, no guilt, right when you decide.</p>
          <div className="l-cta">
            <button className="pill pill-primary" onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth" })}>Request access</button>
            <button className="pill" disabled={busy} onClick={go}>I have a code</button>
          </div>
          {err && <p className="small" style={{ color: "var(--low)" }}>{err}</p>}
        </div>
        <div className="l-hero-art">
          <img className="l-chef" src="/landing/chef.webp" alt="Milan, the coach behind Chef Mealan, in a chef's hat" />
          <div className="l-phone"><img src="/landing/plate.webp" alt="A plate fitted to a target: Nutella 40 g, biscuits 30 g, skyr 252 g" /></div>
        </div>
      </section>

      <section className="l-steps">
        <h2>How it works</h2>
        <div className="l-grid">
          <div className="l-step"><ScanLine size={26} /><b>Put in what you crave</b><p>A photo, a barcode, a label or just the name. Your own foods stay in your library.</p></div>
          <div className="l-step"><Scale size={26} /><b>Fit to my target</b><p>Mealan sets the amounts so the plate lands on your target. Arithmetic, not guesswork.</p></div>
          <div className="l-step"><MessageCircle size={26} /><b>Ask the chef</b><p>No milk at home, a hotel buffet, a birthday cake at work. Mealan answers with what to take and how much.</p></div>
          <div className="l-step"><ChefHat size={26} /><b>Eat it, rate it</b><p>DaaM good, good, or not really. It stays yours unless you share it with your coach.</p></div>
        </div>
      </section>

      <section className="l-moments">
        <h2>For the moment you're in</h2>
        <div className="moments">
          {["Before training", "After training", "Meeting day", "Travel", "Celebration at work", "Afterwork event"].map((m) => <span key={m} className="pill pill-small l-chip">{m}</span>)}
        </div>
        <p>A rest day and a training day need different plates. Pick the moment, and Mealan fits the plate to it.</p>
      </section>

      <section className="l-built">
        <h2>Built the honest way</h2>
        <div className="l-grid l-grid-3">
          <div><b>You decide</b><p>Nothing moves a number you typed. Your coach sets the goal with you.</p></div>
          <div><b>Code does the math</b><p>Published formulas and a solver. Every step shown, every number checkable.</p></div>
          <div><b>The model reads</b><p>Labels, menus and shelves. Estimates are always marked as estimates.</p></div>
        </div>
      </section>

      <section className="l-request" ref={formRef}>
        <div className="l-lock"><Lock size={20} /></div>
        <h2>Chef Mealan works through coaches</h2>
        <p>It's a closed pilot. You join with a code from your coach. No coach yet, or you are one? Leave your details and Milan gets back to you.</p>
        <RequestForm />
      </section>

      <footer className="l-foot">
        <span>© 2026 Milan Stancevic · <a href="mailto:hello@chefmealan.com">hello@chefmealan.com</a></span>
        <span>Your data stays in the EU, under your account. Built with <a href="https://github.com/mistancevic/worth-building" target="_blank" rel="noreferrer">Worth Building</a>.</span>
      </footer>
    </div>
  );
}

export function RequestForm({ email: presetEmail, name: presetName }: { email?: string; name?: string }) {
  const started = useRef(Date.now());
  const [name, setName] = useState(presetName ?? "");
  const [email, setEmail] = useState(presetEmail ?? "");
  const [note, setNote] = useState("");
  const [coach, setCoach] = useState(false);
  const [trap, setTrap] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [err, setErr] = useState("");
  async function send() {
    setErr(""); setState("sending");
    try {
      const r = await fetch("/api/access-request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, note, coach, website: trap, elapsed: Date.now() - started.current }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Couldn't send. Please write to hello@chefmealan.com.");
      setState("sent");
    } catch (e: any) { setErr(e.message); setState("idle"); }
  }
  if (state === "sent") return <div className="l-sent"><Check size={22} /> Thanks, {name.split(" ")[0] || "you're on the list"}. Milan will get back to you at {email}.</div>;
  return (
    <div className="l-form">
      <input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" />
      <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} autoComplete="email" />
      <textarea placeholder="What are you after? (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={600} />
      <label className="check"><input type="checkbox" checked={coach} onChange={(e) => setCoach(e.target.checked)} /> I'm a coach and want to use it with clients</label>
      {/* only bots fill this */}
      <input className="l-trap" tabIndex={-1} autoComplete="off" aria-hidden="true" value={trap} onChange={(e) => setTrap(e.target.value)} name="website" />
      <button className="pill pill-primary pill-wide" disabled={state === "sending" || !name.trim() || !email.includes("@")} onClick={send}>{state === "sending" ? "Sending…" : "Request access"}</button>
      {err && <p className="small" style={{ color: "var(--low)" }}>{err}</p>}
    </div>
  );
}
