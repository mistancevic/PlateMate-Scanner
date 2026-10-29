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
// months: Nyakundi 2026, Am J Clin Nutr. Abstracts read through PubMed.
//
// DT162 (0.3.4, board Stories114; Milan 21:34 Go): Vitamin A, E and K pages; sources in design/boards/aek162.cjs, read 29 October
// 2026: Regulation (EU) No 432/2012 Annex rows (A: legislation.gov.uk and EUR-Lex consolidated 2014; E and K: copy of OJ L 136);
// EFSA DRVs for vitamin A (2015), E (2015), K (2017); ULs for preformed vitamin A and beta-carotene (2024), vitamin E (2024),
// vitamin K none (EFSA overview of ULs, version 11, 2025). Brown 2004 Am J Clin Nutr; Gijsbers 1996 Br J Nutr. Foods: USDA SR
// Legacy rows on getfoodfacts.com. One row per food across both pages: the red pepper and
// the milk are the same rows as on the Micros cards.

export type MicroId = "a" | "d" | "e" | "k" | "c" | "b12" | "fol" | "ca" | "fe" | "mg" | "k_" | "zn";
export type MicroGroup = "fat" | "water" | "min";
export const MICRO_GROUPS: { id: MicroGroup; name: string }[] = [{ id: "fat", name: "Vitamins, fat-soluble" }, { id: "water", name: "Vitamins, water-soluble" }, { id: "min", name: "Minerals" }];
// DT162 (0.3.4, board Stories114; Milan 21:21 "We need to write both versions of the name"): every vitamin with its second name
export const MICRO_MEMBERS: { id: MicroId; name: string; also?: string; unit: "µg" | "mg"; group: MicroGroup }[] = [
  { id: "a", name: "Vitamin A", also: "retinol; beta-carotene from plants", unit: "µg", group: "fat" }, { id: "d", name: "Vitamin D", also: "D3 cholecalciferol, D2 ergocalciferol", unit: "µg", group: "fat" }, { id: "e", name: "Vitamin E", also: "tocopherol", unit: "mg", group: "fat" }, { id: "k", name: "Vitamin K", also: "K1 phylloquinone, K2 menaquinone", unit: "µg", group: "fat" },
  { id: "c", name: "Vitamin C", also: "ascorbic acid", unit: "mg", group: "water" }, { id: "b12", name: "Vitamin B12", also: "cobalamin", unit: "µg", group: "water" }, { id: "fol", name: "Vitamin B9", also: "folate", unit: "µg", group: "water" },
  { id: "ca", name: "Calcium", unit: "mg", group: "min" }, { id: "fe", name: "Iron", unit: "mg", group: "min" }, { id: "mg", name: "Magnesium", unit: "mg", group: "min" }, { id: "k_", name: "Potassium", unit: "mg", group: "min" }, { id: "zn", name: "Zinc", unit: "mg", group: "min" },
];
// Regulation (EU) No 1169/2011, Annex XIII, Part A (folate as folic acid)
export const NRV: Record<MicroId, number> = { a: 800, d: 5, e: 12, k: 75, c: 80, b12: 2.5, fol: 200, ca: 800, fe: 14, mg: 375, k_: 2000, zn: 10 };
export const EFSA_D = 15;          // µg a day, adults
export const TOP_SHARE = 33;       // For your day: the members this portion brings at least a third of the day of
export const MICRO_SCALE = 1.5;    // the bars run to 150 % of the day, the line at the whole day

// DT162 (0.3.4): vitamin A in µg RE, the EFSA and EU label way (1 µg RE = 1 µg retinol, 6 µg beta-carotene, 12 µg other
// provitamin A carotenoids), calculated from each row's retinol and carotenes; until 0.3.3 USDA's RAE, which counts beta-carotene
// at 12 to 1, so spinach read 281 µg on its card and 563 µg on the Vitamin A page.
export type MicroFood = {
  id: string; icon: string; name: string; kcal: number; protein: number; portion: { label: string; grams: number }; drink?: boolean;
  v: Record<MicroId, number | null>; src: string; best: string; pair: string;   // per 100 g; null where the row doesn't report it
};

