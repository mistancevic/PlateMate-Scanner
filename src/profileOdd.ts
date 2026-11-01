import type { Personal } from "./personal";
// a typed number that cannot be right yet: kept back until it can (DT205)
export function profileOdd(d: Personal): string | null {
  const y = new Date().getFullYear();
  if (d.birthYear !== undefined && (d.birthYear < 1900 || d.birthYear > y)) return "the birth year needs four digits";
  if (d.heightCm !== undefined && (d.heightCm < 100 || d.heightCm > 250)) return "the height looks wrong";
  if (d.weightKg !== undefined && (d.weightKg < 30 || d.weightKg > 350)) return "the weight looks wrong";
  if (d.bodyFatPct !== undefined && (d.bodyFatPct < 3 || d.bodyFatPct > 70)) return "the body fat looks wrong";
  return null;
}
