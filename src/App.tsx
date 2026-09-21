import { useState, useRef, useEffect, useMemo, ChangeEvent } from 'react';
import { Camera, Menu, X, RefreshCw, AlertCircle, ScanLine, UserCircle, Check, Image as ImageIcon, ShoppingBag, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { ScanResult, AppState, MealCartItem, ScannerMode } from './types';
import { PROFILES, calculateScore, getLevel, getMealanChar, Level } from './profiles';
import { CameraView } from './components/CameraView';
import { MealCartModal } from './components/MealCartModal';
import { DetailsModal } from './components/DetailsModal';

import { resizeImageBase64 } from './utils/image';

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('nutrition-scanner-v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Reset volatile view state on fresh load
        return {
          ...parsed,
          view: parsed.scanData ? 'hud' : 'home',
          isSidebarOpen: false,
          error: null,
          mealCart: parsed.mealCart || [],
          scannerMode: parsed.scannerMode || 'label',
          isCartOpen: false,
          targetMissingItemId: null,
        };
      } catch (e) {}
    }
    return {
      view: 'home',
      isSidebarOpen: false,
      activeProfileId: 'p1',
      scanData: null,
      imageUrl: null,
      error: null,
      scannerMode: 'label',
      mealCart: [],
      isCartOpen: false,
      targetMissingItemId: null,
    };
  });

  const activeProfile = PROFILES.find(p => p.id === state.activeProfileId) || PROFILES[0];
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(current => (current === msg ? null : current));
    }, 4500);
  };

  const processGroupScan = async (rawImagesInput: string[] | string) => {
    setState(prev => ({
      ...prev,
      view: 'scanning',
      error: null,
      scanData: null,
      imageUrl: null,
      isSidebarOpen: false,
    }));

    try {
      const rawImages = Array.isArray(rawImagesInput) ? rawImagesInput : [rawImagesInput];
      if (rawImages.length === 0) {
        throw new Error('No images provided for group scan');
      }

      const resizedImages = await Promise.all(
        rawImages.map(img => resizeImageBase64(img))
      );

      setState(prev => ({ ...prev, imageUrl: resizedImages[0] }));

      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          images: resizedImages,
          imageBase64: resizedImages[0], 
          mode: 'group',
          prompt: "You are a strict food packaging identifier. Look at these multiple angles of the same group of items. Extract ONLY the Brand Name and Product Name for each distinct item. STRICTLY IGNORE marketing slogans. Return ONLY a JSON array of objects with 'brand' and 'product_name' keys."
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to extract group items');
      }

      const rawResponse = await response.json();
      const parsedEntities: Array<{ brand?: string; product_name?: string }> = Array.isArray(rawResponse) 
        ? rawResponse 
        : (rawResponse.entities || []);

      const validEntities = parsedEntities.filter(
        item => item.brand && item.brand.trim() !== '' && item.product_name && item.product_name.trim() !== ''
      );

      if (!validEntities || validEntities.length === 0) {
        showToast("Ingredients not found in database. Please scan barcodes or labels individually.");
        setState(prev => ({
          ...prev,
          view: 'camera',
          scannerMode: 'group',
          error: 'No valid food products detected. Please adjust lighting and try again.',
        }));
        return;
      }

      const newCartItems: MealCartItem[] = [];
      let matchedCount = 0;

      for (const item of validEntities) {
        const rawBrand = item.brand.trim();
        const rawProductName = item.product_name.trim();
        const sanitizedBrand = sanitizeText(rawBrand);
        const sanitizedProductName = sanitizeText(rawProductName);

        let matched = false;
        try {
          const formula = `AND(SEARCH('${sanitizedBrand}', LOWER({Brand})) > 0, SEARCH('${sanitizedProductName}', LOWER({Product Name})) > 0)`;
          const res = await fetch(`/api/check?filterByFormula=${encodeURIComponent(formula)}`);
          
          if (res.ok) {
            const data = await res.json();
            if (data.records && data.records.length > 0) {
              matched = true;
              matchedCount++;
              const matchedFields = data.records[0].fields;
              const calories = matchedFields['Calories'] ?? 0;
              const protein = matchedFields['Protein'] ?? 0;
              const fats = matchedFields['Fats'] ?? 0;
              const carbs = matchedFields['Carbs'] ?? 0;
              const fiber = matchedFields['Fiber'] ?? 0;
              const xpScore = matchedFields['XP Score'] ?? (calories > 0 ? calculateScore(protein, calories) : 0);

              newCartItems.push({
                id: data.records[0].id || Math.random().toString(36).substring(2, 9),
                brand: matchedFields['Brand'] || rawBrand,
                product_name: matchedFields['Product Name'] || rawProductName,
                weight: 100,
                isMissingData: false,
                calories,
                protein,
                fats,
                carbs,
                fiber,
                xp: xpScore,
                xf: matchedFields['XF Score'] ?? (calories > 0 ? calculateScore(fats, calories) : 0),
                xc: matchedFields['XC Score'] ?? (calories > 0 ? calculateScore(carbs, calories) : 0),
                xfi: matchedFields['XFi Score'] ?? (calories > 0 ? calculateScore(fiber, calories) : 0),
                mealanString: matchedFields['Mealan String'],
                rawRecord: matchedFields,
              });
            }
          }
        } catch (err) {
          console.warn("Airtable search error for entity:", item, err);
        }

        if (!matched) {
          // Graceful fallback for group mode:
          // Do not attempt to guess macros for group items. They must either be pulled purely from Airtable, or the user must scan them individually.
          newCartItems.push({
            id: Math.random().toString(36).substring(2, 9),
            brand: rawBrand,
            product_name: rawProductName,
            weight: 100,
            isMissingData: true,
            calories: undefined,
            protein: undefined,
            fats: undefined,
            carbs: undefined,
            fiber: undefined,
          });
        }
      }

      if (matchedCount === 0) {
        showToast("Ingredients not found in database. Please scan barcodes or labels individually.");
      }

      setState(prev => ({
        ...prev,
        view: 'home',
        mealCart: [...prev.mealCart, ...newCartItems],
        isCartOpen: true,
        error: null,
      }));

    } catch (error: any) {
      showToast("Ingredients not found in database. Please scan barcodes or labels individually.");
      setState(prev => ({
        ...prev,
        view: 'camera',
        scannerMode: 'group',
        error: error.message || 'Failed to process group scan.',
      }));
    }
  };

  const processImageBase64 = async (rawBase64Data: string) => {
    setState(prev => ({
      ...prev,
      view: 'scanning',
      error: null,
      scanData: null,
      imageUrl: null,
      isSidebarOpen: false,
    }));

    try {
      const base64Data = await resizeImageBase64(rawBase64Data);
      setState(prev => ({ ...prev, imageUrl: base64Data }));
      
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data, mode: 'label' }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to scan image');
      }

      const data: ScanResult = await response.json();
      
      if (data.success === false) {
        setState(prev => ({
          ...prev,
          view: 'camera',
          error: `Scan Failed: ${data.error_reason || 'Could not read label'}. Please adjust lighting and retake.`,
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        view: 'hud',
        scanData: data,
      }));

    } catch (error: any) {
      setState(prev => ({
        ...prev,
        view: 'home',
        error: error.message || 'An unexpected error occurred.',
      }));
    }
  };

  const processBarcode = async (barcode: string) => {
    setState(prev => ({
      ...prev,
      view: 'scanning',
      error: null,
      scanData: null,
      imageUrl: null,
      isSidebarOpen: false,
    }));

    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      if (!res.ok) throw new Error("Failed to fetch product data");
      const data = await res.json();

      if (data.status === 1 && data.product) {
        const p = data.product;
        const n = p.nutriments || {};
        
        const scanData: ScanResult = {
          success: true,
          barcode: barcode,
          brand: p.brands || p.brand_owner || "Unknown",
          product_name: p.product_name || "Unknown",
          calories: n['energy-kcal_100g'] || 0,
          protein: n['proteins_100g'] || 0,
          fats: n['fat_100g'] || 0,
          carbs: n['carbohydrates_100g'] || 0,
          fiber: n['fiber_100g'] || 0,
        };

        setState(prev => ({
          ...prev,
          view: 'hud',
          scanData,
        }));
      } else {
        setState(prev => ({
          ...prev,
          view: 'camera',
          scannerMode: 'label',
          error: 'Product not found in database. Please use Label Scanner.'
        }));
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        view: 'camera',
        scannerMode: 'label',
        error: 'Failed to look up barcode. Please use Label Scanner.'
      }));
    }
  };

  const homeFileInputRef = useRef<HTMLInputElement>(null);

  const handleHomeFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      processImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    if (homeFileInputRef.current) {
      homeFileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('nutrition-scanner-v2', JSON.stringify({
        activeProfileId: state.activeProfileId,
        scanData: state.scanData,
        imageUrl: state.imageUrl,
        mealCart: state.mealCart,
        scannerMode: state.scannerMode,
      }));
    } catch (e) {
      console.warn("Failed to save state to localStorage (possibly due to quota exceeded with large image):", e);
    }
  }, [state.activeProfileId, state.scanData, state.imageUrl, state.mealCart, state.scannerMode]);

  const handleRemoveCartItem = (id: string) => {
    setState(prev => ({
      ...prev,
      mealCart: prev.mealCart.filter(item => item.id !== id),
    }));
  };

  const updateItemWeight = (index: number, newWeight: number) => {
    setState(prev => ({
      ...prev,
      mealCart: prev.mealCart.map((item, i) => {
        if (i === index) {
          return {
            ...item,
            weight: Math.max(0, isNaN(newWeight) ? 0 : newWeight),
          };
        }
        return item;
      }),
    }));
  };

  const handleClearCart = () => {
    setState(prev => ({
      ...prev,
      mealCart: [],
    }));
  };

  const handleAddToCart = () => {
    if (!state.scanData || !metrics) return;
    const sanitizedBrand = state.scanData.brand || "Unknown Brand";
    const sanitizedProductName = state.scanData.product_name || "Food Product";

    const newItem: MealCartItem = {
      id: Math.random().toString(36).substring(2, 9),
      brand: sanitizedBrand,
      product_name: sanitizedProductName,
      weight: 100,
      isMissingData: false,
      calories: state.scanData.calories,
      protein: state.scanData.protein,
      fats: state.scanData.fats,
      carbs: state.scanData.carbs,
      fiber: state.scanData.fiber,
      xp: metrics.xp,
      xf: metrics.xf,
      xc: metrics.xc,
      xfi: metrics.xfi,
      mealanString: metrics.mealanString,
    };

    setState(prev => ({
      ...prev,
      mealCart: [...prev.mealCart, newItem],
      isCartOpen: true,
    }));
  };

  const handleScanMissingItem = (item: MealCartItem) => {
    setState(prev => ({
      ...prev,
      isCartOpen: false,
      view: 'camera',
      scannerMode: 'label',
      targetMissingItemId: item.id,
      error: null,
    }));
  };

  const handleScanClick = () => {
    setState(prev => ({ ...prev, view: 'camera' }));
  };

  const metrics = useMemo(() => {
    if (!state.scanData) return null;
    const sd = state.scanData;
    const t = activeProfile.thresholds;
    
    const xp = calculateScore(sd.protein, sd.calories);
    const xpLevel = getLevel(xp, t.XP);
    const xpChar = getMealanChar(xpLevel, 'P', 'p');

    const xf = calculateScore(sd.fats, sd.calories);
    const xfLevel = getLevel(xf, t.XF);
    const xfChar = getMealanChar(xfLevel, 'F', 'f');

    const xc = calculateScore(sd.carbs, sd.calories);
    const xcLevel = getLevel(xc, t.XC);
    const xcChar = getMealanChar(xcLevel, 'C', 'c');

    const xfi = calculateScore(sd.fiber, sd.calories);
    const xfiLevel = getLevel(xfi, t.XFi);
    const xfiChar = getMealanChar(xfiLevel, 'Fi', 'fi');

    const mealanString = `[ ${xpChar} | ${xfChar} | ${xcChar} | ${xfiChar} ]`;

    return {
      xp, xpLevel, 
      xf, xfLevel,
      xc, xcLevel,
      xfi, xfiLevel,
      mealanString
    };
  }, [state.scanData, activeProfile]);

  const sanitizeText = (str: string) => {
    if (!str) return "";
    return str
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const saveToAirtable = async () => {
    if (!metrics || !state.scanData) return;
    setState(prev => ({ ...prev, isSaving: true }));
    
    const sanitizedBrand = sanitizeText(state.scanData.brand || "Unknown");
    const sanitizedProductName = sanitizeText(state.scanData.product_name || "Unknown");
    const barcode = state.scanData.barcode;

    try {
      // 1. Duplicate check via GET
      let checkUrl = `/api/check?brand=${encodeURIComponent(sanitizedBrand)}&product=${encodeURIComponent(sanitizedProductName)}`;
      if (barcode) {
        checkUrl += `&barcode=${encodeURIComponent(barcode)}`;
      }
      const checkRes = await fetch(checkUrl);
      if (!checkRes.ok) {
        const err = await checkRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to check for duplicates");
      }
      
      const checkData = await checkRes.json();
      if (checkData.exists) {
        setState(prev => ({ ...prev, isSaving: false, saveError: "Product already exists in PlateMate." }));
        setTimeout(() => {
          setState(prev => ({ ...prev, saveError: null }));
        }, 3000);
        return;
      }

      // 2. Perform Save
      const payload: any = {
        "Brand": sanitizedBrand,
        "Product Name": sanitizedProductName,
        "XP Score": metrics.xp,
        "XF Score": metrics.xf,
        "XC Score": metrics.xc,
        "XFi Score": metrics.xfi,
        "Mealan String": metrics.mealanString,
        "Calories": state.scanData.calories,
        "Protein": state.scanData.protein,
        "Fats": state.scanData.fats,
        "Carbs": state.scanData.carbs,
        "Fiber": state.scanData.fiber,
        "Active Profile": activeProfile.name
      };
      
      if (barcode) {
        payload["Barcode"] = barcode;
      }

      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save to Airtable');
      }
      
      // 3. Success UI Flow & update mealCart if resolving missing item
      if (state.targetMissingItemId) {
        setState(prev => ({
          ...prev,
          mealCart: prev.mealCart.map(item => {
            if (item.id === prev.targetMissingItemId) {
              return {
                ...item,
                brand: sanitizedBrand,
                product_name: sanitizedProductName,
                weight: item.weight ?? 100,
                isMissingData: false,
                calories: state.scanData?.calories,
                protein: state.scanData?.protein,
                fats: state.scanData?.fats,
                carbs: state.scanData?.carbs,
                fiber: state.scanData?.fiber,
                xp: metrics.xp,
                xf: metrics.xf,
                xc: metrics.xc,
                xfi: metrics.xfi,
                mealanString: metrics.mealanString,
              };
            }
            return item;
          }),
          targetMissingItemId: null,
          isSaving: false,
          saveSuccess: true,
        }));
      } else {
        setState(prev => ({ ...prev, isSaving: false, saveSuccess: true }));
      }
      
      setTimeout(() => {
        setState(prev => ({ 
          ...prev, 
          saveSuccess: false, 
          view: 'camera', 
          scanData: null, 
          imageUrl: null 
        }));
      }, 2000);

    } catch (error: any) {
      console.error(error);
      setState(prev => ({ ...prev, isSaving: false, saveError: `Error saving: ${error.message}` }));
      setTimeout(() => {
        setState(prev => ({ ...prev, saveError: null }));
      }, 3000);
    }
  };

  const resetSession = () => {
    setState(prev => ({ ...prev, view: 'home', scanData: null, imageUrl: null }));
  };

  const getColorForLevel = (level: Level) => {
    if (level === 'High') return 'text-[#39ff14]';
    if (level === 'Moderate') return 'text-yellow-400';
    return 'text-[#ff073a]';
  };
  
  const getBgForLevel = (level: Level) => {
    if (level === 'High') return 'bg-[#39ff14]';
    if (level === 'Moderate') return 'bg-yellow-400';
    return 'bg-[#ff073a]';
  };

  const renderSidebar = () => (
    <AnimatePresence>
      {state.isSidebarOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setState(prev => ({ ...prev, isSidebarOpen: false }))}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div 
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className="fixed inset-y-0 left-0 w-72 max-w-[80vw] bg-neutral-900 border-r border-neutral-800 z-50 flex flex-col shadow-2xl"
          >
            <div className="p-6 border-b border-neutral-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center shrink-0">
                <UserCircle className="w-7 h-7 text-neutral-400" />
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs text-neutral-400 uppercase tracking-wider">Welcome back,</span>
                <span className="font-semibold text-neutral-50 truncate">Scanner</span>
              </div>
              <button 
                onClick={() => setState(prev => ({ ...prev, isSidebarOpen: false }))}
                className="ml-auto p-2 -mr-2 text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-4 block px-2">Nutritional Profiles</span>
              <div className="space-y-2">
                {PROFILES.map(profile => (
                  <button
                    key={profile.id}
                    onClick={() => setState(prev => ({ ...prev, activeProfileId: profile.id, isSidebarOpen: false }))}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${
                      state.activeProfileId === profile.id 
                        ? 'bg-neutral-800 border-neutral-700 text-white' 
                        : 'bg-transparent border-transparent text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
                    }`}
                  >
                    <span className="font-medium text-sm">{profile.name}</span>
                    {state.activeProfileId === profile.id && <Check className="w-5 h-5 text-neutral-50" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-neutral-800">
              <button className="w-full py-4 rounded-2xl border border-neutral-700 text-neutral-300 font-medium hover:bg-neutral-800 transition-all text-sm">
                Login / Sign Up
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  const renderHome = () => (
    <div className="flex-1 flex flex-col items-center justify-center w-full px-6 relative">
      <button 
        onClick={() => setState(prev => ({ ...prev, isSidebarOpen: true }))}
        className="absolute top-6 left-6 p-3 rounded-full bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 transition-colors z-10"
      >
        <Menu className="w-6 h-6" />
      </button>

      <button 
        onClick={() => setState(prev => ({ ...prev, isCartOpen: true }))}
        className="absolute top-6 right-6 p-3 rounded-full bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 transition-colors z-10 flex items-center justify-center"
        title="View Meal Cart"
      >
        <ShoppingBag className="w-6 h-6 text-neutral-300" />
        {state.mealCart.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#39ff14] text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(57,255,20,0.5)]">
            {state.mealCart.length}
          </span>
        )}
      </button>
      
      <div className="w-24 h-24 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-8 shadow-2xl">
        <ScanLine className="w-10 h-10 text-neutral-400" />
      </div>
      <h1 className="text-4xl font-semibold tracking-tight mb-3 text-center">Nutrition XP</h1>
      <p className="text-neutral-400 text-center mb-12 max-w-[280px] leading-relaxed">
        Advanced label parsing and macronutrient density profiling.
      </p>

      {state.error && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 flex items-center gap-3 max-w-sm w-full">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{state.error}</span>
        </div>
      )}
      
      <div className="w-full max-w-sm flex flex-col gap-4">
        <button
          onClick={handleScanClick}
          className="w-full bg-neutral-50 text-neutral-950 py-5 px-6 rounded-3xl font-bold text-lg tracking-wide hover:bg-neutral-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.1)]"
        >
          <Camera className="w-6 h-6" />
          Scan Food Label
        </button>
        
        <button
          onClick={() => homeFileInputRef.current?.click()}
          className="w-full bg-transparent border border-neutral-800 text-neutral-300 py-4 px-6 rounded-3xl font-medium text-base hover:bg-neutral-900 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <ImageIcon className="w-5 h-5" />
          Upload from Gallery
        </button>
      </div>

      <input 
        type="file" 
        accept="image/*" 
        ref={homeFileInputRef} 
        onChange={handleHomeFileChange} 
        className="hidden" 
      />
    </div>
  );

  const renderScanning = () => (
    <div className="flex-1 flex flex-col items-center justify-center w-full px-6">
      <div className="relative w-48 h-48 mb-8 rounded-3xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-2xl">
        {state.imageUrl && (
          <img src={state.imageUrl} alt="Scanning" className="w-full h-full object-cover opacity-30 grayscale" />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
            <RefreshCw className="w-10 h-10 text-neutral-50" />
          </motion.div>
        </div>
        <motion.div 
          className="absolute inset-0 border-t-2 border-neutral-50 opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.5)]"
          animate={{ y: ["0%", "100%", "0%"] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        />
      </div>
      <p className="text-lg font-medium text-neutral-300 animate-pulse tracking-wide">
        {state.scannerMode === 'group' 
          ? 'Extracting products & checking database...' 
          : 'Parsing macronutrients...'}
      </p>
    </div>
  );

  const targetMissingItem = state.targetMissingItemId 
    ? state.mealCart.find(i => i.id === state.targetMissingItemId) 
    : null;

  const renderHUD = () => {
    if (!metrics) return null;
    const isHighProtein = metrics.xpLevel === 'High';
    return (
      <div className="absolute inset-0 flex flex-col w-full h-full bg-neutral-950 overflow-hidden">
        {state.imageUrl && (
          <div className="absolute inset-0 z-0">
            <img src={state.imageUrl} alt="Background" className="w-full h-full object-cover opacity-30 grayscale" />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent" />
          </div>
        )}

        <button 
          onClick={() => setState(prev => ({ ...prev, isCartOpen: true }))}
          className="absolute top-6 right-6 p-3 rounded-full bg-neutral-900/80 border border-neutral-700 hover:bg-neutral-800 transition-colors z-20 flex items-center justify-center backdrop-blur-md"
          title="View Meal Cart"
        >
          <ShoppingBag className="w-5 h-5 text-neutral-200" />
          {state.mealCart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#39ff14] text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(57,255,20,0.5)]">
              {state.mealCart.length}
            </span>
          )}
        </button>
        
        <div className="relative z-10 flex flex-col h-full justify-end p-6 max-w-md mx-auto w-full">
          <div className="mb-auto mt-16 flex flex-col items-center text-center">
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-neutral-400 mb-4 bg-neutral-900/80 px-4 py-1.5 rounded-full border border-neutral-800 backdrop-blur-sm">
              Live Analysis
            </span>
            <h2 className="text-2xl font-semibold mb-2 text-neutral-300">Protein Density (XP)</h2>
            <div 
              className={`text-6xl font-bold tracking-tighter mb-6 ${isHighProtein ? 'text-[#39ff14]' : 'text-neutral-50'}`}
              style={{ textShadow: isHighProtein ? '0 0 40px rgba(57,255,20,0.5)' : 'none' }}
            >
              {metrics.xp.toFixed(1)} <span className="text-xl font-medium tracking-normal text-neutral-300 opacity-80">({metrics.xpLevel})</span>
            </div>
            <div className="px-4 py-2.5 rounded-full bg-neutral-900/80 backdrop-blur-md border border-neutral-700 text-lg tracking-widest font-mono text-neutral-200 shadow-2xl whitespace-nowrap">
              {metrics.mealanString}
            </div>
          </div>

          <div className="flex flex-col gap-3 pb-4">
            {targetMissingItem && (
              <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center gap-2 text-xs text-amber-300 backdrop-blur-md">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Scanning to resolve missing data for: <strong>{targetMissingItem.product_name}</strong></span>
              </div>
            )}
            <button
              onClick={handleAddToCart}
              className="w-full py-4 rounded-3xl bg-neutral-900/90 backdrop-blur-md border border-neutral-700 text-neutral-100 font-semibold text-base hover:bg-neutral-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg"
            >
              <ShoppingBag className="w-5 h-5 text-[#39ff14]" />
              Add to Meal Cart (100g)
            </button>
            <button
              onClick={() => setState(prev => ({ ...prev, view: 'details' }))}
              className="w-full py-4 rounded-3xl bg-neutral-50 text-neutral-950 font-bold text-base hover:bg-neutral-200 transition-all active:scale-[0.98]"
            >
              View Details
            </button>
            <button
              onClick={() => setState(prev => ({ ...prev, view: 'camera', scanData: null, imageUrl: null }))}
              className="w-full py-5 rounded-3xl bg-neutral-900/80 backdrop-blur-md border border-neutral-700 text-neutral-50 font-semibold text-lg hover:bg-neutral-800 transition-all active:scale-[0.98]"
            >
              Retake
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col font-sans selection:bg-neutral-800 overflow-hidden relative">
      {renderSidebar()}
      
      {/* Global Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 inset-x-4 max-w-md mx-auto z-[100] bg-neutral-900/95 border border-amber-500/50 text-neutral-100 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 text-xs sm:text-sm font-medium pointer-events-auto"
          >
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="flex-1">{toastMessage}</span>
            <button 
              onClick={() => setToastMessage(null)}
              className="p-1 text-neutral-400 hover:text-neutral-100 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {state.view === 'home' && (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex w-full">
            {renderHome()}
          </motion.div>
        )}
        {state.view === 'camera' && (
          <CameraView 
            key="camera"
            error={state.error}
            mode={state.scannerMode || 'label'}
            scannerMode={state.scannerMode || 'label'}
            onModeChange={(mode) => setState(prev => ({ ...prev, scannerMode: mode, error: null }))}
            onCapture={processImageBase64}
            processSingleLabelOCR={processImageBase64}
            processGroupScan={processGroupScan}
            onBarcode={processBarcode}
            onCancel={() => setState(prev => ({ ...prev, view: 'home', error: null }))}
            cartCount={state.mealCart.length}
            onOpenCart={() => setState(prev => ({ ...prev, isCartOpen: true }))}
            targetMissingItemName={targetMissingItem?.product_name || null}
          />
        )}
        {state.view === 'scanning' && (
          <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex w-full">
            {renderScanning()}
          </motion.div>
        )}
        {(state.view === 'hud' || state.view === 'details') && (
          <motion.div key="hud" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex w-full relative">
            {renderHUD()}
            <AnimatePresence>
              {state.view === 'details' && state.scanData && metrics && (
                <DetailsModal
                  isOpen={state.view === 'details'}
                  onClose={() => setState(prev => ({ ...prev, view: 'hud' }))}
                  scanData={state.scanData}
                  metrics={metrics}
                  activeProfile={activeProfile}
                  targetMissingItemName={targetMissingItem?.product_name || null}
                  onUpdateBrand={(brand) => setState(prev => prev.scanData ? { ...prev, scanData: { ...prev.scanData, brand } } : prev)}
                  onUpdateProductName={(product_name) => setState(prev => prev.scanData ? { ...prev, scanData: { ...prev.scanData, product_name } } : prev)}
                  onSave={saveToAirtable}
                  isSaving={state.isSaving || false}
                  saveSuccess={state.saveSuccess || false}
                  saveError={state.saveError || null}
                  onAddToCart={handleAddToCart}
                  onStartNextScan={() => setState(prev => ({ ...prev, view: 'camera', scanData: null, imageUrl: null }))}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <MealCartModal
        isOpen={!!state.isCartOpen}
        onClose={() => setState(prev => ({ ...prev, isCartOpen: false }))}
        items={state.mealCart}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onScanMissingItem={handleScanMissingItem}
        onUpdateItemWeight={updateItemWeight}
        activeProfile={activeProfile}
        onOpenGroupScan={() => {
          setState(prev => ({
            ...prev,
            isCartOpen: false,
            view: 'camera',
            scannerMode: 'group',
            error: null,
          }));
        }}
      />
    </div>
  );
}
