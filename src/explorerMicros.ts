// DT158 (0.3.2, canvas Page 2, board Stories110; Coach Milan 29 October 16:16 to 17:42): Explorer, Not all micros are equal,
// the same template as Protein, Fats and Carbs, with one change: against the day, not the meal, because vitamins and minerals
// count per day. Micronutrients are the family; its members the vitamins, fat-soluble and water-soluble, and the minerals.
//
// Sources (read 29 October 2026). Vitamins and minerals per 100 g: USDA FoodData Central, the row in `src`, read on
// getfoodfacts.com with its FDC id (SR Legacy; milk is the Foundation row; salmon the cooked SR row, the raw page wouldn't open).
// Reference intakes on labels (NRV): Regulation (EU) No 1169/2011, Annex XIII, Part A, point 1, read in the Irish food
// authority's copy and the legislation.gov.uk copy. A significant amount, which a "source of" claim needs: 15 % of the NRV per
// 100 g, or 7.5 % per 100 ml for beverages (Annex XIII, Part A, point 2); "high in" is twice that (Regulation (EC) No 1924/2006,
// Annex, as the European Commission lists it). Vitamin D 15 µg for adults: EFSA, adequate intake (EFSA Journal 2016;14(10):4547).
//
// DT159 (0.3.2, board Stories111; Milan 17:58 to 18:02): a member's own page, Vitamin D and Vitamin C first. EU health claims:
// Regulation (EU) No 432/2012, Annex (vitamin C rows from the legislation.gov.uk copy; vitamin D rows from a copy of OJ L 136,
// 25.5.2012). EFSA: vitamin D upper limit 100 µg (EFSA Journal 2023;21(8):8145); vitamin C 110 mg for men and 95 mg for women,
// population reference intake (EFSA Journal 2013;11(11):3418), no upper limit ("no adequate data to derive a UL"). D3 and D2:
// Tripkovic 2012, Am J Clin Nutr. Vitamin K: Kuang 2020, Food Funct; Witham 2020, J Am Soc Nephrol. Vitamin C and iron over
// months: Nyakundi 2026, Am J Clin Nutr. Abstracts read through PubMed. One row per food across both pages: the red pepper and
// the milk are the same rows as on the Micros cards.

export type MicroId = "a" | "d" | "e" | "k" | "c" | "b12" | "fol" | "ca" | "fe" | "mg" | "k_" | "zn";
export type MicroGroup = "fat" | "water" | "min";
export const MICRO_GROUPS: { id: MicroGroup; name: string }[] = [{ id: "fat", name: "Vitamins, fat-soluble" }, { id: "water", name: "Vitamins, water-soluble" }, { id: "min", name: "Minerals" }];
export const MICRO_MEMBERS: { id: MicroId; name: string; unit: "µg" | "mg"; group: MicroGroup }[] = [
  { id: "a", name: "Vitamin A", unit: "µg", group: "fat" }, { id: "d", name: "Vitamin D", unit: "µg", group: "fat" }, { id: "e", name: "Vitamin E", unit: "mg", group: "fat" }, { id: "k", name: "Vitamin K", unit: "µg", group: "fat" },
  { id: "c", name: "Vitamin C", unit: "mg", group: "water" }, { id: "b12", name: "Vitamin B12", unit: "µg", group: "water" }, { id: "fol", name: "Folate", unit: "µg", group: "water" },
  { id: "ca", name: "Calcium", unit: "mg", group: "min" }, { id: "fe", name: "Iron", unit: "mg", group: "min" }, { id: "mg", name: "Magnesium", unit: "mg", group: "min" }, { id: "k_", name: "Potassium", unit: "mg", group: "min" }, { id: "zn", name: "Zinc", unit: "mg", group: "min" },
];
// Regulation (EU) No 1169/2011, Annex XIII, Part A (folate as folic acid)
export const NRV: Record<MicroId, number> = { a: 800, d: 5, e: 12, k: 75, c: 80, b12: 2.5, fol: 200, ca: 800, fe: 14, mg: 375, k_: 2000, zn: 10 };
export const EFSA_D = 15;          // µg a day, adults
export const TOP_SHARE = 33;       // For your day: the members this portion brings at least a third of the day of
export const MICRO_SCALE = 1.5;    // the bars run to 150 % of the day, the line at the whole day

export type MicroFood = {
  id: string; icon: string; name: string; kcal: number; protein: number; portion: { label: string; grams: number }; drink?: boolean;
  v: Record<MicroId, number | null>; src: string; best: string; pair: string;   // per 100 g; null where the row doesn't report it
};

