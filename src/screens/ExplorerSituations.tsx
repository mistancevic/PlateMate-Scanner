// DT180 to DT187 (0.3.25, boards Stories129 to Stories136; Coach Milan 31 October 11:16 to 13:12): Explorer's three parts as
// one sentence: what you eat (Nutrients, the pages built since DT151), what it becomes (The body, its map here, the pages to
// come), when it helps and when it hurts (Situations, the first page here: a bad night's sleep). One search bar over all of it.
// Every situation page keeps one shape: theory first (what it does, what causes it, one line each with its paper), then When
// it helps, when it hurts, then Your case in Milan's five parts, then the chat chips. Nothing changes unless you tap.
// Buttons 44 px or more; labels 12 px or more.
import { useEffect, useMemo, useState } from "react";
import type { AppApi } from "./api";
import { BODY_FAMILIES, SITUATIONS, SITUATION_PAGES, buildIndex, searchIndex, type Part, type BodyId, type SituationId, type Hit, type Line, type WhenRow } from "../explorerBody";
import { sleepCase, noteOpen, easyDay } from "../situations";
import { setChefContext } from "../chefContext";
import { dayFor, getDay } from "../personal";
import { showPlanOn } from "./PlanScreen";
import { EXPLORER_FOODS } from "../explorer";
import { FAT_FOODS, FAT_MEMBERS } from "../explorerFats";
import { CARB_FOODS, CARB_MEMBERS } from "../explorerCarbs";
import { MICRO_FOODS, MICRO_MEMBERS } from "../explorerMicros";

export const PART_NAME: Record<Part, string> = { nutrients: "Nutrients", body: "The body", situations: "Situations" };

// ---- the search bar (Milan 13:12) ----
export function useExplorerIndex(): Hit[] {
  return useMemo(() => buildIndex({ nutrients: [
    { family: "protein", name: "Protein", hint: "Not all proteins are equal: the nine amino acids, leucine, what completes it.", members: ["Leucine", "Lysine", "Methionine", "Essential amino acids", "DIAAS", "PDCAAS"], foods: EXPLORER_FOODS.map((f) => f.name) },
    { family: "fats", name: "Fats", hint: "Saturated, monounsaturated, polyunsaturated, omega-3 and omega-6.", members: FAT_MEMBERS.map((m) => m.name), foods: FAT_FOODS.map((f) => f.name) },
    { family: "carbs", name: "Carbs", hint: "Starch, sugars, fibre, GI and GL.", members: [...CARB_MEMBERS.map((m) => m.name), "Glycaemic index", "Glycaemic load"], foods: CARB_FOODS.map((f) => f.name) },
    { family: "micros", name: "Micros", hint: "Vitamins and minerals against your day and the EU values.", members: MICRO_MEMBERS.map((m) => m.name), foods: MICRO_FOODS.map((f) => f.name) },
    { family: "foods", name: "Foods", hint: "Every food on Explorer's tables, through every lens.", members: [], foods: [] },
  ] }), []);
}
export function ExplorerSearch({ index, go }: { index: Hit[]; go: (h: Hit) => void }) {
  const [q, setQ] = useState("");
  const hits = useMemo(() => searchIndex(index, q), [index, q]);
  return (
    <div className="ex-search">
      <input className="search ex-search-field" type="search" placeholder="Search Explorer: a food, a nutrient, a situation, a claim" aria-label="Search Explorer" value={q} onChange={(e) => setQ(e.target.value)} />
      {q.trim().length >= 2 && (
        <div className="ex-hits" role="listbox" aria-label="Found in Explorer">
          {hits.length ? hits.map((h, i) => (
            <button key={i} type="button" role="option" aria-selected={false} className="ex-hit" onClick={() => { setQ(""); go(h); }}>
              <span className="ex-hit-part">{PART_NAME[h.part]}</span><span className="ex-hit-text"><b>{h.title}</b><small>{h.hint}</small></span>
            </button>
          )) : <p className="small muted ex-hit-none">Nothing in Explorer says that yet. Ask Chef Mealan with the round button.</p>}
        </div>
      )}
    </div>
  );
}

// ---- The body: the map (DT182) ----
export function BodyMap({ open }: { open: (id: BodyId) => void }) {
  return (
    <>
      <p className="small muted page-why">Explorer in one sentence: what you eat (Nutrients), what it becomes (The body), when it helps and when it hurts (Situations). The body has eight families. Every page keeps one shape: what it is, what moves it with its source, when it helps, your case in five parts.</p>
      <div className="menu-list ex-map">
        {BODY_FAMILIES.map((b) => (
          <button key={b.id} type="button" className={`menu-row ${b.state === "later" ? "ex-later" : ""}`} onClick={() => open(b.id)}>
            <span className="menu-row-text"><b>{b.name}</b><small>{b.hint}</small></span><small className="ex-state">{b.state === "page" ? "›" : "later"}</small>
          </button>
        ))}
      </div>
      <small className="muted ex-line-note">The wellness line for every family: what happens in anyone; no test read, no level, no condition, no treatment, no supplement. The brain's line is the strictest: mood, cravings, habit and sleep, never a mental condition or a medication.</small>
    </>
  );
}
export function BodyLater({ id, back }: { id: BodyId; back: () => void }) {
  const b = BODY_FAMILIES.find((x) => x.id === id)!;
  return (
    <>
      <button type="button" className="link ex-back" onClick={back}>‹ The body</button>
      <h3 className="ex-h">{b.name}</h3>
      <p className="ex-intro">{b.hint}</p>
      <p className="small muted">Its page comes in a later version, drawn and agreed first. Until then, the round button answers questions about it from the same wellness line.</p>
    </>
  );
}

