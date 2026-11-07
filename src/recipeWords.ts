// DT243 part two (Coach Milan's work item, approved): words the app saves into a recipe in English stay saved as they are;
// the screen shows each in the app's language. A word not here is the cook's own (or the recipe's), and shows as it is.
import { w, wn, wIn, wnIn, type Val, type WordKey } from "./words";

// what a recipe makes: the app saves "portions" when nothing is typed or read; a recipe read by Chef Mealan may say servings
// or pieces. Shown through a count line; any other unit is the recipe's own word, and single() makes its one form as before.
const UNITS: Record<string, WordKey> = { portions: "recipe.unit.portions", servings: "recipe.unit.servings", pieces: "recipe.unit.pieces" };
// the one forms the screens made of a recipe's own unit, each as it was: sarmas → sarma, cookies → cookie, glass stays glass
export const ONE = {
  s: (u: string) => u.replace(/s$/, ""),
  notSs: (u: string) => u.replace(/(?<!s)s$/, ""),
  ies: (u: string) => u.replace(/ies$/, "y").replace(/(?<!s)s$/, ""),
  afterNotS: (u: string) => u.replace(/(?<=[^s])s$/, ""),
};
export const unitWord =(unit: string, n: number, single: (u: string) => string = (u) => u): string => {
  const k = UNITS[unit];
  return k ? wn(k, n) : n === 1 ? single(unit) : unit;
};
// the same as a value for a slot of another line, in that line's language (the cook's own unit is the same in every language)
export const unitV = (unit: string, n: number, single: (u: string) => string = (u) => u): Val => (l) => {
  const k = UNITS[unit];
  return k ? wnIn(l, k, n) : n === 1 ? single(unit) : unit;
};

// a read recipe's foods without a group go into this part (saved as this word)
export const OTHER_PART = "Other";
// the parts the app names itself: Other (a read recipe's foods without a group), Main and Sweet finish (a plate that is Both)
const PARTS: Record<string, WordKey> = { Other: "recipe.part.other", Main: "recipe.part.main", "Sweet finish": "recipe.part.sweetFinish" };
export const partName = (part: string): string => { const k = PARTS[part]; return k ? w(k) : part; };
// as a value for a slot of another line, in that line's language, in small letters (The filling, The other)
export const partLowV = (part: string): Val => (l) => { const k = PARTS[part]; const t = k ? wIn(l, k) : part; return t === null ? null : t.toLowerCase(); };