export const MICRO_FOODS: MicroFood[] = [
  { id: "salmon", icon: "🐟", name: "Salmon", kcal: 206, protein: 22.1, portion: { label: "150 g, cooked", grams: 150 }, src: "USDA SR Legacy, FDC 175168, salmon, Atlantic, farmed, cooked, dry heat",
    v: { a: 69, d: 13.1, e: 1.14, k: 0.1, c: 3.7, b12: 2.8, fol: 34, ca: 15, fe: 0.34, mg: 30, k_: 384, zn: 0.43 },
    best: "Twice a week: one of the few foods with real vitamin D, and more than a day of B12.", pair: "Potatoes or rice, and greens." },
  { id: "egg", icon: "🥚", name: "Egg", kcal: 143, protein: 12.6, portion: { label: "2 eggs, 100 g", grams: 100 }, src: "USDA SR Legacy, FDC 171287, egg, whole, raw",
    v: { a: 160, d: 2.0, e: 1.05, k: 0.3, c: 0, b12: 0.89, fol: 47, ca: 56, fe: 1.75, mg: 12, k_: 138, zn: 1.29 },
    best: "A little of almost everything: B12, vitamin A and D, folate. The yolk carries them.", pair: "Spinach or peppers: the vitamin C and K eggs lack." },
  { id: "spinach", icon: "🥬", name: "Spinach, raw", kcal: 23, protein: 2.86, portion: { label: "A big handful, 60 g", grams: 60 }, src: "USDA SR Legacy, FDC 168462, spinach, raw",
    v: { a: 469, d: 0, e: 2.03, k: 483, c: 28.1, b12: 0, fol: 194, ca: 99, fe: 2.71, mg: 79, k_: 558, zn: 0.53 },
    best: "Vitamin K for days, folate and vitamin A, for almost no energy. Some fat in the meal helps take up A and K.", pair: "Eggs, salmon or a little olive oil." },
  { id: "lentils", icon: "🫘", name: "Lentils, boiled", kcal: 116, protein: 9.02, portion: { label: "200 g", grams: 200 }, src: "USDA SR Legacy, FDC 172421, lentils, boiled",
    v: { a: 0, d: 0, e: 0.11, k: 1.7, c: 1.5, b12: 0, fol: 181, ca: 19, fe: 3.33, mg: 36, k_: 369, zn: 1.27 },
    best: "Folate for the whole day and plant iron. Vitamin C in the same meal helps take up the iron.", pair: "Red peppers or tomatoes: vitamin C for the iron." },
  { id: "milk", icon: "🥛", name: "Milk, 1 %", kcal: 43, protein: 3.38, portion: { label: "A glass, 250 ml", grams: 250 }, drink: true, src: "USDA Foundation, FDC 746772, milk, lowfat, 1 %, with added vitamins A and D",
    v: { a: 58, d: 1.06, e: 0.02, k: null, c: null, b12: 0.61, fol: 2, ca: 126, fe: 0, mg: 12, k_: 159, zn: 0.43 },
    best: "Calcium and B12 in a glass. This row has vitamin D added, as some milk does.", pair: "Oats or a banana." },
  { id: "almonds", icon: "🥜", name: "Almonds", kcal: 579, protein: 21.1, portion: { label: "A handful, 30 g", grams: 30 }, src: "USDA SR Legacy, FDC 170567, almonds",
    v: { a: 0, d: 0, e: 25.6, k: 0, c: 0, b12: 0, fol: 44, ca: 269, fe: 3.71, mg: 270, k_: 733, zn: 3.12 },
    best: "Vitamin E and magnesium: a handful covers about two thirds of a day's vitamin E.", pair: "Yogurt or fruit." },
  { id: "pepper", icon: "🫑", name: "Red pepper, raw", kcal: 26, protein: 0.99, portion: { label: "1 medium, 120 g", grams: 120 }, src: "USDA SR Legacy, FDC 170108, peppers, sweet, red, raw",
    v: { a: 157, d: 0, e: 1.58, k: 4.9, c: 128, b12: 0, fol: 46, ca: 7, fe: 0.43, mg: 12, k_: 211, zn: 0.25 },
    best: "Vitamin C for about two days in one pepper. Raw keeps the most.", pair: "Lentils, beans or beef: its vitamin C helps take up their iron." },
  { id: "beef", icon: "🥩", name: "Beef, lean, cooked", kcal: 230, protein: 28.4, portion: { label: "125 g, cooked", grams: 125 }, src: "USDA SR Legacy, FDC 171794, beef, ground, 90 % lean, pan-browned",
    v: { a: 3, d: 0, e: 0.12, k: 1.2, c: 0, b12: 2.8, fol: 8, ca: 16, fe: 3.08, mg: 27, k_: 433, zn: 6.84 },
    best: "More than a day of B12, most of the day's zinc, and iron the body takes up well.", pair: "Peppers and greens." },
];

