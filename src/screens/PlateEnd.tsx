// What do you do with it? Save it, Plan it, Ate it: the end of a plate (0.3.157, DT308.4 to DT308.6 and DT308.11; boards
// Stories237 and Stories242; Go 18 November 11:14). The three are choices, so all three are white (DT310). Save it keeps the
// plate in My recipes and the plate stays. Plan it and Ate it open your calendar right under the button; with a meal already
// set they act at once (Coach Milan, 18 November). A plain function the Plate screen calls while it draws: which calendar
// is open and its day stay in the Plate screen.
import type { ReactNode } from "react";
import { w } from "../words";

export type PlateEndIn = {
  calendar: ReactNode;
  open: "plan" | "ate" | null;
  saved: boolean;
  // the name the recipe took when none was typed: the line under the buttons says so
  savedAs: string | null;
  onSave: () => void; onPlan: () => void; onAte: () => void;
};

export function plateEnd(given: PlateEndIn) {
  const { calendar, open, saved, savedAs, onSave, onPlan, onAte } = given;
  const as = savedAs ? w("plate.savedAs", { title: "\u0001" }).split("\u0001") : null;
  return (
    <div className="pa-row rv-q plate-end">
      <small className="pa-row-q">{w("plate.whatDoYouDo")}</small>
      <div className={`plate-end-btns${saved ? " has-saved" : ""}`} role="group" aria-label={w("plate.whatDoYouDo")}>
        <button type="button" className="pill pill-small pe-save" disabled={saved} onClick={onSave}>{saved ? w("recipes.savedInMyRecipes") : w("plate.saveIt")}</button>
        <button type="button" className={`pill pill-small pe-plan${open === "plan" ? " on" : ""}`} aria-expanded={open === "plan"} onClick={onPlan}>{w("plate.planIt")}</button>
        <button type="button" className={`pill pill-small pe-ate${open === "ate" ? " on" : ""}`} aria-expanded={open === "ate"} onClick={onAte}>{w("plate.ateIt")}</button>
      </div>
      {saved && as && <small className="plate-end-saved">{as[0]}<b>{savedAs}</b>{as[1] ?? ""}</small>}
      {calendar}
    </div>
  );
}
