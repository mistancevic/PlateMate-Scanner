import { useMemo, useState } from "react";
import { Play, Check, X, Download, RotateCcw } from "lucide-react";
import questionsRaw from "../../evals/plate-questions.jsonl?raw";
import goldenRaw from "../../evals/swap-golden.json?raw";
import libraryRaw from "../../evals/library.json?raw";
import tipRaw from "../../evals/tip-cases.json?raw";
import numberCasesRaw from "../../evals/number-cases.json?raw";
import numberSnapRaw from "../../evals/number-snapshot.json?raw";
import { numbersOf, numberChecks, type NumberCase, type NumberOutput, type Snapshot } from "../numbersEval";
import { jobOf } from "../foodjob";
import { playbookFor, tipBreaks } from "../playbook";
import { density } from "../pilot";
import { rankSwaps, sameFood } from "../swaps";
import { uid, type Food, type Ingredient } from "../pilot";
import type { AppApi } from "./api";

// The evals page: every scenario, run it, see the output and the checks, label it, compare with the judge.
type Q = { id: string; dimensions: Record<string, string>; plate: { food: string; grams: number }[]; question: string; missing: string | null; expect: { min_suggestions: number; must_not_suggest: string[]; forbidden_phrases: string[] } };
type G = { id: string; plate: { food: string; grams: number }[]; missing: string; target: number; coach_top3: string[] };
type Result = { at: string; ms?: number; output: any; checks: Record<string, boolean>; judge?: { score: number; reason: string }; label?: "pass" | "fail"; reason?: string; coachKcal?: number; coachProtein?: number };
const LIB: Food[] = JSON.parse(libraryRaw).foods;
const QUESTIONS: Q[] = questionsRaw.trim().split("\n").map((l: string) => JSON.parse(l));
const GOLDEN: G[] = JSON.parse(goldenRaw).cases;
type T = { id: string; food: string; goal: string; pd: number; moments: string[]; note: string };
const TIPS: T[] = JSON.parse(tipRaw).cases;
const food = (id: string) => LIB.find((f) => f.id === id)!;
const KEY = "chefmealan-evals";
const load = (): Record<string, Result> => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } };
const TYPES = ["all", "numbers", "code", "tip", "missing", "goes-with", "better-match", "texture", "cheaper", "constraint", "adversarial"];

// Numbers (7 October 2026): ten people from the dimensions; the app's numbers, the checks every answer must hold,
// and the coach's label. No judge: the calculation is deterministic, so the coach's pass is the reference.
const NUMBERS: NumberCase[] = JSON.parse(numberCasesRaw).cases;
const NSNAP: Snapshot = JSON.parse(numberSnapRaw);
function runNumbers(n: NumberCase): Result {
  const t0 = performance.now();
  const o = numbersOf(n);
  if (!o) return { at: new Date().toISOString(), output: { error: "Could not calculate." }, checks: { calculated: false } };
  return { at: new Date().toISOString(), ms: Math.round(performance.now() - t0), output: o, checks: numberChecks(n, o, NSNAP[n.id]) };
}
function NumbersOut({ o }: { o: NumberOutput }) {
  return (
    <>
      <p className="small"><b>{o.kcal.toLocaleString("en")} kcal</b> on average · <b>{o.protein} g protein</b> ({o.proteinMin}–{o.proteinMax} g, {o.perKg.toFixed(1)} g per kg) · {o.fats} g fat · {o.carbs} g carbs</p>
      <p className="small muted">Maintenance {o.maintenance.toLocaleString("en")} kcal · resting burn {o.bmr.toLocaleString("en")} · {o.method}</p>
      {o.why.length > 0 && <ul className="small">{o.why.map((w) => <li key={w}>{w}</li>)}</ul>}
      {o.days.length > 0 && <ol className="eval-list">{o.days.map((d) => <li key={d.name}><b>{d.name}</b> {d.kcal.toLocaleString("en")} kcal, {d.carbs} g carbs · {d.what}</li>)}</ol>}
    </>
  );
}