export const MICRO_FOODS: MicroFood[] = [
  { id: "salmon", icon: "🐟", name: "Salmon", kcal: 206, protein: 22.1, portion: { label: "150 g, cooked", grams: 150 }, src: "USDA SR Legacy, FDC 175168, salmon, Atlantic, farmed, cooked, dry heat",
    v: { a: 69, d: 13.1, e: 1.14, k: 0.1, c: 3.7, b12: 2.8, fol: 34, ca: 15, fe: 0.34, mg: 30, k_: 384, zn: 0.43 },
    best: "Twice a week: one of the few foods with real vitamin D, and more than a day of B12.", pair: "Potatoes or rice, and greens." },
  { id: "egg", icon: "🥚", name: "Egg", kcal: 143, protein: 12.6, portion: { label: "2 eggs, 100 g", grams: 100 }, src: "USDA SR Legacy, FDC 171287, egg, whole, raw",
    v: { a: 160.8, d: 2.0, e: 1.05, k: 0.3, c: 0, b12: 0.89, fol: 47, ca: 56, fe: 1.75, mg: 12, k_: 138, zn: 1.29 },
    best: "A little of almost everything: B12, vitamin A and D, folate. The yolk carries them.", pair: "Spinach or peppers: the vitamin C and K eggs lack." },
  { id: "spinach", icon: "🥬", name: "Spinach, raw", kcal: 23, protein: 2.86, portion: { label: "A big handful, 60 g", grams: 60 }, src: "USDA SR Legacy, FDC 168462, spinach, raw",
    v: { a: 937.7, d: 0, e: 2.03, k: 483, c: 28.1, b12: 0, fol: 194, ca: 99, fe: 2.71, mg: 79, k_: 558, zn: 0.53 },
    best: "Vitamin K for days, folate and vitamin A, for almost no energy. Some fat in the meal helps take up A and K.", pair: "Eggs, salmon or a little olive oil." },
  { id: "lentils", icon: "🫘", name: "Lentils, boiled", kcal: 116, protein: 9.02, portion: { label: "200 g", grams: 200 }, src: "USDA SR Legacy, FDC 172421, lentils, boiled",
    v: { a: 0, d: 0, e: 0.11, k: 1.7, c: 1.5, b12: 0, fol: 181, ca: 19, fe: 3.33, mg: 36, k_: 369, zn: 1.27 },
    best: "Folate for the whole day and plant iron. Vitamin C in the same meal helps take up the iron.", pair: "Red peppers or tomatoes: vitamin C for the iron." },
  { id: "milk", icon: "🥛", name: "Milk, 1 %", kcal: 43, protein: 3.38, portion: { label: "A glass, 250 ml", grams: 250 }, drink: true, src: "USDA Foundation, FDC 746772, milk, lowfat, 1 %, with added vitamins A and D",
    v: { a: 58.2, d: 1.06, e: 0.02, k: null, c: null, b12: 0.61, fol: 2, ca: 126, fe: 0, mg: 12, k_: 159, zn: 0.43 },
    best: "Calcium and B12 in a glass. This row has vitamin D added, as some milk does.", pair: "Oats or a banana." },
  { id: "almonds", icon: "🥜", name: "Almonds", kcal: 579, protein: 21.1, portion: { label: "A handful, 30 g", grams: 30 }, src: "USDA SR Legacy, FDC 170567, almonds",
    v: { a: 0, d: 0, e: 25.6, k: 0, c: 0, b12: 0, fol: 44, ca: 269, fe: 3.71, mg: 270, k_: 733, zn: 3.12 },
    best: "Vitamin E and magnesium: a handful covers about two thirds of a day's vitamin E.", pair: "Yogurt or fruit." },
  { id: "pepper", icon: "🫑", name: "Red pepper, raw", kcal: 26, protein: 0.99, portion: { label: "1 medium, 120 g", grams: 120 }, src: "USDA SR Legacy, FDC 170108, peppers, sweet, red, raw",
    v: { a: 313.2, d: 0, e: 1.58, k: 4.9, c: 128, b12: 0, fol: 46, ca: 7, fe: 0.43, mg: 12, k_: 211, zn: 0.25 },
    best: "Vitamin C for about two days in one pepper. Raw keeps the most.", pair: "Lentils, beans or beef: its vitamin C helps take up their iron." },
  { id: "beef", icon: "🥩", name: "Beef, lean, cooked", kcal: 230, protein: 28.4, portion: { label: "125 g, cooked", grams: 125 }, src: "USDA SR Legacy, FDC 171794, beef, ground, 90 % lean, pan-browned",
    v: { a: 3, d: 0, e: 0.12, k: 1.2, c: 0, b12: 2.8, fol: 8, ca: 16, fe: 3.08, mg: 27, k_: 433, zn: 6.84 },
    best: "More than a day of B12, most of the day's zinc, and iron the body takes up well.", pair: "Peppers and greens." },
];

