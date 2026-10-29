// DT155 (0.2.136, canvas Page 2, board Stories107; Coach Milan 29 October 15:30 and 15:41): Explorer, Not all carbs are equal,
// the same template as Protein (src/explorer.ts) and Fats (src/explorerFats.ts). Carbohydrate is the family; its members are
// starch, sugars and fibre, and they reach the blood at different speeds. Each food is one normal portion against one meal: how
// much of the meal's carbs it brings, fibre against the meal's share of the day, sugars, the members in grams, GI and GL, how to
// use it, and where every number comes from.
//
// Sources (read 29 October 2026). Carbohydrate (by difference), fibre and sugars per 100 g: USDA FoodData Central, SR Legacy,
// the row in `src`, read on getfoodfacts.com with its FDC id. Starch and other carbs: carbohydrate minus sugars minus fibre,
// calculated, because SR doesn't report starch for every food. GI (glucose = 100): Atkinson, Foster-Powell and Brand-Miller
// 2008, International Tables of Glycemic Index and Glycemic Load Values, Diabetes Care 31(12):2281, Table 1, "the average GI of
// 62 common foods derived from multiple studies", read in full; `giRow` is the row as the table names it. GL: "the product of the
// amount of available carbohydrate in a specified serving size and the GI value ... divided by 100", the paper's method, with
// available carbohydrate = carbohydrate minus fibre. The paper calls 55 or less low and 70 or more high, and gives no GL bands,
// so the page names none. Fibre, at least 25 g a day for adults: WHO 2023, Carbohydrate intake for adults and children, and
// EFSA 2017 summary report (25 g a day, adequate intake). Free sugars under 10 % of energy: WHO 2015, Sugars intake for adults
// and children.

// DT157 (0.3.1, board Stories109; Milan 16:29 to 17:42): fibre in two kinds. The share of soluble fibre: Li, Andrews and Pehrsson
// 2002 (USDA), Individual sugars, soluble, and insoluble dietary fiber contents of 70 high consumption foods, J Food Comp Anal
// 15:715, Table 1, g per 100 g as eaten, AOAC 991.43, read in full. Its totals differ from the USDA rows above, so the page applies
// its share (soluble over soluble plus insoluble) to the card's fibre and says so. White rice: the table writes F for soluble,
// read as none found. Dry oats are not in it: the card says so, and carries the EU health claim for oat beta-glucan instead
// (Regulation (EU) No 432/2012, Annex, as the European Commission's EU Register lists it).
export type FibreSplit = { row: string; soluble: number; insoluble: number; noneFound?: boolean };

export const FIBRE_DAY = 25;      // g a day, adults (WHO 2023, EFSA)
export const GI_LOW = 55, GI_HIGH = 70;
export const CARB_SCALE_G = 60;   // the members' bars: the same scale for every food

export type CarbFood = {
  id: string; icon: string; name: string; kcal: number; protein: number; carb: number; fibre: number; sugar: number;   // per 100 g
  portion: { label: string; grams: number }; gi: number; giRow: string; src: string; best: string; pair: string;
  split: FibreSplit | null; betaGlucan?: boolean;
};

