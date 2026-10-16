// What the person said about a meal that isn't logged today (0.2.12, canvas board MS, MS2): I had it, or I skipped it.
// Kept on this phone for the day only, and used only for the size of the meals still to come.
const KEY = "chefmealan-unlogged";
type Store = { date: string; answers: Record<string, "had" | "skipped"> };
export function answersFor(date: string): Record<string, "had" | "skipped"> {
  try { const s = JSON.parse(localStorage.getItem(KEY) || "null") as Store | null; return s && s.date === date ? s.answers : {}; } catch { return {}; }
}
export function setAnswer(date: string, slotId: string, a: "had" | "skipped" | null) {
  try {
    const answers = { ...answersFor(date) };
    if (a) answers[slotId] = a; else delete answers[slotId];
    localStorage.setItem(KEY, JSON.stringify({ date, answers }));
  } catch { /* storage off: the question comes again */ }
}
