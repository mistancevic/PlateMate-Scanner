// R17 (0.2.45, Milan 23:04 to 23:34, board RS16): find what you crave. One box under What are you craving? on the Plate.
// Code looks first, at once and for free: your recipes, Coach's, the members' and Chef Mealan's starters, and your foods; PD 7+
// is a filter, shown as a chip. Chef Mealan is asked only on a tap; his idea is kept in My recipes as an idea, not made yet,
// and the app works out every number from the foods. Picking a dish puts it on the plate, as Make it does.
// DT305 (0.3.151, board Stories230; Coach Milan 16 November 09:43): Find ideas carries the chef's hat: he comes up with the ideas.
// DT301 (0.3.149, board Stories223; Coach Milan 17:25 to 21:02): one card, the box and Find ideas, the one button. Find ideas looks
// in your recipes, Coach's, the members' and the starters, and asks Chef Mealan at the same time for three ideas: the dish named,
// as close as it can be, and two similar. Each idea is short (name, PD, why, View more); View more opens it, View less closes it.
// Nothing found: the line, then his ideas. A new set: Find ideas again. An idea is kept in My recipes on Save in My recipes,
// or when it goes on the plate.
import { w } from "../words";
import { foodV } from "../reference";
import { recipeName } from "../recipeDiff";
import { cookTitle } from "../cookWords";
import { ThinkingCard } from "./ThinkingCard";
import { sameFoodName } from "../mixtip";
import { placeName, placeNameEn } from "../places";
import { carriedLists } from "../carry";
import { tasteOfWords } from "../craving";
import { tasteForReq } from "../tasteChips";
import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, ChefHat } from "lucide-react";
import type { AppApi } from "../screens/api";
import type { Food, Meal } from "../pilot";
import { uid, validateFood } from "../pilot";
import { fmt, pdVal, pdText, pdUnit } from "../ui";
import { STARTERS, fitOf, fromMeal, type PlannedMeal } from "../planned";
import { membersFor, portionOf, type SharedRecipe } from "../members";
import { blockedByAllergy } from "../safety";
import { tasteForChef } from "../kitchens";
import { estimate } from "./RecipeInBlock";
import { parseCraving, matchesCraving, splitByPd, recipeHay, foodPd, safeIdeaItem, type Row } from "../craving";

type Ref = { kind: "mine" | "coach"; meal: Meal } | { kind: "member"; r: SharedRecipe } | { kind: "starter"; m: PlannedMeal };
type Idea = { meal: Meal; why: string };

