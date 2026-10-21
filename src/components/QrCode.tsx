import qrcode from "qrcode-generator";

// SH73 (Milan 21 October 2026, 21:10 and 23:11): a QR code drawn on the phone, no network. Dark on white with a quiet
// zone of 3 modules so it scans from a phone screen at arm's length.
export function QrCode({ text, size = 248, label }: { text: string; size?: number; label: string }) {
  const q = qrcode(0, "M");
  q.addData(text);
  q.make();
  const n = q.getModuleCount(), b = 3, N = n + 2 * b;
  let d = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + b} ${r + b}h1v1h-1z`;
  return (
    <svg className="qr" role="img" aria-label={label} data-text={text} viewBox={`0 0 ${N} ${N}`} width={size} height={size} shapeRendering="crispEdges">
      <rect width={N} height={N} fill="#ffffff" />
      <path d={d} fill="#0f2236" />
    </svg>
  );
}
