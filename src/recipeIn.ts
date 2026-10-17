// A recipe from screenshots or a link (0.2.16, canvas board IM; Milan 16 October 2026, 20:28 to 22:17).
// The model reads the dish, the foods and the amounts as written; code checks the grams, sizes the portion, and checks
// every change Chef Mealan proposes. Rules the code keeps, from board IM:
// - a swap keeps the food's role in the dish, and a melting cheese is only replaced by one that melts;
// - code never judges a side by what is normal: sides follow the person (your way first), only cooking failures are ruled out;
// - nothing is offered above a real portion: no single food over 600 g a portion.
import type { Food, Ingredient } from "./pilot";
import { gramsFromMeasure } from "./units";
import { cleanPart } from "./parts";

export const MAX_SHOTS = 4;
export const ROLES = ["base", "protein", "melting cheese", "cheese", "dairy", "sauce", "fat", "vegetable", "fruit", "herb or spice", "sweet", "other"] as const;
export type Role = (typeof ROLES)[number];
export type How = "recipe" | "converted" | "guessed";
// optional: the recipe says so (0.2.17, the cookie on 16 October 2026): left out of the numbers until the person adds it
export type ReadItem = { name: string; written: string; grams: number; how: How; role: Role; calories: number; protein: number; fats: number | null; carbs: number | null; optional: boolean; on?: boolean; note?: string; part?: string };
// what the recipe itself says about its numbers, per serving, when it says it (0.2.17)
export type Stated = { kcal: number; protein: number; fats: number | null; carbs: number | null };
// steps: the recipe's own method as written (0.2.18, board IM, IM9b), kept for the person only
export type ReadRecipe = { title: string; source: string; servings: number; servingsUnit: string; servingsHow: "recipe" | "guessed"; items: ReadItem[]; stated: Stated | null; steps: string[] };
export type ReadError = "login" | "fetch" | "no-recipe" | "not-recipe" | "no-amounts";

// ---- the link ----
// Sites that show nothing without a login: read them from a screenshot instead
const LOGIN_HOSTS = /(^|\.)(instagram\.com|tiktok\.com|facebook\.com|fb\.com|fb\.watch|threads\.net|x\.com|twitter\.com)$/i;
export function linkCheck(raw: string): { ok: true; url: URL } | { ok: false; error: ReadError } {
  let u: URL;
  try { u = new URL(String(raw).trim()); } catch { return { ok: false, error: "fetch" }; }
  if (u.protocol !== "https:" || u.username || u.password || (u.port && u.port !== "443")) return { ok: false, error: "fetch" };
  if (LOGIN_HOSTS.test(u.hostname)) return { ok: false, error: "login" };
  if (/^(localhost|.*\.local|.*\.internal|metadata\.google\.internal)$/i.test(u.hostname)) return { ok: false, error: "fetch" };
  if (/^[\d.]+$/.test(u.hostname) || u.hostname.includes(":") || u.hostname.startsWith("[")) return { ok: false, error: "fetch" };
  return { ok: true, url: u };
}
// An address the server must never open: its own machine, the cloud's internal network and metadata, private ranges
export function isPrivateIp(ip: string): boolean {
  const v = ip.toLowerCase().replace(/^::ffff:/, "");
  if (/^\d+\.\d+\.\d+\.\d+$/.test(v)) {
    const [a, b] = v.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19));
  }
  return v === "::" || v === "::1" || /^f[cd]/.test(v) || /^fe[89ab]/.test(v) || /^ff/.test(v) || v.startsWith("64:ff9b") || v.startsWith("2001:db8");
}

