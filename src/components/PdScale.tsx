// DT338 (0.3.179, board Stories279; Go 23 November 2026, 10:42): what the PD colours mean. One scale, five coloured parts,
// each with its name and its range in the person's own numbers. On Me, Goal under the PD target; on the Plate behind a tap
// on the PD number, with a mark where the plate sits. The ranges come from bandRange, as the Foods line under the chips.
import { BAND_LABEL, bandRange, fit, scaleAt, SCALE_BANDS } from "../goal";

export function PdScale({ target, pd, title }: { target: number; pd?: number | null; title?: string }) {
  const at = pd == null ? null : scaleAt(pd, target);
  const here = pd == null ? null : fit(pd, target);
  return (
    <div className="pd-scale">
      {title && <small className="pd-scale-title">{title}</small>}
      <div className="pd-scale-bar" style={{ paddingTop: at === null ? 0 : 16 }}>
        {at !== null && <div className="pd-scale-mark" aria-hidden="true" style={{ left: `calc(${at}% - 7px)` }} />}
        <div className="pd-scale-row">
          {SCALE_BANDS.map((b) => <div key={b} data-band={b} className={`pd-scale-seg seg-${b}${here === b ? " here" : ""}`}>{BAND_LABEL[b]}</div>)}
        </div>
        <div className="pd-scale-row">
          {SCALE_BANDS.map((b) => <small key={b} data-band={b} className="pd-scale-range">{bandRange(b, target)}</small>)}
        </div>
      </div>
    </div>
  );
}
