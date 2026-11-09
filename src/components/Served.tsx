// DT268 step 1 (0.3.118, board Stories201; Coach Milan 9 November 21:46 to 23:21, Go): Served on the screens. The Plate's block
// for an Exploring plate (kept, its name and dish filled by Chef Mealan, Scan another plate: mine or someone else's); in Recipes
// the visits, each one card; a Served plate open; and I ate this, which asks the day and the meal out loud.
import { useEffect, useState } from "react";
import { aggregate, density, type Ingredient } from "../pilot";
import { DISHES, visitsOf, type Dish, type Served, type Visit } from "../served";
import { w, wn, dateText, dateV, mealName, mealV, numLocale, type WordKey } from "../words";
import { pdText } from "../ui";
import { ymd } from "../plan";
import { slotsOn, slotAt } from "../slots";
import { lifestyleOf } from "../personal";
import { PhotoPick } from "./PhotoPick";
import type { AppApi } from "../screens/api";

const k = (s: string) => s as WordKey;
const dishWord = (d: Dish) => w(k(`served.dish.${d}`));
const readFile = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsDataURL(f); });
const numsOf = (items: Ingredient[]) => { const a = aggregate(items); return { kcal: Math.round(a.calories ?? 0), protein: Math.round(a.protein ?? 0), pd: density(a.protein ?? 0, a.calories ?? 0) }; };
const aboutLine = (items: Ingredient[]) => { const n = numsOf(items); return w("served.about", { kcal: n.kcal.toLocaleString(numLocale()), protein: n.protein }); };
export const ServedMark = () => <span className="sv-mark">{w("served.mark")}</span>;
// the day and the meal a visit happened at: its title when it has no note
function whenOf(p: AppApi, at: string): string {
  const d = new Date(at), hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const sl = slotAt(slotsOn(lifestyleOf(p.personal), p.personal.timesOn, ymd(d)), hm);
  const day = dateText(d, { weekday: "long", day: "numeric", month: "long" });
  return sl ? w("served.dayMeal", { day, meal: mealName(sl.name, true) }) : day;
}

