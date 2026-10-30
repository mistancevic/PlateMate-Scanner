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
// Legacy rows on getfoodfacts.com.
//
// DT163 (0.3.5, board Stories115; Milan 21:59 Go): the whole B group; sources in design/boards/b163.cjs: claims from the 432/2012
// Annex (legislation.gov.uk), label references from 1169/2011 Annex XIII, EFSA values as the Health Council of the Netherlands
// tabulated them (2018) with biotin (2014) and B12 (2015) from EFSA; upper limits from EFSA's overview, version 11. B1 and B3 per
// MJ of today's energy; B3 in niacin equivalents (niacin + tryptophan/60); USDA's rows report no biotin. One row per food across both pages: the red pepper and
// the milk are the same rows as on the Micros cards.

export type MicroId = "a" | "d" | "e" | "k" | "c" | "b1" | "b2" | "b3" | "b5" | "b6" | "b7" | "b12" | "fol" | "ca" | "fe" | "mg" | "k_" | "zn";
export type MicroGroup = "fat" | "water" | "min";
export const MICRO_GROUPS: { id: MicroGroup; name: string }[] = [{ id: "fat", name: "Vitamins, fat-soluble" }, { id: "water", name: "Vitamins, water-soluble" }, { id: "min", name: "Minerals" }];
// DT162 (0.3.4, board Stories114; Milan 21:21 "We need to write both versions of the name"): every vitamin with its second name
export const MICRO_MEMBERS: { id: MicroId; name: string; also?: string; unit: "µg" | "mg"; group: MicroGroup }[] = [
  { id: "a", name: "Vitamin A", also: "retinol; beta-carotene from plants", unit: "µg", group: "fat" }, { id: "d", name: "Vitamin D", also: "D3 cholecalciferol, D2 ergocalciferol", unit: "µg", group: "fat" }, { id: "e", name: "Vitamin E", also: "tocopherol", unit: "mg", group: "fat" }, { id: "k", name: "Vitamin K", also: "K1 phylloquinone, K2 menaquinone", unit: "µg", group: "fat" },
  { id: "c", name: "Vitamin C", also: "ascorbic acid", unit: "mg", group: "water" },
  // DT163 (0.3.5, board Stories115): the whole B group in order, B9 before B12
  { id: "b1", name: "Vitamin B1", also: "thiamine", unit: "mg", group: "water" }, { id: "b2", name: "Vitamin B2", also: "riboflavin", unit: "mg", group: "water" }, { id: "b3", name: "Vitamin B3", also: "niacin", unit: "mg", group: "water" },
  { id: "b5", name: "Vitamin B5", also: "pantothenic acid", unit: "mg", group: "water" }, { id: "b6", name: "Vitamin B6", also: "pyridoxine", unit: "mg", group: "water" }, { id: "b7", name: "Vitamin B7", also: "biotin", unit: "µg", group: "water" },
  { id: "fol", name: "Vitamin B9", also: "folate", unit: "µg", group: "water" }, { id: "b12", name: "Vitamin B12", also: "cobalamin", unit: "µg", group: "water" },
  { id: "ca", name: "Calcium", unit: "mg", group: "min" }, { id: "fe", name: "Iron", unit: "mg", group: "min" }, { id: "mg", name: "Magnesium", unit: "mg", group: "min" }, { id: "k_", name: "Potassium", unit: "mg", group: "min" }, { id: "zn", name: "Zinc", unit: "mg", group: "min" },
];
// Regulation (EU) No 1169/2011, Annex XIII, Part A (folate as folic acid)
export const NRV: Record<MicroId, number> = { a: 800, d: 5, e: 12, k: 75, c: 80, b1: 1.1, b2: 1.4, b3: 16, b5: 6, b6: 1.4, b7: 50, b12: 2.5, fol: 200, ca: 800, fe: 14, mg: 375, k_: 2000, zn: 10 };
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

