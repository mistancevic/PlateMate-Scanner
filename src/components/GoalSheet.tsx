import { GUIDE_PARTS, guideOf, type Sheet } from "../goalGuide";
import { goalLabel } from "../goal";

// The goal sheet (canvas board K2, 7 October 2026): the same card for the person on Me › Goal and for the coach on the
// client's page. What to eat, what weight to expect, how it's counted, what counts as progress, the next check-in.
export function GoalSheet({ sheet }: { sheet: Sheet }) {
  return (
    <section className="card goal-sheet" aria-label="Your goal sheet">
      <div className="sheet-head"><b>{sheet.title}</b><small>{sheet.byLine}</small></div>
      <div className="sheet-row"><small>Food</small><b>{sheet.food}</b></div>
      <div className="sheet-row"><small>Weight to expect</small><b>{sheet.weight}</b></div>
      <div className="sheet-row"><small>Counted as</small><b>{sheet.counted}</b></div>
      <div className="sheet-row"><small>Progress means</small><b>{sheet.progress}</b></div>
      <div className="sheet-row"><small>Next check-in</small><b>{sheet.checkIn}</b></div>
    </section>
  );
}
// About your goal (canvas board K3): one page per goal
export function GoalGuide({ id }: { id: string }) {
  const g = guideOf(id);
  if (!g) return null;
  return (
    <section className="card guide" aria-label="About your goal">
      <b>{goalLabel(id)}</b>
      {GUIDE_PARTS.map((x) => <div key={x.key}><small className="setting-name">{x.name}</small><p>{g[x.key]}</p></div>)}
    </section>
  );
}
