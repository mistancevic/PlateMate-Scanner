// DT168 (0.3.10, board Stories120; Coach Milan 30 October 12:09 Go): the account record in two parts. What is private (the
// library and plates, body data, health answers, allergies, declarations, where you shop) lives in users/{uid}/private/main,
// which only the person reads (firestore.rules). The main record, users/{uid}, keeps what the coach needs, with a small
// coachView the person's own phone writes: the week's numbers, the goal, weigh-ins, and the health situations as which and when.
// Pure functions here, the reads and writes in cloud.ts; tested in privateSplit.test.ts.
export const PRIVATE_KEYS = ["state", "personal", "safety", "region", "goneFoods"] as const;
export type PrivateKey = (typeof PRIVATE_KEYS)[number];

// what the coach's app reads of the person, and nothing more
export type CoachView = {
  goalsNow: { calories?: number | null; protein?: number | null } | null;
  nextGoal: unknown; pdUnit: "pd" | "pct";
  flags: { situation: string; at: string }[];      // which situation and the day, never the person's words
  consentBy: string | null;
  weightKg: number | null; trainingAge: unknown; weighIns: unknown[];
};
export function coachViewOf(data: Record<string, any>): Partial<CoachView> {
  const out: Partial<CoachView> = {};
  if (data.state && typeof data.state === "object") out.goalsNow = data.state.goals ? { calories: data.state.goals.calories ?? null, protein: data.state.goals.protein ?? null } : null;
  if (data.personal && typeof data.personal === "object") {
    const p = data.personal;
    out.nextGoal = p.nextGoal ?? null; out.pdUnit = p.pdUnit === "pct" ? "pct" : "pd";
    out.weightKg = typeof p.weightKg === "number" ? p.weightKg : null; out.trainingAge = p.trainingAge ?? null;
    out.weighIns = Array.isArray(p.weighIns) ? p.weighIns : [];
  }
  if (data.safety && typeof data.safety === "object") {
    out.flags = Array.isArray(data.safety.flags) ? data.safety.flags.map((f: any) => ({ situation: String(f.situation), at: String(f.at ?? "").slice(0, 10) })) : [];
    out.consentBy = data.safety.consentBy ?? null;
  }
  return out;
}

// One save in two parts. keepOld: on the preview the live app still reads the main record, so the private fields stay there
// too until the preview is promoted; everywhere else they go from the main record in the same write.
export function splitSave(data: Record<string, any>, keepOld: boolean): { priv: Record<string, unknown> | null; main: Record<string, unknown>; drop: PrivateKey[] } {
  const priv: Record<string, unknown> = {}, main: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) if ((PRIVATE_KEYS as readonly string[]).includes(k)) priv[k] = v; else main[k] = v;
  const moved = Object.keys(priv) as PrivateKey[];
  if (!moved.length) return { priv: null, main, drop: [] };
  const view = coachViewOf(data);
  if (Object.keys(view).length) main.coachView = view;
  if (data.updatedAt) priv.updatedAt = data.updatedAt;
  if (keepOld) for (const k of moved) main[k] = data[k];
  return { priv, main, drop: keepOld ? [] : moved };
}

// One load from the two parts: the private part wins over an old copy left in the main record; a goal the coach set after the
// person's last save carries its numbers in coachGoals (the coach can no longer write the private part)
export function mergeLoad(main: Record<string, any> | null, priv: Record<string, any> | null): Record<string, any> | null {
  if (!main && !priv) return null;
  const out: Record<string, any> = { ...(main ?? {}) };
  if (priv) for (const k of PRIVATE_KEYS) if (priv[k] !== undefined) out[k] = priv[k];
  if (priv?.updatedAt && (!out.updatedAt || priv.updatedAt > out.updatedAt)) out.updatedAt = priv.updatedAt;
  // a coach app from before 0.3.10 writes the numbers into the main record's state.goals
  const cg = main?.coachGoals ?? (priv ? main?.state?.goals : null);
  if (cg && main?.coachSetAt && (!priv?.updatedAt || main.coachSetAt > priv.updatedAt) && out.state && typeof out.state === "object") {
    out.state = { ...out.state, goals: { ...(out.state.goals ?? {}), ...(typeof cg.calories === "number" ? { calories: cg.calories } : {}), ...(typeof cg.protein === "number" ? { protein: cg.protein } : {}) } };
  }
  return out;
}

// the record as the coach's app reads it: coachView first, the old fields only while a person's record hasn't moved yet
export function coachFieldsOf(x: Record<string, any>) {
  const v = x.coachView && typeof x.coachView === "object" ? x.coachView : null;
  return {
    goalsNow: v ? v.goalsNow ?? null : x.state?.goals ?? null,
    nextGoal: v ? v.nextGoal ?? null : x.personal?.nextGoal ?? null,
    pdUnit: (v ? v.pdUnit : x.personal?.pdUnit) === "pct" ? "pct" as const : "pd" as const,
    flags: v ? (Array.isArray(v.flags) ? v.flags : []) : Array.isArray(x.safety?.flags) ? x.safety.flags.map((f: any) => ({ situation: String(f.situation), at: String(f.at ?? "").slice(0, 10) })) : [],
    consentBy: v ? v.consentBy ?? null : x.safety?.consentBy ?? null,
    weightKg: v ? v.weightKg ?? undefined : x.personal?.weightKg,
    trainingAge: v ? v.trainingAge ?? undefined : x.personal?.trainingAge,
    weighIns: v ? (Array.isArray(v.weighIns) ? v.weighIns : []) : Array.isArray(x.personal?.weighIns) ? x.personal.weighIns : [],
    foods: typeof x.foodsCount === "number" ? x.foodsCount : x.state?.foods?.length ?? 0,
  };
}

// the preview runs on its own address; there the live app still needs the main record as it was
export const onPreviewHost = (host: string) => /^preview---/.test(host);