// ---- Situations (DT180) ----
export function SituationsList({ open }: { open: (id: SituationId) => void }) {
  return (
    <>
      <p className="small muted page-why">A situation page starts from where you are, not from a nutrient. Theory first: what it does to the day and what causes it, one line each with its source. Then your case, from what the app already knows.</p>
      <div className="menu-list ex-map">
        {SITUATIONS.map((s) => (
          <button key={s.id} type="button" className={`menu-row ${s.state === "later" ? "ex-later" : ""}`} onClick={() => open(s.id)}>
            <span className="menu-row-text"><b>{s.name}</b><small>{s.hint}</small></span><small className="ex-state">{s.state === "page" ? "›" : "later"}</small>
          </button>
        ))}
      </div>
      <small className="muted ex-line-note">Each situation reads one horizon: the day, the week, or the month. A bad night is a day. A holiday is a week. The goal check-in is the month, and lives on Goal.</small>
    </>
  );
}
const Lines = ({ title, lines }: { title: string; lines: Line[] }) => (
  <section className="card ex-lines" aria-label={title}>
    <b>{title}</b>
    {lines.map((l) => <div key={l.title} className="ex-line"><b>{l.title}</b><small>{l.text}</small>{l.src && <small className="ex-src">Source: {l.src}.</small>}</div>)}
  </section>
);
export const When = ({ rows }: { rows: WhenRow[] }) => (
  <section className="card ex-when" aria-label="When it helps, when it hurts">
    <b>When it helps, when it hurts</b>
    <small className="muted">The same food is a different thing in a different situation.</small>
    {rows.map((r) => <div key={r.when} className="ex-when-row"><span className={`ex-verdict ex-${r.verdict.toLowerCase()}`}>{r.verdict}</span><div><b>{r.when}</b><small>{r.what}</small></div></div>)}
  </section>
);
export const Parts = ({ parts }: { parts: { k: string; title: string; body: string }[] }) => (
  <>{parts.map((x) => <div key={x.k} className="ex-part"><span className="ex-part-n" aria-hidden="true">{x.k}</span><div><b>{x.title}</b><small>{x.body}</small></div></div>)}</>
);

export function SleepPage({ p, back }: { p: AppApi; back: () => void }) {
  const pg = SITUATION_PAGES.sleep!;
  const today = useMemo(() => new Date(), []);
  const c = useMemo(() => sleepCase(p.personal, p.state.feedback, today), [p.personal, p.state.feedback, today]);
  const [opens, setOpens] = useState(1);
  useEffect(() => { setOpens(noteOpen("sleep")); }, []);
  // the round chef button starts with this page's questions while it is open
  useEffect(() => { setChefContext({ about: "On Explorer, A bad night's sleep: what a short night does to the day, and your case.", chips: pg.chips }); return () => setChefContext(null); }, [pg.chips]);
  const tr = dayFor(p.personal, today)?.day ?? getDay(p.personal, today).plan ?? null;
  const tap = (id: string) => {
    if (id === "protein") p.openOut({ q: "I slept badly last night. What do I put on my plate for breakfast and lunch so the hunger stays in check, with my numbers unchanged? More protein and fibre, please." });
    else if (id === "snack") { if (c.hasSnackSlot) { showPlanOn(new Date().toISOString().slice(0, 10)); p.setTab("plan"); } else { p.openMenu("life"); } }
    else if (id === "easy" && tr) { p.setDated(today, tr.intensity === "hard" ? easyDay(tr) : { ...tr }); p.notify(tr.intensity === "hard" ? "Today's training is easy, this date only. Your week stays the same." : "Today's training stays as planned. A walk counts too."); }
  };
  const week = c.weekQuestion || opens >= 3;
  return (
    <>
      <button type="button" className="link ex-back" onClick={back}>‹ Situations</button>
      <h3 className="ex-h">{pg.name}</h3>
      <p className="ex-intro">{pg.intro}</p>
      <Lines title="What it does to the day" lines={pg.effects} />
      <Lines title="What causes it" lines={[...pg.causes, pg.loop]} />
      <When rows={pg.when} />
      <section className="card ex-case" aria-label="Your case, today">
        <b>Your case, today</b>
        <small className="muted">Read from your settings and your plates. Nothing is changed unless you tap.</small>
        <Parts parts={c.parts.slice(0, 3)} />
        <div className="ex-part"><span className="ex-part-n" aria-hidden="true">4</span><div><b>{c.parts[3].title}</b><small>Three things, each one tap.</small>
          <div className="ex-taps">{c.taps.map((t) => <button key={t.id} type="button" className="pill ex-tap" onClick={() => tap(t.id)}><b>{t.label}</b><small>{t.where}</small></button>)}</div>
          <small>{c.parts[3].body.replace(/^Each one tap\. Then: /, "Then: ")}</small></div></div>
        <Parts parts={c.parts.slice(4)} />
        {c.trend && <div className="ex-trend"><b>Trend against trajectory</b><small>{c.trend}</small></div>}
      </section>
      {week && (
        <section className="card ex-up" aria-label="A week question">
          <b>Third short night this week</b>
          <small>One night is a day question. Three in a week is a week question: your meal times and your training week. The day page stops here and points up.</small>
          <button type="button" className="pill pill-small" onClick={() => { p.setTab("plan"); }}>See the week on Plan ›</button>
        </section>
      )}
      <section className="card">
        <b>Ask Chef Mealan</b>
        <small className="muted">The round button on this page starts with these.</small>
        <div className="moments ex-chipq">{pg.chips.map((q) => <button key={q} type="button" className="choice" onClick={() => p.openOut({ q })}>{q}</button>)}</div>
      </section>
      <p className="ex-sources">{pg.line} Sources: {pg.sources}</p>
    </>
  );
}
