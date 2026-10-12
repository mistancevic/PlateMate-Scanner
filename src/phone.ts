// HP12 (board B, 12 October 2026): the optional mobile number on a request to join. Kept as + and digits only, so the
// Clients screen can open WhatsApp with it. Returns "" for an empty field and null for a number that cannot be right.
export function normalizePhone(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  if (s.length > 30) return null;
  const n = s.replace(/^00/, "+").replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
  return /^\+?\d{6,15}$/.test(n) ? n : null;
}
// the WhatsApp link for a kept number: digits only
export const waLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;
