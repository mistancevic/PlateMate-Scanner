// DT180 to DT187 (0.3.25, boards Stories129 to Stories136; Coach Milan 31 October 11:16 to 13:12): Explorer in one sentence:
// what you eat (Nutrients), what it becomes (The body), when it helps and when it hurts (Situations). This file holds the map
// of The body, the list of Situations, the first situation page in full, and the search index over all of Explorer.
// Every line with a number names its paper; the papers were read again on 31 October 2026 (PubMed) before this was written.
// The wellness line: what happens in anyone; no test read, no level, no condition, no treatment, no supplement.

export type Part = "nutrients" | "body" | "situations";
export type BodyId = "muscle" | "fat" | "glycogen" | "bone" | "gut" | "liver" | "hormones" | "brain";
export type BodyFamily = { id: BodyId; name: string; hint: string; horizon: "meal" | "day" | "week" | "month"; state: "later" | "page" };
// the eight families (DT182, Stories131): the pages come one or two per version; until then each row says later
export const BODY_FAMILIES: BodyFamily[] = [
  { id: "muscle", name: "Muscle", hint: "Built by protein and strength training; the sink for carbs after a session.", horizon: "month", state: "later" },
  { id: "fat", name: "The fat store", hint: "The fat you carry, against the fat you eat. Burned, used over the day, stored; ketones.", horizon: "day", state: "later" },
  { id: "glycogen", name: "Glycogen", hint: "The carb store, muscle and liver, about a day's worth. Only what was used gets refilled.", horizon: "day", state: "later" },
  { id: "bone", name: "Bone", hint: "Calcium and vitamin D from Micros, strength training, oestrogen for everyone.", horizon: "month", state: "later" },
  { id: "gut", name: "The gut", hint: "Starts in the mouth. Digestion, the microbiome, fibre and variety, the fullness messengers.", horizon: "day", state: "later" },
  { id: "liver", name: "The liver", hint: "Makes glucose and ketones, clears alcohol, holds the small glycogen store.", horizon: "day", state: "later" },
  { id: "hormones", name: "Hormones", hint: "The messengers: glucose and insulin, hunger, cortisol, testosterone, oestrogen.", horizon: "day", state: "later" },
  { id: "brain", name: "The brain", hint: "Dopamine, serotonin, adrenaline, endorphins: wanting, mood, stress, the feeling after a session.", horizon: "day", state: "later" },
];

export type SituationId = "sleep" | "late" | "party" | "away" | "rest" | "fatburn";
export type Situation = { id: SituationId; name: string; hint: string; horizon: "day" | "week"; state: "later" | "page" };
export const SITUATIONS: Situation[] = [
  { id: "sleep", name: "A bad night's sleep", hint: "You eat more, sweet looks better, training feels harder. What causes it, and your day.", horizon: "day", state: "page" },
  { id: "late", name: "A late evening after work", hint: "Later", horizon: "day", state: "later" },
  { id: "party", name: "A party or a dinner out", hint: "Later", horizon: "day", state: "later" },
  { id: "away", name: "A day away, no kitchen", hint: "Later", horizon: "day", state: "later" },
  { id: "rest", name: "A day off training", hint: "Later", horizon: "day", state: "later" },
  { id: "fatburn", name: "Fat burning: what is true when", hint: "Later", horizon: "week", state: "later" },
];

export type Line = { title: string; text: string; src?: string };
export type WhenRow = { verdict: "Helps" | "Hurts" | "Watch"; when: string; what: string };
export type SituationPage = { id: SituationId; name: string; intro: string; effects: Line[]; causes: Line[]; loop: Line; when: WhenRow[]; line: string; chips: string[]; sources: string };

