import { useEffect, useRef, useState, type ReactNode } from "react";
import { tempsIn } from "../units";
import { Camera, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import type { Feedback, Food, Ingredient, Meal, StepMark } from "../pilot";
import { aggregate, density } from "../pilot";
import { fmt, pdText } from "../ui";
import { recipePhotosOf, withRecipePhotos } from "../photos";
import { resizeImageBase64 } from "../utils/image";
import { useBack, recipePath } from "../back";
import { log } from "../log";
import { ConfirmButton } from "./Confirm";
import { cardPhotosOf, MAX_RECIPE_PHOTOS } from "./RecipePhotos";
import type { Published } from "./PublishSheet";
import { StepsEditor } from "./StepsEditor";
import { CountAmount, isCounted } from "./CountAmount";
import { OriginalSteps, StepsHint } from "./StepsView";
import { foodNames, diffFoods, diffLine } from "../stepsState";
import { stepParts } from "../steps";
import { coverIsDrawn, isDrawnPhoto, TEST_MODELS } from "../covers";
import { sig } from "../photos";
import { CHEF_NAME } from "./Mark";
import { partsOf, cleanPart, leanFood } from "../parts";
import { nutritionOf, byPart } from "../nutrition";
import { portionsIn } from "../pilot";

// The recipe's own page in the app (0.2.5+r11, canvas board S3, R8 to R11, approved 12 October 2026). Photos first: the
// cover large, every photo with × to delete, ‹ › to move the picked one (first place is the cover), Add. Then the name
// (tap to rename), the numbers, the foods, the steps. Make it cooks it now: the recipe goes on the Plate and stays as it
// is. Edit recipe changes the recipe itself, on this page. On chefmealan.com: where the recipe is, See live page and
// Change live page. Delete recipe at the end.
export type PubState = "draft" | "live" | "waiting" | "back" | "down" | null;
const read = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsDataURL(f); });
const uid = () => Math.random().toString(36).slice(2, 10);

