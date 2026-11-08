import { BOOKS } from "../bookPages";
import { useEffect, useRef, useState } from "react";
import { tabOfPath } from "../back";
import { takeIdleOut } from "../idle";
import { RecipeCard } from "./RecipePages";
import type { PublicRecipe } from "../recipes";
import { Check } from "lucide-react";
import { WANTS, HAVES, DEMO_GOAL, lift, alone, part, plate, unitOf, havesFor, PAIR_NOTES, type DemoFood } from "../landing";
import { Mark, APP_NAME } from "../components/Mark";
import { linkInUrl } from "../cloud";
import { SignInPanel } from "../components/SignInPanel";
import { pendingCode } from "../pendingCode";
import { hit } from "../metrics";
import { VERSION_LINE } from "../version";
import { w, wn, type WordKey, dec } from "../words";
import { useLang, getLang, setLang, LANGS, langChip, type Lang } from "../lang";
import { LangSwitch, LangAsk, pageLang, langPath } from "../components/LangAsk";
import { IDLE_DAYS } from "../idle";

// DT236 v3 (0.3.93, boards Stories177 and Stories180; Coach Milan 5 November 11:36, Go): the home page in English, Srpski and
// Deutsch (Beta). chefmealan.com stays English; chefmealan.com/sr and chefmealan.com/de; the switch in the header; the box once
// on a phone in Serbian or German. The clips stay English until this phase of languages is done (Coach Milan 11:26).
// a line with links in it: {wb} and {wn} become the elements given
const withLinks = (t: string, m: Record<string, React.ReactNode>) => t.split(/(\{\w+\})/).map((x, i) => { const k = /^\{(\w+)\}$/.exec(x)?.[1]; return k && k in m ? <span key={i}>{m[k]}</span> : x; });
// German nouns keep their capital inside a sentence
const low = (t: string) => (getLang() === "de" ? t : t.toLowerCase());

