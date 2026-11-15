// DT130 (0.2.110, board Stories78, DT130c v2; Milan 26 October 15:45: chips, not buttons, and short; 16:18: An idea). A photo
// picked from Your photos waits on the Plate with one question before the read: whose plate, and when. Three chips, one on;
// a tap picks another and nothing else happens. The line under them says what the one that is on does. Read the plate reads.
// B144 (0.3.150, board Stories225; Coach Milan 15 November 19:10, Go 19:22): the same form, with choices that adapt. A first
// look at the photo says what the food is in and which dish it looks like. A pot or a tray asks how much of it is yours (The
// whole pot, My portion). A plate for a meal asks which dish of that meal it is, with Chef Mealan's guess ticked: the app
// cannot know before you say. Your words get a box with room for a list of what is in it.
import { w, mealV, type WordKey } from "../words";
import { DISHES, type Dish } from "../served";
import { holdsMore, type Vessel } from "../mealPhoto";
import { ChefLine } from "./ChefLine";
import { say } from "../chefScript";
import { useEffect, useState } from "react";
import { WHO_ORDER, atTime, chipWord, hhmm, photoFrom, startWho, whoLine, type Who } from "../photoAsk";

export const dishWord = (d: Dish) => w(`served.dish.${d}` as WordKey);
const FORM_DISHES: Dish[] = DISHES.filter((d) => d !== "drink");
// the two rows that adapt: how much of a pot or a tray is yours; which dish of the meal it is
export function PotRows({ vessel, share, setShare, dish, setDish, meal }: { vessel?: Vessel | null; share: "whole" | "portion"; setShare: (x: "whole" | "portion") => void; dish: Dish; setDish: (d: Dish) => void; meal: string | null }) {
  const chip = (on: boolean, text: string, tap: () => void) => (
    <div key={text} role="radio" tabIndex={0} aria-checked={on} className={`pa-opt${on ? " on" : ""}`} onClick={tap} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tap(); } }}>{on && <span aria-hidden="true">✓</span>}{text}</div>);
  return (<>
    {holdsMore(vessel) && (
      <div className="pa-row pa-share">
        <small className="pa-row-q">{w(vessel === "tray" ? "photoask.looksTray" : "photoask.looksPot")}</small>
        <div className="pa-chips" role="radiogroup" aria-label={w(vessel === "tray" ? "photoask.looksTray" : "photoask.looksPot")}>
          {chip(share === "whole", w(vessel === "tray" ? "photoask.wholeTray" : "photoask.wholePot"), () => setShare("whole"))}
          {chip(share === "portion", w("photoask.myPortion"), () => setShare("portion"))}
        </div>
      </div>)}
    {meal && (
      <div className="pa-row pa-dish">
        <small className="pa-row-q">{w("photoask.whichDish", { meal: mealV(meal, true) })}</small>
        <div className="pa-chips" role="radiogroup" aria-label={w("photoask.whichDish", { meal: mealV(meal, true) })}>
          {FORM_DISHES.map((d) => chip(dish === d, d === "main" ? w("photoask.dishMain") : dishWord(d), () => setDish(d)))}
        </div>
      </div>)}
  </>);
}

export function PhotoAsk({ image, at, mealAt, read, drop, look, exploring = false }: { image: string; at: string; mealAt: (d: Date) => string | null; read: (x: { at: string; who: Who; note?: string; share?: "whole" | "portion"; dish?: Dish }) => void; drop: () => void; look?: (image: string) => Promise<{ vessel: Vessel; course: Dish } | null>; exploring?: boolean }) {
  const taken = new Date(at), now = new Date();
  const [who, setWho] = useState<Who>(() => startWho(taken, now, exploring));
  const [time, setTime] = useState(() => hhmm(taken));
  // DT228 v2 (0.3.63, board Stories168): the person's words go with the photo; empty is fine
  const [note, setNote] = useState("");
  // B144: the first look; until it answers the two rows wait, so a guess never jumps after you tapped
  const [seen, setSeen] = useState<{ vessel: Vessel | null; course: Dish } | null>(look ? null : { vessel: null, course: "main" });
  const [share, setShare] = useState<"whole" | "portion">("whole");
  const [dish, setDish] = useState<Dish>("main");
  useEffect(() => {
    if (!look) return; let on = true;
    look(image).then((r) => { if (!on) return; setSeen(r ?? { vessel: null, course: "main" }); if (r && r.course !== "drink") setDish(r.course); }).catch(() => { if (on) setSeen({ vessel: null, course: "main" }); });
    return () => { on = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image]);
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
      {seen && <PotRows vessel={seen.vessel} share={share} setShare={setShare} dish={dish} setDish={setDish} meal={meal} />}
      <label className="pa-note"><span>{w("photoask.whatIsInIt")}</span><textarea className="search pa-words" rows={3} value={note} placeholder={w("photoask.wordsPlaceholder")} onChange={(e) => setNote(e.target.value)} maxLength={300} /></label>
      <div className="pa-go">
        <button type="button" className="pill pill-primary" onClick={() => read({ at: atTime(taken, time).toISOString(), who, ...(note.trim() ? { note: note.trim() } : {}), ...(seen && holdsMore(seen.vessel) ? { share } : {}), ...(seen && meal ? { dish } : {}) })}>{w("photoask.readThePlate")}</button>
        <button type="button" className="pill pill-small pill-danger-line" onClick={drop}>{w("photoask.dropThePhoto")}</button>
      </div>
    </section>
  );
}
