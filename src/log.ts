// Pilot log: the Discovery instrument. Local only, coach pulls it from More.
export type LogEvent =
  | "food_in"        // a food entered the meal; data.way = manual | saved | label | barcode | group
  | "barcode_miss"   // lookup failed, client falls back
  | "lock"           // data.locked
  | "mix"            // Chef asked for a mix
  | "mix_applied"
  | "meal_saved"
  | "feedback";      // data.status
const KEY = "chefmealan-log";
export function log(event: LogEvent, data: Record<string, unknown> = {}) {
  try {
    const d = new Date();
    const entry = { t: d.toISOString(), hour: d.getHours(), event, ...data };
    const raw = localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as unknown[]) : [];
    arr.push(entry);
    localStorage.setItem(KEY, JSON.stringify(arr.slice(-2000)));
  } catch {}
}
export function readLog(): unknown[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
export function clearLog() { try { localStorage.removeItem(KEY); } catch {} }
export function exportLog() {
  const blob = new Blob([JSON.stringify(readLog(), null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `chef-mealan-pilot-log-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
}
// Coach switch: hides coach-only tools from clients. Local only.
const COACH = "chefmealan-coach";
export const isCoach = () => { try { return localStorage.getItem(COACH) === "1"; } catch { return false; } };
export const setCoach = (v: boolean) => { try { localStorage.setItem(COACH, v ? "1" : "0"); } catch {} };

const CLIENT = "chefmealan-client-name";
export const getClientName = () => { try { return localStorage.getItem(CLIENT) || ""; } catch { return ""; } };
export const setClientName = (v: string) => { try { localStorage.setItem(CLIENT, v.trim()); } catch {} };