// The front door of chefmealan.com: what it is, how it works, request a code, or sign in with one.
export function LandingScreen() {
  useLang();
  // the page's language: /sr and /de choose it (the app follows); on chefmealan.com a phone that chose one goes to its page
  useEffect(() => { const l = pageLang(location.pathname); if (l) { if (l !== getLang()) setLang(l); } else if (location.pathname === "/" && getLang() !== "en") history.replaceState(null, "", langPath(getLang()) + location.search + location.hash); }, []);
  const formRef = useRef<HTMLDivElement>(null);
  const [idle] = useState(() => takeIdleOut());   // DT196: signed out after 30 days, said once
  const [err, setErr] = useState("");
  // signed out on an app address (chefmealan.com/foods): the home page sits at chefmealan.com
  useEffect(() => { if (tabOfPath(location.pathname, ["home", "journey", "meal", "chef", "recipes", "foods", "me"])) history.replaceState(null, "", "/"); }, []);
  // DT259 (0.3.113, board Stories194): Sign in opens the choice, Google or a link by email, under the top bar
  const [signing, setSigning] = useState(() => linkInUrl() === "signin");
  const go = () => { setErr(""); setSigning(true); window.scrollTo({ top: 0, behavior: "smooth" }); };
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
  const mainLabel = full ? w("home.joinWait") : w("home.joinBeta");
  const spotsLine = spots === null ? null : full ? w("home.roundFull") : wn("home.spotsLeft", spots);
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
        <span className="l-topnav"><button type="button" className="link l-coaches" onClick={toCoaches}>{w("home.coaches")}</button><a className="l-recipes" href="/recipes">{w("home.recipes")}</a><LangSwitch /><button className="pill pill-small l-signin" onClick={go}>{w("home.signIn")}</button></span>
      </header>
      {signing && <SignInPanel close={() => setSigning(false)} />}
      <LangAsk />
      {idle && (
        <section className="sh-arrived">
          <b>{w("home.signedOut")}</b>
          <span>{w("home.idleLine", { days: IDLE_DAYS })}</span>
          <button className="pill pill-primary" onClick={go}>{w("home.signIn")}</button>
        </section>
      )}
      {/* SH73: someone who scanned a coach's QR code sees their code and the one step left */}
      {pendingCode() && (
        <section className="sh-arrived">
          <b>{w("home.yourCode", { code: pendingCode() ?? "" })}</b>
          <span>{w("home.yourCodeLine")}</span>
          <button className="pill pill-primary" onClick={go}>{w("home.signIn")}</button>
        </section>
      )}

      {/* HP5 1d (0.3.46, board Stories149; Coach Milan 1 November 15:38 to 16:52 Go): the button on the first screen, over a slow
          carousel of Milan's own cooking. The words, the button, the spots left and the commitment stay still; the photo changes by
          itself every 5.5 seconds with a crossfade; dots show which, and a tap on a dot shows that dish. Reduce motion: the first
          photo only. Only the first photo loads with the page, the others after. Each photo has its own focus, so the plate sits
          in the middle of what shows (the curry moved up, Milan 16:43). */}
      <section className="l-photo" aria-label={w("home.theStart")}>
        <HeroPhotos />
        <div className="l-photo-words">
          <span className="l-kicker">{w("home.kicker")}</span>
          <h1>{w("home.h1")}</h1>
          <p className="l-photo-lead">{w("home.lead")}</p>
          {err && <p className="l-photo-err">{err}</p>}
          <div className="l-photo-cta" ref={ctaRef}>
            <button className="pill pill-primary l-cta-big" onClick={toMain}>{mainLabel}</button>
            <div className="l-beta">
              {spotsLine && <p className={`l-spots ${full ? "full" : ""}`}>{spotsLine}</p>}
              {full
                ? <p>{w("home.waitOnce")}</p>
                : <p>{w("home.betaLine")} <button type="button" className="link" onClick={toWait}>{w("home.orWait")}</button></p>}
            </div>
          </div>
          <p className="l-photo-own">{w("home.ownCooking")}</p>
        </div>
      </section>

      {/* HP6 (0.3.48, board Stories150 version 3; Coach Milan 1 November 17:37 to 19:54 Go): the calculator in the shape of the
          other sections, a label, the title as the hook, one line; mobile first, the words the whole width and the calculator
          centred under them on a computer too */}
      <section className="l-hero l-calc" id="try">
        <div className="l-calc-text">
          <span className="l-eyebrow">{w("home.tryHere")}</span>
          <h2>{w("home.calcTitle")}</h2>
          <p>{w("home.calcLine")}</p>
        </div>
        <TryIt />
      </section>

      {/* HP2 (0.2.114, board Stories90; Milan 27 October 14:25 to 15:34): in place of the five clips of 0.2.51. Start from anything,
          everything lands on one plate, recipes for your day, the shopping list. Mobile first: one below another on a phone;
          on a computer the four ways in sit in a row. Each clip is the real app on test data (scripts/record-home-clips.cjs). */}
      <section className="l-steps l-ways">
        <span className="l-eyebrow">{w("home.waysEyebrow")}</span>
        <h2>{w("home.waysTitle")}</h2>
        <p className="l-ways-lead">{w("home.waysLead")}</p>
        <div className="l-ways-grid">
          {WAYS.map((x) => (
            <div className="l-way" key={x.id}>
              <h3>{x.title}</h3>
              <p>{x.line}</p>
              <DayVideo src={`/landing/way-${x.id}.mp4`} poster={`/landing/way-${x.id}.webp`} label={`${x.title}: ${x.line}`} />
            </div>
          ))}
        </div>
        <div className="l-one">
          <div className="l-one-text">
            <span className="l-eyebrow">{w("home.onePlate")}</span>
            <h2>{w("home.onePlateTitle")}</h2>
            <p><b>{w("home.pdB")}</b> {w("home.pdText")}</p>
            <p><b>{w("home.fcB")}</b> {w("home.fcText")}</p>
            <p><b>{w("home.decideB")}</b> {w("home.decideText")}</p>
          </div>
          <DayVideo src="/landing/way-plate.mp4" poster="/landing/way-plate.webp" label={w("home.videoPlate")} />
        </div>
        <div className="l-two">
          <div className="l-way">
            <span className="l-eyebrow">{w("home.plan")}</span>
            <h2>{w("home.recipesTitle")}</h2>
            <p>{w("home.recipesLine")}</p>
            <DayVideo src="/landing/way-recipes.mp4" poster="/landing/way-recipes.webp" label={w("home.recipesTitle")} />
          </div>
          <div className="l-way">
            <span className="l-eyebrow">{w("home.shop")}</span>
            <h2>{w("home.shopTitle")}</h2>
            <p>{w("home.shopLine")}</p>
            <DayVideo src="/landing/way-shop.mp4" poster="/landing/way-shop.webp" label={w("home.shopTitle")} />
          </div>
        </div>
        <small className="l-ways-note">{w("home.clipsPacks")}</small>
      </section>

      {/* HP3: cook it, the day as it goes, Explorer; each with a clip of the app as it is */}
      <section className="l-steps l-new">
        <div className="l-one">
          <div className="l-one-text">
            <span className="l-eyebrow">{w("home.cook")}</span>
            <h2>{w("home.cookTitle")}</h2>
            <ul className="l-list">
              {(["home.cook1", "home.cook2", "home.cook3", "home.cook4", "home.cook5"] as WordKey[]).map((k) => <li key={k}>{w(k)}</li>)}
            </ul>
          </div>
          <DayVideo src="/landing/way-cook.mp4" poster="/landing/way-cook.webp" label={w("home.videoCook")} />
        </div>
        <div className="l-one">
          <div className="l-one-text">
            {/* Coach Milan 1 November 14:06: the clip is Explorer, so the label says so */}
            <span className="l-eyebrow">{w("home.situEyebrow")}</span>
            <h2>{w("home.situTitle")}</h2>
            <p>{w("home.situLine")}</p>
            <p className="l-list-lead">{w("home.andInPlan")}</p>
            <ul className="l-list">
              {(["home.situ1", "home.situ2", "home.situ3"] as WordKey[]).map((k) => <li key={k}>{w(k)}</li>)}
            </ul>
          </div>
          <DayVideo src="/landing/way-situation.mp4" poster="/landing/way-situation.webp" label={w("home.videoSitu")} />
        </div>
        <div className="l-one">
          <div className="l-one-text">
            <span className="l-eyebrow">{w("home.bodyEyebrow")}</span>
            <h2>{w("home.bodyTitle")}</h2>
            <p>{w("home.body1")}</p>
            <p>{w("home.body2")}</p>
          </div>
          <DayVideo src="/landing/way-explorer.mp4" poster="/landing/way-explorer.webp" label={w("home.videoBody")} />
        </div>
        {/* DT253 (board Stories188; Coach Milan 7 November 13:45, the title evergreen): the app's languages, as chips from the list
            the header's switch reads (LANGS), so a new language shows here by itself; the clip runs up to 20 s (HC8) */}
        <div className="l-one">
          <div className="l-one-text">
            <span className="l-eyebrow">{w("home.langEyebrow")}</span>
            <h2>{w("home.langTitle")}</h2>
            <ul className="l-langs" aria-label={w("home.language")}>
              {LANGS.map((l) => { const c = langChip(l); return <li key={l} lang={l}>{c.name}{c.beta && <span className="l-lang-beta"> · Beta</span>}</li>; })}
            </ul>
            <ul className="l-list">
              {(["home.lang1", "home.lang2", "home.lang3", "home.lang4"] as WordKey[]).map((k) => <li key={k}>{w(k)}</li>)}
            </ul>
            <small className="l-lang-note">{w("home.langNote")}</small>
          </div>
          <DayVideo src="/landing/way-languages.mp4" poster="/landing/way-languages.webp" label={w("home.videoLang")} />
        </div>
        <small className="l-ways-note">{w("home.clipsNames")}</small>
      </section>

      {recipes.length > 0 && (
        <section className="l-kitchen">
          <span className="l-eyebrow">{w("home.kitchen")}</span>
          <h2>{w("home.kitchenTitle")}</h2>
          <p>{w("home.kitchenLine")}</p>
          <div className="rp-grid">{recipes.map((r) => <RecipeCard key={r.slug} r={r} />)}</div>
          <a className="l-all" href="/recipes">{w("home.allRecipes")}</a>
        </section>
      )}

      {/* HP3: the coach's section, reached from Coaches in the top bar; its button opens the beta form as a coach */}
      <section className="l-coach" id="coaches" ref={coachRef}>
        <span className="l-eyebrow">{w("home.forCoaches")}</span>
        <h2>{w("home.coachTitle")}</h2>
        <p>{w("home.coachLine")}</p>
        <ul className="l-list">
          {(["home.coach1", "home.coach2", "home.coach3", "home.coach4"] as WordKey[]).map((k) => <li key={k}>{w(k)}</li>)}
        </ul>
        <DayVideo src="/landing/way-coach.mp4" poster="/landing/way-coach.webp" label={w("home.videoCoach")} />
        <p className="l-coach-act"><button className="pill pill-primary" onClick={() => { setAskAs("coach"); full ? toWait() : toForm(); }}>{full ? w("home.joinWait") : w("home.getCoachCode")}</button></p>
        <small className="muted">{w("home.coachSmall")}</small>
      </section>

      {/* who's behind Chef Mealan (board B, HP11, 12 October 2026): the product role first, so nobody reads Milan as a
          full-time coach; clients still know him as Coach Milan */}
      <section className="l-week l-behind">
        <span className="l-eyebrow">{w("home.behind")}</span>
        <h2>Milan Stancevic</h2>
        <div className="l-split">
          <div>
            {/* Coach Milan 1 November 14:35: the line from the book's cover */}
            <p className="l-role">{w("home.role")}</p>
            <p>{w("home.behind1")}</p>
            {/* Coach Milan 1 November 15:03: the recipe builder and cook, as on the book's cover; the coaching certificate belongs on
                the personal page, not here */}
            <p>{w("home.behind2")}</p>
            <p>{withLinks(w("home.authorOf"), { wb: <a href="/built#books">Worth Building</a>, wn: <a href="/worthy-numbers?from=hp">Worthy Numbers</a> })}</p>
            <p className="l-behind-links"><a href="/built">{w("home.howBuilt")}</a><a href="/about">{w("home.moreMilan")}</a></p>
          </div>
          <figure className="l-hero-art">
            <img className="l-chef" src="/landing/chef.webp" alt={w("home.chefAlt")} />
          </figure>
        </div>
      </section>

      <section className="l-built">
        <span className="l-eyebrow">{w("home.numbersEyebrow")}</span>
        <h2>{w("home.numbersTitle")}</h2>
        <div className="l-grid l-grid-3">
          {[1, 2, 3, 4, 5].map((i) => <div key={i}><b>{w(`home.n${i}b` as WordKey)}</b><p>{w(`home.n${i}p` as WordKey)}</p></div>)}
        </div>
      </section>

      {/* BP70 (Milan 12:41): the book gets one block here and its own page, so there is one place to update */}
      <section className="l-week l-book">
        <span className="l-eyebrow">{w("home.freeGuide")}</span>
        <h2>{BOOKS["worthy-numbers"].name}</h2>
        <div className="l-split">
          <div className="l-book-text">
            <p className="l-role">{BOOKS["worthy-numbers"].kicker}. {BOOKS["worthy-numbers"].subtitle}</p>
            <p>{w("home.bookLine")}</p>
            <p><a className="l-book-link" href="/worthy-numbers?from=hp">{w("home.seeBook")}</a></p>
          </div>
          <figure className="l-hero-art"><a href="/worthy-numbers?from=hp"><img className="l-book-cover" src={BOOKS["worthy-numbers"].cover} alt={w("home.coverAlt", { name: BOOKS["worthy-numbers"].name })} width={220} height={312} /></a></figure>
        </div>
      </section>

      {/* Coach Milan 1 November 14:35: who it is for, written new; the line about doctors is the disclaimer, on its own */}
      <section className="l-who">
        <span className="l-eyebrow">{w("home.whoEyebrow")}</span>
        <h2>{w("home.whoTitle")}</h2>
        <ul className="l-list">
          {(["home.who1", "home.who2", "home.who3"] as WordKey[]).map((k) => <li key={k}>{w(k)}</li>)}
        </ul>
        <p>{w("home.adults")}</p>
      </section>
      <section className="l-who l-disclaimer">
        <span className="l-eyebrow">{w("home.disclaimer")}</span>
        <h2>{w("home.notDoctor")}</h2>
        <p>{w("home.disclaimerLine")} <a href="/disclaimer">{w("home.fullDisclaimer")}</a></p>
      </section>

      {/* HP3: two forms. The beta asks for commitment and gives a code; the waiting list asks only for an email, for the paying
          users at launch. When the spots reach 0 the waiting list comes first and the beta form waits for the next round. */}
      {(() => {
        const beta = (
          <section className="l-request" ref={formRef} key="beta">
            <h2>{full ? w("home.nextRound") : w("home.joinBeta")}</h2>
            {full
              ? <p>{w("home.fullForm")}</p>
              : <p>{spotsLine && <b className="l-spots">{spotsLine}. </b>}{w("home.betaForm")}</p>}
            <RequestForm who={askAs ?? undefined} />
          </section>
        );
        const wait = (
          <section className="l-request l-wait" id="wait" ref={waitRef} key="wait">
            <h2>{w("home.waitTitle")}</h2>
            <p>{w("home.waitForm")}</p>
            <WaitForm who={askAs ?? undefined} />
          </section>
        );
        return full ? [wait, beta] : [beta, wait];
      })()}

      <div className={`l-sticky ${sticky ? "on" : ""}`} aria-hidden={!sticky}><button className="pill pill-primary" tabIndex={sticky ? 0 : -1} onClick={toMain}>{mainLabel}</button></div>
      <footer className="l-foot">
        <span><a href="/about">{w("home.footBehind")}</a> · <a href="/built">{w("home.footBuilt")}</a> · <a href="/impressum">Impressum</a> · <a href="/privacy">{w("home.footPrivacy")}</a> · <a href="/disclaimer">{w("home.footDisclaimer")}</a></span>
        <span><a href="mailto:hello@chefmealan.com">hello@chefmealan.com</a> · © 2026 Milan Stancevic · {VERSION_LINE}</span>
      </footer>
    </div>
  );
}

