// DT260 (0.3.114, board Stories195): How to in the Menu, the card on Today after a release, and the coach's view of what
// each tester tried. The list, one situation opened, and Didn't work with a line for Coach Milan.
import { useEffect, useState } from "react";
import { Lightbulb, ChevronRight } from "lucide-react";
import { w, wn, type WordKey } from "../words";
import { VERSION } from "../version";
import { useKept } from "../kept";
import { SITUATIONS, GROUPS, BETA, HOWTO_KEY, LATER_KEY, isNew, triedCount, newToTry, showOnToday, untried, type HowMarks, type Situation } from "../howTo";
import type { AppApi } from "../screens/api";
import { ScanBarcode, UtensilsCrossed, Camera, CookingPot, Images, Target, Mic, Languages, CalendarClock, Play, Frown, Annoyed, Meh, Smile, Laugh } from "lucide-react";

// DT329 (0.3.166, board DT329; Coach Milan 19 November, Go 18:55): the situations' icons from the bar's set (no emoji); How
// did it go? as five faces, filled like an emoji, 1 hard to 5 easy (18:25 to 18:51)
const ICONS: Record<string, typeof Camera> = { ScanBarcode, UtensilsCrossed, Camera, CookingPot, Images, Target, Mic, Languages, CalendarClock };
const Icon = ({ n, size }: { n: string; size: number }) => { const C = ICONS[n]; return C ? <C size={size} /> : null; };
const FACES = [Frown, Annoyed, Meh, Smile, Laugh];
export const Face = ({ r, size = 18 }: { r?: number; size?: number }) => { const F = r ? FACES[r - 1] : null; return F ? <span className={`ht-face ht-said${r}`}><F size={size} aria-hidden="true" /></span> : null; };

const k = (s: string) => s as WordKey;
const stepsOf = (s: Situation) => Array.from({ length: s.steps }, (_, i) => w(k(`howto.${s.id}.s${i + 1}`)));
const dayOf = (iso: string) => { try { return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" }); } catch { return ""; } };
export const useHowMarks = () => useKept<HowMarks>(HOWTO_KEY, {});
const tell = (id: string, s: "tried" | "didnt" | null, note?: string, r?: number) =>
  fetch("/api/howto", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, s, note, r, v: VERSION }) }).catch(() => {});

// the Menu's row under Me (0.3.116): How to, with how many you tried and how many are new
export function HowToRow({ open }: { open: () => void }) {
  const [marks] = useHowMarks();
  const n = newToTry(marks).length;
  const sub = [BETA ? w("howto.triedOf", { n: triedCount(marks), total: SITUATIONS.length }) : "", n ? wn("howto.newN", n) : ""].filter(Boolean).join(" · ");
  return (
    <button className="menu-row howto-row" onClick={open}><span className="menu-icon"><Lightbulb size={20} /></span>
      <span className="menu-row-text"><b>{w("howto.title")}</b>{sub && <small>{sub}</small>}</span><ChevronRight size={18} /></button>
  );
}

// on Today, below the title and the goal: the new ways, after a release that brought one
export function HowToToday({ open }: { open: () => void }) {
  const [marks] = useHowMarks();
  const [later, setLater] = useKept<string | null>(LATER_KEY, null);
  if (!showOnToday(marks, VERSION, later)) return null;
  const fresh = newToTry(marks);
  return (
    <section className="card howto-today">
      <b>{wn("howto.newWays", fresh.length)}</b>
      <p>{fresh.map((s) => w(k(`howto.${s.id}.title`))).join(". ")}.</p>
      <div className="button-row"><button className="pill pill-small pill-primary ht-see" onClick={open}>{w("howto.seeHow")}</button><button className="link ht-later" onClick={() => setLater(VERSION)}>{w("howto.notNow")}</button></div>
    </section>
  );
}

