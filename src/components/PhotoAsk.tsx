// DT130 (0.2.110, board Stories78, DT130c v2; Milan 26 October 15:45: chips, not buttons, and short; 16:18: An idea). A photo
// picked from Your photos waits on the Plate with one question before the read: whose plate, and when. Three chips, one on;
// a tap picks another and nothing else happens. The line under them says what the one that is on does. Read the plate reads.
// B144 (0.3.150, board Stories225; Coach Milan 15 November 19:10, Go 19:22): the same form, with choices that adapt. A first
// look at the photo says what the food is in and which dish it looks like. A pot or a tray asks how much of it is yours (The
// whole pot, My portion). A plate for a meal asks which dish of that meal it is, with Chef Mealan's guess ticked: the app
// cannot know before you say. Your words get a box with room for a list of what is in it.
import { Mark } from "./Mark";
import { w, mealV, type WordKey } from "../words";
import { DISHES, type Dish } from "../served";
import { holdsMore, type Vessel } from "../mealPhoto";
import { ChefLine } from "./ChefLine";
import { say } from "../chefScript";
import { getLang, speechLang } from "../lang";
import { useEffect, useState } from "react";
import { photoFromYours, photoWho, type Who } from "../photoAsk";

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

// DT305 (0.3.151, board Stories230; Coach Milan 16 November 07:46, 08:24, 08:55, Go 11:35): the photo screen. Every photo of a
// meal waits here before the read, alone on the Plate under the meal's title and the meal line. Chef Mealan asks nothing
// about whose plate and when: the meal line holds that, and the photo fills it in (a photo from Your photos is a meal you ate
// at its time; a photo you take now is the meal in front of you; Just looking in the meal line stays Just looking). The
// photo is bigger, with Remove the photo beside it. One box: Anything Chef Mealan should know?, typed or said. Read the
// plate, alone. A pot or a tray still asks how much of it is yours; the dish is Chef Mealan's guess and shows on the read.
export function PhotoAsk({ image, at, taken: fromCamera = false, mealAt, read, drop, look, exploring = false }: { image: string; at: string; taken?: boolean; mealAt: (d: Date) => string | null; read: (x: { at: string; who: Who; note?: string; share?: "whole" | "portion"; dish?: Dish }) => void; drop: () => void; look?: (image: string) => Promise<{ vessel: Vessel; course: Dish } | null>; exploring?: boolean }) {
  const taken = new Date(at), now = new Date();
  const who: Who = photoWho(taken, now, fromCamera, exploring);
  const [note, setNote] = useState("");
  // B144: the first look; until it answers the pot row waits, so a guess never jumps after you tapped
  const [seen, setSeen] = useState<{ vessel: Vessel | null; course: Dish } | null>(look ? null : { vessel: null, course: "main" });
  const [share, setShare] = useState<"whole" | "portion">("whole");
  useEffect(() => {
    if (!look) return; let on = true;
    look(image).then((r) => { if (!on) return; setSeen(r ?? { vessel: null, course: "main" }); }).catch(() => { if (on) setSeen({ vessel: null, course: "main" }); });
    return () => { on = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image]);
  const meal = who === "idea" ? null : mealAt(who === "ate" ? taken : now);
  // Say it: the phone writes what you say into the box, as on Help Chef Mealan read it
  const S: any = typeof window !== "undefined" ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null;
  const [hearing, setHearing] = useState(false);
  const listen = () => { if (!S || hearing) return; try { const r = new S(); r.lang = speechLang(getLang()); r.interimResults = false; r.onresult = (e: any) => { const t = String(e.results?.[0]?.[0]?.transcript ?? "").trim(); if (t) setNote((n) => (n ? `${n} ${t}` : t).slice(0, 300)); }; r.onend = () => setHearing(false); r.onerror = () => setHearing(false); setHearing(true); r.start(); } catch { setHearing(false); } };
  const dish = seen && seen.course !== "drink" ? seen.course : "main";
  return (
    <section className="pa pa-screen" aria-label={w("photoask.yourPhoto")}>
      {/* DT308 Release 2 (0.3.155, board Stories236, DT308.2): one card, the photo on top, then where it is from and Remove the photo */}
      <img className="pa-photo" src={image} alt={w("photoask.yourPhoto")} />
      <div className="pa-from"><Mark size={18} color="var(--brand)" /><span>{say("photoHere", fromCamera ? w("photoask.takenNow") : photoFromYours(taken, now))}</span>
        <button type="button" className="pill pill-small pill-danger-line pa-remove" onClick={drop}>{w("photoask.dropThePhoto")}</button></div>
      {seen && <PotRows vessel={seen.vessel} share={share} setShare={setShare} dish={dish} setDish={() => {}} meal={null} />}
      <div className="pa-note">
        <div className="pa-note-top"><label htmlFor="pa-words">{w("photoask.whatIsInIt")}</label>{S && <button type="button" className="pill pill-small pill-action pa-say" aria-pressed={hearing} onClick={listen}>{hearing ? w("make.listening") : w("make.sayIt")}</button>}</div>
        <textarea id="pa-words" className="search pa-words" rows={3} value={note} placeholder={w("photoask.wordsPlaceholder")} onChange={(e) => setNote(e.target.value)} maxLength={300} />
      </div>
      <div className="pa-go">
        <button type="button" className="pill pill-primary" onClick={() => read({ at: taken.toISOString(), who, ...(note.trim() ? { note: note.trim() } : {}), ...(seen && holdsMore(seen.vessel) ? { share } : {}), ...(seen && meal ? { dish } : {}) })}>{w("photoask.readThePlate")}</button>
      </div>
    </section>
  );
}
