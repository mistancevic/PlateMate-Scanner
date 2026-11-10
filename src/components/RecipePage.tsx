import { StepPicShown, StepPicSheet, StepPlayer, CoverVideo } from "./StepPics";
import { w, wn, wIn, wordV, dateText, mealV, type Val, type WordKey } from "../words";
import { kitchenMark, markWord, markLine } from "../recipeMark";
import { YourCooks, EatLog, cookPhotosFor } from "./YourCooks";
import { stepPicOf, stepPicsOf, setStepPic, addStepPic, removeStepPic, firstStepPic, alignStepPics, allStepPics } from "../photos";
import { ThinkingCard } from "./ThinkingCard";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cookName, weighLine, aroundV } from "../cookWords";
import { tempsIn } from "../units";
import { Camera, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import type { Feedback, Food, Ingredient, Meal, StepMark } from "../pilot";
import { aggregate, density, sizedFor } from "../pilot";
import { findReference, referenceFood } from "../reference";
import { fmt, pdText } from "../ui";
import { recipePhotosOf, withRecipePhotos } from "../photos";
import { resizeImageBase64 } from "../utils/image";
import { useBack, recipePath } from "../back";
import { countedLine } from "../frying";
import { log } from "../log";
import { ConfirmButton } from "./Confirm";
import { cardPhotosOf, MAX_RECIPE_PHOTOS } from "./RecipePhotos";
import type { Published } from "./PublishSheet";
import { StepsEditor } from "./StepsEditor";
import { CountAmount, isCounted } from "./CountAmount";
import { countOf, countWord, howMany, KINDS } from "../counted";
import { OriginalSteps, StepsHint } from "./StepsView";
import { foodNames, diffFoods, diffLine } from "../stepsState";
// DT256: the recipe's own steps are the original's, word for word
const sameSteps = (a: string[], b: string[]) => a.length === b.length && a.every((x, k) => x === b[k]);
import { stepParts, tokenOf } from "../steps";
import { coverIsDrawn, isDrawnPhoto, TEST_MODELS } from "../covers";
import { sig } from "../photos";
import { CHEF_NAME } from "./Mark";
import { partsOf, cleanPart, leanFood } from "../parts";
import { NutritionCard } from "./NutritionCard";
import { CarryBlock } from "./CarryBlock";
import { portionsIn } from "../pilot";
import { changeOf, sameKind, swapChoices, type SwapWay } from "../swap";
import { unitWord, unitV, partName, partLowV, ONE } from "../recipeWords";

// The recipe's own page in the app (0.2.5+r11, canvas board S3, R8 to R11, approved 12 October 2026). Photos first: the
// cover large, every photo with × to delete, ‹ › to move the picked one (first place is the cover), Add. Then the name
// (tap to rename), the numbers, the foods, the steps. Make it cooks it now: the recipe goes on the Plate and stays as it
// is. Edit recipe changes the recipe itself, on this page. On chefmealan.com: where the recipe is, See live page and
// Change live page. Delete recipe at the end.
export type PubState = "draft" | "live" | "waiting" | "back" | "down" | null;
const read = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsDataURL(f); });
const uid = () => Math.random().toString(36).slice(2, 10);
// a line of its own as a value in another line, in that line's language (or null, and the whole line stays English)
const lineV = (k: WordKey, v?: Record<string, Val>): Val => (l) => wIn(l, k, v);

