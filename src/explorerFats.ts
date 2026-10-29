// DT154 (0.2.135, canvas Page 2, board Stories106; Coach Milan 29 October 14:47 to 15:04): Explorer, Not all fats are equal,
// the same template as Protein (src/explorer.ts). Fat is the family; its members are saturated, monounsaturated and
// polyunsaturated fats, and among the polyunsaturated the omega-6 and omega-3 the body can't make. Each food is one normal
// portion against one meal: how much of the meal's fat it brings, saturated fat against the meal's share of the limit, the
// fish omega-3 against the day, the members in grams, two ratios, how to use it, and where every number comes from.
//
// Sources (read 29 October 2026). Fats per 100 g: USDA FoodData Central, SR Legacy, the row in `src`, read on getfoodfacts.com
// with its FDC id; salmon SR 15236 via bodbot.com and recipal.com (the same row as the Protein page); olive oil SR 04053 via
// nutritiondatahub.com. Omega-3 is 18:3 as USDA reports it (SR Legacy has no separate ALA row) plus EPA, DPA and DHA; omega-6
// is linoleic acid, the n-6 cis,cis row where USDA gives one (butter, egg, cheddar), else total 18:2. Trans is null where the
// row doesn't report it; cheddar's is the sum of its trans rows. Saturated fat under 10 % of energy: WHO 2023, Saturated fatty
// acid and trans-fatty acid intake for adults and children. EPA plus DHA, 250 mg a day for adults: EFSA, Dietary Reference
// Values for nutrients, summary report 2017 (doi 10.2903/sp.efsa.2017.e15121), quoting the 2010 opinion on fats.

export const SAT_SHARE = 0.10;     // saturated fat, at most 10 % of energy (WHO 2023)
export const EPA_DHA_DAY = 250;    // mg a day, adults (EFSA)
export const FAT_SCALE_G = 15;     // the members' bars: the same scale for every food
const N3_SMALL = 0.05;             // g in a portion: below it, "almost no omega-3"

export type FatFood = {
  id: string; icon: string; name: string; kcal: number; protein: number; fat: number;   // per 100 g
  sfa: number; mufa: number; pufa: number; trans: number | null; omega6: number; ala: number; epa: number; dpa: number; dha: number;
  portion: { label: string; grams: number }; src: string; best: string; pair: string;
};

import { rowOf } from "./foodTable";
const fromTable = (id: string) => { const r = rowOf(id); return { icon: r.icon, name: r.name, kcal: r.kcal, protein: r.protein, fat: r.fat!, sfa: r.sfa!, mufa: r.mufa!, pufa: r.pufa!, trans: r.trans, omega6: r.la ?? 0, ala: r.ala ?? 0, epa: r.epa ?? 0, dpa: r.dpa ?? 0, dha: r.dha ?? 0, portion: r.portion, src: r.src }; };
// DT164 (0.3.6): the numbers, name, icon and portion come from the shared food table (src/foodTable.ts); only what this family
// says about a food is written here
type Extra = Omit<FatFood, "icon" | "name" | "kcal" | "protein" | "fat" | "sfa" | "mufa" | "pufa" | "trans" | "omega6" | "ala" | "epa" | "dpa" | "dha" | "portion" | "src">;
const EXTRAS: Extra[] = [
  { id: "olive", best: "The everyday fat for cooking and salads. Mostly monounsaturated: swap it in for butter.", pair: "Vegetables, beans and fish: it carries their flavour." },
  { id: "butter", best: "For taste, in small amounts. Half of it is saturated fat, so one slice of bread uses a good part of a meal's share.", pair: "Swap it for olive oil when you cook, keep it for taste." },
  { id: "salmon", best: "Twice a week as a main meal: the richest source of the omega-3 fats EPA and DHA here. One portion covers more than a week of them. A newer USDA row for farmed salmon has less than half that omega-3: it depends on the feed.", pair: "Vegetables and a whole grain; no extra fat needed." },
  { id: "walnuts", best: "A snack or on yogurt and oats: the plant omega-3 (ALA), more than any other nut. Count the handful: it is mostly energy.", pair: "Yogurt, oats or salad." },
  { id: "avocado", best: "On bread or in a salad instead of butter or cheese: mostly monounsaturated, with fibre.", pair: "Eggs, beans or wholegrain bread." },
  { id: "egg", best: "Breakfast protein with a modest amount of fat, about a third of it saturated.", pair: "Vegetables and wholegrain bread." },
  { id: "cheddar", best: "For taste, grated thin. More than half of its fat is saturated, so 30 g uses a good part of a meal's share.", pair: "A little on vegetables or beans, not as the protein." },
  { id: "almonds", best: "A snack that brings protein too, mostly monounsaturated fat and almost no saturated.", pair: "Fruit, yogurt or oats." },
];
export const FAT_FOODS: FatFood[] = EXTRAS.map((x) => ({ ...fromTable(x.id), ...x }));

export type FatMember = "sfa" | "mufa" | "pufa" | "omega6" | "omega3" | "trans";
export const FAT_MEMBERS: { id: FatMember; name: string; under?: boolean }[] = [
  { id: "sfa", name: "Saturated" }, { id: "mufa", name: "Monounsaturated" }, { id: "pufa", name: "Polyunsaturated" },
  { id: "omega6", name: "of them, omega-6", under: true }, { id: "omega3", name: "of them, omega-3", under: true }, { id: "trans", name: "Trans" },
];
const r = (x: number, d: number) => Math.round(x * 10 ** d) / 10 ** d;

export type FatCard = {
  food: FatFood; pd: number;
  fat: number; closes: number;                 // g in the portion, % of the meal's fat
  sat: number; satMeal: number;                // g in the portion, the meal's share of the limit
  epaDha: number;                              // mg in the portion
  members: Record<FatMember, number | null>;   // g in the portion; trans null when the row doesn't report it
  mostly: "saturated" | "monounsaturated" | "polyunsaturated";
  unsatToSat: number; omega6To3: number | null;   // null: almost no omega-3
};
// one food, one portion, against a meal of `mealFat` g of fat and `mealKcal` kcal
export function fatCardOf(f: FatFood, mealFat: number, mealKcal: number): FatCard {
  const k = f.portion.grams / 100, n3 = f.ala + f.epa + f.dpa + f.dha;
  const members: Record<FatMember, number | null> = { sfa: r(f.sfa * k, 2), mufa: r(f.mufa * k, 2), pufa: r(f.pufa * k, 2), omega6: r(f.omega6 * k, 2), omega3: r(n3 * k, 2), trans: f.trans === null ? null : r(f.trans * k, 2) };
  const mostly = ([["saturated", f.sfa], ["monounsaturated", f.mufa], ["polyunsaturated", f.pufa]] as const).slice().sort((a, b) => b[1] - a[1])[0][0];
  const fat = r(f.fat * k, 1);
  return { food: f, pd: r((100 * f.protein) / f.kcal, 1), fat, closes: Math.round((100 * fat) / mealFat), sat: r(f.sfa * k, 1), satMeal: r((mealKcal * SAT_SHARE) / 9, 1),
    epaDha: Math.round((f.epa + f.dha) * k * 1000), members, mostly, unsatToSat: r((f.mufa + f.pufa) / f.sfa, 1), omega6To3: n3 * k < N3_SMALL ? null : r(f.omega6 / n3, 1) };
}
