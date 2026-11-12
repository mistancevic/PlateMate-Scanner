import { useState, type ReactNode } from "react";
import { w, wn } from "../words";
import { countOf, type DeletePlan } from "../recipeDelete";

// IM22, IM22b (0.2.22, canvas board Parts02, row 4): Delete recipe says what goes, what others still see, and what stays,
// before anything goes. Take it back from Members and Take the live page down are ticked; untick one to keep it.
export type DeleteChoice = { members: boolean; page: boolean };
const Li = ({ ok, children }: { ok?: boolean; children: ReactNode }) => <div className="dl-li"><i aria-hidden>{ok ? "✓" : "✕"}</i><span>{children}</span></div>;
function Check({ on, set, label, sub }: { on: boolean; set: (v: boolean) => void; label: string; sub: string }) {
  return (
    <label className="dl-check">
      <input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} />
      <span>{label}<small>{sub}</small></span>
    </label>
  );
}
export function DeleteRecipe({ plan, slug, approver, run }: { plan: DeletePlan; slug: string | null; approver: string; run: (c: DeleteChoice) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState(true), [page, setPage] = useState(true);
  const [busy, setBusy] = useState(false), [err, setErr] = useState("");
  if (!open) return <button className="pill pill-wide pill-danger-line rq-delete" onClick={() => setOpen(true)}>{w("delrecipe.deleteRecipe")}</button>;
  const Approver = approver.charAt(0).toUpperCase() + approver.slice(1);
  const pageTick = plan.page === "live" || plan.page === "live+waiting" || plan.page === "waiting";
  const others = plan.members || pageTick;
  const stays = plan.eaten > 0 || plan.left > 0 || plan.foods > 0;
  const go = async () => {
    setBusy(true); setErr("");
    try { await run({ members, page }); } catch (e: any) { setErr(e?.message || w("delrecipe.itCouldnTBeDeleted")); setBusy(false); }
  };
  return (
    <section className="card dl-card" aria-label={w("delrecipe.deleteTitle", { title: plan.title })}>
      <b>{w("delrecipe.deleteTitleAsk", { title: plan.title })}</b>
      <div className="dl-h">{w("delrecipe.goesWithIt")}</div>
      <Li>{w("delrecipe.theRecipe", { list: plan.recipe.length > 1 ? w("delrecipe.listAnd", { list: plan.recipe.slice(0, -1).join(", "), last: plan.recipe[plan.recipe.length - 1] }) : plan.recipe[0] ?? "" })}</Li>
      {plan.shots > 0 && <Li>{plan.shots === 1 ? w("delrecipe.yourScreenshot") : wn("delrecipe.yourScreenshots", plan.shots)}, {w("delrecipe.fromThisPhone")}</Li>}
      {plan.photos > 0 && <Li>{plan.photos === 1 ? w("delrecipe.itsPhoto") : wn("delrecipe.itsPhotos", plan.photos)}, {w("delrecipe.fromThisPhone")}</Li>}
      {plan.drawn && <Li>{w("delrecipe.thePictureChefDrew")}</Li>}
      {others && <div className="dl-h">{w("delrecipe.seenByOthers")}</div>}
      {plan.members && <Check on={members} set={setMembers} label={w("delrecipe.takeItBackFromMembers")} sub={w("delrecipe.membersWhoKeptACopy")} />}
      {pageTick && (plan.page === "waiting"
        ? <Check on={page} set={setPage} label={w("delrecipe.withdrawItFrom", { who: approver })} sub={w("delrecipe.noLongerSeesIt", { who: Approver })} />
        : <Check on={page} set={setPage} label={w("delrecipe.takeTheLivePageDown")} sub={`${w("delrecipe.stopsShowingIt", { slug: String(slug) })}${plan.page === "live+waiting" ? ` ${w("delrecipe.theVersionWaitingFor", { who: approver })}` : ""}`} />)}
      {stays && <div className="dl-h">{w("delrecipe.stays")}</div>}
      {plan.eaten > 0 && <Li ok>{plan.eaten === 1 ? w("delrecipe.yourMeal") : wn("delrecipe.yourMeals", plan.eaten)} {w("delrecipe.withItOnToday")}</Li>}
      {plan.foods > 0 && <Li ok>{plan.foods === 1 ? w("delrecipe.theFoodItUses") : wn("delrecipe.theFoodsItUses", plan.foods)}, {w("delrecipe.inYourFoods")}</Li>}
      {err && <small className="dl-err" role="alert">{err}</small>}
      <div className="button-row">
        <button className="pill pill-small pill-danger dl-go" disabled={busy} onClick={go}>{busy ? w("delrecipe.deleting") : w("delrecipe.deleteRecipe")}</button>
        <button className="pill pill-small" disabled={busy} onClick={() => { setOpen(false); setErr(""); }}>{w("delrecipe.cancel")}</button>
      </div>
    </section>
  );
}
