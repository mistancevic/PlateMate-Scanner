// DT266 (0.3.116, board Stories197; Coach Milan 8 November 16:44 to 17:09, Go): Coach Milan's certifications, for trust. On the
// home page a carousel of thumbnails under his lines, one and a half in view so more are clearly to the right; a tap opens the
// whole certificate, full size with its number, and arrows or a swipe go to the next. On /about all six one under another,
// each with one line on what it means for the app. Nutrition and fitness first: the person at the plate reads first.
import { useEffect, useState } from "react";
import { w, type WordKey } from "../words";

export type Cert = { id: string; issuer: string; year: string; verify?: string };
export const CERTS: Cert[] = [
  // DT297 (0.3.146; Coach Milan 14 November 13:06): the AI certificates first, then nutrition and the rest, for recruiters
  { id: "ai-pm", issuer: "Product Faculty", year: "2026" },
  { id: "ai-mastery", issuer: "Mindvalley", year: "2026" },
  { id: "nutrition", issuer: "Mindvalley with Viome", year: "2024" },
  { id: "fitness", issuer: "Mindvalley", year: "2023" },
  { id: "holobody", issuer: "Mindvalley", year: "2023" },
  { id: "business", issuer: "Mindvalley, ICF credits", year: "2022" },
];
const k = (s: string) => s as WordKey;
export const certName = (c: Cert) => w(k(`certs.${c.id}.name`));
export const certLine = (c: Cert) => w(k(`certs.${c.id}.line`));
const thumb = (c: Cert) => `/landing/certs/${c.id}-s.webp`, full = (c: Cert) => `/landing/certs/${c.id}.webp`;

// the certificate open, whole, with its number; ‹ › and a swipe move on
export function CertView({ at, close, go }: { at: number; close: () => void; go: (i: number) => void }) {
  const c = CERTS[at];
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") close(); if (e.key === "ArrowRight" && at < CERTS.length - 1) go(at + 1); if (e.key === "ArrowLeft" && at > 0) go(at - 1); };
    window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key);
  }, [at]);
  const [x0, setX0] = useState<number | null>(null);
  return (
    <div className="cert-view" role="dialog" aria-modal="true" aria-label={certName(c)} onClick={close}
      onTouchStart={(e) => setX0(e.touches[0].clientX)} onTouchEnd={(e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; setX0(null); if (dx < -40 && at < CERTS.length - 1) go(at + 1); if (dx > 40 && at > 0) go(at - 1); }}>
      <div className="cert-view-top"><b>{certName(c)} · {c.year}</b><button type="button" className="icon cert-close" aria-label={w("certs.close")} onClick={close}>✕</button></div>
      <img src={full(c)} alt={`${certName(c)}, ${c.issuer}, ${c.year}`} onClick={(e) => e.stopPropagation()} />
      <div className="cert-view-nav" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="link" disabled={at === 0} onClick={() => go(at - 1)}>‹ {at > 0 ? certName(CERTS[at - 1]) : ""}</button>
        <small>{w("certs.nOf", { n: at + 1, total: CERTS.length })}</small>
        <button type="button" className="link" disabled={at === CERTS.length - 1} onClick={() => go(at + 1)}>{at < CERTS.length - 1 ? certName(CERTS[at + 1]) : ""} ›</button>
      </div>
    </div>
  );
}

// the home page: the carousel under Milan's lines
export function CertRow() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="cert-row">
      <small className="l-eyebrow cert-eyebrow">{w("certs.certified")}</small>
      <div className="cert-strip">
        {CERTS.map((c, i) => (
          <button key={c.id} type="button" className="cert-card" onClick={() => setOpen(i)} aria-label={`${certName(c)}, ${c.issuer}, ${c.year}`}>
            <img src={thumb(c)} alt="" loading="lazy" />
            <b>{certName(c)}</b><small>{c.issuer} · {c.year}</small>
          </button>
        ))}
      </div>
      <small className="cert-hint">{w("certs.tapOne")}</small>
      {open !== null && <CertView at={open} close={() => setOpen(null)} go={setOpen} />}
    </div>
  );
}

// /about: all six one under another, with one line each on what it means for the app
export function CertList() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="cert-list">
      <h2>{w("certs.title")}</h2>
      {CERTS.map((c, i) => (
        <div key={c.id} className="cert-item">
          <button type="button" className="cert-open" onClick={() => setOpen(i)} aria-label={w("certs.openFull", { name: certName(c) })}><img src={full(c)} alt={`${certName(c)}, ${c.issuer}, ${c.year}`} loading="lazy" /></button>
          <b>{certName(c)}</b><small>{c.issuer} · {c.year}</small>
          <p>{certLine(c)}</p>
        </div>
      ))}
      <small className="cert-hint">{w("certs.tapFull")}</small>
      {open !== null && <CertView at={open} close={() => setOpen(null)} go={setOpen} />}
    </section>
  );
}
