export const fmt = (n: number | null, d = 1) =>
  n === null ? "?" : n.toLocaleString(undefined, { maximumFractionDigits: d });
