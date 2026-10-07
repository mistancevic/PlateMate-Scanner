import { useRef, useState } from "react";
import { Camera, ChevronLeft, ChevronRight, MessageCircle, Trash2, X } from "lucide-react";
import { mixLabel, type Mix, type MixTip } from "../mixtip";
import { log } from "../log";
import { density, type Food } from "../pilot";
import { displayRows } from "../labeltable";
import { useEffect } from "react";
import { JOBS, jobOf, plainLine, todayLine } from "../foodjob";
import { fmt, fixed, pdText, pdVal, pdTag, pdRange } from "../ui";
import { iconFor } from "../icons";
import { useBack } from "../back";

export function FoodCard({ food, target, fit, close, review, dontHave, addPhoto, removePhoto, toggleFavorite, insight, mix }: { food: Food; target: number | null; fit: import("../goal").PdBand; close: () => void; review?: () => void; dontHave?: () => void; mix?: { tip: MixTip; momentName: string; take: (m: Mix) => void; ask: () => void }; addPhoto?: (dataUrl: string) => void; removePhoto?: (index: number) => void; toggleFavorite?: () => void; insight?: { dayKcal: number | null; eaten: number; dayName: string; goalKey: string; requestTip: () => Promise<void>; setJob: (job: string | null) => void } }) {
  const job = jobOf(food);
  const [picking, setPicking] = useState(false);
  const [tipState, setTipState] = useState<"idle" | "busy" | "failed">("idle");
  const tipFresh = food.tip && insight && food.tip.goalKey === insight.goalKey;
  // a Pro tip is written once per goal: ask only when there's none for this goal yet
  useEffect(() => {
    if (!insight || tipFresh || tipState !== "idle" || food.calories == null) return;
    setTipState("busy");
    insight.requestTip().then(() => setTipState("idle")).catch(() => setTipState("failed"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [food.id, tipFresh]);
  // the mix tip shown is logged once per card, on whichever screen the card opened
  useEffect(() => {
    if (!mix || mix.tip.case === "fits" || mix.tip.case === "unknown") return;
    log("mix_tip", { food: food.name, moment: mix.momentName, case: mix.tip.case, offered: mix.tip.mixes.map((m) => ({ partners: m.partners.map((x) => x.name), kind: m.kind, pd: Math.round(m.pd * 10) / 10, kcal: m.kcal })) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [food.id, mix?.momentName]);
  // which photo is open, by its place: two copies of the same picture are still two photos
  const [viewAt, setViewAt] = useState<number | null>(null);
  const swipeRef = useRef<number | null>(null);
  useBack(true, close);
  useBack(viewAt !== null, () => { setViewAt(null); setArmed(false); });
  const fileRef = useRef<HTMLInputElement>(null);
  const all = food.photos?.length ? food.photos : food.photo ? [food.photo] : [];
  // Removing a photo: a second tap arms it, and it is only really removed when the Undo note goes, eight seconds later,
  // or when the card closes. Until then the photo is just hidden.
  const [armed, setArmed] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const commitRef = useRef<() => void>(() => {});
  commitRef.current = () => { if (pending && removePhoto) { const i = all.indexOf(pending); if (i >= 0) removePhoto(i); } };
  useEffect(() => { if (!pending) return; const t = setTimeout(() => { commitRef.current(); setPending(null); }, 8000); return () => clearTimeout(t); }, [pending]);
  useEffect(() => () => commitRef.current(), []);
  useEffect(() => { if (!armed) return; const t = setTimeout(() => setArmed(false), 3000); return () => clearTimeout(t); }, [armed]);
  const gallery = all.filter((x) => x !== pending);
  const view = viewAt !== null ? gallery[viewAt] ?? null : null;
  // on a computer: the arrow keys move between photos, Escape closes the photo
  useEffect(() => {
    if (!view) return;
    const onKey = (e: KeyboardEvent) => {
      const g = gallery;
      const at = viewAt ?? 0;
      if (e.key === "Escape") { setViewAt(null); setArmed(false); }
      else if (g.length > 1 && (e.key === "ArrowRight" || e.key === "ArrowLeft")) { setArmed(false); setViewAt((at + (e.key === "ArrowRight" ? 1 : -1) + g.length) % g.length); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, viewAt, gallery.length, food.photos, pending]);
  const pd = density(food.protein, food.calories);
  const share = pd === null ? null : Math.round(pd * 4);
  const fitText = fit === "top" ? "high+ protein for your goal" : fit === "high" ? "high protein for your goal" : fit === "plan" ? "on plan" : fit === "close" ? "a bit under your goal" : "far under your goal";
  return (
    <div className="sheet-backdrop" onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="card-top"><span>Nutrition per 100 g</span><button className="link" onClick={close}>Close</button></div>
        <div className="foodcard-head">
          <button className="thumb thumb-button" onClick={() => gallery[0] && setViewAt(0)} aria-label="See the photo">{food.photo ? <img src={food.photo} alt="" /> : (food.icon || iconFor(food.name))}</button>
          <div><b>{food.name}</b><small>{food.brand || "no brand"}{food.barcode ? ` · ${food.barcode}` : ""}</small></div>
          {toggleFavorite && <button className={`fav ${food.favorite ? "on" : ""}`} onClick={toggleFavorite} aria-pressed={!!food.favorite} aria-label={food.favorite ? "Remove from favourites" : "Add to favourites"}>{food.favorite ? "★" : "☆"}</button>}
        </div>
        {(gallery.length > 1 || addPhoto) && (
          <div className="food-gallery" aria-label="Photos of this product">
            {gallery.length > 1 && gallery.map((src, i) => <button key={i} className="g-thumb" onClick={() => setViewAt(i)} aria-label={`Photo ${i + 1}`}><img src={src} alt="" /></button>)}
            {addPhoto && gallery.length < 6 && (
              <button className="g-add" onClick={() => fileRef.current?.click()}><Camera size={16} /><span>{gallery.length ? "Add a photo" : "Add a photo of the front"}</span></button>
            )}
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => {
              const file = e.target.files?.[0]; e.target.value = ""; if (!file || !addPhoto) return;
              const r = new FileReader(); r.onload = () => addPhoto(String(r.result)); r.readAsDataURL(file);
            }} />
          </div>
        )}
        <div className="job-row">
          <button className="job-chip" onClick={() => insight && setPicking(!picking)} aria-label="What this food is">{job.job}{job.note ? ` · ${job.note}` : ""}{job.taste && job.job !== "Flavour food" ? ` · ${job.taste}` : ""}</button>
          {job.mine && <small>your label</small>}
        </div>
        {picking && insight && (
          <div className="moments job-pick">
            {JOBS.map((j) => <button key={j} className={`choice ${job.job === j ? "on" : ""}`} onClick={() => { insight.setJob(j); setPicking(false); }}>{j}</button>)}
            {job.mine && <button className="link" onClick={() => { insight.setJob(null); setPicking(false); }}>Use Mealan's label</button>}
          </div>
        )}
        <section className={`readout readout-fit-${fit}`}>
          <div className="readout-top"><span>Protein density</span><span>{pdTag()}</span></div>
          <div className="readout-mid">
            <b>{pdVal(pd)}</b>
            <div><span>{fitText}{target !== null ? `, target ${fixed(target)}` : ""}</span><small>{share !== null ? `${share} % of its energy is protein` : "no protein value"}</small></div>
          </div>
        </section>
        <p className="insight">{plainLine(food, target)}</p>
        {mix && mix.tip.case !== "fits" && mix.tip.case !== "unknown" && (
          <section className="mix-tip">
            <div className="mix-head"><span className="pro-badge">Mix it</span><small>{mix.momentName}: {mix.tip.why}</small></div>
            {mix.tip.mixes.length === 0 && <p className="muted">Nothing in your foods or the starter set gets there with this one.</p>}
            {mix.tip.mixes.map((m) => (
              <button key={m.id} className="mix-chip" onClick={() => mix.take(m)}>
                <b>{mixLabel(m)}</b>
                <small>{pdText(m.pd)} · {m.kcal} kcal · {m.kind}{m.cooking ? " · cooking" : ""}{m.fromStarter.length ? " · from the starter set" : ""}</small>
              </button>
            ))}
            <button className="link" onClick={mix.ask}><MessageCircle size={14} /> Not quite? Tell Mealan</button>
          </section>
        )}
        {insight && (() => { const t = todayLine(food, insight.dayKcal, insight.eaten, insight.dayName); return t ? <p className="insight insight-today">{t}</p> : null; })()}
        {insight && (
          <section className="pro-tip">
            <span className="pro-badge">Pro tip</span>
            {tipFresh ? <p>{food.tip!.text}</p> : tipState === "busy" ? <p className="muted">Mealan is writing a tip for your goal…</p> : tipState === "failed" ? <p className="muted">No tip just now. <button className="link" onClick={() => { setTipState("busy"); insight.requestTip().then(() => setTipState("idle")).catch(() => setTipState("failed")); }}>Try again</button></p> : null}
          </section>
        )}
        <div className="label-table label-table-read" aria-label="Nutrition table per 100 g">
          {displayRows(food).map((r, i) => (
            <div className={`lt-row ${r.sub ? "sub" : ""}`} key={r.key + i}>
              <span className="lt-name">{r.name}{r.source === "you" && <em> · added by you</em>}</span>
              <b className="lt-val">{r.amount == null ? "–" : fmt(r.amount, r.unit === "kcal" ? 0 : 1)}</b>
              <span className="lt-unit">{r.unit}</span>
            </div>
          ))}
        </div>
        <p className="small">{food.readyToEat ? "Ready to eat as it is." : "Needs preparation before eating."} Values from the {food.source === "label" ? "label" : food.source}, check your package.</p>
        {dontHave && <button className="pill pill-wide pill-primary" onClick={dontHave}>Don't have it? Find something instead</button>}
        {review && <button className="pill pill-wide" onClick={() => { close(); review(); }}>Review the label</button>}
      </div>
      {view && (() => {
        // canvas board C4 (Milan, 7 October 2026): the next photo without closing; swipe, the arrows, a photo below, or
        // the arrow keys on a computer. With several, tapping the photo doesn't close it, so a swipe can't close it by
        // accident; with one photo, tapping it closes it, as before (Milan, 7 October 2026).
        const at = viewAt ?? 0, many = gallery.length > 1;
        const go = (d: number) => { setArmed(false); setViewAt((at + d + gallery.length) % gallery.length); };
        return (
          <div className="photo-view" role="dialog" aria-label="Photo" onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => { swipeRef.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => { const x0 = swipeRef.current; swipeRef.current = null; if (x0 === null || !many) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); }}>
            <div className="photo-top">
              {removePhoto ? (
                <button className={`photo-remove ${armed ? "armed" : ""}`} onClick={(e) => { e.stopPropagation(); if (!armed) { setArmed(true); return; } if (pending) commitRef.current(); setPending(view); setArmed(false); setViewAt(null); }}>
                  <Trash2 size={15} /> {armed ? "Tap again to remove" : "Remove"}
                </button>
              ) : <span />}
              {many && <b className="photo-count">{at + 1} of {gallery.length}</b>}
              <button className="photo-close" aria-label="Close the photo" onClick={(e) => { e.stopPropagation(); setArmed(false); setViewAt(null); }}><X size={22} /></button>
            </div>
            <img src={view} alt={`Photo ${at + 1} of ${gallery.length}`} draggable={false} onClick={() => { if (!many) { setArmed(false); setViewAt(null); } }} />
            {many && <button className="photo-arrow prev" aria-label="Previous photo" onClick={(e) => { e.stopPropagation(); go(-1); }}><ChevronLeft size={26} /></button>}
            {many && <button className="photo-arrow next" aria-label="Next photo" onClick={(e) => { e.stopPropagation(); go(1); }}><ChevronRight size={26} /></button>}
            {many && (
              <div className="photo-strip">
                {gallery.map((src, i) => <button key={i} className={i === at ? "on" : ""} aria-label={`Show photo ${i + 1}`} aria-current={i === at} onClick={(e) => { e.stopPropagation(); setArmed(false); setViewAt(i); }}><img src={src} alt="" /></button>)}
              </div>
            )}
            <span>{many ? "Swipe, or tap a photo below" : "Tap the photo to close"}</span>
          </div>
        );
      })()}
      {pending && (
        <div className="undo-note" role="status">
          <span>Photo removed.</span>
          <button className="link" onClick={(e) => { e.stopPropagation(); setPending(null); }}>Undo</button>
        </div>
      )}
    </div>
  );
}
