// What went through Mealan on a day. Information, never a verdict: a day with one card is a day with one card logged.
import { aggregate, type Feedback } from "./pilot";
export const sameDay = (iso: string, day: Date) => new Date(iso).toDateString() === day.toDateString();
export const daysAgo = (n: number, from = new Date()) => { const d = new Date(from); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d; };
export type DayLog = { day: Date; logged: Feedback[]; prepared: Feedback[]; kcal: number; protein: number; dayType: string | null };
export function dayLog(feedback: Feedback[], day: Date): DayLog {
  const onDay = feedback.filter((f) => sameDay(f.createdAt, day));
  const logged = onDay.filter((f) => f.status === "eaten").sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  const prepared = onDay.filter((f) => f.status === "prepared");
  const totals = logged.reduce((t, f) => { const a = aggregate(f.meal.items); return { kcal: t.kcal + (a.calories ?? 0), protein: t.protein + (a.protein ?? 0) }; }, { kcal: 0, protein: 0 });
  const dayType = (onDay.find((f) => (f as any).dayType) as any)?.dayType ?? null;
  return { day, logged, prepared, kcal: totals.kcal, protein: totals.protein, dayType };
}
// "2 meals logged, 1,210 kcal and 84 g protein so far": a count and the numbers, nothing about targets
export function loggedLine(log: DayLog, today: boolean): string {
  const n = log.logged.length;
  if (n === 0) return today ? "Nothing logged yet today." : "Nothing logged.";
  const meals = `${n} ${n === 1 ? "meal" : "meals"} logged`;
  return `${meals}, ${Math.round(log.kcal).toLocaleString("en")} kcal and ${Math.round(log.protein)} g protein${today ? " so far" : ""}.`;
}
export const dayLabel = (day: Date, now = new Date()) => {
  const diff = Math.round((daysAgo(0, now).getTime() - daysAgo(0, day).getTime()) / 86_400_000);
  return diff === 0 ? "Today" : diff === 1 ? "Yesterday" : day.toLocaleDateString("en", { weekday: "long" });
};
