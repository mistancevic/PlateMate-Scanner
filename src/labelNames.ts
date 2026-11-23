// DT339 (0.3.180, board Stories280; Go 23 November 2026, 11:53, option A): a nutrition table printed in several languages,
// each line joined with slashes (Tuky/Masti/Мазнини/Λιπαρά), shows the app's own name in the app's language, with the
// printed name small under it. The printed name stays the record, as read, never changed.
// Recognising a line: the whole printed name first, then each part between slashes. More languages than the first pass in
// labeltable.ts knows: Czech, Slovak, Polish, Hungarian, Romanian, Slovenian, Bulgarian and Greek. A stem of 4 letters or
// more matches the start of a word; a shorter one (sol, сол, só) needs a word end, so Solubilní is not salt.
import { w, type WordKey } from "./words";

const STEMS: Record<string, string[]> = {
  energy: ["energetick", "енерг", "ενέργ", "ενεργ", "energia", "wartość energ", "energiaérték", "valoare energ"],
  fat: ["tuky", "tuk", "мазнини", "λιπαρ", "λίπη", "tłuszcz", "zsír", "grăsim", "grasim", "maščob"],
  saturates: ["nasycen", "nasýten", "наситен", "κορεσμ", "telített", "saturat", "nasičen"],
  carbohydrate: ["sacharid", "въглехидрат", "υδατάνθρακ", "węglowodan", "szénhidrát", "glucid", "ogljikov"],
  sugars: ["cukr", "cukor", "захар", "σάκχαρ", "zahar", "sladkor"],
  fibre: ["vláknin", "vlaknin", "влакнин", "φυτικές ίν", "błonnik", "rost"],
  protein: ["bílkovin", "bielkovin", "bjelančevin", "белтъч", "протеин", "πρωτεΐν", "πρωτειν", "białk", "fehérj", "beljakovin"],
  salt: ["sůl", "soľ", "сол", "αλάτι", "sól", "só", "sare"],
};
const MICRO: [string, RegExp][] = [
  ["calcium", /(calci|kalzi|kalcij|vápník|vápnik|калций|ασβέστ|wapń)/i],
  ["iron", /(\biron\b|eisen|željez|gvožđ|železo|желяз|σίδηρ|żelaz)/i],
  ["magnesium", /(magnes|магнез|μαγνήσ|hořčík|horčík)/i],
  ["zinc", /(zinc|zink|\bcink\b|цинк|ψευδάργ)/i],
  ["potassium", /(potass|kalium|kalij|draslík|калий|κάλιο)/i],
  ["iodine", /(iod|\bjod|йод|ιώδ)/i],
];
export const OF_WHICH = /^(davon|of which|od toga|od čega|od kojih|od tega|z toho|z tego|w tym|от които|εκ των οποίων|de los cuales|waarvan|dont|di cui|ebből|amelyből|din care)\s*/i;
const LETTER = (n: string) => !/\p{L}/u.test(n);

// a line known by its stem, in the languages the first pass does not know
export function stemOf(name: string): string | null {
  const n = name.toLowerCase().replace(OF_WHICH, "").trim();
  for (const [key, list] of Object.entries(STEMS)) for (const s of list) if (n.startsWith(s) && (s.length >= 4 || LETTER(n.charAt(s.length)))) return key;
  return null;
}
// a vitamin by its letter, or a mineral the app knows by name
export function microOf(name: string): string | null {
  const v = name.toLowerCase().match(/(vitamin[ae]?|vitamín|витамин|βιταμίνη|witamina)\s*([a-zавсдек])\s*(\d{0,2})/i);
  if (v) { const cyr: Record<string, string> = { а: "a", в: "b", с: "c", д: "d", е: "e", к: "k" }; return `micro:vit${(cyr[v[2]] ?? v[2]) + v[3]}`; }
  for (const [k, re] of MICRO) if (re.test(name)) return "micro:" + k;
  return null;
}
export const partsOf = (name: string) => name.split(/\s*\/\s*/).map((s) => s.trim()).filter(Boolean);

// the app's own name for a line, in the app's language; null for a line it does not know
const WORD: Record<string, WordKey> = {
  energy: "nutrition.rowEnergy", fat: "nutrition.rowFat", saturates: "nutrition.rowSaturates", carbohydrate: "nutrition.rowCarbs", sugars: "nutrition.rowSugars",
  polyols: "nutrition.rowPolyols", fibre: "nutrition.rowFibre", protein: "nutrition.rowProtein", salt: "nutrition.rowSalt",
  trans: "label.line.trans", mono: "label.line.mono", poly: "label.line.poly", cholesterol: "label.line.cholesterol", addedsugars: "label.line.addedsugars",
  starch: "label.line.starch", sodium: "label.line.sodium", alcohol: "label.line.alcohol",
  "micro:calcium": "label.line.calcium", "micro:iron": "label.line.iron", "micro:magnesium": "label.line.magnesium", "micro:zinc": "label.line.zinc",
  "micro:potassium": "label.line.potassium", "micro:iodine": "label.line.iodine",
};
const VIT = /^micro:vit([a-k])(\d{0,2})$/;
export function appName(key: string): string | null {
  if (WORD[key]) return w(WORD[key]);
  const v = key.match(VIT); if (v && "abcdek".includes(v[1])) return w("label.line.vitamin", { x: v[1].toUpperCase() + v[2] });
  return null;
}
export const knownName = (key: string) => appName(key) !== null;
// what a line shows: the app's name when it knows the line, else the printed name; and the printed name under it when it differs
export const shownName = (r: { key: string; name: string }) => appName(r.key) ?? r.name;
export const printedUnder = (r: { key: string; name: string }): string | null => {
  const a = appName(r.key); return a !== null && a.trim().toLowerCase() !== r.name.trim().toLowerCase() ? r.name : null;
};
