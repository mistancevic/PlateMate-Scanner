// Members on the Recipes tab (0.2.11, canvas board CO, CO2 to CO4b; Milan 16 October 2026, 15:37 to 16:24).
import { w, wn, wIn, wordV, mealV, dateText, type Val, type WordKey } from "../words";
// a line of its own as a value in another line, in that line's language (or null, and the whole line stays English)
const lineV = (k: WordKey, v?: Record<string, Val>): Val => (l) => wIn(l, k, v);
import { tempsIn } from "../units";
// CO2: the recipes members shared, each at your portion for the meal ahead; at or above your PD target first, then your
// kitchens; your kitchens filter the list. CO3: a member's recipe at your portion, with Make it and Keep in mine.
// CO4 and CO4b: For members on a recipe of yours: the cover members see, your first name only when you switch it on,
// Share with members, and Take it back. Sharing needs no coach's OK; Milan, as owner, can take any recipe down.
import { useEffect, useState } from "react";
import { log } from "../log";
import { ChevronLeft, Utensils } from "lucide-react";
import type { Meal } from "../pilot";
import { fmt, pdText, pdVal } from "../ui";
import { useBack } from "../back";
import { stepParts } from "../steps";
import { recipePhotosOf, sig } from "../photos";
import { isDrawnPhoto } from "../covers";
import { resizeImageBase64 } from "../utils/image";
import { ConfirmButton } from "./Confirm";
import { portionOf, membersFor, sharedOf, contentSig, firstName, type SharedRecipe } from "../members";
import { mealShare, mealNow, closedSlots } from "../makeMeal";
import { answersFor } from "../unlogged";
import { slotsOn } from "../slots";
import { lifestyleOf } from "../personal";
import { dayRecord } from "../record";
import { dayLog } from "../today";
import { ymd } from "../plan";
import type { AppApi } from "../screens/api";
import type { RecipeRow } from "../recipeFilter";

