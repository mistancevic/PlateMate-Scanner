// Safety rules, version 1 (4 October 2026). Code decides; the model is told; nothing here is improvised.
// Mealan is a chef. For people who need more than a chef it steps back, names a professional, and keeps the plate working.
import type { Food } from "./pilot";

export type SituationId = "eating" | "pregnancy" | "diabetes" | "allergies" | "medication";
export type FlagSource = "door" | "code" | "model" | "coach";
export type Flag = { situation: SituationId | "under18"; at: string; source: FlagSource };
export type Safety = {
  consentBodyAt?: string;          // explicit consent before anything about the body is stored
  consentBy?: "self" | "parent";   // who gave it; under 16 it has to be a parent
  situations: SituationId[];       // declared at the door, or flagged inside and kept
  flags: Flag[];                   // every flag, with its source and date; the coach sees situation and date only
  allergies: string[];             // declared on the profile; a flagged food is never suggested
  declaredAt?: string;             // when the door screen was last answered
  aiConfirmedAt?: string;          // written by the coach: the AI parts may be on for this account
  aiConfirmedBy?: string;
};
export const EMPTY_SAFETY: Safety = { situations: [], flags: [], allergies: [] };

export const SITUATIONS: { id: SituationId; label: string; detail: string }[] = [
  { id: "eating", label: "A difficult relationship with eating", detail: "now or in the past" },
  { id: "pregnancy", label: "Pregnant or breastfeeding", detail: "" },
  { id: "diabetes", label: "Diabetes or insulin", detail: "" },
  { id: "allergies", label: "Allergies or intolerances", detail: "say which, below" },
  { id: "medication", label: "Medication that affects food", detail: "anticoagulants, MAO inhibitors, thyroid, anything your doctor told you about with food" },
];

// ---- age bands. Germany: a person consents to a service from 16; under 16 a parent does; under 13 no account.
export type AgeBand = "adult" | "teen" | "young" | "child" | "unknown";
export function ageBand(birthYear: number | undefined | null, now = new Date()): AgeBand {
  if (!birthYear || birthYear < 1900) return "unknown";
  const age = now.getFullYear() - birthYear;
  return age >= 18 ? "adult" : age >= 16 ? "teen" : age >= 13 ? "young" : "child";
}
export const isMinor = (b: AgeBand) => b === "teen" || b === "young" || b === "child";

// ---- the AI switch. Off until a coach confirms for: signs of disordered eating, and every minor.
// A minor also needs the right consent recorded: under 16 a parent's. Under 13 there is no account.
export type AiState = { on: boolean; why: string; needsParent: boolean; blocked: boolean };
export function aiState(safety: Safety, birthYear: number | undefined | null, hasCoach: boolean, now = new Date()): AiState {
  const band = ageBand(birthYear, now);
  if (band === "child") return { on: false, why: "Chef Mealan is not for people under 13.", needsParent: false, blocked: true };
  const confirmed = Boolean(safety.aiConfirmedAt);
  if (isMinor(band)) {
    const needsParent = band === "young";
    const consentOk = Boolean(safety.consentBodyAt) && (!needsParent || safety.consentBy === "parent");
    if (!hasCoach) return { on: false, why: "Under 18, Mealan's chat needs a coach or a parent attached to the account.", needsParent, blocked: false };
    if (!consentOk) return { on: false, why: needsParent ? "Under 16, a parent has to agree before Mealan's chat is on." : "Mealan's chat is on once you have agreed to the profile and your coach has confirmed.", needsParent, blocked: false };
    if (!confirmed) return { on: false, why: "Mealan's chat is on once your coach confirms the account.", needsParent, blocked: false };
    return { on: true, why: "", needsParent, blocked: false };
  }
  if (safety.situations.includes("eating") && !confirmed) return { on: false, why: "Mealan's chat is off for this account until your coach confirms. The plate, the numbers and your foods keep working.", needsParent: false, blocked: false };
  return { on: true, why: "", needsParent: false, blocked: false };
}

