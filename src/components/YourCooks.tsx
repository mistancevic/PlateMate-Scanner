// DT214 v2 (0.3.53, board Stories162): a recipe collects its cooks. Each time you cook it, the meal's card keeps the photos and
// the answers: how often it went as the steps said, how it tasted, how it carried you.
import { useState } from "react";
import type { Feedback, Meal } from "../pilot";
import { cardsOfRecipe } from "../carry";
import { CARRY_WORDS } from "../carry";
const TASTES = ["DaaM good", "Good", "Not really"];
export const cooksOf = (meal: Meal, cards: Feedback[]) => cardsOfRecipe(meal, cards).filter((f) => f.status === "eaten").sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
// the photos taken on step k while cooking this recipe, newest first
export function cookPhotosFor(meal: Meal, cards: Feedback[], k: number): string[] {
  const out: string[] = [];
  for (const f of cooksOf(meal, cards)) (f.photoSteps ?? []).forEach((s, i) => { const x = f.photos?.[i]; if (s === k && x && !out.includes(x)) out.push(x); });
  return out;
}
export function YourCooks({ meal, cards }: { meal: Meal; cards: Feedback[] }) {
  const cs = cooksOf(meal, cards);
  if (!cs.length) return null;
  const n = cs.length, last = new Date(cs[0].createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
  const photos = cs.map((f) => f.photo ?? f.photos?.[f.photos.length - 1]).filter(Boolean).slice(0, 6) as string[];
  const prep = cs.filter((f) => f.prep), asSaid = prep.filter((f) => f.prep!.went === "as").length;
  const tastes = TASTES.map((t) => [t, cs.filter((f) => f.taste === t).length] as const).filter(([, k]) => k > 0);
  const carried = cs.filter((f) => f.carry);
  const top = (["light", "fine", "heavy"] as const).map((h) => [h, carried.filter((f) => f.carry!.how === h).length] as const).sort((a, b) => b[1] - a[1])[0];
  return (
    <section className="card rq-cooks" aria-label="Your cooks">
      <b>Your cooks</b>
      <small className="muted">{n === 1 ? "Once" : `${n} times`}, the last on {last}</small>
      {photos.length > 0 && <div className="rc-photos">{photos.map((x, i) => <img key={i} src={x} alt="" />)}</div>}
      <div className="rc-lines">
        {prep.length > 0 && <div>As the steps say: <b>{asSaid} of {prep.length}</b></div>}
        {tastes.length > 0 && <div>Tasted: <b>{tastes.map(([t, k]) => `${t} ${k}`).join(", ")}</b></div>}
        {carried.length > 0 && top && top[1] > 0 && <div>Carried you: <b>{CARRY_WORDS[top[0]].toLowerCase()} {top[1]} of {carried.length}</b></div>}
      </div>
      <small className="muted">Each time you cook it, the cook keeps the photos and the answers. The best photo of a step can become the step's photo here.</small>
    </section>
  );
}

// DT225 v2 (0.3.61, board Stories166; Coach Milan 2 November 19:15 to 20:34): every time you ate it, at the end of the recipe,
// under its buttons. One row a meal of this recipe, cooked or not: when and how, how much in the recipe's words, the taste,
// how it carried you, your words. Only you see it.
const plural = (n: number, unit: string) => (n === 1 ? unit.replace(/(?<=[^s])s$/, "") : unit);
const gramsOf = (items: { grams: number }[]) => items.reduce((a, i) => a + (i.grams || 0), 0);
export function eatRow(meal: Meal, f: Feedback, now = new Date()) {
  const at = new Date(f.createdAt), day = new Date(at.getFullYear(), at.getMonth(), at.getDate()), today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const ago = Math.round((today.getTime() - day.getTime()) / 86_400_000);
  const hm = at.toTimeString().slice(0, 5);
  const date = ago === 0 ? "Today" : ago === 1 ? "Yesterday" : at.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const how = f.prep || f.photoSteps?.length ? "cooked" : /, the other (half|portion|\d+ portions)/.test(f.meal?.title ?? "") ? "the rest of a batch" : "logged";
  const g = Math.round(gramsOf(f.meal?.items ?? [])), whole = gramsOf(meal.items), n = meal.makes?.n ?? 1, unit = meal.makes?.unit || "portions";
  let amount = `${g} g`;
  if (whole > 0 && g > 0) {
    const k = (g / whole) * n;
    if (n > 1 && unit !== "portions") amount = `${Math.max(1, Math.round(k))} ${plural(Math.max(1, Math.round(k)), unit)}`;
    else { const r = g / (whole / n); amount = r > 0.85 && r < 1.15 ? `1 portion, ${g} g` : r > 0.4 && r < 0.6 ? `Half a portion, ${g} g` : r >= 1.85 && r <= 2.15 ? `2 portions, ${g} g` : `${g} g`; }
  }
  return { when: `${date}, ${hm} · ${how}`, amount, taste: f.taste || "", carry: f.carry ? CARRY_WORDS[f.carry.how].toLowerCase() : "", words: (f.notes || "").trim(), photo: f.photo ?? f.photos?.[f.photos.length - 1] ?? null };
}
export function EatLog({ meal, cards }: { meal: Meal; cards: Feedback[] }) {
  const all = cooksOf(meal, cards);
  const [open, setOpen] = useState(false);
  if (!all.length) return null;
  const rows = open ? all : all.slice(0, 3);
  return (
    <section className="card rq-eats" aria-label="Every time you ate it">
      <b>Every time you ate it</b>
      <small className="muted">Only you see this. Your coach sees a meal you share.</small>
      {rows.map((f) => { const r = eatRow(meal, f); return (
        <div key={f.id} className="re-row">
          {r.photo ? <img src={r.photo} alt="" /> : <span className="re-none" aria-hidden="true">🍽️</span>}
          <span className="re-words"><b>{r.when}</b><span>{[r.amount, r.taste, r.carry ? `carried you: ${r.carry}` : ""].filter(Boolean).join(" · ")}</span>{r.words && <i>“{r.words}”</i>}</span>
        </div>); })}
      {all.length > 3 && <button className="link re-more" onClick={() => setOpen(!open)}>{open ? "Fewer" : `All ${all.length} ›`}</button>}
    </section>
  );
}
