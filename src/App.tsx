import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Camera,
  Plus,
  BookOpen,
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
import { KNOWN, knownOf, displayRows, sortEuropean, type LabelRow, type Unit } from "./labeltable";
import { iconFor } from "./icons";
import type { ScannerMode } from "./types";
import { fmt, fixed, pdText, pdVal, pdTag, pdRange, setPdUnit } from "./ui";
import { Mark, APP_NAME, COACH_NAME } from "./components/Mark";
import { log, isCoach, setCoach, getClientName, setClientName as storeClientName } from "./log";
import { MealScreen } from "./screens/MealScreen";
import { ChefScreen } from "./screens/ChefScreen";
import { FoodsScreen } from "./screens/FoodsScreen";
import { RecipesScreen } from "./screens/RecipesScreen";
import type { AppApi, Tab, Step, MenuSection } from "./screens/api";
import { HomeScreen } from "./screens/HomeScreen";
import { GoalScreen } from "./screens/GoalScreen";
import { OutScreen, type Turn } from "./screens/OutScreen";
import { LandingScreen } from "./screens/LandingScreen";
import { Starting } from "./components/Starting";
import { Welcome, AdultOnly } from "./components/Welcome";
import { openStats } from "./openStats";
import { merge as mergeRecords, changes as recordChanges, type Known } from "./records";
import { photosOf, withPhotos, withoutStored, sig, fileOf, keyOf, isPreview, isOrphan, storeOk, storeAll, storePut, storeDel, storeClear } from "./photos";
import { LegalScreen, legalPageFromPath } from "./screens/LegalScreen";
import { PilotGate } from "./screens/PilotGate";
import { cloudEnabled, watchUser, loadCloud, saveCloud, signOutCloud, confirmClientAi, askReview, closeReview, answerReview, type NumbersReview, type ReviewFinding, clearClientAi, exportAccount, explainCloudError, stripPhotos, isEmptyState, joinCoach, leaveCoach, loadPhotos, uploadPhoto, deletePhotoFile, listPhotoFiles, downloadPhoto, markPhotosMoved, dropOldPhotoCopies, pauseAccountWrites, saveCards, loadRecords, saveRecords, markRecordsMoved, loadCards, listClients, loadInbox, clearInboxItem, type CloudUser, type InboxItem } from "./cloud";
import { getGoal, clearGoal, saveGoal, bandOf, goalLabel, goalsForBand, fit as fitPd, getGoalLog, setGoalLog, type GoalEntry, type GoalSource } from "./goal";
import { setTodayChange, dayOfLoad, type PlanDay } from "./plan";
import { getPersonal, setPersonal as storePersonal, calculate, canCalculate, getDay, withDated, DAY_TYPES, macroSplit, dayModeOf, ownDayNumbers, dayName as dayNameOf, type Personal, type DayType, type Day } from "./personal";
import { MenuScreen } from "./screens/MenuScreen";
import { ClientsScreen } from "./screens/ClientsScreen";
import { STARTER_FOODS, STARTER_REGION } from "./starter";
import { mixTip, mixLabel, catOf, plateOk, type Mix, type MixTip } from "./mixtip";
import { findReference, referenceFood, localName } from "./reference";
import { jobOf, PORTION, minPortionOf, todayLine } from "./foodjob";
import { playbookFor } from "./playbook";
import { fitnessFor, SOURCES, dayName } from "./fitness";
import { getSafety, setSafety as storeSafety, aiState, addFlag, goalSignals, allergyHits, recordDeclaration, FIXED, EMPTY_SAFETY, type Safety, type SituationId } from "./safety";
import { momentTarget, momentOf, momentKcalShare, getUsual, setUsual, getRegion, setRegion, getTravelTo, setTravelTo, REGIONS, type MomentId, type RhythmId, type RegionId } from "./moments";
import { JourneyScreen } from "./screens/JourneyScreen";
import { MeScreen } from "./screens/MeScreen";
import { Home, CircleUser, Menu, Users, MessageCircle } from "lucide-react";
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
const inputValue = (x: number | null) => (x === null ? "" : String(x));
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
  library?: Food[];
  close: () => void;
  save: (f: Food) => void;
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
    return Object.fromEntries(KEYS.map((k) => [k, food[k] === null && bounds[k] !== undefined ? String(bounds[k]) : inputValue(food[k])])) as Record<string, string>;
  });
  const [rows, setRows] = useState<LabelRow[]>(() => displayRows(food));
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
    return { eyebrow: where, title: "Type", line: "Name the food, fill the values as on the pack, save." };
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
      save(saved);
      const m = pendingMix.current; pendingMix.current = null;
      if (m && onMix) onMix(saved, m);
    };
    const raw = (images && images.length ? images : image ? [image] : []);
    const all = raw.length > 1 ? [raw[mainIdx] ?? raw[0], ...raw.filter((_, i) => i !== mainIdx)] : raw;
    if (all.length && !f.photo)
      Promise.all([thumbnailBase64(all[0]).catch(() => ""), ...all.map((x) => resizeImageBase64(x, 900, 900).catch(() => ""))])
        .then(([thumb, ...big]) => { const ok = big.filter(Boolean); finish({ ...f, photo: thumb || undefined, photos: ok.length ? ok : undefined }); })
        .catch(() => finish(f));
    else finish(f);
  }
  return (
    <Modal title={kind.title} close={close} eyebrow={kind.eyebrow}>
      <p className="small muted sheet-line">{kind.line}{fromSearch ? <> From your search: <b>{fromSearch}</b>.</> : null}</p>
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
              setValues(Object.fromEntries(KEYS.map((k) => [k, inputValue((rf as any)[k])])) as Record<string, string>);
              setRows(displayRows(rf)); setRefPicked(r.id); setRefOpen(false);
            }}>
              <b>{localName(r, region)}</b><small>{[r.en, r.sr, r.de].filter((x) => x !== localName(r, region)).slice(0, 2).join(" · ")} · {r.kcal} kcal · {r.protein} g protein</small>
            </button>
          ))}
        </div>
      )}
      {refPicked && <p className="small muted">Values from the reference table. Check the tick below and save.</p>}
      <label>
        Brand
        <input value={brand} onChange={(e) => setBrand(e.target.value)} />
      </label>
      {kind.title === "Type" && onLookup && (
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
        <small className="muted">A counted food: what Mealan moves then comes in whole servings, 1 bar, 2 bars, never 1.3.</small>
      </div>
      <p className="label">Nutrition table, per 100 g, as on the pack</p>
      <div className="label-table">
        {rows.map((r, i) => {
          const core = knownOf(r.key)?.core;
          return (
            <div className={`lt-row ${r.sub ? "sub" : ""}`} key={r.key + i}>
              <span className="lt-name">{r.name}{r.source === "you" && <em> · added by you</em>}{r.source === "database" && <em> · database</em>}</span>
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
            {onAsk && <button className="link" onClick={() => askNow(tip)}><MessageCircle size={14} /> Not quite? Tell Mealan</button>}
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
export default function App() {
  const [state, setState] = useState<PilotState>(load),
    [tab, setTab] = useState<Tab>(() => {
      const h = (typeof location !== "undefined" ? location.hash : "").replace("#", "");
      return (["home", "journey", "meal", "chef", "foods", "me"] as Tab[]).includes(h as Tab) ? (h as Tab) : "home";
    }),
    [filter, setFilter] = useState<"all" | import("./goal").PdBand>("all"),
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
    [profile, setProfile] = useState<{ role?: "coach"; coachId?: string; coachName?: string; coachEmail?: string; coachPhoto?: string; joinedAt?: string; coachSetAt?: string; formula?: "mifflin" | "katch" | null }>({}),
    [goalLog, setGoalLogState] = useState<GoalEntry[]>(getGoalLog),
    nextSource = useRef<GoalSource | null>(null),
    [moment, setMomentState] = useState<MomentId>("regular"),
    [usual, setUsualState] = useState<RhythmId[]>(getUsual),
    [region, setRegionState] = useState<RegionId | null>(getRegion),
    [travelTo, setTravelToState] = useState<RegionId | null>(getTravelTo),
    [newShared, setNewShared] = useState(0),
    [inbox, setInbox] = useState<InboxItem[]>([]),
    [personal, setPersonalState] = useState<Personal>(getPersonal),
    [safety, setSafetyState] = useState<Safety>(getSafety),
    [deleteSteps, setDeleteSteps] = useState(""),
    [day, setDayState] = useState<Day>(() => getDay()),
    [menuSection, setMenuSection] = useState<MenuSection | null>(null),
    [foodsView, setFoodsView] = useState<"foods" | "recipes">("foods"),
    [editFrom, setEditFrom] = useState<string>(""),
    [editTitle, setEditTitle] = useState<string>(""),
    [review, setReview] = useState<NumbersReview | null>(null),
    [menuFrom, setMenuFrom] = useState<MenuSection | null>(null),
    [talkOpen, setTalkOpen] = useState(false),
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
          // photos of foods that came from the account come from the photo store
          void photoRef.current.busy.then(() => storeAll()).then(mergePhotos).catch(() => {});
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
  const mergePhotos = (photos: Map<string, string>) => {
    if (!photos.size) return;
    setState((st) => { const next = withPhotos(st, photos); if (next !== st) fromCloud.current = true; return next; });
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
  // today's day follows the Weekly plan: when the plan changes, here or from the account, today is read again
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
          await saveCloud(user.uid, { ...blockOf(kept), goal: getGoal(), clientName, personal: getPersonal(), goalLog: getGoalLog(), safety: getSafety(), goneFoods: [...gone], updatedAt: new Date().toISOString() });
          setCloudStatus({ ok: true, text: "This phone had newer changes; saved to your account", at: new Date().toISOString() });
        } else if (remote && !(isEmptyState(remote.state) && !isEmptyState(state))) {
          // a real account copy replaces the phone; photos are merged back from the phone by id
          try {
            const incoming = parseState(JSON.stringify(remote.state));
            if (remote.recordsOnly) { incoming.foods = state.foods; incoming.meals = state.meals; }
            incoming.foods = incoming.foods.filter((f) => !gone.has(f.id));
            const localPhoto = new Map(state.foods.map((f) => [f.id, f.photo]));
            const localFb = new Map(state.feedback.map((f) => [f.id, f.photo]));
            // the app opens on the phone's photos; the account's photos and plate cards follow in the background (they can be large)
            const localMore = new Map(state.foods.map((f) => [f.id, f.photos]));
            incoming.foods = incoming.foods.map((f) => ({ ...f, photo: f.photo ?? localPhoto.get(f.id), photos: f.photos ?? localMore.get(f.id) }));
            const byId = new Map<string, any>();
            for (const fb of [...incoming.feedback, ...state.feedback]) if (!byId.has(fb.id)) byId.set(fb.id, fb);
            incoming.feedback = [...byId.values()].sort((x, y) => (y.createdAt > x.createdAt ? 1 : -1)).map((f) => ({ ...f, photo: f.photo ?? localFb.get(f.id) }));
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
          await saveCloud(user.uid, { ...blockOf(state), goal: getGoal(), clientName, personal: getPersonal(), goalLog: getGoalLog(), safety: getSafety(), goneFoods: getGone(), updatedAt: new Date().toISOString() });
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
          const names = await listPhotoFiles(filesFor);
          const have = photosOf(stateRef.current);
          const missing = names.map(keyOf).filter((k) => !have.has(k) && !photoRef.current.known.has(k) && !isOrphan(k, stateRef.current))
            .sort((a, b) => Number(isPreview(b)) - Number(isPreview(a)));
          for (let i = 0; i < missing.length && !stale; i += 6) {
            const got = new Map<string, string>();
            for (const k of missing.slice(i, i + 6)) { try { const d = await downloadPhoto(filesFor, fileOf(k)); got.set(k, d); fr.up.set(k, sig(d)); } catch { /* the next open tries again */ } }
            saveUp(); mergePhotos(got);
          }
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
    const onShow = () => { if (document.visibilityState === "visible" && cloudLoaded.current) void syncRecords(true); };
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
        if (remote.coachSetAt && remote.coachSetAt !== profile.coachSetAt && remote.goal) {
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
  // numbers calculated from the profile follow the profile
  useEffect(() => {
    if (goal?.source !== "profile" || !goal.band) return;
    const r = calculate(personal, goal.band, profile.formula ?? null);
    if (!r || (r.kcal === state.goals.calories && r.protein === state.goals.protein)) return;
    nextSource.current = "profile";
    saveGoal({ ...goal, method: r.method, setAt: new Date().toISOString() }); setGoalState(getGoal());
    setState((s) => ({ ...s, goals: { ...s.goals, calories: r.kcal, protein: r.protein } }));
    notify(`Your numbers changed with your profile. An average day is now ${r.kcal.toLocaleString("en")} kcal and ${r.protein} g protein.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personal, profile.formula]);
  // a goal band with missing numbers heals itself from the band
  useEffect(() => {
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
      saveCloud(user.uid, { ...blockOf(state), goal: getGoal(), clientName, personal: getPersonal(), goalLog: getGoalLog(), safety: getSafety(), goneFoods: getGone(), updatedAt: new Date().toISOString() })
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
  }, [state, goal, clientName, personal, goalLog, safety, user]);
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
  const notify = (s: string) => {
    setMessage(s);
    setError("");
  };
  function blank(name = "", brand = "", from = "", barcode = "") {
    setEditTitle("");
    setImage("");
    setImageSet([]);
    setEditFrom(from);
    setEdit(candidateFood({ product_name: name, brand, ...(barcode ? { barcode } : {}) }, "Manual entry"));
  }
  function saveFood(f: Food) {
    const existed = state.foods.some((x) => x.id === f.id);
    setImage(""); setImageSet([]);
    setState((s) => ({
      ...s,
      foods: s.foods.some((x) => x.id === f.id)
        ? s.foods.map((x) => (x.id === f.id ? f : x))
        : [f, ...s.foods],
      items: repoint(s.items, f.id, f),
    }));
    if (existed && f.reviewedAt) { setEdit(null); setImageSet([]); notify(`Updated ${f.name}.`); return; }
    setEdit(null);
    setPending((p) =>
      p.filter((x) => x.name !== f.name || x.brand !== f.brand),
    );
    notify(
      "Saved on this device. Existing recipes keep their original food data.",
    );
  }
  function add(food: Food) {
    log("food_in", { way: food.barcode ? "barcode" : food.source === "label" ? "label" : food.source === "manual" ? "manual" : "saved", source: food.source });
    setState((s) => ({
      ...s,
      items: [
        ...s.items,
        { id: uid(), food: { ...food }, grams: (density(food.protein, food.calories) ?? 0) < 3 ? 50 : 150, locked: false },
      ],
      portion: null,
    }));
    setStep("in");
    setTab("journey");
    notify(
      "Added. Set the amount you actually have.",
    );
  }
  // the photo that shows the front goes first: it becomes the main photo and the card's picture
  const frontFirst = (images: string[], front: number) => { const i = Number(front) - 1; return i > 0 && i < images.length ? [images[i], ...images.filter((_, j) => j !== i)] : images; };
  async function scan(raw: string | string[], group = false, barcode?: string) {
    const run = ++runRef.current;
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
    try {
      const local = state.foods.find((f) => f.barcode === code.trim());
      if (local) {
        setOpenFoodId(local.id);
        setTab("foods");
        notify("Already in your foods.");
      } else {
        const d = await api(`/api/product/${code.trim()}`);
        if (run !== runRef.current) return;
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
    if (local) { setCamera(false); setOpenFoodId(local.id); setTab("foods"); notify("Already in your foods."); return; }
    const run = ++runRef.current;
    setBusy("Looking up product…"); setError(""); setCamera(false);
    let db: any = null;
    try { db = await api(`/api/product/${c}`); } catch { db = null; }
    if (run !== runRef.current) return;
    if (!db) { setBusy(""); await scan(images, false, c); return; }
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
    }
    const ordered = frontFirst(resized, read?.front_image ?? 0);
    setImage(ordered[0] ?? ""); setImageSet(ordered);
    setEdit(candidateFood({ ...merged, barcode: c }, db.source || "Product database and photos · review required"));
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
  function todayNumbers(): { kcal: number; protein: number; fats: number; carbs: number } | null {
    const g = state.goals;
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
    const d = day.plan ? c.numbersOf(day.plan) : c.days[day.type]; return { kcal: d.kcal, protein: d.protein, fats: d.fats, carbs: d.carbs };
  }
  function todayKcalOf(): number | null { return todayNumbers()?.kcal ?? state.goals.calories ?? null; }
  function mix(id: string = adjustId): boolean { return mixWith(state.items, id); }
  function mixWith(itemsIn: Ingredient[], id: string): boolean {
    setError("");
    const target = momentTarget(moment, density(state.goals.protein, todayKcalOf()));
    if (target === null || target <= 0) {
      setError("Set daily energy and protein targets first.");
      return false;
    }
    const selected = itemsIn.find((x) => x.id === id);
    if (!selected || selected.locked) {
      setError("Let Mealan move one product. Everything else stays as you set it.");
      return false;
    }
    if (
      !selected.food.readyToEat ||
      itemsIn.some((x) => !x.food.readyToEat)
    ) {
      setError("Mealan mixes foods you can eat as they are.");
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
      const grams = Math.max(s.grams, floor);
      const solved = grams === s.grams ? s.items : s.items.map((x) => (x.id === id ? { ...x, grams } : x));
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
    a.download = `platemate-pilot-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  setPdUnit(personal.pdUnit);
  const ai = aiState(safety, personal.birthYear, Boolean(profile.coachId) || profile.role === "coach");
  const updateSafety = (fn: (s: Safety) => Safety) => { const next = fn(getSafety()); storeSafety(next); setSafetyState(next); };
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
    pdRef = momentTarget(moment, dayPd);
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
    pdRef, dayPd, moment, setMoment: (m: MomentId) => setMomentState(m), usual, setUsual: (ids: RhythmId[]) => { setUsual(ids); setUsualState(ids); },
    region, setRegion: (r: RegionId) => { setRegion(r); setRegionState(r); },
    travelTo, setTravelTo: (r: RegionId | null) => { setTravelTo(r); setTravelToState(r); },
    personal, setPersonal: (x: Personal) => { storePersonal(x); setPersonalState(x); },
    addFoodPhoto: async (foodId: string, dataUrl: string) => {
      const [thumb, big] = await Promise.all([thumbnailBase64(dataUrl).catch(() => ""), resizeImageBase64(dataUrl, 900, 900).catch(() => "")]);
      if (!big) { setError("This photo could not be read. Try another one."); return; }
      // a food's picture stays its first photo (journey invariant, 5 October 2026: the picture plus the added photos)
      setState((s) => ({ ...s, foods: s.foods.map((f) => {
        if (f.id !== foodId) return f;
        const had = (f.photos?.length ? f.photos : f.photo ? [f.photo] : []).filter(Boolean);
        return { ...f, photo: f.photo || thumb || undefined, photos: [...had, big].slice(0, 6) };
      }) }));
      notify("Photo added.");
    },
    openFoodId, clearOpenFood: () => setOpenFoodId(null),
    setFoodJob: (foodId: string, job: string | null) => {
      setState((s) => ({ ...s, foods: s.foods.map((x) => (x.id === foodId ? { ...x, job: job || undefined } : x)) }));
      notify(job ? `Labelled ${job.toLowerCase()}.` : "Back to Mealan's label.");
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
    keepForLater: (meal: Meal) => {
      // a prepared card: it shows on Today until it's eaten or dropped
      setState((s) => ({ ...s, feedback: [{ id: uid(), meal, status: "prepared" as const, taste: "", notes: "", createdAt: new Date().toISOString(), dayType: dayModeOf(personal) === "each" && day.type ? day.type : undefined } as any, ...s.feedback] }));
      notify("Kept for later. It's on Today.");
    },
    settleCard: (id: string, how: "eaten" | "not-used") => {
      setState((s) => ({ ...s, feedback: s.feedback.map((f) => (f.id === id ? { ...f, status: how, createdAt: how === "eaten" ? new Date().toISOString() : f.createdAt, taste: how === "eaten" ? f.taste || "Good" : f.taste } : f)) }));
      notify(how === "eaten" ? "Logged." : "Dropped for today.");
    },
    toggleFavorite: (foodId: string) => {
      const f = state.foods.find((x) => x.id === foodId);
      setState((s) => ({ ...s, foods: s.foods.map((x) => (x.id === foodId ? { ...x, favorite: !x.favorite } : x)) }));
      notify(f?.favorite ? "Removed from favourites." : "Added to favourites: it shows first on the plate.");
    },
    removeFoodPhoto: (foodId: string, index: number) => {
      const f0 = state.foods.find((f) => f.id === foodId);
      const gallery = f0?.photos?.length ? f0.photos : f0?.photo ? [f0.photo] : [];
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
    // today's plan, for this date only; the Weekly plan stays
    setTodayPlan: (d: PlanDay | null) => { setTodayChange(null); const next = withDated(personal, new Date(), d); storePersonal(next); setPersonalState(next); setDayState(getDay(next)); },
    // a change for any date, from the Weekly plan's dated weeks; null puts the date back on the usual week
    setDated: (date: Date, d: PlanDay | null) => { const next = withDated(personal, date, d); storePersonal(next); setPersonalState(next); setDayState(getDay(next)); },
    applyNumbers: (bandId: string, kcal: number, protein: number, method?: string, fatsIn?: number, carbsIn?: number) => {
      nextSource.current = "profile";
      saveGoal({ band: bandId, setBy: "you", setAt: new Date().toISOString(), source: "profile", method });
      setGoalState(getGoal());
      setState((s) => ({ ...s, goals: { ...s.goals, calories: kcal, protein, ...(fatsIn != null && carbsIn != null ? { fats: fatsIn, carbs: carbsIn } : macroSplit(kcal, protein)) } }));
    },
    // today's four: protein and fat stay, the carbs take the day's difference
    todayMacros: todayNumbers(),
    openMenu: (s?: MenuSection, from?: MenuSection) => { setMenuFrom(from ?? null); setMenuSection(s ?? "list"); },
    foodsView, setFoodsView, saveFood, setEditFrom,
    // a product picked from the search opens the sheet titled by the button that picked it
    addFromDatabase: (code: string) => { setEditTitle("Add to my foods"); lookup(code); },
    searchDatabase: async (q: string) => { try { const tags = REGIONS.find((r) => r.id === (region ?? ""))?.tags ?? []; const cc = ["rs", "de", "at", "ch", "hr", "ba", "si", "hu", "it", "fr", "es", "gb", "us"].find((c) => tags.includes(c)) ?? ""; const d = await api(`/api/search?q=${encodeURIComponent(q)}&cc=${cc}`); return Array.isArray(d?.products) ? d.products : []; } catch { return []; } },
    peekBarcode: async (code: string) => { try { const d = await api(`/api/product/${code}`); return d?.product_name ? { code, name: d.product_name, brand: d.brand || "", quantity: "", kcal: d.calories, protein: d.protein } : null; } catch { return null; } },
    // a link that changes the tab leaves any open panel or chat behind, or it would land under them and look dead
    setTab: (t: Tab) => { setMenuSection(null); setMenuFrom(null); setTalkOpen(false); setTab(t); },
    inbox,
    takeRecipe: async (item: InboxItem, how: "make" | "keep") => {
      // foods she doesn't have come along; then the recipe goes to the plate or to her recipes
      setState((s) => {
        const have = new Set(s.foods.map((f) => (f.name + "|" + f.brand).toLowerCase()));
        const newFoods = (item.meal.items as Ingredient[]).map((i) => i.food).filter((f) => !have.has((f.name + "|" + f.brand).toLowerCase())).map((f) => ({ ...f, id: uid(), icon: f.icon || iconFor(f.name), reviewedAt: new Date().toISOString() }));
        const foods = [...s.foods, ...newFoods];
        const items = (item.meal.items as Ingredient[]).map((i) => { const lib = foods.find((f) => (f.name + "|" + f.brand).toLowerCase() === (i.food.name + "|" + i.food.brand).toLowerCase()); return { id: uid(), food: lib ?? i.food, grams: i.grams, locked: true }; });
        const meal = { id: uid(), title: item.meal.title || "From your coach", items, portion: items.reduce((n, i) => n + i.grams, 0), savedAt: new Date().toISOString() };
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
        notify(add.length ? `${add.length} starter foods added.` : "Starter foods are already in your library.");
        return { ...s, foods: [...s.foods, ...add] };
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
    openOut: () => setTalkOpen(true),
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
    shareCard: (id: string, reason: "look" | "ok" | "help") => {
      setState((s) => ({ ...s, feedback: s.feedback.map((f) => (f.id === id ? { ...f, shared: { reason, at: new Date().toISOString() } } : f)) }));
      notify(`Shared with ${profile.coachName || "your coach"}.`);
    },
    user, cloudEnabled, cloudStatus, profile,
    joinCoach: async (code: string) => { if (!user) return; try { const r = await joinCoach(user.uid, code); setProfile((p) => ({ ...p, ...r })); notify(`You're with ${r.coachName} now.`); } catch (e: any) { setError(e.message); } },
    leaveCoach: async () => { if (!user) return; try { await leaveCoach(user.uid); setProfile((p) => ({ ...p, coachId: undefined, coachName: undefined, coachEmail: undefined, coachPhoto: undefined, joinedAt: undefined })); } catch (e: any) { setError(e.message); } },
    signOut: async () => { await signOutCloud(); cloudLoaded.current = false; },
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
      notify(on ? "Mealan's chat is on for this client." : "Mealan's chat is off for this client.");
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
    { id: "home", label: "Today", icon: <Home size={20} /> },
    { id: "journey", label: "Plate", icon: <Utensils size={20} /> },
    { id: "foods", label: "Foods", icon: <BookOpen size={20} /> },
    { id: "me", label: "Me", icon: <CircleUser size={20} /> },
    ...(profile.role === "coach" ? [{ id: "clients" as Tab, label: "Clients", icon: <span className="nav-icon"><Users size={20} />{newShared > 0 && <span className="badge">{newShared}</span>}</span> }] : []),
  ];
  const TITLES: Record<Tab, string> = {
    home: "Today",
    journey: "Plate",
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
          ? <main><MenuScreen {...screenProps} section={menuSection} from={menuFrom} setSection={(s) => { setMenuFrom(null); setMenuSection(s); }} close={() => { setMenuFrom(null); setMenuSection(null); }} /></main>
          : <AdultOnly onCorrect={() => screenProps.openMenu("profile")} onDelete={cloudEnabled && user ? screenProps.deleteAccount : null} />}
      </div>
    );
  if (goalOpen)
    return (
      <div className="app-shell"><main><GoalScreen {...screenProps} fromMe={Boolean(getGoal())} onDone={() => { setGoalState(getGoal()); setGoalOpen(false); }} onLater={() => { setGoalOpen(false); if (getGoal()) { setTab("me"); setMenuSection("goal"); } }} /></main></div>
    );
  return (
    <div className="app-shell">
      <Opened />
      <header className="topbar">
        <button className="brand" onClick={() => { setMenuSection(null); setTalkOpen(false); setTab("home"); }} aria-label={`${APP_NAME}, Today`}>
          <Mark size={28} color="var(--brand)" />
        </button>
        <h1>{TITLES[tab]}</h1>
        {tab !== "home" && <button className="ref" onClick={() => setGoalsOpen(true)} aria-label="Edit daily reference">
          {menuSection === "goal" ? pdText(dayPd) : <>{goal?.band ? goalLabel(goal.band).replace(" · ", ", ") : `${fmt(state.goals.calories, 0)} kcal, ${fmt(state.goals.protein)} g`} · {pdText(dayPd)}</>}
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
        {menuSection && <MenuScreen {...screenProps} section={menuSection} from={menuFrom} setSection={(s) => { setMenuFrom(null); setMenuSection(s); }} close={() => { setMenuFrom(null); setMenuSection(null); }} />}
        {!menuSection && !talkOpen && tab === "home" && <HomeScreen {...screenProps} />}
        {!menuSection && !talkOpen && tab === "journey" && <JourneyScreen {...screenProps} />}
        {talkOpen && !menuSection && <div className="talk-overlay"><OutScreen {...screenProps} turns={talkTurns} setTurns={(f) => setTalkTurns(f)} close={() => setTalkOpen(false)} toPlate={() => { setTalkOpen(false); setMenuSection(null); setStep("in"); setTab("journey"); }} /></div>}
        {!talkOpen && (
          <button className="chat-fab" aria-label="Mealan" onClick={() => {
            // one door: on a plate with food it answers about the plate; anywhere else it's the conversation
            if (!menuSection && tab === "journey" && (step === "in" || step === "recipe") && state.items.length > 0) setMealanAsk((n) => n + 1);
            else setTalkOpen(true);
          }}><Mark size={30} color="#fff" /></button>
        )}
        {!menuSection && !talkOpen && tab === "me" && <MeScreen {...screenProps} />}
        {!menuSection && !talkOpen && tab === "clients" && <ClientsScreen {...screenProps} />}
        {!menuSection && !talkOpen && tab === "meal" && <MealScreen {...screenProps} />}
        {!menuSection && !talkOpen && tab === "chef" && <ChefScreen {...screenProps} />}
        {!menuSection && !talkOpen && tab === "foods" && <FoodsScreen {...screenProps} />}
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
            className={tab === n.id || (n.id === "journey" && (tab === "meal" || tab === "chef")) ? "active" : ""}
            aria-current={tab === n.id ? "page" : undefined}
            onClick={() => { setMenuSection(null); setTalkOpen(false); setTab(n.id); }}
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
      {edit && (
        <LabelCheck
          key={edit.id}
          food={edit}
          image={image}
          images={imageSet}
          library={state.foods}
          close={() => { setEdit(null); setImageSet([]); setEditFrom(""); setEditTitle(""); }}
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
