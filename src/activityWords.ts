// DT340 (0.3.182, board Stories282): the words for a client's activity on the coach's screens. Last active on the card: today
// 11:40, yesterday 20:15, or 5 days ago, Saturday. Quiet for 3 days in Waiting for you, with the day she last opened the app.
import { w, dateText } from "./words";
import type { Activity } from "./activity";
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export function lastActiveText(a: Activity | null | undefined, now = new Date()): string {
  if (!a?.lastActiveAt) return "";
  const at = new Date(a.lastActiveAt); if (Number.isNaN(at.getTime())) return "";
  const days = Math.round((Date.parse(`${ymd(now)}T12:00:00`) - Date.parse(`${ymd(at)}T12:00:00`)) / 864e5);
  const time = at.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const when = days <= 0 ? w("clientweek.activeToday", { time }) : days === 1 ? w("clientweek.activeYesterday", { time })
    : w("clientweek.activeDaysAgo", { n: days, day: dateText(at, { weekday: "long" }) });
  return w("clientweek.lastActive", { when });
}
export const quietWhen = (a: Activity) => w("coach.waitQuietWhen", { date: dateText(new Date(a.lastOpenAt!), { weekday: "long", day: "numeric", month: "long" }) });
