import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Download, Image as ImageIcon, X } from "lucide-react";
import type { Feedback, Meal, PubContent, PublishDraft } from "../pilot";
import { amountOf, bylineOf, claimProblem, fitsOf, localAs, numbersOf, plainName, slugOf, type PublicRecipe } from "../recipes";
import { RecipeView } from "../screens/RecipePages";
import { instagramImages } from "../instaImages";
import { resizeImageBase64 } from "../utils/image";
import { useBack } from "../back";
import { recipePhotosOf, withRecipePhotos, sig } from "../photos";
import { cardPhotosOf, MAX_RECIPE_PHOTOS } from "./RecipePhotos";
import { StepsEditor } from "./StepsEditor";
import { stepText } from "../steps";
import { isAiPhoto, isDrawnPhoto } from "../covers";
import { CHEF_NAME } from "./Mark";

// Canvas board R5 (7 October 2026), redrawn as RG1 to RG3 with RF4 (8 October): a cook publishes a recipe that's already
// in the app. The foods and grams come from the app; the cook adds what a reader needs. What is typed is kept with the
// recipe as a draft, never public; See the page shows it as a visitor will before anything goes live. Unpublish takes it
// down and the link says so; Publish again brings it back on the same link. Everyone sees a recipe (Q6); the steps live
// with the recipe (Q1); the names start without brands (Q2); the photos offered are the plate photos (Q4).
// A cook who isn't a coach sends the recipe to their coach, who sees the page and makes it live or sends it back (RG1, RG5)
export type Published = PublicRecipe & { status?: "live" | "down" | "waiting" | "back"; waiting?: boolean; note?: string };

