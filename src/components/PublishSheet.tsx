import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Download, Image as ImageIcon, X } from "lucide-react";
import type { Feedback, Meal, PublishDraft } from "../pilot";
import { amountOf, bylineOf, claimProblem, fitsOf, localAs, numbersOf, plainName, slugOf, type PublicRecipe } from "../recipes";
import { RecipeView } from "../screens/RecipePages";
import { instagramImages } from "../instaImages";
import { resizeImageBase64 } from "../utils/image";
import { useBack } from "../back";

// Canvas board R5 (7 October 2026), redrawn as RG1 to RG3 with RF4 (8 October): a cook publishes a recipe that's already
// in the app. The foods and grams come from the app; the cook adds what a reader needs. What is typed is kept with the
// recipe as a draft, never public; See the page shows it as a visitor will before anything goes live. Unpublish takes it
// down and the link says so; Publish again brings it back on the same link. Everyone sees a recipe (Q6); the steps live
// with the recipe (Q1); the names start without brands (Q2); the photos offered are the plate photos (Q4).
// A cook who isn't a coach sends the recipe to their coach, who sees the page and makes it live or sends it back (RG1, RG5)
export type Published = PublicRecipe & { status?: "live" | "down" | "waiting" | "back"; waiting?: boolean; note?: string };
export function PublishSheet({ meal, cards, author, published, close, onDone, onMeal, direct = true, approver = "your coach", client = false }: {
  meal: Meal; cards: Feedback[]; author: string; published: Published | null; close: () => void; onDone: (r: Published | null) => void; onMeal: (patch: Partial<Meal>) => void;
  direct?: boolean; approver?: string; client?: boolean;
}) {
  useBack(true, close);
  const mine = cards.filter((c) => c.meal?.title === meal.title).sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
  // photos to pick from: the plate photos of this recipe's cards; a food's pack photo can show a brand, so it isn't offered
  const candidates = useMemo(() => {
    const out: string[] = [];
    for (const c of mine) if (c.photo && !out.includes(c.photo)) out.push(c.photo);
    return out.slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meal.id]);
  const d: PublishDraft = meal.publish ?? {};
  const [extra, setExtra] = useState<string[]>([]);
  const photos = [...extra, ...candidates];
  const [photoAt, setPhotoAt] = useState(Math.min(d.photoAt ?? 0, Math.max(0, candidates.length - 1)));
  const [title, setTitle] = useState(d.title ?? published?.title ?? meal.title);
  const [lines, setLines] = useState(d.lines ?? published?.lines ?? "");
  const [makes, setMakes] = useState(d.makes ?? String(published?.makes ?? 1));
  const [servingName, setServingName] = useState(d.servingName ?? published?.servingName ?? "serving");
  const [minutes, setMinutes] = useState(d.minutes ?? (published?.minutes ? String(published.minutes) : ""));
  const [names, setNames] = useState<string[]>(() => meal.items.map((i, k) => d.names?.[k] ?? published?.items[k]?.name ?? plainName(i.food)));
  const [steps, setSteps] = useState((meal.steps ?? published?.steps ?? []).join("\n"));
  // kept with the recipe as it is typed (a short pause first), so the sheet can close at any time
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => onMeal({ steps: steps.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 30), publish: { title, lines, makes, servingName, minutes, names, photoAt: Math.max(0, photoAt - extra.length), savedAt: new Date().toISOString() } }), 500);
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
      steps: steps.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 30), rating, who: "everyone",
      per100: nums.per100, perServing: nums.perServing, all: nums.all, pd: nums.pd, proteinShare: nums.proteinShare, fits: fitsOf(nums.pd),
      hasPhoto: photos.length > 0, author, publishedAt: published?.publishedAt ?? now, updatedAt: now, mealId: meal.id,
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
      setDone(saved); onDone(saved); setPreviewing(false);
    } catch (e: any) { setErr(e.message); } finally { setBusy(""); }
  };
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
  const go = busy || (waits ? `Waiting for ${approver}` : !direct ? `Send to ${approver}` : live ? "Publish the changes" : state === "down" ? "Publish again" : "Publish");
  const preview = previewing ? recipe() : null;
  return (
    <div className="sheet-backdrop" onClick={close}>
      <div className="sheet publish-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Publish this recipe">
        <div className="card-top"><span>{meal.title}</span><button className="link" onClick={close}>Close</button></div>
        <div className="pub-head"><h2>{live ? "Published" : "Publish this recipe"}</h2><span className={`pub-state ${state}`}>{state === "live" ? "Live" : state === "down" ? "Taken down" : state === "waiting" ? `Waiting for ${approver}` : state === "back" ? "Sent back" : "Draft"}</span></div>
        {waits && <p className="small muted">{approver.charAt(0).toUpperCase() + approver.slice(1)} sees the page first and makes it live, or sends it back with a note.{live ? " The live page stays as it is until then." : ""}</p>}
        {!waits && done?.note && <p className="small pub-note">{approver.charAt(0).toUpperCase() + approver.slice(1)}: “{done.note}”</p>}
        {!live && !waits && <p className="small muted">{state === "down" ? "The link says this recipe was taken down. Publish again brings it back on the same link." : "Saved as you type, only here. Close it any time and come back."}</p>}
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
            <button className="publish-photo add" onClick={() => fileRef.current?.click()} aria-label="Choose a photo"><ImageIcon size={20} /></button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; const r = new FileReader(); r.onload = () => { setExtra((x) => [String(r.result), ...x]); setPhotoAt(0); }; r.readAsDataURL(f); }} />
          </div>
          <small className="muted">{photos.length ? "The plate photos from this recipe's cards. The one with the blue frame leads, on the page and on the images." : "Choose a photo of the plate; without one the page shows no photo."}</small>
        </div>
        <label className="field-label">Name<input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} /></label>
        <label className="field-label">Two lines about it<textarea value={lines} onChange={(e) => setLines(e.target.value)} maxLength={240} placeholder="Thin, soft, and they roll without breaking." /></label>
        <div className="two-fields">
          <label className="field-label">Makes<span className="makes"><input inputMode="numeric" value={makes} onChange={(e) => setMakes(e.target.value.replace(/[^\d]/g, ""))} /><input value={servingName} onChange={(e) => setServingName(e.target.value)} placeholder="crepe" aria-label="What one serving is called" /></span></label>
          <label className="field-label">Time, minutes<input inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/[^\d]/g, ""))} placeholder="35" /></label>
        </div>
        <div className="setting-block">
          <b className="field-label">The foods, as the page names them</b>
          <small className="muted">Mealan left out the brands; change a name if you like. It changes only the page.</small>
          {meal.items.map((i, k) => i.grams > 0 && (
            <div className="publish-item" key={k}><input value={names[k] ?? ""} onChange={(e) => setNames((xs) => xs.map((x, j) => (j === k ? e.target.value : x)))} aria-label={`Name of food ${k + 1}`} /><span>{amountOf(i.grams)}</span></div>
          ))}
        </div>
        <label className="field-label">Steps, one per line<textarea value={steps} onChange={(e) => setSteps(e.target.value)} rows={4} placeholder={"Whisk the eggs and the milk.\nAdd the flour and rest 15 minutes.\nA thin layer in a hot pan, a minute a side."} /></label>
        <small className="muted" style={{ marginTop: -8 }}>The steps stay with the recipe in the app too.</small>
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
          <button className="pill pill-wide pill-primary" onClick={publish} disabled={!nums || Boolean(claim) || Boolean(busy) || !title.trim() || waits}>{go}</button>
        </div>
        {live && <button className="pill pill-wide" onClick={unpublish} disabled={Boolean(busy)}><X size={15} /> Unpublish</button>}
      </div>
      {preview && (
        <div className="rp-preview" role="dialog" aria-label="See the page" onClick={(e) => e.stopPropagation()}>
          <RecipeView r={preview} member={null} photoSrc={photos[photoAt] ?? null} top={
            <div className="rp-preview-bar" style={{ margin: "-14px -18px 0" }}>
              <b>Preview: only you see this. {live ? "The live page changes when you publish." : "Nothing is live yet."}{!direct ? ` ${approver.charAt(0).toUpperCase() + approver.slice(1)} sees it before it goes live.` : ""}</b>
              <div className="ways"><button className="pill" onClick={() => setPreviewing(false)}>Back to the sheet</button><button className="pill pill-primary" onClick={publish} disabled={Boolean(claim) || Boolean(busy) || waits}>{go}</button></div>
            </div>} />
        </div>
      )}
    </div>
  );
}
