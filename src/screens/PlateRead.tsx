// The read of a meal photo on the Plate: the photo, the foods with their amounts, the numbers, Chef Mealan's line,
// Did you eat it? (or Is it for the plan?), Save in My recipes and Done.
// 0.3.156: moved out of JourneyScreen.tsx as it was. It is a plain function the Plate screen calls while it draws:
// every piece of state and every effect stays in the Plate screen and is handed in, so nothing here can reset.
import type { Dispatch, SetStateAction } from "react";
import { w, wn, type Val } from "../words";
import { atMeal, type PlateWhen } from "../plateMode";
import { photoAdvice } from "../mealPhoto";
import { NumbersTable, type PlanNumbers } from "../components/Letters";
import type { GateLine } from "../gates";
import type { Meal, Ingredient, PilotState } from "../pilot";
import { CHEF_NAME } from "../components/Mark";
import { foodName } from "../reference";
import type { Slot } from "../slots";
import type { AppApi, Step, Tab } from "./api";
import { PhotoSaid } from "./PlatePhoto";

type Nutrition = ReturnType<typeof import("../pilot").aggregate>;
export type PlateReadIn = {
  autoTitle: (its: Ingredient[]) => string;
  bigN: number;
  clearPlate: () => void;
  dayLine: GateLine;
  dayNums: { kcal: number; protein: number; fats: number; carbs: number };
  dishNow: { sig: string; status: "working" | "done" | "off"; makesIt?: boolean; why?: string; around?: string; betterAs?: string; holds?: string } | null;
  dishOfMeal: boolean;
  extrasText: (items: { food: any; grams: number }[]) => string | null;
  items: Ingredient[];
  mealDate: string;
  mealSlot: Slot | null | undefined;
  mealWord: string;
  notify: (s: string) => void;
  numbersOpen: boolean;
  nutri: GateLine;
  p: AppApi;
  photoMeal: { date: string; slot: Slot } | null;
  photoTime: (iso: string) => string;
  pickSlot: Slot | null | undefined;
  planNow: PlanNumbers | null | undefined;
  plateMeal: () => Meal;
  plateWhen: PlateWhen;
  putInSlot: (its: Ingredient[]) => void;
  readoutEl: React.ReactNode;
  rvEat: "all" | "half" | "part" | null;
  rvEdit: string | null;
  rvGrams: string;
  rvPlan: boolean;
  setRvEat: Dispatch<SetStateAction<"all" | "half" | "part" | null>>;
  setRvEdit: Dispatch<SetStateAction<string | null>>;
  setRvGrams: Dispatch<SetStateAction<string>>;
  setRvPlan: Dispatch<SetStateAction<boolean>>;
  setShotAt: Dispatch<SetStateAction<number>>;
  setState: Dispatch<SetStateAction<PilotState>>;
  setStep: (s: Step) => void;
  setTab: (t: Tab) => void;
  shotAt: number;
  sizeRef: number | null | undefined;
  slotV: (f: NonNullable<AppApi["filling"]>) => Val;
  state: PilotState;
  t: Nutrition & { weight: number | null };
  updateItem: (id: string, patch: Partial<Ingredient>) => void;
};

