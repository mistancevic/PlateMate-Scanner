import { useState } from "react";
import { Camera, ScanBarcode, Plus, Trash2, ArrowLeft, ChefHat, ThumbsUp, ThumbsDown } from "lucide-react";
import { aggregate, density, uid } from "../pilot";
import { fmt, fixed } from "../ui";
import { CHEF_NAME, COACH_NAME } from "../components/Mark";
import { log } from "../log";
import type { AppApi } from "./api";

const STEPS = ["in", "recipe", "after"] as const;
const band = (pd: number | null) => (pd === null || pd < 3 ? "low" : pd < 5 ? "mid" : "high");

export function JourneyScreen(p: AppApi) {
  const { state, setState, setTab, step, setStep, setCamera, setMode, blank, updateItem,
    setAdjustId, mixWith, options, pdRef, saveMeal, notify, setError, setFeedback, add } = p;
  const [q, setQ] = useState("");
  const [cap, setCap] = useState<number | null>(300);
  const [pick, setPick] = useState(0);
  const [note, setNote] = useState("");
  const [good, setGood] = useState<boolean | null>(null);
  const items = state.items;
  const t = aggregate(items);
  const pd = density(t.protein, t.calories);
  const n = STEPS.indexOf(step) + 1;
  const adjustFor = (o: { items: typeof items }) => o.items.find((i) => !i.locked)?.id;
  // Mealan moves the food with the highest protein density; everything else keeps the amount you set.
  function askMealan() {
    const pool = items.filter((i) => !i.locked);
    const mover = [...pool].sort((a, b) => (density(b.food.protein, b.food.calories) ?? -1) - (density(a.food.protein, a.food.calories) ?? -1))[0];
    if (!mover) { setError(`Everything is locked. Unlock the one product ${CHEF_NAME} may move.`); return; }
    const locked = items.map((i) => ({ ...i, locked: i.id !== mover.id, food: { ...i.food, readyToEat: true } }));
    setState((s) => ({ ...s, items: locked, foods: s.foods.map((f) => locked.some((x) => x.food.id === f.id) ? { ...f, readyToEat: true } : f) }));
    setAdjustId(mover.id); setPick(0);
    // mix reads state from the closure, so run it after the state update lands
    setTimeout(() => { if (mixWith(locked, mover.id)) setStep("recipe"); }, 0);
  }

  const Head = ({ title, sub }: { title: string; sub?: string }) => (
    <div className="step-head">
      <div className="step-bar">{STEPS.map((s, i) => <i key={s} className={i < n ? "on" : ""} />)}</div>
      <h2>{title}</h2>
      {sub && <p>{sub}</p>}
    </div>
  );
  const Back = ({ to }: { to: typeof STEPS[number] }) => (
    <button className="link back" onClick={() => setStep(to)}><ArrowLeft size={15} /> Back</button>
  );

  if (step === "in")
    return (
      <>
        <Head title="What are you craving?" sub={`Get the products in. Then ${CHEF_NAME} works out how much of each.`} />
        <div className="ways">
          <button className="pill pill-small" onClick={() => { setMode("group"); setCamera(true); }}><Camera size={15} /> Photo</button>
          <button className="pill pill-small" onClick={() => { setMode("barcode"); setCamera(true); }}><ScanBarcode size={15} /> Barcode</button>
          <button className="pill pill-small" onClick={() => { setMode("label"); setCamera(true); }}><Camera size={15} /> Label</button>
          <button className="pill pill-small" onClick={() => blank()}><Plus size={15} /> Type it</button>
        </div>
        {items.length > 0 && (
          <div className="rows">
            {items.map((i) => (
              <div className="row" key={i.id}>
                <button className={`dot ${i.locked ? "dot-locked" : "dot-free"}`} aria-label={`${i.locked ? "Unlock" : "Lock"} ${i.food.name}`}
                  onClick={() => { log("lock", { locked: !i.locked }); updateItem(i.id, { locked: !i.locked }); }} />
                <div className="row-text">
                  <b>{i.food.name}</b>
                  <small>PD {fixed(density(i.food.protein, i.food.calories))} · {i.locked ? "keep this amount" : `${CHEF_NAME} may move it`}</small>
                </div>
                <label className="grams">
                  <input aria-label={`Grams of ${i.food.name}`} type="number" min="0" inputMode="decimal" value={i.grams}
                    onChange={(e) => updateItem(i.id, { grams: Math.max(0, Number(e.target.value) || 0) })} />
                  <span>g</span>
                </label>
                <button className="icon" aria-label={`Remove ${i.food.name}`} onClick={() => setState((s) => ({ ...s, items: s.items.filter((x) => x.id !== i.id), portion: null }))}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        )}
        <p className="label">My foods</p>
        <input className="search" aria-label="Search my foods" placeholder="Search my foods" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="rows">
          {state.foods
            .filter((f) => (f.name + " " + f.brand).toLowerCase().includes(q.toLowerCase()))
            .slice(0, q ? 20 : 5)
            .map((f) => {
              const inList = items.some((i) => i.food.id === f.id);
              return (
                <div className="row row-food" key={f.id}>
                  <div className="row-text"><b>{f.name}</b><small>{f.brand ? `${f.brand} · ` : ""}PD {fixed(density(f.protein, f.calories))}</small></div>
                  <button className={`pill pill-small ${inList ? "" : "pill-primary"}`} disabled={inList} onClick={() => add(f)}>{inList ? "In" : <><Plus size={14} /> Add</>}</button>
                </div>
              );
            })}
          {state.foods.length === 0 && <small>No saved foods yet. Scan or type one above.</small>}
        </div>
        <button className="pill pill-primary pill-wide" disabled={items.length < 2} onClick={askMealan}>
          <ChefHat size={18} /> Ask {CHEF_NAME}
        </button>
        {items.length < 2 && <p className="small center">Two products at least, so {CHEF_NAME} has something to move.</p>}
        {items.length >= 2 && <p className="small center">Coral dot keeps the amount. {CHEF_NAME} moves the unlocked one with the most protein.</p>}
      </>
    );

  if (step === "recipe") {
    const o = options[pick % Math.max(options.length, 1)];
    if (!o) return (<><Head title={`${CHEF_NAME} found no mix`} sub="Change what is locked, or the amounts, and ask again." /><Back to="in" /></>);
    const over = cap !== null && o.grams > cap;
    const shown = over ? o.items.map((i) => (i.id === (adjustFor(o)) ? { ...i, grams: cap } : i)) : o.items;
    const ot = aggregate(shown); const opd = density(ot.protein, ot.calories);
    return (
      <>
        <Head title={`${CHEF_NAME}'s recipe`} sub={over ? `${o.food.name} would need ${fmt(o.grams, 0)} g to reach ${fixed(pdRef)}. At ${cap} g this is as close as it gets.` : (o.explanation || `${o.food.name} moved to ${fmt(o.grams, 0)} g. Everything you locked stayed.`)} />
        <section className="readout">
          <div className="readout-top"><span>This dessert</span><span>PD</span></div>
          <div className="readout-mid">
            <b>{fixed(opd)}</b>
            <div><span>{opd !== null && pdRef !== null && opd >= pdRef - 0.05 ? `on plan, target ${fixed(pdRef)}` : `target ${fixed(pdRef)}`}</span><small>{fmt(ot.calories, 0)} kcal · {fmt(ot.protein)} g protein · {fmt(ot.weight, 0)} g</small></div>
          </div>
        </section>
        <div className="rows">
          {shown.map((i) => (
            <div className="row" key={i.id}>
              <span className={`dot ${i.locked ? "dot-locked" : "dot-free"}`} />
              <div className="row-text"><b>{i.food.name}</b><small>{i.locked ? "as you wanted it" : `what ${CHEF_NAME} changed`}</small></div>
              <b className="row-num">{fmt(i.grams, 0)} g</b>
            </div>
          ))}
        </div>

        {over && <button className="pill pill-wide" onClick={() => setCap(null)}>Allow more than {cap} g</button>}
        <button className="pill pill-primary pill-wide" onClick={() => {
          log("mix_applied", { grams: Math.round(over ? cap! : o.grams) });
          setState((s) => ({ ...s, items: shown, portion: null, title: s.title || "DaaM" }));
          setTimeout(() => saveMeal(), 0);
          setStep("after");
        }}>Make it</button>
        {options.length > 1 && <button className="pill pill-wide" onClick={() => setPick((x) => x + 1)}>Try another mix ({(pick % options.length) + 1} of {options.length})</button>}
        <Back to="in" />
      </>
    );
  }

  // after
  return (
    <>
      <Head title="How was it?" sub={`One tap. ${COACH_NAME} sees it.`} />
      <div className="choices two">
        <button className={`choice ${good === true ? "on" : ""}`} onClick={() => setGood(true)}><ThumbsUp size={24} /><span>DaaM good</span></button>
        <button className={`choice ${good === false ? "on" : ""}`} onClick={() => setGood(false)}><ThumbsDown size={24} /><span>Not really</span></button>
      </div>
      <textarea placeholder="A line for your coach, if you like" value={note} onChange={(e) => setNote(e.target.value)} />
      <button className="pill pill-primary pill-wide" disabled={good === null} onClick={() => {
        const meal = state.meals[0] ?? { id: uid(), title: state.title || "DaaM", items: structuredClone(items), portion: t.weight, savedAt: new Date().toISOString() };
        const status = good ? "eaten" : "not-used";
        log("feedback", { status });
        setFeedback({ status, taste: good ? "DaaM good" : "Not really", notes: note });
        setState((s) => ({ ...s, feedback: [{ id: uid(), meal: structuredClone(meal), status, taste: good ? "DaaM good" : "Not really", notes: note, createdAt: new Date().toISOString() }, ...s.feedback], items: [], portion: null }));
        setGood(null); setNote(""); setStep("in");
        notify(`Thanks. ${COACH_NAME} will see it.`);
        setTab("home");
      }}>Send to {COACH_NAME}</button>
      <Back to="recipe" />
    </>
  );
}
