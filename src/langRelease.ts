// DT239 (0.3.95, board Stories181; Coach Milan 5 November 15:16 to 15:32, Go 6 November 12:24): languages in every release.
// Every line of the app, in English, with where it lives. src/i18n/made-for.json keeps the English each translation was made
// for. A line that is new, or whose English changed, goes into the release's group "New in 0.3.xx" in both tables: Srpski goes
// back to To confirm (the app shows the English until Milan confirms), German gets a new draft from Claude, as Beta.
import enLines from "./i18n/en.json" with { type: "json" };
import { CHEF, SR_ALLOWED, SR_LATER } from "./chefScript";
import { FIXED } from "./safety";
import { whenWords, agoWords } from "./cooking";

export type Forms = "plain" | "count" | "gender" | "two" | "chef";
export type EnRow = { id: string; kind: "safety" | "chef" | "screen"; key: string; en: string; forms: Forms; slots: string[]; later?: boolean };
export type MadeFor = Record<string, { en: string; area: string; where: string; release?: string }>;
export type MadeForFile = { about: string; lines: MadeFor };

const CHEF_WHERE: Record<string, [string, string]> = {
  photoWhose: ["The Plate", "After a photo of a plate is read"], photoNoFoods: ["The Plate", "A photo where no food was found"],
  oneDish: ["The Plate", "Foods that look cooked together"], whatMoment: ["The Plate", "Saving a plate: what kind of moment"],
  plateOldAte: ["The Plate", "Opening the app with an old plate"], plateOldBeforeCook: ["The Plate", "Starting a cook with an old plate"],
  plateSaveOrClear: ["The Plate", "A recipe starts while the plate has foods"], plateAddOrNew: ["The Plate", "Adding foods to a plate that has some"], plateAddPhoto: ["The Plate", "Adding a photo's foods to a plate that has some"],
  whereGoes: ["The Plate", "A scanned food: where it goes"], scanWhileCooking: ["Cooking", "Scanning a food in the middle of a cook"],
  useInCook: ["Cooking", "Using a scanned food in the cook"], handsFree: ["Cooking", "Before the steps: hands free"],
  whoMadePhoto: ["Cooking", "A photo of a dish: who made it"], howCooking: ["Cooking", "After the last step"],
  resume: ["Cooking", "Opening the app in the middle of a cook"], howMuchAte: ["Eating", "After the cook: how much was eaten"],
  howManyAte: ["Eating", "Pieces made: how many eaten"], howTaste: ["Eating", "How it tasted"],
  didTryWork: ["Eating", "After a swap or a side. Two lines, split by |"], remember: ["Eating", "A note to keep"],
  carryLater: ["Eating", "About 30 minutes after eating"], carryNow: ["Eating", "Right after eating: answer now or later"],
  whichMeal: ["The day", "Which meal is it"], whatDay: ["The day", "What kind of day"], busyMeal: ["The day", "A meal inside a calendar block"],
  busyLate: ["The day", "Busy until late, little time to cook"], busyLateAhead: ["The day", "Busy until late, with a cook the day before"], busyCarry: ["The day", "A booked block: take the meal along"],
  busyTraining: ["The day", "Training inside a calendar block"],
  cookOpen: ["Cooking", "A new plate while a cook is open"], photoLost: ["The Plate", "A photo whose answer was lost"],
  plateFills: ["The Plate", "Fit to my target on a plate that fills its meal"], secondDish: ["The Plate", "A second photo soon after a meal"],
  recipeOther: ["Recipes", "A recipe in another language: the offer on its page"], cookOther: ["Cooking", "Start cooking a recipe in another language"],
};
const SAFE_WHERE: Record<string, string> = { eating: "Eating disorder", pregnancy: "Pregnancy", diabetes: "Diabetes", allergies: "Allergies", medication: "Medication", off: "Safety notes switched off" };

