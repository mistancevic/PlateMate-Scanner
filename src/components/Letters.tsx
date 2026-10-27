// DT108 (0.2.92) and DT113 (0.2.94): the four letters, F C Fi P, under a PD readout. 0.2.99 and 0.2.107 put grams and words
// into cells. DT129 (0.2.109, board Stories86; Milan 26 October 13:09 to 15:06): back to the first scanner's quick read, one
// line of four letters, f | c | fi- | P, and a tap opens the numbers: the plate against the planned meal (Plate, Planned, %),
// then what is in it (g, kcal, % plate, % day, a Total), read down a column. Per 100 kcal keeps the four sentences.
import { useState, type ReactNode } from "react";
import { lettersOf, letterLine, LETTER_ORDER, per100kcal, BANDS_NOTE, FIBRE_PER_1000_KCAL, type Rates, type Numbers } from "../letters";

// the quick line; open and setOpen when the table lives outside the block (the Plate), else the table follows inline
export function Letters({ n, rates, who, extra, open, setOpen, table }: { n: Numbers; rates: Rates; who: string; extra?: string | null; open?: boolean; setOpen?: (o: boolean) => void; table?: ReactNode }) {
  const [own, setOwn] = useState(false);
  const isOpen = open ?? own, flip = () => (setOpen ? setOpen(!isOpen) : setOwn(!isOpen));
  const ls = lettersOf(n, rates);
  return (
    <div className="readout-letters">
      <button type="button" className="letters-row" aria-expanded={isOpen} aria-label={`The four letters for ${who}: ${ls.join(" ")}. ${isOpen ? "Close" : "Open"} the numbers`} onClick={flip}>
        <span className="letters-line">{ls.map((l, k) => <span key={k} className="letters">{l}</span>)}</span>
        <span className="letters-go" aria-hidden="true">{isOpen ? "⌃" : "›"}</span>
      </button>
      {open === undefined && isOpen && (table ?? <NumbersTable n={n} rates={rates} extra={extra} weight={null} day={null} plan={null} />)}
    </div>
  );
}

export type PlanNumbers = { word: string; kcal: number; grams: number | null; protein: number };
export type DayNumbers = { kcal: number; protein: number; fats: number; carbs: number };
const KCAL_PER_G = { fats: 9, carbs: 4, fiber: 2, protein: 4 } as const;
const NAME = { fats: "Fat", carbs: "Carbs", fiber: "Fibre", protein: "Protein" } as const;
const fmt = (n: number) => (n >= 1000 ? Math.round(n).toLocaleString("en-US") : String(Math.round(n)));
const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : "");

// the numbers behind the line: the plate against the planned meal, then what is in it, each read down its column
export function NumbersTable({ n, rates, extra, weight, day, plan }: { n: Numbers; rates: Rates; extra?: string | null; weight: number | null; day: DayNumbers | null; plan: PlanNumbers | null }) {
  const [sentences, setSentences] = useState(false);
  const kcal = n.calories ?? 0;
  const dayOf = (m: (typeof LETTER_ORDER)[number]) => (!day ? 0 : m === "fiber" ? (FIBRE_PER_1000_KCAL * day.kcal) / 1000 : day[m]);
  const word = plan ? plan.word.charAt(0).toUpperCase() + plan.word.slice(1) : "";
  return (
    <section className="nt" aria-label="The numbers">
      <b className="nt-title">{day ? "Against your planned day" : "The numbers"}</b>
      {plan && (<>
        <small className="nt-sub">{word}, the plate and your plan</small>
        <div className="nt-grid nt-plan nt-head"><span /><span>Plate</span><span>Planned</span><span>%</span></div>
        {([["Energy", kcal, plan.kcal, "kcal"], ["Weight", weight, plan.grams, "g"], ["Protein", n.protein ?? 0, plan.protein, "g"]] as const).map(([l, a, b, u]) => (
          <div key={l} className="nt-grid nt-plan nt-row"><span>{l}</span><span><b>{a === null ? "?" : fmt(a)}</b> {u}</span><span>{b === null ? "-" : `${fmt(b)} ${u}`}</span><span>{a !== null && b !== null ? pct(a, b) : "-"}</span></div>
        ))}
        <small className="nt-sub">What is in it</small>
      </>)}
      <div className={`nt-grid nt-in nt-head${day ? "" : " nt-noday"}`}><span /><span>g</span><span>kcal</span><span>% plate</span>{day && <span>% day</span>}</div>
      {LETTER_ORDER.map((m) => {
        const g = n[m];
        return (
          <div key={m} className={`nt-grid nt-in nt-row${day ? "" : " nt-noday"}`}><span>{NAME[m]}</span>
            {g === null || g === undefined ? <><span>?</span><span /><span />{day && <span />}</>
              : <><span>{fmt(g)}</span><span>{fmt(g * KCAL_PER_G[m])}</span><span>{kcal > 0 ? Math.round(((g * KCAL_PER_G[m]) / kcal) * 100) : ""}</span>{day && <span>{dayOf(m) > 0 ? Math.round((g / dayOf(m)) * 100) : ""}</span>}</>}
          </div>
        );
      })}
      <div className={`nt-grid nt-in nt-row nt-total${day ? "" : " nt-noday"}`}><span>Total</span><span>{weight === null ? "" : fmt(weight)}</span><span>{fmt(kcal)}</span><span>100</span>{day && <span>{day.kcal > 0 ? Math.round((kcal / day.kcal) * 100) : ""}</span>}</div>
      <small className="nt-note">Read down a column.{plan ? ` The plate and your plan: the plate against the ${plan.word} you planned, % of the plan.` : ""} % plate: each one's share of the plate's energy.{day ? " % day: against your planned day." : ""}</small>
      <button type="button" className="link nt-more" aria-expanded={sentences} onClick={() => setSentences((x) => !x)}>Per 100 kcal {sentences ? "⌃" : "›"}</button>
      {sentences && <div className="letters-lines">{LETTER_ORDER.map((m) => <small key={m}>{letterLine(m, per100kcal(n[m], n.calories), rates[m])}</small>)}{extra && <small>{extra}</small>}<small className="muted">{BANDS_NOTE}</small></div>}
    </section>
  );
}
