import { BOOKS } from "../bookPages";
import { useEffect, useRef, useState } from "react";
import { tabOfPath } from "../back";
import { takeIdleOut, IDLE_LINE } from "../idle";
import { RecipeCard } from "./RecipePages";
import type { PublicRecipe } from "../recipes";
import { Check } from "lucide-react";
import { WANTS, HAVES, DEMO_GOAL, lift, alone, part, plate, unitOf, havesFor, PAIR_NOTES, type DemoFood } from "../landing";
import { Mark, APP_NAME } from "../components/Mark";
import { signIn } from "../cloud";
import { pendingCode } from "../pendingCode";
import { hit } from "../metrics";
import { VERSION_LINE } from "../version";

// The front door of chefmealan.com: what it is, how it works, request a code, or sign in with one.
export function LandingScreen() {
  const formRef = useRef<HTMLDivElement>(null);
  const [idle] = useState(() => takeIdleOut());   // DT196: signed out after 30 days, said once
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  // signed out on an app address (chefmealan.com/foods): the home page sits at chefmealan.com
  useEffect(() => { if (tabOfPath(location.pathname, ["home", "journey", "meal", "chef", "recipes", "foods", "me"])) history.replaceState(null, "", "/"); }, []);
  const go = async () => { setBusy(true); setErr(""); try { await signIn(); } catch (e: any) { setErr(e.message || "Sign-in failed."); } finally { setBusy(false); } };
  // home page counts (0.2.5+r17, board M): a visit, a Try tap; no cookie, no visitor id
  useEffect(() => {
    hit("hp_visit");
    // SH73: a visit from Milan's QR code counts as QR too; the ending leaves the address
    // 0.2.115 (Milan 16:43): the Instagram link carries ?from=ig and counts the same way
    try { const u = new URL(window.location.href); const from = u.searchParams.get("from"); if (from === "qr" || from === "ig") { hit(from === "qr" ? "hp_qr" : "hp_ig"); u.searchParams.delete("from"); window.history.replaceState(null, "", u.pathname + u.search + u.hash); } } catch {}
  }, []);
  const toForm = () => { hit("hp_try"); formRef.current?.scrollIntoView({ behavior: "smooth" }); };
  // HP3 (0.3.42, board Stories147; Coach Milan 1 November 10:48 to 13:24): the beta, free, with a commitment and the spots left
  // (the number set under Clients, as on the book page); the waiting list for the paying users at launch, separate; a coach
  // section of its own, reached from Coaches in the top bar. When the spots reach 0, the waiting list is the main button.
  const waitRef = useRef<HTMLDivElement>(null), coachRef = useRef<HTMLElement>(null);
  const [spots, setSpots] = useState<number | null>(null);
  useEffect(() => { fetch("/api/beta/spots").then((r) => r.json()).then((d) => setSpots(Number.isInteger(d?.spots) ? d.spots : null)).catch(() => {}); }, []);
  const full = spots === 0;
  const [askAs, setAskAs] = useState<"coach" | null>(null);
  const toWait = () => { waitRef.current?.scrollIntoView({ behavior: "smooth" }); };
  const toCoaches = () => coachRef.current?.scrollIntoView({ behavior: "smooth" });
  const toMain = () => (full ? toWait() : toForm());
  const mainLabel = full ? "Join the waiting list" : "Join the beta, free";
  const spotsLine = spots === null ? null : full ? "This round of the beta is full." : `${spots} ${spots === 1 ? "spot" : "spots"} left in this round`;
  // HP10: the bar at the bottom shows while neither the button on the first screen (HP5 1d) nor the form is on screen
  const ctaRef = useRef<HTMLDivElement>(null);
  // positions on every scroll, so a fast fling past the button still shows the bar
  const [sticky, setSticky] = useState(false);
  useEffect(() => {
    const check = () => {
      const c = ctaRef.current?.getBoundingClientRect(), f = formRef.current?.getBoundingClientRect();
      const w = waitRef.current?.getBoundingClientRect();
      const past = Boolean(c && c.bottom < 0), atForm = Boolean((f && f.top < window.innerHeight && f.bottom > 0) || (w && w.top < window.innerHeight && w.bottom > 0));
      setSticky(past && !atForm);
    };
    check(); window.addEventListener("scroll", check, { passive: true }); window.addEventListener("resize", check);
    return () => { window.removeEventListener("scroll", check); window.removeEventListener("resize", check); };
  }, []);
  // from a recipe page's Try Chef Mealan: straight to the form
  useEffect(() => { if (location.hash === "#ask") setTimeout(toForm, 300); }, []);
  // the three newest public recipes (canvas board R7); the section stays hidden while there are none
  const [recipes, setRecipes] = useState<PublicRecipe[]>([]);
  useEffect(() => { fetch("/api/recipes?limit=3&cooked=1").then((r) => r.json()).then((d) => setRecipes(d.recipes ?? [])).catch(() => {}); }, []);
  return (
    <div className="landing">
      <header className="l-top">
        <div className="l-brand"><Mark size={30} color="var(--brand)" /><b>{APP_NAME}</b></div>
        <span className="l-topnav"><button type="button" className="link l-coaches" onClick={toCoaches}>Coaches</button><a className="l-recipes" href="/recipes">Recipes</a><button className="pill pill-small l-signin" disabled={busy} onClick={go}>Sign in</button></span>
      </header>
      {idle && (
        <section className="sh-arrived">
          <b>Signed out</b>
          <span>{IDLE_LINE}</span>
          <button className="pill pill-primary" disabled={busy} onClick={go}>Sign in</button>
        </section>
      )}
      {/* SH73: someone who scanned a coach's QR code sees their code and the one step left */}
      {pendingCode() && (
        <section className="sh-arrived">
          <b>Your personal code: {pendingCode()}</b>
          <span>Sign in with Google using the email your code was made for. The code is filled in for you.</span>
          <button className="pill pill-primary" disabled={busy} onClick={go}>Sign in</button>
        </section>
      )}

      {/* HP5 1d (0.3.46, board Stories149; Coach Milan 1 November 15:38 to 16:52 Go): the button on the first screen, over a slow
          carousel of Milan's own cooking. The words, the button, the spots left and the commitment stay still; the photo changes by
          itself every 5.5 seconds with a crossfade; dots show which, and a tap on a dot shows that dish. Reduce motion: the first
          photo only. Only the first photo loads with the page, the others after. Each photo has its own focus, so the plate sits
          in the middle of what shows (the curry moved up, Milan 16:43). */}
      <section className="l-photo" aria-label="The start">
        <HeroPhotos />
        <div className="l-photo-words">
          <span className="l-kicker">For people with a nutrition plan</span>
          <h1>Live your nutrition plan, day by day.</h1>
          <p className="l-photo-lead">Chef Mealan plans your meals with you, and finds the meal that still fits when the day surprises you.</p>
          {err && <p className="l-photo-err">{err}</p>}
          <div className="l-photo-cta" ref={ctaRef}>
            <button className="pill pill-primary l-cta-big" onClick={toMain}>{mainLabel}</button>
            <div className="l-beta">
              {spotsLine && <p className={`l-spots ${full ? "full" : ""}`}>{spotsLine}</p>}
              {full
                ? <p>Join the waiting list, and we write to you once, when Chef Mealan opens to everyone.</p>
                : <p>Use it most days for four weeks, and tell us what breaks. <button type="button" className="link" onClick={toWait}>Or join the waiting list</button></p>}
            </div>
          </div>
          <p className="l-photo-own">Milan's own cooking, at home.</p>
        </div>
      </section>

      {/* HP6 (0.3.48, board Stories150 version 3; Coach Milan 1 November 17:37 to 19:54 Go): the calculator in the shape of the
          other sections, a label, the title as the hook, one line; mobile first, the words the whole width and the calculator
          centred under them on a computer too */}
      <section className="l-hero l-calc" id="try">
        <div className="l-calc-text">
          <span className="l-eyebrow">Try it here</span>
          <h2>Make your craving fit your plan</h2>
          <p>Pick what you crave and a food you have at home. See how much of it makes the plate fit.</p>
        </div>
        <TryIt />
      </section>

      {/* HP2 (0.2.114, board Stories90; Milan 27 October 14:25 to 15:34): in place of the five clips of 0.2.51. Start from anything,
          everything lands on one plate, recipes for your day, the shopping list. Mobile first: one below another on a phone;
          on a computer the four ways in sit in a row. Each clip is the real app on test data (scripts/record-home-clips.cjs). */}
      <section className="l-steps l-ways">
        <span className="l-eyebrow">Start from anything</span>
        <h2>What you eat, read in seconds</h2>
        <p className="l-ways-lead">Scan a barcode or a nutrition label, or take a photo of the meal in front of you. Each one lands on your plate.</p>
        <div className="l-ways-grid">
          {WAYS.map((w) => (
            <div className="l-way" key={w.id}>
              <h3>{w.title}</h3>
              <p>{w.line}</p>
              <DayVideo src={`/landing/way-${w.id}.mp4`} poster={`/landing/way-${w.id}.webp`} label={`${w.title}: ${w.line}`} />
            </div>
          ))}
        </div>
        <div className="l-one">
          <div className="l-one-text">
            <span className="l-eyebrow">One plate</span>
            <h2>Everything lands on one plate</h2>
            <p><b>PD, protein density:</b> grams of protein per 100 kcal. Your target comes from your goal, your body and your training. The big number says how the plate stands against it.</p>
            <p><b>F C Fi P:</b> fat, carbs, fibre, protein, in the order of a food label. A capital letter: as your day needs. Small: under. A plus: more than your day. A minus: close to none.</p>
            <p><b>Then you decide:</b> eat it, eat one portion, add a protein side, or let Chef Mealan fit it to your target.</p>
          </div>
          <DayVideo src="/landing/way-plate.mp4" poster="/landing/way-plate.webp" label="One plate: PD, the letters and the numbers behind them" />
        </div>
        <div className="l-two">
          <div className="l-way">
            <span className="l-eyebrow">Plan</span>
            <h2>Recipes for your day</h2>
            <p>Yours, your coach's and the members', sorted for what is left of your day. Pick one for a meal of your plan.</p>
            <DayVideo src="/landing/way-recipes.mp4" poster="/landing/way-recipes.webp" label="Recipes for your day" />
          </div>
          <div className="l-way">
            <span className="l-eyebrow">Shop</span>
            <h2>Your shopping list</h2>
            <p>The planned week's foods added up, with the meals they are for. Tick as you shop.</p>
            <DayVideo src="/landing/way-shop.mp4" poster="/landing/way-shop.webp" label="Your shopping list" />
          </div>
        </div>
        <small className="l-ways-note">Clips of the app on test data. The packs in them are made up.</small>
      </section>

      {/* HP3: cook it, the day as it goes, Explorer; each with a clip of the app as it is */}
      <section className="l-steps l-new">
        <div className="l-one">
          <div className="l-one-text">
            <span className="l-eyebrow">Cook</span>
            <h2>Cook it, hands free</h2>
            <ul className="l-list">
              <li>One big step at a time, read aloud.</li>
              <li>Say next, back, repeat, or start a timer.</li>
              <li>Ask Chef in the middle: how much is left, what if the pan is too hot.</li>
              <li>Pictures under the steps, yours or drawn.</li>
              <li>A second phone or a tablet on the counter shows the steps.</li>
            </ul>
          </div>
          <DayVideo src="/landing/way-cook.mp4" poster="/landing/way-cook.webp" label="Cook mode: one step at a time, read aloud" />
        </div>
        <div className="l-one">
          <div className="l-one-text">
            {/* Coach Milan 1 November 14:06: the clip is Explorer, so the label says so */}
            <span className="l-eyebrow">Explorer · Situations</span>
            <h2>Your day as it really goes</h2>
            <p>A late evening at work, a party, a day away, a bad night's sleep. In Explorer, each has a page of its own, read against your own plan.</p>
            <p className="l-list-lead">And in your plan:</p>
            <ul className="l-list">
              <li>Busy times from your Google Calendar: a meal in a meeting asks before or after.</li>
              <li>Travel mode: the shops and the kitchen of the place you are in.</li>
              <li>A day off training: what changes, and what stays.</li>
            </ul>
          </div>
          <DayVideo src="/landing/way-situation.mp4" poster="/landing/way-situation.webp" label="A late evening after work, in Explorer" />
        </div>
        <div className="l-one">
          <div className="l-one-text">
            <span className="l-eyebrow">Explorer · The body and nutrients</span>
            <h2>Know why, not only what</h2>
            <p>The body, the situations and the nutrients in one place. Every line has its paper. Every page says when a thing helps and when it hurts, then reads your own days.</p>
            <p>No condition, no test reading, no supplement. If a condition decides what you eat, your doctor does.</p>
          </div>
          <DayVideo src="/landing/way-explorer.mp4" poster="/landing/way-explorer.webp" label="Explorer: the body, its eight families" />
        </div>
        <small className="l-ways-note">Clips of the app on test data. The names in them are made up.</small>
      </section>

      {recipes.length > 0 && (
        <section className="l-kitchen">
          <span className="l-eyebrow">From the kitchen</span>
          <h2>Recipes with the numbers calculated</h2>
          <p>Recipes Coach Milan has cooked and weighed, the numbers next to the photo. In the app, Chef Mealan calculates how much of each food fits your goal.</p>
          <div className="rp-grid">{recipes.map((r) => <RecipeCard key={r.slug} r={r} />)}</div>
          <a className="l-all" href="/recipes">All recipes →</a>
        </section>
      )}

      {/* HP3: the coach's section, reached from Coaches in the top bar; its button opens the beta form as a coach */}
      <section className="l-coach" id="coaches" ref={coachRef}>
        <span className="l-eyebrow">For coaches</span>
        <h2>Coach your clients' real days</h2>
        <p>One account, two views: your own day, and your clients. Each client's day shows as they see it: the plan, the meals, the cards they share.</p>
        <ul className="l-list">
          <li>Suggest a snack or an Explorer page. The client accepts with one tap. You never change their plan.</li>
          <li>Answer a shared meal in one line, or react with Good or Seen.</li>
          <li>Waiting for you: what needs your answer, at the top.</li>
          <li>The client decides what you see. Body data stays off until they switch it on.</li>
        </ul>
        <DayVideo src="/landing/way-coach.mp4" poster="/landing/way-coach.webp" label="My clients: Waiting for you at the top" />
        <p className="l-coach-act"><button className="pill pill-primary" onClick={() => { setAskAs("coach"); full ? toWait() : toForm(); }}>{full ? "Join the waiting list" : "Get a coach code"}</button></p>
        <small className="muted">Coaches in the beta: free, the same four weeks, and your clients join with your code.</small>
      </section>

      {/* who's behind Chef Mealan (board B, HP11, 12 October 2026): the product role first, so nobody reads Milan as a
          full-time coach; clients still know him as Coach Milan */}
      <section className="l-week l-behind">
        <span className="l-eyebrow">Who's behind Chef Mealan</span>
        <h2>Milan Stancevic</h2>
        <div className="l-split">
          <div>
            {/* Coach Milan 1 November 14:35: the line from the book's cover */}
            <p className="l-role">Product and recipe builder, and the maker of Chef Mealan.</p>
            <p>Milan is a senior product manager with about 20 years in software and the founder of several startups. He designs and builds Chef Mealan with AI, from the first sketch to every release.</p>
            {/* Coach Milan 1 November 15:03: the recipe builder and cook, as on the book's cover; the coaching certificate belongs on
                the personal page, not here */}
            <p>Milan cooks every day for himself and his family, in Munich, and builds his own recipes, weighed. The ones he has cooked are marked From the kitchen; the numbers come from labels and food tables.</p>
            <p>Author of <a href="/built#books">Worth Building</a> and <a href="/worthy-numbers?from=hp">Worthy Numbers</a>. Worth Eating comes next.</p>
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
          <div><b>Your data stays in the EU</b><p>Your data is stored in the EU, in Belgium and Frankfurt, in your account. You can download all of it, or delete all of it, at any time.</p></div>
          <div><b>Papers read again</b><p>Every number Explorer credits to a study is checked against the study itself before each release.</p></div>
          <div><b>Nothing kept for nothing</b><p>An account nobody opens for 12 months is deleted, with everything in it.</p></div>
        </div>
      </section>

      {/* BP70 (Milan 12:41): the book gets one block here and its own page, so there is one place to update */}
      <section className="l-week l-book">
        <span className="l-eyebrow">A free guide</span>
        <h2>{BOOKS["worthy-numbers"].name}</h2>
        <div className="l-split">
          <div className="l-book-text">
            <p className="l-role">{BOOKS["worthy-numbers"].kicker}. {BOOKS["worthy-numbers"].subtitle}</p>
            <p>PD, the number no pack prints, and five more numbers about your food: what each one tells you, and how to use it at your next meal.</p>
            <p><a className="l-book-link" href="/worthy-numbers?from=hp">See the book ›</a></p>
          </div>
          <figure className="l-hero-art"><a href="/worthy-numbers?from=hp"><img className="l-book-cover" src={BOOKS["worthy-numbers"].cover} alt={`The cover of ${BOOKS["worthy-numbers"].name}`} width={220} height={312} /></a></figure>
        </div>
      </section>

      {/* Coach Milan 1 November 14:35: who it is for, written new; the line about doctors is the disclaimer, on its own */}
      <section className="l-who">
        <span className="l-eyebrow">Who it's for</span>
        <h2>For people who eat by a plan, and the coaches who make it</h2>
        <ul className="l-list">
          <li>You have a nutrition plan, from a coach or your own, and want to live it day by day.</li>
          <li>You train and want your own numbers at every meal, without a food diary.</li>
          <li>You coach, and want to see your clients' real days and suggest, not chase.</li>
        </ul>
        <p>Chef Mealan is for adults, 18 and over.</p>
      </section>
      <section className="l-who l-disclaimer">
        <span className="l-eyebrow">Disclaimer</span>
        <h2>Chef Mealan is not a doctor</h2>
        <p>If a medical condition decides what you eat, if you're pregnant or have diabetes, or if eating is difficult for you, Chef Mealan doesn't give advice, and tells you who to talk to instead. <a href="/disclaimer">The full disclaimer ›</a></p>
      </section>

      {/* HP3: two forms. The beta asks for commitment and gives a code; the waiting list asks only for an email, for the paying
          users at launch. When the spots reach 0 the waiting list comes first and the beta form waits for the next round. */}
      {(() => {
        const beta = (
          <section className="l-request" ref={formRef} key="beta">
            <h2>{full ? "The next beta round" : "Join the beta, free"}</h2>
            {full
              ? <p>This round is full. Leave your name and email, and Coach Milan writes to you when the next round starts.</p>
              : <p>{spotsLine && <b className="l-spots">{spotsLine}. </b>}Use Chef Mealan most days for four weeks, and tell us what breaks. Most people join with a code from their coach. If you don't have one, leave your name and email, and Coach Milan sends you a personal code.</p>}
            <RequestForm who={askAs ?? undefined} />
          </section>
        );
        const wait = (
          <section className="l-request l-wait" id="wait" ref={waitRef} key="wait">
            <h2>The waiting list</h2>
            <p>For when Chef Mealan opens to everyone. No testing, no code now. We write to you once, when it opens.</p>
            <WaitForm who={askAs ?? undefined} />
          </section>
        );
        return full ? [wait, beta] : [beta, wait];
      })()}

      <div className={`l-sticky ${sticky ? "on" : ""}`} aria-hidden={!sticky}><button className="pill pill-primary" tabIndex={sticky ? 0 : -1} onClick={toMain}>{mainLabel}</button></div>
      <footer className="l-foot">
        <span><a href="/about">Who's behind it</a> · <a href="/built">How Chef Mealan is built</a> · <a href="/impressum">Impressum</a> · <a href="/privacy">Privacy</a> · <a href="/disclaimer">Disclaimer</a></span>
        <span><a href="mailto:hello@chefmealan.com">hello@chefmealan.com</a> · © 2026 Milan Stancevic · {VERSION_LINE}</span>
      </footer>
    </div>
  );
}

// HP2 (0.2.114): the four ways in, each with its clip
const WAYS = [
  // HP3 (Coach Milan 1 November): two ways in, not four; the barcode and the labels are one, the group of packs leaves the page
  { id: "barcode", title: "A barcode or a label", line: "The pack's values, or the label read from a photo, every side if you need. You check it." },
  { id: "meal", title: "A photo of your meal", line: "Chef Mealan names the foods and estimates the grams. You correct what you know." },
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
// HP5 1d: Milan's own cooking behind the words. Phone and computer get their own size of each photo and their own focus.
const HERO_PHOTOS = [
  { k: "curry", name: "Curry with rice", phone: ["40% 100%", "auto 126%"], desk: ["62% 70%", "cover"] },
  { k: "meatballs", name: "Meatballs in the pan" },
  { k: "quesadilla", name: "Quesadilla" },
  { k: "waffle", name: "Waffle" },
  { k: "squares", name: "Chocolate squares" },
] as { k: string; name: string; phone?: string[]; desk?: string[] }[];
export const HERO_EVERY_MS = 5500;
function HeroPhotos() {
  const [still] = useState(() => { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } });
  const [at, setAt] = useState(0);
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set([0]));
  const [turn, setTurn] = useState(0);   // a tap on a dot starts the wait again
  // the other photos load after the page, in the size this screen uses
  useEffect(() => {
    if (still) return;
    const t = setTimeout(() => {
      const big = window.matchMedia("(min-width: 760px)").matches;
      HERO_PHOTOS.forEach((p, i) => { if (i === 0) return; const im = new Image(); im.onload = () => setLoaded((s) => new Set(s).add(i)); im.src = `/landing/hero/${p.k}-${big ? "l" : "m"}.webp`; });
    }, 1500);
    return () => clearTimeout(t);
  }, [still]);
  useEffect(() => {
    if (still || loaded.size < 2) return;
    const t = setInterval(() => {
      if (document.hidden) return;
      setAt((a) => { for (let n = 1; n <= HERO_PHOTOS.length; n++) { const j = (a + n) % HERO_PHOTOS.length; if (loaded.has(j)) return j; } return a; });
    }, HERO_EVERY_MS);
    return () => clearInterval(t);
  }, [still, loaded, turn]);
  const shown = still ? HERO_PHOTOS.slice(0, 1) : HERO_PHOTOS;
  return (
    <>
      {shown.map((p, i) => {
        const on = loaded.has(i);
        const style = {
          "--img-m": on ? `url(/landing/hero/${p.k}-m.webp)` : "none", "--img-l": on ? `url(/landing/hero/${p.k}-l.webp)` : "none",
          "--pos-p": (p.phone ?? ["center"])[0], "--size-p": (p.phone ?? ["", "cover"])[1],
          "--pos-d": (p.desk ?? ["center"])[0], "--size-d": (p.desk ?? ["", "cover"])[1],
        } as React.CSSProperties;
        return <div key={p.k} className={`l-photo-pic ${i === at ? "on" : ""}`} style={style} data-photo={p.k} aria-hidden="true" />;
      })}
      <div className="l-photo-fade" aria-hidden="true" />
      {!still && (
        <div className="l-photo-dots" role="group" aria-label="Photos">
          {HERO_PHOTOS.map((p, i) => (
            <button key={p.k} type="button" aria-label={`${p.name}, photo ${i + 1} of ${HERO_PHOTOS.length}`} aria-pressed={i === at}
              onClick={() => { setAt(i); setTurn((n) => n + 1); }}><span /></button>
          ))}
        </div>
      )}
    </>
  );
}

