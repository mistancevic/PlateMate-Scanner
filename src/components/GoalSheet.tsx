import { GUIDE_PARTS, guideOf, type Sheet } from "../goalGuide";
import { w } from "../words";
import { goalName } from "../goal";

// The goal sheet (canvas board K2, 7 October 2026): the same card for the person on Me › Goal and for the coach on the
// client's page. What to eat, what weight to expect, how it's counted, what counts as progress, the next check-in.
// The goal's name is already right above it on both pages, so the sheet starts with who set it (7 October 2026).
export function GoalSheet({ sheet, title = false }: { sheet: Sheet; title?: boolean }) {
  return (
    <section className="card goal-sheet" aria-label={w("goalsheet.yourGoalSheet")}>
      <div className="sheet-head">{title && <b>{sheet.title}</b>}<small>{sheet.byLine}</small></div>
      <div className="sheet-row"><small>{w("goalsheet.food")}</small><b>{sheet.food}</b></div>
      <div className="sheet-row"><small>{w("goalsheet.weightToExpect")}</small><b>{sheet.weight}</b></div>
      <div className="sheet-row"><small>{w("goalsheet.countedAs")}</small><b>{sheet.counted}</b></div>
      <div className="sheet-row"><small>{w("goalsheet.progressMeans")}</small><b>{sheet.progress}</b></div>
      <div className="sheet-row"><small>{w("goalsheet.nextCheckIn")}</small><b>{sheet.checkIn}</b></div>
    </section>
  );
}
// About your goal (canvas board K3): one page per goal
export function GoalGuide({ id }: { id: string }) {
  const g = guideOf(id);
  if (!g) return null;
  return (
    <section className="card guide" aria-label={w("goalsheet.aboutYourGoal")}>
      <b>{goalName(id)}</b>
      {GUIDE_PARTS.map((x) => <div key={x.key}><small className="setting-name">{x.name}</small><p>{g[x.key]}</p></div>)}
    </section>
  );
}