// The recipe a page publishes as structured data (schema.org Recipe in JSON-LD), when it has one
export function recipeFromLd(html: string): { name: string; ingredients: string[]; yield: string; author: string; steps: string[] } | null {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  const isRecipe = (x: any) => x && typeof x === "object" && ([] as unknown[]).concat(x["@type"] ?? []).some((t) => String(t).toLowerCase() === "recipe");
  const find = (x: any): any => {
    if (!x || typeof x !== "object") return null;
    if (isRecipe(x)) return x;
    if (Array.isArray(x)) { for (const y of x) { const r = find(y); if (r) return r; } return null; }
    if (Array.isArray(x["@graph"])) return find(x["@graph"]);
    return null;
  };
  for (const b of blocks) {
    let data: any; try { data = JSON.parse(b.trim()); } catch { continue; }
    const r = find(data);
    if (!r) continue;
    const ingredients = ([] as unknown[]).concat(r.recipeIngredient ?? r.ingredients ?? []).map((x) => String(x).replace(/\s+/g, " ").trim()).filter(Boolean).slice(0, 40);
    if (!ingredients.length) continue;
    const who = (x: any) => (typeof x === "string" ? x : Array.isArray(x) ? who(x[0]) : x && typeof x === "object" ? String(x.name ?? "") : "");
    // the method: text, HowToStep, or HowToSection with its own steps (0.2.18, IM9b)
    const stepsOf = (x: any): string[] => typeof x === "string" ? x.split(/\n+/) : Array.isArray(x) ? x.flatMap(stepsOf) : x && typeof x === "object" ? (Array.isArray(x.itemListElement) ? stepsOf(x.itemListElement) : [String(x.text ?? x.name ?? "")]) : [];
    const steps = cleanSteps(stepsOf(r.recipeInstructions ?? []).map((s) => pageText(s)));
    return { name: String(r.name ?? "").trim().slice(0, 100), ingredients, yield: String(([] as unknown[]).concat(r.recipeYield ?? [])[0] ?? "").slice(0, 40), author: who(r.author) || who(r.publisher), steps };
  }
  return null;
}
// The page as plain text, when it has no structured recipe: no scripts, no styles, no tags, at most 20,000 letters
export function pageText(html: string): string {
  return html.replace(/<(script|style|noscript|svg|nav|footer|header)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim().slice(0, 20000);
}
export const siteName = (html: string, host: string) =>
  (html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']{1,60})["']/i)?.[1] ?? host.replace(/^www\./, "")).trim();

