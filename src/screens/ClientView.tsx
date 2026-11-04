// DT188 (0.3.30, board Stories137; Coach Milan 31 October 12:56 to 13:00, 16:08, 16:26 Go): the coach is one account with two
// views. My day is the app as everyone has it. My clients keeps the bar's order and swaps the centre, Plate for Clients;
// Today, Plan and Recipes then show the chosen client's, read-only and as the client sees them, and the coach can only
// suggest: a planned snack, a page from Explorer, a note or a recipe. The title stays My clients; the name sits under it.
// The switch is at the top of Today, remembered until switched back. Buttons 44 px or more; labels 12 px or more.
import { numLocale, w } from "../words";
import { useMemo, useState } from "react";
import type { AppApi, Tab } from "./api";
import type { ClientRow } from "../cloud";
import { sendCoachNote } from "../cloud";
import { coachDemoOn, demoRows } from "../coachDemo";
import { useKept } from "../kept";
import { ymd } from "../plan";
import { wordsOf } from "../dayLines";
import { answerWords, suggestTitle, type CoachNote, type Suggest } from "../coachNotes";
import { BODY_PAGES, SITUATION_PAGES } from "../explorerBody";
import { CardAnswer } from "./CardAnswer";

const first = (name: string) => name.split(" ")[0];
const longDay = (k: string) => new Date(`${k}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }).replace(",", "");
const plusDays = (k: string, n: number) => { const d = new Date(`${k}T12:00:00`); d.setDate(d.getDate() + n); return ymd(d); };
const MARK: Record<string, string> = { plan: "by the plan", swapped: "swapped", skipped: "skipped", missed: "missed", open: "open" };

export function CoachSwitch({ p }: { p: AppApi }) {
  return (
    <div className="moments coach-switch" role="radiogroup" aria-label={w("client.whichView")}>
      <button type="button" role="radio" aria-checked={p.coachView === "day"} className={`choice ${p.coachView === "day" ? "on" : ""}`} onClick={() => p.setCoachView("day")}>{w("client.myDay")}</button>
      <button type="button" role="radio" aria-checked={p.coachView === "clients"} className={`choice ${p.coachView === "clients" ? "on" : ""}`} onClick={() => { p.setCoachView("clients"); p.setTab("clients"); }}>{w("client.myClients")}</button>
    </div>
  );
}

// the pages a coach can send: The body's families and members, the situations, the nutrient families
const PAGES: Suggest["page"][] = [
  ...Object.values(BODY_PAGES).map((pg) => ({ part: "body" as const, id: pg.family, member: pg.key, name: `The body: ${pg.name}` })),
  ...Object.values(SITUATION_PAGES).filter(Boolean).map((pg) => ({ part: "situations" as const, id: pg!.id, name: `Situations: ${pg!.name}` })),
  { part: "nutrients", id: "protein", name: "Nutrients: Protein" }, { part: "nutrients", id: "fats", name: "Nutrients: Fats" }, { part: "nutrients", id: "carbs", name: "Nutrients: Carbs" }, { part: "nutrients", id: "micros", name: "Nutrients: Micros" },
];

export function ClientView({ p, tab }: { p: AppApi; tab: Tab }) {
  const demo = coachDemoOn();
  const [kept, keep] = useKept<ClientRow[]>(`clients-${p.user?.uid ?? "local"}`, []);
  const [demoList, setDemoList] = useState<ClientRow[] | null>(null);
  const rows = demo ? demoList ?? demoRows() : kept;
  const row = rows.find((r) => r.uid === p.coachClient) ?? null;
  const today = ymd(new Date());
  const coachName = p.user?.name?.split(" ")[0] || (demo ? "Milan" : "Coach");
  const patchNotes = (notes: CoachNote[]) => { const next = rows.map((r) => (r.uid === row!.uid ? { ...r, notes } : r)); if (demo) setDemoList(next); else keep(next); };
  const suggest = async (s: Suggest, text: string) => {
    if (!row) return;
    const note: CoachNote = { at: new Date().toISOString(), by: "coach", name: coachName, text, suggest: s };
    const notes = [...row.notes, note];
    try { if (!demo) await sendCoachNote(row.uid, notes); patchNotes(notes); p.notify(`Suggested. ${first(row.name)} sees it on Today as a tap.`); }
    catch (e: any) { p.setError(e.message || w("client.theSuggestionDidnTSend")); }
  };
  if (!row) return (
    <section className="card cv-pick" aria-label={w("client.noClientChosen")}>
      <b>{w("client.pickAClientOnClients")}</b>
      <small className="muted">{w("client.thenTodayPlanAndRecipes")}</small>
      <button type="button" className="pill pill-small pill-primary" onClick={() => p.setTab("clients")}>{w("client.openClients")}</button>
    </section>
  );
  const name = first(row.name);
  const head = (what: string) => (
    <div className="cv-head">
      <button type="button" className="link" onClick={() => { p.setCoachClient(null); p.setTab("clients"); }}>‹ Clients{p.waiting.length ? ` · ${p.waiting.length} waiting` : ""}</button>
      <h3 className="cv-name">{row.name}</h3>
      <small className="muted">{what}. What {name} sees, as {name} sees it.</small>
    </div>
  );
  if (tab === "home") return <ClientToday p={p} row={row} head={head("Today, read-only")} suggest={suggest} today={today} />;
  if (tab === "plan") {
    const days = Array.from({ length: 7 }, (_, i) => plusDays(today, i - 1));
    return (
      <>
        {head("Plan, read-only")}
        <section className="card cv-days" aria-label={`${name}'s plan`}>
          <b>{w("client.yesterdayTodayAndTheDays")}</b>
          {days.map((d) => { const l = row.days[d]; const wq = l ? wordsOf(l) : null; return (
            <div key={d} className="cv-day"><b>{d === today ? "Today" : longDay(d)}</b><small>{wq ? `${wq.status}${wq.detail ? ` · ${wq.detail}` : ""}` : w("client.nothingPlannedOrEaten")}{l?.training ? ` · ${l.training}` : ""}</small></div>
          ); })}
          <small className="muted cv-note">The plan is {name}'s. A change you want lands as a suggestion on Today, never on the plan itself.</small>
        </section>
      </>
    );
  }
  // recipes: what the client shared with the coach, by card
  const cards = [...row.feedback].sort((a: any, b: any) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 20);
  return (
    <>
      {head("Recipes, read-only")}
      <section className="card cv-days" aria-label={`${name}'s shared cards`}>
        <b>{w("client.sharedWithYou")}</b>
        {cards.length === 0 && <small className="muted">{name} has not shared a card yet. A card is shared from its own page, with a line to you.</small>}
        {cards.map((f: any) => <div key={f.id ?? f.createdAt} className="cv-day" id={`card-${f.id}`}><b>{f.meal?.title ?? "A meal"}</b><small>{longDay(ymd(new Date(f.createdAt)))}{f.shared?.reason ? ` · ${({ look: "look at this", ok: "was this OK?", help: "help me next time" } as Record<string, string>)[f.shared.reason]}` : ""}{f.notes ? ` · “${f.notes}”` : ""}</small>
          <CardAnswer row={row} card={f} coachName={coachName} send={async (notes) => { if (!demo) await sendCoachNote(row.uid, notes); patchNotes(notes); p.recountWaiting(); }} notify={p.notify} setError={p.setError} /></div>)}
        <small className="muted cv-note">To send {name} one of your recipes: open it on your Recipes, My day, and tap Send.</small>
      </section>
    </>
  );
}

