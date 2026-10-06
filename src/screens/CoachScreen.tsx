import { useEffect, useState } from "react";
import { RefreshCw, Copy, Target, Send, UserPlus } from "lucide-react";
import { dayLog, loggedLine, daysAgo, dayLabel } from "../today";
import { dayNameAny } from "../personal";
import { listClients, setClientGoal, loadPhotos, sendRecipe, pinFormula, type ClientRow } from "../cloud";
import { ageBand, isMinor, SITUATIONS } from "../safety";
import { GoalHistory } from "./MenuScreen";
import { uid } from "../pilot";
import { BANDS, bandOf, goalsForBand } from "../goal";
import { fixed, pdText, pdVal, pdTag, pdRange } from "../ui";
import { density } from "../pilot";
import { MOMENTS } from "../moments";
import type { AppApi } from "./api";

// The coach's area on Me: the code to share, the client list, and a client's cards with a goal to set.
export function CoachArea(p: AppApi) {
  const { user, setError, notify } = p;
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [open, setOpen] = useState<ClientRow | null>(null);
  const [busy, setBusy] = useState(false);
  const coachName = user?.name?.split(" ")[0] || "Coach";
  async function refresh() {
    if (!user) return;
    setBusy(true);
    try { const next = await listClients(user.uid); setRows(next); setOpen((o) => (o ? next.find((r) => r.uid === o.uid) ?? o : o)); }
    catch (e: any) { setError(e.message || "Could not load clients."); }
    finally { setBusy(false); }
  }
  useEffect(() => { refresh(); p.markSharedSeen(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.uid]);
  const daam = (r: ClientRow) => r.feedback.filter((f) => f.taste === "DaaM good").length;
  const last = (r: ClientRow) => r.feedback[0];
  return (
    <>
      {(() => {
        const waiting = rows.filter((r) => r.review?.status === "waiting");
        if (!waiting.length) return null;
        return (
          <>
            <div className="approve-head"><p className="label">To approve</p><span className="approve-count">{waiting.length} to approve</span></div>
            {waiting.map((r) => <ReviewCard key={r.uid} row={r} answer={async (status, note) => { await p.answerClientReview(r.uid, status, note, r.review!); await refresh(); }} open={() => setOpen(r)} />)}
          </>
        );
      })()}
      <Invites {...p} />
      <AccessRequests {...p} />
      <p className="label">Clients ({rows.length})</p>
      {rows.length === 0 && <div className="strip">No clients yet. Share the code.</div>}
      {rows.map((r) => (
        <button className="card client-row" key={r.uid} onClick={() => setOpen(r)}>
          <div className="client-head">
            <span className="avatar">{r.name.slice(0, 1).toUpperCase()}</span>
            <div><b>Client {r.name.split(" ")[0]}</b><small>{r.goal?.band ? bandOf(r.goal.band)?.name : "no goal yet"} · {r.foods} foods · {r.feedback.length} shared · {daam(r)} DaaM good · reads {r.pdUnit === "pct" ? "% protein" : "PD"}</small></div>
          </div>
          <small className="client-last">{last(r) ? `${last(r).taste}: ${last(r).meal?.title ?? ""} · ${new Date(last(r).createdAt).toLocaleDateString()}${last(r).notes ? ` · ${last(r).notes}` : ""}` : "no meals yet"} · active {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : "never"}</small>
        </button>
      ))}
      {open && <ClientSheet row={open} coachName={coachName} close={() => setOpen(null)} onSaved={refresh} setError={setError} notify={notify} confirmAi={p.confirmClientAi} />}
    </>
  );
}

function ClientSheet({ row, coachName, close, onSaved, setError, notify, confirmAi }: { row: ClientRow; coachName: string; close: () => void; onSaved: () => void; setError: (m: string) => void; notify: (m: string) => void; confirmAi?: (uid: string, on: boolean) => Promise<void> }) {
  const [band, setBand] = useState<string>(row.goal?.band ?? "");
  const [editing, setEditing] = useState(false);
  const [formula, setFormula] = useState<"mifflin" | "katch" | null>(row.formula ?? null);
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<Map<string, string>>(new Map());
  useEffect(() => { loadPhotos(row.uid).then(setPhotos).catch(() => {}); }, [row.uid]);
  const pdOf = (items: any[]) => density(items.reduce((n, i) => n + (i.food.protein ?? 0) * i.grams / 100, 0), items.reduce((n, i) => n + (i.food.calories ?? 0) * i.grams / 100, 0));
  const kcalOf = (items: any[]) => Math.round(items.reduce((n, i) => n + (i.food.calories ?? 0) * i.grams / 100, 0));
  return (
    <div className="sheet-backdrop" onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="card-top"><span>{row.name}</span><button className="link" onClick={close}>Close</button></div>
        {(() => {
          // safety: situation and date only, never the person's words; the coach confirms Mealan's chat for a minor or a flagged account
          const band = ageBand(row.birthYear);
          const minor = isMinor(band);
          const flagged = row.flags.some((f) => f.situation === "eating");
          const needs = minor || flagged;
          if (!needs && row.flags.length === 0) return null;
          return (
            <section className="card safety-sheet">
              <b>Safety</b>
              {row.flags.length > 0 && <ul className="small">{row.flags.map((f, i) => <li key={i}>{SITUATIONS.find((x) => x.id === f.situation)?.label ?? f.situation} · {f.at}</li>)}</ul>}
              {minor && <p className="small">Under 18{band === "young" ? ", under 16: a parent has to agree on the profile" : ""}{row.consentBy ? ` · consent recorded by ${row.consentBy}` : " · no consent recorded yet"}. The numbers never go under maintenance.</p>}
              {needs && confirmAi && (
                <div className="button-row">
                  {row.aiConfirmedAt
                    ? <button className="pill pill-small" onClick={() => confirmAi(row.uid, false).then(onSaved).catch((e) => setError(e.message))}>Mealan's chat is on · switch off</button>
                    : <button className="pill pill-small pill-primary" disabled={band === "young" && row.consentBy !== "parent"} onClick={() => confirmAi(row.uid, true).then(onSaved).catch((e) => setError(e.message))}>Confirm Mealan's chat</button>}
                </div>
              )}
            </section>
          );
        })()}
        <div className="client-goal">
          <div><b>{row.goal?.band ? bandOf(row.goal.band)?.name : "No goal yet"}</b><small>{row.goal?.band ? pdRange(bandOf(row.goal.band)?.range ?? "") : ""}{row.goal?.setBy === "coach" ? " · set by you" : row.goal ? " · set by them" : ""}</small></div>
          <button className="pill pill-small" onClick={() => setEditing((v) => !v)}><Target size={14} /> {editing ? "Cancel" : "Change goal"}</button>
        </div>
        <div className="formula-row">
          <small>Formula</small>
          {([[null, "Automatic"], ["mifflin", "Mifflin–St Jeor"], ["katch", "Katch–McArdle"]] as const).map(([k, l]) => (
            <button key={l} className={`pill pill-small ${(formula ?? null) === k ? "pill-primary" : ""}`} onClick={async () => { try { await pinFormula(row.uid, k); setFormula(k); notify(`${row.name}: ${l.toLowerCase()}.`); } catch (e: any) { setError(e.message || "Could not set the formula."); } }}>{l}</button>
          ))}
        </div>
        {editing && (
          <>
            <div className="bands compact">
              {BANDS.map((b) => (
                <button key={b.id} className={`band-card ${band === b.id ? "on" : ""}`} onClick={() => setBand(b.id)}>
                  <b>{b.name}</b><span>{pdRange(b.range)} · {b.kcal[0]}–{b.kcal[1]} kcal · {b.protein[0]}–{b.protein[1]} g</span>
                </button>
              ))}
            </div>
            <button className="pill pill-primary pill-wide" disabled={!band || saving} onClick={async () => {
              const b = bandOf(band); if (!b) return;
              setSaving(true);
              try { await setClientGoal(row.uid, { band }, goalsForBand(b), coachName); notify(`${row.name}'s goal set to ${b.name}.`); setEditing(false); onSaved(); }
              catch (e: any) { setError(e.message || "Could not set the goal."); }
              finally { setSaving(false); }
            }}>Set this goal</button>
          </>
        )}
        <GoalHistory log={row.goalLog ?? []} />
        <p className="label">The last days, from shared cards</p>
        <section className="card days">
          {[0, 1, 2].map((n) => { const d = dayLog(row.feedback as any, daysAgo(n)); return (
            <div className="history-row" key={n}>
              <div><b>{dayLabel(d.day)}</b><small>{d.dayType ? dayNameAny(d.dayType) : "day type unknown"}</small></div>
              <div className="history-num"><small>{loggedLine(d, n === 0).replace("logged", "shared")}</small></div>
            </div>
          ); })}
        </section>
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
            <button key={r.uid} className={`pill pill-small ${picked.has(r.uid) ? "pill-primary" : ""}`} onClick={() => setPicked((s) => { const n = new Set(s); n.has(r.uid) ? n.delete(r.uid) : n.add(r.uid); return n; })}>{r.name}</button>
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
  const [list, setList] = useState<any[] | null>(null);
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

// Personal invites: one code for one email, used once, valid 30 days.
const inviteMail = (i: { email: string; name: string; code: string; coachName: string }) =>
  `mailto:${i.email}?subject=${encodeURIComponent("Your Chef Mealan invite")}&body=${encodeURIComponent(`Hi ${i.name || ""},\n\nyour personal code for Chef Mealan: ${i.code}\n\n1. Open https://chefmealan.com\n2. Sign in with Google using this email address: ${i.email}\n3. Enter the code.\n\nThe code works once, with this email only, for 30 days.\n\n${i.coachName}`)}`;
export function Invites(p: AppApi) {
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [list, setList] = useState<any[]>([]); const [made, setMade] = useState<any>(null); const [busy, setBusy] = useState(false);
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
