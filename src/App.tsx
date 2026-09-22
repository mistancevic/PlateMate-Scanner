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
import { resizeImageBase64 } from "./utils/image";
import type { ScannerMode } from "./types";
import { fmt, fixed } from "./ui";
import { Mark, APP_NAME, COACH_NAME } from "./components/Mark";
import { log, isCoach, setCoach } from "./log";
import { MealScreen } from "./screens/MealScreen";
import { ChefScreen } from "./screens/ChefScreen";
import { FoodsScreen } from "./screens/FoodsScreen";
import { RecipesScreen } from "./screens/RecipesScreen";
import { MoreScreen } from "./screens/MoreScreen";
import type { AppApi, Tab } from "./screens/api";
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
  close,
  save,
}: {
  food: Food;
  image?: string;
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
    if (!e.length) save(f);
  }
  return (
    <Modal title="Review food data" close={close}>
      {image && (
        <img
          className="label-preview"
          src={image}
          alt="Captured nutrition label"
        />
      )}
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
      return (["meal", "chef", "foods", "notes", "more"] as Tab[]).includes(h as Tab) ? (h as Tab) : "meal";
    }),
    [filter, setFilter] = useState<"all" | "high" | "mid" | "low" | "inmeal">("all"),
    [coach, setCoachState] = useState<boolean>(isCoach),
    [camera, setCamera] = useState(false),
    [mode, setMode] = useState<ScannerMode>("label"),
    [busy, setBusy] = useState(""),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [edit, setEdit] = useState<Food | null>(null),
    [image, setImage] = useState(""),
    [goalsOpen, setGoalsOpen] = useState(false),
    [pending, setPending] = useState<{ name: string; brand: string }[]>([]),
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
  async function api(url: string, body?: unknown) {
    const res = await fetch(url, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        "Content-Type": "application/json",
        ...(access ? { Authorization: `Bearer ${access}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(65000),
    });
    const data = await res
      .json()
      .catch(() => ({ error: "The server returned an unreadable response." }));
    if (res.status === 401) {
      setAccessOpen(true);
      throw new Error("Enter your pilot access key, then retry.");
    }
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
        { id: uid(), food: { ...food }, grams: 100, locked: true },
      ],
      portion: null,
    }));
    setTab("meal");
    notify(
      "Added 100 g as a starting amount. Set the quantity you will actually use.",
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
        log("food_in", { way: "group" });
        setPending(
          data.entities.map((x: any) => ({
            name: x.product_name,
            brand: x.brand || "",
          })),
        );
        setTab("foods");
        notify(
          "Review each identified product. Photos do not establish nutrients or quantities.",
        );
      } else {
        if (!data.success)
          throw new Error(
            data.error_reason ||
              "Label could not be read. Try another photo or enter it manually.",
          );
        setImage(images[0]);
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
  function mix() {
    setError("");
    const target = density(state.goals.protein, state.goals.calories);
    if (target === null || target <= 0) {
      setError("Set daily energy and protein targets first.");
      return;
    }
    const selected = state.items.find((x) => x.id === adjustId);
    if (!selected || selected.locked) {
      setError(
        "Unlock one supporting ingredient, then select it here. Other quantities stay fixed.",
      );
      return;
    }
    if (
      !selected.food.readyToEat ||
      state.items.some((x) => !x.food.readyToEat)
    ) {
      setError(
        "This pilot mixes ready-to-eat foods only. Confirm each food’s preparation state in Saved foods, then add the reviewed versions to the meal.",
      );
      return;
    }
    if (
      Object.values(limits).some(
        (x) => x.trim() !== "" && numberInput(x) === null,
      )
    ) {
      setError("Meal limits must be non-negative numbers, or blank.");
      return;
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
      const candidate = state.items.map((x) =>
          x.id === adjustId ? { ...x, food } : x,
        ),
        s = solveIngredient(candidate, adjustId, target, max);
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
      setOptions((current) =>
        data.suggestions
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
  const totals = aggregate(state.items),
    pdRef = density(state.goals.protein, state.goals.calories);
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
    pdRef, matched, importRef, filter, setFilter,
    coach, setCoach: (v: boolean) => { setCoach(v); setCoachState(v); },
    mealanCard: (
      <Mealan
        items={state.items}
        portion={state.portion}
        goals={state.goals}
        title={state.title}
      />
    ),
  };
  const NAV: { id: Tab; label: string }[] = [
    { id: "meal", label: "Meal" },
    { id: "chef", label: "Chef" },
    { id: "foods", label: "Foods" },
    ...(coach ? [{ id: "notes" as Tab, label: "Recipes" }] : []),
    { id: "more", label: "More" },
  ];
  const TITLES: Record<Tab, string> = {
    meal: "Meal",
    chef: "Chef",
    foods: "Foods",
    notes: "Recipes",
    more: "More",
  };
  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setTab("meal")} aria-label={APP_NAME}>
          <Mark size={30} color="var(--brand)" />
        </button>
        <h1>{TITLES[tab]}</h1>
        <button className="ref" onClick={() => setGoalsOpen(true)} aria-label="Edit daily reference">
          {fmt(state.goals.calories, 0)} kcal · {fmt(state.goals.protein)} g · PD {fixed(pdRef)} · set by {COACH_NAME}
        </button>
      </header>
      <main>
        {error && (
          <div className="notice" role="alert">
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
          <div className="success" role="status">
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
        {tab === "meal" && <MealScreen {...screenProps} />}
        {tab === "chef" && <ChefScreen {...screenProps} />}
        {tab === "foods" && <FoodsScreen {...screenProps} />}
        {tab === "notes" && <RecipesScreen {...screenProps} />}
        {tab === "more" && <MoreScreen {...screenProps} />}
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
              if (
                confirm(
                  "Replace this browser’s pilot data with this backup? Export first if needed.",
                )
              ) {
                unreadableBackup = null;
                setState(data);
                notify("Backup imported.");
              }
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
            className={tab === n.id ? "active" : ""}
            aria-current={tab === n.id ? "page" : undefined}
            onClick={() => setTab(n.id)}
          >
            {n.label}
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
              setTab("meal");
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
          close={() => setEdit(null)}
          save={saveFood}
        />
      )}{" "}
      {goalsOpen && (
        <GoalsEditor
          goals={state.goals}
          close={() => setGoalsOpen(false)}
          save={(g) => {
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
