import { BOOK_PAGES, BOOK_SOURCES } from "../bookPages";
import { w, numLocale, phoneLoc } from "../words";
import { waLink } from "../phone";
import { useEffect, useState } from "react";
import { useKept } from "../kept";
import { RefreshCw, Copy, Target, Send, UserPlus } from "lucide-react";
import { dayLog, loggedLine, daysAgo, dayLabel } from "../today";
import { dayNameAny, type Formula } from "../personal";
import { listClients, setClientGoal, setClientGoalFrom, sendCoachNote, setCheckinDay, sendRecipe, pinFormula, type ClientRow } from "../cloud";
import { ClientPage, ClientRowCard, coachNumbers, todayIndex, type CoachOps } from "./ClientWeek";
import { DAY_NAMES, type CoachNote } from "../coachNotes";
import { CardAnswer } from "./CardAnswer";
import { isoWeek, ymd } from "../plan";
import { SITUATIONS } from "../safety";
import { GoalHistory } from "./MenuScreen";
import { uid } from "../pilot";
import { BANDS, PACES, bandOf, goalLabel, goalsForBand, isBuild } from "../goal";
import { sheetOf } from "../goalGuide";
import { GoalSheet } from "../components/GoalSheet";
import { WeightTrend, WeightTrendPct } from "../components/Weight";
import { fixed, pdText, pdVal, pdTag, pdRange } from "../ui";
import { density } from "../pilot";
import { MOMENTS } from "../moments";
import type { AppApi } from "./api";
import { RecipeView } from "./RecipePages";
import { ClientToday } from "./ClientView";
import { bylineOf, type PublicRecipe } from "../recipes";
import { useBack } from "../back";