export function ClientToday({ p, row, head, suggest, today }: { p: AppApi; row: ClientRow; head: React.ReactNode; suggest: (s: Suggest, text: string) => Promise<void>; today: string }) {
  const name = first(row.name);
  const l = row.days[today] ?? null;
  const [snack, setSnack] = useState("");
  const [time, setTime] = useState("16:00");
  const [pageIx, setPageIx] = useState(-1);
  const [busy, setBusy] = useState(false);
  const waiting = useMemo(() => [...row.notes].reverse().filter((n) => n.by === "coach" && n.suggest && (n.suggest.kind === "snack" || n.suggest.kind === "page")).slice(0, 6), [row.notes]);
  const send = async (s: Suggest, text: string) => { setBusy(true); try { await suggest(s, text); setSnack(""); setPageIx(-1); } finally { setBusy(false); } };
  return (
    <>
      {head}
      <section className="card cv-days" aria-label={`${name}'s day`}>
        <b>{longDay(today)}</b>
        {l ? <small className="muted">{Math.round(l.kcal).toLocaleString(numLocale())}{l.target ? ` of ${l.target.kcal.toLocaleString(numLocale())} kcal · protein ${l.protein} of ${l.target.protein} g` : " kcal"}</small> : <small className="muted">Nothing from {name} today yet.</small>}
        {l?.slots.map((s) => <div key={s.name} className="cv-day"><b>{s.name} {s.time}</b><small>{s.eaten ?? s.planned ?? w("client.nothingPlanned")}{s.eaten ? " · eaten" : s.planned ? " · planned" : ""}{s.mark !== "open" && s.mark !== "plan" ? ` · ${MARK[s.mark]}` : ""}</small></div>)}
        {l?.training && <small className="muted cv-note">Training: {l.training}</small>}
      </section>
      <section className="card cv-suggest" aria-label={w("client.suggest")}>
        <b>{w("client.suggest")}</b>
        <small className="muted">A suggestion lands on {name}'s Today as a tap. Nothing changes until {name} accepts. {name} can also say Not now, with a reason, and you see which.</small>
        <div className="cv-row">
          <b>{w("client.aPlannedSnack")}</b>
          <div className="cv-fields"><input className="search" aria-label={w("client.theSnack")} placeholder={w("client.skyrAndAFruit")} value={snack} onChange={(e) => setSnack(e.target.value)} /><input className="search cv-time" aria-label={w("client.atWhatTime")} type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
          <button type="button" className="pill pill-small pill-primary" disabled={busy || !snack.trim()} onClick={() => send({ kind: "snack", time }, snack.trim())}>{w("client.suggestTheSnack")}</button>
          <small className="muted">Lands on {name}'s Plan at {time} for this week when accepted; the Lifestyle default stays {name}'s own.</small>
        </div>
        <div className="cv-row">
          <b>{w("client.aPageFromExplorer")}</b>
          <select className="search" aria-label={w("client.whichPage")} value={pageIx} onChange={(e) => setPageIx(Number(e.target.value))}>
            <option value={-1}>{w("client.pickAPage")}</option>
            {PAGES.map((pg, i) => <option key={pg!.name} value={i}>{pg!.name}</option>)}
          </select>
          <button type="button" className="pill pill-small pill-primary" disabled={busy || pageIx < 0} onClick={() => send({ kind: "page", page: PAGES[pageIx]! }, PAGES[pageIx]!.name)}>{w("client.suggestThePage")}</button>
        </div>
        <small className="muted cv-note">A note and a recipe go as today: the note on Clients, {name}'s page; a recipe from your Recipes with Send.</small>
      </section>
      {waiting.length > 0 && (
        <section className="card cv-days" aria-label={w("client.suggested")}>
          <b>{w("client.suggested")}</b>
          {waiting.map((n) => <div key={n.at} className="cv-day"><b>{suggestTitle(n.suggest!, n.text)}</b><small>{longDay(ymd(new Date(n.at)))} · {answerWords(n)}</small></div>)}
        </section>
      )}
    </>
  );
}
