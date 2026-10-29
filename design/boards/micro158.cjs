// DT158 (Milan 29 October 16:16 to 17:42): Explorer, Micros. USDA rows per 100 g read on getfoodfacts.com with FDC ids (SR Legacy;
// milk is the Foundation row, salmon the cooked SR row: the raw page wouldn't open). EU NRVs: Regulation (EU) No 1169/2011, Annex
// XIII, Part A, read in the Irish food authority's copy and the legislation.gov.uk copy. Claims: source of = 15 % of the NRV per
// 100 g (Annex XIII Part A point 2), high = twice that (Regulation 1924/2006, as the European Commission lists it).
const NRV = { a: 800, d: 5, e: 12, k: 75, c: 80, b12: 2.5, fol: 200, ca: 800, fe: 14, mg: 375, k_: 2000, zn: 10 };
const M = [
  { id: "a", name: "Vitamin A", unit: "µg", group: "fat" }, { id: "d", name: "Vitamin D", unit: "µg", group: "fat" }, { id: "e", name: "Vitamin E", unit: "mg", group: "fat" }, { id: "k", name: "Vitamin K", unit: "µg", group: "fat" },
  { id: "c", name: "Vitamin C", unit: "mg", group: "water" }, { id: "b12", name: "Vitamin B12", unit: "µg", group: "water" }, { id: "fol", name: "Folate", unit: "µg", group: "water" },
  { id: "ca", name: "Calcium", unit: "mg", group: "min" }, { id: "fe", name: "Iron", unit: "mg", group: "min" }, { id: "mg", name: "Magnesium", unit: "mg", group: "min" }, { id: "k_", name: "Potassium", unit: "mg", group: "min" }, { id: "zn", name: "Zinc", unit: "mg", group: "min" },
];
const F = {
  salmon:  { name: "Salmon", icon: "🐟", kcal: 206, p: 22.1, g: 150, portion: "150 g, cooked", src: "USDA SR Legacy, FDC 175168, salmon, Atlantic, farmed, cooked, dry heat", v: { a: 69, d: 13.1, e: 1.14, k: 0.1, c: 3.7, b12: 2.8, fol: 34, ca: 15, fe: 0.34, mg: 30, k_: 384, zn: 0.43 },
    best: "Twice a week: one of the few foods with real vitamin D, and more than a day of B12.", pair: "Potatoes or rice, and greens." },
  egg:     { name: "Egg", icon: "🥚", kcal: 143, p: 12.6, g: 100, portion: "2 eggs, 100 g", src: "USDA SR Legacy, FDC 171287, egg, whole, raw", v: { a: 160, d: 2.0, e: 1.05, k: 0.3, c: 0, b12: 0.89, fol: 47, ca: 56, fe: 1.75, mg: 12, k_: 138, zn: 1.29 },
    best: "A little of almost everything: B12, vitamin A and D, folate. The yolk carries them.", pair: "Spinach or peppers: the vitamin C and K eggs lack." },
  spinach: { name: "Spinach, raw", icon: "🥬", kcal: 23, p: 2.86, g: 60, portion: "A big handful, 60 g", src: "USDA SR Legacy, FDC 168462, spinach, raw", v: { a: 469, d: 0, e: 2.03, k: 483, c: 28.1, b12: 0, fol: 194, ca: 99, fe: 2.71, mg: 79, k_: 558, zn: 0.53 },
    best: "Vitamin K for days, folate and vitamin A, for almost no energy. Some fat in the meal helps take up A and K.", pair: "Eggs, salmon or a little olive oil." },
  lentils: { name: "Lentils, boiled", icon: "🫘", kcal: 116, p: 9.02, g: 200, portion: "200 g", src: "USDA SR Legacy, FDC 172421, lentils, boiled", v: { a: 0, d: 0, e: 0.11, k: 1.7, c: 1.5, b12: 0, fol: 181, ca: 19, fe: 3.33, mg: 36, k_: 369, zn: 1.27 },
    best: "Folate for the whole day and plant iron. Vitamin C in the same meal helps take up the iron.", pair: "Red peppers or tomatoes: vitamin C for the iron." },
  milk:    { name: "Milk, 1 %", icon: "🥛", kcal: 43, p: 3.38, g: 250, portion: "A glass, 250 ml", src: "USDA Foundation, FDC 746772, milk, lowfat, 1 %, with added vitamins A and D", v: { a: 58, d: 1.06, e: 0.02, k: null, c: null, b12: 0.61, fol: 2, ca: 126, fe: 0, mg: 12, k_: 159, zn: 0.43 },
    best: "Calcium and B12 in a glass. This row has vitamin D added, as some milk does.", pair: "Oats or a banana." },
  almonds: { name: "Almonds", icon: "🥜", kcal: 579, p: 21.1, g: 30, portion: "A handful, 30 g", src: "USDA SR Legacy, FDC 170567, almonds", v: { a: 0, d: 0, e: 25.6, k: 0, c: 0, b12: 0, fol: 44, ca: 269, fe: 3.71, mg: 270, k_: 733, zn: 3.12 },
    best: "Vitamin E and magnesium: a handful covers about two thirds of a day's vitamin E.", pair: "Yogurt or fruit." },
  pepper:  { name: "Red pepper", icon: "🫑", kcal: 26, p: 0.99, g: 120, portion: "1 medium, 120 g", src: "USDA SR Legacy, FDC 170108, peppers, sweet, red, raw", v: { a: 157, d: 0, e: 1.58, k: 4.9, c: 128, b12: 0, fol: 46, ca: 7, fe: 0.43, mg: 12, k_: 211, zn: 0.25 },
    best: "Vitamin C for about two days in one pepper. Raw keeps the most.", pair: "Lentils, beans or beef: its vitamin C helps take up their iron." },
  beef:    { name: "Beef, lean, cooked", icon: "🥩", kcal: 230, p: 28.4, g: 125, portion: "125 g, cooked", src: "USDA SR Legacy, FDC 171794, beef, ground, 90 % lean, pan-browned", v: { a: 3, d: 0, e: 0.12, k: 1.2, c: 0, b12: 2.8, fol: 8, ca: 16, fe: 3.08, mg: 27, k_: 433, zn: 6.84 },
    best: "More than a day of B12, most of the day's zinc, and iron the body takes up well.", pair: "Peppers and greens." },
};
const r = (x, d = 0) => Math.round(x * 10 ** d) / 10 ** d;
module.exports = () => Object.fromEntries(Object.entries(F).map(([k, f]) => { const s = f.g / 100;
  const pct = Object.fromEntries(M.map((m) => [m.id, f.v[m.id] === null ? null : r(100 * f.v[m.id] * s / NRV[m.id])]));
  const amt = Object.fromEntries(M.map((m) => [m.id, f.v[m.id] === null ? null : f.v[m.id] * s]));
  const per100 = Object.fromEntries(M.map((m) => [m.id, f.v[m.id] === null ? null : 100 * f.v[m.id] / NRV[m.id]]));
  const top = M.filter((m) => pct[m.id] !== null && pct[m.id] >= 33).sort((a, b) => pct[b.id] - pct[a.id]);
  const claims = M.filter((m) => per100[m.id] !== null && per100[m.id] >= 15).map((m) => ({ name: m.name, high: per100[m.id] >= 30 }));
  return [k, { ...f, k, pd: r(100 * f.p / f.kcal, 1), pct, amt, top, claims }];
}));
module.exports.M = M; module.exports.NRV = NRV;
if (require.main === module) for (const [k, v] of Object.entries(module.exports())) console.log(k.padEnd(8), "top:", v.top.map((m) => m.name + " " + v.pct[m.id] + "%").join(", "), "| claims:", v.claims.map((c) => (c.high ? "High " : "Source of ") + c.name).join(", "));
