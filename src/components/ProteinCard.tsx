import { dec, w } from "../words";
import { useState } from "react";
import type { Calc } from "../personal";

// Your protein, and why it's a range (approved 6 October 2026, canvas board G2).
// The bar shows the range for this person; the mark shows where Chef Mealan put them, and the text says why.
export function ProteinCard({ c, open: startOpen = false }: { c: Calc; open?: boolean }) {
  const [open, setOpen] = useState(startOpen);
  const span = c.proteinMax - c.proteinMin;
  const at = span > 0 ? Math.min(100, Math.max(0, ((c.protein - c.proteinMin) / span) * 100)) : 50;
  const kg = (x: number) => dec(x, 1).replace(/[.,]0$/, "");
  return (
    <section className="card protein-card">
      <div className="protein-top"><b>{c.protein} g</b><span>{w("protein.ofProteinADay")}</span></div>
      <div className="protein-bar" aria-hidden="true"><span className="protein-mark" style={{ left: `${at}%` }} /></div>
      <div className="protein-ends"><span>{c.proteinMin} g</span><span>{c.proteinMax} g</span></div>
      <p className="protein-line">
        {w(c.trains ? "protein.rangeTrains" : "protein.rangeNotYet", { min: c.proteinMin, max: c.proteinMax, lo: kg(c.proteinLo), hi: kg(c.proteinHi) })}
        {" "}{c.proteinWhy.length ? w("protein.chefMealanPutYouAt") : w("protein.chefMealanPutYouIn")}
      </p>
      {c.proteinWhy.length > 0 && <ul className="protein-why">{c.proteinWhy.map((why) => <li key={why}>{why}</li>)}</ul>}
      <button type="button" className="link" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? w("protein.lessAboutProtein") : w("protein.whyARangeAndHow")}</button>
      {open && (
        <div className="protein-more">
          <b>{w("protein.whyARangeNotOne")}</b>
          <p>{w("protein.studiesOnPeopleWhoTrain")}</p>
          <b>{w("protein.whatMovesYouToThe")}</b>
          <p>{w("protein.threeThingsLosingFatBecause")}</p>
          <b>{w("protein.itSADailyTotal")}</b>
          <p>Your body uses protein best in portions of about 0.4 g per kg, which for you is about {c.perMeal} g, spread over three to five meals. That's what each plate is fitted to.</p>
          <b>{w("protein.proteinQuality")}</b>
          <p>{w("protein.meatFishEggsAndDairy")}</p>
          <small>{w("protein.sourcesMortonEtAlProtein")}</small>
        </div>
      )}
    </section>
  );
}
