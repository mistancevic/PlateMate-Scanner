// DT213 (0.3.74, board Stories172; Coach Milan 2 November 12:03 to 12:17, Go 3 November 18:21): Chef Mealan's script. Every line
// he says, by name, in one place: the screen shows it in his bubble (ChefLine) and voice (VO1) will read the same words. The
// numbers and names are filled in by code. src/chefScript.test.ts checks that no ChefLine is written anywhere but here.
const n = (k: number, one: string, many = `${one}s`) => `${k} ${k === 1 ? one : many}`;
export const CHEF = {
  // ---- the Plate ----
  photoWhose: (from: string) => `${from}. Whose plate is it, and when?`,
  photoNoFoods: () => "I could not find foods on this photo. Take it again, from above with the whole plate in, or add the foods yourself.",
  oneDish: () => "A food here is cooked, so these foods are made together. Is this one dish? Grouped into parts, Fit keeps each part's proportions and the steps go part by part.",
  whatMoment: () => "What kind of moment?",
  plateOldAte: (when: string, plate: string) => `Your plate from ${when}. ${plate}. Did you eat it?`,
  plateOldBeforeCook: (when: string, plate: string) => `Before you cook: your plate from ${when}. ${plate}. Did you eat it?`,
  plateSaveOrClear: (foods: number, ago: string, dish: string) => `Your plate has ${n(foods, "food")}, from ${ago}. ${dish} starts on its own plate. Shall I save yours for later, or clear it?`,
  plateAddOrNew: (foods: number, title: string, what: string, photo: boolean) => `Your plate already has ${n(foods, "food")}${title ? `: ${title}` : ""}. ${what} ${photo ? "Add them to yours, or start a new plate with them?" : "Start a new plate with it, or add it to yours?"}`,
  whereGoes: () => "Where does this go?",
  // ---- cooking ----
  scanWhileCooking: (dish: string, food: string) => `You are cooking ${dish}. Shall I use this ${food} in it, put it on the Plate, or keep it in your foods?`,
  useInCook: (food: string, dish: string) => `${food}: what does it replace in ${dish}, or does it add to it?`,
  handsFree: () => "Cook hands free?",
  whoMadePhoto: () => "Who made it?",
  howCooking: () => "How did the cooking go?",
  resume: (dish: string, done: string) => `You were cooking ${dish}${done ? `: ${done}` : ""}. Go on where you left off?`,
  // ---- eating ----
  howMuchAte: () => "Enjoy it. How much did you eat?",
  howManyAte: (made: string) => `You made ${made}. How many did you eat?`,
  howTaste: () => "And how did it taste?",
  didTryWork: (kind: "change" | "side") => (kind === "change" ? "Did the swap work?" : "Did the side work?"),
  remember: () => "Anything you want to remember about it?",
  carryLater: () => "About 30 minutes on: how did it carry you?",
  carryNow: (min: number) => `How did it carry you? Answer now, or in ${n(min, "minute")}, when I ask.`,
  // ---- the day ----
  whichMeal: () => "Which meal is it?",
  whatDay: () => "What kind of day is it?",
  busyMeal: (meal: string, time: string, block: string, day: string) => `${meal} at ${time} is in a busy block, ${block}. Move it for ${day}?`,
  busyLate: (until: string, meal: string, time: string, free: number, quick: string, aheadDay: string | null) => `Busy until ${until}. ${meal} at ${time} leaves ${free ? `${free} minutes` : "no time"} to cook. A quick ${quick}${aheadDay ? `, or cook on ${aheadDay} and warm it up` : ""}?`,
  busyCarry: (block: string, meal: string) => `Booked from ${block}. Take ${meal} along?`,
  busyTraining: (time: string, block: string, day: string) => `Training at ${time} is in a busy block, ${block}. Move it for ${day}?`,
} as const;
export type ChefLineName = keyof typeof CHEF;
// one of his lines, by name: say("howCooking"), say("carryNow", 12)
export function say<K extends ChefLineName>(k: K, ...a: Parameters<(typeof CHEF)[K]>): string {
  return (CHEF[k] as (...x: unknown[]) => string)(...a);
}
