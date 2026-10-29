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

export const FIBRE_DAY = 25;      // g a day, adults (WHO 2023, EFSA)
export const GI_LOW = 55, GI_HIGH = 70;
export const CARB_SCALE_G = 60;   // the members' bars: the same scale for every food

export type CarbFood = {
  id: string; icon: string; name: string; kcal: number; protein: number; carb: number; fibre: number; sugar: number;   // per 100 g
  portion: { label: string; grams: number }; gi: number; giRow: string; src: string; best: string; pair: string;
};

export const CARB_FOODS: CarbFood[] = [
  { id: "oats", icon: "🌾", name: "Oats, dry", kcal: 379, protein: 13.2, carb: 67.7, fibre: 10.1, sugar: 0.99, portion: { label: "50 g", grams: 50 },
    gi: 55, giRow: "Porridge, rolled oats", src: "USDA SR Legacy, FDC 173904, oats, regular and quick, dry",
    best: "Breakfast: cooked as porridge it is low GI, and 50 g brings more than half a lunch's fibre. Instant oats are high GI (79 in the same table).", pair: "Skyr, milk or yogurt: protein, and the lysine oats lack." },
  { id: "rice", icon: "🍚", name: "White rice, boiled", kcal: 130, protein: 2.69, carb: 28.2, fibre: 0.4, sugar: 0.05, portion: { label: "150 g cooked", grams: 150 },
    gi: 73, giRow: "White rice, boiled", src: "USDA SR Legacy, FDC 169757, rice, white, long-grain, cooked",
    best: "A fast carb: around training it refuels quickly. Almost no fibre, so add vegetables or beans to slow it down.", pair: "Lentils or beans: fibre and protein, and together a complete protein." },
  { id: "potato", icon: "🥔", name: "Potatoes, boiled", kcal: 86, protein: 1.71, carb: 20.0, fibre: 1.8, sugar: 0.89, portion: { label: "200 g", grams: 200 },
    gi: 78, giRow: "Potato, boiled", src: "USDA SR Legacy, FDC 170440, potatoes, boiled, flesh",
    best: "Filling for few calories, but high GI. Eat them with protein and vegetables.", pair: "Fish, eggs or quark, and a salad." },
  { id: "bread", icon: "🍞", name: "Wholewheat bread", kcal: 252, protein: 12.4, carb: 42.7, fibre: 6.0, sugar: 4.34, portion: { label: "2 slices, 60 g", grams: 60 },
    gi: 74, giRow: "Whole wheat/whole meal bread", src: "USDA SR Legacy, FDC 172688, bread, whole-wheat",
    best: "Its GI is high, 74, even as wholewheat. The fibre is the reason to choose it: 2 slices bring almost half a lunch's.", pair: "Eggs, cottage cheese or avocado on top." },
  { id: "pasta", icon: "🍝", name: "Pasta, cooked", kcal: 158, protein: 5.8, carb: 30.9, fibre: 1.8, sugar: 0.56, portion: { label: "200 g cooked", grams: 200 },
    gi: 49, giRow: "Spaghetti, white", src: "USDA SR Legacy, FDC 169737, pasta, cooked",
    best: "Low GI for a white carb: the dense pasta digests slowly. Count the portion, though: 200 g is two thirds of a lunch's carbs, so its GL is among the highest here.", pair: "A protein sauce: tuna, chicken, lentils." },
  { id: "lentils", icon: "🫘", name: "Lentils, boiled", kcal: 116, protein: 9.02, carb: 20.1, fibre: 7.9, sugar: 1.8, portion: { label: "200 g", grams: 200 },
    gi: 32, giRow: "Lentils", src: "USDA SR Legacy, FDC 172421, lentils, boiled",
    best: "The steadiest carb here: lowest GI and the most fibre. 200 g covers a lunch's fibre nearly twice and brings protein too.", pair: "Rice: together a complete protein." },
  { id: "banana", icon: "🍌", name: "Banana", kcal: 89, protein: 1.09, carb: 22.8, fibre: 2.6, sugar: 12.2, portion: { label: "1 medium, 120 g", grams: 120 },
    gi: 51, giRow: "Banana, raw", src: "USDA SR Legacy, FDC 173944, bananas, raw",
    best: "Before or after training: quick, easy carbs. Its sugar is in the fruit, not free sugar.", pair: "Yogurt or skyr, or a handful of nuts." },
  { id: "apple", icon: "🍎", name: "Apple", kcal: 52, protein: 0.26, carb: 13.8, fibre: 2.4, sugar: 10.4, portion: { label: "1 medium, 180 g", grams: 180 },
    gi: 36, giRow: "Apple, raw", src: "USDA SR Legacy, FDC 171688, apples, raw, with skin",
    best: "A snack with fibre and low GI: whole, with the skin. Juice loses the fibre and counts as free sugar.", pair: "Cheese, nuts or yogurt." },
];

export type CarbMember = "starch" | "sugar" | "fibre";
export const CARB_MEMBERS: { id: CarbMember; name: string }[] = [{ id: "starch", name: "Starch and other carbs" }, { id: "sugar", name: "Sugars" }, { id: "fibre", name: "Fibre" }];
const r = (x: number, d: number) => Math.round(x * 10 ** d) / 10 ** d;

export type CarbCard = {
  food: CarbFood; pd: number;
  carb: number; closes: number;            // g in the portion, % of the meal's carbs
  fibre: number; fibreMeal: number;        // g in the portion, the meal's share of 25 g a day
  sugar: number;                           // g in the portion
  members: Record<CarbMember, number>;     // g in the portion
  mostly: "starch" | "sugars";
  gl: number; band: "low" | "high" | "in between";
};
// one food, one portion, against a meal of `mealCarb` g of carbs that is `share` of the day
export function carbCardOf(f: CarbFood, mealCarb: number, share: number): CarbCard {
  const k = f.portion.grams / 100, starch = Math.max(0, f.carb - f.sugar - f.fibre);
  const carb = r(f.carb * k, 1);
  return { food: f, pd: r((100 * f.protein) / f.kcal, 1), carb, closes: Math.round((100 * carb) / mealCarb),
    fibre: r(f.fibre * k, 1), fibreMeal: r(FIBRE_DAY * share, 1), sugar: r(f.sugar * k, 1),
    members: { starch: r(starch * k, 2), sugar: r(f.sugar * k, 2), fibre: r(f.fibre * k, 2) }, mostly: starch >= f.sugar ? "starch" : "sugars",
    gl: Math.round((f.gi * (f.carb - f.fibre) * k) / 100), band: f.gi <= GI_LOW ? "low" : f.gi >= GI_HIGH ? "high" : "in between" };
}
