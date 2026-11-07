// DT82 (Milan 23 October 2026, 19:45, 19:53 and 20:51, after Tester 3's tuna): a food packed in a liquid. My foods keeps the
// label as printed, 1 can, 160 g, so it compares with the pack. On the Plate a can whose values are per 100 g drained comes
// as a bundle: the can on top, and under it two foods, the drained fish at the drained weight with the label's values (they
// hold the oil that stays on the fish), and the oil you pour off, None, A spoon or All, set by the person. Water and brine
// add nothing, so they bring no second food. Values for the whole contents: the can stays one food. Syrup waits.
import type { Food } from "./pilot";
import { REFERENCE, referenceFood } from "./reference";
import { w, type WordKey } from "./words";

export type Pack = { net: number; drained: number | null; liquid: string; per: "drained" | "whole" | "unknown"; can?: string };
const LIQUIDS = ["olive oil", "sunflower oil", "oil", "water", "brine", "syrup", "juice", "other"];
// DT243: the liquid on the screen, in the language chosen; the pack keeps the English word
const LIQUID_WORD: Record<string, WordKey> = { "olive oil": "foods.liquid.oliveOil", "sunflower oil": "foods.liquid.sunflowerOil", oil: "foods.liquid.oil", water: "foods.liquid.water", brine: "foods.liquid.brine", syrup: "foods.liquid.syrup", juice: "foods.liquid.juice", other: "foods.liquid.other" };
const liquidWord = (l: string) => (LIQUID_WORD[l] ? w(LIQUID_WORD[l]) : l);

export function packOf(x: any): Pack | undefined {
  if (!x || typeof x !== "object") return undefined;
  const n = (v: unknown) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Math.round(Number(v)) : null);
  const net = n(x.net), drained = n(x.drained);
  if (!net || !LIQUIDS.includes(x.liquid)) return undefined;
  return { net, drained: drained !== null && drained < net ? drained : null, liquid: x.liquid, per: x.per === "drained" || x.per === "whole" ? x.per : "unknown" };
}

// the oil of a can, when it can go on the plate: values per drained, both weights known, packed in oil
export function canOil(f: Pick<Food, "pack">): { grams: number; refId: string; kind: string } | null {
  const p = f.pack;
  if (!p || p.per !== "drained" || !p.drained || !/oil/.test(p.liquid)) return null;
  const grams = p.net - p.drained;
  return grams >= 5 ? { grams, refId: p.liquid === "olive oil" ? "olive-oil" : "sunflower-oil", kind: p.liquid } : null;
}

export const SPOON = 10;
export const oilChoices = (max: number): { key: "none" | "spoon" | "all"; label: string; grams: number }[] => [
  { key: "none", label: w("plate.canNone"), grams: 0 },
  { key: "spoon", label: w("plate.canSpoon"), grams: Math.min(SPOON, max) },
  { key: "all", label: w("plate.canAll"), grams: max },
];

export function oilFood(f: Pick<Food, "pack">, uid: () => string): Food | null {
  const o = canOil(f);
  const r = o ? REFERENCE.find((x) => x.id === o.refId) : null;
  if (!o || !r) return null;
  const food = referenceFood(r, null, uid);
  return { ...food, name: `${o.kind === "oil" ? "Oil" : o.kind.charAt(0).toUpperCase() + o.kind.slice(1)} from the can`, icon: "🫒" };
}

// the drained food the Plate puts under the can: its own id, so My foods keeps the label as printed; the can's name rides in
// pack.can for the bundle's line on top
export const DRAINED = "~drained";
export const libraryId = (id: string) => id.replace(/~drained$/, "");
export const isDrained = (f: Pick<Food, "id">) => f.id.endsWith(DRAINED);
export function drainedOf(f: Food): Food | null {
  const p = f.pack;
  if (!p || p.per !== "drained" || !p.drained || isDrained(f)) return null;
  const base = f.name.replace(/\s+(in|im|u|en|à la|al)\s+.*$/i, "").trim() || f.name;
  return { ...f, id: f.id + DRAINED, name: `${base}, drained`, serving: { grams: p.drained, name: f.serving?.name && !/^(serving|portion)$/.test(f.serving.name) ? f.serving.name : "can" }, pack: { ...p, can: f.name } };
}

// one line for the food's card and the label check
export function packLine(f: Pick<Food, "pack" | "name">): string | null {
  const p = f.pack;
  if (!p) return null;
  const inWhat = p.drained ? w("foods.packInDrained", { liquid: liquidWord(p.liquid), net: p.net, drained: p.drained }) : w("foods.packIn", { liquid: liquidWord(p.liquid), net: p.net });
  const base = f.name.replace(/\s+(in|im|u|en|à la|al)\s+.*$/i, "").trim() || f.name, oil = canOil(f);
  const oilName = oil ? w("foods.packOilFromCan", { oil: liquidWord(oil.kind).charAt(0).toUpperCase() + liquidWord(oil.kind).slice(1) }) : "";
  if (p.per === "drained" && p.drained) return `${inWhat} ${oil ? w("foods.packDrainedTwo", { base, drained: p.drained, oil: oilName, grams: oil.grams }) : w("foods.packDrainedOne", { base, drained: p.drained })}`;
  if (p.per === "whole") return `${inWhat} ${w("foods.packWhole", { liquid: liquidWord(p.liquid), net: p.net })}`;
  return `${inWhat} ${w("foods.packUnknown")}`;
}
