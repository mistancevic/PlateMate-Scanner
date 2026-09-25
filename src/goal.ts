// The goal a person sets once. A band from the goal bands (G1 to G6), or their own calories and protein.
export type Band = { id: string; name: string; range: string; pd: number; who: string };
export const BANDS: Band[] = [
  { id: "fatloss",     name: "Lose fat",        range: "PD 6.5 to 9",   pd: 7.5, who: "keep the muscle, lose the rest" },
  { id: "recomp",      name: "Recomposition",   range: "PD 5.5 to 7",   pd: 6.0, who: "build muscle, less fat, training regularly" },
  { id: "longevity",   name: "Stay strong",     range: "PD 5 to 6.5",   pd: 5.5, who: "keep muscle and function for the long run" },
  { id: "maintain",    name: "Maintain",        range: "PD 4 to 5.5",   pd: 4.8, who: "keep where you are, feel good" },
  { id: "gain",        name: "Build muscle",    range: "PD 3.5 to 4.5", pd: 4.0, who: "eating in a surplus, lifting heavy" },
  { id: "energy",      name: "High energy",     range: "PD 2.5 to 4",   pd: 3.2, who: "endurance, hard training days, growing athletes" },
];
const KEY = "chefmealan-goal";
export type Goal = { band?: string; setBy: "you" | "coach"; setAt: string };
export const getGoal = (): Goal | null => { try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : null; } catch { return null; } };
export const saveGoal = (g: Goal) => { try { localStorage.setItem(KEY, JSON.stringify(g)); } catch {} };
export const bandOf = (id?: string) => BANDS.find((b) => b.id === id);
// A representative daily pair that lands on the band's PD, so the rest of the app keeps working on calories and protein.
export const goalsForBand = (b: Band) => ({ calories: 2000, protein: Math.round(b.pd * 20) });
// How a food's PD sits against the target: fits, close, or below.
export const fit = (pd: number | null, target: number | null): "high" | "mid" | "low" =>
  pd === null || target === null ? "mid" : pd >= target ? "high" : pd >= target - 2 ? "mid" : "low";
