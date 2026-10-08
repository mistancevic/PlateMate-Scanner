import { useEffect, useState } from "react";
import { BANDS } from "../goal";
import type { Food, Meal } from "../pilot";
import type { Mix, MixTip } from "../mixtip";
import { bylineOf, fitsTicked, g1, type PublicRecipe } from "../recipes";
import { Mark, APP_NAME } from "../components/Mark";

// The recipe pages of chefmealan.com (canvas boards R1, R2 and R6, approved 7 October 2026; RG2, RG4 and RF4, 8 October): open to everyone, no sign-in.
// A signed-in member also sees their own amounts, and can put the recipe on their plate or keep it in their recipes.
export type MemberTools = {
  mixFor: (f: Food) => MixTip;
  takeMix: (f: Food, m: Mix) => void;
  putAlone: (f: Food, grams: number) => void;
  addRecipe: (m: Meal) => void;
  momentName: string;
  goalName: string;
  // the energy this moment of the day has, from the person's own numbers; null when they have none yet
  mealKcal: number | null;
};
type Loaded = PublicRecipe & { locked?: boolean };

const plural = (n: number, w: string) => (n === 1 ? w : /(s|x|ch|sh)$/.test(w) ? w + "es" : w + "s");
function Thumbs({ size = 16 }: { size?: number }) {
  const t = <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" /></svg>;
  return <span className="rp-thumbs" aria-hidden="true">{t}{t}</span>;
}
const Daam = () => <span className="rp-daam"><Thumbs /> DaaM good</span>;
function Top({ right }: { right: React.ReactNode }) {
  return <header className="rp-top"><a className="rp-brand" href="/"><Mark size={26} color="var(--brand)" /><b>{APP_NAME}</b></a>{right}</header>;
}
const Foot = () => <footer className="rp-foot"><a href="/impressum">Impressum</a> · <a href="/privacy">Privacy</a> · <a href="/disclaimer">Disclaimer</a></footer>;

function PdScale({ pd }: { pd: number }) {
  const fits = new Map<string, string>();
  for (const b of BANDS) { const m = b.range.match(/([\d.]+)\s*to\s*([\d.]+)/); if (!m) continue; const lo = +m[1], hi = +m[2]; const how = pd >= lo && pd <= hi ? "fits" : pd > hi && pd - hi <= 0.3 ? "just above" : pd < lo && lo - pd <= 0.3 ? "just below" : ""; if (how) fits.set(b.name, how); }
  const order = [...BANDS].sort((a, b) => parseFloat(b.range.slice(3)) - parseFloat(a.range.slice(3)));
  return (
    <div className="rp-scale">
      <div className="rp-bar"><span style={{ left: `${Math.min(10, pd) * 10}%` }} /></div>
      <div className="rp-ticks">{[0, 2, 4, 6, 8, 10].map((v) => <span key={v} style={{ left: `${v * 10}%` }}>{v}</span>)}</div>
      {order.map((b) => { const how = fits.get(b.name); return <div key={b.id} className={`rp-goal ${how === "fits" ? "on" : how ? "near" : ""}`}><span>{how === "fits" ? "✓ " : ""}{b.name}</span><span>{how ? `${how} · ` : ""}{b.range}</span></div>; })}
    </div>
  );
}

// the recipe as one food, per 100 g, counted in its servings, so Mealan's solver can fit it to a person's plate
function asFood(r: PublicRecipe): Food {
  return { id: `pub-${r.slug}`, name: r.title, brand: "", basis: "100g", source: "Chef Mealan recipe", notes: "", reviewedAt: new Date().toISOString(), readyToEat: true,
    calories: r.per100.kcal, protein: r.per100.protein, fats: r.per100.fat, carbs: r.per100.carbs, fiber: r.per100.fibre, icon: "🍽️",
    serving: { grams: Math.round(r.per100.grams / r.makes), name: r.servingName } } as Food;
}

