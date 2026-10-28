import type { Dispatch, SetStateAction, ReactNode, RefObject } from "react";
import type { Food, Ingredient, Meal, PilotState, Feedback } from "../pilot";
import type { ScannerMode } from "../types";

export type Tab = "home" | "journey" | "plan" | "me" | "clients" | "meal" | "chef" | "foods" | "recipes" | "notes" | "more";
export type PlateAsk = { kind: "photo" | "recipe" | "slot"; what: string; image?: string; apply: (how: "add" | "new") => void };
export type MenuSection = "list" | "me" | "profile" | "goal" | "life" | "week" | "shop" | "coach" | "account" | "support" | "about" | "evals" | "metrics" | "costs" | "share";
// the slot a plate is made for (0.2.2): the date, the slot and its name and time, for the line on the Plate
// mode: "plan" fills the slot on Put it in; "eat" (from Today) records the meal for the slot on Save
export type Filling = { date: string; slotId: string; name: string; time: string; dayName: string; mealId?: string; mode?: "plan" | "eat" };
export type Step = "in" | "recipe" | "make" | "made" | "after";

export interface AppApi {
  state: PilotState;
  setState: Dispatch<SetStateAction<PilotState>>;
  setTab: (t: Tab) => void;
  foodsView: "foods" | "recipes";
  setFoodsView: (v: "foods" | "recipes") => void;
  setCamera: (v: boolean) => void;
  setMode: (m: ScannerMode) => void;
  blank: (name?: string, brand?: string, from?: string, barcode?: string) => void;
  setEditFrom: (from: string) => void;
  review: import("../cloud").NumbersReview | null;
  coachLabel: string;
  sendReview: (kept: import("../cloud").ReviewFinding[], summary: string, reply?: string) => Promise<void>;
  answerClientReview: (clientUid: string, status: "approved" | "change", note: string, prev: import("../cloud").NumbersReview) => Promise<void>;
  addFromDatabase: (code: string) => void;
  searchDatabase: (q: string) => Promise<DbProduct[]>;
  peekBarcode: (code: string) => Promise<DbProduct | null>;
  // DT115 (0.2.97): the members' catalogue
  readMealPhoto: (image: string, x?: { at?: string; who?: "ate" | "now" | "idea" }) => Promise<boolean>;
  ateNow: (meal: Meal, slot: Feedback["slot"] | null, x: { photo?: string | null; half?: boolean; at?: string; portions?: number }) => void;
  // DT130 (0.2.110): Photo of my meal opens the meal camera; a photo from Your photos waits on the Plate for whose and when
  mealCamera: () => void;
  // DT131 (0.2.113): foods waiting to land on a plate that has foods; null when nothing waits
  plateAsk: PlateAsk | null;
  answerPlateAsk: (how: "add" | "new" | null) => void;
  photoAsk: { image: string; at: string } | null;
  dropPhotoAsk: () => void;
  // DT130: An idea kept: in Mine with the photo as its picture, at the top until made once; a slot in the plan when given
  saveIdea: (meal: Meal, photo: string | null, slot?: { date: string; slotId: string } | null) => void;
  memberFoods: (q: string) => Promise<import("../memberFoods").MemberFood[]>;
  addMemberFood: (m: import("../memberFoods").MemberFood, to?: "foods" | "plate") => void;
  add: (f: Food) => void;
  updateItem: (id: string, patch: Partial<Ingredient>) => void;
  saveMeal: () => void;
  mix: (id?: string) => boolean;
  mixWith: (items: Ingredient[], id: string) => boolean;
  step: Step;
  setStep: (s: Step) => void;
  personalize: () => Promise<void>;
  lookup: (code?: string) => Promise<void>;
  exportData: () => void;
  notify: (s: string) => void;
  setError: (s: string) => void;
  setBusy: (s: string) => void;
  api: (url: string, body?: unknown) => Promise<any>;
  setImage: (s: string) => void;
  setEdit: (f: Food | null) => void;
  setGoalsOpen: (v: boolean) => void;
  setAccessOpen: (v: boolean) => void;
  setReviewMeal: (m: Meal | null) => void;
  setFeedback: (f: { status: Feedback["status"]; taste: string; notes: string }) => void;
  setAdjustId: (s: string) => void;
  adjustId: string;
  limits: { maxWeight: string; minProtein: string; maxKcal: string };
  setLimits: (l: { maxWeight: string; minProtein: string; maxKcal: string }) => void;
  options: { food: Food; items: Ingredient[]; grams: number; explanation?: string }[];
  pending: { name: string; brand: string; values?: any }[];
  setPending: Dispatch<SetStateAction<{ name: string; brand: string }[]>>;
  barcode: string;
  setBarcode: (s: string) => void;
  query: string;
  setQuery: (s: string) => void;
  busy: string;
  services: { ai: boolean; airtable: boolean } | null;
  totals: ReturnType<typeof import("../pilot").aggregate>;
  pdRef: number | null;
  dayPd: number | null;
  // the kind of plate, from Today's What's cooking? or the Plate's own row; a saved recipe keeps it
  kind: import("../pilot").PlateKind;
  setKind: (k: import("../pilot").PlateKind) => void;
  // R22 (0.2.50, board RS21): What is it? Savoury, Sweet as a DaaM (Dessert as a Meal), or Both; null: not picked, all offered
  plateTaste: import("../dishTaste").PlateTaste | null;
  setPlateTaste: (t: import("../dishTaste").PlateTaste | null) => void;
  moment: import("../moments").MomentId;
  setMoment: (m: import("../moments").MomentId) => void;
  // R11 (0.2.37): what the plate is for: null (the meal by the clock), "exploring", "snack" or "meal:<slot id>"
  pick: string | null;
  setPick: (v: string | null) => void;
  usual: import("../moments").RhythmId[];
  setUsual: (ids: import("../moments").RhythmId[]) => void;
  region: import("../moments").RegionId | null;
  setRegion: (r: import("../moments").RegionId) => void;
  travelTo: import("../moments").RegionId | null;
  inbox: import("../cloud").InboxItem[];
  takeRecipe: (item: import("../cloud").InboxItem, how: "make" | "keep") => Promise<void>;
  dismissRecipe: (item: import("../cloud").InboxItem) => Promise<void>;
  personal: import("../personal").Personal;
  setPersonal: (p: import("../personal").Personal) => void;
  applyNumbers: (bandId: string, kcal: number, protein: number, method?: string, fats?: number, carbs?: number) => void;
  todayMacros: { kcal: number; protein: number; fats: number; carbs: number } | null;
  // the numbers of any day, for Plan (0.2.1)
  // DT135 (0.2.116): the open meal's size, in meals of three a day (1 to 3); Add's normal portion grows with it
  setMealScale?: (x: number) => void;
  // DT136 (0.2.120): foods by place (src/places.ts)
  placesActive: Set<string>;
  inPlace: (f: Food) => boolean;
  placesOn: string[];
  trip: import("../places").Trip | null;
  herePlace: string | null;
  setPlaceOn: (place: string, on: boolean, starter?: boolean) => void;
  makeHome: (place: string) => void;
  unusedOf: (place: string) => Food[];
  deleteUnused: (place: string) => void;
  setTrip: (t: import("../places").Trip | null) => void;
  setFoodPlaces: (id: string, places: string[]) => void;
  numbersFor: (date: Date) => { kcal: number; protein: number; fats: number; carbs: number } | null;
  proteinRange: { min: number; max: number } | null;   // DT75: the person's protein range for a day, in g
  // 0.2.5+r20 (canvas board FX, G1b and G2): apply a goal from a date; today applies now, a later date waits on Goal
  applyGoal: (x: Omit<import("../personal").NextGoal, "from" | "at">, from: string) => void;
  // 0.2.7 (board FT): the first two weeks and the measured burn; null for anyone who sees no weigh-ins
  measured: import("../measured").Measured | null;
  formulaKcal: number | null;            // what the formula says to stay the same, the week's average
  measuredSeen: boolean;                 // the day-14 card on Today was taken away
  seeMeasured: () => void;
  useMyData: () => void;                 // opens the calculator with From your data picked
  calcFormula: import("../personal").Formula | null;
  cancelNextGoal: () => void;
  // 0.2.6 (canvas board CW, CW5 and CW6): the coach's notes, the check-in day, Got it and Reply
  coachNotes: import("../coachNotes").CoachNote[];
  checkinDay: number;
  gotNote: (at: string) => void;
  replyToCoach: (text: string, read?: string) => void;
  // the slots' meals (0.2.2)
  planned: import("../planned").Planned;
  renameMeal: (id: string, title: string) => void;
  renamePlate: (title: string) => void;
  // Recipes, Open (0.2.3): the recipe on the Plate with its name as the title, nothing decided yet
  openOnPlate: (meal: Meal) => void;
  // after How was it (0.2.23, IM23c): open a recipe on Recipes with one line for today
  landing: { id: string; line: string; title?: string; quiet?: boolean; back?: "recipes"; from?: MealFrom } | null;
  // R19 (0.2.47): a meal opened from Today or Plan, with the slot it is planned for
  openMeal: (id: string, from: MealFrom) => void;
  clearLanding: () => void;
  // R8 (0.2.31): the recipe named by the address, /my-recipes/<id>
  openFromPath: string | null;
  clearOpenFromPath: () => void;
  // R8, choice A: counts taps on the Recipes tab while it shows; each one goes to the list
  recipesHome: number;
  landOnRecipe: (id: string, line: string, title?: string, back?: "recipes") => void;
  // R5 (0.2.42): Today opens the recipe a meal came from, with no line
  openRecipePage: (id: string) => void;
  // Chef Mealan's pictures (0.2.18, board IM, IM11): the day's count, the recipe being drawn, Draw a picture
  cover: { count: { used: number; limit: number } | null; drawing: string | null; draw: (meal: Meal) => void; refresh: () => void };
  fill: (date: string, slotId: string, meal: import("../planned").PlannedMeal | null) => void;
  filling: Filling | null;
  setFilling: (f: Filling | null) => void;
  fillOnPlate: (f: Filling, meal?: Meal | null, title?: string) => void;
  goalLog: import("../goal").GoalEntry[];
  addFoodPhoto: (foodId: string, dataUrl: string) => Promise<void>;
  saveFood: (f: import("../pilot").Food) => void;
  openFoodId: string | null;
  openFood: (id: string) => void;
  clearOpenFood: () => void;
  toggleFavorite: (foodId: string) => void;
  keepForLater: (meal: Meal, extra?: { photos?: string[]; prep?: Feedback["prep"]; status?: "prepared" | "not-used"; left?: number; leftOf?: string; recipeId?: string }) => void;
  settleCard: (id: string, how: "eaten" | "not-used", as?: { slot?: Feedback["slot"]; which?: string }) => void;
  setFoodJob: (foodId: string, job: string | null) => void;
  eatenTodayKcal: number;
  dayName: string;
  tipGoalKey: string;
  requestTip: (foodId: string) => Promise<void>;
  removeFoodPhoto: (foodId: string, index: number) => void;
  setMainPhoto: (foodId: string, index: number) => void;
  mergeInLibrary: (keepId: string, otherId: string, name: string) => void;
  todayKcal: number | null;
  dayType: import("../personal").DayType;
  day: import("../personal").Day;
  setTodayPlan: (d: import("../plan").PlanDay | null) => void;
  setDated: (date: Date, d: import("../plan").PlanDay | null) => void;
  setDayType: (d: import("../personal").DayType) => void;
  formula: import("../personal").Formula | null;
  openMenu: (s?: MenuSection, from?: MenuSection) => void;
  newShared: number;
  markSharedSeen: () => void;
  setTravelTo: (r: import("../moments").RegionId | null) => void;
  matched: boolean;
  mealanCard: ReactNode;
  importRef: RefObject<HTMLInputElement | null>;
  goal: import("../goal").Goal | null;
  openGoal: () => void;
  // the chat knows the screen (0.2.4); "fill" opens it with the day filled
  openOut: (ask?: "fill" | "plate" | "around") => void;
  // Where does this go (0.2.5): Scan from Today, then the sheet with the saved food
  scanFromToday: () => void;
  openScan: () => void; // DT106: Scan it from a chat row
  where: Food | null;
  setWhere: (f: Food | null) => void;
  closeOut: () => void;
  mealanAsk: number;
  mealanAsked: () => void;
  // the mix tip on a food card: code decides, the plate takes it, the helper hears what was wrong
  mixFor: (food: import("../pilot").Food) => import("../mixtip").MixTip;
  takeMix: (food: import("../pilot").Food, mix: import("../mixtip").Mix) => void;
  askAboutMix: (food: import("../pilot").Food, tip: import("../mixtip").MixTip) => void;
  mixQuestion: string | null;
  mixQuestionTaken: () => void;
  recordTalk: (q: string, reply: string, plate: string[]) => void;
  shareCard: (id: string, reason: "look" | "ok" | "help") => void;
  saveCardAsRecipe: (id: string) => void;
  // the photo ask on a meal card when the recipe's cover is drawn (0.2.11, board CO, CO1b, CO1c)
  setCardPhoto: (id: string, data: string) => void;
  setCoverAsk: (id: string, v: "later" | "kept" | "used") => void;
  useCardAsCover: (cardId: string, recipeId: string) => void;
  // Members (0.2.11, board CO, CO2 to CO4b): a member's recipe on the plate at your portion, or kept in Mine
  takeMember: (r: import("../members").SharedRecipe, how: "make" | "keep", portion?: import("../pilot").Ingredient[]) => void;
  setCarry: (id: string, how: "light" | "fine" | "heavy", moment?: import("../carry").CarryMoment) => void;
  user: import("../cloud").CloudUser | null;
  cloudEnabled: boolean;
  cloudStatus: { ok: boolean; text: string; at?: string };
  profile: { role?: "coach"; coachId?: string; coachName?: string; coachEmail?: string; coachPhoto?: string; joinedAt?: string; coachSetAt?: string; formula?: import("../personal").Formula | null };
  joinCoach: (code: string) => Promise<void>;
  leaveCoach: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  // safety rules: the person's declarations, the AI switch, what the coach can confirm
  safety: import("../safety").Safety;
  ai: import("../safety").AiState;
  declareSafety: (patch: Partial<import("../safety").Safety>, record?: boolean) => void;
  flagFromModel: (situation: import("../safety").SituationId) => void;
  exportMyData: () => Promise<void>;
  deleteSteps: string;
  confirmClientAi: (clientUid: string, on: boolean) => Promise<void>;
  addStarter: () => void;
  importAirtable: () => Promise<void>;
  resetGoal: () => void;
  fitPd: (pd: number | null) => import("../goal").PdBand;
  rates: import("../letters").Rates | null; // DT108: the day's rates for the four letters, F C Fi P
  // R16 (0.2.44): I ate it on Today, for the next slot's planned meal
  logPlanned: (m: import("../planned").PlannedMeal, slot: NonNullable<import("../pilot").Feedback["slot"]>) => void;
  fitDay: (pd: number | null) => import("../goal").PdBand;
  clientName: string;
  setClientName: (v: string) => void;
  coach: boolean;
  setCoach: (v: boolean) => void;
  filter: "all" | import("../goal").PdBand;
  setFilter: (f: "all" | import("../goal").PdBand) => void;
}

export type DbProduct = { code: string; name: string; brand: string; quantity: string; kcal: number | null; protein: number | null };
// R19 (0.2.47, board RS18): where a meal's page was opened from, and the slot it is planned for
export type MealFrom = { tab: "home" | "plan"; slot?: { date: string; slotId: string; name: string; time: string } };