const r = (x: number, d = 0) => Math.round(x * 10 ** d) / 10 ** d;
// in a sentence: "vitamin K"; vitamin B9 by the name the EU claims and labels use, folate
export const lowerName = (n: string) => (n === "Vitamin B9" ? "folate" : n.replace(/^Vitamin /, "vitamin ").replace(/^(Folate|Calcium|Iron|Magnesium|Potassium|Zinc)$/, (x) => x.toLowerCase()));
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
// preformed: for vitamin A, the retinol per 100 g, which alone counts against the upper limit
export type MemberFood = { name: string; portion: string; grams: number; per100: number; form?: string; src: string; preformed?: number };
export type MemberPage = {
  id: MicroId; name: string; also: string; unit: "µg" | "mg"; label: number;
  efsa: { men: number; women: number; kind: string; src: string };
  ul: { v: number; note: string } | null; ulNone?: string;
  is: string; does: string[]; doesMore?: string;
  foods: MemberFood[]; foodsNote?: string;
  combine: { with: string; why: string }[];
  much: string; sources: string;
};
export const CLAIMS_HEALTH_SOURCE = "Regulation (EU) No 432/2012, Annex.";

export const MEMBER_PAGES: MemberPage[] = [
  { id: "a", name: "Vitamin A", also: "retinol; beta-carotene from plants", unit: "µg", label: 800,
    efsa: { men: 750, women: 650, kind: "", src: "EFSA, population reference intake" },
    ul: { v: 3000, note: "EFSA's upper limit for adults, for preformed vitamin A only: retinol from animal foods and supplements" },
    is: "Fat-soluble: the body stores it, in the liver. It comes two ways: as retinol from animal foods, liver, eggs, butter and cheese; and as beta-carotene from orange and green plants, which the body turns into vitamin A as it needs it. EFSA counts 6 µg of beta-carotene as 1 µg of vitamin A.",
    does: ["contributes to normal iron metabolism", "contributes to the maintenance of normal mucous membranes", "contributes to the maintenance of normal skin", "contributes to the maintenance of normal vision", "contributes to the normal function of the immune system", "has a role in the process of cell specialisation"],
    foods: [
      { name: "Beef liver, pan-fried", portion: "100 g", grams: 100, per100: 7761.0, form: "retinol", preformed: 7728, src: "SR Legacy, FDC 168627" },
      { name: "Carrots, raw", portion: "1 medium, 80 g", grams: 80, per100: 1670.6, form: "beta-carotene", preformed: 0, src: "SR Legacy, FDC 170393" },
      { name: "Spinach, raw", portion: "A big handful, 60 g", grams: 60, per100: 937.7, form: "beta-carotene", preformed: 0, src: "SR Legacy, FDC 168462" },
      { name: "Red pepper, raw", portion: "1 medium, 120 g", grams: 120, per100: 313.2, form: "beta-carotene", preformed: 0, src: "SR Legacy, FDC 170108" },
      { name: "Kale, raw", portion: "A handful, 50 g", grams: 50, per100: 481.1, form: "beta-carotene", preformed: 0, src: "SR Legacy, FDC 168421" },
      { name: "Egg", portion: "2 eggs, 100 g", grams: 100, per100: 160.8, form: "retinol", preformed: 160, src: "SR Legacy, FDC 171287" },
      { name: "Cheddar", portion: "30 g", grams: 30, per100: 344.2, form: "retinol", preformed: 330, src: "SR Legacy, FDC 173414" },
      { name: "Salmon, farmed, cooked", portion: "150 g", grams: 150, per100: 69.0, form: "retinol", preformed: 69, src: "SR Legacy, FDC 175168" },
      { name: "Butter", portion: "For one slice of bread, 10 g", grams: 10, per100: 697.3, form: "retinol", preformed: 671, src: "SR Legacy, FDC 173410" },
    ], foodsNote: "Vitamin A counted the EFSA way: retinol, plus beta-carotene divided by 6, plus alpha-carotene and beta-cryptoxanthin divided by 12.",
    combine: [{"with": "Some fat in the meal", "why": "Beta-carotene needs fat to be taken up. In a small trial, a salad with fat-free dressing gave almost none; reduced-fat dressing more, full-fat dressing the most (Brown 2004, 7 people)."}, {"with": "Iron: lentils, beef, spinach", "why": "Vitamin A contributes to normal iron metabolism: an EU authorised claim."}],
    much: "The upper limit, 3000 µg a day, is for retinol, from animal foods and supplements, not for beta-carotene. EFSA found no harm from beta-carotene in normal food. Liver is so rich in retinol that one portion goes over the limit: once in a while, not every day. EFSA advises smokers to avoid beta-carotene supplements.",
    sources: "EU claims: Regulation (EU) No 432/2012. EFSA: dietary reference values for vitamin A (2015), upper limit for preformed vitamin A and beta-carotene (2024). Fat and beta-carotene: Brown 2004, Am J Clin Nutr. Foods: USDA FoodData Central; vitamin A calculated the EFSA way from retinol and the carotenes." },
  { id: "e", name: "Vitamin E", also: "tocopherol", unit: "mg", label: 12,
    efsa: { men: 13, women: 11, kind: "", src: "EFSA, adequate intake, as alpha-tocopherol" },
    ul: { v: 300, note: "EFSA's upper limit for adults, from food and supplements together" },
    is: "Fat-soluble: it sits in the fats of your cells and protects them. It comes in several forms; EFSA counts only alpha-tocopherol, and so do the numbers here. Seeds, nuts and their oils bring the most.",
    does: ["contributes to the protection of cells from oxidative stress"],
    foods: [
      { name: "Sunflower seeds, dry roasted", portion: "A handful, 30 g", grams: 30, per100: 26.1, src: "SR Legacy, FDC 170563" },
      { name: "Almonds", portion: "A handful, 30 g", grams: 30, per100: 25.6, src: "SR Legacy, FDC 170567" },
      { name: "Hazelnuts", portion: "A handful, 30 g", grams: 30, per100: 15.0, src: "SR Legacy, FDC 170581" },
      { name: "Peanut butter", portion: "2 tablespoons, 32 g", grams: 32, per100: 9.1, src: "SR Legacy, FDC 172470" },
      { name: "Rapeseed oil", portion: "1 tablespoon, 14 g", grams: 14, per100: 17.5, src: "SR Legacy, FDC 172336" },
      { name: "Olive oil", portion: "1 tablespoon, 14 g", grams: 14, per100: 14.3, src: "SR Legacy, FDC 171413" },
      { name: "Salmon, farmed, cooked", portion: "150 g", grams: 150, per100: 1.14, src: "SR Legacy, FDC 175168" },
      { name: "Avocado", portion: "Half, 70 g", grams: 70, per100: 2.07, src: "SR Legacy, FDC 171705" },
      { name: "Spinach, raw", portion: "A big handful, 60 g", grams: 60, per100: 2.03, src: "SR Legacy, FDC 168462" },
      { name: "Egg", portion: "2 eggs, 100 g", grams: 100, per100: 1.05, src: "SR Legacy, FDC 171287" },
    ], foodsNote: "Alpha-tocopherol.",
    combine: [{"with": "The oil it comes in", "why": "Vitamin E is fat-soluble: seeds, nuts and oils bring it with their own fat."}, {"with": "Vitamin C: peppers, fruit, greens", "why": "Vitamin C contributes to the regeneration of the reduced form of vitamin E: an EU authorised claim."}],
    much: "EFSA's upper limit for adults is 300 mg a day, from food and supplements together; too much affects blood clotting. Food alone doesn't come near it: a handful of almonds brings under 8 mg.",
    sources: "EU claims: Regulation (EU) No 432/2012. EFSA: dietary reference values for vitamin E (2015), upper limit for vitamin E (2024). Foods: USDA FoodData Central." },
  { id: "k", name: "Vitamin K", also: "K1 phylloquinone, K2 menaquinone", unit: "µg", label: 75,
    efsa: { men: 70, women: 70, kind: "", src: "EFSA, adequate intake for adults, as K1" },
    ul: null, ulNone: "EFSA found not enough data to derive one",
    is: "Fat-soluble. Two forms: K1 (phylloquinone) from green leaves and some oils, most of what people eat; K2 (menaquinones) from fermented foods, cheese and animal foods, and made by gut bacteria. EFSA sets its value for K1 only: the data on K2 were too few.",
    does: ["contributes to normal blood clotting", "contributes to the maintenance of normal bones"],
    foods: [
      { name: "Spinach, raw", portion: "A big handful, 60 g", grams: 60, per100: 483, src: "SR Legacy, FDC 168462" },
      { name: "Kale, raw", portion: "A handful, 50 g", grams: 50, per100: 390, src: "SR Legacy, FDC 168421" },
      { name: "Broccoli, boiled", portion: "100 g", grams: 100, per100: 141, src: "SR Legacy, FDC 169967" },
      { name: "Brussels sprouts, boiled", portion: "100 g", grams: 100, per100: 140, src: "SR Legacy, FDC 169971" },
      { name: "Romaine lettuce", portion: "A bowl, 50 g", grams: 50, per100: 103, src: "SR Legacy, FDC 169247" },
      { name: "Soybean oil", portion: "1 tablespoon, 14 g", grams: 14, per100: 184, src: "SR Legacy, FDC 171411" },
      { name: "Natto", portion: "50 g", grams: 50, per100: 23.1, form: "K1 only; its K2 is not on the USDA row", src: "SR Legacy, FDC 172443" },
      { name: "Olive oil", portion: "1 tablespoon, 14 g", grams: 14, per100: 60.2, src: "SR Legacy, FDC 171413" },
      { name: "Cheddar", portion: "30 g", grams: 30, per100: 2.4, form: "K1; also 2.6 µg K2 (MK-4), not counted in EFSA's value", src: "SR Legacy, FDC 173414" },
      { name: "Egg", portion: "2 eggs, 100 g", grams: 100, per100: 0.3, src: "SR Legacy, FDC 171287" },
    ], foodsNote: "K1, phylloquinone, as USDA reports it.",
    combine: [{"with": "Some fat with your greens", "why": "K1 sits tight in the leaf. In a small study, it reached the blood about three times better from spinach eaten with butter than from spinach alone (Gijsbers 1996, 5 people)."}, {"with": "Vitamin D, as often sold together", "why": "Not settled: see Vitamin D. The EU has a claim for each on its own, none for the two together."}],
    much: "EFSA set no upper limit for vitamin K: there is not enough data to derive one. If you take medication that affects food, your doctor's advice comes first.",
    sources: "EU claims: Regulation (EU) No 432/2012. EFSA: dietary reference values for vitamin K (2017), overview of upper limits. Fat and K1: Gijsbers 1996, Br J Nutr. Foods: USDA FoodData Central, which reports K1." },
  { id: "d", name: "Vitamin D", also: "D3 cholecalciferol, D2 ergocalciferol", unit: "µg", label: 5,
    efsa: { men: 15, women: 15, kind: "adequate intake, adults", src: "EFSA, adequate intake for adults" },
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
  { id: "c", name: "Vitamin C", also: "ascorbic acid", unit: "mg", label: 80,
    efsa: { men: 110, women: 95, kind: "population reference intake", src: "EFSA, population reference intake" },
    ul: null, ulNone: "EFSA found not enough data to derive one",
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
