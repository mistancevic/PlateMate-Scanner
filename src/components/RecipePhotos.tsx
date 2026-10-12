import type { Feedback, Meal } from "../pilot";

// A recipe's photos (0.2.5+r10, board S3): at most 6, and the plate photos from the times it was made, offered to add.
// The photos are managed on the recipe's own page (0.2.5+r11, R8 and R9, RecipePage.tsx); the Photos sheet is gone.
export const MAX_RECIPE_PHOTOS = 6;
export function cardPhotosOf(meal: Meal, cards: Feedback[]): string[] {
  const out: string[] = [];
  for (const c of cards) {
    if (c.meal?.id !== meal.id && c.meal?.title !== meal.title && c.recipeId !== meal.id) continue;
    const big = (c.photos ?? []).find((x) => typeof x === "string" && x.startsWith("data:image/") && !x.startsWith("data:image/svg"));
    const p = big ?? (c.photo && !c.photo.startsWith("data:image/svg") ? c.photo : null);
    if (p && !out.includes(p)) out.push(p);
  }
  return out;
}
