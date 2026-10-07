import { macroSplit } from "./personal";
// The goal a person sets once. A band from the goal bands (G1 to G6), or their own calories and protein.
export type Band = { id: string; name: string; range: string; kcal: [number, number]; protein: [number, number]; who: string; points: string[]; popular?: boolean };
// Five goals, locked 6 October 2026; explained as approved on the canvas (board G1). Recomposition first: what most people want.
export const BANDS: Band[] = [
  { id: "recomp",      name: "Recomposition", range: "PD 5.5 to 7",   kcal: [2000, 2600], protein: [115, 175], who: "lose fat and build muscle at the same time", popular: true,
    points: ["Lose fat and build muscle at the same time.", "Your weight stays about the same; your shape changes.", "A little less food than you burn, about 10 % less.", "Works with regular strength training, at least twice a week."] },
  { id: "fatloss",     name: "Lose fat",      range: "PD 6.5 to 9",   kcal: [1500, 2000], protein: [110, 160], who: "your weight goes down",
    points: ["Your weight goes down, about 0.5 to 1 % a week.", "Less food than you burn, about 20 % less.", "Protein at the top of your range, to keep your muscle."] },
  { id: "maintain",    name: "Maintain",      range: "PD 4 to 5.5",   kcal: [1900, 2500], protein: [80, 130],  who: "your weight and your strength stay where they are",
    points: ["Your weight stays where it is.", "With training, you can still get stronger.", "As much food as you burn."] },
  { id: "gain",        name: "Build muscle",  range: "PD 3.5 to 4.5", kcal: [2800, 3400], protein: [120, 150], who: "your weight goes up slowly, mostly as muscle",
    points: ["More food than you burn, mostly as carbs for training.", "With training, most of the gain is muscle."] },
  { id: "performance", name: "Performance",   range: "PD 2.5 to 4",   kcal: [3000, 3600], protein: [100, 130], who: "enough food for heavy training or endurance sport",
    points: ["For heavy training or endurance sport.", "Enough food to train well and recover, with more of it from carbs."] },
];
// Build muscle has a pace (7 October 2026, canvas boards K0 and K1). Faster is the band "gain", as before; Steady is its
// own band underneath, so every number, the coach's goal and the goal log keep working with one id. It is not a sixth
// card: it shows inside Build muscle. Rates: Aragon's muscle gain by training age; Iraki et al. 2019 for the surplus.
export type Pace = "steady" | "faster";
export const STEADY: Band = { id: "gainsteady", name: "Build muscle", range: "PD 4 to 5", kcal: [2300, 2900], protein: [110, 150], who: "steady progress in strength; your weight goes up slowly",
  points: ["More food than you burn, about 5 % more.", "Your lifts go up first; your weight follows slowly."] };
export const ALL_BANDS: Band[] = [...BANDS, STEADY];
export const PACES: { id: Pace; band: string; name: string; hint: string }[] = [
  { id: "steady", band: "gainsteady", name: "Steady", hint: "about 5 % more food · weight up 0.25–1 % a month, by how long you've trained · for someone who has trained a while and wants to get stronger" },
  { id: "faster", band: "gain", name: "Faster", hint: "about 10 % more food · weight up 0.25–0.5 % a week · for someone with muscle to catch up on" },
];
export const isBuild = (id?: string) => id === "gain" || id === "gainsteady";
export const paceOf = (id?: string): Pace | null => (id === "gainsteady" ? "steady" : id === "gain" ? "faster" : null);
// the goal's name with its pace: "Build muscle · Steady"
export const goalLabel = (id?: string) => { const b = bandOf(id); if (!b) return ""; const pc = paceOf(b.id); return pc ? `${b.name} · ${pc === "steady" ? "Steady" : "Faster"}` : b.name; };
export type TrainingAge = "u1" | "1to3" | "3p";
export const TRAINING_AGES: { id: TrainingAge; name: string }[] = [{ id: "u1", name: "Under 1 year" }, { id: "1to3", name: "1–3 years" }, { id: "3p", name: "Over 3 years" }];
// the starting pace: the longer you've trained, the slower muscle comes
export const paceForAge = (a: TrainingAge): Pace => (a === "u1" ? "faster" : "steady");

// goals that were folded in: Stay strong is Maintain, High energy is Performance
export const BAND_MOVED: Record<string, string> = { longevity: "maintain", energy: "performance" };
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
export const getGoal = (): Goal | null => {
  try {
    const r = localStorage.getItem(KEY); if (!r) return null;
    const g = JSON.parse(r) as Goal;
    if (g.band && BAND_MOVED[g.band]) { g.band = BAND_MOVED[g.band]; localStorage.setItem(KEY, JSON.stringify(g)); }
    return g;
  } catch { return null; }
};
export const saveGoal = (g: Goal) => { try { localStorage.setItem(KEY, JSON.stringify(g)); } catch {} };
export const clearGoal = () => { try { localStorage.removeItem(KEY); } catch {} };
export const bandOf = (id?: string) => ALL_BANDS.find((b) => b.id === (id && BAND_MOVED[id] ? BAND_MOVED[id] : id));
// The middle of the band's range as the working numbers; exact numbers can be set on Me later.
export const goalsForBand = (b: Band) => { const calories = mid(b.kcal), protein = mid(b.protein); return { calories, protein, ...macroSplit(calories, protein) }; };
// How a food's PD sits against the target, five bands, every edge a multiple of the target so they move with the goal:
// below under 0.6 T, close 0.6 to 0.9 T, on plan 0.9 to 1.5 T, high 1.5 to 2.5 T, high+ from 2.5 T. A bit under counts as on plan.
export type PdBand = "below" | "close" | "plan" | "high" | "top";
export const BAND_EDGES = { close: 0.6, plan: 0.9, high: 1.5, top: 2.5 } as const;
export const BAND_LABEL: Record<PdBand, string> = { below: "Low−", close: "Low", plan: "On plan", high: "High", top: "High+" };
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

// The line under the chips: one line, the band's range for this target. Pairing is Mix it's job, not the chip's.
export const BAND_LINE_IDLE = "Tap a chip to see its PD range.";
export function bandHint(b: PdBand, t: number | null): string {
  if (!t) return BAND_LINE_IDLE;
  return `${BAND_LABEL[b]}: PD ${bandRange(b, t)} · your target ${t.toFixed(1)}`;
}
