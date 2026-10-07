// About your goal (canvas boards K2 and K3, approved 7 October 2026): one page per goal, and the goal sheet the person
// and the coach agree on. The chat reads the same page, so Chef Mealan and the coach say the same thing.
// Sources: Iraki et al. 2019 (surplus, weekly rate, protein per meal); Aragon (muscle gain by training age);
// Helms et al. 2014 (protein when losing fat); ISSN 2017 (protein range).
import { bandOf, goalLabel, type Goal, type TrainingAge } from "./goal";

export type Guide = { happens: string; training: string; food: string; watch: string; mistakes: string; switchWhen: string };
export const GUIDE_PARTS: { key: keyof Guide; name: string }[] = [
  { key: "happens", name: "What happens" }, { key: "training", name: "Training" }, { key: "food", name: "Food" },
  { key: "watch", name: "What to watch" }, { key: "mistakes", name: "Common mistakes" }, { key: "switchWhen", name: "When to switch" },
];
const PROTEIN = "Protein the same every day, 1.6–2.2 g per kg. Spread it over 3 to 6 meals, about 0.4–0.55 g per kg each.";
export const GUIDES: Record<string, Guide> = {
  recomp: {
    happens: "You eat a little less than you burn, about 10 % less. Your weight stays about the same while your waist goes down and your lifts go up. It works best if you're new to lifting, coming back after a break, or carry some extra fat. The first changes show after 6–8 weeks.",
    training: "Strength training at least 2 to 3 times a week, a little heavier or a rep more over time. Steps help; long cardio is optional.",
    food: PROTEIN,
    watch: "Your waist once a week, your strength log, your 7-day average weight. The scale alone says little here.",
    mistakes: "Judging by the scale. Cutting too hard and losing strength. Skipping strength training.",
    switchWhen: "Weight and waist both going up: back to Maintain. Lifts stuck for 6 weeks while your waist goes down: talk to your coach about Build muscle, Steady.",
  },
  fatloss: {
    happens: "You eat about 20 % less than you burn. Your weight goes down about 0.5–1 % a week. The first week drops more: that's water. Plan 8 to 16 weeks, then a break at maintenance.",
    training: "Keep lifting heavy, so your body keeps its muscle; fewer sets is fine. More steps burn more than you'd think; cardio is a tool, not a must.",
    food: "Protein at the top of your range, the same every day. Plenty of vegetables and fibre to stay full. The calories you cut come from fat and carbs, never from protein.",
    watch: "Your 7-day average weight, your waist, and whether your lifts hold. Hunger, sleep and energy too.",
    mistakes: "Cutting too fast and losing muscle. Dropping strength training for cardio. Weekends that undo the week.",
    switchWhen: "After 12 to 16 weeks, or when sleep and energy suffer: 2 to 4 weeks at Maintain, then decide with your coach.",
  },
  maintain: {
    happens: "You eat as much as you burn. Your weight stays within 1–2 kg. With training, you can still get stronger.",
    training: "Whatever you enjoy and keep doing. Two strength sessions a week keep muscle and bones strong.",
    food: "Protein in your range every day. The rest by appetite and your plan.",
    watch: "Your 7-day average weight staying in its range. Your waist once a month.",
    mistakes: "Treating maintenance as no plan: weight creeps up a kilo or two a year without anyone noticing.",
    switchWhen: "Weight drifting more than 2 kg for a month: talk to your coach. Ready for something new: pick it on Me › Goal.",
  },
  gainsteady: {
    happens: "You eat a little more than you burn, about 5 % more. Your lifts go up first; the scale moves slowly. The first clear changes show after 6–8 weeks.",
    training: "Lifting is the main thing: 3 to 5 sessions a week, a little heavier or a rep more over time. Cardio stays for your health, not to burn the extra food.",
    food: `${PROTEIN} More carbs on training days.`,
    watch: "Your strength log, your 7-day average weight, your waist once a week. Photos every 4 weeks if you like them.",
    mistakes: "Eating far more “to grow” and gaining mostly fat. Judging by one morning's weight. Changing the plan every week.",
    switchWhen: "Waist going up faster than your lifts: back to Maintain for a few weeks. Weight not moving for 6 weeks and lifts stuck: talk to your coach about Faster.",
  },
  gain: {
    happens: "You eat about 10 % more than you burn. Your weight goes up about 0.25–0.5 % a week, most of it muscle if you train well. Best when you're new to lifting or have muscle to catch up on.",
    training: "Lifting 3 to 5 times a week, more sets over time, a little heavier every week or two. Keep cardio short, so it doesn't use up the extra food.",
    food: `${PROTEIN} More carbs around training.`,
    watch: "Your 7-day average weight, your waist once a week, your strength log.",
    mistakes: "Gaining faster than 0.5 % a week: that's mostly fat. Eating too little on rest days. Skipping meals when appetite is low.",
    switchWhen: "Waist going up fast: slow down to Steady. After 1 to 3 years of steady gains, Steady fits better.",
  },
  performance: {
    happens: "You eat enough to train well and recover, with more of it from carbs. Your weight stays stable.",
    training: "Your sport comes first. Strength training supports it, 1 to 3 times a week.",
    food: "More carbs on hard days and before long sessions. Protein the same every day. Carbs and protein together after hard training.",
    watch: "How training feels, recovery, sleep, and your weight staying stable.",
    mistakes: "Training hard on too little food. Low carbs before long or hard sessions.",
    switchWhen: "Off-season or less training: back to Maintain.",
  },
};
export const guideOf = (id?: string): Guide | null => (id ? GUIDES[id] ?? null : null);

