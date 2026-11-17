// The Plate's meal line with everything behind its pencil: Which day?, What is it for?, What is it?, the occasion,
// and Where to? for travel.
// 0.3.156: moved out of JourneyScreen.tsx as it was. It is a plain function the Plate screen calls while it draws:
// whether the line is open, the day picked and every other piece of state stay in the Plate screen and are handed in,
// so nothing resets when the line opens or closes.
import type { Dispatch, SetStateAction } from "react";
import { Pencil } from "lucide-react";
import { w, mealV, mealName, dateV, type Val } from "../words";
import type { PlateWhen } from "../plateMode";
import { say } from "../chefScript";
import type { Ingredient } from "../pilot";
import { pdText } from "../ui";
import { PLATE_TASTE_WORD, PLATE_TASTE_LINE, type PlateTaste } from "../dishTaste";
import { momentOf, orderMoments, REGIONS, regionName, regionV } from "../moments";
import { slotsOn, type Slot } from "../slots";
import { lifestyleOf } from "../personal";
import { ymd } from "../plan";
import { ChefLine } from "../components/ChefLine";
import type { AppApi } from "./api";

export type PlateMealLineIn = {
  daySlots: Slot[];
  forHint: string;
  forKey: string;
  items: Ingredient[];
  lineNow: string;
  lineOpen: boolean;
  linePhoto: string | null;
  otherDay: string;
  p: AppApi;
  pdRef: number | null;
  pickDate: boolean;
  pickTaste: (t: PlateTaste) => void;
  plateWhen: PlateWhen;
  setLineOpen: Dispatch<SetStateAction<boolean>>;
  setOtherDay: Dispatch<SetStateAction<string>>;
  setPickDate: Dispatch<SetStateAction<boolean>>;
  shownTaste: PlateTaste;
  slotTitleText: (f: NonNullable<AppApi["filling"]>) => string;
  slotTitleV: (f: NonNullable<AppApi["filling"]>) => Val;
  slotV: (f: NonNullable<AppApi["filling"]>) => Val;
  tasteHint: string;
};

