// A small picture for a food when there is no photo yet. Keyword match on the name, plain emoji.
const MAP: [RegExp, string][] = [
  [/nutella|schoko|choco|kakao|cocoa/i, "🍫"], [/skyr|joghurt|yogurt|yoghurt|quark/i, "🥣"], [/keks|biscuit|cookie|cracker/i, "🍪"],
  [/h[üu]hn|chicken|poulet|pute|turkey/i, "🍗"], [/reis|rice/i, "🍚"], [/banan/i, "🍌"], [/hafer|oat|porridge|müsli|muesli/i, "🌾"],
  [/\bei\b|eier|egg/i, "🥚"], [/erdnuss|peanut|nuss|nut|mandel|almond/i, "🥜"], [/apfel|apple/i, "🍎"], [/whey|protein|shake|eiweiß/i, "🥤"],
  [/käse|cheese|hütten|cottage/i, "🧀"], [/brot|bread|toast|brötchen/i, "🍞"], [/lachs|salmon|fisch|fish|thunfisch|tuna/i, "🐟"],
  [/honig|honey|sirup|syrup/i, "🍯"], [/milch|milk/i, "🥛"], [/kartoffel|potato|pommes/i, "🥔"], [/nudel|pasta|spaghetti/i, "🍝"],
  [/beere|berry|erdbeer|strawberry|himbeer/i, "🍓"], [/eis|ice cream|gelato/i, "🍨"], [/pizza/i, "🍕"], [/salat|salad|gemüse|vegetable/i, "🥗"],
  [/rind|beef|steak|hack/i, "🥩"], [/butter|öl|oil/i, "🧈"], [/kuchen|cake|torte|muffin|donut/i, "🍰"], [/bier|beer|wein|wine|cola/i, "🍺"],
];
export const iconFor = (name: string) => MAP.find(([re]) => re.test(name))?.[1] ?? "🍽️";
