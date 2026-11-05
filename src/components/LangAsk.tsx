// DT236 v3 (0.3.93, boards Stories177 and Stories180): the language switch in the home page's header, and the box once.
// The switch shows the language that is on (EN, SR, DE); a tap opens all three, the one on ticked. The choice is the app's too.
import { useEffect, useRef, useState } from "react";
import { useLang, setLang, LANG_NAMES, type Lang } from "../lang";
import { w } from "../words";
import { ASKS, ASK_NO, ASKED_KEY, askFor } from "../langAsk";

const SHORT: Record<Lang, string> = { en: "EN", "sr-Latn": "SR", de: "DE" };
export const langPath = (l: Lang) => (l === "sr-Latn" ? "/sr" : l === "de" ? "/de" : "/");
export const pageLang = (path: string): Lang | null => (/^\/sr(\/|$)/.test(path) ? "sr-Latn" : /^\/de(\/|$)/.test(path) ? "de" : null);
// a choice: the app's language, and the home page's own address for it (only while the home page is open)
export function choose(l: Lang, onHome = true) {
  setLang(l);
  try { localStorage.setItem(ASKED_KEY, "1"); } catch { /* not kept */ }
  if (onHome) history.replaceState(null, "", langPath(l) + location.search + location.hash);
}

export function LangSwitch() {
  const on = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => { if (!open) return; const off = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); }; document.addEventListener("click", off); return () => document.removeEventListener("click", off); }, [open]);
  return (
    <span className="lang-switch" ref={ref}>
      <button type="button" className="lang-switch-btn" aria-haspopup="menu" aria-expanded={open} aria-label={`${w("home.language")}: ${LANG_NAMES[on]}`} onClick={() => setOpen((o) => !o)}>{SHORT[on]}</button>
      {open && (
        <span className="lang-switch-menu" role="menu">
          {(["en", "sr-Latn", "de"] as Lang[]).map((l) => (
            <button key={l} type="button" role="menuitemradio" aria-checked={l === on} className={l === on ? "on" : ""} onClick={() => { choose(l); setOpen(false); }}>
              <span aria-hidden="true">{l === on ? "✓" : ""}</span>{LANG_NAMES[l]}
            </button>
          ))}
        </span>
      )}
    </span>
  );
}

// the box, once, on a phone whose first language is Serbian or German, while the page is in English
export function LangAsk({ onHome = true }: { onHome?: boolean }) {
  const on = useLang();
  const [ask] = useState(() => { try { return localStorage.getItem(ASKED_KEY) ? null : askFor(navigator.languages?.length ? navigator.languages : [navigator.language]); } catch { return null; } });
  const [gone, setGone] = useState(false);
  if (!ask || gone || on !== "en") return null;
  const no = () => { try { localStorage.setItem(ASKED_KEY, "1"); } catch { /* not kept */ } setGone(true); };
  return (
    <section className="lang-ask" lang={ask.lang}>
      <b>{ask.title}</b>
      <small>{ask.line}</small>
      <span className="lang-ask-acts">
        <button type="button" className="pill pill-primary" onClick={() => { choose(ask.lang, onHome); setGone(true); }}>{ask.yes}</button>
        <button type="button" className="pill" lang="en" onClick={no}>{ASK_NO}</button>
      </span>
    </section>
  );
}
export { ASKS };
