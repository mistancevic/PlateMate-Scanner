// DT236 v3 (0.3.93, boards Stories177 and Stories180; Coach Milan 5 November 11:36, Go): the box a phone in Serbian or German
// sees once, on the English home page and on Welcome. Its words are in the phone's language, whatever the page's, so they are
// written here once and not translated.
import type { Lang } from "./lang";
export type Ask = { lang: Exclude<Lang, "en">; title: string; line: string; yes: string };
export const ASKS: Ask[] = [
  { lang: "sr-Latn", title: "Chef Mealan je i na srpskom.", line: "Tvoj telefon je podešen na srpski.", yes: "Na srpskom" },
  { lang: "de", title: "Chef Mealan gibt es auch auf Deutsch.", line: "Dein Handy ist auf Deutsch eingestellt.", yes: "Auf Deutsch" },
];
export const ASK_NO = "Continue in English";
export const ASKED_KEY = "chefmealan-lang-asked";
// the phone's first language: Serbian, Croatian, Bosnian or Montenegrin read Srpski; German from anywhere reads Deutsch
export function askFor(langs: readonly string[]): Ask | null {
  const first = (langs[0] || "").toLowerCase();
  if (/^(sr|hr|bs|sh|cnr)\b/.test(first)) return ASKS[0];
  if (/^de\b/.test(first)) return ASKS[1];
  return null;
}
