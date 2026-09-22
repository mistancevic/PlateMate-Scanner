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
  const { state, setState, setTab, step, setStep, setCamera, setMode, blank,
    setAdjustId, mixWith, options, pdRef, saveMeal, notify, setError, setFeedback } = p;
  const [pick, setPick] = useState(0);
  const [note, setNote] = useState("");
  const [good, setGood] = useState<boolean | null>(null);
  const items = state.items;
  const t = aggregate(items);
  const pd = density(t.protein, t.calories);
  const n = STEPS.indexOf(step) + 1;
  // Mealan moves the food with the highest protein density; everything else keeps the amount you set.
  function askMealan() {
    const kept = items.filter((i) => i.keep);
    const pool = kept.length ? items.filter((i) => !i.keep) : items;
    const mover = [...pool].sort((a, b) => (density(b.food.protein, b.food.calories) ?? -1) - (density(a.food.protein, a.food.calories) ?? -1))[0];
    if (!mover) { setError(`Let ${CHEF_NAME} move at least one product.`); return; }
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
        <div className="choices">
          <button className="choice" onClick={() => { setMode("group"); setCamera(true); }}><Camera size={22} /><span>Photo of the products</span></button>
          <button className="choice" onClick={() => { setMode("barcode"); setCamera(true); }}><ScanBarcode size={22} /><span>Barcode</span></button>
          <button className="choice" onClick={() => { setMode("label"); setCamera(true); }}><Camera size={22} /><span>Label</span></button>
          <button className="choice" onClick={() => blank()}><Plus size={22} /><span>Type it</span></button>
        </div>
        {items.length > 0 && (
          <div className="rows">
            {items.map((i) => (
              <div className="row" key={i.id}>
                <div className="row-text"><b>{i.food.name}</b><small>{i.food.brand ? `${i.food.brand} · ` : ""}{fmt(i.food.calories, 0)} kcal · {fmt(i.food.protein)} g per 100 g</small></div>
                <span className={`pdpill pdpill-${band(density(i.food.protein, i.food.calories))}`}>{fixed(density(i.food.protein, i.food.calories))}<small>PD</small></span>
                <button className="icon" aria-label={`Remove ${i.food.name}`} onClick={() => setState((s) => ({ ...s, items: s.items.filter((x) => x.id !== i.id), portion: null }))}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        )}
        <button className="link" onClick={() => setTab("foods")}>Or pick from my foods</button>
        <button className="pill pill-primary pill-wide" disabled={items.length < 2} onClick={askMealan}>
          <ChefHat size={18} /> Ask {CHEF_NAME}
        </button>
        {items.length < 2 && <p className="small center">Two products at least, so {CHEF_NAME} has something to move.</p>}
        {items.length >= 2 && <p className="small center">{CHEF_NAME} keeps your amounts and moves the one with the most protein.</p>}
      </>
    );

  if (step === "recipe") {
    const o = options[pick % Math.max(options.length, 1)];
    if (!o) return (<><Head title={`${CHEF_NAME} found no mix`} sub="Change what is locked, or the amounts, and ask again." /><Back to="in" /></>);
    const ot = aggregate(o.items); const opd = density(ot.protein, ot.calories);
    return (
      <>
        <Head title={`${CHEF_NAME}'s recipe`} sub={o.explanation || `${o.food.name} moved to ${fmt(o.grams, 0)} g. Everything you locked stayed.`} />
        <section className="readout">
          <div className="readout-top"><span>This dessert</span><span>PD</span></div>
          <div className="readout-mid">
            <b>{fixed(opd)}</b>
            <div><span>{opd !== null && pdRef !== null && opd >= pdRef - 0.05 ? `on plan, target ${fixed(pdRef)}` : `target ${fixed(pdRef)}`}</span><small>{fmt(ot.calories, 0)} kcal · {fmt(ot.protein)} g protein · {fmt(ot.weight, 0)} g</small></div>
          </div>
        </section>
        <div className="rows">
          {o.items.map((i) => (
            <div className="row" key={i.id}>
              <span className={`dot ${i.locked ? "dot-locked" : "dot-free"}`} />
              <div className="row-text"><b>{i.food.name}</b><small>{i.locked ? "as you wanted it" : `what ${CHEF_NAME} changed`}</small></div>
              <b className="row-num">{fmt(i.grams, 0)} g</b>
            </div>
          ))}
        </div>
        <details className="more">
          <summary>Change what {CHEF_NAME} may touch</summary>
          {items.map((i) => (
            <label className="check" key={i.id}>
              <input type="checkbox" checked={!!i.keep} onChange={(e) => setState((s) => ({ ...s, items: s.items.map((x) => x.id === i.id ? { ...x, keep: e.target.checked } : x) }))} />
              keep {i.food.name} at {fmt(i.grams, 0)} g
            </label>
          ))}
          <button className="pill pill-wide" onClick={askMealan}>Ask again</button>
        </details>
        <button className="pill pill-primary pill-wide" onClick={() => {
          log("mix_applied", { grams: Math.round(o.grams) });
          setState((s) => ({ ...s, items: o.items, portion: null, title: s.title || "DaaM" }));
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
