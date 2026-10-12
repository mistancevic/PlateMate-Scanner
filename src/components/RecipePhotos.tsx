import { useRef, useState } from "react";
import { Camera, Image as ImageIcon, Plus } from "lucide-react";
import type { Feedback, Meal } from "../pilot";
import { recipePhotosOf, withRecipePhotos } from "../photos";
import { resizeImageBase64 } from "../utils/image";
import { useBack } from "../back";

// Photos of a recipe (0.2.5+r10, canvas board S3, R5 and R6, approved 12 October 2026): the cover large, the recipe's own
// photos (up to 6), Take and Gallery to add one; a tapped photo can become the cover or be removed. Below: the plate
// photos from the times it was made, a tap adds one. The cover shows on the tile and leads on the recipe's page.
export const MAX_RECIPE_PHOTOS = 6;
export function cardPhotosOf(meal: Meal, cards: Feedback[]): string[] {
  const out: string[] = [];
  for (const c of cards) {
    if (c.meal?.id !== meal.id && c.meal?.title !== meal.title && c.recipeId !== meal.id) continue;
    const big = (c.photos ?? []).find((x) => typeof x === "string" && x.startsWith("data:image/") && !x.startsWith("data:image/svg"));
    const p = big ?? (c.photo && !c.photo.startsWith("data:image/svg") ? c.photo : null);
    if (p && !out.includes(p)) out.push(p);
  }
  return out;
}
const read = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsDataURL(f); });

export function RecipePhotos({ meal, cards, onPhotos, close }: { meal: Meal; cards: Feedback[]; onPhotos: (patch: Pick<Meal, "photo" | "photos">) => void; close: () => void }) {
  useBack(true, close);
  const list = recipePhotosOf(meal);
  const [at, setAt] = useState(0);
  const sel = Math.min(at, Math.max(0, list.length - 1));
  const takeRef = useRef<HTMLInputElement>(null), pickRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const set = (next: string[]) => onPhotos(withRecipePhotos(next.slice(0, MAX_RECIPE_PHOTOS)));
  const add = async (data: string) => {
    if (list.includes(data) || list.length >= MAX_RECIPE_PHOTOS) return;
    set([...list, data]); setAt(list.length);
  };
  const fromFile = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    try { const raw = await read(f); await add(await resizeImageBase64(raw, 1080, 1080).catch(() => raw)); } finally { setBusy(false); }
  };
  const offered = cardPhotosOf(meal, cards).filter((p) => !list.includes(p));
  const full = list.length >= MAX_RECIPE_PHOTOS;
  return (
    <div className="sheet-backdrop" onClick={close}>
      <div className="sheet recipe-photos" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`Photos of ${meal.title}`}>
        <div className="card-top"><span>{meal.title}</span><button className="link" onClick={close}>Close</button></div>
        <h2 className="rph-title">Photos</h2>
        <p className="small muted rph-sub">The cover shows on the recipe's tile and leads on the recipe's page.</p>
        {list.length > 0
          ? <figure className="rph-hero"><img src={list[sel]} alt={sel === 0 ? `The cover of ${meal.title}` : `Photo ${sel + 1} of ${meal.title}`} />{sel === 0 && <span className="rph-cover">Cover</span>}</figure>
          : <div className="rph-empty">No photo yet. Take one, or pick one from the gallery.</div>}
        <div className="publish-photos">
          {list.map((src, i) => <button key={i} className={`publish-photo ${sel === i ? "on" : ""}`} onClick={() => setAt(i)} aria-label={`Photo ${i + 1}${i === 0 ? ", the cover" : ""}${sel === i ? ", picked" : ""}`}><img src={src} alt="" /></button>)}
          {!full && <button className="publish-photo add rph-add" disabled={busy} onClick={() => takeRef.current?.click()}><Camera size={18} /><span>Take</span></button>}
          {!full && <button className="publish-photo add rph-add" disabled={busy} onClick={() => pickRef.current?.click()}><ImageIcon size={18} /><span>Gallery</span></button>}
          <input ref={takeRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; void fromFile(f); }} />
          <input ref={pickRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; void fromFile(f); }} />
        </div>
        {full && <small className="muted">Six photos is the most a recipe keeps. Remove one to add another.</small>}
        {list.length > 0 && (
          <div className="button-row rph-actions">
            {sel === 0
              ? <button className="pill pill-small pill-primary" disabled>The cover</button>
              : <button className="pill pill-small pill-primary" onClick={() => { set([list[sel], ...list.filter((_, i) => i !== sel)]); setAt(0); }}>Make it the cover</button>}
            <button className="pill pill-small" onClick={() => { set(list.filter((_, i) => i !== sel)); setAt(Math.max(0, sel - 1)); }}>Remove</button>
          </div>
        )}
        {offered.length > 0 && !full && (
          <>
            <b className="field-label rph-from">From the times you made it</b>
            <div className="publish-photos">
              {offered.slice(0, 8).map((src, i) => <button key={i} className="publish-photo rph-offer" onClick={() => void add(src)} aria-label={`Add plate photo ${i + 1} to the recipe`}><img src={src} alt="" /><span className="rph-plus"><Plus size={14} /></span></button>)}
            </div>
            <small className="muted">Plate photos you took after cooking. Tap one to add it to the recipe.</small>
          </>
        )}
      </div>
    </div>
  );
}