// Your amounts (RF4 Q5, 8 October 2026): Mealan suggests how many; the member changes it with − and +, and the plate's
// numbers follow. With a mix, only the recipe's count changes; what Mealan added stays.
function Amounts({ r, m }: { r: PublicRecipe; m: MemberTools }) {
  const food = asFood(r);
  const tip = m.mixFor(food);
  const mix = tip.mixes[0];
  const per = r.per100.grams / r.makes;
  const count = (g: number) => Math.max(1, Math.round(g / per));
  const mine = mix?.items.find((i) => i.food.id === food.id);
  const suggested = mine ? count(mine.grams) : m.mealKcal ? Math.min(r.makes, Math.max(1, Math.round(m.mealKcal / Math.max(1, r.perServing.kcal)))) : 1;
  const [n, setN] = useState(suggested);
  const items = mix ? mix.items.map((i) => (i.food.id === food.id ? { ...i, grams: Math.round(n * per) } : i)) : [{ id: "r", grams: Math.round(n * per), locked: false, food }];
  const sum = (k: "calories" | "protein") => items.reduce((t, i) => t + ((i.food[k] ?? 0) * i.grams) / 100, 0);
  const kcal = Math.round(sum("calories")), protein = sum("protein"), pd = kcal > 0 ? (100 * protein) / kcal : 0;
  const stepper = (
    <span className="rp-step">
      <button aria-label={`One ${r.servingName} less`} disabled={n <= 1} onClick={() => setN((x) => Math.max(1, x - 1))}>−</button>
      <b>{n} {plural(n, r.servingName)}</b>
      <button aria-label={`One ${r.servingName} more`} disabled={n >= r.makes} onClick={() => setN((x) => Math.min(r.makes, x + 1))}>+</button>
    </span>
  );
  return (
    <section className="rp-card rp-amounts">
      <div className="rp-card-head"><b>Your amounts</b><small>{m.goalName} · {m.momentName.toLowerCase()}</small></div>
      {items.map((i, k) => (
        <div className="rp-row" key={k}><span>{i.food.id === food.id ? r.title : i.food.name}</span>{i.food.id === food.id ? stepper : <b>{Math.round(i.grams)} g</b>}</div>
      ))}
      <div className="rp-row rp-total"><span>On your plate</span><b>{kcal} kcal · {g1(protein)} protein · PD {pd.toFixed(1)}</b></div>
      <small className="muted">{mix
        ? `Mealan suggests ${suggested} ${plural(suggested, r.servingName)} for your ${m.momentName.toLowerCase()} and added what fits your PD target. Change the count with − and +.`
        : tip.case === "fits" ? `It fits your PD target as it is, so nothing needs adding. Mealan suggests ${suggested} ${plural(suggested, r.servingName)} for your ${m.momentName.toLowerCase()}; change it with − and +.` : tip.why}</small>
      <button className="pill pill-wide pill-primary" onClick={() => (mix ? m.takeMix(food, { ...mix, items, kcal, protein: Math.round(protein), pd }) : m.putAlone(food, Math.round(n * per)))}>Put on my plate</button>
      {r.items.every((i) => i.per100) && r.items.length > 0 && (
        <button className="link rp-center" onClick={() => m.addRecipe({
          id: `pub-${r.slug}-${Date.now().toString(36)}`, title: r.title, portion: r.items.reduce((s, i) => s + i.grams, 0), savedAt: new Date().toISOString(), steps: r.steps,
          items: r.items.map((i, k) => ({ id: `${r.slug}-${k}`, grams: i.grams, locked: false, food: { id: `pub-${r.slug}-${k}`, name: i.name, brand: "", basis: "100g", source: "Chef Mealan recipe", notes: "", reviewedAt: new Date().toISOString(), readyToEat: false, calories: i.per100!.kcal, protein: i.per100!.protein, fats: i.per100!.fat, carbs: i.per100!.carbs, fiber: i.per100!.fibre } as Food })),
        })}>Add to my recipes</button>
      )}
    </section>
  );
}

