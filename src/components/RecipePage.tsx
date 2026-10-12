import { useEffect, useRef, useState } from "react";
import { Camera, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import type { Feedback, Food, Ingredient, Meal } from "../pilot";
import { aggregate, density } from "../pilot";
import { fmt, pdText } from "../ui";
import { recipePhotosOf, withRecipePhotos } from "../photos";
import { resizeImageBase64 } from "../utils/image";
import { useBack } from "../back";
import { ConfirmButton } from "./Confirm";
import { cardPhotosOf, MAX_RECIPE_PHOTOS } from "./RecipePhotos";
import type { Published } from "./PublishSheet";

// The recipe's own page in the app (0.2.5+r11, canvas board S3, R8 to R11, approved 12 October 2026). Photos first: the
// cover large, every photo with × to delete, ‹ › to move the picked one (first place is the cover), Add. Then the name
// (tap to rename), the numbers, the foods, the steps. Make it cooks it now: the recipe goes on the Plate and stays as it
// is. Edit recipe changes the recipe itself, on this page. On chefmealan.com: where the recipe is, See live page and
// Change live page. Delete recipe at the end.
export type PubState = "draft" | "live" | "waiting" | "back" | "down" | null;
const read = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsDataURL(f); });
const uid = () => Math.random().toString(36).slice(2, 10);

