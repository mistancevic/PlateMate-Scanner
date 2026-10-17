// Members on the Recipes tab (0.2.11, canvas board CO, CO2 to CO4b; Milan 16 October 2026, 15:37 to 16:24).
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
import { CHEF_NAME } from "./Mark";
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

export type Ahead = { name: string; kcal: number; target: number | null };
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
  return share ? { name: slot.name.toLowerCase(), kcal: share.kcal, target: p.dayPd ?? p.pdRef } : null;
}
const byLine = (r: SharedRecipe) => [r.kitchen, r.mine ? "shared by you" : r.name ? `shared by ${r.name}` : "shared by a member", r.made ? `made ${r.made === 1 ? "once" : `${r.made} times`}` : ""].filter(Boolean).join(" · ");
const tag = (r: SharedRecipe) => (r.coverKind === "photo" ? (r.name ? `Photo by ${r.name}` : r.mine ? "Your photo" : "Photo by a member") : `Picture by ${CHEF_NAME}`);

// CO2: the list
export function MembersList({ list, ahead, p, open, loading, error }: { list: SharedRecipe[] | null; ahead: Ahead | null; p: AppApi; open: (id: string) => void; loading: boolean; error: string }) {
  const kitchens = p.personal.kitchens ?? [];
  const [kitchen, setKitchen] = useState<string | null>(null);
  const shown = list ? membersFor(list, { target: ahead?.target ?? null, kitchens, allergies: p.safety.allergies ?? [], kitchen }) : [];
  return (
    <>
      <section className="card mb-head">
        <small className="mb-lead">{ahead
          ? `Recipes members cooked and shared, worked out for your day. ${ahead.name.charAt(0).toUpperCase() + ahead.name.slice(1)} is about ${fmt(ahead.kcal, 0)} kcal${ahead.target !== null ? ` at ${pdText(ahead.target)} or more, so these come first` : ""}.`
          : "Recipes members cooked and shared. Set your goal and every recipe shows your portion."}</small>
        {kitchens.length > 0 && (
          <div className="mb-chips" role="group" aria-label="Kitchens">
            <button className={`choice ${kitchen === null ? "on" : ""}`} onClick={() => setKitchen(null)}>All</button>
            {kitchens.map((k) => <button key={k} className={`choice ${kitchen === k ? "on" : ""}`} onClick={() => setKitchen(kitchen === k ? null : k)}>{k}</button>)}
          </div>
        )}
      </section>
      {loading && !list && <small className="muted">Loading what members shared…</small>}
      {error && <small className="muted">{error}</small>}
      {list && shown.length === 0 && <section className="card recipes-empty"><small>{kitchen ? `Nothing from the ${kitchen} kitchen yet.` : "Nothing shared yet. A recipe of yours can be the first: open it, then Share with members."}</small></section>}
      {shown.map((r) => {
        const x = portionOf(r, ahead?.kcal ?? null);
        const ok = ahead?.target == null || (x.pd !== null && x.pd >= ahead.target - 0.05);
        return (
          <button type="button" className="card recipe-tile" key={r.id} onClick={() => open(r.id)} aria-label={`Open ${r.title}`}>
            {r.cover ? <span className="recipe-tile-cover"><img src={r.cover} alt="" /><span className="tile-drawn">{tag(r)}</span></span> : <div className="recipe-tile-blank"><Utensils size={28} /></div>}
            <div className="recipe-tile-body">
              <div className="card-top"><b className="tile-name">{r.title}</b></div>
              <small>{byLine(r)}</small>
              <small className={`tile-state ${ok ? "live" : "under"}`}>{ahead ? `Your ${ahead.name}: ${fmt(x.grams, 0)} g · ${fmt(x.kcal, 0)} kcal · ${pdText(x.pd)}` : `${fmt(x.grams, 0)} g · ${fmt(x.kcal, 0)} kcal · ${pdText(x.pd)}`}{ok ? "" : `, under your ${pdVal(ahead!.target)}`}</small>
            </div>
          </button>
        );
      })}
    </>
  );
}