// the original steps: at most 20, each at most 400 letters, no empty lines
export const cleanSteps = (l: unknown): string[] => (Array.isArray(l) ? l : []).map((x) => String(x ?? "").replace(/\s+/g, " ").trim().slice(0, 400)).filter(Boolean).slice(0, 20);
// ---- what was read, checked ----
const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : Number(x));
// Grams written on the recipe win over the model's: 500 g, 0.5 kg. Other units (2 tbsp, 2 balls) are the model's,
// marked converted; no amount at all is guessed.
export function gramsWritten(written: string): number | null {
  const m = String(written).replace(",", ".").match(/(\d+(?:\.\d+)?)\s*(kg|g|gr|gram|grams)\b/i);
  if (!m) return null;
  const v = Number(m[1]) * (/^kg$/i.test(m[2]) ? 1000 : 1);
  return v > 0 && v < 10000 ? v : null;
}
export function cleanRead(d: any): ReadRecipe | null {
  if (!d || typeof d !== "object") return null;
  const items: ReadItem[] = (Array.isArray(d.items) ? d.items : []).slice(0, 30).map((i: any) => {
    const written = String(i?.written ?? "").slice(0, 60);
    const exact = gramsWritten(written);
    const name = String(i?.name ?? "").trim().slice(0, 60);
    // cups, spoons, ounces and sticks: grams by code from the food's kind (0.2.18, board UN), else the model's
    const measured = exact === null ? gramsFromMeasure(written, name) : null;
    let how: How = ["recipe", "converted", "guessed"].includes(i?.how) ? i.how : "guessed";
    if (exact !== null) how = "recipe";
    else if (how === "recipe") how = written.trim() ? "converted" : "guessed";
    const role: Role = (ROLES as readonly string[]).includes(i?.role) ? i.role : "other";
    const cal = num(i?.calories), pro = num(i?.protein), fat = num(i?.fats), carb = num(i?.carbs);
    if (measured !== null) how = "converted";
    return { name: name.charAt(0).toUpperCase() + name.slice(1), written, grams: Math.round(exact ?? measured ?? num(i?.grams)), how, role,
      calories: cal, protein: pro, fats: Number.isFinite(fat) && fat >= 0 ? fat : null, carbs: Number.isFinite(carb) && carb >= 0 ? carb : null, optional: i?.optional === true, ...(i?.optional === true && String(i?.note ?? "").trim() ? { note: String(i.note).trim().slice(0, 60) } : {}), ...(cleanPart(i?.part) ? { part: cleanPart(i.part) } : {}) };
  }).filter((i: ReadItem) => i.name && i.grams > 0 && i.grams <= 5000 && Number.isFinite(i.calories) && i.calories >= 0 && i.calories <= 950 && Number.isFinite(i.protein) && i.protein >= 0 && i.protein <= 100);
  if (!items.length) return null;
  // parts only when the recipe groups its foods into two or more (0.2.19, IM15); a single group is one list
  if (new Set(items.map((i) => i.part).filter(Boolean)).size < 2) for (const i of items) delete i.part;
  else for (const i of items) if (!i.part) i.part = "Other";
  const n = Math.round(num(d.servings));
  const st = d.stated && typeof d.stated === "object" ? d.stated : null;
  const sk = num(st?.calories), sp = num(st?.protein), sf = num(st?.fats), sc = num(st?.carbs);
  const per = Number.isFinite(n) && n >= 1 ? Math.min(24, n) : 1;
  // the recipe's own numbers, always per serving; for the whole recipe they are divided by how many it makes
  const div = st?.per === "recipe" ? per : 1;
  const stated: Stated | null = Number.isFinite(sk) && sk > 0 && sk < 5000 && Number.isFinite(sp) && sp >= 0 && sp < 400
    ? { kcal: sk / div, protein: sp / div, fats: Number.isFinite(sf) && sf >= 0 ? sf / div : null, carbs: Number.isFinite(sc) && sc >= 0 ? sc / div : null } : null;
  return {
    stated,
    steps: cleanSteps(d.method),
    title: String(d.title ?? "").trim().slice(0, 80) || "A recipe",
    source: String(d.source ?? "").trim().slice(0, 80),
    servings: Number.isFinite(n) && n >= 1 ? Math.min(24, n) : 1,
    servingsUnit: String(d.servings_unit ?? "").trim().slice(0, 24) || "portions",
    servingsHow: d.servings_how === "recipe" && Number.isFinite(n) && n >= 1 ? "recipe" : "guessed",
    items,
  };
}

// ---- the portion ----
const kcalOf = (l: { grams: number; food: Pick<Food, "calories"> }[]) => l.reduce((n, i) => n + ((i.food.calories ?? 0) * i.grams) / 100, 0);
const protOf = (l: { grams: number; food: Pick<Food, "protein"> }[]) => l.reduce((n, i) => n + ((i.food.protein ?? 0) * i.grams) / 100, 0);
export const pdOf = (l: { grams: number; food: Pick<Food, "calories" | "protein"> }[]) => { const k = kcalOf(l); return k > 0 ? (100 * protOf(l)) / k : null; };
export const kcalOfItems = kcalOf;
// A scaled amount a cook can weigh, and that keeps the recipe's ratios (0.2.17, the cookie: 4 g baking soda became 5 g,
// 22.5 g flour 25 g): under 100 g to the gram, from 100 g to the nearest 5 g, never under 1 g
export const roundGrams = (g: number) => (g < 100 ? Math.max(1, Math.round(g)) : Math.round(g / 5) * 5);
// Every food by the same factor
export function scaleTo<T extends { grams: number; food: Pick<Food, "calories"> }>(whole: T[], kcal: number): T[] {
  const all = kcalOf(whole);
  if (!(all > 0) || !(kcal > 0)) return whole.map((i) => ({ ...i }));
  const k = kcal / all;
  return whole.map((i) => ({ ...i, grams: roundGrams(i.grams * k) }));
}
// The recipe's own portion: the whole divided by how many it makes
export const onePortion = <T extends { grams: number; food: Pick<Food, "calories"> }>(whole: T[], servings: number): T[] =>
  whole.map((i) => ({ ...i, grams: roundGrams(i.grams / Math.max(1, servings)) }));
