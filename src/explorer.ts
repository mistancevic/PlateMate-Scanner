// DT151 (0.2.133, canvas Page 2, board Stories103 version 11; Coach Milan 29 October 09:41 to 12:04): Explorer, Not all proteins
// are equal. The MVP for the pitch to new beta testers, a link in the Menu below Foods. Protein is the family, the amino acids
// its members (Milan 12:32 and 12:33); each food brings them in its own mix. Each food is one normal portion against one meal: how much
// of the meal's protein it closes, what it brings for muscle protein synthesis, the nine in grams, two quality scores, how to
// use it, and where every number comes from.
//
// Sources (checked 29 October 2026). Amino acids, protein and energy per 100 g: USDA FoodData Central, the row named in
// `src`, read on getfoodfacts.com with its FDC id (DT154, 15:04: triagemethod.com was dropped, it mixes Australian, Foundation
// and SR values; egg moved to SR 171287, Greek yogurt is the Foundation row 330137, SR has no amino acids for it); whey has no USDA amino acid row: a typical label for the nine, cysteine and tyrosine in the proportions of the whey
// concentrate analysed by Hamarsland 2017 (BMC Nutrition). Need per gram of protein: WHO, FAO and UNU 2007, adults. 2.5 g of
// leucine and about 10 g of essential amino acids a meal: the amounts research most often cites for muscle protein synthesis.
// PDCAAS (adult pattern) and DIAAS (as published, pattern for children 0.5 to 3): Hertzler 2020, Nutrients 12:3704, Table 2,
// read in full on 29 October 2026 (Milan 12:32: "we need confirmation from the papers"). One source for every score, because
// DIAAS varies by study: whey 0.85 (Herreman 2020, Table 2), 0.90 (Hertzler 2020), 1.09 (Phillips 2017, Table 1). Egg, chicken
// and salmon have no score we could read in a paper yet: they say none yet. Taken out on 29 October: Boye 2012 (egg, chicken
// PDCAAS), Phillips 2017 credited for egg and chicken DIAAS (neither is in its table), Ertl 2016 (feed, not food), Rutherfurd
// 2015 (oats; full text not open).

export type AA = "his" | "ile" | "leu" | "lys" | "met" | "cys" | "phe" | "tyr" | "thr" | "trp" | "val";
// the nine as the body counts them: methionine with cysteine, phenylalanine with tyrosine (WHO 2007)
export type Nine = "his" | "ile" | "leu" | "lys" | "saa" | "aaa" | "thr" | "trp" | "val";
export const NINE: { id: Nine; name: string }[] = [
  { id: "his", name: "Histidine" }, { id: "ile", name: "Isoleucine" }, { id: "leu", name: "Leucine" }, { id: "lys", name: "Lysine" },
  { id: "saa", name: "Methionine + cysteine" }, { id: "aaa", name: "Phenylalanine + tyrosine" }, { id: "thr", name: "Threonine" },
  { id: "trp", name: "Tryptophan" }, { id: "val", name: "Valine" },
];
// WHO, FAO and UNU 2007, adults: mg per g of protein
export const PATTERN: Record<Nine, number> = { his: 15, ile: 30, leu: 59, lys: 45, saa: 22, aaa: 38, thr: 23, trp: 6, val: 39 };
export const LEUCINE_MEAL = 2.5, EAA_MEAL = 10;   // g a meal, for muscle protein synthesis
export const SCALE_G = 3.5;                         // the family's bars: the same scale for every food
export const LOWEST_CLOSE = 1.15;                   // its lowest is named when it covers the need by less than 15 %

export type Score = { value: number; src: string } | null;
export type ExplorerFood = {
  id: string; icon: string; name: string; kcal: number; protein: number;   // per 100 g
  portion: { label: string; grams: number };
  aa: Record<AA, number>;                                                    // g per 100 g
  pdcaas: Score; diaas: Score; src: string;
  best: string; pair: string;
};

