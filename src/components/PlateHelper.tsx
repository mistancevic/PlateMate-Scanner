import { useEffect, useRef, useState } from "react";
import { Send, Replace, Plus, Scale, Check } from "lucide-react";
import { density, solveIngredient, uid, type Food, type Ingredient } from "../pilot";
import { rankSwaps, sameFood } from "../swaps";
import { fmt, pdText } from "../ui";
import { log } from "../log";

type Suggestion = { action: "add" | "swap" | "amount"; food: string; replaces: string | null; grams: number | null; calories: number | null; protein: number | null; why: string; known: boolean };

// Help inside the plate: ask about it, get up to three actions, tap one. Closing leaves the plate as it was, plus what you tapped.
export function PlateHelper({ items, library, pdRef, cap, missing, prefill, apply, close, setError, openTalk, record }: {
  items: Ingredient[]; library: Food[]; pdRef: number | null; cap: number | null; missing?: Ingredient | null; prefill?: string;
  apply: (next: Ingredient[], note: string) => void; close: () => void; setError: (m: string) => void; openTalk?: () => void; record?: (q: string, reply: string, plate: string[]) => void;
}) {
  const [q, setQ] = useState(prefill ?? (missing ? `I don't have ${missing.food.name}. What instead?` : ""));
  // suggestions taken in this conversation: the helper stays open, so a second one can be added
  const [taken, setTaken] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState("");
  const [sugs, setSugs] = useState<Suggestion[]>([]);
  const asked = useRef(false);
  const codeSwaps = missing && pdRef !== null ? rankSwaps(items, missing.id, library, pdRef, cap, missing.food.name).filter((s) => s.fits).slice(0, 3) : [];

  // the solver, not the model, sets the grams of anything added or swapped in
  const fit = (next: Ingredient[], id: string, fallback: number) => {
    if (pdRef === null) return next;
    const r = solveIngredient(next.map((i) => ({ ...i, locked: i.id !== id })), id, pdRef, null);
    const grams = r.ok && r.grams <= (cap ?? 300) ? r.grams : fallback;
    return next.map((i) => (i.id === id ? { ...i, grams, locked: false } : i));
  };
  const toFood = (s: Suggestion): Food => library.find((f) => f.name.toLowerCase() === s.food.toLowerCase()) ?? {
    id: uid(), name: s.food, brand: "estimate", basis: "100g", source: "estimate", notes: "estimate from Mealan", reviewedAt: new Date().toISOString(), readyToEat: true,
    calories: s.calories, protein: s.protein, fats: null, carbs: null, fiber: null,
  };
  function take(s: Suggestion) {
    let next = items.map((i) => ({ ...i }));
    if (s.action === "amount") {
      const t = next.find((i) => sameFood(i.food.name, s.food)); if (!t || s.grams === null) return;
      t.grams = s.grams; t.locked = true;
    } else if (s.action === "swap") {
      const t = next.find((i) => s.replaces && sameFood(i.food.name, s.replaces)) ?? missing ?? null; if (!t) return;
      const id = t.id; next = next.map((i) => (i.id === id ? { ...i, food: toFood(s) } : i)); next = fit(next, id, t.grams);
    } else {
      const id = uid(); next = fit([...next, { id, food: toFood(s), grams: 100, locked: false }], id, 100);
    }
    log("plate_question", { q, plate: items.map((i) => i.food.name), applied: s.action, food: s.food });
    apply(next, s.action === "amount" ? `${s.food}: ${fmt(s.grams, 0)} g` : s.action === "swap" ? `${s.food} in` : `${s.food} added`);
  }
  function takeCode(f: Food) {
    if (!missing) return;
    const next = fit(items.map((i) => (i.id === missing.id ? { ...i, food: f } : i)), missing.id, missing.grams);
    log("plate_question", { q, plate: items.map((i) => i.food.name), applied: "swap", food: f.name, from: "code" });
    apply(next, `${f.name} in`);
  }
  async function ask(given?: string) {
    const question = (typeof given === "string" ? given : q).trim(); if (!question) return;
    if (typeof given === "string") setQ(given);
    setBusy(true); setReply(""); setSugs([]); setTaken(new Set());
    try {
      const res = await fetch("/api/plate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        question, missing: missing?.food.name,
        plate: items.map((i) => ({ name: i.food.name, grams: i.grams, calories: i.food.calories, protein: i.food.protein })),
        library: library.slice(0, 40).map((f) => ({ name: f.name, calories: f.calories, protein: f.protein })),
        target: { pd: pdRef },
      }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Mealan could not answer.");
      setReply(data.reply || ""); setSugs(data.suggestions ?? []);
      record?.(question, data.reply || "", items.map((i) => i.food.name));
      if (!(data.suggestions ?? []).length) setReply((r) => r || "Couldn't work this one out. Try asking it another way.");
      log("plate_question", { q: question, plate: items.map((i) => i.food.name), n: (data.suggestions ?? []).length, ms: data.ms });
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }
  useEffect(() => { if (missing && !asked.current) { asked.current = true; ask(); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  return (
    <div className="sheet-backdrop" onClick={close}>
      <div className="sheet helper" onClick={(e) => e.stopPropagation()}>
        <div className="card-top"><span>{missing ? `Mealan, instead of ${missing.food.name}` : "Mealan, about this plate"}</span><button className="link" onClick={close}>Close</button></div>
        {codeSwaps.length > 0 && (
          <>
            <p className="label">From your foods</p>
            {codeSwaps.map(({ f, grams }) => (
              <div className="suggestion" key={f.id}>
                <div><b>{f.name}</b><small>{fmt(grams, 0)} g brings the plate to your target · {pdText(density(f.protein, f.calories))}</small></div>
                <button className="pill pill-small pill-primary" onClick={() => takeCode(f)}><Replace size={14} /> Swap</button>
              </div>
            ))}
          </>
        )}
        {!missing && (
          <div className="moments chips-start">
            {["What goes with this?", "Better match for my target?", "Make it crunchier", "Less sweet", "Cheaper option"].map((c) => (
              <button key={c} className="pill pill-small" onClick={() => ask(c)}>{c}</button>
            ))}
          </div>
        )}
        <div className="chat-input">
          <input value={q} placeholder="What goes with this? What instead of…?" onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") ask(); }} enterKeyHint="send" />
          <button className="icon" aria-label="Ask" onClick={() => ask()} disabled={busy}><Send size={20} /></button>
        </div>
        {busy && <div className="bubble mealan thinking"><span /><span /><span /></div>}
        {reply && <p className="helper-reply">{reply}</p>}
        {openTalk && <button className="link" onClick={openTalk}>Something else? Talk to Mealan</button>}
        {sugs.map((s, k) => (
          <div className="suggestion" key={k}>
            <div>
              <b>{s.action === "swap" && s.replaces ? `${s.replaces} → ${s.food}` : s.action === "amount" ? `${s.food}: ${fmt(s.grams, 0)} g` : s.food}</b>
              <small>{s.why}{!s.known && s.action !== "amount" ? " · values are an estimate" : ""}</small>
            </div>
            {taken.has(k)
              ? <span className="pill pill-small taken"><Check size={14} /> On the plate</span>
              : <button className="pill pill-small pill-primary" onClick={() => { setTaken((t) => new Set(t).add(k)); take(s); }}>
                  {s.action === "swap" ? <><Replace size={14} /> Swap</> : s.action === "add" ? <><Plus size={14} /> Add</> : <><Scale size={14} /> Set</>}
                </button>}
          </div>
        ))}
        {taken.size > 0 && <button className="primary wide" onClick={close}><Check size={16} /> Done, back to the plate</button>}
      </div>
    </div>
  );
}