// DT180 (Stories129): a bad night's sleep, a day situation. The papers, read on 31 October 2026:
// Al Khatib, Harding, Darzi and Pot 2017, Eur J Clin Nutr 71:614, doi 10.1038/ejcn.2016.201 (meta-analysis, 11 studies: +385 kcal, more fat, less protein, no change in carbs)
// Greer, Goldstein and Walker 2013, Nat Commun 4:2259, doi 10.1038/ncomms3259 (frontal and insular cortex down, amygdala up, more desire for high-calorie food)
// Fullagar et al. 2015, Sports Med 45:161, doi 10.1007/s40279-014-0260-0 (review: some maximal efforts hold; sport-specific performance, cognition worse)
// Drake, Roehrs, Shambroom and Roth 2013, J Clin Sleep Med 9:1195, doi 10.5664/jcsm.3170 (400 mg caffeine at 0, 3 and 6 h before bed, each disturbed sleep)
// Ebrahim et al. 2013, Alcohol Clin Exp Res 37:539, doi 10.1111/acer.12006 (review: alcohol shortens sleep onset, disrupts the second half)
// Crispim et al. 2011, J Clin Sleep Med 7:659, doi 10.5664/jcsm.1476 (52 healthy adults: intake near sleep correlated with poorer sleep)
// Stutz, Eiholzer and Spengler 2019, Sports Med 49:269, doi 10.1007/s40279-018-1015-0 (meta-analysis: evening exercise does not harm sleep; vigorous within 1 h of bed may)
// Afaghi, O'Connor and Chow 2007, Am J Clin Nutr 85:426, doi 10.1093/ajcn/85.2.426 (high-GI meal 4 h before bed: sleep onset 9 min against 17.5)
export const SLEEP_PAGE: SituationPage = {
  id: "sleep", name: "A bad night's sleep",
  intro: "A day situation. What a short night does to the day, what causes it, and your case from what the app already knows. Food, training and timing only. Never a condition: with sleep that stays bad, see your doctor.",
  effects: [
    { title: "You eat more, about 385 kcal", text: "After a short night people ate about 385 kcal more the next day, in a review of 11 studies. As more fat and less protein, not as more carbs.", src: "Al Khatib et al. 2017, European Journal of Clinical Nutrition, meta-analysis" },
    { title: "Sweet and salty foods look better", text: "After a night without sleep, the part of the brain that weighs choices is quieter and the part that wants is louder, and people choose more high-calorie food.", src: "Greer, Goldstein and Walker 2013, Nature Communications" },
    { title: "Training feels harder", text: "Some maximal efforts hold up for one night; sport-specific performance, reaction and judgment get worse. An easy session or a walk keeps the habit without the cost.", src: "Fullagar et al. 2015, Sports Medicine, review" },
    { title: "Your numbers do not change", text: "Today's target is today's target. What changes is where the energy sits in the day." },
  ],
  causes: [
    { title: "Coffee after 14:00", text: "400 mg of caffeine, about two large coffees, taken 6 hours before bed disturbed sleep measurably, and people did not notice it.", src: "Drake et al. 2013, Journal of Clinical Sleep Medicine" },
    { title: "A drink in the evening", text: "Alcohol brings sleep on faster and breaks the second half of the night.", src: "Ebrahim et al. 2013, Alcoholism: Clinical and Experimental Research, review" },
    { title: "A late, heavy dinner", text: "Eating close to bedtime goes with poorer sleep in healthy people. A carb meal four hours before bed did the opposite in one study: sleep came faster. So: a heavy late meal, never no carbs at night.", src: "Crispim et al. 2011; Afaghi, O'Connor and Chow 2007" },
    { title: "A hard session late", text: "Evening training does not harm sleep; a hard session ending within an hour of bed may delay it.", src: "Stutz, Eiholzer and Spengler 2019, Sports Medicine, meta-analysis" },
  ],
  loop: { title: "A loop", text: "A short night makes a late snack likely; a late snack makes the next night short. The way out is one evening done at the usual times." },
  when: [
    { verdict: "Helps", when: "Breakfast and lunch with protein and fibre", what: "The plate holds the hunger that a short night brings." },
    { verdict: "Helps", when: "A planned snack in the afternoon", what: "Instead of a craving at 22:30. On Plan, at a time you pick." },
    { verdict: "Watch", when: "Today's training", what: "An easy session or a walk keeps the habit; a hard one can wait a day. Keep it is always open." },
    { verdict: "Hurts", when: "Coffee after 14:00, a drink tonight", what: "Both make the next night short too." },
  ],
  line: "Never a condition, a diagnosis or a treatment. With sleep that stays bad, the line is the same as for any health question: see your doctor.",
  chips: ["Why am I hungrier today?", "What do I eat tonight?", "Should I train today?"],
  sources: "Al Khatib et al. 2017, Eur J Clin Nutr 71:614; Greer, Goldstein and Walker 2013, Nat Commun 4:2259; Fullagar et al. 2015, Sports Med 45:161; Drake et al. 2013, J Clin Sleep Med 9:1195; Ebrahim et al. 2013, Alcohol Clin Exp Res 37:539; Crispim et al. 2011, J Clin Sleep Med 7:659; Stutz, Eiholzer and Spengler 2019, Sports Med 49:269; Afaghi, O'Connor and Chow 2007, Am J Clin Nutr 85:426. Educational, approximate, not medical advice.",
};
export const SITUATION_PAGES: Partial<Record<SituationId, SituationPage>> = { sleep: SLEEP_PAGE };

