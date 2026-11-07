// DT257 (0.3.111, board Stories192; Coach Milan 8 November 00:09, Go): a photo from the camera or the gallery. On Android a
// file input set to the camera opens only the camera; a picture made in ChatGPT or Gemini, or an older photo, could not be
// picked. A tap now asks Camera or Gallery, under the button, the same on every phone; Cancel closes the choice.
import { useState, type ReactNode } from "react";
import { w } from "../words";

export function PhotoPick({ onFile, children }: { onFile: (f: File) => void; children: (x: { toggle: () => void; open: boolean }) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const opt = (cam: boolean) => (
    <label className={`pill pill-small pp-opt ${cam ? "pp-camera" : "pp-gallery"}`}>{cam ? w("photo.camera") : w("photo.gallery")}
      <input type="file" accept="image/*" {...(cam ? { capture: "environment" as const } : {})} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; setOpen(false); if (f) onFile(f); }} />
    </label>
  );
  return (<>
    {children({ toggle: () => setOpen((o) => !o), open })}
    {open && <div className="pp-row" role="group" aria-label={w("photo.from")}>{opt(true)}{opt(false)}<button type="button" className="link pp-cancel" onClick={() => setOpen(false)}>{w("photo.cancel")}</button></div>}
  </>);
}
