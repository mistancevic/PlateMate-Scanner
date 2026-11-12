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
export const openOf = (list: readonly any[] | null | undefined) => peopleOf(list).filter((r) => r.status !== "handled");
// Firestore writes handledAt as a timestamp; over JSON it arrives as {_seconds} or an ISO string
export function handledAt(r: { handledAt?: unknown } | Application): Date | null {
  const h = r.handledAt as any; if (!h) return null;
  if (typeof h === "string") { const d = new Date(h); return isNaN(+d) ? null : d; }
  const s = Number(h._seconds ?? h.seconds); return Number.isFinite(s) ? new Date(s * 1000) : null;
}
