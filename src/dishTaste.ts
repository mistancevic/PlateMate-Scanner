// R9 (0.2.33, Milan 18 October 2026, 10:31 to 10:59, canvas boards RS4 and RS5): what you add follows the dish.
// The whole dish decides, never one layer: a dish is sweet or savoury, set by the foods that define it; basics fit both;
// a food the dish's taste rejects is not offered. Which part it goes into is the cook's call. A food the rules can't
// place is let through: a wrong block hides a good food, a wrong pass only offers one too many.
// Name rules, in this order: the explicit sweet foods, the explicit savoury ones, the basics, then the food's kind.
export type Taste = "sweet" | "fruit" | "savoury" | "veg" | "basic" | "unknown";
export type DishTaste = "sweet" | "savoury" | null;

const SWEET = /nutella|chocolate|schoko|kakao|cocoa|cacao|\bjam\b|marmelade|konfit|honey|honig|syrup|sirup|sugar|zucker|icing|frosting|glaze|glasur|caramel|karamell|candy|cookie|keks|biscuit|whey|protein ?powder|proteinpulver|casein|sprinkles|marzipan|nougat|ice ?cream|\beis\b|dattel|\bdates?\b/i;
const SAVOURY = /chicken|hähnchen|huhn|beef|\brind|pork|schwein|\bham\b|schinken|bacon|speck|sausage|wurst|salami|turkey|\bpute|lamb|lamm|steak|fish|fisch|tuna|thunfisch|salmon|lachs|shrimp|garnel|prawn|anchov|sardin|onion|zwiebel|shallot|schalotte|garlic|knoblauch|\bleek|lauch|ketchup|mustard|senf|mayo|soy ?sauce|sojasauce|\bstock\b|brühe|broth|bouillon|parmesan|cheddar|gouda|emmental|mozzarella|feta|halloumi|pasta|nudel|noodle|spaghetti|penne|\brice\b|\breis\b|potato|kartoffel|tortilla|tofu|tempeh|seitan/i;
const FRUIT = /banana|banane|apple|apfel|berr|beere|fruit|frucht|mango|orange|pear|birne|grape|traube|peach|pfirsich|cherr|kirsch|plum|pflaume|apricot|aprikose|raisin|rosine|lemon|zitrone|lime/i;
const BASIC = /flour|mehl|butter(?!keks)|\boil\b|öl\b|\begg|\beier?\b|milk|milch|cream|sahne|yog|joghurt|skyr|quark|cottage|hüttenk|ricotta|mascarpone|frischk|kefir|salt|salz|yeast|hefe|baking (powder|soda)|backpulver|natron|vanill|cinnamon|zimt|nutmeg|muskat|cardamom|ginger|ingwer|clove|nelke|allspice|spice|gewürz|pepper|pfeffer|paprika|cumin|kümmel|water|wasser|cornstarch|starch|stärke|gelatin|oat|hafer|bread|brot|\bnut|nuss|almond|mandel|walnut|hazelnut|haselnuss|pecan|pistach|cashew|seed|samen|coconut|kokos/i;
const VEG = /tomato|tomate|carrot|karotte|möhre|zucchini|pumpkin|kürbis|spinach|spinat|lettuce|salat|cucumber|gurke|pepper(s)? \(bell|bell pepper|paprikaschote|broccoli|cauliflower|blumenkohl|cabbage|kohl|mushroom|pilz|pea\b|peas|erbse|bean|bohne|corn\b|mais|avocado|celery|sellerie|beet|rote bete/i;

export function tasteOf(name: string): Taste {
  if (SWEET.test(name)) return "sweet";
  if (SAVOURY.test(name)) return "savoury";
  if (FRUIT.test(name)) return "fruit";
  if (VEG.test(name)) return "veg";
  if (BASIC.test(name)) return "basic";
  return "unknown";
}
// The dish's taste: sweet when sweet foods or fruit define it and nothing savoury does; savoury the other way round.
// Both, or neither: no taste, and nothing is held back.
export function dishTaste(names: string[]): DishTaste {
  const t = names.map(tasteOf);
  const sweet = t.some((x) => x === "sweet" || x === "fruit"), savoury = t.some((x) => x === "savoury");
  return sweet && !savoury ? "sweet" : savoury && !sweet ? "savoury" : null;
}
// Whether a food may be offered for this dish. Fruit and vegetables cook both ways (an apple in a salad, carrots in a cake).
export function goesInDish(dish: DishTaste, name: string): boolean {
  if (!dish) return true;
  const t = tasteOf(name);
  return dish === "sweet" ? t !== "savoury" : t !== "sweet";
}
// The line under the search when a food you have is held back: "Chicken breast, cooked is in your foods, but it doesn't go
// with this dessert." Two or more are named together.
export function heldBackLine(dish: Exclude<DishTaste, null>, names: string[]): string {
  const list = names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  return `${list} ${names.length === 1 ? "is" : "are"} in your foods, but ${names.length === 1 ? "it doesn't" : "they don't"} go with this ${dish === "sweet" ? "dessert" : "dish"}.`;
}
