import { useMemo, useRef, useState } from "react";
import { Check, Copy, Download, Image as ImageIcon, X } from "lucide-react";
import type { Feedback, Meal } from "../pilot";
import { amountOf, claimProblem, fitsOf, numbersOf, slugOf, type PublicRecipe } from "../recipes";
import { instagramImages } from "../instaImages";
import { resizeImageBase64 } from "../utils/image";
import { useBack } from "../back";

// Canvas board R5 (approved 7 October 2026): a coach publishes a recipe that's already in the app. The foods and grams
// come from the app; the coach adds what a reader needs. Then: the link, the Instagram images, Unpublish at any time.
export function PublishSheet({ meal, cards, author, published, close, onDone }: {
  meal: Meal; cards: Feedback[]; author: string; published: PublicRecipe | null; close: () => void; onDone: (r: PublicRecipe | null) => void;
}) {
  useBack(true, close);
  const mine = cards.filter((c) => c.meal?.title === meal.title).sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
  // photos to pick from: the plate photos of this recipe's cards, then its foods' own photos
  const candidates = useMemo(() => {
    const out: string[] = [];
    for (const c of mine) if (c.photo && !out.includes(c.photo)) out.push(c.photo);
    for (const i of meal.items) for (const p of [...(i.food.photos ?? []), ...(i.food.photo && !(i.food.photo.startsWith("data:image/svg")) ? [i.food.photo] : [])]) if (p && !out.includes(p) && out.length < 8) out.push(p);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meal.id]);
  const [extra, setExtra] = useState<string[]>([]);
  const photos = [...extra, ...candidates];
  const [photoAt, setPhotoAt] = useState(0);
  const [title, setTitle] = useState(published?.title ?? meal.title);
  const [lines, setLines] = useState(published?.lines ?? "");
  const [makes, setMakes] = useState(String(published?.makes ?? 1));
  const [servingName, setServingName] = useState(published?.servingName ?? "serving");
  const [minutes, setMinutes] = useState(published?.minutes ? String(published.minutes) : "");
  const [names, setNames] = useState<string[]>(() => meal.items.map((i, k) => published?.items[k]?.name ?? i.food.name));
  const [steps, setSteps] = useState((published?.steps ?? []).join("\n"));
  const [who, setWho] = useState<"everyone" | "members">(published?.who ?? "everyone");
  const lastTaste = mine[0]?.taste ?? "";
  const rating: PublicRecipe["rating"] = /daam/i.test(lastTaste) ? "daam" : /good/i.test(lastTaste) ? "good" : null;
  const n = Number(makes);
  const nums = numbersOf(meal, Number.isFinite(n) && n >= 1 ? Math.round(n) : 1);
  const claim = nums ? claimProblem(title, lines, nums.proteinShare) : null;
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [done, setDone] = useState<PublicRecipe | null>(published);
  const fileRef = useRef<HTMLInputElement>(null);

  const recipe = (): PublicRecipe | null => {
    if (!nums) return null;
    const now = new Date().toISOString();
    return {
      slug: published?.slug ?? slugOf(title), title: title.trim(), lines: lines.trim(), makes: Math.max(1, Math.round(n) || 1), servingName: servingName.trim() || "serving",
      minutes: Number(minutes) > 0 ? Math.round(Number(minutes)) : null,
      items: meal.items.filter((i) => i.grams > 0).map((i) => ({ name: (names[meal.items.indexOf(i)] ?? i.food.name).trim() || i.food.name, grams: Math.round(i.grams), amount: amountOf(i.grams), per100: { kcal: i.food.calories, protein: i.food.protein, fat: i.food.fats, carbs: i.food.carbs, fibre: i.food.fiber } })),
      steps: steps.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 30), rating, who,
      per100: nums.per100, perServing: nums.perServing, all: nums.all, pd: nums.pd, proteinShare: nums.proteinShare, fits: fitsOf(nums.pd),
      hasPhoto: photos.length > 0, author, publishedAt: published?.publishedAt ?? now, updatedAt: now, mealId: meal.id,
    };
  };
  const photoNow = async () => (photos[photoAt] ? await resizeImageBase64(photos[photoAt], 1080, 1080).catch(() => photos[photoAt]) : null);
  const publish = async () => {
    const r = recipe(); if (!r || claim) return;
    setBusy("Publishing…"); setErr("");
    try {
      const res = await fetch("/api/recipes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipe: r, photo: await photoNow() }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Publishing didn't work. Try again.");
      const saved = { ...r, slug: d.slug || r.slug };
      setDone(saved); onDone(saved);
    } catch (e: any) { setErr(e.message); } finally { setBusy(""); }
  };
  const unpublish = async () => {
    if (!done) return;
    setBusy("Taking it down…");
    try { await fetch(`/api/recipes/${done.slug}`, { method: "DELETE" }); setDone(null); onDone(null); } catch { setErr("It couldn't be taken down. Try again."); } finally { setBusy(""); }
  };
  const link = done ? `${location.origin}/r/${done.slug}` : "";
  const [copied, setCopied] = useState(false);
  const images = async () => {
    if (!done) return;
    setBusy("Making the images…");
    try {
      const imgs = await instagramImages(done, await photoNow());
      const files = await Promise.all(imgs.map(async (x) => new File([await (await fetch(x.dataUrl)).blob()], `${done.slug}-${x.name}`, { type: "image/jpeg" })));
      const nav: any = navigator;
      if (nav.canShare?.({ files })) await nav.share({ files, title: done.title });
      else for (const f of files) { const a = document.createElement("a"); a.href = URL.createObjectURL(f); a.download = f.name; a.click(); await new Promise((r) => setTimeout(r, 300)); }
    } catch (e: any) { if (e?.name !== "AbortError") setErr("The images couldn't be made. Try again."); } finally { setBusy(""); }
  };

  return (
    <div className="sheet-backdrop" onClick={close}>
      <div className="sheet publish-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Publish this recipe">
        <div className="card-top"><span>{meal.title}</span><button className="link" onClick={close}>Close</button></div>
        <h2>{done ? "Published" : "Publish this recipe"}</h2>
        {!done && <p className="small muted">Only coaches see this. The foods and their grams come from the app; you add what a reader needs.</p>}
        {done && (
          <div className="publish-done">
            <a className="publish-link" href={`/r/${done.slug}`} target="_blank" rel="noreferrer">{link.replace(/^https?:\/\//, "")}</a>
            <div className="ways">
              <button className="pill pill-small" onClick={async () => { try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* the link is there to copy by hand */ } }}>{copied ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy link</>}</button>
              <button className="pill pill-small pill-primary" onClick={images} disabled={Boolean(busy)}><Download size={15} /> The Instagram images</button>
            </div>
            <small className="muted">Four images for a carousel, and the numbers as a reel's last frame. Changing the recipe here and publishing again updates the page.</small>
          </div>
        )}
        <div className="setting-block">
          <b className="field-label">Photo</b>
          <div className="publish-photos">
            {photos.map((src, i) => <button key={i} className={`publish-photo ${photoAt === i ? "on" : ""}`} onClick={() => setPhotoAt(i)} aria-label={`Photo ${i + 1}${photoAt === i ? ", the one shown" : ""}`}><img src={src} alt="" /></button>)}
            <button className="publish-photo add" onClick={() => fileRef.current?.click()} aria-label="Choose a photo"><ImageIcon size={20} /></button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; const r = new FileReader(); r.onload = () => { setExtra((x) => [String(r.result), ...x]); setPhotoAt(0); }; r.readAsDataURL(f); }} />
          </div>
          <small className="muted">{photos.length ? "The one with the blue frame leads, on the page and on the images." : "Choose a photo of the plate; without one the page shows no photo."}</small>
        </div>
        <label className="field-label">Name<input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} /></label>
        <label className="field-label">Two lines about it<textarea value={lines} onChange={(e) => setLines(e.target.value)} maxLength={240} placeholder="Thin, soft, and they roll without breaking." /></label>
        <div className="two-fields">
          <label className="field-label">Makes<span className="makes"><input inputMode="numeric" value={makes} onChange={(e) => setMakes(e.target.value.replace(/[^\d]/g, ""))} /><input value={servingName} onChange={(e) => setServingName(e.target.value)} placeholder="crepe" aria-label="What one serving is called" /></span></label>
          <label className="field-label">Time, minutes<input inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/[^\d]/g, ""))} placeholder="35" /></label>
        </div>
        <div className="setting-block">
          <b className="field-label">The foods, as the page names them</b>
          <small className="muted">No brands on the public page: change a name if it has one.</small>
          {meal.items.map((i, k) => i.grams > 0 && (
            <div className="publish-item" key={k}><input value={names[k] ?? ""} onChange={(e) => setNames((xs) => xs.map((x, j) => (j === k ? e.target.value : x)))} aria-label={`Name of food ${k + 1}`} /><span>{amountOf(i.grams)}</span></div>
          ))}
        </div>
        <label className="field-label">Steps, one per line<textarea value={steps} onChange={(e) => setSteps(e.target.value)} rows={4} placeholder={"Whisk the eggs and the milk.\nAdd the flour and rest 15 minutes.\nA thin layer in a hot pan, a minute a side."} /></label>
        <div className="setting-block">
          <b className="field-label">Who sees it</b>
          <div className="moments">
            <button className={`choice ${who === "everyone" ? "on" : ""}`} onClick={() => setWho("everyone")}>Everyone</button>
            <button className={`choice ${who === "members" ? "on" : ""}`} onClick={() => setWho("members")}>Members</button>
          </div>
          <small className="muted">{who === "everyone" ? "Everyone: the whole recipe is public; members also see their amounts." : "Members: a visitor sees the photo, the name and the numbers; the foods and the steps say Members only."}</small>
        </div>
        <div className="publish-checks">
          {nums ? <span className={nums.proteinShare >= 20 ? "ok" : "plain"}>{nums.proteinShare >= 20 ? "✓ High protein: " : "Protein: "}{nums.proteinShare} % of the energy is protein</span> : <span className="no">Some foods have no energy or protein value: add them before publishing</span>}
          {nums && <span className="ok">✓ One {servingName || "serving"}: {nums.perServing.kcal} kcal · {nums.perServing.protein} g protein · PD {nums.pd}</span>}
          <span className={rating ? "ok" : "plain"}>{rating === "daam" ? "✓ Your rating: DaaM good" : rating === "good" ? "✓ Your rating: Good" : "No rating yet: rate it on the Plate to show DaaM good"}</span>
          {claim && <span className="no">{claim}</span>}
        </div>
        {err && <p className="small" style={{ color: "var(--low)" }}>{err}</p>}
        <button className="pill pill-wide pill-primary" onClick={publish} disabled={!nums || Boolean(claim) || Boolean(busy) || !title.trim()}>{busy || (done ? "Publish the changes" : "Publish")}</button>
        {done && <button className="pill pill-wide" onClick={unpublish} disabled={Boolean(busy)}><X size={15} /> Unpublish</button>}
      </div>
    </div>
  );
}