export function RecipePage({ meal, cards, foods, cook, state, pub, approver, direct, unpublished = [], onPatch, onRename, onMakeIt, onPublish, onDelete, close, draft, membersPanel, tryPhoto, picture, top, openOriginal, originalFoods, pdRef, fitPd }: {
  // 0.2.18 (canvas board IM, IM11, IM11b): Draw a picture, with the day's count; none without the AI
  picture?: { count: { used: number; limit: number } | null; drawing: boolean; draw: () => void; refresh: () => void } | null;
  // 0.2.11 (canvas board CO, CO4, CO4b): For members, on a recipe of yours
  membersPanel?: React.ReactNode;
  // 0.2.13: a realistic photo to try against the drawing; the owner only, on the preview
  tryPhoto?: ((model: string) => Promise<string>) | null;
  // 0.2.10 (canvas board CH, CH5): Chef Mealan drafts the steps; none without the AI
  draft?: (() => Promise<{ ok: true; steps: string[]; marks?: StepMark[]; kitchen?: string; parts?: string[] } | { ok: false; why: string; cannot?: boolean }>) | null;
  meal: Meal; cards: Feedback[]; foods: Food[]; cook: boolean; state: PubState; pub: Published | null; approver: string; direct: boolean; unpublished?: string[];
  onPatch: (patch: Partial<Meal>) => void; onRename: (title: string) => void; onMakeIt: () => void; onPublish: (now?: boolean) => void; onDelete: ReactNode; close: () => void;
  // IM23c (0.2.23): one line for today after How was it; the recipe a changed dish was adapted from
  top?: ReactNode; openOriginal?: (() => void) | null;
  // RP1b (0.2.25): the foods the original steps were written for, so the page can say what differs
  originalFoods?: string[] | null;
  // RP2 (0.2.25): the readout above the Nutrition table, against your target
  pdRef?: number | null; fitPd?: (pd: number | null) => string;
}) {
  // R8 (0.2.31): the page has its own address while it is open; Back goes to the list
  useBack(true, close, recipePath(meal.id));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { picture?.refresh(); }, [meal.id]);
  useEffect(() => { try { window.scrollTo(0, 0); document.querySelector("main")?.scrollTo?.(0, 0); } catch { /* nothing to scroll */ } }, [meal.id]);
  // ---- photos (R8, R9) ----
  const list = recipePhotosOf(meal);
  const [at, setAt] = useState(0);
  const sel = Math.min(at, Math.max(0, list.length - 1));
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const setPhotos = (next: string[]) => onPatch(withRecipePhotos(next.slice(0, MAX_RECIPE_PHOTOS)));
  // a drawn cover (0.2.11, board CO, CO1): your own photo goes first; the drawn picture stays behind it, for members
  const drawn = coverIsDrawn(meal);
  const add = (data: string) => {
    if (list.includes(data) || list.length >= MAX_RECIPE_PHOTOS) return;
    if (drawn) { setPhotos([data, ...list]); setAt(0); log("cover", { how: "real" }); return; }
    setPhotos([...list, data]); setAt(list.length);
  };
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
  const [edit, setEdit] = useState<{ items: Ingredient[]; steps: string[]; optional: NonNullable<Meal["optional"]> } | null>(null);
  const [newPart, setNewPart] = useState<string | null>(null);
  const [extraParts, setExtraParts] = useState<string[]>([]);
  const [find, setFind] = useState<string | null>(null);
  const items = edit ? edit.items : meal.items;
  const sum = aggregate(items.filter((i) => i.grams > 0));
  // how many servings the numbers are for (IM21): the recipe's own count, or the portions the plate divides it into
  const serves = meal.makes?.n ?? portionsIn(meal);
  const oneWord = meal.makes ? meal.makes.unit.replace(/s$/, "") : "portion";
  const pd = density(sum.protein, sum.calories);
  const startEdit = () => { setEdit({ items: meal.items.map((i) => ({ ...i })), steps: [...(meal.steps ?? [])], optional: [...(meal.optional ?? [])] }); setFind(null); setExtraParts([]); };
  // parts in Edit recipe (0.2.19, IM18): each food's part, a new part, optional on and off
  const editParts = edit ? [...new Set([...partsOf(edit.items, edit.optional), ...extraParts])] : [];
  const PartPick = ({ value, onPick }: { value: string; onPick: (v: string) => void }) => <select className="pt-chip pt-select" aria-label="Part" value={value} onChange={(e) => onPick(e.target.value)}><option value="">No part</option>{[...new Set([...editParts, ...(value ? [value] : [])])].map((x) => <option key={x} value={x}>{x}</option>)}</select>;
  const save = () => {
    if (!edit) return;
    const kept = edit.items.filter((i) => i.grams > 0);
    if (!kept.length) return;
    const steps = edit.steps.map((x) => x.replace(/\s+/g, " ").trim()).filter(Boolean).slice(0, 30), total = kept.reduce((n, i) => n + i.grams, 0);
    // a recipe that says how many it makes keeps its portions; steps changed by hand lose their marks (0.2.18, IM9)
    const same = JSON.stringify(steps) === JSON.stringify(meal.steps ?? []);
    onPatch({ items: kept, portion: meal.makes ? Math.round(total / meal.makes.n) : total, steps, optional: edit.optional.length ? edit.optional : undefined, ...(same ? {} : { stepMarks: undefined, stepsKitchen: undefined, stepParts: undefined }) });
    setEdit(null); setFind(null);
  };
  const matches = find === null ? [] : foods.filter((f) => !items.some((i) => i.food.id === f.id) && (!find.trim() || f.name.toLowerCase().includes(find.trim().toLowerCase()))).slice(0, 8);
  const live = state === "live" && pub;
  // ---- the steps, drafted by Chef Mealan (CH5): shown to read, kept only with Keep these steps ----
  const [drafted, setDrafted] = useState<{ steps: string[]; marks?: StepMark[]; kitchen?: string; parts?: string[] } | null>(null);
  const [drafting, setDrafting] = useState<"" | "working" | string>("");
  // RP1c (0.2.25): Chef Mealan's steps or the original, when both are there
  const [stepView, setStepView] = useState<"own" | "orig">("own");
  const askDraft = async () => {
    if (!draft) return;
    setDrafting("working");
    try { const d = await draft(); if (d.ok) { setDrafted({ steps: d.steps, marks: d.marks, kitchen: d.kitchen, parts: d.parts }); setDrafting(""); } else if ((d as { cannot?: boolean }).cannot) setDrafting((d as { why: string }).why); else setDrafting(`Chef Mealan's draft didn't pass the checks (${(d as { why: string }).why}). Try again, or write your own.`); }
    catch (e: any) { setDrafting(e?.message || "Chef Mealan could not answer. Try again."); }
  };
  return (
    <div className="rq">
      <button className="link rq-back" onClick={close}><ChevronLeft size={18} /> Recipes</button>
      {top}
      {/* R8: the photos first */}
      {drawn
        ? <figure className="rq-hero"><img src={list[0]} alt={`Picture of ${meal.title} by ${CHEF_NAME}`} /><span className="rq-drawn">Picture by {CHEF_NAME}</span></figure>
        : list.length > 0
        ? <figure className="rq-hero"><img src={list[sel]} alt={sel === 0 ? `The cover of ${meal.title}` : `Photo ${sel + 1} of ${meal.title}`} />{sel === 0 && <span className="rph-cover">Cover</span>}{isDrawnPhoto(meal, list[sel]) && <span className="rq-drawn">Picture by {CHEF_NAME}</span>}</figure>
        : <button className="rq-hero rq-hero-empty" onClick={() => fileRef.current?.click()}><Camera size={26} /><span>Add a photo</span></button>}
      {drawn && (<>
        <small className="muted rq-hint">{CHEF_NAME} drew it from your foods and amounts when you kept the dish, so you find it at a glance. Your own photo replaces it.</small>
        <div className="button-row rq-drawn-row"><button className="pill pill-small" disabled={busy} onClick={() => fileRef.current?.click()}>Add my photo</button></div>
      </>)}
      <div className="rq-thumbs" hidden={drawn}>
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
      {picture && list.length === 0 && !drawn && (() => {
        const c = picture.count, out = c ? c.used >= c.limit : false;
        return (
          <section className="card rq-nopic" aria-label="No picture yet">
            <b>No picture yet.</b>
            <div className="button-row">
              <button className={`pill pill-small ${out ? "" : "pill-primary"}`} disabled={out || picture.drawing} onClick={picture.draw}>{picture.drawing ? `${CHEF_NAME} is drawing…` : "Draw a picture"}</button>
              <button className={`pill pill-small ${out ? "pill-primary" : ""}`} disabled={busy} onClick={() => fileRef.current?.click()}>Add my photo</button>
            </div>
            <small className="muted">{c ? `${CHEF_NAME}'s pictures today: ${c.used} of ${c.limit}. ${out ? "Draw one tomorrow, or add your own photo now." : "Your own photo is always better."}` : "Your own photo is always better."}</small>
          </section>
        );
      })()}
      {!drawn && !(picture && list.length === 0) && <small className="muted rq-hint">{list.length === 0 ? "A photo makes the recipe easy to find, here and on its page." : list.length === 1 ? "This photo is the cover. × deletes it." : sel === 0 ? "The first photo is the cover. Tap a photo to move it with ‹ ›; × deletes it." : `Photo ${sel + 1} of ${list.length}. ‹ moves it earlier: in first place it becomes the cover.`}</small>}
      {offered.length > 0 && !full && (
        <div className="rq-offer">
          <small className="muted">From the times you made it, a tap adds the photo:</small>
          <div className="rq-offer-row">{offered.slice(0, 6).map((src, i) => <button key={i} className="publish-photo rph-offer" onClick={() => add(src)} aria-label={`Add plate photo ${i + 1} to the recipe`}><img src={src} alt="" /><span className="rph-plus"><Plus size={14} /></span></button>)}</div>
        </div>
      )}
      {tryPhoto && <TryPhoto meal={meal} tryPhoto={tryPhoto} use={(img) => { const list = recipePhotosOf(meal).filter((x) => x !== img); onPatch({ ...withRecipePhotos([img, ...list].slice(0, MAX_RECIPE_PHOTOS)), coverSig: sig(img) }); }} />}
      {edit && <span className="rq-editing">Editing the recipe</span>}
      {/* the name: tap to rename (the dashed field, as on the Plate) */}
      {naming !== null
        ? <input className="title-input rq-name-input" aria-label="Name of the recipe" autoFocus value={naming} onChange={(e) => setNaming(e.target.value)} onBlur={saveName} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} enterKeyHint="done" maxLength={80} />
        : <button type="button" className="rq-name" aria-label={`Rename ${meal.title}`} onClick={() => setNaming(meal.title)}>{meal.title}</button>}
      {meal.source && <SourceBox meal={meal} onPatch={onPatch} openOriginal={openOriginal ?? null} />}
      {/* IM21: one serving first, when the recipe makes more than one */}
      {/* RP2 (0.2.25): the three tiles gave way to the PD readout above the Nutrition table */}
      <section className={`card rq-foods ${edit ? "editing" : ""}`}>
        <b>Foods</b>
        {edit && <div className="pt-h pt-mode"><span><small>Parts: give a food its part, or make it optional. Optional foods stay out of the numbers.</small></span><span className="pt-acts">{newPart === null ? <button className="link" onClick={() => setNewPart("")}>New part</button> : <input className="pt-new" autoFocus aria-label="Name of the new part" placeholder="Topping" value={newPart} onChange={(e) => setNewPart(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { const v = cleanPart(newPart); if (v) setExtraParts((l) => [...l, v]); setNewPart(null); } }} onBlur={() => setNewPart(null)} />}</span></div>}
        {items.map((it, k) => {
          const head = !edit && it.part && (k === 0 || items[k - 1].part !== it.part) ? <div className="rq-part" key={`h${k}`}>{it.part}</div> : null;
          return [head, (
          <div className="sheet-row rq-food" key={it.id}>
            {edit ? <span className="rq-food-edit"><small>{it.food.name}</small><span className="pt-chips"><PartPick value={it.part ?? ""} onPick={(v) => setEdit({ ...edit, items: edit.items.map((x, j) => (j === k ? { ...x, part: v || undefined } : x)) })} /> <button type="button" className="pt-chip off" onClick={() => setEdit({ ...edit, items: edit.items.filter((_, j) => j !== k), optional: [...edit.optional, { name: it.food.name, written: "", grams: it.grams, food: leanFood(it.food), ...(it.part ? { part: it.part } : {}) }] })}>Optional</button></span></span> : <small>{it.food.name}</small>}            {edit
              ? <span className="rq-grams">
                  <input inputMode="numeric" aria-label={`Grams of ${it.food.name}`} value={String(it.grams || "")} onChange={(e) => { const g = Math.min(5000, Number(e.target.value.replace(/[^\d]/g, "")) || 0); setEdit({ ...edit, items: edit.items.map((x, j) => (j === k ? { ...x, grams: g } : x)) }); }} /> g
                  <button className="rq-x" aria-label={`Remove ${it.food.name}`} onClick={() => setEdit({ ...edit, items: edit.items.filter((_, j) => j !== k) })}><X size={14} /></button>
                </span>
              : isCounted(it) ? <CountAmount item={it} editable={false} onGrams={() => {}} /> : <b>{fmt(it.grams, 0)} g</b>}
          </div>)];
        })}
        {edit && edit.optional.map((o, k) => (
          <div className="sheet-row rq-food rq-food-opt" key={`o${k}`}>
            <span className="rq-food-edit"><small>{o.name}</small><span className="pt-chips"><PartPick value={o.part ?? ""} onPick={(v) => setEdit({ ...edit, optional: edit.optional.map((x, j) => (j === k ? { ...x, part: v || undefined } : x)) })} /> <button type="button" className="pt-chip" onClick={() => setEdit({ ...edit, optional: edit.optional.filter((_, j) => j !== k), items: [...edit.items, { id: uid(), food: o.food, grams: o.grams, locked: false, ...(o.part ? { part: o.part } : {}) }] })}>✓ Optional</button></span></span>
            <b>{fmt(o.grams, 0)} g</b>
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
      {/* IM8, IM14: optional foods stay with the recipe, out of the numbers; the plate adds them */}
      {!edit && (meal.optional?.length ?? 0) > 0 && (
        <section className="card rq-optional" aria-label="Optional, not in the numbers">
          <b>Optional, not in the numbers</b>
          {meal.optional!.map((o, k) => (
            <div className="rq-opt-row" key={k}>
              <span className="rq-opt-name"><span>{o.name}</span><small>{[o.part, o.note || (o.written ? `${o.written} on the recipe` : "")].filter(Boolean).join(" · ") || "optional"}</small></span>
              <b>{fmt(o.grams, 0)} g</b>
            </div>
          ))}
          <small className="muted">The recipe's numbers leave them out, and so do ours. Make it, and add any of them on the plate.</small>
        </section>
      )}
      <NutritionCard items={items} serves={serves} one={oneWord} all={meal.makes?.unit ?? "portions"} stated={meal.stated ?? null} pdRef={pdRef ?? null} fitPd={fitPd} readoutOnly={Boolean(edit)} />
      <section className={`card rq-steps ${edit ? "editing" : ""}`}>
        <b>Steps</b>
        {edit
          ? <StepsEditor steps={edit.steps} items={edit.items} onChange={(steps) => setEdit((e) => (e ? { ...e, steps } : e))} />
          : drafted ? (<>
              <small className="rq-drafted">{drafted.marks ? (drafted.kitchen || `${CHEF_NAME}'s steps, from the original, for your amounts and your kitchen. Each says how it relates to the original.`) : "Drafted by Chef Mealan from your foods and amounts. Read it, change any word."}</small>
              {drafted.marks && drafted.kitchen && <small className="muted">Each step says how it relates to the original.</small>}
              <ol className="rp-steps">{drafted.steps.map((x, k) => [partHead(drafted.parts, k), <li key={k}><span>{k + 1}</span><div className="rp-step-text">{stepParts(tempsIn(x), meal.items).map((p, j) => ("text" in p ? p.text : <b key={j} className="st-amt">{p.label}</b>))}<Mark m={drafted.marks?.[k]} /></div></li>])}</ol>
              <div className="button-row"><button className="pill pill-small pill-primary" onClick={() => { onPatch({ steps: drafted.steps, stepMarks: drafted.marks, stepsKitchen: drafted.kitchen, stepParts: drafted.parts, stepsFor: foodNames(meal.items) }); setDrafted(null); }}>Keep these steps</button><button className="pill pill-small" onClick={askDraft}>Draft again</button><button className="link" onClick={() => { setDrafted(null); startEdit(); }}>Write my own</button></div>
            </>)
          : (() => {
            // RP1 to RP1c (0.2.25): the original is the steps; Chef Mealan's on demand, with a line for the case
            const orig = meal.source?.steps ?? [], own = meal.steps ?? [];
            const now = foodNames(meal.items);
            const diff = diffFoods(now, originalFoods ?? null), stale = own.length ? diffFoods(now, meal.stepsFor) : null;
            const status = drafting === "working" ? <small className="rq-drafting">Chef Mealan is writing the steps.</small> : drafting ? <small className="rq-drafting">{drafting}</small> : null;
            const by = meal.source?.name ? `As ${meal.source.name} writes them, for the whole recipe.` : "As the original writes them, for the whole recipe.";
            const ownList = (<>
              {stale && <StepsHint tone="warn">These steps were written for the earlier foods. {diffLine(stale)}</StepsHint>}
              {stale && draft && <div className="button-row"><button className="pill pill-small pill-primary" disabled={drafting === "working"} onClick={askDraft}>Write them again</button></div>}
              {meal.stepMarks && <small className="muted">{meal.stepsKitchen || `${CHEF_NAME}'s steps, from the original, for your amounts and your kitchen. Each says how it relates to the original.`}</small>}
              <ol className="rp-steps">{own.map((x, k) => [partHead(meal.stepParts, k), <li key={k}><span>{k + 1}</span><div className="rp-step-text">{stepParts(tempsIn(x), meal.items).map((p, j) => ("text" in p ? p.text : <b key={j} className={`st-amt${p.gone ? " gone" : ""}`}>{p.label}</b>))}<Mark m={meal.stepMarks?.[k]} /></div></li>])}</ol>
            </>);
            if (own.length && orig.length) return (<>
              <div className="segments rq-steps-seg" role="tablist" aria-label="Which steps">
                <button role="tab" aria-selected={stepView === "own"} className={`seg ${stepView === "own" ? "on" : ""}`} onClick={() => setStepView("own")}>{meal.stepMarks ? `${CHEF_NAME}'s` : "Yours"}</button>
                <button role="tab" aria-selected={stepView === "orig"} className={`seg ${stepView === "orig" ? "on" : ""}`} onClick={() => setStepView("orig")}>Original</button>
              </div>
              {status}
              {stepView === "own" ? ownList : <><small className="muted">{by}</small><OriginalSteps steps={orig} /></>}
            </>);
            if (own.length) return <>{status}{ownList}</>;
            if (orig.length) return diff ? (<>
              <StepsHint tone="warn">{diffLine(diff)}</StepsHint>
              {status}
              {draft && <div className="button-row"><button className="pill pill-small pill-primary" disabled={drafting === "working"} onClick={askDraft}>Write the steps for my dish</button></div>}
              <small className="muted">The original, for the original foods:</small>
              <OriginalSteps steps={orig} />
            </>) : (<>
              <small className="muted">{by}</small>
              <OriginalSteps steps={orig} />
              <StepsHint tone="ok">The original works with your foods as they are.</StepsHint>
              {status}
              {draft && <><div className="button-row"><button className="pill pill-small" disabled={drafting === "working"} onClick={askDraft}>{CHEF_NAME}'s way</button></div>
                <small className="muted">{CHEF_NAME} writes the steps for your amounts and your kitchen, when you want them.</small></>}
            </>);
            return draft ? (<>
              <small className="muted">No steps yet.</small>
              {status}
              <div className="button-row"><button className="pill pill-small pill-primary" disabled={drafting === "working"} onClick={askDraft}>Draft the steps with Chef Mealan</button><button className="link" onClick={startEdit}>Write my own</button></div>
            </>) : <small className="muted">No steps yet. Edit recipe adds them.</small>;
          })()}
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
          <button className="pill pill-wide pill-primary" onClick={() => onMakeIt()}>Make it</button>
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
                <button className={`pill pill-small${live && unpublished.length && direct ? " pill-primary" : ""}`} onClick={() => onPublish(Boolean(live && unpublished.length && direct))}>{
                  live ? (unpublished.length && direct ? "Publish the changes" : "Change live page") : state === "waiting" ? "See what you sent" : state === "down" ? (direct ? "Publish again" : `Send to ${approver} again`) : state === "draft" || state === "back" ? "Continue" : "Publish"}</button>
              </div>
            </section>
          )}
          {membersPanel}
          {onDelete}
        </>
      )}
    </div>
  );
}

