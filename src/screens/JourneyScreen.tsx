import { PdScale } from "../components/PdScale";
import { w, wn, wIn, dec, mealV, mealName, wordV, dateV, dateText, type Val, type WordKey } from "../words";
import { samePhotoMeal, updateWith, deleteCard as deleteCardIn } from "../pastMeal";
import { liveStatus, minutesOf, type LiveStatus } from "../plateLive";
import { SamePhotoAsk } from "../components/SamePhotoAsk";
import { ServedOnPlate } from "../components/Served";
import { locOf, getLang, useLang } from "../lang";
import { shownMeal } from "../recipeLang";
import type { PlateIn } from "../chefScript";
import { plateWhenOf, capFirst, atMeal, mealAt } from "../plateMode";
import { say } from "../chefScript";
import { ThinkingCard } from "../components/ThinkingCard";
import { carriedLists } from "../carry";
import { tasteForReq } from "../tasteChips";
import { useState, useEffect, useRef, Fragment } from "react";
import { tempsIn } from "../units";
import { Camera, Pencil, Plus, Trash2, ChevronLeft, ChefHat, ThumbsUp, ThumbsDown, Image as ImageIcon, Link as LinkIcon, Mic, TriangleAlert, X } from "lucide-react";
import { photoAdvice, ideaAdvice, aboutKcal, kcalRange, mealsOn, foodOfRead } from "../mealPhoto";
import { dishWord } from "../components/PhotoAsk";
import { hhmm } from "../photoAsk";
import { calGuess, dayAt, type CalRow } from "../plateCal";
import { plateCal, type CalInfo } from "./PlateCalendar";
import { ConfirmButton } from "../components/Confirm";
import { fitsPlate, isIngredient, swapKind, sameFoodName, suggestParts, bindsADish, isDrink, type Mix } from "../mixtip";
import { lettersOf, numbersOfTotals } from "../letters";
import { Letters, NumbersTable, type PlanNumbers } from "../components/Letters";
import { ClearField } from "../components/ClearField";
import { asMine, stemOf, type MemberFood } from "../memberFoods";
import { sameFood } from "../swaps";
import { oneList, rowLine } from "../oneList";
import { nutritionGate, dayGate, sizeOf, type GateLine, type GateWay } from "../gates";
import { jobOf } from "../foodjob";
import { WaitSteps, type WaitStep } from "../components/WaitSteps";
import { aggregate, density, uid, solveIngredient, servingLabel, sizedFor } from "../pilot";
import { fromMeal, plannedPortion, withDish, type PlannedMeal } from "../planned";
import { showPlanOn } from "./PlanScreen";
import { plateEnd } from "./PlateEnd";
import type { Meal, Food, Ingredient, PlateOpt, StepMark, Feedback } from "../pilot";
import { canOil, isDrained, libraryId, oilChoices, oilFood } from "../canned";
import { ownPhotosOf } from "../covers";
import { isLooseRef, recipePhotosOf, withRecipePhotos } from "../photos";
import { pairItems, partsOf, optAt, optToItem, itemToOpt, canLeaveOut, leanFood } from "../parts";
import { draftSteps } from "../draftSteps";
import { equipmentOf } from "../personal";
import { stepParts, stepText, TOKEN } from "../steps";
import { fmt, fixed, pdText, pdVal, pdTag, pdRange } from "../ui";
import { CHEF_NAME, COACH_NAME } from "../components/Mark";
import { log } from "../log";
import { iconFor } from "../icons";
import { quickPicks, macroPicks } from "../quick";
import { lineTotal } from "../labeltable";
import { SwipeRow } from "../components/SwipeRow";
import { dishTaste, goesInDish, heldBackLine, offerTaste, presetOf, bothPartOf, type PlateTaste } from "../dishTaste";
import { takenUpShort, capOil } from "../frying";
import { plural, yourPortions } from "../portions";
import { methodsFor } from "../methods";
import { rankSwaps } from "../swaps";
import { PlateHelper } from "../components/PlateHelper";
import { momentOf } from "../moments";
import { FoodCard } from "../components/FoodCard";
import { thumbnailBase64 } from "../utils/image";
import type { AppApi } from "./api";
import { inPlaces, basicsHere, placeName } from "../places";
import { referenceFood, foodName, foodV } from "../reference";
import { identityOf, basicOf } from "../foodId";
import { sameFoods as sameRecipeFoods, diffLine as recipeDiffLine, newNameFor } from "../recipeDiff";
import { dishesOf, dishNums, mealBar, roomFor, courseOf } from "../dishes";
import { mealShare, mealNow, routeOf, solveMeal, closedSlots, unloggedMeal, mealRange, aboveRange, missingOf, ABOVE_RANGE, QUICK_BASE, type Add } from "../makeMeal";
import { answersFor, setAnswer } from "../unlogged";
import { slotsOn, slotsOf, withTimeOn, slotAt, windowOf, toMin, type Slot } from "../slots";
import { lifestyleOf } from "../personal";
import { dayRecord } from "../record";
import { dayLog } from "../today";
import { ymd } from "../plan";
import { blockedByAllergy } from "../safety";
import { minPortionOf, portionOf as portionRange, portionLine, startGrams, mealScale, fitPart, factorWords } from "../foodjob";
import { tasteForChef } from "../kitchens";
import { PlateChef } from "../components/PlateChef";
import { resizeImageBase64 } from "../utils/image";
import { type InFlow } from "../components/RecipeIn";
import { useRecipeIn, RecipeInFlow, StartWays, mealFromRead, estimate } from "../components/RecipeInBlock";
import { changesOf, countItem, cleanSteps, scaleTo, onePortion, sideAmount, pdOf, realPortions, isYours, sideWord, MAX_SHOTS, kcalOfItems, sizedFits, roundGrams, type ReadRecipe, type SideKind } from "../recipeIn";
import { countOf } from "../recipeDelete";
import { foodNames, originalFoodsOf, diffFoods, diffLine } from "../stepsState";
import { OriginalSteps, StepsHint } from "../components/StepsView";
import { countOf as countedOf, gramsOfOne } from "../counted";
import { CountAmount, SizePicker, isCounted } from "../components/CountAmount";
import { cookName, cookPhrase, weighLine, aroundWord, aroundSaved, needsCooking, cookedFood, rawHint, cookTitle } from "../cookWords";
import { PairedCookMode } from "../components/CookPair";
import { stepPicOf, stepPicsOf, addStepPic, removeStepPic, firstStepPic, galleryOf, MAX_GALLERY } from "../photos";
import { kitchenName } from "../travel";
import { type CookUi, type Later, stripWords, resumeLine, cookStarted, plateSince, plateOldOf, whenWords, dayWord, dayIn, foodsLineIn, laterRow } from "../cooking";
import { ChefLine } from "../components/ChefLine";
import { PhotoPick } from "../components/PhotoPick";
import { CookStrip } from "../components/CookStrip";
import { plateChecks } from "./PlateChecks";
import { plateMealLine, type MealSet } from "./PlateMealLine";
import { plateRead } from "./PlateRead";
import { platePhotoWaits, platePhotoCard, PhotoSaid, HelpRead } from "./PlatePhoto";

// Make it a meal (0.2.9, canvas board CH, CH1 to CH3): an idea from Chef Mealan, checked and with the app's grams
// DT91 (0.2.88): cooking: the herbs and spices the dish uses, not counted; failed: the ideas that missed the range, with why
type MealOption = { kitchen: string; title: string; why: string; adds: { name: string; grams: number; have: boolean; base: boolean }[]; items: Ingredient[]; kcal: number; pd: number | null; cooking: string[] };
type Missed = { title: string; why: string; items?: Ingredient[]; kitchen?: string };
// DT245 (0.3.96): small, the ideas asked for anyway on a plate that already fills its meal
type ChefState = { status: "working"; small?: boolean } | { status: "done"; options: MealOption[]; tried: string[]; failed: Missed[]; small?: boolean } | { status: "none"; tried: string[]; failed: Missed[]; small?: boolean };
// a recipe from a screenshot or a link (0.2.16, board IM): Change the dish, or Add on the side
type SideOpt = { name: string; kind: SideKind; note: string; food: Food; grams: number; dish: Ingredient[]; yours: boolean };
// part and before (0.2.19, IM16): a change inside one part, and the plate before it, for Back to the original
// a change keeps the whole recipe as changed (0.2.23, IM23): its foods at the recipe's own size, and the steps drafted for it
type Drafted = { steps: string[]; marks?: StepMark[]; kitchen?: string; parts?: string[]; moves?: import("../pilot").StepMoves };
type Way = { kind: "change"; title: string; notes: string[]; part?: string; before?: Ingredient[]; whole?: Ingredient[]; drafted?: Drafted } | { kind: "side"; options: SideOpt[]; pick: number };
const readFile = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsDataURL(f); });

const STEPS = ["in", "recipe", "make", "made", "after"] as const;
// DT94 (0.2.88, board Stories60; Milan 24 October 13:58): three phases in place of five steps. Craft is the Plate and the steps
// (in, recipe, make), Make is making it (made), Feedback is How was it (after).
// DT211 v8 (0.3.53, board Stories158): the third step is Eat, everywhere
// DT230 (0.3.70, board Stories169; Coach Milan 2 and 3 November 23:44 to 00:05, Go 3 November 14:20): the Plate is Craft on
// paper, a step of its own, with no bar; Prepare it › starts the three steps: Prep (how to make it, or how to eat it), Make, Eat
const PHASES = ["Prep", "Make", "Eat"] as const;
const phaseOf = (n: number) => (n <= 3 ? 0 : n === 4 ? 1 : 2);
const phaseWord = (x: (typeof PHASES)[number]) => w(x === "Prep" ? "plate.phasePrep" : x === "Make" ? "plate.phaseMake" : "plate.phaseEat");
function stepHead({ n, title, sub, nameField, back, label, bare }: { n: number; title: string; sub?: string; back?: React.ReactNode; label?: string; bare?: boolean; nameField?: { value: string; placeholder: string; onChange: (v: string) => void; onCommit?: (v: string) => void; pen?: boolean } }) {
  const ph = phaseOf(n);
  // DT230: no bar on the Plate (in) nor on what Fit makes of it (recipe): the bar starts with Prep
  if (n <= 2) bare = true;
  // DT149 (0.2.130): planning or adding what you ate has no Make and no Feedback: one label in place of the three phases
  if (label && !bare) return (
    <div className="step-head">
      {back}
      <div className="phase-bar phase-one" aria-label={label}><span className="on"><i />{label.charAt(0).toUpperCase() + label.slice(1)}</span></div>
      {nameField ? <input className="title-input" aria-label={w("make.nameOfTheMeal")} value={nameField.value} placeholder={nameField.placeholder} onChange={(e) => nameField.onChange(e.target.value)} onBlur={(e) => nameField.onCommit?.(e.target.value)} /> : title ? <h2>{title}</h2> : null}
      {sub && <p>{sub}</p>}
    </div>
  );
  return (
    <div className="step-head">
      {back}
      {/* DT224 (0.3.60, board Stories165): an empty Plate is the start screen; Craft, Make, Eat once it holds something */}
      {!bare && <div className="phase-bar" aria-label={w("plate.phaseOf", { n: ph + 1, phase: phaseWord(PHASES[ph]) })}>{PHASES.map((x, i) => <span key={x} className={i <= ph ? "on" : ""}><i />{phaseWord(x)}</span>)}</div>}
      {/* DT308 (0.3.154, board Stories236): on an empty plate the title is a placeholder, Meal title, with a pencil that puts you in it */}
      {nameField?.pen ? <div className="title-row"><input className="title-input" aria-label={w("make.nameOfTheMeal")} value={nameField.value} placeholder={nameField.placeholder} onChange={(e) => nameField.onChange(e.target.value)} onBlur={(e) => nameField.onCommit?.(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} enterKeyHint="done" /><button type="button" className="icon title-pen" aria-label={w("plate.editTitle")} onClick={(e) => (e.currentTarget.previousElementSibling as HTMLInputElement | null)?.focus()}><Pencil size={18} /></button></div>
        : nameField ? <input className="title-input" aria-label={w("make.nameOfTheMeal")} value={nameField.value} placeholder={nameField.placeholder} onChange={(e) => nameField.onChange(e.target.value)} onBlur={(e) => nameField.onCommit?.(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} enterKeyHint="done" /> : <h2>{title}</h2>}
      {sub && <p>{sub}</p>}
    </div>
  );
}
const band = (pd: number | null) => (pd === null || pd < 3 ? "low" : pd < 5 ? "mid" : "high");
// DT243: a line with an element in it (a bold name, a link) is still one line: the element sits in its slot, so a language
// can move it. Plain values (text, numbers, a Val) fill as in w(); an element is put back where its slot lands.
function wx(k: WordKey, v: Record<string, Val | React.ReactNode>): React.ReactNode {
  const plain: Record<string, Val> = {}, els: Record<string, React.ReactNode> = {};
  for (const [s, x] of Object.entries(v)) { if (typeof x === "string" || typeof x === "number" || typeof x === "function") plain[s] = x as Val; else { plain[s] = `\u0000${s}\u0000`; els[s] = x; } }
  return w(k, plain).split(/\u0000(\w+)\u0000/).map((t, i) => (i % 2 ? <Fragment key={i}>{els[t]}</Fragment> : t));
}
// a list in a line: a, b and c
const andList = (xs: string[]) => (xs.length <= 1 ? xs.join("") : w("gates.and", { a: xs.slice(0, -1).join(", "), b: xs[xs.length - 1] }));

// sugars, saturates and salt on the plate, from the foods whose tables have them; for information only
function extrasText(items: { food: any; grams: number }[]): string | null {
  const parts = ([["sugars", "plate.gSugars"], ["saturates", "plate.gSaturates"], ["salt", "plate.gSalt"]] as const)
    .map(([key, word]) => { const v = lineTotal(items, key); return v === null ? null : w(word, { n: fmt(v) }); }).filter(Boolean);
  return parts.length ? `${parts.join(" · ")}${items.some((i) => !i.food.table?.length) ? ` · ${w("plate.fromFullTable")}` : ""}` : null;
}
function extras(items: { food: any; grams: number }[]) { const t = extrasText(items); return t ? <small className="readout-extra">{t}</small> : null; }
// R25 (0.2.53, board RS25): a meal above this, or above the whole day, is asked once before it is logged
const BIG_MEAL = 2000;
// draws what a later part of the same screen built (DT314: the calendar under the question for a plate from earlier)
function Late({ get }: { get: () => React.ReactNode }) { return <>{get()}</>; }

export function JourneyScreen(p: AppApi) {
  const { state: stateAll, setState, setTab, step, setStep, setCamera, setMode, blank, updateItem,
    setAdjustId, mixWith, options, pdRef, saveMeal, notify, setError, setFeedback, add } = p;
  // 0.3.157 (DT308.12, board Stories244): a photo whose foods joined a plate with foods (Add to my plate) does not make the
  // plate a photo's plate: the screen draws the one landing, the Plate with foods. The photo is kept beside it, for the
  // guess in the calendar when you say Ate it, and as the meal's photo when it is logged.
  const joinedPhoto = stateAll.photo?.joined ? stateAll.photo : null;
  const state = joinedPhoto ? { ...stateAll, photo: undefined } : stateAll;
  // DT214 (0.3.53): what Make and Eat collected lives with the cook, so leaving the Plate or closing the app loses nothing
  const ui0: CookUi = state.cook?.inView ? state.cook.ui ?? {} : {};
  const [q, setQ] = useState("");
  // the amounts before Fit: a mover that comes back unchanged means the plate was already above the target (0.2.7+r2)
  const [fitBefore, setFitBefore] = useState<Record<string, number> | null>(null);
  const [lineOpen, setLineOpen] = useState(false);
  const [scaleOpen, setScaleOpen] = useState(false); // DT338: the PD scale behind a tap on the Plate's number
  const [chef, setChef] = useState<ChefState | null>(null);
  // title0: the name the plate had before Chef Mealan's dinner went on it (DT90: a name you typed stays)
  const [madeBy, setMadeBy] = useState<{ kitchen: string; base: string; from: Ingredient[]; tried: string[]; title0: string } | null>(() => (ui0.madeBy as any) ?? null);
  // DT89 (0.2.87, board Stories58): the steps for a plate you cook that is no recipe yet, drafted on How to make it, kept at Save
  // DT150 (0.2.131): foods, the foods the steps were written for (ids), and its, the plate then: a change of amounts keeps the
  // steps (they never say an amount, C42); a change of foods makes them out of date
  const [plateSteps, setPlateSteps] = useState<{ steps: string[]; sig: string; foods?: string; its?: Ingredient[]; moves?: import("../pilot").StepMoves } | null>(() => (ui0.plateSteps as any) ?? null);
  const [plateDraft, setPlateDraft] = useState<string>("");
  const [ownSteps, setOwnSteps] = useState<string | null>(null);
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
        // DT93 (0.2.88): the moved food never goes past its portion; the line under it says what Fit did
        const mvItem = o.items.find((x) => x.id === moverId);
        const lim = mvItem ? portionRange(mvItem.food, mealX) : null;
        const want = Math.round(o.grams), got = lim ? Math.min(lim.max, Math.max(lim.min, want)) : want;
        const before = fitBefore?.[moverId] ?? mvItem?.grams ?? 0;
        const next = o.items.map((oi) => ({ ...oi, grams: oi.id === moverId ? got : oi.grams }));
        setState((s) => ({ ...s, items: next.map((oi) => { const cur = s.items.find((x) => x.id === oi.id); return cur ? { ...oi, locked: cur.locked } : oi; }), portion: null }));
        if (mvItem) { const nm = cookName(mvItem.food.name).short.toLowerCase();
          const tt = aggregate(next), pdNext = density(tt.protein, tt.calories);
          const same = Math.round(before) === got;
          setFit({ id: moverId, note: same && pdNext !== null && pdRef !== null && pdNext >= pdRef ? w("fit.alreadyAbove", { pd: pdText(pdNext), target: pdVal(pdRef) }) : got !== want ? w(mealX > 1 ? "fit.setMostMeal" : "fit.setMost", { grams: got, food: nm, want }) : before && before !== got ? w("fit.setWas", { grams: got, food: nm, was: Math.round(before) }) : w("fit.set", { grams: got, food: nm }), before: Math.round(before) }); }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);
  const [cap, setCap] = useState<number | null>(300);
  // DT93: what Fit did, under the food it moved, and Undo
  // DT150 (0.2.131): group, the grams before Fit sized a part as a whole, for Undo
  const [fit, setFit] = useState<{ id: string | null; note: string; before?: number; group?: Record<string, number> } | null>(null);
  // DT93: the culinary gate: Chef Mealan's read of the plate, once per set of foods
  const [dish, setDish] = useState<{ sig: string; status: "working" | "done" | "off"; makesIt?: boolean; why?: string; around?: string; betterAs?: string; holds?: string } | null>(null);
  const [pick, setPick] = useState(0);
  const [note, setNote] = useState(() => ui0.note ?? "");
  const [good, setGood] = useState<"daam" | "good" | "no" | null>(() => ui0.good ?? null);
  // DT211 v8: the final photo, The meal, the final look, taken on Make; Eat shows it
  const [plate, setPlate] = useState<string>(() => ui0.final ?? "");
  // DT211 v8: a photo on each step, by its place
  const [stepPhotos, setStepPhotos] = useState<Record<string, string>>(() => ui0.stepPhotos ?? {});
  // DT276 step 2 (0.3.129): the step picture shown large in Make's list
  const [picOpen, setPicOpen] = useState<{ k: number; src: string } | null>(null);
  // How did making it go? (Y1 column 9, 10 October 2026): photos while it's on the counter, how it went, how much was eaten
  const [photos, setPhotos] = useState<string[]>([]);
  const [went, setWent] = useState<"as" | "not">(() => ui0.went ?? "as");
  const [different, setDifferent] = useState(() => ui0.different ?? "");
  const [ate, setAte] = useState<"all" | "portion" | "later" | "not">(() => ui0.ate ?? "all");
  const [saveRecipe, setSaveRecipe] = useState(true);
  const [drinkIn, setDrinkIn] = useState(false);   // DT206
  // DT137 (0.2.122): at Save after you made a changed recipe: update it, a new one with its own name, or only this time
  const [recipeChoice, setRecipeChoice] = useState<"update" | "new" | "only" | null>(null);
  const [newRecipeName, setNewRecipeName] = useState<string | null>(null);
  const addPhoto = (file?: File | null) => { if (!file) return; const r = new FileReader(); r.onload = () => thumbnailBase64(String(r.result), 480).then((d) => setPhotos((x) => [...x, d])).catch(() => {}); r.readAsDataURL(file); };
  // R25 (0.2.53, board RS25): how many of a whole recipe were eaten, starting on one; a big meal is checked once
  const [eatN, setEatN] = useState(() => ui0.eatN ?? 1);
  const [bigAsk, setBigAsk] = useState(false);
  // DT81: how many the batch made, counted after cooking (null: as cooked); a new recipe's number, asked when it is saved
  const [madeN, setMadeN] = useState<number | null>(() => ui0.madeN ?? null), [keepMade, setKeepMade] = useState(() => ui0.keepMade ?? false);
  // null: not touched, so the Plate's own guess stands (about 3 of your meals: 3 portions); "": one plate
  const [newMakesN, setNewMakesN] = useState<string | null>(null), [newMakesUnit, setNewMakesUnit] = useState(""), [makesOpen, setMakesOpen] = useState(false);
  const resetMade = () => { setPhotos([]); setStepPhotos({}); setWent("as"); setDifferent(""); setAte("all"); setSaveRecipe(true); setDrinkIn(false); setEatN(1); setBigAsk(false); setMadeN(null); setKeepMade(false); setNewMakesN(null); setNewMakesUnit(""); setMakesOpen(false); };
  const [method, setMethod] = useState<string | null>(() => ui0.method ?? null);
  // after Add in the tip at the recipe step, Mealan refits with the new food on the plate
  const [refit, setRefit] = useState(false);
  useEffect(() => { if (refit) { setRefit(false); askMealan(); } }, [state.items.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const [title, setTitle] = useState(() => ui0.title ?? "");
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
  // DT102 (0.2.91): the dish goes, its cooking foods go with it
  const removeDish = (dishId: string) => setState((s) => ({ ...s, items: s.items.filter((i) => i.dish?.id !== dishId), portion: null, cooking: undefined, cookingFor: undefined }));
  const DishRow = ({ g }: { g: Extract<Group, { kind: "dish" }> }) => {
    const t = aggregate(g.items);
    return (
      <div className="row dish-row">
        <span className="dot dot-locked" aria-hidden="true" />
        <div className="row-text">
          <b>{g.title}</b>
          <small>{w("plate.dishRowLine", { pd: pdText(density(t.protein, t.calories)), kcal: fmt(t.calories, 0), protein: fmt(t.protein, 0) })}</small>
          <details className="dish-fold"><summary>{w("plate.ingredientsN", { n: g.items.length })}</summary>
            <ul>{g.items.map((i) => <li key={i.id}>{fmt(i.grams, 0)} g {i.food.name}</li>)}</ul>
            <button type="button" className="pill pill-small pill-danger-line" onClick={() => removeDish(g.id)}>{w("make.takeItOffThePlate")}</button>
          </details>
        </div>
        <div className="dish-portions" aria-label={w("plate.nOfPortions", { n: g.n, of: g.of })}>
          <button type="button" className="icon" aria-label={w("make.onePortionLess")} onClick={() => setPortions(g.id, g.n - 1)}>−</button>
          <b>{w("plate.nOf", { n: g.n, of: g.of })}</b>
          <button type="button" className="icon" aria-label={w("make.onePortionMore")} onClick={() => setPortions(g.id, g.n + 1)}>+</button>
        </div>
      </div>
    );
  };
  // Chef Mealan's tip (canvas S, 11 October 2026): when the plate is under the target, the three foods from My foods that lift
  // it most, a normal portion each, with the score the plate would reach.
  // DT101 (0.2.91): the tip asks the rules module the same question as the gate (fitsPlate: C20 who goes with whom, C21 a
  // spread's carrier, C6 no ingredient, no drink), then the dish's taste (C22), then ranks. The portion is the food's own start
  // amount (DT96), never 100 g of anything. One bar on the plate gets skyr or an apple, never a spoon of oil.
  const lifts = (list: typeof items) => {
    const t = aggregate(list); const cur = density(t.protein, t.calories);
    if (cur === null || pdRef === null || cur >= pdRef - 0.05) return null;
    // R9 (0.2.33): Chef Mealan offers only foods that go with the dish on the plate, a plate of your own too
    const dish = p.plateTaste ? offerTaste(p.plateTaste, null) : dishTaste(list.map((i) => i.food.name));
    const plate = list.map((i) => state.foods.find((x) => x.id === i.food.id) ?? i.food);
    const rows = state.foods.filter((f) => f.calories !== null && f.protein !== null && fitsPlate(f, plate) && goesInDish(dish, f.name)).map((f) => {
      const g = startGrams(f, mealX); const kcal = (t.calories ?? 0) + (f.calories! * g) / 100, pro = (t.protein ?? 0) + (f.protein! * g) / 100;
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
        <span>{w("plate.yourPlateUnder", { gap: pdVal(l.gap) })} {l.rows.length ? w(refit ? "plate.addOneRefits" : "plate.addOneToLift") : w("make.nothingInYourFoodsLifts")}</span>
        {l.rows.map((r) => (
          <div key={r.f.id} className="tip-row">
            <div className="tip-text"><b>{r.f.name}</b><small>{r.g} g · {pdText(density(r.f.protein, r.f.calories))}</small></div>
            <div className={`tip-to ${r.to >= pdRef! - 0.05 ? "fits" : ""}`}><b>{pdVal(r.to)}</b><small>{w("plate.thePlate")}</small></div>
            <button type="button" className="pill pill-small" onClick={() => addPortion(r.f, r.g, refit)}>{w("plate.plusAdd")}</button>
          </div>
        ))}
        {!l.reaches && <span className="tip-note">{l.rows.length ? `${w("plate.noneReaches", { target: pdVal(pdRef) })} ` : ""}{w("plate.forADishAsk")}</span>}
        {!l.reaches && <button type="button" className="pill pill-small" onClick={() => p.openOut("plate")}>{w("plate.askWhatToAdd")}</button>}
      </div>
    );
  };
  // a plate made for a slot (0.2.2): put it in, saved to My recipes once. A recipe with the same name, foods and amounts is
  // the same recipe, so coming back by Fit it on the Plate and putting it in again does not double it.
  const slotName = (f: NonNullable<typeof p.filling>) => `${f.dayName === "today" ? "today's" : `${f.dayName}'s`} ${f.name.toLowerCase()}`;
  // DT203 phase 9: the slot in a line's own language: today's lunch · ručak danas · ručak, četvrtak
  const slotV = (f: NonNullable<typeof p.filling>): Val => (l) => { if (l === "en") return slotName(f); const m = (mealV(f.name, true) as (x: typeof l) => string | null)(l); if (m === null) return null; return f.dayName === "today" ? `${m} ${wIn(l, "plate.todayLow") ?? ""}`.trim() : `${m}, ${new Date(`${f.date}T12:00:00`).toLocaleDateString(locOf(l), { weekday: "long" })}`; };
  // DT149 (0.2.130, board Stories101 version 2): the plate's day decides what it is for: the past adds what you ate, the future
  // plans, the moment is what you eat (src/plateMode.ts)
  const plateWhen = plateWhenOf(p.filling);
  const slotTitle = (f: NonNullable<typeof p.filling>) => capFirst(slotName(f));
  const slotTitleV = (f: NonNullable<typeof p.filling>): Val => (l) => { const t = (slotV(f) as (x: typeof l) => string | null)(l); return t === null ? null : capFirst(t); };
  // the slot's title as text, in the app's language when it has its words
  const slotTitleText = (f: NonNullable<typeof p.filling>) => { const l = getLang(); return (l !== "en" ? (slotTitleV(f) as (x: typeof l) => string | null)(l) : null) ?? slotTitle(f); };
  // a meal of a day gone by: what you ate, counted at that meal's time; nothing to fit, make or rate
  const addPast = () => {
    const f = p.filling; if (!f || !items.length) return;
    const title = (state.title || "").trim() && state.title !== "DaaM" ? state.title.trim() : autoTitle(items);
    p.logEaten(items, title, { date: f.date, slotId: f.slotId, name: f.name, time: f.time }, atMeal(f.date, f.time), f.mealId);
    setState((s) => ({ ...s, items: [], portion: null, title: "" }));
    p.setFilling(null); setStep("in"); setTab("plan"); notify(w("plate.isInEaten", { title, slot: slotV(f) }));
  };
  // DT137 (0.2.122, board Stories94; Milan 28 October 16:09 Go): a plate opened from a recipe and changed asks once: Update my
  // recipe, Save as a new recipe (its own name), or Only for this day. Before, it was saved as a second recipe with the same name
  const changedBase = (its: typeof items): Meal | null => {
    if (!its.length || its.some((i) => i.dish)) return null;
    const id = p.plateRecipeId ?? p.filling?.mealId ?? null;
    const base = id ? state.meals.find((m) => m.id === id) : undefined;
    if (!base || sameRecipeFoods(base.items, its) || !base.items.some((b) => its.some((i) => i.food.id === b.food.id))) return null;
    return base;
  };
  const [askChange, setAskChange] = useState<{ its: typeof items; name: string } | null>(null);
  const finishSlot = (choice: "update" | "new" | "only") => {
    const f = p.filling, ask = askChange; if (!f || !ask) return;
    const base = changedBase(ask.its); if (!base) { setAskChange(null); return; }
    const its = structuredClone(ask.its).map((i) => ({ ...i, locked: false }));
    const weight = its.reduce((n, i) => n + i.grams, 0), src = base.from === "coach" ? "coach" : "mine";
    const Slot: Val = (l) => { const t = (slotV(f) as (x: typeof l) => string | null)(l); return t === null ? null : t.charAt(0).toUpperCase() + t.slice(1); };
    if (choice === "update") {
      const upd: Meal = { ...base, items: its, portion: weight };
      setState((s) => ({ ...s, meals: s.meals.map((m) => (m.id === base.id ? upd : m)), items: [], portion: null, title: "" }));
      p.fill(f.date, f.slotId, fromMeal(upd, src));
      notify(w("plate.recipeUpdated", { title: base.title, slot: Slot }));
    } else if (choice === "new") {
      const name = ask.name.trim() && ask.name.trim().toLowerCase() !== base.title.toLowerCase() ? ask.name.trim() : newNameFor(base.title, base.items, its, state.meals.map((m) => m.title));
      const meal = { id: uid(), title: name, items: its, portion: weight, savedAt: new Date().toISOString(), basedOn: { id: base.id, title: base.title } } as Meal;
      setState((s) => ({ ...s, meals: [structuredClone(meal), ...s.meals], items: [], portion: null, title: "" }));
      p.fill(f.date, f.slotId, fromMeal(meal, "mine"));
      notify(w("plate.isSlotStays", { name, slot: slotV(f), title: base.title }));
    } else {
      const t = aggregate(its);
      p.fill(f.date, f.slotId, { ...fromMeal(base, src), kcal: Math.round(t.calories ?? 0), protein: Math.round(t.protein ?? 0), items: its, portion: weight, note: w("plate.changedForDay", { diff: recipeDiffLine(base.items, its) }) });
      setState((s) => ({ ...s, items: [], portion: null, title: "" }));
      notify(w("plate.slotHasChange", { slot: Slot, title: base.title }));
    }
    setAskChange(null); p.setFilling(null); setStep("in"); setTab("plan");
  };
  const ChangedAsk = () => {
    const base = changedBase(askChange!.its)!, its = askChange!.its, tn = aggregate(its), tw = aggregate(base.items);
    const pdNow = density(tn.protein, tn.calories), pdWas = density(tw.protein, tw.calories);
    const daysWith = Object.entries(p.planned).filter(([d, day]) => d >= ymd(new Date()) && Object.values(day).some((m) => m.mealId === base.id)).length;
    return (
      <section className="card changed-ask" aria-label={w("make.changedFromYourRecipe")}>
        <b>{w("plate.changedFromRecipe", { title: base.title })}</b>
        <small>{recipeDiffLine(base.items, its)}.{pdNow !== null && pdWas !== null ? ` ${w("plate.pdWas", { now: pdText(pdNow), was: pdVal(pdWas) })}` : ""}</small>
        <button type="button" className="pill pill-primary pill-wide" onClick={() => finishSlot("update")}>{w("make.updateMyRecipe")}</button>
        <small>{daysWith ? wn("plate.changesDaysFollow", daysWith, { title: base.title }) : w("plate.changes", { title: base.title })}</small>
        <button type="button" className="pill pill-wide" onClick={() => finishSlot("new")}>{w("make.saveAsANewRecipe")}</button>
        <label className="field"><span>{w("make.itsName")}</span><input value={askChange!.name} onChange={(e) => setAskChange({ ...askChange!, name: e.target.value })} /></label>
        <button type="button" className="pill pill-wide" onClick={() => finishSlot("only")}>{w("plate.onlyFor", { slot: p.filling ? slotV(p.filling) : wordV("plate.thisDay") })}</button>
        <small>{w("make.theRecipeStaysAsIt")}</small>
        <button type="button" className="link" onClick={() => setAskChange(null)}>{w("make.backToThePlate")}</button>
      </section>
    );
  };
  const putInSlot = (its: typeof items) => {
    const f = p.filling; if (!f) return;
    const changed = changedBase(its);
    if (changed) { setAskChange({ its, name: newNameFor(changed.title, changed.items, its, state.meals.map((m) => m.title)) }); return; }
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
    p.setFilling(null); setStep("in"); setTab("plan"); notify(w(found ? "plate.isSlot" : "plate.isSlotSaved", { title, slot: slotV(f) }));
  };
  const autoTitle = (its: typeof items) => { const n = its.map((i) => i.food.name.split(",")[0].trim()); return n.length <= 1 ? n[0] ?? w("meal.meal") : `${n.slice(0, -1).join(", ")} & ${n[n.length - 1]}`; };
  const [shareWhy, setShareWhy] = useState<"look" | "ok" | "help" | null>(null);
  const [helper, setHelper] = useState<{ missing: string | null; prefill?: string } | null>(null);
  // DT308.3 (0.3.154, board Stories236): on the empty Plate his icon opens his chat over the Plate; elsewhere on the Plate, the conversation
  const [chefOpen, setChefOpen] = useState(false);
  const chefHere = useRef(false);
  useEffect(() => { if (!p.mealanAsk) return; if (items.length > 0) setHelper({ missing: null }); else if (chefHere.current) setChefOpen(true); else p.openOut(); p.mealanAsked(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [p.mealanAsk]);
  // a "Not quite? Tell Mealan" from a mix tip opens the helper with the tip as the question's start
  useEffect(() => { if (p.mixQuestion) { setHelper({ missing: null, prefill: p.mixQuestion }); setCardId(null); p.mixQuestionTaken(); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [p.mixQuestion]);
  // the mix tip for a food on this plate; the card logs what it showed
  const mixProps = (food: typeof state.foods[number]) => {
    const tip = p.mixFor(food);
    return { tip, momentName: momentOf(p.moment).name, take: (m: Mix) => { setCardId(null); p.takeMix(food, m); }, ask: () => p.askAboutMix(food, tip) };
  };
  // DT102 (0.2.91): a plate emptied food by food drops the cooking foods too; they belong to a dish, not to the plate
  // The list is written for a set of foods (cookingFor); once one of them leaves the plate, or the list has no set (an older
  // state), the chips go. So they never carry over to the next plate.
  const cookingOn = Boolean(state.cooking?.length && state.cookingFor?.length && state.cookingFor.every((id) => state.items.some((i) => i.food.id === id)));
  useEffect(() => { if (state.cooking?.length && !cookingOn) setState((s) => ({ ...s, cooking: undefined, cookingFor: undefined })); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [cookingOn, state.cooking?.length]);
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
  const foodCard = cardItem && <FoodCard rates={p.rates} places={{ set: (x) => p.setFoodPlaces(cardItem.food.id, x), home: p.region }} food={state.foods.find((x) => x.id === cardItem.food.id) ?? cardItem.food} addPhoto={(d) => p.addFoodPhoto(cardItem.food.id, d)} toggleFavorite={() => p.toggleFavorite(cardItem.food.id)} insight={{ dayKcal: p.todayKcal, eaten: p.eatenTodayKcal, dayName: p.dayName, goalKey: p.tipGoalKey, requestTip: () => p.requestTip(cardItem.food.id), setJob: (j) => p.setFoodJob(cardItem.food.id, j) }} removePhoto={(i) => p.removeFoodPhoto(cardItem.food.id, i)} setMain={(i) => p.setMainPhoto(cardItem.food.id, i)} target={pdRef} fit={p.fitPd(density(cardItem.food.protein, cardItem.food.calories))} close={() => setCardId(null)} dontHave={() => { setHelper({ missing: cardItem.id }); setCardId(null); }} mix={mixProps(state.foods.find((x) => x.id === cardItem.food.id) ?? cardItem.food)} />;
  const helperSheet = helper && (
    <PlateHelper tastes={tasteForReq(p.personal.tasteChips, state.preferences)} safety={p.safety} ai={p.ai} onFlag={p.flagFromModel} items={items} library={state.foods} pdRef={pdRef} cap={cap ?? null} missing={helper.missing ? items.find((i) => i.id === helper.missing) ?? null : null} prefill={helper.prefill}
      setError={setError} close={() => setHelper(null)} record={p.recordTalk}
      context={() => { const d = dayLog(state.feedback, new Date()), a = aggregate(items), dayK = p.todayKcal ?? state.goals.calories ?? null, dayP = state.goals.protein ?? null;
        return { meal: mealSlot ? mealName(mealSlot.name) : null, time: mealSlot?.time ?? null, eatenKcal: d.kcal, eatenProtein: d.protein,
          leftKcal: dayK !== null ? dayK - d.kcal - (a.calories ?? 0) : null, leftProtein: dayP !== null ? dayP - d.protein - (a.protein ?? 0) : null }; }}
      apply={(next, note) => { setState((s) => ({ ...s, items: next, portion: null })); p.notify(note); if (step === "recipe") recalc(next); }} />
  );
  const adjustFor = (o: { items: typeof items }) => o.items.find((i) => !i.locked)?.id;
  // Mealan moves the food with the highest protein density; everything else keeps the amount you set.
  function askMealan() {
    log("fit_used");
    let ready = items.map((i) => ({ ...i, food: { ...i.food, readyToEat: true } }));
    if (ready.length === 1) {
      // DT337 (0.3.176, AC8): a food above the target's range gets a base from your foods, never a protein food: the base with a
      // PD under the target closest to it first; else, as before, the food with the most protein
      const pool = [...state.foods].filter((f) => f.id !== ready[0].food.id);
      function quickBase(f: Food) { return QUICK_BASE.test(f.name) && pdRef! - (density(f.protein, f.calories) ?? 99) > 0; }
      const byPd = (a: Food, b: Food) => (density(b.protein, b.calories) ?? -1) - (density(a.protein, a.calories) ?? -1);
      const partner = aboveRange(density(ready[0].food.protein, ready[0].food.calories), pdRef)
        ? pool.filter(quickBase).sort(byPd)[0]
        : pool.sort(byPd)[0];
      if (!partner) { setError(w("fit.addAFoodFirst")); return; }
      ready = [{ ...ready[0], locked: true }, { id: uid(), food: { ...partner, readyToEat: true }, grams: 100, locked: false }];
    }
    // C52 (DT150, 0.2.131, board Stories102): a plate in parts is a dish: Fit sizes a part as a whole and keeps its proportions
    if (pdRef !== null && partsOf(ready).length >= 2) {
      const r = fitPart(ready, pdRef, mealX);
      if (r) {
        const before = Object.fromEntries(ready.filter((i) => i.part === r.part && !i.locked).map((i) => [i.id, i.grams]));
        const names = ready.filter((i) => i.part === r.part && !i.locked).map((i) => cookName(i.food.name).short.split(/[,(]/)[0].trim().toLowerCase());
        const others = partsOf(ready).filter((x) => x !== r.part).map((x) => x.toLowerCase());
        setState((s) => ({ ...s, items: r.items, portion: null }));
        setFit({ id: null, group: before, note: r.factor === 1 ? w("fit.keptPart", { part: r.part.toLowerCase() }) : `${wn("fit.sizedPart", others.length, { part: r.part.toLowerCase(), factor: factorWords(r.factor), names: andList(names), others: andList(others) })}${!r.reached ? ` ${w("fit.asFarAsPortions")}` : r.whole ? ` ${w("fit.roundedTo", { whole: r.whole })}` : ""}` });
        return;
      }
    }
    // DT93: Fit moves the densest free food, within its portion, even one you typed: Fit is the ask to move it
    const mover = moverOf(ready);
    if (mover) setTouched((tk) => { const n = new Set(tk); n.delete(mover.id); return n; });
    setFitBefore(Object.fromEntries(ready.map((i) => [i.id, i.grams])));
    // DT93 (0.2.88): Fit works in place, on the Plate; nothing moves to a second step
    if (!mover) { setState((s) => ({ ...s, items: ready, portion: null })); setFit({ id: null, note: w("make.everyFoodIsKeptSo") }); return; }
    setState((s) => ({ ...s, items: ready, foods: s.foods.map((f) => ready.some((x) => x.food.id === f.id) ? { ...f, readyToEat: true } : f) }));
    setAdjustId(mover.id); setPick(0);
    const forSolver = ready.map((i) => (i.id === mover.id ? i : { ...i, locked: true }));
    setTimeout(() => { if (!mixWith(forSolver, mover.id)) setFit({ id: mover.id, note: w("fit.noAmountReaches", { food: cookName(mover.food.name).short.toLowerCase(), target: pdVal(pdRef) }) }); }, 0);
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
    p.setPick(null); p.setPlateTaste(null);
    setMadeBy(null); setChef(null); setWay(null);
    setState((s) => ({ ...s, items: [], portion: null, fromRecipe: undefined, recipeFoods: undefined, optional: undefined, leftOut: undefined, emptyParts: undefined, cooking: undefined, cookingFor: undefined, photo: undefined }));
    setPartsMode(false); setStep("in"); setPhotoBig(true);
  }
  // DT82: None takes the can's oil off; A spoon or All puts it on, after the can, locked, so Fit never moves it
  const setCanOil = (can: Ingredient, grams: number) => setState((s) => {
    const rest = s.items.filter((x) => x.from !== can.id);
    const f = grams > 0 ? oilFood(can.food, uid) : null;
    if (!f) return { ...s, items: rest, portion: null };
    const at = rest.findIndex((x) => x.id === can.id);
    const oil: Ingredient = { id: uid(), food: f, grams, locked: true, from: can.id, ...(can.part ? { part: can.part } : {}) };
    return { ...s, items: [...rest.slice(0, at + 1), oil, ...rest.slice(at + 1)], portion: null };
  });
  function remove(id: string) {
    // DT82: the oil from a can goes with the can
    const rest = items.filter((i) => i.id !== id && i.from !== id);
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
    const was = items.find((i) => i.id === id)?.food.id;
    // DT109: a swap keeps the recipe's link; the new food takes the old one's place among the recipe's foods
    setState((s) => ({ ...s, items: next, portion: null, ...(s.recipeFoods && was ? { recipeFoods: s.recipeFoods.map((x) => (x === was ? food.id : x)) } : {}) }));
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
  const quick = quickPicks(state.foods.filter(p.inPlace), state.feedback);
  // DT308: three of your foods for each macro, the most used first
  const macro = macroPicks(state.foods.filter(p.inPlace), state.feedback);
  // DT115 (0.2.97): the swap list reaches the members' catalogue after your own foods: the same food in another state leads
  // (tuna in water for tuna in olive oil), only foods seen in your market or with a barcode (the same tin everywhere)
  const [swapMf, setSwapMf] = useState<{ id: string; foods: Food[] }>({ id: "", foods: [] });
  useEffect(() => {
    const it = swapId ? items.find((i) => i.id === swapId) : null;
    if (!it) { setSwapMf({ id: "", foods: [] }); return; }
    let gone = false;
    p.memberFoods(stemOf(it.food.name)).then((ms) => { if (gone) return;
      const ok = ms.filter((m) => m.barcode || !p.region || (m.seenIn ?? []).includes(p.region)).filter((m) => !state.foods.some((f) => (m.barcode && f.barcode === m.barcode) || f.name.toLowerCase() === m.name.toLowerCase()));
      setSwapMf({ id: it.id, foods: ok.map((m) => ({ ...asMine(m, uid), id: `mf:${m.key}`, notes: `${(m as MemberFood).brand ? `${m.brand} · ` : ""}a member's food` })) }); });
    return () => { gone = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swapId]);
  // DT148 (0.2.129, board Stories100 version 2, C51): the swap list is your foods sold where you are, the members' foods seen
  // there, and the basic foods sold there that are not yours yet (ids ref:); one of those joins your foods when picked
  const mineHere = state.foods.filter(p.inPlace);
  const swapBasics: Food[] = !swapId ? [] : (() => {
    const ids = new Set(mineHere.map((f) => identityOf(f))), refs = new Set(state.foods.map((f) => basicOf(f)?.id).filter(Boolean));
    return basicsHere(p.placesActive).filter(({ ref }) => !refs.has(ref.id)).map(({ ref, place }) => ({ ...referenceFood(ref, p.region, uid), id: `ref:${ref.id}`, places: place ? [place] : [] }) as Food)
      .filter((f) => !ids.has(identityOf(f)) && !state.foods.some((m) => sameFoodName(m.name, f.name)));
  })();
  const [swapMore, setSwapMore] = useState(false);
  // DT148 (0.2.129, board Stories100 version 2; Tester 3 removed Quark and had to scroll to the bottom to add a food): + Add a
  // food sits right under the last food and opens the search there: your foods first, then the basic foods sold where you shop
  // DT308 Release 2 (0.3.155, board Stories238, DT308.7): + Add more to your plate opens the tiles and the list in place
  const [moreOpen, setMoreOpen] = useState(false);
  // 0.3.157 (DT308.1): the calendar behind the pencil: the day it shows, and More (the date field)
  const [lineDay, setLineDay] = useState<string | null>(null);
  const [lineMore, setLineMore] = useState(false);
  // 0.3.157 (DT308.4 to DT308.6, DT308.11): the calendar under Plan it or Ate it (on the plate, on a read) or under Save
  // on Eat: which one, the day it shows, More, and the meal a question is open under (a meal that already holds something)
  // DT308.12 (0.3.157, board Stories245): a recipe read from Recipe photo or Recipe link, about to land on a plate with foods
  const [recipeAsk, setRecipeAsk] = useState<Extract<InFlow, { kind: "read" }> | null>(null);
  // the old plate's photo, for Undo (kept in memory only: a photo is never written into the saved state twice)
  const oldPhoto = useRef<typeof state.photo>(undefined);
  const eatSlot = useRef<{ slot: Feedback["slot"] | null } | null>(null);
  const [endCal, setEndCal] = useState<{ kind: "plan" | "ate"; day: string; more: boolean; ask?: { date: string; id: string | null } | null; old?: boolean } | null>(null);
  // B151 (0.3.171): the meal the pencil just set already holds a dish, so the block asks: Replace it, or Add a dish. And
  // whether No meal selected just took the plate out again, for the line that says so
  const [liveAsk, setLiveAsk] = useState<{ date: string; id: string; holds: string } | null>(null);
  const [liveBack, setLiveBack] = useState(false);
  // DT150: No, separate foods, for these foods
  const [dishNo, setDishNo] = useState("");
  useEffect(() => setSwapMore(false), [swapId]);
  // the same food in another state: the difference per portion, said plainly (95 kcal less per can, the same protein)
  const swapDiff = (f: Food) => {
    const it = swapId ? items.find((i) => i.id === swapId) : null; if (!it || !sameFood(f.name, cookName(it.food.name).short) || f.calories === null || it.food.calories === null) return "";
    const g = it.grams, dk = Math.round(((it.food.calories - f.calories) * g) / 100), dp = Math.round(((f.protein ?? 0) - (it.food.protein ?? 0)) * g) / 100;
    const per = it.food.serving?.name ? w("plate.perPiece", { piece: it.food.serving.name }) : w("plate.perPortion");
    const kcal = dk > 5 ? w("plate.kcalLessPer", { kcal: dk, per }) : dk < -5 ? w("plate.kcalMorePer", { kcal: -dk, per }) : w("plate.aboutSameEnergy");
    const prot = Math.abs(dp) < 2 ? w("plate.sameProtein") : dp > 0 ? w("plate.gMoreProtein", { n: Math.round(dp) }) : w("plate.gLessProtein", { n: Math.round(-dp) });
    return ` · ${w("plate.sameFoodOtherState", { food: stemOf(it.food.name), kcal, prot })}`;
  };
  // for a slot (canvas S, 11 October 2026) the meal's name is the title, typed in place; the foods' name until then
  // the head is a plain function, not a component made on every render: a component made inside the screen is a new type each
  // time, React remounts it and the name field loses focus after one letter (Milan, 11 October 2026)
  // which meal the plate is for, and how big it is: what is left of the day over the meals still to come (0.2.9, a rule)
  // 0.3.157 (DT308.1, Go 18 November 11:14): no meal is guessed. A plate is for a meal only when you set one: with the pencil
  // (today's meal: pick; a meal of another day: filling), from Plan (filling), or for a photo of another day after Ate it
  // (photo.meal). With nothing set the plate is sized for no meal and nothing is counted or planned.
  const photoPick = !p.filling && !p.pick && state.photo?.meal ? state.photo.meal : null;
  const unset = !p.filling && !p.pick && !photoPick;
  const todayKey = ymd(new Date()), mealDate = p.filling?.date ?? photoPick?.date ?? todayKey;
  const daySlots = slotsOn(lifestyleOf(p.personal), p.personal.timesOn, mealDate);
  const dayRec = dayRecord(daySlots, p.planned[mealDate], mealDate === todayKey ? dayLog(state.feedback, new Date()).logged : [], mealDate);
  // which meals are done (0.2.12, board MS): a plate off the plan closes the meal nearest its time; I skipped it closes too
  const [answers, setAnswers] = useState(() => answersFor(todayKey));
  const closed = mealDate === todayKey ? closedSlots(daySlots, dayRec, answers) : new Set([...dayRec.eaten.map((f) => f.slot!.slotId), ...dayRec.skipped.map((x) => x.id)]);
  // R11 (0.2.37, board RS8): what the plate is for. A meal picked in the line's section sizes the plate and counts by the plan;
  // Exploring and a snack off the plan size nothing; with nothing picked, the meal the clock is in, shown as a guess
  const pickSlot = !p.filling && p.pick?.startsWith("meal:") ? daySlots.find((x) => x.id === p.pick!.slice(5)) ?? null : null;
  const unsized = !p.filling && (p.pick === "exploring" || p.pick === "snack" || unset || (!!photoPick && photoPick.slotId === null));
  // DT130 (0.2.110): a plate read from a photo you ate earlier belongs to a meal of the photo's day. 0.3.157: the meal you
  // tapped after Ate it, never the one the photo's time falls in
  const photoMeal = (() => {
    if (!photoPick || !photoPick.slotId) return null;
    const s = daySlots.find((x) => x.id === photoPick.slotId);
    return s ? { date: photoPick.date, slot: s } : null;
  })();
  // DT241 (0.3.96): a plate read from a photo of a dish as it is served (not an idea, not a recipe's foods)
  const finishedDish = !!state.photo && state.photo.who !== "idea" && !state.fromRecipe;
  // 0.2.121: the meal you picked comes before the photo's time and the clock
  const mealSlot = p.filling ? daySlots.find((x) => x.id === p.filling!.slotId) ?? null : unsized ? null : pickSlot ?? photoMeal?.slot ?? mealNow(daySlots, closed, new Date());
  const dayNums = p.numbersFor(new Date(`${mealDate}T12:00:00`));
  const shareBase = mealSlot && dayNums ? mealShare(daySlots, mealSlot.id, { kcal: dayNums.kcal, protein: dayNums.protein }, mealDate === todayKey ? { kcal: dayRec.kcal, protein: dayRec.protein } : { kcal: 0, protein: 0 }, closed) : null;
  // DT247 (0.3.96, board Stories183): the dishes already eaten at this meal. The meal's size is what it was before any of them;
  // this dish has the room the others leave, as they are (Fit works on this dish only). DT246: the plate's own record counts
  // once, as this dish, not as a meal eaten.
  const ownRecord = p.recordNow?.cardId ?? null;
  const hereDishes = mealSlot && !p.filling && mealDate === todayKey && items.length > 0 ? dishesOf(state.feedback, mealDate, mealSlot.id, null) : [];
  const otherDishes = hereDishes.filter((f) => f.id !== ownRecord);
  const hereNums = hereDishes.map((f) => dishNums(f.meal.items)), otherNums = otherDishes.map((f) => dishNums(f.meal.items));
  const wholeMeal = mealSlot && dayNums && hereDishes.length ? mealShare(daySlots, mealSlot.id, { kcal: dayNums.kcal, protein: dayNums.protein },
    { kcal: Math.max(0, dayRec.kcal - hereNums.reduce((n, d) => n + d.kcal, 0)), protein: Math.max(0, dayRec.protein - hereNums.reduce((n, d) => n + d.protein, 0)) }, closed) : null;
  const share = wholeMeal ? roomFor(wholeMeal.kcal, otherNums, wholeMeal.protein) : shareBase;
  // a dish's size is judged against the meal's size, never against the room left (a dessert after a big main stays a dessert)
  const sizeRef = wholeMeal ? wholeMeal.kcal : share?.kcal;
  // DT135 (0.2.116): how many times a meal of three a day this meal is, 1 to 3; every food's most grows by it
  const mealX = mealScale(share?.kcal, dayNums?.kcal);
  useEffect(() => { p.setMealScale?.(mealX); }, [mealX]);
  // DT206: a plate of drinks only is no meal to build around
  const onlyDrinks = items.length > 0 && items.every((i) => isDrink(i.food));
  const chefable = p.kind !== "dessert" && momentOf(p.moment).planned && !!share && share.kcal >= 150 && p.filling?.mode !== "eat" && !onlyDrinks;
  // DT93, rule 3 (C31): a plate far over its meal is not that meal yet; DT132 (0.2.113): over 1.5 portions, 1.3 to 1.5 on the edge
  const sizeNow = sizeOf(aggregate(state.items).calories ?? 0, sizeRef);
  const tooBig = !!share && !state.fromRecipe && sizeNow.big;
  const sizeEdge = !!share && !state.fromRecipe && sizeNow.edge;
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
  const mealW = mealV(mealWord, true), MealW = mealV(mealWord);
  // DT243: the meals in the plural and counted, in the language chosen; a slot named otherwise keeps the English s
  const mealKey = ["breakfast", "lunch", "snack", "dinner", "meal"].includes(mealWord) ? mealWord : null;
  const mealsW = mealKey ? w(`plate.mealsOf.${mealKey}` as WordKey) : plural(mealWord);
  const nMeals = (k: number) => (mealKey ? wn(`plate.nMeals.${mealKey}` as WordKey, k) : `${k} ${k === 1 ? mealWord : plural(mealWord)}`);
  // R11 (0.2.37): the line says what the plate is for; the section's chips and their hint
  const capName = (n: string) => n.charAt(0).toUpperCase() + n.slice(1);
  const numsOf = share ? w("plate.numsOf", { kcal: fmt(share.kcal, 0), protein: fmt(share.protein, 0), pd: pdText(pdRef) }) : "";
  const kindPart = items.some((i) => i.dish) ? ` · ${w("plate.aDish")}` : "";
  const momentPart = p.moment !== "regular" ? ` · ${w(`moment.${p.moment}` as WordKey)}` : "";
  // 0.3.157 (DT308.1, DT308.9): what the meal line says once a meal is set; null: Meal and day not set
  const mealSet: MealSet | null = p.filling ? { name: p.filling.name, date: p.filling.date, time: p.filling.time, plan: plateWhen === "plan" }
    : pickSlot ? { name: pickSlot.name, date: todayKey, time: pickSlot.time }
    : p.pick === "snack" ? { name: "Snack", date: todayKey, time: null }
    : photoPick ? { name: photoMeal?.slot.name ?? "Snack", date: photoPick.date, time: photoMeal?.slot.time ?? null } : null;
  // what the calendar needs of a day: its meals, what was eaten in each, what the plan holds
  const calInfo = (date: string): CalInfo => {
    const slots = date === mealDate ? daySlots : slotsOn(lifestyleOf(p.personal), p.personal.timesOn, date);
    const eaten: Record<string, string[]> = {};
    for (const f of state.feedback) if (f.status === "eaten" && f.slot?.date === date && f.id !== (p.recordNow?.cardId ?? null)) (eaten[f.slot.slotId] ??= []).push(f.meal.title);
    return { slots, eaten, planned: p.planned[date] };
  };
  const fillingOn = (date: string, sl: Slot): NonNullable<typeof p.filling> => ({ date, slotId: sl.id, name: sl.name, time: sl.time, dayName: date === todayKey ? "today" : new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long" }) });
  // B150 (0.3.160, board B150): a tap on a meal in edit mode sets the meal and the day together, saved at once; edit mode
  // stays open, and the X closes it. One meal is set at a time: the others (a meal of today, of another day, a photo's) go.
  const setMealFromLine = (date: string, r: CalRow) => {
    if (state.photo?.meal) setState((s) => (s.photo ? { ...s, photo: { ...s.photo, meal: undefined } } : s));
    if (date === todayKey) { if (p.filling) p.setFilling(null); p.setPick(r.id ? `meal:${r.id}` : "snack"); }
    else { const sl = calInfo(date).slots.find((x) => x.id === r.id); if (!sl) return; if (p.pick) p.setPick(null); p.setFilling({ ...fillingOn(date, sl), by: "line" }); }
    setLineDay(date);
    // B151: the tap is the whole decision. The plate counts in that meal or goes into the plan, by the clock
    liveTap(date, r.id ? calInfo(date).slots.find((x) => x.id === r.id) ?? null : null);
  };
  // the row No meal selected: the meal and the day are off again; the moment is Regular meal again. Edit mode stays open.
  const clearMeal = () => {
    // B151 AC8: No meal selected takes the plate out of the meal, or out of the plan, again
    if (liveRec || livePlan) { liveUndo(); setLiveBack(true); } setLiveAsk(null);
    if (p.filling) p.setFilling(null); if (p.pick) p.setPick(null);
    if (state.photo?.meal) setState((s) => (s.photo ? { ...s, photo: { ...s.photo, meal: undefined } } : s));
    p.setMoment("regular");
  };
  // B150: the set meal's time, for this meal on this day only (the usual times in Slots and times stay as they are)
  const setMealTime = (date: string, slotId: string, time: string) => {
    const usual = slotsOf(lifestyleOf(p.personal)).find((x) => x.id === slotId)?.time ?? "";
    p.setPersonal({ ...p.personal, timesOn: withTimeOn(p.personal.timesOn, date, slotId, time, usual) });
    if (p.filling && p.filling.date === date && p.filling.slotId === slotId) p.setFilling({ ...p.filling, time });
    // B151 AC4: a new time for the set meal decides again: now or earlier counts at that time, still ahead is a plan
    const sl = liveBase && liveSet && liveSet.date === date ? liveSlot : null;
    if (sl && sl.id === slotId && items.length > 0) {
      const next = liveStatus({ date, time }, todayKey, minutesOf(new Date()));
      if (next === "eaten" || liveIs !== next) liveCommit(date, sl, time, livePlan?.add ? "add" : "set");
    }
  };
  // B150: edit mode opens on the set meal's day, else on the photo's day, else on today
  const photoDay = state.photo && !state.photo.joined ? ymd(new Date(state.photo.at)) : null;
  const lineDayNow = lineDay ?? mealSet?.date ?? photoDay ?? todayKey;
  const lineMarked = p.filling ? { date: p.filling.date, id: p.filling.slotId } : pickSlot ? { date: todayKey, id: pickSlot.id } : p.pick === "snack" ? { date: todayKey, id: null } : photoPick ? { date: photoPick.date, id: photoPick.slotId } : null;
  const photoRef = (() => { const ph = state.photo; if (!ph || ph.joined) return undefined; const d = new Date(ph.at);
    return w(ph.atSaved ? "plate.photoSavedOn" : "plate.photoTakenOn", { day: d.toLocaleDateString(locOf(getLang()), { weekday: "long" }), time: hhmm(d) }); })();
  // ---- a recipe from screenshots or a link (0.2.16, canvas board IM) ----
  // R6 (0.2.43): the read is the shared block, the same as on Recipes
  const recipeIn = useRecipeIn({ kitchens: p.personal.kitchens ?? [], region: p.region, onError: (m) => setError(m), pdRef, fitPd: p.fitPd });
  const { inFlow, setInFlow } = recipeIn;
  // 0.3.157: two effects of the meal model. They stand here, with the screen's other effects and before any early return.
  // DT308.11 (Save it): a name typed on top after Save it renames the recipe it made, while the plate is still as saved
  const savedSig = stateAll.items.map((i) => `${i.food.id}:${Math.round(i.grams)}`).join("|");
  const savedNowId = stateAll.photo?.saved ?? (stateAll.savedPlate && stateAll.savedPlate.sig === savedSig ? stateAll.savedPlate.id : undefined);
  useEffect(() => { const t = stateAll.title && stateAll.title !== "DaaM" ? stateAll.title.trim() : ""; if (!t || !savedNowId) return; const m = stateAll.meals.find((x) => x.id === savedNowId); if (m && m.title !== t) p.renameMeal(savedNowId, t); }, [stateAll.title, savedNowId]); // eslint-disable-line react-hooks/exhaustive-deps
  // DT308.12n: the line about the plate that was there goes with the plate it speaks of: an emptied plate has none
  useEffect(() => { if (stateAll.oldPlate && stateAll.items.length === 0 && !stateAll.photo && !inFlow) setState((s) => (s.oldPlate ? { ...s, oldPlate: undefined } : s)); }, [stateAll.oldPlate, stateAll.items.length, stateAll.photo, inFlow]); // eslint-disable-line react-hooks/exhaustive-deps
  // R15 (0.2.41, board RS12): "whole" is the recipe as mapped, where a recipe starts on the plate
  const [pmode, setPmode] = useState<"whole" | "sized" | "recipe">(() => ui0.pmode ?? "sized");
  const [way, setWay] = useState<Way | null>(() => (ui0.way as Way) ?? null);
  const [wayBusy, setWayBusy] = useState<string | null>(null);
  // R10 (0.2.36): the wait for Change the recipe: the slow line, and what stops it (Stop, or the minute)
  const [waySlow, setWaySlow] = useState(false);
  const wayStop = useRef<AbortController | null>(null), wayStopWhy = useRef<"time" | null>(null);
  // Parts on the plate (0.2.19, IM18): each food gets a part and can be optional; new parts wait here until a food has one
  const [partsMode, setPartsMode] = useState(false);
  // How to make it (0.2.20, boards IM19, IM19b, IM19c, IM20): what you make, the draft on this step, the checklist ticks
  const [makeAll, setMakeAll] = useState<boolean | null>(() => ui0.makeAll ?? null);
  const [mkDraft, setMkDraft] = useState<"" | "working" | string>("");
  const [ticks, setTicks] = useState<Set<string>>(() => new Set(ui0.ticks ?? []));
  // DT174 (0.3.16): cook mode over Make, full screen
  // DT211 v8 (0.3.53): Start cooking on the recipe opens cook mode straight away (ui.open, once)
  const [cooking, setCooking] = useState(() => !!(ui0 as { open?: boolean }).open);
  // DT175 (0.3.17): Say what you have, on the Plate
  const [newParts, setNewParts] = useState<string[]>([]);
  const [naming, setNaming] = useState<string | null>(null);
  const [tried, setTried] = useState<"yes" | "ok" | "no" | null>(() => ui0.tried ?? null);
  // steps drafted on How to make it in this meal: the recipe page opens after How was it (0.2.23, IM23c)
  const [mkDrafted, setMkDrafted] = useState(false);
  // CT4, CT5 (0.2.24): the size of a counted food, open under its row
  const [sizeOpen, setSizeOpen] = useState<string | null>(null);
  // RP1c (0.2.25): Chef Mealan's steps or the original on How to make it
  const [mkView, setMkView] = useState<"own" | "orig">("own");
  // DT250 (0.3.99): a recipe shows, and is cooked, in the language it shows in on its page
  const recLang = useLang();
  const rec = (() => { const m = state.fromRecipe ? state.meals.find((x) => x.id === state.fromRecipe) : undefined; return m ? shownMeal(m, recLang) : undefined; })();
  // DT109 (0.2.93, board Stories66; Milan 23:34: chicken and rice locked as the fritters): the link to a recipe lives only
  // while at least half of its foods are on the plate. Under that, the link goes, with its optional and left-out foods, and a
  // toast says so. A plate linked before 0.2.93 has no recipeFoods: the recipe's own foods count.
  const recipeFoodIds = rec ? (state.recipeFoods ?? rec.items.filter((i) => !i.optional).map((i) => i.food.id)) : [];
  // a part left out (IM16b) holds its foods aside, Put it back brings them: they still count as on the plate
  const onPlateIds = new Set([...state.items.map((i) => i.food.id), ...(state.leftOut ?? []).flatMap((l) => l.items.map((i) => i.food.id))]);
  const recipeStillOn = !rec || recipeFoodIds.length === 0 || recipeFoodIds.filter((id) => onPlateIds.has(id)).length * 2 >= recipeFoodIds.length;
  useEffect(() => {
    if (!rec || recipeStillOn || wayBusy) return;
    const title = rec.title;
    setWay(null); setPmode("sized");
    setState((s) => ({ ...s, fromRecipe: undefined, recipeFoods: undefined, optional: undefined, leftOut: undefined, emptyParts: undefined, title: s.title === title ? "" : s.title }));
    notify(w("plate.noLonger", { title }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeStillOn, rec?.id, wayBusy]);
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
  // DT125 (0.2.104): the Plate's search is the one list: your foods by any of their names, then members' and basic foods
  const [plateMf, setPlateMf] = useState<{ q: string; foods: MemberFood[] }>({ q: "", foods: [] });
  useEffect(() => {
    const w = q.trim(); if (w.length < 2) { setPlateMf({ q: "", foods: [] }); return; }
    const t = window.setTimeout(async () => { const foods = await p.memberFoods(w); setPlateMf({ q: w, foods }); }, 350);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);
  // DT136 (0.2.120): your place's foods, and members' foods seen where you are
  const plateList = q.trim() ? oneList({ q: q.trim(), mine: state.foods.filter(p.inPlace), members: (plateMf.q === q.trim() ? plateMf.foods : []).filter((m) => inPlaces(m.seenIn, p.placesActive)), db: [], region: p.region, uid, basics: 4 }) : null;
  const matches = plateList ? plateList.rows.filter((r) => r.kind === "mine").map((r) => r.food).slice(0, 60) : [];

  // R22 (0.2.50, board RS21): what is offered follows What is it?, on a plate of your own too; nothing picked, the recipe's taste
  const shownTaste = p.plateTaste ?? presetOf(recipeTaste);
  const plateTasteOf = offerTaste(p.plateTaste, recipeTaste);
  // DT148: the swap list, after the plate's taste is known (it holds back what the dish rejects, C22)
  const swapPool = [...mineHere, ...(swapId && swapMf.id === swapId ? swapMf.foods : []), ...swapBasics].filter((f) => goesInDish(plateTasteOf, f.name));
  // C52: in a dish an egg, flour or butter is cooked into it: who goes with whom reads the other foods
  const swapInDish = items.some((i) => bindsADish(i.food)) && (partsOf(items).length >= 2 || items.length >= 3);
  const swapCandidates = !swapId || pdRef === null ? [] : rankSwaps(items, swapId, swapPool, pdRef, cap ?? null, undefined, (f, plate) => fitsPlate(f, swapInDish ? plate.filter((x) => !bindsADish(x)) : plate), swapKind, sameFoodName);
  const swapGone = swapId ? items.find((i) => i.id === swapId) : null;
  // a plate already at its target without the food: any swap keeps it there, at the same amount
  // 0.3.65 (Coach Milan 22:50, Go): a food read from a photo, or a plate that is not sized (Exploring, a meal you ate), swaps at
  // the same grams: the swap fixes what the food is; there is nothing to reach
  const swapKeeps = !!swapGone && (!!swapGone.est || p.pick === "exploring" || unset || state.photo?.who === "idea" || (!!p.filling && plateWhen === "past"));
  const restAbove = (() => { if (swapKeeps) return true; if (!swapGone || pdRef === null) return false; const t = aggregate(items.filter((i) => i.id !== swapGone.id)); const d = density(t.protein, t.calories); return d !== null && d >= pdRef; })();
  const swapPick = (f: Food, grams: number | null, fits: boolean) => {
    const joins = /^(ref|mf):/.test(f.id), mine = joins ? { ...f, id: uid(), reviewedAt: new Date().toISOString() } : f;
    if (joins) setState((s) => ({ ...s, foods: [mine, ...s.foods] }));
    // a plate at its target without the food keeps the amount; else the grams that bring it there
    if (restAbove) swap(swapId!, mine, swapGone!.grams, true); else swap(swapId!, mine, fits ? grams : grams !== null ? Math.min(grams, cap ?? 300) : null, fits);
  };
  const swapRow = ({ f, grams, fits }: { f: Food; grams: number | null; fits: boolean }) => (
    <button className="row row-food row-button" key={f.id} onClick={() => swapPick(f, grams, fits)}>
      <span className="thumb thumb-sm">{f.photo ? <img src={f.photo} alt="" /> : f.id.startsWith("ref:") ? "📘" : (f.icon || iconFor(f.name))}</span>
      <div className="row-text"><b>{f.name}</b><small>{f.id.startsWith("ref:") ? `${f.places?.length ? w("plate.basicFoodSoldIn", { place: placeName(f.places[0]) }) : w("plate.basicFood")} · ` : f.id.startsWith("mf:") ? `${w("plate.notesJoins", { notes: f.notes })} · ` : `${w("plate.yours")}${f.brand && !/typical values|estimate/i.test(f.brand) ? ` · ${f.brand}` : ""} · `}{pdText(density(f.protein, f.calories))}{swapDiff(f)}</small></div>
      <span className={`pdpill pdpill-${fits || restAbove ? "high" : "low"}`}>{restAbove ? `${Math.round(swapGone!.grams)} g` : fits && grams !== null ? `${grams} g` : w("plate.cantReach")}</span>
    </button>
  );
  const sameKind = swapCandidates.filter((x) => (x.kind ?? 0) <= 1), otherKinds = swapCandidates.filter((x) => (x.kind ?? 0) > 1);
  const swapPanel = swapId && (
    <div className="sheet-backdrop" onClick={() => setSwapId(null)}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="card-top"><span>{w("plate.swapFor", { food: swapGone?.food.name ?? "" })}</span><button className="link" onClick={() => setSwapId(null)}>{w("make.cancel")}</button></div>
        <p className="small">{w("plate.sameKindFirst")} {restAbove ? w("plate.atYourWithout", { target: pdVal(pdRef) }) : w("plate.gramsBring", { target: pdVal(pdRef) })}</p>
        {sameKind.length > 0 && <>
          <small className="pick-group crave-group swap-group">{w("plate.sameKindLike", { food: (swapGone?.food.name ?? "").split(/[,(]/)[0].trim().toLowerCase() })}</small>
          <div className="rows">{sameKind.map(swapRow)}</div>
        </>}
        {otherKinds.length > 0 && (swapMore || !sameKind.length
          ? <><small className="pick-group crave-group swap-group">{w("make.otherKinds")}</small><div className="rows">{otherKinds.map(swapRow)}</div></>
          : <button type="button" className="link swap-more" onClick={() => setSwapMore(true)}>{otherKinds.length > 2 ? w("plate.otherKindsMore", { list: otherKinds.slice(0, 2).map((x) => x.f.name.split(",")[0].toLowerCase()).join(", "), n: otherKinds.length - 2 }) : w("plate.otherKindsList", { list: otherKinds.slice(0, 2).map((x) => x.f.name.split(",")[0].toLowerCase()).join(", ") })}</button>)}
      </div>
    </div>
  );
  const plateOthers = plateList ? plateList.rows.filter((r) => r.kind !== "mine" && goesInDish(plateTasteOf, r.food.name)).slice(0, 6) : [];
  const found = matches.filter((f) => goesInDish(plateTasteOf, f.name));
  const heldBack = matches.filter((f) => !goesInDish(plateTasteOf, f.name)).map((f) => f.name).slice(0, 3);
  const isEmptyPart = (part: string) => !items.some((i) => i.part === part) && !opts.some((o) => o.part === part) && !leftOut.some((l) => l.part === part) && emptyParts.some((x) => x.part === part);
  const slotWord = (pickSlot ?? mealSlot)?.name.toLowerCase() ?? "meal";
  const slotWordV = mealV(slotWord, true);
  const tasteHint = shownTaste === "daam" ? (pdRef !== null ? w("plate.tasteDaamPd", { meal: slotWordV, pd: pdText(pdRef) }) : w("plate.tasteDaam", { meal: slotWordV }))
    : shownTaste === "savoury" ? (pdRef !== null ? w("plate.tasteSavouryPd", { meal: slotWordV, pd: pdText(pdRef) }) : w("plate.tasteSavoury", { meal: slotWordV }))
    : shownTaste === "both" ? w("plate.tasteBoth", { meal: slotWordV })
    : w("make.nothingPickedEverythingIsOffered");
  // a tap picks it, a tap on the one picked clears it; Both puts what is on the plate into the main and the sweet finish
  const pickTaste = (t: PlateTaste) => {
    const next = p.plateTaste === t ? null : t;
    p.setPlateTaste(next);
    if (next === "both") setState((s) => ({ ...s, items: s.items.map((i) => (i.part || i.dish ? i : { ...i, part: bothPartOf(i.food.name) })) }));
  };
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
  // DT219 (0.3.58): the no-foods line goes once a food lands on the Plate
  const itemsSeen = useRef(items.length);
  useEffect(() => { if (items.length > itemsSeen.current && p.photoNoFoods) p.dropNoFoods(); itemsSeen.current = items.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);
  const addToPart = (part: string) => {
    setAddTo(part); notify(w("plate.pickGoesInto", { part }));
    // 0.3.155: the search is inside + Add more to your plate now; it opens first
    setMoreOpen(true);
    window.setTimeout(() => { const box = document.querySelector<HTMLInputElement>('input.plate-search'); box?.scrollIntoView({ behavior: "smooth", block: "center" }); box?.focus({ preventScroll: true }); }, 60);
  };
  const PartChip = ({ value, onPick }: { value: string; onPick: (v: string) => void }) => {
    const all = [...new Set([...plateParts, ...newParts, ...(value ? [value] : [])])];
    return <select className="pt-chip pt-select" aria-label={w("plate.part")} value={value} onChange={(e) => onPick(e.target.value)}><option value="">{w("plate.noPart")}</option>{all.map((x) => <option key={x} value={x}>{x}</option>)}</select>;
  };
  const mealNeed = share && share.kcal >= 150 && p.kind !== "dessert" ? share.kcal : null;
  chefHere.current = p.ai.on && step === "in" && !p.filling && !imported && items.length === 0 && !inFlow && !p.photoAsk && !state.photo;
  // DT243: a recipe's own unit (pancakes) stays as written, one of it by its trailing s; portions are the app's words, in count lines
  const ownUnit = (m: Meal | null | undefined) => (m?.makes?.unit && m.makes.unit !== "portions" ? m.makes.unit : null);
  const unitOf = (m: Meal) => ownUnit(m) ?? w("plate.portionsWord"), oneOf = (m: Meal) => ownUnit(m)?.replace(/s$/, "") ?? w("plate.portionWord");
  const countUnit = (n: number, m: Meal | null | undefined) => { const u = ownUnit(m); return u ? countOf(n, u) : wn("plate.portionsN", n); };
  const portionItems = (m: Meal, mode: "whole" | "sized" | "recipe"): Ingredient[] => {
    const whole = m.items.map((i) => ({ ...i, dish: undefined }));
    // DT81: the whole recipe goes on the plate as the batch you cook (Cook it on its page: 10 sarmas of 8)
    const list = mode === "whole" ? (m.cook && m.makes ? sizedFor({ ...m, items: whole }, m.cook.n) : whole) : mode === "sized" && mealNeed ? scaleTo(whole, mealNeed) : onePortion(whole, m.makes?.n ?? 1);
    return list.map((i) => ({ ...i, id: uid(), locked: false }));
  };
  // the recipe on the plate at a portion: its foods, its optional foods at the same share, no part left out (IM12, IM13)
  const factorOf = (m: Meal, mode: "whole" | "sized" | "recipe") => (mode === "whole" ? (m.cook && m.makes ? m.cook.n / m.makes.n : 1) : mode === "sized" && mealNeed && kcalOfItems(m.items) > 0 ? mealNeed / kcalOfItems(m.items) : 1 / (m.makes?.n ?? 1));
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
    setState((s) => ({ ...s, ...recipePlate(m, mode), title: m.title, portion: null, fromRecipe: m.id, recipeFoods: m.items.filter((i) => !i.optional).map((i) => i.food.id), openRecipe: undefined,
      // B144 (0.3.150): a pot read from a photo names its cooking foods; they stay named on the plate, not counted
      ...(m.cooking?.length && s.photo?.pot === m.id ? { cooking: m.cooking, cookingFor: m.items.filter((i) => !i.optional).map((i) => i.food.id) } : {}) }));
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
  // IM3 → IM4: the recipe is saved in Mine with where it came from; your portion goes on the plate
  // DT308.12 (0.3.157, board Stories245): with foods on the plate it asks first, the same question as for a photo. Add to my
  // plate: the recipe joins as one dish. Start a new plate: only the recipe; the old plate is saved in My recipes.
  async function putRead(f: Extract<InFlow, { kind: "read" }>, how?: "add" | "new") {
    if (!how && items.length > 0) { setRecipeAsk(f); return; }
    const r = f.recipe;
    const { meal, fresh } = await mealFromRead(f, state.foods);
    setRecipeAsk(null);
    if (how === "add") {
      const of = Math.max(1, meal.makes?.n ?? 1);
      const dish = meal.items.map((i) => ({ ...structuredClone(i), id: uid(), locked: true, grams: i.grams / of, dish: { id: meal.id, title: meal.title, of, n: 1, base: i.grams / of } }));
      setState((s) => ({ ...s, foods: [...s.foods, ...fresh], meals: [meal, ...s.meals], items: [...s.items, ...dish], portion: null }));
      setInFlow(null); setMoreOpen(false);
      log("recipe_in", { how: f.url ? "link" : "shot", result: "dish" });
      notify(w("plate.joinedAsDish", { title: meal.title }));
      return;
    }
    if (how === "new") parkOld("recipe");
    const mode: "whole" | "sized" | "recipe" = !p.filling && r.servings >= 2 ? "whole" : sizedFits(mealNeed, kcalOfItems(meal.items) / r.servings) ? "sized" : "recipe";
    setPmode(mode); setWay(null); setPartsMode(false);
    setState((s) => ({ ...s, foods: [...s.foods, ...fresh], meals: [meal, ...s.meals], ...recipePlate(meal, mode), title: meal.title, portion: null, fromRecipe: meal.id }));
    setInFlow(null);
    log("recipe_in", { how: f.url ? "link" : "shot", result: "plate" });
    notify(w("plate.onPlateSavedMine", { title: meal.title }));
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
      if (!res.ok) throw new Error(d.error || w("make.couldNotAnswer"));
      let why: string | null = d.failed ?? null, out: Ingredient[] = [];
      if (!why) {
        out = (d.items as any[]).map((x) => {
          const was = items.find((i) => i.food.name.toLowerCase() === String(x.name).toLowerCase());
          return was && was.part !== part ? was : { id: was?.id ?? uid(), food: libFood(x), grams: roundGrams(Number(x.grams) || 0), locked: false, role: x.role, part };
        });
        const pd0 = pdOf(items), pd1 = pdOf(out);
        if (pd1 === null || pd0 === null || pd1 < pd0 + 0.05) why = w("plate.reachesNoBetter", { pd1: pd1 != null ? dec(pd1, 1) : "?", pd0: pd0 != null ? dec(pd0, 1) : "?" });
        else if (!realPortions(out)) why = w("plate.notRealPortion");
        else if (out.some((i) => blockedByAllergy(i.food, p.safety.allergies ?? []))) why = w("plate.hasAllergyFood");
      }
      if (why) { if (!failed) return changePart(part, why); log("recipe_fit", { way: "change", result: "failed" }); notify(w("plate.partChangeFailed", { part: part.toLowerCase(), why })); return; }
      const fresh = out.map((i) => i.food).filter((f) => !state.foods.some((x) => x.id === f.id));
      setState((s) => ({ ...s, foods: [...s.foods, ...fresh.filter((f, k) => fresh.findIndex((x) => x.id === f.id) === k)], items: out, portion: null, recipeFoods: out.filter((i) => !i.optional).map((i) => i.food.id) }));
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
      if (!res.ok) throw new Error(d.error || w("make.couldNotAnswer"));
      let why: string | null = d.failed ?? null, out: Ingredient[] = [], wholeNow: Ingredient[] = [];
      if (!why) {
        // the change answers for the whole recipe; each food keeps its part (a swap the part of the food it replaces)
        const partOf = (i: any): string | undefined => i.part || rec.items.find((r) => r.food.name.toLowerCase() === String(i.name).toLowerCase() || (i.was && r.food.name.toLowerCase() === String(i.was).toLowerCase()))?.part;
        const whole: Ingredient[] = (d.items as any[]).map((i) => { const pt = partOf(i); const was = rec.items.find((r) => r.food.name.toLowerCase() === String(i.name).toLowerCase()); return { id: uid(), food: libFood(i), grams: Math.round(Number(i.grams) || 0), locked: false, role: i.role, ...(pt ? { part: pt } : {}), ...(was?.count ? { count: was.count } : {}) }; });
        wholeNow = whole;
        out = scaleTo(whole, mealNeed ?? kcalOfItems(portionItems(rec, "recipe")));
        const pd1 = pdOf(out);
        if (pd1 === null || pd1 < pdRef - 0.05) why = w("plate.reachesUnder", { pd1: pd1 != null ? dec(pd1, 1) : "?", target: dec(pdRef, 1) });
        else if (!realPortions(out)) why = w("plate.notRealPortion");
        else if (out.some((i) => blockedByAllergy(i.food, p.safety.allergies ?? []))) why = w("plate.hasAllergyFood");
      }
      if (why) { if (!failed && deadline - Date.now() > 15_000) { again = true; window.clearTimeout(slowAt); window.clearTimeout(endAt); return changeDish(why, deadline); } log("recipe_fit", { way: "change", result: "failed" }); notify(w("plate.changeFailed", { why })); return; }
      const fresh = out.map((i) => i.food).filter((f) => !state.foods.some((x) => x.id === f.id));
      const title = String(d.title || w("plate.moreProteinTitle", { title: rec.title }));
      setState((s) => ({ ...s, foods: [...s.foods, ...fresh.filter((f, k) => fresh.findIndex((x) => x.id === f.id) === k)], items: out, title, portion: null, recipeFoods: out.filter((i) => !i.optional).map((i) => i.food.id) }));
      setWay({ kind: "change", title, notes: (d.notes ?? []) as string[], whole: wholeNow });
      log("recipe_fit", { way: "change", result: "shown" });
    } catch (e: any) {
      if (e?.name === "AbortError") notify(wayStopWhy.current === "time" ? w("plate.tookTooLong") : w("make.stoppedNothingChangedTryAgain"));
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
      if (!res.ok) throw new Error(d.error || w("make.couldNotAnswer"));
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
      if (!sorted.length) { log("recipe_fit", { way: "side", result: "failed" }); notify(w("plate.noSideBrings")); return; }
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
  const triedNote = (wy: Way | null) => {
    const t = wy && rec?.tried?.find((x) => x.kind === wy.kind && x.what === wayWhat(wy));
    return !t ? w("make.notCookedYet") : t.result === "yes" ? w("make.youCookedItItWorked") : t.result === "ok" ? w("make.youCookedItItWas") : w("make.youCookedItItDidn");
  };
  // the button: the quick fit when maths does it, Chef Mealan when it cannot (Milan, 15 October 2026, 22:43)
  // DT245 (0.3.96, board Stories182; Coach Milan 6 November 10:20 and 10:34, a): a plate that already fills its meal says so
  // first: I ate it, Save for later, or Ideas anyway, and then the ideas are small additions
  const [fills, setFills] = useState<string | null>(null);
  const plateSigNow = items.map((i) => `${i.id}:${Math.round(i.grams)}`).join("|");
  const fillsNow = fills !== null && fills === plateSigNow && !!share;
  // DT337 (0.3.176, AC6): with no meal set and the AI on, Fit asks which meal first, in the meal line; once it is picked, the ideas
  // come for that meal
  const [fitWaits, setFitWaits] = useState(false);
  useEffect(() => { if (fitWaits && share && mealSlot) { setFitWaits(false); setLineOpen(false); window.setTimeout(() => makeAMeal(), 300); } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitWaits, share, mealSlot]);
  function makeAMeal() {
    if (p.ai.on && !mealSlot && p.kind !== "dessert" && items.length > 0) { setLineOpen(true); setFitWaits(true); notify(w("plate.whichMealFirst")); return; }
    if (chefable && share && !madeBy && !imported && partsOf(items).length < 2) { const k = aggregate(items).calories ?? 0, [lo, hi] = mealRange(share.kcal); if (k >= lo && k <= hi) { setFills(plateSigNow); return; } }
    // DT337 (AC7): a plate above the target's range goes to Chef Mealan's ideas whenever the AI is on, near its meal's size or not
    if (p.ai.on && chefable && share && partsOf(items).length < 2) { const t0 = aggregate(items); if (aboveRange(density(t0.protein, t0.calories), pdRef)) { log("fit_used"); void askChef(items, []); return; } }
    // C52 (DT150): a dish in parts is sized by its parts, by code, before any idea replaces it
    if (!chefable || !share || partsOf(items).length >= 2) return askMealan();
    const t = aggregate(items), pd0 = density(t.protein, t.calories);
    const mover = moverOf(items);
    let fit: { ok: boolean; kcal: number } | null = null;
    if (mover && pdRef !== null) {
      const sol = solveIngredient(items.map((i) => (i.id === mover.id ? i : { ...i, locked: true })), mover.id, pdRef, null);
      fit = sol.ok ? { ok: sol.grams >= minPortionOf(mover.food) && sol.grams <= (cap ?? 300), kcal: aggregate(sol.items).calories ?? 0 } : { ok: false, kcal: 0 };
    }
    if (routeOf({ pd: pd0, target: pdRef, kcal: t.calories ?? 0, need: share.kcal, fit }) === "fit") return askMealan();
    if (!p.ai.on) { notify(w("plate.ideasNeedAi")); return askMealan(); }
    log("fit_used");
    void askChef(items, []);
  }
  // DT111 (0.2.94): the stages of the ask, shown while it runs
  const [chefStage, setChefStage] = useState<{ at: string; done: string[] }>({ at: "read", done: [] });
  const stage = (at: string, ...done: string[]) => setChefStage((c) => ({ at, done: [...new Set([...c.done, ...done])] }));
  const chefSteps = (): WaitStep[] => [
    { key: "read", text: w("plate.stepRead", { foods: items.map((i) => cookPhrase(i.food.name, i.grams)).join(", "), kcal: fmt(t.calories, 0) }) },
    { key: "ask", text: (p.personal.kitchens ?? []).length ? w("plate.stepAskKitchens", { meals: mealsW, kitchens: (p.personal.kitchens ?? []).reduce((a, b) => (a ? w("gates.and", { a, b }) : b), "") }) : w("plate.stepAsk", { meals: mealsW }) },
    { key: "check", text: w(pdRef !== null ? "plate.stepCheckPd" : "plate.stepCheck", { what: share ? w("plate.kcalRange", { low: fmt(mealRange(share.kcal)[0], 0), high: fmt(mealRange(share.kcal)[1], 0) }) : w("plate.theMeal"), pd: pdVal(pdRef) }) },
    { key: "again", text: w("make.askingAgainForAnIdea") },
  ];
  function isAbove(f: { why: string }) { return ABOVE_RANGE.test(f.why); }
  async function askChef(base: Ingredient[], avoid: string[], failedIn: Missed[] = [], kept: MealOption[] = [], small = false) {
    if (!share) return;
    // DT102 (0.2.91): Other ideas: the last dish's cooking foods go before the new ideas come
    setState((s) => (s.cooking ? { ...s, cooking: undefined, cookingFor: undefined } : s));
    setChef({ status: "working", small });
    if (failedIn.length) stage("again", "read", "ask", "check"); else { setChefStage({ at: "read", done: [] }); window.setTimeout(() => setChefStage((c) => (c.at === "read" ? { at: "ask", done: ["read"] } : c)), 400); }
    try {
      const res = await fetch("/api/meal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        plate: base.map((i) => ({ name: i.food.name, grams: i.grams, calories: i.food.calories, protein: i.food.protein, ...(isDrink(i.food) ? { drink: true } : {}) })), meal: mealWord, need: share.kcal, target: pdRef,
        kitchens: p.personal.kitchens ?? [], taste: tasteForChef(p.personal), library: state.foods.slice(0, 40).map((f) => ({ name: f.name, calories: f.calories, protein: f.protein })), region: p.region, avoid: [...avoid, ...kept.map((k) => k.title)], failed: failedIn.map((f) => ({ title: f.title, why: f.why })), ...(small ? { small: true } : {}),
        // DT337 (AC3, AC4): the plate's PD against the range, and what the meal is missing in carbs and fat
        plate_pd: density(aggregate(base).protein, aggregate(base).calories), missing: missingOf(dayNums, share.kcal, aggregate(base)), very_low_carb: p.personal.carbsFat?.split === "low", carried: carriedLists(state.meals, state.feedback), tastes: tasteForReq(p.personal.tasteChips, state.preferences), what: shownTaste }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || w("make.couldNotAnswer"));
      const good = [...kept], failed: Missed[] = [];
      stage("check", "read", "ask");
      for (const o0 of (data.options ?? []) as { kitchen: string; title: string; why: string; for_cooking?: string[]; adds: { name: string; grams: number; calories: number; protein: number; base: boolean }[] }[]) {
        // DT100 (0.2.90): the title as a cook says it
        const o = { ...o0, title: cookTitle(o0.title) };
        if (good.length >= 3 || good.some((g) => g.title.toLowerCase() === o.title.toLowerCase())) continue;
        const adds: Add[] = o.adds.map((a) => { const lib = state.foods.find((f) => f.name.toLowerCase() === a.name.toLowerCase()); return { food: lib ?? estimate(a), grams: a.grams, base: a.base, have: !!lib }; });
        const sol = solveMeal(base, adds, share.kcal, pdRef, (f) => blockedByAllergy(f, p.safety.allergies ?? []), uid, mealX);
        if (sol.ok) good.push({ kitchen: o.kitchen, title: o.title, why: o.why, adds: adds.map((a) => ({ name: a.food.name, grams: sol.items.find((x) => x.food === a.food && !base.some((b) => b.id === x.id))?.grams ?? Math.round(a.grams), have: a.have, base: a.base })), items: sol.items, kcal: sol.kcal, pd: sol.pd, cooking: Array.isArray(o.for_cooking) ? o.for_cooking : [] });
        // DT245: an idea that does not fit keeps its foods at Chef Mealan's amounts, for Put it on the plate
        else failed.push({ title: o.title, why: (sol as { why: string }).why, kitchen: o.kitchen, items: [...base, ...adds.map((a) => ({ id: uid(), food: a.food, grams: Math.round(a.grams), locked: false }))] });
      }
      // an idea that fails the checks goes back once, with the reason; a second miss is left out
      // DT337 (AC2): an idea above the range is never shown: he is asked once more with the reason, and a second miss is left out
      if (failed.some(isAbove) && !failedIn.length) return askChef(base, avoid, failed, good, small);
      if (good.length < 2 && failed.length && !failedIn.length) return askChef(base, avoid, failed, good, small);
      // DT91: an idea that still misses is shown with why, not dropped in silence
      // an idea that clashes with an allergy is never shown, not even as a miss
      const missed = [...failedIn, ...failed].filter((f) => !/allergy/.test(f.why) && !ABOVE_RANGE.test(f.why)).filter((f, k, all) => !good.some((g) => g.title.toLowerCase() === f.title.toLowerCase()) && all.findIndex((x) => x.title.toLowerCase() === f.title.toLowerCase()) === k).slice(0, 3);
      setChef(good.length ? { status: "done", options: good, tried: [...avoid, ...good.map((g) => g.title)], failed: missed, small } : { status: "none", tried: [...avoid, ...failed.map((f) => f.title)], failed: missed, small });
    } catch (e: any) { setChef(null); notify(`${e.message} ${w("plate.hereQuickFit")}`); askMealan(); }
  }
  function putMissOnPlate(f: Missed) {
    if (!f.items) return;
    putOnPlate({ kitchen: f.kitchen ?? "", title: f.title, why: f.why, adds: f.items.filter((i) => !items.some((b) => b.id === i.id)).map((i) => ({ name: i.food.name, grams: i.grams, have: state.foods.some((m) => m.id === i.food.id), base: false })), items: f.items, kcal: aggregate(f.items).calories ?? 0, pd: density(aggregate(f.items).protein, aggregate(f.items).calories), cooking: [] } as MealOption);
  }
  function putOnPlate(o: MealOption) {
    const from = items, baseName = o.adds.find((a) => a.base)?.name ?? o.adds[0]?.name ?? "";
    // DT90: a name you typed stays; Chef Mealan's title fills the name only while it is empty
    const typed = state.title && state.title !== "DaaM" && state.title !== autoTitle(from) ? state.title : "";
    setState((s) => ({ ...s, items: o.items, title: typed || o.title, portion: null, cooking: o.cooking.length ? o.cooking : undefined, cookingFor: o.cooking.length ? o.items.map((i) => i.food.id) : undefined }));
    setMadeBy({ kitchen: o.kitchen, base: baseName, from, tried: chef && chef.status !== "working" ? chef.tried : [], title0: typed }); setChef(null);
  }
  // DT93, rule 2: the culinary gate. Chef Mealan reads the plate once it has two foods: do they make the meal it is for?
  // Once per set of foods (the amounts are the app's business); never for a recipe, Chef Mealan's own dinner, or with the AI off.
  // DT150 (0.2.131, rule C52): a dish in parts, cooked together, is read again when its amounts move by 25 g or more: proportions count
  // only a plate grouped into parts, a dish you said it is: any other plate keeps DT93, one read per set of foods
  const cookedDish = partsOf(items).length >= 2 && items.some((i) => needsCooking(i.food.name) || bindsADish(i.food));
  const dishSig = items.filter((i) => !i.optional && !i.fry).map((i) => (cookedDish ? `${i.food.id}:${Math.round(i.grams / 25)}` : i.food.id)).sort().join("|");
  const dishWanted = items.length >= 2 && !state.fromRecipe && !madeBy && !imported && chefable && p.ai.on && !partsMode;
  const [dishTry, setDishTry] = useState(0); // DT104: Try again after a failed read
  useEffect(() => {
    if (!dishWanted || (dish && dish.sig === dishSig && dish.status !== "off")) return;
    let gone = false;
    setDish({ sig: dishSig, status: "working" });
    fetch("/api/dish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ foods: items.map((i) => ({ name: i.food.name, grams: i.grams, ...(i.part ? { part: i.part } : {}) })), meal: mealWord, kitchens: p.personal.kitchens ?? [], cooked: cookedDish }) })
      .then(async (r) => { const d = await r.json().catch(() => ({})); if (gone) return; if (!r.ok) { setDish({ sig: dishSig, status: "off" }); return; } setDish({ sig: dishSig, status: "done", makesIt: !!d.makesIt, why: String(d.why ?? ""), around: String(d.around ?? ""), betterAs: String(d.betterAs ?? ""), holds: String(d.holds ?? "") }); })
      .catch(() => { if (!gone) setDish({ sig: dishSig, status: "off" }); });
    return () => { gone = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dishSig, dishWanted, dishTry]);
  const dishNow = dish && dish.sig === dishSig && dishWanted ? dish : null;
  // DT116 (0.2.98, boards G3 and Stories69): the three gates. Culinary is Chef Mealan's read (dishNow) with the code lines in
  // front; nutrition and your day are arithmetic (src/gates.ts). Each answers for itself; all three green is the sweet spot.
  const gateOn = items.length >= 1 && !imported && !madeBy && !partsMode && (t.calories ?? 0) >= 100;
  // B144 (0.3.150, board Stories225): a dish of a meal is judged with the meal's other dishes, never alone: a starter, a side,
  // a dessert or a drink with no other dish yet waits for the main
  const dishOfMeal = Boolean(state.course && state.course !== "main" && mealWord !== "snack");
  const mealItems = dishOfMeal ? [...otherDishes.flatMap((f) => f.meal.items), ...items] : items;
  const nutri = gateOn && !(dishOfMeal && otherDishes.length === 0) ? nutritionGate({ items: mealItems, kind: p.kind === "dessert" ? "dessert" : p.pick === "snack" || mealWord === "snack" ? "snack" : "meal", beforeTraining: p.moment === "before", mealWord }) : { ok: true as const };
  // 0.3.62: Exploring (the pencil block, or an Exploring photo) eats nothing now: no eating-window check
  const exploringNow = p.pick === "exploring" || unset || state.photo?.who === "idea";
  const dayLine = gateOn && !exploringNow ? dayGate({ items, moment: p.moment, now: new Date(), window: windowOf(lifestyleOf(p.personal)), kind: p.kind, mealWord, needsCooking }) : { ok: true as const };
  const [gateKept, setGateKept] = useState<string>("");
  const culinaryOk = dishNow?.status === "done" ? dishNow.makesIt : null;
  // DT132: an edge passes, but the sweet spot waits for a clear pass
  const edgeOf = (g: GateLine) => (g.ok ? (g as GateLine & { edge?: string }).edge ?? null : null);
  const anyEdge = gateOn && (Boolean(edgeOf(nutri)) || Boolean(edgeOf(dayLine)) || sizeEdge);
  const sweetSpotOf = (noIngredient: boolean) => gateOn && culinaryOk === true && nutri.ok && dayLine.ok && noIngredient && !anyEdge && !tooBig;
  // the ways out, in the plate's own words
  const addBase = (job: "Protein base" | "Carb base") => {
    const plateFoods = items.map((i) => state.foods.find((x) => x.id === i.food.id) ?? i.food);
    const pick = state.foods.filter((f) => f.calories !== null && f.protein !== null && jobOf(f).job === job && fitsPlate(f, plateFoods))
      .sort((a, b) => (job === "Protein base" ? (density(b.protein, b.calories) ?? 0) - (density(a.protein, a.calories) ?? 0) : (b.carbs ?? 0) - (a.carbs ?? 0)))[0];
    if (!pick) { p.openOut("plate"); return; }
    add(pick); notify(w("plate.gOnThePlate", { grams: fmt(startGrams(pick, mealX), 0), food: cookName(pick.name).short.toLowerCase() }));
  };
  const wayButton = (gw: GateWay, k: number) => {
    const primary = k === 0 ? " pill-primary" : "";
    if (gw === "protein") return <button key={gw} className={`pill pill-small${primary}`} onClick={() => addBase("Protein base")}>{w("make.addAProteinBase")}</button>;
    if (gw === "carb") return <button key={gw} className={`pill pill-small${primary}`} onClick={() => addBase("Carb base")}>{w("make.addACarbBase")}</button>;
    if (gw === "snack") return <button key={gw} className={`pill pill-small${primary}`} onClick={() => p.setPick("snack")}>{w("make.makeItASnack")}</button>;
    if (gw === "nocook") return <button key={gw} className={`pill pill-small${primary}`} onClick={() => p.openOut("plate")}>{w("plate.askNoCooking")}</button>;
    if (gw === "window") return null;
    return <button key={gw} className="pill pill-small" onClick={() => setGateKept(dishSig)}>{w("make.keepItAsItIs")}</button>;
  };
  const gateLine = (name: string, g: GateLine) => edgeOf(g) ? (
    <div key={name} className="gate-line-row gate-edge">
      <b>{w("plate.onEdge", { name })}</b>
      <small>{edgeOf(g)}</small>
      {(g as GateLine & { hint?: string }).hint && <small className="gate-hint">{(g as GateLine & { hint?: string }).hint}</small>}
    </div>
  ) : (
    <div key={name} className={`gate-line-row ${g.ok ? "gate-yes" : "gate-no"}`}>
      <b>{g.ok ? "✓" : "✕"} {name}</b>
      {g.ok === false && <small>{g.why}</small>}
      {g.ok === false && gateKept !== dishSig && <div className="button-row">{g.ways.map((w, k) => wayButton(w, k))}</div>}
    </div>
  );
  // DT110 (0.2.94, board Stories67; Milan 25 October 00:25: three ideas, none of value, on a plate of 1,232 kcal for a breakfast of
  // 619 to 757): a plate over its meal (C31) never goes to the ideas. Code says what it is and offers three ways.
  const [bigKept, setBigKept] = useState<string | null>(null);
  // DT129 (0.2.109, board Stories86): the numbers behind the four letters, under the PD block; the meal planned in this slot
  const [numbersOpen, setNumbersOpen] = useState(false);
  const planNow: PlanNumbers | null = (() => {
    // B151 (0.3.171): a plate planned with the pencil stands in that slot itself; the meal planned there is what the slot held before
    const mine = stateAll.plannedAt && mealSlot && stateAll.plannedAt.date === mealDate && stateAll.plannedAt.slotId === mealSlot.id ? stateAll.plannedAt : null;
    const m = mine ? mine.was ?? undefined : mealSlot ? p.planned[mealDate]?.[mealSlot.id] : undefined;
    if (!m || m.skipped || !(m.kcal > 0)) return null;
    const portion = plannedPortion(m, "plan", "");
    if (portion) { const a = aggregate(portion.items); return { word: mealWord, kcal: Math.round(a.calories ?? m.kcal), grams: Math.round(a.weight ?? 0) || null, protein: Math.round(a.protein ?? m.protein) }; }
    return { word: mealWord, kcal: Math.round(m.kcal), grams: null, protein: Math.round(m.protein) };
  })();
  // DT127: the meal photo, small in the line or large with the foods over it
  // DT230 (0.3.70): a photo plate opens with the photo large, its own buttons under it
  const [photoBig, setPhotoBig] = useState(true);
  // DT305 (0.3.151, boards Stories230 and Stories231): the read alone. What you chose under Did you eat it?, the grams, the
  // plan chip, and the food whose amount you are correcting
  const [rvEat, setRvEat] = useState<null | "all" | "half" | "part">(null);
  const [rvGrams, setRvGrams] = useState("");
  const [rvPlan, setRvPlan] = useState(false);
  const [rvEdit, setRvEdit] = useState<string | null>(null);
  // DT307.4 (0.3.163): the tick Save in My recipes on the read, off when the read opens
  const [rvKeep, setRvKeep] = useState(false);
  // DT306 (0.3.163, board DT306): Did you eat it? on Chef Mealan's card of a photo's plate, and the grams of Part of it
  const [mpEat, setMpEat] = useState<null | "all" | "half" | "part" | "not">(null);
  const [mpGrams, setMpGrams] = useState("");
  // B146 (0.3.152, board Stories235, row 1 new; Coach Milan 16 November 17:39 Go): a photo you bring in starts with an empty
  // title, whatever was on the Plate; a name typed there is kept for the read
  const [photoTitle, setPhotoTitle] = useState("");
  useEffect(() => { setPhotoTitle(""); }, [p.photoAsk?.at, p.photoAsk?.image]);
  useEffect(() => { setRvEat(null); setRvGrams(""); setRvPlan(false); setRvEdit(null); setRvKeep(false); setMpEat(null); setMpGrams(""); }, [state.photo?.at, state.photo?.image]);
  // DT249 (0.3.98, board Stories184; Coach Milan 7 November 06:01 to 06:14, Go): which photo of the meal is the big one
  const [shotAt, setShotAt] = useState(0);
  useEffect(() => { setShotAt(0); }, [state.photo?.at, state.photo?.image]);
  const [morePhoto, setMorePhoto] = useState<{ file: File; at: number } | null>(null);
  const [plusAsk, setPlusAsk] = useState(false);
  // DT130: Put it in my plan, for an idea: the day and the meal picked in two rows of chips
  const [ideaPlan, setIdeaPlan] = useState<{ date: string; slotId: string } | null>(null);
  // 0.3.136 (Coach Milan 11 November 23:16): a photo from another day says its day ("28 October, 13:11"), not only the time
  const photoTime = (iso: string) => { const d = new Date(iso), hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    return d.toDateString() === new Date().toDateString() ? hm : `${dateText(d, { day: "numeric", month: "long" })}, ${hm}`; };
  const bigN = tooBig && share && !imported && !madeBy ? mealsOn(t.calories ?? 0, sizeRef ?? share.kcal) : 0;
  const bigPlate = bigN > 0 && bigKept !== dishSig;
  const mealsWord = mealsW;
  const numWord = (n: number) => ["", "one", "two", "three", "four", "five"][n] ?? String(n);
  // Make it N breakfasts: saved as a recipe that makes N; one portion stays on the plate, the next one goes on Plan for tomorrow
  const makeItN = () => {
    if (!share || !bigN) return;
    const name = (state.title && state.title !== "DaaM" ? state.title : "") || autoTitle(items);
    const whole = structuredClone(items).map((i) => ({ ...i, locked: true }));
    const meal: Meal = { id: uid(), title: name, items: whole, portion: Math.round((t.weight ?? 0) / bigN), savedAt: new Date().toISOString(), kind: p.kind, makes: { n: bigN, unit: "portions" } };
    const one = items.map((i) => ({ ...i, grams: Math.round(i.grams / bigN) }));
    setState((s) => ({ ...s, meals: [meal, ...s.meals], items: one, title: name, portion: null, fromRecipe: meal.id, recipeFoods: whole.filter((i) => !i.optional).map((i) => i.food.id) }));
    setPmode("sized");
    if (mealSlot) { const d = new Date(); d.setDate(d.getDate() + 1); p.fill(ymd(d), mealSlot.id, fromMeal(meal, "mine")); }
    notify(w(bigN === 2 ? "plate.makesPortionsTwo" : "plate.makesPortions", { name, n: bigN, meal: mealW }));
  };
  // Shrink it to one: every amount scaled into the meal's range, each food within its portion; a counted food on whole pieces
  const shrinkToOne = () => {
    if (!share || !(t.calories ?? 0)) return;
    const f = share.kcal / (t.calories ?? 1);
    const next = items.map((i) => {
      const r = portionRange(i.food, mealX), c = countedOf(i);
      let g = Math.max(r.min, Math.min(r.max, i.grams * f));
      // a counted food on whole pieces, a pack's piece on whole pieces (one bar, not 52 g)
      if (c) { const one = gramsOfOne(c); g = Math.max(one, Math.round(g / one) * one); }
      else if (i.food.serving?.grams) { const one = i.food.serving.grams; g = Math.max(one, Math.round(g / one) * one); }
      return { ...i, grams: Math.round(g) };
    });
    setState((s) => ({ ...s, items: next, portion: null }));
    setFit(null);
    notify(w("plate.shrunk", { meal: mealW, kcal: fmt(next.reduce((k, i) => k + ((i.food.calories ?? 0) * i.grams) / 100, 0), 0) }));
  };
  // DT105 (0.2.92, board Stories64): an ingredient on the plate is caught by code before any read (rule C6 in the gate, C30)
  // DT127: a food read from a photo of the meal is part of the dish (oil in a dressing, butter in a sauce), so C6 lets it be
  const ingredientsOn = items.filter((i) => !i.optional && !i.est && !state.photo && isIngredient(i.food));
  const [dishKept, setDishKept] = useState<string>("");
  // DT93: after Fit, when the foods cannot reach the target within their portions, three ways out
  const fitShort = !!fit && fit.id !== null && pd !== null && pdRef !== null && pd < pdRef - 0.05 && !imported;
  // DT174 (0.3.16): Cook it as written: once the recipe is on the plate, as it is, straight to Make
  useEffect(() => {
    if (!p.cookNow) return;
    if (step !== "in") { p.clearCookNow(); return; }
    if (!items.length || state.openRecipe) return;
    p.clearCookNow(); setChef(null); setMethod(null); setTicks(new Set());
    setState((s) => ({ ...s, portion: null, title: s.title || "DaaM" }));
    setStep("made"); if (p.travel?.kitchen !== "hotel") setCooking(true);
  }, [p.cookNow, step, items.length, state.openRecipe]); // eslint-disable-line react-hooks/exhaustive-deps
  function keepAsIs() { setChef(null); if (p.filling && plateWhen === "past") { addPast(); return; } if (p.filling?.mode !== "eat" && p.filling) putInSlot(items); else { setState((s) => ({ ...s, portion: null, title: s.title || "DaaM" })); setMethod(null);
    // DT94: a plate whose steps are already on the Plate is locked here and goes straight to Make
    if (cooksPlate(items) && stepsHold(items)) { setStep("made"); return; }
    setStep("make"); startPlateSteps(); } }
  // DT89 (0.2.87, board Stories58): a plate you cook (Chef Mealan's dinner, or a food that goes in raw or dry) gets steps on How
  // to make it, never the ways to eat a bowl. Chef Mealan drafts them once for these foods and amounts; a changed plate, again.
  const plateSig = (its: Ingredient[]) => its.map((i) => `${i.food.id}:${Math.round(i.grams)}`).join("|");
  const foodsSig = (its: Ingredient[]) => its.map((i) => i.food.id).sort().join("|");
  // the steps still hold for the plate: the same foods, whatever the amounts
  const stepsHold = (its: Ingredient[]) => !!plateSteps && (plateSteps.sig === plateSig(its) || (!!plateSteps.foods && plateSteps.foods === foodsSig(its)));
  // 0.3.69 (Coach Milan 3 November 13:33: Make for Protein Pancake read the steps of a cucumber, feta and chicken plate): Chef
  // Mealan's drafted steps count only for the foods they were written for; everywhere else they are as if not there
  const heldSteps = stepsHold(items) ? plateSteps : null;
  // DT150 (0.2.131): a cooked plate grouped into parts keeps its steps on the Plate
  const cookedFoods = (its: Ingredient[]) => its.length > 0 && !state.fromRecipe && !rec && (madeBy !== null || its.some((i) => cookedFood(i.food.name)) || (partsOf(its).length >= 2 && its.some((i) => bindsADish(i.food))));
  // DT216 (0.3.56): a recipe of yours that kept the bowl steps (its way) from an earlier save, now on a plate you cook
  const bowlKeptOn = (its: Ingredient[]) => cookedFoods(its) && state.meals.some((m) => !!state.title && m.title === state.title && !!m.way && (m.steps?.length ?? 0) > 0);
  const cooksPlate = (its: Ingredient[]) => cookedFoods(its)
    && (!state.meals.some((m) => !!state.title && m.title === state.title && (m.steps?.length ?? 0) > 0) || bowlKeptOn(its));
  // DT220 (0.3.58, board Stories164; Coach Milan 2 November 17:53): the Plate's white button says where it goes. It opens How to
  // make it when keepAsIs lands there (the same test as step "make" below); a bowl's ways and a plate with its steps keep their name.
  const goesToHowToMake = (its: Ingredient[]) => {
    if (cooksPlate(its) && stepsHold(its)) return false;
    const pr = rec ?? state.meals.find((m) => (p.filling?.mealId ? m.id === p.filling.mealId : !!state.title && m.title === state.title) && m.items.length > 0);
    return !!rec || (pr?.steps?.length ?? 0) > 0 || partsOf(its).length > 0 || cooksPlate(its);
  };
  const plateMealNow = (): Meal => ({ id: "plate", title: state.title && state.title !== "DaaM" ? state.title : autoTitle(items), items, portion: aggregate(items).weight ?? 0, savedAt: new Date().toISOString(), ...(state.cooking?.length ? { cooking: state.cooking } : {}) });
  function startPlateSteps(force = false) {
    if (!cooksPlate(items)) return;
    const sig = plateSig(items);
    if (!force && stepsHold(items)) return;
    setPlateSteps(null); setOwnSteps(null);
    if (!p.ai.on) { setPlateDraft(""); return; }
    setPlateDraft("working");
    draftSteps(plateMealNow(), { library: state.foods.map((f) => f.name), equipment: equipmentOf(p.personal), kitchens: p.personal.kitchens ?? [], tastes: tasteForReq(p.personal.tasteChips, state.preferences) })
      .then((d) => {
        if (d.ok) { setPlateSteps({ steps: d.steps, sig, foods: foodsSig(items), its: structuredClone(items), ...(d.moves ? { moves: d.moves } : {}) }); setPlateDraft(""); }
        else { const f = d as { why: string; cannot?: boolean }; setPlateDraft(f.cannot ? f.why : w("make.draftFailedWrite", { why: f.why })); }
      })
      .catch((e: any) => setPlateDraft(e?.message || w("make.couldNotAnswerAgain")));
  }
  const Head = ({ title, sub, name, back }: { title: string; sub?: string; name?: boolean; back?: typeof STEPS[number] }) => stepHead({ n, title, sub, bare: step === "in" && items.length === 0 && !state.photo && !state.fromRecipe && !p.filling, label: p.filling && plateWhen !== "now" ? w(plateWhen === "plan" ? "plate.planningSlot" : "plate.addingSlot", { slot: slotV(p.filling) }) : undefined, back: back ? <Back to={back} /> : undefined, nameField: name ? { value: state.title === "DaaM" ? "" : state.title, placeholder: items.length ? autoTitle(items) : w("make.nameTheMeal"), onChange: (v: string) => setState((s) => ({ ...s, title: v })), onCommit: (v: string) => p.renamePlate(v) } : undefined });
  // 0.2.54, design system rule E (board DS2): Back sits top left, above the step bar, and says where it goes
  // DT211 v8 (0.3.53): Eat goes back to making it
  const BACK_TO: Record<string, WordKey> = { in: "make.backToThePlate", recipe: "plate.backToAmounts", make: "plate.backToMaking", made: "plate.backToMaking" };
  const Back = ({ to }: { to: typeof STEPS[number] }) => (
    <button className="link back back-top" onClick={() => setStep(to)}><ChevronLeft size={16} /> {w(BACK_TO[to] ?? "plate.backToLast")}</button>
  );

  // ---- DT214 v2 (0.3.53, board Stories162): the cook. It starts when Make (or Eat) opens, keeps every tick, photo and answer
  // as you go, and says where it stands on every tab. ----
  const inCook = !!state.cook?.inView;
  const noMake = !!p.filling && plateWhen !== "now";
  // the recipe being cooked: the one that came in, or the one the plate is (its name)
  const cookRecipe = rec ?? ((m) => (m ? shownMeal(m, recLang) : m))(state.meals.find((m) => (p.filling?.mealId ? m.id === p.filling.mealId : !!state.title && m.title === state.title) && m.items.length > 0));
  const stepsOfCook = (() => {
    const pr = cookRecipe;
    return (rec?.steps?.length ? rec.steps : pr?.steps?.length ? pr.steps : heldSteps?.steps?.length ? heldSteps.steps : (methodsFor(items).find((w) => w.id === method)?.steps ?? [])).length;
  })();
  useEffect(() => {
    if ((step !== "made" && step !== "after") || inCook || noMake || !items.length) return;
    p.startCook({ title: (state.title && state.title !== "DaaM" ? state.title : autoTitle(items)).slice(0, 60), ...(cookRecipe ? { recipeId: cookRecipe.id } : {}), stage: step === "after" ? "eat" : "make", steps: stepsOfCook });
  }, [step, inCook]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!inCook) return;
    const ui: CookUi = { step, ticks: [...ticks], stepPhotos, ...(plate ? { final: plate } : {}), went, different, ate, eatN, madeN, keepMade, good, note, title, method, pmode, makeAll, way, plateSteps, madeBy, tried };
    setState((s) => {
      const c = s.cook; if (!c?.inView) return s;
      const stage = c.stage === "make" || c.stage === "eat" ? (step === "after" ? "eat" : "make") : c.stage;
      const name = s.title && s.title !== "DaaM" ? s.title.slice(0, 60) : c.title, n = stepsOfCook || c.steps;
      if (stage === c.stage && n === c.steps && name === c.title && JSON.stringify(c.ui) === JSON.stringify(ui)) return s;
      return { ...s, cook: { ...c, ui, stage, title: name, ...(n ? { steps: n } : {}) } };
    });
  }, [inCook, step, ticks, stepPhotos, plate, went, different, ate, eatN, madeN, keepMade, good, note, title, method, pmode, makeAll, way, plateSteps, madeBy, tried, stepsOfCook]); // eslint-disable-line react-hooks/exhaustive-deps
  // coming back to Make in the middle of a cook, Chef Mealan asks before anything else
  const [resumeAsk, setResumeAsk] = useState(() => !!state.cook?.inView && cookStarted(state.cook) && step === "made");
  // DT212 v4 (board Stories159): Read the photo again asks first
  const [readAgain, setReadAgain] = useState(false);
  // DT223 (0.3.60): from cook mode the photo is the recipe's step picture, taken again or not (keep)
  const stepPhotoFile = (k: number, file?: File | null, _keep = false) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => thumbnailBase64(String(r.result), 480).then((d) => {
      setStepPhotos((x) => ({ ...x, [String(k)]: d }));
      // DT276 step 2 (0.3.129, board Stories205): the photo goes on the recipe's step too: its first when the step has none,
      // one more when it has. Nothing is replaced and nothing is asked.
      const m = cookRecipe, words = m?.steps?.[k];
      // DT280 (0.3.132): a gallery of 12 is full; the photo then stays with this cook only
      if (m && words !== undefined) setState((st) => ({ ...st, meals: st.meals.map((x) => (x.id === m.id && galleryOf(x).length < MAX_GALLERY ? { ...x, ...addStepPic(x, k, { src: d, by: "me" }) } : x)) }));
    }).catch(() => {});
    r.readAsDataURL(file);
  };
  // ---- B151 (0.3.171, board B151; Coach Milan 21 November, Go 11:26): the pencil is the whole decision ----
  // The plate you build yourself (no photo, not a recipe as mapped, not a dish opened from a meal) is logged or planned by
  // setting its meal: a meal whose time is now or earlier counts, a meal still ahead is a plan (src/plateLive.ts). It is
  // decided when you tap the meal or change its time, and when the first food lands on a plate whose meal is set; never by
  // the clock moving on. A plate from a photo, from earlier, or opened from the Plan keeps its own way.
  // It stands here, before the first early return (Chef Mealan's ideas, below), because it holds an effect.
  // a photo that joins a plate already logged or planned this way leaves it as it is: the plate stays that meal
  const liveBound = !!stateAll.recorded?.live || !!stateAll.plannedAt;
  const liveBase = (!stateAll.photo || liveBound) && !(imported && rec) && !(p.recordNow && !p.recordNow.live);
  const liveOn = liveBase && p.pick !== "exploring" && (!p.filling || p.filling.by === "line");
  const liveSet = liveOn ? mealSet : null;
  const liveSlot: Slot | null = !liveSet ? null : p.filling ? daySlots.find((x) => x.id === p.filling!.slotId) ?? null : pickSlot;
  const liveRec = liveBase && p.recordNow?.live ? p.recordNow : null;
  const livePlan = liveBase ? stateAll.plannedAt ?? null : null;
  // what holds now: the plate is in a meal as eaten, or in the plan
  const liveIs: LiveStatus | null = liveRec ? "eaten" : livePlan ? "planned" : null;
  const liveTitle = () => (state.title && state.title !== "DaaM" ? state.title.trim() : "") || autoTitle(items);
  const liveMine = (): PlannedMeal => { const t = aggregate(items); return { title: liveTitle(), kcal: Math.round(t.calories ?? 0), protein: Math.round(t.protein ?? 0), source: "plate", items: structuredClone(items).map((i) => ({ ...i, est: undefined })), portion: items.reduce((n, i) => n + i.grams, 0) }; };
  // out of the meal, or out of the plan with what the slot held before back in it
  const liveUndo = () => {
    if (liveRec) { const id = liveRec.cardId; setState((s) => ({ ...deleteCardIn(s, id), recorded: undefined })); }
    if (livePlan) { p.fill(livePlan.date, livePlan.slotId, livePlan.was); setState((s) => ({ ...s, plannedAt: undefined })); }
  };
  // set: next to what is there (a dish more); replace: in its place
  const liveCommit = (date: string, sl: Slot | null, time: string | null, how: "set" | "add" | "replace") => {
    liveUndo();
    if (!items.length) return;
    const st = liveStatus({ date, time: sl ? time ?? sl.time : null }, todayKey, minutesOf(new Date()));
    if (st === "eaten") {
      if (how === "replace" && sl) { const gone = dishesOf(state.feedback, date, sl.id, liveRec?.cardId).map((f) => f.id); setState((s) => gone.reduce((x, id) => deleteCardIn(x, id), s)); }
      const at = sl ? atMeal(date, time ?? sl.time) : new Date().toISOString();
      p.liveLog({ id: uid(), title: liveTitle(), items: structuredClone(items), portion: items.reduce((n, i) => n + i.grams, 0), savedAt: new Date().toISOString() }, sl ? { date, slotId: sl.id, name: sl.name, time: time ?? sl.time } : null, at);
    } else if (st === "planned" && sl) {
      const was = livePlan && livePlan.date === date && livePlan.slotId === sl.id ? livePlan.was : p.planned[date]?.[sl.id] ?? null;
      const add = how !== "replace" && !!was && !was.skipped;
      p.fill(date, sl.id, add ? withDish(was!, liveMine()) : liveMine());
      const at = { date, slotId: sl.id, was: was ? structuredClone(was) : null, ...(add ? { add: true as const } : {}), had: dishesOf(state.feedback, date, sl.id, null).length };
      setState((s) => ({ ...s, plannedAt: at }));
    }
  };
  const liveTap = (date: string, sl: Slot | null) => {
    setLiveBack(false);
    if (!liveBase) { setLiveAsk(null); return; }
    const st = liveStatus({ date, time: sl ? sl.time : null }, todayKey, minutesOf(new Date()));
    // the same meal tapped again: it stands as it is
    if (liveRec && st === "eaten" && liveRec.slot?.date === date && (liveRec.slot?.slotId ?? null) === (sl?.id ?? null) && (sl || !liveRec.slot)) return;
    if (livePlan && st === "planned" && sl && livePlan.date === date && livePlan.slotId === sl.id) return;
    const held = !sl || !items.length ? "" : st === "eaten" ? dishesOf(state.feedback, date, sl.id, liveRec?.cardId).map((f) => f.meal.title).join(", ") : (() => { const m = p.planned[date]?.[sl.id]; return m && !m.skipped ? m.title : ""; })();
    liveCommit(date, sl, sl ? sl.time : null, "add");
    setLiveAsk(held && sl ? { date, id: sl.id, holds: held } : null);
  };
  const livePlanAte = livePlan ? dishesOf(state.feedback, livePlan.date, livePlan.slotId, null).length : 0;
  const liveSig = `${items.map((i) => `${i.id}:${i.food.id}:${Math.round(i.grams)}`).join("|")}~${items.length ? liveTitle() : ""}`;
  useEffect(() => {
    // an emptied plate is a new plate: what was logged or planned stays where it is, and no meal is set
    if (!stateAll.items.length) {
      if (stateAll.recorded?.live || stateAll.plannedAt) {
        setState((s) => ({ ...s, recorded: s.recorded?.live ? undefined : s.recorded, plannedAt: undefined }));
        if (p.pick && p.pick !== "exploring") p.setPick(null); if (p.filling?.by === "line") p.setFilling(null);
        setLiveAsk(null);
      }
      return;
    }
    // other foods altogether (a recipe put on the Plate, an idea taken): a new plate too, the meal it was logged in stays
    if (stateAll.recorded?.live && !p.recordNow) {
      setState((s) => ({ ...s, recorded: s.recorded?.live ? undefined : s.recorded }));
      if (p.pick && p.pick !== "exploring") p.setPick(null); if (p.filling?.by === "line") p.setFilling(null);
      return;
    }
    // Today asked about the planned meal and it was eaten there: the plate is no longer the plan's, and no meal is set
    if (livePlan && livePlanAte > livePlan.had) {
      setState((s) => ({ ...s, plannedAt: undefined }));
      if (p.pick && p.pick !== "exploring") p.setPick(null); if (p.filling?.by === "line") p.setFilling(null);
      return;
    }
    // a plan needs its meal: with no meal set (a new plate was started) the plate is no longer the plan's
    if (stateAll.plannedAt && !p.filling && !p.pick?.startsWith("meal:")) { setState((s) => ({ ...s, plannedAt: undefined })); return; }
    if (!liveOn || !liveSet) return;
    // the first food on a plate whose meal is already set
    if (!liveRec && !livePlan) { liveCommit(liveSet.date, liveSlot, liveSlot ? liveSlot.time : null, "add"); return; }
    // the name the foods give follows into the meal, as the foods do (DT246)
    if (liveRec) {
      const id = liveRec.cardId, title = liveTitle(), card = state.feedback.find((f) => f.id === id);
      if (card && card.meal.title !== title) setState((s) => ({ ...s, feedback: s.feedback.map((f) => (f.id === id ? { ...f, meal: { ...f.meal, title } } : f)) }));
    }
    // a planned plate is in the plan as it stands now
    if (livePlan) {
      const cur = p.planned[livePlan.date]?.[livePlan.slotId];
      if (!cur) setState((s) => ({ ...s, plannedAt: undefined }));
      else p.fill(livePlan.date, livePlan.slotId, livePlan.add && livePlan.was ? withDish(livePlan.was, liveMine()) : liveMine());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveSig, liveOn, liveSet?.date, liveSet?.name, !!liveRec, !!livePlan, !!p.recordNow, livePlanAte]);
  if (step === "in" && chef) {
    const t = aggregate(items), pd0 = density(t.protein, t.calories), kit = (p.personal.kitchens ?? []).length > 0;
    const opts = chef.status === "done" ? chef.options : [];
    const range = { meal: MealW, low: fmt(mealRange(share?.kcal ?? 0)[0], 0), high: fmt(mealRange(share?.kcal ?? 0)[1], 0), more: fmt((share?.kcal ?? 0) - (t.calories ?? 0), 0) };
    const waysKey: WordKey = opts.length === 3 ? (kit ? "plate.ideasThreeKitchens" : "plate.ideasThree") : opts.length === 2 ? (kit ? "plate.ideasTwoKitchens" : "plate.ideasTwo") : kit ? "plate.ideasOneKitchens" : "plate.ideasOne";
    const lead = chef.status === "working" ? w("plate.puttingTogether")
      : chef.status === "none" ? w("plate.ideasFailed")
      : `${pd0 !== null && pdRef !== null && pd0 >= pdRef ? w("plate.ideasHasProtein", { protein: fmt(t.protein, 0), pd: pdText(pd0) }) : w("plate.ideasUnder", { pd: pdText(pd0), target: pdVal(pdRef) })} ${w((t.calories ?? 0) < (share?.kcal ?? 0) ? "plate.ideasMealRangeMore" : "plate.ideasMealRange", range)} ${w(waysKey)}`;
    const chip = (a: MealOption["adds"][number]) => <span key={a.name} className={`mm-add ${a.have ? "have" : ""}`}>+ {cookPhrase(a.name, a.grams)}</span>;
    return (
      <>
        {stepHead({ n: 2, title: w("plate.ideasTitle", { meal: mealW, foods: aroundWord(items.filter((i) => !isDrink(i.food)).map((i) => i.food.name)) }), sub: lead, back: <button className="link back back-top" onClick={() => setChef(null)}><ChevronLeft size={16} /> {w("make.backToThePlate")}</button> })}
        {chef.small && <small className="muted mm-small">{w("fit.smallIdeas")}</small>}
        <small className="mm-stays">{w("plate.onThePlateList", { foods: items.map((i) => cookPhrase(i.food.name, i.grams)).join(", ") })} {items.length === 1 ? w("make.itStays") : w("make.theyStay")}</small>
        {chef.status === "working" && <div className="mm-working"><WaitSteps steps={chefSteps()} at={chefStage.at} done={chefStage.done} /></div>}
        {opts.map((o) => (
          <section className="card mm-card" key={o.title}>
            <div className="mm-top"><small className="mm-kitchen">{o.kitchen.toUpperCase()}</small><small className="mm-nums">{w("plate.kcalGramsPd", { kcal: fmt(o.kcal, 0), grams: fmt(o.items.reduce((n, i) => n + i.grams, 0), 0), pd: pdText(o.pd) })}</small></div>
            <b className="mm-title">{o.title}</b>
            <div className="mm-adds">{o.adds.map(chip)}</div>
            {o.cooking.length > 0 && <small className="mm-why mm-cook">{wx("plate.forCookingLine", { label: <b>{w("plate.forCooking")}</b>, foods: o.cooking.join(", ") })}</small>}
            <small className="mm-why">{o.why}</small>
            <button className="pill pill-small pill-primary" style={{ alignSelf: "stretch" }} onClick={() => putOnPlate(o)}>{w("make.putItOnThePlate")}</button>
          </section>
        ))}
        {chef.status !== "working" && chef.failed.map((f) => (
          <section className="card mm-card mm-fail" key={`miss-${f.title}`}>
            <b className="mm-title">{f.title}</b>
            <small className="mm-why">{w("plate.didNotFit", { why: f.why })}</small>
            {/* DT245 (0.3.96, a): it does not fit, and you decide: it goes on the plate at Chef Mealan's amounts */}
            {f.items && <button className="pill pill-small" style={{ alignSelf: "stretch" }} onClick={() => putMissOnPlate(f)}>{w("make.putItOnThePlate")}</button>}
          </section>
        ))}
        {opts.length > 0 && <small className="mm-legend"><span className="mm-add have">{w("plate.legendHave")}</span><span className="mm-add">{w("plate.legendNew")}</span> {w("plate.legendLine")}</small>}
        {chef.status !== "working" && <div className="button-row"><button className="pill pill-small" onClick={() => askChef(items, chef.tried)}>{w("make.otherIdeas")}</button><button className="pill pill-small" onClick={keepAsIs}>{w("make.keepItAsItIs")}</button></div>}
      </>
    );
  }
  // the Plate's title: the name, for a slot or a recipe; an empty plate asks what you are craving
  // DT305: the photo screen and the read. Once the plate starts being filled the meal's title takes the question's place
  const photoScreen = step === "in" && !!p.photoAsk;
  // a plate that became Just looking or Don't count it is no longer the read: it is kept as Served, as before
  const readView = step === "in" && !p.photoAsk && state.photo?.view === "read" && state.photo.who !== "idea" && p.pick !== "exploring" && items.length > 0;
  const titleField = (placeholder: string) => ({ value: state.title === "DaaM" ? "" : state.title, placeholder, onChange: (v: string) => setState((s) => ({ ...s, title: v })), onCommit: (v: string) => p.renamePlate(v) });
  // DT308 (0.3.154): the food list. On an empty plate it stands in the card under From the list; with foods on the plate it is Quick picks, as before
  // DT308 Release 2 (0.3.155): with foods on the plate the list lives inside + Add more to your plate: the search, what it
  // finds, See all foods and Add manually; the three foods per macro are for the empty plate
  const addTiles = (
          <div className="ways ways-tiles ways-three">
            <label className="pill pill-small"><ImageIcon size={24} /> {w("plate.recipePhoto")}<input type="file" accept="image/*" multiple hidden onChange={(e) => { void recipeIn.addShots(e.target.files); e.target.value = ""; }} /></label>
            <button type="button" className="pill pill-small" onClick={() => recipeIn.setInFlow({ kind: "link", url: "" })}><LinkIcon size={24} /> {w("plate.recipeLink")}</button>
            <button type="button" className="pill pill-small mp-button" onClick={() => { setMoreOpen(false); if (p.ai.on) p.mealCamera(); else { setMode("label"); setCamera(true); } }}><Camera size={24} /> {w("plate.photoOrScan")}</button>
          </div>
  );
  const listBlock = (empty: boolean) => (<>
        <b className="ways-head ways-head-second">{w("plate.fromTheList")}</b>
        <ClearField value={q} onClear={() => setQ("")} label={w("make.clearTheSearch")}><input className="search plate-search" aria-label={w("plate.searchAll")} placeholder={w("plate.searchAll")} value={q} onChange={(e) => setQ(e.target.value)} /></ClearField>
        <div className="rows">
          {/* R9 (0.2.33, boards RS4 and RS5): while a recipe is on the plate, only foods that go with the dish; one line names what was held back */}
          {heldBack.length > 0 && plateTasteOf && <small className="muted held-back">{heldBackLine(plateTasteOf, heldBack)}</small>}
          {(q.trim() ? found : empty ? macro.flatMap((g) => g.foods) : []).map((f) => {
              const head = !q.trim() && empty ? macro.find((g) => g.foods[0] === f) : null;
              const inList = items.some((i) => libraryId(i.food.id) === f.id);
              const why = q.trim() ? null : quick.why.get(f.id);
              return (<Fragment key={f.id}>
                {head && <small className="macro-group">{w(head.key === "protein" ? "plate.macroProtein" : head.key === "carbs" ? "plate.macroCarbs" : "plate.macroFat")}</small>}
                <div className="row row-food">
                  <span className="thumb thumb-sm">{f.photo ? <img src={f.photo} alt="" /> : (f.icon || iconFor(f.name))}</span>
                  <div className="row-text"><b>{f.favorite && <span className="fav-mark" aria-label={w("make.favourite")}>★ </span>}{foodName(f)}</b><small>{f.brand ? `${f.brand} · ` : ""}{pdText(density(f.protein, f.calories))}{why === "often" ? " · often" : ""}</small></div>
                  <button className={`pill pill-small${inList ? " pill-done" : ""}`} disabled={inList} onClick={() => add(f)}>{inList ? w("plate.onPlate") : <><Plus size={14} /> {w("plate.add")}</>}</button>
                </div>
              </Fragment>);
            })}
          {/* DT125 (0.2.104): the Plate's search reads the one list too: after your foods, the members' and the basic foods; + Add
              (Take it until DT148, 0.2.129) puts a copy in your foods and on the plate */}
          {q.trim() && plateOthers.map((r) => (
            <div className={`row row-food row-${r.kind}`} key={r.key}>
              <span className="thumb thumb-sm">{r.food.photo ? <img src={r.food.photo} alt="" /> : (r.kind === "basic" ? "📘" : iconFor(r.food.name))}</span>
              <div className="row-text"><b>{r.names[0]}</b><small>{rowLine(r)}</small></div>
              <button className="pill pill-small" onClick={() => { if (r.kind === "member") p.addMemberFood(r.member, "plate"); else { const f = { ...r.food, id: uid(), reviewedAt: new Date().toISOString() }; setState((st) => ({ ...st, foods: [f, ...st.foods] })); add(f); } }}><Plus size={14} /> {w("make.add")}</button>
            </div>
          ))}
          {state.foods.length === 0 && <small>{w("make.noSavedFoodsYetScan")}</small>}
        </div>
        <div className="button-row list-ends">
          <button type="button" className="pill pill-small" onClick={() => setTab("foods")}>{w("plate.seeAllFoods")}</button>
          <button type="button" className="pill pill-small" onClick={() => blank()}><Plus size={14} /> {w("plate.addManually")}</button>
        </div>
  </>);
  // DT307.1 (0.3.163, board DT307): Back to the photo, at the top of the read and once more at its end
  const backToPhoto = (cls: string) => <button type="button" className={`link ask-back ${cls}`} onClick={p.backToPhoto}><ChevronLeft size={18} aria-hidden="true" />{w("plate.backToPhoto")}</button>;
  // DT307.1 (0.3.163, board DT307; Coach Milan 16 November, Go 18 November 19:13): one light row above the title
  const inHead = step === "in" ? (photoScreen ? stepHead({ n, title: "", bare: true, back: <button type="button" className="link ask-back pa-back" onClick={p.backToCamera}><ChevronLeft size={18} aria-hidden="true" />{w("plate.backToCamera")}</button>, nameField: { value: photoTitle, placeholder: w("photoask.namesIt"), onChange: (v: string) => setPhotoTitle(v), pen: true } })
          : readView ? stepHead({ n, title: "", bare: true, back: backToPhoto("rv-back-top"), sub: state.photo?.namedAs && (state.title ?? "").trim() === state.photo.namedAs ? w("plate.namedFromPhoto") : undefined, nameField: titleField(autoTitle(items)) })
          : p.filling
          ? Head({ name: true, title: "", sub: p.filling.mode === "eat" ? w("make.asPlannedChangeWhatYou") : plateWhen === "past" ? w("plate.addingSub", { slot: slotV(p.filling) }) : plateWhen === "plan" ? w("plate.planningSub", { slot: slotV(p.filling) }) : w("make.nameItOrKeepThe") })
          : madeBy && items.length > 0
            ? Head({ name: true, title: "", sub: w("plate.madeBySub", { kitchen: madeBy.kitchen, meal: mealW, foods: aroundWord(madeBy.from.filter((i) => !isDrink(i.food)).map((i) => i.food.name)) }) })
          : imported && rec
            ? Head({ name: true, title: "", sub: way?.kind === "change" ? w("plate.changedSub", { title: rec.title, meal: mealW })
              : way?.kind === "side" ? w("plate.sideSub", { title: rec.title, pct: Math.round((kcalOfItems(way.options[way.pick].dish) / Math.max(1, kcalOfItems(rec.items) / (rec.makes?.n ?? 1))) * 100), one: oneOf(rec), side: way.options[way.pick].name, where: sideWord(way.options[way.pick].kind) })
              : w("plate.fromSub", { source: rec.source?.name || wordV(state.photo?.pot === rec.id ? "plate.yourPhoto" : rec.source?.from === "link" ? "plate.theLink" : "plate.yourScreenshot"), how: pmode === "whole" ? w("make.theWholeRecipeAsYou") : pmode === "sized" && mealNeed ? w("plate.mixSized", { meal: mealW }) : w("plate.oneAsMakes", { one: oneOf(rec) }) }) })
          // DT324 (0.3.162, board DT324; Coach Milan, Go 19 November 09:48): the Plate's screen of a photo says what the read
          // says, while the plate has the name Chef Mealan gave it; a name of your own has no line, as on the read
          : state.photo && items.length > 0
            ? Head({ name: true, title: "", sub: state.photo.namedAs && (state.title ?? "").trim() === state.photo.namedAs ? w("plate.namedFromPhoto") : undefined })
          // DT308: a title you typed on the empty plate is yours, not a recipe's: From My recipes only when a recipe has that name
          : state.title && state.title !== "DaaM" && items.length > 0 && state.meals.some((m) => m.title === state.title)
            ? Head({ name: true, title: "", sub: w("plate.fromMyRecipes") })
            : items.length > 0 ? Head({ name: true, title: "", sub: w("plate.nameItOrKeep") })
            // DT308 (0.3.154, board Stories236; Coach Milan 17 November 02:15 to 02:49): no second title under Plate; the meal's title as a placeholder
            : stepHead({ n, title: "", bare: true, nameField: { ...titleField(w("plate.mealTitle")), pen: true } })) : null;
  // ---- DT212 v4 and DT214 v2 (0.3.53): every question on the Plate is Chef Mealan's line and shows alone; the foods wait ----
  const since = plateSince(state);
  const plateIsOld = plateOldOf(state);
  const slotFor = (d: Date): Feedback["slot"] | null => {
    const date = ymd(d), hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    if (pickSlot) return { date, slotId: pickSlot.id, name: pickSlot.name, time: pickSlot.time };
    const sl = slotAt(slotsOn(lifestyleOf(p.personal), p.personal.timesOn, date), hm);
    return sl ? { date, slotId: sl.id, name: sl.name, time: sl.time } : null;
  };
  const plateMeal = (): Meal => ({ id: uid(), title: state.title && state.title !== "DaaM" ? state.title : autoTitle(items), items: structuredClone(items), portion: items.reduce((n, i) => n + i.grams, 0), savedAt: new Date().toISOString() });
  const clearPlate = () => { emptyPlate(); setState((s) => ({ ...s, title: "", plateAsked: undefined })); };
  // DT203 release 2 (0.3.77): the plate in words, in the language of the line it goes in
  const plateIn: PlateIn = (l) => { const base = state.title && state.title !== "DaaM" ? state.title : foodsLineIn(l, items); return base === null ? null : state.photo ? wIn(l, "plate.fromPhoto", { plate: base }) : base; };
  const dayOf = since ? dayWord(new Date(state.photo?.at ?? since.toISOString())) : "";
  const dayOfV: Val = (l) => (since ? dayIn(l, new Date(state.photo?.at ?? since.toISOString())) : "");
  // the plate that is there, by its name or its foods
  const plateHas = state.title && state.title !== "DaaM" ? state.title : autoTitle(items);
  // set when a question brings its own head (B146): the plate's title does not stand over it
  let ownHead = false;
  // DT314: the calendar is built further down; the question that shows it reads it when it is drawn
  const lateCal: { el: React.ReactNode } = { el: null };
  const inQuestion = step !== "in" ? null
    // DT285 (0.3.139, board Stories212): the same photo already a meal of that day asks first
    : p.sameAsk ? (<section className="chef-ask same-ask-wrap" aria-label={w("make.yourPlateFromEarlier")}>{plateIsOld && since && <ChefLine image={state.photo?.image} text={say("plateOldAte", since, plateIn)} />}<SamePhotoAsk ask={p.sameAsk} answer={p.answerSameAsk} /></section>)
    // DT240 (0.3.96, board Stories182; Coach Milan 6 November 10:14 and 10:32, b): a new plate came in while a cook is still
    // open: Chef Mealan asks once, Go on with it or End it; the strip waits for the answer
    : p.cookOpenAsk && state.cook && items.length > 0 ? (() => { const c = state.cook!, sw = stripWords(c); return (
      <section className="chef-ask cook-open-ask" aria-label={w("plate.cookOpenAria", { dish: c.title })}>
        <ChefLine image={state.photo?.image} text={say("cookOpen", (sw ? sw.rest : c.title).replace(" · ", ", "), c.title)} />
        <div className="ca-go"><button type="button" className="pill pill-primary" onClick={() => p.answerCookOpen("go")}>{w("plate.cookOpenGo", { dish: c.title })}</button><button type="button" className="pill" onClick={() => p.answerCookOpen("end")}>{w("strip.endIt")}</button></div>
        <small>{w("plate.cookOpenHelp", { dish: c.title })}</small>
      </section>); })()
    // DT247 (0.3.96, board Stories183): a second photo soon after a meal: Dessert to that meal, or its own snack
    : p.dishAsk && items.length > 0 ? (() => { const a = p.dishAsk!, meal = mealV(a.meal, true), dish = a.dish || (state.title && state.title !== "DaaM" ? state.title : autoTitle(items));
      const dessert = <button key="d" type="button" className={`pill${a.dessertFirst ? " pill-primary" : ""}`} onClick={() => p.answerDishAsk("dessert")}>{w("dish.dessertTo", { meal })}</button>;
      const snack = <button key="s" type="button" className={`pill${a.dessertFirst ? "" : " pill-primary"}`} onClick={() => p.answerDishAsk("snack")}>{w("dish.ownSnack")}</button>;
      return (
      <section className="chef-ask dish-ask" aria-label={w("dish.askAria")}>
        <ChefLine image={state.photo?.image} text={say("secondDish", dish, a.minutes, a.prev, a.meal)} />
        {/* DT278 (0.3.145, board Stories218): a third answer, Don't count it; the main answer on the right (DT289) */}
        <div className="ca-go ca-go-right"><button key="n" type="button" className="pill dish-not-counted" onClick={() => p.answerDishAsk("notCounted")}>{w("dish.dontCountIt")}</button>{a.dessertFirst ? [snack, dessert] : [dessert, snack]}</div>
        <small>{w("dish.askHelp", { meal })}</small>
      </section>); })()
    // a food scanned while a cook runs
    : p.pendingFood && state.cook ? (() => { const f = p.pendingFood!, pdf = density(f.protein, f.calories); return (
      <section className="chef-ask" aria-label={w("make.useItInTheDish")}>
        <div className="ca-food">{f.photo ? <img src={f.photo} alt="" /> : <span className="ca-food-icon" aria-hidden="true">{f.icon ?? "🍽"}</span>}<span><b>{f.name}</b><br /><small className="muted">{w("plate.justScanned")}{pdf !== null ? ` · ${pdText(pdf)}` : ""}</small></span></div>
        <ChefLine text={say("scanWhileCooking", state.cook!.title, f.name.split(",")[0].trim().toLowerCase())} />
        <div className="ca-go"><button type="button" className="pill pill-primary" onClick={() => p.answerPendingFood("use")}>{w("plate.useItIn", { dish: state.cook!.title })}</button><button type="button" className="pill" onClick={() => p.answerPendingFood("plate")}>{w("make.putItOnThePlate2")}</button><button type="button" className="pill" onClick={() => p.answerPendingFood("keep")}>{w("make.keepItInMyFoods")}</button></div>
        <small>{w("plate.useItHelp")}</small>
      </section>); })()
    // Start cooking with foods on the Plate
    : p.cookAsk && items.length > 0 ? (() => { const m = p.cookAsk!.meal; return plateIsOld && since ? (
      <section className="chef-ask" aria-label={w("make.beforeYouCookYourPlate")}>
        <ChefLine image={state.photo?.image} text={say("plateOldBeforeCook", since, plateIn)} />
        {/* DT317 (0.3.161, board DT317; Coach Milan, Go 18 November 19:13): Ate it asks the meal here too. The calendar of
            DT314 opens under the buttons on the day the plate was started, the nearest meal marked; a tap on a row logs the
            plate there, and the cooking starts. */}
        <div className="ca-go"><button type="button" className={`pill pill-primary old-ate${endCal?.old ? " on" : ""}`} aria-expanded={!!endCal?.old} onClick={() => setEndCal(endCal?.old ? null : { kind: "ate", day: ymd(new Date(state.photo?.at ?? since.toISOString())), more: false, old: true })}>{w("plate.ateIt")}</button><button type="button" className="pill" onClick={() => p.answerCookAsk("save")}>{w("plate.saveForLater")}</button></div>
        <div className="ca-links"><button type="button" className="pill pill-small pill-danger-line" onClick={() => p.answerCookAsk("clear")}>{w("plate.clearIt")}</button><button type="button" className="link" onClick={() => { setEndCal(null); p.answerCookAsk(null); }}>{w("plate.cancel")}</button></div>
        {endCal?.old && <div className="old-ate-cal"><Late get={() => lateCal.el} /></div>}
        <small>{w("plate.cookAskHelp", { dish: m.title })}</small>
      </section>) : (
      <section className="chef-ask" aria-label={w("make.beforeYouCookYourPlate2")}>
        <ChefLine image={state.photo?.image} text={say("plateSaveOrClear", items.length, since, m.title)} />
        <div className="ca-go"><button type="button" className="pill pill-primary" onClick={() => p.answerCookAsk("save")}>{w("plate.saveMine")}</button><button type="button" className="pill" onClick={() => p.answerCookAsk("clear")}>{w("plate.clearMine")}</button></div>
        <div className="ca-links"><button type="button" className="link" onClick={() => p.answerCookAsk(null)}>{w("plate.cancel")}</button></div>
        <small>{w("plate.saveMineHelp")}</small>
      </section>); })()
    // DT308.12 (0.3.157, board Stories245, frame w): a recipe read from Recipe photo or Recipe link onto a plate with foods:
    // the same question in the same look as for a photo. Back returns to what was read, with nothing changed.
    : recipeAsk && items.length > 0 ? (() => { ownHead = true; const f = recipeAsk, why = w("plate.notEmptyWhyRecipe", { plate: "\u0001" }).split("\u0001");
      const n = f.recipe.items.filter((i) => i.on ?? !i.optional).length, makes = f.recipe.servings >= 2 && f.recipe.servingsUnit ? `${f.recipe.servings} ${f.recipe.servingsUnit}` : "";
      return (<>
        <button type="button" className="link ask-back" onClick={() => setRecipeAsk(null)}><ChevronLeft size={18} aria-hidden="true" />{w("plate.backToRecipe")}</button>
        <div className="step-head plate-ask-head"><h2 className="warn-title"><TriangleAlert size={26} aria-hidden="true" />{w("plate.notEmpty")}</h2><div className="warn-box">{why[0]}<b>{plateHas}</b>{why[1] ?? ""}</div></div>
        <section className="chef-ask pa plate-ask plate-ask-photo plate-ask-recipe" aria-label={w("make.addToThisPlateOr")}>
          {makes ? <ChefLine text={say("plateRecipeFor", f.recipe.title, n, makes)} /> : <ChefLine text={say("plateRecipe", f.recipe.title, n)} />}
          <b className="pa-ask-q">{w("plate.addOrNewQRecipe")}</b>
          <div className="ca-go pa-go"><button type="button" className="pill pill-primary" onClick={() => void putRead(f, "add")}>{w("plate.addToMine")}</button><button type="button" className="pill" onClick={() => void putRead(f, "new")}>{w("plate.startNew")}</button></div>
          <small>{w("plate.addOrNewHelpRecipe")} <span className="ask-old-goes">{w("plate.oldSavedSoft", { plate: plateHas })}</span></small>
        </section></>); })()
    // foods about to land on a plate that has foods (DT131): add, or a new plate
    : p.plateAsk && items.length > 0 ? (() => {
      const a = p.plateAsk!, photo = a.kind === "photo";
      // B146 (0.3.152, board Stories235, frame h): a photo onto a plate that has foods is a screen of its own. First the issue,
      // with a warning sign: your plate is not empty, and why you are asked. Then what the photo holds, with Remove the photo
      // beside the photo. Then the question and its two answers.
      if (photo && a.holds && a.image) { ownHead = true; const why = w("plate.notEmptyWhy", { plate: "\u0001" }).split("\u0001"); return (<>
        {/* DT308.12f (0.3.157, board Stories244): Back returns to the photo screen with nothing changed */}
        {a.back && <button type="button" className="link ask-back" onClick={a.back}><ChevronLeft size={18} aria-hidden="true" />{w("plate.backToPhoto")}</button>}
        <div className="step-head plate-ask-head"><h2 className="warn-title"><TriangleAlert size={26} aria-hidden="true" />{w("plate.notEmpty")}</h2><div className="warn-box">{why[0]}<b>{plateHas}</b>{why[1] ?? ""}</div></div>
        <section className="chef-ask pa plate-ask plate-ask-photo" aria-label={w("make.addToThisPlateOr")}>
          <ChefLine image={a.image} text={say("plateHolds", a.holds)} side={<button type="button" className="pill pill-small pill-danger-line pa-keep" onClick={() => p.answerPlateAsk(null)}>{w("plate.dropPhoto")}</button>} />
          <b className="pa-ask-q">{w("plate.addOrNewQ")}</b>
          <div className="ca-go pa-go"><button type="button" className="pill pill-primary" onClick={() => p.answerPlateAsk("add")}>{w("plate.addToMine")}</button><button type="button" className="pill" onClick={() => { parkOld("photo"); p.answerPlateAsk("new"); }}>{w("plate.startNew")}</button></div>
          <small>{w("plate.addOrNewHelpPhoto")} <span className="ask-old-goes">{w("plate.oldSavedSoft", { plate: plateHas })}</span></small>
        </section></>); }
      // DT313 (0.3.159, board Stories250, frames e and f; Coach Milan, Go 18 November 15:56): a recipe from Recipes, a meal
      // from the Plan, the idea from the chat, foods said in words and a food onto a plate from earlier ask on the same
      // screen as a photo. Back takes the place of Keep my plate: nothing lands. Start a new plate keeps the old plate in
      // My recipes, with the one line and Undo.
      if (!photo) { ownHead = true; const dish = a.kind === "recipe" || a.kind === "slot";
        const why = (a.kind === "food" && a.when ? w("plate.notEmptyWhyOld", { plate: "\u0001", when: a.when }) : w(dish ? "plate.notEmptyWhyRecipe" : "plate.notEmptyWhyNew", { plate: "\u0001" })).split("\u0001");
        return (<>
          <button type="button" className="link ask-back" onClick={a.back ?? (() => p.answerPlateAsk(null))}><ChevronLeft size={18} aria-hidden="true" />{a.backTo === "recipe" ? w("plate.backToRecipe") : a.backTo === "plan" ? w("out.backToThePlan") : a.backTo === "chat" ? w("out.backToTheChat") : w("make.backToThePlate")}</button>
          <div className="step-head plate-ask-head"><h2 className="warn-title"><TriangleAlert size={26} aria-hidden="true" />{w("plate.notEmpty")}</h2><div className="warn-box">{why[0]}<b>{plateHas}</b>{why[1] ?? ""}</div></div>
          <section className={`chef-ask pa plate-ask plate-ask-photo plate-ask-recipe plate-ask-${a.kind}`} aria-label={w("make.addToThisPlateOr")}>
            <ChefLine text={say("plateArrives", a.what)} />
            <b className="pa-ask-q">{w(a.kind === "said" ? "plate.addOrNewQ" : "plate.addOrNewQRecipe")}</b>
            <div className="ca-go pa-go"><button type="button" className="pill pill-primary" onClick={() => p.answerPlateAsk("add")}>{w("plate.addToMine")}</button><button type="button" className="pill" onClick={() => { parkOld(dish ? "recipe" : "new"); p.answerPlateAsk("new"); }}>{w("plate.startNew")}</button></div>
            <small>{w(dish ? "plate.addOrNewHelpRecipe" : "plate.addOrNewHelp")} <span className="ask-old-goes">{w("plate.oldSavedSoft", { plate: plateHas })}</span></small>
          </section></>); }
      const add = <button key="add" type="button" className={`pill${photo ? " pill-primary" : ""}`} onClick={() => p.answerPlateAsk("add")}>{w("plate.addToMine")}</button>;
      const fresh = <button key="new" type="button" className={`pill${photo ? "" : " pill-primary"}`} onClick={() => p.answerPlateAsk("new")}>{w("plate.startNew")}</button>;
      return (
        <section className="chef-ask pa plate-ask" aria-label={w("make.addToThisPlateOr")}>
          <ChefLine image={a.image} text={say("plateAddPhoto", items.length, state.title && state.title !== "DaaM" ? state.title : "", a.what)} />
          <div className="ca-go pa-go">{photo ? [add, fresh] : [fresh, add]}</div>
          <div className="ca-links"><button type="button" className="pill pill-small pill-danger-line pa-keep" onClick={() => p.answerPlateAsk(null)}>{w("plate.dropPhoto")}</button></div>
          <small>{w(photo ? "plate.addOrNewHelpPhoto" : "plate.addOrNewHelp")}</small>
        </section>
      ); })()
    // a plate from an earlier meal: Did you eat it?
    : plateIsOld && since && !p.filling && !inCook && !p.recordNow && !readView && !photoScreen ? (
      <section className="chef-ask" aria-label={w("make.yourPlateFromEarlier")}>
        <ChefLine image={state.photo?.image} text={say("plateOldAte", since, plateIn)} />
        {/* DT314 (0.3.159, board Stories251; Coach Milan, Go 18 November 15:56): Ate it asks the meal. The calendar opens
            under the buttons on the day the plate was started, the nearest meal marked; a tap on a row logs it there. */}
        <div className="ca-go"><button type="button" className={`pill pill-primary old-ate${endCal?.old ? " on" : ""}`} aria-expanded={!!endCal?.old} onClick={() => setEndCal(endCal?.old ? null : { kind: "ate", day: ymd(new Date(state.photo?.at ?? since.toISOString())), more: false, old: true })}>{w("plate.ateIt")}</button><button type="button" className="pill" onClick={p.savePlate}>{w("plate.saveForLater")}</button></div>
        <div className="ca-links"><button type="button" className="link" onClick={p.keepWorking}>{w("plate.keepWorking")}</button><button type="button" className="pill pill-small pill-danger-line" onClick={clearPlate}>{w("plate.clearIt")}</button></div>
        {endCal?.old && <div className="old-ate-cal"><Late get={() => lateCal.el} /></div>}
        <small>{w(state.photo ? "plate.oldHelpPhoto" : "plate.oldHelp", { day: dayOfV })}</small>
      </section>)
    : null;
  // DT212 v4: plates and cooks saved for later wait under the title, with Continue; swipe left to remove
  // DT227 (0.3.61, board Stories167): only on the Plate's start screen, the empty What are you craving?
  const laterBlock = step === "in" && (state.later ?? []).length > 0 && items.length === 0 && !state.photo && !state.fromRecipe && !p.filling && !photoScreen ? (
    <section className="card later-card" aria-label={w("make.savedForLater")}>
      <b>{w("make.savedForLater")}</b>
      <div className="later-list">{state.later!.map((x) => <LaterRow key={x.id} x={x} onContinue={() => p.continueLater(x.id)} onRemove={() => p.removeLater(x.id)} />)}</div>
      <small>{w("make.continuePutsItBackOn")}</small>
    </section>) : null;
  // the plate you build yourself, now or for a meal: not a recipe as mapped, not Chef Mealan's meal, not an idea from a photo,
  // not a plate for the plan or for a day gone by (those keep their own buttons)
  // a dish on the plate: a recipe as mapped, or a plate that carries the name of one of your recipes
  const dishTitle = items.length > 0 ? (imported && rec ? (state.title && state.title !== "DaaM" ? state.title : rec.title) : state.title && state.title !== "DaaM" && state.meals.some((m) => m.title === state.title) ? state.title : null) : null;
  const plainWays = !(imported && rec) && !(madeBy && items.length > 0) && !(state.photo?.who === "idea" && items.length > 0) && !(p.filling && plateWhen !== "now");
  const fitsTarget = ["plan", "high", "top"].includes(p.fitPd(pd));
  // ---- DT308.12 (0.3.157, board Stories244, frames m to o): Start a new plate saves the plate that was there in My recipes ----
  // With no name typed it takes the foods' name. The same foods under the same name are already that recipe: no copy.
  function parkOld(kind: "photo" | "recipe" | "new") {
    if (!items.length) return;
    const title = (state.title && state.title !== "DaaM" ? state.title.trim() : "") || autoTitle(items);
    const sameFoods = (m: Meal) => m.items.length === items.length && m.items.every((x, i) => x.food.id === items[i].food.id && Math.round(x.grams) === Math.round(items[i].grams));
    const found = state.meals.find((m) => (m.title === title || m.id === state.fromRecipe || m.id === state.savedPlate?.id || m.id === state.photo?.saved) && sameFoods(m));
    const ph = state.photo && state.photo.who !== "idea" ? state.photo.image : null;
    const meal: Meal = found ?? { id: uid(), title, items: structuredClone(items).map((i) => ({ ...i, est: undefined })), portion: items.reduce((n, i) => n + i.grams, 0), savedAt: new Date().toISOString(), steps: [], ...(ph ? withRecipePhotos([ph]) : {}) };
    oldPhoto.current = stateAll.photo;
    setState((s) => ({ ...s, meals: found ? s.meals : [structuredClone(meal), ...s.meals], savedPlate: undefined,
      oldPlate: { id: meal.id, title: meal.title, kind, made: !found, back: { items: structuredClone(s.items), title: s.title, portion: s.portion ?? null, course: s.course, fromRecipe: s.fromRecipe, pick: p.pick, recipeId: p.plateRecipeId } } }));
    // the new plate starts with no meal set
    p.setPick(null); if (p.filling) p.setFilling(null); if (p.moment !== "regular") p.setMoment("regular"); setEndCal(null); setLineOpen(false);
  }
  // Undo: the old plate is on the Plate again, as if Start a new plate had not been tapped
  const undoOld = () => {
    const o = state.oldPlate; if (!o) return;
    setInFlow(null); setWay(null); setPartsMode(false); setEndCal(null);
    setState((s) => ({ ...s, meals: o.made ? s.meals.filter((m) => m.id !== o.id) : s.meals, items: o.back.items, title: o.back.title, portion: o.back.portion, course: o.back.course, fromRecipe: o.back.fromRecipe,
      photo: oldPhoto.current, recipeFoods: undefined, optional: undefined, leftOut: undefined, emptyParts: undefined, cooking: undefined, cookingFor: undefined, openRecipe: undefined, recorded: undefined, oldPlate: undefined }));
    p.setPick(o.back.pick ?? null);
    // DT313 (0.3.159): the meal the new plate was opened for goes with it, and the old plate is the recipe it was again
    if (p.filling) p.setFilling(null); if ("recipeId" in o.back) p.setPlateRecipeId(o.back.recipeId ?? null);
  };
  const oldLine = state.oldPlate && items.length > 0 && step === "in" ? (() => { const o = state.oldPlate!, says = w("plate.oldSaved", { plate: "\u0001" }).split("\u0001"); return (
    <div className="warn-box old-plate" role="status">
      <div className="old-plate-top"><div className="old-plate-say"><b>{says[0]}{o.title}{says[1] ?? ""}</b> {w(o.kind === "photo" ? "plate.holdsOnlyPhoto" : o.kind === "new" ? "plate.holdsOnlyNew" : "plate.holdsOnlyRecipe")}</div>
        <button type="button" className="icon old-plate-x" aria-label={w("plate.close")} onClick={() => setState((s) => ({ ...s, oldPlate: undefined }))}><X size={20} /></button></div>
      <div className="old-plate-acts"><button type="button" className="link old-plate-open" onClick={() => p.openMeal(o.id, { tab: "journey" })}>{w("plate.openInMyRecipes")} ›</button>
        <button type="button" className="pill pill-small old-plate-undo" onClick={undoOld}>{w("today.undo")}</button></div>
    </div>); })() : null;
  // ---- 0.3.157: What do you do with it? Save it, Plan it, Ate it (DT308.4 to DT308.6, DT308.11) ----
  const plateTitle = () => (state.title && state.title !== "DaaM" ? state.title.trim() : "") || autoTitle(items);
  const kcalNow = () => Math.round(aggregate(items).calories ?? 0);
  const leavePlate = () => { p.setPick(null); if (p.filling) p.setFilling(null); if (p.moment !== "regular") p.setMoment("regular"); setEndCal(null); setLineOpen(false); setStep("in"); };

  // the line under the meals: what the tap did. What holds comes first; with nothing on the plate yet, what it will do
  const liveSays: LiveStatus | null = liveSet ? liveIs ?? liveStatus({ date: liveSet.date, time: liveSlot ? liveSet.time : null }, todayKey, minutesOf(new Date())) : null;
  const liveWhere: Val = (l) => { if (!liveSet) return ""; const f = liveSlot ? fillingOn(liveSet.date, liveSlot) : { ...fillingOn(todayKey, { id: "snack", name: "Snack", time: "12:00" } as Slot) }; return l === "en" ? `${f.dayName === "today" ? "today's" : `${f.dayName}'s`} ${f.name}` : (slotV(f) as (x: typeof l) => string | null)(l); };
  const liveLine = !liveOn ? null : !liveSet ? w(liveBack ? "plate.liveBack" : "plate.liveLooking") : liveSays === "planned" ? w("plate.livePlan", { slot: liveWhere }) : w("plate.liveCounts", { slot: liveWhere });
  const liveHeld = liveAsk && liveSet && liveSlot && liveAsk.date === liveSet.date && liveAsk.id === liveSlot.id && items.length > 0 ? (() => {
    const txt = w("plate.liveHolds", { meal: mealV(liveSlot.name), title: "\u0001" }).split("\u0001"), a = liveAsk, sl = liveSlot;
    return (
      <div className="pcal-held live-held" role="group" aria-label={w("cal.addDish")}>
        <div className="pcal-held-q">{txt[0]}<b>{a.holds}</b>{txt[1] ?? ""}</div>
        <div className="pcal-held-btns">
          <button type="button" className="pill pill-small live-replace" onClick={() => { liveCommit(a.date, sl, sl.time, "replace"); setLiveAsk(null); }}>{w("cal.replaceIt")}</button>
          <button type="button" className="pill pill-small pill-primary live-add" onClick={() => setLiveAsk(null)}>{w("cal.addDish")}</button>
        </div>
      </div>); })() : null;
  // B154 (0.3.172, board B154; Coach Milan, Go 21 November 23:43): logging and cooking are two facts of one meal. A plate
  // the pencil logged in a meal of today says Prepare it like every other plate, and its cook stays on that meal: Save on
  // Eat asks nothing and writes into the meal already logged (liveSave, below). Prepare it again is gone. A plate logged
  // on a past day, or planned for another day, is cooked now as a cook of its own: today's cook cannot be that day's meal.
  const livePrepare = () => {
    setChef(null);
    if (liveIs === "eaten" && p.filling) { setState((s) => ({ ...s, recorded: undefined })); p.setFilling(null); }
    else if (liveIs === "eaten") { /* B154: the cook stays on the meal already logged */ }
    else if (p.filling) { setState((s) => ({ ...s, plannedAt: undefined })); p.setFilling(null); }
    setLiveAsk(null); setLineOpen(false);
    setState((s) => ({ ...s, portion: null, title: s.title || "DaaM" })); setMethod(null);
    if (cooksPlate(items) && stepsHold(items)) { setStep("made"); return; }
    setStep("make"); startPlateSteps();
  };
  // Plan it: the plate into a meal of the plan. set: the meal is free; add: one more dish in it; replace: in its place.
  // The plate is saved in My recipes as today (the same foods under the same name are that recipe, no copy).
  const planPlate = (f: NonNullable<typeof p.filling>, how: "set" | "add" | "replace") => {
    const its = items, title = plateTitle();
    const sameFoods = (m: Meal) => m.items.length === its.length && m.items.every((x, i) => x.food.id === its[i].food.id && Math.round(x.grams) === Math.round(its[i].grams));
    const dishId = its.length > 0 && its.every((i) => i.dish && i.dish.id === its[0].dish!.id) ? its[0].dish!.id : null;
    const kept = state.photo?.saved ?? state.savedPlate?.id;
    const found = (dishId ? state.meals.find((m) => m.id === dishId) : undefined) ?? (kept ? state.meals.find((m) => m.id === kept && sameFoods(m)) : undefined) ?? state.meals.find((m) => m.title === title && sameFoods(m));
    const ph = state.photo && state.photo.who !== "idea" ? state.photo.image : null;
    const meal: Meal = found ? { ...found, title } : { id: uid(), title, items: structuredClone(its).map((i) => ({ ...i, est: undefined })), portion: its.reduce((n, i) => n + i.grams, 0), savedAt: new Date().toISOString(), ...(ph ? withRecipePhotos([ph]) : {}) };
    if (found && found.title !== title) p.renameMeal(found.id, title);
    setState((s) => ({ ...s, meals: found ? s.meals : [structuredClone(meal), ...s.meals], items: [], portion: null, title: "", photo: undefined, course: undefined, savedPlate: undefined, fromRecipe: undefined, recipeFoods: undefined, optional: undefined, leftOut: undefined, emptyParts: undefined, cooking: undefined, cookingFor: undefined }));
    const t = aggregate(its);
    const mine: PlannedMeal = { ...fromMeal(meal, "plate"), source: found ? (found.from === "coach" ? "coach" : "mine") : "plate", kcal: Math.round(t.calories ?? 0), protein: Math.round(t.protein ?? 0), items: structuredClone(its).map((i) => ({ ...i, est: undefined })), portion: its.reduce((n, i) => n + i.grams, 0) };
    const was = p.planned[f.date]?.[f.slotId];
    const both = how === "add" && was && !was.skipped;
    p.fill(f.date, f.slotId, both ? withDish(was, mine) : mine);
    leavePlate(); showPlanOn(f.date); setTab("plan");
    notify(both ? w(found ? "plate.isInSlotWith" : "plate.isInSlotWithSaved", { title, slot: slotV(f), other: was.title }) : w(found ? "plate.isSlot" : "plate.isSlotSaved", { title, slot: slotV(f) }));
  };
  // Ate it on a plate you built: logged at once, no amount asked (the amounts are yours). Today: you land on Today, the
  // message says what was logged and where, and the meal's card has Undo. A day gone by: at that meal's time, and you land
  // on Plan on that day. replace: what was eaten in that meal leaves it first.
  const atePlate = (date: string, sl: Slot | null, how: "set" | "add" | "replace", started?: Date, beforeCook = false): boolean => {
    const title = plateTitle(), kcal = kcalNow(), today = date === todayKey;
    if (how === "replace" && sl) for (const f of state.feedback) if (f.status === "eaten" && f.slot?.date === date && f.slot.slotId === sl.id) p.deleteCard(f.id);
    const slot = sl ? { date, slotId: sl.id, name: sl.name, time: sl.time } : null;
    const ph = (state.photo && state.photo.who !== "idea" ? state.photo : null) ?? joinedPhoto;
    // DT314: a plate from earlier logged on the day it was started keeps the time it was started
    // B150: a photo you ate, logged to a meal, is logged at that meal's time in the calendar
    const at = started && ymd(started) === date ? started.toISOString() : ph?.who === "ate" && sl ? mealAt(date, sl.time) : today ? (ph?.who === "ate" && ymd(new Date(ph.at)) === date ? ph.at : undefined) : ph?.who === "ate" && ymd(new Date(ph.at)) === date ? ph.at : atMeal(date, sl?.time ?? "12:00");
    // DT317: before cooking the plate is logged where it was tapped and the app stays: the recipe opens to cook next
    if (beforeCook) return p.ateNow(plateMeal(), slot, { photo: ph?.image ?? null, at, stay: true }) !== false;
    const ok = p.ateNow(plateMeal(), slot, { photo: ph?.image ?? null, at, back: today, quiet: !today, line: sl ? w("app.loggedWhere", { title, slot: slotV(fillingOn(date, sl)), kcal: fmt(kcal, 0) }) : w("app.loggedSnack", { title, kcal: fmt(kcal, 0) }) });
    if (ok === false) return false;
    leavePlate();
    if (!today) { showPlanOn(date); setTab("plan"); notify(w("plate.isInEaten", { title, slot: slotV(fillingOn(date, sl ?? { id: "snack", name: "Snack", time: "12:00" })) })); }
    return true;
  };
  // the photo's own day and time, when you said you ate it then: the calendar opens there and marks the guess
  const photoOf = state.photo ?? joinedPhoto;
  const photoThen = photoOf && photoOf.who === "ate" && ymd(new Date(photoOf.at)) <= todayKey ? new Date(photoOf.at) : null;
  // DT314: when a plate from earlier was started (its photo's time, or the first food's)
  const plateStart = since ? new Date(state.photo?.at ?? since.toISOString()) : null;
  const endGuess = (() => {
    if (!endCal || endCal.kind !== "ate") return null;
    const at = (endCal.old ? plateStart : null) ?? photoThen ?? new Date(), date = ymd(at), info = calInfo(date), id = calGuess(info.slots, info.eaten, at);
    if (id === undefined) return null;
    return { date, id };
  })();
  // on the read, Ate it sets the meal and the read goes on with Did you eat it? (DT308.4, DT308.5); Plan it plans at once
  const onRead = () => step === "in" && !p.photoAsk && state.photo?.view === "read" && state.photo.who !== "idea" && p.pick !== "exploring" && items.length > 0;
  const endDo = (kind: "plan" | "ate", date: string, id: string | null, how: "set" | "add" | "replace") => {
    const sl = id ? calInfo(date).slots.find((x) => x.id === id) ?? null : null;
    if (kind === "plan") { if (sl) planPlate(fillingOn(date, sl), how); return; }
    // DT314: the plate from earlier is logged at once, with or without a photo
    // DT317: asked before cooking, the plate is logged to the meal tapped and the recipe then opens to cook
    if (endCal?.old && p.cookAsk) { setEndCal(null); if (atePlate(date, sl, how, plateStart ?? undefined, true)) p.answerCookAsk("ate"); return; }
    if (endCal?.old) { setEndCal(null); atePlate(date, sl, how, plateStart ?? undefined); return; }
    if (onRead() || (!!state.photo && state.photo.who !== "idea")) {
      // the read: the meal is set in the line; Did you eat it? follows. The same on the plate of a photo (after Change the
      // foods): the meal is set, and Chef Mealan's card asks how much of it you ate, as in 0.3.156
      if (date === todayKey) { p.setPick(sl ? `meal:${sl.id}` : "snack"); setState((s) => (s.photo?.meal ? { ...s, photo: { ...s.photo, meal: undefined } } : s)); }
      else setState((s) => (s.photo ? { ...s, photo: { ...s.photo, meal: { date, slotId: sl ? sl.id : null } } } : s));
      setEndCal(null); return;
    }
    atePlate(date, sl, how);
  };
  const endPick = (date: string, r: CalRow) => {
    if (!endCal) return;
    // a meal that already holds something asks first, right under its row (DT308.11 d to g); not on a read, whose
    // Did you eat it? comes next and adds a dish to the meal as before
    const holds = endCal.kind === "plan" ? r.state === "planned" : r.state === "eaten" && (endCal.old || (!onRead() && !state.photo));
    if (holds && r.id) { setEndCal({ ...endCal, ask: { date, id: r.id } }); return; }
    endDo(endCal.kind, date, r.id, "set");
  };
  const endOpen = (kind: "plan" | "ate") => {
    if (endCal?.kind === kind) { setEndCal(null); return; }
    // a meal already set: nothing is asked again (Coach Milan, 18 November). Ate it logs to it when it is today or
    // earlier; Plan it plans to it when it is still to come. A tap that does not fit the set meal opens the calendar.
    if (!onRead()) {
      if (kind === "ate" && p.filling && p.filling.date <= todayKey) { atePlate(p.filling.date, calInfo(p.filling.date).slots.find((x) => x.id === p.filling!.slotId) ?? null, "add"); return; }
      if (kind === "ate" && !p.filling && (pickSlot || p.pick === "snack")) { atePlate(todayKey, pickSlot, "add"); return; }
      if (kind === "plan" && p.filling && plateWhen !== "past") { const f = p.filling; const was = p.planned[f.date]?.[f.slotId]; if (!was || was.skipped) { planPlate(f, "set"); return; } setEndCal({ kind, day: f.date, more: false, ask: { date: f.date, id: f.slotId } }); return; }
      if (kind === "plan" && !p.filling && pickSlot && toMin(pickSlot.time) + 90 >= new Date().getHours() * 60 + new Date().getMinutes()) { const f = fillingOn(todayKey, pickSlot); const was = p.planned[todayKey]?.[pickSlot.id]; if (!was || was.skipped) { planPlate(f, "set"); return; } setEndCal({ kind, day: todayKey, more: false, ask: { date: todayKey, id: pickSlot.id } }); return; }
    }
    setEndCal({ kind, day: kind === "plan" ? dayAt(todayKey, 1) : photoThen ? ymd(photoThen) : todayKey, more: false });
  };
  const heldAsk = (date: string, id: string) => {
    const info = calInfo(date), sl = info.slots.find((x) => x.id === id); if (!sl || !endCal) return null;
    const holds = endCal.kind === "plan" ? info.planned?.[id]?.title ?? "" : (info.eaten[id] ?? []).join(", ");
    const txt = w("cal.heldPlan", { slot: slotTitleV(fillingOn(date, sl)), title: "\u0001" }).split("\u0001");
    return (
      <div className="pcal-held" role="group" aria-label={w("cal.addDish")}>
        <div className="pcal-held-q">{txt[0]}<b>{holds}</b>{txt[1] ?? ""}</div>
        <div className="pcal-held-btns">
          <button type="button" className="pill pill-small" onClick={() => setEndCal({ ...endCal, ask: null })}>{w("plate.cancel")}</button>
          <button type="button" className="pill pill-small" onClick={() => endDo(endCal.kind, date, id, "replace")}>{w("cal.replaceIt")}</button>
          <button type="button" className="pill pill-small pill-primary" onClick={() => endDo(endCal.kind, date, id, "add")}>{w("cal.addDish")}</button>
        </div>
      </div>);
  };
  // B148 (0.3.158, board Stories252): a tap on a day sets the day and closes More, two changes in one tap. Each change is made
  // on the calendar as it is at that moment, so the second no longer puts the old day back.
  const endCalendar = endCal ? plateCal({ mode: endCal.kind, day: endCal.day, setDay: (d) => setEndCal((c) => (c ? { ...c, day: d, ask: null } : c)), more: endCal.more, setMore: (b) => setEndCal((c) => (c ? { ...c, more: b } : c)), now: new Date(), today: todayKey, infoOf: calInfo,
    marked: endGuess, photoAt: photoThen, onPick: endPick,
    title: endCal.kind === "plan" ? w("cal.whichDayMeal") : endCal.old && plateStart && !state.photo ? w("cal.whichByPlate", { day: dateV(plateStart, { weekday: "long" }), time: hhmm(plateStart) }) : endCal.old && plateStart ? w("cal.whichByPhoto", { day: dateV(plateStart, { weekday: "long" }), time: hhmm(plateStart) }) : photoThen ? w("cal.whichByPhoto", { day: dateV(photoThen, { weekday: "long" }), time: hhmm(photoThen) }) : w("cal.whichByClock", { time: hhmm(new Date()) }),
    under: endCal.ask && endCal.ask.date === endCal.day && endCal.ask.id ? { id: endCal.ask.id, node: heldAsk(endCal.ask.date, endCal.ask.id) } : null }) : null;
  // Save it: the plate as a recipe in My recipes, with its foods and amounts (and its photo); the plate stays
  const sigNow = savedSig, savedId = savedNowId;
  const plateSaved = !!savedId && state.meals.some((m) => m.id === savedId);
  const saveIt = () => {
    if (state.photo && state.photo.who !== "idea") { p.saveRead(plateMeal(), state.photo.image); return; }
    const m: Meal = { ...plateMeal(), items: structuredClone(items).map((i) => ({ ...i, est: undefined })), steps: [] };
    setState((s) => ({ ...s, meals: [m, ...s.meals], savedPlate: { id: m.id, sig: sigNow } }));
  };
  const savedAsName = plateSaved && !(state.title && state.title !== "DaaM" && state.title.trim()) ? state.meals.find((m) => m.id === savedId)?.title ?? null : null;
  lateCal.el = endCalendar;
  const endEl = plateEnd({ calendar: endCal?.old ? null : endCalendar, open: endCal?.old ? null : endCal?.kind ?? null, saved: plateSaved, savedAs: savedAsName, onSave: saveIt, onPlan: () => endOpen("plan"), onAte: () => endOpen("ate") });
  // B151: the end of a plate you build yourself has no question: Prepare it (or Prepare it again), and Save it to My recipes
  const liveEndShown = liveOn && step === "in" && items.length > 0;
  const liveEndEl = plateEnd({ calendar: null, open: null, saved: plateSaved, savedAs: savedAsName, onSave: saveIt, onPlan: () => {}, onAte: () => {},
    live: { prepare: madeBy && items.length > 0 ? null : livePrepare } });
  // the photo's own card with Ate it and Ate half is for a plate whose meal is set, as in 0.3.156
  const mpSay = !!state.photo && state.photo.who !== "idea" && items.length > 0 && !p.filling && !p.recordNow && !unset;
  // with no meal set his card keeps his word, Add a food and Don't count it; Ate it is the end's, which asks for the meal first
  const mpSayLite = !!state.photo && state.photo.who !== "idea" && items.length > 0 && !p.filling && !p.recordNow && unset;
  // the end shows on a plate with foods that is yours to decide: no meal set, or set with the pencil. Not a recipe as
  // mapped, a plate kept as Just looking, a plate already recorded, or a meal opened from Plan (those keep their buttons)
  const endShown = !liveOn && step === "in" && items.length > 0 && !(imported && rec) && state.photo?.who !== "idea" && p.pick !== "exploring" && !p.recordNow && (!p.filling || p.filling.by === "line") && !mpSay;
  const canScale = pd !== null && pdRef !== null && !tooBig;
  const readoutEl = items.length > 0 ? (
    <section className={`readout readout-fit-${p.fitPd(pd)}`}>
      <div className="readout-top"><span>{imported && pmode === "whole" && !way && (rec?.makes?.n ?? 1) >= 2 ? w("make.theWholeRecipe") : mealSlot ? mealName(mealSlot.name) : madeBy || (imported && mealNeed) ? w("plate.thisMeal", { meal: mealW }) : unset ? w("plate.thisPlate") : w("plate.asItStands")}</span><span>{pdTag()}</span></div>
      <div className="readout-mid">
        {/* DT338 (0.3.179, Stories279): a tap on the PD number opens the scale with a mark where this plate sits; a second closes it */}
        {canScale ? <b className="pd-tap" role="button" tabIndex={0} aria-expanded={scaleOpen} aria-label={w("plate.pdScaleOpen")} onClick={() => setScaleOpen((x) => !x)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setScaleOpen((x) => !x); } }}>{pdVal(pd)}</b> : <b>{pdVal(pd)}</b>}
        {/* DT93, rule 3: a plate far over the meal says so, instead of going to the maths */}
        {/* DT338 AC4: above On plan the words say the band: High, above your plan; High+, far above your plan */}
        <div><span>{tooBig ? w("plate.notYet", { meal: mealW }) : pd !== null && pdRef !== null ? (pd >= pdRef - 0.05 ? (p.fitPd(pd) === "high" ? w("plate.highPlan") : p.fitPd(pd) === "top" ? w("plate.topPlan") : w("plate.fitsPlan")) : w("plate.underYour", { gap: fixed(pdRef - pd), target: fixed(pdRef) })) : w("plate.noTarget")}</span><small className="rd-rows"><span>{w("plate.energy")}</span><b>{fmt(t.calories, 0)}</b> <span>{w("plate.kcal")}</span><span>{w("plate.weight")}</span><b>{fmt(t.weight, 0)}</b> <span>g</span><span>{w("plate.protein")}</span><b>{fmt(t.protein, 0)}</b> <span>g</span></small></div>
      </div>
      {canScale && scaleOpen ? <div className="pd-scale-box"><PdScale target={pdRef} pd={pd} title={w("plate.pdScaleTitle", { t: pdVal(pdRef), pd: pdVal(pd) })} /></div> : null}
      {/* DT108 (0.2.92): four letters read the plate against your day, F C Fi P */}
      {/* DT116 (0.2.98) and 0.2.99: the letters with their grams, one block; sugars, saturates and salt in the tap */}
      {p.rates ? <Letters n={numbersOfTotals(t)} rates={p.rates} who={w("letters.thePlate")} extra={extrasText(items)} open={numbersOpen} setOpen={setNumbersOpen} /> : extras(items)}
    </section>
  ) : null;
  // DT305 (0.3.151, boards Stories230 and Stories231; Coach Milan 16 November, Go 11:35): the read alone. The photo and its
  // foods with Change the foods under them, always the result, what you said, Chef Mealan's word. One question in its own
  // block, with chips that are white until chosen: Did you eat it? All of it, Half, Part of it, and the weight below; for a
  // coming day, Is it for the plan? Under everything the two buttons of the read: Save in My recipes, Done. Done carries out
  // what is chosen; nothing chosen, nothing is kept.
  // the read of a meal photo (0.3.156: in PlateRead.tsx); its state stays here and is handed in
  // DT307.4: Cancel logs nothing and takes the meal off, as the row No meal selected does; the read ends with What do you do with it? again
  const cancelMeal = () => { clearMeal(); setRvEat(null); setRvGrams(""); setRvKeep(false); };
  // DT307.3: + Add more opens the Plate with + Add more to your plate already open
  const addMoreFromRead = () => { setState((s) => (s.photo ? { ...s, photo: { ...s.photo, view: undefined } } : s)); setQ(""); setMoreOpen(true); window.setTimeout(() => document.querySelector(".add-more-top")?.scrollIntoView({ block: "center" }), 60); };
  const readCard = readView ? plateRead({ rvKeep, setRvKeep, cancelMeal, addMore: addMoreFromRead, backEl: backToPhoto("rv-back-end"), checksEl: plateChecks({ items, memberFoods: p.memberFoods, region: p.region, setState, state, uid, updateItem }), endEl, unset, autoTitle, bigN, clearPlate, dayLine, dayNums, dishNow, dishOfMeal, extrasText, items, mealDate, mealSlot, mealWord, notify, numbersOpen, nutri, p, photoMeal, photoTime, pickSlot, planNow, plateMeal, plateWhen, putInSlot, readoutEl, rvEat, rvEdit, rvGrams, rvPlan, setRvEat, setRvEdit, setRvGrams, setRvPlan, setShotAt, setState, setStep, setTab, shotAt, sizeRef, slotV, state, t, updateItem }) : null;
  if (step === "in" && inQuestion) return (<>{ownHead ? null : inHead}{!p.cookOpenAsk && <CookStrip p={p} />}{inQuestion}</>);
  if (step === "in")
    return (
      <>
        {/* the name as the title: for a slot, or for a recipe opened from Recipes (0.2.3); an empty plate asks what you are craving */}
        {inHead}
        {!p.cookOpenAsk && <CookStrip p={p} />}
        {laterBlock}
        {/* the meal line with everything behind its pencil (0.3.156: in PlateMealLine.tsx); its state stays here and is handed in */}
        {plateMealLine({ calendar: lineOpen ? plateCal({ mode: "line", day: lineDayNow, setDay: setLineDay, more: lineMore, setMore: setLineMore, now: new Date(), today: todayKey, infoOf: calInfo, onPick: setMealFromLine,
            marked: lineMarked, refLine: photoRef, timeEdit: setMealTime, looking: { on: !mealSet, tap: clearMeal } }) : null,
          lineOpen, p, pdRef, pickTaste, set: p.pick === "exploring" && !p.filling ? null : mealSet, live: liveLine !== null ? { is: liveSet ? liveIs : null, line: liveLine, held: liveHeld } : undefined, setLineOpen: (v) => { setLineOpen(v); setLineMore(false); setLineDay(null); }, shownTaste, tasteHint })}
        {/* DT308.12n (0.3.157): the one line about the plate that was there, under the meal line */}
        {oldLine}
        {/* the photo screen (0.3.156: in PlatePhoto.tsx): the warning that your plate is not empty, then the card that asks about the photo */}
        {platePhotoWaits({ items, photoScreen, plateHas })}
        {photoScreen ? platePhotoCard({ p, photoTitle }) : readView ? readCard : (<>
        {/* DT308.3 (0.3.154, board Stories236): What are you craving? is gone from the page; Chef Mealan is asked through his round icon */}
        {/* On the plate (Y1 columns 2 and 2b, 10 October 2026): the plate is a card of its own, with Fit to my target as its action */}
        {/* DT246 (0.3.96, board Stories182): a plate already recorded says where it went; its changes go there too */}
        {p.recordNow && !liveRec && items.length > 0 && (() => { const r = p.recordNow!, d = new Date(r.at); return (
          <p className="small recorded-line"><b>{w("plate.recordedIn", { day: (l) => dayIn(l, d), meal: r.slot ? mealV(r.slot.name, true) : wordV("meal.snack"), time: d.toTimeString().slice(0, 5) })}</b> {w("plate.recordedFollows")}</p>); })()}
        {/* DT247 (0.3.96, board Stories183): one meal, more dishes; tap a dish to work on it; the meal adds them up */}
        {otherDishes.length > 0 && wholeMeal && mealSlot && (() => {
          const cur = { id: ownRecord ?? "plate", meal: { title: state.title && state.title !== "DaaM" ? state.title : autoTitle(items), items }, createdAt: hereDishes.find((f) => f.id === ownRecord)?.createdAt ?? new Date().toISOString(), course: state.course };
          const all = [...otherDishes.map((f) => ({ id: f.id, meal: f.meal, createdAt: f.createdAt, course: f.course })), cur].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
          const bar = mealBar(wholeMeal.kcal, [...otherNums, dishNums(items)]);
          const word = (k: number, f: { course?: import("../served").Dish }) => { const c = courseOf(k, f); return c === "main" ? w("dish.main") : c === "dessert" ? w("dish.dessert") : c === "dish" ? w("dish.dish") : dishWord(c); };
          return (
            <section className="card meal-dishes" aria-label={w("dish.barAria")}>
              <b>{wn("dish.mealDishes", all.length, { meal: mealV(mealSlot.name), kcal: fmt(bar.kcal, 0), pd: bar.pd === null ? "0" : dec(bar.pd, 1) })}</b>
              <small className="muted">{bar.over ? w("dish.over", { lo: fmt(bar.lo, 0), hi: fmt(bar.hi, 0), kcal: fmt(bar.over, 0) }) : bar.under ? w("dish.under", { lo: fmt(bar.lo, 0), hi: fmt(bar.hi, 0), kcal: fmt(bar.under, 0) }) : w("dish.inRange", { lo: fmt(bar.lo, 0), hi: fmt(bar.hi, 0) })}</small>
              <div className="chips-row meal-dishes-row">{all.map((f, k) => (
                <button key={f.id} type="button" className={`choice${f === cur ? " on" : ""}`} aria-pressed={f === cur} onClick={() => { if (f !== cur) p.openDish(f.id); }}>{word(k, f)} · {f.meal.title}</button>))}
                {p.recordNow && <button type="button" className="choice" onClick={() => p.mealCamera()}>{w("dish.addDish")}</button>}</div>
            </section>); })()}
        {inFlow ? <RecipeInFlow flow={recipeIn} put={(f) => void putRead(f)} photoWord={items.length === 0} /> : (
        <section className="card plate-card">
        {/* DT305 (0.3.151): the photo screen stands alone now, above */}
        {/* DT242 (0.3.96, board Stories182): the answer was lost twice (read again once by itself): the photo is kept, Try again */}
        {p.photoLost && (
          <section className="mp-none mp-lost" aria-label={say("photoLost")}>
            <ChefLine image={p.photoLost.image} text={say("photoLost")} />
            <small className="muted">{w("make.connectionLostHelp")}</small>
            <div className="mp-none-go">
              <button type="button" className="pill pill-primary" onClick={p.retryPhoto}>{w("make.tryAgain")}</button>
              <button type="button" className="pill pill-small pill-danger-line" onClick={p.dropPhotoLost}>{w("plate.dropPhoto")}</button>
            </div>
          </section>
        )}
        {/* DT219 (0.3.58, board Stories164): a read that found no foods; the Plate stays as it was */}
        {p.photoNoFoods && (
          <section className="mp-none" aria-label={w("make.noFoodsFoundOnThe")}>
            <ChefLine text={say("photoNoFoods")} />
            <div className="mp-none-go">
              <button type="button" className="pill pill-primary" onClick={() => { p.dropNoFoods(); p.mealCamera(); }}>{w("make.takeItAgain")}</button>
              <button type="button" className="pill" onClick={() => { p.dropNoFoods(); if (items.length > 0) setMoreOpen(true); /* 0.3.157: + Add more closes when the camera opens, so the search is opened again here */ window.setTimeout(() => { const box = document.querySelector<HTMLInputElement>('input.plate-search'); box?.scrollIntoView({ behavior: "smooth", block: "center" }); box?.focus({ preventScroll: true }); }, 0); }}>{w("make.addTheFoodsMyself")}</button>
            </div>
            <small className="muted">{w("make.yourPlateStaysAsIt")}</small>
          </section>
        )}
        {/* DT127 (0.2.108, board Stories75): the photo the plate was read from stays on it; a tap opens it large with the foods over it */}
        {state.photo && (photoBig ? (
          <div className="mp-big">
            {/* DT249: the photo as it is, nothing over it; every photo of the meal in a row under it (a tap swaps it with the big
                one); the foods under the photos, each with its amount */}
            {(() => { const shots = [state.photo.image, ...(state.photo.more ?? [])], at = Math.min(shotAt, shots.length - 1); return (<>
              <div className="mp-big-img"><img src={shots[at]} alt={w("make.photoOfTheMeal")} /></div>
              {shots.length > 1 && <div className="mp-shots" role="group" aria-label={w("make.photosOfTheMeal")}>{shots.map((src, k) => (
                <button key={k} type="button" className={`mp-shot${k === at ? " on" : ""}`} aria-pressed={k === at} aria-label={w("make.photoN", { n: k + 1 })} onClick={() => setShotAt(k)}><img src={src} alt="" /></button>))}</div>}
            </>); })()}
            <div className="mp-tags">{items.map((i) => <span key={i.id}>{foodName(i.food).split(",")[0]} {i.est ? "~" : ""}{Math.round(i.grams)} g</span>)}</div>
            <div className="mp-big-row"><small className="muted mp-big-say">{state.photo.who === "idea"
                ? wn("plate.photoLineIdea", items.length)
                : wn("plate.photoLine", items.length, { time: photoTime(state.photo.at) })}</small>
              <span className="mp-big-go">
                <button type="button" className="pill pill-small mp-retake" onClick={p.mealCamera}>{w("plate.retake")}</button>
                {p.ai.on && <button type="button" className="pill pill-small mp-add-photo" aria-expanded={plusAsk} onClick={() => setPlusAsk((x) => !x)}>{w("plate.addPhoto")}</button>}
              </span>
              {/* DT273 (0.3.123, board Stories202; Coach Milan 10 November 07:50 to 17:16, Go): + Photo asks first what the photo is.
                  A restaurant's pancake went in as one more photo of an old plate, because nothing said it would */}
              {plusAsk && p.ai.on && (
                <div className="mp-plus-ask" role="group" aria-label={w("plate.plusWhat")}>
                  <b>{w("plate.plusWhat")}</b>
                  <label className="mp-plus-opt mp-plus-same">{w("plate.plusSame")}<small>{w("plate.plusSameLine")}</small>
                    <input type="file" accept="image/*" capture="environment" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; setPlusAsk(false); if (f) setMorePhoto({ file: f, at: Date.now() }); }} /></label>
                  <button type="button" className="mp-plus-opt mp-plus-other" onClick={() => { setPlusAsk(false); p.savePlate(); p.mealCamera(); }}>{w("plate.plusOther")}<small>{w("plate.plusOtherLine")}</small></button>
                  <button type="button" className="link mp-plus-cancel" onClick={() => setPlusAsk(false)}>{w("photo.cancel")}</button>
                </div>
              )}</div>
          </div>
        ) : (
          <button type="button" className="mp-line" onClick={() => setPhotoBig(true)} aria-label={w("make.yourPhotoTapToSee")}>
            <img src={state.photo.image} alt="" />
            {state.photo.who === "idea"
              ? <span><b>{w("make.exploringAPhoto")}</b> {wn("plate.photoReadIdea", items.length)}</span>
              : <span><b>{w("plate.yourPhotoAt", { time: photoTime(state.photo.at) })}</b> {wn("plate.photoReadTap", items.length)}</span>}
          </button>
        ))}
        {/* DT212 v4 (0.3.53, gap 4): Read the photo again, after it asks: the new read replaces the foods and your corrections */}
        {/* DT212 v4 (0.3.53, gap 4): Read the photo again; DT228 v2 (0.3.63, board Stories168): more photos and your words go with it */}
        {/* 0.3.133: the plate's photo was not saved: say so, with Retake and Drop the photo */}
        {state.photo && isLooseRef(state.photo.image) && (
          <section className="mp-not-saved" role="status">
            <p>{w("plate.photoNotSaved")}</p>
            <div className="mp-none-go">
              <button type="button" className="pill pill-small" onClick={p.mealCamera}>{w("plate.retake")}</button>
              <button type="button" className="pill pill-small" onClick={() => setState((s) => ({ ...s, photo: undefined }))}>{w("plate.dropPhoto")}</button>
            </div>
          </section>
        )}
        {state.photo && p.ai.on && !state.photo.image.startsWith("pf:") && <PhotoSaid photo={state.photo} meal={state.photo.who !== "idea" && mealSlot ? mealSlot.name : null} />}
        {state.photo && p.ai.on && !state.photo.image.startsWith("pf:") && <HelpRead key={state.photo.at + state.photo.image.length} photo={state.photo} incoming={morePhoto} meal={state.photo.who !== "idea" && mealSlot ? mealSlot.name : null}
          read={(more, note, pot) => { const ph = state.photo!; void p.readMealPhoto(ph.image, { at: ph.at, who: ph.who ?? "now", replace: true, more, note, ...pot }); }} />}
        {/* DT318 (0.3.160): Chef Mealan's checks (how much, what it is, which one), shared with the read: PlateChecks.tsx */}
        {plateChecks({ items, memberFoods: p.memberFoods, region: p.region, setState, state, uid, updateItem })}
        {/* DT308 (0.3.154): the empty plate has no heading; the small plate with its line says what the page is */}
        {(items.length > 0 || !!state.photo) && <div className="card-top"><span>{w("plate.onThePlate")}</span>{/* DT219 (0.3.58): Empty plate whenever the Plate has foods or a photo. DT311 (0.3.157, board Stories246): with foods it stands in the row above them; the card's top says only On your plate */}{items.length === 0 && <ConfirmButton className="link plate-empty-link" label={<><Trash2 size={14} /> {w("plate.empty")}</>} confirmLabel={w("plate.emptyConfirm")} onConfirm={emptyPlate} />}</div>}
        {/* DT176 (0.3.19, board Stories124): Travel mode on: the Plate says where it serves you, and what the kitchen there allows */}
        {p.travel && <small className="travel-plate-note">{placeName(p.travel.place)}, {kitchenName(p.travel.kitchen).toLowerCase()}: {p.travel.kitchen === "hotel" ? w("make.chefMealanSuggestsWhatYou") : p.travel.kitchen === "flat" ? w("make.chefMealanCooksWithA") : w("make.chefMealanCooksAsAt")} {w("plate.searchFindsThere")}</small>}
        {imported && rec && !way && rec.makes && (
          <div className="in-portion">
            <div className="moments">
              {/* R15 (0.2.41, board RS12): the whole recipe first, as mapped; then what you eat */}
              {rec.makes.n >= 2 && <button className={`choice ${pmode === "whole" ? "on" : ""}`} onClick={() => setPortionMode("whole")}>{w("make.theWholeRecipe")}</button>}
              {mealNeed && <button className={`choice ${pmode === "sized" ? "on" : ""}`} onClick={() => setPortionMode("sized")}>{w("plate.sizedForYour", { meal: mealW })}</button>}
              <button className={`choice ${pmode === "recipe" ? "on" : ""}`} onClick={() => setPortionMode("recipe")}>{w("plate.oneAsMakesBtn", { one: oneOf(rec) })}</button>
            </div>
            {/* R12 (0.2.38): no recipe numbers here; the whole recipe is chosen on How to make it */}
            {rec.makes.n >= 2 && pmode !== "whole" && <small className="muted in-next">{w("make.nextOnHowToMake")}</small>}
            {(() => { const one = kcalOfItems(portionItems(rec, "recipe")), pct = Math.round((kcalOfItems(portionItems(rec, "sized")) / Math.max(1, one)) * 100);
              // R15: one portion's kcal is the plate's own, so the line and the card give one number
              return <small className="muted">{[pmode === "whole" ? w("plate.wholeAsMapped", { count: countUnit(rec.makes!.n, rec) }) : "", w("plate.oneIsKcal", { one: oneOf(rec), kcal: fmt(one, 0) }), mealNeed ? w(sizedFits(mealNeed, one) ? "plate.sizedForItFits" : "plate.sizedForItNot", { meal: mealW, need: fmt(mealNeed, 0), pct, one: oneOf(rec) }) : "", pmode === "whole" ? w("plate.pickWhatYouEat") : ""].filter(Boolean).join(" ")}</small>; })()}
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
            <small className="in-strong">{w("make.onTheSide")}</small>
            <div className="moments">{way.options.map((o, k) => <button key={o.name + k} className={`choice ${way.pick === k ? "on" : ""}`} onClick={() => pickSide(way, k)}>{o.name} {sideWord(o.kind)}{way.pick === k ? `, ${o.grams} g` : ""}{o.yours ? ` · ${w("plate.yourWay")}` : ""}</button>)}</div>
            <small className="muted">{way.options[way.pick].note}{way.options[way.pick].yours ? ` ${w("plate.yourWayNote")}` : ""}</small>
            <span className="in-cooked">{triedNote(way)}</span>
          </div>
        )}
        {readoutEl}
        {items.length > 0 && numbersOpen && p.rates && <NumbersTable n={numbersOfTotals(t)} rates={p.rates} extra={extrasText(items)} weight={t.weight ?? null} day={dayNums} plan={planNow} />}
        {/* DT308.7 and DT310.3 (0.3.155): Fit to my target directly under the result: solid blue with Chef Mealan's hat when the
            plate misses your target, white with a blue border when it fits */}
        {plainWays && items.length > 0 && <button className={`pill pill-wide fit-top${fitsTarget ? " pill-action" : " pill-primary"}`} onClick={makeAMeal}><ChefHat size={18} className="hat" /> {fit ? w("plate.fitAgain") : w("plate.fit")}</button>}
        {/* DT301 (0.3.149, board Stories223): an empty plate shows a plate with Nothing on the plate yet, and the four ways as
            tiles in two rows, icon above the word, under the heading Add a food. With foods on the plate the ways stay as they were. */}
        {/* DT308 (0.3.154, board Stories236, DT308.0c; Coach Milan 17 November 09:11 to 09:28): the empty plate is a small picture
            of the state, not a button. Under it one title, Add to your plate, and three tiles in one row, each an icon and a short
            name: Recipe photo, Recipe link, and Photo or scan on the right, where the thumb is. Then From the list. */}
        {items.length === 0 && (
          <div className="plate-empty-pic">
            <svg width="84" height="84" viewBox="0 0 132 132" aria-hidden="true"><circle cx="66" cy="66" r="62" fill="#fff" stroke="#c9d6ee" strokeWidth="4" /><circle cx="66" cy="66" r="44" fill="#f4f7fd" stroke="#dbe4f4" strokeWidth="3" /></svg>
            <span className="plate-empty">{w("plate.nothingYours")}</span>
          </div>
        )}
        {items.length === 0 && <b className="ways-head">{w("plate.addToYourPlate")}</b>}
        {items.length === 0 && addTiles}
        {/* DT308 Release 2 (0.3.155): with foods on the plate the old row of Manual, Scan, Photo of my meal and Say what you have
            is gone; the same three tiles and the list open under + Add more to your plate */}
        {chefOpen && <PlateChef p={p} need={mealNeed} target={pdRef} close={() => setChefOpen(false)} />}
        {/* Start from a recipe (0.2.16, board IM, IM1): only on an empty plate, because a recipe fills the plate */}
        {/* DT308: From the list, inside the card of an empty plate: the search of all foods, three of your foods for each
            macro, then See all foods and + Add manually */}
        {items.length === 0 && <div className="from-list">{listBlock(true)}</div>}
        {items.length + opts.length > 0 && (() => {
          // the plate's rows (0.2.19): in the dish's parts when it has them (IM15, IM18b), optional foods inside their part
          // DT82: the oil of a can sits with the can's row, set there; a can swapped for something else lets it stand alone
          const heldOil = (i: Ingredient) => Boolean(i.from && items.some((x) => x.id === i.from && canOil(x.food)));
          const oilRow = (i: Ingredient) => {
            const o = canOil(i.food), f = o ? oilFood(i.food, () => "oil") : null;
            if (!o || !f) return null;
            const g = items.find((x) => x.from === i.id)?.grams ?? 0;
            return (
              <div className="can-oil" role="group" aria-label={f.name}>
                <span className="can-oil-h"><b>{f.name}</b><small>{g > 0 ? w("plate.canOilIn", { grams: fmt(g, 0), kcal: fmt((f.calories! * g) / 100, 0) }) : w("plate.canOilUpTo", { grams: o.grams })}</small></span>
                <span className="pt-chips">{oilChoices(o.grams).map((c) => { const on = c.grams === g; return <button key={c.key} type="button" className={`pt-chip${on ? "" : " off"}`} aria-pressed={on} onClick={() => { log("can_oil", { how: c.key }); setCanOil(i, c.grams); }}>{c.key === "none" ? w("plate.none") : w("plate.oilChoice", { label: c.label, grams: c.grams })}</button>; })}</span>
              </div>
            );
          };
          // DT82 (Milan 20:51): the can on top, as the label names it, with what of it is in the numbers; its two foods under it
          const canHead = (i: Ingredient) => {
            if (!isDrained(i.food) || !i.food.pack?.can) return null;
            const oil = items.find((x) => x.from === i.id), k = aggregate([i, ...(oil ? [oil] : [])]).calories, n = Math.round((i.grams / (i.food.serving?.grams || i.grams)) * 10) / 10;
            return <div className="can-head" aria-label={w("plate.theCan", { can: i.food.pack.can })}><b>{i.food.pack.can}</b><small>{fmt(n, n % 1 ? 1 : 0)} {i.food.serving?.name ? (n === 1 ? i.food.serving.name : `${i.food.serving.name}s`) : w(n === 1 ? "plate.canWord" : "plate.cansWord")} · {w("plate.kcalInNumbers", { kcal: fmt(k, 0) })}</small></div>;
          };
          const itemRow = (i: Ingredient) => heldOil(i) ? null : (
              <Fragment key={i.id}>
              {canHead(i)}
              <SwipeRow onRemove={() => remove(i.id)} onSwap={() => setSwapId(i.id)}>
              <div className={`row${isDrained(i.food) ? " can-food" : ""}`}>
                <button className={`dot ${i.locked ? "dot-locked" : "dot-free"}`} aria-label={w(i.locked ? "plate.unlockFood" : "plate.lockFood", { food: i.food.name })}
                  onClick={() => { log("lock", { locked: !i.locked }); updateItem(i.id, { locked: !i.locked }); }} />
                <span className="thumb">{i.food.photo ? <img src={i.food.photo} alt="" /> : (i.food.icon || iconFor(i.food.name))}</span>
                <div className="row-text">
                  <button className="name-link" onClick={() => setCardId(i.id)}>{cookName(foodName(i.food)).short}</button>
                  {/* DT88, DT91: how to weigh it, on its own line under the name: weigh it cooked, about 200 g raw */}
                  {!partsMode && weighLine(i.food.name) && <small className="weigh">{weighLine(i.food.name)}{rawHint(i.food.name, i.grams) ? `, ${rawHint(i.food.name, i.grams)}` : ""}</small>}
                  {partsMode ? <small className="pt-chips"><PartChip value={i.part ?? ""} onPick={(v) => setPartOf(i.id, v)} /> <button type="button" className="pt-chip off" aria-pressed={false} onClick={() => setOptional(i.id, true)}>{w("plate.optional")}</button></small>
                    : i.optional ? <small className="pt-wrap">{w("plate.optionalAdded")} <button className="link pt-inline" onClick={() => leaveOpt(i.id)}>{w("make.leaveItOut")}</button></small>
                    : i.fry ? <small>{takenUpShort()}</small>
                    : <small>{p.rates && i.food.calories ? <><span className="letters">{lettersOf(i.food, p.rates).join(" ")}</span> · </> : null}{i.food.calories === 0 ? w("plate.noEnergy") : pdText(density(i.food.protein, i.food.calories))} · {imported ? w("plate.amountYours") : i.locked ? w("plate.amountStays") : w("plate.amountChef")}</small>}
                </div>
                {/* CT (0.2.24): eggs, bananas and a pack's pieces are counted; the size and the grams small */}
                {isCounted(i) ? <CountAmount item={i} editable={!i.locked && !imported} open={sizeOpen === i.id} onToggle={countedOf(i) && !i.locked && !imported ? () => setSizeOpen(sizeOpen === i.id ? null : i.id) : undefined}
                    onGrams={(g, c) => { setTouched((t) => new Set(t).add(i.id)); updateItem(i.id, { grams: g, ...(c ? { count: c } : {}), ...(i.fromPhoto ? { amountSet: true } : {}) }); }} />
                : i.locked ? <b className="row-num">{fmt(i.grams, 0)} g{servingLabel(i.food, i.grams) ? <small> = {servingLabel(i.food, i.grams)}</small> : null}</b> : (
                  <label className="grams">
                    {i.est && <span className="mp-est" aria-label={w("plate.estimated")}>~</span>}
                    <input aria-label={w("meal.gramsOf", { food: foodV(i.food) })} type="number" min="0" inputMode="decimal" value={i.grams === 0 ? "" : Math.round(i.grams * 10) / 10}
                      onChange={(e) => { setTouched((t) => new Set(t).add(i.id)); updateItem(i.id, { grams: Math.max(0, Number(e.target.value) || 0), ...(i.fromPhoto ? { amountSet: true } : {}) }); }}
                      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} enterKeyHint="done"
                      onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ block: "center", behavior: "smooth" }), 250)} />
                    <span>g{servingLabel(i.food, i.grams) ? ` = ${servingLabel(i.food, i.grams)}` : ""}</span>
                  </label>
                )}
              </div>
              </SwipeRow>
              {/* DT93 (0.2.88): the portion gate: a food outside its normal portion says so; what Fit did, with Undo */}
              {/* DT204: the parts of a dish read from a photo get no portion line; the photo's check of the whole plate stays */}
              {!imported && !i.optional && !i.fry && !i.fromPhoto && portionLine(i.food, i.grams, mealX) && <small className="gate-line">{portionLine(i.food, i.grams, mealX)}</small>}
              {sizeOpen === i.id && countedOf(i) && <SizePicker item={i} onGrams={(g, c) => { setTouched((t) => new Set(t).add(i.id)); updateItem(i.id, { grams: g, count: c }); }} />}
              {oilRow(i)}
              </Fragment>
          );
          const optRow = (o: PlateOpt) => partsMode
            ? <div className="pt-opt" key={o.id}><span className="thumb thumb-sm">{o.food.icon || iconFor(o.name)}</span><span className="pt-opt-text"><b>{o.name}</b><small className="pt-chips"><PartChip value={o.part ?? ""} onPick={(v) => setPartOf(o.id, v)} /> <button type="button" className="pt-chip" aria-pressed={true} onClick={() => setOptional(o.id, false)}>{w("plate.optionalOn")}</button></small></span><b className="pt-opt-g">{fmt(o.grams, 0)} g</b></div>
            : <div className="pt-opt" key={o.id}><span className="thumb thumb-sm">{o.food.icon || iconFor(o.name)}</span><span className="pt-opt-text"><b>{o.name}</b><small>{o.note || (o.written ? w("plate.writtenOnRecipe", { written: o.written }) : w("plate.optionalLow"))}</small></span><b className="pt-opt-g">{fmt(o.grams, 0)} g</b><button className="pill pill-small" aria-label={w("plate.addName", { name: o.name })} onClick={() => addOpt(o)}>{w("plate.plusAdd")}</button></div>;
          const PartHead = ({ part }: { part: string }) => {
            const left = leftOut.find((l) => l.part === part);
            if (left) return <div className="pt-h"><span><b>{w("plate.partLeftOut", { part })}</b><small>{wn("plate.foodsKcalLess", left.items.length, { kcal: fmt(kcalOfItems(left.items), 0) })}</small></span><span className="pt-acts"><button className="pill pill-small pill-action" onClick={() => putBack(part)}>{w("make.putItBack")}</button></span></div>;
            if (isEmptyPart(part)) return <div className="pt-h" aria-label={w("plate.partAria", { part })}><span><b>{part}</b><small>{w("make.noFoodsLeftInThis")}</small></span></div>;
            const its = items.filter((i) => i.part === part), k = kcalOfItems(its), pdp = pdOf(its), nOpt = opts.filter((o) => o.part === part).length;
            const changed = way?.kind === "change" && way.part === part;
            return (
              <div className="pt-h" aria-label={w("plate.partAria", { part })}>
                <span><b>{changed ? w("plate.partChanged", { part }) : part}</b><small>{nOpt ? wn("plate.foodsOptional", its.length, { opt: nOpt }) : wn("plate.foodsN", its.length)} · {w("plate.kcalN", { kcal: fmt(k, 0) })}{pdp !== null && k > 0 ? ` · ${pdText(pdp)}` : ""}{changed ? ` · ${triedNote(way)}` : ""}</small></span>
                <span className="pt-acts">{changed ? <button className="link" onClick={backToOriginal}>{w("make.backToTheOriginal")}</button> : <>
                  {p.ai.on && pdRef !== null && its.length > 0 && <button className="pill pill-small pill-action" disabled={!!wayBusy || !!way} onClick={() => void changePart(part)}>{wayBusy === part ? w("make.changingIt") : w("plate.change")}</button>}
                  {canLeaveOut(items, part) && <button className="link" onClick={() => leavePart(part)}>{w("make.leaveItOut")}</button>}
                </>}</span>
              </div>
            );
          };
          const dishes = items.some((i) => i.dish);
          const grouped = !dishes && !partsMode && plateParts.length > 0;
          const noPart = items.filter((i) => !i.part), noPartOpts = opts.filter((o) => !o.part);
          // C52 (DT150, 0.2.131, board Stories102): a cooked plate of your own with no parts asks once whether it is one dish, with the
          // parts suggested; grouped, Fit keeps each part's proportions and the steps go part by part
          const sugg = !dishes && !partsMode && !imported && !rec && plateParts.length === 0 && items.length >= 3 && plateWhen !== "past" && dishNo !== foodsSig(items) && items.some((i) => needsCooking(i.food.name) || bindsADish(i.food)) ? suggestParts(items.map((i) => i.food)) : [];
          const nameOf = (id: string) => cookName(items.find((i) => i.food.id === id)?.food.name ?? "").short.split(/[,(]/)[0].trim().toLowerCase();
          const groupIt = () => setState((st) => ({ ...st, items: st.items.map((i) => { const g = sugg.find((x) => x.ids.includes(i.food.id)); return g ? { ...i, part: g.part } : i; }) }));
          return (<>
            {sugg.length > 0 && (
              <div className="one-dish" role="group" aria-label={w("make.isThisOneDish")}>
                {/* DT213 (0.3.74): his question, his reason inside it */}
                <ChefLine text={say("oneDish")} />
                <small className="one-dish-parts">{sugg.map((g, k) => <span key={g.part}>{k ? " · " : ""}<b>{g.part}:</b> {g.ids.map(nameOf).join(", ")}</span>)}</small>
                <div className="button-row">
                  <button type="button" className="pill pill-small pill-primary" onClick={() => { groupIt(); log("parts", { how: "suggested" }); }}>{w("plate.groupLikeThis")}</button>
                  <button type="button" className="pill pill-small" onClick={() => { groupIt(); setPartsMode(true); }}>{w("plate.changeParts")}</button>
                  <button type="button" className="pill pill-small" onClick={() => setDishNo(foodsSig(items))}>{w("plate.separateFoods")}</button>
                </div>
              </div>
            )}
            {!dishes && (partsMode
              ? <div className="pt-h pt-mode"><span><b>{w("make.parts")}</b><small>{w("make.tapAFoodSPart")}</small></span><span className="pt-acts">
                  {naming === null ? <button className="pill pill-small pill-action" onClick={() => setNaming("")}>{w("make.newPart")}</button> : <input className="pt-new" autoFocus aria-label={w("make.nameOfTheNewPart")} placeholder={w("plate.partPlaceholder")} value={naming} onChange={(e) => setNaming(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { const v = naming.trim().slice(0, 30); if (v) setNewParts((l) => [...l, v.charAt(0).toUpperCase() + v.slice(1)]); setNaming(null); } }} onBlur={() => setNaming(null)} />}
                  <button className="link" onClick={() => { if (plateParts.length) log("parts", { how: "set" }); setPartsMode(false); setNaming(null); setNewParts([]); }}>{w("make.done")}</button></span></div>
              : null)}
            {/* DT311 (0.3.157, board Stories246; Go 18 November 11:14): one row above the foods. Empty plate on the left, always in
                the same place; Group into parts on the right when the plate shows it, on one line with room around its words */}
            {items.length > 0 && <div className="plate-acts">
              <ConfirmButton className="link plate-empty-link" label={<><Trash2 size={14} /> {w("plate.empty")}</>} confirmLabel={w("plate.emptyConfirm")} onConfirm={emptyPlate} />
              {!dishes && !partsMode && items.length + opts.length >= 2 && <button className="pill pill-small pill-action pt-open" onClick={() => setPartsMode(true)}>{plateParts.length ? w("plate.parts") : w("plate.groupIntoParts")}</button>}
            </div>}
            {/* DT308 Release 2 (0.3.155, board Stories236, DT308.3): a dish is one row with its name and weight; its foods stand under it */}
            {dishTitle && !dishes && !grouped && !partsMode && <div className="dish-one"><b>{dishTitle}</b><small>{fmt(items.reduce((n, i) => n + i.grams, 0), 0)} g</small></div>}
            <div className={`rows${dishTitle && !dishes && !grouped && !partsMode ? " dish-foods" : ""}`}>
              {dishes ? groupsOf(items).map((g) => g.kind === "dish" ? <DishRow key={g.id} g={g} /> : itemRow(g.item))
                : !grouped ? <>{items.map(itemRow)}{partsMode && opts.map(optRow)}</>
                : <>
                  {plateParts.map((part) => <div key={part} className="pt-group"><PartHead part={part} />
                    {way?.kind === "change" && way.part === part && way.notes.map((nt, k) => <small key={k} className="pt-note">{nt}</small>)}
                    {!leftOut.some((l) => l.part === part) && <>{items.filter((i) => i.part === part).map(itemRow)}{opts.filter((o) => o.part === part).map(optRow)}</>}
                    {isEmptyPart(part) && <div className="pt-add"><button className="pill pill-small pill-action" onClick={() => addToPart(part)}>{w("plate.addFoodTo", { part })}</button></div>}
                  </div>)}
                  {(noPart.length > 0 || noPartOpts.length > 0) && <div className="pt-group"><div className="pt-h"><span><b>{w("plate.other")}</b></span></div>{noPart.map(itemRow)}{noPartOpts.map(optRow)}</div>}
                </>}
            </div>
            {items.length > 0 && !partsMode && <small className="muted swipe-line">{w("plate.swipe")}</small>}
            {items.length > 0 && !partsMode && (moreOpen ? (
              <div className="add-more" role="group" aria-label={w("plate.addMore")}>
                <div className="add-more-top"><b>{w("plate.addMore")}</b><button type="button" className="icon" aria-label={w("plate.close")} onClick={() => { setMoreOpen(false); setQ(""); }}><X size={22} /></button></div>
                {addTiles}
                <div className="from-list">{listBlock(false)}</div>
              </div>
            ) : <button type="button" className="pill pill-wide pill-action add-more-open" onClick={() => { setQ(""); setMoreOpen(true); }}>+ {w("plate.addMore")}</button>)}
            {/* DT308.7: Prepare it stands right under + Add more to your plate */}
            {!liveOn && plainWays && items.length > 0 && !partsMode && !(finishedDish && (!p.filling || p.filling.mode === "eat")) && <button className="pill pill-wide prepare-it" onClick={keepAsIs}>{p.filling && p.filling.mode !== "eat" ? (fit ? w("plate.putItIn", { slot: slotV(p.filling) }) : w("plate.keepAsIs")) : w("plate.prepare")}</button>}
            {/* DT308.11 (0.3.157, board Stories242): the plate ends with What do you do with it? */}
            {endShown && !partsMode && endEl}
            {liveEndShown && !partsMode && liveEndEl}
            {/* IM12: a dish without parts: its optional foods in one list under the foods */}
            {!grouped && !partsMode && opts.length > 0 && (
              <div className="pt-optlist" aria-label={w("make.optionalNotOnThePlate")}>
                <small className="pt-optlist-h">{w("make.optionalNotOnThePlate")}</small>
                {opts.map(optRow)}
                <small className="muted">{rec ? w("make.leftOutOfTheNumbers") : w("make.leftOutOfTheNumbers2")} {w("plate.addPutsOne")}</small>
              </div>
            )}
          </>);
        })()}
        {/* DT91 (0.2.88): the herbs and spices of Chef Mealan's dinner, under the foods, not counted */}
        {/* DT98 (0.2.90): Chef Mealan suggests, you decide: x takes a cooking food out before you lock; the steps go without it */}
        {/* DT102 (0.2.91): the chips belong to the dish: they go with it (Take it off, Other ideas, Undo, Start again, an emptied plate) */}
        {cookingOn ? <small className="pt-cook"><b>{w("plate.forCooking")}</b> <span className="pt-chips">{state.cooking.map((c) => <button key={c} type="button" className="pt-chip on" aria-label={w("plate.takeOut", { food: c })} onClick={() => { setState((s) => ({ ...s, cooking: (s.cooking ?? []).filter((x) => x !== c) })); setPlateSteps(null); }}>{c} ✕</button>)}</span></small> : null}
        {/* two ways out (canvas S, A new meal for a slot and Off the plan, short, 11 October 2026): Fit moves one food; Make it as it is takes the plate as it stands */}
        {/* DT94: the steps on the Plate for a plate you cook: the first three, Show all opens them; the whole of Craft is one screen */}
        {!imported && !p.filling && cooksPlate(items) && (
          <section className="card mk-card plate-steps" aria-label={w("make.steps")}>
            <b>{w("make.steps")}</b>
            {/* DT150 (0.2.131, board Stories102): the foods changed after the steps were written: the steps say so and step back */}
            {plateSteps && !stepsHold(items) && plateSteps.its ? (<>
              <small className="steps-stale">{w("plate.stepsStale", { diff: recipeDiffLine(plateSteps.its, items) || wordV("plate.theFoodsChanged") })}</small>
              <ol className="rp-steps steps-old">{plateSteps.steps.slice(0, 3).map((x, k) => <li key={k}><span>{k + 1}</span><div className="rp-step-text">{stepParts(tempsIn(x), plateSteps.its!).map((pt, j) => ("text" in pt ? pt.text : <b key={j} className="st-amt">{pt.label}</b>))}</div></li>)}</ol>
              <div className="button-row">{p.ai.on && <button className="pill pill-small pill-primary" onClick={() => startPlateSteps(true)}>{w("make.redraftForTheseFoods")}</button>}<button className="link" onClick={() => setPlateSteps({ ...plateSteps, sig: plateSig(items), foods: foodsSig(items), its: structuredClone(items) })}>{w("make.keepThem")}</button></div>
            </>) : stepsHold(items) && plateSteps ? (<>
              <ol className="rp-steps">{plateSteps.steps.slice(0, 3).map((x, k) => <li key={k}><span>{k + 1}</span><div className="rp-step-text">{stepParts(tempsIn(x), items).map((pt, j) => ("text" in pt ? pt.text : <b key={j} className="st-amt">{pt.label}</b>))}</div></li>)}</ol>
              <div className="button-row">{plateSteps.steps.length > 3 && <button className="link" onClick={() => setStep("make")}>{w("plate.showAllN", { n: plateSteps.steps.length })}</button>}<button className="pill pill-small pill-action" onClick={() => setStep("make")}>{w("make.changeTheSteps")}</button></div>
            </>) : (<>
              {plateDraft === "working" ? <ThinkingCard className="rq-drafting" title={w("make.writingSteps")} /> : plateDraft ? <small className="rq-drafting">{plateDraft}</small> : <small className="muted">{p.ai.on ? w("make.writesAtAmounts") : w("make.writeThemBeforeYouLock")}</small>}
              <div className="button-row">{p.ai.on && plateDraft !== "working" && <button className="pill pill-small pill-primary" onClick={() => startPlateSteps(true)}>{plateDraft ? w("make.tryAgain") : w("make.draftWithChef")}</button>}<button className="pill pill-small pill-action" onClick={() => { setStep("make"); }}>{w("make.writeMyOwn")}</button></div>
            </>)}
          </section>
        )}
        {/* DT97 (0.2.90, board Stories62): one place for Chef Mealan above the buttons, there from the second food on, so nothing
            below it moves when his answer comes. His verdict (DT93, rule 2), then Fit's line under it, then the three ways. */}
        {(dishWanted || (fit && !imported) || (ingredientsOn.length > 0 && !imported) || bigPlate || (gateOn && (!nutri.ok || !dayLine.ok)) || anyEdge) && (
          <section className="card gate-card" aria-label={w("plate.chefOnPlate")}>
            <b><ChefHat size={16} /> {CHEF_NAME}</b>
            {bigPlate && (<div className="gate-big">
              <small>{w("plate.alreadyAbout", { n: bigN, meal: mealW, kcal: fmt(t.calories, 0), lo: fmt(mealRange(share!.kcal)[0], 0), hi: fmt(mealRange(share!.kcal)[1], 0) })}</small>
              <div className="button-row">
                <button className="pill pill-small pill-primary" onClick={makeItN}>{wn("plate.makeItN", bigN)}</button>
                <button className="pill pill-small" onClick={shrinkToOne}>{w("make.shrinkItToOnePortion")}</button>
                <button className="pill pill-small" onClick={() => setBigKept(dishSig)}>{w("make.keepItAsItIs")}</button>
              </div>
            </div>)}
            {ingredientsOn.map((i) => (
              <div key={i.id} className="gate-ingredient">
                <small>{w("plate.ingredientNotFood", { food: cookName(i.food.name).short, meal: mealW })}</small>
                <div className="button-row">
                  <button className="pill pill-small pill-primary" onClick={() => remove(i.id)}>{w("plate.takeTheOut", { food: cookName(i.food.name).short.toLowerCase() })}</button>
                  {p.ai.on && <button className="pill pill-small" onClick={() => p.openOut("around")}>{w("plate.askDishAround")}</button>}
                </div>
              </div>
            ))}
            {dishWanted && (!dishNow || dishNow.status === "working") && <small className="gate-wait">{w("make.readingYourPlate")}</small>}
            {/* DT104 (0.2.92): a failed read says so, with Try again; before, it showed nothing and the plate looked checked */}
            {dishNow && dishNow.status === "off" && (<>
              <small>{w("plate.couldNotRead")}</small>
              <div className="button-row"><button className="pill pill-small" onClick={() => setDishTry((n) => n + 1)}>{w("make.tryAgain")}</button></div>
            </>)}
            {dishNow && dishNow.status === "done" && dishNow.makesIt && dishNow.why && !bigPlate && <div className="gate-line-row gate-yes"><b>{w("plate.culinaryYes")}</b><small>{dishNow.why}</small></div>}
            {/* DT150 (rule C52): the proportions of a dish cooked together: what fails and how to fix it */}
            {dishNow && dishNow.status === "done" && dishNow.holds && <div className="gate-line-row gate-holds"><b>{w("make.theDishWonTHold")}</b><small>{dishNow.holds}</small></div>}
            {dishNow && dishNow.status === "done" && !dishNow.makesIt && dishKept !== dishSig && !bigPlate && (<>
              <div className="gate-line-row gate-no"><b>{w("plate.culinaryNo")}</b><small>{dishNow.why}</small></div>
              <div className="button-row">
                {chefable && <button className="pill pill-small pill-primary" onClick={() => void askChef(items, [])}>{dishNow.around ? w("plate.makeItAAround", { meal: mealW, food: cookName(dishNow.around).short.toLowerCase() }) : w("plate.makeItA", { meal: mealW })}</button>}
                {dishNow.betterAs === "snack" && <button className="pill pill-small" onClick={() => p.setPick("snack")}>{w("make.makeItASnack")}</button>}
                <button className="pill pill-small" onClick={() => setDishKept(dishSig)}>{w("make.keepItAsItIs")}</button>
              </div>
            </>)}
            {dishNow && dishNow.status === "done" && !dishNow.makesIt && dishKept === dishSig && <div className="gate-line-row gate-yes"><b>{w("plate.culinaryYes")}</b><small>{w("make.keptAsItIs")}</small></div>}
            {/* DT116: nutrition and your day, each its own line; the sweet spot when all three hold */}
            {gateOn && !bigPlate && (dishNow?.status === "done" || !nutri.ok || !dayLine.ok || anyEdge) && gateLine(w("plate.gateNutrition"), nutri)}
            {gateOn && !bigPlate && !exploringNow && (dishNow?.status === "done" || !nutri.ok || !dayLine.ok || anyEdge) && gateLine(w("plate.gateDay"), dayLine)}
            {/* DT132: the plate's size on the edge, 1.3 to 1.5 portions of its meal */}
            {gateOn && sizeEdge && !bigPlate && share && <div className="gate-line-row gate-edge"><b>{w("plate.onEdge", { name: w("plate.gateSize") })}</b><small>{w("plate.sizeEdge", { n: fixed(sizeNow.portions), meal: mealV(mealSlot?.name ?? "meal", true), kcal: fmt(t.calories, 0), share: fmt(share.kcal, 0) })}</small><small className="gate-hint">{w("make.toBeClearOfIt")}</small></div>}
            {sweetSpotOf(ingredientsOn.length === 0) && <small className="gate-sweet">{w("make.daamGoodSpotADish")}</small>}
            {/* DT308.10 (0.3.157, board Stories241): with no meal set Chef Mealan says first what Fit aimed at */}
            {fit && !imported && unset && pdRef !== null && <small className="fit-note fit-aim">{w("fit.noMealAim", { pd: pdVal(pdRef) })}</small>}
            {fit && !imported && <small className="fit-note">{/^Fit /.test(fit.note) ? <><b>{w("make.fit")}</b> {fit.note.slice(4)}</> : fit.note}{fit.group && Object.entries(fit.group).some(([id, g]) => Math.round(items.find((i) => i.id === id)?.grams ?? -1) !== Math.round(g)) ? <> <button className="pill pill-small pill-action pt-inline" onClick={() => { const g = fit.group!; setState((s) => ({ ...s, items: s.items.map((i) => (g[i.id] !== undefined ? { ...i, grams: g[i.id] } : i)), portion: null })); setFit(null); }}>{w("make.undo")}</button></> : null}{fit.id && fit.before !== undefined && fit.before !== Math.round(items.find((i) => i.id === fit.id)?.grams ?? -1) ? <> <button className="pill pill-small pill-action pt-inline" onClick={() => { updateItem(fit.id!, { grams: fit.before! }); setFit(null); }}>{w("make.undo")}</button></> : null}</small>}
            {fitShort && !madeBy && (<>
              <small>{share && (t.calories ?? 0) < share.kcal * 0.6 ? w("plate.topOutHalf", { pd: pdText(pd), kcal: fmt(t.calories, 0), meal: mealW }) : w("plate.topOut", { pd: pdText(pd) })}</small>
              <div className="button-row">
                {chefable && <button className="pill pill-small pill-primary" onClick={() => void askChef(items, [])}>{w("plate.addFoodsFor", { meal: mealW })}</button>}
                {fit?.id && <button className="pill pill-small" onClick={() => setSwapId(fit.id)}>{w("make.swapAFood")}</button>}
                <button className="pill pill-small" onClick={() => p.openOut("plate")}>{w("plate.askChef")}</button>
              </div>
            </>)}
          </section>
        )}
        {/* DT127: under the gates, one line what to do with the plate in front of you, by code, and the buttons, the advice first */}
        {/* DT268 (0.3.118, board Stories201): an Exploring plate is kept as Served; its name, its dish, the next plate */}
        {state.photo && state.photo.who === "idea" && state.photo.served && items.length > 0 && <ServedOnPlate p={p} items={items} title={state.title && state.title !== "DaaM" ? state.title : autoTitle(items)} done={clearPlate} />}
        {state.photo && state.photo.who === "idea" && items.length > 0 && (() => {
          // DT130 (0.2.110, board Stories78, DT130d): an idea: the same read and gates; the buttons are for cooking it, not logging it
          const line = ideaAdvice({ items, protein: t.protein ?? 0, mealWord, big: bigN, nutrition: nutri });
          const mealOf = (): Meal => ({ id: uid(), title: state.title && state.title !== "DaaM" ? state.title : autoTitle(items), items: structuredClone(items), portion: items.reduce((n, i) => n + i.grams, 0), savedAt: new Date().toISOString() });
          const days = Array.from({ length: 7 }, (_, k) => { const d = new Date(); d.setDate(d.getDate() + k); return { key: ymd(d), name: k === 0 ? w("plate.today") : k === 1 ? w("plate.tomorrow") : dateText(d, { weekday: "short", day: "numeric" }), long: (k === 0 ? wordV("plate.todayLow") : k === 1 ? wordV("plate.tomorrowLow") : dateV(d, { weekday: "long" })) as Val }; });
          const day = days.find((d) => d.key === ideaPlan?.date) ?? days[1];
          const slots = slotsOn(lifestyleOf(p.personal), p.personal.timesOn, day.key);
          const sl = slots.find((s) => s.id === ideaPlan?.slotId) ?? slots.find((s) => s.id === mealSlot?.id) ?? slots[0];
          return (
            <section className="card mp-say" aria-label={w("plate.chefOnIdea")}>
              <small><b>{CHEF_NAME}:</b> {line}{p.exploreLeft ? ` ${w("plate.exploringSo", { slot: p.exploreLeft })}` : ""}</small>
              <div className="mp-idea-row">
                <button className="pill pill-small pill-primary" onClick={makeAMeal}><ChefHat size={16} className="hat" /> {fit ? w("make.fitAgain") : w("plate.fitItToMy", { meal: mealW })}</button>
                <button className="pill pill-small" onClick={() => p.saveIdea(mealOf(), state.photo!.image)}>{w("make.saveAsAnIdea")}</button>
                <button className="pill pill-small" aria-expanded={!!ideaPlan} onClick={() => setIdeaPlan(ideaPlan ? null : { date: days[1].key, slotId: "" })}>{w("make.putItInMyPlan")}</button>
              </div>
              {ideaPlan && sl && (
                <div className="mp-plan" role="group" aria-label={w("make.whichDayAndMeal")}>
                  <div className="chips-row">{days.map((d) => <button key={d.key} type="button" className={`pa-chip${d.key === day.key ? " on" : ""}`} aria-pressed={d.key === day.key} onClick={() => setIdeaPlan({ date: d.key, slotId: ideaPlan.slotId })}>{d.name}</button>)}</div>
                  <div className="chips-row">{slots.map((s) => <button key={s.id} type="button" className={`pa-chip${s.id === sl.id ? " on" : ""}`} aria-pressed={s.id === sl.id} onClick={() => setIdeaPlan({ date: day.key, slotId: s.id })}>{mealName(s.name)}</button>)}</div>
                  <button className="pill pill-small pill-primary" onClick={() => p.saveIdea(mealOf(), state.photo!.image, { date: day.key, slotId: sl.id })}>{w("plate.putInDays", { day: day.long, meal: mealV(sl.name, true) })}</button>
                </div>
              )}
            </section>
          );
        })()}
        {(mpSay || mpSayLite) && (() => {
          const adv = photoAdvice({ items, protein: t.protein ?? 0, mealWord, mealKcal: sizeRef ?? null, big: bigN, nutrition: nutri, day: dayLine, culinaryOk: dishNow?.status === "done" ? Boolean(dishNow.makesIt) : null, dish: dishOfMeal ? state.course : undefined });
          const mealOf = (): Meal => ({ id: uid(), title: state.title && state.title !== "DaaM" ? state.title : autoTitle(items), items: structuredClone(items), portion: items.reduce((n, i) => n + i.grams, 0), savedAt: new Date().toISOString() });
          // DT130: a photo you ate earlier logs at its time, in the meal that time belongs to
          const slot = p.pick === "snack" ? null : pickSlot && mealSlot ? { date: mealDate, slotId: mealSlot.id, name: mealSlot.name, time: mealSlot.time } : photoMeal ? { date: photoMeal.date, slotId: photoMeal.slot.id, name: photoMeal.slot.name, time: photoMeal.slot.time } : mealSlot ? { date: mealDate, slotId: mealSlot.id, name: mealSlot.name, time: mealSlot.time } : null;
          const at = state.photo!.who === "ate" ? (slot ? mealAt(slot.date, slot.time) : state.photo!.at) : undefined;
          const b = {
            add: <button key="add" className={`pill pill-small ${adv.first === "add" ? "pill-primary" : ""}`} onClick={() => { document.querySelector<HTMLInputElement>("input.search")?.focus(); }}>{w("make.addAFood")}</button>,
            // DT133: a plate of several portions: Ate one portion, Ate it all
            portion: <button key="portion" className="pill pill-small pill-primary" onClick={() => p.ateNow(mealOf(), slot, { photo: state.photo!.image, portions: bigN, at })}>{w("make.ateOnePortion")}</button>,
            allOf: <button key="allOf" className="pill pill-small" onClick={() => p.ateNow(mealOf(), slot, { photo: state.photo!.image, at })}>{w("make.ateItAll")}</button>,
          };
          // DT306 (0.3.163, board DT306; Coach Milan, Go 18 November 19:13 and 19 November 11:36): the card in the read's shape.
          // With a meal set: Did you eat it? with four answers, Don't count it among them, and Done as the one button. Add a food
          // left the card (+ Add more to your plate is right above it). With no meal selected: his word alone, and the page ends
          // with What do you do with it?. A plate of several portions keeps its own two buttons (DT133).
          if (mpSayLite) return (<section className="card mp-say" aria-label={w("plate.chefOnMeal")}><small><b>{CHEF_NAME}:</b> {adv.line}</small></section>);
          if (adv.first === "portion") return (
            <section className="card mp-say" aria-label={w("plate.chefOnMeal")}>
              <small><b>{CHEF_NAME}:</b> {adv.line}</small>
              <div className="button-row">{[b.portion, b.allOf, b.add]}<button type="button" className="pill pill-small pill-action mp-not-counted" onClick={() => p.notCounted()}>{w("dish.dontCountIt")}</button></div>
            </section>);
          const total = Math.max(1, Math.round(items.reduce((n, i) => n + i.grams, 0)));
          const ch = (x: NonNullable<typeof mpEat>, text: string) => { const on = mpEat === x; const tap = () => { setMpEat(x); setMpGrams(x === "all" ? String(total) : x === "half" ? String(Math.round(total / 2)) : ""); if (x === "part") window.setTimeout(() => (document.querySelector("input.mp-grams") as HTMLInputElement | null)?.focus(), 0); };
            return <div key={x} role="radio" tabIndex={0} aria-checked={on} className={`pa-opt${on ? " on" : ""}`} onClick={tap} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tap(); } }}>{text}</div>; };
          const mpDone = () => {
            if (mpEat === "not") { p.notCounted(); return; }
            if (mpEat === "all") { p.ateNow(mealOf(), slot, { photo: state.photo!.image, at }); return; }
            if (mpEat === "half") { p.ateNow(mealOf(), slot, { photo: state.photo!.image, half: true, at }); return; }
            const g = Math.min(total, Math.round(Number(mpGrams) || 0));
            if (g <= 0) { (document.querySelector("input.mp-grams") as HTMLInputElement | null)?.focus(); return; }
            p.ateNow(mealOf(), slot, { photo: state.photo!.image, at, ...(g < total ? { part: g / total } : {}) });
          };
          return (
            <section className="card mp-say" aria-label={w("plate.chefOnMeal")}>
              <small><b>{CHEF_NAME}:</b> {adv.line}</small>
              <div className="pa-row rv-q mp-eat">
                <small className="pa-row-q">{w("plate.didYouEatIt")}</small>
                <div className="pa-chips" role="radiogroup" aria-label={w("plate.didYouEatIt")}>{ch("all", w("plate.allOfIt"))}{ch("half", w("plate.half"))}{ch("part", w("plate.partOfIt"))}{ch("not", w("dish.dontCountIt"))}</div>
                {mpEat && mpEat !== "not" && <div className="rv-weight"><input className="search rv-grams mp-grams" type="number" inputMode="numeric" min={1} max={total} aria-label={w("plate.gramsEaten")} value={mpGrams} onChange={(e) => { setMpGrams(e.target.value); const g = Math.round(Number(e.target.value)); setMpEat(g === total ? "all" : "part"); }} /><small className="muted">{w("plate.gOfTotal", { total })}</small></div>}
              </div>
              <div className="button-row mp-go"><button type="button" className="pill pill-small pill-primary mp-done" disabled={!mpEat} onClick={mpDone}>{w("make.done")}</button></div>
            </section>
          );
        })()}
        {fillsNow && mealSlot && (() => { const at = state.photo?.who === "ate" ? mealAt(mealDate, mealSlot.time) : undefined; return (
          <section className="chef-ask fills-ask" aria-label={w("fit.fillsAria")}>
            <ChefLine text={say("plateFills", mealSlot.name, fmt(t.calories, 0))} />
            <div className="ca-go">{!p.recordNow && <button type="button" className="pill pill-primary" onClick={() => { setFills(null); p.ateNow(plateMeal(), { date: mealDate, slotId: mealSlot.id, name: mealSlot.name, time: mealSlot.time }, { photo: state.photo?.image ?? null, at }); }}>{w("plate.ateIt")}</button>}
              <button type="button" className={`pill${p.recordNow ? " pill-primary" : ""}`} onClick={() => { setFills(null); p.savePlate(); }}>{w("plate.saveForLater")}</button></div>
            <div className="ca-links"><button type="button" className="link" onClick={() => { setFills(null); log("fit_used"); void askChef(items, [], [], [], true); }}>{w("fit.ideasAnyway")}</button></div>
          </section>); })()}
        {/* DT308: Fit to my target is not on an empty plate any more: it has nothing to fit yet */}
        <div className={`ways-out${(imported && !way) || (p.filling && plateWhen !== "now") ? " ways-out-col" : ""}`} style={(fillsNow && mealSlot) || (items.length === 0 && !imported && !madeBy && !p.filling) ? { display: "none" } : undefined}>
          {imported && rec ? (<>
            {/* PF A6 (0.2.35, Milan 23:11 and 23:21 on 17 October, back after the 0.2.27 revert): Make it as it is is not Chef
                Mealan's work, so no hat; the two ways are his, so both carry it. Wording and icons only: the ways work as before. */}
            <button className="pill pill-primary pill-wide" onClick={keepAsIs}>{!way && pd !== null && pdRef !== null && pd < pdRef - 0.05 ? w("make.prepareItAsItIs") : w("plate.prepare")}</button>
            {way && <button className="pill pill-wide" onClick={backToOriginal}>{w("make.backToTheOriginal")}</button>}
            {!way && pd !== null && pdRef !== null && pd < pdRef - 0.05 && p.ai.on && (
              <div className="in-ways">
                <small className="ways-label">{w("plate.underYourWays", { tag: pdTag(), pd: pdVal(pdRef) })}</small>
                <div className="ways">
                  <button className="pill pill-small" disabled={!!wayBusy} onClick={() => void changeDish()}><ChefHat size={16} /> {wayBusy === "change" ? w("make.changingIt") : w("make.changeTheRecipe")}</button>
                  <button className="pill pill-small" disabled={!!wayBusy} onClick={() => void addSide()}><ChefHat size={16} /> {wayBusy === "side" ? w("make.looking") : w("make.addOnTheSide")}</button>
                </div>
                {wayBusy === "change" && waySlow && <div className="way-slow"><small className="rq-drafting in-slow" role="status">{w("plate.takesLonger")}</small><button className="pill pill-small pill-action" onClick={() => wayStop.current?.abort()}>{w("make.stop")}</button></div>}
                <small className="muted ways-why">{w("plate.waysWhy", { pd: pdVal(pdRef) })}</small>
              </div>
            )}
          </>) : madeBy && items.length > 0 ? (<>
            {/* Chef Mealan's meal is on the plate (CH3): make it, or ask again from the plate as it was */}
            <button className="pill pill-primary pill-wide" onClick={keepAsIs}><ChefHat size={18} /> {p.filling && plateWhen === "plan" ? w("plate.putItIn", { slot: slotV(p.filling) }) : w("plate.prepare")}</button>
            <button className="pill pill-wide" onClick={() => { const m = madeBy; setMadeBy(null); setState((s) => ({ ...s, items: m.from, title: m.title0, portion: null, cooking: undefined, cookingFor: undefined })); void askChef(m.from, m.tried); }}>{w("make.otherIdeas")}</button>
          </>) : state.photo?.who === "idea" && items.length > 0 ? null /* DT130: an idea's buttons are in Chef Mealan's card above */ : (<>
          {/* DT149 (0.2.130): a meal of a day gone by is what you ate: no Fit, one button puts it in at the meal's time */}
          {p.filling && plateWhen === "past" ? (items.length > 0 && p.filling.by !== "line" && <button className="pill pill-primary pill-wide put-in" onClick={addPast}>{w("plate.putItInEaten", { slot: slotV(p.filling) })}</button>)
          : p.filling && plateWhen === "plan" ? (<>
            {/* DT149: planning: the one main button puts it in the plan, before Fit and after it */}
            {/* 0.3.157 (Coach Milan 18 November 00:22): for a meal set with the pencil this button falls away; Plan it plans it */}
            {items.length > 0 && p.filling.by !== "line" && <button className="pill pill-primary pill-wide put-in" onClick={keepAsIs}>{w("plate.putItIn", { slot: slotV(p.filling) })}</button>}
            <button className="pill pill-wide" disabled={items.length < 1} onClick={makeAMeal}><ChefHat size={18} className="hat" /> {fit ? w("plate.fitAgain") : w("plate.fit")}</button>
          </>) : (<>
          {/* DT308 Release 2 (0.3.155, boards Stories238 and 240): Fit to my target stands directly under the result, and Prepare
              it under + Add more to your plate; nothing of this branch is left down here */}
          </>)}
          </>)}
        </div>
        {otherDishes.length > 0 && !fillsNow && items.length > 0 && <small className="muted dish-fit-note">{w("dish.fitOne", { dish: state.title && state.title !== "DaaM" ? state.title : autoTitle(items), other: otherDishes.map((f) => f.meal.title).join(", ") })}</small>}
        {!imported && !madeBy && items.length === 0 && !!p.filling && <small className="ways-label ways-wait">{w("plate.addOneFirst", { meal: chefable && mealSlot ? mealV(mealSlot.name, true) : wordV("meal.meal") })}</small>}
        {/* RP1 (0.2.25, Milan 17:42 and 19:43): the recipe's steps, to review on the Plate before you make it */}
        {imported && rec && (rec.steps?.length || rec.source?.steps?.length) ? (
          <section className="card in-steps in-steps-plate" aria-label={w("make.theRecipeSSteps")}>
            <b>{w("make.steps")}</b>
            {rec.steps?.length ? <><small className="muted">{rec.stepMarks ? w("make.chefsStepsWhole") : w("make.yourStepsForTheWhole")}</small><ol className="rp-steps">{rec.steps.map((x, k) => <li key={k}><span>{k + 1}</span><div className="rp-step-text">{stepText(tempsIn(x), rec.items)}</div></li>)}</ol></>
              : <><small className="muted">{w("plate.forWholeRecipe", { how: rec.source?.from === "link" ? w("make.asThePageWritesThem") : w("make.asTheRecipeWritesThem") })}</small><OriginalSteps steps={rec.source!.steps!} /></>}
          </section>
        ) : null}
        {imported && share && <p className="small center">{w("plate.mealAbout", { meal: MealW, kcal: fmt(share.kcal, 0) })}{dayNums ? w("plate.ofYour", { kcal: fmt(dayNums.kcal, 0) }) : ""}{pdRef !== null ? w("plate.atPd", { tag: pdTag(), pd: pdVal(pdRef) }) : ""}.</p>}
        {!imported && !madeBy && chefable && share && items.length > 0 && <p className="small center">{w("plate.mealAbout", { meal: MealW, kcal: fmt(share.kcal, 0) })}{dayNums ? w("plate.ofYour", { kcal: fmt(dayNums.kcal, 0) }) : ""}{pdRef !== null ? w("plate.atPd", { tag: pdTag(), pd: pdVal(pdRef) }) : ""}.{p.filling && plateWhen !== "now" ? "" : <> {w("plate.chefAdds", { meal: mealW })} {p.filling ? w("plate.keepPuts", { slot: slotV(p.filling) }) : w("plate.keepTakes")}</>}</p>}
        {!madeBy && chefable && share && items.length > 0 && unlogged && state.photo?.who !== "idea" && (() => {
          const name = unlogged.name.charAt(0).toUpperCase() + unlogged.name.slice(1);
          const ifSkipped = mealSlot && dayNums ? mealShare(daySlots, mealSlot.id, { kcal: dayNums.kcal, protein: dayNums.protein }, { kcal: dayRec.kcal, protein: dayRec.protein }, new Set([...closed, unlogged.id])) : null;
          return (
            <div className="ms-ask">
              <small className="ms-q">{w("plate.notLogged", { meal: mealV(unlogged.name) })}</small>
              <div className="button-row"><button className="pill pill-small" onClick={() => answer(unlogged.id, "had")}>{w("make.iHadIt")}</button><button className="pill pill-small" onClick={() => answer(unlogged.id, "skipped")}>{w("make.iSkippedIt")}</button></div>
              <small className="muted">{ifSkipped ? w("plate.hadSkippedAbout", { meal: mealW, kcal: fmt(share.kcal, 0), other: mealV(unlogged.name, true), kcal2: fmt(ifSkipped.kcal, 0) }) : w("plate.hadSkipped", { meal: mealW, kcal: fmt(share.kcal, 0), other: mealV(unlogged.name, true) })}</small>
            </div>
          );
        })()}
        {!madeBy && chefable && share && items.length > 0 && justSkipped && (() => {
          const sk = daySlots.find((x) => x.id === justSkipped);
          return sk ? <div className="ms-ask"><small className="ms-q">{w("plate.skippedMoved", { name: mealV(sk.name), meal: mealW })}</small><button className="pill pill-small pill-action" style={{ alignSelf: "flex-start" }} onClick={() => answer(sk.id, null)}>{w("make.undo")}</button></div> : null;
        })()}
        {p.filling && plateWhen === "plan" && items.length > 0 && <p className="small center plan-note">{w("make.plannedNotEatenOnIts")}</p>}
        {p.filling && plateWhen === "past" && items.length > 0 && <p className="small center plan-note">{w("plate.countedOn", { day: dateV(new Date(`${p.filling.date}T12:00:00`), { weekday: "long" }), time: p.filling.time })}</p>}
        {!chefable && p.filling && p.filling.mode !== "eat" && plateWhen === "now" && items.length > 0 && <p className="small center">{w("plate.fitMovesOne", { slot: slotV(p.filling) })}</p>}
        {p.filling?.mode === "eat" && items.length > 0 && <p className="small center">{w("plate.fitSetsAmounts", { slot: slotV(p.filling) })}</p>}
        {!imported && !chefable && !p.filling && items.length === 1 && <p className="small center">{w("plate.oneProduct")}</p>}
        {!imported && !chefable && !p.filling && items.length >= 2 && <p className="small center">{w("make.fitCalculatesTheAmountsWithout")}</p>}
        {!imported && !(state.photo?.who === "idea" && state.photo.served && !state.photo.served.mine) && <Tip list={items} refit={false} />}
        </section>)}
        {swapPanel}
        {foodCard}
        {askChange && changedBase(askChange.its) && ChangedAsk()}
        {helperSheet}

        </>)}
      </>
    );

  if (step === "recipe") {
    // The recipe is the current items: Mealan's result, editable. Typing an amount makes it yours; Mealan redoes the rest.
    const mover = moverOf(items);
    const over = cap !== null && !!mover && mover.grams > cap;
    const shown = over ? items.map((i) => (i.id === mover!.id ? { ...i, grams: cap! } : i)) : items;
    const ot = aggregate(shown); const opd = density(ot.protein, ot.calories);
    // DT149 (0.2.130): the share of the plate's own day (Friday's for Friday's dinner), not today's
    const dayKcal = dayNums?.kcal ?? p.todayKcal ?? state.goals.calories ?? null;
    const share = dayKcal ? Math.round(((ot.calories ?? 0) / dayKcal) * 100) : null;
    const tooBig = shown.filter((i) => i.grams > (cap ?? 300));
    const meetingBig = p.moment === "meeting" && share !== null && share > 30;
    const unplanned = !momentOf(p.moment).planned;
    const unreal = !unplanned && (tooBig.length > 0 || (share !== null && share > 50) || meetingBig);
    const onPlan = !unreal && opd !== null && pdRef !== null && opd >= pdRef - 0.05;
    // Fit kept the plate as it stood: already above the target, so nothing moved (Milan, 15 October 2026: it said it moved the chicken)
    const kept = !!mover && !over && onPlan && fitBefore?.[mover.id] === mover.grams && opd! > pdRef! + 0.05;
    const unrealText = tooBig.length
      ? w("plate.notAPortion", { grams: fmt(tooBig[0].grams, 0), food: tooBig[0].food.name })
      : meetingBig
        ? w("plate.meetingShare", { share: share ?? 0 })
        : w("plate.dessertShare", { share: share ?? 0 });
    return (
      <>
        {Head({ back: "in", name: Boolean(p.filling), title: mover ? w("plate.chefsRecipe") : w("make.asYouSetIt"), sub: unplanned ? w("plate.unplannedSub", { moment: wordV(`moment.${p.moment}` as WordKey) }) : over ? w("plate.overSub", { food: mover!.food.name, grams: fmt(mover!.grams, 0), target: fixed(pdRef), cap: cap ?? 0 }) : kept ? w("plate.keptSub", { tag: pdTag(), pd: pdVal(opd), target: pdVal(pdRef) }) : mover ? w("plate.moverSub", { food: mover.food.name }) : w("plate.nothingMovedSub") })}
        <section className={`readout ${unreal ? "readout-fit-mid" : `readout-fit-${p.fitPd(opd)}`}`}>
          <div className="readout-top"><span>{w("make.thisPlate")}</span><span>{pdTag()}</span></div>
          <div className="readout-mid">
            <b>{pdVal(opd)}</b>
            <div><span>{unreal ? w("plate.notRealistic") : onPlan ? w("plate.onPlanTarget", { pd: pdVal(pdRef) }) : w("plate.target", { pd: pdVal(pdRef) })}</span><small>{share !== null ? w("plate.mixNumsShare", { kcal: fmt(ot.calories, 0), share, protein: fmt(ot.protein), weight: fmt(ot.weight, 0) }) : w("plate.mixNums", { kcal: fmt(ot.calories, 0), protein: fmt(ot.protein), weight: fmt(ot.weight, 0) })}</small></div>
          </div>
          {unreal && <p className="readout-note">{unrealText}</p>}
          {extras(shown.map((x) => ({ food: x.food, grams: x.grams })))}
        </section>
        <div className="rows">
          {groupsOf(shown).map((g) => g.kind === "dish" ? <DishRow key={g.id} g={g} /> : (() => { const i = g.item; return (
            <SwipeRow key={i.id} onRemove={() => remove(i.id)} onSwap={() => setSwapId(i.id)}>
            <div className="row">
              <button className={`dot ${i.locked ? "dot-locked" : "dot-free"}`} aria-label={`${i.locked ? w("make.letChefMealanMove") : w("make.keep")} ${i.food.name}`} onClick={() => toggle(i.id)} />
              <div className="row-text"><button className="name-link" onClick={() => setCardId(i.id)}>{i.food.name}</button>
                <small>{i.locked ? w("plate.asYouSetIt") : i.id === mover?.id ? w("plate.whatChefMoves") : w("plate.chefMayMove")}</small>
                {suggest?.id === i.id && suggest.grams !== i.grams && (
                  <button className="link suggest" onClick={applySuggestion}>
                    {w("plate.suggests", { grams: suggest.grams, pd: pdText(opd), target: pdVal(pdRef) })}
                  </button>
                )}
              </div>
              {isCounted(i) ? <CountAmount item={i} editable={!i.locked} onGrams={(g) => edit(i.id, g)} /> : i.locked ? <b className="row-num">{fmt(i.grams, 0)} g</b> : (
                <label className="grams">
                  {i.est && <span className="mp-est" aria-label={w("plate.estimated")}>~</span>}
                  <input aria-label={w("meal.gramsOf", { food: foodV(i.food) })} type="number" min="0" inputMode="decimal" value={i.grams === 0 ? "" : Math.round(i.grams * 10) / 10}
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
        {over && <button className="pill pill-wide" onClick={() => setCap(null)}>{w("plate.allowMore", { cap: cap ?? 0 })}</button>}
        {/* DT149 (0.2.130): planning has no Make: Put it in is the main button */}
        {!(p.filling && plateWhen !== "now") && <button className="pill pill-primary pill-wide" onClick={() => {
          log("mix_applied", { grams: mover ? Math.round(over ? cap! : mover.grams) : 0 });
          setState((s) => ({ ...s, items: shown, portion: null, title: s.title || "DaaM" }));
          setMethod(null);
          setStep("make");
        }}>{w("make.makeIt")}</button>}
        {p.filling && p.filling.mode !== "eat" ? (<>
          <button className={`pill pill-wide${plateWhen !== "now" ? " pill-primary" : ""}`} onClick={() => putInSlot(shown)}>{w("plate.putItIn", { slot: slotV(p.filling) })}</button>
          <Tip list={shown} refit />
        </>) : (
        <button className="pill pill-wide" onClick={() => {
          p.keepForLater({ id: uid(), title: p.state.title || autoTitle(shown), items: structuredClone(shown), portion: shown.reduce((n, i) => n + i.grams, 0), savedAt: new Date().toISOString() });
          setStep("in");
        }}>{w("make.keepForLaterToday")}</button>
        )}
        {(!p.filling || p.filling.mode === "eat") && !unplanned && <Tip list={shown} refit />}
        {options.length > 1 && <button className="pill pill-wide" onClick={() => {
          const next = (pick + 1) % options.length; setPick(next);
          setState((s) => ({ ...s, items: options[next].items, portion: null }));
        }}>{w("plate.tryAnotherMix", { k: (pick % options.length) + 1, n: options.length })}</button>}
        {swapPanel}
        {foodCard}
        {askChange && changedBase(askChange.its) && ChangedAsk()}
        {helperSheet}
      </>
    );
  }

  // the recipe the plate is: one that came in, or one of yours opened on the plate (by its slot or its name)
  const plateRecipe = rec ?? ((m) => (m ? shownMeal(m, recLang) : m))(state.meals.find((m) => (p.filling?.mealId ? m.id === p.filling.mealId : !!state.title && m.title === state.title) && m.items.length > 0));
  const wholePlate = !!rec?.makes && rec.makes.n >= 2 && pmode === "whole" && !way;
  const madeWhole = !!rec?.makes && rec.makes.n >= 2 && (wholePlate || (makeAll ?? rec.makes.n >= 4));
  // R12 (0.2.38, board RS9): the whole recipe in your portions; a plate sized for your lunch leaves lunches, not the recipe's pieces
  const sizedPlate = !!rec?.makes && imported && pmode === "sized" && !!mealNeed && !way;
  const yours = !rec?.makes || wholePlate ? 1 : sizedPlate ? yourPortions(kcalOfItems(rec.items), kcalOfItems(items)) : rec.makes.n;
  const leftK = yours - 1;
  // R25: the whole recipe on the plate, counted; what one is; what is eaten; the day's kcal for the big meal check
  const cookCount = rec?.makes ? rec.cook?.n ?? rec.makes.n : 0;
  // DT81: a plate from scratch against one of your meals: about 3 of them is a batch, and the save step asks
  const plateMeals = mealNeed && mealNeed > 0 ? Math.max(1, Math.round(kcalOfItems(items) / mealNeed)) : 1;
  const plateBig = !!mealNeed && kcalOfItems(items) / mealNeed >= 1.6;
  // you ate a portion of it: it made more than one, and the guess is filled in; you ate all of it: one plate unless you say more
  const makesShown = newMakesN ?? (ate === "portion" ? String(Math.max(2, plateMeals)) : "");
  const wholeN = wholePlate ? madeN ?? cookCount : 0;
  const perOne = wholeN > 1 ? kcalOfItems(items) / wholeN : 0;
  const eatenKcal = wholeN > 1 ? perOne * eatN : kcalOfItems(items);
  const dayKcal = dayNums?.kcal ?? p.todayKcal ?? state.goals.calories ?? null;
  const leftMany = sizedPlate ? mealsW : rec ? unitOf(rec) : w("plate.portionsWord");
  const leftWords = (k: number) => (sizedPlate ? nMeals(k) : countUnit(k, rec));
  // DT216 (0.3.56): a recipe of yours that kept the bowl steps (its way) from an earlier save, now on a plate you cook: it gets
  // Chef Mealan's steps; Lock the recipe keeps them with it
  const bowlKept = !rec && !!plateRecipe?.way && (plateRecipe?.steps?.length ?? 0) > 0 && bowlKeptOn(items);
  const cooksNow = !rec && (!((plateRecipe?.steps?.length ?? 0) > 0) || bowlKept) && cooksPlate(items);
  if (step === "make" && (rec || (plateRecipe?.steps?.length ?? 0) > 0 || partsOf(items).length > 0 || cooksNow)) {
    // a changed dish (0.2.23, IM23): the steps are for the dish on the plate, the whole recipe as changed; kept with it at Save
    const chg = way && way.kind === "change" && way.whole && rec ? way : null;
    const changedRec: Meal | undefined = chg && rec ? { ...rec, id: `${rec.id}~changed`, title: chg.title || state.title || rec.title, items: chg.whole!, steps: chg.drafted?.steps ?? [], stepMarks: chg.drafted?.marks, stepsKitchen: chg.drafted?.kitchen, stepParts: chg.drafted?.parts } : undefined;
    // DT89: a plate you cook, no recipe yet: the steps drafted here, at the plate's amounts
    const recipe = changedRec ?? (cooksNow ? { ...plateMealNow(), steps: heldSteps?.steps ?? [] } : plateRecipe);
    const steps = recipe?.steps ?? [];
    // RP1b (0.2.25): the original's steps, and how your dish differs from the foods they were written for
    const origSteps = rec?.source?.steps ?? (plateRecipe?.source?.steps ?? []);
    const mkDiff = recipe ? diffFoods(foodNames(recipe.items), originalFoodsOf(chg && rec ? rec : recipe, state.meals) ?? (chg && rec ? foodNames(rec.items) : null)) : null;
    const mkStale = recipe && steps.length ? diffFoods(foodNames(recipe.items), recipe.stepsFor) : null;
    const n = rec?.makes?.n ?? 1, unit = rec ? unitOf(rec) : w("plate.portionsWord"), one = rec ? oneOf(rec) : w("plate.portionWord");
    const onePlate = !!rec && pmode === "recipe" && !way;
    const t0 = aggregate(items), pd0 = density(t0.protein, t0.calories);
    // the amounts in the steps follow what you make: the whole recipe's grams, or your plate's
    const amounts = (): Ingredient[] => !recipe ? items : madeWhole ? recipe.items : (() => { const on = pairItems(recipe.items, items); return recipe.items.map((r, k) => ({ ...r, grams: on[k]?.grams ?? 0 })); })();
    // R3, the fix (0.2.39): the steps cook with the pot, even for just your plate; what you make counts what is taken up
    const counted = amounts();
    const stepsFor = madeWhole ? counted : counted.map((i) => (i.fry ? { ...i, fry: { ...i.fry, plate: true } } : i));
    const tMake = aggregate(counted);
    const mark = (m?: { kind: string; why: string }) => !m ? null : <small className={`st-mark ${m.kind}`}>{m.kind === "same" ? w("make.asTheOriginal") : m.why ? w(m.kind === "adapted" ? "make.adaptedWhy" : "make.addedWhy", { why: m.why }) : w(m.kind === "adapted" ? "make.adapted" : "make.added")}</small>;
    const draftHere = async () => {
      if (!recipe) return;
      setMkDraft("working");
      try {
        const d = await draftSteps(recipe, { library: state.foods.map((f) => f.name), equipment: equipmentOf(p.personal), kitchens: p.personal.kitchens ?? [], tastes: tasteForReq(p.personal.tasteChips, state.preferences), ...(chg && rec ? { changed: changesOf(rec.items, chg.whole!, chg.notes) } : {}) });
        if (d.ok) {
          if (chg) setWay({ ...chg, drafted: { steps: d.steps, marks: d.marks, kitchen: d.kitchen, parts: d.parts, moves: d.moves } });
          else setState((s) => ({ ...s, meals: s.meals.map((m) => (m.id === recipe.id ? { ...m, steps: d.steps, stepMarks: d.marks, stepsKitchen: d.kitchen, stepParts: d.parts, moves: d.moves, stepsFor: foodNames(m.items) } : m)) }));
          setMkDraft(""); setMkDrafted(true);
        }
        else { const f = d as { why: string; cannot?: boolean }; setMkDraft(f.cannot ? f.why : w("make.draftFailedOriginal", { why: f.why })); }
      } catch (e: any) { setMkDraft(e?.message || w("make.couldNotAnswerAgain")); }
    };
    const parts = partsOf(items);
    return (
      <>
        {/* 0.3.64 (Coach Milan 22:39): the title says the dish, as Make does */}
        {Head({ back: "in", title: w("make.howToMake", { dish: recipe?.title && recipe.title !== "DaaM" ? recipe.title : state.title && state.title !== "DaaM" ? state.title : autoTitle(items) }), sub: cooksNow ? (steps.length ? w("make.stepsForMeal", { meal: mealW }) : plateDraft === "working" ? w("make.writingForAmounts") : w("make.stepsForYourAmounts")) : chg ? (steps.length ? w("make.stepsChanged") : w("make.noStepsYetForYour")) : steps.length ? w(recipe?.stepParts?.some(Boolean) ? "make.stepsWhatYouMakeParts" : "make.stepsWhatYouMake") : origSteps.length ? w("make.theRecipeSOwnSteps") : rec ? w("make.noStepsYetForThis") : w("make.yourDishPartByPart") })}
        {/* IM19, IM20: what you make, and what you eat */}
        {rec?.makes && n >= 2 && (
          <section className="card mk-card" aria-label={w("make.whatYouMake")}>
            <b>{w("make.whatYouMake")}</b>
            {/* R15: with the whole recipe on the plate, you make all of it: no choice to ask */}
            {!wholePlate && <div className="moments">
              <button className={`choice ${madeWhole ? "on" : ""}`} aria-pressed={madeWhole} onClick={() => setMakeAll(true)}>{w("make.theWholeRecipe")}</button>
              <button className={`choice ${!madeWhole ? "on" : ""}`} aria-pressed={!madeWhole} onClick={() => setMakeAll(false)}>{w("make.justYourPlate")}</button>
            </div>}
            {/* RP3 (0.2.25): what you make and what you eat, each with its weight and energy */}
            <div className="mk-eat mk-make"><span><b>{w("make.youMake")}</b> {madeWhole ? (sizedPlate ? w("make.wholeAbout", { yours, many: leftMany }) : w("make.wholeRecipeLow")) : onePlate ? w("make.oneUnit", { one }) : w("make.yourPlate")}</span><span>{w("make.gKcal", { g: fmt(tMake.weight, 0), kcal: fmt(tMake.calories, 0) })}</span></div>
            <div className="mk-eat"><span><b>{w("make.youEat")}</b> {wholePlate ? w("make.wholeRecipeLow") : sizedPlate ? w("make.oneMeal", { meal: mealW }) : onePlate ? w("make.oneUnit", { one }) : rec && pmode === "recipe" && !way ? w("make.yourPlateOne", { one }) : w("make.yourPlate")}</span><span>{w("make.gKcalPd", { g: fmt(t0.weight, 0), kcal: fmt(t0.calories, 0), pd: pdText(pd0) })}</span></div>
            <small className="muted">{madeWhole ? (leftK < 1 ? w("make.stepsWholePlate", { plate: w("make.yourPlateIsTheWhole") }) : wn("make.stepsWholeLeft", leftK, { left: leftWords(leftK) })) : w("make.recipeMakesN", { n })}</small>
          </section>
        )}
        {/* RP1 to RP1c (0.2.25): the original is the steps; Chef Mealan's on demand, with a line for the case */}
        {steps.length > 0 ? (
          <section className="card mk-card">
            {origSteps.length > 0 && (
              <div className="segments rq-steps-seg" role="tablist" aria-label={w("make.whichSteps")}>
                <button role="tab" aria-selected={mkView === "own"} className={`seg ${mkView === "own" ? "on" : ""}`} onClick={() => setMkView("own")}>{recipe?.stepMarks ? w("make.chefs") : w("plate.yours")}</button>
                <button role="tab" aria-selected={mkView === "orig"} className={`seg ${mkView === "orig" ? "on" : ""}`} onClick={() => setMkView("orig")}>{w("make.original")}</button>
              </div>
            )}
            {origSteps.length > 0 && mkView === "orig" ? <><small className="muted">{w("make.forTheWholeRecipeAs")}</small><OriginalSteps steps={origSteps} /></> : (<>
            {mkStale && <StepsHint tone="warn">{w("make.stepsEarlierFoods")} {diffLine(mkStale)}</StepsHint>}
            {mkStale && p.ai.on && <div className="button-row"><button className="pill pill-small pill-primary" disabled={mkDraft === "working"} onClick={() => void draftHere()}>{w("make.writeThemAgain")}</button></div>}
            {chg && <small className="muted mk-changed">{w("make.stepsGoWith", { title: changedRec!.title })}</small>}
            {recipe?.stepMarks && (!chg || recipe.stepsKitchen) && <small className="muted">{recipe.stepsKitchen || w("make.stepsFromOriginal")}</small>}
            <ol className="rp-steps">{steps.map((x, k) => [recipe?.stepParts?.[k] && (k === 0 || recipe.stepParts[k - 1] !== recipe.stepParts[k]) ? <li key={`p${k}`} className="rp-step-part">{w("make.thePart", { part: recipe.stepParts[k].toLowerCase() })}</li> : null,
              <li key={k}><span>{k + 1}</span><div className="rp-step-text">{stepParts(tempsIn(x), stepsFor).map((pt, j) => ("text" in pt ? pt.text : <b key={j} className="st-amt">{pt.label}</b>))}{mark(recipe?.stepMarks?.[k])}</div></li>])}</ol>
                      </>)}
          </section>
        ) : origSteps.length > 0 ? (
          <section className="card mk-card" aria-label={w("make.steps")}>
            {mkDiff ? <StepsHint tone="warn">{diffLine(mkDiff)}</StepsHint> : null}
            {mkDraft === "working" ? <ThinkingCard className="rq-drafting" title={w("make.writingSteps")} /> : mkDraft ? <small className="rq-drafting">{mkDraft}</small> : null}
            {mkDiff && p.ai.on && <div className="button-row"><button className="pill pill-small pill-primary" disabled={mkDraft === "working"} onClick={() => void draftHere()}>{w("make.writeTheStepsForMy")}</button></div>}
            <small className="muted">{mkDiff ? w("make.theOriginalForTheOriginal") : n >= 2 ? w("make.wholeAsOriginalN", { n, unit }) : w("make.wholeAsOriginal")}</small>
            <OriginalSteps steps={origSteps} />
            {!mkDiff && <StepsHint tone="ok">{w("make.theOriginalWorksWithYour")}</StepsHint>}
            {!mkDiff && p.ai.on && <div className="button-row"><button className="pill pill-small" disabled={mkDraft === "working"} onClick={() => void draftHere()}>{w("make.chefsWay")}</button></div>}
          </section>
        ) : cooksNow ? (
          <section className="card mk-card" aria-label={w("make.steps")}>
            {/* DT89: Chef Mealan drafts them as the step opens; with the AI off, or after a miss, your own, one per line */}
            {plateDraft === "working" ? <ThinkingCard className="rq-drafting" title={w("make.writingSteps")} /> : plateDraft ? <small className="rq-drafting">{plateDraft}</small> : null}
            {p.ai.on && plateDraft !== "working" && <div className="button-row"><button className="pill pill-small pill-primary" onClick={() => startPlateSteps(true)}>{plateDraft ? w("make.tryAgain") : w("make.draftWithChef")}</button></div>}
            {plateDraft !== "working" && (ownSteps === null
              ? <button className="pill pill-small pill-action" style={{ alignSelf: "flex-start" }} onClick={() => setOwnSteps("")}>{w("make.writeMyOwn")}</button>
              : <>
                <textarea aria-label={w("make.yourStepsOnePerLine")} placeholder={w("make.oneStepPerLine")} value={ownSteps} onChange={(e) => setOwnSteps(e.target.value)} />
                <div className="button-row"><button className="pill pill-small" disabled={!ownSteps.trim()} onClick={() => { const lines = ownSteps.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 12); setPlateSteps({ steps: lines, sig: plateSig(items) }); setOwnSteps(null); setPlateDraft(""); }}>{w("make.keepMySteps")}</button></div>
              </>)}
          </section>
        ) : rec ? (
          <section className="card mk-card" aria-label={w("make.steps")}>
            <b>{w("make.steps")}</b>
            {p.ai.on && <small className="muted">{w("make.writesFromOriginal")}</small>}
            {mkDraft === "working" ? <ThinkingCard className="rq-drafting" title={w("make.writingSteps")} /> : mkDraft ? <small className="rq-drafting">{mkDraft}</small> : null}
            {p.ai.on && <div className="button-row"><button className="pill pill-small pill-primary" disabled={mkDraft === "working"} onClick={() => void draftHere()}>{w("make.draftWithChef")}</button></div>}
          </section>
        ) : (
          <section className="card mk-card" aria-label={w("make.checklist")}>
            {/* IM19c: your own dish in parts, without steps: the parts as a checklist at your amounts */}
            {[...parts, w("make.putItTogether")].map((pt) => { const its = items.filter((i) => i.part === pt), on = ticks.has(pt);
              return <button key={pt} type="button" className={`mk-check ${on ? "on" : ""}`} aria-pressed={on} onClick={() => setTicks((t) => { const x = new Set(t); if (x.has(pt)) x.delete(pt); else x.add(pt); return x; })}>
                <span className="mk-box">{on ? "✓" : ""}</span><span><b>{pt}{its.length ? ":" : ""}</b> {its.map((i) => <b key={i.id} className="st-amt">{fmt(i.grams, 0)} g {i.food.name}</b>).reduce<React.ReactNode[]>((a, el, k) => (k ? [...a, ", ", el] : [el]), [])}{its.length ? "" : ` ${w("make.inABowl")}`}</span></button>; })}
            {recipe && p.ai.on && <button className="pill pill-small pill-action" style={{ alignSelf: "flex-start" }} disabled={mkDraft === "working"} onClick={() => void draftHere()}>{mkDraft === "working" ? w("make.writingStepsDot") : w("make.draftWithChef")}</button>}
            {mkDraft && mkDraft !== "working" && <small className="rq-drafting">{mkDraft}</small>}
          </section>
        )}
        {/* DT216: the recipe had the bowl steps; Lock the recipe keeps the new ones with it */}
        {bowlKept && steps.length > 0 && <small className="muted mk-bowl-note">{w("make.yourRecipeHadTheBowl")}</small>}
        {/* DT220 (0.3.58): what the steps are for, and a button that says what comes next */}
        {steps.length > 0 && <small className="muted mk-steps-for">{w("make.makeReadsTheseStepsAloud")}</small>}
        {/* DT94: Lock the recipe ends Craft; from here the recipe does not change */}
        <button className="pill pill-primary pill-wide" onClick={() => {
          log("method_chosen", { method: madeWhole ? "whole" : "plate" });
          if (bowlKept && plateRecipe && heldSteps?.steps.length) { const id = plateRecipe.id, st = heldSteps.steps, mv = heldSteps.moves; setState((s0) => ({ ...s0, meals: s0.meals.map((m) => (m.id === id ? { ...m, steps: st, stepsFor: foodNames(m.items), way: undefined, stepMarks: undefined, stepsKitchen: undefined, stepParts: undefined, moves: mv } : m)) })); }
          setStep("made");
        }}>{w("make.lockItAndCook")}</button>
        {madeWhole && leftK > 0 && <small className="muted center" style={{ display: "block", marginTop: 6 }}>{w("make.toEatTheRestOn")}</small>}
      </>
    );
  }
  if (step === "make") {
    const ways = methodsFor(items);
    return (
      <>
        {Head({ back: "in", title: w("make.howDoYouWantTo"), sub: ways.length ? wn("make.sameAmountsWays", ways.length) : w("make.oneFoodNothingToCombine") })}
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
        }}>{/* 0.3.62 (Coach Milan 21:00, yes): the button says what comes next */}{ways.length ? w("make.makeItThisWay") : w("make.makeIt2")}</button>
      </>
    );
  }

  if (step === "made") {
    // DT94: the steps of what is being made: the recipe's, the plate's drafted ones, or the way picked for a bowl
    const madeSteps0: string[] = (rec?.steps?.length ? rec.steps : plateRecipe?.steps?.length ? plateRecipe.steps : heldSteps?.steps?.length ? heldSteps.steps : (methodsFor(items).find((w) => w.id === method)?.steps ?? []));
    // DT217 (0.3.56): the moves cook mode reads, as drafted with these steps; a step without them gets them in code
    const madeMoves0: import("../pilot").StepMoves | undefined = rec?.steps?.length ? rec.moves : plateRecipe?.steps?.length ? plateRecipe.moves : heldSteps?.steps?.length ? heldSteps.moves : undefined;
    // DT174: the amounts the steps say: the whole recipe when you make all of it, else your plate
    const stepItems: Ingredient[] = madeWhole && rec ? rec.items : items;
    // DT214 v2: a food used in the dish in place of another takes its place in the steps; the recipe stays as it is
    const follow = (t: string) => (plateRecipe ? t.replace(TOKEN, (all, id: string) => { const it = stepItems.find((x) => x.id === id), was = plateRecipe.items.find((x) => x.id === id); return it && was && it.food.id !== was.food.id ? `[[i:${id}|${it.food.name.split(",")[0].trim().toLowerCase()}]]` : all; }) : t);
    const madeSteps = madeSteps0.map(follow);
    const madeMoves = madeMoves0?.map((x) => ({ m: (x?.m ?? []).map(follow) }));
    const dishName = (state.title && state.title !== "DaaM" ? state.title : autoTitle(items)).slice(0, 40);
    const tick = (k: number) => setTicks((tk) => { const n = new Set(tk); if (n.has(`s${k}`)) n.delete(`s${k}`); else n.add(`s${k}`); return n; });
    return (
      <>
        {Head({ back: "make", title: w("make.makeDish", { dish: dishName }), sub: madeSteps.length ? w("make.tickTheStepsAsYou") : w("make.aPhotoOrTwo") })}
        {/* DT214 v2 (0.3.53): a food scanned while cooking, used in the dish: what it replaces, or Add it */}
        {p.useInCook && (() => { const f = p.useInCook!, short = f.name.split(",")[0].trim(); return (
          <section className="chef-ask" aria-label={w("make.useInDish", { food: short, dish: dishName })}>
            <ChefLine text={say("useInCook", short, dishName)} />
            <div className="ca-go">
              {items.filter((i) => !i.optional).map((i) => <button key={i.id} type="button" className="pill" onClick={() => { setState((st) => ({ ...st, items: st.items.map((x) => (x.id === i.id ? { ...x, food: f, est: undefined } : x)), portion: null })); p.doneUseInCook(); }}>{w("make.inPlaceOf", { food: i.food.name.split(",")[0].trim().toLowerCase() })}</button>)}
              <button type="button" className="pill pill-primary" onClick={() => { add(f); p.doneUseInCook(); }}>{w("make.addIt")}</button>
            </div>
            <div className="ca-links"><button type="button" className="link" onClick={p.doneUseInCook}>{w("make.cancel")}</button></div>
            <small>{w("make.inPlaceOfAFood")}</small>
          </section>); })()}
        {/* DT211 v8 (0.3.53): coming back in the middle, Chef Mealan asks first */}
        {resumeAsk && state.cook && (
          <section className="chef-ask" aria-label={w("make.goOnWhereYouLeft")}>
            <ChefLine text={resumeLine(state.cook)} />
            <div className="ca-go"><button type="button" className="pill pill-primary" onClick={() => { setResumeAsk(false); if (madeSteps.length && p.travel?.kitchen !== "hotel") setCooking(true); }}>{w("make.goOnCooking")}</button></div>
            <div className="ca-links"><button type="button" className="pill pill-small pill-action" onClick={() => p.saveCookForLater()}>{w("make.saveForLater")}</button><button type="button" className="pill pill-small pill-action" onClick={() => { setResumeAsk(false); setTicks(new Set()); setStepPhotos({}); setPlate(""); setWent("as"); setDifferent(""); }}>{w("make.startOver")}</button></div>
          </section>
        )}
        {/* DT174 (0.3.16): Start cooking, above the steps: one big step at a time; each finished step is ticked here */}
        {madeSteps.length > 0 && p.travel?.kitchen === "hotel" && <small className="muted travel-plate-note">{w("make.travelModeHotelWithNo")}</small>}
        {madeSteps.length > 0 && p.travel?.kitchen !== "hotel" && !resumeAsk && (
          <div className="mk-cook">
            <button className="pill pill-wide pill-primary" onClick={() => setCooking(true)}>{ticks.size > 0 && madeSteps.some((_, k) => !ticks.has(`s${k}`)) ? w("make.goOnCooking") : w("make.startCooking")}</button>
            <small className="muted">{w("make.oneBigStepAtA")}</small>
          </div>
        )}
        {cooking && madeSteps.length > 0 && <PairedCookMode notify={p.notify} title={(state.title && state.title !== "DaaM" ? state.title : autoTitle(items))} steps={madeSteps} moves={madeMoves} items={stepItems}
          ticks={new Set(madeSteps.map((_, k) => k).filter((k) => ticks.has(`s${k}`)))}
          onTick={(k) => setTicks((tk) => { const n = new Set(tk); n.add(`s${k}`); return n; })} onClose={() => setCooking(false)}
          ask={p.ai.on ? async (question, at, history) => {
            // DT175 (0.3.17): the question goes with the recipe, this step, the amounts cooked, the kitchen and the tools
            const r = await fetch("/api/cook-ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, step: at, steps: madeSteps.map((x) => stepText(x, stepItems)), title: state.title || autoTitle(items), items: stepItems.filter((i) => i.grams > 0).map((i) => ({ name: i.food.name, grams: i.grams, protein: i.food.protein, calories: i.food.calories })), equipment: equipmentOf(p.personal), kitchens: p.personal.kitchens ?? [], history }) });
            const d = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(d.error || w("make.chefMealanCouldNotAnswer"));
            return String(d.reply || "");
          } : null}
          pics={(() => { const src = rec?.steps?.length ? rec : plateRecipe?.steps?.length ? plateRecipe : null; return madeSteps.map((t, k) => (stepPhotos[String(k)] ? { src: stepPhotos[String(k)], by: "me" as const } : stepPicOf(src, t))); })()}
          allPics={(() => { const src = rec?.steps?.length ? rec : plateRecipe?.steps?.length ? plateRecipe : null; return madeSteps.map((t) => stepPicsOf(src, t)); })()}
          link={{
            // DT222 (0.3.60, board Stories165): done leads to Eat: the meal's photo, then Cooked. Next: Eat
            since: state.cook?.startedAt,
            mealPhoto: { src: plate, take: (file) => { const r = new FileReader(); r.onload = () => thumbnailBase64(String(r.result), 480).then(setPlate).catch(() => {}); r.readAsDataURL(file); } },
            eat: () => { setCooking(false); log("made", { went, photos: Object.keys(stepPhotos).length + (plate ? 1 : 0), from: "cook" }); setStep("after"); },
            // DT223 (0.3.60): a photo of this step, kept with the recipe when there is one
            stepPhoto: { take: (k, file) => stepPhotoFile(k, file, true), kept: !!(cookRecipe && cookRecipe.steps?.length) },
          }} />}
        {/* DT211 v8 (0.3.53, board Stories158): each step has + Photo beside its tick, so the photos are taken where they happen */}
        {madeSteps.length > 0 && (
          <section className="card mk-card" aria-label={w("make.theSteps")}>
            <b>{w("make.tickEachStepWhenIt")}</b>
            {/* DT276 step 1 (0.3.127, board Stories205; Coach Milan 10 November 22:37, Go): a step's pictures are the recipe's,
                and every place shows them. Step 2 (0.3.129): a step can have two or more; a new photo is added next to the
                others. A tap on a picture shows it large: make it the first, or take it off the step. */}
            {madeSteps.map((x, k) => { const on = ticks.has(`s${k}`), src = rec?.steps?.length ? rec : plateRecipe?.steps?.length ? plateRecipe : null;
              const kept = stepPicsOf(src, x).map((y) => y.src), mine = stepPhotos[String(k)], list = kept.length ? kept : mine ? [mine] : [];
              const shown = picOpen?.k === k && list.includes(picOpen.src) ? picOpen.src : null;
              const drop = (y: string) => { if (src && kept.includes(y)) setState((st) => ({ ...st, meals: st.meals.map((m) => (m.id === src.id ? { ...m, ...removeStepPic(m, k, y) } : m)) })); if (mine === y) setStepPhotos((o) => { const n = { ...o }; delete n[String(k)]; return n; }); setPicOpen(null); };
              return (
              <PhotoPick key={k} onFile={(f) => stepPhotoFile(k, f)}>{({ toggle, open }) => <div className="mk-step">
              {/* DT281 (0.3.131, board Stories208; Coach Milan 11 November 17:27): the tick at the top left; to its right, first the
                  step's photos and + Photo, then the words. + Photo sits there on every step, with photos or without. */}
              <div className="mk-pics">
                {list.map((y, n) => <button key={n} type="button" className={`mk-pic${shown === y ? " on" : ""}`} aria-expanded={shown === y} aria-label={w("make.stepPhotoN", { k: n + 1, n: k + 1 })} onClick={() => setPicOpen(shown === y ? null : { k, src: y })}><img src={y} alt="" /></button>)}
                <button type="button" className="mk-photo empty" aria-expanded={open} onClick={toggle} aria-label={w("make.addStepPhoto", { n: k + 1 })}><b>＋</b><span>{w("make.photo")}</span></button>
              </div>
              <div className="mk-row">
                <button type="button" className={`mk-check ${on ? "on" : ""}`} aria-pressed={on} onClick={() => tick(k)}>
                  <span className="mk-box">{on ? "✓" : ""}</span><span>{stepParts(tempsIn(x), stepItems).map((pt, j) => ("text" in pt ? pt.text : <b key={j} className="st-amt">{pt.label}</b>))}</span>
                </button>
              </div>
              {shown && <div className="mk-pic-open">
                <img src={shown} alt={w("make.stepPhotoN", { k: list.indexOf(shown) + 1, n: k + 1 })} />
                <div className="button-row">
                  {src && kept.indexOf(shown) > 0 && <button type="button" className="pill pill-small" onClick={() => { setState((st) => ({ ...st, meals: st.meals.map((m) => (m.id === src.id ? { ...m, ...firstStepPic(m, k, shown) } : m)) })); setPicOpen(null); }}>{w("make.makeItFirst")}</button>}
                  <button type="button" className="pill pill-small" onClick={() => drop(shown)}>{w("make.removeFromStep")}</button>
                  <button type="button" className="pill pill-small" onClick={() => setPicOpen(null)}>{w("make.closePhoto")}</button>
                </div>
                {src && kept.length > 1 && <small className="muted">{w("make.firstPhotoWhy")}</small>}
              </div>}
              </div>}</PhotoPick>); })}
          </section>
        )}
        {/* DT211 v8: The meal, the final look: one photo when it is on the plate; Eat shows it */}
        <div className="mk-final">
          <p className="label">{w("make.theMealTheFinalLook")}</p>
          <small className="muted">{w("make.onePhotoWhenItIs")}</small>
          <PhotoPick onFile={(file) => { const r = new FileReader(); r.onload = () => thumbnailBase64(String(r.result), 480).then(setPlate).catch(() => {}); r.readAsDataURL(file); }}>{({ toggle, open }) => (
          <button type="button" className="plate-photo" aria-expanded={open} onClick={toggle}>
            {plate ? <img src={plate} alt={w("make.yourMeal")} /> : <span>{w("make.addAPhotoOfThe")}</span>}
          </button>)}</PhotoPick>
        </div>
        {/* DT211 v8: How did the cooking go?, Chef Mealan's line */}
        <div className="cook-q">
          <ChefLine text={say("howCooking")} />
          <div className="reasons">
            {/* DT90 (0.2.87): a plate that is no recipe was made by its steps */}
            <button className={`choice ${went === "as" ? "on" : ""}`} onClick={() => setWent("as")}>{rec ? w("make.allAsTheRecipeSays") : w("make.asTheStepsSay")}</button>
            <button className={`choice ${went === "not" ? "on" : ""}`} onClick={() => setWent("not")}>{rec ? w("make.notAsTheRecipeSays") : w("make.notAsTheStepsSay")}</button>
          </div>
          {went === "not" && <textarea placeholder={w("make.whatWasDifferent")} value={different} onChange={(e) => setDifferent(e.target.value)} />}
          {went === "not" && <button className="pill pill-small pill-action" onClick={() => p.openOut()}>{w("make.helpMeWithMakingIt")}</button>}
        </div>
        <div className="next-step">
          <button className="pill pill-primary pill-wide" onClick={() => { log("made", { went, photos: Object.keys(stepPhotos).length + (plate ? 1 : 0) }); setStep("after"); }}>{w("make.cookedNextEat")}</button>
          <small className="muted">{w("make.howMuchYouAteAnd")}</small>
        </div>
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
  // DT90 (0.2.87, Milan 11:37: named with Yeast, it was gone and the last step showed fritters): a dish from another recipe
  // stays that recipe only while its name is that recipe's; a name you typed makes it a recipe of its own, adapted from it
  const ownName = title.trim() || (state.title && state.title !== "DaaM" ? state.title : "");
  const dishRec = dishOnly ? state.meals.find((m) => m.id === dishOnly) : undefined;
  const origin = way?.kind === "change" ? undefined : fromRec ?? (dishRec && (!ownName || ownName === dishRec.title) ? dishRec : undefined) ?? state.meals.find((m) => (p.filling?.mealId === m.id || m.title === plateName) && sameAs(m) && (!title.trim() || title.trim() === m.title));
  const adaptedFrom = !origin && dishRec ? { basedOn: { id: dishRec.id, title: dishRec.title } } : {};
  const tryCtx = way && fromRec ? { kind: way.kind, what: wayWhat(way) } : null;
  // a dish changed on the plate, with the whole recipe as changed (0.2.23, IM23b)
  const chgW = way && way.kind === "change" && way.whole && fromRec ? way : null;
  const changedFrom = !origin && !chgW ? changedBase(items) : null;
  const suggestedName = changedFrom ? newNameFor(changedFrom.title, changedFrom.items, items, state.meals.map((m) => m.title)) : "";
  // DT211 v8 (0.3.53): how much you ate is asked on Eat now. Later today keeps the cook open and its card waits on Today;
  // Not after all closes it
  const cookMeal = () => ({ id: uid(), title: p.state.title || autoTitle(items), items: structuredClone(items), portion: items.reduce((n, i) => n + i.grams, 0), savedAt: new Date().toISOString() });
  const cookPhotos = [...Object.keys(stepPhotos).map(Number).sort((x, y) => x - y).map((k) => ({ k, src: stepPhotos[String(k)] })), ...(plate ? [{ k: null as number | null, src: plate }] : [])];
  const eatLater = ate === "later" || ate === "not";
  // DT308.11 (0.3.157, board Stories243): Prepare it with no meal set. The meal is asked on Eat, at Save: the moment the app
  // writes into your day. The same calendar opens under Save, on today, with the guess from the clock marked. With a meal
  // set beforehand nothing is asked.
  const eatCal = endCal && step === "after" ? plateCal({ mode: "ate", day: todayKey, setDay: () => {}, only: todayKey, more: false, setMore: () => {}, now: new Date(), today: todayKey, infoOf: calInfo,
    marked: (() => { const info = calInfo(todayKey), id = calGuess(info.slots, info.eaten, new Date()); return id === undefined ? null : { date: todayKey, id }; })(),
    title: w("cal.whichByClock", { time: hhmm(new Date()) }),
    onPick: (_d, r) => { const sl = r.id ? daySlots.find((x) => x.id === r.id) ?? null : null; eatSlot.current = { slot: sl ? { date: todayKey, slotId: sl.id, name: sl.name, time: sl.time } : null }; setEndCal(null); saveEat(); } }) : null;
  // B154: Save on Eat for a cook whose plate the pencil already logged. Eaten (all of it, or a portion): the cook is written
  // into that meal, so it is one record at the meal's time. Later today or Not after all: it was not eaten, so the plate
  // comes out of the meal first, and the cook is kept as any cook is.
  const liveSave = () => {
    const card = p.recordNow?.live ? state.feedback.find((f) => f.id === p.recordNow!.cardId && f.status === "eaten") : undefined;
    if (!card) { saveEat(); return; }
    if (eatLater) { const id = card.id; setState((s0) => ({ ...deleteCardIn(s0, id), recorded: undefined })); saveEat(); return; }
    saveEat(false, card);
  };
  const saveEat = (bigOk = false, same?: "both" | Feedback) => {
    if (eatLater) {
      log("made", { went, ate, photos: cookPhotos.length });
      p.keepForLater({ ...cookMeal() }, { photos: cookPhotos.map((x) => x.src), prep: { went, different: different || undefined }, status: ate === "later" ? "prepared" : "not-used" });
      if (ate === "later") p.cookLater(); else p.endCook();
      resetMade(); setPlate(""); setTicks(new Set()); setStep("in");
      return;
    }
    if (unset && good !== "no" && !eatSlot.current) { setEndCal({ kind: "ate", day: todayKey, more: false }); return; }
    // the meal tapped in the calendar, read now: the card is built later, when the state is written
    const eatAt = eatSlot.current;
    if (!bigOk && ate === "all" && (eatenKcal > BIG_MEAL || (dayKcal !== null && eatenKcal > dayKcal))) { setBigAsk(true); return; }
    // DT285 (0.3.139): a photo of this cook already a meal of the same day: Update that meal, or Keep both
    if (!same && good !== "no") {
      const earlier = samePhotoMeal(state.feedback, [...photos, ...cookPhotos.map((x) => x.src)], new Date().toISOString());
      if (earlier) { p.askSamePhoto({ earlier, update: () => saveEat(true, earlier), both: () => saveEat(true, "both") }); return; }
    }
    const into = same && same !== "both" ? same : null;
    log("made", { went, ate, photos: cookPhotos.length });
        const name = changedFrom && recipeChoice === "new" ? (((newRecipeName ?? suggestedName).trim() && (newRecipeName ?? suggestedName).trim().toLowerCase() !== changedFrom.title.toLowerCase()) ? (newRecipeName ?? suggestedName).trim() : suggestedName) : title.trim() || plateName;
        const src = way?.kind === "change" && fromRec?.source ? { source: { name: fromRec.source.name, ...(fromRec.source.url ? { url: fromRec.source.url } : {}), from: fromRec.source.from, at: fromRec.source.at } } : {};
        // DT89 and DT90 (0.2.87): the steps from How to make it, Chef Mealan's kitchen, and who made it go with the recipe
        // 02:11: a bowl way chosen at Lock (All in one, Topped, Protein first) is the recipe's process too; it was lost at Save
        const wayNow = method ? methodsFor(items).find((w) => w.id === method) : undefined;
        const ps = cooksPlate(items) && heldSteps?.steps.length ? { steps: heldSteps.steps, stepsFor: foodNames(items), ...(heldSteps.moves ? { moves: heldSteps.moves } : {}) } : wayNow ? { steps: wayNow.steps, stepsFor: foodNames(items), way: wayNow.name } : {};
        const chefMade = madeBy ? { ...(state.cooking?.length ? { cooking: state.cooking } : {}), kitchen: madeBy.kitchen, byChef: { kitchen: madeBy.kitchen, meal: mealWord, around: aroundSaved(madeBy.from.filter((i) => !isDrink(i.food)).map((i) => i.food.name)), at: new Date().toISOString() } } : {};
        const meal: Meal = { id: origin?.id ?? uid(), title: name, items: structuredClone(items), portion: t.weight, savedAt: new Date().toISOString(), kind: p.kind, ...src, ...adaptedFrom, ...ps, ...chefMade };
        // the recipe kept (0.2.19, IM18b): its parts on its foods; optional foods, added or not, in its optional list
        const keptOpt = [...(state.optional ?? []), ...items.filter((i) => i.optional).map(itemToOpt)].map((o) => ({ name: o.name, written: o.written ?? "", ...(o.note ? { note: o.note } : {}), grams: o.grams, food: leanFood(o.food), ...(o.part ? { part: o.part } : {}) }));
        // DT206: a drink stays out of the recipe unless you keep it in; the meal you ate still counts it
        const keptItems = structuredClone(items.filter((i) => !i.optional && (drinkIn || !isDrink(i.food))));
        // a changed dish is kept as the whole recipe it is now (0.2.23, IM23b): the recipe's size, its steps, adapted from the original
        const chgKept: Meal | null = chgW && fromRec ? (() => {
          // the same ids: the drafted steps name the foods by them
          const whole = chgW.whole!.map((i) => ({ ...structuredClone(i), locked: false, dish: undefined, optional: undefined }));
          const n = fromRec.makes?.n ?? 1, d = chgW.drafted;
          const src = fromRec.source ? { source: { name: fromRec.source.name, ...(fromRec.source.url ? { url: fromRec.source.url } : {}), from: fromRec.source.from, at: fromRec.source.at, ...(fromRec.source.steps?.length ? { steps: fromRec.source.steps } : {}), foods: originalFoodsOf(fromRec, state.meals) ?? foodNames(fromRec.items) } } : {};
          return { id: meal.id, title: name, items: whole, portion: Math.round(whole.reduce((k, i) => k + i.grams, 0) / n), savedAt: meal.savedAt, kind: p.kind, ...src, basedOn: { id: fromRec.id, title: fromRec.title },
            ...(fromRec.makes ? { makes: fromRec.makes } : {}), ...(fromRec.optional?.length ? { optional: fromRec.optional } : {}),
            steps: d?.steps ?? [], ...(d?.steps?.length ? { stepsFor: foodNames(whole) } : {}), ...(d?.marks ? { stepMarks: d.marks } : {}), ...(d?.moves ? { moves: d.moves } : {}), ...(d?.kitchen ? { stepsKitchen: d.kitchen } : {}), ...(d?.parts ? { stepParts: d.parts } : {}) };
        })() : null;
        // R25: the card counts what was eaten, a number of the recipe's pieces; the recipe is kept whole
        // the portion is the sum of the very grams kept, never a hair above them: a stored meal heavier than its foods is not read back
        // DT81: a batch from scratch: you ate one of what it makes now; the rest goes on Plan
        const scratchN = !chgW && !fromRec && saveRecipe && ate === "portion" ? Math.round(Number(makesShown) || 0) : 0;
        const eatenItems = wholeN > 1 && eatN < wholeN ? meal.items.map((i) => ({ ...i, grams: (i.grams * eatN) / wholeN })) : scratchN >= 2 && scratchN <= 100 ? meal.items.map((i) => ({ ...i, grams: i.grams / scratchN })) : null;
        const eatenMeal: Meal = eatenItems ? { ...meal, items: eatenItems, portion: eatenItems.reduce((n, i) => n + i.grams, 0) } : meal;
        // DT81: a recipe from scratch keeps what it made, when said: It makes 10 sarmas
        const mk = Math.round(Number(makesShown) || 0), mkTyped = newMakesUnit.trim().toLowerCase() || "portions";
        const newMakes = !chgKept && !fromRec && mk >= 2 && mk <= 100 ? { n: mk, unit: /s$/.test(mkTyped) ? mkTyped : `${mkTyped}s` } : null;
        const keptWeight = keptItems.reduce((n, i) => n + i.grams, 0);
        const kept: Meal = chgKept ?? { ...meal, items: keptItems, portion: newMakes ? Math.round(keptWeight / newMakes.n) : keptWeight, ...(newMakes ? { makes: newMakes } : {}), ...(keptOpt.length ? { optional: keptOpt } : {}) };
        const triedNow = tryCtx && tried ? { kind: tryCtx.kind, what: tryCtx.what, result: tried } : undefined;
        const status = good === "no" ? "not-used" : "eaten";
        const taste = TASTE[good!];
        log("feedback", { status, taste, shared: sharing ? shareWhy : null });
        setFeedback({ status, taste, notes: note });
        const shared = sharing && shareWhy ? { reason: shareWhy, at: new Date().toISOString() } : undefined;
        const allPhotos = [...photos, ...cookPhotos.map((x) => x.src)];
        const photoSteps = [...photos.map(() => null), ...cookPhotos.map((x) => x.k)];
        const cardId = into ? into.id : uid();
        const placeCard = (c: Feedback, list: Feedback[]) => (into ? list.map((f) => (f.id === into.id ? updateWith(f, c) : f)) : [c, ...list]);
        const coverNow = status === "eaten" && allPhotos.length ? allPhotos[allPhotos.length - 1] : null;
        // a plate that is a recipe as it stands (0.2.3): the card points at that recipe, no second copy
        const keep = changedFrom ? recipeChoice === "new" && status === "eaten" : !origin && saveRecipe && status === "eaten";
        const updateBase = changedFrom && recipeChoice === "update" && status === "eaten" ? changedFrom : null;
        if (triedNow) log("recipe_fit", { way: triedNow.kind, result: triedNow.result });
        // R16 (0.2.44, Milan 21:56, board RS15): the rest of a whole recipe made is not followed: it may go to the family or to
        // work. The recipe goes on Plan for the days you eat it; Today shows it there, and I ate it logs it with its recipe.
        // where you land (0.2.23, IM23c): the recipe the meal made or changed, a recipe made for the first time, or steps drafted now
        const firstTime = !!fromRec && !state.feedback.some((f) => f.status === "eaten" && (f.recipeId === fromRec.id || f.meal?.id === fromRec.id));
        // RP4 (0.2.25, Milan 17:42): every recipe you make ends on its page; a plate that is no recipe ends on Today
        const landId = keep ? kept.id : (fromRec ?? origin ?? updateBase ?? null)?.id ?? null;
        const leftN = wholeN > 1 ? wholeN - eatN : madeWhole && rec?.makes ? Math.max(0, leftK) : 0;
        const landLine = status !== "eaten" ? "" : [w("make.youAte", { what: wholeN > 1 && rec ? (eatN === wholeN ? w("make.allNLow", { n: wholeN }) : countUnit(eatN, rec)) : rec && pmode === "recipe" && !way ? w("make.oneUnit", { one: oneOf(rec) }) : w("make.yourPlate") }), leftN > 0 ? wn("make.leftToEat", leftN, { count: sizedPlate ? leftWords(leftN) : countUnit(leftN, rec) }) : "", chgKept && fromRec ? w("make.originalStays", { title: fromRec.title }) : ""].filter(Boolean).join(" ");
        setState((s) => ({ ...s, fromRecipe: undefined, recipeFoods: undefined, optional: undefined, leftOut: undefined, emptyParts: undefined, cooking: undefined, cookingFor: undefined, meals: (keep ? [structuredClone(kept), ...s.meals] : s.meals).map((m) => (updateBase && m.id === updateBase.id ? { ...m, items: structuredClone(keptItems), portion: keptWeight } : m)).map((m) => (triedNow && fromRec && m.id === fromRec.id ? { ...m, tried: [...(m.tried ?? []).filter((x) => !(x.kind === triedNow.kind && x.what === triedNow.what)), { ...triedNow, at: new Date().toISOString() }] } : m)).map((m) => (m.idea && status === "eaten" && (m.id === origin?.id || m.id === fromRec?.id || m.id === landId) ? { ...m, idea: undefined } : m))
          // DT85 (Milan 23 October 20:58 and 24 October 09:44): the photo taken while making it is the cover of a recipe with no
          // photo of its own yet (no cover, or one Chef Mealan drew); a drawn picture stays behind it. A cover of your own stays.
          .map((m) => (coverNow && m.id === landId && !ownPhotosOf(m).length ? { ...m, ...withRecipePhotos([coverNow, ...recipePhotosOf(m).filter((x) => x !== coverNow)].slice(0, 6)) } : m)), feedback: placeCard({ id: cardId, meal: structuredClone(eatenMeal), status, taste, notes: note, ...(triedNow ? { tried: triedNow } : {}), photo: allPhotos[allPhotos.length - 1] || undefined, photos: allPhotos.length ? allPhotos : undefined, ...(cookPhotos.length ? { photoSteps } : {}), ...(coverNow && landId && !ownPhotosOf(s.meals.find((m) => m.id === landId) ?? {}).length ? { coverAsk: "used" as const } : {}), prep: { went, different: different || undefined }, ate: ate === "portion" ? "portion" : "all", recipeId: keep || origin ? meal.id : undefined, shared, moment: p.moment, dayType: p.personal.dayMode === "follow" ? p.dayType : undefined, slot: eatAt ? eatAt.slot ?? undefined : p.filling?.mode === "eat" ? { date: p.filling.date, slotId: p.filling.slotId, name: p.filling.name, time: p.filling.time } : pickSlot ? { date: todayKey, slotId: pickSlot.id, name: pickSlot.name, time: pickSlot.time } : undefined, ...(p.filling?.mode !== "eat" && !pickSlot && mealSlot ? { which: capName(mealSlot.name) } : {}), createdAt: new Date().toISOString() } as Feedback, s.feedback), items: [], portion: null, title: "" }));
        // DT81: the batch just made, counted: Plan's pieces of it are its share; or it always makes this many, the recipe's number
        if (status === "eaten" && wholeN > 1 && rec?.makes) {
          const made = wholeN, cooked = cookCount, recId = rec.id;
          setState((s) => ({ ...s, meals: s.meals.map((m) => m.id !== recId ? m
            : keepMade ? { ...m, makes: { ...m.makes!, n: made }, portion: Math.round(m.items.reduce((k, i) => k + i.grams, 0) / made), batch: undefined, cook: undefined }
            : { ...m, batch: { cooked, made, at: new Date().toISOString() }, cook: undefined }) }));
        }
        // DT214 v2: the cook waits for its last question, How did it carry you; not eaten after all, it closes
        if (status === "eaten") p.cookEaten(cardId); else p.endCook();
        if (p.filling) p.setFilling(null);
        setWay(null); setTried(null);
        setMakeAll(null); setTicks(new Set()); setCooking(false); setMkDraft(""); setMkDrafted(false);
        setMadeBy(null); setPlateSteps(null); setPlateDraft(""); setOwnSteps(null);
        if (landId) p.landOnRecipe(landId, landLine, keep ? w("make.savedInMine") : w("make.madeToday"));
        else setTab("home");
        setRecipeChoice(null); setNewRecipeName(null); eatSlot.current = null; setEndCal(null);
        p.setKind("meal"); p.setPick(null); setGood(null); setNote(""); setTitle(""); setPlate(""); setStepPhotos({}); setTouched(new Set()); setSuggest(null); setSharing(false); setShareWhy(null); resetMade(); setStep("in");
  };
  return (
    <>
      {Head({ back: "made", title: w("make.eatHowWasIt"), sub: w("make.howMuchYouAteAnd2") })}
      {/* DT211 v8 (0.3.53, board Stories158): the final photo comes along from Make; Chef Mealan asks, in his lines */}
      {plate && <div className="eat-final"><img src={plate} alt={w("make.yourMeal")} /><small className="muted">{w("make.yourMealFromMake")}</small></div>}
      <div className="cook-q">
        <ChefLine text={say("howMuchAte")} />
      {/* R25 (0.2.53, board RS25): a whole recipe that makes several is counted, starting on one, never logged whole by
          accident; the rest is said, not followed (R16) */}
      {wholeN > 1 && rec ? <>
        {/* DT81: count what the batch really made; one of them is then that share of what was cooked */}
        <div className="eat-count made-count" role="group" aria-label={w("make.howManyItMade")}>
          <small className="muted">{w("make.countedThemItMade")}</small>
          <button type="button" className="pill pill-small" aria-label={w("make.itMadeOneLess")} disabled={wholeN <= 2} onClick={() => { setMadeN(wholeN - 1); setEatN((k) => Math.min(k, wholeN - 1)); }}>−</button>
          <b aria-live="polite">{wholeN}</b><span>{unitOf(rec)}</span>
          <button type="button" className="pill pill-small" aria-label={w("make.itMadeOneMore")} onClick={() => setMadeN(wholeN + 1)}>+</button>
        </div>
        {wholeN !== cookCount && cookCount === rec.makes!.n && <button type="button" className={`choice ${keepMade ? "on" : ""}`} aria-pressed={keepMade} onClick={() => setKeepMade(!keepMade)}>{w("make.alwaysMakes", { n: wholeN })}</button>}
        <ChefLine text={say("howManyAte", countUnit(wholeN, rec))} />
        <div className="eat-count" role="group" aria-label={w("make.howManyDidYouEat")}>
          <button type="button" className="pill pill-small" aria-label={w("make.oneLess")} disabled={ate !== "all" || eatN <= 1} onClick={() => { setEatN((k) => Math.max(1, k - 1)); setBigAsk(false); }}>−</button>
          <b aria-live="polite">{ate === "all" ? eatN : 0}</b><span>{ate === "all" && eatN === 1 ? oneOf(rec) : unitOf(rec)}</span>
          <button type="button" className="pill pill-small" aria-label={w("make.oneMore")} disabled={ate !== "all" || eatN >= wholeN} onClick={() => { setEatN((k) => Math.min(wholeN, k + 1)); setBigAsk(false); }}>+</button>
          {ate === "all" && <small className="muted">{w("plate.kcalPd", { kcal: fmt(perOne * eatN, 0), pd: pdText(density(aggregate(items).protein, aggregate(items).calories)) })}</small>}
        </div>
        {ate === "all" && wholeN - eatN > 0 && <small className="eat-left">{wn("make.leftToEat", wholeN - eatN, { count: countUnit(wholeN - eatN, rec) })}</small>}
        <div className="reasons">
          <button className={`choice ${ate === "all" && eatN === wholeN ? "on" : ""}`} onClick={() => { setAte("all"); setEatN(wholeN); setBigAsk(false); }}>{w("make.allN", { n: wholeN })}</button>
          {([["later", w("make.laterToday")], ["not", w("make.notAfterAll")]] as const).map(([k, l]) => (
            <button key={k} className={`choice ${ate === k ? "on" : ""}`} onClick={() => { setAte(ate === k ? "all" : k); setBigAsk(false); }}>{l}</button>
          ))}
        </div>
      </> : <>
        <div className="reasons">
          {/* B138 (0.3.140; Coach Milan 12 November 13:58, Go 14:00): A portion is a line, so it speaks the app's language */}
          {([["all", w("make.allOfIt")], ["portion", w("make.aPortion")], ["later", w("make.laterToday")], ["not", w("make.notAfterAll")]] as const).map(([k, l]) => (
            <button key={k} className={`choice ${ate === k ? "on" : ""}`} onClick={() => { setAte(k); setBigAsk(false); }}>{l}</button>
          ))}
        </div>
      </>}
      {/* R25: a meal over 2,000 kcal, or over the whole day, is asked once; nothing is blocked */}
      {bigAsk && (
        <section className="card big-ask" role="alertdialog" aria-label={w("make.aBigMeal")}>
          <b>{w("make.kcalInOneMeal", { kcal: fmt(eatenKcal, 0) })}</b>
          <small>{dayKcal && eatenKcal > dayKcal ? w("make.moreThanDay", { kcal: fmt(dayKcal, 0) }) : w("make.thatIsALotFor")} {wholeN > 1 && rec ? w("make.ifYouAteN", { what: eatN === wholeN ? w("make.allNLow", { n: wholeN }) : countUnit(eatN, rec) }) : w("make.ifYouAteAllOf")}</small>
          <div className="button-row">
            <button type="button" className="pill pill-small" onClick={() => { setBigAsk(false); saveEat(true); }}>{wholeN > 1 && eatN === wholeN ? w("make.yesAllN", { n: wholeN }) : w("make.yesIAteIt")}</button>
            <button type="button" className="pill pill-small pill-primary" onClick={() => { setBigAsk(false); if (!(wholeN > 1)) setStep("in"); }}>{wholeN > 1 ? w("make.howManyIAte") : w("make.changeTheAmounts")}</button>
          </div>
        </section>
      )}
      </div>
      {!eatLater && <div className="cook-q">
        <ChefLine text={say("howTaste")} />
        <div className="choices three">
          <button className={`choice ${good === "daam" ? "on" : ""}`} onClick={() => setGood("daam")}><span className="double-thumbs" aria-hidden="true"><ThumbsUp size={22} /><ThumbsUp size={22} /></span><span>{w("make.tasteDaam")}</span></button>
          <button className={`choice ${good === "good" ? "on" : ""}`} onClick={() => setGood("good")}><ThumbsUp size={22} /><span>{w("make.tasteGood")}</span></button>
          <button className={`choice ${good === "no" ? "on" : ""}`} onClick={() => setGood("no")}><ThumbsDown size={24} /><span>{w("make.tasteNo")}</span></button>
        </div>
      </div>}
      {!eatLater && <>
      {tryCtx && (
        <section className="card save-recipe">
          <ChefLine text={say("didTryWork", tryCtx.kind === "change" ? "change" : "side")} />
          <small>{w("make.tryWhat", { what: tryCtx.what })}</small>
          <div className="reasons">
            {([["yes", w("make.itWorked")], ["ok", w("make.itWasOk")], ["no", w("make.itDidnTWork")]] as const).map(([k, l]) => <button key={k} className={`choice ${tried === k ? "on" : ""}`} onClick={() => setTried(k)}>{l}</button>)}
          </div>
        </section>
      )}
      {/* DT94: the name was set in Craft; the field stays only for a plate that has no name yet */}
      {state.title && state.title !== "DaaM" ? <small className="muted fb-name">{w("make.namedInCraft", { title: state.title })}</small> : <label className="field"><span>{w("make.nameIt")}</span><input value={title} placeholder={plateName} onChange={(e) => setTitle(e.target.value)} /></label>}
      {/* DT225 v2 (0.3.61, board Stories166): your words, kept on the recipe, only for you */}
      <div className="eat-words">
        <ChefLine text={say("remember")} />
        <textarea aria-label={w("make.anythingYouWantToRemember")} placeholder={w("make.notePlaceholder")} value={note} onChange={(e) => setNote(e.target.value)} />
        <small className="muted">{w("make.keptOnTheRecipeOnly")}</small>
      </div>
      {changedFrom ? (
        <section className="card save-recipe changed-ask" aria-label={w("make.changedFromYourRecipe")}>
          <div className="card-top"><span>{w("plate.changedFromRecipe", { title: changedFrom.title })}</span></div>
          <small>{recipeDiffLine(changedFrom.items, items)}.</small>
          <div className="reasons">
            <button className={`choice ${recipeChoice === "update" ? "on" : ""}`} aria-pressed={recipeChoice === "update"} onClick={() => setRecipeChoice("update")}>{w("make.updateMyRecipe")}</button>
            <button className={`choice ${recipeChoice === "new" ? "on" : ""}`} aria-pressed={recipeChoice === "new"} onClick={() => setRecipeChoice("new")}>{w("make.saveAsANewRecipe")}</button>
            <button className={`choice ${recipeChoice === "only" || !recipeChoice ? "on" : ""}`} aria-pressed={recipeChoice === "only" || !recipeChoice} onClick={() => setRecipeChoice("only")}>{w("make.onlyThisTime")}</button>
          </div>
          {recipeChoice === "new" && <label className="field"><span>{w("make.itsName")}</span><input value={newRecipeName ?? suggestedName} onChange={(e) => setNewRecipeName(e.target.value)} /></label>}
          <small>{w(recipeChoice === "update" ? "make.changesDaysFollow" : recipeChoice === "new" ? "make.staysAsItWas" : "make.staysCardKeeps", { title: changedFrom.title })}</small>
        </section>
      ) : origin ? <p className="small">{w("make.inMyRecipesAlready", { title: origin.title })}</p> : <section className="card save-recipe">
        <div className="card-top"><span>{chgW ? w("make.saveYourChangedDish") : w("make.saveInMyRecipes")}</span></div>
        {chgW && fromRec
          ? <small>{wx(fromRec.makes ? (fromRec.source?.steps?.length ? "make.changedSaveNOrig" : "make.changedSaveN") : fromRec.source?.steps?.length ? "make.changedSaveOrig" : "make.changedSave", { name: <b>{title.trim() || plateName}</b>, count: fromRec.makes ? countUnit(fromRec.makes.n, fromRec) : "", what: w(chgW.drafted ? "make.stepsForChange" : "make.itsFoodsGrams"), from: `${fromRec.title}${fromRec.source?.name ? `, ${fromRec.source.name}` : ""}` })}</small>
          : <small>{w("make.keepsTheFoodsTheGrams")}</small>}
        <div className="reasons">
          <button className={`choice ${saveRecipe ? "on" : ""}`} onClick={() => setSaveRecipe(true)}>{w("make.yesSaveIt")}</button>
          <button className={`choice ${!saveRecipe ? "on" : ""}`} onClick={() => setSaveRecipe(false)}>{w("make.notThisOne")}</button>
        </div>
        {/* DT206 (0.3.48): a drink on the plate is asked about before it goes into the recipe */}
        {saveRecipe && !chgW && items.some((i) => isDrink(i.food)) && (() => { const d = items.filter((i) => isDrink(i.food)).map((i) => i.food.name).reduce((a, b) => (a ? w("gates.and", { a, b }) : b), ""); return (
          <div className="rq-drink" role="group" aria-label={w("make.theDrinkAndTheRecipe")}>
            <small>{w("make.isADrink", { drink: d })}</small>
            <div className="reasons">
              <button type="button" className={`choice ${!drinkIn ? "on" : ""}`} aria-pressed={!drinkIn} onClick={() => setDrinkIn(false)}>{w("make.leaveItOut")}</button>
              <button type="button" className={`choice ${drinkIn ? "on" : ""}`} aria-pressed={drinkIn} onClick={() => setDrinkIn(true)}>{w("make.keepItIn")}</button>
            </div>
          </div>); })()}
        {/* DT81 (Milan 23 October 15:53 and 15:55): a recipe made from scratch gets its number here. The Plate compares its
            foods with one of your meals: about one meal says nothing and stays one plate; clearly more asks, with its guess */}
        {saveRecipe && !chgW && !fromRec && (plateBig || makesOpen || ate === "portion" ? (
          <div className="rq-makes" role="group" aria-label={w("make.whatItMakes")}>
            {(ate === "portion" || plateBig) && <small className="rq-makes-ask">{ate === "portion" ? (plateBig ? w("make.atePortionMeals", { n: plateMeals }) : w("make.atePortion")) : w("make.aboutMeals", { n: plateMeals })} {w("make.howManyMakes")}</small>}
            <small>{w("make.itMakes")}</small>
            <input inputMode="numeric" aria-label={w("make.howManyItMakes")} placeholder="10" value={makesShown} onChange={(e) => setNewMakesN(e.target.value.replace(/[^\d]/g, "").slice(0, 3))} />
            <input aria-label={w("make.ofWhat")} placeholder={w("plate.portionsWord")} value={newMakesUnit} maxLength={24} onChange={(e) => setNewMakesUnit(e.target.value)} />
            {(ate === "portion" || plateBig) && <button type="button" className={`choice ${makesShown === "" ? "on" : ""}`} aria-pressed={makesShown === ""} onClick={() => setNewMakesN("")}>{w("make.onePlate")}</button>}
            <small className="muted">{w("make.planThenCountsItIn")}</small>
          </div>
        ) : <button type="button" className="link rq-makes-open" onClick={() => setMakesOpen(true)}>{w("make.itMakesMoreThanOne")}</button>)}
      </section>}
      {sharing && p.profile.coachId && (
        <div className="reasons">
          {([["look", w("make.lookAtThis")], ["ok", w("make.wasThisOk")], ["help", w("make.helpMeNextTime")]] as const).map(([k, l]) => (
            <button key={k} className={`choice ${shareWhy === k ? "on" : ""}`} onClick={() => setShareWhy(k)}>{l}</button>
          ))}
        </div>
      )}
      </>}
      {p.sameAsk && <SamePhotoAsk ask={p.sameAsk} answer={p.answerSameAsk} />}
      {!bigAsk && !p.sameAsk && <button className={`pill pill-primary pill-wide eat-save${eatCal ? " is-asking" : ""}`} disabled={!eatLater && (good === null || (sharing && !shareWhy))} onClick={() => { if (eatCal) { setEndCal(null); return; } liveSave(); }}>{sharing && !eatLater ? w("make.saveShare", { coach: p.coachLabel }) : w("make.save")}</button>}
      {!bigAsk && !p.sameAsk && eatCal && <div className="eat-cal">{eatCal}</div>}

      {p.profile.coachId && !sharing && <button className="pill pill-wide" onClick={() => setSharing(true)}>{w("make.shareWith", { coach: p.coachLabel })}</button>}
      {sharing && <button className="link" onClick={() => { setSharing(false); setShareWhy(null); }}>{w("make.keepItPrivate")}</button>}
    </>
  );
}

// DT212 v4 (0.3.53, board Stories159): a plate or a cook saved for later. Continue puts it back; swipe it left and Remove shows
function LaterRow({ x, onContinue, onRemove }: { x: Later; onContinue: () => void; onRemove: () => void }) {
  const r = laterRow(x);
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState(false);
  const from = useRef<number | null>(null);
  const at = new Date(x.kind === "cook" ? x.cook!.startedAt : x.plate?.plateAt ?? x.plate?.photo?.at ?? x.at);
  const sub = x.kind === "cook" ? w("make.cookingWhen", { when: whenWords(at) }) : wn("make.whenFoods", r.foods, { when: whenWords(at) });
  return (
    <div className="later-row" onPointerDown={(e) => { from.current = e.clientX; }} onPointerUp={(e) => { if (from.current === null) return; const dx = e.clientX - from.current; from.current = null; if (dx < -40) setOpen(true); else if (dx > 40) setOpen(false); }}>
      {open && <div className="lr-remove"><button type="button" className="pill" onClick={onRemove}>{w("make.remove")}</button></div>}
      <div className="lr-front" style={{ transform: open ? "translateX(-104px)" : undefined }}>
        {r.photo ? <img src={r.photo} alt="" /> : null}
        <span className="lr-words">{r.title}<br /><small className="muted">{sub}</small></span>
        {/* DT227 (0.3.61, board Stories167): Remove in sight: a ✕, then Tap again to remove or Keep */}
        {armed
          ? <><button type="button" className="pill lr-arm" onClick={onRemove}>{w("make.tapAgainToRemove")}</button><button type="button" className="link lr-keep" onClick={() => setArmed(false)}>{w("make.keep")}</button></>
          : <><button type="button" className="pill" onClick={onContinue}>{w("make.continue")}</button><button type="button" className="lr-x" aria-label={w("make.removeTitle", { title: r.title })} onClick={() => setArmed(true)}>✕</button></>}
      </div>
    </div>
  );
}
