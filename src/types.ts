export interface ScanResult {
  success?: boolean;
  calories: number;
  protein: number;
  fats: number;
  carbs: number;
  fiber: number;
  brand?: string;
  product_name?: string;
  barcode?: string;
  error_reason?: string;
}

export interface Threshold {
  high: number;
  mod: number;
}

export type Level = 'High' | 'Moderate' | 'Low';

export interface CalculatedMetrics {
  xp: number;
  xpLevel: Level;
  xf: number;
  xfLevel: Level;
  xc: number;
  xcLevel: Level;
  xfi: number;
  xfiLevel: Level;
  mealanString: string;
}

export interface ProfileThresholds {
  XP: Threshold;
  XF: Threshold;
  XC: Threshold;
  XFi: Threshold;
}

export interface Profile {
  id: string;
  name: string;
  thresholds: ProfileThresholds;
}

export type ScannerMode = 'barcode' | 'label' | 'group';

export interface MealCartItem {
  id: string;
  brand: string;
  product_name: string;
  weight?: number; // portion size in grams, default 100
  isMissingData?: boolean;
  calories?: number;
  protein?: number;
  fats?: number;
  carbs?: number;
  fiber?: number;
  xp?: number;
  xf?: number;
  xc?: number;
  xfi?: number;
  mealanString?: string;
  rawRecord?: any;
}

export interface PlateMacros {
  totalCalories: number;
  totalProtein: number;
  totalFats: number;
  totalCarbs: number;
  totalFiber: number;
  totalWeight: number;
  aggregateXp: number;
  aggregateXf: number;
  aggregateXc: number;
  aggregateXfi: number;
  xpLevel: 'High' | 'Moderate' | 'Low';
  xfLevel: 'High' | 'Moderate' | 'Low';
  xcLevel: 'High' | 'Moderate' | 'Low';
  xfiLevel: 'High' | 'Moderate' | 'Low';
  confirmedCount: number;
}

export type AppView = 'home' | 'camera' | 'scanning' | 'hud' | 'details';

export interface AppState {
  view: AppView;
  isSidebarOpen: boolean;
  activeProfileId: string;
  scanData: ScanResult | null;
  imageUrl: string | null;
  error: string | null;
  isSaving?: boolean;
  saveSuccess?: boolean;
  saveError?: string | null;
  scannerMode?: ScannerMode;
  mealCart: MealCartItem[];
  isCartOpen?: boolean;
  targetMissingItemId?: string | null;
}
