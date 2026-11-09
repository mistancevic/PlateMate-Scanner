// DT268 step 2 (0.3.119, board Stories201, DT268f): Share the numbers. One picture of a Served plate, 1080 by 1350: the photo,
// the plate's name, about its energy, its protein and its PD, the line that it was served and read from a photo, and
// chefmealan.com small and half transparent in the corner. It never says Cooked and weighed. Drawn on the phone; the same
// picture Make a post (CR1a) will draw for a cooked meal, with its own line.
const F = (w: number, px: number) => `${w} ${px}px Nunito, ui-sans-serif, system-ui, sans-serif`;
const loadImage = (src: string) => new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
function fit(ctx: CanvasRenderingContext2D, text: string, width: number, max = 2): string[] {
  const words = text.split(/\s+/), lines: string[] = []; let cur = "";
  for (const w of words) { const t = cur ? cur + " " + w : w; if (ctx.measureText(t).width <= width) cur = t; else { if (cur) lines.push(cur); cur = w; } }
  if (cur) lines.push(cur);
  if (lines.length > max) { const keep = lines.slice(0, max); keep[max - 1] = keep[max - 1].replace(/\s*\S*$/, "") + "…"; return keep; }
  return lines;
}
export type PictureWords = { name: string; kcal: string; protein: string; pd: string; line: string; site: string };
export async function numbersPicture(photo: string, x: PictureWords): Promise<string> {
  const W = 1080, H = 1350, M = 56;
  try { await (document as any).fonts?.load?.(F(900, 60)); await (document as any).fonts?.load?.(F(700, 34)); } catch { /* the system font then */ }
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d")!; ctx.fillStyle = "#172742"; ctx.fillRect(0, 0, W, H);
  const img = await loadImage(photo).catch(() => null);
  if (img) { const s = Math.max(W / img.width, H / img.height), sw = W / s, sh = H / s; ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, W, H); }
  const g = ctx.createLinearGradient(0, H * 0.5, 0, H); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,0.78)");
  ctx.fillStyle = g; ctx.fillRect(0, H * 0.5, W, H * 0.5);
  ctx.textBaseline = "alphabetic"; ctx.fillStyle = "#ffffff";
  // from the bottom up: the site, the line, the numbers, the name
  ctx.font = F(700, 28); ctx.textAlign = "right"; ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.fillText(x.site, W - M, H - 34);
  ctx.textAlign = "left"; ctx.fillStyle = "#ffffff";
  let y = H - 96;
  ctx.font = F(700, 34); ctx.fillText(x.line, M, y); y -= 62;
  ctx.font = F(800, 46);
  let px = M; for (const t of [x.kcal, x.protein, x.pd]) { ctx.fillText(t, px, y); px += ctx.measureText(t).width + 44; }
  y -= 76;
  ctx.font = F(900, 64);
  const name = fit(ctx, x.name, W - 2 * M);
  for (let i = name.length - 1; i >= 0; i--) { ctx.fillText(name[i], M, y); y -= 74; }
  return c.toDataURL("image/jpeg", 0.9);
}
// the picture through the phone's share sheet; where the phone cannot share a file, it is saved to the phone
export async function sendPicture(dataUrl: string, fileName: string, title: string): Promise<"shared" | "saved" | "stopped"> {
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], fileName, { type: "image/jpeg" });
  const nav = navigator as any;
  if (nav.canShare?.({ files: [file] })) { try { await nav.share({ files: [file], title }); return "shared"; } catch { return "stopped"; } }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = fileName; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return "saved";
}
