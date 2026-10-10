import { useEffect, useRef, useState } from "react";
import { Camera, Send } from "lucide-react";
import { aggregate, density, solveIngredient, uid, type Ingredient, type Food } from "../pilot";
import { fmt, fixed, pdText, pdVal, pdTag, pdRange } from "../ui";
import { CHEF_NAME } from "../components/Mark";
import { resizeImageBase64 } from "../utils/image";
import { log } from "../log";
import type { AppApi } from "./api";
import { SafetyNote } from "../components/SafetyNote";
import { FIXED, takeModelFlag } from "../safety";

type Rec = { name: string; calories: number | null; protein: number | null; fats: number | null; carbs: number | null; typical_grams: number; confidence: string };
export type Turn = { role: "you" | "mealan"; text: string; picks?: Ingredient[]; pd?: number | null; kcal?: number | null; photo?: string; plate?: string[] };

const asFood = (r: Rec): Food => ({
  id: uid(), name: r.name, brand: "estimate", basis: "100g", source: "estimate", notes: `${r.confidence} confidence`,
  reviewedAt: new Date().toISOString(), readyToEat: true, calories: r.calories, protein: r.protein, fats: r.fats, carbs: r.carbs, fiber: null,
});

export function OutScreen(p: AppApi & { toPlate: () => void; close: () => void; turns: Turn[]; setTurns: (f: (t: Turn[]) => Turn[]) => void }) {
  const { pdRef, setState, setError, state } = p;
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState("");
  const { turns, setTurns, close } = p;
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [thinking, setThinking] = useState(false);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [turns, thinking]);
  const history = turns.slice(-6).map((t) => ({ role: t.role === "you" ? "user" : "assistant", content: t.text }));

  async function ask(given?: string) {
    const msg = (typeof given === "string" ? given : text).trim();
    if (!msg && !photo) return;
    if (!p.ai.on) { setTurns((t) => [...t, { role: "you", text: msg || "(photo)" }, { role: "mealan", text: p.ai.why || FIXED.off }]); setText(""); setPhoto(""); return; }
    const mine: Turn = { role: "you", text: msg || "(photo)", photo: photo || undefined };
    setTurns((t) => [...t, mine]); setText(""); setPhoto("");
    setThinking(true);
    try {
      const res = await fetch("/api/out", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: msg, image: photo || undefined, history,
          target: { pd: pdRef, mealKcal: state.goals.calories ? Math.round(state.goals.calories * (p.kind === "dessert" ? 0.1 : 0.35)) : null },
          kind: p.kind,
          plate: state.items.map((i) => ({ name: i.food.name, grams: i.grams, calories: i.food.calories, protein: i.food.protein })),
          goal: p.goal?.band,
          rhythm: p.usual, moment: p.moment, region: p.region, travelTo: p.moment === "travel" ? p.travelTo : null,
          library: state.foods.slice(0, 24).map((f) => ({ name: f.name, calories: f.calories, protein: f.protein })),
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
      const taken = takeModelFlag(data.reply || ""); if (taken.flag) p.flagFromModel(taken.flag);
      const reply: Turn = { role: "mealan", text: taken.text + fitNote, picks, pd, kcal };
      setTurns((t) => [...t, reply]);
      log("out", { picks: picks.length, pd });
    } catch (e: any) { setError(e.message); } finally { setThinking(false); }
  }

  function toPlate(t: Turn) {
    if (!t.picks?.length) return;
    const items = t.picks.map((i) => {
      const lib = state.foods.find((f) => f.name.toLowerCase() === i.food.name.toLowerCase());
      return { id: uid(), food: lib ?? i.food, grams: i.grams, locked: false };
    });
    setState((s) => ({ ...s, items, portion: null }));
    p.toPlate();
  }
  function keep(t: Turn) {
    if (!t.picks?.length) return;
    const meal = { id: uid(), title: `With Mealan: ${t.picks.map((i) => i.food.name).join(", ")}`, items: t.picks, portion: t.picks.reduce((n, i) => n + i.grams, 0), savedAt: new Date().toISOString() };
    setState((s) => ({ ...s, feedback: [{ id: uid(), meal, status: "eaten" as const, taste: "Chat", notes: turns.filter((x) => x.role === "you").map((x) => x.text).join(" / ").slice(0, 300), createdAt: new Date().toISOString() }, ...s.feedback] }));
    log("feedback", { status: "eaten", taste: "Chat" });
    p.notify("Saved to your meals.");
  }

  return (
    <div className="chat-screen">
      <div className="head">
        <div className="menu-head"><h2>{CHEF_NAME}</h2><button className="link" onClick={close}>Close</button></div>
        <p>Out, missing something, or after an idea. Say where you are or what you have, add a photo if it helps. Estimates are marked; the amounts come from your target.</p>
        <SafetyNote safety={p.safety} ai={p.ai} />
      </div>
      <div className="chat">
        {turns.length === 0 && (
          <div className="moments chips-start">
            {["No idea, inspire me", "I'm out, what do I take?", "Hotel breakfast buffet", "Plan food for a trip", "Italian tonight, I want dessert"].map((c) => (
              <button key={c} className="pill pill-small" onClick={() => ask(c)}>{c}</button>
            ))}
          </div>
        )}
        {turns.map((t, i) => (
          <div key={i} className={`bubble ${t.role}`}>
            {t.photo && <img src={t.photo} alt="" />}
            {t.plate && <span className="plate-chip">Plate: {t.plate.join(" · ")}</span>}
            <p>{t.text}</p>
            {t.picks && t.picks.length > 0 && (
              <div className="picks">
                {t.picks.map((i) => <div key={i.id}><b>{fmt(i.grams, 0)} g</b> {i.food.name} <small>~{fmt(i.food.calories, 0)} kcal · {fmt(i.food.protein)} g protein per 100 g</small></div>)}
                <div className="picks-total">{pdText(t.pd ?? null)}{pdRef !== null ? ` · target ${pdVal(pdRef)}` : ""} · {fmt(t.kcal ?? null, 0)} kcal</div>
                <div className="button-row">
                  <button className="pill pill-small pill-primary" onClick={() => toPlate(t)}>Work on it with {CHEF_NAME}</button>
                  <button className="pill pill-small" onClick={() => keep(t)}>This is what I had</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {thinking && <div className="bubble mealan thinking"><span /><span /><span /></div>}
        <div ref={endRef} />
      </div>
      <div className="chat-bottom">
      {photo && <div className="strip">Photo attached. <button className="link" onClick={() => setPhoto("")}>Remove</button></div>}
      <div className="chat-input">
        <button className="icon" aria-label="Add a photo" onClick={() => fileRef.current?.click()}><Camera size={20} /></button>
        <input value={text} placeholder="Where are you, or what do you have?" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") ask(); }} enterKeyHint="send" />
        <button className="icon" aria-label="Send" onClick={() => ask()}><Send size={20} /></button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => {
          const f = e.target.files?.[0]; if (!f) return;
          const r = new FileReader(); r.onload = () => resizeImageBase64(String(r.result), 1024, 1024).then(setPhoto).catch(() => {}); r.readAsDataURL(f); e.target.value = "";
        }} />
      </div>
      </div>
    </div>
  );
}
