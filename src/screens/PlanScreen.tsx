import { carryReads } from "../carry";
import { useEffect, useRef, useState, type ReactElement } from "react";
import { ChevronRight, ChefHat, Pencil, Circle, CircleCheck, CircleSlash, ShoppingBasket } from "lucide-react";
import { shoppingList, getStore, putStore, openList, nextStart, daysFrom, makeList, tickIn, finishList, notTicked, listText, shopAmount, stateOf, shortMeals, byMeal, replanMeal, followPlan, notCounted, planChanges, updateList, type ShopStore, type SavedList, type ShopLine } from "../shopping";
import type { AppApi, Filling } from "./api";
import { dayFor, getDay, lifestyleOf, isMinor } from "../personal";
import { planLine, isoWeek, ymd, weekdaysOf, workHintOf, type PlanDay } from "../plan";
import { rowsOf, slotsOf, slotsOn, trainingWhen, type Slot } from "../slots";
import { fmt, pdVal, pdTag, pdText } from "../ui";
import { density, aggregate, uid } from "../pilot";
import { countOf, countLabel } from "../counted";
import { STARTERS, fitOf, fromMeal, leftOf, sumOf, plannedPortion, dayOff, proteinOff, bandOf, fitPortions, usualPortions, amountText, isBatch, isFitted, piecesFor, withPieces, oneWord, type PlannedMeal } from "../planned";
import { CHEF_NAME } from "../components/Mark";
import { PlanRow } from "../components/PlanRow";
import { ShortHelp } from "../components/ShortHelp";
import { pictureOfRecipe } from "../components/MealPicture";
import { DayEditor } from "../components/DayEditor";
import { dayLog } from "../today";
import { dayRecord } from "../record";
import { livedByPlan } from "../metricsCalc";

// Plan decides (0.2, canvas S "Plan purpose one" and H): the calendar of the day, slot by slot. The slots come from Lifestyle
// (meals a day, the eating window, the times), the training row from the Training week. 0.2.1 shows the day with its empty
// slots and its numbers; 0.2.2 fills a slot by hand: tap it, pick from My recipes, Coach's recipes or the starters, each with
// its PD mark, or make a new meal on the Plate. The day as planned adds up what the slots hold.
// 0.2.5+r19 (canvas board TW, TW3 to TW5, Milan 13 October 2026): Plan is the one calendar with dates. The training row opens
// that date's training (this date only; the Training week stays), and the arrows go back a week at a time: a past date
// shows what was eaten, with Cook again, and whether the day was lived by the plan.
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); x.setHours(12, 0, 0, 0); return x; };
const SOURCE: Record<PlannedMeal["source"], string> = { mine: "my recipe", coach: "coach's recipe", starter: "starter", plate: "made on the Plate" };

// the day looked at last, kept while the app is open, so a trip to the Plate comes back to the same day
let remembered: string | null = null;
// the day Plan shows, for the chef's context (0.2.4)
export const planDateShown = () => remembered ?? ymd(new Date());
// R18 (0.2.46): Today's Check tomorrow and Plan tomorrow open Plan on that day
export const showPlanOn = (d: string, slotId?: string) => { remembered = d; pickOnArrival = slotId ?? null; };
// R19 (0.2.47): Swap on Today opens Plan on that day with Pick a meal open for the slot
let pickOnArrival: string | null = null;

