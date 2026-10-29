// DT155 (Milan 29 October 15:30): Explorer, Carbs. USDA SR Legacy rows per 100 g, read on getfoodfacts.com with FDC ids.
// GI: Atkinson, Foster-Powell, Brand-Miller 2008, International Tables of Glycemic Index and Glycemic Load Values, Diabetes Care
// 31(12), Table 1 (mean of studies, glucose = 100). GL per portion calculated by the paper's method: GI x available carbohydrate
// (carbohydrate by difference minus fibre) / 100. Starch and other carbs: carbohydrate minus sugars minus fibre, calculated.
const F = {
  oats:    { name: "Oats, dry", icon: "🌾", kcal: 379, p: 13.2, carb: 67.7, fibre: 10.1, sugar: 0.99, g: 50, portion: "50 g", gi: 55, giRow: "Porridge, rolled oats", src: "USDA SR Legacy, FDC 173904, oats, regular and quick, dry",
    best: "Breakfast: cooked as porridge it is low GI, and 50 g brings more than half a lunch's fibre. Instant oats are high GI (79 in the same table).", pair: "Skyr, milk or yogurt: protein, and the lysine oats lack." },
  rice:    { name: "White rice, boiled", icon: "🍚", kcal: 130, p: 2.69, carb: 28.2, fibre: 0.4, sugar: 0.05, g: 150, portion: "150 g cooked", gi: 73, giRow: "White rice, boiled", src: "USDA SR Legacy, FDC 169757, rice, white, long-grain, cooked",
    best: "A fast carb: around training it refuels quickly. Almost no fibre, so add vegetables or beans to slow it down.", pair: "Lentils or beans: fibre and protein, and together a complete protein." },
  potato:  { name: "Potatoes, boiled", icon: "🥔", kcal: 86, p: 1.71, carb: 20.0, fibre: 1.8, sugar: 0.89, g: 200, portion: "200 g", gi: 78, giRow: "Potato, boiled", src: "USDA SR Legacy, FDC 170440, potatoes, boiled, flesh",
    best: "Filling for few calories, but high GI. Eat them with protein and vegetables, or cooled as potato salad.", pair: "Fish, eggs or quark, and a salad." },
  bread:   { name: "Wholewheat bread", icon: "🍞", kcal: 252, p: 12.4, carb: 42.7, fibre: 6.0, sugar: 4.34, g: 60, portion: "2 slices, 60 g", gi: 74, giRow: "Whole wheat/whole meal bread", src: "USDA SR Legacy, FDC 172688, bread, whole-wheat",
    best: "Its GI is high, 74, even as wholewheat. The fibre is the reason to choose it: 2 slices bring almost half a lunch's.", pair: "Eggs, cottage cheese or avocado on top." },
  pasta:   { name: "Pasta, cooked", icon: "🍝", kcal: 158, p: 5.8, carb: 30.9, fibre: 1.8, sugar: 0.56, g: 200, portion: "200 g cooked", gi: 49, giRow: "Spaghetti, white", src: "USDA SR Legacy, FDC 169737, pasta, cooked",
    best: "Low GI for a white carb: the dense pasta digests slowly. Count the portion, though: 200 g is two thirds of a lunch's carbs, so its GL, 29, is among the highest here.", pair: "A protein sauce: tuna, chicken, lentils." },
  lentils: { name: "Lentils, boiled", icon: "🫘", kcal: 116, p: 9.02, carb: 20.1, fibre: 7.9, sugar: 1.8, g: 200, portion: "200 g", gi: 32, giRow: "Lentils", src: "USDA SR Legacy, FDC 172421, lentils, boiled",
    best: "The steadiest carb here: lowest GI and the most fibre. 200 g covers a lunch's fibre nearly twice and brings protein too.", pair: "Rice: together a complete protein." },
  banana:  { name: "Banana", icon: "🍌", kcal: 89, p: 1.09, carb: 22.8, fibre: 2.6, sugar: 12.2, g: 120, portion: "1 medium, 120 g", gi: 51, giRow: "Banana, raw", src: "USDA SR Legacy, FDC 173944, bananas, raw",
    best: "Before or after training: quick, easy carbs. Its sugar is in the fruit, not free sugar.", pair: "Yogurt or skyr, or a handful of nuts." },
  apple:   { name: "Apple", icon: "🍎", kcal: 52, p: 0.26, carb: 13.8, fibre: 2.4, sugar: 10.4, g: 180, portion: "1 medium, 180 g", gi: 36, giRow: "Apple, raw", src: "USDA SR Legacy, FDC 171688, apples, raw, with skin",
    best: "A snack with fibre and low GI: whole, with the skin. Juice loses the fibre and counts as free sugar.", pair: "Cheese, nuts or yogurt." },
};
const r = (x, d = 1) => Math.round(x * 10 ** d) / 10 ** d;
const FIBRE_DAY = 25;
module.exports = (mealCarb, mealShare) => Object.fromEntries(Object.entries(F).map(([k, f]) => { const s = f.g / 100;
  const avail = (f.carb - f.fibre) * s, starch = Math.max(0, f.carb - f.sugar - f.fibre);
  return [k, { ...f, k, pd: r(100 * f.p / f.kcal), carbP: r(f.carb * s), closes: Math.round(100 * f.carb * s / mealCarb), mealCarb,
    fibreP: r(f.fibre * s), fibreMeal: r(FIBRE_DAY * mealShare), sugarP: r(f.sugar * s, 1),
    mem: { starch: r(starch * s, 2), sugar: r(f.sugar * s, 2), fibre: r(f.fibre * s, 2) }, gl: Math.round(f.gi * avail / 100), band: f.gi <= 55 ? "low" : f.gi >= 70 ? "high" : "between low and high" }];
}));
if (require.main === module) for (const [k, v] of Object.entries(module.exports(94, 1 / 3))) console.log(k.padEnd(8), v.carbP, v.closes + "%", "fibre " + v.fibreP + "/" + v.fibreMeal, "GI " + v.gi + " " + v.band, "GL " + v.gl, JSON.stringify(v.mem));
