import { CalendarDays } from "lucide-react";
import type { AppApi } from "./api";

// Plan decides (0.2, canvas X0 and H): the calendar of the day, slots from Me and the Weekly plan.
// 0.2.0 opens the door only: the page says what it will hold. The slots come in 0.2.1, filling in 0.2.2.
export function PlanScreen(p: AppApi) {
  return (
    <>
      <section className="card plan-empty">
        <div className="card-top"><span><CalendarDays size={18} /> Nothing planned so far</span></div>
        <small>Your plan starts here: the day's meals, slot by slot, from the meals a day you set in Lifestyle and the training in your Weekly plan. Filling the slots comes in the next releases.</small>
        <div className="button-row" style={{ marginTop: 10 }}>
          <button className="pill pill-small" onClick={() => p.openMenu("life")}>Lifestyle</button>
          <button className="pill pill-small" onClick={() => p.openMenu("week")}>Weekly plan</button>
        </div>
      </section>
    </>
  );
}
