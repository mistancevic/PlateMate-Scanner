// Words and field values the daily reference, the label check and Chef Mealan's card share.
// 0.3.156: moved out of App.tsx as they were.
import { type WordKey } from "../words";
import { tidy } from "../labeltable";

// a value in a field as a label prints it: 313 kcal, 8.9 g, not 313.3333 or 8.888889 (Milan, 8 October 2026)
export const inputValue = (x: number | null, key?: string) => (x === null ? "" : String(tidy(x, key === "calories" ? "kcal" : "g") ?? x));
export const NUTRIENT_WORD: Record<string, WordKey> = { calories: "app.nEnergy", protein: "app.nProtein", fats: "app.nFat", carbs: "app.nCarbohydrate", fiber: "app.nFibre" };
