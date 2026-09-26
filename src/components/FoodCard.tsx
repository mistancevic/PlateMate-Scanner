import { density, type Food } from "../pilot";
import { fmt, fixed } from "../ui";
import { iconFor } from "../icons";

const role = (pd: number | null) =>
  pd === null ? "unknown" : pd < 3 ? "flavour, fat or carbs: the reason you want it" : pd < 5 ? "mixed: look at the amount and the rest of the plate" : pd < 10 ? "helps the protein along" : "a protein base to build on";

export function FoodCard({ food, target, fit, close, review }: { food: Food; target: number | null; fit: "high" | "mid" | "low"; close: () => void; review?: () => void }) {
  const pd = density(food.protein, food.calories);
  const share = pd === null ? null : Math.round(pd * 4);
  const fitText = fit === "high" ? "fits your goal" : fit === "mid" ? "close to your goal" : "below your goal";
  return (
    <div className="sheet-backdrop" onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="card-top"><span>Nutrition per 100 g</span><button className="link" onClick={close}>Close</button></div>
        <div className="foodcard-head">
          <span className="thumb">{food.photo ? <img src={food.photo} alt="" /> : (food.icon || iconFor(food.name))}</span>
          <div><b>{food.name}</b><small>{food.brand || "no brand"}{food.barcode ? ` · ${food.barcode}` : ""}</small></div>
        </div>
        <section className="readout">
          <div className="readout-top"><span>Protein density</span><span>PD</span></div>
          <div className="readout-mid">
            <b>{fixed(pd)}</b>
            <div><span>{fitText}{target !== null ? `, target ${fixed(target)}` : ""}</span><small>{share !== null ? `${share} % of its energy is protein` : "no protein value"}</small></div>
          </div>
        </section>
        <div className="nut-grid">
          <div><b>{fmt(food.calories, 0)}</b><small>kcal</small></div>
          <div><b>{fmt(food.protein)}</b><small>g protein</small></div>
          <div><b>{fmt(food.fats)}</b><small>g fat</small></div>
          <div><b>{fmt(food.carbs)}</b><small>g carbs</small></div>
          <div><b>{fmt(food.fiber)}</b><small>g fibre</small></div>
        </div>
        <p className="small">Role in a recipe: {role(pd)}.</p>
        <p className="small">{food.readyToEat ? "Ready to eat as it is." : "Needs preparation before eating."} Values from the {food.source === "label" ? "label" : food.source}, check your package.</p>
        {review && <button className="pill pill-wide" onClick={() => { close(); review(); }}>Review the label</button>}
      </div>
    </div>
  );
}
