// DT267 (0.3.117, board Stories200; Coach Milan 9 November 21:31 to 21:51, Go; from a tester: "I can't find the picture, the
// sandwich's values stayed"): a meal eaten on a past day, opened from Plan. The photo large, the meal's other photos under it,
// the numbers, the foods with their grams as they were logged. Put it on the Plate again, or Save in My recipes.
import { useRef, useState, type ReactNode } from "react";
import { aggregate, density, uid, type Feedback, type Meal } from "../pilot";
import { w, mealName, dateText } from "../words";
import { amountChoices, type CardChange } from "../pastMeal";
import { resizeImageBase64 } from "../utils/image";
import { tasteWord } from "./YourCooks";
import { pdText } from "../ui";
import { Picture, pictureOfRecipe } from "./MealPicture";
import type { AppApi } from "../screens/api";

// the recipe a logged meal came from, as Today finds it
export const recipeOfEaten = (f: Feedback, meals: Meal[]) => meals.find((m) => m.id === f.recipeId) ?? meals.find((m) => m.id === f.meal?.id || (!!f.meal?.title && m.title === f.meal.title)) ?? null;
const isPic = (x: unknown): x is string => typeof x === "string" && /^(data:image\/|https:\/\/|blob:|\/)/.test(x);

// DT282 (0.3.135, board Stories209; Coach Milan 11 November 21:40, Go): the same page opens a cook from the recipe's Your
// cooks. There it knows its recipe, says when and how it tasted, shows your words, and its buttons are the recipe page's
// (actions, given the photo shown large)
export function PastMeal({ p, f, day, slot, back, recipe, when, words = false, actions, onChange, onDelete }: { p?: AppApi; f: Feedback; day: string; slot?: string; back: () => void;
  recipe?: Meal; when?: string; words?: boolean; actions?: (shown: string | null) => ReactNode;
  // DT284 (0.3.138, board Stories211): Change it and Delete this meal
  onChange?: (ch: CardChange) => void; onDelete?: () => void }) {
  const r = recipe ?? (p ? recipeOfEaten(f, p.state.meals) : null);
  const all = [...new Set([f.photo, ...(f.photos ?? [])].filter(isPic))];
  const cover = all[0] ?? pictureOfRecipe(r);
  const [at, setAt] = useState(0);
  const big = all[at] ?? cover;
  const a = aggregate(f.meal.items);
  const [mode, setMode] = useState<"view" | "change" | "sure">("view");
  const again = () => { if (!p) return; p.setState((s) => ({ ...s, items: f.meal.items.map((it) => ({ ...it, id: uid() })) })); p.setTab("journey"); };
  return (
    <section className="card plan-day past-meal">
      <button type="button" className="link pm-back" onClick={back}>‹ {day}</button>
      <h3>{f.meal.title}</h3>
      <small className="pm-when">{when ?? <>{slot ? `${mealName(slot)}, ` : ""}{new Date(f.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</>}</small>
      {big ? <img className="pm-photo" src={big} alt={w("plan.photoOf", { title: f.meal.title })} /> : <div className="pm-nophoto"><Picture src={null} /><small>{w("plan.noPhoto")}</small></div>}
      {all.length > 1 && <div className="pm-more">{all.map((src, i) => (
        <button type="button" key={i} className={`pm-thumb${i === at ? " on" : ""}`} aria-label={w("plan.photoN", { n: i + 1 })} aria-pressed={i === at} onClick={() => setAt(i)}><img src={src} alt="" /></button>
      ))}</div>}
      <div className="pm-nums">
        <span><b>{Math.round(a.calories ?? 0).toLocaleString()}</b> kcal</span>
        <span><b>{Math.round(a.protein ?? 0)} g</b> {w("plan.protein")}</span>
        <span><b>{pdText(density(a.protein ?? 0, a.calories ?? 0))}</b></span>
      </div>
      {mode === "change" && onChange ? <ChangeMeal f={f} r={r} cancel={() => setMode("view")} save={(ch) => { onChange(ch); setMode("view"); back(); }} /> : <>
      <div className="pm-foods">{f.meal.items.map((it) => <div key={it.id} className="pm-food"><span>{it.food.name}</span><b>{Math.round(it.grams)} g</b></div>)}</div>
      {words && f.notes?.trim() && <p className="pm-words"><b>{w("yourcooks.yourWords")}</b> {f.notes.trim()}</p>}
      {actions ? actions(all[at] ?? null) : <div className="button-row pm-actions">
        <button type="button" className="pill pill-small pill-primary pm-again" onClick={again}>{r ? w("plan.cookAgain") : w("plan.onThePlateAgain")}</button>
        {!r && <button type="button" className="pill pill-small pm-save" onClick={() => { p?.saveCardAsRecipe(f.id); }}>{w("today.saveInMyRecipes")}</button>}
      </div>}
      {(onChange || onDelete) && <div className="pm-edit">
        {onChange && <button type="button" className="pill pill-primary pill-wide pm-change" onClick={() => setMode("change")}>{w("pastmeal.changeIt")}</button>}
        {onDelete && (mode === "sure"
          ? <><button type="button" className="pill pill-wide pill-danger pm-sure" onClick={onDelete}>{w("pastmeal.sureDelete")}</button>
              <button type="button" className="link pm-keep" onClick={() => setMode("view")}>{w("pastmeal.keepIt")}</button>
              <small className="muted">{w("pastmeal.deleteWhy", { date: dateText(new Date(f.createdAt), { weekday: "long", day: "numeric", month: "long" }) })}</small></>
          : <button type="button" className="pill pill-wide pill-danger-line pm-delete" onClick={() => setMode("sure")}>{w("pastmeal.deleteThisMeal")}</button>)}
      </div>}
      </>}
    </section>
  );
}

// DT284 v5 (0.3.140): after Save changes, back where you came from; no Change it again on the same screen
// DT284: Change this meal. How much, how it was, your words, the photo; saved into the same meal at its own time
const TASTES = ["DaaM good", "Good", "Not really"];
function ChangeMeal({ f, r, save, cancel }: { f: Feedback; r: Meal | null; save: (ch: CardChange) => void; cancel: () => void }) {
  const choices = amountChoices(f, r);
  const [amount, setAmount] = useState<string>("logged");
  const [taste, setTaste] = useState(f.taste || "");
  const [notes, setNotes] = useState(f.notes || "");
  const [photo, setPhoto] = useState<string | undefined>(f.photo);
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const label = (c: (typeof choices)[number]) => c.key === "half" ? w("yourcooks.halfAPortion", { g: c.grams }) : c.key === "one" ? w("yourcooks.onePortion", { g: c.grams })
    : c.key === "halfOf" ? w("pastmeal.halfOfIt", { g: c.grams }) : w("pastmeal.asLogged", { g: c.grams });
  const pick = async (x: File | undefined) => {
    if (!x) return; setBusy(true);
    try { const raw = await new Promise<string>((res, rej) => { const rd = new FileReader(); rd.onload = () => res(String(rd.result)); rd.onerror = () => rej(rd.error); rd.readAsDataURL(x); });
      setPhoto(await resizeImageBase64(raw, 1080, 1080).catch(() => raw)); } finally { setBusy(false); }
  };
  const done = () => {
    const c = choices.find((x) => x.key === amount);
    save({ ...(c && c.key !== "logged" ? { items: c.items } : {}), taste, notes: notes.trim(), ...(photo !== f.photo && photo ? { photo } : {}) });
  };
  return (
    <div className="pm-form">
      <b className="pm-form-title">{w("pastmeal.changeThisMeal")}</b>
      <small className="muted">{w("pastmeal.sameMealSameTime")}</small>
      <b>{w("pastmeal.howMuch")}</b>
      <div className="pm-chips">{choices.map((c) => <button key={c.key} type="button" className={`choice${amount === c.key ? " on" : ""}`} aria-pressed={amount === c.key} onClick={() => setAmount(c.key)}>{label(c)}</button>)}</div>
      <b>{w("pastmeal.howWasIt")}</b>
      <div className="pm-chips">{TASTES.map((t) => <button key={t} type="button" className={`choice${taste === t ? " on" : ""}`} aria-pressed={taste === t} onClick={() => setTaste(taste === t ? "" : t)}>{tasteWord(t)}</button>)}</div>
      <label className="pm-notes"><b>{w("pastmeal.yourWords")}</b><textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
      <b>{w("pastmeal.photo")}</b>
      <div className="pm-photo-row">
        {photo && <img src={photo} alt="" />}
        <button type="button" className="pill pill-small" disabled={busy} onClick={() => file.current?.click()}>{photo ? w("pastmeal.changeThePhoto") : w("pastmeal.addAPhoto")}</button>
        <input ref={file} type="file" accept="image/*" hidden onChange={(e) => { const x = e.target.files?.[0]; e.target.value = ""; void pick(x); }} />
      </div>
      <button type="button" className="pill pill-primary pill-wide pm-save-changes" disabled={busy} onClick={done}>{w("pastmeal.saveChanges")}</button>
      <button type="button" className="link pm-cancel" onClick={cancel}>{w("pastmeal.cancel")}</button>
    </div>
  );
}
