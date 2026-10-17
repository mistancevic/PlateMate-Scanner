// Counted foods (0.2.24, canvas board CT, CT1 to CT5; Milan 17 October 2026, 16:20 to 16:34). Nobody measures an egg in grams:
// whole eggs and bananas are counted, by size, with the size and the grams small under the count. The grams stay the truth
// for the numbers; code works out the count from them and the size. The size belongs to the food on that recipe or plate
// (recipes use different sizes); it comes from the recipe ("2 large eggs" is L), and is M when none is named.
// Eggs: the EU grades weigh the egg in its shell (Regulation 589/2008, art. 4: S under 53 g, M 53 to 63, L 63 to 73, XL 73
// and up); the shell is 11% of the weight (Illinois Extension), so from the middle of each grade, without the shell:
// S 43, M 52, L 61, XL 68 g. Bananas, peeled (USDA SR28): XS 81, S 101, M 118, L 136, XL 152 g.
// Egg whites, yolks and bottled liquid egg stay in grams.
export type CountKind = "egg" | "banana";
export type Size = "XS" | "S" | "M" | "L" | "XL";
export type Count = { kind: CountKind; size: Size; weighed?: boolean };
export const KINDS: Record<CountKind, { one: string; many: string; sizes: Partial<Record<Size, number>>; note: string }> = {
  egg: { one: "egg", many: "eggs", sizes: { S: 43, M: 52, L: 61, XL: 68 }, note: "" },
  banana: { one: "banana", many: "bananas", sizes: { XS: 81, S: 101, M: 118, L: 136, XL: 152 }, note: "peeled" },
};
export const sizesOf = (k: CountKind) => Object.entries(KINDS[k].sizes) as [Size, number][];
export const gramsOfOne = (c: Count) => KINDS[c.kind].sizes[c.size] ?? KINDS[c.kind].sizes.M!;

