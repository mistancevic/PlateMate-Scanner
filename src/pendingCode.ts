// SH73: a personal code that arrives in the address (chefmealan.com/?code=AB12CD, from the QR code a coach shows) is kept
// for this tab and taken out of the address, so it waits through Sign in and fills the code field. Nothing is sent.
const KEY = "chefmealan-code";
export const cleanCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
export function takeCodeFromUrl() {
  try {
    const u = new URL(window.location.href);
    const c = cleanCode(u.searchParams.get("code") ?? "");
    if (!c) return;
    sessionStorage.setItem(KEY, c);
    u.searchParams.delete("code");
    window.history.replaceState(null, "", u.pathname + u.search + u.hash);
  } catch {}
}
export const pendingCode = () => { try { return sessionStorage.getItem(KEY) ?? ""; } catch { return ""; } };
export const clearPendingCode = () => { try { sessionStorage.removeItem(KEY); } catch {} };
