import { useState, useEffect } from "react";
import { Camera, Plus, Trash2, ArrowLeft, ChefHat, ThumbsUp, ThumbsDown } from "lucide-react";
import { ConfirmButton } from "../components/Confirm";
import type { Mix } from "../mixtip";
import { aggregate, density, uid, solveIngredient, servingLabel } from "../pilot";
import { fmt, fixed, pdText, pdVal, pdTag, pdRange } from "../ui";
import { CHEF_NAME, COACH_NAME } from "../components/Mark";
import { log } from "../log";
import { iconFor } from "../icons";
import { quickPicks } from "../quick";
import { lineTotal } from "../labeltable";
import { SwipeRow } from "../components/SwipeRow";
import { methodsFor } from "../methods";
import { rankSwaps } from "../swaps";
import { PlateHelper } from "../components/PlateHelper";
import { momentOf, orderMoments, REGIONS } from "../moments";
import { FoodCard } from "../components/FoodCard";
import { thumbnailBase64 } from "../utils/image";
import type { AppApi } from "./api";

const STEPS = ["in", "recipe", "make", "after"] as const;
const band = (pd: number | null) => (pd === null || pd < 3 ? "low" : pd < 5 ? "mid" : "high");

// sugars, saturates and salt on the plate, from the foods whose tables have them; for information only
function extras(items: { food: any; grams: number }[]) {
  const parts = ([["sugars", "sugars"], ["saturates", "saturates"], ["salt", "salt"]] as const)
    .map(([key, word]) => { const v = lineTotal(items, key); return v === null ? null : `${fmt(v)} g ${word}`; }).filter(Boolean);
  return parts.length ? <small className="readout-extra">{parts.join(" · ")}{items.some((i) => !i.food.table?.length) ? " · from foods with a full table" : ""}</small> : null;
}
export function JourneyScreen(p: AppApi) {
  const { state, setState, setTab, step, setStep, setCamera, setMode, blank, updateItem,
    setAdjustId, mixWith, options, pdRef, saveMeal, notify, setError, setFeedback, add } = p;
  const [q, setQ] = useState("");
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
        setState((s) => ({ ...s, items: o.items.map((oi) => { const cur = s.items.find((x) => x.id === oi.id); return cur ? { ...oi, locked: cur.locked } : oi; }), portion: null }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);
  const [cap, setCap] = useState<number | null>(300);
  const [pick, setPick] = useState(0);
  const [note, setNote] = useState("");
  const [good, setGood] = useState<"daam" | "good" | "no" | null>(null);
  const [plate, setPlate] = useState<string>("");
  const [method, setMethod] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const autoTitle = (its: typeof items) => { const n = its.map((i) => i.food.name.split(",")[0].trim()); return n.length <= 1 ? n[0] ?? "Meal" : `${n.slice(0, -1).join(", ")} & ${n[n.length - 1]}`; };
  const [shareWhy, setShareWhy] = useState<"look" | "ok" | "help" | null>(null);
  const [helper, setHelper] = useState<{ missing: string | null; prefill?: string } | null>(null);
  useEffect(() => { if (p.mealanAsk && items.length > 0) { setHelper({ missing: null }); p.mealanAsked(); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [p.mealanAsk]);
  // a "Not quite? Tell Mealan" from a mix tip opens the helper with the tip as the question's start
  useEffect(() => { if (p.mixQuestion) { setHelper({ missing: null, prefill: p.mixQuestion }); setCardId(null); p.mixQuestionTaken(); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [p.mixQuestion]);
  // the mix tip for a food on this plate; the card logs what it showed
  const mixProps = (food: typeof state.foods[number]) => {
    const tip = p.mixFor(food);
    return { tip, momentName: momentOf(p.moment).name, take: (m: Mix) => { setCardId(null); p.takeMix(food, m); }, ask: () => p.askAboutMix(food, tip) };
  };
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
  const foodCard = cardItem && <FoodCard food={state.foods.find((x) => x.id === cardItem.food.id) ?? cardItem.food} addPhoto={(d) => p.addFoodPhoto(cardItem.food.id, d)} toggleFavorite={() => p.toggleFavorite(cardItem.food.id)} insight={{ dayKcal: p.todayKcal, eaten: p.eatenTodayKcal, dayName: p.dayName, goalKey: p.tipGoalKey, requestTip: () => p.requestTip(cardItem.food.id), setJob: (j) => p.setFoodJob(cardItem.food.id, j) }} removePhoto={(i) => p.removeFoodPhoto(cardItem.food.id, i)} target={pdRef} fit={p.fitPd(density(cardItem.food.protein, cardItem.food.calories))} close={() => setCardId(null)} dontHave={() => { setHelper({ missing: cardItem.id }); setCardId(null); }} mix={mixProps(state.foods.find((x) => x.id === cardItem.food.id) ?? cardItem.food)} />;
  const helperSheet = helper && (
    <PlateHelper items={items} library={state.foods} pdRef={pdRef} cap={cap ?? null} missing={helper.missing ? items.find((i) => i.id === helper.missing) ?? null : null} prefill={helper.prefill}
      setError={setError} close={() => setHelper(null)} openTalk={() => { setHelper(null); p.openOut(); }} record={p.recordTalk}
      apply={(next, note) => { setState((s) => ({ ...s, items: next, portion: null })); p.notify(note); if (step === "recipe") recalc(next); }} />
  );
  const adjustFor = (o: { items: typeof items }) => o.items.find((i) => !i.locked)?.id;
  // Mealan moves the food with the highest protein density; everything else keeps the amount you set.
  function askMealan() {
    let ready = items.map((i) => ({ ...i, food: { ...i.food, readyToEat: true } }));
    if (ready.length === 1) {
      const partner = [...state.foods].filter((f) => f.id !== ready[0].food.id).sort((a, b) => (density(b.protein, b.calories) ?? -1) - (density(a.protein, a.calories) ?? -1))[0];
      if (!partner) { setError("Add a food to your library first, so Mealan has partners to choose from."); return; }
      ready = [{ ...ready[0], locked: true }, { id: uid(), food: { ...partner, readyToEat: true }, grams: 100, locked: false }];
    }
    const mover = moverOf(ready);
    if (!mover) { setState((s) => ({ ...s, items: ready, portion: null })); setStep("recipe"); return; } // everything fixed: show where it lands
    setState((s) => ({ ...s, items: ready, foods: s.foods.map((f) => ready.some((x) => x.food.id === f.id) ? { ...f, readyToEat: true } : f) }));
    setAdjustId(mover.id); setPick(0);
    const forSolver = ready.map((i) => (i.id === mover.id ? i : { ...i, locked: true }));
    setTimeout(() => { if (mixWith(forSolver, mover.id)) setStep("recipe"); }, 0);
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
    setState((s) => ({ ...s, items: [], portion: null }));
    setStep("in");
  }
  function remove(id: string) {
    const rest = items.filter((i) => i.id !== id);
    setState((s) => ({ ...s, items: rest, portion: null }));
    if (step === "recipe") {
      if (rest.length >= 2 && moverOf(rest)) recalc(rest); else setStep("in");
    }
  }
  function swap(id: string, food: typeof state.foods[number], grams?: number | null, keep = false) {
    // a food that works arrives kept at the grams the list promised; one that doesn't arrives at the cap, grey, and the plate says how far that gets you
    const next = items.map((i) => (i.id === id ? { ...i, food: { ...food, readyToEat: true }, grams: grams ?? i.grams, locked: keep } : i));
    setState((s) => ({ ...s, items: next, portion: null }));
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
  const quick = quickPicks(state.foods, state.feedback);
  const swapCandidates = !swapId || pdRef === null ? [] : rankSwaps(items, swapId, state.foods, pdRef, cap ?? null);
  const swapPanel = swapId && (
    <div className="sheet-backdrop" onClick={() => setSwapId(null)}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="card-top"><span>Swap {items.find((i) => i.id === swapId)?.food.name} for</span><button className="link" onClick={() => setSwapId(null)}>Cancel</button></div>
        <p className="small">Sorted by how well each one brings the plate to your {pdVal(pdRef)}, with the rest kept as it is.</p>
        <div className="rows">
          {swapCandidates.map(({ f, grams, fits }) => (
            <button className="row row-food row-button" key={f.id} onClick={() => swap(swapId, f, fits ? grams : grams !== null ? Math.min(grams, cap ?? 300) : null, fits)}>
              <span className="thumb thumb-sm">{f.photo ? <img src={f.photo} alt="" /> : (f.icon || iconFor(f.name))}</span>
              <div className="row-text"><b>{f.name}</b><small>{f.brand ? `${f.brand} · ` : ""}{pdText(density(f.protein, f.calories))}</small></div>
              <span className={`pdpill pdpill-${fits ? "high" : grams !== null ? "mid" : "low"}`}>{grams !== null ? `${grams} g` : "no"}</span>
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
        <Head title="What are you craving?" sub={`Products in, ${CHEF_NAME} does the amounts.`} />
        <p className="label">When is this for?</p>
        <div className="moments">
          {orderMoments(p.usual).map((m) => (
            <button key={m.id} className={`pill pill-small ${p.moment === m.id ? "pill-primary" : ""} ${m.planned ? "" : "pill-unplanned"}`} onClick={() => p.setMoment(m.id)}>{m.name}</button>
          ))}
        </div>
        <p className="small moment-hint">{momentOf(p.moment).hint}{p.moment !== "regular" && pdRef !== null ? ` Target for this plate: ${pdText(pdRef)}.` : ""}</p>
        {p.moment === "travel" && (
          <>
            <p className="label">Where to?</p>
            <div className="moments">
              {REGIONS.filter((r) => r.id !== p.region).map((r) => (
                <button key={r.id} className={`pill pill-small ${p.travelTo === r.id ? "pill-primary" : ""}`} onClick={() => p.setTravelTo(p.travelTo === r.id ? null : r.id)}>{r.name}</button>
              ))}
            </div>
            <p className="small moment-hint">{p.travelTo ? `${CHEF_NAME} plans with what's sold in ${REGIONS.find((r) => r.id === p.travelTo)?.name}. Use the chat to shop and cook there.` : "Pick the place and Mealan plans with its shelves."}</p>
          </>
        )}
        {items.length > 0 && (
          <section className={`readout readout-fit-${p.fitPd(pd)}`}>
            <div className="readout-top"><span>As it stands</span><span>{pdTag()}</span></div>
            <div className="readout-mid">
              <b>{pdVal(pd)}</b>
              <div><span>{pd !== null && pdRef !== null ? (pd >= pdRef ? "fits your plan" : `${fixed(pdRef - pd)} under your ${fixed(pdRef)}`) : "no target set"}</span><small>{fmt(t.calories, 0)} kcal · {fmt(t.protein)} g protein · {fmt(t.weight, 0)} g</small></div>
            </div>
            {extras(items)}
          </section>
        )}
        <div className="ways">
          <button className="pill pill-small" onClick={() => { setMode("label"); setCamera(true); }}><Camera size={15} /> Scan</button>
          <button className="pill pill-small" onClick={() => blank()}><Plus size={15} /> Type it</button>
          {items.length > 0 && <ConfirmButton className="pill pill-small ways-empty" label={<><Trash2 size={15} /> Empty plate</>} confirmLabel="Tap again to empty" onConfirm={emptyPlate} />}
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
                  <small>{pdText(density(i.food.protein, i.food.calories))} · {i.locked ? "keep this amount" : `${CHEF_NAME} may move it`}</small>
                </div>
                {i.locked ? <b className="row-num">{fmt(i.grams, 0)} g{servingLabel(i.food, i.grams) ? <small> = {servingLabel(i.food, i.grams)}</small> : null}</b> : (
                  <label className="grams">
                    <input aria-label={`Grams of ${i.food.name}`} type="number" min="0" inputMode="decimal" value={i.grams === 0 ? "" : i.grams}
                      onChange={(e) => { setTouched((t) => new Set(t).add(i.id)); updateItem(i.id, { grams: Math.max(0, Number(e.target.value) || 0) }); }}
                      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} enterKeyHint="done"
                      onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ block: "center", behavior: "smooth" }), 250)} />
                    <span>g{servingLabel(i.food, i.grams) ? ` = ${servingLabel(i.food, i.grams)}` : ""}</span>
                  </label>
                )}
              </div>
              </SwipeRow>
            ))}
          </div>
        )}
        <button className="pill pill-primary pill-wide" disabled={items.length < 1} onClick={askMealan}>
          <ChefHat size={18} /> Fit to my target
        </button>
        {items.length === 1 && <p className="small center">One product: {CHEF_NAME} looks through your foods for a partner that brings it to your plan.</p>}
        {items.length >= 2 && <p className="small center">Code, not a conversation: the amounts, at once. Questions go to {CHEF_NAME}, the button bottom right.</p>}
        {items.length >= 2 && <p className="small center">Grey is yours to type and {CHEF_NAME}'s to move. Coral is fixed. Swipe right to remove, left to swap. Tap a name for its card.</p>}
        {swapPanel}
        {foodCard}
        {helperSheet}
        <p className="label">{q.trim() ? "From all your foods" : "Quick picks"}</p>
        <input className="search" aria-label="Search all my foods" placeholder="Search all my foods" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="rows">
          {(q.trim()
            ? state.foods.filter((f) => (f.name + " " + f.brand).toLowerCase().includes(q.toLowerCase())).slice(0, 60)
            : quick.picks
          ).map((f) => {
              const inList = items.some((i) => i.food.id === f.id);
              const why = q.trim() ? null : quick.why.get(f.id);
              return (
                <div className="row row-food" key={f.id}>
                  <span className="thumb thumb-sm">{f.photo ? <img src={f.photo} alt="" /> : (f.icon || iconFor(f.name))}</span>
                  <div className="row-text"><b>{f.favorite && <span className="fav-mark" aria-label="Favourite">★ </span>}{f.name}</b><small>{f.brand ? `${f.brand} · ` : ""}{pdText(density(f.protein, f.calories))}{why === "often" ? " · often" : ""}</small></div>
                  <button className={`pill pill-small ${inList ? "" : "pill-primary"}`} disabled={inList} onClick={() => add(f)}>{inList ? "In" : <><Plus size={14} /> Add</>}</button>
                </div>
              );
            })}
          {state.foods.length === 0 && <small>No saved foods yet. Scan or type one above.</small>}
        </div>
        {!q.trim() && state.foods.length > quick.picks.length && (
          <button className="link all-foods" onClick={() => setTab("foods")}>All {state.foods.length} foods →</button>
        )}

      </>
    );

  if (step === "recipe") {
    // The recipe is the current items: Mealan's result, editable. Typing an amount makes it yours; Mealan redoes the rest.
    const mover = moverOf(items);
    const over = cap !== null && !!mover && mover.grams > cap;
    const shown = over ? items.map((i) => (i.id === mover!.id ? { ...i, grams: cap! } : i)) : items;
    const ot = aggregate(shown); const opd = density(ot.protein, ot.calories);
    const dayKcal = p.todayKcal ?? state.goals.calories ?? null;
    const share = dayKcal ? Math.round(((ot.calories ?? 0) / dayKcal) * 100) : null;
    const tooBig = shown.filter((i) => i.grams > (cap ?? 300));
    const meetingBig = p.moment === "meeting" && share !== null && share > 30;
    const unplanned = !momentOf(p.moment).planned;
    const unreal = !unplanned && (tooBig.length > 0 || (share !== null && share > 50) || meetingBig);
    const onPlan = !unreal && opd !== null && pdRef !== null && opd >= pdRef - 0.05;
    const unrealText = tooBig.length
      ? `${fmt(tooBig[0].grams, 0)} g of ${tooBig[0].food.name} is not a portion. This food can't get you there at a normal amount; swap it or lower the others.`
      : meetingBig
        ? `This plate is ${share} % of your day. On a meeting day keep it under a third, so the afternoon stays sharp.`
        : `This plate is ${share} % of your day. Fit for a meal, not a dessert.`;
    return (
      <>
        <Head title={mover ? `${CHEF_NAME}'s recipe` : "As you set it"} sub={unplanned ? `${momentOf(p.moment).name}. Enjoy it, keep it small. Your next meal leans protein and you're back.` : over ? `${mover!.food.name} would need ${fmt(mover!.grams, 0)} g to reach ${fixed(pdRef)}. At ${cap} g this is as close as it gets.` : mover ? `${CHEF_NAME} moves the ${mover.food.name}. Change any other amount and it refits.` : `Nothing moved. This is where your amounts land. Tap a grey dot if you want ${CHEF_NAME} to fit one food.`} />
        <section className={`readout ${unreal ? "readout-fit-mid" : ""}`}>
          <div className="readout-top"><span>This plate</span><span>{pdTag()}</span></div>
          <div className="readout-mid">
            <b>{pdVal(opd)}</b>
            <div><span>{unreal ? "not realistic" : onPlan ? `on plan, target ${pdVal(pdRef)}` : `target ${fixed(pdRef)}`}</span><small>{fmt(ot.calories, 0)} kcal{share !== null ? `, ${share} % of your day` : ""} · {fmt(ot.protein)} g protein · {fmt(ot.weight, 0)} g</small></div>
          </div>
          {unreal && <p className="readout-note">{unrealText}</p>}
          {extras(shown.map((x) => ({ food: x.food, grams: x.grams })))}
        </section>
        <div className="rows">
          {shown.map((i) => (
            <SwipeRow key={i.id} onRemove={() => remove(i.id)} onSwap={() => setSwapId(i.id)}>
            <div className="row">
              <button className={`dot ${i.locked ? "dot-locked" : "dot-free"}`} aria-label={`${i.locked ? "Let Mealan move" : "Keep"} ${i.food.name}`} onClick={() => toggle(i.id)} />
              <div className="row-text"><button className="name-link" onClick={() => setCardId(i.id)}>{i.food.name}</button>
                <small>{i.locked ? "as you set it" : i.id === mover?.id ? `what ${CHEF_NAME} moves` : `${CHEF_NAME} may move it`}</small>
                {suggest?.id === i.id && suggest.grams !== i.grams && (
                  <button className="link suggest" onClick={applySuggestion}>
                    {CHEF_NAME} suggests {suggest.grams} g: that brings the plate from {pdText(opd)} to your {pdVal(pdRef)} · apply
                  </button>
                )}
              </div>
              {i.locked ? <b className="row-num">{fmt(i.grams, 0)} g</b> : (
                <label className="grams">
                  <input aria-label={`Grams of ${i.food.name}`} type="number" min="0" inputMode="decimal" value={i.grams === 0 ? "" : i.grams}
                    onChange={(e) => edit(i.id, Math.max(0, Number(e.target.value) || 0))}
                    onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} enterKeyHint="done"
                    onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ block: "center", behavior: "smooth" }), 250)} />
                  <span>g</span>
                </label>
              )}
            </div>
            </SwipeRow>
          ))}
        </div>
        {over && <button className="pill pill-wide" onClick={() => setCap(null)}>Allow more than {cap} g</button>}
        <button className="pill pill-primary pill-wide" onClick={() => {
          log("mix_applied", { grams: mover ? Math.round(over ? cap! : mover.grams) : 0 });
          setState((s) => ({ ...s, items: shown, portion: null, title: s.title || "DaaM" }));
          setMethod(null);
          setStep("make");
        }}>Make it</button>
        <button className="pill pill-wide" onClick={() => {
          p.keepForLater({ id: uid(), title: p.state.title || autoTitle(shown), items: structuredClone(shown), portion: shown.reduce((n, i) => n + i.grams, 0), savedAt: new Date().toISOString() });
          setStep("in");
        }}>Keep for later today</button>
        {options.length > 1 && <button className="pill pill-wide" onClick={() => {
          const next = (pick + 1) % options.length; setPick(next);
          setState((s) => ({ ...s, items: options[next].items, portion: null }));
        }}>Try another mix ({(pick % options.length) + 1} of {options.length})</button>}
        <Back to="in" />
        {swapPanel}
        {foodCard}
        {helperSheet}
      </>
    );
  }

  if (step === "make") {
    const ways = methodsFor(items);
    return (
      <>
        <Head title="How do you want to eat it?" sub={ways.length ? `Same amounts, ${ways.length === 1 ? "one way" : `${ways.length} ways`}. Pick the one you feel like.` : "One food, nothing to combine. Enjoy it as it is."} />
        <div className="how">
          {ways.map((w) => (
            <button key={w.id} className={`way ${method === w.id ? "on" : ""}`} onClick={() => setMethod(w.id)}>
              <b>{w.name}</b>
              <small>{w.why}</small>
              <ol>{w.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
            </button>
          ))}
        </div>
        <button className="pill pill-primary pill-wide" disabled={ways.length > 0 && !method} onClick={() => {
          const w = ways.find((x) => x.id === method);
          log("method_chosen", { method });
          setState((s) => ({ ...s, title: w ? w.name : s.title }));
          setStep("after");
        }}>{ways.length ? "I'm making it this way" : "Continue"}</button>
        <Back to="recipe" />
      </>
    );
  }

  // after
  return (
    <>
      <Head title="How was it?" sub="One tap. It stays yours unless you share it." />
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
      <label className="field"><span>Name it</span><input value={title} placeholder={autoTitle(items)} onChange={(e) => setTitle(e.target.value)} /></label>
      <textarea placeholder="A line for your coach, if you like" value={note} onChange={(e) => setNote(e.target.value)} />
      {sharing && p.profile.coachId && (
        <div className="reasons">
          {([["look", "Look at this"], ["ok", "Was this OK?"], ["help", "Help me next time"]] as const).map(([k, l]) => (
            <button key={k} className={`pill pill-small ${shareWhy === k ? "pill-primary" : ""}`} onClick={() => setShareWhy(k)}>{l}</button>
          ))}
        </div>
      )}
      <button className="pill pill-primary pill-wide" disabled={good === null || (sharing && !shareWhy)} onClick={() => {
        const name = title.trim() || autoTitle(items);
        const meal = { id: uid(), title: name, items: structuredClone(items), portion: t.weight, savedAt: new Date().toISOString() };
        const status = good === "no" ? "not-used" : "eaten";
        const taste = TASTE[good!];
        log("feedback", { status, taste, shared: sharing ? shareWhy : null });
        setFeedback({ status, taste, notes: note });
        const shared = sharing && shareWhy ? { reason: shareWhy, at: new Date().toISOString() } : undefined;
        setState((s) => ({ ...s, feedback: [{ id: uid(), meal: structuredClone(meal), status, taste, notes: note, photo: plate || undefined, shared, moment: p.moment, dayType: p.personal.dayMode === "follow" ? p.dayType : undefined, createdAt: new Date().toISOString() }, ...s.feedback], items: [], portion: null }));
        setGood(null); setNote(""); setTitle(""); setPlate(""); setTouched(new Set()); setSuggest(null); setSharing(false); setShareWhy(null); setStep("in");
      }}>{sharing ? `Save and share with ${p.profile.coachName || "your coach"}` : "Save"}</button>
      {p.profile.coachId && !sharing && <button className="pill pill-wide" onClick={() => setSharing(true)}>Share with {p.profile.coachName || "your coach"}</button>}
      {sharing && <button className="link" onClick={() => { setSharing(false); setShareWhy(null); }}>Keep it private</button>}
      <Back to="recipe" />
    </>
  );
}
