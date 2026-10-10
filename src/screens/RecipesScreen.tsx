import { Utensils, Trash2 } from "lucide-react";
import type { Meal } from "../pilot";
import { fmt } from "../ui";
import type { AppApi } from "./api";
import { ConfirmButton } from "../components/Confirm";
import { useEffect, useState } from "react";
import { PublishSheet, type Published } from "../components/PublishSheet";
import { localAs } from "../recipes";

export function RecipesScreen(p: AppApi) {
  const { state, setState, setTab } = p;
  // coaches publish recipes (canvas board R5); what is published already, by the recipe it came from
  // Cook (boards RG0 to RG5): a coach is a cook and publishes; a client is a cook when their coach switched it on, and sends
  // the recipe to their coach. Without accounts, coach mode on this phone is the coach and otherwise their client.
  const client = !p.user && !p.coach;
  const [cook, setCook] = useState<{ cook: boolean; direct: boolean }>({ cook: false, direct: false });
  const isCoach = cook.cook;
  const approver = String(p.profile?.coachName ?? "").trim().split(/\s+/)[0] || "your coach";
  // the cook's own recipes on the site, where each one is, by the recipe they came from (board RG3)
  const [published, setPublished] = useState<Record<string, Published>>({});
  const [publishing, setPublishing] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/my-recipes", { headers: localAs(client) }).then((r) => (r.ok ? r.json() : { recipes: [] })).then((d) => {
      setCook({ cook: Boolean(d.cook), direct: Boolean(d.direct) });
      setPublished(Object.fromEntries((d.recipes ?? []).filter((r: Published) => r.mealId).map((r: Published) => [r.mealId!, r])));
    }).catch(() => {});
  }, [p.user?.uid, client]);
  const first = (n?: string | null) => String(n ?? "").trim().split(/\s+/)[0] || "";
  // the byline: From Milan's kitchen (RF4 Q9)
  const author = first(p.user?.name);
  const pubState = (id: string, draft: boolean) => { const x = published[id]; return x ? (x.status === "waiting" || x.waiting ? "waiting" : x.status === "down" ? "down" : x.status === "back" ? "back" : "live") : draft ? "draft" : null; };
  const pubMeal = state.meals.find((m) => m.id === publishing);
  // the Recipes tab (X0 and Y1, 10 October 2026): My recipes and Coach's recipes, one tile per recipe with its photo
  const [view, setView] = useState<"mine" | "coach">("mine");
  const mine = state.meals.filter((m) => m.from !== "coach"), fromCoach = state.meals.filter((m) => m.from === "coach");
  const shown = view === "mine" ? mine : fromCoach;
  const photoOf = (m: Meal) => state.feedback.find((f) => f.meal.id === m.id && f.photo)?.photo ?? state.feedback.find((f) => f.meal.title === m.title && f.photo)?.photo ?? null;
  const madeTimes = (m: Meal) => state.feedback.filter((f) => (f.meal.id === m.id || f.meal.title === m.title) && f.status === "eaten").length;
  const lastRating = (m: Meal) => state.feedback.find((f) => (f.meal.id === m.id || f.meal.title === m.title) && f.taste)?.taste ?? "";
  const makeAgain = (m: Meal) => {
    setState((s) => ({ ...s, title: m.title, items: structuredClone(m.items), portion: null }));
    p.setStep("recipe"); setTab("journey"); p.notify("On your plate. Fit to my target sets the amounts.");
  };
  return (
    <>
      <div className="segments" role="tablist" aria-label="Recipes">
        <button role="tab" aria-selected={view === "mine"} className={`seg ${view === "mine" ? "on" : ""}`} onClick={() => setView("mine")}>My recipes{mine.length ? ` (${mine.length})` : ""}</button>
        <button role="tab" aria-selected={view === "coach"} className={`seg ${view === "coach" ? "on" : ""}`} onClick={() => setView("coach")}>Coach's recipes{fromCoach.length ? ` (${fromCoach.length})` : ""}</button>
      </div>
      {shown.length === 0 && (
        <section className="card"><small>{view === "mine" ? "Nothing yet. A meal you rate on the Plate can be saved here with Save in My recipes." : `Nothing yet. Recipes ${approver === "your coach" ? "your coach" : approver} sends you land here.`}</small></section>
      )}
      {shown.map((m) => {
        const photo = photoOf(m), n = madeTimes(m), rating = lastRating(m);
        const st = isCoach ? pubState(m.id, Boolean(m.publish)) : null; const pub = published[m.id];
        return (
          <section className="card recipe-tile" key={m.id}>
            {photo ? <img src={photo} alt="" /> : <div className="recipe-tile-blank"><Utensils size={28} /></div>}
            <div className="recipe-tile-body">
              <div className="card-top"><span>{m.title}</span>{st && <small className={`pub-state ${st}`}>{st === "live" ? "Live" : st === "down" ? "Taken down" : st === "waiting" ? `Waiting for ${approver}` : st === "back" ? "Sent back" : "Draft"}</small>}</div>
              <small>{m.items.map((i) => `${fmt(i.grams, 0)} g ${i.food.name}`).join(" · ")}{rating ? ` · ${rating}` : ""}{n ? ` · made ${n === 1 ? "once" : `${n} times`}` : ""}</small>
              {(m.steps?.length ?? 0) > 0 && <details className="recipe-steps"><summary>Steps ({m.steps!.length})</summary><ol>{m.steps!.map((x, k) => <li key={k}>{x}</li>)}</ol></details>}
              {pub?.note && st !== "waiting" && <small className="pub-note">{approver.charAt(0).toUpperCase() + approver.slice(1)}: “{pub.note}”</small>}
              <div className="button-row" style={{ marginTop: 10 }}>
                <button className="pill pill-small pill-primary" onClick={() => makeAgain(m)}>Make it again</button>
                {isCoach && !st && <button className="pill pill-small" onClick={() => setPublishing(m.id)}>Publish</button>}
                {isCoach && st && pub && (!pub.status || pub.status === "live") && <a className="pill pill-small" href={`/r/${pub.slug}`} target="_blank" rel="noreferrer">See the page</a>}
                {isCoach && st && <button className="pill pill-small" onClick={() => setPublishing(m.id)}>{st === "waiting" ? "Open it" : st === "live" ? "Change it" : st === "down" ? (cook.direct ? "Publish again" : `Send to ${approver} again`) : "Continue"}</button>}
                <ConfirmButton className="icon" ariaLabel={`Delete recipe ${m.title}`} label={<Trash2 size={16} />} confirmLabel="Sure?"
                  onConfirm={() => setState((s) => ({ ...s, meals: s.meals.filter((x) => x.id !== m.id) }))} />
              </div>
            </div>
          </section>
        );
      })}
          {pubMeal && <PublishSheet meal={pubMeal} cards={state.feedback} author={author} published={published[pubMeal.id] ?? null} close={() => setPublishing(null)}
            onDone={(r) => setPublished((x) => { const y = { ...x }; if (r) y[pubMeal.id] = r; else delete y[pubMeal.id]; return y; })}
            onMeal={(patch) => setState((s) => ({ ...s, meals: s.meals.map((x) => (x.id === pubMeal.id ? { ...x, ...patch } : x)) }))}
            direct={cook.direct} approver={approver} client={client} />}
    </>
  );
}
