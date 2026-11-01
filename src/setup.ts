// DT208 (0.3.49, board Stories155 version 6; Coach Milan 1 November 20:51 to 21:49 Go): what the numbers and the plan still
// need, by name, in the order a person sets them. Everything stays open; Today and Me show one row under the goal: To set: ...
// or Profile and plan fully set. Name, body fat, the coach and Google Calendar are optional and never listed.
import type { Personal } from "./personal";
import { planOf } from "./personal";
import type { Safety } from "./safety";
export type SetupStep = "profile" | "goal" | "life" | "week" | "shop";
export type Missing = { step: SetupStep; label: string; field?: "sex" | "birthYear" | "height" | "weight" | "health" };
export function setupMissing(x: { personal: Personal; safety: Safety; goal: unknown; region: string | null | undefined }): Missing[] {
  const p = x.personal, out: Missing[] = [];
  if (!p.sex) out.push({ step: "profile", label: "female or male", field: "sex" });
  if (!p.birthYear) out.push({ step: "profile", label: "birth year", field: "birthYear" });
  if (!p.heightCm) out.push({ step: "profile", label: "height", field: "height" });
  if (!p.weightKg) out.push({ step: "profile", label: "weight", field: "weight" });
  if (!x.safety.declaredAt) out.push({ step: "profile", label: "health questions", field: "health" });
  if (!x.goal) out.push({ step: "goal", label: "goal" });
  if (!p.lifestyle) out.push({ step: "life", label: "lifestyle" });
  if (!planOf(p)) out.push({ step: "week", label: "training week" });
  if (!x.region) out.push({ step: "shop", label: "where you shop" });
  return out;
}
export const toSetLine = (m: Missing[]) => `To set: ${m.map((x) => x.label).join(", ")}`;
// what a step still needs, for its To do on Me
export const stepMissing = (m: Missing[], step: SetupStep) => m.filter((x) => x.step === step);
// the field Profile opens on, when a row sends you there
export const FOCUS_KEY = "chefmealan-setup-focus";
export function askFocus(field: string) { try { sessionStorage.setItem(FOCUS_KEY, field); } catch { /* the page opens at the top */ } }
export function takeFocus(): string | null { try { const v = sessionStorage.getItem(FOCUS_KEY); sessionStorage.removeItem(FOCUS_KEY); return v; } catch { return null; } }
