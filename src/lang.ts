// DT203 (0.3.76, board Stories175 v2; Coach Milan 3 November 19:22 to 19:39, Go): the language Chef Mealan speaks. English, or
// Srpski (latinica). Kept on this phone; Settings, Language sets it. The screens stay English for now (release 2 and on).
import { useSyncExternalStore } from "react";
// DT238 (0.3.92, board Stories179; Coach Milan 5 November 11:36, Go): Deutsch (Beta), Claude's German for testers in Munich.
export type Lang = "en" | "sr-Latn" | "de";
const KEY = "chefmealan-lang";
const subs = new Set<() => void>();
// DT237 (0.3.88): for a moment, words in another language than the phone's: the coach's copy of Your summary is made in both
let forced: Lang | null = null;
export function inLang<T>(l: Lang, f: () => T): T { const was = forced; forced = l; try { return f(); } finally { forced = was; } }
const stored = (): Lang => { try { const v = localStorage.getItem(KEY); return v === "sr-Latn" || v === "de" ? v : "en"; } catch { return "en"; } };
export function getLang(): Lang { return forced ?? stored(); }
// the page's language, for screen readers and for the layout rules that only German needs (DT238: html[lang="de"])
function htmlLang() { try { document.documentElement.lang = stored() === "en" ? "en" : stored(); } catch { /* no page */ } }
export function setLang(l: Lang) { try { if (l === "en") localStorage.removeItem(KEY); else localStorage.setItem(KEY, l); } catch { /* none kept */ } htmlLang(); subs.forEach((f) => f()); }
export function useLang(): Lang { return useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, stored, () => "en"); }
export const LANG_NAMES: Record<Lang, string> = { en: "English", "sr-Latn": "Srpski (latinica)", de: "Deutsch (Beta)" };
// the calendar and number style of a language: 2,450 and 5.5 · 2.450 and 5,5 · 2.450 and 5,5
export const locOf = (l: Lang) => (l === "sr-Latn" ? "sr-Latn-RS" : l === "de" ? "de-DE" : "en-GB");
// the phone's voice and its listening for a language
export const speechLang = (l: Lang) => (l === "sr-Latn" ? "sr-RS" : l === "de" ? "de-DE" : "en-GB");
// DT248 (0.3.98, board Stories184): the language a recipe's own words are in, by their common words and letters, so cook mode
// reads a step in a voice of that language. English unless the words say otherwise.
const WORDS: Record<Lang, string[]> = {
  en: ["the", "and", "with", "until", "for", "into", "add", "cook", "minutes", "of", "to", "in", "a", "on", "then", "it", "salt", "water",
    "that", "this", "is", "not", "you", "your", "say", "sorry", "again", "step", "steps", "after", "next", "last", "timer", "done", "enjoy", "meal", "recipe", "has", "can't", "still", "work"],
  "sr-Latn": ["i", "u", "sa", "na", "dok", "da", "se", "minuta", "dodaj", "kuvaj", "pa", "zatim", "ga", "je", "so", "vode", "vodi", "ili", "od"],
  de: ["und", "mit", "die", "der", "das", "bis", "minuten", "den", "dem", "in", "zugeben", "kochen", "dann", "es", "salz", "wasser", "ein", "eine", "auf"],
};
export function langScore(text: string, l: Lang): number {
  const t = text.toLowerCase(), ws = t.match(/[a-zčćšžđäöüß']+/g) ?? [];
  return ws.filter((x) => WORDS[l].includes(x)).length + (l === "sr-Latn" ? (t.match(/[čćšžđ]/g) ?? []).length : l === "de" ? (t.match(/[äöüß]/g) ?? []).length : 0);
}
export function textLang(text: string): Lang {
  const t = text.toLowerCase(), ws = t.match(/[a-zčćšžđäöüß]+/g) ?? [];
  const score = (l: Lang) => ws.filter((x) => WORDS[l].includes(x)).length + (l === "sr-Latn" ? (t.match(/[čćšžđ]/g) ?? []).length : l === "de" ? (t.match(/[äöüß]/g) ?? []).length : 0);
  const best = (["sr-Latn", "de"] as Lang[]).map((l) => ({ l, s: score(l) })).sort((a, b) => b.s - a.s)[0];
  return best.s > score("en") ? best.l : "en";
}
// Serbian counts: 1 namirnica, 2 to 4 namirnice, 5 and on namirnica (11 to 14 are the many form)
export function srCount(n: number, one: string, few: string, many: string): string {
  const a = Math.abs(n) % 100, b = a % 10;
  return `${n} ${a >= 11 && a <= 14 ? many : b === 1 ? one : b >= 2 && b <= 4 ? few : many}`;
}
// the Settings row: what is in Serbian so far
export const langLine = (l: Lang) => (l === "sr-Latn" ? "Chef Mealan and the screens in Srpski. Explorer and the legal pages in English for now." : "English. Also Srpski (latinica) and Deutsch (Beta).");
// the language Chef Mealan answers in, on every call to our own server (the AI's answers, his tips), signed in or not
let langFetch = false;
export function installLangFetch() {
  if (langFetch || typeof window === "undefined" || typeof window.fetch !== "function") return;
  langFetch = true;
  const plain = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init: RequestInit = {}) => {
    const l = getLang();
    if (l === "en") return plain(input, init);
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const own = url.startsWith("/api/") || url.startsWith(`${location.origin}/api/`);
    if (!own) return plain(input, init);
    const h = new Headers(init.headers || (input instanceof Request ? input.headers : undefined)); h.set("x-chef-lang", l);
    return plain(input, { ...init, headers: h });
  };
}
installLangFetch();
htmlLang();
