// The Plate's meal line with everything behind its pencil.
// B150 (0.3.160, board B150; Go 19 November 01:00): the line has a small title, Meal and day. Under it: No meal selected,
// or the meal with its day and time. The pencil is always there. A tap opens edit mode, the calendar (PlateCalendar.tsx),
// and the pencil turns into the X that closes it; the X does nothing else. A tap on a meal sets it, saved at once, and edit
// mode stays open; the row No meal selected takes the meal off again. Under the calendar What is it? and Chef Mealan's
// What kind of moment?, as they were. Just looking and the X that removed the meal are gone.
// 0.3.156: a plain function the Plate screen calls while it draws: whether the line is open, the day shown and every other
// piece of state stay in the Plate screen and are handed in, so nothing resets when the line opens or closes.
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { Pencil, X } from "lucide-react";
import { w, mealName } from "../words";
import { getLang, locOf } from "../lang";
import { say } from "../chefScript";
import { pdText } from "../ui";
import { PLATE_TASTE_WORD, PLATE_TASTE_LINE, type PlateTaste } from "../dishTaste";
import { momentOf, orderMoments, REGIONS, regionName, regionV } from "../moments";
import { ChefLine } from "../components/ChefLine";
import type { AppApi } from "./api";

// the meal the plate is set for, as the line says it
export type MealSet = { name: string; date: string; time: string | null; plan?: boolean };
export type PlateMealLineIn = {
  calendar: ReactNode;
  lineOpen: boolean;
  p: AppApi;
  pdRef: number | null;
  pickTaste: (t: PlateTaste) => void;
  set: MealSet | null;
  // B151 (0.3.171, board B151): a plate you build yourself. is: what holds (it counts in the meal, or it is in the plan);
  // line: the one line under the meals that says what the tap did; held: the meal already holds a dish, Replace it or Add a dish
  live?: { is: "eaten" | "planned" | null; line: string; held: ReactNode };
  setLineOpen: Dispatch<SetStateAction<boolean>>;
  shownTaste: PlateTaste;
  tasteHint: string;
};
// Sunday, 15 November, 20:00
export const mealDayText = (date: string, time: string | null) => {
  const d = new Date(`${date}T12:00:00`), l = getLang();
  const day = l === "en" ? `${d.toLocaleDateString("en-GB", { weekday: "long" })}, ${d.getDate()} ${d.toLocaleDateString("en-GB", { month: "long" })}` : d.toLocaleDateString(locOf(l), { weekday: "long", day: "numeric", month: "long" });
  return time ? `${day}, ${time}` : day;
};

export function plateMealLine(given: PlateMealLineIn) {
  const { calendar, lineOpen, p, pdRef, pickTaste, set, live, setLineOpen, shownTaste, tasteHint } = given;
  const liveWord = live?.is === "eaten" ? w("plate.liveEaten") : live?.is === "planned" ? w("plate.livePlanned") : "";
  const small = [liveWord, p.moment !== "regular" ? momentOf(p.moment).name : "", shownTaste ? PLATE_TASTE_LINE[shownTaste] : "", set?.plan && !live?.is ? w("plate.goesIntoPlan") : ""].filter(Boolean).join(" · ");
  return (
    <>
      <div className={`plan-line meal-line${set ? " is-set" : ""}${lineOpen ? " is-open" : ""}`}>
        <div className="meal-line-text" onClick={() => setLineOpen((v) => !v)}>
          <span className="meal-line-title">{w("plate.mealAndDay")}</span>
          {set ? <><b className="meal-line-meal">{mealName(set.name)}</b><span className="meal-line-day">{mealDayText(set.date, set.time)}</span></>
            : <b className="meal-line-unset">{w("plate.mealNotSet")}</b>}
          {small && <small className="meal-line-small">{small}</small>}
        </div>
        {lineOpen
          ? <button type="button" className="icon plan-line-pen plan-line-close on" aria-label={w("plate.closeMealEdit")} aria-expanded={true} onClick={() => setLineOpen(false)}><X size={22} /></button>
          : <button type="button" className="icon plan-line-pen" aria-label={w("make.changeWhatThisPlateIs")} aria-expanded={false} onClick={() => setLineOpen(true)}><Pencil size={20} /></button>}
      </div>
      {lineOpen && (<div className="meal-line-open">
      {calendar}
      {/* DT274 (0.3.122, board Stories203): what each choice does, as it was under What is it for */}
      {live ? <div className="live-says"><p className="small live-line" role="status">{live.line}</p>{live.held}</div>
        : <p className="small for-say"><b>{w("make.forExploringHead")}</b> {w("make.forExploring")}<br /><b>{w("make.forMealHead")}</b> {w("make.forMeal")}</p>}
      <div className="meal-line-ask">
      {/* R22 (0.2.50, board RS21): What is it? in place of Meal or Dessert; a small thing is a Snack, in the calendar */}
      <p className="label">{w("make.whatIsIt")}</p>
      <div className="moments taste-row" role="radiogroup" aria-label={w("make.whatIsIt")}>
        {(["savoury", "daam", "both"] as const).map((t) => (
          <button key={t} className={`choice ${shownTaste === t ? "on" : ""}`} aria-pressed={shownTaste === t} onClick={() => pickTaste(t)}>{PLATE_TASTE_WORD[t]}</button>
        ))}
      </div>
      <p className="small taste-hint">{tasteHint}</p>
      <ChefLine text={say("whatMoment")} />
      <div className="moments moment-row">
        {orderMoments(p.usual).map((m) => (
          <button key={m.id} className={`choice ${p.moment === m.id ? "on" : ""} ${m.planned ? "" : "pill-unplanned"}`} aria-pressed={p.moment === m.id} onClick={() => p.setMoment(m.id)}>{m.name}</button>
        ))}
      </div>
      <p className="small moment-hint">{momentOf(p.moment).hint}{p.moment !== "regular" && pdRef !== null ? ` ${w("plate.targetForPlate", { pd: pdText(pdRef) })}` : ""}</p>
      {p.moment === "travel" && (
        <>
          <p className="label">{w("make.whereTo")}</p>
          <div className="moments">
            {REGIONS.filter((r) => r.id !== p.region).map((r) => (
              <button key={r.id} className={`choice ${p.travelTo === r.id ? "on" : ""}`} onClick={() => p.setTravelTo(p.travelTo === r.id ? null : r.id)}>{regionName(r.id)}</button>
            ))}
          </div>
          <p className="small moment-hint">{p.travelTo ? w("plate.travelPlans", { place: REGIONS.some((r) => r.id === p.travelTo) ? regionV(p.travelTo!) : "" }) : w("make.pickThePlaceAndChef")}</p>
        </>
      )}
      </div>
      </div>)}
    </>
  );
}
