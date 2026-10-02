import { useRef, useState } from "react";
import { Camera, MessageCircle } from "lucide-react";
import { mixLabel, type Mix, type MixTip } from "../mixtip";
import { log } from "../log";
import { density, type Food } from "../pilot";
import { displayRows } from "../labeltable";
import { useEffect } from "react";
import { JOBS, jobOf, plainLine, todayLine } from "../foodjob";
import { fmt, fixed, pdText, pdVal, pdTag, pdRange } from "../ui";
import { iconFor } from "../icons";

export function FoodCard({ food, target, fit, close, review, dontHave, addPhoto, removePhoto, toggleFavorite, insight, mix }: { food: Food; target: number | null; fit: "high" | "mid" | "low"; close: () => void; review?: () => void; dontHave?: () => void; mix?: { tip: MixTip; momentName: string; take: (m: Mix) => void; ask: () => void }; addPhoto?: (dataUrl: string) => void; removePhoto?: (index: number) => void; toggleFavorite?: () => void; insight?: { dayKcal: number | null; eaten: number; dayName: string; goalKey: string; requestTip: () => Promise<void>; setJob: (job: string | null) => void } }) {
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
  const [view, setView] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const gallery = food.photos?.length ? food.photos : food.photo ? [food.photo] : [];
  const pd = density(food.protein, food.calories);
  const share = pd === null ? null : Math.round(pd * 4);
  const fitText = fit === "high" ? "fits your goal" : fit === "mid" ? "close to your goal" : "below your goal";
  return (
    <div className="sheet-backdrop" onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="card-top"><span>Nutrition per 100 g</span><button className="link" onClick={close}>Close</button></div>
        <div className="foodcard-head">
          <button className="thumb thumb-button" onClick={() => gallery[0] && setView(gallery[0])} aria-label="See the photo">{food.photo ? <img src={food.photo} alt="" /> : (food.icon || iconFor(food.name))}</button>
          <div><b>{food.name}</b><small>{food.brand || "no brand"}{food.barcode ? ` · ${food.barcode}` : ""}</small></div>
          {toggleFavorite && <button className={`fav ${food.favorite ? "on" : ""}`} onClick={toggleFavorite} aria-pressed={!!food.favorite} aria-label={food.favorite ? "Remove from favourites" : "Add to favourites"}>{food.favorite ? "★" : "☆"}</button>}
        </div>
        {(gallery.length > 1 || addPhoto) && (
          <div className="food-gallery" aria-label="Photos of this product">
            {gallery.length > 1 && gallery.map((src, i) => <button key={i} className="g-thumb" onClick={() => setView(src)} aria-label={`Photo ${i + 1}`}><img src={src} alt="" /></button>)}
            {addPhoto && gallery.length < 6 && (
              <button className="g-add" onClick={() => fileRef.current?.click()}><Camera size={16} /><span>{gallery.length ? "Add a photo" : "Add a photo of the front"}</span></button>
            )}
            <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => {
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
            {JOBS.map((j) => <button key={j} className={`pill pill-small ${job.job === j ? "pill-primary" : ""}`} onClick={() => { insight.setJob(j); setPicking(false); }}>{j}</button>)}
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
      {view && (
        <div className="photo-view" onClick={(e) => { e.stopPropagation(); setView(null); }}>
          <img src={view} alt="" />
          <span>Tap to close</span>
          {removePhoto && (
            <button className="pill pill-small photo-remove" onClick={(e) => { e.stopPropagation(); const i = gallery.indexOf(view); if (i >= 0) removePhoto(i); setView(null); }}>Remove this photo</button>
          )}
        </div>
      )}
    </div>
  );
}
