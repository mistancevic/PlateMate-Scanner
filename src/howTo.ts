// DT260 (0.3.114, board Stories195; Coach Milan 8 November 08:53 to 09:22, Go): How to. Situations from people's days and how
// Chef Mealan helps, each with its happy path in a few steps and Try it, which opens the first screen. In the beta the list is
// the testers' task list: Tried it, or Didn't work with a line that goes to Coach Milan. The words are in src/i18n/en.json
// (howto.<id>.title, .line, .what, .s1 to .sN). Each situation follows one walkthrough (flow): when a release changes those
// screens, that walkthrough fails and names the situation to update (tests/flows/<flow> carries "HOWTO: <id>").
import type { MenuSection, Tab } from "./screens/api";

export type HowGroup = "day" | "cook" | "week";
export type Situation = { id: string; icon: string; group: HowGroup; added: string; flow: string; steps: number; go: { tab?: Tab; menu?: MenuSection } };
export const GROUPS: HowGroup[] = ["day", "cook", "week"];
export const SITUATIONS: Situation[] = [
  { id: "eatNow", icon: "🍽️", group: "day", added: "0.3.80", flow: "craving-search.cjs", steps: 4, go: { tab: "journey" } },
  { id: "photoLog", icon: "📷", group: "day", added: "0.3.80", flow: "meal-photo.cjs", steps: 4, go: { tab: "journey" } },
  { id: "bigBatch", icon: "🍲", group: "day", added: "0.3.80", flow: "whole-recipe-count.cjs", steps: 5, go: { tab: "recipes" } },
  { id: "screenshot", icon: "🖼️", group: "cook", added: "0.3.80", flow: "recipe-import.cjs", steps: 4, go: { tab: "recipes" } },
  { id: "fitTarget", icon: "🎯", group: "cook", added: "0.3.80", flow: "cook-mode.cjs", steps: 4, go: { tab: "recipes" } },
  { id: "handsFree", icon: "🗣️", group: "cook", added: "0.3.110", flow: "voice-commands.cjs", steps: 5, go: { tab: "recipes" } },
  { id: "otherLang", icon: "🌍", group: "cook", added: "0.3.99", flow: "recipe-lang.cjs", steps: 4, go: { tab: "recipes" } },
  { id: "busyDay", icon: "📅", group: "week", added: "0.3.80", flow: "busy-times.cjs", steps: 4, go: { menu: "calendar" } },
];

export type HowMark = { s: "tried" | "didnt"; at: string; note?: string; v?: string };
export type HowMarks = Record<string, HowMark>;
export const HOWTO_KEY = "chefmealan-howto", LATER_KEY = "chefmealan-howto-later";
// in the beta a tester sees the count, and Coach Milan what they tried; after the beta the count goes
export const BETA = true;

const patch = (v: string) => { const m = /^0\.(\d+)\.(\d+)/.exec(v); return m ? Number(m[1]) * 1000 + Number(m[2]) : 0; };
// New: added in the last 20 releases
export const NEW_WINDOW = 20;
export const isNew = (s: Situation, version: string) => patch(version) > 0 && patch(version) - patch(s.added) < NEW_WINDOW && patch(s.added) <= patch(version);
export const triedCount = (m: HowMarks) => SITUATIONS.filter((s) => m[s.id]?.s === "tried").length;
// the new ones not tried yet: what the card on Today offers
export const newToTry = (m: HowMarks, version: string) => SITUATIONS.filter((s) => isNew(s, version) && m[s.id]?.s !== "tried");
// the card on Today shows after a release that brought a new way, until Not now (then until the next release) or until tried
export const showOnToday = (m: HowMarks, version: string, laterAt: string | null) => newToTry(m, version).length > 0 && laterAt !== version;
// the situation no tester tried yet, for the next 1:1
export function untried(testers: { items: HowMarks }[]): Situation | null {
  return SITUATIONS.find((s) => !testers.some((t) => t.items?.[s.id]?.s === "tried")) ?? null;
}
