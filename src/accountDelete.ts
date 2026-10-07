// Delete my account, in a safe order (7 October 2026, after a delete that removed the data but not the sign-in, and an
// open phone that then saved its old copy back). The server runs the steps; this file holds the order and the words, so
// both can be tested without Google.
//   1. lock: the sign-in is switched off and other phones are signed out. If this fails, nothing is deleted.
//   2. photo files, 3. the record with cards and recipes, 4. access requests and invites.
//      If one of these fails, the sign-in is unlocked again, so the person can sign in and finish.
//   5. the sign-in itself. If only this fails, the data is gone and the sign-in stays switched off; the team removes it.
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

const NAME: Record<DeleteStep, string> = {
  lock: "locking your sign-in",
  files: "your photo files",
  record: "your record, with cards and recipes",
  requests: "your access requests and invites",
  signin: "your sign-in",
};
const list = (xs: DeleteStep[]) => xs.filter((x) => x !== "lock").map((x) => NAME[x]).join(", ");

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
        return { ok: false, done, failed: step, dataGone: false, error, message: "Nothing was deleted: the delete couldn't start. Your data is as it was. Try again later." };
      }
      if (step === "signin") {
        return { ok: false, done, failed: step, dataGone: true, error, message: "Your data is deleted. Your sign-in is switched off, but removing it didn't work. Chef Mealan removes it for you." };
      }
      let unlocked = true;
      try { await deps.unlock(); } catch (u) { unlocked = false; deps.log(`account delete could not unlock: ${(u as Error)?.message ?? u}`); }
      const dataGone = done.includes("record");
      const removed = list(done);
      return {
        ok: false, done, failed: step, dataGone, error,
        message: `The delete stopped at ${NAME[step]}.${removed ? ` Removed so far: ${removed}.` : " Nothing was removed."}${unlocked ? " Your sign-in still works: sign in and tap Delete my account again to finish." : " Your sign-in is switched off; Chef Mealan finishes the delete for you."}`,
      };
    }
  }
  return { ok: true, done, dataGone: true, message: `Deleted: ${list(done)}.` };
}
