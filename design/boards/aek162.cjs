// DT162 (Milan 29 October 21:21 "DT162. DEK", read as the fat-soluble group: D is built, so A, E and K; every vitamin with both
// its names). Sources read 29 October 2026:
// EU claims: Regulation (EU) No 432/2012, Annex. Vitamin A rows: legislation.gov.uk copy and the EUR-Lex consolidated text of
// 13 May 2014 (PDF), both agreeing; vitamin E and K rows: the copy of OJ L 136, 25.5.2012 on lexploria.com.
// EFSA: vitamin A PRI 750 µg RE men, 650 women (press release 5 March 2015; unit µg RE and 1 µg RE = 1 µg retinol, 6 µg
// beta-carotene, 12 µg other provitamin A carotenoids, from the opinion's summary as put to consultation); UL for preformed vitamin
// A 3000 µg RE a day, retinol and retinyl esters only; beta-carotene no UL, none from the background diet harmful, smokers to avoid
// beta-carotene supplements (EFSA Journal 2024, PMC11154838, abstract). Vitamin E AI 13 mg men, 11 mg women, as alpha-tocopherol
// (press release 9 July 2015); UL 300 mg a day, all sources, all stereoisomers of alpha-tocopherol, critical effect bleeding
// (EFSA Journal 2024, PubMed 39099617). Vitamin K AI 70 µg a day for all adults, phylloquinone only, menaquinones too little
// data (EFSA Journal 2017, abstract on DOAJ); no UL, "no adequate data" (EFSA Overview on Tolerable Upper Intake Levels, version
// 11, August 2025, Table 3).
// Evidence: Brown 2004 Am J Clin Nutr 80:396 (carotenoids with fat-free, reduced-fat and full-fat dressing; 7 people); Gijsbers
// 1996 Br J Nutr 76:223 (phylloquinone from spinach with and without butter; 5 people). Abstracts read through PubMed.
module.exports = {
  names: {
    a: { name: "Vitamin A", also: "retinol; beta-carotene from plants" }, d: { name: "Vitamin D", also: "D3 cholecalciferol, D2 ergocalciferol" },
    e: { name: "Vitamin E", also: "tocopherol" }, k: { name: "Vitamin K", also: "K1 phylloquinone, K2 menaquinone" },
    c: { name: "Vitamin C", also: "ascorbic acid" }, b12: { name: "Vitamin B12", also: "cobalamin" }, fol: { name: "Vitamin B9", also: "folate" },
  },
  a: { name: "Vitamin A", also: "retinol; beta-carotene from plants", unit: "µg", label: 800,
    efsa: { men: 750, women: 650, src: "EFSA, population reference intake" }, ul: { v: 3000, note: "EFSA's upper limit for adults, for preformed vitamin A only: retinol from animal foods and supplements" },
    is: "Fat-soluble: the body stores it, in the liver. It comes two ways: as retinol from animal foods, liver, eggs, butter and cheese; and as beta-carotene from orange and green plants, which the body turns into vitamin A as it needs it. EFSA counts 6 µg of beta-carotene as 1 µg of vitamin A.",
    does: ["contributes to normal iron metabolism", "contributes to the maintenance of normal mucous membranes", "contributes to the maintenance of normal skin", "contributes to the maintenance of normal vision", "contributes to the normal function of the immune system", "has a role in the process of cell specialisation"],
    combine: [
      { with: "Some fat in the meal", why: "Beta-carotene needs fat to be taken up. In a small trial, a salad with fat-free dressing gave almost none; reduced-fat dressing more, full-fat dressing the most (Brown 2004, 7 people)." },
      { with: "Iron: lentils, beef, spinach", why: "Vitamin A contributes to normal iron metabolism: an EU authorised claim." },
    ],
    much: "The upper limit, 3000 µg a day, is for retinol, from animal foods and supplements, not for beta-carotene. EFSA found no harm from beta-carotene in normal food. Liver is so rich in retinol that one portion goes over the limit: once in a while, not every day. EFSA advises smokers to avoid beta-carotene supplements.",
    sources: "EU claims: Regulation (EU) No 432/2012. EFSA: dietary reference values for vitamin A (2015), upper limit for preformed vitamin A and beta-carotene (2024). Fat and beta-carotene: Brown 2004, Am J Clin Nutr. Foods: USDA FoodData Central; vitamin A calculated the EFSA way from retinol and the carotenes." },
  e: { name: "Vitamin E", also: "tocopherol", unit: "mg", label: 12,
    efsa: { men: 13, women: 11, src: "EFSA, adequate intake, as alpha-tocopherol" }, ul: { v: 300, note: "EFSA's upper limit for adults, from food and supplements together" },
    is: "Fat-soluble: it sits in the fats of your cells and protects them. It comes in several forms; EFSA counts only alpha-tocopherol, and so do the numbers here. Seeds, nuts and their oils bring the most.",
    does: ["contributes to the protection of cells from oxidative stress"],
    combine: [
      { with: "The oil it comes in", why: "Vitamin E is fat-soluble: seeds, nuts and oils bring it with their own fat." },
      { with: "Vitamin C: peppers, fruit, greens", why: "Vitamin C contributes to the regeneration of the reduced form of vitamin E: an EU authorised claim." },
    ],
    much: "EFSA's upper limit for adults is 300 mg a day, from food and supplements together; too much affects blood clotting. Food alone doesn't come near it: a handful of almonds brings under 8 mg.",
    sources: "EU claims: Regulation (EU) No 432/2012. EFSA: dietary reference values for vitamin E (2015), upper limit for vitamin E (2024). Foods: USDA FoodData Central." },
  k: { name: "Vitamin K", also: "K1 phylloquinone, K2 menaquinone", unit: "µg", label: 75,
    efsa: { men: 70, women: 70, src: "EFSA, adequate intake for adults, as K1" }, ul: null, ulNone: "EFSA found not enough data to derive one",
    is: "Fat-soluble. Two forms: K1 (phylloquinone) from green leaves and some oils, most of what people eat; K2 (menaquinones) from fermented foods, cheese and animal foods, and made by gut bacteria. EFSA sets its value for K1 only: the data on K2 were too few.",
    does: ["contributes to normal blood clotting", "contributes to the maintenance of normal bones"],
    combine: [
      { with: "Some fat with your greens", why: "K1 sits tight in the leaf. In a small study, it reached the blood about three times better from spinach eaten with butter than from spinach alone (Gijsbers 1996, 5 people)." },
      { with: "Vitamin D, as often sold together", why: "Not settled: see Vitamin D. The EU has a claim for each on its own, none for the two together." },
    ],
    much: "EFSA set no upper limit for vitamin K: there is not enough data to derive one. If you take medication that affects food, your doctor's advice comes first.",
    sources: "EU claims: Regulation (EU) No 432/2012. EFSA: dietary reference values for vitamin K (2017), overview of upper limits. Fat and K1: Gijsbers 1996, Br J Nutr. Foods: USDA FoodData Central, which reports K1." },
};
