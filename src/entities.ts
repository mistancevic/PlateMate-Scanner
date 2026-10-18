// A page's signs read as the letters they are (0.2.25, board RP1b: it&#8217;s showed as code): numbers, and the common names
const NAMED: Record<string, string> = { nbsp: " ", amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", rsquo: "\u2019", lsquo: "\u2018", rdquo: "\u201d", ldquo: "\u201c", ndash: "\u2013", mdash: "\u2014", hellip: "\u2026", deg: "\u00b0", frac12: "\u00bd", frac14: "\u00bc", frac34: "\u00be", times: "\u00d7", eacute: "\u00e9", egrave: "\u00e8", uuml: "\u00fc", ouml: "\u00f6", auml: "\u00e4", szlig: "\u00df" };
export function decodeEntities(t: string): string {
  const cp = (n: number) => (Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : "");
  return String(t).replace(/&#(\d{1,7});/g, (_, n) => cp(Number(n))).replace(/&#x([0-9a-f]{1,6});/gi, (_, h) => cp(parseInt(h, 16))).replace(/&([a-z][a-z0-9]{1,8});/gi, (m, k) => NAMED[k.toLowerCase()] ?? m);
}
// a name as the page wrote it, read as letters (0.2.29, R1: Sally&#039;s Baking showed as code): one line, trimmed
export const cleanText = (t: unknown, max: number) => decodeEntities(String(t ?? "")).replace(/\s+/g, " ").trim().slice(0, max);
// R1 (0.2.29): names saved before the reader cleaned them (Sally&#039;s Baking) read as letters. Returns a copy when it changes.
const txt = (t: unknown) => (typeof t === "string" && /&#?[a-z0-9]+;/i.test(t) ? decodeEntities(t) : t);
export function cleanMealNames(m: any): any {
  if (!m || typeof m !== "object") return m;
  const out = { ...m, title: txt(m.title) };
  if (m.source && typeof m.source === "object") out.source = { ...m.source, name: txt(m.source.name) };
  if (m.basedOn && typeof m.basedOn === "object") out.basedOn = { ...m.basedOn, title: txt(m.basedOn.title) };
  if (Array.isArray(m.items)) out.items = m.items.map((i: any) => (i?.food ? { ...i, food: { ...i.food, name: txt(i.food.name) } } : i));
  return out;
}
export const cleanFoodNames = (f: any) => (f && typeof f === "object" ? { ...f, name: txt(f.name) } : f);
export const cleanCardNames = (c: any) => (c && typeof c === "object" ? { ...c, meal: cleanMealNames(c.meal) } : c);
export const cleanText1 = txt;