const r = (x: number, d = 0) => Math.round(x * 10 ** d) / 10 ** d;
export const lowerName = (n: string) => n.replace(/^Vitamin /, "vitamin ").replace(/^(Folate|Calcium|Iron|Magnesium|Potassium|Zinc)$/, (x) => x.toLowerCase());
export const fmtAmount = (v: number, unit: string) => `${v < 10 ? v.toFixed(1) : Math.round(v)} ${unit}`;

export type MicroClaim = { id: MicroId; name: string; high: boolean };
// "source of" with 15 % of the NRV per 100 g (7.5 % per 100 ml for a drink), "high in" with twice that
export function microClaims(f: Pick<MicroFood, "v" | "drink">): MicroClaim[] {
  const need = f.drink ? 7.5 : 15;
  return MICRO_MEMBERS.flatMap((m) => { const v = f.v[m.id]; if (v === null) return []; const p = (100 * v) / NRV[m.id];
    return p >= need ? [{ id: m.id, name: m.name, high: p >= 2 * need }] : []; });
}

export type MicroCard = {
  food: MicroFood; pd: number;
  amount: Record<MicroId, number | null>;   // in the portion, µg or mg
  share: Record<MicroId, number | null>;    // % of the label's reference intake for the day
  top: MicroId[];                           // at least a third of the day, the most first
  dEfsa: number | null;                     // vitamin D against EFSA's 15 µg, %
  claims: MicroClaim[];
};
export function microCardOf(f: MicroFood): MicroCard {
  const k = f.portion.grams / 100;
  const amount = Object.fromEntries(MICRO_MEMBERS.map((m) => [m.id, f.v[m.id] === null ? null : f.v[m.id]! * k])) as Record<MicroId, number | null>;
  const share = Object.fromEntries(MICRO_MEMBERS.map((m) => [m.id, amount[m.id] === null ? null : r((100 * amount[m.id]!) / NRV[m.id])])) as Record<MicroId, number | null>;
  const top = MICRO_MEMBERS.filter((m) => (share[m.id] ?? 0) >= TOP_SHARE).sort((a, b) => share[b.id]! - share[a.id]!).map((m) => m.id);
  return { food: f, pd: r((100 * f.protein) / f.kcal, 1), amount, share, top, dEfsa: amount.d ? r((100 * amount.d) / EFSA_D) : null, claims: microClaims(f) };
}

// DT159: a member's own page
export type MemberFood = { name: string; portion: string; grams: number; per100: number; form?: string; src: string };
export type MemberPage = {
  id: MicroId; name: string; unit: "µg" | "mg"; label: number;
  efsa: { men: number; women: number; kind: string; src: string };
  ul: { v: number; note: string } | null; ulNone?: string;
  is: string; does: string[]; doesMore?: string;
  foods: MemberFood[];
  combine: { with: string; why: string }[];
  much: string; sources: string;
};
export const CLAIMS_HEALTH_SOURCE = "Regulation (EU) No 432/2012, Annex.";

