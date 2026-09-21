import React, { useMemo } from 'react';
import { X, Check, AlertCircle, ScanBarcode, Trash2, Layers, ShoppingBag, Scale, Utensils } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { MealCartItem, Profile } from '../types';
import { calculatePlateMacros, getColorForLevel } from '../profiles';

interface MealCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: MealCartItem[];
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onScanMissingItem: (item: MealCartItem) => void;
  onOpenGroupScan: () => void;
  onUpdateItemWeight: (index: number, newWeight: number) => void;
  activeProfile: Profile;
}

export function MealCartModal({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onClearCart,
  onScanMissingItem,
  onOpenGroupScan,
  onUpdateItemWeight,
  activeProfile,
}: MealCartModalProps) {
  if (!isOpen) return null;

  const matchedCount = items.filter(i => !i.isMissingData).length;
  const missingCount = items.filter(i => i.isMissingData).length;

  // Compute aggregate plate macros dynamically from current items and portion weights
  const plateMacros = useMemo(() => {
    return calculatePlateMacros(items, activeProfile);
  }, [items, activeProfile]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.35, bounce: 0.1 }}
          className="relative w-full max-w-lg max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-[#39ff14]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
                  Meal Cart & Plate
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </span>
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Adjust ingredient portions to compute aggregate recipe macros
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-100 bg-neutral-800/60 hover:bg-neutral-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subheader / Status Summary */}
          {items.length > 0 && (
            <div className="px-5 sm:px-6 py-2.5 bg-neutral-950/60 border-b border-neutral-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-neutral-300">
                  <span className="w-2 h-2 rounded-full bg-[#39ff14]" />
                  <strong className="text-neutral-100">{matchedCount}</strong> Confirmed
                </span>
                {missingCount > 0 && (
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <strong>{missingCount}</strong> Needs Scan
                  </span>
                )}
              </div>

              <button
                onClick={onClearCart}
                className="text-neutral-500 hover:text-red-400 transition-colors font-medium text-xs"
              >
                Clear Cart
              </button>
            </div>
          )}

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
            {items.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-3xl bg-neutral-800/60 border border-neutral-700/60 flex items-center justify-center mb-4 text-neutral-500">
                  <Layers className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-neutral-200 mb-1">Your Meal Cart is Empty</h3>
                <p className="text-xs text-neutral-400 max-w-[270px] leading-relaxed mb-6">
                  Add items from scans or switch to <strong className="text-neutral-300">Group</strong> mode to extract multiple food products at once.
                </p>
                <button
                  onClick={onOpenGroupScan}
                  className="px-5 py-2.5 bg-neutral-100 hover:bg-white text-neutral-950 rounded-2xl text-xs font-bold transition-all shadow-lg flex items-center gap-2"
                >
                  <Layers className="w-4 h-4" />
                  Launch Group Scanner
                </button>
              </div>
            ) : (
              items.map((item, index) => {
                const isMatched = !item.isMissingData;
                const currentWeight = typeof item.weight === 'number' && !isNaN(item.weight) ? item.weight : 100;
                const portionRatio = currentWeight / 100;

                const scaledCalories = isMatched && item.calories !== undefined 
                  ? (Number(item.calories) * portionRatio)
                  : 0;
                const scaledProtein = isMatched && item.protein !== undefined 
                  ? (Number(item.protein) * portionRatio)
                  : 0;
                const scaledFats = isMatched && item.fats !== undefined 
                  ? (Number(item.fats) * portionRatio)
                  : 0;
                const scaledCarbs = isMatched && item.carbs !== undefined 
                  ? (Number(item.carbs) * portionRatio)
                  : 0;

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isMatched
                        ? 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700'
                        : 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Left status badge & details */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="mt-0.5 shrink-0">
                          {isMatched ? (
                            <div className="w-6 h-6 rounded-full bg-[#39ff14]/20 border border-[#39ff14]/40 flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 text-[#39ff14]" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block truncate">
                            {item.brand || 'Unknown Brand'}
                          </span>
                          <h4 className="text-sm font-semibold text-neutral-100 truncate">
                            {item.product_name || 'Food Product'}
                          </h4>

                          {isMatched ? (
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-300">
                              <span className="bg-neutral-900 px-2 py-0.5 rounded-md border border-neutral-800 font-semibold text-neutral-100">
                                {scaledCalories.toFixed(0)} kcal
                              </span>
                              <span className="bg-neutral-900 px-2 py-0.5 rounded-md border border-neutral-800 text-blue-400 font-medium">
                                P: {scaledProtein.toFixed(1)}g
                              </span>
                              <span className="bg-neutral-900 px-2 py-0.5 rounded-md border border-neutral-800 text-yellow-400 font-medium">
                                F: {scaledFats.toFixed(1)}g
                              </span>
                              <span className="bg-neutral-900 px-2 py-0.5 rounded-md border border-neutral-800 text-orange-400 font-medium">
                                C: {scaledCarbs.toFixed(1)}g
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-amber-400/90 font-medium mt-0.5 block">
                              Missing nutrition data in Airtable
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: XP badge or Delete button */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isMatched && item.xp !== undefined && (
                          <div className="px-2 py-1 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center gap-1 shadow-sm">
                            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">XP</span>
                            <span className="text-xs font-black text-[#39ff14]">{item.xp}</span>
                          </div>
                        )}

                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-800/80 rounded-lg transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Portion Modifier for Confirmed items */}
                    {isMatched && (
                      <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                          <Scale className="w-3.5 h-3.5 text-neutral-500" />
                          <span className="font-medium">Portion:</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              min="1"
                              max="9999"
                              step="5"
                              value={currentWeight || ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                onUpdateItemWeight(index, isNaN(val) ? 0 : val);
                              }}
                              className="w-20 bg-neutral-900 border border-neutral-700/80 focus:border-[#39ff14] rounded-xl px-2.5 py-1 text-right text-xs font-bold text-neutral-100 focus:outline-none transition-colors"
                              placeholder="100"
                            />
                            <span className="ml-1.5 text-xs font-bold text-neutral-400">g</span>
                          </div>

                          {/* Quick modifier presets */}
                          <div className="flex items-center gap-1">
                            {[50, 100, 150, 200].map(preset => (
                              <button
                                key={preset}
                                onClick={() => onUpdateItemWeight(index, preset)}
                                className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
                                  currentWeight === preset
                                    ? 'bg-neutral-800 text-[#39ff14] border border-[#39ff14]/30'
                                    : 'bg-neutral-900 text-neutral-500 hover:text-neutral-300 border border-neutral-800'
                                }`}
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Button for missing data */}
                    {!isMatched && (
                      <div className="mt-3 pt-2.5 border-t border-amber-500/20">
                        <button
                          onClick={() => onScanMissingItem(item)}
                          className="w-full py-2.5 px-4 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-sm"
                        >
                          <ScanBarcode className="w-4 h-4" />
                          Scan Barcode/Label to Add
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Sticky Footer: Total Plate Summary */}
          <div className="border-t border-neutral-800 bg-neutral-950 px-5 py-4 shadow-xl z-10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-[#39ff14]" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Total Plate Summary
                </span>
                <span className="text-[10px] text-neutral-500 font-medium">
                  ({activeProfile.name})
                </span>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-neutral-100">
                  {plateMacros.totalCalories}
                </span>
                <span className="text-xs font-medium text-neutral-400">kcal</span>
                <span className="text-xs text-neutral-500 ml-1">
                  • {plateMacros.totalWeight}g
                </span>
              </div>
            </div>

            {/* Aggregate Scores Row with Dynamic Color Coding based on Profile Thresholds */}
            {plateMacros.confirmedCount > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {/* Aggregate XP */}
                <div className="p-2.5 rounded-2xl bg-neutral-900 border border-neutral-800/80 flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">XP (Protein)</span>
                    <span className={`text-[10px] font-extrabold ${getColorForLevel(plateMacros.xpLevel)}`}>
                      {plateMacros.xpLevel}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className={`text-xl font-black ${getColorForLevel(plateMacros.xpLevel)}`}>
                      {plateMacros.aggregateXp.toFixed(1)}
                    </span>
                    <span className="text-[11px] font-semibold text-neutral-400">
                      {plateMacros.totalProtein}g
                    </span>
                  </div>
                </div>

                {/* Aggregate XF */}
                <div className="p-2.5 rounded-2xl bg-neutral-900 border border-neutral-800/80 flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">XF (Fats)</span>
                    <span className={`text-[10px] font-extrabold ${getColorForLevel(plateMacros.xfLevel)}`}>
                      {plateMacros.xfLevel}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className={`text-xl font-black ${getColorForLevel(plateMacros.xfLevel)}`}>
                      {plateMacros.aggregateXf.toFixed(1)}
                    </span>
                    <span className="text-[11px] font-semibold text-neutral-400">
                      {plateMacros.totalFats}g
                    </span>
                  </div>
                </div>

                {/* Aggregate XC */}
                <div className="p-2.5 rounded-2xl bg-neutral-900 border border-neutral-800/80 flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">XC (Carbs)</span>
                    <span className={`text-[10px] font-extrabold ${getColorForLevel(plateMacros.xcLevel)}`}>
                      {plateMacros.xcLevel}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className={`text-xl font-black ${getColorForLevel(plateMacros.xcLevel)}`}>
                      {plateMacros.aggregateXc.toFixed(1)}
                    </span>
                    <span className="text-[11px] font-semibold text-neutral-400">
                      {plateMacros.totalCarbs}g
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl text-center text-xs text-neutral-400">
                {missingCount > 0 
                  ? 'Scan missing items above to compute complete recipe plate scores.'
                  : 'Add ingredients to see real-time aggregate plate macros.'}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={onOpenGroupScan}
                className="flex-1 py-3 px-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Layers className="w-4 h-4" />
                Scan More Items
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-2xl bg-neutral-100 hover:bg-white text-neutral-950 font-bold text-xs transition-all shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
