// DT167 (0.3.9, board Stories119 versions 1 and 2; Coach Milan 30 October 08:47 to 09:59): Your summary, the last row of Me and
// where the steps end. Every answer once, what it does, whether Chef Mealan reads it; then Plan your week, Craft your first
// meal, What your coach sees, Save as PDF. What your coach sees is chosen once, part by part, and kept up to date with what
// changed (SharePublisher); the coach reads it under the client (SharedProfileCard).
import { w, mealV, dateV, dateText } from "../words";
import { getLang, inLang, useLang, type Lang } from "../lang";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AppApi, MenuSection } from "./api";
import { summaryOf, sharedParts, sharedRows, nextShared, changesSince, SHARE_PARTS, type SummaryIn, type SummaryPart, type ShareId, type SharedProfile, type SummaryRow, type ProfileChange } from "../summary";
import { calculate, formulaFor, lifestyleOf } from "../personal";
import { slotsOf } from "../slots";
import { goalName } from "../goal";
import { REGIONS } from "../moments";
import { COACH_NAME } from "../components/Mark";
import { loadSharedProfile, saveSharedProfile } from "../cloud";
import { coachDemoOn } from "../coachDemo";

export function summaryInOf(p: AppApi): SummaryIn {
  const band = p.goal?.band ?? null;
  const calc = band ? calculate(p.personal, band, p.formula ?? formulaFor(p.personal)) : null;
  const g = p.state.goals as { calories?: number; protein?: number; fats?: number };
  const days = calc?.weekdays ? calc.weekdays.map((d) => ({ kcal: d.kcal, carbs: d.carbs })) : [];
  return {
    personal: p.personal, safety: p.safety, tasteWords: p.state.preferences ?? "",
    goal: band ? { band, name: goalName(band), setBy: p.goal?.setBy === "coach" ? (p.goal.coachName || p.coachLabel) : "you", at: p.goal?.setAt ?? null } : null,
    avg: g.calories ? { kcal: g.calories, protein: g.protein ?? 0, fats: g.fats ?? calc?.fats ?? 0 } : null,
    days, protein: calc ? { min: calc.proteinMin, max: calc.proteinMax, lo: calc.proteinLo, hi: calc.proteinHi } : null,
    pdRef: p.pdRef, burn: calc?.bmr ?? null,
    home: p.region ? REGIONS.find((r) => r.id === p.region)?.name ?? null : null,
    places: p.placesOn.filter((id) => id !== p.region).map((id) => REGIONS.find((r) => r.id === id)?.name ?? id),
  };
}
const FROM: Record<SummaryPart["id"], MenuSection> = { you: "profile", goal: "goal", day: "life", eat: "life", week: "week", shop: "shop", health: "profile" };
const chip = (t: string, cls = "") => <span className={`sum-tag ${cls}`}>{t}</span>;
function Row({ r }: { r: SummaryRow }) {
  return (
    <div className="sum-row">
      <div><small className="sum-label">{r.label}{r.health && chip(w("summary.healthData"), "sum-health")}</small><b>{r.value}</b><small className="sum-does">{r.does}</small></div>
      <small className={`sum-chef ${r.chef ? "on" : ""}`}>{r.chef ? w("summary.chefReads") : w("summary.numbersOnly")}</small>
    </div>
  );
}
export function SummaryParts({ parts, open }: { parts: SummaryPart[]; open?: (s: MenuSection) => void }) {
  return <>{parts.map((s) => (
    <div key={s.id} className="sum-part">
      <div className="seg-head"><b>{s.title}</b><small>{w("summary.fromPage", { from: s.from })}{open && <> <button type="button" className="link" onClick={() => open(FROM[s.id])}>{w("summary.change")}</button></>}</small></div>
      <section className="card seg">{s.rows.map((r) => <Row key={r.key} r={r} />)}</section>
    </div>
  ))}</>;
}

