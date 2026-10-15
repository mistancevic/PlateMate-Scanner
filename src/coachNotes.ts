// The coach's note and the check-in day (0.2.6, canvas board CW, CW4 to CW6). One thread per client in the client's own
// account: the coach's weekly note (Approve the week or Change the numbers, one line), and the client's replies.
// The client sees a new note on Today once; Got it keeps it in My coach.
export type CoachNote = { at: string; by: "coach" | "client"; name?: string; week?: string; verdict?: "approved" | "change"; text: string; readAt?: string };
export const CHECKIN_DEFAULT = 4; // Friday, Monday first
export const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const checkinOf = (x: unknown) => (typeof x === "number" && x >= 0 && x <= 6 ? x : CHECKIN_DEFAULT);
export const notesOf = (x: unknown): CoachNote[] => (Array.isArray(x) ? x.filter((n) => n && typeof n.at === "string" && typeof n.text === "string") : []);
// the newest note from the coach the client has not answered with Got it
export const unreadNote = (notes: CoachNote[]) => [...notes].reverse().find((n) => n.by === "coach" && !n.readAt) ?? null;
// the local copy, so Today shows the note without waiting for the account
const KEY = "chefmealan-coach";
export type CoachLocal = { notes: CoachNote[]; checkinDay: number };
export const getCoachLocal = (): CoachLocal => { try { const x = JSON.parse(localStorage.getItem(KEY) || "{}"); return { notes: notesOf(x.notes), checkinDay: checkinOf(x.checkinDay) }; } catch { return { notes: [], checkinDay: CHECKIN_DEFAULT }; } };
export const setCoachLocal = (c: CoachLocal) => { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch {} };
