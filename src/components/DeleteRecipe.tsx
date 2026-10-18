import { useState, type ReactNode } from "react";
import { CHEF_NAME } from "./Mark";
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
  if (!open) return <button className="link link-danger rq-delete" onClick={() => setOpen(true)}>Delete recipe</button>;
  const Approver = approver.charAt(0).toUpperCase() + approver.slice(1);
  const pageTick = plan.page === "live" || plan.page === "live+waiting" || plan.page === "waiting";
  const others = plan.members || pageTick;
  const stays = plan.eaten > 0 || plan.left > 0 || plan.foods > 0;
  const go = async () => {
    setBusy(true); setErr("");
    try { await run({ members, page }); } catch (e: any) { setErr(e?.message || "It couldn't be deleted. Try again."); setBusy(false); }
  };
  return (
    <section className="card dl-card" aria-label={`Delete ${plan.title}`}>
      <b>Delete {plan.title}?</b>
      <div className="dl-h">GOES WITH IT</div>
      <Li>The recipe: {plan.recipe.length > 1 ? `${plan.recipe.slice(0, -1).join(", ")} and ${plan.recipe[plan.recipe.length - 1]}` : plan.recipe[0]}.</Li>
      {plan.shots > 0 && <Li>{plan.shots === 1 ? "Your screenshot" : `Your ${plan.shots} screenshots`}, from this phone and from your account.</Li>}
      {plan.photos > 0 && <Li>{plan.photos === 1 ? "Its photo" : `Its ${plan.photos} photos`}, from this phone and from your account.</Li>}
      {plan.drawn && <Li>The picture {CHEF_NAME} drew.</Li>}
      {others && <div className="dl-h">SEEN BY OTHERS</div>}
      {plan.members && <Check on={members} set={setMembers} label="Take it back from Members" sub="Members who kept a copy keep theirs." />}
      {pageTick && (plan.page === "waiting"
        ? <Check on={page} set={setPage} label={`Withdraw it from ${approver}`} sub={`${Approver} no longer sees it waiting.`} />
        : <Check on={page} set={setPage} label="Take the live page down" sub={`chefmealan.com/r/${slug} stops showing it.${plan.page === "live+waiting" ? ` The version waiting for ${approver} is withdrawn.` : ""}`} />)}
      {stays && <div className="dl-h">STAYS</div>}
      {plan.eaten > 0 && <Li ok>{plan.eaten === 1 ? "Your meal" : `Your ${plan.eaten} meals`} with it, on Today and in your history: what you ate stays what you ate.</Li>}
      {plan.foods > 0 && <Li ok>{plan.foods === 1 ? "The food it uses" : `The ${plan.foods} foods it uses`}, in your Foods. A food holds nothing personal.</Li>}
      {err && <small className="dl-err" role="alert">{err}</small>}
      <div className="button-row">
        <button className="pill pill-small dl-go" disabled={busy} onClick={go}>{busy ? "Deleting…" : "Delete recipe"}</button>
        <button className="pill pill-small" disabled={busy} onClick={() => { setOpen(false); setErr(""); }}>Cancel</button>
      </div>
    </section>
  );
}