export function HowToScreen(p: AppApi & { closeMenu: () => void }) {
  const [marks, setMarks] = useHowMarks();
  const [open, setOpen] = useState<Situation | null>(null);
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [rate, setRate] = useState(false);
  const [watch, setWatch] = useState(false);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [open, asking, rate]);
  useEffect(() => { setWatch(false); }, [open]);
  const mark = (s: Situation, st: "tried" | "didnt" | null, n?: string, r?: number) => {
    const next = { ...marks }; if (st) next[s.id] = { s: st, at: new Date().toISOString(), ...(n ? { note: n } : {}), ...(r ? { r } : {}), v: VERSION }; else delete next[s.id];
    setMarks(next); void tell(s.id, st, n, r);
  };
  const go = (s: Situation) => { if (s.go.hold) { p.closeMenu(); p.openCamMenu(); } else if (s.go.menu) p.openMenu(s.go.menu); else if (s.go.tab) { p.closeMenu(); p.setTab(s.go.tab); } };
  // DT329 (Coach Milan 18:17): it is about doing it. I did it asks how it went: a scale of 1 to 5 and a line of your own
  if (open && rate) return (
    <section className="card howto-ask ht-rate">
      <h3>{w("howto.howWent")}</h3>
      <p>{w("howto.howWentLine", { title: w(k(`howto.${open.id}.title`)) })}</p>
      <div className="ht-scale" role="radiogroup" aria-label={w("howto.howWent")}>{FACES.map((F, i) => { const n = i + 1; return <button key={n} role="radio" aria-checked={rating === n} aria-label={w(n === 1 ? "howto.faceHard" : n === 5 ? "howto.faceEasy" : "howto.faceN", { n })} className={`choice ht-r ht-r${n} ${rating === n ? "on" : ""}`} onClick={() => setRating(n)}><F size={28} aria-hidden="true" /></button>; })}</div>
      <div className="ht-ends"><small>{w("howto.scaleHard")}</small><small>{w("howto.scaleEasy")}</small></div>
      <label className="ht-noteLabel">{w("howto.anything")}<textarea className="ht-note" value={note} maxLength={600} onChange={(e) => setNote(e.target.value)} /></label>
      <button className="pill pill-primary pill-wide ht-send" disabled={!rating} onClick={() => { mark(open, "tried", note.trim() || undefined, rating!); setRate(false); setNote(""); setRating(null); p.notify(w("howto.sent")); }}>{w("howto.send")}</button>
      <button className="link ht-cancel" onClick={() => setRate(false)}>{w("howto.cancel")}</button>
    </section>
  );
  if (open && asking) return (
    <section className="card howto-ask">
      <h3>{w("howto.whatHappened")}</h3>
      <p>{w("howto.whatLine", { title: w(k(`howto.${open.id}.title`)) })}</p>
      <textarea className="ht-note" value={note} maxLength={600} onChange={(e) => setNote(e.target.value)} aria-label={w("howto.whatHappened")} />
      <button className="pill pill-primary pill-wide ht-send" disabled={!note.trim()} onClick={() => { mark(open, "didnt", note.trim()); setAsking(false); setNote(""); p.notify(w("howto.sent")); }}>{w("howto.send")}</button>
      <button className="link ht-cancel" onClick={() => setAsking(false)}>{w("howto.cancel")}</button>
    </section>
  );
  if (open) {
    const m = marks[open.id];
    return (
      <section className="card howto-one">
        <button className="link ht-back" onClick={() => setOpen(null)}>{w("howto.back")}</button>
        <span className="ht-big" aria-hidden="true"><Icon n={open.icon} size={28} /></span>
        <h3>{w(k(`howto.${open.id}.title`))}</h3>
        <p>{w(k(`howto.${open.id}.what`))}</p>
        <ol className="ht-steps">{stepsOf(open).map((t, i) => <li key={i}><b aria-hidden="true">{i + 1}</b><span>{t}</span></li>)}</ol>
        {open.video && (watch
          ? <figure className="ht-video"><video src={`/landing/way-${open.video.id}.mp4`} poster={`/landing/way-${open.video.id}.webp`} controls autoPlay muted playsInline preload="none" />{open.video.to && <figcaption>{w("howto.videoSteps", { to: open.video.to })}</figcaption>}</figure>
          : <button className="pill ht-watch" onClick={() => setWatch(true)}><Play size={16} />{w("howto.watch")}</button>)}
        <button className="pill pill-primary pill-wide ht-try" onClick={() => go(open)}>{w("howto.tryIt")}</button>
        <div className="button-row">
          <button className={`pill pill-small ht-tried ${m?.s === "tried" ? "on" : ""}`} aria-pressed={m?.s === "tried"} onClick={() => { if (m?.s === "tried") mark(open, null); else { setRating(null); setNote(""); setRate(true); } }}>{w("howto.triedIt")}</button>
          <button className={`pill pill-small ht-didnt ${m?.s === "didnt" ? "on" : ""}`} aria-pressed={m?.s === "didnt"} onClick={() => { setNote(m?.note ?? ""); setAsking(true); }}>{w("howto.didnt")}</button>
        </div>
        {m?.s === "tried" && m.r && <small className="ht-yournote ht-saidface"><Face r={m.r} />{w("howto.yourRate", { r: m.r })}{m.note ? ` · “${m.note}”` : ""}</small>}
        {m?.s === "didnt" && m.note && <small className="ht-yournote">“{m.note}”</small>}
      </section>
    );
  }
  const n = triedCount(marks);
  return (
    <div className="howto">
      <p>{w("howto.intro")}</p>
      {BETA && <div className="card ht-beta"><b>{w("howto.beta", { n, total: SITUATIONS.length })}</b><div className="ht-bar" role="progressbar" aria-valuemin={0} aria-valuemax={SITUATIONS.length} aria-valuenow={n}><span style={{ width: `${(100 * n) / SITUATIONS.length}%` }} /></div><small>{w("howto.betaLine")}</small></div>}
      {GROUPS.map((g) => (
        <div key={g} className="ht-group">
          <p className="label">{w(k(`howto.group.${g}`))}</p>
          {SITUATIONS.filter((s) => s.group === g).map((s) => (
            <button key={s.id} className={`card ht-sit ht-${s.id}`} onClick={() => setOpen(s)}>
              <span className="ht-icon" aria-hidden="true"><Icon n={s.icon} size={22} /></span>
              <span className="ht-text"><b>{w(k(`howto.${s.id}.title`))}</b>{s.video && <span className="ht-vid"><Play size={12} />{w("howto.video")}</span>}<small>{w(k(`howto.${s.id}.line`))}</small></span>
              {/* DT329 (Coach Milan 18:08): New at the top right of the card; Tried or Didn't work under it */}
              {(isNew(s) || marks[s.id]) && <span className="ht-side">{isNew(s) && <span className="ht-new">{w("howto.new")}</span>}
                {marks[s.id]?.s === "tried" && <span className="ht-done">{w("howto.tried")}</span>}
                {marks[s.id]?.s === "didnt" && <span className="ht-bad">{w("howto.didnt")}</span>}</span>}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

// for Coach Milan, under Clients: who tried what, and every Didn't work with its note
type Tester = { uid: string; name: string; email: string; items: HowMarks };
export function HowToTesters() {
  const [list, setList] = useState<Tester[] | null>(null);
  const [one, setOne] = useState<Tester | null>(null);
  // only the owner's account reads them; for anyone else the section stays away
  useEffect(() => { fetch("/api/howto").then((r) => (r.ok ? r.json() : null)).then((d) => setList(d ? d.testers ?? [] : null)).catch(() => setList(null)); }, []);
  if (!list) return null;
  const name = (t: Tester) => t.name || t.email || w("howto.someone");
  if (one) return (
    <section className="card howto-tester">
      <button className="link ht-back" onClick={() => setOne(null)}>{w("howto.backTesters")}</button>
      <h3>{w("howto.testerHead", { name: name(one), n: triedCount(one.items), total: SITUATIONS.length })}</h3>
      {SITUATIONS.map((s) => { const m = one.items[s.id]; return (
        <div key={s.id} className="ht-trow"><b>{w(k(`howto.${s.id}.title`))}</b>
          {!m ? <small className="ht-notyet">{w("howto.notYet")}</small> : m.s === "tried" ? <small className="ht-done">{w("howto.triedOn", { day: dayOf(m.at) })}</small> : <small className="ht-bad">{w("howto.didntOn", { day: dayOf(m.at) })}</small>}
          {m?.s === "tried" && m.r && <small className="ht-saidface ht-rated"><Face r={m.r} />{w("howto.rated", { r: m.r })}</small>}
          {m?.note && <small className="ht-q">“{m.note}”</small>}
        </div>); })}
    </section>
  );
  const gap = untried(list);
  return (
    <>
      <p className="label">{w("howto.testers")}</p>
      <section className="card howto-testers">
        {list.length === 0 && <small>{w("howto.noTesters")}</small>}
        {list.map((t) => { const bad = SITUATIONS.filter((s) => t.items?.[s.id]?.s === "didnt"); return (
          <button key={t.uid} className="ht-tester" onClick={() => setOne(t)}>
            <span><b>{name(t)}</b>{bad.map((s) => <small key={s.id} className="ht-bad">{w(k(`howto.${s.id}.title`))}: {t.items[s.id].note ?? ""}</small>)}</span>
            <small className="ht-count">{w("howto.triedOf", { n: triedCount(t.items ?? {}), total: SITUATIONS.length })}</small>
          </button>); })}
        {gap && list.length > 0 && <small className="ht-gap">{w("howto.noOneYet", { title: w(k(`howto.${gap.id}.title`)) })}</small>}
      </section>
    </>
  );
}
