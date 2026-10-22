// SH73 (Milan 21 October 2026, 21:10 to 23:42): what Share Chef Mealan shows, and the beta spots after a code.
export const SITE = "https://chefmealan.com";
export const SHARE_TARGETS = [
  { id: "site", name: "chefmealan.com", url: `${SITE}/?from=qr`, line: "Opens the home page: what Chef Mealan does, the calculator, and the form to ask for a code." },
  { id: "book", name: "Worthy Numbers", url: `${SITE}/worthy-numbers?from=qr`, line: "Opens the book page: the free book, and the form to ask for a code." },
] as const;
export const inviteUrl = (code: string) => `${SITE}/?code=${code}`;
// Milan 23:42: making a code lowers Beta spots left by one; no number set stays no number, and 0 stays 0
export const spotsAfterInvite = (n: unknown): number | null => (Number.isInteger(n) ? Math.max(0, (n as number) - 1) : null);
