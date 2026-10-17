// Chef Mealan drafts a recipe's steps (0.2.10, board CH, CH5; marks 0.2.18, IM9; parts 0.2.19, IM17), shared by the recipe page
// and How to make it on the Plate (0.2.20, board IM19b). The foods go as {1}, {2}; a draft that fails the checks goes back once.
import type { Meal, StepMark } from "./pilot";
import { fromDraft } from "./steps";

export type Drafted = { ok: true; steps: string[]; marks?: StepMark[]; kitchen?: string; parts?: string[] } | { ok: false; why: string; cannot?: boolean };
export async function draftSteps(meal: Meal, o: { library: string[]; equipment: string[]; kitchens: string[] }): Promise<Drafted> {
  const items = meal.items.filter((i) => i.grams > 0);
  const ask = async (failed?: string): Promise<Drafted> => {
    const res = await fetch("/api/steps", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: meal.title, items: items.map((i) => ({ name: i.food.name, grams: i.grams, part: i.part ?? "" })), optional: (meal.optional ?? []).map((x) => ({ name: x.name, part: x.part ?? "" })), kitchens: o.kitchens, failed,
      original: meal.source?.steps ?? [], equipment: o.equipment, makes: meal.makes ?? null }) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.error || "Chef Mealan could not answer. Try again.");
    if (typeof d.cannot === "string" && d.cannot) return { ok: false, why: d.cannot, cannot: true };
    // optional foods may be named in words, where the original puts them (IM17)
    const optNames = new Set((meal.optional ?? []).map((x) => x.name.toLowerCase()));
    const r = fromDraft(d.steps ?? [], items, o.library.filter((n) => !optNames.has(n.toLowerCase())));
    const parts = Array.isArray(d.parts) && items.some((i) => i.part) ? (d.parts as unknown[]).map((x) => String(x ?? "")) : undefined;
    return r.ok ? { ...r, ...(Array.isArray(d.marks) ? { marks: d.marks as StepMark[] } : {}), ...(typeof d.kitchen === "string" ? { kitchen: d.kitchen } : {}), ...(parts ? { parts } : {}) } : r;
  };
  const first = await ask();
  return first.ok || (first as { cannot?: boolean }).cannot ? first : ask((first as { why: string }).why);
}
