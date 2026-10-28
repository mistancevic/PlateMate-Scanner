// R17 (0.2.45, Milan 23:04 to 23:34, board RS16): find what you crave. One box under What are you craving? on the Plate.
// Code looks first, at once and for free: your recipes, Coach's, the members' and Chef Mealan's starters, and your foods; PD 7+
// is a filter, shown as a chip. Chef Mealan is asked only on a tap; his idea is kept in My recipes as an idea, not made yet,
// and the app works out every number from the foods. Picking a dish puts it on the plate, as Make it does.
import { recipeName } from "../recipeDiff";
import { cookTitle } from "../cookWords";
import { carriedLists } from "../carry";
import { tasteOfWords } from "../craving";
import { tasteForReq } from "../tasteChips";
import { useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import type { AppApi } from "../screens/api";
import type { Food, Meal } from "../pilot";
import { uid, validateFood } from "../pilot";
import { fmt, pdVal, pdText, pdUnit } from "../ui";
import { STARTERS, fitOf, fromMeal, type PlannedMeal } from "../planned";
import { membersFor, portionOf, type SharedRecipe } from "../members";
import { blockedByAllergy } from "../safety";
import { tasteForChef } from "../kitchens";
import { estimate } from "./RecipeInBlock";
import { CHEF_NAME } from "./Mark";
import { parseCraving, matchesCraving, splitByPd, recipeHay, foodPd, safeIdeaItem, type Row } from "../craving";

type Ref = { kind: "mine" | "coach"; meal: Meal } | { kind: "member"; r: SharedRecipe } | { kind: "starter"; m: PlannedMeal };
type Idea = { meal: Meal; why: string };

export function CravingSearch({ p, need, target, onFood }: { p: AppApi; need: number | null; target: number | null; onFood: (f: Food) => void }) {
  const { state, setState } = p;
  const [q, setQ] = useState("");
  const [members, setMembers] = useState<SharedRecipe[] | null>(null);
  const [showUnder, setShowUnder] = useState(false);
  const [idea, setIdea] = useState<Idea | null>(null);
  // one question to Chef Mealan at a time (0.2.46, Milan 00:12: taps while he was thinking each made another idea)
  const [asking, setAsking] = useState<string | null>(null);
  const busy = useRef(false);
  const [err, setErr] = useState("");
  const [shown, setShown] = useState<string[]>([]);
  const c = useMemo(() => parseCraving(q), [q]);
  const active = c.words.length > 0 || c.minPd !== null;
  // the members' recipes come in once, when you first type
  useEffect(() => {
    if (!active || members !== null) return;
    fetch("/api/members").then((r) => (r.ok ? r.json() : { recipes: [] })).then((d) => setMembers(Array.isArray(d.recipes) ? d.recipes : [])).catch(() => setMembers([]));
  }, [active, members]);
  useEffect(() => { setShowUnder(false); setErr(""); }, [q]);
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
    const all = [{ key: "mine", title: "Your recipes", rows: mine }, { key: "coach", title: "Coach's recipes", rows: coach }, { key: "members", title: "Members' recipes", rows: mem }, { key: "starters", title: `${CHEF_NAME}'s starters`, rows: starters }];
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
    if (ref.kind === "starter") void askChef(ref.m.title);
  };
  // Chef Mealan's idea: kept in My recipes as an idea, not made yet; every number from its foods
  async function askChef(craving: string) {
    if (busy.current) return;
    busy.current = true; setAsking(craving); setErr("");
    try {
      const res = await fetch("/api/crave", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        craving, minPd: c.minPd, target, need, kitchens: p.personal.kitchens ?? [], taste: tasteForChef(p.personal), region: p.region,
        library: state.foods.slice(0, 40).map((f) => ({ name: f.name, calories: f.calories, protein: f.protein })), avoid: shown, carried: carriedLists(state.meals, state.feedback), tastes: tasteForReq(p.personal.tasteChips, state.preferences) }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `${CHEF_NAME} could not answer.`);
      if (data.error) throw new Error(data.message || `${CHEF_NAME} has no idea for that right now.`);
      const items = (data.idea?.items ?? []).map(safeIdeaItem).filter(Boolean).map((i: NonNullable<ReturnType<typeof safeIdeaItem>>) => {
        const lib = state.foods.find((f) => f.name.toLowerCase() === i.name.toLowerCase());
        return { id: uid(), food: lib ?? estimate(i), grams: i.grams, locked: true };
      }).filter((i: { food: Food }) => !validateFood(i.food).length);
      if (items.length < 2) throw new Error(`${CHEF_NAME} has no idea for that right now. Try other words.`);
      if (items.some((i: { food: Food }) => blockedByAllergy(i.food, allergies))) throw new Error(`${CHEF_NAME}'s idea had a food you can't have. Ask again.`);
      const total = items.reduce((n: number, i: { grams: number }) => n + i.grams, 0);
      const meal: Meal = { id: uid(), title: cookTitle(String(data.idea.title).slice(0, 80)), items, portion: total, savedAt: new Date().toISOString(), steps: [], idea: { at: new Date().toISOString(), craving: craving.slice(0, 80) } };
      setState((s) => ({ ...s, meals: [meal, ...s.meals] }));
      setShown((l) => [...l, meal.title].slice(-9));
      setIdea({ meal, why: String(data.idea.why ?? "") });
    } catch (e: any) { setErr(e.message); } finally { busy.current = false; setAsking(null); }
  }
  const pdCell = (r: { kcal: number; protein: number }) => { const fit = fitOf(r, target, pdUnit()); return <div className={`pick-pd ${fit.state}`}><b>{pdVal(fit.pd)}</b><small>{fit.text}</small></div>; };
  const row = (r: Row<Ref>) => (
    <button key={r.key} type="button" className="menu-row pick-row" onClick={() => take(r.ref)} aria-label={`${r.title}, ${pdText(r.pd)}`}>
      <div className="menu-row-text"><b>{r.title}</b><small>{fmt(r.kcal, 0)} kcal · {fmt(r.protein, 0)} g protein{r.ref.kind === "starter" ? ` · ${CHEF_NAME} makes it from your foods` : ""}</small></div>
      {pdCell(r)}
    </button>
  );
  const ideaNums = idea ? fromMeal(idea.meal, "mine") : null;
  const crave = c.text || q.trim();
  return (
    <div className="crave">
      <input className="search crave-box" aria-label="What are you craving?" placeholder="Crêpes, sarma, chocolate PD 7+…" value={q} onChange={(e) => { setQ(e.target.value); setIdea(null); }} />
      {!active && <small className="muted crave-hint">Finds dishes in your recipes, Coach's, the members' and {CHEF_NAME}'s, and your foods. Add PD 7+ to keep only dishes at PD 7 or more.</small>}
      {asking && <div className="card crave-ask crave-thinking" role="status"><b>{CHEF_NAME} is making {/^(a|an|the|some)\b/i.test(asking) ? asking : `an idea for ${asking}`}…</b><small className="muted">It takes a few seconds. One idea at a time.</small></div>}
      {active && groups && !idea && !asking && (<>
        {c.minPd !== null && <div className="crave-chips"><button type="button" className="pill pill-small" aria-label={`Remove the filter PD ${c.minPd} and up`} onClick={() => setQ(q.replace(/\bpd\s*(?:of\s*)?(?:>=|≥|>|over|above|at least)?\s*\d{1,2}(?:[.,]\d)?\s*(?:\+|or more|and up|or higher|plus)?/i, "").replace(/\s+/g, " ").trim())}>PD {fmt(c.minPd, 1)} and up ✕</button></div>}
        {groups.groups.map((g) => <div key={g.key}><small className="pick-group crave-group">{g.title}</small><div className="menu-list pick-list">{g.shown.map(row)}</div></div>)}
        {groups.under.length > 0 && (showUnder
          ? <><small className="pick-group crave-group">Under PD {fmt(c.minPd, 1)}</small><div className="menu-list pick-list">{groups.under.map(row)}</div></>
          : <small className="muted crave-line">Under PD {fmt(c.minPd, 1)}: {groups.under.length === 1 ? `1 more dish, ${groups.under[0].title}, ${pdText(groups.under[0].pd)}` : `${groups.under.length} more dishes`}. <button type="button" className="link in-inline" onClick={() => setShowUnder(true)}>Show {groups.under.length === 1 ? "it" : "them"}</button></small>)}
        {groups.foods.length > 0 && <><small className="pick-group crave-group">Your foods</small><div className="menu-list pick-list">{groups.foods.map((f) => (
          <button key={f.id} type="button" className="menu-row pick-row" onClick={() => { keepTaste(); onFood(f); }} aria-label={`Add ${f.name}`}>
            <div className="menu-row-text"><b>{f.name}</b><small>{f.brand} · {pdText(foodPd(f))}</small></div><span className="crave-add"><Plus size={14} /> Add</span>
          </button>))}</div></>}
        {groups.foods.length === 0 && groups.foodsUnder.length > 0 && <small className="muted crave-line">No food of yours at PD {fmt(c.minPd, 1)} or more. {groups.foodsUnder.slice(0, 2).map((f) => `${f.name} is ${pdText(foodPd(f))}`).join("; ")}.</small>}
        {groups.groups.length === 0 && <small className="pick-group crave-group">Nothing found</small>}
        {groups.groups.length === 0
          ? <div className="card crave-ask">
              <small className="muted">Nothing in your recipes, Coach's, the members' or your foods is {crave}{c.minPd !== null ? ` at PD ${fmt(c.minPd, 1)} or more` : ""}.</small>
              <button type="button" className="pill pill-wide pill-primary" disabled={Boolean(asking) || !crave} onClick={() => void askChef(crave)}>{asking ? `${CHEF_NAME} is thinking…` : `Ask ${CHEF_NAME} for one`}</button>
              {err && <small className="crave-err" role="alert">{err}</small>}
            </div>
          : <small className="muted crave-line">Tap a dish and it goes on the plate. <button type="button" className="link in-inline" disabled={Boolean(asking) || !crave} onClick={() => void askChef(crave)}>{asking ? `${CHEF_NAME} is thinking…` : `Ask ${CHEF_NAME} for another`}</button>{err && <span className="crave-err" role="alert"> {err}</span>}</small>}
      </>)}
      {idea && ideaNums && !asking && (<>
        <small className="pick-group crave-group">{CHEF_NAME}'s idea</small>
        <div className="card crave-idea">
          <div className="crave-idea-top"><b>{idea.meal.title}</b>{pdCell(ideaNums)}</div>
          {idea.why && <small className="muted">{idea.why}</small>}
          <small className="muted">{idea.meal.items.map((i) => `${fmt(i.grams, 0)} g ${i.food.name}`).join(" · ")}. One serving: {fmt(ideaNums.kcal, 0)} kcal · {fmt(ideaNums.protein, 0)} g protein.</small>
          <small className="muted">The numbers are from the foods, calculated by the app; a food you don't have is {CHEF_NAME}'s estimate.</small>
          <small className="crave-kept">Kept in My recipes as an idea, not made yet.</small>
          <button type="button" className="pill pill-primary pill-wide" onClick={() => { const m = idea.meal; setIdea(null); setQ(""); p.openOnPlate(m); keepTaste(); }}>Put it on my plate</button>
          <button type="button" className="link crave-again" disabled={Boolean(asking)} onClick={() => void askChef(crave)}>{asking ? `${CHEF_NAME} is thinking…` : "Another idea"}</button>
          {err && <small className="crave-err" role="alert">{err}</small>}
        </div>
      </>)}
    </div>
  );
}
