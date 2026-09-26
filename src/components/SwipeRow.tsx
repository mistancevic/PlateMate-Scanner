import { useRef, useState, type ReactNode } from "react";
// Swipe right to remove, swipe left to swap. Shows the action behind the row while dragging. Works with a finger or a mouse.
export function SwipeRow({ children, onRemove, onSwap }: { children: ReactNode; onRemove: () => void; onSwap: () => void }) {
  const [dx, setDx] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const THRESH = 80;
  const end = () => {
    if (dragging.current) { if (dx > THRESH) onRemove(); else if (dx < -THRESH) onSwap(); }
    setDx(0); start.current = null; dragging.current = false;
  };
  return (
    <div className="swipe">
      <div className={`swipe-bg ${dx > 0 ? "right" : dx < 0 ? "left" : ""} ${Math.abs(dx) > THRESH ? "armed" : ""}`}>
        <span className="swipe-remove">Remove</span><span className="swipe-swap">Swap</span>
      </div>
      <div className="swipe-fg" style={{ transform: `translateX(${dx}px)`, transition: start.current === null ? "transform 0.15s" : "none" }}
        onPointerDown={(e) => { if ((e.target as HTMLElement).closest("input,button")) return; start.current = { x: e.clientX, y: e.clientY }; }}
        onPointerMove={(e) => {
          if (!start.current) return;
          const mx = e.clientX - start.current.x, my = e.clientY - start.current.y;
          if (!dragging.current) {
            if (Math.abs(mx) < 12 || Math.abs(mx) < Math.abs(my) * 1.5) return; // not a sideways gesture yet
            dragging.current = true; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          }
          setDx(Math.max(-140, Math.min(140, mx)));
        }}
        onPointerUp={end} onPointerCancel={end}>
        {children}
      </div>
    </div>
  );
}