// full: the day is planned or eaten in full, so nothing is left for the meal ahead (0.2.66, Milan 21:14: Dinner is about 0 kcal)
export type Ahead = { name: string; kcal: number; target: number | null; full?: boolean };
// The meal ahead and its size: what is left of the day shared over the meals still to come (the rule of Make it a meal, CH1)
export function aheadOf(p: AppApi): Ahead | null {
  const today = ymd(new Date());
  const slots = slotsOn(lifestyleOf(p.personal), p.personal.timesOn, today);
  const rec = dayRecord(slots, p.planned[today], dayLog(p.state.feedback, new Date()).logged, today);
  const closed = closedSlots(slots, rec, answersFor(today));
  const slot = mealNow(slots, closed, new Date());
  const nums = p.numbersFor(new Date());
  if (!slot || !nums) return null;
  const share = mealShare(slots, slot.id, { kcal: nums.kcal, protein: nums.protein }, { kcal: rec.kcal, protein: rec.protein }, closed);
  return share ? { name: slot.name.toLowerCase(), kcal: share.kcal, target: p.dayPd ?? p.pdRef, ...(share.kcal < 50 ? { full: true } : {}) } : null;
}
export const cooksOf = (list: SharedRecipe[]) => { const n = new Map<string, number>(); for (const r of list) if (r.name && !r.mine) n.set(r.name, (n.get(r.name) ?? 0) + 1); return [...n.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map((x) => x[0]); };
const byLine = (r: SharedRecipe) => [r.kitchen, r.mine ? (r.name ? w("members.sharedByYou") : w("members.sharedByYouWithoutName")) : r.name ? w("members.sharedBy", { name: r.name }) : w("members.sharedByAMember"), r.made ? wn("members.madeTimes", r.made) : ""].filter(Boolean).join(" · ");
const tag = (r: SharedRecipe) => (r.coverKind === "photo" ? (r.name ? w("members.photoBy", { name: r.name }) : r.mine ? w("members.yourPhoto") : w("members.photoByAMember")) : w("members.drawnByChef"));

// the members' list is kept for a minute in the tab (RecipesScreen.loadMembers); a change of yours forgets it
export const MEMBERS_CACHE = "chefmealan-members-list";
export const forgetMembers = () => { try { sessionStorage.removeItem(MEMBERS_CACHE); } catch { /* nothing kept */ } };
// a shared recipe as the bar reads it (DT126, DT126c)
export const rowOfShared = (r: SharedRecipe): RecipeRow => { const w = portionOf(r, null); return { id: r.id, title: r.title, foods: r.items.map((i) => i.food.name), steps: r.steps ?? [], kitchen: r.kitchen ?? null, source: "member", cook: r.name ?? "", at: r.sharedAt ?? "", made: r.made ?? 0, kcal: w.kcal || null, pd: w.pd }; };
// the lead line of the members' group: your portion for the meal ahead (CO2)
export const membersLead = (ahead: Ahead | null) => ahead?.full
  ? w("members.membersRecipesEachAsThe")
  : ahead
  ? w("members.leadForYourDay", { meal: mealV(ahead.name), kcal: fmt(ahead.kcal, 0), first: ahead.target !== null ? lineV("members.leadFirst", { pd: pdText(ahead.target) }) : "" })
  : w("members.membersRecipesSetYourGoal");
// CO2: one tile. DT126c (0.2.106): the Members tab is gone; the tiles sit in the one list under Made by members
export function MemberTile({ r, ahead, open }: { r: SharedRecipe; ahead: Ahead | null; open: (id: string) => void }) {
  const x = portionOf(r, ahead && !ahead.full ? ahead.kcal : null);
  const ok = ahead?.target == null || (x.pd !== null && x.pd >= ahead.target - 0.05);
  return (
    <button type="button" className="card recipe-tile" onClick={() => open(r.id)} aria-label={w("members.open", { title: r.title })}>
      {r.cover ? <span className="recipe-tile-cover"><img src={r.cover} alt="" /><span className="tile-drawn">{tag(r)}</span></span> : <div className="recipe-tile-blank"><Utensils size={28} /></div>}
      <div className="recipe-tile-body">
        <div className="card-top"><b className="tile-name">{r.title}</b></div>
        <small>{byLine(r)}</small>
        <small className={`tile-state ${ok ? "live" : "under"}`}>{ahead && !ahead.full ? w("members.yourMealPortion", { meal: mealV(ahead.name, true), grams: fmt(x.grams, 0), kcal: fmt(x.kcal, 0), pd: pdText(x.pd) }) : ahead?.full ? w("members.wholeRecipePortion", { grams: fmt(x.grams, 0), kcal: fmt(x.kcal, 0), pd: pdText(x.pd) }) : `${fmt(x.grams, 0)} g · ${fmt(x.kcal, 0)} kcal · ${pdText(x.pd)}`}{ok ? "" : w("members.underYour", { pd: pdVal(ahead!.target) })}</small>
      </div>
    </button>
  );
}

// CO3: a member's recipe at your portion; nothing here can be edited
export function MemberPage({ r, ahead, p, owner, close, takeDown, toCook }: { r: SharedRecipe; ahead: Ahead | null; p: AppApi; owner: boolean; close: () => void; takeDown: () => void; toCook?: (name: string) => void }) {
  useBack(true, close);
  useEffect(() => { log("members", { how: "open" }); }, [r.id]);
  const x = portionOf(r, ahead && !ahead.full ? ahead.kcal : null);
  const steps = r.steps ?? [];
  return (
    <div className="rq">
      <button className="link rq-back" onClick={close}><ChevronLeft size={18} /> {w("members.members")}</button>
      {r.cover ? <figure className="rq-hero"><img src={r.cover} alt={w("members.theCoverOf", { title: r.title })} /><span className="rq-drawn">{tag(r)}</span></figure> : null}
      <h2 className="rq-name rq-name-fixed">{r.title}</h2>
      <small className="muted mb-by">{byLine(r)}{r.made ? ` ${w("members.byMembers")}` : ""}</small>
      {r.source && <small className="muted mb-by">{w("members.adaptedFrom", { source: r.source })}</small>}
      {r.name && !r.mine && toCook && <button className="link mb-cook-link" onClick={() => toCook(r.name)}>{w("members.allOfRecipes", { name: r.name })}</button>}
      {ahead && !ahead.full && <small className="mb-yours">{w("members.yourPortionOfTotal", { meal: mealV(ahead.name, true), grams: fmt(x.grams, 0), total: fmt(x.total, 0) })}</small>}
      <div className="rp-stats">
        <span><b>{fmt(x.kcal, 0)}</b><small>{w("members.kcal")}</small></span>
        <span><b>{fmt(x.protein, 0)}</b><small>{w("members.gProtein")}</small></span>
        <span className="wide"><b>{pdText(x.pd)}</b><small>{w("members.proteinDensity")}</small></span>
      </div>
      <section className="card rq-foods">
        <b>{ahead && !ahead.full ? w("members.foodsForYourPortion") : w("members.foods")}</b>
        {x.items.map((it, k) => [it.part && (k === 0 || x.items[k - 1].part !== it.part) ? <div className="rq-part" key={`h${k}`}>{it.part}</div> : null, <div className="sheet-row rq-food" key={it.id}><small>{it.food.name}</small><b>{fmt(it.grams, 0)} g</b></div>])}
      </section>
      <section className="card rq-steps">
        <b>{w("members.steps")}</b>
        {steps.length
          ? <ol className="rp-steps">{steps.map((s, k) => <li key={k}><span>{k + 1}</span><div className="rp-step-text">{stepParts(tempsIn(s), x.items).map((pt, j) => ("text" in pt ? pt.text : <b key={j} className="st-amt">{pt.label}</b>))}</div></li>)}</ol>
          : <small className="muted">{w("members.sharedNoSteps", { name: r.name || wordV("members.theMember") })}</small>}
      </section>
      <button className="pill pill-wide pill-primary" onClick={() => { close(); p.takeMember(r, "make", x.items); }}>{w("members.makeIt")}</button>
      <small className="muted rq-under">{w("members.yourPortionGoesOn", { grams: fmt(x.grams, 0), kcal: fmt(x.kcal, 0) })}</small>
      {!r.mine && <><button className="pill pill-wide" onClick={() => { close(); p.takeMember(r, "keep"); }}>{w("members.keepInMine")}</button>
        <small className="muted rq-under">{w("members.aCopyInMine", { whose: r.name ? lineV("members.nameS", { name: r.name }) : wordV("members.theMemberS") })}</small></>}
      {owner && !r.mine && <ConfirmButton className="pill pill-small pill-danger-line rq-delete" label={w("members.takeItDownOwner")} confirmLabel={w("members.sureItGoesForEvery")} onConfirm={takeDown} />}
    </div>
  );
}

// CO4 and CO4b: For members, on a recipe of yours
export function SharePanel({ meal, p, made, onPatch }: { meal: Meal; p: AppApi; made: number | null; onPatch: (patch: Partial<Meal>) => void }) {
  const shared = meal.members ?? null;
  const photos = recipePhotosOf(meal).filter((x) => !meal.foreignPhotos?.includes(sig(x))).slice(0, 4); // DT130: never a photo that is not yours
  const drawnFirst = photos.find((x) => isDrawnPhoto(meal, x));
  const [pick, setPick] = useState<string | null>(shared?.coverSig ?? (drawnFirst ? sig(drawnFirst) : photos[0] ? sig(photos[0]) : null));
  const [named, setNamed] = useState(shared?.named ?? false);
  // MB1 (0.2.61): one name in Members, unique, checked by the server; asked the first time you share with your name
  const [memberName, setMemberName] = useState<string | null | undefined>(undefined);
  const [typed, setTyped] = useState(""), [check, setCheck] = useState<{ ok: boolean; why: string } | null>(null);
  // asked only when the name matters: the switch on, or a recipe already shared with it (the server allows 30 calls a minute)
  useEffect(() => { if (!named || memberName !== undefined) return; fetch("/api/members/name").then((r) => r.json()).then((d) => { setMemberName(d.name ?? null); if (!d.name) setTyped(firstName(p.user?.name) || ""); }).catch(() => setMemberName(null)); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [named]);
  useEffect(() => {
    if (memberName || !typed.trim()) { setCheck(null); return; }
    const t = setTimeout(() => { fetch(`/api/members/name?check=${encodeURIComponent(typed.trim())}`).then((r) => r.json()).then((d) => setCheck({ ok: Boolean(d.ok), why: d.why || "" })).catch(() => setCheck(null)); }, 350);
    return () => clearTimeout(t);
  }, [typed, memberName]);
  const kitchens = p.personal.kitchens ?? [];
  const [kitchen, setKitchen] = useState<string | null>(shared?.kitchen ?? meal.kitchen ?? null);
  const [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const name = memberName || "you";
  const chosen = photos.find((x) => sig(x) === pick) ?? null;
  const share = async () => {
    setBusy(true); setErr("");
    try {
      if (named && !memberName) {
        const r = await fetch("/api/members/name", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: typed.trim() }) });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || w("members.thatNameDidnTWork"));
        setMemberName(d.name);
      }
      const cover = chosen ? await resizeImageBase64(chosen, 640, 480).catch(() => null) : null;
      const recipe = sharedOf(meal, kitchen);
      const r = await fetch("/api/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipe, cover, coverKind: chosen && isDrawnPhoto(meal, chosen) ? "drawn" : "photo", named, name: p.user?.name ?? "" }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || w("members.sharingDidnTWorkTry"));
      forgetMembers();
      onPatch({ members: { id: d.id, at: d.sharedAt, named, coverSig: pick, kitchen, sent: contentSig(recipe) } });
      log("members", { how: "share" });
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };
  const changeCover = async () => {
    if (!shared) return;
    setBusy(true); setErr("");
    try {
      const cover = chosen ? await resizeImageBase64(chosen, 640, 480).catch(() => null) : null;
      const recipe = sharedOf(meal, shared.kitchen);
      const r = await fetch("/api/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: shared.id, recipe, cover, coverKind: chosen && isDrawnPhoto(meal, chosen) ? "drawn" : "photo", named: shared.named, name: p.user?.name ?? "" }) });
      if (!r.ok) throw new Error(w("members.theCoverDidnTChange"));
      forgetMembers();
      onPatch({ members: { ...shared, coverSig: pick, sent: contentSig(recipe) } });
      p.notify(w("members.membersSeeTheNewCover"));
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };
  const takeBack = async () => {
    setBusy(true); setErr("");
    try {
      const r = await fetch(`/api/members/${encodeURIComponent(shared!.id)}`, { method: "DELETE" });
      if (!r.ok) throw new Error(w("members.takingItBackDidnT"));
      forgetMembers();
      onPatch({ members: undefined });
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };
  const since = shared ? dateText(new Date(shared.at), { day: "numeric", month: "long" }) : "";
  const coverWord = shared?.coverSig && photos.some((x) => sig(x) === shared.coverSig && isDrawnPhoto(meal, x)) ? w("members.thePictureByChef") : shared?.coverSig ? w("members.yourPhotoLower") : w("members.noCover");
  return (
    <section className="card mb-share">
      <div className="card-top"><b>{w("members.forMembers")}</b><small className={`mb-state ${shared ? "live" : "none"}`}>{shared ? w("members.shared") : w("members.notShared")}</small></div>
      {shared ? (<>
        {/* MB4 (0.2.66, Milan 21:14): the cover members see can change; your own photos only when you pick one */}
        {photos.length > 0 && (<>
          <small className="mb-sub">{w("members.theCoverMembersSee")}</small>
          <div className="mb-covers">{photos.map((x) => {
            const d = isDrawnPhoto(meal, x), on = sig(x) === pick;
            return <button key={sig(x)} className={`mb-cover ${on ? "on" : ""}`} onClick={() => setPick(sig(x))} aria-pressed={on}><img src={x} alt="" /><small>{on ? "✓ " : ""}{d ? w("members.drawnByChef") : w("members.yourPhoto")}</small></button>;
          })}</div>
          {pick !== (shared.coverSig ?? null) && <div className="button-row"><button className="pill pill-small" disabled={busy} onClick={changeCover}>{w("members.changeTheCover")}</button></div>}
        </>)}
        <small className="muted">{w("members.seeItSince", { date: since, as: shared.named ? (name === "you" ? wordV("members.you") : name) : wordV("members.aMember"), cover: coverWord })}{made !== null ? ` ${made === 0 ? w("members.madeZeroSoFar") : wn("members.madeLine", made)}` : ""} {w("members.aChangeReachesThem")}</small>
        <div className="button-row"><button className="pill pill-small" disabled={busy} onClick={takeBack}>{w("members.takeItBack")}</button></div>
        <small className="muted">{w("members.takeItBackRemovesIt")}</small>
      </>) : (<>
        <small className="muted">{w("members.membersSeeTheCoverThe")}</small>
        {photos.length > 0 && (<>
          <small className="mb-sub">{w("members.theCoverMembersSee")}</small>
          <div className="mb-covers">{photos.map((x) => {
            const d = isDrawnPhoto(meal, x), on = sig(x) === pick;
            return <button key={sig(x)} className={`mb-cover ${on ? "on" : ""}`} onClick={() => setPick(sig(x))} aria-pressed={on}><img src={x} alt="" /><small>{on ? "✓ " : ""}{d ? w("members.drawnByChef") : w("members.yourPhoto")}</small></button>;
          })}</div>
          <small className="muted">{w("members.yourPlatePhotosStayYours")}</small>
        </>)}
        {kitchens.length > 0 && (<>
          <small className="mb-sub">{w("members.itsKitchen")}</small>
          <div className="mb-chips" role="group" aria-label={w("members.itsKitchen")}>{kitchens.map((k) => <button key={k} className={`choice ${kitchen === k ? "on" : ""}`} onClick={() => setKitchen(kitchen === k ? null : k)}>{k}</button>)}</div>
        </>)}
        <label className="mb-switch"><input type="checkbox" role="switch" checked={named} onChange={(e) => setNamed(e.target.checked)} /><span className="mb-knob" aria-hidden="true" />{w("members.showMyName")}</label>
        {named && memberName === null && (<>
          <small className="mb-sub">{w("members.yourNameInMembers")}</small>
          <input className="mb-name" aria-label={w("members.yourNameInMembers")} value={typed} maxLength={20} onChange={(e) => setTyped(e.target.value)} />
          <small className={check?.ok ? "mb-name-ok" : "muted"}>{check ? (check.ok ? w("members.nameIsFree", { name: typed.trim() }) : check.why) : w("members.oneNamePerMemberSo")}</small>
        </>)}
        <small className="muted">{w(named ? "members.switchOn" : "members.switchOff", { as: name === "you" ? wordV("members.yoursByYourName") : lineV("members.nameS", { name }) })}</small>
        <div className="button-row"><button className="pill pill-small" disabled={busy || (named && memberName === null && !check?.ok)} onClick={share}>{w("members.shareWithMembers")}</button></div>
      </>)}
      {err && <small className="muted" style={{ color: "var(--low)" }}>{err}</small>}
    </section>
  );
}
