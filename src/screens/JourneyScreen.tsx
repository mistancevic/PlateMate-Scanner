import { useState, useEffect, useRef, Fragment } from "react";
import { tempsIn } from "../units";
import { Camera, Pencil, Plus, Trash2, ArrowLeft, ChefHat, ThumbsUp, ThumbsDown, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import { ConfirmButton } from "../components/Confirm";
import type { Mix } from "../mixtip";
import { aggregate, density, uid, solveIngredient, servingLabel } from "../pilot";
import { fromMeal } from "../planned";
import type { Meal, Food, Ingredient, PlateOpt, StepMark } from "../pilot";
import { pairItems, partsOf, optAt, optToItem, itemToOpt, canLeaveOut, leanFood } from "../parts";
import { draftSteps } from "../draftSteps";
import { equipmentOf } from "../personal";
import { stepParts, stepText } from "../steps";
import { fmt, fixed, pdText, pdVal, pdTag, pdRange } from "../ui";
import { CHEF_NAME, COACH_NAME } from "../components/Mark";
import { log } from "../log";
import { iconFor } from "../icons";
import { quickPicks } from "../quick";
import { lineTotal } from "../labeltable";
import { SwipeRow } from "../components/SwipeRow";
import { dishTaste, goesInDish, heldBackLine } from "../dishTaste";
import { TAKEN_UP_SHORT, capOil } from "../frying";
import { plural, yourPortions } from "../portions";
import { methodsFor } from "../methods";
import { rankSwaps } from "../swaps";
import { PlateHelper } from "../components/PlateHelper";
import { momentOf, orderMoments, REGIONS } from "../moments";
import { FoodCard } from "../components/FoodCard";
import { thumbnailBase64 } from "../utils/image";
import type { AppApi } from "./api";
import { mealShare, mealNow, routeOf, solveMeal, closedSlots, unloggedMeal, type Add } from "../makeMeal";
import { answersFor, setAnswer } from "../unlogged";
import { slotsOn } from "../slots";
import { lifestyleOf } from "../personal";
import { dayRecord } from "../record";
import { dayLog } from "../today";
import { ymd } from "../plan";
import { blockedByAllergy } from "../safety";
import { minPortionOf } from "../foodjob";
import { tasteForChef } from "../kitchens";
import { resizeImageBase64 } from "../utils/image";
import { ShotsCard, LinkCard, ReadCard, ErrorCard, type InFlow } from "../components/RecipeIn";
import { changesOf, countItem, cleanSteps, scaleTo, onePortion, sideAmount, pdOf, realPortions, isYours, sideWord, MAX_SHOTS, kcalOfItems, sizedFits, roundGrams, type ReadRecipe, type SideKind } from "../recipeIn";
import { countOf } from "../recipeDelete";
import { foodNames, originalFoodsOf, diffFoods, diffLine } from "../stepsState";
import { OriginalSteps, StepsHint } from "../components/StepsView";
import { countOf as countedOf } from "../counted";
import { CountAmount, SizePicker, isCounted } from "../components/CountAmount";

// Make it a meal (0.2.9, canvas board CH, CH1 to CH3): an idea from Chef Mealan, checked and with the app's grams
type MealOption = { kitchen: string; title: string; why: string; adds: { name: string; grams: number; have: boolean; base: boolean }[]; items: Ingredient[]; kcal: number; pd: number | null };
type ChefState = { status: "working" } | { status: "done"; options: MealOption[]; tried: string[] } | { status: "none"; tried: string[] };
const estimate = (a: { name: string; calories: number; protein: number; fats?: number | null; carbs?: number | null }): Food => ({ id: uid(), name: a.name, brand: "estimate", basis: "100g", source: "estimate", notes: `${CHEF_NAME}'s estimate`, reviewedAt: new Date().toISOString(), readyToEat: true, calories: a.calories, protein: a.protein, fats: a.fats ?? null, carbs: a.carbs ?? null, fiber: null, icon: iconFor(a.name) });
// a recipe from a screenshot or a link (0.2.16, board IM): Change the dish, or Add on the side
type SideOpt = { name: string; kind: SideKind; note: string; food: Food; grams: number; dish: Ingredient[]; yours: boolean };
// part and before (0.2.19, IM16): a change inside one part, and the plate before it, for Back to the original
// a change keeps the whole recipe as changed (0.2.23, IM23): its foods at the recipe's own size, and the steps drafted for it
type Drafted = { steps: string[]; marks?: StepMark[]; kitchen?: string; parts?: string[] };
type Way = { kind: "change"; title: string; notes: string[]; part?: string; before?: Ingredient[]; whole?: Ingredient[]; drafted?: Drafted } | { kind: "side"; options: SideOpt[]; pick: number };
const readFile = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsDataURL(f); });

