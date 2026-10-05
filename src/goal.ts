import { macroSplit } from "./personal";
// The goal a person sets once. A band from the goal bands (G1 to G6), or their own calories and protein.
export type Band = { id: string; name: string; range: string; kcal: [number, number]; protein: [number, number]; who: string };
export const BANDS: Band[] = [
  { id: "fatloss",   name: "Lose fat",      range: "PD 6.5 to 9",   kcal: [1500, 2000], protein: [110, 160], who: "keep the muscle, lose the rest" },
  { id: "recomp",    name: "Recomposition", range: "PD 5.5 to 7",   kcal: [2000, 2600], protein: [115, 175], who: "build muscle, less fat, training regularly" },
  { id: "longevity", name: "Stay strong",   range: "PD 5 to 6.5",   kcal: [1600, 2000], protein: [85, 120],  who: "keep muscle and function for the long run" },
  { id: "maintain",  name: "Maintain",      range: "PD 4 to 5.5",   kcal: [1900, 2500], protein: [80, 130],  who: "keep where you are, feel good" },
  { id: "gain",      name: "Build muscle",  range: "PD 3.5 to 4.5", kcal: [2800, 3400], protein: [120, 150], who: "eating in a surplus, lifting heavy" },
  { id: "energy",    name: "High energy",   range: "PD 2.5 to 4",   kcal: [3000, 3600], protein: [100, 130], who: "endurance, hard training days, growing athletes" },
];
const mid = (r: [number, number]) => Math.round((r[0] + r[1]) / 2);
const KEY = "chefmealan-goal";
export type GoalSource = "quick" | "profile" | "exact" | "coach";
export type Goal = { band?: string; setBy: "you" | "coach"; setAt: string; coachName?: string; source?: GoalSource; method?: string };
// Every change of the daily target, oldest first. Small, synced with the account.
export type GoalEntry = { at: string; band?: string; kcal: number | null; protein: number | null; source: GoalSource; method?: string; weightKg?: number };
const LKEY = "chefmealan-goal-log";
export const getGoalLog = (): GoalEntry[] => { try { return JSON.parse(localStorage.getItem(LKEY) || "[]"); } catch { return []; } };
export const setGoalLog = (l: GoalEntry[]) => { try { localStorage.setItem(LKEY, JSON.stringify(l.slice(-60))); } catch {} };
export const SOURCE_LABEL: Record<GoalSource, string> = { quick: "A rough goal, the band's middle", profile: "Worked out from your profile", exact: "Your own numbers", coach: "Set by your coach" };
export const getGoal = (): Goal | null => { try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : null; } catch { return null; } };
export const saveGoal = (g: Goal) => { try { localStorage.setItem(KEY, JSON.stringify(g)); } catch {} };
export const clearGoal = () => { try { localStorage.removeItem(KEY); } catch {} };
export const bandOf = (id?: string) => BANDS.find((b) => b.id === id);
// The middle of the band's range as the working numbers; exact numbers can be set on Me later.
export const goalsForBand = (b: Band) => { const calories = mid(b.kcal), protein = mid(b.protein); return { calories, protein, ...macroSplit(calories, protein) }; };
// How a food's PD sits against the target, five bands, every edge a multiple of the target so they move with the goal:
// below under 0.6 T, close 0.6 to 0.9 T, on plan 0.9 to 1.5 T, high 1.5 to 2.5 T, high+ from 2.5 T. A bit under counts as on plan.
export type PdBand = "below" | "close" | "plan" | "high" | "top";
export const BAND_EDGES = { close: 0.6, plan: 0.9, high: 1.5, top: 2.5 } as const;
export const BAND_LABEL: Record<PdBand, string> = { below: "Below", close: "Close", plan: "On plan", high: "High", top: "High+" };
export const fit = (pd: number | null, target: number | null): PdBand => {
  if (pd === null || target === null || target <= 0) return "plan";
  const r = pd / target;
  return r < BAND_EDGES.close ? "below" : r < BAND_EDGES.plan ? "close" : r < BAND_EDGES.high ? "plan" : r < BAND_EDGES.top ? "high" : "top";
};
// the range a band covers for a target, for the chip's title
export const bandRange = (b: PdBand, t: number) => {
  const f = (x: number) => (Math.round(x * 10) / 10).toFixed(1);
  return b === "below" ? `under ${f(t * 0.6)}` : b === "close" ? `${f(t * 0.6)} to ${f(t * 0.9)}` : b === "plan" ? `${f(t * 0.9)} to ${f(t * 1.5)}` : b === "high" ? `${f(t * 1.5)} to ${f(t * 2.5)}` : `${f(t * 2.5)} and up`;
};
