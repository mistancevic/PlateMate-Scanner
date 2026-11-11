// 0.3.133: the picture in place of a photo that was not saved: a soft square with a crossed camera and the words, in the
// app's language
import { w } from "./words";
const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
export function notSavedPicture(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#e7eefb"/>` +
    `<g fill="none" stroke="#1f5fc7" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><path d="M62 72h18l10-14h20l10 14h18a8 8 0 0 1 8 8v48a8 8 0 0 1-8 8H62a8 8 0 0 1-8-8V80a8 8 0 0 1 8-8z"/><circle cx="100" cy="104" r="16"/><path d="M48 52l104 104"/></g>` +
    `<text x="100" y="172" font-family="Nunito, system-ui, sans-serif" font-size="17" font-weight="800" fill="#1f5fc7" text-anchor="middle">${esc(w("photos.notSaved"))}</text></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}
