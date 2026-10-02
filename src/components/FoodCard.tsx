import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { density, type Food } from "../pilot";
import { fmt, fixed, pdText, pdVal, pdTag, pdRange } from "../ui";
import { iconFor } from "../icons";

const role = (pd: number | null) =>
  pd === null ? "unknown" : pd < 3 ? "flavour, fat or carbs: the reason you want it" : pd < 5 ? "mixed: look at the amount and the rest of the plate" : pd < 10 ? "helps the protein along" : "a protein base to build on";

export function FoodCard({ food, target, fit, close, review, dontHave, addPhoto }: { food: Food; target: number | null; fit: "high" | "mid" | "low"; close: () => void; review?: () => void; dontHave?: () => void; addPhoto?: (dataUrl: string) => void }) {
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
        <section className={`readout readout-fit-${fit}`}>
          <div className="readout-top"><span>Protein density</span><span>{pdTag()}</span></div>
          <div className="readout-mid">
            <b>{pdVal(pd)}</b>
            <div><span>{fitText}{target !== null ? `, target ${fixed(target)}` : ""}</span><small>{share !== null ? `${share} % of its energy is protein` : "no protein value"}</small></div>
          </div>
        </section>
        <div className="nut-grid">
          <div><b>{fmt(food.calories, 0)}</b><small>kcal</small></div>
          <div><b>{fmt(food.fats)}</b><small>g fat</small></div>
          <div><b>{fmt(food.carbs)}</b><small>g carbs</small></div>
          <div><b>{fmt(food.fiber)}</b><small>g fibre</small></div>
          <div><b>{fmt(food.protein)}</b><small>g protein</small></div>
        </div>
        <p className="small">Role in a recipe: {role(pd)}.</p>
        <p className="small">{food.readyToEat ? "Ready to eat as it is." : "Needs preparation before eating."} Values from the {food.source === "label" ? "label" : food.source}, check your package.</p>
        {dontHave && <button className="pill pill-wide pill-primary" onClick={dontHave}>Don't have it? Find something instead</button>}
        {review && <button className="pill pill-wide" onClick={() => { close(); review(); }}>Review the label</button>}
      </div>
      {view && (
        <div className="photo-view" onClick={(e) => { e.stopPropagation(); setView(null); }}>
          <img src={view} alt="" />
          <span>Tap to close</span>
        </div>
      )}
    </div>
  );
}
