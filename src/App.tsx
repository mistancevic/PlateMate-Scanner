import { servingsOf } from "./pilot";
import { wholeOnPlate } from "./counted";
import { packLine } from "./canned";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, useMemo } from "react";
import { optAt } from "./parts";
import {
  Camera,
  Plus,
  ChefHat, BookOpen,
  Utensils,
  SlidersHorizontal,
  LockKeyhole,
  Unlock,
  Trash2,
  Download,
  Upload,
  Check,
  X,
  Sparkles,
  ArrowRight,
  ScanBarcode,
  Leaf,
} from "lucide-react";
import { CameraView } from "./components/CameraView";
import { resizeImageBase64, thumbnailBase64 } from "./utils/image";
import { findMatch, mergeFoods, repoint } from "./dedupe";
import { KNOWN, knownOf, displayRows, sortEuropean, tidy, withPackLines, rowsFromRaw, type LabelRow, type Unit } from "./labeltable";
import { iconFor } from "./icons";
import type { ScannerMode } from "./types";
import { fmt, fixed, pdText, pdVal, pdTag, pdRange, setPdUnit } from "./ui";
import { setUnits } from "./units";
import { WhereSheet } from "./components/WhereSheet";
import { Mark, APP_NAME, COACH_NAME } from "./components/Mark";
import { flush as flushMetrics, autoFlush } from "./metrics";
import { log, isCoach, setCoach, getClientName, setClientName as storeClientName } from "./log";
import { MealScreen } from "./screens/MealScreen";
import { ChefScreen } from "./screens/ChefScreen";
import { FoodsScreen } from "./screens/FoodsScreen";
import { RecipesScreen } from "./screens/RecipesScreen";
import { PlanScreen } from "./screens/PlanScreen";
import type { AppApi, Tab, Step, MenuSection } from "./screens/api";
import { HomeScreen } from "./screens/HomeScreen";
import { GoalScreen } from "./screens/GoalScreen";
import { OutScreen, type Turn } from "./screens/OutScreen";
import { LandingScreen } from "./screens/LandingScreen";
import { Starting } from "./components/Starting";
import { Welcome, AdultOnly } from "./components/Welcome";
import { openStats } from "./openStats";
import { merge as mergeRecords, changes as recordChanges, type Known } from "./records";
import { recipeSig } from "./carry";
import { bothPartOf, dishTaste, presetOf } from "./dishTaste";
import { installBack, pushTab, startTab, tabOfPath, useBack, pathOfTab, MENU_PATH, menuTrailOf, recipeIdOfPath } from "./back";
import { clearKept } from "./kept";
import { RecipePage, RecipesPage, type MemberTools } from "./screens/RecipePages";
import { photosOf, withPhotos, withoutStored, sig, fileOf, keyOf, isPreview, isOrphan, storeOk, storeAll, storePut, storeDel, storeClear, photosWanted, realPhotosOf, isDrawn, recipePhotosOf, withRecipePhotos, recipeHasPhotos } from "./photos";
import { needsCover, cardHasPhoto } from "./covers";
import { itemsOf as itemsOfShared, type SharedRecipe } from "./members";
import { LegalScreen, legalPageFromPath } from "./screens/LegalScreen";
import { BuiltScreen } from "./screens/BuiltScreen";
import { BookScreen } from "./screens/BookScreen";
import { bookOfPath } from "./bookPages";
import { PilotGate } from "./screens/PilotGate";
import { takeCodeFromUrl } from "./pendingCode";
takeCodeFromUrl();  // SH73: chefmealan.com/?code=AB12CD from a coach's QR code
import { cloudEnabled, watchUser, loadCloud, saveCloud, signOutCloud, confirmClientAi, askReview, closeReview, answerReview, type NumbersReview, type ReviewFinding, clearClientAi, exportAccount, explainCloudError, stripPhotos, isEmptyState, joinCoach, leaveCoach, loadPhotos, uploadPhoto, deletePhotoFile, listPhotoFiles, downloadPhoto, markPhotosMoved, dropOldPhotoCopies, pauseAccountWrites, saveOwnNotes, saveCards, loadRecords, saveRecords, markRecordsMoved, loadCards, listClients, loadInbox, clearInboxItem, type CloudUser, type InboxItem } from "./cloud";
import { getGoal, clearGoal, saveGoal, bandOf, goalLabel, goalsForBand, fit as fitPd, getGoalLog, setGoalLog, type GoalEntry, type GoalSource } from "./goal";
import { setTodayChange, dayOfLoad, ymd, planLine as planLineOf, type PlanDay } from "./plan";
import { slotsOf, slotsOn } from "./slots";
import { dayLog } from "./today";
import { dayLineOf, type DayLine } from "./dayLines";
import { measure, startOf, daysFromLines, type Measured } from "./measured";
import { weighInsOff } from "./weight";
import { fixedOf } from "./components/FormulaCard";
import { coachDemoOn } from "./coachDemo";
import { getCoachLocal, setCoachLocal, notesOf, checkinOf, type CoachLocal, type CoachNote } from "./coachNotes";
import { getPlanned, refreshPlanned, storePlanned, withPlanned, plannedPortion, type Planned, type PlannedMeal } from "./planned";
import type { Filling } from "./screens/api";
import { getPersonal, setPersonal as storePersonal, calculate, canCalculate, getDay, withDated, DAY_TYPES, macroSplit, dayModeOf, ownDayNumbers, dayName as dayNameOf, withTarget, lifestyleOf, dayFor, type Personal, type DayType, type Day, type NextGoal } from "./personal";
import { MenuScreen } from "./screens/MenuScreen";
import { ClientsScreen } from "./screens/ClientsScreen";
import { STARTER_FOODS, STARTER_REGION } from "./starter";
import { mixTip, mixLabel, catOf, plateOk, type Mix, type MixTip } from "./mixtip";
import { findReference, referenceFood, localName, otherNames, marketFoods } from "./reference";
import { jobOf, PORTION, minPortionOf, todayLine } from "./foodjob";
import { playbookFor } from "./playbook";
import { fitnessFor, SOURCES, dayName } from "./fitness";
import { getSafety, setSafety as storeSafety, aiState, addFlag, goalSignals, allergyHits, recordDeclaration, FIXED, EMPTY_SAFETY, type Safety, type SituationId } from "./safety";
import { momentTarget, momentOf, momentKcalShare, getUsual, setUsual, getRegion, setRegion, getTravelTo, setTravelTo, REGIONS, type MomentId, type RhythmId, type RegionId } from "./moments";
import { JourneyScreen } from "./screens/JourneyScreen";
import { MeScreen } from "./screens/MeScreen";
import { Home, CircleUser, Menu, Users, MessageCircle, Globe, CalendarDays } from "lucide-react";
import {
  aggregate,
  candidateFood,
  category,
  contribution,
  density,
  DENSITIES,
  EMPTY,
  Feedback,
  Food,
  freshState,
  Goals,
  Ingredient,
  KEYS,
  LABELS,
  MACROS,
  Meal,
  numberInput,
  servingOf,
  servingsFor,
  snapToServing,

  lessThanFromNotes,
  parseState,
  PilotState,
  portionTotals,
  solveIngredient,
  symbol,
  uid,
  validateFood,
  type PlateKind,
  asDish,
  portionsIn,
} from "./pilot";
const STORE = "platemate-pilot-v1";

