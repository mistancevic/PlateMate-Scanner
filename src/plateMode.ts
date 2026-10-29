// DT149 (0.2.130, board Stories101 version 2; Tester 3, UX4; Coach Milan 29 October 00:14): "The past is recording what I
// ate. The future is planning what I will eat. In the moment is what I eat." The day of a plate decides what it is for.
// A meal on a day before today, or earlier today and long gone, adds what you ate: no Fit, no steps, no rating. A meal on a
// day after today, or later today, is planning: put it in the plan, no Make and no Feedback. Around a meal's time today it is
// the moment: Craft, Make, Feedback, as always. A plate with no meal of a day is the moment.
export type PlateWhen = "now" | "plan" | "past";
const ymdOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const minOf = (t: string) => { const [h, m] = t.split(":").map(Number); return (h || 0) * 60 + (m || 0); };
// an hour before a meal it is the moment; an hour and a half after, it is past
export const BEFORE = 60, AFTER = 90;
export function plateWhenOf(f: { date: string; time: string; mode?: "plan" | "eat" } | null | undefined, now = new Date()): PlateWhen {
  if (!f || f.mode === "eat") return "now";
  const today = ymdOf(now);
  if (f.date < today) return "past";
  if (f.date > today) return "plan";
  const t = minOf(f.time), n = now.getHours() * 60 + now.getMinutes();
  return t - n > BEFORE ? "plan" : n - t > AFTER ? "past" : "now";
}
// Friday's dinner, yesterday's lunch, today's breakfast, tomorrow's snack
export function mealOfDay(date: string, meal: string, now = new Date()): string {
  const today = ymdOf(now), d = new Date(`${date}T12:00:00`), y = new Date(now); y.setDate(now.getDate() - 1); const t = new Date(now); t.setDate(now.getDate() + 1);
  const day = date === today ? "today" : date === ymdOf(y) ? "yesterday" : date === ymdOf(t) ? "tomorrow" : d.toLocaleDateString("en-GB", { weekday: "long" });
  return `${day}'s ${meal.toLowerCase()}`;
}
export const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
// the moment a meal of a past day is counted at: that day, at the meal's time
export const atMeal = (date: string, time: string) => new Date(`${date}T${time || "12:00"}:00`).toISOString();
