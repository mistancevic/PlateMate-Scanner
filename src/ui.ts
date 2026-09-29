export const fmt = (n: number | null, d = 1) =>
  n === null ? "?" : n.toLocaleString(undefined, { maximumFractionDigits: d });
export const fixed = (n: number | null, d = 1) =>
  n === null ? "?" : n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

// Protein density shown as PD (g protein per 100 kcal) or as the share of energy from protein (PD × 4).
let PD_UNIT: "pd" | "pct" = (() => { try { return (JSON.parse(localStorage.getItem("chefmealan-personal") || "{}").pdUnit as "pd" | "pct") || "pd"; } catch { return "pd"; } })();
export const setPdUnit = (u: "pd" | "pct" | undefined) => { PD_UNIT = u || "pd"; };
export const pdUnit = () => PD_UNIT;
export const pdVal = (x: number | null | undefined) => (x === null || x === undefined || !Number.isFinite(x) ? "?" : PD_UNIT === "pct" ? String(Math.round(x * 4)) : x.toFixed(1));
export const pdTag = () => (PD_UNIT === "pct" ? "% protein" : "PD");
export const pdText = (x: number | null | undefined) => (PD_UNIT === "pct" ? `${pdVal(x)} % protein` : `PD ${pdVal(x)}`);
export const pdRange = (range: string) => { if (PD_UNIT !== "pct") return range; const n = range.match(/[\d.]+/g)?.map(Number) ?? []; return n.length === 2 ? `${Math.round(n[0] * 4)} to ${Math.round(n[1] * 4)} % protein` : range; };