import { rowOf } from "./foodTable";
const fromTable = (id: string) => { const r = rowOf(id); return { icon: r.icon, name: r.name, kcal: r.kcal, protein: r.protein, carb: r.carb!, fibre: r.fibre!, sugar: r.sugar!, portion: r.portion, src: r.src }; };
// DT164 (0.3.6): the numbers, name, icon and portion come from the shared food table (src/foodTable.ts); only what this family
// says about a food is written here
type Extra = Omit<CarbFood, "icon" | "name" | "kcal" | "protein" | "carb" | "fibre" | "sugar" | "portion" | "src">;
const EXTRAS: Extra[] = [
  { id: "oats", gi: 55, giRow: "Porridge, rolled oats", split: null, betaGlucan: true, best: "Breakfast: cooked as porridge it is low GI, and 50 g brings more than half a lunch's fibre. Instant oats are high GI (79 in the same table).", pair: "Skyr, milk or yogurt: protein, and the lysine oats lack." },
  { id: "rice", gi: 73, giRow: "White rice, boiled", split: {"row": "White rice, long grain, cooked", "soluble": 0, "insoluble": 0.34, "noneFound": true}, best: "A fast carb: around training it refuels quickly. Almost no fibre, so add vegetables or beans to slow it down.", pair: "Lentils or beans: fibre and protein, and together a complete protein." },
  { id: "potato", gi: 78, giRow: "Potato, boiled", split: {"row": "Potato, white, boiled, w/o skin", "soluble": 0.99, "insoluble": 1.06}, best: "Filling for few calories, but high GI. Eat them with protein and vegetables.", pair: "Fish, eggs or quark, and a salad." },
  { id: "bread", gi: 74, giRow: "Whole wheat/whole meal bread", split: {"row": "Bread, whole wheat, soft", "soluble": 1.26, "insoluble": 4.76}, best: "Its GI is high, 74, even as wholewheat. The fibre is the reason to choose it: 2 slices bring almost half a lunch's.", pair: "Eggs, cottage cheese or avocado on top." },
  { id: "pasta", gi: 49, giRow: "Spaghetti, white", split: {"row": "Spaghetti, cooked", "soluble": 0.54, "insoluble": 1.33}, best: "Low GI for a white carb: the dense pasta digests slowly. Count the portion, though: 200 g is two thirds of a lunch's carbs, so its GL is among the highest here.", pair: "A protein sauce: tuna, chicken, lentils." },
  { id: "lentils", gi: 32, giRow: "Lentils", split: {"row": "Lentils, dry, cooked, drained", "soluble": 0.44, "insoluble": 5.42}, best: "The steadiest carb here: lowest GI and the most fibre. 200 g covers a lunch's fibre nearly twice and brings protein too.", pair: "Rice: together a complete protein." },
  { id: "banana", gi: 51, giRow: "Banana, raw", split: {"row": "Bananas, raw, ripe", "soluble": 0.58, "insoluble": 1.21}, best: "Before or after training: quick, easy carbs. Its sugar is in the fruit, not free sugar.", pair: "Yogurt or skyr, or a handful of nuts." },
  { id: "apple", gi: 36, giRow: "Apple, raw", split: {"row": "Apple (Red delicious), raw, ripe w/skin", "soluble": 0.67, "insoluble": 1.54}, best: "A snack with fibre and low GI: whole, with the skin. Juice loses the fibre and counts as free sugar.", pair: "Cheese, nuts or yogurt." },
];
export const CARB_FOODS: CarbFood[] = EXTRAS.map((x) => ({ ...fromTable(x.id), ...x }));

export type CarbMember = "starch" | "sugar" | "fibre" | "soluble" | "insoluble";
export const CARB_MEMBERS: { id: CarbMember; name: string; under?: boolean }[] = [{ id: "starch", name: "Starch and other carbs" }, { id: "sugar", name: "Sugars" }, { id: "fibre", name: "Fibre" },
  { id: "soluble", name: "of it, soluble", under: true }, { id: "insoluble", name: "of it, insoluble", under: true }];
const r = (x: number, d: number) => Math.round(x * 10 ** d) / 10 ** d;

export type CarbCard = {
  food: CarbFood; pd: number;
  carb: number; closes: number;            // g in the portion, % of the meal's carbs
  fibre: number; fibreMeal: number;        // g in the portion, the meal's share of 25 g a day
  sugar: number;                           // g in the portion
  members: Record<CarbMember, number | null>;   // g in the portion; soluble and insoluble null without a split
  solubleShare: number | null;                  // of the fibre, from the split
  mostly: "starch" | "sugars";
  gl: number; band: "low" | "high" | "in between";
};
// one food, one portion, against a meal of `mealCarb` g of carbs that is `share` of the day
export function carbCardOf(f: CarbFood, mealCarb: number, share: number): CarbCard {
  const k = f.portion.grams / 100, starch = Math.max(0, f.carb - f.sugar - f.fibre);
  const solShare = f.split ? f.split.soluble / (f.split.soluble + f.split.insoluble) : null;
  const carb = r(f.carb * k, 1);
  return { food: f, pd: r((100 * f.protein) / f.kcal, 1), carb, closes: Math.round((100 * carb) / mealCarb),
    fibre: r(f.fibre * k, 1), fibreMeal: r(FIBRE_DAY * share, 1), sugar: r(f.sugar * k, 1),
    members: { starch: r(starch * k, 2), sugar: r(f.sugar * k, 2), fibre: r(f.fibre * k, 2), soluble: solShare === null ? null : r(f.fibre * k * solShare, 2), insoluble: solShare === null ? null : r(f.fibre * k * (1 - solShare), 2) },
    solubleShare: solShare === null ? null : r(solShare, 2), mostly: starch >= f.sugar ? "starch" : "sugars",
    gl: Math.round((f.gi * (f.carb - f.fibre) * k) / 100), band: f.gi <= GI_LOW ? "low" : f.gi >= GI_HIGH ? "high" : "in between" };
}
