import { BrowserMultiFormatReader } from "@zxing/library";
import { useEffect, useRef, useState, ChangeEvent } from "react";
import {
  X,
  Image as ImageIcon,
  Camera,
  ScanBarcode,
  AlignHorizontalJustifyCenter,
  Layers,
  ShoppingBag,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { ScannerMode } from "../types";

interface CameraViewProps {
  key?: string;
  error?: string | null;
  mode?: ScannerMode;
  scannerMode?: ScannerMode;
  onModeChange: (mode: ScannerMode) => void;
  onCapture: (base64: string) => void;
  processSingleLabelOCR?: (base64: string) => void;
  processGroupScan: (images: string[] | string) => void;
  onBarcode: (barcode: string) => void;
  onCancel: () => void;
  cartCount?: number;
  onOpenCart?: () => void;
  targetMissingItemName?: string | null;
}

export function CameraView({
  error,
  mode,
  scannerMode: propScannerMode,
  onModeChange,
  onCapture,
  processSingleLabelOCR: propProcessSingleLabelOCR,
  processGroupScan,
  onBarcode,
  onCancel,
  cartCount = 0,
  onOpenCart,
  targetMissingItemName,
}: CameraViewProps) {
  const scannerMode = propScannerMode || mode || "label";
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [stagedGroupImages, setStagedGroupImages] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.error("Camera access denied or failed", err);
        if (mounted) {
          setCameraError(
            err.name === "NotAllowedError"
              ? "Camera access denied. Please allow permissions or upload from gallery."
              : "Could not start camera. Please upload an image.",
          );
        }
      }
    };
    initCamera();
    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const captureImageFromVideo = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  };

  const processSingleLabelOCR = async (image: string) => {
    if (propProcessSingleLabelOCR) {
      await propProcessSingleLabelOCR(image);
    } else {
      await onCapture(image);
    }
  };

  const processBarcodeFallback = async (image?: string | null) => {
    if (!image) return;
    const reader = new BrowserMultiFormatReader();
    try {
      // Decode the supplied capture/upload, not a stale or empty canvas.
      const result = await reader.decodeFromImageUrl(image);
      onBarcode(result.getText());
    } catch {
      setToastMessage(
        "No barcode found. Try a sharper photo, or enter the number in Saved foods.",
      );
      setTimeout(() => setToastMessage(null), 4500);
    } finally {
      reader.reset();
    }
  };

  const handleShutterClick = async () => {
    const image = captureImageFromVideo();
    if (!image) return;
    if (scannerMode === "group") {
      setStagedGroupImages((prev) =>
        prev.length < 6 ? [...prev, image] : prev,
      );
      return;
    } else if (scannerMode === "barcode") {
      await processBarcodeFallback(image);
      return;
    } else {
      await processSingleLabelOCR(image);
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 15_000_000) {
      setToastMessage("Choose an image smaller than 15 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const image = reader.result as string;
      if (!image) return;
      if (scannerMode === "group") {
        setStagedGroupImages((prev) =>
          prev.length < 6 ? [...prev, image] : prev,
        );
        return;
      } else if (scannerMode === "barcode") {
        await processBarcodeFallback(image);
        return;
      } else {
        await processSingleLabelOCR(image);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-black flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="absolute top-0 inset-x-0 p-4 sm:p-6 z-30 flex justify-between items-center gap-2">
        <button
          onClick={onCancel}
          aria-label="Close camera"
          className="p-3 bg-black/50 hover:bg-black/70 rounded-full backdrop-blur-md text-white transition-colors border border-white/10 shrink-0"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Toggle UI: [ Barcode | Label | Group ] */}
        <div className="flex bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/15 shadow-xl">
          <button
            onClick={() => onModeChange("barcode")}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-bold tracking-wide transition-all flex items-center gap-1.5 ${
              scannerMode === "barcode"
                ? "bg-white text-black shadow-sm"
                : "text-white/70 hover:text-white"
            }`}
          >
            <ScanBarcode className="w-3.5 h-3.5" />
            BARCODE
          </button>
          <button
            onClick={() => onModeChange("label")}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-bold tracking-wide transition-all flex items-center gap-1.5 ${
              scannerMode === "label"
                ? "bg-white text-black shadow-sm"
                : "text-white/70 hover:text-white"
            }`}
          >
            <AlignHorizontalJustifyCenter className="w-3.5 h-3.5" />
            LABEL
          </button>
          <button
            onClick={() => onModeChange("group")}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-bold tracking-wide transition-all flex items-center gap-1.5 ${
              scannerMode === "group"
                ? "bg-white text-black shadow-sm"
                : "text-white/70 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            GROUP
          </button>
        </div>

        {/* Floating Meal Cart button */}
        <button
          onClick={onOpenCart}
          className="relative p-3 bg-black/50 hover:bg-black/70 rounded-full backdrop-blur-md text-white transition-colors border border-white/10 shrink-0 shadow-lg active:scale-95"
          title="View Meal Cart"
        >
          <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#39ff14] text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(57,255,20,0.6)]">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Target missing product indicator if user is resolving a pending cart item */}
      {targetMissingItemName && (
        <div className="absolute top-20 inset-x-4 z-30 flex justify-center pointer-events-none">
          <div className="bg-amber-500/90 text-black text-xs font-bold px-4 py-2 rounded-full shadow-lg backdrop-blur-md flex items-center gap-2">
            <span>Scanning for missing item:</span>
            <span className="underline underline-offset-2">
              {targetMissingItemName}
            </span>
          </div>
        </div>
      )}

      {/* Multi-Angle Staging Floating Action Bar for Group Scan */}
      {scannerMode === "group" && stagedGroupImages.length > 0 && (
        <div className="absolute top-20 inset-x-4 z-40 flex items-center justify-center gap-3">
          <button
            onClick={() => {
              const imagesToProcess = [...stagedGroupImages];
              setStagedGroupImages([]);
              processGroupScan(imagesToProcess);
            }}
            className="px-5 py-2.5 rounded-full bg-[#39ff14] text-black font-extrabold text-xs sm:text-sm tracking-wide shadow-[0_0_20px_rgba(57,255,20,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
          >
            <span>
              Analyze {stagedGroupImages.length}{" "}
              {stagedGroupImages.length === 1 ? "Photo" : "Photos"}
            </span>
          </button>
          <button
            onClick={() => setStagedGroupImages([])}
            className="px-4 py-2.5 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 font-semibold text-xs sm:text-sm border border-neutral-700 backdrop-blur-md active:scale-95 transition-all"
          >
            Clear
          </button>
        </div>
      )}

      {!cameraError ? (
        <>
          <div
            className={`w-full flex items-center justify-center ${scannerMode === "barcode" ? "p-4 my-auto" : "h-full"}`}
          >
            <video
              ref={videoRef as any}
              autoPlay
              playsInline
              muted
              className={
                scannerMode === "barcode"
                  ? "h-64 w-full object-cover rounded-xl"
                  : "h-full w-full object-cover"
              }
            />
          </div>

          {/* Viewfinder Overlay Mask */}
          <div className="absolute inset-0 pointer-events-none z-20 flex flex-col items-center justify-center">
            {error ? (
              <div className="absolute top-[16%] w-[85%] max-w-sm text-red-50 text-[13px] font-bold tracking-wide bg-red-600/90 px-6 py-4 rounded-3xl backdrop-blur-md border border-red-500/50 text-center shadow-2xl">
                {error}
              </div>
            ) : (
              <div className="absolute top-[16%] text-white text-[11px] font-bold tracking-[0.2em] bg-black/60 px-5 py-2.5 rounded-full backdrop-blur-md border border-white/10">
                {scannerMode === "barcode"
                  ? "ALIGN BARCODE INSIDE THE FRAME"
                  : scannerMode === "group"
                    ? stagedGroupImages.length > 0
                      ? `${stagedGroupImages.length} PHOTO(S) STAGED - SNAP MORE OR ANALYZE`
                      : "FRAME MULTIPLE FOOD ITEMS"
                    : "ALIGN LABEL INSIDE THE FRAME"}
              </div>
            )}

            <AnimatePresence>
              {toastMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-[25%] bg-neutral-900/90 text-neutral-100 text-sm font-medium px-4 py-2 rounded-full shadow-lg border border-neutral-700/50 backdrop-blur-md"
                >
                  {toastMessage}
                </motion.div>
              )}
            </AnimatePresence>

            <div
              className={`relative overflow-hidden transition-all duration-300 ${
                scannerMode === "group"
                  ? "w-[90%] max-w-md aspect-[4/3] border-2 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]"
                  : "w-[85%] max-w-sm aspect-[3/4] border-2 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]"
              } ${error ? "border-red-500/80" : "border-white/40"}`}
            >
              {scannerMode === "barcode" && (
                <motion.div
                  className="absolute left-0 right-0 h-1 bg-green-500 shadow-[0_0_15px_3px_rgba(34,197,94,0.9)] opacity-80"
                  animate={{ top: ["0%", "98%", "0%"] }}
                  transition={{
                    repeat: Infinity,
                    duration: 2.5,
                    ease: "linear",
                  }}
                />
              )}
              {scannerMode === "group" && (
                <div className="absolute inset-0 border border-dashed border-white/20 rounded-3xl m-2 pointer-events-none" />
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center z-20">
          <Camera className="w-16 h-16 text-neutral-600 mb-4" />
          <p className="text-neutral-300 font-medium mb-6 leading-relaxed max-w-[280px]">
            {cameraError}
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-4 bg-neutral-800 hover:bg-neutral-700 text-white rounded-2xl font-semibold flex items-center gap-3 border border-neutral-700 transition-colors"
          >
            <ImageIcon className="w-5 h-5" />
            Upload from Gallery
          </button>
        </div>
      )}

      {scannerMode === "group" && stagedGroupImages.length > 0 && (
        <div
          className="absolute bottom-32 left-3 right-3 z-40 flex justify-center gap-2"
          aria-label="Staged photos"
        >
          {stagedGroupImages.map((src, i) => (
            <button
              key={i}
              onClick={() =>
                setStagedGroupImages((v) => v.filter((_, j) => j !== i))
              }
              aria-label={`Remove staged photo ${i + 1}`}
              className="relative border border-white rounded-lg overflow-hidden"
            >
              <img
                src={src}
                alt={`Staged angle ${i + 1}`}
                className="w-12 h-14 object-cover"
              />
              <span className="absolute right-0 top-0 bg-black text-white px-1">
                ×
              </span>
            </button>
          ))}
          <span className="text-white text-xs self-center">
            {stagedGroupImages.length}/6
          </span>
        </div>
      )}
      {/* Controls */}
      <div className="absolute bottom-0 inset-x-0 p-8 z-30 flex items-center justify-center bg-gradient-to-t from-black via-black/60 to-transparent pt-20">
        {!cameraError && (
          <div className="relative flex items-center justify-center w-full max-w-sm">
            {/* Gallery Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute left-4 p-4 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-colors border border-white/10"
              title="Upload Label from Gallery"
            >
              <ImageIcon className="w-6 h-6" />
            </button>

            {/* Shutter Button */}
            <button
              id="camera-shutter-button"
              onClick={handleShutterClick}
              className="w-20 h-20 rounded-full border-[5px] border-white/80 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)]"
              title={
                scannerMode === "group" ? "Snap Angle for Group" : "Capture"
              }
            >
              <div
                className={`w-[3.25rem] h-[3.25rem] rounded-full transition-colors relative flex items-center justify-center ${
                  scannerMode === "group" ? "bg-[#39ff14]" : "bg-white"
                }`}
              >
                {scannerMode === "group" && stagedGroupImages.length > 0 && (
                  <span className="text-[11px] font-black text-black">
                    +{stagedGroupImages.length}
                  </span>
                )}
              </div>
            </button>
          </div>
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />
      <canvas ref={canvasRef} className="hidden" />
    </motion.div>
  );
}
