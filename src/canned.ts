// DT82 (Milan 23 October 2026, 19:45, 19:53 and 20:51, after Tester 3's tuna): a food packed in a liquid. My foods keeps the
// label as printed, 1 can, 160 g, so it compares with the pack. On the Plate a can whose values are per 100 g drained comes
// as a bundle: the can on top, and under it two foods, the drained fish at the drained weight with the label's values (they
// hold the oil that stays on the fish), and the oil you pour off, None, A spoon or All, set by the person. Water and brine
// add nothing, so they bring no second food. Values for the whole contents: the can stays one food. Syrup waits.
import type { Food } from "./pilot";
import { REFERENCE, referenceFood } from "./reference";

export type Pack = { net: number; drained: number | null; liquid: string; per: "drained" | "whole" | "unknown"; can?: string };
const LIQUIDS = ["olive oil", "sunflower oil", "oil", "water", "brine", "syrup", "juice", "other"];

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
  { key: "none", label: "None", grams: 0 },
  { key: "spoon", label: "A spoon", grams: Math.min(SPOON, max) },
  { key: "all", label: "All", grams: max },
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
  const inWhat = `In ${p.liquid}: ${p.net} g${p.drained ? `, ${p.drained} g drained` : ""}.`;
  const base = f.name.replace(/\s+(in|im|u|en|à la|al)\s+.*$/i, "").trim() || f.name, oil = canOil(f);
  const oilName = oil ? `${oil.kind.charAt(0).toUpperCase() + oil.kind.slice(1)} from the can` : "";
  if (p.per === "drained" && p.drained) return `${inWhat} The values are per 100 g drained. On the Plate the can comes as ${oil ? `two foods: ${base}, drained, ${p.drained} g, and ${oilName}, up to ${oil.grams} g, if you add it` : `${base}, drained, ${p.drained} g`}.`;
  if (p.per === "whole") return `${inWhat} The values are for the whole contents, ${p.liquid} included, so the can is one food, ${p.net} g.`;
  return `${inWhat} The label does not say whether its values are per drained weight or the whole contents. Check it.`;
}
