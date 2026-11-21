// B151 (0.3.171, board B151; Coach Milan 21 November, Go 11:26): the pencil sets the meal, the day and the time, and asks
// nothing. The clock on the phone decides. A meal whose time is now or earlier, today or on a past day, is logging: the
// plate counts in that meal. A meal still ahead, today or on a coming day, is a plan: nothing counts yet. A snack has no
// time of its own, so it counts as now. There is no window around now: now and the past do the same thing.
// The rule is pure, so the unit tests and the walkthroughs read the same one. It is asked when you set the meal or change
// its time, never by the clock moving on its own: a plan stays a plan until Today asks about it.
export type LiveStatus = "eaten" | "planned";
const minOf = (t: string) => { const [h, m] = t.split(":").map(Number); return (h || 0) * 60 + (m || 0); };
export const minutesOf = (d: Date) => d.getHours() * 60 + d.getMinutes();
export function liveStatus(set: { date: string; time: string | null } | null, today: string, nowMinutes: number): LiveStatus | null {
  if (!set) return null;
  if (set.date < today) return "eaten";
  if (set.date > today) return "planned";
  return !set.time || minOf(set.time) <= nowMinutes ? "eaten" : "planned";
}
// where a plate stands in the plan while it is planned from the pencil: the slot, and what the slot held before, so No meal
// selected can take the plate out again; add: the plate is one more dish next to what was there
// had: how many dishes were already eaten in that meal when the plate was planned; one more since then means Today's
// question was answered, so the plate is no longer the plan's
export type PlannedAt = { date: string; slotId: string; was: import("./planned").PlannedMeal | null; add?: true; had: number };