import { rowOf, FOOD_TABLE } from "./foodTable";
const fromTable = (id: string) => { const r = rowOf(id); return { icon: r.icon, name: r.name, kcal: r.kcal, protein: r.protein, portion: r.portion, drink: r.drink, v: r.micro!, src: r.src }; };
// DT164 (0.3.6): the numbers, name, icon and portion come from the shared food table (src/foodTable.ts); only what this family
// says about a food is written here
type Extra = Omit<MicroFood, "icon" | "name" | "kcal" | "protein" | "portion" | "drink" | "v" | "src">;
const EXTRAS: Extra[] = [
  { id: "salmon", best: "Twice a week: one of the few foods with real vitamin D, and more than a day of B12.", pair: "Potatoes or rice, and greens." },
  { id: "egg", best: "A little of almost everything: B12, vitamin A and D, folate. The yolk carries them.", pair: "Spinach or peppers: the vitamin C and K eggs lack." },
  { id: "spinach", best: "Vitamin K for days, folate and vitamin A, for almost no energy. Some fat in the meal helps take up A and K.", pair: "Eggs, salmon or a little olive oil." },
  { id: "lentils", best: "Folate for the whole day and plant iron. Vitamin C in the same meal helps take up the iron.", pair: "Red peppers or tomatoes: vitamin C for the iron." },
  { id: "milk", best: "Calcium and B12 in a glass. This row has vitamin D added, as some milk does.", pair: "Oats or a banana." },
  { id: "almonds", best: "Vitamin E and magnesium: a handful covers about two thirds of a day's vitamin E.", pair: "Yogurt or fruit." },
  { id: "pepper", best: "Vitamin C for about two days in one pepper. Raw keeps the most.", pair: "Lentils, beans or beef: its vitamin C helps take up their iron." },
  { id: "beef", best: "More than a day of B12, most of the day's zinc, and iron the body takes up well.", pair: "Peppers and greens." },
];
export const MICRO_FOODS: MicroFood[] = EXTRAS.map((x) => ({ ...fromTable(x.id), ...x }));

const r = (x: number, d = 0) => Math.round(x * 10 ** d) / 10 ** d;
// in a sentence: "vitamin K"; vitamin B9 by the name the EU claims and labels use, folate
// the B vitamins by the names EU labels and claims use (Regulation (EU) No 1169/2011, Annex XIII)
const LABEL_NAME: Record<string, string> = { "Vitamin B1": "thiamine", "Vitamin B2": "riboflavin", "Vitamin B3": "niacin", "Vitamin B5": "pantothenic acid", "Vitamin B7": "biotin", "Vitamin B9": "folate" };
export const lowerName = (n: string) => (LABEL_NAME[n] ? LABEL_NAME[n] : n.replace(/^Vitamin /, "vitamin ").replace(/^(Folate|Calcium|Iron|Magnesium|Potassium|Zinc)$/, (x) => x.toLowerCase()));
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
  id: MicroId; name: string; also: string; unit: "µg" | "mg" | "mg NE" | "µg DFE"; label: number;
  efsa: { men: number; women: number; kind: string; src: string; perMJ?: number; young?: { v: number; under: number }; note?: string };   // perMJ: set by energy (B1, B3)
  // young: a higher value below an age (calcium, 1000 mg to 24); note: said with your day (iron after menopause, zinc and phytate)
  ul: { v: number; note: string } | null; ulNone?: string;
  is: string; does: string[]; doesMore?: string;
  foods: MemberFood[]; foodsNote?: string; gap?: string;   // gap: no food row has it, said instead of foods
  ulFood?: false;   // the upper limit is for added forms only (folic acid): no food counts against it
  combine: { with: string; why: string }[];
  much: string; sources: string;
};
export const CLAIMS_HEALTH_SOURCE = "Regulation (EU) No 432/2012, Annex.";

