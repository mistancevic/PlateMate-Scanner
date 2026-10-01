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
import { iconFor } from "./icons";
import type { ScannerMode } from "./types";
import { fmt, fixed, pdText, pdVal, pdTag, pdRange, setPdUnit } from "./ui";
import { Mark, APP_NAME, COACH_NAME } from "./components/Mark";
import { log, isCoach, setCoach, getClientName, setClientName as storeClientName } from "./log";
import { MealScreen } from "./screens/MealScreen";
import { ChefScreen } from "./screens/ChefScreen";
import { FoodsScreen } from "./screens/FoodsScreen";
import { RecipesScreen } from "./screens/RecipesScreen";
import { MoreScreen } from "./screens/MoreScreen";
import type { AppApi, Tab, Step, MenuSection } from "./screens/api";
import { HomeScreen } from "./screens/HomeScreen";
import { GoalScreen } from "./screens/GoalScreen";
import { OutScreen, type Turn } from "./screens/OutScreen";
import { LandingScreen } from "./screens/LandingScreen";
import { PilotGate } from "./screens/PilotGate";
import { cloudEnabled, watchUser, loadCloud, saveCloud, signOutCloud, deleteAccount, explainCloudError, stripPhotos, isEmptyState, joinCoach, leaveCoach, savePhotos, loadPhotos, saveCards, loadCards, listClients, loadInbox, clearInboxItem, type CloudUser, type InboxItem } from "./cloud";
import { getGoal, clearGoal, saveGoal, bandOf, goalsForBand, fit as fitPd, getGoalLog, setGoalLog, type GoalEntry, type GoalSource } from "./goal";
import { getPersonal, setPersonal as storePersonal, calculate, dayFactor, getDayType, setDayType as storeDayType, type Personal, type DayType } from "./personal";
import { MenuScreen } from "./screens/MenuScreen";
import { ClientsScreen } from "./screens/ClientsScreen";
import { STARTER_FOODS, STARTER_REGION } from "./starter";
import { momentTarget, getUsual, setUsual, getRegion, setRegion, getTravelTo, setTravelTo, REGIONS, type MomentId, type RhythmId, type RegionId } from "./moments";
import { JourneyScreen } from "./screens/JourneyScreen";
import { MeScreen } from "./screens/MeScreen";
import { Home, CircleUser, Menu, Users } from "lucide-react";
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
const inputValue = (x: number | null) => (x === null ? "" : String(x));
function Modal({
  title,
  close,
  children,
}: {
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
        aria-label={title}
      >
        <header>
          <h2>{title}</h2>
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
function FoodEditor({
  food,
  image,
  images,
  close,
  save,
}: {
  food: Food;
  image?: string;
  images?: string[];
  close: () => void;
  save: (f: Food) => void;
}) {
  const [name, setName] = useState(food.name),
    [brand, setBrand] = useState(food.brand),
    [notes, setNotes] = useState(food.notes),
    [ready, setReady] = useState(food.readyToEat),
    [reviewed, setReviewed] = useState(false),
    [errors, setErrors] = useState<string[]>([]);
  const [values, setValues] = useState(
    Object.fromEntries(KEYS.map((k) => [k, inputValue(food[k])])) as Record<
      string,
      string
    >,
  );
  function submit() {
    const f = {
      ...food,
      name: name.trim(),
      brand: brand.trim(),
      notes,
      readyToEat: ready,
      reviewedAt: new Date().toISOString(),
      ...Object.fromEntries(KEYS.map((k) => [k, numberInput(values[k])])),
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
    const all = (images && images.length ? images : image ? [image] : []);
    if (all.length && !f.photo)
      Promise.all(all.map((x) => thumbnailBase64(x).catch(() => "")))
        .then((t) => { const ok = t.filter(Boolean); save({ ...f, photo: ok[0] || undefined, photos: ok.length > 1 ? ok.slice(1) : undefined }); })
        .catch(() => save(f));
    else save(f);
  }
  return (
    <Modal title="Review food data" close={close}>
      {images && images.length > 1 ? (
        <div className="label-previews" aria-label="Your photos of this product">
          {images.map((src, i) => <img key={i} className="label-preview" src={src} alt={`Photo ${i + 1} of ${images.length}`} />)}
        </div>
      ) : image ? (
        <img className="label-preview" src={image} alt="Captured nutrition label" />
      ) : null}
      {images && images.length > 1 && <p className="small center">{images.length} photos · swipe to see each</p>}
      <p className="small">
        Source: {food.source}. Check the actual package. All values below must
        be <strong>per 100 g</strong>, with carbohydrate excluding fibre.
      </p>
      <label>
        Product name
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label>
        Brand
        <input value={brand} onChange={(e) => setBrand(e.target.value)} />
      </label>
      <div className="form-grid">
        {KEYS.map((k) => (
          <label key={k}>
            {LABELS[k]} ({k === "calories" ? "kcal" : "g"})
            <input
              inputMode="decimal"
              value={values[k]}
              placeholder="Unknown"
              onChange={(e) =>
                setValues((v) => ({ ...v, [k]: e.target.value }))
              }
            />
          </label>
        ))}
      </div>
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
      return (["home", "journey", "meal", "chef", "foods", "notes", "more", "me"] as Tab[]).includes(h as Tab) ? (h as Tab) : "home";
    }),
    [filter, setFilter] = useState<"all" | "high" | "mid" | "low" | "inmeal">("all"),
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
    [profile, setProfile] = useState<{ role?: "coach"; coachId?: string; coachName?: string; coachSetAt?: string; formula?: "mifflin" | "katch" | null }>({}),
    [goalLog, setGoalLogState] = useState<GoalEntry[]>(getGoalLog),
    nextSource = useRef<GoalSource | null>(null),
    [moment, setMomentState] = useState<MomentId>("regular"),
    [usual, setUsualState] = useState<RhythmId[]>(getUsual),
    [region, setRegionState] = useState<RegionId | null>(getRegion),
    [travelTo, setTravelToState] = useState<RegionId | null>(getTravelTo),
    [newShared, setNewShared] = useState(0),
    [inbox, setInbox] = useState<InboxItem[]>([]),
    [personal, setPersonalState] = useState<Personal>(getPersonal),
    [dayType, setDayTypeState] = useState<DayType>(getDayType),
    [menuSection, setMenuSection] = useState<MenuSection | null>(null),
    [menuFrom, setMenuFrom] = useState<MenuSection | null>(null),
    [talkOpen, setTalkOpen] = useState(false),
    [profileReady, setProfileReady] = useState(false),
    [talkTurns, setTalkTurns] = useState<Turn[]>([]),
    [mealanAsk, setMealanAsk] = useState(0),
    [camera, setCamera] = useState(false),
    [mode, setMode] = useState<ScannerMode>("label"),
    [busy, setBusy] = useState(""),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [edit, setEdit] = useState<Food | null>(null),
    [image, setImage] = useState(""),
    [imageSet, setImageSet] = useState<string[]>([]),
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
    runRef = useRef(0);
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
      localStorage.setItem(STORE, JSON.stringify(state));
    } catch {
      setError(
        "This browser could not save your changes. Export a backup before leaving.",
      );
    }
  }, [state]);
  useEffect(() => {
    setOptions([]);
  }, [state.items, state.goals, limits]);
  useEffect(() => watchUser((u) => { setUser(u); setAuthReady(true); if (!u) { cloudLoaded.current = false; setProfileReady(false); } }), []);
  useEffect(() => {
    if (!user || cloudLoaded.current) return;
    (async () => {
      try {
        const remote = await loadCloud(user.uid);
        if (remote) setProfile({ role: remote.role, coachId: remote.coachId, coachName: remote.coachName, coachSetAt: remote.coachSetAt, formula: remote.formula ?? null });
        if (remote && Array.isArray(remote.goalLog)) { const merged = [...new Map([...(remote.goalLog as GoalEntry[]), ...getGoalLog()].map((e) => [e.at, e])).values()].sort((x, y) => (x.at > y.at ? 1 : -1)); setGoalLog(merged); setGoalLogState(merged); }
        if (remote && !(isEmptyState(remote.state) && !isEmptyState(state))) {
          // a real account copy replaces the phone; photos are merged back from the phone by id
          try {
            const incoming = parseState(JSON.stringify(remote.state));
            const localPhoto = new Map(state.foods.map((f) => [f.id, f.photo]));
            const localFb = new Map(state.feedback.map((f) => [f.id, f.photo]));
            let cloudPhotos = new Map<string, string>();
            try { cloudPhotos = await loadPhotos(user.uid); } catch { /* photos are optional */ }
            let cards: any[] = [];
            try { cards = await loadCards(user.uid); } catch { /* none yet */ }
            const byId = new Map<string, any>();
            for (const fb of [...cards, ...incoming.feedback, ...state.feedback]) if (!byId.has(fb.id)) byId.set(fb.id, fb);
            const localMore = new Map(state.foods.map((f) => [f.id, f.photos]));
            incoming.foods = incoming.foods.map((f) => {
              const more = [1, 2, 3, 4, 5].map((n) => cloudPhotos.get(`food:${f.id}:${n}`)).filter(Boolean) as string[];
              return { ...f, photo: f.photo ?? localPhoto.get(f.id) ?? cloudPhotos.get(`food:${f.id}`), photos: f.photos ?? localMore.get(f.id) ?? (more.length ? more : undefined) };
            });
            incoming.feedback = [...byId.values()].sort((x, y) => (y.createdAt > x.createdAt ? 1 : -1)).map((f) => ({ ...f, photo: f.photo ?? localFb.get(f.id) ?? cloudPhotos.get(`fb:${f.id}`) }));
            setState(incoming);
          } catch { /* keep local if the cloud copy is unreadable */ }
          if (remote.goal) { try { localStorage.setItem("chefmealan-goal", JSON.stringify(remote.goal)); } catch {} setGoalState(getGoal()); setGoalOpen(!remote.goal); }
          if (remote.clientName) { storeClientName(remote.clientName); setClientNameState(remote.clientName); }
          if (remote.personal && typeof remote.personal === "object") { storePersonal(remote.personal as Personal); setPersonalState(remote.personal as Personal); }
          setCloudStatus({ ok: true, text: "Loaded from your account", at: new Date().toISOString() });
        } else {
          await saveCloud(user.uid, { state: stripPhotos(state), goal: getGoal(), clientName, personal: getPersonal(), goalLog: getGoalLog(), updatedAt: new Date().toISOString() });
          setCloudStatus({ ok: true, text: "Saved to your account", at: new Date().toISOString() });
        }
      } catch (e: any) {
        const why = explainCloudError(e);
        setCloudStatus({ ok: false, text: `Not saved: ${why}` });
        setError(`Could not reach your account: ${why}. Working on this phone for now.`);
      }
      cloudLoaded.current = true;
      setProfileReady(true);
    })();
  }, [user]);
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
  // when the app comes back to the front, pick up a goal the coach set meanwhile
  useEffect(() => {
    if (!user) return;
    const onShow = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const remote = await loadCloud(user.uid);
        if (!remote) return;
        setProfile({ role: remote.role, coachId: remote.coachId, coachName: remote.coachName, coachSetAt: remote.coachSetAt, formula: remote.formula ?? null });
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
    notify(`Your numbers moved with your profile: ${r.kcal.toLocaleString()} kcal, ${r.protein} g protein.`);
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
      saveCloud(user.uid, { state: stripPhotos(state), goal: getGoal(), clientName, personal: getPersonal(), goalLog: getGoalLog(), updatedAt: new Date().toISOString() })
        .then(async () => {
          setCloudStatus({ ok: true, text: "Saved to your account", at: new Date().toISOString() });
          try { if (state.feedback.length) await saveCards(user.uid, state.feedback); } catch (e) { setCloudStatus({ ok: true, text: `Saved. Cards: ${explainCloudError(e)}`, at: new Date().toISOString() }); }
          // photos not yet in the account go up now, once
          let done = new Set<string>();
          try { done = new Set(JSON.parse(localStorage.getItem(`chefmealan-photos-up-${user.uid}`) || "[]")); } catch {}
          const pending = [
            ...state.foods.filter((f) => f.photo && f.photo.startsWith("data:")).map((f) => ({ key: `food:${f.id}`, data: f.photo! })),
            ...state.foods.flatMap((f) => (f.photos ?? []).filter((x) => x.startsWith("data:")).map((x, n) => ({ key: `food:${f.id}:${n + 1}`, data: x }))),
            ...state.feedback.filter((f) => f.photo && f.photo.startsWith("data:")).map((f) => ({ key: `fb:${f.id}`, data: f.photo! })),
          ].filter((p) => !done.has(p.key));
          if (!pending.length) return;
          try {
            await savePhotos(user.uid, pending);
            pending.forEach((p) => done.add(p.key));
            try { localStorage.setItem(`chefmealan-photos-up-${user.uid}`, JSON.stringify([...done])); } catch {}
            setCloudStatus({ ok: true, text: `Saved to your account, with ${pending.length} photo${pending.length === 1 ? "" : "s"}`, at: new Date().toISOString() });
          } catch (e) { setCloudStatus({ ok: true, text: `Saved to your account. Photos: ${explainCloudError(e)}`, at: new Date().toISOString() }); }
        })
        .catch((e) => setCloudStatus({ ok: false, text: `Not saved: ${explainCloudError(e)}` }));
    }, 1000);
    return () => clearTimeout(t);
  }, [state, goal, clientName, personal, goalLog, user]);
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
  function blank(name = "", brand = "") {
    setImage("");
    setEdit(candidateFood({ product_name: name, brand }, "Manual entry"));
  }
  function saveFood(f: Food) {
    setState((s) => ({
      ...s,
      foods: s.foods.some((x) => x.id === f.id)
        ? s.foods.map((x) => (x.id === f.id ? f : x))
        : [f, ...s.foods],
    }));
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
  async function scan(raw: string | string[], group = false) {
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
      });
      if (run !== runRef.current) return;
      if (group) {
        const entities = Array.isArray(data?.entities) ? data.entities : [];
        log("food_in", { way: "group", products: entities.length });
        const read = (x: any) => x && x.calories !== null && x.protein !== null;
        if (entities.length === 1 && read(entities[0])) {
          // one product from several sides, its table read: straight to review, like a single label
          setImage(images[0]);
          setImageSet(images);
          setEdit(candidateFood(entities[0], "Photos · review required"));
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
        setImage(images[0]);
        setImageSet(images);
        setEdit(candidateFood(data, "Label photo · review required"));
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
    try {
      const local = state.foods.find((f) => f.barcode === code.trim());
      if (local) {
        setEdit({ ...local });
        notify("Found your saved food. Check the package is still the same.");
      } else {
        const d = await api(`/api/product/${code.trim()}`);
        if (run !== runRef.current) return;
        setEdit(
          candidateFood(d, d.source || "Product database · review required"),
        );
      }
    } catch (e: any) {
      if (run === runRef.current) setError(e.message);
    } finally {
      if (run === runRef.current) setBusy("");
    }
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
  function todayKcalOf(): number | null {
    const k = state.goals.calories ?? null;
    if (k === null || personal.dayMode !== "follow") return k;
    const { base, today } = dayFactor(dayType, personal);
    return Math.round((k * today) / base / 50) * 50;
  }
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
    const foods = [
      selected.food,
      ...state.foods.filter((f) => f.id !== selected.food.id && f.readyToEat),
    ];
    const results = [];
    for (const food of foods) {
      const candidate = itemsIn.map((x) =>
          x.id === id ? { ...x, food } : x,
        ),
        s = solveIngredient(candidate, id, target, max);
      if (s.ok === false) {
        if (food.id === selected.food.id) reason = s.reason;
        continue;
      }
      const t = aggregate(s.items);
      if (
        (minP !== null && (t.protein === null || t.protein < minP)) ||
        (maxE !== null && (t.calories === null || t.calories > maxE))
      )
        continue;
      results.push({ food, items: s.items, grams: s.grams });
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
  const totals = aggregate(state.items),
    todayKcal = todayKcalOf(),
    dayPd = density(state.goals.protein, todayKcal),
    pdRef = momentTarget(moment, dayPd);
  const selected = portionTotals(state.items, state.portion);
  const matched =
    selected.calories !== null &&
    selected.protein !== null &&
    pdRef !== null &&
    Math.abs(density(selected.protein, selected.calories)! - pdRef) <= 0.05;
  const screenProps: AppApi = {
    state, setState, setTab, setCamera, setMode, blank, add, updateItem,
    saveMeal, mix, personalize, lookup, exportData, notify, setError, setBusy,
    api, setImage, setEdit, setGoalsOpen, setAccessOpen, setReviewMeal,
    setFeedback, setAdjustId, adjustId, limits, setLimits, options, pending,
    setPending, barcode, setBarcode, query, setQuery, busy, services, totals,
    pdRef, dayPd, moment, setMoment: (m: MomentId) => setMomentState(m), usual, setUsual: (ids: RhythmId[]) => { setUsual(ids); setUsualState(ids); },
    region, setRegion: (r: RegionId) => { setRegion(r); setRegionState(r); },
    travelTo, setTravelTo: (r: RegionId | null) => { setTravelTo(r); setTravelToState(r); },
    personal, setPersonal: (x: Personal) => { storePersonal(x); setPersonalState(x); },
    goalLog, formula: profile.formula ?? null, todayKcal, dayType, setDayType: (d: DayType) => { storeDayType(d); setDayTypeState(d); },
    applyNumbers: (bandId: string, kcal: number, protein: number, method?: string) => {
      nextSource.current = "profile";
      saveGoal({ band: bandId, setBy: "you", setAt: new Date().toISOString(), source: "profile", method });
      setGoalState(getGoal());
      setState((s) => ({ ...s, goals: { ...s.goals, calories: kcal, protein } }));
    },
    openMenu: (s?: MenuSection, from?: MenuSection) => { setMenuFrom(from ?? null); setMenuSection(s ?? "list"); },
    inbox,
    takeRecipe: async (item: InboxItem, how: "make" | "keep") => {
      // foods she doesn't have come along; then the recipe goes to the plate or to her recipes
      setState((s) => {
        const have = new Set(s.foods.map((f) => (f.name + "|" + f.brand).toLowerCase()));
        const newFoods = (item.meal.items as Ingredient[]).map((i) => i.food).filter((f) => !have.has((f.name + "|" + f.brand).toLowerCase())).map((f) => ({ ...f, id: uid(), icon: f.icon || iconFor(f.name), reviewedAt: new Date().toISOString() }));
        const foods = [...s.foods, ...newFoods];
        const items = (item.meal.items as Ingredient[]).map((i) => { const lib = foods.find((f) => (f.name + "|" + f.brand).toLowerCase() === (i.food.name + "|" + i.food.brand).toLowerCase()); return { id: uid(), food: lib ?? i.food, grams: i.grams, locked: true }; });
        const meal = { id: uid(), title: item.meal.title || "From your coach", items, portion: items.reduce((n, i) => n + i.grams, 0), savedAt: new Date().toISOString() };
        return how === "make" ? { ...s, foods, items, portion: null, title: meal.title } : { ...s, foods, meals: [meal, ...s.meals] };
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
    recordTalk: (q: string, reply: string, plate: string[]) => setTalkTurns((t) => [...t, { role: "you", text: q, plate }, { role: "mealan", text: reply }]),
    shareCard: (id: string, reason: "look" | "ok" | "help") => {
      setState((s) => ({ ...s, feedback: s.feedback.map((f) => (f.id === id ? { ...f, shared: { reason, at: new Date().toISOString() } } : f)) }));
      notify(`Shared with ${profile.coachName || "your coach"}.`);
    },
    user, cloudEnabled, cloudStatus, profile,
    joinCoach: async (code: string) => { if (!user) return; try { const r = await joinCoach(user.uid, code); setProfile((p) => ({ ...p, ...r })); notify(`You're with ${r.coachName} now.`); } catch (e: any) { setError(e.message); } },
    leaveCoach: async () => { if (!user) return; try { await leaveCoach(user.uid); setProfile((p) => ({ ...p, coachId: undefined, coachName: undefined })); } catch (e: any) { setError(e.message); } },
    signOut: async () => { await signOutCloud(); cloudLoaded.current = false; },
    deleteAccount: async () => { try { await deleteAccount(); localStorage.clear(); location.reload(); } catch (e: any) { setError(e.message || "Could not delete the account. Sign in again and retry."); } },
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
  if (!authReady) return <div className="app-shell"><main /></div>;
  if (cloudEnabled && !user) return <LandingScreen />;
  if (cloudEnabled && user && !profileReady) return <div className="app-shell"><main /></div>;
  if (cloudEnabled && user && profile.role !== "coach" && !profile.coachId)
    return <div className="app-shell"><main><PilotGate {...screenProps} /></main></div>;
  if (goalOpen)
    return (
      <div className="app-shell"><main><GoalScreen {...screenProps} onDone={() => { setGoalState(getGoal()); setGoalOpen(false); }} /></main></div>
    );
  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setTab("journey")} aria-label={APP_NAME}>
          <Mark size={28} color="var(--brand)" />
        </button>
        <h1>{TITLES[tab]}</h1>
        {tab !== "home" && <button className="ref" onClick={() => setGoalsOpen(true)} aria-label="Edit daily reference">
          {goal?.band ? bandOf(goal.band)?.name : `${fmt(state.goals.calories, 0)} kcal · ${fmt(state.goals.protein)} g`} · {pdText(dayPd)} · set by {goal?.setBy === "coach" ? (goal.coachName || profile.coachName || COACH_NAME) : "you"}
        </button>}
        <button className="icon menu-button" aria-label="Settings" onClick={() => setMenuSection(menuSection ? null : "list")}><Menu size={22} /></button>
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
        {!menuSection && !talkOpen && tab === "notes" && <RecipesScreen {...screenProps} />}
        {!menuSection && !talkOpen && tab === "more" && <MoreScreen {...screenProps} />}
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
            className={tab === n.id || (n.id === "journey" && (tab === "meal" || tab === "chef")) || (n.id === "me" && (tab === "more" || tab === "notes")) ? "active" : ""}
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
        <FoodEditor
          key={edit.id}
          food={edit}
          image={image}
          images={imageSet}
          close={() => { setEdit(null); setImageSet([]); }}
          save={saveFood}
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
