// R16 (0.2.44, board RS15): a small square picture: the plate's photo, else the recipe's cover or photo, else the dish's
// picture from where it came from (your screenshot or the page's photo, for you only), else the blank tile.
// R19 (0.2.47): shared by Today and Plan; small is the plan rows' size.
import { useState } from "react";
import { Utensils } from "lucide-react";
import type { Meal } from "../pilot";
import { recipePhotosOf } from "../photos";

const isPicture = (x: unknown): x is string => typeof x === "string" && /^(data:image\/|https:\/\/|blob:)/.test(x);
export function pictureOfRecipe(m: Meal | null | undefined): string | null {
  if (!m) return null;
  return [...recipePhotosOf(m), m.source?.photo, m.shots?.[0]].find(isPicture) ?? null;
}
export function Picture({ src, small }: { src: string | null; small?: boolean }) {
  const [broken, setBroken] = useState(false);
  const cls = small ? "meal-thumb" : "log-photo";
  return src && !broken
    ? <img className={cls} src={src} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} />
    : <div className={`${cls} recipe-tile-blank`}><Utensils size={small ? 18 : 22} /></div>;
}