// What the live page holds and what is about to go there (0.2.5+r13, board S4, R12). The defaults are the sheet's own,
// so the recipe's page and the sheet agree on what changed. A page published before this release has no record of its
// photo, so its photo is not compared.
export function pubDraftOf(meal: Meal, published: Published | null, cards: Feedback[]) {
  const d: PublishDraft = meal.publish ?? {};
  const own = recipePhotosOf(meal);
  const photos = [...own, ...cardPhotosOf(meal, cards).slice(0, 8).filter((c) => !own.includes(c))];
  return {
    d, photos, photoAt: own.length ? 0 : Math.min(d.photoAt ?? 0, Math.max(0, photos.length - 1)),
    title: d.title ?? published?.title ?? meal.title, lines: d.lines ?? published?.lines ?? "", makes: d.makes ?? String(published?.makes ?? 1),
    servingName: d.servingName ?? published?.servingName ?? "serving", minutes: d.minutes ?? (published?.minutes ? String(published.minutes) : ""),
    names: meal.items.map((i, k) => d.names?.[k] ?? published?.items?.[k]?.name ?? plainName(i.food)), steps: (meal.steps ?? published?.steps ?? []).join("\n"),
  };
}
type PubFields = { title: string; lines: string; makes: string; servingName: string; minutes: string; names: string[]; steps: string; photo: string | null | undefined; photoAi?: boolean };
// which photo leads, in a way that survives a reload: the recipe's own photo by its fingerprint, a card's plate photo by
// the card (a card's photo can load as the small or the large copy)
// (undefined: not known for sure, so not compared)
export const photoKeyOf = (meal: Meal, cards: Feedback[], photo: string | null | undefined): string | null | undefined => {
  if (!photo) return null;
  if (recipePhotosOf(meal).includes(photo)) return `own:${sig(photo)}`;
  const c = cards.find((x) => x.photo === photo || (x.photos ?? []).includes(photo));
  return c ? `card:${c.id}` : undefined;
};
export function pubContent(meal: Meal, f: PubFields): PubContent {
  const shown = meal.items.map((i, k) => [i, k] as const).filter(([i]) => i.grams > 0);
  return {
    title: f.title.trim(), lines: f.lines.trim(), makes: Math.max(1, Math.round(Number(f.makes)) || 1), servingName: f.servingName.trim() || "serving",
    minutes: Number(f.minutes) > 0 ? Math.round(Number(f.minutes)) : null, names: shown.map(([i, k]) => (f.names[k] ?? i.food.name).trim() || i.food.name),
    steps: f.steps.split("\n").map((x) => stepText(x, meal.items)).filter(Boolean).slice(0, 30), grams: shown.map(([i]) => Math.round(i.grams)), photo: f.photo, photoAi: Boolean(f.photoAi),
  };
}
const fromPublished = (r: Published): PubContent => ({
  title: (r.title ?? "").trim(), lines: (r.lines ?? "").trim(), makes: r.makes ?? 1, servingName: r.servingName || "serving", minutes: r.minutes ?? null,
  names: (r.items ?? []).map((i) => i.name), steps: r.steps ?? [], grams: (r.items ?? []).map((i) => Math.round(i.grams)), photoAi: Boolean(r.photoAi),
});
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
// the parts that differ from the live page, named as the sheet names them
export function changedParts(now: PubContent, sent: PubContent | null | undefined, published: Published | null): string[] {
  const base = sent ?? (published ? fromPublished(published) : null);
  if (!base) return [];
  const out: string[] = [];
  if (now.title !== base.title) out.push("Name");
  if (now.lines !== base.lines) out.push("Two lines about it");
  if (now.makes !== base.makes || now.servingName !== base.servingName) out.push("Makes");
  if (now.minutes !== base.minutes) out.push("Time");
  if (!same(now.grams, base.grams)) out.push("The foods and grams");
  else if (!same(now.names, base.names)) out.push("The foods' names");
  if (!same(now.steps, base.steps)) out.push("Steps");
  // a photo still loading from the account is not a change
  if (base.photo !== undefined && now.photo !== undefined && now.photo !== null && now.photo !== base.photo) out.push("Photo");
  // the AI label: a page published before the label says nothing, so a picture made with AI is a change to publish
  else if (now.photo !== undefined && Boolean(now.photoAi) !== Boolean(base.photoAi)) out.push("AI label");
  return out;
}
// the recipe's page (R12c): what is not on the live page yet, from the saved draft
export const unpublishedOf = (meal: Meal, published: Published | null, cards: Feedback[]): string[] => {
  if (!published || (published.status && published.status !== "live") || published.waiting) return [];
  const x = pubDraftOf(meal, published, cards);
  return changedParts(pubContent(meal, { ...x, photo: photoKeyOf(meal, cards, x.photos[x.photoAt]), photoAi: isAiPhoto(meal, x.photos[x.photoAt]) }), x.d.sent, published);
};
const timeOf = (iso?: string) => {
  if (!iso) return "";
  const t = new Date(iso); if (Number.isNaN(t.getTime())) return "";
  const hm = t.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return t.toDateString() === new Date().toDateString() ? hm : `${t.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}, ${hm}`;
};
export function PublishSheet({ meal, cards, author, published, close, onDone, onMeal, direct = true, approver = "your coach", client = false, publishNow = false }: {
  meal: Meal; cards: Feedback[]; author: string; published: Published | null; close: () => void; onDone: (r: Published | null) => void; onMeal: (patch: Partial<Meal>) => void;
  direct?: boolean; approver?: string; client?: boolean; publishNow?: boolean;
}) {
  useBack(true, close);
  const mine = cards.filter((c) => c.meal?.title === meal.title).sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
  // photos to pick from (0.2.5+r10, board S3, R6): the recipe's own photos, the cover first, then the plate photos of its
  // cards; a food's pack photo can show a brand, so it isn't offered. A photo uploaded here joins the recipe's photos.
  const own = recipePhotosOf(meal);
  const candidates = useMemo(() => cardPhotosOf(meal, cards).slice(0, 8),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [meal.id]);
  const init = useMemo(() => pubDraftOf(meal, published, cards),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [meal.id]);
  const photos = [...own, ...candidates.filter((c) => !own.includes(c))];
  const [photoAt, setPhotoAt] = useState(own.length ? 0 : init.photoAt);
  const [title, setTitle] = useState(init.title);
  const [lines, setLines] = useState(init.lines);
  const [makes, setMakes] = useState(init.makes);
  const [servingName, setServingName] = useState(init.servingName);
  const [minutes, setMinutes] = useState(init.minutes);
  const [names, setNames] = useState<string[]>(init.names);
  const [steps, setSteps] = useState(init.steps);
  // what the live page holds (R12): kept at Publish, written with the draft so it survives closing the sheet
  const [sent, setSent] = useState<PubContent | undefined>(init.d.sent);
  const [sentAt, setSentAt] = useState<string | undefined>(init.d.sentAt);
  const [justPublished, setJustPublished] = useState(false);
  const sentRef = useRef<{ sent?: PubContent; sentAt?: string }>({ sent: init.d.sent, sentAt: init.d.sentAt });
  // kept with the recipe as it is typed (a short pause first), so the sheet can close at any time
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => { const live = sentRef.current; onMeal({ steps: steps.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 30), publish: { title, lines, makes, servingName, minutes, names, photoAt, savedAt: new Date().toISOString(), ...(live.sent ? live : {}) } }); }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, lines, makes, servingName, minutes, names, steps, photoAt]);
  const lastTaste = mine[0]?.taste ?? "";
  const rating: PublicRecipe["rating"] = /daam/i.test(lastTaste) ? "daam" : /good/i.test(lastTaste) ? "good" : null;
  const n = Number(makes);
  const nums = numbersOf(meal, Number.isFinite(n) && n >= 1 ? Math.round(n) : 1);
  const claim = nums ? claimProblem(title, lines, nums.proteinShare) : null;
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [done, setDone] = useState<Published | null>(published);
  const live = done && (!done.status || done.status === "live") ? done : null;
  const waits = Boolean(done && (done.status === "waiting" || done.waiting));
  // R12: what changed since the live page; with no change the button sleeps
  const chosen = photos[photoAt] ?? null, chosenAi = isAiPhoto(meal, chosen), chosenDrawn = isDrawnPhoto(meal, chosen ?? undefined);
  const contentNow = pubContent(meal, { title, lines, makes, servingName, minutes, names, steps, photo: photoKeyOf(meal, cards, photos[photoAt]), photoAi: chosenAi });
  const changes = live && !waits ? changedParts(contentNow, sent, live) : [];
  const asleep = Boolean(live && !waits && !changes.length);
  const [previewing, setPreviewing] = useState(false);
  useBack(previewing, () => setPreviewing(false));
  const fileRef = useRef<HTMLInputElement>(null);

  const recipe = (): PublicRecipe | null => {
    if (!nums) return null;
    const now = new Date().toISOString();
    return {
      slug: published?.slug ?? slugOf(title), title: title.trim(), lines: lines.trim(), makes: Math.max(1, Math.round(n) || 1), servingName: servingName.trim() || "serving",
      minutes: Number(minutes) > 0 ? Math.round(Number(minutes)) : null,
      items: meal.items.filter((i) => i.grams > 0).map((i) => ({ name: (names[meal.items.indexOf(i)] ?? i.food.name).trim() || i.food.name, grams: Math.round(i.grams), amount: amountOf(i.grams), per100: { kcal: i.food.calories, protein: i.food.protein, fat: i.food.fats, carbs: i.food.carbs, fibre: i.food.fiber } })),
      // the page gets the steps as they read, with the amounts written in (R13c)
      steps: steps.split("\n").map((x) => stepText(x, meal.items)).filter(Boolean).slice(0, 30), rating, who: "everyone",
      per100: nums.per100, perServing: nums.perServing, all: nums.all, pd: nums.pd, proteinShare: nums.proteinShare, fits: fitsOf(nums.pd),
      hasPhoto: photos.length > 0, photoAi: chosenAi, ...(meal.source?.name ? { adaptedFrom: meal.source.name.slice(0, 80) } : {}), author, publishedAt: published?.publishedAt ?? now, updatedAt: now, mealId: meal.id,
    };
  };
  const photoNow = async () => (photos[photoAt] ? await resizeImageBase64(photos[photoAt], 1080, 1080).catch(() => photos[photoAt]) : null);
  const publish = async () => {
    const r = recipe(); if (!r || claim) return;
    setBusy("Publishing…"); setErr("");
    try {
      const res = await fetch("/api/recipes", { method: "POST", headers: { "Content-Type": "application/json", ...localAs(client) }, body: JSON.stringify({ recipe: r, photo: await photoNow() }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Publishing didn't work. Try again.");
      const saved: Published = d.status === "waiting" ? (live ? { ...live, waiting: true, note: "" } : { ...r, slug: d.slug || r.slug, status: "waiting", note: "" }) : { ...r, slug: d.slug || r.slug, status: "live" };
      if (saved.status === "live") {
        const at = new Date().toISOString();
        setSent(contentNow); setSentAt(at); setJustPublished(true); sentRef.current = { sent: contentNow, sentAt: at };
        onMeal({ publish: { title, lines, makes, servingName, minutes, names, photoAt, savedAt: at, sent: contentNow, sentAt: at } });
      }
      setDone(saved); onDone(saved); setPreviewing(false);
    } catch (e: any) { setErr(e.message); } finally { setBusy(""); }
  };
  const once = useRef(false);
  useEffect(() => {
    if (!publishNow || once.current) return;
    once.current = true;
    if (live && changes.length && !claim && nums && title.trim() && direct) void publish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const unpublish = async () => {
    if (!live) return;
    setBusy("Taking it down…");
    try { const res = await fetch(`/api/recipes/${live.slug}`, { method: "DELETE", headers: localAs(client) }); if (!res.ok) throw new Error(); const down: Published = { ...live, status: "down" }; setDone(down); onDone(down); } catch { setErr("It couldn't be taken down. Try again."); } finally { setBusy(""); }
  };
  const link = live ? `${location.origin}/r/${live.slug}` : "";
  const [copied, setCopied] = useState(false);
  const images = async () => {
    const done = live; if (!done) return;
    setBusy("Making the images…");
    try {
      const imgs = await instagramImages(done, await photoNow());
      const files = await Promise.all(imgs.map(async (x) => new File([await (await fetch(x.dataUrl)).blob()], `${done.slug}-${x.name}`, { type: "image/jpeg" })));
      const nav: any = navigator;
      if (nav.canShare?.({ files })) await nav.share({ files, title: done.title });
      else for (const f of files) { const a = document.createElement("a"); a.href = URL.createObjectURL(f); a.download = f.name; a.click(); await new Promise((r) => setTimeout(r, 300)); }
    } catch (e: any) { if (e?.name !== "AbortError") setErr("The images couldn't be made. Try again."); } finally { setBusy(""); }
  };

  const state = waits ? "waiting" : live ? "live" : done?.status === "down" ? "down" : done?.status === "back" ? "back" : "draft";
  const go = busy || (waits ? `Waiting for ${approver}` : asleep ? (direct ? "Published, no changes" : "No changes to send") : !direct ? `Send to ${approver}` : live ? "Publish the changes" : state === "down" ? "Publish again" : "Publish");
  const preview = previewing ? recipe() : null;
  return (
    <div className="sheet-backdrop" onClick={close}>
      <div className="sheet publish-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Publish this recipe">
        <div className="card-top"><span>{meal.title}</span><button className="link" onClick={close}>Close</button></div>
        <div className="pub-head"><h2>{live ? "Published" : "Publish this recipe"}</h2><span className={`pub-state ${state}`}>{state === "live" ? "Live" : state === "down" ? "Taken down" : state === "waiting" ? `Waiting for ${approver}` : state === "back" ? "Sent back" : "Draft"}</span></div>
        {waits && <p className="small muted">{approver.charAt(0).toUpperCase() + approver.slice(1)} sees the page first and makes it live, or sends it back with a note.{live ? " The live page stays as it is until then." : ""}</p>}
        {!waits && done?.note && <p className="small pub-note">{approver.charAt(0).toUpperCase() + approver.slice(1)}: “{done.note}”</p>}
        {!live && !waits && <p className="small muted">{state === "down" ? "The link says this recipe was taken down. Publish again brings it back on the same link." : "Saved as you type, only here. Close it any time and come back."}</p>}
        {live && !waits && justPublished && !changes.length && (
          <div className="pub-band done" role="status"><b>✓ Published</b><span>Anyone with the link sees the page now.</span><a className="pill pill-small pill-primary" href={`/r/${live.slug}`} target="_blank" rel="noreferrer">See live page</a></div>
        )}
        {changes.length > 0 && (
          <div className="pub-band changed" role="status"><b>Changes not published yet</b><span>{timeOf(sentAt ?? live?.updatedAt ?? live?.publishedAt) ? `The live page shows the version from ${timeOf(sentAt ?? live?.updatedAt ?? live?.publishedAt)}. ` : "The live page shows the version before. "}Changed: {changes.join(", ")}.</span></div>
        )}
        {live && (
          <div className="publish-done">
            <a className="publish-link" href={`/r/${live.slug}`} target="_blank" rel="noreferrer">{link.replace(/^https?:\/\//, "")}</a>
            <div className="ways">
              <button className="pill pill-small" onClick={async () => { try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* the link is there to copy by hand */ } }}>{copied ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy link</>}</button>
              <button className="pill pill-small pill-primary" onClick={images} disabled={Boolean(busy)}><Download size={15} /> The Instagram images</button>
            </div>
            <small className="muted">Four images for a carousel, and the numbers as a reel's last frame. Change anything below, See the page, then {direct ? "Publish the changes" : `send the changes to ${approver}`}.</small>
          </div>
        )}
        <div className="setting-block">
          <b className="field-label">Photo</b>
          <div className="publish-photos">
            {photos.map((src, i) => <button key={i} className={`publish-photo ${photoAt === i ? "on" : ""}`} onClick={() => setPhotoAt(i)} aria-label={`Photo ${i + 1}${photoAt === i ? ", the one shown" : ""}`}><img src={src} alt="" /></button>)}
            <button className="publish-photo add" onClick={() => fileRef.current?.click()} aria-label="Upload a photo"><ImageIcon size={20} /></button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; const r = new FileReader(); r.onload = async () => { const raw = String(r.result); const data = await resizeImageBase64(raw, 1080, 1080).catch(() => raw); const list = own.includes(data) ? own : [...own, data].slice(0, MAX_RECIPE_PHOTOS); onMeal(withRecipePhotos(list)); setPhotoAt(Math.max(0, list.indexOf(data))); }; r.readAsDataURL(f); }} />
          </div>
          {chosen && (
            <label className="pub-ai"><input type="checkbox" checked={chosenAi} disabled={chosenDrawn} onChange={(e) => { const s = sig(chosen); const list = (meal.aiSigs ?? []).filter((x) => x !== s); onMeal({ aiSigs: e.target.checked ? [...list, s] : list }); }} />
              <span>Made with AI{chosenDrawn ? `: drawn by ${CHEF_NAME}` : ""}. The page and the images say Picture made with AI.</span></label>
          )}
          <small className="muted">{photos.length ? "The recipe's photos, the cover first, then the plate photos from its cards. The one with the blue frame leads, on the page and on the images. An uploaded photo is kept with the recipe." : "Upload a photo of the plate; the photo is kept with the recipe. Without one the page shows no photo."}</small>
        </div>
        <label className="field-label">Name<input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} /></label>
        <label className="field-label">Two lines about it<textarea value={lines} onChange={(e) => setLines(e.target.value)} maxLength={240} placeholder="Thin, soft, and they roll without breaking." /></label>
        <div className="two-fields">
          <label className="field-label">Makes<span className="makes"><input inputMode="numeric" value={makes} onChange={(e) => setMakes(e.target.value.replace(/[^\d]/g, ""))} /><input value={servingName} onChange={(e) => setServingName(e.target.value)} placeholder="crepe" aria-label="What one serving is called" /></span></label>
          <label className="field-label">Time, minutes<input inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/[^\d]/g, ""))} placeholder="35" /></label>
        </div>
        <div className="setting-block">
          <b className="field-label">The foods, as the page names them</b>
          <small className="muted">Chef Mealan left out the brands; change a name if you like. It changes only the page.</small>
          {meal.items.map((i, k) => i.grams > 0 && (
            <div className="publish-item" key={k}><input value={names[k] ?? ""} onChange={(e) => setNames((xs) => xs.map((x, j) => (j === k ? e.target.value : x)))} aria-label={`Name of food ${k + 1}`} /><span>{amountOf(i.grams)}</span></div>
          ))}
        </div>
        <div className="setting-block">
          <b className="field-label">Steps</b>
          <StepsEditor steps={steps.split("\n")} items={meal.items} onChange={(a) => setSteps(a.join("\n"))} />
          <small className="muted">The steps stay with the recipe in the app too.</small>
        </div>
        <div className="publish-checks">
          {nums ? <span className={nums.proteinShare >= 20 ? "ok" : "plain"}>{nums.proteinShare >= 20 ? "✓ High protein: " : "Protein: "}{nums.proteinShare} % of the energy is protein</span> : <span className="no">Some foods have no energy or protein value: add them before publishing</span>}
          {nums && <span className="ok">✓ One {servingName || "serving"}: {nums.perServing.kcal} kcal · {nums.perServing.protein} g protein · PD {nums.pd}</span>}
          <span className={rating ? "ok" : "plain"}>{rating === "daam" ? "✓ Your rating: DaaM good" : rating === "good" ? "✓ Your rating: Good" : "No rating yet: rate it on the Plate to show DaaM good"}</span>
          {claim && <span className="no">{claim}</span>}
        </div>
        <small className="muted">{bylineOf(author)}</small>
        {err && <p className="small" style={{ color: "var(--low)" }}>{err}</p>}
        <div className="ways publish-ways">
          <button className="pill pill-wide" onClick={() => setPreviewing(true)} disabled={!nums || !title.trim()}>See the page</button>
          <button className="pill pill-wide pill-primary" onClick={publish} disabled={!nums || Boolean(claim) || Boolean(busy) || !title.trim() || waits || asleep}>{go}</button>
        </div>
        {live && <button className="pill pill-wide" onClick={unpublish} disabled={Boolean(busy)}><X size={15} /> Unpublish</button>}
      </div>
      {preview && (
        <div className="rp-preview" role="dialog" aria-label="See the page" onClick={(e) => e.stopPropagation()}>
          <RecipeView r={preview} member={null} photoSrc={photos[photoAt] ?? null} top={
            <div className="rp-preview-bar" style={{ margin: "-14px -18px 0" }}>
              <b>Preview: only you see this. {live ? "The live page changes when you publish." : "Nothing is live yet."}{!direct ? ` ${approver.charAt(0).toUpperCase() + approver.slice(1)} sees it before it goes live.` : ""}</b>
              <div className="ways"><button className="pill" onClick={() => setPreviewing(false)}>Back to the sheet</button><button className="pill pill-primary" onClick={publish} disabled={Boolean(claim) || Boolean(busy) || waits || asleep}>{go}</button></div>
            </div>} />
        </div>
      )}
    </div>
  );
}