// The page itself, from a recipe in hand: the loaded page, or the preview from the Publish sheet (board RG2), where the photo
// is the one chosen in the sheet and nothing is saved
export function RecipeView({ r, member, photoSrc, top }: { r: Loaded; member: MemberTools | null; photoSrc?: string | null; top?: React.ReactNode }) {
  const s = r.perServing;
  const ticked = fitsTicked(r);
  const src = photoSrc !== undefined ? photoSrc : r.hasPhoto ? `/r/${r.slug}/photo.jpg` : null;
  return (
    <div className="rp">
      {top ?? <Top right={member ? <a className="rp-link" href="/today">Open the app</a> : <a className="rp-link" href="/recipes">All recipes</a>} />}
      {src && <figure className="rp-hero"><img src={src} alt={r.title} />{r.rating === "daam" && <Daam />}</figure>}
      <h1 className="rp-title">{r.title}</h1>
      {r.lines && <p className="rp-lines">{r.lines}</p>}
      <small className="rp-meta">{[bylineOf(r.author), `${r.makes} ${plural(r.makes, r.servingName)}`, r.minutes ? `${r.minutes} minutes` : ""].filter(Boolean).join(" · ")}</small>
      <div className="rp-stats">
        <span><b>{s.kcal}</b><small>kcal</small></span>
        <span><b>{g1(s.protein)}</b><small>protein</small></span>
        <span className="wide"><b>PD {r.pd}</b><small>protein density</small></span>
      </div>
      <small className="rp-per">For one {r.servingName}</small>
      {ticked.length > 0 && (
        <div className="rp-fits">
          <b>Fits best</b>
          <div className="rp-chips">{ticked.map((f) => <span key={f.name} className="rp-chip">✓ {f.name}</span>)}</div>
          <small>PD {r.pd} sits in the range of {ticked.length === 1 ? "this goal" : "these goals"}. Any goal can have it; the amount is what changes.</small>
        </div>
      )}
      {member ? <Amounts r={r} m={member} /> : (
        <section className="rp-card rp-invite">
          <b>Your amounts</b>
          <p>How many {plural(2, r.servingName)} fit your day, and what to add so the plate fits your goal: Mealan works it out for each person.</p>
          <a className="pill pill-wide pill-primary" href="/#ask">Ask for an invite</a>
          <small>A closed pilot with coaches.</small>
        </section>
      )}
      {r.locked ? (
        <section className="rp-card rp-locked"><b>Members only</b><p>The foods and the steps of this recipe are for members of the pilot.</p><a className="pill pill-wide" href="/#ask">Ask for an invite</a></section>
      ) : (
        <>
          <section className="rp-card">
            <div className="rp-card-head"><b>Ingredients</b><small>for {r.makes} {plural(r.makes, r.servingName)}</small></div>
            {r.items.map((i, k) => <div className="rp-row" key={k}><span>{i.name}</span><b>{i.amount}</b></div>)}
          </section>
          {r.steps.length > 0 && (
            <section className="rp-card">
              <b>Steps</b>
              <ol className="rp-steps">{r.steps.map((x, k) => <li key={k}><span>{k + 1}</span>{x}</li>)}</ol>
            </section>
          )}
        </>
      )}
      <section className="rp-card">
        <b>Nutrition</b>
        <div className="rp-row rp-th"><span /><small>ONE {r.servingName.toUpperCase()}</small><small>ALL {r.makes}</small></div>
        {([["Energy", `${s.kcal} kcal`, `${r.all.kcal} kcal`], ["Protein", g1(s.protein), g1(r.all.protein)], ["Carbs", `${s.carbs} g`, `${Math.round(r.all.carbs)} g`], ["Fat", `${s.fat} g`, `${Math.round(r.all.fat)} g`], ...(s.fibre !== null ? [["Fibre", `${s.fibre} g`, `${Math.round(r.all.fibre ?? 0)} g`]] : [])] as string[][]).map(([a, b, c]) => (
          <div className="rp-row rp-3" key={a}><span>{a}</span><b>{b}</b><small>{c}</small></div>
        ))}
        <small className="muted">Worked out from the labels of the foods used, weighed. {r.proteinShare} % of the energy is protein{r.proteinShare >= 20 ? "; the EU rule for calling food high protein is 20 %" : ""}.</small>
      </section>
      <section className="rp-card">
        <b>What is PD?</b>
        <p>Protein density: grams of protein for every 100 kcal. This recipe has PD {r.pd}, so 100 kcal of it bring {r.pd} g of protein.</p>
        <PdScale pd={r.pd} />
      </section>
      <Foot />
    </div>
  );
}