// A realistic photo to try against the drawing (0.2.13, Milan 16 October 2026, 18:43). The owner only, on the preview: each
// tap asks one model for one picture, at Google's price; nothing is kept unless Use as cover.
function TryPhoto({ meal, tryPhoto, use }: { meal: Meal; tryPhoto: (model: string) => Promise<string>; use: (img: string) => void }) {
  const [shots, setShots] = useState<{ model: string; img: string }[]>([]);
  const [busy, setBusy] = useState(""), [err, setErr] = useState("");
  const go = async (model: string) => {
    setBusy(model); setErr("");
    try { const img = await tryPhoto(model); setShots((x) => [{ model, img }, ...x]); } catch (e: any) { setErr(e.message); } finally { setBusy(""); }
  };
  return (
    <section className="card try-photo">
      <b>Try a realistic photo</b>
      <small className="muted">For you, on the preview. Each tap draws one picture of {meal.title} from its foods and amounts. Nothing is kept unless you tap Use as cover.</small>
      <div className="button-row">{TEST_MODELS.map((m) => <button key={m.id} className="pill pill-small" disabled={Boolean(busy)} onClick={() => go(m.id)}>{busy === m.id ? "Drawing…" : `${m.name}, $${m.usd}`}</button>)}</div>
      {err && <small className="muted" style={{ color: "var(--low)" }}>{err}</small>}
      {shots.map((s, k) => (
        <figure key={k} className="try-shot"><img src={s.img} alt={`Realistic test by ${s.model}`} /><figcaption><small>{TEST_MODELS.find((m) => m.id === s.model)?.name}</small>
          <span className="button-row"><button className="pill pill-small pill-primary" onClick={() => { use(s.img); setShots((x) => x.filter((_, j) => j !== k)); }}>Use as cover</button><button className="link" onClick={() => setShots((x) => x.filter((_, j) => j !== k))}>Discard</button></span></figcaption></figure>
      ))}
    </section>
  );
}