// ---- the fixed responses. Written once, reviewed by Milan, never improvised. Mealan stays a chef, names who to talk to, says what the plate still does.
export const FIXED: Record<SituationId | "under18" | "off", string> = {
  eating: "I'm a chef, and this is beyond what a chef should advise on. A doctor or a therapist who works with eating is the right person, and your coach knows you told me. Here, I keep doing what I can: the foods, the plates and the amounts, with the numbers as information, never as a verdict.",
  pregnancy: "I'm a chef, and pregnancy and breastfeeding change what a body needs in ways a chef shouldn't set. Your midwife or doctor sets the targets; bring their numbers and I fit the food to them. I won't suggest a deficit, and the plates stay as they are.",
  diabetes: "I'm a chef, and with diabetes or insulin the timing and the carbs are your doctor's call, not mine. I show the carbs and the sugars on every plate, and I fit the food to the numbers you bring from them. I won't advise on doses or timing.",
  allergies: "Noted. Nothing with what you listed will be suggested, and I check the name and the label lines of every food. The label check still shows what a pack contains, so you can see it yourself.",
  medication: "I'm a chef, and some medication changes what food does. Your doctor or pharmacist says what to avoid; tell me which foods and I keep them off every suggestion. Everything else stays as it is.",
  under18: "Mealan's numbers never go under what a growing body needs: no deficit, no cutting. The chat is on once the account is confirmed by a coach or a parent.",
  off: "Mealan's chat is off for this account until your coach confirms. The plate, the numbers and your foods keep working.",
};
export const PROFESSIONAL: Record<SituationId, string> = { eating: "a doctor or a therapist who works with eating", pregnancy: "your midwife or doctor", diabetes: "your doctor or diabetes nurse", allergies: "your doctor or an allergist", medication: "your doctor or pharmacist" };

// ---- allergens. A declared allergy or intolerance matches the food's name, its label lines and its notes, in the languages the pilot sees.
const ALLERGEN_WORDS: Record<string, RegExp> = {
  milk: /milk|milch|mlijeko|mleko|leche|lait|lactose|laktose|laktoza|whey|molke|casein|kasein|skyr|quark|yogurt|yoghurt|joghurt|jogurt|cheese|käse|sir\b|queso|butter|cream|sahne|rahm|kefir|ricotta|mascarpone|cottage/i,
  lactose: /lactose|laktose|laktoza|milk|milch|cream|sahne|yogurt|joghurt|kefir|ice ?cream|\beis\b/i,
  gluten: /gluten|wheat|weizen|pšenica|trigo|blé|barley|gerste|rye|roggen|spelt|dinkel|bread|brot|pasta|nudel|noodle|couscous|bulgur|seitan|flour|mehl|semolina|grieß|cracker|keks|biscuit|cookie|cake|kuchen/i,
  wheat: /wheat|weizen|pšenica|trigo|blé|flour|mehl|bread|brot|pasta|nudel|couscous|bulgur|seitan|semolina|grieß/i,
  nuts: /nut\b|nuts|nuss|nüsse|almond|mandel|hazelnut|haselnuss|walnut|walnuss|cashew|pistachio|pistazie|pecan|macadamia|marzipan|nutella|praline|orah|badem|lješnjak/i,
  peanut: /peanut|erdnuss|kikiriki|cacahuete|arachide/i,
  egg: /\begg|\beier?\b|\bei\b|jaje|jaja|huevo|œuf|mayonnaise|mayo|meringue/i,
  soy: /soy|soja|tofu|tempeh|edamame|miso|shoyu|tamari/i,
  fish: /fish|fisch|riba|pescado|poisson|salmon|lachs|tuna|thunfisch|cod|kabeljau|trout|forelle|anchov|sardin|mackerel|makrele|hering/i,
  shellfish: /shrimp|prawn|garnele|crab|krabbe|lobster|hummer|mussel|muschel|clam|oyster|auster|scallop|squid|calamari|octopus|crustace|krebstier|mollus|weichtier/i,
  sesame: /sesame|sesam|tahini|susam/i,
  celery: /celery|sellerie|celer/i,
  mustard: /mustard|senf|moutarde/i,
  sulphites: /sulphite|sulfite|sulfit|schwefel/i,
  lupin: /lupin|lupine/i,
};
// A declared word matches an allergen family, or is used as a plain word of its own.
export function allergenMatcher(declared: string): RegExp | null {
  const d = declared.trim().toLowerCase();
  if (!d) return null;
  for (const [k, re] of Object.entries(ALLERGEN_WORDS)) if (k === d || re.test(d)) return re;
  const esc = d.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(esc, "i");
}
export function foodText(f: Food): string {
  return [f.name, f.brand, f.notes, ...(f.table ?? []).map((r) => r.name)].filter(Boolean).join(" · ");
}
// The declared allergies that this food trips, by the person's own words
export function allergyHits(f: Food, allergies: string[]): string[] {
  const text = foodText(f);
  return allergies.filter((a) => { const re = allergenMatcher(a); return re ? re.test(text) : false; });
}
export const blockedByAllergy = (f: Food, allergies: string[]) => allergyHits(f, allergies).length > 0;

