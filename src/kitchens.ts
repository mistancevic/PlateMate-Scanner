// What a kitchen means (0.2.10, canvas board CH, CH7 and CH7b; Milan 16 October 2026, 11:38). For each kitchen the person
// cooks: one line on what it means, its tastes, fats and herbs and how a meal is put together, and eight typical dishes,
// three shown, the rest behind Another. Written once, here, not by the AI: the same every time, free, and checkable.
// What the person keeps and swaps away tells Chef Mealan their taste within the kitchen.
import type { Personal } from "./personal";

export type Kitchen = { what: string; dishes: string[] };
export const KITCHEN: Record<string, Kitchen> = {
  Balkan: { what: "Grilled meat and peppers, fresh white cheese and sour cream, paprika and garlic, bread with every meal; slow stews and stuffed vegetables in the cold months.",
    dishes: ["Šopska salad with grilled chicken", "Sarma", "Ćevapi with ajvar and onion", "Stuffed peppers", "Bean stew with smoked meat", "Musaka", "Grilled trout with chard and potatoes", "Burek with yoghurt"] },
  Italian: { what: "Few ingredients, done well: olive oil, tomato, garlic, basil, Parmigiano. Pasta or risotto, then meat or fish with vegetables.",
    dishes: ["Pasta al pomodoro with chicken", "Mushroom risotto", "Minestrone", "Tuna and white bean salad", "Chicken cacciatore", "Caprese with bread", "Vegetable frittata", "Pasta e fagioli"] },
  Mediterranean: { what: "Olive oil and lemon, fresh herbs, yoghurt, grilled fish, chickpeas and lentils, plenty of vegetables.",
    dishes: ["Grilled fish with lemon potatoes", "Chicken souvlaki with tzatziki", "Shakshuka", "Lentil soup with lemon", "Hummus plate with falafel", "Chickpea and tomato stew", "Baked feta with vegetables", "Couscous salad with chicken"] },
  German: { what: "Hearty and plain: potatoes, rye bread, cabbage, mustard and quark, pork and poultry, soups and one-pot stews.",
    dishes: ["Chicken schnitzel with potato salad", "Lentil stew with sausage", "Potatoes with quark and linseed oil", "Rye bread with ham and gherkins", "Roast chicken with red cabbage", "Fish with mustard sauce and potatoes", "Pea soup", "Käsespätzle"] },
  French: { what: "Butter and wine, thyme and tarragon, sauces made in the pan, bread and cheese; a bistro meal is a main, a side and a green salad.",
    dishes: ["Chicken with tarragon and green beans", "Salade niçoise", "Herb omelette with a green salad", "Ratatouille with eggs", "Coq au vin", "Lentils with smoked sausage", "Steak with a green salad", "Quiche lorraine"] },
  Spanish: { what: "Olive oil, garlic, paprika and saffron, rice and legumes, seafood and cured ham; small plates to share.",
    dishes: ["Paella with chicken and seafood", "Spanish omelette", "Chickpeas with spinach", "Gazpacho with bread", "Garlic chicken", "Lentil stew", "Garlic prawns", "Pisto with egg"] },
  Greek: { what: "Olive oil, lemon, oregano, feta and yoghurt; grilled meat and fish, beans baked in tomato, bread and salad with every meal.",
    dishes: ["Chicken souvlaki with pita and tzatziki", "Greek salad with feta", "Baked giant beans", "Moussaka", "Bean soup", "Grilled sardines with lemon", "Spanakopita", "Stuffed tomatoes"] },
  Turkish: { what: "Yoghurt, mint and chilli flakes, grilled meat, bulgur and rice, red lentils, flatbread; many small cold dishes.",
    dishes: ["Chicken shish with bulgur", "Red lentil soup", "Menemen", "Köfte with yoghurt and salad", "Imam bayıldı", "Lahmacun", "Çılbır", "Stuffed courgettes"] },
  "Middle Eastern": { what: "Tahini, lemon, sumac, cumin and fresh herbs; chickpeas, lentils and grains, grilled meat, flatbread.",
    dishes: ["Chicken shawarma bowl", "Hummus with spiced lamb", "Lentils and rice with crispy onions", "Fattoush with grilled chicken", "Falafel wrap", "Baked fish with tahini", "Tabbouleh with grilled halloumi", "Lentil and chard soup"] },
  Indian: { what: "Spices cooked in oil first, then onion, ginger and garlic; lentils, rice and flatbread, yoghurt to cool; many dishes without meat.",
    dishes: ["Chicken tikka with rice", "Dal with rice", "Chana masala", "Palak paneer", "Egg curry", "Tandoori fish with salad", "Rajma with rice", "Vegetable biryani"] },
  Thai: { what: "Sour, sweet, salty and hot in one dish: lime, fish sauce, chilli, lemongrass, fresh herbs; rice with almost everything.",
    dishes: ["Chicken with holy basil and rice", "Green curry with chicken", "Larb with minced chicken", "Tom yum with prawns", "Pad thai", "Massaman curry", "Papaya salad with grilled chicken", "Fried rice with egg"] },
  Chinese: { what: "Soy, ginger, garlic and spring onion; quick stir-fries and steaming, rice or noodles, vegetables cooked crisp.",
    dishes: ["Chicken and broccoli stir-fry with rice", "Steamed fish with ginger and spring onion", "Mapo tofu", "Egg fried rice", "Kung pao chicken", "Tomato and egg stir-fry", "Hot and sour soup", "Beef noodle soup"] },
  Japanese: { what: "Clean tastes: soy, miso, dashi, rice vinegar; rice, fish, eggs and tofu, small portions of several dishes.",
    dishes: ["Salmon teriyaki with rice", "Miso soup with tofu and rice", "Oyakodon", "Chirashi bowl", "Ramen with egg", "Yakitori with rice", "Tamagoyaki with rice and pickles", "Udon with vegetables"] },
  Korean: { what: "Fermented and spicy: kimchi, gochujang, sesame and garlic; rice in the middle with small side dishes.",
    dishes: ["Bibimbap with egg", "Bulgogi with rice", "Kimchi fried rice", "Soft tofu stew", "Japchae", "Spicy pork stir-fry", "Kimchi stew", "Korean chicken skewers"] },
  Mexican: { what: "Corn and beans, chillies, lime and coriander, tomato salsa and avocado; tortillas with almost every meal.",
    dishes: ["Chicken tacos with salsa", "Black bean burrito bowl", "Huevos rancheros", "Chicken fajitas", "Chilli con carne", "Enchiladas", "Tortilla soup", "Ceviche with tostadas"] },
  American: { what: "Generous plates: grilled meat, burgers and big salads, eggs at breakfast, potatoes, corn and barbecue.",
    dishes: ["Grilled chicken Caesar salad", "Turkey burger with salad", "Scrambled eggs with toast", "BBQ chicken with corn", "Cobb salad", "Turkey chili", "Meatloaf with mashed potatoes", "Pancakes with berries and yoghurt"] },
};


