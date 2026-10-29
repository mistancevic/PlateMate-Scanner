// DT163 (Milan 29 October 21:21 and 21:34): the whole B group, all eight with both names. Sources read 29 October 2026:
// EU claims: Regulation (EU) No 432/2012, Annex, legislation.gov.uk copy, quoted word for word. Label references: Regulation (EU)
// No 1169/2011, Annex XIII, Part A, legislation.gov.uk copy. EFSA adult values, as tabulated by the Health Council of the
// Netherlands (2018, An evaluation of EFSA's dietary reference values, part 1): thiamin PRI 0.1 mg/MJ (2016), riboflavin PRI 1.6 mg
// (2017), niacin PRI 1.6 mg NE/MJ (2014; abstract: about 60 mg tryptophan yields 1 mg niacin, 1 mg NE), pantothenic acid AI 5 mg
// (2014), B6 PRI 1.7 mg men, 1.6 women (2016), folate PRI 330 µg DFE (2014); biotin AI 40 µg (2014, abstract on DOAJ); B12 AI
// 4 µg (press release 9 July 2015). Upper limits: EFSA Overview on Tolerable Upper Intake Levels, version 11, Table 3: B6 12 mg
// (2023); folic acid 1000 µg, for folic acid and the methyltetrahydrofolate salts added to foods or in supplements, not folate
// naturally in food (2023); niacin, nicotinic acid 10 mg and nicotinamide 900 mg (SCF 2002); thiamin, riboflavin, pantothenic acid,
// biotin no adequate data; B12 no defined adverse effects. Foods: bcard163.json and bpage163.json (USDA SR Legacy on getfoodfacts).
const P = require("./bpage163.json"), C = require("./bcard163.json");
const all = { ...P, salmon: { name: "Salmon, farmed, cooked", fdc: 175168, ...C.salmon }, egg: { name: "Egg", fdc: 171287, ...C.egg }, spinach: { name: "Spinach, raw", fdc: 168462, ...C.spinach },
  lentils: { name: "Lentils, boiled", fdc: 172421, ...C.lentils, trp: 0.081 }, milk: { name: "Milk, 1 %", fdc: 746772, ...C.milk }, almonds: { name: "Almonds", fdc: 170567, ...C.almonds }, beef: { name: "Beef, lean, cooked", fdc: 171794, ...C.beef } };