// ---- search (Milan 13:12: Explorer grew, one bar finds a nutrient, a food, a family, a situation, a claim, a line) ----
export type Hit = { part: Part; kind: "page" | "family" | "member" | "food" | "situation" | "line"; title: string; hint: string; go: { part: Part; family?: string; body?: BodyId; situation?: SituationId; member?: string } };
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
export function buildIndex(extra: { nutrients: { family: string; name: string; members: string[]; foods: string[]; hint: string }[] }): Hit[] {
  const out: Hit[] = [];
  for (const n of extra.nutrients) {
    out.push({ part: "nutrients", kind: "page", title: n.name, hint: n.hint, go: { part: "nutrients", family: n.family } });
    for (const m of n.members) out.push({ part: "nutrients", kind: "member", title: m, hint: `In ${n.name}`, go: { part: "nutrients", family: n.family, member: m } });
    for (const f of n.foods) out.push({ part: "nutrients", kind: "food", title: f, hint: `A food on ${n.name}`, go: { part: "nutrients", family: n.family } });
  }
  for (const b of BODY_FAMILIES) out.push({ part: "body", kind: "family", title: b.name, hint: b.state === "page" ? b.hint : `${b.hint} Its page comes later.`, go: { part: "body", body: b.id } });
  for (const s of SITUATIONS) out.push({ part: "situations", kind: "situation", title: s.name, hint: s.state === "page" ? s.hint : "Its page comes later.", go: { part: "situations", situation: s.id } });
  for (const pg of Object.values(SITUATION_PAGES)) {
    if (!pg) continue;
    for (const l of [...pg.effects, ...pg.causes, pg.loop]) out.push({ part: "situations", kind: "line", title: l.title, hint: `${pg.name}: ${l.text.slice(0, 90)}${l.text.length > 90 ? "…" : ""}`, go: { part: "situations", situation: pg.id } });
    for (const w of pg.when) out.push({ part: "situations", kind: "line", title: w.when, hint: `${pg.name}, ${w.verdict.toLowerCase()}: ${w.what}`, go: { part: "situations", situation: pg.id } });
  }
  return out;
}
// the words typed, each one found in the title or the hint; the title match first, then the hint; at most 12
export function searchIndex(index: Hit[], q: string): Hit[] {
  const words = norm(q).split(/\s+/).filter((w) => w.length >= 2);
  if (!words.length) return [];
  const score = (h: Hit) => { const t = norm(h.title), s = norm(h.hint); let n = 0; for (const w of words) { if (t.includes(w)) n += 3; else if (s.includes(w)) n += 1; else return 0; } return n + (t.startsWith(words[0]) ? 2 : 0); };
  return index.map((h) => ({ h, n: score(h) })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n).slice(0, 12).map((x) => x.h);
}
