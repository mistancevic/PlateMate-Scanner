// The safety question (the door), one card for Profile, setup and the chat (DT141, 0.2.126, board Stories97; Anna's DT119;
// Milan 28 October 18:33 Go): the situations Chef Mealan steps back from, and what to keep off every suggestion. A tick is
// the answer and saves straight away. In setup and from the chat it ends on one button: Next, or Back to the chat.
import { useState } from "react";
import type { AppApi } from "../screens/api";
import { SITUATIONS, SITUATION_FOR, EU_ALLERGENS, FIXED, DOOR_WHY, type SituationId } from "../safety";

const fmtDay = (iso: string) => new Date(iso).toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" });
export function SafetyQuestion({ p, onDone, doneLabel = "Next" }: { p: AppApi; onDone?: () => void; doneLabel?: string }) {
  // the door: situations Chef Mealan steps back from, and what to keep off every suggestion
  const [sits, setSits] = useState<SituationId[]>(p.safety.situations);
  const [none, setNone] = useState<boolean>(Boolean(p.safety.none));
  const keys = new Set(EU_ALLERGENS.map((a) => a.key));
  const [chips, setChips] = useState<string[]>(p.safety.allergies.filter((a) => keys.has(a)));
  const [freeText, setFreeText] = useState(p.safety.allergies.filter((a) => !keys.has(a)).join(", "));
  const joined = (c: string[], t: string) => [...c, ...t.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean)].join(", ");
  const allergyText = joined(chips, freeText);
  const chipOn = (k: string) => chips.includes(k);
  // a tick is the answer: it saves the moment it is made, no Save button to find below the fold
  const commit = (nextSits: SituationId[], nextNone: boolean, text: string) => {
    const allergies = text.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
    const withAllergies = allergies.length && !nextSits.includes("allergies") ? [...nextSits, "allergies" as SituationId] : nextSits;
    const isNone = nextNone && withAllergies.length === 0;
    const answered = isNone || withAllergies.length > 0;
    setSits(withAllergies); setNone(isNone);
    if (!answered) { p.declareSafety({ situations: [], allergies: [], none: false, declaredAt: undefined }, false); return; }
    p.declareSafety({ situations: withAllergies, allergies, none: isNone, declaredAt: new Date().toISOString() }, true);
    p.notify(isNone ? "Noted: none applies. Chef Mealan cooks." : "Noted. Chef Mealan keeps to it.");
  };
  const tick = (id: SituationId, on: boolean) => { if (id === "allergies" && !on) { setChips([]); setFreeText(""); } commit(on ? [...sits, id] : sits.filter((y) => y !== id), on ? false : none, id === "allergies" && !on ? "" : allergyText); };
  const tickNone = (on: boolean) => { if (on) { setChips([]); setFreeText(""); } commit(on ? [] : sits, on, on ? "" : allergyText); };
  const toggleChip = (k: string, on: boolean) => { const next = on ? [...chips, k] : chips.filter((x) => x !== k); setChips(next); commit(sits.includes("allergies") ? sits : [...sits, "allergies"], false, joined(next, freeText)); };
  const answered = none || sits.length > 0;
  return (
    <section className="card form door" aria-label="Is any of this true for you" id="safety-question">
      <b>Is any of this true for you?</b>
      <p className="small">Chef Mealan is an AI chef. It reads labels and suggests plates, and it can be wrong: check a number against the pack, and check anything about your health with a professional. If one of these is true for you, Chef Mealan steps back from that topic, tells you who to talk to, and still helps with the plate. Your coach sees that you ticked one and when, never what you wrote.</p>
      {SITUATIONS.filter((x) => SITUATION_FOR[x.id] === "all" || p.personal.sex !== "male").map((x) => (
        <div key={x.id}>
          <label className="check">
            <input type="checkbox" checked={sits.includes(x.id)} onChange={(e) => tick(x.id, e.target.checked)} />
            <span><b>{x.label}</b>{x.detail ? <small> {x.detail}</small> : null}</span>
          </label>
          {x.id === "allergies" && sits.includes("allergies") && (
            <div className="allergy-pick">
              <small className="muted">The fourteen every pack in the EU declares. Tap what applies.</small>
              <div className="chips">
                {EU_ALLERGENS.map((a) => { const on = chipOn(a.key); return <button key={a.key} className={`choice ${on ? "on" : ""}`} onClick={() => toggleChip(a.key, !on)}>{a.label}</button>; })}
              </div>
              <label className="field"><span>Anything else</span><input value={freeText} placeholder="e.g. kiwi, histamine" onChange={(e) => setFreeText(e.target.value)} onBlur={() => commit(sits, none, joined(chips, freeText))} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} /></label>
              <small className="muted">Nothing containing these is ever suggested. Chef Mealan checks the name and the label lines of every food.</small>
            </div>
          )}
        </div>
      ))}
      <label className="check none">
        <input type="checkbox" checked={none} onChange={(e) => tickNone(e.target.checked)} />
        <span><b>None of these applies to me</b><small> If you leave it open, Chef Mealan doesn't take it as a no. It asks again once a year.</small></span>
      </label>
      <p className={`small ${answered ? "muted" : "notice"}`}>{answered ? `Answered${p.safety.declaredAt ? " on " + fmtDay(p.safety.declaredAt) : ""}. Each tick is saved straight away, and you can change it any time.` : "Tick one, or none. A tick saves by itself."}</p>
      {p.safety.situations.length > 0 && (
        <div className="fixed-lines">
          {p.safety.situations.map((id) => <p className="small" key={id}><b>{SITUATIONS.find((x) => x.id === id)?.label}:</b> {FIXED[id]}</p>)}
        </div>
      )}
      {!p.ai.on && <p className="small notice">{p.ai.why === DOOR_WHY ? "Answer the question to open Chef Mealan's chat: one tap if none applies. It asks again once a year." : p.ai.why}</p>}
      {(p.safety.declarations?.length ?? 0) > 0 && (
        <div className="door-log">
          <small className="muted">What you declared, and when it changed</small>
          {[...(p.safety.declarations ?? [])].reverse().map((dcl, i) => (
            <p className="small" key={dcl.at}>
              <b>{fmtDay(dcl.at)}{i === 0 ? ", current" : ""}:</b> {dcl.situations.length ? dcl.situations.map((id) => SITUATIONS.find((x) => x.id === id)?.label ?? id).join("; ") : dcl.none ? "none applies" : "nothing ticked"}{dcl.allergies.length ? `. Avoids: ${dcl.allergies.join(", ")}` : ""}
            </p>
          ))}
        </div>
      )}
      {/* DT141 (0.2.126; Milan 28 October 18:33): the step ends on its button, once answered: Next, or Back to the chat */}
      {onDone && <button type="button" className="pill pill-primary pill-wide door-done" disabled={!answered} onClick={onDone}>{answered ? doneLabel : "Tick one, or None of these applies to me"}</button>}
    </section>
  );
}