export function plateRead(given: PlateReadIn) {
  const { autoTitle, bigN, clearPlate, dayLine, dayNums, dishNow, dishOfMeal, extrasText, items, mealDate, mealSlot, mealWord, notify, numbersOpen, nutri, p, photoMeal, photoTime, pickSlot, planNow, plateMeal, plateWhen, putInSlot, readoutEl, rvEat, rvEdit, rvGrams, rvPlan, setRvEat, setRvEdit, setRvGrams, setRvPlan, setShotAt, setState, setStep, setTab, shotAt, sizeRef, slotV, state, t, updateItem } = given;
  const ph = state.photo!;
  const total = Math.max(1, Math.round(items.reduce((k, i) => k + i.grams, 0)));
  const planning = !!p.filling && plateWhen === "plan", past = !!p.filling && plateWhen === "past";
  const today = !p.filling && new Date(ph.at).toDateString() === new Date().toDateString();
  const adv = today ? photoAdvice({ items, protein: t.protein ?? 0, mealWord, mealKcal: sizeRef ?? null, big: bigN, nutrition: nutri, day: dayLine, culinaryOk: dishNow?.status === "done" ? Boolean(dishNow.makesIt) : null, dish: dishOfMeal ? state.course : undefined, asked: true }) : null;
  const slot = p.pick === "snack" ? null : pickSlot && mealSlot ? { date: mealDate, slotId: mealSlot.id, name: mealSlot.name, time: mealSlot.time } : photoMeal ? { date: photoMeal.date, slotId: photoMeal.slot.id, name: photoMeal.slot.name, time: photoMeal.slot.time } : mealSlot ? { date: mealDate, slotId: mealSlot.id, name: mealSlot.name, time: mealSlot.time } : null;
  const pick = (x: "all" | "half" | "part") => { setRvEat(x); setRvGrams(x === "all" ? String(total) : x === "half" ? String(Math.round(total / 2)) : ""); if (x === "part") window.setTimeout(() => document.querySelector<HTMLInputElement>("input.rv-grams")?.focus(), 0); };
  const chip = (on: boolean, text: string, tap: () => void, cls = "") => (
    <div key={text} role="radio" tabIndex={0} aria-checked={on} className={`pa-opt${on ? " on" : ""}${cls}`} onClick={tap} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tap(); } }}>{on && <span aria-hidden="true">✓</span>}{text}</div>);
  const saved = !!ph.saved && state.meals.some((m) => m.id === ph.saved);
  const done = () => {
    if (planning) { if (!rvPlan) { clearPlate(); return; } const f = p.filling!; putInSlot(items); notify(w("plate.plannedFor", { slot: slotV(f) })); return; }
    if (!rvEat) { clearPlate(); return; }
    const g = Math.min(total, Math.round(Number(rvGrams) || 0));
    if (g <= 0) { document.querySelector<HTMLInputElement>("input.rv-grams")?.focus(); return; }
    const frac = g / total;
    if (past) {
      const f = p.filling!, title = (state.title || "").trim() && state.title !== "DaaM" ? state.title.trim() : autoTitle(items);
      p.logEaten(frac < 1 ? items.map((i) => ({ ...i, grams: Math.max(1, Math.round(i.grams * frac)) })) : items, title, { date: f.date, slotId: f.slotId, name: f.name, time: f.time }, atMeal(f.date, f.time), f.mealId);
      setState((s) => ({ ...s, items: [], portion: null, title: "", photo: undefined }));
      p.setFilling(null); setStep("in"); setTab("plan"); notify(w("plate.isInEaten", { title, slot: slotV(f) })); return;
    }
    p.ateNow(plateMeal(), slot, { photo: ph.image, at: ph.who === "ate" ? ph.at : undefined, ...(frac < 1 ? { part: frac } : {}) });
  };
  const shots = [ph.image, ...(ph.more ?? [])], at = Math.min(shotAt, shots.length - 1);
  return (
    <section className="card plate-card read-view">
      <div className="mp-big">
        <div className="mp-big-img"><img src={shots[at]} alt={w("make.photoOfTheMeal")} /></div>
        {shots.length > 1 && <div className="mp-shots" role="group" aria-label={w("make.photosOfTheMeal")}>{shots.map((src, k) => (
          <button key={k} type="button" className={`mp-shot${k === at ? " on" : ""}`} aria-pressed={k === at} aria-label={w("make.photoN", { n: k + 1 })} onClick={() => setShotAt(k)}><img src={src} alt="" /></button>))}</div>}
        {/* an amount is corrected here, by a tap on it */}
        <div className="mp-tags">{items.map((i) => rvEdit === i.id
          ? <span key={i.id} className="mp-tag-edit">{foodName(i.food).split(",")[0]} <input className="rv-amount" type="number" inputMode="numeric" min={1} autoFocus aria-label={w("plate.gramsOfFood", { food: foodName(i.food).split(",")[0] })} defaultValue={Math.round(i.grams)} onChange={(e) => { const g = Math.round(Number(e.target.value)); if (g > 0) updateItem(i.id, { grams: g }); }} onBlur={() => setRvEdit(null)} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} /> g</span>
          : <button key={i.id} type="button" className="mp-tag" onClick={() => setRvEdit(i.id)}>{foodName(i.food).split(",")[0]} {i.est ? "~" : ""}{Math.round(i.grams)} g</button>)}</div>
        <div className="mp-big-row"><small className="muted mp-big-say">{wn("plate.photoLine", items.length, { time: photoTime(ph.at) })}</small></div>
        <div className="rv-change"><button type="button" className="pill pill-small pill-action" onClick={() => setState((s) => (s.photo ? { ...s, photo: { ...s.photo, view: undefined } } : s))}>{w("plate.changeTheFoods")}</button></div>
      </div>
      {readoutEl}
      {numbersOpen && p.rates && <NumbersTable n={{ calories: t.calories, protein: t.protein, fats: t.fats, carbs: t.carbs, fiber: t.fiber }} rates={p.rates} extra={extrasText(items)} weight={t.weight ?? null} day={dayNums} plan={planNow} />}
      {p.ai.on && <PhotoSaid photo={ph} meal={mealSlot ? mealSlot.name : null} />}
      {state.cooking?.length ? <small className="pt-cook"><b>{w("plate.forCooking")}</b> {state.cooking.join(", ")}</small> : null}
      {adv && <div className="bubble mealan chef-line rv-chef"><p><b>{CHEF_NAME}:</b> {adv.line}</p></div>}
      {planning ? (
        <div className="pa-row rv-q rv-plan">
          <small className="pa-row-q">{w("plate.isItForPlan")}</small>
          <div className="pa-chips" role="group" aria-label={w("plate.isItForPlan")}>{chip(rvPlan, rvPlan ? w("plate.plannedForChip", { slot: slotV(p.filling!) }) : w("plate.planItFor", { slot: slotV(p.filling!) }), () => setRvPlan((x) => !x), " rv-plan-chip")}</div>
        </div>
      ) : (
        <div className="pa-row rv-q rv-eat">
          <small className="pa-row-q">{w("plate.didYouEatIt")}</small>
          <div className="pa-chips" role="radiogroup" aria-label={w("plate.didYouEatIt")}>
            {chip(rvEat === "all", w("plate.allOfIt"), () => pick("all"))}{chip(rvEat === "half", w("plate.half"), () => pick("half"))}{chip(rvEat === "part", w("plate.partOfIt"), () => pick("part"))}
          </div>
          {rvEat && <div className="rv-weight"><input className="search rv-grams" type="number" inputMode="numeric" min={1} max={total} aria-label={w("plate.gramsEaten")} value={rvGrams} onChange={(e) => { setRvGrams(e.target.value); const g = Math.round(Number(e.target.value)); setRvEat(g === total ? "all" : "part"); }} /><small className="muted">{w("plate.gOfTotal", { total })}</small></div>}
        </div>
      )}
      <div className="button-row rv-go">
        <button type="button" className="pill pill-small pill-action rv-save" disabled={saved} onClick={() => p.saveRead(plateMeal(), ph.image)}>{saved ? w("recipes.savedInMyRecipes") : w("make.saveInMyRecipes")}</button>
        <button type="button" className="pill pill-small pill-primary rv-done" onClick={done}>{w("make.done")}</button>
      </div>
    </section>);
}