// Where it came from (0.2.16, canvas board IM, IM6): the account or site, which you can change; the link, added any time; and
// your screenshots, for you only. Members and public pages get the text line only, never the screenshots.
function SourceBox({ meal, onPatch, openOriginal }: { meal: Meal; onPatch: (patch: Partial<Meal>) => void; openOriginal: (() => void) | null }) {
  const src = meal.source!;
  const [name, setName] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [big, setBig] = useState<number | null>(null);
  const shots = Array.isArray(meal.shots) ? meal.shots : [];
  const saveName = () => { if (name !== null) { onPatch({ source: { ...src, name: name.trim().slice(0, 80) } }); setName(null); } };
  const saveLink = () => { if (link !== null) { const u = link.trim(); onPatch({ source: { ...src, ...(/^https:\/\/\S+\.\S+/i.test(u) ? { url: u.slice(0, 2000) } : {}) } }); setLink(null); } };
  return (
    <section className="card rq-source">
      <b>Where it came from</b>
      {meal.basedOn && name === null
        ? <small>Adapted from <b>{meal.basedOn.title}</b>{src.name ? `, ${src.name}` : ""}{openOriginal && <> · <button className="link in-inline" onClick={openOriginal}>Open the original</button></>}</small>
        : name !== null
        ? <input className="search" aria-label="Where it came from" autoFocus value={name} placeholder="@account on Instagram, or the site" onChange={(e) => setName(e.target.value)} onBlur={saveName} onKeyDown={(e) => { if (e.key === "Enter") saveName(); }} />
        : <small>{src.name ? <>Adapted from <b>{src.name}</b></> : "Where it came from isn't known yet"} · <button className="link in-inline" onClick={() => setName(src.name)}>{src.name ? "Change" : "Add it"}</button></small>}
      {src.url
        ? <small><a href={src.url} target="_blank" rel="noopener noreferrer nofollow">{src.url.replace(/^https:\/\/(www\.)?/, "").slice(0, 60)}</a></small>
        : link !== null
          ? <input className="search" type="url" aria-label="Link to the original" autoFocus value={link} placeholder="https://…" onChange={(e) => setLink(e.target.value)} onBlur={saveLink} onKeyDown={(e) => { if (e.key === "Enter") saveLink(); }} />
          : <button className="link in-inline" style={{ alignSelf: "flex-start" }} onClick={() => setLink("")}>+ Add the link</button>}
      {meal.makes && <small className="muted">Makes {meal.makes.n} {meal.makes.n === 1 ? meal.makes.unit.replace(/s$/, "") : meal.makes.unit}, as the recipe says.</small>}
      {shots.length > 0 && (<>
        <div className="in-thumbs">{shots.map((x, n) => <button key={n} className={`in-thumb ${big === n ? "big" : ""}`} onClick={() => setBig(big === n ? null : n)} aria-label={`Screenshot ${n + 1}`}><img src={x} alt="" /></button>)}</div>
        <small className="muted">Your screenshots, for you only. Never the cover, never shared with members, never published.</small>
      </>)}
      {!shots.length && Array.isArray(src.shotSigs) && src.shotSigs.length > 0 && <small className="muted">Your screenshots are loading.</small>}
      {/* IM9b: the original method, read from the screenshot or the page, for the person only */}
    </section>
  );
}