// his script's English with the slots shown, as the tables show it
function chefTemplate(k: string): string {
  const f = CHEF[k as keyof typeof CHEF] as (...x: any[]) => string;
  if (k === "didTryWork") return f("change") + " | " + f("side");
  if (!SR_ALLOWED[k as keyof typeof CHEF]) return f();
  const D = new Date(2026, 0, 5, 9, 0), plate = () => "{plate}";
  const args: Record<string, any[]> = {
    photoWhose: ["{from}"], plateOldAte: [D, plate], plateOldBeforeCook: [D, plate], plateSaveOrClear: [2, D, "{dish}"],
    plateAddOrNew: [2, "{title}", "{what}"], plateAddPhoto: [2, "{title}", "{what}"], scanWhileCooking: ["{dish}", "{food}"], useInCook: ["{food}", "{dish}"], resume: ["{dish}", "{done}"],
    howManyAte: ["{made}"], carryNow: [7], busyMeal: ["{meal}", "{time}", "{block}", "{day}"], busyLate: ["{until}", "{meal}", "{time}", 7, "{quick}"], busyLateAhead: ["{until}", "{meal}", "{time}", 7, "{quick}", "{day}"],
    busyCarry: ["{block}", "{meal}"], busyTraining: ["{time}", "{block}", "{day}"],
    cookOpen: ["{cook}", "{dish}"], plateFills: ["{meal}", "{kcal}"], secondDish: ["{dish}", 7, "{prev}", "{meal}"], recipeOther: ["sr-Latn", "en"], cookOther: ["sr-Latn", "en"],
  };
  if (k === "recipeOther" || k === "cookOther") return f(...args[k]).replace("in Srpski", "{from}").replace("in English", "{to}");
  return f(...args[k]).replace(whenWords(D), "{when}").replace(agoWords(D), "{ago}").replace("2 foods", "{foods}").replace("7 minutes", "{minutes}").replace("leaves {minutes}", "leaves {free}");
}
const slotsIn = (t: string) => [...new Set([...t.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort();

export function englishRows(): EnRow[] {
  const rows: EnRow[] = [];
  for (const [k, t] of Object.entries(FIXED)) rows.push({ id: "safety." + k, kind: "safety", key: k, en: t, forms: "plain", slots: [] });
  for (const k of Object.keys(CHEF)) rows.push({ id: "chef." + k, kind: "chef", key: k, en: chefTemplate(k), forms: k === "didTryWork" ? "two" : "chef", slots: [...(SR_ALLOWED[k as keyof typeof CHEF] ?? [])], later: SR_LATER.includes(k as any) });
  for (const [k, v] of Object.entries(enLines as Record<string, any>)) {
    const en = typeof v === "string" ? v : "one" in v ? `${v.one}|${v.other}` : v.text;
    const forms: Forms = typeof v === "string" ? "plain" : "one" in v ? "count" : "gender";
    rows.push({ id: "screen." + k, kind: "screen", key: k, en, forms, slots: slotsIn(en.replace(/\|/g, " ")) });
  }
  return rows;
}

// a new line's area in the tables, by the first part of its key
const AREA_OF: [RegExp, string, string][] = [
  [/^home\./, "Home page", "The home page"], [/^(plate|make|journey|photo|photoask|count|gates|sayhave|ideas|fit|dish|out|craving|moment)\./i, "The Plate", "The Plate"],
  [/^(today|home|carry|busy|measured|travel)\./i, "Today", "Today"], [/^(plan|calendar|shop|slot|daytable)\./i, "Plan", "Plan"], [/^(recipe|recipes|publish|members|lang|steppics|yourcooks|delrecipe|nutrition|recipein|letters|steps|rf)\./i, "Recipes", "Recipes"],
  [/^(cook|cooking|cookmode|cookpair|strip)\./i, "Cooking", "Cooking"], [/^(foods|food|place|fitness)\./i, "Foods", "Foods"], [/^(summary|share)\./i, "Your summary and the coach", "Your summary"],
  [/^(coach|client|clientweek|cardanswer)\./i, "Clients", "Clients"], [/^(menu|settings|langpanel|voice|cloud|account|shorthelp)\./i, "Menu and settings", "Settings"],
  // DT243 part two: Me and setup, the goal and its page, the numbers, weigh-ins and the kitchen screen
  [/^(me|goal|guide|analysis|weight|profile|sheet|formula|carbsfat|kitchen)\./i, "Me and setup", "Me"],
];
export function areaOf(r: EnRow, made: MadeFor): { area: string; where: string } {
  const m = made[r.id]; if (m) return { area: m.area, where: m.where };
  if (r.kind === "safety") return { area: "Safety", where: SAFE_WHERE[r.key] ?? r.key };
  if (r.kind === "chef") { const w = CHEF_WHERE[r.key]; return w ? { area: w[0], where: w[1] } : { area: "Chef Mealan", where: r.key }; }
  for (const [re, area, where] of AREA_OF) if (re.test(r.key)) return { area, where };
  return { area: "Words used across the app", where: "Across the app" };
}

// what this release brings: lines with no translation made yet, and lines whose English changed since their translation
export function releaseLines(made: MadeFor): { row: EnRow; enBefore?: string }[] {
  return englishRows().filter((r) => made[r.id]?.en !== r.en).map((row) => ({ row, enBefore: made[row.id]?.en }));
}
