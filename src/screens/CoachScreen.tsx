import { waLink } from "../phone";
import { useEffect, useState } from "react";
import { useKept } from "../kept";
import { RefreshCw, Copy, Target, Send, UserPlus } from "lucide-react";
import { dayLog, loggedLine, daysAgo, dayLabel } from "../today";
import { dayNameAny, type Formula } from "../personal";
import { listClients, setClientGoal, setClientGoalFrom, sendCoachNote, setCheckinDay, sendRecipe, pinFormula, type ClientRow } from "../cloud";
import { ClientPage, ClientRowCard, coachNumbers, todayIndex, type CoachOps } from "./ClientWeek";
import { DAY_NAMES } from "../coachNotes";
import { isoWeek, ymd } from "../plan";
import { SITUATIONS } from "../safety";
import { GoalHistory } from "./MenuScreen";
import { uid } from "../pilot";
import { BANDS, PACES, bandOf, goalLabel, goalsForBand, isBuild } from "../goal";
import { sheetOf } from "../goalGuide";
import { GoalSheet } from "../components/GoalSheet";
import { WeightTrend } from "../components/Weight";
import { fixed, pdText, pdVal, pdTag, pdRange } from "../ui";
import { density } from "../pilot";
import { MOMENTS } from "../moments";
import type { AppApi } from "./api";
import { RecipeView } from "./RecipePages";
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
  const [openId, setOpenId] = useState<string | null>(null);
  const open = rows.find((r) => r.uid === openId) ?? null;
  const coachName = user?.name?.split(" ")[0] || (p.demo ? "Milan" : "Coach");
  async function refresh() {
    if (!user || p.demo) return;
    try { setRows(await listClients(user.uid)); }
    catch (e: any) { setError(e.message || "Could not load clients."); }
  }
  useEffect(() => { refresh(); p.markSharedSeen(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.uid]);
  // clients who are cooks (board RG5): one switch on the client's page
  const [cookList, setCookList] = useKept<string[]>(`cooks-${user?.uid ?? "local"}`, []);
  const cooks = new Set(cookList);
  const setCooks = (next: Set<string> | ((prev: Set<string>) => Set<string>)) => setCookList((prev) => [...(typeof next === "function" ? next(new Set(prev)) : next)]);
  const loadCooks = () => { if (!p.demo) fetch("/api/cooks").then((r) => r.json()).then((d) => setCooks(new Set(d.uids ?? []))).catch(() => {}); };
  useEffect(() => { loadCooks(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.uid]);
  const setCook = async (client: string, on: boolean) => {
    const res = await fetch("/api/cooks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uid: client, on }) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.error || "That didn't work. Try again.");
    setCooks((x) => { const y = new Set(x); on ? y.add(client) : y.delete(client); return y; });
  };
  // what the coach writes on a client's account; on the local demo the rows change on this phone only
  const patch = (uid: string, change: Partial<ClientRow>) => setRows(rows.map((r) => (r.uid === uid ? { ...r, ...change } : r)));
  const ops: CoachOps = {
    sendNote: async (row, notes) => { if (!p.demo) await sendCoachNote(row.uid, notes); patch(row.uid, { notes }); },
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
    <ClientPage row={open} coachName={coachName} ops={ops} back={() => setOpenId(null)} notify={notify} setError={setError}
      tail={<ClientTail row={open} onSaved={refresh} setError={setError} notify={notify} confirmAi={p.confirmClientAi}
        cook={cooks.has(open.uid)} setCook={(on) => setCook(open.uid, on).then(() => notify(on ? `${open.name.split(" ")[0]} is a cook: they can send you recipes to publish.` : `${open.name.split(" ")[0]} is no longer a cook.`)).catch((e) => setError(e.message))} />} />
  );
  const ti = todayIndex();
  const due = rows.filter((r) => r.checkinDay === ti);
  const weekKey = ymd(isoWeek(new Date()).monday);
  const toSend = due.filter((r) => !r.notes.some((n) => n.by === "coach" && n.week === weekKey)).length;
  return (
    <>
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
            <div className="approve-head"><p className="label">To approve</p><span className="approve-count">{waiting.length} to approve</span></div>
            {waiting.map((r) => <ReviewCard key={r.uid} row={r} answer={async (status, note) => { await p.answerClientReview(r.uid, status, note, r.review!); await refresh(); }} open={() => setOpenId(r.uid)} />)}
          </>
        );
      })()}
      {!p.demo && <WaitingRecipes notify={notify} setError={setError} />}
      {!p.demo && <Invites {...p} />}
      {!p.demo && <AccessRequests {...p} />}
      {!p.demo && <BookSignups {...p} />}
      <p className="label">Clients ({rows.length})</p>
      {rows.length === 0 && <div className="strip">No clients yet. Share the code.</div>}
      {rows.map((r) => <ClientRowCard key={r.uid} row={r} today={false} open={() => setOpenId(r.uid)} />)}
    </>
  );
}

