// Units (0.2.18, canvas board UN, Milan 17 October 2026, 09:33). The account always keeps kg, cm and °C; these turn
// them into the units the person chose, for the screen only, so switching back loses nothing. Food amounts stay in
// grams and energy in kcal: every label in our markets prints per 100 g, and the plate and PD work in grams.
// Recipe measures (cups, spoons, ounces, sticks) are turned into grams here too, by code, never by the model.

export type Units = { temp: "c" | "f"; weight: "kg" | "lb"; height: "cm" | "ftin" };
export const METRIC: Units = { temp: "c", weight: "kg", height: "cm" };
const cleanUnits = (u: unknown): Units => {
  const x = (u && typeof u === "object" ? u : {}) as Partial<Units>;
  return { temp: x.temp === "f" ? "f" : "c", weight: x.weight === "lb" ? "lb" : "kg", height: x.height === "ftin" ? "ftin" : "cm" };
};
let U: Units = (() => { try { return cleanUnits(JSON.parse(localStorage.getItem("chefmealan-personal") || "{}").units); } catch { return METRIC; } })();
export const setUnits = (u: unknown) => { U = cleanUnits(u); };
export const units = () => U;
export { cleanUnits };

// ---- body weight ----
export const LB = 0.45359237;
export const kgToLb = (kg: number) => kg / LB;
export const lbToKg = (lb: number) => lb * LB;
export const wUnit = () => U.weight;
// the number shown for a weight in kg, in the chosen unit
export const wIn = (kg: number) => (U.weight === "lb" ? kgToLb(kg) : kg);
// what the person typed, back to kg for the account (to 10 g, so 209.4 lb shows as 209.4 lb again)
export const wFrom = (v: number) => (U.weight === "lb" ? Math.round(lbToKg(v) * 100) / 100 : v);
// "95.0 kg" or "209.4 lb"; d decimals
export const wText = (kg: number, d = 1) => `${wIn(kg).toFixed(d)} ${U.weight}`;
// a change: +0.4 kg, −0.9 lb, ±0.0 kg
export const wDelta = (kg: number) => { const x = wIn(kg); return `${x > 0 ? "+" : x < 0 ? "−" : "±"}${Math.abs(x).toFixed(1)} ${U.weight}`; };