export function PlanScreen(p: AppApi) {
  const today = new Date();
  const [picked, setPickedState] = useState<string>(remembered ?? ymd(today));
  const setPicked = (d: string) => { remembered = d; setPickedState(d); };
  const [open, setOpen] = useState<Slot | null>(null);
  const [editing, setEditing] = useState<PlanDay | null>(null);
  const [shopping, setShopping] = useState(false);
  // SL6: a planned meal with foods but no recipe behind it (changed for this day only) opens to show what it is
  const [viewing, setViewing] = useState<Slot | null>(null);
  // SL3: the button names the open list; it is read again when the sheet closes
  const shopOpen = shopping ? null : openList(getStore());
  const stripRef = useRef<HTMLDivElement>(null);
  // the picked day stays in view
  useEffect(() => { try { stripRef.current?.querySelector<HTMLElement>(".choice.on")?.scrollIntoView({ inline: "center", block: "nearest" }); } catch {} }, [picked]);
  // two weeks, Monday first: this week and the next, or earlier weeks with the arrows
  const thisMonday = isoWeek(today).monday;
  const [offset, setOffsetState] = useState(() => { const m = isoWeek(new Date(`${picked}T12:00:00`)).monday; const n = Math.round((m.getTime() - thisMonday.getTime()) / (7 * 864e5)); return n === 1 ? 0 : n; });
  const monday = addDays(thisMonday, offset * 7);
  const strip = Array.from({ length: 14 }, (_, i) => addDays(monday, i));
  // the arrows go both ways with no limit (canvas board FX, PW1); This week comes back
  const goWeek = (n: number) => { const next = n === 0 ? 0 : offset + n; setOffsetState(next); setPicked(next === 0 ? ymd(today) : ymd(addDays(thisMonday, next * 7))); };
  const date = strip.find((d) => ymd(d) === picked) ?? strip[0];
  const key = ymd(date);
  const lifestyle = lifestyleOf(p.personal);
  const slots = slotsOn(lifestyle, p.personal.timesOn, key);
  const training = dayFor(p.personal, date)?.day ?? getDay(p.personal, date).plan ?? null;
  const rows = rowsOf(slots, training);
  // R19: arriving from a Swap on Today, Pick a meal opens for that slot, once
  useEffect(() => { if (pickOnArrival) { const sl = slots.find((x) => x.id === pickOnArrival); pickOnArrival = null; if (sl) setOpen(sl); } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const numbers = p.numbersFor(date);
  const tWhen = trainingWhen(training);
  const isToday = key === ymd(today);
  const isPast = key < ymd(today);
  const minor = isMinor(p.personal);
  const changed = !!dayFor(p.personal, date)?.changed;
  const wk = isoWeek(monday), sunday = addDays(monday, 6);
  const weekSpan = `Week ${wk.week}, ${monday.getDate()}${monday.getMonth() === sunday.getMonth() ? "" : ` ${MONTHS[monday.getMonth()]}`} to ${sunday.getDate()} ${MONTHS[sunday.getMonth()]}`;
  const dayName = isToday ? "today" : WEEKDAY[(date.getDay() + 6) % 7];
  const line = [
    numbers ? `${fmt(numbers.kcal, 0)} kcal · ${numbers.protein} g protein` : "No numbers yet",
    tWhen ? tWhen.phrase : training ? "rest day" : null,
  ].filter(Boolean).join(" · ");
  const target = numbers ? density(numbers.protein, numbers.kcal) : null;
  const unit = p.personal.pdUnit === "pct" ? "pct" : "pd";
  const held = p.planned[key] ?? {};
  const sum = sumOf(held);
  const openCount = slots.filter((s) => !held[s.id]).length;
  // DT74 (board DT74, Anna's first run): every target names its day; a full day well off its kcal says so, and can fit
  const dayPoss = isToday ? "today's" : `${WEEKDAY[(date.getDay() + 6) % 7]}'s`;
  const off = dayOff(sum, numbers, openCount);
  // DT75: the day's kcal as a range, a tenth either side; protein in the person's range (g per kg), the target inside it
  const band = numbers ? bandOf(numbers.kcal) : null;
  const pr = p.proteinRange && numbers ? { min: Math.min(p.proteinRange.min, numbers.protein), max: Math.max(p.proteinRange.max, numbers.protein) } : null;
  const pOff = proteinOff(sum, pr, openCount);
  const Day = dayName === "today" ? "Today" : dayName;
  const fitted = isFitted(held);
  const fitDay = () => { if (!numbers) return; const next = fitPortions(held, numbers); for (const [id, m] of Object.entries(next)) p.fill(key, id, m);
    const k = sumOf(next).kcal, b = bandOf(numbers.kcal);
    p.notify(k >= b.lo && k <= b.hi ? `${Day} is inside its range: ${fmt(k, 0)} kcal.` : `Portions fitted to ${Day === "Today" ? "today" : Day}: ${fmt(k, 0)} kcal, as close as these meals get.`); };
  const usualDay = () => { const next = usualPortions(held); for (const [id, m] of Object.entries(next)) p.fill(key, id, m); p.notify("Back to the usual portions."); };
  const fillingOf = (s: Slot): Filling => ({ date: key, slotId: s.id, name: s.name, time: s.time, dayName });
  const put = (s: Slot, m: PlannedMeal) => { p.fill(key, s.id, m); setOpen(null); p.notify(`${m.title} is ${dayName === "today" ? "today's" : `${dayName}'s`} ${s.name.toLowerCase()}.`); };
  return (
    <>
      <div className="week-arrows">
        <button type="button" className="week-arrow" aria-label="Week before" onClick={() => goWeek(-1)}>‹</button>
        <span className="week-arrows-mid">{weekSpan}{offset !== 0 ? <button type="button" className="link week-back" onClick={() => goWeek(0)}>This week</button>
          : key !== ymd(today) && <button type="button" className="link week-back" onClick={() => goWeek(0)}>Today</button>}</span>
        <button type="button" className="week-arrow" aria-label="Week after" onClick={() => goWeek(1)}>›</button>
      </div>
      <div className="day-strip" role="tablist" aria-label="Pick a day" ref={stripRef}>
        {strip.map((d) => {
          const on = ymd(d) === key;
          const n = Object.keys(p.planned[ymd(d)] ?? {}).length;
          // SL7 (Milan 21:20): today's day is always marked, picked or not
          const isT = ymd(d) === ymd(today);
          return <button key={ymd(d)} type="button" role="tab" className={`choice ${on ? "on" : ""} ${n ? "has" : ""} ${isT ? "is-today" : ""}`} aria-selected={on} onClick={() => setPicked(ymd(d))}>{isT ? "Today" : DAYS[(d.getDay() + 6) % 7]} {d.getDate()}</button>;
        })}
      </div>
      {isPast ? <PastDay p={p} date={date} dayKey={key} line={line} slots={slots} numbers={numbers} /> : (<>
      {/* SL2 (Milan 16:03): the day's head and the day as planned are one card at the top: the date, the kind of day and the
          open slots, then the plan against the target. The target is said once, in the numbers. */}
      <section className="plan plan-head">
        <div className="plan-day-head">
          <b>{isToday ? "Today, " : ""}{WEEKDAY[(date.getDay() + 6) % 7]}, {date.getDate()} {MONTHS[date.getMonth()]}
            {!rows.some((r) => r.kind === "training") && <button type="button" className="icon today-pencil plan-pencil" aria-label="Change the training for this date" onClick={() => setEditing(training ?? { work: true, kind: "rest" })}><Pencil size={15} /></button>}
          </b>
          <small>{[tWhen ? tWhen.phrase : training ? "rest day" : null, openCount ? `${openCount} ${openCount === 1 ? "slot" : "slots"} open` : "all slots set"].filter(Boolean).join(" · ")}</small>
        </div>
        <div className="plan-row">
          <div><b>{sum.n ? pdVal(sum.pd) : "—"}</b><small>{target !== null ? `of ${pdText(target)}, ${dayPoss} target` : pdTag()}</small></div>
          <div><b>{fmt(sum.kcal, 0)}</b><small>{band ? `of ${fmt(band.lo, 0)} to ${fmt(band.hi, 0)} kcal` : "kcal"}</small></div>
          <div><b>{fmt(sum.protein, 0)}</b><small>{pr ? `of ${pr.min} to ${pr.max} g protein` : numbers ? `of ${numbers.protein} g protein` : "g protein"}</small></div>
        </div>
        {off && numbers && (
          <div className="plan-off" role="status">
            <p><b>{fmt(off.by, 0)} kcal {off.short ? "under" : "over"}</b> {dayPoss} range of {fmt(off.lo, 0)} to {fmt(off.hi, 0)} kcal. {off.short ? "Add a snack, or make the portions bigger." : "Make the portions smaller, or swap a meal."}</p>
            <button type="button" className="pill pill-small pill-primary" onClick={fitDay}>Fit the portions to {dayName === "today" ? "today" : dayName}</button>
          </div>
        )}
        {pOff && !pOff.above && <div className="plan-off" role="status"><p><b>{fmt(sum.protein, 0)} g of protein</b>, under your range of {pr!.min} to {pr!.max} g. Swap one meal for one with more protein.</p></div>}
        {pOff && pOff.above && <p className="small plan-protein-note" role="status">{fmt(sum.protein, 0)} g of protein, above your range of {pr!.min} to {pr!.max} g. That does no harm. To bring it down, swap one meal for one with less protein.</p>}
        {fitted && <button type="button" className="link plan-usual" onClick={usualDay}>Back to the usual portions</button>}
      </section>
      <section className="card plan-day">
        {rows.map((r) => {
          if (r.kind === "training") return (
            <button type="button" key="training" className="menu-row plan-training" aria-label={`Training at ${r.time}, ${planLine(r.day)}. Change it for this date`} onClick={() => setEditing(r.day)}>
              <span className={`plan-time${r.exact ? "" : " plan-time-word"}`}>{r.exact ? r.label : r.label === "No time set" ? <>No time<br />set</> : r.label}</span>
              <div className="menu-row-text"><small>{changed ? "Changed for this date" : "From my Training week"}</small><b>{planLine({ ...r.day, when: undefined })}{r.day.minutes ? `, ${r.day.minutes} min` : ""}</b>{!r.exact && r.label === "No time set" && <span className="link plan-set-time">Set a time</span>}</div>
              <Pencil size={18} />
            </button>
          );
          const m = held[r.slot.id];
          // a planned meal's mark is its protein; the size of the whole day is the head card's to say (plan-off)
          const fit = m ? fitOf(m, target, unit) : null;
          return (
            <div key={r.slot.id} className={`plan-slot-wrap ${fit?.state === "under" ? "plan-slot-under" : ""}`}>
              {/* R19 (0.2.47, board RS18): a planned meal is a row you tap to see it, swipe to Swap or Empty; the time is in its line */}
              {m && !m.skipped
                ? <PlanRow className="plan-slot plan-slot-set" label={`${r.slot.name}, ${r.slot.time}`} title={m.title} photo={pictureOfRecipe(m.mealId ? p.state.meals.find((x) => x.id === m.mealId) : null)}
                    ariaLabel={`${r.slot.name} at ${r.slot.time}, ${m.title}`}
                    sub={fit ? <>{SOURCE[m.source]}{amountText(m) ? ` · ${amountText(m)}` : ""} · {fmt(m.kcal, 0)} kcal · {fmt(m.protein, 0)} g · {pdText(fit.pd)}{fit.state === "fits" ? <span className="fit-ok"> · fits</span> : fit.state === "close" ? <span className="fit-close"> · {fit.text}</span> : fit.state === "under" ? <span className="fit-under"> · {fit.text}</span> : null}</> : null}
                    onOpen={() => { const rec = m.mealId ? p.state.meals.find((x) => x.id === m.mealId) : null; if (rec) p.openMeal(rec.id, { tab: "plan", slot: { date: key, slotId: r.slot.id, name: r.slot.name, time: r.slot.time } }); else if (m.items?.length) setViewing(r.slot); else setOpen(r.slot); }}
                    onSwap={() => setOpen(r.slot)} onRight={() => p.fill(key, r.slot.id, null)} rightLabel="Empty" swapName={`Swap ${r.slot.name.toLowerCase()}`} rightName={`Empty ${r.slot.name.toLowerCase()}`} />
                : <button type="button" className={`menu-row plan-slot ${m ? "plan-slot-set" : ""}`} aria-label={m ? `${r.slot.name} at ${r.slot.time}, ${m.title}` : `${r.slot.name} at ${r.slot.time}, pick a meal`} onClick={() => setOpen(r.slot)}>
                    <div className="menu-row-text">
                      <small>{r.slot.name}, {r.slot.time}</small>
                      {m ? <b>{m.title}</b> : <b className="plan-pick">Pick a meal</b>}
                      {m?.skipped && <small className="plan-slot-sub skipped-mark">Skipped on purpose</small>}
                    </div>
                    <ChevronRight size={18} />
                  </button>}
              {/* DT79: a batch recipe in whole pieces; − and + by one, and that count is the usual one */}
              {m && !m.skipped && isBatch(m) && (
                <div className="plan-pieces" role="group" aria-label={`${m.title}: how many`}>
                  <button type="button" className="icon" aria-label={`One ${oneWord(m.unit ?? "portions")} less`} disabled={(m.amount ?? 1) <= 1} onClick={() => p.fill(key, r.slot.id, withPieces(m, (m.amount ?? 1) - 1))}>−</button>
                  <b>{amountText(m)}</b>
                  <button type="button" className="icon" aria-label={`One ${oneWord(m.unit ?? "portions")} more`} disabled={(m.amount ?? 1) >= (m.servings ?? 1)} onClick={() => p.fill(key, r.slot.id, withPieces(m, (m.amount ?? 1) + 1))}>+</button>
                  <small>of the {m.servings} it makes</small>
                </div>
              )}
              {m && fit?.state === "under" && (
                <div className="button-row plan-slot-fix">
                  <button type="button" className="pill pill-small pill-primary" onClick={() => p.fillOnPlate({ ...fillingOf(r.slot), mealId: m.mealId }, m.items ? { id: m.mealId ?? "", title: m.title, items: m.items, portion: (m.portion ?? 0) * (m.amount ?? 1), savedAt: "" } : null, m.title)}>Fit it on the Plate</button>
                  <button type="button" className="pill pill-small" onClick={() => p.openOut()}>Ask {CHEF_NAME}</button>
                </div>
              )}
            </div>
          );
        })}
        {/* SL2: the day's settings sit with the day, as links, one per line */}
        <div className="plan-card-links">
          <button type="button" className="link" onClick={() => p.openMenu("life")}>Slots and times ›</button>
          <button type="button" className="link" onClick={() => p.openMenu("week")}>Training week ›</button>
        </div>
      </section>
      {openCount > 0 && <button type="button" className="pill pill-tall pill-primary plan-fill" onClick={() => p.openOut("fill")}><ChefHat size={18} /> Fill the open slots with {CHEF_NAME}</button>}
      </>)}
      <button type="button" className="pill pill-wide plan-shop" onClick={() => setShopping(true)}><ShoppingBasket size={18} /> {shopOpen ? `Shopping list ${shopOpen.n}, open` : "Make a shopping list"}</button>
      {shopping && <ShopSheet p={p} close={() => setShopping(false)} showDay={(d) => { setShopping(false); const n = Math.floor((isoWeek(new Date(`${d}T12:00:00`)).monday.getTime() - thisMonday.getTime()) / (7 * 864e5)); setOffsetState(n === 1 ? 0 : n); setPicked(d); }} />}
      {viewing && held[viewing.id]?.items?.length ? <MealSheet p={p} slot={viewing} m={held[viewing.id]} dayName={dayName} target={target} unit={unit}
        close={() => setViewing(null)} swap={() => { setOpen(viewing); setViewing(null); }}
        onPlate={() => { const m = held[viewing.id]; setViewing(null); p.fillOnPlate(fillingOf(viewing), { id: "", title: m.title, items: m.items!, portion: (m.portion ?? 0) * (m.amount ?? 1), savedAt: "" }, m.title); }}
        keep={() => { const m = held[viewing.id]; const meal = { id: uid(), title: m.title, items: m.items!, portion: m.portion ?? m.items!.reduce((n, i) => n + i.grams, 0), savedAt: new Date().toISOString() };
          p.setState((st) => ({ ...st, meals: [...st.meals, meal] })); p.fill(key, viewing.id, { ...m, mealId: meal.id, source: "mine", note: undefined }); setViewing(null); p.notify(`${m.title} is in My recipes.`); }} /> : null}
      {editing && (
        <div className="sheet-backdrop" onClick={() => setEditing(null)}>
          <div className="sheet date-sheet" role="dialog" aria-label={`${WEEKDAY[(date.getDay() + 6) % 7]}, ${date.getDate()} ${MONTHS[date.getMonth()]}: training`} onClick={(e) => e.stopPropagation()}>
            <div className="card-top"><span>{WEEKDAY[(date.getDay() + 6) % 7]}, {date.getDate()} {MONTHS[date.getMonth()]}: training</span><button type="button" className="link" onClick={() => setEditing(null)}>Close</button></div>
            <p className="small date-sheet-why">This date only. Your Training week stays the same.</p>
            <section className="card seg">
              <DayEditor minor={minor} weekdays={weekdaysOf(lifestyle)} peOn={!!lifestyle.peWeek && lifestyle.peWeek !== "none"} value={editing} onChange={setEditing} workHint={workHintOf(lifestyle, minor)} />
            </section>
            <div className="actions date-sheet-actions">
              <button type="button" className="pill pill-primary action-main" onClick={() => { p.setDated(date, editing); setEditing(null); p.notify(`Changed for ${dayName === "today" ? "today" : `${dayName}, ${date.getDate()} ${MONTHS[date.getMonth()]}`} only.`); }}>Save for this date</button>
              {changed && <button type="button" className="link action-cancel" onClick={() => { p.setDated(date, null); setEditing(null); }}>Back to the usual {WEEKDAY[(date.getDay() + 6) % 7]}</button>}
            </div>
          </div>
        </div>
      )}
      {open && <PickSheet p={p} slot={open} slots={slots} day={numbers} planned={held} target={target} unit={unit} held={held[open.id]} close={() => setOpen(null)} put={(m) => put(open, m)} onPlate={(meal) => { setOpen(null); p.fillOnPlate(fillingOf(open), meal); }} clear={() => { p.fill(key, open.id, null); setOpen(null); }} />}
    </>
  );
}

// A past date (canvas board TW, TW5): the day's numbers against its target, what was eaten with Cook again, and whether the
// day was lived by the plan (every planned meal closed, protein at least 90 %, energy within 10 %).
function PastDay({ p, date, dayKey, line, slots, numbers }: { p: AppApi; date: Date; dayKey: string; line: string; slots: Slot[]; numbers: { kcal: number; protein: number } | null }) {
  const log = dayLog(p.state.feedback, date);
  const rec = dayRecord(slots, p.planned[dayKey], log.logged, dayKey);
  const lived = livedByPlan({ planned: rec.planned, open: rec.open.length, kcal: rec.kcal, protein: rec.protein }, numbers).lived;
  const slotName = (id?: string) => slots.find((s) => s.id === id)?.name;
  return (
    <section className="card plan-day plan-past">
      <div className="plan-day-head">
        <b>{WEEKDAY[(date.getDay() + 6) % 7]}, {date.getDate()} {MONTHS[date.getMonth()]}</b>
        <small>{line}</small>
      </div>
      {log.logged.length ? (
        <>
          <div className="past-nums">
            <span><b>{Math.round(log.kcal).toLocaleString("en")}</b><small>{numbers ? `of ${numbers.kcal.toLocaleString("en")} kcal` : "kcal"}</small></span>
            <span><b>{Math.round(log.protein)}</b><small>{numbers ? `of ${numbers.protein} g protein` : "g protein"}</small></span>
            <span><b>{log.kcal ? (Math.round((log.protein / log.kcal) * 1000) / 10).toFixed(1) : "–"}</b><small>PD that day</small></span>
          </div>
          <small className="setting-name past-label">What you ate</small>
          {log.logged.map((f) => {
            const a = aggregate(f.meal.items);
            const name = slotName(f.slot?.slotId);
            return (
              <div className="past-plate" key={f.id}>
                <span><b>{f.meal.title}</b><small>{name ? `${name}, ` : ""}{new Date(f.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} · {Math.round(a.calories ?? 0)} kcal · {Math.round(a.protein ?? 0)} g protein</small></span>
                <button type="button" className="pill pill-small" onClick={() => { p.setState((s) => ({ ...s, items: f.meal.items.map((it) => ({ ...it, id: uid() })) })); p.setTab("journey"); }}>Cook again</button>
              </div>
            );
          })}
          {lived && <small className="past-lived">✓ A day lived by the plan</small>}
        </>
      ) : <small className="setting-hint past-none">Nothing was logged on this day.</small>}
    </section>
  );
}

// The shopping lists (0.2.60 board SL1; 0.2.61 board SL3): a list is saved, named and dated, for the days you pick. One is open
// at a time; tap a food when it is in the basket; Finish the list asks about the foods not ticked. Earlier lists stay readable.
const DAY_CHOICES = [1, 3, 7];
function ShopSheet({ p, close, showDay }: { p: AppApi; close: () => void; showDay: (date: string) => void }) {
  // the list follows the plan when it opens: a short meal the plan has already changed is not short (0.2.65)
  const [store, setStore] = useState<ShopStore>(() => { const s0 = getStore(), s1 = followPlan(s0, p.planned); if (s1 !== s0) putStore(s1); return s1; });
  const save = (s: ShopStore) => { putStore(s); setStore(s); };
  const [reading, setReading] = useState<number | null>(null);
  const [asking, setAsking] = useState(false);
  const [span, setSpan] = useState(7);
  const today = ymd(new Date());
  const open = openList(store);
  const dt = (d: string) => new Date(`${d}T12:00:00`);
  const dayWord = (d: string) => `${WEEKDAY[(dt(d).getDay() + 6) % 7]} ${dt(d).getDate()}`;
  const spanOf = (from: string, to: string) => from === to ? `${dayWord(from)} ${MONTHS[dt(from).getMonth()]}` : `${dayWord(from)}${dt(from).getMonth() === dt(to).getMonth() ? "" : ` ${MONTHS[dt(from).getMonth()]}`} to ${dayWord(to)} ${MONTHS[dt(to).getMonth()]}`;
  const madeOn = (iso: string) => { const d = new Date(iso); return `${WEEKDAY[(d.getDay() + 6) % 7]} ${d.getDate()} ${MONTHS[d.getMonth()]}`; };
  const start = nextStart(store, today, p.planned);
  const days = daysFrom(start, span);
  const cookOf = (id: string) => p.state.meals.find((x) => x.id === id)?.cook?.n;
  const preview = shoppingList(notCounted(store, p.planned, days), days, cookOf);
  const nextN = store.lists.reduce((m, x) => Math.max(m, x.n), 0) + 1;
  const shown = reading !== null ? store.lists.find((l) => l.n === reading) ?? null : open;
  // SL4: what each food is for, and the list meal by meal; a tap goes to buy, in the basket, not this time
  const [by, setBy] = useState<"food" | "meal">("food");
  const slotName = (date: string, slot: string) => slotsOn(lifestyleOf(p.personal), p.personal.timesOn, date).find((x) => x.id === slot)?.name ?? slot.charAt(0).toUpperCase() + slot.slice(1);
  const short = (d: string) => DAYS[(dt(d).getDay() + 6) % 7];
  const forWhat = (x: ShopLine) => {
    if (!x.uses?.length) return `${x.meals} ${x.meals === 1 ? "meal" : "meals"}`;
    // one part per meal and slot: Sarma: Wed, Fri lunch
    const parts = [...new Set(x.uses.map((u) => `${u.title}\u0000${slotName(u.date, u.slot).toLowerCase()}`))];
    return parts.map((k) => { const [t, sl] = k.split("\u0000"); return `${t}: ${x.uses!.filter((u) => u.title === t && slotName(u.date, u.slot).toLowerCase() === sl).map((u) => short(u.date)).join(", ")} ${sl}`; }).join(" · ");
  };
  const row = (l: SavedList, x: ShopLine, live: boolean, grams = x.grams, note = true) => {
    const st = stateOf(l, x.key);
    return (
      <button key={x.key} type="button" className={`menu-row shop-row ${st === "got" ? "got" : st === "missing" ? "missing" : ""}`} aria-label={`${x.name}, ${shopAmount(x.name, grams)}${st === "got" ? ", in the basket" : st === "missing" ? ", not this time" : ""}`} disabled={!live} onClick={() => save(tickIn(store, l.n, x.key))}>
        {st === "got" ? <CircleCheck size={20} /> : st === "missing" ? <CircleSlash size={20} /> : <Circle size={20} />}
        <div className="menu-row-text"><b>{x.name}</b>{note && <small>{x.added ? "Added · " : ""}{x.cooked ? `${x.cooked.toLocaleString("en")} g cooked · ` : ""}{x.brand && !/typical values|generic|check your|estimate/i.test(x.brand) ? `${x.brand} · ` : ""}{forWhat(x)}</small>}{st === "missing" && <small className="shop-missing-note">Not this time</small>}</div>
        <b className="shop-grams">{shopAmount(x.name, grams)}</b>
      </button>
    );
  };
  const copy = async (l: SavedList) => { try { await navigator.clipboard.writeText(listText(l, spanOf(l.from, l.to))); p.notify("The list is copied. Paste it in a message or a note."); } catch { p.notify("Copying didn't work on this phone."); } };
  const finish = (l: SavedList, carry: boolean) => { save(finishList(store, l.n, carry, new Date().toISOString())); setAsking(false); p.notify(`Shopping list ${l.n} is finished.${carry ? " What wasn't ticked waits for the next list." : ""}`); };
  return (
    <div className="sheet-backdrop" onClick={close}>
      <div className="sheet date-sheet shop-sheet" role="dialog" aria-label="Shopping lists" onClick={(e) => e.stopPropagation()}>
        <div className="card-top"><span>{reading !== null ? <button type="button" className="link" onClick={() => setReading(null)}>‹ Shopping lists</button> : "Shopping lists"}</span><button type="button" className="link" onClick={close}>Close</button></div>
        {shown ? (<>
          <b className="shop-title">Shopping list {shown.n}</b>
          <p className="small shop-why">Made {madeOn(shown.madeAt)}, for {spanOf(shown.from, shown.to)}: {shown.meals} planned {shown.meals === 1 ? "meal" : "meals"}.{shown.doneAt ? ` Finished ${madeOn(shown.doneAt)}.` : ""}</p>
          {shown.without.length > 0 && <p className="small shop-without">Not on the list, no foods saved: {shown.without.map((w) => `${w.title} (${WEEKDAY[(dt(w.date).getDay() + 6) % 7]})`).join(", ")}.</p>}
          {!shown.doneAt && <p className="small shop-why">Tap a food once when it is in the basket, twice for not this time.</p>}
          {/* SL7: the plan changed for this list's days since it was made: a new meal needs new shopping, whatever the reason */}
          {!shown.doneAt && planChanges(shown, p.planned).length > 0 && (
            <section className="shop-plan-changed">
              <b>The plan changed since this list was made</b>
              {planChanges(shown, p.planned).map((c) => <small key={`${c.date}${c.slot}${c.kind}`}>{WEEKDAY[(dt(c.date).getDay() + 6) % 7]} {slotName(c.date, c.slot).toLowerCase()}: {c.kind === "new" ? `${c.title}, new` : c.kind === "changed" ? `${c.title}, in place of ${c.was}` : `${c.title}, no longer planned`}</small>)}
              <div className="button-row"><button type="button" className="pill pill-small" onClick={() => { const n = planChanges(shown, p.planned); save(updateList(getStore(), shown.n, p.planned, new Date().toISOString()));
                p.notify(`Shopping list ${shown.n} is updated: ${n.length} ${n.length === 1 ? "meal" : "meals"} changed in the plan.`); }}>Update the list</button></div>
            </section>
          )}
          {shown.updatedAt && !shown.doneAt && planChanges(shown, p.planned).length === 0 && <p className="small shop-why">Updated {madeOn(shown.updatedAt)} to follow the plan.</p>}
          {/* SL6: what was changed from this list stays said here (the person picked it from Chef Mealan's ideas), with the way to the day */}
          {(shown.changes ?? []).length > 0 && (
            <section className="shop-changed">
              <b>Changed from this list</b>
              {(shown.changes ?? []).map((c) => (
                <div key={`${c.date}${c.slot}`} className="shop-changed-row">
                  <small>{WEEKDAY[(dt(c.date).getDay() + 6) % 7]} {slotName(c.date, c.slot).toLowerCase()} is now {c.to}{c.from ? `, in place of ${c.from}` : ""}{c.because?.length ? `, because you marked ${c.because.join(", ").toLowerCase()} Not this time` : ""}. You picked it from {CHEF_NAME}'s ideas. This day only.</small>
                  <button type="button" className="link" onClick={() => showDay(c.date)}>See it in Plan ›</button>
                </div>
              ))}
            </section>
          )}
          {shortMeals(shown).length > 0 && (
            <section className="shop-short-box">
              <p className="small shop-short">Not this time: {[...new Set(shortMeals(shown).flatMap((m) => m.foods))].join(", ")}. Short now: {shortMeals(shown).map((m) => `${WEEKDAY[(dt(m.date).getDay() + 6) % 7]} ${slotName(m.date, m.slot).toLowerCase()}, ${m.title}`).join("; ")}.</p>
              {/* SL5: Chef Mealan helps each short meal, from here */}
              {!shown.doneAt && shortMeals(shown).map((m) => {
                const label = `${WEEKDAY[(dt(m.date).getDay() + 6) % 7]} ${slotName(m.date, m.slot).toLowerCase()}`;
                return <ShortHelp key={`${m.date}${m.slot}`} p={p} list={shown.n} date={m.date} slot={m.slot} label={label} title={m.title} missing={m.foods}
                  onUsed={(title, foods) => { const before = new Set(shown.lines.map((x) => x.key)); const next = replanMeal(getStore(), shown.n, m.date, m.slot, title, foods, m.title, m.foods); save(next);
                    const added = (openList(next)?.lines ?? []).filter((x) => x.added && !before.has(x.key)).map((x) => x.name);
                    p.notify(`${label} is now ${title}.${added.length ? ` ${added.join(", ")} ${added.length === 1 ? "is" : "are"} on your list.` : ""}`); }} />;
              })}
            </section>
          )}
          {shown.lines.some((x) => x.uses?.length) && (
            <div className="segments shop-by" role="tablist" aria-label="Show the list">
              <button type="button" role="tab" aria-selected={by === "food"} className={`seg ${by === "food" ? "on" : ""}`} onClick={() => setBy("food")}>By food</button>
              <button type="button" role="tab" aria-selected={by === "meal"} className={`seg ${by === "meal" ? "on" : ""}`} onClick={() => setBy("meal")}>By meal</button>
            </div>
          )}
          {shown.carried.length > 0 && (<><small className="pick-group">From list {shown.carriedFrom}</small><div className="menu-list shop-list">{shown.carried.map((x) => row(shown, x, !shown.doneAt))}</div></>)}
          {by === "food" ? (<>
            {shown.carried.length > 0 && shown.lines.length > 0 && <small className="pick-group">For these days</small>}
            {shown.lines.length > 0 && <div className="menu-list shop-list">{shown.lines.map((x) => row(shown, x, !shown.doneAt))}</div>}
          </>) : daysFrom(shown.from, Math.round((dt(shown.to).getTime() - dt(shown.from).getTime()) / 864e5) + 1).map((d) => {
            const order = slotsOn(lifestyleOf(p.personal), p.personal.timesOn, d).map((x) => x.id), at = (id: string) => { const i = order.indexOf(id); return i < 0 ? 99 : i; };
            const meals = byMeal(shown).filter((m) => m.date === d).sort((a, b) => at(a.slot) - at(b.slot)), none = shown.without.filter((w) => w.date === d);
            if (!meals.length && !none.length) return null;
            return (
              <div key={d} className="shop-day">
                <small className="pick-group">{WEEKDAY[(dt(d).getDay() + 6) % 7]} {dt(d).getDate()} {MONTHS[dt(d).getMonth()]}</small>
                {meals.map((m) => {
                  const miss = m.foods.filter((f) => stateOf(shown, f.line.key) === "missing").map((f) => f.line.name);
                  return (
                    <div key={m.slot} className="menu-list shop-list shop-meal">
                      <div className="shop-meal-head"><b>{slotName(d, m.slot)} · {m.title}</b>{miss.length > 0 && <small className="shop-missing-note">Short: {miss.join(", ")}</small>}</div>
                      {m.foods.map((f) => row(shown, f.line, !shown.doneAt, f.grams, false))}
                    </div>
                  );
                })}
                {none.map((w) => <p key={w.title} className="small shop-without">{w.title}: no foods saved.</p>)}
              </div>
            );
          })}
          {!shown.doneAt && (asking ? (
            <section className="card shop-ask">
              <b>{notTicked(shown).length} {notTicked(shown).length === 1 ? "food isn't" : "foods aren't"} ticked. Carry {notTicked(shown).length === 1 ? "it" : "them"} to the next list?</b>
              <div className="moments"><button type="button" className="choice" onClick={() => finish(shown, true)}>Carry {notTicked(shown).length === 1 ? "it" : "them"}</button><button type="button" className="choice" onClick={() => finish(shown, false)}>Leave {notTicked(shown).length === 1 ? "it" : "them"}</button></div>
            </section>
          ) : (<>
            <div className="button-row"><button type="button" className="pill pill-small" onClick={() => copy(shown)}>Copy the list</button></div>
            <button type="button" className="pill pill-wide pill-primary shop-finish" onClick={() => (notTicked(shown).length ? setAsking(true) : finish(shown, false))}>Finish the list</button>
          </>))}
        </>) : (<>
          <b className="shop-title">Shopping list {nextN}</b>
          <p className="small shop-why">Which days is it for? It starts {start === today ? "today" : `${dayWord(start)} ${MONTHS[dt(start).getMonth()]}`}{store.lists.some((l) => l.to >= start) ? ", with the planned meals no list has counted yet" : start === today ? "" : store.lists.length ? ", the day after your last list" : ", the first day with meals planned"}.</p>
          <div className="moments" role="group" aria-label="Days">{DAY_CHOICES.map((n) => <button key={n} type="button" className={`choice ${span === n ? "on" : ""}`} onClick={() => setSpan(n)}>{n === 1 ? "1 day" : `${n} days`}</button>)}</div>
          <p className="small shop-why">{spanOf(days[0], days[days.length - 1])}: {preview.meals} planned {preview.meals === 1 ? "meal" : "meals"}, {preview.lines.length} {preview.lines.length === 1 ? "food" : "foods"}{store.carry ? `, plus ${store.carry.lines.length} from list ${store.carry.from}` : ""}.</p>
          {/* DT79: a batch recipe is bought whole */}
          {(preview.batches ?? []).map((b) => <p key={b.title} className="small shop-why shop-batch">{b.cook ? <>{b.title}: cook {b.cook}, for the {b.pieces} planned.{b.cook - b.pieces > 0 ? ` ${b.cook - b.pieces} left over.` : ""}</> : <>{b.title}: {b.batches === 1 ? "one batch" : `${b.batches} batches`} of {b.n}, for the {b.pieces} planned.{b.batches * b.n - b.pieces > 0 ? ` ${b.batches * b.n - b.pieces} left over.` : ""}</>}</p>)}
          <button type="button" className="pill pill-wide pill-primary shop-make" disabled={!preview.lines.length && !store.carry} onClick={() => save(makeList(store, p.planned, days, new Date().toISOString(), cookOf))}>Make shopping list {nextN}</button>
        </>)}
        {reading === null && store.lists.some((l) => l.doneAt) && (<>
          <small className="pick-group">Earlier lists</small>
          <div className="menu-list shop-earlier">{store.lists.filter((l) => l.doneAt).map((l) => (
            <button key={l.n} type="button" className="menu-row" onClick={() => setReading(l.n)}>
              <div className="menu-row-text"><b>Shopping list {l.n}</b><small>{spanOf(l.from, l.to)} · {l.lines.length + l.carried.length} foods · finished {madeOn(l.doneAt!)}</small></div><ChevronRight size={18} />
            </button>))}</div>
        </>)}
      </div>
    </div>
  );
}

// SL6 (0.2.64): a meal in the plan with its foods but no recipe behind it, changed from a shopping list: what it is,
// why it is there, its foods and numbers; Make it on the Plate, Save in My recipes, or Swap it
function MealSheet({ p, slot, m, dayName, target, unit, close, swap, onPlate, keep }: { p: AppApi; slot: Slot; m: PlannedMeal; dayName: string; target: number | null; unit: "pd" | "pct"; close: () => void; swap: () => void; onPlate: () => void; keep: () => void }) {
  const portion = plannedPortion(m, "view", "");
  const fit = fitOf(m, target, unit);
  return (
    <div className="sheet-backdrop" onClick={close}>
      <div className="sheet date-sheet meal-view" role="dialog" aria-label={`${slot.name}, ${m.title}`} onClick={(e) => e.stopPropagation()}>
        <div className="card-top"><span>{dayName === "today" ? "Today" : dayName.charAt(0).toUpperCase() + dayName.slice(1)}, {slot.name.toLowerCase()}, {slot.time}</span><button type="button" className="link" onClick={close}>Close</button></div>
        <b className="shop-title">{m.title}</b>
        {/* DT76: a starter says what it is and how much of it, then the foods to weigh, eggs and bananas counted */}
        <p className="small shop-why">{m.note ?? (m.source === "starter" ? `${CHEF_NAME}'s starter${amountText(m) ? `, ${amountText(m)}` : ", one portion"}. These are the foods to weigh.` : "This day only. No recipe stands behind it.")}</p>
        <div className="menu-list shop-list">
          {(portion?.items ?? []).map((i) => {
            const c = countOf(i), cl = c ? countLabel(c, i.grams) : null;
            return (
              <div key={i.id} className="menu-row meal-view-row"><div className="menu-row-text"><b>{i.food.name}</b>{i.food.source === "estimate" && <small>{CHEF_NAME}'s estimate</small>}{cl && <small>{cl.small}</small>}</div><b className="shop-grams">{cl ? cl.main : `${Math.round(i.grams)} g`}</b></div>
            );
          })}
        </div>
        <p className="small meal-view-nums">{fmt(m.kcal, 0)} kcal · {fmt(m.protein, 0)} g protein · {pdText(fit.pd)}{fit.state === "fits" ? <span className="fit-ok"> · fits</span> : fit.state === "close" ? <span className="fit-close"> · {fit.text}</span> : fit.state === "under" ? <span className="fit-under"> · {fit.text}</span> : null}</p>
        <div className="button-row"><button type="button" className="pill pill-small" onClick={swap}>Swap</button><button type="button" className="pill pill-small" onClick={keep}>Save in My recipes</button></div>
        <button type="button" className="pill pill-wide pill-primary meal-view-make" onClick={onPlate}>Make it on the Plate</button>
      </div>
    </div>
  );
}

// the sheet for a slot: what it needs, then My recipes, Coach's recipes and the starters, each with its PD mark on the right
function PickSheet({ p, slot, slots, day, planned, target, unit, held, close, put, onPlate, clear }: { p: AppApi; slot: Slot; slots: Slot[]; day: { kcal: number; protein: number } | null; planned: Record<string, PlannedMeal>; target: number | null; unit: "pd" | "pct"; held?: PlannedMeal; close: () => void; put: (m: PlannedMeal) => void; onPlate: (meal: import("../pilot").Meal | null) => void; clear: () => void }) {
  // DT74: what this slot has left once the other slots' meals are counted
  const need = leftOf(slots, slot, day, planned);
  const othersSet = slots.some((s) => s.id !== slot.id && planned[s.id]);
  // DT75: the marks are judged against what is left: its PD, not the day's. Protein already covered: any meal fits.
  const leftPd = need && need.kcal > 0 ? (need.protein > 0 ? density(need.protein, need.kcal) : 0) : target;
  // DT79: a batch recipe comes in the pieces closest to what this slot has left, 4 sarmas
  const sized = (m: PlannedMeal) => (isBatch(m) ? withPieces(m, piecesFor(m, need), false) : m);
  const mine = p.state.meals.filter((m) => m.from !== "coach").map((m) => ({ meal: m, planned: sized(fromMeal(m, "mine")) }));
  const coach = p.state.meals.filter((m) => m.from === "coach").map((m) => ({ meal: m, planned: sized(fromMeal(m, "coach")) }));
  // R20 (0.2.48, board RS19, R20d): a meal with a clear answer says so where you pick it
  const reads = carryReads(p.state.meals, p.state.feedback);
  const row = (m: PlannedMeal, k: string, pick: () => void) => {
    const fit = fitOf(m, leftPd, unit);
    const read = m.mealId ? reads.get(m.mealId)?.read : null;
    return (
      <button key={k} type="button" className="menu-row pick-row" onClick={pick}>
        <div className="menu-row-text"><b>{m.title}</b><small>{isBatch(m) ? `${amountText(m)} · ` : ""}{fmt(m.kcal, 0)} kcal · {fmt(m.protein, 0)} g protein</small>{read && <small className={read === "light" ? "carry-light" : "carry-heavy"}>{read === "light" ? "Light for you" : "Heavy for you"}</small>}</div>
        <div className={`pick-pd ${fit.state}`}><b>{unit === "pct" ? `${pdVal(fit.pd)} %` : `PD ${pdVal(fit.pd)}`}</b><small>{fit.text}</small></div>
      </button>
    );
  };
  const group = (title: string, rows: ReactElement[]) => rows.length ? <><small className="pick-group">{title}</small><div className="menu-list pick-list">{rows}</div></> : null;
  return (
    <div className="sheet-backdrop" onClick={close}>
      <div className="sheet pick-sheet" role="dialog" aria-label={`${slot.name}, ${slot.time}`} onClick={(e) => e.stopPropagation()}>
        <div className="card-top"><span>{slot.name}, {slot.time}</span><button type="button" className="link" onClick={close}>Close</button></div>
        <p className="small pick-why">{held ? `${held.title} is in this slot. Tap another meal to swap it.` : "Tap a meal to put it in this slot."}{need ? othersSet ? need.kcal <= 0 ? " The other meals planned already reach the day's kcal." : need.protein <= 0 ? ` With the other meals planned, the day's protein is covered. It has about ${fmt(need.kcal, 0)} kcal left.` : ` With the other meals planned, it has about ${fmt(need.kcal, 0)} kcal and ${need.protein} g of protein left, ${pdText(leftPd)}.` : ` It needs about ${fmt(need.kcal, 0)} kcal and ${need.protein} g of protein, ${pdText(leftPd)}.` : ""}</p>
        {group("My recipes", mine.map((x) => row(x.planned, x.meal.id, () => put(x.planned))))}
        {group("Coach's recipes", coach.map((x) => row(x.planned, x.meal.id, () => put(x.planned))))}
        {group(`${CHEF_NAME}'s starters`, STARTERS.map((m) => row(m, m.title, () => put(m))))}
        <button type="button" className="pill pill-wide pick-plate" onClick={() => onPlate(null)}><ChefHat size={18} /> Create a new meal on the Plate</button>
        {held && <button type="button" className="pill pill-wide" onClick={clear}>Empty this slot</button>}
      </div>
    </div>
  );
}