export const MEMBER_PAGES: MemberPage[] = [
  { id: "b1", name: "Vitamin B1", also: "thiamine", unit: "mg", label: 1.1,
    efsa: { men: 0, women: 0, kind: "", src: "EFSA's population reference intake, 0.1 mg for every MJ you eat", perMJ: 0.1 },
    ul: null, ulNone: "EFSA found not enough data to derive one",
    is: "Water-soluble, so it needs to come often. Your body needs it to get energy from food, so EFSA sets it by how much you eat: 0.1 mg for every megajoule. Pork, whole grains, legumes and seeds bring the most.",
    does: ["contributes to normal energy-yielding metabolism", "contributes to normal functioning of the nervous system", "contributes to normal psychological function", "contributes to the normal function of the heart"],
    foods: [
      { name: "Pork tenderloin, roasted", portion: "150 g", grams: 150, per100: 0.95, src: "SR Legacy, FDC 168250" },
      { name: "Salmon, farmed, cooked", portion: "150 g", grams: 150, per100: 0.34, src: "SR Legacy, FDC 175168" },
      { name: "Lentils, boiled", portion: "200 g", grams: 200, per100: 0.17, src: "SR Legacy, FDC 172421" },
      { name: "Wholewheat bread", portion: "2 slices, 60 g", grams: 60, per100: 0.39, src: "SR Legacy, FDC 172688" },
      { name: "Chickpeas, boiled", portion: "200 g", grams: 200, per100: 0.12, src: "SR Legacy, FDC 173757" },
      { name: "Oats, dry", portion: "50 g", grams: 50, per100: 0.46, src: "SR Legacy, FDC 173904" },
      { name: "Potatoes, boiled", portion: "200 g", grams: 200, per100: 0.098, src: "SR Legacy, FDC 170440" },
      { name: "Asparagus, boiled", portion: "100 g", grams: 100, per100: 0.16, src: "SR Legacy, FDC 168390" },
      { name: "Peanuts, dry roasted", portion: "A handful, 30 g", grams: 30, per100: 0.15, src: "SR Legacy, FDC 173806" },
      { name: "Sunflower seeds, dry roasted", portion: "A handful, 30 g", grams: 30, per100: 0.11, src: "SR Legacy, FDC 170563" }
    ],
    combine: [{"with": "Your carbs", "why": "Thiamine contributes to normal energy-yielding metabolism: an EU claim. The more you eat, the more you need: that is why your day here follows your energy."}],
    much: "EFSA set no upper limit for thiamine: there is not enough data to derive one.",
    sources: "EU claims: Regulation (EU) No 432/2012. EFSA's dietary reference values, as the Health Council of the Netherlands tabulated them (2018), and EFSA's overview of upper limits. Foods: USDA FoodData Central." },
  { id: "b2", name: "Vitamin B2", also: "riboflavin", unit: "mg", label: 1.4,
    efsa: { men: 1.6, women: 1.6, kind: "", src: "EFSA's population reference intake for adults" },
    ul: null, ulNone: "EFSA found not enough data to derive one",
    is: "Water-soluble, so it needs to come often. Your body needs it to get energy from food and to use iron. Liver, milk, yogurt, eggs and almonds bring the most among these foods.",
    does: ["contributes to normal energy-yielding metabolism", "contributes to normal functioning of the nervous system", "contributes to the maintenance of normal mucous membranes", "contributes to the maintenance of normal red blood cells", "contributes to the maintenance of normal skin", "contributes to the maintenance of normal vision", "contributes to the normal metabolism of iron", "contributes to the protection of cells from oxidative stress", "contributes to the reduction of tiredness and fatigue"],
    foods: [
      { name: "Beef liver, pan-fried", portion: "100 g", grams: 100, per100: 3.42, src: "SR Legacy, FDC 168627" },
      { name: "Pork tenderloin, roasted", portion: "150 g", grams: 150, per100: 0.39, src: "SR Legacy, FDC 168250" },
      { name: "Egg", portion: "2 eggs, 100 g", grams: 100, per100: 0.46, src: "SR Legacy, FDC 171287" },
      { name: "Yogurt, plain, low fat", portion: "200 g", grams: 200, per100: 0.21, src: "SR Legacy, FDC 170886" },
      { name: "Mushrooms, white, raw", portion: "100 g", grams: 100, per100: 0.4, src: "SR Legacy, FDC 169251" },
      { name: "Milk, 1 %", portion: "A glass, 250 ml", grams: 250, per100: 0.14, src: "Foundation, FDC 746772" },
      { name: "Almonds", portion: "A handful, 30 g", grams: 30, per100: 1.14, src: "SR Legacy, FDC 170567" },
      { name: "Salmon, farmed, cooked", portion: "150 g", grams: 150, per100: 0.14, src: "SR Legacy, FDC 175168" },
      { name: "Cheddar", portion: "30 g", grams: 30, per100: 0.43, src: "SR Legacy, FDC 173414" },
      { name: "Spinach, raw", portion: "A big handful, 60 g", grams: 60, per100: 0.19, src: "SR Legacy, FDC 168462" }
    ],
    combine: [{"with": "Iron: lentils, beef, spinach", "why": "Riboflavin contributes to the normal metabolism of iron: an EU authorised claim."}],
    much: "EFSA set no upper limit for riboflavin: there is not enough data to derive one.",
    sources: "EU claims: Regulation (EU) No 432/2012. EFSA's dietary reference values, as the Health Council of the Netherlands tabulated them (2018), and EFSA's overview of upper limits. Foods: USDA FoodData Central." },
  { id: "b3", name: "Vitamin B3", also: "niacin", unit: "mg NE", label: 16,
    efsa: { men: 0, women: 0, kind: "", src: "EFSA's population reference intake, 1.6 mg NE for every MJ you eat", perMJ: 1.6 },
    ul: null,
    is: "Water-soluble. Your body makes some from tryptophan, an amino acid in protein: about 60 mg of tryptophan gives 1 mg of niacin. So EFSA counts niacin equivalents, NE: the niacin in a food plus its tryptophan divided by 60. Like B1, it is set by how much you eat.",
    does: ["contributes to normal energy-yielding metabolism", "contributes to normal functioning of the nervous system", "contributes to normal psychological function", "contributes to the maintenance of normal mucous membranes", "contributes to the maintenance of normal skin", "contributes to the reduction of tiredness and fatigue"],
    foods: [
      { name: "Chicken breast, roasted", portion: "150 g", grams: 150, per100: 19.7, src: "SR Legacy, FDC 171477" },
      { name: "Beef liver, pan-fried", portion: "100 g", grams: 100, per100: 23.167, src: "SR Legacy, FDC 168627" },
      { name: "Pork tenderloin, roasted", portion: "150 g", grams: 150, per100: 12.097, src: "SR Legacy, FDC 168250" },
      { name: "Tuna, canned in water", portion: "1 can, 100 g", grams: 100, per100: 13.6, src: "SR Legacy, FDC 173709" },
      { name: "Sardines, canned in oil", portion: "1 can, 90 g", grams: 90, per100: 9.917, src: "SR Legacy, FDC 175139" },
      { name: "Peanuts, dry roasted", portion: "A handful, 30 g", grams: 30, per100: 18.233, src: "SR Legacy, FDC 173806" },
      { name: "Lentils, boiled", portion: "200 g", grams: 200, per100: 2.41, src: "SR Legacy, FDC 172421" },
      { name: "Mushrooms, white, raw", portion: "100 g", grams: 100, per100: 4.193, src: "SR Legacy, FDC 169251" },
      { name: "Chickpeas, boiled", portion: "200 g", grams: 200, per100: 1.947, src: "SR Legacy, FDC 173757" }
    ], foodsNote: "Niacin equivalents: the niacin plus the tryptophan divided by 60, from the same rows.",
    combine: [{"with": "Protein", "why": "Its tryptophan counts as niacin: chicken, tuna and peanuts bring both."}],
    much: "EFSA's upper limits are for two forms: nicotinic acid, 10 mg a day, and nicotinamide, 900 mg a day (SCF 2002).",
    sources: "EU claims: Regulation (EU) No 432/2012. EFSA's dietary reference values, as the Health Council of the Netherlands tabulated them (2018), and EFSA's overview of upper limits. Foods: USDA FoodData Central." },
  { id: "b5", name: "Vitamin B5", also: "pantothenic acid", unit: "mg", label: 6,
    efsa: { men: 5, women: 5, kind: "", src: "EFSA's adequate intake for adults" },
    ul: null, ulNone: "EFSA found not enough data to derive one",
    is: "Water-soluble. Small amounts are in many foods; among these, liver, salmon, eggs, chicken and mushrooms bring the most.",
    does: ["contributes to normal energy-yielding metabolism", "contributes to normal synthesis and metabolism of steroid hormones, vitamin D and some neurotransmitters", "contributes to the reduction of tiredness and fatigue", "contributes to normal mental performance"],
    foods: [
      { name: "Beef liver, pan-fried", portion: "100 g", grams: 100, per100: 6.94, src: "SR Legacy, FDC 168627" },
      { name: "Salmon, farmed, cooked", portion: "150 g", grams: 150, per100: 1.48, src: "SR Legacy, FDC 175168" },
      { name: "Egg", portion: "2 eggs, 100 g", grams: 100, per100: 1.53, src: "SR Legacy, FDC 171287" },
      { name: "Pork tenderloin, roasted", portion: "150 g", grams: 150, per100: 1.01, src: "SR Legacy, FDC 168250" },
      { name: "Mushrooms, white, raw", portion: "100 g", grams: 100, per100: 1.5, src: "SR Legacy, FDC 169251" },
      { name: "Chicken breast, roasted", portion: "150 g", grams: 150, per100: 0.96, src: "SR Legacy, FDC 171477" },
      { name: "Lentils, boiled", portion: "200 g", grams: 200, per100: 0.64, src: "SR Legacy, FDC 172421" },
      { name: "Yogurt, plain, low fat", portion: "200 g", grams: 200, per100: 0.59, src: "SR Legacy, FDC 170886" },
      { name: "Oats, dry", portion: "50 g", grams: 50, per100: 1.12, src: "SR Legacy, FDC 173904" },
      { name: "Avocado", portion: "Half, 70 g", grams: 70, per100: 1.39, src: "SR Legacy, FDC 171705" }
    ], foodsNote: "Sunflower seeds are left out: their row shows the same number for niacin and pantothenic acid, to be checked.",
    combine: [],
    much: "EFSA set no upper limit for pantothenic acid: there is not enough data to derive one.",
    sources: "EU claims: Regulation (EU) No 432/2012. EFSA's dietary reference values, as the Health Council of the Netherlands tabulated them (2018), and EFSA's overview of upper limits. Foods: USDA FoodData Central." },
  { id: "b6", name: "Vitamin B6", also: "pyridoxine", unit: "mg", label: 1.4,
    efsa: { men: 1.7, women: 1.6, kind: "", src: "EFSA's population reference intake" },
    ul: { v: 12, note: "EFSA's upper limit for adults" },
    is: "Water-soluble. Your body needs it to use protein, so meat, fish and legumes bring it, and so do potatoes and bananas.",
    does: ["contributes to normal cysteine synthesis", "contributes to normal energy-yielding metabolism", "contributes to normal functioning of the nervous system", "contributes to normal homocysteine metabolism", "contributes to normal protein and glycogen metabolism", "contributes to normal psychological function", "contributes to normal red blood cell formation", "contributes to the normal function of the immune system", "contributes to the reduction of tiredness and fatigue", "contributes to the regulation of hormonal activity"],
    foods: [
      { name: "Pork tenderloin, roasted", portion: "150 g", grams: 150, per100: 0.74, src: "SR Legacy, FDC 168250" },
      { name: "Beef liver, pan-fried", portion: "100 g", grams: 100, per100: 1.03, src: "SR Legacy, FDC 168627" },
      { name: "Salmon, farmed, cooked", portion: "150 g", grams: 150, per100: 0.65, src: "SR Legacy, FDC 175168" },
      { name: "Chicken breast, roasted", portion: "150 g", grams: 150, per100: 0.6, src: "SR Legacy, FDC 171477" },
      { name: "Potatoes, boiled", portion: "200 g", grams: 200, per100: 0.27, src: "SR Legacy, FDC 170440" },
      { name: "Banana", portion: "1 medium, 120 g", grams: 120, per100: 0.37, src: "SR Legacy, FDC 173944" },
      { name: "Tuna, canned in water", portion: "1 can, 100 g", grams: 100, per100: 0.32, src: "SR Legacy, FDC 173709" },
      { name: "Sunflower seeds, dry roasted", portion: "A handful, 30 g", grams: 30, per100: 0.8, src: "SR Legacy, FDC 170563" },
      { name: "Chickpeas, boiled", portion: "200 g", grams: 200, per100: 0.14, src: "SR Legacy, FDC 173757" },
      { name: "Avocado", portion: "Half, 70 g", grams: 70, per100: 0.26, src: "SR Legacy, FDC 171705" }
    ],
    combine: [{"with": "Protein", "why": "Vitamin B6 contributes to normal protein and glycogen metabolism: an EU authorised claim."}],
    much: "EFSA's upper limit for adults is 12 mg a day. Food alone doesn't come near it: the richest portion here brings about 1.1 mg.",
    sources: "EU claims: Regulation (EU) No 432/2012. EFSA's dietary reference values, as the Health Council of the Netherlands tabulated them (2018), and EFSA's overview of upper limits. Foods: USDA FoodData Central." },
  { id: "b7", name: "Vitamin B7", also: "biotin", unit: "µg", label: 50,
    efsa: { men: 40, women: 40, kind: "", src: "EFSA's adequate intake for adults" },
    ul: null, ulNone: "EFSA found not enough data to derive one",
    is: "Water-soluble. Your body needs it to use fats, carbs and protein. EFSA's 40 µg comes from what people across the EU eat, where a lack is rare.",
    does: ["contributes to normal energy-yielding metabolism", "contributes to normal functioning of the nervous system", "contributes to normal macronutrient metabolism", "contributes to normal psychological function", "contributes to the maintenance of normal hair", "contributes to the maintenance of normal mucous membranes", "contributes to the maintenance of normal skin"],
    foods: [

    ], gap: "USDA's rows don't report biotin, for any food here. Until we read a food table that does, this section stays empty rather than guess.",
    combine: [],
    much: "EFSA set no upper limit for biotin: there is not enough data to derive one.",
    sources: "EU claims: Regulation (EU) No 432/2012. EFSA's dietary reference values, as the Health Council of the Netherlands tabulated them (2018), and EFSA's overview of upper limits. Foods: USDA FoodData Central." },
  { id: "fol", name: "Vitamin B9", also: "folate", unit: "µg DFE", label: 200,
    efsa: { men: 330, women: 330, kind: "", src: "EFSA's population reference intake, in dietary folate equivalents" },
    ul: { v: 1000, note: "for folic acid and its salts added to foods or in supplements only; folate in food has no limit" }, ulFood: false,
    is: "Water-soluble. Folate is the form in food: green leaves, legumes, liver. Folic acid is the form added to foods and supplements. EFSA counts both as dietary folate equivalents, DFE. The foods here have no folic acid added.",
    does: ["contributes to maternal tissue growth during pregnancy", "contributes to normal amino acid synthesis", "contributes to normal blood formation", "contributes to normal homocysteine metabolism", "contributes to normal psychological function", "contributes to the normal function of the immune system", "contributes to the reduction of tiredness and fatigue", "has a role in the process of cell division"],
    foods: [
      { name: "Lentils, boiled", portion: "200 g", grams: 200, per100: 181, src: "SR Legacy, FDC 172421" },
      { name: "Chickpeas, boiled", portion: "200 g", grams: 200, per100: 172, src: "SR Legacy, FDC 173757" },
      { name: "Beef liver, pan-fried", portion: "100 g", grams: 100, per100: 260, src: "SR Legacy, FDC 168627" },
      { name: "Asparagus, boiled", portion: "100 g", grams: 100, per100: 149, src: "SR Legacy, FDC 168390" },
      { name: "Spinach, raw", portion: "A big handful, 60 g", grams: 60, per100: 194, src: "SR Legacy, FDC 168462" },
      { name: "Broccoli, boiled", portion: "100 g", grams: 100, per100: 108, src: "SR Legacy, FDC 169967" },
      { name: "Sunflower seeds, dry roasted", portion: "A handful, 30 g", grams: 30, per100: 237, src: "SR Legacy, FDC 170563" },
      { name: "Avocado", portion: "Half, 70 g", grams: 70, per100: 81, src: "SR Legacy, FDC 171705" },
      { name: "Egg", portion: "2 eggs, 100 g", grams: 100, per100: 47, src: "SR Legacy, FDC 171287" },
      { name: "Peanuts, dry roasted", portion: "A handful, 30 g", grams: 30, per100: 97, src: "SR Legacy, FDC 173806" }
    ],
    combine: [{"with": "Vitamin B12 and B6", "why": "Folate, B12 and B6 each contribute to normal homocysteine metabolism: three EU claims."}],
    much: "EFSA's upper limit, 1000 µg a day, is for folic acid and its salts added to foods or taken as supplements. Folate that is naturally in food has no limit.",
    sources: "EU claims: Regulation (EU) No 432/2012. EFSA's dietary reference values, as the Health Council of the Netherlands tabulated them (2018), and EFSA's overview of upper limits. Foods: USDA FoodData Central." },
  { id: "b12", name: "Vitamin B12", also: "cobalamin", unit: "µg", label: 2.5,
    efsa: { men: 4, women: 4, kind: "", src: "EFSA's adequate intake for adults" },
    ul: null, ulNone: "EFSA: no defined adverse effects",
    is: "Water-soluble. Among the foods here, only animal foods bring it: shellfish, liver, fish, meat, milk and eggs. Every plant food on USDA's rows here has none.",
    does: ["contributes to normal energy-yielding metabolism", "contributes to normal functioning of the nervous system", "contributes to normal homocysteine metabolism", "contributes to normal psychological function", "contributes to normal red blood cell formation", "contributes to the normal function of the immune system", "contributes to the reduction of tiredness and fatigue", "has a role in the process of cell division"],
    foods: [
      { name: "Clams, cooked", portion: "100 g", grams: 100, per100: 98.9, src: "SR Legacy, FDC 171975" },
      { name: "Beef liver, pan-fried", portion: "100 g", grams: 100, per100: 83.1, src: "SR Legacy, FDC 168627" },
      { name: "Sardines, canned in oil", portion: "1 can, 90 g", grams: 90, per100: 8.94, src: "SR Legacy, FDC 175139" },
      { name: "Salmon, farmed, cooked", portion: "150 g", grams: 150, per100: 2.8, src: "SR Legacy, FDC 175168" },
      { name: "Beef, lean, cooked", portion: "125 g", grams: 125, per100: 2.8, src: "SR Legacy, FDC 171794" },
      { name: "Tuna, canned in water", portion: "1 can, 100 g", grams: 100, per100: 2.55, src: "SR Legacy, FDC 173709" },
      { name: "Milk, 1 %", portion: "A glass, 250 ml", grams: 250, per100: 0.61, src: "Foundation, FDC 746772" },
      { name: "Yogurt, plain, low fat", portion: "200 g", grams: 200, per100: 0.56, src: "SR Legacy, FDC 170886" },
      { name: "Egg", portion: "2 eggs, 100 g", grams: 100, per100: 0.89, src: "SR Legacy, FDC 171287" },
      { name: "Cheddar", portion: "30 g", grams: 30, per100: 1.1, src: "SR Legacy, FDC 173414" }
    ],
    combine: [{"with": "Folate", "why": "Folate and B12 each contribute to normal homocysteine metabolism: EU claims."}, {"with": "If you eat vegan", "why": "None of the plant foods on USDA's rows here bring B12."}],
    much: "EFSA found no defined adverse effects from vitamin B12, so there is no upper limit.",
    sources: "EU claims: Regulation (EU) No 432/2012. EFSA's dietary reference values, as the Health Council of the Netherlands tabulated them (2018), and EFSA's overview of upper limits. Foods: USDA FoodData Central." },
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

// DT165 (0.3.7, board Stories117; Coach Milan 29 October 23:24): the five minerals. Sources read 29 October 2026. EU claims:
// Regulation (EU) No 432/2012, Annex (calcium, iron, magnesium, potassium: legislation.gov.uk; zinc: the OJ L 136 copy on
// lexploria.com). EFSA: calcium 2015, iron 2015, magnesium 2015, potassium 2016, zinc 2014 (abstracts and press releases); upper
// limits from EFSA's overview, version 11. Where to find it: the ten foods on our table with the most in one normal portion,
// from the shared food table, so the numbers are the ones in Foods.
const srcOf = (src: string) => { const m = /USDA (SR Legacy|Foundation), FDC (\d+)/.exec(src); return m ? `${m[1]}, FDC ${m[2]}` : src; };
export function tableFoods(id: MicroId, n = 10): MemberFood[] {
  return FOOD_TABLE.filter((f) => f.micro && f.micro[id] != null).map((f) => ({ name: f.name, portion: f.portion.label, grams: f.portion.grams, per100: f.micro![id]!, src: srcOf(f.src) }))
    .sort((a, b) => b.per100 * b.grams - a.per100 * a.grams).slice(0, n);
}
const TOP_NOTE = "The ten foods on our table with the most in one normal portion.";
const MINERALS: MemberPage[] = [
  { id: "ca", name: "Calcium", also: "", unit: "mg", label: 800,
    efsa: { men: 950, women: 950, kind: "", src: "EFSA, population reference intake for adults from 25", young: { v: 1000, under: 25 } },
    ul: { v: 2500, note: "EFSA's upper limit for adults, from food and supplements together" },
    is: "Your bones and teeth hold most of it; it also works in your muscles, your nerves and blood clotting. Milk, yogurt and cheese bring it, and so do sardines eaten with their bones and tofu set with calcium.",
    does: ["contributes to normal blood clotting", "contributes to normal energy-yielding metabolism", "contributes to normal muscle function", "contributes to normal neurotransmission", "contributes to the normal function of digestive enzymes", "has a role in the process of cell division and specialisation", "is needed for the maintenance of normal bones", "is needed for the maintenance of normal teeth"],
    foods: tableFoods("ca"), foodsNote: TOP_NOTE,
    combine: [{ with: "Vitamin D: oily fish, eggs, some sun", why: "Vitamin D contributes to normal absorption and utilisation of calcium: an EU authorised claim." }],
    much: "EFSA's upper limit for adults is 2500 mg a day, from food and supplements together.",
    sources: "EU claims: Regulation (EU) No 432/2012. EFSA: dietary reference values for calcium (2015), upper limit for calcium (2012). Foods: USDA FoodData Central." },
  { id: "fe", name: "Iron", also: "", unit: "mg", label: 14,
    efsa: { men: 11, women: 16, kind: "", src: "EFSA, population reference intake", note: "For women after menopause, 11 mg, as for men." },
    ul: null, ulNone: "EFSA found not enough data to derive one, and set a safe level of intake instead, 40 mg a day for adults",
    is: "Carries oxygen in your blood. Meat, liver and fish bring it, and so do legumes, seeds and greens. From plants, vitamin C in the same meal helps your body take it up.",
    does: ["contributes to normal cognitive function", "contributes to normal energy-yielding metabolism", "contributes to normal formation of red blood cells and haemoglobin", "contributes to normal oxygen transport in the body", "contributes to the normal function of the immune system", "contributes to the reduction of tiredness and fatigue", "has a role in the process of cell division"],
    foods: tableFoods("fe"), foodsNote: TOP_NOTE + " Pasta is enriched: iron is added to the flour.",
    combine: [{ with: "Vitamin C: peppers, citrus, broccoli", why: "Vitamin C increases iron absorption: an EU authorised claim." }, { with: "Vitamin A and riboflavin", why: "Vitamin A contributes to normal iron metabolism, and riboflavin to the normal metabolism of iron: EU authorised claims." }],
    much: "EFSA found not enough data for an upper limit for iron. It set a safe level of intake instead: 40 mg a day for adults, from all sources.",
    sources: "EU claims: Regulation (EU) No 432/2012. EFSA: dietary reference values for iron (2015), safe level of intake (2024). Foods: USDA FoodData Central." },
  { id: "mg", name: "Magnesium", also: "", unit: "mg", label: 375,
    efsa: { men: 350, women: 300, kind: "", src: "EFSA, adequate intake" },
    ul: { v: 250, note: "for magnesium salts in supplements, in water or added to foods only" }, ulFood: false,
    is: "Works in your muscles and nerves, and in getting energy from food. Seeds, nuts, legumes, whole grains and green leaves bring the most.",
    does: ["contributes to a reduction of tiredness and fatigue", "contributes to electrolyte balance", "contributes to normal energy-yielding metabolism", "contributes to normal functioning of the nervous system", "contributes to normal muscle function", "contributes to normal protein synthesis", "contributes to normal psychological function", "contributes to the maintenance of normal bones", "contributes to the maintenance of normal teeth", "has a role in the process of cell division"],
    foods: tableFoods("mg"), foodsNote: TOP_NOTE,
    combine: [],
    much: "EFSA's upper limit, 250 mg a day, is for magnesium salts in supplements, in water or added to foods. Magnesium that is naturally in food has no limit.",
    sources: "EU claims: Regulation (EU) No 432/2012. EFSA: dietary reference values for magnesium (2015); the upper limit, from the Scientific Committee on Food (2001), in EFSA's overview of upper limits. Foods: USDA FoodData Central." },
  { id: "k_", name: "Potassium", also: "", unit: "mg", label: 2000,
    efsa: { men: 3500, women: 3500, kind: "", src: "EFSA, adequate intake" },
    ul: null, ulNone: "EFSA found not enough data to derive one",
    is: "Works with sodium in every cell, in your nerves and muscles. EFSA links low intakes to raised blood pressure and a higher risk of stroke. Legumes, potatoes, fish, meat, fruit and vegetables bring the most.",
    does: ["contributes to normal functioning of the nervous system", "contributes to normal muscle function", "contributes to the maintenance of normal blood pressure"],
    foods: tableFoods("k_"), foodsNote: TOP_NOTE,
    combine: [],
    much: "EFSA found not enough data to derive an upper limit for potassium.",
    sources: "EU claims: Regulation (EU) No 432/2012. EFSA: dietary reference values for potassium (2016), overview of upper limits. Foods: USDA FoodData Central." },
  { id: "zn", name: "Zinc", also: "", unit: "mg", label: 10,
    efsa: { men: 9.4, women: 7.5, kind: "", src: "EFSA, population reference intake at the lowest phytate intake",
      note: "EFSA gives four values, by the phytate you eat, 300 to 1200 mg a day: 9.4 to 16.3 mg for men, 7.5 to 12.7 mg for women. Your day here is the lowest: more whole grains, legumes and seeds raise it." },
    ul: { v: 25, note: "EFSA's upper limit for adults" },
    is: "Works in your immune system, in your skin, hair and nails, and in making protein and DNA. Meat, liver, seeds, legumes and whole grains bring it.",
    does: ["contributes to normal acid-base metabolism", "contributes to normal carbohydrate metabolism", "contributes to normal cognitive function", "contributes to normal DNA synthesis", "contributes to normal fertility and reproduction", "contributes to normal macronutrient metabolism", "contributes to normal metabolism of fatty acids", "contributes to normal metabolism of vitamin A", "contributes to normal protein synthesis", "contributes to the maintenance of normal bones", "contributes to the maintenance of normal hair", "contributes to the maintenance of normal nails", "contributes to the maintenance of normal skin", "contributes to the maintenance of normal testosterone levels in the blood", "contributes to the maintenance of normal vision", "contributes to the normal function of the immune system", "contributes to the protection of cells from oxidative stress", "has a role in the process of cell division"],
    foods: tableFoods("zn"), foodsNote: TOP_NOTE,
    combine: [{ with: "Less phytate: whole grains, legumes, seeds", why: "Phytate holds zinc back. That is why EFSA's value for your day rises with the phytate you eat." }],
    much: "EFSA's upper limit for adults is 25 mg a day, from food and supplements together.",
    sources: "EU claims: Regulation (EU) No 432/2012. EFSA: dietary reference values for zinc (2014); the upper limit, from the Scientific Committee on Food (2002), in EFSA's overview of upper limits. Foods: USDA FoodData Central." },
];
MEMBER_PAGES.push(...MINERALS);

// your day: EFSA's value for your sex; a man's when the profile doesn't say
// kcal: today's energy, for the B vitamins EFSA sets per megajoule (1 kcal = 4.184 kJ); without it, the label's reference
// age: years, for calcium's higher value to 24
export function memberDay(m: MemberPage, sex?: string | null, kcal?: number | null, age?: number | null): { v: number; who: "men" | "women" | "adults" | "energy" | "label" | "young" } {
  if (m.efsa.perMJ) return kcal ? { v: Math.round(m.efsa.perMJ * kcal * 0.004184 * 10) / 10, who: "energy" } : { v: m.label, who: "label" };
  if (m.efsa.young && age != null && age < m.efsa.young.under) return { v: m.efsa.young.v, who: "young" };
  if (m.efsa.men === m.efsa.women) return { v: m.efsa.men, who: "adults" };
  return sex === "female" ? { v: m.efsa.women, who: "women" } : { v: m.efsa.men, who: "men" };
}
export function memberRows(m: MemberPage, day: number): { food: MemberFood; amount: number; share: number }[] {
  return m.foods.map((f) => { const amount = (f.per100 * f.grams) / 100; return { food: f, amount, share: r((100 * amount) / day) }; });
}
