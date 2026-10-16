import { Utensils, ChevronRight } from "lucide-react";
import type { Meal } from "../pilot";
import { fmt } from "../ui";
import type { AppApi } from "./api";
import { useEffect, useState } from "react";
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

export function RecipesScreen(p: AppApi) {
  const { state, setState, setTab } = p;
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
  const [view, setView] = useState<"mine" | "coach" | "members">("mine");
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
  const mine = state.meals.filter((m) => m.from !== "coach"), fromCoach = state.meals.filter((m) => m.from === "coach");
  const shown = view === "mine" ? mine : fromCoach;
  const photoOf = (m: Meal) => state.feedback.find((f) => f.meal.id === m.id && f.photo)?.photo ?? state.feedback.find((f) => f.meal.title === m.title && f.photo)?.photo ?? null;
  const madeTimes = (m: Meal) => state.feedback.filter((f) => (f.meal.id === m.id || f.meal.title === m.title) && f.status === "eaten").length;
  const lastRating = (m: Meal) => state.feedback.find((f) => (f.meal.id === m.id || f.meal.title === m.title) && f.taste)?.taste ?? "";
  const opened = openId ? state.meals.find((m) => m.id === openId) ?? null : null;

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
  if (member) return <MemberPage r={member} ahead={ahead} p={p} owner={owner} close={() => setMemberOpen(null)}
    takeDown={() => { fetch(`/api/members/${encodeURIComponent(member.id)}`, { method: "DELETE" }).then(() => { setMemberOpen(null); loadMembers(); p.notify("Taken down for every member."); }).catch(() => {}); }} />;
  // R8 to R11: the recipe's page; publishing opens the Publish sheet over it
  if (opened) return (
    <>
      <RecipePage meal={opened} cards={state.feedback} foods={state.foods} cook={isCoach} state={isCoach ? pubState(opened.id, Boolean(opened.publish)) : null}
        pub={published[opened.id] ?? null} approver={approver} direct={cook.direct} unpublished={isCoach ? unpublishedOf(opened, published[opened.id] ?? null, state.feedback) : []}
        onPatch={(patch) => patchMeal(opened.id, patch)} onRename={(t) => p.renameMeal(opened.id, t)}
        onMakeIt={() => { setOpenId(null); p.openOnPlate(opened); }} onPublish={(now) => { setPublishNow(Boolean(now)); setPublishing(opened.id); }}
        onDelete={() => { setOpenId(null); setState((s) => ({ ...s, meals: s.meals.filter((x) => x.id !== opened.id) })); }}
        close={() => setOpenId(null)}
        tryPhoto={testOn ? async (model: string) => {
          const r = await fetch("/api/cover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ test: true, style: "photo", model, recipeId: opened.id, title: opened.title, items: opened.items.filter((i) => i.grams > 0).map((i) => ({ name: i.food.name, grams: i.grams })) }), signal: AbortSignal.timeout(90000) });
          const d = await r.json().catch(() => ({}));
          if (!r.ok || typeof d.image !== "string") throw new Error(d.error || (d.tomorrow ? "Twenty tests today. More tomorrow." : "No picture came back. Try again."));
          return await resizeImageBase64(d.image, 960, 720).catch(() => d.image);
        } : null}
        membersPanel={opened.from === "coach" || opened.from === "members" ? null
          : <SharePanel key={opened.id} meal={opened} p={p} made={opened.members ? memberList?.find((r) => r.id === opened.members!.id)?.made ?? null : null} onPatch={(patch) => patchMeal(opened.id, patch)} />}
        draft={p.ai.on ? async () => {
          // the foods in the recipe's order, as {1}, {2}; a draft that fails the checks goes back once with why (board CH, CH5)
          const items = opened.items.filter((i) => i.grams > 0);
          const ask = async (failed?: string) => {
            const res = await fetch("/api/steps", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: opened.title, items: items.map((i) => ({ name: i.food.name, grams: i.grams })), kitchens: p.personal.kitchens ?? [], failed }) });
            const d = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(d.error || "Chef Mealan could not answer. Try again.");
            return fromDraft(d.steps ?? [], items, state.foods.map((f) => f.name));
          };
          const first = await ask();
          return first.ok ? first : ask((first as { why: string }).why);
        } : null} />
      {sheet}
    </>
  );
  return (
    <>
      <div className="segments" role="tablist" aria-label="Recipes">
        <button role="tab" aria-selected={view === "mine"} className={`seg ${view === "mine" ? "on" : ""}`} onClick={() => setView("mine")}>Mine{mine.length ? ` (${mine.length})` : ""}</button>
        <button role="tab" aria-selected={view === "coach"} className={`seg ${view === "coach" ? "on" : ""}`} onClick={() => setView("coach")}>Coach's{fromCoach.length ? ` (${fromCoach.length})` : ""}</button>
        <button role="tab" aria-selected={view === "members"} className={`seg ${view === "members" ? "on" : ""}`} onClick={() => setView("members")}>Members</button>
      </div>
      {view === "members" && <MembersList list={memberList} ahead={ahead} p={p} open={setMemberOpen} loading={loadingMembers} error={membersErr} />}
      {view !== "members" && shown.length === 0 && (
        <section className="card recipes-empty">
          <small>{view === "mine" ? "Nothing here yet. Your first recipe starts on the Plate." : `Nothing yet. Recipes ${approver === "your coach" ? "your coach" : approver} sends you land here.`}</small>
          {view === "mine" && <button className="pill pill-wide pill-primary" onClick={() => { p.setKind("meal"); p.setStep("in"); setTab("journey"); }}>Make my first recipe</button>}
        </section>
      )}
      {view !== "members" && shown.map((m) => {
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
              <small>{m.items.map((i) => `${fmt(i.grams, 0)} g ${i.food.name}`).join(" · ")}{rating ? ` · ${rating}` : ""}{n ? ` · made ${n === 1 ? "once" : `${n} times`}` : ""}</small>
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