export function plateMealLine(given: PlateMealLineIn) {
  const { daySlots, forHint, forKey, items, lineNow, lineOpen, linePhoto, otherDay, p, pdRef, pickDate, pickTaste, plateWhen, setLineOpen, setOtherDay, setPickDate, shownTaste, slotTitleText, slotTitleV, slotV, tasteHint } = given;
  return (
    <>
      {/* the plan line (0.2.0, canvas S): one line says what the plate is; the kind and the moment sit behind its pencil, never asked first.
          A planned meal (0.2.2) says Lunch, 12:30 · By the plan; until then every plate is off the plan. */}
      {/* R11: a tap anywhere on the line opens its section; the pencil (or Done) stays the button for keyboards and readers */}
      <div className="plan-line" onClick={() => setLineOpen((v) => !v)}>
        <span>{p.filling ? (p.filling.mode === "eat" ? w("plate.planLine", { meal: mealV(p.filling.name), time: p.filling.time }) : w(plateWhen === "past" ? "plate.slotLineEaten" : plateWhen === "plan" ? "plate.slotLinePlanning" : "plate.slotLineByPlan", { slot: slotTitleV(p.filling), time: p.filling.time })) + (items.some((i) => i.dish) ? ` · ${w("plate.aDish")}` : "") : (linePhoto ?? lineNow)}{shownTaste && <b className="plate-taste-line"> · {PLATE_TASTE_LINE[shownTaste]}</b>}</span>
        {lineOpen
          ? <button className="pill pill-small pill-primary plan-line-done" onClick={(e) => { e.stopPropagation(); setLineOpen(false); }}>{w("make.done")}</button>
          : <button className="icon plan-line-pen" aria-label={w("make.changeWhatThisPlateIs")} aria-expanded={lineOpen} onClick={(e) => { e.stopPropagation(); setLineOpen(true); }}><Pencil size={16} /></button>}
      </div>
      {lineOpen && (<>
      {/* R11 (0.2.37, board RS8): What is it for: Exploring, the day's meals, a snack off the plan; a meal from the Plan keeps its own slot */}
      {/* DT149 (0.2.130, board Stories101 version 2): Which day?, behind the pencil. Today is the moment; a day before adds
          what you ate, a day after plans; picking that day's meal makes the plate that meal */}
      {!p.filling && (() => {
        const d0 = new Date(); d0.setHours(12, 0, 0, 0);
        const dayAt = (n: number) => { const d = new Date(d0); d.setDate(d0.getDate() + n); return ymd(d); };
        const chosen = otherDay ?? ymd(d0);
        const slotsThere = otherDay ? slotsOn(lifestyleOf(p.personal), p.personal.timesOn, otherDay) : [];
        const dn = otherDay ? new Date(`${otherDay}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long" }) : "";
        const dnV: Val = otherDay ? dateV(new Date(`${otherDay}T12:00:00`), { weekday: "long" }) : "";
        return (<>
          <p className="label">{w("make.whichDay")}</p>
          <div className="moments which-day" role="radiogroup" aria-label={w("make.whichDay2")}>
            {([[-1, "plate.yesterday"], [0, "plate.today"], [1, "plate.tomorrow"]] as const).map(([n, k]) => <button key={k} type="button" className={`choice ${chosen === dayAt(n) ? "on" : ""}`} aria-pressed={chosen === dayAt(n)} onClick={() => { setOtherDay(n === 0 ? null : dayAt(n)); setPickDate(false); }}>{w(k)}</button>)}
            <button type="button" className={`choice ${pickDate || (otherDay && ![dayAt(-1), dayAt(1)].includes(otherDay)) ? "on" : ""}`} aria-pressed={pickDate} onClick={() => setPickDate(!pickDate)}>{w("make.anotherDay")}</button>
          </div>
          {pickDate && <input className="search another-day" type="date" aria-label={w("make.anotherDay")} value={otherDay && ![dayAt(-1), dayAt(1)].includes(otherDay) ? otherDay : ""} onChange={(e) => { setOtherDay(e.target.value && e.target.value !== ymd(d0) ? e.target.value : null); }} />}
          <p className="small which-day-hint">{otherDay ? (otherDay < ymd(d0) ? w("plate.dayAddsPick", { day: dnV }) : w("plate.dayPlansPick", { day: dnV })) : w("make.todayIsWhatYouEat")}</p>
          {otherDay && <div className="moments for-row" role="radiogroup" aria-label={w("plate.dayWhichMeal", { day: dnV })}>
            {slotsThere.map((x) => <button key={x.id} type="button" className="choice" onClick={() => { p.setFilling({ date: otherDay, slotId: x.id, name: x.name, time: x.time, dayName: dn }); setOtherDay(null); setPickDate(false); }}>{w("plate.mealAtTime", { meal: mealV(x.name), time: x.time })}</button>)}
          </div>}
        </>);
      })()}
      {/* 0.3.65 (Coach Milan 22:53, Go): Exploring is there on a meal of the plan too; it leaves that meal, which stays as it was */}
      {p.filling && <>
        <p className="label">{w("make.whatIsItFor")}</p>
        <div className="moments for-row" role="radiogroup" aria-label={w("make.whatThePlateIsFor")}>
          <button className="choice on" aria-pressed={true}>{slotTitleText(p.filling)}</button>
          <button className="choice" aria-pressed={false} onClick={() => { const left = slotV(p.filling!); p.setFilling(null); p.setPick("exploring"); p.notify(w("plate.exploringStays", { slot: left })); }}>{w("plate.exploring")}</button>
        </div>
        <p className="small for-hint">{w("plate.exploringLeaves", { slot: slotV(p.filling) })}</p>
      </>}
      {!p.filling && !otherDay && <>
        <p className="label">{w("make.whatIsItFor")}</p>
        <div className="moments for-row" role="radiogroup" aria-label={w("make.whatThePlateIsFor")}>
          <button className={`choice ${forKey === "exploring" ? "on" : ""}`} aria-pressed={forKey === "exploring"} onClick={() => p.setPick("exploring")}>{w("plate.exploring")}</button>
          {daySlots.map((x) => <button key={x.id} className={`choice ${forKey === `meal:${x.id}` ? "on" : ""}`} aria-pressed={forKey === `meal:${x.id}`} onClick={() => p.setPick(`meal:${x.id}`)}>{mealName(x.name)}</button>)}
          {!daySlots.some((x) => /snack/i.test(x.name)) && <button className={`choice ${forKey === "snack" ? "on" : ""}`} aria-pressed={forKey === "snack"} onClick={() => p.setPick("snack")}>{w("meal.snack")}</button>}
        </div>
        {/* DT274 (0.3.122, board Stories203): what each choice does; on Exploring in place of the one line that was there */}
        {p.pick !== "exploring" && <p className="small for-hint">{forHint}</p>}
        <p className="small for-say"><b>{w("make.forExploringHead")}</b> {w("make.forExploring")}<br /><b>{w("make.forMealHead")}</b> {w("make.forMeal")}</p>
      </>}
      {/* R22 (0.2.50, board RS21): What is it? in place of Meal or Dessert; a small thing is a Snack, above */}
      <p className="label">{w("make.whatIsIt")}</p>
      <div className="moments taste-row" role="radiogroup" aria-label={w("make.whatIsIt")}>
        {(["savoury", "daam", "both"] as const).map((t) => (
          <button key={t} className={`choice ${shownTaste === t ? "on" : ""}`} aria-pressed={shownTaste === t} onClick={() => pickTaste(t)}>{PLATE_TASTE_WORD[t]}</button>
        ))}
      </div>
      <p className="small taste-hint">{tasteHint}</p>
      <ChefLine text={say("whatMoment")} />
      <div className="moments">
        {orderMoments(p.usual).map((m) => (
          <button key={m.id} className={`choice ${p.moment === m.id ? "on" : ""} ${m.planned ? "" : "pill-unplanned"}`} onClick={() => p.setMoment(m.id)}>{m.name}</button>
        ))}
      </div>
      <p className="small moment-hint">{momentOf(p.moment).hint}{p.moment !== "regular" && pdRef !== null ? ` ${w("plate.targetForPlate", { pd: pdText(pdRef) })}` : ""}</p>
      </>)}
      {lineOpen && p.moment === "travel" && (
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
    </>
  );
}