// A link to a recipe that was taken down (board RG4): it says so, and shows the recipes that are on Chef Mealan
function TakenDown({ title, right }: { title: string; right: React.ReactNode }) {
  const [list, setList] = useState<Loaded[]>([]);
  useEffect(() => { document.title = `Taken down · ${APP_NAME}`; fetch("/api/recipes?limit=4").then((r) => r.json()).then((d) => setList(d.recipes ?? [])).catch(() => {}); }, []);
  return (
    <div className="rp">
      <Top right={right} />
      <section className="rp-card rp-down"><h1 className="rp-title">This recipe was taken down</h1><p>{title ? `${title} is no longer on ${APP_NAME}.` : `It is no longer on ${APP_NAME}.`}{list.length ? " These recipes are:" : ""}</p></section>
      <div className="rp-grid">{list.map((r) => <RecipeCard key={r.slug} r={r} />)}</div>
      <a className="pill pill-wide" href="/recipes">All recipes</a>
      <Foot />
    </div>
  );
}

export function RecipePage({ slug, member }: { slug: string; member: MemberTools | null }) {
  const [r, setR] = useState<Loaded | null>(null);
  const [down, setDown] = useState<string | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    fetch(`/api/recipes/${encodeURIComponent(slug)}`).then(async (res) => {
      const d = await res.json().catch(() => ({}));
      if (res.status === 410 && d.takenDown) { setDown(d.title || ""); return; }
      if (!res.ok) throw new Error(d.error || "This recipe couldn't be opened.");
      setR(d.recipe); document.title = `${d.recipe.title} · ${APP_NAME}`;
    }).catch((e) => setErr(e.message));
  }, [slug]);
  const right = member ? <a className="rp-link" href="/today">Open the app</a> : <a className="rp-link" href="/recipes">All recipes</a>;
  if (down !== null) return <TakenDown title={down} right={right} />;
  if (err) return <div className="rp"><Top right={right} /><p className="rp-empty">{err} <a href="/recipes">All recipes</a></p><Foot /></div>;
  if (!r) return <div className="rp"><Top right={right} /><p className="rp-empty">Opening the recipe…</p></div>;
  return <RecipeView r={r} member={member} />;
}

export function RecipesPage({ member }: { member: boolean }) {
  const [list, setList] = useState<Loaded[] | null>(null);
  useEffect(() => { document.title = `Recipes · ${APP_NAME}`; fetch("/api/recipes").then((r) => r.json()).then((d) => setList(d.recipes ?? [])).catch(() => setList([])); }, []);
  return (
    <div className="rp">
      <Top right={member ? <a className="rp-link" href="/today">Open the app</a> : <a className="rp-link" href="/">Sign in</a>} />
      <h1 className="rp-title">Recipes</h1>
      <p className="rp-lines">Recipes from our kitchens. Every number is worked out from the recipe, weighed, not guessed from a photo.</p>
      {list === null && <p className="rp-empty">Opening…</p>}
      {list && !list.length && <p className="rp-empty">The first recipes are on their way.</p>}
      <div className="rp-grid">{(list ?? []).map((r) => <RecipeCard key={r.slug} r={r} />)}</div>
      {!member && (
        <section className="rp-card rp-invite"><b>Your amounts, for every recipe</b><p>In the app, Mealan sets how much of each recipe fits your goal and your day.</p><a className="pill pill-wide pill-primary" href="/#ask">Ask for an invite</a></section>
      )}
      <Foot />
    </div>
  );
}

export function RecipeCard({ r }: { r: PublicRecipe }) {
  return (
    <a className="rp-rcard" href={`/r/${r.slug}`}>
      {r.hasPhoto && <span className="rp-rphoto"><img src={`/r/${r.slug}/photo.jpg`} alt="" loading="lazy" />{r.rating === "daam" && <Daam />}</span>}
      <span className="rp-rtext">
        <b>{r.title}</b>
        <span>One {r.servingName}: {r.perServing.kcal} kcal · {g1(r.perServing.protein)} protein · PD {r.pd}</span>
        <small>{[bylineOf(r.author), fitsTicked(r).length ? `Fits best: ${fitsTicked(r).map((f) => f.name).join(", ")}` : "", r.minutes ? `${r.minutes} min` : ""].filter(Boolean).join(" · ")}</small>
      </span>
    </a>
  );
}
