// DT82 (Milan 23 October 2026, 19:45 and 19:53, after Marko's tuna): a food packed in a liquid. One can counts as what
// you eat of it, the drained weight, with the label's values per 100 g drained (they hold the oil that stays on the fish).
// The oil you pour off is its own food, held together with the can on the Plate: None, A spoon or All, set by the person.
// Water and brine add nothing, so they stay one row. Syrup waits for a value of its own.
import type { Food } from "./pilot";
import { REFERENCE, referenceFood } from "./reference";

export type Pack = { net: number; drained: number | null; liquid: string; per: "drained" | "whole" | "unknown" };
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

// the serving a scanned pack counts as: drained weight when the values are per drained, the whole can when per whole
export function packServing(p: Pack | undefined, name: string | undefined): { grams: number; name: string } | undefined {
  if (!p) return undefined;
  const one = name && name !== "serving" && name !== "portion" ? name : "can";
  if (p.per === "drained" && p.drained) return { grams: p.drained, name: one };
  if (p.per === "whole") return { grams: p.net, name: one };
  return undefined;
}

// one line for the food's card and the label check
export function packLine(f: Pick<Food, "pack" | "serving">): string | null {
  const p = f.pack;
  if (!p) return null;
  const inWhat = `In ${p.liquid}: ${p.net} g${p.drained ? `, ${p.drained} g drained` : ""}.`;
  const one = f.serving?.name ?? "can";
  if (p.per === "drained" && p.drained) return `${inWhat} The values are per 100 g drained, so one ${one} counts as ${p.drained} g.${canOil(f) ? ` The ${p.liquid} you pour off can go on the plate too.` : ""}`;
  if (p.per === "whole") return `${inWhat} The values are for the whole contents, ${p.liquid} included, so one ${one} counts as ${p.net} g.`;
  return `${inWhat} The label does not say whether its values are per drained weight or the whole contents. Check it, and set the serving to match.`;
}
