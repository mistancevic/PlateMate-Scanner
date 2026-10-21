import { useEffect, useState } from "react";
import { hit } from "../metrics";
import { Mark, APP_NAME } from "../components/Mark";
import { BOOKS, bookHit, sourceOf } from "../bookPages";
import { RequestForm } from "./LandingScreen";

// BP70 (Milan 21 October 2026, 10:49 and 10:52): a book's own page at chefmealan.com/<slug>, the same for everyone. The book,
// what is inside, the download (a placeholder while the book is in its last edit), then the way into Chef Mealan: the code
// form when signed out, Open Chef Mealan when signed in. The back cover of the book points here.
export function BookScreen({ slug, signedIn }: { slug: string; signedIn: boolean }) {
  const b = BOOKS[slug];
  // BP70: where the reader came from (?from=qr), counted once, then the address bar shows the plain address
  const [src] = useState(() => (typeof location !== "undefined" ? sourceOf(location.search) : null));
  useEffect(() => {
    hit(bookHit(slug) as `book_${string}`); if (src) hit(bookHit(slug, src) as `book_${string}`);
    if (src) history.replaceState(null, "", location.pathname);
    document.title = `${b.name} · ${APP_NAME}`;
  }, [slug]);
  // BP70: beta spots left, set by Milan; nothing is shown while no number is set
  const [spots, setSpots] = useState<number | null>(null);
  useEffect(() => { fetch("/api/beta/spots").then((r) => r.json()).then((d) => setSpots(Number.isInteger(d?.spots) ? d.spots : null)).catch(() => {}); }, []);
  return (
    <div className="bt bk">
      <header className="l-top">
        <a className="l-brand" href="/" style={{ textDecoration: "none", color: "inherit" }}><Mark size={30} color="var(--brand)" /><b>{APP_NAME}</b></a>
        <a className="bt-home" href="/">Home</a>
      </header>

      <section className="bk-hero">
        <img className="bk-cover" src={b.cover} alt={`The cover of ${b.name}`} width={360} height={511} />
        <div className="bk-text">
          <span className="bt-eyebrow">{b.kicker}</span>
          <h1>{b.name}</h1>
          <p className="bk-sub">{b.subtitle}</p>
          <p className="bt-lead">{b.intro}</p>
          {b.pdf
            ? <a className="pill pill-primary bk-read" href={b.pdf} target="_blank" rel="noreferrer">Read the book</a>
            : <div className="bk-soon"><b>The book is in its last edit.</b><span>It will be free to read and download here, with no sign-up.</span></div>}
        </div>
      </section>

      <h2>What's inside</h2>
      <p className="bt-sub">One number on each page: what it tells you, and how to use it at your next meal.</p>
      <div className="bk-inside">
        {b.inside.map((x) => <div key={x.name} className={x.key ? "key" : ""}><span>{x.name}</span><b>{x.says}</b></div>)}
      </div>

      {/* BP70 (Milan 11:29): PD explained for a cold reader, one bowl as the example, and a way to try it */}
      {b.hook && (
        <section className="bk-hook">
          <h2>{b.hook.title}</h2>
          {b.hook.text.map((t) => <p key={t} className="bt-sub">{t}</p>)}
          <div className="l-try-result bk-jump">
            <div className="l-jump">
              <div className="l-jump-from"><small>{b.hook.from.label}</small><b>{b.hook.from.pd}</b><small>{b.hook.from.sub}</small></div>
              <b className="l-jump-arrow" aria-hidden="true">→</b>
              <div className="l-jump-to"><small>{b.hook.to.label}</small><b>{b.hook.to.pd}</b><small>{b.hook.to.sub}</small></div>
            </div>
          </div>
          <p className="bt-sub">{b.hook.after}</p>
          {!signedIn && <a className="bk-try" href="/">{b.hook.tryIt} ›</a>}
        </section>
      )}

      <h2>Live the day, so it counts</h2>
      <p className="bt-sub">PD helps you decide at the plate or on the go. What counts is the whole day: calories in and out, protein, carbohydrate and fat, vitamins and minerals, an active day, strength training, sleep and recovery. Chef Mealan supports you on that journey.</p>
      <div className="bk-target">
        <small>Your own target, calculated</small>
        {/* the same two people as in the book: different bodies, goals and amounts, the same PD */}
        <div><span><b>A man of 80 kg, 182 cm</b><span>trains twice a week, wants to keep his weight</span></span><span className="bk-who"><b className="bk-pd">PD 6.4</b><span>2,350 kcal · 150 g protein</span></span></div>
        <div><span><b>A woman of 66 kg, 168 cm</b><span>trains three times a week, wants to build muscle</span></span><span className="bk-who"><b className="bk-pd">PD 6.4</b><span>1,950 kcal · 125 g protein</span></span></div>
      </div>
      {signedIn ? (
        <a className="pill pill-primary bk-read" href="/">Open Chef Mealan</a>
      ) : (
        <div className="l-request bk-join">
          <h2>Get your personal code</h2>
          <p className="l-book-line">Chef Mealan is free while it is in beta, and spots are limited. Leave your name and email, and you get your code within a day.</p>
          {spots !== null && <p className={`bk-spots ${spots === 0 ? "full" : ""}`}>{spots === 0 ? "This round is full. Leave your name and email, and you’re first in line for the next round." : `${spots} ${spots === 1 ? "spot" : "spots"} left in this round.`}</p>}
          <RequestForm from={slug} src={src ?? undefined} />
        </div>
      )}

      <h2>The author</h2>
      <p className="bt-sub">Milan Stancevic, product builder and the maker of Chef Mealan. <a href="/built">How Chef Mealan is built ›</a></p>

      <footer className="l-foot">
        <span><a href="/">Home</a> · <a href="/about">Who's behind it</a> · <a href="/impressum">Impressum</a> · <a href="/privacy">Privacy</a> · <a href="/disclaimer">Disclaimer</a></span>
        <span><a href="mailto:hello@chefmealan.com">hello@chefmealan.com</a> · © 2026 Milan Stancevic</span>
      </footer>
    </div>
  );
}