export const EXPLORER_FOODS: ExplorerFood[] = [
  { id: "whey", icon: "🥤", name: "Whey protein powder", kcal: 370, protein: 90, portion: { label: "One scoop, 30 g", grams: 30 },
    aa: { his: 1.70, ile: 6.20, leu: 11.0, lys: 9.50, met: 2.10, cys: 2.26, phe: 3.00, tyr: 2.26, thr: 6.80, trp: 1.70, val: 5.70 },
    pdcaas: { value: 1.00, src: "Hertzler 2020, adults" }, diaas: { value: 0.90, src: "Hertzler 2020" },
    src: "a typical whey label; cysteine and tyrosine from Hamarsland 2017 (BMC Nutrition). Your own brand's label replaces it",
    best: "After training: one scoop in water or milk. Fast to digest and the most leucine per gram, so it starts muscle building quickest. Also lifts a breakfast short of protein.",
    pair: "Nothing: it is complete." },
  { id: "chicken", icon: "🍗", name: "Chicken breast", kcal: 120, protein: 22.3, portion: { label: "150 g", grams: 150 },
    aa: { his: 0.830, ile: 1.096, leu: 1.837, lys: 2.148, met: 0.578, cys: 0.237, phe: 0.889, tyr: 0.800, thr: 0.993, trp: 0.267, val: 1.141 },
    pdcaas: null, diaas: null,
    src: "USDA SR Legacy 05062, breast, raw",
    best: "The anchor of a main meal: 150 g brings most lunches and dinners to their protein. Lean, so the PD stays high whatever goes with it.",
    pair: "Nothing: it is complete." },
  { id: "yogurt", icon: "🥣", name: "Greek yogurt, 0 %", kcal: 61, protein: 10.3, portion: { label: "200 g", grams: 200 },
    aa: { his: 0.29, ile: 0.53, leu: 1.03, lys: 0.83, met: 0.29, cys: 0.083, phe: 0.51, tyr: 0.51, thr: 0.41, trp: 0.13, val: 0.67 },
    pdcaas: { value: 1.00, src: "Hertzler 2020, milk, adults" }, diaas: { value: 1.08, src: "Hertzler 2020, milk" },
    src: "USDA Foundation, FDC 330137, Greek yogurt, plain, nonfat",
    best: "Breakfast or before sleep: its casein digests slowly and feeds amino acids for hours. Lifts oats and fruit to your PD.",
    pair: "Nothing: it is complete. It lifts oats and fruit." },
  { id: "salmon", icon: "🐟", name: "Salmon", kcal: 208, protein: 20.4, portion: { label: "150 g", grams: 150 },
    aa: { his: 0.540, ile: 0.959, leu: 1.610, lys: 1.870, met: 0.621, cys: 0.209, phe: 0.840, tyr: 0.750, thr: 0.861, trp: 0.199, val: 1.100 },
    pdcaas: null, diaas: null,
    src: "USDA SR Legacy 15236, Atlantic, farmed, raw",
    best: "Twice a week as a main meal: protein plus the omega-3 fats. Its own fat lowers the PD, so add vegetables, not more fat.",
    pair: "Nothing: it is complete. Its fat is the good kind." },
  { id: "soy", icon: "🫘", name: "Soybeans, boiled", kcal: 172, protein: 18.2, portion: { label: "150 g", grams: 150 },
    aa: { his: 0.45, ile: 0.81, leu: 1.35, lys: 1.11, met: 0.22, cys: 0.27, phe: 0.87, tyr: 0.63, thr: 0.72, trp: 0.24, val: 0.83 },
    pdcaas: { value: 1.00, src: "Hertzler 2020, adults" }, diaas: { value: 0.92, src: "Hertzler 2020" },
    src: "USDA SR Legacy, FDC 174271, soybeans, boiled",
    best: "The plant anchor: the most complete plant protein, as tofu, edamame or beans. 150 g brings as much protein as a scoop of whey.",
    pair: "Nothing for its amino acids: complete for an adult. Rice or bread adds the protein to close the meal." },
  { id: "egg", icon: "🥚", name: "Egg", kcal: 143, protein: 12.6, portion: { label: "2 eggs, 100 g", grams: 100 },
    aa: { his: 0.31, ile: 0.67, leu: 1.09, lys: 0.91, met: 0.38, cys: 0.27, phe: 0.68, tyr: 0.50, thr: 0.56, trp: 0.17, val: 0.86 },
    pdcaas: null, diaas: null,
    src: "USDA SR Legacy, FDC 171287, egg, whole, raw",
    best: "Breakfast, or to complete a plant meal. Two eggs are a third of a meal's protein, so add a third egg or egg whites, which also raise the PD.",
    pair: "Nothing: the reference protein. Half its energy is the yolk's fat." },
  { id: "lentils", icon: "🫘", name: "Lentils, boiled", kcal: 116, protein: 9.02, portion: { label: "200 g", grams: 200 },
    aa: { his: 0.25, ile: 0.39, leu: 0.65, lys: 0.63, met: 0.077, cys: 0.12, phe: 0.45, tyr: 0.24, thr: 0.32, trp: 0.081, val: 0.45 },
    pdcaas: { value: 0.80, src: "Hertzler 2020, adults" }, diaas: { value: 0.75, src: "Hertzler 2020" },
    src: "USDA SR Legacy, FDC 172421, lentils, boiled",
    best: "A plant lunch with rice: together complete, and the fibre keeps you full for hours. Count it as protein and carb together.",
    pair: "Rice completes it: rice has the methionine lentils lack, lentils the lysine rice lacks." },
  { id: "oats", icon: "🌾", name: "Oats, dry", kcal: 379, protein: 13.2, portion: { label: "50 g", grams: 50 },
    aa: { his: 0.28, ile: 0.50, leu: 0.98, lys: 0.64, met: 0.21, cys: 0.46, phe: 0.67, tyr: 0.40, thr: 0.38, trp: 0.18, val: 0.69 },
    pdcaas: { value: 0.62, src: "Hertzler 2020, adults" }, diaas: { value: 0.44, src: "Hertzler 2020" },
    src: "USDA SR Legacy, FDC 173904, oats, regular and quick, dry",
    best: "A breakfast carb, not a protein: 50 g gives 7 g protein. Cook it in milk or top it with skyr, which brings the lysine and the PD up.",
    pair: "Milk, skyr or yogurt completes it: dairy has the lysine oats lack." },
];