export function SummaryPanel(p: AppApi) {
  const [sharing, setSharing] = useState(false);
  const lang = useLang();
  const parts = useMemo(() => summaryOf(summaryInOf(p)), [p.personal, p.safety, p.state.goals, p.state.preferences, p.goal, p.region, p.placesOn, p.pdRef, p.formula, lang]);
  // the example coach (?coachdemo, never on the live app) lets the choice be seen and tested without accounts
  const coach = p.profile.coachId ? (p.profile.coachName || COACH_NAME) : coachDemoOn() ? COACH_NAME : null;
  if (sharing) return <CoachSharePanel {...p} coachName={coach ?? COACH_NAME} close={() => { setSharing(false); window.scrollTo(0, 0); }} />;
  const next = (() => { const now = new Date(), hm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`, sl = slotsOf(lifestyleOf(p.personal)); return sl.find((s) => s.time >= hm) ?? sl[0] ?? null; })();
  const shared = sharedParts(p.personal.coachShare);
  return (
    <div className="summary">
      <p className="small muted page-why">{w("summary.everythingYouToldChefMealan")}</p>
      {/* DT209 version 2 (0.3.50, board Stories156; Coach Milan 22:44 to 23:52 Go): Save as PDF and what your coach sees are about
          the summary itself, so they sit at the top, small; the page ends on the way on, Next: Plan your week */}
      <div className="button-row sum-buttons">
        {coach && <button className="pill pill-small" onClick={() => { setSharing(true); window.scrollTo(0, 0); }}>{w("summary.chooseWhat", { coach })}</button>}
        <button className="pill pill-small" onClick={() => window.print()}>{w("summary.saveAsPdf")}</button>
      </div>
      <SummaryParts parts={parts} open={(s) => p.openMenu(s, "summary")} />
      <div className="next-step sum-next">
        <button className="pill pill-primary pill-wide" onClick={() => p.tabFromPage("plan")}>{w("summary.nextPlanYourWeek")}</button>
        <small className="muted">{w("summary.fillYourSlotsWithChef")}</small>
        <button type="button" className="link sum-plate" onClick={() => p.tabFromPage("journey")}>{next ? w("summary.orCraftAt", { meal: mealV(next.name, true), time: next.time }) : w("summary.orCraft")}</button>
      </div>
      <small className="muted sum-foot">{coach ? (shared.length === SHARE_PARTS.length ? w("summary.footAll", { coach }) : w("summary.footSome", { coach, n: shared.length, m: SHARE_PARTS.length })) : w("summary.yourSummaryChangesWhenYour")}</small>
    </div>
  );
}

// What your coach sees: chosen once, part by part; health data, diet, alcohol and your own words off until switched on
export function CoachSharePanel(p: AppApi & { coachName: string; close: () => void }) {
  const [sel, setSel] = useState<ShareId[]>(() => sharedParts(p.personal.coachShare));
  const save = () => {
    const prev = p.personal.coachShare, at = new Date().toISOString();
    const on: Partial<Record<ShareId, string>> = {}; const off: ShareId[] = [];
    for (const part of SHARE_PARTS) { if (part.fixed) continue; if (sel.includes(part.id)) on[part.id] = prev?.on?.[part.id] ?? at; else off.push(part.id); }
    p.setPersonal({ ...p.personal, coachShare: { on, off, savedAt: at } });
    p.notify(w("summary.savedCoach", { coach: p.coachName }));
    p.close();
  };
  const tog = (id: ShareId) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const group = (health: boolean) => SHARE_PARTS.filter((x) => !!x.health === health).map((x) => (
    <div key={x.id} className="share-row">
      <div><b>{x.name}{x.health && chip(w("summary.healthData"), "sum-health")}</b><small>{x.why}</small></div>
      {x.fixed ? <button type="button" className="choice on" disabled aria-label={w("summary.ariaSees", { part: x.name })}>{w("summary.seesIt")}</button>
        : <button type="button" className={`choice ${sel.includes(x.id) ? "on" : ""}`} aria-pressed={sel.includes(x.id)} aria-label={w(sel.includes(x.id) ? "summary.ariaOn" : "summary.ariaOff", { part: x.name })} onClick={() => tog(x.id)}>{sel.includes(x.id) ? w("summary.on") : w("summary.off")}</button>}
    </div>
  ));
  return (
    <div className="coach-share">
      <h3 className="sum-h">{w("summary.whatCoachSees", { coach: p.coachName })}</h3>
      <p className="small muted page-why">{w("summary.chooseOnce", { coach: p.coachName })}</p>
      <section className="card">{group(false)}</section>
      <section className="card">{group(true)}</section>
      <div className="button-row"><button className="pill pill-primary" onClick={save}>{w("summary.save")}</button><button className="pill" onClick={p.close}>{w("summary.cancel")}</button></div>
      <small className="muted sum-foot">{w("summary.aChangeToAPart")}</small>
    </div>
  );
}

// The person's phone keeps the coach's copy up to date: the shared rows now, and what changed against the last copy
export function SharePublisher(p: AppApi) {
  const prev = useRef<SharedProfile | null | undefined>(undefined);
  const uid = p.user?.uid ?? null, coachId = p.profile.coachId ?? null;
  const shared = sharedParts(p.personal.coachShare);
  const lang = useLang();
  const both = useMemo(() => ({ en: inLang("en", () => sharedRows(summaryOf(summaryInOf(p)), shared)), sr: inLang("sr-Latn", () => sharedRows(summaryOf(summaryInOf(p)), shared)), de: inLang("de", () => sharedRows(summaryOf(summaryInOf(p)), shared)) }), [p.personal, p.safety, p.state.goals, p.state.preferences, p.goal, p.region, p.placesOn, p.pdRef, p.formula]);
  const rows = both.en;
  const key = JSON.stringify([rows.map((r) => [r.key, r.value, r.does]), both.sr.map((r) => [r.label, r.value, r.does]), both.de.map((r) => [r.label, r.value, r.does]), shared, lang]);
  useEffect(() => {
    if (!uid || !coachId || !p.cloudEnabled) return;
    let gone = false;
    const t = setTimeout(async () => {
      try {
        if (prev.current === undefined) prev.current = await loadSharedProfile(uid);
        const next = nextShared(prev.current ?? null, rows, shared, new Date(), { rowsSr: both.sr, rowsDe: both.de, lang });
        if (!next || gone) return;
        await saveSharedProfile(uid, next); prev.current = next;
      } catch { /* tried again on the next change */ }
    }, 3000);
    return () => { gone = true; clearTimeout(t); };
  }, [uid, coachId, key]);
  return null;
}

// On the coach's side: the shared parts as they are today, what changed since the coach last looked on top
const seenKey = (uid: string) => `chefmealan-profile-seen-${uid}`;
export const profileSeen = (uid: string): string | null => { try { return localStorage.getItem(seenKey(uid)); } catch { return null; } };
export function newProfileChanges(row: { uid: string; profileShare?: SharedProfile | null }): number { return changesSince(row.profileShare, profileSeen(row.uid)).length; }
const PART_OF: Record<string, SummaryPart["id"]> = { body: "you", weighIns: "you", goal: "goal", avg: "goal", carbsFat: "goal", pd: "goal", trainingAge: "goal", weekdays: "day", travel: "day", sleep: "day", steps: "day", meals: "eat", where: "eat", diet: "eat", dietOther: "eat", alcohol: "eat", taste: "eat", tasteWords: "eat", plan: "week", places: "shop", kitchens: "shop", equipment: "shop", situations: "health", allergies: "health" };
const TITLES: Record<SummaryPart["id"], string> = { you: "You", get goal() { return w("summary.goalAndNumbers"); }, get day() { return w("summary.yourDay"); }, get eat() { return w("summary.howYouEat"); }, get week() { return w("summary.trainingWeek"); }, get shop() { return w("summary.whereYouShopAndCook"); }, get health() { return w("summary.healthQuestions"); } };
// at the top of the client's page, where the check-in starts: what changed since the coach last looked; opening marks it seen
export function ProfileChanges({ uid, sp, name }: { uid: string; sp: SharedProfile | null | undefined; name: string }) {
  const [seen] = useState(() => profileSeen(uid));
  useEffect(() => { if (sp?.updatedAt) try { localStorage.setItem(seenKey(uid), new Date().toISOString()); } catch { /* fine */ } }, [uid, sp?.updatedAt]);
  // newest day first; within one save, in the summary's order (the wake-up before the meals it moved)
  const changed = changesSince(sp, seen).slice().sort((a, b) => b.at.localeCompare(a.at));
  if (!changed.length) return null;
  const d = (iso: string) => dateText(new Date(iso), { day: "numeric", month: "short" });
  // in the coach's language; a switch of language is its own line
  const textOf = (c: ProfileChange) => (c.lang ? w(c.lang === "sr-Latn" ? "summary.langToSr" : c.lang === "de" ? "summary.langToDe" : "summary.langToEn", { name }) : getLang() === "sr-Latn" ? c.textSr ?? c.text : getLang() === "de" ? c.textDe ?? c.text : c.text);
  return <section className="card profile-changes"><b>{w("summary.whatChangedSinceYouLast")}</b>{changed.map((c, i) => <div key={i} className="change-row"><small className="change-at">{d(c.at)}</small><small>{textOf(c)}</small></div>)}<small className="muted">{w("summary.inTheProfileBelow")}</small></section>;
}
export function SharedProfileCard({ name, sp }: { name: string; sp: SharedProfile | null | undefined }) {
  const mine = useLang();
  const [theirs, setTheirs] = useState(false);
  if (!sp || !sp.rows?.length) return <section className="card shared-profile"><b>{w("summary.cardTitle", { name })}</b><small>{w("summary.cardNone", { name })}</small></section>;
  // DT237 v2: the card in the coach's language; a button shows it in the client's, when that is another and its copy is there
  // DT238 (0.3.92): and Deutsch
  const rowsIn = (l: Lang) => (l === "sr-Latn" ? sp.rowsSr : l === "de" ? sp.rowsDe : sp.rows);
  const other: Lang | null = sp.lang && sp.lang !== mine && (sp.lang === "en" || rowsIn(sp.lang)) ? sp.lang : null;
  const shown: Lang = theirs && other ? other : mine;
  const rows = rowsIn(shown) ?? sp.rows;
  const notShared = SHARE_PARTS.filter((x) => !sp.parts.includes(x.id)).map((x) => x.name.toLowerCase());
  const d = (iso: string) => dateV(new Date(iso), { day: "numeric", month: "short" });
  const body = inLang(shown, () => (Object.keys(TITLES) as SummaryPart["id"][]).map((id) => ({ id, title: TITLES[id], rows: rows.filter((r) => (PART_OF[r.key] ?? "goal") === id) })).filter((x) => x.rows.length)
    .map((s) => <div key={s.id} className="sum-part"><div className="seg-head"><b>{s.title}</b></div><section className="card seg">{s.rows.map((r) => <Row key={r.key} r={r} />)}</section></div>));
  return (
    <div className="shared-profile">
      <p className="label">{w("summary.cardTitle", { name })}</p>
      <small className="muted">{w("summary.cardAsToday", { name, date: d(sp.updatedAt) })}</small>
      {other && <div className="button-row sum-theirs"><button type="button" className="pill" aria-pressed={theirs} onClick={() => setTheirs((t) => !t)}>{theirs ? w(mine === "sr-Latn" ? "summary.backToSr" : mine === "de" ? "summary.backToDe" : "summary.backToEn") : w(other === "sr-Latn" ? "summary.seeInSr" : other === "de" ? "summary.seeInDe" : "summary.seeInEn", { name })}</button></div>}
      {body}
      {notShared.length > 0 && <section className="card"><b>{w("summary.notShared")}</b><small>{w("summary.notSharedLine", { list: notShared.join(", ").replace(/^./, (x) => x.toUpperCase()), name })}</small></section>}
      <div className="button-row"><button className="pill" onClick={() => window.print()}>{w("summary.saveAsPdfAsOf")}</button></div>
    </div>
  );
}
