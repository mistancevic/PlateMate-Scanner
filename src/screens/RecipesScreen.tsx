import { portionOf } from "../pilot";
import { tasteForReq } from "../tasteChips";
import { Utensils, ChevronRight, Check } from "lucide-react";
import { draftSteps } from "../draftSteps";
import { canDrawCover } from "../covers";
import { equipmentOf } from "../personal";
import type { StepMark } from "../pilot";
import type { Meal } from "../pilot";
import { fmt, pdText } from "../ui";
import type { AppApi, MealFrom } from "./api";
import { showPlanOn } from "./PlanScreen";
import { ymd } from "../plan";
import { useEffect, useRef, useState } from "react";
import { useKept } from "../kept";
import { PublishSheet, unpublishedOf, type Published } from "../components/PublishSheet";
import { localAs, isPreviewHost } from "../recipes";
import { useMetricsOwner } from "./MenuScreen";
import { resizeImageBase64 } from "../utils/image";
import { RecipePage, type PubState } from "../components/RecipePage";
import { fromDraft } from "../steps";
import { recipePhotosOf, recipeHasPhotos, sig } from "../photos";
import { coverIsDrawn } from "../covers";
import { CHEF_NAME } from "../components/Mark";
import { MembersList, MemberPage, SharePanel, aheadOf } from "../components/Members";
import { sharedOf, contentSig, type SharedRecipe } from "../members";
import { DeleteRecipe, type DeleteChoice } from "../components/DeleteRecipe";
import { deletePlan, deletedLine, forgetRecipe } from "../recipeDelete";
import { foodNames, originalFoodsOf, diffFoods } from "../stepsState";
import { useRecipeIn, RecipeInFlow, StartWays, mealFromRead } from "../components/RecipeInBlock";
import { log } from "../log";
import type { InFlow } from "../components/RecipeIn";

