// DT130 (0.2.110, board Stories78, DT130c v2; Milan 26 October 15:45: chips, not buttons, and short; 16:18: An idea). A photo
// picked from Your photos waits on the Plate with one question before the read: whose plate, and when. Three chips, one on;
// a tap picks another and nothing else happens. The line under them says what the one that is on does. Read the plate reads.
import { w } from "../words";
import { ChefLine } from "./ChefLine";
import { say } from "../chefScript";
import { useState } from "react";
import { WHO_ORDER, atTime, chipWord, hhmm, photoFrom, startWho, whoLine, type Who } from "../photoAsk";

export function PhotoAsk({ image, at, mealAt, read, drop, exploring = false }: { image: string; at: string; mealAt: (d: Date) => string | null; read: (x: { at: string; who: Who; note?: string }) => void; drop: () => void; exploring?: boolean }) {
  const taken = new Date(at), now = new Date();
  const [who, setWho] = useState<Who>(() => startWho(taken, now, exploring));
  const [time, setTime] = useState(() => hhmm(taken));
  // DT228 v2 (0.3.63, board Stories168): the person's words go with the photo; empty is fine
  const [note, setNote] = useState("");
  const when = who === "ate" ? atTime(taken, time) : now;
  const meal = who === "idea" ? null : mealAt(when);
  return (
    <section className="pa" aria-label={w("photoask.whosePlateAndWhen")}>
      {/* DT213 (0.3.74): Chef Mealan asks, with the photo */}
      <ChefLine className="pa-top" image={image} text={say("photoWhose", photoFrom(taken, now))} />
      <div className="pa-chips" role="radiogroup" aria-label={w("photoask.whosePlateAndWhen")}>
        {WHO_ORDER.map((wh) => (
          // a chip holds the time field, and a field cannot sit inside a button: the chips are radios by role
          <div key={wh} role="radio" tabIndex={0} aria-checked={who === wh} className={`pa-chip${who === wh ? " on" : ""}`} onClick={() => setWho(wh)}
            onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) { e.preventDefault(); setWho(wh); } }}>
            {who === wh && <span aria-hidden="true">✓</span>}
            {/* 0.3.65 (Coach Milan 22:44): the time as text, 24 hours, as the line under says it; a tap opens the phone's time picker */}
            {wh === "ate" ? <>{w("photoask.ateAt")} <span className="pa-time-wrap"><span className="pa-time-text" aria-hidden="true">{time}</span><input className="pa-time" type="time" value={time} aria-label={w("photoask.theTimeYouAteIt")} onClick={(e) => { setWho("ate"); try { (e.currentTarget as any).showPicker?.(); } catch { /* the field opens its own picker */ } }} onChange={(e) => e.target.value && setTime(e.target.value)} /></span></> : chipWord(wh, time)}
          </div>
        ))}
      </div>
      <small>{whoLine(who, time, meal)}</small>
      <label className="pa-note"><span>{w("photoask.tellChefMealanWhatIt")}</span><input className="search" value={note} placeholder="pork schnitzel, breaded, Augustiner" onChange={(e) => setNote(e.target.value)} maxLength={200} /></label>
      <div className="pa-go">
        <button type="button" className="pill pill-primary" onClick={() => read({ at: atTime(taken, time).toISOString(), who, ...(note.trim() ? { note: note.trim() } : {}) })}>{w("photoask.readThePlate")}</button>
        <button type="button" className="link" onClick={drop}>{w("photoask.dropThePhoto")}</button>
      </div>
    </section>
  );
}
