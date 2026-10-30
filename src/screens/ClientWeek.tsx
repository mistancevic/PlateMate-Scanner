import { BurnCard, Squares } from "../components/Measured";
import { fmtKg } from "../weight";
import { wIn, wText } from "../units";
import { shortDate } from "../measured";
import { useState, type ReactNode } from "react";
import type { ClientRow } from "../cloud";
import { wordsOf, type DayLine, type SlotMark } from "../dayLines";
import { DAY_NAMES, type CoachNote } from "../coachNotes";
import { BANDS, PACES, bandOf, goalLabel, goalsForBand, isBuild } from "../goal";
import { isoWeek, ymd } from "../plan";
import { pdRange, pdVal } from "../ui";
import { density } from "../pilot";
import { trendOf, VERDICT_WORDS, avg7 } from "../weight";
import { ProfileChanges, SharedProfileCard, newProfileChanges } from "./SummaryPanel";

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
const longDay = (k: string) => new Date(`${k}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }).replace(",", "");
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
const livedText = (n: number) => `${n} ${n === 1 ? "day" : "days"} lived by the plan`;
// the week as seven bars: green lived by the plan, amber changed, open today, grey to come or nothing planned
export function WeekBars({ row }: { row: ClientRow }) {
  const w = weekOf(row);
  return (
    <div className="cw-bars-row">
      <span className="cw-bars" aria-label="This week, a bar a day">
        {w.days.map((x) => {
          const tone = x.today ? "open" : x.line?.lived ? "lived" : x.past && x.line?.planned ? "changed" : "none";
          return <i key={x.key} title={DAY_NAMES[x.i]} className={`cw-bar ${tone}`} />;
        })}
      </span>
      <small className={w.lived ? "cw-lived" : "cw-muted"}>{livedText(w.lived)}</small>
    </div>
  );
}
const weekNo = (row: ClientRow) => { const at = row.goal?.setAt ? Date.parse(row.goal.setAt) : NaN; return Number.isFinite(at) ? Math.floor((Date.now() - at) / (7 * DAY)) + 1 : null; };
// in the first two weeks (0.2.7, board FT, FT6): the day of 14, counted from the start the client's phone sent
export const phaseDay = (row: ClientRow) => { const m = row.measured; if (!m?.phase || !m.start) return null; const d = Math.floor((Date.parse(`${ymd(new Date())}T12:00:00`) - Date.parse(`${m.start}T12:00:00`)) / DAY) + 1; return d >= 1 && d <= 28 ? d : null; };
export function clientLine(row: ClientRow, today: boolean) {
  const wk = weekNo(row), pd = phaseDay(row);
  return [row.goal?.band ? goalLabel(row.goal.band) : "No goal yet", pd ? (pd <= 14 ? `first two weeks, day ${pd} of 14` : `day ${pd}, not measured yet`) : wk ? `week ${wk}` : null, today ? "check-in today" : `check-in ${DAY_NAMES[row.checkinDay]}`].filter(Boolean).join(" · ");
}
export function ClientRowCard({ row, today, open }: { row: ClientRow; today: boolean; open: () => void }) {
  return (
    <button className={`card client-row cw-row ${today ? "cw-today" : ""}`} onClick={open}>
      <div className="client-head"><span className="avatar">{row.name.slice(0, 1).toUpperCase()}</span><div><b>{first(row.name)}</b><small>{clientLine(row, today)}</small>{newProfileChanges(row) > 0 && <small className="profile-new">Profile: {newProfileChanges(row)} {newProfileChanges(row) === 1 ? "change" : "changes"} since you looked</small>}</div></div>
      {phaseDay(row) && row.measured ? (
        <div style={{ width: "100%" }}>
          <Squares m={row.measured} ends={false} />
          <small className="ft-rowfoot">{row.measured.fullDays} full {row.measured.fullDays === 1 ? "day" : "days"} · {row.measured.squares.filter((x) => x.weighed).length} weigh-ins · {row.measured.readyOn ? `ready ${shortDate(row.measured.readyOn).slice(4)}` : "not ready yet"}</small>
        </div>
      ) : <WeekBars row={row} />}
    </button>
  );
}

const TONE: Record<string, string> = { lived: "cw-green", plan: "cw-green", changed: "cw-amber", today: "cw-grey", none: "cw-grey" };
const MARK: Record<SlotMark, [string, string]> = { plan: ["By the plan", "cw-green"], swapped: ["Swapped", "cw-amber"], skipped: ["Skipped on purpose", "cw-ink"], missed: ["Not eaten", "cw-amber"], open: ["Still to come", "cw-grey"] };
const kcalText = (n: number) => `${Math.round(n).toLocaleString("en")} kcal`;

export function ClientPage({ row, coachName, ops, back, notify, setError, tail }: { row: ClientRow; coachName: string; ops: CoachOps; back: () => void; notify: (m: string) => void; setError: (m: string) => void; tail: ReactNode }) {
  const name = first(row.name);
  const [offset, setOffset] = useState(0);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const w = weekOf(row, offset);
  const g = row.goal?.band ? bandOf(row.goal.band) : null;
  const kcalNow = row.goalsNow?.calories ?? null, proteinNow = row.goalsNow?.protein ?? null;
  const wk = weekNo(row);
  const span = `${w.monday.getDate()}${w.monday.getMonth() === w.sunday.getMonth() ? "" : ` ${MONTHS[w.monday.getMonth()]}`} to ${w.sunday.getDate()} ${MONTHS[w.sunday.getMonth()]}`;
  // the note (CW4)
  const [verdict, setVerdict] = useState<"approved" | "change">("approved");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const send = async () => {
    setSending(true);
    try {
      const note: CoachNote = { at: new Date().toISOString(), by: "coach", name: coachName, week: ymd(w.monday), verdict, text: text.trim() };
      await ops.sendNote(row, [...row.notes, note]); setText(""); notify(`Sent. ${name} sees it on Today.`);
    } catch (e: any) { setError(e.message || "The note didn't send. Try again."); } finally { setSending(false); }
  };
  // a new goal from a date (CW8)
  const [band, setBand] = useState<string>("");
  const todayKey = ymd(new Date());
  const dayFrom = (n: number) => ymd(addDays(new Date(), n));
  const tomorrow = dayFrom(1);
  const nextMonday = (() => { const n = (8 - new Date().getDay()) % 7 || 7; const k = dayFrom(n); return k === tomorrow ? dayFrom(n + 7) : k; })();
  const [from, setFrom] = useState(todayKey);
  const [picking, setPicking] = useState(false);
  const fromName = from === todayKey ? "today" : from === tomorrow ? "tomorrow" : longDay(from);
  const applyGoal = async () => {
    try { await ops.setGoal(row, band, from); notify(from === todayKey ? `${name}'s goal is now ${goalLabel(band)}.` : `${goalLabel(band)} starts for ${name} on ${longDay(from)}.`); setBand(""); }
    catch (e: any) { setError(e.message || "The goal didn't save. Try again."); }
  };
  // weigh-ins and DaaM good in the week
  const inWeek = (date: string) => date >= ymd(w.monday) && date <= ymd(w.sunday);
  const weighs = (row.weighIns ?? []).filter((x: any) => inWeek(x.date)).sort((a: any, b: any) => (a.date < b.date ? -1 : 1));
  const trend = row.goal?.band && row.weightKg ? trendOf(row.weighIns, row.goal.band, row.weightKg, row.trainingAge) : null;
  const a7 = avg7(row.weighIns);
  const daam = row.feedback.filter((f: any) => f.taste === "DaaM good" && inWeek(ymd(new Date(f.createdAt))));
  const day = openDay ? w.days.find((x) => x.key === openDay)?.line ?? null : null;
  const futureDays = w.days.filter((x) => !x.past && !x.today);
  const notesShown = [...row.notes].reverse();
  return (
    <div className="client-page">
      <div className="menu-head cw-back"><button className="link" onClick={back}>‹ Clients</button><span /></div>
      <section className="card person cw-person"><span className="avatar">{row.name.slice(0, 1).toUpperCase()}</span>
        <div><b>{name}</b><small>{[g ? goalLabel(g.id) : "No goal yet", kcalNow ? `${kcalNow.toLocaleString("en")} kcal` : null, proteinNow ? `${proteinNow} g protein` : null, wk ? `week ${wk}` : null].filter(Boolean).join(" · ")}</small><small>Check-in: {DAY_NAMES[row.checkinDay]}</small></div>
      </section>
      {/* DT167 (0.3.9, board Stories119 version 2): the check-in starts with what changed in the shared profile */}
      <ProfileChanges uid={row.uid} sp={row.profileShare} />

      <section className="card cw-week" aria-label={`${name}'s week`}>
        <div className="cw-week-nav"><button type="button" className="week-arrow" aria-label="Week before" onClick={() => setOffset(offset - 1)}>‹</button><b>Week {w.week}, {span}</b><button type="button" className="week-arrow" aria-label="Week after" disabled={offset >= 0} onClick={() => setOffset(offset + 1)}>›</button></div>
        <div className="cw-week-head"><b>Planned against eaten</b><small className={w.lived ? "cw-lived" : "cw-muted"}>{livedText(w.lived)}</small></div>
        {w.days.filter((x) => x.past || x.today).map((x) => {
          const l = x.line;
          const words = l ? wordsOf(l) : { status: "Nothing planned or eaten", tone: "none" as const, detail: "" };
          const pd = l && l.kcal ? density(l.protein, l.kcal) : null;
          return (
            <button type="button" key={x.key} className="cw-day" disabled={!l} onClick={() => setOpenDay(x.key)} aria-label={`${DAY_NAMES[x.i]}: ${words.status}`}>
              <small className="cw-day-name">{SHORT[x.i]}</small>
              <span className="cw-day-mid"><b className={TONE[words.tone]}>{l?.lived ? "✓ " : ""}{words.status}</b>{words.detail && <small>{words.detail}</small>}</span>
              <span className="cw-day-num">{pd !== null && <b className={words.tone === "changed" ? "cw-amber" : words.tone === "today" || words.tone === "none" ? "" : "cw-green"}>{pdVal(pd)}</b>}{l && l.kcal > 0 && <small>{kcalText(l.kcal)}</small>}</span>
            </button>
          );
        })}
        {futureDays.length > 0 && <small className="cw-week-foot">{futureDays.some((x) => x.line?.planned) ? futureDays.filter((x) => x.line?.planned).map((x) => `${DAY_NAMES[x.i]}: ${x.line!.planned} planned`).join(" · ") : `${futureDays.map((x) => DAY_NAMES[x.i]).join(", ")}: nothing planned yet.`}</small>}
        {w.days.every((x) => !x.line) && <small className="cw-week-foot">Nothing from {name} this week yet. The week fills in when {name} opens Chef Mealan.</small>}
      </section>

      {day && (
        <div className="sheet-backdrop" onClick={() => setOpenDay(null)}>
          <div className="sheet cw-day-sheet" role="dialog" aria-label={longDay(day.date)} onClick={(e) => e.stopPropagation()}>
            <div className="card-top"><span>{longDay(day.date).replace(/^(\w+) /, "$1, ")}</span><button className="link" onClick={() => setOpenDay(null)}>Close</button></div>
            <div className="past-nums"><span><b>{Math.round(day.kcal).toLocaleString("en")}</b><small>{day.target ? `of ${day.target.kcal.toLocaleString("en")} kcal` : "kcal"}</small></span><span><b>{day.protein}</b><small>{day.target ? `of ${day.target.protein} g protein` : "g protein"}</small></span><span><b>{day.kcal ? pdVal(density(day.protein, day.kcal)) : "–"}</b><small>PD that day</small></span></div>
            {day.slots.map((s) => {
              const [word, cls] = MARK[s.mark];
              const shared = s.eaten ? row.feedback.find((f: any) => f.notes && f.meal?.title === s.eaten && ymd(new Date(f.createdAt)) === day.date) : null;
              return (
                <div className="cw-slot" key={s.name}>
                  <small className="cw-slot-time">{s.time}</small>
                  <span><small>{s.name} · planned: {s.planned ?? "nothing"}</small><b>{s.eaten ?? s.planned ?? "–"}</b><small className={cls}>{word}{s.mark === "plan" || s.mark === "swapped" ? ` · ${kcalText(s.kcal)} · ${s.protein} g protein` : ""}</small>{shared && <small className="cw-shared">Shared with you: “{shared.notes}”</small>}</span>
                </div>
              );
            })}
            {day.extras.length > 0 && <small className="cw-extras">{day.extras.length === 1 ? "1 extra" : `${day.extras.length} extras`}: {day.extras.map((x) => `${x.title.toLowerCase()}, ${kcalText(x.kcal)}`).join("; ")}.</small>}
            {day.extras.map((x) => { const f = row.feedback.find((c: any) => c.notes && c.meal?.title === x.title && ymd(new Date(c.createdAt)) === day.date); return f ? <small className="cw-extras cw-shared" key={x.title}>Shared with you, {x.title.toLowerCase()}: “{f.notes}”</small> : null; })}
          </div>
        </div>
      )}

      {!row.flags.some((f) => f.situation === "eating") && (
        <section className="card cw-mini">
          <div><small>Weigh-ins</small><small>{weighs.length} this week</small></div>
          {weighs.length ? <b>{weighs.length > 1 ? `${wIn(weighs[0].kg).toFixed(1)} → ${wText(weighs[weighs.length - 1].kg)}` : wText(weighs[0].kg)}{a7 ? ` · 7-day average ${wIn(a7).toFixed(1)}` : ""}</b> : <b>No weigh-ins this week</b>}
          {trend && <small className="cw-mini-line">{trend.verdict === "too few" ? "Not enough weigh-ins yet for a trend." : `${VERDICT_WORDS[trend.verdict]} for ${goalLabel(row.goal.band)}: ${fmtKg(trend.change!)} in 3 weeks.`}</small>}
        </section>
      )}
      {/* the measured burn, as the client sees it (0.2.7, board FT, FT7) */}
      {row.measured && !row.flags.some((f) => f.situation === "eating") && <BurnCard m={row.measured} formulaKcal={row.measured.formulaKcal} name={name} />}
      <section className="card cw-mini">
        <div><small>DaaM good this week</small><small>{daam.length} {daam.length === 1 ? "meal" : "meals"}</small></div>
        <small className="cw-mini-strong">{daam.length ? daam.map((f: any) => f.meal?.title).join(" · ") : `None shared this week. ${name} marks a meal DaaM good on its card.`}</small>
      </section>

      <section className="card cw-note">
        <b>Your note for {DAY_NAMES[row.checkinDay]}</b>
        <div className="chip-row"><button type="button" className={`choice ${verdict === "approved" ? "on" : ""}`} aria-pressed={verdict === "approved"} onClick={() => setVerdict("approved")}>Approve the week</button><button type="button" className={`choice ${verdict === "change" ? "on" : ""}`} aria-pressed={verdict === "change"} onClick={() => setVerdict("change")}>Change the numbers</button></div>
        <textarea rows={3} aria-label="Your note" value={text} onChange={(e) => setText(e.target.value)} placeholder={`One line for ${name}`} />
        <button className="pill pill-primary pill-wide" disabled={sending || !text.trim()} onClick={send}>Send the note</button>
        <small className="setting-hint">{name} sees it on Today, once, and keeps it in My coach.</small>
      </section>
      <section className="card seg cw-checkin">
        <div className="setting"><small className="setting-name">Check-in day</small>
          <div className="chip-row" role="group" aria-label="Check-in day">{SHORT.map((d, i) => <button type="button" key={d} className={`choice ${row.checkinDay === i ? "on" : ""}`} aria-pressed={row.checkinDay === i} onClick={() => ops.setCheckin(row, i).then(() => notify(`${name}'s check-in: ${DAY_NAMES[i]}.`)).catch((e) => setError(e.message))}>{d}</button>)}</div>
          <small className="setting-hint">{name}'s week shows in Check-ins today on this day. Friday unless you change it.</small>
        </div>
      </section>
      {notesShown.length > 0 && (
        <>
          <p className="label">Notes</p>
          <section className="card days">{notesShown.slice(0, 12).map((n) => (
            <div className="history-row" key={n.at}><div><b>{new Date(n.at).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }).replace(",", "")}</b><small>{n.by === "client" ? `${name} replied` : n.verdict === "change" ? "Asked to change the numbers" : "Approved the week"}{n.by === "coach" && n.readAt ? " · read" : ""}</small></div><div className="history-num"><small>“{n.text}”</small></div></div>
          ))}</section>
        </>
      )}

      <p className="label">{name}'s goal</p>
      <section className="card you-card"><span><b>{g ? goalLabel(g.id) : "No goal yet"}</b><small>{[row.goal?.setAt ? `Since ${new Date(row.goal.setAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}` : null, row.goal?.setBy === "coach" ? "set by you" : row.goal ? `set by ${name}` : null, kcalNow ? `${kcalNow.toLocaleString("en")} kcal` : null, proteinNow ? `${proteinNow} g protein` : null].filter(Boolean).join(" · ")}</small>{row.nextGoal && <small className="cw-next">Next: {goalLabel(row.nextGoal.band)}, from {longDay(row.nextGoal.from)}{row.nextGoal.setBy === "coach" ? ", set by you" : ""}</small>}</span></section>
      <section className="card cw-goal">
        <b>A new goal for {name}</b>
        <div className="bands compact">{BANDS.map((b) => {
          const on = band === b.id || (b.id === "gain" && isBuild(band));
          return <button key={b.id} type="button" className={`band-card ${on ? "on" : ""}`} aria-pressed={on} onClick={() => setBand(b.id === "gain" ? (isBuild(band) ? band : "gainsteady") : b.id)}><b>{on ? "✓ " : ""}{b.name}</b><span>{pdRange(b.range)} · {b.kcal[0].toLocaleString("en")} to {b.kcal[1].toLocaleString("en")} kcal · {b.protein[0]} to {b.protein[1]} g</span></button>;
        })}</div>
        {isBuild(band) && <div className="chip-row" role="group" aria-label="Pace">{PACES.map((x) => <button key={x.id} type="button" className={`choice ${band === x.band ? "on" : ""}`} aria-pressed={band === x.band} onClick={() => setBand(x.band)}>{x.name}</button>)}</div>}
        <div className="apply-from" role="group" aria-label="Apply from">
          <small className="setting-name">Apply from</small>
          <div className="chip-row">
            {[[todayKey, "Today"], [tomorrow, "Tomorrow"], [nextMonday, longDay(nextMonday)]].map(([k, l]) => <button type="button" key={k} className={`choice ${from === k && !picking ? "on" : ""}`} aria-pressed={from === k && !picking} onClick={() => { setPicking(false); setFrom(k); }}>{l}</button>)}
            <button type="button" className={`choice ${picking ? "on" : ""}`} aria-pressed={picking} onClick={() => setPicking(true)}>Pick a date</button>
          </div>
          {picking && <input type="date" aria-label="Start date" min={tomorrow} value={from > todayKey ? from : ""} onChange={(e) => e.target.value && e.target.value > todayKey && setFrom(e.target.value)} />}
          <small className="setting-hint">{name}'s days before then keep the goal they had.</small>
        </div>
        <button className="pill pill-primary pill-wide" disabled={!band} onClick={applyGoal}>Apply from {fromName}</button>
      </section>
      <SharedProfileCard name={name} sp={row.profileShare} />
      {tail}
    </div>
  );
}
// the numbers a coach's goal starts with: the band's middle, as Set this goal always did
export const coachNumbers = (band: string) => { const b = bandOf(band)!; const g = goalsForBand(b); return { kcal: g.calories, protein: g.protein }; };
