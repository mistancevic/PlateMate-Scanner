// Lists the server answers for (the client rows, the invites, what is published) show at once from the last copy kept on
// this phone, then refresh quietly when the server answers (Milan, 11 October 2026: parts showed up a moment later and
// pushed others aside). The key carries the account, so one phone never shows another account's list.
import { useState } from "react";

const PREFIX = "chefmealan-kept-";
export function useKept<T>(key: string, initial: T): [T, (next: T | ((prev: T) => T)) => void] {
  const full = PREFIX + key;
  const [value, setValue] = useState<T>(() => {
    try { const raw = localStorage.getItem(full); return raw ? (JSON.parse(raw) as T) : initial; } catch { return initial; }
  });
  const set = (next: T | ((prev: T) => T)) => setValue((prev) => {
    const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
    try { localStorage.setItem(full, JSON.stringify(v)); } catch {}
    return v;
  });
  return [value, set];
}
// on sign-out and on deleting the account the kept copies go too
export function clearKept() {
  try { Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)).forEach((k) => localStorage.removeItem(k)); } catch {}
}
