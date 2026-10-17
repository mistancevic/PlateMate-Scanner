import { tempsIn } from "../units";
import { headingOf } from "../stepsState";
import { fmt } from "../ui";
import { CountAmount, isCounted } from "./CountAmount";
import type { Ingredient } from "../pilot";

// The original's steps as steps (0.2.25, canvas board RP, RP1 to RP1c): numbered, one a line, the page's headings in bold,
// temperatures in your unit. For you only, word for word.
export function OriginalSteps({ steps }: { steps: string[] }) {
  return (
    <ol className="rp-steps rp-orig">{steps.map((x, k) => {
      const t = tempsIn(x), h = headingOf(t);
      return <li key={k}><span>{k + 1}</span><div className="rp-step-text">{h ? <><b>{h.head}.</b> {h.rest}</> : t}</div></li>;
    })}</ol>
  );
}
// the line that says which case it is: the original works as it is (ok), or what differs (warn)
export const StepsHint = ({ tone, children }: { tone: "ok" | "warn"; children: React.ReactNode }) => <div className={`st-hint ${tone}`} role="note">{tone === "ok" ? "✓ " : ""}{children}</div>;

// The foods for what you make (0.2.27, board PF, A7 and M4): the recipe page's Foods card, the same design, at the amounts you
// make, with the parts as headings; counted foods as a count; a side, when there is one, on its own line under them
export function FoodsList({ title, items, side }: { title: string; items: Ingredient[]; side?: { name: string; grams: number } | null }) {
  const shown = items.filter((i) => i.grams > 0);
  return (
    <section className="card rq-foods mk-foods" aria-label={title}>
      <b>{title}</b>
      {shown.map((it, k) => [
        it.part && (k === 0 || shown[k - 1].part !== it.part) ? <div className="rq-part" key={`h${k}`}>{it.part}</div> : null,
        <div className="sheet-row rq-food" key={it.id}><small>{it.food.name}</small>{isCounted(it) ? <CountAmount item={it} editable={false} onGrams={() => {}} /> : <b>{fmt(it.grams, 0)} g</b>}</div>,
      ])}
      {side && <><div className="rq-part">On the side</div><div className="sheet-row rq-food"><small>{side.name}</small><b>{fmt(side.grams, 0)} g</b></div></>}
    </section>
  );
}