// IM9: how a step relates to the original
function Mark({ m }: { m?: StepMark }) {
  if (!m) return null;
  return <small className={`st-mark ${m.kind}`}>{m.kind === "same" ? "As the original" : `${m.kind === "adapted" ? "Adapted" : "Added"}${m.why ? `: ${m.why}` : ""}`}</small>;
}

// IM17: a heading where the steps move to another part: The base, The filling
function partHead(parts: string[] | undefined, k: number) {
  const pt = parts?.[k];
  if (!pt || (k > 0 && parts![k - 1] === pt)) return null;
  return <li key={`p${k}`} className="rp-step-part">The {pt.toLowerCase()}</li>;
}

// IM21, IM21b: Nutrition, worked out by code from the foods and their grams, in the EU label order; exact counts (All 2)
function NutritionCard({ items, serves, one, all, stated, pdRef, fitPd, readoutOnly }: { items: Ingredient[]; serves: number; one: string; all: string; stated: Meal["stated"] | null; pdRef: number | null; fitPd?: (pd: number | null) => string; readoutOnly?: boolean }) {
  const n = nutritionOf(items, serves);
  if (!n) return null;
  const many = serves > 1;
  const v = (x: number | null, unit: string, d: number) => (x === null ? "?" : unit === "kcal" ? `${fmt(x, 0)} kcal` : `${fmt(x, d)} g`);
  const parts = byPart(items, serves);
  const energy = n.rows[0].serving;
  const pdS = stated && stated.kcal > 0 ? (100 * stated.protein) / stated.kcal : null;
  const diff = stated && energy ? Math.round(((energy - stated.kcal) / stated.kcal) * 100) : null;
  const missing = [...new Set(n.rows.flatMap((r) => r.missing))];
  // RP2 (0.2.25): what each column weighs, and PD above the table, as on the Plate
  const grams = items.filter((i) => i.grams > 0).reduce((k, i) => k + i.grams, 0);
  const prot = n.rows.find((r) => r.key === "protein");
  const pd1 = n.pd === null ? null : Math.round(n.pd * 10) / 10;
  const w = (g: number) => <span className="nt-w">{fmt(g, 0)} g</span>;
  return (<>
    <section className={`readout readout-fit-${fitPd ? fitPd(n.pd) : "plan"} rq-readout`} aria-label="Protein density">
      <div className="readout-top"><span>{many ? `One ${one}` : "All of it"}</span><span>PD</span></div>
      <div className="readout-mid">
        <b>{pd1 === null ? "?" : pd1.toFixed(1)}</b>
        <div><span>{pd1 === null || pdRef === null ? "no target set" : n.pd! >= pdRef ? "fits your plan" : `${(Math.round((pdRef - n.pd!) * 10) / 10).toFixed(1)} under your ${pdRef.toFixed(1)}`}</span>
          <small>{energy === null ? "?" : fmt(many ? energy : n.rows[0].all ?? 0, 0)} kcal · {fmt((many ? prot?.serving : prot?.all) ?? 0, 1)} g protein · {fmt(grams / (many ? serves : 1), 0)} g</small></div>
      </div>
    </section>
    {/* editing: the readout follows as you type; the table comes back with Save */}
    {!readoutOnly && <section className="card nt-card" aria-label="Nutrition">
      <b>Nutrition</b>
      <div className={`nt-row nt-th ${many ? "" : "nt-two"}`}><span />{many && <b>1 {one.toUpperCase()}{w(grams / serves)}</b>}<small>{many ? `ALL ${serves % 1 === 0 ? serves : fmt(serves, 1)}` : "ALL"}{w(grams)}</small><small>100 G</small></div>
      {n.rows.map((r) => (
        <div className={`nt-row ${r.sub ? "nt-sub" : ""} ${many ? "" : "nt-two"}`} key={r.key}>
          <span>{r.label}</span>
          {many && <b>{v(r.serving, r.unit, 1)}</b>}
          <small>{v(r.all, r.unit, 0)}</small>
          <small>{v(r.per100, r.unit, 1)}</small>
        </div>
      ))}
      {missing.length > 0 && <small className="muted">? : no value for {missing.join(", ")}. Add it on the food and the table follows.</small>}
      {parts.length > 1 && (
        <div className="nt-parts-box">
          <b>By part{many ? `, 1 ${one}` : ""}</b>
          <div className="nt-parts nt-th"><span /><b>KCAL</b><b>PROTEIN</b><b>PD</b></div>
          {parts.map((pt) => <div className="nt-parts" key={pt.part}><span>{pt.part}</span><b>{fmt(pt.kcal, 0)}</b><b>{fmt(pt.protein, 1)} g</b><b>{pt.pd === null ? "?" : (Math.round(pt.pd * 10) / 10).toFixed(1)}</b></div>)}
        </div>
      )}
      {stated && (
        <small className="nt-says">The recipe says, per {one}: {fmt(stated.kcal, 0)} kcal{stated.fats !== null ? ` · ${fmt(stated.fats, 1)} g fat` : ""}{stated.carbs !== null ? ` · ${fmt(stated.carbs, 1)} g carbohydrate` : ""} · {fmt(stated.protein, 1)} g protein{pdS !== null ? ` · PD ${fmt(pdS, 1)}` : ""}.{diff !== null && Math.abs(diff) > 15 ? ` Ours is ${Math.abs(diff)}% ${diff > 0 ? "higher" : "lower"} in energy: the recipe may use other products.` : " Ours agrees."}{n.rows.some((r) => r.key === "polyols") && stated.carbs !== null ? " Its carbohydrate may leave out the sweetener's polyols." : ""}</small>
      )}
      <small className="muted">From the foods and their grams; each value is the food's label or a typical value, marked estimate.{many ? " The plate rounds each food to the gram, so one serving there can read a little apart." : ""}</small>
    </section>}
  </>);
}
