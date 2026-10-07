// The Instagram images for a published recipe (canvas boards R3 and R4, approved 7 October 2026): four images of
// 1080 × 1350 for a carousel (the photo, the numbers, the ingredients, PD and the link), each fine alone, and the numbers
// again in 1080 × 1920 as a reel's last frame. Drawn here from the recipe, so they say exactly what its page says.
import type { PublicRecipe } from "./recipes";
import { fitsOf } from "./recipes";
import { BANDS } from "./goal";

const INK = "#172742", MUTED = "#5b6b8a", BLUE = "#2e7be8", BLUE_TEXT = "#1f5fc7", LINE = "#c9d8f2", PALE = "#eef3fc", TINT = "#dae6fb";
const F = (w: number, px: number) => `${w} ${px}px Nunito, ui-sans-serif, system-ui, sans-serif`;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}
function cover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const s = Math.max(w / img.width, h / img.height), sw = w / s, sh = h / s;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}
function round(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
// words broken onto lines that fit the width; at most `max` lines, the last one shortened with …
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number, max = 3): string[] {
  const words = text.split(/\s+/), lines: string[] = [];
  let cur = "";
  for (const w of words) { const t = cur ? cur + " " + w : w; if (ctx.measureText(t).width <= width) cur = t; else { if (cur) lines.push(cur); cur = w; } }
  if (cur) lines.push(cur);
  if (lines.length > max) { const keep = lines.slice(0, max); keep[max - 1] = keep[max - 1].replace(/\s*\S*$/, "") + "…"; return keep; }
  return lines;
}
function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = "left") {
  ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = "alphabetic"; ctx.fillText(s, x, y);
}
function head(ctx: CanvasRenderingContext2D, small: string, W: number) {
  text(ctx, small.toUpperCase(), 66, 108, F(900, 30), MUTED);
  text(ctx, "Chef Mealan", W - 66, 108, F(900, 34), BLUE_TEXT, "right");
}
function thumbs(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color = "#fff") {
  // two thumbs up, the DaaM good mark
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = size / 9; ctx.lineCap = "round"; ctx.lineJoin = "round";
  for (const dx of [0, size * 0.62]) {
    const s = size / 24; ctx.save(); ctx.translate(x + dx, y); ctx.scale(s, s);
    ctx.stroke(new Path2D("M7 10v12")); ctx.stroke(new Path2D("M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"));
    ctx.restore();
  }
  ctx.restore();
}
function numbersTable(ctx: CanvasRenderingContext2D, r: PublicRecipe, x: number, y: number, w: number, rowH: number, fs: number) {
  const rows: [string, string][] = [["Energy", `${r.perServing.kcal} kcal`], ["Protein", `${Math.round(r.perServing.protein)} g`], ["Carbs", `${Math.round(r.perServing.carbs)} g`], ["Fat", `${Math.round(r.perServing.fat)} g`]];
  if (r.perServing.fibre !== null) rows.push(["Fibre", `${r.perServing.fibre} g`]);
  rows.forEach(([a, b], i) => {
    const yy = y + i * rowH;
    text(ctx, a, x, yy, F(800, fs), INK); text(ctx, b, x + w, yy, F(800, fs), INK, "right");
    ctx.fillStyle = LINE; ctx.fillRect(x, yy + rowH * 0.36, w, 4);
  });
  return y + rows.length * rowH;
}

async function canvasOf(w: number, h: number, bg: string) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const ctx = c.getContext("2d")!; ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  return { c, ctx };
}
const serving = (r: PublicRecipe) => r.servingName || "serving";