// Sized for the meal only when that is between half and one and a half of the recipe's own portion; else the recipe's
// own portion, so nobody is asked to bake 40% of a cookie (0.2.17)
export const sizedFits = (mealKcal: number | null, portionKcal: number) => !!mealKcal && portionKcal > 0 && mealKcal / portionKcal >= 0.5 && mealKcal / portionKcal <= 1.5;
// The recipe's own numbers against ours: differ when the energy is more than 15% apart
export const statedDiffers = (stated: Stated, kcal: number) => Math.abs(kcal - stated.kcal) / Math.max(1, stated.kcal) > 0.15;

// Add on the side (IM5b): the dish stays as the recipe makes it, a little smaller; the side brings the protein. The
// smallest side, in 5 g steps up to 400 g, that brings the meal to the target at about the meal's size. Null when none does.
export function sideAmount<T extends { grams: number; food: Pick<Food, "calories" | "protein"> }>(dish: T[], side: Pick<Food, "calories" | "protein">, need: number, target: number): { dish: T[]; grams: number } | null {
  if (!(side.calories && side.calories > 0) || !(need > 0)) return null;
  for (let g = 5; g <= 400; g += 5) {
    const sk = (side.calories * g) / 100;
    if (sk >= need * 0.6) return null;
    const d = scaleTo(dish, need - sk);
    const pd = pdOf([...d, { grams: g, food: side } as any]);
    if (pd !== null && pd >= target - 0.005) return { dish: d, grams: g };
  }
  return null;
}

// Change the dish (IM5): Chef Mealan's version of the whole recipe; code checks it before anyone sees it
const NO_MELT = /cottage|h(ü|u)ttenk|quark|skyr|yog(h)?urt|ricotta|frischk|cream cheese|kefir/i;
export type Changed = { name: string; grams: number; calories: number; protein: number; fats: number | null; carbs: number | null; role: Role; was: string | null; change: "same" | "swap" | "add" | "less" };
export function checkChange(original: { name: string; role: Role }[], next: Changed[]): string | null {
  for (const o of original) {
    const kept = next.find((x) => (x.change === "same" || x.change === "less") && x.name.toLowerCase() === o.name.toLowerCase());
    const swapped = next.find((x) => x.change === "swap" && (x.was ?? "").toLowerCase() === o.name.toLowerCase());
    if (!kept && !swapped) return `${o.name} is missing: keep every food, swap it or use less of it.`;
    if (swapped) {
      if (swapped.role !== o.role) return `${swapped.name} doesn't do the job of ${o.name} (${o.role}).`;
      if (o.role === "melting cheese" && NO_MELT.test(swapped.name)) return `${swapped.name} doesn't melt like ${o.name}.`;
    }
  }
  if (next.filter((x) => x.change === "add").length > 2) return "Two added foods at most, so it stays the same dish.";
  return null;
}
// A changed or sided plate is a real meal: every food at least 5 g, none over 600 g
export const realPortions = (l: { grams: number; role?: string }[]) => l.every((i) => i.grams >= 1 && i.grams <= 600);

// Your way (IM5b): a side is yours when you have had it before; code checks the name against your own foods
export const isYours = (name: string, habits: string[]) => { const n = name.toLowerCase(); return habits.some((h) => { const x = h.toLowerCase().split(",")[0].trim(); return x.length > 2 && (n.includes(x) || x.includes(n)); }); };

// What a line says about its amount (IM3)
export const howWord = (h: How) => (h === "recipe" ? "" : h);
export type SideKind = "side" | "top" | "after";
export const sideWord = (k: SideKind) => (k === "top" ? "on top" : k === "after" ? "after" : "on the side");
// The plate's foods as ingredients
export const asItems = (l: { grams: number; food: Food }[], id: () => string): Ingredient[] => l.map((i) => ({ id: id(), grams: i.grams, locked: true, food: i.food }));
