import { useRef, useState } from "react";
import { Camera, Send, ArrowLeft } from "lucide-react";
import { aggregate, density, solveIngredient, uid, type Ingredient, type Food } from "../pilot";
import { fmt, fixed } from "../ui";
import { CHEF_NAME } from "../components/Mark";
import { resizeImageBase64 } from "../utils/image";
import { log } from "../log";
import type { AppApi } from "./api";

type Rec = { name: string; calories: number | null; protein: number | null; fats: number | null; carbs: number | null; typical_grams: number; confidence: string };
type Turn = { role: "you" | "mealan"; text: string; picks?: Ingredient[]; pd?: number | null; kcal?: number | null; photo?: string };

const asFood = (r: Rec): Food => ({
  id: uid(), name: r.name, brand: "estimate", basis: "100g", source: "estimate", notes: `${r.confidence} confidence`,
  reviewedAt: new Date().toISOString(), readyToEat: true, calories: r.calories, protein: r.protein, fats: r.fats, carbs: r.carbs, fiber: null,
});

export function OutScreen(p: AppApi & { close: () => void }) {
  const { pdRef, setState, setBusy, setError, close, state } = p;
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const history = turns.map((t) => ({ role: t.role === "you" ? "user" : "assistant", content: t.text }));

  async function ask() {
    const msg = text.trim();
    if (!msg && !photo) return;
    const mine: Turn = { role: "you", text: msg || "(photo)", photo: photo || undefined };
    setTurns((t) => [...t, mine]); setText(""); setPhoto("");
    setBusy(`${CHEF_NAME} is looking`);
    try {
      const res = await fetch("/api/out", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: msg, image: photo || undefined, history,
          target: { pd: pdRef, mealKcal: state.goals.calories ? Math.round(state.goals.calories * 0.35) : null },
          plate: state.items.map((i) => ({ name: i.food.name, grams: i.grams, calories: i.food.calories, protein: i.food.protein })),
          library: state.foods.slice(0, 40).map((f) => ({ name: f.name, calories: f.calories, protein: f.protein })),
        }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Mealan could not answer.");
      const recs: Rec[] = data.recognised ?? [];
      // build the plate from Mealan's picks, then let the solver, not the model, settle the numbers
      let picks: Ingredient[] = (data.picks ?? []).map((pk: { name: string; grams: number }) => {
        const r = recs.find((x) => x.name.toLowerCase() === pk.name.toLowerCase()) ?? recs.find((x) => x.name.toLowerCase().includes(pk.name.toLowerCase()));
        return r ? { id: uid(), food: asFood(r), grams: Math.max(0, pk.grams), locked: true } : null;
      }).filter(Boolean) as Ingredient[];
      let pd = density(aggregate(picks).protein, aggregate(picks).calories);
      let fitNote = "";
      if (picks.length >= 2 && pd !== null && pdRef !== null && pd < pdRef - 0.05) {
        // move the pick with the most protein until the plate fits, within a normal portion
        const lever = [...picks].sort((a, b) => (density(b.food.protein, b.food.calories) ?? -1) - (density(a.food.protein, a.food.calories) ?? -1))[0];
        const trial = picks.map((i) => ({ ...i, locked: i.id !== lever.id }));
        const sol = solveIngredient(trial, lever.id, pdRef, null);
        if (sol.ok && sol.grams <= 400) { picks = sol.items.map((i) => ({ ...i, locked: true })); pd = density(aggregate(picks).protein, aggregate(picks).calories); fitNote = ` I moved the ${lever.food.name} to ${fmt(sol.grams, 0)} g so it fits.`; }
        else fitNote = ` Even with more ${lever.food.name} this stays under your target; it's a treat, not a fit.`;
      }
      const kcal = aggregate(picks).calories;
      const reply: Turn = { role: "mealan", text: (data.reply || "") + fitNote, picks, pd, kcal };
      setTurns((t) => [...t, reply]);
      log("out", { picks: picks.length, pd });
    } catch (e: any) { setError(e.message); } finally { setBusy(""); }
  }

  function keep(t: Turn) {
    if (!t.picks?.length) return;
    const meal = { id: uid(), title: `With Mealan: ${t.picks.map((i) => i.food.name).join(", ")}`, items: t.picks, portion: t.picks.reduce((n, i) => n + i.grams, 0), savedAt: new Date().toISOString() };
    setState((s) => ({ ...s, feedback: [{ id: uid(), meal, status: "eaten" as const, taste: "Chat", notes: turns.filter((x) => x.role === "you").map((x) => x.text).join(" / ").slice(0, 300), createdAt: new Date().toISOString() }, ...s.feedback] }));
    log("feedback", { status: "eaten", taste: "Chat" });
    close();
  }

  return (
    <>
      <div className="head">
        <h2>Chat with {CHEF_NAME}</h2>
        <p>Out, missing something, or after an idea. Say where you are or what you have, add a photo if it helps. Estimates are marked; the amounts come from your target.</p>
      </div>
      <div className="chat">
        {turns.length === 0 && <div className="strip">Try: "No skyr at home, what else goes with the Nutella?", "Hotel breakfast buffet" with a photo, or "Italian tonight, I want the tiramisu".</div>}
        {turns.map((t, i) => (
          <div key={i} className={`bubble ${t.role}`}>
            {t.photo && <img src={t.photo} alt="" />}
            <p>{t.text}</p>
            {t.picks && t.picks.length > 0 && (
              <div className="picks">
                {t.picks.map((i) => <div key={i.id}><b>{fmt(i.grams, 0)} g</b> {i.food.name} <small>~{fmt(i.food.calories, 0)} kcal · {fmt(i.food.protein)} g protein per 100 g</small></div>)}
                <div className="picks-total">PD {fixed(t.pd ?? null)}{pdRef !== null ? ` · target ${fixed(pdRef)}` : ""} · {fmt(t.kcal ?? null, 0)} kcal</div>
                <button className="pill pill-small" onClick={() => keep(t)}>This is what I had</button>
              </div>
            )}
          </div>
        ))}
      </div>
      {photo && <div className="strip">Photo attached. <button className="link" onClick={() => setPhoto("")}>Remove</button></div>}
      <div className="chat-input">
        <button className="icon" aria-label="Add a photo" onClick={() => fileRef.current?.click()}><Camera size={20} /></button>
        <input value={text} placeholder="Where are you, or what do you have?" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") ask(); }} enterKeyHint="send" />
        <button className="icon" aria-label="Send" onClick={ask}><Send size={20} /></button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => {
          const f = e.target.files?.[0]; if (!f) return;
          const r = new FileReader(); r.onload = () => resizeImageBase64(String(r.result), 1400, 1400).then(setPhoto).catch(() => {}); r.readAsDataURL(f); e.target.value = "";
        }} />
      </div>
      <button className="link back" onClick={close}><ArrowLeft size={14} /> Back</button>
    </>
  );
}