// HP2 (0.2.114): the four ways in, each with its clip
const WAYS = [
  // HP3 (Coach Milan 1 November): two ways in, not four; the barcode and the labels are one, the group of packs leaves the page
  { id: "barcode", get title() { return w("home.way.barcode"); }, get line() { return w("home.way.barcodeLine"); } },
  { id: "meal", get title() { return w("home.way.meal"); }, get line() { return w("home.way.mealLine"); } },
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
  { k: "curry", get name() { return w("home.photo.curry"); }, phone: ["40% 100%", "auto 126%"], desk: ["62% 70%", "cover"] },
  { k: "meatballs", get name() { return w("home.photo.meatballs"); } },
  { k: "quesadilla", get name() { return w("home.photo.quesadilla"); } },
  { k: "waffle", get name() { return w("home.photo.waffle"); } },
  { k: "squares", get name() { return w("home.photo.squares"); } },
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
        <div className="l-photo-dots" role="group" aria-label={w("home.photos")}>
          {HERO_PHOTOS.map((p, i) => (
            <button key={p.k} type="button" aria-label={w("home.photoOf", { name: p.name, i: i + 1, n: HERO_PHOTOS.length })} aria-pressed={i === at}
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
  const cr = WANTS.find((x) => x.id === want)!;
  const offered = havesFor(cr);
  const [have, setHaveState] = useState(offered[0].id);
  const h = offered.find((x) => x.id === have) ?? offered[0];
  const [wg, setWg] = useState(cr.grams ?? 40);
  const [hg, setHg] = useState(h.grams ?? 100);
  const setWant = (id: string) => { setWantState(id); const nw = WANTS.find((x) => x.id === id)!; setWg(nw.grams ?? 40); const nh = havesFor(nw).find((x) => x.id === have) ?? havesFor(nw)[0]; setHaveState(nh.id); setHg(nh.grams ?? 100); };
  const setHave = (id: string) => { setHaveState(id); setHg(HAVES.find((x) => x.id === id)!.grams ?? 100); };
  const a = alone(cr, wg), p = plate(cr, wg, h, hg);
  const fits = p.pd >= DEMO_GOAL.pd;
  const need = lift(cr, h, DEMO_GOAL.pd, wg);
  const reach = !fits && need.grams <= (h.max ?? 300);
  const others = offered.filter((x) => x.id !== h.id && lift(cr, x, DEMO_GOAL.pd, wg).grams <= (x.max ?? 300)).map((x) => (x.id === "yogurt" ? x.name : low(x.name)));
  const hn = low(h.name), wnm = cr.of ?? low(cr.name), hu = unitOf(h);
  const Pick = ({ items, on, set }: { items: { id: string; name: string }[]; on: string; set: (v: string) => void }) => (
    <div className="chip-row">{items.map((x) => <button key={x.id} type="button" className={`choice ${on === x.id ? "on" : ""}`} aria-pressed={on === x.id} onClick={() => { used(); set(x.id); }}>{x.name}</button>)}</div>
  );
  // one picked food: its name, a stepper for its weight, and what that weight brings
  const Weigh = ({ f, value, set }: { f: DemoFood; value: number; set: (v: number) => void }) => {
    const u = unitOf(f), st = f.step ?? 10, n = part(f, value);
    return (
      <div className="l-amount">
        <span><b>{f.name}</b><small>{w("home.kcalProtein", { kcal: n.kcal, protein: n.protein })}</small></span>
        <span className="rp-step">
          <button type="button" aria-label={w("home.less", { step: st, unit: u, food: low(f.name) })} disabled={value - st < (f.min ?? st)} onClick={() => { used(); set(value - st); }}>−</button>
          <b>{value} {u}</b>
          <button type="button" aria-label={w("home.more", { step: st, unit: u, food: low(f.name) })} disabled={value + st > (f.max ?? 300)} onClick={() => { used(); set(value + st); }}>+</button>
        </span>
      </div>
    );
  };
  return (
    <div className="l-try-box">
      <div className="setting"><small className="setting-name">{w("home.crave")}</small><Pick items={WANTS} on={want} set={setWant} /></div>
      <div className="setting"><small className="setting-name">{w("home.haveAtHome")}</small><Pick items={offered} on={h.id} set={setHave} /></div>
      <div className="setting">
        <small className="setting-name">{w("home.yourPlate")}</small>
        <Weigh f={cr} value={wg} set={setWg} />
        <Weigh f={h} value={hg} set={setHg} />
      </div>
      <div className="l-try-result" aria-live="polite">
        <b>{fits ? w("home.plateFits") : w("home.underPd", { pd: DEMO_GOAL.pd })}</b>
        <div className="l-jump">
          <div className="l-jump-from"><small>{w("home.alone", { g: wg, food: wnm })}</small><b>PD {dec(a.pd, 1)}</b><small>{w("home.kcalProtein", { kcal: a.kcal, protein: a.protein })}</small></div>
          <b className="l-jump-arrow" aria-hidden="true">→</b>
          <div className={fits ? "l-jump-to" : "l-jump-from"}><small>{w("home.withFood", { g: hg, unit: hu, food: hn })}</small><b>PD {dec(p.pd, 1)}</b><small>{w("home.kcalProtein", { kcal: p.kcal, protein: Math.round(p.protein) })}</small></div>
        </div>
        <span>{cr.note} {PAIR_NOTES[`${cr.id}|${h.id}`] ?? ""} {fits ? w("home.addsProtein", { food: hn }) : reach ? w("home.reaches", { g: need.grams, unit: hu, food: hn, pd: DEMO_GOAL.pd }) : `${w("home.tooLittle", { food: h.name, pd: DEMO_GOAL.pd })}${others.length ? ` ${w("home.tryFoods", { foods: others.length > 1 ? w("home.orList", { rest: others.slice(0, -1).join(", "), last: others[others.length - 1] }) : others[0] })}` : ""}`}</span>
        {reach && <button type="button" className="pill pill-small" onClick={() => { used(); setHg(need.grams); }}>{w("home.useG", { g: need.grams, unit: hu })}</button>}
        <a className="l-pd-link" href="#what-pd" onClick={(e) => { e.preventDefault(); document.getElementById("what-pd")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}>{w("home.whatPd")}</a>
      </div>
      {/* HP68: what PD is, right below the result (Milan 23:53); Milan 23:48: no goal name, no "mostly energy" */}
      <div className="l-pd" id="what-pd">
        <b>{w("home.pdMeans")}</b>
        <p>{w("home.pdExplain", { pd: DEMO_GOAL.pd })}</p>
      </div>
      <small className="l-try-small">{w("home.trySmall")}</small>
    </div>
  );
}

// HP3 (0.3.42): the waiting list's form. An email, which fits, and the tick that lets us write to you once, when it opens.
const WHO_CHOICES = ["client", "coach", "self"] as const;
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
      if (!r.ok) throw new Error(d.error || w("home.cantSend"));
      setState("sent");
    } catch (e: any) { setErr(e.message); setState("idle"); }
  }
  if (state === "sent") return <div className="l-sent"><Check size={22} /> {w("home.onWait", { email })}</div>;
  return (
    <div className="l-form">
      <input placeholder={w("home.email")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} autoComplete="email" aria-label={w("home.emailWait")} />
      <div className="setting"><small className="setting-name">{w("home.whichFits")}</small>
        <div className="chip-row">{WHO_CHOICES.map((k) => <button key={k} type="button" className={`choice ${who === k ? "on" : ""}`} aria-pressed={who === k} onClick={() => setWho(k)}>{w(`home.who.${k}` as WordKey)}</button>)}</div>
      </div>
      <label className="l-consent"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /> <span>{w("home.consent")}</span></label>
      <input className="l-trap" tabIndex={-1} autoComplete="off" aria-hidden="true" value={trap} onChange={(e) => setTrap(e.target.value)} name="website" />
      <button className="pill pill-primary pill-wide" disabled={state === "sending" || !email.includes("@") || !consent} onClick={send}>{state === "sending" ? w("home.sending") : w("home.joinWait")}</button>
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
      if (!r.ok) throw new Error(d.error || w("home.cantSend"));
      setState("sent");
    } catch (e: any) { setErr(e.message); setState("idle"); }
  }
  if (state === "sent") return <div className="l-sent"><Check size={22} /> {name.split(" ")[0] ? w("home.thanks", { name: name.split(" ")[0], email }) : w("home.thanksList", { email })}</div>;
  return (
    <div className="l-form">
      <input placeholder={w("home.yourName")} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" />
      <input placeholder={w("home.email")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} autoComplete="email" />
      {/* HP12: optional, for a WhatsApp message or a text about joining */}
      <label className="l-mobile">
        <input placeholder={w("home.mobile")} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} autoComplete="tel" />
        <small>{w("home.mobileLine")}</small>
      </label>
      <textarea placeholder={w("home.after")} value={note} onChange={(e) => setNote(e.target.value)} maxLength={600} />
      <div className="setting"><small className="setting-name">{w("home.whichFits")}</small>
        <div className="chip-row">{WHO_CHOICES.map((k) => <button key={k} type="button" className={`choice ${who === k ? "on" : ""}`} aria-pressed={who === k} onClick={() => setWho(k)}>{w(`home.who.${k}` as WordKey)}</button>)}</div>
      </div>
      {/* only bots fill this */}
      <input className="l-trap" tabIndex={-1} autoComplete="off" aria-hidden="true" value={trap} onChange={(e) => setTrap(e.target.value)} name="website" />
      <button className="pill pill-primary pill-wide" disabled={state === "sending" || !name.trim() || !email.includes("@")} onClick={send}>{state === "sending" ? w("home.sending") : w("home.send")}</button>
      {err && <p className="small" style={{ color: "var(--low)" }}>{err}</p>}
    </div>
  );
}
