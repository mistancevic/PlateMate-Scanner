// DT154 (Milan 29 October 14:47 and 14:48): Explorer, Fats. Omega-6 is linoleic acid, n-6 cis,cis where USDA gives it (butter, egg, cheddar), else total 18:2. USDA SR Legacy rows per 100 g, read on getfoodfacts.com (FDC ids),
// salmon SR 15236 via bodbot and recipal, olive oil via nutritiondatahub. 18:3 is total 18:3 as USDA reports it (no separate ALA row).
const F = {
  olive:   { name: "Olive oil", icon: "🫒", kcal: 884, p: 0, fat: 100, sfa: 13.8, mufa: 73.0, pufa: 10.5, trans: null, la: 9.76, n3: 0.76, epa: 0, dha: 0, dpa: 0, g: 14, portion: "1 tablespoon, 14 g", src: "USDA SR Legacy 04053, oil, olive, salad or cooking" },
  butter:  { name: "Butter", icon: "🧈", kcal: 717, p: 0.85, fat: 81.1, sfa: 51.4, mufa: 21.0, pufa: 3.04, trans: 3.28, la: 2.17, n3: 0.32, epa: 0, dha: 0, dpa: 0, g: 10, portion: "For one slice of bread, 10 g", src: "USDA SR Legacy, FDC 173410, butter, salted" },
  salmon:  { name: "Salmon", icon: "🐟", kcal: 208, p: 20.42, fat: 13.42, sfa: 3.05, mufa: 3.77, pufa: 3.88, trans: 0, la: 0.90, n3: 0.14, epa: 0.86, dha: 1.10, dpa: 0.39, g: 150, portion: "150 g", src: "USDA SR Legacy 15236, Atlantic, farmed, raw" },
  walnuts: { name: "Walnuts", icon: "🌰", kcal: 654, p: 15.2, fat: 65.2, sfa: 6.13, mufa: 8.93, pufa: 47.2, trans: null, la: 38.1, n3: 9.08, epa: 0, dha: 0, dpa: 0, g: 30, portion: "A handful, 30 g", src: "USDA SR Legacy, FDC 170187, walnuts, English" },
  avocado: { name: "Avocado", icon: "🥑", kcal: 160, p: 2.0, fat: 14.7, sfa: 2.13, mufa: 9.80, pufa: 1.82, trans: 0, la: 1.67, n3: 0.13, epa: 0, dha: 0, dpa: 0, g: 70, portion: "Half, 70 g", src: "USDA SR Legacy, FDC 171705, avocados, raw" },
  egg:     { name: "Egg", icon: "🥚", kcal: 143, p: 12.6, fat: 9.51, sfa: 3.13, mufa: 3.66, pufa: 1.91, trans: 0.038, la: 1.53, n3: 0.048, epa: 0, dha: 0.058, dpa: 0.007, g: 100, portion: "2 eggs, 100 g", src: "USDA SR Legacy, FDC 171287, egg, whole, raw" },
  cheddar: { name: "Cheddar", icon: "🧀", kcal: 403, p: 22.9, fat: 33.3, sfa: 18.9, mufa: 9.39, pufa: 0.94, trans: 1.13, la: 0.79, n3: 0.11, epa: 0.010, dha: 0.001, dpa: 0.017, g: 30, portion: "30 g", src: "USDA SR Legacy, FDC 173414, cheese, cheddar" },
  almonds: { name: "Almonds", icon: "🥜", kcal: 579, p: 21.1, fat: 49.9, sfa: 3.80, mufa: 31.6, pufa: 12.3, trans: 0.015, la: 12.3, n3: 0.003, epa: 0, dha: 0, dpa: 0, g: 30, portion: "A handful, 30 g", src: "USDA SR Legacy, FDC 170567, almonds" },
};
const TEXT = {
  olive: { best: "The everyday fat for cooking and salads. Mostly monounsaturated: swap it in for butter.", pair: "Vegetables, beans and fish: it carries their flavour." },
  butter: { best: "For taste, in small amounts. Half of it is saturated fat, so one slice of bread uses a good part of a meal's share.", pair: "Swap it for olive oil when you cook, keep it for taste." },
  salmon: { best: "Twice a week as a main meal: the richest source of the omega-3 fats EPA and DHA here. One portion covers more than a week of them. A newer USDA row for farmed salmon has less than half that omega-3: it depends on the feed.", pair: "Vegetables and a whole grain; no extra fat needed." },
  walnuts: { best: "A snack or on yogurt and oats: the plant omega-3 (ALA), more than any other nut. Count the handful: it is mostly energy.", pair: "Yogurt, oats or salad." },
  avocado: { best: "On bread or in a salad instead of butter or cheese: mostly monounsaturated, with fibre.", pair: "Eggs, beans or wholegrain bread." },
  egg: { best: "Breakfast protein with a modest amount of fat, about a third of it saturated.", pair: "Vegetables and wholegrain bread." },
  cheddar: { best: "For taste, grated thin. More than half of its fat is saturated, and 30 g is a third of a meal's share.", pair: "Use a little on vegetables or beans, not as the protein." },
  almonds: { best: "A snack that brings protein too, mostly monounsaturated fat and almost no saturated.", pair: "Fruit, yogurt or oats." },
};
const r = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;
// one portion against a meal of mealFat g of fat and mealKcal kcal: saturated against 10 % of the meal's energy (WHO 2023), EPA + DHA
// against 250 mg a day (EFSA)
module.exports = (mealFat, mealKcal) => Object.fromEntries(Object.entries(F).map(([k, f]) => { const s = f.g / 100;
  const n3 = f.n3 + f.epa + f.dha + f.dpa;
  return [k, { ...f, ...TEXT[k], k, pd: r(100 * f.p / f.kcal, 1), fatP: r(f.fat * s, 1), closes: Math.round(100 * f.fat * s / mealFat), mealFat,
    sfaP: r(f.sfa * s, 1), sfaMeal: r(mealKcal * 0.10 / 9, 1), epadha: Math.round((f.epa + f.dha) * s * 1000),
    mem: { sfa: r(f.sfa * s), mufa: r(f.mufa * s), pufa: r(f.pufa * s), la: r(f.la * s), n3: r(n3 * s), trans: f.trans === null ? null : r(f.trans * s) },
    us: r((f.mufa + f.pufa) / f.sfa, 1), n6n3: n3 > 0 ? r(f.la / n3, 1) : null }];
}));
if (require.main === module) for (const [k, v] of Object.entries(module.exports(26, 770))) console.log(k.padEnd(8), v.fatP, v.closes + "%", "sfa " + v.sfaP + "/" + v.sfaMeal, "epadha " + v.epadha, "u:s " + v.us, "n6:n3 " + v.n6n3, JSON.stringify(v.mem));
