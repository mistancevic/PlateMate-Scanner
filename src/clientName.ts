// B141 (0.3.146, board Stories219; Coach Milan 14 November 2026): a client is never unnamed, and the coach sees how they came in.
// The name on Clients: what the client typed in Profile; else the name from the form or the invite; else the invite's email.
import { w, dateText } from "./words";
import { BOOK_PAGES, BOOK_SOURCES } from "./bookPages";

export type Via = { kind: "form" | "invite" | "waitlist"; from?: string; src?: string; at?: string };
export type Joined = { uid: string; name: string; email: string; via: Via | null };
export type Identity = { name: string; email: string; named: boolean; via: Via | null };

export function clientIdentity(profileName: unknown, j?: Joined | null): Identity {
  const own = typeof profileName === "string" ? profileName.trim() : "", email = (j?.email ?? "").trim(), given = (j?.name ?? "").trim();
  const name = own || given || email;
  return { name: name || w("coach.noNameYet"), email, named: Boolean(own || given), via: j?.via ?? null };
}

// "From the home page form · QR · 13 November"
export function fromLine(via: Via | null | undefined): string {
  if (!via) return "";
  const at = via.at && !Number.isNaN(Date.parse(via.at)) ? dateText(new Date(via.at), { day: "numeric", month: "long" }) : "";
  const where = via.kind === "waitlist" ? w("coach.fromWaitlist") : via.kind === "invite" ? w("coach.fromInvite")
    : via.from && BOOK_PAGES[via.from] ? w("coach.fromPage", { page: BOOK_PAGES[via.from] }) : w("coach.fromHomeForm");
  const src = via.kind === "form" && via.src && BOOK_SOURCES[via.src] ? BOOK_SOURCES[via.src] : "";
  return [where, src, at].filter(Boolean).join(" · ");
}

// An empty Profile name never replaces a name already in the account (the cause of "unnamed": the phone saved its empty name
// over the one the invite had written).
export function keepName<T extends { clientName?: unknown }>(data: T): T {
  if (typeof data.clientName === "string" && data.clientName.trim()) return data;
  const { clientName: _drop, ...rest } = data; return rest as T;
}