export function CravingSearch({ p, need, target, onFood }: { p: AppApi; need: number | null; target: number | null; onFood: (f: Food) => void }) {
  const { state, setState } = p;
  const [q, setQ] = useState("");
  const [members, setMembers] = useState<SharedRecipe[] | null>(null);
  const [showUnder, setShowUnder] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  // DT301 (Coach Milan 21:04 to 21:08): an idea is not saved by itself; Save in My recipes keeps it, and so does Put it on my plate
  const [saved, setSaved] = useState<string[]>([]);
  // what Find ideas was tapped for; typing again clears the answer until the next tap
  const [searched, setSearched] = useState<string | null>(null);
  // one question to Chef Mealan at a time (0.2.46, Milan 00:12: taps while he was thinking each made another idea)
  const [asking, setAsking] = useState<string | null>(null);
  const busy = useRef(false);
  const [err, setErr] = useState("");
  const [shown, setShown] = useState<string[]>([]);
  const c = useMemo(() => parseCraving(searched ?? ""), [searched]);
  const active = c.words.length > 0 || c.minPd !== null;
  // the members' recipes come in once, when you first type
  useEffect(() => {
    if (!active || members !== null) return;
    fetch("/api/members").then((r) => (r.ok ? r.json() : { recipes: [] })).then((d) => setMembers(Array.isArray(d.recipes) ? d.recipes : [])).catch(() => setMembers([]));
  }, [active, members]);
  useEffect(() => { setShowUnder(false); setErr(""); }, [searched]);
  const allergies = p.safety.allergies ?? [];
  const rowOf = <T,>(key: string, title: string, kcal: number, protein: number, ref: T): Row<T> => ({ key, title, kcal, protein, pd: kcal > 0 ? (100 * protein) / kcal : null, ref });
  const groups = useMemo(() => {
    if (!active) return null;
    const ok = (m: Meal) => !m.items.some((i) => blockedByAllergy(i.food, allergies));
    const mine = state.meals.filter((m) => m.from !== "coach" && ok(m) && matchesCraving(c.words, recipeHay(m))).map((m) => { const x = fromMeal(m, "mine"); return rowOf<Ref>(`m:${m.id}`, recipeName(m, state.meals), x.kcal, x.protein, { kind: "mine", meal: m }); });
    const coach = state.meals.filter((m) => m.from === "coach" && ok(m) && matchesCraving(c.words, recipeHay(m))).map((m) => { const x = fromMeal(m, "coach"); return rowOf<Ref>(`c:${m.id}`, m.title, x.kcal, x.protein, { kind: "coach", meal: m }); });
    const mem = membersFor((members ?? []).filter((r) => !r.mine), { target, kitchens: p.personal.kitchens ?? [], allergies })
      .filter((r) => matchesCraving(c.words, { title: r.title, foods: r.items.map((i) => i.food.name), parts: r.items.map((i) => i.part ?? "") }))
      .map((r) => { const x = portionOf(r, need); return rowOf<Ref>(`r:${r.id}`, r.title, x.kcal, x.protein, { kind: "member", r }); });
    const starters = STARTERS.filter((m) => matchesCraving(c.words, { title: m.title, foods: [] })).map((m) => rowOf<Ref>(`s:${m.title}`, m.title, m.kcal, m.protein, { kind: "starter", m }));
    const all = [{ key: "mine", title: w("craving.yourRecipes"), rows: mine }, { key: "coach", title: w("craving.coachSRecipes"), rows: coach }, { key: "members", title: w("craving.membersRecipes"), rows: mem }, { key: "starters", title: w("craving.starters"), rows: starters }];
    const split = all.map((g) => ({ ...g, ...splitByPd(g.rows, c.minPd, target) }));
    const foods = c.words.length ? state.foods.filter((f) => !blockedByAllergy(f, allergies) && matchesCraving(c.words, { title: f.name, foods: [f.name] })) : [];
    const foodsShown = c.minPd === null ? foods : foods.filter((f) => (foodPd(f) ?? 0) >= c.minPd! - 0.05);
    return { groups: split.filter((g) => g.shown.length), under: split.flatMap((g) => g.under), foods: foodsShown.slice(0, 5), foodsUnder: foods.filter((f) => !foodsShown.includes(f)) };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, c, state.meals, state.foods, members, target, need]);
  // R22 (0.2.50): sweet, DaaM or savoury in your words sets What is it? on the plate, once you take a dish or a food
  const keepTaste = () => { const t = tasteOfWords(c.words); if (t) p.setPlateTaste(t); };
  const take = (ref: Ref) => {
    if (busy.current) return;
    // after the plate opens, so your words win over the recipe's own preset
    queueMicrotask(keepTaste);
    if (ref.kind === "mine" || ref.kind === "coach") { setQ(""); p.openOnPlate(ref.meal); return; }
    if (ref.kind === "member") { setQ(""); p.takeMember(ref.r, "make", portionOf(ref.r, need).items); return; }
    if (ref.kind === "starter") void askChef(ref.m.title, 1);
  };
  // Chef Mealan's idea: kept in My recipes as an idea, not made yet; every number from its foods
  const ideaOf = (one: any, craving: string): Idea => {
    // DT150 (0.2.131): the idea's parts (base, filling, topping) come with it; a dish of one part has none
    const raw: any[] = one?.items ?? [];
    const partOf = (name: string) => { const r = raw.find((x) => String(x?.name ?? "").trim().toLowerCase() === name.toLowerCase()); const pt = typeof r?.part === "string" ? r.part.trim().slice(0, 24) : ""; return pt ? pt.charAt(0).toUpperCase() + pt.slice(1) : undefined; };
    const items = raw.map(safeIdeaItem).filter(Boolean).map((i: NonNullable<ReturnType<typeof safeIdeaItem>>) => {
      // DT148 (0.2.129): your own food by its name, or by the same name without its other name (Quark, low fat (Magerquark))
      const lib = state.foods.find((f) => f.name.toLowerCase() === i.name.toLowerCase()) ?? state.foods.filter(p.inPlace).find((f) => sameFoodName(f.name, i.name));
      const part = partOf(i.name);
      return { id: uid(), food: lib ?? estimate(i), grams: i.grams, locked: true, ...(part ? { part } : {}) };
    }).filter((i: { food: Food }) => !validateFood(i.food).length);
    if (items.length < 2) throw new Error(w("craving.errNoIdeaWords"));
    if (items.some((i: { food: Food }) => blockedByAllergy(i.food, allergies))) throw new Error(w("craving.errCantHave"));
    const total = items.reduce((n: number, i: { grams: number }) => n + i.grams, 0);
    const meal: Meal = { id: uid(), title: cookTitle(String(one.title).slice(0, 80)), items, portion: total, savedAt: new Date().toISOString(), steps: [], idea: { at: new Date().toISOString(), craving: craving.slice(0, 80), how: (Array.isArray(one.how) ? one.how : []).map((x: unknown) => String(x).slice(0, 220)).filter(Boolean).slice(0, 5) } };
    return { meal, why: String(one.why ?? "") };
  };
  async function askChef(craving: string, count: 1 | 3 = 3) {
    if (busy.current) return;
    busy.current = true; setAsking(craving); setErr(""); setIdeas([]); setOpenIdx(null);
    try {
      const res = await fetch("/api/crave", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        craving, minPd: c.minPd, target, need, kitchens: p.personal.kitchens ?? [], taste: tasteForChef(p.personal), region: p.region,
        library: state.foods.filter(p.inPlace).slice(0, 40).map((f) => ({ name: f.name, calories: f.calories, protein: f.protein })), place: placeNameEn(p.herePlace ?? p.region ?? "") || null, avoid: shown, count, carried: carriedLists(state.meals, state.feedback), tastes: tasteForReq(p.personal.tasteChips, state.preferences) }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || w("craving.errNoAnswer"));
      if (data.error) throw new Error(data.message || w("craving.errNoIdea"));
      const got: any[] = Array.isArray(data.ideas) ? data.ideas : data.idea ? [data.idea] : [];
      const made: Idea[] = []; let why = "";
      for (const one of got) { try { made.push(ideaOf(one, craving)); } catch (e: any) { why = e.message; } }
      if (!made.length) throw new Error(why || w("craving.errNoIdeaWords"));
      setShown((l) => [...l, ...made.map((x) => x.meal.title)].slice(-9));
      setIdeas(made); setOpenIdx(made.length === 1 ? 0 : null);
    } catch (e: any) { setErr(e.message); } finally { busy.current = false; setAsking(null); }
  }
  const pdCell = (r: { kcal: number; protein: number }) => { const fit = fitOf(r, target, pdUnit()); return <div className={`pick-pd ${fit.state}`}><b>{pdVal(fit.pd)}</b><small>{fit.text}</small></div>; };
  const row = (r: Row<Ref>) => (
    <button key={r.key} type="button" className="menu-row pick-row" onClick={() => take(r.ref)} aria-label={`${r.title}, ${pdText(r.pd)}`}>
      <div className="menu-row-text"><b>{r.title}</b><small>{w("craving.kcalProt", { kcal: fmt(r.kcal, 0), protein: fmt(r.protein, 0) })}{r.ref.kind === "starter" ? ` · ${w("craving.makesFromYourFoods")}` : ""}</small></div>
      {pdCell(r)}
    </button>
  );
  const crave = c.text || (searched ?? "").trim();
  // Find ideas: the dishes for what you typed, and Chef Mealan's three ideas, at the same time
  const find = () => {
    const t = q.trim(); if (!t || busy.current) return;
    setSearched(t); setShowUnder(false);
    const pc = parseCraving(t); void askChef(pc.text || t, 3);
  };
  const keepIdea = (m: Meal) => { if (saved.includes(m.id) || state.meals.some((x) => x.id === m.id)) return; setState((s) => ({ ...s, meals: [m, ...s.meals] })); setSaved((l) => [...l, m.id]); };
  const putOn = (m: Meal) => { keepIdea(m); setIdeas([]); setOpenIdx(null); setQ(""); setSearched(null); setSaved([]); p.openOnPlate(m); keepTaste(); };
  return (
    <div className="card crave crave-card">
      <div className="chat-input crave-bar">
        <input className="crave-box" aria-label={w("plate.craving")} placeholder={w("plate.cravingBox")} value={q} onChange={(e) => { setQ(e.target.value); if (searched !== null) { setSearched(null); setIdeas([]); setOpenIdx(null); } }} onKeyDown={(e) => { if (e.key === "Enter") find(); }} enterKeyHint="search" />
      </div>
      <button type="button" className="pill pill-primary pill-wide crave-find" disabled={!q.trim() || Boolean(asking)} onClick={find}><ChefHat size={18} /> {w("craving.findIdeas")}</button>
      {active && groups && (<>
        {c.minPd !== null && <div className="crave-chips"><button type="button" className="pill pill-small" aria-label={w("craving.removePdFilter", { pd: c.minPd })} onClick={() => { const t = q.replace(/\bpd\s*(?:of\s*)?(?:>=|≥|>|over|above|at least)?\s*\d{1,2}(?:[.,]\d)?\s*(?:\+|or more|and up|or higher|plus)?/i, "").replace(/\s+/g, " ").trim(); setQ(t); setSearched(t || null); }}>{w("craving.pdAndUp", { pd: fmt(c.minPd, 1) })}</button></div>}
        {groups.groups.map((g) => <div key={g.key}><small className="pick-group crave-group">{g.title}</small><div className="menu-list pick-list">{g.shown.map(row)}</div></div>)}
        {groups.under.length > 0 && (showUnder
          ? <><small className="pick-group crave-group">{w("craving.underPd", { pd: fmt(c.minPd, 1) })}</small><div className="menu-list pick-list">{groups.under.map(row)}</div></>
          : <small className="muted crave-line">{groups.under.length === 1 ? w("craving.underOne", { pd: fmt(c.minPd, 1), title: groups.under[0].title, dishPd: pdText(groups.under[0].pd) }) : w("craving.underMany", { pd: fmt(c.minPd, 1), n: groups.under.length })} <button type="button" className="link in-inline" onClick={() => setShowUnder(true)}>{w(groups.under.length === 1 ? "craving.showIt" : "craving.showThem")}</button></small>)}
        {groups.foods.length > 0 && <><small className="pick-group crave-group">{w("craving.yourFoods")}</small><div className="menu-list pick-list">{groups.foods.map((f) => (
          <button key={f.id} type="button" className="menu-row pick-row" onClick={() => { keepTaste(); onFood(f); }} aria-label={w("craving.addFood", { food: foodV(f) })}>
            <div className="menu-row-text"><b>{f.name}</b><small>{f.brand} · {pdText(foodPd(f))}</small></div><span className="crave-add"><Plus size={14} /> {w("craving.add")}</span>
          </button>))}</div></>}
        {groups.foods.length === 0 && groups.foodsUnder.length > 0 && <small className="muted crave-line">{w("craving.noFoodAt", { pd: fmt(c.minPd, 1), list: groups.foodsUnder.slice(0, 2).map((f) => w("craving.foodIs", { name: f.name, pd: pdText(foodPd(f)) })).join("; ") })}</small>}
        {groups.groups.length === 0 && <small className="muted crave-none">{c.minPd !== null ? w("craving.nothingInPd", { crave, pd: fmt(c.minPd, 1) }) : w("craving.nothingIn", { crave })}</small>}
      </>)}
      {asking && <ThinkingCard className="crave-ask crave-thinking" title={/^(a|an|the|some)\b/i.test(asking) ? w("craving.making", { what: asking }) : w("craving.makingIdeaFor", { what: asking })} sub={placeName(p.herePlace ?? p.region ?? "") ? w("craving.fromFoodsSoldIn", { place: placeName(p.herePlace ?? p.region ?? "") }) : w("craving.fromYourFoods")} />}
      {err && !asking && <small className="crave-err" role="alert">{err}</small>}
      {ideas.length > 0 && !asking && (<>
        <small className="pick-group crave-group crave-chef"><ChefHat size={16} aria-hidden="true" /> {w(ideas.length === 1 ? "craving.chefsIdea" : "craving.chefsIdeas")}</small>
        {ideas.map((idea, k) => { const nums = fromMeal(idea.meal, "mine"), open = openIdx === k; return (
          <div className={`crave-idea${open ? " open" : ""}`} key={idea.meal.id}>
            <div className="crave-idea-top"><b>{idea.meal.title}</b>{pdCell(nums)}</div>
            {idea.why && <small className="muted">{idea.why}</small>}
            {open && <>
              {/* DT148 (0.2.129, board Stories100 version 2; Coach Milan 28 October 23:10): the idea is to read. Its foods as points with
                  their grams, how to make it, then the Plate, where every change happens */}
              <div className="crave-read">
                <b>{w("craving.forOneServing")}</b>
                {/* DT150: a dish in parts lists its foods part by part */}
                {idea.meal.items.some((i) => i.part)
                  ? <ul className="crave-foods crave-parts">{[...new Set(idea.meal.items.map((i) => i.part ?? w("craving.otherPart")))].map((pt) => <li key={pt}><b>{pt}:</b> {idea.meal.items.filter((i) => (i.part ?? w("craving.otherPart")) === pt).map((i) => w("craving.gFood", { grams: fmt(i.grams, 0), food: i.food.name })).join(", ")}</li>)}</ul>
                  : <ul className="crave-foods">{idea.meal.items.map((i) => <li key={i.id}>{w("craving.gFood", { grams: fmt(i.grams, 0), food: i.food.name })}</li>)}</ul>}
                {(idea.meal.idea?.how ?? []).length > 0 && <><b>{w("craving.howToMakeIt")}</b><ol className="crave-how">{idea.meal.idea!.how!.map((x, j) => <li key={j}>{x}</li>)}</ol></>}
              </div>
              <small className="muted">{w("craving.oneServing", { kcal: fmt(nums.kcal, 0), protein: fmt(nums.protein, 0) })}</small>
              <small className="muted">{w("craving.numbersFrom")}</small>
              <div className="button-row crave-save">
                {saved.includes(idea.meal.id) ? <b className="crave-saved">✓ {w("craving.savedInMyRecipes")}</b> : <button type="button" className="pill pill-small pill-action" onClick={() => keepIdea(idea.meal)}>{w("craving.saveInMyRecipes")}</button>}
                <button type="button" className="pill pill-small pill-primary" onClick={() => putOn(idea.meal)}>{w("craving.putItOnMyPlate")}</button>
              </div>
            </>}
            <div className="button-row crave-more"><button type="button" className="pill pill-small pill-action" aria-expanded={open} onClick={() => setOpenIdx(open ? null : k)}>{w(open ? "craving.viewLess" : "craving.viewMore")}</button></div>
          </div>); })}
      </>)}
    </div>
  );
}