const nineOf = (a: Record<AA, number>): Record<Nine, number> => ({ his: a.his, ile: a.ile, leu: a.leu, lys: a.lys, saa: a.met + a.cys, aaa: a.phe + a.tyr, thr: a.thr, trp: a.trp, val: a.val });
const r = (x: number, d: number) => Math.round(x * 10 ** d) / 10 ** d;

export type ExplorerCard = {
  food: ExplorerFood; pd: number;
  protein: number; closes: number;          // g in the portion, % of the meal's protein
  eaa: number; leucine: number;             // g in the portion
  family: Record<Nine, number>;             // g in the portion
  perGram: Record<Nine, number>;            // per gram of protein, against the WHO need
  lowest: { id: Nine; name: string; cover: number } | null;   // only when it covers the need by less than 15 %
};
// one food, one portion, against a meal of `mealProtein` g
export function cardOf(f: ExplorerFood, mealProtein: number): ExplorerCard {
  const k = f.portion.grams / 100, n = nineOf(f.aa);
  const family = Object.fromEntries(NINE.map(({ id }) => [id, r(n[id] * k, 2)])) as Record<Nine, number>;
  const perGram = Object.fromEntries(NINE.map(({ id }) => [id, r((n[id] * 1000 / f.protein) / PATTERN[id], 2)])) as Record<Nine, number>;
  const low = NINE.map((x) => ({ ...x, cover: perGram[x.id] })).sort((a, b) => a.cover - b.cover)[0];
  // the essential amino acids as research counts them: the nine, methionine and phenylalanine without their partners
  const eaa = (["his", "ile", "leu", "lys", "met", "phe", "thr", "trp", "val"] as AA[]).reduce((t, x) => t + f.aa[x] * k, 0);
  const protein = r(f.protein * k, 1);
  return { food: f, pd: r((100 * f.protein) / f.kcal, 1), protein, closes: Math.round((100 * protein) / mealProtein), eaa: r(eaa, 1), leucine: r(f.aa.leu * k, 1), family, perGram,
    lowest: low.cover < LOWEST_CLOSE ? { id: low.id, name: low.name, cover: low.cover } : null };
}
