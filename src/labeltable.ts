// A food's nutrition table as printed: every line, in order. Known lines are recognised in several languages.
export type Unit = "kcal" | "kJ" | "g" | "mg" | "µg" | "%";
export type LabelRow = { key: string; name: string; amount: number | null; unit: Unit; sub: boolean; source: "label" | "database" | "you" };
type Known = { key: string; name: string; sub: boolean; unit: Unit; re: RegExp; core?: "calories" | "fats" | "carbs" | "fiber" | "protein" };
// European order (Regulation 1169/2011, Annex XV), then the usual extras
export const KNOWN: Known[] = [
  { key: "energy", name: "Energy", sub: false, unit: "kcal", core: "calories", re: /^(energ|brennwert|kalorij|valor energ|calor)/i },
  { key: "fat", name: "Fat", sub: false, unit: "g", core: "fats", re: /^(fett\b|fat\b|fats\b|total fat|masti?\b|ukupne masti|grasa|vet\b|lipid|graisses|grassi)/i },
  { key: "saturates", name: "of which saturates", sub: true, unit: "g", re: /(gesättigt|saturat|zasićen|zasicen|saturad|verzadig|satur)/i },
  { key: "trans", name: "of which trans fat", sub: true, unit: "g", re: /trans/i },
  { key: "mono", name: "of which mono-unsaturates", sub: true, unit: "g", re: /(einfach unges|mono|jednostruko nezas|mononezas|monoinsat)/i },
  { key: "poly", name: "of which polyunsaturates", sub: true, unit: "g", re: /(mehrfach unges|poly.?unsat|polinezas|višestruko nezas|visestruko nezas|poliinsat|polyunsat)/i },
  { key: "cholesterol", name: "Cholesterol", sub: false, unit: "mg", re: /(cholest|holesterol|colesterol)/i },
  { key: "carbohydrate", name: "Carbohydrate", sub: false, unit: "g", core: "carbs", re: /^(kohlenhydrat|carbohydrat|total carb|ugljeni hidrat|ugljikohidrat|hidratos|koolhydrat|glucides|carboidrat)/i },
  { key: "sugars", name: "of which sugars", sub: true, unit: "g", re: /(zucker|sugar|šećer|secer|azúcar|azucar|suiker|sucres|zuccher)/i },
  { key: "addedsugars", name: "of which added sugars", sub: true, unit: "g", re: /added sugar|zugesetzt/i },
  { key: "polyols", name: "of which polyols", sub: true, unit: "g", re: /(mehrwertige alkohol|polyol|poliol|polialkohol|sugar.?alcohol|zuckeralkohol|šećerni alkohol|secerni alkohol|alcoholes de az|alcools de sucre|suikeralcohol|erythrit|eritrit|maltit|xylit|sorbit)/i },
  { key: "starch", name: "of which starch", sub: true, unit: "g", re: /(stärke|starch|škrob|skrob|almidón|almidon|zetmeel|amidon|amido)/i },
  { key: "fibre", name: "Fibre", sub: false, unit: "g", core: "fiber", re: /(ballaststoff|fib(re|er)|vlakn|fibra|vezel|fibres)/i },
  { key: "protein", name: "Protein", sub: false, unit: "g", core: "protein", re: /(eiweiß|eiweiss|protein|proteín|proteina|eiwit|protéines)/i },
  { key: "salt", name: "Salt", sub: false, unit: "g", re: /^(salz|salt|so\b|sol\b|sal\b|zout|sel\b|sale\b)/i },
  { key: "sodium", name: "Sodium", sub: false, unit: "mg", re: /(natrium|sodium|sodio|natrijum)/i },
  { key: "alcohol", name: "Alcohol", sub: false, unit: "g", re: /^(alkohol\b|alcohol\b|alcool)/i },
];
const ORDER = KNOWN.map((k) => k.key);
// "davon Zucker" before "Zucker" etc.: strip the "of which" words, then look for a known line
export function recognise(name: string): string {
  const n = name.toLowerCase().replace(/^(davon|of which|od toga|od čega|de los cuales|waarvan|dont|di cui)\s*/i, "").trim();
  // "ungesättigt" contains "gesättigt": the unsaturated lines are checked before the saturated one
  const first = ["mono", "poly", "trans", "polyols", "addedsugars"];
  for (const key of first) { const k = knownOf(key)!; if (k.re.test(n)) return key; }
  for (const k of KNOWN) if (k.re.test(n)) return k.key;
  if (/vitamin|vitamín|vitamina|kalzium|calcium|kalcij|eisen|iron|gvožđe|magnes|zink|zinc|kalium|potassium|jod|iodine|folat|folic/i.test(n)) return "micro:" + n.replace(/[^a-zäöüßčćšđž0-9 ]/gi, "").trim().slice(0, 30);
  return "other:" + n.slice(0, 40);
}
export const knownOf = (key: string) => KNOWN.find((k) => k.key === key);
export const coreKeyOf = (field: string) => KNOWN.find((k) => k.core === field)?.key;
// rows from a raw table (as read from a label), each tagged
export function rowsFromRaw(raw: { name: string; amount: number | null; unit?: string; sub?: boolean }[], source: LabelRow["source"]): LabelRow[] {
  return raw.filter((r) => r && typeof r.name === "string" && r.name.trim()).slice(0, 40).map((r) => {
    const key = recognise(r.name);
    const k = knownOf(key);
    const unit = (["kcal", "kJ", "g", "mg", "µg", "%"].includes(String(r.unit)) ? r.unit : k?.unit ?? "g") as Unit;
    return { key, name: r.name.trim().slice(0, 60), amount: typeof r.amount === "number" && Number.isFinite(r.amount) ? r.amount : null, unit, sub: r.sub ?? k?.sub ?? false, source: ((r as any).source as LabelRow["source"]) ?? source };
  });
}
// European order for a table built from known values (database, typed, or older foods)
export function sortEuropean(rows: LabelRow[]): LabelRow[] {
  const rank = (r: LabelRow) => { const i = ORDER.indexOf(r.key); return i === -1 ? 900 + (r.key.startsWith("micro:") ? 0 : 50) : i; };
  return [...rows].sort((a, b) => rank(a) - rank(b));
}
// the rows a table shows: the printed ones, plus the core values when the table lacks them, in a sensible place
export function displayRows(food: { table?: LabelRow[]; calories: number | null; fats: number | null; carbs: number | null; fiber: number | null; protein: number | null }): LabelRow[] {
  // a line saved without its tag gets recognised again from its printed name
  const rows = (food.table ?? []).map((r) => (r.key ? r : { ...r, key: recognise(r.name) })).filter((r) => !(r.key === "energy" && r.unit === "kJ"));
  const have = new Set(rows.map((r) => r.key));
  const add: LabelRow[] = [];
  for (const k of KNOWN) if (k.core && !have.has(k.key)) add.push({ key: k.key, name: k.name, amount: (food as any)[k.core] ?? null, unit: k.unit, sub: false, source: "label" });
  if (!rows.length) return sortEuropean(add);
  // printed order kept; missing core lines slotted in by European order
  return sortEuropean([...rows, ...add]).sort((a, b) => {
    const ia = rows.indexOf(a), ib = rows.indexOf(b);
    return ia >= 0 && ib >= 0 ? ia - ib : 0;
  });
}
// totals of recognised lines on a plate, for information
export function lineTotal(items: { food: { table?: LabelRow[] }; grams: number }[], key: string): number | null {
  let sum = 0, any = false;
  for (const i of items) { const r = i.food.table?.find((x) => x.key === key && x.amount != null && (x.unit === "g")); if (r) { sum += (r.amount! * i.grams) / 100; any = true; } }
  return any ? sum : null;
}

// Values as a label prints them (Milan, 8 October 2026): a database that works per 100 g from a serving gives 313.3333
// kcal or 8.888889 g. Energy and milligrams in whole numbers, grams to one decimal, under 1 g to two.
export function tidy(x: number | null | undefined, unit: string = "g"): number | null {
  if (typeof x !== "number" || !Number.isFinite(x)) return null;
  const d = unit === "kcal" || unit === "kJ" || unit === "mg" || unit === "µg" ? 0 : Math.abs(x) < 1 ? 2 : 1;
  const f = 10 ** d;
  return Math.round(x * f) / f;
}
// A database's table plus the lines read from the pack that the database lacks (sugar alcohols, often): the database's
// lines stay as they are, the pack's extra lines are added, in European order.
export function withPackLines(db: LabelRow[], pack: LabelRow[]): LabelRow[] {
  const have = new Set(db.map((r) => r.key || recognise(r.name)));
  const extra = pack.filter((r) => { const k = r.key || recognise(r.name); return !have.has(k) && !(k === "energy" && r.unit === "kJ"); });
  return extra.length ? sortEuropean([...db, ...extra]) : db;
}
