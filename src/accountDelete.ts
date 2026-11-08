// Delete my account, in a safe order (7 October 2026, after a delete that removed the data but not the sign-in, and an
// open phone that then saved its old copy back). The server runs the steps; this file holds the order and the words, so
// both can be tested without Google.
//   1. lock: the sign-in is switched off and other phones are signed out. If this fails, nothing is deleted.
//   2. photo files, 3. the record with cards and recipes, 4. access requests and invites.
//      If one of these fails, the sign-in is unlocked again, so the person can sign in and finish.
//   5. the sign-in itself. If only this fails, the data is gone and the sign-in stays switched off; the team removes it.
import { w } from "./words";
export type DeleteStep = "lock" | "files" | "record" | "requests" | "signin";
export type DeleteDeps = {
  lock: () => Promise<void>;
  unlock: () => Promise<void>;
  files: () => Promise<void>;
  record: () => Promise<void>;
  requests: () => Promise<void>;
  signin: () => Promise<void>;
  log: (line: string) => void;
};
export type DeleteResult = { ok: boolean; done: DeleteStep[]; failed?: DeleteStep; dataGone: boolean; message: string; error?: string };

// DT243: the words are lines of the app. The server builds the message, so it reads English there until the phone's language is passed
const NAME_KEY = { lock: "account.stepLock", files: "account.stepFiles", record: "account.stepRecord", requests: "account.stepRequests", signin: "account.stepSignin" } as const;
const NAME = (s: DeleteStep) => w(NAME_KEY[s]);
const list = (xs: DeleteStep[]) => xs.filter((x) => x !== "lock").map((x) => NAME(x)).join(", ");

export async function deleteAccount(deps: DeleteDeps): Promise<DeleteResult> {
  const done: DeleteStep[] = [];
  const order: DeleteStep[] = ["lock", "files", "record", "requests", "signin"];
  for (const step of order) {
    try {
      await deps[step]();
      done.push(step);
    } catch (e) {
      const error = (e as Error)?.message ?? String(e);
      deps.log(`account delete stopped at ${step}: ${error}`);
      if (step === "lock") {
        return { ok: false, done, failed: step, dataGone: false, error, message: w("account.deleteNotStarted") };
      }
      if (step === "signin") {
        return { ok: false, done, failed: step, dataGone: true, error, message: w("account.deleteSigninLeft") };
      }
      let unlocked = true;
      try { await deps.unlock(); } catch (u) { unlocked = false; deps.log(`account delete could not unlock: ${(u as Error)?.message ?? u}`); }
      const dataGone = done.includes("record");
      const removed = list(done);
      return {
        ok: false, done, failed: step, dataGone, error,
        message: `${w("account.deleteStoppedAt", { step: NAME(step) })} ${removed ? w("account.deleteRemovedSoFar", { removed }) : w("account.deleteNothingRemoved")} ${unlocked ? w("account.deleteSigninWorks") : w("account.deleteSigninOff")}`,
      };
    }
  }
  return { ok: true, done, dataGone: true, message: w("account.deleted", { list: list(done) }) };
}

// DT259e (0.3.113, board Stories194): the server deletes only right after the check that it is you (a link, or Google once
// more): a sign-in older than 15 minutes is refused, and nothing is deleted
export const RECENT_S = 15 * 60;
export const signedInRecently = (authTime: number, nowS: number) => authTime > 0 && nowS - authTime >= -60 && nowS - authTime <= RECENT_S;
