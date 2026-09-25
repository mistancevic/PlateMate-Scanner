import { useState, useEffect } from "react";
import { Camera, ScanBarcode, Plus, ArrowLeft, ChefHat, ThumbsUp, ThumbsDown } from "lucide-react";
import { aggregate, density, uid } from "../pilot";
import { fmt, fixed } from "../ui";
import { CHEF_NAME, COACH_NAME } from "../components/Mark";
import { log } from "../log";
import { iconFor } from "../icons";
import { SwipeRow } from "../components/SwipeRow";
import { FoodCard } from "../components/FoodCard";
import { thumbnailBase64 } from "../utils/image";
import type { AppApi } from "./api";

const STEPS = ["in", "recipe", "after"] as const;
const band = (pd: number | null) => (pd === null || pd < 3 ? "low" : pd < 5 ? "mid" : "high");

export function JourneyScreen(p: AppApi) {
  const { state, setState, setTab, step, setStep, setCamera, setMode, blank, updateItem,
    setAdjustId, mixWith, options, pdRef, saveMeal, notify, setError, setFeedback, add } = p;
  const [q, setQ] = useState("");
  // When Mealan produces options, the first one becomes the recipe on screen.
  useEffect(() => {
    if (options.length && (step === "recipe" || step === "in")) {
      const o = options[0]; setPick(0);
      setState((s) => ({ ...s, items: o.items, portion: null }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);
  const [cap, setCap] = useState<number | null>(300);
  const [pick, setPick] = useState(0);
  const [note, setNote] = useState("");
  const [good, setGood] = useState<"daam" | "good" | "no" | null>(null);
  const [plate, setPlate] = useState<string>("");
  const [swapId, setSwapId] = useState<string | null>(null);
  const [cardId, setCardId] = useState<string | null>(null);
  const TASTE = { daam: "DaaM good", good: "Good", no: "Not really" } as const;
  const items = state.items;
  const t = aggregate(items);
  const pd = density(t.protein, t.calories);
  const n = STEPS.indexOf(step) + 1;
  const cardItem = items.find((i) => i.id === cardId);
  const foodCard = cardItem && <FoodCard food={cardItem.food} target={pdRef} fit={p.fitPd(density(cardItem.food.protein, cardItem.food.calories))} close={() => setCardId(null)} />;
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
  // Tapping a dot: kept becomes free to move and Mealan recalculates; free becomes kept at its current amount.
  function toggle(id: string) {
    const me = items.find((i) => i.id === id); if (!me) return;
    let mover: typeof items[number] | undefined;
    if (me.locked) mover = me; // you freed it: this is the one Mealan moves
    else {
      const others = items.filter((i) => i.id !== id);
      mover = [...others].sort((a, b) => (density(b.food.protein, b.food.calories) ?? -1) - (density(a.food.protein, a.food.calories) ?? -1))[0];
      if (!mover) { setState((s) => ({ ...s, items: s.items.map((i) => ({ ...i, locked: true })), portion: null })); setError(`Everything is kept. Tap a dot to let ${CHEF_NAME} move one food.`); return; }
    }
    const kept = items.map((i) => ({ ...i, locked: i.id !== mover!.id }));
    setState((s) => ({ ...s, items: kept, portion: null }));
    setAdjustId(mover.id);
    setTimeout(() => { mixWith(kept, mover!.id); }, 0);
  }
  function remove(id: string) {
    const rest = items.filter((i) => i.id !== id);
    setState((s) => ({ ...s, items: rest, portion: null }));
    if (step === "recipe") {
      const mover = rest.find((i) => !i.locked) ?? [...rest].sort((a, b) => (density(b.food.protein, b.food.calories) ?? -1) - (density(a.food.protein, a.food.calories) ?? -1))[0];
      if (mover && rest.length >= 2) { const kept = rest.map((i) => ({ ...i, locked: i.id !== mover.id })); setState((s) => ({ ...s, items: kept })); setAdjustId(mover.id); setTimeout(() => { mixWith(kept, mover.id); }, 0); }
      else setStep("in");
    }
  }
  function swap(id: string, food: typeof state.foods[number]) {
    const next = items.map((i) => (i.id === id ? { ...i, food: { ...food, readyToEat: true } } : i));
    setState((s) => ({ ...s, items: next, portion: null }));
    setSwapId(null);
    if (step === "recipe") { const mover = next.find((i) => !i.locked); if (mover) { setAdjustId(mover.id); setTimeout(() => { mixWith(next, mover.id); }, 0); } }
  }
  // Editing an amount on the recipe: that amount becomes yours, Mealan moves the highest-PD food you didn't touch.
  function edit(id: string, grams: number) {
    const base = items.map((i) => (i.id === id ? { ...i, grams, locked: true } : i));
    const pool = base.filter((i) => !i.locked && i.id !== id);
    const mover = [...pool].sort((a, b) => (density(b.food.protein, b.food.calories) ?? -1) - (density(a.food.protein, a.food.calories) ?? -1))[0];
    if (!mover) { setState((s) => ({ ...s, items: base, portion: null })); return; }
    const withMover = base.map((i) => (i.id === mover.id ? { ...i, locked: false } : i));
    setState((s) => ({ ...s, items: withMover, portion: null }));
    setAdjustId(mover.id);
    setTimeout(() => { mixWith(withMover, mover.id); }, 0);
  }

  const swapPanel = swapId && (
    <div className="sheet-backdrop" onClick={() => setSwapId(null)}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="card-top"><span>Swap {items.find((i) => i.id === swapId)?.food.name} for</span><button className="link" onClick={() => setSwapId(null)}>Cancel</button></div>
        <div className="rows">
          {state.foods.filter((f) => !items.some((i) => i.food.id === f.id)).map((f) => (
            <button className="row row-food row-button" key={f.id} onClick={() => swap(swapId, f)}>
              <span className="thumb thumb-sm">{f.photo ? <img src={f.photo} alt="" /> : (f.icon || iconFor(f.name))}</span>
              <div className="row-text"><b>{f.name}</b><small>{f.brand ? `${f.brand} · ` : ""}PD {fixed(density(f.protein, f.calories))}</small></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
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
              <SwipeRow key={i.id} onRemove={() => remove(i.id)} onSwap={() => setSwapId(i.id)}>
              <div className="row">
                <button className={`dot ${i.locked ? "dot-locked" : "dot-free"}`} aria-label={`${i.locked ? "Unlock" : "Lock"} ${i.food.name}`}
                  onClick={() => { log("lock", { locked: !i.locked }); updateItem(i.id, { locked: !i.locked }); }} />
                <span className="thumb">{i.food.photo ? <img src={i.food.photo} alt="" /> : (i.food.icon || iconFor(i.food.name))}</span>
                <div className="row-text">
                  <button className="name-link" onClick={() => setCardId(i.id)}>{i.food.name}</button>
                  <small>PD {fixed(density(i.food.protein, i.food.calories))} · {i.locked ? "keep this amount" : `${CHEF_NAME} may move it`}</small>
                </div>
                <label className="grams">
                  <input aria-label={`Grams of ${i.food.name}`} type="number" min="0" inputMode="decimal" value={i.grams}
                    onChange={(e) => updateItem(i.id, { grams: Math.max(0, Number(e.target.value) || 0), locked: true })} />
                  <span>g</span>
                </label>
              </div>
              </SwipeRow>
            ))}
          </div>
        )}
        <button className="pill pill-primary pill-wide" disabled={items.length < 2} onClick={askMealan}>
          <ChefHat size={18} /> Ask {CHEF_NAME}
        </button>
        {items.length < 2 && <p className="small center">Two products at least, so {CHEF_NAME} has something to move.</p>}
        {items.length >= 2 && <p className="small center">Coral dot keeps the amount. {CHEF_NAME} moves the unlocked one with the most protein. Swipe a food right to remove it, left to swap it. Tap a name for its card.</p>}
        {swapPanel}
        {foodCard}
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
                  <span className="thumb thumb-sm">{f.photo ? <img src={f.photo} alt="" /> : (f.icon || iconFor(f.name))}</span>
                  <div className="row-text"><b>{f.name}</b><small>{f.brand ? `${f.brand} · ` : ""}PD {fixed(density(f.protein, f.calories))}</small></div>
                  <button className={`pill pill-small ${inList ? "" : "pill-primary"}`} disabled={inList} onClick={() => add(f)}>{inList ? "In" : <><Plus size={14} /> Add</>}</button>
                </div>
              );
            })}
          {state.foods.length === 0 && <small>No saved foods yet. Scan or type one above.</small>}
        </div>

      </>
    );

  if (step === "recipe") {
    // The recipe is the current items: Mealan's result, editable. Typing an amount makes it yours; Mealan redoes the rest.
    const mover = items.find((i) => !i.locked);
    const over = cap !== null && !!mover && mover.grams > cap;
    const shown = over ? items.map((i) => (i.id === mover!.id ? { ...i, grams: cap! } : i)) : items;
    const ot = aggregate(shown); const opd = density(ot.protein, ot.calories);
    const onPlan = opd !== null && pdRef !== null && opd >= pdRef - 0.05;
    return (
      <>
        <Head title={`${CHEF_NAME}'s recipe`} sub={over ? `${mover!.food.name} would need ${fmt(mover!.grams, 0)} g to reach ${fixed(pdRef)}. At ${cap} g this is as close as it gets.` : mover ? `${mover.food.name} is the one ${CHEF_NAME} moves. Change any amount and ${CHEF_NAME} redoes the rest.` : `Everything is set by you. Change one amount and ${CHEF_NAME} moves the rest.`} />
        <section className="readout">
          <div className="readout-top"><span>This dessert</span><span>PD</span></div>
          <div className="readout-mid">
            <b>{fixed(opd)}</b>
            <div><span>{onPlan ? `on plan, target ${fixed(pdRef)}` : `target ${fixed(pdRef)}`}</span><small>{fmt(ot.calories, 0)} kcal · {fmt(ot.protein)} g protein · {fmt(ot.weight, 0)} g</small></div>
          </div>
        </section>
        <div className="rows">
          {shown.map((i) => (
            <SwipeRow key={i.id} onRemove={() => remove(i.id)} onSwap={() => setSwapId(i.id)}>
            <div className="row">
              <button className={`dot ${i.locked ? "dot-locked" : "dot-free"}`} aria-label={`${i.locked ? "Let Mealan move" : "Keep"} ${i.food.name}`} onClick={() => toggle(i.id)} />
              <div className="row-text"><button className="name-link" onClick={() => setCardId(i.id)}>{i.food.name}</button><small>{i.locked ? "as you set it" : `what ${CHEF_NAME} moves`}</small></div>
              <label className="grams">
                <input aria-label={`Grams of ${i.food.name}`} type="number" min="0" inputMode="decimal" value={i.grams}
                  onChange={(e) => edit(i.id, Math.max(0, Number(e.target.value) || 0))} />
                <span>g</span>
              </label>
            </div>
            </SwipeRow>
          ))}
        </div>
        {over && <button className="pill pill-wide" onClick={() => setCap(null)}>Allow more than {cap} g</button>}
        <button className="pill pill-primary pill-wide" onClick={() => {
          log("mix_applied", { grams: mover ? Math.round(over ? cap! : mover.grams) : 0 });
          setState((s) => ({ ...s, items: shown, portion: null, title: s.title || "DaaM" }));
          setTimeout(() => saveMeal(), 0);
          setStep("after");
        }}>Make it</button>
        {options.length > 1 && <button className="pill pill-wide" onClick={() => {
          const next = (pick + 1) % options.length; setPick(next);
          setState((s) => ({ ...s, items: options[next].items, portion: null }));
        }}>Try another mix ({(pick % options.length) + 1} of {options.length})</button>}
        <Back to="in" />
        {swapPanel}
        {foodCard}
      </>
    );
  }

  // after
  return (
    <>
      <Head title="How was it?" sub={`One tap. ${COACH_NAME} sees it.`} />
      <div className="choices three">
        <button className={`choice ${good === "daam" ? "on" : ""}`} onClick={() => setGood("daam")}><ThumbsUp size={24} /><span>DaaM good</span></button>
        <button className={`choice ${good === "good" ? "on" : ""}`} onClick={() => setGood("good")}><ThumbsUp size={22} /><span>Good</span></button>
        <button className={`choice ${good === "no" ? "on" : ""}`} onClick={() => setGood("no")}><ThumbsDown size={24} /><span>Not really</span></button>
      </div>
      <label className="plate-photo">
        {plate ? <img src={plate} alt="your plate" /> : <span>Add a photo of the plate</span>}
        <input type="file" accept="image/*" capture="environment" onChange={(e) => {
          const file = e.target.files?.[0]; if (!file) return;
          const r = new FileReader(); r.onload = () => thumbnailBase64(String(r.result), 480).then(setPlate).catch(() => {}); r.readAsDataURL(file);
        }} />
      </label>
      <textarea placeholder="A line for your coach, if you like" value={note} onChange={(e) => setNote(e.target.value)} />
      <button className="pill pill-primary pill-wide" disabled={good === null} onClick={() => {
        const meal = state.meals[0] ?? { id: uid(), title: state.title || "DaaM", items: structuredClone(items), portion: t.weight, savedAt: new Date().toISOString() };
        const status = good === "no" ? "not-used" : "eaten";
        const taste = TASTE[good!];
        log("feedback", { status, taste });
        setFeedback({ status, taste, notes: note });
        setState((s) => ({ ...s, feedback: [{ id: uid(), meal: structuredClone(meal), status, taste, notes: note, photo: plate || undefined, createdAt: new Date().toISOString() }, ...s.feedback], items: [], portion: null }));
        setGood(null); setNote(""); setPlate(""); setStep("in");
        notify(`Thanks. ${COACH_NAME} will see it.`);
        setTab("home");
      }}>Send to {COACH_NAME}</button>
      <Back to="recipe" />
    </>
  );
}
