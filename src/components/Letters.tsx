// DT108 (0.2.92) and DT113 (0.2.94): the four letters, F C Fi P, under a PD readout, with a line per letter on a tap.
// 0.2.99 (Milan 25 October 11:27, "a mess with macros listed"): one block, each letter with its grams under it, nothing
// else in the readout; sugars, saturates and salt live in the tap. DT128 (0.2.107, board Stories76, Version 2; Milan 15:51
// and 16:29): four filled cells across the block, the letter on top, the grams on one line (never broken), the word under
// it (fat, high); against your day under the cells.
import { useState } from "react";
import { lettersOf, letterLine, letterWord, LETTER_ORDER, per100kcal, BANDS_NOTE, type Rates, type Numbers } from "../letters";

export function Letters({ n, rates, who, grams = true, extra }: { n: Numbers; rates: Rates; who: string; grams?: boolean; extra?: string | null }) {
  const [open, setOpen] = useState(false);
  const ls = lettersOf(n, rates);
  const g = (m: (typeof LETTER_ORDER)[number]) => { const v = n[m]; return v === null || v === undefined ? "?" : `${Math.round(v)} g`; };
  return (
    <div className="readout-letters">
      <button type="button" className="letters-row" aria-expanded={open} aria-label={`The four letters for ${who}: ${ls.join(" ")}`} onClick={() => setOpen((o) => !o)}>
        <span className="letters-grid">{LETTER_ORDER.map((m, k) => <span key={m} className="letter-cell"><span className="letters">{ls[k]}</span>{grams && <small className="letter-g">{g(m)}</small>}{grams && <small className="letter-word">{letterWord(m, per100kcal(n[m], n.calories), rates[m])}</small>}</span>)}</span>
        <small className="letters-note">against your day</small>
      </button>
      {open && <div className="letters-lines">{LETTER_ORDER.map((m) => <small key={m}>{letterLine(m, per100kcal(n[m], n.calories), rates[m])}</small>)}{extra && <small>{extra}</small>}<small className="muted">{BANDS_NOTE}</small></div>}
    </div>
  );
}
