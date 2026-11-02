// DT214 v2 (0.3.53, board Stories162): a recipe collects its cooks. Each time you cook it, the meal's card keeps the photos and
// the answers: how often it went as the steps said, how it tasted, how it carried you.
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