export function RecipePage({ meal, cards, foods, cook, state, pub, approver, direct, unpublished = [], onPatch, onRename, onMakeIt, onCookIt = null, beforeSteps = null, atStart = null, makeAs = null, onPublish, onDelete, close, draft, membersPanel, tryPhoto, picture, top, landing, coverToday, openOriginal, originalFoods, pdRef, fitPd, rates, backLabel, plannedLine, plannedCount, saved = null }: {
  // DT227 (0.3.61, board Stories167): a draft of this recipe saved for later on the Plate
  saved?: { sub: string; go: () => void } | null;
  // DT81: how many of its pieces the plan takes from today, for Cook it's suggestion
  plannedCount?: number;
  // DT79: what the plan takes of this batch, 8 sarmas: 3 on Monday lunch, 1 left
  plannedLine?: string | null;
  // R19 (0.2.47): opened from Today or Plan, the way back says so
  backLabel?: string;
  // 0.2.18 (canvas board IM, IM11, IM11b): Draw a picture, with the day's count; none without the AI
  picture?: { count: { used: number; limit: number } | null; drawing: boolean; draw: () => void; refresh: () => void } | null;
  // 0.2.11 (canvas board CO, CO4, CO4b): For members, on a recipe of yours
  membersPanel?: React.ReactNode;
  // 0.2.13: a realistic photo to try against the drawing; the owner only, on the preview
  tryPhoto?: ((model: string) => Promise<string>) | null;
  // 0.2.10 (canvas board CH, CH5): Chef Mealan drafts the steps; none without the AI
  draft?: (() => Promise<{ ok: true; steps: string[]; marks?: StepMark[]; kitchen?: string; parts?: string[]; moves?: import("../pilot").StepMoves } | { ok: false; why: string; cannot?: boolean }>) | null;
  meal: Meal; cards: Feedback[]; foods: Food[]; cook: boolean; state: PubState; pub: Published | null; approver: string; direct: boolean; unpublished?: string[];
  onPatch: (patch: Partial<Meal>) => void; onRename: (title: string) => void; onMakeIt: () => void; onCookIt?: ((m?: Meal) => void) | null;
  // DT149 (0.2.130): opened from a meal of another day on Plan, Make it is Change it on the Plate, with its own line
  makeAs?: { label: string; hint: string } | null; onPublish: (now?: boolean) => void; onDelete: ReactNode; close: () => void;
  // IM23c (0.2.23): one line for today after How was it; the recipe a changed dish was adapted from
  top?: ReactNode; openOriginal?: (() => void) | null;
  // DT250 (0.3.99): the recipe's language, over its steps; and Start cooking's question, which takes the button's place
  beforeSteps?: ReactNode; atStart?: ReactNode;
  // DT84 and DT85: the Made today card, under the photos; and whether the cover is the photo from the meal just made
  landing?: ReactNode; coverToday?: boolean;
  // RP1b (0.2.25): the foods the original steps were written for, so the page can say what differs
  originalFoods?: string[] | null;
  // RP2 (0.2.25): the readout above the Nutrition table, against your target
  pdRef?: number | null; fitPd?: (pd: number | null) => string; rates?: import("../letters").Rates | null;
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
  // DT85: Change the cover: the next photo added goes first
  const coverNext = useRef(false);
  const add = (data: string) => {
    if (list.includes(data) || list.length >= MAX_RECIPE_PHOTOS) return;
    if (coverNext.current) { coverNext.current = false; setPhotos([data, ...list]); setAt(0); log("cover", { how: "real" }); return; }
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
  // DT80: Edit also says what the recipe makes, 8 sarmas; empty or 1, and the Plate divides it by weight as before
  const [edit, setEdit] = useState<{ items: Ingredient[]; steps: string[]; optional: NonNullable<Meal["optional"]>; makesN: string; makesUnit: string } | null>(null);
  const [newPart, setNewPart] = useState<string | null>(null);
  // DT81: parts and optional foods in Edit only when the recipe has them, or on a tap
  const [partsOpen, setPartsOpen] = useState(false);
  const partsShown = partsOpen || meal.items.some((i) => i.part) || (meal.optional?.length ?? 0) > 0;
  // DT81: how many to cook next time; the foods below follow it, eggs and bananas whole
  const makesN = meal.makes && meal.makes.n >= 2 ? meal.makes.n : 0;
  const cookN = makesN ? meal.cook?.n ?? makesN : 0;
  const setCook = (n: number) => { if (!makesN) return; const c = Math.max(1, Math.min(200, n)); onPatch({ cook: c === makesN ? undefined : { n: c } }); };
  const [extraParts, setExtraParts] = useState<string[]>([]);
  const [find, setFind] = useState<string | null>(null);
  // DT83 (Milan 23 October 16:49 and 20:00): Swap on a food, the same energy or the same weight; Remove then Add asks if the
  // new food takes the removed one's place; a food added on its own asks for its grams; Undo takes back the last change
  const [swapAt, setSwapAt] = useState<string | null>(null);
  const [pick, setPick] = useState<{ food: Food; old: Ingredient; at: number; mode: "swap" | "after-remove" } | null>(null);
  const [removed, setRemoved] = useState<{ item: Ingredient; at: number } | null>(null);
  const [undo, setUndo] = useState<{ items: Ingredient[]; steps: string[] }[]>([]);
  const [followed, setFollowed] = useState<string | null>(null);
  // the steps editor fills its fields once; a swap that rewrites the steps gives it fresh fields
  const [stepsKey, setStepsKey] = useState(0);
  const [fresh, setFresh] = useState<string[]>([]);
  const [need, setNeed] = useState<string | null>(null);
  const items = edit ? edit.items : meal.items;
  const sum = aggregate(items.filter((i) => i.grams > 0));
  // how many servings the numbers are for (IM21): the recipe's own count, or the portions the plate divides it into
  const serves = meal.makes?.n ?? portionsIn(meal);
  // DT243 part two: a unit the app saved (portions) shows through its count line; the cook's own unit as before
  const oneWord = meal.makes ? unitWord(meal.makes.unit, 1, ONE.s) : w("recipe.portion");
  const allWord = meal.makes ? unitWord(meal.makes.unit, 2) : w("recipe.portions");
  const pd = density(sum.protein, sum.calories);
  const resetSwap = () => { setSwapAt(null); setPick(null); setRemoved(null); setUndo([]); setFresh([]); setNeed(null); setFollowed(null); };
  const startEdit = () => { resetSwap(); setEdit({ items: meal.items.map((i) => ({ ...i })), steps: [...(meal.steps ?? [])], optional: [...(meal.optional ?? [])], makesN: meal.makes ? String(meal.makes.n) : "", makesUnit: meal.makes?.unit ?? "" }); setFind(null); setExtraParts([]); };
  // parts in Edit recipe (0.2.19, IM18): each food's part, a new part, optional on and off
  const editParts = edit ? [...new Set([...partsOf(edit.items, edit.optional), ...extraParts])] : [];
  const PartPick = ({ value, onPick }: { value: string; onPick: (v: string) => void }) => <select className="pt-chip pt-select" aria-label={w("recipe.part")} value={value} onChange={(e) => onPick(e.target.value)}><option value="">{w("recipe.noPart")}</option>{[...new Set([...editParts, ...(value ? [value] : [])])].map((x) => <option key={x} value={x}>{partName(x)}</option>)}</select>;
  // DT175a (0.3.18): the step whose picture is being added or changed, and Watch the steps
  const [picAt, setPicAt] = useState<number | null>(null);
  const [watching, setWatching] = useState(false);
  // DT254: the step pictures as the cover's video, when every step has one (not while editing)
  const video = !edit && (meal.steps?.length ?? 0) > 0 && allStepPics(meal, meal.steps!) ? meal.steps!.map((x) => stepPicOf(meal, x)!) : null;
  const save = () => {
    if (!edit) return;
    const missing = edit.items.find((i) => fresh.includes(i.id) && !(i.grams > 0));
    if (missing) { setNeed(missing.food.name); return; }
    const kept = edit.items.filter((i) => i.grams > 0);
    if (!kept.length) return;
    const steps = edit.steps.map((x) => x.replace(/\s+/g, " ").trim()).filter(Boolean).slice(0, 30), total = kept.reduce((n, i) => n + i.grams, 0);
    // a recipe that says how many it makes keeps its portions; steps changed by hand lose their marks (0.2.18, IM9)
    const same = JSON.stringify(steps) === JSON.stringify(meal.steps ?? []);
    const n = Math.round(Number(edit.makesN) || 0), typed = edit.makesUnit.trim().toLowerCase() || "portions", unit = /s$/.test(typed) ? typed : `${typed}s`;
    const makes = n >= 2 && n <= 100 ? { n, unit } : undefined;
    onPatch({ items: kept, makes, portion: makes ? Math.round(total / makes.n) : total, steps, optional: edit.optional.length ? edit.optional : undefined, ...(same ? {} : { stepMarks: undefined, stepsKitchen: undefined, stepParts: undefined, moves: undefined, ...alignStepPics(meal, steps) }) });
    setEdit(null); setFind(null); resetSwap();
  };
  // DT83: every change to the foods can be taken back, one at a time
  const change = (items: Ingredient[], steps?: string[]) => { if (!edit) return; setUndo((u) => [...u, { items: edit.items, steps: edit.steps }]); setEdit({ ...edit, items, ...(steps ? { steps } : {}) }); setNeed(null); };
  const takeBack = () => { if (!edit || !undo.length) return; const last = undo[undo.length - 1]; if (last.steps !== edit.steps) setStepsKey((k) => k + 1); setEdit({ ...edit, items: last.items, steps: last.steps }); setUndo((u) => u.slice(0, -1)); setPick(null); setRemoved(null); setFollowed(null); };
  // DT83 fix (Milan 21:56, Sarma on 0.2.83): the steps name a food by its row; a food that takes another's place takes its
  // place in the steps too, so the steps never keep rice after rice is swapped for oats
  const followSteps = (steps: string[], oldId: string, next: Ingredient) => steps.map((x) => x.replace(/\[\[i:([^|\]]*)\|[^\]]*\]\]/g, (t, id: string) => (id === oldId ? tokenOf(next) : t)));
  const chosen = (food: Food) => {
    if (!edit) return;
    const at = swapAt ? edit.items.findIndex((i) => i.id === swapAt) : -1;
    setFind(null); setSwapAt(null);
    if (at >= 0) { setPick({ food, old: edit.items[at], at, mode: "swap" }); return; }
    if (removed) { setPick({ food, old: removed.item, at: removed.at, mode: "after-remove" }); return; }
    const id = uid(); change([...edit.items, { id, food, grams: 0, locked: false }]); setFresh((f) => [...f, id]);
  };
  const place = (way: SwapWay | "new") => {
    if (!edit || !pick) return;
    const { food, old, at, mode } = pick;
    if (way === "new") { const id = uid(); change([...edit.items, { id, food, grams: 0, locked: false }]); setFresh((f) => [...f, id]); }
    else {
      const grams = swapChoices(old, food).find((c) => c.way === way)?.grams ?? old.grams;
      const next: Ingredient = { id: uid(), food, grams, locked: old.locked, ...(old.part ? { part: old.part } : {}), ...(old.role ? { role: old.role } : {}) };
      log("swap", { way, kind: sameKind(old.food, food) ? "same" : "other", how: mode });
      const steps = followSteps(edit.steps, old.id, next), n = steps.filter((x, j) => x !== edit.steps[j]).length;
      if (n) setStepsKey((k) => k + 1);
      setFollowed(n ? wn("recipe.stepsFollow", n, { food: pick.food.name, old: old.food.name }) : null);
      change(mode === "swap" ? edit.items.map((x, j) => (j === at ? next : x)) : [...edit.items.slice(0, at), next, ...edit.items.slice(at)], steps);
    }
    setPick(null); setRemoved(null);
  };
  const delta = edit ? changeOf(meal.items, edit.items, serves) : null;
  const whole = (n: number) => fmt(n, 0);
  // DT81 (Milan 23 October 15:51): the search also finds foods without a label (raw rice, cabbage), not only My foods
  const refMatches = find === null || find.trim().length < 2 ? [] : findReference(find.trim(), 6, find.trim().length < 3).filter((r) => !foods.some((f) => f.name.toLowerCase() === r.en.toLowerCase()) && !items.some((i) => i.food.name.toLowerCase() === r.en.toLowerCase()));
  const matches = find === null ? [] : foods.filter((f) => !items.some((i) => i.food.id === f.id) && (!find.trim() || f.name.toLowerCase().includes(find.trim().toLowerCase()))).slice(0, 8);
  const live = state === "live" && pub;
  // ---- the steps, drafted by Chef Mealan (CH5): shown to read, kept only with Keep these steps ----
  const [drafted, setDrafted] = useState<{ steps: string[]; marks?: StepMark[]; kitchen?: string; parts?: string[]; moves?: import("../pilot").StepMoves } | null>(null);
  const [drafting, setDrafting] = useState<"" | "working" | string>("");
  // RP1c (0.2.25): Chef Mealan's steps or the original, when both are there
  const [stepView, setStepView] = useState<"own" | "orig">("own");
  const askDraft = async () => {
    if (!draft) return;
    setDrafting("working");
    try { const d = await draft(); if (d.ok) { setDrafted({ steps: d.steps, marks: d.marks, kitchen: d.kitchen, parts: d.parts, moves: d.moves }); setDrafting(""); } else if ((d as { cannot?: boolean }).cannot) setDrafting((d as { why: string }).why); else setDrafting(w("recipe.draftFailedChecks", { why: (d as { why: string }).why })); }
    catch (e: any) { setDrafting(e?.message || w("recipe.chefMealanCouldNotAnswer")); }
  };
  return (
    <div className="rq">
      <button className="link rq-back" onClick={close}><ChevronLeft size={18} /> {backLabel ?? w("recipe.recipes")}</button>
      {/* 0.2.56 (board DS4, G, Milan 08:49): the page's title comes first, under Back; then the photo */}
      {edit && <span className="rq-editing">{w("recipe.editingTheRecipe")}</span>}
      {/* the name: tap to rename (the dashed field, as on the Plate) */}
      {naming !== null
        ? <input className="title-input rq-name-input" aria-label={w("recipe.nameOfTheRecipe")} autoFocus value={naming} onChange={(e) => setNaming(e.target.value)} onBlur={saveName} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} enterKeyHint="done" maxLength={80} />
        : <button type="button" className="rq-name" aria-label={w("recipe.rename", { title: meal.title })} onClick={() => setNaming(meal.title)}>{meal.title}</button>}
      {/* DT202 (0.3.75, board Stories174): From the kitchen, or On paper, and what it means */}
      {(() => { const k = kitchenMark(meal, cards); return <div className={`rq-mark ${k.cooked ? "cooked" : "paper"}`}><span className="tile-mark-chip">{markWord(k)}</span><small>{markLine(k)}</small></div>; })()}
      {/* DT90 (0.2.87, board Stories58): Chef Mealan's dinner says who made it, around which food, and when */}
      {meal.byChef && <small className="rq-label rq-bychef">{w("recipe.byChef", { kitchen: meal.byChef.kitchen, meal: mealV(meal.byChef.meal, true), around: aroundV(meal.byChef.around), date: dateText(new Date(meal.byChef.at), { day: "numeric", month: "long" }) })}</small>}
      {/* DT81 (Milan 23 October 12:48 to 15:11): what the whole recipe makes is its label, under the name */}
      {makesN ? <small className="rq-label">{w("recipe.wholeMakes", { n: makesN, unit: unitV(meal.makes!.unit, makesN), one: unitV(meal.makes!.unit, 1, ONE.ies), kcal: fmt((aggregate(meal.items).calories ?? 0) / makesN, 0) })}</small>
        : serves > 1 ? <small className="rq-label muted">{w("recipe.wholeByWeight", { n: serves })}</small> : null}
      {top}
      {/* R8: the photos first */}
      {/* DT254 (0.3.105, board Stories187): a recipe whose every step has a picture: the cover is its video */}
      {video && (drawn || sel === 0 || list.length === 0)
        ? <CoverVideo title={meal.title} pics={video} cover={list[0] ?? video[video.length - 1].src} coverAlt={w("recipe.coverOf", { title: meal.title })} onWords={() => setWatching(true)}
            marks={<>{list.length > 0 && !drawn && <span className="rph-cover">{w("recipe.cover")}</span>}{(drawn || (list[0] && isDrawnPhoto(meal, list[0]))) && <span className="rq-drawn">{w("recipe.drawnByChef")}</span>}</>} />
        : drawn
        ? <figure className="rq-hero"><img src={list[0]} alt={w("recipe.pictureOfBy", { title: meal.title })} /><span className="rq-drawn">{w("recipe.drawnByChef")}</span></figure>
        : list.length > 0
        ? <figure className="rq-hero"><img src={list[sel]} alt={sel === 0 ? w("recipe.coverOf", { title: meal.title }) : w("recipe.photoOf", { n: sel + 1, title: meal.title })} />{sel === 0 && <span className="rph-cover">{w("recipe.cover")}</span>}{isDrawnPhoto(meal, list[sel]) && <span className="rq-drawn">{w("recipe.drawnByChef")}</span>}</figure>
        : <button className="rq-hero rq-hero-empty" onClick={() => fileRef.current?.click()}><Camera size={26} /><span>{w("recipe.addAPhoto")}</span></button>}
      {drawn && (<>
        <small className="muted rq-hint">{w("recipe.chefDrewIt")}</small>
        <div className="button-row rq-drawn-row"><button className="pill pill-small" disabled={busy} onClick={() => fileRef.current?.click()}>{w("recipe.addMyPhoto")}</button></div>
      </>)}
      <div className="rq-thumbs" hidden={drawn}>
        {list.map((src, i) => (
          <div key={i} className="rq-thumb">
            <button className={`publish-photo ${sel === i ? "on" : ""}`} onClick={() => setAt(i)} aria-label={w("recipe.photoAria", { n: i + 1, cover: i === 0 ? wordV("recipe.photoAriaCover") : "", picked: sel === i ? wordV("recipe.photoAriaPicked") : "" })}><img src={src} alt="" /></button>
            {i === 0 && <span className="rq-cover-tag">{w("recipe.cover")}</span>}
            <ConfirmButton className="rq-del" ariaLabel={w("recipe.deletePhoto", { n: i + 1 })} label={<X size={13} />} confirmLabel={w("recipe.sure")}
              onConfirm={() => { setPhotos(list.filter((_, k) => k !== i)); setAt(Math.max(0, Math.min(sel, list.length - 2))); }} />
            {sel === i && list.length > 1 && (
              <div className="rq-move">
                <button className="pill pill-small" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label={w("recipe.moveThePhotoEarlier")}><ChevronLeft size={16} /></button>
                <button className="pill pill-small" disabled={i === list.length - 1} onClick={() => move(i, i + 1)} aria-label={w("recipe.moveThePhotoLater")}><ChevronRight size={16} /></button>
              </div>
            )}
          </div>
        ))}
        {!full && <button className="publish-photo add rph-add" disabled={busy} onClick={() => fileRef.current?.click()}><Camera size={18} /><span>{w("recipe.add")}</span></button>}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; void fromFile(f); }} />
      </div>
      {/* DT276 step 2 (0.3.129, board Stories205): the photos on the steps are this recipe's photos too; a tap opens the step */}
      {!edit && (() => { const on = (meal.steps ?? []).flatMap((t, k) => (meal.steps!.indexOf(t) === k ? stepPicsOf(meal, t).map((x) => ({ k, src: x.src })) : [])); return on.length > 0 && (
        <div className="rq-on-steps">
          <b>{w("recipe.onTheSteps")}</b>
          <div>{on.map((x, i) => <button key={i} type="button" aria-label={w("recipe.photoOfStep", { n: x.k + 1 })} onClick={() => setPicAt(x.k)}><img src={x.src} alt="" /><span>{x.k + 1}</span></button>)}</div>
        </div>); })()}
      {picture && list.length === 0 && !drawn && (() => {
        const c = picture.count, out = c ? c.used >= c.limit : false;
        return (
          <section className="card rq-nopic" aria-label={w("recipe.noPhotoYet2")}>
            <b>{w("recipe.noPhotoYet")}</b>
            <div className="button-row">
              <button className="pill pill-small" disabled={out || picture.drawing} onClick={picture.draw}>{picture.drawing ? w("recipe.chefIsDrawing") : w("recipe.letChefDraw")}</button>
              <button className={`pill pill-small ${out ? "pill-primary" : ""}`} disabled={busy} onClick={() => fileRef.current?.click()}>{w("recipe.addMyPhoto")}</button>
            </div>
            <small className="muted">{c ? w("recipe.drawingsToday", { used: c.used, limit: c.limit, rest: wordV(out ? "recipe.drawOneTomorrowOrAdd" : "recipe.yourOwnPhotoIsAlways") }) : w("recipe.yourOwnPhotoIsAlways")}</small>
          </section>
        );
      })()}
      {coverToday && list.length > 0 && !drawn && (<>
        <small className="muted rq-hint">{w("recipe.yourPhotoFromTodayIs")}</small>
        <div className="button-row rq-drawn-row">
          <button className="pill pill-small" disabled={busy} onClick={() => { coverNext.current = true; fileRef.current?.click(); }}>{w("recipe.changeTheCover")}</button>
          <ConfirmButton className="link" ariaLabel={w("recipe.removeTheCover")} label={w("recipe.removeIt")} confirmLabel={w("recipe.sureRemoveIt")} onConfirm={() => { setPhotos(list.slice(1)); setAt(0); }} />
        </div>
      </>)}
      {!coverToday && !drawn && !(picture && list.length === 0) && <small className="muted rq-hint">{list.length === 0 ? w("recipe.aPhotoMakesItEasy") : list.length === 1 ? w("recipe.thisPhotoIsTheCover") : sel === 0 ? w("recipe.theFirstPhotoIsThe") : w("recipe.photoMovesEarlier", { n: sel + 1, of: list.length })}</small>}
      {offered.length > 0 && !full && (
        <div className="rq-offer">
          <small className="muted">{w("recipe.fromTheTimesYouMade")}</small>
          <div className="rq-offer-row">{offered.slice(0, 6).map((src, i) => <button key={i} className="publish-photo rph-offer" onClick={() => add(src)} aria-label={w("recipe.addPlatePhoto", { n: i + 1 })}><img src={src} alt="" /><span className="rph-plus"><Plus size={14} /></span></button>)}</div>
        </div>
      )}
      {tryPhoto && <TryPhoto meal={meal} tryPhoto={tryPhoto} use={(img) => { const list = recipePhotosOf(meal).filter((x) => x !== img); onPatch({ ...withRecipePhotos([img, ...list].slice(0, MAX_RECIPE_PHOTOS)), coverSig: sig(img) }); }} />}
      {landing}
      {/* DT175a (0.3.18, board Stories123 v2): Watch the steps, when every step has its picture */}
      {/* DT254: the cover is the video now; the card stays only where the cover cannot be (a photo other than the cover shown) */}
      {!video && !edit && (meal.steps?.length ?? 0) > 0 && allStepPics(meal, meal.steps!) && (() => {
        const pics = meal.steps!.map((t) => stepPicOf(meal, t)!), ai = pics.some((p) => p.by === "ai");
        return (
          <section className="card watch-card" aria-label={w("recipe.watchTheSteps")}>
            <button type="button" className="watch-poster" onClick={() => setWatching(true)} aria-label={w("recipe.watchTheSteps")}><img src={pics[pics.length - 1].src} alt="" /><span className="watch-play" aria-hidden="true">▶</span></button>
            <div className="watch-text"><b style={{ fontSize: 17 }}>{w("recipe.watchTheSteps")}</b><small className="muted">{w("recipe.watchStepsLength", { n: meal.steps!.length, seconds: meal.steps!.length * 5, ai: ai ? wordV("recipe.watchStepsAi") : "" })}</small></div>
          </section>
        );
      })()}
      {meal.source && <SourceBox meal={meal} onPatch={onPatch} openOriginal={openOriginal ?? null} />}
      {/* R16 (0.2.44, board RS15): PD on top, under Where it came from, as on the Plate; it follows the grams while editing */}
      {plannedLine && <small className="muted rq-planned">{plannedLine}</small>}
      <NutritionCard readoutOnly rates={rates} items={items} serves={serves} one={oneWord} all={allWord} stated={null} pdRef={pdRef ?? null} fitPd={fitPd} />
      {/* IM21: one serving first, when the recipe makes more than one */}
      {/* RP2 (0.2.25): the three tiles gave way to the PD readout above the Nutrition table */}
      {/* DT81: Cook it. The recipe stays as written; this batch can be bigger or smaller, and the foods below follow */}
      {!edit && makesN > 0 && (
        <section className="card rq-cook" aria-label={w("recipe.cookIt")}>
          <b>{w("recipe.cookIt")}</b>
          <div className="rq-cook-row">
            <button type="button" className="icon" aria-label={w("recipe.oneLess", { unit: unitV(meal.makes!.unit, 1, ONE.notSs) })} disabled={cookN <= 1} onClick={() => setCook(cookN - 1)}>−</button>
            <b>{cookN} {unitWord(meal.makes!.unit, 2)}</b>
            <button type="button" className="icon" aria-label={w("recipe.oneMore", { unit: unitV(meal.makes!.unit, 1, ONE.notSs) })} onClick={() => setCook(cookN + 1)}>+</button>
          </div>
          <small className="muted">{cookN === makesN ? w("recipe.asTheRecipeMakesIt") : w("recipe.makesFoodsFor", { n: makesN, cook: cookN })}</small>
          {!!plannedCount && plannedCount !== cookN && <button type="button" className="link rq-cook-plan" onClick={() => setCook(plannedCount)}>{w("recipe.planTakes", { n: plannedCount })}</button>}
          {cookN !== makesN && <button type="button" className="link rq-cook-back" onClick={() => setCook(makesN)}>{w("recipe.backToAsWritten", { n: makesN })}</button>}
        </section>
      )}
      <section className={`card rq-foods ${edit ? "editing" : ""}`}>
        <b>{w("recipe.foods")}</b>
        {/* DT91 (0.2.88): what the dish uses for cooking, not counted */}
        {!edit && meal.cooking?.length ? <small className="muted rq-cook-line"><b>{w("recipe.forCookingNotCounted")}</b> {meal.cooking.join(", ")}.</small> : null}
        {edit && (
          <div className="rq-makes" role="group" aria-label={w("recipe.whatTheRecipeMakes")}>
            <small>{w("recipe.theWholeRecipeMakes")}</small>
            <input inputMode="numeric" aria-label={w("recipe.howManyItMakes")} placeholder="8" value={edit.makesN} onChange={(e) => setEdit({ ...edit, makesN: e.target.value.replace(/[^\d]/g, "").slice(0, 3) })} />
            <input aria-label={w("recipe.ofWhat")} placeholder={w("recipe.sarmasPlaceholder")} value={edit.makesUnit} maxLength={24} onChange={(e) => setEdit({ ...edit, makesUnit: e.target.value })} />
            <small className="muted">{w("recipe.cookedAsWrittenPlanCounts")}</small>
          </div>
        )}
        {edit && delta && (
          <div className={`rq-change${delta.big ? " rq-change-big" : ""}`} role="status" aria-label={w("recipe.whatChanged")}>
            <small>{[delta.out.length ? w("recipe.deltaOut", { list: delta.out.join("; ") }) : "", delta.in.length ? w("recipe.deltaIn", { list: delta.in.join("; ") }) : "", delta.moved.length ? w("recipe.deltaChanged", { list: delta.moved.join("; ") }) : ""].filter(Boolean).join(" ")}</small>
            <small><b>{w("recipe.deltaOne", { one: oneWord, kcalFrom: whole(delta.kcal[0]), kcalTo: whole(delta.kcal[1]), proteinFrom: whole(delta.protein[0]), proteinTo: whole(delta.protein[1]), pd: delta.pd[0] !== null && delta.pd[1] !== null ? lineV("recipe.deltaPd", { from: fmt(delta.pd[0], 1), to: fmt(delta.pd[1], 1) }) : "" })}</b>{delta.big ? ` ${w("recipe.moreThanAFifthApart")}` : ""}</small>
            {followed && <small>{followed}</small>}
            {undo.length > 0 && <button type="button" className="link" onClick={takeBack}>{w("recipe.undo")}</button>}
          </div>
        )}
        {edit && !partsShown && <button type="button" className="link rq-parts-open" onClick={() => setPartsOpen(true)}>{w("recipe.partsAndOptionalFoods")}</button>}
        {edit && partsShown && <div className="pt-h pt-mode"><span><small>{w("recipe.partsGiveAFoodIts")}</small></span><span className="pt-acts">{newPart === null ? <button className="link" onClick={() => setNewPart("")}>{w("recipe.newPart")}</button> : <input className="pt-new" autoFocus aria-label={w("recipe.nameOfTheNewPart")} placeholder={w("recipe.toppingPlaceholder")} value={newPart} onChange={(e) => setNewPart(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { const v = cleanPart(newPart); if (v) setExtraParts((l) => [...l, v]); setNewPart(null); } }} onBlur={() => setNewPart(null)} />}</span></div>}
        {(edit || !cookN || cookN === makesN ? items : sizedFor(meal, cookN)).map((it, k) => {
          const head = !edit && it.part && (k === 0 || items[k - 1].part !== it.part) ? <div className="rq-part" key={`h${k}`}>{partName(it.part)}</div> : null;
          return [head, (
          <div className="sheet-row rq-food" key={it.id}>
            {edit ? <span className="rq-food-edit"><small>{it.food.name}</small><button type="button" className="link rq-swap-link" aria-label={w("recipe.swapFood", { food: it.food.name })} onClick={() => { setSwapAt(it.id); setPick(null); setFind(""); }}>{w("recipe.swap")}</button>{partsShown && <span className="pt-chips"><PartPick value={it.part ?? ""} onPick={(v) => setEdit({ ...edit, items: edit.items.map((x, j) => (j === k ? { ...x, part: v || undefined } : x)) })} /> <button type="button" className="pt-chip off" onClick={() => setEdit({ ...edit, items: edit.items.filter((_, j) => j !== k), optional: [...edit.optional, { name: it.food.name, written: "", grams: it.grams, food: leanFood(it.food), ...(it.part ? { part: it.part } : {}) }] })}>{w("recipe.optional")}</button></span>}</span> : <small>{cookName(it.food.name).short}{weighLine(it.food.name) && <span className="rq-weigh"> · {weighLine(it.food.name)}</span>}{it.fry && <span className="rq-fry">{it.fry.written ? w("recipe.writtenForFrying", { written: it.fry.written }) : w("recipe.forFrying")}. {countedLine(`${fmt(it.grams, 0)} g`)}.</span>}</small>}            {edit
              ? <span className="rq-grams">
                  <input inputMode="numeric" aria-label={w("recipe.gramsOf", { food: it.food.name })} className={fresh.includes(it.id) && !(it.grams > 0) ? "rq-g-need" : undefined} placeholder={fresh.includes(it.id) ? "?" : undefined} autoFocus={fresh.includes(it.id) && !(it.grams > 0)} value={String(it.grams || "")} onChange={(e) => { const g = Math.min(5000, Number(e.target.value.replace(/[^\d]/g, "")) || 0); setNeed(null); setEdit({ ...edit, items: edit.items.map((x, j) => (j === k ? { ...x, grams: g } : x)) }); }} /> g
                  <button className="rq-x" aria-label={w("recipe.removeFood", { food: it.food.name })} onClick={() => { setRemoved({ item: it, at: k }); setPick(null); setFresh((f) => f.filter((x) => x !== it.id)); change(edit.items.filter((_, j) => j !== k)); }}><X size={14} /></button>
                </span>
              : isCounted(it) ? <CountAmount item={it} editable={false} whole onGrams={() => {}} /> : <b>{fmt(it.fry ? it.fry.pot : it.grams, 0)} g</b>}
          </div>)];
        })}
        {edit && edit.optional.map((o, k) => (
          <div className="sheet-row rq-food rq-food-opt" key={`o${k}`}>
            <span className="rq-food-edit"><small>{o.name}</small><span className="pt-chips"><PartPick value={o.part ?? ""} onPick={(v) => setEdit({ ...edit, optional: edit.optional.map((x, j) => (j === k ? { ...x, part: v || undefined } : x)) })} /> <button type="button" className="pt-chip" onClick={() => setEdit({ ...edit, optional: edit.optional.filter((_, j) => j !== k), items: [...edit.items, { id: uid(), food: o.food, grams: o.grams, locked: false, ...(o.part ? { part: o.part } : {}) }] })}>✓ {w("recipe.optional")}</button></span></span>
            <b>{fmt(o.grams, 0)} g</b>
          </div>
        ))}
        {edit && pick && (() => {
          const ch = swapChoices(pick.old, pick.food), one = (c: { way: SwapWay; grams: number }) => w("recipe.swapChoice", { way: wordV(c.way === "energy" ? "recipe.theSameEnergy" : "recipe.theSameWeight"), grams: whole(c.grams), food: pick.food.name });
          return (
            <div className="rq-swap" role="group" aria-label={w("recipe.inPlaceOf", { food: pick.old.food.name })}>
              <small><b>{pick.mode === "swap" ? w("recipe.inPlaceOfGrams", { food: pick.old.food.name, grams: whole(pick.old.grams) }) : w("recipe.inPlaceOfRemoved", { food: pick.old.food.name, grams: whole(pick.old.grams) })}</b></small>
              {ch.map((c) => <button key={c.way} type="button" className="pill pill-small" onClick={() => place(c.way)}>{one(c)}</button>)}
              {pick.mode === "after-remove" && <button type="button" className="pill pill-small" onClick={() => place("new")}>{w("recipe.noAFoodOfIts")}</button>}
              <small className="muted">{ch.length < 2 ? w("recipe.oneOfTheTwoHas") : sameKind(pick.old.food, pick.food) ? w("recipe.theSameFoodRawOr") : w("recipe.aDifferentFood")}</small>
              <button type="button" className="link" onClick={() => setPick(null)}>{w("recipe.cancel")}</button>
            </div>
          );
        })()}
        {edit && need && <small className="rq-need" role="alert">{w("recipe.setTheGramsOf", { food: need })}</small>}
        {edit && !pick && (find === null
          ? <button className="pill pill-small rq-addfood" onClick={() => { setSwapAt(null); setFind(""); }}><Plus size={14} /> {w("recipe.addAFood")}</button>
          : (
            <div className="rq-find">
              <input autoFocus placeholder={w("recipe.searchMyFoods")} aria-label={w("recipe.searchMyFoods")} value={find} onChange={(e) => setFind(e.target.value)} />
              {swapAt && <small className="rq-find-h">{w("recipe.swapFor", { food: edit.items.find((i) => i.id === swapAt)?.food.name ?? "" })}</small>}
              {matches.map((f) => <button key={f.id} className="rq-find-row" onClick={() => chosen(f)}><span>{f.name}</span><small>{w("recipe.per100g", { kcal: fmt(f.calories, 0), protein: fmt(f.protein, 1) })}</small></button>)}
              {refMatches.map((r) => <button key={r.id} className="rq-find-row" onClick={() => chosen(referenceFood(r, null, uid))}><span>{r.en}</span><small>{w("recipe.per100gNoLabel", { kcal: fmt(r.kcal, 0), protein: r.protein })}</small></button>)}
              {matches.length === 0 && refMatches.length === 0 && <small className="muted">{w("recipe.noFoodWithThatName")}</small>}
              <button className="link" onClick={() => { setFind(null); setSwapAt(null); }}>{w("recipe.closeTheSearch")}</button>
            </div>
          ))}
        {/* DT77 (Milan 23 October 09:52): the whole recipe is cooked with whole eggs, bananas and apples; a portion keeps its
            share for the numbers, and this says so once */}
        {!edit && serves > 1 && (() => {
          const it = items.find((x) => !x.optional && countOf(x));
          if (!it) return null;
          const c = countOf(it)!, k = KINDS[c.kind], share = howMany(c, it.grams) / serves;
          return <small className="muted rq-count-note">{w("recipe.countedWholeHere", { pieces: k.many.charAt(0).toUpperCase() + k.many.slice(1), one: oneWord, share: countWord(share), piece: share > 1 ? k.many : k.one })}</small>;
        })()}
      </section>
      {/* IM8, IM14: optional foods stay with the recipe, out of the numbers; the plate adds them */}
      {!edit && (meal.optional?.length ?? 0) > 0 && (
        <section className="card rq-optional" aria-label={w("recipe.optionalNotInTheNumbers")}>
          <b>{w("recipe.optionalNotInTheNumbers")}</b>
          {meal.optional!.map((o, k) => (
            <div className="rq-opt-row" key={k}>
              <span className="rq-opt-name"><span>{o.name}</span><small>{[o.part ? partName(o.part) : o.part, o.note || (o.written ? w("recipe.writtenOnTheRecipe", { written: o.written }) : "")].filter(Boolean).join(" · ") || w("recipe.optionalLower")}</small></span>
              <b>{fmt(o.grams, 0)} g</b>
            </div>
          ))}
          <small className="muted">{w("recipe.theRecipeSNumbersLeave")}</small>
        </section>
      )}
      {!edit && <NutritionCard tableOnly items={items} serves={serves} one={oneWord} all={allWord} stated={meal.stated ?? null} pdRef={pdRef ?? null} fitPd={fitPd} />}
      {!edit && <CarryBlock meal={meal} cards={cards} />}
      {/* DT214 v2 (0.3.53, board Stories162): a recipe collects its cooks */}
      {!edit && <YourCooks meal={meal} cards={cards} />}
      {/* DT227 (0.3.61, board Stories167): the recipe points to its draft; the draft stays on the Plate */}
      {!edit && saved && (
        <section className="card rq-saved" aria-label={w("recipe.savedForLaterOnThe")}>
          <span><b>{w("recipe.savedForLaterOnThe")}</b><small className="muted">{saved.sub}</small></span>
          <button type="button" className="pill" onClick={saved.go}>{w("recipe.continue")}</button>
        </section>
      )}
      {!edit && beforeSteps}
      <section className={`card rq-steps ${edit ? "editing" : ""}`}>
        <b>{w("recipe.steps")}</b>
        {edit
          ? <StepsEditor key={stepsKey} steps={edit.steps} items={edit.items} onChange={(steps) => setEdit((e) => (e ? { ...e, steps } : e))} />
          : drafted ? (<>
              <small className="rq-drafted">{drafted.marks ? (drafted.kitchen || w("recipe.chefStepsFromOriginal")) : w("recipe.draftedByChefMealanFrom")}</small>
              {drafted.marks && drafted.kitchen && <small className="muted">{w("recipe.eachStepSaysHowIt")}</small>}
              <ol className="rp-steps">{drafted.steps.map((x, k) => [partHead(drafted.parts, k), <li key={k}><span>{k + 1}</span><div className="rp-step-text">{stepParts(tempsIn(x), meal.items).map((p, j) => ("text" in p ? p.text : <b key={j} className="st-amt">{p.label}</b>))}<Mark m={drafted.marks?.[k]} /></div></li>])}</ol>
              <div className="button-row"><button className="pill pill-small pill-primary" onClick={() => { onPatch({ steps: drafted.steps, stepMarks: drafted.marks, stepsKitchen: drafted.kitchen, stepParts: drafted.parts, moves: drafted.moves, stepsFor: foodNames(meal.items) }); setDrafted(null); }}>{w("recipe.keepTheseSteps")}</button><button className="pill pill-small" onClick={askDraft}>{w("recipe.draftAgain")}</button><button className="link" onClick={() => { setDrafted(null); startEdit(); }}>{w("recipe.writeMyOwn")}</button></div>
            </>)
          : (() => {
            // RP1 to RP1c (0.2.25): the original is the steps; Chef Mealan's on demand, with a line for the case
            const orig = meal.source?.steps ?? [], own = meal.steps ?? [];
            const now = foodNames(meal.items);
            const diff = diffFoods(now, originalFoods ?? null), stale = own.length ? diffFoods(now, meal.stepsFor) : null;
            const status = drafting === "working" ? <ThinkingCard className="rq-drafting" title={w("recipe.chefMealanIsWritingThe")} /> : drafting ? <small className="rq-drafting">{drafting}</small> : null;
            const by = meal.source?.name ? w("recipe.asNameWritesThem", { name: meal.source.name }) : w("recipe.asTheOriginalWritesThem");
            const ownList = (<>
              {stale && <StepsHint tone="warn">{w("recipe.stepsForEarlierFoods", { diff: diffLine(stale) })}</StepsHint>}
              {stale && draft && <div className="button-row"><button className="pill pill-small pill-primary" disabled={drafting === "working"} onClick={askDraft}>{w("recipe.writeThemAgain")}</button></div>}
              {meal.stepMarks && <small className="muted">{meal.stepsKitchen || w("recipe.chefStepsFromOriginal")}</small>}
              <ol className="rp-steps">{own.map((x, k) => [partHead(meal.stepParts, k), <li key={k}><span>{k + 1}</span><div className="rp-step-text">{stepParts(tempsIn(x), meal.items).map((p, j) => ("text" in p ? p.text : <b key={j} className={`st-amt${p.gone ? " gone" : ""}`}>{p.label}</b>))}<Mark m={meal.stepMarks?.[k]} /></div>
                {/* DT211 v8 (0.3.53): the step's photo comes from cooking; no + slot here, a tap changes or removes it */}
                <StepPicShown pic={stepPicOf(meal, x)} k={k} more={Math.max(0, stepPicsOf(meal, x).length - 1)} onOpen={() => setPicAt(k)} /></li>])}</ol>
              <small className="muted">{w("recipe.photosForTheSteps")}</small>
            </>);
            // DT256: steps made the recipe's own from the original, word for word: one list, with the original's line
            if (own.length && orig.length && sameSteps(own, orig)) return <><small className="muted">{by}</small>{status}{ownList}</>;
            if (own.length && orig.length) return (<>
              <div className="segments rq-steps-seg" role="tablist" aria-label={w("recipe.whichSteps")}>
                <button role="tab" aria-selected={stepView === "own"} className={`seg ${stepView === "own" ? "on" : ""}`} onClick={() => setStepView("own")}>{meal.stepMarks ? w("recipe.chefS") : w("recipe.yours")}</button>
                <button role="tab" aria-selected={stepView === "orig"} className={`seg ${stepView === "orig" ? "on" : ""}`} onClick={() => setStepView("orig")}>{w("recipe.original")}</button>
              </div>
              {status}
              {stepView === "own" ? ownList : <><small className="muted">{by}</small><OriginalSteps steps={orig} /></>}
            </>);
            if (own.length) return <>{status}{ownList}</>;
            if (orig.length) return diff ? (<>
              <StepsHint tone="warn">{diffLine(diff)}</StepsHint>
              {status}
              {draft && <div className="button-row"><button className="pill pill-small pill-primary" disabled={drafting === "working"} onClick={askDraft}>{w("recipe.writeTheStepsForMy")}</button></div>}
              <small className="muted">{w("recipe.theOriginalForTheOriginal")}</small>
              <OriginalSteps steps={orig} />
            </>) : (<>
              <small className="muted">{by}</small>
              <OriginalSteps steps={orig} />
              <StepsHint tone="ok">{w("recipe.theOriginalWorksWithYour")}</StepsHint>
              {status}
              {draft && <><div className="button-row"><button className="pill pill-small" disabled={drafting === "working"} onClick={askDraft}>{w("recipe.chefSWay")}</button></div>
                <small className="muted">{w("recipe.chefWritesTheSteps")}</small></>}
            </>);
            return draft ? (<>
              <small className="muted">{w("recipe.noStepsYet")}</small>
              {status}
              <div className="button-row"><button className="pill pill-small" disabled={drafting === "working"} onClick={askDraft}>{w("recipe.draftTheStepsWithChef")}</button><button className="pill pill-small" onClick={startEdit}>{w("recipe.writeMyOwn")}</button></div>
            </>) : <small className="muted">{w("recipe.noStepsYetEditRecipe")}</small>;
          })()}
        {/* DT211 v8 (0.3.53, board Stories158): one Start cooking, at the end of the Steps block, after you have read them; grey,
            with why, while there are no steps */}
        {/* DT256 (0.3.111, board Stories191; Coach Milan 8 November 00:06, Go): the original's steps work with your foods as they
            are: Start cooking cooks them as written, and the first cook makes them the recipe's own (pictures and the cover video) */}
        {!edit && !drafted && !makeAs && onCookIt && (() => {
          const orig = meal.source?.steps ?? [], useOrig = !(meal.steps?.length) && orig.length > 0 && !diffFoods(foodNames(meal.items), originalFoods ?? null);
          const n = meal.steps?.length || (useOrig ? orig.length : 0);
          const go = () => { if (!useOrig) return onCookIt(); const pt = { steps: orig, stepsFor: foodNames(meal.items) }; onPatch(pt); onCookIt({ ...meal, ...pt }); };
          return (
          <div className="rq-start">
            {atStart ?? <button className={`pill pill-wide${n ? " pill-primary" : ""}`} disabled={!n} onClick={go}>{w("recipe.startCooking")}</button>}
            <small className="muted">{n ? (useOrig ? wn("recipe.stepsReadAloudOrig", n) : wn("recipe.stepsReadAloud", n)) : w("recipe.startCookingReadsThe")}</small>
          </div>); })()}
      </section>
      {edit ? (
        <>
          <button className="pill pill-wide pill-primary" disabled={!edit.items.some((i) => i.grams > 0)} onClick={save}>{w("recipe.saveChanges")}</button>
          <small className="muted rq-under">{edit.items.some((i) => i.grams > 0) ? w("recipe.theNumbersAboveFollowAs") : w("recipe.aRecipeNeedsAtLeast")}</small>
          <button className="pill pill-wide" onClick={() => { setEdit(null); setFind(null); resetSwap(); }}>{w("recipe.cancel")}</button>
          {live && <small className="muted rq-under">{w("recipe.liveOnChefmealanComThe")}</small>}
        </>
      ) : (
        <>
          {/* R10: two intentions, two buttons */}
          {/* DT174 (0.3.16, board Stories121; Milan 30 October 16:21 to 16:31): the recipe is for reading and deciding, the Plate
              is the editor. Two doors into the Plate's Make step: as written, or through the Plate's changes first */}
          {/* DT211 v8 (0.3.53): Cook it as written gave way to Start cooking, in the Steps block */}
          {!makeAs && onCookIt ? (<>
            <button className="pill pill-wide" onClick={() => onMakeIt()}>{w("recipe.changeItFirst")}</button>
            <small className="muted rq-under">{w("recipe.onThePlateChangeFoods")}</small>
          </>) : (<>
            <button className={`pill pill-wide${makeAs ? "" : " pill-primary"}`} onClick={() => onMakeIt()}>{makeAs ? makeAs.label : w("recipe.makeIt")}</button>
            <small className="muted rq-under">{makeAs ? makeAs.hint : w("recipe.cookItNowTheRecipe")}</small>
          </>)}
          <button className="pill pill-wide" onClick={startEdit}>{w("recipe.editRecipe")}</button>
          <small className="muted rq-under">{w("recipe.changeTheRecipeItselfThe")}</small>
          {/* DT225 v2 (0.3.61, board Stories166): the log of every time you ate it, under the buttons: a log, not an action */}
          {!edit && <EatLog meal={meal} cards={cards} />}
          {cook && (
            <section className="card rq-pub">
              <div className="card-top"><b>{w("recipe.onChefmealanCom")}</b>{state && <small className={`pub-state ${state}`}>{state === "live" ? w("recipe.live") : state === "down" ? w("recipe.takenDown") : state === "waiting" ? w("recipe.waitingFor", { who: approver }) : state === "back" ? w("recipe.sentBack") : w("recipe.draft")}</small>}</div>
              {live && unpublished.length > 0 && <small className="pub-pending" title={w("recipe.changedTitle", { list: unpublished.join(", ") })}>{w("recipe.changesNotPublishedYet")}</small>}
              <small className="muted">{
                live ? w("recipe.liveAnyoneWithTheLink", { slug: pub!.slug })
                : state === "waiting" ? w("recipe.approverSeesThePage", { who: approver.charAt(0).toUpperCase() + approver.slice(1) })
                : state === "back" ? (pub?.note ? w("recipe.approverSentItBackNote", { who: approver.charAt(0).toUpperCase() + approver.slice(1), note: pub.note }) : w("recipe.approverSentItBack", { who: approver.charAt(0).toUpperCase() + approver.slice(1) }))
                : state === "down" ? w("recipe.theLinkSaysThisRecipe")
                : state === "draft" ? w("recipe.aDraftOnlyHere")
                : w("recipe.notOnTheSiteYet")}</small>
              <div className="button-row">
                {live && <a className="pill pill-small" href={`/r/${pub!.slug}`} target="_blank" rel="noreferrer">{w("recipe.seeLivePage")}</a>}
                <button className={`pill pill-small${live && unpublished.length && direct ? " pill-primary" : ""}`} onClick={() => onPublish(Boolean(live && unpublished.length && direct))}>{
                  live ? (unpublished.length && direct ? w("recipe.publishTheChanges") : w("recipe.changeLivePage")) : state === "waiting" ? w("recipe.seeWhatYouSent") : state === "down" ? (direct ? w("recipe.publishAgain") : w("recipe.sendToAgain", { who: approver })) : state === "draft" || state === "back" ? w("recipe.continuePlain") : w("recipe.publish")}</button>
              </div>
            </section>
          )}
          {membersPanel}
          {onDelete}
        </>
      )}
      {picAt !== null && meal.steps?.[picAt] !== undefined && <StepPicSheet k={picAt} step={meal.steps[picAt]} items={meal.items} pic={stepPicOf(meal, meal.steps[picAt])} fromCooks={cookPhotosFor(meal, cards, picAt)}
        all={stepPicsOf(meal, meal.steps[picAt])} onFirst={(src) => { onPatch(firstStepPic(meal, picAt, src)); setPicAt(null); }}
        // DT276 step 2 (0.3.129): a new picture is added to the step; the one it has stays. The first one kept again only says who made it
        onKeep={(pic) => { const first = stepPicOf(meal, meal.steps![picAt]); onPatch(!first || first.src === pic.src ? setStepPic(meal, picAt, pic) : addStepPic(meal, picAt, pic)); setPicAt(null); }}
        onRemove={(src) => { onPatch(src ? removeStepPic(meal, picAt, src) : setStepPic(meal, picAt, null)); setPicAt(null); }} onClose={() => setPicAt(null)} />}
      {watching && meal.steps && allStepPics(meal, meal.steps) && <StepPlayer title={meal.title} steps={meal.steps} items={meal.items} pics={meal.steps.map((t) => stepPicOf(meal, t)!)} onClose={() => setWatching(false)} onCook={onCookIt ? () => { setWatching(false); onCookIt(); } : null} />}
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
      <b>{w("recipe.tryARealisticPhoto")}</b>
      <small className="muted">{w("recipe.forYouOnThePreview", { title: meal.title })}</small>
      <div className="button-row">{TEST_MODELS.map((m) => <button key={m.id} className="pill pill-small" disabled={Boolean(busy)} onClick={() => go(m.id)}>{busy === m.id ? w("recipe.drawing") : `${m.name}, $${m.usd}`}</button>)}</div>
      {err && <small className="muted" style={{ color: "var(--low)" }}>{err}</small>}
      {shots.map((s, k) => (
        <figure key={k} className="try-shot"><img src={s.img} alt={w("recipe.realisticTestBy", { model: s.model })} /><figcaption><small>{TEST_MODELS.find((m) => m.id === s.model)?.name}</small>
          <span className="button-row"><button className="pill pill-small pill-primary" onClick={() => { use(s.img); setShots((x) => x.filter((_, j) => j !== k)); }}>{w("recipe.useAsCover")}</button><button className="link" onClick={() => setShots((x) => x.filter((_, j) => j !== k))}>{w("recipe.discard")}</button></span></figcaption></figure>
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
      <b>{w("recipe.whereItCameFrom")}</b>
      {meal.basedOn && name === null
        ? <small>{w("recipe.adaptedFrom")} <b>{meal.basedOn.title}</b>{src.name ? `, ${src.name}` : ""}{openOriginal && <> · <button className="link in-inline" onClick={openOriginal}>{w("recipe.openTheOriginal")}</button></>}</small>
        : name !== null
        ? <input className="search" aria-label={w("recipe.whereItCameFrom")} autoFocus value={name} placeholder={w("recipe.accountPlaceholder")} onChange={(e) => setName(e.target.value)} onBlur={saveName} onKeyDown={(e) => { if (e.key === "Enter") saveName(); }} />
        : <small>{src.name ? <>{w("recipe.adaptedFrom")} <b>{src.name}</b></> : w("recipe.whereItCameFromIsn")} · <button className="link in-inline" onClick={() => setName(src.name)}>{src.name ? w("recipe.change") : w("recipe.addIt")}</button></small>}
      {src.url
        ? <small><a href={src.url} target="_blank" rel="noopener noreferrer nofollow">{src.url.replace(/^https:\/\/(www\.)?/, "").slice(0, 60)}</a></small>
        : link !== null
          ? <input className="search" type="url" aria-label={w("recipe.linkToTheOriginal")} autoFocus value={link} placeholder="https://…" onChange={(e) => setLink(e.target.value)} onBlur={saveLink} onKeyDown={(e) => { if (e.key === "Enter") saveLink(); }} />
          : <button className="link in-inline" style={{ alignSelf: "flex-start" }} onClick={() => setLink("")}>{w("recipe.addTheLink")}</button>}
      {meal.makes && <small className="muted">{w("recipe.makesAsTheRecipeSays", { n: meal.makes.n, unit: unitV(meal.makes.unit, meal.makes.n, ONE.s) })}</small>}
      {shots.length > 0 && (<>
        <div className="in-thumbs">{shots.map((x, n) => <button key={n} className={`in-thumb ${big === n ? "big" : ""}`} onClick={() => setBig(big === n ? null : n)} aria-label={w("recipe.screenshotN", { n: n + 1 })}><img src={x} alt="" /></button>)}</div>
        <small className="muted">{w("recipe.yourScreenshotsForYouOnly")}</small>
      </>)}
      {!shots.length && Array.isArray(src.shotSigs) && src.shotSigs.length > 0 && <small className="muted">{w("recipe.yourScreenshotsAreLoading")}</small>}
      {/* IM9b: the original method, read from the screenshot or the page, for the person only */}
    </section>
  );
}

// IM9: how a step relates to the original
function Mark({ m }: { m?: StepMark }) {
  if (!m) return null;
  return <small className={`st-mark ${m.kind}`}>{m.kind === "same" ? w("recipe.asTheOriginal") : m.why ? w("recipe.markWhy", { mark: wordV(m.kind === "adapted" ? "recipe.markAdapted" : "recipe.markAdded"), why: m.why }) : w(m.kind === "adapted" ? "recipe.markAdapted" : "recipe.markAdded")}</small>;
}

// IM17: a heading where the steps move to another part: The base, The filling
function partHead(parts: string[] | undefined, k: number) {
  const pt = parts?.[k];
  if (!pt || (k > 0 && parts![k - 1] === pt)) return null;
  return <li key={`p${k}`} className="rp-step-part">{w("recipe.partHead", { part: partLowV(pt) })}</li>;
}