const TRP = { pork: 0.28, chicken: 0.36, tuna: 0.21, sardines: 0.28, clams: 0.29, liver: 0.34, oats: 0.18, sunflower: 0.29, peanuts: 0.23, mushrooms: 0.035, yogurt: 0.030, chickpeas: 0.085, lentils: 0.081 };
const PORTION = { pork: ["150 g", 150], chicken: ["150 g", 150], tuna: ["1 can, 100 g", 100], sardines: ["1 can, 90 g", 90], clams: ["100 g", 100], liver: ["100 g", 100], oats: ["50 g", 50], bread: ["2 slices, 60 g", 60], sunflower: ["A handful, 30 g", 30], peanuts: ["A handful, 30 g", 30], mushrooms: ["100 g", 100], yogurt: ["200 g", 200], chickpeas: ["200 g", 200], banana: ["1 medium, 120 g", 120], potato: ["200 g", 200], avocado: ["Half, 70 g", 70], broccoli: ["100 g", 100], asparagus: ["100 g", 100], cheddar: ["30 g", 30], salmon: ["150 g", 150], egg: ["2 eggs, 100 g", 100], spinach: ["A big handful, 60 g", 60], lentils: ["200 g", 200], milk: ["A glass, 250 ml", 250], almonds: ["A handful, 30 g", 30], beef: ["125 g", 125] };
const foods = (key, ids, ne) => ids.map((id) => { const f = all[id]; const v = ne ? f.b3 + (TRP[id] * 1000) / 60 : f[key]; return { name: f.name, portion: PORTION[id][0], grams: PORTION[id][1], per100: Math.round(v * 1000) / 1000, src: `${id === "milk" ? "Foundation" : "SR Legacy"}, FDC ${f.fdc}` }; });
const day = { kcal: 2600 }, MJ = day.kcal * 0.004184;
module.exports = {
  day, MJ,
  names: { b1: ["Vitamin B1", "thiamine"], b2: ["Vitamin B2", "riboflavin"], b3: ["Vitamin B3", "niacin"], b5: ["Vitamin B5", "pantothenic acid"], b6: ["Vitamin B6", "pyridoxine"], b7: ["Vitamin B7", "biotin"], b9: ["Vitamin B9", "folate"], b12: ["Vitamin B12", "cobalamin"] },
  b1: { name: "Vitamin B1", also: "thiamine", unit: "mg", label: 1.1, perMJ: 0.1, efsaSrc: "EFSA's population reference intake, 0.1 mg for every MJ you eat", ul: null, ulNone: "EFSA found not enough data to derive one",
    is: "Water-soluble, so it needs to come often. Your body needs it to get energy from food, so EFSA sets it by how much you eat: 0.1 mg for every megajoule. Pork, whole grains, legumes and seeds bring the most.",
    does: ["contributes to normal energy-yielding metabolism", "contributes to normal functioning of the nervous system", "contributes to normal psychological function", "contributes to the normal function of the heart"], claimName: "thiamine",
    foods: foods("b1", ["pork", "salmon", "lentils", "bread", "chickpeas", "oats", "potato", "asparagus", "peanuts", "sunflower"]),
    combine: [{ with: "Your carbs", why: "Thiamine contributes to normal energy-yielding metabolism: an EU claim. The more you eat, the more you need: that is why your day here follows your energy." }],
    much: "EFSA set no upper limit for thiamine: there is not enough data to derive one." },
  b3: { name: "Vitamin B3", also: "niacin", unit: "mg NE", label: 16, perMJ: 1.6, efsaSrc: "EFSA's population reference intake, 1.6 mg NE for every MJ you eat", ul: null, ulNone: "",
    is: "Water-soluble. Your body makes some from tryptophan, an amino acid in protein: about 60 mg of tryptophan gives 1 mg of niacin. So EFSA counts niacin equivalents, NE: the niacin in a food plus its tryptophan divided by 60. Like B1, it is set by how much you eat.",
    does: ["contributes to normal energy-yielding metabolism", "contributes to normal functioning of the nervous system", "contributes to normal psychological function", "contributes to the maintenance of normal mucous membranes", "contributes to the maintenance of normal skin", "contributes to the reduction of tiredness and fatigue"], claimName: "niacin",
    foods: foods("b3", ["chicken", "liver", "pork", "tuna", "sardines", "peanuts", "lentils", "mushrooms", "chickpeas"], true),
    combine: [{ with: "Protein", why: "Its tryptophan counts as niacin: chicken, tuna and peanuts bring both." }],
    much: "EFSA's upper limits are for two forms: nicotinic acid, 10 mg a day, and nicotinamide, 900 mg a day (SCF 2002)." },
  b9: { name: "Vitamin B9", also: "folate", unit: "µg DFE", label: 200, efsa: 330, efsaSrc: "EFSA's population reference intake, in dietary folate equivalents", ul: { v: 1000, note: "for folic acid and its salts added to foods or in supplements only; folate in food has no limit" },
    is: "Water-soluble. Folate is the form in food: green leaves, legumes, liver. Folic acid is the form added to foods and supplements. EFSA counts both as dietary folate equivalents, DFE. The foods here have no folic acid added.",
    does: ["contributes to maternal tissue growth during pregnancy", "contributes to normal amino acid synthesis", "contributes to normal blood formation", "contributes to normal homocysteine metabolism", "contributes to normal psychological function", "contributes to the normal function of the immune system", "contributes to the reduction of tiredness and fatigue", "has a role in the process of cell division"], claimName: "folate",
    foods: foods("fol", ["lentils", "chickpeas", "liver", "asparagus", "spinach", "broccoli", "sunflower", "avocado", "egg", "peanuts"]),
    combine: [{ with: "Vitamin B12 and B6", why: "Folate, B12 and B6 each contribute to normal homocysteine metabolism: three EU claims." }],
    much: "EFSA's upper limit, 1000 µg a day, is for folic acid and its salts added to foods or taken as supplements. Folate that is naturally in food has no limit." },
  b12: { name: "Vitamin B12", also: "cobalamin", unit: "µg", label: 2.5, efsa: 4, efsaSrc: "EFSA's adequate intake for adults", ul: null, ulNone: "EFSA: no defined adverse effects",
    is: "Water-soluble. Among the foods here, only animal foods bring it: shellfish, liver, fish, meat, milk and eggs. Every plant food on USDA's rows here has none.",
    does: ["contributes to normal energy-yielding metabolism", "contributes to normal functioning of the nervous system", "contributes to normal homocysteine metabolism", "contributes to normal psychological function", "contributes to normal red blood cell formation", "contributes to the normal function of the immune system", "contributes to the reduction of tiredness and fatigue", "has a role in the process of cell division"], claimName: "vitamin B12",
    foods: foods("b12", ["clams", "liver", "sardines", "salmon", "beef", "tuna", "milk", "yogurt", "egg", "cheddar"]),
    combine: [{ with: "Folate", why: "Folate and B12 each contribute to normal homocysteine metabolism: EU claims." }, { with: "If you eat vegan", why: "None of the plant foods on USDA's rows here bring B12." }],
    much: "EFSA found no defined adverse effects from vitamin B12, so there is no upper limit." },
  b7: { name: "Vitamin B7", also: "biotin", unit: "µg", label: 50, efsa: 40, efsaSrc: "EFSA's adequate intake for adults", ul: null, ulNone: "EFSA found not enough data to derive one",
    is: "Water-soluble. Your body needs it to use fats, carbs and protein. EFSA's 40 µg comes from what people across the EU eat, where a lack is rare.",
    does: ["contributes to normal energy-yielding metabolism", "contributes to normal functioning of the nervous system", "contributes to normal macronutrient metabolism", "contributes to normal psychological function", "contributes to the maintenance of normal hair", "contributes to the maintenance of normal mucous membranes", "contributes to the maintenance of normal skin"], claimName: "biotin",
    foods: [], gap: "USDA's rows don't report biotin, for any food here. Until we read a food table that does, this section stays empty rather than guess.",
    combine: [], much: "EFSA set no upper limit for biotin: there is not enough data to derive one." },
};
