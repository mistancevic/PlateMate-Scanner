// DT130 (0.2.110, board Stories78, DT130c v2; Milan 26 October 15:45: chips, not buttons, and short; 16:18: An idea). A photo
// picked from Your photos waits on the Plate with one question before the read: whose plate, and when. Three chips, one on;
// a tap picks another and nothing else happens. The line under them says what the one that is on does. Read the plate reads.
import { useState } from "react";
import { WHO_ORDER, atTime, chipWord, hhmm, photoFrom, startWho, whoLine, type Who } from "../photoAsk";

export function PhotoAsk({ image, at, mealAt, read, drop }: { image: string; at: string; mealAt: (d: Date) => string | null; read: (x: { at: string; who: Who }) => void; drop: () => void }) {
  const taken = new Date(at), now = new Date();
  const [who, setWho] = useState<Who>(() => startWho(taken, now));
  const [time, setTime] = useState(() => hhmm(taken));
  const when = who === "ate" ? atTime(taken, time) : now;
  const meal = who === "idea" ? null : mealAt(when);
  return (
    <section className="pa" aria-label="Whose plate, and when">
      <div className="pa-top"><img src={image} alt="the photo you picked" /><span><b>{photoFrom(taken, now)}</b><br />Whose plate, and when?</span></div>
      <div className="pa-chips" role="radiogroup" aria-label="Whose plate, and when">
        {WHO_ORDER.map((w) => (
          // a chip holds the time field, and a field cannot sit inside a button: the chips are radios by role
          <div key={w} role="radio" tabIndex={0} aria-checked={who === w} className={`pa-chip${who === w ? " on" : ""}`} onClick={() => setWho(w)}
            onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) { e.preventDefault(); setWho(w); } }}>
            {who === w && <span aria-hidden="true">✓</span>}
            {w === "ate" ? <>Ate at <input className="pa-time" type="time" value={time} aria-label="The time you ate it" onClick={() => setWho("ate")} onChange={(e) => e.target.value && setTime(e.target.value)} /></> : chipWord(w, time)}
          </div>
        ))}
      </div>
      <small>{whoLine(who, time, meal)}</small>
      <div className="pa-go">
        <button type="button" className="pill pill-primary" onClick={() => read({ at: atTime(taken, time).toISOString(), who })}>Read the plate</button>
        <button type="button" className="link" onClick={drop}>Drop the photo</button>
      </div>
    </section>
  );
}