// The goal sheet: what to expect, in the person's own kilos where the weight is known.
const kg = (w: number | undefined, pctLo: number, pctHi: number) => {
  if (!w) return `${pctLo}–${pctHi} % of your weight`;
  // to 0.05 kg under half a kilo, to 0.1 kg above: 0.25–0.5 kg, 0.5–1 kg
  const f = (pct: number) => { const v = (w * pct) / 100; const r = v < 0.5 ? Math.round(v * 20) / 20 : Math.round(v * 10) / 10; return String(Number(r.toFixed(2))); };
  return `${f(pctLo)}–${f(pctHi)} kg`;
};
export type Sheet = { title: string; byLine: string; food: string; weight: string; counted: string; progress: string; checkIn: string };
const FOOD: Record<string, string> = { fatloss: "about 20 % less than you burn", recomp: "about 10 % less than you burn", maintain: "as much as you burn", gainsteady: "about 5 % more than you burn", gain: "about 10 % more than you burn", performance: "about 5 % more, more of it carbs" };
const PROGRESS: Record<string, string> = { fatloss: "weight and waist down, lifts holding", recomp: "waist down, lifts up, weight about the same", maintain: "weight in its range", gainsteady: "heavier lifts, waist about the same", gain: "weight up at the pace, lifts up, waist rising slowly", performance: "training going well, weight stable" };
export function weightToExpect(id: string, weightKg?: number, age?: TrainingAge): string {
  if (id === "fatloss") return `down ${kg(weightKg, 0.5, 1)} a week`;
  if (id === "gain") return `up ${kg(weightKg, 0.25, 0.5)} a week`;
  if (id === "gainsteady") return age === "3p" ? `up ${kg(weightKg, 0.25, 0.5)} a month` : `up ${kg(weightKg, 0.5, 1)} a month`;
  if (id === "recomp") return "about the same; your waist goes down";
  if (id === "maintain") return "within 1–2 kg";
  return "stable";
}
const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
// every 4 weeks from the day the goal was set: the next one from today
export function nextCheckIn(setAt: string | undefined, now = new Date()): Date {
  const start = setAt ? new Date(setAt) : now;
  const n = new Date(start); n.setDate(n.getDate() + 28);
  while (n.getTime() < now.getTime() - 864e5 / 2) n.setDate(n.getDate() + 28);
  return n;
}
export function sheetOf(goal: Goal | null, opts: { weightKg?: number; trainingAge?: TrainingAge; approvedBy?: string; approvedAt?: string; coachLabel?: string; now?: Date }): Sheet | null {
  const b = goal?.band ? bandOf(goal.band) : null;
  if (!b) return null;
  const byLine = opts.approvedBy && opts.approvedAt ? `Agreed with ${opts.approvedBy} on ${day(opts.approvedAt)}`
    : goal!.setBy === "coach" ? `Set by ${goal!.coachName ? `Coach ${goal!.coachName.split(" ")[0]}` : opts.coachLabel ?? "your coach"} on ${day(goal!.setAt)}`
    : `Set by you on ${day(goal!.setAt)}`;
  return {
    title: goalLabel(b.id), byLine, food: FOOD[b.id] ?? "", weight: weightToExpect(b.id, opts.weightKg, opts.trainingAge),
    counted: "your 7-day average, not one morning", progress: PROGRESS[b.id] ?? "", checkIn: `${day(nextCheckIn(goal!.setAt, opts.now).toISOString())}, every 4 weeks`,
  };
}
// what the chat gets: the goal, what to expect and the food part of its page
export function guideForChat(id?: string): { goal: string; food: string; watch: string } | null {
  const g = guideOf(id); if (!g) return null;
  return { goal: goalLabel(id), food: g.food, watch: g.watch };
}
