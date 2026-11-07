import { numLocale, w } from "../words";
import { useState } from "react";
import { calculate, canCalculate, isMinor, restingBurn, schofieldBand, ageOf, type Formula, type Personal } from "../personal";
import { longDate, spanOf, type Measured, type MeasuredFixed } from "../measured";

// Resting burn: the formula (canvas board TW, F1 and F2, Milan 13 October 2026). Three published formulas side by side with
// this person's own resting burn from each. From 0.2.5+r20 (board FX, G1a) it sits in the goal calculator as step 2: the
// pick is part of the draft and is saved with Apply from. A coach's pin wins and can't be changed here.
export const FORMULA_NAME: Record<Formula, string> = { get mifflin() { return w("formula.mifflinStJeor2"); }, get katch() { return w("formula.katchMcardle2"); }, schofield: "Schofield", get data() { return w("formula.fromYourData"); } };
// From 0.2.7 (board FT, FT5): a fifth choice, From your data, wide under the four: the whole day measured, not the burn at rest.
// Greyed until the measured burn is ready; left out for anyone who sees no weigh-ins (measured is null then).
export const fixedOf = (m: Measured | null | undefined): MeasuredFixed | null => (m?.ready && m.kcal ? { kcal: m.kcal, from: m.from, to: m.to, at: new Date().toISOString() } : null);
export function FormulaCard({ personal: d, pinned, coachLabel, value, onPick, measured }: { personal: Personal; pinned: Formula | null; coachLabel: string; value: Formula | "auto"; onPick: (f: Formula | "auto") => void; measured?: Measured | null }) {
  const [about, setAbout] = useState(false);
  if (!canCalculate(d) || isMinor(d)) return null;
  const on: Formula | "auto" = pinned ?? value;
  const n = (f: Formula) => restingBurn(d, f);
  const kcal = (x: number | null) => (x === null ? null : w("formula.kcalAtRest", { kcal: x.toLocaleString(numLocale()) }));
  const age = ageOf(d)!;
  const pick = (f: Formula | "auto") => { if (!pinned) onPick(f); };
  const opts: { id: Formula | "auto"; name: string; num: string; hint: string; off?: boolean }[] = [
    { id: "auto", name: w("formula.automatic"), num: d.bodyFatPct ? w("formula.katchMcardleNow") : w("formula.mifflinStJeorNow"), hint: d.bodyFatPct ? w("formula.fromYourBodyFat") : w("formula.katchMcardleOnceYouAdd") },
    { id: "mifflin", name: w("formula.mifflinStJeor2"), num: kcal(n("mifflin"))!, hint: w("formula.sexAgeHeightWeight") },
    n("katch") === null ? { id: "katch", name: w("formula.katchMcardle2"), num: w("formula.needsBodyFat"), hint: w("formula.addYourBodyFatUnder"), off: true } : { id: "katch", name: w("formula.katchMcardle2"), num: kcal(n("katch"))!, hint: w("formula.leanMassFromYourBody") },
    { id: "schofield", name: "Schofield", num: kcal(n("schofield"))!, hint: w("formula.schofieldHint", { band: schofieldBand(age) }) },
  ];
  // the difference in plain numbers: at rest, then times the everyday (the same factor every formula gets)
  const s = n("schofield")!, m = n("mifflin")!;
  const lifeOn = (f: Formula) => calculate({ ...d, formula: f }, "maintain", null)?.tdee ?? 0;
  const rest = s - m, day = Math.round((lifeOn("schofield") - lifeOn("mifflin")) / 10) * 10;
  const fixed = d.measuredUse && on === "data" ? d.measuredUse : fixedOf(measured);
  const shapeName = d.bodyFatPct ? w("formula.katchMcardle2") : w("formula.mifflinStJeor2");
  const dataGap = fixed ? fixed.kcal - (calculate({ ...d, formula: d.bodyFatPct ? "katch" : "mifflin" }, "maintain", null)?.kcal ?? fixed.kcal) : 0;
  const dataDiff = w(dataGap < 0 ? "formula.dataLess" : "formula.dataMore", { kcal: Math.abs(dataGap), formula: shapeName });
  const diff = on === "data" && fixed ? dataDiff : rest === 0 ? w("formula.schofieldAndMifflinStJeor") : w(rest > 0 ? "formula.schofieldMore" : "formula.schofieldLess", { rest: Math.abs(rest), day: Math.abs(day) });
  return (
    <>
      {measured ? <div className="seg-head"><b>{w("formula.yourBurnAFormulaOr")}</b><small>{w("formula.threePublishedFormulasOrYour")}</small></div>
        : <div className="seg-head"><b>{w("formula.restingBurnTheFormula")}</b><small>{w("formula.threePublishedFormulasPickOne")}</small></div>}
      <section className="card seg formula-card">
        <div className="opt-grid" role="group" aria-label={w("formula.restingBurnFormula")}>
          {opts.map((x) => (
            <button type="button" key={x.id} className={`opt ${on === x.id ? "on" : ""}`} aria-pressed={on === x.id} disabled={x.off || !!pinned} onClick={() => pick(x.id)}>
              <b>{x.name}</b><small className="opt-num">{x.num}</small><small>{x.hint}</small>
            </button>
          ))}
        </div>
        {measured && (
          <button type="button" className={`opt opt-wide ${on === "data" ? "on" : ""}`} aria-pressed={on === "data"} disabled={!fixed || !!pinned} onClick={() => pick("data")}>
            <b>{w("formula.fromYourData")}</b>
            {fixed ? <><small className="opt-num">{w("formula.kcalAllIn", { kcal: fixed.kcal.toLocaleString(numLocale()) })}</small><small>{w("formula.whatYouAte", { span: spanOf(fixed.from, fixed.to) })}</small></>
              : <><small className="opt-num">{w("formula.notEnoughDataYet")}</small><small>{measured.readyOn ? w("formula.readyOn", { date: longDate(measured.readyOn) }) : w("formula.needsFullDaysAndWeigh")}</small></>}
          </button>
        )}
        {pinned && <small className="setting-hint">{w("formula.setByCoach", { coach: coachLabel })}</small>}
        <small className="setting-hint">{diff}</small>
        <button type="button" className="link formula-about" aria-expanded={about} onClick={() => setAbout((v) => !v)}>{about ? w("formula.closeAboutTheThreeFormulas") : w("formula.aboutTheThreeFormulas")}</button>
        {about && (
          <div className="formula-text">
            <p><b>{w("formula.mifflinStJeor")}</b> {w("formula.fromSexAgeHeightAnd")}</p>
            <p><b>{w("formula.katchMcardle")}</b> {w("formula.fromLeanMassYourWeight")}</p>
            <p><b>{w("formula.schofield")}</b> {w("formula.theFormulaFaoWhoAnd")}</p>
            <p><b>{w("formula.whatChanges")}</b> {w("formula.onlyTheRestingBurnYour")}</p>
          </div>
        )}
      </section>
    </>
  );
}

