// Pilot log: the Discovery instrument. Kept on the phone; since 0.2.5+r17 some events also go to the server, stripped of
// any free text, food names and health situations (metrics.ts, privacy notice section 7).
import { enqueue } from "./metrics";
export type LogEvent =
  | "adult_confirmed" // the welcome tap: 18 or older (Release A)
  | "account_delete" // Delete my account: done, data gone, stopped, or no answer
  | "carry"          // How did it carry you?, 30 minutes after a meal: data.how = light | fine | heavy
  | "meal_photo"     // DT127 (0.2.108): a photo of the meal read onto the Plate: data.foods, data.unsure
  | "meal_photo_idea" // DT130 (0.2.110): a plate from a photo kept as an idea in Mine: data.plan (put in a slot too)
  | "made"           // How did making it go?: data.went = as | not, data.ate = all | portion | later | not, data.photos
  | "food_in"        // a food entered the meal; data.way = manual | saved | label | barcode | group
  | "barcode_miss"   // lookup failed, client falls back
  | "lock"           // data.locked
  | "mix"            // Chef asked for a mix
  | "mix_applied"
  | "method_chosen"  // data.method = mixed | topped | base-first
  | "out"            // chat with Mealan; data.picks, data.pd
  | "out_failed"     // DT152: Chef Mealan did not answer in the chat; data.why = the first words of the reason
  | "pd_unit"        // data.unit = pd | pct
  | "plate_question" // a question at the plate; data.q, data.plate, data.n or data.applied
  | "mix_tip"        // a mix tip shown on a food card; data.food, data.moment, data.case, data.offered
  | "mix_taken"      // a mix chip tapped; data.food, data.moment, data.partners, data.kind, data.pd, data.kcal
  | "mix_ask"        // "Not quite? Tell Mealan" from a mix tip
  | "safety_flag"    // a situation flagged: data.situation, data.source (door, code, model)
  | "data_export"    // the person exported their data
  | "meal_saved"
  | "feedback"       // data.status
  // the counter (0.2.5+r17, board M): these also go to the server, stripped (metrics.ts)
  | "app_open"       // Today opened, once a day
  | "day_closed"     // a day before today: data.date, planned, byPlan, extras, swapped, lived, proteinPct, energyPct
  | "fit_used"       // Fit to my target tapped on the Plate
  | "label_read"     // an AI label read saved: data.kept = saved without a change
  // covers and Members (0.2.15, Milan 16 October 2026, 19:23): the numbers that decide drawn or realistic, later
  | "cover"          // data.how = drawn (Chef Mealan drew a cover) | real (a real photo replaced a drawn cover)
  | "members"        // data.how = open | make | keep | share
  // a recipe from a screenshot or a link (0.2.16, board IM)
  | "recipe_in"      // data.how = shot | link, data.result = read | plate | login | fetch | no-recipe | not-recipe
  | "recipe_fit"     // data.way = change | side, data.result = shown | failed | yes | ok | no
  | "parts"          // data.how = leave | change | set (0.2.19, boards IM15 to IM18)
  | "can_oil"        // the oil of a can on the Plate (DT82): data.how = none | spoon | all
  | "swap";          // a food swapped in Edit recipe (DT83): data.way = energy | weight, data.kind = same | other, data.how = swap | after-remove
const KEY = "chefmealan-log";
export function log(event: LogEvent, data: Record<string, unknown> = {}) {
  try {
    const d = new Date();
    const entry = { t: d.toISOString(), hour: d.getHours(), event, ...data };
    const raw = localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as unknown[]) : [];
    arr.push(entry);
    localStorage.setItem(KEY, JSON.stringify(arr.slice(-2000)));
  } catch {}
  enqueue(event, data);
}
export function readLog(): unknown[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
export function clearLog() { try { localStorage.removeItem(KEY); } catch {} }
export function exportLog() {
  const blob = new Blob([JSON.stringify(readLog(), null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `chef-mealan-pilot-log-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
}
// Coach switch: hides coach-only tools from clients. Local only.
const COACH = "chefmealan-coach";
export const isCoach = () => { try { return localStorage.getItem(COACH) === "1"; } catch { return false; } };
export const setCoach = (v: boolean) => { try { localStorage.setItem(COACH, v ? "1" : "0"); } catch {} };

const CLIENT = "chefmealan-client-name";
export const getClientName = () => { try { return localStorage.getItem(CLIENT) || ""; } catch { return ""; } };
export const setClientName = (v: string) => { try { localStorage.setItem(CLIENT, v.trim()); } catch {} };