export const MEMBER_PAGES: MemberPage[] = [
  { id: "d", name: "Vitamin D", unit: "µg", label: 5,
    efsa: { men: 15, women: 15, kind: "adequate intake, adults", src: "EFSA, adequate intake, adults" },
    ul: { v: 100, note: "EFSA's upper limit for adults, from food and supplements together" },
    is: "Fat-soluble: the body stores it, and it needs some fat in the meal to be taken up. Two forms: D3 (cholecalciferol) from animal foods and from your skin in sunlight; D2 (ergocalciferol) from mushrooms and yeast. In a review of trials, D3 raised blood levels more than D2 when taken in large single doses, but not with a daily intake (Tripkovic 2012).",
    does: ["contributes to normal absorption/utilisation of calcium and phosphorus", "contributes to normal blood calcium levels", "contributes to the maintenance of normal bones", "contributes to the maintenance of normal muscle function", "contributes to the maintenance of normal teeth", "contributes to the normal function of the immune system", "has a role in the process of cell division"],
    foods: [
      { name: "Mushrooms, white, UV-exposed", portion: "100 g", grams: 100, per100: 26.2, form: "D2", src: "SR Legacy, FDC 169376" },
      { name: "Salmon, farmed, cooked", portion: "150 g", grams: 150, per100: 13.1, form: "form not reported", src: "SR Legacy, FDC 175168" },
      { name: "Sardines, canned in oil", portion: "1 can, 90 g", grams: 90, per100: 4.8, form: "D3", src: "SR Legacy, FDC 175139" },
      { name: "Milk, 1 %, vitamin D added", portion: "A glass, 250 ml", grams: 250, per100: 1.06, form: "D3", src: "Foundation, FDC 746772" },
      { name: "Egg", portion: "2 eggs, 100 g", grams: 100, per100: 2.0, form: "D3", src: "SR Legacy, FDC 171287" },
      { name: "Cheddar", portion: "30 g", grams: 30, per100: 0.6, form: "D3", src: "SR Legacy, FDC 173414" },
      { name: "Mushrooms, white, not UV-exposed", portion: "100 g", grams: 100, per100: 0.2, form: "D2", src: "SR Legacy, FDC 169251" },
    ],
    combine: [
      { with: "Some fat in the meal", why: "Vitamin D is fat-soluble: eggs, oily fish and a little olive oil carry it." },
      { with: "Calcium: milk, yogurt, cheese, almonds", why: "Vitamin D contributes to normal absorption of calcium: an EU authorised claim." },
      { with: "Vitamin K2, as often sold together", why: "Not settled. A review found vitamin D with K improved bone density (Kuang 2020); a trial of K2 found no better vascular health (Witham 2020, people with kidney disease). The EU has no claim for it." },
    ],
    much: "Vitamin D builds up in the body. EFSA's upper limit for adults is 100 µg a day, from food and supplements together.",
    sources: "EU claims: Regulation (EU) No 432/2012. EFSA: dietary reference values for vitamin D (2016), upper limit (2023). D3 and D2: Tripkovic 2012, Am J Clin Nutr. Vitamin K: Kuang 2020, Food Funct; Witham 2020, J Am Soc Nephrol. Foods: USDA FoodData Central." },
  { id: "c", name: "Vitamin C", unit: "mg", label: 80,
    efsa: { men: 110, women: 95, kind: "population reference intake", src: "EFSA, population reference intake" },
    ul: null, ulNone: "EFSA: not enough data to derive one",
    is: "Water-soluble: the body doesn't store much of it, so it needs to come often. Heat and long storage destroy part of it, so raw or briefly cooked keeps the most.",
    does: ["increases iron absorption", "contributes to the normal function of the immune system", "contributes to normal collagen formation for the normal function of skin", "contributes to the protection of cells from oxidative stress", "contributes to the reduction of tiredness and fatigue"],
    doesMore: "The same collagen claim for blood vessels, bones, cartilage, gums and teeth. Also energy metabolism, the nervous system, psychological function, the regeneration of vitamin E, and the immune system during and after intense exercise, with 200 mg a day on top of the recommended intake.",
    foods: [
      { name: "Red pepper, raw", portion: "1 medium, 120 g", grams: 120, per100: 128, src: "SR Legacy, FDC 170108" },
      { name: "Broccoli, raw", portion: "100 g", grams: 100, per100: 89.2, src: "SR Legacy, FDC 170379" },
      { name: "Strawberries", portion: "150 g", grams: 150, per100: 58.8, src: "SR Legacy, FDC 167762" },
      { name: "Kiwi", portion: "1 medium, 75 g", grams: 75, per100: 92.7, src: "SR Legacy, FDC 168153" },
      { name: "Orange", portion: "1 medium, 130 g", grams: 130, per100: 53.2, src: "SR Legacy, FDC 169097" },
      { name: "Potatoes, boiled", portion: "200 g", grams: 200, per100: 7.4, src: "SR Legacy, FDC 170440" },
      { name: "Lentils, boiled", portion: "200 g", grams: 200, per100: 1.5, src: "SR Legacy, FDC 172421" },
    ],
    combine: [
      { with: "Plant iron: lentils, beans, spinach, wholegrains", why: "Vitamin C increases iron absorption: an EU authorised claim. Over months the effect on the body's iron stores is smaller than in a single meal (Nyakundi 2026)." },
      { with: "Raw or briefly cooked vegetables", why: "Heat destroys part of it: a raw pepper on the side keeps the most." },
    ],
    much: "EFSA set no upper limit for vitamin C: there is not enough data to derive one.",
    sources: "EU claims: Regulation (EU) No 432/2012. EFSA: dietary reference values for vitamin C (2013), overview of upper limits. Iron over months: Nyakundi 2026, Am J Clin Nutr. Foods: USDA FoodData Central." },
];

// your day: EFSA's value for your sex; a man's when the profile doesn't say
export function memberDay(m: MemberPage, sex?: string | null): { v: number; who: "men" | "women" | "adults" } {
  if (m.efsa.men === m.efsa.women) return { v: m.efsa.men, who: "adults" };
  return sex === "female" ? { v: m.efsa.women, who: "women" } : { v: m.efsa.men, who: "men" };
}
export function memberRows(m: MemberPage, day: number): { food: MemberFood; amount: number; share: number }[] {
  return m.foods.map((f) => { const amount = (f.per100 * f.grams) / 100; return { food: f, amount, share: r((100 * amount) / day) }; });
}