function TryIt() {
  // the calculator used: counted once per visit, at the first pick or step
  const counted = useRef(false);
  const used = () => { if (!counted.current) { counted.current = true; hit("hp_calc"); } };
  // HP68 (Milan 23:35): pick a craving and a food you have, then set the weight of each; the plate's numbers follow
  const [want, setWantState] = useState(WANTS[0].id);
  const w = WANTS.find((x) => x.id === want)!;
  const offered = havesFor(w);
  const [have, setHaveState] = useState(offered[0].id);
  const h = offered.find((x) => x.id === have) ?? offered[0];
  const [wg, setWg] = useState(w.grams ?? 40);
  const [hg, setHg] = useState(h.grams ?? 100);
  const setWant = (id: string) => { setWantState(id); const nw = WANTS.find((x) => x.id === id)!; setWg(nw.grams ?? 40); const nh = havesFor(nw).find((x) => x.id === have) ?? havesFor(nw)[0]; setHaveState(nh.id); setHg(nh.grams ?? 100); };
  const setHave = (id: string) => { setHaveState(id); setHg(HAVES.find((x) => x.id === id)!.grams ?? 100); };
  const a = alone(w, wg), p = plate(w, wg, h, hg);
  const fits = p.pd >= DEMO_GOAL.pd;
  const need = lift(w, h, DEMO_GOAL.pd, wg);
  const reach = !fits && need.grams <= (h.max ?? 300);
  const others = offered.filter((x) => x.id !== h.id && lift(w, x, DEMO_GOAL.pd, wg).grams <= (x.max ?? 300)).map((x) => (x.name.startsWith("Greek") ? x.name : x.name.toLowerCase()));
  const hn = h.name.toLowerCase(), wn = w.of ?? w.name.toLowerCase(), hu = unitOf(h);
  const Pick = ({ items, on, set }: { items: { id: string; name: string }[]; on: string; set: (v: string) => void }) => (
    <div className="chip-row">{items.map((x) => <button key={x.id} type="button" className={`choice ${on === x.id ? "on" : ""}`} aria-pressed={on === x.id} onClick={() => { used(); set(x.id); }}>{x.name}</button>)}</div>
  );
  // one picked food: its name, a stepper for its weight, and what that weight brings
  const Weigh = ({ f, value, set }: { f: DemoFood; value: number; set: (v: number) => void }) => {
    const u = unitOf(f), st = f.step ?? 10, n = part(f, value);
    return (
      <div className="l-amount">
        <span><b>{f.name}</b><small>{n.kcal} kcal, {n.protein} g protein</small></span>
        <span className="rp-step">
          <button type="button" aria-label={`${st} ${u} less ${f.name.toLowerCase()}`} disabled={value - st < (f.min ?? st)} onClick={() => { used(); set(value - st); }}>−</button>
          <b>{value} {u}</b>
          <button type="button" aria-label={`${st} ${u} more ${f.name.toLowerCase()}`} disabled={value + st > (f.max ?? 300)} onClick={() => { used(); set(value + st); }}>+</button>
        </span>
      </div>
    );
  };
  return (
    <div className="l-try-box">
      <div className="setting"><small className="setting-name">You crave</small><Pick items={WANTS} on={want} set={setWant} /></div>
      <div className="setting"><small className="setting-name">You have at home</small><Pick items={offered} on={h.id} set={setHave} /></div>
      <div className="setting">
        <small className="setting-name">Your plate</small>
        <Weigh f={w} value={wg} set={setWg} />
        <Weigh f={h} value={hg} set={setHg} />
      </div>
      <div className="l-try-result" aria-live="polite">
        <b>{fits ? "The plate fits" : `Under PD ${DEMO_GOAL.pd}`}</b>
        <div className="l-jump">
          <div className="l-jump-from"><small>{wg} g of {wn} alone</small><b>PD {a.pd.toFixed(1)}</b><small>{a.kcal} kcal, {a.protein} g protein</small></div>
          <b className="l-jump-arrow" aria-hidden="true">→</b>
          <div className={fits ? "l-jump-to" : "l-jump-from"}><small>With {hg} {hu} of {hn}</small><b>PD {p.pd.toFixed(1)}</b><small>{p.kcal} kcal, {Math.round(p.protein)} g protein</small></div>
        </div>
        <span>{w.note} {PAIR_NOTES[`${w.id}|${h.id}`] ?? ""} {fits ? `The ${hn} adds the protein, so the plate fits.` : reach ? `${need.grams} ${hu} of ${hn} reaches PD ${DEMO_GOAL.pd}.` : `${h.name} has too little protein for its calories to bring this plate to PD ${DEMO_GOAL.pd}.${others.length ? ` Try ${others.length > 1 ? `${others.slice(0, -1).join(", ")} or ${others[others.length - 1]}` : others[0]}.` : ""}`}</span>
        {reach && <button type="button" className="pill pill-small" onClick={() => { used(); setHg(need.grams); }}>Use {need.grams} {hu}</button>}
        <a className="l-pd-link" href="#what-pd" onClick={(e) => { e.preventDefault(); document.getElementById("what-pd")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}>What PD means ↓</a>
      </div>
      {/* HP68: what PD is, right below the result (Milan 23:53); Milan 23:48: no goal name, no "mostly energy" */}
      <div className="l-pd" id="what-pd">
        <b>PD means protein density</b>
        <p>PD is grams of protein in 100 kcal of food. A higher PD means more protein for the same calories. This calculator aims for PD {DEMO_GOAL.pd}, a usual target when you want to lose fat and build muscle at the same time. Below {DEMO_GOAL.pd}, the plate gives you the calories but too little protein.</p>
      </div>
      <small className="l-try-small">A simplified version of Chef Mealan: one goal, six cravings and typical values from food labels. Nothing you pick here is saved.</small>
    </div>
  );
}

// HP3 (0.3.42): the waiting list's form. An email, which fits, and the tick that lets us write to you once, when it opens.
const WHO_CHOICES = [["client", "I have a coach"], ["coach", "I am a coach"], ["self", "I train on my own"]] as const;
export function WaitForm({ who: presetWho }: { who?: "client" | "coach" | "self" }) {
  const started = useRef(Date.now());
  const [email, setEmail] = useState("");
  const [who, setWho] = useState<"client" | "coach" | "self" | "">(presetWho ?? "");
  useEffect(() => { if (presetWho) setWho(presetWho); }, [presetWho]);
  const [consent, setConsent] = useState(false);
  const [trap, setTrap] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [err, setErr] = useState("");
  async function send() {
    setErr(""); setState("sending");
    try {
      const r = await fetch("/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, who, consent, website: trap, elapsed: Date.now() - started.current }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Couldn't send. Please write to hello@chefmealan.com.");
      setState("sent");
    } catch (e: any) { setErr(e.message); setState("idle"); }
  }
  if (state === "sent") return <div className="l-sent"><Check size={22} /> You're on the waiting list. We write to {email} once, when Chef Mealan opens.</div>;
  return (
    <div className="l-form">
      <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} autoComplete="email" aria-label="Email for the waiting list" />
      <div className="setting"><small className="setting-name">Which fits you?</small>
        <div className="chip-row">{WHO_CHOICES.map(([k, l]) => <button key={k} type="button" className={`choice ${who === k ? "on" : ""}`} aria-pressed={who === k} onClick={() => setWho(k)}>{l}</button>)}</div>
      </div>
      <label className="l-consent"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /> <span>Write to me when Chef Mealan opens. I can leave the list at any time by writing to hello@chefmealan.com.</span></label>
      <input className="l-trap" tabIndex={-1} autoComplete="off" aria-hidden="true" value={trap} onChange={(e) => setTrap(e.target.value)} name="website" />
      <button className="pill pill-primary pill-wide" disabled={state === "sending" || !email.includes("@") || !consent} onClick={send}>{state === "sending" ? "Sending…" : "Join the waiting list"}</button>
      {err && <p className="small" style={{ color: "var(--low)" }}>{err}</p>}
    </div>
  );
}
export function RequestForm({ email: presetEmail, name: presetName, from, src, who: presetWho }: { email?: string; name?: string; from?: string; src?: string; who?: "client" | "coach" | "self" }) {
  const started = useRef(Date.now());
  const [name, setName] = useState(presetName ?? "");
  const [email, setEmail] = useState(presetEmail ?? "");
  const [note, setNote] = useState("");
  const [phone, setPhone] = useState("");
  const [who, setWho] = useState<"client" | "coach" | "self" | "">(presetWho ?? "");
  // HP3: Get a coach code opens the form with I am a coach picked
  useEffect(() => { if (presetWho) setWho(presetWho); }, [presetWho]);
  const [trap, setTrap] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [err, setErr] = useState("");
  async function send() {
    setErr(""); setState("sending");
    try {
      const r = await fetch("/api/access-request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, phone, note, who, coach: who === "coach", from, src, website: trap, elapsed: Date.now() - started.current }) });
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
