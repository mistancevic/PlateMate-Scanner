// R6 (0.2.43, Milan 19:45 to 19:58, board RS14): one block to bring a recipe in from screenshots or a link, shared by the
// Plate and Recipes. The cards (ShotsCard, LinkCard, ReadCard, ErrorCard) and the read itself are the same on both; only the
// last step differs: the Plate puts it on the plate, Recipes saves it in My recipes.
import { useState } from "react";
import { Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import type { Food, Ingredient, Meal } from "../pilot";
import { uid } from "../pilot";
import { MAX_SHOTS, cleanSteps, countItem, type ReadRecipe } from "../recipeIn";
import { capOil } from "../frying";
import { resizeImageBase64 } from "../utils/image";
import { iconFor } from "../icons";
import { leanFood } from "../parts";
import { foodNames } from "../stepsState";
import { log } from "../log";
import { CHEF_NAME } from "./Mark";
import { ShotsCard, LinkCard, ReadCard, ErrorCard, type InFlow } from "./RecipeIn";

export const estimate = (a: { name: string; calories: number; protein: number; fats?: number | null; carbs?: number | null }): Food => ({ id: uid(), name: a.name, brand: "estimate", basis: "100g", source: "estimate", notes: `${CHEF_NAME}'s estimate`, reviewedAt: new Date().toISOString(), readyToEat: true, calories: a.calories, protein: a.protein, fats: a.fats ?? null, carbs: a.carbs ?? null, fiber: null, icon: iconFor(a.name) });
const readFile = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsDataURL(f); });

