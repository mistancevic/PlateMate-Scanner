// DT342 (0.3.185, board Stories285; Go 23 November 2026, 16:21): fibre 0 where it is a fact. A food with no fibre value whose
// name says it has no fibre by nature counts as 0 wherever foods are added up; its own values stay as on its pack (what is on
// the package is what we show). Tea, coffee, water and salt as DT336 reads them; oil, sugar, meat, fish, eggs and plain milk
// products (Coach Milan 16:20: they have none by nature). Whole words in English, German and Serbian, Latin and Cyrillic, the
// name only. A word for something with fibre in it, or added fibre (inulin, 16:20), blocks the 0 and always wins.
import { obviousZero } from "./obvious0";

const FREE = [
  // oil, sugar
  "oil", "öl", "olivenöl", "rapsöl", "sonnenblumenöl", "ulje", "уље", "sugar", "zucker", "šećer", "шећер",
  // meat
  "chicken", "beef", "pork", "turkey", "veal", "lamb", "ham", "bacon", "steak", "mince", "hähnchen", "hühnchen", "huhn", "hähnchenbrust", "rind", "rindfleisch", "schwein",
  "schweinefleisch", "pute", "putenbrust", "kalb", "kalbfleisch", "lamm", "schinken", "speck", "hackfleisch", "piletina", "pileća", "pileći", "junetina", "svinjetina",
  "ćuretina", "teletina", "jagnjetina", "šunka", "slanina", "пилетина", "пилећа", "јунетина", "свињетина", "ћуретина", "телетина", "јагњетина", "шунка", "сланина",
  // fish
  "fish", "salmon", "tuna", "cod", "trout", "sardines", "mackerel", "shrimp", "prawns", "fisch", "lachs", "thunfisch", "kabeljau", "forelle", "garnelen", "makrele",
  "riba", "losos", "tunjevina", "tuna", "oslić", "pastrmka", "sardine", "skuša", "škampi", "риба", "лосос", "туњевина", "ослић", "пастрмка", "сардине", "скуша", "шкампи",
  // eggs
  "egg", "eggs", "ei", "eier", "eiklar", "jaje", "jaja", "belance", "јаје", "јаја", "беланце",
  // plain milk products
  "milk", "yogurt", "yoghurt", "skyr", "quark", "cheese", "butter", "kefir", "mozzarella", "feta", "milch", "joghurt", "magerquark", "käse", "frischkäse", "hüttenkäse",
  "mleko", "jogurt", "sir", "maslac", "kajmak", "млеко", "јогурт", "сир", "маслац", "кајмак",
];
const BLOCK = [
  "muesli", "müsli", "musli", "granola", "fruit", "fruits", "frucht", "früchte", "strawberry", "erdbeer", "erdbeere", "banana", "bananen", "blueberry", "heidelbeere",
  "chocolate", "schokolade", "cocoa", "kakao", "nuts", "nüsse", "oats", "hafer", "bread", "brot", "breaded", "paniert", "cereal", "cereals", "vegetables", "gemüse",
  "beans", "bohnen", "tomato", "tomate", "tomaten", "seeds", "samen", "jam", "marmelade", "konfitüre", "cake", "kuchen", "keks", "kekse", "biscuit", "biscuits", "cookie",
  "cookies", "pizza", "burger", "sandwich", "wrap", "salad", "salat", "juice", "saft", "iced", "eistee", "inulin", "chicory", "chicorée", "ballaststoff", "ballaststoffe", "ballaststoffen", "fibre", "fiber",
  "früchten", "erdbeeren", "heidelbeeren", "nüssen", "haferflocken", "körner", "getreide",
];
// Serbian changes the end of a word (sa voćem, od čokolade), so a Serbian block word blocks every word that starts with it
const SR_STEMS = ["voć", "jagod", "banan", "borovnic", "čokolad", "kakao", "orah", "oras", "zob", "ovs", "hleb", "pohovan", "žitaric", "povrć", "pasulj", "paradajz", "semen",
  "džem", "kolač", "keks", "tort", "salat", "sok", "inulin", "vlakn", "воћ", "јагод", "банан", "боровниц", "чоколад", "какао", "орах", "орас", "зоб", "овс", "хлеб", "похован",
  "житариц", "поврћ", "пасуљ", "парадајз", "семен", "џем", "колач", "кекс", "торт", "салат", "сок", "инулин", "влакн"];
const words = (s: string) => s.toLowerCase().normalize("NFC").split(/[^\p{L}\p{N}]+/u).filter(Boolean);
export function fibreFree(name: string): boolean {
  const t = words(name || "");
  if (!t.length || t.some((x) => BLOCK.includes(x) || SR_STEMS.some((s) => x.startsWith(s)))) return false;
  return t.some((x) => FREE.includes(x)) || obviousZero(name) !== null;
}
// a food's fibre for adding up: its own value, else 0 when it has none by nature, else null (unknown)
export const fibreOf = (f: { name: string; fiber: number | null | undefined }): number | null => (f.fiber === null || f.fiber === undefined ? (fibreFree(f.name) ? 0 : null) : f.fiber);
