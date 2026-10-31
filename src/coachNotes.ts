// The coach's note and the check-in day (0.2.6, canvas board CW, CW4 to CW6). One thread per client in the client's own
// account: the coach's weekly note (Approve the week or Change the numbers, one line), and the client's replies.
// The client sees a new note on Today once; Got it keeps it in My coach.
export type CoachNote = { at: string; by: "coach" | "client"; name?: string; week?: string; verdict?: "approved" | "change"; text: string; readAt?: string; suggest?: Suggest; answer?: Answer };
// DT188 (0.3.30, board Stories137, Milan 16:26 Go): the coach suggests, never touches. A suggestion is a note with a suggest
// part; it lands on the client's Today as a card with Accept and Not now. Accept does only what the client could have done
// alone. Not now carries a reason, cheap to give: one of four chips, or a line; a plain Not now goes through too.
// DT189 (0.3.31, board Stories138, Milan 17:25 to 18:07 Go): an answer on a shared card, and a one-tap reaction (Good, Seen).
// Both sit on the same thread with the card's id, title and time. An answer lands on the client's Today like the week's
// note; a reaction only on the card and in My coach: it is born read, so it never counts on the badge.
export type Suggest = { kind: "snack" | "page" | "answer" | "reaction"; time?: string; page?: { part: "nutrients" | "body" | "situations"; id: string; member?: string; name: string }; card?: { id: string; title: string; at: string }; reaction?: "good" | "seen" };
export type Answer = { at: string; choice: "accept" | "later"; reason?: string };
export const REASONS = ["Not this week", "Don't like it", "Too much for me", "Ask me at the check-in"];
export const answerWords = (n: CoachNote) => !n.answer ? "waiting" : n.answer.choice === "accept" ? "accepted" : `not now${n.answer.reason ? `: ${n.answer.reason.charAt(0).toLowerCase()}${n.answer.reason.slice(1)}` : ""}`;
export const suggestTitle = (s: Suggest, text: string) => s.kind === "snack" ? `A planned snack${s.time ? ` at ${s.time}` : ""}: ${text}` : s.kind === "page" ? `A page: ${s.page?.name ?? text}` : s.kind === "answer" ? `On ${s.card?.title ?? "a meal"}: ${text}` : `${s.reaction === "good" ? "Good" : "Seen"} on ${s.card?.title ?? "a meal"}`;
export const REACTION_WORDS: Record<"good" | "seen", string> = { good: "Good 👍", seen: "Seen" };
// the card's time, for the answer's title: "On your Sarma with skyr, Tuesday 13:00"
export const cardWhen = (at: string) => new Date(at).toLocaleDateString("en-GB", { weekday: "long", hour: "2-digit", minute: "2-digit" }).replace(",", "");
// the coach's answers and reactions on one card, newest first
export const onCard = (notes: CoachNote[], cardId: string) => notes.filter((n) => n.by === "coach" && n.suggest?.card?.id === cardId && (n.suggest.kind === "answer" || n.suggest.kind === "reaction")).sort((a, b) => (a.at < b.at ? 1 : -1));
// the client's replies after a given note
export const repliesAfter = (notes: CoachNote[], at: string) => notes.filter((n) => n.by === "client" && n.at > at);
export const CHECKIN_DEFAULT = 4; // Friday, Monday first
export const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const checkinOf = (x: unknown) => (typeof x === "number" && x >= 0 && x <= 6 ? x : CHECKIN_DEFAULT);
export const notesOf = (x: unknown): CoachNote[] => (Array.isArray(x) ? x.filter((n) => n && typeof n.at === "string" && typeof n.text === "string") : []);
// 0.2.121 (Tester 2, Milan 28 October 15:24): both sides wrote the whole thread from their own copy, so a note written while
// the other side wrote could vanish. Before a write, the thread on the account and this one are merged: every note once, by
// when and who; a Got it (readAt) is kept from either copy
export function mergeNotes(a: CoachNote[], b: CoachNote[]): CoachNote[] {
  const m = new Map<string, CoachNote>();
  for (const n of [...a, ...b]) { const k = `${n.at}|${n.by}`; const had = m.get(k); m.set(k, had ? { ...had, ...n, readAt: had.readAt ?? n.readAt, answer: had.answer ?? n.answer } : n); }
  return [...m.values()].sort((x, y) => (x.at < y.at ? -1 : x.at > y.at ? 1 : 0));
}
// how many notes from the coach the client has not seen (no Got it yet), and replies from the client newer than a time
export const unseenFromCoach = (notes: CoachNote[]) => notes.filter((n) => n.by === "coach" && !n.readAt).length;
export const repliesSince = (notes: CoachNote[], since: string) => notes.filter((n) => n.by === "client" && n.at > since).length;
// the newest note from the coach the client has not answered with Got it
export const unreadNote = (notes: CoachNote[]) => [...notes].reverse().find((n) => n.by === "coach" && !n.readAt && n.suggest?.kind !== "reaction") ?? null;
// the local copy, so Today shows the note without waiting for the account
const KEY = "chefmealan-coach";
export type CoachLocal = { notes: CoachNote[]; checkinDay: number };
export const getCoachLocal = (): CoachLocal => { try { const x = JSON.parse(localStorage.getItem(KEY) || "{}"); return { notes: notesOf(x.notes), checkinDay: checkinOf(x.checkinDay) }; } catch { return { notes: [], checkinDay: CHECKIN_DEFAULT }; } };
export const setCoachLocal = (c: CoachLocal) => { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch {} };