// ---- the Plate, after a photo read as Exploring ----
export function ServedOnPlate({ p, items, title }: { p: AppApi; items: Ingredient[]; title: string }) {
  const photo = p.state.photo!, on = photo.served!;
  const [named, setNamed] = useState(false), [picked, setPicked] = useState(false);
  const [ate, setAte] = useState(false);
  const name = on.name ?? title;
  // the plate as it stands is the plate that is kept: every change of its foods, its name, its dish or its photos
  useEffect(() => {
    if (photo.keep === false || !items.length) return;
    p.keepServed({ id: on.id, name, dish: on.dish, mine: on.mine, at: photo.at, visit: on.visit, items: structuredClone(items), photo: photo.image, ...(photo.more?.length ? { more: photo.more } : {}) });
  }, [items, name, on.dish, on.mine, on.id, on.visit, photo.image, photo.more, photo.at, photo.keep]);
  const list = p.state.served ?? [], me = list.find((s) => s.id === on.id);
  const next = (mine: boolean) => async (f: File) => { try { const image = await readFile(f); void p.readMealPhoto(image, { who: "idea", replace: true, served: { mine, visit: on.visit } }); } catch { /* the choice stays open */ } };
  if (photo.keep === false) return (
    <section className="card sv-plate sv-off"><small>{w("served.notKept")}</small></section>
  );
  if (ate && me) { const v = visitsOf(list).find((x) => x.id === me.visit)!; return <ServedAte p={p} plates={me.mine && v.mine.length ? v.mine : [me]} title={v.note || whenOf(p, v.at)} close={() => setAte(false)} />; }
  return (
    <section className="card sv-plate" aria-label={w("served.keptHead")}>
      <div className="sv-head"><ServedMark /><b>{w("served.keptHead")}</b></div>
      <label className="sv-label">{w("served.name")}{!named && on.name === undefined && <span className="sv-by">{w("served.filledBy")}</span>}
        <input className="search sv-name" value={name} maxLength={60} onChange={(e) => { setNamed(true); p.servedPatch(on.id, { name: e.target.value }); }} />
      </label>
      <small className="sv-label">{w("served.whichDish")}{!picked && <span className="sv-by">{w("served.filledBy")}</span>}</small>
      <div className="sv-dishes" role="radiogroup" aria-label={w("served.whichDish")}>
        {DISHES.map((d) => <button key={d} type="button" role="radio" aria-checked={on.dish === d} className={`pill pill-small sv-dish${on.dish === d ? " on" : ""}`} onClick={() => { setPicked(true); p.servedPatch(on.id, { dish: d }); }}>{dishWord(d)}</button>)}
      </div>
      <small className="sv-label">{w("served.scanAnother")}</small>
      <div className="sv-next">
        <PhotoPick onFile={(f) => void next(true)(f)}>{({ toggle, open }) => <button type="button" className="pill pill-small pill-primary sv-mine" aria-expanded={open} onClick={toggle}>{w("served.anotherMine")}</button>}</PhotoPick>
        <PhotoPick onFile={(f) => void next(false)(f)}>{({ toggle, open }) => <button type="button" className="pill pill-small sv-other" aria-expanded={open} onClick={toggle}>{w("served.someoneElses")}</button>}</PhotoPick>
      </div>
      <div className="button-row sv-acts">
        <button type="button" className="pill pill-small sv-ate" onClick={() => setAte(true)}>{w("served.iAteThis")}</button>
        <button type="button" className="link sv-drop" onClick={() => p.servedRemove(on.id)}>{w("served.dontKeep")}</button>
      </div>
      <small className="sv-foot">{w("served.nothingLogged")}</small>
    </section>
  );
}

// ---- Recipes: the visits ----
function PlateRow({ s, open }: { s: Served; open: () => void }) {
  return (
    <button type="button" className="sv-row" onClick={open}>
      <img src={s.photo} alt="" />
      <span className="sv-row-text"><b>{s.name}</b><small>{aboutLine(s.items)}</small></span>
      {s.mine && <span className="sv-dish-tag">{dishWord(s.dish)}</span>}
    </button>
  );
}
function VisitCard({ p, v, open }: { p: AppApi; v: Visit; open: (id: string) => void }) {
  const [edit, setEdit] = useState(false), [note, setNote] = useState(v.note);
  const when = whenOf(p, v.at);
  const mine = v.mine.flatMap((s) => s.items);
  return (
    <div className="sv-visit">
      <div className="sv-visit-top">
        {edit ? (
          <form className="sv-note-form" onSubmit={(e) => { e.preventDefault(); p.servedNote(v.id, note); setEdit(false); }}>
            <input className="search sv-note" autoFocus value={note} maxLength={60} placeholder={w("served.notePlaceholder")} aria-label={w("served.noteLabel")} onChange={(e) => setNote(e.target.value)} />
            <button type="submit" className="pill pill-small pill-primary">{w("served.save")}</button>
          </form>
        ) : (
          <span className="sv-visit-title"><b>{v.note || when}</b>{v.note && <small>{when}</small>}
            <button type="button" className="link sv-note-edit" onClick={() => { setNote(v.note); setEdit(true); }}>{v.note ? w("served.changeNote") : w("served.addNote")}</button></span>
        )}
        <ServedMark />
      </div>
      {v.mine.length > 0 && <small className="sv-part">{w("served.mine")} · {aboutLine(mine)}</small>}
      {v.mine.map((s) => <PlateRow key={s.id} s={s} open={() => open(s.id)} />)}
      {v.others.length > 0 && <small className="sv-part">{w("served.others")}</small>}
      {v.others.map((s) => <PlateRow key={s.id} s={s} open={() => open(s.id)} />)}
    </div>
  );
}
export function ServedGroup({ p, open }: { p: AppApi; open: (id: string) => void }) {
  const list = p.state.served ?? [];
  if (!list.length) return null;
  const visits = visitsOf(list);
  return (
    <section className="rc-group sv-group" aria-label={w("served.mark")}>
      <p className="label rc-group-title">{w("served.mark")} · {wn("served.visits", visits.length)}, {wn("served.plates", list.length)}</p>
      <small className="muted sv-lead">{w("served.lead")}</small>
      {visits.map((v) => <VisitCard key={v.id} p={p} v={v} open={open} />)}
    </section>
  );
}

