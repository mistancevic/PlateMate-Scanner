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
export type Goal = { band?: string; setBy: "you" | "coach"; setAt: string };
export const getGoal = (): Goal | null => { try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : null; } catch { return null; } };
export const saveGoal = (g: Goal) => { try { localStorage.setItem(KEY, JSON.stringify(g)); } catch {} };
export const bandOf = (id?: string) => BANDS.find((b) => b.id === id);
// The middle of the band's range as the working numbers; exact numbers can be set on Me later.
export const goalsForBand = (b: Band) => ({ calories: mid(b.kcal), protein: mid(b.protein) });
// How a food's PD sits against the target: fits, close, or below.
export const fit = (pd: number | null, target: number | null): "high" | "mid" | "low" =>
  pd === null || target === null ? "mid" : pd >= target ? "high" : pd >= target - 2 ? "mid" : "low";
