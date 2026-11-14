import { numLocale, w, wn, dec, dateText } from "../words";
import { weekdayName, weekdayShort } from "../weekdayWords";
import { BurnCard, Squares } from "../components/Measured";
import { fmtKg } from "../weight";
import { wIn, wText } from "../units";
import { shortDate } from "../measured";
import { useState, type ReactNode } from "react";
import type { ClientRow } from "../cloud";
import { wordsOf, type DayLine, type SlotMark } from "../dayLines";
import { DAY_NAMES, suggestTitle, answerWords, type CoachNote } from "../coachNotes";
import { BANDS, PACES, bandOf, goalName, goalsForBand, isBuild, bandName } from "../goal";
import { isoWeek, ymd } from "../plan";
import { pdRange, pdVal } from "../ui";
import { density } from "../pilot";
import { trendOf, VERDICT_WORDS, avg7, fmtPct } from "../weight";
import { ProfileChanges, SharedProfileCard, newProfileChanges } from "./SummaryPanel";
import { fromLine } from "../clientName";

// The coach's week (0.2.6, canvas board CW, CW1 to CW4 and CW8, Milan 13 and 15 October 2026). Clients puts the clients
// whose check-in is today first, each with the week as seven bars. A client opens on a page of their own: the week planned
// against eaten, a day opened, weigh-ins, DaaM good meals, the note, the check-in day, the notes sent, and a new goal from a
// date. The rest of the old client sheet follows under it.
export type CoachOps = {
  sendNote: (row: ClientRow, notes: CoachNote[]) => Promise<void>;
  setCheckin: (row: ClientRow, day: number) => Promise<void>;
  setGoal: (row: ClientRow, band: string, from: string) => Promise<void>;
};
const DAY = 864e5;
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setHours(12, 0, 0, 0); x.setDate(x.getDate() + n); return x; };
const SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const first = (name: string) => name.split(" ")[0];
const longDay = (k: string) => dateText(new Date(`${k}T12:00:00`), { weekday: "long", day: "numeric", month: "long" }, "en-GB").replace(",", "");
export const todayIndex = (d = new Date()) => (d.getDay() + 6) % 7;

