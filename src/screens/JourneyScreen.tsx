import { useState } from "react";
import { Camera, ScanBarcode, Plus, Trash2, ArrowLeft, ChefHat, ThumbsUp, ThumbsDown } from "lucide-react";
import { aggregate, density, uid } from "../pilot";
import { fmt, fixed } from "../ui";
import { CHEF_NAME, COACH_NAME } from "../components/Mark";
import { log } from "../log";
import type { AppApi } from "./api";

const STEPS = ["in", "lock", "recipe", "after"] as const;
const band = (pd: number | null) => (pd === null || pd < 3 ? "low" : pd < 5 ? "mid" : "high");

export function JourneyScreen(p: AppApi) {
  const { state, setState, setTab, step, setStep, setCamera, setMode, blank, updateItem,
    setAdjustId, mix, options, pdRef, saveMeal, notify, setError, setFeedback } = p;
  const [pick, setPick] = useState(0);
  const [note, setNote] = useState("");
  const [good, setGood] = useState<boolean | null>(null);
  const items = state.items;
  const t = aggregate(items);
  const pd = density(t.protein, t.calories);
  const n = STEPS.indexOf(step) + 1;

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
        <Head title="What are you craving?" sub="Get the products in. A photo of all of them, a barcode, a label, or type it." />
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
        <button className="pill pill-primary pill-wide" disabled={items.length < 2} onClick={() => setStep("lock")}>
          That's all, next
        </button>
        {items.length < 2 && <p className="small center">Two products at least, so {CHEF_NAME} has something to move.</p>}
      </>
    );

  if (step === "lock") {
    const free = items.filter((i) => !i.locked);
    return (
      <>
        <Head title="Lock what you want to keep" sub={`Tap the dot on what the craving is. ${CHEF_NAME} moves the rest.`} />
        <section className="readout">
          <div className="readout-top"><span>As it stands</span><span>PD</span></div>
          <div className="readout-mid">
            <b>{fixed(pd)}</b>
            <div><span>{pd !== null && pdRef !== null ? (pd >= pdRef ? "on plan" : `${fixed(pdRef - pd)} under your ${fixed(pdRef)}`) : "no target set"}</span><small>{fmt(t.calories, 0)} kcal · {fmt(t.protein)} g protein</small></div>
          </div>
        </section>
        <div className="rows">
          {items.map((i) => (
            <div className="row" key={i.id}>
              <button className={`dot ${i.locked ? "dot-locked" : "dot-free"}`} aria-label={`${i.locked ? "Unlock" : "Lock"} ${i.food.name}`}
                onClick={() => { log("lock", { locked: !i.locked }); updateItem(i.id, { locked: !i.locked }); }} />
              <div className="row-text">
                <b>{i.food.name}</b>
                <small>{i.locked ? "kept as you set it" : `${CHEF_NAME} may change this`}</small>
                {!i.food.readyToEat && (
                  <label className="check tiny"><input type="checkbox" checked={false} onChange={() => setState((s) => ({ ...s, items: s.items.map((x) => x.id === i.id ? { ...x, food: { ...x.food, readyToEat: true } } : x), foods: s.foods.map((f) => f.id === i.food.id ? { ...f, readyToEat: true } : f) }))} /> ready to eat as it is</label>
                )}
              </div>
              <label className="grams">
                <input aria-label={`Grams of ${i.food.name}`} type="number" min="0" inputMode="decimal" value={i.grams}
                  onChange={(e) => updateItem(i.id, { grams: Math.max(0, Number(e.target.value) || 0) })} />
                <span>g</span>
              </label>
            </div>
          ))}
        </div>
        <button className="link" onClick={() => setStep("in")}>+ Add another product</button>
        <button className="pill pill-primary pill-wide" onClick={() => {
          if (free.length !== 1) { setError(free.length === 0 ? "Unlock the one food Mealan may change." : "Leave only one food unlocked. That is the one Mealan moves."); return; }
          setAdjustId(free[0].id); setPick(0);
          if (mix(free[0].id)) setStep("recipe");
        }}>
          <ChefHat size={18} /> Ask {CHEF_NAME}
        </button>
        <p className="small center">One food stays unlocked. {CHEF_NAME} moves that one until the whole thing lands at PD {fixed(pdRef)}.</p>
      </>
    );
  }

  if (step === "recipe") {
    const o = options[pick % Math.max(options.length, 1)];
    if (!o) return (<><Head title={`${CHEF_NAME} found no mix`} sub="Change what is locked, or the amounts, and ask again." /><Back to="lock" /></>);
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
              <div className="row-text"><b>{i.food.name}</b><small>{i.locked ? "as you wanted it" : "what Mealan changed"}</small></div>
              <b className="row-num">{fmt(i.grams, 0)} g</b>
            </div>
          ))}
        </div>
        <button className="pill pill-primary pill-wide" onClick={() => {
          log("mix_applied", { grams: Math.round(o.grams) });
          setState((s) => ({ ...s, items: o.items, portion: null, title: s.title || "DaaM" }));
          setTimeout(() => saveMeal(), 0);
          setStep("after");
        }}>Make it</button>
        {options.length > 1 && <button className="pill pill-wide" onClick={() => setPick((x) => x + 1)}>Try another mix ({(pick % options.length) + 1} of {options.length})</button>}
        <Back to="lock" />
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
