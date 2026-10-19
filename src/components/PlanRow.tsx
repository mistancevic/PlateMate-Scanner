// R19 (0.2.47, Milan 06:04 to 06:41, board RS18): one row for a planned meal, on Today (today and tomorrow) and on Plan.
// Its small photo, which slot it is, the title as the link; a tap anywhere opens the meal. Swipe as a food on the Plate:
// left to Swap, right to Skip (on Plan: Empty). Skip and the arrow are not on the row.
import type { ReactNode } from "react";
import { SwipeRow } from "./SwipeRow";
import { Picture } from "./MealPicture";

// The swipe's two actions are also buttons a screen reader or a keyboard reaches, out of sight: nothing is swipe-only.
export function PlanRow({ label, title, sub, photo, ariaLabel, onOpen, onSwap, onRight, rightLabel, className, swapName, rightName }: {
  label: string; title: string; sub?: ReactNode; photo: string | null; ariaLabel: string;
  onOpen: () => void; onSwap: () => void; onRight: () => void; rightLabel: string; className?: string; swapName: string; rightName: string;
}) {
  return (
    <SwipeRow onRemove={onRight} onSwap={onSwap} removeLabel={rightLabel} swapLabel="Swap">
      <div role="button" tabIndex={0} aria-label={ariaLabel} className={`menu-row plan-meal-row ${className ?? ""}`} onClick={onOpen}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}>
        <Picture src={photo} small />
        <div className="menu-row-text"><small>{label}</small><b className="plan-meal-title">{title}</b>{sub && <small>{sub}</small>}</div>
        <span className="sr-only"><button type="button" onClick={(e) => { e.stopPropagation(); onSwap(); }}>{swapName}</button><button type="button" onClick={(e) => { e.stopPropagation(); onRight(); }}>{rightName}</button></span>
      </div>
    </SwipeRow>
  );
}
