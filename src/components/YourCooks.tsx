// DT214 v2 (0.3.53, board Stories162): a recipe collects its cooks. Each time you cook it, the meal's card keeps the photos and
// the answers: how often it went as the steps said, how it tasted, how it carried you.
import { w, wn, dateText } from "../words";
import { useEffect, useRef, useState } from "react";
import type { Feedback, Meal } from "../pilot";
import { cardsOfRecipe } from "../carry";
import { CARRY_WORDS } from "../carry";
// the tastes as kept on a meal (English values); each is shown in the app's language
const TASTES = ["DaaM good", "Good", "Not really"];
export const tasteWord = (t: string) => (t === "Not really" ? w("yourcooks.notReally") : t === "Good" ? w("yourcooks.good") : t === "DaaM good" ? w("yourcooks.daamGood") : t);
export const cooksOf = (meal: Meal, cards: Feedback[]) => cardsOfRecipe(meal, cards).filter((f) => f.status === "eaten").sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
// the photos taken on step k while cooking this recipe, newest first
export function cookPhotosFor(meal: Meal, cards: Feedback[], k: number): string[] {
  const out: string[] = [];
  for (const f of cooksOf(meal, cards)) (f.photoSteps ?? []).forEach((s, i) => { const x = f.photos?.[i]; if (s === k && x && !out.includes(x)) out.push(x); });
  return out;
}
export function YourCooks({ meal, cards, onOpen }: { meal: Meal; cards: Feedback[]; onOpen?: (f: Feedback) => void }) {
  const cs = cooksOf(meal, cards);
  if (!cs.length) return null;
  const n = cs.length, last = dateText(new Date(cs[0].createdAt), { day: "numeric", month: "long" });
  const photos = cs.map((f) => ({ f, src: f.photo ?? f.photos?.[f.photos.length - 1] })).filter((x) => !!x.src).slice(0, 6) as { f: Feedback; src: string }[];
  const prep = cs.filter((f) => f.prep), asSaid = prep.filter((f) => f.prep!.went === "as").length;
  const tastes = TASTES.map((t) => [t, cs.filter((f) => f.taste === t).length] as const).filter(([, k]) => k > 0);
  const carried = cs.filter((f) => f.carry);
  const top = (["light", "fine", "heavy"] as const).map((h) => [h, carried.filter((f) => f.carry!.how === h).length] as const).sort((a, b) => b[1] - a[1])[0];
  return (
    <section className="card rq-cooks" aria-label={w("yourcooks.yourCooks")}>
      <b>{w("yourcooks.yourCooks")}</b>
      <small className="muted">{wn("yourcooks.timesTheLastOn", n, { date: last })}</small>
      {/* DT282 (0.3.135, board Stories209): a tap on a cook's photo opens that cook */}
      {photos.length > 0 && <div className="rc-photos">{photos.map((x, i) => onOpen
        ? <button key={i} type="button" className="rc-photo" aria-label={w("yourcooks.openCook", { date: dateText(new Date(x.f.createdAt), { day: "numeric", month: "long" }) })} onClick={() => onOpen(x.f)}><img src={x.src} alt="" /></button>
        : <img key={i} src={x.src} alt="" />)}</div>}
      <div className="rc-lines">
        {prep.length > 0 && <div>{w("yourcooks.asTheStepsSay")} <b>{w("yourcooks.nOfTotal", { n: asSaid, total: prep.length })}</b></div>}
        {tastes.length > 0 && <div>{w("yourcooks.tasted")} <b>{tastes.map(([t, k]) => `${tasteWord(t)} ${k}`).join(", ")}</b></div>}
        {carried.length > 0 && top && top[1] > 0 && <div>{w("yourcooks.carriedYou")} <b>{CARRY_WORDS[top[0]].toLowerCase()} {w("yourcooks.nOfTotal", { n: top[1], total: carried.length })}</b></div>}
      </div>
      <small className="muted">{onOpen && photos.length > 0 ? w("yourcooks.tapToOpen") : w("yourcooks.eachTimeYouCookIt")}</small>
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
  const date = ago === 0 ? w("yourcooks.today") : ago === 1 ? w("yourcooks.yesterday") : dateText(at, { weekday: "long", day: "numeric", month: "long" });
  const how = f.prep || f.photoSteps?.length ? w("yourcooks.cooked") : /, the other (half|portion|\d+ portions)/.test(f.meal?.title ?? "") ? w("yourcooks.theRestOfABatch") : w("yourcooks.logged");
  const g = Math.round(gramsOf(f.meal?.items ?? [])), whole = gramsOf(meal.items), n = meal.makes?.n ?? 1, unit = meal.makes?.unit || "portions";
  let amount = `${g} g`;
  if (whole > 0 && g > 0) {
    const k = (g / whole) * n;
    if (n > 1 && unit !== "portions") amount = `${Math.max(1, Math.round(k))} ${plural(Math.max(1, Math.round(k)), unit)}`;
    else { const r = g / (whole / n); amount = r > 0.85 && r < 1.15 ? w("yourcooks.onePortion", { g }) : r > 0.4 && r < 0.6 ? w("yourcooks.halfAPortion", { g }) : r >= 1.85 && r <= 2.15 ? w("yourcooks.twoPortions", { g }) : `${g} g`; }
  }
  return { when: `${date}, ${hm} · ${how}`, amount, taste: f.taste || "", carry: f.carry ? CARRY_WORDS[f.carry.how].toLowerCase() : "", words: (f.notes || "").trim(), photo: f.photo ?? f.photos?.[f.photos.length - 1] ?? null };
}
// DT284 (0.3.138, board Stories211): each row opens its meal
export function EatLog({ meal, cards, onOpen, changedId = null }: { meal: Meal; cards: Feedback[]; onOpen?: (f: Feedback) => void; changedId?: string | null }) {
  const all = cooksOf(meal, cards);
  const [open, setOpen] = useState(false);
  // DT284 v5 (0.3.140): after Save changes, the changed row is shown, marked, and scrolled to
  const mark = useRef<HTMLDivElement | null>(null);
  useEffect(() => { if (changedId && mark.current) try { mark.current.scrollIntoView({ block: "center" }); } catch { /* nothing to scroll */ } }, [changedId]);
  if (!all.length) return null;
  const late = changedId ? all.findIndex((f) => f.id === changedId) >= 3 : false;
  const rows = open || late ? all : all.slice(0, 3);
  return (
    <section className="card rq-eats" aria-label={w("yourcooks.everyTimeYouAteIt")}>
      <b>{w("yourcooks.everyTimeYouAteIt")}</b>
      <small className="muted">{w("yourcooks.onlyYouSeeThisYour")}</small>
      {rows.map((f) => { const r = eatRow(meal, f); const isNew = f.id === changedId; const inner = <>
          {r.photo ? <img src={r.photo} alt="" /> : <span className="re-none" aria-hidden="true">🍽️</span>}
          <span className="re-words"><b>{r.when}</b><span>{[r.amount, r.taste, r.carry ? w("yourcooks.carriedYouHow", { how: r.carry }) : ""].filter(Boolean).join(" · ")}</span>{r.words && <i>“{r.words}”</i>}</span></>;
        const row = onOpen
          ? <button key={f.id} type="button" className={`re-row re-open${isNew ? " re-changed" : ""}`} aria-label={w("yourcooks.openMeal", { date: r.when })} onClick={() => onOpen(f)}>{inner}<span className="re-go" aria-hidden="true">›</span></button>
          : <div key={f.id} className="re-row">{inner}</div>;
        return isNew ? <div key={f.id} ref={mark}>{row}<p className="re-changed-note" role="status">{w("yourcooks.changedStillOneMeal", { time: new Date(f.createdAt).toTimeString().slice(0, 5) })}</p></div> : row; })}
      {all.length > 3 && <button className="link re-more" onClick={() => setOpen(!open)}>{open ? w("yourcooks.fewer") : w("yourcooks.allN", { n: all.length })}</button>}
    </section>
  );
}
