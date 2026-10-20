// SL5 (0.2.63, Milan 15:48 to 19:00): Chef Mealan helps a meal left short by a food marked Not this time. Asked from the shopping list, it
// offers a swap for the food that wasn't there, so the recipe stays the same otherwise, and another meal for that slot. The
// app builds each option's foods, drops one that hits a declared allergy or still needs a missing food, and shows its PD
// against the day's target. Use this puts it in the plan for that day only (the recipe stays as it is), and the list follows.
import { useState } from "react";
import type { AppApi } from "../screens/api";
import type { Food, Ingredient } from "../pilot";
import { aggregate, density, uid } from "../pilot";
import { fromMeal, plannedPortion, type PlannedMeal } from "../planned";
import { blockedByAllergy } from "../safety";
import { tasteForChef } from "../kitchens";
import { fmt, pdVal } from "../ui";
import { CHEF_NAME } from "./Mark";
import { buyAs, type NewFood } from "../shopping";

type Opt = { kind: "standin" | "meal"; title: string; why: string; note: string; items: Ingredient[]; kcal: number; protein: number; pd: number | null; mealId?: string; source: PlannedMeal["source"] };
const estimate = (f: { name: string; calories: number; protein: number; fats: number; carbs: number }): Food => ({
  id: uid(), name: f.name, brand: "estimate", basis: "100g", source: "estimate", notes: `${CHEF_NAME}'s estimate`,
  reviewedAt: new Date().toISOString(), readyToEat: true, calories: f.calories, protein: f.protein, fats: f.fats, carbs: f.carbs, fiber: null,
} as Food);