// DT161 (0.3.3, board Stories113; Milan 19:30: "take into account selected kitchen dishes"): what each dish has, as it is usually
// made, so the dishes shown follow What you eat. m meat other than pork, p pork (ham, bacon, most sausage and smoked meat),
// f fish or seafood (fish sauce, dashi and kimchi count), e egg, d dairy, g grain (corn, rice, wheat and their breads and
// noodles), l legume (beans, lentils, chickpeas, peas, soy and soy sauce, peanuts). Written once, here, and checkable.
export const DISH_HAS: Record<string, string> = {
  "Šopska salad with grilled chicken": "md",
  "Sarma": "mpg",
  "Ćevapi with ajvar and onion": "m",
  "Stuffed peppers": "mpg",
  "Bean stew with smoked meat": "lp",
  "Musaka": "mped",
  "Grilled trout with chard and potatoes": "f",
  "Burek with yoghurt": "mgd",
  "Pasta al pomodoro with chicken": "gm",
  "Mushroom risotto": "gd",
  "Minestrone": "lg",
  "Tuna and white bean salad": "fl",
  "Chicken cacciatore": "m",
  "Caprese with bread": "dg",
  "Vegetable frittata": "ed",
  "Pasta e fagioli": "gl",
  "Grilled fish with lemon potatoes": "f",
  "Chicken souvlaki with tzatziki": "md",
  "Shakshuka": "e",
  "Lentil soup with lemon": "l",
  "Hummus plate with falafel": "lg",
  "Chickpea and tomato stew": "l",
  "Baked feta with vegetables": "d",
  "Couscous salad with chicken": "gm",
  "Chicken schnitzel with potato salad": "meg",
  "Lentil stew with sausage": "lp",
  "Potatoes with quark and linseed oil": "d",
  "Rye bread with ham and gherkins": "gp",
  "Roast chicken with red cabbage": "m",
  "Fish with mustard sauce and potatoes": "fd",
  "Pea soup": "l",
  "Käsespätzle": "ged",
  "Chicken with tarragon and green beans": "md",
  "Salade niçoise": "fe",
  "Herb omelette with a green salad": "e",
  "Ratatouille with eggs": "e",
  "Coq au vin": "mp",
  "Lentils with smoked sausage": "lp",
  "Steak with a green salad": "m",
  "Quiche lorraine": "pedg",
  "Paella with chicken and seafood": "gmf",
  "Spanish omelette": "e",
  "Chickpeas with spinach": "l",
  "Gazpacho with bread": "g",
  "Garlic chicken": "m",
  "Lentil stew": "l",
  "Garlic prawns": "f",
  "Pisto with egg": "e",
  "Chicken souvlaki with pita and tzatziki": "mgd",
  "Greek salad with feta": "d",
  "Baked giant beans": "l",
  "Moussaka": "med",
  "Bean soup": "l",
  "Grilled sardines with lemon": "f",
  "Spanakopita": "gde",
  "Stuffed tomatoes": "g",
  "Chicken shish with bulgur": "mg",
  "Red lentil soup": "l",
  "Menemen": "e",
  "Köfte with yoghurt and salad": "md",
  "Imam bayıldı": "",
  "Lahmacun": "mg",
  "Çılbır": "ed",
  "Stuffed courgettes": "mg",
  "Chicken shawarma bowl": "m",
  "Hummus with spiced lamb": "lm",
  "Lentils and rice with crispy onions": "lg",
  "Fattoush with grilled chicken": "mg",
  "Falafel wrap": "lg",
  "Baked fish with tahini": "f",
  "Tabbouleh with grilled halloumi": "gd",
  "Lentil and chard soup": "l",
  "Chicken tikka with rice": "mgd",
  "Dal with rice": "lg",
  "Chana masala": "l",
  "Palak paneer": "d",
  "Egg curry": "e",
  "Tandoori fish with salad": "fd",
  "Rajma with rice": "lg",
  "Vegetable biryani": "gd",
  "Chicken with holy basil and rice": "mgf",
  "Green curry with chicken": "mf",
  "Larb with minced chicken": "mfg",
  "Tom yum with prawns": "f",
  "Pad thai": "gefl",
  "Massaman curry": "mfl",
  "Papaya salad with grilled chicken": "mfl",
  "Fried rice with egg": "gef",
  "Chicken and broccoli stir-fry with rice": "mgl",
  "Steamed fish with ginger and spring onion": "fl",
  "Mapo tofu": "lp",
  "Egg fried rice": "gel",
  "Kung pao chicken": "ml",
  "Tomato and egg stir-fry": "e",
  "Hot and sour soup": "lpe",
  "Beef noodle soup": "mgl",
  "Salmon teriyaki with rice": "fgl",
  "Miso soup with tofu and rice": "lgf",
  "Oyakodon": "megfl",
  "Chirashi bowl": "fg",
  "Ramen with egg": "gepf",
  "Yakitori with rice": "mgl",
  "Tamagoyaki with rice and pickles": "egfl",
  "Udon with vegetables": "gfl",
  "Bibimbap with egg": "geml",
  "Bulgogi with rice": "mgl",
  "Kimchi fried rice": "gfe",
  "Soft tofu stew": "lfe",
  "Japchae": "ml",
  "Spicy pork stir-fry": "pl",
  "Kimchi stew": "pfl",
  "Korean chicken skewers": "ml",
  "Chicken tacos with salsa": "mg",
  "Black bean burrito bowl": "lgd",
  "Huevos rancheros": "egl",
  "Chicken fajitas": "mg",
  "Chilli con carne": "ml",
  "Enchiladas": "gdm",
  "Tortilla soup": "gm",
  "Ceviche with tostadas": "fg",
  "Grilled chicken Caesar salad": "mdefg",
  "Turkey burger with salad": "mg",
  "Scrambled eggs with toast": "eg",
  "BBQ chicken with corn": "mg",
  "Cobb salad": "mped",
  "Turkey chili": "ml",
  "Meatloaf with mashed potatoes": "megd",
  "Pancakes with berries and yoghurt": "ged",
};
// what each diet leaves out; Meat only keeps the dishes built on meat, fish or eggs without grains or legumes
const LEAVES_OUT: Record<string, string> = { Vegetarian: "mpf", Vegan: "mpfed", Pescatarian: "mp", "No pork": "p", Paleo: "gld", "Meat only": "gl" };
export function dishFits(dish: string, diet: string | undefined): boolean {
  const has = DISH_HAS[dish] ?? "", out = LEAVES_OUT[diet ?? ""];
  if (!out) return true;
  if ([...out].some((x) => has.includes(x))) return false;
  return diet !== "Meat only" || /[mpfe]/.test(has);
}
export const dishesFor = (kitchen: string, diet: string | undefined) => (KITCHEN[kitchen]?.dishes ?? []).filter((d) => dishFits(d, diet));

