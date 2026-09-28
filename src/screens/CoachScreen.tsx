import { useEffect, useState } from "react";
import { RefreshCw, Copy, Target } from "lucide-react";
import { listClients, setClientGoal, publishCoachCode, loadPhotos, sendRecipe, type ClientRow } from "../cloud";
import { uid } from "../pilot";
import { BANDS, bandOf, goalsForBand } from "../goal";
import { fixed } from "../ui";
import { density } from "../pilot";
import { MOMENTS } from "../moments";
import type { AppApi } from "./api";

// The coach's area on Me: the code to share, the client list, and a client's cards with a goal to set.
export function CoachArea(p: AppApi) {
  const { user, setError, notify } = p;
  const [code, setCode] = useState<string>("");
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [open, setOpen] = useState<ClientRow | null>(null);
  const [busy, setBusy] = useState(false);
  const coachName = user?.name?.split(" ")[0] || "Coach";
  async function refresh() {
    if (!user) return;
    setBusy(true);
    try { setCode(await publishCoachCode(user.uid, coachName)); setRows(await listClients(user.uid)); }
    catch (e: any) { setError(e.message || "Could not load clients."); }
    finally { setBusy(false); }
  }
  useEffect(() => { refresh(); p.markSharedSeen(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.uid]);
  const daam = (r: ClientRow) => r.feedback.filter((f) => f.taste === "DaaM good").length;
  const last = (r: ClientRow) => r.feedback[0];
  return (
    <>
      <section className="card">
        <div className="card-top"><span>Your coach code</span><button className="icon" aria-label="Refresh" onClick={refresh}><RefreshCw size={16} className={busy ? "spin" : ""} /></button></div>
        <div className="code-row">
          <b className="code">{code || "…"}</b>
          <button className="pill pill-small" onClick={() => { navigator.clipboard?.writeText(code); notify("Code copied."); }}><Copy size={14} /> Copy</button>
        </div>
        <small>A client enters it once on Me, under Your coach. From then on you see their cards and can set their goal.</small>
      </section>
      <p className="label">Clients ({rows.length})</p>
      {rows.length === 0 && <div className="strip">No clients yet. Share the code.</div>}
      {rows.map((r) => (
        <button className="card client-row" key={r.uid} onClick={() => setOpen(r)}>
          <div className="client-head">
            <span className="avatar">{r.name.slice(0, 1).toUpperCase()}</span>
            <div><b>{r.name}</b><small>{r.goal?.band ? bandOf(r.goal.band)?.name : "no goal yet"} · {r.foods} foods · {r.feedback.length} shared · {daam(r)} DaaM good</small></div>
          </div>
          <small className="client-last">{last(r) ? `${last(r).taste}: ${last(r).meal?.title ?? ""} · ${new Date(last(r).createdAt).toLocaleDateString()}${last(r).notes ? ` · ${last(r).notes}` : ""}` : "no meals yet"} · active {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : "never"}</small>
        </button>
      ))}
      {open && <ClientSheet row={open} coachName={coachName} coachUid={user?.uid ?? ""} meals={p.state.meals} close={() => setOpen(null)} onSaved={refresh} setError={setError} notify={notify} />}
    </>
  );
}

function ClientSheet({ row, coachName, coachUid, meals, close, onSaved, setError, notify }: { row: ClientRow; coachName: string; coachUid: string; meals: any[]; close: () => void; onSaved: () => void; setError: (m: string) => void; notify: (m: string) => void }) {
  const [sending, setSending] = useState(false);
  const [pick, setPick] = useState<string>("");
  const [note, setNote] = useState("");
  const [band, setBand] = useState<string>(row.goal?.band ?? "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<Map<string, string>>(new Map());
  useEffect(() => { loadPhotos(row.uid).then(setPhotos).catch(() => {}); }, [row.uid]);
  const pdOf = (items: any[]) => density(items.reduce((n, i) => n + (i.food.protein ?? 0) * i.grams / 100, 0), items.reduce((n, i) => n + (i.food.calories ?? 0) * i.grams / 100, 0));
  const kcalOf = (items: any[]) => Math.round(items.reduce((n, i) => n + (i.food.calories ?? 0) * i.grams / 100, 0));
  return (
    <div className="sheet-backdrop" onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="card-top"><span>{row.name}</span><button className="link" onClick={close}>Close</button></div>
        <div className="client-goal">
          <div><b>{row.goal?.band ? bandOf(row.goal.band)?.name : "No goal yet"}</b><small>{row.goal?.band ? bandOf(row.goal.band)?.range : ""}{row.goal?.setBy === "coach" ? " · set by you" : row.goal ? " · set by them" : ""}</small></div>
          <button className="pill pill-small" onClick={() => setEditing((v) => !v)}><Target size={14} /> {editing ? "Cancel" : "Change goal"}</button>
        </div>
        {editing && (
          <>
            <div className="bands compact">
              {BANDS.map((b) => (
                <button key={b.id} className={`band-card ${band === b.id ? "on" : ""}`} onClick={() => setBand(b.id)}>
                  <b>{b.name}</b><span>{b.range} · {b.kcal[0]}–{b.kcal[1]} kcal · {b.protein[0]}–{b.protein[1]} g</span>
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
        <div className="button-row" style={{ margin: "4px 0 10px" }}>
          <button className="pill pill-small" onClick={() => setSending((v) => !v)}>{sending ? "Cancel" : "Send a recipe"}</button>
        </div>
        {sending && (
          <section className="card">
            {meals.length === 0 && <small>No saved recipes yet. Make one and save it, then send it.</small>}
            <div className="rows">
              {meals.slice(0, 20).map((m: any) => (
                <button key={m.id} className={`row row-food row-button ${pick === m.id ? "on" : ""}`} onClick={() => setPick(m.id)}>
                  <div className="row-text"><b>{m.title}</b><small>{(m.items ?? []).map((i: any) => `${Math.round(i.grams)} g ${i.food.name}`).join(" · ")}</small></div>
                </button>
              ))}
            </div>
            <textarea placeholder="A line to go with it, if you like" value={note} onChange={(e) => setNote(e.target.value)} />
            <button className="pill pill-primary pill-wide" disabled={!pick} onClick={async () => {
              const m = meals.find((x: any) => x.id === pick); if (!m) return;
              try { await sendRecipe(row.uid, { id: uid(), from: coachUid, note: note.trim(), meal: structuredClone(m), sentAt: new Date().toISOString() }); notify(`Sent to ${row.name}.`); setSending(false); setPick(""); setNote(""); }
              catch (e: any) { setError(e.message || "Could not send."); }
            }}>Send</button>
          </section>
        )}
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
                {items.length > 0 && <small>PD {fixed(pdOf(items))} · {kcalOf(items)} kcal</small>}
              </div>
              {f.notes && <p className="client-note">“{f.notes}”</p>}
            </section>
          );
        })}
      </div>
    </div>
  );
}
