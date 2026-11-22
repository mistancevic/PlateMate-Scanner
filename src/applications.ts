// DT279 (0.3.140, board Stories213; Coach Milan 11 and 12 November, Go 13:49): beta tester applications from the home page.
// One per person: the latest request for an email, with how many came before it. An open one waits at the top of Clients.
export type Application = { id: string; name: string; email: string; createdAt?: string; status?: string; count: number; [k: string]: unknown };
export function peopleOf(list: readonly any[] | null | undefined): Application[] {
  const byEmail = new Map<string, Application>();
  for (const r of list ?? []) {
    const k = String(r.email || "").toLowerCase(); const prev = byEmail.get(k);
    if (!prev) byEmail.set(k, { ...r, count: 1 });
    else { prev.count += 1; if ((r.createdAt ?? "") > (prev.createdAt ?? "")) byEmail.set(k, { ...r, count: prev.count }); }
  }
  return [...byEmail.values()].sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
}
// B155 (0.3.173, board B155; Coach Milan, Go 22 November 14:21): a request from a person already invited or already a client
// is not a new request. The server reads the coach's invites next to the requests, by email, and adds what they say:
// used, the person joined with a code; open, a code is out, not used and not expired. Such a request does not wait and is
// not counted. Further down it says what happened, and a request that came after the invite can be answered by mail.
export type InviteOf = { status: "used" | "open"; at: string; code?: string; coachName?: string };
type InviteRow = { email?: string; status?: string; createdAt?: string; expiresAt?: string; usedAt?: string; code?: string; coachName?: string };
export function inviteOf(email: string, invites: readonly InviteRow[], now = new Date().toISOString()): InviteOf | null {
  const k = String(email || "").trim().toLowerCase(); if (!k) return null;
  const mine = invites.filter((i) => String(i.email || "").toLowerCase() === k).sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
  const used = mine.find((i) => i.status === "used");
  if (used) return { status: "used", at: String(used.createdAt ?? ""), ...(used.coachName ? { coachName: String(used.coachName) } : {}) };
  const open = mine.find((i) => i.status === "open" && String(i.expiresAt ?? "9") >= now);
  return open ? { status: "open", at: String(open.createdAt ?? ""), code: String(open.code ?? ""), ...(open.coachName ? { coachName: String(open.coachName) } : {}) } : null;
}
export const withInvites = <T extends { email?: string }>(requests: readonly T[], invites: readonly InviteRow[], now?: string) => requests.map((r) => { const invite = inviteOf(String(r.email ?? ""), invites, now); return invite ? { ...r, invite } : r; });
export const isOpen = (r: { status?: string; invite?: InviteOf | null }) => r.status !== "handled" && !r.invite;
// she asked after the invite went out: that is the request the coach can answer by mail
export const askedAgain = (r: { createdAt?: string; invite?: InviteOf | null }) => !!r.invite && String(r.createdAt ?? "") > r.invite.at;
// the mail for a person who is already a client and asked again; the invite mail itself is in CoachScreen
export const signInMail = (r: { email: string; name?: string }, coachName: string) =>
  `mailto:${r.email}?subject=${encodeURIComponent("You already have access to Chef Mealan")}&body=${encodeURIComponent(`Hi ${r.name || ""},\n\nyou already have access to Chef Mealan.\n\n1. Open https://chefmealan.com\n2. Sign in with Google using this email address: ${r.email}\n\nNo code is needed again.\n\n${coachName}`)}`;
export const openOf = (list: readonly any[] | null | undefined) => peopleOf(list).filter(isOpen);
// Firestore writes handledAt as a timestamp; over JSON it arrives as {_seconds} or an ISO string
export function handledAt(r: { handledAt?: unknown } | Application): Date | null {
  const h = r.handledAt as any; if (!h) return null;
  if (typeof h === "string") { const d = new Date(h); return isNaN(+d) ? null : d; }
  const s = Number(h._seconds ?? h.seconds); return Number.isFinite(s) ? new Date(s * 1000) : null;
}
