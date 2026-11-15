// DT302 (0.3.150, board Stories224; Coach Milan 14 November 17:29 to 19:25, Go 15 November 19:22): the days on a Clients card,
// one picture in every phase. A normal week is one row, Monday to Sunday; the first two weeks are two rows of seven, from the
// client's first day. Green: the day went as meant. Amber: worth a look. Outline: today. Grey: still to come. A dot under a
// bar is a weigh-in. Weekend days are shaded by their real date, wherever they fall in a row. The key line under the rows
// names only what shows, and says what green and amber mean in that phase.
export type DayCell = { date: string; state: "good" | "look" | "today" | "none"; weighed: boolean; weekend: boolean };
export type DayKey = "good" | "look" | "today" | "dot" | "weekend";
const weekendOf = (date: string) => { const d = new Date(`${date}T12:00:00`).getDay(); return d === 0 || d === 6; };
// a normal week: lived by the plan is good; a past day planned and not lived is worth a look
export function weekCells(days: { key: string; today: boolean; past: boolean; lived: boolean; planned: boolean }[], weighed: string[]): DayCell[] {
  return days.map((x) => ({ date: x.key, state: x.today ? "today" : x.lived ? "good" : x.past && x.planned ? "look" : "none", weighed: weighed.includes(x.key), weekend: weekendOf(x.key) }));
}
// the first two weeks: a full day is good; a day gone by and not fully logged is worth a look
export function phaseCells(squares: { date: string; state: "full" | "part" | "today" | "todo"; weighed: boolean }[]): DayCell[] {
  return squares.map((s) => ({ date: s.date, state: s.state === "full" ? "good" : s.state === "part" ? "look" : s.state === "today" ? "today" : "none", weighed: s.weighed, weekend: weekendOf(s.date) }));
}
export const rowsOf = (cells: DayCell[]): DayCell[][] => { const out: DayCell[][] = []; for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7)); return out; };
// what the key line names, in this order, only what shows
export function keysOf(cells: DayCell[]): DayKey[] {
  const k: DayKey[] = [];
  if (cells.some((c) => c.state === "good")) k.push("good");
  if (cells.some((c) => c.state === "look")) k.push("look");
  if (cells.some((c) => c.state === "today")) k.push("today");
  if (cells.some((c) => c.weighed)) k.push("dot");
  if (cells.some((c) => c.weekend)) k.push("weekend");
  return k;
}