// what the person did with a kitchen's dishes: the three shown, and each swapped away with the dish that took its place
export type Taste = { shown: string[]; out: { dish: string; with: string }[] };
export type Tastes = Record<string, Taste>;
// DT161: with a diet, only the dishes that fit it: a kept dish that no longer fits gives its place to the next one that does
export function tasteOf(p: Pick<Personal, "kitchenTaste" | "lifestyle">, kitchen: string): Taste {
  const fit = dishesFor(kitchen, p.lifestyle?.diet); const t = p.kitchenTaste?.[kitchen];
  if (!(t && Array.isArray(t.shown))) return { shown: fit.slice(0, 3), out: [] };
  const shown = t.shown.filter((d) => fit.includes(d));
  for (const d of fit) { if (shown.length >= 3) break; if (!shown.includes(d) && !t.out.some((o) => o.dish === d)) shown.push(d); }
  return { shown, out: t.out };
}
// Another: the dish at that place makes way for the next one not shown and not swapped away; when there is none, it stays
export function another(t: Taste, kitchen: string, at: number, diet?: string): Taste {
  const k = KITCHEN[kitchen]; if (!k || !t.shown[at]) return t;
  const next = dishesFor(kitchen, diet).find((d) => !t.shown.includes(d) && !t.out.some((o) => o.dish === d));
  if (!next) return t;
  return { shown: t.shown.map((d, i) => (i === at ? next : d)), out: [...t.out, { dish: t.shown[at], with: next }] };
}
export const anotherLeft = (t: Taste, kitchen: string, diet?: string) => dishesFor(kitchen, diet).some((d) => !t.shown.includes(d) && !t.out.some((o) => o.dish === d));
// Undo: the last dish swapped away comes back in its place
export function undo(t: Taste): Taste {
  const last = t.out[t.out.length - 1]; if (!last) return t;
  const at = t.shown.indexOf(last.with);
  return { shown: at >= 0 ? t.shown.map((d, i) => (i === at ? last.dish : d)) : t.shown, out: t.out.slice(0, -1) };
}
// what Chef Mealan gets: per kitchen, the dishes kept to cook toward and the ones swapped away to leave out
export function tasteForChef(p: Pick<Personal, "kitchens" | "kitchenTaste" | "lifestyle">): { kitchen: string; cook_toward: string[]; leave_out: string[] }[] {
  return (p.kitchens ?? []).filter((k) => KITCHEN[k]).map((k) => { const t = tasteOf(p, k); return { kitchen: k, cook_toward: t.shown, leave_out: t.out.map((o) => o.dish) }; });
}
