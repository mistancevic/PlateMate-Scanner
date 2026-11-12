// DT285 (0.3.139, board Stories212; Coach Milan 12 November 09:44, Go): a meal about to be saved as eaten with a photo that a
// meal of that same day already has asks first. Update that meal keeps one record at its own time; Keep both saves a second
// meal, as before; Back saves nothing.
import { useEffect, useRef } from "react";
import { w, dateText, mealName } from "../words";
import type { SameAsk } from "../screens/api";

export function SamePhotoAsk({ ask, answer }: { ask: SameAsk; answer: (how: "update" | "both" | null) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { try { ref.current?.scrollIntoView({ block: "center" }); } catch { /* nothing to scroll */ } }, [ask.earlier.id]);
  const f = ask.earlier, at = new Date(f.createdAt);
  const day = dateText(at, { weekday: "long" }), time = at.toTimeString().slice(0, 5);
  const slot = f.slot?.name ? mealName(f.slot.name, true) : (f.which ?? "").toLowerCase();
  const g = Math.round(f.meal.items.reduce((n, i) => n + (i.grams || 0), 0));
  const pic = f.photo ?? f.photos?.[0];
  return (
    <div className="same-ask" ref={ref} role="group" aria-label={w("sameask.already", { day })}>
      <b className="same-title">{w("sameask.already", { day })}</b>
      <div className="same-meal">
        {pic && <img src={pic} alt="" />}
        <span><b>{[day, slot, time].filter(Boolean).join(", ")}</b><small>{w("sameask.mealLine", { title: f.meal.title, g })}</small></span>
      </div>
      <button type="button" className="pill pill-primary pill-wide same-update" onClick={() => answer("update")}>{w("sameask.update")}</button>
      <button type="button" className="pill pill-wide same-both" onClick={() => answer("both")}>{w("sameask.both")}</button>
      <button type="button" className="link same-back" onClick={() => answer(null)}>{w("sameask.back")}</button>
      <small className="muted">{w("sameask.help", { time })}</small>
    </div>
  );
}
