import React from 'react';
import { X, Check, RefreshCw, AlertCircle, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';
import type { ScanResult, CalculatedMetrics, Level, Profile } from '../types';
import { getColorForLevel, getBgForLevel } from '../profiles';

interface DetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  scanData: ScanResult;
  metrics: CalculatedMetrics;
  activeProfile: Profile;
  targetMissingItemName?: string | null;
  onUpdateBrand: (brand: string) => void;
  onUpdateProductName: (name: string) => void;
  onSave: () => void;
  isSaving: boolean;
  saveSuccess: boolean;
  saveError: string | null;
  onAddToCart: () => void;
  onStartNextScan: () => void;
}

export function DetailsModal({
  isOpen,
  onClose,
  scanData,
  metrics,
  activeProfile,
  targetMissingItemName,
  onUpdateBrand,
  onUpdateProductName,
  onSave,
  isSaving,
  saveSuccess,
  saveError,
  onAddToCart,
  onStartNextScan,
}: DetailsModalProps) {
  if (!isOpen) return null;

  const t = activeProfile.thresholds;

  const renderMacroRow = (
    macroName: string,
    id: string,
    score: number,
    level: Level,
    grams: number,
    thresholdHigh: number
  ) => {
    const colorClass = getColorForLevel(level);
    const bgClass = getBgForLevel(level);
    const progressPct = Math.min((score / (thresholdHigh * 1.5)) * 100, 100);

    return (
      <div className="mb-4 flex flex-col w-full last:mb-1">
        <div className="flex justify-between items-start mb-1.5">
          <div className="flex flex-col">
            <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold">
              {macroName} Density ({id}):
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className={`text-2xl font-bold tracking-tight ${colorClass}`}>
                {score.toFixed(1)}
              </span>
              <span className={`text-xs font-medium ${colorClass}`}>{level}</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-lg font-semibold text-neutral-100">
              {Number(grams || 0).toFixed(1)}g
            </span>
            <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider mt-0.5">
              per 100g
            </span>
          </div>
        </div>
        <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${bgClass} rounded-full transition-all duration-1000 ease-out`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        className="bg-neutral-900 border border-neutral-800 rounded-[2rem] w-full max-w-md max-h-[95vh] flex flex-col shadow-2xl relative overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 bg-neutral-800/80 hover:bg-neutral-700 rounded-full text-neutral-300 transition-colors z-20 backdrop-blur-sm"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="pt-6 px-4 pb-4 border-b border-neutral-800 text-center relative z-10 bg-neutral-900">
          <h3 className="text-base font-semibold text-neutral-50 mb-3">Nutrition Density Profile</h3>

          {targetMissingItemName && (
            <div className="mb-3 p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-left flex items-center gap-2 text-xs text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                Updating missing item in Meal Cart: <strong>{targetMissingItemName}</strong>
              </span>
            </div>
          )}

          <div className="flex flex-col gap-2 mb-4 text-left">
            <input
              type="text"
              value={scanData.brand || ''}
              onChange={(e) => onUpdateBrand(e.target.value)}
              placeholder="Brand (e.g. Optimum Nutrition)"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors shadow-inner"
            />
            <input
              type="text"
              value={scanData.product_name || ''}
              onChange={(e) => onUpdateProductName(e.target.value)}
              placeholder="Product Name (e.g. Gold Standard Whey)"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors shadow-inner"
            />
          </div>

          <div className="inline-block px-3 py-1.5 rounded-full bg-neutral-950 border border-neutral-800 text-neutral-300 font-mono tracking-widest text-xs shadow-inner whitespace-nowrap">
            {metrics.mealanString}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {renderMacroRow('Protein', 'XP', metrics.xp, metrics.xpLevel, scanData.protein, t.XP.high)}
          {renderMacroRow('Fats', 'XF', metrics.xf, metrics.xfLevel, scanData.fats, t.XF.high)}
          {renderMacroRow('Carbs', 'XC', metrics.xc, metrics.xcLevel, scanData.carbs, t.XC.high)}
          {renderMacroRow('Fiber', 'XFi', metrics.xfi, metrics.xfiLevel, scanData.fiber, t.XFi.high)}
        </div>

        <div className="p-4 border-t border-neutral-800 bg-neutral-900 flex flex-col gap-2.5 shrink-0 relative">
          {saveError && (
            <div className="mb-1 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium px-4 py-3 rounded-xl flex items-center gap-3 backdrop-blur-md">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Single Save Meal button with unified conditional loading state */}
          <button
            id="details-save-button"
            onClick={onSave}
            disabled={isSaving || saveSuccess}
            className={`w-full py-3 rounded-2xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center ${
              saveSuccess
                ? 'bg-[#39ff14] text-black shadow-[0_0_20px_rgba(57,255,20,0.3)]'
                : 'bg-neutral-50 text-neutral-950 hover:bg-neutral-200'
            }`}
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                Saved!
              </>
            ) : targetMissingItemName ? (
              'Save & Update in Cart'
            ) : (
              'Save Meal'
            )}
          </button>

          <button
            id="details-add-to-cart-button"
            onClick={onAddToCart}
            className="w-full py-3 rounded-2xl bg-neutral-900 border border-neutral-700 text-neutral-200 font-bold hover:bg-neutral-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4 text-[#39ff14]" />
            Add to Meal Cart (100g)
          </button>

          <button
            id="details-next-scan-button"
            onClick={onStartNextScan}
            disabled={isSaving || saveSuccess}
            className="w-full py-3 rounded-2xl bg-transparent border border-neutral-700 text-neutral-300 font-medium hover:bg-neutral-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            Start Next Scan
          </button>
        </div>
      </motion.div>
    </div>
  );
}
