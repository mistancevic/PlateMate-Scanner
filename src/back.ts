// Back works like an app (canvas board C5, Milan, 7 October 2026). The phone's Back, the browser's back arrow and
// Close each close only what is on top: a photo, then a food's card, then a sheet, then the tab you came from. Chef Mealan
// is left only from Today. The address follows the tab (chefmealan.com/foods), so a reload opens where you were; a sheet
// or a photo is not an address of its own.
//
// How: every open layer (a sheet, a card, the camera, a photo) adds one history entry and sits on a stack. Back pops the
// browser's entry, and we close the layer on top. A layer closed in the app (its Close button) takes its own entry back
// with history.back(); a new entry asked for while that is still on its way waits for it, so entries never cross.
import { useEffect, useRef } from "react";

const TAB_PATH: Record<string, string> = { home: "/today", journey: "/plate", plan: "/plan", recipes: "/my-recipes", foods: "/foods", me: "/me" };
export const pathOfTab = (tab: string) => TAB_PATH[tab] ?? `/${tab}`;
export function tabOfPath(path: string, tabs: readonly string[]): string | null {
  const hit = Object.entries(TAB_PATH).find(([, p]) => p === path)?.[0];
  if (hit) return hit;
  const t = path.replace(/^\//, "");
  return tabs.includes(t) && t !== "" ? t : null;
}

type Layer = { id: number; close: () => void };
const stack: Layer[] = [];
const waiting: { id: number; run: () => void }[] = [];
let seq = 0, goingBack = 0, installed = false;
let onTabBack: (tab: string | null) => void = () => {};
const can = () => typeof window !== "undefined" && typeof history !== "undefined";

function whenSettled(id: number, run: () => void) { if (goingBack > 0) waiting.push({ id, run }); else run(); }
function settle() { if (goingBack > 0) return; for (const w of waiting.splice(0)) w.run(); }

export function installBack(tabBack: (tab: string | null) => void) {
  onTabBack = tabBack;
  if (!can() || installed) return;
  installed = true;
  window.addEventListener("popstate", (e) => {
    if (goingBack > 0) { goingBack--; settle(); return; }
    const top = stack.pop();
    if (top) { top.close(); return; }
    onTabBack((e.state && typeof e.state.tab === "string") ? e.state.tab : null);
  });
}

// a tab the person moved to: its own entry, with its address
export function pushTab(tab: string) {
  if (!can()) return;
  const id = ++seq;
  whenSettled(id, () => { if (location.pathname !== pathOfTab(tab) || history.state?.tab !== tab) history.pushState({ tab }, "", pathOfTab(tab)); });
}
// the first entry: the tab the app opened on, at its address, without adding a step
export function startTab(tab: string) {
  if (!can()) return;
  history.replaceState({ tab }, "", pathOfTab(tab));
}

function openLayer(close: () => void): Layer {
  const L: Layer = { id: ++seq, close };
  whenSettled(L.id, () => { stack.push(L); history.pushState({ ...(history.state ?? {}), layer: L.id }, "", location.pathname); });
  return L;
}
function dropLayer(L: Layer) {
  const w = waiting.findIndex((x) => x.id === L.id);
  if (w >= 0) { waiting.splice(w, 1); return; }
  const i = stack.indexOf(L);
  if (i < 0) return;
  stack.splice(i, 1);
  goingBack++;
  history.back();
  // a step back that never arrives (the browser had nothing to go back to) must not hold the next ones forever
  window.setTimeout(() => { if (goingBack > 0) { goingBack = 0; settle(); } }, 800);
}

// A layer that Back closes: open says whether it shows, close is what Back does. Closing it in the app takes its step back.
export function useBack(open: boolean, close: () => void) {
  const layer = useRef<Layer | null>(null);
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!can()) return;
    if (open && !layer.current) layer.current = openLayer(() => { layer.current = null; closeRef.current(); });
    else if (!open && layer.current) { const L = layer.current; layer.current = null; dropLayer(L); }
  }, [open]);
  useEffect(() => () => { if (layer.current) { const L = layer.current; layer.current = null; dropLayer(L); } }, []);
}
