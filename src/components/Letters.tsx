// DT108 (0.2.92) and DT113 (0.2.94): the four letters, F C Fi P, under a PD readout, with a line per letter on a tap.
import { useState } from "react";
import { lettersOf, letterLine, LETTER_ORDER, per100kcal, BANDS_NOTE, type Rates, type Numbers } from "../letters";

export function Letters({ n, rates, who }: { n: Numbers; rates: Rates; who: string }) {
  const [open, setOpen] = useState(false);
  const ls = lettersOf(n, rates);
  return (
    <div className="readout-letters">
      <button type="button" className="letters-row" aria-expanded={open} aria-label={`The four letters for ${who}: ${ls.join(" ")}`} onClick={() => setOpen((o) => !o)}>
        <span className="letters">{ls.join("  ")}</span><small>against your day</small>
      </button>
      {open && <div className="letters-lines">{LETTER_ORDER.map((m) => <small key={m}>{letterLine(m, per100kcal(n[m], n.calories), rates[m])}</small>)}<small className="muted">{BANDS_NOTE}</small></div>}
    </div>
  );
}
