// DT161 (0.3.3, board Stories113; Coach Milan 29 October 19:30: "Double check the impact from profile setup. Makes no sense that
// it is there set but no influence"). Before 0.3.3, What you eat only moved protein; Chef Mealan never saw it, nor the alcohol
// answer, nor sleep. How the person eats now goes with every request that asks Chef Mealan for food, in fixed words, and the
// server puts it in every such prompt with one rule (server.ts, eatsNote). Added in one place, so no request is forgotten.
import { lifestyleOf, splitOf, lowCarbsOf, splitName, type Personal } from "./personal";
import { DIETS, WHERE } from "./plan";
import { awayWords } from "./travel";

export type Eats = { what_they_eat?: string; in_their_words?: string; carbs_and_fat?: string; how_often_they_drink?: string; bed?: string; wake?: string; where_they_eat?: string[]; work_travel?: string; away?: string };
const BED: Record<string, string> = { early: "before 22:00", mid: "22:00 to midnight", late: "after midnight", varies: "varies with shifts" };
const WAKE: Record<string, string> = { early: "before 6:00", mid: "6:00 to 8:00", late: "after 8:00", varies: "varies with shifts" };

export function eatsForReq(p: Personal, bandId: string): Eats {
  const l = lifestyleOf(p), out: Eats = {};
  if (l.diet && l.diet !== "Everything" && DIETS.includes(l.diet)) out.what_they_eat = l.diet;
  if (l.diet === "Other" && l.dietOther?.trim()) out.in_their_words = l.dietOther.replace(/\s+/g, " ").trim().slice(0, 120);
  const s = splitOf(p, bandId), low = lowCarbsOf(p, bandId);
  out.carbs_and_fat = low !== null ? `${splitName(s)}, ${low} g of carbs a day` : splitName(s === "low" ? "balanced" : s);
  if (l.alcohol && l.alcohol !== "None") out.how_often_they_drink = l.alcohol;
  if (l.bed && BED[l.bed]) out.bed = BED[l.bed];
  if (l.wake && WAKE[l.wake]) out.wake = WAKE[l.wake];
  // DT167 (0.3.9): Where you eat and Work travel reached nothing but the order of moments; now Chef Mealan reads them too
  const where = (l.where ?? []).filter((w) => WHERE.includes(w));
  if (where.length) out.where_they_eat = where;
  if (l.travel === "sometimes" || l.travel === "often") out.work_travel = l.travel === "often" ? "a lot" : "occasionally";
  // DT176 (0.3.19): Travel mode on: the kitchen they have there, and where
  const away = awayWords(p.travel);
  if (away) out.away = away;
  return out;
}

// the requests that ask Chef Mealan for food or advice about it
export const EATS_PATHS = ["/api/out", "/api/swap", "/api/short", "/api/meal", "/api/dish", "/api/crave", "/api/steps", "/api/recipe/fit", "/api/plate", "/api/tip", "/api/chef", "/api/cook-ask"];

// adds `eats` to the JSON body of those requests, once, for the whole app; the current person comes from `get`
export function installEats(get: () => Eats | null) {
  const w = window as unknown as { __eats?: boolean; fetch: typeof fetch };
  if (w.__eats) return; w.__eats = true;
  const orig = w.fetch.bind(window);
  w.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url = typeof input === "string" ? input : input instanceof URL ? input.pathname : input.url;
      const path = url.replace(/^https?:\/\/[^/]+/, "").split("?")[0];
      if (init && typeof init.body === "string" && (init.method ?? "GET").toUpperCase() === "POST" && EATS_PATHS.includes(path)) {
        const e = get(); const body = JSON.parse(init.body);
        if (e && body && typeof body === "object" && !Array.isArray(body) && body.eats === undefined) init = { ...init, body: JSON.stringify({ ...body, eats: e }) };
      }
    } catch { /* not JSON: sent as it was */ }
    return orig(input, init);
  };
}
