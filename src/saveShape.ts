// The save check (Coach Milan 2 November 18:19, Go; after the red error of 0.3.56, rule S1 in docs/rules/storage.md).
// The walkthroughs run without an account, so nothing checked what a phone sends to it. This builds what would go up from a
// phone's storage, by the same code the app uses (repairState, stripPhotos, splitSave, the records' changes), and lists what
// the account's database (Firestore) refuses: a list inside a list, a map nested deeper than 20, a field name that is empty or
// __like_this__, a document past 1 MiB. scripts/save-check.cjs runs it at the end of every walkthrough.
import { repairState } from "./pilot";
import { stripPhotos } from "./cloud";
import { splitSave } from "./privateSplit";
import { changes } from "./records";
import { getGoal, getGoalLog } from "./goal";
import { getPersonal } from "./personal";
import { getSafety } from "./safety";
import { getRegion } from "./moments";

export const PILOT_KEY = "platemate-pilot-v1";
// Firestore's own limits (firebase.google.com/docs/firestore/quotas): 1 MiB per document less the name, 20 levels deep
const MAX_BYTES = 1_048_487, MAX_DEPTH = 20;
// 0.3.67: our own limits, for what the account is charged by (1 KB a write unit): a photo as text, and the account's copy past 50 KB
export const PHOTO_TEXT = 2048, ACCOUNT_MAX_KB = 50;

export function shapeProblems(x: unknown, where = ""): string[] {
  const out: string[] = [];
  const walk = (v: any, path: string, depth: number, inArray: boolean) => {
    if (out.length > 4) return;
    if (Array.isArray(v)) {
      if (inArray) { out.push(`${where}${path}: a list inside a list`); return; }
      if (depth > MAX_DEPTH) { out.push(`${where}${path}: nested deeper than ${MAX_DEPTH}`); return; }
      v.forEach((y, i) => walk(y, `${path}[${i}]`, depth + 1, true));
    } else if (v && typeof v === "object") {
      if (depth > MAX_DEPTH) { out.push(`${where}${path}: nested deeper than ${MAX_DEPTH}`); return; }
      for (const k of Object.keys(v)) {
        if (k === "" || /^__.*__$/.test(k)) out.push(`${where}${path}: the field name "${k}" is not allowed`);
        walk(v[k], `${path}.${k}`, depth + 1, false);
      }
    } else if (typeof v === "number" && !Number.isFinite(v)) out.push(`${where}${path}: ${v} is not a number the account keeps`);
    // 0.3.67 (Coach Milan 3 November 07:55): a photo never rides as text; it is a file, and the copy names it
    else if (typeof v === "string" && v.startsWith("data:image") && v.length >= PHOTO_TEXT) out.push(`${where}${path}: a photo as text, ${Math.round(v.length / 1024)} KB`);
  };
  walk(x, "", 0, false);
  const bytes = new TextEncoder().encode(JSON.stringify(x) ?? "").length;
  if (bytes > MAX_BYTES) out.push(`${where}: ${Math.round(bytes / 1024)} KB, past the 1 MiB a document may hold`);
  return out;
}

// Every document a phone with this storage would write: the account's block (main and private part) and each record.
// slim: the block as it is 30 days after the records moved (blockOf in App.tsx), the copy that stays
export function accountWritesOf(store: Record<string, string>, slim = false): { where: string; data: unknown }[] {
  const raw = store[PILOT_KEY];
  if (!raw) return [];
  const g = globalThis as any, had = g.localStorage;
  g.localStorage = { getItem: (k: string) => (k in store ? store[k] : null), setItem() {}, removeItem() {}, key: () => null, length: 0, clear() {} };
  try {
    const state = repairState(JSON.parse(raw));
    const b = stripPhotos(state);
    const block = { state: slim ? { ...b, foods: [], meals: [] } : b, recordsOnly: slim, foodsCount: state.foods?.length ?? 0, goal: getGoal(), personal: getPersonal(), region: getRegion(), goalLog: getGoalLog(), safety: getSafety(), updatedAt: "2026-01-01T00:00:00Z" };
    const out: { where: string; data: unknown }[] = [];
    for (const keepOld of [true, false]) {
      const { priv, main } = splitSave(block, keepOld);
      out.push({ where: `users/{uid}${keepOld ? " (preview)" : ""}`, data: main });
      if (priv) out.push({ where: `users/{uid}/private${keepOld ? " (preview)" : ""}`, data: priv });
    }
    const { ups } = changes(state, {}, "2026-01-01T00:00:00Z", true);
    for (const u of ups) out.push({ where: `users/{uid}/${u.kind}/${u.id}`, data: u.kind === "cards" ? { ...u.data, shared: false, at: u.at } : { data: u.data, at: u.at } });
    return out;
  } finally { if (had === undefined) delete g.localStorage; else g.localStorage = had; }
}

export function saveCheck(store: Record<string, string>): { writes: number; problems: string[] } {
  const ws = accountWritesOf(store);
  const big = accountWritesOf(store, true).filter((w) => /^users\/\{uid\}(\/private)?( \(preview\))?$/.test(w.where)).map((w) => ({ w, kb: new TextEncoder().encode(JSON.stringify(w.data) ?? "").length / 1024 })).filter((x) => x.kb > ACCOUNT_MAX_KB);
  return { writes: ws.length, problems: [...ws.flatMap((w) => shapeProblems(w.data, w.where)), ...big.map((x) => `${x.w.where}: ${Math.round(x.kb)} KB, past the ${ACCOUNT_MAX_KB} KB the account's copy may hold`)] };
}