const STEPS = ["in", "recipe", "make", "made", "after"] as const;
function stepHead({ n, title, sub, nameField }: { n: number; title: string; sub?: string; nameField?: { value: string; placeholder: string; onChange: (v: string) => void; onCommit?: (v: string) => void } }) {
  return (
    <div className="step-head">
      <div className="step-bar">{STEPS.map((s, i) => <i key={s} className={i < n ? "on" : ""} />)}</div>
      {nameField ? <input className="title-input" aria-label="Name of the meal" value={nameField.value} placeholder={nameField.placeholder} onChange={(e) => nameField.onChange(e.target.value)} onBlur={(e) => nameField.onCommit?.(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} enterKeyHint="done" /> : <h2>{title}</h2>}
      {sub && <p>{sub}</p>}
    </div>
  );
}
const band = (pd: number | null) => (pd === null || pd < 3 ? "low" : pd < 5 ? "mid" : "high");

// sugars, saturates and salt on the plate, from the foods whose tables have them; for information only
function extras(items: { food: any; grams: number }[]) {
  const parts = ([["sugars", "sugars"], ["saturates", "saturates"], ["salt", "salt"]] as const)
    .map(([key, word]) => { const v = lineTotal(items, key); return v === null ? null : `${fmt(v)} g ${word}`; }).filter(Boolean);
  return parts.length ? <small className="readout-extra">{parts.join(" · ")}{items.some((i) => !i.food.table?.length) ? " · from foods with a full table" : ""}</small> : null;
}
export function JourneyScreen(p: AppApi) {
  const { state, setState, setTab, step, setStep, setCamera, setMode, blank, updateItem,
    setAdjustId, mixWith, options, pdRef, saveMeal, notify, setError, setFeedback, add } = p;
  const [q, setQ] = useState("");
  // the amounts before Fit: a mover that comes back unchanged means the plate was already above the target (0.2.7+r2)
  const [fitBefore, setFitBefore] = useState<Record<string, number> | null>(null);
  const [lineOpen, setLineOpen] = useState(false);
  const [chef, setChef] = useState<ChefState | null>(null);
  const [madeBy, setMadeBy] = useState<{ kitchen: string; base: string; from: Ingredient[]; tried: string[] } | null>(null);
  // When Mealan produces options, the first one becomes the recipe on screen.
  useEffect(() => {
    if (options.length && (step === "recipe" || step === "in")) {
      const o = options[0]; setPick(0);
      const moved = o.items.find((oi) => oi.id === o.food.id) ?? o.items.find((oi) => !oi.locked);
      const mv = o.items.find((oi) => oi.id === (moved?.id ?? "")) ?? null;
      const moverId = o.items.find((oi) => oi.food.id === o.food.id)?.id ?? mv?.id ?? "";
      if (moverId && touched.has(moverId)) {
        // you typed this one: keep your number, show Mealan's as a suggestion
        setSuggest({ id: moverId, grams: Math.round(o.grams) });
      } else {
        setSuggest(null);
        setState((s) => ({ ...s, items: o.items.map((oi) => { const cur = s.items.find((x) => x.id === oi.id); return cur ? { ...oi, locked: cur.locked } : oi; }), portion: null }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);
  const [cap, setCap] = useState<number | null>(300);
  const [pick, setPick] = useState(0);
  const [note, setNote] = useState("");
  const [good, setGood] = useState<"daam" | "good" | "no" | null>(null);
  const [plate, setPlate] = useState<string>("");
  // How did making it go? (Y1 column 9, 10 October 2026): photos while it's on the counter, how it went, how much was eaten
  const [photos, setPhotos] = useState<string[]>([]);
  const [went, setWent] = useState<"as" | "not">("as");
  const [different, setDifferent] = useState("");
  const [ate, setAte] = useState<"all" | "portion" | "later" | "not">("all");
  const [saveRecipe, setSaveRecipe] = useState(true);
  const addPhoto = (file?: File | null) => { if (!file) return; const r = new FileReader(); r.onload = () => thumbnailBase64(String(r.result), 480).then((d) => setPhotos((x) => [...x, d])).catch(() => {}); r.readAsDataURL(file); };
  const resetMade = () => { setPhotos([]); setWent("as"); setDifferent(""); setAte("all"); setSaveRecipe(true); };
  const [method, setMethod] = useState<string | null>(null);
  // after Add in the tip at the recipe step, Mealan refits with the new food on the plate
  const [refit, setRefit] = useState(false);
  useEffect(() => { if (refit) { setRefit(false); askMealan(); } }, [state.items.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const [title, setTitle] = useState("");
  // A dish as one row (0.2.5, canvas S "A dish from the plan"): the recipe's items show as one row, n of its portions, the
  // ingredients folded under it. The portion is the lever; the solver never moves a dish item. Anything added next to it is the side.
  type Group = { kind: "item"; item: Ingredient } | { kind: "dish"; id: string; title: string; of: number; n: number; items: Ingredient[] };
  const groupsOf = (list: Ingredient[]): Group[] => {
    const out: Group[] = []; const seen = new Set<string>();
    for (const i of list) {
      if (!i.dish) { out.push({ kind: "item", item: i }); continue; }
      if (seen.has(i.dish.id)) continue; seen.add(i.dish.id);
      out.push({ kind: "dish", id: i.dish.id, title: i.dish.title, of: i.dish.of, n: i.dish.n, items: list.filter((x) => x.dish?.id === i.dish!.id) });
    }
    return out;
  };
  const setPortions = (dishId: string, n: number) => {
    const k = Math.max(1, Math.min(12, n));
    setState((s) => ({ ...s, items: s.items.map((i) => (i.dish?.id === dishId ? { ...i, grams: Math.round(i.dish.base * k), dish: { ...i.dish, n: k } } : i)), portion: null }));
  };
  const removeDish = (dishId: string) => setState((s) => ({ ...s, items: s.items.filter((i) => i.dish?.id !== dishId), portion: null }));
  const DishRow = ({ g }: { g: Extract<Group, { kind: "dish" }> }) => {
    const t = aggregate(g.items);
    return (
      <div className="row dish-row">
        <span className="dot dot-locked" aria-hidden="true" />
        <div className="row-text">
          <b>{g.title}</b>
          <small>{pdText(density(t.protein, t.calories))} · {fmt(t.calories, 0)} kcal · {fmt(t.protein, 0)} g protein · the recipe stays as it is</small>
          <details className="dish-fold"><summary>Ingredients, {g.items.length}</summary>
            <ul>{g.items.map((i) => <li key={i.id}>{fmt(i.grams, 0)} g {i.food.name}</li>)}</ul>
            <button type="button" className="link" onClick={() => removeDish(g.id)}>Take it off the plate</button>
          </details>
        </div>
        <div className="dish-portions" aria-label={`${g.n} of ${g.of} portions`}>
          <button type="button" className="icon" aria-label="One portion less" onClick={() => setPortions(g.id, g.n - 1)}>−</button>
          <b>{g.n} of {g.of}</b>
          <button type="button" className="icon" aria-label="One portion more" onClick={() => setPortions(g.id, g.n + 1)}>+</button>
        </div>
      </div>
    );
  };
  // Chef Mealan's tip (canvas S, 11 October 2026): when the plate is under the target, the three foods from My foods that lift
  // it most, a normal portion each (the pack's serving, 30 g for a powder, else 100 g), with the score the plate would reach.
  const portionOf = (f: Food) => f.serving?.grams ?? (/powder|whey|protein pulver/i.test(f.name) ? 30 : 100);
  const lifts = (list: typeof items) => {
    const t = aggregate(list); const cur = density(t.protein, t.calories);
    if (cur === null || pdRef === null || cur >= pdRef - 0.05) return null;
    // R9 (0.2.33): Chef Mealan offers only foods that go with the dish on the plate, a plate of your own too
    const dish = dishTaste(list.map((i) => i.food.name));
    const rows = state.foods.filter((f) => !list.some((i) => i.food.id === f.id) && f.calories !== null && f.protein !== null && goesInDish(dish, f.name)).map((f) => {
      const g = portionOf(f); const kcal = (t.calories ?? 0) + (f.calories! * g) / 100, pro = (t.protein ?? 0) + (f.protein! * g) / 100;
      return { f, g, to: density(pro, kcal) ?? 0 };
    }).filter((r) => r.to > cur + 0.3).sort((a, b) => b.to - a.to).slice(0, 3);
    return { cur, gap: pdRef - cur, rows, reaches: rows.some((r) => r.to >= pdRef - 0.05) };
  };
  const addPortion = (f: Food, g: number, refit: boolean) => {
    setState((s) => ({ ...s, items: [...s.items, { id: uid(), food: { ...f, readyToEat: true }, grams: g, locked: false }], portion: null }));
    if (refit) setRefit(true);
  };
  const Tip = ({ list, refit }: { list: typeof items; refit: boolean }) => {
    const l = lifts(list); if (!l || !list.length) return null;
    return (
      <div className="chef-line chef-tip">
        <span className="chef-line-who"><ChefHat size={15} /> {CHEF_NAME}</span>
        <span>Your plate is {pdVal(l.gap)} under. {l.rows.length ? `Add one of these from your foods ${refit ? `and ${CHEF_NAME} refits` : "to lift it"}:` : "Nothing in your foods lifts it on its own."}</span>
        {l.rows.map((r) => (
          <div key={r.f.id} className="tip-row">
            <div className="tip-text"><b>{r.f.name}</b><small>{r.g} g · {pdText(density(r.f.protein, r.f.calories))}</small></div>
            <div className={`tip-to ${r.to >= pdRef! - 0.05 ? "fits" : ""}`}><b>{pdVal(r.to)}</b><small>the plate</small></div>
            <button type="button" className="pill pill-small pill-primary" onClick={() => addPortion(r.f, r.g, refit)}>+ Add</button>
          </div>
        ))}
        {!l.reaches && <span className="tip-note">{l.rows.length ? `None of them reaches ${pdVal(pdRef)} on its own. ` : ""}For a dish around these foods, ask the chef.</span>}
        {!l.reaches && <button type="button" className="pill pill-small" onClick={() => p.openOut()}>Ask {CHEF_NAME} what to add</button>}
      </div>
    );
  };
  // a plate made for a slot (0.2.2): put it in, saved to My recipes once. A recipe with the same name, foods and amounts is
  // the same recipe, so coming back by Fit it on the Plate and putting it in again does not double it.
  const slotName = (f: NonNullable<typeof p.filling>) => `${f.dayName === "today" ? "today's" : `${f.dayName}'s`} ${f.name.toLowerCase()}`;
  const putInSlot = (its: typeof items) => {
    const f = p.filling; if (!f) return;
    const title = (p.state.title || "").trim() || autoTitle(its);
    const sameFoods = (m: Meal) => m.items.length === its.length && m.items.every((x, i) => x.food.id === its[i].food.id && Math.round(x.grams) === Math.round(its[i].grams));
    // the recipe this plate came from, with the same foods and amounts: a new name renames it, no copy (Milan, 11 October 2026)
    const dishId = its.length > 0 && its.every((i) => i.dish && i.dish.id === its[0].dish!.id) ? its[0].dish!.id : null;
    const origin = (dishId ? state.meals.find((m) => m.id === dishId) : undefined) ?? (f.mealId ? state.meals.find((m) => m.id === f.mealId && sameFoods(m)) : undefined);
    const found = origin ?? state.meals.find((m) => m.title === title && sameFoods(m));
    const meal: Meal = found ? { ...found, title } : { id: uid(), title, items: structuredClone(its), portion: its.reduce((n, i) => n + i.grams, 0), savedAt: new Date().toISOString() };
    if (found && found.title !== title) p.renameMeal(found.id, title);
    setState((s) => ({ ...s, meals: found ? s.meals : [structuredClone(meal), ...s.meals], items: [], portion: null, title: "" }));
    // the slot holds what is on the plate: the dish at its portions, plus any side
    const t = aggregate(its);
    p.fill(f.date, f.slotId, { ...fromMeal(meal, "plate"), source: found ? (found.from === "coach" ? "coach" : "mine") : "plate", kcal: Math.round(t.calories ?? 0), protein: Math.round(t.protein ?? 0), items: structuredClone(its), portion: its.reduce((n, i) => n + i.grams, 0) });
    p.setFilling(null); setStep("in"); setTab("plan"); notify(`${title} is ${slotName(f)}.${found ? "" : " Saved to My recipes too."}`);
  };
  const autoTitle = (its: typeof items) => { const n = its.map((i) => i.food.name.split(",")[0].trim()); return n.length <= 1 ? n[0] ?? "Meal" : `${n.slice(0, -1).join(", ")} & ${n[n.length - 1]}`; };
  const [shareWhy, setShareWhy] = useState<"look" | "ok" | "help" | null>(null);
  const [helper, setHelper] = useState<{ missing: string | null; prefill?: string } | null>(null);
  useEffect(() => { if (p.mealanAsk && items.length > 0) { setHelper({ missing: null }); p.mealanAsked(); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [p.mealanAsk]);
  // a "Not quite? Tell Mealan" from a mix tip opens the helper with the tip as the question's start
  useEffect(() => { if (p.mixQuestion) { setHelper({ missing: null, prefill: p.mixQuestion }); setCardId(null); p.mixQuestionTaken(); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [p.mixQuestion]);
  // the mix tip for a food on this plate; the card logs what it showed
  const mixProps = (food: typeof state.foods[number]) => {
    const tip = p.mixFor(food);
    return { tip, momentName: momentOf(p.moment).name, take: (m: Mix) => { setCardId(null); p.takeMix(food, m); }, ask: () => p.askAboutMix(food, tip) };
  };
  const [sharing, setSharing] = useState(false);
  const [swapId, setSwapId] = useState<string | null>(null);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [suggest, setSuggest] = useState<{ id: string; grams: number } | null>(null);
  const [cardId, setCardId] = useState<string | null>(null);
  const TASTE = { daam: "DaaM good", good: "Good", no: "Not really" } as const;
  const items = state.items;
  const t = aggregate(items);
  const pd = density(t.protein, t.calories);
  const n = STEPS.indexOf(step) + 1;
  const cardItem = items.find((i) => i.id === cardId);
  const foodCard = cardItem && <FoodCard food={state.foods.find((x) => x.id === cardItem.food.id) ?? cardItem.food} addPhoto={(d) => p.addFoodPhoto(cardItem.food.id, d)} toggleFavorite={() => p.toggleFavorite(cardItem.food.id)} insight={{ dayKcal: p.todayKcal, eaten: p.eatenTodayKcal, dayName: p.dayName, goalKey: p.tipGoalKey, requestTip: () => p.requestTip(cardItem.food.id), setJob: (j) => p.setFoodJob(cardItem.food.id, j) }} removePhoto={(i) => p.removeFoodPhoto(cardItem.food.id, i)} setMain={(i) => p.setMainPhoto(cardItem.food.id, i)} target={pdRef} fit={p.fitPd(density(cardItem.food.protein, cardItem.food.calories))} close={() => setCardId(null)} dontHave={() => { setHelper({ missing: cardItem.id }); setCardId(null); }} mix={mixProps(state.foods.find((x) => x.id === cardItem.food.id) ?? cardItem.food)} />;
  const helperSheet = helper && (
    <PlateHelper safety={p.safety} ai={p.ai} onFlag={p.flagFromModel} items={items} library={state.foods} pdRef={pdRef} cap={cap ?? null} missing={helper.missing ? items.find((i) => i.id === helper.missing) ?? null : null} prefill={helper.prefill}
      setError={setError} close={() => setHelper(null)} openTalk={() => { setHelper(null); p.openOut(); }} record={p.recordTalk}
      apply={(next, note) => { setState((s) => ({ ...s, items: next, portion: null })); p.notify(note); if (step === "recipe") recalc(next); }} />
  );
  const adjustFor = (o: { items: typeof items }) => o.items.find((i) => !i.locked)?.id;
  // Mealan moves the food with the highest protein density; everything else keeps the amount you set.
  function askMealan() {
    log("fit_used");
    let ready = items.map((i) => ({ ...i, food: { ...i.food, readyToEat: true } }));
    if (ready.length === 1) {
      const partner = [...state.foods].filter((f) => f.id !== ready[0].food.id).sort((a, b) => (density(b.protein, b.calories) ?? -1) - (density(a.protein, a.calories) ?? -1))[0];
      if (!partner) { setError("Add a food to your library first, so Chef Mealan has partners to choose from."); return; }
      ready = [{ ...ready[0], locked: true }, { id: uid(), food: { ...partner, readyToEat: true }, grams: 100, locked: false }];
    }
    const mover = moverOf(ready);
    setFitBefore(Object.fromEntries(ready.map((i) => [i.id, i.grams])));
    if (!mover) { setState((s) => ({ ...s, items: ready, portion: null })); setStep("recipe"); return; } // everything fixed: show where it lands
    setState((s) => ({ ...s, items: ready, foods: s.foods.map((f) => ready.some((x) => x.food.id === f.id) ? { ...f, readyToEat: true } : f) }));
    setAdjustId(mover.id); setPick(0);
    const forSolver = ready.map((i) => (i.id === mover.id ? i : { ...i, locked: true }));
    setTimeout(() => { if (mixWith(forSolver, mover.id)) setStep("recipe"); }, 0);
  }
  // Tapping a dot: kept becomes free to move and Mealan recalculates; free becomes kept at its current amount.
  // The mover is the free food with the most protein. Freeing a food never changes its amount by itself.
  const moverOf = (list: typeof items) => [...list.filter((i) => !i.locked)].sort((a, b) => (density(b.food.protein, b.food.calories) ?? -1) - (density(a.food.protein, a.food.calories) ?? -1))[0];
  function recalc(list: typeof items) {
    const mover = moverOf(list);
    if (!mover) return;
    setAdjustId(mover.id);
    const forSolver = list.map((i) => (i.id === mover.id ? i : { ...i, locked: true }));
    setTimeout(() => { mixWith(forSolver, mover.id); }, 0);
  }
  function toggle(id: string) {
    const next = items.map((i) => (i.id === id ? { ...i, locked: !i.locked } : i));
    setState((s) => ({ ...s, items: next, portion: null }));
    if (step !== "recipe") return;
    // a dot never changes a number: whoever becomes the mover gets a suggestion, not a move
    const mover = moverOf(next);
    if (mover) setTouched((t) => new Set(t).add(mover.id));
    setSuggest(null);
    recalc(next);
  }
  // Start again from nothing: the plate's foods go, the library stays.
  function emptyPlate() {
    p.setPick(null);
    setMadeBy(null); setChef(null); setWay(null);
    setState((s) => ({ ...s, items: [], portion: null, fromRecipe: undefined, optional: undefined, leftOut: undefined, emptyParts: undefined }));
    setPartsMode(false); setStep("in");
  }
  function remove(id: string) {
    const rest = items.filter((i) => i.id !== id);
    // R2 (0.2.32, board RS, R2c): the last food of a part goes, the part stays where it was, empty, with + Add a food to it
    const gone = items.find((i) => i.id === id)?.part;
    const emptied = gone && !rest.some((i) => i.part === gone) && !(state.optional ?? []).some((o) => o.part === gone) && !(state.leftOut ?? []).some((l) => l.part === gone) ? gone : null;
    setState((s) => ({ ...s, items: rest, portion: null, ...(emptied ? { emptyParts: [...(s.emptyParts ?? []).filter((x) => x.part !== emptied), { part: emptied, at: plateParts.indexOf(emptied) }] } : {}) }));
    if (step === "recipe") {
      if (rest.length >= 2 && moverOf(rest)) recalc(rest); else setStep("in");
    }
  }
  function swap(id: string, food: typeof state.foods[number], grams?: number | null, keep = false) {
    // a food that works arrives kept at the grams the list promised; one that doesn't arrives at the cap, grey, and the plate says how far that gets you
    const next = items.map((i) => (i.id === id ? { ...i, food: { ...food, readyToEat: true }, grams: grams ?? i.grams, locked: keep } : i));
    setState((s) => ({ ...s, items: next, portion: null }));
    setSwapId(null);
    if (step === "recipe" && !keep) { setTouched((t) => new Set(t).add(id)); recalc(next); }
  }
  // Editing an amount on the recipe: that amount becomes yours, Mealan moves the highest-PD food you didn't touch.
  function edit(id: string, grams: number) {
    setTouched((t) => new Set(t).add(id));
    const next = items.map((i) => (i.id === id ? { ...i, grams } : i));
    setState((s) => ({ ...s, items: next, portion: null }));
    recalc(next);
  }
  function applySuggestion() {
    if (!suggest) return;
    setTouched((t) => { const n = new Set(t); n.delete(suggest.id); return n; });
    setState((s) => ({ ...s, items: s.items.map((i) => (i.id === suggest.id ? { ...i, grams: suggest.grams } : i)), portion: null }));
    setSuggest(null);
  }
  const quick = quickPicks(state.foods, state.feedback);
  const swapCandidates = !swapId || pdRef === null ? [] : rankSwaps(items, swapId, state.foods, pdRef, cap ?? null);
  const swapPanel = swapId && (
    <div className="sheet-backdrop" onClick={() => setSwapId(null)}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="card-top"><span>Swap {items.find((i) => i.id === swapId)?.food.name} for</span><button className="link" onClick={() => setSwapId(null)}>Cancel</button></div>
        <p className="small">Sorted by how well each one brings the plate to your {pdVal(pdRef)}, with the rest kept as it is.</p>
        <div className="rows">
          {swapCandidates.map(({ f, grams, fits }) => (
            <button className="row row-food row-button" key={f.id} onClick={() => swap(swapId, f, fits ? grams : grams !== null ? Math.min(grams, cap ?? 300) : null, fits)}>
              <span className="thumb thumb-sm">{f.photo ? <img src={f.photo} alt="" /> : (f.icon || iconFor(f.name))}</span>
              <div className="row-text"><b>{f.name}</b><small>{f.brand ? `${f.brand} · ` : ""}{pdText(density(f.protein, f.calories))}</small></div>
              <span className={`pdpill pdpill-${fits ? "high" : grams !== null ? "mid" : "low"}`}>{grams !== null ? `${grams} g` : "can't reach"}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
  // for a slot (canvas S, 11 October 2026) the meal's name is the title, typed in place; the foods' name until then
  // the head is a plain function, not a component made on every render: a component made inside the screen is a new type each
  // time, React remounts it and the name field loses focus after one letter (Milan, 11 October 2026)
  // which meal the plate is for, and how big it is: what is left of the day over the meals still to come (0.2.9, a rule)
  const todayKey = ymd(new Date()), mealDate = p.filling?.date ?? todayKey;
  const daySlots = slotsOn(lifestyleOf(p.personal), p.personal.timesOn, mealDate);
  const dayRec = dayRecord(daySlots, p.planned[mealDate], mealDate === todayKey ? dayLog(state.feedback, new Date()).logged : [], mealDate);
  // which meals are done (0.2.12, board MS): a plate off the plan closes the meal nearest its time; I skipped it closes too
  const [answers, setAnswers] = useState(() => answersFor(todayKey));
  const closed = mealDate === todayKey ? closedSlots(daySlots, dayRec, answers) : new Set([...dayRec.eaten.map((f) => f.slot!.slotId), ...dayRec.skipped.map((x) => x.id)]);
  // R11 (0.2.37, board RS8): what the plate is for. A meal picked in the line's section sizes the plate and counts by the plan;
  // Exploring and a snack off the plan size nothing; with nothing picked, the meal the clock is in, shown as a guess
  const pickSlot = !p.filling && p.pick?.startsWith("meal:") ? daySlots.find((x) => x.id === p.pick!.slice(5)) ?? null : null;
  const unsized = !p.filling && (p.pick === "exploring" || p.pick === "snack");
  const mealSlot = p.filling ? daySlots.find((x) => x.id === p.filling!.slotId) ?? null : unsized ? null : pickSlot ?? mealNow(daySlots, closed, new Date());
  const dayNums = p.numbersFor(new Date(`${mealDate}T12:00:00`));
  const share = mealSlot && dayNums ? mealShare(daySlots, mealSlot.id, { kcal: dayNums.kcal, protein: dayNums.protein }, mealDate === todayKey ? { kcal: dayRec.kcal, protein: dayRec.protein } : { kcal: 0, protein: 0 }, closed) : null;
  const chefable = p.kind !== "dessert" && momentOf(p.moment).planned && !!share && share.kcal >= 150 && p.filling?.mode !== "eat";
  // MS2: a meal whose time has passed and isn't logged: one question, here, when the size matters
  const unlogged = mealDate === todayKey ? unloggedMeal(daySlots, closed, answers, new Date(), mealSlot?.id ?? null) : null;
  const [justSkipped, setJustSkipped] = useState<string | null>(null);
  const answer = (slotId: string, a: "had" | "skipped" | null) => {
    const held = p.planned[todayKey]?.[slotId];
    // a planned meal skips the way Skip on Today does, so Today and Plan say the same; otherwise the answer is for the size only
    if (held) p.fill(todayKey, slotId, a === "skipped" ? { ...held, skipped: true } : { ...held, skipped: undefined });
    setAnswer(todayKey, slotId, a); setAnswers(answersFor(todayKey));
    setJustSkipped(a === "skipped" ? slotId : null);
  };
  const mealWord = (mealSlot?.name ?? "meal").toLowerCase();
  const Meal = mealWord.charAt(0).toUpperCase() + mealWord.slice(1);
  // R11 (0.2.37): the line says what the plate is for; the section's chips and their hint
  const capName = (n: string) => n.charAt(0).toUpperCase() + n.slice(1);
  const numsOf = share ? `${fmt(share.kcal, 0)} kcal · ${fmt(share.protein, 0)} g protein · ${pdText(pdRef)}` : "";
  const kindPart = p.kind === "dessert" ? " · A dessert" : items.some((i) => i.dish) ? " · A dish" : " · A mix";
  const momentPart = p.moment !== "regular" ? ` · ${momentOf(p.moment).name}` : "";
  const lineNow = pickSlot ? `${capName(pickSlot.name)}, ${pickSlot.time}${numsOf ? ` · ${numsOf}` : ""} · By the plan${momentPart}${kindPart === " · A mix" ? "" : kindPart}`
    : p.pick === "exploring" ? `Exploring · not sized for a meal${momentPart}${kindPart === " · A mix" ? "" : kindPart}`
    : p.pick === "snack" ? `Snack · off the plan${momentPart}${kindPart === " · A mix" ? "" : kindPart}`
    : `${mealSlot ? `${capName(mealSlot.name)}, ${mealSlot.time} by the clock · ` : ""}Off the plan · ${momentOf(p.moment).name}${kindPart}`;
  const forKey = p.pick ?? (mealSlot ? `meal:${mealSlot.id}` : "exploring");
  const forHint = pickSlot ? `${capName(pickSlot.name)}, ${pickSlot.time}: ${numsOf ? `${numsOf}, from your plan for today. ` : ""}It counts as your ${pickSlot.name.toLowerCase()}.`
    : p.pick === "exploring" ? "Exploring: nothing is sized for a meal. Pick a meal to see what your plan has for it."
    : p.pick === "snack" ? "Snack: off the plan, not sized for a meal."
    : mealSlot ? `${capName(mealSlot.name)}, by the clock: a guess, off the plan. Tap ${capName(mealSlot.name)} to make it your ${mealSlot.name.toLowerCase()}: it counts by the plan.` : "Pick what it is for.";
  // ---- a recipe from screenshots or a link (0.2.16, canvas board IM) ----
  const [inFlow, setInFlow] = useState<InFlow | null>(null);
  // R15 (0.2.41, board RS12): "whole" is the recipe as mapped, where a recipe starts on the plate
  const [pmode, setPmode] = useState<"whole" | "sized" | "recipe">("sized");
  const [way, setWay] = useState<Way | null>(null);
  const [wayBusy, setWayBusy] = useState<string | null>(null);
  // R10 (0.2.36): the wait for Change the recipe: the slow line, and what stops it (Stop, or the minute)
  const [waySlow, setWaySlow] = useState(false);
  const wayStop = useRef<AbortController | null>(null), wayStopWhy = useRef<"time" | null>(null);
  // Parts on the plate (0.2.19, IM18): each food gets a part and can be optional; new parts wait here until a food has one
  const [partsMode, setPartsMode] = useState(false);
  // How to make it (0.2.20, boards IM19, IM19b, IM19c, IM20): what you make, the draft on this step, the checklist ticks
  const [makeAll, setMakeAll] = useState<boolean | null>(null);
  const [mkDraft, setMkDraft] = useState<"" | "working" | string>("");
  const [ticks, setTicks] = useState<Set<string>>(new Set());
  const [newParts, setNewParts] = useState<string[]>([]);
  const [naming, setNaming] = useState<string | null>(null);
  const [tried, setTried] = useState<"yes" | "ok" | "no" | null>(null);
  // steps drafted on How to make it in this meal: the recipe page opens after How was it (0.2.23, IM23c)
  const [mkDrafted, setMkDrafted] = useState(false);
  // CT4, CT5 (0.2.24): the size of a counted food, open under its row
  const [sizeOpen, setSizeOpen] = useState<string | null>(null);
  // RP1c (0.2.25): Chef Mealan's steps or the original on How to make it
  const [mkView, setMkView] = useState<"own" | "orig">("own");
  const rec = state.fromRecipe ? state.meals.find((m) => m.id === state.fromRecipe) : undefined;
  // the plate is the recipe that came in while its foods are the recipe's (or a way to fit it is on); add a food and it is a plate like any other
  const imported = !!rec && items.length > 0 && (way !== null || items.every((i) => !!i.optional || rec.items.some((r) => r.food.id === i.food.id)));
  const opts: PlateOpt[] = state.optional ?? [], leftOut = state.leftOut ?? [];
  // a part left out keeps its place among the parts
  // an emptied part shows only while the plate still has parts (R2, 0.2.32)
  const emptyParts = state.emptyParts ?? [];
  const plateParts = (() => { const l = partsOf(items, opts); const keepEmpty = l.length > 0 || leftOut.length > 0; for (const x of [...leftOut, ...(keepEmpty ? emptyParts : [])].sort((a, b) => (a.at ?? 99) - (b.at ?? 99))) if (!l.includes(x.part)) l.splice(Math.min(x.at ?? l.length, l.length), 0, x.part); return l; })();
  // R9 (0.2.33): the taste of the recipe on the plate; a plate of your own has none here, what you search for and add is yours
  const recipeOn = Boolean(state.fromRecipe) || plateParts.length > 0 || items.some((i) => i.dish);
  const recipeTaste = recipeOn ? dishTaste([...items.map((i) => i.food.name), ...opts.map((o) => o.name), ...leftOut.flatMap((l) => l.items.map((i) => i.food.name))]) : null;
  const matches = q.trim() ? state.foods.filter((f) => (f.name + " " + f.brand).toLowerCase().includes(q.toLowerCase())).slice(0, 60) : [];
  const found = matches.filter((f) => goesInDish(recipeTaste, f.name));
  const heldBack = matches.filter((f) => !goesInDish(recipeTaste, f.name)).map((f) => f.name).slice(0, 3);
  const isEmptyPart = (part: string) => !items.some((i) => i.part === part) && !opts.some((o) => o.part === part) && !leftOut.some((l) => l.part === part) && emptyParts.some((x) => x.part === part);
  // + Add a food to a part: the next food put on the plate goes into it
  const [addTo, setAddTo] = useState<string | null>(null);
  const seenIds = useRef<Set<string>>(new Set(items.map((i) => i.id)));
  useEffect(() => {
    const fresh = items.filter((i) => !seenIds.current.has(i.id));
    seenIds.current = new Set(items.map((i) => i.id));
    if (!addTo || !fresh.length) return;
    const to = addTo, ids = new Set(fresh.map((i) => i.id)); setAddTo(null);
    setState((s) => ({ ...s, items: s.items.map((i) => (ids.has(i.id) ? { ...i, part: to } : i)), emptyParts: (s.emptyParts ?? []).filter((x) => x.part !== to) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);
  const addToPart = (part: string) => {
    setAddTo(part); notify(`Pick a food below. It goes into ${part}.`);
    const box = document.querySelector<HTMLInputElement>('input[aria-label="Search all my foods"]'); box?.scrollIntoView({ behavior: "smooth", block: "center" }); box?.focus({ preventScroll: true });
  };
  const PartChip = ({ value, onPick }: { value: string; onPick: (v: string) => void }) => {
    const all = [...new Set([...plateParts, ...newParts, ...(value ? [value] : [])])];
    return <select className="pt-chip pt-select" aria-label="Part" value={value} onChange={(e) => onPick(e.target.value)}><option value="">No part</option>{all.map((x) => <option key={x} value={x}>{x}</option>)}</select>;
  };
  const mealNeed = share && share.kcal >= 150 && p.kind !== "dessert" ? share.kcal : null;
  const unitOf = (m: Meal) => m.makes?.unit || "portions", oneOf = (m: Meal) => unitOf(m).replace(/s$/, "");
  const portionItems = (m: Meal, mode: "whole" | "sized" | "recipe"): Ingredient[] => {
    const whole = m.items.map((i) => ({ ...i, dish: undefined }));
    const list = mode === "whole" ? whole : mode === "sized" && mealNeed ? scaleTo(whole, mealNeed) : onePortion(whole, m.makes?.n ?? 1);
    return list.map((i) => ({ ...i, id: uid(), locked: false }));
  };
  // the recipe on the plate at a portion: its foods, its optional foods at the same share, no part left out (IM12, IM13)
  const factorOf = (m: Meal, mode: "whole" | "sized" | "recipe") => (mode === "whole" ? 1 : mode === "sized" && mealNeed && kcalOfItems(m.items) > 0 ? mealNeed / kcalOfItems(m.items) : 1 / (m.makes?.n ?? 1));
  const recipePlate = (m: Meal, mode: "whole" | "sized" | "recipe") => ({ items: portionItems(m, mode), optional: optAt(m.optional, factorOf(m, mode), uid), leftOut: undefined, emptyParts: undefined });
  // R15: a recipe starts whole, as mapped, unless the plate fills a meal of the Plan
  const modeFor = (m: Meal): "whole" | "sized" | "recipe" => (!p.filling && (m.makes?.n ?? 1) >= 2 ? "whole" : sizedFits(mealNeed, kcalOfItems(m.items) / (m.makes?.n ?? 1)) ? "sized" : "recipe");
  // IM13: a recipe that came in, opened from Recipes, gets the plate it had the first time
  useEffect(() => {
    const id = state.openRecipe; if (!id) return;
    const m = state.meals.find((x) => x.id === id);
    if (!m) { setState((s) => ({ ...s, openRecipe: undefined })); return; }
    const mode = modeFor(m);
    setPmode(mode); setWay(null); setPartsMode(false);
    setState((s) => ({ ...s, ...recipePlate(m, mode), title: m.title, portion: null, fromRecipe: m.id, openRecipe: undefined }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.openRecipe]);
  // + Add (IM12b): sized for the meal, the meal keeps its size and every food moves by the same factor; else it goes on top
  function addOpt(o: PlateOpt) {
    const next = [...items, optToItem(o)];
    const sized = imported && pmode === "sized" && mealNeed && !way;
    setState((s) => ({ ...s, items: sized ? scaleTo(next, mealNeed!) : next, optional: (s.optional ?? []).filter((x) => x.id !== o.id), portion: null }));
  }
  function leaveOpt(id: string) {
    const it = items.find((i) => i.id === id); if (!it) return;
    const rest = items.filter((i) => i.id !== id);
    const sized = imported && pmode === "sized" && mealNeed && !way;
    setState((s) => ({ ...s, items: sized ? scaleTo(rest, mealNeed!) : rest, optional: [...(s.optional ?? []), itemToOpt(it)], portion: null }));
  }
  // Leave it out and Put it back (IM16b): the whole part, with its numbers
  function leavePart(part: string) {
    if (!canLeaveOut(items, part)) return;
    const at = plateParts.indexOf(part);
    setState((s) => ({ ...s, items: s.items.filter((i) => i.part !== part), leftOut: [...(s.leftOut ?? []), { part, items: s.items.filter((i) => i.part === part), at }], portion: null }));
    log("parts", { how: "leave" });
  }
  function putBack(part: string) {
    const l = leftOut.find((x) => x.part === part); if (!l) return;
    const order = plateParts;
    const all = [...items, ...l.items].sort((a, b) => order.indexOf(a.part ?? "") - order.indexOf(b.part ?? ""));
    setState((s) => ({ ...s, items: all, leftOut: (s.leftOut ?? []).filter((x) => x.part !== part), portion: null }));
  }
  // Parts on your own plate (IM18): a food's part, a new part, optional on and off
  const setPartOf = (id: string, part: string) => setState((s) => ({ ...s, items: s.items.map((i) => (i.id === id ? { ...i, part: part || undefined } : i)), optional: (s.optional ?? []).map((o) => (o.id === id ? { ...o, part: part || undefined } : o)) }));
  function setOptional(id: string, on: boolean) {
    if (on) { const it = items.find((i) => i.id === id); if (!it) return; setState((s) => ({ ...s, items: s.items.filter((i) => i.id !== id), optional: [...(s.optional ?? []), itemToOpt({ ...it, food: leanFood(it.food) })], portion: null })); }
    else { const o = opts.find((x) => x.id === id); if (!o) return; setState((s) => ({ ...s, items: [...s.items, { ...optToItem(o), optional: undefined }], optional: (s.optional ?? []).filter((x) => x.id !== id), portion: null })); }
  }
  const habits = (() => {
    const n = new Map<string, number>();
    for (const fb of state.feedback.slice(0, 40)) for (const i of fb.meal?.items ?? []) n.set(i.food.name, (n.get(i.food.name) ?? 0) + 1);
    for (const f of state.foods) if (f.favorite) n.set(f.name, (n.get(f.name) ?? 0) + 3);
    return [...n.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k]) => k);
  })();
  const libFood = (a: { name: string; calories: number; protein: number; fats?: number | null; carbs?: number | null }) => state.foods.find((f) => f.name.toLowerCase() === a.name.toLowerCase()) ?? estimate(a);
  async function addShots(files: FileList | null, base: string[] = []) {
    const list = Array.from(files ?? []).slice(0, MAX_SHOTS - base.length);
    if (!list.length) return;
    const read = await Promise.all(list.map(async (f) => { const raw = await readFile(f); return resizeImageBase64(raw, 1600, 1600).catch(() => raw); }));
    setInFlow({ kind: "shots", shots: [...base, ...read].slice(0, MAX_SHOTS) });
  }
  // a slow read (0.2.23, IM23d): after 20 seconds the card says it takes longer
  const [slowRead, setSlowRead] = useState(false);
  async function readIn(from: { shots: string[] } | { url: string }) {
    const shots = "shots" in from ? from.shots : [], url = "url" in from ? from.url.trim() : "";
    setInFlow("shots" in from ? { kind: "shots", shots, reading: true } : { kind: "link", url, reading: true });
    setSlowRead(false);
    const slow = setTimeout(() => setSlowRead(true), 20000);
    try {
      const res = await fetch("/api/recipe/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...(shots.length ? { images: shots } : { url }), kitchens: p.personal.kitchens ?? [], region: p.region }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `${CHEF_NAME} could not read it.`);
      if (data.error) { log("recipe_in", { how: shots.length ? "shot" : "link", result: String(data.error) }); setInFlow({ kind: "error", code: data.error, message: data.message || "", back: shots.length ? "shots" : "link", shots, url }); return; }
      log("recipe_in", { how: shots.length ? "shot" : "link", result: "read" });
      const got = data.recipe as ReadRecipe;
      // the oil rule again on the phone (R3, 0.2.38): the same result on an answer already capped, so it never counts twice
      const stepsGot = cleanSteps(got.steps ?? []);
      setInFlow({ kind: "read", recipe: { ...got, items: capOil((got.items ?? []).map(countItem), stepsGot), steps: stepsGot }, shots, url: data.url, note: data.note });
    } catch (e: any) { setInFlow(shots.length ? { kind: "shots", shots } : { kind: "link", url }); setError(e.message); }
    finally { clearTimeout(slow); setSlowRead(false); }
  }
  // IM3 → IM4: the recipe is saved in Mine with where it came from; your portion goes on the plate
  async function putRead(f: Extract<InFlow, { kind: "read" }>) {
    const r = f.recipe;
    const fresh: Food[] = [];
    const whole: Ingredient[] = r.items.filter((i) => i.on ?? !i.optional).map((i) => {
      let food = state.foods.find((x) => x.name.toLowerCase() === i.name.toLowerCase()) ?? fresh.find((x) => x.name.toLowerCase() === i.name.toLowerCase());
      if (!food) { food = { ...estimate(i), notes: `${CHEF_NAME}'s estimate, from a recipe` }; fresh.push(food); }
      return { id: uid(), food, grams: i.grams, locked: true, role: i.role, ...(i.part ? { part: i.part } : {}), ...(i.count ? { count: i.count } : {}), ...(i.fry ? { fry: i.fry } : {}) };
    });
    const thumbs = await Promise.all(f.shots.map((x) => resizeImageBase64(x, 900, 900).catch(() => x)));
    const total = whole.reduce((n, i) => n + i.grams, 0);
    // IM8: an optional food not added stays with the recipe, in its own list, out of the numbers
    const optional = r.items.filter((i) => i.optional && !(i.on ?? false)).map((i) => ({ name: i.name, written: i.written, ...(i.note ? { note: i.note } : {}), grams: i.grams, ...(i.part ? { part: i.part } : {}),
      food: leanFood(state.foods.find((x) => x.name.toLowerCase() === i.name.toLowerCase()) ?? { ...estimate(i), notes: `${CHEF_NAME}'s estimate, from a recipe` }) }));
    const meal: Meal = { id: uid(), title: r.title, items: whole, portion: Math.round(total / r.servings), savedAt: new Date().toISOString(), steps: [],
      source: { name: r.source, ...(f.url ? { url: f.url } : {}), from: f.url ? "link" : "screenshot", at: new Date().toISOString(), ...(r.steps?.length ? { steps: r.steps } : {}), foods: foodNames(whole) }, ...(thumbs.length ? { shots: thumbs } : {}), makes: { n: r.servings, unit: r.servingsUnit }, ...(optional.length ? { optional } : {}), ...(r.stated ? { stated: r.stated } : {}) };
    const mode: "whole" | "sized" | "recipe" = !p.filling && r.servings >= 2 ? "whole" : sizedFits(mealNeed, kcalOfItems(whole) / r.servings) ? "sized" : "recipe";
    setPmode(mode); setWay(null); setPartsMode(false);
    setState((s) => ({ ...s, foods: [...s.foods, ...fresh], meals: [meal, ...s.meals], ...recipePlate(meal, mode), title: meal.title, portion: null, fromRecipe: meal.id }));
    setInFlow(null);
    log("recipe_in", { how: f.url ? "link" : "shot", result: "plate" });
    notify(`${meal.title} is on your plate, and saved in Mine.`);
  }
  function setPortionMode(mode: "whole" | "sized" | "recipe") {
    if (!rec) return;
    setPmode(mode); setWay(null);
    setState((s) => ({ ...s, ...recipePlate(rec, mode), title: rec.title, portion: null }));
  }
  function backToOriginal() {
    if (way?.kind === "change" && way.before) { const before = way.before; setWay(null); setState((s) => ({ ...s, items: before, portion: null })); return; }
    if (!rec) return;
    setWay(null);
    setState((s) => ({ ...s, ...recipePlate(rec, pmode), title: rec.title, portion: null }));
  }
  // IM16: Chef Mealan changes one part; code keeps every other food as it was, and checks the PD, real portions and allergies
  async function changePart(part: string, failed?: string) {
    if (pdRef === null || way) return;
    setWayBusy(part);
    try {
      const before = items;
      const res = await fetch("/api/recipe/fit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ way: "change", part, title: state.title || autoTitle(items), servings: 1, need: kcalOfItems(items), target: pdRef,
        items: items.map((i) => ({ name: i.food.name, grams: i.grams, calories: i.food.calories, protein: i.food.protein, role: i.role ?? "other", part: i.part ?? "" })), kitchens: p.personal.kitchens ?? [], taste: tasteForChef(p.personal), habits, failed }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || `${CHEF_NAME} could not answer.`);
      let why: string | null = d.failed ?? null, out: Ingredient[] = [];
      if (!why) {
        out = (d.items as any[]).map((x) => {
          const was = items.find((i) => i.food.name.toLowerCase() === String(x.name).toLowerCase());
          return was && was.part !== part ? was : { id: was?.id ?? uid(), food: libFood(x), grams: roundGrams(Number(x.grams) || 0), locked: false, role: x.role, part };
        });
        const pd0 = pdOf(items), pd1 = pdOf(out);
        if (pd1 === null || pd0 === null || pd1 < pd0 + 0.05) why = `It reaches PD ${pd1?.toFixed(1) ?? "?"}, no better than ${pd0?.toFixed(1) ?? "?"}.`;
        else if (!realPortions(out)) why = "One of the foods is not a real portion at this size.";
        else if (out.some((i) => blockedByAllergy(i.food, p.safety.allergies ?? []))) why = "It has a food with one of their allergies.";
      }
      if (why) { if (!failed) return changePart(part, why); log("recipe_fit", { way: "change", result: "failed" }); notify(`${CHEF_NAME}'s change to the ${part.toLowerCase()} didn't pass the checks: ${why}`); return; }
      const fresh = out.map((i) => i.food).filter((f) => !state.foods.some((x) => x.id === f.id));
      setState((s) => ({ ...s, foods: [...s.foods, ...fresh.filter((f, k) => fresh.findIndex((x) => x.id === f.id) === k)], items: out, portion: null }));
      // the whole recipe as changed: the other parts as the recipe makes them, the changed part back at the recipe's size
      const f = rec ? factorOf(rec, pmode) : 0;
      const twin = rec ? pairItems(out, rec.items) : [];
      const whole = rec && f > 0 ? out.map((i, k) => { const r = i.part !== part ? twin[k] : undefined; return { ...i, grams: r ? r.grams : Math.round(i.grams / f) }; }) : undefined;
      setWay({ kind: "change", title: state.title || autoTitle(items), notes: (d.notes ?? []) as string[], part, before, ...(whole ? { whole } : {}) });
      log("recipe_fit", { way: "change", result: "shown" }); log("parts", { how: "change" });
    } catch (e: any) { setError(e.message); } finally { setWayBusy(null); }
  }
  const fitBody = (m: Meal, w: "change" | "side", failed?: string) => JSON.stringify({ way: w, title: m.title, servings: m.makes?.n ?? 1, need: mealNeed ?? kcalOfItems(portionItems(m, "recipe")), target: pdRef,
    items: m.items.map((i) => ({ name: i.food.name, grams: i.grams, calories: i.food.calories, protein: i.food.protein, role: i.role ?? "other", part: i.part ?? "" })), kitchens: p.personal.kitchens ?? [], taste: tasteForChef(p.personal), habits, failed });
  // IM5: Chef Mealan changes the dish; code checks the roles, the portion, the PD and allergies, and sends a failed try back once
  // R10 (0.2.36, board RS6): Change the recipe has a limit. After 20 seconds the slow line and Stop; at one minute in all it
  // stops by itself; the second round is asked only while there is time for it. The plate stays as it was.
  async function changeDish(failed?: string, deadline = Date.now() + 60_000) {
    if (!rec || pdRef === null) return;
    setWayBusy("change");
    const ac = new AbortController(); wayStop.current = ac;
    const slowAt = window.setTimeout(() => setWaySlow(true), Math.max(0, deadline - 40_000 - Date.now()));
    const endAt = window.setTimeout(() => { wayStopWhy.current = "time"; ac.abort(); }, Math.max(0, deadline - Date.now()));
    let again = false;
    try {
      const res = await fetch("/api/recipe/fit", { method: "POST", headers: { "Content-Type": "application/json" }, body: fitBody(rec, "change", failed), signal: ac.signal });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || `${CHEF_NAME} could not answer.`);
      let why: string | null = d.failed ?? null, out: Ingredient[] = [], wholeNow: Ingredient[] = [];
      if (!why) {
        // the change answers for the whole recipe; each food keeps its part (a swap the part of the food it replaces)
        const partOf = (i: any): string | undefined => i.part || rec.items.find((r) => r.food.name.toLowerCase() === String(i.name).toLowerCase() || (i.was && r.food.name.toLowerCase() === String(i.was).toLowerCase()))?.part;
        const whole: Ingredient[] = (d.items as any[]).map((i) => { const pt = partOf(i); const was = rec.items.find((r) => r.food.name.toLowerCase() === String(i.name).toLowerCase()); return { id: uid(), food: libFood(i), grams: Math.round(Number(i.grams) || 0), locked: false, role: i.role, ...(pt ? { part: pt } : {}), ...(was?.count ? { count: was.count } : {}) }; });
        wholeNow = whole;
        out = scaleTo(whole, mealNeed ?? kcalOfItems(portionItems(rec, "recipe")));
        const pd1 = pdOf(out);
        if (pd1 === null || pd1 < pdRef - 0.05) why = `It reaches PD ${pd1?.toFixed(1) ?? "?"}, under the target ${pdRef.toFixed(1)}.`;
        else if (!realPortions(out)) why = "One of the foods is not a real portion at this size.";
        else if (out.some((i) => blockedByAllergy(i.food, p.safety.allergies ?? []))) why = "It has a food with one of their allergies.";
      }
      if (why) { if (!failed && deadline - Date.now() > 15_000) { again = true; window.clearTimeout(slowAt); window.clearTimeout(endAt); return changeDish(why, deadline); } log("recipe_fit", { way: "change", result: "failed" }); notify(`${CHEF_NAME}'s change didn't pass the checks: ${why} Try Add on the side.`); return; }
      const fresh = out.map((i) => i.food).filter((f) => !state.foods.some((x) => x.id === f.id));
      const title = String(d.title || `${rec.title}, more protein`);
      setState((s) => ({ ...s, foods: [...s.foods, ...fresh.filter((f, k) => fresh.findIndex((x) => x.id === f.id) === k)], items: out, title, portion: null }));
      setWay({ kind: "change", title, notes: (d.notes ?? []) as string[], whole: wholeNow });
      log("recipe_fit", { way: "change", result: "shown" });
    } catch (e: any) {
      if (e?.name === "AbortError") notify(wayStopWhy.current === "time" ? `${CHEF_NAME} took too long, so nothing changed. Try again, or Add on the side.` : "Stopped. Nothing changed. Try again, or Add on the side.");
      else setError(e.message);
    } finally { if (!again) { window.clearTimeout(slowAt); window.clearTimeout(endAt); setWayBusy(null); setWaySlow(false); wayStop.current = null; wayStopWhy.current = null; } }
  }
  // IM5b: the dish as it is, a little smaller, and a side that brings the protein; your way first
  async function addSide() {
    if (!rec || pdRef === null) return;
    setWayBusy("side");
    try {
      const res = await fetch("/api/recipe/fit", { method: "POST", headers: { "Content-Type": "application/json" }, body: fitBody(rec, "side") });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || `${CHEF_NAME} could not answer.`);
      const need = mealNeed ?? kcalOfItems(portionItems(rec, "recipe"));
      const whole = rec.items.map((i) => ({ ...i, dish: undefined }));
      const opts: SideOpt[] = [];
      for (const sd of (d.sides ?? []) as { name: string; kind: SideKind; calories: number; protein: number; fats: number | null; carbs: number | null; note: string }[]) {
        const food = libFood(sd);
        if (blockedByAllergy(food, p.safety.allergies ?? [])) continue;
        // R9 (0.2.33): a side Chef Mealan names goes with the dish, by the same rule as every offer
        if (!goesInDish(dishTaste(whole.map((i) => i.food.name)), sd.name)) continue;
        const fit = sideAmount(whole, food, need, pdRef);
        if (!fit) continue;
        opts.push({ name: sd.name, kind: sd.kind, note: sd.note, food, grams: fit.grams, dish: fit.dish.map((i) => ({ ...i, id: uid(), locked: false })), yours: isYours(sd.name, habits) });
      }
      const sorted = [...opts.filter((o) => o.yours), ...opts.filter((o) => !o.yours)].slice(0, 4);
      if (!sorted.length) { log("recipe_fit", { way: "side", result: "failed" }); notify(`None of ${CHEF_NAME}'s sides brings this dish to your target at a normal amount. Try Change the recipe.`); return; }
      pickSide({ kind: "side", options: sorted, pick: 0 }, 0);
      log("recipe_fit", { way: "side", result: "shown" });
    } catch (e: any) { setError(e.message); } finally { setWayBusy(null); }
  }
  function pickSide(w: Extract<Way, { kind: "side" }>, k: number) {
    const o = w.options[k];
    const fresh = state.foods.some((x) => x.id === o.food.id) ? [] : [o.food];
    setState((s) => ({ ...s, foods: [...s.foods, ...fresh.filter((f) => !s.foods.some((x) => x.id === f.id))], items: [...o.dish, { id: uid(), food: o.food, grams: o.grams, locked: false }], title: rec?.title ?? s.title, portion: null }));
    setWay({ ...w, pick: k });
  }
  const wayWhat = (w: Way | null) => (!w ? "" : w.kind === "change" ? (w.part ? `${w.part}, changed` : w.title) : `${w.options[w.pick].name} ${sideWord(w.options[w.pick].kind)}`);
  const triedNote = (w: Way | null) => {
    const t = w && rec?.tried?.find((x) => x.kind === w.kind && x.what === wayWhat(w));
    return !t ? "Not cooked yet" : t.result === "yes" ? "You cooked it: it worked" : t.result === "ok" ? "You cooked it: it was OK" : "You cooked it: it didn't work";
  };
  // the button: the quick fit when maths does it, Chef Mealan when it cannot (Milan, 15 October 2026, 22:43)
  function makeAMeal() {
    if (!chefable || !share) return askMealan();
    const t = aggregate(items), pd0 = density(t.protein, t.calories);
    const mover = moverOf(items);
    let fit: { ok: boolean; kcal: number } | null = null;
    if (mover && pdRef !== null) {
      const sol = solveIngredient(items.map((i) => (i.id === mover.id ? i : { ...i, locked: true })), mover.id, pdRef, null);
      fit = sol.ok ? { ok: sol.grams >= minPortionOf(mover.food) && sol.grams <= (cap ?? 300), kcal: aggregate(sol.items).calories ?? 0 } : { ok: false, kcal: 0 };
    }
    if (routeOf({ pd: pd0, target: pdRef, kcal: t.calories ?? 0, need: share.kcal, fit }) === "fit") return askMealan();
    if (!p.ai.on) { notify(`${CHEF_NAME}'s ideas need the AI, which is off for your account. Here is the quick fit.`); return askMealan(); }
    log("fit_used");
    void askChef(items, []);
  }
  async function askChef(base: Ingredient[], avoid: string[], failedIn: { title: string; why: string }[] = [], kept: MealOption[] = []) {
    if (!share) return;
    setChef({ status: "working" });
    try {
      const res = await fetch("/api/meal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        plate: base.map((i) => ({ name: i.food.name, grams: i.grams, calories: i.food.calories, protein: i.food.protein })), meal: mealWord, need: share.kcal, target: pdRef,
        kitchens: p.personal.kitchens ?? [], taste: tasteForChef(p.personal), library: state.foods.slice(0, 40).map((f) => ({ name: f.name, calories: f.calories, protein: f.protein })), region: p.region, avoid: [...avoid, ...kept.map((k) => k.title)], failed: failedIn }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `${CHEF_NAME} could not answer.`);
      const good = [...kept], failed: { title: string; why: string }[] = [];
      for (const o of (data.options ?? []) as { kitchen: string; title: string; why: string; adds: { name: string; grams: number; calories: number; protein: number; base: boolean }[] }[]) {
        if (good.length >= 3 || good.some((g) => g.title.toLowerCase() === o.title.toLowerCase())) continue;
        const adds: Add[] = o.adds.map((a) => { const lib = state.foods.find((f) => f.name.toLowerCase() === a.name.toLowerCase()); return { food: lib ?? estimate(a), grams: a.grams, base: a.base, have: !!lib }; });
        const sol = solveMeal(base, adds, share.kcal, pdRef, (f) => blockedByAllergy(f, p.safety.allergies ?? []), uid);
        if (sol.ok) good.push({ kitchen: o.kitchen, title: o.title, why: o.why, adds: adds.map((a) => ({ name: a.food.name, grams: a.base || (!adds.some((x) => x.base) && sol.items.find((i) => !i.locked)?.food === a.food) ? sol.baseGrams : Math.round(a.grams), have: a.have, base: a.base })), items: sol.items, kcal: sol.kcal, pd: sol.pd });
        else failed.push({ title: o.title, why: (sol as { why: string }).why });
      }
      // an idea that fails the checks goes back once, with the reason; a second miss is left out
      if (good.length < 2 && failed.length && !failedIn.length) return askChef(base, avoid, failed, good);
      setChef(good.length ? { status: "done", options: good, tried: [...avoid, ...good.map((g) => g.title)] } : { status: "none", tried: [...avoid, ...failed.map((f) => f.title)] });
    } catch (e: any) { setChef(null); notify(`${e.message} Here is the quick fit.`); askMealan(); }
  }
  function putOnPlate(o: MealOption) {
    const from = items, baseName = o.adds.find((a) => a.base)?.name ?? o.adds[0]?.name ?? "";
    setState((s) => ({ ...s, items: o.items, title: o.title, portion: null }));
    setMadeBy({ kitchen: o.kitchen, base: baseName, from, tried: chef && chef.status !== "working" ? chef.tried : [] }); setChef(null);
  }
  function keepAsIs() { setChef(null); if (p.filling?.mode !== "eat" && p.filling) putInSlot(items); else { setState((s) => ({ ...s, portion: null, title: s.title || "DaaM" })); setMethod(null); setStep("make"); } }
  const Head = ({ title, sub, name }: { title: string; sub?: string; name?: boolean }) => stepHead({ n, title, sub, nameField: name ? { value: state.title === "DaaM" ? "" : state.title, placeholder: items.length ? autoTitle(items) : "Name the meal", onChange: (v: string) => setState((s) => ({ ...s, title: v })), onCommit: (v: string) => p.renamePlate(v) } : undefined });
  const Back = ({ to }: { to: typeof STEPS[number] }) => (
    <button className="link back" onClick={() => setStep(to)}><ArrowLeft size={15} /> Back</button>
  );

  if (step === "in" && chef) {
    const t = aggregate(items), pd0 = density(t.protein, t.calories), kit = (p.personal.kitchens ?? []).length > 0;
    const opts = chef.status === "done" ? chef.options : [];
    const lead = chef.status === "working" ? `${CHEF_NAME} is putting it together.`
      : chef.status === "none" ? `${CHEF_NAME}'s ideas didn't pass the checks this time. Ask for other ideas, or keep the plate as it is.`
      : `${pd0 !== null && pdRef !== null && pd0 >= pdRef ? `Your plate has the protein: ${fmt(t.protein, 0)} g, ${pdText(pd0)}.` : `Your plate is at ${pdText(pd0)}, under your ${pdVal(pdRef)}.`} ${Meal} is about ${fmt(share?.kcal ?? null, 0)} kcal${(t.calories ?? 0) < (share?.kcal ?? 0) ? `, ${fmt((share?.kcal ?? 0) - (t.calories ?? 0), 0)} more than the plate` : ""}. ${opts.length === 3 ? "Three" : opts.length === 2 ? "Two" : "One"} ${opts.length === 1 ? "way" : "ways"}${kit ? " from your kitchens" : ""}.`;
    const chip = (a: MealOption["adds"][number]) => <span key={a.name} className={`mm-add ${a.have ? "have" : ""}`}>+ {fmt(a.grams, 0)} g {a.name.toLowerCase()}</span>;
    return (
      <>
        {stepHead({ n: 2, title: `Make it a ${mealWord}`, sub: lead })}
        <small className="mm-stays">On the plate: {items.map((i) => `${i.food.name.toLowerCase()} ${fmt(i.grams, 0)} g`).join(", ")}. {items.length === 1 ? "It stays." : "They stay."}</small>
        {chef.status === "working" && <div className="bubble mealan thinking mm-working"><span /><span /><span /></div>}
        {opts.map((o) => (
          <section className="card mm-card" key={o.title}>
            <div className="mm-top"><small className="mm-kitchen">{o.kitchen.toUpperCase()}</small><small className="mm-nums">{fmt(o.kcal, 0)} kcal · {pdText(o.pd)}</small></div>
            <b className="mm-title">{o.title}</b>
            <div className="mm-adds">{o.adds.map(chip)}</div>
            <small className="mm-why">{o.why}</small>
            <button className="pill pill-small pill-primary" style={{ alignSelf: "flex-start" }} onClick={() => putOnPlate(o)}>Put it on the plate</button>
          </section>
        ))}
        {opts.length > 0 && <small className="mm-legend"><span className="mm-add have">+ in your foods</span><span className="mm-add">+ new</span> new foods are {CHEF_NAME}'s estimate; the app sets every gram.</small>}
        {chef.status !== "working" && <div className="button-row"><button className="pill pill-small" onClick={() => askChef(items, chef.tried)}>Other ideas</button><button className="pill pill-small" onClick={keepAsIs}>Keep it as it is</button></div>}
        <button className="link back" onClick={() => setChef(null)}><ArrowLeft size={15} /> Back</button>
      </>
    );
  }
  if (step === "in")
    return (
      <>
        {/* the name as the title: for a slot, or for a recipe opened from Recipes (0.2.3); an empty plate asks what you are craving */}
        {p.filling
          ? Head({ name: true, title: "", sub: p.filling.mode === "eat" ? "As planned. Change what you like, then Fit to my target or Keep it as it is." : "Name it, or keep the foods' name. Add your foods, fit them to your target, or make them as they are." })
          : madeBy && items.length > 0
            ? Head({ name: true, title: "", sub: `${CHEF_NAME}'s ${madeBy.kitchen} ${mealWord}. Your foods as you had them; the ${madeBy.base.toLowerCase()} sets the energy. Change any amount you like.` })
          : imported && rec
            ? Head({ name: true, title: "", sub: way?.kind === "change" ? `Your ${rec.title}, changed. Still sized for your ${mealWord}.`
              : way?.kind === "side" ? `Your ${rec.title} as it is, ${Math.round((kcalOfItems(way.options[way.pick].dish) / Math.max(1, kcalOfItems(rec.items) / (rec.makes?.n ?? 1))) * 100)}% of one ${oneOf(rec)}, and ${way.options[way.pick].name} ${sideWord(way.options[way.pick].kind)}. The ${oneOf(rec)} is not changed.`
              : `From ${rec.source?.name || (rec.source?.from === "link" ? "the link" : "your screenshot")}. ${pmode === "whole" ? "The whole recipe, as you mapped it." : pmode === "sized" && mealNeed ? `The recipe's mix, sized for your ${mealWord}: every food scaled the same way.` : `One ${oneOf(rec)}, as the recipe makes it.`} Change what you like.` })
          : state.title && state.title !== "DaaM" && items.length > 0
            ? Head({ name: true, title: "", sub: `From My recipes. Change what you like, then ${chefable ? `Make it a ${mealWord}` : "Fit to my target"} or Keep it as it is.` })
            : Head({ title: "What are you craving?", sub: `Add your foods. ${CHEF_NAME} sets the amounts.` })}
        {/* the plan line (0.2.0, canvas S): one line says what the plate is; the kind and the moment sit behind its pencil, never asked first.
            A planned meal (0.2.2) says Lunch, 12:30 · By the plan; until then every plate is off the plan. */}
        {/* R11: a tap anywhere on the line opens its section; the pencil (or Done) stays the button for keyboards and readers */}
        <div className="plan-line" onClick={() => setLineOpen((v) => !v)}>
          <span>{p.filling ? (p.filling.mode === "eat" ? `${p.filling.name}, ${p.filling.time} · By the plan` : `${p.filling.dayName === "today" ? "Today" : p.filling.dayName}'s ${p.filling.name.toLowerCase()}, ${p.filling.time} · By the plan`) + (items.some((i) => i.dish) ? " · A dish" : "") : lineNow}</span>
          {lineOpen
            ? <button className="link plan-line-done" onClick={(e) => { e.stopPropagation(); setLineOpen(false); }}>Done</button>
            : <button className="icon plan-line-pen" aria-label="Change what this plate is" aria-expanded={lineOpen} onClick={(e) => { e.stopPropagation(); setLineOpen(true); }}><Pencil size={16} /></button>}
        </div>
        {lineOpen && (<>
        {/* R11 (0.2.37, board RS8): What is it for: Exploring, the day's meals, a snack off the plan; a meal from the Plan keeps its own slot */}
        {!p.filling && <>
          <p className="label">What is it for?</p>
          <div className="moments for-row" role="radiogroup" aria-label="What the plate is for">
            <button className={`choice ${forKey === "exploring" ? "on" : ""}`} aria-pressed={forKey === "exploring"} onClick={() => p.setPick("exploring")}>Exploring</button>
            {daySlots.map((x) => <button key={x.id} className={`choice ${forKey === `meal:${x.id}` ? "on" : ""}`} aria-pressed={forKey === `meal:${x.id}`} onClick={() => p.setPick(`meal:${x.id}`)}>{capName(x.name)}</button>)}
            {!daySlots.some((x) => /snack/i.test(x.name)) && <button className={`choice ${forKey === "snack" ? "on" : ""}`} aria-pressed={forKey === "snack"} onClick={() => p.setPick("snack")}>Snack</button>}
          </div>
          <p className="small for-hint">{forHint}</p>
        </>}
        <div className="moments kind-row" role="radiogroup" aria-label="Kind of plate">
          <button className={`choice ${p.kind === "meal" ? "on" : ""}`} aria-pressed={p.kind === "meal"} onClick={() => p.setKind("meal")}>Meal</button>
          <button className={`choice ${p.kind === "dessert" ? "on" : ""}`} aria-pressed={p.kind === "dessert"} onClick={() => p.setKind("dessert")}>Dessert</button>
        </div>
        <p className="label">What kind of moment?</p>
        <div className="moments">
          {orderMoments(p.usual).map((m) => (
            <button key={m.id} className={`choice ${p.moment === m.id ? "on" : ""} ${m.planned ? "" : "pill-unplanned"}`} onClick={() => p.setMoment(m.id)}>{m.name}</button>
          ))}
        </div>
        <p className="small moment-hint">{momentOf(p.moment).hint}{p.moment !== "regular" && pdRef !== null ? ` Target for this plate: ${pdText(pdRef)}.` : ""}</p>
        </>)}
        {lineOpen && p.moment === "travel" && (
          <>
            <p className="label">Where to?</p>
            <div className="moments">
              {REGIONS.filter((r) => r.id !== p.region).map((r) => (
                <button key={r.id} className={`choice ${p.travelTo === r.id ? "on" : ""}`} onClick={() => p.setTravelTo(p.travelTo === r.id ? null : r.id)}>{r.name}</button>
              ))}
            </div>
            <p className="small moment-hint">{p.travelTo ? `${CHEF_NAME} plans with what's sold in ${REGIONS.find((r) => r.id === p.travelTo)?.name}. Use the chat to shop and cook there.` : "Pick the place and Chef Mealan plans with its shelves."}</p>
          </>
        )}
        {/* On the plate (Y1 columns 2 and 2b, 10 October 2026): the plate is a card of its own, with Fit to my target as its action */}
        {inFlow ? (inFlow.kind === "shots" ? <ShotsCard shots={inFlow.shots} reading={inFlow.reading} slow={slowRead} add={(f) => void addShots(f, inFlow.shots)} remove={(n) => setInFlow({ kind: "shots", shots: inFlow.shots.filter((_, k) => k !== n) })} read={() => void readIn({ shots: inFlow.shots })} cancel={() => setInFlow(null)} />
          : inFlow.kind === "link" ? <LinkCard url={inFlow.url} reading={inFlow.reading} slow={slowRead} setUrl={(v) => setInFlow({ kind: "link", url: v })} read={() => void readIn({ url: inFlow.url })} cancel={() => setInFlow(null)} />
          : inFlow.kind === "read" ? <ReadCard flow={inFlow} setSource={(v) => setInFlow({ ...inFlow, recipe: { ...inFlow.recipe, source: v } })} setServings={(n) => setInFlow({ ...inFlow, recipe: { ...inFlow.recipe, servings: n, servingsHow: inFlow.recipe.servingsHow } })} toggle={(k) => setInFlow({ ...inFlow, recipe: { ...inFlow.recipe, items: inFlow.recipe.items.map((x, j) => (j === k ? { ...x, on: !(x.on ?? !x.optional) } : x)) } })} put={() => void putRead(inFlow)} again={() => void readIn(inFlow.url ? { url: inFlow.url } : { shots: inFlow.shots })} cancel={() => setInFlow(null)} />
          : <ErrorCard flow={inFlow} next={(to) => setInFlow(to === "link" ? { kind: "link", url: inFlow.url } : { kind: "shots", shots: inFlow.code === "not-recipe" ? [] : inFlow.shots })} cancel={() => setInFlow(null)} />) : (
        <section className="card plate-card">
        <div className="card-top"><span>On the plate</span>{items.length > 0 && <ConfirmButton className="link plate-empty-link" label={<><Trash2 size={14} /> Empty plate</>} confirmLabel="Tap again to empty" onConfirm={emptyPlate} />}</div>
        {items.length === 0 && <small className="plate-empty">Nothing on the plate yet.</small>}
        {imported && rec && !way && rec.makes && (
          <div className="in-portion">
            <div className="moments">
              {/* R15 (0.2.41, board RS12): the whole recipe first, as mapped; then what you eat */}
              {rec.makes.n >= 2 && <button className={`choice ${pmode === "whole" ? "on" : ""}`} onClick={() => setPortionMode("whole")}>The whole recipe</button>}
              {mealNeed && <button className={`choice ${pmode === "sized" ? "on" : ""}`} onClick={() => setPortionMode("sized")}>Sized for your {mealWord}</button>}
              <button className={`choice ${pmode === "recipe" ? "on" : ""}`} onClick={() => setPortionMode("recipe")}>One {oneOf(rec)}, as the recipe makes it</button>
            </div>
            {/* R12 (0.2.38): no recipe numbers here; the whole recipe is chosen on How to make it */}
            {rec.makes.n >= 2 && pmode !== "whole" && <small className="muted in-next">Next, on How to make it: the whole recipe, or just your plate.</small>}
            {(() => { const one = kcalOfItems(portionItems(rec, "recipe")), pct = Math.round((kcalOfItems(portionItems(rec, "sized")) / Math.max(1, one)) * 100);
              // R15: one portion's kcal is the plate's own, so the line and the card give one number
              return <small className="muted">{pmode === "whole" ? `The whole recipe, as you mapped it: ${countOf(rec.makes!.n, unitOf(rec))}. ` : ""}One {oneOf(rec)} is {fmt(one, 0)} kcal.{mealNeed ? ` Your ${mealWord} is about ${fmt(mealNeed, 0)}. Sized for it${sizedFits(mealNeed, one) ? `: ${pct}% of one ${oneOf(rec)}.` : ` would be ${pct}% of one ${oneOf(rec)}, so one ${oneOf(rec)}, as the recipe makes it, is the better pick.`}` : ""}{pmode === "whole" ? " Pick what you eat." : ""}</small>; })()}
          </div>
        )}
        {imported && way?.kind === "change" && !way.part && (
          <div className="in-way">
            {way.notes.map((n, k) => <small key={k}>{n}</small>)}
            <span className="in-cooked">{triedNote(way)}</span>
          </div>
        )}
        {imported && way?.kind === "side" && (
          <div className="in-way">
            <small className="in-strong">On the side</small>
            <div className="moments">{way.options.map((o, k) => <button key={o.name + k} className={`choice ${way.pick === k ? "on" : ""}`} onClick={() => pickSide(way, k)}>{o.name} {sideWord(o.kind)}{way.pick === k ? `, ${o.grams} g` : ""}{o.yours ? " · your way" : ""}</button>)}</div>
            <small className="muted">{way.options[way.pick].note}{way.options[way.pick].yours ? " Your way: you've had it with your meals before." : ""}</small>
            <span className="in-cooked">{triedNote(way)}</span>
          </div>
        )}
        {items.length > 0 && (
          <section className={`readout readout-fit-${p.fitPd(pd)}`}>
            <div className="readout-top"><span>{imported && pmode === "whole" && !way && (rec?.makes?.n ?? 1) >= 2 ? "The whole recipe" : madeBy || (imported && mealNeed) ? `This ${mealWord}` : "As it stands"}</span><span>{pdTag()}</span></div>
            <div className="readout-mid">
              <b>{pdVal(pd)}</b>
              <div><span>{pd !== null && pdRef !== null ? (pd >= pdRef ? "fits your plan" : `${fixed(pdRef - pd)} under your ${fixed(pdRef)}`) : "no target set"}</span><small>{fmt(t.calories, 0)} kcal · {fmt(t.protein)} g protein · {fmt(t.weight, 0)} g</small></div>
            </div>
            {extras(items)}
          </section>
        )}
        {items.length === 0 && <small className="ways-label">Add a food</small>}
        <div className="ways">
          {/* RP5b (0.2.25, Milan 17:42): Manual on the left, Scan on the right, where the thumb is */}
          <button className="pill pill-small" onClick={() => blank()}><Pencil size={15} /> Manual</button>
          <button className="pill pill-small" onClick={() => { setMode("label"); setCamera(true); }}><Camera size={15} /> Scan</button>
        </div>
        {/* Start from a recipe (0.2.16, board IM, IM1): only on an empty plate, because a recipe fills the plate */}
        {items.length === 0 && <>
          <small className="ways-label">Start from a recipe</small>
          <div className="ways">
            <label className="pill pill-small"><ImageIcon size={15} /> Screenshot<input type="file" accept="image/*" multiple hidden onChange={(e) => { void addShots(e.target.files); e.target.value = ""; }} /></label>
            <button className="pill pill-small" onClick={() => setInFlow({ kind: "link", url: "" })}><LinkIcon size={15} /> Link</button>
          </div>
        </>}
        {items.length + opts.length > 0 && (() => {
          // the plate's rows (0.2.19): in the dish's parts when it has them (IM15, IM18b), optional foods inside their part
          const itemRow = (i: Ingredient) => (
              <Fragment key={i.id}>
              <SwipeRow onRemove={() => remove(i.id)} onSwap={() => setSwapId(i.id)}>
              <div className="row">
                <button className={`dot ${i.locked ? "dot-locked" : "dot-free"}`} aria-label={`${i.locked ? "Unlock" : "Lock"} ${i.food.name}`}
                  onClick={() => { log("lock", { locked: !i.locked }); updateItem(i.id, { locked: !i.locked }); }} />
                <span className="thumb">{i.food.photo ? <img src={i.food.photo} alt="" /> : (i.food.icon || iconFor(i.food.name))}</span>
                <div className="row-text">
                  <button className="name-link" onClick={() => setCardId(i.id)}>{i.food.name}</button>
                  {partsMode ? <small className="pt-chips"><PartChip value={i.part ?? ""} onPick={(v) => setPartOf(i.id, v)} /> <button type="button" className="pt-chip off" aria-pressed={false} onClick={() => setOptional(i.id, true)}>Optional</button></small>
                    : i.optional ? <small className="pt-wrap">optional, added · <button className="link pt-inline" onClick={() => leaveOpt(i.id)}>Leave it out</button></small>
                    : i.fry ? <small>{TAKEN_UP_SHORT}</small>
                    : <small>{i.food.calories === 0 ? "no energy" : pdText(density(i.food.protein, i.food.calories))} · {imported ? "Change it if you like." : i.locked ? "This amount stays." : `${CHEF_NAME} can change this amount.`}</small>}
                </div>
                {/* CT (0.2.24): eggs, bananas and a pack's pieces are counted; the size and the grams small */}
                {isCounted(i) ? <CountAmount item={i} editable={!i.locked && !imported} open={sizeOpen === i.id} onToggle={countedOf(i) && !i.locked && !imported ? () => setSizeOpen(sizeOpen === i.id ? null : i.id) : undefined}
                    onGrams={(g, c) => { setTouched((t) => new Set(t).add(i.id)); updateItem(i.id, { grams: g, ...(c ? { count: c } : {}) }); }} />
                : i.locked ? <b className="row-num">{fmt(i.grams, 0)} g{servingLabel(i.food, i.grams) ? <small> = {servingLabel(i.food, i.grams)}</small> : null}</b> : (
                  <label className="grams">
                    <input aria-label={`Grams of ${i.food.name}`} type="number" min="0" inputMode="decimal" value={i.grams === 0 ? "" : i.grams}
                      onChange={(e) => { setTouched((t) => new Set(t).add(i.id)); updateItem(i.id, { grams: Math.max(0, Number(e.target.value) || 0) }); }}
                      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} enterKeyHint="done"
                      onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ block: "center", behavior: "smooth" }), 250)} />
                    <span>g{servingLabel(i.food, i.grams) ? ` = ${servingLabel(i.food, i.grams)}` : ""}</span>
                  </label>
                )}
              </div>
              </SwipeRow>
              {sizeOpen === i.id && countedOf(i) && <SizePicker item={i} onGrams={(g, c) => { setTouched((t) => new Set(t).add(i.id)); updateItem(i.id, { grams: g, count: c }); }} />}
              </Fragment>
          );
          const optRow = (o: PlateOpt) => partsMode
            ? <div className="pt-opt" key={o.id}><span className="thumb thumb-sm">{o.food.icon || iconFor(o.name)}</span><span className="pt-opt-text"><b>{o.name}</b><small className="pt-chips"><PartChip value={o.part ?? ""} onPick={(v) => setPartOf(o.id, v)} /> <button type="button" className="pt-chip" aria-pressed={true} onClick={() => setOptional(o.id, false)}>✓ Optional</button></small></span><b className="pt-opt-g">{fmt(o.grams, 0)} g</b></div>
            : <div className="pt-opt" key={o.id}><span className="thumb thumb-sm">{o.food.icon || iconFor(o.name)}</span><span className="pt-opt-text"><b>{o.name}</b><small>{o.note || (o.written ? `${o.written} on the recipe` : "optional")}</small></span><b className="pt-opt-g">{fmt(o.grams, 0)} g</b><button className="pill pill-small" aria-label={`Add ${o.name}`} onClick={() => addOpt(o)}>+ Add</button></div>;
          const PartHead = ({ part }: { part: string }) => {
            const left = leftOut.find((l) => l.part === part);
            if (left) return <div className="pt-h"><span><b>{part}, left out</b><small>{left.items.length} {left.items.length === 1 ? "food" : "foods"} · {fmt(kcalOfItems(left.items), 0)} kcal less</small></span><span className="pt-acts"><button className="link" onClick={() => putBack(part)}>Put it back</button></span></div>;
            if (isEmptyPart(part)) return <div className="pt-h" aria-label={`Part: ${part}`}><span><b>{part}</b><small>No foods left in this part</small></span></div>;
            const its = items.filter((i) => i.part === part), k = kcalOfItems(its), pdp = pdOf(its), nOpt = opts.filter((o) => o.part === part).length;
            const changed = way?.kind === "change" && way.part === part;
            return (
              <div className="pt-h" aria-label={`Part: ${part}`}>
                <span><b>{part}{changed ? ", changed" : ""}</b><small>{its.length} {its.length === 1 ? "food" : "foods"}{nOpt ? `, ${nOpt} optional` : ""} · {fmt(k, 0)} kcal{pdp !== null && k > 0 ? ` · ${pdText(pdp)}` : ""}{changed ? ` · ${triedNote(way)}` : ""}</small></span>
                <span className="pt-acts">{changed ? <button className="link" onClick={backToOriginal}>Back to the original</button> : <>
                  {p.ai.on && pdRef !== null && its.length > 0 && <button className="link" disabled={!!wayBusy || !!way} onClick={() => void changePart(part)}>{wayBusy === part ? `${CHEF_NAME} is changing it…` : "Change"}</button>}
                  {canLeaveOut(items, part) && <button className="link" onClick={() => leavePart(part)}>Leave it out</button>}
                </>}</span>
              </div>
            );
          };
          const dishes = items.some((i) => i.dish);
          const grouped = !dishes && !partsMode && plateParts.length > 0;
          const noPart = items.filter((i) => !i.part), noPartOpts = opts.filter((o) => !o.part);
          return (<>
            {!dishes && (partsMode
              ? <div className="pt-h pt-mode"><span><b>Parts</b><small>Tap a food's part to move it, or New part. Optional keeps it off the plate until added.</small></span><span className="pt-acts">
                  {naming === null ? <button className="link" onClick={() => setNaming("")}>New part</button> : <input className="pt-new" autoFocus aria-label="Name of the new part" placeholder="Sauce" value={naming} onChange={(e) => setNaming(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { const v = naming.trim().slice(0, 30); if (v) setNewParts((l) => [...l, v.charAt(0).toUpperCase() + v.slice(1)]); setNaming(null); } }} onBlur={() => setNaming(null)} />}
                  <button className="link" onClick={() => { if (plateParts.length) log("parts", { how: "set" }); setPartsMode(false); setNaming(null); setNewParts([]); }}>Done</button></span></div>
              : items.length + opts.length >= 2 && <button className="link pt-open" onClick={() => setPartsMode(true)}>{plateParts.length ? "Parts" : "Group into parts"}</button>)}
            <div className="rows">
              {dishes ? groupsOf(items).map((g) => g.kind === "dish" ? <DishRow key={g.id} g={g} /> : itemRow(g.item))
                : !grouped ? <>{items.map(itemRow)}{partsMode && opts.map(optRow)}</>
                : <>
                  {plateParts.map((part) => <div key={part} className="pt-group"><PartHead part={part} />
                    {way?.kind === "change" && way.part === part && way.notes.map((nt, k) => <small key={k} className="pt-note">{nt}</small>)}
                    {!leftOut.some((l) => l.part === part) && <>{items.filter((i) => i.part === part).map(itemRow)}{opts.filter((o) => o.part === part).map(optRow)}</>}
                    {isEmptyPart(part) && <div className="pt-add"><button className="link" onClick={() => addToPart(part)}>+ Add a food to {part}</button></div>}
                  </div>)}
                  {(noPart.length > 0 || noPartOpts.length > 0) && <div className="pt-group"><div className="pt-h"><span><b>Other</b></span></div>{noPart.map(itemRow)}{noPartOpts.map(optRow)}</div>}
                </>}
            </div>
            {/* IM12: a dish without parts: its optional foods in one list under the foods */}
            {!grouped && !partsMode && opts.length > 0 && (
              <div className="pt-optlist" aria-label="Optional, not on the plate">
                <small className="pt-optlist-h">Optional, not on the plate</small>
                {opts.map(optRow)}
                <small className="muted">{rec ? "Left out of the numbers, as the recipe's own numbers leave them out." : "Left out of the numbers until added."} Add puts one on the plate as a food like the others.</small>
              </div>
            )}
          </>);
        })()}
        {/* two ways out (canvas S, A new meal for a slot and Off the plan, short, 11 October 2026): Fit moves one food; Make it as it is takes the plate as it stands */}
        <div className={`ways-out${imported && !way ? " ways-out-col" : ""}`}>
          {imported && rec ? (<>
            {/* PF A6 (0.2.35, Milan 23:11 and 23:21 on 17 October, back after the 0.2.27 revert): Make it as it is is not Chef
                Mealan's work, so no hat; the two ways are his, so both carry it. Wording and icons only: the ways work as before. */}
            <button className="pill pill-primary pill-wide" onClick={keepAsIs}>{!way && pd !== null && pdRef !== null && pd < pdRef - 0.05 ? "Make it as it is" : "Make it"}</button>
            {way && <button className="pill pill-wide" onClick={backToOriginal}>Back to the original</button>}
            {!way && pd !== null && pdRef !== null && pd < pdRef - 0.05 && p.ai.on && (
              <div className="in-ways">
                <small className="ways-label">Under your {pdTag()} {pdVal(pdRef)}. Make it as it is, or fit it one of two ways:</small>
                <div className="ways">
                  <button className="pill pill-small" disabled={!!wayBusy} onClick={() => void changeDish()}><ChefHat size={16} /> {wayBusy === "change" ? `${CHEF_NAME} is changing it…` : "Change the recipe"}</button>
                  <button className="pill pill-small" disabled={!!wayBusy} onClick={() => void addSide()}><ChefHat size={16} /> {wayBusy === "side" ? `${CHEF_NAME} is looking…` : "Add on the side"}</button>
                </div>
                {wayBusy === "change" && waySlow && <div className="way-slow"><small className="rq-drafting in-slow" role="status">This takes longer than most. {CHEF_NAME} keeps going: up to one minute.</small><button className="link" onClick={() => wayStop.current?.abort()}>Stop</button></div>}
                <small className="muted ways-why">Change the recipe: {CHEF_NAME} swaps foods or uses less of them. Add on the side: a high protein side, like skyr, next to your piece. Both aim at your {pdVal(pdRef)}.</small>
              </div>
            )}
          </>) : madeBy && items.length > 0 ? (<>
            {/* Chef Mealan's meal is on the plate (CH3): make it, or ask again from the plate as it was */}
            <button className="pill pill-primary pill-wide" onClick={keepAsIs}><ChefHat size={18} /> Make it</button>
            <button className="pill pill-wide" onClick={() => { const m = madeBy; setMadeBy(null); setState((s) => ({ ...s, items: m.from, title: "", portion: null })); void askChef(m.from, m.tried); }}>Other ideas</button>
          </>) : (<>
          <button className="pill pill-primary pill-wide" disabled={items.length < 1} onClick={makeAMeal}>
            <ChefHat size={18} /> {chefable ? `Make it a ${mealWord}` : "Fit to my target"}
          </button>
          {items.length > 0 && <button className="pill pill-wide" onClick={keepAsIs}>Keep it as it is</button>}
          </>)}
        </div>
        {/* RP1 (0.2.25, Milan 17:42 and 19:43): the recipe's steps, to review on the Plate before you make it */}
        {imported && rec && (rec.steps?.length || rec.source?.steps?.length) ? (
          <section className="card in-steps in-steps-plate" aria-label="The recipe's steps">
            <b>Steps</b>
            {rec.steps?.length ? <><small className="muted">{rec.stepMarks ? `${CHEF_NAME}'s steps, for the whole recipe.` : "Your steps, for the whole recipe."}</small><ol className="rp-steps">{rec.steps.map((x, k) => <li key={k}><span>{k + 1}</span><div className="rp-step-text">{stepText(tempsIn(x), rec.items)}</div></li>)}</ol></>
              : <><small className="muted">{rec.source?.from === "link" ? "As the page writes them" : "As the recipe writes them"}, for the whole recipe.</small><OriginalSteps steps={rec.source!.steps!} /></>}
          </section>
        ) : null}
        {imported && share && <p className="small center">{Meal} is about {fmt(share.kcal, 0)} kcal{dayNums ? ` of your ${fmt(dayNums.kcal, 0)}` : ""}{pdRef !== null ? `, at ${pdTag()} ${pdVal(pdRef)} or more` : ""}.</p>}
        {!imported && !madeBy && chefable && share && items.length > 0 && <p className="small center">{Meal} is about {fmt(share.kcal, 0)} kcal{dayNums ? ` of your ${fmt(dayNums.kcal, 0)}` : ""}{pdRef !== null ? `, at ${pdTag()} ${pdVal(pdRef)} or more` : ""}. {CHEF_NAME} adds what it needs and sets the amounts. Keep it as it is {p.filling ? `puts the plate in ${slotName(p.filling)} as it stands` : "takes the plate as it stands"}.</p>}
        {!madeBy && chefable && share && items.length > 0 && unlogged && (() => {
          const name = unlogged.name.charAt(0).toUpperCase() + unlogged.name.slice(1);
          const ifSkipped = mealSlot && dayNums ? mealShare(daySlots, mealSlot.id, { kcal: dayNums.kcal, protein: dayNums.protein }, { kcal: dayRec.kcal, protein: dayRec.protein }, new Set([...closed, unlogged.id])) : null;
          return (
            <div className="ms-ask">
              <small className="ms-q">{name} isn't logged today. Did you have it?</small>
              <div className="button-row"><button className="pill pill-small" onClick={() => answer(unlogged.id, "had")}>I had it</button><button className="pill pill-small" onClick={() => answer(unlogged.id, "skipped")}>I skipped it</button></div>
              <small className="muted">I had it: {mealWord} stays about {fmt(share.kcal, 0)} kcal. I skipped it: {unlogged.name.toLowerCase()}'s share moves to {mealWord}{ifSkipped ? `, about ${fmt(ifSkipped.kcal, 0)} kcal` : ""}.</small>
            </div>
          );
        })()}
        {!madeBy && chefable && share && items.length > 0 && justSkipped && (() => {
          const sk = daySlots.find((x) => x.id === justSkipped);
          return sk ? <div className="ms-ask"><small className="ms-q">{sk.name.charAt(0).toUpperCase() + sk.name.slice(1)} skipped today. Its share moved to {mealWord}.</small><button className="link" style={{ alignSelf: "flex-start" }} onClick={() => answer(sk.id, null)}>Undo</button></div> : null;
        })()}
        {!chefable && p.filling && p.filling.mode !== "eat" && items.length > 0 && <p className="small center">Fit moves one food. Keep it as it is puts the plate in {slotName(p.filling)} as it stands.</p>}
        {p.filling?.mode === "eat" && items.length > 0 && <p className="small center">Fit sets the amounts. Keep it as it is keeps yours. Save at the end records it as {slotName(p.filling)}.</p>}
        {!imported && !chefable && !p.filling && items.length === 1 && <p className="small center">One product: {CHEF_NAME} looks through your foods for a partner that brings it to your plan.</p>}
        {!imported && !chefable && !p.filling && items.length >= 2 && <p className="small center">Fit works out the amounts without the AI. Keep it as it is keeps yours.</p>}
        {!imported && <Tip list={items} refit={false} />}
        </section>)}
        {swapPanel}
        {foodCard}
        {helperSheet}
        <p className="label">{q.trim() ? "From all your foods" : "Quick picks"}</p>
        <input className="search" aria-label="Search all my foods" placeholder="Search all my foods" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="rows">
          {/* R9 (0.2.33, boards RS4 and RS5): while a recipe is on the plate, only foods that go with the dish; one line names what was held back */}
          {heldBack.length > 0 && recipeTaste && <small className="muted held-back">{heldBackLine(recipeTaste, heldBack)}</small>}
          {(q.trim() ? found : quick.picks.filter((f) => goesInDish(recipeTaste, f.name))
          ).map((f) => {
              const inList = items.some((i) => i.food.id === f.id);
              const why = q.trim() ? null : quick.why.get(f.id);
              return (
                <div className="row row-food" key={f.id}>
                  <span className="thumb thumb-sm">{f.photo ? <img src={f.photo} alt="" /> : (f.icon || iconFor(f.name))}</span>
                  <div className="row-text"><b>{f.favorite && <span className="fav-mark" aria-label="Favourite">★ </span>}{f.name}</b><small>{f.brand ? `${f.brand} · ` : ""}{pdText(density(f.protein, f.calories))}{why === "often" ? " · often" : ""}</small></div>
                  <button className={`pill pill-small ${inList ? "" : "pill-primary"}`} disabled={inList} onClick={() => add(f)}>{inList ? "On plate" : <><Plus size={14} /> Add</>}</button>
                </div>
              );
            })}
          {state.foods.length === 0 && <small>No saved foods yet. Scan or type one above.</small>}
        </div>
        {!q.trim() && state.foods.length > quick.picks.length && (
          <button className="link all-foods" onClick={() => setTab("foods")}>See all {state.foods.length} foods</button>
        )}

      </>
    );

  if (step === "recipe") {
    // The recipe is the current items: Mealan's result, editable. Typing an amount makes it yours; Mealan redoes the rest.
    const mover = moverOf(items);
    const over = cap !== null && !!mover && mover.grams > cap;
    const shown = over ? items.map((i) => (i.id === mover!.id ? { ...i, grams: cap! } : i)) : items;
    const ot = aggregate(shown); const opd = density(ot.protein, ot.calories);
    const dayKcal = p.todayKcal ?? state.goals.calories ?? null;
    const share = dayKcal ? Math.round(((ot.calories ?? 0) / dayKcal) * 100) : null;
    const tooBig = shown.filter((i) => i.grams > (cap ?? 300));
    const meetingBig = p.moment === "meeting" && share !== null && share > 30;
    const unplanned = !momentOf(p.moment).planned;
    const unreal = !unplanned && (tooBig.length > 0 || (share !== null && share > 50) || meetingBig);
    const onPlan = !unreal && opd !== null && pdRef !== null && opd >= pdRef - 0.05;
    // Fit kept the plate as it stood: already above the target, so nothing moved (Milan, 15 October 2026: it said it moved the chicken)
    const kept = !!mover && !over && onPlan && fitBefore?.[mover.id] === mover.grams && opd! > pdRef! + 0.05;
    const unrealText = tooBig.length
      ? `${fmt(tooBig[0].grams, 0)} g of ${tooBig[0].food.name} is not a portion. This food can't get you there at a normal amount; swap it or lower the others.`
      : meetingBig
        ? `This plate is ${share} % of your day. On a meeting day keep it under a third, so the afternoon stays sharp.`
        : `This plate is ${share} % of your day. Fit for a meal, not a dessert.`;
    return (
      <>
        {Head({ name: Boolean(p.filling), title: mover ? `${CHEF_NAME}'s recipe` : "As you set it", sub: unplanned ? `${momentOf(p.moment).name}. Enjoy it, keep it small. Your next meal leans protein and you're back.` : over ? `${mover!.food.name} would need ${fmt(mover!.grams, 0)} g to reach ${fixed(pdRef)}. At ${cap} g this is as close as it gets.` : kept ? `Already above your target: ${pdTag()} ${pdVal(opd)} against ${pdVal(pdRef)}, so nothing moved. More protein is fine. Change an amount and ${CHEF_NAME} refits.` : mover ? `${CHEF_NAME} moves the ${mover.food.name}. Change any other amount and it refits.` : `Nothing moved. This is where your amounts land. Tap a grey dot if you want ${CHEF_NAME} to fit one food.` })}
        <section className={`readout ${unreal ? "readout-fit-mid" : `readout-fit-${p.fitPd(opd)}`}`}>
          <div className="readout-top"><span>This plate</span><span>{pdTag()}</span></div>
          <div className="readout-mid">
            <b>{pdVal(opd)}</b>
            <div><span>{unreal ? "not realistic" : onPlan ? `on plan, target ${pdVal(pdRef)}` : `target ${pdVal(pdRef)}`}</span><small>{fmt(ot.calories, 0)} kcal{share !== null ? `, ${share} % of your day` : ""} · {fmt(ot.protein)} g protein · {fmt(ot.weight, 0)} g</small></div>
          </div>
          {unreal && <p className="readout-note">{unrealText}</p>}
          {extras(shown.map((x) => ({ food: x.food, grams: x.grams })))}
        </section>
        <div className="rows">
          {groupsOf(shown).map((g) => g.kind === "dish" ? <DishRow key={g.id} g={g} /> : (() => { const i = g.item; return (
            <SwipeRow key={i.id} onRemove={() => remove(i.id)} onSwap={() => setSwapId(i.id)}>
            <div className="row">
              <button className={`dot ${i.locked ? "dot-locked" : "dot-free"}`} aria-label={`${i.locked ? "Let Chef Mealan move" : "Keep"} ${i.food.name}`} onClick={() => toggle(i.id)} />
              <div className="row-text"><button className="name-link" onClick={() => setCardId(i.id)}>{i.food.name}</button>
                <small>{i.locked ? "as you set it" : i.id === mover?.id ? `what ${CHEF_NAME} moves` : `${CHEF_NAME} may move it`}</small>
                {suggest?.id === i.id && suggest.grams !== i.grams && (
                  <button className="link suggest" onClick={applySuggestion}>
                    {CHEF_NAME} suggests {suggest.grams} g: that brings the plate from {pdText(opd)} to your {pdVal(pdRef)} · apply
                  </button>
                )}
              </div>
              {isCounted(i) ? <CountAmount item={i} editable={!i.locked} onGrams={(g) => edit(i.id, g)} /> : i.locked ? <b className="row-num">{fmt(i.grams, 0)} g</b> : (
                <label className="grams">
                  <input aria-label={`Grams of ${i.food.name}`} type="number" min="0" inputMode="decimal" value={i.grams === 0 ? "" : i.grams}
                    onChange={(e) => edit(i.id, Math.max(0, Number(e.target.value) || 0))}
                    onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} enterKeyHint="done"
                    onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ block: "center", behavior: "smooth" }), 250)} />
                  <span>g</span>
                </label>
              )}
            </div>
            </SwipeRow>
          ); })())}
        </div>
        {over && <button className="pill pill-wide" onClick={() => setCap(null)}>Allow more than {cap} g</button>}
        <button className="pill pill-primary pill-wide" onClick={() => {
          log("mix_applied", { grams: mover ? Math.round(over ? cap! : mover.grams) : 0 });
          setState((s) => ({ ...s, items: shown, portion: null, title: s.title || "DaaM" }));
          setMethod(null);
          setStep("make");
        }}>Make it</button>
        {p.filling && p.filling.mode !== "eat" ? (<>
          <button className="pill pill-wide" onClick={() => putInSlot(shown)}>Put it in {slotName(p.filling)}</button>
          <Tip list={shown} refit />
        </>) : (
        <button className="pill pill-wide" onClick={() => {
          p.keepForLater({ id: uid(), title: p.state.title || autoTitle(shown), items: structuredClone(shown), portion: shown.reduce((n, i) => n + i.grams, 0), savedAt: new Date().toISOString() });
          setStep("in");
        }}>Keep for later today</button>
        )}
        {(!p.filling || p.filling.mode === "eat") && !unplanned && <Tip list={shown} refit />}
        {options.length > 1 && <button className="pill pill-wide" onClick={() => {
          const next = (pick + 1) % options.length; setPick(next);
          setState((s) => ({ ...s, items: options[next].items, portion: null }));
        }}>Try another mix ({(pick % options.length) + 1} of {options.length})</button>}
        <Back to="in" />
        {swapPanel}
        {foodCard}
        {helperSheet}
      </>
    );
  }

  // the recipe the plate is: one that came in, or one of yours opened on the plate (by its slot or its name)
  const plateRecipe = rec ?? state.meals.find((m) => (p.filling?.mealId ? m.id === p.filling.mealId : !!state.title && m.title === state.title) && m.items.length > 0);
  const wholePlate = !!rec?.makes && rec.makes.n >= 2 && pmode === "whole" && !way;
  const madeWhole = !!rec?.makes && rec.makes.n >= 2 && (wholePlate || (makeAll ?? rec.makes.n >= 4));
  // R12 (0.2.38, board RS9): the whole recipe in your portions; a plate sized for your lunch leaves lunches, not the recipe's pieces
  const sizedPlate = !!rec?.makes && imported && pmode === "sized" && !!mealNeed && !way;
  const yours = !rec?.makes || wholePlate ? 1 : sizedPlate ? yourPortions(kcalOfItems(rec.items), kcalOfItems(items)) : rec.makes.n;
  const leftK = yours - 1;
  const leftOne = sizedPlate ? mealWord : rec ? oneOf(rec) : "portion", leftMany = sizedPlate ? plural(mealWord) : rec ? unitOf(rec) : "portions";
  const leftWords = (k: number) => `${k} ${k === 1 ? leftOne : leftMany}`;
  if (step === "make" && (rec || (plateRecipe?.steps?.length ?? 0) > 0 || partsOf(items).length > 0)) {
    // a changed dish (0.2.23, IM23): the steps are for the dish on the plate, the whole recipe as changed; kept with it at Save
    const chg = way && way.kind === "change" && way.whole && rec ? way : null;
    const changedRec: Meal | undefined = chg && rec ? { ...rec, id: `${rec.id}~changed`, title: chg.title || state.title || rec.title, items: chg.whole!, steps: chg.drafted?.steps ?? [], stepMarks: chg.drafted?.marks, stepsKitchen: chg.drafted?.kitchen, stepParts: chg.drafted?.parts } : undefined;
    const recipe = changedRec ?? plateRecipe;
    const steps = recipe?.steps ?? [];
    // RP1b (0.2.25): the original's steps, and how your dish differs from the foods they were written for
    const origSteps = rec?.source?.steps ?? (plateRecipe?.source?.steps ?? []);
    const mkDiff = recipe ? diffFoods(foodNames(recipe.items), originalFoodsOf(chg && rec ? rec : recipe, state.meals) ?? (chg && rec ? foodNames(rec.items) : null)) : null;
    const mkStale = recipe && steps.length ? diffFoods(foodNames(recipe.items), recipe.stepsFor) : null;
    const n = rec?.makes?.n ?? 1, unit = rec ? unitOf(rec) : "portions", one = rec ? oneOf(rec) : "portion";
    const onePlate = !!rec && pmode === "recipe" && !way;
    const t0 = aggregate(items), pd0 = density(t0.protein, t0.calories);
    // the amounts in the steps follow what you make: the whole recipe's grams, or your plate's
    const amounts = (): Ingredient[] => !recipe ? items : madeWhole ? recipe.items : (() => { const on = pairItems(recipe.items, items); return recipe.items.map((r, k) => ({ ...r, grams: on[k]?.grams ?? 0 })); })();
    // R3, the fix (0.2.39): the steps cook with the pot, even for just your plate; what you make counts what is taken up
    const counted = amounts();
    const stepsFor = madeWhole ? counted : counted.map((i) => (i.fry ? { ...i, fry: { ...i.fry, plate: true } } : i));
    const tMake = aggregate(counted);
    const mark = (m?: { kind: string; why: string }) => !m ? null : <small className={`st-mark ${m.kind}`}>{m.kind === "same" ? "As the original" : `${m.kind === "adapted" ? "Adapted" : "Added"}${m.why ? `: ${m.why}` : ""}`}</small>;
    const draftHere = async () => {
      if (!recipe) return;
      setMkDraft("working");
      try {
        const d = await draftSteps(recipe, { library: state.foods.map((f) => f.name), equipment: equipmentOf(p.personal), kitchens: p.personal.kitchens ?? [], ...(chg && rec ? { changed: changesOf(rec.items, chg.whole!, chg.notes) } : {}) });
        if (d.ok) {
          if (chg) setWay({ ...chg, drafted: { steps: d.steps, marks: d.marks, kitchen: d.kitchen, parts: d.parts } });
          else setState((s) => ({ ...s, meals: s.meals.map((m) => (m.id === recipe.id ? { ...m, steps: d.steps, stepMarks: d.marks, stepsKitchen: d.kitchen, stepParts: d.parts, stepsFor: foodNames(m.items) } : m)) }));
          setMkDraft(""); setMkDrafted(true);
        }
        else { const f = d as { why: string; cannot?: boolean }; setMkDraft(f.cannot ? f.why : `${CHEF_NAME}'s draft didn't pass the checks (${f.why}). Try again, or make it from the original.`); }
      } catch (e: any) { setMkDraft(e?.message || `${CHEF_NAME} could not answer. Try again.`); }
    };
    const parts = partsOf(items);
    return (
      <>
        {Head({ title: "How to make it", sub: chg ? (steps.length ? `${CHEF_NAME}'s steps for your changed dish, from the original.` : "No steps yet for your changed dish.") : steps.length ? `${CHEF_NAME}'s steps${recipe?.stepParts?.some(Boolean) ? ", part by part," : ""} for what you make.` : origSteps.length ? "The recipe's own steps." : rec ? "No steps yet for this recipe." : "Your dish, part by part. Tick each as you go." })}
        {/* IM19, IM20: what you make, and what you eat */}
        {rec?.makes && n >= 2 && (
          <section className="card mk-card" aria-label="What you make">
            <b>What you make</b>
            {/* R15: with the whole recipe on the plate, you make all of it: no choice to ask */}
            {!wholePlate && <div className="moments">
              <button className={`choice ${madeWhole ? "on" : ""}`} aria-pressed={madeWhole} onClick={() => setMakeAll(true)}>The whole recipe</button>
              <button className={`choice ${!madeWhole ? "on" : ""}`} aria-pressed={!madeWhole} onClick={() => setMakeAll(false)}>Just your plate</button>
            </div>}
            {/* RP3 (0.2.25): what you make and what you eat, each with its weight and energy */}
            <div className="mk-eat mk-make"><span><b>You make</b> {madeWhole ? (sizedPlate ? `the whole recipe, about ${yours} of your ${leftMany}` : "the whole recipe") : onePlate ? `1 ${one}` : "your plate"}</span><span>{fmt(tMake.weight, 0)} g · {fmt(tMake.calories, 0)} kcal</span></div>
            <div className="mk-eat"><span><b>You eat</b> {wholePlate ? "the whole recipe" : sizedPlate ? `one ${mealWord}` : onePlate ? `1 ${one}` : rec && pmode === "recipe" && !way ? `your plate, 1 ${one}` : "your plate"}</span><span>{fmt(t0.weight, 0)} g · {fmt(t0.calories, 0)} kcal · {pdText(pd0)}</span></div>
            <small className="muted">{madeWhole ? `The steps are for the whole recipe. ${leftK < 1 ? "Your plate is the whole recipe, so nothing is left." : sizedPlate ? `${leftK} of your ${leftK === 1 ? leftOne : leftMany} ${leftK === 1 ? "is" : "are"} left, each the size of your ${mealWord}. ${leftK === 1 ? "It goes" : "They go"} to Keep for later when you save, ready for the coming days.` : `${leftK === 1 ? `The other ${one} goes` : `The ${leftK} ${unit} left go`} to Keep for later when you save, ready for the coming days.`}` : `The recipe makes ${n}. The steps are for your plate: every amount at your portion, to the gram.`}</small>
          </section>
        )}
        {/* RP1 to RP1c (0.2.25): the original is the steps; Chef Mealan's on demand, with a line for the case */}
        {steps.length > 0 ? (
          <section className="card mk-card">
            {origSteps.length > 0 && (
              <div className="segments rq-steps-seg" role="tablist" aria-label="Which steps">
                <button role="tab" aria-selected={mkView === "own"} className={`seg ${mkView === "own" ? "on" : ""}`} onClick={() => setMkView("own")}>{recipe?.stepMarks ? `${CHEF_NAME}'s` : "Yours"}</button>
                <button role="tab" aria-selected={mkView === "orig"} className={`seg ${mkView === "orig" ? "on" : ""}`} onClick={() => setMkView("orig")}>Original</button>
              </div>
            )}
            {origSteps.length > 0 && mkView === "orig" ? <><small className="muted">For the whole recipe, as the original writes it.</small><OriginalSteps steps={origSteps} /></> : (<>
            {mkStale && <StepsHint tone="warn">These steps were written for the earlier foods. {diffLine(mkStale)}</StepsHint>}
            {mkStale && p.ai.on && <div className="button-row"><button className="pill pill-small pill-primary" disabled={mkDraft === "working"} onClick={() => void draftHere()}>Write them again</button></div>}
            {chg && <small className="muted mk-changed">{changedRec!.title}: the steps go with it when you save.</small>}
            {recipe?.stepMarks && (!chg || recipe.stepsKitchen) && <small className="muted">{recipe.stepsKitchen || `${CHEF_NAME}'s steps, from the original, for your amounts and your kitchen.`}</small>}
            <ol className="rp-steps">{steps.map((x, k) => [recipe?.stepParts?.[k] && (k === 0 || recipe.stepParts[k - 1] !== recipe.stepParts[k]) ? <li key={`p${k}`} className="rp-step-part">The {recipe.stepParts[k].toLowerCase()}</li> : null,
              <li key={k}><span>{k + 1}</span><div className="rp-step-text">{stepParts(tempsIn(x), stepsFor).map((pt, j) => ("text" in pt ? pt.text : <b key={j} className="st-amt">{pt.label}</b>))}{mark(recipe?.stepMarks?.[k])}</div></li>])}</ol>
                      </>)}
          </section>
        ) : origSteps.length > 0 ? (
          <section className="card mk-card" aria-label="Steps">
            {mkDiff ? <StepsHint tone="warn">{diffLine(mkDiff)}</StepsHint> : null}
            {mkDraft === "working" ? <small className="rq-drafting">{CHEF_NAME} is writing the steps.</small> : mkDraft ? <small className="rq-drafting">{mkDraft}</small> : null}
            {mkDiff && p.ai.on && <div className="button-row"><button className="pill pill-small pill-primary" disabled={mkDraft === "working"} onClick={() => void draftHere()}>Write the steps for my dish</button></div>}
            <small className="muted">{mkDiff ? "The original, for the original foods:" : `For the whole recipe, as the original writes it${n >= 2 ? `: ${n} ${unit}` : ""}.`}</small>
            <OriginalSteps steps={origSteps} />
            {!mkDiff && <StepsHint tone="ok">The original works with your foods as they are.</StepsHint>}
            {!mkDiff && p.ai.on && <div className="button-row"><button className="pill pill-small" disabled={mkDraft === "working"} onClick={() => void draftHere()}>{CHEF_NAME}'s way</button></div>}
          </section>
        ) : rec ? (
          <section className="card mk-card" aria-label="Steps">
            <b>Steps</b>
            {p.ai.on && <small className="muted">{CHEF_NAME} writes them from the original, for your amounts and your kitchen, here, before you start.</small>}
            {mkDraft === "working" ? <small className="rq-drafting">{CHEF_NAME} is writing the steps.</small> : mkDraft ? <small className="rq-drafting">{mkDraft}</small> : null}
            {p.ai.on && <div className="button-row"><button className="pill pill-small pill-primary" disabled={mkDraft === "working"} onClick={() => void draftHere()}>Draft the steps with {CHEF_NAME}</button></div>}
          </section>
        ) : (
          <section className="card mk-card" aria-label="Checklist">
            {/* IM19c: your own dish in parts, without steps: the parts as a checklist at your amounts */}
            {[...parts, "Put it together"].map((pt) => { const its = items.filter((i) => i.part === pt), on = ticks.has(pt);
              return <button key={pt} type="button" className={`mk-check ${on ? "on" : ""}`} aria-pressed={on} onClick={() => setTicks((t) => { const x = new Set(t); if (x.has(pt)) x.delete(pt); else x.add(pt); return x; })}>
                <span className="mk-box">{on ? "✓" : ""}</span><span><b>{pt}{its.length ? ":" : ""}</b> {its.map((i) => <b key={i.id} className="st-amt">{fmt(i.grams, 0)} g {i.food.name}</b>).reduce<React.ReactNode[]>((a, el, k) => (k ? [...a, ", ", el] : [el]), [])}{its.length ? "" : " in a bowl or on a plate"}</span></button>; })}
            {recipe && p.ai.on && <button className="link" style={{ alignSelf: "flex-start" }} disabled={mkDraft === "working"} onClick={() => void draftHere()}>{mkDraft === "working" ? `${CHEF_NAME} is writing the steps.` : `Draft the steps with ${CHEF_NAME}`}</button>}
            {mkDraft && mkDraft !== "working" && <small className="rq-drafting">{mkDraft}</small>}
          </section>
        )}
        <button className="pill pill-primary pill-wide" onClick={() => { log("method_chosen", { method: madeWhole ? "whole" : "plate" }); setStep("made"); }}>I'm making it</button>
        {madeWhole && leftK > 0 && <small className="muted center" style={{ display: "block", marginTop: 6 }}>{leftWords(leftK)} {leftK === 1 ? "goes" : "go"} to Keep for later when you save.</small>}
        <Back to="in" />
      </>
    );
  }
  if (step === "make") {
    const ways = methodsFor(items);
    return (
      <>
        {Head({ title: "How do you want to eat it?", sub: ways.length ? `Same amounts, ${ways.length === 1 ? "one way" : `${ways.length} ways`}. Pick the one you feel like.` : "One food, nothing to combine. Enjoy it as it is." })}
        <div className="how">
          {ways.map((w) => (
            <button key={w.id} className={`way ${method === w.id ? "on" : ""}`} onClick={() => setMethod(w.id)}>
              <b>{w.name}</b>
              <small>{w.why}</small>
              <ol>{w.steps.map((s, i) => <li key={i}>{tempsIn(s)}</li>)}</ol>
            </button>
          ))}
        </div>
        <button className="pill pill-primary pill-wide" disabled={ways.length > 0 && !method} onClick={() => {
          const w = ways.find((x) => x.id === method);
          log("method_chosen", { method });
          // the way names a plate that has no name yet; a named meal (a recipe, a slot) keeps its name (0.2.3)
          setState((s) => ({ ...s, title: w && (!s.title || s.title === "DaaM") ? w.name : s.title }));
          setStep("made");
        }}>{ways.length ? "I'm making it this way" : "Continue"}</button>
        <Back to="recipe" />
      </>
    );
  }

  if (step === "made") {
    const mealNow = () => ({ id: uid(), title: p.state.title || autoTitle(items), items: structuredClone(items), portion: items.reduce((n, i) => n + i.grams, 0), savedAt: new Date().toISOString() });
    return (
      <>
        {Head({ title: "How did making it go?", sub: "A photo or two while it's on the counter, then one tap." })}
        <p className="label">Photos of the meal</p>
        <div className="meal-photos">
          {photos.map((ph, i) => <img key={i} src={ph} alt="" onClick={() => setPhotos((x) => x.filter((_, k) => k !== i))} />)}
          <label className="plate-photo small"><span>Take a photo</span><input type="file" accept="image/*" capture="environment" onChange={(e) => { addPhoto(e.target.files?.[0]); e.target.value = ""; }} /></label>
          <label className="plate-photo small"><span>My gallery</span><input type="file" accept="image/*" multiple onChange={(e) => { Array.from(e.target.files ?? []).forEach((f) => addPhoto(f)); e.target.value = ""; }} /></label>
        </div>
        <p className="label">How did it go?</p>
        <div className="reasons">
          <button className={`choice ${went === "as" ? "on" : ""}`} onClick={() => setWent("as")}>All as the recipe says</button>
          <button className={`choice ${went === "not" ? "on" : ""}`} onClick={() => setWent("not")}>Not as the recipe says</button>
        </div>
        {went === "not" && <textarea placeholder="What was different" value={different} onChange={(e) => setDifferent(e.target.value)} />}
        {went === "not" && <button className="link" onClick={() => p.openOut()}>Help me with making it</button>}
        <p className="label">How much did you eat?</p>
        <div className="reasons">
          {([["all", "All of it"], ["portion", "A portion"], ["later", "Later today"], ["not", "Not after all"]] as const).map(([k, l]) => (
            <button key={k} className={`choice ${ate === k ? "on" : ""}`} onClick={() => setAte(k)}>{l}</button>
          ))}
        </div>
        <button className="pill pill-primary pill-wide" onClick={() => {
          log("made", { went, ate, photos: photos.length });
          if (ate === "later" || ate === "not") {
            // the card goes to Today without a rating: kept for later, or not eaten after all
            p.keepForLater({ ...mealNow() }, { photos, prep: { went, different: different || undefined }, status: ate === "later" ? "prepared" : "not-used" });
            resetMade(); setStep("in");
            return;
          }
          setStep("after");
        }}>On to How was it?</button>
        <Back to="make" />
      </>
    );
  }

  // after
  // the plate's name, and the recipe it is as it stands (same foods and amounts), when it came from one
  const plateName = (state.title && state.title !== "DaaM" ? state.title : "") || autoTitle(items);
  const sameAs = (m: Meal) => m.items.length === items.length && m.items.every((x, i) => x.food.id === items[i].food.id && Math.round(x.grams) === Math.round(items[i].grams));
  // a dish on its own is its recipe, whatever the portion
  const dishOnly = items.length > 0 && items.every((i) => i.dish && i.dish.id === items[0].dish!.id) ? items[0].dish!.id : null;
  // a recipe that came in (0.2.16, board IM): the card points at it, unless Chef Mealan changed the dish, which is a recipe of its own
  const fromRec = state.fromRecipe ? state.meals.find((m) => m.id === state.fromRecipe) : undefined;
  const origin = way?.kind === "change" ? undefined : fromRec ?? (dishOnly ? state.meals.find((m) => m.id === dishOnly) : undefined) ?? state.meals.find((m) => (p.filling?.mealId === m.id || m.title === plateName) && sameAs(m));
  const tryCtx = way && fromRec ? { kind: way.kind, what: wayWhat(way) } : null;
  // a dish changed on the plate, with the whole recipe as changed (0.2.23, IM23b)
  const chgW = way && way.kind === "change" && way.whole && fromRec ? way : null;
  return (
    <>
      {Head({ title: "How was it?", sub: "One tap. It stays yours unless you share it." })}
      <div className="choices three">
        <button className={`choice ${good === "daam" ? "on" : ""}`} onClick={() => setGood("daam")}><span className="double-thumbs" aria-hidden="true"><ThumbsUp size={22} /><ThumbsUp size={22} /></span><span>DaaM good</span></button>
        <button className={`choice ${good === "good" ? "on" : ""}`} onClick={() => setGood("good")}><ThumbsUp size={22} /><span>Good</span></button>
        <button className={`choice ${good === "no" ? "on" : ""}`} onClick={() => setGood("no")}><ThumbsDown size={24} /><span>Not really</span></button>
      </div>
      <div className="meal-photos">
        {photos.map((ph, i) => <img key={i} src={ph} alt="" />)}
      <label className={`plate-photo ${photos.length ? "small" : ""}`}>
        {plate ? <img src={plate} alt="your plate" /> : <span>{photos.length ? "Photo of the plate" : "Add a photo of the plate"}</span>}
        <input type="file" accept="image/*" capture="environment" onChange={(e) => {
          const file = e.target.files?.[0]; if (!file) return;
          const r = new FileReader(); r.onload = () => thumbnailBase64(String(r.result), 480).then(setPlate).catch(() => {}); r.readAsDataURL(file);
        }} />
      </label>
      </div>
      {tryCtx && (
        <section className="card save-recipe">
          <div className="card-top"><span>{tryCtx.kind === "change" ? "Did the swap work?" : "Did the side work?"}</span></div>
          <small>{tryCtx.what}. Your answer stays with the recipe, so next time it says how it went.</small>
          <div className="reasons">
            {([["yes", "It worked"], ["ok", "It was OK"], ["no", "It didn't work"]] as const).map(([k, l]) => <button key={k} className={`choice ${tried === k ? "on" : ""}`} onClick={() => setTried(k)}>{l}</button>)}
          </div>
        </section>
      )}
      <label className="field"><span>Name it</span><input value={title} placeholder={plateName} onChange={(e) => setTitle(e.target.value)} /></label>
      <textarea placeholder="A line for your coach, if you like" value={note} onChange={(e) => setNote(e.target.value)} />
      {origin ? <p className="small">{origin.title} is in My recipes already. This card points at it.</p> : <section className="card save-recipe">
        <div className="card-top"><span>{chgW ? "Save your changed dish" : "Save in My recipes"}</span></div>
        {chgW && fromRec
          ? <small><b>{title.trim() || plateName}</b>: the whole recipe{fromRec.makes ? `, ${countOf(fromRec.makes.n, fromRec.makes.unit || "portions")}` : ""}, with {chgW.drafted ? "the steps for your change" : "its foods and grams"}. Adapted from {fromRec.title}{fromRec.source?.name ? `, ${fromRec.source.name}` : ""}{fromRec.source?.steps?.length ? "; its original steps come along, for you only" : ""}.</small>
          : <small>Keeps the foods, the grams, the steps and the photos for next time.</small>}
        <div className="reasons">
          <button className={`choice ${saveRecipe ? "on" : ""}`} onClick={() => setSaveRecipe(true)}>Yes, save it</button>
          <button className={`choice ${!saveRecipe ? "on" : ""}`} onClick={() => setSaveRecipe(false)}>Not this one</button>
        </div>
      </section>}
      {sharing && p.profile.coachId && (
        <div className="reasons">
          {([["look", "Look at this"], ["ok", "Was this OK?"], ["help", "Help me next time"]] as const).map(([k, l]) => (
            <button key={k} className={`choice ${shareWhy === k ? "on" : ""}`} onClick={() => setShareWhy(k)}>{l}</button>
          ))}
        </div>
      )}
      <button className="pill pill-primary pill-wide" disabled={good === null || (sharing && !shareWhy)} onClick={() => {
        const name = title.trim() || plateName;
        const src = way?.kind === "change" && fromRec?.source ? { source: { name: fromRec.source.name, ...(fromRec.source.url ? { url: fromRec.source.url } : {}), from: fromRec.source.from, at: fromRec.source.at } } : {};
        const meal: Meal = { id: origin?.id ?? uid(), title: name, items: structuredClone(items), portion: t.weight, savedAt: new Date().toISOString(), kind: p.kind, ...src };
        // the recipe kept (0.2.19, IM18b): its parts on its foods; optional foods, added or not, in its optional list
        const keptOpt = [...(state.optional ?? []), ...items.filter((i) => i.optional).map(itemToOpt)].map((o) => ({ name: o.name, written: o.written ?? "", ...(o.note ? { note: o.note } : {}), grams: o.grams, food: leanFood(o.food), ...(o.part ? { part: o.part } : {}) }));
        const keptItems = structuredClone(items.filter((i) => !i.optional));
        // a changed dish is kept as the whole recipe it is now (0.2.23, IM23b): the recipe's size, its steps, adapted from the original
        const chgKept: Meal | null = chgW && fromRec ? (() => {
          // the same ids: the drafted steps name the foods by them
          const whole = chgW.whole!.map((i) => ({ ...structuredClone(i), locked: false, dish: undefined, optional: undefined }));
          const n = fromRec.makes?.n ?? 1, d = chgW.drafted;
          const src = fromRec.source ? { source: { name: fromRec.source.name, ...(fromRec.source.url ? { url: fromRec.source.url } : {}), from: fromRec.source.from, at: fromRec.source.at, ...(fromRec.source.steps?.length ? { steps: fromRec.source.steps } : {}), foods: originalFoodsOf(fromRec, state.meals) ?? foodNames(fromRec.items) } } : {};
          return { id: meal.id, title: name, items: whole, portion: Math.round(whole.reduce((k, i) => k + i.grams, 0) / n), savedAt: meal.savedAt, kind: p.kind, ...src, basedOn: { id: fromRec.id, title: fromRec.title },
            ...(fromRec.makes ? { makes: fromRec.makes } : {}), ...(fromRec.optional?.length ? { optional: fromRec.optional } : {}),
            steps: d?.steps ?? [], ...(d?.steps?.length ? { stepsFor: foodNames(whole) } : {}), ...(d?.marks ? { stepMarks: d.marks } : {}), ...(d?.kitchen ? { stepsKitchen: d.kitchen } : {}), ...(d?.parts ? { stepParts: d.parts } : {}) };
        })() : null;
        const kept: Meal = chgKept ?? { ...meal, items: keptItems, portion: keptItems.reduce((n, i) => n + i.grams, 0), ...(keptOpt.length ? { optional: keptOpt } : {}) };
        const triedNow = tryCtx && tried ? { kind: tryCtx.kind, what: tryCtx.what, result: tried } : undefined;
        const status = good === "no" ? "not-used" : "eaten";
        const taste = TASTE[good!];
        log("feedback", { status, taste, shared: sharing ? shareWhy : null });
        setFeedback({ status, taste, notes: note });
        const shared = sharing && shareWhy ? { reason: shareWhy, at: new Date().toISOString() } : undefined;
        const allPhotos = [...photos, ...(plate ? [plate] : [])];
        // a plate that is a recipe as it stands (0.2.3): the card points at that recipe, no second copy
        const keep = !origin && saveRecipe && status === "eaten";
        if (triedNow) log("recipe_fit", { way: triedNow.kind, result: triedNow.result });
        // the whole recipe made (IM19): the portions left go to Keep for later, one card with how many are left
        // R4 (0.2.38): the card carries the recipe, so each portion eaten from it is In My recipes, not a plate of its own
        // a changed dish leaves portions of the changed recipe (0.2.23)
        if (madeWhole && rec?.makes && status === "eaten" && leftK > 0) { const left = chgW ? onePortion(chgW.whole!, rec.makes.n).map((i) => ({ ...i, id: uid() })) : way ? structuredClone(items) : sizedPlate ? structuredClone(items).map((i) => ({ ...i, id: uid() })) : portionItems(rec, "recipe"); p.keepForLater({ id: uid(), title: chgW ? name : rec.title, items: left, portion: left.reduce((n, i) => n + i.grams, 0), savedAt: new Date().toISOString() }, { left: leftK, leftOf: leftOne, recipeId: keep ? kept.id : (fromRec ?? origin)?.id }); }
        // where you land (0.2.23, IM23c): the recipe the meal made or changed, a recipe made for the first time, or steps drafted now
        const firstTime = !!fromRec && !state.feedback.some((f) => f.status === "eaten" && (f.recipeId === fromRec.id || f.meal?.id === fromRec.id));
        // RP4 (0.2.25, Milan 17:42): every recipe you make ends on its page; a plate that is no recipe ends on Today
        const landId = keep ? kept.id : (fromRec ?? origin)?.id ?? null;
        const leftN = madeWhole && rec?.makes ? Math.max(0, leftK) : 0;
        const landLine = status !== "eaten" ? "" : [`You ate ${rec && pmode === "recipe" && !way ? `1 ${oneOf(rec)}` : "your plate"}.`, leftN > 0 ? `${sizedPlate ? leftWords(leftN) : countOf(leftN, unitOf(rec!))} left on Today.` : "", chgKept && fromRec ? `The original, ${fromRec.title}, stays as it was.` : ""].filter(Boolean).join(" ");
        setState((s) => ({ ...s, fromRecipe: undefined, optional: undefined, leftOut: undefined, emptyParts: undefined, meals: (keep ? [structuredClone(kept), ...s.meals] : s.meals).map((m) => (triedNow && fromRec && m.id === fromRec.id ? { ...m, tried: [...(m.tried ?? []).filter((x) => !(x.kind === triedNow.kind && x.what === triedNow.what)), { ...triedNow, at: new Date().toISOString() }] } : m)), feedback: [{ id: uid(), meal: structuredClone(meal), status, taste, notes: note, ...(triedNow ? { tried: triedNow } : {}), photo: allPhotos[allPhotos.length - 1] || undefined, photos: allPhotos.length ? allPhotos : undefined, prep: { went, different: different || undefined }, ate: ate === "portion" ? "portion" : "all", recipeId: keep || origin ? meal.id : undefined, shared, moment: p.moment, dayType: p.personal.dayMode === "follow" ? p.dayType : undefined, slot: p.filling?.mode === "eat" ? { date: p.filling.date, slotId: p.filling.slotId, name: p.filling.name, time: p.filling.time } : pickSlot ? { date: todayKey, slotId: pickSlot.id, name: pickSlot.name, time: pickSlot.time } : undefined, createdAt: new Date().toISOString() }, ...s.feedback], items: [], portion: null, title: "" }));
        if (p.filling) p.setFilling(null);
        setWay(null); setTried(null);
        setMakeAll(null); setTicks(new Set()); setMkDraft(""); setMkDrafted(false);
        if (landId) p.landOnRecipe(landId, landLine, keep ? "✓ Saved in Mine" : "✓ Made today");
        else setTab("home");
        p.setKind("meal"); p.setPick(null); setGood(null); setNote(""); setTitle(""); setPlate(""); setTouched(new Set()); setSuggest(null); setSharing(false); setShareWhy(null); resetMade(); setStep("in");
      }}>{sharing ? `Save and share with ${p.profile.coachName || "your coach"}` : "Save"}</button>
      {p.profile.coachId && !sharing && <button className="pill pill-wide" onClick={() => setSharing(true)}>Share with {p.profile.coachName || "your coach"}</button>}
      {sharing && <button className="link" onClick={() => { setSharing(false); setShareWhy(null); }}>Keep it private</button>}
      <Back to="made" />
    </>
  );
}
