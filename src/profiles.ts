import { Profile, MealCartItem, PlateMacros, Level } from './types';
export type { Level };

export const PROFILES: Profile[] = [
  {
    id: 'p1',
    name: 'Functional Builder',
    thresholds: {
      XP: { high: 6.0, mod: 3.0 },
      XF: { high: 3.3, mod: 2.2 },
      XC: { high: 11.3, mod: 7.5 },
      XFi: { high: 2.5, mod: 1.0 },
    }
  },
  {
    id: 'p2',
    name: 'Active Rest Day',
    thresholds: {
      XP: { high: 5.0, mod: 2.5 },
      XF: { high: 4.0, mod: 2.5 },
      XC: { high: 8.0, mod: 5.0 },
      XFi: { high: 2.5, mod: 1.0 },
    }
  },
  {
    id: 'p3',
    name: 'Endurance Engine',
    thresholds: {
      XP: { high: 4.0, mod: 2.0 },
      XF: { high: 3.0, mod: 2.0 },
      XC: { high: 15.0, mod: 10.0 },
      XFi: { high: 2.5, mod: 1.0 },
    }
  }
];

export const getLevel = (score: number, threshold: { high: number, mod: number }): Level => {
  if (score >= threshold.high) return 'High';
  if (score >= threshold.mod) return 'Moderate';
  return 'Low';
};

export const getMealanChar = (level: Level, highChar: string, modChar: string): string => {
  if (level === 'High') return highChar;
  if (level === 'Moderate') return modChar;
  return '-';
};

export const calculateScore = (macroGrams: number, calories: number): number => {
  if (calories <= 0) return 0;
  const raw = (macroGrams / calories) * 100;
  return Math.round(raw * 10) / 10;
};

export const getColorForLevel = (level: Level): string => {
  if (level === 'High') return 'text-[#39ff14]';
  if (level === 'Moderate') return 'text-yellow-400';
  return 'text-[#ff073a]';
};

export const getBgForLevel = (level: Level): string => {
  if (level === 'High') return 'bg-[#39ff14]';
  if (level === 'Moderate') return 'bg-yellow-400';
  return 'bg-[#ff073a]';
};

/**
 * Computes aggregate recipe plate macros based on item weights.
 * Default item weight is 100g.
 * Formula per item: (nutrient / 100) * weight
 */
export const calculatePlateMacros = (items: MealCartItem[], profile: Profile): PlateMacros => {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalFats = 0;
  let totalCarbs = 0;
  let totalFiber = 0;
  let totalWeight = 0;
  let confirmedCount = 0;

  for (const item of items) {
    if (item.isMissingData) continue;
    confirmedCount++;
    const weight = typeof item.weight === 'number' && !isNaN(item.weight) && item.weight >= 0 
      ? item.weight 
      : 100;
    const factor = weight / 100;

    totalCalories += (Number(item.calories) || 0) * factor;
    totalProtein += (Number(item.protein) || 0) * factor;
    totalFats += (Number(item.fats) || 0) * factor;
    totalCarbs += (Number(item.carbs) || 0) * factor;
    totalFiber += (Number(item.fiber) || 0) * factor;
    totalWeight += weight;
  }

  const aggregateXp = calculateScore(totalProtein, totalCalories);
  const aggregateXf = calculateScore(totalFats, totalCalories);
  const aggregateXc = calculateScore(totalCarbs, totalCalories);
  const aggregateXfi = calculateScore(totalFiber, totalCalories);

  const t = profile.thresholds;
  const xpLevel = getLevel(aggregateXp, t.XP);
  const xfLevel = getLevel(aggregateXf, t.XF);
  const xcLevel = getLevel(aggregateXc, t.XC);
  const xfiLevel = getLevel(aggregateXfi, t.XFi);

  return {
    totalCalories: Math.round(totalCalories),
    totalProtein: Math.round(totalProtein * 10) / 10,
    totalFats: Math.round(totalFats * 10) / 10,
    totalCarbs: Math.round(totalCarbs * 10) / 10,
    totalFiber: Math.round(totalFiber * 10) / 10,
    totalWeight: Math.round(totalWeight),
    aggregateXp,
    aggregateXf,
    aggregateXc,
    aggregateXfi,
    xpLevel,
    xfLevel,
    xcLevel,
    xfiLevel,
    confirmedCount,
  };
};