export function ShortHelp({ p, list, date, slot, label, title, missing, onUsed }: { p: AppApi; list: number; date: string; slot: string; label: string; title: string; missing: string[]; onUsed: (title: string, foods: NewFood[]) => void }) {
  const [busy, setBusy] = useState(false), [opts, setOpts] = useState<Opt[] | null>(null), [err, setErr] = useState("");
  const held = p.planned[date]?.[slot] ?? null;
  const portion = held ? plannedPortion(held, "short", "") : null;
  const day = p.numbersFor(new Date(`${date}T12:00:00`));
  const target = day ? density(day.protein, day.kcal) : p.pdRef;
  // the list may say a food raw (Rice, white, raw) where the meal counts it cooked (Rice, cooked): both are the same food (SL7)
  const isMissingFood = (f: { name: string; calories?: number | null }) => missing.some((m) => [f.name, buyAs(f.name, "", 1, f.calories).name].some((n) => n.toLowerCase() === m.toLowerCase()));
  const isMissing = (n: string) => isMissingFood({ name: n, calories: portion?.items.find((i) => i.food.name === n)?.food.calories ?? null });
  // the missing foods as the meal names them, for Chef Mealan and for the notes
  const asInMeal = portion ? [...new Set(portion.items.filter((i) => isMissingFood(i.food)).map((i) => i.food.name))] : [];
  const named = asInMeal.length ? asInMeal : missing;
  const lib = (name: string) => p.state.foods.find((f) => f.name.toLowerCase() === name.toLowerCase()) ?? null;
  const build = (o: any): Opt | null => {
    let items: Ingredient[] = [], mealId: string | undefined, source: PlannedMeal["source"] = held?.source ?? "plate", name = String(o.title || "");
    if (o.kind === "standin") {
      // a swap only where the meal still has the food: never twice on a meal already changed (0.2.65, Milan 20:46)
      if (!portion || !portion.items.some((i) => isMissing(i.food.name))) return null;
      items = [...portion.items.filter((i) => !isMissing(i.food.name)).map((i) => ({ ...i, id: uid() })),
        ...(o.swaps ?? []).map((w: any) => ({ id: uid(), food: lib(w.name) ?? estimate(w), grams: w.grams, locked: false }))];
    } else {
      const r = o.id ? p.state.meals.find((m) => m.id === o.id) ?? null : null;
      if (r) { const pm = fromMeal(r, r.from === "coach" ? "coach" : "mine"); items = (plannedPortion(pm, "short", "")?.items ?? []).map((i) => ({ ...i, id: uid() })); mealId = r.id; source = pm.source; name = r.title; }
      else items = (o.foods ?? []).map((f: any) => ({ id: uid(), food: lib(f.name) ?? estimate(f), grams: f.grams, locked: false }));
      if (!r) source = "plate";
    }
    if (!items.length || items.some((i) => isMissing(i.food.name) || blockedByAllergy(i.food, p.safety.allergies ?? []))) return null;
    const a = aggregate(items), kcal = Math.round(a.calories ?? 0), protein = Math.round(a.protein ?? 0);
    // who did what, said plainly: Chef Mealan suggests, the person picks, the app changes the plan
    // what was swapped, as the meal names it; what was marked, as the list says it
    const foods = named.join(", ").toLowerCase(), marked = missing.join(", ").toLowerCase();
    const note = o.kind === "standin"
      ? `You swapped ${foods} for ${(o.swaps ?? []).map((w: any) => String(w.name).toLowerCase()).join(", ")} because you marked ${marked} Not this time on shopping list ${list}. From ${CHEF_NAME}'s ideas. This day only; ${title} stays as it is.`
      : `You picked this in place of ${title} because you marked ${marked} Not this time on shopping list ${list}. From ${CHEF_NAME}'s ideas. This day only.`;
    return { kind: o.kind === "meal" ? "meal" : "standin", title: name, why: String(o.why || ""), note, items, kcal, protein, pd: density(protein, kcal), mealId, source };
  };
  const ask = async () => {
    if (!p.ai.on) { setErr(p.ai.why || `${CHEF_NAME} is not available right now.`); return; }
    if (!portion) { setErr("This meal has no foods saved, so there is nothing to stand in for."); return; }
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/short", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        slot: label, missing: named, target,
        meal: { title, foods: portion.items.map((i) => ({ name: i.food.name, grams: Math.round(i.grams), calories: i.food.calories, protein: i.food.protein, fats: i.food.fats, carbs: i.food.carbs })) },
        candidates: p.state.meals.slice(0, 40).map((m) => { const pm = fromMeal(m, "mine"); return { id: m.id, title: m.title, kcal: pm.kcal, protein: pm.protein, uses: m.items.map((i) => i.food.name) }; }),
        library: p.state.foods.slice(0, 30).map((f) => ({ name: f.name, calories: f.calories, protein: f.protein })),
        goal: p.goal?.band, region: p.region, kitchens: p.personal.kitchens ?? [], taste: tasteForChef(p.personal) }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || `${CHEF_NAME} didn't answer. Try again.`);
      setOpts(((d.options ?? []) as any[]).map(build).filter((x): x is Opt => !!x));
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };
  const [using, setUsing] = useState(false);
  const use = (o: Opt) => {
    if (using) return; setUsing(true);
    const weight = o.items.reduce((n, i) => n + i.grams, 0);
    p.fill(date, slot, { title: o.title, kcal: o.kcal, protein: o.protein, source: o.source, ...(o.mealId ? { mealId: o.mealId } : { note: o.note }), items: o.items, portion: Math.round(weight) });
    onUsed(o.title, o.items.map((i) => ({ name: i.food.name, brand: i.food.brand ?? "", grams: i.grams, kcal: i.food.calories })));
  };
  return (
    <div className="shop-help">
      <div className="shop-help-head">
        <div className="menu-row-text"><b>{label}, {title}</b><small>Short: {missing.join(", ")}</small></div>
        {!opts && <button type="button" className="pill pill-small" disabled={busy} onClick={ask}>{busy ? "Asking…" : `Ask ${CHEF_NAME}`}</button>}
      </div>
      {err && <small className="shop-missing-note">{err}</small>}
      {opts && !opts.length && <small>{CHEF_NAME} found nothing that fits. Pick another meal for this slot in Plan.</small>}
      {opts?.map((o, k) => {
        const fits = target === null || (o.pd !== null && o.pd >= target - 0.05);
        return (
          <div key={k} className="shop-help-opt">
            <small className="shop-help-kind">{o.kind === "standin" ? "Swap a food" : "Another meal"}</small>
            <b>{o.title}</b>
            {o.why && <small>{o.why}</small>}
            <small className={fits ? "fit-ok" : "fit-under"}>{fmt(o.kcal, 0)} kcal · {o.protein} g protein · PD {pdVal(o.pd)}{fits ? " · fits" : ` · under your ${pdVal(target)}`}</small>
            <div className="button-row"><button type="button" className="pill pill-small" disabled={using} onClick={() => use(o)}>Use this</button></div>
          </div>
        );
      })}
    </div>
  );
}