// CO3: a member's recipe at your portion; nothing here can be edited
export function MemberPage({ r, ahead, p, owner, close, takeDown }: { r: SharedRecipe; ahead: Ahead | null; p: AppApi; owner: boolean; close: () => void; takeDown: () => void }) {
  useBack(true, close);
  useEffect(() => { log("members", { how: "open" }); }, [r.id]);
  const x = portionOf(r, ahead?.kcal ?? null);
  const steps = r.steps ?? [];
  return (
    <div className="rq">
      <button className="link rq-back" onClick={close}><ChevronLeft size={18} /> Members</button>
      {r.cover ? <figure className="rq-hero"><img src={r.cover} alt={`The cover of ${r.title}`} /><span className="rq-drawn">{tag(r)}</span></figure> : null}
      <h2 className="rq-name rq-name-fixed">{r.title}</h2>
      <small className="muted mb-by">{byLine(r)}{r.made ? " by members" : ""}</small>
      {r.source && <small className="muted mb-by">Adapted from {r.source}</small>}
      {ahead && <small className="mb-yours">Your {ahead.name}: {fmt(x.grams, 0)} g of the {fmt(x.total, 0)} g it makes</small>}
      <div className="rp-stats">
        <span><b>{fmt(x.kcal, 0)}</b><small>kcal</small></span>
        <span><b>{fmt(x.protein, 0)}</b><small>g protein</small></span>
        <span className="wide"><b>{pdText(x.pd)}</b><small>protein density</small></span>
      </div>
      <section className="card rq-foods">
        <b>{ahead ? "Foods for your portion" : "Foods"}</b>
        {x.items.map((it, k) => [it.part && (k === 0 || x.items[k - 1].part !== it.part) ? <div className="rq-part" key={`h${k}`}>{it.part}</div> : null, <div className="sheet-row rq-food" key={it.id}><small>{it.food.name}</small><b>{fmt(it.grams, 0)} g</b></div>])}
      </section>
      <section className="card rq-steps">
        <b>Steps</b>
        {steps.length
          ? <ol className="rp-steps">{steps.map((s, k) => <li key={k}><span>{k + 1}</span><div className="rp-step-text">{stepParts(tempsIn(s), x.items).map((pt, j) => ("text" in pt ? pt.text : <b key={j} className="st-amt">{pt.label}</b>))}</div></li>)}</ol>
          : <small className="muted">The cook shared no steps.</small>}
      </section>
      <button className="pill pill-wide pill-primary" onClick={() => { close(); p.takeMember(r, "make", x.items); }}>Make it</button>
      <small className="muted rq-under">Your portion goes on the Plate: {fmt(x.grams, 0)} g, {fmt(x.kcal, 0)} kcal. Fit to my target can still move it.</small>
      {!r.mine && <><button className="pill pill-wide" onClick={() => { close(); p.takeMember(r, "keep"); }}>Keep in mine</button>
        <small className="muted rq-under">A copy in Mine, to change as you like. {r.name ? `${r.name}'s` : "The cook's"} recipe stays theirs.</small></>}
      {owner && !r.mine && <ConfirmButton className="link link-danger rq-delete" label="Take it down (owner)" confirmLabel="Sure? It goes for every member" onConfirm={takeDown} />}
    </div>
  );
}

