// The Plate's meal line with everything behind its pencil.
// 0.3.157 (DT308.1 and DT308.9, boards Stories236 and Stories241; Go 18 November 11:14): the line says Meal and day not set,
// in grey, with a pencil, until you set a meal. The pencil opens your calendar (PlateCalendar.tsx): the days, that day's
// meals; under them What is it? and Chef Mealan's What kind of moment?, as they were. A tap on a meal sets the meal and the
// day and closes; a tap on a chip keeps it open; the pencil closes it with no meal set. Once set, the line says the meal,
// then the day, date and time, and the moment when it is not a regular meal, and an X stands in the pencil's place: it
// clears the meal and the day. Which day?, What is it for? and Just looking are gone: the calendar took their place.
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
  clear: () => void;
  lineOpen: boolean;
  // a plate kept as Just looking (a photo you said is an idea, or Don't count it): the line says so, as before
  looking: string | null;
  p: AppApi;
  pdRef: number | null;
  pickTaste: (t: PlateTaste) => void;
  set: MealSet | null;
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
  const { calendar, clear, lineOpen, looking, p, pdRef, pickTaste, set, setLineOpen, shownTaste, tasteHint } = given;
  const small = [p.moment !== "regular" ? momentOf(p.moment).name : "", shownTaste ? PLATE_TASTE_LINE[shownTaste] : "", set?.plan ? w("plate.goesIntoPlan") : ""].filter(Boolean).join(" · ");
  return (
    <>
      <div className={`plan-line meal-line${set ? " is-set" : ""}${lineOpen ? " is-open" : ""}`}>
        <div className="meal-line-text" onClick={set ? undefined : () => setLineOpen((v) => !v)}>
          {set ? <><b className="meal-line-meal">{mealName(set.name)}</b><span className="meal-line-day">{mealDayText(set.date, set.time)}</span></>
            : <b className={looking ? "meal-line-looking" : "meal-line-unset"}>{looking ?? w("plate.mealNotSet")}</b>}
          {small && <small className="meal-line-small">{small}</small>}
        </div>
        {set
          ? <button type="button" className="icon plan-line-x" aria-label={w("plate.clearMeal")} onClick={clear}><X size={22} /></button>
          : <button type="button" className={`icon plan-line-pen${lineOpen ? " on" : ""}`} aria-label={w("make.changeWhatThisPlateIs")} aria-expanded={lineOpen} onClick={() => setLineOpen((v) => !v)}><Pencil size={20} /></button>}
      </div>
      {lineOpen && !set && (<div className="meal-line-open">
      {calendar}
      {/* DT274 (0.3.122, board Stories203): what each choice does, as it was under What is it for */}
      <p className="small for-say"><b>{w("make.forExploringHead")}</b> {w("make.forExploring")}<br /><b>{w("make.forMealHead")}</b> {w("make.forMeal")}</p>
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
