import { fitsPlate } from "../mixtip";
import { w } from "../words";
import { foodV } from "../reference";
import { ClearField } from "./ClearField";
import { useEffect, useRef, useState } from "react";
import { Send, Replace, Plus, Scale, Check } from "lucide-react";
import { SafetyNote } from "./SafetyNote";
import { FIXED, takeModelFlag, allergyHits, type Safety, type AiState, type SituationId } from "../safety";
import { aggregate, density, solveIngredient, uid, type Food, type Ingredient } from "../pilot";
import { rankSwaps, sameFood } from "../swaps";
import { fmt, pdText, pdVal } from "../ui";
import { log } from "../log";

type Suggestion = { action: "add" | "swap" | "amount"; food: string; replaces: string | null; grams: number | null; calories: number | null; protein: number | null; fats?: number | null; carbs?: number | null; why: string; known: boolean };

// Help inside the plate: ask about it, get up to three actions, tap one. Closing leaves the plate as it was, plus what you tapped.
// DT286 (0.3.142, board Stories215): by default on the goal, on what the plate lacks; chips pick the direction; amounts and what they
// do to PD and kcal; More like this; never the same as last time for this dish; one conversation, no second chat
export type PlateDir = "goal" | "protein" | "carbs" | "crunchy" | "crave" | "other";
const DIRS: PlateDir[] = ["goal", "protein", "carbs", "crunchy", "crave", "other"];
const DIR_WORD: Record<PlateDir, Parameters<typeof w>[0]> = { goal: "helper.dirGoal", protein: "helper.dirProtein", carbs: "helper.dirCarbs", crunchy: "helper.dirCrunchy", crave: "helper.dirCrave", other: "helper.dirOther" };
export type PlateContext = { meal?: string | null; time?: string | null; eatenKcal?: number; eatenProtein?: number; leftKcal?: number | null; leftProtein?: number | null };
const SAID = "cm-plate-said:";
const dishKey = (items: Ingredient[]) => items.map((i) => i.food.name.toLowerCase()).sort().join("|").slice(0, 200);
const saidBefore = (k: string): string[] => { try { return JSON.parse(localStorage.getItem(SAID + k) || "[]"); } catch { return []; } };
const remember = (k: string, names: string[]) => { try { localStorage.setItem(SAID + k, JSON.stringify([...names, ...saidBefore(k)].filter((x, i, a) => a.indexOf(x) === i).slice(0, 12))); } catch { /* private mode */ } };
export function PlateHelper({ items, library, pdRef, cap, missing, prefill, apply, close, setError, record, safety, ai, onFlag, tastes, context }: {
  // R22 (0.2.50): your taste chips and words, read with the question
  tastes?: ReturnType<typeof import("../tasteChips").tasteForReq>;
  items: Ingredient[]; library: Food[]; pdRef: number | null; cap: number | null; missing?: Ingredient | null; prefill?: string;
  apply: (next: Ingredient[], note: string) => void; close: () => void; setError: (m: string) => void; openTalk?: () => void; record?: (q: string, reply: string, plate: string[]) => void;
  safety: Safety; ai: AiState; onFlag: (s: SituationId) => void; context?: () => PlateContext;
}) {
  const [q, setQ] = useState(prefill ?? (missing ? w("helper.iDontHave", { food: foodV(missing.food) }) : ""));
  const [dir, setDir] = useState<PlateDir | null>(null);
  const [closeLine, setCloseLine] = useState("");
  const ctx = context?.() ?? {};
  // suggestions taken in this conversation: the helper stays open, so a second one can be added
  const [taken, setTaken] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState("");
  const [sugs, setSugs] = useState<Suggestion[]>([]);
  const asked = useRef(false);
  const codeSwaps = missing && pdRef !== null ? rankSwaps(items, missing.id, library, pdRef, cap, missing.food.name, fitsPlate).filter((s) => s.fits).slice(0, 3) : [];

  // the solver, not the model, sets the grams of anything added or swapped in
  const fit = (next: Ingredient[], id: string, fallback: number) => {
    if (pdRef === null) return next;
    const r = solveIngredient(next.map((i) => ({ ...i, locked: i.id !== id })), id, pdRef, null);
    const grams = r.ok && r.grams <= (cap ?? 300) ? r.grams : fallback;
    return next.map((i) => (i.id === id ? { ...i, grams, locked: false } : i));
  };
  const toFood = (s: Suggestion): Food => library.find((f) => f.name.toLowerCase() === s.food.toLowerCase()) ?? {
    id: uid(), name: s.food, brand: "estimate", basis: "100g", source: "estimate", notes: "estimate from Chef Mealan", reviewedAt: new Date().toISOString(), readyToEat: true,
    calories: s.calories, protein: s.protein, fats: s.fats ?? null, carbs: s.carbs ?? null, fiber: null,
  };
  // the amount shown is the amount Add puts on the plate: the model's, kept to a cook's range; else the solver's; else 100 g
  const gramsOf = (s: Suggestion): number => {
    if (s.grams !== null && s.grams > 0) return Math.max(5, Math.min(s.action === "amount" ? 1000 : 400, Math.round(s.grams)));
    if (s.action === "amount") return 0;
    const id = "probe"; const t = s.action === "swap" ? items.find((i) => s.replaces && sameFood(i.food.name, s.replaces)) ?? missing ?? null : null;
    const next = s.action === "swap" && t ? items.map((i) => (i.id === t.id ? { ...i, id, food: toFood(s) } : i)) : [...items, { id, food: toFood(s), grams: 100, locked: false }];
    return Math.round(fit(next, id, 100).find((i) => i.id === id)?.grams ?? 100);
  };
  const plateAfter = (s: Suggestion, g: number): Ingredient[] => {
    if (s.action === "amount") return items.map((i) => (sameFood(i.food.name, s.food) ? { ...i, grams: g, locked: true } : i));
    if (s.action === "swap") { const t = items.find((i) => s.replaces && sameFood(i.food.name, s.replaces)) ?? missing ?? null; if (t) return items.map((i) => (i.id === t.id ? { ...i, food: toFood(s), grams: g } : i)); }
    return [...items, { id: uid(), food: toFood(s), grams: g, locked: false }];
  };
  const before = aggregate(items), pdBefore = density(before.protein ?? 0, before.calories ?? 0);
  const numsOf = (s: Suggestion) => {
    const g = gramsOf(s); if (!g) return null;
    const a = aggregate(plateAfter(s, g)), pdAfter = density(a.protein ?? 0, a.calories ?? 0), dk = Math.round((a.calories ?? 0) - (before.calories ?? 0));
    return { g, line: w("helper.nums", { g: fmt(g, 0), from: pdVal(pdBefore), to: pdVal(pdAfter), kcal: `${dk >= 0 ? "+" : "−"}${fmt(Math.abs(dk), 0)}` }) };
  };
  function take(s: Suggestion) {
    const g = gramsOf(s);
    if (g) {
      log("plate_add", { dir, action: s.action, food: s.food, grams: g });
      apply(plateAfter(s, g), s.action === "amount" ? `${s.food}: ${fmt(g, 0)} g` : s.action === "swap" ? `${s.food} in` : `${s.food} added`);
      return;
    }
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
  async function ask(given?: string, d: PlateDir | null = null, more = false) {
    const question = d ? "" : (typeof given === "string" ? given : q).trim(); if (!d && !question) return;
    if (!ai.on) { setReply(ai.why || FIXED.off); return; }
    if (typeof given === "string" && !d) setQ(given);
    setDir(d);
    const key = dishKey(items), shown = more ? sugs.map((x) => x.food) : [];
    setBusy(true); if (!more) { setReply(""); setSugs([]); setTaken(new Set()); setCloseLine(""); }
    if (d) log(more ? "plate_more" : "plate_direction", { dir: d, plate: items.map((i) => i.food.name) });
    try {
      // foods that fit the direction, a few of them in a new order each time, never only the first of the list
      const onPlate = new Set(items.map((i) => i.food.name.toLowerCase())), skip = new Set([...shown, ...saidBefore(key)].map((x) => x.toLowerCase()));
      const pool = library.filter((f) => !onPlate.has(f.name.toLowerCase()) && !skip.has(f.name.toLowerCase()) && f.calories);
      const pdOf = (f: Food) => density(f.protein ?? 0, f.calories ?? 0) ?? 0;
      const ranked = d === "goal" || d === "protein" ? [...pool].sort((a, b) => pdOf(b) - pdOf(a)) : d === "carbs" ? [...pool].sort((a, b) => (b.carbs ?? 0) - (a.carbs ?? 0)) : pool;
      const lib = [...ranked.slice(0, 30)].sort(() => Math.random() - 0.5).concat(pool.filter((f) => !ranked.slice(0, 30).includes(f)).sort(() => Math.random() - 0.5).slice(0, 20));
      const res = await fetch("/api/plate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        question, direction: d, missing: missing?.food.name,
        plate: items.map((i) => ({ name: i.food.name, grams: i.grams, calories: i.food.calories, protein: i.food.protein })),
        library: lib.map((f) => ({ name: f.name, calories: f.calories, protein: f.protein, fats: f.fats, carbs: f.carbs })),
        target: { pd: pdRef }, tastes, context: ctx, avoid: [...shown, ...saidBefore(key)],
      }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || w("helper.chefMealanCouldNotAnswer"));
      const taken = takeModelFlag(data.reply || ""); if (taken.flag) onFlag(taken.flag);
      // a declared allergy: a suggestion that trips it never shows, whatever the model said
      const safe = (data.suggestions ?? []).filter((x: any) => !allergyHits({ name: String(x.food ?? ""), brand: "", notes: String(x.why ?? ""), table: [] } as any, safety.allergies).length);
      if (more) setSugs((xs) => [...xs, ...safe]); else { setReply(taken.text); setSugs(safe); }
      if (data.close) setCloseLine(String(data.close));
      remember(key, safe.map((x: Suggestion) => x.food));
      record?.(question, data.reply || "", items.map((i) => i.food.name));
      if (!(data.suggestions ?? []).length) setReply((r) => r || w("helper.couldnTWorkThisOne"));
      log("plate_question", { q: question, dir: d, more, plate: items.map((i) => i.food.name), n: (data.suggestions ?? []).length, ms: data.ms });
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }
  // opened on a plate: the answer for the goal comes at once; a swap or a question carried in asks that instead
  useEffect(() => { if (asked.current) return; asked.current = true; if (missing) ask(); else if (!prefill && ai.on && items.length) ask(undefined, "goal"); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  return (
    <div className="sheet-backdrop" onClick={close}>
      <div className="sheet helper" onClick={(e) => e.stopPropagation()}>
        <div className="card-top"><span>{missing ? w("helper.insteadOf", { food: foodV(missing.food) }) : w("helper.chefMealanAboutThisPlate")}</span><button className="link" onClick={close}>{w("helper.close")}</button></div>
        {!missing && <small className="helper-context">{[ctx.meal && ctx.time ? `${ctx.meal}, ${ctx.time}` : ctx.meal, pdBefore !== null ? pdText(pdBefore) : null, ctx.leftKcal != null && ctx.leftProtein != null ? w("helper.leftToday", { kcal: fmt(Math.max(0, ctx.leftKcal), 0), protein: fmt(Math.max(0, ctx.leftProtein), 0) }) : null].filter(Boolean).join(" · ")}</small>}
        <SafetyNote safety={safety} ai={ai} />
        {codeSwaps.length > 0 && (
          <>
            <p className="label">{w("helper.fromYourFoods")}</p>
            {codeSwaps.map(({ f, grams }) => (
              <div className="suggestion" key={f.id}>
                <div><b>{f.name}</b><small>{fmt(grams, 0)} g brings the plate to your target · {pdText(density(f.protein, f.calories))}</small></div>
                <button className="pill pill-small" onClick={() => takeCode(f)}><Replace size={14} /> {w("helper.swap")}</button>
              </div>
            ))}
          </>
        )}
        {busy && <div className="bubble mealan thinking"><span /><span /><span /></div>}
        {reply && <p className="helper-reply">{reply}</p>}
        {sugs.map((s, k) => (
          <div className="suggestion" key={k}>
            <div>
              <b>{s.action === "swap" && s.replaces ? `${s.replaces} → ${s.food}` : s.action === "amount" ? `${s.food}: ${fmt(s.grams, 0)} g` : s.food}</b>
              {numsOf(s) && <small className="helper-nums">{numsOf(s)!.line}</small>}
              <small>{s.why}{!s.known && s.action !== "amount" ? ` · ${w("helper.estimate")}` : ""}</small>
            </div>
            {taken.has(k)
              ? <span className="pill pill-small taken"><Check size={14} /> {w("helper.onThePlate")}</span>
              : <button className="pill pill-primary helper-take" onClick={() => { setTaken((t) => new Set(t).add(k)); take(s); }}>
                  {s.action === "swap" ? <><Replace size={14} /> {numsOf(s) ? w("helper.swapAmount", { g: fmt(numsOf(s)!.g, 0) }) : w("helper.swap")}</> : s.action === "add" ? <>{numsOf(s) ? w("helper.addAmount", { g: fmt(numsOf(s)!.g, 0) }) : <><Plus size={14} /> {w("helper.add")}</>}</> : <><Scale size={14} /> {numsOf(s) ? w("helper.setAmount", { g: fmt(numsOf(s)!.g, 0) }) : w("helper.set")}</>}
                </button>}
          </div>
        ))}
        {closeLine && <p className="helper-close">{closeLine}</p>}
        {dir && sugs.length > 0 && !busy && <button type="button" className="pill pill-wide helper-more" onClick={() => ask(undefined, dir, true)}>{w("helper.moreLikeThis")}</button>}
        {taken.size > 0 && <button className="primary wide" onClick={close}><Check size={16} /> {w("helper.doneBackToThePlate")}</button>}
        {!missing && (
          <div className="moments chips-start helper-dirs">
            {DIRS.map((d) => <button key={d} type="button" className={`pill pill-small${dir === d ? " pill-primary" : ""}`} aria-pressed={dir === d} onClick={() => ask(undefined, d)}>{w(DIR_WORD[d])}</button>)}
          </div>
        )}
        <div className="chat-input">
          <ClearField value={q} onClear={() => setQ("")} label={w("helper.clearTheQuestion")}><input value={q} placeholder={w("helper.askAboutThisPlate")} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") ask(); }} enterKeyHint="send" /></ClearField>
          <button className="icon" aria-label={w("helper.ask")} onClick={() => ask()} disabled={busy}><Send size={20} /></button>
        </div>

      </div>
    </div>
  );
}