// which foods are counted, by their name
export function kindOf(name: string): CountKind | null {
  const n = String(name).toLowerCase();
  if (/\beggs?\b/.test(n) && !/white|yolk|liquid|powder|noodle|pasta|replac|substitut|vegan|plant|chocolate|easter|nog|plant/.test(n)) return "egg";
  if (/\bbananas?\b/.test(n) && !/chip|dried|bread|flour|powder|pur[eé]e|cake|muffin|pancake|smoothie|split|milk|yog/.test(n)) return "banana";
  return null;
}
// the size a recipe names: "2 large eggs" is L; none named, M
export function sizeFrom(written: string, kind: CountKind): Size {
  const w = String(written).toLowerCase();
  const s: Size = /extra[ -]?small|\bxs\b/.test(w) ? "XS" : /extra[ -]?large|jumbo|\bxl\b/.test(w) ? "XL" : /\blarge\b|\bl\b|\bbig\b/.test(w) ? "L" : /\bmedium\b|\bm\b/.test(w) ? "M" : /\bsmall\b|\bs\b/.test(w) ? "S" : "M";
  return KINDS[kind].sizes[s] ? s : s === "XS" ? "S" : "M";
}
const UNI: Record<string, number> = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3 };
// how many the recipe names: "2 large", "1 1/2", "½", "3-4" (the first), none: null
export function countFrom(written: string): number | null {
  const w = String(written).trim();
  let m: RegExpMatchArray | null, n: number | null = null;
  if ((m = w.match(/^(\d+)\s+(\d+)\/(\d+)/))) n = Number(m[1]) + Number(m[2]) / Number(m[3]);
  else if ((m = w.match(/^(\d+)\/(\d+)/))) n = Number(m[1]) / Number(m[2]);
  else if ((m = w.match(/^(\d+(?:[.,]\d+)?)\s*([½¼¾⅓⅔])?/))) n = Number(m[1].replace(",", ".")) + (m[2] ? UNI[m[2]] : 0);
  else if ((m = w.match(/^([½¼¾⅓⅔])/))) n = UNI[m[1]];
  return n !== null && Number.isFinite(n) && n > 0 && n < 100 ? n : null;
}
// a size that fits the grams best, for a food counted before it had a size (a recipe kept before 0.2.24): M unless
// another size makes a clearly whole count
export function guessSize(kind: CountKind, grams: number): Size {
  const err = (g: number) => { const n = grams / g, r = Math.round(n); return r < 1 ? 1 : Math.abs(n - r) / r; };
  const m = err(KINDS[kind].sizes.M!);
  let best: Size = "M", be = m;
  for (const [s, g] of sizesOf(kind)) { const e = err(g); if (e < be - 0.05) { best = s; be = e; } }
  return best;
}
// the food on a plate or recipe as a count: its own, or worked out from its name (the size from the grams)
export function countOf(i: { food: { name: string }; grams: number; count?: Count }): Count | null {
  const k = kindOf(i.food.name);
  // a count stays with its food: a swap to another food drops it
  if (i.count && KINDS[i.count.kind] && i.count.kind === k) return i.count;
  return k ? { kind: k, size: guessSize(k, i.grams) } : null;
}
export const howMany = (c: Count, grams: number) => grams / gramsOfOne(c);
// a number as people count: whole, a common fraction, or one decimal
const FRAC: [number, string][] = [[1 / 8, "⅛"], [1 / 6, "⅙"], [1 / 5, "⅕"], [1 / 4, "¼"], [1 / 3, "⅓"], [2 / 5, "⅖"], [1 / 2, "½"], [3 / 5, "⅗"], [2 / 3, "⅔"], [3 / 4, "¾"], [4 / 5, "⅘"]];
export function countWord(n: number): string {
  if (!(n > 0)) return "0";
  const whole = Math.floor(n + 0.02), rest = n - whole;
  if (Math.abs(rest) < 0.02) return String(whole);
  const f = FRAC.find(([v]) => Math.abs(rest - v) < 0.015);
  if (f) return `${whole || ""}${f[1]}`;
  return (Math.round(n * 10) / 10).toString();
}
// what the plate and the recipe say: the count large, the size and the grams small
export function countLabel(c: Count, grams: number): { main: string; small: string } {
  const k = KINDS[c.kind];
  const n = c.weighed ? Math.max(1, Math.round(howMany(c, grams))) : howMany(c, grams);
  const word = countWord(n);
  const many = word !== "1" && !(n < 1);
  return { main: `${word} ${many ? k.many : k.one}`, small: `${c.size} · ${Math.round(grams)} g${k.note ? ` ${k.note}` : ""}${c.weighed ? ", weighed" : ""}` };
}
// one more or one less: whole ones; a share (¼ egg) goes to the whole one above or below
export const stepCount = (c: Count, grams: number, by: 1 | -1) => {
  const n = howMany(c, grams);
  const next = by > 0 ? Math.floor(n + 1e-6) + 1 : Math.max(0, Math.ceil(n - 1e-6) - 1);
  return Math.round(next * gramsOfOne(c));
};
// a new size keeps the count; weighed grams keep the grams and take the nearest size
export const resize = (c: Count, grams: number, size: Size) => ({ count: { kind: c.kind, size } as Count, grams: Math.round(howMany({ ...c, weighed: false }, grams) * gramsOfOne({ ...c, size })) });
export function weighed(c: Count, grams: number): Count {
  let best: Size = c.size, d = Infinity;
  for (const [s, g] of sizesOf(c.kind)) if (Math.abs(g - grams) < d) { d = Math.abs(g - grams); best = s; }
  return { kind: c.kind, size: best, weighed: true };
}
// the step's words: "2 eggs (L)"
export const countInStep = (c: Count, grams: number) => `${countLabel(c, grams).main} (${c.size})`;
// a read ingredient: counted with the recipe's size; the grams are the count times the size (code, not the model)
export function countRead(name: string, written: string, grams: number): { count: Count; grams: number } | null {
  const k = kindOf(name);
  if (!k) return null;
  const size = sizeFrom(written, k);
  const n = countFrom(written);
  // "3 tbsp beaten egg" or "100 g banana": a measure, not a count; the grams stay, the size is a guide
  if (n === null || /\b(g|gr|gram|grams|kg|ml|cup|cups|tbsp|tsp|tablespoons?|teaspoons?|oz|ounces?)\b/i.test(written)) return { count: { kind: k, size: n === null ? guessSize(k, grams) : size }, grams };
  return { count: { kind: k, size }, grams: Math.round(n * KINDS[k].sizes[size]!) };
}
