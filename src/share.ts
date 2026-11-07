// SH73 (Milan 21 October 2026, 21:10 to 23:42): what Share Chef Mealan shows, and the beta spots after a code.
import { w } from "./words";
export const SITE = "https://chefmealan.com";
// DT243 part two: the lines in src/i18n/en.json (share.target*); the names are the site's and the book's own
export const SHARE_TARGETS = [
  { id: "site", name: "chefmealan.com", url: `${SITE}/?from=qr`, get line() { return w("share.targetSite"); } },
  { id: "book", name: "Worthy Numbers", url: `${SITE}/worthy-numbers?from=qr`, get line() { return w("share.targetBook"); } },
] as const;
export const inviteUrl = (code: string) => `${SITE}/?code=${code}`;
// Milan 23:42: making a code lowers Beta spots left by one; no number set stays no number, and 0 stays 0
export const spotsAfterInvite = (n: unknown): number | null => (Number.isInteger(n) ? Math.max(0, (n as number) - 1) : null);
