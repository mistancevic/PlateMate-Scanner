import { useState } from "react";
import { calculate, canCalculate, isMinor, restingBurn, schofieldBand, ageOf, type Formula, type Personal } from "../personal";

// Resting burn: the formula (canvas board TW, F1 and F2, Milan 13 October 2026). Three published formulas side by side with
// this person's own resting burn from each. From 0.2.5+r20 (board FX, G1a) it sits in the goal calculator as step 2: the
// pick is part of the draft and is saved with Apply from. A coach's pin wins and can't be changed here.
export const FORMULA_NAME: Record<Formula, string> = { mifflin: "Mifflin St Jeor", katch: "Katch McArdle", schofield: "Schofield" };
export function FormulaCard({ personal: d, pinned, coachLabel, value, onPick }: { personal: Personal; pinned: Formula | null; coachLabel: string; value: Formula | "auto"; onPick: (f: Formula | "auto") => void }) {
  const [about, setAbout] = useState(false);
  if (!canCalculate(d) || isMinor(d)) return null;
  const on: Formula | "auto" = pinned ?? value;
  const n = (f: Formula) => restingBurn(d, f);
  const kcal = (x: number | null) => (x === null ? null : `${x.toLocaleString("en")} kcal at rest`);
  const age = ageOf(d)!;
  const pick = (f: Formula | "auto") => { if (!pinned) onPick(f); };
  const opts: { id: Formula | "auto"; name: string; num: string; hint: string; off?: boolean }[] = [
    { id: "auto", name: "Automatic", num: d.bodyFatPct ? "Katch McArdle now" : "Mifflin St Jeor now", hint: d.bodyFatPct ? "From your body fat." : "Katch McArdle once you add your body fat." },
    { id: "mifflin", name: "Mifflin St Jeor", num: kcal(n("mifflin"))!, hint: "Sex, age, height, weight." },
    n("katch") === null ? { id: "katch", name: "Katch McArdle", num: "Needs body fat", hint: "Add your body fat under You.", off: true } : { id: "katch", name: "Katch McArdle", num: kcal(n("katch"))!, hint: "Lean mass, from your body fat." },
    { id: "schofield", name: "Schofield", num: kcal(n("schofield"))!, hint: `Sex, weight, age band ${schofieldBand(age)}.` },
  ];
  // the difference in plain numbers: at rest, then times the everyday (the same factor every formula gets)
  const s = n("schofield")!, m = n("mifflin")!;
  const lifeOn = (f: Formula) => calculate({ ...d, formula: f }, "maintain", null)?.tdee ?? 0;
  const rest = s - m, day = Math.round((lifeOn("schofield") - lifeOn("mifflin")) / 10) * 10;
  const diff = rest === 0 ? "Schofield and Mifflin St Jeor give the same resting burn for you." : `Schofield gives ${Math.abs(rest)} kcal ${rest > 0 ? "more" : "less"} at rest than Mifflin St Jeor. With your everyday that is about ${Math.abs(day)} kcal ${rest > 0 ? "more" : "less"} a day, before training.`;
  return (
    <>
      <div className="seg-head"><b>Resting burn: the formula</b><small>Three published formulas. Pick one, and all your numbers follow.</small></div>
      <section className="card seg formula-card">
        <div className="opt-grid" role="group" aria-label="Resting burn formula">
          {opts.map((x) => (
            <button type="button" key={x.id} className={`opt ${on === x.id ? "on" : ""}`} aria-pressed={on === x.id} disabled={x.off || !!pinned} onClick={() => pick(x.id)}>
              <b>{x.name}</b><small className="opt-num">{x.num}</small><small>{x.hint}</small>
            </button>
          ))}
        </div>
        {pinned && <small className="setting-hint">Set by {coachLabel}. Ask {coachLabel} to change it.</small>}
        <small className="setting-hint">{diff}</small>
        <button type="button" className="link formula-about" aria-expanded={about} onClick={() => setAbout((v) => !v)}>{about ? "Close About the three formulas" : "About the three formulas ›"}</button>
        {about && (
          <div className="formula-text">
            <p><b>Mifflin St Jeor (1990).</b> From sex, age, height and weight. Made from about 500 adults aged 19 to 78. In reviews it lands closest to the measured burn for most adults, so it is the default.</p>
            <p><b>Katch McArdle.</b> From lean mass: your weight without the body fat. Sex and age don't enter. Good for lean, muscular people, when the body fat is measured well.</p>
            <p><b>Schofield (1985).</b> The formula FAO, WHO and UNU use. From sex and weight, in three adult age bands: 18 to 30, 30 to 60, over 60. Made from about 7,000 measurements in many countries. Height doesn't enter. It often gives a little more than Mifflin St Jeor.</p>
            <p><b>What changes.</b> Only the resting burn. Your everyday, your training, your goal and your protein stay the same.</p>
          </div>
        )}
      </section>
    </>
  );
}

