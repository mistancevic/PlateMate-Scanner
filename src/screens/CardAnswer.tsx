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
  // the card's title is kept with the note as it is (a meal with no title is kept as "a meal")
  const cardRef = { id: card.id, title: card.meal?.title ?? "a meal", at: card.createdAt };
  const shownTitle = card.meal?.title ?? w("coach.aMeal");
  // a reaction is kept as English words (Good 👍, Seen); the screen shows its own
  const reactWord = (n: CoachNote) => (n.suggest?.reaction === "good" ? w("cardanswer.good") : n.suggest?.reaction === "seen" ? w("cardanswer.seen") : n.text);
  const answer = () => write({ at: new Date().toISOString(), by: "coach", name: coachName, text: text.trim(), suggest: { kind: "answer", card: cardRef } }, w("cardanswer.sent", { name }));
  const react = (r: "good" | "seen") => { const at = new Date().toISOString(); return write({ at, by: "coach", name: coachName, text: REACTION_WORDS[r], readAt: at, suggest: { kind: "reaction", card: cardRef, reaction: r } }, w(r === "good" ? "cardanswer.goodOn" : "cardanswer.seenOn", { name })); };
  const form = (
    <div className="ca-form">
      <textarea className="search" rows={2} aria-label={w("cardanswer.answerOn", { title: shownTitle })} placeholder={w("cardanswer.oneLineAboutThisMeal")} value={text} onChange={(e) => setText(e.target.value)} />
      <div className="ca-row">
        <button type="button" className="pill pill-small pill-primary" disabled={busy || !text.trim()} onClick={answer}>{w("cardanswer.sendTheAnswer")}</button>
        {given.length > 0 && <button type="button" className="pill pill-small" disabled={busy} onClick={() => { setAgain(false); setText(""); }}>{w("cardanswer.cancel")}</button>}
        {!given.length && <><button type="button" className="pill pill-small" disabled={busy} onClick={() => react("good")}>{w("cardanswer.good")}</button><button type="button" className="pill pill-small" disabled={busy} onClick={() => react("seen")}>{w("cardanswer.seen")}</button></>}
      </div>
      <small className="muted">{w("cardanswer.howItLands", { name })}</small>
    </div>
  );
  return (
    <div className="card-answer">
      {given.map((n) => {
        const replies = repliesAfter(row.notes, n.at).slice(0, 2);
        return (
          <div key={n.at} className="ca-given">
            <small className="muted">{n.suggest?.kind === "reaction" ? w("cardanswer.reactedAt", { word: reactWord(n), when: cardWhen(n.at) }) : w(n.readAt ? "cardanswer.youAnsweredRead" : "cardanswer.youAnswered", { when: cardWhen(n.at) })}</small>
            {n.suggest?.kind === "answer" && <span className="coach-note-text">{n.text}</span>}
            {replies.map((r) => <small key={r.at} className="muted">{w("cardanswer.replied", { name, when: cardWhen(r.at), text: r.text })}</small>)}
          </div>
        );
      })}
      {given.length && !again ? <button type="button" className="pill pill-small pill-action ca-again" onClick={() => setAgain(true)}>{given.some((n) => n.suggest?.kind === "answer") ? w("cardanswer.answerAgain") : w("cardanswer.answer")}</button> : null}
      {(!given.length || again) && (<><b className="ca-title">{w("cardanswer.answer")}</b>{form}</>)}
    </div>
  );
}