// ---- height ----
// to the nearest inch: 182 cm is 6 ft 0 in
export const ftIn = (cm: number) => { const t = Math.round(cm / 2.54); return { ft: Math.floor(t / 12), inch: t % 12 }; };
export const cmOf = (ft: number, inch: number) => Math.round((ft * 12 + inch) * 2.54 * 10) / 10;
export const hText = (cm: number) => { if (U.height === "cm") return `${Math.round(cm)} cm`; const h = ftIn(cm); return `${h.ft} ft ${h.inch} in`; };
// 6 ft 0 in, 6'0, 6 0, 5ft11, 6 ft: back to cm; null when it can't be a height
export function parseFtIn(raw: string): number | null {
  const m = String(raw).trim().toLowerCase().match(/^(\d)\s*(?:ft|feet|foot|'|’|\s)?\s*(?:(\d{1,2}(?:[.,]\d)?)\s*(?:in|inch|inches|"|”|''|’’)?)?$/);
  if (!m) return null;
  const ft = Number(m[1]), inch = m[2] ? Number(m[2].replace(",", ".")) : 0;
  if (ft < 3 || ft > 8 || inch >= 12) return null;
  return cmOf(ft, inch);
}

// ---- temperature ----
export const cToF = (c: number) => (c * 9) / 5 + 32;
export const fToC = (f: number) => ((f - 32) * 5) / 9;
// oven heat is rounded the way dials step: °C to the nearest 5, °F to the nearest 25 (180 °C is 350 °F, 350 °F is 175 °C);
// below an oven's range (a pan, a core temperature) to the degree
export const asC = (f: number) => { const c = fToC(f); return c >= 100 ? Math.round(c / 5) * 5 : Math.round(c); };
export const asF = (c: number) => { const f = cToF(c); return c >= 100 ? Math.round(f / 25) * 25 : Math.round(f); };
const TEMP = /(\d{2,3})(?:\s*(?:°|º|˚|degrees?|deg\.?)\s*|\s*)(c|f|celsius|fahrenheit)\b/gi;
// every temperature in a text in one unit; a text that already gives both (180 °C / 350 °F) is left as it is
export function tempsIn(text: string, to: "c" | "f" = U.temp): string {
  // a degree mark or the word, or an oven number (350F); never "2 c", which is two cups
  const isTemp = (all: string, n: string, u: string) => /[°º˚]|deg/i.test(all) || /celsius|fahrenheit/i.test(u) || Number(n) >= 100;
  const found = [...String(text).matchAll(TEMP)].filter((m) => isTemp(m[0], m[1], m[2]));
  if (!found.length) return text;
  const kinds = new Set(found.map((m) => m[2][0].toLowerCase()));
  if (kinds.size > 1) return text;
  return String(text).replace(TEMP, (all, n: string, u: string) => {
    if (!isTemp(all, n, u)) return all;
    const from = u[0].toLowerCase(), v = Number(n);
    const out = from === to ? v : to === "c" ? asC(v) : asF(v);
    return `${out} °${to.toUpperCase()}`;
  });
}

// what code converted in a recipe's own text: ["350 °F is 175 °C"], so the steps can say so
export function fNotes(text: string): string[] {
  const out: string[] = [];
  for (const m of String(text).matchAll(TEMP)) {
    const isT = /[°º˚]|deg/i.test(m[0]) || /celsius|fahrenheit/i.test(m[2]) || Number(m[1]) >= 100;
    if (isT && m[2][0].toLowerCase() === "f") out.push(`${m[1]} °F is ${asC(Number(m[1]))} °C`);
  }
  return out;
}

// ---- recipe measures, turned into grams by code ----
// grams in one millilitre, per food kind; the first that matches the name wins, so peanut butter is not butter
const KINDS: [RegExp, number][] = [
  [/peanut butter|almond butter|nut butter|cashew butter|tahini/i, 1.08],
  [/buttermilk/i, 1.03],
  [/almond flour|ground almonds|almond meal|coconut flour/i, 0.42],
  [/protein powder|whey|casein/i, 0.4],
  [/cocoa/i, 0.36],
  [/\boats?\b|oatmeal|rolled oats/i, 0.38],
  [/flour|starch/i, 0.53],
  [/brown sugar/i, 0.93],
  [/powdered sugar|icing sugar|confectioners/i, 0.5],
  [/sugar|sweetener|erythritol/i, 0.84],
  [/butter|margarine|ghee/i, 0.96],
  [/\boil\b/i, 0.92],
  [/honey|syrup|molasses/i, 1.42],
  [/yog(h)?urt|skyr|quark|sour cream|cottage cheese|ricotta|cream cheese/i, 1.04],
  [/chocolate chips|choc chips|chocolate chunks/i, 0.72],
  [/parmesan|grated cheese|shredded cheese|cheddar|mozzarella/i, 0.45],
  [/\brice\b|quinoa|lentils/i, 0.8],
  [/almonds|walnuts|pecans|cashews|hazelnuts|peanuts|\bnuts\b/i, 0.6],
  [/baking soda|bicarbonate/i, 0.92],
  [/baking powder/i, 0.8],
  [/\bsalt\b/i, 1.2],
  [/cinnamon|paprika|cumin|turmeric|curry powder|chili powder|chilli powder|oregano|garlic powder|onion powder|vanilla/i, 0.53],
  [/milk|water|stock|broth|juice|cream|wine|vinegar|soy sauce|coffee|egg whites?/i, 1.0],
];
const ML: [RegExp, number][] = [
  [/^(cups?|c)$/i, 240], [/^(tablespoons?|tbsps?|tbs|tbl)$/i, 15], [/^(teaspoons?|tsps?)$/i, 5],
  [/^(fl\.? ?oz|fluid ounces?)$/i, 29.57], [/^(ml|millilitres?|milliliters?)$/i, 1], [/^(dl|decilitres?|deciliters?)$/i, 100], [/^(l|litres?|liters?)$/i, 1000],
];
const FRAC: Record<string, number> = { "½": 0.5, "⅓": 1 / 3, "⅔": 2 / 3, "¼": 0.25, "¾": 0.75, "⅛": 0.125 };
// 1, 1.5, 1,5, 1/2, 1 1/2, 1½, ½; a range (2-3) is its middle
function amountOf(s: string): { n: number; rest: string } | null {
  const t = s.trim().replace(/([\d])([½⅓⅔¼¾⅛])/g, "$1 $2");
  const one = String.raw`(?:\d+\s+\d+\/\d+|\d+\/\d+|\d+\s+[½⅓⅔¼¾⅛]|[½⅓⅔¼¾⅛]|\d+(?:[.,]\d+)?)`;
  const m = t.match(new RegExp(`^(${one})(?:\\s*(?:-|–|to)\\s*(${one}))?\\s*(.*)$`, "i"));
  if (!m) return null;
  const val = (x: string) => x.trim().split(/\s+/).reduce((n, p) => n + (FRAC[p] ?? (p.includes("/") ? Number(p.split("/")[0]) / Number(p.split("/")[1]) : Number(p.replace(",", ".")))), 0);
  const a = val(m[1]), b = m[2] ? val(m[2]) : a;
  const n = (a + b) / 2;
  return Number.isFinite(n) && n > 0 ? { n, rest: m[3] } : null;
}
// Grams for "1/2 cup", "2 tbsp", "8 oz", "1 lb", "1 stick", "250 ml" of a named food; null when the measure isn't one
// we know or the food has no kind in the table (then the model's grams stay, marked converted)
export function gramsFromMeasure(written: string, name: string): number | null {
  const a = amountOf(String(written).toLowerCase());
  if (!a) return null;
  const unit = (a.rest.match(/^(fl\.? ?oz|fluid ounces?|[a-z]+\.?)/i)?.[1] ?? "").replace(/\.$/, "");
  let g: number | null = null;
  if (/^(oz|ounces?)$/i.test(unit)) g = a.n * 28.35;
  else if (/^(lbs?|pounds?)$/i.test(unit)) g = a.n * 453.6;
  else if (/^sticks?$/i.test(unit) && /butter|margarine/i.test(name)) g = a.n * 113;
  else {
    const ml = ML.find(([re]) => re.test(unit))?.[1];
    if (!ml) return null;
    const kind = KINDS.find(([re]) => re.test(name))?.[1];
    if (!kind) return null;
    g = a.n * ml * kind;
  }
  return g > 0 && g < 10000 ? Math.round(g * 10) / 10 : null;
}
