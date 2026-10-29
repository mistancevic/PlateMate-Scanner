// DT165 (Milan 29 October 23:24): the five minerals. Sources read 29 October 2026:
// EU claims: Regulation (EU) No 432/2012, Annex: calcium, iron, magnesium, potassium from the legislation.gov.uk copy; zinc from the
// copy of OJ L 136 on lexploria.com. Label references: Regulation (EU) No 1169/2011, Annex XIII: calcium 800, iron 14, magnesium
// 375, potassium 2000, zinc 10 mg. EFSA: calcium PRI 950 mg from 25 years, 1000 mg at 18 to 24 (2015, abstract on orbit.dtu.dk);
// iron PRI 11 mg men, 16 mg premenopausal women, after menopause as men (2015, abstract); magnesium AI 350 mg men, 300 women (press
// release 28 July 2015); potassium AI 3500 mg, low intakes linked to raised blood pressure and stroke (press release 25 October
// 2016); zinc PRI 9.4 to 16.3 mg men, 7.5 to 12.7 women, for phytate intakes of 300, 600, 900 and 1200 mg a day (2014, abstract).
// Upper limits: EFSA overview, version 11: calcium 2500 mg (2012); iron none, a safe level of intake of 40 mg a day (2024);
// magnesium 250 mg for readily dissociable salts and MgO in supplements, water or added to foods, not magnesium naturally in food
// (SCF 2001); potassium no adequate data; zinc 25 mg (SCF 2002). Foods: the shared food table (USDA SR Legacy rows).
module.exports = {
  ca: { name: "Calcium", unit: "mg", label: 800, day: { men: 950, women: 950, young: 1000 }, src: "EFSA's population reference intake from 25 years (1000 mg at 18 to 24)",
    ul: { v: 2500, note: "EFSA's upper limit for adults, from food and supplements together" },
    is: "Bones and teeth hold most of your calcium; it also works in your muscles, nerves and blood clotting. Milk, yogurt and cheese bring the most; so do sardines eaten with their bones and tofu set with calcium.",
    does: ["contributes to normal blood clotting", "contributes to normal energy-yielding metabolism", "contributes to normal muscle function", "contributes to normal neurotransmission", "contributes to the normal function of digestive enzymes", "has a role in the process of cell division and specialisation", "is needed for the maintenance of normal bones", "is needed for the maintenance of normal teeth"],
    foods: [["tofu", "100 g"], ["sardines", "1 can, 90 g"], ["milk"], ["yogurt"], ["cheddar"], ["kale", "A handful, 50 g"], ["chickpeas", "200 g"], ["almonds"], ["spinach"], ["bread"]],
    combine: [{ with: "Vitamin D", why: "Vitamin D contributes to normal absorption and utilisation of calcium: an EU authorised claim." }],
    much: "EFSA's upper limit for adults is 2500 mg a day, from food and supplements together." },
  fe: { name: "Iron", unit: "mg", label: 14, day: { men: 11, women: 16 }, src: "EFSA's population reference intake", womenNote: "11 mg after menopause, as for men",
    ul: null, ulNone: "EFSA found not enough data for an upper limit and set a safe level of intake instead, 40 mg a day for adults",
    is: "Carries oxygen in your blood. Meat, liver and fish bring it, and so do legumes, seeds and greens; in plants, vitamin C in the same meal helps the body take it up.",
    does: ["contributes to normal cognitive function", "contributes to normal energy-yielding metabolism", "contributes to normal formation of red blood cells and haemoglobin", "contributes to normal oxygen transport in the body", "contributes to the normal function of the immune system", "contributes to the reduction of tiredness and fatigue", "has a role in the process of cell division"],
    foods: [["liver", "100 g"], ["lentils"], ["chickpeas", "200 g"], ["beef"], ["pumpkin", "A handful, 30 g"], ["tofu", "100 g"], ["spinach"], ["sardines", "1 can, 90 g"], ["oats"], ["egg"]],
    combine: [{ with: "Vitamin C: peppers, citrus, broccoli", why: "Vitamin C increases iron absorption: an EU authorised claim." }, { with: "Vitamin A and riboflavin", why: "Vitamin A contributes to normal iron metabolism; riboflavin to the normal metabolism of iron: EU claims." }],
    much: "EFSA found not enough data for an upper limit for iron. It set a safe level of intake instead: 40 mg a day for adults, from all sources." },
  mg: { name: "Magnesium", unit: "mg", label: 375, day: { men: 350, women: 300 }, src: "EFSA's adequate intake",
    ul: { v: 250, note: "for magnesium salts in supplements, water or added to foods only; magnesium in food has no limit" }, ulFood: false,
    is: "Works in your muscles and nerves and in getting energy from food. Seeds, nuts, legumes, whole grains and green leaves bring the most.",
    does: ["contributes to a reduction of tiredness and fatigue", "contributes to electrolyte balance", "contributes to normal energy-yielding metabolism", "contributes to normal functioning of the nervous system", "contributes to normal muscle function", "contributes to normal protein synthesis", "contributes to normal psychological function", "contributes to the maintenance of normal bones", "contributes to the maintenance of normal teeth", "has a role in the process of cell division"],
    foods: [["pumpkin", "A handful, 30 g"], ["almonds"], ["chickpeas", "200 g"], ["spinach"], ["lentils"], ["tofu", "100 g"], ["oats"], ["bread"], ["banana"], ["avocado"]],
    combine: [],
    much: "EFSA's upper limit, 250 mg a day, is for magnesium salts in supplements, in water or added to foods. Magnesium that is naturally in food has no limit." },
  k_: { name: "Potassium", unit: "mg", label: 2000, day: { men: 3500, women: 3500 }, src: "EFSA's adequate intake for adults",
    ul: null, ulNone: "EFSA found not enough data to derive one",
    is: "Works with sodium in every cell, in your nerves and muscles. EFSA links low intakes to raised blood pressure and a higher risk of stroke. Potatoes, legumes, fruit and vegetables bring the most.",
    does: ["contributes to normal functioning of the nervous system", "contributes to normal muscle function", "contributes to the maintenance of normal blood pressure"],
    foods: [["potato"], ["lentils"], ["chickpeas", "200 g"], ["salmon"], ["beef"], ["spinach"], ["banana"], ["milk"], ["avocado"], ["yogurt"]],
    combine: [],
    much: "EFSA found not enough data to derive an upper limit for potassium." },
  zn: { name: "Zinc", unit: "mg", label: 10, day: { men: 9.4, women: 7.5, menHi: 16.3, womenHi: 12.7 }, src: "EFSA's population reference intake at the lowest phytate level",
    ul: { v: 25, note: "EFSA's upper limit for adults" },
    is: "Works in growth, healing and your immune system. Meat, seafood, seeds, legumes and whole grains bring it. Phytate, in whole grains, legumes and seeds, matters: EFSA gives your day for four levels of it.",
    does: ["contributes to normal acid-base metabolism", "contributes to normal carbohydrate metabolism", "contributes to normal cognitive function", "contributes to normal DNA synthesis", "contributes to normal fertility and reproduction", "contributes to normal macronutrient metabolism", "contributes to normal metabolism of fatty acids", "contributes to normal metabolism of vitamin A", "contributes to normal protein synthesis", "contributes to the maintenance of normal bones", "contributes to the maintenance of normal hair", "contributes to the maintenance of normal nails", "contributes to the maintenance of normal skin", "contributes to the maintenance of normal testosterone levels in the blood", "contributes to the maintenance of normal vision", "contributes to the normal function of the immune system", "contributes to the protection of cells from oxidative stress", "has a role in the process of cell division"],
    foods: [["beef"], ["liver", "100 g"], ["pumpkin", "A handful, 30 g"], ["chickpeas", "200 g"], ["lentils"], ["chicken"], ["tofu", "100 g"], ["cheddar"], ["oats"], ["egg"]],
    combine: [{ with: "Phytate: whole grains, legumes, seeds", why: "EFSA gives your day for phytate intakes of 300, 600, 900 and 1200 mg a day: 9.4 to 16.3 mg for men, 7.5 to 12.7 mg for women. The foods here are measured against the lowest." }],
    much: "EFSA's upper limit for adults is 25 mg a day." },
};
