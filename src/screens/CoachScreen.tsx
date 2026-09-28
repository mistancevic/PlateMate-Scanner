import { useEffect, useState } from "react";
import { RefreshCw, Copy, Target } from "lucide-react";
import { listClients, setClientGoal, publishCoachCode, loadPhotos, type ClientRow } from "../cloud";
import { BANDS, bandOf, goalsForBand } from "../goal";
import { fixed } from "../ui";
import { density } from "../pilot";
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
  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.uid]);
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
            <div><b>{r.name}</b><small>{r.goal?.band ? bandOf(r.goal.band)?.name : "no goal yet"} · {r.foods} foods · {daam(r)} DaaM good</small></div>
          </div>
          <small className="client-last">{last(r) ? `${last(r).taste}: ${last(r).meal?.title ?? ""} · ${new Date(last(r).createdAt).toLocaleDateString()}${last(r).notes ? ` · ${last(r).notes}` : ""}` : "no meals yet"} · active {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : "never"}</small>
        </button>
      ))}
      {open && <ClientSheet row={open} coachName={coachName} close={() => setOpen(null)} onSaved={refresh} setError={setError} notify={notify} />}
    </>
  );
}

function ClientSheet({ row, coachName, close, onSaved, setError, notify }: { row: ClientRow; coachName: string; close: () => void; onSaved: () => void; setError: (m: string) => void; notify: (m: string) => void }) {
  const [band, setBand] = useState<string>(row.goal?.band ?? "");
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<Map<string, string>>(new Map());
  useEffect(() => { loadPhotos(row.uid).then(setPhotos).catch(() => {}); }, [row.uid]);
  return (
    <div className="sheet-backdrop" onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="card-top"><span>{row.name}</span><button className="link" onClick={close}>Close</button></div>
        <p className="small">Goal: {row.goal?.band ? bandOf(row.goal.band)?.name : "not set"}{row.goal?.setBy === "coach" ? " (set by you)" : ""}</p>
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
          try { await setClientGoal(row.uid, { band }, goalsForBand(b), coachName); notify(`${row.name}'s goal set to ${b.name}.`); onSaved(); close(); }
          catch (e: any) { setError(e.message || "Could not set the goal."); }
          finally { setSaving(false); }
        }}><Target size={16} /> Set this goal</button>
        <p className="label">What they told you</p>
        {row.feedback.length === 0 && <small>Nothing yet.</small>}
        {row.feedback.slice(0, 20).map((f: any) => (
          <div className="fb" key={f.id}>
            {photos.get(`fb:${f.id}`) && <img className="fb-photo" src={photos.get(`fb:${f.id}`)} alt="" />}
            <b>{f.taste}</b>
            <small>{f.meal?.title} · {new Date(f.createdAt).toLocaleDateString()}{f.notes ? ` · ${f.notes}` : ""}{f.meal?.items?.length ? ` · PD ${fixed(density(f.meal.items.reduce((n: number, i: any) => n + (i.food.protein ?? 0) * i.grams / 100, 0), f.meal.items.reduce((n: number, i: any) => n + (i.food.calories ?? 0) * i.grams / 100, 0)))}` : ""}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