export function RecipePage({ meal, cards, foods, cook, state, pub, approver, direct, unpublished = [], onPatch, onRename, onMakeIt, onPublish, onDelete, close }: {
  meal: Meal; cards: Feedback[]; foods: Food[]; cook: boolean; state: PubState; pub: Published | null; approver: string; direct: boolean; unpublished?: string[];
  onPatch: (patch: Partial<Meal>) => void; onRename: (title: string) => void; onMakeIt: () => void; onPublish: () => void; onDelete: () => void; close: () => void;
}) {
  useBack(true, close);
  useEffect(() => { try { window.scrollTo(0, 0); document.querySelector("main")?.scrollTo?.(0, 0); } catch { /* nothing to scroll */ } }, [meal.id]);
  // ---- photos (R8, R9) ----
  const list = recipePhotosOf(meal);
  const [at, setAt] = useState(0);
  const sel = Math.min(at, Math.max(0, list.length - 1));
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const setPhotos = (next: string[]) => onPatch(withRecipePhotos(next.slice(0, MAX_RECIPE_PHOTOS)));
  const add = (data: string) => { if (list.includes(data) || list.length >= MAX_RECIPE_PHOTOS) return; setPhotos([...list, data]); setAt(list.length); };
  const fromFile = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    try { const raw = await read(f); add(await resizeImageBase64(raw, 1080, 1080).catch(() => raw)); } finally { setBusy(false); }
  };
  const move = (from: number, to: number) => { const next = [...list]; const [x] = next.splice(from, 1); next.splice(to, 0, x); setPhotos(next); setAt(to); };
  const offered = cardPhotosOf(meal, cards).filter((x) => !list.includes(x));
  const full = list.length >= MAX_RECIPE_PHOTOS;
  // ---- the name (rename on the page) ----
  const [naming, setNaming] = useState<string | null>(null);
  const saveName = () => { if (naming !== null) { const t = naming.trim(); if (t && t !== meal.title) onRename(t); setNaming(null); } };
  // ---- edit mode (R11): a draft of the foods, the grams and the steps; nothing changes until Save changes ----
  const [edit, setEdit] = useState<{ items: Ingredient[]; steps: string } | null>(null);
  const [find, setFind] = useState<string | null>(null);
  const items = edit ? edit.items : meal.items;
  const sum = aggregate(items.filter((i) => i.grams > 0));
  const pd = density(sum.protein, sum.calories);
  const startEdit = () => { setEdit({ items: meal.items.map((i) => ({ ...i })), steps: (meal.steps ?? []).join("\n") }); setFind(null); };
  const save = () => {
    if (!edit) return;
    const kept = edit.items.filter((i) => i.grams > 0);
    if (!kept.length) return;
    onPatch({ items: kept, portion: kept.reduce((n, i) => n + i.grams, 0), steps: edit.steps.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 30) });
    setEdit(null); setFind(null);
  };
  const matches = find === null ? [] : foods.filter((f) => !items.some((i) => i.food.id === f.id) && (!find.trim() || f.name.toLowerCase().includes(find.trim().toLowerCase()))).slice(0, 8);
  const live = state === "live" && pub;
  return (
    <div className="rq">
      <button className="link rq-back" onClick={close}><ChevronLeft size={18} /> Recipes</button>
      {/* R8: the photos first */}
      {list.length > 0
        ? <figure className="rq-hero"><img src={list[sel]} alt={sel === 0 ? `The cover of ${meal.title}` : `Photo ${sel + 1} of ${meal.title}`} />{sel === 0 && <span className="rph-cover">Cover</span>}</figure>
        : <button className="rq-hero rq-hero-empty" onClick={() => fileRef.current?.click()}><Camera size={26} /><span>Add a photo</span></button>}
      <div className="rq-thumbs">
        {list.map((src, i) => (
          <div key={i} className="rq-thumb">
            <button className={`publish-photo ${sel === i ? "on" : ""}`} onClick={() => setAt(i)} aria-label={`Photo ${i + 1}${i === 0 ? ", the cover" : ""}${sel === i ? ", picked" : ""}`}><img src={src} alt="" /></button>
            {i === 0 && <span className="rq-cover-tag">Cover</span>}
            <ConfirmButton className="rq-del" ariaLabel={`Delete photo ${i + 1}`} label={<X size={13} />} confirmLabel="Sure?"
              onConfirm={() => { setPhotos(list.filter((_, k) => k !== i)); setAt(Math.max(0, Math.min(sel, list.length - 2))); }} />
            {sel === i && list.length > 1 && (
              <div className="rq-move">
                <button className="pill pill-small" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="Move the photo earlier"><ChevronLeft size={16} /></button>
                <button className="pill pill-small" disabled={i === list.length - 1} onClick={() => move(i, i + 1)} aria-label="Move the photo later"><ChevronRight size={16} /></button>
              </div>
            )}
          </div>
        ))}
        {!full && <button className="publish-photo add rph-add" disabled={busy} onClick={() => fileRef.current?.click()}><Camera size={18} /><span>Add</span></button>}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; void fromFile(f); }} />
      </div>
      <small className="muted rq-hint">{list.length === 0 ? "A photo makes the recipe easy to find, here and on its page." : list.length === 1 ? "This photo is the cover. × deletes it." : sel === 0 ? "The first photo is the cover. Tap a photo to move it with ‹ ›; × deletes it." : `Photo ${sel + 1} of ${list.length}. ‹ moves it earlier: in first place it becomes the cover.`}</small>
      {offered.length > 0 && !full && (
        <div className="rq-offer">
          <small className="muted">From the times you made it, a tap adds the photo:</small>
          <div className="rq-offer-row">{offered.slice(0, 6).map((src, i) => <button key={i} className="publish-photo rph-offer" onClick={() => add(src)} aria-label={`Add plate photo ${i + 1} to the recipe`}><img src={src} alt="" /><span className="rph-plus"><Plus size={14} /></span></button>)}</div>
        </div>
      )}
      {edit && <span className="rq-editing">Editing the recipe</span>}
      {/* the name: tap to rename (the dashed field, as on the Plate) */}
      {naming !== null
        ? <input className="title-input rq-name-input" aria-label="Name of the recipe" autoFocus value={naming} onChange={(e) => setNaming(e.target.value)} onBlur={saveName} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} enterKeyHint="done" maxLength={80} />
        : <button type="button" className="rq-name" aria-label={`Rename ${meal.title}`} onClick={() => setNaming(meal.title)}>{meal.title}</button>}
      <div className="rp-stats">
        <span><b>{fmt(sum.calories, 0)}</b><small>kcal</small></span>
        <span><b>{fmt(sum.protein, 1)}</b><small>g protein</small></span>
        <span className="wide"><b>{pdText(pd)}</b><small>protein density</small></span>
      </div>
      <section className={`card rq-foods ${edit ? "editing" : ""}`}>
        <b>Foods</b>
        {items.map((it, k) => (
          <div className="sheet-row rq-food" key={it.id}>
            <small>{it.food.name}</small>
            {edit
              ? <span className="rq-grams">
                  <input inputMode="numeric" aria-label={`Grams of ${it.food.name}`} value={String(it.grams || "")} onChange={(e) => { const g = Math.min(5000, Number(e.target.value.replace(/[^\d]/g, "")) || 0); setEdit({ ...edit, items: edit.items.map((x, j) => (j === k ? { ...x, grams: g } : x)) }); }} /> g
                  <button className="rq-x" aria-label={`Remove ${it.food.name}`} onClick={() => setEdit({ ...edit, items: edit.items.filter((_, j) => j !== k) })}><X size={14} /></button>
                </span>
              : <b>{fmt(it.grams, 0)} g</b>}
          </div>
        ))}
        {edit && (find === null
          ? <button className="pill pill-small rq-addfood" onClick={() => setFind("")}><Plus size={14} /> Add a food</button>
          : (
            <div className="rq-find">
              <input autoFocus placeholder="Search my foods" aria-label="Search my foods" value={find} onChange={(e) => setFind(e.target.value)} />
              {matches.map((f) => <button key={f.id} className="rq-find-row" onClick={() => { setEdit({ ...edit, items: [...edit.items, { id: uid(), food: f, grams: 100, locked: false }] }); setFind(null); }}><span>{f.name}</span><small>{fmt(f.calories, 0)} kcal · {fmt(f.protein, 1)} g protein per 100 g</small></button>)}
              {matches.length === 0 && <small className="muted">No food with that name. Foods come from Foods in the menu, or a scan on the Plate.</small>}
              <button className="link" onClick={() => setFind(null)}>Close the search</button>
            </div>
          ))}
      </section>
      <section className={`card rq-steps ${edit ? "editing" : ""}`}>
        <b>Steps</b>
        {edit
          ? <><textarea aria-label="Steps" value={edit.steps} onChange={(e) => setEdit({ ...edit, steps: e.target.value })} placeholder="One step per line." /><small className="muted">One step per line.</small></>
          : (meal.steps?.length ?? 0) > 0
            ? <ol className="rp-steps">{meal.steps!.map((x, k) => <li key={k}><span>{k + 1}</span>{x}</li>)}</ol>
            : <small className="muted">No steps yet. Edit recipe adds them.</small>}
      </section>
      {edit ? (
        <>
          <button className="pill pill-wide pill-primary" disabled={!edit.items.some((i) => i.grams > 0)} onClick={save}>Save changes</button>
          <small className="muted rq-under">{edit.items.some((i) => i.grams > 0) ? "The numbers above follow as you type." : "A recipe needs at least one food."}</small>
          <button className="pill pill-wide" onClick={() => { setEdit(null); setFind(null); }}>Cancel</button>
          {live && <small className="muted rq-under">Live on chefmealan.com: the live page changes only with Change live page.</small>}
        </>
      ) : (
        <>
          {/* R10: two intentions, two buttons */}
          <button className="pill pill-wide pill-primary" onClick={onMakeIt}>Make it</button>
          <small className="muted rq-under">Cook it now: the recipe goes on the Plate, Fit to my target sets today's amounts. The recipe stays as it is.</small>
          <button className="pill pill-wide" onClick={startEdit}>Edit recipe</button>
          <small className="muted rq-under">Change the recipe itself: the foods, the grams, the steps.</small>
          {cook && (
            <section className="card rq-pub">
              <div className="card-top"><b>On chefmealan.com</b>{state && <small className={`pub-state ${state}`}>{state === "live" ? "Live" : state === "down" ? "Taken down" : state === "waiting" ? `Waiting for ${approver}` : state === "back" ? "Sent back" : "Draft"}</small>}</div>
              {live && unpublished.length > 0 && <small className="pub-pending" title={`Changed: ${unpublished.join(", ")}`}>Changes not published yet</small>}
              <small className="muted">{
                live ? `chefmealan.com/r/${pub!.slug}. Anyone with the link sees the page, with the cover first.`
                : state === "waiting" ? `${approver.charAt(0).toUpperCase() + approver.slice(1)} sees the page first and makes it live, or sends it back with a note.`
                : state === "back" ? `${approver.charAt(0).toUpperCase() + approver.slice(1)} sent it back${pub?.note ? `: “${pub.note}”` : "."}`
                : state === "down" ? "The link says this recipe was taken down."
                : state === "draft" ? "A draft, only here. Continue where you left off."
                : "Not on the site yet. Publishing gives the recipe its own page and link."}</small>
              <div className="button-row">
                {live && <a className="pill pill-small" href={`/r/${pub!.slug}`} target="_blank" rel="noreferrer">See live page</a>}
                <button className={`pill pill-small${live && unpublished.length && direct ? " pill-primary" : ""}`} onClick={onPublish}>{
                  live ? (unpublished.length && direct ? "Publish the changes" : "Change live page") : state === "waiting" ? "See what you sent" : state === "down" ? (direct ? "Publish again" : `Send to ${approver} again`) : state === "draft" || state === "back" ? "Continue" : "Publish"}</button>
              </div>
            </section>
          )}
          <ConfirmButton className="link link-danger rq-delete" label="Delete recipe" confirmLabel="Sure? Tap again to delete" onConfirm={onDelete} />
        </>
      )}
    </div>
  );
}
