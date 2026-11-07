import type { Personal } from "./personal";
import { w } from "./words";
// a typed number that cannot be right yet: kept back until it can (DT205)
export function profileOdd(d: Personal): string | null {
  const y = new Date().getFullYear();
  if (d.birthYear !== undefined && (d.birthYear < 1900 || d.birthYear > y)) return w("profile.oddBirthYear");
  if (d.heightCm !== undefined && (d.heightCm < 100 || d.heightCm > 250)) return w("profile.oddHeight");
  if (d.weightKg !== undefined && (d.weightKg < 30 || d.weightKg > 350)) return w("profile.oddWeight");
  if (d.bodyFatPct !== undefined && (d.bodyFatPct < 3 || d.bodyFatPct > 70)) return w("profile.oddBodyFat");
  return null;
}
