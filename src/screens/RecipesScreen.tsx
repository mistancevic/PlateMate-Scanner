import { Utensils, ChevronRight } from "lucide-react";
import type { Meal } from "../pilot";
import { fmt } from "../ui";
import type { AppApi } from "./api";
import { useEffect, useState } from "react";
import { useKept } from "../kept";
import { PublishSheet, type Published } from "../components/PublishSheet";
import { localAs } from "../recipes";
import { RecipePage, type PubState } from "../components/RecipePage";
import { recipePhotosOf, recipeHasPhotos } from "../photos";

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
        setState((s) => ({ ...s, meals: s.meals.map((x) => (x.id === m.id && !recipeHasPhotos(x) && !x.pagePhotoTaken ? { ...x, photo: data, photos: [], pagePhotoTaken: true } : x)) }));
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
  // the Recipes tab (X0 and Y1, 10 October 2026): My recipes and Coach's recipes, one tile per recipe with its photo
  const [view, setView] = useState<"mine" | "coach">("mine");
  const mine = state.meals.filter((m) => m.from !== "coach"), fromCoach = state.meals.filter((m) => m.from === "coach");
  const shown = view === "mine" ? mine : fromCoach;
  const photoOf = (m: Meal) => state.feedback.find((f) => f.meal.id === m.id && f.photo)?.photo ?? state.feedback.find((f) => f.meal.title === m.title && f.photo)?.photo ?? null;
  const madeTimes = (m: Meal) => state.feedback.filter((f) => (f.meal.id === m.id || f.meal.title === m.title) && f.status === "eaten").length;
  const lastRating = (m: Meal) => state.feedback.find((f) => (f.meal.id === m.id || f.meal.title === m.title) && f.taste)?.taste ?? "";
  const opened = openId ? state.meals.find((m) => m.id === openId) ?? null : null;
  const sheet = pubMeal && <PublishSheet meal={pubMeal} cards={state.feedback} author={author} published={published[pubMeal.id] ?? null} close={() => setPublishing(null)}
    onDone={(r) => setPublished((x) => { const y = { ...x }; if (r) y[pubMeal.id] = r; else delete y[pubMeal.id]; return y; })}
    onMeal={(patch) => setState((s) => ({ ...s, meals: s.meals.map((x) => (x.id === pubMeal.id ? { ...x, ...patch } : x)) }))}
    direct={cook.direct} approver={approver} client={client} />;
  // R8 to R11: the recipe's page; publishing opens the Publish sheet over it
  if (opened) return (
    <>
      <RecipePage meal={opened} cards={state.feedback} foods={state.foods} cook={isCoach} state={isCoach ? pubState(opened.id, Boolean(opened.publish)) : null}
        pub={published[opened.id] ?? null} approver={approver} direct={cook.direct}
        onPatch={(patch) => patchMeal(opened.id, patch)} onRename={(t) => p.renameMeal(opened.id, t)}
        onMakeIt={() => { setOpenId(null); p.openOnPlate(opened); }} onPublish={() => setPublishing(opened.id)}
        onDelete={() => { setOpenId(null); setState((s) => ({ ...s, meals: s.meals.filter((x) => x.id !== opened.id) })); }}
        close={() => setOpenId(null)} />
      {sheet}
    </>
  );
  return (
    <>
      <div className="segments" role="tablist" aria-label="Recipes">
        <button role="tab" aria-selected={view === "mine"} className={`seg ${view === "mine" ? "on" : ""}`} onClick={() => setView("mine")}>My recipes{mine.length ? ` (${mine.length})` : ""}</button>
        <button role="tab" aria-selected={view === "coach"} className={`seg ${view === "coach" ? "on" : ""}`} onClick={() => setView("coach")}>Coach's recipes{fromCoach.length ? ` (${fromCoach.length})` : ""}</button>
      </div>
      {shown.length === 0 && (
        <section className="card recipes-empty">
          <small>{view === "mine" ? "Nothing here yet. Your first recipe starts on the Plate." : `Nothing yet. Recipes ${approver === "your coach" ? "your coach" : approver} sends you land here.`}</small>
          {view === "mine" && <button className="pill pill-wide pill-primary" onClick={() => { p.setKind("meal"); p.setStep("in"); setTab("journey"); }}>Make my first recipe</button>}
        </section>
      )}
      {shown.map((m) => {
        // R7: one tap per recipe: the cover (or the newest plate photo), the name, the foods, where the recipe is
        const own = recipePhotosOf(m), photo = own[0] ?? photoOf(m), n = madeTimes(m), rating = lastRating(m);
        const st = isCoach ? pubState(m.id, Boolean(m.publish)) : null;
        return (
          <button type="button" className="card recipe-tile" key={m.id} onClick={() => setOpenId(m.id)} aria-label={`Open ${m.title}`}>
            {photo ? <img src={photo} alt="" /> : <div className="recipe-tile-blank"><Utensils size={28} /></div>}
            <div className="recipe-tile-body">
              <div className="card-top"><b className="tile-name">{m.title}</b><ChevronRight size={20} className="tile-go" /></div>
              <small>{m.items.map((i) => `${fmt(i.grams, 0)} g ${i.food.name}`).join(" · ")}{rating ? ` · ${rating}` : ""}{n ? ` · made ${n === 1 ? "once" : `${n} times`}` : ""}</small>
              {st && <small className={`tile-state ${st}`}>{st === "live" ? "Live on chefmealan.com" : st === "down" ? "Taken down" : st === "waiting" ? `Waiting for ${approver}` : st === "back" ? `Sent back by ${approver}` : "Draft"}</small>}
            </div>
          </button>
        );
      })}
      {sheet}
    </>
  );
}
