// One food, one identity (0.2.104, board Stories71, DT125; Milan 25 October 13:07: "why such a mess with the food lists").
// Four sources named the same food four ways and the name was the key. Now a food is one thing with an identity: its barcode
// when it has one; its place in the basic foods table when it is a basic food; else its name and brand. Names in every
// language hang off the identity, so any of them finds the food and none of them makes a second one.
import type { Food } from "./pilot";
import { REFERENCE, namesOf as refNamesOf, synonymsOf } from "./reference";

export const fold = (x: string) => String(x ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/ß/g, "ss").trim();
const slug = (x: string) => fold(x).replace(/[^\p{L}\p{N}]+/gu, " ").trim();

export type Identified = { barcode?: string; refId?: string; name: string; brand?: string };
// "typical values, check your pack" on a starter food is a note, not a brand
export const noBrand = (b: string | undefined) => !slug(b ?? "") || /typical values/i.test(b ?? "");
export function identityOf(f: Identified): string {
  if (f.barcode && /^\d{8,14}$/.test(f.barcode)) return `b:${f.barcode}`;
  // a basic food has no brand: a branded peanut butter with its own label is its own food, not the table's
  const r = f.refId || noBrand(f.brand) ? basicOf(f) : null;
  if (r) return `r:${r.id}`;
  return `n:${slug(f.name)}|${slug(f.brand ?? "")}`;
}
export const sameIdentity = (a: Identified, b: Identified) => identityOf(a) === identityOf(b);

// the basic food behind a food, by its id or by any of its names (a copy from the table made before refId existed)
export function basicOf(f: Identified) {
  if (f.refId) { const r = REFERENCE.find((x) => x.id === f.refId); if (r) return r; }
  // the whole name, or a part of it: Cottage cheese (Hüttenkäse) is the table's cottage cheese by either name
  const parts = [fold(f.name), ...fold(f.name).split(/[()]/).map((x) => x.trim()).filter(Boolean)];
  for (const n of parts) { const r = REFERENCE.find((r) => refNamesOf(r).some((x) => fold(x) === n)); if (r) return r; }
  return null;
}
// the English name, for the rules: the job and the kind come from what the food is, never from a name in another language
// (the basic tuna in water read as a Drink because its German name has Wasser in it)
export function englishName(f: Identified): string {
  const r = basicOf(f);
  return r ? r.en : f.name;
}
// every name the food answers to: its own, its aliases, the basic food's names in every language, the other languages'
// words for its head word
export function namesOf(f: Identified & { aliases?: string[]; notes?: string }): string[] {
  const out = new Set<string>([f.name]);
  for (const a of f.aliases ?? []) out.add(a);
  const also = /Also: ([^\n]*)/.exec(f.notes ?? "")?.[1];
  if (also) also.split("·").map((x) => x.trim().replace(/\.$/, "")).filter(Boolean).forEach((x) => out.add(x));
  const r = basicOf(f);
  if (r) refNamesOf(r).forEach((x) => out.add(x));
  const head = fold(f.name).split(/[\s,(/-]+/).filter((w) => w.length >= 3)[0];
  if (head) synonymsOf(head).forEach((x) => out.add(x));
  return [...out];
}
// does what was typed find this food: one or two letters match the start of a word, three or more any part of any name,
// in any language (tuna finds Tunjevina u maslinovom ulju; tunjevina finds Tuna in olive oil)
export function foodHit(f: Identified & { aliases?: string[]; notes?: string }, q: string): boolean {
  const qf = fold(q);
  if (!qf) return true;
  if (/^\d{8,14}$/.test(qf)) return f.barcode === qf;
  const hay = fold(`${namesOf(f).join(" ")} ${f.brand ?? ""}`);
  if (qf.length < 3) return hay.split(/[\s,()/-]+/).some((w) => w.startsWith(qf));
  if (hay.includes(qf)) return true;
  return synonymsOf(qf).some((w) => hay.includes(fold(w)));
}
// a food of yours with the same identity as another: the one to keep is the older, the other folds into it
export function identityTwins(foods: Food[]): [Food, Food][] {
  const seen = new Map<string, Food>(); const out: [Food, Food][] = [];
  for (const f of foods) { const k = identityOf(f); if (k.startsWith("n:")) continue; const first = seen.get(k); if (first) out.push([first, f]); else seen.set(k, f); }
  return out;
}