export function RecipesScreen(p: AppApi) {
  const { state, setState, setTab } = p;
  // R6 (0.2.43, Milan 19:45 to 19:58, board RS14): add a recipe here, the same block as the Plate; it saves to My recipes
  const recipeIn = useRecipeIn({ kitchens: p.personal.kitchens ?? [], region: p.region, onError: (m) => p.notify(m), pdRef: p.pdRef, fitPd: p.fitPd });
  async function saveRead(f: Extract<InFlow, { kind: "read" }>) {
    const { meal, fresh } = await mealFromRead(f, state.foods);
    setState((s) => ({ ...s, foods: [...s.foods, ...fresh], meals: [meal, ...s.meals] }));
    recipeIn.setInFlow(null);
    log("recipe_in", { how: f.url ? "link" : "shot", result: "saved" });
    p.landOnRecipe(meal.id, "Make it puts it on the Plate when you want to cook it.", "✓ Saved in My recipes", "recipes");
  }
  // coaches publish recipes (canvas board R5); what is published already, by the recipe it came from
  // Cook (boards RG0 to RG5): a coach is a cook and publishes; a client is a cook when their coach switched it on, and sends
  // the recipe to their coach. Without accounts, coach mode on this phone is the coach and otherwise their client.
  const client = !p.user && !p.coach;
  // kept on the phone from the last visit, so the buttons are there when the screen opens (Milan, 11 October 2026)
  const keptKey = p.user?.uid ?? (client ? "client" : "local");
  const [cook, setCook] = useKept<{ cook: boolean; direct: boolean }>(`cook-${keptKey}`, { cook: false, direct: false });
  const isCoach = cook.cook;
  const approver = String(p.profile?.coachName ?? "").trim().split(/\s+/)[0] || "your coach";
  // the cook's own recipes on the site, where each one is, by the recipe they came from (board RG3)
  const [published, setPublished] = useKept<Record<string, Published>>(`published-${keptKey}`, {});
  const [publishing, setPublishing] = useState<string | null>(null);
  // the recipe's own page (0.2.5+r11, board S3, R8 to R11): which recipe is open
  const [openId, setOpenId] = useState<string | null>(null);
  const patchMeal = (id: string, patch: Partial<Meal>) => setState((s) => ({ ...s, meals: s.meals.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  // R4: a live recipe whose page has a photo and the app has none takes the page's photo once, as its cover
  useEffect(() => {
    for (const m of state.meals) {
      const pub = published[m.id];
      if (!pub?.hasPhoto || !pub.slug || m.pagePhotoTaken || recipeHasPhotos(m) || (pub.status && pub.status !== "live")) continue;
      fetch(`/r/${pub.slug}/photo.jpg`).then((r) => (r.ok ? r.blob() : null)).then((b) => new Promise<string | null>((res) => {
        if (!b || !b.type.startsWith("image/")) return res(null);
        const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.onerror = () => res(null); fr.readAsDataURL(b);
      })).then((data) => {
        if (!data) return;
        // the page's photo is the live photo, so the live page has not changed (R12)
        setState((s) => ({ ...s, meals: s.meals.map((x) => (x.id === m.id && !recipeHasPhotos(x) && !x.pagePhotoTaken ? { ...x, photo: data, photos: [], pagePhotoTaken: true, ...(x.publish?.sent ? { publish: { ...x.publish, sent: { ...x.publish.sent, photo: `own:${sig(data)}` } } } : {}) } : x)) }));
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [published, state.meals.length]);
  useEffect(() => {
    fetch("/api/my-recipes", { headers: localAs(client) }).then((r) => (r.ok ? r.json() : { recipes: [] })).then((d) => {
      setCook({ cook: Boolean(d.cook), direct: Boolean(d.direct) });
      setPublished(Object.fromEntries((d.recipes ?? []).filter((r: Published) => r.mealId).map((r: Published) => [r.mealId!, r])));
    }).catch(() => {});
  }, [p.user?.uid, client]);
  const first = (n?: string | null) => String(n ?? "").trim().split(/\s+/)[0] || "";
  // the byline: From Milan's kitchen (RF4 Q9)
  const author = first(p.user?.name);
  const pubState = (id: string, draft: boolean): PubState => { const x = published[id]; return x ? (x.status === "waiting" || x.waiting ? "waiting" : x.status === "down" ? "down" : x.status === "back" ? "back" : "live") : draft ? "draft" : null; };
  const pubMeal = state.meals.find((m) => m.id === publishing);
  // the Recipes tab (X0 and Y1, 10 October 2026): My recipes and Coach's recipes, one tile per recipe with its photo;
  // Members as a third tab, and the tabs shorter so three fit: Mine, Coach's, Members (0.2.11, board CO, CO2)
  // MB3 (0.2.61, Milan 16:46): the tab, and on Members the cook, are in the address, so a reload keeps them
  type View = "mine" | "coach" | "members";
  const q = () => { try { return new URLSearchParams(location.search); } catch { return new URLSearchParams(); } };
  const [view, setViewState] = useState<View>(() => { const v = q().get("view"); return v === "coach" || v === "members" ? v : "mine"; });
  const [cookPick, setCookState] = useState<string | null>(() => q().get("cook"));
  const toUrl = (v: View, c: string | null) => { try { if (/^\/my-recipes\/?$/.test(location.pathname)) history.replaceState(history.state, "", `${location.pathname}${v === "mine" ? "" : `?view=${v}${v === "members" && c ? `&cook=${encodeURIComponent(c)}` : ""}`}`); } catch { /* the address stays */ } };
  const setView = (v: View) => { setViewState(v); toUrl(v, cookPick); };
  const setCookPick = (c: string | null) => { setCookState(c); toUrl("members", c); };
  const [memberList, setMemberList] = useState<SharedRecipe[] | null>(null);
  const [owner, setOwner] = useState(false), [loadingMembers, setLoadingMembers] = useState(false), [membersErr, setMembersErr] = useState("");
  const [memberOpen, setMemberOpen] = useState<string | null>(null);
  const loadMembers = () => {
    setLoadingMembers(true); setMembersErr("");
    fetch("/api/members").then(async (r) => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || "Members didn't load. Try again."); setMemberList(d.recipes ?? []); setOwner(Boolean(d.owner)); })
      .catch((e) => setMembersErr(e.message)).finally(() => setLoadingMembers(false));
  };
  const anyShared = state.meals.some((m) => m.members);
  useEffect(() => { if (view === "members" || anyShared) loadMembers(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [view, p.user?.uid, anyShared]);
  // a change to a shared recipe reaches members (CO4b): the name, the foods, the amounts, the steps; the cover stays
  useEffect(() => {
    for (const m of state.meals) {
      if (!m.members) continue;
      const recipe = sharedOf(m, m.members.kitchen), now = contentSig(recipe);
      if (now === m.members.sent) continue;
      const id = m.members.id, named = m.members.named;
      fetch("/api/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, recipe, named, name: p.user?.name ?? "" }) })
        .then((r) => { if (r.ok) setState((s) => ({ ...s, meals: s.meals.map((x) => (x.id === m.id && x.members ? { ...x, members: { ...x.members, sent: now } } : x)) })); })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.meals]);
  const ahead = aheadOf(p);
  // the realistic photo test (0.2.13): the owner only, on the preview (and here, on this computer, for the walkthroughs)
  const isOwner = useMetricsOwner(true);
  const testOn = isOwner && p.ai.on && (isPreviewHost(location.host) || (["localhost", "127.0.0.1"].includes(location.hostname) && (() => { try { return localStorage.getItem("chefmealan-try-photo") === "1"; } catch { return false; } })()));
  // R17 (0.2.45): Chef Mealan's ideas wait at the top of Mine until made once or removed
  const mine = [...state.meals.filter((m) => m.from !== "coach" && m.idea), ...state.meals.filter((m) => m.from !== "coach" && !m.idea)], fromCoach = state.meals.filter((m) => m.from === "coach");
  const shown = view === "mine" ? mine : fromCoach;
  const photoOf = (m: Meal) => state.feedback.find((f) => f.meal.id === m.id && f.photo)?.photo ?? state.feedback.find((f) => f.meal.title === m.title && f.photo)?.photo ?? null;
  const madeTimes = (m: Meal) => state.feedback.filter((f) => (f.meal.id === m.id || f.meal.title === m.title) && f.status === "eaten").length;
  const lastRating = (m: Meal) => state.feedback.find((f) => (f.meal.id === m.id || f.meal.title === m.title) && f.taste)?.taste ?? "";
  const opened = openId ? state.meals.find((m) => m.id === openId) ?? null : null;
  // IM23c (0.2.23): after How was it, the recipe the meal made or changed opens here, with one line for today
  const [landed, setLanded] = useState<{ id: string; line: string; title?: string; back?: "recipes" } | null>(null);
  // R19 (0.2.47, board RS18): a meal opened from Today or Plan: the way back, and the slot it is planned for with its buttons
  const [cameFrom, setCameFrom] = useState<{ id: string; from: MealFrom } | null>(null);
  useEffect(() => {
    const l = p.landing; if (!l) return;
    if (state.meals.some((m) => m.id === l.id)) { setView("mine"); setOpenId(l.id); if (!l.quiet) setLanded(l); setCameFrom(l.from ? { id: l.id, from: l.from } : null); }
    p.clearLanding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.landing]);
  // R8, choice A (Milan 02:38): the Recipes tab tapped on an open recipe goes to the list, as a tab does in most apps
  const homeTaps = useRef(p.recipesHome);
  useEffect(() => {
    if (p.recipesHome === homeTaps.current) return;
    homeTaps.current = p.recipesHome; setOpenId(null); setLanded(null); p.clearOpenFromPath();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.recipesHome]);
  // R8 (0.2.31): the address names a recipe (a reload, Back, a saved link): it opens once it is here; the account may bring it a moment later
  useEffect(() => {
    const id = p.openFromPath; if (!id) return;
    const m = state.meals.find((x) => x.id === id); if (!m) return;
    setView(m.from === "coach" ? "coach" : "mine"); setOpenId(id); p.clearOpenFromPath();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.openFromPath, state.meals]);
  // IM22c (0.2.22): after Delete recipe, a line on Recipes says what was done
  const [deleted, setDeleted] = useState<{ title: string; line: string } | null>(null);
  // IM22 (0.2.22): what others see goes first; if that fails, nothing is deleted. The recipe then leaves the state, and its
  // photos and screenshots leave the phone and the account with the next save (isOrphan). Meals, portions left and foods stay.
  const deleteRecipe = async (m: Meal, c: DeleteChoice) => {
    const pub = published[m.id] ?? null, plan = deletePlan(m, state, pub);
    const did = { members: false, page: false };
    if (m.members && c.members) {
      const r = await fetch(`/api/members/${encodeURIComponent(m.members.id)}`, { method: "DELETE" }).catch(() => null);
      if (!r?.ok) throw new Error("It couldn't be taken back from Members. Nothing was deleted. Try again.");
      did.members = true;
    }
    // a page that is live or waiting goes when ticked; one already down or sent back loses its content without a tick
    const pageTick = plan.page === "live" || plan.page === "live+waiting" || plan.page === "waiting";
    if (pub?.slug && (pageTick ? c.page : true)) {
      const r = await fetch(`/api/recipes/${encodeURIComponent(pub.slug)}?forget=1`, { method: "DELETE", headers: localAs(client) }).catch(() => null);
      if (!r?.ok) throw new Error(`${did.members ? "It was taken back from Members, but the page" : "The page"} couldn't be taken down. Nothing else was deleted. Try again.`);
      did.page = pageTick;
    }
    // the record that a picture was drawn for it (the day's count stays)
    if (m.cover?.state === "drawn" || m.coverSig) void fetch(`/api/cover/${encodeURIComponent(m.id)}`, { method: "DELETE" }).catch(() => {});
    setOpenId(null);
    setPublished((x) => { const y = { ...x }; delete y[m.id]; return y; });
    setState((s) => forgetRecipe(s, m));
    setDeleted({ title: m.title, line: deletedLine(plan, did, approver) });
    if (memberList && did.members) setMemberList(memberList.filter((r) => r.id !== m.members!.id));
  };

  // R12c (0.2.5+r13, board S4): closing the sheet after a publish says so once
  const [justLive, setJustLive] = useState<string | null>(null);
  // Publish the changes on the recipe's page publishes at once; the sheet opens to show it worked (0.2.5+r14)
  const [publishNow, setPublishNow] = useState(false);
  const closeSheet = () => { if (justLive && pubMeal) p.notify(`✓ Published. ${justLive} is live on chefmealan.com.`); setJustLive(null); setPublishNow(false); setPublishing(null); };
  const sheet = pubMeal && <PublishSheet meal={pubMeal} cards={state.feedback} author={author} published={published[pubMeal.id] ?? null} close={closeSheet}
    onDone={(r) => { if (r?.status === "live" && !r.waiting) setJustLive(r.title); setPublished((x) => { const y = { ...x }; if (r) y[pubMeal.id] = r; else delete y[pubMeal.id]; return y; }); }}
    onMeal={(patch) => setState((s) => ({ ...s, meals: s.meals.map((x) => (x.id === pubMeal.id ? { ...x, ...patch } : x)) }))}
    direct={cook.direct} approver={approver} client={client} publishNow={publishNow} />;
  // CO3: a member's recipe
  const member = memberOpen ? memberList?.find((r) => r.id === memberOpen) ?? null : null;
  if (member) return <MemberPage r={member} ahead={ahead} p={p} owner={owner} close={() => setMemberOpen(null)} toCook={(n) => { setMemberOpen(null); setViewState("members"); setCookState(n);
      // closing the recipe steps the browser back; the cook goes into the address once that step has landed
      let done = false; const put = () => { if (done) return; done = true; window.removeEventListener("popstate", put); toUrl("members", n); };
      window.addEventListener("popstate", put); window.setTimeout(put, 900); }}
    takeDown={() => { fetch(`/api/members/${encodeURIComponent(member.id)}`, { method: "DELETE" }).then(() => { setMemberOpen(null); loadMembers(); p.notify("Taken down for every member."); }).catch(() => {}); }} />;
  // R8 to R11: the recipe's page; publishing opens the Publish sheet over it
  if (opened) return (
    <>
      <RecipePage key={opened.id} meal={opened} cards={state.feedback} foods={state.foods} cook={isCoach} state={isCoach ? pubState(opened.id, Boolean(opened.publish)) : null}
        pub={published[opened.id] ?? null} approver={approver} direct={cook.direct} unpublished={isCoach ? unpublishedOf(opened, published[opened.id] ?? null, state.feedback) : []}
        onPatch={(patch) => patchMeal(opened.id, patch)} onRename={(t) => p.renameMeal(opened.id, t)}
        top={landed && landed.id === opened.id ? (
          <section className="card dl-done rq-landed" role="status">
            <div className="card-top"><b>{landed.title ?? "✓ Saved in Mine"}</b>{/* R6: saved from Recipes, the way back is the Recipes list */}{landed.back === "recipes" ? <button className="link" onClick={() => { setLanded(null); setOpenId(null); }}>Recipes</button> : <button className="link" onClick={() => { setLanded(null); setOpenId(null); setTab("home"); }}>Today</button>}</div>
            {landed.line && <small className="muted">{landed.line}</small>}
          </section>) : cameFrom && cameFrom.id === opened.id && cameFrom.from.slot ? <SlotBar p={p} from={cameFrom.from} back={() => { const tab = cameFrom.from.tab; setCameFrom(null); setOpenId(null); p.setTab(tab); }} /> : null}
        backLabel={cameFrom && cameFrom.id === opened.id ? (cameFrom.from.tab === "home" ? "Today" : "Plan") : undefined}
        openOriginal={opened.basedOn && state.meals.some((m) => m.id === opened.basedOn!.id) ? () => { setLanded(null); setOpenId(opened.basedOn!.id); } : null}
        onMakeIt={() => { setOpenId(null); p.openOnPlate(opened); }} onPublish={(now) => { setPublishNow(Boolean(now)); setPublishing(opened.id); }}
        onDelete={<DeleteRecipe key={`del-${opened.id}`} plan={deletePlan(opened, state, published[opened.id] ?? null)} slug={published[opened.id]?.slug ?? null} approver={approver} run={(c) => deleteRecipe(opened, c)} />}
        close={() => { const back = cameFrom && cameFrom.id === opened.id ? cameFrom.from.tab : null; setOpenId(null); setLanded(null); setCameFrom(null); if (back) p.setTab(back); }}
        tryPhoto={testOn ? async (model: string) => {
          const r = await fetch("/api/cover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ test: true, style: "photo", model, recipeId: opened.id, title: opened.title, items: opened.items.filter((i) => i.grams > 0).map((i) => ({ name: i.food.name, grams: i.grams })) }), signal: AbortSignal.timeout(90000) });
          const d = await r.json().catch(() => ({}));
          if (!r.ok || typeof d.image !== "string") throw new Error(d.error || (d.tomorrow ? "Twenty tests today. More tomorrow." : "No picture came back. Try again."));
          return await resizeImageBase64(d.image, 960, 720).catch(() => d.image);
        } : null}
        membersPanel={opened.from === "coach" || opened.from === "members" ? null
          : <SharePanel key={opened.id} meal={opened} p={p} made={opened.members ? memberList?.find((r) => r.id === opened.members!.id)?.made ?? null : null} onPatch={(patch) => patchMeal(opened.id, patch)} />}
        picture={p.ai.on && !opened.from && canDrawCover(opened) ? { count: p.cover.count, drawing: p.cover.drawing === opened.id, draw: () => p.cover.draw(opened), refresh: p.cover.refresh } : null}
        originalFoods={originalFoodsOf(opened, state.meals)} pdRef={p.pdRef} fitPd={p.fitPd}
        draft={p.ai.on ? () => { const d = diffFoods(foodNames(opened.items), originalFoodsOf(opened, state.meals)); return draftSteps(opened, { library: state.foods.map((f) => f.name), equipment: equipmentOf(p.personal), kitchens: p.personal.kitchens ?? [], tastes: tasteForReq(p.personal.tasteChips, state.preferences), ...(d ? { changed: [...d.added.map((x) => `${x}: new`), ...d.gone.map((x) => `${x}: not in it any more`)] } : {}) }); } : null} />
      {sheet}
    </>
  );
  return (
    <>
      {deleted && (
        <section className="card dl-done" role="status">
          <div className="card-top"><b>{deleted.title} is deleted.</b><button className="link" onClick={() => setDeleted(null)}>OK</button></div>
          {deleted.line && <small className="muted">{deleted.line}</small>}
        </section>
      )}
      <div className="segments" role="tablist" aria-label="Recipes">
        <button role="tab" aria-selected={view === "mine"} className={`seg ${view === "mine" ? "on" : ""}`} onClick={() => setView("mine")}>Mine{mine.length ? ` (${mine.length})` : ""}</button>
        <button role="tab" aria-selected={view === "coach"} className={`seg ${view === "coach" ? "on" : ""}`} onClick={() => setView("coach")}>Coach's{fromCoach.length ? ` (${fromCoach.length})` : ""}</button>
        <button role="tab" aria-selected={view === "members"} className={`seg ${view === "members" ? "on" : ""}`} onClick={() => setView("members")}>Members</button>
      </div>
      {view === "mine" && (recipeIn.inFlow
        ? <RecipeInFlow flow={recipeIn} put={(f) => void saveRead(f)} putLabel="Save in My recipes" />
        : (
          <section className="card plate-card recipe-add" aria-label="Add a recipe">
            <div className="card-top"><span>Add a recipe</span></div>
            <small className="muted">From a link or screenshots, as on the Plate. It goes into My recipes; nothing goes on the Plate.</small>
            <StartWays flow={recipeIn} />
          </section>
        ))}
      {view === "members" && <MembersList list={memberList} ahead={ahead} p={p} open={setMemberOpen} loading={loadingMembers} error={membersErr} cook={cookPick} setCook={setCookPick} />}
      {view !== "members" && !(view === "mine" && recipeIn.inFlow) && shown.length === 0 && (
        <section className="card recipes-empty">
          <small>{view === "mine" ? "Nothing here yet. Add one above, or make your first on the Plate." : `Nothing yet. Recipes ${approver === "your coach" ? "your coach" : approver} sends you land here.`}</small>
          {view === "mine" && <button className="pill pill-wide pill-primary" onClick={() => { p.setKind("meal"); p.setStep("in"); setTab("journey"); }}>Make my first recipe</button>}
        </section>
      )}
      {view !== "members" && !(view === "mine" && recipeIn.inFlow) && shown.map((m) => {
        // R7: one tap per recipe: the cover (or the newest plate photo), the name, the foods, where the recipe is
        const own = recipePhotosOf(m), photo = own[0] ?? photoOf(m), n = madeTimes(m), rating = lastRating(m);
        const st = isCoach ? pubState(m.id, Boolean(m.publish)) : null;
        return (
          <button type="button" className="card recipe-tile" key={m.id} onClick={() => setOpenId(m.id)} aria-label={`Open ${m.title}`}>
            {photo
              ? (coverIsDrawn(m) && own[0] === photo ? <span className="recipe-tile-cover"><img src={photo} alt="" /><span className="tile-drawn">Picture by {CHEF_NAME}</span></span> : <img src={photo} alt="" />)
              : <div className="recipe-tile-blank"><span><Utensils size={28} />{m.cover?.state === "tomorrow" && <small>Picture tomorrow</small>}</span></div>}
            <div className="recipe-tile-body">
              <div className="card-top"><b className="tile-name">{m.title}</b><ChevronRight size={20} className="tile-go" /></div>
              {/* R21 (0.2.49, board RS20): a tile says what one portion is; the foods are on the recipe's page */}
              <small>{(() => { const o = portionOf(m); return o ? `One ${o.word} · ${fmt(o.kcal, 0)} kcal · ${fmt(o.protein, 0)} g protein · ${pdText(o.pd)}${o.n > 1 ? ` · makes ${o.n}` : ""}` : `${m.items.length} ${m.items.length === 1 ? "food" : "foods"}`; })()}{rating ? ` · ${rating}` : ""}{n ? ` · made ${n === 1 ? "once" : `${n} times`}` : ""}</small>
              {m.idea && <small className="tile-state">{CHEF_NAME}'s idea, not made yet</small>}
              {m.members && <small className="tile-state live">Shared with members</small>}
              {st && <small className={`tile-state ${st}`}>{st === "live" ? "Live on chefmealan.com" : st === "down" ? "Taken down" : st === "waiting" ? `Waiting for ${approver}` : st === "back" ? `Sent back by ${approver}` : "Draft"}</small>}
            </div>
          </button>
        );
      })}
      {sheet}
    </>
  );
}

// R19 (0.2.47, board RS18): a meal opened from a slot says which slot, with that slot's buttons on top. From today's plan:
// I ate it, Change it on the Plate, and Swap it, Skip it today for when you don't swipe. From Plan or tomorrow: Swap it,
// Empty the slot. Each goes back where you came from.
function SlotBar({ p, from, back }: { p: AppApi; from: MealFrom; back: () => void }) {
  const sl = from.slot;
  const m = sl ? p.planned[sl.date]?.[sl.slotId] : undefined;
  if (!sl || !m || m.skipped) return null;
  const swap = () => { showPlanOn(sl.date, sl.slotId); p.setTab("plan"); };
  if (from.tab === "home" && sl.date === ymd(new Date())) return (
    <section className="card rq-slot" aria-label="In today's plan">
      <small className="rq-slot-line">{sl.name}, {sl.time} · by the plan · today</small>
      <div className="button-row">
        {m.items?.length ? <button type="button" className="pill pill-small pill-primary" onClick={() => { p.logPlanned(m, sl); back(); }}><Check size={14} /> I ate it</button> : null}
        <button type="button" className="pill pill-small" onClick={() => p.fillOnPlate({ date: sl.date, slotId: sl.slotId, name: sl.name, time: sl.time, dayName: "today", mealId: m.mealId, mode: "eat" }, m.items ? { id: m.mealId ?? "", title: m.title, items: m.items, portion: m.portion ?? 0, savedAt: "" } : null, m.title)}>Change it on the Plate</button>
      </div>
      <small><button type="button" className="link in-inline" onClick={swap}>Swap it</button> · <button type="button" className="link in-inline" onClick={() => { p.fill(sl.date, sl.slotId, { ...m, skipped: true }); back(); }}>Skip it today</button></small>
    </section>
  );
  const day = new Date(`${sl.date}T12:00:00`).toLocaleDateString("en", { weekday: "long" });
  return (
    <section className="card rq-slot" aria-label="In the plan">
      <small className="rq-slot-line">{day}'s {sl.name.toLowerCase()}, {sl.time} · in the plan</small>
      <div className="button-row">
        <button type="button" className="pill pill-small" onClick={swap}>Swap it</button>
        <button type="button" className="pill pill-small" onClick={() => { p.fill(sl.date, sl.slotId, null); back(); }}>Empty the slot</button>
      </div>
    </section>
  );
}