export async function instagramImages(r: PublicRecipe, photo: string | null): Promise<{ name: string; dataUrl: string }[]> {
  try { await (document as any).fonts?.load?.(F(900, 40)); await (document as any).fonts?.load?.(F(700, 30)); } catch { /* the system font then */ }
  const img = photo ? await loadImage(photo).catch(() => null) : null;
  const W = 1080, H = 1350, out: { name: string; dataUrl: string }[] = [];

  // 1 · the photo
  {
    const { c, ctx } = await canvasOf(W, H, INK);
    if (img) cover(ctx, img, 0, 0, W, H);
    const g = ctx.createLinearGradient(0, H * 0.4, 0, H); g.addColorStop(0, "rgba(10,20,40,0)"); g.addColorStop(1, "rgba(10,20,40,.82)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (r.rating === "daam") { round(ctx, 60, 54, 330, 76, 38); ctx.fillStyle = BLUE; ctx.fill(); thumbs(ctx, 86, 70, 40); text(ctx, "DaaM good", 176, 106, F(900, 36), "#fff"); }
    ctx.font = F(900, 96); const t = wrap(ctx, r.title, W - 120, 2);
    // from the bottom up: the footer, one line of numbers, then the name
    t.forEach((l, i) => text(ctx, l, 60, H - 210 - (t.length - 1 - i) * 100, F(900, 96), "#fff"));
    text(ctx, `${Math.round(r.perServing.protein)} g protein in each ${serving(r)}. ${r.perServing.kcal} kcal.`, 60, H - 136, F(700, 44), "rgba(255,255,255,.94)");
    text(ctx, "CHEF MEALAN · SWIPE FOR THE NUMBERS →", 60, H - 70, F(900, 30), "rgba(255,255,255,.78)");
    out.push({ name: "1-photo.jpg", dataUrl: c.toDataURL("image/jpeg", 0.9) });
  }
  // 2 · the numbers
  const numbers = async (w: number, h: number) => {
    const { c, ctx } = await canvasOf(w, h, PALE);
    // a taller frame (the reel's 9 × 16) keeps the same layout, in the middle
    ctx.translate(0, Math.max(0, (h - 1350) / 2)); h = Math.min(h, 1350);
    head(ctx, `One ${serving(r)} · weighed`, w);
    const cy = 170 + 160;
    if (img) { ctx.save(); ctx.beginPath(); ctx.arc(66 + 160, cy, 160, 0, Math.PI * 2); ctx.clip(); cover(ctx, img, 66, cy - 160, 320, 320); ctx.restore(); }
    const tx = img ? 430 : 66;
    text(ctx, `PD ${r.pd}`, tx, cy + 40, F(900, 150), INK);
    text(ctx, `${r.pd} g protein in every 100 kcal`, tx, cy + 100, F(800, 36), MUTED);
    const end = numbersTable(ctx, r, 66, cy + 260, w - 132, 92, 48);
    const by = Math.max(end + 10, h - 230);
    round(ctx, 66, by, w - 132, 150, 34); ctx.fillStyle = TINT; ctx.fill();
    ctx.font = F(800, 36); wrap(ctx, "Every number comes from the recipe and the labels, weighed. Not guessed from a photo.", w - 200, 2).forEach((l, i) => text(ctx, l, 100, by + 62 + i * 46, F(800, 36), INK));
    return c.toDataURL("image/jpeg", 0.92);
  };
  out.push({ name: "2-numbers.jpg", dataUrl: await numbers(W, H) });
  // 3 · the ingredients
  {
    const { c, ctx } = await canvasOf(W, H, "#fff");
    head(ctx, `For ${r.makes} ${r.makes === 1 ? serving(r) : serving(r) + (/(s|x)$/.test(serving(r)) ? "" : "s")}`, W);
    text(ctx, "What goes in", 66, 220, F(900, 72), INK);
    let y = 320;
    for (const it of r.items.slice(0, 9)) {
      ctx.font = F(700, 44); const name = wrap(ctx, it.name, W - 132 - 260, 1)[0];
      text(ctx, name, 66, y, F(700, 44), INK); text(ctx, it.amount, W - 66, y, F(900, 44), INK, "right");
      ctx.fillStyle = "#e3eaf7"; ctx.fillRect(66, y + 26, W - 132, 4); y += 92;
    }
    if (r.steps[0]) {
      const by = H - 200;
      if (img) { ctx.save(); round(ctx, 66, by, 150, 150, 26); ctx.clip(); cover(ctx, img, 66, by, 150, 150); ctx.restore(); }
      ctx.font = F(700, 36); wrap(ctx, r.steps[0], W - (img ? 290 : 132), 3).forEach((l, i) => text(ctx, l, img ? 250 : 66, by + 44 + i * 46, F(700, 36), "#3d4a63"));
    }
    out.push({ name: "3-ingredients.jpg", dataUrl: c.toDataURL("image/jpeg", 0.92) });
  }
  // 4 · PD and the link
  {
    const { c, ctx } = await canvasOf(W, H, "#fff");
    head(ctx, "What is PD?", W);
    ctx.font = F(900, 64); wrap(ctx, "Protein density: protein for every 100 kcal", W - 132, 2).forEach((l, i) => text(ctx, l, 66, 220 + i * 76, F(900, 64), INK));
    text(ctx, `Each goal has its own range. This one, PD ${r.pd}:`, 66, 410, F(700, 38), "#3d4a63");
    // the scale 0 to 10
    const bx = 66, bw = W - 132, by = 460;
    const g = ctx.createLinearGradient(bx, 0, bx + bw, 0); g.addColorStop(0, "#f0705c"); g.addColorStop(0.35, "#f6b94a"); g.addColorStop(0.65, "#35cf9e"); g.addColorStop(1, "#13916a");
    round(ctx, bx, by, bw, 30, 15); ctx.fillStyle = g; ctx.fill();
    const mx = bx + (Math.min(10, r.pd) / 10) * bw; ctx.fillStyle = INK; round(ctx, mx - 6, by - 14, 12, 58, 6); ctx.fill();
    for (const v of [0, 2, 4, 6, 8, 10]) text(ctx, String(v), bx + (v / 10) * bw, by + 76, F(800, 28), "#8b93a5", "center");
    const fits = new Map(fitsOf(r.pd).map((f) => [f.name, f.how]));
    let y = by + 150;
    for (const b of BANDS.slice().sort((a, b2) => parseFloat(b2.range.slice(3)) - parseFloat(a.range.slice(3)))) {
      const how = fits.get(b.name), on = Boolean(how);
      text(ctx, `${on ? "✓ " : ""}${b.name}`, 66, y, F(800, 38), on ? "#123a7a" : "#8b93a5");
      text(ctx, `${how && how !== "fits" ? how + " · " : how ? "fits · " : ""}${b.range}`, W - 66, y, F(800, 34), on ? "#123a7a" : "#8b93a5", "right");
      ctx.fillStyle = "#e3eaf7"; ctx.fillRect(66, y + 22, W - 132, 3); y += 74;
    }
    const ly = H - 250; round(ctx, 66, ly, W - 132, 190, 40); ctx.fillStyle = BLUE; ctx.fill();
    text(ctx, "Full recipe: link in bio", 110, ly + 80, F(900, 50), "#fff");
    ctx.font = F(700, 32); wrap(ctx, `chefmealan.com/r/${r.slug} · steps, nutrition, and how many fit your goal`, W - 220, 2).forEach((l, i) => text(ctx, l, 110, ly + 130 + i * 40, F(700, 32), "rgba(255,255,255,.92)"));
    out.push({ name: "4-pd-and-link.jpg", dataUrl: c.toDataURL("image/jpeg", 0.92) });
  }
  // the reel's last frame: the numbers, 9 × 16
  out.push({ name: "5-reel-end-card.jpg", dataUrl: await numbers(1080, 1920) });
  return out;
}