// the read, its state and its steps; onError says what went wrong where the screen shows errors
export function useRecipeIn(o: { kitchens: string[]; region: unknown; onError: (m: string) => void; pdRef?: number | null; fitPd?: (pd: number | null) => string }) {
  const [inFlow, setInFlow] = useState<InFlow | null>(null);
  // a slow read (0.2.23, IM23d): after 20 seconds the card says it takes longer
  const [slowRead, setSlowRead] = useState(false);
  async function addShots(files: FileList | null, base: string[] = []) {
    const list = Array.from(files ?? []).slice(0, MAX_SHOTS - base.length);
    if (!list.length) return;
    const read = await Promise.all(list.map(async (f) => { const raw = await readFile(f); return resizeImageBase64(raw, 1600, 1600).catch(() => raw); }));
    setInFlow({ kind: "shots", shots: [...base, ...read].slice(0, MAX_SHOTS) });
  }
  async function readIn(from: { shots: string[] } | { url: string }) {
    const shots = "shots" in from ? from.shots : [], url = "url" in from ? from.url.trim() : "";
    setInFlow("shots" in from ? { kind: "shots", shots, reading: true } : { kind: "link", url, reading: true });
    setSlowRead(false);
    const slow = setTimeout(() => setSlowRead(true), 20000);
    try {
      const res = await fetch("/api/recipe/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...(shots.length ? { images: shots } : { url }), kitchens: o.kitchens, region: o.region }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `${CHEF_NAME} could not read it.`);
      if (data.error) { log("recipe_in", { how: shots.length ? "shot" : "link", result: String(data.error) }); setInFlow({ kind: "error", code: data.error, message: data.message || "", back: shots.length ? "shots" : "link", shots, url }); return; }
      log("recipe_in", { how: shots.length ? "shot" : "link", result: "read" });
      const got = data.recipe as ReadRecipe;
      // the oil rule again on the phone (R3, 0.2.38): the same result on an answer already capped, so it never counts twice
      const stepsGot = cleanSteps(got.steps ?? []);
      setInFlow({ kind: "read", recipe: { ...got, items: capOil((got.items ?? []).map(countItem), stepsGot), steps: stepsGot }, shots, url: data.url, note: data.note, ...(typeof data.photo === "string" && /^https:\/\//.test(data.photo) ? { photo: data.photo } : {}) });
    } catch (e: any) { setInFlow(shots.length ? { kind: "shots", shots } : { kind: "link", url }); o.onError(e.message); }
    finally { clearTimeout(slow); setSlowRead(false); }
  }
  return { inFlow, setInFlow, slowRead, addShots, readIn, pdRef: o.pdRef ?? null, fitPd: o.fitPd };
}
export type RecipeIn = ReturnType<typeof useRecipeIn>;

// Screenshot and Link, the two ways in
export function StartWays({ flow }: { flow: RecipeIn }) {
  return (
    <div className="ways">
      <label className="pill pill-small"><ImageIcon size={15} /> Screenshot<input type="file" accept="image/*" multiple hidden onChange={(e) => { void flow.addShots(e.target.files); e.target.value = ""; }} /></label>
      <button className="pill pill-small" onClick={() => flow.setInFlow({ kind: "link", url: "" })}><LinkIcon size={15} /> Link</button>
    </div>
  );
}

// the card the flow is at; put is the last step, named by the screen
export function RecipeInFlow({ flow, put, putLabel }: { flow: RecipeIn; put: (f: Extract<InFlow, { kind: "read" }>) => void; putLabel?: string }) {
  const { inFlow, setInFlow, slowRead, addShots, readIn } = flow;
  if (!inFlow) return null;
  if (inFlow.kind === "shots") return <ShotsCard shots={inFlow.shots} reading={inFlow.reading} slow={slowRead} add={(f) => void addShots(f, inFlow.shots)} remove={(n) => setInFlow({ kind: "shots", shots: inFlow.shots.filter((_, k) => k !== n) })} read={() => void readIn({ shots: inFlow.shots })} cancel={() => setInFlow(null)} />;
  if (inFlow.kind === "link") return <LinkCard url={inFlow.url} reading={inFlow.reading} slow={slowRead} setUrl={(v) => setInFlow({ kind: "link", url: v })} read={() => void readIn({ url: inFlow.url })} cancel={() => setInFlow(null)} />;
  if (inFlow.kind === "read") return <ReadCard flow={inFlow} putLabel={putLabel} pdRef={flow.pdRef ?? null} fitPd={flow.fitPd} setSource={(v) => setInFlow({ ...inFlow, recipe: { ...inFlow.recipe, source: v } })} setServings={(n) => setInFlow({ ...inFlow, recipe: { ...inFlow.recipe, servings: n, servingsHow: inFlow.recipe.servingsHow } })} toggle={(k) => setInFlow({ ...inFlow, recipe: { ...inFlow.recipe, items: inFlow.recipe.items.map((x, j) => (j === k ? { ...x, on: !(x.on ?? !x.optional) } : x)) } })} put={() => put(inFlow)} again={() => void readIn(inFlow.url ? { url: inFlow.url } : { shots: inFlow.shots })} cancel={() => setInFlow(null)} />;
  return <ErrorCard flow={inFlow} next={(to) => setInFlow(to === "link" ? { kind: "link", url: inFlow.url } : { kind: "shots", shots: inFlow.code === "not-recipe" ? [] : inFlow.shots })} cancel={() => setInFlow(null)} />;
}

// IM3: the recipe as read becomes a recipe of yours, with where it came from; foods you have are used, the rest are estimates
export async function mealFromRead(f: Extract<InFlow, { kind: "read" }>, foods: Food[]): Promise<{ meal: Meal; fresh: Food[] }> {
  const r = f.recipe;
  const fresh: Food[] = [];
  const whole: Ingredient[] = r.items.filter((i) => i.on ?? !i.optional).map((i) => {
    let food = foods.find((x) => x.name.toLowerCase() === i.name.toLowerCase()) ?? fresh.find((x) => x.name.toLowerCase() === i.name.toLowerCase());
    if (!food) { food = { ...estimate(i), notes: `${CHEF_NAME}'s estimate, from a recipe` }; fresh.push(food); }
    return { id: uid(), food, grams: i.grams, locked: true, role: i.role, ...(i.part ? { part: i.part } : {}), ...(i.count ? { count: i.count } : {}), ...(i.fry ? { fry: i.fry } : {}) };
  });
  const thumbs = await Promise.all(f.shots.map((x) => resizeImageBase64(x, 900, 900).catch(() => x)));
  const total = whole.reduce((n, i) => n + i.grams, 0);
  // IM8: an optional food not added stays with the recipe, in its own list, out of the numbers
  const optional = r.items.filter((i) => i.optional && !(i.on ?? false)).map((i) => ({ name: i.name, written: i.written, ...(i.note ? { note: i.note } : {}), grams: i.grams, ...(i.part ? { part: i.part } : {}),
    food: leanFood(foods.find((x) => x.name.toLowerCase() === i.name.toLowerCase()) ?? { ...estimate(i), notes: `${CHEF_NAME}'s estimate, from a recipe` }) }));
  const meal: Meal = { id: uid(), title: r.title, items: whole, portion: Math.round(total / r.servings), savedAt: new Date().toISOString(), steps: [],
    source: { name: r.source, ...(f.url ? { url: f.url } : {}), from: f.url ? "link" : "screenshot", at: new Date().toISOString(), ...(r.steps?.length ? { steps: r.steps } : {}), foods: foodNames(whole), ...(f.url && f.photo ? { photo: f.photo } : {}) }, ...(thumbs.length ? { shots: thumbs } : {}), makes: { n: r.servings, unit: r.servingsUnit }, ...(optional.length ? { optional } : {}), ...(r.stated ? { stated: r.stated } : {}) };
  return { meal, fresh };
}
