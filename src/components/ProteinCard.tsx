import { useState } from "react";
import type { Calc } from "../personal";

// Your protein, and why it's a range (approved 6 October 2026, canvas board G2).
// The bar shows the range for this person; the mark shows where Chef Mealan put them, and the text says why.
export function ProteinCard({ c, open: startOpen = false }: { c: Calc; open?: boolean }) {
  const [open, setOpen] = useState(startOpen);
  const span = c.proteinMax - c.proteinMin;
  const at = span > 0 ? Math.min(100, Math.max(0, ((c.protein - c.proteinMin) / span) * 100)) : 50;
  const kg = (x: number) => x.toFixed(1).replace(/\.0$/, "");
  return (
    <section className="card protein-card">
      <div className="protein-top"><b>{c.protein} g</b><span>of protein a day</span></div>
      <div className="protein-bar" aria-hidden="true"><span className="protein-mark" style={{ left: `${at}%` }} /></div>
      <div className="protein-ends"><span>{c.proteinMin} g</span><span>{c.proteinMax} g</span></div>
      <p className="protein-line">
        Your range is {c.proteinMin} to {c.proteinMax} g a day: {kg(c.proteinLo)} to {kg(c.proteinHi)} g for every kg you weigh, {c.trains ? "because you train regularly" : "because you don't train regularly yet"}.
        {" "}{c.proteinWhy.length ? "Chef Mealan put you at the top of it:" : "Chef Mealan put you in the middle."}
      </p>
      {c.proteinWhy.length > 0 && <ul className="protein-why">{c.proteinWhy.map((w) => <li key={w}>{w}</li>)}</ul>}
      <button type="button" className="link" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Less about protein" : "Why a range, and how to eat it ›"}</button>
      {open && (
        <div className="protein-more">
          <b>Why a range, not one number</b>
          <p>Studies on people who train show that muscle keeps growing with more protein up to about 1.6 g per kg a day, and that almost nobody gains more above 2.2 g. Anywhere in that range works. The bottom is the minimum to aim for every day; going above the top doesn't build more muscle.</p>
          <b>What moves you to the top</b>
          <p>Three things: losing fat, because more protein helps you keep your muscle while you eat less; eating mostly plant protein, because the body uses it a little less well; and being over 60, because muscles respond less to protein with age.</p>
          <b>It's a daily total, spread over the day</b>
          <p>Your body uses protein best in portions of about 0.4 g per kg, which for you is about {c.perMeal} g, spread over three to five meals. That's what each plate is fitted to.</p>
          <b>Protein quality</b>
          <p>Meat, fish, eggs and dairy give the body everything it needs to build muscle. Plant foods do too, if you combine them, for example beans with grains. Chef Mealan counts every gram the same, and moves the target up for plant eaters instead.</p>
          <small>Sources: Morton et al. 2018 (protein and muscle growth); ISSN position stand 2017 (protein and exercise); Helms et al. 2014 (protein when losing fat); PROT-AGE 2013 (protein in older adults).</small>
        </div>
      )}
    </section>
  );
}