let unreadableBackup: string | null = null;
// a request that does not answer in time ends with "timeout" instead of waiting forever
const withTimeout = <T,>(p: Promise<T>, ms: number) => new Promise<T>((res, rej) => { const t = setTimeout(() => rej(new Error("timeout")), ms); p.then((v) => { clearTimeout(t); res(v); }, (e) => { clearTimeout(t); rej(e); }); });
// names say who is who: Coach Milan, Chef Mealan, Client Mia
const firstName = (n?: string | null) => (n ?? "").trim().split(/\s+/)[0] || "";
const coachLabel = (n?: string | null) => (firstName(n) ? `Coach ${firstName(n)}` : "Your coach");
// when the phone's copy last changed by a person's hand, and which foods left the library (merged away, removed)
const STATE_AT = "chefmealan-state-at", GONE = "chefmealan-gone-foods";
// Storage release 2: what this phone last sent or took, per record (see records.ts)
const recKey = (uid: string) => `chefmealan-records-${uid}`;
const loadKnown = (uid: string): Known => { try { const v = JSON.parse(localStorage.getItem(recKey(uid)) || "{}"); return v && typeof v === "object" ? v : {}; } catch { return {}; } };
const saveKnown = (uid: string, k: Known) => { try { localStorage.setItem(recKey(uid), JSON.stringify(k)); } catch {} };
const getGone = (): string[] => { try { const v = JSON.parse(localStorage.getItem(GONE) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; } };
const setGone = (ids: string[]) => { try { localStorage.setItem(GONE, JSON.stringify([...new Set(ids)].slice(-500))); } catch {} };
const load = () => {
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return freshState();
    try {
      return parseState(raw);
    } catch {
      unreadableBackup = raw;
      return freshState();
    }
  } catch {
    return freshState();
  }
};
// the main screen showed: how long the app took to open, from the page starting to load (storage release 1)
function Opened() { useEffect(() => { if (openStats.ms === null) openStats.ms = Math.round(performance.now()); }, []); return null; }
// a value in a field as a label prints it: 313 kcal, 8.9 g, not 313.3333 or 8.888889 (Milan, 8 October 2026)
const inputValue = (x: number | null, key?: string) => (x === null ? "" : String(tidy(x, key === "calories" ? "kcal" : "g") ?? x));
function Modal({
  eyebrow,
  title,
  close,
  children,
}: {
  eyebrow?: string;
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  useBack(true, close);
  return (
    <div className="modal-backdrop">
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={eyebrow ? `${eyebrow}: ${title}` : title}
      >
        <header>
          <div className="modal-titles">{eyebrow && <small className="eyebrow-line">{eyebrow}</small>}<h2>{title}</h2></div>
          <button className="icon" aria-label="Close dialog" onClick={close}>
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
function Mealan({
  items,
  portion,
  goals,
  title,
}: {
  items: Ingredient[];
  portion: number | null;
  goals: Goals;
  title: string;
}) {
  const data = portionTotals(items, portion),
    pd = density(data.protein, data.calories),
    total = aggregate(items),
    valid = data.weight > 0;
  return (
    <section className="mealan-card">
      <div className="eyebrow">MEALAN · SELECTED PORTION</div>
      <h2>{title || "My meal"}</h2>
      <div className="headline-metrics">
        <span>
          <b>{fmt(pd, 2)}</b> PD
        </span>
        <span>{fmt(data.weight)} g</span>
        <span>{fmt(data.calories, 0)} kcal</span>
      </div>
      <p className="calorie-share">
        CAL <strong>{fmt(contribution(data.calories, goals.calories))}%</strong>{" "}
        of daily reference
      </p>
      <div className="macro-grid">
        {MACROS.map((k) => (
          <div key={k}>
            <strong>{symbol(k, data, goals)}</strong>
            <span>{fmt(contribution(data[k], goals[k]))}%</span>
            <small>
              {fmt(data[k])} g {LABELS[k].toLowerCase()}
            </small>
          </div>
        ))}
      </div>
      {!valid && (
        <p className="notice">
          Choose a portion greater than zero and no larger than this recipe.
        </p>
      )}
      <p className="small">
        {portion === null
          ? "Whole recipe selected."
          : `Whole recipe: ${fmt(total.weight)} g. Portion assumes ingredients are evenly mixed.`}{" "}
        Missing data is shown as ?.
      </p>
      <details>
        <summary>How to read this</summary>
        <p>
          PD is grams of protein per 100 kcal. PD {fmt(pd, 2)} describes
          concentration, not the total amount you eat. Percentages show this
          portion's share of your daily targets. Letters compare nutrient
          density with your plan: + above, capital near, lowercase below. The
          pilot uses a ±10% band; it does not label a meal healthy or unhealthy.
        </p>
        <div className="density-list">
          {MACROS.map((k) => (
            <span key={k}>
              {DENSITIES[k]} {fmt(density(data[k], data.calories), 2)}
            </span>
          ))}
        </div>
        <p className="small">
          DS names the density family. Combined MD remains experimental and is
          not used to rate meals. A ? may mean the nutrient or its daily target
          is missing.
        </p>
      </details>
    </section>
  );
}
// The label check: the model read it, the person checks it against the pack, then saves. Named after the person's job.
function LabelCheck({
  food,
  image,
  images,
  dbPhotos,
  library,
  close,
  save,
  mixFor,
  onMix,
  onAsk,
  momentName,
  target,
  day,
  allergies,
  region,
  addTo,
  fromSearch,
  onLookup,
  titleAs,
}: {
  food: Food;
  image?: string;
  images?: string[];
  dbPhotos?: string[];
  library?: Food[];
  close: () => void;
  save: (f: Food, opts?: { open?: boolean; plate?: boolean }) => void;
  mixFor?: (f: Food) => MixTip;
  onMix?: (f: Food, m: Mix) => void;
  onAsk?: (f: Food, tip: MixTip) => void;
  momentName?: string;
  target?: number | null;
  day?: { kcal: number | null; eaten: number; name: string; type: DayType; weightKg: number | null };
  allergies?: string[];
  region?: string | null;
  addTo?: "plate" | "foods";
  fromSearch?: string;
  onLookup?: (code: string) => void;
  titleAs?: string;
}) {
  const [mainIdx, setMainIdx] = useState(0);
  // canvas board C8: each of the database's photos has its own tick, all ticked to start
  const [keepDb, setKeepDb] = useState<boolean[]>(() => (dbPhotos ?? []).map(() => true));
  const [choice, setChoice] = useState<"update" | "both">("update");
  const [servingGrams, setServingGrams] = useState(food.serving ? String(food.serving.grams) : ""),
    [servingName, setServingName] = useState(food.serving?.name ?? ""),
    [name, setName] = useState(food.name),
    [brand, setBrand] = useState(food.brand),
    [notes, setNotes] = useState(food.notes),
    [ready, setReady] = useState(food.readyToEat),
    [reviewed, setReviewed] = useState(false),
    [errors, setErrors] = useState<string[]>([]);
  const [values, setValues] = useState(() => {
    // a blank field with a less-than in the notes gets the printed bound, so the number can be calculated; the note keeps the printed text
    const bounds = lessThanFromNotes(food.notes ?? "");
    return Object.fromEntries(KEYS.map((k) => [k, food[k] === null && bounds[k] !== undefined ? String(bounds[k]) : inputValue(food[k], k)])) as Record<string, string>;
  });
  // the lines as a label prints them, once, when the review opens: typing stays exactly as typed
  const [rows, setRows] = useState<LabelRow[]>(() => displayRows(food).map((r) => ({ ...r, amount: r.amount === null ? null : tidy(r.amount, r.unit) })));
  const [adding, setAdding] = useState(false);
  const [addKey, setAddKey] = useState("saturates");
  const [addName, setAddName] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [addUnit, setAddUnit] = useState<Unit>("g");
  useEffect(() => { const k = knownOf(addKey); if (k) setAddUnit(k.unit); }, [addKey]);
  // the same product, recognised from what's on screen now
  const liveMatch = !(library ?? []).some((x) => x.id === food.id)
    ? findMatch({ ...food, name, brand, ...Object.fromEntries(KEYS.map((k) => [k, numberInput(values[k])])) } as Food, library ?? [])
    : null;
  // the draft as a food, for the mix tip while the sheet is still open
  // readyToEat is true for the tip: the box starts unticked because it is unconfirmed, not because the food needs cooking
  const servingNow = () => servingOf({ grams: numberInput(servingGrams), name: servingName.trim() || "serving" });
  const draft = (): Food => ({ ...food, name: name.trim() || food.name, brand: brand.trim(), readyToEat: true, serving: servingNow(), ...Object.fromEntries(KEYS.map((k) => [k, numberInput(values[k])])) } as Food);
  const pendingMix = useRef<Mix | null>(null);
  const [askError, setAskError] = useState("");
  // the title is the word the person tapped: Type, Barcode, Scan; the small line above says where the food goes
  const kind = (() => {
    const src = food.source || "";
    const where = addTo === "plate" ? "Add to plate" : "Add a food";
    if (titleAs) return { eyebrow: "Find a food", title: titleAs, line: "Check what the database says against the pack, then save." };
    if (/barcode|product database|open food facts/i.test(src)) return { eyebrow: where, title: "Barcode", line: "Check what the database says against the pack, then save." };
    if (/photo|label/i.test(src)) return { eyebrow: where, title: "Scan", line: "Check what was read against the pack, then save." };
    return { eyebrow: where, title: "Manual", line: "Name the food, fill the values as on the pack, save." };
  })();
  const [refOpen, setRefOpen] = useState(() => Boolean(food.name) && /manual/i.test(food.source || ""));
  const [code, setCode] = useState(food.barcode ?? "");
  const [refPicked, setRefPicked] = useState<string | null>(null);
  // the mix tip shown on the review sheet is logged once per food
  const loggedTip = useRef<string | null>(null);
  function noteTip(tip: MixTip, d: Food) {
    if (loggedTip.current === food.id || tip.case === "fits" || tip.case === "unknown") return;
    loggedTip.current = food.id;
    log("mix_tip", { food: d.name, where: "review", moment: momentName, case: tip.case, offered: tip.mixes.map((m) => ({ partners: m.partners.map((x) => x.name), kind: m.kind, pd: Math.round(m.pd * 10) / 10, kcal: m.kcal })) });
  }
  // Tell Mealan from the sheet: the food goes in with what is typed (name, energy, protein), unreviewed, so the conversation can start now
  function askNow(tip: MixTip) {
    const f = { ...draft(), readyToEat: ready, notes, icon: food.icon || iconFor(name.trim() || food.name) } as Food;
    const e = validateFood(f);
    setAskError(e[0] ?? "");
    if (e.length || !onAsk) return;
    save(f);
    onAsk(f, tip);
  }
  function submit() {
    const f = {
      ...food,
      ...(refPicked ? { source: "Reference table" } : {}),
      ...(/^\d{8,14}$/.test(code.trim()) ? { barcode: code.trim() } : {}),
      name: name.trim(),
      brand: brand.trim(),
      serving: servingNow(),
      notes,
      readyToEat: ready,
      reviewedAt: new Date().toISOString(),
      ...Object.fromEntries(KEYS.map((k) => [k, numberInput(values[k])])),
      table: rows.map((r) => { const core = knownOf(r.key)?.core; return core ? { ...r, amount: numberInput(values[core]) } : r; }),
    } as Food;
    const e = validateFood(f);
    if (
      KEYS.some(
        (k) => values[k].trim() !== "" && numberInput(values[k]) === null,
      )
    )
      e.push(
        "Use a non-negative decimal number, or leave unknown values blank. Record trace or < values in the notes.",
      );
    if (!reviewed)
      e.push("Confirm the label and per-100-g basis before saving.");
    setErrors(e);
    if (e.length) return;
    f.icon = f.icon || iconFor(f.name);
    const isNew = !(library ?? []).some((x) => x.id === f.id);
    const match = isNew ? findMatch(f, library ?? []) : null;
    const finish = (g: Food) => {
      const saved = match && choice === "update" ? { ...mergeFoods(match.food, g), reviewedAt: g.reviewedAt } : g;
      const m = pendingMix.current; pendingMix.current = null;
      save(saved, { open: isNew && !(match && choice === "update") && !(m && onMix) && addTo !== "plate", plate: addTo === "plate" && !(m && onMix) });
      if (m && onMix) onMix(saved, m);
    };
    const raw = (images && images.length ? images : image ? [image] : []);
    const mine = raw.length > 1 ? [raw[mainIdx] ?? raw[0], ...raw.filter((_, i) => i !== mainIdx)] : raw;
    // the database's ticked photos first, then the person's own (canvas board C8)
    const fromDb = (dbPhotos ?? []).filter((_, i) => keepDb[i]);
    const all = [...fromDb, ...mine];
    if (all.length && !f.photo)
      Promise.all([thumbnailBase64(all[0]).catch(() => ""), ...all.map((x) => resizeImageBase64(x, 900, 900).catch(() => ""))])
        .then(([thumb, ...big]) => {
          const ok = big.filter(Boolean);
          const credited = big.slice(0, fromDb.length).filter(Boolean).map(sig);
          finish({ ...f, photo: thumb || undefined, photos: ok.length ? ok : undefined, ...(credited.length ? { creditPhotos: credited } : {}) } as Food);
        })
        .catch(() => finish(f));
    else finish(f);
  }
  return (
    <Modal title={kind.title} close={close} eyebrow={kind.eyebrow}>
      <p className="small muted sheet-line">{kind.line}{fromSearch ? <> From your search: <b>{fromSearch}</b>.</> : null}</p>
      {dbPhotos && dbPhotos.length > 0 && (
        <div className="db-photos">
          <div className="db-strip" aria-label="Photos from Open Food Facts">
            {dbPhotos.map((src, i) => (
              <button key={i} className={`db-photo ${keepDb[i] ? "on" : ""}`} aria-pressed={keepDb[i]} aria-label={`${keepDb[i] ? "Leave out" : "Keep"} database photo ${i + 1}`} onClick={() => setKeepDb((k) => k.map((x, j) => (j === i ? !x : x)))}>
                <img src={src} alt="" />
                <span className="db-tick" aria-hidden="true">{keepDb[i] ? "✓" : ""}</span>
                <span className="db-globe" aria-hidden="true"><Globe size={12} /></span>
              </button>
            ))}
          </div>
          <small>Ticked photos stay with the food. Tap one to leave it out.</small>
          <small className="credit"><Globe size={13} /> Credit: Open Food Facts, CC BY-SA</small>
        </div>
      )}
      {images && images.length > 1 ? (
        <div className="label-previews" aria-label="Your photos of this product">
          {images.map((src, i) => (
            <div className="preview-wrap" key={i}>
              <img className="label-preview" src={src} alt={`Photo ${i + 1} of ${images.length}`} />
              <button className={`star ${mainIdx === i ? "on" : ""}`} aria-label={mainIdx === i ? "Main photo" : "Make this the main photo"} onClick={() => setMainIdx(i)}>{mainIdx === i ? "★ Main photo" : "☆ Make main"}</button>
            </div>
          ))}
        </div>
      ) : image ? (
        <img className="label-preview" src={image} alt="Captured nutrition label" />
      ) : null}
      {images && images.length > 1 && <p className="small center">{images.length} photos · swipe to see each</p>}
      {liveMatch && (
        <section className="match">
          <b>Looks like a food you already have</b>
          <small>{liveMatch.food.name}{liveMatch.food.brand ? `, ${liveMatch.food.brand}` : ""} · {liveMatch.reason === "barcode" ? "same barcode" : "same values per 100 g"}</small>
          <div className="moments" style={{ marginTop: 8 }}>
            <button className={`choice ${choice === "update" ? "on" : ""}`} onClick={() => setChoice("update")}>Update that one</button>
            <button className={`choice ${choice === "both" ? "on" : ""}`} onClick={() => setChoice("both")}>Keep both</button>
            <button className="pill pill-small" onClick={close}>Cancel</button>
          </div>
          {choice === "update" && <small>It keeps its name. Missing values, brand or barcode are filled in, and these photos join its gallery.</small>}
        </section>
      )}
      <p className="small">
        Source: {food.source}. Check the actual package. All values below must
        be <strong>per 100 g</strong>, with carbohydrate excluding fibre.
      </p>
      <label>
        Product name
        <input value={name} onChange={(e) => { setName(e.target.value); setRefOpen(true); }} onFocus={() => setRefOpen(true)} autoComplete="off" />
      </label>
      {refOpen && food.source !== "Reference table" && !food.barcode && findReference(name).length > 0 && (
        <div className="ref-suggest" role="listbox" aria-label="From the reference table">
          <small className="muted">No label needed. From the reference table, per 100 g:</small>
          {findReference(name).map((r) => (
            <button key={r.id} type="button" role="option" className="ref-row" onClick={() => {
              const rf = referenceFood(r, region, () => food.id);
              setName(rf.name); setBrand(""); setNotes(rf.notes ?? ""); setReady(rf.readyToEat);
              setValues(Object.fromEntries(KEYS.map((k) => [k, inputValue((rf as any)[k], k)])) as Record<string, string>);
              setRows(displayRows(rf)); setRefPicked(r.id); setRefOpen(false);
            }}>
              <b>{localName(r, region)}</b><small>{otherNames(r, region).join(" · ")} · {r.kcal} kcal · {r.protein} g protein</small>
            </button>
          ))}
        </div>
      )}
      {refPicked && <p className="small muted">Values from the reference table. Check the tick below and save.</p>}
      <label>
        Brand
        <input value={brand} onChange={(e) => setBrand(e.target.value)} />
      </label>
      {kind.title === "Manual" && onLookup && (
        <label className="barcode-field">
          Barcode number, if the pack has one
          <div className="barcode-row">
            <input inputMode="numeric" placeholder="8 to 14 digits, under the bars" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && /^\d{8,14}$/.test(code.trim())) onLookup(code.trim()); }} />
            <button type="button" className="pill pill-small" disabled={!/^\d{8,14}$/.test(code.trim())} onClick={() => onLookup(code.trim())}>Look up</button>
          </div>
          <small className="muted">Look up fills the table from the product database when the pack is known. Or fill it in below.</small>
        </label>
      )}
      <div className="serving-field">
        <span className="label">Serving, if the pack prints one</span>
        <div className="serving-row">
          <span>1</span>
          <input aria-label="Serving name" placeholder="bar, piece, pot" value={servingName} onChange={(e) => setServingName(e.target.value)} />
          <input aria-label="Serving grams" type="number" inputMode="decimal" min="0" placeholder="45" value={servingGrams} onChange={(e) => setServingGrams(e.target.value)} />
          <span>g</span>
        </div>
        <small className="muted">A counted food: what Chef Mealan moves then comes in whole servings, 1 bar, 2 bars, never 1.3.</small>
        {packLine({ pack: food.pack, serving: servingNow() }) && <small className="pack-line">{packLine({ pack: food.pack, serving: servingNow() })}</small>}
      </div>
      <p className="label">Nutrition table, per 100 g, as on the pack</p>
      <div className="label-table">
        {rows.map((r, i) => {
          const core = knownOf(r.key)?.core;
          return (
            <div className={`lt-row ${r.sub ? "sub" : ""}`} key={r.key + i}>
              <span className="lt-name">{r.name}{r.source === "you" && <em> · added by you</em>}{r.source === "database" && <em> · database</em>}{r.source === "photo" && <em className="from-photo"> · read from the photo</em>}</span>
              <input inputMode="decimal" aria-label={r.name} value={core ? values[core] : r.amount ?? ""} placeholder="–"
                onChange={(e) => core ? setValues((v) => ({ ...v, [core]: e.target.value })) : setRows((rs) => rs.map((x, j) => j === i ? { ...x, amount: numberInput(e.target.value) } : x))} />
              <span className="lt-unit">{r.unit}</span>
              {!core ? <button className="lt-x" aria-label={`Remove ${r.name}`} onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}>×</button> : <span className="lt-x" />}
            </div>
          );
        })}
      </div>
      {(() => {
        const d = draft();
        if (d.calories === null || d.protein === null) return null;
        const pb = playbookFor(d), pd = density(d.protein, d.calories);
        const fit = fitnessFor(d, day?.weightKg ?? null, day?.type ?? "passive");
        const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
        // on its own: the playbook's word, and the number against this plate's target; under the target is never green
        const under = target != null && pd !== null && pd < target;
        const ownText = !pb.alone.ok ? cap(pb.alone.reason) : under ? `Under your ${fixed(target!)}: pair it with a protein base to get there` : target != null ? `On your ${fixed(target)}. ${cap(pb.alone.reason)}` : cap(pb.alone.reason);
        const ownClass = !pb.alone.ok ? "no" : under ? "mid" : "ok";
        const t = day ? todayLine(d, day.kcal, day.eaten, day.name) : null;
        const sv = d.serving;
        const count = (grams: number) => (sv ? `${servingsFor(d, grams)} ${sv.name}${servingsFor(d, grams) === 1 ? "" : "s"}, ${snapToServing(d, grams)} g` : `about ${grams} g`);
        const beforeText = fit.before.fits && fit.before.grams !== null ? `fast energy, nothing to add: ${count(fit.before.grams)} gives about ${Math.round((snapToServing(d, fit.before.grams) * (d.carbs ?? 0)) / 100)} g carbs for a ${dayName(day?.type ?? "passive")}` : fit.before.reason;
        const afterText = fit.after.fits && fit.after.grams !== null ? `suits after training: ${count(fit.after.grams)} gives about ${Math.round((snapToServing(d, fit.after.grams) * (d.protein ?? 0)) / 100)} g protein, your ${fit.after.floor} g` : fit.after.reason;
        return (
          <section className="fit-lines" aria-label="How it fits">
            <p className="label">How it fits</p>
            <p className="fit-pd"><b>{pdText(pd)}</b><small>{fmt(d.protein)} g protein per {fmt(d.calories, 0)} kcal{sv ? ` · 1 ${sv.name} is ${sv.grams} g, ${Math.round((sv.grams * (d.calories ?? 0)) / 100)} kcal and ${Math.round((sv.grams * (d.protein ?? 0)) / 100 * 10) / 10} g protein` : ""}</small></p>
            <p className={`fit-line ${ownClass}`}><b>On its own:</b> {ownText}.</p>
            <p className={`fit-line ${fit.before.fits ? "ok" : pb.beforeTraining.ok ? "mid" : "no"}`} title={SOURCES.preCarb}><b>Before training:</b> {cap(beforeText)}.</p>
            <p className={`fit-line ${fit.after.fits ? "ok" : "no"}`} title={SOURCES.proteinDose}><b>After training:</b> {cap(afterText)}.</p>
            {pb.caveats.length > 0 && <p className="fit-line no"><b>Label:</b> {cap(pb.caveats.join(", "))}.</p>}
            {allergies && allergyHits(d, allergies).length > 0 && <p className="fit-line no"><b>Contains what you avoid:</b> {allergyHits(d, allergies).join(", ")}. Never suggested; shown so you can see it.</p>}
            {t && <p className="fit-line today">{t}</p>}
          </section>
        );
      })()}
      {adding ? (
        <div className="lt-add">
          <select value={addKey} onChange={(e) => setAddKey(e.target.value)} aria-label="Which line">
            {KNOWN.filter((k) => !k.core && !rows.some((r) => r.key === k.key)).map((k) => <option key={k.key} value={k.key}>{k.name}</option>)}
            <option value="other">Other…</option>
          </select>
          {addKey === "other" && <input placeholder="Name, as printed" value={addName} onChange={(e) => setAddName(e.target.value)} />}
          <div className="lt-add-row">
            <input inputMode="decimal" placeholder="Amount" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} />
            <select value={addUnit} onChange={(e) => setAddUnit(e.target.value as Unit)} aria-label="Unit">{["g", "mg", "µg", "kcal", "kJ", "%"].map((u) => <option key={u}>{u}</option>)}</select>
            <button className="pill pill-small pill-primary" disabled={addKey === "other" && !addName.trim()} onClick={() => {
              const k = knownOf(addKey);
              const row: LabelRow = { key: k ? k.key : "other:" + addName.trim().toLowerCase(), name: k ? k.name : addName.trim(), amount: numberInput(addAmount), unit: addUnit, sub: k?.sub ?? false, source: "you" };
              setRows((rs) => sortEuropean([...rs, row]).sort((x, y) => { const ix = rs.indexOf(x), iy = rs.indexOf(y); return ix >= 0 && iy >= 0 ? ix - iy : 0; }));
              setAdding(false); setAddName(""); setAddAmount("");
            }}>Add</button>
            <button className="link" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <button className="link" onClick={() => { const first = KNOWN.find((k) => !k.core && !rows.some((r) => r.key === k.key)); setAddKey(first?.key ?? "other"); setAddUnit(first?.unit ?? "g"); setAdding(true); }}>+ Add a line, from the pack or the maker's website</button>
      )}
      <label>
        Label notes / preparation state
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="E.g. fibre not declared; as sold; contains milk. Do not enter client identifiers."
        />
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={ready}
          onChange={(e) => setReady(e.target.checked)}
        />{" "}
        Ready to eat and suitable for cold mixing
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={reviewed}
          onChange={(e) => setReviewed(e.target.checked)}
        />{" "}
        I checked the values, per-100-g basis and carbohydrate/fibre convention.
      </label>
      <p className="small">
        For a per-100-ml or per-serving label, convert from a known mass before
        saving. Do not assume ml equals g. Leave undeclared nutrients blank.
      </p>
      {errors.map((e) => (
        <p className="notice" key={e}>
          {e}
        </p>
      ))}
      <button className="primary wide" onClick={submit}>
        <Check size={17} /> Confirm & save food
      </button>
      {mixFor && onMix && (() => {
        const d = draft();
        if (d.calories === null || d.protein === null) return null;
        const tip = mixFor(d);
        noteTip(tip, d);
        if (tip.case === "fits") return <p className="small center mix-fits">Fits your plate as it stands.</p>;
        if (tip.case === "unknown") return null;
        return (
          <section className="mix-tip">
            <div className="mix-head"><span className="pro-badge">Mix it</span><small>{momentName}: {tip.why}</small></div>
            {tip.mixes.length === 0 && <p className="muted">Nothing in your foods or the starter set gets there with this one.</p>}
            {tip.mixes.map((m) => (
              <button key={m.id} className="mix-chip" onClick={() => { pendingMix.current = m; submit(); }}>
                <b>{mixLabel(m)}</b>
                <small>{pdText(m.pd)} · {m.kcal} kcal · {m.kind}{m.cooking ? " · cooking" : ""}{m.fromStarter.length ? " · from the starter set" : ""}</small>
              </button>
            ))}
            <p className="small">A tap saves the food and puts the mix on the plate.</p>
            {onAsk && <button className="link" onClick={() => askNow(tip)}><MessageCircle size={14} /> Not quite? Tell Chef Mealan</button>}
            {askError && <p className="notice">{askError}</p>}
          </section>
        );
      })()}
    </Modal>
  );
}
function GoalsEditor({
  goals,
  close,
  save,
}: {
  goals: Goals;
  close: () => void;
  save: (g: Goals) => void;
}) {
  const [values, setValues] = useState(
    Object.fromEntries(KEYS.map((k) => [k, inputValue(goals[k])])) as Record<
      string,
      string
    >,
  );
  const [error, setError] = useState("");
  return (
    <Modal title="Your daily reference" close={close}>
      <p>
        Enter your existing plan or targets agreed with your coach. Blank fields
        stay unknown. These are daily amounts, not one meal's targets.
      </p>
      <div className="form-grid">
        {KEYS.map((k) => (
          <label key={k}>
            {LABELS[k]} ({k === "calories" ? "kcal" : "g"})
            <input
              inputMode="decimal"
              value={values[k]}
              placeholder="Not set"
              onChange={(e) => setValues({ ...values, [k]: e.target.value })}
            />
          </label>
        ))}
      </div>
      <p className="small">
        Reference PD:{" "}
        {fmt(
          density(numberInput(values.protein), numberInput(values.calories)),
          2,
        )}{" "}
        g protein per 100 kcal. Changing the reference does not change a food's
        density.
      </p>
      {error && <p className="notice">{error}</p>}
      <button
        className="primary wide"
        onClick={() => {
          if (
            KEYS.some(
              (k) =>
                values[k].trim() !== "" &&
                (numberInput(values[k]) === null ||
                  numberInput(values[k]) === 0),
            )
          ) {
            setError("Enter positive targets, or leave a field blank.");
            return;
          }
          save(
            Object.fromEntries(
              KEYS.map((k) => [k, numberInput(values[k])]),
            ) as Goals,
          );
        }}
      >
        Save daily reference
      </button>
    </Modal>
  );
}
// the pages that belong to Me (M4): the top bar says Me on them, Menu on the rest
const ME_PAGES: MenuSection[] = ["me", "profile", "goal", "life", "week", "shop", "coach", "account"];
function MenuBack({ open, close, path }: { open: boolean; close: () => void; path?: string }) { useBack(open, close, path); return null; }
// The app's own address and Back (canvas board C5): mounted only while the app itself shows, never on the home page
function BackKeeper({ tab, setTab, onReady }: { tab: Tab; setTab: (t: Tab) => void; onReady: () => void }) {
  const tabRef = useRef(tab), fromBack = useRef(false), first = useRef(true);
  tabRef.current = tab;
  useEffect(() => {
    installBack((t) => { const next = (t ?? "home") as Tab; if (next !== tabRef.current) { fromBack.current = true; setTab(next); } });
    startTab(tabRef.current);
    onReady();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (fromBack.current) { fromBack.current = false; return; }
    pushTab(tab);
  }, [tab]);
  return null;
}
export default function App() {
  const [state, setState] = useState<PilotState>(load),
    [tab, setTab] = useState<Tab>(() => {
      // a reload keeps the screen; Clients only for a coach (Milan, 11 October 2026: a reload on Clients opened Today)
      const tabs = ["home", "journey", "plan", "meal", "chef", "recipes", "foods", "clients"] as Tab[];
      if (typeof location !== "undefined" && menuTrailOf(location.pathname).length) return "home";
      const fromPath = typeof location !== "undefined" ? tabOfPath(location.pathname, tabs) : null;
      const h = (typeof location !== "undefined" ? location.hash : "").replace("#", "");
      return (fromPath as Tab | null) ?? (tabs.includes(h as Tab) ? (h as Tab) : "home");
    }),
    [filter, setFilter] = useState<"all" | import("./goal").PdBand>("all"),
    [pagePath, setPagePath] = useState<string>(() => (typeof location !== "undefined" ? location.pathname : "/")),
    [coach, setCoachState] = useState<boolean>(isCoach),
    [step, setStep] = useState<Step>("in"),
    [clientName, setClientNameState] = useState<string>(getClientName),
    [goal, setGoalState] = useState(getGoal),
    [goalOpen, setGoalOpen] = useState<boolean>(() => !getGoal()),
    [user, setUser] = useState<CloudUser | null>(null),
    [authReady, setAuthReady] = useState(!cloudEnabled),
    [localOnly, setLocalOnly] = useState<boolean>(() => localStorage.getItem("chefmealan-local-only") === "1"),
    cloudLoaded = useRef(false),
    [cloudStatus, setCloudStatus] = useState<{ ok: boolean; text: string; at?: string }>({ ok: true, text: "" }),
    [profile, setProfile] = useState<{ role?: "coach"; coachId?: string; coachName?: string; coachEmail?: string; coachPhoto?: string; joinedAt?: string; coachSetAt?: string; formula?: import("./personal").Formula | null }>(() => (coachDemoOn() ? { role: "coach" } : {})),
    // the log is kept collapsed from 0.2.5+r20 (board FX, G3): the first open cleans the old one
    [goalLog, setGoalLogState] = useState<GoalEntry[]>(() => { setGoalLog(getGoalLog()); return getGoalLog(); }),
    nextSource = useRef<GoalSource | null>(null),
    [moment, setMomentState] = useState<MomentId>("regular"),
    // R11 (0.2.37, board RS8): what the plate is for. null: the meal the clock is in, a guess, off the plan; "exploring" sizes
    // nothing; "snack" is off the plan, unsized; "meal:<slot>" is that meal of today, sized for it and counted by the plan
    [pick, setPick] = useState<string | null>(null),
    [kind, setKind] = useState<PlateKind>("meal"),
    [plateTaste, setPlateTaste] = useState<import("./dishTaste").PlateTaste | null>(null),
    [usual, setUsualState] = useState<RhythmId[]>(getUsual),
    [region, setRegionState] = useState<RegionId | null>(getRegion),
    [travelTo, setTravelToState] = useState<RegionId | null>(getTravelTo),
    [newShared, setNewShared] = useState(0),
    [inbox, setInbox] = useState<InboxItem[]>([]),
    [personal, setPersonalState] = useState<Personal>(getPersonal),
    [safety, setSafetyState] = useState<Safety>(getSafety),
    [deleteSteps, setDeleteSteps] = useState(""),
    [day, setDayState] = useState<Day>(() => getDay()),
    // the coach's notes and the check-in day (0.2.6, board CW), kept on the phone and read from the account
    [coachThread, setCoachThread] = useState<CoachLocal>(getCoachLocal),
    // the pages of the top menu walked so far, each a step Back goes back over (M6); a reload on /me/profile opens Me, then Profile
    [menuTrail, setMenuTrail] = useState<MenuSection[]>(() => (typeof location !== "undefined" ? (menuTrailOf(location.pathname) as MenuSection[]) : [])),
    [backReady, setBackReady] = useState(false),
    [foodsView, setFoodsView] = useState<"foods" | "recipes">("foods"),
    [editFrom, setEditFrom] = useState<string>(""),
    [dbPhotos, setDbPhotos] = useState<string[]>([]),
    [editTitle, setEditTitle] = useState<string>(""),
    [review, setReview] = useState<NumbersReview | null>(null),
    [menuFrom, setMenuFrom] = useState<MenuSection | null>(null),
    [talkOpen, setTalkOpen] = useState(false),
    // Where does this go (0.2.5): a scan from Today keeps the tab and asks after the save
    [scanFrom, setScanFrom] = useState<"today" | null>(null),
    [where, setWhere] = useState<Food | null>(null),
    // what the chat opened for (0.2.4): "fill" shows the day filled at once
    [talkAsk, setTalkAsk] = useState<"fill" | null>(null),
    // the slots' meals (0.2.2) and the slot a plate is being made for
    [planned, setPlannedState] = useState<Planned>(() => refreshPlanned(getPlanned(), state.meals)),
    [filling, setFilling] = useState<Filling | null>(null),
    // the recipe the plate came from (a slot or Recipes, Open), so a new name on the Plate renames it at once
    [plateRecipeId, setPlateRecipeId] = useState<string | null>(null),
    // after How was it (0.2.23, IM23c): the recipe the meal made or changed opens on Recipes, with one line for today
    [landing, setLanding] = useState<{ id: string; line: string; title?: string; quiet?: boolean; back?: "recipes"; from?: import("./screens/api").MealFrom } | null>(null),
    // R8 (0.2.31): a reload or a saved link on /my-recipes/<id> opens that recipe, once Back is ready
    // R8, choice A (Milan 02:38): the Recipes tab, tapped while a recipe is open, goes to the list
    [recipesHome, setRecipesHome] = useState(0),
    [recipeFromPath, setRecipeFromPath] = useState<string | null>(() => (typeof location !== "undefined" ? recipeIdOfPath(location.pathname) : null)),
    [profileReady, setProfileReady] = useState(false),
    [loadTry, setLoadTry] = useState(0),
    [talkTurns, setTalkTurns] = useState<Turn[]>([]),
    [mealanAsk, setMealanAsk] = useState(0),
    [mixQuestion, setMixQuestion] = useState<string | null>(null),
    [camera, setCamera] = useState(false),
    [mode, setMode] = useState<ScannerMode>("label"),
    [busy, setBusy] = useState(""),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [edit, setEdit] = useState<Food | null>(null),
    [image, setImage] = useState(""),
    [imageSet, setImageSet] = useState<string[]>([]),
    [openFoodId, setOpenFoodId] = useState<string | null>(null),
    [goalsOpen, setGoalsOpen] = useState(false),
    [pending, setPending] = useState<{ name: string; brand: string; values?: any }[]>([]),
    [barcode, setBarcode] = useState(""),
    [query, setQuery] = useState(""),
    [accessOpen, setAccessOpen] = useState(false),
    [access, setAccess] = useState(
      () => sessionStorage.getItem("platemate-access") || "",
    ),
    [limits, setLimits] = useState({
      maxWeight: "",
      minProtein: "",
      maxKcal: "",
    }),
    [adjustId, setAdjustId] = useState(""),
    [options, setOptions] = useState<
      { food: Food; items: Ingredient[]; grams: number; explanation?: string }[]
    >([]),
    [reviewMeal, setReviewMeal] = useState<Meal | null>(null),
    [feedback, setFeedback] = useState({
      status: "prepared" as Feedback["status"],
      taste: "",
      notes: "",
    }),
    [services, setServices] = useState<{
      ai: boolean;
      airtable: boolean;
    } | null>(null);
  // the menu page on top, and moving between pages (M6): a page already walked goes back to it; up from a page opened
  // straight (the goal from Today) swaps it for its parent; anything else is one step further
  const menuSection: MenuSection | null = menuTrail.length ? menuTrail[menuTrail.length - 1] : null;
  const setMenuSection = (s: MenuSection | null, up = false) => setMenuTrail((t) => {
    if (!s) return [];
    const i = t.indexOf(s);
    if (i >= 0) return t.slice(0, i + 1);
    return up && t.length ? [...t.slice(0, -1), s] : [...t, s];
  });
  const importRef = useRef<HTMLInputElement>(null),
    runRef = useRef(0),
    fromCloud = useRef(false),
    // opened with the phone's copy while the account was still loading (slow network): edits made then count as newer
    localMode = useRef(false),
    prevFoodIds = useRef<string[]>(state.foods.map((f) => f.id));
  // ---- photos as files (storage release 1, canvas P0 to P2) ----
  // The phone keeps photos in its own photo store; the saved data carries none once they are safely there.
  // The account keeps them as image files. Keys: food:<id>, food:<id>:<n>, fb:<cardId>.
  const stateRef = useRef(state); stateRef.current = state;
  // The big block in the account: foods, recipes and the plate, as before. Since storage release 2 the foods and recipes
  // also live as records; the block keeps them 30 days after the move, so a rollback loses nothing, then holds only the
  // plate and settings ("recordsOnly"). The coach reads the number of foods from foodsCount.
  const blockOf = (st: PilotState) => {
    const moved = remoteMeta.current.recordsMovedAt;
    const slim = Boolean(moved && Date.now() - Date.parse(moved) > 30 * 86_400_000);
    const b = stripPhotos(st);
    return { state: slim ? { ...b, foods: [], meals: [] } : b, recordsOnly: slim, foodsCount: st.foods.length };
  };
  // Storage release 2: read the account's records, take the newest of each, then send what changed here.
  const recRef = useRef({ uid: "", known: {} as Known, pulled: false, running: false, again: false, againPull: false });
  const syncRecords = async (pull: boolean) => {
    const r = recRef.current, uid = r.uid;
    if (!uid || !cloudEnabled) return;
    if (r.running) { r.again = true; r.againPull = r.againPull || pull; return; }
    r.running = true;
    try {
      let cur = stateRef.current;
      if (pull) {
        const remote = await loadRecords(uid);
        if (recRef.current.uid !== uid) return;
        const m = mergeRecords(stateRef.current, remote, r.known, localStorage.getItem(STATE_AT) || new Date().toISOString());
        r.known = m.known;
        if (m.changed) {
          cur = m.state; fromCloud.current = true; setState(m.state);
          // photos of foods that came from the account: from the photo store, and from the account's files
          void photoRef.current.busy.then(() => storeAll()).then((m) => mergePhotos(m)).catch(() => {});
          void pullFiles();
        }
        r.pulled = true;
      }
      const c = recordChanges(cur, r.known, new Date().toISOString(), r.pulled);
      if (c.ups.length || c.dels.length) await saveRecords(uid, c.ups, c.dels);
      r.known = c.next; saveKnown(uid, r.known);
      if (r.pulled && !remoteMeta.current.recordsMovedAt) { await markRecordsMoved(uid); remoteMeta.current = { ...remoteMeta.current, recordsMovedAt: new Date().toISOString() }; }
    } catch (e) {
      setCloudStatus({ ok: true, text: `Saved. Records: ${explainCloudError(e)}`, at: new Date().toISOString() });
    } finally {
      r.running = false;
      if (r.again) { const p = r.againPull; r.again = false; r.againPull = false; void syncRecords(p); }
    }
  };
  const photoRef = useRef({ ok: false, ready: false, known: new Map<string, string>(), stored: new Set<string>(), busy: Promise.resolve() as Promise<unknown> });
  const filesRef = useRef({ uid: "", ready: false, running: false, again: false, up: new Map<string, string>() });
  const [, setPhotoCountState] = useState(0);
  const setPhotoCount = (n: number) => { openStats.photos = n; setPhotoCountState(n); };
  const writeLocal = () => {
    const ph = photoRef.current, st = stateRef.current;
    localStorage.setItem(STORE, JSON.stringify(ph.ok && ph.ready ? withoutStored(st, ph.stored) : st));
  };
  // photos the account already has, by key and fingerprint, so each one goes up once
  const upKey = (uid: string) => `chefmealan-files-up-${uid}`;
  const saveUp = () => { const fr = filesRef.current; try { localStorage.setItem(upKey(fr.uid), JSON.stringify(Object.fromEntries(fr.up))); } catch {} };
  const syncFiles = async () => {
    const fr = filesRef.current;
    if (!cloudEnabled || !fr.uid || !fr.ready) return;
    if (fr.running) { fr.again = true; return; }
    fr.running = true;
    let sent = 0;
    try {
      do {
        fr.again = false;
        const st = stateRef.current, now = photosOf(st);
        for (const [k, v] of now) {
          if (fr.up.get(k) === sig(v)) continue;
          await uploadPhoto(fr.uid, fileOf(k), v); fr.up.set(k, sig(v)); saveUp(); sent++;
        }
        for (const k of [...fr.up.keys()]) {
          if (now.has(k) || !isOrphan(k, st)) continue;
          await deletePhotoFile(fr.uid, fileOf(k)); fr.up.delete(k); saveUp();
        }
      } while (fr.again);
      if (sent) setCloudStatus({ ok: true, text: `Saved to your account, with ${sent} photo${sent === 1 ? "" : "s"}`, at: new Date().toISOString() });
    } catch (e) {
      setCloudStatus({ ok: true, text: `Saved to your account. Photos: ${explainCloudError(e)}`, at: new Date().toISOString() });
    } finally { fr.running = false; }
  };
  const syncPhotoStore = () => {
    const ph = photoRef.current;
    if (!ph.ok || !ph.ready) return;
    const st = stateRef.current, now = photosOf(st);
    const put: [string, string][] = [];
    for (const [k, v] of now) if (ph.known.get(k) !== sig(v)) { put.push([k, v]); ph.known.set(k, sig(v)); ph.stored.delete(k); }
    const del = [...ph.known.keys()].filter((k) => !now.has(k) && isOrphan(k, st));
    del.forEach((k) => { ph.known.delete(k); ph.stored.delete(k); });
    if (put.length || del.length) {
      ph.busy = ph.busy.then(async () => {
        await storePut(put); await storeDel(del);
        put.forEach(([k]) => ph.stored.add(k));
        setPhotoCount(ph.known.size);
        try { writeLocal(); } catch { /* the next save tries again */ }
      }).catch((e) => { console.warn("photo store:", e); /* not confirmed: the photos stay in the saved data */ });
    }
    void syncFiles();
  };
  // photos that arrive from the store or the account: added where the state has none, never stamped as a change made here
  const mergePhotos = (photos: Map<string, string>, accept?: Set<string>) => {
    if (!photos.size) return;
    setState((st) => { const next = withPhotos(st, photos, accept); if (next !== st) fromCloud.current = true; return next; });
  };
  // Photos from the account: the ones a food or card names that this phone doesn't hold (added or changed on another
  // phone), and on opening, any file the state has no photo for. Fetched a few at a time, previews first; a file that isn't
  // there yet (the other phone is still sending it) is looked for again in 20 seconds, twice at most per photo.
  const pullRef = useRef({ running: false, again: false, list: false, tries: new Map<string, number>(), timer: 0 });
  const pullFiles = async (list = false) => {
    const fr = filesRef.current, uid = fr.uid, pr = pullRef.current;
    if (!cloudEnabled || !uid || !remoteMeta.current.photosMovedAt) return;
    if (pr.running) { pr.again = true; pr.list = pr.list || list; return; }
    pr.running = true;
    let waiting = false;
    try {
      do {
        const listNow = list || pr.list;
        pr.again = false; pr.list = false; list = false;
        await photoRef.current.busy.catch(() => {});
        const st = stateRef.current, known = photoRef.current.known;
        const want = photosWanted(st);
        const need = new Map<string, string>();
        for (const [k, s] of want) if (known.get(k) !== s) need.set(k, s);
        if (listNow) {
          const names = await listPhotoFiles(uid);
          if (filesRef.current.uid !== uid) return;
          const have = photosOf(stateRef.current);
          for (const k of names.map(keyOf)) if (!have.has(k) && !known.has(k) && !want.has(k) && !isOrphan(k, stateRef.current)) need.set(k, "");
        }
        const keys = [...need.keys()].filter((k) => (pr.tries.get(k + need.get(k)) ?? 0) < 3).sort((a, b) => Number(isPreview(b)) - Number(isPreview(a)));
        const store = want.size ? await storeAll().catch(() => new Map<string, string>()) : new Map<string, string>();
        const got = new Map(store), accept = new Set<string>();
        for (let i = 0; i < keys.length; i += 6) {
          for (const k of keys.slice(i, i + 6)) {
            const t = k + need.get(k); pr.tries.set(t, (pr.tries.get(t) ?? 0) + 1);
            try { const d = await downloadPhoto(uid, fileOf(k)); got.set(k, d); accept.add(k); fr.up.set(k, sig(d)); } catch { waiting = true; }
            if (filesRef.current.uid !== uid) return;
          }
          saveUp(); mergePhotos(got, accept);
        }
        if (!keys.length && got.size) mergePhotos(got, accept);
        if ([...need.keys()].some((k) => (pr.tries.get(k + need.get(k)) ?? 0) < 3 && !got.has(k))) waiting = true;
      } while (pr.again);
    } catch { waiting = true; } finally { pr.running = false; }
    if (waiting && !pr.timer) pr.timer = window.setTimeout(() => { pr.timer = 0; void pullFiles(); }, 20_000);
  };
  // on open: the photo store fills the state; on the first open after the release, the photos in the saved data move into the store
  useEffect(() => {
    (async () => {
      const ph = photoRef.current;
      ph.ok = await storeOk();
      let map = new Map<string, string>();
      if (ph.ok) { try { map = await storeAll(); } catch { /* an empty store */ } }
      for (const [k, v] of map) { ph.known.set(k, sig(v)); ph.stored.add(k); }
      ph.ready = true;
      setPhotoCount(map.size);
      if (map.size) mergePhotos(map);
      syncPhotoStore();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // today's day follows the Training week: when the plan changes, here or from the account, today is read again
  useEffect(() => { setDayState(getDay(personal)); }, [personal]);
  useEffect(() => {
    if (!message && !error) return;
    const t = setTimeout(() => { setMessage(""); setError(""); }, 4000);
    return () => clearTimeout(t);
  }, [message, error]);
  useEffect(() => {
    try {
      if (unreadableBackup !== null) {
        setError(
          "Stored pilot data could not be read. It has been preserved. Export the recovery backup before importing a valid backup or clearing this site's data.",
        );
        return;
      }
      writeLocal();
      syncPhotoStore();
      // a change made here, not one that came down from the account: stamp it, and remember any food that left the library
      // (merged away or removed), so an older copy can never bring it back
      if (fromCloud.current) { fromCloud.current = false; }
      else {
        // only a change made after the account was read counts as newer; start-up effects on a stale phone must never win
        if (cloudLoaded.current || localMode.current) localStorage.setItem(STATE_AT, new Date().toISOString());
        const now = new Set(state.foods.map((f) => f.id));
        const left = prevFoodIds.current.filter((id) => !now.has(id));
        if (left.length) setGone([...getGone(), ...left]);
      }
      prevFoodIds.current = state.foods.map((f) => f.id);
    } catch {
      setError(
        "This browser could not save your changes. Export a backup before leaving.",
      );
    }
  }, [state]);
  useEffect(() => {
    setOptions([]);
  }, [state.items, state.goals, limits]);
  // DT80: when a recipe changes what it makes, the meals planned from it follow
  useEffect(() => {
    setPlannedState((prev) => { const next = refreshPlanned(prev, state.meals); if (next !== prev) storePlanned(next); return next; });
  }, [state.meals]);
  // DT78: eggs, bananas and apples on the Plate are whole ones, however they arrived (a recipe, a scan, grams typed)
  // A share of a batch recipe on the Plate (one slice, or sized for a meal) keeps its share, for the numbers; the whole recipe
  // and any meal of your own land on whole ones
  useEffect(() => {
    const rec = state.fromRecipe ? state.meals.find((m) => m.id === state.fromRecipe) : null;
    const weight = (xs: { grams: number }[]) => xs.reduce((n, i) => n + (i.grams > 0 ? i.grams : 0), 0);
    const batch = rec?.cook && rec.makes ? rec.cook.n / rec.makes.n : 1;           // DT81: the whole batch as cooked
    if (rec && servingsOf(rec) > 1 && weight(state.items) < weight(rec.items) * batch * 0.95) return;
    const next = wholeOnPlate(state.items);
    if (next) setState((s) => ({ ...s, items: wholeOnPlate(s.items) ?? s.items }));
  }, [state.items, state.fromRecipe, state.meals]);
  // the counter (0.2.5+r17, board M): what may leave the phone is sent while signed in, every minute and when the app hides
  useEffect(() => {
    // signed in on the live app; without accounts (local, walkthroughs) the local server counts
    if (cloudEnabled && !user) return;
    const v = String(import.meta.env.VITE_VERSION ?? "");
    const go = () => { void flushMetrics(v); };
    autoFlush(v); go();
    const t = setInterval(go, 60_000);
    const hide = () => { if (document.visibilityState === "hidden") go(); };
    document.addEventListener("visibilitychange", hide);
    return () => { autoFlush(null); clearInterval(t); document.removeEventListener("visibilitychange", hide); };
  }, [user?.uid]);
  useEffect(() => watchUser((u) => { setUser(u); setAuthReady(true); if (!u) { cloudLoaded.current = false; recRef.current.uid = ""; setProfileReady(false); filesRef.current.uid = ""; filesRef.current.ready = false; setFilesFor(""); } }), []);
  useEffect(() => {
    if (!user || cloudLoaded.current) return;
    let stale = false;
    (async () => {
      try {
        const remote = await withTimeout(loadCloud(user.uid), 20000);
        if (stale) return;
        if (remote) setReview(((remote as any).numbersReview as NumbersReview | undefined) ?? null);
        remoteMeta.current = { photosMovedAt: remote?.photosMovedAt, photosOldGoneAt: remote?.photosOldGoneAt, recordsMovedAt: remote?.recordsMovedAt };
        if (remote) setProfile({ role: remote.role, coachId: remote.coachId, coachName: remote.coachName, coachEmail: remote.coachEmail ?? undefined, coachPhoto: remote.coachPhoto ?? undefined, joinedAt: remote.joinedAt ?? undefined, coachSetAt: remote.coachSetAt, formula: remote.formula ?? null });
        if (remote) takeCoach(remote);
        if (remote && Array.isArray(remote.goalLog)) { const merged = [...new Map([...(remote.goalLog as GoalEntry[]), ...getGoalLog()].map((e) => [e.at, e])).values()].sort((x, y) => (x.at > y.at ? 1 : -1)); setGoalLog(merged); setGoalLogState(merged); }
        // foods that left the library on any device stay gone
        const gone = new Set([...getGone(), ...(Array.isArray(remote?.goneFoods) ? (remote!.goneFoods as string[]) : [])]);
        setGone([...gone]);
        // the newer copy wins: a change made on this phone after the account's last save is kept and sent up, not overwritten
        const localAt = localStorage.getItem(STATE_AT) ?? "";
        const phoneIsNewer = Boolean(remote) && !isEmptyState(state) && localAt > String(remote!.updatedAt ?? "");
        if (phoneIsNewer) {
          const kept = { ...state, foods: state.foods.filter((f) => !gone.has(f.id)) };
          if (kept.foods.length !== state.foods.length) setState(kept);
          await saveCloud(user.uid, { ...blockOf(kept), goal: getGoal(), clientName, personal: getPersonal(), goalLog: getGoalLog(), safety: getSafety(), goneFoods: [...gone], days: daysOut(), measured: measuredOut(), updatedAt: new Date().toISOString() });
          setCloudStatus({ ok: true, text: "This phone had newer changes; saved to your account", at: new Date().toISOString() });
        } else if (remote && !(isEmptyState(remote.state) && !isEmptyState(state))) {
          // a real account copy replaces the phone; photos are merged back from the phone by id
          try {
            const incoming = parseState(JSON.stringify(remote.state));
            if (remote.recordsOnly) { incoming.foods = state.foods; incoming.meals = state.meals; }
            incoming.foods = incoming.foods.filter((f) => !gone.has(f.id));
            const localPhoto = new Map(state.foods.map((f) => [f.id, f.photo]));
            const localFb = new Map(state.feedback.map((f) => [f.id, f.photo]));
            const localFbMore = new Map(state.feedback.map((f) => [f.id, f.photos]));
            // the app opens on the phone's photos; the account's photos and plate cards follow in the background (they can be large)
            const localMore = new Map(state.foods.map((f) => [f.id, f.photos]));
            incoming.foods = incoming.foods.map((f) => ({ ...f, photo: f.photo ?? localPhoto.get(f.id), photos: f.photos ?? localMore.get(f.id) }));
            const byId = new Map<string, any>();
            for (const fb of [...incoming.feedback, ...state.feedback]) if (!byId.has(fb.id)) byId.set(fb.id, fb);
            incoming.feedback = [...byId.values()].sort((x, y) => (y.createdAt > x.createdAt ? 1 : -1)).map((f) => ({ ...f, photo: f.photo ?? localFb.get(f.id), photos: f.photos ?? localFbMore.get(f.id) }));
            void fillFromAccount(user.uid);
            fromCloud.current = true;
            setState(incoming);
            // the photo store fills any photo the account copy left out
            void photoRef.current.busy.then(() => storeAll()).then(mergePhotos).catch(() => {});
          } catch { /* keep local if the cloud copy is unreadable */ }
          if (remote.goal) { try { localStorage.setItem("chefmealan-goal", JSON.stringify(remote.goal)); } catch {} setGoalState(getGoal()); setGoalOpen(!remote.goal); }
          if (remote.clientName) { storeClientName(remote.clientName); setClientNameState(remote.clientName); }
          if (remote.personal && typeof remote.personal === "object") { storePersonal(remote.personal as Personal); setPersonalState(remote.personal as Personal); }
          {
            // the newer answer wins: a door answered on this phone after the account's last save is not overwritten by the account's older copy
            const local = getSafety();
            const remoteS = remote.safety && typeof remote.safety === "object" ? { ...EMPTY_SAFETY, ...(remote.safety as Safety) } : null;
            const newer = (a?: string, b?: string) => (a ?? "") > (b ?? "");
            const base: Safety = !remoteS ? local : newer(local.declaredAt, remoteS.declaredAt) || newer(local.consentBodyAt, remoteS.consentBodyAt) ? { ...remoteS, ...local, flags: [...remoteS.flags, ...local.flags.filter((f) => !remoteS.flags.some((g) => g.situation === f.situation && g.at === f.at))] } : remoteS;
            // the 18+ tap is kept once given, whichever copy has it
            const merged: Safety = { ...base, adultAt: base.adultAt ?? local.adultAt ?? remoteS?.adultAt, aiConfirmedAt: remote.aiConfirmedAt ?? undefined, aiConfirmedBy: remote.aiConfirmedBy ?? undefined };
            storeSafety(merged); setSafetyState(merged);
          }
          setCloudStatus({ ok: true, text: "Loaded from your account", at: new Date().toISOString() });
        } else {
          await saveCloud(user.uid, { ...blockOf(state), goal: getGoal(), clientName, personal: getPersonal(), goalLog: getGoalLog(), safety: getSafety(), goneFoods: getGone(), days: daysOut(), measured: measuredOut(), updatedAt: new Date().toISOString() });
          setCloudStatus({ ok: true, text: "Saved to your account", at: new Date().toISOString() });
        }
      } catch (e: any) {
        if (stale) return;
        const why = e?.message === "timeout" ? "the connection is too slow right now" : explainCloudError(e);
        setCloudStatus({ ok: false, text: `Not connected: ${why}` });
        // never send this phone's copy over the account before the account was read: open on the phone's copy,
        // keep what is changed here, and try the account again in half a minute
        localMode.current = true;
        setError(`Could not reach your account: ${why}. Working on this phone for now; Chef Mealan keeps trying.`);
        setProfileReady(true);
        setTimeout(() => setLoadTry((n) => n + 1), 30000);
        return;
      }
      cloudLoaded.current = true;
      setProfileReady(true);
      setFilesFor(user.uid);
      recRef.current = { uid: user.uid, known: loadKnown(user.uid), pulled: false, running: false, again: false, againPull: false };
      void syncRecords(true);
    })();
    return () => { stale = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loadTry]);
  // the account's photos and plate cards, after the app is open: merged in by id, never replacing what the phone has
  async function fillFromAccount(uid: string) {
    try {
      const cards = await loadCards(uid);
      if (cards.length) setState((st) => {
        const have = new Set(st.feedback.map((f) => f.id));
        const add = cards.filter((c) => !have.has(c.id));
        return add.length ? { ...st, feedback: [...st.feedback, ...add].sort((x, y) => (y.createdAt > x.createdAt ? 1 : -1)) } : st;
      });
    } catch { /* none yet */ }
  }
  // the account's photo files, once the account is read: the first time, the photos move out of the database into files
  // (the old copies stay 30 days); after that, photos missing on this phone come down, previews first
  const remoteMeta = useRef<{ photosMovedAt?: string; photosOldGoneAt?: string; recordsMovedAt?: string }>({});
  const [filesFor, setFilesFor] = useState("");
  useEffect(() => {
    if (!filesFor || !cloudEnabled) return;
    let stale = false;
    (async () => {
      const fr = filesRef.current;
      fr.uid = filesFor; fr.ready = false;
      try { fr.up = new Map(Object.entries(JSON.parse(localStorage.getItem(upKey(filesFor)) || "{}"))); } catch { fr.up = new Map(); }
      while (!photoRef.current.ready) await new Promise((r) => setTimeout(r, 100));
      await photoRef.current.busy.catch(() => {});
      const meta = remoteMeta.current;
      try {
        if (!meta.photosMovedAt) {
          const old = await loadPhotos(filesFor);
          if (stale) return;
          mergePhotos(old);
          for (const [k, v] of old) { if (fr.up.get(k) === sig(v)) continue; await uploadPhoto(filesFor, fileOf(k), v); fr.up.set(k, sig(v)); saveUp(); }
          await markPhotosMoved(filesFor);
          remoteMeta.current = { ...meta, photosMovedAt: new Date().toISOString() };
        } else {
          if (!meta.photosOldGoneAt && Date.now() - Date.parse(meta.photosMovedAt) > 30 * 86_400_000) await dropOldPhotoCopies(filesFor).catch(() => {});
          await pullFiles(true);
        }
      } catch (e) { setCloudStatus({ ok: true, text: `Loaded. Photos: ${explainCloudError(e)}`, at: new Date().toISOString() }); }
      if (stale) return;
      fr.ready = true;
      void syncFiles();
    })();
    return () => { stale = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filesFor]);
  // client: recipes the coach sent
  const fetchInbox = async () => { if (!user) return; try { setInbox(await loadInbox(user.uid)); } catch { /* offline */ } };
  useEffect(() => { fetchInbox(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.uid]);
  useEffect(() => {
    const onShow = () => { if (document.visibilityState === "visible") fetchInbox(); };
    document.addEventListener("visibilitychange", onShow);
    return () => document.removeEventListener("visibilitychange", onShow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);
  // coach: how many cards were shared since I last looked
  const countNewShared = async () => {
    if (!user || profile.role !== "coach") return;
    try {
      const since = localStorage.getItem(`chefmealan-coach-seen-${user.uid}`) || "";
      const rows = await listClients(user.uid);
      const n = rows.reduce((acc, r) => acc + r.feedback.filter((f: any) => (f.shared?.at || f.createdAt) > since).length, 0);
      setNewShared(n);
    } catch { /* offline */ }
  };
  useEffect(() => { countNewShared(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.uid, profile.role]);
  useEffect(() => {
    const onShow = () => { if (document.visibilityState === "visible") countNewShared(); };
    document.addEventListener("visibilitychange", onShow);
    return () => document.removeEventListener("visibilitychange", onShow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, profile.role]);
  // when the app comes back to the front, pick up what another phone changed meanwhile (storage release 2)
  useEffect(() => {
    const onShow = () => { if (document.visibilityState === "visible" && cloudLoaded.current) { void syncRecords(true); void pullFiles(); } };
    document.addEventListener("visibilitychange", onShow);
    return () => document.removeEventListener("visibilitychange", onShow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // when the app comes back to the front, pick up a goal the coach set meanwhile
  useEffect(() => {
    if (!user) return;
    const onShow = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const remote = await loadCloud(user.uid);
        if (!remote) return;
        setProfile({ role: remote.role, coachId: remote.coachId, coachName: remote.coachName, coachEmail: remote.coachEmail ?? undefined, coachPhoto: remote.coachPhoto ?? undefined, joinedAt: remote.joinedAt ?? undefined, coachSetAt: remote.coachSetAt, formula: remote.formula ?? null });
        takeCoach(remote);
        if (remote.coachSetAt && remote.coachSetAt !== profile.coachSetAt && remote.goal && !remote.coachGoal) {
          try { localStorage.setItem("chefmealan-goal", JSON.stringify(remote.goal)); } catch {}
          setGoalState(getGoal());
          const g = (remote.state as any)?.goals;
          if (g) setState((s) => ({ ...s, goals: { ...s.goals, calories: g.calories ?? s.goals.calories, protein: g.protein ?? s.goals.protein } }));
          notify(`${remote.coachName || "Your coach"} set your goal.`);
        }
      } catch { /* offline, ignore */ }
    };
    document.addEventListener("visibilitychange", onShow);
    return () => document.removeEventListener("visibilitychange", onShow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile.coachSetAt]);
  // every change of the daily target lands in the goal log, a moment after it settles
  useEffect(() => {
    const kcal = state.goals.calories ?? null, protein = state.goals.protein ?? null;
    if (kcal === null && protein === null) return;
    const t = setTimeout(() => {
      const log = getGoalLog();
      const last = log[log.length - 1];
      const source: GoalSource = nextSource.current ?? goal?.source ?? (goal?.setBy === "coach" ? "coach" : "exact");
      if (last && last.kcal === kcal && last.protein === protein && last.band === goal?.band && last.source === source) return;
      const entry: GoalEntry = { at: new Date().toISOString(), band: goal?.band, kcal, protein, source, method: goal?.method, weightKg: personal.weightKg };
      const next = [...log, entry];
      setGoalLog(next); setGoalLogState(next); nextSource.current = null;
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.goals.calories, state.goals.protein, goal?.band, goal?.source]);
  // The coach's week (0.2.6, board CW): the day lines that go to the account with each save, five weeks back and one ahead.
  // Planned against eaten, against each day's own target. Days with nothing planned or eaten stay out.
  function daysOut(): Record<string, DayLine> {
    const out: Record<string, DayLine> = {}, today = ymd(new Date());
    for (let i = -35; i <= 7; i++) {
      const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + i);
      const key = ymd(d), held = planned[key], slots = slotsOn(lifestyleOf(personal), personal.timesOn, key);
      const logged = i > 0 ? [] : dayLog(state.feedback, d).logged;
      if (!(held && Object.keys(held).length) && !logged.length) continue;
      const t = numbersOfDate(d), pd = dayFor(personal, d)?.day;
      const training = pd && pd.kind !== "rest" ? `${planLineOf({ ...pd, when: undefined, pe: false }).toLowerCase()}${pd.minutes ? `, ${pd.minutes} min` : ""}` : null;
      out[key] = dayLineOf({ date: key, today, slots, held, logged, target: t ? { kcal: t.kcal, protein: t.protein } : null, training });
    }
    return out;
  }
  // From the account (0.2.6, board CW): the coach's notes and check-in day, and a goal the coach set from a later date.
  // A goal from a date waits on Goal (CW9); one from today applies now. Each is taken once.
  function takeCoach(remote: any) {
    const c: CoachLocal = { notes: notesOf(remote.coachNotes), checkinDay: checkinOf(remote.checkinDay) };
    setCoachLocal(c); setCoachThread(c);
    const cg = remote.coachGoal;
    if (!cg || typeof cg.at !== "string" || !cg.band) return;
    let seen = ""; try { seen = localStorage.getItem("chefmealan-coachgoal-at") ?? ""; } catch {}
    if (seen === cg.at) return;
    try { localStorage.setItem("chefmealan-coachgoal-at", cg.at); } catch {}
    const m = macroSplit(cg.kcal, cg.protein);
    const x = { band: cg.band, source: "coach" as const, setBy: "coach" as const, kcal: cg.kcal, protein: cg.protein, fats: m.fats, carbs: m.carbs };
    if (cg.from > ymd(new Date())) { const next: Personal = { ...getPersonal(), nextGoal: { ...x, from: cg.from, at: cg.at } }; storePersonal(next); setPersonalState(next); notify(`${remote.coachName || "Your coach"} set your next goal, from ${new Date(`${cg.from}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }).replace(",", "")}.`); }
    else { applyGoalNow(x); notify(`${remote.coachName || "Your coach"} set your goal.`); }
  }
  // Got it and Reply on the coach's note (CW5): on this phone at once, then in the account
  function saveNotes(notes: CoachNote[]) {
    const c = { ...coachThread, notes }; setCoachLocal(c); setCoachThread(c);
    if (user && cloudEnabled) void saveOwnNotes(user.uid, notes).catch(() => notify("Not saved to your account yet. It stays on this phone."));
  }
  // the goal and profile as they are now, for numbersOfDay when it is given another goal (board FX)
  const goalNow = goal, personalNow = personal;
  // each day keeps its own target (board FX): today's is written with the day, so a later goal never changes it
  const todayTarget = todayNumbers();
  useEffect(() => {
    if (!todayTarget) return;
    const next = withTarget(personal, ymd(new Date()), todayTarget);
    if (next !== personal) { storePersonal(next); setPersonalState(next); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayTarget?.kcal, todayTarget?.protein, todayTarget?.fats, todayTarget?.carbs]);
  // a goal applied from a later date starts on its day by itself (board FX, G2)
  const [dayTick, setDayTick] = useState(() => ymd(new Date()));
  useEffect(() => {
    const t = setInterval(() => setDayTick(ymd(new Date())), 60_000);
    const vis = () => { if (document.visibilityState === "visible") setDayTick(ymd(new Date())); };
    document.addEventListener("visibilitychange", vis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", vis); };
  }, []);
  useEffect(() => {
    const ng = personal.nextGoal;
    if (ng && ng.from <= dayTick) applyGoalNow(ng);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personal.nextGoal?.from, dayTick]);
  // The first two weeks and the measured burn (0.2.7, board FT): from the day lines and the weigh-ins, never for anyone who
  // sees no weigh-ins. What the formula says to stay the same sits next to it. The coach gets the same result with each save.
  const measured: Measured | null = useMemo(() => {
    if (!safety.consentBodyAt || weighInsOff(safety) || !canCalculate(personal)) return null;
    return measure({ days: daysFromLines(daysOut()), weighIns: personal.weighIns, today: dayTick, start: startOf(goal, goalLog) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.feedback, planned, personal, safety, goal?.setAt, goalLog, dayTick]);
  const formulaKcal = useMemo(() => {
    const { formula, measuredUse, ...rest } = personal; void measuredUse;
    const pin = profile.formula === "data" ? null : profile.formula ?? null;
    return calculate(formula === "data" ? rest : { ...rest, ...(formula ? { formula } : {}) }, "maintain", pin)?.kcal ?? null;
  }, [personal, profile.formula]);
  function measuredOut() { return measured ? { ...measured, formulaKcal } : null; }
  const [measuredSeen, setMeasuredSeen] = useState(() => { try { return localStorage.getItem("chefmealan-measured-seen") ?? ""; } catch { return ""; } });
  const [calcFormula, setCalcFormula] = useState<import("./personal").Formula | null>(null);
  useEffect(() => { if (!goalOpen) setCalcFormula(null); }, [goalOpen]);
  // the coach pinned From your data: the measured burn of that day is the one in use, until the coach picks again (FT7)
  useEffect(() => {
    if (profile.formula !== "data" || personal.measuredUse) return;
    const fx = fixedOf(measured);
    if (fx) { const next = { ...getPersonal(), measuredUse: fx }; storePersonal(next); setPersonalState(next); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.formula, measured?.ready]);
  // apply a goal now: the goal, its numbers and the formula picked in the calculator; a waiting goal that starts now goes
  function applyGoalNow(x: Omit<NextGoal, "from" | "at">) {
    nextSource.current = x.source;
    saveGoal({ band: x.band, setBy: x.setBy, setAt: new Date().toISOString(), source: x.source, method: x.method, ...(x.setBy === "coach" ? { coachName: profile.coachName } : {}) });
    setGoalState(getGoal());
    setState((s) => ({ ...s, goals: { ...s.goals, calories: x.kcal, protein: x.protein, fats: x.fats, carbs: x.carbs } }));
    const cur = getPersonal();
    const { nextGoal, formula, ...rest } = cur;
    const starts = nextGoal && nextGoal.from <= ymd(new Date());
    const next: Personal = { ...rest, ...(starts ? {} : nextGoal ? { nextGoal } : {}), ...(x.formula === undefined ? (formula ? { formula } : {}) : x.formula ? { formula: x.formula } : {}) };
    // From your data (0.2.7, board FT, FT5): the measured burn applied with the goal stays fixed until applied again
    if (x.formula === "data" && x.measured) next.measuredUse = x.measured;
    else if (x.formula !== undefined && x.formula !== "data") delete next.measuredUse;
    storePersonal(next); setPersonalState(next);
  }
  // a reload on Clients stays there; once the account is known and is not a coach's, Today instead
  useEffect(() => { if ((profileReady || (authReady && !user)) && tab === "clients" && profile.role !== "coach") setTab("home"); }, [profileReady, authReady, user, profile.role, tab]);
  // numbers calculated from the profile follow the profile; before the first paint, so Today never shows ? and then jumps (T5)
  useLayoutEffect(() => {
    if (goal?.source !== "profile" || !goal.band) return;
    const r = calculate(personal, goal.band, profile.formula ?? null);
    if (!r || (r.kcal === state.goals.calories && r.protein === state.goals.protein)) return;
    nextSource.current = "profile";
    saveGoal({ ...goal, method: r.method, setAt: new Date().toISOString() }); setGoalState(getGoal());
    setState((s) => ({ ...s, goals: { ...s.goals, calories: r.kcal, protein: r.protein } }));
    notify(`Your numbers changed with your profile. An average day is now ${r.kcal.toLocaleString("en")} kcal and ${r.protein} g protein.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personal, profile.formula]);
  // a goal band with missing numbers heals itself from the band, before the first paint (T5)
  useLayoutEffect(() => {
    const b = goal?.band ? bandOf(goal.band) : null;
    if (b && (state.goals.calories == null || state.goals.protein == null)) {
      const g = goalsForBand(b);
      setState((s) => ({ ...s, goals: { ...s.goals, calories: s.goals.calories ?? g.calories, protein: s.goals.protein ?? g.protein } }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal, state.goals.calories, state.goals.protein]);
  // every change goes to the account, a second after it settles
  useEffect(() => {
    if (!user || !cloudLoaded.current) return;
    const t = setTimeout(() => {
      saveCloud(user.uid, { ...blockOf(state), goal: getGoal(), clientName, personal: getPersonal(), goalLog: getGoalLog(), safety: getSafety(), goneFoods: getGone(), days: daysOut(), measured: measuredOut(), updatedAt: new Date().toISOString() })
        .then(async () => {
          setCloudStatus({ ok: true, text: "Saved to your account", at: new Date().toISOString() });
          // foods, recipes and cards: only the records that changed (storage release 2)
          void syncRecords(false);
          // photos go up as files, by the photo sync: see syncFiles
          void syncFiles();
        })
        .catch((e) => setCloudStatus({ ok: false, text: `Not saved: ${explainCloudError(e)}` }));
    }, 1000);
    return () => clearTimeout(t);
  }, [state, goal, clientName, personal, goalLog, safety, user, planned]);
  async function api(url: string, body?: unknown) {
    const res = await fetch(url, {
      method: body === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json" },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(65000),
    });
    const data = await res
      .json()
      .catch(() => ({ error: "The server returned an unreadable response." }));
    if (!res.ok) throw new Error(data.error || "Request failed.");
    return data;
  }
  useEffect(() => {
    api("/api/status")
      .then(setServices)
      .catch(() => {});
  }, [access]);
  // from a recipe page into the app, at a tab's address; the address bar decides what shows (canvas R2, C5)
  const goApp = (t: Tab) => { history.pushState({ tab: t }, "", pathOfTab(t)); setPagePath(location.pathname); setTab(t); };
  useEffect(() => { const f = () => setPagePath(location.pathname); window.addEventListener("popstate", f); return () => window.removeEventListener("popstate", f); }, []);
  // every tab and every Plate step opens at the top, before the first paint, as the Menu pages already do (0.2.5+r9)
  const firstScroll = useRef(true);
  useLayoutEffect(() => { if (firstScroll.current) { firstScroll.current = false; return; } try { window.scrollTo(0, 0); document.querySelector("main")?.scrollTo?.(0, 0); } catch {} }, [tab, step]);
  const notify = (s: string) => {
    setMessage(s);
    setError("");
  };
  function blank(name = "", brand = "", from = "", barcode = "") {
    setEditTitle(""); setDbPhotos([]);
    setImage("");
    setImageSet([]);
    setEditFrom(from);
    setEdit(candidateFood({ product_name: name, brand, ...(barcode ? { barcode } : {}) }, "Manual entry"));
  }
  function saveFood(f0: Food, opts?: { open?: boolean; plate?: boolean }) {
    const existed = state.foods.some((x) => x.id === f0.id);
    // an AI label read, saved: kept when the four numbers are the ones the AI read (0.2.5+r17, board M, label reads kept)
    if (edit && !existed && /photo/i.test(String(edit.source ?? ""))) {
      const same = (["calories", "protein", "fats", "carbs"] as const).every((k) => (edit as any)[k] === (f0 as any)[k]);
      log("label_read", { kept: same });
    }
    // a food new to the library says when it came, so the list can mark it New for the rest of the day (canvas C5)
    const f = existed || (f0 as any).addedAt ? f0 : ({ ...f0, addedAt: new Date().toISOString() } as Food);
    setImage(""); setImageSet([]); setDbPhotos([]);
    setState((s) => ({
      ...s,
      foods: s.foods.some((x) => x.id === f.id)
        ? s.foods.map((x) => (x.id === f.id ? f : x))
        : [f, ...s.foods],
      items: repoint(s.items, f.id, f),
    }));
    // Where does this go (0.2.5): a scan from Today asks after the save, new food or updated
    if (scanFrom === "today") { setScanFrom(null); setCamera(false); setEdit(null); setImageSet([]); setPending((p) => p.filter((x) => x.name !== f.name || x.brand !== f.brand)); setWhere(f); return; }
    // DT82 (Marko, 23 October 2026): Scan or Manual on the Plate puts the food on the plate and keeps it in My foods, as
    // decided in 0.2.25 (RP5); a food already on the plate is only updated there
    if (opts?.plate) { setEdit(null); setImageSet([]); setPending((p) => p.filter((x) => x.name !== f.name || x.brand !== f.brand)); if (!state.items.some((i) => i.food.id === f.id)) add(f); else notify(`Updated ${f.name}.`); return; }
    if (existed && f.reviewedAt) { setEdit(null); setImageSet([]); notify(`Updated ${f.name}.`); return; }
    setEdit(null);
    setPending((p) =>
      p.filter((x) => x.name !== f.name || x.brand !== f.brand),
    );
    // journey invariant (Milan, 7 October 2026): a new food added on Foods opens its card, so you see what was saved
    if (opts?.open) { setOpenFoodId(f.id); setTab("foods"); notify(`${f.name} is in your foods.`); return; }
    notify(`${f.name} is in your foods.`);
  }
  function add(food: Food) {
    log("food_in", { way: food.barcode ? "barcode" : food.source === "label" ? "label" : food.source === "manual" ? "manual" : "saved", source: food.source });
    setState((s) => ({
      ...s,
      items: [
        ...s.items,
        // R22 (0.2.50): with Both picked, a food goes into the main or the sweet finish
        // DT82 (Marko's tuna, 0.9 cans): a food the pack sells as one piece goes on as one, 1 can, 1 bar, 1 pot
        { id: uid(), food: { ...food }, grams: food.serving ? food.serving.grams : (density(food.protein, food.calories) ?? 0) < 3 ? 50 : 150, locked: false, ...(plateTaste === "both" ? { part: bothPartOf(food.name) } : {}) },
      ],
      portion: null,
    }));
    setStep("in");
    setTab("journey");
    notify(food.serving ? `Added: 1 ${food.serving.name}, ${fmt(food.serving.grams, 0)} g. Set the amount you actually have.` : "Added. Set the amount you actually have.");
  }
  // the photo that shows the front goes first: it becomes the main photo and the card's picture
  const frontFirst = (images: string[], front: number) => { const i = Number(front) - 1; return i > 0 && i < images.length ? [images[i], ...images.filter((_, j) => j !== i)] : images; };
  async function scan(raw: string | string[], group = false, barcode?: string) {
    const run = ++runRef.current;
    setDbPhotos([]);
    setBusy(group ? "Identifying products…" : "Reading label…");
    setError("");
    setCamera(false);
    try {
      const images = await Promise.all(
        (Array.isArray(raw) ? raw : [raw])
          .slice(0, 6)
          .map((x) => resizeImageBase64(x, 1800, 1800)),
      );
      const data = await api("/api/scan", {
        images,
        mode: group ? "group" : "label",
        ...(barcode ? { barcode } : {}),
      });
      if (run !== runRef.current) return;
      if (group) {
        const entities = Array.isArray(data?.entities) ? data.entities : [];
        log("food_in", { way: "group", products: entities.length });
        const read = (x: any) => x && x.calories !== null && x.protein !== null;
        if (entities.length === 1 && read(entities[0])) {
          // one product from several sides: read it again as a label, which transcribes every printed line; the group read keeps name, brand and the front
          let one = entities[0];
          try {
            const lab = await api("/api/scan", { images, mode: "label" });
            if (run !== runRef.current) return;
            if (lab?.success && (lab.table?.length ?? 0) > (one.table?.length ?? 0)) one = { ...one, table: lab.table, calories: one.calories ?? lab.calories, protein: one.protein ?? lab.protein, fats: one.fats ?? lab.fats, carbs: one.carbs ?? lab.carbs, fiber: one.fiber ?? lab.fiber, front_image: one.front_image || lab.front_image };
          } catch { /* the group read stands */ }
          const ordered = frontFirst(images, one.front_image);
          setImage(ordered[0]);
          setImageSet(ordered);
          setEdit(candidateFood(one, "Photos · review required"));
        } else {
          setPending(entities.map((x: any) => ({ name: x.product_name || "Unknown item", brand: x.brand || "", values: read(x) ? x : undefined })));
          setTab("foods");
          notify(entities.some(read) ? "Products found. Review the ones with values read, enter the others." : "Products found. Enter each label, or photograph its nutrition table.");
        }
      } else {
        if (!data.success)
          throw new Error(
            data.error_reason ||
              "Label could not be read. Try another photo or enter it manually.",
          );
        const ordered = frontFirst(images, data.front_image);
        setImage(ordered[0]);
        setImageSet(ordered);
        setEdit(candidateFood(barcode ? { ...data, barcode } : data, barcode ? "Barcode and photos · review required" : "Label photo · review required"));
      }
    } catch (e: any) {
      if (run === runRef.current)
        setError(
          e.message || "Scan failed. Your saved foods and meal are unchanged.",
        );
    } finally {
      if (run === runRef.current) setBusy("");
    }
  }
  // Canvas board C8 (8 October 2026): after a barcode, the database's photos of the pack (front, nutrition table) come
  // through our server; the nutrition photo is read to add the lines the database lacks, never to change its own values.
  async function dbPhotosOf(d: any): Promise<{ front?: string; nutrition?: string }> {
    const out: { front?: string; nutrition?: string } = {};
    await Promise.all((Array.isArray(d?.photos) ? d.photos : []).slice(0, 2).map(async (x: any) => {
      try { const r = await api(`/api/offphoto?u=${encodeURIComponent(x.url)}`); if (r?.data && (x.kind === "front" || x.kind === "nutrition")) out[x.kind as "front" | "nutrition"] = r.data; } catch { /* no photo: fine */ }
    }));
    return out;
  }
  async function withPhotoLines(d: any, nutrition: string | undefined, code: string) {
    if (!nutrition) return d;
    try {
      const img = await resizeImageBase64(nutrition, 1800, 1800);
      const r = await api("/api/scan", { images: [img], mode: "label", barcode: code });
      if (r?.success && Array.isArray(r.table) && r.table.length) return { ...d, table: withPackLines(rowsFromRaw(d.table ?? [], "database"), rowsFromRaw(r.table, "photo")) };
    } catch { /* the database's lines stand */ }
    return d;
  }
  async function lookup(code = barcode) {
    if (!/^\d{8,14}$/.test(code.trim())) {
      setError("Enter a numeric barcode with 8–14 digits.");
      return;
    }
    const run = ++runRef.current;
    setBusy("Looking up product…");
    setCamera(false);
    setError("");
    setImage("");
    setImageSet([]);
    setDbPhotos([]);
    try {
      const local = state.foods.find((f) => f.barcode === code.trim());
      // DT82: a code scanned on the Plate for a food you have puts it on the plate (decided in 0.2.25, RP5)
      if (local && tab === "journey") { setCamera(false); add(local); }
      else if (local) {
        setOpenFoodId(local.id);
        setTab("foods");
        notify("Already in your foods.");
      } else {
        const d0 = await api(`/api/product/${code.trim()}`);
        if (run !== runRef.current) return;
        const ph = await dbPhotosOf(d0);
        if (run !== runRef.current) return;
        if (ph.nutrition) setBusy("Reading the nutrition photo…");
        const d = await withPhotoLines(d0, ph.nutrition, code.trim());
        if (run !== runRef.current) return;
        setDbPhotos([ph.front, ph.nutrition].filter(Boolean) as string[]);
        setEdit(
          candidateFood(d, d.source || "Product database · review required"),
        );
      }
    } catch (e: any) {
      if (run === runRef.current) { setError(e.message); setEditTitle(""); }
    } finally {
      if (run === runRef.current) setBusy("");
    }
  }
  // A barcode plus the pack's photos: the database answers by code, the photos fill what it lacks (name, front, table lines).
  // No database row: the photos are read as a label scan and the code travels with the food.
  async function lookupWithPhotos(code: string, images: string[]) {
    const c = code.trim();
    const local = state.foods.find((f) => f.barcode === c);
    if (local && tab === "journey") { setCamera(false); add(local); return; }
    if (local) { setCamera(false); setOpenFoodId(local.id); setTab("foods"); notify("Already in your foods."); return; }
    const run = ++runRef.current;
    setBusy("Looking up product…"); setError(""); setCamera(false);
    let db: any = null;
    try { db = await api(`/api/product/${c}`); } catch { db = null; }
    if (run !== runRef.current) return;
    if (!db) { setBusy(""); await scan(images, false, c); return; }
    const ph = await dbPhotosOf(db);
    if (run !== runRef.current) return;
    let read: any = null, resized: string[] = [];
    try { resized = await Promise.all(images.slice(0, 6).map((x) => resizeImageBase64(x, 1800, 1800))); } catch { resized = []; }
    if (resized.length) {
      try { const d = await api("/api/scan", { images: resized, mode: "label", barcode: c }); if (d?.success) read = d; } catch { read = null; }
      if (run !== runRef.current) return;
    }
    const merged = { ...db };
    if (read) {
      for (const k of ["product_name", "brand", "calories", "protein", "fats", "carbs", "fiber", "notes"]) if (merged[k] === null || merged[k] === undefined || merged[k] === "") merged[k] = read[k];
      // the pack's printed lines win over the database's where the database has fewer
      if ((read.table?.length ?? 0) > (merged.table?.length ?? 0)) merged.table = read.table;
      // the pack's lines the database lacks (sugar alcohols, often) are added to the database's (Milan, 8 October 2026)
      else if (read.table?.length) merged.table = withPackLines(rowsFromRaw(merged.table ?? [], "database"), rowsFromRaw(read.table, "label"));
    }
    const withLines = read ? merged : await withPhotoLines(merged, ph.nutrition, c);
    if (run !== runRef.current) return;
    const ordered = frontFirst(resized, read?.front_image ?? 0);
    setImage(ordered[0] ?? ""); setImageSet(ordered);
    setDbPhotos([ph.front, ph.nutrition].filter(Boolean) as string[]);
    setEdit(candidateFood({ ...withLines, barcode: c }, db.source || "Product database and photos · review required"));
    setBusy("");
  }
  function updateItem(id: string, patch: Partial<Ingredient>) {
    setState((s) => ({
      ...s,
      items: s.items.map((x) => (x.id === id ? { ...x, ...patch } : x)),
      portion: null,
    }));
  }
  function saveMeal() {
    log("meal_saved", { items: state.items.length });
    const t = aggregate(state.items),
      p = state.portion ?? t.weight;
    if (!p || p > t.weight) {
      setError("Set a valid portion before saving.");
      return;
    }
    const meal: Meal = {
      id: uid(),
      title: state.title || "My meal",
      items: structuredClone(state.items),
      portion: p,
      savedAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, meals: [meal, ...s.meals] }));
    notify("Recipe saved. It has not been recorded as eaten.");
  }
  // Today's four numbers: the week's average, unless each day has its own and today's day is picked; then that day's row,
  // calculated from the profile, or the coach's or the person's own numbers for that day.
  // The same for any day (0.2.1): Plan shows the numbers of the day it looks at.
  function todayNumbers(): { kcal: number; protein: number; fats: number; carbs: number } | null { return numbersOfDay(day); }
  // any date (board FX): a day gone by keeps its own target; a date from a waiting goal's start uses that goal
  function numbersOfDate(date: Date): { kcal: number; protein: number; fats: number; carbs: number } | null {
    const k = ymd(date), today = ymd(new Date());
    const kept = personal.targets?.[k];
    if (k < today && kept) return kept;
    const ng = personal.nextGoal;
    if (ng && k >= ng.from) {
      const per: Personal = ng.formula === undefined ? personal : (() => { const { formula, ...r } = personal; void formula; return ng.formula ? { ...r, formula: ng.formula, ...(ng.formula === "data" && ng.measured ? { measuredUse: ng.measured } : {}) } : r; })();
      return numbersOfDay(getDay(per, date), { calories: ng.kcal, protein: ng.protein, fats: ng.fats, carbs: ng.carbs }, { band: ng.band, source: ng.source, setBy: ng.setBy, setAt: ng.at }, per);
    }
    return numbersOfDay(getDay(personal, date));
  }
  function numbersOfDay(day: Day, gIn?: { calories: number | null; protein: number | null; fats?: number | null; carbs?: number | null }, goalIn?: typeof goal, personalIn?: Personal): { kcal: number; protein: number; fats: number; carbs: number } | null {
    const g = gIn ?? state.goals, goal = goalIn ?? goalNow, personal = personalIn ?? personalNow;
    if (g.calories == null || g.protein == null) return null;
    const fats = g.fats ?? macroSplit(g.calories, g.protein).fats;
    const avg = { kcal: g.calories, protein: g.protein, fats, carbs: g.carbs ?? macroSplit(g.calories, g.protein, fats).carbs };
    if (dayModeOf(personal) !== "each" || !day.type) return avg;
    const bandId = goal?.band ?? "maintain";
    // own numbers: the row of today's load; calculated: today's planned day itself, its activity, intensity and minutes
    if (goal?.source === "exact" || goal?.source === "coach") {
      const o = ownDayNumbers(personal, bandId, profile.formula ?? null);
      if (!o) return avg;
      const d = o.days[day.type]; return { kcal: d.kcal, protein: d.protein, fats: d.fats, carbs: d.carbs };
    }
    const c = calculate(personal, bandId, profile.formula ?? null);
    if (!c) return avg;
    const d = day.plan ? c.numbersOf(day.plan) : c.days[day.type];
    // a goal not calculated from the profile (a quick goal) keeps its own numbers: protein and fat as set, the day's energy
    // moves with the training as the profile says, the carbs take the difference (0.2.5+r18: Today said 180 g protein, Me 105 g)
    if (goal?.source !== "profile") {
      const kcal = Math.round((avg.kcal * d.kcal) / (c.kcal || d.kcal));
      return { kcal, protein: avg.protein, fats: avg.fats, carbs: macroSplit(kcal, avg.protein, avg.fats).carbs };
    }
    return { kcal: d.kcal, protein: d.protein, fats: d.fats, carbs: d.carbs };
  }
  function todayKcalOf(): number | null { return todayNumbers()?.kcal ?? state.goals.calories ?? null; }
  function mix(id: string = adjustId): boolean { return mixWith(state.items, id); }
  // the dessert's share of the day: a tenth of today's energy, no more than what is left, never under 100 kcal
  function dessertKcal(): number {
    const day = todayKcalOf(); if (!day) return 300;
    const todayStr = new Date().toDateString();
    const eaten = state.feedback.filter((f) => f.status !== "not-used" && new Date(f.createdAt).toDateString() === todayStr)
      .reduce((a, f) => a + f.meal.items.reduce((t, i) => t + ((i.food.calories ?? 0) * i.grams) / 100, 0), 0);
    return Math.max(100, Math.min(Math.round(day * 0.1), Math.max(100, day - eaten)));
  }
  function mixWith(itemsIn: Ingredient[], id: string): boolean {
    setError("");
    // the target the Plate shows (pdRef): a slot's day when filling one, else the moment's (12 October 2026: Fit aimed at
    // its own number, the time of day and the average protein, so a slot's plate fell short of the slot's target)
    const target = pdRef;
    if (target === null || target <= 0) {
      setError("Set daily energy and protein targets first.");
      return false;
    }
    const selected = itemsIn.find((x) => x.id === id);
    if (!selected || selected.locked) {
      setError("Let Chef Mealan move one product. Everything else stays as you set it.");
      return false;
    }
    if (
      !selected.food.readyToEat ||
      itemsIn.some((x) => !x.food.readyToEat)
    ) {
      setError("Chef Mealan mixes foods you can eat as they are.");
      return false;
    }
    if (
      Object.values(limits).some(
        (x) => x.trim() !== "" && numberInput(x) === null,
      )
    ) {
      setError("Meal limits must be non-negative numbers, or blank.");
      return false;
    }
    const max = numberInput(limits.maxWeight),
      minP = numberInput(limits.minProtein),
      maxE = numberInput(limits.maxKcal);
    // a dessert (Y1, 10 October 2026) takes about a tenth of the day, from what is left of it; never under 100 kcal so a real portion fits
    const dessertCap = kind === "dessert" ? dessertKcal() : null;
    let reason = "No candidate meets the selected constraints.";
    // the person's food first and always; a swap is only offered when it goes with the rest of the plate, and a drink never is
    const others = itemsIn.filter((x) => x.id !== id).map((x) => x.food);
    const foods = [
      selected.food,
      ...state.foods.filter((f) => f.id !== selected.food.id && f.readyToEat && catOf(f) !== "drink" && plateOk([...others, f])),
    ];
    const results = [];
    for (const food of foods) {
      const candidate = itemsIn.map((x) =>
          x.id === id ? { ...x, food } : x,
        ),
        s = solveIngredient(candidate, id, target, max);
      if (s.ok === false) {
        if (food.id === selected.food.id) {
          // already on plan: the plate as it stands is on or above the target, so nothing moves and nothing is swapped
          const as = aggregate(itemsIn), pdNow = density(as.protein, as.calories);
          if (pdNow !== null && pdNow >= target) { results.push({ food, items: itemsIn, grams: selected.grams }); continue; }
          reason = s.reason;
        }
        continue;
      }
      // a real portion: if the target is met with less than the food's minimum portion, the minimum stands and the plate lands above the target
      const floor = minPortionOf(food);
      let grams = Math.max(s.grams, floor);
      let solved = grams === s.grams ? s.items : s.items.map((x) => (x.id === id ? { ...x, grams } : x));
      if (dessertCap !== null) {
        // over the dessert's share: the mover comes down to the cap, the dessert lands under the protein target and says so
        const over = (aggregate(solved).calories ?? 0) - dessertCap, perG = (food.calories ?? 0) / 100;
        if (over > 0 && perG > 0) { grams = Math.max(floor, Math.round(grams - over / perG)); solved = solved.map((x) => (x.id === id ? { ...x, grams } : x)); }
      }
      if (max !== null && solved.reduce((a, x) => a + x.grams, 0) > max) continue;
      const t = aggregate(solved);
      if (
        (minP !== null && (t.protein === null || t.protein < minP)) ||
        (maxE !== null && (t.calories === null || t.calories > maxE))
      )
        continue;
      results.push({ food, items: solved, grams });
    }
    setOptions(results.slice(0, 8));
    if (!results.length)
      setError(reason + " You can change a limit or choose another food.");
    return results.length > 0;
  }
  async function personalize() {
    setBusy("Considering your taste preferences…");
    try {
      const data = await api("/api/chef", {
        preferences: state.preferences,
        feedback: state.feedback
          .slice(0, 5)
          .map((f) => ({ meal: f.meal.title, taste: f.taste, notes: f.notes })),
        candidates: options.map((o) => ({
          id: o.food.id,
          name: o.food.name,
          brand: o.food.brand,
          grams: o.grams,
          ingredients: o.items.map((i) => ({
            name: i.food.name,
            grams: i.grams,
          })),
        })),
      });
      const suggestions = Array.isArray(data?.suggestions) ? data.suggestions : [];
      setOptions((current) =>
        suggestions
          .map((r: any) => {
            const o = current.find((c) => c.food.id === r.id);
            return o ? { ...o, explanation: r.reason } : null;
          })
          .filter(Boolean),
      );
      notify(
        "Suggestions ranked from the calculated options. Check ingredients and taste before choosing.",
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }
  function exportData() {
    const url = URL.createObjectURL(
      new Blob([unreadableBackup ?? JSON.stringify(state, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `chefmealan-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  setPdUnit(personal.pdUnit);
  setUnits(personal.units);
  const ai = aiState(safety, personal.birthYear, Boolean(profile.coachId) || profile.role === "coach");
  const updateSafety = (fn: (s: Safety) => Safety) => { const next = fn(getSafety()); storeSafety(next); setSafetyState(next); };
  // A cover drawn by Chef Mealan (0.2.11, board CO, CO1; 0.2.18, board IM, IM11): a recipe kept without a photo gets one
  // try, right away, one recipe at a time. A try that doesn't draw waits for Draw a picture on the recipe page, with the
  // day's count in sight: nothing runs later on its own. The server keeps the counts: one per recipe, ten a day per member.
  const coverBusy = useRef(false);
  const [coverDrawing, setCoverDrawing] = useState<string | null>(null);
  const [coverCount, setCoverCount] = useState<{ used: number; limit: number } | null>(null);
  const refreshCoverCount = () => { if (!ai.on || (cloudEnabled && !user)) return; void fetch("/api/cover/today").then((r) => (r.ok ? r.json() : null)).then((d) => { if (d && typeof d.used === "number") setCoverCount({ used: d.used, limit: d.limit }); }).catch(() => { /* the count shows when it comes */ }); };
  const drawCover = async (m: Meal) => {
    if (coverBusy.current) return;
    coverBusy.current = true; setCoverDrawing(m.id);
    const today = ymd(new Date());
    let cover: NonNullable<Meal["cover"]> = { state: "failed", day: today }, photo: string | undefined;
    try {
      const r = await fetch("/api/cover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipeId: m.id, title: m.title, items: m.items.filter((i) => i.grams > 0).map((i) => ({ name: i.food.name, grams: i.grams })) }), signal: AbortSignal.timeout(90000) });
      const d = await r.json().catch(() => ({}));
      if (r.ok && typeof d.used === "number") setCoverCount({ used: d.used, limit: d.limit });
      if (r.ok && typeof d.image === "string") { photo = await resizeImageBase64(d.image, 960, 720).catch(() => d.image); cover = { state: "drawn", day: today }; }
      else if (r.ok && d.tomorrow) cover = { state: "tomorrow", day: today };
      else if (r.ok && d.already) cover = { state: "drawn", day: today };
    } catch { /* not drawn; Draw a picture tries again */ }
    setState((s) => ({ ...s, meals: s.meals.map((x) => (x.id !== m.id ? x : recipeHasPhotos(x) || !photo ? { ...x, cover } : { ...x, cover, photo, photos: [], coverSig: sig(photo) })) }));
    if (photo) log("cover", { how: "drawn" });
    coverBusy.current = false; setCoverDrawing(null);
  };
  useEffect(() => {
    if (!ai.on || coverBusy.current || (cloudEnabled && !user)) return;
    // a recipe whose cards already hold a real plate photo shows that photo, so it never gets a drawing
    const m = state.meals.find((x) => needsCover(x) && !cardHasPhoto(x, state.feedback));
    if (m) void drawCover(m);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.meals, ai.on, user]);
  // code signal: a custom goal under the body's resting burn, or a loss faster than 1 percent a week, raises a flag
  useEffect(() => {
    if (!goal || goal.source !== "exact" || state.goals.calories === null || !canCalculate(personal)) return;
    const c = calculate(personal, goal.band ?? "recomp", profile.formula ?? null);
    if (!c) return;
    const sig = goalSignals(true, state.goals.calories, c.bmr, c.tdee, personal.weightKg ?? null);
    if (sig.flag) { updateSafety((x) => addFlag(x, "eating", "code")); log("safety_flag", { situation: "eating", source: "code", reasons: sig.reasons }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal?.setAt, state.goals.calories]);
  const totals = aggregate(state.items),
    todayKcal = todayKcalOf(),
    dayPd = density(todayNumbers()?.protein ?? state.goals.protein, todayKcal),
    // a plate for a slot aims at that slot's day, the target Plan judges it by; otherwise the moment's (12 October 2026:
    // filling breakfast after midnight fitted to the late-night target, and Plan then showed the meal under)
    slotDay = filling ? (() => { const [y, m, d] = filling.date.split("-").map(Number); return numbersOfDay(getDay(personal, new Date(y, m - 1, d, 12))); })() : null,
    pdRef = filling ? (slotDay ? density(slotDay.protein, slotDay.kcal) : dayPd) : momentTarget(moment, dayPd);
  const selected = portionTotals(state.items, state.portion);
  const matched =
    selected.calories !== null &&
    selected.protein !== null &&
    pdRef !== null &&
    Math.abs(density(selected.protein, selected.calories)! - pdRef) <= 0.05;
  const screenProps: AppApi = {
    state, setState, setCamera, setMode, blank, add, updateItem,
    saveMeal, mix, personalize, lookup, exportData, notify, setError, setBusy,
    api, setImage, setEdit, setGoalsOpen, setAccessOpen, setReviewMeal,
    setFeedback, setAdjustId, adjustId, limits, setLimits, options, pending,
    setPending, barcode, setBarcode, query, setQuery, busy, services, totals,
    pdRef, dayPd, kind, setKind, plateTaste, setPlateTaste, moment, setMoment: (m: MomentId) => setMomentState(m), pick, setPick, usual, setUsual: (ids: RhythmId[]) => { setUsual(ids); setUsualState(ids); },
    region, setRegion: (r: RegionId) => { setRegion(r); setRegionState(r); },
    travelTo, setTravelTo: (r: RegionId | null) => { setTravelTo(r); setTravelToState(r); },
    personal, setPersonal: (x: Personal) => { storePersonal(x); setPersonalState(x); },
    addFoodPhoto: async (foodId: string, dataUrl: string) => {
      // photos taken on another phone that haven't arrived yet: adding now would take the place of one of them
      const f0 = stateRef.current.foods.find((f) => f.id === foodId) as any;
      if (f0 && !f0.photos?.length && !f0.photo && ((f0.photoSigs ?? []).some(Boolean) || (f0.photoCount ?? 0) > 0)) {
        void pullFiles(); setError("This food's photos are still coming from your account. Try again in a moment."); return;
      }
      const [thumb, big] = await Promise.all([thumbnailBase64(dataUrl).catch(() => ""), resizeImageBase64(dataUrl, 900, 900).catch(() => "")]);
      if (!big) { setError("This photo could not be read. Try another one."); return; }
      // a food's picture stays its first photo (journey invariant, 5 October 2026: the picture plus the added photos); a
      // drawn picture is not a photo, so the first real photo added becomes the main one and the picture (board C9)
      setState((s) => ({ ...s, foods: s.foods.map((f) => {
        if (f.id !== foodId) return f;
        const had = realPhotosOf(f);
        return { ...f, photo: (had.length && f.photo && !isDrawn(f.photo) ? f.photo : thumb) || undefined, photos: [...had, big].slice(0, 6) };
      }) }));
      notify("Photo added.");
    },
    openFoodId, clearOpenFood: () => setOpenFoodId(null),
    // 0.2.56 (board DS4, F): open one food in Foods, from the note under Today's numbers
    openFood: (id: string) => { setMenuSection(null); setOpenFoodId(id); setTab("foods"); },
    setFoodJob: (foodId: string, job: string | null) => {
      setState((s) => ({ ...s, foods: s.foods.map((x) => (x.id === foodId ? { ...x, job: job || undefined } : x)) }));
      notify(job ? `Labelled ${job.toLowerCase()}.` : "Back to Chef Mealan's label.");
    },
    eatenTodayKcal: (() => {
      const today = new Date().toDateString();
      return state.feedback.filter((f) => f.status !== "not-used" && new Date(f.createdAt).toDateString() === today)
        .reduce((s, f) => s + f.meal.items.reduce((t, i) => t + ((i.food.calories ?? 0) * i.grams) / 100, 0), 0);
    })(),
    dayName: dayModeOf(personal) === "each" && day.type ? dayNameOf(day.type) : "Today",
    tipGoalKey: `${goal?.band ?? "none"}|${pdRef ?? "none"}|pb1`,
    requestTip: async (foodId: string) => {
      if (!ai.on) { notify(ai.why || FIXED.off); return; }
      const f = state.foods.find((x) => x.id === foodId); if (!f) return;
      const key = `${goal?.band ?? "none"}|${pdRef ?? "none"}|pb1`;
      const { jobOf } = await import("./foodjob");
      const band = bandOf(goal?.band);
      const res = await api("/api/tip", {
        food: f, job: jobOf(f).job,
        goal: { name: band?.name ?? "no goal set", pdTarget: pdRef, kcalToday: todayKcalOf(), dayType: dayModeOf(personal) === "each" ? (day.type ?? "average") : "same every day" },
        moments: getUsual(), region,
        library: state.foods.filter((x) => x.id !== f.id).map((x) => ({ name: x.name, job: jobOf(x).job, pd: density(x.protein, x.calories) })),
      });
      setState((s) => ({ ...s, foods: s.foods.map((x) => (x.id === foodId ? { ...x, tip: { text: res.tip, pairs: res.pairs ?? [], goalKey: key, at: new Date().toISOString() } } : x)) }));
    },
    keepForLater: (meal: Meal, extra?: { photos?: string[]; prep?: Feedback["prep"]; status?: "prepared" | "not-used"; left?: number; leftOf?: string; recipeId?: string }) => {
      // a prepared card: it shows on Today until it's eaten or dropped; not eaten after all is a note, not counted
      const status = extra?.status ?? "prepared";
      setState((s) => ({ ...s, feedback: [{ id: uid(), meal, status, ...(extra?.left ? { left: extra.left } : {}), ...(extra?.recipeId ? { recipeId: extra.recipeId } : {}), ...(extra?.leftOf ? { leftOf: extra.leftOf } : {}), taste: "", notes: "", photos: extra?.photos?.length ? extra.photos : undefined, photo: extra?.photos?.length ? extra.photos[extra.photos.length - 1] : undefined, prep: extra?.prep, createdAt: new Date().toISOString(), dayType: dayModeOf(personal) === "each" && day.type ? day.type : undefined } as any, ...s.feedback] }));
      notify(status === "prepared" ? "Kept for later. It's on Today." : "Noted, not counted.");
    },
    logPlanned: (m: PlannedMeal, slot: NonNullable<Feedback["slot"]>) => {
      const now = new Date().toISOString(), meal = plannedPortion(m, m.mealId ?? uid(), now);
      if (!meal) return;
      setState((s) => ({ ...s, feedback: [{ id: uid(), meal, status: "eaten", slot, ...(m.mealId ? { recipeId: m.mealId } : {}), taste: "", notes: "", createdAt: now, dayType: dayModeOf(personal) === "each" && day.type ? day.type : undefined } as Feedback, ...s.feedback] }));
      notify("Logged, as planned.");
    },
    settleCard: (id: string, how: "eaten" | "not-used", as?: { slot?: Feedback["slot"]; which?: string }) => {
      // R5 (0.2.42): I ate one says which meal it was: a meal of the day keeps its slot, a snack says so
      const asMeal = how === "eaten" && as ? { ...(as.slot ? { slot: as.slot } : {}), ...(as.which ? { which: as.which } : {}) } : {};
      // portions left (0.2.20, IM19): eating one logs one and keeps the rest; Remove drops them all
      const card = state.feedback.find((f) => f.id === id);
      if (card && how === "eaten" && (card.left ?? 0) > 1) {
        const now = new Date().toISOString();
        setState((s) => ({ ...s, feedback: [{ ...structuredClone(card), id: uid(), status: "eaten", left: undefined, createdAt: now, taste: card.taste || "Good", ...asMeal }, ...s.feedback.map((f) => (f.id === id ? { ...f, left: (f.left ?? 1) - 1 } : f))] }));
        notify(`Logged. ${(card.left ?? 1) - 1} left.`); return;
      }
      setState((s) => ({ ...s, feedback: s.feedback.map((f) => (f.id === id ? { ...f, status: how, left: undefined, createdAt: how === "eaten" ? new Date().toISOString() : f.createdAt, taste: how === "eaten" ? f.taste || "Good" : f.taste, ...asMeal } : f)) }));
      notify(how === "eaten" ? "Logged." : "Dropped for today.");
    },
    toggleFavorite: (foodId: string) => {
      const f = state.foods.find((x) => x.id === foodId);
      setState((s) => ({ ...s, foods: s.foods.map((x) => (x.id === foodId ? { ...x, favorite: !x.favorite } : x)) }));
      notify(f?.favorite ? "Removed from favourites." : "Added to favourites: it shows first on the plate.");
    },
    removeFoodPhoto: (foodId: string, index: number) => {
      const f0 = state.foods.find((f) => f.id === foodId);
      const gallery = realPhotosOf(f0);
      const rest = gallery.filter((_, i) => i !== index);
      // the preview follows the first remaining photo (made small again), or goes back to the icon; an empty list stays
      // empty on purpose ([]), so its old photos leave the phone and the account too
      setState((s) => ({ ...s, foods: s.foods.map((f) => (f.id !== foodId ? f : { ...f, photos: rest, photo: index === 0 || !rest.length ? (rest[0] || undefined) : f.photo })) }));
      if (index === 0 && rest[0]) {
        const first = rest[0];
        thumbnailBase64(first).then((t) => { if (t) setState((s) => ({ ...s, foods: s.foods.map((f) => (f.id === foodId && f.photos?.[0] === first ? { ...f, photo: t } : f)) })); }).catch(() => {});
      }
      notify("Photo removed.");
    },
    // Make it the main photo (board C9): it moves to the front, and becomes the food's picture everywhere
    setMainPhoto: (foodId: string, index: number) => {
      const f0 = stateRef.current.foods.find((f) => f.id === foodId);
      const list = realPhotosOf(f0), chosen = list[index];
      if (!chosen || index === 0) return;
      setState((s) => ({ ...s, foods: s.foods.map((f) => (f.id !== foodId ? f : { ...f, photos: [chosen, ...list.filter((_, i) => i !== index)] })) }));
      thumbnailBase64(chosen).then((t) => { if (t) setState((s) => ({ ...s, foods: s.foods.map((f) => (f.id === foodId && f.photos?.[0] === chosen ? { ...f, photo: t } : f)) })); }).catch(() => {});
      notify("That's the main photo now.");
    },
    mergeInLibrary: (keepId: string, otherId: string, name: string) => {
      setState((s) => {
        const keep = s.foods.find((x) => x.id === keepId), other = s.foods.find((x) => x.id === otherId);
        if (!keep || !other) return s;
        const merged = mergeFoods(keep, other, name);
        return { ...s, foods: s.foods.filter((x) => x.id !== otherId).map((x) => (x.id === keepId ? merged : x)), items: repoint(repoint(s.items, otherId, merged), keepId, merged) };
      });
      notify("Merged into one food.");
    },
    goalLog, formula: profile.formula ?? null, todayKcal, dayType: day.type, day, setDayType: (d: DayType | null) => { const next = withDated(personal, new Date(), d ? dayOfLoad(d) : null); storePersonal(next); setPersonalState(next); setDayState(getDay(next)); },
    // today's plan, for this date only; the Training week stays
    setTodayPlan: (d: PlanDay | null) => { setTodayChange(null); const next = withDated(personal, new Date(), d); storePersonal(next); setPersonalState(next); setDayState(getDay(next)); },
    // a change for any date, from the Training week's dated weeks; null puts the date back on the usual week
    setDated: (date: Date, d: PlanDay | null) => { const next = withDated(personal, date, d); storePersonal(next); setPersonalState(next); setDayState(getDay(next)); },
    applyNumbers: (bandId: string, kcal: number, protein: number, method?: string, fatsIn?: number, carbsIn?: number) => {
      nextSource.current = "profile";
      saveGoal({ band: bandId, setBy: "you", setAt: new Date().toISOString(), source: "profile", method });
      setGoalState(getGoal());
      setState((s) => ({ ...s, goals: { ...s.goals, calories: kcal, protein, ...(fatsIn != null && carbsIn != null ? { fats: fatsIn, carbs: carbsIn } : macroSplit(kcal, protein)) } }));
    },
    // today's four: protein and fat stay, the carbs take the day's difference
    todayMacros: todayNumbers(),
    numbersFor: (date: Date) => numbersOfDate(date),
    // DT75: the person's protein range, g per kg times weight, the same every day; null without a profile to calculate it
    proteinRange: (() => { const c = calculate(personalNow, goalNow?.band ?? "maintain", profile.formula ?? null); return c ? { min: c.proteinMin, max: c.proteinMax } : null; })(),
    coachNotes: coachThread.notes, checkinDay: coachThread.checkinDay,
    gotNote: (at: string) => saveNotes(coachThread.notes.map((n) => (n.at === at ? { ...n, readAt: new Date().toISOString() } : n))),
    replyToCoach: (text: string, read?: string) => saveNotes([...coachThread.notes.map((n) => (n.at === read ? { ...n, readAt: new Date().toISOString() } : n)), { at: new Date().toISOString(), by: "client", text }]),
    measured, formulaKcal, calcFormula,
    measuredSeen: !!measured?.start && measuredSeen === measured.start,
    seeMeasured: () => { const k = measured?.start ?? ""; try { localStorage.setItem("chefmealan-measured-seen", k); } catch {} setMeasuredSeen(k); },
    useMyData: () => { setCalcFormula("data"); setGoalOpen(true); },
    applyGoal: (x: Omit<NextGoal, "from" | "at">, from: string) => {
      if (from <= ymd(new Date())) { applyGoalNow(x); return; }
      const next: Personal = { ...getPersonal(), nextGoal: { ...x, from, at: new Date().toISOString() } };
      storePersonal(next); setPersonalState(next);
    },
    cancelNextGoal: () => { const { nextGoal, ...rest } = getPersonal(); void nextGoal; storePersonal(rest); setPersonalState(rest); },
    openMenu: (s?: MenuSection, from?: MenuSection) => { setMenuFrom(from ?? null); setMenuSection(s ?? "list"); },
    foodsView, setFoodsView, saveFood, setEditFrom,
    // a product picked from the search opens the sheet titled by the button that picked it
    addFromDatabase: (code: string) => { setEditTitle("Add to my foods"); lookup(code); },
    searchDatabase: async (q: string) => { try { const tags = REGIONS.find((r) => r.id === (region ?? ""))?.tags ?? []; const cc = ["rs", "de", "at", "ch", "hr", "ba", "si", "hu", "it", "fr", "es", "cy", "gb", "us"].find((c) => tags.includes(c)) ?? ""; const d = await api(`/api/search?q=${encodeURIComponent(q)}&cc=${cc}`); return Array.isArray(d?.products) ? d.products : []; } catch { return []; } },
    peekBarcode: async (code: string) => { try { const d = await api(`/api/product/${code}`); return d?.product_name ? { code, name: d.product_name, brand: d.brand || "", quantity: "", kcal: d.calories, protein: d.protein } : null; } catch { return null; } },
    // Plan (0.2.2): the meals in the slots, by date and slot; a plate made for a slot lands in it when saved
    planned, filling, setFilling,
    cover: { count: coverCount, drawing: coverDrawing, draw: (m: Meal) => { void drawCover(m); }, refresh: refreshCoverCount },
    landing, clearLanding: () => setLanding(null),
    openFromPath: backReady ? recipeFromPath : null, clearOpenFromPath: () => setRecipeFromPath(null), recipesHome,
    landOnRecipe: (id: string, line: string, title?: string, back?: "recipes") => { setLanding({ id, line, title, ...(back ? { back } : {}) }); setMenuSection(null); setMenuFrom(null); setTalkOpen(false); setTab("recipes"); },
    openMeal: (id: string, from: import("./screens/api").MealFrom) => { setLanding({ id, line: "", quiet: true, from }); setMenuSection(null); setMenuFrom(null); setTalkOpen(false); setTab("recipes"); },
    openRecipePage: (id: string) => { setLanding({ id, line: "", quiet: true }); setMenuSection(null); setMenuFrom(null); setTalkOpen(false); setTab("recipes"); },
    openOnPlate: (meal: Meal) => {
      setFilling(null); setPlateRecipeId(meal.id);
      // R22 fix (0.2.51): a recipe presets What is it? from its foods, a one-portion recipe too (the quark pudding: a DaaM)
      setPlateTaste(presetOf(dishTaste(meal.items.map((i) => i.food.name))));
      // a recipe that came in from a screenshot or a link opens as it did the first time (0.2.19, IM13): the Plate does it
      if (meal.makes) setState((s) => ({ ...s, title: meal.title, items: [], portion: null, optional: undefined, leftOut: undefined, emptyParts: undefined, openRecipe: meal.id }));
      else setState((s) => ({ ...s, title: meal.title, items: asDish(meal), portion: null, fromRecipe: undefined, leftOut: undefined, emptyParts: undefined, optional: optAt(meal.optional, 1 / portionsIn(meal), uid) }));
      setKind(meal.kind ?? "meal"); setStep("in"); setMenuSection(null); setMenuFrom(null); setTalkOpen(false); setTab("journey");
    },
    // a name typed on the Plate (Milan, 11 October 2026): the recipe it came from and the slot it is for take it at once
    renamePlate: (title: string) => {
      const t = title.trim(); if (!t) return;
      if (plateRecipeId && state.meals.some((m) => m.id === plateRecipeId && m.title !== t)) screenProps.renameMeal(plateRecipeId, t);
      if (filling) setPlannedState((prev) => { const m = prev[filling.date]?.[filling.slotId]; if (!m || m.title === t) return prev; const next = withPlanned(prev, filling.date, filling.slotId, { ...m, title: t }); storePlanned(next); return next; });
    },
    // rename a recipe (canvas S, Recipes keeps, 11 October 2026): the recipe, and every slot that holds it
    renameMeal: (id: string, title: string) => {
      const t = title.trim(); if (!t) return;
      setState((s) => ({ ...s, meals: s.meals.map((m) => (m.id === id ? { ...m, title: t } : m)) }));
      let next = planned, changed = false;
      for (const [date, day] of Object.entries(planned)) for (const [slot, m] of Object.entries(day)) if (m.mealId === id && m.title !== t) { next = withPlanned(next, date, slot, { ...m, title: t }); changed = true; }
      if (changed) { storePlanned(next); setPlannedState(next); }
    },
    // from the latest state, so several fills in one go (Put them in the plan, 0.2.4) all land
    fill: (date: string, slotId: string, meal: PlannedMeal | null) => setPlannedState((prev) => { const next = withPlanned(prev, date, slotId, meal); storePlanned(next); return next; }),
    fillOnPlate: (f: Filling, meal?: Meal | null, title?: string) => {
      setFilling(f);
      setPlateRecipeId(meal?.id || f.mealId || null);
      setState((s) => ({ ...s, title: meal?.title ?? title ?? "", items: meal ? asDish(meal) : [], portion: null, fromRecipe: undefined, leftOut: undefined, emptyParts: undefined, optional: meal ? optAt(meal.optional, 1 / portionsIn(meal), uid) : undefined }));
      setKind("meal"); setStep("in"); setMenuSection(null); setMenuFrom(null); setTalkOpen(false); setTab("journey");
    },
    // a link that changes the tab leaves any open panel or chat behind, or it would land under them and look dead
    setTab: (t: Tab) => { setMenuSection(null); setMenuFrom(null); setTalkOpen(false); if (t !== "journey") setFilling(null); setTab(t); },
    inbox,
    takeRecipe: async (item: InboxItem, how: "make" | "keep") => {
      // foods she doesn't have come along; then the recipe goes to the plate or to her recipes
      setState((s) => {
        const have = new Set(s.foods.map((f) => (f.name + "|" + f.brand).toLowerCase()));
        const newFoods = (item.meal.items as Ingredient[]).map((i) => i.food).filter((f) => !have.has((f.name + "|" + f.brand).toLowerCase())).map((f) => ({ ...f, id: uid(), icon: f.icon || iconFor(f.name), reviewedAt: new Date().toISOString() }));
        const foods = [...s.foods, ...newFoods];
        const items = (item.meal.items as Ingredient[]).map((i) => { const lib = foods.find((f) => (f.name + "|" + f.brand).toLowerCase() === (i.food.name + "|" + i.food.brand).toLowerCase()); return { id: uid(), food: lib ?? i.food, grams: i.grams, locked: true }; });
        const meal = { id: uid(), title: item.meal.title || "From your coach", items, portion: items.reduce((n, i) => n + i.grams, 0), savedAt: new Date().toISOString(), from: "coach" as const };
        return how === "make"
          ? { ...s, foods, items, portion: null, title: meal.title }
          : { ...s, foods, meals: [meal, ...s.meals], feedback: [{ id: uid(), meal, status: "prepared" as const, taste: "", notes: "", createdAt: new Date().toISOString() } as any, ...s.feedback] };
      });
      if (how === "make") { setStep("recipe"); setTab("journey"); }
      notify(how === "make" ? "On your plate. Fit to my target sets the amounts." : "Kept in your recipes.");
      if (user) { try { await clearInboxItem(user.uid, item.id); } catch {} }
      setInbox((x) => x.filter((i) => i.id !== item.id));
    },
    dismissRecipe: async (item: InboxItem) => { if (user) { try { await clearInboxItem(user.uid, item.id); } catch {} } setInbox((x) => x.filter((i) => i.id !== item.id)); },
    newShared, markSharedSeen: () => { if (user) { try { localStorage.setItem(`chefmealan-coach-seen-${user.uid}`, new Date().toISOString()); } catch {} } setNewShared(0); },
    matched, importRef, filter, setFilter,
    coach, setCoach: (v: boolean) => { setCoach(v); setCoachState(v); },
    step, setStep, mixWith,
    clientName, setClientName: (v: string) => { storeClientName(v); setClientNameState(v); },
    goal, openGoal: () => setGoalOpen(true), fitPd: (pd: number | null) => fitPd(pd, pdRef),
    // Foods measure every food against the day's target, not the plate's moment (a snack before training aims at PD 3)
    fitDay: (pd: number | null) => fitPd(pd, dayPd),
    addStarter: () => {
      setState((s) => {
        const have = new Set(s.foods.map((f) => (f.name + "|" + f.brand).toLowerCase()));
        const tags = new Set(REGIONS.find((r) => r.id === (region ?? "elsewhere"))?.tags ?? ["*"]);
        const add = STARTER_FOODS
          .filter((f) => (STARTER_REGION[f.id] ?? ["*"]).some((t) => tags.has(t)))
          .filter((f) => !have.has((f.name + "|" + f.brand).toLowerCase())).map((f) => ({ ...f, id: uid(), reviewedAt: new Date().toISOString() }));
        // the place's own foods come with them (Limassol: fifty Cypriot foods), each once, under any of its names
        const named = new Set(s.foods.flatMap((f) => [f.name, ...(f.aliases ?? [])]).map((n) => n.toLowerCase()));
        const local = marketFoods(tags).filter((r) => ![r.en, r.de, r.sr, r.cyr, r.el ?? ""].some((n) => n && named.has(n.toLowerCase()))).map((r) => referenceFood(r, region, uid));
        notify(add.length + local.length ? `${add.length + local.length} starter foods added${local.length ? `, ${local.length} of them local` : ""}.` : "Starter foods are already in your library.");
        return { ...s, foods: [...s.foods, ...add, ...local] };
      });
    },
    importAirtable: async () => {
      setBusy("Reading Airtable");
      try {
        const data = await api("/api/foods");
        const rows: any[] = data.foods ?? [];
        setState((s) => {
          const key = (n: string, b: string, bc?: string) => bc ? `bc:${bc}` : (n + "|" + b).toLowerCase();
          const have = new Set(s.foods.map((f) => key(f.name, f.brand, f.barcode)));
          const add = rows.map((r) => candidateFood(r, "airtable")).map((f) => ({ ...f, reviewedAt: new Date().toISOString(), readyToEat: true, icon: iconFor(f.name) }))
            .filter((f) => !validateFood(f).length && !have.has(key(f.name, f.brand, f.barcode)));
          notify(add.length ? `${add.length} foods imported from Airtable.` : "Nothing new in Airtable.");
          return { ...s, foods: [...s.foods, ...add] };
        });
      } catch (e: any) { setError(e.message); } finally { setBusy(""); }
    },
    openOut: (ask?: "fill") => { setTalkAsk(ask ?? null); setTalkOpen(true); },
    scanFromToday: () => { setScanFrom("today"); setMode("label"); setCamera(true); },
    where, setWhere,
    closeOut: () => setTalkOpen(false),
    mealanAsk, mealanAsked: () => setMealanAsk(0),
    mixFor: (food: Food) => {
      const tags = new Set(REGIONS.find((r) => r.id === (region ?? "elsewhere"))?.tags ?? ["*"]);
      const starter = STARTER_FOODS.filter((f) => (STARTER_REGION[f.id] ?? ["*"]).some((t) => tags.has(t)));
      const share = todayKcal === null ? null : Math.round(todayKcal * momentKcalShare(moment));
      return mixTip(food, moment, pdRef, state.foods, starter, share, { weightKg: personal.weightKg ?? null, dayType: day.type ?? undefined, allergies: safety.allergies });
    },
    takeMix: (food: Food, mix: Mix) => {
      // the partners enter the library if they came from the starter set; the plate becomes the mix, amounts as solved
      log("mix_taken", { food: food.name, moment, partners: mix.partners.map((p) => p.name), kind: mix.kind, pd: Math.round(mix.pd * 10) / 10, kcal: mix.kcal, fromStarter: mix.fromStarter });
      setState((s) => {
        const have = new Set(s.foods.map((f) => f.name.trim().toLowerCase()));
        const added = mix.partners.filter((p) => !have.has(p.name.trim().toLowerCase())).map((p) => ({ ...p, id: uid(), reviewedAt: new Date().toISOString() }));
        const foods = [...s.foods, ...added];
        const byName = (n: string) => foods.find((f) => f.name.trim().toLowerCase() === n.trim().toLowerCase());
        const items = mix.items.map((i) => ({ ...i, food: byName(i.food.name) ?? i.food }));
        return { ...s, foods, items, portion: null };
      });
      setStep("in"); setTab("journey");
      notify(`${mixLabel(mix)}: ${mix.kind}, ${mix.kcal} kcal. Amounts set by the solver.`);
    },
    askAboutMix: (food: Food, tip: MixTip) => {
      log("mix_ask", { food: food.name, moment, case: tip.case, offered: tip.mixes.map(mixLabel) });
      const offered = tip.mixes.length ? ` You suggested ${tip.mixes.map(mixLabel).join("; ")}.` : "";
      setMixQuestion(`I scanned ${food.name} for ${momentOf(moment).name.toLowerCase()}.${offered} What I'd change: `);
      setState((s) => (s.items.some((i) => i.food.id === food.id) ? s : { ...s, items: [...s.items, { id: uid(), food, grams: PORTION[jobOf(food).job], locked: true } as Ingredient], portion: null }));
      setStep("in"); setTab("journey");
    },
    mixQuestion, mixQuestionTaken: () => setMixQuestion(null),
    recordTalk: (q: string, reply: string, plate: string[]) => setTalkTurns((t) => [...t, { role: "you", text: q, plate }, { role: "mealan", text: reply }]),
    // a card becomes a recipe: the foods, the grams, the steps and the photo (gap C, 10 October 2026)
    setCardPhoto: (id: string, data: string) => {
      setState((s) => ({ ...s, feedback: s.feedback.map((f) => (f.id === id ? { ...f, photo: data, photos: [...(f.photos ?? []), data] } : f)) }));
    },
    setCoverAsk: (id: string, v: "later" | "kept" | "used") => {
      setState((s) => ({ ...s, feedback: s.feedback.map((f) => (f.id === id ? { ...f, coverAsk: v } : f)) }));
    },
    // the plate photo becomes the cover: first in the recipe's photos; the drawn picture stays behind it, for members
    useCardAsCover: (cardId: string, recipeId: string) => {
      setState((s) => {
        const f = s.feedback.find((x) => x.id === cardId), photo = f?.photo;
        if (!f || !photo) return s;
        return { ...s, feedback: s.feedback.map((x) => (x.id === cardId ? { ...x, coverAsk: "used" as const } : x)),
          meals: s.meals.map((m) => { if (m.id !== recipeId) return m; const list = recipePhotosOf(m).filter((x) => x !== photo); return { ...m, ...withRecipePhotos([photo, ...list].slice(0, 6)) }; }) };
      });
      log("cover", { how: "real" });
      notify("Your photo is the cover now.");
    },
    takeMember: (r: SharedRecipe, how: "make" | "keep", portion?: Ingredient[]) => {
      // foods she doesn't have come along with their values, as from a coach's recipe
      setState((s) => {
        const key = (n: string, b: string) => `${n}|${b}`.toLowerCase();
        const have = new Map(s.foods.map((f) => [key(f.name, f.brand), f] as const));
        const fresh: Food[] = [];
        const libOf = (i: Ingredient) => { const k = key(i.food.name, i.food.brand); let f = have.get(k); if (!f) { f = { ...i.food, id: uid(), icon: i.food.icon || iconFor(i.food.name) }; have.set(k, f); fresh.push(f); } return f; };
        const src = how === "make" && portion ? portion : itemsOfShared(r);
        const items = src.map((i) => ({ ...i, food: libOf(i), locked: how === "make" }));
        const foods = [...s.foods, ...fresh];
        if (how === "make") return { ...s, foods, items, portion: null, title: r.title };
        const today = ymd(new Date());
        const meal: Meal = { id: uid(), title: r.title, items, portion: items.reduce((n, i) => n + i.grams, 0), savedAt: new Date().toISOString(), steps: r.steps, from: "members", memberOf: r.id,
          ...(r.kitchen ? { kitchen: r.kitchen } : {}),
          ...(r.cover ? { photo: r.cover, photos: [], cover: { state: "drawn" as const, day: today }, ...(r.coverKind === "drawn" ? { coverSig: sig(r.cover) } : {}) } : {}) };
        return { ...s, foods, meals: [meal, ...s.meals] };
      });
      log("members", { how });
      if (how === "make") { void fetch(`/api/members/${encodeURIComponent(r.id)}/made`, { method: "POST" }).catch(() => {}); setStep("recipe"); setTab("journey"); notify("On your plate, at your portion."); }
      else notify(`${r.title} is in Mine. It's yours to change.`);
    },
    saveCardAsRecipe: (id: string) => {
      setState((s) => {
        const f = s.feedback.find((x) => x.id === id); if (!f || f.recipeId) return s;
        const meal: Meal = { ...structuredClone(f.meal), id: uid(), savedAt: new Date().toISOString(), from: undefined };
        return { ...s, meals: [meal, ...s.meals], feedback: s.feedback.map((x) => (x.id === id ? { ...x, recipeId: meal.id } : x)) };
      });
      notify("Saved in My recipes.");
    },
    // R20 (0.2.48): the answer keeps its moment and the recipe's foods as they were; a change of answer (Change) is not counted again
    setCarry: (id: string, how: "light" | "fine" | "heavy", moment?: import("./carry").CarryMoment) => {
      const f = state.feedback.find((x) => x.id === id);
      if (!f?.carry) log("carry", { how });
      const r = f ? state.meals.find((m) => m.id === f.recipeId) ?? state.meals.find((m) => m.id === f.meal?.id || m.title === f.meal?.title) : null;
      const sig = r ? recipeSig(r) : undefined;
      setState((s) => ({ ...s, feedback: s.feedback.map((x) => (x.id === id ? { ...x, carry: { how, at: new Date().toISOString(), ...(moment ? { moment } : {}), ...(sig ? { sig } : {}) } } : x)) }));
    },
    shareCard: (id: string, reason: "look" | "ok" | "help") => {
      setState((s) => ({ ...s, feedback: s.feedback.map((f) => (f.id === id ? { ...f, shared: { reason, at: new Date().toISOString() } } : f)) }));
      notify(`Shared with ${profile.coachName || "your coach"}.`);
    },
    user, cloudEnabled, cloudStatus, profile,
    joinCoach: async (code: string) => { if (!user) return; try { const r = await joinCoach(user.uid, code); setProfile((p) => ({ ...p, ...r })); notify(`You're with ${r.coachName} now.`); } catch (e: any) { setError(e.message); } },
    leaveCoach: async () => { if (!user) return; try { await leaveCoach(user.uid); setProfile((p) => ({ ...p, coachId: undefined, coachName: undefined, coachEmail: undefined, coachPhoto: undefined, joinedAt: undefined })); } catch (e: any) { setError(e.message); } },
    signOut: async () => { clearKept(); await signOutCloud(); cloudLoaded.current = false; },
    safety, ai,
    declareSafety: (patch, record = false) => { updateSafety((x) => { let next = { ...x, ...patch }; const now = new Date().toISOString(); for (const sid of next.situations) if (!x.situations.includes(sid)) next.flags = [...next.flags, { situation: sid, at: now, source: "door" as const }]; if (record) next = recordDeclaration(next, next.situations, next.allergies, new Date(), Boolean(next.none)); return next; }); },
    flagFromModel: (situation) => { updateSafety((x) => addFlag(x, situation, "model")); log("safety_flag", { situation, source: "model" }); },
    exportMyData: async () => {
      // everything: the profile, the goal and its history, the foods with their photos, the cards, the recipes, and what the account holds
      let cloud: any = null;
      if (user) { try { cloud = await exportAccount(user.uid); } catch (e: any) { cloud = { error: explainCloudError(e) }; } }
      const data = { exportedAt: new Date().toISOString(), name: clientName, personal: getPersonal(), safety: getSafety(), goal: getGoal(), goalLog: getGoalLog(), foods: state.foods, cards: state.feedback, items: state.items, recipes: inbox, account: cloud };
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      const a = document.createElement("a"); a.href = url; a.download = `chef-mealan-my-data-${new Date().toISOString().slice(0, 10)}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      log("data_export", {});
    },
    deleteSteps,
    review,
    coachLabel: coachLabel(profile.coachName),
    // what was kept on purpose goes to Coach Milan; with nothing kept, an open request closes
    sendReview: async (kept: ReviewFinding[], summary: string, reply?: string) => {
      if (!user || !profile.coachId) return;
      try {
        if (kept.length || reply) { await askReview(user.uid, kept, summary, reply); setReview({ status: "waiting", kept, summary, reply, at: new Date().toISOString() }); }
        else if (review && review.status !== "closed") { await closeReview(user.uid); setReview({ status: "closed", at: new Date().toISOString() }); }
      } catch (e: any) { setError(explainCloudError(e)); }
    },
    answerClientReview: async (clientUid: string, status: "approved" | "change", note: string, prev: NumbersReview) => {
      try { await answerReview(clientUid, status, note, coachLabel(user?.name), prev); notify(status === "approved" ? "Approved." : "Sent with your note."); } catch (e: any) { setError(explainCloudError(e)); }
    },
    confirmClientAi: async (clientUid: string, on: boolean) => {
      if (!user) return;
      if (on) await confirmClientAi(clientUid, user.uid); else await clearClientAi(clientUid);
      notify(on ? "Chef Mealan's chat is on for this client." : "Chef Mealan's chat is off for this client.");
    },
    // Delete my account (7 October 2026): the server runs the steps in a safe order and says which were done. From the
    // first tap this phone writes nothing to the account. Once the record is gone the phone is cleared and signed out,
    // whatever happened to the last step; if nothing was deleted, the phone keeps everything and saving goes on.
    deleteAccount: async () => {
      const clearPhone = async () => { localStorage.clear(); sessionStorage.clear(); await storeClear(); try { await signOutCloud(); } catch {} };
      pauseAccountWrites(true);
      setDeleteSteps("Removing the photo files, the record, cards, recipes and the sign-in");
      let r: { ok?: boolean; dataGone?: boolean; message?: string; error?: string } | null = null;
      try {
        const res = await fetch("/api/account/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", signal: AbortSignal.timeout(65000) });
        r = await res.json().catch(() => null);
      } catch { r = null; }
      setDeleteSteps("");
      if (!r || (r.ok === undefined && r.dataGone === undefined)) {
        // no answer: the delete may or may not have run; the phone's copy goes, so it can't come back, and the account decides
        log("account_delete", { result: "unknown" });
        await clearPhone();
        setError(r?.error ? `${r.error} Nothing on this phone is kept; sign in again to check.` : "The delete didn't answer. Sign in again: if your data is still there, tap Delete my account again.");
        setTimeout(() => location.reload(), 5000);
        return;
      }
      log("account_delete", { result: r.ok ? "done" : r.dataGone ? "data gone" : "stopped" });
      if (r.ok) { await clearPhone(); location.reload(); return; }
      if (r.dataGone) {
        await clearPhone();
        setError(r.message || "Your data is deleted.");
        setTimeout(() => location.reload(), 6000);
        return;
      }
      pauseAccountWrites(false);
      setError(r.message || "Nothing was deleted. Try again later.");
    },
    resetGoal: () => { clearGoal(); setState((s) => ({ ...s, goals: { ...s.goals, calories: null, protein: null } })); setGoalState(null); setGoalOpen(true); },
    mealanCard: (
      <Mealan
        items={state.items}
        portion={state.portion}
        goals={state.goals}
        title={state.title}
      />
    ),
  };
  const NAV: { id: Tab; label: string; icon: ReactNode }[] = [
    // the bar (0.2.0, canvas X0 and H, 11 October 2026): Today eats and counts, Plan decides, Plate makes, Recipes keeps; Me and Foods in the top menu
    { id: "home", label: "Today", icon: <Home size={20} /> },
    { id: "plan", label: "Plan", icon: <CalendarDays size={20} /> },
    { id: "journey", label: "Plate", icon: <Utensils size={20} /> },
    { id: "recipes", label: "Recipes", icon: <ChefHat size={20} /> },
    ...(profile.role === "coach" ? [{ id: "clients" as Tab, label: "Clients", icon: <span className="nav-icon"><Users size={20} />{newShared > 0 && <span className="badge">{newShared}</span>}</span> }] : []),
  ];
  const TITLES: Record<Tab, string> = {
    home: "Today",
    journey: "Plate",
    plan: "Plan",
    recipes: "Recipes",
    me: "Me",
    clients: "Clients",
    meal: "Meal",
    chef: "Chef",
    foods: "Foods",
    notes: "Recipes",
    more: "More",
  };
  if (!authReady) return <Starting onLocal={null} />;
  // the legal pages are public: /impressum, /privacy, /disclaimer, /about, signed in or not
  // the recipe pages (canvas R1, R2, R6): open to everyone; a signed-in member also gets their amounts
  if (pagePath === "/recipes" || /^\/r\/[a-z0-9-]+\/?$/.test(pagePath)) {
    const isMember = Boolean(user && profileReady && (profile.role === "coach" || profile.coachId) && safety.adultAt);
    const tools: MemberTools | null = isMember ? {
      mixFor: screenProps.mixFor,
      takeMix: (f, m) => { screenProps.takeMix(f, m); goApp("journey"); },
      putAlone: (f, g) => { setState((s) => ({ ...s, items: [...s.items, { id: uid(), food: f, grams: g, locked: false }], portion: null })); setStep("in"); goApp("journey"); notify(`${f.name} is on your plate.`); },
      addRecipe: (m) => { setState((s) => ({ ...s, meals: [m, ...s.meals] })); goApp("recipes"); notify(`${m.title} is in your recipes.`); },
      momentName: momentOf(moment).name, goalName: goal ? goalLabel(goal.band) : "Your goal",
      mealKcal: todayKcal === null ? null : Math.round(todayKcal * momentKcalShare(moment)),
    } : null;
    return pagePath === "/recipes" ? <RecipesPage member={isMember} /> : <RecipePage slug={pagePath.split("/")[2]} member={tools} />;
  }
  // /built, How Chef Mealan is built (board B): public, signed in or not
  if (/^\/built\/?$/.test(window.location.pathname)) return <BuiltScreen />;
  // BP70: a book's page, chefmealan.com/worthy-numbers: public, signed in or not
  { const book = bookOfPath(window.location.pathname); if (book) return <BookScreen slug={book} signedIn={!cloudEnabled || Boolean(user)} />; }
  { const legal = legalPageFromPath(window.location.pathname); if (legal) return <LegalScreen page={legal} back={() => { window.history.replaceState(null, "", "/"); window.location.reload(); }} />; }
  if (cloudEnabled && !user) return <LandingScreen />;
  if (cloudEnabled && user && !profileReady) return <Starting onLocal={() => { localMode.current = true; setProfileReady(true); }} />;
  // Release A: Chef Mealan is for adults. Nothing opens, and nothing reaches the AI, before the welcome tap (canvas R1).
  if (!safety.adultAt) {
    const first = String((user as any)?.displayName || clientName || "").trim().split(/\s+/)[0] || "";
    return <Welcome name={first} onConfirm={() => { updateSafety((x) => ({ ...x, adultAt: new Date().toISOString() })); log("adult_confirmed", {}); }} onSignOut={cloudEnabled && user ? screenProps.signOut : null} />;
  }
  if (cloudEnabled && user && profile.role !== "coach" && !profile.coachId)
    return <div className="app-shell"><main><PilotGate {...screenProps} /></main></div>;
  // a birth year under 18, at setup or later: the reason is the AI; correct the year or delete the account (canvas R2)
  if (ai.blocked)
    return (
      <div className="app-shell">
        {menuSection
          ? <main><MenuScreen {...screenProps} section={menuSection} from={menuFrom} setSection={(s, up) => { setMenuFrom(null); setMenuSection(s, up); }} under={menuTrail.length > 1 ? menuTrail[menuTrail.length - 2] : null} close={() => { setMenuFrom(null); setMenuSection(null); }} /></main>
          : <AdultOnly onCorrect={() => screenProps.openMenu("profile")} onDelete={cloudEnabled && user ? screenProps.deleteAccount : null} />}
      </div>
    );
  if (goalOpen)
    return (
      <div className="app-shell"><main><GoalScreen {...screenProps} fromMe={Boolean(getGoal())} onDone={() => { setGoalState(getGoal()); setGoalOpen(false); }} onLater={() => { setGoalOpen(false); if (getGoal()) { setTab("me"); setMenuSection("goal"); } }} /></main></div>
    );
  return (
    <div className="app-shell">
      {/* the layers before the tab keeper: a menu row that changes the tab (Foods, 0.2.0) drops its layer first, and the tab's address is pushed once that step back has settled */}
      {backReady && menuTrail.map((m, i) => <MenuBack key={`${i}-${m}`} open path={MENU_PATH[m]} close={() => { setMenuFrom(null); setMenuTrail((t) => t.slice(0, i)); }} />)}
      <MenuBack open={talkOpen} close={() => setTalkOpen(false)} />
      <BackKeeper tab={tab} setTab={setTab} onReady={() => setBackReady(true)} />
      <Opened />
      <header className="topbar">
        <button className="brand" onClick={() => { setMenuSection(null); setTalkOpen(false); setFilling(null); setTab("home"); }} aria-label={`${APP_NAME}, Today`}>
          <Mark size={28} color="var(--brand)" />
        </button>
        <h1>{menuSection ? (ME_PAGES.includes(menuSection) ? "Me" : "Menu") : TITLES[tab]}</h1>
        {tab !== "home" && <button className="ref" onClick={() => setGoalsOpen(true)} aria-label="Edit daily reference">
          {menuSection === "goal" ? `${pdText(dayPd)} today` : <>{goal?.band ? goalLabel(goal.band).split(" · ")[0] : `${fmt(state.goals.calories, 0)} kcal, ${fmt(state.goals.protein)} g`} · {pdText(dayPd)} today</>}
        </button>}
        <button className="icon menu-button" aria-label="Menu" onClick={() => setMenuSection(menuSection ? null : "list")}><Menu size={22} /></button>
      </header>
      <main>
        {error && (
          <div className="notice toast" role="alert">
            {error}
            <button
              className="icon"
              aria-label="Dismiss error"
              onClick={() => setError("")}
            >
              <X size={16} />
            </button>
          </div>
        )}
        {message && (
          <div className="success toast" role="status">
            {message}
            <button
              className="icon"
              aria-label="Dismiss message"
              onClick={() => setMessage("")}
            >
              <X size={16} />
            </button>
          </div>
        )}
        {/* Chef Mealan opens over a menu page too, and closing it comes back to the page (0.2.7+r2: the button vanished there) */}
        {menuSection && <div style={{ display: talkOpen ? "none" : "contents" }}><MenuScreen {...screenProps} section={menuSection} from={menuFrom} setSection={(s, up) => { setMenuFrom(null); setMenuSection(s, up); }} under={menuTrail.length > 1 ? menuTrail[menuTrail.length - 2] : null} close={() => { setMenuFrom(null); setMenuSection(null); }} /></div>}
        {!menuSection && !talkOpen && tab === "home" && <HomeScreen {...screenProps} />}
        {!menuSection && !talkOpen && tab === "journey" && <JourneyScreen {...screenProps} />}
        {talkOpen && <div className="talk-overlay"><OutScreen {...screenProps} tab={tab} ask={talkAsk} clearAsk={() => setTalkAsk(null)} turns={talkTurns} setTurns={(f) => setTalkTurns(f)} close={() => setTalkOpen(false)} toPlate={() => { setTalkOpen(false); setMenuSection(null); setStep("in"); setTab("journey"); }} /></div>}
        {!talkOpen && (
          <button className="chat-fab" aria-label="Chef Mealan" onClick={() => {
            // one door: on a plate with food it answers about the plate; anywhere else it's the conversation
            if (!menuSection && tab === "journey" && (step === "in" || step === "recipe") && state.items.length > 0) setMealanAsk((n) => n + 1);
            else setTalkOpen(true);
          }}><Mark size={30} color="var(--surface)" /></button>
        )}
        {!menuSection && !talkOpen && tab === "me" && <MeScreen {...screenProps} />}
        {!menuSection && !talkOpen && tab === "clients" && <ClientsScreen {...screenProps} />}
        {!menuSection && !talkOpen && tab === "meal" && <MealScreen {...screenProps} />}
        {!menuSection && !talkOpen && tab === "chef" && <ChefScreen {...screenProps} />}
        {!menuSection && !talkOpen && tab === "foods" && <FoodsScreen {...screenProps} />}
        {!menuSection && !talkOpen && tab === "recipes" && <RecipesScreen {...screenProps} />}
        {!menuSection && !talkOpen && tab === "plan" && <PlanScreen {...screenProps} />}
        <input
          ref={importRef}
          type="file"
          accept="application/json"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              if (f.size > 5_000_000) throw new Error("Backup is too large.");
              const data = parseState(await f.text());
              unreadableBackup = null;
              setState(data);
              notify("Backup imported. It replaced what was on this device.");
            } catch (err: any) {
              setError(err.message);
            }
            e.target.value = "";
          }}
        />
      </main>
      <nav className="bottom-nav" aria-label="Screens">
        {NAV.map((n) => (
          <button
            key={n.id}
            className={!menuSection && (tab === n.id || (n.id === "journey" && (tab === "meal" || tab === "chef"))) ? "active" : ""}
            aria-current={!menuSection && tab === n.id ? "page" : undefined}
            onClick={() => { if (n.id === "recipes" && tab === "recipes") setRecipesHome((k) => k + 1); setMenuSection(null); setTalkOpen(false); if (n.id !== "journey") setFilling(null); setTab(n.id); }}
          >
            {n.icon}
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
      {camera && (
        <div className="camera-modal">
          <CameraView
            scannerMode={mode}
            onModeChange={setMode}
            onCapture={(x) => scan(x)}
            processGroupScan={(x) => scan(x, true)}
            onBarcode={(x) => lookup(x)}
            onBarcodeWithPhotos={(c, x) => lookupWithPhotos(c, x)}
            addTo={tab === "journey" ? "plate" : "foods"}
            knownCodes={state.foods.map((f) => f.barcode).filter((x): x is string => Boolean(x))}
            onCancel={() => setCamera(false)}
            onOpenCart={() => {
              setCamera(false);
              setStep("in");
              setTab("journey");
            }}
            cartCount={state.items.length}
          />
        </div>
      )}
      {where && !edit && <WhereSheet {...screenProps} food={where} close={() => setWhere(null)} />}
      {edit && (
        <LabelCheck
          key={edit.id}
          food={edit}
          image={image}
          images={imageSet}
          dbPhotos={dbPhotos}
          library={state.foods}
          close={() => { setEdit(null); setImageSet([]); setDbPhotos([]); setEditFrom(""); setEditTitle(""); }}
          save={saveFood}
          mixFor={screenProps.mixFor}
          onMix={screenProps.takeMix}
          onAsk={screenProps.askAboutMix}
          target={pdRef}
          day={{ kcal: todayKcal, eaten: screenProps.eatenTodayKcal, name: screenProps.dayName, type: day.type ?? "passive", weightKg: personal.weightKg ?? null }}
          allergies={safety.allergies}
          region={region}
          addTo={tab === "journey" ? "plate" : "foods"}
          fromSearch={editFrom}
          onLookup={(c) => { setBarcode(c); setEdit(null); lookup(c); }}
          titleAs={editTitle || undefined}
          momentName={momentOf(moment).name}
        />
      )}{" "}
      {goalsOpen && (
        <GoalsEditor
          goals={state.goals}
          close={() => setGoalsOpen(false)}
          save={(g) => {
            nextSource.current = "exact";
            { const cur = getGoal(); if (cur) { saveGoal({ ...cur, source: "exact", method: undefined, setAt: new Date().toISOString() }); setGoalState(getGoal()); } }
            setState((s) => ({ ...s, goals: g }));
            setGoalsOpen(false);
            notify("Daily reference saved. Food composition stays unchanged.");
          }}
        />
      )}
      {accessOpen && (
        <Modal title="Pilot server access" close={() => setAccessOpen(false)}>
          <p>
            Use the access key provided by the person hosting this pilot. It is
            kept for this browser session.
          </p>
          <label>
            Access key
            <input
              type="password"
              value={access}
              onChange={(e) => setAccess(e.target.value)}
            />
          </label>
          <button
            className="primary"
            onClick={() => {
              sessionStorage.setItem("platemate-access", access);
              setAccessOpen(false);
              notify("Access key saved for this session. Retry your request.");
            }}
          >
            Save access key
          </button>
        </Modal>
      )}
      {reviewMeal && (
        <Modal
          title={`Feedback: ${reviewMeal.title}`}
          close={() => setReviewMeal(null)}
        >
          <label>
            What happened?
            <select
              value={feedback.status}
              onChange={(e) =>
                setFeedback({
                  ...feedback,
                  status: e.target.value as Feedback["status"],
                })
              }
            >
              <option value="prepared">Prepared</option>
              <option value="eaten">Eaten</option>
              <option value="not-used">Not used</option>
            </select>
          </label>
          <label>
            Taste
            <textarea
              value={feedback.taste}
              onChange={(e) =>
                setFeedback({ ...feedback, taste: e.target.value })
              }
              placeholder="Too sour? Just right? What would you change?"
            />
          </label>
          <label>
            Portion & practical notes
            <textarea
              value={feedback.notes}
              onChange={(e) =>
                setFeedback({ ...feedback, notes: e.target.value })
              }
            />
          </label>
          <button
            className="primary"
            onClick={() => {
              setState((s) => ({
                ...s,
                feedback: [
                  {
                    id: uid(),
                    meal: structuredClone(reviewMeal),
                    ...feedback,
                    createdAt: new Date().toISOString(),
                  },
                  ...s.feedback,
                ],
              }));
              log("feedback", { status: feedback.status });
              setReviewMeal(null);
              notify("Feedback saved with this recipe snapshot.");
            }}
          >
            Save feedback
          </button>
        </Modal>
      )}
      {busy && (
        <div className="busy" role="status">
          <div className="spinner" />
          <h3>{busy}</h3>
          <button
            className="subtle"
            onClick={() => {
              runRef.current++;
              setBusy("");
            }}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