// ---- DT189: Waiting for you, the coach's list. One row per thing a client sent or asked, newest first: a card shared (with a
// question or not, until opened), a reply to a note, numbers to approve, a check-in due today. The badge on Clients is this
// list's count; a row leaves the list when answered, reacted to, approved, sent, or opened and marked seen on this phone.
export type Waiting = { key: string; uid: string; name: string; kind: "card" | "reply" | "review" | "checkin"; what: string; when: string; at: string; cardId?: string };
export type WaitingRow = { uid: string; name: string; notes: CoachNote[]; feedback: any[]; review: { status: string; at?: string } | null; checkinDay: number };
const SEEN = (uid: string) => `chefmealan-waiting-seen-${uid}`;
export const seenWaiting = (coachUid: string): Set<string> => { try { return new Set(JSON.parse(localStorage.getItem(SEEN(coachUid)) || "[]")); } catch { return new Set(); } };
export const markWaitingSeen = (coachUid: string, key: string) => { try { const s = seenWaiting(coachUid); s.add(key); localStorage.setItem(SEEN(coachUid), JSON.stringify([...s].slice(-400))); } catch {} };
const REASON_WORDS: Record<string, string> = { look: "look at this", ok: "was this OK?", help: "help me next time" };
export function waitingFor(rows: WaitingRow[], seen: Set<string>, todayIndex: number, weekKey: string): Waiting[] {
  const out: Waiting[] = [];
  for (const r of rows) {
    const first = r.name.split(" ")[0];
    for (const f of r.feedback) {
      const key = `card|${r.uid}|${f.id}`;
      if (seen.has(key) || onCard(r.notes, f.id).length) continue;
      const q = f.shared?.reason ? REASON_WORDS[f.shared.reason] ?? "" : "";
      out.push({ key, uid: r.uid, name: first, kind: "card", what: `${q ? q + " " : ""}${f.meal?.title ?? "a meal"}`, when: `${cardWhen(f.createdAt)} · shared with you`, at: f.shared?.at || f.createdAt, cardId: f.id });
    }
    // a reply: the client's newest note after the coach's last one
    const lastCoach = [...r.notes].reverse().find((n) => n.by === "coach");
    for (const n of r.notes) if (n.by === "client" && (!lastCoach || n.at > lastCoach.at)) { const key = `reply|${r.uid}|${n.at}`; if (!seen.has(key)) out.push({ key, uid: r.uid, name: first, kind: "reply", what: `replied: “${n.text}”`, when: `${cardWhen(n.at)} · to your note`, at: n.at }); }
    if (r.review?.status === "waiting") { const key = `review|${r.uid}|${r.review.at ?? ""}`; if (!seen.has(key)) out.push({ key, uid: r.uid, name: first, kind: "review", what: "numbers to approve", when: "the goal sheet", at: r.review.at ?? "" }); }
    if (r.checkinDay === todayIndex && !r.notes.some((n) => n.by === "coach" && n.week === weekKey)) out.push({ key: `checkin|${r.uid}|${weekKey}`, uid: r.uid, name: first, kind: "checkin", what: "check-in today", when: "the note is not sent yet", at: `${weekKey}T00:00:00` });
  }
  return out.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}
// the strip on My day, in words
export function waitingWords(list: Waiting[]): string {
  if (!list.length) return "";
  const n = (k: Waiting["kind"]) => list.filter((x) => x.kind === k).length;
  const parts = [n("card") ? `${n("card") === 1 ? "a card" : `${n("card")} cards`} shared` : "", n("reply") ? `${n("reply") === 1 ? "a reply" : `${n("reply")} replies`}` : "", n("review") ? "numbers to approve" : "", n("checkin") ? `${n("checkin") === 1 ? "a check-in" : `${n("checkin")} check-ins`} today` : ""].filter(Boolean);
  return `${list.length === 1 ? "1 thing waits" : `${list.length} things wait`} on Clients: ${parts.join(", ")}. Open Clients ›`;
}
