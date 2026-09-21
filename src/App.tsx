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
const fmt = (n: number | null, d = 1) =>
  n === null ? "?" : n.toLocaleString(undefined, { maximumFractionDigits: d });
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
    [tab, setTab] = useState<"meal" | "foods" | "notes">("meal"),
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
  return (
    <div className="app-shell">
      <header className="topbar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setTab("meal");
          }}
        >
          <span className="brand-mark">
            <Leaf size={22} />
          </span>
          <span>
            PlateMate<small>MEALAN PILOT</small>
          </span>
        </a>
        <button className="subtle" onClick={() => setGoalsOpen(true)}>
          <SlidersHorizontal size={17} />
          <span>Daily reference</span>
        </button>
      </header>
      <main>
        <div className="intro">
          <span className="eyebrow">
            FOOD YOU ENJOY. A PLAN YOU CAN LIVE WITH.
          </span>
          <h1>Make it your meal.</h1>
          <p>
            Start with what you want to eat. See the portion. Find a mix that
            works for you.
          </p>
        </div>
        <div className="reference-strip">
          <span>YOUR DAILY REFERENCE</span>
          <b>{fmt(state.goals.calories, 0)} kcal</b>
          <b>{fmt(state.goals.protein)} g protein</b>
          <span className="pd-tag">PD {fmt(pdRef, 2)}</span>
          <button onClick={() => setGoalsOpen(true)}>
            Edit <ArrowRight size={13} />
          </button>
        </div>
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
        <nav className="tabs" aria-label="Workspace">
          <button
            className={tab === "meal" ? "active" : ""}
            onClick={() => setTab("meal")}
          >
            <Utensils size={17} /> My meal{" "}
            {state.items.length > 0 && <span>{state.items.length}</span>}
          </button>
          <button
            className={tab === "foods" ? "active" : ""}
            onClick={() => setTab("foods")}
          >
            <BookOpen size={17} /> Saved foods
          </button>
          <button
            className={tab === "notes" ? "active" : ""}
            onClick={() => setTab("notes")}
          >
            <Sparkles size={17} /> Recipes & taste
          </button>
        </nav>
        {tab === "meal" && (
          <div className="workspace">
            <div className="main-column">
              <section className="panel">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">BUILD YOUR BOWL</span>
                    <h2>Your ingredients</h2>
                  </div>
                  <button className="subtle" onClick={() => setTab("foods")}>
                    <Plus size={16} /> Add food
                  </button>
                </div>
                <label>
                  Meal name
                  <input
                    value={state.title}
                    onChange={(e) =>
                      setState({ ...state, title: e.target.value })
                    }
                  />
                </label>
                {!state.items.length ? (
                  <div className="empty">
                    <Utensils size={34} />
                    <h3>What are you craving?</h3>
                    <p>
                      Scan or enter a food, check its label, then add the amount
                      you want.
                    </p>
                    <button
                      className="primary"
                      onClick={() => {
                        setMode("label");
                        setCamera(true);
                      }}
                    >
                      <Camera size={17} /> Scan a label
                    </button>
                    <button className="subtle" onClick={() => blank()}>
                      Enter a food manually
                    </button>
                  </div>
                ) : (
                  <div className="ingredient-list">
                    {state.items.map((item) => (
                      <article className="ingredient" key={item.id}>
                        <div className="ingredient-name">
                          <b>{item.food.name}</b>
                          <small>
                            {item.food.brand} · PD{" "}
                            {fmt(
                              density(item.food.protein, item.food.calories),
                              2,
                            )}
                          </small>
                        </div>
                        <label className="quantity">
                          Amount
                          <input
                            aria-label={`Grams of ${item.food.name}`}
                            type="number"
                            min="0"
                            step="1"
                            value={item.grams}
                            onChange={(e) =>
                              updateItem(item.id, {
                                grams: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                          />
                          <span>g</span>
                        </label>
                        <button
                          className={`icon ${item.locked ? "locked" : ""}`}
                          aria-label={`${item.locked ? "Unlock" : "Lock"} ${item.food.name}`}
                          title={
                            item.locked
                              ? "Amount locked"
                              : "Available for adjustment"
                          }
                          onClick={() => {
                            updateItem(item.id, { locked: !item.locked });
                            if (item.locked) setAdjustId(item.id);
                          }}
                        >
                          {item.locked ? (
                            <LockKeyhole size={17} />
                          ) : (
                            <Unlock size={17} />
                          )}
                        </button>
                        <button
                          className="icon"
                          aria-label={`Remove ${item.food.name}`}
                          onClick={() =>
                            setState((s) => ({
                              ...s,
                              items: s.items.filter((x) => x.id !== item.id),
                              portion: null,
                            }))
                          }
                        >
                          <Trash2 size={17} />
                        </button>
                      </article>
                    ))}
                  </div>
                )}
                <div className="button-row">
                  <button
                    className="subtle"
                    onClick={() => {
                      setMode("label");
                      setCamera(true);
                    }}
                  >
                    <Camera size={16} /> Scan another
                  </button>
                  <button className="subtle" onClick={() => blank()}>
                    <Plus size={16} /> Manual entry
                  </button>
                </div>
              </section>
              {state.items.length > 0 && (
                <section className="panel chef">
                  <span className="eyebrow">CHEF · KEEP THE FOOD YOU LOVE</span>
                  <h2>Find a protein-friendly mix.</h2>
                  <p>
                    Lock the amounts you want to keep. Choose one ready-to-eat
                    ingredient to adjust, or let the Chef compare your saved
                    alternatives.
                  </p>
                  <label>
                    Supporting ingredient
                    <select
                      aria-label="Supporting ingredient"
                      value={adjustId}
                      onChange={(e) => setAdjustId(e.target.value)}
                    >
                      <option value="">Select an unlocked ingredient</option>
                      {state.items
                        .filter((x) => !x.locked)
                        .map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.food.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <div className="form-grid three">
                    <label>
                      Whole recipe max (g)
                      <input
                        inputMode="decimal"
                        value={limits.maxWeight}
                        onChange={(e) =>
                          setLimits({ ...limits, maxWeight: e.target.value })
                        }
                        placeholder="Optional"
                      />
                    </label>
                    <label>
                      Whole recipe min protein (g)
                      <input
                        inputMode="decimal"
                        value={limits.minProtein}
                        onChange={(e) =>
                          setLimits({ ...limits, minProtein: e.target.value })
                        }
                        placeholder="Optional"
                      />
                    </label>
                    <label>
                      Whole recipe max kcal
                      <input
                        inputMode="decimal"
                        value={limits.maxKcal}
                        onChange={(e) =>
                          setLimits({ ...limits, maxKcal: e.target.value })
                        }
                        placeholder="Optional"
                      />
                    </label>
                  </div>
                  <button className="primary" onClick={mix}>
                    <Sparkles size={17} /> Find a mix at PD {fmt(pdRef, 2)}
                  </button>
                  <p className="small">
                    Calculated from your foods. No AI key required. Matching
                    density does not establish a complete meal or allergen
                    suitability.
                  </p>
                  {options.length > 0 && (
                    <div className="options">
                      {options.map((o) => {
                        const t = aggregate(o.items);
                        return (
                          <article key={o.food.id}>
                            <div>
                              <h3>
                                {fmt(o.grams, 0)} g {o.food.name}
                              </h3>
                              <p>
                                {fmt(t.calories, 0)} kcal · {fmt(t.protein)} g
                                protein · {fmt(t.weight)} g whole recipe
                              </p>
                              {o.explanation && <p>{o.explanation}</p>}
                            </div>
                            <button
                              className="subtle"
                              onClick={() => {
                                setState((s) => ({
                                  ...s,
                                  items: o.items,
                                  portion: null,
                                }));
                                notify(
                                  "Mix applied. Other ingredient quantities were preserved. Check whether the taste and portion work for you.",
                                );
                              }}
                            >
                              Use this mix
                            </button>
                          </article>
                        );
                      })}
                      <button
                        className="subtle"
                        onClick={personalize}
                        disabled={busy !== ""}
                      >
                        <Sparkles size={16} /> Personalize with AI
                      </button>
                      <p className="small">
                        Optional: sends these candidates and your saved taste
                        notes to the configured AI provider. AI ranks options;
                        calculations stay deterministic.
                      </p>
                    </div>
                  )}
                </section>
              )}
            </div>
            <aside>
              {state.items.length > 0 ? (
                <>
                  <Mealan
                    items={state.items}
                    portion={state.portion}
                    goals={state.goals}
                    title={state.title}
                  />
                  <section className="panel">
                    <h3>How much will you eat?</h3>
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={state.portion === null}
                        onChange={(e) =>
                          setState((s) => ({
                            ...s,
                            portion: e.target.checked ? null : totals.weight,
                          }))
                        }
                      />{" "}
                      Whole recipe ({fmt(totals.weight)} g)
                    </label>
                    {state.portion !== null && (
                      <label>
                        Selected portion (g)
                        <input
                          type="number"
                          min="1"
                          max={totals.weight}
                          value={state.portion}
                          onChange={(e) =>
                            setState((s) => ({
                              ...s,
                              portion: Math.max(1, Number(e.target.value) || 1),
                            }))
                          }
                        />
                      </label>
                    )}
                    <p className="small">
                      {matched
                        ? "This portion is near your daily protein density. Check its actual grams and calories against your meal needs."
                        : "Density and portion size answer different questions. Your daily reference is not a prescribed meal size."}
                    </p>
                    <button className="primary wide" onClick={saveMeal}>
                      Save recipe
                    </button>
                  </section>
                </>
              ) : (
                <section className="panel how">
                  <span className="eyebrow">A QUICK EXAMPLE</span>
                  <h2>
                    Keep the Nutella.
                    <br />
                    Rethink the mix.
                  </h2>
                  <p>
                    A concentrated protein source can support a favourite
                    flavour. The amount still matters.
                  </p>
                  <ol>
                    <li>Confirm each ingredient's label.</li>
                    <li>Keep the amount you enjoy.</li>
                    <li>Calculate a feasible combination.</li>
                    <li>Try it, then tell the Chef what worked.</li>
                  </ol>
                  <button
                    className="subtle"
                    onClick={() => {
                      const n = candidateFood(
                        {
                          product_name: "Nutella — UK example",
                          calories: 539,
                          protein: 6.3,
                          fats: 30.9,
                          carbs: 57.5,
                          fiber: null,
                        },
                        "PRD worked example — verify your actual label",
                      );
                      const y = candidateFood(
                        {
                          product_name:
                            "Illustrative yogurt — NOT a real product",
                          calories: 60,
                          protein: 7.2,
                          fats: 0.8,
                          carbs: 6,
                          fiber: 0,
                        },
                        "Invented PRD test data, not a product recommendation",
                      );
                      n.readyToEat = y.readyToEat = true;
                      n.reviewedAt = y.reviewedAt = new Date().toISOString();
                      const id = uid();
                      setState((s) => ({
                        ...s,
                        title: "Example Nutella–Yogurt Dessert",
                        goals: s.goals.calories
                          ? s.goals
                          : {
                              calories: 2500,
                              protein: 150,
                              fats: 80,
                              carbs: 280,
                              fiber: 30,
                            },
                        items: [
                          { id: uid(), food: n, grams: 50, locked: true },
                          { id, food: y, grams: 100, locked: false },
                        ],
                        portion: null,
                      }));
                      setAdjustId(id);
                      notify(
                        "Illustrative example loaded. Yogurt data is invented. Replace it with real label data before eating or advising a client.",
                      );
                    }}
                  >
                    Try the worked example <ArrowRight size={16} />
                  </button>
                </section>
              )}
            </aside>
          </div>
        )}
        {tab === "foods" && (
          <>
            <section className="panel">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">YOUR INGREDIENT LIBRARY</span>
                  <h2>Start with real labels.</h2>
                </div>
                <button className="primary" onClick={() => blank()}>
                  <Plus size={16} /> Add manually
                </button>
              </div>
              <div className="button-row">
                {(["label", "barcode", "group"] as ScannerMode[]).map((m) => (
                  <button
                    className="subtle"
                    key={m}
                    onClick={() => {
                      setMode(m);
                      setCamera(true);
                    }}
                  >
                    <Camera size={16} />
                    {m === "group"
                      ? "Group photos"
                      : m === "barcode"
                        ? "Scan barcode"
                        : "Scan label"}
                  </button>
                ))}
              </div>
              <div className="barcode-entry">
                <input
                  aria-label="Barcode number"
                  placeholder="Or type barcode"
                  inputMode="numeric"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                />
                <button className="subtle" onClick={() => lookup()}>
                  <ScanBarcode size={17} /> Look up
                </button>
              </div>
              <p className="small">
                Saved on this device. Product matches and OCR always require
                review before saving. No photo can confirm how much you will
                eat.
              </p>
            </section>
            {pending.length > 0 && (
              <section className="panel">
                <h3>Products identified — confirm individually</h3>
                <p>
                  No nutrition or quantities have been assumed. Resolve each
                  product using its label or your saved foods. Repeated views
                  are not extra portions.
                </p>
                {pending.map((p, i) => (
                  <div className="pending" key={i}>
                    <span>
                      {p.brand} {p.name}
                    </span>
                    <button
                      className="subtle"
                      onClick={() => blank(p.name, p.brand)}
                    >
                      Enter label
                    </button>
                    <button
                      className="icon"
                      aria-label={`Dismiss ${p.name}`}
                      onClick={() =>
                        setPending((v) => v.filter((_, j) => j !== i))
                      }
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </section>
            )}
            <input
              className="search"
              aria-label="Search saved foods"
              placeholder="Search your saved foods…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="food-grid">
              {state.foods
                .filter((f) =>
                  (f.name + " " + f.brand)
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .map((f) => (
                  <article className="panel food" key={f.id}>
                    <small>{f.brand || "YOUR FOOD"}</small>
                    <h3>{f.name}</h3>
                    <div className="food-density">
                      <b>{fmt(density(f.protein, f.calories), 2)}</b>
                      <span>
                        PD<small>g protein / 100 kcal</small>
                      </span>
                    </div>
                    <p>{category(density(f.protein, f.calories))}</p>
                    <p className="small">
                      Per 100 g: {fmt(f.calories, 0)} kcal · {fmt(f.protein)} g
                      protein
                    </p>
                    <div className="button-row">
                      <button className="primary" onClick={() => add(f)}>
                        <Plus size={16} /> Add to meal
                      </button>
                      <button
                        className="subtle"
                        onClick={() => {
                          setImage("");
                          setEdit(f);
                        }}
                      >
                        Review
                      </button>
                    </div>
                    <details>
                      <summary>Source & storage</summary>
                      <p>{f.source}</p>
                      <p>{f.notes || "No label notes."}</p>
                      <p>
                        Reviewed {new Date(f.reviewedAt).toLocaleDateString()}.{" "}
                        {f.readyToEat
                          ? "Ready for cold mixing."
                          : "Preparation not confirmed for cold mixing."}
                      </p>
                      <button
                        className="subtle"
                        onClick={async () => {
                          setBusy("Saving reviewed food to Airtable…");
                          try {
                            await api("/api/save", { food: f });
                            notify(
                              "Reviewed food saved to the configured Airtable base. No client targets or taste notes were sent.",
                            );
                          } catch (e: any) {
                            setError(e.message);
                          } finally {
                            setBusy("");
                          }
                        }}
                      >
                        Save food to Airtable
                      </button>
                      <button
                        className="subtle danger"
                        onClick={() => {
                          if (
                            confirm(
                              "Remove this saved food? Existing recipes retain their snapshots.",
                            )
                          )
                            setState((s) => ({
                              ...s,
                              foods: s.foods.filter((x) => x.id !== f.id),
                            }));
                        }}
                      >
                        Remove saved food
                      </button>
                    </details>
                  </article>
                ))}
            </div>
            {state.foods.length === 0 && (
              <p className="empty-text">
                No saved foods yet. Scan a label or add one manually.
              </p>
            )}
          </>
        )}
        {tab === "notes" && (
          <div className="workspace">
            <div>
              <section className="panel">
                <span className="eyebrow">TASTE IS PART OF THE PLAN</span>
                <h2>What makes food work for you?</h2>
                <label>
                  Taste & practical preferences
                  <textarea
                    placeholder="E.g. creamy rather than sour; keep the chocolate flavour; small portions; quick preparation."
                    value={state.preferences}
                    onChange={(e) =>
                      setState((s) => ({ ...s, preferences: e.target.value }))
                    }
                  />
                </label>
                <p className="small">
                  Editable notes for future suggestions. The Chef does not infer
                  allergies or change your nutrition targets.
                </p>
              </section>
              <section className="panel">
                <h2>Saved recipes</h2>
                {!state.meals.length && (
                  <p>
                    Save a recipe from My meal. Saving does not log it as eaten.
                  </p>
                )}
                {state.meals.map((m) => (
                  <article className="recipe-row" key={m.id}>
                    <div>
                      <h3>{m.title}</h3>
                      <p>
                        {fmt(m.portion)} g portion ·{" "}
                        {new Date(m.savedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="button-row">
                      <button
                        className="subtle"
                        onClick={() => {
                          setState((s) => ({
                            ...s,
                            title: m.title,
                            items: structuredClone(m.items),
                            portion: m.portion,
                          }));
                          setTab("meal");
                        }}
                      >
                        Open
                      </button>
                      <button
                        className="subtle"
                        onClick={() => {
                          setFeedback({
                            status: "prepared",
                            taste: "",
                            notes: "",
                          });
                          setReviewMeal(m);
                        }}
                      >
                        Record feedback
                      </button>
                      <button
                        className="icon"
                        aria-label={`Delete recipe ${m.title}`}
                        onClick={() => {
                          if (
                            confirm(
                              "Delete this saved recipe? Existing feedback keeps its snapshot.",
                            )
                          )
                            setState((s) => ({
                              ...s,
                              meals: s.meals.filter((x) => x.id !== m.id),
                            }));
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </section>
            </div>
            <aside>
              <section className="panel">
                <h2>Your feedback</h2>
                {!state.feedback.length && (
                  <p>
                    After trying a recipe, record taste, portion size and
                    whether you prepared or ate it.
                  </p>
                )}
                {state.feedback.map((f) => (
                  <article className="feedback" key={f.id}>
                    <b>{f.meal.title}</b>
                    <small>
                      {f.status} · {new Date(f.createdAt).toLocaleDateString()}
                    </small>
                    <p>{f.taste}</p>
                    <p>{f.notes}</p>
                    <button
                      className="subtle"
                      onClick={() =>
                        setState((s) => ({
                          ...s,
                          feedback: s.feedback.filter((x) => x.id !== f.id),
                        }))
                      }
                    >
                      Forget this feedback
                    </button>
                  </article>
                ))}
              </section>
            </aside>
          </div>
        )}
        <footer>
          <p>
            PlateMate · Mealan pilot <span>0.3</span>
            <br />
            <small>
              Local data on this browser. Export before changing devices. AI
              services: {services?.ai ? "configured" : "not connected"} ·
              Airtable: {services?.airtable ? "configured" : "not connected"}
            </small>
          </p>
          <div className="button-row">
            <button className="subtle" onClick={exportData}>
              <Download size={15} /> Export
            </button>
            <button
              className="subtle"
              onClick={() => importRef.current?.click()}
            >
              <Upload size={15} /> Import
            </button>
            <button className="subtle" onClick={() => setAccessOpen(true)}>
              Server access
            </button>
          </div>
          <p className="small">
            Barcode data:{" "}
            <a
              href="https://world.openfoodfacts.org"
              target="_blank"
              rel="noreferrer"
            >
              Open Food Facts
            </a>{" "}
            · Community data; verify the package. No medical or
            meal-completeness claims.
          </p>
        </footer>
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
