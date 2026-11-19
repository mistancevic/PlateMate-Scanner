// DT260 (0.3.114, board Stories195; Coach Milan 8 November 08:53 to 09:22, Go): How to. Situations from people's days and how
// Chef Mealan helps, each with its happy path in a few steps and Try it, which opens the first screen. In the beta the list is
// the testers' task list: Tried it, or Didn't work with a line that goes to Coach Milan. The words are in src/i18n/en.json
// (howto.<id>.title, .line, .what, .s1 to .sN). Each situation follows one walkthrough (flow): when a release changes those
// screens, that walkthrough fails and names the situation to update (tests/flows/<flow> carries "HOWTO: <id>").
import type { MenuSection, Tab } from "./screens/api";

export type HowGroup = "day" | "cook" | "week";
// added: the release it came in; on: that release's day, which is what New counts from (DT272); the first six were there from the start
export type Situation = { id: string; icon: string; group: HowGroup; added: string; on: string; flow: string; steps: number; go: { tab?: Tab; menu?: MenuSection; hold?: boolean }; video?: { id: string; to?: number } };
export const GROUPS: HowGroup[] = ["day", "cook", "week"];
export const SITUATIONS: Situation[] = [
  { id: "scanAnywhere", icon: "ScanBarcode", group: "day", added: "0.3.166", on: "2026-11-19", flow: "plate-hold.cjs", steps: 4, go: { tab: "journey", hold: true }, video: { id: "hold" } },
  { id: "eatNow", icon: "UtensilsCrossed", group: "day", added: "0.3.80", on: "2026-10-01", flow: "plate-chef.cjs", steps: 4, go: { tab: "journey" } },
  // DT315 (0.3.161, board DT315): step 4 is Ate it and the meal; Did you eat it? is step 5, as the read goes since 0.3.157
  { id: "photoLog", icon: "Camera", group: "day", added: "0.3.80", on: "2026-10-01", flow: "meal-photo.cjs", steps: 5, go: { tab: "journey" }, video: { id: "meal", to: 3 } },
  { id: "bigBatch", icon: "CookingPot", group: "day", added: "0.3.80", on: "2026-10-01", flow: "whole-recipe-count.cjs", steps: 5, go: { tab: "recipes" } },
  { id: "screenshot", icon: "Images", group: "cook", added: "0.3.80", on: "2026-10-01", flow: "recipe-import.cjs", steps: 4, go: { tab: "recipes" } },
  { id: "fitTarget", icon: "Target", group: "cook", added: "0.3.80", on: "2026-10-01", flow: "cook-mode.cjs", steps: 4, go: { tab: "recipes" } },
  { id: "handsFree", icon: "Mic", group: "cook", added: "0.3.110", on: "2026-11-07", flow: "voice-commands.cjs", steps: 5, go: { tab: "recipes" }, video: { id: "cook" } },
  { id: "otherLang", icon: "Languages", group: "cook", added: "0.3.99", on: "2026-11-07", flow: "recipe-lang.cjs", steps: 4, go: { tab: "recipes" }, video: { id: "languages" } },
  { id: "busyDay", icon: "CalendarClock", group: "week", added: "0.3.80", on: "2026-10-01", flow: "busy-times.cjs", steps: 4, go: { menu: "calendar" } },
];

// DT329 (0.3.166): r is How did it go?, 1 hard to 5 easy, with the note of your own
export type HowMark = { s: "tried" | "didnt"; at: string; note?: string; r?: number; v?: string };
export type HowMarks = Record<string, HowMark>;
export const HOWTO_KEY = "chefmealan-howto", LATER_KEY = "chefmealan-howto-later";
// in the beta a tester sees the count, and Coach Milan what they tried; after the beta the count goes
export const BETA = true;

// DT272 (0.3.124; Coach Milan 10 November 19:02 to 20:12, Yes, 14 days): New means added in the last 14 days. It was the last
// 20 releases; with several releases a day a new way lost its badge within days (A recipe in another language, 0.3.99, at 0.3.119).
export const NEW_DAYS = 14;
const DAY = 86_400_000;
export const isNew = (s: Situation, now: Date = new Date()) => { const t = new Date(`${s.on}T00:00:00`).getTime(), d = now.getTime() - t; return d >= 0 && d < NEW_DAYS * DAY; };
export const triedCount = (m: HowMarks) => SITUATIONS.filter((s) => m[s.id]?.s === "tried").length;
// the new ones not tried yet: what the card on Today offers
export const newToTry = (m: HowMarks, now: Date = new Date()) => SITUATIONS.filter((s) => isNew(s, now) && m[s.id]?.s !== "tried");
// the card on Today shows after a release that brought a new way, until Not now (then until the next release) or until tried
export const showOnToday = (m: HowMarks, version: string, laterAt: string | null, now: Date = new Date()) => newToTry(m, now).length > 0 && laterAt !== version;
// the situation no tester tried yet, for the next 1:1
export function untried(testers: { items: HowMarks }[]): Situation | null {
  return SITUATIONS.find((s) => !testers.some((t) => t.items?.[s.id]?.s === "tried")) ?? null;
}

// DT330 (board DT330; Coach Milan 19 November 20:30): How to feedback that needs Coach Milan waits at the top of Clients and counts
// in its badge: every Didn't work, and every I did it with a sad face (1 or 2) or with words. A plain good mark only counts in the
// list. A row leaves when opened (seen on this phone), and comes back when that tester marks the same situation again.
export const needsYou = (m: HowMark) => m.s === "didnt" || (m.s === "tried" && ((m.r ?? 5) <= 2 || !!m.note?.trim()));
export type HowWaiting = { key: string; uid: string; name: string; id: string; m: HowMark };
export const howtoWaiting = (testers: { uid: string; name: string; email: string; items: HowMarks }[], seen: Set<string>): HowWaiting[] =>
  testers.flatMap((t) => Object.entries(t.items ?? {}).filter(([id, m]) => m && SITUATIONS.some((x) => x.id === id) && needsYou(m))
    .map(([id, m]) => ({ key: `howto|${t.uid}|${id}|${m.at}`, uid: t.uid, name: (t.name || t.email || "").split(" ")[0], id, m })))
    .filter((x) => !seen.has(x.key)).sort((a, b) => b.m.at.localeCompare(a.m.at));
