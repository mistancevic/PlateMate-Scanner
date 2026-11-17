// DT309 (0.3.153, board Stories239; Coach Milan 17 November 2026, 09:25 to 14:06, Go 14:12): a long press on Plate in the bottom
// bar opens this small menu above the icon, not the camera: the camera's modes, and an X. A tap on a mode opens the camera in
// that mode. The X, or a tap outside, closes it and nothing else happens, so a long press by accident costs nothing. The order
// is by how often a mode is used and how close it is to the thumb: Group, Barcode, Label, Meal, the most used on the right. The
// camera's own row of modes has the same order. The Plate icon is a plate that is also a shutter, between a fork and a knife.
import { X, Utensils } from "lucide-react";
import { w } from "../words";
import type { ReactElement } from "react";

export type CamMode = "group" | "barcode" | "label" | "meal";
export const CAM_ORDER: CamMode[] = ["group", "barcode", "label", "meal"];

const S = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
export function PlateIcon() {
  return (
    <svg className="plate-icon" width="42" height="26" viewBox="0 0 39 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 3v5a2.4 2.4 0 0 0 4.8 0V3" /><path d="M4.4 3v18" />
      <circle cx="19.5" cy="12" r="8.4" /><circle cx="19.5" cy="12" r="3.6" /><circle cx="24.3" cy="7.2" r=".9" fill="currentColor" stroke="none" />
      <path d="M36.5 21V3c-2.4 1.3-3.2 3.8-3.2 7v3.2h3.2" />
    </svg>
  );
}
const ICON: Record<CamMode, ReactElement> = {
  group: <svg {...S} aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
  barcode: <svg {...S} aria-hidden="true"><path d="M3 5v14" /><path d="M8 5v14" /><path d="M12 5v14" /><path d="M17 5v14" /><path d="M21 5v14" /></svg>,
  label: <svg {...S} aria-hidden="true"><rect x="5" y="2.5" width="14" height="19" rx="1.5" /><path d="M5 8h14" strokeWidth="2.6" /><path d="M8 12h8" /><path d="M5 15h14" /><path d="M8 18h8" /></svg>,
  meal: <Utensils size={24} aria-hidden="true" />,
};
const NAME = { group: "camera.modeGroup", barcode: "camera.modeBarcode", label: "camera.modeLabel", meal: "camera.modeMeal" } as const;

export function PlateCamMenu({ meal, pick, close }: { meal: boolean; pick: (m: CamMode) => void; close: () => void }) {
  const modes = CAM_ORDER.filter((m) => m !== "meal" || meal);
  return (
    <div className="plate-cam-back" onClick={close}>
      <div className="plate-cam-menu" role="dialog" aria-label={w("nav.openCamera")} onClick={(e) => e.stopPropagation()}>
        <div className="plate-cam-top">
          <b>{w("nav.openCamera")}</b>
          <button type="button" className="icon plate-cam-x" aria-label={w("plate.close")} onClick={close}><X size={22} /></button>
        </div>
        <div className="plate-cam-modes" style={{ gridTemplateColumns: `repeat(${modes.length}, minmax(0, 1fr))` }}>
          {modes.map((m) => <button key={m} type="button" className="pill pill-small plate-cam-mode" onClick={() => pick(m)}>{ICON[m]}<span>{w(NAME[m])}</span></button>)}
        </div>
      </div>
    </div>
  );
}