// a line as the coach reads it today: a day the phone saved as today or ahead is read again against today
function lineOn(row: ClientRow, key: string, today: string): DayLine | null {
  const l = row.days?.[key]; if (!l) return null;
  return { ...l, when: key < today ? "past" : key === today ? "today" : "future" };
}
export function weekOf(row: ClientRow, offset = 0) {
  const now = new Date(), today = ymd(now);
  const monday = addDays(isoWeek(now).monday, offset * 7);
  const days = Array.from({ length: 7 }, (_, i) => { const d = addDays(monday, i), key = ymd(d); return { i, d, key, line: lineOn(row, key, today), past: key < today, today: key === today }; });
  const lived = days.filter((x) => x.line?.lived).length;
  return { monday, sunday: addDays(monday, 6), week: isoWeek(monday).week, days, lived };
}
const livedText = (n: number) => wn("clientweek.lived", n);
// the week as seven bars: green lived by the plan, amber changed, open today, grey to come or nothing planned
export function WeekBars({ row }: { row: ClientRow }) {
  const wq = weekOf(row);
  return (
    <div className="cw-bars-row">
      <span className="cw-bars" aria-label={w("clientweek.thisWeekABarA")}>
        {wq.days.map((x) => {
          const tone = x.today ? "open" : x.line?.lived ? "lived" : x.past && x.line?.planned ? "changed" : "none";
          return <i key={x.key} title={weekdayName(x.i)} className={`cw-bar ${tone}`} />;
        })}
      </span>
      <small className={wq.lived ? "cw-lived" : "cw-muted"}>{livedText(wq.lived)}</small>
    </div>
  );
}
const weekNo = (row: ClientRow) => { const at = row.goal?.setAt ? Date.parse(row.goal.setAt) : NaN; return Number.isFinite(at) ? Math.floor((Date.now() - at) / (7 * DAY)) + 1 : null; };
// in the first two weeks (0.2.7, board FT, FT6): the day of 14, counted from the start the client's phone sent
export const phaseDay = (row: ClientRow) => { const m = row.measured; if (!m?.phase || !m.start) return null; const d = Math.floor((Date.parse(`${ymd(new Date())}T12:00:00`) - Date.parse(`${m.start}T12:00:00`)) / DAY) + 1; return d >= 1 && d <= 28 ? d : null; };
export function clientLine(row: ClientRow, today: boolean) {
  const wk = weekNo(row), pd = phaseDay(row);
  return [row.goal?.band ? goalName(row.goal.band) : w("clientweek.noGoalYet"), pd ? (pd <= 14 ? w("clientweek.firstTwoWeeks", { pd }) : w("clientweek.dayNotMeasured", { pd })) : wk ? w("clientweek.weekN", { n: wk }) : null, today ? w("clientweek.checkinToday") : w("clientweek.checkinOn", { day: weekdayName(row.checkinDay) })].filter(Boolean).join(" · ");
}
// B141 (0.3.146, board Stories219): the card shows the name, the email and where the client came from; below, the coach's own
// note, which only the coach sees. The card opens the client; the note's buttons don't.
export function ClientRowCard({ row, today, open, note, saveNote }: { row: ClientRow; today: boolean; open: () => void; note?: string; saveNote?: (text: string) => Promise<void> | void }) {
  const [edit, setEdit] = useState(false), [text, setText] = useState(note ?? "");
  const from = fromLine(row.via), stop = (e: { stopPropagation: () => void }) => e.stopPropagation();
  return (
    <div className={`card client-row cw-row ${today ? "cw-today" : ""}`} onClick={open}>
      <button type="button" className="client-open" onClick={(e) => { stop(e); open(); }}>
        <div className="client-head"><span className="avatar">{row.name.slice(0, 1).toUpperCase()}</span><div><b>{first(row.name)}</b>
          {row.email && row.email !== row.name && <small className="client-email">{row.email}</small>}
          {from && <small className="client-from">{from}</small>}
          <small>{clientLine(row, today)}</small>{newProfileChanges(row) > 0 && <small className="profile-new">{wn("clientweek.profileChanges", newProfileChanges(row))}</small>}</div></div>
        {phaseDay(row) && row.measured ? (
          <div style={{ width: "100%" }}>
            <Squares m={row.measured} ends={false} />
            <small className="ft-rowfoot">{wn("clientweek.fullDays", row.measured.fullDays)} · {w("clientweek.weighInsN", { n: row.measured.squares.filter((x) => x.weighed).length })} · {row.measured.readyOn ? w("clientweek.readyOn", { date: shortDate(row.measured.readyOn).slice(4) }) : w("clientweek.notReadyYet")}</small>
          </div>
        ) : <WeekBars row={row} />}
      </button>
      {saveNote && !today && (
        <div className="client-note-own" onClick={stop}>
          {edit ? (
            <>
              <textarea aria-label={w("coach.yourNote")} value={text} maxLength={600} onChange={(e) => setText(e.target.value)} />
              <small className="muted">{w("coach.noteOnlyYou", { name: first(row.name) })}</small>
              <div className="client-note-go"><button type="button" className="link" onClick={() => { setText(note ?? ""); setEdit(false); }}>{w("coach.cancel")}</button>
                <button type="button" className="pill pill-primary" onClick={async () => { await saveNote(text); setEdit(false); }}>{w("coach.saveNote")}</button></div>
            </>
          ) : (
            <>
              {note && <small className="client-note-text"><b>{w("coach.yourNote")}:</b> {note}</small>}
              <div className="client-note-go end"><button type="button" className="pill pill-small pill-action" onClick={() => { setText(note ?? ""); setEdit(true); }}>{note ? w("coach.editNote") : w("coach.addNote")}</button></div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const TONE: Record<string, string> = { lived: "cw-green", plan: "cw-green", changed: "cw-amber", today: "cw-grey", none: "cw-grey" };
const MARK: Record<SlotMark, ["clientweek.markPlan" | "clientweek.markSwapped" | "clientweek.markSkipped" | "clientweek.markMissed" | "clientweek.markOpen", string]> = { plan: ["clientweek.markPlan", "cw-green"], swapped: ["clientweek.markSwapped", "cw-amber"], skipped: ["clientweek.markSkipped", "cw-ink"], missed: ["clientweek.markMissed", "cw-amber"], open: ["clientweek.markOpen", "cw-grey"] };
const kcalText = (n: number) => `${Math.round(n).toLocaleString(numLocale())} kcal`;

// DT210 (0.3.50, board Stories157; Coach Milan 1 November 23:28 to 23:52 Go): a client's page holds everything about the
// client, with tabs inside it: Today and Week (read-only, with Suggest), Shared (the cards the client sent, each with Answer),
// Goal (numbers, weigh-ins, the formula). It opens on Week, or on Shared when a shared card sent you here.
export type ClientPart = "today" | "week" | "shared" | "goal";
export function ClientPage({ row, coachName, ops, back, notify, setError, tailFor, today, startOn = "week", waitingCount = 0 }: { row: ClientRow; coachName: string; ops: CoachOps; back: () => void; notify: (m: string) => void; setError: (m: string) => void; tailFor: (part: "goal" | "shared") => ReactNode; today: ReactNode; startOn?: ClientPart; waitingCount?: number }) {
  const [part, setPart] = useState<ClientPart>(startOn);
  const name = first(row.name);
  const [offset, setOffset] = useState(0);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const wq = weekOf(row, offset);
  const g = row.goal?.band ? bandOf(row.goal.band) : null;
  const kcalNow = row.goalsNow?.calories ?? null, proteinNow = row.goalsNow?.protein ?? null;
  const wk = weekNo(row);
  const span = w("clientweek.span", { from: dateText(wq.monday, wq.monday.getMonth() === wq.sunday.getMonth() ? { day: "numeric" } : { day: "numeric", month: "long" }), to: dateText(wq.sunday, { day: "numeric", month: "long" }) });
  // the note (CW4)
  const [verdict, setVerdict] = useState<"approved" | "change">("approved");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const send = async () => {
    setSending(true);
    try {
      const note: CoachNote = { at: new Date().toISOString(), by: "coach", name: coachName, week: ymd(wq.monday), verdict, text: text.trim() };
      await ops.sendNote(row, [...row.notes, note]); setText(""); notify(w("clientweek.sent", { name }));
    } catch (e: any) { setError(e.message || w("clientweek.theNoteDidnTSend")); } finally { setSending(false); }
  };
  // a new goal from a date (CW8)
  const [band, setBand] = useState<string>("");
  const todayKey = ymd(new Date());
  const dayFrom = (n: number) => ymd(addDays(new Date(), n));
  const tomorrow = dayFrom(1);
  const nextMonday = (() => { const n = (8 - new Date().getDay()) % 7 || 7; const k = dayFrom(n); return k === tomorrow ? dayFrom(n + 7) : k; })();
  const [from, setFrom] = useState(todayKey);
  const [picking, setPicking] = useState(false);
  const fromName = from === todayKey ? w("clientweek.fromToday") : from === tomorrow ? w("clientweek.fromTomorrow") : longDay(from);
  const applyGoal = async () => {
    try { await ops.setGoal(row, band, from); notify(from === todayKey ? w("clientweek.goalNow", { name, goal: goalName(band) }) : w("clientweek.goalStarts", { name, goal: goalName(band), date: longDay(from) })); setBand(""); }
    catch (e: any) { setError(e.message || w("clientweek.theGoalDidnTSave")); }
  };
  // weigh-ins and DaaM good in the week
  const inWeek = (date: string) => date >= ymd(wq.monday) && date <= ymd(wq.sunday);
  const weighs = (row.weighIns ?? []).filter((x: any) => inWeek(x.date)).sort((a: any, b: any) => (a.date < b.date ? -1 : 1));
  // DT172 (privacy finding 14, option a): without shared body data, the trend comes as percent and only the days weighed
  const pct = !row.weightKg && row.weightTrend ? row.weightTrend : null;
  const trend = pct ?? (row.goal?.band && row.weightKg ? trendOf(row.weighIns, row.goal.band, row.weightKg, row.trainingAge) : null);
  const daysWeighed = pct ? (row.weighDates ?? []).filter((d) => inWeek(d)).length : null;
  const a7 = avg7(row.weighIns);
  const daam = row.feedback.filter((f: any) => f.taste === "DaaM good" && inWeek(ymd(new Date(f.createdAt))));
  const day = openDay ? wq.days.find((x) => x.key === openDay)?.line ?? null : null;
  const futureDays = wq.days.filter((x) => !x.past && !x.today);
  const notesShown = [...row.notes].reverse();
  return (
    <div className="client-page">
      {/* DT189 (0.3.32, Milan 18:39): the badge is visible from here, so the way back says what waits one level up */}
      <div className="menu-head cw-back"><button className="link" onClick={back}>{waitingCount > 0 ? w("client.backWaiting", { n: waitingCount }) : w("client.back")}</button><span /></div>
      <section className="card person cw-person"><span className="avatar">{row.name.slice(0, 1).toUpperCase()}</span>
        <div><b>{name}</b><small>{[g ? goalName(g.id) : w("clientweek.noGoalYet"), kcalNow ? `${kcalNow.toLocaleString(numLocale())} kcal` : null, proteinNow ? w("clientweek.gProtein", { n: proteinNow }) : null, wk ? w("clientweek.weekN", { n: wk }) : null].filter(Boolean).join(" · ")}</small><small>{w("clientweek.checkinDayIs", { day: weekdayName(row.checkinDay) })}</small></div>
      </section>
      <div className="cp-tabs" role="tablist" aria-label={w("clientweek.namesPage", { name })}>
        {([["today", w("clientweek.tabToday")], ["week", w("clientweek.tabWeek")], ["shared", row.feedback.length ? w("clientweek.tabSharedN", { n: row.feedback.length }) : w("clientweek.tabShared")], ["goal", w("clientweek.tabGoal")]] as [ClientPart, string][]).map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={part === k} className={`choice ${part === k ? "on" : ""}`} onClick={() => setPart(k)}>{l}</button>
        ))}
      </div>
      {part === "today" && today}
      {part === "shared" && tailFor("shared")}
      {part === "week" && (<>
      {/* DT167 (0.3.9, board Stories119 version 2): the check-in starts with what changed in the shared profile */}
      <ProfileChanges uid={row.uid} sp={row.profileShare} name={name} />

      <section className="card cw-week" aria-label={w("clientweek.namesWeek", { name })}>
        <div className="cw-week-nav"><button type="button" className="week-arrow" aria-label={w("clientweek.weekBefore")} onClick={() => setOffset(offset - 1)}>‹</button><b>{w("clientweek.weekSpan", { n: wq.week, span })}</b><button type="button" className="week-arrow" aria-label={w("clientweek.weekAfter")} disabled={offset >= 0} onClick={() => setOffset(offset + 1)}>›</button></div>
        <div className="cw-week-head"><b>{w("clientweek.plannedAgainstEaten")}</b><small className={wq.lived ? "cw-lived" : "cw-muted"}>{livedText(wq.lived)}</small></div>
        {wq.days.filter((x) => x.past || x.today).map((x) => {
          const l = x.line;
          const words = l ? wordsOf(l) : { status: w("clientweek.nothingPlannedOrEaten"), tone: "none" as const, detail: "" };
          const pd = l && l.kcal ? density(l.protein, l.kcal) : null;
          return (
            <button type="button" key={x.key} className="cw-day" disabled={!l} onClick={() => setOpenDay(x.key)} aria-label={w("clientweek.dayStatus", { day: weekdayName(x.i), status: words.status })}>
              <small className="cw-day-name">{weekdayShort(x.i)}</small>
              <span className="cw-day-mid"><b className={TONE[words.tone]}>{l?.lived ? "✓ " : ""}{words.status}</b>{words.detail && <small>{words.detail}</small>}</span>
              <span className="cw-day-num">{pd !== null && <b className={words.tone === "changed" ? "cw-amber" : words.tone === "today" || words.tone === "none" ? "" : "cw-green"}>{pdVal(pd)}</b>}{l && l.kcal > 0 && <small>{kcalText(l.kcal)}</small>}</span>
            </button>
          );
        })}
        {futureDays.length > 0 && <small className="cw-week-foot">{futureDays.some((x) => x.line?.planned) ? futureDays.filter((x) => x.line?.planned).map((x) => w("clientweek.dayPlanned", { day: weekdayName(x.i), n: x.line!.planned })).join(" · ") : w("clientweek.daysNothingPlanned", { days: futureDays.map((x) => weekdayName(x.i)).join(", ") })}</small>}
        {wq.days.every((x) => !x.line) && <small className="cw-week-foot">{w("clientweek.nothingThisWeek", { name })}</small>}
      </section>

      {day && (
        <div className="sheet-backdrop" onClick={() => setOpenDay(null)}>
          <div className="sheet cw-day-sheet" role="dialog" aria-label={longDay(day.date)} onClick={(e) => e.stopPropagation()}>
            <div className="card-top"><span>{longDay(day.date).replace(/^(\w+) /, "$1, ")}</span><button className="link" onClick={() => setOpenDay(null)}>{w("clientweek.close")}</button></div>
            <div className="past-nums"><span><b>{Math.round(day.kcal).toLocaleString(numLocale())}</b><small>{day.target ? w("clientweek.ofKcal", { n: day.target.kcal.toLocaleString(numLocale()) }) : "kcal"}</small></span><span><b>{day.protein}</b><small>{day.target ? w("clientweek.ofProtein", { n: day.target.protein }) : w("clientweek.gProteinUnit")}</small></span><span><b>{day.kcal ? pdVal(density(day.protein, day.kcal)) : "–"}</b><small>{w("clientweek.pdThatDay")}</small></span></div>
            {day.slots.map((s) => {
              const [wordKey, cls] = MARK[s.mark], word = w(wordKey);
              const shared = s.eaten ? row.feedback.find((f: any) => f.notes && f.meal?.title === s.eaten && ymd(new Date(f.createdAt)) === day.date) : null;
              return (
                <div className="cw-slot" key={s.name}>
                  <small className="cw-slot-time">{s.time}</small>
                  <span><small>{w("clientweek.slotPlanned", { slot: s.name, what: s.planned ?? w("clientweek.nothing") })}</small><b>{s.eaten ?? s.planned ?? "–"}</b><small className={cls}>{word}{s.mark === "plan" || s.mark === "swapped" ? ` · ${kcalText(s.kcal)} · ${w("clientweek.gProtein", { n: s.protein })}` : ""}</small>{shared && <small className="cw-shared">{w("clientweek.sharedNote", { text: shared.notes })}</small>}</span>
                </div>
              );
            })}
            {day.extras.length > 0 && <small className="cw-extras">{wn("clientweek.extras", day.extras.length, { list: day.extras.map((x) => `${x.title.toLowerCase()}, ${kcalText(x.kcal)}`).join("; ") })}</small>}
            {day.extras.map((x) => { const f = row.feedback.find((c: any) => c.notes && c.meal?.title === x.title && ymd(new Date(c.createdAt)) === day.date); return f ? <small className="cw-extras cw-shared" key={x.title}>{w("clientweek.sharedExtra", { title: x.title.toLowerCase(), text: f.notes })}</small> : null; })}
          </div>
        </div>
      )}

      {!row.flags.some((f) => f.situation === "eating") && (
        <section className="card cw-mini">
          <div><small>{w("clientweek.weighIns")}</small><small>{w("clientweek.thisWeekN", { n: daysWeighed ?? weighs.length })}</small></div>
          {daysWeighed !== null ? <b>{daysWeighed ? wn("clientweek.morningsWeighed", daysWeighed) : w("clientweek.noWeighInsThisWeek")}</b> : weighs.length ? <b>{weighs.length > 1 ? `${dec(wIn(weighs[0].kg), 1)} → ${wText(weighs[weighs.length - 1].kg)}` : wText(weighs[0].kg)}{a7 ? ` · ${w("weight.avg7Value", { kg: dec(wIn(a7), 1) })}` : ""}</b> : <b>{w("clientweek.noWeighInsThisWeek")}</b>}
          {trend && <small className="cw-mini-line">{trend.verdict === "too few" ? w("clientweek.notEnoughWeighInsYet") : w("clientweek.trendLine", { verdict: VERDICT_WORDS[trend.verdict], goal: goalName(row.goal.band), change: pct ? fmtPct(trend.change!) : fmtKg(trend.change!) })}</small>}
        </section>
      )}
      {/* the measured burn, as the client sees it (0.2.7, board FT, FT7) */}
      {row.measured && !row.flags.some((f) => f.situation === "eating") && <BurnCard m={row.measured} formulaKcal={row.measured.formulaKcal} name={name} />}
      <section className="card cw-mini">
        <div><small>{w("clientweek.daamGoodThisWeek")}</small><small>{wn("clientweek.meals", daam.length)}</small></div>
        <small className="cw-mini-strong">{daam.length ? daam.map((f: any) => f.meal?.title).join(" · ") : w("clientweek.noneShared", { name })}</small>
      </section>

      <section className="card cw-note">
        <b>{w("clientweek.noteFor", { day: weekdayName(row.checkinDay) })}</b>
        <div className="chip-row"><button type="button" className={`choice ${verdict === "approved" ? "on" : ""}`} aria-pressed={verdict === "approved"} onClick={() => setVerdict("approved")}>{w("clientweek.approveTheWeek")}</button><button type="button" className={`choice ${verdict === "change" ? "on" : ""}`} aria-pressed={verdict === "change"} onClick={() => setVerdict("change")}>{w("clientweek.changeTheNumbers")}</button></div>
        <textarea rows={3} aria-label={w("clientweek.yourNote")} value={text} onChange={(e) => setText(e.target.value)} placeholder={w("clientweek.oneLineFor", { name })} />
        <button className="pill pill-primary pill-wide" disabled={sending || !text.trim()} onClick={send}>{w("clientweek.sendTheNote")}</button>
        <small className="setting-hint">{w("clientweek.seesOnce", { name })}</small>
      </section>
      <section className="card seg cw-checkin">
        <div className="setting"><small className="setting-name">{w("clientweek.checkInDay")}</small>
          <div className="chip-row" role="group" aria-label={w("clientweek.checkInDay")}>{SHORT.map((d, i) => <button type="button" key={d} className={`choice ${row.checkinDay === i ? "on" : ""}`} aria-pressed={row.checkinDay === i} onClick={() => ops.setCheckin(row, i).then(() => notify(w("clientweek.checkinSet", { name, day: weekdayName(i) }))).catch((e) => setError(e.message))}>{weekdayShort(i)}</button>)}</div>
          <small className="setting-hint">{w("clientweek.checkinHint", { name })}</small>
        </div>
      </section>
      {notesShown.length > 0 && (
        <>
          <p className="label">{w("clientweek.notes")}</p>
          <section className="card days">{notesShown.slice(0, 12).map((n) => (
            <div className="history-row" key={n.at}><div><b>{dateText(new Date(n.at), { weekday: "long", day: "numeric", month: "long" }, "en-GB").replace(",", "")}</b><small>{n.by === "client" ? w("clientweek.nameReplied", { name }) : n.suggest?.kind === "answer" ? w(n.readAt ? "clientweek.answeredOnRead" : "clientweek.answeredOn", { title: n.suggest.card?.title ?? w("coach.aMeal") }) : n.suggest?.kind === "reaction" ? suggestTitle(n.suggest, n.text) : n.suggest ? w("clientweek.suggestedLine", { title: suggestTitle(n.suggest, n.text), answer: answerWords(n) }) : n.verdict === "change" ? w("clientweek.askedToChangeTheNumbers") : w("clientweek.approvedTheWeek")}{n.by === "coach" && n.readAt && !n.suggest ? ` · ${w("clientweek.read")}` : ""}</small></div><div className="history-num"><small>“{n.text}”</small></div></div>
          ))}</section>
        </>
      )}

      </>)}
      {part === "goal" && (<>
      <p className="label">{w("clientweek.namesGoal", { name })}</p>
      <section className="card you-card"><span><b>{g ? goalName(g.id) : w("clientweek.noGoalYet")}</b><small>{[row.goal?.setAt ? w("me.periodSince", { date: dateText(new Date(row.goal.setAt), { day: "numeric", month: "long" }, "en-GB") }) : null, row.goal?.setBy === "coach" ? w("clientweek.setByYou") : row.goal ? w("clientweek.setByName", { name }) : null, kcalNow ? `${kcalNow.toLocaleString(numLocale())} kcal` : null, proteinNow ? w("clientweek.gProtein", { n: proteinNow }) : null].filter(Boolean).join(" · ")}</small>{row.nextGoal && <small className="cw-next">{w(row.nextGoal.setBy === "coach" ? "clientweek.nextGoalByYou" : "clientweek.nextGoal", { goal: goalName(row.nextGoal.band), date: longDay(row.nextGoal.from) })}</small>}</span></section>
      <section className="card cw-goal">
        <b>{w("clientweek.newGoalFor", { name })}</b>
        <div className="bands compact">{BANDS.map((b) => {
          const on = band === b.id || (b.id === "gain" && isBuild(band));
          return <button key={b.id} type="button" className={`band-card ${on ? "on" : ""}`} aria-pressed={on} onClick={() => setBand(b.id === "gain" ? (isBuild(band) ? band : "gainsteady") : b.id)}><b>{on ? "✓ " : ""}{bandName(b.id)}</b><span>{w("clientweek.bandLine", { range: pdRange(b.range), lo: b.kcal[0].toLocaleString(numLocale()), hi: b.kcal[1].toLocaleString(numLocale()), plo: b.protein[0], phi: b.protein[1] })}</span></button>;
        })}</div>
        {isBuild(band) && <div className="chip-row" role="group" aria-label={w("clientweek.pace")}>{PACES.map((x) => <button key={x.id} type="button" className={`choice ${band === x.band ? "on" : ""}`} aria-pressed={band === x.band} onClick={() => setBand(x.band)}>{x.name}</button>)}</div>}
        <div className="apply-from" role="group" aria-label={w("clientweek.applyFrom")}>
          <small className="setting-name">{w("clientweek.applyFrom")}</small>
          <div className="chip-row">
            {[[todayKey, w("clientweek.chipToday")], [tomorrow, w("clientweek.chipTomorrow")], [nextMonday, longDay(nextMonday)]].map(([k, l]) => <button type="button" key={k} className={`choice ${from === k && !picking ? "on" : ""}`} aria-pressed={from === k && !picking} onClick={() => { setPicking(false); setFrom(k); }}>{l}</button>)}
            <button type="button" className={`choice ${picking ? "on" : ""}`} aria-pressed={picking} onClick={() => setPicking(true)}>{w("clientweek.pickADate")}</button>
          </div>
          {picking && <input type="date" aria-label={w("clientweek.startDate")} min={tomorrow} value={from > todayKey ? from : ""} onChange={(e) => e.target.value && e.target.value > todayKey && setFrom(e.target.value)} />}
          <small className="setting-hint">{w("clientweek.daysBefore", { name })}</small>
        </div>
        <button className="pill pill-primary pill-wide" disabled={!band} onClick={applyGoal}>{w("clientweek.applyFromDay", { from: fromName })}</button>
      </section>
      <SharedProfileCard name={name} sp={row.profileShare} />
      {tailFor("goal")}
      </>)}
    </div>
  );
}
// the numbers a coach's goal starts with: the band's middle, as Set this goal always did
export const coachNumbers = (band: string) => { const b = bandOf(band)!; const g = goalsForBand(b); return { kcal: g.calories, protein: g.protein }; };
