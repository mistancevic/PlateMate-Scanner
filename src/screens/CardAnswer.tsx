// DT189 (0.3.31, board Stories138; Coach Milan 31 October 17:25 to 18:07 Go): under every shared card, Answer (one line and
// Send) and two one-tap reactions, Good and Seen. Both are notes on the same thread with the card's id, title and time. The
// answer lands on the client's Today like the week's note; the reaction only on the card and in My coach. After Send the card
// shows the answer, read or not, the client's replies after it, and Answer again. Buttons 44 px or more.
import { w } from "../words";
import { useState } from "react";
import type { ClientRow } from "../cloud";
import { onCard, repliesAfter, cardWhen, REACTION_WORDS, type CoachNote } from "../coachNotes";

export function CardAnswer({ row, card, coachName, send, notify, setError, onDone }: { row: ClientRow; card: any; coachName: string; send: (notes: CoachNote[]) => Promise<void>; notify: (m: string) => void; setError: (m: string) => void; onDone?: () => void }) {
  const [text, setText] = useState("");
  const [again, setAgain] = useState(false);
  const [busy, setBusy] = useState(false);
  const name = row.name.split(" ")[0];
  const given = onCard(row.notes, card.id);
  const write = async (n: CoachNote, said: string) => {
    setBusy(true);
    try { await send([...row.notes, n]); setText(""); setAgain(false); notify(said); onDone?.(); }
    catch (e: any) { setError(e.message || w("cardanswer.thatDidnTSendTry")); }
    finally { setBusy(false); }
  };
  const cardRef = { id: card.id, title: card.meal?.title ?? "a meal", at: card.createdAt };
  const answer = () => write({ at: new Date().toISOString(), by: "coach", name: coachName, text: text.trim(), suggest: { kind: "answer", card: cardRef } }, `Sent. ${name} sees it on Today, with the meal.`);
  const react = (r: "good" | "seen") => { const at = new Date().toISOString(); return write({ at, by: "coach", name: coachName, text: REACTION_WORDS[r], readAt: at, suggest: { kind: "reaction", card: cardRef, reaction: r } }, r === "good" ? `Good, on ${name}'s card.` : `Seen, on ${name}'s card.`); };
  const form = (
    <div className="ca-form">
      <textarea className="search" rows={2} aria-label={`Answer on ${cardRef.title}`} placeholder={w("cardanswer.oneLineAboutThisMeal")} value={text} onChange={(e) => setText(e.target.value)} />
      <div className="ca-row">
        <button type="button" className="pill pill-small pill-primary" disabled={busy || !text.trim()} onClick={answer}>{w("cardanswer.sendTheAnswer")}</button>
        {given.length > 0 && <button type="button" className="pill pill-small" disabled={busy} onClick={() => { setAgain(false); setText(""); }}>{w("cardanswer.cancel")}</button>}
        {!given.length && <><button type="button" className="pill pill-small" disabled={busy} onClick={() => react("good")}>Good 👍</button><button type="button" className="pill pill-small" disabled={busy} onClick={() => react("seen")}>{w("cardanswer.seen")}</button></>}
      </div>
      <small className="muted">An answer lands on {name}'s Today with the meal quoted, with Got it. Good or Seen lands on the card only.</small>
    </div>
  );
  return (
    <div className="card-answer">
      {given.map((n) => {
        const replies = repliesAfter(row.notes, n.at).slice(0, 2);
        return (
          <div key={n.at} className="ca-given">
            <small className="muted">{n.suggest?.kind === "reaction" ? `${n.text}, ${cardWhen(n.at)}` : `You answered, ${cardWhen(n.at)}${n.readAt ? " · read" : ""}`}</small>
            {n.suggest?.kind === "answer" && <span className="coach-note-text">{n.text}</span>}
            {replies.map((r) => <small key={r.at} className="muted">{name} replied, {cardWhen(r.at)}: “{r.text}”</small>)}
          </div>
        );
      })}
      {given.length && !again ? <button type="button" className="link ca-again" onClick={() => setAgain(true)}>{given.some((n) => n.suggest?.kind === "answer") ? w("cardanswer.answerAgain") : w("cardanswer.answer")}</button> : null}
      {(!given.length || again) && (<><b className="ca-title">{w("cardanswer.answer")}</b>{form}</>)}
    </div>
  );
}