// The rest of the client's page, under the week (0.2.6): the cook switch, safety, the formula, the goal sheet, the weight
// trend, the goal history and the shared cards. The goal is set above, in the goal section (CW8).
export function ClientTail({ row, onSaved, setError, notify, confirmAi, cook, setCook }: { row: ClientRow; onSaved: () => void; setError: (m: string) => void; notify: (m: string) => void; confirmAi?: (uid: string, on: boolean) => Promise<void>; cook?: boolean; setCook?: (on: boolean) => void }) {
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
        {setCook && (
          <label className="cook-switch">
            <span><b>Cook</b><small>Can send you recipes to publish. You see each one first.</small></span>
            <input type="checkbox" role="switch" aria-label={`${row.name.split(" ")[0]} is a cook`} checked={Boolean(cook)} onChange={(e) => setCook(e.target.checked)} />
          </label>
        )}
        {(() => {
          // safety: situation and date only, never the person's words; the coach confirms Mealan's chat for a flagged account
          const needs = row.flags.some((f) => f.situation === "eating");
          if (!needs && row.flags.length === 0) return null;
          return (
            <section className="card safety-sheet">
              <b>Safety</b>
              {row.flags.length > 0 && <ul className="small">{row.flags.map((f, i) => <li key={i}>{SITUATIONS.find((x) => x.id === f.situation)?.label ?? f.situation} · {f.at}</li>)}</ul>}
              {needs && confirmAi && (
                <div className="button-row">
                  {row.aiConfirmedAt
                    ? <button className="pill pill-small" onClick={() => confirmAi(row.uid, false).then(onSaved).catch((e) => setError(e.message))}>Chef Mealan's chat is on · switch off</button>
                    : <button className="pill pill-small pill-primary" onClick={() => confirmAi(row.uid, true).then(onSaved).catch((e) => setError(e.message))}>Confirm Chef Mealan's chat</button>}
                </div>
              )}
            </section>
          );
        })()}
        <div className="formula-row">
          <small>Formula</small>
          {([[null, "Automatic"], ["mifflin", "Mifflin–St Jeor"], ["katch", "Katch–McArdle"], ["schofield", "Schofield"], ...(row.measured && !row.flags.some((f) => f.situation === "eating") ? [["data", `From ${row.name.split(" ")[0]}'s data`]] : [])] as [Formula | null, string][]).map(([k, l]) => (
            <button key={l} className={`choice ${(formula ?? null) === k ? "on" : ""}`} onClick={async () => { try { await pinFormula(row.uid, k); setFormula(k); notify(k === "data" ? `${row.name}: the measured burn, fixed from today.` : `${row.name}: ${l.toLowerCase()}.`); } catch (e: any) { setError(e.message || "Could not set the formula."); } }}>{l}</button>
          ))}
        </div>
        {(() => { const sh = sheetOf(row.goal, { weightKg: row.weightKg, trainingAge: row.trainingAge, coachLabel: "you", ...(row.review?.status === "approved" ? { approvedBy: "you", approvedAt: row.review.at } : {}) }); return sh ? <GoalSheet sheet={sh} /> : null; })()}
        {row.goal?.band && !row.flags.some((f) => f.situation === "eating") && <WeightTrend list={row.weighIns} band={row.goal.band} weightKg={row.weightKg} trainingAge={row.trainingAge} coach />}
        <GoalHistory log={row.goalLog ?? []} />
        <p className="label">Shared with you ({row.feedback.length})</p>
        {row.feedback.length === 0 && <small>Nothing yet.</small>}
        {row.feedback.slice(0, 30).map((f: any) => {
          const items: any[] = f.meal?.items ?? [];
          const photo = photos.get(`fb:${f.id}`);
          return (
            <section className="card client-card" key={f.id}>
              <div className="client-card-top">
                <div>
                  <b>{f.taste}{f.shared?.reason ? <span className="reason-tag"> · {({ look: "look at this", ok: "was this OK?", help: "help me next time" } as any)[f.shared.reason]}</span> : null}</b>
                  <small>{f.moment && f.moment !== "regular" ? `${MOMENTS.find((m) => m.id === f.moment)?.name} · ` : ""}{new Date(f.createdAt).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}</small>
                </div>
                {photo && <img className="client-photo" src={photo} alt="" />}
              </div>
              <div className="client-plate">
                <b>{f.meal?.title || "Meal"}</b>
                {items.length > 0 && <small>{items.map((i) => `${Math.round(i.grams)} g ${i.food.name}`).join(" · ")}</small>}
                {items.length > 0 && <small>{pdText(pdOf(items))} · {kcalOf(items)} kcal</small>}
              </div>
              {f.notes && <p className="client-note">“{f.notes}”</p>}
            </section>
          );
        })}
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
        <div className="card-top"><span>Send "{card.meal?.title}"</span><button className="link" onClick={close}>Cancel</button></div>
        <small>{items.map((i) => `${Math.round(i.grams)} g ${i.food.name}`).join(" · ")}</small>
        <p className="label">To</p>
        <div className="moments">
          {rows.map((r) => (
            <button key={r.uid} className={`choice ${picked.has(r.uid) ? "on" : ""}`} onClick={() => setPicked((s) => { const n = new Set(s); n.has(r.uid) ? n.delete(r.uid) : n.add(r.uid); return n; })}>{r.name}</button>
          ))}
          {rows.length === 0 && <small>No clients yet.</small>}
        </div>
        <textarea placeholder="A line to go with it, if you like" value={note} onChange={(e) => setNote(e.target.value)} />
        <button className="pill pill-primary pill-wide" disabled={!picked.size || busy} onClick={async () => {
          if (!user) return;
          setBusy(true);
          try {
            for (const cu of picked) await sendRecipe(cu, { id: uid(), from: user.uid, note: note.trim(), meal: structuredClone(card.meal), sentAt: new Date().toISOString() });
            notify(`Sent to ${picked.size === 1 ? rows.find((r) => r.uid === [...picked][0])?.name : `${picked.size} clients`}.`); close();
          } catch (e: any) { setError(e.message || "Could not send."); }
          finally { setBusy(false); }
        }}>Send</button>
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
      {people.slice(0, 20).map((r) => (
        <section className={`card request ${r.status === "handled" ? "handled" : ""}`} key={r.id}>
          <div className="card-top"><span>{r.name}{r.coach ? " · coach" : ""}{r.count > 1 ? ` · ${r.count} requests` : ""}</span><small>{new Date(r.createdAt).toLocaleDateString()}</small></div>
          <a href={`mailto:${r.email}?subject=Your%20Chef%20Mealan%20code`}>{r.email}</a>
          {r.phone && <a href={waLink(String(r.phone))} target="_blank" rel="noreferrer">WhatsApp {r.phone}</a>}
          {r.note && <p className="client-note">“{r.note}”</p>}
          {r.status !== "handled" && (
            <div className="button-row" style={{ marginTop: 6 }}>
              <button className="pill pill-small pill-primary" onClick={async () => {
                const res = await fetch("/api/invites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: r.name, email: r.email }) });
                const d = await res.json(); if (!res.ok) { p.setError(d.error || "Couldn't create the invite."); return; }
                await fetch(`/api/access-requests/${r.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "handled" }) });
                location.href = inviteMail(d); load();
              }}><Send size={14} /> Invite</button>
              <button className="link" onClick={async () => { await fetch(`/api/access-requests/${r.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "handled" }) }); p.notify("Marked as handled."); load(); }}>Mark as handled</button>
            </div>
          )}
        </section>
      ))}
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
    catch (err: any) { p.setError(err.message || "Couldn't create the invite."); return null; } finally { setBusy(false); }
  };
  return (
    <>
      <section className="card">
        <div className="card-top"><span><UserPlus size={15} /> Invite a client</span><button className="icon" aria-label="Refresh" onClick={load}><RefreshCw size={16} /></button></div>
        <small>A personal code: one email, used once, valid 30 days.</small>
        <div className="l-form" style={{ marginTop: 8 }}>
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          <input placeholder="Email they sign in with" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="pill pill-primary" disabled={busy || !email.includes("@")} onClick={() => create(name, email)}>Create invite</button>
        </div>
        {made && (
          <div className="invite-made">
            <b className="code">{made.code}</b><small>for {made.email}</small>
            <div className="button-row">
              <a className="pill pill-small pill-primary" href={inviteMail(made)}><Send size={14} /> Send by email</a>
              <button className="pill pill-small" onClick={() => { navigator.clipboard?.writeText(made.code); p.notify("Code copied."); }}><Copy size={14} /> Copy</button>
            </div>
          </div>
        )}
      </section>
      {list.length > 0 && (
        <>
          <p className="label">Invites</p>
          <section className="card">
            {list.slice(0, 20).map((i) => (
              <div className="history-row" key={i.code}>
                <div><b>{i.name || i.email}</b><small>{i.email} · {i.code}</small></div>
                <div className="history-num"><b className={`inv-${i.status}`}>{i.status}</b>
                  {i.status === "open" && <small><a href={inviteMail(i)}>resend</a> · <button className="link" onClick={async () => { await fetch(`/api/invites/${i.code}/revoke`, { method: "POST" }); load(); }}>revoke</button></small>}
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
      <label className="field"><span>A note to Client {first}, if you ask for a change</span><textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add 60 g of carbs on hard days, rice or oats after training." /></label>
      <div className="button-row">
        <button className="pill pill-small" onClick={() => answer("change", note)}>Ask to change</button>
        <button className="pill pill-small pill-primary" onClick={() => answer("approved", note)}>Approve</button>
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
      if (!res.ok) throw new Error(d.error || "That didn't work. Try again.");
      notify(action === "live" ? `${r.title} is live.` : `${r.title} went back with your note.`);
      setViewing(null); setNoteFor(null); setNote(""); load();
    } catch (e: any) { setError(e.message); }
  };
  if (!list.length) return null;
  return (
    <>
      <div className="approve-head"><p className="label">Recipes waiting for you</p><span className="approve-count">{list.length}</span></div>
      {list.map((r) => (
        <div className="card waiting-recipe" key={r.slug}>
          <div className="pub-head"><b>{r.title}</b><span className="pub-state waiting">{r.change ? "Changes" : "New"}</span></div>
          <small className="muted">{bylineOf(r.author)} · sent {new Date(r.sentAt).toLocaleDateString()} {new Date(r.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
          <div className="publish-ways">
            <button className="pill" onClick={() => { setViewing(r); setSeen((x) => new Set(x).add(r.slug)); }}>See the page</button>
            <button className="pill pill-primary" disabled={!seen.has(r.slug)} onClick={() => answer(r, "live")}>Make it live</button>
          </div>
          {!seen.has(r.slug) && <small className="muted">Make it live works after See the page, so you always look first.</small>}
          {noteFor === r.slug ? (
            <div className="waiting-note">
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="The photo is too dark. Try daylight." aria-label="Your note" />
              <div className="publish-ways"><button className="pill" onClick={() => setNoteFor(null)}>Cancel</button><button className="pill pill-primary" disabled={!note.trim()} onClick={() => answer(r, "back")}>Send back</button></div>
            </div>
          ) : <button className="link" onClick={() => { setNoteFor(r.slug); setNote(""); }}>Send back with a note</button>}
        </div>
      ))}
      {viewing && (
        <div className="rp-preview" role="dialog" aria-label="See the page">
          <RecipeView r={viewing} member={null} photoSrc={viewing.photo} top={
            <div className="rp-preview-bar" style={{ margin: "-14px -18px 0" }}>
              <b>{bylineOf(viewing.author)}: waiting for you. Nothing is live until you make it live.</b>
              <div className="ways"><button className="pill" onClick={() => setViewing(null)}>Back</button><button className="pill pill-primary" onClick={() => answer(viewing, "live")}>Make it live</button></div>
            </div>} />
        </div>
      )}
    </>
  );
}

