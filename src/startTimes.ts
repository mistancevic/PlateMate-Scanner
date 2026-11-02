// The loading fix (0.3.61; Coach Milan 2 November 20:24 to 20:34, Go): the time of each step of opening, kept so a slow
// opening says which step was slow: Signed in 0.4 s · account 2.1 s. Starting.tsx shows it after ten seconds.
const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
export type StartMark = { name: string; ms: number };
const marks: StartMark[] = [];
let waiting: { name: string; since: number } | null = null;
export function startMark(name: string) { if (!marks.some((m) => m.name === name)) marks.push({ name, ms: now() - t0 }); waiting = null; }
// a step that has begun and not ended yet: the line counts its seconds as they go
export function startWait(name: string) { waiting = { name, since: now() }; }
const sec = (ms: number) => `${(ms / 1000).toFixed(1)} s`;
export function startLine(at = now()): string {
  const parts = marks.map((m, i) => `${m.name} ${sec(m.ms - (i ? marks[i - 1].ms : 0))}`);
  if (waiting) parts.push(`${waiting.name} ${sec(at - waiting.since)}…`);
  return parts.join(" · ");
}
export function resetStartTimes() { marks.length = 0; waiting = null; }
