// DT349 (board B168 and DT349, canvas Page 6; Coach Milan 24 November 2026, 07:42): one PD card for the Plate and a recipe.
// Two columns, each label heading its own (25 November 13:16; variation B chosen 14:26): on the left, under PD, the number
// (a tap opens its scale, DT338, when there is a target) and the short words against the target; on the right, under the
// title, Energy, Weight and Protein. A long line takes the full width under both. The letters under them. The numbers are
// never inside the card: the caller draws them under it (design rule D14).
import { useState, type ReactNode } from "react";
import { w } from "../words";
import { fmt, pdVal, pdTag } from "../ui";
import { PdScale } from "./PdScale";

export function PdCard({ fit, title, pd, line, kcal, grams, protein, scale, scaleOpen, setScaleOpen, letters, className, label, children }: {
  fit: string; title: ReactNode; pd: number | null; line: ReactNode;
  kcal: number | null; grams: number | null; protein: number | null;
  // the scale opens on a tap on PD when there is a target; the Plate keeps its open state, a recipe the card's own
  scale?: { target: number; title: string } | null; scaleOpen?: boolean; setScaleOpen?: (o: boolean) => void;
  letters?: ReactNode; className?: string; label?: string; children?: ReactNode;
}) {
  const [own, setOwn] = useState(false);
  const open = scaleOpen ?? own, flip = () => (setScaleOpen ? setScaleOpen(!open) : setOwn(!open));
  // a line over 22 letters (a plate far over its meal, High+, far above your plan) takes the full width under both columns
  const short = typeof line !== "string" || line.length <= 22;
  return (
    <section className={`readout readout-fit-${fit} pd-card${className ? ` ${className}` : ""}`} aria-label={label}>
      <div className="readout-top"><span>{title}</span><span>{pdTag()}</span></div>
      <div className="pd-cols">
        <div className="pd-num">
          {scale ? <b className="pd-tap" role="button" tabIndex={0} aria-expanded={open} aria-label={w("plate.pdScaleOpen")} onClick={flip} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } }}>{pdVal(pd)}</b> : <b>{pdVal(pd)}</b>}
          {short && <span className="pd-short">{line}</span>}
        </div>
        <small className="rd-rows"><span>{w("plate.energy")}</span><b>{kcal === null ? "?" : fmt(kcal, 0)}</b> <span>{w("plate.kcal")}</span><span>{w("plate.weight")}</span><b>{grams === null ? "?" : fmt(grams, 0)}</b> <span>g</span><span>{w("plate.protein")}</span><b>{protein === null ? "?" : fmt(protein, 0)}</b> <span>g</span></small>
      </div>
      {!short && <p className="pd-line">{line}</p>}
      {scale && open ? <div className="pd-scale-box"><PdScale target={scale.target} pd={pd} title={scale.title} /></div> : null}
      {letters}
      {children}
    </section>
  );
}
