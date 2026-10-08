import { useEffect, useRef, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { useBack } from "../back";

// Canvas board C7 (Milan, 8 October 2026): on a computer, Take a photo opens its camera inside Chef Mealan, in the same
// dark style as Scan: hold the pack up, take the photo, then Take again or Use this photo. Several cameras (a laptop's own
// and a plugged-in one): Switch camera. A phone keeps its own camera app, which takes better photos than a page can.
export function PhotoCamera({ title, onUse, onClose }: { title: string; onUse: (dataUrl: string) => void; onClose: () => void }) {
  useBack(true, onClose);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cams, setCams] = useState<string[]>([]);
  const [camAt, setCamAt] = useState(0);
  const [shot, setShot] = useState<string | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let stream: MediaStream | null = null, gone = false;
    (async () => {
      try {
        const id = cams[camAt];
        stream = await navigator.mediaDevices.getUserMedia({ video: id ? { deviceId: { exact: id }, width: { ideal: 1920 }, height: { ideal: 1080 } } : { width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
        if (gone) { stream.getTracks().forEach((t) => t.stop()); return; }
        if (videoRef.current) videoRef.current.srcObject = stream;
        // the names of the cameras are known once one is allowed
        if (!cams.length) { const all = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "videoinput").map((d) => d.deviceId).filter(Boolean); if (all.length > 1 && !gone) setCams(all); }
      } catch (e: any) {
        setError(e?.name === "NotAllowedError" ? "The camera isn't allowed for Chef Mealan. Allow it in the browser, or use Upload a photo." : "The camera could not start. Use Upload a photo instead.");
      }
    })();
    return () => { gone = true; stream?.getTracks().forEach((t) => t.stop()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camAt, cams.length]);
  const take = () => {
    const v = videoRef.current; if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas"); c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    setShot(c.toDataURL("image/jpeg", 0.9));
  };
  return (
    <div className="photo-cam" role="dialog" aria-label={`Photo of ${title}`} onClick={(e) => e.stopPropagation()}>
      <video ref={videoRef} autoPlay playsInline muted style={shot ? { visibility: "hidden" } : undefined} />
      {shot && <img src={shot} alt="Your photo" />}
      <div className="cam-top">
        <div className="cam-row">
          <button className="cam-round" aria-label="Close the camera" onClick={onClose}><X className="w-5 h-5" /></button>
          <b className="cam-title">Photo of {title}</b>
          {cams.length > 1 && !shot ? <button className="cam-round" aria-label="Switch camera" onClick={() => setCamAt((i) => (i + 1) % cams.length)}><RefreshCw className="w-5 h-5" /></button> : <span style={{ width: 44 }} />}
        </div>
        {!shot && <span className={`cam-say ${error ? "cam-error" : ""}`}>{error || "Hold the pack in front of the camera"}</span>}
      </div>
      <div className="cam-panel">
        <div className="cam-controls photo-cam-controls">
          {shot ? (
            <>
              <button className="photo-cam-again" onClick={() => setShot(null)}>Take again</button>
              <button className="cam-analyze" onClick={() => onUse(shot)}>Use this photo</button>
            </>
          ) : (
            <button className="cam-shutter" aria-label="Take the photo" onClick={take} disabled={Boolean(error)}><span /></button>
          )}
        </div>
      </div>
    </div>
  );
}
