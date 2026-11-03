// DT203 (0.3.76, board Stories175 v2; Coach Milan 3 November 19:22 to 19:39, Go): the language Chef Mealan speaks. English, or
// Srpski (latinica). Kept on this phone; Settings, Language sets it. The screens stay English for now (release 2 and on).
import { useSyncExternalStore } from "react";
export type Lang = "en" | "sr-Latn";
const KEY = "chefmealan-lang";
const subs = new Set<() => void>();
export function getLang(): Lang { try { return localStorage.getItem(KEY) === "sr-Latn" ? "sr-Latn" : "en"; } catch { return "en"; } }
export function setLang(l: Lang) { try { if (l === "en") localStorage.removeItem(KEY); else localStorage.setItem(KEY, l); } catch { /* none kept */ } subs.forEach((f) => f()); }
export function useLang(): Lang { return useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, getLang, () => "en"); }
export const LANG_NAMES: Record<Lang, string> = { en: "English", "sr-Latn": "Srpski (latinica)" };
// the phone's voice and its listening for a language
export const speechLang = (l: Lang) => (l === "sr-Latn" ? "sr-RS" : "en-GB");
// Serbian counts: 1 namirnica, 2 to 4 namirnice, 5 and on namirnica (11 to 14 are the many form)
export function srCount(n: number, one: string, few: string, many: string): string {
  const a = Math.abs(n) % 100, b = a % 10;
  return `${n} ${a >= 11 && a <= 14 ? many : b === 1 ? one : b >= 2 && b <= 4 ? few : many}`;
}
// the Settings row: what is in Serbian so far
export const langLine = (l: Lang) => (l === "sr-Latn" ? "Chef Mealan speaks Srpski (latinica). The screens are in English for now." : "English. Srpski (latinica) for Chef Mealan; Deutsch is coming.");
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