// ---- code signals. Two numbers, with their source on screen.
export const SIGNAL_SOURCES = {
  floor: "A day under the body's resting burn, Mifflin-St Jeor from the profile, is a day the goal engine never sets; a custom goal under 80 percent of it raises a flag",
  pace: "A loss faster than 1 percent of body weight a week is beyond what the position stands for weight management call sustainable; a custom goal that implies it raises a flag",
};
export function goalSignals(custom: boolean, goalKcal: number | null, restingKcal: number | null, maintenanceKcal: number | null, weightKg: number | null | undefined): { flag: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (!custom || goalKcal === null) return { flag: false, reasons };
  if (restingKcal !== null && goalKcal < 0.8 * restingKcal) reasons.push(`${goalKcal} kcal a day is under 80 percent of the ${Math.round(restingKcal)} kcal the body burns at rest`);
  if (maintenanceKcal !== null && weightKg && weightKg > 0) {
    const lossPerWeekKg = ((maintenanceKcal - goalKcal) * 7) / 7700;
    if (lossPerWeekKg > 0.01 * weightKg) reasons.push(`the gap to maintenance means about ${lossPerWeekKg.toFixed(1)} kg a week, over 1 percent of ${weightKg} kg`);
  }
  return { flag: reasons.length > 0, reasons };
}

// The coach sees situation and date only, never the words
export const coachView = (s: Safety) => s.flags.map((f) => ({ situation: f.situation, at: f.at.slice(0, 10) }));
export function addFlag(s: Safety, situation: Flag["situation"], source: FlagSource, now = new Date()): Safety {
  const at = now.toISOString();
  const already = s.flags.some((f) => f.situation === situation && f.source === source && f.at.slice(0, 10) === at.slice(0, 10));
  const flags = already ? s.flags : [...s.flags, { situation, at, source }];
  const situations = situation === "under18" || s.situations.includes(situation) ? s.situations : [...s.situations, situation];
  return { ...s, flags, situations };
}

// ---- storage on the phone; the account holds the same object, and the coach's confirmation as its own fields
const SKEY = "chefmealan-safety";
export const getSafety = (): Safety => { try { const x = JSON.parse(localStorage.getItem(SKEY) || "null"); return x && typeof x === "object" ? { ...EMPTY_SAFETY, ...x } : { ...EMPTY_SAFETY }; } catch { return { ...EMPTY_SAFETY }; } };
export const setSafety = (s: Safety) => { try { localStorage.setItem(SKEY, JSON.stringify(s)); } catch {} };
// the model may end a reply with "FLAG: <situation>"; the client takes it and never shows it
export function takeModelFlag(text: string): { text: string; flag: SituationId | null } {
  const m = text.match(/\n?\s*FLAG:\s*(eating|pregnancy|diabetes|allergies|medication)\s*\.?\s*$/i);
  if (!m) return { text, flag: null };
  return { text: text.slice(0, m.index).trimEnd(), flag: m[1].toLowerCase() as SituationId };
}
