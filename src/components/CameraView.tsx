import { BrowserMultiFormatReader } from "@zxing/library";
import { useEffect, useRef, useState, ChangeEvent } from "react";
import {
  X,
  Image as ImageIcon,
  Camera,
  ShoppingBag,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { ScannerMode } from "../types";
import { useBack } from "../back";

interface CameraViewProps {
  key?: string;
  error?: string | null;
  mode?: ScannerMode;
  scannerMode?: ScannerMode;
  onModeChange: (mode: ScannerMode) => void;
  onCapture: (images: string[]) => void;
  onBarcodeWithPhotos: (code: string, images: string[]) => void;
  addTo?: "plate" | "foods";
  knownCodes?: string[];
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
  onBarcodeWithPhotos,
  addTo,
  knownCodes,
  processSingleLabelOCR: propProcessSingleLabelOCR,
  processGroupScan,
  onBarcode,
  onCancel,
  cartCount = 0,
  onOpenCart,
  targetMissingItemName,
}: CameraViewProps) {
  const scannerMode = propScannerMode || mode || "label";
  useBack(true, onCancel);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [typedCode, setTypedCode] = useState("");
  // typing the code by hand: the camera stops reading and the green line stands still until the field is left empty
  // (Milan, 7 October 2026); a typed code's pack photos wait for the pack to come into view, not for a still room
  const [typingFocus, setTypingFocus] = useState(false);
  const typing = typingFocus || typedCode.trim() !== "";
  const typedRef = useRef(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [stagedGroupImages, setStagedGroupImages] = useState<string[]>([]);
  // Barcode: the code read, kept while the person adds the pack's photos; the camera stays open
  const [codeRead, setCodeRead] = useState<string | null>(null);
  // a code already in the person's foods needs no pack photos: it opens that food at once (journey: a barcode twice)
  useEffect(() => { if (codeRead && knownCodes?.includes(codeRead)) { const c = codeRead; setCodeRead(null); setStagedGroupImages([]); onBarcode(c); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [codeRead]);
  const staged = stagedGroupImages;
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          // ask for a sharp picture; phones otherwise often hand over a small one
          video: { facingMode: { ideal: "environment" }, width: { ideal: 2560 }, height: { ideal: 1440 } },
          audio: false,
        });
        // keep refocusing as the label comes closer, where the phone supports it
        const track = stream.getVideoTracks()[0];
        try { await track.applyConstraints({ advanced: [{ focusMode: "continuous" } as any] }); } catch { /* not supported: fine */ }
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
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const vw = video.videoWidth, vh = video.videoHeight;
    let sx = 0, sy = 0, sw = vw, sh = vh;
    const frame = frameRef.current;
    if (scannerMode !== "barcode") {
      // the video fills the screen with object-cover: map what's on screen back to the video's own pixels.
      // Label: the narrow frame plus a small margin. Group: everything visible on the screen.
      const box = video.getBoundingClientRect();
      const f = scannerMode === "label" && frame ? frame.getBoundingClientRect() : box;
      const m = scannerMode === "label" ? 0.06 : 0;
      const scale = Math.max(box.width / vw, box.height / vh);
      const offX = (vw * scale - box.width) / 2, offY = (vh * scale - box.height) / 2;
      const fx = f.left - box.left - f.width * m, fy = f.top - box.top - f.height * m;
      sx = Math.max(0, (fx + offX) / scale); sy = Math.max(0, (fy + offY) / scale);
      sw = Math.min(vw - sx, (f.width * (1 + 2 * m)) / scale); sh = Math.min(vh - sy, (f.height * (1 + 2 * m)) / scale);
    }
    canvas.width = Math.round(sw); canvas.height = Math.round(sh);
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.88);
  };

  const processSingleLabelOCR = async (image: string) => {
    if (propProcessSingleLabelOCR) {
      await propProcessSingleLabelOCR(image);
    } else {
      await onCapture([image]);
    }
  };
  // Every shot stages, in every mode. Up to six. Nothing is sent until Analyze.
  const stage = (image: string) => setStagedGroupImages((prev) => (prev.length < 6 ? [...prev, image] : prev));
  // Analyze: the staged photos leave as one scan, read the way the mode says
  const analyze = () => {
    const images = [...stagedGroupImages]; setStagedGroupImages([]);
    if (scannerMode === "group") processGroupScan(images);
    else if (scannerMode === "barcode" && codeRead) { const c = codeRead; setCodeRead(null); onBarcodeWithPhotos(c, images); }
    else onCapture(images);
  };

  const processBarcodeFallback = async (image?: string | null) => {
    if (!image) return;
    const reader = new BrowserMultiFormatReader();
    try {
      // Decode the supplied capture/upload, not a stale or empty canvas.
      const result = await reader.decodeFromImageUrl(image);
      setCodeRead(result.getText());
    } catch {
      setToastMessage(
        "No barcode found. Try a sharper photo, or enter the number in Saved foods.",
      );
      setTimeout(() => setToastMessage(null), 4500);
    } finally {
      reader.reset();
    }
  };

  // Auto shot: take the photo when the picture has been steady for about a second. Remembered across visits.
  const [auto, setAuto] = useState<boolean>(() => { try { return localStorage.getItem("chefmealan-camera-auto") !== "manual"; } catch { return true; } });
  const [steady, setSteady] = useState(0); // 0..1, fills the ring
  const busyRef = useRef(false);
  const setAutoMode = (on: boolean) => { setAuto(on); try { localStorage.setItem("chefmealan-camera-auto", on ? "auto" : "manual"); } catch {} };
  useEffect(() => {
    if (!auto || (scannerMode === "barcode" && !codeRead) || cameraError) { setSteady(0); return; }
    const small = document.createElement("canvas"); small.width = 48; small.height = 48;
    const sctx = small.getContext("2d", { willReadFrequently: true });
    let prev: Uint8ClampedArray | null = null, still = 0, armed = !(scannerMode === "barcode" && typedRef.current), last = performance.now();
    const id = window.setInterval(() => {
      const v = videoRef.current; if (!v || !sctx || v.videoWidth === 0 || busyRef.current) return;
      sctx.drawImage(v, 0, 0, 48, 48);
      const px = sctx.getImageData(0, 0, 48, 48).data;
      const now = performance.now(), dt = now - last; last = now;
      if (prev) {
        let diff = 0;
        for (let i = 0; i < px.length; i += 4) diff += Math.abs(px[i] - prev[i]) + Math.abs(px[i + 1] - prev[i + 1]) + Math.abs(px[i + 2] - prev[i + 2]);
        diff /= (px.length / 4) * 3;
        if (diff > 14) armed = true; // moved on to the next side or product
        still = diff < 5 && armed ? still + dt : 0;
        setSteady(Math.min(1, still / 1000));
        if (still >= 1000) { still = 0; armed = false; setSteady(0); void handleShutterClick(); }
      }
      prev = px;
    }, 120);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, scannerMode, cameraError, codeRead]);

  // Barcode: read live from the camera, a few times a second; the phone's own detector where it has one.
  useEffect(() => {
    if (scannerMode !== "barcode" || cameraError || typing) return;
    const Detector = (window as any).BarcodeDetector;
    const native = Detector ? new Detector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"] }) : null;
    const reader = native ? null : new BrowserMultiFormatReader();
    const grab = document.createElement("canvas");
    let done = false, working = false;
    const id = window.setInterval(async () => {
      const v = videoRef.current; if (done || working || !v || v.videoWidth === 0) return;
      working = true;
      try {
        let code = "";
        if (native) { const r = await native.detect(v); code = r?.[0]?.rawValue ?? ""; }
        else {
          const w = Math.min(1280, v.videoWidth); grab.width = w; grab.height = Math.round((v.videoHeight / v.videoWidth) * w);
          grab.getContext("2d")?.drawImage(v, 0, 0, grab.width, grab.height);
          try { code = (await reader!.decodeFromImageUrl(grab.toDataURL("image/jpeg", 0.85))).getText(); } catch { code = ""; }
        }
        if (/^\d{8,14}$/.test(code)) { done = true; typedRef.current = false; try { navigator.vibrate?.(60); } catch {} setCodeRead(code); }
      } catch { /* keep looking */ } finally { working = false; }
    }, native ? 250 : 450);
    return () => { done = true; window.clearInterval(id); reader?.reset(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerMode, cameraError, codeRead, typing]);

  const handleShutterClick = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    window.setTimeout(() => { busyRef.current = false; }, 450);
    const image = captureImageFromVideo();
    if (!image) return;
    if (scannerMode === "barcode" && !codeRead) { await processBarcodeFallback(image); return; }
    stage(image);
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
      if (scannerMode === "barcode" && !codeRead) { await processBarcodeFallback(image); return; }
      stage(image);
    };
    reader.readAsDataURL(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="camera-ui absolute inset-0 z-50 bg-black flex flex-col overflow-hidden"
    >
      {/* Canvas boards C2 and C3 (Milan, 7 October 2026): white words on solid dark, in sentences; the modes as one switch;
          everything to tap in one dark panel at the bottom, so it reads on any kitchen */}
      <div className="cam-top">
        <div className="cam-row">
          <button onClick={onCancel} aria-label="Close camera" className="cam-round"><X className="w-5 h-5" /></button>
          <b className="cam-title" aria-label={`${addTo === "plate" ? "Add to plate" : "Add a food"}: Scan`}>{addTo === "plate" ? "Scan for your plate" : "Scan a food"}</b>
          <button onClick={onOpenCart} aria-label="Your plate" className="cam-round relative">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && <span className="cam-badge">{cartCount}</span>}
          </button>
        </div>
        <div className="cam-modes" role="group" aria-label="What to scan">
          {([["barcode", "Barcode"], ["label", "Label"], ["group", "Group"]] as const).map(([m, name]) => (
            <button key={m} aria-pressed={scannerMode === m} className={scannerMode === m ? "bg-white on" : ""} onClick={() => { if (m !== "barcode") setCodeRead(null); onModeChange(m); }}>{name}</button>
          ))}
        </div>
        {error ? <span className="cam-say cam-error">{error}</span> : (
          <span className="cam-say" role="status">
            {scannerMode === "barcode"
              ? codeRead ? "Now photos of the pack's front and back, or use the code only" : typing ? "Paused while you type the code" : "Hold the barcode inside the frame"
              : scannerMode === "group" ? "The whole product, one side per photo" : "Hold the nutrition table inside the frame"}
          </span>
        )}
        {targetMissingItemName && <span className="cam-say cam-missing">Scanning for: {targetMissingItemName}</span>}
        <AnimatePresence>
          {toastMessage && (
            <motion.span initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="cam-say cam-toast">{toastMessage}</motion.span>
          )}
        </AnimatePresence>
      </div>

      {!cameraError ? (
        <>
          <video ref={videoRef as any} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover" />
          <div className="cam-frame-area" aria-hidden="true">
            {scannerMode === "group" ? (
              <div className="group-frame"><span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" /></div>
            ) : (
              <div ref={frameRef} className={`cam-frame ${scannerMode === "barcode" ? "barcode" : "label"}`}>
                <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
                {scannerMode === "barcode" && !typing && !codeRead && (
                  <motion.div className="cam-line" animate={{ top: ["4%", "94%", "4%"] }} transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }} />
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center z-20">
          <Camera className="w-16 h-16 text-neutral-400 mb-4" />
          <p className="text-white font-semibold mb-6 leading-relaxed max-w-[280px]">{cameraError}</p>
          <button onClick={() => fileInputRef.current?.click()} className="px-6 py-4 bg-white text-[#172742] rounded-2xl font-extrabold flex items-center gap-3">
            <ImageIcon className="w-5 h-5" /> Choose from your photos
          </button>
        </div>
      )}

      <div className="cam-panel">
        {stagedGroupImages.length > 0 && (
          <div className="cam-staged">
            <b>{stagedGroupImages.length} {stagedGroupImages.length === 1 ? "photo" : "photos"} ready</b>
            <div className="cam-thumbs" aria-label="Staged photos">
              {stagedGroupImages.map((src, i) => (
                <button key={i} onClick={() => setStagedGroupImages((v) => v.filter((_, j) => j !== i))} aria-label={`Remove staged photo ${i + 1}`}>
                  <img src={src} alt={`Staged angle ${i + 1}`} />
                  <span aria-hidden="true"><X className="w-3 h-3" /></span>
                </button>
              ))}
            </div>
          </div>
        )}
        {scannerMode === "barcode" && codeRead && (
          <div className="typed-barcode code-read">
            <span>Code read: {codeRead}</span>
            <button type="button" onClick={() => { const c = codeRead; setCodeRead(null); setStagedGroupImages([]); onBarcode(c); }}>Use the code only</button>
          </div>
        )}
        {scannerMode === "barcode" && !codeRead && (
          <>
            <small className="cam-small">Or type the barcode</small>
            <form className="typed-barcode" onSubmit={(e) => { e.preventDefault(); const v = typedCode.trim(); if (/^\d{8,14}$/.test(v)) { typedRef.current = true; setTypingFocus(false); setCodeRead(v); setTypedCode(""); } }}>
              <input value={typedCode} onChange={(e) => setTypedCode(e.target.value)} onFocus={() => setTypingFocus(true)} onBlur={() => setTypingFocus(false)} inputMode="numeric" placeholder="Barcode numbers" aria-label="Type the barcode" enterKeyHint="go" />
              <button type="submit" disabled={!/^\d{8,14}$/.test(typedCode.trim())}>Look up</button>
            </form>
            {!cameraError && typing && <small className="cam-small auto-note">Leave the field empty and the camera reads again.</small>}
          </>
        )}
        <div className="cam-controls">
          <button onClick={() => fileInputRef.current?.click()} className="cam-gallery" aria-label="Your photos">
            <span className="cam-round"><ImageIcon className="w-5 h-5" /></span>
            <small>Your photos</small>
          </button>
          {!cameraError ? (
            <button id="camera-shutter-button" onClick={handleShutterClick} className="cam-shutter" title={scannerMode === "group" ? "Take a photo of one side" : "Take a photo"}>
              <span />
              {auto && (scannerMode !== "barcode" || codeRead) && (
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 80 80" aria-hidden="true">
                  <circle cx="40" cy="40" r="37" fill="none" stroke="#2e7be8" strokeWidth="5" strokeLinecap="round" strokeDasharray={2 * Math.PI * 37} strokeDashoffset={(1 - steady) * 2 * Math.PI * 37} style={{ transition: "stroke-dashoffset 120ms linear" }} />
                </svg>
              )}
            </button>
          ) : <span className="cam-shutter-gap" />}
          <span className="cam-analyze-slot">
            {stagedGroupImages.length > 0 && (
              <button onClick={analyze} className="cam-analyze" aria-label={`Analyze ${stagedGroupImages.length} photo${stagedGroupImages.length === 1 ? "" : "s"}`}>
                Analyze {stagedGroupImages.length}
              </button>
            )}
          </span>
        </div>
        {!cameraError && (scannerMode !== "barcode" || codeRead) && (
          <button className="auto-switch" onClick={() => setAutoMode(!auto)} aria-pressed={auto}>
            {auto ? "Auto shot: hold still · tap for manual" : "Manual shot: tap to take · tap for auto"}
          </button>
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
