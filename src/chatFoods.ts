// DT106 (0.2.92, board Stories64; Milan 24 October 21:56 and 22:11): foods Chef Mealan names in a chat answer become rows you
// can add. His words stay his. The model lists the foods it named (named) and the ones it says to drop (skip); code matches
// each name to the person's foods first, then to the basic foods table, and puts one row per match under the answer, with the
// food's start amount and what the plate would reach. A name in neither gets Scan it. Every add goes through the culinary
// rules first (fitsPlate: C6, C20, C21); a name that fails is not a row, so the chat never offers what the gate would refuse.
import { aggregate, density, type Food, type Ingredient } from "./pilot";
import { REFERENCE, referenceFood, type RefFood } from "./reference";
import { cookName } from "./cookWords";
import { startGrams } from "./foodjob";
import { fitsPlate } from "./mixtip";

export type ChatRow =
  | { kind: "add"; name: string; food: Food; from: "mine" | "basic"; grams: number; reaches: number | null }
  | { kind: "drop"; name: string; itemId: string; grams: number }
  | { kind: "scan"; name: string };

const STOP = new Set(["the", "a", "an", "of", "and", "with", "or", "in", "natural", "plain", "fresh", "some", "your", "my", "low", "fat", "fat-free", "lean", "raw", "cooked", "dry", "boiled", "drained"]);
const norm = (s: string) => s.toLowerCase().replace(/[()%,.-]/g, " ").replace(/\s+/g, " ").trim();
const words = (s: string) => norm(s).split(" ").filter((w) => w.length >= 3 && !STOP.has(w));
// a name the model used against a food's name: every meaningful word of the shorter side is in the longer side (apple in
// Apple; low-fat quark in Quark, low fat (Magerquark); Greek yogurt in Greek yogurt 2%); plurals count as the word
function same(a: string, b: string): boolean {
  const wa = words(a), wb = words(b);
  if (!wa.length || !wb.length) return false;
  const [short, long] = wa.length <= wb.length ? [wa, wb] : [wb, wa];
  const has = (w: string) => long.some((x) => x === w || x === w + "s" || x + "s" === w || x === w + "es" || x + "es" === w);
  // one word against a phrase: only a short phrase (apple against Apple, raw; quark against Quark, low fat), never pumpkin
  // against pumpkin spice latte
  return short.every(has) && (short.length >= 2 || long.length <= 2);
}

function findMine(name: string, library: Food[]): Food | null {
  const exact = library.find((f) => norm(cookName(f.name).short) === norm(name) || norm(f.name) === norm(name));
  if (exact) return exact;
  return library.find((f) => same(name, cookName(f.name).short) || (f.aliases ?? []).some((a) => same(name, a))) ?? null;
}
function findBasic(name: string): RefFood | null {
  return REFERENCE.find((r) => norm(r.en) === norm(name)) ?? REFERENCE.find((r) => same(name, r.en) || same(name, r.de) || same(name, r.sr)) ?? null;
}

export function chatRows(named: string[], skip: string[], library: Food[], plate: Ingredient[], region: string | null | undefined, uid: () => string): ChatRow[] {
  const rows: ChatRow[] = [];
  const seen = new Set<string>();
  // drops first: a food on the plate he says to leave out
  for (const s of skip.slice(0, 6)) {
    const it = plate.find((i) => same(s, cookName(i.food.name).short) || norm(cookName(i.food.name).short) === norm(s));
    if (!it || seen.has(it.food.id)) continue;
    seen.add(it.food.id); rows.push({ kind: "drop", name: cookName(it.food.name).short, itemId: it.id, grams: it.grams });
  }
  // the adds are judged against the plate without the foods he says to drop
  const kept = plate.filter((i) => !rows.some((r) => r.kind === "drop" && r.itemId === i.id));
  const keptFoods = kept.map((i) => library.find((f) => f.id === i.food.id) ?? i.food);
  const t = aggregate(kept);
  for (const n of named.slice(0, 8)) {
    const name = String(n ?? "").trim(); if (!name) continue;
    const mine = findMine(name, library);
    const food = mine ?? (() => { const r = findBasic(name); return r ? referenceFood(r, region, uid) : null; })();
    if (!food) { if (!rows.some((r) => r.kind === "scan" && norm(r.name) === norm(name))) rows.push({ kind: "scan", name }); continue; }
    if (seen.has(food.id) || plate.some((i) => i.food.id === food.id)) continue; // already on the plate, or already a row
    seen.add(food.id);
    if (!fitsPlate(food, keptFoods)) continue; // the rules say no: not a row
    const grams = startGrams(food);
    const reaches = density((t.protein ?? 0) + ((food.protein ?? 0) * grams) / 100, (t.calories ?? 0) + ((food.calories ?? 0) * grams) / 100);
    rows.push({ kind: "add", name: cookName(food.name).short, food, from: mine ? "mine" : "basic", grams, reaches });
  }
  return rows;
}