// CO4 and CO4b: For members, on a recipe of yours
export function SharePanel({ meal, p, made, onPatch }: { meal: Meal; p: AppApi; made: number | null; onPatch: (patch: Partial<Meal>) => void }) {
  const shared = meal.members ?? null;
  const photos = recipePhotosOf(meal).slice(0, 4);
  const drawnFirst = photos.find((x) => isDrawnPhoto(meal, x));
  const [pick, setPick] = useState<string | null>(shared?.coverSig ?? (drawnFirst ? sig(drawnFirst) : photos[0] ? sig(photos[0]) : null));
  const [named, setNamed] = useState(shared?.named ?? false);
  const kitchens = p.personal.kitchens ?? [];
  const [kitchen, setKitchen] = useState<string | null>(shared?.kitchen ?? meal.kitchen ?? null);
  const [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const name = firstName(p.user?.name) || "you";
  const chosen = photos.find((x) => sig(x) === pick) ?? null;
  const share = async () => {
    setBusy(true); setErr("");
    try {
      const cover = chosen ? await resizeImageBase64(chosen, 640, 480).catch(() => null) : null;
      const recipe = sharedOf(meal, kitchen);
      const r = await fetch("/api/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipe, cover, coverKind: chosen && isDrawnPhoto(meal, chosen) ? "drawn" : "photo", named, name: p.user?.name ?? "" }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Sharing didn't work. Try again.");
      onPatch({ members: { id: d.id, at: d.sharedAt, named, coverSig: pick, kitchen, sent: contentSig(recipe) } });
      log("members", { how: "share" });
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };
  const takeBack = async () => {
    setBusy(true); setErr("");
    try {
      const r = await fetch(`/api/members/${encodeURIComponent(shared!.id)}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Taking it back didn't work. Try again.");
      onPatch({ members: undefined });
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };
  const since = shared ? new Date(shared.at).toLocaleDateString("en-GB", { day: "numeric", month: "long" }) : "";
  const coverWord = shared?.coverSig && photos.some((x) => sig(x) === shared.coverSig && isDrawnPhoto(meal, x)) ? `the picture by ${CHEF_NAME}` : shared?.coverSig ? "your photo" : "no cover";
  return (
    <section className="card mb-share">
      <div className="card-top"><b>For members</b><small className={`mb-state ${shared ? "live" : "none"}`}>{shared ? "Shared" : "Not shared"}</small></div>
      {shared ? (<>
        <small className="muted">Members see it since {since}, as {shared.named ? name : "a member"}, with {coverWord}.{made !== null ? ` Made ${made === 0 ? "0 times so far" : made === 1 ? "once" : `${made} times`}.` : ""} A change you make here reaches them too.</small>
        <div className="button-row"><button className="pill pill-small" disabled={busy} onClick={takeBack}>Take it back</button></div>
        <small className="muted">Take it back removes it from Members; members who kept a copy keep theirs.</small>
      </>) : (<>
        <small className="muted">Members see the cover, the foods, the amounts and the steps, worked out for their own day. Never your notes or your ratings.</small>
        {photos.length > 0 && (<>
          <small className="mb-sub">The cover members see</small>
          <div className="mb-covers">{photos.map((x) => {
            const d = isDrawnPhoto(meal, x), on = sig(x) === pick;
            return <button key={sig(x)} className={`mb-cover ${on ? "on" : ""}`} onClick={() => setPick(sig(x))} aria-pressed={on}><img src={x} alt="" /><small>{on ? "✓ " : ""}{d ? `Picture by ${CHEF_NAME}` : "Your photo"}</small></button>;
          })}</div>
          <small className="muted">Your plate photos stay yours unless you pick one here.</small>
        </>)}
        {kitchens.length > 0 && (<>
          <small className="mb-sub">Its kitchen</small>
          <div className="mb-chips" role="group" aria-label="Its kitchen">{kitchens.map((k) => <button key={k} className={`choice ${kitchen === k ? "on" : ""}`} onClick={() => setKitchen(kitchen === k ? null : k)}>{k}</button>)}</div>
        </>)}
        <label className="mb-switch"><input type="checkbox" role="switch" checked={named} onChange={(e) => setNamed(e.target.checked)} /><span className="mb-knob" aria-hidden="true" />Show my first name</label>
        <small className="muted">{named ? `On: members see it as ${name === "you" ? "yours, by your first name" : `${name}'s`}. Off: as a member's.` : `Off: members see it as a member's. On: as ${name === "you" ? "yours, by your first name" : `${name}'s`}.`}</small>
        <div className="button-row"><button className="pill pill-small pill-primary" disabled={busy} onClick={share}>Share with members</button></div>
      </>)}
      {err && <small className="muted" style={{ color: "var(--low)" }}>{err}</small>}
    </section>
  );
}