function runCode(g: G): Result {
  const items: Ingredient[] = g.plate.map((p) => ({ id: uid(), food: { ...food(p.food), readyToEat: true }, grams: p.grams, locked: true }));
  const slot = items.find((i) => i.food.id === g.missing)!;
  const t0 = performance.now();
  const ranked = rankSwaps(items, slot.id, LIB, g.target, 300, slot.food.name);
  const top3 = ranked.slice(0, 3);
  const checks: Record<string, boolean> = {
    "top pick reaches the target": !!ranked[0]?.fits,
    "never the missing food": ranked.every((r) => !sameFood(r.f.name, slot.food.name)),
  };
  if (g.coach_top3.length) checks["coach pick in top 3"] = g.coach_top3.some((id) => top3.some((r) => r.f.id === id));
  return { at: new Date().toISOString(), ms: Math.round(performance.now() - t0), output: { swaps: top3.map((r) => ({ food: r.f.name, grams: r.grams, fits: r.fits })) }, checks };
}
async function runModel(q: Q): Promise<Result> {
  const plate = q.plate.map((p) => { const f = food(p.food); return { name: f.name, grams: p.grams, calories: f.calories, protein: f.protein }; });
  const t0 = performance.now();
  const res = await fetch("/api/plate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q.question, missing: q.missing, plate, library: LIB.map((f) => ({ name: f.name, calories: f.calories, protein: f.protein })), target: { pd: 5.5 } }) });
  const data = await res.json(); const ms = Math.round(performance.now() - t0);
  if (!res.ok) return { at: new Date().toISOString(), ms, output: { error: data.error }, checks: { "answered": false } };
  const sugs: any[] = data.suggestions ?? [];
  const text = `${data.reply ?? ""} ${sugs.map((s) => `${s.food} ${s.why}`).join(" ")}`.toLowerCase();
  const checks = {
    "right shape": sugs.length >= q.expect.min_suggestions && sugs.length <= 3,
    "grounded": sugs.every((s) => s.known || (s.calories !== null && s.protein !== null)),
    "never the missing food": q.expect.must_not_suggest.every((m) => !sugs.some((s) => s.food.toLowerCase().includes(m.toLowerCase().split(/[\s,(]+/)[0]))),
    "no forbidden phrase": q.expect.forbidden_phrases.every((w) => !text.includes(w.toLowerCase())),
    "under 5 seconds": ms < 5000,
  };
  let judge: Result["judge"];
  try { const j = await fetch("/api/judge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q.question, plate, answer: data }) }); if (j.ok) judge = await j.json(); } catch { /* optional */ }
  return { at: new Date().toISOString(), ms, output: data, checks, judge };
}

// A Pro tip: short, only library foods, no grams, only numbers from the data.
async function runTip(t: T): Promise<Result> {
  const f = food(t.food);
  const library = LIB.filter((x) => x.id !== f.id).map((x) => ({ name: x.name, job: jobOf(x).job, pd: density(x.protein, x.calories) }));
  const t0 = performance.now();
  const res = await fetch("/api/tip", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ food: f, job: jobOf(f).job, goal: { name: t.goal, pdTarget: t.pd }, moments: t.moments, region: "munich", library }) });
  const data = await res.json(); const ms = Math.round(performance.now() - t0);
  if (!res.ok) return { at: new Date().toISOString(), ms, output: { error: data.error }, checks: { answered: false } };
  const tip: string = data.tip ?? "";
  const allowed = new Set([f.calories, f.protein, f.fats, f.carbs, f.fiber].filter((x) => x != null).map((x) => String(x)));
  const numbers = (tip.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => n.replace(",", "."));
  const checks = {
    "at most two sentences": (tip.match(/[.!?](\s|$)/g) ?? []).length <= 2,
    "no grams or portions": !/\b\d+\s?(g|grams?|gram)\b/i.test(tip),
    "numbers only from the data": numbers.every((n) => allowed.has(n) || allowed.has(String(Number(n)))),
    "foods named are in the library": (data.pairs ?? []).every((n: string) => LIB.some((x) => x.name === n)),
    "follows the playbook": tipBreaks(tip, playbookFor(f)).length === 0,
    "written by Mealan, not the fallback": data.by !== "playbook",
    "under 8 seconds": ms < 8000,
  };
  return { at: new Date().toISOString(), ms, output: data, checks };
}

export function EvalsScreen(p: AppApi) {
  const [results, setResults] = useState<Record<string, Result>>(load);
  const [type, setType] = useState("all");
  const [open, setOpen] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const save = (r: Record<string, Result>) => { setResults(r); try { localStorage.setItem(KEY, JSON.stringify(r)); } catch {} };
  const put = (id: string, r: Partial<Result>) => save({ ...load(), [id]: { ...(load()[id] ?? {}), ...r } as Result });

  const cases = useMemo(() => [
    ...NUMBERS.map((n) => ({ id: n.id, kind: "numbers" as const, title: n.title, tags: ["numbers", ...Object.values(n.dimensions)], n })),
    ...GOLDEN.map((g) => ({ id: g.id, kind: "code" as const, title: `${g.plate.map((x) => food(x.food).name.split(",")[0]).join(" + ")}, without ${food(g.missing).name.split(",")[0]}`, tags: ["code", "swap ranking", `target ${g.target}`], g })),
    ...TIPS.map((t) => ({ id: t.id, kind: "tip" as const, title: `Pro tip: ${food(t.food).name}, ${t.goal}${t.moments.length ? ", " + t.moments.join(", ") : ""}`, tags: ["tip", t.goal, ...t.moments], t })),
    ...QUESTIONS.map((q) => ({ id: q.id, kind: "model" as const, title: q.question, tags: [q.dimensions.question, q.dimensions.identity, q.dimensions.goal, q.dimensions.situation, q.dimensions.place], q })),
  ], []);
  const shown = cases.filter((c: any) => type === "all" || (type === "numbers" ? c.kind === "numbers" : type === "code" ? c.kind === "code" : type === "tip" ? c.kind === "tip" : c.kind === "model" && c.q.dimensions.question === type));

  async function run(c: (typeof cases)[number]) {
    setRunning(c.id);
    try { const r = c.kind === "numbers" ? runNumbers((c as any).n) : c.kind === "code" ? runCode((c as any).g) : c.kind === "tip" ? await runTip((c as any).t) : await runModel((c as any).q); const prev = load()[c.id]; put(c.id, { ...r, label: prev?.label, reason: prev?.reason, coachKcal: prev?.coachKcal, coachProtein: prev?.coachProtein }); }
    catch (e: any) { p.setError(e.message); } finally { setRunning(null); }
  }
  async function runAll() { for (const c of shown) { await run(c); } }
  const passChecks = (r?: Result) => r && Object.values(r.checks).every(Boolean);

  const ran = cases.filter((c) => results[c.id]);
  const checksOk = ran.filter((c) => passChecks(results[c.id])).length;
  const judged = ran.map((c) => results[c.id].judge?.score).filter(Boolean) as number[];
  const labelled = ran.filter((c) => results[c.id].label);
  const agree = labelled.filter((c) => results[c.id].judge && (results[c.id].judge!.score >= 4) === (results[c.id].label === "pass")).length;
  const labelledWithJudge = labelled.filter((c) => results[c.id].judge).length;
  const times = ran.map((c) => results[c.id].ms ?? 0).filter((t) => t > 50).sort((a, b) => a - b);

  function exportCsv() {
    const rows = [["id", "kind", "title", "checks_pass", "failed_checks", "ms", "judge", "judge_reason", "your_label", "your_reason", "output", "your_kcal", "your_protein"].join(",")];
    const esc = (s: unknown) => `"${String(s ?? "").replace(/"/g, '""')}"`;
    for (const c of cases) { const r = results[c.id]; if (!r) continue; rows.push([c.id, c.kind, esc(c.title), passChecks(r), esc(Object.entries(r.checks).filter(([, v]) => !v).map(([k]) => k).join("; ")), r.ms ?? "", r.judge?.score ?? "", esc(r.judge?.reason), r.label ?? "", esc(r.reason), esc(JSON.stringify(r.output)), r.coachKcal ?? "", r.coachProtein ?? ""].join(",")); }
    const url = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = `chef-mealan-evals-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <>
      <section className="card eval-summary">
        <div><b>{ran.length}/{cases.length}</b><small>run</small></div>
        <div><b>{checksOk}/{ran.length || 0}</b><small>checks pass</small></div>
        <div><b>{judged.length ? (judged.reduce((a, b) => a + b, 0) / judged.length).toFixed(1) : "–"}</b><small>judge avg</small></div>
        <div><b>{labelledWithJudge ? `${agree}/${labelledWithJudge}` : "–"}</b><small>you and judge agree</small></div>
        <div><b>{times.length ? `${(times[Math.floor(times.length / 2)] / 1000).toFixed(1)} s` : "–"}</b><small>median time</small></div>
      </section>
      <div className="moments">{TYPES.map((t) => <button key={t} className={`choice ${type === t ? "on" : ""}`} onClick={() => setType(t)}>{t}</button>)}</div>
      <div className="button-row" style={{ margin: "8px 0 12px" }}>
        <button className="pill pill-small pill-primary" disabled={!!running} onClick={runAll}><Play size={14} /> Run {shown.length}</button>
        <button className="pill pill-small" onClick={exportCsv}><Download size={14} /> Export</button>
        <button className="pill pill-small" onClick={() => save({})}><RotateCcw size={14} /> Clear</button>
      </div>
      {shown.map((c) => {
        const r = results[c.id]; const isOpen = open === c.id;
        const status = !r ? "not run" : passChecks(r) ? "checks pass" : "check failed";
        return (
          <section key={c.id} className={`card eval-case ${!r ? "" : passChecks(r) ? "eval-ok" : "eval-bad"}`}>
            <button className="eval-head" onClick={() => setOpen(isOpen ? null : c.id)}>
              <div><b>{c.id} · {c.title}</b><small>{c.tags.filter(Boolean).join(" · ")}</small></div>
              <span className="eval-status">{running === c.id ? "running…" : status}{r?.judge ? ` · judge ${r.judge.score}` : ""}{r?.label ? ` · you: ${r.label}` : ""}</span>
            </button>
            {isOpen && (
              <div className="eval-body">
                {c.kind === "numbers" ? <p className="small"><b>Look for:</b> {(c as any).n.look}</p> : c.kind === "tip" ? <small>Expect: {(c as any).t.note}</small> : <small>Plate: {(c.kind === "code" ? (c as any).g.plate : (c as any).q.plate).map((x: any) => `${x.grams} g ${food(x.food).name}`).join(" · ")}</small>}
                <div className="button-row" style={{ margin: "8px 0" }}><button className="pill pill-small" disabled={!!running} onClick={() => run(c)}><Play size={14} /> Run</button></div>
                {r && (
                  <>
                    <p className="label">Output{r.ms !== undefined ? `, ${r.ms} ms` : ""}</p>
                    {c.kind === "numbers" ? (r.output.error ? <p className="small">{r.output.error}</p> : <NumbersOut o={r.output} />) : c.kind === "code" ? (
                      <ol className="eval-list">{r.output.swaps.map((s: any, k: number) => <li key={k}>{s.food}, {s.grams ?? "–"} g{s.fits ? "" : " (doesn't reach the target)"}</li>)}</ol>
                    ) : r.output.error ? <p className="small">{r.output.error}</p> : (
                      <>
                        <p className="helper-reply">{r.output.reply}</p>
                        <ol className="eval-list">{(r.output.suggestions ?? []).map((s: any, k: number) => <li key={k}><b>{s.action}</b> {s.replaces ? `${s.replaces} → ` : ""}{s.food}{s.grams ? `, ${s.grams} g` : ""}: {s.why}{s.known ? "" : " (estimate)"}</li>)}</ol>
                      </>
                    )}
                    <p className="label">Checks</p>
                    <ul className="eval-checks">{Object.entries(r.checks).map(([k, v]) => <li key={k} className={v ? "ok" : "bad"}>{v ? "✓" : "✗"} {k}</li>)}</ul>
                    {r.judge && <p className="small">Judge: {r.judge.score}/5. {r.judge.reason}</p>}
                    <p className="label">Your label</p>
                    <div className="button-row">
                      <button className={`choice ${r.label === "pass" ? "on" : ""}`} onClick={() => put(c.id, { label: "pass" })}><Check size={14} /> Pass</button>
                      <button className={`choice ${r.label === "fail" ? "on" : ""}`} onClick={() => put(c.id, { label: "fail" })}><X size={14} /> Fail</button>
                    </div>
                    <input className="search" placeholder="Why, in a few words" value={r.reason ?? ""} onChange={(e) => put(c.id, { reason: e.target.value })} />
                    {c.kind === "numbers" && (
                      <div className="field-row eval-coach">
                        <label className="field"><span>Your kcal</span><input inputMode="numeric" aria-label={`${c.id}, your kcal`} value={r.coachKcal ?? ""} placeholder={String(r.output.kcal ?? "")} onChange={(e) => put(c.id, { coachKcal: e.target.value ? Number(e.target.value) : undefined })} /></label>
                        <label className="field"><span>Your protein, g</span><input inputMode="numeric" aria-label={`${c.id}, your protein`} value={r.coachProtein ?? ""} placeholder={String(r.output.protein ?? "")} onChange={(e) => put(c.id, { coachProtein: e.target.value ? Number(e.target.value) : undefined })} /></label>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </section>
        );
      })}
    </>
  );
}
