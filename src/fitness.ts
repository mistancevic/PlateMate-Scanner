// Fitness rules, version 1 (4 October 2026). What a moment needs from a plate. Code, with the source next to every number.
// Fitness decides what the plate needs; the culinary rules decide what goes together to get it. They never contradict.
import { density, type Food } from "./pilot";
import { playbookFor, type Playbook } from "./playbook";
import type { DayType } from "./personal";

export const SOURCES = {
  proteinDose: "ISSN position stand on nutrient timing, 2017: 20 to 40 g protein per dose, 0.25 to 0.40 g per kg body mass, every 3 to 4 hours",
  preCarb: "Academy of Nutrition and Dietetics, Dietitians of Canada and ACSM joint position, 2016: 1 to 4 g carbohydrate per kg body weight in the 1 to 4 hours before exercise; a snack close to the session sits at the low end",
};

// After training: a protein floor in grams, not only a density. 0.3 g/kg, kept between 20 and 40 g; 30 g without a weight on the profile.
export function proteinFloor(weightKg: number | null | undefined): number {
  if (!weightKg || weightKg <= 0) return 30;
  return Math.round(Math.min(40, Math.max(20, 0.3 * weightKg)));
}

// Before training: the carbohydrate the session asks for, scaled by the day's load. The low end of the position's range for a snack close to the session.
export const PRE_CARB_PER_KG: Record<DayType, number> = { rest: 0.5, normal: 0.5, training: 1, very: 1.5 };
const PRE_CARB_DEFAULT: Record<DayType, number> = { rest: 40, normal: 40, training: 60, very: 90 };
export function preCarbGrams(weightKg: number | null | undefined, dayType: DayType): number {
  if (!weightKg || weightKg <= 0) return PRE_CARB_DEFAULT[dayType];
  return Math.round(Math.min(120, Math.max(20, PRE_CARB_PER_KG[dayType] * weightKg)));
}

// A carb food: it carries its energy as carbohydrate, so it can do the before-training job on its own.
export const isCarbFood = (f: Food) => (f.carbs ?? 0) >= 20 && f.calories !== null && f.calories > 0 && ((f.carbs ?? 0) * 4) / f.calories >= 0.5;

// Before training: fits as it is when the playbook clears it (little fat and fibre) and it is a carb food. Honey, a banana, dates, white bread.
export type PreFit = { fits: boolean; grams: number | null; carbs: number; reason: string };
export function preTraining(f: Food, pb: Playbook, weightKg: number | null | undefined, dayType: DayType): PreFit {
  const carbs = preCarbGrams(weightKg, dayType);
  if (!pb.beforeTraining.ok) return { fits: false, grams: null, carbs, reason: pb.beforeTraining.reason };
  if (!isCarbFood(f)) return { fits: false, grams: null, carbs, reason: `${pb.beforeTraining.reason}; the energy before training comes from a carb food` };
  const grams = Math.min(300, Math.round((carbs / (f.carbs as number)) * 100 / 5) * 5);
  return { fits: true, grams, carbs, reason: `fast energy, nothing to add: about ${grams} g gives ${carbs} g carbs for a ${dayName(dayType)}` };
}

// After training: a protein base that reaches the floor. The grams that get there, within a real portion.
export type PostFit = { fits: boolean; grams: number | null; floor: number; reason: string };
export function afterTraining(f: Food, pb: Playbook, weightKg: number | null | undefined): PostFit {
  const floor = proteinFloor(weightKg);
  if (!pb.afterTraining.ok) return { fits: false, grams: null, floor, reason: pb.afterTraining.reason };
  const pd = density(f.protein, f.calories) ?? 0;
  if (pd >= 8 && f.protein && f.protein > 0) {
    const grams = Math.min(400, Math.round((floor / f.protein) * 100 / 5) * 5);
    return { fits: true, grams, floor, reason: `suits after training: about ${grams} g gives ${floor} g protein` };
  }
  return { fits: true, grams: null, floor, reason: `${pb.afterTraining.reason}; the plate wants ${floor} g protein` };
}

export const dayName = (d: DayType) => ({ rest: "rest day", normal: "usual day", training: "training day", very: "very active day" } as Record<DayType, string>)[d];

export function fitnessFor(f: Food, weightKg: number | null | undefined, dayType: DayType) {
  const pb = playbookFor(f);
  return { playbook: pb, before: preTraining(f, pb, weightKg, dayType), after: afterTraining(f, pb, weightKg) };
}
