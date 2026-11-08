// DT260 (0.3.114, board Stories195): How to in the Menu, the card on Today after a release, and the coach's view of what
// each tester tried. The list, one situation opened, and Didn't work with a line for Coach Milan.
import { useEffect, useState } from "react";
import { Lightbulb, ChevronRight } from "lucide-react";
import { w, wn, type WordKey } from "../words";
import { VERSION } from "../version";
import { useKept } from "../kept";
import { SITUATIONS, GROUPS, BETA, HOWTO_KEY, LATER_KEY, isNew, triedCount, newToTry, showOnToday, untried, type HowMarks, type Situation } from "../howTo";
import type { AppApi } from "../screens/api";

const k = (s: string) => s as WordKey;
const stepsOf = (s: Situation) => Array.from({ length: s.steps }, (_, i) => w(k(`howto.${s.id}.s${i + 1}`)));
const dayOf = (iso: string) => { try { return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" }); } catch { return ""; } };
export const useHowMarks = () => useKept<HowMarks>(HOWTO_KEY, {});
const tell = (id: string, s: "tried" | "didnt" | null, note?: string) =>
  fetch("/api/howto", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, s, note, v: VERSION }) }).catch(() => {});

// the Menu's first row: How to, with how many you tried and how many are new
export function HowToRow({ open }: { open: () => void }) {
  const [marks] = useHowMarks();
  const n = newToTry(marks, VERSION).length;
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
  const fresh = newToTry(marks, VERSION);
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
  useEffect(() => { window.scrollTo({ top: 0 }); }, [open, asking]);
  const mark = (s: Situation, st: "tried" | "didnt" | null, n?: string) => {
    const next = { ...marks }; if (st) next[s.id] = { s: st, at: new Date().toISOString(), ...(n ? { note: n } : {}), v: VERSION }; else delete next[s.id];
    setMarks(next); void tell(s.id, st, n);
  };
  const go = (s: Situation) => { if (s.go.menu) p.openMenu(s.go.menu); else if (s.go.tab) { p.closeMenu(); p.setTab(s.go.tab); } };
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
        <span className="ht-big" aria-hidden="true">{open.icon}</span>
        <h3>{w(k(`howto.${open.id}.title`))}</h3>
        <p>{w(k(`howto.${open.id}.what`))}</p>
        <ol className="ht-steps">{stepsOf(open).map((t, i) => <li key={i}><b aria-hidden="true">{i + 1}</b><span>{t}</span></li>)}</ol>
        <button className="pill pill-primary pill-wide ht-try" onClick={() => go(open)}>{w("howto.tryIt")}</button>
        <div className="button-row">
          <button className={`pill pill-small ht-tried ${m?.s === "tried" ? "on" : ""}`} aria-pressed={m?.s === "tried"} onClick={() => mark(open, m?.s === "tried" ? null : "tried")}>{w("howto.triedIt")}</button>
          <button className={`pill pill-small ht-didnt ${m?.s === "didnt" ? "on" : ""}`} aria-pressed={m?.s === "didnt"} onClick={() => { setNote(m?.note ?? ""); setAsking(true); }}>{w("howto.didnt")}</button>
        </div>
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
              <span className="ht-icon" aria-hidden="true">{s.icon}</span>
              <span className="ht-text"><b>{w(k(`howto.${s.id}.title`))}</b>{isNew(s, VERSION) && <span className="ht-new">{w("howto.new")}</span>}<small>{w(k(`howto.${s.id}.line`))}</small></span>
              {marks[s.id]?.s === "tried" && <span className="ht-done">{w("howto.tried")}</span>}
              {marks[s.id]?.s === "didnt" && <span className="ht-bad">{w("howto.didnt")}</span>}
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
          {m?.s === "didnt" && m.note && <small className="ht-q">“{m.note}”</small>}
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
