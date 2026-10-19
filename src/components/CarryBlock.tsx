// R20 (0.2.48, board RS19, R20c): the meal's page, How it carries you. Every answer for this recipe with its moment, the
// meals not answered yet, and Chef Mealan's read once two answers agree. Answers from before the foods changed are marked.
import type { Feedback, Meal } from "../pilot";
import { CARRY_COUNTED, CARRY_WORDS, carryOf, momentText, timesWord } from "../carry";
import { CHEF_NAME } from "./Mark";

export function CarryBlock({ meal, cards }: { meal: Meal; cards: Feedback[] }) {
  const c = carryOf(meal, cards);
  if (!c.rows.some((r) => r.how)) return null;
  const byId = new Map(cards.map((f) => [f.id, f]));
  const which = (id: string) => { const f = byId.get(id); return f?.slot?.name ?? f?.which ?? ""; };
  const answered = c.rows.filter((r) => r.how), open = c.rows.filter((r) => !r.how).slice(0, 3);
  return (
    <section className="card rq-carry" aria-label="How it carries you">
      <div className="card-top"><span>How it carries you</span><small>eaten {timesWord(c.eaten)}</small></div>
      {answered.slice(0, 8).map((r) => (
        <small key={r.id} className={`carry-row ${r.before ? "before" : ""}`}><b>{CARRY_WORDS[r.how!]}</b>: {momentText(r.at, r.moment, which(r.id))}{r.before ? " · before you changed the foods" : ""}</small>
      ))}
      {open.length > 0 && <small className="carry-row">Not answered yet: {open.map((r) => momentText(r.at, undefined, which(r.id)).replace(/^./, (x) => x.toLowerCase())).join("; ")}</small>}
      {c.read === "heavy" && <><small className="carry-read carry-heavy">Heavy for you</small>
        <small>{CHEF_NAME}'s read: it leaves you heavy, tired. When another meal fits as well, he picks that one first. It is still yours to pick.</small></>}
      {c.read === "light" && <><small className="carry-read carry-light">Light for you</small>
        <small>{CHEF_NAME}'s read: it keeps you light. When it fits as well as another meal, he picks it first.</small></>}
      {!c.read && <small className="carry-read" style={{ fontWeight: 400 }}>{CHEF_NAME} reads it once two answers agree. The last {CARRY_COUNTED} count.</small>}
    </section>
  );
}
