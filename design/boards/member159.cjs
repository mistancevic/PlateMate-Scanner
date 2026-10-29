// DT159 (Milan 29 October 17:58 to 18:02): member pages, Vitamin D and Vitamin C. Sources read 29 October 2026.
// EU health claims: Regulation (EU) No 432/2012, Annex (vitamin C rows: legislation.gov.uk copy of the Annex; vitamin D rows: a copy
// of OJ L 136, 25.5.2012, on lexploria.com, agreeing with two journal tables; to read on EUR-Lex before the build).
// EFSA: vitamin D AI 15 µg (EFSA J 2016;14(10):4547), UL 100 µg (EFSA J 2023;21(8):8145; Overview on Tolerable Upper Intake Levels,
// Table 3); vitamin C PRI men 110, women 95 mg (EFSA J 2013;11(11):3418), no UL ("No adequate data to derive a UL").
// EU label reference: Regulation (EU) No 1169/2011, Annex XIII: vitamin D 5 µg, vitamin C 80 mg.
// Foods per 100 g: USDA rows on getfoodfacts.com (FDC ids below). Evidence: Tripkovic 2012 AJCN (D3 vs D2), Kuang 2020 Food Funct
// (D with K and bone density), Witham 2020 JASN (K2, vascular health, kidney disease), Teucher 2004 and Nyakundi 2026 AJCN (vitamin
// C and iron); abstracts read through PubMed.
module.exports = {
  d: { name: "Vitamin D", unit: "µg", label: 5, efsa: { v: 15, kind: "adequate intake, adults" }, ul: { v: 100, note: "EFSA's upper limit for adults, from food and supplements together" },
    is: "Fat-soluble: the body stores it, and it needs some fat in the meal to be taken up. Two forms: D3 (cholecalciferol) from animal foods and from your skin in sunlight; D2 (ergocalciferol) from mushrooms and yeast. In a review of trials, D3 raised blood levels more than D2 when taken in large single doses, but not with a daily intake (Tripkovic 2012).",
    does: ["contributes to normal absorption/utilisation of calcium and phosphorus", "contributes to normal blood calcium levels", "contributes to the maintenance of normal bones", "contributes to the maintenance of normal muscle function", "contributes to the maintenance of normal teeth", "contributes to the normal function of the immune system", "has a role in the process of cell division"],
    foods: [
      { name: "Mushrooms, white, UV-exposed", portion: "100 g", g: 100, per100: 26.2, form: "D2", src: "USDA SR Legacy, FDC 169376" },
      { name: "Salmon, farmed, cooked", portion: "150 g", g: 150, per100: 13.1, form: "form not reported", src: "USDA SR Legacy, FDC 175168" },
      { name: "Sardines, canned in oil", portion: "1 can, 90 g", g: 90, per100: 4.8, form: "D3", src: "USDA SR Legacy, FDC 175139" },
      { name: "Milk, 2 %, vitamin D added", portion: "A glass, 250 ml", g: 250, per100: 1.13, form: "D3", src: "USDA Foundation, FDC 746778" },
      { name: "Egg", portion: "2 eggs, 100 g", g: 100, per100: 2.0, form: "D3", src: "USDA SR Legacy, FDC 171287" },
      { name: "Cheddar", portion: "30 g", g: 30, per100: 0.6, form: "D3", src: "USDA SR Legacy, FDC 173414" },
      { name: "Mushrooms, white, not UV-exposed", portion: "100 g", g: 100, per100: 0.2, form: "D2", src: "USDA SR Legacy, FDC 169251" },
    ],
    combine: [
      { with: "Some fat in the meal", why: "Vitamin D is fat-soluble: eggs, oily fish and a little olive oil carry it.", src: "" },
      { with: "Calcium: milk, yogurt, cheese, almonds", why: "Vitamin D contributes to normal absorption of calcium: an EU authorised claim.", src: "Regulation (EU) No 432/2012" },
      { with: "Vitamin K2, as often sold together", why: "Not settled. A review found vitamin D with K improved bone density (Kuang 2020); a trial of K2 found no better vascular health (Witham 2020, people with kidney disease). The EU has no claim for it.", src: "Kuang 2020, Witham 2020" },
    ],
    much: "Vitamin D builds up in the body. EFSA's upper limit for adults is 100 µg a day, from food and supplements together.",
  },
  c: { name: "Vitamin C", unit: "mg", label: 80, efsa: { v: 110, kind: "population reference intake, men (95 mg for women)" }, ul: null,
    is: "Water-soluble: the body doesn't store much of it, so it needs to come often. Heat and long storage destroy part of it, so raw or briefly cooked keeps the most.",
    does: ["increases iron absorption", "contributes to the normal function of the immune system", "contributes to normal collagen formation for the normal function of skin", "contributes to the protection of cells from oxidative stress", "contributes to the reduction of tiredness and fatigue"],
    doesMore: "The same collagen claim for blood vessels, bones, cartilage, gums and teeth. Also energy metabolism, the nervous system, psychological function, the regeneration of vitamin E, and the immune system during and after intense exercise, with 200 mg a day on top of the recommended intake.",
    foods: [
      { name: "Red pepper, raw", portion: "1 medium, 120 g", g: 120, per100: 142, src: "USDA Foundation, FDC 2258590" },
      { name: "Broccoli, raw", portion: "100 g", g: 100, per100: 89.2, src: "USDA SR Legacy, FDC 170379" },
      { name: "Strawberries", portion: "150 g", g: 150, per100: 58.8, src: "USDA SR Legacy, FDC 167762" },
      { name: "Kiwi", portion: "1 medium, 75 g", g: 75, per100: 92.7, src: "USDA SR Legacy, FDC 168153" },
      { name: "Orange", portion: "1 medium, 130 g", g: 130, per100: 53.2, src: "USDA SR Legacy, FDC 169097" },
      { name: "Potatoes, boiled", portion: "200 g", g: 200, per100: 7.4, src: "USDA SR Legacy, FDC 170440" },
      { name: "Lentils, boiled", portion: "200 g", g: 200, per100: 1.5, src: "USDA SR Legacy, FDC 172421" },
    ],
    combine: [
      { with: "Plant iron: lentils, beans, spinach, wholegrains", why: "Vitamin C increases iron absorption: an EU authorised claim. Over months the effect on the body's iron stores is smaller than in a single meal (Nyakundi 2026).", src: "Regulation (EU) No 432/2012; Nyakundi 2026" },
      { with: "Raw or briefly cooked vegetables", why: "Heat destroys part of it: a raw pepper on the side keeps the most.", src: "" },
    ],
    much: "EFSA set no upper limit for vitamin C: there is not enough data to derive one.",
  },
};
