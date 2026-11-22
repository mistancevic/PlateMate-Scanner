// DT336 (0.3.174, board Stories274; Go 22 November 2026, 20:47): a product read from a barcode with no values in the
// product database is obviously 0 when its category or its name says tea, coffee, water or salt. The list was settled
// by Coach Milan on 22 November 2026, 20:32: the category first; the name only when there is no category, as a whole
// word; a word or category that blocks the 0 always wins, over the category and over the name.
export type ZeroKind = "tea" | "coffee" | "water" | "salt";

// Open Food Facts category tags
const CATEGORY: Record<string, ZeroKind> = {
  "en:teas": "tea", "en:green-teas": "tea", "en:black-teas": "tea", "en:herbal-teas": "tea", "en:infusions": "tea",
  "en:coffees": "coffee", "en:ground-coffees": "coffee", "en:coffee-beans": "coffee", "en:instant-coffees": "coffee",
  "en:waters": "water", "en:mineral-waters": "water", "en:spring-waters": "water",
  "en:salts": "salt", "en:sea-salts": "salt",
};
const BLOCK_CATEGORY = ["en:iced-teas", "en:coffee-drinks", "en:flavoured-waters", "en:sweetened-beverages"];

// whole words; a phrase is a run of whole words
const NAME: [ZeroKind, string[]][] = [
  ["tea", ["tea", "tee", "kräutertee", "čaj", "чај"]],
  ["coffee", ["coffee", "kaffee", "kafa", "кафа"]],
  ["water", ["water", "wasser", "mineralwasser", "voda", "вода"]],
  ["salt", ["salt", "salz", "morska so", "kuhinjska so"]],
];
const BLOCK = [
  "iced tea", "eistee", "latte", "cappuccino", "3in1", "milk", "milch", "sugar", "zucker",
  "syrup", "juice", "saft", "flavoured", "geschmack", "crisps", "chips", "biscuits", "kekse", "cake",
  "kuchen", "chocolate", "schokolade", "cream", "sahne", "nuts", "vinegar",
  // B157 (0.3.175, board Stories275; Go 22 November 2026, 21:57): Ice Tea, written without the d
  "ice tea", "icetea",
];
// B157: Serbian changes the end of a word (sa šećerom, bez šećera, sa mlekom), so a Serbian block word blocks every word that
// starts with it, in Latin and Cyrillic; and leden before čaj (ledeni čaj, ledenog čaja)
const SR_STEMS = [
  "šećer", "mlek", "mleč", "čokolad", "kolač", "keks", "sok", "sirup", "krem", "pavlak", "šlag", "čips", "sirć", "tort", "orah", "oras", "ukus",
  "шећер", "млек", "млеч", "чоколад", "колач", "кекс", "сок", "сируп", "крем", "павлак", "шлаг", "чипс", "сирћ", "торт", "орах", "орас", "укус",
];
const srBlocks = (t: string[]) => t.some((x, i) => SR_STEMS.some((s) => x.startsWith(s))
  || (x.startsWith("leden") && (t[i + 1] ?? "").startsWith("čaj")) || (x.startsWith("леден") && (t[i + 1] ?? "").startsWith("чај")));

const words = (s: string) => s.toLowerCase().normalize("NFC").split(/[^\p{L}\p{N}]+/u).filter(Boolean);
function has(tokens: string[], phrase: string) {
  const p = words(phrase);
  for (let i = 0; i + p.length <= tokens.length; i++) if (p.every((x, j) => tokens[i + j] === x)) return true;
  return false;
}

export function obviousZero(name: string, categories?: unknown): ZeroKind | null {
  const tokens = words(name || "");
  const cats = Array.isArray(categories) ? categories.filter((c): c is string => typeof c === "string").map((c) => c.toLowerCase()) : [];
  if (BLOCK.some((b) => has(tokens, b)) || srBlocks(tokens) || cats.some((c) => BLOCK_CATEGORY.includes(c))) return null;
  if (cats.length) {
    for (const c of cats) if (CATEGORY[c]) return CATEGORY[c];
    return null;
  }
  for (const [kind, list] of NAME) if (list.some((x) => has(tokens, x))) return kind;
  return null;
}
