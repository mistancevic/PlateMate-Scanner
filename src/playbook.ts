// Mealan's playbook: what code decides about a food before the model writes a word.
// Moment suitability and caveats come from fixed rules with reasons; the model must follow them, the evals check them.
import { density, type Food } from "./pilot";
import { jobOf } from "./foodjob";
export type Verdict = { ok: boolean; reason: string };
export type Playbook = { beforeTraining: Verdict; afterTraining: Verdict; alone: Verdict; caveats: string[] };
// UK Food Standards Agency front-of-pack "high" values, per 100 g
export const HIGH = { fat: 17.5, saturates: 5, sugars: 22.5, salt: 1.5 };
// before training: little fat and fibre, so it digests fast (ISSN position on nutrient timing)
export const PRE_MAX = { fat: 10, fibre: 6 };
const line = (f: Food, key: string) => f.table?.find((r) => r.key === key && r.unit === "g")?.amount ?? null;
const g = (n: number) => `${n.toLocaleString("en", { maximumFractionDigits: 1 })} g per 100 g`;
export function playbookFor(f: Food): Playbook {
  const { job } = jobOf(f);
  const fat = f.fats ?? 0, fibre = f.fiber ?? 0, pd = density(f.protein, f.calories) ?? 0;
  const before: Verdict = fat > PRE_MAX.fat
    ? { ok: false, reason: `not before training: ${g(fat)} fat slows digestion` }
    : fibre > PRE_MAX.fibre
      ? { ok: false, reason: `not right before training: ${g(fibre)} fibre slows digestion` }
      : { ok: true, reason: "suits the hour before training: little fat and fibre" };
  const after: Verdict = job === "Protein base" || pd >= 8
    ? { ok: true, reason: "suits after training: a protein base" }
    : job === "Carb base" || job === "Volume food"
      ? { ok: true, reason: "suits after training next to a protein base" }
      : { ok: false, reason: "after training it needs a protein base to carry the plate" };
  const alone: Verdict = job === "Flavour food"
    ? { ok: false, reason: "a flavour food: a small part of a plate carried by a protein base, never on its own or for energy" }
    : job === "Fat source"
      ? { ok: false, reason: "a fat source: small amounts next to a protein base" }
      : { ok: true, reason: "can be eaten on its own" };
  const caveats: string[] = [];
  if (fat > HIGH.fat) caveats.push(`high in fat: ${g(fat)}`);
  const sat = line(f, "saturates"); if (sat !== null && sat > HIGH.saturates) caveats.push(`high in saturates: ${g(sat)}`);
  const sug = line(f, "sugars"); if (sug !== null && sug > HIGH.sugars) caveats.push(`high in sugars: ${g(sug)}`);
  const salt = line(f, "salt"); if (salt !== null && salt > HIGH.salt) caveats.push(`high in salt: ${g(salt)}`);
  return { beforeTraining: before, afterTraining: after, alone, caveats };
}
// words Mealan never uses: they moralise food, which the voice forbids
export const BANNED = ["in moderation", "moderation", "guilty", "guilt", "cheat", "treat yourself", "clean eating", "junk", "naughty", "sinful", "bad food", "good food"];
// a tip breaks the playbook when it recommends a moment the code ruled out, or says a banned word
export function tipBreaks(tip: string, pb: Playbook): string[] {
  const t = tip.toLowerCase(), out: string[] = [];
  const pre = /(before|pre-?)\s*(your\s*)?(training|workout|session|lifting|gym)/.test(t) && !/(not|never|avoid|skip|rather than|instead of)[^.]{0,40}(before|pre-?)\s*(your\s*)?(training|workout|session|lifting|gym)/.test(t);
  if (pre && !pb.beforeTraining.ok) out.push("recommends it before training");
  if (!pb.alone.ok && /(on its own|by itself|alone)/.test(t) && !/(not|never)[^.]{0,20}(on its own|by itself|alone)/.test(t)) out.push("recommends it on its own");
  if (!pb.alone.ok && /(energy boost|for energy|quick energy)/.test(t)) out.push("sells a flavour food as energy");
  for (const w of BANNED) if (t.includes(w)) { out.push(`says "${w}"`); break; }
  return out;
}