// The coach's area: check-ins today, the clients with their week, and a client's own page (0.2.6, canvas board CW).
export function CoachArea(p: AppApi & { demo?: ClientRow[] }) {
  const { user, setError, notify } = p;
  // the lists show at once from the last visit, then refresh (Milan, 11 October 2026)
  // a light copy is kept: the cards without their photos, which load again with the list
  const [keptRows, keepRows] = useKept<ClientRow[]>(`clients-${user?.uid ?? "local"}`, []);
  const [rows, setRowsState] = useState<ClientRow[]>(p.demo ?? keptRows);
  const setRows = (next: ClientRow[]) => { setRowsState(next); if (!p.demo) keepRows(next.map((r) => ({ ...r, feedback: r.feedback.map(({ photo, photos, ...f }: any) => f) }))); };
  // DT188 (0.3.30): the chosen client is kept by the app, so My clients' Today, Plan and Recipes show the same one
  const openId = p.coachClient, setOpenId = p.setCoachClient;
  const open = rows.find((r) => r.uid === openId) ?? null;
  const coachName = user?.name?.split(" ")[0] || (p.demo ? "Milan" : "Coach");
  async function refresh() {
    if (!user || p.demo) return;
    try { setRows(await listClients(user.uid)); }
    catch (e: any) { setError(e.message || w("coach.couldNotLoadClients")); }
  }
  // DT189: opening Clients no longer clears the badge; a row leaves Waiting for you only when handled
  useEffect(() => { refresh(); p.recountWaiting(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.uid]);
  // clients who are cooks (board RG5): one switch on the client's page
  const [cookList, setCookList] = useKept<string[]>(`cooks-${user?.uid ?? "local"}`, []);
  const cooks = new Set(cookList);
  const setCooks = (next: Set<string> | ((prev: Set<string>) => Set<string>)) => setCookList((prev) => [...(typeof next === "function" ? next(new Set(prev)) : next)]);
  const loadCooks = () => { if (!p.demo) fetch("/api/cooks").then((r) => r.json()).then((d) => setCooks(new Set(d.uids ?? []))).catch(() => {}); };
  useEffect(() => { loadCooks(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.uid]);
  const setCook = async (client: string, on: boolean) => {
    const res = await fetch("/api/cooks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uid: client, on }) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.error || w("coach.thatDidnTWorkTry"));
    setCooks((x) => { const y = new Set(x); on ? y.add(client) : y.delete(client); return y; });
  };
  // what the coach writes on a client's account; on the local demo the rows change on this phone only
  const patch = (uid: string, change: Partial<ClientRow>) => setRows(rows.map((r) => (r.uid === uid ? { ...r, ...change } : r)));
  const ops: CoachOps = {
    sendNote: async (row, notes) => { if (!p.demo) await sendCoachNote(row.uid, notes); patch(row.uid, { notes }); p.recountWaiting(); },
    setCheckin: async (row, day) => { if (!p.demo) await setCheckinDay(row.uid, day); patch(row.uid, { checkinDay: day }); },
    setGoal: async (row, band, from) => {
      const nums = coachNumbers(band), today = ymd(new Date());
      if (from <= today) {
        const b = bandOf(band)!;
        if (!p.demo) await setClientGoal(row.uid, { band }, goalsForBand(b), coachName);
        patch(row.uid, { goal: { band, setBy: "coach", coachName, setAt: new Date().toISOString(), source: "coach" }, goalsNow: { calories: nums.kcal, protein: nums.protein } });
      } else {
        if (!p.demo) await setClientGoalFrom(row.uid, { band, kcal: nums.kcal, protein: nums.protein, from, by: coachName });
        patch(row.uid, { nextGoal: { band, from, at: new Date().toISOString(), source: "coach", setBy: "coach", kcal: nums.kcal, protein: nums.protein, fats: 0, carbs: 0 } });
      }
    },
  };
  if (open) return (
    <ClientPage key={open.uid} row={open} coachName={coachName} ops={ops} back={() => setOpenId(null)} notify={notify} setError={setError} waitingCount={p.waiting.length}
      startOn={p.focusCard && open.feedback.some((f: any) => f.id === p.focusCard) ? "shared" : "week"}
      today={<ClientToday p={p} row={open} head={null} today={ymd(new Date())} suggest={async (s, text) => { const note = { at: new Date().toISOString(), by: "coach" as const, name: coachName, text, suggest: s }; try { await ops.sendNote(open, [...open.notes, note]); notify(`Suggested. ${open.name.split(" ")[0]} sees it on Today as a tap.`); } catch (e: any) { setError(e.message || w("coach.theSuggestionDidnTSend")); } }} />}
      tailFor={(part) => <ClientTail part={part} row={open} onSaved={refresh} setError={setError} notify={notify} confirmAi={p.confirmClientAi} sendNote={(notes) => ops.sendNote(open, notes)} coachName={coachName} focusCard={p.focusCard} onAnswered={() => p.recountWaiting()}
        cook={cooks.has(open.uid)} setCook={(on) => setCook(open.uid, on).then(() => notify(on ? `${open.name.split(" ")[0]} is a cook: they can send you recipes to publish.` : `${open.name.split(" ")[0]} is no longer a cook.`)).catch((e) => setError(e.message))} />} />
  );
  const ti = todayIndex();
  const due = rows.filter((r) => r.checkinDay === ti);
  // DT189 (0.3.31, Milan 17:42): Waiting for you at the top, one row per thing; tap opens it where it is answered
  const openWaiting = (wq: import("../coachNotes").Waiting) => {
    if (wq.kind === "card" || wq.kind === "reply") p.waitingSeen(wq.key);
    p.setFocusCard(wq.cardId ?? null); setOpenId(wq.uid);
  };
  const weekKey = ymd(isoWeek(new Date()).monday);
  const toSend = due.filter((r) => !r.notes.some((n) => n.by === "coach" && n.week === weekKey)).length;
  return (
    <>
      {p.waiting.length > 0 && (
        <section className="card waiting" aria-label={w("coach.waitingForYou")}>
          <b>Waiting for you ({p.waiting.length})</b>
          <small className="muted">{w("coach.everythingAClientSentOr")}</small>
          {p.waiting.slice(0, 12).map((wq) => (
            <button key={wq.key} type="button" className="menu-row" onClick={() => openWaiting(wq)}><span className="menu-row-text"><b>{wq.name} · {wq.what}</b><small>{wq.when}</small></span><span aria-hidden="true">›</span></button>
          ))}
        </section>
      )}
      {due.length > 0 && (
        <>
          <div className="approve-head"><p className="label">Check-ins today, {DAY_NAMES[ti]}</p><span className="approve-count">{toSend ? `${toSend} to send` : "all sent"}</span></div>
          {due.map((r) => <ClientRowCard key={r.uid} row={r} today open={() => setOpenId(r.uid)} />)}
        </>
      )}
      {(() => {
        const waiting = rows.filter((r) => r.review?.status === "waiting");
        if (!waiting.length) return null;
        return (
          <>
            <div className="approve-head"><p className="label">{w("coach.toApprove")}</p><span className="approve-count">{waiting.length} to approve</span></div>
            {waiting.map((r) => <ReviewCard key={r.uid} row={r} answer={async (status, note) => { await p.answerClientReview(r.uid, status, note, r.review!); await refresh(); }} open={() => setOpenId(r.uid)} />)}
          </>
        );
      })()}
      {/* DT207c (0.3.48; Coach Milan 1 November 19:42): what is going on with the clients first, the week's dots and progress;
          the codes and sign-ups below, under one label */}
      <p className="label">Clients ({rows.length})</p>
      {rows.length === 0 && <div className="strip">{w("coach.noClientsYetShareThe")}</div>}
      {rows.map((r) => <ClientRowCard key={r.uid} row={r} today={false} open={() => setOpenId(r.uid)} />)}
      {!p.demo && <WaitingRecipes notify={notify} setError={setError} />}
      {!p.demo && <p className="label coach-static">{w("coach.codesAndSignUps")}</p>}
      {!p.demo && <Invites {...p} />}
      {!p.demo && <AccessRequests {...p} />}
      {!p.demo && <WaitingList {...p} />}
      {!p.demo && <BookSignups {...p} />}
    </>
  );
}

// The rest of the client's page, under the week (0.2.6): the cook switch, safety, the formula, the goal sheet, the weight
// trend, the goal history and the shared cards. The goal is set above, in the goal section (CW8).
export function ClientTail({ part, row, onSaved, setError, notify, confirmAi, cook, setCook, sendNote, coachName, focusCard, onAnswered }: { part?: "goal" | "shared"; row: ClientRow; onSaved: () => void; setError: (m: string) => void; notify: (m: string) => void; confirmAi?: (uid: string, on: boolean) => Promise<void>; cook?: boolean; setCook?: (on: boolean) => void; sendNote?: (notes: CoachNote[]) => Promise<void>; coachName?: string; focusCard?: string | null; onAnswered?: () => void }) {
  // DT189: a card opened from Waiting for you scrolls into view
  useEffect(() => { if (!focusCard) return; const t = setTimeout(() => document.getElementById(`card-${focusCard}`)?.scrollIntoView({ block: "start", behavior: "smooth" }), 300); return () => clearTimeout(t); }, [focusCard]);
  const [formula, setFormula] = useState<import("../personal").Formula | null>(row.formula ?? null);
  const [photos, setPhotos] = useState<Map<string, string>>(new Map());
  // a shared plate's photo comes through our server, which checks that the card is shared with this coach (storage release 1)
  useEffect(() => {
    let stale = false; const urls: string[] = [];
    (async () => {
      for (const f of row.feedback.slice(0, 30)) {
        try {
          const r = await fetch(`/api/client-photo/${encodeURIComponent(row.uid)}/${encodeURIComponent(f.id)}`);
          if (!r.ok || stale) continue;
          const url = URL.createObjectURL(await r.blob()); urls.push(url);
          setPhotos((m) => new Map(m).set(`fb:${f.id}`, url));
        } catch { /* no photo for this card */ }
      }
    })();
    return () => { stale = true; urls.forEach((u) => URL.revokeObjectURL(u)); };
  }, [row.uid, row.feedback]);
  const pdOf = (items: any[]) => density(items.reduce((n, i) => n + (i.food.protein ?? 0) * i.grams / 100, 0), items.reduce((n, i) => n + (i.food.calories ?? 0) * i.grams / 100, 0));
  const kcalOf = (items: any[]) => Math.round(items.reduce((n, i) => n + (i.food.calories ?? 0) * i.grams / 100, 0));
  return (
    <div className="client-tail">
        {/* DT210 (0.3.50): the client's page shows this in two of its tabs, Goal and Shared */}
        {part !== "shared" && <>
        {setCook && (
          <label className="cook-switch">
            <span><b>{w("coach.cook")}</b><small>{w("coach.canSendYouRecipesTo")}</small></span>
            <input type="checkbox" role="switch" aria-label={`${row.name.split(" ")[0]} is a cook`} checked={Boolean(cook)} onChange={(e) => setCook(e.target.checked)} />
          </label>
        )}
        {(() => {
          // safety: situation and date only, never the person's words; the coach confirms Mealan's chat for a flagged account
          const needs = row.flags.some((f) => f.situation === "eating");
          if (!needs && row.flags.length === 0) return null;
          return (
            <section className="card safety-sheet">
              <b>{w("coach.safety")}</b>
              {row.flags.length > 0 && <ul className="small">{row.flags.map((f, i) => <li key={i}>{SITUATIONS.find((x) => x.id === f.situation)?.label ?? f.situation} · {f.at}</li>)}</ul>}
              {needs && confirmAi && (
                <div className="button-row">
                  {row.aiConfirmedAt
                    ? <button className="pill pill-small" onClick={() => confirmAi(row.uid, false).then(onSaved).catch((e) => setError(e.message))}>Chef Mealan's chat is on · switch off</button>
                    : <button className="pill pill-small pill-primary" onClick={() => confirmAi(row.uid, true).then(onSaved).catch((e) => setError(e.message))}>{w("coach.confirmChefMealanSChat")}</button>}
                </div>
              )}
            </section>
          );
        })()}
        <div className="formula-row">
          <small>{w("coach.formula")}</small>
          {([[null, "Automatic"], ["mifflin", w("coach.mifflinStJeor")], ["katch", "Katch–McArdle"], ["schofield", "Schofield"], ...(row.measured && !row.flags.some((f) => f.situation === "eating") ? [["data", `From ${row.name.split(" ")[0]}'s data`]] : [])] as [Formula | null, string][]).map(([k, l]) => (
            <button key={l} className={`choice ${(formula ?? null) === k ? "on" : ""}`} onClick={async () => { try { await pinFormula(row.uid, k); setFormula(k); notify(k === "data" ? `${row.name}: the measured burn, fixed from today.` : `${row.name}: ${l.toLowerCase()}.`); } catch (e: any) { setError(e.message || w("coach.couldNotSetTheFormula")); } }}>{l}</button>
          ))}
        </div>
        {(() => { const sh = sheetOf(row.goal, { weightKg: row.weightKg, trainingAge: row.trainingAge, coachLabel: "you", ...(row.review?.status === "approved" ? { approvedBy: "you", approvedAt: row.review.at } : {}) }); return sh ? <GoalSheet sheet={sh} /> : null; })()}
        {row.goal?.band && !row.flags.some((f) => f.situation === "eating") && (row.weightKg || !row.weightTrend ? <WeightTrend list={row.weighIns} band={row.goal.band} weightKg={row.weightKg} trainingAge={row.trainingAge} coach /> : <WeightTrendPct t={row.weightTrend} band={row.goal.band} at={row.weightAt ?? null} />)}
        <GoalHistory log={row.goalLog ?? []} />
        </>}
        {part !== "goal" && <>
        <p className="label">Shared with you ({row.feedback.length})</p>
        {row.feedback.length === 0 && <small>{w("coach.nothingYet")}</small>}
        {row.feedback.slice(0, 30).map((f: any) => {
          const items: any[] = f.meal?.items ?? [];
          const photo = photos.get(`fb:${f.id}`);
          return (
            <section className="card client-card" key={f.id} id={`card-${f.id}`}>
              <div className="client-card-top">
                <div>
                  <b>{f.taste}{f.shared?.reason ? <span className="reason-tag"> · {({ look: "look at this", ok: "was this OK?", help: "help me next time" } as any)[f.shared.reason]}</span> : null}</b>
                  <small>{f.moment && f.moment !== "regular" ? `${MOMENTS.find((m) => m.id === f.moment)?.name} · ` : ""}{new Date(f.createdAt).toLocaleString(phoneLoc(), { weekday: "short", hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}</small>
                </div>
                {photo && <img className="client-photo" src={photo} alt="" />}
              </div>
              <div className="client-plate">
                <b>{f.meal?.title || "Meal"}</b>
                {items.length > 0 && <small>{items.map((i) => `${Math.round(i.grams)} g ${i.food.name}`).join(" · ")}</small>}
                {items.length > 0 && <small>{pdText(pdOf(items))} · {kcalOf(items)} kcal</small>}
              </div>
              {f.notes && <p className="client-note">“{f.notes}”</p>}
              {sendNote && <CardAnswer row={row} card={f} coachName={coachName ?? "Coach"} send={sendNote} notify={notify} setError={setError} onDone={onAnswered} />}
            </section>
          );
        })}
        </>}
    </div>
  );
}

// Send one of my own cards, as a recipe, to one or more clients.
export function SendSheet(p: AppApi & { card: any; close: () => void }) {
  const { card, close, user, setError, notify } = p;
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (user) listClients(user.uid).then(setRows).catch(() => {}); }, [user?.uid]);
  const items: any[] = card.meal?.items ?? [];
  return (
    <div className="sheet-backdrop" onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="card-top"><span>Send "{card.meal?.title}"</span><button className="link" onClick={close}>{w("coach.cancel")}</button></div>
        <small>{items.map((i) => `${Math.round(i.grams)} g ${i.food.name}`).join(" · ")}</small>
        <p className="label">{w("coach.to")}</p>
        <div className="moments">
          {rows.map((r) => (
            <button key={r.uid} className={`choice ${picked.has(r.uid) ? "on" : ""}`} onClick={() => setPicked((s) => { const n = new Set(s); n.has(r.uid) ? n.delete(r.uid) : n.add(r.uid); return n; })}>{r.name}</button>
          ))}
          {rows.length === 0 && <small>{w("coach.noClientsYet")}</small>}
        </div>
        <textarea placeholder={w("coach.aLineToGoWith")} value={note} onChange={(e) => setNote(e.target.value)} />
        <button className="pill pill-primary pill-wide" disabled={!picked.size || busy} onClick={async () => {
          if (!user) return;
          setBusy(true);
          try {
            for (const cu of picked) await sendRecipe(cu, { id: uid(), from: user.uid, note: note.trim(), meal: structuredClone(card.meal), sentAt: new Date().toISOString() });
            notify(`Sent to ${picked.size === 1 ? rows.find((r) => r.uid === [...picked][0])?.name : `${picked.size} clients`}.`); close();
          } catch (e: any) { setError(e.message || w("coach.couldNotSend")); }
          finally { setBusy(false); }
        }}>{w("coach.send")}</button>
      </div>
    </div>
  );
}

// People who asked for a code on the landing page.
export function AccessRequests(p: AppApi) {
  const [list, setList] = useKept<any[] | null>(`requests-${p.user?.uid ?? "local"}`, null);
  const load = () => fetch("/api/access-requests").then((r) => r.json()).then((d) => setList(d.requests ?? [])).catch(() => setList([]));
  useEffect(() => { load(); }, []);
  if (!list || list.length === 0) return null;
  // one line per person: the latest request for an email, with how many came before it
  const byEmail = new Map<string, any>();
  for (const r of list) { const k = String(r.email || "").toLowerCase(); const prev = byEmail.get(k); if (!prev) byEmail.set(k, { ...r, count: 1 }); else { prev.count += 1; if ((r.createdAt ?? "") > (prev.createdAt ?? "")) byEmail.set(k, { ...r, count: prev.count }); } }
  const people = [...byEmail.values()].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  const open = people.filter((r) => r.status !== "handled");
  return (
    <>
      <p className="label">Access requests ({open.length} new)</p>
      <BetaSpots />
      {people.slice(0, 20).map((r) => (
        <section className={`card request ${r.status === "handled" ? "handled" : ""}`} key={r.id}>
          <div className="card-top"><span>{r.name}{r.coach ? " · coach" : ""}{BOOK_PAGES[r.from] ? ` · from ${BOOK_PAGES[r.from]}${BOOK_SOURCES[r.src] ? `, ${BOOK_SOURCES[r.src]}` : ""}` : ""}{r.count > 1 ? ` · ${r.count} requests` : ""}</span><small>{new Date(r.createdAt).toLocaleDateString()}</small></div>
          <a href={`mailto:${r.email}?subject=Your%20Chef%20Mealan%20code`}>{r.email}</a>
          {r.phone && <a href={waLink(String(r.phone))} target="_blank" rel="noreferrer">WhatsApp {r.phone}</a>}
          {r.note && <p className="client-note">“{r.note}”</p>}
          {r.status !== "handled" && (
            <div className="button-row" style={{ marginTop: 6 }}>
              <button className="pill pill-small pill-primary" onClick={async () => {
                const res = await fetch("/api/invites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: r.name, email: r.email }) });
                const d = await res.json(); if (!res.ok) { p.setError(d.error || w("coach.couldnTCreateTheInvite")); return; }
                await fetch(`/api/access-requests/${r.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "handled" }) });
                location.href = inviteMail(d); load();
              }}><Send size={14} /> {w("coach.invite")}</button>
              <button className="link" onClick={async () => { await fetch(`/api/access-requests/${r.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "handled" }) }); p.notify("Marked as handled."); load(); }}>{w("coach.markAsHandled")}</button>
            </div>
          )}
        </section>
      ))}
    </>
  );
}

// HP3 (0.3.42): the waiting list from the home page, for the paying users at launch. One row per email, with which fits;
// Remove when someone asks to leave (they write to hello@).
const WHO_NAME: Record<string, string> = { client: "has a coach", coach: "a coach", self: "trains on their own" };
export function WaitingList(p: AppApi) {
  const [list, setList] = useKept<any[] | null>(`waitlist-${p.user?.uid ?? "local"}`, null);
  const load = () => fetch("/api/waitlist").then((r) => r.json()).then((d) => setList(d.waiting ?? [])).catch(() => setList([]));
  useEffect(() => { load(); }, []);
  if (!list || list.length === 0) return null;
  const coaches = list.filter((x) => x.who === "coach").length;
  return (
    <>
      <p className="label">Waiting list: {list.length}{coaches ? `, ${coaches} ${coaches === 1 ? "coach" : "coaches"}` : ""}</p>
      <section className="card waitlist">
        {list.slice(0, 100).map((x) => (
          <div className="wait-row" key={x.id}>
            <span><a href={`mailto:${x.email}`}>{x.email}</a><small>{[WHO_NAME[x.who], x.createdAt ? new Date(x.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""].filter(Boolean).join(" · ")}</small></span>
            <button type="button" className="link" onClick={async () => { await fetch(`/api/waitlist/${x.id}`, { method: "DELETE" }); p.notify(`${x.email} left the waiting list.`); load(); }}>{w("coach.remove")}</button>
          </div>
        ))}
      </section>
    </>
  );
}

// Book sign-ups from /built (board B): who wants one email when Worth Eating or Worth Living is out.
const BOOK_NAMES: Record<string, string> = { "worth-eating": "Worth Eating", "worth-living": "Worth Living" };
export function BookSignups(p: AppApi) {
  const [list, setList] = useKept<any[] | null>(`books-${p.user?.uid ?? "local"}`, null);
  useEffect(() => { fetch("/api/book-signups").then((r) => r.json()).then((d) => setList(d.signups ?? [])).catch(() => setList([])); }, []);
  if (!list || list.length === 0) return null;
  const count = (b: string) => list.filter((x) => (x.books ?? []).includes(b)).length;
  return (
    <>
      <p className="label">Book sign-ups: Worth Eating {count("worth-eating")}, Worth Living {count("worth-living")}</p>
      <section className="card">
        {list.slice(0, 50).map((x) => (
          <div className="card-top" key={x.id}><a href={`mailto:${x.email}`}>{x.email}</a><small>{(x.books ?? []).map((b: string) => BOOK_NAMES[b] ?? b).join(", ")}</small></div>
        ))}
      </section>
    </>
  );
}

// Personal invites: one code for one email, used once, valid 30 days.
const inviteMail = (i: { email: string; name: string; code: string; coachName: string }) =>
  `mailto:${i.email}?subject=${encodeURIComponent("Your Chef Mealan invite")}&body=${encodeURIComponent(`Hi ${i.name || ""},\n\nyour personal code for Chef Mealan: ${i.code}\n\n1. Open https://chefmealan.com\n2. Sign in with Google using this email address: ${i.email}\n3. Enter the code.\n\nThe code works once, with this email only, for 30 days.\n\n${i.coachName}`)}`;
export function Invites(p: AppApi) {
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [list, setList] = useKept<any[]>(`invites-${p.user?.uid ?? "local"}`, []); const [made, setMade] = useState<any>(null); const [busy, setBusy] = useState(false);
  const load = () => fetch("/api/invites").then((r) => r.json()).then((d) => setList(d.invites ?? [])).catch(() => {});
  useEffect(() => { load(); }, []);
  const create = async (n: string, e: string) => {
    setBusy(true);
    try { const r = await fetch("/api/invites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: n, email: e }) }); const d = await r.json(); if (!r.ok) throw new Error(d.error); setMade(d); setName(""); setEmail(""); load(); return d; }
    catch (err: any) { p.setError(err.message || w("coach.couldnTCreateTheInvite")); return null; } finally { setBusy(false); }
  };
  return (
    <>
      <section className="card">
        <div className="card-top"><span><UserPlus size={15} /> {w("coach.inviteAClient")}</span><button className="icon" aria-label={w("coach.refresh")} onClick={load}><RefreshCw size={16} /></button></div>
        <small>{w("coach.aPersonalCodeOneEmail")}</small>
        <div className="l-form" style={{ marginTop: 8 }}>
          <input placeholder={w("coach.name")} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          <input placeholder={w("coach.emailTheySignInWith")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="pill pill-primary" disabled={busy || !email.includes("@")} onClick={() => create(name, email)}>{w("coach.createInvite")}</button>
        </div>
        {made && (
          <div className="invite-made">
            <b className="code">{made.code}</b><small>for {made.email}</small>
            <div className="button-row">
              <a className="pill pill-small pill-primary" href={inviteMail(made)}><Send size={14} /> {w("coach.sendByEmail")}</a>
              <button className="pill pill-small" onClick={() => { navigator.clipboard?.writeText(made.code); p.notify("Code copied."); }}><Copy size={14} /> {w("coach.copy")}</button>
            </div>
          </div>
        )}
      </section>
      {list.length > 0 && (
        <>
          <p className="label">{w("coach.invites")}</p>
          <section className="card">
            {list.slice(0, 20).map((i) => (
              <div className="history-row" key={i.code}>
                <div><b>{i.name || i.email}</b><small>{i.email} · {i.code}</small></div>
                <div className="history-num"><b className={`inv-${i.status}`}>{i.status}</b>
                  {i.status === "open" && <small><a href={inviteMail(i)}>{w("coach.resend")}</a> · <button className="link" onClick={async () => { await fetch(`/api/invites/${i.code}/revoke`, { method: "POST" }); load(); }}>{w("coach.revoke")}</button></small>}
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </>
  );
}


// What a client kept on purpose, as Coach Milan sees it: the same findings, the client's choice, a note, Approve or Ask to change.
function ReviewCard({ row, answer, open }: { row: ClientRow; answer: (status: "approved" | "change", note: string) => Promise<void>; open: () => void }) {
  const [note, setNote] = useState("");
  const r = row.review!, first = row.name.split(" ")[0];
  return (
    <section className="card review-card">
      <b>Client {first} set new numbers</b>
      <small className="muted">{r.summary ?? ""}{r.summary ? " · " : ""}{new Date(r.at).toLocaleDateString("en", { day: "numeric", month: "long" })}</small>
      {r.reply && <p className="review-reply">Client {first} replied: {r.reply}</p>}
      {(r.kept ?? []).map((k) => (
        <div className="finding" key={k.id}><b>Kept on purpose: {k.title.toLowerCase()}</b><span>{k.body}</span><small>{k.source}</small></div>
      ))}
      <label className="field"><span>A note to Client {first}, if you ask for a change</span><textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder={w("coach.addGOfCarbsOn")} /></label>
      <div className="button-row">
        <button className="pill pill-small" onClick={() => answer("change", note)}>{w("coach.askToChange")}</button>
        <button className="pill pill-small pill-primary" onClick={() => answer("approved", note)}>{w("coach.approve")}</button>
      </div>
      <button className="link" onClick={open}>Open Client {first}'s numbers ›</button>
    </section>
  );
}

// Recipes waiting for you (board RG5): a cook's recipe, or changes to their live one, wait for their coach. See the page
// first, then Make it live; or Send back with a note, which the cook sees on the recipe.
type Waiting = PublicRecipe & { photo: string | null; change: boolean; sentAt: string };
export function WaitingRecipes({ notify, setError }: { notify: (m: string) => void; setError: (m: string) => void }) {
  const [list, setList] = useState<Waiting[]>([]);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [viewing, setViewing] = useState<Waiting | null>(null);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const load = () => fetch("/api/waiting").then((r) => r.json()).then((d) => setList(d.recipes ?? [])).catch(() => {});
  useEffect(() => { load(); }, []);
  useBack(Boolean(viewing), () => setViewing(null));
  const answer = async (r: Waiting, action: "live" | "back") => {
    try {
      const res = await fetch(`/api/waiting/${r.slug}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, note }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || w("coach.thatDidnTWorkTry"));
      notify(action === "live" ? `${r.title} is live.` : `${r.title} went back with your note.`);
      setViewing(null); setNoteFor(null); setNote(""); load();
    } catch (e: any) { setError(e.message); }
  };
  if (!list.length) return null;
  return (
    <>
      <div className="approve-head"><p className="label">{w("coach.recipesWaitingForYou")}</p><span className="approve-count">{list.length}</span></div>
      {list.map((r) => (
        <div className="card waiting-recipe" key={r.slug}>
          <div className="pub-head"><b>{r.title}</b><span className="pub-state waiting">{r.change ? "Changes" : "New"}</span></div>
          <small className="muted">{bylineOf(r.author)} · sent {new Date(r.sentAt).toLocaleDateString(phoneLoc())} {new Date(r.sentAt).toLocaleTimeString(phoneLoc(), { hour: "2-digit", minute: "2-digit" })}</small>
          <div className="publish-ways">
            <button className="pill" onClick={() => { setViewing(r); setSeen((x) => new Set(x).add(r.slug)); }}>{w("coach.seeThePage")}</button>
            <button className="pill pill-primary" disabled={!seen.has(r.slug)} onClick={() => answer(r, "live")}>{w("coach.makeItLive")}</button>
          </div>
          {!seen.has(r.slug) && <small className="muted">{w("coach.makeItLiveWorksAfter")}</small>}
          {noteFor === r.slug ? (
            <div className="waiting-note">
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={w("coach.thePhotoIsTooDark")} aria-label={w("coach.yourNote")} />
              <div className="publish-ways"><button className="pill" onClick={() => setNoteFor(null)}>{w("coach.cancel")}</button><button className="pill pill-primary" disabled={!note.trim()} onClick={() => answer(r, "back")}>{w("coach.sendBack")}</button></div>
            </div>
          ) : <button className="link" onClick={() => { setNoteFor(r.slug); setNote(""); }}>{w("coach.sendBackWithANote")}</button>}
        </div>
      ))}
      {viewing && (
        <div className="rp-preview" role="dialog" aria-label={w("coach.seeThePage")}>
          <RecipeView r={viewing} member={null} photoSrc={viewing.photo} top={
            <div className="rp-preview-bar" style={{ margin: "-14px -18px 0" }}>
              <b>{bylineOf(viewing.author)}: waiting for you. Nothing is live until you make it live.</b>
              <div className="ways"><button className="pill" onClick={() => setViewing(null)}>{w("coach.back")}</button><button className="pill pill-primary" onClick={() => answer(viewing, "live")}>{w("coach.makeItLive")}</button></div>
            </div>} />
        </div>
      )}
    </>
  );
}


// BP70 (Milan 12:29): beta spots left in this round, shown on a book's page. Milan lowers it as people join; Clear hides it.
// Only Milan's account sees it (the same rule as Metrics).
function BetaSpots() {
  const [owner, setOwner] = useState(false);
  const [spots, setSpots] = useState<number | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    fetch("/api/metrics/access").then((r) => r.json()).then((d) => setOwner(Boolean(d?.owner))).catch(() => {});
    fetch("/api/beta/spots").then((r) => r.json()).then((d) => setSpots(Number.isInteger(d?.spots) ? d.spots : null)).catch(() => {});
  }, []);
  const save = async (n: number | null) => {
    setErr("");
    const r = await fetch("/api/beta/spots", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ spots: n }) }).catch(() => null);
    if (r?.ok) setSpots(n); else setErr("Couldn't save. Try again.");
  };
  if (!owner) return null;
  return (
    <section className="card beta-spots">
      <div className="card-top"><span>{w("coach.betaSpotsLeft")}</span><small>{spots === null ? "not shown" : "shown on the home page and the book page"}</small></div>
      <span className="rp-step">
        <button type="button" aria-label={w("coach.oneSpotLess")} disabled={spots === null || spots === 0} onClick={() => save((spots ?? 0) - 1)}>−</button>
        <b>{spots === null ? "–" : spots}</b>
        <button type="button" aria-label={w("coach.oneSpotMore")} disabled={spots !== null && spots >= 999} onClick={() => save((spots ?? 0) + 1)}>+</button>
      </span>
      {spots !== null && <button type="button" className="link" onClick={() => save(null)}>{w("coach.donTShowANumber")}</button>}
      {err && <small className="muted">{err}</small>}
    </section>
  );
}