// ---- a Served plate, open ----
export function ServedOne({ p, id, back }: { p: AppApi; id: string; back: () => void }) {
  const list = p.state.served ?? [], s = list.find((x) => x.id === id);
  const [at, setAt] = useState(0), [ate, setAte] = useState(false), [sure, setSure] = useState(false);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [id, ate]);
  if (!s) return null;
  const v = visitsOf(list).find((x) => x.id === s.visit)!;
  const title = v.note || whenOf(p, v.at);
  if (ate) return <ServedAte p={p} plates={s.mine && v.mine.length ? v.mine : [s]} title={title} close={() => setAte(false)} />;
  const all = [s.photo, ...(s.more ?? [])], n = numsOf(s.items);
  return (
    <section className="card sv-one">
      <button type="button" className="link sv-back" onClick={back}>{w("served.backToRecipes")}</button>
      <h3>{s.name}</h3>
      <div className="sv-tags"><ServedMark /><span className="sv-dish-tag">{dishWord(s.dish)}</span><small>{v.note ? `${v.note} · ${whenOf(p, v.at)}` : title}</small></div>
      <img className="sv-photo" src={all[at] ?? s.photo} alt={w("plan.photoOf", { title: s.name })} />
      {all.length > 1 && <div className="sv-more">{all.map((src, i) => <button type="button" key={i} className={`sv-thumb${i === at ? " on" : ""}`} aria-pressed={i === at} aria-label={w("plan.photoN", { n: i + 1 })} onClick={() => setAt(i)}><img src={src} alt="" /></button>)}</div>}
      <p className="sv-honest">{w("served.honest")}</p>
      <div className="sv-nums"><span>{w("served.aboutKcal", { kcal: n.kcal.toLocaleString(numLocale()) })}</span><span><b>{n.protein} g</b> {w("plan.protein")}</span><span><b>{pdText(n.pd)}</b></span></div>
      <div className="sv-foods">{s.items.map((it) => <div key={it.id} className="sv-food"><span>{it.food.name}</span><b>{Math.round(it.grams)} g</b></div>)}</div>
      {s.eatenAt && <small className="sv-eaten">{w("served.eatenOn", { day: dateText(new Date(s.eatenAt), { weekday: "long", day: "numeric", month: "long" }) })}</small>}
      <div className="sv-do">
        <button type="button" className="pill pill-small sv-ate" onClick={() => setAte(true)}>{w("served.iAteThis")}</button>
        <button type="button" className="pill pill-small sv-plate-it" onClick={() => p.servedToPlate(s.id)}>{w("served.onThePlate")}</button>
      </div>
      {sure
        ? <div className="button-row sv-sure"><button type="button" className="pill pill-small pill-danger sv-remove-yes" onClick={() => { p.servedRemove(s.id); back(); }}>{w("served.removeYes")}</button><button type="button" className="link" onClick={() => setSure(false)}>{w("served.cancel")}</button></div>
        : <button type="button" className="link sv-remove" onClick={() => setSure(true)}>{w("served.remove")}</button>}
    </section>
  );
}

// ---- I ate this: the day and the meal, asked out loud ----
export function ServedAte({ p, plates, title, close }: { p: AppApi; plates: Served[]; title: string; close: () => void }) {
  const first = plates[0], photoDay = ymd(new Date(first.at)), today = ymd(new Date());
  const [date, setDate] = useState(photoDay), [other, setOther] = useState(false);
  const slots = slotsOn(lifestyleOf(p.personal), p.personal.timesOn, date);
  const d0 = new Date(first.at), hm = `${String(d0.getHours()).padStart(2, "0")}:${String(d0.getMinutes()).padStart(2, "0")}`;
  const [slotId, setSlotId] = useState<string | null>(null);
  const sl = slots.find((s) => s.id === slotId) ?? slotAt(slots, hm) ?? slots[0];
  const all = plates.flatMap((s) => s.items), n = numsOf(all);
  const day = new Date(`${date}T12:00:00`);
  const put = () => {
    if (!sl) return;
    // on the photo's day it counts at the photo's time; on another day at that meal's time
    const at = date === photoDay ? first.at : new Date(`${date}T${sl.time}:00`).toISOString();
    p.servedAte(plates.map((s) => s.id), { date, slotId: sl.id, name: sl.name, time: sl.time }, at);
    close();
  };
  return (
    <section className="card sv-ate-card" aria-label={w("served.whenAte")}>
      <b className="sv-ate-title">{title}</b>
      <h3>{w("served.whenAte")}</h3>
      <div className="sv-ate-dishes">
        {plates.map((s) => <div key={s.id} className="sv-ate-dish"><span>{plates.length > 1 ? dishWord(s.dish) : ""}</span><b>{s.name}</b><small>{w("served.aboutN", { kcal: numsOf(s.items).kcal.toLocaleString(numLocale()) })}</small></div>)}
        {plates.length > 1 && <div className="sv-ate-total"><b>{w("served.oneMeal")}</b><b>{w("served.about", { kcal: n.kcal.toLocaleString(numLocale()), protein: n.protein })}</b></div>}
      </div>
      <small className="sv-label">{w("served.day")}</small>
      <div className="sv-chips" role="radiogroup" aria-label={w("served.day")}>
        <button type="button" role="radio" aria-checked={!other && date === photoDay} className={`pill pill-small${!other && date === photoDay ? " on" : ""}`} onClick={() => { setOther(false); setDate(photoDay); }}>{w("served.photoDay", { day: dateText(new Date(first.at), { weekday: "short", day: "numeric", month: "short" }) })}</button>
        {photoDay !== today && <button type="button" role="radio" aria-checked={!other && date === today} className={`pill pill-small${!other && date === today ? " on" : ""}`} onClick={() => { setOther(false); setDate(today); }}>{w("plate.today")}</button>}
        <button type="button" role="radio" aria-checked={other} className={`pill pill-small${other ? " on" : ""}`} onClick={() => setOther(true)}>{w("served.anotherDay")}</button>
      </div>
      {other && <input type="date" className="search sv-date" max={today} value={date} aria-label={w("served.anotherDay")} onChange={(e) => { if (e.target.value && e.target.value <= today) setDate(e.target.value); }} />}
      <small className="sv-label">{w("served.meal")}</small>
      <div className="sv-chips" role="radiogroup" aria-label={w("served.meal")}>
        {slots.map((s) => <button key={s.id} type="button" role="radio" aria-checked={s.id === sl?.id} className={`pill pill-small${s.id === sl?.id ? " on" : ""}`} onClick={() => setSlotId(s.id)}>{mealName(s.name)}</button>)}
      </div>
      {sl && <button type="button" className="pill pill-primary pill-wide sv-put" onClick={put}>{w("served.putIn", { day: dateV(day, { weekday: "long" }), meal: mealV(sl.name, true) })}</button>}
      <button type="button" className="link sv-cancel" onClick={close}>{w("served.cancel")}</button>
      <small className="sv-foot">{plates.length > 1 ? w("served.ateFootMany") : w("served.ateFoot")}</small>
    </section>
  );
}
